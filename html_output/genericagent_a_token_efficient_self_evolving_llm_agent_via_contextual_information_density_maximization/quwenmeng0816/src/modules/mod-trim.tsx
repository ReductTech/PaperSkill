import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const STAGES = [
  {
    id: 1,
    label: 'Stage 1 · 工具输出截断',
    trigger: '每条工具输出写入历史之前',
    rule: '超过阈值 L 时保留首尾各 L/2，中段替换为省略号。',
    effect: '先限制单条消息体积，避免一条巨大输出直接撑满 History。',
  },
  {
    id: 2,
    label: 'Stage 2 · 标签级压缩',
    trigger: '约每 5 轮，维护已有 History',
    rule: '最近 10 条消息默认豁免；旧 reasoning / tool 标签只保留约 800 字符首尾窗口，重复工作记忆块改成占位符。',
    effect: '在不删除整条消息的前提下，先移除旧消息内部的低价值冗余。',
  },
  {
    id: 3,
    label: 'Stage 3 · 消息淘汰',
    trigger: '仅当新消息使 C_H > B',
    rule: '先以更严格规则重跑 Stage 2（只豁免最近 4 条），再按 FIFO 删除最旧消息，直到 History 低于预算的 60%。',
    effect: '这是全局超预算后的粗粒度兜底，不是每轮都会发生。',
  },
  {
    id: 4,
    label: 'Stage 4 · 工作记忆锚',
    trigger: '每次工具调用后，注入下一条 user message',
    rule: '写入最近 20 条一行摘要、当前轮次和由 update_working_checkpoint 维护的 key_info。',
    effect: '它是并行的保状态通道：旧锚副本会被 Stage 2 压成占位符；Stage 3 淘汰旧消息后，最新锚继续保住任务关键状态。',
  },
] as const;

export const ModTrim: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState(1);
  const current = STAGES[stage - 1];

  return (
    <div className="trim-architecture">
      <div className="trim-flow-title"><b>History reduction path</b><span>先细粒度处理；只有全局超预算才删除整条消息</span></div>
      <div className="history-flow">
        <div className="flow-source"><small>tool result</small><b>原始工具输出</b></div>
        <i>→</i>
        <button className={stage === 1 ? 'active' : ''} onClick={() => setStage(1)}><small>BEFORE HISTORY</small><b>Stage 1</b><span>单条截断</span></button>
        <i>→</i>
        <div className="history-store"><small>CONVERSATION</small><b>History</b><span>累积消息</span></div>
      </div>

      <div className="history-maintenance">
        <div className="maintenance-branch scheduled">
          <span>约每 5 轮</span>
          <button className={stage === 2 ? 'active' : ''} onClick={() => setStage(2)}><small>MAINTAIN HISTORY</small><b>Stage 2 · 标签压缩</b><em>改消息内部，不删整条</em></button>
          <i>↺ 写回 History</i>
        </div>
        <div className="budget-gate"><span>新消息进入</span><b>C_H &gt; B ?</b></div>
        <div className="maintenance-branch overflow">
          <span>仅在 YES 时</span>
          <button className={stage === 3 ? 'active' : ''} onClick={() => setStage(3)}><small>GLOBAL OVERFLOW</small><b>Stage 3 · FIFO 淘汰</b><em>严格压缩后删到 0.6B</em></button>
          <i>→ 紧凑 History</i>
        </div>
      </div>

      <div className="anchor-flow-title"><b>Task-state preservation path</b><span>Stage 4 与删除链并行，不是 Stage 3 的下一步</span></div>
      <div className="anchor-flow">
        <div><small>AFTER EVERY TOOL CALL</small><b>更新任务状态</b></div>
        <i>→</i>
        <button className={stage === 4 ? 'active' : ''} onClick={() => setStage(4)}><small>PARALLEL ANCHOR</small><b>Stage 4 · Working Memory</b><span>20 条摘要 · turn · key_info</span></button>
        <i>→</i>
        <div><small>NEXT USER MESSAGE</small><b>注入最新锚</b></div>
        <i>→</i>
        <div className="active-context-node"><small>ACTIVE CONTEXT</small><b>任务状态仍可见</b></div>
      </div>

      <section className={`trim-stage-detail stage-${stage}`} aria-live="polite">
        <div><span>{current.label}</span><strong>{current.trigger}</strong></div>
        <p>{current.rule}</p>
        <small>{current.effect}</small>
      </section>

      <div className="chip-row trim-stage-buttons">
        {STAGES.map((item) => <button key={item.id} className={`chip ${stage === item.id ? 'selected' : ''}`} onClick={() => setStage(item.id)}>{item.label}</button>)}
      </div>
      <div className={`feedback ${stage === 4 ? 'good' : stage === 3 ? 'bad' : ''}`}>{current.effect}</div>
    </div>
  );
};
