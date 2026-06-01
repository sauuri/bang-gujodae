"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SplashIntro from "./components/SplashIntro";
import RobotSprite from "./components/RobotSprite";
import { hapticLight, hapticMedium } from "./utils/haptics";
import { useLang } from "./utils/LangContext";
import { usePremium } from "./utils/PremiumContext";
import { t } from "./utils/i18n";

async function resizeImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 512;
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.src = url;
  });
}


const ENERGY_EMOJI: Record<number, string> = {
  1: "😵", 2: "😩", 3: "😮‍💨", 4: "😐", 5: "🙂",
  6: "😊", 7: "💪", 8: "⚡", 9: "🔥", 10: "🚀",
};

export default function Home() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { lang, toggle } = useLang();
  const { state: premiumState, useFreeAnalysis, useFocusAnalysis, canFreeAnalysis, canFocusAnalysis, resetIfNewMonth } = usePremium();
  const tr = t(lang);

  const [preview, setPreview]         = useState<string | null>(null);
  const [imageB64, setImageB64]       = useState<string | null>(null);
  const [energy, setEnergy]           = useState(5);
  const [timeLeft, setTimeLeft]       = useState("");
  const [loading, setLoading]         = useState(false);
  const [loadingMsg, setLoadingMsg]   = useState<string>(tr.loadingMsgs[0]);
  const [sweepDir, setSweepDir]       = useState<"walkLeft" | "walkRight">("walkRight");
  const [dragOver, setDragOver]       = useState(false);
  const [streak, setStreak]           = useState({ current: 0, best: 0 });
  const [historyCount, setHistoryCount] = useState(0);
  const [showSplash, setShowSplash]   = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [useHighDetail, setUseHighDetail] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem("bangStreak");
      if (s) setStreak(JSON.parse(s));
      const h = localStorage.getItem("bangHistory");
      if (h) setHistoryCount(JSON.parse(h).length);
      setShowSplash(true);
      resetIfNewMonth();
      console.log("Home page initialized, premium state:", premiumState);
    } catch (e) {
      console.error("Init error:", e);
    }
    setInitialized(true);
  }, [resetIfNewMonth, premiumState]);

  useEffect(() => {
    if (!timeLeft) setTimeLeft(tr.timeOptions[1]);
  }, [lang]);

  useEffect(() => {
    if (!loading) return;
    let i = 0;
    const msgs = tr.loadingMsgs;
    const iv = setInterval(() => {
      i = (i + 1) % msgs.length;
      setLoadingMsg(msgs[i]);
    }, 1800);
    const sv = setInterval(() => {
      setSweepDir(d => d === "walkRight" ? "walkLeft" : "walkRight");
    }, 900);
    return () => { clearInterval(iv); clearInterval(sv); };
  }, [loading]);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const b64 = await resizeImage(file);
    setImageB64(b64);
    setPreview(b64);
  }

  async function handleSubmit() {
    if (!imageB64) return;
    hapticMedium();
    setLoading(true);
    setLoadingMsg(tr.loadingMsgs[0]);
    // 월 리셋 체크
    resetIfNewMonth();

    // 무료 분석 횟수 체크 (7회 후 모달)
    if (!premiumState.isPremium && premiumState.freeAnalysisCount >= 7) {
      setLoading(false);
      setShowUpgradeModal(true);
      return;
    }

    // 10회 이상은 완전 차단
    if (!premiumState.isPremium && !canFreeAnalysis()) {
      setLoading(false);
      alert(lang === "ko" ? "무료 분석을 모두 사용했습니다.\nPro로 업그레이드해주세요." : "Free analyses used up.\nPlease upgrade to Pro.");
      router.push("/upgrade");
      return;
    }

    try {
      const detail = useHighDetail && premiumState.isPremium ? "high" : "low";

      const res = await fetch("/api/rescue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: imageB64, timeLeft, energy, lang, detail }),
      });
      const data = await res.json();

      // 횟수 차감
      if (premiumState.isPremium && useHighDetail && canFocusAnalysis()) {
        useFocusAnalysis();
      } else {
        useFreeAnalysis();
      }

      localStorage.setItem("rescueResult", JSON.stringify({ ...data, imageB64 }));
      router.push("/result");
    } catch {
      alert(tr.errorMsg);
    } finally {
      setLoading(false);
    }
  }

  function finishSplash() {
    localStorage.setItem("bangOnboarded", "1");
    setShowSplash(false);
  }

  return (
    <>
      {initialized && showSplash && <SplashIntro onDone={finishSplash} />}

      {/* 로딩 오버레이 */}
      {loading && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(242,251,234,0.97)",
          backdropFilter: "blur(14px)",
          zIndex: 99,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20,
        }}>
          {/* 스캔 레이더 */}
          <div style={{ position: "relative", width: 160, height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid #B5DFA0", animation: "scanRing 2s ease-out infinite", opacity: 0 }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid #76C442", animation: "scanRing 2s ease-out 0.7s infinite", opacity: 0 }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid #5A9E30", animation: "scanRing 2s ease-out 1.4s infinite", opacity: 0 }} />
            <RobotSprite pose={sweepDir} size={110} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#1a2744" }}>{tr.scanning}</div>
          <div style={{ fontSize: 13, color: "#5A9E30", fontWeight: 700, transition: "all 0.4s" }}>{loadingMsg}</div>
          <div style={{ width: 160, height: 5, background: "#DBEFC7", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              background: "linear-gradient(90deg, #76C442, #5A9E30)",
              borderRadius: 4,
              animation: "progress 3s ease-in-out infinite",
            }} />
          </div>
          <style>{`
            @keyframes scanRing {
              0%   { transform: scale(0.6); opacity: 0.8; }
              100% { transform: scale(1.6); opacity: 0; }
            }
            @keyframes progress { 0%{width:0%} 80%{width:90%} 100%{width:90%} }
          `}</style>
        </div>
      )}

      <main style={{
        maxWidth: 440,
        margin: "0 auto",
        padding: "0 0 max(80px, calc(64px + env(safe-area-inset-bottom, 0px)))",
        visibility: (!initialized || showSplash) ? "hidden" : "visible",
      }}>

        {/* 상단 히어로 배너 */}
        <div style={{
          position: "relative",
          background: "linear-gradient(160deg, #76C442 0%, #5A9E30 100%)",
          padding: "28px 20px 20px",
          overflow: "hidden",
          borderRadius: "0 0 28px 28px",
        }}>
          <div style={{
            position: "absolute", top: -30, right: -30,
            width: 130, height: 130, borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            pointerEvents: "none",
          }} />

          {/* 상단 바 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "rgba(255,255,255,0.22)",
              borderRadius: 50, padding: "5px 14px",
            }}>
              <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: 1.2, color: "white" }}>{tr.appName}</span>
              <span style={{ fontSize: 16, lineHeight: 1 }}>🚨</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {streak.current > 0 && (
                <div style={{
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: 50, padding: "5px 12px",
                  fontSize: 12, fontWeight: 800, color: "white",
                }}>
                  🔥 {streak.current}{tr.streakDays}
                </div>
              )}
              {historyCount > 0 && (
                <div onClick={() => router.push("/history")} style={{
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: 50, padding: "5px 12px",
                  fontSize: 12, fontWeight: 800, color: "white", cursor: "pointer",
                }}>
                  📋 {historyCount}{tr.times}
                </div>
              )}
              {premiumState.isPremium ? (
                <div style={{
                  background: "rgba(255,255,255,0.3)",
                  borderRadius: 50, padding: "5px 12px",
                  fontSize: 12, fontWeight: 800, color: "white",
                }}>
                  ⭐ Pro
                </div>
              ) : (
                <button
                  onClick={() => router.push("/upgrade")}
                  style={{
                    background: "rgba(255,255,255,0.2)", border: "none",
                    borderRadius: 50, padding: "5px 12px",
                    fontSize: 12, fontWeight: 800, color: "white", cursor: "pointer",
                  }}
                >
                  ⭐ Pro
                </button>
              )}
              <button onClick={toggle} style={{
                background: "rgba(255,255,255,0.2)", border: "none",
                borderRadius: 50, padding: "5px 12px",
                fontSize: 12, fontWeight: 800, color: "white", cursor: "pointer",
              }}>
                {lang === "ko" ? "EN" : "한"}
              </button>
            </div>
          </div>

          {/* 텍스트 + 로봇 가로 배치 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h1 style={{
                fontSize: 22, fontWeight: 900, lineHeight: 1.35,
                color: "white", letterSpacing: -0.5,
                textShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}>
                {tr.heroLine1}<br />
                <span style={{ color: "#FFD54F" }}>{tr.heroLine2}</span><br />
                {tr.heroLine3}
              </h1>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 6 }}>
                {tr.heroSub}
              </p>
            </div>
            <RobotSprite
              pose="idle"
              size={120}
              style={{ flexShrink: 0, animation: "robotFloat 3s ease-in-out infinite" }}
            />
          </div>

          <style>{`
            @keyframes robotFloat {
              0%, 100% { transform: translateX(0); }
              50% { transform: translateX(8px); }
            }
          `}</style>
        </div>

        {/* 본문 */}
        <div style={{ padding: "0 16px", marginTop: 14 }}>

          {/* 사진 업로드 */}
          <div style={{ marginBottom: 10 }}>
            <div
              className={`upload-zone${dragOver ? " drag-over" : ""}`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              style={preview ? { padding: 0, overflow: "hidden" } : undefined}
            >
              {preview ? (
                <div style={{ position: "relative" }}>
                  <img src={preview} alt="preview" style={{
                    width: "100%", height: 200, objectFit: "cover", display: "block",
                  }} />
                  <div style={{
                    position: "absolute", bottom: 8, right: 8,
                    background: "rgba(0,0,0,0.45)", color: "white",
                    fontSize: 11, fontWeight: 700, padding: "4px 10px",
                    borderRadius: 20, backdropFilter: "blur(4px)",
                  }}>{tr.tapReplace}</div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                    background: "#F2FBEA", border: "1.5px solid #B5DFA0",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 26 }}>📸</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", marginBottom: 3 }}>{tr.uploadLabel}</p>
                    <p style={{ fontSize: 11, color: "#c0c0c0" }}>{tr.uploadSub}</p>
                  </div>
                </div>
              )}

              <input ref={inputRef} type="file" accept="image/*" capture="environment"
                style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>
          </div>

          {/* 에너지 카드 */}
          <div className="card" style={{ padding: "14px 16px", marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#666" }}>{tr.energyLabel}</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#5A9E30" }}>
                {ENERGY_EMOJI[energy]}{" "}
                <span style={{ fontSize: 16, color: "#1a2744" }}>{energy}</span>
                <span style={{ fontSize: 11, color: "#ccc", fontWeight: 600 }}>/10</span>
              </span>
            </div>

            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} style={{
                  flex: 1, height: 6, borderRadius: 4,
                  background: i < energy ? "#76C442" : "#F2FBEA",
                  transition: "background 0.2s",
                }} />
              ))}
            </div>

            <input type="range" min={1} max={10} value={energy}
              onChange={(e) => { const v = Number(e.target.value); if (v !== energy) { (v === 1 || v === 10) ? hapticMedium() : hapticLight(); } setEnergy(v); }}
              className="slider" />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: "#ccc" }}>{tr.energyLow}</span>
              <span style={{ fontSize: 10, color: "#ccc" }}>{tr.energyFull}</span>
            </div>
          </div>

          {/* 시간 카드 */}
          <div className="card" style={{ padding: "14px 16px", marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#666", marginBottom: 10 }}>
              {tr.timeLabel}
            </div>
            <div className="time-grid">
              {tr.timeOptions.map((opt: string) => (
                <button
                  key={opt}
                  className={`time-btn${timeLeft === opt ? " active" : ""}`}
                  onClick={() => { hapticLight(); setTimeLeft(opt); }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* 출동 버튼 */}
          <button className="btn-main" onClick={handleSubmit} disabled={loading || !imageB64}>
            {tr.rescueBtn}
          </button>
          {!imageB64 && (
            <p style={{ textAlign: "center", fontSize: 11, color: "#ccc", marginTop: 8 }}>
              {tr.uploadFirst}
            </p>
          )}

        </div>
      </main>

      {/* 업그레이드 모달 */}
      {showUpgradeModal && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "flex-end",
          zIndex: 100,
        }}>
          <div style={{
            width: "100%",
            background: "white",
            borderRadius: "20px 20px 0 0",
            padding: "2rem 1.5rem 2.5rem",
            maxHeight: "80vh",
            overflowY: "auto",
          }}>
            <button
              onClick={() => setShowUpgradeModal(false)}
              style={{
                float: "right",
                background: "#f0f0f0",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                fontSize: 18,
                cursor: "pointer",
              }}
            >
              ✕
            </button>

            <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem", color: "#2D5A2D" }}>
              {lang === "ko" ? `무료 분석 ${10 - premiumState.freeAnalysisCount}회 남았어요` : `${10 - premiumState.freeAnalysisCount} free analyses left`}
            </h2>

            <div
              style={{
                background: "#FFF3E0",
                border: "1px solid #FFB74D",
                borderRadius: "0.8rem",
                padding: "1rem",
                marginBottom: "1.5rem",
                fontSize: "0.85rem",
                lineHeight: 1.6,
                color: "#E65100",
              }}
            >
              <p style={{ margin: 0, marginBottom: "0.5rem", fontWeight: "bold" }}>
                {lang === "ko" ? "💡 왜 유료인가요?" : "💡 Why paid?"}
              </p>
              <p style={{ margin: 0 }}>
                {lang === "ko"
                  ? "AI 이미지 분석에는 실시간 비용이 발생합니다. 더 정확한 분석을 제공하기 위해 유료로 운영하고 있습니다."
                  : "AI image analysis incurs real costs. We operate with a premium model to provide accurate analysis."}
              </p>
            </div>

            <p style={{ color: "#666", marginBottom: "1.5rem" }}>
              {lang === "ko"
                ? `다음 ${10 - premiumState.freeAnalysisCount}회 분석 후 Pro 구독이 필요합니다.\nPro로 업그레이드하면 무제한 분석이 가능합니다.`
                : `Pro subscription required after ${10 - premiumState.freeAnalysisCount} more free analyses.\nUpgrade to Pro for unlimited analyses.`}
            </p>

            <button
              onClick={() => {
                setShowUpgradeModal(false);
                router.push("/upgrade");
              }}
              style={{
                width: "100%",
                padding: "1rem",
                background: "linear-gradient(135deg, #84D98F 0%, #5DC86D 100%)",
                color: "white",
                border: "none",
                borderRadius: "0.8rem",
                fontSize: "1.1rem",
                fontWeight: "bold",
                cursor: "pointer",
                marginBottom: "0.5rem",
              }}
            >
              {tr.upgradeBtn}
            </button>
            <button
              onClick={() => setShowUpgradeModal(false)}
              style={{
                width: "100%",
                padding: "1rem",
                background: "#f0f0f0",
                border: "none",
                borderRadius: "0.8rem",
                cursor: "pointer",
              }}
            >
              {tr.cancel}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
