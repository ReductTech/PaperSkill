import React, { useState } from 'react';
import { C, Board, PageFrame } from './studioKit';
import './studio.css';

type Method = 'proof' | 'rapf' | 'clap' | 'moe' | 'magmax' | 'ours';
const DATA: Record<Method, { name: string; params: number; note: string }> = {
  proof: { name: 'PROOF', params: 13.35, note: '回放（DR），参数量大。' },
  rapf: { name: 'RAPF', params: 0.26, note: '参数最少，但每个类要存协方差，100 类约 26M。' },
  clap: { name: 'CLAP', params: 9.45, note: '回放（DR）。' },
  moe: { name: 'MOE4CL', params: 86.18, note: '专家混合，参数最重。' },
  magmax: { name: 'MagMax', params: 1.31, note: '任务向量合并。' },
  ours: { name: 'MG-CLIP', params: 0.54, note: '无回放缓存，额外计算只在首任务每轮一次前向。' },
};

const LIMITS = [
  'ImageNet-100 上低于用回放的 RAPF / CLAP（78.38 vs 80.23 / 79.16）：说法只能是“非回放里最好”。',
  'α=10%、β=4、3 epoch 都是默认设定，不是跨数据集最优；敏感性在补充材料。',
  '只用了 LoRA（key/value，秩 8），没有专门的损失项或参数约束；作者把与其他 CL 方法结合列为未来工作。',
];

/** p12：代价与边界——参数量（Fig.5）与作者自述的适用限制（§6）。 */
export function MgCostLimits() {
  const [m, setM] = useState<Method>('ours');
  const d = DATA[m];
  const maxP = 90;
  const tone = m === 'ours' ? 'ok' : m === 'rapf' ? 'warn' : 'plain';
  const feedback =
    m === 'ours'
      ? '0.54M，没有回放缓存；代价只在首任务每轮多一次前向（不含反向）。'
      : m === 'rapf'
      ? '参数更少，但存储随类数平方增长：100 类约 26M。'
      : `${d.name}：${d.params}M 可学习参数。${d.note}`;

  return (
    <PageFrame
      scene={
        <svg viewBox="0 0 900 560" role="img" aria-label={`${d.name} 的可学习参数 ${d.params}M`}>
          <rect x="0" y="0" width="900" height="560" fill={C.bg} />
          <Board x={40} y={80} w={820} h={250} />
          <text x={70} y={62} fontSize={20} fill={C.muted}>CIFAR-100 上的可学习参数（Million，越低越好）</text>

          {(Object.keys(DATA) as Method[]).map((k, i) => {
            const item = DATA[k];
            const active = k === m;
            const w = Math.max(6, (item.params / maxP) * 620);
            return (
              <g key={k} opacity={active ? 1 : 0.5}>
                <text x={80} y={136 + i * 36} fontSize={19} fill={active ? C.ink : C.muted} fontWeight={active ? 700 : 400}>
                  {item.name}
                </text>
                <rect x={230} y={118 + i * 36} width={620} height={22} rx={6} fill="#eef1f6" />
                <rect x={230} y={118 + i * 36} width={w} height={22} rx={6} fill={active ? (k === 'ours' ? C.green : C.blue) : C.muted} />
                <text x={860} y={136 + i * 36} textAnchor="end" fontSize={19} fill={active ? C.ink : C.muted}>
                  {item.params}
                </text>
              </g>
            );
          })}

          <g>
            <text x={70} y={382} fontSize={22} fill={C.ink} fontWeight={700}>边界</text>
            {LIMITS.map((t, i) => (
              <text key={i} x={70} y={420 + i * 46} fontSize={18} fill={C.muted}>
                · {t.length > 62 ? `${t.slice(0, 62)}…` : t}
              </text>
            ))}
          </g>

          <text x={24} y={530} fontSize={21} fill={C.muted}>选一个方法：参数量的差距，不等于总开销的差距</text>
        </svg>
      }
      side={
        <>
          <div className="studio-row">
            {(Object.keys(DATA) as Method[]).map((k) => (
              <button key={k} className={`studio-btn ${m === k ? 'is-on' : ''}`} onClick={() => setM(k)} aria-pressed={m === k}>
                {DATA[k].name}
              </button>
            ))}
          </div>
          <div className={`studio-feedback ${tone}`}>{feedback}</div>
          <div className="studio-kv">
            <span>可学习参数</span><b>{d.params}M</b>
            <span>回放</span><b>{m === 'rapf' || m === 'clap' || m === 'proof' ? '需要' : '不需要'}</b>
          </div>
          <div className="studio-panel">
            <h4>作者承认的局限</h4>
            <p style={{ margin: 0 }}>
              只考虑了 LoRA 这一种微调方式；没有设计专门的损失或参数约束来抑制遗忘；未来才与其他持续学习方法、蒸馏策略结合。
            </p>
          </div>
          <div className="studio-src">
            Fig.5 与 §5.4 给出参数量；§6 Limitations 给出作者自述边界。RAPF 的 26M 指按类存协方差的存储开销（nd²），
            与“可学习参数”不是同一口径。
          </div>
        </>
      }
    />
  );
}
