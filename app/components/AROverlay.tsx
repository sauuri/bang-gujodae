"use client";
import { useEffect, useRef, useState } from "react";
import { hapticLight, hapticMedium, hapticSuccess } from "../utils/haptics";

interface Step {
  order: number;
  title: string;
  duration: string;
  reason: string;
}

interface Props {
  steps: Step[];
  onClose: () => void;
}

export default function AROverlay({ steps, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [current, setCurrent] = useState(0);
  const [checked, setChecked] = useState<boolean[]>(new Array(steps.length).fill(false));
  const [camError, setCamError] = useState(false);
  const [entering, setEntering] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setEntering(false), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
        }
      })
      .catch(() => setCamError(true));
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function goNext() {
    if (current < steps.length - 1) {
      hapticLight();
      setCurrent((c) => c + 1);
    }
  }

  function goPrev() {
    if (current > 0) {
      hapticLight();
      setCurrent((c) => c - 1);
    }
  }

  function toggleCheck() {
    hapticMedium();
    setChecked((prev) => {
      const next = [...prev];
      next[current] = !next[current];
      return next;
    });
    if (!checked[current] && current < steps.length - 1) {
      setTimeout(() => {
        hapticSuccess();
        setCurrent((c) => c + 1);
      }, 400);
    }
  }

  const step = steps[current];
  const doneCount = checked.filter(Boolean).length;
  const allDone = doneCount === steps.length;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9500,
      background: "#000",
      transform: entering ? "scale(0.96)" : "scale(1)",
      opacity: entering ? 0 : 1,
      transition: "transform 0.25s ease, opacity 0.25s ease",
    }}>
      {/* 카메라 피드 */}
      {!camError ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #1a2744 0%, #0f1a2e 100%)" }} />
      )}

      {/* 어두운 상단 그라데이션 */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 30%, transparent 55%, rgba(0,0,0,0.75) 100%)", pointerEvents: "none" }} />

      {/* 상단 바 */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "env(safe-area-inset-top, 44px) 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "6px 14px" }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "white", letterSpacing: 0.5 }}>
              📸 AR 모드
            </span>
          </div>
          {camError && (
            <span style={{ fontSize: 11, color: "rgba(255,200,100,0.9)", fontWeight: 600 }}>카메라 없이 보기</span>
          )}
        </div>
        <button onClick={() => { hapticLight(); onClose(); }} style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "white", fontSize: 18, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>✕</button>
      </div>

      {/* 진행 점 */}
      <div style={{ position: "absolute", top: "calc(env(safe-area-inset-top, 44px) + 72px)", left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
        {steps.map((_, i) => (
          <div key={i} onClick={() => { hapticLight(); setCurrent(i); }} style={{
            width: i === current ? 20 : 8, height: 8, borderRadius: 4,
            background: checked[i] ? "#76C442" : i === current ? "white" : "rgba(255,255,255,0.35)",
            transition: "all 0.25s ease", cursor: "pointer",
          }} />
        ))}
      </div>

      {/* 완료 오버레이 */}
      {allDone && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "white", marginBottom: 8 }}>정리 완료!</div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", marginBottom: 32 }}>방구조 성공 🏆</div>
          <button onClick={() => { hapticSuccess(); onClose(); }} style={{
            padding: "16px 40px", borderRadius: 50,
            background: "linear-gradient(135deg, #76C442, #5A9E30)",
            border: "none", color: "white", fontSize: 16, fontWeight: 900, cursor: "pointer",
          }}>닫기</button>
        </div>
      )}

      {/* 하단 단계 카드 */}
      {!allDone && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: `0 16px calc(env(safe-area-inset-bottom, 24px) + 16px)`,
        }}>
          {/* 단계 카드 */}
          <div style={{
            background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)",
            borderRadius: 24, padding: "20px 20px 16px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
            marginBottom: 12,
          }}>
            {/* 단계 번호 + 완료 여부 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: checked[current] ? "#76C442" : "#1a2744",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 900, color: "white",
                }}>
                  {checked[current] ? "✓" : step.order}
                </div>
                <span style={{ fontSize: 11, color: "#999", fontWeight: 600 }}>{current + 1} / {steps.length}</span>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, color: "#76C442",
                background: "rgba(118,196,66,0.12)", borderRadius: 20, padding: "3px 10px",
              }}>⏱ {step.duration}</span>
            </div>

            {/* 단계 제목 */}
            <div style={{ fontSize: 18, fontWeight: 900, color: "#1a2744", marginBottom: 6, lineHeight: 1.3 }}>
              {step.title}
            </div>
            <div style={{ fontSize: 13, color: "#666", lineHeight: 1.5 }}>{step.reason}</div>

            {/* 완료 버튼 */}
            <button
              onClick={toggleCheck}
              style={{
                width: "100%", marginTop: 14, padding: "13px",
                borderRadius: 14, border: "none", cursor: "pointer",
                background: checked[current]
                  ? "rgba(118,196,66,0.15)"
                  : "linear-gradient(135deg, #1a2744, #2d4a8a)",
                color: checked[current] ? "#5A9E30" : "white",
                fontSize: 15, fontWeight: 900,
                transition: "all 0.2s",
              }}
            >
              {checked[current] ? "✓ 완료됨" : "완료 ✓"}
            </button>
          </div>

          {/* 이전/다음 */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={goPrev}
              disabled={current === 0}
              style={{
                flex: 1, padding: "13px", borderRadius: 14, border: "none", cursor: current === 0 ? "default" : "pointer",
                background: current === 0 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.2)",
                backdropFilter: "blur(8px)",
                color: current === 0 ? "rgba(255,255,255,0.3)" : "white",
                fontSize: 14, fontWeight: 700,
              }}
            >
              ← 이전
            </button>
            <button
              onClick={goNext}
              disabled={current === steps.length - 1}
              style={{
                flex: 1, padding: "13px", borderRadius: 14, border: "none",
                cursor: current === steps.length - 1 ? "default" : "pointer",
                background: current === steps.length - 1 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.85)",
                backdropFilter: "blur(8px)",
                color: current === steps.length - 1 ? "rgba(255,255,255,0.3)" : "#1a2744",
                fontSize: 14, fontWeight: 700,
              }}
            >
              다음 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
