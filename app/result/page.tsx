"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { hapticLight, hapticMedium, hapticHeavy, hapticSuccess } from "../utils/haptics";
import { useLang } from "../utils/LangContext";
// import { usePremium } from "../utils/PremiumContext"; // 유료화 중단 (2026-06-04)
import { t } from "../utils/i18n";

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
import AROverlay from "../components/AROverlay";
import { isARSupported, openNativeAR } from "../utils/arBridge";
import { bridgeSetTimer, bridgeClearTimer } from "../utils/timerBridge";

function parseDurationSecs(dur: string): number {
  const h = dur.match(/(\d+)\s*시간/);
  const m = dur.match(/(\d+)\s*분/);
  return (h ? parseInt(h[1]) * 3600 : 0) + (m ? parseInt(m[1]) * 60 : 0) || 300;
}

function fmt(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function playTimerDone() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.connect(g); g.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.15;
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.22, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      o.start(t); o.stop(t + 0.55);
    });
  } catch {}
}

interface TimerState { idx: number; total: number; remaining: number; done: boolean; startedAt: number; startedRemaining: number }
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

function RescueAchievements({ steps, checked, lang }: { steps: { title: string }[]; checked: boolean[]; lang: string }) {
  const done = steps.filter((_, i) => checked[i]);
  if (done.length === 0) return null;
  const isEn = lang === "en";
  return (
    <div style={{ marginTop: 14, borderTop: "1px solid #F2FBEA", paddingTop: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#5A9E30", letterSpacing: 1, marginBottom: 10 }}>
        {isEn ? "RESCUED TODAY" : "오늘 구조한 것"}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {done.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
            <span style={{ color: "#76C442", flexShrink: 0, fontWeight: 900 }}>✅</span>
            <span>{s.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const { lang, toggle: toggleLang } = useLang();
  // const { state: premiumState, useStreakShield } = usePremium(); // 유료화 중단 (2026-06-04)
  const tr = t(lang);
  const [result, setResult] = useState<RescueResult | null>(null);
  const [checked, setChecked] = useState<boolean[]>([]);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [streak, setStreak] = useState({ current: 0, best: 0 });
  const [showEnding, setShowEnding] = useState(false);
  const [showAR, setShowAR] = useState(false);
  const [showARInfo, setShowARInfo] = useState(false);
  const [endingTriggered, setEndingTriggered] = useState(false);
  const [doneFlash, setDoneFlash] = useState(false);
  const [timer, setTimer] = useState<TimerState | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  // const [showShieldModal, setShowShieldModal] = useState(false); // 유료화 중단 (2026-06-04)
  const prevAllDoneRef = useRef(false);
  const afterInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!timer || timer.done) return;
    if (timer.remaining <= 0) { setTimer(t => t ? { ...t, done: true } : null); return; }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        setTimer(t => {
          if (!t || t.done) return t;
          const remaining = Math.max(0, Math.floor((t.startedAt + t.startedRemaining * 1000 - Date.now()) / 1000));
          if (remaining <= 0) { playTimerDone(); hapticSuccess(); }
          return remaining <= 0 ? { ...t, remaining: 0, done: true } : { ...t, remaining };
        });
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    const id = setInterval(() => {
      setTimer(t => {
        if (!t || t.done) { clearInterval(id); return t; }
        const remaining = Math.max(0, Math.floor((t.startedAt + t.startedRemaining * 1000 - Date.now()) / 1000));
        if (remaining <= 0) { clearInterval(id); playTimerDone(); hapticSuccess(); return { ...t, remaining: 0, done: true }; }
        return { ...t, remaining };
      });
    }, 500);

    return () => { clearInterval(id); document.removeEventListener("visibilitychange", handleVisibility); };
  }, [timer?.idx, timer?.done]);

  function startTimer(i: number, step: Step) {
    const secs = parseDurationSecs(step.duration);
    bridgeSetTimer(secs, step.title);
    hapticMedium();
    setTimer({ idx: i, total: secs, remaining: secs, done: false, startedAt: Date.now(), startedRemaining: secs });
  }

  function completeTimer() {
    if (!timer) return;
    const next = [...checked]; next[timer.idx] = true; setChecked(next);
    bridgeClearTimer();
    setTimer(null);
  }

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
    a.download = `${tr.afterPhotoName}_${new Date().toISOString().slice(0, 10)}.jpg`;
    a.click();
  }

  async function handleShare() {
    hapticLight();
    const scoreLabel = messScore >= 70 ? tr.messHigh : messScore >= 40 ? tr.messMid : tr.messLow;
    const text = tr.shareText(messScore, scoreLabel, result?.summary ?? "", result?.steps.length ?? 0);
    if (navigator.share) {
      try {
        await navigator.share({ title: tr.shareResultTitle, text, url: "https://bang-gujodae.vercel.app" });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text + "\nhttps://bang-gujodae.vercel.app");
      alert(tr.copiedLink);
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
    } catch { alert(tr.compareError); }
    finally { setComparing(false); }
  }

  async function shareCompareResult() {
    if (!compareResult || !result?.imageB64 || !afterImage) return;
    try {
      const dataUrl = await buildShareCard({
        beforeSrc: result.imageB64,
        afterSrc: afterImage,
        score: compareResult.score,
        changes: compareResult.changes,
        lang,
      });
      // 이미지로 공유 시도
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "bangGujodae.jpg", { type: "image/jpeg" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: tr.shareCompareTitle });
        return;
      }
      // 이미지 공유 불가시 다운로드
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "방구조대_결과.jpg";
      a.click();
    } catch {
      // fallback: 텍스트 공유
      const text = tr.shareCompareText(compareResult.score, compareResult.changes, compareResult.praise);
      if (navigator.share) {
        try { await navigator.share({ title: tr.shareCompareTitle, text }); } catch {}
      } else {
        await navigator.clipboard.writeText(text);
        alert(tr.copiedResult);
      }
    }
  }

  async function buildShareCard({ beforeSrc, afterSrc, score, changes, lang }: {
    beforeSrc: string; afterSrc: string; score: number; changes: string[]; lang: string;
  }): Promise<string> {
    const W = 800, H = 500;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    const loadImg = (src: string) => new Promise<HTMLImageElement>((res, rej) => {
      const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = src;
    });

    // 배경
    ctx.fillStyle = "#F2FBEA";
    ctx.fillRect(0, 0, W, H);

    // 사진 영역 (각 360x340)
    const [before, after] = await Promise.all([loadImg(beforeSrc), loadImg(afterSrc)]);
    const drawImg = (img: HTMLImageElement, x: number, y: number, w: number, h: number) => {
      const scale = Math.max(w / img.width, h / img.height);
      const sw = img.width * scale, sh = img.height * scale;
      const sx = (w - sw) / 2, sy = (h - sh) / 2;
      ctx.drawImage(img, x + sx, y + sy, sw, sh);
    };

    // 왼쪽 (BEFORE)
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(20, 20, 360, 340, 14);
    ctx.clip();
    drawImg(before, 20, 20, 360, 340);
    ctx.restore();
    // BEFORE 라벨
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(20, 20, 360, 34);
    ctx.fillStyle = "white";
    ctx.font = "bold 14px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BEFORE", 200, 42);

    // 오른쪽 (AFTER)
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(420, 20, 360, 340, 14);
    ctx.clip();
    drawImg(after, 420, 20, 360, 340);
    ctx.restore();
    ctx.fillStyle = "rgba(26,55,14,0.65)";
    ctx.fillRect(420, 20, 360, 34);
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText("AFTER", 600, 42);

    // 하단 정보 영역
    ctx.fillStyle = "white";
    ctx.fillRect(0, 370, W, 130);

    // 점수 변화 (왼쪽)
    ctx.fillStyle = "#5A9E30";
    ctx.font = "bold 28px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${score}/10`, 30, 420);
    ctx.fillStyle = "#aaa";
    ctx.font = "12px -apple-system, sans-serif";
    ctx.fillText(lang === "en" ? "Change Score" : "변화 점수", 30, 440);

    // 변화 목록
    const displayChanges = changes.slice(0, 2);
    ctx.fillStyle = "#374151";
    ctx.font = "12px -apple-system, sans-serif";
    displayChanges.forEach((c, i) => {
      ctx.fillStyle = "#76C442";
      ctx.fillText("✓", 30, 468 + i * 20);
      ctx.fillStyle = "#374151";
      ctx.fillText(c.length > 38 ? c.slice(0, 38) + "…" : c, 50, 468 + i * 20);
    });

    // 앱 이름 (오른쪽)
    ctx.fillStyle = "#5A9E30";
    ctx.font = "bold 18px -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(lang === "en" ? "RoomRescue 🚨" : "방구조대 🚨", W - 24, 415);
    ctx.fillStyle = "#bbb";
    ctx.font = "11px -apple-system, sans-serif";
    ctx.fillText("bang-gujodae.vercel.app", W - 24, 435);

    return canvas.toDataURL("image/jpeg", 0.92);
  }

  return (
    <>
    {/* 타이머 오버레이 */}
    {timer && result && (
      <div style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "linear-gradient(180deg, #0a1a05 0%, #0d2208 50%, #102a0a 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "40px 24px",
      }}>
        <div style={{ position: "absolute", top: "8%", left: "50%", transform: "translateX(-50%)", fontSize: 28, opacity: 0.9 }}>
          {timer.done ? "🎉" : "🧹"}
        </div>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 2, marginBottom: 8 }}>
            {timer.done ? tr.done : tr.cleaning}
          </div>
          <div style={{ fontSize: 18, color: "white", fontWeight: 900, lineHeight: 1.4 }}>
            {result.steps[timer.idx].title}
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>
            {result.steps[timer.idx].reason}
          </div>
        </div>

        <div style={{ position: "relative", width: 200, height: 200, marginBottom: 36 }}>
          <svg width="200" height="200" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
            <circle cx="100" cy="100" r="88" fill="none"
              stroke={timer.done ? "#76C442" : "#5A9E30"}
              strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${2 * Math.PI * 88 * (timer.remaining / timer.total)}`}
              style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            {timer.done ? (
              <div style={{ fontSize: 44 }}>✅</div>
            ) : (
              <>
                <div style={{ fontSize: 46, fontWeight: 900, color: "white", letterSpacing: -1, fontVariantNumeric: "tabular-nums" }}>
                  {fmt(timer.remaining)}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{tr.remaining}</div>
              </>
            )}
          </div>
        </div>

        {timer.done ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 300 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#76C442", textAlign: "center", marginBottom: 4 }}>
              {tr.timerDone}
            </div>
            <button onClick={completeTimer} style={{
              padding: "14px", borderRadius: 14, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #76C442, #5A9E30)",
              color: "white", fontSize: 15, fontWeight: 900,
              boxShadow: "0 6px 20px rgba(118,196,66,0.4)",
            }}>
              {tr.timerDoneBtn}
            </button>
            <button onClick={() => { bridgeClearTimer(); setTimer(null); }} style={{
              padding: "14px", borderRadius: 14, cursor: "pointer",
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 700,
            }}>
              {tr.timerSkip}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 300 }}>
            <button onClick={completeTimer} style={{
              padding: "14px", borderRadius: 14, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #76C442, #5A9E30)",
              color: "white", fontSize: 15, fontWeight: 900,
              boxShadow: "0 6px 20px rgba(118,196,66,0.4)",
            }}>
              {tr.timerEarlyDone}
            </button>
            <button onClick={() => { bridgeClearTimer(); setTimer(null); }} style={{
              padding: "14px", borderRadius: 14, cursor: "pointer",
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 700,
            }}>
              {tr.timerCancel}
            </button>
          </div>
        )}
      </div>
    )}

    {showEnding && (
      <CleaningEnding
        beforeImage={result?.imageB64}
        afterImage={afterImage ?? undefined}
        onClose={() => setShowEnding(false)}
      />
    )}
    {showAR && result && (
      <AROverlay steps={result.steps} onClose={() => setShowAR(false)} />
    )}

    {showARInfo && (
      <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        onClick={() => setShowARInfo(false)}>
        <div onClick={e => e.stopPropagation()} style={{
          width: "100%", maxWidth: 480,
          background: "white", borderRadius: "24px 24px 0 0",
          padding: "28px 24px calc(env(safe-area-inset-bottom, 24px) + 24px)",
        }}>
          <div style={{ width: 40, height: 4, background: "#e5e7eb", borderRadius: 2, margin: "0 auto 24px" }} />
          <div style={{ fontSize: 36, marginBottom: 12, textAlign: "center" }}>📸</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#1a2744", textAlign: "center", marginBottom: 8 }}>AR 카메라 모드</div>
          <div style={{ fontSize: 14, color: "#666", textAlign: "center", lineHeight: 1.7, marginBottom: 24 }}>
            카메라를 켜고 <strong>실제 방을 보면서</strong><br />정리 순서를 하나씩 따라갈 수 있어요.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
            {[
              { icon: "📷", text: "카메라 화면 위에 현재 단계가 오버레이로 표시돼요" },
              { icon: "✓", text: "완료 버튼 누르면 자동으로 다음 단계로 넘어가요" },
              { icon: "🔢", text: "상단 점을 눌러 원하는 단계로 바로 이동할 수 있어요" },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", background: "#f8fafc", borderRadius: 12 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ fontSize: 13, color: "#444", lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>
          <button
            onClick={async () => {
              setShowARInfo(false);
              hapticSuccess();
              const native = await isARSupported();
              if (native && result) {
                await openNativeAR(result.steps);
              } else {
                setShowAR(true);
              }
            }}
            style={{
              width: "100%", padding: "16px", borderRadius: 16, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #1a2744, #2d4a8a)",
              color: "white", fontSize: 16, fontWeight: 900,
            }}
          >
            카메라 켜기
          </button>
          <button onClick={() => setShowARInfo(false)} style={{ width: "100%", marginTop: 10, padding: "12px", borderRadius: 16, border: "none", background: "none", cursor: "pointer", color: "#999", fontSize: 14 }}>
            닫기
          </button>
        </div>
      </div>
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
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, color: "rgba(255,255,255,0.8)" }}>{tr.appName}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "white" }}>{tr.reportTitle}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {streak.current > 0 && (
              <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 50, padding: "4px 12px", fontSize: 12, fontWeight: 800, color: "white" }}>
                🔥 {streak.current}{tr.streakDays}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={toggleLang} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", fontSize: 12, padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontWeight: 700 }}>
                {lang === "ko" ? "EN" : "한"}
              </button>
              <button onClick={() => router.push("/")}
                style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", fontSize: 12, padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontWeight: 700 }}>
                {tr.back}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>

        {/* 구조 리포트 카드 */}
        <div className="card" style={{ padding: "20px", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5A9E30", letterSpacing: 1, marginBottom: 10 }}>
            {lang === "en" ? "RESCUE REPORT 🧹" : "구조 리포트 🧹"}
          </div>
          <div style={{ fontSize: 15, color: "#374151", lineHeight: 1.7 }}>
            {result.summary}
          </div>
          <RescueAchievements steps={result.steps} checked={checked} lang={lang} />
        </div>

        {/* 정리 순서 카드 */}
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ padding: "16px 20px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#1a2744" }}>{tr.stepsTitle}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => { hapticMedium(); setShowARInfo(true); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "5px 12px", borderRadius: 20, border: "none", cursor: "pointer",
                    background: "linear-gradient(135deg, #1a2744, #2d4a8a)",
                    color: "white", fontSize: 11, fontWeight: 800,
                  }}
                >
                  📸 AR
                </button>
                <span style={{ fontSize: 12, fontWeight: 700, color: allDone ? "#5A9E30" : "#aaa" }}>
                  {allDone ? tr.allDone : `${checkedCount}/${result.steps.length}`}
                </span>
              </div>
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
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginLeft: 8 }}>
                    <span style={{ fontSize: 11, color: "#5A9E30", background: "#DBEFC7", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>
                      {step.duration}
                    </span>
                    {parseDurationSecs(step.duration) > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); startTimer(i, step); }}
                        style={{
                          background: "#76C442", color: "white", border: "none",
                          borderRadius: 14, padding: "3px 8px", fontSize: 11,
                          fontWeight: 800, cursor: "pointer",
                        }}>
                        ⏱
                      </button>
                    )}
                  </div>
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
                {checkedCount === 1 && tr.progressMsgs[0]}
                {checkedCount === 2 && tr.progressMsgs[1]}
                {checkedCount >= 3 && !allDone && tr.progressMsgs[2]}
                {allDone && tr.progressMsgs[3]}
              </div>
            )}
          </div>
        </div>

        {/* 오늘 하지 마세요 리스트 */}
        {result.skip?.length > 0 && (
          <div style={{ background: "#FFF8F0", border: "1.5px solid #FFD0A0", borderRadius: 16, padding: "16px 18px", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>🚫</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#D97706", letterSpacing: 0.5 }}>
                {lang === "en" ? "DON'T DO TODAY" : "오늘 하지 마세요"}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#92400E", marginBottom: 10, lineHeight: 1.5 }}>
              {lang === "en"
                ? "These will drain your energy. Save them for later."
                : "이것들은 에너지를 다 써버려요. 오늘은 손대지 마세요."}
            </div>
            {result.skip.map((s, i) => (
              <div key={i} style={{ fontSize: 13, color: "#B45309", display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0, fontWeight: 900 }}>✕</span>
                <span style={{ lineHeight: 1.5 }}>{s}</span>
              </div>
            ))}
          </div>
        )}

        {/* AI 격려 메시지 */}
        <div style={{ fontSize: 13, color: "#6b7280", padding: "0 4px 12px", fontStyle: "italic", lineHeight: 1.6, textAlign: "center" }}>
          {result.message}
        </div>

        {/* Before / After */}
        {anyDone && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ padding: "16px 20px 0" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#1a2744", marginBottom: 4 }}>{tr.beforeAfterTitle}</div>
              <div style={{ fontSize: 12, color: "#aaa", marginBottom: 14 }}>{tr.beforeAfterHint}</div>
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
                        <div style={{ fontSize: 10, color: "#76C442", marginTop: 4, fontWeight: 700 }}>{tr.tapToUpload}</div>
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
                  {comparing ? tr.comparing : tr.compareBtn}
                </button>
              )}
              {!afterImage && (
                <button onClick={() => afterInputRef.current?.click()}
                  style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1.5px dashed #9FD080", background: "#F2FBEA", color: "#76C442", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {tr.uploadAfter}
                </button>
              )}

              {compareResult && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ textAlign: "center", padding: "8px 0" }}>
                    <div style={{ fontSize: 11, color: "#aaa", marginBottom: 6 }}>{tr.compareCardScore}</div>
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
                    {tr.shareCompare}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <button className="btn-main" onClick={allDone ? handleFinish : () => router.push("/")} style={{ marginBottom: 10 }}>
          {allDone ? tr.finishBtn : tr.analyzeBtn}
        </button>

        {anyDone && !saved && (
          <button className="btn-main" onClick={handleSave} style={{ marginBottom: 10 }}>
            {tr.save}
          </button>
        )}
        {saved && (
          <div style={{ textAlign: "center", padding: "14px", background: "#DBEFC7", borderRadius: 14, marginBottom: 10, fontSize: 14, fontWeight: 800, color: "#5A9E30" }}>
            {(() => {
              const weekKey = `bangWeek_${new Date().toISOString().slice(0, 7)}`;
              const weekCount = Number(localStorage.getItem(weekKey) ?? 0);
              return lang === "en"
                ? `${tr.savedMsg} 🔥 ${weekCount} rescues this week`
                : `${tr.savedMsg} 🔥 이번 주 ${weekCount}회 구조`;
            })()}
          </div>
        )}

        {/* 유료화 중단 (2026-06-04)
        {!anyDone && premiumState.isPremium && premiumState.streakShields > 0 && (
          <button
            onClick={() => setShowShieldModal(true)}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 14,
              border: "1.5px solid #FFA500",
              background: "#FFF8F0",
              color: "#FF8C00",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              marginBottom: 10,
            }}
          >
            🛡️ {lang === "ko" ? "오늘 못 했어요" : "Couldn't do it today"}
          </button>
        )}
        */}

        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <button onClick={() => router.push("/history")}
            style={{ flex: 1, padding: "14px", borderRadius: 14, border: "1.5px solid #e5e7eb", background: "#fff", color: "#555", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {tr.history}
          </button>
          <button onClick={handleShare}
            style={{ flex: 1, padding: "14px", borderRadius: 14, border: "1.5px solid #9FD080", background: "#F2FBEA", color: "#5A9E30", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {tr.share}
          </button>
        </div>
        {afterImage && (
          <button onClick={saveAfterImage} style={{
            width: "100%", marginBottom: 10, padding: "14px", borderRadius: 14,
            border: "1.5px solid #9FD080", background: "#F2FBEA",
            color: "#5A9E30", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>
            {tr.saveAfterPhoto}
          </button>
        )}

      </div>
    </main>

    {/* 유료화 중단 (2026-06-04)
    {showShieldModal && (
      <div style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "flex-end",
        zIndex: 100,
      }}>
        <div style={{
          width: "100%",
          background: "white",
          borderRadius: "20px 20px 0 0",
          padding: "2rem 1.5rem",
        }}>
          <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem", color: "#2D5A2D" }}>
            🛡️ {lang === "ko" ? "스트릭 보호권 사용" : "Use Streak Shield"}
          </h2>
          <p style={{ color: "#666", marginBottom: "1.5rem" }}>
            {lang === "ko"
              ? `오늘 정리를 못 해도 스트릭을 유지할 수 있어요.\n남은 보호권: ${premiumState.streakShields}개`
              : `Keep your streak even if you can't clean today.\nShields left: ${premiumState.streakShields}`}
          </p>
          <button
            onClick={() => {
              if (useStreakShield()) {
                updateStreak();
                setSaved(true);
                setShowShieldModal(false);
              }
            }}
            style={{
              width: "100%",
              padding: "1rem",
              background: "linear-gradient(135deg, #84D98F 0%, #5DC86D 100%)",
              color: "white",
              border: "none",
              borderRadius: "0.8rem",
              fontSize: "1.1rem",
              fontWeight: "bold",
              cursor: "pointer",
              marginBottom: "0.5rem",
            }}
          >
            {lang === "ko" ? "보호권 사용" : "Use Shield"}
          </button>
          <button
            onClick={() => setShowShieldModal(false)}
            style={{
              width: "100%",
              padding: "1rem",
              background: "#f0f0f0",
              border: "none",
              borderRadius: "0.8rem",
              cursor: "pointer",
            }}
          >
            {tr.cancel}
          </button>
        </div>
      </div>
    )}
    */}
    </>
  );
}
