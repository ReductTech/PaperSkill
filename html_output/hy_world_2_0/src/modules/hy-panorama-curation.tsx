import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Decision = 'keep' | 'reject';

const curationSamples = [
  {
    id: 'r-hotel', code: 'R1', source: '真实拍摄', title: '玻璃庭院酒店', visual: 'hotel', issue: '未见明显缺陷', correct: 'keep' as Decision,
    reason: '高分辨率真实光照与复杂材质可补充自然场景先验。',
  },
  {
    id: 's-fantasy', code: 'S1', source: 'UE 合成', title: '浮空遗迹', visual: 'fantasy', issue: '未见明显缺陷', correct: 'keep' as Decision,
    reason: '合成资产提供精确几何标签与现实中难以采集的想象场景。',
  },
  {
    id: 'r-street', code: 'R2', source: '真实拍摄', title: '夜间商业街', visual: 'street seam', issue: '左右接缝明显', correct: 'reject' as Decision,
    reason: '论文特别过滤带有明显 stitching artifacts 的低质量样本。',
  },
  {
    id: 'r-room', code: 'R3', source: '真实拍摄', title: '室内会客厅', visual: 'room rig', issue: '全景相机设备入镜', correct: 'reject' as Decision,
    reason: '曝光的拍摄设备会成为错误视觉模式，因此应在数据清洗中剔除。',
  },
  {
    id: 's-scifi', code: 'S2', source: 'UE 合成', title: '星港控制舱', visual: 'scifi', issue: '未见明显缺陷', correct: 'keep' as Decision,
    reason: '高质量引擎资产扩展语义分布，并提供多样、可控的场景构型。',
  },
  {
    id: 's-canyon', code: 'S3', source: 'UE 合成', title: '峡谷训练场', visual: 'canyon seam', issue: '边界拼接破损', correct: 'reject' as Decision,
    reason: '无论来源为何，明显拼接破损都属于需要过滤的低质量信号。',
  },
] as const;

type SampleId = typeof curationSamples[number]['id'];

