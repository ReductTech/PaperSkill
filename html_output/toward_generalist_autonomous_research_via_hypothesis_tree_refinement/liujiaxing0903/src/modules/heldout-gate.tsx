import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Rule = 'dev' | 'test';

const CANDIDATES = [
  { id: 'claude', name: 'Claude Code', dev: 75.0, test: 71.7 },
  { id: 'arbor', name: 'Arbor', dev: 72.22, test: 77.36 },
];

export const HeldoutGate: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [rule, setRule] = useState<Rule>('dev');
  const selected = rule === 'dev' ? CANDIDATES[0] : CANDIDATES[1];
  const valid = rule === 'test';

  return (
    <div data-widget={`${chapterId}-${moduleId}`}>
      <div role="group" aria-label="选择候选准入规则" className="ctrl">
        <button type="button" aria-pressed={rule === 'dev'} onClick={() => setRule('dev')}>
          按开发分排序
        </button>
        <button type="button" aria-pressed={rule === 'test'} onClick={() => setRule('test')}>
          按留出分排序
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 430 }}>
          <caption style={{ textAlign: 'left', marginBottom: 8 }}>
            Table 2 · Terminal-Bench 2.0：两个系统在开发与留出评估上的排序相反
          </caption>
          <thead>
            <tr>
              <th scope="col" style={{ textAlign: 'left', padding: 10 }}>系统</th>
              <th scope="col" style={{ textAlign: 'right', padding: 10 }}>开发分</th>
              <th scope="col" style={{ textAlign: 'right', padding: 10 }}>留出分</th>
              <th scope="col" style={{ textAlign: 'center', padding: 10 }}>当前排序</th>
            </tr>
          </thead>
          <tbody>
            {CANDIDATES.map((candidate) => {
              const chosen = candidate.id === selected.id;
              return (
                <tr key={candidate.id} style={{ background: chosen ? (valid ? '#e7f4eb' : '#fae8eb') : '#ffffff' }}>
                  <th scope="row" style={{ textAlign: 'left', padding: 10 }}>{candidate.name}</th>
                  <td style={{ textAlign: 'right', padding: 10 }}>{candidate.dev.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: 10 }}>{candidate.test.toFixed(2)}</td>
                  <td style={{ textAlign: 'center', padding: 10, fontWeight: chosen ? 700 : 400 }}>
                    {chosen ? '选中' : '未选'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={`feedback ${valid ? 'good' : 'bad'}`} role="status" aria-live="polite">
        {valid
          ? '绿色结论：Arbor 的留出分 77.36 更高。这个跨系统结果说明，最终结论必须看未参与搜索的留出评估。'
          : '红色误判：Claude Code 的开发分 75.00 更高，但留出分为 71.70；开发集排名不能单独证明改进可以迁移。'}
      </div>
      <p style={{ color: '#21324a', marginBottom: 0 }}>
        这里展示的是两个系统的 Table 2 最终结果，不是 Arbor 树中的两个候选分支；它用于说明设置留出合并门的动机。
      </p>
    </div>
  );
};

export default HeldoutGate;
