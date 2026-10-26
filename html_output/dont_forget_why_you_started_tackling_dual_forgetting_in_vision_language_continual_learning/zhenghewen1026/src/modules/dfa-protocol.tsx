import React, { useState } from 'react';
import { Photo, Camera, Range, useTween } from './dfa-kit';
import './dfa.css';
import './early.css';

const datasets = [
  { name: 'EuroSAT', zh: '遥感场景', total: 10, tasks: 5, each: 2, kind: 'landscape' as const },
  { name: 'OxfordFlower', zh: '花卉分类', total: 102, tasks: 17, each: 6, kind: 'flower' as const },
  { name: 'FER2013', zh: '表情识别', total: 7, tasks: 4, each: 2, kind: 'face' as const },
];

export function DfaProtocol() {
  const [dataset, setDataset] = useState(0);
  const [step, setStep] = useState(1);
  const item = datasets[dataset];
  const seen = Math.min(step * item.each, item.total);
  const progress = useTween(step / item.tasks);
  return <div className="dfa-page dfa-early dfa-protocol-page">
    <div className="dfa-protocol-main">
      <div className="dfa-topic-choices">
        {datasets.map((d, i) => <button key={d.name} className={dataset === i ? 'is-selected' : ''} aria-pressed={dataset === i} onClick={() => { setDataset(i); setStep(1); }}>
          <svg viewBox="0 0 110 100" aria-hidden="true"><Photo x={5} y={5} w={100} h={90} kind={d.kind}/></svg>
          <span><strong>{d.name}</strong><span>{d.zh}</span></span>
        </button>)}
      </div>
      <div className="dfa-training-film">
        <strong>训练源：{item.total} 类 → {item.tasks} 个任务</strong>
        <svg viewBox="0 0 680 300" role="img" aria-label={`当前第${step}个任务，已见${seen}个类别`}>
          <path d="M28 224 H652" stroke="#d8c4a6" strokeWidth="20" strokeLinecap="round"/>
          <g transform={`translate(${100 + progress * 440} 0)`}><Camera x={0} y={80} scale={.65}/></g>
          <rect x="28" y="252" width="624" height="30" rx="8" fill="#e2e8ec"/>
          <rect x="28" y="252" width={624 * progress} height="30" rx="8" fill="#27446e"/>
          {Array.from({length:item.tasks}, (_, i) => <line key={i} x1={28 + 624 * (i + 1) / item.tasks} x2={28 + 624 * (i + 1) / item.tasks} y1="252" y2="282" stroke="white" strokeWidth="4"/>)}
        </svg>
        <div className="dfa-protocol-seen" aria-live="polite">第 {step} / {item.tasks} 个任务 · 已见 <b>{seen}</b> 类</div>
        <p>{dataset === 2 ? '依次加入 2、2、2、1 个类别' : `每个任务加入 ${item.each} 个类别`}</p>
      </div>
      <div className="dfa-eval-pool">
        <strong>固定外部评估池</strong>
        {['低相似','中相似','高相似'].map((label, group) => <div className="dfa-pool-group" key={label}>
          <span>{label} · 8 个数据集</span>
          <svg viewBox="0 0 390 46" aria-hidden="true">{Array.from({length:8},(_,i) => <g key={i} transform={`translate(${i * 48 + 2} 2)`}><rect width="42" height="40" rx="3" fill="#fff" stroke="#bcc9d1" strokeWidth="2"/><path d="M4 31 L14 15 L23 25 L31 13 L38 31 Z" fill={['#b5c9ce','#99b3bf','#7c9bb0'][group]}/><circle cx="12" cy="10" r="4" fill="#e0c39b"/></g>)}</svg>
        </div>)}
        <p>每次训练后都检查<br/><b>同一组 24 个领域</b></p>
      </div>
    </div>
    <div className="dfa-protocol-bottom">
      <div><Range label="沿任务序列前进" min={1} max={item.tasks} step={1} value={step} onChange={setStep}/></div>
      <p>25 个数据集组成数据池；其中 22 个可作训练源。<br/>推理同时识别所有已见类别，不提供外部任务编号。</p>
    </div>
  </div>;
}
