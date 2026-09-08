import React from 'react';
import type { WidgetProps } from './registry';

const rows = [
  { name: 'Semantic Kernel', retention: 62, affiliation: 41.6 },
  { name: 'Microsoft Agent Framework', retention: 58, affiliation: 58.4 },
  { name: 'Pydantic-AI', retention: 46, affiliation: 14.8 },
  { name: 'LangFlow', retention: 46, affiliation: 7.4 },
  { name: 'LangChain', retention: 35, affiliation: 1.2 },
  { name: 'AutoGPT', retention: 30, affiliation: 1.0 },
];

export const RetentionContextTable: React.FC<WidgetProps> = () => (
  <div className="retention-context">
    <div className="retention-table-note">Day 30 为 Figure 10 约读值；母组织关联比例来自 Appendix C。</div>
    <div className="retention-table-wrap">
      <table className="retention-context-table">
        <thead>
          <tr>
            <th>框架</th>
            <th>Day 30 留存比例</th>
            <th>母组织人数占比</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <th scope="row">{row.name}</th>
              <td>
                <div className="retention-metric retention-rate">
                  <span style={{ width: `${row.retention}%` }} />
                  <b>约 {row.retention}%</b>
                </div>
              </td>
              <td>
                <div className="retention-metric affiliation-rate">
                  <span style={{ width: `${row.affiliation}%` }} />
                  <b>{row.affiliation.toFixed(1)}%</b>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="retention-context-conclusion">
      <b>结论</b>
      <span>高留存既可能来自社区黏性，也可能来自公司协调；选型时应与母组织关联比例一起判断。</span>
    </div>
  </div>
);

export default RetentionContextTable;
