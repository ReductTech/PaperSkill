import { useState } from 'react';
import type { WidgetProps } from './registry';
import { clamp, fmt, Slider, Feedback, MatrixGrid } from './aqKit';
import { SymbolHint } from '../components/SymbolHint';

export function EqTransform(_props: WidgetProps) {
  const [scale, setScale] = useState(1);
  const [shift, setShift] = useState(0);
  const [angle, setAngle] = useState(0);

  const rad = (angle * Math.PI) / 180;
  const s = scale;
  const a = s * Math.cos(rad);
  const b = -s * Math.sin(rad);
  const c = s * Math.sin(rad);
  const d = s * Math.cos(rad);

  // 示意映射：把「偏离恒等」当作「等价变换对量化误差的改善」，非论文实测数值。
  const err = clamp(0.92 - 0.45 * (Math.abs(scale - 1) + Math.abs(shift) + Math.abs(angle) / 45), 0.05, 0.92);
  const errPct = Math.round(err * 100);
  const levels = clamp(Math.round(2 + 8 * (1 - err)), 2, 10);

  const bands: string[] = [];
  for (let i = 0; i < levels; i += 1) {
    const t = i / Math.max(1, levels - 1);
    bands.push(`rgb(${Math.round(176 - 88 * t)},${Math.round(198 - 76 * t)},${Math.round(184 - 66 * t)})`);
  }

  const tone = err > 0.6 ? 'red' : err > 0.3 ? 'orange' : 'green';
  const feedback = err > 0.6
    ? `误差仍大（约 ${errPct}%）`
    : err > 0.3
      ? `误差在降，输出不变（约 ${errPct}%）`
      : `误差很小，输出不变（约 ${errPct}%）`;

  const cells = [
    [{ label: fmt(a), tone: 'blue' as const, on: true }, { label: fmt(b), tone: 'blue' as const, on: true }],
    [{ label: fmt(c), tone: 'blue' as const, on: true }, { label: fmt(d), tone: 'blue' as const, on: true }],
  ];

  return (
    <div className="aq-layout aq-two">
      <div className="aq-panel grow">
        <svg viewBox="0 0 860 560" role="img"
          aria-label={`取景框正在缩放 ${fmt(scale)}、平移 ${fmt(shift)}、旋转 ${fmt(angle)} 度，被摄主体保持不变`}>
          <rect width="860" height="560" fill="#eef3f7" />
          <g stroke="#d7deea" strokeWidth="1" opacity="0.7">
            {Array.from({ length: 13 }).map((_, i) => <line key={`v${i}`} x1={i * 72} y1="0" x2={i * 72} y2="560" />)}
            {Array.from({ length: 9 }).map((_, i) => <line key={`h${i}`} x1="0" y1={i * 70} x2="860" y2={i * 70} />)}
          </g>
          <path d="M0 380 L210 250 L330 368 L470 220 L650 360 L860 300 L860 560 L0 560 Z" fill="#b7cfc9" />
          <path d="M0 430 L240 320 L400 420 L540 300 L860 430 L860 560 L0 560 Z" fill="#86a89f" />
          <g stroke="#228d5c" strokeWidth="3" fill="none">
            <path d="M0 376 L210 250 L330 368 L470 222 L650 360 L860 300" strokeDasharray="6 6" opacity="0.9" />
          </g>
          <g transform={`translate(430 300) rotate(${angle}) scale(${scale}) translate(-430 -300) translate(${shift * 70} ${-shift * 50})`}>
            <rect x="250" y="150" width="360" height="280" fill="none" stroke="#27446e" strokeWidth="5" />
            {[[250, 150], [610, 150], [250, 430], [610, 430]].map(([x, y]) => (
              <path key={`${x}-${y}`} d={`M${x} ${y - 20} V${y + 20} M${x - 20} ${y} H${x + 20}`} stroke="#f07e47" strokeWidth="5" />
            ))}
          </g>
          <g transform="translate(690 400)">
            <rect width="132" height="112" rx="8" fill="#0f1b26" />
            {bands.map((cpt, i) => <rect key={i} x="6" y={6 + i * (100 / levels)} width="120" height={100 / levels} fill={cpt} />)}
            <text x="66" y="134" textAnchor="middle" fontSize="16" fill="#68778f">压色阶预览</text>
          </g>
          <text x="28" y="40" fontSize="22" fontWeight="700" fill="#33415a">被摄主体（输出 Y）始终不变</text>
        </svg>
      </div>
      <div className="aq-panel" style={{ gap: 10 }}>
        <div className="aq-heading">等价变换</div>
        <p className="aq-body muted">拖动滑块，观察输出不变而误差可调。</p>
        <div className="aq-controls" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
          <Slider label="缩放 s" value={scale} min={0.5} max={1.5} step={0.01} onChange={setScale} />
          <Slider label="平移 t" value={shift} min={-0.5} max={0.5} step={0.01} onChange={setShift} />
          <Slider label="旋转 θ" value={angle} min={-45} max={45} step={1} unit="°" onChange={setAngle} />
        </div>
        <MatrixGrid cells={cells} size={52} />
        <p className="aq-formula">
          <SymbolHint meaning="Y：线性层输出激活，等价变换后保持不变。">Y</SymbolHint> = <SymbolHint meaning="X：输入激活。">X</SymbolHint><SymbolHint meaning="W：权重矩阵。">W</SymbolHint> = (<SymbolHint meaning="X：输入激活。">X</SymbolHint><SymbolHint meaning="A⁻¹：可逆仿射矩阵 A 的逆。">A⁻¹</SymbolHint>)(<SymbolHint meaning="A：可逆仿射变换矩阵。">A</SymbolHint><SymbolHint meaning="W：权重矩阵。">W</SymbolHint>)
        </p>
        <Feedback tone={tone}>{feedback}</Feedback>
        <p className="aq-note">误差为<b>示意映射</b>，论文以 block 输出 MSE 为准。</p>
      </div>
    </div>
  );
}