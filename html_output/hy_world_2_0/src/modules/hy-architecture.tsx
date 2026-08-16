import React, { useState } from 'react';
import { EvidenceMediaDrawer, PaperTable } from './hy-paper-evidence';
import type { WidgetProps } from './registry';

type PriorId = 'pose' | 'intrinsics' | 'depth';

const priors: Array<{ id: PriorId; label: string; short: string; effect: string }> = [
  { id: 'pose', label: '相机位姿', short: 'Pose', effect: '告诉模型每张照片从哪里拍，减少跨视图坐标歧义。' },
  { id: 'intrinsics', label: '相机内参', short: 'K', effect: '提供焦距与主点，约束像素射线如何进入三维空间。' },
  { id: 'depth', label: '深度先验', short: 'Depth', effect: '提供局部距离线索，帮助表面更快落到合理位置。' },
];

const outputs = [
  { id: 'camera', label: 'Camera', role: '恢复相机参数，把多视图放进共同坐标。', color: '#7c3aed' },
  { id: 'pointmap', label: 'Pointmap', role: '为每个像素预测对应的三维点。', color: '#228d5c' },
  { id: 'depth', label: 'Depth', role: '输出相机坐标下的距离结构。', color: '#27446e' },
  { id: 'normal', label: 'Normal', role: '描述表面朝向，辅助几何与材质判断。', color: '#5b7f68' },
  { id: 'gaussian', label: '3DGS', role: '第二阶段把共享几何变成可渲染高斯属性。', color: '#d97706' },
];

