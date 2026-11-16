import React from 'react';

// Shared drawing kit for every RT-2 scene: one palette, one chibi interpreter,
// one token vocabulary. Widgets compose these primitives instead of inventing
// their own visual language.

export const PAL = {
  ink: '#21324a',
  muted: '#6b7a90',
  line: '#d7e0ee',
  paper: '#ffffff',
  soft: '#f4f7fc',
  blue: '#2f6fd0',
  blueSoft: '#e8f0fd',
  green: '#228d5c',
  greenSoft: '#e6f4ec',
  red: '#c43f52',
  redSoft: '#fbe9ec',
  orange: '#dd7a3b',
  orangeSoft: '#fdf0e7',
  purple: '#7c3aed',
  purpleSoft: '#f2ecfd',
  gold: '#c9a227',
};

export const FONT = '"Noto Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif';

export function Svg({
  children,
  w = 1080,
  h = 300,
  label,
}: {
  children: React.ReactNode;
  w?: number;
  h?: number;
  label?: string;
}) {
  return (
    <svg
      className="rt2-svg"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={label || 'RT-2 教学示意图'}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter id="rt2-card-shadow" x="-8%" y="-8%" width="116%" height="120%">
          <feDropShadow dx={0} dy={3} stdDeviation={5} floodColor="#21324a" floodOpacity={0.07} />
        </filter>
      </defs>
      <rect x={0} y={0} width={w} height={h} fill="transparent" />
      {children}
    </svg>
  );
}

export function T({
  x,
  y,
  size = 18,
  color = PAL.ink,
  weight = 400,
  anchor = 'start',
  children,
  opacity = 1,
}: {
  x: number;
  y: number;
  size?: number;
  color?: string;
  weight?: number;
  anchor?: 'start' | 'middle' | 'end';
  children: React.ReactNode;
  opacity?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      fontFamily={FONT}
      fontSize={size}
      fontWeight={weight}
      fill={color}
      textAnchor={anchor}
      opacity={opacity}
      style={{ letterSpacing: '0.012em', fontVariantNumeric: 'tabular-nums' }}
    >
      {children}
    </text>
  );
}

export function Arrow({
  x1,
  y1,
  x2,
  y2,
  color = PAL.blue,
  dashed = false,
  width = 2,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  dashed?: boolean;
  width?: number;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const head = Math.min(9, Math.max(5.5, len * 0.3));
  const backX = x2 - ux * head;
  const backY = y2 - uy * head;
  const half = Math.min(5, head * 0.58);
  const px = -uy * half;
  const py = ux * half;
  return (
    <g>
      <circle cx={x1} cy={y1} r={1.3} fill={color} opacity={0.35} />
      <line
        x1={x1}
        y1={y1}
        x2={backX}
        y2={backY}
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dashed ? '7 6' : undefined}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={`M ${x2} ${y2} L ${backX + px} ${backY + py} L ${backX - px} ${backY - py} Z`}
        fill={color}
        stroke={color}
        strokeWidth={0.4}
        strokeLinejoin="round"
      />
    </g>
  );
}

export function Card({
  x,
  y,
  w,
  h,
  title,
  active = false,
  color = PAL.blue,
  fill = PAL.paper,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title?: string;
  active?: boolean;
  color?: string;
  fill?: string;
  children?: React.ReactNode;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={14}
        fill={fill}
        stroke={active ? color : PAL.line}
        strokeWidth={active ? 2.2 : 1.35}
        strokeLinejoin="round"
        filter="url(#rt2-card-shadow)"
      />
      {title ? (
        <g>
          <rect x={x + 7} y={y + 11} width={3} height={16} rx={1.5} fill={color} opacity={active ? 0.9 : 0.45} />
          <line x1={x + 16} y1={y + 33} x2={x + Math.max(26, Math.min(96, w - 32))} y2={y + 33} stroke={color} opacity={active ? 0.3 : 0.16} />
          <T x={x + 16} y={y + 26} size={17} weight={600} color={active ? color : PAL.ink}>
            {title}
          </T>
        </g>
      ) : null}
      {children}
    </g>
  );
}

export function Pill({
  x,
  y,
  w,
  h = 26,
  label,
  color = PAL.blue,
  fill,
  active = true,
  size = 14,
}: {
  x: number;
  y: number;
  w: number;
  h?: number;
  label: string;
  color?: string;
  fill?: string;
  active?: boolean;
  size?: number;
}) {
  return (
    <g opacity={active ? 1 : 0.45}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={h / 2}
        fill={fill || PAL.soft}
        stroke={color}
        strokeWidth={1.2}
        strokeLinejoin="round"
        filter="url(#rt2-card-shadow)"
      />
      <rect
        x={x + 6}
        y={y + 2.4}
        width={w - 12}
        height={2}
        rx={1}
        fill="#ffffff"
        opacity={0.42}
      />
      <T x={x + w / 2} y={y + h / 2 + size * 0.36} size={size} color={color} anchor="middle">
        {label}
      </T>
    </g>
  );
}

