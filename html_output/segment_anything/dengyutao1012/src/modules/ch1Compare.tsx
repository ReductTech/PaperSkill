import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// 第1章：旧方法（手工标注专用模型） vs SAM（单点提示）—— 漫画双面板 + 点击高亮对比
type Side = 'old' | 'new';

const OLD_STEPS = [
  ['✏️', '人工描边 · 逐物体标注', '沿每个物体边缘一笔一笔描，又慢又贵'],
  ['🛠️', '为该数据集训练专用模型', '只在这批数据上生效'],
  ['🔁', '换新域要重新标注 + 重训', '几乎无法迁移，从头再来'],
];
const NEW_STEPS = [
  ['⚡', '一个前景点提示', '毫秒级响应'],
  ['🖼️', '实时返回整块掩码', '可反复编辑、即时反馈'],
  ['🌐', '同一模型任意新域可用', '训练一次，处处可提示'],
];

const FEED: Record<Side, { cls: string; text: string }> = {
  old: {
    cls: 'bad',
    text: '旧方法：人工沿边缘描边、逐物体标注，再训练只在该数据集有效的专用模型——又慢又贵，换新域就得重来。',
  },
  new: {
    cls: 'good',
    text: 'SAM：一个前景点即可返回整块有效掩码，实时交互；同一模型靠提示即可适配任意新数据集 / 新任务。',
  },
};

export const Ch1Compare: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [side, setSide] = useState<Side>('old');
  return (
    <div>
      <div className="cmp-row">
        <div
          className={`cmp-panel old ${side === 'old' ? 'hot' : 'dim'}`}
          onClick={() => setSide('old')}
          role="button"
          tabIndex={0}
        >
          <div className="cmp-head old">✎ 旧方法 · 手工标注</div>
          <img className="cmp-img" src="./images/comic-12.jpg" alt="旧方法手工标注" />
          <ul className="cmp-steps">
            {OLD_STEPS.map(([ico, t, s], k) => (
              <li key={k}>
                <span className="cmp-ico">{ico}</span>
                <span className="cmp-t">
                  {t}
                  <em>{s}</em>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div
          className={`cmp-panel new ${side === 'new' ? 'hot' : 'dim'}`}
          onClick={() => setSide('new')}
          role="button"
          tabIndex={0}
        >
          <div className="cmp-head new">⚡ SAM · 单点提示</div>
          <img className="cmp-img" src="./images/comic-13.jpg" alt="SAM 单点提示" />
          <ul className="cmp-steps">
            {NEW_STEPS.map(([ico, t, s], k) => (
              <li key={k}>
                <span className="cmp-ico">{ico}</span>
                <span className="cmp-t">
                  {t}
                  <em>{s}</em>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="ctrl">
        <button className={side === 'old' ? 'btn on' : 'btn'} onClick={() => setSide('old')}>
          ✎ 旧方法：手工标注
        </button>
        <button className={side === 'new' ? 'btn on' : 'btn'} onClick={() => setSide('new')}>
          ⚡ SAM：单点提示
        </button>
      </div>
      <div className={`feedback ${FEED[side].cls}`}>{FEED[side].text}</div>
    </div>
  );
};

export default Ch1Compare;
