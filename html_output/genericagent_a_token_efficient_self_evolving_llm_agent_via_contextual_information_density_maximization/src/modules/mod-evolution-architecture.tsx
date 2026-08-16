import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

const PIPELINE = ['Trajectory', 'Analyze', 'Extract', 'Verify', 'SOP', 'Executable Code', 'Reusable Skill'];

export const ModEvolutionArchitecture: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(-1);
  const [learning, setLearning] = useState(false);
  const [reused, setReused] = useState(false);
  const [escalation, setEscalation] = useState(0);

  useEffect(() => {
    if (!learning) return;
    if (step >= PIPELINE.length - 1) {
      setLearning(false);
      return;
    }
    const id = window.setTimeout(() => setStep((value) => value + 1), 430);
    return () => window.clearTimeout(id);
  }, [learning, step]);

  const learned = step >= PIPELINE.length - 1;
  const startLearning = () => {
    setReused(false);
    setStep(0);
    setLearning(true);
  };

  return (
    <div className="evolution-demo">
      <div className="evolution-tasks">
        <section className="task-card first">
          <div className="task-number">TASK #1 · COLD START</div>
          <h4>Solve Task</h4>
          <div className="task-path"><span>探索工具</span><i>→</i><span>试错</span><i>→</i><span>Success ✓</span></div>
          <small>首次任务需要完整探索，成功轨迹进入候选区。</small>
        </section>
        <section className={`task-card second ${learned ? 'ready' : ''} ${reused ? 'done' : ''}`}>
          <div className="task-number">TASK #2 · NEW INSTANCE</div>
          <h4>{reused ? 'Success with Reuse ✓' : 'Waiting for a reusable skill'}</h4>
          <div className="task-path"><span>Search Memory</span><i>→</i><span>{learned ? 'Find SOP' : '—'}</span><i>→</i><span>{reused ? 'Reuse' : '—'}</span></div>
          <button disabled={!learned || reused} onClick={() => setReused(true)}>{reused ? '已复用' : '在新任务中复用'}</button>
        </section>
      </div>

      <button className="learn-trajectory" onClick={startLearning} disabled={learning}>
        {learning ? 'Learning…' : learned ? '重新学习这条轨迹' : 'Learn from this trajectory'}
      </button>

      <div className="evolution-pipeline" aria-label="经验巩固管道">
        {PIPELINE.map((item, index) => (
          <React.Fragment key={item}>
            <div className={`${index <= step ? 'active' : ''} ${index < step ? 'done' : ''}`}><span>{index < step ? '✓' : index + 1}</span>{item}</div>
            {index < PIPELINE.length - 1 ? <i className={index < step ? 'active' : ''}>↓</i> : null}
          </React.Fragment>
        ))}
      </div>

      <div className="evolution-rule"><b>No Execution, No Memory.</b><span>只有经过工具执行验证的成功经验，才允许升格为 L3 SOP 或代码资产。</span></div>

      <section className="failure-escalation">
        <header>
          <div><span>FAILURE ESCALATION</span><h4>失败不会触发无限重试，而是逐级增强纠正力度</h4></div>
          <small>论文 §2.3.3 · How the evolutionary trajectory is maintained</small>
        </header>
        <div className="escalation-steps">
          <article className={`${escalation >= 1 ? 'reached' : ''} ${escalation === 1 ? 'active' : ''}`}>
            <b>1</b><span>Localized correction</span><h5>局部修复后重试</h5>
            <p>分析即时错误信息，做一个小范围、局部的调整，然后再次尝试。</p>
          </article>
          <i>→</i>
          <article className={`${escalation >= 2 ? 'reached' : ''} ${escalation === 2 ? 'active' : ''}`}>
            <b>2</b><span>Strategy switch</span><h5>放弃当前路径</h5>
            <p>失败持续时，强制换用全新策略，或者从环境中搜索缺失信息。</p>
          </article>
          <i>→</i>
          <article className={`${escalation >= 3 ? 'reached' : ''} ${escalation === 3 ? 'active' : ''}`}>
            <b>3</b><span>Human intervention</span><h5>暂停并请求人类</h5>
            <p>所有自动尝试都失败后停止执行，不再盲目循环，并请求人工介入。</p>
          </article>
        </div>
        <div className="escalation-control">
          <button onClick={() => setEscalation((value) => Math.min(3, value + 1))} disabled={escalation >= 3}>
            {escalation === 0 ? '模拟任务失败' : escalation < 3 ? '当前修复仍失败，继续升级' : '已请求人类介入'}
          </button>
          <button className="reset" onClick={() => setEscalation(0)}>重置</button>
          <p>{escalation === 0
            ? '从一次执行错误开始，逐步走完论文定义的三级恢复过程。'
            : escalation === 1
              ? '第一级只针对即时错误做小范围调整，避免过早推翻整套方案。'
              : escalation === 2
                ? '局部修改无效后必须离开原路径：换策略，或先补齐环境信息。'
                : '自动恢复路径耗尽，Agent 暂停并升级给人类，避免错误轨迹继续污染长期学习。'}</p>
        </div>
      </section>

      <div className={`exploration-curve ${reused ? 'show' : ''}`}>
        <div className="curve-copy"><b>重复任务中的探索负担</b><small>概念示意；下一模块展示论文 Table 8 的真实九轮数据</small></div>
        {[100, 60, 30, 15].map((value, index) => (
          <div className="curve-column" key={value}><i style={{ height: `${value}%` }} /><b>{value}%</b><span>Task {index + 1}</span></div>
        ))}
      </div>

      <div className={`feedback ${learned ? 'good' : ''}`}>
        {reused
          ? 'Task #2 没有重放 Task #1 的完整探索轨迹；它从 Memory 找到 SOP，再用固定原子工具执行。'
          : learned
            ? '可复用技能已生成。现在把它用于右侧的新任务，观察“经验”如何跨任务产生收益。'
            : '点击 Learn：原始轨迹不会被原样背进上下文，而是经历分析、抽取与执行验证后，逐步结晶为 SOP 和代码。'}
      </div>
    </div>
  );
};
