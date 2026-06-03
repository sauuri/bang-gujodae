"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SplashIntro from "./components/SplashIntro";
import RobotSprite from "./components/RobotSprite";
import { hapticLight, hapticMedium } from "./utils/haptics";
import { useLang } from "./utils/LangContext";
// import { usePremium } from "./utils/PremiumContext"; // 유료화 중단 (2026-06-04)
import { t } from "./utils/i18n";
// import { initRevenueCat, isPremiumActive } from "./utils/RevenueCatService"; // 유료화 중단 (2026-06-04)

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
  // const { state: premiumState, canAnalyze, shouldShowModal, useAnalysis, upgrade } = usePremium(); // 유료화 중단 (2026-06-04)
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
  // const [showUpgradeModal, setShowUpgradeModal] = useState(false); // 유료화 중단 (2026-06-04)

  useEffect(() => {
    const init = async () => {
      try {
        const s = localStorage.getItem("bangStreak");
        if (s) setStreak(JSON.parse(s));
        const h = localStorage.getItem("bangHistory");
        if (h) setHistoryCount(JSON.parse(h).length);
        setShowSplash(true);

        // 유료화 중단 (2026-06-04)
        // if ((window as any).Capacitor?.isNativePlatform?.()) {
        //   await initRevenueCat();
        //   const active = await isPremiumActive();
        //   if (active) upgrade();
        // }
      } catch {}
      setInitialized(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (!timeLeft) setTimeLeft(tr.timeOptions[1]);
  }, [lang]);

  useEffect(() => {
    if (!loading) return;
    let i = 0;
    const msgs = tr.loadingMsgs;
    const iv = setInterval(() => { i = (i + 1) % msgs.length; setLoadingMsg(msgs[i]); }, 1800);
    const sv = setInterval(() => { setSweepDir(d => d === "walkRight" ? "walkLeft" : "walkRight"); }, 900);
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

    // 유료화 중단 (2026-06-04)
    // if (!canAnalyze()) {
    //   router.push("/upgrade");
    //   return;
    // }
    // if (shouldShowModal()) {
    //   setShowUpgradeModal(true);
    // }

    setLoading(true);
    setLoadingMsg(tr.loadingMsgs[0]);

    try {
      const res = await fetch("/api/rescue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: imageB64, timeLeft, energy, lang }),
      });
      const data = await res.json();
      // useAnalysis(); // 유료화 중단 (2026-06-04)
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

          {/* 상단 바 1줄: 앱이름 + 언어/Pro */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.22)", borderRadius: 50, padding: "5px 14px" }}>
              <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: 1.2, color: "white" }}>{tr.appName}</span>
              <span style={{ fontSize: 16, lineHeight: 1 }}>🚨</span>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button onClick={toggle} style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: 50, padding: "5px 12px", fontSize: 12, fontWeight: 800, color: "white", cursor: "pointer" }}>
                {lang === "ko" ? "EN" : "한"}
              </button>
              {/* 유료화 중단 (2026-06-04)
              <button
                onClick={() => router.push("/upgrade")}
                style={{
                  background: premiumState.isPremium ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.18)",
                  border: premiumState.isPremium ? "1.5px solid rgba(255,255,255,0.7)" : "1px solid rgba(255,255,255,0.3)",
                  borderRadius: 50, padding: "5px 12px",
                  fontSize: 12, fontWeight: 800, color: "white", cursor: "pointer",
                }}
              >
                {premiumState.isPremium ? "⭐ Pro" : "⭐ Pro"}
              </button>
              */}
            </div>
          </div>

          {/* 상단 바 2줄: 스트릭 / 히스토리 (있을 때만) */}
          {(streak.current > 0 || historyCount > 0) && (
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {streak.current > 0 && (
                <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 50, padding: "4px 10px", fontSize: 12, fontWeight: 800, color: "white" }}>
                  🔥 {streak.current}{tr.streakDays}
                </div>
              )}
              {historyCount > 0 && (
                <div onClick={() => router.push("/history")} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 50, padding: "4px 10px", fontSize: 12, fontWeight: 800, color: "white", cursor: "pointer" }}>
                  📋 {historyCount}{tr.times}
                </div>
              )}
            </div>
          )}

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
        <div style={{ padding: "0 16px", marginTop: 16 }}>

          {/* 유료화 중단 (2026-06-04)
          {!premiumState.isPremium && premiumState.freeAnalysisCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, padding: "8px 12px", background: "white", borderRadius: 10, border: "1px solid #E8F5E9" }}>
              <span style={{ fontSize: 12, color: "#888" }}>
                {lang === "ko" ? `무료 분석 ${10 - premiumState.freeAnalysisCount}회 남음` : `${10 - premiumState.freeAnalysisCount} free analyses left`}
              </span>
              <div style={{ display: "flex", gap: 3 }}>
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i < premiumState.freeAnalysisCount ? "#5A9E30" : "#E0E0E0" }} />
                ))}
              </div>
            </div>
          )}
          */}

          {/* 사진 업로드 */}
          <div style={{ marginBottom: 12 }}>
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
                  <img src={preview} alt="preview" style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.45)", color: "white", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, backdropFilter: "blur(4px)" }}>
                    {tr.tapReplace}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, flexShrink: 0, background: "#F2FBEA", border: "1.5px solid #B5DFA0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 26 }}>📸</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", marginBottom: 4 }}>{tr.uploadLabel}</p>
                    <p style={{ fontSize: 12, color: "#bbb", lineHeight: 1.4 }}>{tr.uploadSub}</p>
                  </div>
                </div>
              )}
              <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>
          </div>

          {/* 에너지 카드 */}
          <div className="card" style={{ padding: "16px", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#555" }}>{tr.energyLabel}</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: "#5A9E30" }}>
                {ENERGY_EMOJI[energy]}{" "}
                <span style={{ fontSize: 16, color: "#1a2744" }}>{energy}</span>
                <span style={{ fontSize: 12, color: "#bbb", fontWeight: 600 }}>/10</span>
              </span>
            </div>
            <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} style={{ flex: 1, height: 6, borderRadius: 4, background: i < energy ? "#76C442" : "#EEF7E6", transition: "background 0.2s" }} />
              ))}
            </div>
            <input type="range" min={1} max={10} value={energy}
              onChange={(e) => { const v = Number(e.target.value); if (v !== energy) { (v === 1 || v === 10) ? hapticMedium() : hapticLight(); } setEnergy(v); }}
              className="slider" />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: 11, color: "#bbb" }}>{tr.energyLow}</span>
              <span style={{ fontSize: 11, color: "#bbb" }}>{tr.energyFull}</span>
            </div>
          </div>

          {/* 시간 카드 */}
          <div className="card" style={{ padding: "16px", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#555", marginBottom: 12 }}>{tr.timeLabel}</div>
            <div className="time-grid">
              {tr.timeOptions.map((opt: string) => (
                <button key={opt} className={`time-btn${timeLeft === opt ? " active" : ""}`} onClick={() => { hapticLight(); setTimeLeft(opt); }}>
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
            <p style={{ textAlign: "center", fontSize: 12, color: "#bbb", marginTop: 8, lineHeight: 1.5 }}>
              {tr.uploadFirst}
            </p>
          )}

        </div>
      </main>

      {/* 유료화 중단 (2026-06-04)
      {showUpgradeModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 100 }}>
          <div style={{ width: "100%", background: "white", borderRadius: "20px 20px 0 0", padding: "24px 20px 40px" }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: "#2D5A2D", marginBottom: 8 }}>
              {lang === "ko"
                ? `무료 분석 ${10 - premiumState.freeAnalysisCount}회 남았어요`
                : `${10 - premiumState.freeAnalysisCount} free analyses left`}
            </h2>
            <p style={{ color: "#888", fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
              {lang === "ko"
                ? "AI 이미지 분석은 매 요청마다 비용이 발생합니다.\n프리미엄으로 업그레이드하면 무제한으로 사용할 수 있어요."
                : "AI analysis costs money per request.\nUpgrade to Premium for unlimited analyses."}
            </p>
            <button onClick={() => { setShowUpgradeModal(false); router.push("/upgrade"); }}
              style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #76C442, #5A9E30)", color: "white", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: "pointer", marginBottom: 8 }}>
              {lang === "ko" ? "프리미엄 시작하기" : "Upgrade to Premium"}
            </button>
            <button onClick={() => setShowUpgradeModal(false)}
              style={{ width: "100%", padding: "14px", background: "#f5f5f5", border: "none", borderRadius: 12, fontSize: 14, color: "#666", cursor: "pointer" }}>
              {lang === "ko" ? "나중에" : "Later"}
            </button>
          </div>
        </div>
      )}
      */}
    </>
  );
}
