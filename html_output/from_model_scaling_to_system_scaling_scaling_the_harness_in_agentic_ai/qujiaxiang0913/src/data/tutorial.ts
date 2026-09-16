import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "From Model Scaling to System Scaling: Scaling the Harness in Agentic AI",
    "titleZh": "从模型规模化到系统规模化：扩展智能体的 Harness",
    "venue": "arXiv 预印本 arXiv:2605.26112v1 [cs.AI]，2026",
    "authors": "Shangding Gu",
    "affiliation": "UC Berkeley",
    "domain": "智能体系统 / 大语言模型 / AI 基础设施",
    "coreProblem": "智能体评测基本以模型为中心，把智能体压缩成“最终任务是否成功”，而记忆、检索、工具使用、编排、校验与治理被当成次要实现细节。",
    "coreInsight": "把围绕基础模型的结构化执行层（harness）提升为设计、评测与优化的一等对象：给出六组件分解与三大瓶颈，并提出 harness 级的评测议程。",
    "keywords": [
      "harness（执行骨架）",
      "系统规模化",
      "上下文治理",
      "可信记忆",
      "动态技能路由",
      "编排循环",
      "校验与治理",
      "过程指标",
      "纵向评测"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "只扩展模型：把更强的模型直接放进同一个执行环境，光更亮了，却依然照不到船。",
      "componentId": "mod-hero-old"
    },
    "newMethod": {
      "desc": "同时扩展系统：把上下文治理、记忆、技能路由、编排与校验当成可设计的一等对象，同一盏灯终于稳定照住了船。",
      "componentId": "mod-hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "灯亮着，船却没被照到",
      "badge": "inf",
      "badgeLabel": "推理",
      "bridge": "本节是全篇的起点：报告出来的「模型分数」其实是「模型 + harness 分数」。把更强的模型直接塞进同一个执行环境，并不等于得到更强的智能体。",
      "analogy": {
        "title": "灯亮着，不等于船被照到",
        "text": "灯泡再亮，光若散在整片海上，船依旧看不见。<b>智能体的能力</b>不只看模型有多强，还看这束光被送到了哪里。",
        "componentId": "analogy-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "只升级灯泡会发生什么",
          "desc": "拖动滑块提高塔灯功率（对应<b>模型规模化</b>），观察船是否因此被照到。",
          "componentId": "mod-1-1"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "只升级模型 vs 同时治理系统",
          "desc": "同一个开始按钮下，左右两侧从相同初始状态出发：左侧继续只加功率，右侧加上透镜与遮光板（对应<b>系统规模化</b>）。",
          "componentId": "mod-1-2"
        }
      ],
      "insight": "缺的不是更亮的灯，而是决定「把光送到哪里」的那一层。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "分数混入两种增益",
          "desc": "模型分数常常是「模型 + harness」的分数 —— 报告结果时要分清增益来自哪一侧。"
        },
        {
          "icon": "🔧",
          "title": "只提 ℛ 不够",
          "desc": "只提升推理基座 ℛ，并不能自动改善信息被送到哪里。"
        },
        {
          "icon": "✨",
          "title": "把执行骨架当一等对象",
          "desc": "把执行骨架当成可设计、可评测、可优化的一等对象，是系统规模化的起点。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "透镜决定这一束光照向哪里",
      "badge": "inf",
      "badgeLabel": "推理",
      "bridge": "输入表示 / 上下文构造：每一轮的上下文不是固定缓冲区，而是选择策略的输出。",
      "analogy": {
        "title": "透镜决定照向哪里",
        "text": "同样的光，经过透镜才成为一束。<b>上下文构造</b>决定这一轮到底把哪些信息送到模型眼前。",
        "componentId": "analogy-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "这一轮该把哪些信息送进模型",
          "desc": "左右拖动透镜改变光束的角度与宽度，同时观察 𝒞 的四个子轴如何变化。",
          "componentId": "mod-2-1"
        }
      ],
      "formula": {
        "lead": "论文把上下文构造的质量拆成四个可以分别改动的维度。",
        "unicode": "𝒞 = ( relevance, compactness, traceability, refresh policy )",
        "symbols": [
          {
            "sym": "𝒞",
            "desc": "上下文构造质量（概念量，不是数值评分）"
          },
          {
            "sym": "relevance",
            "desc": "相关性：取回来的内容与当前子问题是否有关"
          },
          {
            "sym": "compactness",
            "desc": "紧凑性：是否不超过最小充分集"
          },
          {
            "sym": "traceability",
            "desc": "可追溯性：每块内容能否追到来源"
          },
          {
            "sym": "refresh policy",
            "desc": "刷新策略：多久、按什么规则对移动中的环境重新取值"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "上下文是产物",
          "desc": "上下文是“选择策略”的产物，不是被动堆满的缓冲区。"
        },
        {
          "icon": "🔧",
          "title": "分别度量",
          "desc": "四个子轴可以分别变好或变坏，所以要分别度量。"
        },
        {
          "icon": "✨",
          "title": "最小充分集",
          "desc": "真正的问题不是“能装多少 token”，而是“怎样构造出最小充分上下文”。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "曝光不等于看见",
      "badge": "inf",
      "badgeLabel": "推理",
      "bridge": "关键洞察：上下文窗口变大只扩展容量，带来 exposure without access——看得见的 token 变多，真正被用到的证据却没有变多。",
      "analogy": {
        "title": "曝光不等于看见",
        "text": "光扫过的海面变大了，船被照到的时长却没有变。<b>曝光量</b>增长，<b>有效访问</b>没有同步增长。",
        "componentId": "analogy-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "把上下文加长，命中率会怎样",
          "desc": "点击“下一步”逐级加长上下文，观察“已曝光”与“真正被用到的证据”两条曲线如何分离。",
          "componentId": "mod-3-1"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "容量非访问",
          "desc": "长上下文扩展的是容量，不是有效访问。"
        },
        {
          "icon": "🔧",
          "title": "分开度量",
          "desc": "“曝光量”和“被真正用到的证据”必须分开度量。"
        },
        {
          "icon": "✨",
          "title": "是否最小充分",
          "desc": "判断一段上下文好不好，要看它是不是当前子问题的最小充分集。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "把灯塔拆成六个部件",
      "badge": "both",
      "badgeLabel": "推理/训练",
      "bridge": "核心数学框架",
      "analogy": {
        "title": "一座灯塔，六个部件",
        "text": "灯塔不是“一盏灯”，而是六个可以分别更换的部件。系统规模化改的是其中五个。",
        "componentId": "analogy-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "六个组件，六个可改动的地方",
          "desc": "点击任意部件，看它管什么、以及把它换掉或关掉会发生什么。",
          "componentId": "mod-4-1"
        }
      ],
      "formula": {
        "lead": "论文把时长为 H 的智能体表现写成六个组件的函数，并明确说明这是概念性组织。",
        "unicode": "𝒫_H = Φ( ℛ, ℳ, 𝒞, 𝒮, 𝒪, 𝒢 )",
        "symbols": [
          {
            "sym": "𝒫_H",
            "desc": "时长为 H 的智能体表现（概念量）"
          },
          {
            "sym": "Φ",
            "desc": "从六个组件到表现的映射，没有闭式，论文不声称可以测量"
          },
          {
            "sym": "ℛ",
            "desc": "基础推理质量（模型规模化主要提升它）"
          },
          {
            "sym": "ℳ",
            "desc": "记忆质量"
          },
          {
            "sym": "𝒞",
            "desc": "上下文构造质量"
          },
          {
            "sym": "𝒮",
            "desc": "技能选择与组合质量"
          },
          {
            "sym": "𝒪",
            "desc": "编排质量"
          },
          {
            "sym": "𝒢",
            "desc": "治理质量"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "介入点而非分数",
          "desc": "六组件是六个可以分别改动的介入点，不是六个可加总的分数。"
        },
        {
          "icon": "🔧",
          "title": "规模化落点不同",
          "desc": "模型规模化主要落在 ℛ，系统规模化落在另外五个。"
        },
        {
          "icon": "✨",
          "title": "换掉即换智能体",
          "desc": "换掉 ℳ、𝒞、𝒮、𝒪、𝒢 中的任何一个，同一个模型会表现成不同的智能体。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "航海日志的四道关",
      "badge": "both",
      "badgeLabel": "推理/训练",
      "bridge": "记忆与信任（承接 §4 的 ℳ 轴）",
      "analogy": {
        "title": "写下来的，不等于还能信",
        "text": "一条航道记录写下时是对的，后来航道改了，字却没变。记忆质量要看它现在还信不信得过。",
        "componentId": "analogy-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "一条记录是怎么变质的",
          "desc": "切换失效模式，看同一条记录在四个子轴上的评分如何塌陷。",
          "componentId": "mod-5-1"
        }
      ],
      "formula": {
        "lead": "论文把记忆质量拆成四个维度，其中三条失败轴分别对应其中三个维度的丢失。",
        "unicode": "ℳ = ( precision, durability, retrievability, verifiability )",
        "symbols": [
          {
            "sym": "ℳ",
            "desc": "记忆质量（概念量）"
          },
          {
            "sym": "precision",
            "desc": "精确性：在定义范围内是否准确（过度泛化会丢它）"
          },
          {
            "sym": "durability",
            "desc": "耐久性：目标是否已静默漂移（drift 会丢它）"
          },
          {
            "sym": "retrievability",
            "desc": "可取回性：能否以可接受代价取出（是使用信任的前提）"
          },
          {
            "sym": "verifiability",
            "desc": "可验证性：能否对当前环境复核（污染会丢它）"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "难点是信任",
          "desc": "记忆的难点是信任，不是容量。"
        },
        {
          "icon": "🔧",
          "title": "三轴对应三失",
          "desc": "drift / over-generalization / pollution 分别打在 durability / precision / verifiability 上。"
        },
        {
          "icon": "✨",
          "title": "可取回不等于可信",
          "desc": "retrievability 只决定“能不能取出来”，它本身不产生信任。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "这条旧记录，今天还敢用吗",
      "badge": "inf",
      "badgeLabel": "推理",
      "bridge": "把 §5 的记忆信任问题，落到检索时的运行时决策上：信任应当是使用时判断，而不是写入时盖章。",
      "analogy": {
        "title": "用之前，先核一次",
        "text": "同一条记录，隔得越久越可疑。<b>信任</b>应该在使用时判断，而不是在写下时盖章。",
        "componentId": "analogy-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "把信任变成检索时的判断",
          "desc": "拖动\"距上次核验的时间\"，看检索排序分如何被过期惩罚与置信度风险项拉低，以及何时必须重新核验。",
          "componentId": "mod-6-1"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "使用时再判断",
          "desc": "信任在使用时判断，不在写入时盖章。"
        },
        {
          "icon": "🔧",
          "title": "检索带惩罚项",
          "desc": "检索要同时带上过期惩罚与置信度风险项。"
        },
        {
          "icon": "✨",
          "title": "取回即假设",
          "desc": "取回的内容在复核之前只是假设，不是事实。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "灯语发出去，谁来核对",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "技能的难题是路由与校验，而非拥有；𝒮 与 𝒢 不独立，只扩技能不扩校验只会更快但更不可靠。",
      "analogy": {
        "title": "发出去，还要收得回来",
        "text": "灯语发得再漂亮，没有回执就等于没发生过。<b>技能路由</b>必须和<b>校验</b>绑在一起。",
        "componentId": "analogy-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "关掉校验会怎样",
          "desc": "用\"下一步\"走完一次技能调用，并可切换是否开启后置校验，观察失败是否被下游发现。",
          "componentId": "mod-7-1"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两种病的同一面",
          "desc": "\"自信却未校验\"和\"过时却自信\"是同一种病的两面。"
        },
        {
          "icon": "🔧",
          "title": "技能须配校验",
          "desc": "只提升技能数量而不提升校验，会得到更快但更不可靠的进展。"
        },
        {
          "icon": "✨",
          "title": "后置检查进规格",
          "desc": "后置条件检查应当写进每一个技能的规格里。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "整座灯塔一整夜怎么协同",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "编排循环 𝒪 把六个组件串成一条可重复走的执行路径，𝒢 在中间门控中间推理与外部动作，通过后才成为被许可的动作或经过验证的记忆写回。",
      "analogy": {
        "title": "一整夜的流程",
        "text": "灯塔靠的不是某个部件，而是<b>编排循环</b>把六个部件按顺序串起来。",
        "componentId": "analogy-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点开看数据是怎么流的",
          "desc": "点击任一组件查看它在循环里的位置；切换执行模式，看轨迹与门控如何变化。",
          "componentId": "mod-8-1"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "可重复的执行路径",
          "desc": "编排循环把六个组件串成一条可重复走的路径。"
        },
        {
          "icon": "🔧",
          "title": "门控与写回",
          "desc": "𝒢 同时门控中间推理与外部动作，通过后才能写回记忆。"
        },
        {
          "icon": "✨",
          "title": "并行的收益与风险",
          "desc": "换成子智能体并行会得到更多上下文窗口，也带来协调失败的新风险。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "三本不同的值班手册",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "Claude Code、OpenClaw、CheetahClaws 都在处理上下文治理、记忆管理与技能路由，说明这些是智能体系统的固有设计问题；差异更多来自部署优先级，而不是基础模型。",
      "analogy": {
        "title": "同一件事，三种写法",
        "text": "三本手册都在讲怎么守夜，重点却不同——差别来自<b>部署优先级</b>。",
        "componentId": "analogy-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "三种部署优先级，三种设计选择",
          "desc": "切换三个 harness，比较它们在实现语言、主要场景、上下文治理、记忆与源码可得性上的差异。",
          "componentId": "mod-9-1"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "固有设计问题",
          "desc": "三个 harness 都在解同一组问题，说明它们是智能体系统的固有设计问题。"
        },
        {
          "icon": "🔧",
          "title": "部署优先级驱动",
          "desc": "差异更多来自部署优先级，而不是底层模型。"
        },
        {
          "icon": "✨",
          "title": "作者开发的参考实现",
          "desc": "CheetahClaws 把置信度与近期性写成一等字段，但它由本文作者开发，不是独立背书。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "一年下来，灯塔更可靠了吗",
      "badge": "both",
      "badgeLabel": "推理/训练",
      "bridge": "收束全篇：把评测从一次性结果扩展到过程与纵向指标，并诚实列出本框架的局限与三个反对意见。",
      "analogy": {
        "title": "一次修好，和一百次都修好",
        "text": "一次性通过率看的是“这次成不成”，纵向评测看的是“每次都成不成”。",
        "componentId": "analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "把过程指标一起报出来",
          "desc": "点击开始，比较“只看一次性完成率”与“同时看过程与纵向指标”两种评测口径。图中的 0.78 / 0.29 / 0.61 均为示意值，非论文实测。",
          "componentId": "mod-10-1"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "结果指标要和过程指标一起报",
          "desc": "只报一次性完成率，会看不见成本、风险与轨迹如何展开。"
        },
        {
          "icon": "🔧",
          "title": "基准要在任务之间保留状态",
          "desc": "只有当智能体在多次会话间保留记忆，才能测出它随时间变得更有用还是更危险。"
        },
        {
          "icon": "✨",
          "title": "框架是组织方式，不是拟合好的预测模型",
          "desc": "论文明确承认：Φ 没有闭式、六因子并不严格正交、CheetahClaws 由作者自己开发，因此这套六组件分解是概念性介入点而非可测量的公式。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV19Cj16tEPT",
      "title": "Hermes Agent 从入门到精通：记忆系统、工具协议与可复用技能机制",
      "reason": "面向 Agent 框架的系统教程，覆盖记忆系统、工具协议与可复用技能机制，与本教程的记忆与技能路由章节直接呼应。生成时 Bilibili 接口不可达，封面与播放量未获取，卡片使用渐变封面兜底。"
    }
  ]
};
