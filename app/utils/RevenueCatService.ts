// 유료화 중단 (2026-06-04)
/*
import { Purchases, LOG_LEVEL, PACKAGE_TYPE, type CustomerInfo, type PurchasesPackage } from "@revenuecat/purchases-capacitor";

const API_KEY_IOS = "test_NWAcGPIOQbxFeBslHlZIVdFnXSE";
const ENTITLEMENT_ID = "방구조대 Pro";

export async function initRevenueCat(): Promise<void> {
  try {
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    await Purchases.configure({ apiKey: API_KEY_IOS });
  } catch (e) {
    console.error("RevenueCat init error:", e);
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (e) {
    console.error("getCustomerInfo error:", e);
    return null;
  }
}

export async function isPremiumActive(): Promise<boolean> {
  try {
    const info = await getCustomerInfo();
    if (!info) return false;
    return ENTITLEMENT_ID in info.entitlements.active;
  } catch {
    return false;
  }
}

export async function getOfferings(): Promise<PurchasesPackage[]> {
  try {
    const { current } = await Purchases.getOfferings();
    return current?.availablePackages ?? [];
  } catch (e) {
    console.error("getOfferings error:", e);
    return [];
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<{ success: boolean; error?: string }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    const success = ENTITLEMENT_ID in customerInfo.entitlements.active;
    return { success };
  } catch (e: any) {
    if (e?.userCancelled) return { success: false };
    const msg = e?.message || e?.code || JSON.stringify(e);
    console.error("purchasePackage error:", msg);
    return { success: false, error: msg };
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    return ENTITLEMENT_ID in customerInfo.entitlements.active;
  } catch (e) {
    console.error("restorePurchases error:", e);
    return false;
  }
}
*/
