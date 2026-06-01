"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLang } from "@/app/utils/LangContext";
import { usePremium } from "@/app/utils/PremiumContext";
import { t } from "@/app/utils/i18n";

const PLANS = [
  { id: "monthly", label: (lang: string) => lang === "ko" ? "월간" : "Monthly", price: 2000, period: (lang: string) => lang === "ko" ? "/ 월" : "/ month", highlight: false },
  { id: "annual",  label: (lang: string) => lang === "ko" ? "연간 🎉" : "Annual 🎉", price: 20000, period: (lang: string) => lang === "ko" ? "/ 년 (16% 할인)" : "/ year (16% off)", highlight: true },
];

const FEATURES = (lang: string) => lang === "ko"
  ? ["무제한 AI 분석", "포커스 모드 (한 단계씩)", "고정밀 이미지 분석 월 20회", "스트릭 보호권 월 3회"]
  : ["Unlimited AI analyses", "Focus Mode (step by step)", "High-precision analysis 20×/mo", "Streak shield 3×/mo"];

export default function UpgradePage() {
  const router = useRouter();
  const { lang, toggle } = useLang();
  const { state, upgrade, downgrade } = usePremium();
  const tr = t(lang);
  const [mounted, setMounted] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [devCode, setDevCode] = useState("");
  const [devError, setDevError] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  function handleDevCode() {
    if (devCode.trim() === "19990630") {
      upgrade();
      setDevCode("");
      setDevError(false);
      router.replace("/");
    } else {
      setDevError(true);
      setTimeout(() => setDevError(false), 1500);
    }
  }

  if (!mounted) return (
    <div style={{ background: "#F2FBEA", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#5A9E30", fontWeight: 700 }}>...</p>
    </div>
  );

  function handlePurchase(planId: string) {
    setProcessing(planId);
    // TODO: 실제 결제 (Stripe / Apple IAP)
    setTimeout(() => {
      upgrade();
      setProcessing(null);
      router.replace("/");
    }, 600);
  }

  const remaining = Math.max(0, 10 - state.freeAnalysisCount);

  return (
    <div style={{ background: "#F2FBEA", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* 헤더 */}
      <div style={{ background: "linear-gradient(135deg, #76C442 0%, #5A9E30 100%)", padding: "env(safe-area-inset-top, 16px) 16px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          ← {lang === "ko" ? "돌아가기" : "Back"}
        </button>
        <button onClick={toggle} style={{ background: "rgba(255,255,255,0.25)", border: "none", color: "white", padding: "5px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          {lang === "ko" ? "EN" : "한"}
        </button>
      </div>

      <div style={{ flex: 1, padding: "24px 20px 40px", maxWidth: 480, margin: "0 auto", width: "100%" }}>

        {/* 이미 프리미엄인 경우 */}
        {state.isPremium ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 40, marginBottom: 8 }}>⭐</p>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#2D5A2D", marginBottom: 8 }}>
              {lang === "ko" ? "프리미엄 멤버입니다!" : "You're a Pro Member!"}
            </h1>
            <p style={{ color: "#666", marginBottom: 24 }}>
              {lang === "ko"
                ? `고정밀 분석: 월 ${20 - state.focusAnalysisCount}회 남음 · 보호권: ${state.streakShields}개`
                : `Hi-detail: ${20 - state.focusAnalysisCount}/mo left · Shields: ${state.streakShields}`}
            </p>
            <button onClick={() => router.replace("/")}
              style={{ background: "linear-gradient(135deg, #76C442, #5A9E30)", color: "white", border: "none", padding: "14px 32px", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 12, width: "100%" }}>
              {lang === "ko" ? "홈으로" : "Go Home"}
            </button>
            <button onClick={() => { downgrade(); router.replace("/"); }}
              style={{ background: "none", border: "1.5px solid #ddd", color: "#999", padding: "12px 32px", borderRadius: 14, fontSize: 13, cursor: "pointer", width: "100%" }}>
              {lang === "ko" ? "[DEV] 구독 해지" : "[DEV] Downgrade"}
            </button>
          </div>
        ) : (
          <>
            {/* 상단 공지 */}
            <div style={{ background: "#FFF8E1", border: "1px solid #FFCC80", borderRadius: 12, padding: "12px 14px", marginBottom: 20, fontSize: 13, lineHeight: 1.6, color: "#E65100" }}>
              <strong>{lang === "ko" ? "💡 왜 유료인가요?" : "💡 Why paid?"}</strong>
              <br />
              {lang === "ko"
                ? "AI 이미지 분석은 매 요청마다 비용이 발생합니다. 무료 10회 제공 후 프리미엄으로 운영합니다."
                : "AI image analysis costs money per request. We offer 10 free analyses, then premium."}
            </div>

            {/* 남은 무료 횟수 */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: "#888" }}>
                {lang === "ko" ? `무료 분석 ${remaining}회 남음 (총 10회)` : `${remaining} free analyses left (out of 10)`}
              </p>
              <div style={{ height: 6, background: "#E0E0E0", borderRadius: 4, overflow: "hidden", marginTop: 6 }}>
                <div style={{ height: "100%", width: `${(state.freeAnalysisCount / 10) * 100}%`, background: "linear-gradient(90deg, #76C442, #5A9E30)", borderRadius: 4, transition: "width 0.3s" }} />
              </div>
            </div>

            {/* 타이틀 */}
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#2D5A2D", textAlign: "center", marginBottom: 4 }}>
              {lang === "ko" ? "프리미엄으로 시작하세요" : "Upgrade to Premium"}
            </h1>
            <p style={{ color: "#888", textAlign: "center", marginBottom: 20, fontSize: 13 }}>
              {lang === "ko" ? "복잡하게 생각하지 않아도 됩니다." : "No overthinking needed."}
            </p>

            {/* 기능 리스트 */}
            <div style={{ background: "white", borderRadius: 14, padding: "16px 18px", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              {FEATURES(lang).map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < FEATURES(lang).length - 1 ? "1px solid #f5f5f5" : "none" }}>
                  <span style={{ color: "#5A9E30", fontSize: 16, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 14, color: "#333" }}>{f}</span>
                </div>
              ))}
            </div>

            {/* 요금 버튼 */}
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                disabled={!!processing}
                onClick={() => handlePurchase(plan.id)}
                style={{
                  width: "100%",
                  marginBottom: 10,
                  padding: "16px",
                  background: plan.highlight ? "linear-gradient(135deg, #76C442, #5A9E30)" : "white",
                  color: plan.highlight ? "white" : "#5A9E30",
                  border: plan.highlight ? "none" : "2px solid #76C442",
                  borderRadius: 14,
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: processing ? "not-allowed" : "pointer",
                  opacity: processing && processing !== plan.id ? 0.5 : 1,
                  transition: "opacity 0.2s",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{processing === plan.id ? (lang === "ko" ? "처리 중..." : "Processing...") : plan.label(lang)}</span>
                <span style={{ fontWeight: 900 }}>₩{plan.price.toLocaleString()} <span style={{ fontWeight: 400, fontSize: 12 }}>{plan.period(lang)}</span></span>
              </button>
            ))}

            <p style={{ textAlign: "center", color: "#bbb", fontSize: 12, marginTop: 12 }}>
              {lang === "ko" ? "현재 테스트 버전입니다." : "Test version — no real charge."}
            </p>

            {/* 개발자 코드 입력 */}
            <div style={{ marginTop: 32, borderTop: "1px solid #eee", paddingTop: 20 }}>
              <p style={{ fontSize: 12, color: "#bbb", textAlign: "center", marginBottom: 10 }}>
                {lang === "ko" ? "코드가 있으신가요?" : "Have a code?"}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={devCode}
                  onChange={(e) => setDevCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleDevCode()}
                  placeholder={lang === "ko" ? "코드 입력" : "Enter code"}
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    border: devError ? "1.5px solid #ff6b6b" : "1.5px solid #ddd",
                    borderRadius: 10,
                    fontSize: 14,
                    outline: "none",
                    background: devError ? "#fff5f5" : "white",
                    transition: "border 0.2s",
                    letterSpacing: 2,
                  }}
                />
                <button
                  onClick={handleDevCode}
                  style={{ padding: "12px 16px", background: "#5A9E30", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                >
                  {lang === "ko" ? "확인" : "OK"}
                </button>
              </div>
              {devError && (
                <p style={{ fontSize: 12, color: "#ff6b6b", marginTop: 6, textAlign: "center" }}>
                  {lang === "ko" ? "올바르지 않은 코드예요" : "Invalid code"}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
