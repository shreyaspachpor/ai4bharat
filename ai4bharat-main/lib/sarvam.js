/** Sarvam AI client (browser). https://api.sarvam.ai */

const SARVAM_BASE = "https://api.sarvam.ai";

function getSubscriptionKey() {
  const key = process.env.NEXT_PUBLIC_SARVAM_API_KEY;
  if (!key) {
    throw new Error("NEXT_PUBLIC_SARVAM_API_KEY is not set in .env.local");
  }
  return key;
}

/**
 * Map interview UI language to Deepgram `language` on the Vapi assistant (turn detection / fallback STT).
 * @param {string} language kn-IN | hi-IN | en-IN
 * @returns {string}
 */
export function toDeepgramLanguageCode(language) {
  if (language === "hi-IN") return "hi";
  // Deepgram nova-2 in Vapi does not reliably support Kannada. We only need Vapi's
  // transcriber for turn-taking; Sarvam handles actual STT for Kannada.
  if (language === "kn-IN") return "multi";
  return "en-IN";
}

/**
 * @param {Blob} audioBlob
 * @param {string} [language='kn-IN']
 * @returns {Promise<string>}
 */
export async function transcribeAudio(audioBlob, language = "kn-IN") {
  const form = new FormData();
  form.append("file", audioBlob, "audio.webm");
  form.append("model", "saaras:v1");
  form.append("language_code", language);

  const res = await fetch(`${SARVAM_BASE}/speech-to-text`, {
    method: "POST",
    headers: {
      "api-subscription-key": getSubscriptionKey(),
    },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Sarvam speech-to-text failed (${res.status}): ${detail}`);
  }

  const data = await res.json();
  const transcript = data.transcript;
  if (transcript == null) {
    return "";
  }
  return typeof transcript === "string" ? transcript : String(transcript);
}

/**
 * @param {string} text
 * @param {string} [language='kn-IN']
 * @returns {Promise<void>} resolves when playback finishes
 */
export function speakText(text, language = "kn-IN", opts = {}) {
  if (!text?.trim()) {
    return Promise.resolve();
  }

  return (async () => {
    // Pick voices that tend to sound natural per language.
    // (Sarvam speakers are shared across languages, but some sound better for specific ones.)
    const speaker =
      language === "hi-IN" ? "Ashutosh" : language === "kn-IN" ? "sumit" : "shubh";
    const pace = language === "en-IN" ? 1.0 : 1.05;

    const res = await fetch(`${SARVAM_BASE}/text-to-speech`, {
      method: "POST",
      headers: {
        "api-subscription-key": getSubscriptionKey(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        target_language_code: language,
        speaker,
        model: "bulbul:v3",
        // mp3 is smaller than wav -> lower latency to first audio.
        output_audio_codec: "mp3",
        pace,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Sarvam text-to-speech failed (${res.status}): ${detail}`);
    }

    const data = await res.json();
    const b64 = data.audios?.[0];
    if (!b64 || typeof b64 !== "string") {
      throw new Error("Sarvam TTS: missing audios[0] in response");
    }

    const cleanB64 = b64.includes(",") ? b64.slice(b64.indexOf(",") + 1) : b64;
    const binary = atob(cleanB64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);

    await new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audio.preload = "auto";
      audio.onplaying = () => {
        try {
          opts?.onStart?.();
        } catch {
          // ignore
        }
      };
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Audio playback failed"));
      };
      audio.play().catch((err) => {
        URL.revokeObjectURL(url);
        reject(err);
      });
    });
  })();
}
