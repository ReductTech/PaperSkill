import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type BranchTone = 'on' | 'off' | 'partial';

type Stage = {
  id: string;
  title: string;
  group: '能力建立' | '统一训练' | '生成后优化';
  summary: string;
  data: string;
  objective: string;
  schedule: string;
  understanding: { label: string; tone: BranchTone };
  generation: { label: string; tone: BranchTone };
  substeps: Array<{ title: string; detail: string }>;
  handoff: string;
  source: string;
};

const stages: Stage[] = [
  {
    id: 'Stage 1',
    title: '理解预热',
    group: '能力建立',
    summary: '先融合注意力参数，再恢复完整理解能力。',
    data: '更新后的理解 mid-training 语料；理解数据占比 1.00。',
    objective: '只启用语言 CE，CE : MSE = 1 : 0。',
    schedule: '120K steps · 峰值学习率 2×10⁻⁵ · Constant · 0.75T tokens。',
    understanding: { label: '先部分、后全部更新', tone: 'partial' },
    generation: { label: '未启用', tone: 'off' },
    substeps: [
      {
        title: '① Attention-Fusion',
        detail: '冻结其余网络，只更新 Q/K/V、输出投影与 QK normalization；恢复融合前准确率。',
      },
      {
        title: '② Full-Model Continuation',
        detail: '解冻整个理解分支，在同一语料上继续训练，形成后续生成训练的语义骨干。',
      },
    ],
    handoff: '输出：可为生成分支提供稳定语义条件的理解骨干。',
    source: '论文 §3.4 Stage 1；Table 2。',
  },
  {
    id: 'Stage 2',
    title: '生成预训练',
    group: '能力建立',
    summary: '冻结理解分支，用三个子阶段逐步扩大生成能力。',
    data: '从纯 T2I 扩展到生成 0.56、编辑 0.37、交错 0.07。',
    objective: '只启用像素流匹配 MSE，CE : MSE = 0 : 1。',
    schedule: '120K + 60K + 120K steps；生成分辨率由 256²–512² 扩展到 512²–2048²。',
    understanding: { label: '冻结', tone: 'off' },
    generation: { label: '更新', tone: 'on' },
    substeps: [
      {
        title: 'Phase I · 建立 T2I 基础',
        detail: '纯文生图，120K steps，学习率 2×10⁻⁴；大图按宽高比缩放到不超过 512×512。',
      },
      {
        title: 'Phase II · 提升分辨率',
        detail: '继续纯文生图，60K steps，学习率 1×10⁻⁴；使用不小于 512² 的样本并扩展到 2048²。',
      },
      {
        title: 'Phase III · 扩展任务',
        detail: '加入编辑、推理与交错图文数据，120K steps；学习率从 1×10⁻⁴ 余弦衰减到 2×10⁻⁵。',
      },
    ],
    handoff: '输出：不破坏理解骨干的稳定生成基础。',
    source: '论文 §3.4 Stage 2；Table 2。',
  },
  {
    id: 'Stage 3',
    title: '统一中训',
    group: '统一训练',
    summary: '两条分支首次端到端共同优化。',
    data: '理解 0.33 · 生成 0.37 · 编辑 0.24 · 交错 0.06。',
    objective: '联合目标：λ₁=0.1、λ₂=1.0，即 CE : MSE = 0.1 : 1。',
    schedule: '84K steps · 学习率 2×10⁻⁵ · Constant · 1.19T tokens。',
    understanding: { label: '更新', tone: 'on' },
    generation: { label: '更新', tone: 'on' },
    substeps: [
      {
        title: '① 混合四类任务',
        detail: '文本/多模态理解、T2I、图像编辑与交错图文按固定比例共同采样。',
      },
      {
        title: '② 联合更新完整模型',
        detail: '语言 CE 保留较小权重 0.1，像素速度 MSE 权重为 1.0；共享表示在统一任务混合中形成。',
      },
    ],
    handoff: '输出：理解与生成可在同一 MoT 中协同工作的统一表示。',
    source: '论文 §3.4 Stage 3；Eq. (1)；Table 2。',
  },
  {
    id: 'Stage 4',
    title: '统一 SFT',
    group: '统一训练',
    summary: '用高质量指令数据完成跨模态任务对齐。',
    data: '沿用 Stage 3 的四类比例，但换成高质量指令跟随数据。',
    objective: '继续使用 CE : MSE = 0.1 : 1。',
    schedule: '9K steps · 学习率 2×10⁻⁵→0 · Cosine decay · 0.13T tokens。',
    understanding: { label: '更新', tone: 'on' },
    generation: { label: '更新', tone: 'on' },
    substeps: [
      {
        title: '① 统一指令输入',
        detail: '覆盖多模态对话、图像生成、图像编辑与交错图文任务。',
      },
      {
        title: '② 保持联合目标完成对齐',
        detail: '完整模型继续更新，训练重点从能力建立转向指令遵循和任务表现。',
      },
    ],
    handoff: '输出：完成理解与生成指令对齐的统一基础模型。',
    source: '论文 §3.4 Stage 4；Table 2。',
  },
  {
    id: 'Stage 5',
    title: 'T2I 后训练',
    group: '生成后优化',
    summary: '用动态分辨率课程与多奖励 RL 提升生成质量。',
    data: '中英文文字渲染提示 + 风格约束提示 + 通用图像生成提示。',
    objective: 'Flow-GRPO：OCR、风格遵循与 HPSv3 审美/偏好奖励。',
    schedule: '文字 RL 600 epochs；通用 RL：8B 1600 epochs、A3B 200 epochs。',
    understanding: { label: '冻结', tone: 'off' },
    generation: { label: '部分更新', tone: 'partial' },
    substeps: [
      {
        title: '① 动态分辨率热身',
        detail: '前 200 epochs 先采样较容易的宽高比与面积，再逐步开放更困难的分辨率组合。',
      },
      {
        title: '② 文字渲染 RL',
        detail: '以 OCR 文本集合 IoU 为奖励；每 epoch 采样 48 个提示，每个提示生成 16 张图。',
      },
      {
        title: '③ 统一通用 RL',
        detail: '按 epoch 交替“文字+风格”和“HPSv3 审美”两组奖励；风格系数 λsty=0.5。',
      },
    ],
    handoff: '输出：文本渲染、风格遵循与审美偏好更强的 T2I 模型。',
    source: '论文 §3.4 Stage 5；Eq. (7)–(9)。',
  },
  {
    id: 'Stage 6',
    title: 'CFG 与步数蒸馏',
    group: '生成后优化',
    summary: '用 DMD2 把生成采样从 100 NFE 压缩到 8 NFE。',
    data: 'T2I、编辑与交错数据统一用于蒸馏；编辑/交错的反向模拟使用真实图像。',
    objective: 'DMD2：生成器 G 对齐教师 T 的目标分布，假流模型 F 估计当前生成分布。',
    schedule: 'G 每更新 1 次，F 更新 5 次；LR(G)=2×10⁻⁶，LR(F)=4×10⁻⁷。',
    understanding: { label: '冻结', tone: 'off' },
    generation: { label: '更新', tone: 'on' },
    substeps: [
      {
        title: '① 初始化 G、F、T',
        detail: '生成器、假流模型和教师均从教师模型初始化；T 提供目标数据分布的 score。',
      },
      {
        title: '② 交替更新 F 与 G',
        detail: 'F 更频繁地追踪生成分布；G 依据分布差异被蒸馏。只优化生成侧 MoT 与 Patch 编解码层。',
      },
      {
        title: '③ 压缩采样',
        detail: '在统一任务设置中将论文报告的函数评估次数由 100 NFE 降为 8 NFE。',
      },
    ],
    handoff: '输出：保持统一生成任务覆盖、但采样成本显著降低的生成分支。',
    source: '论文 §3.4 Stage 6。',
  },
];

