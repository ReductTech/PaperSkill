import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clamp, localPoint, usePanelWidth, WavePath } from './omni-interaction-kit';

const MASKS = [20, 40, 60, 80];
const CHANNELS = ['Fp1', 'Fp2', 'C3', 'C4', 'Cz', 'P3', 'P4', 'O1', 'O2', 'Fz'];
const MASK_ORDER = [1, 7, 3, 9, 0, 5, 2, 8];

export const OmniLab12: React.FC<WidgetProps> = () => {
  const { ref, mobile } = usePanelWidth<HTMLDivElement>();
  const width = mobile ? 360 : 920;
  const height = mobile ? 580 : 450;
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const p = MASKS[index];
  const masked = new Set(MASK_ORDER.slice(0, p / 10));
  const waves = mobile ? { x: 44, y: 62, w: 284, row: 35 } : { x: 56, y: 62, w: 540, row: 34 };
  const rail = mobile ? { x: 32, y: 466, w: 296 } : { x: 654, y: 118, w: 216 };

  const update = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging) return;
    const point = localPoint(event, width, height);
    setIndex(Math.round(clamp((point.x - rail.x) / rail.w, 0, 1) * 3));
  };

  return (
    <div className="oi-unit" ref={ref}>
      <div className="oi-caption"><span>拖动遮蔽比例，观察整条传感器通道怎样被置零</span><strong>p = {p}% · 保留 {10 - masked.size}/10 通道</strong></div>
      <svg
        className={`oi-stage ${dragging ? 'is-dragging' : ''}`}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="拖动通道遮蔽比例，观察EEG整条通道置零及鲁棒性变化"
        onPointerMove={update}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onPointerLeave={() => setDragging(false)}
      >
        <rect x=".5" y=".5" width={width - 1} height={height - 1} rx="6" fill="#f7f9fb" stroke="#d6e0e8" />
        <g>
          <rect x={mobile ? 24 : 42} y="32" width={mobile ? 312 : 570} height={mobile ? 386 : 370} rx="5" fill="#fff" stroke="#cbd7e1" />
          {CHANNELS.map((channel, row) => {
            const y = waves.y + row * waves.row;
            const off = masked.has(row);
            return <g key={channel}>
              <text x={waves.x - 9} y={y + 4} textAnchor="end" className={off ? 'oi-mini oi-muted' : 'oi-mini'}>{channel}</text>
              <line x1={waves.x} y1={y} x2={waves.x + waves.w} y2={y} stroke="#edf1f4" />
              {off ? <>
                <line x1={waves.x} y1={y} x2={waves.x + waves.w} y2={y} stroke="#c47719" strokeWidth="2.5" />
                <rect x={waves.x + waves.w - 54} y={y - 10} width="50" height="20" rx="3" fill="#fff1da" />
                <text x={waves.x + waves.w - 29} y={y + 4} textAnchor="middle" className="oi-hint">置零</text>
              </> : <WavePath x={waves.x} y={y} width={waves.w} amp={13} phase={row * .72} color={row === 4 ? '#6756a3' : '#245d87'} strokeWidth={1.4} />}
            </g>;
          })}
        </g>

        <g transform={mobile ? 'translate(24,426)' : 'translate(646,64)'}>
          <text x="0" y="20" className="oi-label">论文报告的区间</text>
          <text x="8" y="104" className={p <= 40 ? 'oi-result-good' : 'oi-note'}>20–40% · BIOT 总体相对稳定</text>
          <text x="8" y="130" className={p >= 60 ? 'oi-result-bad' : 'oi-note'}>60–80% · 多数模型总体接近机会水平</text>
        </g>

        <g className="oi-draggable" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); }}>
          <line x1={rail.x} y1={rail.y} x2={rail.x + rail.w} y2={rail.y} stroke="#cbd5de" strokeWidth="6" strokeLinecap="round" />
          {MASKS.map((value, tick) => {
            const x = rail.x + tick / 3 * rail.w;
            return <g key={value} className="oi-draggable" onPointerDown={(event) => { event.stopPropagation(); setIndex(tick); }}><circle cx={x} cy={rail.y} r="8" fill="transparent" /><circle cx={x} cy={rail.y} r="4" fill="#93a4b5" /><text x={x} y={rail.y + 25} textAnchor="middle" className="oi-mini">{value}%</text></g>;
          })}
          <circle cx={rail.x + index / 3 * rail.w} cy={rail.y} r="13" fill="#fff" stroke="#c47719" strokeWidth="4" />
        </g>
      </svg>
      <div className={`oi-feedback ${p >= 60 ? 'bad' : 'good'}`}><b>{p <= 40 ? '跨任务总体趋势：BIOT 在中度遮蔽下相对其他模型更稳定。' : '跨任务总体趋势：严重遮蔽时多数模型接近机会水平。'} 波形只展示整通道置零机制，不编码性能数值。</b></div>
    </div>
  );
};
