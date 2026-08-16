import React, { useEffect, useMemo, useState } from 'react';
import { EvidenceMediaDrawer, PaperTable } from './hy-paper-evidence';
import type { WidgetProps } from './registry';

type PriorId = 'pose' | 'intrinsics' | 'depth';
type StepId = 'idle' | 'rgb' | PriorId | 'shared' | 'heads' | `inspect-${string}` | 'done';

const priors: Array<{ id: PriorId; label: string; short: string; effect: string }> = [
  { id: 'pose', label: '相机位姿', short: 'Pose', effect: '告诉模型每张照片从哪里拍，减少跨视图坐标歧义。' },
  { id: 'intrinsics', label: '相机内参', short: 'K', effect: '提供焦距与主点，约束像素射线如何进入三维空间。' },
  { id: 'depth', label: '深度先验', short: 'Depth', effect: '提供局部距离线索，帮助表面更快落到合理位置。' },
];

const outputs = [
  { id: 'camera', label: 'Camera', role: '恢复相机参数，把多视图放进共同坐标。', check: '检查跨视图回投影是否一致', issue: '候选位姿漂移', quality: 'reject', color: '#7c3aed' },
  { id: 'pointmap', label: 'Pointmap', role: '为每个像素预测对应的三维点。', check: '检查点是否脱离连续表面', issue: '候选含离群点', quality: 'reject', color: '#228d5c' },
  { id: 'depth', label: 'Depth', role: '输出相机坐标下的距离结构。', check: '检查无效深度与遮挡空洞', issue: '深度连续', quality: 'pass', color: '#27446e' },
  { id: 'normal', label: 'Normal', role: '描述表面朝向，辅助几何与材质判断。', check: '检查相邻表面朝向是否突翻', issue: '候选局部翻转', quality: 'reject', color: '#5b7f68' },
  { id: 'gaussian', label: '3DGS', role: '第二阶段把共享几何变成可渲染高斯属性。', check: '检查渲染中漂浮与重复高斯', issue: '渲染结构稳定', quality: 'pass', color: '#d97706' },
] as const;

const stepCopy: Record<string, string> = {
  rgb: '先把三张 RGB 观察编码为必需 token。',
  pose: 'Pose token 接入：为每张图补充拍摄位置与朝向。',
  intrinsics: 'K token 接入：补充焦距、主点与像素射线约束。',
  depth: 'Depth token 接入：补充局部距离先验。',
  shared: '全部可用 token 进入同一个 Global-local Transformer，共享跨视图空间理解。',
  heads: '共享特征同时分流到五个专用输出头；它们不是五次独立重建。',
  done: '五类产物验收完成。点击任一输出，可复查它的职责与常见坏候选。',
};

