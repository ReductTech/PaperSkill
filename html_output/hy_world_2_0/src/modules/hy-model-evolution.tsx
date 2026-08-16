import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

type Status = 'complete' | 'partial' | 'qualitative' | 'unreported' | 'closed';
type MatrixScope = 'lineage' | 'external';
type CapabilityId = 'generation' | 'reconstruction' | 'panorama' | 'expansion' | 'assets' | 'interaction' | 'open';
type ModelId = 'hy1' | 'hy15' | 'wm1' | 'genex' | 'video2world' | 'marble' | 'hy2';

type CapabilityState = {
  status: Status;
  note: string;
  boundary?: string;
};

type ModelProfile = {
  id: ModelId;
  name: string;
  shortName: string;
  kind: string;
  published: string;
  publishedIso?: string;
  relation: string;
  comparison: string;
  boundary: string;
  source: { label: string; url: string };
  capabilities: Record<CapabilityId, CapabilityState>;
};

type CapabilityProfile = {
  id: CapabilityId;
  name: string;
  shortName: string;
  purpose: string;
  hyAdvance: string;
  readerImpact: string;
};

const PAPER_URL = 'https://arxiv.org/abs/2604.14268';

const statusMeta: Record<Status, { label: string; hint: string }> = {
  complete: { label: '完整支持', hint: '有明确系统、论文或官方说明支撑' },
  partial: { label: '局部支持', hint: '覆盖部分输入、输出或采用不同范式' },
  qualitative: { label: '仅定性', hint: '只有案例或视觉比较，不能当作统一协议分数' },
  unreported: { label: '未报告', hint: '当前引用资料没有给出；该单元格不可展开，也不能写成“不支持”' },
  closed: { label: '闭源参照', hint: '论文将其作为闭源商业系统讨论' },
};

const capabilities: CapabilityProfile[] = [
  {
    id: 'generation',
    name: '文本 / 单图世界生成',
    shortName: '稀疏输入生成',
    purpose: '把文本或一张参考图扩展成可探索世界，适合创作、预演与快速搭建场景原型。',
    hyAdvance: 'HY-World 2.0 把文本与单图统一接入 HY-Pano 2.0、WorldNav、WorldStereo 2.0 和 WorldMirror 2.0，最终得到持久三维资产，而不是只生成一段观看后即结束的视频。',
    readerImpact: '结果不只是一段镜头运动视频，还能保存为 3DGS/Mesh 并从新视角继续浏览；代价是完整生成仍需分钟级。',
  },
  {
    id: 'reconstruction',
    name: '多视图 / 视频世界重建',
    shortName: '密集输入重建',
    purpose: '把真实拍摄的多张照片或视频恢复为数字孪生，用于采集归档、仿真和内容再编辑。',
    hyAdvance: 'HY-World 2.0 将 WorldMirror 2.0 纳入统一系统，可在一次前馈中联合预测相机、点图、深度、法线与 3DGS，并支持 50K-500K 像素的灵活分辨率。',
    readerImpact: '同一批真实观察可以直接得到相机、几何和可渲染资产，减少为不同三维任务分别运行模型的割裂感。',
  },
  {
    id: 'panorama',
    name: '360° 全景初始化',
    shortName: '全景初始化',
    purpose: '先建立环绕视野，为后续相机规划和世界扩展提供全局上下文，并减少只看单一视角造成的盲区。',
    hyAdvance: 'HY-Pano 2.0 用隐式映射降低对相机元数据的依赖，并针对 ERP 环形边界进行接缝修复；在论文表 4 的 I2P 协议中，CLIP-I 从 GenEx 的 0.831 提升到 0.844。',
    readerImpact: '初始场景不再只是一张正面图，而是一个左右边界能接上的 360° 起点，后续轨迹可以围绕它继续扩展。',
  },
  {
    id: 'expansion',
    name: '场景感知规划与世界扩展',
    shortName: '规划与扩展',
    purpose: '决定相机应去哪里补看盲区，并生成跨轨迹一致的新视角，使世界不只停留在初始观察点附近。',
    hyAdvance: 'WorldNav 使用点云、语义掩码、NavMesh 与碰撞约束规划五类互补轨迹；WorldStereo 2.0 再通过关键帧潜空间、全局几何记忆和局部选择记忆扩展世界。',
    readerImpact: '探索路线会主动绕到物体背面、走廊远端和俯视区域，多条路线生成的空间与纹理也更不容易互相漂移。',
  },
  {
    id: 'assets',
    name: '3DGS / Mesh / 点云资产输出',
    shortName: '持久三维资产',
    purpose: '把生成结果保存为可渲染、可编辑、可导入引擎的资产，使一次生成可以被长期复用。',
    hyAdvance: 'HY-World 2.0 同时面向 3DGS、Mesh、点云及相关几何输出，并用深度线性对齐、非天空增密和 MaskGaussian 改善完整度、漂浮物与资产规模的平衡。',
    readerImpact: '用户可以重新加载、编辑或导入世界，而不必每次从像素视频重新推断空间；紧凑表示仍会带来轻微画质取舍。',
  },
  {
    id: 'interaction',
    name: '可漫游与角色物理交互',
    shortName: '漫游与物理',
    purpose: '让用户或智能体进入场景，进行第一/第三人称移动、碰撞与持续探索，而不只是观看离线渲染。',
    hyAdvance: 'WorldLens 把生成阶段与运行时渲染解耦，加入引擎无关架构、IBL 光照、碰撞检测和角色支持；生成仍是分钟级，但资产渲染与交互可实时进行。',
    readerImpact: '等待离线构建完成后，用户可以像进入关卡一样移动与碰撞；这不代表模型本身会随动作实时重新生成整个世界。',
  },
  {
    id: 'open',
    name: '代码、权重与复现入口',
    shortName: '开放与复现',
    purpose: '让研究者检查实现、下载权重、复现实验并在合法授权范围内继续开发。',
    hyAdvance: 'HY-World 2.0 已分批开放 WorldMirror 2.0、HY-Pano 2.0、WorldStereo 2.0 与世界生成推理代码；可复现不等于低门槛，仍需检查显存、CUDA、权重体积和社区许可证。',
    readerImpact: '研究者能从论文结论进入真实代码、权重与运行入口，但是否能本地跑通取决于硬件、版本和许可证条件。',
  },
];

