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

function fmtSec(sec: number) {
  if (sec < 60) return `${sec}초`;
  return `${Math.round(sec / 60)}분`;
}

function fmtElapsed(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}초`;
  return `${Math.floor(s / 60)}분 ${s % 60}초`;
}

// 카테고리 선택 모달
function CategoryModal({ lang, onSelect }: { lang: string; onSelect: (cat: string) => void }) {
  const isEn = lang === "en";
  const cats = isEn
    ? [
        { emoji: "👕", label: "Clothes" },
        { emoji: "🥤", label: "Cups / Bottles" },
        { emoji: "🗑", label: "Trash" },
        { emoji: "📚", label: "Desk" },
        { emoji: "🛏", label: "Bed area" },
        { emoji: "😵", label: "No idea" },
      ]
    : [
        { emoji: "👕", label: "옷" },
        { emoji: "🥤", label: "컵 / 병" },
        { emoji: "🗑", label: "쓰레기" },
        { emoji: "📚", label: "책상" },
        { emoji: "🛏", label: "침대 주변" },
        { emoji: "😵", label: "모르겠음" },
      ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end" }}>
      <div style={{ width: "100%", background: "white", borderRadius: "20px 20px 0 0", padding: "28px 20px max(40px,env(safe-area-inset-bottom,40px))" }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: "#1a2744", textAlign: "center", marginBottom: 6 }}>
          {isEn ? "What's bothering you most?" : "지금 제일 거슬리는 건?"}
        </h2>
        <p style={{ fontSize: 13, color: "#aaa", textAlign: "center", marginBottom: 20 }}>
          {isEn ? "We'll match the mission to this." : "이걸 기준으로 미션을 골라드릴게요."}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {cats.map(c => (
            <button
              key={c.label}
              onClick={() => onSelect(c.label)}
              style={{
                padding: "16px 8px", borderRadius: 14,
                border: "1.5px solid #E8F5E9", background: "#F9FFF5",
                fontSize: 13, fontWeight: 800, color: "#1a2744",
                cursor: "pointer", display: "flex", flexDirection: "column",
                alignItems: "center", gap: 6,
              }}
            >
              <span style={{ fontSize: 22 }}>{c.emoji}</span>
              <span style={{ lineHeight: 1.3, textAlign: "center" }}>{c.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MissionPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { lang } = useLang();
  const isEn = lang === "en";

  const situation = (params.get("situation") ?? "quick") as Situation;
  const energy = Number(params.get("energy") ?? 3);
  const timeMinutes = Number(params.get("time") ?? 2);

  const [step, setStep] = useState<"category" | "mission">("category");
  const [category, setCategory] = useState<string>("");
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(false);
  const [breakdownChain, setBreakdownChain] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [count, setCount] = useState(0);
  const [startedAt, setStartedAt] = useState<number>(0);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [weekCount, setWeekCount] = useState(0);

  // 손님/책상/침대/자기전 모드는 카테고리 스킵
  useEffect(() => {
    if (situation !== "quick") {
      setStep("mission");
      fetchMission("", "");
    }
  }, []);

  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const weekKey = `bangWeek_${today.slice(0, 7)}`;
      setWeekCount(Number(localStorage.getItem(weekKey) ?? 0));
    } catch {}
  }, [done]);

  const fetchMission = useCallback(async (breakdown?: string, cat?: string) => {
    setLoading(true);
    setDone(false);
    try {
      const res = await fetch("/api/mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          situation, energy, timeMinutes, lang,
          breakdown,
          category: cat ?? category,
        }),
      });
      const data = await res.json();
      setMission(data);
      setStartedAt(Date.now());
    } catch {
      setMission({
        mission: isEn ? "Pick up the closest item on the floor." : "바닥에 가장 가까운 물건 하나 집기.",
        durationSec: 20,
        encouragement: isEn ? "You started. That's what matters." : "시작했어요. 그게 전부예요.",
        isBreakdown: !!breakdown,
      });
      setStartedAt(Date.now());
    } finally {
      setLoading(false);
    }
  }, [situation, energy, timeMinutes, lang, category]);

  function handleCategorySelect(cat: string) {
    hapticLight();
    setCategory(cat);
    setStep("mission");
    fetchMission("", cat);
  }

  function handleComplete() {
    hapticSuccess();
    const elapsed = Date.now() - startedAt;
    setElapsedMs(elapsed);
    setDone(true);
    setCount(c => c + 1);
    setBreakdownChain([]);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const raw = localStorage.getItem("bangMissions");
      const log = raw ? JSON.parse(raw) : [];
      log.unshift({ date: today, situation, category, mission: mission?.mission ?? "", elapsedMs: elapsed });
      localStorage.setItem("bangMissions", JSON.stringify(log.slice(0, 100)));
      const weekKey = `bangWeek_${today.slice(0, 7)}`;
      const week = Number(localStorage.getItem(weekKey) ?? 0);
      localStorage.setItem(weekKey, String(week + 1));
      setWeekCount(week + 1);
    } catch {}
  }

  function handleTooHard() {
    hapticLight();
    if (!mission) return;
    setBreakdownChain(prev => [...prev, mission.mission]);
    fetchMission(mission.mission, category);
  }

  function handleDifferent() {
    hapticLight();
    setBreakdownChain([]);
    fetchMission("", category);
  }

  function handleOneMore() {
    hapticMedium();
    setDone(false);
    setBreakdownChain([]);
    if (situation === "quick") {
      setStep("category");
      setCategory("");
    } else {
      fetchMission("", "");
    }
  }

  const situationLabel = SITUATION_LABEL[situation]?.[lang] ?? "";

  // ── 완료 화면 ──
  if (done) {
    const missionDone = mission?.mission ?? "";
    return (
      <div style={{
        minHeight: "100dvh",
        background: "linear-gradient(160deg, #1a3a0a 0%, #0d2208 100%)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "0 24px", textAlign: "center",
      }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
        <div style={{ fontSize: 26, fontWeight: 900, color: "white", marginBottom: 8 }}>
          {isEn ? "Rescued!" : "구조 성공!"}
        </div>

        {/* 성과 카드 */}
        <div style={{
          background: "rgba(255,255,255,0.08)",
          borderRadius: 18, padding: "18px 20px",
          marginBottom: 24, width: "100%", maxWidth: 320,
          border: "1px solid rgba(255,255,255,0.12)",
          textAlign: "left",
        }}>
          <div style={{ fontSize: 11, color: "rgba(118,196,66,0.8)", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>
            {isEn ? "TODAY'S RESCUE" : "오늘의 구조 성과"}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
            <span style={{ color: "#76C442", flexShrink: 0, marginTop: 1 }}>✅</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>{missionDone}</span>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 10, marginTop: 4, display: "flex", gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>{isEn ? "Time taken" : "걸린 시간"}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#76C442" }}>{fmtElapsed(elapsedMs)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>{isEn ? "This week" : "이번 주"}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#76C442" }}>{weekCount}{isEn ? "×" : "회"}</div>
            </div>
            {count > 1 && (
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>{isEn ? "Today" : "오늘"}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#76C442" }}>{count}{isEn ? "×" : "회"}</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ fontSize: 13, color: "rgba(118,196,66,0.8)", marginBottom: 32, lineHeight: 1.6, padding: "0 8px" }}>
          {mission?.encouragement}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 320 }}>
          <button onClick={handleOneMore} style={{ padding: "16px", borderRadius: 16, border: "none", background: "#76C442", color: "white", fontSize: 16, fontWeight: 900, cursor: "pointer" }}>
            {isEn ? "One more +" : "하나 더 +"}
          </button>
          <button onClick={() => router.push("/?fromMission=1")}
            style={{ padding: "14px", borderRadius: 16, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            {isEn ? "That's enough for today" : "오늘은 여기까지"}
          </button>
        </div>
      </div>
    );
  }

  // ── 로딩 ──
  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", background: "#F2FBEA", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ fontSize: 40, animation: "spin 1s linear infinite" }}>🧹</div>
        <div style={{ fontSize: 14, color: "#5A9E30", fontWeight: 700 }}>
          {isEn ? "Finding your mission…" : "미션 찾는 중…"}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── 카테고리 선택 ──
  if (step === "category") {
    return <CategoryModal lang={lang} onSelect={handleCategorySelect} />;
  }

  // ── 미션 화면 ──
  return (
    <div style={{ minHeight: "100dvh", background: "#F2FBEA", display: "flex", flexDirection: "column" }}>
      <div style={{
        padding: "max(16px, env(safe-area-inset-top, 16px)) 16px 12px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "linear-gradient(160deg, #76C442, #5A9E30)",
      }}>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: 0.85 }}>
          ← {isEn ? "Back" : "돌아가기"}
        </button>
        <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 800, color: "white" }}>
          {situationLabel}
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 700 }}>
          {ENERGY_EMOJI[energy]}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "28px 20px max(32px, env(safe-area-inset-bottom, 32px))", maxWidth: 480, margin: "0 auto", width: "100%" }}>

        {mission?.isBreakdown && (
          <div style={{ background: "#FFF8E1", border: "1px solid #FFD54F", borderRadius: 10, padding: "8px 14px", marginBottom: 16, fontSize: 12, color: "#E65100", fontWeight: 600 }}>
            {isEn ? "✨ Broken down into something smaller" : "✨ 더 작게 쪼갰어요"}
          </div>
        )}

        <div style={{
          background: "white", borderRadius: 24, padding: "32px 24px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5A9E30", letterSpacing: 1.5, marginBottom: 16 }}>
            {isEn ? "MISSION" : "지금 이것만"}
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#1a2744", lineHeight: 1.45, marginBottom: 20 }}>
            {mission?.mission}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: "#bbb" }}>⏱</span>
            <span style={{ fontSize: 12, color: "#bbb", fontWeight: 600 }}>
              {isEn ? `About ${fmtSec(mission?.durationSec ?? 30)}` : `약 ${fmtSec(mission?.durationSec ?? 30)}`}
            </span>
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: 13, color: "#888", marginBottom: 24, lineHeight: 1.6, padding: "0 8px" }}>
          {mission?.encouragement}
        </div>

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
            <button onClick={handleTooHard} style={{ flex: 1, padding: "14px", background: "white", border: "1.5px solid #e5e7eb", borderRadius: 14, fontSize: 13, fontWeight: 700, color: "#666", cursor: "pointer" }}>
              {isEn ? "Too hard" : "너무 어려워요"}
            </button>
            <button onClick={handleDifferent} style={{ flex: 1, padding: "14px", background: "white", border: "1.5px solid #e5e7eb", borderRadius: 14, fontSize: 13, fontWeight: 700, color: "#666", cursor: "pointer" }}>
              {isEn ? "Different" : "다른 미션"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MissionPage() {
  return (
    <Suspense>
      <MissionPageInner />
    </Suspense>
  );
}
