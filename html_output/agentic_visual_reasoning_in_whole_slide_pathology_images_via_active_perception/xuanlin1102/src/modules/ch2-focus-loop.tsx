import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';

const C = {
  silk: '#f2e7cd',
  silkDeep: '#e0cda6',
  silkEdge: '#c9b184',
  wood: '#8a5a33',
  ink: '#21324a',
  inkSoft: '#5b6b84',
  brass: '#b98a4b',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  muted: '#68778f',
  border: '#d7deea',
  paper: '#fffdf4',
  bg: '#f5f8f0',
} as const;

const SCROLL_W = 900;
const SCROLL_H = 360;
const SCROLL_Y = 40;
const SVG_H = 440;
const T_BUDGET = 4;

type Evidence = { u: number; v: number };
type Observation = { u: number; v: number; s: number; hit: boolean };

const EVIDENCE: Evidence[] = [
  { u: 0.42, v: 0.38 },
  { u: 0.68, v: 0.62 },
  { u: 0.22, v: 0.7 },
];

const H_CHAIN = ['h₀', 'h₁', 'h₂', 'h₃', 'h₄'];

type Pt = [number, number];
type Rect = { x0: number; y0: number; x1: number; y1: number };

function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/* ==========================================================================
   病理玻片通用画法：玻璃基底、磨砂标签区、盖玻片边、H&E 组织切片
   （玫瑰/淡紫区块 + 深色细胞核点 + 腔隙）。放大用 <pattern> +
   patternTransform 实现，元素包围盒不随放大变化。
   ========================================================================== */
const SL = {
  glass: '#eef4f7',
  glassEdge: '#c7d4dc',
  label: '#f7f3e6',
  labelLine: '#b9c4cf',
  tissue: '#dfbcc7',
  tissueDeep: '#c69aab',
  nucleus: '#8a5f74',
  lumen: '#fbf7f2',
  ink: '#21324a',
  inkSoft: '#5b6b84',
  brass: '#b98a4b',
};

