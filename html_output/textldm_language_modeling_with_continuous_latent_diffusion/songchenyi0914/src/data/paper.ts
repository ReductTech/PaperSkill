export type EvidenceStatus = 'supported' | 'partial' | 'unsupported'

export type NavSection = {
  id: string
  label: string
  eyebrow: string
}

export type ModelResult = {
  name: string
  shortName: string
  family: 'textldm' | 'autoregressive' | 'diffusion'
  values: Record<MetricKey, number>
}

export type MetricKey = 'r1' | 'r2' | 'rl' | 'bert' | 'mauve'

export type DatasetResult = {
  id: string
  name: string
  note: string
  models: ModelResult[]
}

export type EvidenceItem = {
  id: string
  claim: string
  evidence: string[]
  status: EvidenceStatus
  scope: string
  insight: string
}

export type MethodStage = {
  id: string
  index: string
  eyebrow: string
  title: string
  summary: string
  bullets: string[]
  formulaLabel: string
  formula: string
  accent: 'cyan' | 'violet'
}

export const navSections: NavSection[] = [
  { id: 'overview', label: '研究总览', eyebrow: 'Overview' },
  { id: 'motivation', label: '研究动机', eyebrow: 'Motivation' },
  { id: 'problem', label: '核心问题', eyebrow: 'Problem' },
  { id: 'method', label: '方法路径', eyebrow: 'Method' },
  { id: 'experiment-flow', label: '实验流程', eyebrow: 'Experiment flow' },
  { id: 'evidence', label: '证据矩阵', eyebrow: 'Evidence' },
  { id: 'results', label: '实验结果', eyebrow: 'Results' },
  { id: 'goals', label: '目标边界', eyebrow: 'Scope' },
  { id: 'verification', label: '核验状态', eyebrow: 'Verification' },
]

export const motivationCards = [
  {
    index: '01',
    title: '视觉生成已经收敛',
    body: 'VAE 连续潜空间、DiT、Flow Matching、CFG 与 logit-normal 调度构成了相对统一的视觉生成配方。',
    tag: 'Recipe converged',
  },
  {
    index: '02',
    title: '语言生成仍是自回归主场',
    body: '文本生成主要依赖逐 token 解码，连续潜扩散尚未在语言领域形成同等成熟的架构共识。',
    tag: 'Method gap',
  },
  {
    index: '03',
    title: '统一多模态需要共同骨干',
    body: '若文本也能在连续潜空间中使用标准 DiT，未来视觉与语言模型可能共享一套生成架构。',
    tag: 'Unified future',
  },
]

export const problemLayers = [
  {
    index: 'P1',
    label: '可行性',
    title: '视觉潜扩散配方能否迁移到文本？',
    description: '压缩离散 token、在连续潜空间中执行条件 Flow Matching，并生成完整后续文本段。',
  },
  {
    index: 'P2',
    label: '表示瓶颈',
    title: '什么样的连续潜表示适合下游去噪？',
    description: '论文发现接近完美的 token 重建并不自动带来高质量生成，潜空间的几何与语义结构才是关键。',
  },
  {
    index: 'P3',
    label: '实现路径',
    title: '如何让潜在空间兼具重建性与生成性？',
    description: '通过 REPA 与冻结语言模型对齐，让 TextVAE 的潜空间保留更适合条件去噪的表示。',
  },
]

