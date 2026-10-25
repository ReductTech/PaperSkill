import React, { useState } from 'react';
import { Feedback, RW, Switch } from './kit';

const PARTS = [
  { id: 'schema', name: '输入 schema', fail: '参数没有校验：模型给什么就执行什么。' },
  { id: 'permission', name: '权限模型', fail: '没有审批：危险操作直接落地。' },
  { id: 'execution', name: '执行逻辑', fail: '只有声明没有实现：调用返回空。' },
  { id: 'ui', name: 'UI 组件', fail: '结果无法渲染：终端里看不见这一步。' },
];

/* 每个工具都是四件套：schema、权限、执行、UI。
   缺任何一件，工具就不是“少个字段”，而是换了一种失败方式。 */
export function ToolContract() {
  const [off, setOff] = useState<string[]>([]);
  const [parallel, setParallel] = useState(false);
  const missing = PARTS.filter(part => off.includes(part.id));

  return (
    <div className="rw" style={{ gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)' }}>
      <div className="rw-stage" style={{ background: '#f4f7fa', display: 'grid' }}>
        <svg viewBox="0 0 820 560" role="img" aria-label="一个工具的四个部件与并行轨道">
          <rect x="20" y="30" width="780" height="250" rx="8" fill={RW.white} stroke={RW.lineStrong} strokeWidth="3" />
          <text x="40" y="70" fill={RW.muted} fontSize="30">一个工具 = 四个部件</text>
          {PARTS.map((part, index) => {
            const x = 45 + index * 188;
            const gone = off.includes(part.id);
            return (
              <g key={part.id} transform={`translate(${x} 100)`}>
                <rect width="168" height="130" rx="6" fill={gone ? '#f2f4f7' : '#eef3f9'} stroke={gone ? RW.line : RW.blue} strokeWidth="3" strokeDasharray={gone ? '10 8' : undefined} />
                <text x="84" y="52" textAnchor="middle" fill={gone ? RW.muted : RW.blue} fontSize="30" fontWeight="700">{part.name}</text>
                <text x="84" y="94" textAnchor="middle" fill={RW.muted} fontSize="30">{gone ? '缺失' : '在位'}</text>
              </g>
            );
          })}
          <rect x="20" y="320" width="780" height="210" rx="8" fill={RW.white} stroke={RW.lineStrong} strokeWidth="3" />
          <text x="40" y="360" fill={RW.muted} fontSize="30">调度：能不能并排跑</text>
          <rect x="60" y="400" width="700" height="10" rx="4" fill={RW.rail} />
          <g transform="translate(80 372)">
            <rect width="150" height="46" rx="6" fill={RW.blue} opacity="0.16" />
            <rect width="150" height="46" rx="6" fill="none" stroke={RW.blue} strokeWidth="3" />
            <text x="75" y="32" textAnchor="middle" fill={RW.blue} fontSize="30">Read</text>
          </g>
          <g transform={`translate(${parallel ? 300 : 250} ${parallel ? 372 : 452})`}>
            <rect width="150" height="46" rx="6" fill={parallel ? RW.green : RW.orange} opacity="0.16" />
            <rect width="150" height="46" rx="6" fill="none" stroke={parallel ? RW.green : RW.orange} strokeWidth="3" />
            <text x="75" y="32" textAnchor="middle" fill={parallel ? RW.green : RW.orange} fontSize="30">Bash</text>
          </g>
          <text x="40" y="522" fill={parallel ? RW.green : RW.orange} fontSize="30">
            {parallel ? '两条轨道并行：只对声明了 isConcurrencySafe 的工具成立' : '同一条轨道排队：全部串行执行'}
          </text>
        </svg>
      </div>

      <div className="rw-col">
        <p className="rw-t rw-muted">逐个卸掉部件，看它坏在哪</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {PARTS.map(part => (
            <Switch key={part.id} checked={!off.includes(part.id)}
              onChange={enabled => setOff(current => enabled ? current.filter(id => id !== part.id) : [...current, part.id])}>
              {part.name}
            </Switch>
          ))}
        </div>
        <Switch checked={parallel} onChange={setParallel}>只调度声明了并发的工具</Switch>
        <div style={{ marginTop: 'auto' }}>
          <Feedback tone={missing.length === 0 ? 'good' : 'bad'}>
            {missing.length === 0
              ? '四件套齐全：校验、审批、执行、渲染各归各位，工具才是可复用的单位。'
              : missing[0].fail}
          </Feedback>
        </div>
      </div>
    </div>
  );
}
