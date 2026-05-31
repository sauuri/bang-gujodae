import { registerPlugin } from "@capacitor/core";

const TimerBridge = registerPlugin<{
  setTimer(opts: { durationSecs: number; label: string }): Promise<Record<string, string>>;
  clearTimer(): Promise<void>;
}>("TimerBridge");

export function bridgeSetTimer(durationSecs: number, label: string) {
  TimerBridge.setTimer({ durationSecs, label })
    .then((r) => { alert("[TimerBridge] result: " + JSON.stringify(r)); })
    .catch((e) => { alert("[TimerBridge] error: " + e); });
}

export function bridgeClearTimer() {
  TimerBridge.clearTimer().catch(() => {});
}
