import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'Compressing the Validation Bottleneck: An Agentic Self-Driving Lab for Scientific Discovery',
    titleZh: '压缩验证瓶颈：面向科学发现的智能体自驱实验室',
    venue: 'arXiv 2607.04508v1 · ICML 2026 AI for Science Workshop / AI Scientist Competition',
    authors: 'Kyunghoon Hur, Chihun Lee',
    affiliation: 'Korea Electronics Technology Institute; Korea Institute of Materials Science',
    domain: 'AI for Science · Self-Driving Lab · Bayesian Optimization · Multi-fidelity Measurement',
    coreProblem:
      'AI 已经能很快提出想法、写计划、分析结果，但科学发现最后仍要回到真实实验。只要实验轮数多、每轮测量贵，整条自驱实验室闭环就会卡在验证上。',
    coreInsight:
      '把科学发现的验证负担看成 <b>L × C</b>：L 是达到目标前要跑多少轮真实实验，C 是每轮验证要付出的仪器、材料和时间成本。本文的 agentic SDL 仪表盘只盯住两件事：用 <b>prior-aware DOE</b> 降低 L，用 <b>cost-aware surrogate</b> 降低 C，同时保留可靠验证。',
    keywords: ['validation bottleneck', 'fewer loops', 'cheaper validation', 'agentic SDL'],
  },
  hero: {
    oldMethod: {
      desc: '<b>未压缩状态</b>：候选不断涌入，真实实验逐个排队；L 高、C 高，预算和时间被验证环节持续消耗。',
      componentId: 'lab-widget',
    },
    newMethod: {
      desc: '<b>压缩后状态</b>：agent 同时管理“下一轮做什么”和“何时真测”，把昂贵验证留给信息量最高、最需要确认的位置。',
      componentId: 'lab-widget',
    },
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '先看见：慢的不是想法，而是真实验证',
      badge: 'inf',
      badgeLabel: '核心问题',
      bridge:
        '论文的出发点不是“再造一个更会写论文的 AI”，而是指出 AI-for-Science 的物理瓶颈：上游生成得越快，下游实验验证越容易排队。',
      analogy: {
        title: '实验台前开始排队',
        text: '把每个科学想法想成一个等待验证的样品。AI 让样品来得更快，但仪器、材料和测量时间没有同步变多，队伍就会越排越长。',
        componentId: 'lab-widget',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '验证瓶颈拆解仪',
          desc: '分别拖动“候选想法涌入速度”和“真实测量强度”，观察 L 与 C 如何从不同位置放大验证负担。',
          componentId: 'lab-widget',
        },
        {
          kind: 'module',
          id: '1.2',
          title: '两处压缩位置：L 和 C',
          desc: '点击 L 或 C。先建立一个直觉：本文不是泛泛说“让 AI 更强”，而是明确压缩实验轮数和单轮验证成本。',
          componentId: 'lab-widget',
        },
      ],
      insight:
        '所以这篇论文压缩的不是抽象推理时间，而是真实验证里的两种浪费：loop count 和 cost per loop。',
      formula: {
        lead: '用一个教学化分解记住全文主线：',
        unicode: '验证负担 ≈ 实验轮数 L × 单轮成本 C',
        symbols: [
          { sym: 'L', desc: '达到目标前要经历多少轮真实实验反馈。' },
          { sym: 'C', desc: '每轮实验和测量消耗的时间、材料、仪器资源。' },
        ],
      },
      takeaways: [
        { icon: '01', title: '痛点', desc: 'AI 想得快，真实验证仍然慢。' },
        { icon: '02', title: '拆法', desc: '把验证负担拆成 L 和 C 两个可压缩位置。' },
        { icon: '03', title: '判断', desc: '后面的交互只服务一个问题：怎样更快完成可靠验证。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '第一处压缩：让下一轮实验更值得做',
      badge: 'inf',
      badgeLabel: '减少 L',
      bridge:
        '如果每轮实验都要真实执行，那么“下一轮做什么”就是核心决策。prior-aware DOE 的价值，是把领域先验、历史结果和可行性一起放进候选选择。',
      analogy: {
        title: '不是乱拿样品，而是带地图选样品',
        text: '没有地图时，实验可能先花在低价值区域；有先验地图和上一轮结果后，agent 会优先把样品推向更可能接近目标的位置。',
        componentId: 'lab-widget',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '随机/网格 vs prior-aware DOE',
          desc: '切换策略或播放演示。观察同样的候选空间里，随机/网格会绕更多步；prior-aware DOE 会把实验路径推向更有信息量、更可行的位置。',
          componentId: 'lab-widget',
        },
        {
          kind: 'module',
          id: '2.2',
          title: '下一轮不是只选“看起来最好”的点',
          desc: '拖动探索倾向。prior-aware DOE 还要在“当前看起来有希望”和“还不确定、值得探索”之间平衡。',
          componentId: 'lab-widget',
        },
      ],
      insight:
        '这里的“智能”不是 LLM 凭感觉选点，而是让先验 P、实验历史 H_t 和可行性约束共同影响下一轮 DOE。',
      formula: {
        lead: '可以把下一轮实验选择理解成：',
        unicode: 'x_next = argmax a(x | H_t, P, feasibility)',
        symbols: [
          { sym: 'H_t', desc: '到第 t 轮为止的实验结果和反馈。' },
          { sym: 'P', desc: '领域知识、文献线索、工艺经验等先验。' },
          { sym: 'feasibility', desc: '实验室能不能做、值不值得做的约束。' },
        ],
      },
      takeaways: [
        { icon: '01', title: '压缩点', desc: '减少达到目标前的无效实验轮数。' },
        { icon: '02', title: '关键动作', desc: '把先验和反馈变成下一轮 DOE 的约束。' },
        { icon: '03', title: '核心直觉', desc: '这不是盲目试错，而是带着地图接近目标。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '闭环要真的学习反馈，而不是看起来在循环',
      badge: 'both',
      badgeLabel: '反馈约束',
      bridge:
        '论文对 LLM 很克制：agentic 不等于让 LLM 单独拍脑袋。上一轮实验结果必须进入 surrogate 和 verifier，才会真正改变下一轮选择。',
      analogy: {
        title: '听到结果后再调方向',
        text: '如果实验结果只是被写进聊天历史，但下一轮动作几乎不变，这个闭环只是形式上的。真正的闭环要让反馈改变候选。',
        componentId: 'lab-widget',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '反馈走聊天历史，还是走 surrogate/verifier',
          desc: '切换反馈路径或播放演示。看清本文的谨慎之处：只有反馈进入 surrogate 与 verifier，下一轮候选轨迹才会真正改变。',
          componentId: 'lab-widget',
        },
      ],
      insight:
        '这一节的作用是防止误解：论文不是说“更相信 LLM”，而是说要把 LLM 放进可验证、可校准、可反馈的实验闭环。',
      takeaways: [
        { icon: '01', title: '闭环标准', desc: '反馈必须能改变下一轮候选。' },
        { icon: '02', title: '角色分工', desc: 'LLM 提方向，surrogate 学结果，verifier 守边界。' },
        { icon: '03', title: '风险降低', desc: '避免 agent 只是包装成闭环的文本生成器。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '第二处压缩：别把每个候选都送去昂贵测量',
      badge: 'inf',
      badgeLabel: '减少 C',
      bridge:
        '即使实验轮数减少了，如果每一轮都要做高成本、高分辨率测量，自驱实验室仍会被仪器吞吐量卡住。cost-aware surrogate 处理的是“每轮到底要不要真测”。',
      analogy: {
        title: '先筛查，再决定是否精检',
        text: '低成本测量像快速筛查。不确定性低时，用 surrogate 预测继续筛；不确定性高时，再把样品送去高成本测量。',
        componentId: 'lab-widget',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '不确定性闸门：全部真测 vs 有条件真测',
          desc: '拖动不确定性阈值。上方路径表示全部候选都真测；下方路径表示先按不确定性分流，高于阈值才进入高成本真测，低于阈值则由 surrogate 预测。',
          componentId: 'lab-widget',
        },
        {
          kind: 'module',
          id: '4.2',
          title: '低成本信号什么时候不能信',
          desc: '切换“信号相关”和“隐藏因素主导”。理解论文的边界：surrogate 只有在低成本信号确实含有信息时才省钱。',
          componentId: 'lab-widget',
        },
      ],
      insight:
        'surrogate 不是从弱信号里硬猜昂贵实验。论文强调：只有低成本信号含有足够信息、且预测不确定性可控时，才应该替代高成本测量。',
      formula: {
        lead: '第二条压缩线可以写成一个条件决策：',
        unicode: 'use prediction if u(x) < τ; otherwise measure high-cost',
        symbols: [
          { sym: 'u(x)', desc: '候选 x 上 surrogate 的预测不确定性。' },
          { sym: 'τ', desc: '允许信任预测的阈值，越严格越倾向真测。' },
        ],
      },
      takeaways: [
        { icon: '01', title: '压缩点', desc: '减少每轮不必要的高成本测量。' },
        { icon: '02', title: '关键动作', desc: '用校准不确定性决定何时信任 surrogate。' },
        { icon: '03', title: '科学边界', desc: '省成本不能牺牲可靠验证。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '两个案例只是落点，核心仍是同一个瓶颈',
      badge: 'trn',
      badgeLabel: '案例边界',
      bridge:
        '论文用两个领域说明两类压缩：抗体工艺开发强调更少实验轮数，金属增材制造强调更少昂贵表征。案例帮助理解，但不要把它讲成已经完成所有 benchmark 的结果大表。',
      analogy: {
        title: '两个实验室，共用一套思路',
        text: '生物侧关心“怎样更快找到培养条件”；材料侧关心“什么时候少做昂贵表征”。它们共同指向更快、更省的真实验证。',
        componentId: 'lab-widget',
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '案例切换：生物减少轮数，材料减少测量成本',
          desc: '点击两个案例，观察论文如何把同一个 validation bottleneck 放到不同物理场景中解释。',
          componentId: 'lab-widget',
        },
      ],
      insight:
        '这一步要讲清边界：硬度到拉伸强度、XRD/成分/CALPHAD 到相分数等代理关系都有适用条件，不能把便宜信号无条件当成真实验证。',
      takeaways: [
        { icon: '01', title: '生物案例', desc: 'prior-aware DOE 目标是减少 trials-to-target。' },
        { icon: '02', title: '材料案例', desc: '低成本信号帮助减少昂贵表征次数。' },
        { icon: '03', title: '边界意识', desc: '代理测量有条件，不可靠时必须回到真测。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '合起来：agentic SDL 压缩真实验证的两处浪费',
      badge: 'both',
      badgeLabel: '闭环收束',
      bridge:
        '最后把整篇论文收束成一张闭环图：agent 提出 DOE，实验室执行，测量结果回流；本文在这个闭环里同时标出两处可压缩的位置。',
      analogy: {
        title: '同一个闭环，少绕路也少花钱',
        text: '第一处压缩让闭环少跑低价值轮次，第二处压缩让每轮少做不必要的昂贵测量。二者合起来，才是面向科学发现的自驱实验室。',
        componentId: 'lab-widget',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '点击 SDL 闭环中的两个压缩位置',
          desc: '点击环节或播放演示，观察 prior-aware DOE 和 cost-aware surrogate 分别作用在哪里。最后记住：目标是在预算内更快完成可靠验证。',
          componentId: 'lab-widget',
        },
        {
          kind: 'module',
          id: '6.2',
          title: '三句话收束整篇论文',
          desc: '用问题、方法、价值三句话收束全文，把所有交互归纳成一条清晰的因果链。',
          componentId: 'lab-widget',
        },
      ],
      insight:
        '全文最后收束成一句话：AI 不是只要更会想，还要更会选择哪些实验值得做、哪些测量值得花钱真做。',
      formula: {
        lead: '把全文压成一句话：',
        unicode: '目标：降低 L × C，同时保持 reliable validation',
        symbols: [
          { sym: 'L', desc: '真实实验闭环轮数。' },
          { sym: 'C', desc: '单轮验证成本。' },
          { sym: 'reliable validation', desc: '科学结论仍必须经得起真实验证。' },
        ],
      },
      takeaways: [
        { icon: '01', title: '一句话问题', desc: '科学发现慢在真实验证。' },
        { icon: '02', title: '一句话方法', desc: 'DOE 减轮数，surrogate 减贵测量。' },
        { icon: '03', title: '一句话价值', desc: '更快、更省，但不放弃可靠性。' },
      ],
    },
  ],
};
