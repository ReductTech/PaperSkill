import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0',
  paper: '#fbfdf7',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  border: '#d7deea',
  muted: '#68778f',
  ink: '#21324a',
} as const;

type Tone = 'green' | 'red' | 'blue';

const PANEL_W = 296;
const PANEL_H = 300;
const REF_X = 148;
const REF_Y = 148;
/** 归一化用的最大平均偏移（像素），一致性读数据此换算成 0–100。 */
const MAX_OFFSET = 82;

/* ==========================================================================
   病理科阅片画法：玻璃基底、磨砂标签区、盖玻片边、H&E 组织切片
   （玫瑰/淡紫不透明区块 + 深色细胞核点 + 腔隙 + 组织纹理）。
   放大用 pattern + patternTransform 实现，元素包围盒不变。
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

function SlideArt({
  x,
  y,
  w,
  h,
  zoom = 1,
  fx = 0.5,
  fy = 0.5,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  zoom?: number;
  fx?: number;
  fy?: number;
}): React.ReactElement {
  const uid = React.useId().replace(/:/g, '');
  const pad = 6;
  const labelW = Math.max(18, w * 0.14);
  const inner = { x: x + pad, y: y + pad, w: w - pad * 2 - labelW, h: h - pad * 2 };
  const blob = (cx: number, cy: number, rx: number, ry: number, seed: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const k = 0.82 + 0.22 * Math.sin(seed + i * 1.7) + 0.1 * Math.cos(seed * 2.3 + i);
      pts.push(`${(cx + Math.cos(a) * rx * k) * inner.w} ${(cy + Math.sin(a) * ry * k) * inner.h}`);
    }
    return `M${pts.join(' L')} Z`;
  };
  const nuclei: React.ReactElement[] = [];
  for (let i = 0; i < 46; i++) {
    const a = i * 2.399963;
    const r = Math.sqrt((i + 0.6) / 46) * 0.42;
    const cx = inner.w * (0.5 + Math.cos(a) * r);
    const cy = inner.h * (0.5 + Math.sin(a) * r * 0.86);
    nuclei.push(
      <circle key={i} cx={cx} cy={cy} r={Math.max(1, inner.h * (0.008 + 0.006 * ((i % 3) / 2)))} fill={SL.nucleus} opacity={0.28 + 0.12 * (i % 4)} />,
    );
  }
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
        <pattern
          id={`sl-tissue-${uid}`}
          width={inner.w}
          height={inner.h}
          patternUnits="userSpaceOnUse"
          patternTransform={`translate(${inner.x} ${inner.y}) translate(${fx * inner.w} ${fy * inner.h}) scale(${zoom}) translate(${-fx * inner.w} ${-fy * inner.h})`}
        >
          {tissue}
        </pattern>
      </defs>
      <rect x={x} y={y} width={w} height={h} rx={5} fill={SL.glass} stroke={SL.glassEdge} strokeWidth={1.5} />
      <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} rx={4} fill="none" stroke="#ffffff" strokeWidth={1.2} opacity={0.8} />
      <g clipPath={`url(#sl-clip-${uid})`}>
        <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} fill={`url(#sl-tissue-${uid})`} />
      </g>
      <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} fill="none" stroke={SL.glassEdge} strokeWidth={1} />
      <rect
        x={x + w - labelW}
        y={y + pad}
        width={labelW - pad}
        height={h - pad * 2}
        rx={3}
        fill={SL.label}
        stroke={SL.glassEdge}
        strokeWidth={0.8}
      />
      <line
        x1={x + w - labelW + 4}
        y1={y + pad + (h - pad * 2) * 0.32}
        x2={x + w - pad - 3}
        y2={y + pad + (h - pad * 2) * 0.32}
        stroke={SL.labelLine}
        strokeWidth={1.4}
      />
      <line
        x1={x + w - labelW + 4}
        y1={y + pad + (h - pad * 2) * 0.5}
        x2={x + w - pad - 3}
        y2={y + pad + (h - pad * 2) * 0.5}
        stroke={SL.labelLine}
        strokeWidth={1.1}
      />
    </g>
  );
}

const TONE: Record<Tone, { fg: string; bg: string; mark: string }> = {
  green: { fg: C.green, bg: 'rgba(34,141,92,0.10)', mark: '✓' },
  red: { fg: C.red, bg: 'rgba(196,63,82,0.10)', mark: '✕' },
  blue: { fg: C.blue, bg: 'rgba(39,68,110,0.10)', mark: '?' },
};

interface Offsets {
  geo: { dx: number; dy: number };
  app: { dx: number; dy: number };
}

function offsetsFor(jitter: number, on: boolean): Offsets {
  if (on) {
    return {
      geo: { dx: 11 * jitter, dy: -7 * jitter },
      app: { dx: -9 * jitter, dy: 8 * jitter },
    };
  }
  return {
    geo: { dx: 64 * jitter, dy: -42 * jitter },
    app: { dx: -58 * jitter, dy: 46 * jitter },
  };
}

function distance(o: { dx: number; dy: number }): number {
  return Math.sqrt(o.dx * o.dx + o.dy * o.dy);
}

function consistencyScore(jitter: number, on: boolean): number {
  const o = offsetsFor(jitter, on);
  const avg = (distance(o.geo) + distance(o.app)) / 2;
  const raw = 100 * (1 - avg / MAX_OFFSET);
  return Math.max(0, Math.min(100, Math.round(raw)));
}

function feedbackFor(jitter: number, on: boolean): { tone: Tone; title: string; body: string } {
  if (jitter < 0.08) {
    return {
      tone: 'blue',
      title: '扰动强度接近 0',
      body: '没有扰动时差别不大，扰动越大差别越明显',
    };
  }
  if (on) {
    return {
      tone: 'green',
      title: '一致性约束：开（论文做法）',
      body: '三组视野框仍收敛在同一处结构：一致性目标把轨迹钉住',
    };
  }
  return {
    tone: 'red',
    title: '一致性约束：关（去掉 Phase II）',
    body: '把 Phase II 去掉后，框随扰动漂走，同一处证据被指到两个地方',
  };
}

function FocusBox({ cx, cy }: { cx: number; cy: number }): React.ReactElement {
  const half = 44;
  const k = 15;
  const x0 = cx - half;
  const y0 = cy - half;
  const x1 = cx + half;
  const y1 = cy + half;
  return (
    <g>
      <rect x={x0} y={y0} width={half * 2} height={half * 2} fill="rgba(240,126,71,0.14)" stroke={C.orange} strokeWidth={3} />
      <path d={`M${x0} ${y0 + k} L${x0} ${y0} L${x0 + k} ${y0}`} fill="none" stroke={C.orange} strokeWidth={5} strokeLinecap="square" />
      <path d={`M${x1 - k} ${y0} L${x1} ${y0} L${x1} ${y0 + k}`} fill="none" stroke={C.orange} strokeWidth={5} strokeLinecap="square" />
      <path d={`M${x0} ${y1 - k} L${x0} ${y1} L${x0 + k} ${y1}`} fill="none" stroke={C.orange} strokeWidth={5} strokeLinecap="square" />
      <path d={`M${x1 - k} ${y1} L${x1} ${y1} L${x1} ${y1 - k}`} fill="none" stroke={C.orange} strokeWidth={5} strokeLinecap="square" />
    </g>
  );
}

function VersionPanel({
  variant,
  jitter,
  offset,
}: {
  variant: 'base' | 'geo' | 'app';
  jitter: number;
  offset: { dx: number; dy: number };
}): React.ReactElement {
  const cx = REF_X + offset.dx;
  const cy = REF_Y + offset.dy;
  const rot = variant === 'geo' ? 1.2 * jitter : 0;
  const scale = variant === 'geo' ? 1 + 0.03 * jitter : 1;
  const wash = variant === 'app' ? 0.12 + 0.22 * jitter : 0;
  return (
    <svg
      width={PANEL_W}
      height={PANEL_H}
      viewBox={`0 0 ${PANEL_W} ${PANEL_H}`}
      role="img"
      aria-label="同一视野的一个版本"
      style={{ display: 'block' }}
    >
      <rect x={0} y={0} width={PANEL_W} height={PANEL_H} fill={C.bg} />
      <g transform={`translate(${REF_X} ${REF_Y}) rotate(${rot}) scale(${scale}) translate(${-REF_X} ${-REF_Y})`}>
        <SlideArt x={6} y={10} w={284} h={280} />
      </g>
      {wash > 0 ? <rect x={0} y={0} width={PANEL_W} height={PANEL_H} fill={SL.tissue} opacity={wash} /> : null}
      {/* 无扰动时的参考位置 */}
      <path
        d={`M${REF_X - 12} ${REF_Y} L${REF_X + 12} ${REF_Y} M${REF_X} ${REF_Y - 12} L${REF_X} ${REF_Y + 12}`}
        fill="none"
        stroke={C.blue}
        strokeWidth={2}
        opacity={0.5}
        strokeDasharray="4 4"
      />
      {distance(offset) > 3 ? (
        <line x1={REF_X} y1={REF_Y} x2={cx} y2={cy} stroke={C.red} strokeWidth={2.5} strokeDasharray="5 5" opacity={0.85} />
      ) : null}
      <FocusBox cx={cx} cy={cy} />
    </svg>
  );
}