export const methodStages: MethodStage[] = [
  {
    id: 'textvae',
    index: '01',
    eyebrow: 'Stage one / representation',
    title: 'TextVAE：连续文本潜表示',
    summary: '把每个离散 token 映射为一对一的连续潜向量，并使用非自回归 Transformer 解码。',
    bullets: [
      'Transformer 编码器预测每个位置的高斯均值与方差。',
      '重参数化采样得到连续潜变量，序列长度保持不变。',
      '训练由重建、KL 正则和 REPA 语义对齐三部分共同驱动。',
      '训练阶段随机截断输入，学习不同长度与重建范围。',
    ],
    formulaLabel: 'TextVAE objective',
    formula: 'L_VAE = L_CE + β · D_KL + λ · L_REPA',
    accent: 'cyan',
  },
  {
    id: 'repa',
    index: '02',
    eyebrow: 'Stage one / alignment',
    title: 'REPA：让潜空间更适合扩散',
    summary: '将 TextVAE 编码器中间表示与冻结 Qwen3-1.7B 的隐藏状态进行余弦对齐。',
    bullets: [
      '教师模型冻结，仅训练 TextVAE 的生成参数。',
      '默认对齐倒数第三层，而不是最后一层。',
      '论文默认 λ=1、β=0.001；REPA 明显改善下游生成。',
      '重建精度几乎没有变化，说明增益来自潜空间结构。',
    ],
    formulaLabel: 'Alignment loss',
    formula: 'L_REPA = -1/N · Σ cos(h_enc, sg(h_LLM))',
    accent: 'violet',
  },
  {
    id: 'textdit',
    index: '03',
    eyebrow: 'Stage two / generation',
    title: 'TextDiT：潜空间中的 Flow Matching',
    summary: '将干净 context latent 与加噪 target latent 拼接，学习条件速度场。',
    bullets: [
      'context 与 target 分别编码，阻断 target 向 prompt 的信息泄漏。',
      '时间步采样采用 logit-normal(std=1.5) 调度。',
      '训练时以 10% 概率丢弃条件，支持 CFG。',
      '推理使用 50 步 Euler ODE，并行生成整个目标文本段。',
    ],
    formulaLabel: 'Conditional flow matching',
    formula: 'L_FM = E ||vθ(z_t, t, z_c) - (z_tgt - z_0)||²',
    accent: 'cyan',
  },
]

export type ExperimentStep = {
  id: string
  phase: string
  index: string
  title: string
  short: string
  objective: string
  inputs: string[]
  operations: string[]
  outputs: string[]
  evidence: string
  note: string
  explanation: string
  watchpoints: string[]
  tone: 'cyan' | 'violet' | 'amber' | 'green'
}

