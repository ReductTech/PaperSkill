import React, { useState } from 'react';
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

const K_OPTIONS: number[] = [1, 3, 5, 8, 10];
const BCNB: number[] = [58.77, 59.03, 60.81, 59.27, 58.84];
const WSI: number[] = [51.26, 52.71, 54.92, 52.53, 50.26];

type Candidate = { label: string; score: number; suspicious: boolean; left: number; top: number };

const CANDIDATES: Candidate[] = [
  { label: 'R1', score: 0.92, suspicious: true, left: 18, top: 28 },
  { label: 'R2', score: 0.88, suspicious: true, left: 39, top: 20 },
  { label: 'R3', score: 0.81, suspicious: true, left: 59, top: 32 },
  { label: 'R4', score: 0.79, suspicious: true, left: 80, top: 22 },
  { label: 'R5', score: 0.62, suspicious: false, left: 25, top: 52 },
  { label: 'R6', score: 0.55, suspicious: false, left: 47, top: 60 },
  { label: 'R7', score: 0.48, suspicious: false, left: 67, top: 48 },
  { label: 'R8', score: 0.41, suspicious: false, left: 85, top: 58 },
  { label: 'R9', score: 0.33, suspicious: false, left: 34, top: 78 },
  { label: 'R10', score: 0.21, suspicious: false, left: 64, top: 80 },
];

const CH_W = 720;
const CH_H = 310;
const PL = 86;
const PR = 676;
const PT = 22;
const PB = 246;
const Y_MIN = 50;
const Y_MAX = 62;
const Y_TICKS: number[] = [50, 53, 56, 59, 62];

const xAt = (i: number) => PL + ((PR - PL) * i) / (K_OPTIONS.length - 1);
const yAt = (value: number) => PB - ((value - Y_MIN) / (Y_MAX - Y_MIN)) * (PB - PT);

