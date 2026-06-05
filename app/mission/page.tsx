"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { hapticLight, hapticMedium, hapticSuccess } from "../utils/haptics";
import { useLang } from "../utils/LangContext";
import type { Situation } from "../api/mission/route";

interface Mission {
  mission: string;
  durationSec: number;
  encouragement: string;
  isBreakdown: boolean;
}

const SITUATION_LABEL: Record<string, { ko: string; en: string }> = {
  quick: { ko: "지금 하나만", en: "Just One Thing" },
  guest: { ko: "손님 와요", en: "Guest Coming" },
  desk:  { ko: "책상만 살려줘", en: "Desk Only" },
  bed:   { ko: "침대 탈출", en: "Bed Escape" },
  sleep: { ko: "자기 전 2분", en: "2-Min Reset" },
};

const ENERGY_EMOJI = ["", "😵", "😩", "😐", "🙂", "🔥"];

function fmt(sec: number) {
  if (sec < 60) return `${sec}초`;
  return `${Math.round(sec / 60)}분`;
}

function MissionPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { lang } = useLang();
  const isEn = lang === "en";

  const situation = (params.get("situation") ?? "quick") as Situation;
  const energy = Number(params.get("energy") ?? 3);
  const timeMinutes = Number(params.get("time") ?? 2);

  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [breakdownChain, setBreakdownChain] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [count, setCount] = useState(0); // 오늘 완료한 미션 수

  const fetchMission = useCallback(async (breakdown?: string) => {
    setLoading(true);
    setDone(false);
    try {
      const res = await fetch("/api/mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation, energy, timeMinutes, lang, breakdown }),
      });
      const data = await res.json();
      setMission(data);
    } catch {
      setMission({
        mission: isEn ? "Pick up the closest item on the floor." : "바닥에 가장 가까운 물건 하나 집기.",
        durationSec: 20,
        encouragement: isEn ? "You started. That's what matters." : "시작했어요. 그게 전부예요.",
        isBreakdown: !!breakdown,
      });
    } finally {
      setLoading(false);
    }
  }, [situation, energy, timeMinutes, lang]);

  useEffect(() => {
    fetchMission();
  }, [fetchMission]);

  function handleComplete() {
    hapticSuccess();
    setDone(true);
    setCount(c => c + 1);
    setBreakdownChain([]);
    // 스트릭/히스토리 업데이트
    try {
      const today = new Date().toISOString().slice(0, 10);
      const raw = localStorage.getItem("bangMissions");
      const log = raw ? JSON.parse(raw) : [];
      log.unshift({ date: today, situation, mission: mission?.mission ?? "" });
      localStorage.setItem("bangMissions", JSON.stringify(log.slice(0, 100)));

      // 주간 카운트
      const weekKey = `bangWeek_${today.slice(0, 7)}`;
      const week = Number(localStorage.getItem(weekKey) ?? 0);
      localStorage.setItem(weekKey, String(week + 1));
    } catch {}
  }

  function handleTooHard() {
    hapticLight();
    if (!mission) return;
    const chain = [...breakdownChain, mission.mission];
    setBreakdownChain(chain);
    fetchMission(mission.mission);
  }

  function handleDifferent() {
    hapticLight();
    setBreakdownChain([]);
    fetchMission();
  }

  function handleOneMore() {
    hapticMedium();
    setDone(false);
    setBreakdownChain([]);
    fetchMission();
  }

  const situationLabel = SITUATION_LABEL[situation]?.[lang] ?? "";

  // ── 완료 화면 ──────────────────────────────────────────────────
  if (done) {
    return (
      <div style={{
        minHeight: "100dvh",
        background: "linear-gradient(160deg, #1a3a0a 0%, #0d2208 100%)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "0 24px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: "white", marginBottom: 8 }}>
          {isEn ? "Rescued!" : "구조 성공!"}
        </div>
        {count > 1 && (
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>
            {isEn ? `${count} missions done today` : `오늘 ${count}개 완료`}
          </div>
        )}
        <div style={{ fontSize: 14, color: "rgba(118,196,66,0.9)", marginBottom: 48, fontWeight: 600 }}>
          {mission?.encouragement}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 320 }}>
          <button onClick={handleOneMore} style={btnStyle("#76C442", "white")}>
            {isEn ? "One more +" : "하나 더 +"}
          </button>
          <button
            onClick={() => router.push("/?fromMission=1")}
            style={btnStyle("rgba(255,255,255,0.1)", "rgba(255,255,255,0.7)", "1px solid rgba(255,255,255,0.15)")}
          >
            {isEn ? "That's enough for today" : "오늘은 여기까지"}
          </button>
        </div>
      </div>
    );
  }

  // ── 로딩 ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight: "100dvh",
        background: "#F2FBEA",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
      }}>
        <div style={{ fontSize: 40, animation: "spin 1s linear infinite" }}>🧹</div>
        <div style={{ fontSize: 14, color: "#5A9E30", fontWeight: 700 }}>
          {isEn ? "Finding your mission…" : "미션 찾는 중…"}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── 미션 화면 ─────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100dvh",
      background: "#F2FBEA",
      display: "flex", flexDirection: "column",
    }}>
      {/* 상단 바 */}
      <div style={{
        padding: "max(16px, env(safe-area-inset-top, 16px)) 16px 12px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "linear-gradient(160deg, #76C442, #5A9E30)",
      }}>
        <button
          onClick={() => router.push("/")}
          style={{ background: "none", border: "none", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: 0.85 }}
        >
          ← {isEn ? "Back" : "돌아가기"}
        </button>
        <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 800, color: "white" }}>
          {situationLabel}
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 700 }}>
          {ENERGY_EMOJI[energy]}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "32px 20px max(32px, env(safe-area-inset-bottom, 32px))", maxWidth: 480, margin: "0 auto", width: "100%" }}>

        {/* 브레이크다운 뱃지 */}
        {mission?.isBreakdown && (
          <div style={{ background: "#FFF8E1", border: "1px solid #FFD54F", borderRadius: 10, padding: "8px 14px", marginBottom: 20, fontSize: 12, color: "#E65100", fontWeight: 600 }}>
            {isEn ? "✨ Broken down into something smaller" : "✨ 더 작게 쪼갰어요"}
          </div>
        )}

        {/* 메인 미션 카드 */}
        <div style={{
          background: "white",
          borderRadius: 24,
          padding: "32px 24px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          flex: 1,
          display: "flex", flexDirection: "column", justifyContent: "center",
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5A9E30", letterSpacing: 1.5, marginBottom: 16 }}>
            {isEn ? "MISSION" : "지금 이것만"}
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#1a2744", lineHeight: 1.45, marginBottom: 24 }}>
            {mission?.mission}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: "#bbb", fontWeight: 600 }}>⏱</span>
            <span style={{ fontSize: 12, color: "#bbb", fontWeight: 600 }}>
              {isEn ? `About ${fmt(mission?.durationSec ?? 30)}` : `약 ${fmt(mission?.durationSec ?? 30)}`}
            </span>
          </div>
        </div>

        {/* 격려 문구 */}
        <div style={{ textAlign: "center", fontSize: 13, color: "#888", marginBottom: 28, lineHeight: 1.6, padding: "0 8px" }}>
          {mission?.encouragement}
        </div>

        {/* 버튼 3개 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={handleComplete} style={{
            width: "100%", padding: "18px",
            background: "linear-gradient(135deg, #76C442, #5A9E30)",
            color: "white", border: "none", borderRadius: 16,
            fontSize: 17, fontWeight: 900, cursor: "pointer",
            boxShadow: "0 4px 16px rgba(90,158,48,0.35)",
          }}>
            {isEn ? "✓ Done" : "✓ 완료했어요"}
          </button>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleTooHard} style={{
              flex: 1, padding: "14px",
              background: "white", border: "1.5px solid #e5e7eb",
              borderRadius: 14, fontSize: 13, fontWeight: 700,
              color: "#666", cursor: "pointer",
            }}>
              {isEn ? "Too hard" : "너무 어려워요"}
            </button>
            <button onClick={handleDifferent} style={{
              flex: 1, padding: "14px",
              background: "white", border: "1.5px solid #e5e7eb",
              borderRadius: 14, fontSize: 13, fontWeight: 700,
              color: "#666", cursor: "pointer",
            }}>
              {isEn ? "Different" : "다른 미션"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function btnStyle(bg: string, color: string, border?: string) {
  return {
    padding: "16px", borderRadius: 16, border: border ?? "none",
    background: bg, color, fontSize: 15, fontWeight: 800, cursor: "pointer",
    width: "100%",
  } as React.CSSProperties;
}

export default function MissionPage() {
  return (
    <Suspense>
      <MissionPageInner />
    </Suspense>
  );
}
