import React from 'react';
import { INK } from './kit';

const CLAIMS = [
  { claim: '.map 随 npm 包发布', evidence: '包内容 + 当事人确认', level: 3, use: '可直接引用' },
  { claim: 'KAIROS 是完整的 24/7 模式', evidence: '源码字面量 + 44 个开关', level: 2, use: '引机制，不引路线图' },
  { claim: '假工具能削弱蒸馏', evidence: '注入点存在，效果未测', level: 2, use: '当设计思路，不下效果结论' },
  { claim: 'cch 由原生层生成', evidence: '代码线索 + 编译期开关', level: 2, use: '可能未在所有构建启用' },
  { claim: '一小时内可绕过', evidence: '作者估计', level: 1, use: '需独立复现' },
];

const LEVEL = [
  { text: '弱', color: INK.red, dots: 1 },
  { text: '中', color: INK.orange, dots: 2 },
  { text: '强', color: INK.green, dots: 3 },
];

/* 同一篇文章里的证据强度并不相同。把"能直接引用"和"只能当线索"分开，
   是这页唯一要做的事，也是后续所有讨论的前提。 */
export function EvidenceStrength() {
  return (
    <div className="ps" style={{ gridTemplateRows: 'minmax(0, 1fr) auto' }}>
      <div className="ps-card ps-card--plain" style={{ padding: '6px 10px' }}>
        <table className="ps-table ps-table--fill">
          <colgroup>
            <col style={{ width: '27%' }} /><col style={{ width: '27%' }} />
            <col style={{ width: '16%' }} /><col style={{ width: '30%' }} />
          </colgroup>
          <thead>
            <tr><th>主张</th><th>证据</th><th>强度</th><th>怎么用</th></tr>
          </thead>
          <tbody>
            {CLAIMS.map(item => {
              const level = LEVEL[item.level - 1];
              return (
                <tr key={item.claim}>
                  <th scope="row">{item.claim}</th>
                  <td style={{ color: INK.muted }}>{item.evidence}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: level.color }}>
                      <span aria-hidden="true" style={{ letterSpacing: 2 }}>
                        {'●'.repeat(level.dots)}{'○'.repeat(3 - level.dots)}
                      </span>
                      <b>{level.text}</b>
                    </span>
                  </td>
                  <td>{item.use}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="ps-band" data-tone="paper">
        <span>
          未纳入：型号对应（社区推测）、44 与 20+ 的精确口径（未公开）。
          <strong> 共同局限：二手分析、单一样本、没有对照实验。</strong>
        </span>
      </div>
    </div>
  );
}