function feedbackFor(k: number): { text: string; tone: string } {
  if (k === 1) {
    return { text: '只留 1 个区域：58.77，漏掉并列可疑处的风险最高', tone: C.red };
  }
  if (k === 3) {
    return { text: 'K=3 还没到最优：59.03 / 52.71，仍有可疑处被漏掉', tone: C.blue };
  }
  if (k === 5) {
    return { text: 'K=5 是论文采用的预算：60.81 / 54.92，均为该配置最高', tone: C.green };
  }
  return { text: '再多也给不出提升，反而下降：58.84', tone: C.orange };
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
  // 组织切片（局部坐标：以 inner 左上为原点）
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

export function BudgetTopK(_props: WidgetProps) {
  const [k, setK] = useState<number>(5);

  const highlight = K_OPTIONS.indexOf(k);
  const feedback = feedbackFor(k);

  const selectRank = (rank: number) => {
    const next = K_OPTIONS.find((option) => option >= rank);
    setK(next === undefined ? K_OPTIONS[K_OPTIONS.length - 1] : next);
  };

  const bcnbPoints = K_OPTIONS.map((_, i) => `${xAt(i)},${yAt(BCNB[i])}`).join(' ');
  const wsiPoints = K_OPTIONS.map((_, i) => `${xAt(i)},${yAt(WSI[i])}`).join(' ');

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', gap: 32, color: C.ink }}>
      <section style={{ width: 720, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
        <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.25 }}>玻片上的 10 个候选视野框（按可疑程度排序）</div>
        <div style={{ position: 'relative', width: 720, height: 430 }}>
          <svg viewBox="0 0 720 430" width={720} height={430} style={{ display: 'block' }} role="img" aria-label="一张全切片玻片，上面标出十个候选视野框，四个带感叹号的是可疑视野">
            <rect x="0" y="0" width="720" height="430" fill={C.bg} />
            <SlideArt x={0} y={20} w={720} h={390} />
          </svg>
          {CANDIDATES.map((candidate, i) => {
            const rank = i + 1;
            const kept = rank <= k;
            const tone = candidate.suspicious ? C.red : C.blue;
            return (
              <button
                key={candidate.label}
                type="button"
                onClick={() => selectRank(rank)}
                aria-label={`${candidate.label}，异常分数 ${candidate.score.toFixed(2)}，${candidate.suspicious ? '可疑' : '普通'}，当前${kept ? '保留' : '丢弃'}，点击后保留数至少覆盖到这里`}
                style={{
                  position: 'absolute',
                  left: `${candidate.left}%`,
                  top: `${candidate.top}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 78,
                  height: 56,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0,
                  padding: 0,
                  boxSizing: 'border-box',
                  background: kept ? '#fffdf4' : 'rgba(255,253,244,0.45)',
                  border: `2px ${kept ? 'solid' : 'dashed'} ${tone}`,
                  borderRadius: 4,
                  opacity: kept ? 1 : 0.42,
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 17, fontWeight: 700, lineHeight: '20px' }}>
                  {candidate.label}
                  {candidate.suspicious ? '！' : ''}
                </span>
                <span style={{ fontSize: 15, lineHeight: '18px', color: C.inkSoft }}>{candidate.score.toFixed(2)}</span>
                <span style={{ fontSize: 14, lineHeight: '16px', fontWeight: 700, color: kept ? tone : C.muted }}>
                  {kept ? '保留' : '丢弃'}
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 18, color: C.inkSoft }}>
            红框＝可疑（带！）　蓝框＝普通　实线＝保留　虚线＝丢弃
          </span>
          <span style={{ fontSize: 17, color: C.muted }}>示意图：左侧候选框为演示用，异常分数不代表真实模型输出</span>
        </div>
      </section>

      <section style={{ width: 720, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 9 }}>
        <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.25 }}>K 消融：保留几个候选区域</div>
        <div style={{ fontSize: 18, color: C.muted }}>准确率（%），越高越好；纵轴 50–62，不从 0 起</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: 18, color: C.inkSoft, minHeight: 24 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <span style={{ display: 'block', width: 11, height: 11, borderRadius: '50%', background: C.green }} />
              SlideBench-VQA (BCNB)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <span style={{ display: 'block', width: 11, height: 11, background: C.blue }} />
              WSI-VQA
            </span>
          </span>
        </div>
        <div style={{ position: 'relative', width: CH_W, height: CH_H }}>
          <svg
            viewBox={`0 0 ${CH_W} ${CH_H}`}
            width={CH_W}
            height={CH_H}
            style={{ display: 'block' }}
            role="img"
            aria-label={`K 消融折线图，当前保留数为 ${k}：SlideBench-VQA (BCNB) ${BCNB[highlight].toFixed(2)}%，WSI-VQA ${WSI[highlight].toFixed(2)}%`}
          >
            <rect x="0" y="0" width={CH_W} height={CH_H} fill="none" />
            {Y_TICKS.map((tick) => (
              <line key={`grid${tick}`} x1={PL} y1={yAt(tick)} x2={PR} y2={yAt(tick)} stroke={C.border} strokeWidth="1" strokeDasharray="4 6" />
            ))}
            <line x1={PL} y1={PT} x2={PL} y2={PB} stroke={C.inkSoft} strokeWidth="1.5" />
            <line x1={PL} y1={PB} x2={PR} y2={PB} stroke={C.inkSoft} strokeWidth="1.5" />
            <line x1={xAt(highlight)} y1={PT} x2={xAt(highlight)} y2={PB} stroke={C.orange} strokeWidth="2" strokeDasharray="6 6" opacity="0.8" />
            <polyline points={bcnbPoints} fill="none" stroke={C.green} strokeWidth="3" />
            <polyline points={wsiPoints} fill="none" stroke={C.blue} strokeWidth="3" strokeDasharray="9 5" />
            {BCNB.map((value, i) => (
              <circle
                key={`b${i}`}
                cx={xAt(i)}
                cy={yAt(value)}
                r={i === highlight ? 7 : 4.5}
                fill={i === highlight ? C.orange : C.green}
                stroke="#ffffff"
                strokeWidth={i === highlight ? 3 : 1.5}
              />
            ))}
            {WSI.map((value, i) => (
              <rect
                key={`w${i}`}
                x={xAt(i) - (i === highlight ? 6.5 : 4.5)}
                y={yAt(value) - (i === highlight ? 6.5 : 4.5)}
                width={i === highlight ? 13 : 9}
                height={i === highlight ? 13 : 9}
                fill={i === highlight ? C.orange : C.blue}
                stroke="#ffffff"
                strokeWidth={i === highlight ? 2.5 : 1.5}
              />
            ))}
          </svg>
          {Y_TICKS.map((tick) => (
            <span
              key={`tick${tick}`}
              style={{ position: 'absolute', left: 0, top: yAt(tick), transform: 'translateY(-50%)', width: PL - 12, textAlign: 'right', fontSize: 18, color: C.muted }}
            >
              {tick}
            </span>
          ))}
          {K_OPTIONS.map((option, i) => (
            <span
              key={`opt${option}`}
              style={{
                position: 'absolute',
                left: xAt(i),
                top: PB + 20,
                transform: 'translate(-50%, -50%)',
                fontSize: 18,
                whiteSpace: 'nowrap',
                color: i === highlight ? C.orange : C.muted,
                fontWeight: i === highlight ? 700 : 400,
              }}
            >
              {`K=${option}`}
            </span>
          ))}
          <span
            style={{ position: 'absolute', left: xAt(highlight), top: yAt(BCNB[highlight]) + 20, transform: 'translate(-50%, -50%)', fontSize: 18, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap' }}
          >
            {BCNB[highlight].toFixed(2)}
          </span>
          <span
            style={{ position: 'absolute', left: xAt(highlight), top: yAt(WSI[highlight]) - 20, transform: 'translate(-50%, -50%)', fontSize: 18, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap' }}
          >
            {WSI[highlight].toFixed(2)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18, color: C.muted }}>保留数</span>
          {K_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setK(option)}
              aria-pressed={option === k}
              style={{
                minWidth: 62,
                fontSize: 24,
                fontWeight: 700,
                padding: '6px 0',
                borderRadius: 5,
                cursor: 'pointer',
                color: option === k ? '#ffffff' : C.ink,
                background: option === k ? C.orange : 'transparent',
                border: `2px solid ${option === k ? C.orange : C.border}`,
              }}
            >
              {option}
            </button>
          ))}
        </div>

        <div
          style={{
            minHeight: 88,
            display: 'flex',
            alignItems: 'center',
            padding: '8px 14px',
            boxSizing: 'border-box',
            background: '#ffffff',
            border: `2px solid ${feedback.tone}`,
            borderRadius: 6,
          }}
        >
          <span style={{ fontSize: 28, lineHeight: 1.3, fontWeight: 600, color: feedback.tone }}>{feedback.text}</span>
        </div>

        <div style={{ fontSize: 17, color: C.muted }}>左侧候选框与分数为演示；右侧曲线为论文实测值</div>
      </section>
    </div>
  );
}
