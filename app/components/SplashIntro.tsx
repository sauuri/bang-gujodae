"use client";
import { useEffect, useState } from "react";
import RobotSprite, { RobotPose } from "./RobotSprite";

const MSGS = [
  "안녕! 방구조봇이에요 🤖",
  "이 방... 많이 어지럽네요!",
  "싹 쓸어버릴게요!",
  "깔끔하게 만들어드릴게요 ✨",
];

const SWEEPS = [
  { dir: "right" as const, startLeft: -20, endLeft: 78 },
  { dir: "left"  as const, startLeft: 115, endLeft: 8  },
  { dir: "right" as const, startLeft: -20, endLeft: 82 },
  { dir: "left"  as const, startLeft: 115, endLeft: 40 },
];

const MOVE_MS  = 1050;
const PAUSE_MS = 320;

export default function SplashIntro({ onDone }: { onDone: () => void }) {
  const [robLeft,  setRobLeft]  = useState(-22);
  const [pose,     setPose]     = useState<RobotPose>("idle");
  const [transit,  setTransit]  = useState(false);
  const [sweeping, setSweeping] = useState(false);
  const [msgIdx,   setMsgIdx]   = useState(-1);
  const [msgOn,    setMsgOn]    = useState(false);
  const [cleanOp,  setCleanOp]  = useState(0);
  const [showCTA,  setShowCTA]  = useState(false);
  const [arrived,  setArrived]  = useState(false);

  useEffect(() => {
    const T: ReturnType<typeof setTimeout>[] = [];
    let cur = 850; // 지저분한 방 먼저 0.85초 보여줌

    SWEEPS.forEach((sw, i) => {
      // 시작 위치로 순간이동 (애니 없이)
      T.push(setTimeout(() => {
        setPose(sw.dir === "right" ? "walkRight" : "walkLeft");
        setTransit(false);
        setSweeping(false);
        setRobLeft(sw.startLeft);
        setMsgOn(false);
      }, cur));

      cur += 80;

      // 걷기 시작
      T.push(setTimeout(() => {
        setTransit(true);
        setRobLeft(sw.endLeft);
        setSweeping(true);
        setMsgIdx(i);
        setMsgOn(true);
      }, cur));

      cur += MOVE_MS;

      // 도착 - 방 점점 깨끗해짐
      T.push(setTimeout(() => {
        setTransit(false);
        setSweeping(false);
        setCleanOp(prev => Math.min(1, prev + 0.28));
      }, cur));

      cur += PAUSE_MS;
    });

    // 최종 중앙 도착
    T.push(setTimeout(() => {
      setPose("walkRight");
      setTransit(true);
      setRobLeft(40);
      setMsgOn(false);
      setCleanOp(1);
    }, cur));

    T.push(setTimeout(() => {
      setTransit(false);
      setArrived(true);
    }, cur + MOVE_MS));

    T.push(setTimeout(() => setShowCTA(true), cur + MOVE_MS + 300));

    return () => T.forEach(clearTimeout);
  }, []);

  const broomSide = pose === "walkRight" ? "right" : "left";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, overflow: "hidden" }}>

      {/* 지저분한 방 배경 */}
      <img src="/room-messy.jpg" alt="" style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        objectFit: "cover",
      }} />

      {/* 깨끗한 방 (점점 페이드인) */}
      <img src="/room-clean.jpg" alt="" style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        objectFit: "cover",
        opacity: cleanOp,
        transition: "opacity 1s ease",
      }} />

      {/* 하단 그라데이션 */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "42%",
        background: "linear-gradient(to top, rgba(0,0,0,0.58) 0%, transparent 100%)",
      }} />
      {/* 상단 그라데이션 */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "22%",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, transparent 100%)",
      }} />

      {/* 말풍선 */}
      <div style={{
        position: "absolute",
        bottom: "38%",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 20,
        pointerEvents: "none",
        width: "min(260px, 80vw)",
        textAlign: "center",
      }}>
        {msgOn && msgIdx >= 0 && (
          <div style={{
            display: "inline-block",
            background: "white",
            border: "2px solid #5BB8F5",
            borderRadius: 20,
            padding: "9px 18px",
            fontSize: 13,
            fontWeight: 700,
            color: "#1a2744",
            boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
            animation: "bPop 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards",
            position: "relative",
          }}>
            {MSGS[msgIdx]}
            <div style={{
              position: "absolute", bottom: -10, left: "50%", transform: "translateX(-50%)",
              width: 0, height: 0,
              borderLeft: "9px solid transparent", borderRight: "9px solid transparent",
              borderTop: "10px solid #5BB8F5",
            }} />
            <div style={{
              position: "absolute", bottom: -7, left: "50%", transform: "translateX(-50%)",
              width: 0, height: 0,
              borderLeft: "7px solid transparent", borderRight: "7px solid transparent",
              borderTop: "8px solid white",
            }} />
          </div>
        )}
      </div>

      {/* 로봇 + 빗자루 */}
      <div style={{
        position: "absolute",
        bottom: arrived ? "28%" : "8%",
        left: `${robLeft}%`,
        transform: "translateX(-50%)",
        transition: transit
          ? `left ${MOVE_MS}ms cubic-bezier(0.4,0,0.2,1)`
          : arrived ? "bottom 0.5s ease" : "none",
        zIndex: 10,
        display: "flex",
        alignItems: "flex-end",
      }}>
        {/* 로봇 스프라이트 + 빗자루 (손 위치에 absolute) */}
        <div style={{ position: "relative" }}>
          <RobotSprite
            pose={pose}
            size={arrived ? 168 : 138}
            style={{ transition: "width 0.35s ease, height 0.35s ease" }}
          />

          {/* 빗자루 — 로봇 움직이는 동안 + 도착 후 계속 쓱싹 */}
          {(sweeping || arrived) && (
            <div style={{
              position: "absolute",
              ...(broomSide === "right"
                ? { right: -18, transformOrigin: "30% 90%", animation: "scrubR 0.8s ease-in-out infinite" }
                : { left: -18,  transformOrigin: "70% 90%", animation: "scrubL 0.8s ease-in-out infinite" }),
              bottom: 8,
              fontSize: 46,
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))",
              zIndex: 2,
            }}>🧹</div>
          )}

          {/* 도착 후 반짝임 */}
          {arrived && (
            <div style={{
              position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)",
              fontSize: 20,
              animation: "sparkle 1.1s ease-in-out infinite",
            }}>✨</div>
          )}
        </div>
      </div>

      {/* CTA */}
      {showCTA && (
        <div style={{
          position: "absolute", bottom: "5%", left: "50%",
          width: "min(320px, 86vw)",
          transform: "translateX(-50%)",
          textAlign: "center",
          animation: "slideUp 0.5s cubic-bezier(0.34,1.2,0.64,1) forwards",
          zIndex: 15,
        }}>
          <p style={{
            fontSize: 27, fontWeight: 900, color: "white",
            marginBottom: 5, letterSpacing: -0.5,
            textShadow: "0 2px 12px rgba(0,0,0,0.45)",
          }}>방구조대 🚨</p>
          <p style={{
            fontSize: 13, color: "rgba(255,255,255,0.85)",
            marginBottom: 18, textShadow: "0 1px 4px rgba(0,0,0,0.3)",
          }}>
            방 사진 한 장으로 정리 순서 뽑기
          </p>
          <button onClick={onDone} style={{
            width: "100%",
            padding: "16px",
            borderRadius: 18,
            border: "none",
            background: "#FFD54F",
            color: "#1a2744",
            fontSize: 16,
            fontWeight: 900,
            cursor: "pointer",
            boxShadow: "0 4px 22px rgba(0,0,0,0.28)",
            letterSpacing: 0.3,
          }}>
            🧹 지금 청소 시작하기
          </button>
        </div>
      )}

      <style>{`
        @keyframes bPop {
          from { transform: scale(0.7); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(22px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes scrubR {
          0%   { transform: scaleX(-1) rotate(10deg); }
          50%  { transform: scaleX(-1) rotate(35deg); }
          100% { transform: scaleX(-1) rotate(10deg); }
        }
        @keyframes scrubL {
          0%   { transform: rotate(10deg); }
          50%  { transform: rotate(35deg); }
          100% { transform: rotate(10deg); }
        }
        @keyframes sparkle {
          0%, 100% { transform: translateX(-50%) scale(1);    opacity: 1;   }
          50%       { transform: translateX(-50%) scale(1.35); opacity: 0.65; }
        }
      `}</style>
    </div>
  );
}
