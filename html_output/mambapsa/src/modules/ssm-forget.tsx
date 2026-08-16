import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// 没有 HiPPO 的困境：朴素递推（固定保留率 Ā）的记忆衰减演示。
// 一个 token 读入后，每往后一步按 Ā 衰减：走 t 步后它在隐状态里的痕迹 = Ā^t。
// 两个维度：每步保留率 Ā（0.3–0.99）与序列长度 N（10–500）——常数衰减下，长序列必然失忆。

const W = 560, H = 190;
const PAD_L = 36, PAD_R = 12, PAD_T = 16, PAD_B = 28;
const IW = W - PAD_L - PAD_R, IH = H - PAD_T - PAD_B;

const fmt = (v: number) => {
  const s = v.toFixed(3);
  return s.replace(/\.?0+$/, '');
};
const pct = (v: number) => {
  const p = v * 100;
  if (v < 1e-9) return '≈ 0%';
  if (p >= 10) return p.toFixed(1) + '%';
  return p.toFixed(2) + '%';
};

export const SsmForget: React.FC<WidgetProps> = () => {
  const [a, setA] = useState(0.5);
  const [n, setN] = useState(100);

  const STEPS = n;
  const X = (t: number) => PAD_L + (t / STEPS) * IW;
  const Y = (h: number) => PAD_T + (1 - h) * IH;

  const linePts: string[] = [];
  const areaPts: string[] = [];
  for (let i = 0; i <= STEPS; i++) {
    const h = Math.pow(a, i);
    const x = X(i).toFixed(1);
    const y = Y(h).toFixed(1);
    linePts.push(`${x},${y}`);
    if (i > 0) areaPts.push(`L${x},${y}`);
  }
  const path = 'M' + linePts.join(' L');
  const area = `M${X(0).toFixed(1)},${Y(0).toFixed(1)} ${areaPts.join(' ')} L${X(STEPS).toFixed(1)},${Y(0).toFixed(1)} Z`;

  const halfLife = Math.log(0.5) / Math.log(a);
  const remainN = Math.pow(a, n);
  const hl = Math.min(halfLife, STEPS);

  return (
    <div className="forget">
      <p className="forget-lead">
        一个 token 的信息读入后，往后每一步都按保留率 <b>Ā</b> 衰减一次：走 t 步后，它在隐状态里的痕迹还剩
        <b> Ā^t</b>。先看看这个衰减有多快、序列一长又会怎样。
      </p>

      <div className="ctrl">
        <label>
          每步保留率 Ā <span className="val">{fmt(a)}</span>
        </label>
        <input type="range" min={0.3} max={0.99} step={0.01} value={a} onChange={(e) => setA(Number(e.target.value))} />
      </div>
      <div className="ctrl">
        <label>
          序列长度 N <span className="val">{n}</span>
        </label>
        <input type="range" min={10} max={500} step={10} value={n} onChange={(e) => setN(Number(e.target.value))} />
      </div>

      <div className="forget-svg-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="记忆衰减曲线 h = Ā^t">
          {[0.25, 0.5, 0.75, 1].map((g) => (
            <line key={g} x1={PAD_L} y1={Y(g)} x2={W - PAD_R} y2={Y(g)} stroke="#d7deea" strokeWidth="1" />
          ))}
          <line x1={PAD_L} y1={Y(0)} x2={W - PAD_R} y2={Y(0)} stroke="#d7deea" strokeWidth="1.5" />
          <line x1={PAD_L} y1={PAD_T - 4} x2={PAD_L} y2={Y(0)} stroke="#d7deea" strokeWidth="1.5" />
          <path d={area} fill="rgba(39,68,110,0.08)" />
          <path d={path} fill="none" stroke="#27446e" strokeWidth="2.4" strokeLinecap="round" />
          {hl >= 1 && hl <= STEPS ? (
            <g>
              <line x1={X(hl)} y1={PAD_T - 4} x2={X(hl)} y2={Y(0)} stroke="#d97706" strokeWidth="1.4" strokeDasharray="4 3" />
              <circle cx={X(hl)} cy={Y(0.5)} r="4" fill="#d97706" />
              <text x={X(hl)} y={Y(0.5) - 8} textAnchor="middle" fontSize="11" fill="#d97706">
                半衰期 ≈ {halfLife.toFixed(0)} 步
              </text>
            </g>
          ) : null}
          <text x={PAD_L + 2} y={PAD_T - 6} fontSize="11" fill="#68778f">剩余记忆 h</text>
          <text x={W - PAD_R - 8} y={H - 6} fontSize="11" fill="#68778f">步数 t →</text>
          {[0, Math.round(STEPS / 2), STEPS].map((tk) => (
            <text key={tk} x={X(tk)} y={Y(0) + 14} textAnchor="middle" fontSize="10" fill="#68778f">{tk}</text>
          ))}
        </svg>
      </div>

      <div className="forget-readouts">
        <span className="forget-readout highlight">
          走完 N={n} 步，开头的信息还剩 <b>{pct(remainN)}</b>
        </span>
        <span className="forget-readout">半衰期 ≈ <b>{Math.max(1, Math.round(halfLife))}</b> 步</span>
        <span className="forget-readout">10 步后剩 <b>{pct(Math.pow(a, 10))}</b></span>
      </div>

      <div className={`feedback ${remainN < 0.05 ? 'bad' : ''}`}>
        常数衰减的宿命：无论 Ā 取多接近 1，只要序列够长，开头的信息终究归零（0.99^500 ≈ 0.7%）；若把 Ā 抬到 ≥1，又走向另一极——记忆逐步放大、数值爆炸。随机初始化的朴素递推（类似 RNN）就这样困在「遗忘」与「爆炸」之间，长程信息留不住。
      </div>
      <p className="forget-note">
        这不是模型「不努力」，而是 A 的结构决定的。下一节 HiPPO 用一组正交多项式给 A 一个能稳定保留长程记忆的结构——困境的解法。
      </p>
    </div>
  );
};
