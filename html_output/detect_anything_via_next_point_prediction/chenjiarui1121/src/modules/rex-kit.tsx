import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

// Shared drawing kit for the Rex-Omni tutorial: one lake-survey photo, birds,
// boxes, coordinate-token chips and the paper's Box-IoU reward (Eq. 3–4).

export type Box = [number, number, number, number];
export type Kind = 'egret' | 'duck' | 'gull';
export interface Bird { id: string; kind: Kind; box: Box; onRock?: boolean }

/** Scene coordinates are 1000 × 560 "image pixels". */
export const SCENE_W = 1000;
export const SCENE_H = 560;

export const BIRDS: Bird[] = [
  { id: 'E1', kind: 'egret', box: [120, 170, 200, 330], onRock: true },
  { id: 'E2', kind: 'egret', box: [215, 190, 285, 335], onRock: true },
  { id: 'E3', kind: 'egret', box: [430, 230, 500, 370] },
  { id: 'E4', kind: 'egret', box: [560, 250, 625, 385] },
  { id: 'E5', kind: 'egret', box: [800, 215, 870, 360] },
  { id: 'D1', kind: 'duck', box: [330, 400, 420, 460] },
  { id: 'D2', kind: 'duck', box: [650, 420, 740, 480] },
  { id: 'D3', kind: 'duck', box: [880, 410, 965, 470] },
  { id: 'G1', kind: 'gull', box: [520, 60, 610, 110] },
  { id: 'G2', kind: 'gull', box: [700, 90, 780, 135] },
];
export const EGRETS = BIRDS.filter(b => b.kind === 'egret');
export const KIND_ZH: Record<Kind, string> = { egret: '白鹭', duck: '野鸭', gull: '海鸥' };

export const C = {
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47', purple: '#7c3aed',
  ink: '#21324a', muted: '#68778f', line: '#d7deea', sky: '#eaf2f4', water: '#cfe0e3',
  water2: '#b7d0d6', reed: '#8aa37c', rock: '#b6aa98', rockDark: '#8f8372',
};

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const fmt = (v: number, d = 2) => Number(v.toFixed(d)).toString();

/** Teaching quantization: the paper states 1,000 bins (0–999) but not the rounding rule. */
export const quantize = (x: number, size: number) => clamp(Math.round((x / size) * 999), 0, 999);
export const dequantize = (k: number, size: number) => (k / 999) * size;
/** Scene coordinate (0–1000 wide, 0–560 tall) → coordinate token. */
export const tokX = (x: number) => quantize(x, SCENE_W);
export const tokY = (y: number) => quantize(y, SCENE_H);
export const boxTokens = (b: Box) => [tokX(b[0]), tokY(b[1]), tokX(b[2]), tokY(b[3])];

export function iou(a: Box, b: Box): number {
  const ix = Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0]));
  const iy = Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  const inter = ix * iy;
  const area = (r: Box) => Math.max(0, r[2] - r[0]) * Math.max(0, r[3] - r[1]);
  const union = area(a) + area(b) - inter;
  return union > 0 ? inter / union : 0;
}

export interface LabeledBox { box: Box; label: Kind }
export interface RewardResult { perGt: { iou: number; reward: number; match: number }[]; recall: number; precision: number; f1: number }

/** Box IoU reward, Eq. (3)–(4): GT-guided max-IoU matching, label check, F1-style combination. */
export function boxReward(preds: LabeledBox[], gts: LabeledBox[]): RewardResult {
  const eps = 1e-6;
  const perGt = gts.map(gt => {
    let best = -1, bestIou = 0;
    preds.forEach((p, i) => { const v = iou(gt.box, p.box); if (v > bestIou) { bestIou = v; best = i; } });
    const reward = best >= 0 && preds[best].label === gt.label ? bestIou : 0;
    return { iou: bestIou, reward, match: best };
  });
  const sum = perGt.reduce((s, r) => s + r.reward, 0);
  const recall = gts.length ? sum / gts.length : 0;
  const precision = preds.length ? sum / preds.length : 0;
  const f1 = (2 * precision * recall) / (precision + recall + eps);
  return { perGt, recall, precision, f1 };
}

/** Deterministic pseudo-random generator for reproducible teaching rollouts. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const m = matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** Map a pointer event to SVG user coordinates (accounts for the slide's CSS scaling). */
export function svgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

// ---------- drawing ----------

