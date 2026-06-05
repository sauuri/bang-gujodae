// 유료화 중단 (2026-06-04)
/*
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLang } from "@/app/utils/LangContext";
import { usePremium } from "@/app/utils/PremiumContext";
import { t } from "@/app/utils/i18n";
import { PurchasesPackage } from "@revenuecat/purchases-capacitor";
import {
  initRevenueCat,
  getOfferings,
  purchasePackage,
  restorePurchases,
} from "@/app/utils/RevenueCatService";

const isNative = () => typeof window !== "undefined" && !!(window as any).Capacitor?.isNativePlatform?.();

const DEV_CODE = "19990630";

const FEATURES = (lang: string) => lang === "ko"
  ? ["무제한 AI 분석", "포커스 모드 (한 단계씩)", "고정밀 이미지 분석 월 20회", "스트릭 보호권 월 3회"]
  : ["Unlimited AI analyses", "Focus Mode (step by step)", "High-precision analysis 20×/mo", "Streak Shield 3×/mo"];

export default function UpgradePage() {
  const router = useRouter();
  const { lang, toggle } = useLang();
  const { state, upgrade, downgrade } = usePremium();
  const tr = t(lang);

  const [mounted, setMounted] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [devCode, setDevCode] = useState("");
  const [devError, setDevError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isNative()) {
      initRevenueCat().then(() => {
        getOfferings().then(setPackages);
      });
    }
  }, []);

  if (!mounted) return (
    <div style={{ background: "#F2FBEA", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#5A9E30", fontWeight: 700 }}>...</p>
    </div>
  );

  async function handlePurchase(pkg: PurchasesPackage) {
    setProcessing(true);
    setError(null);
    const result = await purchasePackage(pkg);
    if (result.success) {
      upgrade();
      router.replace("/");
    } else if (result.error) {
      setError(result.error);
    } else {
      setError(lang === "ko" ? "결제가 취소됐어요." : "Purchase was cancelled.");
    }
    setProcessing(false);
  }

  async function handleMockPurchase() {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 600));
    upgrade();
    router.replace("/");
  }

  async function handleRestore() {
    setRestoring(true);
    setError(null);
    try {
      const success = await restorePurchases();
      if (success) {
        upgrade();
        router.replace("/");
      } else {
        setError(lang === "ko" ? "복원할 구독이 없어요." : "No subscription to restore.");
      }
    } catch {
      setError(lang === "ko" ? "복원 중 오류가 발생했어요." : "Restore failed.");
    } finally {
      setRestoring(false);
    }
  }

  function handleDevCode() {
    if (devCode.trim() === DEV_CODE) {
      upgrade();
      router.replace("/");
    } else {
      setDevError(true);
      setTimeout(() => setDevError(false), 1500);
    }
  }

  const remaining = Math.max(0, 10 - state.freeAnalysisCount);

  return (
    <>
    <div style={{ background: "#F2FBEA", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      <div style={{
        background: "linear-gradient(135deg, #76C442 0%, #5A9E30 100%)",
        padding: "env(safe-area-inset-top, 16px) 16px 16px",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <button onClick={() => router.back()}
          style={{ background: "none", border: "none", color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          ← {lang === "ko" ? "돌아가기" : "Back"}
        </button>
        <button onClick={toggle}
          style={{ background: "rgba(255,255,255,0.25)", border: "none", color: "white", padding: "5px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          {lang === "ko" ? "EN" : "한"}
        </button>
      </div>

      <div style={{ flex: 1, padding: "24px 20px 48px", maxWidth: 480, margin: "0 auto", width: "100%" }}>

        {state.isPremium ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 48, margin: "0 0 12px" }}>⭐</p>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#2D5A2D", marginBottom: 8 }}>
              {lang === "ko" ? "프리미엄 멤버예요!" : "You're a Pro Member!"}
            </h1>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
              {lang === "ko"
                ? `고정밀 분석: 월 ${20 - state.focusAnalysisCount}회 남음\n스트릭 보호권: ${state.streakShields}개`
                : `Hi-detail: ${20 - state.focusAnalysisCount}/mo left · Shields: ${state.streakShields}`}
            </p>
            <button onClick={() => router.replace("/")}
              style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #76C442, #5A9E30)", color: "white", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 800, cursor: "pointer", marginBottom: 12 }}>
              {lang === "ko" ? "홈으로" : "Go Home"}
            </button>
            {isNative() && (
              <button onClick={handleRestore}
                style={{ width: "100%", padding: "12px", background: "white", border: "1.5px solid #ddd", borderRadius: 14, fontSize: 13, color: "#666", cursor: "pointer", marginBottom: 12 }}>
                {lang === "ko" ? "구매 복원" : "Restore Purchases"}
              </button>
            )}
            <button onClick={() => setShowConfirm(true)}
              style={{ width: "100%", padding: "12px", background: "none", border: "none", fontSize: 12, color: "#bbb", cursor: "pointer" }}>
              {lang === "ko" ? "구독 해지" : "Cancel Subscription"}
            </button>
          </div>
        ) : (
          <>
            <div style={{ background: "#FFF8E1", border: "1px solid #FFCC80", borderRadius: 12, padding: "12px 14px", marginBottom: 20, fontSize: 13, lineHeight: 1.6, color: "#E65100" }}>
              <strong>{lang === "ko" ? "💡 왜 유료인가요?" : "💡 Why paid?"}</strong><br />
              {lang === "ko"
                ? "AI 이미지 분석은 매 요청마다 비용이 발생합니다. 무료 10회 제공 후 프리미엄으로 운영합니다."
                : "AI analysis costs money per request. We offer 10 free analyses, then premium."}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "#888" }}>
                  {lang === "ko" ? `무료 분석 ${remaining}회 남음` : `${remaining} free analyses left`}
                </span>
                <span style={{ fontSize: 12, color: "#bbb" }}>/ 10</span>
              </div>
              <div style={{ height: 6, background: "#E0E0E0", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(state.freeAnalysisCount / 10) * 100}%`, background: "linear-gradient(90deg, #76C442, #5A9E30)", borderRadius: 4, transition: "width 0.3s" }} />
              </div>
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#2D5A2D", textAlign: "center", marginBottom: 4 }}>
              {lang === "ko" ? "프리미엄으로 시작하세요" : "Upgrade to Premium"}
            </h1>
            <p style={{ color: "#888", textAlign: "center", marginBottom: 20, fontSize: 13 }}>
              {lang === "ko" ? "복잡하게 생각하지 않아도 됩니다." : "No overthinking needed."}
            </p>

            <div style={{ background: "white", borderRadius: 14, padding: "16px 18px", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              {FEATURES(lang).map((f, i, arr) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < arr.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                  <span style={{ color: "#5A9E30", fontSize: 16, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 14, color: "#333" }}>{f}</span>
                </div>
              ))}
            </div>

            {error && (
              <p style={{ color: "#ff6b6b", fontSize: 13, textAlign: "center", marginBottom: 12 }}>{error}</p>
            )}

            {isNative() && packages.length > 0 ? (
              <>
                {packages.map((pkg) => (
                  <button
                    key={pkg.identifier}
                    disabled={processing}
                    onClick={() => handlePurchase(pkg)}
                    style={{
                      width: "100%",
                      marginBottom: 10,
                      padding: "16px",
                      background: "linear-gradient(135deg, #76C442, #5A9E30)",
                      color: "white",
                      border: "none",
                      borderRadius: 14,
                      fontSize: 15,
                      fontWeight: 800,
                      cursor: processing ? "not-allowed" : "pointer",
                      opacity: processing ? 0.6 : 1,
                    }}
                  >
                    {processing
                      ? (lang === "ko" ? "결제 중..." : "Processing...")
                      : `🚀 ${pkg.product.title} — ${pkg.product.priceString}`}
                  </button>
                ))}
                <button
                  disabled={restoring}
                  onClick={handleRestore}
                  style={{ width: "100%", padding: "14px", background: "white", border: "1.5px solid #ddd", borderRadius: 14, fontSize: 13, color: "#666", cursor: "pointer", marginBottom: 8 }}>
                  {restoring ? "..." : (lang === "ko" ? "구매 복원" : "Restore Purchases")}
                </button>
              </>
            ) : (
              <button
                disabled={processing}
                onClick={handleMockPurchase}
                style={{
                  width: "100%",
                  marginBottom: 10,
                  padding: "16px",
                  background: "linear-gradient(135deg, #76C442, #5A9E30)",
                  color: "white",
                  border: "none",
                  borderRadius: 14,
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: processing ? "not-allowed" : "pointer",
                  opacity: processing ? 0.6 : 1,
                }}
              >
                {processing ? (lang === "ko" ? "처리 중..." : "Processing...") : `🚀 ${lang === "ko" ? "프리미엄 시작 — ₩2,000/월" : "Start Premium — ₩2,000/mo"}`}
              </button>
            )}

            <p style={{ textAlign: "center", color: "#bbb", fontSize: 11, marginTop: 4, marginBottom: 32 }}>
              {lang === "ko" ? "언제든지 해지 가능 · Apple이 관리" : "Cancel anytime · Managed by Apple"}
            </p>

            <div style={{ borderTop: "1px solid #eee", paddingTop: 24 }}>
              <p style={{ fontSize: 12, color: "#ccc", textAlign: "center", marginBottom: 10 }}>
                {lang === "ko" ? "코드가 있으신가요?" : "Have a code?"}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={devCode}
                  onChange={e => setDevCode(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleDevCode()}
                  placeholder={lang === "ko" ? "코드 입력" : "Enter code"}
                  style={{
                    flex: 1, padding: "12px 14px",
                    border: devError ? "1.5px solid #ff6b6b" : "1.5px solid #e0e0e0",
                    borderRadius: 10, fontSize: 14, outline: "none",
                    background: devError ? "#fff5f5" : "white",
                    letterSpacing: 2, transition: "border 0.2s",
                  }}
                />
                <button onClick={handleDevCode}
                  style={{ padding: "12px 16px", background: "#5A9E30", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
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

    {showConfirm && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 100 }}>
        <div style={{ width: "100%", background: "white", borderRadius: "20px 20px 0 0", padding: "28px 20px 40px" }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: "#1a2744", marginBottom: 8, textAlign: "center" }}>
            {lang === "ko" ? "구독을 해지할까요?" : "Cancel subscription?"}
          </h2>
          <p style={{ color: "#888", fontSize: 13, textAlign: "center", marginBottom: 24, lineHeight: 1.6 }}>
            {lang === "ko"
              ? "해지하면 프리미엄 기능이 즉시 종료됩니다."
              : "You will lose access to premium features immediately."}
          </p>
          <button
            onClick={() => {
              downgrade();
              setShowConfirm(false);
              router.replace("/");
            }}
            style={{ width: "100%", padding: "14px", background: "#ff6b6b", color: "white", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: "pointer", marginBottom: 10 }}>
            {lang === "ko" ? "네, 해지할게요" : "Yes, cancel"}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            style={{ width: "100%", padding: "14px", background: "#f5f5f5", border: "none", borderRadius: 12, fontSize: 14, color: "#666", cursor: "pointer" }}>
            {lang === "ko" ? "취소" : "Keep subscription"}
          </button>
        </div>
      </div>
    )}
    </>
  );
}
*/

// 유료화 중단 — 빈 페이지로 홈 리다이렉트
import { redirect } from "next/navigation";
export default function UpgradePage() {
  redirect("/");
}
