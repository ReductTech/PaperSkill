import { SvgText } from './dfa-kit';
import React, { useState } from 'react';
import { Photo, Range, fmt, useTween } from './dfa-kit';
import './dfa.css';
import './early.css';

export function DfaDual() {
  const [task, setTask] = useState(1);
  const [selected, setSelected] = useState<'old' | 'unseen'>('old');
  const old = [80, 72, 65][task - 1];
  const unseen = [69, 61, 55][task - 1];
  const oldMotion = useTween(old);
  const unseenMotion = useTween(unseen);
  const value = selected === 'old' ? old : unseen;
  const baseline = selected === 'old' ? 80 : 70;
  const items = [
    { id: 'old' as const, title: '历史类别', name: '增量知识遗忘', reference: '学完旧类别时', score: old, animated: oldMotion, start: 80, kind: 'flower' as const },
    { id: 'unseen' as const, title: '陌生领域', name: '预训练知识遗忘', reference: '原始预训练模型', score: unseen, animated: unseenMotion, start: 70, kind: 'city' as const },
  ];
  return <div className="dfa-page dfa-early dfa-dual-page">
    <div className="dfa-albums">
      {items.map(item => <button key={item.id} className={`dfa-album ${selected === item.id ? 'is-selected' : ''}`} onClick={() => setSelected(item.id)} aria-pressed={selected === item.id} aria-label={`检查${item.name}`}>
        <div className="dfa-album-title"><strong>{item.title}</strong><span>{item.name}</span></div>
        <svg viewBox="0 0 690 245" aria-hidden="true">
          <path d="M18 22 Q168 4 327 28 L327 225 Q160 202 18 220 Z" fill="#eee4d3" stroke="#c9b797" strokeWidth="3"/>
          <path d="M327 28 Q486 4 669 22 L669 220 Q492 202 327 225 Z" fill="#f7efdf" stroke="#c9b797" strokeWidth="3"/>
          <Photo x={50} y={44} w={140} h={130} kind={item.kind} />
          <Photo x={359} y={44} w={140} h={130} kind={item.kind} />
          <SvgText x="210" y="95" className="dfa-early-svg-heading" fill="#27446e">{item.start}%</SvgText>
          <SvgText x="520" y="95" className="dfa-early-svg-heading" fill={item.score < item.start ? '#c43f52' : '#27446e'}>{item.score}%</SvgText>
          <rect x="210" y="120" width="92" height="16" rx="8" fill="#d8dee6"/>
          <rect x="210" y="120" width={92 * item.start / 100} height="16" rx="8" fill="#27446e"/>
          <rect x="520" y="120" width="92" height="16" rx="8" fill="#d8dee6"/>
          <rect x="520" y="120" width={92 * item.animated / 100} height="16" rx="8" fill={item.score < item.start ? '#c43f52' : '#27446e'}/>
          <SvgText x="50" y="201" className="dfa-early-svg-text">{item.reference}</SvgText>
          <SvgText x="359" y="201" className="dfa-early-svg-text">任务 {task} 完成后</SvgText>
        </svg>
        <div className="dfa-album-footer">{item.score - item.start === 0 ? '当前保持' : `变化 ${item.score - item.start} 个百分点`}</div>
      </button>)}
    </div>
    <div className="dfa-dual-bottom">
      <div className="dfa-dual-copy" aria-live="polite">
        <strong>{selected === 'old' ? '旧知识：与学完它时相比' : '通用能力：与出发时相比'}</strong>
        <p>{selected === 'old' ? '后续新类别进入后，检查历史类别还能识别多少。' : '在没有参与增量训练的领域，检查零样本识别还能保留多少。'}</p>
        <div className="dfa-early-result">{value}% − {baseline}% = <b>{fmt(value - baseline, 0)} 个百分点</b></div>
      </div>
      <div className="dfa-dual-control">
        <Range label="已完成任务" min={1} max={3} step={1} value={task} onChange={setTask}/>
        <p>教学示例 · 两份检验单采用不同参照</p>
      </div>
    </div>
  </div>;
}
