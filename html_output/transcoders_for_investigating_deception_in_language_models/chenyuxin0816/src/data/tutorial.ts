import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "Transcoders for Investigating Deception in Language Models",
    titleZh: "用于研究语言模型欺骗行为的转码器",
    venue: "arXiv:2607.14791v1 / 2026",
    authors: "Darius Lim; Nathan Leow; Xin Wei Chia",
    affiliation: "Home Team Science & Technology Agency (HTX), Singapore",
    domain: "机械可解释性、语言模型安全、归因电路与特征干预",
    coreProblem: "模型已经拿到密钥，却在用户询问时没有说出来：它为什么会这样？",
    coreInsight: "这篇论文沿着模型内部的信号，寻找“知道但不说”的原因，再用干预测试这些信号是否真的会改变回答。",
    keywords: [
      "机械可解释性",
      "逐层转码器",
      "归因图",
      "特征干预"
    ]
  },
  hero: {
    oldMethod: {
      desc: "只看回答，只能判断密钥是否被披露；模型明明拥有信息却选择隐瞒的内部过程仍然是黑箱。",
      componentId: "hero-circuit-contrast"
    },
    newMethod: {
      desc: "预训练 Transcoder 把 MLP 近似为可观察的稀疏特征通道；归因图负责追踪，特征干预再检查这些信号是否改变密钥的披露状态。",
      componentId: "hero-circuit-contrast"
    }
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "模型为什么会隐藏它知道的信息？",
      badge: "inf",
      badgeLabel: "论文问题",
      bridge: "密钥已经写入 System Prompt。模型知道答案，却可能选择不告诉用户。",
      analogy: {
        title: "从一个密钥任务开始",
        text: "模型隐藏密钥记为 D，直接给出密钥记为 ND；论文进一步追踪这一选择如何在模型内部形成。",
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "切换回答，理解论文中的 D / ND",
          desc: "",
          componentId: "deception-task-lab"
        }
      ],
      insight: "论文利用 Transcoder 拆解 Feature、追踪连接，并通过 Steering 验证这些内部计算是否影响回答。",
      takeaways: [
        {
          icon: "🔐",
          title: "密钥已知",
          desc: "System Prompt 已经把密钥交给模型。"
        },
        {
          icon: "💬",
          title: "两种回答",
          desc: "同一个问题可以得到隐藏或给出密钥两种回答。"
        },
        {
          icon: "🏷️",
          title: "实验标签",
          desc: "隐藏密钥是 D，给出密钥是 ND。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "Transcoder 把 MLP 拆成可追踪的 Feature",
      badge: "inf",
      badgeLabel: "核心工具",
      bridge: "模型回答来自多层 Transformer。Transcoder 近似每层 MLP 的计算，并把中间过程表示成可观察的 Feature。",
      analogy: {
        title: "回答不是一步产生的",
        text: "语言模型会经过多层 Transformer 逐步更新内部表示。论文在各层的 MLP 变换上使用 Transcoder，追踪回答形成过程中的内部 Feature。"
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "从封闭 MLP 到透明 Transcoder",
          desc: "",
          componentId: "transcoder-intro"
        },
        {
          kind: "module",
          id: "2.2",
          title: "Feature：一个检测并写入的计算单元",
          desc: "",
          componentId: "feature-intro"
        }
      ],
      insight: "一个 Feature 由固定的输入检测方向和输出写入方向构成；当前输入只改变它的激活强度。下一步，就可以追踪这些计算单元如何跨层连接。",
      takeaways: [
        {
          icon: "↔️",
          title: "同一输入",
          desc: "MLP 与 Transcoder 都接收同一个输入表示 h。"
        },
        {
          icon: "≈",
          title: "输出近似",
          desc: "代理输出 ŷ 尽量接近原始 MLP 输出 y。"
        },
        {
          icon: "◉",
          title: "中间可见",
          desc: "稀疏 Feature 为后续归因图提供可追踪节点。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "归因图沿回答路径寻找候选 Feature",
      badge: "inf",
      badgeLabel: "归因图",
      bridge: "上一节已经把内部计算表示成 Feature；但一条 Prompt 会点亮很多信号，论文接下来要从中找出值得进一步验证的候选。",
      analogy: {
        title: "有归因边，还要判断语义是否相关",
        text: "研究者先选择 hidden、private、confidential 等种子 token，再沿有向边检查相连 Feature，只记录与 negation、concealment、secrecy 等概念有关的节点。"
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "从相连节点中人工筛出候选 Feature",
          desc: "",
          componentId: "attribution-path-lab"
        }
      ],
      insight: "归因图提供可追踪的连接，研究者根据语义人工记录候选；这些 Feature 是否真的影响回答，还要交给 Steering 检验。",
      takeaways: [
        {
          icon: "🌱",
          title: "选择起点",
          desc: "从 hidden 等与任务语义相关的种子 token 开始检查。"
        },
        {
          icon: "↗️",
          title: "语义筛选",
          desc: "有边的节点很多，只记录与否定、隐藏或保密语义相关的 Feature。"
        },
        {
          icon: "⚠️",
          title: "仍是候选",
          desc: "出现在路径上不等于已证明因果作用。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "Steering 用行为翻转验证候选 Feature",
      badge: "both",
      badgeLabel: "干预验证",
      bridge: "归因图只能提出候选。论文继续直接改变候选 Feature 的激活，观察回答标签是否按预期翻转。",
      analogy: {
        title: "用干预结果决定是否保留",
        text: "候选与隐藏语义相关还不够；只有 Steering 后 D / ND 按预期翻转，它才进入后续的 Feature 字典。"
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "根据输出是否翻转，保留或剔除候选",
          desc: "",
          componentId: "steering-validation-lab"
        }
      ],
      insight: "归因负责“找到谁”，Steering 负责“改动它以后，回答会不会变”。两类证据不能混为一谈。",
      takeaways: [
        {
          icon: "↗",
          title: "正向测试",
          desc: "原回答是 ND 时，增强候选并检查是否变为 D。"
        },
        {
          icon: "↘",
          title: "负向测试",
          desc: "原回答是 D 时，削弱候选并检查是否变为 ND。"
        },
        {
          icon: "✓",
          title: "保留规则",
          desc: "只有出现预期标签翻转，候选才进入 Feature 字典。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "100 条 Prompt 得到 112 个候选，再筛出 Top-10",
      badge: "both",
      badgeLabel: "候选字典",
      bridge: "作者对 100 条合成 Prompt 重复候选发现与验证，得到 112 个不同 Feature；再按跨 Prompt 出现次数选出 Top-10。",
      analogy: {
        title: "从单条筛选到跨 Prompt 字典",
        text: "单条 Prompt 提供一次候选筛选；重复 100 次后，作者汇总得到 112 个不同 Feature。"
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "从候选字典中筛出跨 Prompt 最稳定的 Top-10",
          desc: "",
          componentId: "candidate-collection-lab"
        }
      ],
      insight: "Top-10 是 112 个候选中跨 Prompt 出现最频繁的十个 Feature，出现范围为 55%–95%。",
      takeaways: [
        {
          icon: "100",
          title: "重复范围",
          desc: "同一流程作用于 100 条合成 Prompt。"
        },
        {
          icon: "∪",
          title: "汇总方式",
          desc: "通过验证的 Feature 被合并并去重。"
        },
        {
          icon: "112",
          title: "结果含义",
          desc: "得到 112 个不同的 deception-related Feature。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "干预 Top-10 会改变模型的隐瞒行为",
      badge: "both",
      badgeLabel: "Top-10 结果",
      bridge: "Top-10 已经按出现频率选出。作者把这十个 Feature 作为一组进行 Steering，观察回答标签如何变化。",
      analogy: {
        title: "比较两个干预方向",
        text: "负向削弱用于测试 D→ND，正向增强用于测试 ND→D；同时还要检查是否出现反方向变化。"
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "切换干预方向，比较预期与反方向变化",
          desc: "",
          componentId: "steering-outcome-compare"
        }
      ],
      insight: "Top-10 整组确实会影响模型行为，其中负向削弱可让全部原始 D 回答转为 ND。下一步要看这十个 Feature 如何连接。",
      takeaways: [
        {
          icon: "−",
          title: "负向结果",
          desc: "预期 D→ND 为 100%，反方向 ND→D 为 0%。"
        },
        {
          icon: "+",
          title: "正向结果",
          desc: "预期 ND→D 为 21%，反方向 D→ND 为 50%。"
        },
        {
          icon: "≠",
          title: "关键判断",
          desc: "正负干预不是对称、可逆的行为开关。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-7",
      title: "重复连接把 Top-10 组织成一张电路",
      badge: "both",
      badgeLabel: "跨 Prompt 汇总",
      bridge: "作者统计 Top-10 之间的每条有向边在 100 张归因图中出现多少次，只保留反复出现的连接。",
      analogy: {
        title: "节点和边分两次筛选",
        text: "节点按出现频率选 Top-10；边按跨 Prompt 重复频率保留约 30% 阈值以上的连接。"
      },
      modules: [
        {
          kind: "module",
          id: "7.1",
          title: "拖动出现次数，观察一条边是否进入电路",
          desc: "",
          componentId: "circuit-builder"
        }
      ],
      insight: "跨 Prompt 反复出现的有向边组成 Feature 电路，连接结构让我们能够继续寻找其中的核心节点。",
      takeaways: [
        {
          icon: "📚",
          title: "候选字典",
          desc: "112 是人工追踪和干预规则下得到的候选规模。"
        },
        {
          icon: "🔝",
          title: "高频子集",
          desc: "top-10 在 100 条提示中反复出现，频率范围为 55%-95%。"
        },
        {
          icon: "🕸️",
          title: "频率电路",
          desc: "约 30% 的边筛选形成跨提示电路摘要。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-8",
      title: "连接数定位电路中的两个核心 Feature",
      badge: "both",
      badgeLabel: "核心节点",
      bridge: "出现频率负责筛出 Top-10；进入电路后，作者再统计每个 Feature 指向多少个其他节点。",
      analogy: {
        title: "比较频率与连接数",
        text: "同一个 Feature 可以频繁出现，却处在电路边缘；也可以同时高频并连接多个节点。"
      },
      modules: [
        {
          kind: "module",
          id: "8.1",
          title: "选择 Feature，同时观察出现频率与连接数",
          desc: "",
          componentId: "core-circuit-map"
        }
      ],
      insight: "Obscuring information 与 Secrets/confidentiality 都指向 6/10 个节点，因此成为下一步联合验证的核心组合。",
      takeaways: [
        {
          icon: "🔗",
          title: "计数标准",
          desc: "中心性按向其他 top 特征的输入连接数定义。"
        },
        {
          icon: "⭐",
          title: "核心双特征",
          desc: "Obscuring information 与 Secrets/confidentiality 都达到 6/10。"
        },
        {
          icon: "📏",
          title: "局部结论",
          desc: "该标准只属于本文筛选后的 top-10 电路。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-9",
      title: "两个核心 Feature 保留了 Top-10 的主要作用",
      badge: "both",
      badgeLabel: "控制实验",
      bridge: "作者联合干预两个核心节点，并同时对照 Top-10 整组结果和其余 28 个双 Feature 组合的平均结果。",
      analogy: {
        title: "目标组合与同规模配对比较",
        text: "目标组和控制组都包含两个 Feature，并接受同一方向、同一强度的干预。"
      },
      modules: [
        {
          kind: "module",
          id: "9.1",
          title: "切换干预方向，比较十个、两个与普通双 Feature",
          desc: "",
          componentId: "core-pair-test"
        }
      ],
      insight: "电路分析把十个相关信号收缩为两个关键控制点；联合干预这两个节点，保留了 Top-10 整组的大部分效果。",
      takeaways: [
        {
          icon: "🎯",
          title: "负向强效",
          desc: "核心组合 100.0%，控制均值 45.8%，p<0.001。"
        },
        {
          icon: "📈",
          title: "正向显著",
          desc: "核心组合 17.3%，控制均值 3.7%，但绝对比例有限。"
        },
        {
          icon: "28",
          title: "控制公平",
          desc: "目标组合与其余 8 个 Top-10 Feature 的 28 个两两配对比较。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-10",
      title: "模型欺骗变成可定位、可追踪、可干预的电路问题",
      badge: "both",
      badgeLabel: "AI 安全价值",
      bridge: "从候选 Feature 到电路和核心组合，论文把输出层面的隐瞒推进到模型内部的结构定位与行为干预。",
      analogy: {
        title: "把安全检查前移到模型内部",
        text: "只看输出，要等危险回答出现后才能发现问题；Transcoder 让安全团队先观察内部欺骗电路，再决定是否介入。"
      },
      modules: [
        {
          kind: "module",
          id: "10.1",
          title: "回放从 Feature 发现到联合干预的完整路线",
          desc: "",
          componentId: "conclusion-evidence-chain"
        }
      ],
      insight: "Transcoder 为难以解释的 MLP 计算建立了一张可分析的 Feature 地图，让与欺骗行为相关的内部路径能够被定位、追踪和干预，为模型风险监测提供了新的方法。",
      takeaways: [
        {
          icon: "112",
          title: "发现信号",
          desc: "从 112 个候选 Feature 中筛出跨 Prompt 稳定出现的 Top-10。"
        },
        {
          icon: "2",
          title: "锁定核心",
          desc: "两个核心 Feature 均连接到 6/10 个 Top-10 节点。"
        },
        {
          icon: "↯",
          title: "监测与干预",
          desc: "在危险输出形成前追踪欺骗电路，并通过 Steering 改变行为。"
        }
      ]
    }
  ]
};
