import React from "react";

type RobotProps = {
  baseShift?: number;
  armLift?: number;
  stable?: boolean;
  compact?: boolean;
  className?: string;
};

export function LabRobot({
  baseShift = 0,
  armLift = 0,
  stable = true,
  compact = false,
  className = "",
}: RobotProps) {
  const shoulderY = 82 - armLift * 0.18;
  const elbowX = 118 + armLift * 0.18;
  const elbowY = 65 - armLift * 0.12;
  const handX = 151 + armLift * 0.08;
  const handY = 95 - armLift * 0.35;
  return (
    <svg
      className={`lab-robot ${stable ? "is-stable" : "is-unstable"} ${compact ? "is-compact" : ""} ${className}`}
      viewBox="0 0 220 210"
      role="img"
      aria-label="移动操作机器人示意图"
    >
      <g transform={`translate(${baseShift} 0)`}>
        <ellipse className="robot-shadow" cx="106" cy="187" rx="72" ry="11" />
        <rect className="robot-base" x="42" y="145" width="126" height="34" rx="14" />
        <circle className="robot-wheel" cx="68" cy="181" r="12" />
        <circle className="robot-wheel" cx="143" cy="181" r="12" />
        <rect className="robot-column" x="78" y="86" width="54" height="66" rx="16" />
        <rect className="robot-head" x="72" y="35" width="66" height="48" rx="15" />
        <rect className="robot-camera" x="84" y="49" width="42" height="18" rx="9" />
        <circle className="robot-lens" cx="98" cy="58" r="4" />
        <circle className="robot-lens" cx="113" cy="58" r="4" />
        <line className="robot-neck" x1="105" y1="83" x2="105" y2="94" />
        <circle className="robot-joint" cx="128" cy={shoulderY} r="11" />
        <line className="robot-arm" x1="128" y1={shoulderY} x2={elbowX} y2={elbowY} />
        <circle className="robot-joint" cx={elbowX} cy={elbowY} r="9" />
        <line className="robot-forearm" x1={elbowX} y1={elbowY} x2={handX} y2={handY} />
        <path className="robot-gripper" d={`M ${handX - 2} ${handY - 2} l 10 -8 M ${handX - 2} ${handY + 2} l 11 8`} />
        <circle className="robot-status" cx="105" cy="116" r="7" />
      </g>
    </svg>
  );
}

export function CupTarget({ shifted = false }: { shifted?: boolean }) {
  return (
    <svg className={`cup-target ${shifted ? "is-shifted" : ""}`} viewBox="0 0 90 90" role="img" aria-label="目标杯子">
      <ellipse className="cup-shadow" cx="44" cy="75" rx="28" ry="6" />
      <path className="cup-body" d="M22 24h42l-5 43H28z" />
      <path className="cup-handle" d="M62 34c20-2 20 23 0 23" />
      <ellipse className="cup-rim" cx="43" cy="25" rx="21" ry="6" />
    </svg>
  );
}
