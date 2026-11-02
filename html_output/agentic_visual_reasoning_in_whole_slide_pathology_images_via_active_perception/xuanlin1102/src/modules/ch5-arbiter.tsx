import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';

type Mode = 'vote' | 'arbitrate';

interface ChainDef {
  mag: string;
  scale: string;
  answer: string;
  zoom: number;
  evidence: string[];
}

const C = {
  silk: '#f2e7cd',
  silkDeep: '#e0cda6',
  silkEdge: '#c9b184',
  wood: '#8a5a33',
  woodDark: '#6f4526',
  ink: '#21324a',
  inkSoft: '#5b6b84',
  brass: '#b98a4b',
  green: '#228d5c',
  greenSoft: 'rgba(34,141,92,0.13)',
  red: '#c43f52',
  redSoft: 'rgba(196,63,82,0.12)',
  blue: '#27446e',
  blueSoft: '#eef3fb',
  orange: '#f07e47',
  orangeSoft: 'rgba(240,126,71,0.16)',
  purple: '#7c3aed',
  purpleSoft: '#f5f3ff',
  sceneBg: '#f5f8f0',
} as const;

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
  { x: number; y: number; w: number; h: number; zoom?: number; fx?: number; fy?: number }): React.ReactElement {
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
        <pattern id={`sl-tissue-${uid}`} width={inner.w} height={inner.h} patternUnits="userSpaceOnUse"
          patternTransform={`translate(${inner.x} ${inner.y}) translate(${fx * inner.w} ${fy * inner.h}) scale(${zoom}) translate(${-fx * inner.w} ${-fy * inner.h})`}>
          {tissue}
        </pattern>
      </defs>
      <rect x={x} y={y} width={w} height={h} rx={5} fill={SL.glass} stroke={SL.glassEdge} strokeWidth={1.5} />
      <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} rx={4} fill="none" stroke="#ffffff" strokeWidth={1.2} opacity={0.8} />
      <g clipPath={`url(#sl-clip-${uid})`}>
        <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} fill={`url(#sl-tissue-${uid})`} />
      </g>
      <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} fill="none" stroke={SL.glassEdge} strokeWidth={1} />
      <rect x={x + w - labelW} y={y + pad} width={labelW - pad} height={h - pad * 2} rx={3} fill={SL.label} stroke={SL.glassEdge} strokeWidth={0.8} />
      <line x1={x + w - labelW + 4} y1={y + pad + (h - pad * 2) * 0.32} x2={x + w - pad - 3} y2={y + pad + (h - pad * 2) * 0.32} stroke={SL.labelLine} strokeWidth={1.4} />
      <line x1={x + w - labelW + 4} y1={y + pad + (h - pad * 2) * 0.5} x2={x + w - pad - 3} y2={y + pad + (h - pad * 2) * 0.5} stroke={SL.labelLine} strokeWidth={1.1} />
    </g>
  );
}

const CHAINS: ChainDef[] = [
  {
    mag: '2.5×',
    scale: '组织结构',
    answer: '良性增生',
    zoom: 1,
    evidence: ['整体结构规则、细胞形态温和', '上皮层排列未见明显紊乱'],
  },
  {
    mag: '10×',
    scale: '细胞形态',
    answer: '浸润性癌',
    zoom: 2.2,
    evidence: ['间质内见新生细胞巢', '细胞核异型、核浆比升高'],
  },
];

