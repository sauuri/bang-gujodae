import { NextRequest, NextResponse } from "next/server";

// Stripe 키 (환경변수에서 로드)
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

export async function POST(req: NextRequest) {
  try {
    const { planId } = await req.json();

    if (!STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe key not configured" },
        { status: 500 }
      );
    }

    // Stripe Checkout Session 생성 (미구현 - Stripe SDK 필요)
    // 실제 구현:
    // const stripe = new Stripe(STRIPE_SECRET_KEY);
    // const session = await stripe.checkout.sessions.create({...});

    // 현재: Mock 응답
    const mockCheckoutUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/payment-success?planId=${planId}`;

    return NextResponse.json({
      url: mockCheckoutUrl,
      sessionId: "mock_session_123",
    });
  } catch (error) {
    console.error("Checkout session error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
