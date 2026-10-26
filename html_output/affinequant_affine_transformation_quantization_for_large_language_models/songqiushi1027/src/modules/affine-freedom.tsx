import { useState } from 'react';
import type { WidgetProps } from './registry';
import { MatrixGrid, SegButton, Feedback } from './aqKit';
import type { CellSpec } from './aqKit';

export function AffineFreedom(_props: WidgetProps) {
  const [useScale, setUseScale] = useState(true);
  const [useShift, setUseShift] = useState(true);
  const [useRotate, setUseRotate] = useState(true);

  const enabled = (useScale ? 1 : 0) + (useShift ? 1 : 0) + (useRotate ? 1 : 0);
  const err = [0.85, 0.5, 0.25, 0.1][enabled];
  const freedom = (useScale ? 3 : 0) + (useRotate ? 3 : 0) + (useShift ? 3 : 0);

  const A: CellSpec[][] = [
    [
      { label: useScale ? 's₁' : '0', tone: 'green', on: useScale },
      { label: useRotate ? '−θ' : '0', tone: 'green', on: useRotate },
      { label: useRotate ? '−θ' : '0', tone: 'green', on: useRotate },
    ],
    [
      { label: useRotate ? 'θ' : '0', tone: 'green', on: useRotate },
      { label: useScale ? 's₂' : '0', tone: 'green', on: useScale },
      { label: useRotate ? '−θ' : '0', tone: 'green', on: useRotate },
    ],
    [
      { label: useRotate ? 'θ' : '0', tone: 'green', on: useRotate },
      { label: useRotate ? 'θ' : '0', tone: 'green', on: useRotate },
      { label: useScale ? 's₃' : '0', tone: 'green', on: useScale },
    ],
  ];
  const delta: CellSpec[][] = [[
    { label: useShift ? 'δ₁' : '0', tone: 'green', on: useShift },
    { label: useShift ? 'δ₂' : '0', tone: 'green', on: useShift },
    { label: useShift ? 'δ₃' : '0', tone: 'green', on: useShift },
  ]];

  const sc = useScale ? 1.22 : 1;
  const rot = useRotate ? 18 : 0;
  const sx = useShift ? 55 : 0;
  const sy = useShift ? -38 : 0;

  const feedback = enabled === 3
    ? '缩放＋平移＋旋转，自由度最高（9）'
    : `只用了仿射的一部分能力，自由度仅 ${freedom}`;
  const tone = enabled === 3 ? 'green' : 'blue';

  return (
    <div className="aq-layout aq-two">
      <div className="aq-panel grow">
        <svg viewBox="0 0 860 480" role="img" aria-label={`取景框：缩放${useScale ? '启用' : '关闭'}、平移${useShift ? '启用' : '关闭'}、旋转${useRotate ? '启用' : '关闭'}`}>
          <rect width="860" height="480" fill="#eef3f7" />
          <g stroke="#d7deea" strokeWidth="1" opacity="0.7">
            {Array.from({ length: 13 }).map((_, i) => <line key={`v${i}`} x1={i * 72} y1="0" x2={i * 72} y2="480" />)}
            {Array.from({ length: 8 }).map((_, i) => <line key={`h${i}`} x1="0" y1={i * 69} x2="860" y2={i * 69} />)}
          </g>
          <path d="M0 330 L200 215 L320 320 L460 185 L650 310 L860 260 L860 480 L0 480 Z" fill="#b7cfc9" />
          <path d="M0 382 L230 280 L400 372 L540 260 L860 382 L860 480 L0 480 Z" fill="#86a89f" />
          <g transform={`translate(430 270) rotate(${rot}) scale(${sc}) translate(-430 -270) translate(${sx} ${sy})`}>
            <rect x="260" y="150" width="340" height="260" fill="none" stroke={enabled === 3 ? '#228d5c' : '#27446e'} strokeWidth="5" />
            {[[260, 150], [600, 150], [260, 410], [600, 410]].map(([x, y]) => (
              <path key={`${x}-${y}`} d={`M${x} ${y - 18} V${y + 18} M${x - 18} ${y} H${x + 18}`} stroke="#f07e47" strokeWidth="5" />
            ))}
          </g>
          <text x="28" y="38" fontSize="22" fontWeight="700" fill="#33415a">被摄主体不变 · 取景框随启用项变换</text>
        </svg>
      </div>
      <div className="aq-panel" style={{ gap: 10 }}>
        <div className="aq-heading">仿射的三类自由度</div>
        <div className="aq-controls">
          <SegButton active={useScale} onClick={() => setUseScale(!useScale)}>缩放</SegButton>
          <SegButton active={useShift} onClick={() => setUseShift(!useShift)}>平移</SegButton>
          <SegButton active={useRotate} onClick={() => setUseRotate(!useRotate)}>旋转</SegButton>
        </div>
        <MatrixGrid cells={A} size={48} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="aq-body muted">平移向量 δ</span>
          <MatrixGrid cells={delta} size={48} />
        </div>
        <div className="aq-emphasis">{freedom} 自由度</div>
        <div style={{ height: 12, borderRadius: 999, background: '#eef2f7', overflow: 'hidden' }}>
          <div style={{ width: `${err * 100}%`, height: '100%', background: enabled === 3 ? '#228d5c' : '#f07e47', borderRadius: 999, transition: 'width 200ms ease' }} />
        </div>
        <Feedback tone={tone}>{feedback}</Feedback>
        <p className="aq-note">缩放=对角、旋转=反对称非对角、平移=δ 向量。</p>
      </div>
    </div>
  );
}