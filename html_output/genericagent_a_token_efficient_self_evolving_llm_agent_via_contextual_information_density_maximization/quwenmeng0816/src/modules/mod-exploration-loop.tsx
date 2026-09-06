import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const EXECUTION = ['加载近期历史与待办', '检索技能树并识别缺口', '在临时沙箱研究、原型与验证', '写含机器可读标签的 Markdown 报告', '原子化巩固并更新技能树', '推进任务列表'];

export const ModExplorationLoop: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const [view, setView] = useState<'compose' | 'execute' | 'assess'>('compose');
  return (
    <div className="exploration-loop">
      <div className="exploration-view-tabs">
        <button className={view === 'compose' ? 'active' : ''} onClick={() => setView('compose')}>能力组合</button>
        <button className={view === 'execute' ? 'active' : ''} onClick={() => setView('execute')}>执行与巩固</button>
        <button className={view === 'assess' ? 'active' : ''} onClick={() => setView('assess')}>质量反馈与边界</button>
      </div>
      {view === 'compose' ? (
        <section className="exploration-composition">
          <article><small>EXECUTION SUBSTRATE</small><h4>Subagent Dispatch</h4><p>并行启动子实例，在独立上下文与内存空间中执行探索任务。</p></article>
          <b>+</b>
          <article><small>TRIGGER SUBSTRATE</small><h4>Reflect Mode</h4><p>监控空闲条件；默认每六分钟触发一次固定探索提示，无需用户指令。</p></article>
          <i>↓</i>
          <div><small>NO NEW SUBSYSTEM</small><strong>Autonomous Exploration</strong><span>调度者从用户变成 Agent 自己</span></div>
        </section>
      ) : view === 'execute' ? (
        <section className="exploration-execution">
          <div className="execution-steps">
            {EXECUTION.map((item, index) => <button key={item} className={`${index === step ? 'active' : ''} ${index < step ? 'done' : ''}`} onClick={() => setStep(index)}><b>{index < step ? '✓' : index + 1}</b><span>{item}</span></button>)}
          </div>
          <div className="execution-detail"><small>STEP {step + 1}</small><h4>{EXECUTION[step]}</h4><p>{step === 2 ? '所有生成文件必须限制在临时目录；系统秘密和核心源代码无条件禁止访问。' : step === 3 ? '失败实验也要完整记录，后续规划才能避开已经验证过的死路。' : step === 4 ? '归档报告、更新两级技能树，并递增对应技能的 usage counter。' : '规划与执行严格分离；规划器写完任务列表后立即让出控制，下一次调用才执行。'}</p><button onClick={() => setStep((value) => Math.min(EXECUTION.length - 1, value + 1))} disabled={step === EXECUTION.length - 1}>下一步</button></div>
        </section>
      ) : (
        <section className="exploration-assessment">
          <div><span>30-day usage feedback</span><b>预测高但使用低</b><p>若 S(t)&gt;8 且 30 天内 usage&lt;3，主导维度权重降低 10%。</p></div>
          <div><span>30-day usage feedback</span><b>预测低但使用高</b><p>若 S(t)&lt;5 且 usage&gt;5，对应维度权重提高 10%，之后重新归一化。</p></div>
          <aside><b>论文明确限制</b><ul><li>权重自适应尚未得到充分长期验证</li><li>30 轮上限可能让复杂研究跨会话</li><li>改进日志与高级技能树维护仍依赖人工</li></ul></aside>
        </section>
      )}
      <div className="feedback good">自主探索不是额外架构：Subagent 提供并行执行，Reflect 提供无用户指令触发；技能树、课程评分与沙箱巩固定义“探索什么、如何验证”。</div>
    </div>
  );
};
