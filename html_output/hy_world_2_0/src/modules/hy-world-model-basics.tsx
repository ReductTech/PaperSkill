import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type ModelLensId = 'video' | 'action-video' | 'reconstruction' | 'hy-world';
type StressTestId = 'occlusion' | 'revisit' | 'action';
type StressStatus = 'strong' | 'conditional' | 'weak';

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

const stressTests: Array<{ id: StressTestId; title: string; question: string }> = [
  { id: 'occlusion', title: '绕到遮挡背面', question: '相机看到输入里没有出现过的柜子背面，会发生什么？' },
  { id: 'revisit', title: '离开后再回访', question: '走出房间再回来，桌椅位置是否还能保持？' },
  { id: 'action', title: '推动场景物体', question: '用户推动椅子后，世界状态能否继续响应？' },
];

const stressMatrix: Record<ModelLensId, Record<StressTestId, {
  status: StressStatus;
  label: string;
  verdict: string;
  explanation: string;
  hidden: string;
  revisit: string;
  action: string;
}>> = {
  video: {
    occlusion: {
      status: 'conditional', label: '能补画，不能当测量', verdict: '背面可以被生成，但不是被相机恢复出来的真实几何。',
      explanation: '视频生成器擅长合成视觉上合理的新画面；它没有义务输出可测量、可编辑的柜子三维结构。',
      hidden: '生成先验补画', revisit: '没有显式资产保证', action: '通常不接动作',
    },
    revisit: {
      status: 'weak', label: '画面连续不等于持久', verdict: '回到原处可能看起来相似，但缺少可重新加载的空间状态。',
      explanation: '像素序列可以保持短时连贯，却不能因此推断桌椅已经作为三维对象被保存。',
      hidden: '可生成', revisit: '依赖视频时序', action: '通常不接动作',
    },
    action: {
      status: 'weak', label: '没有动作闭环', verdict: '普通离线视频不会因为用户推椅子而持续更新世界。',
      explanation: '动作不是普通视频生成器的持续输入条件；一次生成完成后，用户通常只能播放结果。',
      hidden: '可生成', revisit: '无显式持久状态', action: '不是主要目标',
    },
  },
  'action-video': {
    occlusion: {
      status: 'conditional', label: '随动作继续生成', verdict: '相机转向背面时会生成下一段观察，但状态仍主要存在于像素 rollout 中。',
      explanation: '动作条件视频世界能响应镜头运动；是否长期守住几何，要看模型的时空一致性，而不是只看单帧质量。',
      hidden: '在线生成新观察', revisit: '短时状态延续', action: '直接条件输入',
    },
    revisit: {
      status: 'conditional', label: '可回访，长期一致性有条件', verdict: '连续 rollout 可以带回旧区域，但不等于拥有可编辑三维资产。',
      explanation: '在线像素世界强调低延迟动作反馈；长时间离开后能否完全复原旧场景仍是独立难题。',
      hidden: '在线生成', revisit: '依赖长时记忆', action: '实时响应',
    },
    action: {
      status: 'strong', label: '动作直接驱动观察', verdict: '推动椅子的动作会成为下一段画面的条件。',
      explanation: '这是动作视频世界最核心的优势：环境观察会随用户或智能体动作继续 rollout。',
      hidden: '随轨迹生成', revisit: '像素状态延续', action: '明确具备',
    },
  },
  reconstruction: {
    occlusion: {
      status: 'weak', label: '没有观察就缺少证据', verdict: '柜子背面若从未被拍到，重建器不能把想象当作测量。',
      explanation: '显式重建优先忠实利用多视角对应；有限补全可以存在，但不是任意生成完整世界。',
      hidden: '保持未知或有限补全', revisit: '已观测几何稳定', action: '不负责运行时动作',
    },
    revisit: {
      status: 'strong', label: '已观察区域被几何锚定', verdict: '相机与显式几何会把回访视角重新定位到同一空间。',
      explanation: '多视图或视频提供对应关系，已观察的桌椅可以进入点云、3DGS 等持久表示。',
      hidden: '证据优先', revisit: '显式几何锚定', action: '不负责运行时动作',
    },
    action: {
      status: 'weak', label: '重建不是物理模拟', verdict: '得到三维资产后，是否能推椅子取决于后续引擎与物理设置。',
      explanation: '恢复相机、深度和 3DGS 不会自动赋予物体可交互语义、刚体属性或控制逻辑。',
      hidden: '证据优先', revisit: '显式资产可重载', action: '需要外部运行时',
    },
  },
  'hy-world': {
    occlusion: {
      status: 'conditional', label: '生成背面，再落成资产', verdict: '稀疏输入路径会补出背面，并由重建阶段合成为显式三维世界。',
      explanation: '这是 HY-World 2.0 连接生成与重建的关键；补出的背面来自生成先验，不能称为真实场景测量。',
      hidden: '生成先验补全', revisit: '写入 3DGS / Mesh', action: '生成后进入运行时',
    },
    revisit: {
      status: 'strong', label: '世界生成后可以回访', verdict: '生成或重建结束后，资产可以保存、重新加载并从新视角渲染。',
      explanation: '持久显式三维状态是 2.0 相对逐帧视频路线最重要的输出范式差别之一。',
      hidden: '生成或观测恢复', revisit: '显式资产保持', action: 'WorldLens 漫游',
    },
    action: {
      status: 'conditional', label: '可漫游交互，不是在线再生成', verdict: 'WorldLens 可处理角色、碰撞与实时渲染，但完整世界生成仍在运行前完成。',
      explanation: '推动椅子一类行为需要资产、碰撞代理和运行时规则；这不代表生成模型会随每个动作实时重建世界。',
      hidden: '离线生成/重建', revisit: '资产可重载', action: '运行时部分覆盖',
    },
  },
};