export const HyArchitecture: React.FC<WidgetProps> = () => {
  const [activePriors, setActivePriors] = useState<PriorId[]>([]);
  const [runSteps, setRunSteps] = useState<StepId[]>(['idle']);
  const [cursor, setCursor] = useState(0);
  const [running, setRunning] = useState(false);
  const [focusOutput, setFocusOutput] = useState('camera');
  const stage = runSteps[cursor] ?? 'idle';
  const stageIndex = (id: StepId) => runSteps.indexOf(id);
  const reached = (id: StepId) => stageIndex(id) >= 0 && cursor >= stageIndex(id);
  const activeInspection = stage.startsWith('inspect-') ? stage.slice(8) : '';
  const checkedOutputs = useMemo(
    () => outputs.filter((output) => reached(`inspect-${output.id}`)).map((output) => output.id),
    [cursor, runSteps],
  );

  useEffect(() => {
    if (!running) return;
    if (cursor >= runSteps.length - 1) { setRunning(false); return; }
    const timer = window.setTimeout(() => setCursor((value) => value + 1), stage.startsWith('inspect-') ? 1050 : 850);
    return () => window.clearTimeout(timer);
  }, [cursor, runSteps, running, stage]);

  useEffect(() => {
    if (activeInspection) setFocusOutput(activeInspection);
  }, [activeInspection]);

  const toggle = (id: PriorId) => {
    if (running) return;
    setActivePriors((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setRunSteps(['idle']);
    setCursor(0);
    setFocusOutput('camera');
  };

  const run = () => {
    const selected = priors.filter((prior) => activePriors.includes(prior.id)).map((prior) => prior.id);
    setRunSteps(['rgb', ...selected, 'shared', 'heads', ...outputs.map((output) => `inspect-${output.id}` as StepId), 'done']);
    setCursor(0);
    setFocusOutput('camera');
    setRunning(true);
  };

  const selectedPriorDetails = priors.filter((prior) => activePriors.includes(prior.id));
  const hasRun = stage !== 'idle';
  const resultBoundary = activePriors.length === 0
    ? '仅 RGB 也是合法输入：模型必须自己估计相机与几何。'
    : activePriors.length === 3
      ? '全部先验已接入，对应 Table 11 可核对的另一端点。'
      : '部分先验会约束歧义，但论文没有在 Table 11 为这个组合报告可插值数值。';
  const currentOutput = outputs.find((output) => output.id === focusOutput) ?? outputs[0];
  const stageMessage = activeInspection
    ? currentOutput.quality === 'reject'
      ? `正在验收 ${currentOutput.label}：${currentOutput.check}；标记“${currentOutput.issue}”后退回这个教学坏候选。`
      : `正在验收 ${currentOutput.label}：${currentOutput.check}；当前教学候选通过，不执行丢弃。`
    : stepCopy[stage] ?? '先选择手头已有的先验，再播放一次完整重建。';

  return <div className="architecture-rebuild">
    <div className="learning-contract">
      <div><span>为什么学</span><p>WorldMirror 不是为相机、深度、点图和 3DGS 各跑一套模型，而是先建立一份共享的跨视图空间理解。</p></div>
      <div><span>本次操作</span><p>勾选现有先验并播放流程，观察证据怎样逐项接入、共享骨干怎样复用计算、五个输出怎样依次接受质量检查。</p></div>
      <div><span>应得判断</span><p>Any-Modal 表示 Pose、K、Depth 可有可无；共享骨干复用空间理解，多输出头保留不同预测格式与训练阶段。</p></div>
    </div>

    <section className="reconstruction-brief">
      <header><span>固定委托</span><strong>把三张室内照片交付为可进入 WorldLens 的几何资产</strong></header>
      <div className="reconstruction-brief-views"><i>V1</i><i>V2</i><i>V3</i><b>多视图 RGB 永远必需</b></div>
      <div className="reconstruction-prior-console">
        <span>把手头已有的证据接入输入</span>
        {priors.map((prior) => <button key={prior.id} type="button" disabled={running} className={activePriors.includes(prior.id) ? 'selected' : ''} aria-pressed={activePriors.includes(prior.id)} onClick={() => toggle(prior.id)}><b>{prior.short}</b><small>{prior.label}</small></button>)}
        <button type="button" className="reconstruction-run" disabled={running} onClick={run}><span aria-hidden="true">{running ? '●' : '▶'}</span>{running ? '流程播放中' : hasRun ? '重新播放' : '执行重建'}</button>
      </div>
      <p>{selectedPriorDetails.length === 0 ? '当前不提供额外先验。训练时每种先验以 0.5 概率独立丢弃，因此这不是非法输入。' : selectedPriorDetails.map((prior) => prior.effect).join(' ')}</p>
    </section>

    <section className={`reconstruction-flowboard ${reached('heads') ? 'heads-ready' : ''}`} aria-live="polite">
      <header><div><span>从左到右，再进入下一行</span><strong>Any-Modal 共享重建与输出巡检</strong></div><p>{stageMessage}</p></header>
      <div className="reconstruction-token-lane">
        <article className={reached('rgb') ? 'accepted active' : ''}><span>01</span><b>RGB</b><small>三张必需观察</small><i>{reached('rgb') ? '已编码' : '等待接入'}</i></article>
        {priors.map((prior, index) => {
          const selected = activePriors.includes(prior.id);
          return <article key={prior.id} className={`${selected ? 'selected' : 'skipped'} ${reached(prior.id) ? 'accepted active' : ''}`}><span>0{index + 2}</span><b>{prior.short}</b><small>{selected ? prior.label : `${prior.label}缺省`}</small><i>{selected && reached(prior.id) ? '已接入' : selected ? '等待' : '跳过'}</i></article>;
        })}
        <span className={reached('shared') ? 'flow active' : 'flow'}>→</span>
        <article className={`shared-token ${reached('shared') ? 'accepted active' : ''}`}><span>05</span><b>Shared Transformer</b><small>Global-local 跨视图理解</small><i>{reached('shared') ? '共享空间特征建立' : '等待 token'}</i></article>
      </div>
      <div className={`reconstruction-row-turn ${reached('heads') ? 'active' : ''}`}><span>↓</span><strong>共享特征进入下一行，同时分流给五个专用输出头</strong></div>
      <div className="reconstruction-head-row">
        <div className="reconstruction-shared-core"><span>06 · 一次共享前向</span><strong>对应关系 + 几何上下文</strong><i /><small>复用同一份空间理解</small></div>
        <span className="reconstruction-fan-arrow" aria-hidden="true">→</span>
        <div className="reconstruction-output-grid">
        {outputs.map((output) => {
          const checking = activeInspection === output.id;
          const checked = checkedOutputs.includes(output.id) && !checking;
          const outcome = output.quality === 'reject' ? 'reject' : 'pass';
          return <button
            key={output.id}
            type="button"
            disabled={!reached('heads')}
            className={`${focusOutput === output.id && reached('heads') ? 'selected' : ''} ${outcome} ${checking ? 'checking' : ''} ${checked ? 'checked' : ''}`}
            onClick={() => setFocusOutput(output.id)}
            style={{ '--output-color': output.color } as React.CSSProperties}
          >
            <span className={`output-preview ${output.id}`} aria-hidden="true"><i /><i /><i /><b /></span>
            <span className="output-card-title"><strong>{output.label}</strong><b>{checking ? output.quality === 'reject' ? '标记问题' : '扫描通过' : checked ? output.quality === 'reject' ? '已退回' : '可交付' : '待检'}</b></span>
            <small>{output.check}</small><em>{output.issue}</em>
          </button>;
        })}
        </div>
      </div>
    </section>

    <div className="reconstruction-inspection-note">
      <span>教学验收示意</span>
      <strong>{currentOutput.label}：{currentOutput.role}</strong>
      <p>{currentOutput.quality === 'reject' ? `当前用“${currentOutput.issue}”演示坏候选如何被标记并退回。` : `当前用“${currentOutput.issue}”演示正常候选通过检查并保留。`} 这只是解释每类产物应检查什么，不是声称论文新增了统一自动验收网络。</p>
    </div>

    <div className={`feedback ${stage === 'done' && activePriors.length === 3 ? 'good' : ''}`}>{!hasRun ? '先配置现有证据并执行重建。' : `${resultBoundary} 先验收已有产物，再进入后续深度对齐与 3DGS 资产优化。`}</div>
    <section className="architecture-evidence-strip"><header><span>Table 11 · 7-Scenes 高分辨率端点</span><strong>Acc. / Comp. 越低越好</strong></header><div className="architecture-evidence-pair"><div className={hasRun && activePriors.length === 0 ? 'active' : ''}><span>仅图像</span><strong>Acc. 0.037 · Comp. 0.040</strong><small>WorldMirror 2.0，756×1036</small></div><i>→</i><div className={hasRun && activePriors.length === 3 ? 'active' : ''}><span>图像 + 全部先验</span><strong>Acc. 0.012 · Comp. 0.016</strong><small>Pose + K + Depth</small></div></div><p>论文没有在 Table 11 报告所有部分先验组合，不能对中间状态插值出数字。</p></section>
    <div className="architecture-glossary-grid"><details><summary>为什么共享骨干？</summary><p>相机、深度与点图都依赖同一跨视图对应关系，共享特征可避免每个任务重复学习空间匹配。</p></details><details><summary>为什么还要多个头？</summary><p>相机是全局参数，点图、深度、法线是像素级几何，3DGS 是可渲染属性，它们需要不同解码形式和监督。</p></details><details><summary>3DGS 为何第二阶段训练？</summary><p>论文先联合训练几何头，再冻结几何参数单独训练 3DGS 头，以解耦几何学习与外观建模。</p></details></div>
    <div className="evidence-media-stack"><EvidenceMediaDrawer mediaType="论文原图" src="/images/figure-12-worldmirror.png" title="论文 Figure 12：WorldMirror 2.0 架构" caption="用于核对 Any-Modal 输入、共享骨干和多输出头的真实连接。" alt="WorldMirror 2.0 架构原图"/><EvidenceMediaDrawer mediaType="官方 GIF" src="/images/official-reconstruction.gif" title="多图与视频重建演示" caption="官方演示帮助理解最终任务流程，不替代论文指标。" alt="官方多视图重建演示" sourceUrl="https://github.com/Tencent-Hunyuan/HY-World-2.0" sourceLabel="腾讯混元官方仓库素材 ↗"/></div>
    <PaperTable tableId="table-11"/>
  </div>;
};

export default HyArchitecture;
