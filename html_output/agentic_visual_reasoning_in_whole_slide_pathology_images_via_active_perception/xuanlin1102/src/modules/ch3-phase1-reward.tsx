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

/** 演示用的基准分类损失，只在本页出现，标注为示意。 */
const BASE_CE = 0.62;
/** 视野框放大倍数与半边长。 */
const FIELD_Z = 2.4;
const FIELD_HALF = 56;
/** 玻片在本页的位置。 */
const SLIDE = { x: 18, y: 26, w: 744, h: 378 };

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

type Tone = 'green' | 'red' | 'blue';

interface Observation {
  id: number;
  mark: string;
  name: string;
  tag: '强证据' | '弱证据' | '干扰' | '强干扰';
  g: number;
  noteX: number;
  noteY: number;
  focusX: number;
  focusY: number;
  tilt: number;
}

const OBS: Observation[] = [
  { id: 0, mark: '①', name: '背景组织', tag: '干扰', g: -0.09, noteX: 150, noteY: 96, focusX: 300, focusY: 210, tilt: -2 },
  { id: 1, mark: '②', name: '上皮层中断', tag: '强证据', g: 0.31, noteX: 660, noteY: 96, focusX: 426, focusY: 259, tilt: 2.4 },
  { id: 2, mark: '③', name: '染色偏淡', tag: '强干扰', g: -0.04, noteX: 660, noteY: 340, focusX: 500, focusY: 240, tilt: -3 },
  { id: 3, mark: '④', name: '细胞核密集', tag: '弱证据', g: 0.12, noteX: 150, noteY: 340, focusX: 363, focusY: 295, tilt: 1.8 },
];

const TONE: Record<Tone, { fg: string; bg: string; mark: string }> = {
  green: { fg: C.green, bg: 'rgba(34,141,92,0.10)', mark: '✓' },
  red: { fg: C.red, bg: 'rgba(196,63,82,0.10)', mark: '✕' },
  blue: { fg: C.blue, bg: 'rgba(39,68,110,0.10)', mark: '?' },
};

function sign(n: number): string {
  return `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(2)}`;
}

function feedbackFor(o: Observation | null): { tone: Tone; title: string; body: string } {
  if (o === null) {
    return {
      tone: 'blue',
      title: '还没选观察',
      body: '先挑一条形态笔记：四次观察带来的损失变化各不相同。',
    };
  }
  if (o.g > 0.02) {
    return {
      tone: 'green',
      title: `这次观察：${o.name}（${o.tag}）`,
      body: '分类损失下降：这次观察带来正奖励，会被强化',
    };
  }
  if (o.g < -0.02) {
    return {
      tone: 'red',
      title: `这次观察：${o.name}（${o.tag}）`,
      body: '损失反而上升：这次观察是干扰，会被抑制',
    };
  }
  return {
    tone: 'blue',
    title: `这次观察：${o.name}（${o.tag}）`,
    body: '几乎没帮上忙：奖励接近 0',
  };
}

/** 显微镜视野框：框内是同一处组织被放大的结构。 */
function FieldFrame({ cx, cy }: { cx: number; cy: number }): React.ReactElement {
  const half = FIELD_HALF;
  return (
    <g>
      <defs>
        <pattern
          id="ch3p1-field"
          width={780}
          height={430}
          patternUnits="userSpaceOnUse"
          patternTransform={`translate(${cx} ${cy}) scale(${FIELD_Z}) translate(${-cx} ${-cy})`}
        >
          <SlideArt x={SLIDE.x} y={SLIDE.y} w={SLIDE.w} h={SLIDE.h} />
        </pattern>
        <clipPath id="ch3p1-field-clip">
          <rect x={cx - half} y={cy - half} width={half * 2} height={half * 2} />
        </clipPath>
      </defs>
      <rect x={cx - half} y={cy - half} width={half * 2} height={half * 2} fill="#ffffff" />
      <g clipPath="url(#ch3p1-field-clip)">
        <rect x={cx - half} y={cy - half} width={half * 2} height={half * 2} fill="url(#ch3p1-field)" />
      </g>
      <rect x={cx - half} y={cy - half} width={half * 2} height={half * 2} fill="none" stroke={SL.brass} strokeWidth={4} />
      <rect
        x={cx - half + 5}
        y={cy - half + 5}
        width={half * 2 - 10}
        height={half * 2 - 10}
        fill="none"
        stroke="#ffffff"
        strokeWidth={1.5}
        opacity={0.85}
      />
      <path
        d={`M${cx - half} ${cy - 12} V${cy + 12} M${cx - 12} ${cy - half} H${cx + 12}`}
        fill="none"
        stroke={SL.brass}
        strokeWidth={3}
      />
      <path
        d={`M${cx + half} ${cy - 12} V${cy + 12} M${cx - 12} ${cy + half} H${cx + 12}`}
        fill="none"
        stroke={SL.brass}
        strokeWidth={3}
      />
    </g>
  );
}

