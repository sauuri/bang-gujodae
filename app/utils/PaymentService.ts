// 결제 서비스
// 실제 운영 환경에서는 Stripe, RevenueCat, Apple IAP 중 하나 선택

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: "month" | "year";
  description: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "premium-monthly",
    name: "Premium",
    price: 2000,
    currency: "KRW",
    period: "month",
    description: "월간 구독",
  },
  {
    id: "premium-annual",
    name: "Premium Annual",
    price: 20000,
    currency: "KRW",
    period: "year",
    description: "연간 구독 (16% 할인)",
  },
];

export async function initializePaymentService() {
  // 향후 Stripe, RevenueCat, Apple IAP 초기화
  console.log("Payment service initialized");
}

export async function openPaymentFlow(planId: string): Promise<boolean> {
  try {
    // 1. 웹 버전: Stripe Checkout
    if (typeof window !== "undefined" && !isNativeApp()) {
      return await openStripeCheckout(planId);
    }

    // 2. iOS 네이티브: Apple IAP (나중에 구현)
    // return await openAppleIAP(planId);

    // 현재: Mock 결제
    return true;
  } catch (error) {
    console.error("Payment flow error:", error);
    return false;
  }
}

async function openStripeCheckout(planId: string): Promise<boolean> {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
  if (!plan) return false;

  try {
    // Stripe Checkout 세션 생성 (실제 구현 필요)
    const response = await fetch("/api/payment/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId }),
    });

    const { url } = await response.json();
    if (url) {
      window.location.href = url;
      return true;
    }
  } catch (error) {
    console.error("Stripe checkout error:", error);
  }

  return false;
}

function isNativeApp(): boolean {
  return typeof (window as any).cordova !== "undefined" || typeof (window as any).capacitor !== "undefined";
}

// Mock 결제 (현재 테스트용)
export async function mockPaymentFlow(planId: string): Promise<boolean> {
  console.log("Mock payment for plan:", planId);
  return true;
}
