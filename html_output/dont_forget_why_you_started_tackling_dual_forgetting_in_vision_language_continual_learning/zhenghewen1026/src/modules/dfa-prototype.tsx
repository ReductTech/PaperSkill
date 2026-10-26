import { SvgText } from './dfa-kit';
import React, { useState } from 'react';
import { Photo, Range, S, fmt, useTween } from './dfa-kit';
import './dfa.css';
import './early.css';

export function DfaPrototype() {
  const [theta, setTheta] = useState(0);
  const [reverse, setReverse] = useState(false);
  const animated = useTween(theta, 240);
  const a = theta * Math.PI / 180;
  const am = animated * Math.PI / 180;
  const d0 = 2 - 2 * Math.cos(a);
  const d90 = 2 - 2 * Math.sin(a);
  const d = reverse ? (d0 + d90) / 2 : Math.min(d0, d90);
  const x = 290 + 180 * Math.cos(am), y = 280 - 180 * Math.sin(am);
  return <div className="dfa-page dfa-early dfa-prototype-page">
    <div className="dfa-prototype-main">
      <div className="dfa-feature-board">
        <div className="dfa-feature-label">原始 CLIP 特征空间 · 教学示例</div>
        <svg viewBox="0 0 850 342" role="img" aria-label={`训练原型角度${theta}度，${reverse ? '反向' : '前向'}距离${fmt(d,3)}`}>
          <rect x="18" y="14" width="814" height="308" rx="16" fill="#f2eee5"/>
          <path d="M290 280 H530 M290 280 V48" fill="none" stroke="#a9b6be" strokeWidth="3"/>
          <path d="M470 280 A180 180 0 0 0 290 100" fill="none" stroke="#b9c9d0" strokeWidth="3" strokeDasharray="7 7"/>
          <line x1={x} y1={y} x2="470" y2="280" stroke={reverse || theta <= 45 ? '#27446e' : '#c3ccd0'} strokeWidth={reverse || theta <= 45 ? 4 : 2}/>
          <line x1={x} y1={y} x2="290" y2="100" stroke={reverse || theta >= 45 ? '#27446e' : '#c3ccd0'} strokeWidth={reverse || theta >= 45 ? 4 : 2}/>
          <Photo x={538} y={207} w={140} h={112} kind="city"/>
          <Photo x={94} y={38} w={140} h={112} kind="flower"/>
          <circle cx="470" cy="280" r="9" fill="#27446e"/>
          <circle cx="290" cy="100" r="9" fill="#27446e"/>
          <g transform={`translate(${x} ${y})`}><circle r="20" fill="#f07e47" stroke="white" strokeWidth="5"/><path d="M-8 -6 H8 V6 H-8 Z" fill="white"/><circle r="4" fill="#f07e47"/></g>
          <SvgText x="510" y="184" className="dfa-early-svg-text">评估类 0°</SvgText>
          <SvgText x="55" y="189" className="dfa-early-svg-text">评估类 90°</SvgText>
          <SvgText x="525" y="65" className="dfa-early-svg-heading" fill="#f07e47">训练类 {theta}°</SvgText>
        </svg>
        <Range label="训练原型角度 θ" min={0} max={90} step={1} value={theta} onChange={setTheta} unit="°"/>
      </div>
      <div className="dfa-distance-detail">
        <div className="dfa-direction-buttons"><button onClick={() => setReverse(false)} className={!reverse ? 'is-selected' : ''} aria-pressed={!reverse}>训练 → 评估</button><button onClick={() => setReverse(true)} className={reverse ? 'is-selected' : ''} aria-pressed={reverse}>评估 → 训练</button></div>
        <p>图像与文本分别单位化，再拼成一个类别原型。</p>
        <div className="dfa-early-formula"><S meaning="r：类别原型；这里由两个二维单位向量拼接成四维向量。">r</S> = [<S meaning="v：归一化的图像类别特征；本例为二维。">v</S> ; <S meaning="t：归一化的文本类别特征；本例为二维。">t</S>]</div>
        <div className="dfa-distance-values">到 0° 的距离：{fmt(d0,3)}<br/>到 90° 的距离：{fmt(d90,3)}</div>
        <strong className="dfa-distance-result" aria-live="polite">{reverse ? '平均两个距离' : '取最近的距离'} = {fmt(d,3)}</strong>
      </div>
    </div>
    <div className="dfa-prototype-bottom">
      <div className="dfa-early-formula"><S meaning={reverse ? 'd：从评估域到训练任务的反向语义距离。' : 'd：从训练任务到评估域的正向语义距离。'}>d</S> = <span className="dfa-frac"><span>1</span><span>2<S meaning={reverse ? 'm：当前来源集合为评估域，含2个类别，因此m=2。' : 'm：当前来源集合为训练任务，含1个类别，因此m=1。'}>m</S></span></span> <S meaning={reverse ? 'Σ_i：遍历评估域的两个类别，把各自到最近训练类的距离相加。' : 'Σ_i：遍历训练任务的类别；本例只有1类。'}>Σᵢ</S> <S meaning={reverse ? 'min_j：为当前评估类别寻找最近训练类别；本例训练侧只有1类。' : 'min_j：为当前训练类别选择距离最小的评估类别。'}>minⱼ</S> <S meaning={reverse ? 'rᵢ为评估类原型，r′ⱼ为训练类原型；平方欧氏距离除2平均两个模态。' : 'rᵢ为训练类原型，r′ⱼ为评估类原型；平方欧氏距离除2平均两个模态。'}>‖rᵢ−r′ⱼ‖²</S><span>，m = {reverse ? 2 : 1}</span></div>
      <p>{reverse ? '反方向把评估域额外的类别也计入距离。' : '前方向检查每个训练类别，是否能在评估域找到覆盖。'}</p>
    </div>
  </div>;
}
