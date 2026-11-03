import React, { useState } from 'react';
import { Figure } from '../components/Figure';
import type { WidgetProps } from './registry';

type Mode = 'source' | 'magnification';

interface RowDef {
  label: string;
  hint: string;
  value: number;
  color: string;
  strong: boolean;
}

const C = {
  silk: '#f2e7cd',
  silkDeep: '#e0cda6',
  silkEdge: '#c9b184',
  wood: '#8a5a33',
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
  orangeSoft: 'rgba(240,126,71,0.14)',
  purple: '#7c3aed',
  purpleSoft: '#f5f3ff',
  sceneBg: '#f5f8f0',
} as const;

const SOURCE_ROWS: RowDef[] = [
  { label: '病理医生轨迹', hint: '医生自己看的区域', value: 89.7, color: C.purple, strong: false },
  { label: 'AdaptivePath', hint: '论文方法的观察序列', value: 82.9, color: C.green, strong: true },
  { label: 'PathAgent', hint: '旧方法的序列', value: 50.9, color: C.red, strong: false },
  { label: '随机采样', hint: '单向随机挑区域', value: 34.3, color: 'rgba(196,63,82,0.45)', strong: false },
];

const MAG_ROWS: RowDef[] = [
  { label: '完整多倍率', hint: '2.5× + 5× + 10×', value: 82.9, color: C.green, strong: true },
  { label: '只有 2.5×', hint: '只看组织结构', value: 69.7, color: C.red, strong: false },
  { label: '只有 5×', hint: '只看中等倍率', value: 62.9, color: C.red, strong: false },
  { label: '只有 10×', hint: '只看细胞形态', value: 62.3, color: C.red, strong: false },
];

const AXIS: number[] = [0, 20, 40, 60, 80, 100];

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

function ThemeMini(): React.ReactElement {
  return (
    <svg width={104} height={40} viewBox="0 0 104 40" role="img" aria-label="玻片与显微镜">
      <SlideArt x={0} y={0} w={76} h={40} />
      <ScopeArt x={92} y={23} s={0.36} />
    </svg>
  );
}

