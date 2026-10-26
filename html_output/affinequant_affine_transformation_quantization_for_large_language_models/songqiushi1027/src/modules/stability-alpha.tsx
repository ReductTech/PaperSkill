import { useState } from 'react';
import type { WidgetProps } from './registry';
import { fmt, Feedback } from './aqKit';
import { SymbolHint } from '../components/SymbolHint';

export function StabilityAlpha(_props: WidgetProps) {
  const [logAlpha, setLogAlpha] = useState(-2);
  const alpha = Math.pow(10, logAlpha);

  const zone = alpha < 0.003 ? 'degenerate' : alpha < 0.3 ? 'stable' : 'crash';
  const tone = zone === 'stable' ? 'green' : 'red';
  const feedback = zone === 'degenerate'
    ? 'α 过小：退化为 OmniQuant，收益消失'
    : zone === 'crash'
      ? 'α 过大：对角占优被破坏，训练崩溃'
      : 'α 适中：在保可逆前提下拿到更多收益';

  // 示意 PPL 曲线（log-α 横轴，非论文实测）
  const curve = [[-4, 0.62], [-3, 0.5], [-2, 0.34], [-1.5, 0.3], [-1, 0.38], [0, 0.95]] as const;
  const px = (lx: number) => 60 + ((lx + 4) / 4) * 540;
  const py = (loss: number) => 30 + (loss / 1.0) * 260;
  const d = curve.map(([lx, loss], i) => `${i ? 'L' : 'M'}${px(lx)} ${py(loss)}`).join(' ');
  const markerX = px(logAlpha);

  const zoneX = (lx: number) => px(lx);
  return (
    <div className="aq-layout aq-two">
      <div className="aq-panel grow">
        <div className="aq-heading">稳定因子 α 的敏感区间</div>
        <svg viewBox="0 0 640 340" role="img" aria-label={`α = ${fmt(alpha, 4)}，处于${zone === 'stable' ? '稳定' : '退化/崩溃'}区`}>
          <line x1="60" y1="30" x2="60" y2="296" stroke="#d7deea" strokeWidth="2" />
          <line x1="60" y1="296" x2="610" y2="296" stroke="#d7deea" strokeWidth="2" />
          <rect x={zoneX(-4)} y="30" width={zoneX(Math.log10(0.003)) - zoneX(-4)} height="266" fill="rgba(196,63,82,0.12)" />
          <rect x={zoneX(Math.log10(0.003))} y="30" width={zoneX(Math.log10(0.3)) - zoneX(Math.log10(0.003))} height="266" fill="rgba(34,141,92,0.14)" />
          <rect x={zoneX(Math.log10(0.3))} y="30" width={zoneX(0) - zoneX(Math.log10(0.3))} height="266" fill="rgba(196,63,82,0.12)" />
          <path d={d} fill="none" stroke="#27446e" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          <line x1={markerX} y1="30" x2={markerX} y2="296" stroke="#f07e47" strokeWidth="3" strokeDasharray="5 5" />
          <circle cx={markerX} cy={py(alpha < 0.003 ? 0.62 : alpha < 0.3 ? 0.34 : 0.95)} r="6" fill="#f07e47" />
          <text x="60" y="322" fontSize="17" fill="#68778f">α → 0</text>
          <text x="610" y="322" fontSize="17" textAnchor="end" fill="#68778f">α = 1</text>
          <text x="32" y="40" fontSize="17" fill="#68778f">PPL</text>
          <text x="200" y="52" fontSize="16" fill="#c43f52">退化</text>
          <text x="360" y="52" fontSize="16" fill="#228d5c">稳定</text>
          <text x="500" y="52" fontSize="16" fill="#c43f52">崩溃</text>
        </svg>
        <div className="aq-slider" style={{ gridTemplateColumns: '168px minmax(0,1fr) 120px' }}>
          <span><strong><SymbolHint meaning="α：稳定因子，控制渐进掩码中非对角元素的幅度；太小退化、太大会崩溃。">α</SymbolHint>（对数）</strong></span>
          <input type="range" min={-4} max={0} step={0.01} value={logAlpha} onChange={(e) => setLogAlpha(Number(e.target.value))} />
          <b>{fmt(alpha, 4)}</b>
        </div>
      </div>
      <div className="aq-panel">
        <div className="aq-heading">α 的代价与边界</div>
        <p className="aq-body">α 是<b>敏感超参</b>：</p>
        <p className="aq-body muted">α → 0 收敛到 OmniQuant；α 太大破坏对角占优 → LLaMA-7B 崩溃。</p>
        <Feedback tone={tone}>{feedback}</Feedback>
        <p className="aq-note"><b>适用边界</b>：排除 MLP 两个线性层之间的仿射变换；求逆用 float/double，存在数值误差；官方脚本 W4A4 用 <b>--sf 0.1</b>（LLaMA shift=0），与论文 α 集 {'{1e-2, 1e-3, 1e-4}'} 不完全一致。</p>
      </div>
    </div>
  );
}