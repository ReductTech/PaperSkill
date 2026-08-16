import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type RecipeId = 'real' | 'synthetic' | 'mixed-clean' | 'mixed-dirty';

const recipes: Record<RecipeId, {
  title: string; source: string; coverage: number; realism: number; labels: number; contamination: number;
  lesson: string; conclusion: string; sourceGate: string; qualityGate: string; learnedPrior: string; generationEffect: string;
}> = {
  real: {
    title: '只用真实全景', source: '自然光照与真实纹理', coverage: 52, realism: 94, labels: 38, contamination: 14,
    lesson: '真实数据贴近现实分布，但难以覆盖浮空遗迹、极端视角等想象场景，几何标签也不总是完整。',
    conclusion: '真实数据负责“像现实”，却不能独自解决语义覆盖与精确标签。',
    sourceGate: '保留真实 360° 拍摄，缺少 UE 可控资产。', qualityGate: '仍需剔除明显接缝与拍摄设备。', learnedPrior: '材质、光照和自然噪声更接近真实相机。', generationEffect: '常见场景更自然，稀有语义与极端视角容易缺席。',
  },
  synthetic: {
    title: '只用 UE 合成', source: '可控场景与精确几何', coverage: 82, realism: 58, labels: 96, contamination: 4,
    lesson: '合成数据可自由设计场景并输出精确标签，但渲染规律与真实拍摄之间存在 domain gap。',
    conclusion: '合成数据负责“可控与可标注”，却不能独自替代真实世界外观。',
    sourceGate: '只接收 UE 资产与渲染轨迹，语义可主动扩展。', qualityGate: '几何标签干净，但仍需检查渲染异常。', learnedPrior: '覆盖范围和相机标签强，真实成像统计偏弱。', generationEffect: '构图与结构丰富，但材质、光照可能呈现引擎感。',
  },
  'mixed-clean': {
    title: '双源混合 + 质量过滤', source: '真实质感 + 合成多样性', coverage: 91, realism: 88, labels: 84, contamination: 5,
    lesson: '混合两类来源扩展分布，再过滤明显接缝和拍摄设备入镜，避免模型学习错误视觉模式。',
    conclusion: '论文的关键不是简单拼接两堆数据，而是让双源互补并对污染做质量门控。',
    sourceGate: '真实拍摄与 UE 资产同时进入候选池。', qualityGate: '显式拒绝 stitching artifacts 与相机设备入镜。', learnedPrior: '真实外观、稀有语义和几何标签形成互补。', generationEffect: '既覆盖多样世界，又降低接缝与设备反复出现的概率。',
  },
  'mixed-dirty': {
    title: '双源混合但不过滤', source: '覆盖广，但错误模式也被保留', coverage: 94, realism: 76, labels: 83, contamination: 62,
    lesson: '接缝、支架和拍摄设备会成为高频捷径；模型可能把它们当成全景世界应有的结构。',
    conclusion: '数据越多不等于训练信号越好，污染会把“全景边界”和“相机设备”写进生成先验。',
    sourceGate: '双源样本全部进入，表面覆盖率最高。', qualityGate: '接缝、支架和设备轮廓没有被拦截。', learnedPrior: '模型同时学习场景规律和采集流程的错误捷径。', generationEffect: '边界竖线、底部设备或固定支架可能被重复生成。',
  },
};

function DistributionView({ recipe }: { recipe: RecipeId }) {
  const d = recipes[recipe];
  const points = [
    { x: 12, y: 16, k: '客厅', source: 'real' },
    { x: 22, y: 28, k: '街景', source: 'real' },
    { x: 34, y: 18, k: '自然地貌', source: 'real' },
    { x: 43, y: 35, k: '夜景人群', source: 'real' },
    { x: 51, y: 69, k: '工业空间', source: 'synthetic' },
    { x: 59, y: 54, k: '古城遗迹', source: 'synthetic' },
    { x: 66, y: 79, k: '水下世界', source: 'synthetic' },
    { x: 72, y: 42, k: '航拍峡谷', source: 'synthetic' },
    { x: 79, y: 66, k: '科幻舱', source: 'synthetic' },
    { x: 86, y: 84, k: '浮空遗迹', source: 'synthetic' },
    { x: 91, y: 52, k: '巨构室内', source: 'synthetic' },
    { x: 95, y: 24, k: '极端视点', source: 'synthetic' },
  ];
  const isCovered = (source: string) => recipe === 'mixed-clean' || recipe === 'mixed-dirty' || recipe === source;
  return <div className={`curation-distribution ${recipe}`}>
    <header><span>二维训练分布地图</span><strong>{d.title}</strong></header>
    <div className="curation-plane">
      <span className="curation-y-label top">真实采集主导</span>
      <span className="curation-y-label bottom">可控合成主导</span>
      <span className="curation-x-label left">常见现实</span>
      <span className="curation-x-label right">稀有 / 想象</span>
      <div className="curation-grid-lines" aria-hidden="true" />
      {points.map((point) => <i
        key={point.k}
        className={`${isCovered(point.source) ? 'covered' : 'missing'} ${point.source}`}
        style={{ left: `${point.x}%`, top: `${point.y}%` }}
      ><b>{point.k}</b></i>)}
      {recipe === 'mixed-dirty' ? <><em className="seam-pollution">接缝被学成场景边界</em><em className="rig-pollution">支架被学成固定物体</em></> : null}
    </div>
    <div className="curation-plane-legend"><span><i className="real" />真实来源类别</span><span><i className="synthetic" />合成来源类别</span><span><i className="missing" />当前配方缺口</span></div>
    <p>{d.source}。点位只说明两类来源在“语义稀有度 × 数据生成方式”上的互补关系。</p>
  </div>;
}

