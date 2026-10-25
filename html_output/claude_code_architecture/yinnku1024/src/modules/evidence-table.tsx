import React from 'react';
import { RW } from './kit';

const CLAIMS = [
  { claim: '单二进制跑在 Bun 上', evidence: '文档明写 not Node.js', level: 3, use: '可直接引用' },
  { claim: '引擎约 46K 行', evidence: '文档给出的量级', level: 2, use: '只当规模，不当精度' },
  { claim: '工具 = 四件套', evidence: '文档 + Tool.ts 类型', level: 3, use: '可直接引用' },
  { claim: '每个工具声明并发安全', evidence: '文档给出方法名', level: 3, use: '可 grep 验证' },
  { claim: '九个特性开关', evidence: '文档列名，代码可搜', level: 2, use: '随版本增减' },
];

const LEVEL = [
  { text: '弱', color: RW.red, dots: 1 },
  { text: '中', color: RW.orange, dots: 2 },
  { text: '强', color: RW.green, dots: 3 },
];

/* 同一份文档里的主张，可验证程度并不一样。分开之后，才知道哪句能直接用。 */
export function EvidenceTable() {
  return (
    <div className="rw" style={{ gridTemplateRows: 'minmax(0, 1fr) auto' }}>
      <div className="rw-card rw-card--plain" style={{ padding: '4px 8px' }}>
        <table className="rw-table rw-table--fill">
          <colgroup>
            <col style={{ width: '28%' }} /><col style={{ width: '28%' }} />
            <col style={{ width: '14%' }} /><col style={{ width: '30%' }} />
          </colgroup>
          <thead>
            <tr><th>主张</th><th>文档依据</th><th>强度</th><th>怎么用</th></tr>
          </thead>
          <tbody>
            {CLAIMS.map(item => {
              const level = LEVEL[item.level - 1];
              return (
                <tr key={item.claim}>
                  <th scope="row">{item.claim}</th>
                  <td style={{ color: RW.muted }}>{item.evidence}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: level.color }}>
                      <span aria-hidden="true" style={{ letterSpacing: 2 }}>
                        {'●'.repeat(level.dots)}{'○'.repeat(3 - level.dots)}
                      </span>
                      <b>{level.text}</b>
                    </span>
                  </td>
                  <td style={{ fontSize: 28 }}>{item.use}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rw-band" data-tone="paper">
        <span>
          未纳入：性能、内存、构建耗时——文档没给。
          <strong> 局限：社区整理、非官方、未标版本。</strong>
        </span>
      </div>
    </div>
  );
}
