import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { PAL } from './kit';

type View = 'robot' | 'web' | 'mix';
type RatioModel = 'pali' | 'palm';

const robotStats = [
  { value: '13', label: '台机器人', note: '不是单机演示，而是多台机器人共同采集' },
  { value: '17', label: '个月', note: '长期采集，覆盖长时间跨度' },
  { value: '1', label: '间办公室厨房', note: '同一环境，便于基线公平对照' },
];

const webStats = [
  { value: '约 10B', label: '图文对', note: 'WebLI 原始规模' },
  { value: '109', label: '种语言', note: '跨语言、跨场景的网页知识' },
  { value: '约 1B', label: '训练样本', note: '按跨模态相似度筛选前 10%' },
];

const skills = [
  'Pick Object',
  'Move Object Near Object',
  'Place Object Upright',
  'Knock Object Over',
  'Open Drawer',
  'Close Drawer',
  'Place Object into Receptacle',
  'Pick Object from Receptacle and place on counter',
];

const webKinds = [
  { name: 'VQA', desc: '看图回答问题，提供问答能力' },
  { name: 'Captioning', desc: '给图像写描述，学习物体与场景关系' },
  { name: 'Interleaved', desc: '图文交错长文档，保留上下文知识' },
];

const ratios: Record<RatioModel, { name: string; robot: number; web: number; text: string }> = {
  pali: {
    name: 'RT-2-PaLI-X',
    robot: 50,
    web: 50,
    text: '机器人数据约占共同微调混合的 50%，网页数据约占 50%。',
  },
  palm: {
    name: 'RT-2-PaLM-E',
    robot: 66,
    web: 34,
    text: '机器人数据约占共同微调混合的 66%，网页数据约占 34%。',
  },
};

export const DataProvenance: React.FC<WidgetProps> = () => {
  const [view, setView] = useState<View>('robot');
  const [ratioModel, setRatioModel] = useState<RatioModel>('pali');
  const ratio = ratios[ratioModel];

  return (
    <div className="dp51">
      <div className="dp51-stat-grid">
        {(view === 'web' ? webStats : robotStats).map((item) => (
          <div className="dp51-stat" key={item.label}>
            <strong>{item.value}</strong>
            <b>{item.label}</b>
            <small>{item.note}</small>
          </div>
        ))}
      </div>

      <div className="rt2-controls">
        <button type="button" className={`rt2-btn ${view === 'robot' ? 'is-active' : ''}`} onClick={() => setView('robot')}>
          机器人轨迹
        </button>
        <button type="button" className={`rt2-btn ${view === 'web' ? 'is-active' : ''}`} onClick={() => setView('web')}>
          网页语料
        </button>
        <button type="button" className={`rt2-btn ${view === 'mix' ? 'is-active' : ''}`} onClick={() => setView('mix')}>
          共同微调配比
        </button>
      </div>

      {view === 'robot' ? (
        <div className="dp51-grid">
          <section className="dp51-card">
            <div className="dp51-card-head">
              <h4>13 台机器人：采集规模</h4>
              <span>同一批机器人演示</span>
            </div>
            <div className="dp51-robot-grid">
              {Array.from({ length: 13 }).map((_, index) => (
                <div className="dp51-robot" key={index}>
                  <span>{index + 1}</span>
                </div>
              ))}
            </div>
            <p className="dp51-small">每台机器人贡献的不是网页标签，而是带图像、指令和连续动作的真实演示轨迹。</p>
          </section>

          <section className="dp51-card">
            <div className="dp51-card-head">
              <h4>17 个月：时间跨度</h4>
              <span>同一间办公室厨房</span>
            </div>
            <div className="dp51-month-bar" aria-label="17 个月时间跨度示意">
              {Array.from({ length: 17 }).map((_, index) => <i key={index} />)}
            </div>
            <p className="dp51-small">色块只表示 17 个月的时间跨度，不表示每个月的数据量；论文没有给出逐月数量。</p>
            <div className="dp51-instruction">
              <b>指令结构</b>
              <span>动词 + 一个或多个名词</span>
              <code>pick 7up can</code>
              <code>open drawer</code>
            </div>
          </section>

          <section className="dp51-card dp51-wide">
            <div className="dp51-card-head">
              <h4>附录列出的技能</h4>
              <span>自然语言指令标注</span>
            </div>
            <div className="dp51-skill-list">
              {skills.map((skill) => <span key={skill}>{skill}</span>)}
            </div>
          </section>
        </div>
      ) : null}

      {view === 'web' ? (
        <div className="dp51-grid">
          <section className="dp51-card">
            <div className="dp51-card-head">
              <h4>网页语料提供什么</h4>
              <span>广而多样</span>
            </div>
            <div className="dp51-kind-list">
              {webKinds.map((kind) => (
                <div key={kind.name}>
                  <b>{kind.name}</b>
                  <span>{kind.desc}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="dp51-card">
            <div className="dp51-card-head">
              <h4>和机器人数据的差别</h4>
              <span>语义 vs 动作</span>
            </div>
            <div className="dp51-compare">
              <div className="is-web">
                <b>网页语料</b>
                <span>物体、关系、常识、语言理解</span>
              </div>
              <div className="is-robot">
                <b>机器人轨迹</b>
                <span>真实动作、执行反馈、操作技能</span>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {view === 'mix' ? (
        <section className="dp51-card dp51-ratio-card">
          <div className="dp51-card-head">
            <h4>共同微调：两类数据都要保留</h4>
            <span>附录 B 给出约数</span>
          </div>
          <div className="dp51-model-toggle">
            {(['pali', 'palm'] as RatioModel[]).map((key) => (
              <button
                type="button"
                key={key}
                className={`rt2-btn ${ratioModel === key ? 'is-active' : ''}`}
                onClick={() => setRatioModel(key)}
              >
                {ratios[key].name}
              </button>
            ))}
          </div>
          <div className="dp51-ratio-bar" aria-label={`${ratio.name} 数据配比`}>
            <span style={{ width: `${ratio.robot}%`, background: PAL.orange }}>机器人 {ratio.robot}%</span>
            <span style={{ width: `${ratio.web}%`, background: PAL.blue }}>网页 {ratio.web}%</span>
          </div>
          <p className="dp51-small">{ratio.text} 配比为约数，不应写成精确固定值。</p>
        </section>
      ) : null}

      <section className="dp51-card dp51-fair">
        <div className="dp51-card-head">
          <h4>公平对照口径</h4>
          <span>所有基线共用同一批机器人数据</span>
        </div>
        <div className="dp51-fair-list">
          <span>同一间办公室厨房</span>
          <span>同一套 7-DoF 动作空间</span>
          <span>同一套指令格式</span>
          <span>差异来自如何使用网页知识，而不是谁拥有更多机器人数据</span>
        </div>
      </section>
    </div>
  );
};

export default DataProvenance;