export const HyArchitecture: React.FC<WidgetProps> = () => {
  const [activePriors, setActivePriors] = useState<PriorId[]>([]);
  const [runId, setRunId] = useState(0);
  const [focusOutput, setFocusOutput] = useState('pointmap');
  const toggle = (id: PriorId) => setActivePriors((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const selectedPriorDetails = priors.filter((prior) => activePriors.includes(prior.id));
  const resultBoundary = activePriors.length === 0
    ? '仅 RGB 也是合法输入：模型必须自己估计相机与几何。'
    : activePriors.length === 3
      ? '全部先验已接入，对应 Table 11 可核对的另一端点。'
      : '部分先验会约束歧义，但论文没有在 Table 11 为这个组合报告可插值数值。';

  return <div className="architecture-rebuild">
    <div className="learning-contract">
      <div><span>为什么学</span><p>WorldMirror 不是为相机、深度、点图和 3DGS 各跑一套模型，而是先建立一份共享的跨视图空间理解。</p></div>
      <div><span>本次操作</span><p>为同一份三图重建委托勾选现有先验，点击“执行重建”，再检查五个输出头从共享特征中各取走什么。</p></div>
      <div><span>应得判断</span><p>Any-Modal 表示 Pose、K、Depth 可有可无；共享骨干复用空间理解，多输出头保留不同预测格式与训练阶段。</p></div>
    </div>

    <section className="reconstruction-brief">
      <header><span>固定委托</span><strong>把三张室内照片交付为可进入 WorldLens 的几何资产</strong></header>
      <div className="reconstruction-brief-views"><i>V1</i><i>V2</i><i>V3</i><b>多视图 RGB 永远必需</b></div>
      <div className="reconstruction-prior-console">
        <span>把手头已有的证据接入输入</span>
        {priors.map((prior) => <button key={prior.id} type="button" className={activePriors.includes(prior.id) ? 'selected' : ''} aria-pressed={activePriors.includes(prior.id)} onClick={() => toggle(prior.id)}><b>{prior.short}</b><small>{prior.label}</small></button>)}
        <button type="button" className="reconstruction-run" onClick={() => setRunId((value) => value + 1)}><span aria-hidden="true">▶</span>执行重建</button>
      </div>
      <p>{selectedPriorDetails.length === 0 ? '当前不提供额外先验。训练时每种先验以 0.5 概率独立丢弃，因此这不是非法输入。' : selectedPriorDetails.map((prior) => prior.effect).join(' ')}</p>
    </section>

    <section className={`reconstruction-runway ${runId > 0 ? 'has-run' : ''}`} key={runId} aria-live="polite">
      <article className="runway-tokenizer"><span>1 · 统一编码</span><strong>RGB + 可选先验 → tokens</strong><small>不同模态先变成同一序列中的条件 token。</small></article>
      <i>→</i>
      <article className="runway-backbone"><span>2 · 共享空间理解</span><strong>Global-local Transformer</strong><small>跨视图匹配、几何关系和上下文只计算一次。</small></article>
      <i>→</i>
      <article className="runway-heads"><span>3 · 专用解码</span><strong>五个输出头同时存在</strong><small>点击下方产物，检查各头为何不能合并成一个输出。</small></article>
    </section>

    <div className="reconstruction-output-lab">
      <div className={`reconstruction-scene ${runId > 0 ? 'resolved' : ''}`}><i/><b/><em>{runId > 0 ? '共享几何已建立' : '等待执行重建'}</em></div>
      <section>
        <header><span>共享骨干之后</span><strong>{runId > 0 ? '五类产物已经解锁' : '执行后查看每个输出头的职责'}</strong></header>
        <div className="reconstruction-output-grid">{outputs.map((output) => <button key={output.id} type="button" disabled={runId === 0} className={focusOutput === output.id && runId > 0 ? 'selected' : ''} onClick={() => setFocusOutput(output.id)} style={{ '--output-color': output.color } as React.CSSProperties}><strong>{output.label}</strong><small>{output.role}</small></button>)}</div>
        <p>{runId === 0 ? '这次操作的目的不是挑一个任务头，而是观察一次共享前向如何同时服务相机、几何与可渲染资产。' : outputs.find((output) => output.id === focusOutput)?.role}</p>
      </section>
    </div>

    <div className={`feedback ${runId > 0 && activePriors.length === 3 ? 'good' : ''}`}>{runId === 0 ? '先配置现有证据并执行重建。' : `${resultBoundary} 先验改变约束条件，不会关闭其它输出头。`}</div>
    <section className="architecture-evidence-strip"><header><span>Table 11 · 7-Scenes 高分辨率端点</span><strong>Acc. / Comp. 越低越好</strong></header><div className="architecture-evidence-pair"><div className={runId > 0 && activePriors.length === 0 ? 'active' : ''}><span>仅图像</span><strong>Acc. 0.037 · Comp. 0.040</strong><small>WorldMirror 2.0，756×1036</small></div><i>→</i><div className={runId > 0 && activePriors.length === 3 ? 'active' : ''}><span>图像 + 全部先验</span><strong>Acc. 0.012 · Comp. 0.016</strong><small>Pose + K + Depth</small></div></div><p>论文没有在 Table 11 报告所有部分先验组合，不能对中间状态插值出数字。</p></section>
    <div className="architecture-glossary-grid"><details><summary>为什么共享骨干？</summary><p>相机、深度与点图都依赖同一跨视图对应关系，共享特征可避免每个任务重复学习空间匹配。</p></details><details><summary>为什么还要多个头？</summary><p>相机是全局参数，点图、深度、法线是像素级几何，3DGS 是可渲染属性，它们需要不同解码形式和监督。</p></details><details><summary>3DGS 为何第二阶段训练？</summary><p>论文先联合训练几何头，再冻结几何参数单独训练 3DGS 头，以解耦几何学习与外观建模。</p></details></div>
    <div className="evidence-media-stack"><EvidenceMediaDrawer mediaType="论文原图" src="/images/figure-12-worldmirror.png" title="论文 Figure 12：WorldMirror 2.0 架构" caption="用于核对 Any-Modal 输入、共享骨干和多输出头的真实连接。" alt="WorldMirror 2.0 架构原图"/><EvidenceMediaDrawer mediaType="官方 GIF" src="/images/official-reconstruction.gif" title="多图与视频重建演示" caption="官方演示帮助理解最终任务流程，不替代论文指标。" alt="官方多视图重建演示" sourceUrl="https://github.com/Tencent-Hunyuan/HY-World-2.0" sourceLabel="腾讯混元官方仓库素材 ↗"/></div>
    <PaperTable tableId="table-11"/>
  </div>;
};

export default HyArchitecture;
