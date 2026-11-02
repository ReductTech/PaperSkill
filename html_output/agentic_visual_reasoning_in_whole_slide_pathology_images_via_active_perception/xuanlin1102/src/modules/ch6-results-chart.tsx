import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

type GroupKey = 'general' | 'medical' | 'block' | 'agent';
type BarGroup = GroupKey | 'ours';

interface BarDef {
  key: string;
  name: string;
  sub: string;
  value: number;
  group: BarGroup;
}

interface DatasetDef {
  key: string;
  short: string;
  label: string;
  caption: string;
  bars: BarDef[];
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
  blue: '#27446e',
  blueSoft: '#eef3fb',
  orange: '#f07e47',
  orangeSoft: 'rgba(240,126,71,0.14)',
  purple: '#7c3aed',
  sceneBg: '#f5f8f0',
} as const;

const GROUP_META: Record<GroupKey, { label: string; color: string }> = {
  general: { label: '通用 VLM', color: '#9aa7ba' },
  medical: { label: '医学 VLM', color: '#4f7fb5' },
  block: { label: '块聚合', color: '#a08d6f' },
  agent: { label: '智能体系统', color: '#5b6b84' },
};

const DATASETS: DatasetDef[] = [
  {
    key: 'bcbn',
    short: 'BCNB',
    label: 'SlideBench-VQA（BCNB）',
    caption: '零样本问答 · 准确率（%）',
    bars: [
      { key: 'ours', name: 'AdaptivePath', sub: '论文方法', value: 60.81, group: 'ours' },
      { key: 'nav', name: 'PathNavigate', sub: '', value: 59.42, group: 'agent' },
      { key: 'pathagent', name: 'PathAgent', sub: '', value: 55.72, group: 'agent' },
      { key: 'slidechat', name: 'SlideChat', sub: '', value: 54.14, group: 'medical' },
      { key: 'giant', name: 'GIANT', sub: '', value: 44.97, group: 'block' },
      { key: 'qwen', name: 'Qwen3-VL', sub: 'Patch 输入', value: 38.22, group: 'general' },
      { key: 'llavamed', name: 'LLaVA-Med', sub: 'Patch 输入', value: 30.10, group: 'medical' },
    ],
  },
  {
    key: 'wsivqa',
    short: 'WSI-VQA',
    label: 'WSI-VQA',
    caption: '零样本问答 · 准确率（%）',
    bars: [
      { key: 'ours', name: 'AdaptivePath', sub: '论文方法', value: 54.92, group: 'ours' },
      { key: 'nav', name: 'PathNavigate', sub: '', value: 52.21, group: 'agent' },
      { key: 'pathagent', name: 'PathAgent', sub: '', value: 51.54, group: 'agent' },
      { key: 'wsivqa', name: 'WSI-VQA', sub: '多尺度块', value: 46.90, group: 'block' },
      { key: 'meddr', name: 'MedDr', sub: '缩略图', value: 43.69, group: 'medical' },
      { key: 'qwen', name: 'Qwen3-VL', sub: 'Patch 输入', value: 23.47, group: 'general' },
    ],
  },
  {
    key: 'pathvqa',
    short: 'PathVQA',
    label: 'PathVQA（是/否子集）',
    caption: '零样本问答（是/否子集）· 准确率（%）',
    bars: [
      { key: 'ours', name: 'AdaptivePath', sub: '论文方法', value: 60.73, group: 'ours' },
      { key: 'nav', name: 'PathNavigate', sub: '', value: 58.94, group: 'agent' },
      { key: 'pathagent', name: 'PathAgent', sub: '', value: 58.36, group: 'agent' },
      { key: 'slidechat', name: 'SlideChat', sub: '', value: 55.03, group: 'medical' },
      { key: 'gpt', name: 'GPT-5.5', sub: 'Patch 输入', value: 47.14, group: 'general' },
    ],
  },
  {
    key: 'cohort',
    short: '六队列总体',
    label: '癌型分类（六队列总体）',
    caption: '癌型分类 · 700 张切片 · 准确率（%）',
    bars: [
      { key: 'ours', name: 'AdaptivePath', sub: '论文方法', value: 80.14, group: 'ours' },
      { key: 'slidechat', name: 'SlideChat', sub: '', value: 65.29, group: 'medical' },
      { key: 'wsillava', name: 'WSI-LLaVA', sub: '', value: 62.57, group: 'medical' },
      { key: 'nav', name: 'PathNavigate', sub: '', value: 62.29, group: 'agent' },
      { key: 'pathagent', name: 'PathAgent', sub: '', value: 62.00, group: 'agent' },
    ],
  },
];

