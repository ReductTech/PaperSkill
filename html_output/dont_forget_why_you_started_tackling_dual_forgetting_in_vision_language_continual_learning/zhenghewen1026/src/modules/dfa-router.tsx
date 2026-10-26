import { SvgText } from './dfa-kit';
import React, { useState } from 'react';
import { S, Camera, Range, sigmoid, fmt, useTween } from './dfa-kit';
import './dfa.css';
import './middle.css';

export function DfaRouter() {
  const [inner, setInner] = useState(0);
  const [outer, setOuter] = useState(0);
  const alpha = sigmoid(inner), rho = sigmoid(outer);
  const os = [2 * alpha, 2 * (1 - alpha)];
  const residual = os.map(v => rho + (1 - rho) * v);
  const result = [1 + residual[0], residual[1]];
  const a = useTween(alpha), r = useTween(rho);
  const vec = (v: number[]) => `[${v.map(n => fmt(n, 3)).join(', ')}]`;
  return <div className="dfa-page dm-router">
    <div className="dm-router-lenses">
      <svg viewBox="0 0 610 270" role="img" aria-label={`两层路由，内层第一专家权重${fmt(alpha)}，外层对齐权重${fmt(rho)}`}>
        <rect width="610" height="270" rx="22" fill="#fbfaf6"/>
        <Camera x={220} y={58} scale={.8} color="#68778f"/>
        <path d="M30 230 H580" stroke="#d8c4a6" strokeWidth="14"/>
        {[{x:155,value:a,label:'内层',color:'#27446e'},{x:455,value:r,label:'外层',color:'#228d5c'}].map(item => <g key={item.label} transform={`translate(${item.x} 135)`}>
          <circle r="84" fill="#fff" stroke="#d7deea" strokeWidth="15"/>
          <circle r="84" fill="none" stroke={item.color} strokeWidth="15" strokeDasharray={`${Math.PI * 168 * item.value} ${Math.PI * 168}`} transform="rotate(-90)"/>
          <circle r="65" fill="#edf1f4" stroke={item.color} strokeWidth="3"/>
          <path d="M0 -55 V-26" stroke="#f07e47" strokeWidth="10" strokeLinecap="round" transform={`rotate(${item.value * 280 - 140})`}/>
          <SvgText textAnchor="middle" y="18" fontSize="34" fill={item.color}>{item.label}</SvgText>
          <SvgText textAnchor="middle" y="116" fontSize="28" fill="#21324a">权重 {fmt(item.value)}</SvgText>
        </g>)}
      </svg>
      <Range label="内层得分差 a" min={-3} max={3} step={.1} value={inner} onChange={setInner}/>
      <Range label="外层得分差 b" min={-3} max={3} step={.1} value={outer} onChange={setOuter}/>
      <p>两专家权重和为 1；两路径权重和也为 1。</p>
    </div>
    <div className="dm-router-math">
      <p className="dm-router-inputs">教学二维向量：<S meaning="Es1：第一个可塑性专家的二维输出[2,0]。">Es1</S> = [2,0]，<S meaning="Es2：第二个可塑性专家的二维输出[0,2]。">Es2</S> = [0,2]<br/><S meaning="Ea：对齐专家的二维输出[1,1]。">Ea</S> = [1,1]，<S meaning="x：冻结主干输出的二维向量[1,0]。">x</S> = [1,0]</p>
      <div className="dm-router-row">
        <div className="dm-router-equation"><S meaning="os：两位可塑性专家加权后的二维向量。">os</S> = <S meaning="α：内层第一专家权重，由sigmoid(a)计算；第二专家权重为1−α。">α</S><S meaning="Es1：第一可塑性专家的输出。">Es1</S> + (1−<S meaning="α：内层第一专家的归一化权重。">α</S>)<S meaning="Es2：第二可塑性专家的输出。">Es2</S></div>
        <div className="dm-vector-result">{fmt(alpha)} × [2,0] + {fmt(1 - alpha)} × [0,2] = <strong>{vec(os)}</strong></div>
      </div>
      <div className="dm-router-row">
        <div className="dm-router-equation"><S meaning="o：外层路由融合得到的二维残差。">o</S> = <S meaning="ρ：外层对齐路径权重，由sigmoid(b)计算，对应论文的β_gen。">ρ</S><S meaning="Ea：对齐专家输出。">Ea</S> + (1−<S meaning="ρ：对齐路径权重；1−ρ为可塑性路径权重。">ρ</S>)<S meaning="os：可塑性专家组的加权输出。">os</S></div>
        <div className="dm-vector-result">{fmt(rho)} × [1,1] + {fmt(1 - rho)} × {vec(os)} = <strong>{vec(residual)}</strong></div>
      </div>
      <div className="dm-router-answer"><S meaning="y：冻结主干与适配器残差相加后的二维输出。">y</S> = <S meaning="x：冻结主干输出[1,0]。">x</S> + <S meaning="o：混合专家产生的残差。">o</S> = <strong data-testid="router-result">{vec(result)}</strong></div>
    </div>
    <p className="dm-router-feedback" aria-live="polite">内层先组合可塑性专家，外层再与对齐路径融合。真实推理中，路由权重由输入自动计算，同一次前向完成融合。</p>
  </div>;
}
