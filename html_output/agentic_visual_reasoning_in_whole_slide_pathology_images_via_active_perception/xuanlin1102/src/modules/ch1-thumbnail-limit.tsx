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

type PinTone = 'red' | 'blue' | 'orange';
type Picked = 0 | 1 | 2 | null;

type Pin = {
  id: 0 | 1 | 2;
  tone: PinTone;
  left: number;
  top: number;
  place: string;
};

const PINS: Pin[] = [
  { id: 0, tone: 'red', left: 31, top: 52, place: '切片中央的染色区' },
  { id: 1, tone: 'blue', left: 53, top: 44, place: '大片组织结构' },
  { id: 2, tone: 'orange', left: 73, top: 58, place: '散在的细胞群' },
];

const TONE: Record<PinTone, string> = {
  red: C.red,
  blue: C.blue,
  orange: C.orange,
};

const PIN_NOTE: Record<number, string> = {
  0: '只有大片染色，细胞核糊在一起。',
  1: '组织结构纹理清楚，但没有异常形态。',
  2: '细胞排列规则，看不出结构紊乱。',
};

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

function LoupeDetail({ index }: { index: number }) {
  const fx = index === 1 ? 0.44 : index === 2 ? 0.66 : 0.5;
  const fy = index === 1 ? 0.54 : index === 2 ? 0.42 : 0.5;
  if (index === 0) {
    return (
      <g filter="url(#ch1-blur-loupe)">
        <SlideArt x={0} y={0} w={620} h={300} zoom={1.5} fx={0.5} fy={0.5} />
      </g>
    );
  }
  // 放大后补上的细胞核：第 2 处是散在分布，第 3 处是一小群密集的细胞
  const spread: [number, number][] = [
    [190, 100], [224, 86], [262, 96], [296, 112], [312, 142], [286, 172],
    [252, 190], [214, 186], [184, 162], [168, 130], [206, 132], [240, 140],
    [272, 152], [232, 166], [300, 196], [176, 196], [330, 118], [158, 150],
  ];
  const clustered: [number, number][] = [
    [258, 108], [274, 100], [288, 114], [278, 126], [262, 122], [292, 132], [250, 118],
    [206, 168], [232, 190], [300, 84], [180, 128], [318, 168], [166, 176], [238, 96],
  ];
  const nuclei = index === 2 ? clustered : spread;
  return (
    <g>
      <SlideArt x={0} y={0} w={620} h={300} zoom={2.6} fx={fx} fy={fy} />
      <g fill={SL.nucleus} opacity={0.55}>
        {nuclei.map(([px, py], i) => (
          <circle key={i} cx={px} cy={py} r={index === 2 ? 6 : 5} />
        ))}
      </g>
    </g>
  );
}

