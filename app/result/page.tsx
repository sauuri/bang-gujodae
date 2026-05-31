"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { hapticLight, hapticMedium, hapticHeavy, hapticSuccess } from "../utils/haptics";

function playSfxCompare() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // 밝은 3음 팡파레
    [523, 659, 784].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine"; o.frequency.value = freq;
      const t = ctx.currentTime + i * 0.1;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.18, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      o.start(t); o.stop(t + 0.4);
    });
  } catch {}
}

function playSfxCheck(checked: boolean) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = "sine";
    if (checked) {
      // 체크 ON: 경쾌한 상승음
      o.frequency.setValueAtTime(440, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      o.start(); o.stop(ctx.currentTime + 0.2);
    } else {
      // 체크 OFF: 낮아지는 음
      o.frequency.setValueAtTime(440, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
      g.gain.setValueAtTime(0.1, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      o.start(); o.stop(ctx.currentTime + 0.15);
    }
  } catch {}
}
import RobotSprite from "../components/RobotSprite";
import CleaningEnding from "../components/CleaningEnding";

interface Step { order: number; title: string; duration: string; reason: string; }
interface CompareResult { changes: string[]; praise: string; score: number; }
interface RescueResult {
  messScore: number;
  difficulty: "하" | "중" | "상";
  difficultyScore: number;
  summary: string;
  timeEstimate: string;
  steps: Step[];
  skip: string[];
  message: string;
  imageB64?: string;
}

function getStreak() {
  try {
    const raw = localStorage.getItem("bangStreak");
    if (!raw) return { current: 0, best: 0, lastDate: "" };
    return JSON.parse(raw);
  } catch { return { current: 0, best: 0, lastDate: "" }; }
}

function updateStreak() {
  const today = new Date().toISOString().slice(0, 10);
  const s = getStreak();
  if (s.lastDate === today) return s;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const current = s.lastDate === yesterday ? s.current + 1 : 1;
  const best = Math.max(current, s.best || 0);
  const next = { current, best, lastDate: today };
  localStorage.setItem("bangStreak", JSON.stringify(next));
  return next;
}

function saveHistory(result: RescueResult, completedCount: number, afterImageB64?: string) {
  const today = new Date().toISOString().slice(0, 10);
  const entry = {
    date: today,
    messScore: result.messScore ?? 0,
    summary: result.summary,
    totalSteps: result.steps.length,
    completedCount,
    imageB64: result.imageB64,
    afterImageB64,
  };
  try {
    const raw = localStorage.getItem("bangHistory");
    const history = raw ? JSON.parse(raw) : [];
    history.unshift(entry);
    localStorage.setItem("bangHistory", JSON.stringify(history.slice(0, 30)));
  } catch {}
}

function MessScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? "#ef4444" : score >= 40 ? "#f59e0b" : "#16a34a";
  const label = score >= 70 ? "많이 어지러워요" : score >= 40 ? "조금 어지러워요" : "꽤 깨끗해요";
  const r = 36, circ = 2 * Math.PI * r;
  const dash = circ * (1 - score / 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg width="88" height="88" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="44" cy="44" r={r} fill="none" stroke="#e5e7eb" strokeWidth="7" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={circ} strokeDashoffset={dash}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
        <text x="44" y="44" textAnchor="middle" dominantBaseline="central"
          style={{ transform: "rotate(90deg) translate(0px,-88px)", fontSize: 18, fontWeight: 900, fill: color, fontFamily: "inherit" }}>
          {score}
        </text>
      </svg>
      <div>
        <div style={{ fontSize: 11, color: "#8e8e93", marginBottom: 4 }}>어지러움 점수</div>
        <div style={{ fontSize: 15, fontWeight: 800, color }}>{label}</div>
        <div style={{ fontSize: 12, color: "#8e8e93", marginTop: 2 }}>0 = 완벽 · 100 = 혼돈</div>
      </div>
    </div>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<RescueResult | null>(null);
  const [checked, setChecked] = useState<boolean[]>([]);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [streak, setStreak] = useState({ current: 0, best: 0 });
  const [showEnding, setShowEnding] = useState(false);
  const [endingTriggered, setEndingTriggered] = useState(false);
  const [doneFlash, setDoneFlash] = useState(false);
  const prevAllDoneRef = useRef(false);
  const afterInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem("rescueResult");
    if (!raw) { router.replace("/"); return; }
    const data = JSON.parse(raw) as RescueResult;
    setResult(data);
    setChecked(new Array(data.steps?.length ?? 0).fill(false));
    const s = getStreak();
    setStreak({ current: s.current, best: s.best || 0 });
  }, [router]);

  if (!result) return null;

  const checkedCount = checked.filter(Boolean).length;
  const allDone = checkedCount === result.steps.length;
  const anyDone = checkedCount > 0;
  const progress = result.steps.length > 0 ? Math.round((checkedCount / result.steps.length) * 100) : 0;
  const messScore = result.messScore ?? 50;

  function toggle(i: number) {
    const next = [...checked];
    next[i] = !next[i];
    setChecked(next);
    playSfxCheck(next[i]);
    next[i] ? hapticMedium() : hapticLight();
    const nowAllDone = result ? next.filter(Boolean).length === result.steps.length : false;
    if (nowAllDone && !prevAllDoneRef.current) {
      setDoneFlash(true);
      hapticSuccess();
      setTimeout(() => setDoneFlash(false), 2200);
    }
    prevAllDoneRef.current = nowAllDone;
  }

  function handleFinish() {
    if (!endingTriggered) {
      setEndingTriggered(true);
      hapticHeavy();
      setShowEnding(true);
    } else {
      router.push("/");
    }
  }

  async function saveAfterImage() {
    if (!afterImage) return;
    const a = document.createElement("a");
    a.href = afterImage;
    a.download = `방구조대_청소후_${new Date().toISOString().slice(0, 10)}.jpg`;
    a.click();
  }

  async function handleShare() {
    hapticLight();
    const scoreLabel = messScore >= 70 ? "많이 어지러운 방" : messScore >= 40 ? "조금 어지러운 방" : "꽤 깨끗한 방";
    const text = `방구조대가 내 방을 분석했어요!\n\n어지러움 점수: ${messScore}점 (${scoreLabel})\n${result?.summary ?? ""}\n\n정리 순서 ${result?.steps.length ?? 0}단계 뽑기 완료 🧹`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "방구조대 분석 결과", text, url: "https://bang-gujodae.vercel.app" });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text + "\nhttps://bang-gujodae.vercel.app");
      alert("링크가 복사됐어요!");
    }
  }

  function handleSave() {
    const s = updateStreak();
    setStreak({ current: s.current, best: s.best });
    saveHistory(result!, checkedCount, afterImage ?? undefined);
    setSaved(true);
    hapticSuccess();
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
    hapticMedium();
    setComparing(true);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beforeImage: result.imageB64, afterImage }),
      });
      setCompareResult(await res.json());
      playSfxCompare();
    } catch { alert("비교 중 오류가 발생했어요."); }
    finally { setComparing(false); }
  }

  async function shareCompareResult() {
    if (!compareResult) return;
    const text = `방구조대가 청소 전후를 비교했어요!\n\n변화 점수: ${compareResult.score}/10\n${compareResult.changes.map(c => `✓ ${c}`).join("\n")}\n\n${compareResult.praise}\n\nhttps://bang-gujodae.vercel.app`;
    if (navigator.share) {
      try { await navigator.share({ title: "방 청소 전후 비교", text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      alert("결과가 복사됐어요!");
    }
  }

  return (
    <>
    {showEnding && (
      <CleaningEnding
        beforeImage={result?.imageB64}
        afterImage={afterImage ?? undefined}
        onClose={() => setShowEnding(false)}
      />
    )}


    {/* 완료 파티클 */}
    {doneFlash && (
      <div style={{ position: "fixed", inset: 0, zIndex: 150, pointerEvents: "none", overflow: "hidden" }}>
        {["🎉","✨","⭐","🎊","✨","🌟","🎉","✨","⭐","🎊","🌟","✨"].map((e, i) => (
          <div key={i} style={{
            position: "absolute",
            top: -40,
            left: `${5 + i * 8}%`,
            fontSize: 20 + (i % 3) * 8,
            animation: `confettiFall ${1.4 + (i % 4) * 0.2}s ease-in ${i * 0.07}s forwards`,
            opacity: 0,
          }}>{e}</div>
        ))}
        <style>{`
          @keyframes confettiFall {
            0%   { transform: translateY(0)    rotate(0deg);   opacity: 1; }
            80%  { opacity: 1; }
            100% { transform: translateY(105vh) rotate(360deg); opacity: 0; }
          }
        `}</style>
      </div>
    )}

    <main style={{ maxWidth: 460, margin: "0 auto", padding: "0 0 max(80px, calc(64px + env(safe-area-inset-bottom, 0px)))", background: "#F2FBEA", minHeight: "100vh" }}>

      {/* 상단 헤더 */}
      <div style={{
        background: "linear-gradient(160deg, #76C442 0%, #5A9E30 100%)",
        padding: "44px 20px 24px",
        borderRadius: "0 0 28px 28px",
        marginBottom: 20,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <RobotSprite pose="idle" size={52} />
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, color: "rgba(255,255,255,0.8)" }}>방구조대</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "white" }}>구조 완료 보고서 🧹</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {streak.current > 0 && (
              <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 50, padding: "4px 12px", fontSize: 12, fontWeight: 800, color: "white" }}>
                🔥 {streak.current}일
              </div>
            )}
            <button onClick={() => router.push("/")}
              style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", fontSize: 12, padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontWeight: 700 }}>
              ← 다시
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>

        {/* 어지러움 점수 카드 */}
        <div className="card" style={{ padding: "20px", marginBottom: 12 }}>
          <MessScoreRing score={messScore} />
          <div style={{ marginTop: 14, fontSize: 14, color: "#374151", lineHeight: 1.7, borderTop: "1px solid #F2FBEA", paddingTop: 14 }}>
            {result.summary}
          </div>
        </div>

        {/* 정리 순서 카드 */}
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ padding: "16px 20px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#1a2744" }}>🧹 지금 할 순서</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: allDone ? "#5A9E30" : "#aaa" }}>
                {allDone ? "완료 🎉" : `${checkedCount}/${result.steps.length}`}
              </span>
            </div>
            {anyDone && (
              <div style={{ height: 5, background: "#DBEFC7", borderRadius: 4, marginBottom: 12 }}>
                <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #76C442, #5A9E30)", borderRadius: 4, transition: "width 0.3s" }} />
              </div>
            )}
          </div>

          <div style={{ padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {result.steps.map((step, i) => (
              <div key={i} onClick={() => toggle(i)} style={{
                padding: "12px 14px", borderRadius: 14, border: "1.5px solid",
                cursor: "pointer", transition: "background 0.2s, border-color 0.2s",
                background: checked[i] ? "#F2FBEA" : "#fafafa",
                borderColor: checked[i] ? "#76C442" : "#e5e7eb",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                      background: checked[i] ? "#76C442" : "#e5e7eb",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 900, color: checked[i] ? "white" : "#9ca3af",
                      transition: "all 0.2s",
                    }}>
                      {checked[i] ? "✓" : step.order}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: checked[i] ? "#8DC870" : "#1a2744", textDecoration: checked[i] ? "line-through" : "none" }}>
                      {step.title}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: "#5A9E30", background: "#DBEFC7", padding: "2px 8px", borderRadius: 20, flexShrink: 0, marginLeft: 8, fontWeight: 700 }}>
                    {step.duration}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 5, marginLeft: 36 }}>{step.reason}</div>
              </div>
            ))}

            {anyDone && (
              <div style={{
                padding: "10px 14px", borderRadius: 12,
                background: allDone ? "#DBEFC7" : "#F2FBEA",
                border: `1.5px solid ${allDone ? "#76C442" : "#B5DFA0"}`,
                fontSize: 13, fontWeight: 700, color: "#5A9E30",
              }}>
                {checkedCount === 1 && "✓ 시작했어요. 이게 제일 어려운 거예요."}
                {checkedCount === 2 && "✓✓ 흐름이 생기고 있어요."}
                {checkedCount >= 3 && !allDone && "✓✓✓ 거의 다 왔어요!"}
                {allDone && "🎉 다 했어요. 방이 숨 쉬기 시작했어요."}
              </div>
            )}
          </div>
        </div>

        {/* 오늘 안 해도 되는 것 */}
        <div className="card" style={{ padding: "16px 20px", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: 0.5, marginBottom: 10 }}>오늘 안 해도 되는 것</div>
          {result.skip?.map((s, i) => (
            <div key={i} style={{ fontSize: 13, color: "#d1d5db", display: "flex", gap: 8, marginBottom: 5, textDecoration: "line-through" }}>
              <span>✕</span><span>{s}</span>
            </div>
          ))}
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 10, fontStyle: "italic" }}>{result.message}</div>
        </div>

        {/* Before / After */}
        {anyDone && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ padding: "16px 20px 0" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#1a2744", marginBottom: 4 }}>📸 Before / After</div>
              <div style={{ fontSize: 12, color: "#aaa", marginBottom: 14 }}>같은 방향에서 찍으면 AI가 변화를 비교해줘요</div>
            </div>
            <div style={{ padding: "0 20px 20px" }}>
              {result.imageB64 && (
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#aaa", marginBottom: 6, textAlign: "center" }}>BEFORE</div>
                    <img src={result.imageB64} alt="before" style={{ width: "100%", borderRadius: 10, display: "block" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#aaa", marginBottom: 6, textAlign: "center" }}>AFTER</div>
                    {afterImage ? (
                      <div style={{ position: "relative" }}>
                        <img src={afterImage} alt="after" style={{ width: "100%", borderRadius: 10, display: "block" }} />
                        <button onClick={() => { setAfterImage(null); setCompareResult(null); }}
                          style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", fontSize: 10 }}>✕</button>
                      </div>
                    ) : (
                      <div onClick={() => afterInputRef.current?.click()} style={{
                        width: "100%", minHeight: 100, border: "2px dashed #9FD080", borderRadius: 10,
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", background: "#F2FBEA",
                      }}>
                        <div style={{ fontSize: 24 }}>📷</div>
                        <div style={{ fontSize: 10, color: "#76C442", marginTop: 4, fontWeight: 700 }}>탭해서 업로드</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <input ref={afterInputRef} type="file" accept="image/*" capture="environment"
                style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAfterImage(f); }} />

              {afterImage && !compareResult && (
                <button className="btn-main" onClick={compare} disabled={comparing}>
                  {comparing ? "🔍 비교 중..." : "✨ 얼마나 달라졌는지 봐줘"}
                </button>
              )}
              {!afterImage && (
                <button onClick={() => afterInputRef.current?.click()}
                  style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1.5px dashed #9FD080", background: "#F2FBEA", color: "#76C442", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  📸 정리 후 사진 올리기
                </button>
              )}

              {compareResult && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ textAlign: "center", padding: "8px 0" }}>
                    <div style={{ fontSize: 11, color: "#aaa", marginBottom: 6 }}>변화 점수</div>
                    <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 4 }}>
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} style={{ width: 18, height: 18, borderRadius: "50%", background: i < compareResult.score ? "#76C442" : "#e5e7eb" }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 14, color: "#5A9E30", fontWeight: 800 }}>{compareResult.score}/10</div>
                  </div>
                  {compareResult.changes.map((c, i) => (
                    <div key={i} style={{ fontSize: 13, color: "#374151", display: "flex", gap: 8 }}>
                      <span style={{ color: "#76C442" }}>✓</span><span>{c}</span>
                    </div>
                  ))}
                  <div style={{ background: "#DBEFC7", border: "1.5px solid #9FD080", borderRadius: 12, padding: "14px 16px", fontSize: 13, color: "#1a2744", lineHeight: 1.8 }}>
                    🎉 {compareResult.praise}
                  </div>
                  <button onClick={shareCompareResult} style={{
                    width: "100%", padding: "12px", borderRadius: 12,
                    border: "1.5px solid #9FD080", background: "#F2FBEA",
                    color: "#5A9E30", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  }}>
                    📤 비교 결과 공유하기
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <button className="btn-main" onClick={allDone ? handleFinish : () => router.push("/")} style={{ marginBottom: 10 }}>
          {allDone ? "🎉 완료! 엔딩 보기" : "📸 다른 방 분석하기"}
        </button>

        {/* 기록 저장 버튼 */}
        {anyDone && !saved && (
          <button className="btn-main" onClick={handleSave} style={{ marginBottom: 10 }}>
            💾 오늘 기록 저장하기
          </button>
        )}
        {saved && (
          <div style={{ textAlign: "center", padding: "14px", background: "#DBEFC7", borderRadius: 14, marginBottom: 10, fontSize: 14, fontWeight: 800, color: "#5A9E30" }}>
            ✓ 저장 완료! 🔥 {streak.current}일 연속 정리 중
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <button onClick={() => router.push("/history")}
            style={{ flex: 1, padding: "14px", borderRadius: 14, border: "1.5px solid #e5e7eb", background: "#fff", color: "#555", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            📋 기록 보기
          </button>
          <button onClick={handleShare}
            style={{ flex: 1, padding: "14px", borderRadius: 14, border: "1.5px solid #9FD080", background: "#F2FBEA", color: "#5A9E30", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            🔗 공유
          </button>
        </div>
        {afterImage && (
          <button onClick={saveAfterImage} style={{
            width: "100%", marginBottom: 10, padding: "14px", borderRadius: 14,
            border: "1.5px solid #9FD080", background: "#F2FBEA",
            color: "#5A9E30", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>
            📥 청소 후 사진 저장하기
          </button>
        )}

      </div>
    </main>
    </>
  );
}
