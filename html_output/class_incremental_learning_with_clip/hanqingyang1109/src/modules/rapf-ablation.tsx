import React, { useState } from 'react';
import { C, fmt } from './tailorKit';
import './tailor.css';

const STEPS = [
  { label: '基线：微调 + 高斯采样', v: 73.80, add: '起点' },
  { label: '随机挑配对做铰链', v: 74.08, add: '+0.28' },
  { label: '用文本特征挑邻居', v: 76.04, add: '+1.96' },
  { label: '参数融合（不分解）', v: 79.28, add: '+3.24' },
  { label: '矩阵分解（完整）', v: 80.23, add: '+0.95' },
];

/** p11：Table 5 的五级消融，每一级加了多少。 */
export function RapfAblation() {
  const [sel, setSel] = useState(2);
  const lo = 72;
  const hi = 82;
  const y = (v: number) => 400 - ((v - lo) / (hi - lo)) * 250;

  const s = STEPS[sel];
  const gain = sel === 0 ? 0 : STEPS[sel].v - STEPS[0].v;

  return (
    <div className="tailor-page">
      <div className="tailor-scene">
        <svg viewBox="0 0 900 560" role="img" aria-label={`第 ${sel + 1} 级消融，末次精度 ${s.v}`}>
          <rect x="0" y="0" width="900" height="560" fill={C.bg} />
          <path d="M70 410 H860" stroke={C.line} strokeWidth={2} />

          {STEPS.map((st, i) => {
            const x = 90 + i * 152;
            const on = i === sel;
            const h = 400 - y(st.v);
            return (
              <g key={st.label} role="button" tabIndex={0} aria-label={`${st.label}，${st.v}`} onClick={() => setSel(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSel(i);
                  }
                }}
                style={{ cursor: 'pointer' }}>
                <rect x={x} y={y(st.v)} width={124} height={h} rx={8}
                  fill={on ? C.green : i === 0 ? '#dfe6ee' : '#cfe4d8'}
                  stroke={on ? C.green : C.line} strokeWidth={on ? 3 : 1.5} opacity={on ? 0.95 : 0.8} />
                <text x={x + 62} y={y(st.v) - 14} textAnchor="middle" fontSize={21} fontWeight={700} fill={on ? C.green : C.ink}>
                  {fmt(st.v)}
                </text>
                <text x={x + 62} y={436} textAnchor="middle" fontSize={17} fill={C.muted}>
                  第 {i + 1} 级
                </text>
              </g>
            );
          })}

          <path d={`M152 ${y(STEPS[0].v) - 40} Q600 ${y(STEPS[2].v) - 90} 700 ${y(STEPS[4].v) - 40}`} fill="none" stroke={C.orange} strokeWidth={2} strokeDasharray="6 6" opacity={0.7} />
          <text x={640} y={84} fontSize={19} fill={C.orange}>
            完整方法比基线高 6.43 个百分点
          </text>

          <g>
            <rect x={70} y={464} width={790} height={64} rx={14} fill="#fffdf7" stroke={C.line} strokeWidth={2} />
            <text x={92} y={504} fontSize={20} fill={C.ink}>
              第 {sel + 1} 级：{s.label}
            </text>
          </g>

          <text x={24} y={550} fontSize={19} fill={C.muted}>
            点任一级查看它新增了什么（ImageNet100 B0 Inc10，Last 精度）
          </text>
        </svg>
      </div>

      <aside className="tailor-side">
        <div className="tailor-panel">
          <h4>消融怎么读</h4>
          <p style={{ margin: 0 }}>消融把“选邻居”和“怎么融合”拆开，分别看贡献。</p>
        </div>
        <div className="tailor-kv">
          <span>本级增量</span>
          <b>{s.add}</b>
          <span>相对基线</span>
          <b style={{ color: gain > 0 ? C.green : C.muted }}>{gain > 0 ? '+' + fmt(gain) : '—'}</b>
        </div>
        <div className="tailor-feedback plain">
          {sel === 1
            ? '随机挑配对几乎等于没做：说明关键在于“挑对邻居”，不是“加铰链”。'
            : sel === 2
            ? '换成文本特征挑配对，只这一步就涨了近 2 个点。'
            : sel === 3
            ? '参数融合一次加了 3.24 个点，是单项贡献最大的一步。'
            : sel === 4
            ? '矩阵分解再加 0.95：先对齐再融合才拿满。'
            : '基线只做微调 + 采样，忘得最多。'}
        </div>
        <div className="tailor-src">Table 5（p.12）。SG=高斯采样，PF=参数融合，MD=矩阵分解。</div>
      </aside>
    </div>
  );
}