export function ThumbnailLimit(_props: WidgetProps) {
  const [picked, setPicked] = useState<Picked>(null);
  const [visited, setVisited] = useState<boolean[]>([false, false, false]);

  const pick = (index: 0 | 1 | 2) => {
    setPicked(index);
    setVisited((seen) => seen.map((was, i) => (i === index ? true : was)));
  };

  const allVisited = visited[0] && visited[1] && visited[2];
  const feedbackTone = allVisited ? C.green : picked === 0 ? C.red : C.blue;
  const feedbackText = picked === null
    ? '先点一处，看看缩略图能给什么证据'
    : allVisited
      ? '缩略图只能提示组织大轮廓，证据要下去看'
      : picked === 0
        ? '缩成一张小图：组织结构糊成一团，只能猜个大概'
        : '这一处看清了，但没有任何诊断依据';

  const loupeTone = picked === null ? C.blue : picked === 0 ? C.red : C.blue;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 24, color: C.ink }}>
      <div style={{ display: 'flex', gap: 32, justifyContent: 'center', height: 470 }}>
        <section style={{ width: 760, height: 470, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 34, fontWeight: 700, lineHeight: 1.2 }}>把整张玻片缩成一张缩略图</h3>
          <div style={{ position: 'relative', width: 760, height: 400 }}>
            <svg
              viewBox="0 0 760 400"
              width={760}
              height={400}
              style={{ display: 'block' }}
              role="img"
              aria-label="一张把整张玻片缩成缩略图的小照片，组织只剩大片染色，看不清细胞"
            >
              <defs>
                <filter id="ch1-blur-small" x="-15%" y="-15%" width="130%" height="130%">
                  <feGaussianBlur stdDeviation="2.6" />
                </filter>
              </defs>
              <rect x="34" y="34" width="692" height="330" rx="8" fill={C.ink} opacity="0.08" />
              <g transform="rotate(-1.4 380 196)">
                <rect x="26" y="26" width="700" height="330" rx="6" fill="#fbf6ea" stroke={SL.glassEdge} strokeWidth="2" />
                <g filter="url(#ch1-blur-small)">
                  <SlideArt x={64} y={78} w={620} h={230} />
                </g>
              </g>
              <text x="380" y="382" textAnchor="middle" fontSize="18" fill={C.muted}>
                整张缩略：只剩大片染色，看不清细胞与结构
              </text>
            </svg>
            {PINS.map((pin) => {
              const color = TONE[pin.tone];
              const active = picked === pin.id;
              return (
                <button
                  key={pin.id}
                  type="button"
                  aria-label={`第 ${pin.id + 1} 处：${pin.place}，按回车把视野移到这里`}
                  aria-pressed={active}
                  onClick={() => pick(pin.id)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      pick(pin.id);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    left: `${pin.left}%`,
                    top: `${pin.top}%`,
                    transform: 'translate(-50%, -100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      width: active ? 30 : 24,
                      height: active ? 30 : 24,
                      borderRadius: '50%',
                      background: color,
                      border: `3px solid ${active ? C.ink : '#fbf6ea'}`,
                      boxShadow: '0 2px 6px rgba(33,50,74,0.35)',
                    }}
                  />
                  <span style={{ display: 'block', width: 2, height: 12, background: color }} />
                  <span
                    style={{
                      display: 'block',
                      marginTop: 2,
                      padding: '0 5px',
                      fontSize: 15,
                      lineHeight: '18px',
                      color: '#fbf6ea',
                      background: color,
                      borderRadius: 3,
                    }}
                  >
                    {pin.id + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section style={{ width: 620, height: 470, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 34, fontWeight: 700, lineHeight: 1.2 }}>显微镜视野里的同一处</h3>
          <svg viewBox="0 0 620 300" width={620} height={300} role="img" aria-label="显微镜视野里的同一处组织：只有把视野移到具体位置，才看清这一处的细胞与结构">
            <defs>
              <clipPath id="ch1-loupe-clip">
                <circle cx="244" cy="146" r="126" />
              </clipPath>
              <filter id="ch1-blur-loupe" x="-25%" y="-25%" width="150%" height="150%">
                <feGaussianBlur stdDeviation="9" />
              </filter>
            </defs>
            <circle cx="244" cy="146" r="126" fill={SL.glass} />
            {picked === null ? (
              <g>
                <text x="244" y="140" textAnchor="middle" fontSize="28" fill={C.blue} fontWeight="700">
                  还没选位置
                </text>
                <text x="244" y="176" textAnchor="middle" fontSize="18" fill={C.muted}>
                  点一枚图钉试试
                </text>
              </g>
            ) : (
              <g clipPath="url(#ch1-loupe-clip)">
                <LoupeDetail index={picked} />
              </g>
            )}
            <circle cx="244" cy="146" r="126" fill="none" stroke={SL.brass} strokeWidth="9" />
            <circle cx="244" cy="146" r="119" fill="none" stroke="#f6efdd" strokeWidth="2" opacity="0.85" />
            <rect x="120" y="266" width="248" height="9" rx="4.5" fill="#4b5b6b" />
            <circle cx={244} cy={146} r="4" fill={SL.brass} opacity="0.8" />
            {picked !== null ? (
              <g>
                <rect x="312" y="238" width="300" height="34" rx="4" fill="#ffffff" stroke={loupeTone} strokeWidth="2" />
                <circle cx="332" cy="255" r="8" fill={TONE[PINS[picked].tone]} />
                <text x="350" y="261" fontSize="18" fill={C.ink}>
                  {`第 ${picked + 1} 处 · ${PINS[picked].place}`}
                </text>
              </g>
            ) : null}
          </svg>
          <div
            style={{
              width: 620,
              minHeight: 92,
              display: 'flex',
              gap: 14,
              alignItems: 'center',
              padding: '10px 16px',
              background: C.paper,
              border: `2px solid ${loupeTone}`,
              borderRadius: 4,
              boxShadow: '0 3px 8px rgba(33,50,74,0.12)',
              transform: 'rotate(-0.5deg)',
              boxSizing: 'border-box',
            }}
          >
            <span style={{ display: 'block', width: 10, height: 46, background: loupeTone, borderRadius: 2 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 17, color: C.muted }}>
                {picked === null ? '形态笔记还是空白' : `记在第 ${picked + 1} 条形态笔记上`}
              </span>
              <span style={{ fontSize: 28, lineHeight: 1.25, color: picked === null ? C.muted : C.ink }}>
                {picked === null ? '先点一处，再看能记下什么' : PIN_NOTE[picked]}
              </span>
            </div>
          </div>
        </section>
      </div>

      <div
        style={{
          height: 96,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '8px 22px',
          background: '#ffffff',
          border: `2px solid ${feedbackTone}`,
          borderRadius: 6,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              border: `2px solid ${feedbackTone}`,
              borderRadius: 3,
              color: feedbackTone,
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            判
          </span>
          <span style={{ fontSize: 28, fontWeight: 600, color: feedbackTone }}>{feedbackText}</span>
        </div>
        <div style={{ textAlign: 'right', fontSize: 17, color: C.muted }}>
          Qwen3-VL 缩略图输入 30.70% · AdaptivePath 60.81%（SlideBench-VQA (BCNB) 总体准确率，越高越好）
        </div>
      </div>
    </div>
  );
}