function SlideArt({ x, y, w, h, zoom = 1, fx = 0.5, fy = 0.5 }:
  { x: number; y: number; w: number; h: number; zoom?: number; fx?: number; fy?: number }) {
  const uid = React.useId().replace(/:/g, '');
  const pad = 6;                       // 盖玻片边距
  const labelW = Math.max(18, w * 0.14);
  const inner = { x: x + pad, y: y + pad, w: w - pad * 2 - labelW, h: h - pad * 2 };
  const blob = (cx: number, cy: number, rx: number, ry: number, seed: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2;
      const k = 0.82 + 0.22 * Math.sin(seed + i * 1.7) + 0.1 * Math.cos(seed * 2.3 + i);
      pts.push(`${(cx + Math.cos(a) * rx * k) * inner.w} ${(cy + Math.sin(a) * ry * k) * inner.h}`);
    }
    return `M${pts.join(' L')} Z`;
  };
  const nuclei: React.ReactElement[] = [];
  for (let i = 0; i < 46; i += 1) {
    const a = i * 2.399963;
    const r = Math.sqrt((i + 0.6) / 46) * 0.42;
    const nx = inner.w * (0.5 + Math.cos(a) * r);
    const ny = inner.h * (0.5 + Math.sin(a) * r * 0.86);
    nuclei.push(
      <circle key={i} cx={nx} cy={ny} r={Math.max(1, inner.h * (0.008 + 0.006 * ((i % 3) / 2)))} fill={SL.nucleus} opacity={0.28 + 0.12 * (i % 4)} />,
    );
  }
  // 组织切片（局部坐标：以 inner 左上为原点）
  const tissue = (
    <g>
      <rect x={0} y={0} width={inner.w} height={inner.h} fill="#fdf9f5" />
      {/* 嗜伊红组织浆：几块不规则粉染区 */}
      <path d={blob(0.28, 0.34, 0.3, 0.34, 1.1)} fill={SL.tissue} opacity={0.92} />
      <path d={blob(0.66, 0.46, 0.28, 0.3, 2.6)} fill={SL.tissue} opacity={0.86} />
      <path d={blob(0.46, 0.72, 0.34, 0.24, 4.2)} fill={SL.tissue} opacity={0.8} />
      {/* 深染色区（核密集） */}
      <path d={blob(0.56, 0.4, 0.16, 0.17, 3.4)} fill={SL.tissueDeep} opacity={0.55} />
      <path d={blob(0.3, 0.62, 0.13, 0.12, 5.1)} fill={SL.tissueDeep} opacity={0.45} />
      {/* 组织纹理：细密走向线 */}
      {Array.from({ length: 16 }).map((_, i) => (
        <path key={`t${i}`} d={`M0 ${(inner.h / 16) * (i + 0.5)} C${inner.w * 0.3} ${(inner.h / 16) * (i + 0.5) - inner.h * 0.03} ${inner.w * 0.7} ${(inner.h / 16) * (i + 0.5) + inner.h * 0.03} ${inner.w} ${(inner.h / 16) * (i + 0.5)}`}
          fill="none" stroke={SL.tissueDeep} strokeWidth={0.7} opacity={0.16} />
      ))}
      {/* 细胞核与腔隙 */}
      {nuclei}
      <ellipse cx={inner.w * 0.38} cy={inner.h * 0.46} rx={inner.w * 0.018} ry={inner.h * 0.03} fill={SL.lumen} opacity={0.5} />
      <ellipse cx={inner.w * 0.7} cy={inner.h * 0.66} rx={inner.w * 0.014} ry={inner.h * 0.022} fill={SL.lumen} opacity={0.45} />
      <ellipse cx={inner.w * 0.52} cy={inner.h * 0.26} rx={inner.w * 0.012} ry={inner.h * 0.018} fill={SL.lumen} opacity={0.4} />
    </g>
  );
  return (
    <g>
      <defs>
        <clipPath id={`sl-clip-${uid}`}>
          <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} />
        </clipPath>
        <pattern id={`sl-tissue-${uid}`} width={inner.w} height={inner.h} patternUnits="userSpaceOnUse"
          patternTransform={`translate(${inner.x} ${inner.y}) translate(${fx * inner.w} ${fy * inner.h}) scale(${zoom}) translate(${-fx * inner.w} ${-fy * inner.h})`}>
          {tissue}
        </pattern>
      </defs>
      {/* 玻璃基底与盖玻片 */}
      <rect x={x} y={y} width={w} height={h} rx={5} fill={SL.glass} stroke={SL.glassEdge} strokeWidth={1.5} />
      <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} rx={4} fill="none" stroke="#ffffff" strokeWidth={1.2} opacity={0.8} />
      {/* 组织切片 */}
      <g clipPath={`url(#sl-clip-${uid})`}>
        <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} fill={`url(#sl-tissue-${uid})`} />
      </g>
      <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} fill="none" stroke={SL.glassEdge} strokeWidth={1} />
      {/* 磨砂标签区：编号与两条文字线 */}
      <rect x={x + w - labelW} y={y + pad} width={labelW - pad} height={h - pad * 2} rx={3} fill={SL.label} stroke={SL.glassEdge} strokeWidth={0.8} />
      <line x1={x + w - labelW + 4} y1={y + pad + (h - pad * 2) * 0.32} x2={x + w - pad - 3} y2={y + pad + (h - pad * 2) * 0.32} stroke={SL.labelLine} strokeWidth={1.4} />
      <line x1={x + w - labelW + 4} y1={y + pad + (h - pad * 2) * 0.5} x2={x + w - pad - 3} y2={y + pad + (h - pad * 2) * 0.5} stroke={SL.labelLine} strokeWidth={1.1} />
    </g>
  );
}

