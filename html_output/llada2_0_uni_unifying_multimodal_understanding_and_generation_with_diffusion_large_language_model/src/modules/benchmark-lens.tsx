import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type EvidenceView = 'understanding' | 'generation' | 'principle';

const understanding = [
  { name: 'MMStar', paper: 64.1, specialist: 63.9 },
  { name: 'MMMU', paper: 50.1, specialist: 51.3 },
  { name: 'DocVQA', paper: 89.5, specialist: 94.9 },
  { name: 'OCRBench', paper: 75.7, specialist: 84.2 },
  { name: 'ChartQA', paper: 80.1, specialist: 84.1 },
];

const tabs: Array<{ key: EvidenceView; label: string }> = [
  { key: 'understanding', label: '🧠 理解侧' },
  { key: 'generation', label: '🎨 生成与编辑侧' },
  { key: 'principle', label: '⚖️ 比较原则' },
];

function UnderstandingChart() {
  return (
    <div className="evidence-panel">
      <div className="evidence-legend" aria-label="图例"><span className="is-paper">LLaDA2.0-Uni</span><span className="is-specialist">Qwen2.5-VL-7B（专用 VLM）</span></div>
      <div className="grouped-bars" role="img" aria-label="LLaDA2.0-Uni 与 Qwen2.5-VL-7B 在五项理解指标上的水平分组条形图">
        {understanding.map((row) => (
          <div className="grouped-bars__row" key={row.name}>
            <b>{row.name}</b>
            <div className="grouped-bars__pair">
              <div className="grouped-bar"><i className="is-paper" style={{ width: `${row.paper}%` }} /><span>{row.paper.toFixed(1)}</span></div>
              <div className="grouped-bar"><i className="is-specialist" style={{ width: `${row.specialist}%` }} /><span>{row.specialist.toFixed(1)}</span></div>
            </div>
          </div>
        ))}
      </div>
      <p className="evidence-caption">在通用 VQA（MMStar）上与专用 VLM 基本持平；在 MMMU、DocVQA、OCRBench 和 ChartQA 上仍有差距，说明统一建模尚未全面追平专用模型。数据摘自 Table 2，指标均为越高越好。</p>
    </div>
  );
}

function GenerationDashboard() {
  return (
    <div className="evidence-panel">
      <div className="metric-card-grid">
        <article className="metric-card is-blue"><header><span>GenEval</span><small>0–1 区间</small></header><strong>0.89</strong><em>Overall ↑</em><div className="metric-card__sub"><span>Position</span><b>0.90</b></div><div className="metric-card__bar"><i style={{ width: '90%' }} /></div><p>空间排布项为全部参评模型最高。</p></article>
        <article className="metric-card is-green"><header><span>DPG-Bench</span><small>百分制</small></header><strong>87.76</strong><em>Overall ↑</em><div className="metric-card__bar"><i style={{ width: '87.76%' }} /></div><p>统一模型中排名第一。</p></article>
        <article className="metric-card is-purple"><header><span>ImgEdit</span><small>1–5 分制</small></header><strong>3.92</strong><em>Overall ↑</em><div className="metric-card__bar"><i style={{ width: '78.4%' }} /></div><p>高于 OmniGen2（3.44）与 InternVL-U（3.67）。</p></article>
      </div>
      <p className="evidence-caption">三个任务量纲不同（0–1 / 百分制 / 1–5 分），因此分开展示，禁止跨图求和。数据摘自 Table 3、Table 4 与 Table 9。</p>
    </div>
  );
}

function ComparisonPrinciple() {
  return (
    <div className="evidence-panel">
      <div className="comparison-principle" role="img" aria-label="专用模型、旧统一模型和 LLaDA2.0-Uni 的三列方法论对比">
        <article className="is-specialist"><span>Specialists</span><strong>专用模型</strong><p>Qwen2.5-VL：面向理解<br />FLUX：面向生成</p><small>单项能力强，但任务接口分离</small></article>
        <article className="is-paper"><span>LLaDA2.0-Uni</span><strong>语义 Token + 共享 dLLM</strong><p>SigLIP-VQ 将图像变为语义离散 Token，与文本一起接受块级 Mask 预测。</p><small>统一表示入口与预测主干</small></article>
        <article className="is-old"><span>Old Unified</span><strong>旧统一路线</strong><p>重建型 Token，或理解与生成使用不同视觉模块。</p><small>统一能力仍可能伴随表示或目标鸿沟</small></article>
      </div>
      <p className="evidence-caption">统一不是抹平差异，而是让文本与图像以同类离散 Token 进入同一主干，接受同一块级 Mask 预测目标；图像重建仍由专门解码器完成。</p>
    </div>
  );
}

export const BenchmarkLensV4: React.FC<WidgetProps> = () => {
  const [view, setView] = useState<EvidenceView>('understanding');
  return (
    <div className="benchmark-evidence">
      <div className="benchmark-evidence__tabs" role="group" aria-label="选择实验结果视角">
        {tabs.map((tab) => <button key={tab.key} type="button" className={view === tab.key ? 'is-active' : ''} aria-pressed={view === tab.key} onClick={() => setView(tab.key)}>{tab.label}</button>)}
      </div>
      <div aria-live="polite">{view === 'understanding' ? <UnderstandingChart /> : view === 'generation' ? <GenerationDashboard /> : <ComparisonPrinciple />}</div>
    </div>
  );
};
