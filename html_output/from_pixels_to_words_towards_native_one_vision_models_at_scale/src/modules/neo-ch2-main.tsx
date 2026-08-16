import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { AlignedTokens, FeatureGrid, ModularPipeline, StreetThumbnail, type PipelineNode } from './neo-ch2-shared';

const QUESTION = '红色汽车停在哪里？';
const ANSWER = '红色汽车停在道路右侧、靠近路口的位置。';

function ProcessArrow() {
  return <div className="ch21-process-arrow" aria-hidden="true">→</div>;
}

function ImageDetail() {
  return (
    <div className="ch21-detail ch21-image-detail">
      <div className="ch21-image-source">
        <h5>视觉输入</h5><StreetThumbnail detailed />
        <p>图片提供红色汽车、道路、路口和建筑等原始视觉信息。</p>
      </div>
      <ProcessArrow />
      <div className="ch21-next-step"><h5>接下来</h5><p>图片先交给独立的 Vision Encoder，转换成视觉表示。</p></div>
    </div>
  );
}

function EncoderDetail() {
  return (
    <div className="ch21-detail">
      <div className="ch21-process-flow">
        <div><span>街景图片</span><StreetThumbnail detailed /></div><ProcessArrow />
        <div className="ch21-process-module"><small>教学示意</small><strong>Vision Encoder</strong></div><ProcessArrow />
        <div><span>视觉表示</span><FeatureGrid /></div>
      </div>
      <p className="ch21-detail-copy">Vision Encoder 独立处理图片，把像素转换成供后续模块使用的视觉表示。</p>
    </div>
  );
}

function ProjectorDetail() {
  return (
    <div className="ch21-detail">
      <div className="ch21-process-flow">
        <div><span>来自 Vision Encoder</span><FeatureGrid /></div><ProcessArrow />
        <div className="ch21-process-module"><strong>Projector / Adapter</strong></div><ProcessArrow />
        <div><span>可送入 LLM 的视觉表示</span><AlignedTokens /></div>
      </div>
      <p className="ch21-detail-copy">Projector / Adapter 将视觉表示映射为语言模型能够接收的表示形式。</p>
    </div>
  );
}

function LlmDetail() {
  return (
    <div className="ch21-detail ch21-llm-detail">
      <div className="ch21-llm-inputs">
        <div className="ch21-llm-input is-visual"><span>来自 Projector 的视觉表示</span><AlignedTokens /><i aria-hidden="true">↓</i></div>
        <div className="ch21-llm-input is-question"><span>用户问题</span><b>“{QUESTION}”</b><i aria-hidden="true">↓</i></div>
      </div>
      <div className="ch21-llm-core"><strong>LLM</strong><span>理解 · 推理 · 生成</span></div>
      <div className="ch21-llm-down" aria-hidden="true">↓</div>
      <div className="ch21-reasoning-demo">
        <small>教学示意：这些标签帮助理解信息组合，并非论文规定的内部模块</small>
        <div><span><b>目标</b>红色汽车</span><span><b>问题要求</b>位置</span><span><b>相关视觉证据</b>道路右侧 · 靠近路口</span></div>
      </div>
      <div className="ch21-llm-down" aria-hidden="true">↓</div>
      <div className="ch21-answer-result">{ANSWER}</div>
      <p className="ch21-detail-copy">视觉表示与用户问题在 LLM 中汇合，共同参与理解、推理与回答。</p>
    </div>
  );
}

function AnswerDetail() {
  return (
    <div className="ch21-detail ch21-answer-detail">
      <h5>最终回答</h5><div className="ch21-final-answer">{ANSWER}</div>
      <div className="ch21-answer-source"><span>视觉信息</span><b>+</b><span>用户问题</span><i>↓</i><strong>语言回答</strong></div>
    </div>
  );
}

function ActiveDetail({ active }: { active: PipelineNode }) {
  if (active === 'image') return <ImageDetail />;
  if (active === 'encoder') return <EncoderDetail />;
  if (active === 'projector') return <ProjectorDetail />;
  if (active === 'llm') return <LlmDetail />;
  return <AnswerDetail />;
}

export const NeoCh2Main: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState<PipelineNode>('image');

  return (
    <div className="ch2-experiment ch2-route-experiment">
      <div className="ch2-experiment-kicker">互动实验 · 点击一个节点，查看信息在这一步如何继续向前流动</div>
      <ModularPipeline active={active} question={QUESTION} onSelect={setActive} />
      <div className="ch21-active-detail" aria-live="polite"><ActiveDetail active={active} /></div>
      <div className="ch2-module-takeaway">传统 modular VLM 的信息流很清楚：图片先经过独立视觉处理链路，视觉表示随后与用户问题在语言模型中汇合，再完成理解与回答。</div>
    </div>
  );
};
