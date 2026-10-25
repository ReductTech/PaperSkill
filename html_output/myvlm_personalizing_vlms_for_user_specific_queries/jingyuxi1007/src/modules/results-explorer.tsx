import React, { useState } from 'react';
import { RecallBars } from './recall-bars';

const results = {
  llava: { model: 'LLaVA', range: '全部 45 概念', baseline: 'LLM-guided', before: 46.23, after: 95.97, explanation: '在这一 captioning 评估中，MyVLM 更常把用户概念名称纳入生成文本。' },
  objects: { model: 'BLIP-2', range: '29 物品', baseline: 'LLM-guided', before: 51.55, after: 95.10, explanation: '物品子集的名称召回也提高；这是另一底座及另一数据范围，不能与 LLaVA 的全部概念成绩直接排名。' },
  people: { model: 'BLIP-2', range: '16 人物', baseline: 'Simple Replace', before: 84.33, after: 79.76, explanation: '人物子集上 MyVLM 的名称召回低于 Simple Replace。名称易于插入，并不保证认对身份或描述正确。' },
};

export function ResultsExplorer() {
  const [selection, setSelection] = useState<keyof typeof results>('llava');
  const record = results[selection];
  const blip = selection !== 'llava';
  const difference = record.after - record.before;
  return (
    <div className="mv-widget" data-testid="results-explorer">
      <div className="mv-controls" role="group" aria-label="实验底座">
        <button className={'mv-button ' + (!blip ? 'mv-selected' : '')} aria-pressed={!blip} onClick={() => setSelection('llava')}>LLaVA</button>
        <button className={'mv-button ' + (blip ? 'mv-selected' : '')} aria-pressed={blip} onClick={() => setSelection('objects')}>BLIP-2</button>
      </div>
      {blip ? <div className="mv-controls" role="group" aria-label="BLIP-2 实验子集">
        <button className={'mv-button ' + (selection === 'objects' ? 'mv-selected' : '')} aria-pressed={selection === 'objects'} onClick={() => setSelection('objects')}>29 物品</button>
        <button className={'mv-button ' + (selection === 'people' ? 'mv-selected' : '')} aria-pressed={selection === 'people'} onClick={() => setSelection('people')}>16 人物</button>
      </div> : <p className="mv-scope-note">当前展示 LLaVA 的全部 45 概念结果；切换底座会同时更新数据范围和基线。</p>}
      <div className="mv-result" aria-live="polite">
        <h5>{record.model} · Personalized Captioning · {record.range}</h5>
        <p>Metric：Concept-name recall ↑ · 4 图训练 embedding · 五次随机划分</p>
        <RecallBars rows={[{ label: record.baseline, value: record.before }, { label: 'MyVLM', value: record.after, paperMethod: true }]} />
        <p className={difference >= 0 ? 'mv-up' : 'mv-down'}>{difference >= 0 ? '提高' : '降低'} {Math.abs(difference).toFixed(2)} 个百分点。</p>
      </div>
      <div className="mv-feedback" role="status">{record.explanation}</div>
      <div className="mv-note"><b>Recall 不是 accuracy。</b> 它只统计 caption 是否出现概念名称，不等于整句正确率、身份识别准确率或 VQA accuracy。论文的 VQA 主要为定性展示，没有可切换的系统问答准确率。</div>
      <p className="mv-source"><a href="https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02028.pdf#page=12" target="_blank" rel="noreferrer">M Table 1，p.12</a> · 三组均为原表数据，未插值或预测。不同模型 / 子集的上下文随选择一起更新。</p>
    </div>
  );
}
