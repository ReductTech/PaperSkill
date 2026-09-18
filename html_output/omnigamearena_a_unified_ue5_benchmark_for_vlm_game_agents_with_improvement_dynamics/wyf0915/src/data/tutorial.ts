import type { TutorialData } from '../types';

// OmniGameArena: a 12-game UE5 benchmark + Improvement Dynamics Curve (IDC)
// 10 chapters following the default arc; data sourced from the paper's tables
// and IDC curves (cold-start, PvP win rates, IDC gain & transfer).

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'OmniGameArena: A Unified UE5 Benchmark for VLM Game Agents with Improvement Dynamics',
    titleZh: 'OmniGameArena：一款用于VLM智能体的统一UE5基准测试平台，具备动态改进机制',
    venue: 'arXiv 2606.09826v1, 8 Jun 2026',
    authors: 'Mingxian Lin, Shengju Qian, Yuqi Liu, Yi-Hua Huang, Yiyu Wang, Wei Huang, Yitang Li, Fan Zhang, Zeyu Hu, Lingting Zhu, Xin Wang, Xiaojuan Qi',
    affiliation: 'The University of Hong Kong · LIGHTSPEED · CUHK · Tsinghua University',
    domain: 'VLM game agents · real-time evaluation · agentic self-reflection',
    coreProblem: '1. 现有 VLM 游戏基准只报告单次冷启动分数，掩盖了"在重复交互中是否会变好"以及"学到的策略是否迁移到变体"这两个部署关键属性。2.评估研究大多侧重于评估智能体在单轮游戏中的表现，而不是在多轮游戏中的表现。',
    coreInsight: '搭建一个更全面，更公平的AI“考场”，采用更动态，更具有成长性的评估机制',
    keywords: ['VLM 智能体', '实时游戏基准', '改进动力学曲线 (IDC)', 'UE5', '智能体自反思', '冷启动榜单', '变体迁移'],
  },
  hero: {
    oldMethod: {
      desc: '单次冷启动分数：一个 (agent, game) 对只有一个数字，看不到轨迹、看不到迁移。',
      componentId: 'cold-start-bars',
    },
    newMethod: {
      desc: 'IDC 曲线：多轮自反思 + best-skill rollback，暴露轨迹、变体迁移与中段峰值。',
      componentId: 'idc-curve-plot',
    },
  },
  dualHero: {
    pages: [
      {
        title: 'OmniGameArena：更公平的 VLM 智能体"考场"',
        intro: 'OmniGameArena 是一个基于UE5打造的基准测试平台，包含12款全新设计的测试游戏',
        innovations: [
          {
            icon: '🎮',
            name: '测试游戏类型全覆盖：Solo、PvP、Coop（7+3+2=12）',
            body: '目的：全面考察VLM智能体的不同能力',
            color: 'blue',
          },
          {
            icon: '🛡️',
            name: '杜绝"作弊"：所有游戏为这个基准实验专门设计',
            body: '目的：避免数据泄露',
            color: 'green',
          },
          {
            icon: '🧩',
            name: '统一接口：统一使用键盘鼠标或手柄接口进行控制',
            body: '目的：保证了评估公平性',
            color: 'orange',
          },
        ],
      },
      {
        title: 'IDC: 更深入的反思改进"评估方法"',
        intro: 'IDC全称Improvement Dynamics Curve，是一个让VLM智能体通过"反思"来自主提升技能的评测框架',
        innovations: [
          {
            icon: '📈',
            name: '不止于"首考"成绩，关注"成长"',
            body: '关注VLM智能体在多次"反思-改进"循环中，分数如何动态演变。',
            color: 'blue',
          },
          {
            icon: '🔁',
            name: '考察"举一反三"能力',
            body: '不仅看VLM智能体在原任务上进步多少，还会把学会的技能放到从未见过的"变体任务"上测试，看是否真正掌握底层逻辑，而不是死记硬背',
            color: 'orange',
          },
        ],
      },
    ],
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '背景与问题：为什么需要 OmniGameArena 和 IDC？？？',
      badge: 'prob',
      badgeLabel: '问题引入',
      bridgeLabel: '研究背景',
      bridge: '自从深度学习与具身智能体出现以来，互动游戏一直是人工智能的试验场。从纯文本环境到二维网格世界，再到三维空间，人工智能基准测试平台不断在更新，其能力与智慧的评估标准也在不断精简。',
      modules: [
        {
          kind: 'module',
          id: '1.0',
          title: '两大贡献各自解决的问题',
          desc: '对照表格：OmniGameArena 与 IDC 分别对"传统方法"的哪些痛点作了改进。点击任一行展开论文依据。',
          componentId: 'comparison-tables',
        },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: 'OmniGameArena：创新点一：测试游戏类型的科学性',
      badge: 'inf',
      badgeLabel: '观察表示',
      bridgeLabel: '设置游戏类型：全面智能体能力的测试，一致的评估环境，视觉效果丰富，物理机制复杂',
      bridge: '本节介绍 OmniGameArena 的第一个核心创新：12 款 UE5 游戏在 7 个能力维度上的科学性覆盖。论文 §3.1 / Figure 2 把每款游戏按 VP（视觉感知）/ SN（空间导航）/ RT（反应）/ MEM（记忆）/ PLN（规划）/ ADV（对抗）/ COOP（合作）七个能力维度逐项打分（0–3 分），保证从单人反应到团队协同的能力考察面没有死角。',
      modules: [
        {
          kind: 'module',
          id: '2.0',
          title: '12 款游戏 × 7 个能力维度的雷达图',
          desc: '点击下方任一游戏按钮，雷达图实时更新；同时在右侧显示该游戏的描述、评估公式与重点考察能力。',
          componentId: 'capability-radar',
        },
      ],
      insight: '从图 2 可以看出：Solo 游戏普遍在 PLN（规划）+ RT（反应）维度拉满；PvP 独享 ADV 维度；Coop 独享 COOP 维度——三种模式各占不同能力峰位，是"全面考察"的具体体现。',
      takeaways: [
        { icon: '🎯', title: '7 维能力画像', desc: 'VP / SN / RT / MEM / PLN / ADV / COOP，每个 0–3 分。' },
        { icon: '�', title: '互补不重叠', desc: 'Solo 偏反应、PvP 偏对抗、Coop 偏合作——三组峰值互不替代。' },
        { icon: '📊', title: '可视化选择', desc: '每个游戏可展开看评分来源与重点考察能力。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '创新点二：如何避免预训练污染——对本论文采用的策略进行污染分析',
      badge: 'inf',
      badgeLabel: '核心洞见',
      bridgeLabel: '从实证角度验证所采用的规避策略的有效性',
      bridge: '评测分数不可信的最大风险是"模型背答案"——它可能不是真的智能，而是预训练见过。本节给出 OmniGameArena 在设计阶段采取的三层规避策略，并用代表性多模态模型做对照实验验证其效果（论文 §3.2 / Table 2）。',
      modules: [
        {
          kind: 'module',
          id: '3.0',
          title: '污染规避策略 · 实验设计 · Table 2',
          desc: '四节呈现：① 三层规避策略 → ② 两项视觉测试 → ③ 污染分析表 → ④ 结论解读。',
          componentId: 'contamination-analysis',
        },
      ],
      takeaways: [
        { icon: '�️', title: '三层防御', desc: 'Web 审计 + UE5 重建 + 组合级独特性。' },
        { icon: '🧪', title: '两项实证测试', desc: '视觉新颖度 0.0% + 机制泄漏 50.0%（合理边界）。' },
        { icon: '�', title: '对照三类基准', desc: 'BALROG / LMGame-Bench / ORAK 在 Test B 上都 100%。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '创新点三：如何保证评估公正性？',
      badge: 'inf',
      badgeLabel: '评估设计',
      bridgeLabel: '从智能体覆盖与评估协议两个维度保证公正性',
      bridge: '评估公正在 OmniGameArena 中被拆成两个独立维度：① 待测智能体的覆盖是否足以代表"当前 VLM 生态"；② 评估协议本身是否把不同模型的"快/慢"能力差异排除在外。本节同时给出这两个答案。',
      modules: [
        {
          kind: 'module',
          id: '4.0',
          title: '① 智能体类型全面 ② 评估协议与规则',
          desc: '点击上方三个分类标签查看 9 类智能体；下方对照 PDQ 与 LCRT 两种时间协议。',
          componentId: 'fairness-design',
        },
      ],
      takeaways: [
        { icon: '�', title: '9 类智能体', desc: '4 商用闭源 + 2 开源 + 3 专用/基线（含 1 人类）。' },
        { icon: '⏸️', title: 'PDQ vs LCRT', desc: '一个看"应该做什么"，一个看"能不能跑起来"。' },
        { icon: '🎯', title: '规则独立', desc: '每款游戏单独的 success metric，避免单一分数掩盖差异。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: 'IDC：IDC架构的理解',
      badge: 'both',
      badgeLabel: '核心方法',
      bridgeLabel: 'IDC 是"带着复盘笔记本的超级游戏玩家"的进化模型',
      bridge: '本节是论文的核心：IDC 把"玩—反思—记—循环"四步做成可观测、可回滚、可复现的流程。点击下方四个阶段可看到小人随状态切换姿态，▶ 播放可看完整循环；末尾用 Table 3 的冷启动数据验证该框架确实让 VLM 学会了东西。',
      modules: [
        {
          kind: 'module',
          id: '5.0',
          title: 'IDC 进化模型 · Table 3 可视化',
          desc: '上半部分：可互动的小人动画（4 阶段 + rollback）；下半部分：冷启动 leaderboard 数据验证 IDC 有效性。',
          componentId: 'idc-architecture',
        },
        {
          kind: 'module',
          id: '5.1',
          title: 'IDC 迁移能力 · Table 5 变体可视化',
          desc: '4 款智能体在 origin / VAR1 / VAR2 / VAR3 上的迁移 ΔS：正=迁移成功，负=过拟合于原任务。',
          componentId: 'transfer-bars',
        },
      ],
      takeaways: [
        { icon: '🧠', title: '可回滚循环', desc: 'α=0.5 阈值让反思既能探索又不会灾难性漂移。' },
        { icon: '📓', title: '三件套持久化', desc: '经验笔记（≤2000）+ skill prompt（≤1200）+ IDC 曲线。' },
        { icon: '📊', title: '有效性证据', desc: 'Table 3：VLM 经过 IDC 后冷启动分数显著高于无 IDC。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '一些测试实验的"奇妙结论"',
      badge: 'exp',
      badgeLabel: '实验 / 数据',
      bridgeLabel: '从 Solo/PvP/Coop/IDC/变体 五个角度验证 OmniGameArena 的科学性',
      bridge: '本节汇总论文 Tables 3–5 与 Figures 5–6 的关键实验数据，按 Solo / PvP / Coop / IDC / 变体 五个维度呈现；所有数据均来自论文公开表格，每节附有"关键观察"结论。',
      modules: [
        {
          kind: 'module',
          id: '6.0',
          title: '实验数据 · 五个维度',
          desc: '🎮 Solo（Table 3）· ⚔️ PvP（Table 4）· 🤝 Coop（Table 4）· 📈 IDC（Figure 5）· 🔀 变体（Table 5）。',
          componentId: 'experimental-results',
        },
      ],
      takeaways: [
        { icon: '🎮', title: 'Solo 轮换', desc: 'GPT-5.5 / Opus 4.6 / Gemini 各有擅长游戏，无单一霸主。' },
        { icon: '⚔️', title: 'PvP 分化', desc: 'Qwen3.5 与 PPO+R2I 在 PvP 全 0 分。' },
        { icon: '🤝', title: 'Coop 是难题', desc: '所有 VLM Σ<1，Human 也只到 1.27。' },
        { icon: '📈', title: 'IDC 中段峰值', desc: 'R5~R6 冲到峰值后回落，α=0.5 防止归零。' },
        { icon: '🔀', title: 'GPT-5.5 举一反三', desc: '三变体全正，Opus 4.7 末段掉队。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-7',
      title: '局限性',
      badge: 'limit',
      badgeLabel: '局限 / 总结',
      bridgeLabel: '诚实的自我审视',
      bridge: 'OmniGameArena + IDC 是一个有意义的早期工作，但作者在论文 Limitations 部分明确承认六类尚未解决的问题——本节用卡片形式逐条展示，最后给出"贡献与未竟之业"的小结。',
      modules: [
        {
          kind: 'module',
          id: '7.0',
          title: '论文 Limitations 与小结',
          desc: '六条论文 Limitations + 一个小结（两件套贡献 / 未来工作）。',
          componentId: 'limitations',
        },
      ],
      takeaways: [
        { icon: '🎯', title: 'IDC 范围有限', desc: 'IDC 仅在 2 款游戏上跑过，未覆盖全部 12 款。' },
        { icon: '🤖', title: 'VLM 数量有限', desc: '主实验仅 4 款前沿 VLM，开源 VLM 未参与 IDC 循环。' },
        { icon: '�', title: '未消融分模型', desc: 'player / reflector 共模型，未做"更强 reflector"消融。' },
      ],
    },
  ],
};
