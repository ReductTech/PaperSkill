import { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, lerp, W } from './visual-core';

export const RepresentationSpace: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(35);
  const [align, setAlign] = useState(true);
  const points = useMemo(() => Array.from({ length: 18 }, (_, i) => ({ x: 110 + (i % 6) * 80 + (i % 2) * 12, y: 70 + Math.floor(i / 6) * 65 + (i % 3) * 6 })), []);
  const lossAt = (pct: number) => align ? 0.92 - pct * 0.0077 : 0.92 - pct * 0.0007;
  const curve = Array.from({ length: 11 }, (_, i) => `${750 + i * 27},${250 - (1 - lossAt(i * 10)) * 190}`).join(' ');
  const currentLoss = Math.max(0.12, lossAt(step));
  return <div>
    <svg className="ra-svg representation-svg" viewBox={`0 0 ${W} 320`} role="img" aria-label="表示空间概念投影和对齐损失示意曲线">
      <rect width={W} height="320" fill={C.bg} />
      <rect x="48" y="35" width="630" height="235" rx="14" fill="#fff" stroke={C.line} /><rect x="720" y="35" width="320" height="235" rx="14" fill="#fff" stroke={C.line} />
      <text x="68" y="61" fill={C.text} fontSize="16" fontWeight="700">概念表示投影</text><text x="740" y="61" fill={C.text} fontSize="16" fontWeight="700">对齐损失（教学示意）</text>
      <line x1="75" y1="245" x2="650" y2="245" stroke={C.line} /><line x1="75" y1="70" x2="75" y2="245" stroke={C.line} />
      {points.map((target, i) => { const start = { x: 390 + (i % 6) * 42, y: 65 + Math.floor(i / 6) * 72 }; const k = align ? step / 100 : step / 520; return <g key={i}><circle cx={target.x} cy={target.y} r="6" fill={C.blue} /><circle cx={lerp(start.x, target.x, k)} cy={lerp(start.y, target.y, k)} r="7" fill={align ? C.green : C.red} opacity=".78" /></g>; })}
      <circle cx="455" cy="51" r="5" fill={C.blue} /><text x="466" y="56" fill={C.muted} fontSize="13">AR 教师</text><circle cx="548" cy="51" r="5" fill={align ? C.green : C.red} /><text x="559" y="56" fill={C.muted} fontSize="13">DLM 学生</text>
      <line x1="748" y1="245" x2="1020" y2="245" stroke={C.line} /><line x1="748" y1="72" x2="748" y2="245" stroke={C.line} />
      <polyline points={curve} fill="none" stroke={align ? C.green : C.red} strokeWidth="5" />
      <line x1={750 + step * 2.7} y1="72" x2={750 + step * 2.7} y2="245" stroke={C.orange} strokeDasharray="5 5" />
      <circle cx={750 + step * 2.7} cy={250 - (1 - currentLoss) * 190} r="8" fill={C.orange} />
      <text x="760" y="292" fill={C.muted} fontSize="13">训练进度 →</text><text x="930" y="92" fill={align ? C.green : C.red} fontSize="30" fontWeight="700">L ≈ {currentLoss.toFixed(2)}</text>
    </svg>
    <div className="ctrl"><label htmlFor="projection-step">训练进度 <span className="val">{step}%</span></label><input id="projection-step" aria-label="表示空间训练进度" type="range" min="0" max="100" value={step} onChange={(event) => setStep(Number(event.target.value))} /></div>
    <div className="chip-row"><button type="button" className={`chip ${align ? 'selected' : ''}`} onClick={() => setAlign(true)}>有对齐</button><button type="button" className={`chip ${!align ? 'selected' : ''}`} onClick={() => setAlign(false)}>无对齐（反事实）</button></div>
    <div className={`feedback ${align && step > 75 ? 'good' : !align ? 'bad' : ''}`}>{align ? '学生点随训练靠近教师结构，示意损失同步下降。论文未报告真实 t-SNE/PCA 坐标或这条损失曲线。' : '关闭对齐后，教学投影保持分离；真实证据来自下游代码指标与消融。'}</div>
  </div>;
};
