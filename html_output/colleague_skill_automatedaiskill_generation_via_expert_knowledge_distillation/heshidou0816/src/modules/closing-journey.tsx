import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const scenes = [
  { id: 'S1', title: 'Trace remains', question: '资深同事离开后，什么还在？', result: 'Chat、Email、Review、Incident 等痕迹仍在，但工作判断尚未成为可检查的规则。', handoff: '需要一个比 hidden memory 更可追溯的工件。', color: 'green' },
  { id: 'S2', title: 'Define the artifact', question: '到底要构造什么？', result: '由 p、c、D 约束的 Person-Grounded Skill：S=(A,M,L)，不是 AI Avatar。', handoff: '目标已经明确，接下来要打开构造机制。', color: 'blue' },
  { id: 'S3', title: 'Run the pipeline', question: 'Skill 怎样被造出来？', result: 'Collector / Parser、Preset、双轨蒸馏、文件写入与 Productization 形成责任链。', handoff: '第一版已经生成，但它可能会错。', color: 'orange' },
  { id: 'S4', title: 'Evolve the version', question: '发现错误以后怎么办？', result: 'Capability Patch 或 Behavior Record 生成新版本；prior state 被保留，可比较、回滚并重新选择 Ready。', handoff: '当前版本已经确定，下一步是决定去向。', color: 'purple' },
  { id: 'S5', title: 'Govern deployment', question: 'Skill 可以去哪里？', result: '它可以留在本地、安装到 Agent，或在 Publication Gate 允许时进入 Gallery。', handoff: '分发表面成立，但忠实度与任务效果仍待验证。', color: 'red' },
];

export const ClosingJourney: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState(0);
  const [visited, setVisited] = useState<number[]>([0]);
  const current = scenes[active];

  const choose = (index: number) => {
    setActive(index);
    setVisited(previous => previous.includes(index) ? previous : [...previous, index]);
  };

  return <div className="paper-widget closing-journey">
    <header className="closing-module-header"><span>S1–S5 RECAP</span><b>不是五个 Demo，而是一件工件的连续旅程</b><small>{visited.length}/5 scenes revisited</small></header>
    <div className="journey-track" role="tablist" aria-label="回顾 S1 到 S5">
      {scenes.map((scene, index) => <button type="button" role="tab" aria-selected={active === index} key={scene.id} className={`${active === index ? 'active' : ''}${visited.includes(index) ? ' visited' : ''}`} onClick={() => choose(index)}>
        <span>{visited.includes(index) ? '✓' : scene.id}</span><b>{scene.id}</b><small>{scene.title}</small>
      </button>)}
    </div>
    <section className={`journey-detail tone-${current.color}`} aria-live="polite">
      <div><span>{current.id} · KEY QUESTION</span><h4>{current.question}</h4><p>{current.result}</p></div>
      <aside><span>NEXT HANDOFF</span><b>{current.handoff}</b></aside>
    </section>
    {visited.length === scenes.length && <div className="journey-synthesis"><b>Trace → Bounded Artifact → Distillation → Lifecycle → Governed Deployment</b><p>这条链说明的是一个可维护的软件工件如何形成；它没有自动证明“这个工件就是那个人”。</p></div>}
  </div>;
};

export default ClosingJourney;
