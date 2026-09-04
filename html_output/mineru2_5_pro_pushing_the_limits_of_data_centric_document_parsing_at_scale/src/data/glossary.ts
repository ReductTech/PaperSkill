export type GlossaryCategory = '基础概念' | '数据工程' | '标注与分诊' | '训练策略' | '评测方法';

export interface GlossarySource {
  readonly label: string;
  readonly href: string;
}

export interface GlossaryEntry {
  /** Stable fragment id used by <Term /> and #glossary/<id>. */
  readonly id: string;
  /** Primary learner-facing label. */
  readonly term: string;
  /** Full English name when the acronym is otherwise opaque. */
  readonly english?: string;
  readonly aliases?: readonly string[];
  readonly category: GlossaryCategory;
  /** One-line answer shown first in the popover and search results. */
  readonly summary: string;
  /** Plain-language explanation without assumed machine-learning background. */
  readonly explanation: string;
  /** Paper-specific example or consequence. */
  readonly example?: string;
  /** Important boundary that prevents a common misunderstanding. */
  readonly caution?: string;
  /** Related glossary entry ids. */
  readonly related?: readonly string[];
  readonly sources: readonly GlossarySource[];
}

const PAPER = 'https://arxiv.org/html/2604.04771v2';

export const GLOSSARY: readonly GlossaryEntry[] = [
  {
    id: 'document-parsing',
    term: '文档解析',
    english: 'Document Parsing',
    aliases: ['文档理解', 'PDF 解析'],
    category: '基础概念',
    summary: '把 PDF 或页面图像转换成可编辑、可检索的结构化内容。',
    explanation:
      '它不只识别字，还要判断版面区域、阅读顺序、公式、表格等结构，并输出 Markdown、LaTeX、HTML 或坐标框等机器可读结果。',
    example: '一页论文可以被拆成标题、正文、公式和表格，并保留它们原本的顺序与结构。',
    caution: '文档解析比单纯 OCR 更宽：文字识别只是其中一个子任务。',
    related: ['vlm', 'structured-output', 'gt'],
    sources: [{ label: '论文引言：文档解析的定义', href: `${PAPER}#S1` }],
  },
  {
    id: 'gt',
    term: '真值标注',
    english: 'Ground Truth（GT）',
    aliases: ['GT', '参考答案', '金标准'],
    category: '基础概念',
    summary: '用来训练或评分的可信参考答案。',
    explanation:
      '在评测中，模型输出要和 GT 比较；在监督训练中，GT 告诉模型理想输出是什么。高质量 GT 通常需要严格规则、人工复核或交叉验证。',
    example: 'OmniDocBench Hard 子集由专业团队标注并交叉复核，作为评测参考。',
    caution: '多个模型意见一致可以提供可信信号，但“共识”本身不等于已经获得 GT。',
    related: ['pseudo-label', 'cmcv', 'held-out'],
    sources: [
      { label: '论文 §3.2：无真值时的难度判断', href: `${PAPER}#S3.SS2` },
      { label: '论文 §5.3：Hard 子集标注', href: `${PAPER}#S5.SS3` },
    ],
  },
  {
    id: 'vlm',
    term: '视觉语言模型',
    english: 'Vision-Language Model（VLM）',
    aliases: ['VLM', '多模态模型'],
    category: '基础概念',
    summary: '同时处理图像与文字，并在两种信息之间建立联系的模型。',
    explanation:
      '在文档解析中，VLM 看到页面像素，再生成文字、标记语言或坐标等输出。它能把版面视觉线索与语言内容放在同一个任务中处理。',
    example: 'MinerU2.5-Pro 使用视觉编码器读取页面，再由语言模型生成解析结果。',
    caution: '参数更多不自动保证文档解析更好；训练数据覆盖和标注质量同样关键。',
    related: ['document-parsing', 'structured-output', 'embedding'],
    sources: [{ label: '论文 §2.1：VLM 文档解析方法', href: `${PAPER}#S2.SS1` }],
  },
  {
    id: 'structured-output',
    term: '结构化输出',
    english: 'Structured Output',
    aliases: ['结构序列', '标记语言输出'],
    category: '基础概念',
    summary: '不仅给出内容，还用明确格式表达内容之间的结构关系。',
    explanation:
      '常见形式包括 Markdown 段落、LaTeX 公式、HTML 表格和带类别的坐标框。下游程序可以继续检索、渲染或分析这些结果。',
    example: '同一张表格若只输出纯文本，会丢失行列关系；输出 HTML 才能保留表格结构。',
    caution: '语法合法不代表结构正确；错误 LaTeX 或 HTML 可能只有渲染后才明显。',
    related: ['document-parsing', 'judge-refine', 'edit-distance'],
    sources: [
      { label: '论文 §2.1：图像到标记语言', href: `${PAPER}#S2.SS1` },
      { label: '论文附录：任务输出格式', href: `${PAPER}#S8` },
    ],
  },
  {
    id: 'embedding',
    term: '向量表征',
    english: 'Embedding',
    aliases: ['嵌入', '特征向量', 'Embedding'],
    category: '数据工程',
    summary: '把一页文档或一个元素压缩成一组可比较的数字。',
    explanation:
      '视觉上相似的页面通常会得到较接近的向量，随后可以用距离和聚类发现重复模式与稀有版式。',
    example: '论文在页级 DDAS 中用 ViT-base 把页面表示为 512 维特征。',
    caution: '向量中的每一维通常没有直观的人类含义，位置示意图也不代表真实二维坐标。',
    related: ['k-means', 'ddas', 'long-tail'],
    sources: [{ label: '论文 §3.1：512 维页面表征', href: `${PAPER}#S3.SS1` }],
  },
  {
    id: 'k-means',
    term: 'K-Means 聚类',
    english: 'K-Means Clustering',
    aliases: ['K 均值', '聚类'],
    category: '数据工程',
    summary: '按向量距离把相似样本自动分成 K 个簇。',
    explanation:
      '算法反复更新每个簇的中心，并把样本分配给最近的中心。这里的作用是发现不同版式群，而不是直接判断样本是否正确。',
    example: 'DDAS 先聚类页面，再结合每个簇里的难度分布调整采样权重。',
    caution: '论文说明使用 K-Means，但没有披露 K 的具体取值。',
    related: ['embedding', 'long-tail', 'ddas'],
    sources: [{ label: '论文 §3.1：页级聚类与采样', href: `${PAPER}#S3.SS1` }],
  },
  {
    id: 'long-tail',
    term: '长尾分布',
    english: 'Long-Tail Distribution',
    aliases: ['长尾数据', '稀有场景'],
    category: '数据工程',
    summary: '少数常见类型很多，许多稀有类型各自只有少量样本。',
    explanation:
      '若直接按原始频率采样，普通单栏页面会反复出现，而复杂嵌套表格、密集公式和非常规版式难以被模型充分看到。',
    example: 'DDAS 会降低大簇权重、提高小簇权重，以缓解训练数据中的长尾偏差。',
    caution: '“稀有”不等于“困难”，因此论文还加入了独立的难度信号。',
    related: ['embedding', 'k-means', 'ddas'],
    sources: [{ label: '论文 §3.1：文档数据的长尾问题', href: `${PAPER}#S3.SS1` }],
  },
  {
    id: 'pseudo-label',
    term: '伪标签',
    english: 'Pseudo-Label',
    aliases: ['自动标签', '模型标注'],
    category: '标注与分诊',
    summary: '由模型自动生成、暂时代替人工真值的训练标签。',
    explanation:
      '它能快速扩展训练数据，但可靠程度取决于生成和验证流程。MinerU2.5-Pro 用跨模型一致性来选择更可信的伪标签。',
    example: '在 Medium 样本上，两个外部模型的一致输出可作为目标模型的伪标签。',
    caution: '伪标签可能把模型共同的错误带入训练，所以 Hard 样本不能直接采用模型输出。',
    related: ['gt', 'cmcv', 'medium'],
    sources: [{ label: '论文 §3.2：外部模型共识伪标签', href: `${PAPER}#S3.SS2` }],
  },
  {
    id: 'ddas',
    term: 'DDAS',
    english: 'Diversity-and-Difficulty-Aware Sampling',
    aliases: ['多样性与难度感知采样'],
    category: '数据工程',
    summary: '同时考虑“是否覆盖不同类型”和“是否提供有效难度”的采样方法。',
    explanation:
      'DDAS 在页级和元素级分别聚类，再结合 CMCV 难度调整权重，使训练集不被高频普通样本淹没，并保留更有学习价值的样本。',
    example: '页级处理整页版式；元素级再分别处理文本、公式和表格。',
    caution: 'DDAS 不是一个固定采样比例；论文没有披露 K、阈值或全部权重。',
    related: ['embedding', 'k-means', 'long-tail', 'cmcv'],
    sources: [{ label: '论文 §3.1：DDAS', href: `${PAPER}#S3.SS1` }],
  },
  {
    id: 'cmcv',
    term: 'CMCV',
    english: 'Cross-Model Consistency Verification',
    aliases: ['跨模型一致性验证', '跨模型交叉验证'],
    category: '标注与分诊',
    summary: '比较三个异构模型的输出关系，在没有 GT 时估计样本难度和标注去向。',
    explanation:
      '它不做简单多数投票，而是以目标模型相对两个外部模型的一致或分歧关系，把样本分为 Easy、Medium 和 Hard。',
    example: '文本用编辑距离、公式用 CDM、表格用 TEDS 判断模型输出是否足够一致。',
    caution: '一致性是路由证据，不是数学意义上的正确性证明；论文也没有公开数值阈值。',
    related: ['easy', 'medium', 'hard', 'pseudo-label'],
    sources: [{ label: '论文 §3.2：CMCV', href: `${PAPER}#S3.SS2` }],
  },
  {
    id: 'easy',
    term: 'Easy 样本',
    aliases: ['简单样本', 'Easy'],
    category: '标注与分诊',
    summary: '目标模型与至少一个外部模型高度一致的样本。',
    explanation:
      '这种一致关系说明结果通常较可靠，可以直接取得模型输出作为自动标注，并用于大规模基础能力训练。',
    example: 'MinerU2.5 与 PaddleOCR-VL 一致，即使第三个模型不同，也会落入 Easy。',
    caution: 'Easy 表示按任务指标高度一致，不代表页面对人类一定简单。',
    related: ['cmcv', 'medium', 'hard', 'pseudo-label'],
    sources: [{ label: '论文 §3.2：Easy 定义', href: `${PAPER}#S3.SS2` }],
  },
  {
    id: 'medium',
    term: 'Medium 样本',
    aliases: ['中等难度样本', 'Medium'],
    category: '标注与分诊',
    summary: '两个外部模型彼此一致，但目标模型与它们明显不同的样本。',
    explanation:
      '它精确暴露目标模型相对同类模型的能力缺口，同时外部共识还能提供可用的自动标注，因此训练价值很高。',
    example: '论文优先提高 Medium 样本在 DDAS 中的比例，但不同子任务的最佳比例不同。',
    caution: '外部共识仍可能相关地出错，不能把“两个模型一致”解释成绝对真值。',
    related: ['cmcv', 'easy', 'hard', 'pseudo-label'],
    sources: [{ label: '论文 §3.2：Medium 定义与价值', href: `${PAPER}#S3.SS2` }],
  },
  {
    id: 'hard',
    term: 'Hard 样本',
    aliases: ['困难样本', 'Hard'],
    category: '标注与分诊',
    summary: '三个模型两两明显分歧，无法从共识中取得可靠标注的样本。',
    explanation:
      '它们最可能推动能力突破，却也最容易产生错误标签，所以必须先经过自动修正或专家标注才能安全训练。',
    example: '复杂嵌套表格、密集多行公式和非常规版式常出现在 Hard 场景中。',
    caution: 'Hard 训练样本与 Held-out 的 Hard 测试样本不是同一批数据。',
    related: ['cmcv', 'judge-refine', 'held-out'],
    sources: [
      { label: '论文 §3.2：Hard 定义', href: `${PAPER}#S3.SS2` },
      { label: '论文 §5.3：Hard 测试子集', href: `${PAPER}#S5.SS3` },
    ],
  },
  {
    id: 'judge-refine',
    term: 'Judge-and-Refine',
    english: '判断并修正',
    aliases: ['Render-then-Verify', '渲染后验证'],
    category: '标注与分诊',
    summary: '把结构化结果渲染成图像，对照原图定位错误，再做有针对性的修正。',
    explanation:
      'LaTeX 或 HTML 在文本层面可能看似合法，渲染后却出现错位或结构坍塌。视觉对比把隐蔽错误放大，帮助模型进行多轮定位与局部修正。',
    example: '论文使用独立于 CMCV 模型池的 Qwen3-VL-235B 执行自动判断与修正，残留失败再交专家。',
    caution: '论文没有披露自动修复成功率；不能把示意动画当成实际成功比例。',
    related: ['structured-output', 'hard', 'gt'],
    sources: [{ label: '论文 §3.3：Judge-and-Refine', href: `${PAPER}#S3.SS3` }],
  },
  {
    id: 'sft',
    term: '监督微调',
    english: 'Supervised Fine-Tuning（SFT）',
    aliases: ['SFT', '监督训练'],
    category: '训练策略',
    summary: '让模型根据输入和参考答案学习生成正确输出。',
    explanation:
      '训练会比较模型生成与标签之间的差异，再更新参数。论文前两阶段都利用带标签数据：先建立广覆盖能力，再针对高质量困难样本加强。',
    example: 'Stage 1 使用大规模 Easy/Medium 自动标注数据，Stage 2 加入专家标注的 Hard 数据。',
    caution: 'SFT 的逐 token 损失不直接等同于整段结构的最终评测指标，因此论文还有 GRPO 阶段。',
    related: ['replay', 'grpo', 'gt'],
    sources: [{ label: '论文 §4：三阶段训练策略', href: `${PAPER}#S4` }],
  },
  {
    id: 'replay',
    term: '回放数据',
    english: 'Replay',
    aliases: ['经验回放', '旧数据回放', 'Replay'],
    category: '训练策略',
    summary: '训练新难例时，混入一部分旧阶段数据来保持已有能力。',
    explanation:
      '如果 Stage 2 只看少量 Hard 数据，模型可能在普通页面上退步。Replay 让模型复习原有分布，降低灾难性遗忘。',
    example: '论文按布局、文本、公式、表格等子任务使用不同的 Hard 与 Replay 混合比例。',
    caution: 'Replay 不是简单复制全部旧数据；比例会影响难例专修与泛化保持之间的平衡。',
    related: ['sft', 'hard', 'grpo'],
    sources: [{ label: '论文 §4.2：Hard 与 Replay 混合', href: `${PAPER}#S4.SS2` }],
  },
  {
    id: 'grpo',
    term: 'GRPO',
    english: 'Group Relative Policy Optimization',
    aliases: ['组相对策略优化'],
    category: '训练策略',
    summary: '对同一输入采样一组候选，用组内相对奖励指导模型更新。',
    explanation:
      '候选先按任务指标得到奖励，再比较它们相对组内平均水平的好坏。这样可以直接优化序列或结构层面的目标，而不需要单独训练奖励模型。',
    example: '论文每个样本采样 16 个 rollout，并分别使用文本、公式、表格和布局指标奖励。',
    caution: '奖励来自评测指标，指标提升不等于模型获得了完整的文档语义理解。',
    related: ['rollout', 'edit-distance', 'cdm', 'teds', 'iou'],
    sources: [{ label: '论文 §4.3：GRPO', href: `${PAPER}#S4.SS3` }],
  },
  {
    id: 'rollout',
    term: 'Rollout',
    aliases: ['采样候选', '生成轨迹'],
    category: '训练策略',
    summary: '模型针对同一个输入实际采样出的一份完整候选输出。',
    explanation:
      '由于生成过程带有采样，同一文档可以得到多份略有不同的结构化结果。GRPO 比较同组 rollout 的奖励，判断哪些生成选择更好。',
    example: 'G=16 表示每个训练样本生成 16 份候选用于组内比较。',
    caution: 'Rollout 数量是候选数，不是训练阶段数，也不是文档页数。',
    related: ['grpo', 'structured-output'],
    sources: [{ label: '论文 §4.3：每样本 16 个 rollout', href: `${PAPER}#S4.SS3` }],
  },
  {
    id: 'edit-distance',
    term: '编辑距离',
    english: 'Edit Distance',
    aliases: ['Levenshtein 距离', '文本距离', 'Edit Distance'],
    category: '评测方法',
    summary: '把一个字符串变成另一个字符串所需的最少编辑次数。',
    explanation:
      '常见编辑包括插入、删除和替换字符。文本识别结果越接近参考答案，归一化编辑距离通常越小。',
    example: 'CMCV 用它比较多个模型的文本输出，GRPO 也把文本指标转成奖励信号。',
    caution: '这是“越低越好”的距离指标；页面总分展示时可能会换算为更直观的得分方向。',
    related: ['cmcv', 'grpo', 'gt'],
    sources: [{ label: '论文 §2.3：文本评测指标', href: `${PAPER}#S2.SS3` }],
  },
  {
    id: 'cdm',
    term: 'CDM',
    english: 'Character Detection Matching',
    aliases: ['字符检测匹配', '公式识别指标'],
    category: '评测方法',
    summary: '通过渲染后的字符检测与匹配来评价公式识别结果。',
    explanation:
      '它比只比较 LaTeX 字符串更关注公式最终呈现的字符与位置，能减轻不同合法写法造成的不合理惩罚。',
    example: '论文用 CDM 判断公式输出的一致性，并把它作为 GRPO 的公式奖励。',
    caution: 'CDM 更关注视觉字符匹配，但仍不能覆盖所有数学语义等价关系。',
    related: ['structured-output', 'cmcv', 'grpo'],
    sources: [{ label: '论文 §2.3：公式评测使用 CDM', href: `${PAPER}#S2.SS3` }],
  },
  {
    id: 'teds',
    term: 'TEDS',
    english: 'Tree Edit Distance-based Similarity',
    aliases: ['树编辑距离相似度', '表格结构指标'],
    category: '评测方法',
    summary: '把 HTML 表格看成树，比较其结构与内容的相似程度。',
    explanation:
      '它会同时考虑表格的行列层级、单元格关系和文字内容，分数越高通常表示预测表格越接近参考表格。',
    example: 'CMCV 用 TEDS 比较表格输出，GRPO 用它为表格候选提供奖励。',
    caution: 'TEDS 评价的是表格树结构相似度，不等同于整页文档解析质量。',
    related: ['structured-output', 'cmcv', 'grpo'],
    sources: [{ label: '论文 §2.3：表格评测使用 TEDS', href: `${PAPER}#S2.SS3` }],
  },
  {
    id: 'iou',
    term: '交并比',
    english: 'Intersection over Union（IoU）',
    aliases: ['IoU', '区域重叠率'],
    category: '评测方法',
    summary: '预测区域与真实区域的交集面积除以并集面积。',
    explanation:
      '两个框完全重合时 IoU 为 1，完全不相交时为 0。它常用来判断布局框的位置与范围是否准确。',
    example: '论文在 GRPO 的布局检测任务中使用类别 IoU 作为奖励信号。',
    caution: 'IoU 只衡量空间重叠，不判断框内文字、公式或表格内容是否正确。',
    related: ['grpo', 'gt', 'document-parsing'],
    sources: [{ label: '论文 §4.3：布局任务使用 IoU 奖励', href: `${PAPER}#S4.SS3` }],
  },
  {
    id: 'bipartite-matching',
    term: '二分图匹配',
    english: 'Bipartite Matching',
    aliases: ['一对一匹配', '元素匹配'],
    category: '评测方法',
    summary: '在预测元素和 GT 元素之间寻找整体代价最优的一对一配对。',
    explanation:
      '可以把两侧元素想成两组节点，边的代价表示内容或位置差异，再选择不冲突的最佳配对组合。',
    example: 'MGAM 的每个候选粒度最终都通过二分图匹配计算得分。',
    caution: '若预测和 GT 的分块粒度不同，固定的一对一匹配可能把内容正确的结果判得很低。',
    related: ['mgam', 'gt', 'structured-output'],
    sources: [{ label: '论文 §5.2：MGAM 的匹配阶段', href: `${PAPER}#S5.SS2` }],
  },
  {
    id: 'mgam',
    term: 'MGAM',
    english: 'Multi-Granularity Adaptive Matching',
    aliases: ['多粒度自适应匹配'],
    category: '评测方法',
    summary: '固定 GT，只调整预测侧的分块粒度，再选择得分最好的匹配方案。',
    explanation:
      '它依次尝试直接匹配、拆分预测块和枚举连续合并方案，缓解不同系统输出粒度不同造成的评分偏差。',
    example: '同一条多行公式即使被模型拆成多个连续块，也可先合并后再与单个 GT 块比较。',
    caution: 'MGAM 修正的是粒度和格式偏差，不负责判断两种表达是否在语义上等价。',
    related: ['bipartite-matching', 'gt', 'held-out'],
    sources: [{ label: '论文 §5.2：MGAM', href: `${PAPER}#S5.SS2` }],
  },
  {
    id: 'held-out',
    term: '隔离测试集',
    english: 'Held-out Test Set',
    aliases: ['Held-out', '留出测试集', '未见测试集'],
    category: '评测方法',
    summary: '在训练和调参过程中完全不让模型接触的评测数据。',
    explanation:
      '只有保持隔离，最终得分才能较可信地反映模型对新页面的泛化能力，而不是记忆或针对测试样本优化的结果。',
    example: 'OmniDocBench v1.6 的 296 页 Hard 子集被排除在 MinerU2.5-Pro 的所有训练阶段之外。',
    caution: '“来自 Hard 数据池”不等于参与训练；论文明确把最终测试页完整隔离。',
    related: ['gt', 'data-leakage', 'hard'],
    sources: [{ label: '论文 §5.3：Hard 子集完全训练隔离', href: `${PAPER}#S5.SS3` }],
  },
  {
    id: 'data-leakage',
    term: '数据泄漏',
    english: 'Data Leakage',
    aliases: ['测试集泄漏', '训练评测污染'],
    category: '评测方法',
    summary: '测试数据或其答案以直接或间接方式影响了训练、选择或调参。',
    explanation:
      '泄漏会让模型对测试集获得不应有的先验，导致分数高估真实泛化能力。教师标注、人工筛选和奖励设计都要检查是否接触了测试页。',
    example: '论文声明 Hard 测试子集不进入训练，也不进入 Judge-and-Refine 的训练数据。',
    caution: '仅仅把文件名分开不够；重复页面、派生版本和人工反馈链路也可能造成间接泄漏。',
    related: ['held-out', 'gt', 'hard'],
    sources: [{ label: '论文 §5.3：训练隔离声明', href: `${PAPER}#S5.SS3` }],
  },
  {
    id: 'ocr',
    term: 'OCR',
    english: 'Optical Character Recognition（光学字符识别）',
    aliases: ['文字识别', '光学字符识别'],
    category: '基础概念',
    summary: '把页面图像中的文字像素识别成字符序列。',
    explanation: 'OCR 主要回答“图里写了什么字”；完整文档解析还要恢复阅读顺序、公式、表格、版面类型和结构关系。',
    example: '同一页里，OCR 可以识别段落文字，但表格的行列关系和公式结构仍需要额外解析。',
    caution: 'OCR 准确并不代表整页结构已经解析正确。',
    related: ['document-parsing', 'structured-output', 'vlm'],
    sources: [{ label: '论文 §1：OCR 与文档解析任务背景', href: `${PAPER}#S1` }],
  },
  {
    id: 'rag',
    term: 'RAG',
    english: 'Retrieval-Augmented Generation（检索增强生成）',
    aliases: ['检索增强生成'],
    category: '基础概念',
    summary: '先从外部资料中检索相关内容，再让生成模型依据这些内容回答。',
    explanation: '文档需要先被可靠地解析、切分和索引，才能成为 RAG 可检索的知识来源；解析错误会沿数据链路传递到最终回答。',
    example: '表格数字如果在 PDF 转换时错列，检索虽然命中了页面，回答仍可能引用错误数值。',
    caution: 'RAG 改善知识接入，不会自动修复上游文档解析错误。',
    related: ['document-parsing', 'structured-output', 'ocr'],
    sources: [{ label: 'RAG 原始论文', href: 'https://arxiv.org/abs/2005.11401' }],
  },
  {
    id: 'vit',
    term: 'ViT',
    english: 'Vision Transformer',
    aliases: ['ViT-base', 'Vision Transformer'],
    category: '基础概念',
    summary: '把图像切成小块序列，再用 Transformer 提取视觉表征。',
    explanation: 'DDAS 使用 ViT-base 把整页编码成 512 维向量，让版式相近的页面在向量空间中更接近，便于后续聚类。',
    example: '多栏论文页和单栏票据页会形成不同视觉表征，即使两页都包含大量文字。',
    caution: '论文没有披露聚类 K 或完整采样权重，不能从 ViT 表征维度反推这些参数。',
    related: ['embedding', 'k-means', 'ddas'],
    sources: [
      { label: '论文 §3.1：页面表征', href: `${PAPER}#S3.SS1` },
      { label: 'ViT 原始论文', href: 'https://arxiv.org/abs/2010.11929' },
    ],
  },
  {
    id: 'data-engine',
    term: 'Data Engine',
    english: '数据引擎',
    aliases: ['数据引擎'],
    category: '数据工程',
    summary: '把数据选择、难度判断和标注修正连接起来的系统流程。',
    explanation: 'MinerU2.5-Pro 的 Data Engine 围绕覆盖度、信息量和标注准确性设计，由 DDAS、CMCV 与 Judge-and-Refine 等机制协同工作。',
    example: '页面先被 DDAS 筛选，再由 CMCV 分流；Hard 样本经过渲染复检或专家标注。',
    caution: '论文没有给出三个组件完全独立的消融，不能把全部增益归给其中任意一个。',
    related: ['ddas', 'cmcv', 'judge-refine'],
    sources: [{ label: '论文 §3：Data Engine', href: `${PAPER}#S3` }],
  },
  {
    id: 'omnidocbench',
    term: 'OmniDocBench',
    english: '文档解析综合评测基准',
    aliases: ['OmniDocBench v1.6', 'OmniDocBench v1.5'],
    category: '评测方法',
    summary: '覆盖文本、公式、表格和版面等元素的多样化 PDF 文档解析评测基准。',
    explanation: 'MinerU2.5-Pro 使用修正匹配偏差并新增 Hard 子集的 v1.6 协议，分别报告 Base、Hard 与 Full 结果。',
    example: 'Full 从 92.98 提升至 95.69；296 页 Hard 子集与训练数据隔离。',
    caution: '版本、子集和指标口径必须同时写清，不能只比较一个脱离协议的总分。',
    related: ['mgam', 'held-out', 'data-leakage'],
    sources: [
      { label: '论文 §5：OmniDocBench v1.6', href: `${PAPER}#S5` },
      { label: 'OmniDocBench 原始论文', href: 'https://arxiv.org/abs/2412.07626' },
    ],
  },
  {
    id: 'pre-training',
    term: '预训练',
    english: 'Pre-training',
    aliases: ['Pre-Training', 'Stage 1'],
    category: '训练策略',
    summary: '先用大规模、覆盖广的数据建立通用基础能力。',
    explanation: '论文 Stage 1 使用 65.5M Easy/Medium 跨任务样本，让模型先覆盖文本、公式、表格和版面解析。',
    example: '它先解决“见过多少种文档”，再把困难能力交给后续阶段。',
    caution: '65.5M 是跨任务训练样本口径，不等同于约 60M 页级候选。',
    related: ['sft', 'fine-tuning', 'easy', 'medium'],
    sources: [{ label: '论文 §4.1：Large-scale Pre-training', href: `${PAPER}#S4.SS1` }],
  },
  {
    id: 'fine-tuning',
    term: '微调',
    english: 'Fine-tuning',
    aliases: ['Fine-Tuning', '困难样本微调', 'Stage 2'],
    category: '训练策略',
    summary: '在已有模型上继续使用更聚焦的数据训练，使能力适应特定目标。',
    explanation: '论文 Stage 2 用包含 192K 专家 Hard 在内的 3.9M 数据强化困难样本能力，并加入 Replay 减少遗忘。',
    example: '模型先有广覆盖，再集中修炼复杂公式、表格和异常版式。',
    caution: '微调数据更难不代表可以丢掉旧数据；Replay 正是为已有能力提供保护。',
    related: ['sft', 'replay', 'hard', 'pre-training'],
    sources: [{ label: '论文 §4.2：Hard Sample Fine-tuning', href: `${PAPER}#S4.SS2` }],
  },
  {
    id: 'reinforcement-learning',
    term: '强化学习',
    english: 'Reinforcement Learning（RL）',
    aliases: ['RL', 'RL-Training'],
    category: '训练策略',
    summary: '根据输出获得的奖励信号，调整模型更倾向产生高奖励结果。',
    explanation: 'MinerU2.5-Pro 在 Stage 3 使用 GRPO，让同一样本的多个 rollout 按任务指标形成组内相对反馈。',
    example: '文本、公式、表格和版面分别使用与任务相符的指标提供奖励。',
    caution: '奖励接近评测指标时要警惕指标过拟合；高奖励也不等于完整语义理解。',
    related: ['grpo', 'rollout', 'task-reward'],
    sources: [{ label: '论文 §4.3：GRPO Alignment', href: `${PAPER}#S4.SS3` }],
  },
  {
    id: 'task-reward',
    term: '任务奖励',
    english: 'Task-specific Reward',
    aliases: ['奖励信号', '任务指标奖励'],
    category: '训练策略',
    summary: '用与具体任务相匹配的评分函数告诉模型哪些输出相对更好。',
    explanation: '论文针对文本、公式、表格和版面分别采用 Edit Distance、CDM、TEDS 与 IoU 等反馈，而不是使用同一个通用分数。',
    example: '表格候选更关注树结构相似度，版面候选则关注区域重叠。',
    caution: '教学页只展示相对排序，不虚构论文未公开的具体奖励数值。',
    related: ['grpo', 'edit-distance', 'cdm', 'teds', 'iou'],
    sources: [{ label: '论文 §4.3：任务奖励设计', href: `${PAPER}#S4.SS3` }],
  },
];

export const GLOSSARY_BY_ID: ReadonlyMap<string, GlossaryEntry> = new Map(
  GLOSSARY.map((entry) => [entry.id, entry])
);

export function getGlossaryEntry(id: string): GlossaryEntry | undefined {
  return GLOSSARY_BY_ID.get(id.trim().toLowerCase());
}
