import { useState } from 'react';
import type { WidgetProps } from './registry';

const STAGE_LABELS = [
  { title: '① 学会在线生成', overview: '学会在线生成', goal: '能不能上线', paper: 'Teacher Forcing', tone: 'online' },
  { title: '② 让生成更快', overview: '让生成更快', goal: '跑得够不够快', paper: 'ODE Distillation', tone: 'speed' },
  { title: '③ 长时间运行中学会纠偏', overview: '长期自滚动 + 教师监督', goal: '跑久了稳不稳定', paper: 'LongForcing', tone: 'long' },
] as const;

function Overview({ onSelect }: { onSelect: (stage: number) => void }) {
  return (
    <div className="chap6-quest-overview" aria-label="三步让模型能上线、跑得快、跑得久">
      <div className="chap6-quest-path" aria-hidden="true" />
      {STAGE_LABELS.map((item, index) => (
        <button type="button" className={item.tone} key={item.title} onClick={() => onSelect(index + 1)}>
          <span>{index + 1}</span>
          <strong>{item.overview}</strong>
          <b>解决：{item.goal}</b>
          <small>论文名称：{item.paper}</small>
        </button>
      ))}
      <p>先满足在线生成的因果约束，再减少生成计算，最后练习长时间运行时会遇到的历史。</p>
    </div>
  );
}

function OnlineStage() {
  return (
    <div className="chap6-quest-stage chap6-online-stage">
      <header>
        <span>第一关</span>
        <strong>① 学会在线生成</strong>
        <b>不能偷看未来</b>
      </header>
      <div className="chap6-time-permission" aria-label="教师训练与在线模型可见时间范围对比">
        <div className="teacher">
          <span>教师训练时</span>
          <div><i>过去</i><i>过去</i><i className="current">当前</i><i className="future">未来</i><i className="future">未来</i></div>
          <strong>过去、当前、未来都可以使用</strong>
        </div>
        <div className="online">
          <span>在线模型</span>
          <div><i>过去</i><i>过去</i><i className="current">当前</i><i className="locked">🔒</i><i className="locked">🔒</i></div>
          <strong>只能读取过去和当前；未来画面尚未发生</strong>
        </div>
      </div>
      <p>真正在线生成时，未来画面还没有发生，所以模型必须学会只根据已经发生的画面继续生成下一段。</p>
      <div className="chap6-stage-answer"><span>解决</span><strong>能不能上线</strong><small>论文名称：Teacher Forcing</small></div>
    </div>
  );
}

function SpeedStage() {
  return (
    <div className="chap6-quest-stage chap6-speed-stage">
      <header>
        <span>第二关</span>
        <strong>② 让生成更快</strong>
        <b>把很多计算步骤压缩成更少步骤</b>
      </header>
      <div className="chap6-step-compression" aria-label="生成步骤压缩示意">
        <div className="many">
          <span>原来</span>
          <div><i /><b>→</b><i /><b>→</b><i /><b>→</b><i /><b>→</b><i /><b>→</b><strong>视频</strong></div>
        </div>
        <div className="few">
          <span>压缩后</span>
          <div><i /><b>⟶</b><i /><b>⟶</b><strong>视频</strong></div>
        </div>
        <small>机制示意，用于表达“减少推理步骤”，不代表论文规定的固定步数。</small>
      </div>
      <p>已经能在线生成后，还需要减少每一段视频的生成计算量，否则交互速度仍然不够快。</p>
      <div className="chap6-stage-answer"><span>解决</span><strong>跑得够不够快</strong><small>论文名称：ODE Distillation</small></div>
    </div>
  );
}

