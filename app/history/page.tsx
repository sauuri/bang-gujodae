"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "../utils/LangContext";
// import { usePremium } from "../utils/PremiumContext"; // 유료화 중단 (2026-06-04)
import { t } from "../utils/i18n";

interface HistoryEntry {
  date: string;
  messScore: number;
  summary: string;
  totalSteps: number;
  completedCount: number;
  imageB64?: string;
  afterImageB64?: string;
}

function Sparkline({ data, tr }: { data: HistoryEntry[]; tr: ReturnType<typeof t> }) {
  if (data.length < 2) return null;
  const scores = [...data].reverse().map(d => d.messScore ?? 0);
  const max = Math.max(...scores, 100), min = Math.min(...scores, 0);
  const range = max - min || 1;
  const w = 280, h = 50;
  const pts = scores.map((s, i) => {
    const x = (i / (scores.length - 1)) * w;
    const y = h - ((s - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  const trend = scores[scores.length - 1] <= scores[0];
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "16px 18px", marginBottom: 16, border: "1px solid #eee" }}>
      <div style={{ fontSize: 11, color: "#aaa", marginBottom: 6, fontWeight: 600 }}>{tr.trendTitle}</div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block" }}>
        <polyline points={pts} fill="none" stroke={trend ? "#76C442" : "#f59e0b"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ fontSize: 11, color: trend ? "#5A9E30" : "#f59e0b", marginTop: 6, fontWeight: 700, textAlign: "center" }}>
        {trend ? tr.trendUp : tr.trendDown}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const { lang } = useLang();
  // const { state: premiumState } = usePremium(); // 유료화 중단 (2026-06-04)
  const tr = t(lang);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("bangHistory");
      if (raw) {
        const allHistory = JSON.parse(raw);
        // 유료화 중단 (2026-06-04) — 전체 기록 표시
        // const limitedHistory = premiumState.isPremium ? allHistory : allHistory.slice(0, 7);
        setHistory(allHistory);
      }
    } catch {}
  }, []);

  const totalRescues = history.length;
  const totalCompleted = history.reduce((s, h) => s + (h.completedCount ?? 0), 0);
  const avgScore = history.length ? Math.round(history.reduce((s, h) => s + (h.messScore ?? 0), 0) / history.length) : 0;

  function getStreak() {
    try {
      const raw = localStorage.getItem("bangStreak");
      return raw ? JSON.parse(raw) : { current: 0, best: 0 };
    } catch { return { current: 0, best: 0 }; }
  }
  const streak = getStreak();

  function clearHistory() {
    localStorage.removeItem("bangHistory");
    setHistory([]);
    setShowConfirm(false);
  }

  return (
    <main style={{ maxWidth: 460, margin: "0 auto", padding: "0 0 40px", background: "#F2FBEA", minHeight: "100vh" }}>
      <div style={{
        background: "linear-gradient(160deg, #76C442 0%, #5A9E30 100%)",
        padding: "44px 20px 24px", borderRadius: "0 0 28px 28px", marginBottom: 16,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.4, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>{tr.appName}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "white" }}>{tr.historyTitle}</div>
          </div>
          <button onClick={() => router.push("/")}
            style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", fontSize: 12, padding: "8px 16px", borderRadius: 20, cursor: "pointer", fontWeight: 700 }}>
            {tr.historyBack}
          </button>
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: tr.statCurrentStreak, value: `${streak.current}${tr.streakDays}`, icon: "🔥" },
            { label: tr.statTotalRescue, value: `${totalRescues}${tr.times}`, icon: "🚨" },
            { label: tr.statCompleted, value: `${totalCompleted}`, icon: "✅" },
            { label: tr.statBestStreak, value: `${streak.best ?? 0}${tr.streakDays}`, icon: "🏆" },
          ].map((stat, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "16px", textAlign: "center", border: "1px solid #eee" }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{stat.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#1a2744" }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: "#aaa", marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {history.length >= 2 && <Sparkline data={history} tr={tr} />}

        {history.length > 0 && (
          <div style={{ background: "#DBEFC7", borderRadius: 12, padding: "12px 16px", marginBottom: 16, textAlign: "center" }}>
            <span style={{ fontSize: 13, color: "#5A9E30", fontWeight: 600 }}>
              {tr.avgScorePrefix} <strong style={{ color: "#5A9E30" }}>{avgScore}{tr.avgScoreSuffix}</strong>
            </span>
          </div>
        )}

        {history.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>📋</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1a2744", marginBottom: 6 }}>{tr.historyEmpty}</div>
            <div style={{ fontSize: 13, color: "#aaa", marginBottom: 24 }}>{tr.historyEmptySub}</div>
            <button onClick={() => router.push("/")}
              style={{ background: "#76C442", color: "white", border: "none", padding: "14px 28px", borderRadius: 14, fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
              {tr.historyGoRescue}
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <button onClick={() => setShowConfirm(true)}
                style={{ background: "none", border: "none", color: "#ef4444", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                {tr.historyDelete}
              </button>
            </div>
            {history.map((entry, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "16px", marginBottom: 10, border: "1px solid #eee" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#1a2744" }}>{tr.dateFormat(new Date(entry.date))}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: entry.messScore >= 70 ? "#ef4444" : entry.messScore >= 40 ? "#f59e0b" : "#16a34a" }}>
                    {entry.messScore} {tr.scoreShort}
                  </span>
                </div>
                {(entry.imageB64 || entry.afterImageB64) && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    {entry.imageB64 && <img src={entry.imageB64} alt="before" style={{ flex: 1, width: "100%", borderRadius: 10, objectFit: "cover", maxHeight: 120 }} />}
                    {entry.afterImageB64 && <img src={entry.afterImageB64} alt="after" style={{ flex: 1, width: "100%", borderRadius: 10, objectFit: "cover", maxHeight: 120 }} />}
                  </div>
                )}
                <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6, marginBottom: 8 }}>{entry.summary}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#5A9E30" }}>
                  {entry.completedCount === entry.totalSteps ? "✅" : "📋"} {tr.doneCount(entry.completedCount, entry.totalSteps)}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "24px 20px", maxWidth: 320, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1a2744", marginBottom: 8 }}>{tr.deleteConfirmTitle}</div>
            <div style={{ fontSize: 13, color: "#aaa", marginBottom: 20 }}>{tr.deleteConfirmSub}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowConfirm(false)}
                style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", color: "#555", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                {tr.cancel}
              </button>
              <button onClick={clearHistory}
                style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "#ef4444", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                {tr.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
