"use client";

import { useCallback, useRef } from "react";

export type AbsenceCluster =
  | "start"
  | "middle"
  | "end"
  | "distributed"
  | "none";

export type IntegrityMetrics = {
  facePresenceScore: number; // 0-100
  faceAbsenceEvents: number;
  longestAbsenceDuration: number; // seconds
  absenceCluster: AbsenceCluster;
  continuityAnomalyFlag: boolean;
  continuityAnomalyReason: string | null;
  perceptualHash: string | null;
  integrityFlag: boolean;
  integrityReason: string | null;
};

export type BoundingBox = {
  width: number;
  height: number;
};

type ContinuityBaseline = {
  brightness: number;
  aspectRatio: number;
};

function nowMs(): number {
  // Prefer monotonic time for duration calculations.
  if (
    typeof performance !== "undefined" &&
    typeof performance.now === "function"
  ) {
    return performance.now();
  }
  return Date.now();
}

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function averageBrightness(imageData: ImageData): number {
  const data = imageData.data;
  if (data.length === 0) return 0;

  let sum = 0;
  // RGBA
  for (let i = 0; i < data.length; i += 4) {
    sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
  }
  return sum / (data.length / 4);
}

function safeAspectRatio(box: BoundingBox): number {
  const h = box.height;
  const w = box.width;
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return 0;
  return w / h;
}

function computeAbsenceCluster(
  eventOffsetsMs: number[],
  sessionDurationMs: number
): AbsenceCluster {
  const total = eventOffsetsMs.length;
  if (total === 0) return "none";

  const durationMs = Math.max(1, sessionDurationMs);
  const third = durationMs / 3;

  let start = 0;
  let middle = 0;
  let end = 0;

  for (const offset of eventOffsetsMs) {
    const t = Math.max(0, Math.min(durationMs, offset));
    if (t < third) start += 1;
    else if (t < 2 * third) middle += 1;
    else end += 1;
  }

  const max = Math.max(start, middle, end);
  const maxThird: AbsenceCluster =
    max === start ? "start" : max === middle ? "middle" : "end";

  // Consider it clustered if a clear majority of events fall into one third.
  const ratio = max / total;
  if (ratio >= 0.6) return maxThird;

  // If not clustered, treat as distributed.
  return "distributed";
}

async function computePerceptualHash64(base64: string): Promise<string | null> {
  if (typeof document === "undefined") return null;
  if (!base64) return null;

  // Use aHash (average hash): 8x8 grayscale, compare each pixel to average.
  const img = new Image();
  // Avoid tainting canvas if the input happens to be a URL.
  img.crossOrigin = "anonymous";

  const decoded = await new Promise<HTMLImageElement>((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error("Failed to decode image for perceptual hash"));
    img.src = base64;
  }).catch(() => null);

  if (!decoded) return null;

  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 8;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.clearRect(0, 0, 8, 8);
  ctx.drawImage(decoded, 0, 0, 8, 8);
  const { data } = ctx.getImageData(0, 0, 8, 8);

  const grays: number[] = [];
  grays.length = 64;

  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
    grays[i / 4] = gray;
    sum += gray;
  }

  const avg = sum / 64;
  let bits = "";
  for (let i = 0; i < 64; i += 1) {
    bits += grays[i] >= avg ? "1" : "0";
  }

  return bits.length === 64 ? bits : null;
}

