"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLang } from "@/app/utils/LangContext";
import { usePremium } from "@/app/utils/PremiumContext";
import { t } from "@/app/utils/i18n";

export default function UpgradePage() {
  const router = useRouter();
  const { lang, toggle } = useLang();
  const { state, upgrade, downgrade } = usePremium();
  const tr = t(lang);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleUpgrade = () => {
    upgrade();
    router.push("/");
  };

  const handleDowngrade = () => {
    downgrade();
    router.push("/");
  };

  return (
    <div style={{ background: "#F2FBEA", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* 헤더 */}
      <div
        style={{
          background: "linear-gradient(135deg, #84D98F 0%, #5DC86D 100%)",
          color: "white",
          padding: "1.5rem 1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: "none",
            border: "none",
            color: "white",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          {tr.back}
        </button>
        <button
          onClick={toggle}
          style={{
            background: "rgba(255,255,255,0.3)",
            border: "none",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "1rem",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          {lang === "ko" ? "🇺🇸 EN" : "🇰🇷 KO"}
        </button>
      </div>

      {/* 메인 콘텐츠 */}
      <div style={{ flex: 1, padding: "2rem 1.5rem", maxWidth: "600px", margin: "0 auto", width: "100%" }}>
        {/* 공지 배너 */}
        <div
          style={{
            background: "#FFF3E0",
            border: "1px solid #FFB74D",
            borderRadius: "0.8rem",
            padding: "1rem",
            marginBottom: "2rem",
            fontSize: "0.9rem",
            lineHeight: 1.6,
            color: "#E65100",
          }}
        >
          <p style={{ margin: 0, marginBottom: "0.5rem", fontWeight: "bold" }}>
            {lang === "ko" ? "💡 왜 유료인가요?" : "💡 Why is it paid?"}
          </p>
          <p style={{ margin: 0 }}>
            {lang === "ko"
              ? "AI 이미지 분석에는 실시간 비용이 발생합니다. 더 정확한 분석을 제공하기 위해 프리미엄로 운영하고 있습니다."
              : "AI image analysis incurs real-time costs. We operate with a premium model to provide more accurate analysis."}
          </p>
        </div>

        {/* 타이틀 */}
        <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem", color: "#2D5A2D", textAlign: "center" }}>
          {tr.upgradeTitle}
        </h1>
        <p style={{ color: "#666", textAlign: "center", marginBottom: "2rem" }}>
          {lang === "ko" ? "복잡하게 생각하지 마세요." : "Don't overthink it."}
        </p>

        {/* 기능 리스트 */}
        <div
          style={{
            background: "white",
            borderRadius: "1rem",
            padding: "1.5rem",
            marginBottom: "2rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          {(tr.premiumFeatures as unknown as string[]).map((feature, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: idx < (tr.premiumFeatures as string[]).length - 1 ? "1rem" : "0",
                fontSize: "1rem",
                color: "#333",
              }}
            >
              <span style={{ marginRight: "1rem", fontSize: "1.5rem" }}>✨</span>
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* 가격 */}
        <div
          style={{
            background: "linear-gradient(135deg, #84D98F 0%, #5DC86D 100%)",
            color: "white",
            borderRadius: "1rem",
            padding: "2rem",
            marginBottom: "2rem",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "0.9rem", opacity: 0.9, marginBottom: "0.5rem" }}>
            {lang === "ko" ? "매달" : "Per month"}
          </p>
          <p style={{ fontSize: "2.5rem", fontWeight: "bold", margin: "0.5rem 0" }}>
            ₩2,000
          </p>
          <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>
            {lang === "ko" ? "(또는 연 ₩20,000)" : "(or ₩20,000/year)"}
          </p>
        </div>

        {/* 버튼 */}
        {!state.isPremium ? (
          <button
            onClick={handleUpgrade}
            style={{
              width: "100%",
              padding: "1.2rem",
              background: "linear-gradient(135deg, #84D98F 0%, #5DC86D 100%)",
              color: "white",
              border: "none",
              borderRadius: "1rem",
              fontSize: "1.1rem",
              fontWeight: "bold",
              cursor: "pointer",
              marginBottom: "1rem",
              transition: "opacity 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            🚀 {tr.upgradeBtn}
          </button>
        ) : (
          <>
            <div
              style={{
                background: "#E8F5E9",
                border: "2px solid #84D98F",
                borderRadius: "1rem",
                padding: "1.5rem",
                marginBottom: "1rem",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "1.1rem", color: "#2D5A2D", fontWeight: "bold", margin: "0 0 0.5rem 0" }}>
                ✅ {lang === "ko" ? "프리미엄 멤버입니다!" : "You're a Pro Member!"}
              </p>
              <p style={{ color: "#666", margin: "0 0 1rem 0" }}>
                {lang === "ko"
                  ? `남은 무료 분석: ${5 - state.freeAnalysisCount}회\n고정밀 분석: ${20 - state.focusAnalysisCount}회\n보호권: ${state.streakShields}개`
                  : `Free analyses: ${5 - state.freeAnalysisCount}\nHi-detail analyses: ${20 - state.focusAnalysisCount}\nShields: ${state.streakShields}`}
              </p>
              <button
                onClick={handleDowngrade}
                style={{
                  background: "#ff6b6b",
                  color: "white",
                  border: "none",
                  padding: "0.8rem 1.5rem",
                  borderRadius: "0.8rem",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                {lang === "ko" ? "개발 모드: 구독 해지" : "DEV: Downgrade"}
              </button>
            </div>
          </>
        )}

        {/* 안내 */}
        <p
          style={{
            textAlign: "center",
            color: "#999",
            fontSize: "0.85rem",
            marginTop: "2rem",
          }}
        >
          {lang === "ko"
            ? "이것은 테스트 버전입니다. 실제 결제는 아직 구현되지 않았습니다."
            : "This is a test version. Real payment is not yet implemented."}
        </p>
      </div>
    </div>
  );
}
