"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import {
  cn,
  shuffleArray,
  generateContextFromMessages,
  extractTopicsFromAnswers,
} from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { apiCreateFeedback, apiExtractInterviewFields, apiGenerateInterview } from "@/lib/api";
import { SpeakingQualityPanel } from "./SpeakingQualityPanel";
import { analyzeSpeechQuality, SpeechQuality } from "@/lib/speech-analyzer";
import { UserAvatar } from "./UserAvatar";
import { storage, db } from "@/firebase/client";
import { useVideoInterview } from "@/hooks/useVideoInterview";
import { useIntegrityTracker } from "@/hooks/useIntegrityTracker";
import {
  speakText,
  transcribeAudio,
  toDeepgramLanguageCode,
} from "@/lib/sarvam";
import type { CreateAssistantDTO } from "@vapi-ai/web/dist/api";
import type { AgentProps } from "@/types";

function formatVapiFailure(reason: unknown): string {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === "string") return reason;
  if (reason && typeof reason === "object") {
    const r = reason as Record<string, unknown>;

    // @vapi-ai/web HttpClient throws the whole `Response` object on non-2xx:
    // { ok, status, statusText, url, error, data, ... } where `error` is usually JSON from Vapi.
    const status = typeof r.status === "number" ? r.status : undefined;
    const statusText =
      typeof r.statusText === "string" ? r.statusText : undefined;

    const errorPayload = r.error;
    if (errorPayload && typeof errorPayload === "object") {
      const e = errorPayload as Record<string, unknown>;
      const msg = e.message ?? e.error ?? e.detail;
      if (typeof msg === "string") {
        return status
          ? `Vapi error ${status}${statusText ? ` ${statusText}` : ""}: ${msg}`
          : msg;
      }
    }
    if (typeof errorPayload === "string" && errorPayload.trim()) {
      return status
        ? `Vapi error ${status}${statusText ? ` ${statusText}` : ""}: ${errorPayload}`
        : errorPayload;
    }

    const message = r.message ?? r.detail;
    if (typeof message === "string") return message;

    try {
      const serialized = JSON.stringify(reason);
      if (serialized && serialized !== "{}") return serialized;
    } catch {
      // ignore
    }

    if (status) {
      return `Vapi request failed (${status}${statusText ? ` ${statusText}` : ""}) with no parseable error body.`;
    }
    return "Vapi request failed (no details).";
  }
  return "Vapi request failed.";
}

async function startVapiWithDiagnostics(
  assistant: Parameters<typeof vapi.start>[0],
  assistantOverrides?: Parameters<typeof vapi.start>[1],
  squad?: Parameters<typeof vapi.start>[2]
) {
  let lastError: unknown;

  const errorListener = (e: unknown) => {
    lastError = e;
  };

  vapi.on("error", errorListener);
  try {
    const t0 =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const call = await vapi.start(assistant, assistantOverrides, squad);
    const t1 =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    console.log(`vapi.start() resolved in ${Math.round(t1 - t0)}ms`);
    if (!call) {
      throw lastError ?? new Error("Vapi returned no web call.");
    }
    return call;
  } finally {
    vapi.off("error", errorListener);
  }
}

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

type InterviewLanguage = "kn-IN" | "hi-IN" | "en-IN";

type FaceBoxPx = { x: number; y: number; width: number; height: number };

function interviewLanguageBlock(code: InterviewLanguage): string {
  if (code === "kn-IN") {
    return `
INTERVIEW LANGUAGE (mandatory — candidate chose Kannada, kn-IN):
- Conduct the ENTIRE conversation in Kannada: every greeting, question, acknowledgement, and follow-up must be in Kannada.
- Use simple, everyday spoken Kannada (modern, not overly formal/archaic).
- Keep sentences short and natural for spoken conversation. Avoid rare/unclear words; if unsure, use simpler words.
- Output must be grammatically correct and easy to understand.
- If the question list in the prompt is in English, translate each question into Kannada when you ask it.`;
  }
  if (code === "hi-IN") {
    return `
INTERVIEW LANGUAGE (mandatory — candidate chose Hindi, hi-IN):
- Conduct the ENTIRE conversation in Hindi: every greeting, question, acknowledgement, and follow-up must be in Hindi.
- Use modern, conversational Hindi that people speak today (NOT overly formal/old-gen Hindi).
- Prefer Devanagari Hindi; Hinglish (mixing English) is encouraged for natural interviews.
- Keep sentences short and natural for spoken conversation. Avoid rare/unclear words; if unsure, use simpler words.
- Output must be grammatically correct and easy to understand.
- If the question list in the prompt is in English, translate each question into Hindi when you ask it.`;
  }
  return `
INTERVIEW LANGUAGE (mandatory — candidate chose English India, en-IN):
- Conduct the entire conversation in clear English suited to Indian candidates (en-IN).
- If the candidate mixes Hindi/Kannada, acknowledge briefly and continue in English unless they switch fully.`;
}

