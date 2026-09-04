import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { usePanelWidth } from './omni-interaction-kit';

type Focus = 'preprocess' | 'window' | 'label' | 'metric';

const FIELDS: Array<{ id: Focus; short: string; title: string; color: string }> = [
  { id: 'preprocess', short: '预处理', title: '把记录变成可比较的输入', color: '#2876a3' },
  { id: 'window', short: '分窗与对齐', title: '确定这一条样本取哪一段', color: '#278879' },
  { id: 'label', short: '标签规则', title: '说明这一段 EEG 要预测什么', color: '#b2761b' },
  { id: 'metric', short: '评价指标', title: '规定预测结果怎样汇总', color: '#6756a3' },
];

function linePath(x: number, y: number, width: number, amp: number, phase: number, filtered = false) {
  const points = 90;
  return Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1);
    const carrier = Math.sin(t * 22 + phase) * amp * (filtered ? .72 : 1);
    const slow = Math.sin(t * 5.3 + phase * .4) * amp * .38;
    const noise = filtered ? 0 : Math.sin(t * 71 + phase * 2) * amp * .16;
    const px = x + t * width;
    const py = y - carrier - slow - noise;
    return `${i === 0 ? 'M' : 'L'}${px.toFixed(1)} ${py.toFixed(1)}`;
  }).join(' ');
}

