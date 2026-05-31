import { registerPlugin } from "@capacitor/core";

const TimerBridge = registerPlugin<{
  setTimer(opts: { durationSecs: number; label: string }): Promise<Record<string, string>>;
  clearTimer(): Promise<void>;
}>("TimerBridge");

export function bridgeSetTimer(durationSecs: number, label: string) {
  TimerBridge.setTimer({ durationSecs, label })
    .then((r) => { console.log("[TimerBridge] setTimer result:", JSON.stringify(r)); })
    .catch((e) => { console.error("[TimerBridge] setTimer error:", e); alert("[TimerBridge] error: " + e); });
}

export function bridgeClearTimer() {
  TimerBridge.clearTimer().catch(() => {});
}
