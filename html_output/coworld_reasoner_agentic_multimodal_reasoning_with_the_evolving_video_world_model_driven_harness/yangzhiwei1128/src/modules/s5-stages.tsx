import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const STAGES = [
  { n: 1, name: '能力边界评估', line: '加载技能：跨视角；判断这段缺口值得生成。' },
  { n: 2, name: '请求 VWM 协助', line: '请求：视角改变，源图 1 → 2，保持背景锚点。' },
  { n: 3, name: '视频解读', line: '验证：可见事件与请求一致，未报告伪影。' },
  { n: 4, name: '证据整合与推理', line: '答案：相机朝北；依据原图 + 生成片段。' },
];

export function S5Stages(_props: WidgetProps) {
  const [stage, setStage] = useState(1);
  return (
    <div className="ps-page s5-page">
      <div className="ps-rail">
        {STAGES.map(item => {
          const on = item.n === stage;
          const done = item.n < stage;
          return (
            <button key={item.n} className={`ps-stage ${on ? 'is-on' : ''} ${done ? 'is-done' : ''}`} onClick={() => setStage(item.n)}>
              <span className="ps-stage-n">{item.n}</span>
              <span className="ps-stage-name">{item.name}</span>
            </button>
          );
        })}
        <input className="ps-range" type="range" min="1" max="4" step="1" value={stage}
          aria-label="推进推理阶段" onChange={event => setStage(Number(event.target.value))} />
      </div>
      <div className="ps-log">
        <div className="ps-log-head">
          <strong>交互历史 h</strong>
          <span>{stage} 条记录</span>
        </div>
        {STAGES.filter(item => item.n <= stage).map(item => (
          <div key={item.n} className="ps-log-line">
            <span className={`ps-log-mark ${item.n < stage ? 'is-done' : ''}`}>{item.n < stage ? '✓' : '›'}</span>
            <span>{item.line}</span>
          </div>
        ))}
        {STAGES.filter(item => item.n > stage).map(item => (
          <div key={`ghost-${item.n}`} className="ps-log-line is-ghost">
            <span className="ps-log-mark">·</span>
            <span>第 {item.n} 阶段：{item.name}（尚未执行）</span>
          </div>
        ))}
        <div className="ps-feedback is-info" aria-live="polite">
          {stage === 1 ? '先判断：这段证据值不值得生成？'
            : stage === 2 ? '再决定：用哪种操作，请求怎么写？'
              : stage === 3 ? '然后核对：视频里到底发生了什么？'
                : '最后把原图和证据放在一起回答。'}
        </div>
      </div>
    </div>
  );
}