// Mood sprites are used in standalone teaching modules. Chapter vignettes use
// their own normalized raster sprites so each chapter has a distinct character.
const NARRATOR: Record<string, string> = {
  calm: './images/character/narrator-calm.png',
  happy: './images/character/narrator-happy.png',
  think: './images/character/narrator-think.png',
  sad: './images/character/narrator-sad.png',
};

const CHAPTER_SPRITES: Record<number, string> = Object.fromEntries(
  Array.from({ length: 10 }, (_, i) => [i + 1, `./images/character/chapter-${i + 1}.png`])
);

export function Chibi({
  x,
  y,
  s = 1,
  mood = 'calm',
  arm = 'down',
  chapter,
}: {
  x: number;
  y: number;
  s?: number;
  mood?: 'calm' | 'happy' | 'panic' | 'sad' | 'think';
  arm?: 'down' | 'up' | 'book' | 'point';
  chapter?: number;
}) {
  const moodKey = mood === 'panic' || mood === 'sad' ? 'sad' : mood === 'happy' ? 'happy' : mood === 'think' ? 'think' : 'calm';
  const href = chapter ? CHAPTER_SPRITES[chapter] : NARRATOR[moodKey];
  // `arm` is kept for call-site compatibility; the pose is baked into each sprite.
  void arm;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <image
        href={href}
        x={-60}
        y={-40}
        width={120}
        height={160}
        preserveAspectRatio="xMidYMid meet"
      />
    </g>
  );
}

export function Booklet({ x, y, s = 1, color = PAL.blue }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-20} y={-12} width={44} height={30} rx={4} fill="#ffffff" stroke={color} strokeWidth={0.8} opacity={0.45} />
      <rect x={-22} y={-14} width={44} height={30} rx={4} fill={color} opacity={0.18} />
      <rect x={-22} y={-14} width={44} height={30} rx={4} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <line x1={-22} y1={-5} x2={22} y2={-5} stroke={color} strokeWidth={1} opacity={0.6} />
      <line x1={-22} y1={4} x2={22} y2={4} stroke={color} strokeWidth={1} opacity={0.6} />
      <rect x={-22} y={-14} width={7} height={30} fill={color} opacity={0.5} />
      <path d="M 16 -14 L 22 -14 L 22 -8 Z" fill="#ffffff" opacity={0.55} />
    </g>
  );
}

export function Token({
  x,
  y,
  w = 62,
  h = 28,
  label,
  color = PAL.purple,
  filled = true,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  label: string;
  color?: string;
  filled?: boolean;
}) {
  return (
    <g opacity={filled ? 1 : 0.35}>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={filled ? PAL.purpleSoft : PAL.soft} stroke={color} strokeWidth={1.35} strokeLinejoin="round" filter="url(#rt2-card-shadow)" />
      <rect x={x + 4} y={y + 2} width={w - 8} height={1.8} rx={1} fill="#ffffff" opacity={0.4} />
      <T x={x + w / 2} y={y + h / 2 + 6} size={16} color={color} anchor="middle" weight={600}>
        {label}
      </T>
    </g>
  );
}

export function MiniRobot({ x, y, s = 1, arm = 'idle' }: { x: number; y: number; s?: number; arm?: 'idle' | 'reach' | 'grasp' }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-46} y={54} width={92} height={16} rx={8} fill="#c9d7ea" stroke={PAL.ink} strokeWidth={1} />
      <rect x={-10} y={16} width={20} height={40} rx={6} fill="#e7edf6" stroke={PAL.ink} strokeWidth={1.2} />
      <rect x={-26} y={-12} width={52} height={30} rx={10} fill="#f3f6fb" stroke={PAL.ink} strokeWidth={1.2} />
      <circle cx={0} cy={3} r={6} fill={PAL.blue} opacity={0.5} />
      {arm === 'reach' ? (
        <path d="M 22 0 Q 54 -12 78 6" fill="none" stroke={PAL.ink} strokeWidth={3} strokeLinecap="round" />
      ) : arm === 'grasp' ? (
        <g>
          <path d="M 22 0 Q 50 6 58 34" fill="none" stroke={PAL.ink} strokeWidth={3} strokeLinecap="round" />
          <path d="M 58 34 L 52 44 M 58 34 L 64 44" stroke={PAL.ink} strokeWidth={3} strokeLinecap="round" />
        </g>
      ) : (
        <path d="M 22 2 Q 44 16 30 30" fill="none" stroke={PAL.ink} strokeWidth={3} strokeLinecap="round" />
      )}
    </g>
  );
}

export function Bubble({
  x,
  y,
  w,
  h,
  text,
  color = PAL.blue,
  size = 15,
  tail = true,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  color?: string;
  size?: number;
  tail?: boolean;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={12} fill={PAL.paper} stroke={color} strokeWidth={1.6} />
      {tail ? <path d={`M ${x + 20} ${y + h} L ${x + 34} ${y + h + 12} L ${x + 44} ${y + h}`} fill={PAL.paper} stroke={color} strokeWidth={1.6} /> : null}
      <T x={x + 14} y={y + h / 2 + size * 0.36} size={size} color={PAL.ink}>
        {text}
      </T>
    </g>
  );
}