export const experimentSteps: ExperimentStep[] = [
  {
    id: 'data',
    phase: 'Data',
    index: '01',
    title: '构建训练与评测数据',
    short: '数据准备',
    objective: '固定训练语料和续写评测协议，确保模型之间的比较处于同一数据口径。',
    inputs: ['OpenWebText2 训练语料', 'WikiSource、Wikipedia、TinyStories、One Billion Words'],
    operations: ['训练序列最大长度设为 1024 tokens', '每个评测集随机抽取 1K 样本', '按样本长度 40%-60% 的位置切分 prompt 与 target'],
    outputs: ['统一 token 化训练流', '条件输入与真值续写目标', '可复用的评测样本集合'],
    evidence: 'Section 4.1',
    note: '四个基准同时覆盖相对简单、较长文本和明显域外分布，用来区分训练拟合与跨域泛化。',
    explanation: '本步骤的核心是建立可比性：所有模型使用相同 tokenizer、最大长度和 prompt-target 切分规则，避免模型差异与数据处理差异混在一起。',
    watchpoints: ['prompt 与 target 必须在生成前固定切分', 'WikiSource 与 Wikipedia 应单独判断域外泛化', '短文本基准可能放大采样长度策略的影响'],
    tone: 'cyan',
  },
  {
    id: 'vae-training',
    phase: 'Representation',
    index: '02',
    title: '训练 TextVAE',
    short: 'TextVAE',
    objective: '学习离散 token 与连续潜变量之间的一对一映射，使文本能够进入潜扩散框架。',
    inputs: ['token 序列 x', 'Qwen3 tokenizer', '随机截断的训练序列'],
    operations: ['Transformer 编码器预测高斯均值与方差', '重参数化采样得到 latent z', '非自回归解码器并行重建 token', '优化 CE + KL + REPA 复合目标'],
    outputs: ['TextVAE encoder', 'TextVAE decoder', '连续文本潜表示'],
    evidence: 'Figure 3、Equation 1-3',
    note: 'VAE 训练 200K steps，使用 AdamW、学习率 1e-4；KL 权重采用 warmup。',
    explanation: 'TextVAE 不是普通压缩器，而是为扩散模型提供可采样的连续条件空间。编码器、KL 正则和非自回归解码器共同决定潜空间是否平滑、可重建。',
    watchpoints: ['验证重建精度不能只看训练集', 'KL 权重过大会损失可辨识语义', '潜变量通道维度会影响扩散冗余与信息容量'],
    tone: 'cyan',
  },
  {
    id: 'repa-alignment',
    phase: 'Alignment',
    index: '03',
    title: '执行 REPA 表示对齐',
    short: 'REPA',
    objective: '让重建有效的潜空间同时具备适合条件去噪的语义几何。',
    inputs: ['TextVAE 编码器中间表示', '冻结的 Qwen3-1.7B 隐藏状态'],
    operations: ['计算逐位置余弦相似度', '对语言模型表示施加 stop-gradient', '默认对齐倒数第三层', '按 λ=1 加入 VAE 总损失'],
    outputs: ['REPA 增强的 TextVAE encoder', '更有结构的连续潜空间'],
    evidence: 'Equation 2、Table 2a、Table 3',
    note: 'REPA 的端到端增益远超 VAE 参数量变化；重建精度接近，但 WikiSource MAUVE 从 2.5 提升到 20.4。',
    explanation: 'REPA 将优化目标从 token 重建扩展到潜空间的语义结构。冻结教师只提供对齐目标，不直接生成文本，因此应把 REPA 理解为潜空间正则项。',
    watchpoints: ['比较 REPA 时必须控制重建精度', '对齐层可能同时影响语义保持与生成多样性', '教师模型能力会形成表示上限假设'],
    tone: 'violet',
  },
  {
    id: 'dit-training',
    phase: 'Generation',
    index: '04',
    title: '训练 TextDiT',
    short: 'Flow Matching',
    objective: '冻结 TextVAE 后，在连续潜空间中学习条件速度场，生成完整 target 潜序列。',
    inputs: ['干净 context latent', '高斯噪声', 'target latent'],
    operations: ['context 与 target 分别编码，防止信息泄漏', '构造线性插值状态 z_t', '优化 Conditional Flow Matching 损失', '时间步采用 logit-normal std=1.5', '以 10% 概率丢弃 context 以支持 CFG'],
    outputs: ['TextDiT 114M / 328M / 768M checkpoints', '条件速度场模型'],
    evidence: 'Figure 3、Equation 4-6',
    note: '消融模型训练 1M steps，主结果训练 2M steps；训练使用 8 张 H200，DiT 约需 2 天。',
    explanation: 'TextDiT 学习的是潜空间中的条件速度场。context 与 target 分开编码，Flow Matching 建模噪声到目标潜变量的路径，CFG 在推理阶段控制条件强度。',
    watchpoints: ['context 与 target 分开编码是防信息泄漏的关键', '时间步分布会改变训练信号密度', 'CFG dropout 需要与推理 guidance 策略一致'],
    tone: 'violet',
  },
  {
    id: 'inference',
    phase: 'Sampling',
    index: '05',
    title: '执行条件扩散推理',
    short: 'Euler Sampling',
    objective: '从高斯噪声出发，在冻结潜空间中生成目标文本段，并解码为 token。',
    inputs: ['condition prefix', '训练完成的 TextDiT', '冻结的 TextVAE decoder'],
    operations: ['编码 prompt 得到 context latent', '采样 target 噪声', '使用 50 步 Euler ODE solver', '以 CFG scale 7 融合条件与无条件速度', '并行解码完整 latent 序列'],
    outputs: ['生成续写文本', '每步去噪潜变量轨迹'],
    evidence: 'Algorithm 1、Table 4',
    note: '推理不进行 token 级自回归；NFE 由采样步数决定，但这不等同于总 FLOPs 或墙钟时间恒定。',
    explanation: '每个采样步都对整段 target latent 进行预测，因此 NFE 与目标长度解耦。随着采样步数增加，文本通常更稳定，但采样器近似误差仍会影响结果。',
    watchpoints: ['50 步是主结果设置，不应默认 10 步等效', 'CFG 会额外增加条件与非条件速度计算', 'NFE 曲线不能替代端到端时延统计'],
    tone: 'amber',
  },
  {
    id: 'evaluation',
    phase: 'Evaluation',
    index: '06',
    title: '多基准评测与基线对比',
    short: 'Evaluation',
    objective: '在同一续写协议下比较扩散模型与自回归基线，并检查指标结论是否一致。',
    inputs: ['四个评测集的 prompt-target 样本', 'TextLDM 生成结果', 'GPT-2、SSD-LM、Block Diffusion 基线'],
    operations: ['计算 ROUGE-1、ROUGE-2、ROUGE-L', '计算 BERTScore 与 MAUVE', '在 114M、328M、768M 间检查扩展趋势', '比较训练动态与 NFE 曲线'],
    outputs: ['Table 1 主结果', 'Figure 2 效率对比', 'Figure 4 训练动态'],
    evidence: 'Table 1、Figure 2、Figure 4',
    note: '768M 模型在多数指标上超过 GPT-2 Large，但部分 BERTScore 与 MAUVE 比较仍存在指标差异。',
    explanation: '评测需要同时看字面重叠、语义相似和分布多样性。ROUGE 衡量重叠，BERTScore 关注语义，MAUVE 检测生成分布与人类文本的距离，三者不能互相替代。',
    watchpoints: ['不能只选择对本文有利的指标汇报', '基线的参数、tokenizer 和训练语料需对齐', 'BERTScore 与 MAUVE 的采样方差应被报告'],
    tone: 'green',
  },
  {
    id: 'ablation',
    phase: 'Analysis',
    index: '07',
    title: '消融与证据归因',
    short: 'Ablation',
    objective: '检查性能提升来自 REPA、潜空间维度、规模还是时间步与 CFG 设置。',
    inputs: ['独立训练的 VAE / DiT 配置', '重建精度与生成指标'],
    operations: ['对比有无 REPA', '变化 VAE 规模和 latent channel', '替换 REPA 对齐层', '改变 DiT 规模与时间步调度', '扫描 CFG scale 并检查 CFG=8 退化'],
    outputs: ['Table 2 生成消融', 'Table 3 重建精度', 'Table 4 CFG 敏感性'],
    evidence: 'Table 2-4、Section 4.3',
    note: '重建精度差异小于 0.05%，但下游生成质量显著不同，支持“表示有效性而非重建保真度是瓶颈”的诊断。',
    explanation: '消融应一次只改变一个主要变量。VAE 规模、latent channel、REPA 层、DiT 规模、时间步调度和 CFG 各自回答不同问题，不能把总增益归因于单一模块。',
    watchpoints: ['不同消融组的默认 latent channel 并不完全一致', '1M 与 2M steps 的规模对比需要注明训练预算', '生成质量提升要回连到重建和表示指标'],
    tone: 'green',
  },
]
export type DenoisingSnapshot = {
  step: number
  text: string | null
  label: string
  coherence: string
  factual: string
  diagnosis: string
}

