import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { SegButton, Feedback } from './obrKit';

// ch1：为什么“加稀疏”比“继续降 bit”更好。
// 三条曲线为示意（诚实标注，非论文实测）：单一技术逼近极限时精度崩塌，联合 OBR 能再榨出额外压缩。
type Mode = 'quant' | 'prune' | 'joint';
const MODES: { id: Mode; label: string; color: string }[] = [
  { id: 'quant', label: '只量化', color: '#c43f52' },
  { id: 'prune', label: '只剪枝', color: '#f07e47' },
  { id: 'joint', label: '联合 OBR', color: '#228d5c' },
];

const W = 760, H = 480, L = 64, R = 30, T = 36, B = 60;
const plotW = W - L - R, plotH = H - T - B;
function q(x: number, mode: Mode): number {
  if (mode === 'quant') return 1 - 0.12 * x - 0.88 * Math.pow(x, 6);
  if (mode === 'prune') return 1 - 0.22 * x - 0.78 * Math.pow(x, 5);
  return 1 - 0.05 * x - 0.32 * Math.pow(x, 7);
}
function pathFor(mode: Mode): string {
  const pts: string[] = [];
  for (let i = 0; i <= 60; i += 1) {
    const x = i / 60;
    const y = q(x, mode);
    const px = L + x * plotW;
    const py = T + (1 - y) * plotH;
    pts.push(`${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`);
  }
  return pts.join(' ');
}

const TIPS: Record<Mode, string> = {
  quant: '只量化：bit 一路降到 sub-4bit 时精度崩塌——单一技术已逼近极限。',
  prune: '只剪枝：稀疏率越高精度越差，高稀疏下同样崩盘。',
  joint: '联合 OBR：同样压缩率下精度更高，两种正交技术“再榨”出额外收益。',
};

export function MotiveCurve(_props: WidgetProps) {
  const [mode, setMode] = useState<Mode>('joint');
  const active = MODES.find((m) => m.id === mode)!;
  return (
    <div className="obr-layout obr-two">
      <div className="obr-panel obr-chart-panel">
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="精度随压缩率变化的示意曲线">
          <g>
            <line x1={L} y1={T + plotH} x2={W - R} y2={T + plotH} stroke="#d7deea" strokeWidth={2} />
            <line x1={L} y1={T} x2={L} y2={T + plotH} stroke="#d7deea" strokeWidth={2} />
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <text key={t} x={L + t * plotW} y={T + plotH + 34} textAnchor="middle" fontSize={22} fill="#68778f">
                {t === 0 ? '低' : t === 1 ? '高' : ''}
              </text>
            ))}
            <text x={L - 14} y={T + plotH + 34} textAnchor="end" fontSize={22} fill="#68778f">压缩率</text>
            <text x={20} y={T + 14} fontSize={22} fill="#68778f">精度</text>
            <text x={W - R} y={T - 8} textAnchor="end" fontSize={22} fill="#68778f">高</text>
            <text x={W - R} y={T + plotH - 6} textAnchor="end" fontSize={22} fill="#68778f">低</text>
            {MODES.map((m) => (
              <path key={m.id} d={pathFor(m.id)} fill="none" stroke={m.color}
                strokeWidth={mode === m.id ? 5 : 2.5} opacity={mode === m.id ? 1 : 0.35}
                strokeLinecap="round" />
            ))}
            <line x1={L} y1={T + 0.18 * plotH} x2={W - R} y2={T + 0.18 * plotH}
              stroke="#9aa7ba" strokeWidth={1.5} strokeDasharray="6 6" />
            <text x={W - R} y={T + 0.18 * plotH - 8} textAnchor="end" fontSize={20} fill="#9aa7ba">精度崩塌区</text>
          </g>
        </svg>
        <div className="obr-note">曲线为示意趋势，非论文实测；真实对比见论文 Fig. 1(a)。</div>
      </div>
      <div className="obr-panel">
        <div className="obr-heading">单一技术 vs 联合压缩</div>
        <div className="obr-controls">
          {MODES.map((m) => (
            <SegButton key={m.id} active={mode === m.id} onClick={() => setMode(m.id)}>{m.label}</SegButton>
          ))}
        </div>
        <p className="obr-body">{TIPS[mode]}</p>
        <div className="obr-legend">
          {MODES.map((m) => (
            <span key={m.id}><i className="obr-dot" style={{ background: m.color }} />{m.label}</span>
          ))}
        </div>
        <Feedback tone={mode === 'joint' ? 'green' : 'red'}>{active.label}：{mode === 'joint' ? '联合压缩在更高压缩率下仍保持精度' : '单一技术已逼近极限'}</Feedback>
        <p className="obr-body muted">论文数据：QuaRot 的 W4A4KV4 Llama2-7B 中平均天然存在 14.28% 非结构化稀疏，说明低比特与稀疏本就共存。</p>
      </div>
    </div>
  );
}
