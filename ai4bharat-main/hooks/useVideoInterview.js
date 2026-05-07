"use client";

import { useRef, useCallback } from "react";

const PREFERRED_MIME = "video/webm;codecs=vp8,opus";

function pickAudioMimeType() {
  const candidates = ["audio/webm;codecs=opus", "audio/webm"];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return "";
}

/**
 * @returns {{
 *   videoRef: import("react").MutableRefObject<HTMLVideoElement | null>,
 *   startVideo: () => Promise<void>,
 *   stopVideo: () => Promise<Blob>,
 *   clearUtteranceChunks: () => void,
 *   flushUtteranceAudioBlob: () => Promise<Blob>,
 * }}
 */
export function useVideoInterview() {
  const videoRef = useRef(/** @type {HTMLVideoElement | null} */ (null));
  const streamRef = useRef(/** @type {MediaStream | null} */ (null));
  const recorderRef = useRef(/** @type {MediaRecorder | null} */ (null));
  const chunksRef = useRef(/** @type {Blob[]} */ ([]));
  const stoppedRef = useRef(true);

  const audioOnlyRef = useRef(false);

  const utteranceChunksRef = useRef(/** @type {Blob[]} */ ([]));
  const utteranceRecorderRef = useRef(
    /** @type {MediaRecorder | null} */ (null)
  );
  const utteranceMimeRef = useRef("audio/webm");

  const startVideo = useCallback(async () => {
    if (
      typeof window === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      return;
    }
    if (streamRef.current) {
      // Stream already exists – just make sure it's wired to the <video> element
      // (which may not have been in the DOM on the first call).
      const el = videoRef.current;
      if (el && el.srcObject !== streamRef.current) {
        el.srcObject = streamRef.current;
        el.muted = true;
        el.setAttribute("playsinline", "");
        try {
          await el.play();
        } catch {
          // autoplay policies
        }
      }
      return;
    }

    stoppedRef.current = false;

    // Prefer a single combined permission prompt for speed.
    // If camera fails (device busy/denied), fall back to audio-only so STT still works.
    audioOnlyRef.current = false;

    /** @type {MediaStream | null} */
    let stream = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 320 },
          height: { ideal: 240 },
          frameRate: { ideal: 24, max: 30 },
        },
        audio: true,
      });
    } catch (err) {
      console.warn(
        "getUserMedia(audio+video) failed; retrying audio-only then video-only:",
        err
      );

      // Audio is mandatory for your interview flow; fail if mic cannot start.
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      let videoStream = null;
      try {
        videoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 320 },
            height: { ideal: 240 },
            frameRate: { ideal: 24, max: 30 },
          },
          audio: false,
        });
      } catch (videoErr) {
        console.warn(
          "getUserMedia(video) failed; continuing with audio-only:",
          videoErr
        );
        audioOnlyRef.current = true;
        videoStream = null;
      }

      const tracks = [
        ...audioStream.getAudioTracks(),
        ...(videoStream ? videoStream.getVideoTracks() : []),
      ];
      stream = new MediaStream(tracks);
    }

    streamRef.current = stream;

    const el = videoRef.current;
    if (el) {
      // Always attach the stream so other logic can read audio tracks
      // from videoRef.current.srcObject (even if video permission is denied).
      el.srcObject = stream;
      el.muted = true;
      el.setAttribute("playsinline", "");
      try {
        await el.play();
      } catch {
        // autoplay policies
      }
    }

    const hasVideo = stream.getVideoTracks().length > 0;
    const mimeType = hasVideo
      ? MediaRecorder.isTypeSupported(PREFERRED_MIME)
        ? PREFERRED_MIME
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : ""
      : pickAudioMimeType();

    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.start(1000);
    recorderRef.current = recorder;

    const onlyAudioTracks = stream.getAudioTracks();
    if (onlyAudioTracks.length > 0) {
      const utteranceStream = new MediaStream(onlyAudioTracks);
      const aMime = pickAudioMimeType();
      utteranceMimeRef.current = aMime || "audio/webm";
      const utterRecorder = aMime
        ? new MediaRecorder(utteranceStream, { mimeType: aMime })
        : new MediaRecorder(utteranceStream);

      utteranceChunksRef.current = [];
      utterRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          utteranceChunksRef.current.push(e.data);
        }
      };
      utterRecorder.start(400);
      utteranceRecorderRef.current = utterRecorder;
    }
  }, []);

  /** Drop mic-audio chunks (e.g. after assistant speaks) so the next flush is mostly the candidate. */
  const clearUtteranceChunks = useCallback(() => {
    utteranceChunksRef.current = [];
  }, []);

  /**
   * After Vapi user final transcript: wait briefly for trailing audio, then slice & clear chunks.
   * @returns {Promise<Blob>}
   */
  const flushUtteranceAudioBlob = useCallback(() => {
    return new Promise((resolve) => {
      const mime =
        utteranceRecorderRef.current?.mimeType || utteranceMimeRef.current;
      window.setTimeout(() => {
        const parts = utteranceChunksRef.current.splice(
          0,
          utteranceChunksRef.current.length
        );
        resolve(new Blob(parts, { type: mime || "audio/webm" }));
      }, 350);
    });
  }, []);

  const stopVideo = useCallback(() => {
    return new Promise((resolve) => {
      const stopUtteranceRecorder = () => {
        const ar = utteranceRecorderRef.current;
        utteranceRecorderRef.current = null;
        if (ar && ar.state !== "inactive") {
          try {
            ar.stop();
          } catch {
            // ignore
          }
        }
      };

      const finalize = (blob) => {
        stopUtteranceRecorder();
        const stream = streamRef.current;
        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        streamRef.current = null;
        recorderRef.current = null;
        chunksRef.current = [];
        utteranceChunksRef.current = [];
        resolve(blob);
      };

      if (stoppedRef.current) {
        finalize(new Blob([], { type: "video/webm" }));
        return;
      }

      stoppedRef.current = true;

      const recorder = recorderRef.current;

      if (!recorder) {
        finalize(new Blob([], { type: "video/webm" }));
        return;
      }

      const blobType = recorder.mimeType || "video/webm";

      if (recorder.state === "inactive") {
        const blob = new Blob(chunksRef.current, { type: blobType });
        finalize(blob);
        return;
      }

      recorder.addEventListener(
        "stop",
        () => {
          const blob = new Blob(chunksRef.current, { type: blobType });
          finalize(blob);
        },
        { once: true }
      );

      try {
        recorder.stop();
      } catch {
        finalize(new Blob([], { type: blobType }));
      }
    });
  }, []);

  return {
    videoRef,
    startVideo,
    stopVideo,
    clearUtteranceChunks,
    flushUtteranceAudioBlob,
  };
}
