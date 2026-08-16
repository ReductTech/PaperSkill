import type { TutorialData } from '../types';

// OpenCompass 交互式教程数据。所有可见文案均为简体中文；每个 componentId 已在
// src/modules/registry.tsx 中注册。kind:"chapter"/"module" 字段不可省略。

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'OpenCompass: A Universal Evaluation Platform for Large Language Models',
    titleZh: 'OpenCompass：大语言模型的一站式通用评测平台',
    venue: 'arXiv:2605.19276 · cs.CL · 2026',
    authors: 'OpenCompass Team · 上海人工智能实验室（Maosong Cao, Kai Chen, Haodong Duan 等）',
    affiliation: 'Shanghai AI Laboratory（上海人工智能实验室）',
    domain: '大语言模型 · 评测平台 · 分布式系统',
    coreProblem: '主流静态基准评测面临任务类型多样、评测标准不一致、数据与流程碎片化，难以高效地进行跨领域、大规模模型评测。',
    coreInsight: 'OpenCompass 遵循<b>模块化与组件解耦</b>，把「配置、切分、调度、任务执行、结果汇总」拆成可独立替换的组件，统一评测协议并以高并发并行执行，让不同模型在同一把尺上可比。想直接体验？<a href="https://opencompass.org.cn/home" target="_blank" rel="noopener">打开官方平台 OpenCompass 司南 →</a>',
    keywords: ['LLM 评测', '评测平台', '高并发', 'LLM-as-a-Judge', 'OpenCompass'],
  },
  hero: {
    oldMethod: {
      desc: '各基准各用一套标准，数据与流程碎片化，逐份手工评测，<b>分数无法横向比较</b>。',
      componentId: 'heroContrast',
    },
    newMethod: {
      desc: '<video controls preload="metadata" width="100%" src="/videos/oc-demo.mp4"></video><br>统一评测协议，配置/切分/调度/任务/汇总解耦，<b>高并发一次评测 100+ 基准</b>。',
    },
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '为什么评测大模型这么难？',
      badge: 'inf',
      badgeLabel: '基础',
      bridge: '欢迎！在进入 OpenCompass 之前，先体会它要解决的痛点——给大模型打分，为什么比批改一张试卷难得多。',
      analogy: {
        title: '各套标准对不齐',
        text: '一支红笔在一张评分尺互相错位的试卷上徘徊——<b>标准不统一</b>，分数就无从比较。',
        componentId: 'analogyScene',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '体验碎片化的代价',
          desc: '拖动两个滑块，体验碎片化的两大来源：<b>基准数量</b>增多与<b>prompt 措辞</b>变化。',
          componentId: 'ch1mod1',
        },
        {
          kind: 'module',
          id: '1.2',
          title: 'OpenCompass 统一收束',
          desc: '点击按钮启用统一标准，看 OpenCompass 如何把散乱的评测<b>对齐到同一套协议</b>。',
          componentId: 'ch1mod2',
        },
      ],
      insight: '基准越多、标准越杂，评测就越需要<b>统一协议</b>来收束碎片——这正是 OpenCompass 的出发点。',
      takeaways: [
        { icon: '🎯', title: '碎片化是痛点', desc: '任务类型、评测标准、数据流程各自为政，跨领域大规模评测极其低效。' },
        { icon: '🔧', title: '统一协议', desc: 'OpenCompass 用统一协议把散乱的评测收束到同一套流程。' },
        { icon: '✨', title: '先体验再理解', desc: '先动手感受碎片化，再看统一如何解决问题。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '评测对象与评测范式',
      badge: 'inf',
      badgeLabel: '基础',
      bridge: '上一节我们看到了碎片化。要统一评测，先得弄清<b>评什么</b>、<b>怎么评</b>。',
      analogy: {
        title: '一张试卷，两种题型',
        text: '一张试卷翻出<b>客观选择题</b>与<b>主观作文题</b>两面，对应两种完全不同的打分方式。',
        componentId: 'analogyScene',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: 'Base vs Chat 模型',
          desc: '先搞清<b>评什么</b>：<b>Base 模型</b>用困惑度续写评测，<b>Chat 模型</b>用生成式作答评测。',
          componentId: 'ch2mod1',
        },
        {
          kind: 'module',
          id: '2.2',
          title: '客观 vs 主观评测',
          desc: '再讲<b>怎么评</b>：<b>客观评测</b>有标准答案，<b>主观评测</b>需要裁判多维打分。',
          componentId: 'ch2mod2',
        },
      ],
      formula: {
        lead: '客观题看答案是否命中标准答案；主观题没有唯一答案，靠 LLM 裁判做多维质量打分。',
        unicode: '客观 Accuracy = 命中标准答案数 ÷ 样本总数　　主观 Score = 多维打分',
        symbols: [
          { sym: 'Accuracy', desc: '客观准确率，越高越好。' },
          { sym: '命中标准答案数', desc: '预测与标准答案一致的样本数量。' },
          { sym: '样本总数', desc: '本次评测的样本总量。' },
          { sym: 'Score', desc: '主观质量得分，越高越好。' },
          { sym: '多维打分', desc: 'LLM-as-a-Judge 在连贯性、可用性、指令遵循等维度上的质量评分。' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '两类评测对象', desc: 'Base 模型靠文本续写，Chat 模型靠指令跟随与多轮对话。' },
        { icon: '🔧', title: '两类评测范式', desc: '客观题有标准答案用规则；主观题开放式需裁判打分。' },
        { icon: '✨', title: '三阶段流水线', desc: '数据预处理 → 模型推理 → 结果评测，是平台要统一的标准流程。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '核心洞见：模块化与解耦',
      badge: 'inf',
      badgeLabel: '基础',
      bridge: '评什么、怎么评清楚了。但为什么 OpenCompass 能同时支持上百个基准？秘密在于<b>把系统拆开</b>。',
      analogy: {
        title: '一把直尺对齐标准',
        text: '一把直尺落下，把散乱的评分线<b>对齐到同一条标准</b>——模块化统一的力量。',
        componentId: 'analogyScene',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '一体化 vs 模块化',
          desc: '一体化把配置、切分、调度、任务、汇总<b>焊在一起</b>，改一处就全盘受影响；模块化把它们<b>解耦</b>成独立组件，可单独替换。点击对比看运行时差别。',
          componentId: 'ch3mod1',
        },
      ],
      insight: '模块化与组件解耦，让每个环节可以独立替换、独立扩展——这是 OpenCompass 高兼容、灵活、高并发的根基。',
      takeaways: [
        { icon: '🎯', title: '解耦即扩展', desc: '把评测拆成独立组件，新基准、新模型只需替换对应模块。' },
        { icon: '🔧', title: '三大优势', desc: '高兼容、灵活、高并发，都源自模块化设计。' },
        { icon: '✨', title: '一体化之痛', desc: '一体化改动牵一发动全身，难以规模化。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '从配置到「模型×数据集」',
      badge: 'both',
      badgeLabel: '进阶',
      bridge: '模块拆开了，那一次评测具体从哪开始？答案是<b>配置</b>——它定义了模型、数据集与评测策略。',
      analogy: {
        title: '打勾填满表格',
        text: '一支笔在<b>模型 × 数据集</b>表格里逐个打勾，枚举出所有待评测的组合。',
        componentId: 'analogyScene',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '从配置到 模型×数据集',
          desc: '逐步走一遍评测流水线，重点看<b>笛卡尔积</b>如何把「模型 × 数据集」两两配对成 6 种组合。',
          componentId: 'ch4mod1',
        },
      ],
      formula: {
        lead: '「笛卡尔积」把每个模型与每个数据集两两配对：组合数 = 模型数 × 数据集数。',
        unicode: '|任务列表| = |模型集合| × |数据集集合|',
        symbols: [
          { sym: '任务列表', desc: '切分后得到的结构化原子子任务集合。' },
          { sym: '模型集合', desc: '用户指定的待评测模型列表，例如 2 个模型。' },
          { sym: '数据集集合', desc: '用户指定的基准数据集列表，例如 3 个数据集。' },
          { sym: '×', desc: '笛卡尔积：每个模型与每个数据集两两配对。' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '配置是入口', desc: '从 CLI 或 Python 文件读入模型、数据集与评测策略。' },
        { icon: '🔧', title: '笛卡尔积', desc: '模型×数据集做笛卡尔积，枚举所有组合。' },
        { icon: '✨', title: '任务列表', desc: '再按策略切分成原子子任务，交给调度层。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '三种评测器：规则、裁判与级联',
      badge: 'both',
      badgeLabel: '进阶',
      bridge: '任务列表有了，最后一步「打分」怎么打？不同题目需要不同的<b>评分工具</b>。',
      analogy: {
        title: '规则还是裁判',
        text: '一支笔在<b>直尺（规则）</b>与<b>放大镜（裁判）</b>之间选择，不同题目配不同工具。',
        componentId: 'analogyScene',
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '评测器选择挑战',
          desc: '当一次评测工程师：看任务场景，从<b>基于规则 / LLM 裁判 / 级联</b>中选出最合适的评测器。',
          componentId: 'ch5mod1',
        },
        {
          kind: 'module',
          id: '5.2',
          title: '评测器细节',
          desc: '看两种评测器的内部：<b>规则评测器</b>的三种实现，以及 <b>LLM 裁判</b>的多维打分因素。',
          componentId: 'ch5mod2',
        },
      ],
      insight: '单一评分方式无法覆盖所有场景——OpenCompass 提供规则、裁判、级联三种评测器，让评测<b>按需取舍成本与精度</b>。',
      takeaways: [
        { icon: '🎯', title: '规则评测器', desc: '轻量高效，适合有标准答案的客观题，无需额外模型。' },
        { icon: '🔧', title: 'LLM 裁判', desc: '用 LLM 做定性/定量打分，覆盖主观与复杂客观题。' },
        { icon: '✨', title: '级联评测器', desc: '规则先筛、裁判复核，或并行互补，平衡成本与精度。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '切分与并行调度',
      badge: 'inf',
      badgeLabel: '基础',
      bridge: '评测上百个基准、几十个模型，计算量巨大。OpenCompass 如何<b>快</b>起来？',
      analogy: {
        title: '把试卷切成小叠',
        text: '一把切纸刀把一摞厚试卷<b>切成等份小叠</b>，好让多份任务同时开工。',
        componentId: 'analogyScene',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '切分与并行调度',
          desc: '逐步观察：完整任务被<b>切分</b>成原子子任务，再由 Runner <b>并行分发</b>到集群。',
          componentId: 'ch6mod1',
        },
      ],
      takeaways: [
        { icon: '🎯', title: '切分降耗时', desc: '把完整评测切成独立原子子任务，拆解串行时间线性增长的问题。' },
        { icon: '🔧', title: 'Runner 屏蔽异构', desc: '统一本地、阿里云 DLC、火山引擎等集群的调度接口。' },
        { icon: '✨', title: '并行执行', desc: '子任务并行分发，大幅缩短全量评测周期。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-7',
      title: '一次任务的执行：推理与评测',
      badge: 'trn',
      badgeLabel: '细节',
      bridge: '并行调度把任务分下去了。那<b>单个任务</b>内部到底发生了什么？',
      analogy: {
        title: '从作答到评分',
        text: '一支笔沿轨道从<b>作答</b>滑向<b>评分</b>——一次任务要依次完成推理与评测。',
        componentId: 'analogyScene',
      },
      modules: [
        {
          kind: 'module',
          id: '7.1',
          title: '一次任务的执行',
          desc: '逐步走一遍推理与评测任务：实例化 → prompt → 推理 → 后处理 → <b>打分</b>。',
          componentId: 'ch7mod1',
        },
      ],
      formula: {
        lead: '客观任务的最终打分就是准确率。',
        unicode: 'Accuracy = 正确数 ÷ 总数',
        symbols: [
          { sym: 'Accuracy', desc: '准确率，越高越好。' },
          { sym: '正确数', desc: '评测判定为正确的样本数量。' },
          { sym: '总数', desc: '参与评测的样本总量。' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '两类原子任务', desc: 'OpenICLInferTask 负责推理，OpenICLEvalTask 负责评测。' },
        { icon: '🔧', title: '模型实例化', desc: '支持 API、HuggingFace 原生，以及 vLLM/LMDeploy 加速。' },
        { icon: '✨', title: 'prompt 构造', desc: 'Retriever 检索示例 + Template 填充，支持 few-shot / zero-shot / 多轮。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-8',
      title: '五大组件的架构全景',
      badge: 'trn',
      badgeLabel: '细节',
      bridge: '把前面所有环节串起来，就是 OpenCompass 的<b>完整架构</b>：五个组件、四个阶段。',
      analogy: {
        title: '给流程盖章',
        text: '一枚印章给<b>评测流程卡</b>盖上「合格」，五个环节各司其职、缺一不可。',
        componentId: 'analogyScene',
      },
      modules: [
        {
          kind: 'module',
          id: '8.1',
          title: '五大组件架构图',
          desc: '<video controls preload="metadata" width="100%" src="/videos/opencompass-figure-1-animation.mp4"></video><br>点击五个组件，看<b>配置 → 切分 → 调度 → 任务 → 汇总</b>如何串起整个评测流水线。',
          componentId: 'ch8mod1',
        },
      ],
      takeaways: [
        { icon: '🎯', title: '五大组件', desc: '配置系统、Partitioner、Runner、Task、Summarizer 各司其职。' },
        { icon: '🔧', title: '四个阶段', desc: '配置构建 → 推理 → 评测 → 可视化。' },
        { icon: '✨', title: '统一任务范式', desc: '推理与评测都遵循「切分 → 调度 → 执行」的统一范式。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-9',
      title: '级联模式与结果汇总',
      badge: 'trn',
      badgeLabel: '细节',
      bridge: '最后两件实用机制：级联评测器的<b>两种模式</b>，以及结果如何<b>汇总可视化</b>。',
      analogy: {
        title: '把分数汇总成单',
        text: '一支笔把零散分数<b>汇总进一张成绩单</b>，得到总分与可视化报告。',
        componentId: 'analogyScene',
      },
      modules: [
        {
          kind: 'module',
          id: '9.1',
          title: '级联模式 vs 并行模式',
          desc: '切换级联评测器的两种工作模式，体会<b>成本</b>与<b>容错</b>的权衡。',
          componentId: 'ch9mod1',
        },
      ],
      insight: '级联评测器在<b>成本</b>与<b>精度</b>之间提供两个档位；Summarizer 用 abbr 标识把结果映射成可视化报告。',
      formula: {
        lead: '级联评测器输出「规则准确率、LLM 准确率、合并准确率」三项；两种模式的合并准确率等价，差别在成本（级联只对判错样本调用裁判）。',
        unicode: '级联 Acc合 = r对 + r错 × q　　并行 Acc合 = 1 − r错 × (1 − q)',
        symbols: [
          { sym: 'Acc合', desc: '合并准确率，级联评测器的最终输出之一，越高越好。' },
          { sym: 'r对', desc: '规则判对的样本占比。' },
          { sym: 'r错', desc: '规则判错的样本占比（= 1 − r对）。' },
          { sym: 'q', desc: 'LLM 裁判复核的正确率。' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '级联模式', desc: '规则先筛、判错交裁判，省时省钱。' },
        { icon: '🔧', title: '并行模式', desc: '规则与裁判同时评，任一判对即对，容错更高但成本高。' },
        { icon: '✨', title: '结果汇总', desc: '按 abbr 映射、summary group 归并，生成可视化报告。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-10',
      title: '统一排行榜：结果与局限',
      badge: 'both',
      badgeLabel: '进阶',
      bridge: '最后一节：OpenCompass 究竟测出了什么？它还有哪些<b>局限</b>？',
      analogy: {
        title: '冲线看排行榜',
        text: '一位选手冲过终点线，<b>排行榜</b>亮起——统一评测让所有模型可以横向比较。',
        componentId: 'analogyScene',
      },
      modules: [
        {
          kind: 'module',
          id: '10.1',
          title: '统一排行榜对比',
          desc: '点击开始，看 OpenCompass 如何把不同模型拉到<b>同一把尺</b>上横向比较。论文为快照数据，实时排名见 <a href="https://opencompass.org.cn/home" target="_blank" rel="noopener">官方排行榜</a>。',
          componentId: 'ch10mod1',
        },
        {
          kind: 'module',
          id: '10.2',
          title: '浏览 100+ 基准库',
          desc: '按 8 大领域浏览 OpenCompass 支持的基准，看评测覆盖面到底有多广。',
          componentId: 'ch10mod2',
        },
      ],
      formula: {
        lead: '排行榜的「平均分」是表中可用基准分数的均值（部分模型存在空单元格）。',
        unicode: '平均分 = Σ 单项分数 ÷ 基准数',
        symbols: [
          { sym: '平均分', desc: '模型在多个基准上的平均得分，越高越好。' },
          { sym: '单项分数', desc: '模型在单个基准（如 IFEval、HLE）上的得分。' },
          { sym: '基准数', desc: '参与平均的基准数量。' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '100+ 基准', desc: '覆盖知识、推理、计算、科学、语言、代码、长文本等领域。' },
        { icon: '🔧', title: '统一排行榜', desc: '同一把尺让不同模型横向可比，Gemini-3-Pro-Preview 平均 81.32 领先（按可用基准计）。' },
        { icon: '✨', title: '已知局限', desc: 'Infer 与 Eval 串行、仅支持单模态，是论文明确指出的未来方向。' },
      ],
    },
  ],
  bilibili: [
    {
      bvid: 'BV1Gg4y1U7uc',
      title: 'OpenCompass 大模型评测',
      reason: '主线教程：讲解评测体系与操作流程。',
      cover: 'https://i0.hdslb.com/bfs/archive/68bcd59a7ecfe7b332e8f5c2e30de097e7252df3.jpg',
      views: '1.6万播放',
    },
    {
      bvid: 'BV1Pm41127jU',
      title: 'OpenCompass 大模型评测实战',
      reason: '实战任务：从环境安装到在 C-Eval 上评测模型。',
      cover: 'https://i0.hdslb.com/bfs/archive/374336d94ba08c39c648246d338fd764ad56015e.jpg',
      views: '9812播放',
    },
    {
      bvid: 'BV1dtD4YKENj',
      title: 'OpenCompass 评测书生大模型实践',
      reason: '实战：用 API 方式评测模型（实战营第四期）。',
      cover: 'https://i1.hdslb.com/bfs/archive/e1926657e49176620f45092b72af9422ddcd4f47.jpg',
      views: '3290播放',
    },
  ],
};
