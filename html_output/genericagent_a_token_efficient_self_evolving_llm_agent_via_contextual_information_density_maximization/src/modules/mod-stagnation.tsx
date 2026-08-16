import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const MAX_EPISODES = 4;

export const ModStagnation: React.FC<WidgetProps> = () => {
  const [episodes, setEpisodes] = useState(1);

  return (
    <div className="stagnation-demo">
      <div className="stagnation-question">
        <span>第二个挑战</span>
        <h4>任务成功过一次，为什么下次仍然从零开始？</h4>
        <p>如果成功策略只存在于当前会话，它会在上下文过期后一起消失。</p>
      </div>

      <div className="episode-row" aria-label="相似任务的重复执行">
        {Array.from({ length: MAX_EPISODES }, (_, index) => {
          const active = index < episodes;
          return (
            <React.Fragment key={index}>
              <div className={`episode-card ${active ? 'active' : ''}`}>
                <b>Task #{index + 1}</b>
                <span>Explore</span><i>↓</i><span>Fail</span><i>↓</i><span>Retry</span><i>↓</i><span>Success</span>
                <small>{active ? '本轮学会了路径' : '等待执行'}</small>
              </div>
              {index < MAX_EPISODES - 1 ? (
                <div className={`episode-gap ${index < episodes - 1 ? 'expired' : ''}`}>
                  <span>会话结束</span><b>经验过期</b><span>↯</span>
                </div>
              ) : null}
            </React.Fragment>
          );
        })}
      </div>

      <div className="stagnation-metrics">
        <section>
          <div className="metric-title"><span>累计 Token</span><b>{episodes * 100} units</b></div>
          <div className="linear-bars">
            {Array.from({ length: MAX_EPISODES }, (_, index) => <i key={index} className={index < episodes ? 'active' : ''} />)}
          </div>
          <small>任务数增加，探索成本近似线性累积</small>
        </section>
        <section>
          <div className="metric-title"><span>可复用能力</span><b>flat</b></div>
          <div className="flat-line"><i /></div>
          <small>成功路径没有跨会话沉淀，能力保持不变</small>
        </section>
      </div>

      <div className="ctrl">
        <button className="chip selected" disabled={episodes >= MAX_EPISODES} onClick={() => setEpisodes((value) => Math.min(MAX_EPISODES, value + 1))}>
          运行下一个相似任务
        </button>
        <button className="chip" onClick={() => setEpisodes(1)}>重置</button>
        <span className="val">{episodes} / {MAX_EPISODES}</span>
      </div>

      <div className={`feedback ${episodes === MAX_EPISODES ? 'bad' : ''}`}>
        {episodes === MAX_EPISODES
          ? '这就是经验停滞：token 支出随任务数增长，已经找到的有效策略却没有成为下一次任务的起点。GA 后续用分层记忆与经验巩固打破这个循环。'
          : '继续运行相似任务：每个新会话都会遗忘上一次的成功路径，再次经历探索、失败和重试。'}
      </div>
    </div>
  );
};
