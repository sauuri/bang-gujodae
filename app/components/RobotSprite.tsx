"use client";
import { useEffect, useRef, useState } from "react";

const FRAME_MAP: Record<string, string[]> = {
  idle: [
    "/robot-idle-1.png", "/robot-idle-2.png", "/robot-idle-3.png",
    "/robot-idle-4.png", "/robot-idle-5.png",
  ],
  walk: [
    "/robot-walk-l1.png", "/robot-walk-l2.png",
    "/robot-walk-l3.png", "/robot-walk-l2.png",
  ],
  celebrate: [
    "/robot-jump-1.png",  "/robot-jump-2.png",  "/robot-jump-3.png",
    "/robot-jump-4.png",  "/robot-jump-5.png",  "/robot-jump-6.png",
    "/robot-jump-7.png",  "/robot-jump-8.png",  "/robot-jump-9.png",
    "/robot-jump-10.png",
  ],
};

const FPS_MAP: Record<string, number> = {
  idle: 2.5, walk: 6, celebrate: 9,
};

const FADE_MS = 70;

export type RobotPose = "idle" | "walkLeft" | "walkRight" | "celebrate";

interface Props {
  pose?: RobotPose;
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}

export default function RobotSprite({ pose = "idle", size = 120, style, className }: Props) {
  const poseKey  = pose === "walkLeft" || pose === "walkRight" ? "walk" : pose;
  const frames   = FRAME_MAP[poseKey];
  const fps      = FPS_MAP[poseKey];
  const flip     = pose === "walkRight";

  const [idxA, setIdxA] = useState(0);
  const [idxB, setIdxB] = useState(1 % frames.length);
  const [aOnTop, setAOnTop] = useState(true);
  const frameRef = useRef(0);
  const topRef   = useRef(true);

  useEffect(() => {
    frameRef.current = 0;
    topRef.current   = true;
    setIdxA(0);
    setIdxB(1 % frames.length);
    setAOnTop(true);

    const iv = setInterval(() => {
      const next = (frameRef.current + 1) % frames.length;
      frameRef.current = next;
      if (topRef.current) {
        setIdxB(next);
        setAOnTop(false);
        topRef.current = false;
      } else {
        setIdxA(next);
        setAOnTop(true);
        topRef.current = true;
      }
    }, 1000 / fps);

    return () => clearInterval(iv);
  }, [poseKey, frames.length, fps]);

  const base: React.CSSProperties = {
    position: "absolute",
    top: 0, left: 0,
    width: size, height: size,
    objectFit: "contain",
    display: "block",
    transition: `opacity ${FADE_MS}ms ease-in-out`,
  };

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: size, height: size,
        display: "inline-block",
        flexShrink: 0,
        transform: flip ? "scaleX(-1)" : undefined,
        ...style,
      }}
    >
      <img src={frames[idxA]} alt="" style={{ ...base, opacity: aOnTop ? 1 : 0 }} />
      <img src={frames[idxB]} alt="" style={{ ...base, opacity: aOnTop ? 0 : 1 }} />
    </div>
  );
}
