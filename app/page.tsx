"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SplashIntro from "./components/SplashIntro";
import RobotSprite from "./components/RobotSprite";

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

const LOADING_MSGS = [
  "방 상태 스캔 중...",
  "어지러움 수준 측정 중...",
  "정리 순서 계산 중...",
  "구조 작전 짜는 중...",
  "거의 다 됐어요...",
];

const ENERGY_EMOJI: Record<number, string> = {
  1: "😵", 2: "😩", 3: "😮‍💨", 4: "😐", 5: "🙂",
  6: "😊", 7: "💪", 8: "⚡", 9: "🔥", 10: "🚀",
};

export default function Home() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview]         = useState<string | null>(null);
  const [imageB64, setImageB64]       = useState<string | null>(null);
  const [energy, setEnergy]           = useState(5);
  const [timeLeft, setTimeLeft]       = useState("20분");
  const [loading, setLoading]         = useState(false);
  const [loadingMsg, setLoadingMsg]   = useState(LOADING_MSGS[0]);
  const [dragOver, setDragOver]       = useState(false);
  const [streak, setStreak]           = useState({ current: 0, best: 0 });
  const [historyCount, setHistoryCount] = useState(0);
  const [showSplash, setShowSplash]   = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem("bangStreak");
      if (s) setStreak(JSON.parse(s));
      const h = localStorage.getItem("bangHistory");
      if (h) setHistoryCount(JSON.parse(h).length);
      setShowSplash(true);
    } catch {}
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!loading) return;
    let i = 0;
    const iv = setInterval(() => {
      i = (i + 1) % LOADING_MSGS.length;
      setLoadingMsg(LOADING_MSGS[i]);
    }, 1800);
    return () => clearInterval(iv);
  }, [loading]);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const b64 = await resizeImage(file);
    setImageB64(b64);
    setPreview(b64);
  }

  async function handleSubmit() {
    if (!imageB64) return;
    setLoading(true);
    setLoadingMsg(LOADING_MSGS[0]);
    try {
      const res = await fetch("/api/rescue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: imageB64, timeLeft, energy }),
      });
      const data = await res.json();
      localStorage.setItem("rescueResult", JSON.stringify({ ...data, imageB64 }));
      router.push("/result");
    } catch {
      alert("오류가 발생했어요. 다시 시도해주세요.");
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
          background: "rgba(238,246,255,0.96)",
          backdropFilter: "blur(14px)",
          zIndex: 99,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20,
        }}>
          <RobotSprite pose="idle" size={110} />
          <div style={{ fontSize: 18, fontWeight: 900, color: "#1a2744" }}>방 구조 중</div>
          <div style={{ fontSize: 13, color: "#8DC870", transition: "all 0.4s" }}>{loadingMsg}</div>
          <div style={{ width: 160, height: 5, background: "#DBEFC7", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              background: "linear-gradient(90deg, #76C442, #5A9E30)",
              borderRadius: 4,
              animation: "progress 3s ease-in-out infinite",
            }} />
          </div>
          <style>{`
            @keyframes robotBounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-12px); }
            }
            @keyframes progress { 0%{width:0%} 80%{width:90%} 100%{width:90%} }
          `}</style>
        </div>
      )}

      <main style={{
        maxWidth: 440,
        margin: "0 auto",
        padding: "0 0 80px",
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
          }} />

          {/* 상단 바 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "rgba(255,255,255,0.22)",
              borderRadius: 50, padding: "5px 14px",
            }}>
              <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: 1.2, color: "white" }}>방구조대</span>
              <span style={{ fontSize: 16, lineHeight: 1 }}>🚨</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {streak.current > 0 && (
                <div style={{
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: 50, padding: "5px 12px",
                  fontSize: 12, fontWeight: 800, color: "white",
                }}>
                  🔥 {streak.current}일
                </div>
              )}
              {historyCount > 0 && (
                <div onClick={() => router.push("/history")} style={{
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: 50, padding: "5px 12px",
                  fontSize: 12, fontWeight: 800, color: "white", cursor: "pointer",
                }}>
                  📋 {historyCount}회
                </div>
              )}
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
                방 사진 찍으면<br />
                <span style={{ color: "#FFD54F" }}>지금 당장 할 것만</span><br />
                뽑아줄게요.
              </h1>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 6 }}>
                에너지랑 시간에 맞는 순서만.
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
            >
              {preview ? (
                <>
                  <img src={preview} alt="preview" style={{
                    width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 14,
                  }} />
                  <p style={{ marginTop: 6, fontSize: 11, color: "#bbb" }}>탭하면 교체</p>
                </>
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
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", marginBottom: 3 }}>방 사진 올리기</p>
                    <p style={{ fontSize: 11, color: "#c0c0c0" }}>탭하거나 드래그 · 자동 압축</p>
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
              <span style={{ fontSize: 12, fontWeight: 700, color: "#666" }}>지금 에너지</span>
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
              onChange={(e) => setEnergy(Number(e.target.value))}
              className="slider" />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: "#ccc" }}>방전 😵</span>
              <span style={{ fontSize: 10, color: "#ccc" }}>풀충전 🚀</span>
            </div>
          </div>

          {/* 시간 카드 */}
          <div className="card" style={{ padding: "14px 16px", marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#666", marginBottom: 10 }}>
              ⏱ 쓸 수 있는 시간
            </div>
            <div className="time-grid">
              {["10분", "20분", "30분", "1시간"].map((t) => (
                <button
                  key={t}
                  className={`time-btn${timeLeft === t ? " active" : ""}`}
                  onClick={() => setTimeLeft(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 출동 버튼 */}
          <button className="btn-main" onClick={handleSubmit} disabled={loading || !imageB64}>
            🚨 정리 순서 뽑기
          </button>
          {!imageB64 && (
            <p style={{ textAlign: "center", fontSize: 11, color: "#ccc", marginTop: 8 }}>
              사진을 먼저 올려주세요
            </p>
          )}

        </div>
      </main>
    </>
  );
}
