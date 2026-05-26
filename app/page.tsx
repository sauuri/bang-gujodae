"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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

const ONBOARDING_STEPS = [
  { emoji: "📸", title: "방 사진을 찍어요", desc: "전체 방이 보이게 찍으면 더 정확해요.\n어두워도 괜찮아요." },
  { emoji: "⚡", title: "에너지랑 시간 입력", desc: "지금 상태에 맞게 AI가\n딱 맞는 순서를 뽑아줘요." },
  { emoji: "🧹", title: "지금 당장 할 것만", desc: "전부 다 하라는 게 아니에요.\n오늘 할 수 있는 것만." },
];

export default function Home() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview]     = useState<string | null>(null);
  const [imageB64, setImageB64]   = useState<string | null>(null);
  const [energy, setEnergy]       = useState(5);
  const [timeLeft, setTimeLeft]   = useState("20분");
  const [loading, setLoading]     = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MSGS[0]);
  const [dragOver, setDragOver]   = useState(false);
  const [streak, setStreak]       = useState({ current: 0, best: 0 });
  const [historyCount, setHistoryCount] = useState(0);
  const [showOnboard, setShowOnboard] = useState(false);
  const [onboardStep, setOnboardStep] = useState(0);

  useEffect(() => {
    try {
      const s = localStorage.getItem("bangStreak");
      if (s) setStreak(JSON.parse(s));
      const h = localStorage.getItem("bangHistory");
      if (h) setHistoryCount(JSON.parse(h).length);
      const seen = localStorage.getItem("bangOnboarded");
      if (!seen) setShowOnboard(true);
    } catch {}
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

  function finishOnboard() {
    localStorage.setItem("bangOnboarded", "1");
    setShowOnboard(false);
  }

  return (
    <>
      {/* 온보딩 오버레이 */}
      {showOnboard && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: "36px 28px", maxWidth: 360, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>{ONBOARDING_STEPS[onboardStep].emoji}</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: "#111", marginBottom: 10 }}>
              {ONBOARDING_STEPS[onboardStep].title}
            </h2>
            <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.8, whiteSpace: "pre-line", marginBottom: 28 }}>
              {ONBOARDING_STEPS[onboardStep].desc}
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 24 }}>
              {ONBOARDING_STEPS.map((_, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i === onboardStep ? "#16a34a" : "#e5e7eb" }} />
              ))}
            </div>
            {onboardStep < ONBOARDING_STEPS.length - 1 ? (
              <button onClick={() => setOnboardStep(s => s + 1)}
                style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "#16a34a", color: "white", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
                다음 →
              </button>
            ) : (
              <button onClick={finishOnboard}
                style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "#16a34a", color: "white", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
                🚨 시작하기
              </button>
            )}
          </div>
        </div>
      )}

      {/* 로딩 오버레이 */}
      {loading && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(255,255,255,0.92)", zIndex: 99,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20,
        }}>
          <div style={{ fontSize: 64, animation: "spin 1.5s linear infinite" }}>🚨</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#16a34a" }}>방 구조 중</div>
          <div style={{ fontSize: 14, color: "#6b7280", transition: "all 0.4s" }}>{loadingMsg}</div>
          <div style={{ width: 180, height: 4, background: "#e5e7eb", borderRadius: 4, overflow: "hidden", marginTop: 8 }}>
            <div style={{ height: "100%", background: "#16a34a", borderRadius: 4, animation: "progress 3s ease-in-out infinite" }} />
          </div>
          <style>{`
            @keyframes spin { 0%{transform:rotate(-10deg)} 50%{transform:rotate(10deg)} 100%{transform:rotate(-10deg)} }
            @keyframes progress { 0%{width:0%} 80%{width:90%} 100%{width:90%} }
          `}</style>
        </div>
      )}

      <main style={{ maxWidth: 460, margin: "0 auto", padding: "40px 20px 80px" }}>

        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#dcfce7", borderRadius: 50, padding: "5px 14px", marginBottom: 14 }}>
              <span style={{ fontSize: 14 }}>🚨</span>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: "#16a34a" }}>방구조대</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.35, color: "#111", marginBottom: 8 }}>
              방 사진 찍으면<br />
              <span style={{ color: "#16a34a" }}>지금 당장 할 것만</span><br />
              뽑아줄게요.
            </h1>
            <p style={{ fontSize: 13, color: "#8e8e93", lineHeight: 1.7 }}>다 하라는 게 아니에요. 에너지랑 시간에 맞는 순서만.</p>
          </div>
        </div>

        {/* 스트릭 / 기록 배지 */}
        {(streak.current > 0 || historyCount > 0) && (
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {streak.current > 0 && (
              <div style={{ flex: 1, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 14, padding: "10px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#ea580c" }}>🔥 {streak.current}일</div>
                <div style={{ fontSize: 10, color: "#9a3412", fontWeight: 700, marginTop: 2 }}>연속 구조 중</div>
              </div>
            )}
            {historyCount > 0 && (
              <div onClick={() => router.push("/history")} style={{ flex: 1, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 14, padding: "10px 14px", textAlign: "center", cursor: "pointer" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#16a34a" }}>{historyCount}번</div>
                <div style={{ fontSize: 10, color: "#166534", fontWeight: 700, marginTop: 2 }}>방 구조 완료 →</div>
              </div>
            )}
          </div>
        )}

        {/* 사진 업로드 */}
        <div style={{ marginBottom: 14 }}>
          <div
            className={`upload-zone${dragOver ? " drag-over" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          >
            {preview ? (
              <>
                <img src={preview} alt="preview" style={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: 12 }} />
                <p style={{ marginTop: 10, fontSize: 12, color: "#8e8e93" }}>탭하면 교체</p>
              </>
            ) : (
              <>
                <div style={{ fontSize: 58, marginBottom: 14 }}>📸</div>
                <p style={{ fontSize: 16, fontWeight: 900, color: "#16a34a", marginBottom: 6 }}>방 사진 올리기</p>
                <p style={{ fontSize: 13, color: "#6b7280" }}>탭하거나 드래그 · 자동 압축</p>
              </>
            )}
            <input ref={inputRef} type="file" accept="image/*" capture="environment"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        </div>

        {/* 에너지 + 시간 */}
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #f0f0f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#8e8e93" }}>지금 에너지</span>
              <span style={{ fontSize: 28, fontWeight: 900, color: "#16a34a", lineHeight: 1 }}>
                {energy}<span style={{ fontSize: 14, color: "#ccc", fontWeight: 600 }}>/10</span>
              </span>
            </div>
            <input type="range" min={1} max={10} value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))} className="slider" />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 11, color: "#ccc" }}>방전 😮‍💨</span>
              <span style={{ fontSize: 11, color: "#ccc" }}>충전 ⚡</span>
            </div>
          </div>
          <div style={{ padding: "16px 20px 20px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#8e8e93", marginBottom: 12 }}>쓸 수 있는 시간</div>
            <div className="time-grid">
              {["10분", "20분", "30분", "1시간"].map((t) => (
                <button key={t} className={`time-btn${timeLeft === t ? " active" : ""}`}
                  onClick={() => setTimeLeft(t)}>{t}</button>
              ))}
            </div>
          </div>
        </div>

        {/* 출동 버튼 */}
        <button className="btn-main" onClick={handleSubmit} disabled={loading || !imageB64}>
          🚨 정리 순서 뽑기
        </button>
        {!imageB64 && (
          <p style={{ textAlign: "center", fontSize: 12, color: "#ccc", marginTop: 10 }}>사진을 먼저 올려주세요</p>
        )}

      </main>
    </>
  );
}
