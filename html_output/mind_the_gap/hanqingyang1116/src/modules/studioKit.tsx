import React from 'react';

/** 语义色（contract.md §5）——录音棚版本的统一取色 */
export const C = {
  bg: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  wood: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
};

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const fmt = (v: number, d = 2) => v.toFixed(d);

/** 大提琴：琴身 + 琴颈 + 弓。x,y 为琴身中心。 */
export function Cello({
  x = 0,
  y = 0,
  s = 1,
  strings = 4,
  mute = false,
  bow = 0.5,
}: {
  x?: number;
  y?: number;
  s?: number;
  strings?: number;
  mute?: boolean;
  bow?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d="M0 -96 C34 -96 40 -66 30 -34 C23 -12 56 4 56 44 C56 84 30 106 0 106 C-30 106 -56 84 -56 44 C-56 4 -23 -12 -30 -34 C-40 -66 -34 -96 0 -96 Z"
        fill={C.wood}
        stroke="#6b2f0b"
        strokeWidth={3}
        opacity={0.95}
      />
      <path d="M0 -96 L0 -170 M-5 -170 L5 -170" stroke={C.wood} strokeWidth={9} strokeLinecap="round" />
      <path d="M-6 -186 L6 -186" stroke="#6b2f0b" strokeWidth={8} strokeLinecap="round" />
      {Array.from({ length: strings }, (_, i) => (
        <path
          key={i}
          d={`M${-9 + i * 6} -168 L${-9 + i * 6} 100`}
          stroke="#f6e7cf"
          strokeWidth={1.6}
          opacity={0.85}
        />
      ))}
      <path d="M-16 -18 Q-24 0 -16 18" fill="none" stroke="#3d1c06" strokeWidth={3} />
      <path d="M16 -18 Q24 0 16 18" fill="none" stroke="#3d1c06" strokeWidth={3} />
      <path d="M-40 34 H40" stroke="#3d1c06" strokeWidth={3} opacity={0.6} />
      <g transform={`rotate(${-24 + bow * 10} 0 0)`} opacity={0.9}>
        <path d={`M-120 ${118 - bow * 6} L120 ${-118 + bow * 6}`} stroke="#c9a06a" strokeWidth={5} strokeLinecap="round" />
      </g>
      {mute ? <rect x={-10} y={-58} width={20} height={14} rx={3} fill={C.muted} /> : null}
    </g>
  );
}

/** 麦克风：capsule 朝下，杆向上吊或向下支。 */
export function Mic({
  x = 0,
  y = 0,
  s = 1,
  color = C.blue,
  hang = true,
  active = false,
}: {
  x?: number;
  y?: number;
  s?: number;
  color?: string;
  hang?: boolean;
  active?: boolean;
}) {
  const len = hang ? -70 : 70;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={`M0 0 L0 ${len}`} stroke={C.dark} strokeWidth={4} />
      <rect x={-13} y={-16} width={26} height={34} rx={11} fill={color} stroke="#ffffff" strokeWidth={2} opacity={active ? 1 : 0.75} />
      {Array.from({ length: 4 }, (_, i) => (
        <path key={i} d={`M-9 ${-8 + i * 7} H9`} stroke="#ffffff" strokeWidth={1.4} opacity={0.55} />
      ))}
      {active ? <circle cx={0} cy={1} r={26} fill="none" stroke={color} strokeWidth={2} opacity={0.35} /> : null}
    </g>
  );
}

/** 音分表：指针 −40~+40 音分，α 线可画成橙色刻线。 */
export function Meter({
  x = 0,
  y = 0,
  s = 1,
  cents = 0,
  alpha = null,
  label = '音分差',
}: {
  x?: number;
  y?: number;
  s?: number;
  cents?: number;
  alpha?: number | null;
  label?: string;
}) {
  const ang = clamp(cents / 40, -1, 1) * 62;
  const aAng = alpha == null ? null : clamp(alpha / 40, -1, 1) * 62;
  const needle = (deg: number, color: string, w: number, len = 46) => (
    <path
      d={`M0 0 L${Math.sin((deg * Math.PI) / 180) * len} ${-Math.cos((deg * Math.PI) / 180) * len}`}
      stroke={color}
      strokeWidth={w}
      strokeLinecap="round"
    />
  );
  return (
    <g>
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <path d="M-70 8 A70 70 0 0 1 70 8" fill="#fbfcf9" stroke={C.line} strokeWidth={3} />
        {[-60, -30, 0, 30, 60].map((d) => (
          <path
            key={d}
            d={`M${Math.sin((d * Math.PI) / 180) * 56} ${-Math.cos((d * Math.PI) / 180) * 56} L${
              Math.sin((d * Math.PI) / 180) * 66
            } ${-Math.cos((d * Math.PI) / 180) * 66}`}
            stroke={C.muted}
            strokeWidth={2}
          />
        ))}
        {aAng != null ? <g>{needle(aAng, C.orange, 4, 64)}</g> : null}
        {needle(ang, Math.abs(cents) > 12 ? C.red : C.blue, 5)}
        <circle cx={0} cy={0} r={7} fill={C.ink} />
      </g>
      <text x={x} y={y + 40 * s} textAnchor="middle" fontSize={20 * s} fill={C.muted}>
        {label}
      </text>
      <text x={x} y={y + 72 * s} textAnchor="middle" fontSize={26 * s} fontWeight={700} fill={Math.abs(cents) > 12 ? C.red : C.ink}>
        {cents > 0 ? '+' : ''}
        {cents.toFixed(1)} 音分
      </text>
    </g>
  );
}