function Meter({ label, value, bad = false }: { label: string; value: number; bad?: boolean }) {
  return <div className="curation-meter"><span>{label}</span><i><b style={{ width: `${value}%` }} className={bad ? 'bad' : ''} /></i><strong>{value}</strong></div>;
}

export const HyPanoramaCuration: React.FC<WidgetProps> = () => {
  const [recipe, setRecipe] = useState<RecipeId>('mixed-clean');
  const active = recipes[recipe];
  return <div className="curation-microscope">
    <div className="learning-contract">
      <div><span>为什么学</span><p>HY-Pano 的世界先验来自训练分布；缺少某类场景或保留污染，都会在生成结果中反复出现。</p></div>
      <div><span>本次操作</span><p>切换四种数据配方，观察语义覆盖、真实感、标签能力与污染风险如何共同变化。</p></div>
      <div><span>应得判断</span><p>真实与合成不是二选一；论文采用双源互补，并明确过滤接缝与拍摄设备污染。</p></div>
    </div>
    <div className="curation-recipe-tabs" role="tablist" aria-label="选择全景数据配方">
      {(Object.keys(recipes) as RecipeId[]).map((id) => <button key={id} type="button" role="tab" aria-selected={recipe === id} className={recipe === id ? 'selected' : ''} onClick={() => setRecipe(id)}><strong>{recipes[id].title}</strong><small>{id === 'mixed-clean' ? '论文思路' : id === 'mixed-dirty' ? '失败对照' : '单源对照'}</small></button>)}
    </div>
    <div className="curation-microscope-body">
      <DistributionView recipe={recipe} />
      <section className="curation-meter-panel">
        <header><span>同一训练目标下的教学对照</span><strong>{active.title}</strong></header>
        <Meter label="语义覆盖" value={active.coverage} />
        <Meter label="现实外观" value={active.realism} />
        <Meter label="几何标签" value={active.labels} />
        <Meter label="污染风险" value={active.contamination} bad />
        <small>这些百分比只用于表达相对关系，不是论文公开的数据配比或测量结果。</small>
      </section>
    </div>
    <section className="curation-cause-effect"><span>当前会发生什么</span><strong>{active.lesson}</strong><p>{active.conclusion}</p></section>
    <section className="curation-causal-pipeline" aria-live="polite">
      <header><span>从样本到生成结果</span><strong>把“数据配方”拆成四个可追踪因果环节</strong></header>
      <div>
        <article><b>1</b><span><strong>来源门</strong><small>{active.sourceGate}</small></span></article><i>→</i>
        <article className={recipe === 'mixed-dirty' ? 'danger' : ''}><b>2</b><span><strong>质量门</strong><small>{active.qualityGate}</small></span></article><i>→</i>
        <article><b>3</b><span><strong>学到的先验</strong><small>{active.learnedPrior}</small></span></article><i>→</i>
        <article className={recipe === 'mixed-clean' ? 'success' : recipe === 'mixed-dirty' ? 'danger' : ''}><b>4</b><span><strong>生成时表现</strong><small>{active.generationEffect}</small></span></article>
      </div>
      <p>这里解释的是因果方向，不是论文公开的数据配比。论文明确报告双源策展和质量过滤，但没有给出四项教学百分比的测量值。</p>
    </section>
    <div className={`feedback ${recipe === 'mixed-clean' ? 'good' : recipe === 'mixed-dirty' ? 'bad' : ''}`}>{recipe === 'mixed-clean' ? '双源互补与质量过滤同时成立：分布更广，污染捷径没有被一起收入。' : recipe === 'mixed-dirty' ? '覆盖率看似最高，但错误模式也最强；这正说明“更多样本”不能代替清洗。' : '单源能贡献一部分能力，但会留下另一侧缺口。'}</div>
    <section className="curation-paper-boundary"><span>论文事实与教学抽象</span><p>Section 3.1 明确描述高分辨率真实全景、UE 合成资产，以及对明显 stitching artifacts 和相机设备入镜样本的过滤。上方分布点和百分比是教学抽象，不是论文样本截图或固定配比。</p></section>
    <div className="curation-glossary-grid"><details><summary>什么是 domain gap？</summary><p>真实拍摄与引擎渲染在材质、光照、噪声和纹理统计上存在分布差异。</p></details><details><summary>为什么设备入镜危险？</summary><p>若支架或相机反复出现，模型可能把它学成全景场景的一部分，而不是采集过程的偶然污染。</p></details></div>
  </div>;
};

export default HyPanoramaCuration;