export const denoisingExample = {
  source: 'Appendix D · Table 7',
  prompt: '...the position of Professor of History at the University of Denver, where he remained until his retirement in 1995. At the University of Denver During his time at the University of Denver, Roeder was instrumental in both curriculum development and research program coordination. He served as chair of the History Department during 1985–1986, when the Core Curriculum program was implemented',
  note: '论文只报告 Step 10/20/30/40/50 的文本快照，因此滑块严格吸附到这些步数；Step 0 仅表示尚未开始解码。',
  snapshots: [
    {
      step: 0,
      text: null,
      label: '噪声初始化',
      coherence: '尚未解码',
      factual: '无法判断',
      diagnosis: '潜在空间仍是随机噪声，论文没有提供 Step 0 的 decode 文本。',
    },
    {
      step: 10,
      text: 'seemIm richser university Pre set here left - 7 more by distinguly - take edition operated recently he me and reasoned3 Experimental “ Henry changing Foundation and - story7 two and and Operating is Oh. during explicitly he taught traditionally programming professor Acad and ranks sailed Technical Professor Modern Professor Scientific studied: found Professor Technical Political Professor in Modern Professor Political Philosophy Judicial Literature taught in History, History of Philosophy [...]',
      label: '高噪声语义碎片',
      coherence: '低',
      factual: '不可核验',
      diagnosis: '专名、职位和机构频繁跳变，句子边界不稳定，语义仍接近词块噪声。',
    },
    {
      step: 20,
      text: '. Roeder served a second teaching fellowship later, until 1978. He left Denver, later taking over to the position of Assistant Professor of History at Harvard, where he was instrumental in that process. Roeder was ordained at the University of Chicago, in 1982. His first job was teaching at Harvard University. Hereturnedtohistory,CollegeofPhilosophy,theUniversityofHistory,andlaterreturned to Harvard University, where he earned his.D. Profites from the North and International Studies. [...] He also held a teaching fellowship in history during the Allied II Salvennial of 1933–1986. He then returned to Harvard with history and literature, and a bachelor’s thesis on the history of History. [...]',
      label: '句法开始成形',
      coherence: '中低',
      factual: '明显漂移',
      diagnosis: '局部词语粘连开始消失，但人物经历、年份和机构关系仍然矛盾。',
    },
    {
      step: 30,
      text: '. Roeder served a further teaching fellowship until Chicago in 1978. He left that same year in Denver to take the position of Professor in History at Harvard, where he was instrumental in that process. Roeder was elected from the College of William and Mary in1982. His second job was teaching at Harvard University. He returned to history, College of Philosophy, the University of Chicago, and his time at Harvard University, where he earned his.D. in History. [...] Roeder held a teaching fellowship during the Counter-Ilennial in 1933–1986. He then returned to Harvard with a teaching fellowship, with a bachelor’s thesis at the University of Denver. [...]',
      label: '局部结构稳定',
      coherence: '中',
      factual: '仍不可靠',
      diagnosis: '段落级结构更完整，但同一批实体被继续重排，事实关系尚未收敛。',
    },
    {
      step: 40,
      text: '. Roeder held a second teaching fellowship after Chicago in 1968. He left that same time at Denver to take the position of Professor of History at Harvard, where he was instrumental in that process. Roeder was graduated from the College of William and Mary in1982 with a teaching fellowship in philosophy from Harvard University. He returned to history, College of History, the University of Chicago, and the University of Texas again, where he earned his Dr. of History from the University of Chicago. [...] Roeder held a teaching fellowship during the Counter-colonial in 19331996. He then returned to Harvard with a teaching fellowship, with a bachelor’s thesis at the University of Denver. [...]',
      label: '连贯性明显改善',
      coherence: '中高',
      factual: '仍含错误',
      diagnosis: '句子衔接和重复模式改善，但年份、学位及机构叙事依然出现冲突。',
    },
    {
      step: 50,
      text: '. Roeder held a second teaching fellowship at Chicago in 1968. He left that same time at Denver to take the position of Professor of History at Harvard, where he was instrumental in curriculum coordination. Roeder was elected from the University of Chicago, in 1982 with a teaching fellowship in history from Harvard University. He returned to history, College of History, the University of Chicago, and the University of Texas, where he then earned his Dr. of History at the University of Denver. [...] Roeder held a teaching fellowship during the Counter-colonial from 1933 until 1954. He returned to Harvard with a teaching fellowship, with a bachelor’s thesis on the history of Denver. [...]',
      label: '更通顺但仍未完全真实',
      coherence: '高',
      factual: '需核查',
      diagnosis: '文本更流畅、实体关系更稳定，但该样例仍有事实错误；通顺不等于事实正确。',
    },
  ] satisfies DenoisingSnapshot[],
}
export const metricMeta: Record<MetricKey, { label: string; full: string }> = {
  r1: { label: 'R-1', full: 'ROUGE-1' },
  r2: { label: 'R-2', full: 'ROUGE-2' },
  rl: { label: 'R-L', full: 'ROUGE-L' },
  bert: { label: 'BS', full: 'BERTScore' },
  mauve: { label: 'MAU', full: 'MAUVE' },
}

