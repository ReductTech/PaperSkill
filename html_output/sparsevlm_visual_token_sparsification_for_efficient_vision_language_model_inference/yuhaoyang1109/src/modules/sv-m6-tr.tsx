import React, { useState } from 'react';
import { C, Feedback, Guess, Seg, Swatch, Tag } from './sv-kit';
import { TABLE4 } from './sv-data';
import type { WidgetProps } from './registry';

// 6.2 表 4：回收（TR）消融。先猜，再看 GQA / POPE 四个档位的不回收 vs 回收。数值为论文实测（一组汇总结果）。

export function SvTr(_: WidgetProps) {
  const [bench, setBench] = useState<'GQA' | 'POPE'>('POPE');
  const d = TABLE4[bench];
  const lo = bench === 'GQA' ? 50 : 70;
  const hi = bench === 'GQA' ? 61 : 87;
  const gains = d.base.map((b, i) => d.tr[i] - b);
  const best = gains.indexOf(Math.max(...gains));
  return (
    <div className="sv-live sv-mod">
      <Guess
        item={{
          q: '回收被删 token，在哪个档位帮助最大？',
          options: [
            { value: '64', label: '64 个（删得最多）' },
            { value: '128', label: '128 个' },
            { value: '192', label: '192 个（删得最少）' },
          ],
          answer: '64',
          explain: '被删的越多，回收池里能补回的信息越多：POPE 在 64 档提升 4.7 个点，在 192 档只提升 0.1 个点。',
        }}
      />
      <div className="sv-row">
        <span className="sv-k">基准</span>
        <Seg label="基准" value={bench} onChange={setBench} options={[{ value: 'GQA', label: 'GQA' }, { value: 'POPE', label: 'POPE' }]} />
      </div>
      <div className="sv-tr-grid" role="img" aria-label={`表 4 ${bench}：${TABLE4.tokens.map((t, i) => `${t} 个 token 不回收 ${d.base[i]}、回收 ${d.tr[i]}`).join('；')}`}>
        {TABLE4.tokens.map((t, i) => (
          <div key={t} className={`sv-tr-col ${i === best ? 'is-best' : ''}`}>
            <div className="sv-tr-bars">
              {[
                { v: d.base[i], c: C.line2, k: '不回收' },
                { v: d.tr[i], c: C.green, k: '+TR' },
              ].map((b) => (
                <div key={b.k} className="sv-tr-bar" style={{ height: `${((b.v - lo) / (hi - lo)) * 100}%`, background: b.c }}>
                  <span>{b.v.toFixed(1)}</span>
                </div>
              ))}
            </div>
            <b>{t} 个</b>
            <span className={gains[i] >= 1 ? 'sv-tr-gain is-big' : 'sv-tr-gain'}>+{gains[i].toFixed(1)}</span>
          </div>
        ))}
      </div>
      <div className="sv-legend">
        <span>
          <Swatch color={C.line2} />
          不回收
        </span>
        <span>
          <Swatch color={C.green} />
          回收（+TR）
        </span>
        <span>
          纵轴从 {lo} 到 {hi}（不从 0 开始）
        </span>
      </div>
      <Feedback tone="ok" k={bench}>
        {bench}：四档平均 {d.avgBase.toFixed(1)} → {d.avgTr.toFixed(1)}（+{(d.avgTr - d.avgBase).toFixed(1)}）。档位越低提升越大；论文未交代重复运行次数和方差，192 档 +0.1 的差值无法判断是否超出评测波动。
      </Feedback>
      <p className="sv-small">
        <Tag kind="paper" /> 表 4（第 8 页），LLaVA-7B。正文同页写“TextVQA、POPE 平均提升 1.2%、7.2%”，与表 4 对不上，本模块只用表中数字。
      </p>
    </div>
  );
}
