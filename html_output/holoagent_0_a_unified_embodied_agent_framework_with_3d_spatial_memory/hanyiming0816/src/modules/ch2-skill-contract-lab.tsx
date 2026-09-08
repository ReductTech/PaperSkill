import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const layers = [
  {
    title: 'Embodied AgentOS',
    role: 'Intent → Skill Graph',
    desc: '理解用户意图，查询上下文，生成技能图，调度执行并监听运行时反馈。',
    chips: ['plan', 'schedule', 'monitor', 'recover'],
  },
  {
    title: 'Memory Layer',
    role: '3D Spatial + Temporal',
    desc: '提供物体、位置和空间关系，并保存当前任务状态与执行历史。',
    chips: ['objects', 'places', 'task state', 'history'],
  },
  {
    title: 'Embodied Skills',
    role: 'Robot Capabilities',
    desc: '把导航、操作、运动等机器人能力包装成可调用、可反馈的执行接口。',
    chips: ['navigate', 'manipulate', 'motion', 'feedback'],
  },
];

const statusFields = [
  ['progress', '62%'],
  ['failure', 'blocked'],
  ['confidence', '0.84'],
  ['recoverable', 'true'],
];

type SkillId = 'interaction' | 'perception' | 'holonavi' | 'holobrain' | 'holomotion';

const toolbox: Array<{
  id: SkillId;
  name: string;
  kind: string;
  calls: string[];
  question: string;
  pipeline: string[];
  evidence: string[];
  takeaway: string;
}> = [
  {
    id: 'holonavi',
    name: 'HoloNavi',
    kind: 'Navigation',
    calls: ['move_to()', 'find()', 'explore()'],
    question: '机器人怎么找到目标？',
    pipeline: ['Retrieve HMSG', 'Select Viewpoint', 'Verify Target', 'Explore if failed'],
    evidence: ['goal reachability', 'localization confidence', 'verification failure', 'exploration progress'],
    takeaway: 'HoloNavi 不是“给坐标然后走”，而是检索 → 验证 → 必要时探索。',
  },
  {
    id: 'holobrain',
    name: 'HoloBrain',
    kind: 'Manipulation',
    calls: ['pick()', 'place()', 'open()', 'fold()'],
    question: '到了目标旁边，怎么操作？',
    pipeline: ['Task Intent', 'Observation + Memory', 'Manipulation Policy', 'Arm / Gripper Action'],
    evidence: ['success', 'grasp failure', 'unreachable pose', 'collision risk'],
    takeaway: '重点不是 VLA 内部结构，而是把 manipulation backend 包装成可监控、可恢复的 Skill。',
  },
  {
    id: 'holomotion',
    name: 'HoloMotion',
    kind: 'Whole-body',
    calls: ['walk()', 'turn()', 'recover()'],
    question: '人形机器人身体怎么动？',
    pipeline: ['High-level Goal', 'Motion Tracking / Velocity Tracking', 'Whole-body Execution', 'Runtime Status'],
    evidence: ['balance state', 'contact risk', 'velocity error', 'recoverability'],
    takeaway: '根据高层目标选择动作跟踪或速度跟踪，并持续反馈身体状态与恢复信息。',
  },
  {
    id: 'perception',
    name: 'Perception',
    kind: 'Grounding',
    calls: ['detect()', 'localize()', 'verify()'],
    question: '机器人怎么确认现实？',
    pipeline: ['Observation', 'Visual Evidence', 'Grounding Result', 'AgentOS + Memory'],
    evidence: ['detected instance', 'confidence', 'view evidence', 'verification result'],
    takeaway: 'Perception 是现实世界进入 AgentOS 的证据接口，后面的 verify_target() 就靠它闭环。',
  },
  {
    id: 'interaction',
    name: 'Interaction',
    kind: 'Human I/O',
    calls: ['listen()', 'speak()', 'clarify()'],
    question: '机器人怎么和人沟通？',
    pipeline: ['Human Input', 'Listen / ASR', 'Dialogue State', 'Confirm / Clarify / Interrupt', 'AgentOS Decision'],
    evidence: ['confidence', 'user confirmation', 'clarification request', 'interruption'],
    takeaway: 'Interaction 不只是说话，而是在任务意图不确定时把人重新拉进执行闭环。',
  },
];