export function useIntegrityTracker() {
  // Frame-level tracking
  const sessionStartMsRef = useRef<number | null>(null);
  const totalFramesRef = useRef(0);
  const faceDetectedFramesRef = useRef(0);

  const lastFaceDetectedRef = useRef<boolean | null>(null);

  // Absence events & durations
  const absenceEventsRef = useRef(0);
  const absenceStartMsRef = useRef<number | null>(null);
  const longestAbsenceSecRef = useRef(0);
  const absenceEventOffsetsMsRef = useRef<number[]>([]);

  // Continuity baseline + anomaly flag
  const continuityBaselineRef = useRef<ContinuityBaseline | null>(null);
  const continuityAnomalyFlagRef = useRef(false);
  const continuityAnomalyReasonRef = useRef<string | null>(null);

  // Perceptual hash
  const perceptualHashRef = useRef<string | null>(null);
  const firstFrameSetRef = useRef(false);

  const recordFrame = useCallback((faceDetected: boolean) => {
    const t = nowMs();

    if (sessionStartMsRef.current === null) {
      sessionStartMsRef.current = t;
    }

    totalFramesRef.current += 1;
    if (faceDetected) faceDetectedFramesRef.current += 1;

    const last = lastFaceDetectedRef.current;

    // Initialize absence timing if we start in an absent state (no event counted).
    if (last === null) {
      lastFaceDetectedRef.current = faceDetected;
      if (!faceDetected && absenceStartMsRef.current === null) {
        absenceStartMsRef.current = t;
      }
      return;
    }

    // Transition: present -> absent
    if (last === true && faceDetected === false) {
      absenceEventsRef.current += 1;
      const start = sessionStartMsRef.current ?? t;
      absenceEventOffsetsMsRef.current.push(t - start);
      absenceStartMsRef.current = t;
    }

    // Transition: absent -> present (close an absence window)
    if (last === false && faceDetected === true) {
      if (absenceStartMsRef.current !== null) {
        const absenceSec = (t - absenceStartMsRef.current) / 1000;
        if (absenceSec > longestAbsenceSecRef.current) {
          longestAbsenceSecRef.current = absenceSec;
        }
      }
      absenceStartMsRef.current = null;
    }

    // Continuous absent tracking (handles long absences without a transition until the end)
    if (last === false && faceDetected === false) {
      if (absenceStartMsRef.current === null) {
        absenceStartMsRef.current = t;
      }
    }

    lastFaceDetectedRef.current = faceDetected;
  }, []);

  const recordSnapshot = useCallback(
    (imageData: ImageData, boundingBox: BoundingBox) => {
      if (continuityAnomalyFlagRef.current) return;

      const brightness = averageBrightness(imageData);
      const aspectRatio = safeAspectRatio(boundingBox);

      if (continuityBaselineRef.current === null) {
        continuityBaselineRef.current = { brightness, aspectRatio };
        return;
      }

      const baseline = continuityBaselineRef.current;

      const brightnessShift = Math.abs(brightness - baseline.brightness);
      const aspectShiftRatio =
        baseline.aspectRatio > 0
          ? Math.abs(aspectRatio / baseline.aspectRatio - 1)
          : 0;

      if (brightnessShift > 30) {
        continuityAnomalyFlagRef.current = true;
        continuityAnomalyReasonRef.current = `Brightness shifted by ${Math.round(brightnessShift)} (baseline ${Math.round(baseline.brightness)} → ${Math.round(brightness)})`; // human-readable
        return;
      }

      if (aspectShiftRatio > 0.4) {
        continuityAnomalyFlagRef.current = true;
        continuityAnomalyReasonRef.current = `Face box aspect ratio shifted by ${Math.round(aspectShiftRatio * 100)}% (baseline ${baseline.aspectRatio.toFixed(2)} → ${aspectRatio.toFixed(2)})`;
        return;
      }
    },
    []
  );

  const setFirstFrame = useCallback(async (base64: string) => {
    if (firstFrameSetRef.current) return perceptualHashRef.current;
    firstFrameSetRef.current = true;

    const hash = await computePerceptualHash64(base64);
    perceptualHashRef.current = hash;
    return hash;
  }, []);

  const getIntegrityMetrics = useCallback((): IntegrityMetrics => {
    const endMs = nowMs();
    const startMs = sessionStartMsRef.current ?? endMs;
    const sessionDurationMs = Math.max(0, endMs - startMs);

    // If the session ends while face is absent, close that absence window at end.
    if (absenceStartMsRef.current !== null) {
      const absenceSec = (endMs - absenceStartMsRef.current) / 1000;
      if (absenceSec > longestAbsenceSecRef.current) {
        longestAbsenceSecRef.current = absenceSec;
      }
    }

    const totalFrames = totalFramesRef.current;
    const faceFrames = faceDetectedFramesRef.current;
    const presence = totalFrames > 0 ? faceFrames / totalFrames : 0;
    const facePresenceScore = Math.round(clamp01(presence) * 100);

    const faceAbsenceEvents = absenceEventsRef.current;
    const longestAbsenceDuration =
      Math.round(longestAbsenceSecRef.current * 100) / 100;

    const absenceCluster = computeAbsenceCluster(
      absenceEventOffsetsMsRef.current,
      sessionDurationMs
    );

    const continuityAnomalyFlag = continuityAnomalyFlagRef.current;
    const continuityAnomalyReason = continuityAnomalyReasonRef.current;

    const perceptualHash = perceptualHashRef.current;

    const integrityFlag =
      facePresenceScore < 70 || faceAbsenceEvents > 5 || continuityAnomalyFlag;

    let integrityReason: string | null = null;
    if (integrityFlag) {
      const reasons: string[] = [];
      if (facePresenceScore < 70) reasons.push("Face presence score below 70");
      if (faceAbsenceEvents > 5) reasons.push("Face absence events exceeded 5");
      if (continuityAnomalyFlag && continuityAnomalyReason)
        reasons.push(`Continuity anomaly: ${continuityAnomalyReason}`);
      if (reasons.length === 0) reasons.push("Integrity flagged");
      integrityReason = reasons.join("; ");
    }

    return {
      facePresenceScore,
      faceAbsenceEvents,
      longestAbsenceDuration,
      absenceCluster,
      continuityAnomalyFlag,
      continuityAnomalyReason: continuityAnomalyFlag
        ? continuityAnomalyReason
        : null,
      perceptualHash,
      integrityFlag,
      integrityReason,
    };
  }, []);

  return {
    recordFrame,
    recordSnapshot,
    setFirstFrame,
    getIntegrityMetrics,
  };
}
