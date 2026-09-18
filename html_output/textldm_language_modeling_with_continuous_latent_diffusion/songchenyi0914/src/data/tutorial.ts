import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'TextLDM: Language Modeling with Continuous Latent Diffusion',
    titleZh: 'TextLDM：连续潜空间扩散的语言建模',
    venue: 'arXiv 2026 · cs.CL',
    authors: 'Jiaxiu Jiang、Jingjing Ren、Wenbo Li 等 13 位作者',
    affiliation: 'Joy Future Academy · HIT · HKUST(GZ)',
    domain: '语言生成 · 连续潜扩散',
    coreProblem:
      '视觉生成中已经形成的 <strong>VAE + DiT + Flow Matching + CFG</strong> 配方，能否几乎不改架构就迁移到语言建模？',
    coreInsight:
      'TextLDM 用 <strong>TextVAE</strong> 把离散 token 映射到连续 latent，再由 <strong>TextDiT</strong> 执行条件 Flow Matching。论文发现关键瓶颈不是重建精度，而是 latent 表示是否适合下游条件去噪。',
    keywords: ['连续潜扩散', 'TextVAE', 'REPA', 'Flow Matching'],
  },
  hero: {
    oldMethod: {
      desc: '自回归模型逐 token 解码；离散扩散反复替换 mask。语言生成长期缺少与视觉 DiT 同构的连续潜扩散路径。',
    },
    newMethod: {
      desc: 'TextLDM 分别编码上下文与目标，在连续 latent 空间学习速度场，再并行解码完整文本段。',
    },
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '问题闭环：语言能否复用视觉扩散配方',
      badge: 'inf',
      badgeLabel: '问题与核心循环',
      bridge: '先并排观察 AR、离散扩散和 TextLDM 的生成路径，再明确本文真正要验证的可行性边界。',
      analogy: {
        title: '三种“抄文章”的方式',
        text: 'AR 像逐字抄写；离散扩散先把整页盖住再逐步补字；TextLDM 则先形成一张连续语义草稿，再一次性誊写成完整文本段。',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '三种文本生成范式动画',
          desc: '切换 AR、mask 扩散与连续潜扩散，比较每一步可见的信息和最终输出方式。',
          componentId: 'paradigm-showcase',
        },
      ],
      insight:
        '论文并不主张立刻取代自回归，而是检验：视觉潜扩散的标准组件能否作为语言生成的有效底座。',
      takeaways: [
        { icon: '🔁', title: 'AR 是顺序路径', desc: '每个 token 依赖已生成前缀，计算过程天然串行。' },
        { icon: '🧩', title: '离散扩散改写 mask', desc: '仍停留在离散 token 空间，通过迭代解掩码生成。' },
        { icon: '🌊', title: 'TextLDM 改在 latent 中', desc: '连续状态负责去噪，解码器负责一次性恢复文本。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '输入表示：TextVAE 如何把 token 变成 latent',
      badge: 'inf',
      badgeLabel: '输入表示',
      bridge: '连续扩散的入口不是文字，而是每个 token 对应的连续向量；表示质量决定后续速度场能否学习。',
      analogy: {
        title: '把每个词装进彩色胶囊',
        text: '离散的单词像不同形状的零件；TextVAE 把它们装进统一规格的连续胶囊，使扩散模型能够在同一几何空间中操作。',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: 'TextVAE、REPA 与 TextDiT 方法切换',
          desc: '查看编码、对齐与去噪三个方法阶段，理解每一部分在系统中的职责。',
          componentId: 'method-lab',
        },
      ],
      formula: {
        lead: '重参数化把随机性从表示内容中分离出来：',
        unicode: 'z = μ + σ ⊙ ε，ε ~ N(0, I)',
        symbols: [
          { sym: 'μ', desc: '编码器预测的后验均值。' },
          { sym: 'σ', desc: '后验标准差，决定采样扰动尺度。' },
          { sym: 'z', desc: '送入 TextDiT 的连续 latent。' },
        ],
      },
      takeaways: [
        { icon: '🧱', title: '一对一映射', desc: '序列长度保持不变，每个 token 对应一个 latent 向量。' },
        { icon: '🎲', title: '重参数化采样', desc: '训练时保留梯度，同时让 latent 接近高斯先验。' },
        { icon: '🧭', title: '表示是瓶颈', desc: '重建好只说明信息能恢复，不代表几何结构适合去噪。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '关键洞察：重建准确并不等于生成可用',
      badge: 'inf',
      badgeLabel: '核心洞察',
      bridge: '论文通过消融把“能还原 token”和“能支撑下游扩散”分开，随后用 REPA 改变 latent 几何。',
      analogy: {
        title: '高清照片不等于好地图',
        text: '照片可以忠实记录每个像素，却未必能指导导航；同样，TextVAE 重建几乎无损，也不代表 latent 空间适合条件去噪。',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '主张—证据矩阵',
          desc: '按证据状态筛选论文主张，查看每项结论对应的表格、图示与适用范围。',
          componentId: 'evidence-matrix',
        },
      ],
      formula: {
        lead: 'REPA 将编码器表示与冻结语言模型的隐藏状态做余弦对齐：',
        unicode: 'L_REPA = −(1/N) Σ cos(h_enc, sg(h_LLM))',
        symbols: [
          { sym: 'h_enc', desc: 'TextVAE 编码器的中间表示。' },
          { sym: 'h_LLM', desc: '冻结 Qwen3-1.7B 的教师表示。' },
          { sym: 'sg', desc: '停止梯度，教师模型不参与反向传播。' },
        ],
      },
      insight:
        'REPA 改善的是 latent 的语义与几何结构，而不是把 token 重建做得更精确。',
      takeaways: [
        { icon: '📉', title: '重建差异很小', desc: '不同 VAE 配置的 token 重建准确率差异不足 0.05%。' },
        { icon: '📈', title: '生成差异很大', desc: '下游 ROUGE、BERTScore 与 MAUVE 却能出现显著变化。' },
        { icon: '🧬', title: '对齐塑造几何', desc: '冻结 LLM 提供的表示结构，成为提升生成质量的关键。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '核心框架：连续 latent 上的 Flow Matching',
      badge: 'both',
      badgeLabel: '数学框架',
      bridge: '把噪声 latent 与目标 latent 连成一条路径，TextDiT 学习的是如何沿着路径移动。',
      analogy: {
        title: '在起点和终点之间插值',
        text: '扩散过程像一列从随机噪声驶向目标语义的列车；模型学习的不是终点坐标，而是每一时刻应走的速度。',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '训练与推理流水线',
          desc: '切换训练/推理模式，观察 context latent、噪声 target 与 DiT 去噪如何连接。',
          componentId: 'textldm-pipeline',
        },
      ],
      formula: {
        lead: '条件流匹配用线性路径连接噪声与目标 latent：',
        unicode: 'z_t = (1 − t) z_0 + t z_1，v(z_t) = z_1 − z_0',
        symbols: [
          { sym: 'z_0', desc: '标准高斯噪声 latent。' },
          { sym: 'z_1', desc: 'TextVAE 编码的目标文本 latent。' },
          { sym: 'v', desc: '模型预测的条件速度场。' },
        ],
      },
      takeaways: [
        { icon: '🛤️', title: '路径是连续的', desc: '扩散在潜空间中进行，而不是逐 token 分类。' },
        { icon: '🧮', title: '目标是速度场', desc: '训练目标预测 z₁−z₀，而不是直接预测完整 token。' },
        { icon: '🔗', title: '条件来自上下文', desc: 'context latent 控制速度场，决定续写方向。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '条件与引导：为什么 context 与 target 必须分开',
      badge: 'both',
      badgeLabel: '条件与引导',
      bridge: '如果目标文本在训练时泄漏进条件，模型会学到近乎复制答案；条件分支必须严格隔离。',
      analogy: {
        title: '续写题不能偷看答案',
        text: '给定开头写作时，只能阅读题面，不能看到参考范文；context 与 target 分开编码，正是为了避免这种信息泄漏。',
      },
      modules: [],
      formula: {
        lead: '推理时用 classifier-free guidance 放大条件速度：',
        unicode: 'v = v_uncond + w(v_cond − v_uncond)',
        symbols: [
          { sym: 'v_uncond', desc: '无条件速度场预测。' },
          { sym: 'v_cond', desc: '以 context latent 为条件的预测。' },
          { sym: 'w', desc: '引导强度，控制条件影响幅度。' },
        ],
      },
      insight:
        '训练时以 10% 概率丢弃条件，使同一模型能够在推理时同时估计条件与无条件速度。',
      takeaways: [
        { icon: '🚧', title: '条件隔离', desc: '目标 latent 的信息不能进入 context 分支。' },
        { icon: '🎚️', title: 'CFG 调节方向', desc: '引导强度影响条件贴合度与样本多样性。' },
        { icon: '🧪', title: '视觉配方可迁移', desc: '实验说明 CFG 等组件在语言潜空间中同样有效。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '推理过程：并行去噪生成一段文本',
      badge: 'inf',
      badgeLabel: '推理与采样',
      bridge: '从随机 latent 出发，用固定数量的 Euler 步更新状态，最后一次性解码为目标文本段。',
      analogy: {
        title: '从雪花屏洗出清晰画面',
        text: '初始 latent 像随机雪花屏，TextDiT 每步擦掉一些不确定性，经过约 50 步后得到可解码的语义状态。',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '去噪步数实验',
          desc: '拖动 0–50 步，观察低步数语义混乱、高步数连贯性提升的示例。',
          componentId: 'denoising-playground',
        },
      ],
      formula: {
        lead: 'Euler 采样把连续速度场离散为可执行更新：',
        unicode: 'z_{t+Δ} = z_t + Δ · vθ(z_t, t, z_c)',
        symbols: [
          { sym: 'Δ', desc: 'Euler 更新步长。' },
          { sym: 'z_c', desc: '编码后的上下文 latent。' },
          { sym: 'vθ', desc: '带参数的 TextDiT 速度预测器。' },
        ],
      },
      insight:
        'NFE 不随生成长度线性增长，但它不等于 FLOPs、显存或墙钟时间恒定；每步仍需处理完整目标序列。',
      takeaways: [
        { icon: '⚡', title: '并行解码', desc: '目标文本段不是逐 token 串行生成，而是一次解码。' },
        { icon: '🪜', title: '固定步数', desc: '50 步 Euler ODE 是论文的主要推理配置。' },
        { icon: '📏', title: '效率边界', desc: '长度不变 NFE 只描述函数评估次数，不代表总成本不变。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-7',
      title: '训练目标：TextVAE 与 TextDiT 如何各自优化',
      badge: 'trn',
      badgeLabel: '训练目标',
      bridge: '系统分两阶段训练：先得到可重建且适合去噪的 latent 表示，再冻结表示训练速度场。',
      analogy: {
        title: '先编词典，再练写作',
        text: '第一阶段先把词义整理成连续词典；第二阶段才让生成器学习如何在这套词典中从噪声走到目标表达。',
      },
      modules: [
        {
          kind: 'module',
          id: '7.1',
          title: '两阶段训练流程',
          desc: '切换到训练模式，查看 CE、KL、REPA 与 TextDiT Flow Matching 的依赖关系。',
          componentId: 'textldm-pipeline',
        },
      ],
      formula: {
        lead: '第二阶段仅训练 TextDiT，核心是条件速度回归：',
        unicode: 'L_FM = E ‖vθ(z_t, t, z_c) − (z_1 − z_0)‖²',
        symbols: [
          { sym: 'z_c', desc: '上下文 latent 条件。' },
          { sym: 'z_t', desc: '路径上的插值 latent。' },
          { sym: 'z_1 − z_0', desc: '从噪声指向目标的监督速度。' },
        ],
      },
      insight:
        'TextVAE 阶段由重建、KL 与 REPA 共同驱动；TextDiT 阶段冻结 VAE，只更新条件速度预测器。',
      takeaways: [
        { icon: '1️⃣', title: 'Stage 1', desc: '训练 TextVAE，使 token 重建与 latent 对齐同时成立。' },
        { icon: '2️⃣', title: 'Stage 2', desc: '冻结 TextVAE，训练 TextDiT 学习条件速度场。' },
        { icon: '🧊', title: '教师冻结', desc: 'REPA 的 Qwen3-1.7B 只提供对齐目标，不参与更新。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-8',
      title: '关键技术：时间步调度与引导强度',
      badge: 'trn',
      badgeLabel: '关键技术',
      bridge: '扩散模型的性能不仅取决于主干，还取决于训练时的噪声调度与推理时的条件引导。',
      analogy: {
        title: '调节练习难度与教练提示',
        text: '时间步采样像安排不同难度的练习；CFG 则像教练提示，提示太弱方向不明，太强又会牺牲多样性。',
      },
      modules: [],
      formula: {
        lead: '论文采用 logit-normal 时间步采样，并系统消融其标准差：',
        unicode: 't ~ LogitNormal(0, σ)，主配置 σ = 1.5',
        symbols: [
          { sym: 't', desc: 'Flow Matching 路径上的连续时间步。' },
          { sym: 'σ', desc: 'logit-normal 分布的标准差。' },
        ],
      },
      insight:
        '论文的主结果说明视觉扩散中的 logit-normal 调度和 CFG 可以迁移到语言模块，但仍需按数据与模型规模重新调参。',
      takeaways: [
        { icon: '🕰️', title: '调度影响梯度', desc: '时间步分布决定模型更常学习哪些噪声区间。' },
        { icon: '🎯', title: 'CFG 影响权衡', desc: '更强引导通常提升条件一致性，却可能降低多样性。' },
        { icon: '🔬', title: '消融确定默认值', desc: 'σ=1.5、CFG 与 50 步推理来自论文的系统实验。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-9',
      title: '实验闭环：从数据准备到证据归因',
      badge: 'trn',
      badgeLabel: '实验方法',
      bridge: '沿着训练、评测与归因步骤逐段检查，避免只记住一个总分数而忽略实验条件。',
      analogy: {
        title: '做菜先备料，再试味',
        text: '数据清洗相当于备料，训练与推理是烹饪，四个文本续写基准则像不同维度的试味记录。',
      },
      modules: [
        {
          kind: 'module',
          id: '9.1',
          title: '可交互实验流程',
          desc: '点击、前后切换或自动播放实验步骤，查看每一步操作与审阅重点。',
          componentId: 'experiment-flow',
        },
      ],
      takeaways: [
        { icon: '🗂️', title: '统一训练数据', desc: 'TextLDM 与主要基线在 OpenWebText2 上从零训练。' },
        { icon: '🧪', title: '四项续写基准', desc: 'WikiSource、Wikipedia、TinyStories 与 One Billion Words。' },
        { icon: '🧷', title: '协议要一起看', desc: '指标、模型规模和训练计算必须与结果同时核对。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-10',
      title: '结果与边界：TextLDM 做到了什么',
      badge: 'both',
      badgeLabel: '结果与边界',
      bridge: '最后把结果浏览、规模趋势和证据边界放在一起，区分论文支持的事实与仍属愿景的表述。',
      analogy: {
        title: '赛后看记分牌，也要复算规则',
        text: '比分说明模型在特定比赛中的表现；只有同时检查数据、规模和评测协议，才能判断优势能否外推。',
      },
      modules: [
        {
          kind: 'module',
          id: '10.1',
          title: '跨评测集结果浏览器',
          desc: '按数据集、指标和模型家族筛选，比较 TextLDM、自回归基线与已有扩散模型。',
          componentId: 'results-lab',
        },
        {
          kind: 'module',
          id: '10.2',
          title: '参数化结果模拟器',
          desc: '调整 VAE、REPA、DiT 规模和推理配置，观察论文趋势对应的相对变化。',
          componentId: 'experiment-simulator',
        },
      ],
      insight:
        '论文支持“视觉潜扩散配方可以迁移到文本续写”，但没有证明通用理解、完整墙钟效率优势或统一多模态模型已经完成。',
      takeaways: [
        { icon: '🏆', title: '扩散语言模型中领先', desc: 'TextLDM 在多个指标上超过已有连续与离散扩散语言模型。' },
        { icon: '⚖️', title: '与 GPT-2 可比', desc: '在论文设定的同规模与同数据条件下达到可比续写性能。' },
        { icon: '🚧', title: '边界必须保留', desc: '统一多模态、通用推理与真实吞吐优势仍需要后续验证。' },
      ],
    },
  ],
};

