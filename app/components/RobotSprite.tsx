"use client";
import { useEffect, useRef, useState } from "react";

export type RobotPose = "idle" | "walkLeft" | "walkRight" | "celebrate";

interface SpriteConfig { url: string; frames: number; fps: number; flip: boolean; }

const SPRITE: Record<string, SpriteConfig> = {
  idle:      { url: "/robot-sprite-idle.png", frames: 5, fps: 2.5, flip: false },
  walkLeft:  { url: "/robot-sprite-walk.png", frames: 4, fps: 5,   flip: false },
  walkRight: { url: "/robot-sprite-walk.png", frames: 4, fps: 5,   flip: true  },
};

const SPRITE_ANIM: Record<string, string> = {
  idle: "sprite-idle", walkLeft: "sprite-walk", walkRight: "sprite-walk",
};

const JUMP_FRAMES = Array.from({ length: 10 }, (_, i) => `/robot-jump-${i + 1}.png`);
const JUMP_FPS = 9;

interface Props {
  pose?: RobotPose;
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}

export default function RobotSprite({ pose = "idle", size = 120, style, className }: Props) {
  const [jumpIdx, setJumpIdx] = useState(0);
  const ivRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (ivRef.current) clearInterval(ivRef.current);
    if (pose !== "celebrate") return;
    setJumpIdx(0);
    ivRef.current = setInterval(() => {
      setJumpIdx(prev => (prev + 1) % JUMP_FRAMES.length);
    }, 1000 / JUMP_FPS);
    return () => { if (ivRef.current) clearInterval(ivRef.current); };
  }, [pose]);

  if (pose === "celebrate") {
    return (
      <div className={className} style={{ position: "relative", width: size, height: size, display: "inline-block", flexShrink: 0, ...style }}>
        {JUMP_FRAMES.map((src, i) => (
          <img key={src} src={src} alt="" style={{
            position: "absolute", top: 0, left: 0,
            width: size, height: size,
            objectFit: "contain",
            opacity: i === jumpIdx ? 1 : 0,
            display: "block",
          }} />
        ))}
      </div>
    );
  }

  const { url, frames, fps, flip } = SPRITE[pose];
  return (
    <div
      className={className}
      style={{
        width: size, height: size,
        backgroundImage: `url(${url})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${frames * size}px ${size}px`,
        backgroundPosition: "0 0",
        ["--sprite-end" as string]: `-${frames * size}px`,
        transform: flip ? "scaleX(-1)" : undefined,
        animation: `${SPRITE_ANIM[pose]} ${frames / fps}s steps(${frames}) infinite`,
        display: "inline-block",
        flexShrink: 0,
        imageRendering: "auto",
        ...style,
      }}
    />
  );
}
