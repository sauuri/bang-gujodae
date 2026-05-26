"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface HistoryEntry {
  date: string;
  messScore: number;
  summary: string;
  totalSteps: number;
  completedCount: number;
  imageB64?: string;
  afterImageB64?: string;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "#ef4444" : score >= 40 ? "#f59e0b" : "#16a34a";
  const bg = score >= 70 ? "#fef2f2" : score >= 40 ? "#fffbeb" : "#f0fdf4";
  return (
    <div style={{ background: bg, borderRadius: 10, padding: "6px 12px", textAlign: "center", minWidth: 52 }}>
      <div style={{ fontSize: 18, fontWeight: 900, color }}>{score}</div>
      <div style={{ fontSize: 9, color, fontWeight: 700 }}>점수</div>
    </div>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [streak, setStreak] = useState({ current: 0, best: 0 });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("bangHistory");
      if (raw) setHistory(JSON.parse(raw));
      const s = localStorage.getItem("bangStreak");
      if (s) setStreak(JSON.parse(s));
    } catch {}
  }, []);

  const avgScore = history.length > 0
    ? Math.round(history.reduce((a, b) => a + (b.messScore ?? 0), 0) / history.length)
    : 0;
  const totalDone = history.reduce((a, b) => a + (b.completedCount ?? 0), 0);

  return (
    <main style={{ maxWidth: 460, margin: "0 auto", padding: "40px 20px 80px" }}>

      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#dcfce7", borderRadius: 50, padding: "5px 14px", marginBottom: 10 }}>
            <span style={{ fontSize: 14 }}>📋</span>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: "#16a34a" }}>정리 기록</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#111" }}>내 방 구조 히스토리</h1>
        </div>
        <button onClick={() => router.push("/")}
          style={{ background: "#f3f4f6", border: "none", color: "#6b7280", fontSize: 12, padding: "8px 14px", borderRadius: 20, cursor: "pointer", fontWeight: 700 }}>
          ← 뒤로
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="card" style={{ padding: "20px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#ea580c" }}>🔥{streak.current}</div>
            <div style={{ fontSize: 11, color: "#8e8e93", marginTop: 2 }}>현재 연속</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#16a34a" }}>{history.length}</div>
            <div style={{ fontSize: 11, color: "#8e8e93", marginTop: 2 }}>총 구조 횟수</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#6366f1" }}>{totalDone}</div>
            <div style={{ fontSize: 11, color: "#8e8e93", marginTop: 2 }}>완료한 할 일</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#f59e0b" }}>{streak.best}</div>
            <div style={{ fontSize: 11, color: "#8e8e93", marginTop: 2 }}>최고 연속</div>
          </div>
        </div>
        {history.length > 1 && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #f0f0f0", fontSize: 13, color: "#374151", textAlign: "center" }}>
            평균 어지러움 점수 <strong style={{ color: "#16a34a" }}>{avgScore}점</strong>
          </div>
        )}
      </div>

      {/* 기록 리스트 */}
      {history.length === 0 ? (
        <div className="card" style={{ padding: "40px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏠</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#111", marginBottom: 6 }}>아직 기록이 없어요</div>
          <div style={{ fontSize: 13, color: "#8e8e93" }}>방 사진 찍고 정리 후 기록 저장을 눌러보세요</div>
          <button className="btn-main" onClick={() => router.push("/")} style={{ marginTop: 20 }}>
            🚨 지금 방 구조하러 가기
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {history.map((entry, i) => (
            <div key={i} className="card" style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                {entry.afterImageB64 || entry.imageB64 ? (
                  <img
                    src={entry.afterImageB64 ?? entry.imageB64}
                    alt="room"
                    style={{ width: 60, height: 60, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: 60, height: 60, borderRadius: 10, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>🏠</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div style={{ fontSize: 12, color: "#8e8e93" }}>{entry.date}</div>
                    <ScoreBadge score={entry.messScore ?? 0} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111", marginBottom: 4, lineHeight: 1.4 }}>{entry.summary}</div>
                  <div style={{ fontSize: 12, color: entry.completedCount === entry.totalSteps ? "#16a34a" : "#8e8e93" }}>
                    {entry.completedCount === entry.totalSteps ? "✅" : "📋"} {entry.completedCount}/{entry.totalSteps}개 완료
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </main>
  );
}
