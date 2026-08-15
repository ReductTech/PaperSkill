import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

type InnovationFilter = 'method' | 'training' | 'system' | 'runtime';

type Innovation = {
  id: string;
  subsystem: string;
  title: string;
  type: string;
  tags: InnovationFilter[];
  problem: string;
  mechanism: string;
  effect: string;
  evidence: string;
  boundary: string;
  locator: string;
  keywords: string[];
};

const filterMeta: Record<InnovationFilter, { label: string; question: string }> = {
  method: { label: '核心方法', question: '论文改变了怎样的表示、规划或网络机制？' },
  training: { label: '训练与效率', question: '哪些设计改善了控制、泛化、步数或大规模推理？' },
  system: { label: '系统集成', question: '哪些贡献来自把不同任务和子系统连成完整链路？' },
  runtime: { label: '运行时能力', question: '哪些设计让生成结果成为可保存、渲染和交互的资产？' },
};

const innovations: Innovation[] = [
  {
    id: 'routing',
    subsystem: 'HY-World 2.0',
    title: '按输入丰富度统一生成与重建',
    type: '系统级贡献',
    tags: ['system'],
    problem: '既有系统常在“从稀疏线索想象未见空间”和“从充分观察忠实恢复几何”之间二选一。',
    mechanism: '文本或单图走四阶段世界生成，多视图或视频直接进入 WorldMirror 2.0 重建；两条路径最终汇入显式三维资产。',
    effect: '同一系统覆盖生成、重建与运行时模拟，而不是把两类任务压成一个无条件计算图。',
    evidence: '论文摘要与 Figure 2 给出输入分流和完整系统结构。',
    boundary: '“统一”不等于所有输入执行相同步骤，也没有一个跨全部子任务的总分。完整世界生成约 712 秒。',
    locator: '摘要、Figure 2、系统总览',
    keywords: ['任务分流', '多模态输入', '显式三维'],
  },
  {
    id: 'pano',
    subsystem: 'HY-Pano 2.0',
    title: '双源数据策展、隐式映射与环形修复',
    type: '数据与生成方法改进',
    tags: ['method', 'training'],
    problem: '高质量全景数据稀缺；显式透视到 ERP 投影又依赖焦距和视场角，元数据误差会放大形变，左右边界还容易出现接缝。',
    mechanism: '混合高分辨率真实全景与 UE 合成资产并过滤明显污染；随后在统一潜空间学习隐式对应，再以循环填充和像素融合处理环形边界。',
    effect: '数据侧拓宽真实质感、精确标签与想象场景分布；模型侧降低对精确相机元数据的依赖并改善全景连续性。',
    evidence: '第 3.1 节给出双源数据与质量过滤策略；表 4 的 I2P 子协议中，CLIP-I 从 HY-World 1.0 的 0.831 提升到 0.844，多项 Q-Align 指标同步改善。',
    boundary: '论文没有公开真实 / 合成固定配比或数据策展独立消融；表 4 数字属于完整 HY-Pano 2.0，不能归因给单一数据或模型机制，也不能外推为完整系统总排名。',
    locator: 'Section 3.1-3.2、Figure 3、Table 4',
    keywords: ['双源数据', '隐式映射', 'ERP 接缝', '循环填充'],
  },
  {
    id: 'nav',
    subsystem: 'WorldNav',
    title: '把相机预算主动投向盲区',
    type: '规划机制',
    tags: ['method', 'system'],
    problem: '只有中心全景时，物体背面、远端走廊、欠观察区域和俯视结构仍然缺失。',
    mechanism: '利用点云、语义分割、NavMesh 和碰撞约束生成常规、环绕、重建感知、漫游、航拍五类互补轨迹。',
    effect: '相机不再平均采样，而是针对不同盲区补充可用于生成和重建的观察。',
    evidence: '论文表 1 明确列出五类轨迹、最大数量、对象绑定和是否迭代执行。',
    boundary: '这是场景感知的启发式规划组合，不是端到端学习得到的全局最优轨迹；数量还受检测对象影响。',
    locator: 'WorldNav、表 1',
    keywords: ['NavMesh', '碰撞约束', '五类轨迹'],
  },
  {
    id: 'stereo',
    subsystem: 'WorldStereo 2.0',
    title: '关键帧潜空间、跨轨迹记忆与四步蒸馏',
    type: '生成与训练改进',
    tags: ['method', 'training'],
    problem: '普通 Video-VAE 会压缩大量相近帧，快速视角变化时损伤控制；多轨迹独立生成又会产生结构与纹理漂移。',
    mechanism: '用 Keyframe-VAE 保留稀疏关键观察，以 GGM 约束全局几何、SSM++ 检索局部参考，最后用 DMD 蒸馏为四步 DiT。',
    effect: '相机控制、跨轨迹一致性和生成步数分别由不同阶段处理，形成可诊断的训练课程。',
    evidence: '论文消融显示选择性冻结改善 RotErr 0.762→0.492、ATE 2.141→1.768；完整记忆配置 PSNR 21.63、SSIM 0.669。',
    boundary: '四步只加速 WorldStereo 2.0 生成器，不等于全景、规划、重建和资产处理都变成实时。',
    locator: 'WorldStereo 2.0、关键帧/记忆/蒸馏消融',
    keywords: ['Keyframe-VAE', 'GGM', 'SSM++', 'DMD'],
  },
  {
    id: 'mirror',
    subsystem: 'WorldMirror 2.0',
    title: '跨分辨率、任意先验与大视图前馈重建',
    type: '重建方法与效率改进',
    tags: ['method', 'training'],
    problem: 'WorldMirror 1.0 在训练外高分辨率、深度一致性、大视图数显存和速度上存在明显瓶颈。',
    mechanism: '使用任意模态 token、归一化 RoPE、深度-法线耦合、深度掩码头、token-budget 动态采样，并结合 SP、BF16、FSDP。',
    effect: '同一前馈骨干可联合输出相机、点图、深度、法线与 3DGS，并提高分辨率与视图规模稳定性。',
    evidence: '表 11 高分辨率 7-Scenes Acc. 误差从 0.079 降到 0.037；表 14 在 H20 四卡、128 视图下达到 5.60 秒。',
    boundary: 'Acc. 是越低越好的误差；5.60 秒只对应特定硬件和 128 视图重建步骤，不代表完整世界生成耗时。',
    locator: 'WorldMirror 2.0、表 3、表 11、表 14',
    keywords: ['Normalized RoPE', 'Any-Modal', 'SP/BF16/FSDP'],
  },
  {
    id: 'assets',
    subsystem: '3DGS + WorldLens',
    title: '从生成结果到紧凑、可运行的持久世界',
    type: '资产与运行时集成',
    tags: ['training', 'system', 'runtime'],
    problem: '直接保留所有高斯会带来约 6M 表示规模，天空与弱监督区域还容易产生漂浮物；仅有资产也不等于能在引擎中交互。',
    mechanism: '先做深度线性对齐，再以非天空自适应增密和 MaskGaussian 压缩表示；WorldLens 负责 IBL、碰撞、角色和引擎无关运行时。',
    effect: '生成输出可以被保存、重新渲染、导入运行时并支持第一/第三人称探索。',
    evidence: '表 9 完整配置将高斯数从 6.000M 降到 1.381M，PSNR 25.176→25.023；官方仓库另展示 Mesh 与角色交互。',
    boundary: '高斯减少约 77% 并非无损；官方交互 GIF 是能力演示，不是物理真实性或统一帧率基准。',
    locator: '3DGS 合成、表 9、WorldLens',
    keywords: ['MaskGaussian', '非天空增密', 'IBL', '碰撞'],
  },
];