function TaskFigure({ focus, compact }: { focus: Focus; compact: boolean }) {
  const width = compact ? 360 : 920;
  const height = compact ? 548 : 390;
  const chart = compact ? { x: 18, y: 72, w: 324, h: 204 } : { x: 30, y: 72, w: 548, h: 252 };
  const card = compact ? { x: 18, y: 306, w: 324, h: 214 } : { x: 608, y: 72, w: 282, h: 252 };
  const eventX = chart.x + chart.w * .59;
  const winX = chart.x + chart.w * .34;
  const winW = chart.w * .31;
  const band = { x: chart.x + 16, y: chart.y + 47, w: chart.w - 32, h: 36 };
  const winTop = band.y + band.h + 18;
  const winBottom = chart.y + chart.h - 30;
  const waveStart = chart.y + (compact ? 106 : 108);
  const waveGap = compact ? 24 : 32;
  const active = FIELDS.find((item) => item.id === focus) ?? FIELDS[0];
  const rows = [
    ['预处理', '滤波 · 重参考', '把不同记录送入同一输入格式'],
    ['分窗与对齐', '[t₀, t₀ + Δt]', '相对事件零点取样'],
    ['标签规则', 'y = h(event, trial)', '由事件或试次生成目标'],
    ['评价指标', 'M(ŷ, y)', '在同一任务内汇总结果'],
  ];
  const rowH = compact ? 38 : 43;

  return (
    <svg className="otc-figure" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`任务卡固定${active.title}`}>
      <defs>
        <pattern id="otc-grid" width="22" height="22" patternUnits="userSpaceOnUse">
          <path d="M22 0H0V22" className="otc-grid-line" />
        </pattern>
        <marker id="otc-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0 0L7 3.5L0 7Z" fill={active.color} />
        </marker>
      </defs>
      <rect x=".5" y=".5" width={width - 1} height={height - 1} rx="5" className="otc-field" />
      <rect x="1" y="1" width={width - 2} height={height - 2} rx="5" fill="url(#otc-grid)" opacity=".34" />

      <text x={chart.x} y="26" className="otc-kicker">ONE TASK INSTANCE</text>
      <text x={chart.x} y="48" className="otc-heading">一条 EEG 记录如何变成一次可复现实验</text>
      <text x={compact ? chart.x : card.x} y={compact ? 62 : 48} textAnchor={compact ? 'start' : 'end'} className="otc-meta">输入形状：C × T　·　规则先于模型</text>

      <rect x={chart.x} y={chart.y} width={chart.w} height={chart.h} rx="5" className="otc-panel" />
      <text x={chart.x + 16} y={chart.y + 23} className="otc-panel-title">连续 EEG 记录</text>
      <text x={chart.x + chart.w - 16} y={chart.y + 23} textAnchor="end" className="otc-panel-note">同一段数据，四条规则分别落地</text>
      <line x1={chart.x + 16} y1={chart.y + 39} x2={chart.x + chart.w - 16} y2={chart.y + 39} className="otc-divider" />

      <rect x={band.x} y={band.y} width={band.w} height={band.h} rx="4" className="otc-rule-strip" />
      <rect x={band.x} y={band.y} width="3" height={band.h} rx="1.5" fill={active.color} />

      {focus === 'preprocess' && (
        <g className="otc-evidence otc-evidence-pre">
          <text x={band.x + 13} y={band.y + 15} className="otc-strip-label">原始波形</text>
          <path d={linePath(band.x + 13, band.y + 26, compact ? 54 : 82, 3.3, .6)} className="otc-strip-wave raw" />
          <path d={`M${band.x + (compact ? 75 : 105)} ${band.y + 18}H${band.x + (compact ? 101 : 139)}`} className="otc-strip-arrow" markerEnd="url(#otc-arrow)" />
          <text x={band.x + (compact ? 116 : 157)} y={band.y + 15} className="otc-strip-label active">滤波与重参考</text>
          <path d={linePath(band.x + (compact ? 116 : 157), band.y + 26, compact ? 65 : 94, 3.3, .6, true)} className="otc-strip-wave processed" />
          <text x={band.x + band.w - 10} y={band.y + 22} textAnchor="end" className="otc-strip-result">{compact ? '模型输入' : '得到模型输入'}</text>
        </g>
      )}

      {focus === 'window' && (
        <g className="otc-evidence otc-evidence-window">
          <text x={band.x + 13} y={band.y + 22} className="otc-strip-label">事件锚点 event</text>
          <path d={`M${band.x + (compact ? 92 : 112)} ${band.y + 18}H${band.x + (compact ? 123 : 157)}`} className="otc-strip-arrow" markerEnd="url(#otc-arrow)" />
          <rect x={band.x + (compact ? 130 : 166)} y={band.y + 7} width={compact ? 84 : 112} height="22" rx="3" className="otc-strip-node green" />
          <text x={band.x + (compact ? 172 : 222)} y={band.y + 22} textAnchor="middle" className="otc-strip-node-text green">[t₀, t₀ + Δt]</text>
          <text x={band.x + band.w - 10} y={band.y + 22} textAnchor="end" className="otc-strip-result">{compact ? '样本边界' : '固定样本边界'}</text>
        </g>
      )}

      {focus === 'label' && (
        <g className="otc-evidence otc-evidence-label">
          <rect x={band.x + 13} y={band.y + 7} width={compact ? 54 : 66} height="22" rx="3" className="otc-strip-node amber" />
          <text x={band.x + (compact ? 40 : 46)} y={band.y + 22} textAnchor="middle" className="otc-strip-node-text amber">event</text>
          <path d={`M${band.x + (compact ? 72 : 84)} ${band.y + 18}H${band.x + (compact ? 97 : 124)}`} className="otc-strip-arrow" markerEnd="url(#otc-arrow)" />
          <text x={band.x + (compact ? 108 : 139)} y={band.y + 22} className="otc-strip-formula">h(event, trial)</text>
          <path d={`M${band.x + (compact ? 178 : 224)} ${band.y + 18}H${band.x + (compact ? 205 : 259)}`} className="otc-strip-arrow" markerEnd="url(#otc-arrow)" />
          <rect x={band.x + (compact ? 212 : 268)} y={band.y + 7} width={compact ? 46 : 58} height="22" rx="3" className="otc-strip-node amber" />
          <text x={band.x + (compact ? 235 : 297)} y={band.y + 22} textAnchor="middle" className="otc-strip-node-text amber">标签 y</text>
        </g>
      )}

      {focus === 'metric' && (
        <g className="otc-evidence otc-evidence-metric">
          <text x={band.x + 13} y={band.y + 14} className="otc-strip-label">完整测试集</text>
          <text x={band.x + 13} y={band.y + 27} className="otc-strip-pair">(ŷ₁,y₁) ··· (ŷₙ,yₙ)</text>
          <path d={`M${band.x + (compact ? 112 : 158)} ${band.y + 18}H${band.x + (compact ? 143 : 205)}`} className="otc-strip-arrow" markerEnd="url(#otc-arrow)" />
          <rect x={band.x + (compact ? 150 : 214)} y={band.y + 7} width={compact ? 76 : 96} height="22" rx="3" className="otc-strip-node purple" />
          <text x={band.x + (compact ? 188 : 262)} y={band.y + 22} textAnchor="middle" className="otc-strip-node-text purple">M(ŷ, y)</text>
          <text x={band.x + band.w - 10} y={band.y + 22} textAnchor="end" className="otc-strip-result">{compact ? '任务分数' : '得到一个任务分数'}</text>
        </g>
      )}

      {[0, 1, 2, 3].map((row) => {
        const y = waveStart + row * waveGap;
        const isFocus = focus === 'preprocess';
        return (
          <g key={row}>
            <text x={chart.x + 21} y={y + 3} className="otc-channel">Ch {row + 1}</text>
            <line x1={chart.x + 48} y1={y} x2={chart.x + chart.w - 16} y2={y} className="otc-baseline" />
            <path d={linePath(chart.x + 50, y, chart.w - 68, 8 - row * .8, row * .7 + .4)} className="otc-wave raw" opacity={isFocus ? .34 : .78} />
            {isFocus && <path d={linePath(chart.x + 50, y, chart.w - 68, 8 - row * .8, row * .7 + .4, true)} className="otc-wave processed" />}
          </g>
        );
      })}

      {(focus === 'window' || focus === 'label') && (
        <g>
          <line x1={eventX} y1={band.y + band.h + 5} x2={eventX} y2={chart.y + chart.h - 22} className="otc-event-line" />
          <circle cx={eventX} cy={band.y + band.h + 10} r="4" className="otc-event-dot" />
          <text x={eventX + 7} y={band.y + band.h + 13} className="otc-event-label">event</text>
        </g>
      )}
      <text x={chart.x + 50} y={chart.y + chart.h - 8} className="otc-axis">0</text>
      <text x={chart.x + chart.w - 50} y={chart.y + chart.h - 8} textAnchor="end" className="otc-axis">T</text>

      {focus === 'window' && (
        <g className="otc-evidence otc-evidence-window">
          <rect x={winX} y={winTop} width={winW} height={winBottom - winTop} className="otc-window-fill" />
          <rect x={winX} y={winTop} width={winW} height={winBottom - winTop} className="otc-window-border" />
          <text x={winX} y={chart.y + chart.h - 8} textAnchor="middle" className="otc-axis">t₀</text>
          <text x={winX + winW} y={chart.y + chart.h - 8} textAnchor="middle" className="otc-axis">t₀ + Δt</text>
        </g>
      )}

      <rect x={card.x} y={card.y} width={card.w} height={card.h} rx="5" className="otc-card" />
      <rect x={card.x} y={card.y} width="4" height={card.h} rx="2" fill={active.color} />
      <text x={card.x + 18} y={card.y + 25} className="otc-card-kicker">TASK CARD</text>
      <text x={card.x + 18} y={card.y + 47} className="otc-card-title">一张卡固定四件事</text>
      {rows.map(([name, value, note], index) => {
        const y = card.y + 70 + index * rowH;
        const selected = FIELDS[index].id === focus;
        return (
          <g key={name} className={selected ? 'otc-card-row selected' : 'otc-card-row'}>
            <line x1={card.x + 18} y1={y + 8} x2={card.x + card.w - 17} y2={y + 8} className="otc-row-line" />
            <circle cx={card.x + 25} cy={y + 23} r="3.5" fill={selected ? active.color : '#b8c5d0'} />
            <text x={card.x + 37} y={y + 20} className="otc-row-name">{name}</text>
            <text x={card.x + 37} y={y + 35} className="otc-row-value">{value}</text>
            {!compact && <text x={card.x + 157} y={y + 28} className="otc-row-note">{note}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export const OmniLab4: React.FC<WidgetProps> = () => {
  const { ref, mobile } = usePanelWidth<HTMLDivElement>();
  const [focus, setFocus] = useState<Focus>('window');
  const active = useMemo(() => FIELDS.find((item) => item.id === focus) ?? FIELDS[1], [focus]);

  return (
    <section className="otc-unit" ref={ref} aria-label="任务卡固定实验条件的原理示意">
      <div className="otc-toolbar">
        <div>
          <span className="otc-toolbar-kicker">READ ONE FIELD AT A TIME</span>
          <b>{active.title}</b>
        </div>
        <div className="otc-field-tabs" role="group" aria-label="选择要查看的任务卡字段">
          {FIELDS.map((field) => (
            <button key={field.id} type="button" className={focus === field.id ? 'selected' : ''} aria-pressed={focus === field.id} onClick={() => setFocus(field.id)}>
              <i style={{ background: field.color }} />{field.short}
            </button>
          ))}
        </div>
      </div>
      <div className="otc-figure-wrap">
        <TaskFigure focus={focus} compact={mobile} />
      </div>
      <p className="otc-footnote"><b>任务卡的作用：</b>把“测量某种能力”写成一次可以重复执行的预测实验。同一任务比较不同模型时，骨干可以更换，卡上的规则保持不变；换任务则读取对应的新卡。</p>
    </section>
  );
};
