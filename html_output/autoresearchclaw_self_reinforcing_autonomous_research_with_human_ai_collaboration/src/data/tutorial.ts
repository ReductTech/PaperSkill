import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "AutoResearchClaw: Self-Reinforcing Autonomous Research with Human-AI Collaboration",
    titleZh: "AutoResearchClaw：人机协作下自我强化的自主科研",
    venue: "arXiv 2026 · 23-stage research pipeline",
    authors: "Jiaqi Liu 等",
    affiliation: "UNC-Chapel Hill 等机构",
    domain: "自主科研智能体 · 多智能体系统 · 人机协作",
    coreProblem: "<b>真实科研不是直线流程。</b>假设会被质疑，实验会失败，证据必须核验，失败经验还应留给下一次运行。",
    coreInsight: "<b>AutoResearchClaw 把“会生成论文”改造成“会自我校正的科研循环”。</b>人类不必盯住每一步，却要在高杠杆判断处参与。",
    keywords: [
      "自愈执行",
      "证据核验",
      "HITL",
      "跨运行演化"
    ]
  },
  hero: {
    oldMethod: {
      desc: "<b>线性流水线</b>：失败就中断，真实却无区分度的结果也可能被写成结论。",
      componentId: "hero-flow"
    },
    newMethod: {
      desc: "<b>自我强化循环</b>：辩论、修复、核验和人类判断把失败变成下一次的护栏。",
      componentId: "hero-flow"
    }
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "失败后，研究 AI 应该做什么？",
      badge: "inf",
      badgeLabel: "核心问题",
      bridge: "传统系统把研究当成一次从想法到论文的直线任务。可真正的科研价值，恰恰来自失败后的下一步。",
      analogy: {
        title: "用红笔把断线改成闭环",
        text: "一支笔只做一件事：把研究记录从“撞墙即停”改成“带着线索回看”。",
        componentId: "notebook-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "失败后的三种处置",
          desc: "选择一种处置，观察它会让研究路径停止、修补，还是回到假设。",
          componentId: "failure-route"
        },
        {
          kind: "module",
          id: "1.2",
          title: "同一次失败，两条后续",
          desc: "从同一失败起点比较线性终止与可恢复循环。",
          componentId: "linear-contrast"
        }
      ],
      insight: "<b>核心转变：</b>失败不是一个“报错状态”，而是一条能改变后续假设与实验设计的证据。",
      takeaways: [
        {
          icon: "🔴",
          title: "直线式的代价",
          desc: "停止会丢掉仍可利用的中间信息。"
        },
        {
          icon: "🔁",
          title: "循环的价值",
          desc: "修复或转向都把失败保留为下一次决策依据。"
        },
        {
          icon: "🧭",
          title: "先问什么",
          desc: "先判断失败是实现问题，还是研究方向问题。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "23 个阶段，三个相位",
      badge: "inf",
      badgeLabel: "流程地图",
      bridge: "要让循环可控，系统必须知道每段研究在处理什么、产出什么、何时能够恢复。",
      analogy: {
        title: "放大镜扫过任务单",
        text: "同一页笔记不是流水线：它在发现、实验、写作三相间保留检查点。",
        componentId: "notebook-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "点击三相任务图",
          desc: "点击任一相位，查看它的研究任务与五个跨相机制如何进入。",
          componentId: "phase-map"
        }
      ],
      insight: "三相结构把“找到问题、产生证据、形成报告”分开，但不把它们切成互不相干的孤岛。",
      takeaways: [
        {
          icon: "🔎",
          title: "Discovery",
          desc: "界定问题、检索文献并形成可检验假设。"
        },
        {
          icon: "🧪",
          title: "Experimentation",
          desc: "执行、修复、分析，再决定继续、细化或转向。"
        },
        {
          icon: "✍️",
          title: "Writing",
          desc: "在证据约束下撰写、审阅、修订和核验。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "让假设先被反对",
      badge: "inf",
      badgeLabel: "辩论机制",
      bridge: "流程有了地图，仍要避免“同一个模型提出、再自己认可”的确认偏误。",
      analogy: {
        title: "同一条假设的三种边注",
        text: "一支笔依次留下创新、可行性与反例的边注；目标不是赢辩论，而是留下可证伪的问题。",
        componentId: "notebook-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "三角色辩论台",
          desc: "在同一个研究想法上切换三种角色，看看综合器为何不能只收“有趣”的建议。",
          componentId: "debate-panel"
        }
      ],
      insight: "论文在假设与结果两个节点各放置一次结构化辩论：前者防止不可做，后者防止过度解读。",
      takeaways: [
        {
          icon: "💡",
          title: "Innovator",
          desc: "主动提出能挑战常规的高风险假设。"
        },
        {
          icon: "⏱️",
          title: "Pragmatist",
          desc: "用算力与时间预算筛掉不可执行方向。"
        },
        {
          icon: "🔍",
          title: "Contrarian",
          desc: "寻找混杂因素、薄弱假设与反例。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "自愈：修补还是转向？",
      badge: "both",
      badgeLabel: "执行机制",
      bridge: "被反对后留下的假设仍可能在执行时出错。区别不在于“会不会错”，而在于系统是否能诊断错误。",
      analogy: {
        title: "橡皮擦不抹掉线索",
        text: "擦去一个失败格，但把错误原因留在页边：下一笔才能写得更有根据。",
        componentId: "notebook-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "Proceed / Refine / Pivot",
          desc: "逐步查看三种决策各自适用的证据状态。",
          componentId: "pivot-refine"
        }
      ],
      insight: "自愈不是盲目重试：弱但方向正确时 Refine，方向根本有误时 Pivot 回到假设阶段。",
      formula: {
        lead: "执行计划先以一个复杂度分数决定由哪类编码代理处理。",
        unicode: "c ∈ [0, 1]；当 c > τ = 0.6 时，分派给外部 AI 编码代理",
        symbols: [
          {
            sym: "c",
            desc: "实验计划复杂度，论文按六个维度评估。"
          },
          {
            sym: "τ",
            desc: "论文实验使用的固定阈值 0.6。"
          }
        ]
      },
      takeaways: [
        {
          icon: "🩹",
          title: "Refine",
          desc: "方向仍合理，就以诊断信息修正当前实验。"
        },
        {
          icon: "↩️",
          title: "Pivot",
          desc: "方向失效，就带着失败证据返回假设生成。"
        },
        {
          icon: "🔒",
          title: "先过静态检查",
          desc: "在花执行预算前检查硬编码指标、相同消融等缺陷。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "数字与引用，先过证据闸门",
      badge: "both",
      badgeLabel: "可信性",
      bridge: "实验跑通不等于报告可信。接下来要阻止“看起来合理”的数字或引用直接进入论文。",
      analogy: {
        title: "绿色印章只盖在有编号的记录上",
        text: "印章的目标是可追溯：没有原始记录编号的数字，不能被写进严格章节。",
        componentId: "notebook-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "把主张拖进证据闸门",
          desc: "拖动一条主张到“有记录”或“无记录”区域；闸门会立即给出是否允许写入的反馈。",
          componentId: "evidence-gate"
        }
      ],
      insight: "数值注册表是只读白名单；引用还要经 CrossRef、OpenAlex、arXiv、Semantic Scholar 四层核验。",
      takeaways: [
        {
          icon: "🔢",
          title: "数值注册表",
          desc: "保留每个条件下的均值、方差和单次种子测量。"
        },
        {
          icon: "⛔",
          title: "严格章节",
          desc: "摘要、结果、实验中的未匹配数值会触发拒绝。"
        },
        {
          icon: "📚",
          title: "引用核验",
          desc: "四层查找后再由模型判断相关性与可疑性。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "人类不必每一步都点“同意”",
      badge: "inf",
      badgeLabel: "人机协作",
      bridge: "既然系统能自愈与核验，人类应该退出流程吗？论文的回答是：退出低价值审批，进入高杠杆判断。",
      analogy: {
        title: "书签只夹在关键页",
        text: "一枚书签移动到最需要专家判断的页边，而不是让人逐页机械盖章。",
        componentId: "notebook-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "七种 HITL 模式",
          desc: "选择一种介入模式，查看覆盖阶段、干预次数以及论文在 10-topic 消融中报告的结果。",
          componentId: "hitl-modes"
        }
      ],
      insight: "CoPilot 在六个高杠杆节点介入；SmartPause 则在系统不确定时才请求人类判断。",
      takeaways: [
        {
          icon: "🎯",
          title: "定向协作",
          desc: "假设、设计、分析、写作和质量门更值得专家时间。"
        },
        {
          icon: "📊",
          title: "CoPilot",
          desc: "表 3 中平均质量 7.27、接受率 87.5%，均为该 10 题协议。"
        },
        {
          icon: "⚖️",
          title: "不是越多越好",
          desc: "Step-by-Step 有 23 次干预，却未达到 CoPilot 的表内质量。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-7",
      title: "把昨天的失败写成明天的护栏",
      badge: "trn",
      badgeLabel: "跨运行记忆",
      bridge: "一次运行内的修复还不够。若下一次又从零开始，系统仍会反复踩同一个坑。",
      analogy: {
        title: "近期批注更醒目，旧批注自然变淡",
        text: "蓝色荧光笔只做一件事：让最近且严重的教训更醒目，同时避免旧规则永久支配新问题。",
        componentId: "notebook-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "7.1",
          title: "经验半衰期时间轴",
          desc: "拖动经过天数，观察同一条经验的权重如何按 30 天半衰期衰减。",
          componentId: "lesson-decay"
        }
      ],
      insight: "这种记忆通过自然语言叠加注入提示词，不要求重训任何底层语言模型。",
      formula: {
        lead: "经验排序同时考虑严重度与时间：越严重、越近期，越应影响下一次运行。",
        unicode: "w(l) = s(l) · exp(−ln 2 · Δt / T½)",
        symbols: [
          {
            sym: "w(l)",
            desc: "教训 l 在当前时刻的影响权重。"
          },
          {
            sym: "s(l)",
            desc: "教训严重度，范围为 (0, 1]。"
          },
          {
            sym: "Δt",
            desc: "从记录该教训起经过的时间。"
          },
          {
            sym: "T½",
            desc: "半衰期；论文默认值为 30 天。"
          }
        ]
      },
      takeaways: [
        {
          icon: "🧠",
          title: "持久而非静态",
          desc: "经验跨运行保存，但并不会永久占据最高优先级。"
        },
        {
          icon: "🗓️",
          title: "30 天半衰期",
          desc: "论文的参数扫描中，它在 3-5 次后续运行间保持有效影响。"
        },
        {
          icon: "🧩",
          title: "无需重训",
          desc: "经验以可读的提示词叠加方式约束后续系统行为。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-8",
      title: "五个机制，怎样共同守住一条研究链？",
      badge: "trn",
      badgeLabel: "系统结构",
      bridge: "现在把辩论、修复、核验、HITL 和记忆放回同一张图：任何一个单独存在都不等于可信科研。",
      analogy: {
        title: "尺子对齐研究笔记的边框",
        text: "尺子只做一件事：把分散批注对齐到同一页三相研究图中。",
        componentId: "notebook-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "8.1",
          title: "可点击的五机制系统图",
          desc: "点击任一机制，追踪它跨越哪个相位、保护哪类失败，以及缺失后会损失什么。",
          componentId: "system-map"
        }
      ],
      insight: "这是一个系统论文：关键不是某个模型层，而是五种机制在同一研究循环里互相补位。",
      takeaways: [
        {
          icon: "🗣️",
          title: "辩论保质量",
          desc: "减少确认偏误，迫使假设与结论经受反方检查。"
        },
        {
          icon: "🩺",
          title: "自愈保完成",
          desc: "让可恢复失败不再强制终止整次研究。"
        },
        {
          icon: "🛡️",
          title: "核验保诚信",
          desc: "把可追溯性放在写作出口，而不是只靠生成时自觉。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-9",
      title: "看数字之前，先看它属于哪张表",
      badge: "trn",
      badgeLabel: "实验边界",
      bridge: "系统图说明了机制。接下来若要谈效果，必须先把三种不同评估协议分开。",
      analogy: {
        title: "校对笔在两张成绩单间移动",
        text: "同一支笔只做一件事：先辨认协议，再读数字，避免把不兼容的表直接相减。",
        componentId: "notebook-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "9.1",
          title: "协议切换实验室",
          desc: "切换实验阶段比较、端到端 HITL 消融和 best-of-3 组件消融，查看每张表允许的结论。",
          componentId: "protocol-lab"
        }
      ],
      insight: "0.648 和 7.27 都支持方法价值，却来自不同任务数量、指标与聚合规则，不能直接比大小。",
      takeaways: [
        {
          icon: "📈",
          title: "Table 2",
          desc: "25-topic experiment-stage；总分越高越好，CoPilot 为 0.648。"
        },
        {
          icon: "🧑‍✈️",
          title: "Table 3",
          desc: "10-topic end-to-end HITL；质量 1-10，接受为分数至少 5。"
        },
        {
          icon: "🧪",
          title: "Table 5",
          desc: "Full-Auto best-of-3 消融，用于拆分机制贡献。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-10",
      title: "验证不是替代科学判断",
      badge: "both",
      badgeLabel: "结论与边界",
      bridge: "最后一关不是“有没有数字”，而是这些数字是否真的回答了原来的科学问题。",
      analogy: {
        title: "在结论旁画下边界线",
        text: "签字笔的目标不是把结论写得更大，而是让每一句主张都停在证据允许的边界内。",
        componentId: "notebook-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "10.1",
          title: "T10：真实的全零，仍然是不够的证据",
          desc: "启动案例比较，观察 Full-Auto 与 CoPilot 都可生成论文时，证据质量为何仍不同。",
          componentId: "t10-race"
        }
      ],
      insight: "论文的最终定位很克制：系统是研究放大器；问题选择、解释、最终主张与投稿决定仍由人类负责。",
      takeaways: [
        {
          icon: "0️⃣",
          title: "全零的陷阱",
          desc: "数值可真实记录，却没有条件间差异，无法支持比较结论。"
        },
        {
          icon: "✅",
          title: "核验的边界",
          desc: "核验能阻止虚构数值，却不能单独判断研究问题是否被回答。"
        },
        {
          icon: "🤝",
          title: "正确分工",
          desc: "AI 加速执行与核验，人类保留高杠杆科学判断。"
        }
      ]
    }
  ]
};
