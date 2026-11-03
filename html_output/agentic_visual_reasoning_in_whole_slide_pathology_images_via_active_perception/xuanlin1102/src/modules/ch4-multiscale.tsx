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

const PANEL_W = 470;
const PANEL_H = 146;

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

/** 小型显微镜：本页讲倍率与观察工具。 */
function ScopeArt({ x, y, s = 1 }: { x: number; y: number; s?: number }): React.ReactElement {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-28} y={44} width={56} height={10} rx={4} fill="#4b5b6b" />
      <path d="M-6 44 V10" stroke="#4b5b6b" strokeWidth={7} strokeLinecap="round" />
      <rect x={-22} y={16} width={44} height={7} rx={3} fill="#8a99a8" />
      <path d="M-14 16 V6 M0 16 V2 M14 16 V6" stroke="#5b6b84" strokeWidth={5} strokeLinecap="round" />
      <path d="M-10 2 Q0 -26 10 2" fill="none" stroke="#4b5b6b" strokeWidth={7} strokeLinecap="round" />
      <rect x={-7} y={-30} width={14} height={16} rx={4} fill="#6d7d8c" />
      <circle cx={0} cy={-32} r={4} fill="#b98a4b" />
    </g>
  );
}

const MAG: { id: number; label: string; zoom: number; hint: string }[] = [
  { id: 0, label: '2.5×', zoom: 1, hint: '看整体结构' },
  { id: 1, label: '5×', zoom: 2.2, hint: '看腺体排列' },
  { id: 2, label: '10×', zoom: 4, hint: '看细胞核形态' },
];

const EVIDENCE: string[][] = [
  ['2.5× 结构轮廓完整', '2.5× 无大片坏死'],
  ['5× 腺体排列不齐', '5× 上皮层中断'],
  ['10× 核染色质加深', '10× 结构纹理紊乱'],
];

/** 病理医生盲测平均准确率，同一 ROI 预算（Fig.3 右 panel）。 */
const BARS: { key: string; label: string; value: number; color: string; opacity: number }[] = [
  { key: 'only-0', label: '仅 2.5×', value: 69.7, color: C.red, opacity: 0.92 },
  { key: 'only-1', label: '仅 5×', value: 62.9, color: C.red, opacity: 0.74 },
  { key: 'only-2', label: '仅 10×', value: 62.3, color: C.red, opacity: 0.56 },
  { key: 'all', label: '完整多倍率', value: 82.9, color: C.green, opacity: 1 },
];

const TONE: Record<Tone, { fg: string; bg: string; mark: string }> = {
  green: { fg: C.green, bg: 'rgba(34,141,92,0.10)', mark: '✓' },
  red: { fg: C.red, bg: 'rgba(196,63,82,0.10)', mark: '✕' },
  blue: { fg: C.blue, bg: 'rgba(39,68,110,0.10)', mark: '?' },
};

function ScalePanel({
  title,
  zoom,
  selected,
}: {
  title: string;
  zoom: number;
  selected: boolean;
}): React.ReactElement {
  return (
    <div style={{ width: PANEL_W, opacity: selected ? 1 : 0.55 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
        <span style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.42 }}>{title}</span>
        {selected ? null : (
          <span style={{ fontSize: 28, lineHeight: 1.42, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 4, padding: '0 6px' }}>未选</span>
        )}
      </div>
      <svg
        width={PANEL_W}
        height={PANEL_H}
        viewBox={`0 0 ${PANEL_W} ${PANEL_H}`}
        role="img"
        aria-label={`${title} 下的同一处组织`}
        style={{ display: 'block' }}
      >
        <rect x={0} y={0} width={PANEL_W} height={PANEL_H} fill={C.paper} />
        <SlideArt x={10} y={10} w={450} h={126} zoom={zoom} fx={0.56} fy={0.44} />
      </svg>
    </div>
  );
}

function feedbackFor(count: number): { tone: Tone; body: string } {
  if (count === 3) {
    return {
      tone: 'green',
      body: '三段证据互补，读者研究里这条完整序列达到 82.9%，是所有单倍率条件里最高的',
    };
  }
  if (count === 1) {
    return {
      tone: 'red',
      body: '单一倍率只看到一部分证据：2.5× 看整体结构、10× 看细胞核，都不完整',
    };
  }
  return {
    tone: 'blue',
    body: '两段证据已经互补，还差一个倍率：三段都选上才是论文的完整序列',
  };
}