export function Phase2Consistency(_props: WidgetProps): React.ReactElement {
  const [jitter, setJitter] = useState<number>(0.55);
  const [consistencyOn, setConsistencyOn] = useState<boolean>(true);
  const off = offsetsFor(jitter, consistencyOn);
  const score = consistencyScore(jitter, consistencyOn);
  const fb = feedbackFor(jitter, consistencyOn);
  const tone = TONE[fb.tone];
  const good = score >= 65;
  const barColor = good ? C.green : C.red;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', gap: 52, background: C.bg, color: C.ink, overflow: 'hidden' }}>
      <div style={{ flex: '0 0 940px', height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.42 }}>同一处视野，三种看法</div>

        <div style={{ display: 'flex', gap: 26, marginTop: 8 }}>
          {(
            [
              { key: 'base' as const, title: '原图（无扰动）', offset: { dx: 0, dy: 0 } },
              { key: 'geo' as const, title: '旋转+缩放', offset: off.geo },
              { key: 'app' as const, title: '染色偏移', offset: off.app },
            ]
          ).map((p) => (
            <div key={p.key} style={{ width: PANEL_W }}>
              <div style={{ fontSize: 34, lineHeight: 1.42, marginBottom: 6 }}>{p.title}</div>
              <VersionPanel variant={p.key} jitter={jitter} offset={p.offset} />
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 8,
            flex: 1,
            background: C.paper,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: '6px 18px',
            overflow: 'hidden',
          }}
        >
          <div style={{ fontSize: 28, lineHeight: 1.42 }}>一致性目标：同一处证据在扰动下仍指向同一位置</div>
          <div style={{ fontSize: 28, lineHeight: 1.42, marginTop: 4, color: C.ink }}>
            L<sub>cons</sub> = D<sub>JS</sub>(H‖H<sub>geo</sub>) + D<sub>JS</sub>(H‖H<sub>app</sub>)
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.42, marginLeft: 96, color: C.ink }}>
            + (1/T) Σ D<sub>JS</sub>(H<sub>t</sub>‖H<sub>t</sub><sup>geo</sup>)
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.42, marginTop: 4, color: C.muted }}>
            <SymbolHint meaning="第 t 步的归一化高斯证据热图">H<sub>t</sub></SymbolHint>
            {'：第 t 步归一化高斯证据热图；'}
            <SymbolHint meaning="Jensen–Shannon 散度">D<sub>JS</sub></SymbolHint>
            {'：Jensen–Shannon 散度'}
          </div>
        </div>
      </div>

      <div style={{ flex: '0 0 480px', height: '100%', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
        <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.42 }}>扰动强度与一致性</div>

        <div style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontSize: 28, lineHeight: 1.42 }}>扰动强度</span>
            <span style={{ fontSize: 34, lineHeight: 1.42, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: C.orange }}>{jitter.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={jitter}
            aria-label="扰动强度"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJitter(Number(e.target.value))}
            style={{ display: 'block', width: '100%', height: 22, margin: '6px 0 0', accentColor: C.orange }}
          />
        </div>

        <button
          type="button"
          aria-pressed={consistencyOn}
          onClick={() => setConsistencyOn((v: boolean) => !v)}
          style={{
            minHeight: 60,
            padding: '8px 16px',
            fontSize: 28,
            lineHeight: 1.42,
            fontFamily: 'inherit',
            fontWeight: 700,
            color: '#ffffff',
            background: consistencyOn ? C.green : C.red,
            border: `2px solid ${consistencyOn ? C.green : C.red}`,
            borderRadius: 10,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <span aria-hidden="true" style={{ display: 'inline-block', width: 16, height: 16, borderRadius: '50%', background: '#ffffff', flex: '0 0 16px' }} />
          一致性约束：{consistencyOn ? '开' : '关'}
        </button>

        <div style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontSize: 28, lineHeight: 1.42 }}>
              一致性读数
              <span style={{ fontSize: 28, lineHeight: 1.42, color: C.purple, border: `1px solid ${C.purple}`, borderRadius: 4, padding: '0 6px', marginLeft: 8 }}>示意</span>
            </span>
            <span style={{ fontSize: 44, lineHeight: 1.32, fontWeight: 700, color: barColor, fontVariantNumeric: 'tabular-nums' }}>
              {score}
              <span style={{ fontSize: 28, lineHeight: 1.32, color: C.muted }}> /100</span>
            </span>
          </div>
          <div style={{ position: 'relative', height: 18, marginTop: 6, background: '#e7ebf1', borderRadius: 9, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${score}%`, background: barColor, borderRadius: 9 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 28, lineHeight: 1.42, color: barColor, fontWeight: 700 }}>
            <span>{good ? '三框仍聚在同一处' : '三框已经散开'}</span>
            <span style={{ color: C.muted, fontWeight: 400 }}>0–100</span>
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.42, marginTop: 2, color: C.muted }}>
            由 1 − 平均偏移 / 最大偏移 换算
          </div>
        </div>

        <div
          role="status"
          style={{
            flex: 1,
            minHeight: 150,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 6,
            padding: '10px 18px',
            background: tone.bg,
            borderLeft: `8px solid ${tone.fg}`,
            borderTop: `1px solid ${C.border}`,
            borderRight: `1px solid ${C.border}`,
            borderBottom: `1px solid ${C.border}`,
            borderRadius: 10,
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.45, color: tone.fg, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              aria-hidden="true"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: `3px solid ${tone.fg}`,
                color: tone.fg,
                fontSize: 22,
                lineHeight: 1.2,
                flex: '0 0 36px',
              }}
            >
              {tone.mark}
            </span>
            {fb.title}
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.45 }}>{fb.body}</div>
        </div>
      </div>
    </div>
  );
}
