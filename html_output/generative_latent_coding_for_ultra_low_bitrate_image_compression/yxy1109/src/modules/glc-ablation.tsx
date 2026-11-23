import React, { useState } from 'react';
import { CodeChip, MetricBar, StageBadge, StudioPanel } from './glc-kit';

type Family = 'latent' | 'prediction' | 'attention';

const families: Record<Family, {
  label: string;
  question: string;
  max: number;
  rows: Array<{ label: string; value: number; tone: 'red' | 'orange' | 'green' | 'blue' | 'purple' }>;
  axis: number[];
}> = {
  latent: {
    label: '潜码怎么编',
    question: '直接传索引图，还是做变换编码并换超先验？',
    max: 70,
    axis: [0, 20, 40, 60],
    rows: [
      { label: '索引图直传', value: 66.2, tone: 'red' },
      { label: '变换编码 · 分解先验', value: 17.7, tone: 'orange' },
      { label: '变换编码 · 分类先验', value: 0, tone: 'green' }
    ]
  },
  prediction: {
    label: '码预测放哪',
    question: '码预测应在推理路径里，还是只当训练监督？',
    max: 65,
    axis: [0, 20, 40, 60],
    rows: [
      { label: '无码预测', value: 13.1, tone: 'orange' },
      { label: '推理网络内预测', value: 60.7, tone: 'red' },
      { label: '仅训练监督', value: 0, tone: 'green' }
    ]
  },
  attention: {
    label: '注意力范围',
    question: '高分辨率潜码应做全局注意力，还是局部 patch 注意力？',
    max: 25,
    axis: [0, 5, 10, 15, 20],
    rows: [
      { label: 'Global', value: 20.8, tone: 'red' },
      { label: '64×64 patch', value: 8.4, tone: 'orange' },
      { label: '32×32 patch', value: 0, tone: 'green' },
      { label: '16×16 patch', value: 1.8, tone: 'blue' }
    ]
  }
};

export function GlcAblation() {
  const [family, setFamily] = useState<Family>('latent');
  const current = families[family];
  return <div className="glc-scene glc-ablation-page">
    <aside className="glc-ablation-menu">
      <StageBadge tone="green">消融对照</StageBadge>
      <h3>选择变化轴</h3>
      {(Object.keys(families) as Family[]).map(key => <button key={key} className={family === key ? 'is-active' : ''}
        onClick={() => setFamily(key)} aria-pressed={family === key}>
        <span>{families[key].label}</span><b>{key === 'latent' ? '表 1' : key === 'prediction' ? '表 2' : '表 4'}</b>
      </button>)}
      <div className="glc-direction-card">
        <span>BD-Rate</span><b>越低越好 ↓</b>
        <p>0% 指当前论文方法的参考设置，不是“零错误”或绝对完美。</p>
      </div>
    </aside>
    <StudioPanel className="glc-ablation-chart" tone="green">
      <div className="glc-chart-head">
        <div>
          <span className="glc-section-label">CLIC2020 · FID–BPP 曲线</span>
          <h3>{current.question}</h3>
        </div>
        <CodeChip tone="green">所有柱共用当前组尺度</CodeChip>
      </div>
      <div className="glc-axis">
        {current.axis.map(tick => <span key={tick} style={{ left: `${tick / current.max * 100}%` }}>{tick}%</span>)}
      </div>
      <div className="glc-ablation-bars">
        {current.rows.map(row => <MetricBar key={row.label} label={row.label} value={row.value} max={current.max}
          suffix="% BD-Rate" tone={row.tone} />)}
      </div>
      <div className="glc-chart-foot">
        <p><b>读图结论：</b>{family === 'latent'
          ? '直接索引图的曲线整体最差；分类超先验进一步减少了变换编码的超信息成本。'
          : family === 'prediction'
            ? '码预测放进推理会形成瓶颈；只在训练期约束语义，性能最好。'
            : '32×32 局部注意力是该高分辨率设置的参考；全局注意力反而损失最大。'}</p>
        <span>柱高是相对 BD-Rate 损失；不能读成 bpp 或参数节省。</span>
      </div>
    </StudioPanel>
  </div>;
}