/** 竖向推子 */
export function Fader({
  x = 0,
  y = 0,
  h = 150,
  t = 0.5,
  color = C.blue,
  label = '',
}: {
  x?: number;
  y?: number;
  h?: number;
  t?: number;
  color?: string;
  label?: string;
}) {
  const knobY = y + h - clamp(t, 0, 1) * h;
  return (
    <g>
      <rect x={x - 5} y={y} width={10} height={h} rx={5} fill="#e6ebf3" />
      <rect x={x - 5} y={knobY} width={10} height={y + h - knobY} rx={5} fill={color} opacity={0.35} />
      <rect x={x - 26} y={knobY - 10} width={52} height={20} rx={6} fill={color} stroke="#ffffff" strokeWidth={2} />
      <text x={x} y={y + h + 32} textAnchor="middle" fontSize={20} fill={C.muted}>
        {label}
      </text>
    </g>
  );
}

/** 磁带式波形条：amp 控制振幅，offset 控制基线（模拟间隙） */
export function Track({
  x,
  y,
  w,
  h = 56,
  color = C.blue,
  amp = 1,
  gap = 0,
  seed = 1,
}: {
  x: number;
  y: number;
  w: number;
  h?: number;
  color?: string;
  amp?: number;
  gap?: number;
  seed?: number;
}) {
  const pts: string[] = [];
  const n = 60;
  for (let i = 0; i <= n; i += 1) {
    const px = x + (w * i) / n;
    const wave = Math.sin(i * 0.55 + seed) * 0.55 + Math.sin(i * 1.7 + seed * 2) * 0.35;
    const py = y + h / 2 + gap * h * 0.5 + wave * (h / 2 - 4) * amp;
    pts.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(1)} ${py.toFixed(1)}`);
  }
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill="#fbfcf9" stroke={C.line} strokeWidth={2} />
      <path d={pts.join(' ')} fill="none" stroke={color} strokeWidth={2.4} opacity={0.9} />
    </g>
  );
}

/** 调音台底板 */
export function Board({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={16} fill="#efe7db" stroke={C.wood} strokeWidth={3} opacity={0.96} />
      <rect x={x + 14} y={y + 14} width={w - 28} height={h - 28} rx={10} fill="#f7f2e9" stroke={C.line} strokeWidth={2} />
    </g>
  );
}

/** 磁带标签 */
export function Tape({
  x = 0,
  y = 0,
  label = '',
  tone = 'blue',
  w = 150,
}: {
  x?: number;
  y?: number;
  label?: string;
  tone?: 'blue' | 'red' | 'green' | 'muted';
  w?: number;
}) {
  const color = tone === 'red' ? C.red : tone === 'green' ? C.green : tone === 'muted' ? C.muted : C.blue;
  return (
    <g>
      <rect x={x - w / 2} y={y - 19} width={w} height={38} rx={8} fill="#ffffff" stroke={color} strokeWidth={2.5} />
      <rect x={x - w / 2 + 6} y={y - 13} width={w * 0.3} height={26} rx={4} fill={color} opacity={0.16} />
      <text x={x} y={y + 7} textAnchor="middle" fontSize={20} fill={color} fontWeight={600}>
        {label}
      </text>
    </g>
  );
}

/** 页脚说明（SVG 内） */
export function Caption({ x, y, text, size = 21 }: { x: number; y: number; text: string; size?: number }) {
  return (
    <text x={x} y={y} fontSize={size} fill={C.muted}>
      {text}
    </text>
  );
}

/** 左场景右说明的通用骨架；wide 时把场景撑满宽度 */
export function PageFrame({
  scene,
  side,
  hint,
  wide = false,
}: {
  scene: React.ReactNode;
  side: React.ReactNode;
  hint?: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? 'studio-page is-wide' : 'studio-page'}>
      <div className="studio-scene">
        {scene}
        {hint ? <div className="studio-hint">{hint}</div> : null}
      </div>
      <aside className="studio-side">{side}</aside>
    </div>
  );
}
