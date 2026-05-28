"use client";
import { useEffect, useRef, useState } from "react";
import RobotSprite from "./RobotSprite";

function playSfxCelebrate() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // 팡파레 5음 상승
    [392, 523, 659, 784, 1047].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine"; o.frequency.value = freq;
      const t = ctx.currentTime + i * 0.09;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.18, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      o.start(t); o.stop(t + 0.45);
    });
  } catch {}
}

function launchConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const COLORS = ["#f97316","#76C442","#FFD54F","#5BB8F5","#ff6b9d","#a78bfa"];
  const particles = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: -10 - Math.random() * 80,
    vx: (Math.random() - 0.5) * 4,
    vy: 2 + Math.random() * 3,
    r: 4 + Math.random() * 5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.2,
  }));
  let frame: number;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.07; p.angle += p.spin;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6);
      ctx.restore();
    });
    if (particles.some(p => p.y < canvas.height + 20)) {
      frame = requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  draw();
  return () => cancelAnimationFrame(frame);
}

interface Props {
  beforeImage?: string;
  afterImage?: string;
  onClose: () => void;
}

export default function CleaningEnding({ beforeImage, afterImage, onClose }: Props) {
  const [phase, setPhase] = useState<"sweep" | "jump" | "done">("sweep");
  const [wipeX, setWipeX] = useState(0);
  const [robX, setRobX]   = useState(-15);
  const rafRef      = useRef<number | null>(null);
  const startRef    = useRef<number | null>(null);
  const canvasRef   = useRef<HTMLCanvasElement | null>(null);
  const confettiRef = useRef<(() => void) | null>(null);

  const SWEEP_MS = 1800;

  useEffect(() => {
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const t = Math.min((ts - startRef.current) / SWEEP_MS, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setWipeX(eased * 100);
      setRobX(-15 + eased * 125);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setPhase("jump");
        playSfxCelebrate();
        if (canvasRef.current) confettiRef.current = launchConfetti(canvasRef.current);
        setTimeout(() => setPhase("done"), 2200);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (confettiRef.current) confettiRef.current();
    };
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.85)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",

    }} onClick={phase === "done" ? onClose : undefined}>

      {/* 폭죽 캔버스 */}
      <canvas ref={canvasRef} style={{
        position: "fixed", inset: 0, zIndex: 201,
        pointerEvents: "none", width: "100%", height: "100%",
      }} />

      {/* 사진 비교 영역 */}
      <div style={{
        position: "relative",
        width: "min(380px, 92vw)",
        height: 240,
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
      }}>
        {/* Before */}
        {beforeImage ? (
          <img src={beforeImage} alt="before"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, background: "#1a2744", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 48 }}>🏠</span>
          </div>
        )}

        {/* After (clip-path 와이프) */}
        {afterImage ? (
          <img src={afterImage} alt="after"
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
              clipPath: `inset(0 ${100 - wipeX}% 0 0)`,
            }} />
        ) : (
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(135deg, #F2FBEA, #DBEFC7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            clipPath: `inset(0 ${100 - wipeX}% 0 0)`,
          }}>
            <span style={{ fontSize: 48 }}>✨</span>
          </div>
        )}

        {/* 와이프 경계선 */}
        {phase === "sweep" && (
          <div style={{
            position: "absolute", top: 0, bottom: 0,
            left: `${wipeX}%`, width: 3,
            background: "rgba(255,255,255,0.7)",
            boxShadow: "0 0 12px rgba(255,255,255,0.8)",
          }} />
        )}

        {/* 로봇 + 빗자루 (sweep 단계) */}
        {phase === "sweep" && (
          <div style={{
            position: "absolute", bottom: 8,
            left: `${robX}%`,
            transform: "translateX(-50%)",
            display: "flex", alignItems: "flex-end",
            zIndex: 10,
          }}>
            <RobotSprite pose="walkRight" size={90} />
            <div style={{
              position: "absolute", right: -14, bottom: 6,
              fontSize: 36,
              transformOrigin: "30% 90%",
              animation: "endScrub 0.8s ease-in-out infinite",
            }}>🧹</div>
          </div>
        )}
      </div>

      {/* 점프 단계 */}
      {(phase === "jump" || phase === "done") && (
        <div style={{
          marginTop: 20,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
          animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
        }}>
          <div style={{ position: "relative" }}>
            <RobotSprite pose="celebrate" size={140} />
            <div style={{
              position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
              fontSize: 24, animation: "sparkle 0.8s ease-in-out infinite",
            }}>✨</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "white",
            textShadow: "0 2px 12px rgba(0,0,0,0.4)", letterSpacing: -0.3 }}>
            완벽해요! 🎉
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
            방이 달라졌어요
          </div>
          {phase === "done" && (
            <button onClick={onClose} style={{
              marginTop: 6, padding: "12px 32px", borderRadius: 50,
              border: "none", background: "#FFD54F", color: "#1a2744",
              fontSize: 14, fontWeight: 900, cursor: "pointer",
              boxShadow: "0 4px 20px rgba(255,193,7,0.4)",
            }}>
              닫기
            </button>
          )}
        </div>
      )}

      <style>{`
        @keyframes endScrub {
          0%   { transform: scaleX(-1) rotate(10deg); }
          50%  { transform: scaleX(-1) rotate(35deg); }
          100% { transform: scaleX(-1) rotate(10deg); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes sparkle {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 1; }
          50%       { transform: translateX(-50%) scale(1.4); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
