import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import { CodeChip, MetricBar, StageBadge, StudioPanel } from './glc-kit';

type Placement = 'none' | 'network' | 'supervision';

const choices: Array<{ id: Placement; label: string; loss: string; feedback: string }> = [
  {
    id: 'none',
    label: '无码预测',
    loss: '+13.1% BD-Rate',
    feedback: '去掉语义监督后，眼部颜色、嘴型等属性更容易随压缩漂移。'
  },
  {
    id: 'network',
    label: '放进推理网络',
    loss: '+60.7% BD-Rate',
    feedback: '把预测出的 VQ 索引直接塞回解码器，会形成过窄的码本瓶颈。'
  },
  {
    id: 'supervision',
    label: '仅作训练监督',
    loss: '0% 参考',
    feedback: '训练时要求 l̂ 能预测正确索引；推理时解码器直接使用更灵活的 l̂。'
  }
];

function Portrait({ placement }: { placement: Placement }) {
  const supervision = placement === 'supervision';
  const network = placement === 'network';
  const none = placement === 'none';
  return <svg viewBox="0 0 260 230" aria-hidden="true" className="glc-portrait">
    <rect x="24" y="16" width="212" height="198" rx="26" fill={supervision ? '#e1f1e7' : network ? '#e8e6f3' : '#f6e8e8'} />
    <path d="M61 184 C72 115 106 83 130 83 C154 83 188 115 199 184 Z" fill="#d5a67f" />
    <path d="M88 95 C88 48 172 38 176 96 L164 133 C148 119 110 119 96 136 Z" fill="#5b3d32" />
    <ellipse cx="105" cy="113" rx="15" ry="8" fill={none ? '#97a89e' : supervision ? '#a86fa3' : '#c3a1bd'} />
    <ellipse cx="157" cy="113" rx="15" ry="8" fill={none ? '#788f86' : supervision ? '#a86fa3' : '#c3a1bd'} />
    <circle cx="108" cy="116" r="3.5" fill="#27324a" /><circle cx="154" cy="116" r="3.5" fill="#27324a" />
    <path d={supervision ? 'M111 158 Q130 169 151 157' : network ? 'M112 162 H149' : 'M114 163 Q128 154 149 163'}
      fill="none" stroke="#8d4056" strokeWidth="6" strokeLinecap="round" />
    <path d="M69 171 C44 149 41 91 62 60 M192 171 C218 148 219 92 197 61"
      fill="none" stroke="#5b3d32" strokeWidth="18" strokeLinecap="round" />
    {network && <g><rect x="104" y="196" width="52" height="24" rx="8" fill="#7c3aed" />
      <text x="130" y="214" textAnchor="middle" fill="white" fontSize="15" fontWeight="750">VQ</text></g>}
  </svg>;
}

export function GlcCodePrediction() {
  const [placement, setPlacement] = useState<Placement>('supervision');
  const selected = choices.find(item => item.id === placement)!;
  return <div className="glc-scene glc-code-page">
    <aside className="glc-code-menu">
      <StageBadge tone="purple">码预测监督</StageBadge>
      <h3>预测器放在哪里</h3>
      {choices.map(item => <button key={item.id} className={placement === item.id ? `is-active is-${item.id}` : ''}
        onClick={() => setPlacement(item.id)} aria-pressed={placement === item.id}>
        <span>{item.label}</span><b>{item.loss}</b>
      </button>)}
      <div className={`glc-feedback is-${placement === 'supervision' ? 'green' : placement === 'network' ? 'red' : 'orange'}`}
        aria-live="polite">{selected.feedback}</div>
    </aside>
    <div className="glc-code-main">
      <div className="glc-code-cards">
        {choices.map(item => <StudioPanel key={item.id}
          className={`glc-code-card ${placement === item.id ? 'is-selected' : ''}`}
          tone={item.id === 'supervision' ? 'green' : item.id === 'network' ? 'red' : 'orange'}>
          <div className="glc-card-title"><span>{item.label}</span><CodeChip tone={item.id === 'supervision' ? 'green' : item.id === 'network' ? 'red' : 'orange'}>{item.loss}</CodeChip></div>
          <Portrait placement={item.id} />
          <p>{item.id === 'supervision' ? '属性更稳定' : item.id === 'network' ? '语义索引约束过强' : '语义信息减弱'}</p>
        </StudioPanel>)}
      </div>
      <StudioPanel className="glc-code-bottom" tone="purple">
        <div className="glc-code-formula">
          <span className="glc-section-label">式 (5) 的训练期辅助目标 · CLIC2020</span>
          <div className="glc-formula">
            <SymbolHint meaning="𝒟_code：潜码预测失真，由索引分类交叉熵与潜码 MSE 组成。">𝒟_code</SymbolHint>
            <span>(l, l̂) = </span>
            <SymbolHint meaning="α：交叉熵权重，论文默认设为 0.5。">α</SymbolHint>
            <span>CE(M_l, M̂_l̂) + ‖l−l̂‖²</span>
          </div>
          <p>训练目标强化语义；推理路径不经过码预测器，避免量化索引成为额外瓶颈。</p>
        </div>
        <div className="glc-code-bars">
          <MetricBar label="无码预测" value={13.1} max={65} suffix="% BD-Rate" tone="orange" />
          <MetricBar label="推理网络内码预测" value={60.7} max={65} suffix="% BD-Rate" tone="red" />
          <MetricBar label="仅训练监督" value={0} max={65} suffix="%" tone="green" />
          <p className="glc-metric-rule">百分比是相较“仅训练监督”的 BD-Rate 损失；人脸图为属性示意。</p>
        </div>
      </StudioPanel>
    </div>
  </div>;
}
