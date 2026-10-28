import React, { useId, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { MathText } from '../components/MathText';
import './geometry-training.css';
import './interaction-workbenches.css';
import './vector-semantics.css';

const wrapAngle = (value: number) => {
  const result = ((value + 180) % 360 + 360) % 360 - 180;
  return result === -180 && value > 0 ? 180 : result;
};
const pretty = (value: number, digits = 3) => (Math.abs(value) < 0.0005 ? 0 : value).toFixed(digits);

export const Clip04: React.FC<WidgetProps> = () => {
  const id = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<number | null>(null);
  const [angle, setAngle] = useState(70);
  const [length, setLength] = useState(1.4);
  const [lastAction, setLastAction] = useState<'angle' | 'length'>('angle');
  const radians = angle * Math.PI / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const radius = 90, cx = 250, cy = 190;
  const endpoint = { x: cx + radius * length * cosine, y: cy - radius * length * sine };
  const unit = { x: cx + radius * cosine, y: cy - radius * sine };
  const absoluteAngle = Math.abs(angle);
  const angleArc = `M ${cx + 37} ${cy} A 37 37 0 0 ${angle >= 0 ? 0 : 1} ${cx + 37 * cosine} ${cy - 37 * sine}`;
  const dot = length * cosine;
  const changeAngle = (value: number) => { setAngle(wrapAngle(value)); setLastAction('angle'); };
  const feedback = lastAction === 'length'
    ? `长度改变会缩放原始点积，当前为 ${pretty(dot)}。方向没有改变，因此归一化后的相似度仍由夹角决定，与长度无关。`
    : absoluteAngle === 0
      ? '两个向量指向同一个方向。即使长度不同，余弦相似度仍为 1。'
      : absoluteAngle === 180
        ? '两个向量指向相反方向，余弦相似度为 −1。负分数仍是相似度，不是负的概率。'
        : absoluteAngle === 90
          ? '两个向量垂直，点积与余弦相似度都为 0。在真实模型中，这不等于断言两个概念绝对无关。'
          : `当前夹角为 ${absoluteAngle}°。把方向转得更接近，余弦值会变大；这个二维实验只演示计算原理。`;

  const updatePointer = (event: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return;
    const point = svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
    const local = point.matrixTransform(matrix.inverse());
    if (Math.hypot(local.x - cx, local.y - cy) < 8) return;
    changeAngle(Math.round(Math.atan2(cy - local.y, local.x - cx) * 180 / Math.PI));
  };
  const endDrag = (event: React.PointerEvent<SVGSVGElement>) => {
    if (dragging.current !== event.pointerId) return;
    if (event.type === 'pointerup') updatePointer(event);
    dragging.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return <div className="gt-lab wb-vector" onKeyDown={event => { if (event.key.startsWith('Arrow')) event.stopPropagation(); }}>
    <div className="gt-lab-heading">
      <div><span className="gt-eyebrow">向量实验室</span><h3>方向决定相似，长度可以改变</h3><p>拖动靛蓝端点，再试着只改变长度。</p></div>
      <button type="button" className="gt-reset" onClick={() => { setAngle(70); setLength(1.4); setLastAction('angle'); }}>重置实验 ↺</button>
    </div>

    <div className="gt-geometry-grid">
      <div className="gt-panel gt-geometry-stage">
        <div className="gt-stage-top"><span className="gt-mini-label">二维向量空间</span><span className="gt-pill">长度 1 的虚线圆</span></div>
        <svg ref={svgRef} className="gt-vector-svg" viewBox="0 0 500 380" role="group" aria-label="可操作的向量图。哑金文本向量固定向右，靛蓝图像向量可以拖动。"
          onPointerDown={event => { if (event.button === 0 && (event.target as Element).closest('[data-vector-handle]')) { dragging.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); updatePointer(event); } }}
          onPointerMove={event => { if (dragging.current === event.pointerId) updatePointer(event); }} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={() => { dragging.current = null; }}>
          <defs>
            <marker id={`${id}-text`} markerWidth="9" markerHeight="9" refX="7.3" refY="4.5" orient="auto"><path d="M0,1 L8,4.5 L0,8" fill="none" stroke="#bd9254" strokeWidth="1.8" /></marker>
            <marker id={`${id}-image`} markerWidth="9" markerHeight="9" refX="7.3" refY="4.5" orient="auto"><path d="M0,1 L8,4.5 L0,8" fill="none" stroke="#5365ad" strokeWidth="1.8" /></marker>
            <pattern id={`${id}-dots`} width="25" height="25" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#dce5df" /></pattern>
          </defs>
          <rect x="20" y="10" width="460" height="360" rx="18" fill={`url(#${id}-dots)`} />
          <line x1="58" y1={cy} x2="442" y2={cy} stroke="#b8c9c0" strokeWidth="1.2" />
          <line x1={cx} y1="18" x2={cx} y2="362" stroke="#b8c9c0" strokeWidth="1.2" />
          <circle cx={cx} cy={cy} r={radius} fill="#ffffffa8" stroke="#9fbab0" strokeWidth="1.5" strokeDasharray="5 6" />
          <text className="gt-svg-axis" x={cx - radius} y={cy + 23} textAnchor="middle">−1</text><text className="gt-svg-axis" x={cx + radius} y={cy + 23} textAnchor="middle">1</text>
          <text className="gt-svg-axis" x={cx - 14} y={cy - radius + 5} textAnchor="end">1</text><text className="gt-svg-axis" x={cx - 14} y={cy + radius + 5} textAnchor="end">−1</text>
          <path d={`${angleArc} L ${cx} ${cy} Z`} fill="#5365ad1c" />
          {absoluteAngle > 1 && <path d={angleArc} fill="none" stroke="#5365ad" strokeWidth="2" />}
          <line x1={endpoint.x} y1={endpoint.y} x2={endpoint.x} y2={cy} stroke="#5365ad" strokeOpacity="0.4" strokeDasharray="4 5" />
          <line x1={cx} y1={cy} x2={cx + radius} y2={cy} stroke="#bd9254" strokeWidth="4" markerEnd={`url(#${id}-text)`} />
          <line x1={cx} y1={cy} x2={endpoint.x} y2={endpoint.y} stroke="#5365ad" strokeWidth="4" markerEnd={`url(#${id}-image)`} />
          <circle cx={unit.x} cy={unit.y} r="5" fill="#ffffff" stroke="#5365ad" strokeWidth="2.5" />
          <circle cx={cx} cy={cy} r="4" fill="#26364a" />
          <g data-vector-handle="true" className="gt-vector-handle" role="slider" tabIndex={0} aria-label="图像向量的有向转角" aria-valuemin={-180} aria-valuemax={180} aria-valuenow={angle} aria-valuetext={`${angle}度；相似度${pretty(cosine)}`} aria-orientation="horizontal"
            onKeyDown={event => {
              const step = event.shiftKey ? 15 : 5;
              if (['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'Home', 'End'].includes(event.key)) { event.preventDefault(); event.stopPropagation(); }
              if (event.key === 'ArrowUp' || event.key === 'ArrowRight') changeAngle(angle + step);
              if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') changeAngle(angle - step);
              if (event.key === 'Home') changeAngle(-180);
              if (event.key === 'End') changeAngle(180);
            }}>
            <circle className="gt-handle-halo" cx={endpoint.x} cy={endpoint.y} r="24" fill="#5365ad14" />
            <circle cx={endpoint.x} cy={endpoint.y} r="11" fill="#5365ad" stroke="#ffffff" strokeWidth="4" />
          </g>
        </svg>
        <div className="gt-legend"><span><i className="gt-dot gt-text-vector" />文本向量 u</span><span><i className="gt-dot gt-image-vector" />图像向量 v</span><span><i className="gt-dot gt-normalized-vector" />归一化后的端点</span></div>
        <p className="gt-keyboard-tip">端点可用 Tab 聚焦，用方向键转动；按住 Shift 每次转 15°。</p>
      </div>

      <div className="gt-geometry-controls">
        <div className="gt-panel gt-similarity-card">
          <span className="gt-mini-label">归一化后的相似度</span>
          <div className="gt-number-hero">{pretty(cosine)}<MathText tex={String.raw`\cos\theta`} /></div>
          <div className="gt-sim-scale"><i style={{ left: `${(cosine + 1) * 50}%` }} /></div>
          <div className="gt-scale-labels"><span>−1 反向</span><span>0 垂直</span><span>1 同向</span></div>
          <div className="gt-mini-metrics"><div><span>向量夹角 <MathText tex={String.raw`\theta`} /></span><strong>{absoluteAngle}°</strong></div><div><span>原始点积 <MathText tex={String.raw`v\cdot u`} /></span><strong>{pretty(dot)}</strong></div></div>
        </div>
        <div className="gt-panel gt-control-card"><div className="wb-live-pair" aria-live="polite"><span>拖动滑块，直接比较</span><strong>相似度 {pretty(cosine)}</strong></div>
          <div className="gt-control-heading"><label htmlFor={`${id}-angle`}>转动方向</label><output>{angle}°</output></div>
          <input id={`${id}-angle`} className="gt-range" type="range" min={-180} max={180} step={1} value={angle} onChange={event => changeAngle(Number(event.target.value))} />
          <div className="gt-segmented" role="group" aria-label="向量方向预设">{[{ angle: 0, text: '0° 同向' }, { angle: 90, text: '90° 垂直' }, { angle: 180, text: '180° 反向' }].map(preset => <button key={preset.angle} type="button" aria-pressed={absoluteAngle === preset.angle} onClick={() => changeAngle(preset.angle)}>{preset.text}</button>)}</div>
          <div className="gt-control-heading gt-length-heading"><label htmlFor={`${id}-length`}>只改变图像向量长度</label><output>{length.toFixed(2)}</output></div>
          <input id={`${id}-length`} className="gt-range" type="range" min={0.4} max={1.8} step={0.05} value={length} onChange={event => { setLength(Number(event.target.value)); setLastAction('length'); }} />
          <p className="gt-microcopy">文本向量长度固定为 1；两个向量始终非零。</p>
        </div>
      </div>
    </div>
    <div className="gt-insight" aria-live="polite"><span className="gt-insight-icon">↗</span><div><strong>{lastAction === 'length' ? '长度变了，方向没有变' : '观察方向，而不只是分数'}</strong><p>{feedback}</p></div></div>
    <div className="gt-equation"><span>这一刻的计算</span><MathText display className="gt-live-formula" tex={String.raw`\frac{${pretty(dot)}}{${length.toFixed(2)}\times 1}\approx ${pretty(cosine)}`} /><small>原始点积除以两个向量的长度。数值已四舍五入。</small></div>
  </div>;
};