export const datasets: DatasetResult[] = [
  {
    id: 'wikisource',
    name: 'WikiSource',
    note: '长篇、开放域、与训练域差异较大',
    models: [
      { name: 'TextLDM 768M', shortName: 'TextLDM 768M', family: 'textldm', values: { r1: 37.5, r2: 16.5, rl: 25.7, bert: 84.3, mauve: 32.7 } },
      { name: 'TextLDM 328M', shortName: 'TextLDM 328M', family: 'textldm', values: { r1: 33.1, r2: 6.8, rl: 16.9, bert: 80.7, mauve: 27.6 } },
      { name: 'GPT-2 Large 774M', shortName: 'GPT-2 Large', family: 'autoregressive', values: { r1: 33.7, r2: 8.4, rl: 19.5, bert: 82.2, mauve: 38.3 } },
      { name: 'Block Diffusion 170M', shortName: 'Block Diff. bs=16', family: 'diffusion', values: { r1: 30.9, r2: 5.6, rl: 16.0, bert: 81.4, mauve: 39.6 } },
    ],
  },
  {
    id: 'wikipedia',
    name: 'Wikipedia',
    note: '百科文本，考察跨领域泛化',
    models: [
      { name: 'TextLDM 768M', shortName: 'TextLDM 768M', family: 'textldm', values: { r1: 38.9, r2: 8.1, rl: 17.6, bert: 82.7, mauve: 10.1 } },
      { name: 'TextLDM 328M', shortName: 'TextLDM 328M', family: 'textldm', values: { r1: 27.6, r2: 6.2, rl: 16.2, bert: 81.3, mauve: 10.5 } },
      { name: 'GPT-2 Large 774M', shortName: 'GPT-2 Large', family: 'autoregressive', values: { r1: 25.1, r2: 5.7, rl: 16.1, bert: 82.2, mauve: 8.0 } },
      { name: 'Block Diffusion 170M', shortName: 'Block Diff. bs=16', family: 'diffusion', values: { r1: 23.9, r2: 4.2, rl: 13.8, bert: 81.6, mauve: 7.23 } },
    ],
  },
  {
    id: 'tinystories',
    name: 'TinyStories',
    note: '较短、主题较简单、分布更接近训练数据',
    models: [
      { name: 'TextLDM 768M', shortName: 'TextLDM 768M', family: 'textldm', values: { r1: 39.7, r2: 10.4, rl: 23.4, bert: 85.8, mauve: 1.51 } },
      { name: 'TextLDM 328M', shortName: 'TextLDM 328M', family: 'textldm', values: { r1: 37.1, r2: 8.3, rl: 21.1, bert: 85.2, mauve: 1.13 } },
      { name: 'GPT-2 Large 774M', shortName: 'GPT-2 Large', family: 'autoregressive', values: { r1: 34.7, r2: 7.5, rl: 20.8, bert: 86.3, mauve: 1.47 } },
      { name: 'Block Diffusion 170M', shortName: 'Block Diff. bs=16', family: 'diffusion', values: { r1: 31.8, r2: 5.3, rl: 18.0, bert: 85.1, mauve: 1.20 } },
    ],
  },
  {
    id: 'onebillionwords',
    name: 'One Billion Words',
    note: '短句较多，相对简单且接近域内',
    models: [
      { name: 'TextLDM 768M', shortName: 'TextLDM 768M', family: 'textldm', values: { r1: 21.4, r2: 3.6, rl: 17.4, bert: 85.0, mauve: 0.80 } },
      { name: 'TextLDM 328M', shortName: 'TextLDM 328M', family: 'textldm', values: { r1: 10.8, r2: 0.88, rl: 9.8, bert: 83.4, mauve: 0.79 } },
      { name: 'GPT-2 Large 774M', shortName: 'GPT-2 Large', family: 'autoregressive', values: { r1: 15.8, r2: 2.9, rl: 14.6, bert: 84.3, mauve: 0.53 } },
      { name: 'Block Diffusion 170M', shortName: 'Block Diff. bs=16', family: 'diffusion', values: { r1: 10.9, r2: 0.6, rl: 9.4, bert: 83.1, mauve: 0.50 } },
    ],
  },
]