export const HyWorldModelBasics: React.FC<WidgetProps> = () => {
  const [lensId, setLensId] = useState<ModelLensId>('hy-world');
  const [stressTestId, setStressTestId] = useState<StressTestId>('revisit');
  const lens = lenses.find((item) => item.id === lensId) ?? lenses[3];
  const stressTest = stressTests.find((item) => item.id === stressTestId) ?? stressTests[1];
  const stress = stressMatrix[lens.id][stressTest.id];

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

      <section className="world-model-stress" aria-live="polite">
        <header>
          <div>
            <span>状态持久性压力测试</span>
            <strong>{stressTest.question}</strong>
          </div>
          <small>这是范式教学实验，不是统一数据集上的模型排行榜。</small>
        </header>
        <div className="world-model-stress-tests" role="group" aria-label="选择世界状态压力测试">
          {stressTests.map((test) => (
            <button key={test.id} type="button" className={stressTestId === test.id ? 'selected' : ''} aria-pressed={stressTestId === test.id} onClick={() => setStressTestId(test.id)}>
              {test.title}
            </button>
          ))}
        </div>
        <div className="world-model-stress-body">
          <div className={`world-model-stress-scene ${stressTest.id} ${lens.id}`} aria-label={`${lens.short} 的${stressTest.title}示意`}>
            <div className="stress-room-label">观察房间</div>
            <div className="stress-wall" />
            <div className="stress-cabinet"><span>柜</span></div>
            <div className="stress-chair"><span>椅</span></div>
            <div className="stress-camera"><span>CAM</span></div>
            <div className="stress-trace" />
            <div className="stress-zone">遮挡区</div>
          </div>
          <div className={`world-model-stress-readout ${stress.status}`}>
            <span>{stress.label}</span>
            <strong>{stress.verdict}</strong>
            <p>{stress.explanation}</p>
          </div>
        </div>
        <div className="world-model-state-ledger">
          <div><span>未见区域</span><strong>{stress.hidden}</strong></div>
          <div><span>离开再回访</span><strong>{stress.revisit}</strong></div>
          <div><span>动作响应</span><strong>{stress.action}</strong></div>
        </div>
      </section>

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
