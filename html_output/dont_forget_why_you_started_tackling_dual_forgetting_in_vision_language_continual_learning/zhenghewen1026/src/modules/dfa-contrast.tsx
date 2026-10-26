import { SvgText } from './dfa-kit';
import React, { useState } from 'react';
import { S, Photo, Range, fmt, useTween } from './dfa-kit';
import './dfa.css';
import './middle.css';

export function DfaContrast() {
  const [positive, setPositive] = useState(.6);
  const [history, setHistory] = useState(true);
  const negatives = history ? [.2, .3, .5] : [.2, .3];
  const logits = [positive, ...negatives].map(v => v / .15);
  const maxLogit = Math.max(...logits);
  const logDenominator = maxLogit + Math.log(logits.reduce((n, v) => n + Math.exp(v - maxLogit), 0));
  const loss = logDenominator - logits[0];
  const probability = Math.exp(-loss);
  const shownPositive = useTween(positive);
  const shownProbability = useTween(probability);
  const captionX = 360 + (1 - shownPositive) * 150;
  return <div className="dfa-page dm-contrast">
    <div className="dm-pairing-board">
      <svg viewBox="0 0 1472 260" role="img" aria-label={`图文配对教学示例，正配对相似度${fmt(positive)}，正对概率${fmt(probability * 100)}%`}>
        <rect x="0" y="0" width="1472" height="260" rx="20" fill="#fbfaf6"/>
        <path d="M24 235 H1448" stroke="#d8c4a6" strokeWidth="10"/>
        <Photo x={35} y={34} w={245} h={174} kind="flower"/>
        <path d={`M292 120 H${captionX - 12}`} stroke="#228d5c" strokeWidth="5" strokeDasharray="10 8"/>
        <g transform={`translate(${captionX} 45)`}>
          <rect width="310" height="138" rx="12" fill="#e8f2ec" stroke="#228d5c" strokeWidth="3"/>
          <rect x="125" y="-12" width="60" height="22" rx="5" fill="#92400e"/>
          <SvgText x="155" y="57" textAnchor="middle" fill="#21324a" fontSize="34">一朵盛开的花</SvgText>
          <SvgText x="155" y="103" textAnchor="middle" fill="#228d5c" fontSize="28">正确题注 · {fmt(positive)}</SvgText>
        </g>
        <SvgText x="930" y="40" fill="#68778f" fontSize="28">不匹配题注</SvgText>
        {['一座建筑 · 0.20', '一张人脸 · 0.30', '历史题注 · 0.50'].slice(0, history ? 3 : 2).map((name, i) => <g key={name} transform={`translate(925 ${58 + i * 56})`}>
          <rect width="475" height="46" rx="8" fill={i === 2 ? '#f0ebf7' : '#edf1f4'}/>
          <SvgText x="22" y="33" fill={i === 2 ? '#7c3aed' : '#68778f'} fontSize="28">{name}</SvgText>
        </g>)}
        <rect x="320" y="218" width="500" height="24" rx="12" fill="#dce4e4"/>
        <rect x="320" y="218" width={500 * shownProbability} height="24" rx="12" fill="#228d5c"/>
      </svg>
    </div>
    <div className="dm-contrast-controls">
      <Range label="正配对相似度" min={.1} max={1} step={.01} value={positive} onChange={setPositive}/>
      <button type="button" className={history ? 'dm-action is-selected' : 'dm-action'} aria-pressed={history} onClick={() => setHistory(v => !v)}>{history ? '移除历史题注' : '加入历史题注'}</button>
      <div className="dm-probability" aria-live="polite">正对概率 <strong>{fmt(probability * 100)}%</strong></div>
    </div>
    <div className="dm-contrast-equations">
      <div className="dm-prob-formula"><S meaning="p⁺：当前照片与正确题注配对的归一化概率。">p⁺</S> = <span className="dm-fraction"><span>exp(<S meaning="s⁺：正配对的余弦相似度；这里可在0.1到1间调节。">s⁺</S>/<S meaning="τ：对比温度；本例采用论文对齐阶段的0.15。">τ</S>)</span><span>exp(<S meaning="s⁺：正配对的余弦相似度。">s⁺</S>/<S meaning="τ：对比温度0.15。">τ</S>) + <S meaning="Σ：对所有负配对求和。">Σ</S> exp(<S meaning="s⁻：不匹配题注与照片的余弦相似度。">s⁻</S>/<S meaning="τ：对比温度0.15。">τ</S>)</span></span></div>
      <div className="dm-loss"><S meaning="ℓ：一对图文、一个方向的对比损失。">ℓ</S> = −ln <S meaning="p⁺：正确配对的概率。">p⁺</S><strong data-testid="contrast-loss">{fmt(loss, 3)}</strong></div>
    </div>
    <p className="dm-feedback" aria-live="polite">教学示例：单对、单方向。{positive < .4 ? '当前正配对较弱，负样本竞争明显。' : positive < .8 ? '继续提高匹配强度，正对概率随之上升。' : '正配对更突出，损失明显下降。'}论文对整个批次的图像→文本、文本→图像损失取平均。</p>
  </div>;
}