export function MultiScale(_props: WidgetProps): React.ReactElement {
  const [chosen, setChosen] = useState<number[]>([0]);

  const toggle = (id: number): void => {
    setChosen((prev: number[]) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((v: number) => v !== id) : prev;
      }
      return [...prev, id].sort((a: number, b: number) => a - b);
    });
  };

  const items: string[] = chosen.reduce<string[]>((acc: string[], id: number) => acc.concat(EVIDENCE[id]), []);
  const fb = feedbackFor(chosen.length);
  const tone = TONE[fb.tone];
  const highlight = chosen.length === 3 ? 'all' : chosen.length === 1 ? `only-${chosen[0]}` : null;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: C.bg, color: C.ink, overflow: 'hidden' }}>
      {/* 上部：同一处的三个倍率 */}
      <div style={{ display: 'flex', gap: 31 }}>
        {MAG.map((m: { id: number; label: string; zoom: number; hint: string }) => (
          <ScalePanel key={m.id} title={`${m.label} · ${m.hint}`} zoom={m.zoom} selected={chosen.includes(m.id)} />
        ))}
      </div>

      {/* 中部：倍率开关 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 8, minHeight: 60 }}>
        {MAG.map((m: { id: number; label: string; zoom: number; hint: string }) => {
          const on = chosen.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(m.id)}
              style={{
                width: 320,
                minHeight: 60,
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                fontSize: 28,
                lineHeight: 1.42,
                fontFamily: 'inherit',
                fontWeight: 700,
                color: on ? C.ink : C.muted,
                background: on ? 'rgba(240,126,71,0.14)' : C.paper,
                border: on ? `3px solid ${C.orange}` : `2px solid ${C.border}`,
                borderRadius: 10,
                cursor: 'pointer',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-block',
                  width: 16,
                  height: 16,
                  background: on ? C.orange : 'transparent',
                  border: `2px solid ${on ? C.orange : C.muted}`,
                  borderRadius: 3,
                  flex: '0 0 16px',
                }}
              />
              {m.label} {m.hint}
            </button>
          );
        })}
        <span style={{ fontSize: 28, lineHeight: 1.42, color: C.muted }}>可多选；至少保留一个倍率</span>
        <svg width={44} height={60} viewBox="0 0 44 60" role="img" aria-label="显微镜" style={{ display: 'block', flex: '0 0 44px' }}>
          <ScopeArt x={22} y={24} s={0.6} />
        </svg>
      </div>

      {/* 反馈 */}
      <div
        role="status"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 18px',
          marginTop: 8,
          background: tone.bg,
          borderLeft: `8px solid ${tone.fg}`,
          borderTop: `1px solid ${C.border}`,
          borderRight: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
          borderRadius: 10,
        }}
      >
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
        <span style={{ fontSize: 28, lineHeight: 1.42 }}>{fb.body}</span>
      </div>

      {/* 下部：证据条目与实测条形 */}
      <div style={{ display: 'flex', gap: 32, flex: 1, minHeight: 0, marginTop: 8 }}>
        <div style={{ flex: '0 0 640px', background: C.paper, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 14px' }}>
          <div style={{ fontSize: 34, lineHeight: 1.42, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            本次观察到的证据条目
            <span style={{ fontSize: 28, lineHeight: 1.42, fontWeight: 400, color: C.purple, border: `1px solid ${C.purple}`, borderRadius: 4, padding: '0 6px' }}>演示</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {items.map((t: string) => (
              <span
                key={t}
                style={{
                  fontSize: 28,
                  lineHeight: 1.4,
                  padding: '3px 10px',
                  background: '#fdf6f8',
                  border: `1px solid ${SL.glassEdge}`,
                  borderRadius: 6,
                  color: C.ink,
                }}
              >
                {t}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.42, color: SL.inkSoft, marginTop: 8 }}>
            <SymbolHint meaning="倍率集合">M</SymbolHint>
            {' = {2.5×, 5×, 10×}；每倍率 '}
            <SymbolHint meaning="每个倍率保留的候选区域数，论文取 5">K</SymbolHint>
            {' = 5；每区 '}
            <SymbolHint meaning="每个区域的焦点观察预算，论文取 4">T</SymbolHint>
            {' = 4'}
          </div>
        </div>

        <div style={{ flex: '0 0 800px', background: C.paper, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 14px' }}>
          <div style={{ fontSize: 34, lineHeight: 1.42, fontWeight: 700 }}>病理医生盲测平均准确率（横轴 0–100%）</div>
          <div style={{ fontSize: 28, lineHeight: 1.42, color: C.muted, marginTop: 2 }}>
            SlideBench-VQA (BCNB) 子集 · 同一 ROI 预算 · 越高越好
          </div>
          <div style={{ marginTop: 6 }}>
            {BARS.map((b: { key: string; label: string; value: number; color: string; opacity: number }) => {
              const on = highlight === b.key;
              const paperMethod = b.key === 'all';
              return (
                <div key={b.key} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 41 }}>
                  <span
                    style={{
                      position: 'relative',
                      width: 180,
                      flex: '0 0 180px',
                      paddingLeft: 18,
                      fontSize: 28,
                      lineHeight: 1.42,
                      whiteSpace: 'nowrap',
                      fontWeight: on ? 700 : 400,
                      color: on ? C.ink : SL.inkSoft,
                    }}
                  >
                    <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, color: paperMethod ? C.green : on ? C.orange : 'transparent' }}>
                      {paperMethod ? '✓' : '▸'}
                    </span>
                    {b.label}
                  </span>
                  <span style={{ position: 'relative', width: 420, flex: '0 0 420px', height: 16, background: '#e7ebf1', borderRadius: 8, overflow: 'hidden' }}>
                    <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${b.value}%`, background: b.color, opacity: b.opacity, borderRadius: 8 }} />
                  </span>
                  <span style={{ width: 110, flex: '0 0 110px', fontSize: 28, lineHeight: 1.42, fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: b.color, opacity: b.opacity }}>
                    {b.value.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
