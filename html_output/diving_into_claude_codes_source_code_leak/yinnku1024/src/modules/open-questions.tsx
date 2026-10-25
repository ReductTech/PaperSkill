import React, { useState } from 'react';
import { Feedback, INK } from './kit';

type Cell = { id: string; row: string; col: string; title: string; check: string; risk: string; tone: string };

const CELLS: Cell[] = [
  { id: 'hot-short', row: '可热改', col: '短任务', title: '迭代优先', check: '绕过成功率 vs 发布次数', risk: '加固收益可能抵不过编译成本', tone: INK.blue },
  { id: 'hot-long', row: '可热改', col: '长任务', title: '夜间无人看守', check: '异常发现时间', risk: '被绕过了也没有人当场知道', tone: INK.orange },
  { id: 'lock-short', row: '编译期锁定', col: '短任务', title: '过度加固', check: '修复时长', risk: '代价大于收益，团队会绕开流程', tone: INK.muted },
  { id: 'lock-long', row: '编译期锁定', col: '长任务', title: '预期收益最大', check: '绕过成功率 + 中断次数', risk: '恢复慢，必须预置回滚方案', tone: INK.green },
];

const QUESTIONS = [
  '阈值该由用户、模型，还是策略层来定？',
  '反蒸馏的收益何时低于维护成本？',
  '三层记忆的切分要随任务时长变吗？',
];

/* 我的思考页：把"下沉一层"从观点变成一个 2×2 因子实验。
   两个因子是决策层级与任务时长，三个指标必须同时记录，否则只会得到片面的结论。 */
export function OpenQuestions() {
  const [selected, setSelected] = useState('lock-long');
  const active = CELLS.find(cell => cell.id === selected)!;
  return (
    <div className="ps" style={{ gridTemplateColumns: 'minmax(0, 0.92fr) minmax(0, 1.1fr)' }}>
      <div className="ps-col" style={{ gap: 10 }}>
        <div className="ps-card ps-card--plain">
          <p className="ps-t" style={{ color: INK.orange, fontWeight: 700 }}>我的假设</p>
          <p className="ps-t ps-t--tight">决策越往下沉，绕过越难、修复越慢；净收益取决于任务时长。</p>
          <p className="ps-t ps-t--tight ps-muted">适用：编码 Agent、CI 助手、自动化运维。</p>
        </div>

        <ol style={{ display: 'grid', gap: 8, listStyle: 'none' }}>
          {QUESTIONS.map((question, index) => (
            <li key={question} className="ps-card" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 16px' }}>
              <span className="ps-num" style={{ width: 44, height: 44, background: INK.orange }}>{index + 1}</span>
              <span className="ps-t ps-t--tight">{question}</span>
            </li>
          ))}
        </ol>

        <div className="ps-card" style={{ marginTop: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap', padding: '10px 16px' }}>
          <span className="ps-chip" data-tone="blue">绕过成功率</span>
          <span className="ps-chip" data-tone="blue">平均修复时长</span>
          <span className="ps-chip" data-tone="blue">发布中断次数</span>
        </div>
      </div>

      <div className="ps-col" style={{ gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '112px 1fr 1fr', gridTemplateRows: '46px 1fr 1fr', gap: 8, flex: '1 1 auto' }}>
          <span />
          {['短任务', '长任务'].map(col => (
            <span key={col} className="ps-t ps-muted" style={{ alignSelf: 'end', textAlign: 'center' }}>{col}</span>
          ))}
          {['可热改', '编译期锁定'].map(row => (
            <React.Fragment key={row}>
              <span className="ps-t" style={{ alignSelf: 'center', color: INK.muted }}>{row}</span>
              {['短任务', '长任务'].map(col => {
                const cell = CELLS.find(item => item.row === row && item.col === col)!;
                const on = cell.id === selected;
                return (
                  <button key={cell.id} type="button" onClick={() => setSelected(cell.id)} aria-pressed={on}
                    style={{
                      display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4,
                      padding: '10px 14px', textAlign: 'left', borderRadius: 14,
                      border: `3px solid ${on ? cell.tone : '#e4dcc6'}`,
                      background: on ? '#fffdf4' : '#fdfbf2',
                      boxShadow: on ? '0 6px 18px rgba(33,50,74,.10)' : 'none',
                    }}>
                    <span className="ps-t" style={{ fontWeight: 700, color: cell.tone, lineHeight: 1.2 }}>{cell.title}</span>
                    <span className="ps-t ps-muted" style={{ lineHeight: 1.2 }}>测：{cell.check}</span>
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        <Feedback tone={active.id === 'lock-long' ? 'good' : 'neutral'}>
          <span>
            <b>{active.row} × {active.col}</b>：{active.risk}。
          </span>
        </Feedback>
      </div>
    </div>
  );
}
