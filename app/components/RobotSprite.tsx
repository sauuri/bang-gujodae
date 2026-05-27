"use client";
import { useEffect, useRef, useState } from "react";

// 대기(정면) 프레임 - 미묘하게 다른 앞면 포즈들이 천천히 교체되며 숨쉬는 느낌
const IDLE_FRAMES = [
  "/robot-idle-1.png",
  "/robot-idle-2.png",
  "/robot-idle-3.png",
  "/robot-idle-4.png",
  "/robot-idle-5.png",
];

// 걷기 프레임 (왼쪽 방향) - 오른쪽으로 갈 땐 scaleX(-1) 적용
const WALK_FRAMES = [
  "/robot-walk-l1.png",
  "/robot-walk-l2.png",
  "/robot-walk-l3.png",
  "/robot-walk-l2.png",
];

// 점프/축하 프레임
const CELEBRATE_FRAMES = [
  "/robot-jump-1.png",
  "/robot-jump-2.png",
  "/robot-jump-3.png",
  "/robot-jump-4.png",
  "/robot-jump-5.png",
  "/robot-jump-6.png",
  "/robot-jump-7.png",
  "/robot-jump-8.png",
  "/robot-jump-9.png",
  "/robot-jump-10.png",
];

export type RobotPose = "idle" | "walkLeft" | "walkRight" | "celebrate";

interface Props {
  pose?: RobotPose;
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}

export default function RobotSprite({ pose = "idle", size = 120, style, className }: Props) {
  const [frameIdx, setFrameIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isIdle      = pose === "idle";
  const isCelebrate = pose === "celebrate";
  const frames   = isIdle ? IDLE_FRAMES : isCelebrate ? CELEBRATE_FRAMES : WALK_FRAMES;
  const fps      = isIdle ? 2.5 : isCelebrate ? 8 : 5;
  const flipped  = pose === "walkRight";

  useEffect(() => {
    setFrameIdx(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setFrameIdx(i => (i + 1) % frames.length);
    }, 1000 / fps);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pose, frames.length, fps]);

  return (
    <img
      src={frames[frameIdx]}
      alt="방구조봇"
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        display: "block",
        transform: flipped ? "scaleX(-1)" : "none",

        imageRendering: "auto",
        ...style,
      }}
    />
  );
}