function NoteCard({ o, selected, onPick }: { o: Observation; selected: boolean; onPick: () => void }): React.ReactElement {
  const positive = o.g > 0;
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onPick}
      style={{
        position: 'absolute',
        left: o.noteX,
        top: o.noteY,
        transform: `translate(-50%, -50%) rotate(${o.tilt}deg)`,
        width: 212,
        padding: '10px 12px 10px 14px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        background: '#fbfdfe',
        border: selected ? `3px solid ${C.orange}` : `2px solid ${SL.glassEdge}`,
        borderLeft: `5px solid ${selected ? C.orange : SL.brass}`,
        borderRadius: 6,
        boxShadow: selected ? '0 9px 18px rgba(33,50,74,0.28)' : '0 4px 10px rgba(33,50,74,0.14)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        color: C.ink,
        lineHeight: 1.45,
      }}
    >
      <span style={{ fontSize: 28, lineHeight: 1.45, fontWeight: 700 }}>
        {o.mark} {o.name}
      </span>
      <span style={{ fontSize: 28, lineHeight: 1.45, fontVariantNumeric: 'tabular-nums', color: positive ? C.green : C.red }}>
        g = {sign(o.g)}
      </span>
      <span style={{ fontSize: 28, lineHeight: 1.45, color: C.muted }}>{o.tag}</span>
    </button>
  );
}

