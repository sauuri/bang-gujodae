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

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "#ef4444" : score >= 40 ? "#f59e0b" : "#5A9E30";
  const bg    = score >= 70 ? "#fef2f2" : score >= 40 ? "#fffbeb" : "#DBEFC7";
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

  return (
    <main style={{ maxWidth: 460, margin: "0 auto", padding: "0 0 80px", background: "#F2FBEA", minHeight: "100vh" }}>

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
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #DBEFC7", fontSize: 13, color: "#555", textAlign: "center" }}>
              평균 어지러움 점수 <strong style={{ color: "#5A9E30" }}>{avgScore}점</strong>
            </div>
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
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  {entry.afterImageB64 || entry.imageB64 ? (
                    <img
                      src={entry.afterImageB64 ?? entry.imageB64}
                      alt="room"
                      style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover", flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: 64, height: 64, borderRadius: 12, background: "#F2FBEA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>🏠</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600 }}>{entry.date}</div>
                      <ScoreBadge score={entry.messScore ?? 0} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1a2744", marginBottom: 5, lineHeight: 1.4 }}>{entry.summary}</div>
                    <div style={{ fontSize: 12, color: entry.completedCount === entry.totalSteps ? "#5A9E30" : "#aaa" }}>
                      {entry.completedCount === entry.totalSteps ? "✅" : "📋"} {entry.completedCount}/{entry.totalSteps}개 완료
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
