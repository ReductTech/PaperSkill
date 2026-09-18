import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Row = {
  method: string;
  mdp: string;
  credit: string;
  note: string;
  align: boolean;
};

const rows: Row[] = [
  { method: 'PPO', mdp: 'Token-level', credit: 'Token-level', note: '两端都在 token，适合单轮生成，难贴合多轮环境转移。', align: false },
  { method: 'Reinforce++', mdp: 'Token-level', credit: 'Token-level', note: '同属 token 对齐；智能体长程决策仍易碎。', align: false },
  { method: 'GRPO', mdp: 'Token-level', credit: 'Trajectory-level', note: 'MDP 仍 token，信用却整条轨迹，粒度错配。', align: false },
  { method: 'RLOO', mdp: 'Token-level', credit: 'Trajectory-level', note: '轨迹相对优势稳定但粗糙。', align: false },
  { method: 'LightningRL', mdp: 'Step-level', credit: 'Trajectory-level', note: '已用步级 MDP，但信用仍偏轨迹级。', align: false },
  { method: 'StepPO', mdp: 'Step-level', credit: 'Step-level', note: '两边都钉在交互步，消除 Table 1 中的错配。', align: true },
];

/** Interactive Table 1 comparison from the paper. */
export const Ch1Table1: React.FC<WidgetProps> = () => {
  const [sel, setSel] = useState('StepPO');
  const cur = rows.find((r) => r.method === sel) ?? rows[rows.length - 1];
  return (
    <div>
      <div className="ctrl" style={{ flexWrap: 'wrap' }}>
        {rows.map((r) => (
          <button
            key={r.method}
            type="button"
            className={sel === r.method ? 'chip on' : 'chip'}
            onClick={() => setSel(r.method)}
          >
            {r.method}
          </button>
        ))}
      </div>
      <div style={{ overflowX: 'auto', marginTop: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#eef3e8', textAlign: 'left' }}>
              <th style={{ padding: '8px 10px' }}>Method</th>
              <th style={{ padding: '8px 10px' }}>MDP granularity</th>
              <th style={{ padding: '8px 10px' }}>Credit granularity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const on = r.method === sel;
              return (
                <tr
                  key={r.method}
                  onClick={() => setSel(r.method)}
                  style={{
                    cursor: 'pointer',
                    background: on ? (r.align ? '#e5f6ec' : '#fff4f0') : 'transparent',
                    fontWeight: r.align ? 700 : 400,
                  }}
                >
                  <td style={{ padding: '8px 10px', borderTop: '1px solid #d7deea' }}>{r.method}</td>
                  <td style={{ padding: '8px 10px', borderTop: '1px solid #d7deea' }}>{r.mdp}</td>
                  <td style={{ padding: '8px 10px', borderTop: '1px solid #d7deea' }}>{r.credit}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className={`feedback ${cur.align ? 'good' : 'bad'}`}>{cur.note}</div>
      <p className="paper-figure-cap">来源：论文 Table 1（粒度错配一览）。点击行可对照方法定位。</p>
    </div>
  );
};
export default Ch1Table1;