function Seal({
  text,
  size,
  ink,
  tint,
  font,
}: {
  text: string;
  size: number;
  ink: string;
  tint: string;
  font: number;
}): React.ReactElement {
  return (
    <div
      role="img"
      aria-label={`报告结论章：${text}`}
      style={{
        width: size,
        height: size,
        flex: `0 0 ${size}px`,
        boxSizing: 'border-box',
        border: `${Math.round(size / 18)}px solid ${ink}`,
        borderRadius: Math.round(size / 10),
        background: tint,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span style={{ fontSize: font, lineHeight: 1.4, fontWeight: 800, color: ink, letterSpacing: 1 }}>{text}</span>
    </div>
  );
}

function SlideStrip({ zoom }: { zoom: number }): React.ReactElement {
  return (
    <svg width={296} height={84} viewBox="0 0 296 84" role="img" aria-label="倍率下的玻片视野">
      <SlideArt x={0} y={0} w={296} h={84} zoom={zoom} />
    </svg>
  );
}

export function Arbiter(_props: WidgetProps): React.ReactElement {
  const [mode, setMode] = useState<Mode | null>(null);

  const decide = (next: Mode): void => {
    setMode(next);
  };

  const voted = mode === 'vote';
  const arbitrated = mode === 'arbitrate';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        gap: 16,
        boxSizing: 'border-box',
        background: C.sceneBg,
        color: C.ink,
        fontFamily: '"Segoe UI", "PingFang SC", "Hiragino Sans GB", Arial, sans-serif',
        overflow: 'hidden',
      }}
    >
      <style>{`
        .p3b-btn { font: inherit; color: inherit; background: none; border: none; padding: 0; margin: 0; text-align: left; cursor: pointer; }
        .p3b-btn:focus-visible { outline: 3px solid ${C.blue}; outline-offset: 3px; }
        .p3b-choice:hover { outline: 2px dashed ${C.orange}; outline-offset: 2px; }
        .p3b-card { transition: background .25s ease, border-color .25s ease; }
      `}</style>

      <section
        style={{
          flex: '0 0 700px',
          minWidth: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '2px 2px',
          boxSizing: 'border-box',
        }}
      >
        <header style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 10, minHeight: 46 }}>
          <h3 style={{ margin: 0, fontSize: 34, lineHeight: 1.3, fontWeight: 700 }}>两个倍率，两个判断</h3>
          <span style={{ fontSize: 21, lineHeight: 1.4, color: C.inkSoft, whiteSpace: 'nowrap' }}>
            同一处视野、同一个问题
          </span>
        </header>

        {CHAINS.map((chain) => (
          <article
            key={chain.mag}
            className="p3b-card"
            style={{
              flex: '1 1 auto',
              minHeight: 230,
              boxSizing: 'border-box',
              padding: '8px 12px',
              background: '#ffffff',
              border: `1.5px solid ${C.silkEdge}`,
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  flex: '0 0 76px',
                  height: 40,
                  borderRadius: 999,
                  background: C.orangeSoft,
                  border: `2px solid ${C.orange}`,
                  color: '#a34b1c',
                  fontSize: 22,
                  lineHeight: 1.4,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {chain.mag}
              </span>
              <span style={{ fontSize: 26, lineHeight: 1.4, color: C.inkSoft, whiteSpace: 'nowrap' }}>
                {chain.scale}
              </span>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 21, lineHeight: 1.4, color: C.inkSoft, whiteSpace: 'nowrap' }}>
                独立判断
              </span>
              <span
                style={{
                  padding: '0 14px',
                  borderRadius: 8,
                  background: C.purpleSoft,
                  border: `2px solid ${C.purple}`,
                  color: C.purple,
                  fontSize: 26,
                  lineHeight: 1.4,
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                }}
              >
                {chain.answer}
              </span>
            </div>

            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column' }}>
              {chain.evidence.map((line) => (
                <li key={line} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 26, lineHeight: 1.4 }}>
                  <span style={{ width: 8, height: 8, background: C.blue, borderRadius: 2, flex: '0 0 8px' }} />
                  <span style={{ color: C.ink }}>{line}</span>
                </li>
              ))}
            </ul>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <SlideStrip zoom={chain.zoom} />
              <Seal text={chain.answer.slice(0, 2)} size={60} ink={C.purple} tint={C.purpleSoft} font={24} />
              <span style={{ fontSize: 21, lineHeight: 1.4, color: C.inkSoft, whiteSpace: 'nowrap' }}>
                {chain.mag} 已下判断，可追溯
              </span>
            </div>
          </article>
        ))}

        <div
          style={{
            flex: '0 0 auto',
            boxSizing: 'border-box',
            padding: '6px 12px',
            background: '#ffffff',
            border: `1px solid ${C.silkEdge}`,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 22,
            lineHeight: 1.4,
            color: C.ink,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontWeight: 700 }}>
            (<SymbolHint meaning="最终答案">ŷ</SymbolHint>, <SymbolHint meaning="最终理由">r̂</SymbolHint>) = F<sub>A</sub>(q,{' '}
            {'{(m, '}
            <SymbolHint meaning="选项级支持与冲突记录">A<sub>m</sub></SymbolHint>{', '}
            <SymbolHint meaning="证据充分性">U<sub>m</sub></SymbolHint>{'}'}
            <sub>m∈M</sub>)
          </span>
          <span style={{ color: C.inkSoft, fontSize: 21 }}>式 13：证据级裁决 · 投票对照为演示</span>
        </div>
      </section>

      <section
        style={{
          flex: '1 1 auto',
          minWidth: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '2px 2px',
          boxSizing: 'border-box',
        }}
      >
        <header style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 10, minHeight: 46 }}>
          <h3 style={{ margin: 0, fontSize: 34, lineHeight: 1.3, fontWeight: 700 }}>怎么合并这两个判断？</h3>
        </header>

        <div style={{ display: 'flex', gap: 10, flex: '0 0 auto' }}>
          <button
            type="button"
            className="p3b-btn p3b-choice"
            aria-pressed={voted}
            onClick={() => decide('vote')}
            style={{
              flex: '1 1 0',
              boxSizing: 'border-box',
              minHeight: 86,
              padding: '4px 14px',
              background: voted ? C.redSoft : '#ffffff',
              border: `2px solid ${voted ? C.red : C.silkEdge}`,
              borderRadius: 12,
              boxShadow: voted ? `0 0 0 4px rgba(196,63,82,0.12)` : '0 2px 6px rgba(33,50,74,0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <span style={{ fontSize: 28, lineHeight: 1.4, fontWeight: 700, color: voted ? C.red : C.ink }}>
              按倍率投票
            </span>
            <span style={{ fontSize: 21, lineHeight: 1.4, color: C.inkSoft }}>两个判断各一票</span>
          </button>
          <button
            type="button"
            className="p3b-btn p3b-choice"
            aria-pressed={arbitrated}
            onClick={() => decide('arbitrate')}
            style={{
              flex: '1 1 0',
              boxSizing: 'border-box',
              minHeight: 86,
              padding: '4px 14px',
              background: arbitrated ? C.greenSoft : '#ffffff',
              border: `2px solid ${arbitrated ? C.green : C.silkEdge}`,
              borderRadius: 12,
              boxShadow: arbitrated ? `0 0 0 4px rgba(34,141,92,0.14)` : '0 2px 6px rgba(33,50,74,0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <span style={{ fontSize: 28, lineHeight: 1.4, fontWeight: 700, color: arbitrated ? C.green : C.ink }}>
              按证据裁决
            </span>
            <span style={{ fontSize: 21, lineHeight: 1.4, color: C.inkSoft }}>逐选项比较支持与冲突</span>
          </button>
        </div>

        <div
          className="p3b-card"
          aria-live="polite"
          style={{
            flex: '1 1 auto',
            minHeight: 190,
            boxSizing: 'border-box',
            padding: '8px 14px',
            background: voted ? C.redSoft : arbitrated ? C.greenSoft : '#ffffff',
            border: `2px dashed ${voted ? C.red : arbitrated ? C.green : C.silkEdge}`,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          {mode === null ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 34, lineHeight: 1.3, fontWeight: 700, color: C.inkSoft }}>还没有选择合并方式</span>
              <span style={{ fontSize: 26, lineHeight: 1.4, color: C.inkSoft }}>
                两个倍率给出相反的诊断，先选上面的一个按钮，再看报告结论章会怎么变。
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              <Seal
                text={voted ? '未定' : '浸润'}
                size={96}
                ink={voted ? C.red : C.green}
                tint={voted ? C.redSoft : C.greenSoft}
                font={30}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <span style={{ fontSize: 44, lineHeight: 1.3, fontWeight: 800, color: voted ? C.red : C.green }}>
                  {voted ? '1 : 1，无法定论' : '最终结论：浸润性癌'}
                </span>
                <span style={{ fontSize: 26, lineHeight: 1.4, color: C.ink }}>
                  {voted
                    ? '两个倍率各一票，1:1 无法决定，只能任选——论文明确不用这种做法'
                    : '逐选项看支持与冲突：10× 在间质见到新生细胞巢，冲突证据更直接，最终定为浸润性癌，并保留 2.5× 的独立判断用于追溯'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            flex: '0 0 auto',
            boxSizing: 'border-box',
            padding: '6px 12px',
            background: '#ffffff',
            border: `1.5px solid ${C.silkEdge}`,
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ fontSize: 24, lineHeight: 1.4, fontWeight: 700, color: C.ink }}>追溯：两个倍率各自的独立判断</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <span
              style={{
                flex: '1 1 0',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 10px',
                borderRadius: 8,
                background: C.purpleSoft,
                border: `1.5px solid ${C.purple}`,
              }}
            >
              <span style={{ fontSize: 21, lineHeight: 1.4, color: C.inkSoft }}>2.5×</span>
              <span style={{ fontSize: 24, lineHeight: 1.4, fontWeight: 700, color: C.purple }}>良性增生</span>
            </span>
            <span
              style={{
                flex: '1 1 0',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 10px',
                borderRadius: 8,
                background: C.purpleSoft,
                border: `1.5px solid ${C.purple}`,
              }}
            >
              <span style={{ fontSize: 21, lineHeight: 1.4, color: C.inkSoft }}>10×</span>
              <span style={{ fontSize: 24, lineHeight: 1.4, fontWeight: 700, color: C.purple }}>浸润性癌</span>
            </span>
          </div>
          <div style={{ fontSize: 21, lineHeight: 1.4, color: mode === 'vote' ? C.red : mode === 'arbitrate' ? C.green : C.inkSoft }}>
            {mode === 'vote'
              ? '投票把两个独立判断同时覆盖掉，最终结论回不到任何一条具体证据。'
              : mode === 'arbitrate'
                ? '两个独立判断都留在记录里，最终结论可以回到 10× 那条更直接的冲突证据。'
                : '两个独立判断始终保留：裁决只决定采信哪一条证据，不抹掉各倍率自己的判断。'}
          </div>
        </div>
      </section>
    </div>
  );
}
