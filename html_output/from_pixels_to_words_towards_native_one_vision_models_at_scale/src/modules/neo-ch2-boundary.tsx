import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { FeatureGrid, ModularPipeline, ProjectorMark, StreetThumbnail, type EvidenceFocus } from './neo-ch2-shared';

type QuestionKey = Exclude<EvidenceFocus, 'none'>;

const questions: Array<{
  id: QuestionKey;
  label: string;
  target: string;
  requirement: string;
  evidence: string;
  answer: string;
}> = [
  { id: 'where', label: '红色汽车停在哪里？', target: '红色汽车', requirement: '位置', evidence: '道路 · 路口 · 相对空间关系', answer: '红色汽车停在道路右侧、靠近路口的位置。' },
  { id: 'color', label: '汽车是什么颜色？', target: '汽车', requirement: '颜色', evidence: '汽车的红色外观', answer: '汽车是红色的。' },
  { id: 'nearby', label: '汽车附近有什么？', target: '汽车', requirement: '邻近关系', evidence: '路口 · 建筑', answer: '汽车附近有路口和一栋建筑。' },
];

function StableVisualFront() {
  return (
    <div className="ch22-stable-front" aria-label="保持不变的视觉前端">
      <div><StreetThumbnail /><span>同一张图片</span></div><b aria-hidden="true">→</b>
      <div><FeatureGrid /><span>Vision Encoder</span></div><b aria-hidden="true">→</b>
      <div><ProjectorMark /><span>Projector / Adapter</span></div><b aria-hidden="true">→</b>
      <div className="is-result"><span className="ch22-visual-representation">视觉表示</span><span>编码后的视觉表示</span></div>
    </div>
  );
}

export const NeoCh2Boundary: React.FC<WidgetProps> = () => {
  const [question, setQuestion] = useState<QuestionKey>('where');
  const [hasSwitched, setHasSwitched] = useState(false);
  const current = questions.find((item) => item.id === question) ?? questions[0];

  const switchQuestion = (next: QuestionKey) => {
    if (next !== question) setHasSwitched(true);
    setQuestion(next);
  };

  return (
    <div className="ch2-experiment ch2-route-experiment ch2-boundary-experiment">
      <div className="ch2-experiment-kicker">互动实验 · 换一个问题，前面的视觉处理会跟着改变吗？</div>
      <p className="ch22-helper">保持街景和 modular pipeline 不变，只切换用户问题，观察证据重点、LLM 关注点与回答怎样同步变化。</p>

      <div className="ch22-question-switch" role="group" aria-label="切换用户问题">
        {questions.map((item) => (
          <button type="button" key={item.id} className={question === item.id ? 'is-active' : ''} aria-pressed={question === item.id} onClick={() => switchQuestion(item.id)}>{item.label}</button>
        ))}
      </div>

      <ModularPipeline question={current.label} active="llm" />

      <div className="ch22-constant-block">
        <div className="ch22-block-label"><span>保持不变</span><b>视觉前端仍走同一条独立编码路径</b></div>
        <StableVisualFront />
      </div>

      <div className="ch22-observation" aria-live="polite">
        <div className="ch22-evidence-view">
          <div className="ch22-block-label"><span>随问题变化</span><b>当前问题需要关注的视觉证据</b></div>
          <StreetThumbnail detailed focus={current.id} />
          <small>教学高亮，用来展示当前问题相关的证据；不代表 Vision Encoder 接收了问题。</small>
        </div>
        <div className="ch22-llm-focus">
          <span className="ch22-focus-eyebrow">LLM 当前需要组合</span>
          <dl>
            <div><dt>目标</dt><dd>{current.target}</dd></div>
            <div><dt>问题要求</dt><dd>{current.requirement}</dd></div>
            <div><dt>相关视觉证据</dt><dd>{current.evidence}</dd></div>
          </dl>
          <div className="ch22-answer"><span>回答</span><b>{current.answer}</b></div>
        </div>
      </div>

      {hasSwitched ? (
        <div className="ch22-paper-motivation" aria-live="polite">
          <p className="ch22-observed"><b>观察：</b>问题变了，需要关注的视觉证据也变了；但视觉输入仍然先经过同一条独立编码链路。</p>
          <h5>这正是论文重新追问的结构边界</h5>
          <p className="ch22-research-question">如果不同问题需要利用不同的细粒度视觉证据，视觉是否必须在语言问题参与之前，就先经过独立 Vision Encoder 和 Projector？</p>
        </div>
      ) : (
        <p className="ch22-switch-prompt">换一个问题，再比较哪些信息保持不变、哪些证据重点发生变化。</p>
      )}
    </div>
  );
};