export function Rock({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return <g aria-hidden="true">
    <path d={`M${x} ${y + h} Q${x + w * .1} ${y + h * .2} ${x + w * .4} ${y + h * .05} Q${x + w * .8} ${y - h * .05} ${x + w} ${y + h * .55} L${x + w} ${y + h} Z`} fill={C.rock} />
    <path d={`M${x + w * .2} ${y + h * .45} Q${x + w * .5} ${y + h * .25} ${x + w * .8} ${y + h * .5}`} fill="none" stroke={C.rockDark} strokeWidth="4" opacity=".6" />
  </g>;
}

/** Visible window of the scene; drawing never leaves it (keeps rendered geometry inside its slot). */
export type View = [number, number, number, number];
const FULL: View = [0, 0, SCENE_W, SCENE_H];
const hillY = (x: number) => 162 + 16 * Math.sin(x / 95) + 9 * Math.sin(x / 41 + 1);
export const inView = (b: Box, v: View) => b[0] >= v[0] && b[1] >= v[1] && b[2] <= v[0] + v[2] && b[3] <= v[1] + v[3];

export function LakeScene({ children, dim = false, rocks = true, view = FULL }: { children?: React.ReactNode; dim?: boolean; rocks?: boolean; view?: View }) {
  const [vx, vy, vw, vh] = view; const x1 = vx + vw, y1 = vy + vh;
  const waterTop = Math.max(vy, 200);
  const hill = Array.from({ length: 41 }, (_, i) => { const x = vx + (vw * i) / 40; return `${x.toFixed(1)} ${clamp(hillY(x), vy, y1).toFixed(1)}`; });
  const ripples = [250, 300, 360, 430, 500].flatMap((y, i) => [[40 + i * 30, 300 + i * 25, y], [520 - i * 20, 780 - i * 10, y + 12]])
    .map(([a, b, y]) => [Math.max(a, vx + 4), Math.min(b, x1 - 4), y]).filter(([a, b, y]) => b > a && y > vy + 3 && y < y1 - 3);
  const full = vx <= 0 && vx + vw >= SCENE_W && vy <= 0 && vy + vh >= SCENE_H;
  return <g>
    <rect x={vx} y={vy} width={vw} height={vh} fill={C.sky} />
    {vy < 215 && <path d={`M${hill.join(' L')} L${x1} ${Math.min(215, y1)} L${vx} ${Math.min(215, y1)} Z`} fill="#c9d8cf" />}
    {y1 > 200 && <rect x={vx} y={waterTop} width={vw} height={y1 - waterTop} fill={C.water} />}
    {ripples.map(([a, b, y], i) => <path key={i} d={`M${a} ${y} H${b}`} stroke="#ffffff" strokeWidth="3" opacity=".55" strokeLinecap="round" />)}
    {full && <path d="M0 560 L0 470 Q20 430 30 470 L40 380 L52 470 Q70 420 78 480 L90 400 L102 560 Z" fill={C.reed} />}
    {full && <path d="M1000 560 L1000 460 Q980 420 972 470 L960 390 L948 470 Q930 430 924 490 L910 420 L900 560 Z" fill={C.reed} />}
    {rocks && inView([95, 310, 305, 388], view) && <Rock x={95} y={318} w={210} h={70} />}
    {children}
    {dim && <rect x={vx} y={vy} width={vw} height={vh} fill="#ffffff" opacity=".35" />}
  </g>;
}

export function Egret({ box, tone = '#ffffff' }: { box: Box; tone?: string }) {
  const [x0, y0, x1, y1] = box; const w = x1 - x0, h = y1 - y0;
  const cx = x0 + w * .45;
  return <g aria-hidden="true">
    <path d={`M${cx - w * .05} ${y1 - h * .22} L${cx - w * .12} ${y1} M${cx + w * .12} ${y1 - h * .22} L${cx + w * .18} ${y1}`} stroke="#3b3b3b" strokeWidth="3" />
    <ellipse cx={cx} cy={y1 - h * .34} rx={w * .42} ry={h * .14} fill={tone} stroke="#9aa7b0" strokeWidth="2" />
    <path d={`M${cx + w * .25} ${y1 - h * .4} Q${cx + w * .05} ${y0 + h * .45} ${cx + w * .3} ${y0 + h * .28} Q${cx + w * .45} ${y0 + h * .14} ${cx + w * .25} ${y0 + h * .1}`} fill="none" stroke={tone} strokeWidth={Math.max(6, w * .12)} strokeLinecap="round" />
    <path d={`M${cx + w * .25} ${y1 - h * .4} Q${cx + w * .05} ${y0 + h * .45} ${cx + w * .3} ${y0 + h * .28} Q${cx + w * .45} ${y0 + h * .14} ${cx + w * .25} ${y0 + h * .1}`} fill="none" stroke="#9aa7b0" strokeWidth="1.5" opacity=".6" />
    <circle cx={cx + w * .26} cy={y0 + h * .09} r={w * .1} fill={tone} stroke="#9aa7b0" strokeWidth="1.5" />
    <path d={`M${cx + w * .33} ${y0 + h * .08} L${x1} ${y0 + h * .12} L${cx + w * .33} ${y0 + h * .12} Z`} fill="#e3b33d" />
  </g>;
}

export function Duck({ box }: { box: Box }) {
  const [x0, y0, x1, y1] = box; const w = x1 - x0, h = y1 - y0;
  return <g aria-hidden="true">
    <ellipse cx={x0 + w * .45} cy={y0 + h * .62} rx={w * .45} ry={h * .32} fill="#9c7a55" />
    <ellipse cx={x0 + w * .5} cy={y0 + h * .58} rx={w * .22} ry={h * .14} fill="#7a5c3f" />
    <circle cx={x0 + w * .82} cy={y0 + h * .28} r={h * .22} fill="#2f6d4f" />
    <path d={`M${x0 + w * .95} ${y0 + h * .27} L${x1} ${y0 + h * .34} L${x0 + w * .93} ${y0 + h * .37} Z`} fill="#e3b33d" />
    <path d={`M${x0} ${y1 - 2} H${x1}`} stroke="#ffffff" strokeWidth="3" opacity=".7" />
  </g>;
}

export function Gull({ box }: { box: Box }) {
  const [x0, y0, x1, y1] = box; const w = x1 - x0, h = y1 - y0;
  return <g aria-hidden="true">
    <path d={`M${x0} ${y0 + h * .2} Q${x0 + w * .25} ${y0 + h * .05} ${x0 + w * .48} ${y0 + h * .6} Q${x0 + w * .72} ${y0 + h * .05} ${x1} ${y0 + h * .2} Q${x0 + w * .72} ${y0 + h * .35} ${x0 + w * .52} ${y1} Q${x0 + w * .4} ${y0 + h * .35} ${x0} ${y0 + h * .2} Z`} fill="#8e9aa6" />
    <ellipse cx={x0 + w * .5} cy={y0 + h * .68} rx={w * .1} ry={h * .2} fill="#f4f6f8" />
  </g>;
}

export function BirdArt({ bird }: { bird: { kind: Kind; box: Box } }) {
  return bird.kind === 'egret' ? <Egret box={bird.box} /> : bird.kind === 'duck' ? <Duck box={bird.box} /> : <Gull box={bird.box} />;
}

export function AllBirds({ birds = BIRDS, view = FULL }: { birds?: { kind: Kind; box: Box }[]; view?: View }) {
  return <g>{birds.filter(b => inView(b.box, view)).map((b, i) => <BirdArt key={i} bird={b} />)}</g>;
}

export function BoxRect({ box, color, dashed = false, width = 4, fill = false, opacity = 1 }:
  { box: Box; color: string; dashed?: boolean; width?: number; fill?: boolean; opacity?: number }) {
  const [x0, y0, x1, y1] = box;
  return <rect x={Math.min(x0, x1)} y={Math.min(y0, y1)} width={Math.abs(x1 - x0)} height={Math.abs(y1 - y0)}
    fill={fill ? color : 'none'} fillOpacity={fill ? .12 : 0} stroke={color} strokeWidth={width}
    strokeDasharray={dashed ? '10 7' : undefined} rx="3" opacity={opacity} />;
}

export type TokenKind = 'special' | 'phrase' | 'coord' | 'text' | 'faded' | 'bad';
export function TokenChip({ text, kind, active = false }: { text: string; kind: TokenKind; active?: boolean }) {
  return <span className={`rx-tok rx-tok-${kind}${active ? ' is-active' : ''}`}>{text}</span>;
}

/** Abbreviations follow the paper's Figure 4: P / P/ phrase markers, C / C/ coordinate markers. */
export const SPECIAL = { ps: 'P', pe: 'P/', cs: 'C', ce: 'C/' };

export function BirderBadge({ size = 120, label }: { size?: number; label?: string }) {
  return <div className="rx-badge" aria-hidden={label ? undefined : true}>
    <svg viewBox="0 0 120 120" width={size} height={size}>
      <circle cx="60" cy="60" r="58" fill="#eef5f1" stroke={C.line} strokeWidth="3" />
      <path d="M22 118 Q30 82 60 80 Q90 82 98 118 Z" fill="#5f7f6c" />
      <circle cx="60" cy="56" r="20" fill="#e5ae78" />
      <path d="M40 50 Q60 28 80 50 Z" fill="#40584a" />
      <rect x="40" y="50" width="16" height="13" rx="4" fill={C.blue} />
      <rect x="64" y="50" width="16" height="13" rx="4" fill={C.blue} />
      <path d="M56 56 H64" stroke={C.blue} strokeWidth="4" />
    </svg>
    {label && <span>{label}</span>}
  </div>;
}

/** The kit is registered so its file is assembled; it renders a compact color legend. */
export function RexKitLegend(_: WidgetProps) {
  return <div className="rx-legend">
    <TokenChip text={SPECIAL.ps} kind="special" /> <TokenChip text="白鹭" kind="phrase" /> <TokenChip text="<519>" kind="coord" />
  </div>;
}
