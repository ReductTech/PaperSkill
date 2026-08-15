import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type ModelLensId = 'video' | 'action-video' | 'reconstruction' | 'hy-world';

type ModelLens = {
  id: ModelLensId;
  short: string;
  title: string;
  question: string;
  inputs: string[];
  state: string;
  outputs: string[];
  feedback: string;
  strength: string;
  boundary: string;
  traits: Array<{ label: string; value: 'yes' | 'partial' | 'no'; note: string }>;
};

const lenses: ModelLens[] = [
  {
    id: 'video',
    short: '视频生成',
    title: '普通视频生成器',
    question: '接下来画面可能长什么样？',
    inputs: ['文本', '参考图'],
    state: '像素或视频潜变量中的时空模式',
    outputs: ['一段视频'],
    feedback: '通常没有供用户持续操控的动作闭环。',
    strength: '擅长合成视觉上连贯的动态内容。',
    boundary: '画面连贯不自动等于拥有可测量、可编辑、可长期保存的三维空间。',
    traits: [
      { label: '补出未见内容', value: 'yes', note: '能生成输入没有直接观察到的画面。' },
      { label: '忠实恢复真实几何', value: 'no', note: '目标通常不是测量真实场景。' },
      { label: '持久三维资产', value: 'no', note: '输出主要是像素序列。' },
      { label: '动作反馈闭环', value: 'no', note: '普通离线视频不接收连续动作。' },
    ],
  },
  {
    id: 'action-video',
    short: '动作视频世界',
    title: '动作条件视频世界模型',
    question: '如果智能体执行这个动作，下一段观察会怎样？',
    inputs: ['初始观察', '用户或智能体动作'],
    state: '随动作更新的生成式视频状态',
    outputs: ['下一段观察', '可继续 rollout 的像素世界'],
    feedback: '动作会改变后续生成画面，形成在线交互循环。',
    strength: '适合快速生成智能体可操作的视觉环境。',
    boundary: '在线像素响应与显式可编辑三维资产是不同范式，不能只按速度判断谁更完整。',
    traits: [
      { label: '补出未见内容', value: 'yes', note: '持续生成动作后的新观察。' },
      { label: '忠实恢复真实几何', value: 'partial', note: '可学习空间规律，但未必输出可测量几何。' },
      { label: '持久三维资产', value: 'no', note: '主要状态仍在像素生成过程中。' },
      { label: '动作反馈闭环', value: 'yes', note: '动作是下一步预测的重要条件。' },
    ],
  },
  {
    id: 'reconstruction',
    short: '三维重建',
    title: '显式三维重建模型',
    question: '这些观察对应的真实空间结构是什么？',
    inputs: ['多视图照片', '视频', '可选相机/深度先验'],
    state: '相机、深度、点图、法线等显式几何',
    outputs: ['点云/点图', '3DGS', '相机与几何属性'],
    feedback: '新输入用于约束同一被观测场景，而不是任意想象遮挡区。',
    strength: '擅长利用多视角对应关系恢复被观察世界。',
    boundary: '没有看到的区域缺少证据，重建器本身不一定负责生成完整世界。',
    traits: [
      { label: '补出未见内容', value: 'partial', note: '可做有限补全，但重点是观测一致性。' },
      { label: '忠实恢复真实几何', value: 'yes', note: '多视角约束用于恢复相机与空间关系。' },
      { label: '持久三维资产', value: 'yes', note: '可输出点云、3DGS 等显式表示。' },
      { label: '动作反馈闭环', value: 'no', note: '重建本身不等于运行时模拟。' },
    ],
  },
  {
    id: 'hy-world',
    short: 'HY-World 2.0',
    title: '生成、重建与模拟相连的三维世界系统',
    question: '线索不足时如何生成，观察充分时如何重建，并怎样留下可运行的世界？',
    inputs: ['文本/单图', '多视图/视频'],
    state: '全景、相机轨迹、跨轨迹记忆与显式三维几何',
    outputs: ['3DGS', 'Mesh', '点云/几何', '可漫游世界'],
    feedback: '生成和重建按输入条件分流，WorldLens 再负责运行时渲染与交互。',
    strength: '把想象未见空间、恢复几何、保存资产和运行时探索接入同一系统。',
    boundary: '这是离线显式三维路线；完整世界生成仍是分钟级，且生成区域不是对真实空间的测量。',
    traits: [
      { label: '补出未见内容', value: 'yes', note: '文本或单图路径使用生成先验扩展世界。' },
      { label: '忠实恢复真实几何', value: 'yes', note: '多视图或视频路径进入 WorldMirror 2.0。' },
      { label: '持久三维资产', value: 'yes', note: '输出 3DGS、Mesh、点云等资产。' },
      { label: '动作反馈闭环', value: 'partial', note: '资产可实时漫游交互，但生成阶段不是实时闭环。' },
    ],
  },
];

