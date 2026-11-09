import React, { useState } from 'react';
import { C } from './tailorKit';
import './tailor.css';

const CARDS = [
  {
    key: 'same',
    title: '风格统一的数据',
    verdict: '适用',
    tone: C.green,
    detail: 'CIFAR100、ImageNet100 上多数增量设置领先，方法的主场。',
    source: 'Table 1–2；p.9–10',
  },
  {
    key: 'style',
    title: '风格差异大的数据',
    verdict: '幅度更小',
    tone: C.orange,
    detail: '领先幅度小于 CIFAR100、ImageNet100（按表计算）。',
    source: 'Table 1–3：ImageNet-R +2.4 点，ImageNet100 +4.2 点；原文未解释',
  },
  {
    key: 'text',
    title: '没有可靠的类名',
    verdict: '不适用',
    tone: C.red,
    detail: '整个方法靠文本特征找邻居；没有文本编码器或类别名不可信时，前提就不成立。',
    source: 'Eq.(3)(4)；p.6',
  },
  {
    key: 'alpha',
    title: '阈值要人来定',
    verdict: '已知局限',
    tone: C.orange,
    detail: 'α 全篇固定 0.65，作者自己把“手工选阈值”列为局限，并提出未来做自适应。',
    source: 'p.14 Sec.6',
  },
];

/** p12：什么情况下该用、什么时候别用。 */
export function RapfLimits() {
  const [sel, setSel] = useState(0);
  const c = CARDS[sel];

  return (
    <div className="tailor-page">
      <div className="tailor-scene">
        <svg viewBox="0 0 900 560" role="img" aria-label={`条件：${c.title}，结论：${c.verdict}`}>
          <rect x="0" y="0" width="900" height="560" fill={C.bg} />

          {CARDS.map((card, i) => {
            const x = 40 + i * 212;
            const on = i === sel;
            return (
              <g key={card.key} role="button" tabIndex={0} aria-label={card.title} onClick={() => setSel(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSel(i);
                  }
                }}
                style={{ cursor: 'pointer' }}>
                <rect x={x} y={110} width={196} height={280} rx={16} fill="#ffffff"
                  stroke={on ? card.tone : C.line} strokeWidth={on ? 4 : 2} />
                <circle cx={x + 98} cy={168} r={26} fill={card.tone} opacity={0.16} />
                <circle cx={x + 98} cy={168} r={10} fill={card.tone} />
                <text x={x + 98} y={232} textAnchor="middle" fontSize={21} fill={C.ink} fontWeight={700}>
                  {card.title}
                </text>
                <text x={x + 98} y={282} textAnchor="middle" fontSize={22} fill={card.tone} fontWeight={700}>
                  {card.verdict}
                </text>
                <text x={x + 98} y={342} textAnchor="middle" fontSize={17} fill={C.muted}>
                  点开看依据
                </text>
              </g>
            );
          })}

          <g>
            <rect x={40} y={396} width={820} height={122} rx={16} fill="#fffdf7" stroke={C.line} strokeWidth={2} />
            <text x={64} y={436} fontSize={21} fill={C.ink}>
              {c.detail}
            </text>
            <text x={64} y={502} fontSize={19} fill={C.muted}>
              依据：{c.source}
            </text>
          </g>

          <text x={24} y={544} fontSize={19} fill={C.muted}>
            点一张条件卡，看这条边界成不成立
          </text>
        </svg>
      </div>

      <aside className="tailor-side">
        <div className="tailor-panel">
          <h4>前提不成立时</h4>
          <p style={{ margin: 0 }}>方法的每一步都依赖类名文本，离开这个前提就没有邻居可找。</p>
        </div>
        <div className="tailor-kv">
          <span>代价</span>
          <b>只加一层线性 adapter</b>
          <span>可学参数</span>
          <b>最少（Fig.4）</b>
        </div>
        <div className="tailor-feedback plain">
          能力上限也来自同一处：只改一层线性映射，遇到需要改骨干的任务就够不着。
        </div>
        <div className="tailor-src">Fig.4（p.12）；p.3 贡献段。</div>
      </aside>
    </div>
  );
}