export const evidenceItems: EvidenceItem[] = [
  {
    id: 'C1',
    claim: '视觉潜扩散配方可以迁移到文本续写',
    evidence: ['Figure 3', 'Table 1', 'Table 2'],
    status: 'supported',
    scope: 'OpenWebText2 训练，四个文本续写基准，相近规模比较',
    insight: 'VAE + DiT + Flow Matching + CFG 的组合在语言任务中可运行并具有竞争力。',
  },
  {
    id: 'C2',
    claim: '重建精度不是生成质量的主要瓶颈',
    evidence: ['Table 2a', 'Table 3'],
    status: 'supported',
    scope: 'VAE 配置消融与 token-level 重建精度',
    insight: '不同配置重建差异小于 0.05%，但下游 ROUGE 与 MAUVE 差异显著。',
  },
  {
    id: 'C3',
    claim: 'REPA 显著改善连续潜空间生成能力',
    evidence: ['Table 2a', 'Table 3'],
    status: 'supported',
    scope: '冻结 Qwen3-1.7B 教师，倒数第三层对齐',
    insight: 'WikiSource MAUVE 从 2.5 提升到 20.4，而重建精度基本不变。',
  },
  {
    id: 'C4',
    claim: '模型规模扩大带来稳定性能提升',
    evidence: ['Table 2e', 'Figure 4'],
    status: 'partial',
    scope: 'DiT 114M 至 768M；部分规模比较使用相同训练步数',
    insight: '扩展趋势明确，但训练计算、参数量与基线并非完全匹配。',
  },
  {
    id: 'C5',
    claim: 'TextLDM 具有长度不变的推理效率',
    evidence: ['Figure 2'],
    status: 'partial',
    scope: '函数评估次数 NFE，而非 FLOPs 或墙钟时间',
    insight: '去噪步数不随长度增长，但每步仍需处理完整目标序列，不能等同于总成本恒定。',
  },
  {
    id: 'C6',
    claim: '该框架通向统一多模态生成与理解',
    evidence: ['Conclusion', 'Appendix C'],
    status: 'unsupported',
    scope: '未来工作与研究愿景',
    insight: '当前实验只验证文本生成，没有多模态生成、理解或推理评测。',
  },
]