function LongStage() {
  return (
    <div className="chap6-quest-stage chap6-long-stage">
      <header>
        <span>第三关</span>
        <strong>③ 长时间运行中学会纠偏</strong>
        <b>先让学生真的跑一段长 self-rollout，再让扩展视野教师针对这段长期历史提供监督。</b>
      </header>
      <div className="chap6-longforcing-visual" aria-label="学生长期自滚动并接受扩展视野教师监督">
        <div className="chap6-extended-teacher">
          <span>扩展视野教师</span>
          <strong>在更长时间范围上提供监督与纠偏信号</strong>
          <small>extended-horizon teacher</small>
        </div>
        <div className="chap6-teacher-signals" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="chap6-student-rollout">
          <div className="round clean">
            <small>输入：真实历史</small>
            <span>学生模型</span><b>→</b><strong>A</strong>
            <em>↺ 写回 History</em>
          </div>
          <div className="round generated">
            <small>输入：历史 + A</small>
            <span>学生模型</span><b>→</b><strong>B</strong>
            <em>↺ 写回 History</em>
          </div>
          <div className="round generated">
            <small>输入：历史 + A + B</small>
            <span>学生模型</span><b>→</b><strong>C</strong>
            <em>↺ 写回 History</em>
          </div>
          <div className="round generated">
            <small>继续读取自生成历史</small>
            <span>学生模型</span><b>→</b><strong>D</strong>
            <em>↺ 继续运行</em>
          </div>
        </div>
        <div className="chap6-rollout-axis">
          <span>学生长期自滚动</span>
          <strong>A → B → C → D → …</strong>
          <small>student long self-rollout</small>
        </div>
        <p>老师不是逐帧把学生生成结果替换成自己的答案，而是在长期分布层面提供监督，使学生的自滚动分布向更稳定的教师分布靠近。</p>
        <small className="chap6-alignment-term">次级术语：distribution alignment（分布对齐）</small>
      </div>
      <p>模型运行得越久，输入里越多是自己之前生成的内容。LongForcing 先让学生面对长期自生成历史，再由扩展视野教师在这一长期分布上提供监督，从而缓解训练—部署分布错位和自回归漂移，而不是保证完全不漂移。</p>
      <div className="chap6-stage-answer"><span>解决</span><strong>跑久了稳不稳定</strong><small>论文名称：LongForcing</small></div>
      <div className="chap6-long-key">LongForcing 的关键不是只让学生滚得更长，而是让学生在自己长期生成的历史上继续接受教师监督。</div>
    </div>
  );
}

export const ChapterSixDistillationStages = (_props: WidgetProps) => {
  const [stage, setStage] = useState(0);

  return (
    <div className="chapter-six-distillation chap6-three-quests" data-stage={stage}>
      <div className="chap6-quest-tabs" role="tablist" aria-label="三阶段训练路线">
        <button type="button" className={stage === 0 ? 'active overview' : 'overview'} role="tab" aria-selected={stage === 0} onClick={() => setStage(0)}>
          <span>总览</span><strong>三步闯关</strong>
        </button>
        {STAGE_LABELS.map((item, index) => (
          <button
            type="button"
            className={`${item.tone}${stage === index + 1 ? ' active' : ''}`}
            role="tab"
            aria-selected={stage === index + 1}
            key={item.title}
            onClick={() => setStage(index + 1)}
          >
            <span>{index + 1}/3</span><strong>{item.overview}</strong><small>{item.goal}</small>
          </button>
        ))}
      </div>

      <div className="chap6-quest-body" role="tabpanel">
        {stage === 0 ? <Overview onSelect={setStage} /> : null}
        {stage === 1 ? <OnlineStage /> : null}
        {stage === 2 ? <SpeedStage /> : null}
        {stage === 3 ? <LongStage /> : null}
      </div>

      <div className="chap6-stage-nav">
        <button type="button" disabled={stage === 0} onClick={() => setStage((current) => Math.max(0, current - 1))}>上一阶段</button>
        <span>{stage === 0 ? '三步总览' : `当前 ${stage}/3`}</span>
        <button type="button" disabled={stage === 3} onClick={() => setStage((current) => Math.min(3, current + 1))}>下一阶段</button>
      </div>

      <div className="chap6-chinese-summary">
        <strong>第一步解决能不能上线，第二步解决跑得够不够快，第三步解决跑久了稳不稳定。</strong>
        <div><span>能上线</span><b>→</b><span>跑得快</span><b>→</b><span>跑得久</span></div>
      </div>
    </div>
  );
};