function toPath(points: Pt[], close: boolean): string {
  if (points.length === 0) return '';
  let d = `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  for (let i = 1; i < points.length; i += 1) {
    d += ` L${points[i][0].toFixed(1)} ${points[i][1].toFixed(1)}`;
  }
  return close ? `${d} Z` : d;
}

function intersectRect(a: Rect, b: Rect): Rect {
  return {
    x0: Math.max(a.x0, b.x0),
    y0: Math.max(a.y0, b.y0),
    x1: Math.min(a.x1, b.x1),
    y1: Math.min(a.y1, b.y1),
  };
}

function crossPoint(a: Pt, b: Pt, axis: 0 | 1, value: number): Pt {
  const d = b[axis] - a[axis];
  const t = Math.abs(d) < 1e-6 ? 0 : (value - a[axis]) / d;
  return axis === 0 ? [value, a[1] + (b[1] - a[1]) * t] : [a[0] + (b[0] - a[0]) * t, value];
}

function clipPolygon(points: Pt[], r: Rect): Pt[] {
  const bounds: { axis: 0 | 1; value: number; keepGreater: boolean }[] = [
    { axis: 0, value: r.x0, keepGreater: true },
    { axis: 0, value: r.x1, keepGreater: false },
    { axis: 1, value: r.y0, keepGreater: true },
    { axis: 1, value: r.y1, keepGreater: false },
  ];
  let pts = points;
  for (const b of bounds) {
    if (pts.length === 0) return pts;
    const inside = (p: Pt): boolean => (b.keepGreater ? p[b.axis] >= b.value : p[b.axis] <= b.value);
    const next: Pt[] = [];
    for (let i = 0; i < pts.length; i += 1) {
      const cur = pts[i];
      const prev = pts[(i + pts.length - 1) % pts.length];
      const curIn = inside(cur);
      const prevIn = inside(prev);
      if (curIn) {
        if (!prevIn) next.push(crossPoint(prev, cur, b.axis, b.value));
        next.push(cur);
      } else if (prevIn) {
        next.push(crossPoint(prev, cur, b.axis, b.value));
      }
    }
    pts = next;
  }
  return pts;
}

function clipSegment(a: Pt, b: Pt, r: Rect): [Pt, Pt] | null {
  let t0 = 0;
  let t1 = 1;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const p = [-dx, dx, -dy, dy];
  const q = [a[0] - r.x0, r.x1 - a[0], a[1] - r.y0, r.y1 - a[1]];
  for (let i = 0; i < 4; i += 1) {
    if (p[i] === 0) {
      if (q[i] < 0) return null;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return null;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return null;
        if (t < t1) t1 = t;
      }
    }
  }
  return [[a[0] + t0 * dx, a[1] + t0 * dy], [a[0] + t1 * dx, a[1] + t1 * dy]];
}

function clipPolyline(points: Pt[], r: Rect): Pt[][] {
  const runs: Pt[][] = [];
  let current: Pt[] = [];
  const same = (a: Pt, b: Pt): boolean => Math.abs(a[0] - b[0]) < 0.05 && Math.abs(a[1] - b[1]) < 0.05;
  for (let i = 0; i + 1 < points.length; i += 1) {
    const seg = clipSegment(points[i], points[i + 1], r);
    if (!seg) {
      if (current.length > 1) runs.push(current);
      current = [];
    } else if (current.length === 0) {
      current = [seg[0], seg[1]];
    } else if (same(current[current.length - 1], seg[0])) {
      current.push(seg[1]);
    } else {
      if (current.length > 1) runs.push(current);
      current = [seg[0], seg[1]];
    }
  }
  if (current.length > 1) runs.push(current);
  return runs;
}

/** 把一组折线裁进画幅后再画：视野框贴边时框线与角标都不会越出画幅。 */
function StrokeRuns({ runs, color, width, opacity }: { runs: Pt[][]; color: string; width: number; opacity?: number }) {
  return (
    <g fill="none" stroke={color} strokeWidth={width} strokeLinejoin="round" strokeLinecap="round" opacity={opacity}>
      {runs.filter((run) => run.length >= 2).map((run, i) => (
        <path key={i} d={toPath(run, false)} />
      ))}
    </g>
  );
}

type Mark =
  | { kind: 'line'; pts: Pt[]; width: number }
  | { kind: 'dot'; cx: number; cy: number; r: number };

/** 三处形态异常：上皮层中断、细胞巢、结构紊乱，分别落在三个证据点上。 */
const MARKS: Mark[] = [
  { kind: 'line', pts: [[350, 168], [370, 169]], width: 3 },
  { kind: 'line', pts: [[388, 171], [408, 172]], width: 3 },
  { kind: 'dot', cx: 606, cy: 258, r: 4 },
  { kind: 'dot', cx: 615, cy: 263, r: 3.4 },
  { kind: 'dot', cx: 609, cy: 269, r: 3 },
  { kind: 'line', pts: [[186, 286], [196, 293], [204, 288], [214, 295]], width: 2.6 },
];

function dotPoints(cx: number, cy: number, r: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < 10; i += 1) {
    const a = (i / 10) * Math.PI * 2;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

/** 组织里散在的细胞核：跟着视野一起放大，读起来才像镜下细胞。 */
const hash = (n: number): number => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const NUCLEI: Pt[] = Array.from({ length: 64 }, (_, i) => {
  const a = hash(i + 7) * Math.PI * 2;
  const rr = Math.sqrt(hash(i + 71)) * 0.44;
  return [387 + Math.cos(a) * rr * 380, 220 + Math.sin(a) * rr * 150];
});

function CellLayer({ map, clip }: { map: (p: Pt) => Pt; clip: Rect | null }) {
  return (
    <g fill={SL.nucleus} opacity={0.55}>
      {NUCLEI.map((p, i) => {
        const poly = dotPoints(p[0], p[1], 2.4).map(map);
        const pts = clip ? clipPolygon(poly, clip) : poly;
        if (pts.length < 3) return null;
        return <path key={i} d={toPath(pts, true)} />;
      })}
    </g>
  );
}

function MarkLayer({ map, clip, strokeScale }: { map: (p: Pt) => Pt; clip: Rect | null; strokeScale: number }) {
  const nodes: React.ReactElement[] = [];
  MARKS.forEach((mark, i) => {
    if (mark.kind === 'line') {
      const runs = clip ? clipPolyline(mark.pts.map(map), clip) : [mark.pts.map(map)];
      runs.forEach((run, j) => {
        if (run.length >= 2) {
          nodes.push(
            <path
              key={`l${i}-${j}`}
              d={toPath(run, false)}
              fill="none"
              stroke={SL.nucleus}
              strokeWidth={mark.width * strokeScale}
              strokeLinecap="round"
              opacity={0.9}
            />,
          );
        }
      });
      return;
    }
    const poly = dotPoints(mark.cx, mark.cy, mark.r).map(map);
    const pts = clip ? clipPolygon(poly, clip) : poly;
    if (pts.length >= 3) {
      nodes.push(<path key={`d${i}`} d={toPath(pts, true)} fill={SL.nucleus} opacity={0.85} />);
    }
  });
  return <g>{nodes}</g>;
}

function Slider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <label style={{ display: 'block', width: '100%' }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 28, lineHeight: 1.2 }}>
        <span>{props.label}</span>
        <span style={{ fontSize: 24, color: C.orange, fontVariantNumeric: 'tabular-nums' }}>{props.display}</span>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        aria-label={props.label}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => props.onChange(Number(e.target.value))}
        style={{ width: '100%', height: 20, accentColor: C.orange, cursor: 'pointer', display: 'block' }}
      />
    </label>
  );
}

export function FocusLoop(_props: WidgetProps) {
  const [u, setU] = useState<number>(0.42);
  const [v, setV] = useState<number>(0.38);
  const [s, setS] = useState<number>(0.28);
  const [step, setStep] = useState<number>(0);
  const [history, setHistory] = useState<Observation[]>([]);
  const [dragging, setDragging] = useState<boolean>(false);

  const half = (s * SCROLL_W) / 2;
  const cx = u * SCROLL_W;
  const cy = SCROLL_Y + v * SCROLL_H;

  const hasEvidence = EVIDENCE.some((e) => {
    const dx = (u - e.u) * SCROLL_W;
    const dy = (v - e.v) * SCROLL_H;
    return Math.sqrt(dx * dx + dy * dy) <= half * 0.92;
  });

  const moveTo = (clientX: number, clientY: number, rect: DOMRect) => {
    if (rect.width === 0 || rect.height === 0) return;
    const x = ((clientX - rect.left) / rect.width) * SCROLL_W;
    const y = ((clientY - rect.top) / rect.height) * SVG_H;
    setU(clampUnit(x / SCROLL_W));
    setV(clampUnit((y - SCROLL_Y) / SCROLL_H));
  };

  const handleDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    svg.setPointerCapture(e.pointerId);
    setDragging(true);
    moveTo(e.clientX, e.clientY, svg.getBoundingClientRect());
  };

  const handleMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging) return;
    moveTo(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
  };

  const handleUp = (e: React.PointerEvent<SVGSVGElement>) => {
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const record = () => {
    if (step >= T_BUDGET) return;
    const entry: Observation = { u, v, s, hit: hasEvidence };
    setHistory((prev) => [...prev, entry]);
    setStep((prev) => prev + 1);
  };

  const reset = () => {
    setU(0.42);
    setV(0.38);
    setS(0.28);
    setStep(0);
    setHistory([]);
    setDragging(false);
  };

  const sizeWarning = s >= 0.5;

  const feedbackText = step >= T_BUDGET
    ? '焦点预算 T=4 用完：导航器只用 4 次观察就要给出异常分数'
    : step === 0
      ? '拖视野框到可疑处，再用尺度滑块决定框多大'
      : hasEvidence
        ? '这一步框到了上皮层中断，笔记记下一条形态描述'
        : '这一框落在正常组织上，笔记里只剩一句“未见异常”';

  const feedbackTone = step >= T_BUDGET ? C.blue : step === 0 ? C.blue : hasEvidence ? C.green : C.blue;

  // 视野框与放大的组织：放大用 <pattern> 的 patternTransform 完成，
  // 页面上参与布局的始终是整张玻片，几何不会随倍率撑出正文区域。
  const inset: Rect = { x0: 12, y0: 12, x1: SCROLL_W - 12, y1: SVG_H - 12 };
  const fov: Rect = { x0: cx - half, y0: cy - half, x1: cx + half, y1: cy + half };
  const fovClip = intersectRect(fov, inset);
  const innerX = 6;
  const innerY = SCROLL_Y + 6;
  const innerW = SCROLL_W - 12 - Math.max(18, SCROLL_W * 0.14);
  const innerH = SCROLL_H - 12;
  const fx = clampUnit((cx - innerX) / innerW);
  const fy = clampUnit((cy - innerY) / innerH);
  const toFov = (p: Pt): Pt => [cx + (p[0] - cx) / s, cy + (p[1] - cy) / s];

  const frameRuns = clipPolyline(
    [[fov.x0, fov.y0], [fov.x1, fov.y0], [fov.x1, fov.y1], [fov.x0, fov.y1], [fov.x0, fov.y0]],
    inset,
  );
  const bracket = 26;
  const bracketRuns = [
    [[fov.x0, fov.y0], [fov.x0 + bracket, fov.y0]],
    [[fov.x0, fov.y0], [fov.x0, fov.y0 + bracket]],
    [[fov.x1, fov.y0], [fov.x1 - bracket, fov.y0]],
    [[fov.x1, fov.y0], [fov.x1, fov.y0 + bracket]],
    [[fov.x0, fov.y1], [fov.x0 + bracket, fov.y1]],
    [[fov.x0, fov.y1], [fov.x0, fov.y1 - bracket]],
    [[fov.x1, fov.y1], [fov.x1 - bracket, fov.y1]],
    [[fov.x1, fov.y1], [fov.x1, fov.y1 - bracket]],
  ].flatMap((seg) => clipPolyline(seg as Pt[], inset));
  const crossRuns = clipPolyline([[cx - 10, cy], [cx + 10, cy]], inset);
  const crossRunsV = clipPolyline([[cx, cy - 10], [cx, cy + 10]], inset);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', gap: 32, color: C.ink }}>
      <div style={{ width: 940, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
        <svg
          viewBox={`0 0 ${SCROLL_W} ${SVG_H}`}
          width={900}
          height={SVG_H}
          role="img"
          aria-label="全切片玻片与可拖动的显微镜视野框，框内是同一处组织被放大的结构"
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerCancel={handleUp}
          style={{ touchAction: 'none', cursor: dragging ? 'grabbing' : 'grab', display: 'block' }}
        >
          <defs>
            <clipPath id="ch2f-fov-clip">
              <rect x={fovClip.x0} y={fovClip.y0} width={Math.max(0, fovClip.x1 - fovClip.x0)} height={Math.max(0, fovClip.y1 - fovClip.y0)} />
            </clipPath>
          </defs>
          <rect x="0" y="0" width={SCROLL_W} height={SVG_H} fill={C.bg} />
          <SlideArt x={0} y={SCROLL_Y} w={SCROLL_W} h={SCROLL_H} />
          <CellLayer map={(p: Pt) => p} clip={null} />
          <MarkLayer map={(p: Pt) => p} clip={null} strokeScale={1} />
          <rect x="0" y="0" width={SCROLL_W} height={SVG_H} fill={C.ink} fillOpacity="0.25" />
          <g clipPath="url(#ch2f-fov-clip)">
            <SlideArt x={0} y={SCROLL_Y} w={SCROLL_W} h={SCROLL_H} zoom={1 / s} fx={fx} fy={fy} />
            <CellLayer map={toFov} clip={fovClip} />
            <MarkLayer map={toFov} clip={fovClip} strokeScale={1 / s} />
          </g>
          <StrokeRuns runs={frameRuns} color={SL.brass} width={3} />
          <StrokeRuns runs={bracketRuns} color={SL.ink} width={6} />
          <StrokeRuns runs={crossRuns} color={SL.ink} width={1.4} opacity={0.45} />
          <StrokeRuns runs={crossRunsV} color={SL.ink} width={1.4} opacity={0.45} />
        </svg>

        <div style={{ width: 900 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', fontSize: 18, color: C.muted }}>
            <span>形态笔记：每按一次“下一次观察”，就添一条记录</span>
            <span>已记 {history.length} 条</span>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 6, height: 120 }}>
            {history.length === 0 ? (
              <div
                style={{
                  width: 900,
                  height: 112,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px dashed ${C.border}`,
                  borderRadius: 4,
                  fontSize: 22,
                  color: C.muted,
                }}
              >
                还没有记录：先把视野框移到可疑处，再按“下一次观察”
              </div>
            ) : (
              history.map((item, i) => {
                const tone = item.hit ? C.green : C.blue;
                return (
                  <div
                    key={i}
                    style={{
                      width: 210,
                      height: 112,
                      padding: '6px 10px',
                      boxSizing: 'border-box',
                      background: C.paper,
                      border: `2px solid ${tone}`,
                      borderRadius: 3,
                      transform: `rotate(${i % 2 === 0 ? -1.4 : 1.2}deg)`,
                      boxShadow: '0 2px 6px rgba(33,50,74,0.14)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <span style={{ fontSize: 15, color: C.muted }}>第 {i + 1} 次观察</span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: tone }}>{item.hit ? '上皮层中断' : '未见异常'}</span>
                    <span style={{ fontSize: 14, color: C.muted }}>
                      u {item.u.toFixed(2)} · v {item.v.toFixed(2)} · s {item.s.toFixed(2)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <aside style={{ width: 500, height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Slider
          label="横向位置 u"
          value={u}
          min={0}
          max={1}
          step={0.01}
          display={u.toFixed(2)}
          onChange={(value: number) => setU(value)}
        />
        <Slider
          label="纵向位置 v"
          value={v}
          min={0}
          max={1}
          step={0.01}
          display={v.toFixed(2)}
          onChange={(value: number) => setV(value)}
        />
        <Slider
          label="视野框大小 s"
          value={s}
          min={0.15}
          max={0.6}
          step={0.01}
          display={s.toFixed(2)}
          onChange={(value: number) => setS(value)}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <button
            type="button"
            onClick={record}
            disabled={step >= T_BUDGET}
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#ffffff',
              background: step >= T_BUDGET ? C.muted : C.orange,
              border: 'none',
              borderRadius: 6,
              padding: '9px 22px',
              cursor: step >= T_BUDGET ? 'not-allowed' : 'pointer',
              opacity: step >= T_BUDGET ? 0.5 : 1,
            }}
          >
            下一次观察
          </button>
          <button
            type="button"
            onClick={reset}
            style={{
              fontSize: 24,
              color: C.muted,
              background: 'transparent',
              border: 'none',
              padding: 0,
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            重来
          </button>
        </div>

        <div>
          <div style={{ fontSize: 18, color: C.muted }}>
            状态链：已完成的观察条数 {step} / {T_BUDGET}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            {H_CHAIN.map((label, i) => (
              <React.Fragment key={label}>
                {i > 0 ? <span style={{ fontSize: 18, color: C.muted }}>→</span> : null}
                <span
                  style={{
                    minWidth: 42,
                    textAlign: 'center',
                    fontSize: 22,
                    padding: '2px 4px',
                    borderRadius: 4,
                    color: i <= step ? '#ffffff' : C.muted,
                    background: i <= step ? C.blue : 'transparent',
                    border: `1.5px ${i <= step ? 'solid' : 'dashed'} ${i <= step ? C.blue : C.border}`,
                  }}
                >
                  {label}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div style={{ borderLeft: `3px solid ${C.purple}`, paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <div style={{ fontSize: 28, lineHeight: 1.4 }}>
            a<sub>t</sub> = (<SymbolHint meaning="下一次观察的相对中心位置（横向）">u<sub>t</sub></SymbolHint>,{' '}
            <SymbolHint meaning="下一次观察的相对中心位置（纵向）">v<sub>t</sub></SymbolHint>,{' '}
            <SymbolHint meaning="下一次观察的相对空间尺度">s<sub>t</sub></SymbolHint>)
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.4 }}>
            h<sub>t</sub> = <SymbolHint meaning="FocusNet：编码整体印象与焦点区域并更新状态">π<sub>F</sub></SymbolHint>(
            <SymbolHint meaning="截至上一步已获取观察的视觉状态">h<sub>t−1</sub></SymbolHint>,{' '}
            <SymbolHint meaning="第 t 次观察取得的焦点区域">I<sub>t</sub></SymbolHint>)
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.4 }}>
            <SymbolHint meaning="当前区域的异常 logits（正常或异常）">z<sub>t−1</sub></SymbolHint>, a<sub>t</sub> ={' '}
            <SymbolHint meaning="ActionNet：输出异常 logits 与下一个焦点动作">π<sub>θ</sub></SymbolHint>(h<sub>t−1</sub>)
          </div>
        </div>

        <div
          style={{
            border: `2px solid ${feedbackTone}`,
            borderRadius: 6,
            background: '#ffffff',
            padding: '8px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            boxSizing: 'border-box',
          }}
        >
          <span style={{ fontSize: 28, lineHeight: 1.3, fontWeight: 600, color: feedbackTone }}>{feedbackText}</span>
          {sizeWarning ? (
            <span style={{ fontSize: 24, fontWeight: 700, color: C.orange }}>■ 视野框太大，局部细节被摊薄</span>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
