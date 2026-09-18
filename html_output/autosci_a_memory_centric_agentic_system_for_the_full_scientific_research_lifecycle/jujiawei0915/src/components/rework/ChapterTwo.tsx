import { useState } from 'react';
import { ChapterFrame, TeachingSection } from './LearningFrame';

const environments = {
  'User Environment': ['Instructions', 'Corrections', 'Preferences'],
  'Open Environment': ['Papers', 'Codebases', 'Venue Expectations'],
  'Task Environment': ['Runtime', 'Experiments', 'Failures', 'Outcomes'],
};
const environmentClass = ['env-user', 'env-open', 'env-task'];
const principles = [
  ['科研信息来自很多环境，怎么办？', 'Environment Interaction', '让系统持续与用户、开放科研资源和任务运行环境交互。'],
  ['一个项目结束以后，知识还能继续使用吗？', 'Structured Persistent Memory', '用结构化、可持久保存的科学记忆承接跨项目复用。'],
  ['长时间任务如何暂停、审核和恢复？', 'Harnessed Execution', '以状态、上下文、验证、反馈机制约束长程执行。'],
  ['经验积累以后，系统本身是否可以进化？', 'Full-System Evolution', '将反馈转为对记忆、技能和模板的版本化更新。'],
];
const modules = [
  ['SciMem', 'Remember', '保存和组织跨项目科研记忆'],
  ['SciFlow', 'Execute', '在 SciMem 上推进完整科研生命周期'],
  ['SciDAG', 'Augment · Optional', '困难 Skill 时按需调用多智能体 DAG'],
  ['SciEvolve', 'Evolve', '用 traces / feedback 改进系统组件'],
];
const cycle = ['Research', 'Artifacts Produced', 'Check', 'Store', 'Reuse', 'Feedback', 'System Update'];

export function ChapterTwo({ onNext }: { onNext: () => void }) {
  const [environment, setEnvironment] = useState<keyof typeof environments>('User Environment');
  const [principle, setPrinciple] = useState<number | null>(null);
  const [cycleStep, setCycleStep] = useState(0);
  const [projects, setProjects] = useState(0);
  const completedCycle = cycleStep === cycle.length - 1;
  const cycleStateClass = (index: number) => index === cycleStep ? 'active' : index < cycleStep ? 'done' : '';
  const advanceCycle = () => setCycleStep((current) => Math.min(cycle.length - 1, current + 1));
  const nextProject = () => { setProjects((current) => current + 1); setCycleStep(0); };
  const environmentEntries = Object.entries(environments) as Array<[keyof typeof environments, string[]]>;

  return (
    <ChapterFrame
      section="§2"
      paperSection="论文 §2 System Overview"
      title="一个科研系统，怎样才能长期工作？"
      subtitle="四个设计原则+四个彼此连接的模块，让科研形成一个可以积累的闭环。"
      purpose={<><p>这一节先建立 AutoSci 的整体地图：</p><p>对它如何与环境交互，如何保存科研经验，如何执行科研流程，又如何利用反馈改进未来的研究有一个整体的认识</p></>}
      map={[
        { id: '2.1', label: 'AutoSci 从哪些环境里获取信息？' },
        { id: '2.2', label: '四条Design Principles分别回答什么问题？' },
        { id: '2.3', label: '四个模块各负责什么？' },
        { id: '2.4', label: '四个模块如何组成闭环？' },
      ]}
    >
      <TeachingSection number="2.1" title="AutoSci 从哪些环境里获取信息？">
        <p className="section-lead">AutoSci 长期与三类科研环境交换信息。</p>
        <div className="environment-system environment-system-v2">
          <div className="environment-diagram">
            <svg className="environment-connections" viewBox="0 0 920 430" preserveAspectRatio="none" aria-hidden="true">
              <defs><marker id="environment-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" /></marker></defs>
              <path className={`environment-path path-user ${environment === 'User Environment' ? 'active' : ''}`} d="M214 102 C320 102 355 165 424 205" markerEnd="url(#environment-arrow)" />
              <path className={`environment-path path-open ${environment === 'Open Environment' ? 'active' : ''}`} d="M706 102 C602 102 565 165 496 205" markerEnd="url(#environment-arrow)" />
              <path className={`environment-path path-task ${environment === 'Task Environment' ? 'active' : ''}`} d="M460 356 C460 322 460 298 460 270" markerEnd="url(#environment-arrow)" />
            </svg>
            {environmentEntries.map(([name, signals], index) => <button type="button" key={name} className={`environment-node ${environmentClass[index]} ${environment === name ? 'active' : ''}`} onClick={() => setEnvironment(name)}><strong>{name}</strong><span>{signals.join(' · ')}</span><small>signals → AutoSci</small></button>)}
            <div className="environment-core"><b>AutoSci</b><p>Receiving signals from:</p><strong>{environment}</strong></div>
          </div>
        </div>
      </TeachingSection>

      <TeachingSection number="2.2" title="四个 Design Principles分别回答什么问题？">
        <p className="section-lead">点击卡片，查看 AutoSci 对这些难题的回答。</p>
        <div className={`principle-problem-map ${principle !== null ? 'has-answer' : ''}`}>
          <div className="principle-problems">{principles.map(([question], index) => <button type="button" key={question} className={principle === index ? 'active' : ''} aria-expanded={principle === index} onClick={() => setPrinciple((current) => current === index ? null : index)}>{question}</button>)}</div>
          {principle !== null ? <div className="principle-answer"><span>AutoSci 的回答</span><strong>{principles[principle][1]}</strong><p>{principles[principle][2]}</p></div> : null}
        </div>
      </TeachingSection>

      <TeachingSection number="2.3" title="四个模块各自负责什么？">
        <div className="module-responsibility-grid">
          {modules.map(([name, label, description]) => (
            <article className="module-responsibility-card" key={name}>
              <div><strong>{name}</strong><span>{label}</span></div>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </TeachingSection>

      <TeachingSection number="2.4" title="四个模块如何组成闭环？">
        <p className="section-lead">研究产物会被检查、存储、复用，并回流为下一轮更新。</p>
        <div className="research-loop">
          <div className="loop-track">
            <div className="loop-row">
              {cycle.map((item, index) => <div className="loop-flow-item" key={item}><button type="button" className={cycleStateClass(index)} onClick={() => setCycleStep(index)}>{item}</button>{index < cycle.length - 1 ? <i aria-hidden="true">→</i> : null}</div>)}
            </div>
          </div>
          <div className="loop-panel"><span>当前阶段</span><strong>{cycle[cycleStep]}</strong><p>{cycleStep === 3 || cycleStep === 4 ? 'Store / Reuse → SciMem' : cycleStep === 5 || cycleStep === 6 ? 'Feedback → Update → SciEvolve' : cycleStep === 2 ? 'Check → 由执行中的验证门控支持' : 'Execute → SciFlow；困难执行可选调用 SciDAG。'}</p><b>跨项目保留的 memory artifacts：{projects * 3}</b></div>
        </div>
        <div className="loop-actions"><button type="button" className="primary-action" onClick={advanceCycle} disabled={completedCycle}>Run one research cycle</button>{completedCycle ? <button type="button" className="quiet-action" onClick={nextProject}>Run next project</button> : null}</div>
      </TeachingSection>

      <div className="chapter-transition chapter-two-transition"><p>下一章：进入 AutoSci 的核心记忆系统 —— SciMem</p><button type="button" className="primary-action" onClick={onNext}>进入 SciMem →</button></div>
    </ChapterFrame>
  );
}