export const goalLayers = [
  {
    id: 'established',
    label: '已经建立',
    title: '文本续写中的范式迁移',
    items: ['连续文本潜空间可训练', 'DiT 可执行文本条件生成', 'REPA 改善下游生成质量', '模型规模带来收益'],
    tone: 'green',
  },
  {
    id: 'partial',
    label: '部分成立',
    title: '效率与可比性仍需限定',
    items: ['NFE 不随长度增长', '训练动态可比', '跨域表现存在指标差异', '强依赖 REPA 教师表示'],
    tone: 'amber',
  },
  {
    id: 'future',
    label: '尚未证明',
    title: '更大范围的统一模型叙事',
    items: ['通用语言理解与推理', '完整墙钟效率优势', '统一视觉语言架构', '端到端多模态生成'],
    tone: 'rose',
  },
]

export const verificationItems = [
  {
    status: 'VERIFIED',
    title: '论文内容核验',
    text: '已对 15 页正文、附录、Figure 1-4、Table 1-4 与定性示例做文本和视觉核验。',
  },
  {
    status: 'UNVERIFIED',
    title: '独立复现',
    text: '未核验代码、checkpoint、随机种子、完整训练日志或第三方复现结果。',
  },
  {
    status: 'UNVERIFIED',
    title: '真实效率',
    text: 'NFE 优势不能直接推出 FLOPs、吞吐量、显存或墙钟时间优势。',
  },
  {
    status: 'AUTHOR_INPUT_NEEDED',
    title: '严格复现所需材料',
    text: '需要作者提供数据脚本、训练配置、权重、评测脚本和主结果/消融配置说明。',
  },
]