export const Ch2SkillContractLab: React.FC<WidgetProps> = () => {
  const [activeSkill, setActiveSkill] = useState<SkillId>('holonavi');
  const selectedSkill = toolbox.find((tool) => tool.id === activeSkill) ?? toolbox[0];

  return (
    <div className="sysview" aria-label="HoloAgent-0 三层系统概览">
      <div className="sysview-flow">
        <span>User Intent</span>
        <span className="sysview-arrow">→</span>
        <span>Retrieve Memory</span>
        <span className="sysview-arrow">→</span>
        <span>Skill Graph</span>
        <span className="sysview-arrow">→</span>
        <span>Execute</span>
        <span className="sysview-arrow">→</span>
        <span>Monitor</span>
        <span className="sysview-arrow">→</span>
        <span>Update</span>
        <span className="sysview-arrow loop">↺</span>
      </div>

      <figure className="sysview-official">
        <div className="sysview-official-copy">
          <b>官方框架图怎么读？</b>
          <span>抓住三层：AgentOS 决策，Memory 提供世界上下文，Skills 执行动作；运行时反馈会回流到 Memory 和 AgentOS。</span>
        </div>
        <img src="images/holoagent-framework.png" alt="HoloAgent-0 official framework: AgentOS, memory layer, embodied skill layer and feedback loops" />
        <figcaption>
          Source:{' '}
          <a href="https://horizonrobotics.github.io/robot_lab/holoagent/#overview" target="_blank" rel="noreferrer">
            HoloAgent project page / paper framework figure
          </a>
        </figcaption>
      </figure>

      <div className="sysview-layers">
        {layers.map((layer, index) => (
          <section className={`sysview-layer layer-${index + 1}`} key={layer.title}>
            <div className="sysview-index">0{index + 1}</div>
            <div>
              <h5>{layer.title}</h5>
              <div className="sysview-role">{layer.role}</div>
              <p>{layer.desc}</p>
              <div className="sysview-chips">
                {layer.chips.map((chip) => (
                  <span key={chip}>{chip}</span>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="sysview-loop">
        <div>
          <b>闭环关系</b>
          <span>AgentOS 不直接输出低层机器人控制，而是读取 Memory、调用 Embodied Skills，并根据运行时反馈决定继续、重试或重新规划。</span>
        </div>
      </div>

      <div className="sysview-interface" aria-label="类型化技能接口">
        <div className="sysview-interface-title">
          <b>Typed + Monitored Skill Interface</b>
          <span>Physical execution is not just true / false.</span>
        </div>
        <section className="software">
          <div className="sysview-mini-title">Software API</div>
          <code>Search(query)</code>
          <span className="sysview-down">↓</span>
          <div className="sysview-result clean">Result</div>
        </section>
        <section className="embodied">
          <div className="sysview-mini-title">Embodied Skill</div>
          <code>move_to(kitchen)</code>
          <span className="sysview-down">↓</span>
          <div className="sysview-status-grid">
            {statusFields.map(([key, value]) => (
              <div key={key}>
                <b>{key}</b>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </section>
        <p>Typed Skill 不把物理执行压成 true / false，而是把进度、失败类型、置信度和可恢复性作为运行时证据交给 AgentOS。</p>
      </div>

      <div className="sysview-toolbox" aria-label="技能工具箱">
        <div className="sysview-toolbox-head">
          <div>
            <div className="sysview-mini-title">Skill Toolbox</div>
            <b>Click a Skill to see how AgentOS uses it</b>
          </div>
          <span>Different backends, same execution contract.</span>
        </div>
        <div className="sysview-tools">
          {toolbox.map((tool) => (
            <button
              key={tool.name}
              type="button"
              className={activeSkill === tool.id ? 'selected' : ''}
              aria-pressed={activeSkill === tool.id}
              onClick={() => setActiveSkill(tool.id)}
            >
              <h5>{tool.name}</h5>
              <small>{tool.kind}</small>
              <div>
                {tool.calls.map((call) => (
                  <span key={call}>{call}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
        <div className="skill-detail">
          <section className="skill-detail-main">
            <small>{selectedSkill.name}</small>
            <b>{selectedSkill.question}</b>
            <div className="skill-pipeline">
              {selectedSkill.id === 'holomotion' ? (
                <>
                  <span>High-level Goal</span>
                  <i>→</i>
                  <div className="skill-mode-branch">
                    <span>Motion Tracking</span>
                    <span>Velocity Tracking</span>
                  </div>
                  <i>→</i>
                  <span>Whole-body Execution</span>
                  <i>→</i>
                  <span>Runtime Status</span>
                </>
              ) : (
                selectedSkill.pipeline.map((item, index) => (
                  <React.Fragment key={item}>
                    <span>{item}</span>
                    {index < selectedSkill.pipeline.length - 1 ? <i>→</i> : null}
                  </React.Fragment>
                ))
              )}
            </div>
            <p>{selectedSkill.takeaway}</p>
          </section>
          <section className="skill-evidence">
            <small>Runtime Status</small>
            <div>
              {selectedSkill.evidence.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </section>
        </div>
        <div className="sysview-same">
          <b>Command → Execute → Status → Verify → Recover</b>
          <span>AgentOS 不依赖底层能力的具体实现：VLA、运动模型或传统控制器都可通过统一 Skill 接口接入。</span>
        </div>
        <div className="cross-embodiment">
          <section>
            <b>Mobile Robot</b>
            <span>HoloNavi</span>
          </section>
          <div>
            <i>shared memory / status / typed skills</i>
            <strong>AgentOS</strong>
          </div>
          <section>
            <b>Humanoid</b>
            <span>HoloMotion</span>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Ch2SkillContractLab;
