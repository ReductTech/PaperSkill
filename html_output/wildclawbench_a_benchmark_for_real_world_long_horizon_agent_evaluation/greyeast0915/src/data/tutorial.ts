import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "WildClawBench: A Benchmark for Real-World, Long-Horizon Agent Evaluation",
    "titleZh": "WildClawBench：真实世界长时程智能体评测教程",
    "venue": "arXiv cs.CL · 2026",
    "authors": "Shuangrui Ding, Xuanlang Dai, Long Xing 等 17 位作者",
    "affiliation": "上海人工智能实验室、香港中文大学、复旦大学等",
    "domain": "长时程智能体评测 · 真实工具使用 · 多模态基准",
    "coreProblem": "短任务、模拟环境与最终答案检查，会漏掉真实长链执行中的绕路、工具故障、环境副作用和超时。",
    "coreInsight": "<span class=\"hero-intro\">本文提出 WildClawBench：一套检验 AI Agent 能否在真实工具环境中持续完成复杂工作的评测基准。本教程将用“攀登一条长路线”作贯穿类比。</span>用 60 个双语多模态真实任务、原生 CLI 执行框架、隔离容器与三层混合验收，把‘模型会不会答’升级为‘智能体能不能完成工作’。",
    "keywords": [
      "长时程智能体",
      "真实工具",
      "混合验收",
      "执行框架",
      "可复现评测"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "短路线像只看攀岩者是否摸到终点：过程中的绕路、误操作和超时常被遮住。",
      "componentId": "hero-contrast"
    },
    "newMethod": {
      "desc": "WildClawBench 把智能体放进真实工具链，记录整段攀爬，并从产物、环境副作用和语义质量共同验收。",
      "componentId": "hero-contrast"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "原有方法有哪些不足",
      "badge": "both",
      "badgeLabel": "问题与动机",
      "bridge": "传统智能体基准往往缩短任务、只检查最终产物，并在合成沙箱里提供少量模拟 API。这样的设置便于测试，却会遮住真实长链执行中的关键故障。",
      "analogy": {
        "title": "短路线看终点，长路线看全过程",
        "text": "本教程以攀登作类比：短路线容易掩盖中途故障，只看是否摸到终点又会漏掉绕路与误操作。真实长路线还要求在开放环境中连续使用不同装备。",
        "componentId": "climb-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "不足一：短时程任务容易掩盖中途故障",
          "desc": "拖动任务长度，观察步骤与工具调用增多后，局部错误、返工和超时如何逐步暴露。风险曲线是教学示意，不是论文拟合值。",
          "componentId": "horizon-pressure"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "另外三种简化会漏掉什么？",
          "desc": "依次选择“只看产物”“合成沙箱”和“少量模拟 API”，观察它们各自省略了哪些真实执行证据；再切换到 WildClawBench，查看论文如何用真实工具环境、组合工具链和混合验收补足这些缺口。",
          "componentId": "legacy-limitations"
        }
      ],
      "insight": "WildClawBench 针对四个缺口展开设计：<b>长时程任务、过程与副作用验收、更加开放的真实运行环境，以及多种真实工具的组合使用</b>。",
      "formula": {
        "lead": "用一个示意式理解错误为何会随步骤积累：",
        "unicode": "P(至少一次失误) = 1 − (1 − p)ⁿ",
        "symbols": [
          {
            "sym": "p",
            "desc": "单步发生失误的示意概率，不是论文拟合值。"
          },
          {
            "sym": "n",
            "desc": "相互依赖的步骤数量。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "长链故障",
          "desc": "短任务无法充分暴露返工、误操作与超时。"
        },
        {
          "icon": "🔧",
          "title": "验收范围",
          "desc": "只看产物会漏掉错误过程和环境副作用。"
        },
        {
          "icon": "✨",
          "title": "真实工具环境",
          "desc": "真实运行环境与组合工具链更接近实际工作。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "一个任务应该包含什么",
      "badge": "both",
      "badgeLabel": "任务结构",
      "bridge": "既然要评测真实执行，下一步要把‘任务’从一句提示拆成可复现的实验单元。",
      "analogy": {
        "title": "路线卡不只是起点说明",
        "text": "一张可复现的路线卡要写清<b>目标、场地与验收</b>，否则两次攀爬无法比较。",
        "componentId": "climb-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "组装一个可执行任务",
          "desc": "依次打开任务说明、工作区与工具、时间/技能配置和评分函数，观察一个基准条目如何成为可复现的执行协议。任务单元 = 说明 + 初始环境 + 资源约束 + 可执行验收；工作区、技能和环境配置按任务而异。",
          "componentId": "task-blueprint"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "结构化说明",
          "desc": "Markdown 与 YAML 承载目标和元数据。"
        },
        {
          "icon": "🔧",
          "title": "真实资源",
          "desc": "工作区、工具、技能和环境变量按任务配置。"
        },
        {
          "icon": "✨",
          "title": "可执行验收",
          "desc": "评分函数把完成条件转换为可复核证据。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "如何构建任务",
      "badge": "trn",
      "badgeLabel": "构建流程",
      "bridge": "知道一个任务应该包含什么之后，还要通过编写、参考构建、筛选与精修，把候选任务变成可靠的基准条目。",
      "analogy": {
        "title": "好路线要拉开能力差距",
        "text": "路线要先设计、试爬和复核；如果所有人都同样轻松或同样失败，就要继续调整。",
        "componentId": "climb-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "四阶段任务构建流程",
          "desc": "选择一个阶段，中央区域会完整呈现该阶段的任务、证据与判断。第三阶段直接提供模型试跑分数、0.2 区分度公式和专家复核边界。整个过程由 8 名研究者用 2 周完成。",
          "componentId": "curation-pipeline"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "四阶段",
          "desc": "编写、参考答案、筛选、精修逐步收紧质量。"
        },
        {
          "icon": "🔧",
          "title": "分差门槛",
          "desc": "0.2 只是一道区分度筛选。"
        },
        {
          "icon": "✨",
          "title": "专家复核",
          "desc": "继续排除歧义、脆弱评分、泄漏和不可复现。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "覆盖面：六类、双语与多模态",
      "badge": "inf",
      "badgeLabel": "数据构成",
      "bridge": "任务经过四阶段构建后，还要检查最终 60 个任务是否覆盖了足够不同的工作形态。",
      "analogy": {
        "title": "同一面墙，路线能力不同",
        "text": "只爬一种线路会高估泛化；六类任务让能力差异<b>显形</b>。",
        "componentId": "climb-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "拆开 60 个任务",
          "desc": "拖动分隔线或使用方向键，分别从任务类别、语言和模态三种视角拆开同一组 60 个任务。数值来自 WildClawBench v1 的论文统计，只描述构成，不作因果解释。",
          "componentId": "coverage-explorer"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "六类任务各自长什么样？",
          "desc": "切换类别，查看论文附录给出的六个代表任务。每个例子都按输入、执行、产物与验收拆开，呈现“真实工作”如何落成可运行、可评分的任务。",
          "componentId": "category-examples"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "六类工作",
          "desc": "生产力、代码、社交、检索、创作与安全。"
        },
        {
          "icon": "🔧",
          "title": "双语",
          "desc": "36 个英文、24 个中文任务。"
        },
        {
          "icon": "✨",
          "title": "跨模态",
          "desc": "26 个多模态任务要求处理非纯文本信息。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "原生执行框架与隔离环境",
      "badge": "both",
      "badgeLabel": "系统架构",
      "bridge": "任务合格后，评测不是让裸模型单独回答，而是让模型在执行框架的组织下调用真实工具，并在隔离环境中完成与记录整段任务。",
      "analogy": {
        "title": "攀登者借助绳索系统完成路线",
        "text": "攀登表现不只由攀登者决定，还取决于绳索保护系统和岩壁环境。论文同样在<b>模型 × 执行框架 × 工具环境</b>联合的情况下执行任务。",
        "componentId": "climb-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "沿真实执行链走一遍",
          "desc": "依次查看任务、执行框架、真实工具、产物与日志如何进入一条可审计链路。技术身份是：被评测系统 = 模型 + 执行框架 + 工具环境。",
          "componentId": "runtime-walkthrough"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "评分材料应该何时出现？",
          "desc": "切换评分材料的挂载时机，观察执行前暴露与退出后验收的差别。延迟挂载用于限制泄漏风险，但不能据此宣称泄漏绝对为零。",
          "componentId": "leakage-gate"
        }
      ],
      "insight": "论文评测的不是裸模型，而是<b>模型 × 执行框架 × 工具环境</b>的系统行为。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "隔离容器",
          "desc": "每次运行从相同初始状态开始。"
        },
        {
          "icon": "🔧",
          "title": "原生框架",
          "desc": "OpenClaw、Claude Code、Codex、Hermes 提供真实 CLI 行为。"
        },
        {
          "icon": "✨",
          "title": "延迟挂载",
          "desc": "评分材料在执行结束后才可见。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "混合验收：不只看一个分数",
      "badge": "both",
      "badgeLabel": "评分方法",
      "bridge": "完整轨迹被记录下来后，如何判断产物真的正确、环境真的安全、语义真的合格？",
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "为任务选择正确的验收层",
          "desc": "三类检查关注不同证据：规则检查核对最终产物中可精确判断的属性；环境状态确认工具执行后的真实状态与副作用；语义评审依据 rubric 判断开放式内容和视觉结果的质量。任务最多组合三层，并非每个任务都用满三层。",
          "componentId": "grader-triad"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "开放输出如何交给 LLM/VLM 评审？",
          "desc": "论文附录用 5 个需要模型评审的任务进行 Human–GPT 对照：两位专家盲评，并与 GPT-5.4 使用同一 rubric。点击案例可查看确定性检查与语义评审怎样分工。",
          "componentId": "judge-rubric"
        }
      ],
      "formula": {
        "lead": "把三类证据看成并列的验收信号，而不是互相替代：",
        "unicode": "证据集合 G = {G_rule, G_state, G_sem}",
        "symbols": [
          {
            "sym": "G",
            "desc": "任务启用的验收证据集合，不表示加权总分。"
          },
          {
            "sym": "G_rule",
            "desc": "规则检查输出：核对文件是否存在，以及路径、名称、格式、字段、数值等可确定判断的属性。"
          },
          {
            "sym": "G_state",
            "desc": "环境状态审计输出：确认邮件是否真正发出、日历是否更新、文件与权限是否改变，并发现意外副作用。"
          },
          {
            "sym": "G_sem",
            "desc": "LLM/VLM 语义评审输出：依据评分标准判断内容是否符合意图、完整连贯，以及视觉结果是否清晰合理；它不是固定权重。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "确定性",
          "desc": "检查文件存在性、路径、名称、格式、字段与数值等可精确判断的要求。"
        },
        {
          "icon": "🔧",
          "title": "副作用",
          "desc": "确认邮件、日历、文件与权限是否真的按要求改变，并排查意外副作用。"
        },
        {
          "icon": "✨",
          "title": "语义质量",
          "desc": "依据 rubric 评价开放式文本是否符合意图、完整连贯，以及图像等视觉产物是否清晰合理。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "19 个模型交出了怎样的成绩",
      "badge": "inf",
      "badgeLabel": "主结果",
      "bridge": "有了统一任务、环境和验收，才可以比较模型在同一执行框架下的真实表现。",
      "analogy": {
        "title": "同场同绳，才看得出谁走得更远",
        "text": "先固定 OpenClaw，再比较 19 个模型，避免把绳组差异误当成攀登能力。",
        "componentId": "climb-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "启动 OpenClaw 成绩赛",
          "desc": "选择总分、多模态或文本成绩，再启动同一执行框架下的比较。图中只呈现论文表格里的描述性结果，不表示差异具有统计显著性。",
          "componentId": "model-race"
        }
      ],
      "formula": {
        "lead": "论文把各任务的归一化得分汇总为百分制成绩：",
        "unicode": "S = 各任务归一化得分的汇总（百分制，0–100）",
        "symbols": [
          {
            "sym": "S",
            "desc": "归一化任务成绩的汇总百分数；这里不额外假设论文未说明的权重。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "最高 62.2",
          "desc": "真实长时程任务仍有较大余量。"
        },
        {
          "icon": "🔧",
          "title": "模态差异",
          "desc": "GPT-5.4 为 40.2 对 58.0。"
        },
        {
          "icon": "✨",
          "title": "先固定框架",
          "desc": "本章结论限定在 OpenClaw 设置。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "框架、时间与思考档位都不是中性变量",
      "badge": "both",
      "badgeLabel": "敏感性分析",
      "bridge": "模型名并不能独立决定结果；换执行框架、时间预算或思考档位，排名与成功率都会变。",
      "analogy": {
        "title": "换绳组、改节奏，结果会变",
        "text": "同一名攀登者，工具连接方式和时间策略都会影响完成度。",
        "componentId": "climb-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "同一模型，换一条执行链",
          "desc": "固定模型，切换四种原生执行框架，观察同一模型的成绩区间。执行框架不是中性外壳。",
          "componentId": "harness-matrix"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "时间更多、思考更深，就一定更好吗？",
          "desc": "分别查看时间预算与思考设置的论文结果。结果 = f(模型, 执行框架, 时间预算, 思考设置) 只是概念关系，并非拟合方程；论文未报告的组合不会插值。",
          "componentId": "budget-reasoning"
        }
      ],
      "insight": "报告智能体成绩时，<b>模型与执行框架必须成对出现</b>。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "框架效应",
          "desc": "同一模型最高可差约 18。"
        },
        {
          "icon": "🔧",
          "title": "时间收益",
          "desc": "减半损失明显，加倍收益递减。"
        },
        {
          "icon": "✨",
          "title": "非单调思考",
          "desc": "GPT-5.4 高档思考因超时反而更低。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "外部技能为何有时帮忙、有时添乱",
      "badge": "trn",
      "badgeLabel": "技能消融",
      "bridge": "除了时间与框架，外部技能也会改变工具选择与执行方式；它是否有效取决于模型和任务类别，而非技能数量。",
      "analogy": {
        "title": "工具能稳住手，也可能打乱节奏",
        "text": "正确的辅助动作能省力；不匹配的技巧会浪费时间，甚至让路线更差。",
        "figure": "./images/chapter-9-mountaineering-equipment.png"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "切换技能，观察类别效应",
          "desc": "选择任务类别，再开关外部技能。柱形变化来自论文的消融结果；它说明效果依赖<b>模型与类别</b>，不是技能越多越好。",
          "componentId": "skill-ablation"
        }
      ],
      "insight": "技能不是万能插件；其收益取决于<b>模型能力、任务类别与工具匹配程度</b>。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "总体收益有限",
          "desc": "四个模型加载技能后的总体变化并不一致。"
        },
        {
          "icon": "🔧",
          "title": "类别差异巨大",
          "desc": "代码与创作一致受益，社交交互可能受损。"
        },
        {
          "icon": "✨",
          "title": "避免一概而论",
          "desc": "技能收益必须按模型与任务类别分别报告。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "实验结果、失败模式与评测边界",
      "badge": "both",
      "badgeLabel": "结果与局限",
      "bridge": "主结果告诉我们系统完成了多少任务，失败轨迹解释问题在哪里发生，评测边界则规定这些发现能够外推多远。",
      "analogy": {
        "title": "记录成绩，也要复盘失足位置",
        "text": "登顶率只说明完成了多少路线；复盘计划、工具与时间断点，才能知道为什么失败，并判断结论适用于哪些条件。",
        "componentId": "climb-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "从总体成绩进入失败轨迹",
          "desc": "先查看模型成绩、框架敏感性和重复波动，再切换到失败轨迹。论文从 300 条抽检轨迹中分析了 169 条得分低于 0.5 的失败运行，逐步检查计划、工具调用、调试循环、时间耗尽与最终验收。",
          "componentId": "result-failure-explorer"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "哪些结论可以外推？",
          "desc": "对四个说法逐一判断；选择后按钮会以浅绿或浅红底色显示结果。论文明确的局限包括：所有任务均为单轮指令，缺少执行中的澄清、纠正与追问；60 个任务仍不足以覆盖真实部署，GUI 密集桌面操作以及生物、金融、法律等专业流程仅被轻度覆盖。此外，LLM 评审的人类对照只抽样了 5 个任务。",
          "componentId": "boundary-check"
        }
      ],
      "insight": "完整的结果解读需要依次回答：<b>完成了多少、为什么失败、结论能外推多远</b>。",
      "formula": {
        "lead": "把证据边界当作阅读论文的最后一道安全绳：",
        "unicode": "结论强度 ≤ 证据覆盖范围",
        "symbols": [
          {
            "sym": "结论强度",
            "desc": "表述的普遍程度与确定性。"
          },
          {
            "sym": "证据覆盖范围",
            "desc": "论文实际测试的任务、模型、框架、重复次数与人工验证规模。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "总体结果",
          "desc": "最高 62.2，大量真实长时程任务仍未被稳定完成。"
        },
        {
          "icon": "🔧",
          "title": "失败断点",
          "desc": "计划、工具、调试与时间问题会沿轨迹传导到最终产物。"
        },
        {
          "icon": "✨",
          "title": "评测边界",
          "desc": "仍需扩展任务规模、专业领域、多轮协议与人工评分验证。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1R6uF67EYp",
      "title": "斯坦福 CS329A：智能体评估与长时程任务",
      "reason": "补充理解长时程智能体评测、鲁棒验证与工具反馈；它不是 WildClawBench 官方解读。",
      "views": "2.4万播放"
    }
  ]
};
