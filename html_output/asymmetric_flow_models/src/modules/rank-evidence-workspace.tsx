import React, { useMemo, useState } from 'react';
import { InteractiveActivity } from '../components/InteractiveActivity';
import type { WidgetProps } from './registry';

const RANK_DATA = [
  { rank: 0, fid: 2.68 },
  { rank: 2, fid: 2.41 },
  { rank: 4, fid: 2.37 },
  { rank: 8, fid: 2.34 },
  { rank: 16, fid: 2.35 },
  { rank: 32, fid: 2.36 },
] as const;

const CHART = { left: 74, right: 710, top: 40, bottom: 282 };
const Y_MIN = 2.3;
const Y_MAX = 2.72;

const xFor = (index: number) => CHART.left + index * ((CHART.right - CHART.left) / (RANK_DATA.length - 1));
const yFor = (fid: number) => CHART.bottom - ((fid - Y_MIN) / (Y_MAX - Y_MIN)) * (CHART.bottom - CHART.top);

export const RankEvidenceWorkspace: React.FC<WidgetProps> = () => {
  const [activeIndex, setActiveIndex] = useState(3);
  const [dragging, setDragging] = useState(false);
  const [explored, setExplored] = useState(false);
  const active = RANK_DATA[activeIndex];

  const points = useMemo(() => RANK_DATA.map((item, index) => ({ ...item, x: xFor(index), y: yFor(item.fid) })), []);
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  const updateFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const index = Math.round(ratio * (RANK_DATA.length - 1));
    setActiveIndex(index);
    setExplored(true);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    setActiveIndex((current) => Math.min(RANK_DATA.length - 1, Math.max(0, current + (event.key === 'ArrowRight' ? 1 : -1))));
    setExplored(true);
  };

  const observation = active.rank === 8
    ? 'r=8 时 FID 最低。'
    : active.rank === 0
      ? 'r=0 对应纯 x₀-prediction。'
      : active.rank > 8
        ? '继续增大 Rank，FID 不再降低。'
        : '较小的非零 Rank 即可明显降低 FID。';

  return (
    <div className="af-mechanism-block af-rank-evidence">
      <InteractiveActivity
        className="af-evidence-activity"
        instruction="沿曲线移动观测点：看 small nonzero Rank 是否更优。"
        observation={explored ? observation : undefined}
        observationKey={`${active.rank}-${active.fid}`}
      >
        <div
          className="af-rank-chart"
          role="slider"
          tabIndex={0}
          aria-label="Patch Rank FID crosshair"
          aria-valuemin={0}
          aria-valuemax={RANK_DATA.length - 1}
          aria-valuenow={activeIndex}
          aria-valuetext={`r=${active.rank}, FID ${active.fid.toFixed(2)}`}
          onKeyDown={onKeyDown}
          onPointerDown={(event) => {
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);
            updateFromPointer(event);
          }}
          onPointerMove={(event) => {
            if (event.pointerType === 'mouse' || dragging) updateFromPointer(event);
          }}
          onPointerUp={(event) => {
            setDragging(false);
            if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
          }}
        >
          <svg viewBox="0 0 760 330" role="img" aria-label="Patch Rank 从 0 到 32 的 FID 离散折线图">
            {[2.3, 2.4, 2.5, 2.6, 2.7].map((tick) => {
              const y = yFor(tick);
              return (
                <g key={tick} className="grid-tick">
                  <line x1={CHART.left} y1={y} x2={CHART.right} y2={y} />
                  <text x={CHART.left - 14} y={y + 5} textAnchor="end">{tick.toFixed(1)}</text>
                </g>
              );
            })}
            <text className="axis-title" x="18" y="34">FID ↓</text>
            <path className="rank-line" d={path} />
            <line className="crosshair" x1={points[activeIndex].x} y1={CHART.top} x2={points[activeIndex].x} y2={CHART.bottom} />
            {points.map((point, index) => (
              <g key={point.rank} className={`rank-point ${index === activeIndex ? 'active' : ''} ${point.rank === 8 ? 'best' : ''}`}>
                <circle cx={point.x} cy={point.y} r={index === activeIndex ? 10 : 6} />
                <text className="x-label" x={point.x} y="309" textAnchor="middle">r={point.rank}</text>
              </g>
            ))}
            <g className="rank-tooltip" transform={`translate(${Math.min(624, Math.max(82, points[activeIndex].x - 57))} ${Math.max(12, points[activeIndex].y - 74)})`}>
              <rect width="114" height="56" rx="8" />
              <text x="12" y="22">r = {active.rank}</text>
              <text className="value" x="12" y="44">FID {active.fid.toFixed(2)}</text>
            </g>
          </svg>
        </div>

        <div className={`af-subspace-branch ${active.rank === 8 ? 'is-linked' : ''}`}>
          <div><span>Subspace 选择</span><small>r = 8</small></div>
          <div className="af-paired-dots" aria-label="PCA and random subspace at rank 8">
            <span><b>PCA</b><i style={{ '--dot': '11%' } as React.CSSProperties} /><strong>2.34</strong></span>
            <span><b>Random</b><i style={{ '--dot': '78%' } as React.CSSProperties} /><strong>2.63</strong></span>
          </div>
        </div>
      </InteractiveActivity>

      <div className="af-compact-evidence-grid">
        <section className="af-compact-evidence optimization">
          <header><div><h3>训练效率</h3></div><small>Fig. 6</small></header>
          {/* Source: AsymFlow paper Fig. 6, page 7. */}
          <img className="af-figure6-image" src="/images/experiments/figure6-convergence.png" alt="Figure 6: AsymFlow and JiT convergence speed comparison" />
          <p className="af-evidence-statement">Comparable FID，约快 40%。</p>
        </section>

        <section className="af-compact-evidence stability">
          <header><div><h3>Low-noise 稳定性</h3></div><small>Table 1</small></header>
          <div className="af-stability-condition">σ<sub>min</sub>: 0.04 → 0</div>
          <div className="af-stability-rows">
            <div><b>AsymFlow</b><strong>+0.52</strong></div>
            <div><b>JiT</b><strong>+1.37</strong></div>
          </div>
        </section>
      </div>
    </div>
  );
};
