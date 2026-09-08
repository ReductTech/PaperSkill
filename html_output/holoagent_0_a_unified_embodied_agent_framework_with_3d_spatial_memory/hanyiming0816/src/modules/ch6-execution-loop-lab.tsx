import React from 'react';
import type { WidgetProps } from './registry';

const gives = [
  {
    verb: 'USE',
    title: 'Skills',
    text: '把导航、操作、全身运动等异构机器人能力变成 AgentOS 可调用、可监控的执行接口。',
  },
  {
    verb: 'REMEMBER',
    title: 'Memory',
    text: '通过持续 3D Spatial Memory + Temporal Memory，让 Agent 知道世界现在怎样、刚才发生了什么。',
  },
  {
    verb: 'RECOVER',
    title: 'AgentOS',
    text: '不再假设一次规划一定正确，而是根据 runtime feedback 监控、更新记忆并重新规划。',
  },
];

const futures = [
  {
    num: '01',
    title: 'Unified Action Models',
    zh: '更统一的机器人基础模型',
    diagram: ['AgentOS', 'Language-aligned Robot Foundation Model'],
    text: '未来希望底层模型提供可组合、可验证、可被 AgentOS 调度的动作空间。',
  },
  {
    num: '02',
    title: 'More Bodies',
    zh: '更多机器人形态 + 完整 Humanoid Stack',
    diagram: ['mobility', 'manipulation', 'interaction', 'recovery'],
    text: '从少数平台走向更多身体，并统一协调移动、操作、交互与恢复能力。',
  },
  {
    num: '03',
    title: 'Self-Evolving Skills',
    zh: 'Agent 不只会调用 Skill，还能创造 Skill',
    diagram: ['New Task', 'Coding Agent', 'Digital Twin', 'Real Robot'],
    text: '新技能先在 digital twin 中验证，通过安全检查后再部署到真实机器人。',
  },
];

export const Ch6ExecutionLoopLab: React.FC<WidgetProps> = () => {
  return (
    <div className="outlook-lab">
      <div className="outlook-hero">
        <small>SUMMARY & OUTLOOK</small>
        <b>From HoloAgent-0 to General Physical Agents</b>
        <span>不是让某一个模型什么都会，而是先把物理 Agent 的 runtime 搭完整。</span>
      </div>

      <div className="outlook-grid">
        <section className="outlook-left">
          <div className="outlook-section-title">
            <b>What HoloAgent-0 Gives Us</b>
            <span>整篇汇报压缩成三个动词</span>
          </div>
          <div className="outlook-give-stack">
            {gives.map((item) => (
              <article key={item.verb} className="outlook-give">
                <strong>{item.verb}</strong>
                <div>
                  <b>{item.title}</b>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="outlook-middle">
          <b>Still missing</b>
          <span>完整机器人复杂任务还需要更统一、更系统的端到端评测。</span>
        </aside>

        <section className="outlook-right">
          <div className="outlook-section-title">
            <b>Where Could It Go Next?</b>
            <span>future work in three directions</span>
          </div>
          <div className="outlook-future-stack">
            {futures.map((item) => (
              <article key={item.num} className="outlook-future">
                <div className="outlook-future-head">
                  <small>{item.num}</small>
                  <div>
                    <b>{item.title}</b>
                    <span>{item.zh}</span>
                  </div>
                </div>
                <div className="outlook-diagram" aria-label={item.diagram.join(' to ')}>
                  {item.diagram.map((node, index) => (
                    <React.Fragment key={node}>
                      <span>{node}</span>
                      {index < item.diagram.length - 1 ? <i>→</i> : null}
                    </React.Fragment>
                  ))}
                </div>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="outlook-final">
        <strong>From calling tools → to acting, remembering, and recovering in the physical world.</strong>
        <div>
          <span>USE</span>
          <span>REMEMBER</span>
          <span>RECOVER</span>
          <span>EVOLVE</span>
        </div>
      </div>
    </div>
  );
};

export default Ch6ExecutionLoopLab;
