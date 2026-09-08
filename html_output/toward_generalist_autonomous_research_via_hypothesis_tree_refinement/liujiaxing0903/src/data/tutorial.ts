import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "Toward Generalist Autonomous Research via Hypothesis-Tree Refinement",
    titleZh: "迈向通用自主研究：基于假设树精炼的方法",
    venue: "arXiv 2606.11926v1 · 2026 技术报告",
    authors: "Jiajie Jin、Yuyang Hu、Kai Qiu 等",
    affiliation: "中国人民大学高瓴人工智能学院 · Microsoft Research",
    domain: "自主研究智能体 · 长时程系统 · 机器学习工程",
    coreProblem: "长时间运行的智能体会产生许多局部尝试，却缺少能保存竞争方向、失败证据和可复用洞见的持久研究状态。",
    coreInsight: "Arbor 用假设树绑定假设、制品、事实和洞见，再由协调器管理前沿、执行器隔离验证，使后续尝试受到既有证据约束。",
    contributions: [
      {
        label: "01",
        title: "形式化 AO",
        desc: "把自主研究操作化为：智能体在固定目标与评估器下，无逐步人工监督地持续改进可执行制品。"
      },
      {
        label: "02",
        title: "提出 Arbor 与 HTR",
        desc: "以长期协调器、短期隔离执行器和持久假设树，累积可审计的假设、制品、证据与洞见；论文同时开源研究系统。"
      },
      {
        label: "03",
        title: "构建并验证六项 AO 任务",
        desc: "六项真实任务均取得表内最佳留出结果，平均相对留出增益超过 Codex 与 Claude Code 的 2.5 倍；MLE-Bench Lite 达到 86.36% Any Medal。"
      }
    ],
    keywords: ["Arbor", "假设树精炼", "自主优化", "协调器-执行器", "留出合并门"]
  },
  hero: {
    oldMethod: {
      desc: "单轨执行：尝试很多，但失败原因和制品证据不会形成可操作的长期状态。",
      componentId: "hero-old"
    },
    newMethod: {
      desc: "90 秒看懂 Arbor：持久树组织方向，协调器选择前沿，隔离执行器验证假设，证据回传后仅由留出门批准合并。",
      componentId: "hero-new"
    }
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "研究问题与 AO 验证边界",
      badge: "inf",
      badgeLabel: "先建立问题",
      bridge: "更长运行可能增加尝试次数，但不会自动积累研究进步。要让搜索结果可验证，还必须预先分开初始制品、目标方向、开发反馈和留出验证。",
      analogy: {
        title: "从重复试错到持久研究",
        text: "如果每轮失败都从记录中消失，下一轮仍会回到同一类局部搜索；只有成功、失败和边界条件能够改变后续选择，运行历史才成为研究状态。",
        componentId: "orchard-scene"
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "让历史真正改变下一轮",
          desc: "在“临时对话状态”和“持久研究状态”之间切换，逐轮执行同一目标，观察此前证据是否改变下一次选择。该对比是教学演示，不是论文报告的实验指标。",
          componentId: "attempt-memory"
        },
        {
          kind: "module",
          id: "1.2",
          title: "锁定 AO 的四项契约",
          desc: "依次查看 M0、O、Edev、Etest 的定义、允许动作和泄漏风险；Edev 用于探索，Etest 只用于合并准入或最终验证。",
          componentId: "ao-contract"
        }
      ],
      insight: "更长运行可能带来更多尝试，但并不自动形成研究进步；只有此前的成功、失败和边界条件能约束下一步时，历史才成为可操作的研究状态。",
      formula: {
        lead: "论文把自主优化问题写成四项契约：",
        unicode: "P = (M0, O, Edev, Etest)",
        symbols: [
          { sym: "P", desc: "自主优化问题" },
          { sym: "M0", desc: "任务开始时的初始制品" },
          { sym: "O", desc: "规定优化目标和指标方向" },
          { sym: "Edev", desc: "可反复调用、用于探索的开发评估器" },
          { sym: "Etest", desc: "独立留出评估器，禁止作为探索预言机" }
        ]
      },
      takeaways: [
        { icon: "↻", title: "重复不等于积累", desc: "没有持久状态时，更多轮次可能只是重复同一类局部搜索。" },
        { icon: "◎", title: "开发与留出必须分开", desc: "Edev 可以指导探索，Etest 不能参与构思或前沿排序。" },
        { icon: "⇢", title: "边界先于优化", desc: "固定 M0、O 和评估权限，才能判断候选是否真正改进。" }
      ],
      speakerCue: {
        action: "先在 1.1 对比两种状态并执行到第四轮；再在 1.2 点击 Edev 与 Etest，观察允许动作和泄漏风险。",
        close: "更长运行可能带来更多尝试，但并不自动形成研究进步；只有此前的成功、失败和边界条件能约束下一步时，历史才成为可操作的研究状态。",
        transition: "有了验证边界，下一步需要一种结构，把假设、制品、证据和洞见绑定成可追溯的研究状态。"
      }
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "假设树：持久、可操作的研究状态",
      badge: "inf",
      badgeLabel: "理解核心表示",
      bridge: "一串分数只能说明结果高低，不能保存为什么尝试、产生了什么制品、得到什么事实以及这些事实如何影响后续方向。假设树把这些信息绑定到可追溯节点中。",
      analogy: {
        title: "把一次尝试装进完整节点",
        text: "节点不是待办事项：它同时保存可检验假设、实现该假设的制品引用、实验事实、状态与可复用洞见；树边表示假设的精炼关系，而不是简单时间线。",
        componentId: "orchard-scene"
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "把一次研究尝试变成节点",
          desc: "依次查看 hypothesis、insight 与 metadata，理解 BrowseComp N3.1 的假设、事实结果、制品引用和节点状态如何组成一条可追溯记录。",
          componentId: "hypothesis-node"
        }
      ],
      insight: "假设树是持久研究状态：每个节点把假设、实现它的制品版本、实验产生的证据，以及影响后续决策的提炼洞见绑定在一起；树边表示假设的精炼关系，而不是时间线。",
      formula: {
        lead: "论文将假设树及其节点写成：",
        unicode: "T = (V, E),   n = ⟨h_n, ι_n, μ_n⟩",
        symbols: [
          { sym: "T", desc: "由假设节点 V 和精炼关系 E 组成的持久树" },
          { sym: "h_n", desc: "节点 n 要验证的假设" },
          { sym: "ι_n", desc: "从实验事实提炼出的可复用洞见" },
          { sym: "μ_n", desc: "状态、开发分数、事实结果、制品引用与可选背景证据" }
        ]
      },
      takeaways: [
        { icon: "h", title: "假设说明为什么试", desc: "节点首先记录可检验方向，而不是只有最终结果。" },
        { icon: "ι", title: "洞见可以跨节点复用", desc: "局部实验结论能够约束同一路径或后续轮次。" },
        { icon: "μ", title: "元数据保证可追溯", desc: "状态、分数、事实、制品和证据共同保存。" }
      ],
      speakerCue: {
        action: "依次点击“可验证假设”“可复用洞见”和“制品与评估元数据”，观察一个节点如何保存完整研究事实。",
        close: "假设树是持久研究状态：每个节点把假设、实现它的制品版本、实验产生的证据，以及影响后续决策的提炼洞见绑定在一起；树边表示假设的精炼关系，而不是时间线。",
        transition: "有了持久状态，还需要一套循环规定怎样观察、提出假设、执行实验、回传证据并决定是否更新主干。"
      }
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "六步 HTR：让研究状态持续精炼",
      badge: "trn",
      badgeLabel: "掌握完整算法",
      bridge: "HTR 不是若干松散操作，而是 Observe、Ideate、Select、Dispatch、Backpropagate、Decide 六个阶段组成的循环；每轮都读取并更新持久研究状态。",
      analogy: {
        title: "六步循环保存研究状态",
        text: "每一步都有不同职责：观察现状、提出候选、选择前沿、派发固定假设、回传结构化证据，最后才在 Decide 中处理合并准入。",
        componentId: "orchard-scene"
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "亲手运行一轮 HTR",
          desc: "依次推进 Observe、Ideate、Select、Dispatch、Backpropagate、Decide：Select 基于树证据控制前沿而没有固定排名公式；当前批次执行完成后，Decide 先按开发分数选 n†，再只对该候选打开 Etest。",
          componentId: "htr-six-step-cycle"
        }
      ],
      insight: "HTR 按 Observe、Ideate、Select、Dispatch、Backpropagate、Decide 六步推进；持久假设树保存前沿、洞见、约束和决策，使研究状态可以恢复。",
      formula: {
        lead: "自主优化的制品级目标是在候选集合中找到留出表现最好的制品，同时禁止把 Etest 用作探索预言机：",
        unicode: "M* = argmax_{M' ∈ A} S_test(M')",
        symbols: [
          { sym: "A", desc: "探索过程产生的候选制品集合" },
          { sym: "S_test", desc: "独立留出评估对应的目标得分" },
          { sym: "M*", desc: "最终由留出验证确认的最佳制品" }
        ]
      },
      takeaways: [
        { icon: "①", title: "六个职责不可混用", desc: "构思、执行、证据回传与留出决策处于不同阶段。" },
        { icon: "②", title: "状态跨轮保存", desc: "树、制品引用、事实、洞见和决策共同形成可恢复记录。" },
        { icon: "③", title: "Etest 不参与构思", desc: "Etest 只在每轮 Decide 的合并准入或最终验证中使用。" }
      ],
      speakerCue: {
        action: "连续点击“下一步”走完六个阶段，重点观察 Etest 何时从 LOCKED 变为 OPEN，以及证据何时写回研究状态。",
        close: "HTR 按 Observe、Ideate、Select、Dispatch、Backpropagate、Decide 六步推进；持久假设树保存前沿、洞见、约束和决策，使研究状态可以恢复。",
        transition: "下面深入一轮循环中最关键的因果关系：局部实验事实如何变成全局约束，并进一步决定剪枝、细化或进入合并准入。"
      }
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "从局部证据到下一轮决策",
      badge: "both",
      badgeLabel: "证据驱动精炼",
      bridge: "Figure 6 展示的方向变化不是简单追逐最高开发分，而是把局部实验事实提炼成可复用洞见：验证问题逐步转向候选覆盖，再转向保持独立性的证据共享。",
      analogy: {
        title: "证据沿路径回到全局状态",
        text: "局部节点先返回事实，再由协调器抽象出可复用洞见并更新祖先约束；剪枝停止未来预算投入，但不会删除已经获得的事实和洞见。",
        componentId: "orchard-scene"
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "把局部实验回传成全局约束",
          desc: "按 Figure 6 的已报告节点逐步查看验证事实、覆盖瓶颈、evidence dossier 假设和后续约束；画布中的祖先层级是机制示意，不重建论文未报告的 parent_id。",
          componentId: "htr-backprop-lab"
        },
        {
          kind: "module",
          id: "4.2",
          title: "依据事实决定剪枝、细化或进入准入",
          desc: "比较 N1.1、N6.2 与 N8.1 的开发分数、论文状态和机制证据；开发分数不是唯一依据，pruned 也不等于证据被删除。",
          componentId: "prune-refine-decision"
        }
      ],
      insight: "回传不是只写回分数，而是把局部实验事实抽象成可复用洞见并更新全局约束；剪枝减少未来预算消耗，但保留历史证据供后续构思使用。",
      takeaways: [
        { icon: "①", title: "事实先于解释", desc: "先记录实验结果和论文状态，再从机制证据提炼洞见。" },
        { icon: "②", title: "问题会随证据转向", desc: "验证不足、候选覆盖和证据共享是逐步收紧的研究问题。" },
        { icon: "③", title: "最高开发分不必然保留", desc: "N6.2 达到 75.0%，仍因存在对开发问题过拟合的风险而被论文记录为 pruned。" }
      ],
      speakerCue: {
        action: "在 4.1 依次点击四个回传阶段；再在 4.2 比较 N6.2 与 N8.1，分别选择“剪枝该路线”和“进入合并准入”。",
        close: "回传不是只写回分数，而是把局部实验事实抽象成可复用洞见并更新全局约束；剪枝减少未来预算消耗，但保留历史证据供后续构思使用。",
        transition: "证据决定了值得继续验证的候选，接下来要看协调器怎样派发隔离执行任务，以及 Etest 怎样在 Decide 中执行严格合并准入。"
      }
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "协调执行、隔离验证与留出合并",
      badge: "trn",
      badgeLabel: "系统执行边界",
      bridge: "长时协调器维护共享研究状态，短时执行器只验证一条固定假设。候选必须从当前 Mbest 的新隔离 worktree 开始，并在 Decide 中通过独立留出门才能替换主干。",
      analogy: {
        title: "协调器派发隔离执行任务",
        text: "协调器拥有全局状态并选择假设；执行器只在隔离环境中实现和测试该假设；留出门不向探索阶段泄漏信号，只依据严格改善规则决定是否更新 Mbest。",
        componentId: "orchard-scene"
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "分清两类智能体与门控组件",
          desc: "点击协调器、执行器和留出门，查看两类智能体与一个准入组件各自持有的状态、允许动作与禁止动作；worktree、Edev、Tree Store 和 Mbest 表示资源归属，而不是一条严格线性流水线。",
          componentId: "coordinator-executor-map"
        },
        {
          kind: "module",
          id: "5.2",
          title: "在 Decide 中执行严格改善规则",
          desc: "Explore 阶段保持 Etest 锁定；当前批次执行完成后，先按开发分数选 n† = argmax sₙ，再在 Decide 中比较其制品 M' 与当前 Mbest 的留出目标值。该交互验证严格提高、持平和下降三种算法条件，不是论文报告的节点分数。",
          componentId: "heldout-merge-gate"
        }
      ],
      insight: "协调器维护全局研究状态，执行器在从 Mbest 创建的新隔离 worktree 中测试固定假设；Etest 只在 Decide 中执行准入，只有留出目标值严格改善时才替换 Mbest。",
      formula: {
        lead: "Algorithm 1 的合并条件是留出目标值严格改善：",
        unicode: "merge(M') ⇔ O(Etest(M')) > O(Etest(Mbest))",
        symbols: [
          { sym: "M'", desc: "隔离 worktree 产生的候选制品" },
          { sym: "Mbest", desc: "合并前的当前最佳制品" },
          { sym: "Etest", desc: "独立留出评估器，禁止用于探索" },
          { sym: "O", desc: "把评估结果按目标方向统一成越大越好的效用" }
        ]
      },
      takeaways: [
        { icon: "①", title: "协调器拥有共享状态", desc: "它选择假设、更新树并派发任务，但不直接编辑候选制品。" },
        { icon: "②", title: "执行器拥有隔离工作树", desc: "每个候选从当前 Mbest 的新 worktree 开始，不能污染主干或兄弟分支。" },
        { icon: "③", title: "严格提高才合并", desc: "留出目标值持平或下降时都保持 Mbest 不变。" }
      ],
      speakerCue: {
        action: "在 5.1 依次点击协调器、执行器和留出门；在 5.2 从 Explore 进入 Decide，再切换“严格提高”“持平”“下降”观察合并结果。",
        close: "协调器维护全局研究状态，执行器在从 Mbest 创建的新隔离 worktree 中测试固定假设；Etest 只在 Decide 中执行准入，只有留出目标值严格改善时才替换 Mbest。",
        transition: "最后检验这套结构是否有效：分别看主要结果、消融、冻结 harness 迁移，以及论文明确承认的适用边界。"
      }
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "实验结果、消融、迁移与边界",
      badge: "both",
      badgeLabel: "证据与局限",
      bridge: "实验数字只有放回各自的数据集、评估协议、指标方向与预算条件中才有意义。论文同时报告主要结果、结构消融、冻结 harness 迁移和系统局限。",
      analogy: {
        title: "按协议分别核验结果",
        text: "不同任务使用不同指标方向和评估协议，不能把所有数字混成一张排行榜；实验结论也只能在论文给定的任务、评估器、预算和基础设施范围内成立。",
        componentId: "orchard-scene"
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "把三组实验分开看",
          desc: "分别查看 Table 2 的六项 AO 任务及完整 dev/test 基线、Table 3 的 MLE-Bench Lite 系统对照，以及 Figure 3(b) 的冻结 harness 跨任务迁移。",
          componentId: "metric-direction-board"
        },
        {
          kind: "module",
          id: "6.2",
          title: "拆开论文贡献与适用边界",
          desc: "选择主结果、消融、迁移证据或论文局限，重点检查任务范围、固定标量目标、创意生成、系统成本和基础模型依赖。结论只在给定实验协议下成立；该图是适用范围示意，不是 Arbor 执行流程。",
          componentId: "evidence-boundary-map"
        }
      ],
      insight: "Arbor 的核心贡献是把研究状态变成持久、可操作、可验证的对象；现有结果并不等于通用科学发现能力。",
      takeaways: [
        { icon: "①", title: "先看指标与协议", desc: "steps、loss、pass、accuracy 和 gap 的方向及评估协议必须分别解释。" },
        { icon: "②", title: "消融支持结构价值", desc: "完整 Arbor 为 81.82%，去树为 63.64%，去洞见回传为 54.54%。" },
        { icon: "③", title: "结论受范围约束", desc: "当前任务与固定标量评估器不能代表所有开放科学发现问题。" }
      ],
      speakerCue: {
        action: "在 6.1 选择一项 AO 任务，先读 M0、目标和 dev/test 协议，再查看留出结果；在 6.2 点击“主结果”“树与洞见消融”，最后切到“范围局限”和“创意生成”。",
        close: "Arbor 的核心贡献是把研究状态变成持久、可操作、可验证的对象；现有结果并不等于通用科学发现能力。",
        transition: "在六项真实 AO 任务中，Arbor 取得表内最好的留出结果，但不能据此声称 Arbor 在所有开放式科研任务上都更优。"
      }
    }
  ],
  bilibili: [
    {
      bvid: "BV1tCJj62EQH",
      title: "Toward Generalist Autonomous Research via Hypothesis-Tree Refinement",
      reason: "直接介绍本论文与 Arbor 框架；主题高度相关，因此即使播放量较低也保留。"
    },
    {
      bvid: "BV1qaPZzHESy",
      title: "Agent 落地实战：用大模型构建自己的科研助理",
      reason: "补充科研智能体的工程化背景与应用视角。",
      views: "1.1万播放"
    },
    {
      bvid: "BV1xoCTBzE8Y",
      title: "吴恩达 DeepLearning.AI 科研智能体课程",
      reason: "从课程视角扩展自主科研智能体的整体背景。"
    }
  ]
};
