import React, { useState } from 'react';
import { C, Board, Cello, Fader, PageFrame } from './studioKit';
import './studio.css';

const TEXT = [0.55, 0.3, 0.15];
const VIS = [0.1, 0.25, 0.65];
const NAMES = ['旧类 A', '旧类 B', '新类 C'];

const softmax = (v: number[]) => {
  const m = Math.max(...v);
  const e = v.map((x) => Math.exp(x - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((x) => x / s);
};

/** p7：合轨——pre = 文本分数 + β · softmax(W_vᵀx)，β 是两路的推子。 */
export function MgFuseBeta() {
  const [beta, setBeta] = useState(4);
  const pre = TEXT.map((t, i) => t + beta * VIS[i]);
  const probs = softmax(pre.map((v) => v * 2.2));
  const top = probs.indexOf(Math.max(...probs));
  const tone = beta < 1 ? 'bad' : beta <= 5.5 ? 'ok' : 'warn';
  const feedback =
    beta < 1
      ? '只听参考轨：新类被间隙压住，分数低，判错。'
      : beta <= 5.5
      ? '两路合起来：新类被救回，旧类还稳——β=4 是论文默认。'
      : '近场轨盖过参考轨：新类分数虚高，旧类开始被抢。';

  return (
    <PageFrame
      scene={
        <svg viewBox="0 0 900 560" role="img" aria-label={`β 为 ${beta}，最终判为 ${NAMES[top]}`}>
          <rect x="0" y="0" width="900" height="560" fill={C.bg} />
          <rect x="0" y="420" width="900" height="140" fill={C.light} opacity="0.4" />
          <path d="M0 420 H900" stroke={C.wood} strokeWidth="4" opacity="0.45" />

          <Board x={40} y={120} w={300} h={280} />
          <Fader x={100} y={168} h={150} t={0.55} color={C.blue} label="参考轨" />
          <Fader x={180} y={168} h={150} t={beta / 8} color={C.green} label="近场轨" />
          <Cello x={272} y={250} s={0.4} />

          <text x={250} y={110} textAnchor="middle" fontSize={20} fill={C.muted}>调音台：两路推子</text>

          <g>
            <text x={470} y={96} fontSize={22} fill={C.ink}>三类的最终分数</text>
            {NAMES.map((n, i) => {
              const w = Math.round(probs[i] * 400);
              const isTop = i === top;
              return (
                <g key={n}>
                  <text x={470} y={148 + i * 84} fontSize={21} fill={C.muted}>{n}</text>
                  <rect x={560} y={128 + i * 84} width={330} height={28} rx={8} fill="#eef1f6" />
                  <rect x={560} y={128 + i * 84} width={w} height={28} rx={8} fill={isTop ? (i === 2 ? C.green : C.blue) : C.muted} opacity={isTop ? 1 : 0.45} />
                  <text x={900} y={149 + i * 84} textAnchor="end" fontSize={20} fill={isTop ? C.ink : C.muted}>
                    {(probs[i] * 100).toFixed(1)}%
                  </text>
                </g>
              );
            })}
            <text x={470} y={430} fontSize={22} fill={C.ink}>
              判为：<tspan fontWeight={700} fill={top === 2 ? C.green : C.red}>{NAMES[top]}</tspan>
            </text>
            <text x={470} y={470} fontSize={19} fill={C.muted}>
              pre(x) = f_clip(x,t) + β · softmax(W_vᵀx)，β = {beta}
            </text>
          </g>

          <text x={24} y={40} fontSize={21} fill={C.muted}>拖动 β：从只信参考轨，到两路互补，再到近场轨独大</text>
        </svg>
      }
      side={
        <>
          <div className="studio-panel">
            <h4>为什么两路要相加</h4>
            <p style={{ margin: 0 }}>
              参考轨给的是“和所有类名的相似度”，但它被间隙压住，新类吃亏；近场轨在视觉空间里直接算，不受这个限制。两路相加就是用一路的强项补另一路的短板。
            </p>
          </div>
          <div className={`studio-feedback ${tone}`}>{feedback}</div>
          <div className="studio-kv">
            <span>文本分数</span><b>{TEXT.map((v) => v.toFixed(2)).join(' / ')}</b>
            <span>视觉分数</span><b>{VIS.map((v) => v.toFixed(2)).join(' / ')}</b>
            <span>β</span><b>{beta}</b>
          </div>
          <label className="studio-muted" htmlFor="beta">合轨权重 β（默认 4）</label>
          <input id="beta" className="studio-slider" type="range" min={0} max={8} step={0.5} value={beta} onChange={(e) => setBeta(Number(e.target.value))} />
          <div className="studio-src">
            Eq.(5) 与 §5.1（β=4）。三类分数为教学玩具值，用于显示“相加后排序如何变”，不是论文实验数据；
            β 的敏感性分析在补充材料，正文未展开。
          </div>
        </>
      }
    />
  );
}
