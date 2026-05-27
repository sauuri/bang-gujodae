"use client";

export type RobotPose = "idle" | "walkLeft" | "walkRight" | "celebrate";

interface Config { url: string; frames: number; fps: number; flip: boolean; }

const CONFIGS: Record<RobotPose, Config> = {
  idle:      { url: "/robot-sprite-idle.png",      frames: 5,  fps: 2.5, flip: false },
  walkLeft:  { url: "/robot-sprite-walk.png",       frames: 4,  fps: 5,   flip: false },
  walkRight: { url: "/robot-sprite-walk.png",       frames: 4,  fps: 5,   flip: true  },
  celebrate: { url: "/robot-sprite-celebrate.png",  frames: 10, fps: 8,   flip: false },
};

const ANIM: Record<string, string> = {
  idle: "sprite-idle", walkLeft: "sprite-walk", walkRight: "sprite-walk", celebrate: "sprite-celebrate",
};

interface Props {
  pose?: RobotPose;
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}

export default function RobotSprite({ pose = "idle", size = 120, style, className }: Props) {
  const { url, frames, fps, flip } = CONFIGS[pose];
  const duration = frames / fps;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${url})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${frames * size}px ${size}px`,
        backgroundPosition: "0 0",
        ["--sprite-end" as string]: `-${frames * size}px`,
        transform: flip ? "scaleX(-1)" : undefined,
        animation: `${ANIM[pose]} ${duration}s steps(${frames}) infinite`,
        display: "inline-block",
        flexShrink: 0,
        imageRendering: "auto",
        ...style,
      }}
    />
  );
}
