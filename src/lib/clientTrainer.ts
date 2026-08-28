import { getDeviceId } from "./device";
import { fnv1a, hashToHex } from "./luau/text";

/** أعلام محفوظة — تجعل وضع العقدة والزاحف يعيشان عبر كل الصفحات */
export const FLAGS = {
  node: "luau-node-mode",
  crawl: "luau-auto-crawl",
} as const;

export function readFlag(key: keyof typeof FLAGS): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(FLAGS[key]) === "1";
}

export function setFlag(key: keyof typeof FLAGS, on: boolean) {
  if (typeof window === "undefined") return;
  if (on) localStorage.setItem(FLAGS[key], "1");
  else localStorage.removeItem(FLAGS[key]);
  window.dispatchEvent(new CustomEvent("luau-flags-changed"));
}

/** عدادات العقدة لهذا الجهاز */
export function bumpNodeCounters(tokens: number) {
  const sessions = Number(localStorage.getItem("luau-node-sessions") ?? 0) + 1;
  const total = Number(localStorage.getItem("luau-node-tokens") ?? 0) + tokens;
  localStorage.setItem("luau-node-sessions", String(sessions));
  localStorage.setItem("luau-node-tokens", String(total));
  window.dispatchEvent(
    new CustomEvent("luau-node-stats", { detail: { sessions, tokens: total } })
  );
  return { sessions, tokens: total };
}

export function readNodeCounters() {
  if (typeof window === "undefined") return { sessions: 0, tokens: 0 };
  return {
    sessions: Number(localStorage.getItem("luau-node-sessions") ?? 0),
    tokens: Number(localStorage.getItem("luau-node-tokens") ?? 0),
  };
}

let materialCache: string | null = null;

export async function loadMaterialCached(): Promise<string> {
  if (materialCache) return materialCache;
  const response = await fetch("/api/train/material");
  const data = (await response.json()) as { material: string };
  materialCache = data.material;
  return data.material;
}

/**
 * جلسة تدريب محلية خفيفة على جهاز الزائر:
 * تقطيع + خريطة تكرارات + بصمة FNV-1a متدحرجة.
 */
export async function runLocalTraining(
  material: string,
  maxTokens: number,
  epochs: number,
  onProgress?: (ratio: number) => void
): Promise<{ tokensProcessed: number; checksum: string }> {
  const tokens = material.match(/[\u0621-\u063A\u0641-\u064Aa-z0-9_]{2,}/gi) ?? [];
  const workTokens = tokens.slice(0, maxTokens);
  const frequency = new Map<string, number>();
  let checksum = 0x811c9dc5;
  let processed = 0;
  const totalWork = Math.max(workTokens.length, 1) * epochs;

  for (let epoch = 0; epoch < epochs; epoch++) {
    const chunkSize = 4000;
    for (let start = 0; start < workTokens.length; start += chunkSize) {
      const end = Math.min(start + chunkSize, workTokens.length);
      for (let i = start; i < end; i++) {
        const token = workTokens[i];
        frequency.set(token, (frequency.get(token) ?? 0) + 1);
        checksum = fnv1a(token, checksum);
      }
      processed += end - start;
      onProgress?.(processed / totalWork);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  let fingerprint = checksum;
  for (const [token, freq] of frequency) {
    fingerprint = fnv1a(token + ":" + freq, fingerprint);
  }

  return { tokensProcessed: totalWork, checksum: hashToHex(fingerprint) };
}

/** إرسال مساهمة تدريب للسيرفر */
export async function sendContribution(
  mode: "auto" | "manual",
  tokensProcessed: number,
  checksum: string,
  durationMs: number
): Promise<boolean> {
  try {
    const response = await fetch("/api/train", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId: getDeviceId(),
        mode,
        tokensProcessed,
        checksum,
        durationMs,
      }),
    });
    const json = (await response.json()) as { ok: boolean };
    return json.ok;
  } catch {
    return false;
  }
}
