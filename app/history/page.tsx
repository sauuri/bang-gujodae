"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RobotSprite from "../components/RobotSprite";

interface HistoryEntry {
  date: string;
  messScore: number;
  summary: string;
  totalSteps: number;
  completedCount: number;
  imageB64?: string;
  afterImageB64?: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

function ScoreBadge({ score, prev }: { score: number; prev?: number }) {
  const color = score >= 70 ? "#ef4444" : score >= 40 ? "#f59e0b" : "#5A9E30";
  const bg    = score >= 70 ? "#fef2f2" : score >= 40 ? "#fffbeb" : "#DBEFC7";
  const diff  = prev !== undefined ? prev - score : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <div style={{ background: bg, borderRadius: 10, padding: "6px 12px", textAlign: "center", minWidth: 52 }}>
        <div style={{ fontSize: 18, fontWeight: 900, color }}>{score}</div>
        <div style={{ fontSize: 9, color, fontWeight: 700 }}>점수</div>
      </div>
      {diff !== null && diff !== 0 && (
        <div style={{ fontSize: 10, fontWeight: 700, color: diff > 0 ? "#5A9E30" : "#ef4444" }}>
          {diff > 0 ? `↓${diff}` : `↑${Math.abs(diff)}`}
        </div>
      )}
    </div>
  );
}

function Sparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) return null;
  const W = 120, H = 36, pad = 4;
  const min = Math.min(...scores), max = Math.max(...scores);
  const range = max - min || 1;
  const pts = scores.map((s, i) => {
    const x = pad + (i / (scores.length - 1)) * (W - pad * 2);
    const y = pad + ((s - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  const lastY = pad + ((scores[scores.length - 1] - min) / range) * (H - pad * 2);
  const lastX = W - pad;
  const trend = scores[scores.length - 1] < scores[0];
  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #DBEFC7" }}>
      <div style={{ fontSize: 11, color: "#aaa", marginBottom: 6, fontWeight: 600 }}>어지러움 점수 추이 (낮을수록 깨끗)</div>
      <svg width={W} height={H} style={{ overflow: "visible" }}>
        <polyline points={pts} fill="none" stroke="#B5DFA0" strokeWidth="1.5" strokeLinejoin="round" />
        <polyline points={pts} fill="none" stroke={trend ? "#5A9E30" : "#f59e0b"} strokeWidth="2" strokeLinejoin="round"
          strokeDasharray="200" strokeDashoffset="200" style={{ animation: "drawLine 1s ease forwards" }} />
        <circle cx={lastX} cy={lastY} r="4" fill={trend ? "#5A9E30" : "#f59e0b"} />
      </svg>
      <div style={{ fontSize: 11, color: trend ? "#5A9E30" : "#f59e0b", fontWeight: 700, marginTop: 4 }}>
        {trend ? "📉 점점 깨끗해지고 있어요!" : "📈 좀 어지러워졌네요"}
      </div>
      <style>{`@keyframes drawLine { to { stroke-dashoffset: 0; } }`}</style>
    </div>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [streak, setStreak]   = useState({ current: 0, best: 0 });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("bangHistory");
      if (raw) setHistory(JSON.parse(raw));
      const s = localStorage.getItem("bangStreak");
      if (s) setStreak(JSON.parse(s));
    } catch {}
  }, []);

  const avgScore  = history.length > 0
    ? Math.round(history.reduce((a, b) => a + (b.messScore ?? 0), 0) / history.length)
    : 0;
  const totalDone = history.reduce((a, b) => a + (b.completedCount ?? 0), 0);
  const scores    = [...history].reverse().map(h => h.messScore ?? 0);

  return (
    <main style={{ maxWidth: 460, margin: "0 auto", padding: "0 0 max(80px, calc(64px + env(safe-area-inset-bottom, 0px)))", background: "#F2FBEA", minHeight: "100vh" }}>

      {/* 헤더 */}
      <div style={{
        background: "linear-gradient(160deg, #76C442 0%, #5A9E30 100%)",
        padding: "44px 20px 28px",
        borderRadius: "0 0 28px 28px",
        marginBottom: 20,
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
      }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.4, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>방구조대</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "white", letterSpacing: -0.5 }}>
            📋 내 방 구조 기록
          </h1>
        </div>
        <button onClick={() => router.push("/")}
          style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", fontSize: 12, padding: "8px 16px", borderRadius: 20, cursor: "pointer", fontWeight: 700 }}>
          ← 뒤로
        </button>
      </div>

      <div style={{ padding: "0 20px" }}>

        {/* 통계 카드 */}
        <div className="card" style={{ padding: "20px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#ea580c" }}>🔥 {streak.current}</div>
              <div style={{ fontSize: 10, color: "#aaa", marginTop: 4 }}>현재 연속</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#5A9E30" }}>{history.length}</div>
              <div style={{ fontSize: 10, color: "#aaa", marginTop: 4 }}>총 구조 횟수</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#76C442" }}>{totalDone}</div>
              <div style={{ fontSize: 10, color: "#aaa", marginTop: 4 }}>완료한 할 일</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#FFB300" }}>{streak.best}</div>
              <div style={{ fontSize: 10, color: "#aaa", marginTop: 4 }}>최고 연속</div>
            </div>
          </div>

          {history.length > 1 && (
            <>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #DBEFC7", fontSize: 13, color: "#555", textAlign: "center" }}>
                평균 어지러움 점수 <strong style={{ color: "#5A9E30" }}>{avgScore}점</strong>
              </div>
              <Sparkline scores={scores} />
            </>
          )}
        </div>

        {/* 기록 리스트 */}
        {history.length === 0 ? (
          <div className="card" style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <RobotSprite pose="idle" size={80} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1a2744", marginBottom: 6 }}>아직 기록이 없어요</div>
            <div style={{ fontSize: 13, color: "#aaa", marginBottom: 24 }}>방 사진 찍고 정리 후 기록 저장을 눌러보세요</div>
            <button className="btn-main" onClick={() => router.push("/")}>
              🚨 지금 방 구조하러 가기
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {history.map((entry, i) => (
              <div key={i} className="card" style={{ padding: "16px 20px" }}>
                {/* 날짜 + 점수 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>{formatDate(entry.date)}</div>
                  <ScoreBadge score={entry.messScore ?? 0} prev={history[i + 1]?.messScore} />
                </div>

                {/* Before/After 이미지 */}
                {(entry.imageB64 || entry.afterImageB64) && (
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    {entry.imageB64 && (
                      <div style={{ flex: 1 }}>
                        {entry.afterImageB64 && <div style={{ fontSize: 9, color: "#aaa", fontWeight: 700, marginBottom: 3, textAlign: "center" }}>BEFORE</div>}
                        <img src={entry.imageB64} alt="before"
                          style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 10, display: "block" }} />
                      </div>
                    )}
                    {entry.afterImageB64 && (
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 9, color: "#5A9E30", fontWeight: 700, marginBottom: 3, textAlign: "center" }}>AFTER</div>
                        <img src={entry.afterImageB64} alt="after"
                          style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 10, display: "block" }} />
                      </div>
                    )}
                  </div>
                )}

                {/* 요약 + 완료 */}
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5, marginBottom: 6 }}>{entry.summary}</div>
                <div style={{ fontSize: 12, color: entry.completedCount === entry.totalSteps ? "#5A9E30" : "#aaa", fontWeight: 600 }}>
                  {entry.completedCount === entry.totalSteps ? "✅" : "📋"} {entry.completedCount}/{entry.totalSteps}개 완료
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