const models: ModelProfile[] = [
  {
    id: 'hy1',
    name: 'HY-World 1.0',
    shortName: 'HY 1.0',
    kind: '系统级前代',
    published: '发表 2025-07-29',
    publishedIso: '2025-07-29',
    relation: '离线显式 3D 世界生成路线，是 2.0 最直接的系统前代。',
    comparison: '2.0 保留“生成可探索三维世界”的目标，同时加入视频扩散先验扩大探索空间、提高视觉质量，并把多视图/视频重建纳入同一框架。',
    boundary: '论文把 1.0 作为前代与 I2P 基线；不同子系统的改进不能被压缩成一个总分。',
    source: { label: 'HY-World 1.0 官方仓库', url: 'https://github.com/Tencent-Hunyuan/HunyuanWorld-1.0' },
    capabilities: {
      generation: { status: 'complete', note: '官方定位是从文字或图像生成沉浸式、可探索的 3D 世界。' },
      reconstruction: { status: 'unreported', note: 'HY-World 2.0 论文没有把 1.0 定义为多视图/视频统一重建系统。' },
      panorama: { status: 'complete', note: '论文表 4 将 HY-World 1.0 纳入图像到全景 I2P 比较，说明其生成链路包含该能力。' },
      expansion: { status: 'partial', note: '具备离线 3D 世界生成，但 2.0 才明确引入场景感知 WorldNav 和视频扩散驱动的世界扩展升级。' },
      assets: { status: 'complete', note: '目标就是生成可探索、具有 3D 一致性的显式世界，而非仅输出像素视频。' },
      interaction: { status: 'complete', note: '1.0 的公开标题与项目定位包含 explorable 和 interactive 3D worlds。' },
      open: { status: 'complete', note: '存在官方代码仓库与公开项目入口；复现要求应以该仓库当前说明为准。' },
    },
  },
  {
    id: 'hy15',
    name: 'HY-World 1.5',
    shortName: 'HY 1.5',
    kind: '在线视频前代',
    published: '发表 2025-12-16',
    publishedIso: '2025-12-16',
    relation: '以 WorldPlay + WorldCompass 为代表的在线、动作驱动视频世界路线。',
    comparison: '2.0 不是简单替代 1.5：1.5 强调动作驱动的在线视频生成，2.0 强调一次构建后可持久保存、编辑和实时渲染的显式三维资产。',
    boundary: '两代系统的输出范式和时延目标不同，不能用“离线生成更慢”或“在线视频更快”直接判定整体优劣。',
    source: { label: 'HY-WorldPlay 官方仓库', url: 'https://github.com/Tencent-Hunyuan/HY-WorldPlay' },
    capabilities: {
      generation: { status: 'partial', note: '可以根据用户动作持续生成像素级世界视频，但结果不是持久三维资产。' },
      reconstruction: { status: 'unreported', note: '当前比较材料未将其描述为多视图或视频到显式 3D 的重建器。' },
      panorama: { status: 'unreported', note: '论文代际概述没有报告独立的 360° 全景初始化模块。' },
      expansion: { status: 'partial', note: '世界随用户动作在线展开，重点是交互式视频 rollout，而非离线场景感知相机轨迹与 3D 组合。' },
      assets: { status: 'partial', note: '输出以像素视频为主，能呈现世界变化，但不能等同于可编辑、永久保存的 3DGS 或 Mesh。' },
      interaction: { status: 'complete', note: '核心优势正是用户动作驱动的实时交互式世界建模。' },
      open: { status: 'partial', note: 'WorldPlay 有官方仓库，但 1.5 由多个组件共同构成，开放范围需分别核对。' },
    },
  },
  {
    id: 'wm1',
    name: 'WorldMirror 1.0',
    shortName: 'WM 1.0',
    kind: '重建分支前代',
    published: '发表 2025-10-12',
    publishedIso: '2025-10-12',
    relation: '统一前馈三维重建器，是 2.0 重建分支的直接前代，而不是完整世界生成系统。',
    comparison: '2.0 用归一化 RoPE、深度-法线耦合、深度掩码头、token-budget 动态采样与并行策略，重点修复训练外分辨率和大视图数问题。',
    boundary: '7-Scenes 高分辨率 Acc. 0.079→0.037 是越低越好的点图误差；H20 四卡 5.60 秒仅是 128 视图重建步骤。',
    source: { label: 'WorldMirror 论文', url: 'https://arxiv.org/abs/2510.10726' },
    capabilities: {
      generation: { status: 'unreported', note: 'WorldMirror 1.0 是重建子系统，不负责从文本或单图完成整套世界生成。' },
      reconstruction: { status: 'complete', note: '支持多图输入和任意先验提示的统一前馈三维重建。' },
      panorama: { status: 'unreported', note: '其职责是重建，不承担 HY-Pano 的全景生成与接缝修复。' },
      expansion: { status: 'unreported', note: '不负责 WorldNav 轨迹规划或 WorldStereo 世界扩展。' },
      assets: { status: 'complete', note: '可预测点云/点图、深度、法线、相机参数和 3D Gaussians。' },
      interaction: { status: 'unreported', note: '重建论文没有把运行时角色漫游和碰撞作为模型能力。' },
      open: { status: 'complete', note: '官方仓库和模型入口已公开，可作为 2.0 重建分支的背景实现。' },
    },
  },
  {
    id: 'genex',
    name: 'GenEx',
    shortName: 'GenEx',
    kind: '全景探索参照',
    published: '发表 2024-12-12',
    publishedIso: '2024-12-12',
    relation: '从单张 RGB 图像生成可探索想象世界，并用全景视频支持智能体探索。',
    comparison: 'HY-Pano 2.0 在论文表 4 的 I2P 协议中改善全景相似度与感知质量；HY-World 2.0 还进一步输出持久三维资产，但这部分没有与 GenEx 做统一端到端评测。',
    boundary: '可直接比较的数字只属于 I2P 子任务：CLIP-I 0.831→0.844，Q-Align Quality Persp 2.917→4.026；不能外推成全系统胜负。',
    source: { label: 'GenEx 论文', url: 'https://arxiv.org/abs/2412.09624' },
    capabilities: {
      generation: { status: 'partial', note: '支持从单张 RGB 图像生成可探索世界；当前引用没有证明其支持 HY-World 2.0 同等范围的文本输入。' },
      reconstruction: { status: 'unreported', note: 'GenEx 的目标是生成式想象与探索，不是通用多视图/视频三维重建。' },
      panorama: { status: 'complete', note: '通过连续 360° 全景视频流形成可探索环境，也是论文表 4 的直接比较对象。' },
      expansion: { status: 'complete', note: '利用生成式想象支持目标无关探索和目标驱动导航，强调长轨迹循环一致性。' },
      assets: { status: 'partial', note: '论文展示主动 3D mapping 能力，但不能直接等同于可导入引擎的持久 3DGS/Mesh 资产。' },
      interaction: { status: 'partial', note: '智能体可在想象世界中探索与规划；物理碰撞和显式三维资产交互不是同一能力。' },
      open: { status: 'unreported', note: 'HY-World 2.0 的比较表不负责报告 GenEx 的当前代码与权重开放状态。' },
    },
  },
  {
    id: 'video2world',
    name: 'video2world',
    shortName: 'video2world',
    kind: '视频转三维参照',
    published: '论文未单列日期',
    relation: '把生成视频经特征匹配 ICP 对齐为点云，再构建三维表示。',
    comparison: '在论文报告的生成场景对齐流程中，HY-World 2.0 用相机姿态先验的轻量线性对齐把约 5 小时缩短到 2 分钟以内，并得到更好的最终 3DGS 几何与纹理。',
    boundary: '这是特定生成场景管线的比较，不代表所有真实视频、硬件与输入规模都能获得同样加速比。',
    source: { label: 'HY-World 2.0 对比章节', url: PAPER_URL },
    capabilities: {
      generation: { status: 'unreported', note: '当前论文比较聚焦“视频如何转成三维”，没有报告其直接从文本或单图生成世界的能力。' },
      reconstruction: { status: 'partial', note: '可把视频帧通过特征匹配和 ICP 对齐为点云，但论文讨论的是生成场景流程，不是通用前馈重建基准。' },
      panorama: { status: 'unreported', note: '当前比较没有报告独立的图像到 360° 全景初始化。' },
      expansion: { status: 'unreported', note: '论文没有把它描述为带场景理解、碰撞约束和多类轨迹的规划器。' },
      assets: { status: 'complete', note: '流程目标包含点云与 3DGS，但需要复杂的特征匹配 ICP 与后续优化。' },
      interaction: { status: 'unreported', note: '论文效率比较没有覆盖角色漫游、碰撞或运行时渲染能力。' },
      open: { status: 'unreported', note: 'HY-World 2.0 的比较文字没有给出其代码与权重开放结论。' },
    },
  },
  {
    id: 'marble',
    name: 'Marble 1.0',
    shortName: 'Marble 1.0',
    kind: '闭源商业参照',
    published: '比较版本 2026-03-30',
    publishedIso: '2026-03-30',
    relation: 'World Labs 的闭源世界生成产品，论文用相同全景或单图输入做视觉案例比较。',
    comparison: '论文声称 HY-World 2.0 更忠于输入、纹理更清晰、跨视角几何一致性与 3DGS 完整性更好，但没有统一协议下的定量表格。',
    boundary: '所有能力判断只按论文展示的 Marble 1.0 案例和版本日期陈述，不生成分数、不画红叉、不推广到后续产品版本。',
    source: { label: 'Marble 官方入口', url: 'https://marble.worldlabs.ai/' },
    capabilities: {
      generation: { status: 'qualitative', note: '论文展示相同单图输入下的生成结果，但只提供视觉案例。' },
      reconstruction: { status: 'qualitative', note: '论文讨论输入忠实度与三维完整性，未提供兼容的重建数据集和指标表。' },
      panorama: { status: 'qualitative', note: '论文使用相同全景输入进行案例比较，无法据此判断完整的全景生成能力边界。' },
      expansion: { status: 'unreported', note: '论文没有公开其轨迹规划、记忆或世界扩展内部机制。' },
      assets: { status: 'qualitative', note: '可以生成可探索三维世界，但本教程只引用论文中的视觉比较，不构造资产质量分数。' },
      interaction: { status: 'qualitative', note: '产品定位包含可探索世界；论文对角色物理和碰撞没有统一实验。' },
      open: { status: 'closed', note: '论文把 Marble 1.0 作为闭源模型参照，内部实现和权重不可按开源基线复现。' },
    },
  },
  {
    id: 'hy2',
    name: 'HY-World 2.0',
    shortName: 'HY 2.0',
    kind: '目标模型',
    published: '发表 2026-04-15',
    publishedIso: '2026-04-15',
    relation: '统一世界生成、世界重建与运行时模拟的离线显式 3D 世界模型。',
    comparison: '2.0 的核心不是在每条轴上都宣称绝对领先，而是把稀疏输入生成、密集输入重建、持久三维资产和运行时交互接入同一系统。',
    boundary: '完整世界生成仍约 712 秒；5.60 秒只对应 H20 四卡、128 视图的 WorldMirror 2.0 重建步骤。',
    source: { label: 'HY-World 2.0 论文', url: PAPER_URL },
    capabilities: {
      generation: { status: 'complete', note: '文本或单图进入四阶段生成链，输出高保真、可漫游的 3DGS 世界。' },
      reconstruction: { status: 'complete', note: '多视图或视频直接进入 WorldMirror 2.0，联合预测多种几何与 3DGS 表示。' },
      panorama: { status: 'complete', note: 'HY-Pano 2.0 支持文本/图像到 360° ERP 全景，并处理环形接缝。' },
      expansion: { status: 'complete', note: 'WorldNav 负责场景感知轨迹，WorldStereo 2.0 负责带跨轨迹记忆的关键帧扩展。' },
      assets: { status: 'complete', note: '官方系统与仓库展示 3DGS、Mesh、点云、深度、法线和相机等输出。' },
      interaction: { status: 'complete', note: 'WorldLens 支持实时渲染、第一/第三人称探索、角色和碰撞检测。' },
      open: { status: 'complete', note: '主要模型权重与推理代码已分批公开，但使用仍受硬件与社区许可证约束。' },
    },
  },
];

