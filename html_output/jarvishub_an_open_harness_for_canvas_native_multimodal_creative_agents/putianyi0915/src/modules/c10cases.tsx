import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// §10 模块 10.1「三个长期任务案例」（图文浏览）
// 图源：用户提供的原文配图，存放于 public/images/fig4..fig9.png
//   fig4/fig5 = 叙事媒体生成（工作区轨迹 / 最终产物）
//   fig6/fig7 = 交互式网页开发
//   fig8/fig9 = 演示文稿生成
// 文案依论文 §3.3 Qualitative Results 与 Figure 4–9 的图注重写。

interface CaseShot {
  src: string;
  cap: string;
}

interface CaseDef {
  id: string;
  name: string;
  brief: string;
  trace: CaseShot;
  artifact: CaseShot;
  note: string;
}

const CASES: CaseDef[] = [
  {
    id: 'narrative',
    name: '叙事媒体生成',
    brief: '「生成一部关于『牛仔机器人僵尸拾荒者』的短剧。」',
    trace: {
      src: './images/fig4.png',
      cap: '工作区轨迹：任务简报、策划笔记、视觉参考、镜头候选、依赖连线与智能体进度',
    },
    artifact: {
      src: './images/fig5.png',
      cap: '最终产物：经画布管理的流程产出的关键帧，角色、场景线索与跨镜头动作保持连续',
    },
    note: '论文用这个案例检验叙事规划、身份保持、风格一致与跨镜头连续性。',
  },
  {
    id: 'web',
    name: '交互式网页开发',
    brief: '「做一个个人摄影网站，风格参考 Awwwards，轻量、好看、动效丰富。」',
    trace: {
      src: './images/fig6.png',
      cap: '工作区轨迹：需求简报、视觉参考、布局草稿、实现产物、预览与修订状态',
    },
    artifact: {
      src: './images/fig7.png',
      cap: '最终产物：网页各屏，字体、图片位置、页面结构与视觉方向保持一致',
    },
    note: '论文用这个案例检验布局设计、交互逻辑、前端代码、预览检视与迭代修订之间的协同。',
  },
  {
    id: 'deck',
    name: '演示文稿生成',
    brief: '「做一份机器学习中决策树的 PPT，风格像 Stanford 的课堂讲义。」',
    trace: {
      src: './images/fig8.png',
      cap: '工作区轨迹：讲义内容、生成图示、幻灯片草稿、依赖连线、PPT 预览与修订状态',
    },
    artifact: {
      src: './images/fig9.png',
      cap: '最终产物：各页幻灯片，版式、图示风格、强调色与页面级组织保持一致',
    },
    note: '论文用这个案例检验内容取舍、叙事组织、页面布局、视觉综合与跨页一致性。',
  },
];

const PROMPT = '选择上面任意一个任务，查看它的工作区轨迹与最终产物。';

export const Ch10Cases: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [sel, setSel] = useState<number | null>(null);
  const [feedback, setFeedback] = useState({ text: PROMPT, cls: '' });

  const pick = (i: number) => {
    setSel(i);
    setFeedback({
      text: `${CASES[i].name}：画布上同时保留过程材料与最终产物，两者可以对照着看。`,
      cls: 'good',
    });
  };

  const active = sel === null ? null : CASES[sel];

  return (
    <div id={`cv-${chapterId}-${moduleId}`}>
      <div className="chip-row">
        {CASES.map((c, i) => (
          <button
            key={c.id}
            type="button"
            className={`chip ${sel === i ? 'selected' : ''}`}
            onClick={() => pick(i)}
          >
            {c.name}
          </button>
        ))}
        <button
          type="button"
          className="chip"
          onClick={() => {
            setSel(null);
            setFeedback({ text: PROMPT, cls: '' });
          }}
          style={sel === null ? { opacity: 0.55 } : undefined}
        >
          重置
        </button>
      </div>

      {active ? (
        <div style={{ marginTop: 12 }}>
          <div className="module-desc" style={{ marginBottom: 4 }}>
            {active.brief}
          </div>
          <div className="pp-case-figs">
            <figure>
              <img src={active.trace.src} alt={`${active.name} 工作区轨迹`} loading="lazy" />
              <figcaption>
                <b>工作区轨迹</b>
                <br />
                {active.trace.cap}
              </figcaption>
            </figure>
            <figure>
              <img src={active.artifact.src} alt={`${active.name} 最终产物`} loading="lazy" />
              <figcaption>
                <b>最终产物</b>
                <br />
                {active.artifact.cap}
              </figcaption>
            </figure>
          </div>
          <div className="pp-case-note">{active.note}</div>
        </div>
      ) : (
        <div className="pp-case-empty">先从上面选一个任务。</div>
      )}

      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch10Cases;