const groupOrder: Stage['group'][] = ['能力建立', '统一训练', '生成后优化'];

export const TrainingFlowMap: React.FC<WidgetProps> = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const stage = stages[activeIndex];
  const progress = `${(activeIndex / (stages.length - 1)) * 83.334}%`;

  return (
    <div className="training-map">
      <div className="training-map-intro">
        <div>
          <p className="training-map-kicker">论文 §3.4 · Stage 1–6</p>
          <h4>能力建立 → 统一训练 → 生成后优化</h4>
        </div>
        <p>点击任一阶段，下方同步更新子阶段、数据、目标、参数更新范围和交接结果。</p>
      </div>

      <div className="training-group-row" aria-hidden="true">
        {groupOrder.map((group) => <span key={group}>{group}</span>)}
      </div>

      <div className="training-stage-rail" style={{ '--training-progress': progress } as React.CSSProperties} role="tablist" aria-label="选择训练阶段">
        {stages.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            className={`${index === activeIndex ? 'is-active' : ''} ${index < activeIndex ? 'is-past' : ''}`}
            onClick={() => setActiveIndex(index)}
          >
            <span className="training-stage-number">{index + 1}</span>
            <strong>{item.id}</strong>
            <small>{item.title}</small>
          </button>
        ))}
      </div>

      <div className="training-branch-matrix" aria-label="各阶段的参数更新范围">
        <div className="training-branch-label">理解分支</div>
        {stages.map((item, index) => (
          <span key={`${item.id}-und`} className={`tone-${item.understanding.tone} ${index === activeIndex ? 'is-active' : ''}`}>
            {item.understanding.label}
          </span>
        ))}
        <div className="training-branch-label">生成分支</div>
        {stages.map((item, index) => (
          <span key={`${item.id}-gen`} className={`tone-${item.generation.tone} ${index === activeIndex ? 'is-active' : ''}`}>
            {item.generation.label}
          </span>
        ))}
      </div>

      <article className="training-stage-detail" key={stage.id}>
        <header>
          <div>
            <p>{stage.id} · {stage.group}</p>
            <h4>{stage.title}</h4>
          </div>
          <strong>{stage.summary}</strong>
        </header>

        <div className="training-detail-grid">
          <section className="training-substeps">
            <h5>阶段内部流程</h5>
            <ol>
              {stage.substeps.map((step) => (
                <li key={step.title}>
                  <strong>{step.title}</strong>
                  <span>{step.detail}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="training-stage-facts">
            <div><span>训练数据</span><p>{stage.data}</p></div>
            <div><span>训练目标</span><p>{stage.objective}</p></div>
            <div><span>训练设置</span><p>{stage.schedule}</p></div>
            <div><span>参数更新</span><p>理解：{stage.understanding.label}；生成：{stage.generation.label}。</p></div>
          </section>
        </div>

        <footer>
          <span>{stage.handoff}</span>
          <small>{stage.source}</small>
        </footer>
      </article>

      <div className="ctrl" role="group" aria-label="顺序查看训练阶段">
        <button type="button" disabled={activeIndex === 0} onClick={() => setActiveIndex((value) => value - 1)}>上一个阶段</button>
        <button type="button" disabled={activeIndex === stages.length - 1} onClick={() => setActiveIndex((value) => value + 1)}>下一个阶段</button>
      </div>

      <p className="note">总流程负责解释“为什么这样衔接、哪些参数在动”；下一模块再用 Table 2 对照 Stage 1–4 的步数、学习率、分辨率、损失权重和数据比例。</p>
    </div>
  );
};

export default TrainingFlowMap;
