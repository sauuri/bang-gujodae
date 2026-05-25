"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Step {
  order: number;
  title: string;
  duration: string;
  reason: string;
}

interface CompareResult {
  changes: string[];
  praise: string;
  score: number;
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
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

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

  async function handleAfterImage(file: File) {
    if (!file.type.startsWith("image/")) return;
    const base64 = await new Promise<string>((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 512;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = url;
    });
    setAfterImage(base64);
    setCompareResult(null);
  }

  async function compare() {
    if (!afterImage || !result?.imageB64) return;
    setComparing(true);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beforeImage: result.imageB64, afterImage }),
      });
      const data = await res.json();
      setCompareResult(data);
    } catch {
      alert("비교 중 오류가 발생했어요.");
    } finally {
      setComparing(false);
    }
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

      {/* After 사진 비교 섹션 */}
      {anyDone && (
        <div className="ticket animate-fadeInUp" style={{ marginBottom: 14 }}>
          <div className="ticket-header">
            <div style={{ fontSize: 9, letterSpacing: 2, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>BEFORE / AFTER</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "white" }}>정리 후 사진 찍어줘요 📸</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 6, lineHeight: 1.6 }}>
              처음 사진과 <strong style={{ color: "#FFE066" }}>같은 방향, 같은 위치</strong>에서 찍어주세요.<br />
              얼마나 달라졌는지 AI가 찾아드릴게요.
            </div>
          </div>

          <div className="ticket-stub">
            {/* Before / After 나란히 */}
            {result.imageB64 && (
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 9, letterSpacing: 1.5, color: "#9ab8cc", marginBottom: 5 }}>BEFORE</div>
                  <img src={result.imageB64} alt="before" style={{ width: "100%", borderRadius: 8, objectFit: "cover", maxHeight: 130 }} />
                </div>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 9, letterSpacing: 1.5, color: "#9ab8cc", marginBottom: 5 }}>AFTER</div>
                  {afterImage ? (
                    <div style={{ position: "relative" }}>
                      <img src={afterImage} alt="after" style={{ width: "100%", borderRadius: 8, objectFit: "cover", maxHeight: 130 }} />
                      <button
                        onClick={() => { setAfterImage(null); setCompareResult(null); }}
                        style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", fontSize: 11 }}
                      >✕</button>
                    </div>
                  ) : (
                    <div
                      onClick={() => afterInputRef.current?.click()}
                      style={{
                        width: "100%", maxHeight: 130, minHeight: 80,
                        border: "2px dashed rgba(165,210,238,0.4)", borderRadius: 8,
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", background: "rgba(255,255,255,0.3)",
                      }}
                    >
                      <div style={{ fontSize: 22 }}>📷</div>
                      <div style={{ fontSize: 10, color: "#7facca", marginTop: 4 }}>탭해서 업로드</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <input
              ref={afterInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAfterImage(f); }}
            />

            {afterImage && !compareResult && (
              <button
                className="btn-primary"
                onClick={compare}
                disabled={comparing}
                style={{ marginBottom: 0 }}
              >
                {comparing ? "🔍 비교 중..." : "✨ 얼마나 달라졌는지 봐줘"}
              </button>
            )}

            {!afterImage && (
              <button
                onClick={() => afterInputRef.current?.click()}
                style={{
                  width: "100%", padding: "12px", borderRadius: 10,
                  border: "1.5px dashed rgba(165,210,238,0.5)",
                  background: "rgba(255,255,255,0.2)",
                  color: "#7facca", fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}
              >
                📸 정리 후 사진 올리기
              </button>
            )}

            {/* 비교 결과 */}
            {compareResult && (
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                {/* 점수 */}
                <div style={{ textAlign: "center", padding: "10px 0" }}>
                  <div style={{ fontSize: 9, letterSpacing: 2, color: "#9ab8cc", marginBottom: 6 }}>CLEAN SCORE</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 4 }}>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} style={{
                        width: 18, height: 18, borderRadius: "50%",
                        background: i < compareResult.score ? "#1DB4A8" : "rgba(165,210,238,0.2)",
                        transition: "background 0.2s",
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 13, color: "#1DB4A8", fontWeight: 700 }}>{compareResult.score}/10</div>
                </div>

                {/* 변화 */}
                <div>
                  <div style={{ fontSize: 9, letterSpacing: 1.5, color: "#9ab8cc", marginBottom: 6 }}>눈에 띄는 변화</div>
                  {compareResult.changes.map((c, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#4e6e82", marginBottom: 4, display: "flex", gap: 6 }}>
                      <span style={{ color: "#1DB4A8", flexShrink: 0 }}>✓</span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>

                {/* 칭찬 */}
                <div style={{
                  background: "linear-gradient(135deg, rgba(29,180,168,0.12), rgba(29,180,168,0.06))",
                  border: "1.5px solid rgba(29,180,168,0.3)",
                  borderRadius: 12, padding: "14px 16px",
                }}>
                  <div style={{ fontSize: 9, letterSpacing: 1.5, color: "#1DB4A8", marginBottom: 8 }}>AI 한마디</div>
                  <p style={{ fontSize: 13, color: "#2d5a4e", lineHeight: 1.8, margin: 0, fontWeight: 600 }}>
                    🎉 {compareResult.praise}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <button className="btn-primary animate-fadeInUp animate-delay-1" onClick={() => router.push("/")}>
        {allDone ? "🏠 방 구조 완료! 다음에 또 써요" : "📸 다른 방 분석하기"}
      </button>
    </main>
  );
}
