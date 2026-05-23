"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Step {
  order: number;
  title: string;
  duration: string;
  reason: string;
}

interface RescueResult {
  difficulty: "하" | "중" | "상";
  difficultyScore: number;
  summary: string;
  timeEstimate: string;
  steps: Step[];
  skip: string[];
  message: string;
  imageB64?: string;
}

const DIFF_CONFIG = {
  하: { color: "#1DB4A8", bg: "#F0FDFC", border: "#99F6E4", label: "가볍게 시작 가능" },
  중: { color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", label: "조금 시간 필요" },
  상: { color: "#E53935", bg: "#FFF5F5", border: "#FFCDD2", label: "단계별로 차근차근" },
};

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<RescueResult | null>(null);
  const [checked, setChecked] = useState<boolean[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("rescueResult");
    if (!raw) { router.replace("/"); return; }
    const data = JSON.parse(raw) as RescueResult;
    setResult(data);
    setChecked(new Array(data.steps?.length ?? 0).fill(false));
  }, [router]);

  if (!result) return null;

  const diff       = result.difficulty ?? "중";
  const diffStyle  = DIFF_CONFIG[diff] ?? DIFF_CONFIG["중"];
  const checkedCount = checked.filter(Boolean).length;
  const allDone    = checkedCount === result.steps.length;
  const anyDone    = checkedCount > 0;
  const progress   = result.steps.length > 0 ? Math.round((checkedCount / result.steps.length) * 100) : 0;

  function toggle(i: number) {
    const next = [...checked];
    next[i] = !next[i];
    setChecked(next);
  }

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 80px" }}>

      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <span className="flight-tag">🚨 방구조대</span>
        <button onClick={() => router.push("/")} style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.35)", color: "white", fontSize: 12, padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
          ← 다시 찍기
        </button>
      </div>

      {/* 메인 카드 */}
      <div className="ticket animate-fadeInUp" style={{ marginBottom: 14 }}>

        <div className="ticket-header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 2, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>ROOM RESCUE PLAN</div>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: diffStyle.bg, color: diffStyle.color,
                border: `1px solid ${diffStyle.border}`,
                padding: "5px 12px", borderRadius: 20,
              }}>
                <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                  <span style={{ fontSize: 12, fontWeight: 800 }}>난이도 {diff}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, opacity: 0.65 }}>{diffStyle.label}</span>
                </span>
              </span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>예상 시간</div>
              <div className="gauge" style={{ fontSize: 22, fontWeight: 900, color: diffStyle.color, lineHeight: 1 }}>{result.timeEstimate}</div>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
            {result.summary}
          </div>
        </div>

        {/* 사진 미리보기 */}
        {result.imageB64 && (
          <div style={{ background: "#f8fbff", padding: "10px 20px" }}>
            <img src={result.imageB64} alt="room" style={{ width: "100%", borderRadius: 10, maxHeight: 160, objectFit: "cover" }} />
          </div>
        )}

        {/* 분리선 */}
        <div className="ticket-tear" />

        {/* 정리 순서 */}
        <div className="ticket-stub">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div className="ticket-label">🧹 지금 할 순서</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: allDone ? "#1DB4A8" : "#9ab8cc" }}>
              {allDone ? "완료 🎉" : `${checkedCount}/${result.steps.length}`}
            </div>
          </div>

          {anyDone && (
            <div style={{ height: 3, background: "rgba(165,210,238,0.3)", borderRadius: 2, marginBottom: 12 }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "#1DB4A8", borderRadius: 2, transition: "width 0.3s" }} />
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {result.steps.map((step, i) => (
              <div key={i} onClick={() => toggle(i)} style={{
                padding: "12px 14px", borderRadius: 12, border: "1.5px solid", cursor: "pointer", transition: "all 0.2s",
                background: checked[i] ? "rgba(29,180,168,0.08)" : "rgba(255,255,255,0.55)",
                borderColor: checked[i] ? "#1DB4A8" : "rgba(165,210,238,0.5)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                      background: checked[i] ? "#1DB4A8" : "rgba(165,210,238,0.4)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 900,
                      color: checked[i] ? "white" : "#7facca",
                      transition: "all 0.2s",
                    }}>
                      {checked[i] ? "✓" : step.order}
                    </div>
                    <div>
                      <div style={{
                        fontWeight: 700, fontSize: 13,
                        textDecoration: checked[i] ? "line-through" : "none",
                        color: checked[i] ? "#9ab8cc" : "#1A1F36",
                      }}>
                        {step.title}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: "#FF6B35", background: "rgba(255,245,240,0.8)", border: "1px solid rgba(255,203,164,0.5)", padding: "2px 8px", borderRadius: 20, flexShrink: 0, marginLeft: 8 }}>
                    {step.duration}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "#7facca", marginTop: 5, marginLeft: 36 }}>
                  {step.reason}
                </div>
              </div>
            ))}
          </div>

          {anyDone && (
            <div style={{
              marginTop: 12, padding: "10px 16px",
              background: allDone ? "rgba(29,180,168,0.14)" : "rgba(29,180,168,0.07)",
              border: `1.5px solid ${allDone ? "#1DB4A8" : "rgba(29,180,168,0.3)"}`,
              borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#1DB4A8", transition: "all 0.3s",
            }}>
              {checkedCount === 1 && "✓ 시작했어요. 이게 제일 어려운 거예요."}
              {checkedCount === 2 && "✓✓ 흐름이 생기고 있어요."}
              {checkedCount >= 3 && !allDone && "✓✓✓ 거의 다 왔어요!"}
              {allDone && "🎉 다 했어요. 방이 숨 쉬기 시작했어요."}
            </div>
          )}
        </div>

        {/* 분리선 2 */}
        <div className="ticket-tear tear-stub" />

        {/* 오늘 안 해도 되는 것 + 바코드 */}
        <div className="ticket-stub" style={{ padding: "12px 20px" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div className="ticket-label">오늘 안 해도 되는 것</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
                {result.skip?.map((s, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#7facca", display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ color: "rgba(165,210,238,0.7)" }}>✕</span>
                    <span style={{ textDecoration: "line-through" }}>{s}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "#7facca", marginTop: 8, fontStyle: "italic" }}>
                {result.message}
              </div>
            </div>
            <div className="barcode" style={{ width: 48, flexShrink: 0, marginTop: 4 }} />
          </div>
          <div style={{ marginTop: 8, fontSize: 9, color: "#b8d5e8", letterSpacing: 1 }}>
            RRM-001 · 난이도 {diff} · {result.timeEstimate} · TODAY
          </div>
        </div>
      </div>

      <button className="btn-primary animate-fadeInUp animate-delay-1" onClick={() => router.push("/")}>
        {allDone ? "🏠 방 구조 완료! 다음에 또 써요" : "📸 다른 방 분석하기"}
      </button>
    </main>
  );
}
