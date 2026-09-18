import type { TutorialData } from '../types';

// ============================================================================
//  DriftWorld 论文专属内容（论文：DriftWorld: Fast World Modeling through Drifting）
//  全教程统一主题：一叶扁舟顺流而下。漂移 = 船顺着水流一次到岸；
//  扩散 = 逆流反复划桨。所有交互模块都已注册到 ../modules/registry.tsx。
// ============================================================================

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'DriftWorld: Fast World Modeling through Drifting',
    titleZh: 'DriftWorld：通过漂移实现快速世界建模',
    venue: 'arXiv:2607.15065 · cs.RO',
    authors: 'Susie Lu, Haonan Chen, Weirui Ye, Yilun Du',
    affiliation: 'MIT · Harvard University',
    domain: '机器人世界模型 / 动作条件视频生成',
    coreProblem:
      '扩散式世界模型要在推理时反复去噪、多步采样才能生成未来帧，速度太慢，难以支撑实时的动作搜索与策略评估。',
    coreInsight:
      '把生成建模从「推理时逐步去噪」改成「训练时学习漂移场」：让世界模型在单次前向传播中直接生成未来帧，平均比扩散基线快 <b>17×</b>。',
    keywords: ['世界模型', '漂移生成模型', '动作条件视频生成', '机器人操控'],
  },
  hero: {
    oldMethod: {
      desc: '扩散世界模型：推理时多步去噪，单次 rollout 常需数秒，成为实时规划的主要瓶颈。',
      componentId: 'hero-paddle',
    },
    newMethod: {
      desc: 'DriftWorld：训练时学习漂移场，单次前向直接生成未来帧，30+ fps 的高质量想象。',
      componentId: 'hero-glide',
    },
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '慢在何处：扩散世界模型的推理瓶颈',
      badge: 'inf',
      badgeLabel: '问题引入',
      bridge:
        '机器人要靠世界模型在「脑中」快速想象动作的后果；但扩散模型每次想象都要反复去噪，速度成了整个规划流程的真正瓶颈。',
      analogy: {
        title: '逆流而上，划了无数桨',
        text: '扩散生成像一叶扁舟逆流而行：要到对岸，必须一下又一下地划桨（逐步去噪）。每一步都正确，但加起来太慢，很难在决策循环里反复使用。',
        componentId: 'analogy-boat',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '去噪步数的两难：快就不准，准就慢',
          desc: '拖动滑块改变扩散模型的<b>采样步数</b>。步数越少，生成越快但越偏离目标；步数越多，越接近目标但耗时直线上升。这正是扩散世界模型无法兼顾「快」与「准」的根本矛盾。',
          componentId: 'ch1-noise',
        },
      ],
      insight:
        '扩散的逐步去噪天生无法同时满足「快」与「准」——DriftWorld 要做的，是彻底换掉这种逐步采样。',
      takeaways: [
        { icon: '🎯', title: '瓶颈在推理', desc: '扩散世界模型靠多步去噪生成未来帧，速度限制了大规模动作搜索。' },
        { icon: '⚖️', title: '快与准不可兼得', desc: '采样步数越少越快但越失真，越多越准但越慢。' },
        { icon: '🔧', title: '换一种生成方式', desc: '解决办法是训练时学一个漂移场，推理时一步到位。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '世界模型的输入：历史帧与动作',
      badge: 'inf',
      badgeLabel: '输入表示',
      bridge:
        '在动手改生成方式之前，先看清世界模型到底接收什么：它要根据过去的画面和未来的动作，预测未来画面。',
      analogy: {
        title: '看清河况，再决定舵向',
        text: '船要顺流到对岸，得先知道「现在在哪」（历史帧），再决定「舵往哪打」（动作）。少了任何一样，预测都会跑偏。',
        componentId: 'analogy-boat',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '缺了动作或历史，预测会怎样？',
          desc: '切换下方三种<b>条件输入</b>，观察船对目标位置的预测：没有历史帧会失去起点，没有动作则只能猜测方向。两者齐备时，预测才贴到真实轨迹上。',
          componentId: 'ch2-condition',
        },
      ],
      formula: {
        lead: '世界模型把「历史帧 + 未来动作」映射为「未来观测」：',
        unicode: 'o<sub>t+1:t+T+1</sub> ~ W( · | o<sub>t−F:t</sub>, a<sub>t:t+T</sub> )',
        symbols: [
          { sym: 'W', desc: '动作条件世界模型，负责预测未来画面。' },
          { sym: 'o', desc: '视觉观测（图像），下标表示时间范围。' },
          { sym: 'a', desc: '机器人要执行的动作序列。' },
          { sym: 'F', desc: '历史窗口长度，论文里使用 F=3 帧历史。' },
          { sym: 'T', desc: '预测未来帧数（预测窗口）。' },
        ],
      },
      takeaways: [
        { icon: '🖼️', title: '历史帧定起点', desc: '过去 F 帧画面告诉模型「从哪开始」。' },
        { icon: '🕹️', title: '动作定方向', desc: '未来动作序列告诉模型「要往哪走」。' },
        { icon: '🧭', title: '两者缺一不可', desc: '条件缺失会让预测失去起点或方向，偏离真实轨迹。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '核心洞见：用漂移取代逐步去噪',
      badge: 'inf',
      badgeLabel: '核心洞见',
      bridge:
        '既然多步去噪慢，能否让船顺着训练好的水流，一次性漂到对岸？这正是「漂移生成模型」的关键想法。',
      analogy: {
        title: '顺流而下，一次到岸',
        text: '漂移模型不再反复划桨，而是顺着训练时学到的「水流」被轻轻一推，船就稳稳到达对岸。',
        componentId: 'analogy-boat',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '逐步去噪 vs 一次漂移',
          desc: '点击「开始对比」，同时观察两条船：左边<b>扩散</b>要划很多桨才到岸，右边<b>漂移</b>一次顺流到位。两者最终都能到岸，但步数差了一个数量级。',
          componentId: 'ch3-compare',
        },
      ],
      formula: {
        lead: '漂移的更新规则：当前样本沿漂移场移动一步，向真实数据分布靠拢：',
        unicode: 'x<sub>i+1</sub> = x<sub>i</sub> + V<sub>p,q</sub>(x<sub>i</sub>)',
        symbols: [
          { sym: 'x', desc: '生成的一帧或一段视频（样本）。' },
          { sym: 'V', desc: '漂移场：决定样本移动的方向与大小。' },
          { sym: 'p', desc: '真实数据分布（正样本所在）。' },
          { sym: 'q', desc: '模型当前的生成分布（负样本所在）。' },
          { sym: 'i', desc: '训练迭代步骤下标。' },
        ],
      },
      takeaways: [
        { icon: '🚣', title: '扩散在推理时工作', desc: '逐步去噪把大量计算放在推理阶段。' },
        { icon: '🌊', title: '漂移在训练时工作', desc: '把「移动」学到训练阶段，推理一次到位。' },
        { icon: '⚡', title: '一步生成', desc: '单次前向即可生成未来帧，速度大幅提升。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '漂移场：吸引真样本、推开假样本',
      badge: 'both',
      badgeLabel: '数学框架',
      bridge:
        '漂移不是凭空移动：它由一个「漂移场」驱动，把生成样本拉向真实的未来帧，同时推离错误的未来帧。',
      analogy: {
        title: '水流把船拉向码头、推离礁石',
        text: '漂移场像一股有方向的水流：正样本是码头（吸引），负样本是礁石（排斥），船在合力下沿正确方向前进。',
        componentId: 'analogy-boat',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '拖动船，感受吸引与排斥',
          desc: '在河道里<b>拖动</b>这条船：绿色箭头把它拉向真实目标（正样本），红色箭头把它推离错误的生成结果（负样本）。船的位置越偏离目标，纠偏的合力越明显。',
          componentId: 'ch4-field',
        },
      ],
      formula: {
        lead: '漂移场 = 正样本的平均位移（吸引）减去负样本的平均位移（排斥）：',
        unicode: 'V<sub>p,q</sub>(x) = V<sup>+</sup>(x) − V<sup>−</sup>(x)',
        symbols: [
          { sym: 'V', desc: '漂移场：样本应移动的方向与大小。' },
          { sym: 'x', desc: '当前的生成样本。' },
        ],
      },
      takeaways: [
        { icon: '🧲', title: '吸引正样本', desc: '把生成结果拉向唯一的真实未来帧。' },
        { icon: '🚫', title: '排斥负样本', desc: '把生成结果推离模型自己的错误输出。' },
        { icon: '⚖️', title: '平衡即收敛', desc: '当生成分布等于真实分布时，漂移场归零。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '让模型真正听懂动作：动作增强漂移',
      badge: 'both',
      badgeLabel: '条件引导',
      bridge:
        '如果模型学会偷懒——只复制上一帧而不理会动作——就必须强化动作的约束，逼它跟随指令。',
      analogy: {
        title: '舵手必须跟着舵走',
        text: '不能让船「随波逐流」假装在前进：动作增强就是给舵施加约束，让船真正跟着舵的方向走。',
        componentId: 'analogy-boat',
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '混合权重 γ：动作听得有多认真？',
          desc: '拖动滑块改变 <b>γ</b>。γ 越小，模型越依赖「看动作」的预测（船紧跟舵向，绿色）；γ 越大，越偏向「不看动作」的先验（船随波逐流，红色）。',
          componentId: 'ch5-gamma',
        },
      ],
      formula: {
        lead: '把「看动作」的模型分布与「不看动作」的先验按 γ 混合：',
        unicode: 'q̃ = (1 − γ) · q<sub>θ</sub>(·|a, o) + γ · p(·|∅, o)',
        symbols: [
          { sym: 'q̃', desc: '混合后的预测分布。' },
          { sym: 'γ', desc: '先验占比，范围 [0,1)。' },
          { sym: 'q', desc: '动作条件模型分布（听动作）。' },
          { sym: 'p', desc: '不看动作的先验分布（只根据历史）。' },
        ],
      },
      takeaways: [
        { icon: '🎚️', title: 'γ 调节动作权重', desc: 'γ 越小，动作约束越强。' },
        { icon: '🚪', title: '先验是「空动作」', desc: '先验 p(·|∅) 描述「不采取动作」的状态。' },
        { icon: '✅', title: '防止懒惰解', desc: '动作增强避免模型退化成复制上一帧。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '推理：单次前向生成未来帧',
      badge: 'inf',
      badgeLabel: '推理采样',
      bridge:
        '训练完成后，推理变得极其简单：把噪声和历史、动作一起送进模型，一次前向就得到未来帧。',
      analogy: {
        title: '一声令下，船漂到下一段河道',
        text: '推理不再是一步步划桨，而是顺着已经学好的水流，一次漂到下一段河道。',
        componentId: 'analogy-boat',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '逐步展开一次自回归 rollout',
          desc: '用「下一步」逐步推进一段<b>自回归 rollout</b>：每一步把预测帧送回策略，得到下一段动作，再单次前向生成下一段未来帧。全程没有多步去噪。',
          componentId: 'ch6-infer',
        },
      ],
      formula: {
        lead: '单次前向，从噪声直接映射到未来帧：',
        unicode: 'f<sub>θ</sub>( ε | o<sub>t−F:t</sub>, a<sub>t:t+T</sub> )',
        symbols: [
          { sym: 'f', desc: '漂移世界模型（U-Net 生成器）。' },
          { sym: 'ε', desc: '高斯噪声先验。' },
          { sym: 'o', desc: '历史观测帧。' },
          { sym: 'a', desc: '未来动作序列。' },
        ],
      },
      takeaways: [
        { icon: '⚡', title: '单次前向', desc: '推理只需一次前向传播，无需逐步采样。' },
        { icon: '🔁', title: '自回归拼接', desc: '预测帧送回策略，再生成下一段，构成长程 rollout。' },
        { icon: '📈', title: '30+ fps', desc: '高速生成让大规模候选动作搜索成为可能。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-7',
      title: '训练：让漂移场自我收敛',
      badge: 'trn',
      badgeLabel: '训练目标',
      bridge:
        '漂移场不是手写的，而是用「不动点迭代」训练出来：把模型预测推向一个冻结的漂移目标，反复迭代直到收敛。',
      analogy: {
        title: '反复练习，调准水流',
        text: '训练像反复练习如何调整水流：每一轮都让船更接近「一次到岸」，直到水流稳定、无需再改。',
        componentId: 'analogy-boat',
      },
      modules: [
        {
          kind: 'module',
          id: '7.1',
          title: '一步步看训练收敛',
          desc: '用「下一步」推进训练迭代：漂移场逐渐变小（趋于零），损失曲线随之下降。漂移场归零，意味着生成分布已经贴到真实分布。',
          componentId: 'ch7-train',
        },
      ],
      formula: {
        lead: '不动点损失：把预测拉向「预测 + 漂移场」这个冻结目标：',
        unicode: 'L = E<sub>ε</sub>[ ‖ f<sub>θ</sub>(ε) − stopgrad( f<sub>θ</sub>(ε) + V ) ‖² ]',
        symbols: [
          { sym: 'L', desc: '训练损失。' },
          { sym: 'ε', desc: '采样的高斯噪声。' },
          { sym: 'θ', desc: '模型参数。' },
          { sym: 'V', desc: '漂移场。' },
        ],
      },
      takeaways: [
        { icon: '🔁', title: '不动点迭代', desc: '损失把预测推向冻结的漂移目标。' },
        { icon: '🧊', title: 'stopgrad 冻结目标', desc: '漂移目标不参与反向传播。' },
        { icon: '🎯', title: '收敛即归零', desc: '漂移场趋零时，生成分布等于真实分布。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-8',
      title: '架构与特征空间：动作条件 U-Net',
      badge: 'trn',
      badgeLabel: '网络结构',
      bridge:
        '单步生成要又快又准，需要一个按帧对齐动作的 U-Net，以及在哪个「空间」里计算漂移损失的选择。',
      analogy: {
        title: '船体与仪表，缺一不可',
        text: '船体（U-Net）负责把水流变成前行的动力，仪表（特征空间）负责观察河况。两者配合，船才走得又稳又准。',
        componentId: 'analogy-boat',
      },
      modules: [
        {
          kind: 'module',
          id: '8.1',
          title: '点击查看 U-Net 的每个部件',
          desc: '点击下图中的每个<b>节点</b>，了解动作条件 U-Net 如何把噪声、历史帧与动作组合起来，按帧生成未来画面。',
          componentId: 'ch8-arch',
        },
        {
          kind: 'module',
          id: '8.2',
          title: '在哪个空间里计算漂移损失？',
          desc: '切换<b>特征空间</b>：像素空间适合简单仿真任务；复杂真实场景用 DINOv2/v3 特征空间，才能保持画面清晰。',
          componentId: 'ch8-feature',
        },
      ],
      takeaways: [
        { icon: '🏗️', title: '动作条件 U-Net', desc: '用 FiLM/交叉注意力按帧注入动作，时空分解卷积生成多帧。' },
        { icon: '🧬', title: '特征空间更清晰', desc: '在 DINOv2/v3 特征空间算漂移，画面更锐利。' },
        { icon: '🔀', title: '按复杂度选择', desc: '简单任务用像素空间，复杂真实场景用特征空间。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-9',
      title: '实用机制：特征空间与运动加权',
      badge: 'trn',
      badgeLabel: '实用技巧',
      bridge:
        '在复杂的真实场景里，模型还可能偷懒复制静态背景；运动加权让损失聚焦到真正在动的部分。',
      analogy: {
        title: '盯住真正在动的部分',
        text: '不要被整条河的平静水面迷惑，要把注意力放在船桨激起的水花上——那才是动作真正发生的地方。',
        componentId: 'analogy-boat',
      },
      modules: [
        {
          kind: 'module',
          id: '9.1',
          title: '运动加权：抓准抓手的动作',
          desc: '切换<b>损失加权方式</b>：均匀加权会把损失摊到背景上，模型容易学成复制上一帧；运动加权把损失集中到运动大的区域，抓手更清晰。',
          componentId: 'ch9-motion',
        },
      ],
      takeaways: [
        { icon: '🏃', title: '运动加权', desc: '按区域运动量加权漂移损失，聚焦真正变化的部分。' },
        { icon: '🖼️', title: '特征空间', desc: 'DINOv2/v3 提供语义更合理的距离度量。' },
        { icon: '🛡️', title: '打破懒惰解', desc: '避免模型复制静态背景而忽略动作。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-10',
      title: '结果：更快、更准、更能决策',
      badge: 'both',
      badgeLabel: '结果与局限',
      bridge:
        '最后看证据：漂移世界模型在五个基准上更快且质量相当，还能提升决策性能与离线策略评估的相关性。',
      analogy: {
        title: '多条船同场竞速',
        text: '让 DriftWorld 与扩散基线同场竞速：看谁更快到岸、谁画出的轨迹更贴近真实。',
        componentId: 'analogy-boat',
      },
      modules: [
        {
          kind: 'module',
          id: '10.1',
          title: '启动结果对比',
          desc: '点击「开始对比」并切换指标：在 Push-T 上，DriftWorld 的 SSIM 更高（越高越好）且每帧耗时更少（越低越快）。下方反馈给出论文表 1 中的核实数值。',
          componentId: 'ch10-race',
        },
      ],
      insight:
        'DriftWorld 平均比扩散基线快 17×，在 Push-T 上把策略 IoU 从 0.635 提升到 0.772，离线策略排序相关系数最高 0.9916。',
      takeaways: [
        { icon: '🏆', title: '更快', desc: '平均快 17×，生成速度达 30+ fps。' },
        { icon: '🎯', title: '更准', desc: '在多个指标上匹配或超过扩散基线。' },
        { icon: '🧭', title: '更能决策', desc: '既支持推理时动作搜索，也支持离线策略评估。' },
      ],
    },
  ],
  bilibili: [
    {
      bvid: 'BV1kqNMzZEkG',
      title: '漂移生成模型：一步生成的世界模型',
      reason: '讲解漂移生成模型的核心思路，帮助理解「训练时学漂移场、推理时一步生成」。',
    },
    {
      bvid: 'BV1PW4o6MEtn',
      title: '一步反超扩散模型',
      reason: '介绍扩散模型如何被压缩到一步采样，与 DriftWorld 的加速动机直接相关。',
    },
    {
      bvid: 'BV1seYV6AEKx',
      title: 'DUET-DINO：特征空间自蒸馏',
      reason: '涉及 DINO 特征空间，对应 DriftWorld 在特征空间计算漂移损失的设计。',
    },
    {
      bvid: 'BV13VPXzFEyS',
      title: '世界模型代码实现思路',
      reason: '从实现角度补充世界模型训练与推理流程。',
    },
    {
      bvid: 'BV12L411N7MG',
      title: '漂移与分布的概念讲解',
      reason: '帮助建立「分布向目标漂移」的直观概念。',
    },
  ],
};
