import { Capacitor, registerPlugin } from "@capacitor/core";

export interface ARStep {
  order: number;
  title: string;
  duration: string;
  reason: string;
}

export interface ARBridgePlugin {
  isSupported(): Promise<{ supported: boolean }>;
  openAR(options: { steps: ARStep[] }): Promise<{ checkedCount: number }>;
}

const ARBridge = registerPlugin<ARBridgePlugin>("ARBridge");

export async function isARSupported(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { supported } = await ARBridge.isSupported();
    return supported;
  } catch {
    return false;
  }
}

export async function openNativeAR(steps: ARStep[]): Promise<number> {
  const { checkedCount } = await ARBridge.openAR({ steps });
  return checkedCount;
}