export const HyInnovationMap: React.FC<WidgetProps> = () => {
  const [filter, setFilter] = useState<InnovationFilter>('method');
  const visible = useMemo(() => innovations.filter((item) => item.tags.includes(filter)), [filter]);
  const [selectedId, setSelectedId] = useState('pano');
  const selected = innovations.find((item) => item.id === selectedId && item.tags.includes(filter)) ?? visible[0];

  const chooseFilter = (next: InnovationFilter) => {
    setFilter(next);
    const first = innovations.find((item) => item.tags.includes(next));
    if (first) setSelectedId(first.id);
  };

  return (
    <div className="innovation-map">
      <div className="innovation-filters" role="tablist" aria-label="按贡献类型筛选创新点">
        {(Object.keys(filterMeta) as InnovationFilter[]).map((key) => {
          const count = innovations.filter((item) => item.tags.includes(key)).length;
          return <button key={key} type="button" role="tab" aria-selected={filter === key} className={filter === key ? 'selected' : ''} onClick={() => chooseFilter(key)}><strong>{filterMeta[key].label}</strong><span>{count} 项</span></button>;
        })}
      </div>

      <div className="innovation-question"><span>当前审查问题</span><strong>{filterMeta[filter].question}</strong></div>

      <div className="innovation-nodes" role="group" aria-label={`${filterMeta[filter].label}创新点`}>
        {visible.map((item) => (
          <button key={item.id} type="button" className={selected.id === item.id ? 'selected' : ''} aria-pressed={selected.id === item.id} onClick={() => setSelectedId(item.id)}>
            <span>{item.subsystem}</span>
            <strong>{item.title}</strong>
            <small>{item.type}</small>
          </button>
        ))}
      </div>

      <section className="innovation-detail" aria-live="polite">
        <header>
          <div><span>{selected.type}</span><h5>{selected.subsystem}：{selected.title}</h5></div>
          <strong>{selected.locator}</strong>
        </header>
        <div className="innovation-chain">
          <article className="problem"><span>1 · 旧问题</span><p>{selected.problem}</p></article>
          <i aria-hidden="true">→</i>
          <article className="mechanism"><span>2 · 新机制</span><p>{selected.mechanism}</p></article>
          <i aria-hidden="true">→</i>
          <article className="effect"><span>3 · 带来什么</span><p>{selected.effect}</p></article>
        </div>
        <div className="innovation-evidence">
          <div><span>论文证据</span><p>{selected.evidence}</p></div>
          <div><span>不能外推</span><p>{selected.boundary}</p></div>
        </div>
        <div className="innovation-keywords">{selected.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</div>
      </section>

      <p className="innovation-hint">灰色提示：筛选器用于区分贡献性质；同一节点可能同时属于多类，但方法改进、系统集成与产品演示不应混写成同一种证据。</p>
    </div>
  );
};