function ReadoutRow({
  label,
  value,
  color,
  big,
  badge,
}: {
  label: React.ReactNode;
  value: string;
  color: string;
  big?: boolean;
  badge?: string;
}): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: '4px 14px',
        borderBottom: `1px solid ${C.border}`,
        lineHeight: 1.3,
      }}
    >
      <span style={{ fontSize: 28, lineHeight: 1.45, color: SL.inkSoft, display: 'flex', alignItems: 'center', gap: 8 }}>
        {label}
        {badge ? (
          <span style={{ fontSize: 28, lineHeight: 1.45, color: C.purple, border: `1px solid ${C.purple}`, borderRadius: 4, padding: '0 6px' }}>{badge}</span>
        ) : null}
      </span>
      <span style={{ fontSize: big ? 44 : 34, lineHeight: 1.35, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

export function Phase1Reward(_props: WidgetProps): React.ReactElement {
  const [picked, setPicked] = useState<number | null>(null);
  const active: Observation | null = picked === null ? null : OBS[picked];
  const ceAfter: number | null = active === null ? null : BASE_CE - active.g;
  const g: number | null = active === null ? null : active.g;
  const fb = feedbackFor(active);
  const tone = TONE[fb.tone];

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', gap: 52, background: C.bg, color: C.ink, overflow: 'hidden' }}>
      <div style={{ flex: '0 0 780px', height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.42 }}>玻片局部：四次观察都记成形态笔记</div>
        <div style={{ position: 'relative', width: 780, height: 430, marginTop: 4 }}>
          <svg width={780} height={430} viewBox="0 0 780 430" role="img" aria-label="玻片局部、四条形态笔记与放大后的显微镜视野框" style={{ display: 'block' }}>
            <SlideArt x={SLIDE.x} y={SLIDE.y} w={SLIDE.w} h={SLIDE.h} />
            {OBS.map((o) => (
              <line
                key={`lead-${o.id}`}
                x1={o.noteX}
                y1={o.noteY}
                x2={o.focusX}
                y2={o.focusY}
                stroke={SL.inkSoft}
                strokeWidth={2}
                strokeDasharray="5 6"
                opacity={picked === null ? 0.4 : picked === o.id ? 0.95 : 0.2}
              />
            ))}
            {active !== null ? <FieldFrame cx={active.focusX} cy={active.focusY} /> : null}
            {OBS.map((o) => (
              <circle key={`pt-${o.id}`} cx={o.focusX} cy={o.focusY} r={5} fill={C.orange} opacity={picked === o.id ? 1 : 0.7} />
            ))}
          </svg>
          {OBS.map((o) => (
            <NoteCard key={o.id} o={o} selected={picked === o.id} onPick={() => setPicked(o.id)} />
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 28, lineHeight: 1.45, color: C.muted }}>
          示意：形态笔记上的损失变化由本页演示给出，不是论文报告值。
          <br />
          选中一条形态笔记，右侧三行读数与奖励符号随之更新。
        </div>
      </div>

      <div style={{ flex: '0 0 640px', height: '100%', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.42 }}>这一步的读数</div>

        <div style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
          <ReadoutRow
            label={
              <span>
                CE(
                <SymbolHint meaning="上一步焦点区域的异常分类损失（交叉熵）">
                  z<sub>t−1</sub>
                </SymbolHint>
                )
              </span>
            }
            value={BASE_CE.toFixed(2)}
            color={SL.inkSoft}
            badge="示意"
          />
          <ReadoutRow
            label={
              <span>
                CE(
                <SymbolHint meaning="本次观察后同一焦点区域的异常分类损失">
                  z<sub>t</sub>
                </SymbolHint>
                )
              </span>
            }
            value={ceAfter === null ? '—' : ceAfter.toFixed(2)}
            color={ceAfter === null ? C.muted : C.ink}
          />
          <ReadoutRow
            label={
              <span>
                <SymbolHint meaning="本步即时奖励：分类损失下降量">g<sub>t</sub></SymbolHint>
              </span>
            }
            value={g === null ? '—' : sign(g)}
            color={g === null ? C.muted : g > 0.02 ? C.green : g < -0.02 ? C.red : C.blue}
            big
          />
        </div>

        <div style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 16px' }}>
          <div style={{ fontSize: 34, lineHeight: 1.42 }}>
            <SymbolHint meaning="本步即时奖励：分类损失下降量">g<sub>t</sub></SymbolHint>
            {' = CE('}
            <SymbolHint meaning="上一步焦点区域">
              z<sub>t−1</sub>
            </SymbolHint>
            {', '}
            <SymbolHint meaning="导航标签：这块区域是正常还是异常">
              y<sub>nav</sub>
            </SymbolHint>
            {') − CE('}
            <SymbolHint meaning="本次观察后同一焦点区域">
              z<sub>t</sub>
            </SymbolHint>
            {', '}
            <SymbolHint meaning="导航标签：这块区域是正常还是异常">
              y<sub>nav</sub>
            </SymbolHint>
            {')'}
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.42, color: SL.inkSoft, marginTop: 6 }}>
            L<sub>repr</sub> = Σ CE(z<sub>t</sub>, y<sub>nav</sub>) + α Σ D<sub>KL</sub>(stopgrad(p<sub>T</sub>) ‖ p<sub>t</sub>)
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.42, color: C.muted, marginTop: 4 }}>
            α = 1；PPO 裁剪 0.2；β<sub>stab</sub> = β<sub>ent</sub> = 0.01
          </div>
        </div>

        <div
          role="status"
          style={{
            flex: 1,
            minHeight: 152,
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
