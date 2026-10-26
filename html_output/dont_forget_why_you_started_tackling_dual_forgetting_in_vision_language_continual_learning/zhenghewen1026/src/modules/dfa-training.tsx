import { SvgText } from './dfa-kit';
import React, { useState } from 'react';
import { S, Camera, Range, fmt, useTween } from './dfa-kit';
import './dfa.css';
import './middle.css';

export function DfaTraining() {
  const [stage, setStage] = useState<'A' | 'B'>('A');
  const [gradient, setGradient] = useState(1);
  const isA = stage === 'A';
  const plasticityGradient = isA ? 0 : gradient + .001 * .4;
  const shownGradient = useTween(plasticityGradient);
  const eaGradient = isA ? .4 : 0;
  return <div className="dfa-page dm-training">
    <div className="dm-training-workbench">
      <svg viewBox="0 0 900 405" role="img" aria-label={`阶段${stage}，主干冻结，对齐专家${isA ? '更新' : '冻结'}，可塑性专家与路由${isA ? '冻结' : '更新'}`}>
        <rect width="900" height="405" rx="22" fill="#fbfaf6"/>
        <path d="M35 355 H865" stroke="#d8c4a6" strokeWidth="20"/>
        <Camera x={120} y={105} scale={1.15} color="#68778f"/>
        <SvgText x="135" y="333" fill="#68778f" fontSize="28">主干全程冻结</SvgText>
        <g transform="translate(500 125)">
          <circle r="72" fill={isA ? '#e8f2ec' : '#edf1f4'} stroke={isA ? '#228d5c' : '#9aa9b8'} strokeWidth="8"/>
          <g transform={`rotate(${eaGradient * 100})`}><path d="M0 -60 V-20" stroke={isA ? '#228d5c' : '#9aa9b8'} strokeWidth="12" strokeLinecap="round"/></g>
          <SvgText x="0" y="11" textAnchor="middle" fill="#21324a" fontSize="34">对齐</SvgText>
          <SvgText x="0" y="111" textAnchor="middle" fill={isA ? '#228d5c' : '#68778f'} fontSize="28">{isA ? '梯度 0.4' : '冻结 · 0'}</SvgText>
        </g>
        {[0, 1].map(i => <g key={i} transform={`translate(${680 + i * 130} 120)`}>
          <ellipse cx="0" cy="0" rx="48" ry="68" fill={isA ? '#edf1f4' : '#e8f2ec'} stroke={isA ? '#9aa9b8' : '#228d5c'} strokeWidth="7"/>
          <path d={`M${shownGradient * 12} -47 V45`} stroke={isA ? '#9aa9b8' : '#228d5c'} strokeWidth="7"/>
          <SvgText y="110" textAnchor="middle" fill="#21324a" fontSize="28">专家 {i + 1}</SvgText>
        </g>)}
        <rect x="610" y="270" width="240" height="68" rx="22" fill={isA ? '#edf1f4' : '#e8f2ec'} stroke={isA ? '#9aa9b8' : '#228d5c'} strokeWidth="4"/>
        <SvgText x="730" y="314" textAnchor="middle" fill={isA ? '#68778f' : '#228d5c'} fontSize="28">双层路由 · {isA ? '冻结' : '更新'}</SvgText>
      </svg>
      <div className="dm-stage-choices" aria-label="选择训练阶段">
        <button type="button" className={isA ? 'dm-tool is-active' : 'dm-tool'} onClick={() => setStage('A')} aria-pressed={isA}>A · 对齐校准</button>
        <button type="button" className={!isA ? 'dm-tool is-active' : 'dm-tool'} onClick={() => setStage('B')} aria-pressed={!isA}>B · 类别学习</button>
      </div>
    </div>
    <aside className="dm-training-target">
      <h3>{isA ? '只更新对齐专家' : '更新可塑性专家与路由'}</h3>
      <div className="dm-training-objective">{isA ? <S meaning="Lcon：图像与文本双方向平均的对比损失。">Lcon</S> : <><S meaning="LCE：当前任务的类别交叉熵损失。">LCE</S> + <S meaning="λ：辅助对比目标的系数，论文采用0.001。">λ</S><S meaning="Lcon：来自当前批次和历史特征的对比损失。">Lcon</S></>}</div>
      <p>{isA ? '图像与文本两侧都设置对齐专家，优化目标只包含对比学习。' : '固定已经学好的对齐路径，用类别监督与辅助对比学习适应新任务。'}</p>
      <div className="dm-gradient-result">教学标量梯度<strong data-testid="training-gradient">{isA ? '0.4000' : fmt(plasticityGradient, 4)}</strong></div>
      <p>{isA ? '交叉熵不会更新对齐专家。' : <>可塑性梯度 = <S meaning="g：教学示例中的交叉熵梯度分量。">g</S> + 0.001 × 0.4</>}</p>
    </aside>
    <div className="dm-training-control"><Range label="交叉熵梯度 g（教学标量）" min={-2} max={2} step={.1} value={gradient} onChange={setGradient}/><p className="dm-feedback" aria-live="polite">{isA ? `当前 g = ${fmt(gradient)}，对齐阶段的更新仍为 0.4。` : `当前 g = ${fmt(gradient)}，可塑性更新为 ${fmt(plasticityGradient, 4)}；对齐专家更新为 0。`}</p></div>
  </div>;
}
