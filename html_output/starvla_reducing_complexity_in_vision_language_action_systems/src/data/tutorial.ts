import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'StarVLA-α: Reducing Complexity in Vision-Language-Action Systems',
    titleZh: 'StarVLA-α：降低视觉—语言—动作系统的复杂性',
    venue: 'arXiv 2026 · 4 分钟交互式精读',
    authors: 'Jinhui Ye、Ning Gao、Senqiao Yang 等',
    affiliation: 'HKUST · XJTU · CUHK · THU · Tongyi Lab · SmartMore',
    domain: '具身智能 · 机器人学习 · Vision-Language-Action',
    coreProblem: '现有 VLA 在架构、训练数据、机器人形态与基准工程上高度碎片化：系统越来越复杂，却很难判断哪些设计真正带来收益。',
    coreInsight: 'StarVLA-α 证明：依托<b>强大的 VLM 主干</b>，配合<b>简单的连续 MLP 动作头</b>与<b>最小数据处理</b>，无需额外架构复杂度或重度工程技巧，也能在多基准和真实机器人上取得强劲表现。',
    keywords: ['强 VLM 主干', '简单连续 MLP', '最小数据处理', '通用智能体评估'],
  },
  hero: {
    oldMethod: { desc: '<b>领域现状：</b>架构、预训练、机器人接口和基准工程同时变化，复杂但难比较。', componentId: 'sv-hero-old' },
    newMethod: { desc: '<b>本文主张：</b>强 VLM + 轻量 MLP + 最小处理，已经能形成简单而强劲的 VLA 基线。', componentId: 'sv-hero-new' },
  },
  chapters: [
    {
      kind: 'chapter', id: 'chap-1', title: '从复杂化困境到 StarVLA-α', badge: 'both', badgeLabel: '论文 §1 引言',
      bridge: '现有 VLA 系统的成绩来自模型、数据、机器人接口与评测流程的共同作用。引言先回答：为什么作者认为需要一个干净、透明而且足够强的研究起点？',
      analogy: { title: '本章证据范围', text: '只依据论文 §1 引言，梳理研究困境、研究目标与三项贡献。', componentId: 'sv-ana-1' },
      modules: [
        { kind: 'module', id: '1.1', title: '三类异质性：复杂从哪里来？', desc: '逐项查看数据与机器人、建模与训练、评测实践为何让跨论文结论难以归因。', componentId: 'sv-intro-problem' },
        { kind: 'module', id: '1.2', title: '引言给出的三项贡献', desc: '依次展开论文的贡献：强而简的基线、受控重评常见实践、统一 Generalist 评估。', componentId: 'sv-contributions' },
      ],
      insight: 'StarVLA-α 的出发点不是提出更复杂的模块，而是先建立一个简单、强劲、可复现的 VLA 研究基线。',
      takeaways: [
        { icon: '①', title: '研究困境', desc: 'VLA 设计空间碎片化，结果难比较。' },
        { icon: '②', title: '研究目标', desc: '用极简强基线重新审视常见设计。' },
        { icon: '③', title: '三项贡献', desc: '强基线、受控分析与一体化评估。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-2', title: 'StarVLA-α：干净、透明、强劲的极简基线', badge: 'inf', badgeLabel: '论文 §2',
      bridge: '引言提出要减少不必要的复杂性，接下来必须先回答两个问题：StarVLA-α 到底简化了什么？这样的基线真的足够强吗？',
      analogy: { title: '本章证据范围', text: '只依据论文 §2 与 Table 1，讲清架构、输入输出、训练处理和主结果。', componentId: 'sv-ana-2' },
      modules: [
        { kind: 'module', id: '2.1', title: '点击架构节点：极简体现在哪里？', desc: '沿信息流查看 RGB 与指令、Qwen3-VL、动作 token、简单 MLP 和连续动作块各自职责。', componentId: 'sv-pipeline' },
        { kind: 'module', id: '2.2', title: 'Table 1：这个简单基线够强吗？', desc: '切换基准，用同一协议下的柱状图直接比较 StarVLA-α 与代表性方法。', componentId: 'sv-baseline-results' },
      ],
      insight: '结论先立住：StarVLA-α 不是“为了简单而牺牲性能”，而是一个足够强、因此适合继续做受控分析的起点。',
      takeaways: [
        { icon: '①', title: '强主干', desc: 'Qwen3-VL 承担视觉与语言理解。' },
        { icon: '②', title: '轻动作头', desc: '动作 token 经简单 MLP 输出连续动作块。' },
        { icon: '③', title: '强结果', desc: 'Table 1 在多基准上保持竞争力。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-3', title: '不同动作头设计是否重要？', badge: 'inf', badgeLabel: '论文 §3.1',
      bridge: '既然简单 MLP 已经构成强基线，论文首先检验最常见的加复杂方向：换成离散自回归、双系统或流匹配动作头，能否稳定取得更好结果？',
      analogy: { title: '本章证据范围', text: '固定 VLM、数据与训练，只比较 Table 2 的四种动作头。', componentId: 'sv-ana-3' },
      modules: [
        { kind: 'module', id: '3.1', title: '四种动作头：设计差异是什么？', desc: '切换 MLP、FAST、GR00T-style 与 π-style，观察输出类型与额外机制。', componentId: 'sv-head-designs' },
        { kind: 'module', id: '3.2', title: 'Table 2：简单 MLP 与复杂动作头谁更强？', desc: '切换四个代表性基准，比较离散 token 方法与三种连续动作头，再观察连续动作头之间的差异。', componentId: 'sv-head-results' },
      ],
      insight: '连续动作预测对高性能至关重要，始终优于离散 token 方法；当 VLM 足够强大时，连续动作头的具体选型影响有限。',
      takeaways: [
        { icon: '①', title: '动作表示', desc: '连续动作预测对高性能至关重要。' },
        { icon: '②', title: '对比结果', desc: '连续动作始终优于离散 token 方法。' },
        { icon: '③', title: '具体选型', desc: '强 VLM 下，连续动作头选型影响有限。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-4', title: '现有动作专属预训练是否重要？', badge: 'trn', badgeLabel: '论文 §3.2',
      bridge: '动作头并不需要一味变复杂，那么“先用更多机器人轨迹预训练”是否总能带来收益？论文把预训练来源与目标数据量同时纳入比较。',
      analogy: { title: '本章证据范围', text: '依据 Table 3 比较无额外预训练、OXE、InternData-A1 与 RoboTwin-Rand。', componentId: 'sv-ana-4' },
      modules: [
        { kind: 'module', id: '4.1', title: 'Table 3：预训练来源 × 目标数据量', desc: '切换 RoboTwin 的 Clean 50×50、+Random×100、+Random×500，或 RoboCasa 的 24×10、24×100、24×1000，一次看全四种预训练来源。', componentId: 'sv-pretrain' },
      ],
      insight: '当预训练数据与目标任务高度匹配时，额外动作专属预训练可提升性能，但可能损害向未见过领域的泛化。强 VLM 基线已提供扎实基础；进一步预训练是一把双刃剑，需谨慎使用。',
      takeaways: [
        { icon: '①', title: '匹配时', desc: '高度匹配的动作预训练可提升性能。' },
        { icon: '②', title: '跨域时', desc: '可能损害向未见领域的泛化。' },
        { icon: '③', title: '使用原则', desc: '强 VLM 已是扎实基础，额外预训练需谨慎。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-5', title: '数据工程是否必要？', badge: 'trn', badgeLabel: '论文 §3.3',
      bridge: '除了动作头和预训练，VLA 还常加入本体状态、历史帧以及 delta/relative action。论文继续问：这些工程设计在什么数据条件下真正有价值？',
      analogy: { title: '本章证据范围', text: '依据 Table 4 比较五种输入或动作接口设计在不同目标数据量下的结果。', componentId: 'sv-ana-5' },
      modules: [
        { kind: 'module', id: '5.1', title: 'Table 4：先调数据量，再看工程收益', desc: '滑动 24×10、24×100、24×1000 三档 RoboCasa 数据量；24 表示任务数，后一项表示每个任务的演示数。', componentId: 'sv-data-engineering' },
      ],
      insight: '基于强 VLM 与干净代码库构建时，数据工程技巧在任务专属数据有限时可带来适度收益；但当任务数据充足后，其影响可忽略不计。',
      takeaways: [
        { icon: '①', title: '数据有限', desc: '数据工程技巧可带来适度收益。' },
        { icon: '②', title: '数据充足', desc: '不同设计的影响可忽略不计。' },
        { icon: '③', title: '成立前提', desc: '强 VLM 主干与干净代码库。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-6', title: '评估模型是否真正具备泛化能力的有效范式是什么？', badge: 'both', badgeLabel: '论文 §4',
      bridge: '前三章回答了单项复杂设计是否必要，但“每个基准各训一个模型”仍不足以证明通用性。论文因此把问题推进到：一个模型能否同时覆盖多任务、多基准与多机器人形态？',
      analogy: { title: '本章证据范围', text: '依据 §4 与 Tables 5–6，区分 Specialist 和 Generalist，并强调联合训练的证据边界。', componentId: 'sv-ana-6' },
      modules: [
        { kind: 'module', id: '6.1', title: 'Specialist 与 Generalist：评估范式有何不同？', desc: '切换两种范式，比较训练数据、模型数量、评测方式与可以得出的结论。', componentId: 'sv-generalist-protocol' },
        { kind: 'module', id: '6.2', title: 'Tables 5–6：一个模型能否同时保持性能？', desc: '切换基准比较 Specialist 与 Generalist，再查看三种跨机器人动作接口策略。', componentId: 'sv-generalist-results' },
        { kind: 'module', id: '6.3', title: '模型大小与批大小：什么支撑一体化泛化？', desc: '切换模型大小与批大小，查看 2B、4B、8B 的规模效应，以及 64–1024 批大小下的训练多样性趋势。', componentId: 'sv-generalist-factors' },
      ],
      takeaways: [
        { icon: '①', title: '单一模型', desc: '可有效处理多样任务与机器人形态。' },
        { icon: '②', title: '跨形态设计', desc: '复杂专家式设计或许并非必需。' },
        { icon: '③', title: '关键条件', desc: '4B 已足够；大批量带来训练多样性。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-7', title: '真实世界实验：极简框架仍有竞争力吗？', badge: 'both', badgeLabel: '论文 §5',
      bridge: '仿真与公开基准上的结论还需要实体机器人验证。论文在 ARX5 上用 11 个 RoboChallenge 任务检验：极简架构的优势能否延伸到真实执行？',
      analogy: { title: '本章证据范围', text: '只依据论文 §5 与 Table 7，比较成功率、进度分和代表性任务。', componentId: 'sv-ana-7' },
      modules: [
        { kind: 'module', id: '7.1', title: 'Table 7：ARX5 真实机器人结果', desc: '切换平均成功率与平均进度分，比较 StarVLA-α、π₀.₅ 与 π₀。', componentId: 'sv-real-world' },
      ],
      insight: 'StarVLA-α 在真实机器人上显著领先两个对照模型，说明极简框架仍具竞争力；但 33.6% 的绝对成功率也表明真实部署仍远未解决。',
      takeaways: [
        { icon: '①', title: '相对优势', desc: '成功率 33.6%，明显高于 π₀.₅ 的 12.7%。' },
        { icon: '②', title: '过程能力', desc: '进度分 54.5，也保持明显领先。' },
        { icon: '③', title: '现实边界', desc: '绝对成功率仍不足以支持可靠部署。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-8', title: '结论：强 VLM + 极简设计，已经足够强', badge: 'both', badgeLabel: '论文 §7 结论',
      bridge: '沿着论文正文的证据链回看：先建立极简强基线，再重评三类常见复杂设计，最后通过 Generalist 与实机实验检查可推广性。论文最终得出了什么？',
      analogy: { title: '本章证据范围', text: '只依据论文 §7 结论收束，保持论文原本的总结范围。', componentId: 'sv-ana-8' },
      modules: [
        { kind: 'module', id: '8.1', title: '四步收束论文结论', desc: '依次点亮“强基线—重评常见实践—通用与实机验证—最终结论”，形成完整证据链。', componentId: 'sv-conclusion' },
      ],
      insight: '依托强大的 VLM 主干、简单的 MLP 动作头与最小数据处理，StarVLA-α 在多基准和真实机器人上表现强劲，为简洁、可复现、可推广的 VLA 研究提供了坚实起点。',
      takeaways: [
        { icon: '①', title: '核心设计', desc: '强 VLM + 简单连续 MLP + 最小处理。' },
        { icon: '②', title: '核心发现', desc: '复杂动作头、重工程和专属预训练并非严格必要。' },
        { icon: '③', title: '核心价值', desc: '提供简单、强劲、可复现的研究起点。' },
      ],
    },
  ],
  bilibili: [
    { bvid: 'BV18zdVBbE4R', title: 'StarVLA：从 Vision-Language Model 到 Vision-Language-Action 的统一开源框架', reason: '直接补充 StarVLA 项目背景。', views: '2313播放' },
    { bvid: 'BV1q6RzYnENi', title: '逐篇解析机器人基座模型和 VLA 经典论文', reason: '系统梳理机器人基座模型与 VLA 研究脉络。', views: '3.8万播放' },
    { bvid: 'BV1Srhez3EZQ', title: 'DIY 机械臂实测 VLA：Pi0、SmolVLA、ACT', reason: '补充 VLA 在真实机械臂上的部署语境。', views: '5450播放' },
    { bvid: 'BV12QXbBREVt', title: '机器人开源革命：VLA 开源模型的技术路线', reason: '从开源生态理解 VLA 的现实位置。', views: '4.2万播放' },
  ],
};
