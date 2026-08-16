import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "What makes prompts a graph: necessary and sufficient conditions for prompt graph engineering",
    titleZh: "提示图工程的必要与充分条件",
    venue: "Preprint, 2026",
    authors: "Sandeco Macedo",
    affiliation: "Federal Institute of Goiás",
    domain: "LLM systems / prompt engineering / agentic workflows",
    coreProblem: "“graph”在 prompt、thought topology、multi-agent、workflow 中被混用，导致我们很难判断哪些系统真正共享同一种工程结构。",
    coreInsight: "论文按 RQ1-RQ5 给出一条清晰主线：先追溯 prompt graph 的谱系，再定义 G1-G4 与 T1-T4，随后划清边界、应用到真实系统，并提出四条研究轴。",
    keywords: ["RQ1 Genealogy", "RQ2 Definition", "RQ3 Boundary", "RQ4 Systems", "RQ5 Agenda"]
  },
  hero: {
    oldMethod: {
      desc: "随着prompt的发展，它不再是一个孤立的字符串。最新框架中，不同模型交错运行，graph 一词在多种情况下混用，可以说“实践走在了概念之前”",
      componentId: "hero-old"
    },
    newMethod: {
      desc: "Prompt graph engineering 把提示相关计算写成显式、可执行、可检查的图，让结构成为可以被讨论和改进的对象。",
      componentId: "hero-new"
    }
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "RQ1：prompt 如何走向 graph",
      badge: "inf",
      badgeLabel: "Genealogy",
      bridge: "文章先介绍 prompt 的发展历程。图作为计算模型先于 LLM 出现，prompt 进入复杂应用后，结构从链式组合走向可编译、可优化的工程图。",
      analogy: {
        title: "从一句路标到整张路线图",
        text: "一张路标只告诉下一步；完整路线图能表达岔路、汇合、回环和终点。RQ1 的作用，就是解释为什么 prompt 也需要从一句话变成图。",
        componentId: "analogy-1"
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "prompt graph 的概念谱系",
          desc: "拖动时间轴，查看 graph 一词如何从计算模型、推理拓扑迁移到工程制品。",
          componentId: "rq1-timeline"
        },
        {
          kind: "module",
          id: "1.2",
          title: "从 string 到 graph 的形态变化",
          desc: "拖动滑杆，观察 prompt 形态如何从单字符串逐步长出链、分支、汇合和循环。",
          componentId: "rq1-shapes"
        }
      ],
      insight: "RQ1 不只是回顾历程，它直接引出研究动机：实践已经变成图，但相关领域的统一术语还停留在单 prompt。",
      takeaways: [
        { icon: "🎯", title: "结构先出现", desc: "多调用结构从 prompt chaining 和 cascades 延伸出来。" },
        { icon: "🔧", title: "graph 一词迁移", desc: "graph 从思维拓扑迁移到工程制品语境。" },
        { icon: "✨", title: "动机自然成立", desc: "结构收敛了，定义却还没有收敛。" }
      ]
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "RQ2：G1-G4 与 T1-T4",
      badge: "both",
      badgeLabel: "Definition",
      bridge: "这部分是文章的核心贡献：作者不用例子定义概念，而是给出四个充分必要的条件，并把它们转换成 T1-T4 的包含/排除测试。",
      analogy: {
        title: "四个章都盖上才算路线图",
        text: "有路线、能改路牌、按规则行走、还能存档复盘，四项都满足才是可用的工程图。",
        componentId: "analogy-2"
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "G1-G4：点击看完整定义与测试条件",
          desc: "四个条件共同界定 prompt graph engineering，点击卡片查看对应测试。",
          componentId: "rq2-definition"
        },
        {
          kind: "module",
          id: "2.2",
          title: "简单样例：一个候选系统为什么通过/失败",
          desc: "对应论文 Table 1 的 decision procedure。",
          componentId: "rq2-test"
        }
      ],
      insight: "G 条件说明“是什么”，T 测试说明“怎么判”：定义和判定过程在这一节合并为一个工具。",
      formula: {
        lead: "论文的定义可以写成一个二值测试：",
        unicode: "PGE iff G1 and G2 and G3 and G4",
        symbols: [
          { sym: "PGE", desc: "Prompt Graph Engineering，即把 prompt-mediated computation 工程化为显式图。" },
          { sym: "G1", desc: "Explicit structure：节点和边能被枚举。" },
          { sym: "G2", desc: "Separation：结构和 prompt content 可独立变化。" },
          { sym: "G3", desc: "Executable semantics：运行时执行图并管理调度、路由、状态。" },
          { sym: "G4", desc: "First-class artifact：图能够多次运行，可检查、版本化、验证或优化。" }
        ]
      },
      takeaways: [
        { icon: "🎯", title: "定义是条件式", desc: "论文定义的是成员资格，不是成熟度评分。" },
        { icon: "🔧", title: "T1-T4 可操作", desc: "每个失败条件都指向一个相邻类别。" },
        { icon: "✨", title: "避免误判", desc: "可视化、多模型、DAG、自动优化都不是必要条件。" }
      ]
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "RQ3：和领域内其它概念的知识图谱",
      badge: "both",
      badgeLabel: "Boundary",
      bridge: "本节把 PGE 放在六个邻近概念之间，展示不同概念之间的关系和差别。",
      analogy: {
        title: "中心营地和周边路线",
        text: "有些路线共享 prompt，有些共享 graph，有些共享 workflow；真正的 PGE 位于“prompt 节点”和“工程图”同时成立的交点。",
        componentId: "analogy-3"
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "相关概念关系图",
          desc: "点击 classic prompt engineering、thought topologies、agent orchestration、prompt programming、RAG pipelines、classic workflow engines 查看边界。",
          componentId: "rq3-graph"
        }
      ],
      insight: "RQ3 的关键句是：thought topologies 有 graph 但缺 authorship；agent conversation 有 prompt 但缺结构；workflow engines 有 graph 但缺 prompt。",
      formula: {
        lead: "PGE 的 differentia 可以概括为",
        unicode: "PGE = dataflow graph tradition + prompt-parameterized node semantics",
        symbols: [
          { sym: "dataflow graph tradition", desc: "显式、可执行、一等图的工程传统。" },
          { sym: "prompt-parameterized node semantics", desc: "区别于传统 workflow engine 的新节点语义。" }
        ]
      },
      takeaways: [
        { icon: "🎯", title: "边界不是否定", desc: "邻近概念常是 PGE 的祖先、材料或内部节点。" },
        { icon: "🔧", title: "失败点可命名", desc: "每个邻居都能对应到 T1-T4 的某个缺口。" },
        { icon: "✨", title: "知识图谱适合展示", desc: "节点大小和距离能把“相似但不同”讲得很直观。" }
      ]
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "RQ4 应用：用 PGE 定义检查真实系统",
      badge: "trn",
      badgeLabel: "Systems",
      bridge: "本节把 T1-T4 应用到六个真实系统，展示实际情况下如何判断一个系统是否是 PGE",
      analogy: {
        title: "同一把尺量六张路线图",
        text: "不是看系统名里有没有 graph，而是逐项检查 T1、T2、T3、T4。满格、半格、空格分别表示 included、partial、excluded。",
        componentId: "analogy-4"
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "六个真实系统的 T1-T4 检查矩阵",
          desc: "点击系统名称，查看它在 T1-T4 上的测试结果，以及论文给出的 verdict。",
          componentId: "rq4-matrix"
        },
        {
          kind: "module",
          id: "4.2",
          title: "三类结论：Included、Partial、Excluded",
          desc: "把六个系统按论文结论聚合，突出 LangGraph、DSPy、Prompt Flow 完整通过，多智能体框架按运行模式分裂。",
          componentId: "rq4-verdicts"
        }
      ],
      insight: "RQ4 这个定义能稳定地区分 graph-first frameworks、multi-agent modes 和 emergent delegation。",
      takeaways: [
        { icon: "🎯", title: "三者全通过", desc: "LangGraph、DSPy、Prompt Flow 在论文表格中 T1-T4 均为 yes。" },
        { icon: "🔧", title: "两者部分通过", desc: "AutoGen 和 CrewAI 在 graph-reifying modes 中通过，在 emergent modes 中不完整。" },
        { icon: "✨", title: "一个反例", desc: "Claude Code subagents 有 authored nodes，但 delegation topology 仍是 emergent。" }
      ]
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "RQ5 四个研究坐标轴",
      badge: "both",
      badgeLabel: "Agenda",
      bridge: "本节从分类结果中抽出未来研究问题。它提出了四条研究坐标轴。",
      analogy: {
        title: "四个方向的罗盘",
        text: "研究议程像罗盘：显式/涌现、静态/动态、prompt 粒度/agent 粒度、人工/自动改进。每个方向都对应真实系统的未解问题。",
        componentId: "analogy-5"
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "四条研究坐标轴",
          desc: "切换坐标轴并拖动游标，查看六个系统在每条研究张力轴上的相对位置。",
          componentId: "rq5-axes"
        },
        {
          kind: "module",
          id: "5.2",
          title: "横向问题：verification、context、equivalence",
          desc: "点击问题，查看它们如何跨越不同研究方向。",
          componentId: "rq5-transversal"
        }
      ],
      insight: "RQ5 把概念定义转化为可研究的问题：结构到底什么时候比 prompt wording 更值得优化？",
      takeaways: [
        { icon: "🎯", title: "定义打开研究问题", desc: "没有清晰定义，就难以测量结构本身的价值。" },
        { icon: "🔧", title: "张力来自系统差异", desc: "论文把六个系统放到四条轴上。" },
        { icon: "✨", title: "未来工作可讲", desc: "验证、上下文纪律、等价性是很好的追问入口。" }
      ]
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "结论：定义带来的工程收益",
      badge: "inf",
      badgeLabel: "Recap",
      bridge: "文章最后强调：四个条件不是形式主义，而是工程实践已经需要的前提。显式结构带来检查，分离带来复用，可执行语义带来运行，一等制品带来优化。",
      analogy: {
        title: "从动机走到问题单",
        text: "先讲为什么需要定义，再讲定义本身，最后用边界、系统和议程证明它有用。",
        componentId: "analogy-6"
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "五个贡献如何合成一个结论",
          desc: "点击每个 RQ，查看它如何支撑“prompt graph engineering 值得被单独命名”这一结论。",
          componentId: "rq-recap"
        }
      ],
      insight: "五个 RQ 连在一起，形成了本文的完整贡献：来源、定义、边界、应用和开放问题。",
      formula: {
        lead: "全文主要贡献：",
        unicode: "RQ1 -> RQ2 -> RQ3 -> RQ4 -> RQ5",
        symbols: [
          { sym: "RQ1", desc: "谱系和动机。" },
          { sym: "RQ2", desc: "定义和测试。" },
          { sym: "RQ3", desc: "边界。" },
          { sym: "RQ4", desc: "真实系统应用。" },
          { sym: "RQ5", desc: "研究方向。" }
        ]
      },
      takeaways: [
        { icon: "🎯", title: "五个贡献", desc: "论文按 RQ1-RQ5 展开，结构清晰。" },
        { icon: "🔧", title: "一个测试", desc: "T1-T4 把定义转化为可操作判定。" },
        { icon: "✨", title: "一组议程", desc: "四条张力轴把概念定义推向后续研究。" }
      ]
    }
  ]
};
