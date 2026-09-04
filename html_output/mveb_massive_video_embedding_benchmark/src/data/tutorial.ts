import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'MVEB',
    titleZh: '如何判断一个视频嵌入模型是否真正通用？',
    venue: 'Massive Video Embedding Benchmark · 2026',
    authors: 'Adnan El Assadi、Roman Solomatin、Isaac Chung、Chenghao Xiao 等',
    affiliation: 'Harvard University、Aarhus University、Stanford University 等',
    domain: '视频嵌入 · 多模态检索 · 基准评测',
    coreProblem: '分类、检索或问答上的单项高分，不能回答一个视频嵌入模型是否真正通用。',
    coreInsight: '<b>MVEB 把碎片化任务组织成一条统一评测链：</b>先从 184 项任务中筛出 23 项，再用六类能力评测 33 个模型，最后解释音频、帧数与检索方向带来的真实差异。',
    keywords: ['Video Embedding', 'Benchmark Evaluation', 'Multimodal Embedding', 'Cross-modal Retrieval'],
  },
  hero: {
    oldMethod: {
      desc: '<b>任务级评测：</b>六类任务使用彼此独立的协议，只能提供局部能力证据。',
      componentId: 'fragmentation-compare',
    },
    newMethod: {
      desc: '<b>统一评测协议：</b>同一批模型接受六类任务检验，每类任务仍使用对应指标。',
      componentId: 'fragmentation-compare',
    },
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: 'Why MVEB?｜为什么需要统一评测',
      badge: 'inf',
      badgeLabel: 'THE PROBLEM',
      bridge: '目前视频表征模型评估方式多样，缺少统一标准来度量模型综合能力',
      analogy: {
        title: '散落的任务卡，不是一张能力地图',
        text: 'Classification、Retrieval、QA 等卡片各自亮起；只有把它们聚到同一评测中心，才能讨论“通用”。',
        componentId: 'fragmentation-compare',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '从单项高分到综合能力',
          desc: '',
          componentId: 'fragmentation-compare',
        },
      ],
      insight: 'MVEB 要解决的不是给出模型榜单，而是给通用视频 embedding 建立一个评估体系。',
      formula: {
        lead: '关键区分：',
        unicode: '单任务强 ≠ 通用视频嵌入强',
        symbols: [
          { sym: '单任务强', desc: '只在某个数据集、任务协议和指标内得到的结果。' },
          { sym: '通用', desc: '至少需要跨任务族、模态接口和评测协议的证据。' },
          { sym: '≠', desc: '没有额外实验时，局部结果不能自动外推。' },
        ],
      },
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: 'From MVEB+ to MVEB｜从 184 项任务到 23 项精选任务',
      badge: 'both',
      badgeLabel: 'BUILD THE BENCHMARK',
      bridge: '统一评测不能只追求“大”。作者先建立 184-task MVEB+，再用五类约束压缩成 23-task。',
      analogy: {
        title: '把 184 件候选展品筛成 23 件代表作',
        text: '策展不是随意删减：有效性、独特覆盖、语言多样性、相关性冗余和运行成本共同决定去留。',
        componentId: 'benchmark-funnel-stage',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '如何筛选MVEB+',
          desc: '',
          componentId: 'benchmark-funnel-stage',
        },
      ],
      insight: '筛选的汇报来自效率与排序兼得，精选后在运行时(H100)约快 7–10×，而模型排名与全量任务池仍高度一致。',
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: 'What Does MVEB Measure?｜定义六类能力',
      badge: 'inf',
      badgeLabel: 'DEFINE THE ABILITIES',
      bridge: '23 项任务选定后，先别急着看总分。得先弄清楚：一套视频表示究竟要经受哪些考题？',
      analogy: {
        title: '同一组猫咪视频，换一种问法，考的能力就不同',
        text: '点开任一任务，看模型拿到什么输入，又要交出什么结果。',
        componentId: 'task-family-explorer',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '点开任务，看一次完整评测',
          desc: '每个示例都从输入开始播放。你会看到模型如何给出类别、聚类、排序、关系判断或答案。',
          componentId: 'task-family-explorer',
        },
      ],
      insight: '六类任务问的是六件事：它属于哪一类？能否借助文字识别新类别？相似视频会不会聚在一起？相关结果能否排到前面？两段视频是否满足同一关系？视频能否支持作答？',
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '33 Models, No Single Winner｜没有全能',
      badge: 'both',
      badgeLabel: 'BENCHMARK THE MODELS',
      bridge: '作者用同一套协议测试了 33 个公开检查点，覆盖六类 embedding paradigm。结果没有指向一位全能冠军，优势散落在不同任务上。',
      analogy: {
        title: '换一条赛道，领先者也会换',
        text: '总榜概括的是这 23 项任务里的整体表现。具体到分类、检索或问答，领先模型并不相同。',
        componentId: 'model-landscape',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '切换模型，看它强在哪、弱在哪',
          desc: '这里选了三类代表：专门训练的 MLLM embedder、多模态 binding 模型，以及直接取生成式 MLLM 表征的做法。雷达图的六条轴仍使用各任务族自己的论文指标。',
          componentId: 'model-landscape',
        },
        {
          kind: 'module',
          id: '4.2',
          title: 'Borda：跨任务看谁经常靠前',
          desc: '<strong>Borda</strong> 不直接平均不同指标，而是汇总模型在每项任务里的相对名次。',
          componentId: 'metric-borda-lab',
        },
      ],
      insight: 'LCO-Embedding-Omni-7B 位列 23-task Borda 总榜第 1，但它并未包揽各类任务。多模态 binding 模型在检索和零样本任务上更突出；直接把生成式 MLLM 当作 embedder，多数任务表现较弱。',
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: 'What Did the Benchmark Reveal?｜三个连续实验',
      badge: 'both',
      badgeLabel: 'DISCOVER THE PATTERNS',
      bridge: '总榜只告诉我们谁排在前面，三个实验继续追问原因：音频何时有用，多少帧已经足够，八个检索方向又是否真的彼此独立。',
      analogy: {
        title: '三个实验，一幕一幕看结果变化',
        text: '先打开声音，再增加视频帧数，最后观察八个检索方向如何按相关性重新靠拢。',
        componentId: 'analysis-stage',
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '依次查看 Audio、Frames 与 Retrieval',
          desc: '点击“下一幕”推进实验，也可以用顶部标签切换。图中只标论文报告的数值；中间曲线只画趋势，不补造数据。',
          componentId: 'analysis-stage',
        },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '怎么看 MVEB 的结果？',
      badge: 'both',
      badgeLabel: 'READ THE RESULTS',
      bridge: '总榜告诉你谁更稳定，分项告诉你各自强在哪。',
      analogy: {
        title: '选模型前，先对齐任务、训练与预算',
        text: 'MVEB 不负责颁发永久冠军。它提供的是一组可核对的任务和协议，帮助研究者判断某个模型是否适合手头的问题。',
        componentId: 'takeaway-stage',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '总榜：谁最稳定？',
          desc: '',
          componentId: 'takeaway-stage',
        },
        {
          kind: 'module',
          id: '6.2',
          title: '分项：每个模型强在哪？',
          desc: '',
          componentId: 'takeaway-stage',
        },
      ],
    },
  ],
  bilibili: [
    {
      bvid: 'BV1obiLeREDh',
      title: 'MVBench：多模态大模型视频理解能力基准｜CVPR Highlight 2024【直播回放】',
      reason: '相关视频基准案例；请注意 MVBench 与本文 MVEB 是不同基准。',
      views: '754播放',
    },
    {
      bvid: 'BV1JxbczxEYW',
      title: '【北京理工大学 张美慧】统一多模态数据融合检索技术',
      reason: '补充多模态表征与融合检索背景。',
      views: '991播放',
    },
    {
      bvid: 'BV17h41177ey',
      title: '【课程推荐】文本视频跨模态检索（文本-视频跨模态检索技术研究现状）',
      reason: '补充文本—视频嵌入与有序检索背景。',
      views: '271播放',
    },
  ],
};
