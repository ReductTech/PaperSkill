import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'Image Generators are Generalist Vision Learners',
    titleZh: '图像生成器是通用型视觉学习器',
    venue: 'arXiv:2604.20329v3 · 2026',
    authors: 'Valentin Gabeur 等',
    affiliation: 'Google',
    domain: '计算机视觉 · 图像生成 · 2D 分割 · 单目 3D 几何 · 指令微调',
    coreProblem: '强大的图像生成器是否已经学到可迁移的视觉表征，只是还不会按标准视觉任务的格式交卷？',
    coreInsight: '论文表明：图像生成预训练能够形成强大且可迁移的视觉表征；轻量指令微调再把这些表征释放为可解码、可评测的 2D 与 3D 能力。',
    keywords: ['Vision Banana', '生成式视觉预训练', '统一 RGB 接口', '零样本迁移', '通用视觉学习器'],
  },
  hero: {
    oldMethod: {
      desc: '传统视觉系统常为分割、深度和法线分别准备专用模型、权重与输出头，任务之间彼此隔离。',
      componentId: 'specialist-silo',
    },
    newMethod: {
      desc: 'Vision Banana 固定同一生成模型，只切换自然语言提示、RGB 输出约定与外部解码规则。',
      componentId: 'unified-generator',
    },
  },
  chapters: [
    {
      kind: "chapter",
      id: 'chap-1',
      title: 'LLM 范式启发下的通用视觉学习器',
      badge: 'both',
      badgeLabel: '结论 · LLM 启发',
      bridge: '本文的核心结论是：图像生成训练扮演着与 LLM 预训练相似的角色，能够形成强大且通用的表征；轻量指令微调主要教模型遵循任务并按指定格式交卷。后续六章依次解释接口、任务与证据。',
      analogy: {
        title: '一位成熟的制图师，只缺少统一的交付规范',
        text: '制图师已经在长期绘图中学会物体、空间与远近关系，却还不会按分割、深度或法线的标准格式交卷。论文借鉴 LLM 的路线：保留生成预训练获得的基础能力，再用少量指令示例教会任务遵循与输出格式。',
        componentId: 'specialist-silo',
      },
      modules: [
        {
          kind: "module",
          id: '1.1',
          title: '传统范式为不同任务准备不同模型',
          desc: '切换语义、深度与法线任务，观察传统专用系统为何形成模型孤岛。专用模型并非无效；这一对照只说明旧范式没有把“一套生成表征能否跨任务复用”作为目标。',
          componentId: 'specialist-silo',
        },
        {
          kind: "module",
          id: '1.2',
          title: 'LLM 的训练范式迁移到视觉生成器',
          desc: 'LLM 先经生成式预训练获得通用语言能力，再经指令微调学习任务遵循和文本格式；Vision Banana 沿用同一思路，以图像生成预训练获得视觉表征，再用轻量指令微调学习任务提示与 RGB 输出约定。这里类比的是训练角色和统一接口，不是声称二者内部架构相同。',
          componentId: 'unified-generator',
        },
      ],
      insight: '论文结论：对 Nano Banana Pro 进行轻量指令微调后，Vision Banana 能把生成预训练形成的表征释放为统一、可测且覆盖多种 2D/3D 任务的视觉能力。实验支持这一归因，但不把它扩写成所有生成器的普遍定理。',
      takeaways: [
        {
          icon: '💡',
          title: '结论先行',
          desc: '生成预训练可以像 LLM 预训练一样，成为通用表征的来源。',
        },
        {
          icon: '🔁',
          title: '能力与接口分工',
          desc: '预训练形成基础能力，轻量指令微调主要学习任务遵循与输出格式。',
        },
        {
          icon: '🛡️',
          title: '结论先保留边界',
          desc: '实验研究的是 Nano Banana Pro 与 Vision Banana，不是所有生成器的普遍定理。',
        },
      ],
    },
    {
      kind: "chapter",
      id: 'chap-2',
      title: '可解码 RGB 构成统一视觉接口',
      badge: 'both',
      badgeLabel: '方法 · 统一接口',
      bridge: '核心结论要落地，关键是把原本不同形态的视觉答案都改写成图像生成器熟悉的 RGB 图像，再用任务解码器恢复类别、实例、米制距离或三维方向。',
      analogy: {
        title: '同一个地图箱，转动图层拨盘',
        text: '制图师不再更换整套工具，而是转动图层拨盘：底图与画笔不变，任务卡告诉他画哪一层，图例告诉读者怎样把颜色还原成答案。',
        componentId: 'shared-model-architecture',
      },
      modules: [
        {
          kind: "module",
          id: '2.1',
          title: '同一生成模型连接不同任务解码器',
          desc: '沿唯一主链查看“输入图像 + 任务提示 → 同一 Vision Banana → RGB 输出 → 任务解码”。语义、实例、深度和法线共享模型权重，但仍保留各自的提示约定与外部解码器。论文没有公开 Nano Banana Pro 的完整内部架构，因此教学图只展示已披露的系统接口。',
          componentId: 'shared-model-architecture',
        },
        {
          kind: "module",
          id: '2.2',
          title: '以语义分割为例展示可解码 RGB 结果',
          desc: '使用论文图 2 的真实语义分割结果，选择猫、门锁、出口标志或背景区域的生成像素，再按提示中声明的目标色还原类别。可解码只保证输出能够进入标准指标；模型是否把颜色画对，仍需在真实基准上验证。',
          componentId: 'decode-reversibility',
        },
      ],
      insight: 'RGB 不是把不同任务偷换成同一种含义，而是提供共同的“答题纸”：自然语言决定要回答什么，颜色约定决定怎样书写，解码器决定怎样机器读取。',
      takeaways: [
        {
          icon: '🗺️',
          title: '共享一张 RGB 答题纸',
          desc: '所评估的视觉任务都被重写为条件图像生成，模型始终输出 RGB 图像。',
        },
        {
          icon: '🏷️',
          title: '提示与解码仍按任务变化',
          desc: '共享模型不等于共享一套提示或一个万能解码器。',
        },
        {
          icon: '🔁',
          title: '可逆规则连接标准评测',
          desc: '输出必须能稳定还原成类别、实例、距离或方向，才能计算任务指标。',
        },
      ],
    },
    {
      kind: "chapter",
      id: 'chap-3',
      title: '统一 RGB 接口覆盖二维视觉任务',
      badge: 'inf',
      badgeLabel: '2D · 三类分割',
      bridge: '论文把二维理解明确划分为三类任务：语义分割按开放词汇标注类别，实例分割区分数量未知的对象，指代表达分割依据自由文本定位目标。每类任务都使用论文原图或高分辨率局部图核对。',
      analogy: {
        title: '提示卡同时写明“找谁”和“涂什么色”',
        text: '制图师读取目标描述和颜色图例，再在同一张底图上盖下对应图层。短类别名、完整描述和实例目标改变，工具不变，地图上的可读颜色随任务改变。',
        componentId: 'prompt-color',
      },
      modules: [
        {
          kind: "module",
          id: '3.1',
          title: '三类二维任务与对应视觉证据',
          desc: '切换语义分割、实例分割与指代表达分割，查看清晰的论文图局部、提示约定、解码方式和系统边界。每类任务的完整评测与模型对比默认收在对应的折叠表中。',
          componentId: 'prompt-color',
        },
      ],
      insight: '二维贡献不只是“会分割”：同一生成器通过不同提示与颜色约定覆盖语义类别、对象实例和自由文本指代。SA-Co/Gold 的负查询过滤依赖 Gemini，因此该项结果必须按组合系统归因。',
      takeaways: [
        {
          icon: '🎨',
          title: '语义映射可由 prompt 动态给出',
          desc: '类别可用自然语言或 JSON 指定，生成后按最近目标色恢复像素类别。',
        },
        {
          icon: '🔢',
          title: '实例通过动态配色区分',
          desc: '提示只给目标和背景色，模型为数量未知的实例选择不同颜色，再聚类成离散掩码。',
        },
        {
          icon: '🧠',
          title: '组合系统不能混淆归因',
          desc: 'SA-Co/Gold 的实例分割结果包含 Gemini 负查询过滤，不能全部归因于 Vision Banana 单体。',
        },
      ],
    },
    {
      kind: "chapter",
      id: 'chap-4',
      title: '统一 RGB 接口延伸至三维几何',
      badge: 'inf',
      badgeLabel: '3D · 深度与法线',
      bridge: '三维部分只保留两个代表任务：米制深度回答“离相机多远”，表面法线回答“局部表面朝向哪里”。二者都输出 RGB 图像，却采用不同的可逆编码。',
      analogy: {
        title: '一把颜色尺量距离，一枚测向针读方向',
        text: '制图师把无穷远的距离压进有限颜色尺，又让测向针的三个方向分量分别进入 RGB 通道。两种几何量都成为图像，却使用完全不同的可逆读法。',
        componentId: 'depth-color-bijection',
      },
      modules: [
        {
          kind: "module",
          id: '4.1',
          title: '米制深度通过颜色路径可逆编码',
          desc: '先用论文图 7 核对真实距离，再输入米制深度，观察无上界数值如何压入 [0,1)、沿论文图 5 同朝向的 RGB 路径编码并反解。核心公式与参数默认保留，扩展色图和实现条件放入技术说明。',
          componentId: 'depth-color-bijection',
        },
        {
          kind: "module",
          id: '4.2',
          title: '表面法线直接映射到 RGB 三通道',
          desc: '拖动相机空间单位法线，或从合法法线调色板直接选色，观察 (x,y,z)、方向箭头、颜色与 R/G/B 数值同步更新。论文图 8 的猫咪局部使用高分辨率三列对照，完整通道公式放入技术折叠区。',
          componentId: 'surface-normal-encoding',
        },
      ],
      insight: '三维证据同时包含直观与定量检查：图 7 的手机照片预测 13.71 米，地图测量为 12.87 米；六个深度基准和四个法线基准提供系统评测。图 8 中法线细节更清晰，但 Virtual KITTI 2 上 Lotus-2 的角误差仍略低。',
      formula: {
        lead: '有限长度的颜色路径要容纳无上界的米制距离，因此先压缩远处，再沿不自交的 RGB 路径前进；反向沿同一路径即可恢复距离。',
        unicode: '<span class="paper-formula-line">f(d, λ, c) = 1 − (1 − d/(λc))<sup>λ+1</sup></span><span class="paper-formula-line">d = λc · [1 − (1 − f)<sup>1/(λ+1)</sup>]</span><span class="paper-formula-params">参数取值：λ = −3，c = 10/3，且 λ &lt; −1</span>',
        symbols: [
          { sym: 'd', desc: '从相机平面到物体的米制距离，满足 d ≥ 0。' },
          { sym: 'f', desc: '把无上界距离压入 [0,1) 的中间位置，再映射到 RGB 路径。' },
          { sym: 'λ', desc: '远距离压缩形状参数；论文固定为 −3，并要求 λ < −1。' },
          { sym: 'c', desc: '深度弯曲尺度常数；论文固定为 10/3。' },
        ],
      },
      takeaways: [
        {
          icon: '📏',
          title: '深度颜色能够还原米数',
          desc: '合法颜色受限于一条可逆 RGB 路径，生成偏色可先投影到最近路径段。',
        },
        {
          icon: '🧭',
          title: '法线把方向直接交给通道',
          desc: '相机空间单位向量的 x、y、z 分量按固定约定编码进 R、G、B。',
        },
        {
          icon: '📷',
          title: '内参边界必须说清',
          desc: '深度预测本身不使用内参，但将预测反投影为三维场景仍需相机内参。',
        },
      ],
    },
    {
      kind: "chapter",
      id: 'chap-5',
      title: '生成预训练孕育通用视觉能力',
      badge: 'trn',
      badgeLabel: '训练 · 能力归因',
      bridge: '第一章的结论需要回答“能力从哪里来”。论文用低比例任务数据、训练评测隔离、跨任务零样本结果和生成能力保留四条证据，支持微调主要在释放已有表征，而不是从头重学全部视觉能力。',
      analogy: {
        title: '在原调色盘里加入少量格式训练',
        text: '制图师没有倒掉原来的颜料，也没有换成新的专业工具；他只在原训练中加入少量任务图例，学习按指定格式交付，同时继续练习原来的生成工作。',
        componentId: 'instruction-mix',
      },
      modules: [
        {
          kind: "module",
          id: '5.1',
          title: '四条证据共同完成能力归因',
          desc: '依次查看原生成预训练、低比例任务数据、数据来源与生成能力保留。边界折叠区列出未公开的混合比例、训练步数和完整基础架构，区分论文事实与示意图。',
          componentId: 'instruction-mix',
        },
      ],
      insight: '能力归因依赖整条证据链：任务数据比例很低，来源与受测基准训练集隔离，模型在多种未见任务上表现强，而且文生图 53.5% 与编辑 47.8% 接近 50% 平手线。论文据此支持“预训练已有表征、微调主要教任务遵循和格式”。',
      takeaways: [
        {
          icon: '💧',
          title: '任务数据只做低比例对齐',
          desc: '论文把视觉任务数据以极低比例混入 Nano Banana Pro 的原训练混合。',
        },
        {
          icon: '🚧',
          title: '训练与评测数据隔离',
          desc: '2D 使用内部模型标注、3D 使用合成渲染，受测基准训练集没有进入微调混合。',
        },
        {
          icon: '🔗',
          title: '归因依赖完整证据链',
          desc: '轻量对齐、跨任务零样本结果与生成能力近似保留共同支持预训练已有表征。',
        },
      ],
    },
    {
      kind: "chapter",
      id: 'chap-6',
      title: '代表性实验支撑核心结论',
      badge: 'both',
      badgeLabel: '实验 · 公平比较',
      bridge: '三类代表证据依次覆盖二维语义、三维深度和生成能力保留。它们分别检验任务覆盖、与专用模型竞争的能力，以及轻量微调是否明显破坏原生成能力；其余结果收录在完整证据账本中。',
      analogy: {
        title: '先核对图例和比例尺，再比较地图',
        text: '两张地图上的线更长，不一定表示同一件事。评审员先检查区域、比例尺、方向和制图规则；只有标签一致的数字进入同一赛道，其余结果在旁边说明。',
        componentId: 'benchmark-race',
      },
      modules: [
        {
          kind: "module",
          id: '6.1',
          title: '三条代表证据与完整证据账本',
          desc: '默认只在 Cityscapes 零样本、深度匹配四数据集与生成保留之间切换；每项数字都携带数据集、训练背景、系统组成和指标方向。完整的 2D、3D 与生成评测可以在折叠账本中继续核对。',
          componentId: 'benchmark-race',
        },
      ],
      insight: '三条代表证据共同支撑论文的核心结论：Cityscapes 零样本 69.9 对 65.2，深度共同四数据集 0.929 对 0.918，文生图/编辑人评 53.5% 与 47.8% 围绕平手线。法线、组合系统和完整数据集平均保留在证据账本中。',
      takeaways: [
        {
          icon: '🏷️',
          title: '数字必须携带协议',
          desc: '数据集、迁移设置、系统组成、指标与方向缺一不可。',
        },
        {
          icon: '📊',
          title: '2D 与 3D 都有独立证据',
          desc: '语义、实例、指代、推理分割、深度和法线分别接受对应标准指标检验。',
        },
        {
          icon: '⚖️',
          title: '不同范围不能硬排一条榜',
          desc: '四数据集与六数据集、零样本与域内训练、单模型与组合系统必须分开。',
        },
      ],
    },
    {
      kind: "chapter",
      id: 'chap-7',
      title: '论文贡献与适用边界',
      badge: 'both',
      badgeLabel: '结论 · 证据边界',
      bridge: '最后把全文收束为三项贡献：生成预训练形成通用视觉表征，RGB 生成提供统一任务接口，一个轻量对齐后的模型覆盖多种 2D/3D 任务。结论成立时必须同时携带模型、任务、解码器和实验协议边界。',
      analogy: {
        title: '只给带着证据边界的结论盖章',
        text: '评审员逐条对照实验账本：协议、数字和限制都对得上，才盖“证据支持”；省略关键条件、扩大适用范围或混淆系统归因，就盖“结论越界”。',
        componentId: 'claim-stamp',
      },
      modules: [
        {
          kind: "module",
          id: '7.1',
          title: '为核心结论与越界表述盖章',
          desc: '围绕“预训练表征”“RGB 统一接口”和“是否能推广到所有生成器”判断证据边界，并在可展开的清单中核对适用条件与限制。',
          componentId: 'claim-stamp',
        },
      ],
      insight: '论文实验证据表明：对 Nano Banana Pro 进行轻量指令微调，可以把生成预训练中的表征释放为统一、可测且跨多种 2D/3D 任务有效的视觉能力。它没有证明所有生成器天然精通所有视觉任务，也没有解决计算开销、多视图或视频理解。',
      takeaways: [
        {
          icon: '✅',
          title: '被支持的核心结论',
          desc: '生成预训练可以成为强视觉表征来源，RGB 生成可以成为多任务统一接口。',
        },
        {
          icon: '⛔',
          title: '不能扩写成全面统治',
          desc: '结果不支持所有任务、所有协议、所有生成器或所有生成质量维度都全面领先。',
        },
        {
          icon: '🔭',
          title: '仍待解决的范围与成本',
          desc: '当前聚焦单目图像，计算开销高于轻量专家；多视图、视频、更多任务与降本仍属未来工作。',
        },
      ],
    },
  ],
  bilibili: [
    {
      bvid: 'BV1w4E56oE5N',
      title: 'Vision Banana：图像生成模型开始反吃视觉理解',
      reason: '用简短解读建立“生成器反过来承担视觉理解任务”的直觉，适合快速回顾论文动机。',
      cover: 'https://i1.hdslb.com/bfs/archive/adfd7607039b1dfc554ce2c0e47ebdf8b92034da.jpg',
      views: '405播放',
    },
    {
      bvid: 'BV1RSJs6yEKa',
      title: 'Google统一CV大模型：Vision Banana',
      reason: '围绕统一视觉接口与主要任务展开概览，适合学完七章后复盘核心方法。',
      cover: 'https://i1.hdslb.com/bfs/archive/38e6abf4b4dfb7693898091272746f8aa2a1f0f7.jpg',
      views: '7763播放',
    },
    {
      bvid: 'BV1KVTJ6DEyY',
      title: 'Vision Banana:Image Generators are Generalist Vision Learners论文分享',
      reason: '标题直接对应论文，提供中文论文分享视角，可与交互页面的七章结构对照观看。',
      cover: 'https://i0.hdslb.com/bfs/archive/e0e75b6d346f35f9106f1d02b1e2d4eadf3227f4.jpg',
      views: '1038播放',
    },
  ],
};