const TICKS: number[] = [0, 20, 40, 60, 80, 100];
const BAR_SCALE = 3.9;
const PLOT_BOTTOM = 78;
const PLOT_HEIGHT = 390;

function barColor(group: BarGroup): string {
  if (group === 'ours') return C.green;
  return GROUP_META[group].color;
}

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
    <svg width={132} height={56} viewBox="0 0 132 56" role="img" aria-label="玻片与显微镜">
      <SlideArt x={0} y={4} w={96} h={48} />
      <ScopeArt x={112} y={30} s={0.55} />
    </svg>
  );
}

export function ResultsChart(_props: WidgetProps): React.ReactElement {
  const [datasetKey, setDatasetKey] = useState<string>('bcbn');
  const [enabled, setEnabled] = useState<GroupKey[]>(['general', 'medical', 'block', 'agent']);
  const [focused, setFocused] = useState<string>('');

  const dataset = DATASETS.filter((d) => d.key === datasetKey)[0];

  const visible = useMemo(
    () => dataset.bars.filter((bar) => bar.group === 'ours' || enabled.indexOf(bar.group) >= 0),
    [dataset, enabled],
  );

  const best = useMemo(() => {
    const baselines = dataset.bars.filter((bar) => bar.group !== 'ours');
    return baselines.reduce((acc, bar) => (bar.value > acc ? bar.value : acc), 0);
  }, [dataset]);

  const ours = dataset.bars.filter((bar) => bar.group === 'ours')[0];
  const gap = ours.value - best;

  const toggleGroup = (key: GroupKey): void => {
    setEnabled(enabled.indexOf(key) >= 0 ? enabled.filter((k) => k !== key) : enabled.concat([key]));
    setFocused('');
  };

  const readout = ((): string => {
    if (!focused) return '点一根条形，读出它的准确率与所属基线组。';
    if (focused === 'ours') {
      return `比同组最强基线高 ${gap.toFixed(2)} 个百分点（${dataset.short}）：${ours.value.toFixed(2)}% 对 ${best.toFixed(2)}%。`;
    }
    const bar = dataset.bars.filter((b) => b.key === focused)[0];
    if (!bar) return '点一根条形，读出它的准确率与所属基线组。';
    return `「${bar.name}」${bar.value.toFixed(2)}%（${dataset.short}，${GROUP_META[bar.group as GroupKey].label}）。`;
  })();

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
        .p3c-btn { font: inherit; color: inherit; background: none; border: none; padding: 0; margin: 0; text-align: left; cursor: pointer; }
        .p3c-btn:focus-visible { outline: 3px solid ${C.blue}; outline-offset: 3px; }
        .p3c-bar { transition: height .62s cubic-bezier(.16,1,.3,1), background .25s ease; animation: p3c-grow .55s cubic-bezier(.16,1,.3,1); transform-origin: bottom; }
        @keyframes p3c-grow { from { transform: scaleY(0.02); } to { transform: scaleY(1); } }
        .p3c-chip:hover { outline: 2px dashed ${C.orange}; outline-offset: 2px; }
      `}</style>

      <section
        style={{
          flex: '0 0 980px',
          minWidth: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '2px 2px',
          boxSizing: 'border-box',
        }}
      >
        <header style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 12, minHeight: 56 }}>
          <h3 style={{ margin: 0, fontSize: 34, lineHeight: 1.3, fontWeight: 700, whiteSpace: 'nowrap' }}>
            零样本准确率对比
          </h3>
          <span style={{ fontSize: 21, lineHeight: 1.4, color: C.inkSoft, whiteSpace: 'nowrap' }}>
            {dataset.caption}
          </span>
          <span style={{ flex: 1 }} />
          <ThemeMini />
        </header>

        <div style={{ flex: '1 1 0', minHeight: 0, position: 'relative' }}>
          {TICKS.map((tick) => (
            <div
              key={tick}
              style={{
                position: 'absolute',
                left: 84,
                right: 8,
                bottom: PLOT_BOTTOM + tick * BAR_SCALE,
                height: tick === 0 ? 2 : 1,
                background: tick === 0 ? C.silkEdge : 'rgba(201,177,132,0.8)',
              }}
            />
          ))}

          {TICKS.map((tick) => (
            <span
              key={tick}
              style={{
                position: 'absolute',
                left: 30,
                width: 46,
                bottom: PLOT_BOTTOM + tick * BAR_SCALE - 13,
                textAlign: 'right',
                fontSize: 20,
                lineHeight: 1.3,
                color: C.inkSoft,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {tick}
            </span>
          ))}

          <div
            style={{
              position: 'absolute',
              left: 0,
              bottom: PLOT_BOTTOM,
              width: 30,
              height: PLOT_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              writingMode: 'vertical-rl',
              fontSize: 20,
              lineHeight: 1.3,
              color: C.inkSoft,
              letterSpacing: 1,
            }}
          >
            准确率（%）
          </div>

          <div
            style={{
              position: 'absolute',
              left: 84,
              right: 8,
              bottom: PLOT_BOTTOM,
              height: PLOT_HEIGHT,
              display: 'flex',
              alignItems: 'flex-end',
              gap: 10,
            }}
          >
            {visible.map((bar) => {
              const active = focused === bar.key;
              return (
                <button
                  key={bar.key}
                  type="button"
                  className="p3c-btn"
                  aria-label={`${bar.name} ${bar.value.toFixed(2)} 个百分点`}
                  aria-pressed={active}
                  onClick={() => setFocused(active ? '' : bar.key)}
                  style={{
                    flex: '1 1 0',
                    minWidth: 0,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 22,
                      lineHeight: 1.3,
                      fontWeight: 800,
                      color: bar.group === 'ours' ? C.green : C.ink,
                      fontVariantNumeric: 'tabular-nums',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {bar.value.toFixed(2)}
                  </span>
                  <div
                    className="p3c-bar"
                    style={{
                      width: '100%',
                      maxWidth: 66,
                      height: `${bar.value * BAR_SCALE}px`,
                      background: barColor(bar.group),
                      borderRadius: '6px 6px 0 0',
                      boxShadow: active
                        ? `0 0 0 3px ${bar.group === 'ours' ? 'rgba(34,141,92,0.35)' : 'rgba(39,68,110,0.28)'}`
                        : bar.group === 'ours'
                          ? '0 0 0 2px rgba(34,141,92,0.22)'
                          : 'none',
                    }}
                  />
                </button>
              );
            })}
          </div>

          <div
            style={{
              position: 'absolute',
              left: 84,
              right: 8,
              bottom: 2,
              height: 70,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            {visible.map((bar) => (
              <div key={bar.key} style={{ flex: '1 1 0', minWidth: 0, textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 17,
                    lineHeight: 1.4,
                    letterSpacing: '-0.2px',
                    fontWeight: bar.group === 'ours' ? 800 : 600,
                    color: bar.group === 'ours' ? C.green : C.ink,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {bar.name}
                </div>
                <div style={{ fontSize: 16, lineHeight: 1.4, color: C.inkSoft, whiteSpace: 'nowrap' }}>
                  {bar.sub || '\u00a0'}
                </div>
              </div>
            ))}
          </div>
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
        <header style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', minHeight: 45 }}>
          <h3 style={{ margin: 0, fontSize: 34, lineHeight: 1.3, fontWeight: 700 }}>数据集</h3>
        </header>

        {DATASETS.map((d) => {
          const active = d.key === datasetKey;
          return (
            <button
              key={d.key}
              type="button"
              className="p3c-btn p3c-chip"
              aria-pressed={active}
              onClick={() => {
                setDatasetKey(d.key);
                setFocused('');
              }}
              style={{
                flex: '0 0 auto',
                minHeight: 42,
                boxSizing: 'border-box',
                padding: '0 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: active ? C.blueSoft : '#ffffff',
                border: `2px solid ${active ? C.blue : C.silkEdge}`,
                borderRadius: 10,
                fontSize: 21,
                lineHeight: 1.4,
                fontWeight: active ? 700 : 500,
                color: active ? C.blue : C.ink,
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: active ? C.blue : C.silkEdge,
                  flex: '0 0 10px',
                }}
              />
              {d.label}
              {active ? <span style={{ marginLeft: 'auto', fontSize: 19, lineHeight: 1.4, color: C.blue }}>当前</span> : null}
            </button>
          );
        })}

        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 8, minHeight: 32 }}>
          <span style={{ fontSize: 26, lineHeight: 1.4, fontWeight: 700, whiteSpace: 'nowrap' }}>基线组</span>
          <span style={{ fontSize: 19, lineHeight: 1.4, color: C.inkSoft, whiteSpace: 'nowrap' }}>点一下隐藏或显示</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, flex: '0 0 auto' }}>
          {(Object.keys(GROUP_META) as GroupKey[]).map((key) => {
            const active = enabled.indexOf(key) >= 0;
            return (
              <button
                key={key}
                type="button"
                className="p3c-btn p3c-chip"
                aria-pressed={active}
                onClick={() => toggleGroup(key)}
                style={{
                  boxSizing: 'border-box',
                  minHeight: 32,
                  padding: '0 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: active ? '#ffffff' : '#f1f2f0',
                  border: `1.5px ${active ? 'solid' : 'dashed'} ${active ? GROUP_META[key].color : C.silkEdge}`,
                  borderRadius: 8,
                  fontSize: 19,
                  lineHeight: 1.4,
                  color: active ? C.ink : C.inkSoft,
                  textDecoration: active ? 'none' : 'line-through',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    background: active ? GROUP_META[key].color : 'transparent',
                    border: `1.5px solid ${GROUP_META[key].color}`,
                    flex: '0 0 12px',
                  }}
                />
                {GROUP_META[key].label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: 3,
              background: C.green,
              boxShadow: '0 0 0 2px rgba(34,141,92,0.2)',
              flex: '0 0 16px',
            }}
          />
          <span style={{ fontSize: 20, lineHeight: 1.4, fontWeight: 700, whiteSpace: 'nowrap' }}>AdaptivePath</span>
          <span style={{ fontSize: 18, lineHeight: 1.4, color: C.inkSoft, whiteSpace: 'nowrap' }}>本方法始终显示</span>
        </div>

        <div
          style={{
            flex: '0 0 auto',
            minHeight: 60,
            boxSizing: 'border-box',
            padding: '0 10px',
            background: C.orangeSoft,
            border: `1.5px solid ${C.orange}`,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            fontSize: 20,
            lineHeight: 1.4,
            fontWeight: 600,
            color: '#8a3f16',
          }}
        >
          同一数据集内比较；不同数据集协议不同，不要跨轴比较
        </div>

        <div
          aria-live="polite"
          style={{
            flex: '1 1 auto',
            minHeight: 132,
            boxSizing: 'border-box',
            padding: '4px 12px',
            background: '#ffffff',
            border: `1.5px solid ${C.silkEdge}`,
            borderRadius: 10,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <div style={{ fontSize: 21, lineHeight: 1.4, color: C.inkSoft }}>读数</div>
          <div style={{ fontSize: 21, lineHeight: 1.4, color: C.ink }}>{readout}</div>
          <div style={{ fontSize: 17, lineHeight: 1.4, color: C.inkSoft }}>
            纵轴 0–100%，不截断零点；条形只取论文表格已报告的数值。
          </div>
        </div>
      </section>
    </div>
  );
}