export function ReaderFigure(_props: WidgetProps): React.ReactElement {
  const [mode, setMode] = useState<Mode>('source');
  const rows = mode === 'source' ? SOURCE_ROWS : MAG_ROWS;

  const feedback =
    mode === 'source'
      ? 'AdaptivePath 序列 82.9%，最接近病理医生自己轨迹的 89.7%；单向随机采样只有 34.3%'
      : '完整多倍率高于任何单倍率';

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
        .p3d-btn { font: inherit; color: inherit; background: none; border: none; padding: 0; margin: 0; text-align: left; cursor: pointer; }
        .p3d-btn:focus-visible { outline: 3px solid ${C.blue}; outline-offset: 3px; }
        .p3d-fig { display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .p3d-fig .paper-figure { margin: 0; }
        .p3d-fig .paper-figure img { max-height: 268px; max-width: 100%; width: auto; height: auto; }
        .p3d-fig .paper-figure figcaption { margin-top: 2px; font-size: 21px; line-height: 1.4; color: ${C.inkSoft}; }
        .p3d-toggle:hover { outline: 2px dashed ${C.orange}; outline-offset: 3px; }
        .p3d-track > div { transition: width .6s cubic-bezier(.16,1,.3,1); }
      `}</style>

      <section
        style={{
          flex: '0 0 640px',
          minWidth: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '2px 2px',
          boxSizing: 'border-box',
        }}
      >
        <header style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 10, minHeight: 44 }}>
          <h3 style={{ margin: 0, fontSize: 32, lineHeight: 1.3, fontWeight: 700, whiteSpace: 'nowrap' }}>
            图 5：轨迹与医生检查区域
          </h3>
          <span style={{ flex: 1 }} />
          <ThemeMini />
        </header>

        <div
          className="p3d-fig"
          style={{
            flex: '1 1 0',
            minHeight: 0,
            padding: '6px 8px',
            background: '#ffffff',
            border: `1.5px solid ${C.silkEdge}`,
            borderRadius: 12,
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          <Figure
            src="./images/fig5-trajectory.png"
            alt="病理切片上自适应观察轨迹与病理医生检查区域的对照示意"
            caption="绿框：与病理医生检查区域重叠；红框：未重叠（同一 ROI 预算下的定性示例）"
          />
        </div>

        <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{ width: 18, height: 18, border: `3px solid ${C.green}`, borderRadius: 3, flex: '0 0 18px' }}
              />
              <span style={{ fontSize: 19, lineHeight: 1.4, color: C.ink, whiteSpace: 'nowrap' }}>重叠</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{ width: 18, height: 18, border: `3px solid ${C.red}`, borderRadius: 3, flex: '0 0 18px' }}
              />
              <span style={{ fontSize: 19, lineHeight: 1.4, color: C.ink, whiteSpace: 'nowrap' }}>未重叠</span>
            </span>
            <span style={{ fontSize: 19, lineHeight: 1.4, color: C.inkSoft }}>
              该示例中自适应轨迹选中的区域都与医生检查区重叠。
            </span>
          </div>
          <div style={{ fontSize: 19, lineHeight: 1.4, color: C.inkSoft }}>
            同一 ROI 预算指各方能看的区域数量相同。
          </div>
        </div>

        <div
          style={{
            flex: '0 0 auto',
            boxSizing: 'border-box',
            padding: '4px 12px',
            background: C.blueSoft,
            border: `1.5px solid ${C.blue}`,
            borderRadius: 10,
            fontSize: 19,
            lineHeight: 1.4,
            color: C.blue,
          }}
        >
          图 5 是定性示例；定量的对齐率在补充材料里，本页不据此给百分比。
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
        <header style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 10, minHeight: 44 }}>
          <h3 style={{ margin: 0, fontSize: 34, lineHeight: 1.3, fontWeight: 700 }}>病理医生盲测的平均准确率</h3>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 19, lineHeight: 1.4, color: C.inkSoft, whiteSpace: 'nowrap' }}>
            纵轴方向：0–100%，越长越好
          </span>
        </header>

        <div style={{ display: 'flex', gap: 10, flex: '0 0 auto' }}>
          <button
            type="button"
            className="p3d-btn p3d-toggle"
            aria-pressed={mode === 'source'}
            onClick={() => setMode('source')}
            style={{
              flex: '1 1 0',
              boxSizing: 'border-box',
              minHeight: 50,
              padding: '4px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: mode === 'source' ? C.blueSoft : '#ffffff',
              border: `2px solid ${mode === 'source' ? C.blue : C.silkEdge}`,
              borderRadius: 10,
              fontSize: 24,
              lineHeight: 1.4,
              fontWeight: mode === 'source' ? 700 : 500,
              color: mode === 'source' ? C.blue : C.ink,
            }}
          >
            按序列来源
            <span style={{ fontSize: 19, lineHeight: 1.4, color: C.inkSoft, fontWeight: 400, whiteSpace: 'nowrap' }}>
              谁决定看哪里
            </span>
          </button>
          <button
            type="button"
            className="p3d-btn p3d-toggle"
            aria-pressed={mode === 'magnification'}
            onClick={() => setMode('magnification')}
            style={{
              flex: '1 1 0',
              boxSizing: 'border-box',
              minHeight: 50,
              padding: '4px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: mode === 'magnification' ? C.blueSoft : '#ffffff',
              border: `2px solid ${mode === 'magnification' ? C.blue : C.silkEdge}`,
              borderRadius: 10,
              fontSize: 24,
              lineHeight: 1.4,
              fontWeight: mode === 'magnification' ? 700 : 500,
              color: mode === 'magnification' ? C.blue : C.ink,
            }}
          >
            按倍率条件
            <span style={{ fontSize: 19, lineHeight: 1.4, color: C.inkSoft, fontWeight: 400, whiteSpace: 'nowrap' }}>
              看几个尺度
            </span>
          </button>
        </div>

        <div
          style={{
            flex: '1 1 0',
            minHeight: 0,
            boxSizing: 'border-box',
            padding: '4px 12px',
            background: '#ffffff',
            border: `1.5px solid ${C.silkEdge}`,
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <div
            style={{
              flex: '1 1 0',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
            }}
          >
            {rows.map((row) => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: '0 0 186px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <span
                    style={{
                      fontSize: 24,
                      lineHeight: 1.4,
                      fontWeight: row.strong ? 800 : 600,
                      color: row.strong ? C.green : C.ink,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row.label}
                  </span>
                  <span style={{ fontSize: 18, lineHeight: 1.4, color: C.inkSoft, whiteSpace: 'nowrap' }}>
                    {row.hint}
                  </span>
                </div>
                <div
                  className="p3d-track"
                  style={{ flex: '1 1 0', minWidth: 0, height: 26, background: 'rgba(201,177,132,0.35)', borderRadius: 999 }}
                >
                  <div
                    style={{
                      width: `${row.value}%`,
                      height: '100%',
                      background: row.color,
                      borderRadius: 999,
                      boxShadow: row.strong ? '0 0 0 2px rgba(34,141,92,0.22)' : 'none',
                    }}
                  />
                </div>
                <span
                  style={{
                    flex: '0 0 74px',
                    textAlign: 'right',
                    fontSize: 24,
                    lineHeight: 1.4,
                    fontWeight: 800,
                    color: row.strong ? C.green : C.ink,
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.value.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', marginLeft: 196, marginRight: 84, minHeight: 24 }}>
            <div style={{ flex: '1 1 0', display: 'flex', justifyContent: 'space-between' }}>
              {AXIS.map((tick) => (
                <span
                  key={tick}
                  style={{ fontSize: 17, lineHeight: 1.4, color: C.inkSoft, fontVariantNumeric: 'tabular-nums' }}
                >
                  {tick}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div
          aria-live="polite"
          style={{
            flex: '0 0 auto',
            minHeight: 110,
            boxSizing: 'border-box',
            padding: '4px 14px',
            background: mode === 'source' ? C.greenSoft : '#ffffff',
            border: `1.5px solid ${mode === 'source' ? C.green : C.silkEdge}`,
            borderRadius: 10,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <div style={{ fontSize: 24, lineHeight: 1.4, fontWeight: 600, color: mode === 'source' ? C.green : C.ink }}>
            {feedback}
          </div>
          <div style={{ fontSize: 19, lineHeight: 1.4, color: C.inkSoft }}>
            {mode === 'source'
              ? '与医生轨迹相差 6.8 个百分点（89.7 − 82.9）。'
              : '四个条件同一批题目、同一 ROI 预算，只改倍率组合。'}
          </div>
        </div>

        <div
          style={{
            flex: '0 0 auto',
            boxSizing: 'border-box',
            padding: '4px 12px',
            background: C.orangeSoft,
            border: `1.5px solid ${C.orange}`,
            borderRadius: 10,
            fontSize: 19,
            lineHeight: 1.4,
            color: '#8a3f16',
            fontWeight: 600,
          }}
        >
          读者研究：盲测、BCNB 子集、同一 ROI 预算、平均准确率；不含置信区间，不能当作通用诊断性能。
        </div>
      </section>
    </div>
  );
}