function localizedFirstMessage(
  userName: string,
  code: InterviewLanguage
): string {
  if (code === "kn-IN") {
    return `ನಮಸ್ಕಾರ ${userName}! ಇಂದು ಮಾತನಾಡಲು ಸಮಯ ಕೊಟ್ಟಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು. ನಿಮ್ಮ ಅನುಭವ ಮತ್ತು ಕೆಲಸದ ಬಗ್ಗೆ ಸ್ವಲ್ಪ ತಿಳಿದುಕೊಳ್ಳೋಣ.`;
  }
  if (code === "hi-IN") {
    return `नमस्ते ${userName}! आज बात करने के लिए धन्यवाद। चलिए शुरू करते हैं—आप अपने बारे में और अपने experience के बारे में थोड़ा बताइए।`;
  }
  return `Hello ${userName}! Thank you for taking the time to speak with me today. I'm excited to learn more about you and your experience.`;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
  language: languageProp = "en-IN",
  trade = "General",
  onInterviewComplete,
  completionRedirectPath,
  disableLanguageSelector = false,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");

  const [language, setLanguage] = useState<InterviewLanguage>(languageProp);
  const typeRef = useRef(type);
  const languageRef = useRef(language);
  const speakQueueRef = useRef<Promise<void>>(Promise.resolve());
  const isStartingCallRef = useRef(false);
  typeRef.current = type;
  languageRef.current = language;

  useEffect(() => {
    setLanguage(languageProp);
  }, [languageProp]);

  // Speech Quality Analysis State
  const [speechQuality, setSpeechQuality] = useState<SpeechQuality | null>(
    null
  );
  const [userTranscript, setUserTranscript] = useState<string>("");

  // Question Pool State for Randomized Interview
  const [shuffledQuestions, setShuffledQuestions] = useState<string[]>([]);
  const [askedQuestions, setAskedQuestions] = useState<Set<string>>(new Set());

  const {
    videoRef,
    startVideo,
    stopVideo,
    clearUtteranceChunks,
    flushUtteranceAudioBlob,
  } = useVideoInterview();

  function muteVapiRemotePlayback() {
    document.querySelectorAll("audio[data-participant-id]").forEach((el) => {
      const a = el as HTMLAudioElement;
      a.volume = 0;
      a.muted = true;
    });
  }

  function unmuteVapiRemotePlayback() {
    document.querySelectorAll("audio[data-participant-id]").forEach((el) => {
      const a = el as HTMLAudioElement;
      a.volume = 1;
      a.muted = false;
    });
  }

  function enqueueSpeak(text: string) {
    const lang = languageRef.current;
    speakQueueRef.current = speakQueueRef.current
      .then(async () => {
        // Drop recent mic chunks so we don't accidentally STT the assistant audio.
        clearUtteranceChunks();
        try {
          await speakText(text, lang);
        } catch (e) {
          // If Sarvam fails (quota, bad response, autoplay), fall back to Vapi's own audio.
          console.error("Sarvam TTS failed, falling back to Vapi audio:", e);
          unmuteVapiRemotePlayback();
        }
        window.setTimeout(() => clearUtteranceChunks(), 250);
      })
      .catch((err) => {
        console.error("Sarvam TTS queue:", err);
      });
  }

  const sttInFlightRef = useRef(false);
  const sttSpeakingRef = useRef(false);
  const sttLastVoiceAtRef = useRef<number | null>(null);
  const sttLastCommitAtRef = useRef<number>(0);

  useEffect(() => {
    if (type !== "interview" || callStatus !== CallStatus.ACTIVE) {
      return;
    }

    const stream = videoRef.current?.srcObject as MediaStream | null;
    if (!stream) {
      return;
    }
    const audioTracks = stream.getAudioTracks();
    if (!audioTracks.length) {
      return;
    }

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const src = ctx.createMediaStreamSource(new MediaStream([audioTracks[0]]));
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    src.connect(analyser);

    const data = new Uint8Array(analyser.fftSize);
    const SILENCE_MS = 900;
    const MIN_COMMIT_GAP_MS = 1200;
    const THRESHOLD = 12; // tuned for typical laptop mics (0-255 scale)

    const tick = async () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = data[i] - 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      const now = Date.now();

      if (rms > THRESHOLD) {
        sttSpeakingRef.current = true;
        sttLastVoiceAtRef.current = now;
        return;
      }

      const lastVoice = sttLastVoiceAtRef.current;
      if (!sttSpeakingRef.current || lastVoice == null) {
        return;
      }

      const silentFor = now - lastVoice;
      if (silentFor < SILENCE_MS) {
        return;
      }

      if (sttInFlightRef.current) {
        return;
      }

      if (now - sttLastCommitAtRef.current < MIN_COMMIT_GAP_MS) {
        return;
      }

      sttInFlightRef.current = true;
      sttSpeakingRef.current = false;
      sttLastCommitAtRef.current = now;

      try {
        const blob = await flushUtteranceAudioBlob();
        if (!blob || blob.size < 48) {
          return;
        }
        const text = (await transcribeAudio(blob, languageRef.current)).trim();
        if (!text) {
          return;
        }
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        if (wordCount < 2 && text.length < 12) {
          return;
        }

        setMessages((prev) => [...prev, { role: "user", content: text }]);
        setUserTranscript((prev) => {
          const updated = prev + (prev ? " " : "") + text;
          const analysis = analyzeSpeechQuality(updated);
          setSpeechQuality(analysis);
          return updated;
        });

        vapi.send({
          type: "add-message",
          message: { role: "user", content: text },
        });
      } catch (e) {
        console.error("Sarvam STT (silence detector):", e);
      } finally {
        sttInFlightRef.current = false;
      }
    };

    const id = window.setInterval(() => {
      void tick();
    }, 120);

    return () => {
      window.clearInterval(id);
      try {
        src.disconnect();
      } catch {
        // ignore
      }
      try {
        analyser.disconnect();
      } catch {
        // ignore
      }
      ctx.close().catch(() => {});
    };
  }, [type, callStatus, videoRef, flushUtteranceAudioBlob]);
  const faceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const { recordFrame, recordSnapshot, setFirstFrame, getIntegrityMetrics } =
    useIntegrityTracker();
  const lastFaceBoxRef = useRef<FaceBoxPx | null>(null);
  const snapshotCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const firstFrameCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const snapshotIntervalRef = useRef<number | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [canShowFaceBadge, setCanShowFaceBadge] = useState(false);

  useEffect(() => {
    if (callStatus !== CallStatus.ACTIVE || type !== "interview") {
      return;
    }
    startVideo().catch((err) => console.error("startVideo failed:", err));
  }, [callStatus, type, startVideo]);

  useEffect(() => {
    if (callStatus !== CallStatus.ACTIVE || type !== "interview") {
      setFaceDetected(false);
      setCanShowFaceBadge(false);
      return;
    }
    const t = window.setTimeout(() => setCanShowFaceBadge(true), 2000);
    return () => window.clearTimeout(t);
  }, [callStatus, type]);

  useEffect(() => {
    // Face detection strategy:
    // 1. Try browser-native FaceDetector API (Shape Detection API, Chrome 70+)
    // 2. Fall back to a skin-tone + contrast canvas heuristic
    // MediaPipe is NOT used because its WASM requires WebGL which crashes on
    // many setups with "Cannot read properties of undefined (reading 'createTexture')".
    if (callStatus !== CallStatus.ACTIVE || type !== "interview") {
      return;
    }

    let disposed = false;
    let detectInterval: number | null = null;
    let waitForVideoInterval: number | null = null;

    const ensureFirstFrameCanvas = () => {
      if (firstFrameCanvasRef.current) return firstFrameCanvasRef.current;
      if (typeof document === "undefined") return null;
      firstFrameCanvasRef.current = document.createElement("canvas");
      return firstFrameCanvasRef.current;
    };

    const captureFirstFrame = (video: HTMLVideoElement) => {
      try {
        if (!video.videoWidth || !video.videoHeight) return;
        const canvasEl = ensureFirstFrameCanvas();
        if (!canvasEl) return;
        const ctx = canvasEl.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        const box = lastFaceBoxRef.current;
        const w = box?.width && box.width > 0 ? Math.round(box.width) : 128;
        const h = box?.height && box.height > 0 ? Math.round(box.height) : 128;

        canvasEl.width = w;
        canvasEl.height = h;

        if (box) {
          ctx.drawImage(video, box.x, box.y, box.width, box.height, 0, 0, w, h);
        } else {
          const side = Math.min(video.videoWidth, video.videoHeight);
          const sx = Math.max(0, Math.floor((video.videoWidth - side) / 2));
          const sy = Math.max(0, Math.floor((video.videoHeight - side) / 2));
          ctx.drawImage(video, sx, sy, side, side, 0, 0, w, h);
        }

        const base64 = canvasEl.toDataURL("image/jpeg", 0.7);
        void setFirstFrame(base64);
      } catch {
        // ignore capture errors
      }
    };

    /** Improved heuristic: checks skin-tone pixel ratio + brightness variance. */
    const runCanvasHeuristic = (video: HTMLVideoElement) => {
      const canvas = faceCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      console.log("Face detection: using canvas skin-tone heuristic");

      const tick = () => {
        if (disposed || !video.videoWidth) return;
        const W = 64, H = 64;
        canvas.width = W;
        canvas.height = H;
        ctx.drawImage(video, 0, 0, W, H);
        const imgData = ctx.getImageData(0, 0, W, H).data;
        const totalPixels = W * H;

        let skinPixels = 0;
        let brightnessSum = 0;
        let brightnessSqSum = 0;

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i], g = imgData[i + 1], b = imgData[i + 2];
          const brightness = (r + g + b) / 3;
          brightnessSum += brightness;
          brightnessSqSum += brightness * brightness;

          // Skin-tone detection (works for a wide range of skin colors)
          if (
            r > 60 && g > 40 && b > 20 &&
            r > g && r > b &&
            (r - g) > 10 &&
            Math.abs(r - g) < 120 &&
            brightness > 50 && brightness < 230
          ) {
            skinPixels++;
          }
        }

        const skinRatio = skinPixels / totalPixels;
        const meanBrightness = brightnessSum / totalPixels;
        const variance = (brightnessSqSum / totalPixels) - (meanBrightness * meanBrightness);

        // Face likely if: >8% skin-tone pixels AND sufficient contrast (variance > 200)
        // AND not too dark overall
        const hasFace = skinRatio > 0.08 && variance > 200 && meanBrightness > 30;

        recordFrame(hasFace);
        if (hasFace) captureFirstFrame(video);
        setFaceDetected(hasFace);
      };

      detectInterval = window.setInterval(tick, 500);
    };

    const startDetection = (video: HTMLVideoElement) => {
      if (disposed) return;

      // Try native FaceDetector API (available in Chrome/Edge)
      const FaceDetectorClass = (window as any).FaceDetector;
      if (typeof FaceDetectorClass === "function") {
        console.log("Face detection: using native FaceDetector API");
        let detector: any;
        try {
          detector = new FaceDetectorClass({
            maxDetectedFaces: 1,
            fastMode: true,
          });
        } catch {
          console.warn("Face detection: FaceDetector constructor failed, using fallback");
          runCanvasHeuristic(video);
          return;
        }

        let inFlight = false;
        detectInterval = window.setInterval(async () => {
          if (disposed || inFlight || !video.videoWidth || video.readyState < 2) return;
          inFlight = true;
          try {
            const faces = await detector.detect(video);
            const hasFace = faces.length > 0;

            if (hasFace && faces[0].boundingBox) {
              const bb = faces[0].boundingBox;
              lastFaceBoxRef.current = {
                x: Math.max(0, Math.floor(bb.x)),
                y: Math.max(0, Math.floor(bb.y)),
                width: Math.max(1, Math.floor(bb.width)),
                height: Math.max(1, Math.floor(bb.height)),
              };
            }

            recordFrame(hasFace);
            if (hasFace) captureFirstFrame(video);
            setFaceDetected(hasFace);
          } catch {
            // ignore per-frame errors
          } finally {
            inFlight = false;
          }
        }, 500);
      } else {
        console.log("Face detection: FaceDetector API not available, using fallback");
        runCanvasHeuristic(video);
      }
    };

    // Wait for the video element to have actual data before starting detection.
    const checkAndStart = () => {
      const v = videoRef.current;
      if (v && v.readyState >= 2 && v.videoWidth > 0) {
        console.log("Face detection: video is ready, starting detection");
        if (waitForVideoInterval) {
          window.clearInterval(waitForVideoInterval);
          waitForVideoInterval = null;
        }
        startDetection(v);
        return true;
      }
      return false;
    };

    if (!checkAndStart()) {
      console.log("Face detection: waiting for video to be ready...");
      waitForVideoInterval = window.setInterval(() => {
        if (disposed) {
          if (waitForVideoInterval) window.clearInterval(waitForVideoInterval);
          return;
        }
        checkAndStart();
      }, 300);
    }

    return () => {
      disposed = true;
      if (waitForVideoInterval) window.clearInterval(waitForVideoInterval);
      if (detectInterval) window.clearInterval(detectInterval);
      setFaceDetected(false);
    };
  }, [callStatus, type, videoRef]);

  useEffect(() => {
    if (callStatus !== CallStatus.ACTIVE || type !== "interview") {
      if (snapshotIntervalRef.current) {
        window.clearInterval(snapshotIntervalRef.current);
        snapshotIntervalRef.current = null;
      }
      return;
    }

    const video = videoRef.current;

    const tick = () => {
      try {
        if (!video || !video.videoWidth || !video.videoHeight) return;

        if (!snapshotCanvasRef.current && typeof document !== "undefined") {
          snapshotCanvasRef.current = document.createElement("canvas");
        }
        const canvasEl = snapshotCanvasRef.current;
        if (!canvasEl) return;

        canvasEl.width = video.videoWidth;
        canvasEl.height = video.videoHeight;

        const ctx = canvasEl.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvasEl.width, canvasEl.height);

        const box = lastFaceBoxRef.current;

        let x = 0;
        let y = 0;
        let w = 0;
        let h = 0;

        if (box && box.width > 0 && box.height > 0) {
          x = box.x;
          y = box.y;
          w = box.width;
          h = box.height;
        } else {
          // Fallback: center crop sized to 40% of the shorter side.
          const side = Math.max(
            64,
            Math.floor(Math.min(video.videoWidth, video.videoHeight) * 0.4)
          );
          x = Math.max(0, Math.floor((video.videoWidth - side) / 2));
          y = Math.max(0, Math.floor((video.videoHeight - side) / 2));
          w = Math.min(side, video.videoWidth - x);
          h = Math.min(side, video.videoHeight - y);
        }

        // Clamp the crop to canvas bounds.
        x = Math.max(0, Math.min(canvasEl.width - 1, Math.floor(x)));
        y = Math.max(0, Math.min(canvasEl.height - 1, Math.floor(y)));
        w = Math.max(1, Math.min(canvasEl.width - x, Math.floor(w)));
        h = Math.max(1, Math.min(canvasEl.height - y, Math.floor(h)));

        const imageData = ctx.getImageData(x, y, w, h);
        recordSnapshot(imageData, { width: w, height: h });
      } catch {
        // ignore snapshot errors
      }
    };

    // First tick soon after activation, then every 10 seconds.
    const initial = window.setTimeout(() => tick(), 1500);
    snapshotIntervalRef.current = window.setInterval(tick, 10_000);

    return () => {
      window.clearTimeout(initial);
      if (snapshotIntervalRef.current) {
        window.clearInterval(snapshotIntervalRef.current);
        snapshotIntervalRef.current = null;
      }
    };
  }, [callStatus, type, videoRef, recordSnapshot]);

  useEffect(() => {
    const onCallStart = (...args: unknown[]) => {
      if (args.length) {
        console.log("call-start payload:", args);
      }
      setCallStatus(CallStatus.ACTIVE);
      if (typeRef.current === "interview") {
        speakQueueRef.current = Promise.resolve();
        muteVapiRemotePlayback();
        window.setTimeout(muteVapiRemotePlayback, 400);
        window.setTimeout(muteVapiRemotePlayback, 1200);
      }
    };

    const onCallEnd = (...args: unknown[]) => {
      // Daily (under Vapi) often includes an end reason here.
      if (args.length) {
        console.warn("call-end payload:", args);
      } else {
        console.warn("call-end (no payload)");
      }
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: Message) => {
      console.log("📨 VAPI MESSAGE:", {
        type: message.type,
        transcriptType:
          message.type === "transcript" ? message.transcriptType : undefined,
        role: message.type === "transcript" ? message.role : undefined,
        contentLength:
          message.type === "transcript"
            ? message.transcript?.length
            : undefined,
        content: message.type === "transcript" ? message.transcript : undefined,
      });

      if (message.type === "transcript") {
        const content = message.transcript?.trim();

        if (!content) {
          console.log("❌ Empty content, skipping");
          return;
        }

        if (typeRef.current === "interview") {
          // User STT is handled by Sarvam silence detector (works for kn/hi/en).
          if (message.role === "user") return;
          if (message.role === "assistant") {
            // Some setups may not emit a clean "final" transcript; buffer partials and
            // speak after a short quiet period as a fallback.
            if (!("__assistantBuffer" in window)) {
              (window as any).__assistantBuffer = { text: "", t: 0, timer: 0 };
            }
            const buf = (window as any).__assistantBuffer as {
              text: string;
              t: number;
              timer: number;
            };

            if (message.transcriptType === "partial") {
              buf.text = content;
              buf.t = Date.now();
              // Show partial immediately on the interview screen.
              setLastMessage(content);
              if (buf.timer) window.clearTimeout(buf.timer);
              buf.timer = window.setTimeout(() => {
                if (buf.text) {
                  console.log("✅ Capturing [assistant] buffered:", buf.text);
                  setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: buf.text },
                  ]);
                  enqueueSpeak(buf.text);
                  buf.text = "";
                }
              }, 900);
              return;
            }

            // final
            if (buf.timer) window.clearTimeout(buf.timer);
            buf.text = "";
            console.log(`✅ Capturing [assistant] final:`, content);
            setMessages((prev) => [...prev, { role: "assistant", content }]);
            enqueueSpeak(content);
            return;
          }
        }

        console.log(`✅ Capturing [${message.role}]:`, content);

        if (content.split(" ").length >= 2) {
          const newMessage = { role: message.role, content };
          setMessages((prev) => [...prev, newMessage]);

          if (message.role === "user") {
            setUserTranscript((prev) => {
              const updated = prev + (prev ? " " : "") + content;
              console.log("📝 User transcript updated:", updated);
              return updated;
            });
          }
        }

        if (message.role === "user") {
          setUserTranscript((prev) => {
            const analysis = analyzeSpeechQuality(prev);
            setSpeechQuality(analysis);
            return prev;
          });
        }
      }
    };

    const onSpeechStart = () => {
      console.log("speech start");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      console.log("speech end");
      setIsSpeaking(false);
    };

    const onError = (...args: unknown[]) => {
      // Vapi/Daily emits empty error objects on normal call teardown;
      // only log as error if there's meaningful content.
      const hasContent = args.some((a) => {
        if (!a || typeof a !== "object") return !!a;
        try { return Object.keys(a as object).length > 0; } catch { return false; }
      });
      if (hasContent) {
        console.error("Vapi error event:", ...args);
      } else {
        console.warn("Vapi error event (empty, likely normal call teardown)");
      }
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, [clearUtteranceChunks, flushUtteranceAudioBlob]);

  useEffect(() => {
    return () => {
      try {
        vapi.stop();
      } catch {
        // ignore cleanup errors
      }
    };
  }, []);

  // Suppress Daily.co "Meeting ended due to ejection" unhandled promise rejections.
  // This is a normal event when a Vapi call ends, not an error.
  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      const msg =
        typeof e.reason === "string"
          ? e.reason
          : e.reason?.message ?? e.reason?.msg ?? "";
      if (typeof msg === "string" && msg.includes("Meeting has ended")) {
        e.preventDefault();
        console.log("Daily.co meeting teardown (suppressed)");
      }
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      console.log("handleGenerateFeedback");

      const recordingBlob = await stopVideo();
      // NOTE: Video upload is intentionally disabled for now.
      // We still call stopVideo() for cleanup, but do not persist the recording.
      void recordingBlob;

      // Calculate final speech quality from all user messages
      const userMessages = messages
        .filter((msg) => msg.role === "user")
        .map((msg) => msg.content)
        .join(" ");

      const finalSpeechQuality = analyzeSpeechQuality(userMessages);

      const integrityMetrics = getIntegrityMetrics();

      if (onInterviewComplete) {
        await onInterviewComplete({
          transcript: messages,
          speechQuality: finalSpeechQuality,
          integrityMetrics,
        });
        router.push(completionRedirectPath || "/admin/login");
        return;
      }

      const { success, feedbackId: id } = await apiCreateFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript: messages,
        feedbackId,
        speechQuality: finalSpeechQuality,
        trade,
        language: languageRef.current,
        integrityMetrics,
      });

      if (success && id) {
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        console.log("Error saving feedback");
        router.push("/");
      }
    };

    // New: For 'generate' type, extract answers and create interview
    const handleCreateInterviewFromVoice = async (messages: SavedMessage[]) => {
      // Combine all user messages into one string
      const transcript = messages
        .filter((msg) => msg.role === "user")
        .map((msg) => msg.content)
        .join("\n");

      // Use Gemini to extract the fields from the transcript
      try {
        const data = await apiExtractInterviewFields(transcript);
        if (!data.success || !data.fields) {
          alert(
            "Could not extract all required fields from your answers. Please try again or use the form."
          );
          return;
        }
        const { role, level, techstack, type, amount } = data.fields;
        if (!role || !techstack) {
          alert(
            "Could not extract all required fields from your answers. Please try again or use the form."
          );
          return;
        }
        // Call the API to create the interview
        const createData = await apiGenerateInterview({
          role,
          level,
          techstack,
          type,
          amount,
          userid: userId!,
        } as any);
        if (createData.success) {
          alert("Interview created successfully!");
          router.push("/");
        } else {
          alert("Failed to create interview.");
        }
      } catch (err) {
        alert("An error occurred while creating the interview.");
      }
    };

    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        handleCreateInterviewFromVoice(messages);
      } else {
        handleGenerateFeedback(messages);
      }
    }
  }, [
    messages,
    callStatus,
    feedbackId,
    interviewId,
    router,
    type,
    userId,
    stopVideo,
  ]);

  const handleCall = async () => {
    // Prevent duplicate starts while already connecting/active.
    if (
      isStartingCallRef.current ||
      callStatus === CallStatus.CONNECTING ||
      callStatus === CallStatus.ACTIVE
    ) {
      return;
    }

    // Optimistically start camera/mic immediately so the user sees preview
    // while the Vapi call is connecting.
    if (typeRef.current === "interview") {
      try {
        await startVideo();
      } catch (e) {
        console.warn("startVideo failed (pre-call):", e);
      }
    }

    // Daily/Vapi media APIs require a secure context on mobile/browser.
    // localhost is treated as secure, LAN http://192.168.x.x is not.
    if (
      typeof window !== "undefined" &&
      !window.isSecureContext &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      alert(
        "Microphone/camera access is blocked on insecure HTTP. Open this app via HTTPS tunnel (ngrok/cloudflared) or localhost."
      );
      return;
    }

    isStartingCallRef.current = true;
    setCallStatus(CallStatus.CONNECTING);

    try {
      vapi.stop();
    } catch {
      // ignore stale-session cleanup errors
    }

    if (type === "generate") {
      // Create a simple assistant for interview generation
      const generateAssistantConfig = {
        name: "Skill Screening Generator",
        firstMessage: `Hello ${userName}! I'm here to help you create a skill screening assessment. Let me ask you a few questions to set up your trade-based interview.`,
        transcriber: {
          provider: "deepgram" as const,
          model: "nova-2" as const,
          language: "en",
        },
        voice: {
          provider: "11labs" as const,
          voiceId: "sarah",
          stability: 0.4,
          similarityBoost: 0.8,
          speed: 0.9,
          style: 0.5,
          useSpeakerBoost: true,
        },
        model: {
          provider: "openai" as const,
          model: "gpt-4" as const,
          messages: [
            {
              role: "system",
              content: `You are an AI assistant helping to create a new skill screening assessment. Your goal is to gather information from the user to create a customized interview for blue-collar trades.

User Information:
- Name: ${userName}
- User ID: ${userId}

Your task:
1. Ask the user what trade they want to interview for (e.g., Electrician, Plumber, Welder, Mason, Helper)
2. Ask about their years of experience
3. Ask about their specialization or specific skills (e.g., Wiring, Plumbing Installation, Welding Techniques)
4. Ask about their preferred location or district
5. Ask about the language they prefer (English, Hindi, Kannada)

Guidelines:
- Be conversational and friendly
- Ask one question at a time
- Wait for the user's response before asking the next question
- Be helpful and provide suggestions if needed
- Keep responses concise and clear

Available trades: Electrician, Plumber, Welder, Mason, Helper

Once you have all the information, thank the user and let them know their skill screening assessment will be created.`,
            },
          ],
        },
      } satisfies CreateAssistantDTO;

      try {
        await startVapiWithDiagnostics(generateAssistantConfig);
      } catch (err) {
        console.error("Vapi start failed (generate):", err);
        alert(formatVapiFailure(err));
        setCallStatus(CallStatus.INACTIVE);
      } finally {
        isStartingCallRef.current = false;
      }
    } else {
      // Initialize question pool with shuffle for randomized interview flow
      if (questions && questions.length > 0) {
        const shuffled = shuffleArray<string>(questions);
        setShuffledQuestions(shuffled);
      }

      let formattedQuestions = "";
      if (questions) {
        formattedQuestions = questions
          .map((question: string) => `- ${question}`)
          .join("\n");
      }

      const priorAnswerContext = generateContextFromMessages(messages);
      const topicHints = extractTopicsFromAnswers(messages);
      const interviewerModelMessage = interviewer.model?.messages?.[0]?.content;

      const baseSystem = (interviewerModelMessage ?? "").replace(
        "{{questions}}",
        formattedQuestions.trim() || "- (No questions list was provided.)"
      );

      const assistantConfig = {
        firstMessage: localizedFirstMessage(userName, language),
        transcriber: {
          provider: "deepgram" as const,
          model: "nova-2" as const,
          language: toDeepgramLanguageCode(
            language
          ) as CreateAssistantDTO["transcriber"] extends
            | { language?: infer L }
            | undefined
            ? L
            : string,
        },
        voice: {
          provider: "11labs" as const,
          voiceId: "sarah",
          stability: 0.4,
          similarityBoost: 0.8,
          speed: 0.9,
          style: 0.5,
          useSpeakerBoost: true,
        },
        model: {
          provider: "openai" as const,
          model: "gpt-4" as const,
          messages: [
            {
              role: "system" as const,
              content: `${baseSystem}

${interviewLanguageBlock(language)}

Prior conversation context (if any) before this call started:
${priorAnswerContext || "(none)"}

Topic hints from prior answers:
${topicHints || "(none)"}

IMPORTANT - Randomized Question Flow:
1. Ask questions in a random order when it feels natural, not strictly top-to-bottom
2. Mix predefined questions with short follow-ups
3. Reference the candidate's previous answers when relevant`,
            },
          ],
        },
      } as CreateAssistantDTO;

      try {
        await startVapiWithDiagnostics(assistantConfig);
      } catch (err) {
        console.error("Vapi start failed (interview):", err);
        alert(formatVapiFailure(err));
        setCallStatus(CallStatus.INACTIVE);
      } finally {
        isStartingCallRef.current = false;
      }
    }
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    try {
      vapi.stop();
    } catch {
      // Daily.co throws "Meeting ended due to ejection" on normal teardown
    }
  };

  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div
            className={cn(
              "card-content relative",
              type === "interview" &&
                callStatus === CallStatus.ACTIVE &&
                "justify-start"
            )}
          >
            {type === "interview" && callStatus === CallStatus.ACTIVE && (
              <>
                <div className="relative w-full flex-1 overflow-hidden rounded-2xl border border-dark-300 bg-black">
                  <video
                    ref={videoRef}
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ transform: "scaleX(-1) translateZ(0)" }}
                    autoPlay
                    muted
                    playsInline
                  />
                  <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                    ● REC
                  </span>
                  <span
                    className={cn(
                      "absolute right-2 top-2 rounded px-2 py-0.5 text-xs font-semibold text-white",
                      !canShowFaceBadge
                        ? "bg-dark-200/80"
                        : faceDetected
                          ? "bg-green-600"
                          : "bg-red-600"
                    )}
                  >
                    {!canShowFaceBadge
                      ? "Face …"
                      : faceDetected
                        ? "Face ✓"
                        : "Face ✗"}
                  </span>

                  <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-full bg-dark-200/80 px-2.5 py-1.5 text-xs text-light-100 backdrop-blur">
                    <UserAvatar name={userName} size="small" />
                    <span className="max-w-[180px] truncate font-semibold">
                      {userName}
                    </span>
                  </div>
                </div>
                <canvas
                  ref={faceCanvasRef}
                  width={64}
                  height={64}
                  className="pointer-events-none absolute h-px w-px opacity-0"
                  aria-hidden
                />
              </>
            )}
            {!(type === "interview" && callStatus === CallStatus.ACTIVE) && (
              <>
                <UserAvatar name={userName} size="large" />
                <h3>{userName}</h3>
              </>
            )}
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      {/* Speaking Quality Panel - Real-time Analysis */}
      <SpeakingQualityPanel
        isActive={callStatus === CallStatus.ACTIVE && type === "interview"}
        speechQuality={speechQuality}
        currentTranscript={lastMessage}
        isSpeaking={isSpeaking}
        allMessages={messages}
      />

      {type === "interview" && !disableLanguageSelector && (
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2 text-sm text-gray-300">
          <label htmlFor="interview-language">Interview language</label>
          <select
            id="interview-language"
            className="rounded border border-dark-300 bg-dark-200 px-2 py-1 text-light-100"
            value={language}
            onChange={(e) => setLanguage(e.target.value as InterviewLanguage)}
            disabled={
              callStatus !== CallStatus.INACTIVE &&
              callStatus !== CallStatus.FINISHED
            }
          >
            <option value="en-IN">English (India)</option>
            <option value="hi-IN">Hindi</option>
            <option value="kn-IN">Kannada</option>
          </select>
        </div>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== "ACTIVE" ? (
          <button
            className="relative btn-call disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={() => handleCall()}
            disabled={callStatus === CallStatus.CONNECTING}
          >
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== "CONNECTING" && "hidden"
              )}
            />

            <span className="relative">
              {callStatus === "INACTIVE" || callStatus === "FINISHED"
                ? "Call"
                : ". . ."}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={() => handleDisconnect()}>
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
