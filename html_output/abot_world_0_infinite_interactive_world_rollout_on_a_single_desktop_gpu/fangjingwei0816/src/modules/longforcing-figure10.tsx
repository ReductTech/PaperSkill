import React, { useMemo, useState } from 'react';

type MetricId = 'hps' | 'saturation' | 'blur' | 'repeat';

const TIMES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

const METRICS: Record<MetricId, {
  label: string;
  compactLabel: string;
  direction: string;
  compactDirection: string;
  baseline: number[];
  long: number[];
  reading: string;
}> = {
  hps: {
    label: '画面美观度（HPSv3）', compactLabel: 'HPSv3 美学分', direction: '↑ 越高越好', compactDirection: '越高越好',
    baseline: [.78, .63, .55, .44, .28, .25, .23, .24, .20, .18, .13, .10, .08],
    long: [.78, .67, .69, .62, .73, .70, .59, .58, .61, .82, .46, .42, .64],
    reading: '基线随滚动总体下降；LongForcing 在后段保持更高的美学质量。',
  },
  saturation: {
    label: '过饱和程度', compactLabel: '高饱和像素比例', direction: '↓ 越低越好', compactDirection: '越低越好',
    baseline: [.08, .04, .03, .03, .12, .58, .49, .62, .46, .59, .57, .61, .86],
    long: [.22, .15, .09, .12, .06, .05, .18, .09, .08, .05, .14, .09, .16],
    reading: '基线后段高饱和伪影增多；LongForcing 的曲线整体保持在较低区域。',
  },
  blur: {
    label: '模糊程度', compactLabel: '感知模糊分', direction: '↓ 越低越好', compactDirection: '越低越好',
    baseline: [.34, .28, .28, .31, .48, .79, .86, .80, .76, .70, .75, .78, .73],
    long: [.36, .27, .21, .31, .23, .20, .19, .24, .28, .23, .30, .35, .27],
    reading: '基线在中后段出现更明显的模糊累积；LongForcing 保持更低的模糊分。',
  },
  repeat: {
    label: '重复程度', compactLabel: 'Patch 重复比例', direction: '↓ 越低越好', compactDirection: '越低越好',
    baseline: [.02, .22, .22, .20, .18, .16, .62, .86, .82, .75, .70, .79, .52],
    long: [.01, .60, .23, .20, .17, .02, .04, .02, .01, .00, .00, .00, .03],
    reading: '基线后段出现持续的局部重复；LongForcing 除早期波动外接近低位。',
  },
};

function toPoints(values: number[]) {
  const left = 38;
  const top = 22;
  const width = 484;
  const height = 144;
  return values.map((v, i) => {
    const x = left + (TIMES[i] / 60) * width;
    const y = top + (1 - v) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

export function Figure10Trend({ compact = false }: { compact?: boolean }) {
  const [metric, setMetric] = useState<MetricId>('hps');
  const selected = METRICS[metric];
  const metricEntries = useMemo(() => Object.entries(METRICS) as Array<[MetricId, typeof selected]>, []);

  return (
    <div className={`figure10-redraw ${compact ? 'is-compact' : ''}`} data-testid="figure10-trend">
      {!compact ? <header className="figure10-plain-intro">
        <span>可切换查看：画面美观度、过饱和程度、模糊程度、重复程度。</span>
      </header> : null}
      <div className="mechanism-tabs" role="tablist" aria-label="Figure 10 指标">
        {metricEntries.map(([id, item]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={metric === id}
            className={metric === id ? 'mechanism-tab active' : 'mechanism-tab'}
            onClick={() => setMetric(id)}
          >
            {compact ? item.compactLabel : item.label}
          </button>
        ))}
      </div>
      <div className="trend-heading">
        <strong>{compact ? selected.compactLabel : selected.label}</strong>
        <span>{compact ? selected.compactDirection : selected.direction}</span>
      </div>
      <svg className="trend-svg" viewBox="0 0 560 205" role="img" aria-label={`${compact ? selected.compactLabel : selected.label}的60秒趋势重绘`}>
        {[0, 15, 30, 45, 60].map((time) => {
          const x = 38 + (time / 60) * 484;
          return <g key={time}><line x1={x} y1="22" x2={x} y2="166" className="trend-grid"/><text x={x} y="188" textAnchor="middle">{time}s</text></g>;
        })}
        {[22, 70, 118, 166].map((y) => <line key={y} x1="38" y1={y} x2="522" y2={y} className="trend-grid" />)}
        {!compact ? <g className="trend-late-region">
          <rect x="280" y="22" width="242" height="144" />
          <text x="510" y="39" textAnchor="end">视频越长，LongForcing 的优势越明显</text>
        </g> : null}
        <polyline points={toPoints(selected.baseline)} className="trend-line baseline" />
        <polyline points={toPoints(selected.long)} className="trend-line longforcing" />
        <g className="trend-legend">
          <line x1="300" y1="12" x2="330" y2="12" className="trend-line baseline" />
          <text x="337" y="16">{compact ? 'Causal-Forcing-style 基线' : '因果基线'}</text>
          <line x1="430" y1="12" x2="460" y2="12" className="trend-line longforcing" />
          <text x="467" y="16">LongForcing</text>
        </g>
      </svg>
      {compact ? <>
        <div className="feedback good">{selected.reading}</div>
        <div className="evidence-note">依据论文 Figure 10 的曲线方向与相对变化中文重绘；论文未公开逐帧原始数据，因此本图不用于读取精确数值，也不设人为漂移阈值。</div>
      </> : <>
        <div className="figure10-main-conclusion">
          <strong>因果基线随着视频变长退化得更明显；LongForcing 在后半程保持得更稳。</strong>
          <span>这里只比较趋势方向，不读取论文未公开的逐点原始数值。</span>
        </div>
        <div className="figure10-boundary">
        <section>
          <strong>这张图能说明什么</strong>
          <ul>
            <li>视频越长，因果基线的表现退化得更明显。</li>
            <li>LongForcing 在长时间生成时表现更稳。</li>
            <li>它的优势主要出现在后半段。</li>
          </ul>
        </section>
        <section>
          <strong>这张图不能说明什么</strong>
          <ul>
            <li>不能说明 LongForcing 完全不会漂。</li>
            <li>不能说明漂移从某一秒开始突然出现。</li>
            <li>不能说明它在所有指标上都是第一。</li>
          </ul>
        </section>
        </div>
      </>}
    </div>
  );
}

export const LongForcingEvidence: React.FC = () => <Figure10Trend />;