const terms = [
  { title: '世界模型', body: '广义上，世界模型学习环境状态及其变化，使系统能够预测、想象或模拟“如果发生某个条件或动作，世界会怎样”。不同论文对状态形式和任务范围的定义并不完全相同。' },
  { title: '生成、重建、模拟', body: '生成负责补出输入未观察到的内容；重建利用观察恢复真实空间关系；模拟强调状态会随动作或规则继续变化。HY-World 2.0 将三者接入一个系统，但不是用同一子模型完成全部任务。' },
  { title: '显式三维表示', body: '点云、Mesh、3D Gaussian Splatting 等表示直接保存空间位置或几何属性，便于渲染、编辑、碰撞和导入引擎。它们与只存在于逐帧像素中的隐式视频状态不同。' },
  { title: '3DGS', body: '3D Gaussian Splatting 用带位置、尺度、旋转、颜色和透明度的三维高斯表示场景，可进行高效可微渲染。HY-World 2.0 还会控制高斯数量与漂浮物。' },
  { title: '数字孪生', body: '数字孪生强调对真实对象或空间的对应恢复与持续使用。教程只在多视图/视频重建语境下使用这一说法；文本生成的世界不能自动称为真实场景数字孪生。' },
  { title: '持久世界', body: '持久世界指生成结束后仍能被保存、重新加载、编辑和从新视角渲染的空间资产。它与“播放完即结束的一段视频”形成输出范式差别。' },
];

const history = [
  { era: '2018', title: '学习环境动力学', body: '《World Models》展示了用压缩视觉表征、记忆模型和控制器学习环境内部模型的经典路线。重点是让智能体在学到的动力学中预测和行动。' },
  { era: '2024', title: '生成式交互环境', body: 'Genie 等工作把大规模视频生成与动作条件结合，世界模型开始直接生成可操作的视觉环境；内部状态不一定是显式三维资产。' },
  { era: '2025', title: '在线像素世界与显式 3D 分流', body: 'HY-World 1.5 / WorldPlay 代表动作驱动在线视频路线，HY-World 1.0 与 WorldMirror 则推进可探索三维世界和统一前馈重建。' },
  { era: '2026', title: 'HY-World 2.0 连接生成、重建与运行时', body: '论文把稀疏输入生成、密集输入重建、显式三维资产和 WorldLens 运行时接在一条系统链中，但各子任务仍有独立条件与评测协议。' },
];

const traitLabel = { yes: '明确具备', partial: '部分覆盖', no: '不是主要目标' } as const;

export const HyWorldModelBasics: React.FC<WidgetProps> = () => {
  const [lensId, setLensId] = useState<ModelLensId>('hy-world');
  const lens = lenses.find((item) => item.id === lensId) ?? lenses[3];

  return (
    <div className="world-model-lab">
      <div className="world-model-lenses" role="tablist" aria-label="切换世界模型观察镜头">
        {lenses.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={lensId === item.id} className={lensId === item.id ? 'selected' : ''} onClick={() => setLensId(item.id)}>
            <span>{item.short}</span>
            <small>{item.question}</small>
          </button>
        ))}
      </div>

      <section className={`world-model-cutaway ${lens.id}`} aria-live="polite">
        <header>
          <span>当前观察镜头</span>
          <h5>{lens.title}</h5>
          <p>{lens.question}</p>
        </header>
        <div className="world-model-flow">
          <div>
            <span>输入线索</span>
            {lens.inputs.map((item) => <b key={item}>{item}</b>)}
          </div>
          <i aria-hidden="true">→</i>
          <div className="world-model-state">
            <span>内部“世界状态”</span>
            <strong>{lens.state}</strong>
          </div>
          <i aria-hidden="true">→</i>
          <div>
            <span>可观察输出</span>
            {lens.outputs.map((item) => <b key={item}>{item}</b>)}
          </div>
        </div>
        <div className="world-model-feedback-loop">
          <span>动作 / 反馈闭环</span>
          <p>{lens.feedback}</p>
        </div>
        <div className="world-model-traits">
          {lens.traits.map((trait) => (
            <div key={trait.label} className={trait.value}>
              <span>{trait.label}</span>
              <strong>{traitLabel[trait.value]}</strong>
              <small>{trait.note}</small>
            </div>
          ))}
        </div>
        <div className="world-model-judgment">
          <p><strong>它擅长：</strong>{lens.strength}</p>
          <p><strong>不能混写：</strong>{lens.boundary}</p>
        </div>
      </section>

      <div className="concept-drawers">
        <section>
          <header><strong>术语抽屉</strong><span>灰色提示：点击词条展开；这些解释用于建立阅读基础。</span></header>
          {terms.map((term) => <details key={term.title}><summary>{term.title}</summary><p>{term.body}</p></details>)}
        </section>
        <section>
          <header><strong>发展史暗格</strong><span>灰色提示：点击年代展开；时间线是教学概览，不是穷尽式综述。</span></header>
          {history.map((item) => <details key={item.era}><summary><time>{item.era}</time>{item.title}</summary><p>{item.body}</p></details>)}
        </section>
      </div>

      <div className="world-model-sources">
        <span>概念延伸：</span>
        <a href="https://arxiv.org/abs/1803.10122" target="_blank" rel="noreferrer">World Models (2018) ↗</a>
        <a href="https://deepmind.google/discover/blog/genie-2-a-large-scale-foundation-world-model/" target="_blank" rel="noreferrer">Genie 2 官方介绍 ↗</a>
        <a href="https://github.com/Tencent-Hunyuan/HY-World-2.0#why-3d-world-models" target="_blank" rel="noreferrer">HY-World 2.0：Why 3D ↗</a>
      </div>
    </div>
  );
};
