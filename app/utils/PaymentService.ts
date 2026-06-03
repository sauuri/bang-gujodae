// 유료화 중단 (2026-06-04)
/*
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
  console.log("Payment service initialized");
}

export async function openPaymentFlow(planId: string): Promise<boolean> {
  try {
    if (typeof window !== "undefined" && !isNativeApp()) {
      return await openStripeCheckout(planId);
    }
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

export async function mockPaymentFlow(planId: string): Promise<boolean> {
  console.log("Mock payment for plan:", planId);
  return true;
}
*/
