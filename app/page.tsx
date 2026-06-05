"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SplashIntro from "./components/SplashIntro";
import { hapticLight, hapticMedium } from "./utils/haptics";
import { useLang } from "./utils/LangContext";
import { t } from "./utils/i18n";
import { Suspense } from "react";

async function resizeImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 512;
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.src = url;
  });
}

type Situation = "quick" | "guest" | "desk" | "bed" | "sleep";

// 손님 와요 모달
function GuestModal({ lang, onStart, onClose }: { lang: string; onStart: (min: number) => void; onClose: () => void }) {
  const isEn = lang === "en";
  const options = isEn
    ? [{ label: "15 min", value: 15 }, { label: "30 min", value: 30 }, { label: "1 hour", value: 60 }]
    : [{ label: "15분", value: 15 }, { label: "30분", value: 30 }, { label: "1시간", value: 60 }];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end" }}>
      <div style={{ width: "100%", background: "white", borderRadius: "20px 20px 0 0", padding: "28px 20px max(40px,env(safe-area-inset-bottom,40px))" }}>
        <div style={{ fontSize: 28, textAlign: "center", marginBottom: 8 }}>🚨</div>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: "#1a2744", textAlign: "center", marginBottom: 6 }}>
          {isEn ? "Guest coming!" : "손님이 온다고요?"}
        </h2>
        <p style={{ fontSize: 13, color: "#888", textAlign: "center", marginBottom: 24 }}>
          {isEn ? "How long do we have?" : "시간이 얼마나 있어요?"}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {options.map(o => (
            <button key={o.value} onClick={() => onStart(o.value)} style={{
              padding: "16px", borderRadius: 14, border: "1.5px solid #e5e7eb",
              background: "white", fontSize: 16, fontWeight: 800, color: "#1a2744", cursor: "pointer",
            }}>
              {o.label}
            </button>
          ))}
          <button onClick={onClose} style={{ padding: "14px", background: "none", border: "none", fontSize: 13, color: "#bbb", cursor: "pointer" }}>
            {isEn ? "Cancel" : "취소"}
          </button>
        </div>
      </div>
    </div>
  );
}

// 에너지 선택 모달
function EnergyModal({ lang, situation, onStart, onClose }: {
  lang: string;
  situation: Situation;
  onStart: (energy: number) => void;
  onClose: () => void;
}) {
  const isEn = lang === "en";
  const levels = isEn
    ? ["", "😵 Almost none", "😩 Very low", "😐 A little", "🙂 Decent", "🔥 Full energy"]
    : ["", "😵 거의 없음", "😩 많이 낮음", "😐 조금 있음", "🙂 어느 정도", "🔥 풀 에너지"];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end" }}>
      <div style={{ width: "100%", background: "white", borderRadius: "20px 20px 0 0", padding: "28px 20px max(40px,env(safe-area-inset-bottom,40px))" }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: "#1a2744", textAlign: "center", marginBottom: 6 }}>
          {isEn ? "How's your energy?" : "지금 에너지가 어때요?"}
        </h2>
        <p style={{ fontSize: 13, color: "#888", textAlign: "center", marginBottom: 24 }}>
          {isEn ? "We'll match the mission to your state." : "상태에 맞는 미션을 골라드릴게요."}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {levels.slice(1).map((label, i) => (
            <button key={i + 1} onClick={() => onStart(i + 1)} style={{
              padding: "14px 18px", borderRadius: 14, border: "1.5px solid #e5e7eb",
              background: "white", fontSize: 15, fontWeight: 700, color: "#1a2744",
              cursor: "pointer", textAlign: "left",
            }}>
              {label}
            </button>
          ))}
          <button onClick={onClose} style={{ padding: "12px", background: "none", border: "none", fontSize: 13, color: "#bbb", cursor: "pointer" }}>
            {isEn ? "Cancel" : "취소"}
          </button>
        </div>
      </div>
    </div>
  );
}

function HomeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const { lang, toggle } = useLang();
  const tr = t(lang);
  const isEn = lang === "en";

  const [showSplash, setShowSplash] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [weekCount, setWeekCount] = useState(0);

  // 모달 상태
  const [pendingSituation, setPendingSituation] = useState<Situation | null>(null);
  const [showGuest, setShowGuest] = useState(false);
  const [showEnergy, setShowEnergy] = useState(false);
  const [guestMinutes, setGuestMinutes] = useState(30);

  // 사진 분석 상태
  const [preview, setPreview] = useState<string | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [energy, setEnergy] = useState(3);
  const [timeLeft, setTimeLeft] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPhotoForm, setShowPhotoForm] = useState(false);

  useEffect(() => {
    if (!timeLeft) setTimeLeft(isEn ? "20m" : "20분");
  }, [lang]);

  useEffect(() => {
    const init = async () => {
      try {
        const onboarded = localStorage.getItem("bangOnboarded");
        if (!onboarded) setShowSplash(true);
        // 이번 주 구조 횟수
        const today = new Date().toISOString().slice(0, 10);
        const weekKey = `bangWeek_${today.slice(0, 7)}`;
        setWeekCount(Number(localStorage.getItem(weekKey) ?? 0));
      } catch {}
      setInitialized(true);
    };
    init();
  }, []);

  // 미션 완료 후 돌아왔을 때 카운트 갱신
  useEffect(() => {
    if (searchParams.get("fromMission")) {
      const today = new Date().toISOString().slice(0, 10);
      const weekKey = `bangWeek_${today.slice(0, 7)}`;
      setWeekCount(Number(localStorage.getItem(weekKey) ?? 0));
    }
  }, [searchParams]);

  // 상황 선택 핸들러
  function handleSituationTap(sit: Situation) {
    hapticMedium();
    if (sit === "guest") {
      setShowGuest(true);
    } else {
      setPendingSituation(sit);
      setShowEnergy(true);
    }
  }

  function handleGuestTime(min: number) {
    setGuestMinutes(min);
    setShowGuest(false);
    setPendingSituation("guest");
    setShowEnergy(true);
  }

  function handleEnergySelect(e: number) {
    setShowEnergy(false);
    if (!pendingSituation) return;
    const params = new URLSearchParams({
      situation: pendingSituation,
      energy: String(e),
      time: String(pendingSituation === "guest" ? guestMinutes : pendingSituation === "sleep" ? 2 : pendingSituation === "bed" ? 1 : 5),
    });
    router.push(`/mission?${params}`);
  }

  // 사진 분석
  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const b64 = await resizeImage(file);
    setImageB64(b64);
    setPreview(b64);
  }

  async function handlePhotoSubmit() {
    if (!imageB64) return;
    hapticMedium();
    setLoading(true);
    try {
      const res = await fetch("/api/rescue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: imageB64, timeLeft, energy, lang }),
      });
      const data = await res.json();
      localStorage.setItem("rescueResult", JSON.stringify({ ...data, imageB64 }));
      router.push("/result");
    } catch {
      alert(tr.errorMsg);
    } finally {
      setLoading(false);
    }
  }

  if (!initialized) return null;

  const situations: { id: Situation; emoji: string; label: string; sub: string }[] = isEn
    ? [
        { id: "guest", emoji: "🚨", label: "Guest Coming", sub: "Fast rescue for any time frame" },
        { id: "desk",  emoji: "📚", label: "Desk Only",    sub: "Just the work area" },
        { id: "bed",   emoji: "🛏", label: "Can't Get Up", sub: "Tiniest possible action" },
        { id: "sleep", emoji: "🌙", label: "2-Min Reset",  sub: "Before you fall asleep" },
      ]
    : [
        { id: "guest", emoji: "🚨", label: "손님 와요",           sub: "시간에 맞는 빠른 구조" },
        { id: "desk",  emoji: "📚", label: "책상만 살려줘",        sub: "작업 공간만" },
        { id: "bed",   emoji: "🛏", label: "침대에서 못 일어나겠어요", sub: "아주 작은 행동 하나" },
        { id: "sleep", emoji: "🌙", label: "자기 전 2분 리셋",     sub: "자기 전 마지막 정리" },
      ];

  return (
    <>
      {initialized && showSplash && <SplashIntro lang={lang} onDone={() => { localStorage.setItem("bangOnboarded", "1"); setShowSplash(false); }} />}

      {showGuest && <GuestModal lang={lang} onStart={handleGuestTime} onClose={() => setShowGuest(false)} />}
      {showEnergy && pendingSituation && (
        <EnergyModal lang={lang} situation={pendingSituation} onStart={handleEnergySelect} onClose={() => { setShowEnergy(false); setPendingSituation(null); }} />
      )}

      <main style={{
        maxWidth: 480, margin: "0 auto",
        minHeight: "100dvh",
        display: "flex", flexDirection: "column",
        visibility: showSplash ? "hidden" : "visible",
      }}>

        {/* 헤더 */}
        <div style={{
          background: "linear-gradient(160deg, #76C442 0%, #5A9E30 100%)",
          padding: "max(28px, env(safe-area-inset-top, 28px)) 20px 28px",
          borderRadius: "0 0 28px 28px",
          position: "relative", overflow: "hidden",
        }}>
          {/* 배경 원 */}
          <div style={{ position: "absolute", top: -40, right: -40, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />

          {/* 상단 바 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: "white", letterSpacing: 0.5 }}>
              {isEn ? "RoomRescue 🚨" : "방구조대 🚨"}
            </span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {weekCount > 0 && (
                <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 50, padding: "4px 10px", fontSize: 12, fontWeight: 800, color: "white" }}>
                  🔥 {isEn ? `${weekCount} this week` : `이번 주 ${weekCount}회`}
                </div>
              )}
              <button onClick={() => { hapticLight(); toggle(); }} style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: 50, padding: "5px 12px", fontSize: 12, fontWeight: 800, color: "white", cursor: "pointer" }}>
                {isEn ? "한" : "EN"}
              </button>
            </div>
          </div>

          {/* 태그라인 */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", lineHeight: 1.3, marginBottom: 6, letterSpacing: -0.5 }}>
              {isEn ? "Not the whole room." : "방 전체 말고,"}
              <br />
              <span style={{ color: "#FFD54F" }}>{isEn ? "Just one thing." : "지금 하나만."}</span>
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
              {isEn ? "10 seconds to start. No thinking needed." : "10초 안에 시작해요. 생각 안 해도 돼요."}
            </p>
          </div>

          {/* 메인 CTA */}
          <button
            onClick={() => handleSituationTap("quick")}
            style={{
              width: "100%", padding: "18px",
              background: "white",
              borderRadius: 18, border: "none",
              fontSize: 18, fontWeight: 900,
              color: "#5A9E30", cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              letterSpacing: -0.3,
            }}
          >
            ⚡ {isEn ? "Do Just One Thing" : "지금 하나만 하기"}
          </button>
        </div>

        <div style={{ flex: 1, padding: "20px 16px max(24px, env(safe-area-inset-bottom, 24px))" }}>

          {/* 상황별 구조 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#999", letterSpacing: 1, marginBottom: 12 }}>
              {isEn ? "RESCUE BY SITUATION" : "상황별 구조"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {situations.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSituationTap(s.id)}
                  style={{
                    background: "white",
                    borderRadius: 16, border: "1.5px solid #E8F5E9",
                    padding: "16px 14px",
                    textAlign: "left", cursor: "pointer",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{s.emoji}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#1a2744", marginBottom: 2, lineHeight: 1.3 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: "#aaa", lineHeight: 1.4 }}>{s.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 사진으로 분석하기 (접기/펼치기) */}
          <div style={{ background: "white", borderRadius: 16, border: "1.5px solid #E8F5E9", overflow: "hidden" }}>
            <button
              onClick={() => { hapticLight(); setShowPhotoForm(v => !v); }}
              style={{
                width: "100%", padding: "16px 18px",
                background: "none", border: "none",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>📸</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#1a2744" }}>
                    {isEn ? "Analyze with Photo" : "사진으로 분석하기"}
                  </div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>
                    {isEn ? "AI reads your room" : "AI가 방을 직접 봐요"}
                  </div>
                </div>
              </div>
              <span style={{ color: "#bbb", fontSize: 14, transform: showPhotoForm ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
            </button>

            {showPhotoForm && (
              <div style={{ padding: "0 16px 20px", borderTop: "1px solid #f5f5f5" }}>
                {/* 이미지 업로드 */}
                <div
                  onClick={() => inputRef.current?.click()}
                  style={{
                    marginTop: 16, borderRadius: 12, border: "1.5px dashed #B5DFA0",
                    overflow: "hidden", cursor: "pointer", background: "#F9FFF5",
                    minHeight: 100, display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {preview ? (
                    <img src={preview} alt="preview" style={{ width: "100%", maxHeight: 180, objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
                      <div style={{ fontSize: 13, color: "#5A9E30", fontWeight: 700 }}>
                        {isEn ? "Tap to upload" : "탭해서 사진 올리기"}
                      </div>
                    </div>
                  )}
                  <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </div>

                {/* 에너지 + 시간 */}
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "#999", fontWeight: 700, marginBottom: 6 }}>{isEn ? "ENERGY" : "에너지"}</div>
                    <select value={energy} onChange={e => setEnergy(Number(e.target.value))}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 13, fontWeight: 700, background: "white", color: "#1a2744" }}>
                      {(isEn
                        ? ["😵 Almost none", "😩 Very low", "😐 Some", "🙂 Good", "🔥 Full"]
                        : ["😵 거의 없음", "😩 많이 낮음", "😐 조금", "🙂 있음", "🔥 풀"]
                      ).map((l, i) => <option key={i} value={i + 1}>{l}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "#999", fontWeight: 700, marginBottom: 6 }}>{isEn ? "TIME" : "시간"}</div>
                    <select value={timeLeft} onChange={e => setTimeLeft(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 13, fontWeight: 700, background: "white", color: "#1a2744" }}>
                      {(isEn ? ["10m","20m","30m","1h"] : ["10분","20분","30분","1시간"]).map(o =>
                        <option key={o} value={o}>{o}</option>
                      )}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handlePhotoSubmit}
                  disabled={!imageB64 || loading}
                  style={{
                    width: "100%", marginTop: 12, padding: "14px",
                    background: imageB64 ? "linear-gradient(135deg, #76C442, #5A9E30)" : "#e5e7eb",
                    color: imageB64 ? "white" : "#bbb",
                    border: "none", borderRadius: 12,
                    fontSize: 14, fontWeight: 800, cursor: imageB64 ? "pointer" : "default",
                  }}
                >
                  {loading ? (isEn ? "Analyzing…" : "분석 중…") : (isEn ? "🚨 Analyze Room" : "🚨 방 분석하기")}
                </button>
              </div>
            )}
          </div>

          {/* 기록 보기 링크 */}
          <button
            onClick={() => router.push("/history")}
            style={{ width: "100%", marginTop: 12, padding: "12px", background: "none", border: "none", fontSize: 13, color: "#bbb", cursor: "pointer", fontWeight: 600 }}
          >
            {isEn ? "📋 View rescue history" : "📋 구조 기록 보기"}
          </button>
        </div>
      </main>
    </>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeInner />
    </Suspense>
  );
}