const modelOrder: ModelId[] = ['hy2', 'hy15', 'hy1', 'wm1', 'genex', 'video2world', 'marble'];
const orderedModels = modelOrder.map((modelId) => models.find((model) => model.id === modelId) as ModelProfile);
const lineageIds = new Set<ModelId>(['hy2', 'hy15', 'hy1', 'wm1']);
const externalIds = new Set<ModelId>(['hy2', 'genex', 'video2world', 'marble']);

export const HyModelEvolution: React.FC<WidgetProps> = () => {
  const [selectedModelId, setSelectedModelId] = useState<ModelId>('hy2');
  const [selectedCapabilityId, setSelectedCapabilityId] = useState<CapabilityId>('generation');
  const [matrixScope, setMatrixScope] = useState<MatrixScope>('lineage');

  const selectedModel = useMemo(
    () => models.find((model) => model.id === selectedModelId) ?? models[models.length - 1],
    [selectedModelId],
  );
  const selectedCapability = useMemo(
    () => capabilities.find((capability) => capability.id === selectedCapabilityId) ?? capabilities[0],
    [selectedCapabilityId],
  );
  const selectedState = selectedModel.capabilities[selectedCapability.id];
  const selectedStatus = statusMeta[selectedState.status];
  const visibleModels = matrixScope === 'lineage'
    ? orderedModels.filter((model) => lineageIds.has(model.id))
    : orderedModels.filter((model) => externalIds.has(model.id));
  const axisStates = visibleModels.map((model) => ({ model, state: model.capabilities[selectedCapability.id] }));
  const axisCounts = axisStates.reduce<Record<Status, number>>(
    (counts, item) => ({ ...counts, [item.state.status]: counts[item.state.status] + 1 }),
    { complete: 0, partial: 0, qualitative: 0, unreported: 0, closed: 0 },
  );

  const changeScope = (nextScope: MatrixScope) => {
    setMatrixScope(nextScope);
    if (nextScope === 'lineage' && !lineageIds.has(selectedModelId)) setSelectedModelId('hy2');
    if (nextScope === 'external' && !externalIds.has(selectedModelId)) setSelectedModelId('hy2');
  };

  return (
    <div className="model-evolution">
      <div className="evolution-toolbar">
        <div>
          <strong>模型 × 功能能力矩阵</strong>
          <span>点击有证据的单元格展开说明；灰色“未报告”保持不可点击。</span>
        </div>
        <div className="evolution-legend" aria-label="能力状态图例">
          {(Object.keys(statusMeta) as Status[]).map((status) => (
            <span key={status} className={`evolution-status ${status}`}>
              {statusMeta[status].label}{status === 'unreported' ? '（不可展开）' : ''}
            </span>
          ))}
        </div>
      </div>

      <div className="evolution-scope-switch" role="group" aria-label="选择模型比较范围">
        <button type="button" className={matrixScope === 'lineage' ? 'selected' : ''} aria-pressed={matrixScope === 'lineage'} onClick={() => changeScope('lineage')}><strong>只看 HY 谱系</strong><small>2.0 → 1.5 → 1.0 → WorldMirror 1.0</small></button>
        <button type="button" className={matrixScope === 'external' ? 'selected' : ''} aria-pressed={matrixScope === 'external'} onClick={() => changeScope('external')}><strong>对比其它谱系</strong><small>HY 2.0 + GenEx + video2world + Marble 1.0</small></button>
      </div>

      <div className={`evolution-matrix-scroll ${matrixScope}`} tabIndex={matrixScope === 'lineage' ? 0 : -1} aria-label={matrixScope === 'lineage' ? 'HY 谱系能力矩阵，窄屏可横向滚动' : '其它谱系能力矩阵，一屏完整显示'}>
        <div className={`evolution-matrix ${matrixScope}`} role="grid" aria-label={matrixScope === 'lineage' ? 'HY-World 2.0 与历代模型能力比较' : 'HY-World 2.0 与外部模型能力比较'}>
          <div className="evolution-corner" role="columnheader">功能 \ 模型</div>
          {visibleModels.map((model) => (
            <div key={model.id} className={`evolution-model-head ${model.id === 'hy2' ? 'target' : ''} ${model.id === selectedModel.id ? 'selected-column' : ''}`} role="columnheader">
              <strong>{model.shortName}</strong>
              <span>{model.kind}</span>
              <time dateTime={model.publishedIso}>{model.published}</time>
            </div>
          ))}

          {capabilities.map((capability) => (
            <React.Fragment key={capability.id}>
              <div className={`evolution-capability-head ${capability.id === selectedCapability.id ? 'selected-row' : ''}`} role="rowheader">
                <strong>{capability.shortName}</strong>
                <span>{capability.name}</span>
              </div>
              {visibleModels.map((model) => {
                const state = model.capabilities[capability.id];
                const isSelected = model.id === selectedModel.id && capability.id === selectedCapability.id;
                const isDisabled = state.status === 'unreported';
                return (
                  <button
                    key={`${model.id}-${capability.id}`}
                    type="button"
                    className={`evolution-cell ${state.status} ${capability.id === selectedCapability.id ? 'same-axis' : ''} ${model.id === selectedModel.id ? 'same-model' : ''} ${isSelected ? 'selected' : ''}`}
                    disabled={isDisabled}
                    onClick={() => {
                      setSelectedModelId(model.id);
                      setSelectedCapabilityId(capability.id);
                    }}
                    aria-pressed={isSelected}
                    aria-label={`${model.name}，${capability.name}：${statusMeta[state.status].label}${isDisabled ? '，不可展开' : ''}`}
                    title={isDisabled ? '论文未报告该能力，本单元格不可展开' : `展开 ${model.name} 的${capability.name}说明`}
                    role="gridcell"
                  >
                    <span aria-hidden="true" />
                    {statusMeta[state.status].label}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      <p className="evolution-scroll-hint">灰色提示：{matrixScope === 'lineage' ? 'HY 谱系在窄屏时可于矩阵内部左右滑动；' : '其它谱系已压缩为一屏，无需横向滑动；'}范围切换只改变可见列，不改变能力判断。“未报告”不等于“不支持”，因此保持灰色且不可点击。</p>

      <section className="evolution-axis-focus" aria-live="polite" aria-label={`${selectedCapability.name}同轴对照`}>
        <header>
          <div>
            <span>当前比较轴</span>
            <strong>{selectedCapability.name}</strong>
          </div>
          <small>
            完整 {axisCounts.complete} · 局部 {axisCounts.partial} · 定性 {axisCounts.qualitative} · 未报告 {axisCounts.unreported} · 闭源 {axisCounts.closed}
          </small>
        </header>
        <p>{selectedCapability.purpose}</p>
        <div className="evolution-axis-models" role="group" aria-label={`切换${selectedCapability.name}的比较模型`}>
          {axisStates.map(({ model, state }) => {
            const isSelected = model.id === selectedModel.id;
            const isDisabled = state.status === 'unreported';
            return (
              <button
                key={model.id}
                type="button"
                className={`${state.status} ${isSelected ? 'selected' : ''}`}
                disabled={isDisabled}
                aria-pressed={isSelected}
                aria-label={`${model.name}，${selectedCapability.name}：${statusMeta[state.status].label}${isDisabled ? '，不可展开' : ''}`}
                onClick={() => setSelectedModelId(model.id)}
              >
                <strong>{model.shortName}</strong>
                <span>{statusMeta[state.status].label}</span>
              </button>
            );
          })}
        </div>
        <small>同轴对照带只复述当前引用范围内的证据状态，不把不同模型目标压成统一排名。</small>
      </section>

      <section className={`evolution-detail ${selectedState.status}`} aria-live="polite">
        <header className="evolution-detail-head">
          <div>
            <span>{selectedModel.kind} · {selectedModel.published}</span>
            <h5>{selectedModel.name} × {selectedCapability.name}</h5>
          </div>
          <span className={`evolution-status ${selectedState.status}`}>{selectedStatus.label}</span>
        </header>

        <div className="evolution-summary">
          <strong>{selectedModel.relation}</strong>
          <span>{selectedStatus.hint}</span>
        </div>

        <div className="evolution-effect-compare">
          <div className="current">
            <span>当前模型在该能力</span>
            <strong>{selectedModel.name}</strong>
            <p>{selectedState.note}</p>
          </div>
          <i aria-hidden="true">→</i>
          <div className="target">
            <span>HY-World 2.0 对应效果</span>
            <strong>{selectedModel.id === 'hy2' ? '本代完整形态' : '从参照走向 2.0'}</strong>
            <p>{selectedCapability.hyAdvance}</p>
          </div>
        </div>

        <div className="evolution-user-impact">
          <span>读者真正能感知的变化</span>
          <p>{selectedCapability.readerImpact}</p>
        </div>

        <div className="evolution-detail-grid">
          <div>
            <span>这个功能有什么用</span>
            <p>{selectedCapability.purpose}</p>
          </div>
          <div>
            <span>代际 / 外部比较</span>
            <p>{selectedModel.comparison}</p>
          </div>
          <div>
            <span>当前证据强度</span>
            <p>{selectedStatus.label}：{selectedStatus.hint}</p>
          </div>
          <div>
            <span>证据与适用边界</span>
            <p>{selectedState.boundary ?? selectedModel.boundary}</p>
          </div>
        </div>

        <div className="evolution-sources">
          <a href={selectedModel.source.url} target="_blank" rel="noreferrer">{selectedModel.source.label} ↗</a>
          {selectedModel.source.url !== PAPER_URL && (
            <a href={PAPER_URL} target="_blank" rel="noreferrer">HY-World 2.0 论文比较依据 ↗</a>
          )}
        </div>

      </section>
    </div>
  );
};
