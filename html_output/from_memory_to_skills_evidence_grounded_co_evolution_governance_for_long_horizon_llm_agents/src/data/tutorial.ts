import type { TutorialData } from "../types";

export const tutorial: TutorialData = {
  meta: {
    titleEn:
      "From Memory to Skills: Evidence-Grounded Co-Evolution Governance for Long-Horizon LLM Agents",
    titleZh: "从记忆到技能：面向长程 LLM 智能体的证据驱动协同演化治理",
    venue: "arXiv:2607.16621v1 · EMNLP 2026 投稿",
    authors:
      "Bo Tang, Yang Zhang, Guomian Zhuang, Wenqiang Wei, Gaoyang Zheng, Lindong Xie, Yanchao Tan, Feiyu Xiong, Qingyu Yang, Edward Chung, Zhiyu Li",
    affiliation: "论文缓存未提供机构信息",
    domain: "长程 LLM 智能体 · 记忆系统 · 技能治理",
    coreProblem:
      "许多长程智能体只把旧轨迹作为被动上下文再次阅读，既浪费推理成本，也难以把含噪经历安全地变成可调用能力。",
    coreInsight:
      "<b>MSCE</b> 分层保存证据、程序策略和环境认知，并让通过证据、收益与稳定性门槛的 L2 策略结晶为带边界、验证和可靠性记录的技能。",
    keywords: ["MSCE", "长程智能体", "记忆治理", "技能结晶", "价值回填"],
  },
  hero: {
    oldMethod: {
      desc: "旧方法像骑车遇到掉链时反复翻看维修日记：记得发生过什么，却仍要重新摸索。",
      componentId: "hero-bike-compare",
    },
    newMethod: {
      desc: "MSCE 把有效维修经验治理成可验证、可调用、会随成败更新可靠性的技能。",
      componentId: "hero-bike-compare",
    },
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "记忆不等于技能",
      badge: "inf",
      badgeLabel: "推理基础",
      bridge:
        "一次修好，不等于下次会修。长程代理常把成功、失败和环境偶然项一起存进记忆；检索时，它得到的仍只是“过去发生了什么”，还要重新推理“现在该怎么做”。MSCE 的起点不是继续堆积记录，而是把证据、可修订程序、环境认知和可调用技能分开治理。",
      analogy: {
        title: "翻遍维修本，车链也不会自己归位",
        text: "旧记忆像一本越写越厚的维修本：它能提醒骑手过去发生过什么，却不会自动变成“何时修、怎么修、修完怎样验”的工具。这个类比说明的是接口差别，并不代表所有记忆系统都无法行动。",
        componentId: "bike-analogy",
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "同一条掉链：重读痕迹，还是调用技能？",
          desc: "两侧从完全相同的故障和时间基准出发。左侧显示取回痕迹后重新抽象的循环；右侧依次完成匹配触发与边界、执行标准程序、验证或回退。比较的是行动接口，不是真实成功率或速度测试。",
          componentId: "foundation-lab",
        },
        {
          kind: "module",
          id: "1.2",
          title: "一堆记录，还是四个职责？",
          desc: "先看生活映射：平铺记忆像同一本维修本，混写“发生了什么、应该怎么做、环境怎样”，检索后仍需重新分辨。MSCE 则把检修记录、维修步骤、路况卡和认证工具放在四个固定位置，分别对应 L1 证据、L2 程序、L3 环境认知与 K 技能；只有通过治理的 L2 才能进入技能库。",
          componentId: "foundation-lab",
        },
      ],
      insight:
        "核心转折：把经历直接放回上下文，只是记住；把有证据、边界和验证规则的程序暴露为调用接口，才是技能。",
      formula: {
        lead: "MSCE 更新的是外部认知状态 M 和技能库 K，不更新基础 LLM 参数。",
        unicode: "M = (M₁, M₂, M₃),  K = 技能库",
        symbols: [
          {
            sym: "M₁",
            desc: "L1 可审计轨迹证据层，保存可追溯的单步证据。",
          },
          {
            sym: "M₂",
            desc: "L2 可修订程序策略层，归纳有支持的可复用程序。",
          },
          {
            sym: "M₃",
            desc: "L3 声明式环境认知层，描述环境实体、规律和约束，不执行配方。",
          },
          {
            sym: "K",
            desc: "经过治理后暴露给代理的可调用技能库。",
          },
        ],
      },
      takeaways: [
        {
          icon: "◎",
          title: "轨迹是证据",
          desc: "被检索的轨迹不等于可执行能力。",
        },
        {
          icon: "≡",
          title: "职责要分开",
          desc: "L1、L2、L3 与 K 各自承担不同接口。",
        },
        {
          icon: "✓",
          title: "调用仍有边界",
          desc: "技能带验证与回退，可调用不等于必然成功。",
        },
      ],
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "L1：把每一步变成可追溯证据",
      badge: "inf",
      badgeLabel: "推理基础",
      bridge:
        "既然不能把一整段经历直接封装成技能，第一步就要回答：究竟保存哪一个可审计的决策单位？MSCE 把每一步拆成情境 s、原子动作 a、环境观测 o 和自我反思 ρ；回合结束后，再补上治理价值 V。",
      analogy: {
        title: "先定位哪一环松了",
        text: "“刚才出了问题”太粗。L1 要分别保存当时的情境、动作、环境回应和反思，再在回合结束后补上治理价值。自行车记录只是教学类比，不是论文实验数据。",
        componentId: "bike-analogy",
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "点开一条 L1：五个字段各管什么？",
          desc: "一条 L1 证据把代理做了什么、环境真的返回什么和代理如何反思分开保存。V 在交互时仍是“待回填”，不会提前生成数字。",
          componentId: "foundation-lab",
        },
      ],
      insight:
        "可审计性来自分开记录“代理做了什么”和“环境真的返回什么”；V 也刻意延后，避免把当下猜测伪装成结果。",
      formula: {
        lead: "一次 L1 决策先保存四个交互字段，终局后再补上 V。",
        unicode: "fᵢ,ₜ = (sᵢ,ₜ, aᵢ,ₜ, oᵢ,ₜ, ρᵢ,ₜ);  L1 = (s, a, o, ρ, V)",
        symbols: [
          {
            sym: "i, t",
            desc: "i 是回合编号，t 是回合中的步骤编号。",
          },
          {
            sym: "s",
            desc: "当前步骤的语义情境。",
          },
          {
            sym: "a",
            desc: "代理实际执行的原子动作。",
          },
          {
            sym: "o",
            desc: "环境对动作返回的观测。",
          },
          {
            sym: "ρ",
            desc: "代理的局部自我反思，可能包含噪声。",
          },
          {
            sym: "V",
            desc: "终局反馈后写入的治理价值，不是因果功劳。",
          },
        ],
      },
      takeaways: [
        {
          icon: "①",
          title: "拆到单步",
          desc: "L1 的基本证据单元不是整段未切分轨迹。",
        },
        {
          icon: "↔",
          title: "观测不等于猜测",
          desc: "环境观测 o 与自我反思 ρ 分开保存。",
        },
        {
          icon: "V",
          title: "价值延后写入",
          desc: "V 在终局反馈后回填，并保留证据链接。",
        },
      ],
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "反思加权价值回填",
      badge: "both",
      badgeLabel: "推理 / 演化",
      bridge:
        "αₜ 并不是凭空设定的系数。L1 先保存当前步骤的情境 sₜ、动作 aₜ、观测 oₜ 与自我反思 ρₜ；反思评分提示 Π_reflexion_score 再让辅助 LLM 核对反思是否忠实、具体、具有局部因果洞察且可迁移，输出该步骤自己的 αₜ∈[0,1]。终局反馈 R 到达后，αₜ 才进入价值回填公式。",
      analogy: {
        title: "先核对检修笔记，再决定回填比例",
        text: "评分器先把检修笔记与当时的故障、操作和结果逐项核对，再输出反思权重 α。可信且具体的反思通常得到更高权重；空泛、同义反复或无依据的反思得到低值或 0。扳手力度只是这一评分过程的生活类比，不代表因果功劳。",
        componentId: "bike-analogy",
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "α 从哪里来，又怎样影响回填？",
          desc: "先沿着论文 §4.4 与附录 Reflection Scoring 的链路追踪 αₜ：单步记录 (sₜ,aₜ,oₜ,ρₜ) 经提示评分器 Π_reflexion_score 输出 {alpha, usable, reason}。随后用滑杆替换这个输出做敏感性演示；R=0.8、γ=0.9、Vₜ₊₁=0.8 固定为附录算例条件。",
          componentId: "foundation-lab",
        },
      ],
      insight:
        "αₜ 是辅助评分器依据当前反思与单步证据产生的逐步输出，不是用户手调的全局超参数，也不是从 R 或 V 反推的因果功劳。论文给出了评分提示与准则，没有给出可手算的 α 解析式。",
      formula: {
        lead: "评分器先产生每步 αₜ；终点步接收 R 后，更早步骤才用它混合终局反馈与折扣后的后继价值。",
        unicode: "Vₜ = αₜR + (1−αₜ)γVₜ₊₁,  V_H = R",
        symbols: [
          {
            sym: "Vₜ",
            desc: "第 t 步在回合结束后得到的治理价值，不是因果信用。",
          },
          {
            sym: "R",
            desc: "回合终局的验证器奖励或量化文本反馈。",
          },
          {
            sym: "αₜ",
            desc: "反思评分提示 Π_reflexion_score 根据 (sₜ,aₜ,oₜ,ρₜ) 让辅助 LLM 估计的逐步权重，范围为 [0,1]；不是全局超参数。",
          },
          {
            sym: "γ",
            desc: "后继价值折扣因子，取值范围为 [0,1)。",
          },
          {
            sym: "Vₜ₊₁",
            desc: "下一步骤已经回填的治理价值。",
          },
          {
            sym: "H",
            desc: "终点步骤，满足 V_H=R。",
          },
        ],
      },
      takeaways: [
        {
          icon: "ρ",
          title: "先有单步反思",
          desc: "ρ 与 s、a、o 一起构成评分器输入。",
        },
        {
          icon: "α",
          title: "评分器产生 α",
          desc: "辅助 LLM 按四项准则逐步评分。",
        },
        {
          icon: "V",
          title: "最后进入回填",
          desc: "0.7 与 0.776 只属于附录算例。",
        },
      ],
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "L2：从重复证据归纳程序策略",
      badge: "trn",
      badgeLabel: "外部演化",
      bridge:
        "L1 已有回填价值，但一条高价值轨迹仍不足以成为可修订程序。本节比较关联证据与对照证据，同时守住非因果边界。",
      analogy: {
        title: "顺手，不等于因果",
        text: "扳手更贴合只说明这组维修记录更好；<b>启发式策略增益</b>可以支持治理判断，却不是因果证明。",
        componentId: "bike-analogy",
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "拖动“使用策略”一侧，看 G 能说明什么",
          desc: "关联策略与比较集合的聚合差异可以形成治理信号，但正差异既不证明因果，也不会自动完成技能结晶。",
          componentId: "governance-lab",
        },
      ],
      insight:
        "L2 的价值在于可比较、可修订；正增益只把程序送往下一轮治理，而不是把相关性改写成因果性。",
      formula: {
        lead: "比较关联策略与比较集合的聚合轨迹价值，再把结果当作启发式治理信号。",
        unicode: "G(f₂) = mean(V_with) − mean_blend(S_without)",
        symbols: [
          {
            sym: "G(f₂)",
            desc: "L2 策略 f₂ 的启发式策略增益；它是治理信号，不是因果效应估计。",
          },
          {
            sym: "V_with",
            desc: "与该 L2 策略关联的 L1 轨迹价值集合。",
          },
          {
            sym: "S_without",
            desc: "没有关联该策略的比较轨迹集合。",
          },
          {
            sym: "mean_blend",
            desc: "比较集合的混合聚合；页面不发明论文未给出的样本量或阈值。",
          },
        ],
      },
      takeaways: [
        {
          icon: "⚖️",
          title: "先做比较",
          desc: "L2 保留支持轨迹并与比较集合聚合值比较。",
        },
        {
          icon: "⛔",
          title: "拒绝因果化",
          desc: "正增益不是策略导致成功的证明。",
        },
        {
          icon: "➡️",
          title: "只进下一关",
          desc: "增益支持治理检查，真正结晶还需稳定性与校验。",
        },
      ],
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "L3：环境知识不是操作配方",
      badge: "both",
      badgeLabel: "分层认知",
      bridge:
        "程序说明怎么做，但长期代理还要单独知道环境怎样组织。本节把证据、程序和环境知识放回各自职责，避免重新混成一个池。",
      analogy: {
        title: "灯照地图，不替你骑车",
        text: "<b>地图</b>说明路况，<b>骑法</b>说明下一步动作；灯照亮前者，却不替你踩踏。",
        componentId: "bike-analogy",
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "先看三层怎样形成，再看调用时怎样协作",
          desc: "关系总览分成两段：形成或更新时，多回合 L1 证据支持归纳 L2，多个活跃 L2 可进一步抽象 L3；这是受治理的更新来源，不是单条记录自动逐级升级。调用时，L2 提供程序 π 与验证 κ，L3 仅并行补充 E/I/C 环境先验，不能改写 π。",
          componentId: "governance-lab",
        },
      ],
      insight:
        "分层不只是把三种内容分开存：形成时要保留证据支持关系，调用时还要让程序路径与环境先验路径并行且互不越权。",
      formula: {
        lead: "MSCE 把外部认知状态拆成三个保持证据链接、但职责不同的层。",
        unicode: "M = (M₁, M₂, M₃)",
        symbols: [
          {
            sym: "M₁",
            desc: "L1 可审计轨迹证据层，保存发生过什么并保留追溯链接。",
          },
          {
            sym: "M₂",
            desc: "L2 可修订程序策略层，在触发条件和适用边界内说明怎么做。",
          },
          {
            sym: "M₃",
            desc: "L3 声明式环境认知层，描述实体、规律和约束，不充当操作配方。",
          },
        ],
      },
      takeaways: [
        {
          icon: "🗂️",
          title: "三层不混池",
          desc: "证据、程序与环境知识分开保存。",
        },
        {
          icon: "🗺️",
          title: "L3 只讲环境",
          desc: "它描述实体、规律和约束，不是步骤清单。",
        },
        {
          icon: "🔗",
          title: "连接不等于覆盖",
          desc: "环境先验可帮助实例化参数，但不能覆盖程序。",
        },
      ],
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "技能结晶：通过三道治理门",
      badge: "trn",
      badgeLabel: "晋升治理",
      bridge:
        "L2 仍是内部、可修订的程序抽象。本节检查它何时有资格完成技能结晶，以及不受证据支持的草稿为何必须被拒绝。",
      analogy: {
        title: "读数好看，还要验表",
        text: "指针必须依次经过证据、稳定性与校验关口，策略才获得<b>可调用</b>资格。",
        componentId: "bike-analogy",
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "逐关审查一份技能草稿",
          desc: "证据、正的启发式策略增益、近期稳定性和确定性校验共同约束晋升；声明未观察工具的草稿不会暴露给代理。",
          componentId: "governance-lab",
        },
      ],
      insight:
        "技能结晶不是把一次成功包装成按钮，而是把有证据、有边界、稳定且可校验的程序变成受治理调用对象。",
      formula: {
        lead: "通过治理后，L2 策略才被封装为包含证据、指引和可靠性的标准化对象。",
        unicode: "k = (φ, π, κ, B, A, D, η)",
        symbols: [
          {
            sym: "φ",
            desc: "技能的触发条件。",
          },
          {
            sym: "π",
            desc: "可执行程序。",
          },
          {
            sym: "κ",
            desc: "验证或回退规则。",
          },
          {
            sym: "B",
            desc: "技能的适用边界。",
          },
          {
            sym: "A",
            desc: "保留可追溯关系的证据锚点。",
          },
          {
            sym: "D",
            desc: "失败、纠正和适用判断形成的决策指引。",
          },
          {
            sym: "η",
            desc: "随后续调用成败更新的可靠性估计。",
          },
        ],
      },
      takeaways: [
        {
          icon: "🚦",
          title: "资格不是自动的",
          desc: "证据、正增益和近期稳定共同决定晋升资格。",
        },
        {
          icon: "🛡️",
          title: "校验可以拒绝",
          desc: "schema、证据或工具白名单失败时草稿被丢弃。",
        },
        {
          icon: "🧰",
          title: "结晶不是改名",
          desc: "技能加入证据锚点、指引和生命周期状态。",
        },
      ],
    },
    {
      kind: "chapter",
      id: "chap-7",
      title: "调用之后：可靠性、修正与归档",
      badge: "trn",
      badgeLabel: "调用 / 演化",
      bridge:
        "获得调用资格后，技能仍要接受每次真实调用的检验。本节让成功、失败与纠正持续更新可靠性，并触发生命周期复查。",
      analogy: {
        title: "每次转动都留下记录",
        text: "车轮每次通过或打滑都会改写<b>可靠性估计</b>；获得资格后仍要持续维护。",
        componentId: "bike-analogy",
      },
      modules: [
        {
          kind: "module",
          id: "7.1",
          title: "记录调用结果，观察 η 如何变化",
          desc: "可靠性估计 η 由调用历史谨慎更新；它是可修订的治理信号，不是永久信誉、因果信用或安全证明。",
          componentId: "governance-lab",
        },
      ],
      insight:
        "技能库会随调用证据维护自身，但“不更新基础 LLM 参数”只说明训练方式，并不等于没有更新开销。",
      formula: {
        lead: "少量记录时，拉普拉斯平滑避免把一次成败直接变成绝对结论。",
        unicode: "η = (n_pass + 1) / (n_trial + 2)",
        symbols: [
          {
            sym: "η",
            desc: "可靠性估计 η（拉普拉斯平滑），数值越高表示历史调用更可靠，但生命周期阈值未被固定。",
          },
          {
            sym: "n_pass",
            desc: "通过的技能调用次数。",
          },
          {
            sym: "n_trial",
            desc: "技能调用总次数，始终满足 n_pass ≤ n_trial。",
          },
        ],
      },
      takeaways: [
        {
          icon: "🧭",
          title: "谨慎起步",
          desc: "少量调用不会立刻产生极端可靠性。",
        },
        {
          icon: "🔄",
          title: "成败持续更新",
          desc: "失败会触发边界和生命周期复查。",
        },
        {
          icon: "⚙️",
          title: "外部演化有成本",
          desc: "不更新参数不等于没有算子开销。",
        },
      ],
    },
    {
      kind: "chapter",
      id: "chap-8",
      title: "MSCE 如何让记忆与技能共同演化",
      badge: "both",
      badgeLabel: "系统总览",
      bridge:
        "前面分别看过分层、晋升和可靠性，现在把它们放回一轮完整任务：真正在线演化的是外部认知状态，而不是基础 LLM 参数。",
      analogy: {
        title: "骑完一圈，更新的是记录与工具盒",
        text: "一次骑行留下检修证据，反复有效的程序经过治理后进入工具盒，供下一圈调用。<b>骑手对应的基础模型参数没有被重新训练</b>。",
        componentId: "bike-analogy",
      },
      modules: [
        {
          kind: "module",
          id: "8.1",
          title: "点亮一轮记忆—技能共同演化",
          desc: "逐步查看任务怎样进入 L1、回填价值、更新 L2/L3，再经过门槛进入技能库；关闭任一门槛会立即显示回退或丢弃。",
          componentId: "evidence-lab",
        },
      ],
      insight:
        "共同演化发生在外部认知状态之间；每次调用的新证据又会修订下一轮可用的记忆与技能。",
      formula: {
        lead: "M 表示三层外部记忆，K 是治理后的技能库；它们不是基础模型参数。",
        unicode: "M = (M₁, M₂, M₃),  外部状态 = (M, K)",
        symbols: [
          {
            sym: "M₁",
            desc: "L1 可审计轨迹证据层。",
          },
          {
            sym: "M₂",
            desc: "L2 可修订程序策略层。",
          },
          {
            sym: "M₃",
            desc: "L3 声明式环境认知层。",
          },
          {
            sym: "K",
            desc: "通过治理后暴露给代理的技能库。",
          },
        ],
      },
      takeaways: [
        {
          icon: "1",
          title: "证据先行",
          desc: "原始轨迹先进入 L1，再支持 L2 和 L3。",
        },
        {
          icon: "2",
          title: "晋升受治理",
          desc: "增益、稳定性和确定性校验缺一不可。",
        },
        {
          icon: "3",
          title: "模型参数不变",
          desc: "在线演化的是外部认知状态，提示式更新仍有成本。",
        },
      ],
    },
    {
      kind: "chapter",
      id: "chap-9",
      title: "从 Alpine 到 Debian：原则如何迁移",
      badge: "inf",
      badgeLabel: "工作示例",
      bridge:
        "完整闭环最终要落到具体任务。本章用两次依赖安装经历区分可迁移的程序原则与必须按环境重定的参数。",
      analogy: {
        title: "同一把扳手，开口要适配",
        text: "维修原则不变，扳手开口却要按当前螺栓调整。技能迁移应保留诊断与重试原则，不能照抄 Alpine 的环境细节。",
        componentId: "bike-analogy",
      },
      modules: [
        {
          kind: "module",
          id: "9.1",
          title: "沿两条证据轨迹归纳一个可迁移原则",
          desc: "逐步查看 Alpine 与 Debian 两组证据，复现附录的 0.776，并判断迁移时什么应保留、什么必须重新确定。",
          componentId: "evidence-lab",
        },
      ],
      insight:
        "可迁移的是程序原则，不是源环境的包名；证据链接和适用边界决定复用能走多远。",
      formula: {
        lead: "附录把关键发现步骤的治理价值具体算出来；这不是基准准确率。",
        unicode: "V = 0.7×0.8 + (1−0.7)×0.9×0.8 = 0.776",
        symbols: [
          {
            sym: "V",
            desc: "关键发现步骤的回填治理价值，不是因果信用。",
          },
          {
            sym: "0.7",
            desc: "附录示例中的反思权重 α。",
          },
          {
            sym: "0.9",
            desc: "附录示例中的折扣 γ。",
          },
          {
            sym: "0.776",
            desc: "仅在该组给定数值下得到的工作示例结果。",
          },
        ],
      },
      takeaways: [
        {
          icon: "1",
          title: "算例是 0.776",
          desc: "它属于附录给定条件，不是实验准确率。",
        },
        {
          icon: "2",
          title: "保留原则、调整参数",
          desc: "包管理器和开发库随目标环境重新确定。",
        },
        {
          icon: "3",
          title: "迁移成本不统一",
          desc: "六对平均提升 3.93 个百分点，但成本效果混合。",
        },
      ],
    },
    {
      kind: "chapter",
      id: "chap-10",
      title: "结果、消融与适用边界",
      badge: "both",
      badgeLabel: "证据总结",
      bridge:
        "最后不能只引用最高分：准确率要和成本、消融、迁移协议及限制一起读，才能得到强度合适的结论。",
      analogy: {
        title: "跑得更远，也要看赛道和成本牌",
        text: "自行车只按论文报告的百分点变化前进；成本与适用边界另列检查。车的位置不能跨协议比较，也不代表因果机制已被证明。",
        componentId: "bike-analogy",
      },
      modules: [
        {
          kind: "module",
          id: "10.1",
          title: "让数字比赛，让结论接受边界检查",
          desc: "切换主结果、消融、迁移、终身演化和边界视图；每条赛道只使用论文报告的单位与刻度。",
          componentId: "evidence-lab",
        },
      ],
      insight:
        "最可信的结论不是“全面更强”，而是“在论文共享协议和测试范围内得到支持，并保留成本、因果与部署边界”。",
      takeaways: [
        {
          icon: "1",
          title: "准确率优势有协议",
          desc: "五域最佳或并列最佳只属于共享测试设置。",
        },
        {
          icon: "2",
          title: "分层和技能都重要",
          desc: "平铺记忆与去结晶消融持续退化。",
        },
        {
          icon: "3",
          title: "边界必须同屏",
          desc: "成本、启发式信用、隐私和安全部署仍需单独评估。",
        },
      ],
    },
  ],
};
