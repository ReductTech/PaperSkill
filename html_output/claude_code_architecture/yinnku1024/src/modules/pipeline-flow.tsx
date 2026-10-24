import React, { useState } from 'react';
import { Feedback, Num, RW } from './kit';

const STATIONS = [
  { name: '输入', job: '用户在 REPL 里敲下一行请求。', fail: '没有输入，整条管线不启动。', file: 'src/screens/REPL.tsx' },
  { name: 'CLI 解析', job: 'Commander.js 解析参数、flag 与环境。', fail: '参数不合法，进程在启动阶段退出。', file: 'src/main.tsx' },
  { name: 'QueryEngine', job: '组装上下文、发起流式请求、持有回合状态。', fail: '回合无法开始，或者状态没有人持有。', file: 'src/QueryEngine.ts' },
  { name: 'LLM API', job: '模型返回文本，或者请求一次工具调用。', fail: '瞬时失败进入重试；持续失败结束回合。', file: 'Anthropic API' },
  { name: '工具循环', job: '执行工具，把结果回灌进下一次请求。', fail: '工具被关掉，Agent 退化成聊天。', file: 'src/tools.ts' },
  { name: '终端 UI', job: 'Ink 组件树把结果渲染到终端。', fail: '结果存在，但用户看不见。', file: 'src/components/' },
];

/* 全景页：六站不是一条直线，第五站会把结果送回第三站。
   学习者沿站走一遍，看到每一站各自承担什么、坏了会怎样。 */
export function PipelineFlow() {
  const [active, setActive] = useState(2);
  const station = STATIONS[active];
  return (
    <div className="rw" style={{ gridTemplateRows: 'auto minmax(0, 1fr) auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 10 }}>
        {STATIONS.map((item, index) => (
          <button key={item.name} type="button" className="rw-btn"
            aria-pressed={active === index} onClick={() => setActive(index)}
            style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4, padding: '10px 12px' }}>
            <Num n={index + 1} tone={active === index ? 'blue' : 'muted'} />
            <span style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.15 }}>{item.name}</span>
          </button>
        ))}
      </div>

      <div className="rw-card rw-card--plain" style={{ display: 'grid', gridTemplateRows: 'auto auto 1fr', gap: 10, borderLeftColor: RW.blue }}>
        <div className="rw-spread">
          <p className="rw-h">{station.name}</p>
          <span className="rw-chip" data-tone="steel">第 {active + 1} 站 / 6</span>
        </div>
        <p className="rw-t">{station.job}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignContent: 'start' }}>
          <div className="rw-slot">
            <p className="rw-t rw-muted">这一站坏了会怎样</p>
            <p className="rw-t rw-t--tight">{station.fail}</p>
          </div>
          <div className="rw-slot">
            <p className="rw-t rw-muted">文档给出的位置</p>
            <p className="rw-mono rw-t--tight">{station.file}</p>
          </div>
        </div>
      </div>

      <Feedback tone={active === 4 ? 'bad' : 'neutral'}>
        {active === 4
          ? '循环在这里：工具结果回到 QueryEngine，再发一次请求。站与站之间不是单向的。'
          : '沿站走一遍：每一站都有明确职责，出问题时可以先定位到站。'}
      </Feedback>
    </div>
  );
}
