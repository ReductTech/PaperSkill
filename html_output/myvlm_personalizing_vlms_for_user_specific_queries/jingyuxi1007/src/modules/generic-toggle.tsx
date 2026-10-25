import React, { useState } from 'react';
import { DogDrawing } from './hero-scene';

export function GenericToggle() {
  const [personalized, setPersonalized] = useState(false);
  return (
    <div className="mv-widget" data-testid="generic-toggle">
      <div className="mv-controls" role="group" aria-label="教学输出模式">
        <button className={'mv-button ' + (!personalized ? 'mv-selected' : '')} aria-pressed={!personalized} onClick={() => setPersonalized(false)}>Generic VLM</button>
        <button className={'mv-button ' + (personalized ? 'mv-selected' : '')} aria-pressed={personalized} onClick={() => setPersonalized(true)}>Personalized MyVLM</button>
      </div>
      <DogDrawing personalized={personalized} />
      <div className={'mv-output ' + (personalized ? 'mv-personal-output' : '')} aria-live="polite">
        <small>{personalized ? '已建立 Max 与具体实例的对应关系 · 教学输出' : '通用类别知识 · 教学输出'}</small>
        <blockquote>{personalized ? 'Max sitting on the couch.' : 'A dog sitting on the couch.'}</blockquote>
      </div>
      <div className="mv-feedback" role="status">{personalized ? '这里多出的信息是实例身份：用户指定的 Max。真实 MyVLM 需要识别目标并注入已学习的概念向量，不能仅替换 dog。' : '这句话可以正确描述类别和场景，但还没有把这只狗与用户给出的名称 Max 绑定。'}</div>
      <details className="mv-original"><summary>为什么不能只替换名称？</summary><DogDrawing pair /><p>同类别的两只狗仍是不同实例；目标也可能根本不在新图里。</p></details>
      <p className="mv-source">教学示意，非论文原实验。Max、示意图和输出均为教学构造，边框不是模型定位结果；切换不运行真实模型。依据 M §1–2。</p>
    </div>
  );
}