export const HyPanoramaCuration: React.FC<WidgetProps> = () => {
  const [activeId, setActiveId] = useState<SampleId>('r-hotel');
  const [decisions, setDecisions] = useState<Record<SampleId, Decision | null>>({
    'r-hotel': null,
    's-fantasy': null,
    'r-street': null,
    'r-room': null,
    's-scifi': null,
    's-canyon': null,
  });
  const active = curationSamples.find(sample => sample.id === activeId) ?? curationSamples[0];
  const decidedCount = curationSamples.filter(sample => decisions[sample.id] !== null).length;
  const correctCount = curationSamples.filter(sample => decisions[sample.id] === sample.correct).length;
  const complete = correctCount === curationSamples.length;
  const acceptedReal = curationSamples.filter(sample => sample.source === '真实拍摄' && decisions[sample.id] === 'keep');
  const acceptedSynthetic = curationSamples.filter(sample => sample.source === 'UE 合成' && decisions[sample.id] === 'keep');

  const decide = (decision: Decision) => {
    setDecisions(current => ({ ...current, [active.id]: decision }));
  };

  const reset = () => {
    setActiveId('r-hotel');
    setDecisions({
      'r-hotel': null,
      's-fantasy': null,
      'r-street': null,
      'r-room': null,
      's-scifi': null,
      's-canyon': null,
    });
  };

  const activeDecision = decisions[active.id];
  const activeCorrect = activeDecision === active.correct;

  return <div className="curation-lab">
    <div className="curation-head">
      <div><span>数据暗房</span><strong>真实质感与合成多样性都要，明显污染都不要</strong></div>
      <div><b>{correctCount}/6</b><small>裁决正确</small></div>
      <button type="button" onClick={reset}>清空裁决</button>
    </div>

    <div className="curation-sample-grid">
      {curationSamples.map(sample => {
        const decision = decisions[sample.id];
        const status = decision === null ? 'undecided' : decision === sample.correct ? 'correct' : 'incorrect';
        return <button
          key={sample.id}
          type="button"
          className={`${activeId === sample.id ? 'selected' : ''} ${status}`}
          onClick={() => setActiveId(sample.id)}
          aria-pressed={activeId === sample.id}
        >
          <div className={`curation-thumb ${sample.visual}`} aria-hidden="true">
            <i />
            <b />
            <em>{sample.code}</em>
          </div>
          <span><strong>{sample.title}</strong><small>{sample.source} · {sample.issue}</small></span>
          <i className="curation-status">{decision === null ? '待检' : decision === 'keep' ? '收入' : '剔除'}</i>
        </button>;
      })}
    </div>

    <div className="curation-inspector">
      <section className="curation-active-sample">
        <header><span>当前样本 {active.code}</span><strong>{active.title}</strong><small>{active.source}</small></header>
        <div className={`curation-preview ${active.visual}`} aria-hidden="true"><i /><b /><em>{active.issue}</em></div>
        <p>{active.reason}</p>
        <div className="curation-actions">
          <button type="button" className={activeDecision === 'keep' ? 'selected' : ''} onClick={() => decide('keep')}>收入训练集</button>
          <button type="button" className={activeDecision === 'reject' ? 'selected' : ''} onClick={() => decide('reject')}>从暗房剔除</button>
        </div>
        <div className={`curation-verdict ${activeDecision === null ? '' : activeCorrect ? 'correct' : 'incorrect'}`}>
          {activeDecision === null && '先观察来源与污染线索，再作出裁决。'}
          {activeDecision !== null && activeCorrect && `裁决正确：${active.reason}`}
          {activeDecision !== null && !activeCorrect && `裁决冲突：${active.issue === '未见明显缺陷' ? '该样本的来源可补充训练分布，当前没有论文明确要求剔除的污染。' : '论文的数据过滤会移除这类明显污染。'}`}
        </div>
      </section>

      <section className="curation-shelves">
        <header><span>已收入样本架</span><strong>双源不是二选一</strong></header>
        <div>
          <article><span>真实拍摄</span><strong>{acceptedReal.length}</strong><small>自然光照、纹理与复杂真实结构</small></article>
          <article><span>UE 合成</span><strong>{acceptedSynthetic.length}</strong><small>精确标签、想象场景与可控构型</small></article>
        </div>
        <p>论文说明两类来源共同扩展训练分布，但没有公开教程可还原的固定配比；这里的数量只来自六张教学样本。</p>
      </section>
    </div>

    <div className={`feedback ${complete ? 'good' : decidedCount === 6 ? 'bad' : ''}`}>
      {complete && '六张样本全部裁决正确：保留高质量真实与合成数据，同时剔除明显接缝和拍摄设备污染。'}
      {!complete && decidedCount < 6 && `已裁决 ${decidedCount}/6。选择下一张样本，继续检查来源价值与质量污染。`}
      {!complete && decidedCount === 6 && `仍有 ${6 - correctCount} 张样本裁决冲突。来源不是唯一标准：高质量双源都可保留，明显污染都应剔除。`}
    </div>

    <section className="curation-paper-boundary">
      <span>论文事实与教程构造</span>
      <p>论文第 3.1 节明确描述真实高分辨率全景、UE 合成资产，以及对明显接缝与拍摄设备入镜样本的过滤。R1-S3 的场景名称、画面和六题数量均为教程示意，不是论文数据样本或统计。</p>
    </section>

    <div className="curation-glossary-grid">
      <details><summary>真实数据带来什么？</summary><p>真实全景提供自然光照、复杂纹理和真实结构先验，有助于模型学习现实世界的外观分布。</p></details>
      <details><summary>合成数据带来什么？</summary><p>UE 等高质量引擎资产提供精确几何标签和更自由的场景设计，可覆盖现实中难以采集的构型。</p></details>
      <details><summary>什么是 domain gap？</summary><p>真实与合成数据的纹理、光照和渲染规律存在分布差异。论文用混合数据拓宽语义分布，并减轻二者之间的域差距。</p></details>
      <details><summary>为何过滤设备入镜？</summary><p>全景相机、支架或拍摄人员若频繁出现在训练图中，模型可能把它们学成场景的一部分，形成错误视觉先验。</p></details>
    </div>
  </div>;
};

export default HyPanoramaCuration;
