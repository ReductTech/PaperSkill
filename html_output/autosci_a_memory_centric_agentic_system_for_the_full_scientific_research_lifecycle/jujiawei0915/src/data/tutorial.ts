import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "AutoSci: A Memory-Centric Agentic System for the Full Scientific Research Lifecycle",
    "titleZh": "AutoSci：面向完整科研生命周期的记忆中心智能体系统",
    "venue": "arXiv preprint · 2026",
    "authors": "Weitong Qian、Beicheng Xu、Zhongao Xie 等",
    "affiliation": "北京大学",
    "domain": "科学智能体 · 持久记忆 · 多智能体编排",
    "coreProblem": "一次性 Agent 对话会丢失跨项目的知识、实验工件与失败经验。",
    "coreInsight": "<b>AutoSci</b> 用 SciMem 保存结构化研究工件，让 SciFlow、SciDAG 和 SciEvolve 围绕同一份可追溯记忆来执行、增强与改进科研。",
    "keywords": [
      "SciMem",
      "SciFlow",
      "SciDAG",
      "SciEvolve",
      "研究生命周期"
    ]
  },
  "hero": {
    "oldMethod": {
      "componentId": "hero-old",
      "desc": "<b>一次性会话</b>：文献、实验、手稿与评审意见分散在临时上下文中。"
    },
    "newMethod": {
      "componentId": "hero-new",
      "desc": "<b>AutoSci</b>：以受模式约束的研究记忆为底座，承接全生命周期工作。"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "paperSection": "§1 Introduction",
      "title": "为什么科研不能只靠聊天记录？",
      "badge": "both",
      "badgeLabel": "问题与架构",
      "bridge": "从一次性上下文转向可以恢复、审计和复用的研究工件，是 AutoSci 的出发点。",
      "analogy": {
        "title": "翻开活页册的第一页",
        "text": "把散落的聊天片段夹回同一册研究记录：<b>目标不是记住更多文本，而是让后续工作能找到可用工件。</b>",
        "componentId": "research-binder"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "拖动会话保留度",
          "desc": "调低保留度，看见文献、实验与评审意见如何在会话结束后失去连接。",
          "componentId": "autosci-lab"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "四模块研究台",
          "desc": "SciMem、SciFlow、SciDAG、SciEvolve 分别负责记忆、生命周期、增强编排与版本化改进。",
          "componentId": "autosci-lab"
        }
      ],
      "formula": {
        "lead": "系统不是把科研缩成一段提示词，而是让模块围绕共享记忆协作：",
        "unicode": "AutoSci = SciMem + SciFlow + SciDAG + SciEvolve",
        "symbols": [
          {
            "sym": "SciMem",
            "desc": "结构化持久记忆"
          },
          {
            "sym": "SciFlow",
            "desc": "生命周期执行"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧠",
          "title": "共享底座",
          "desc": "四模块围绕研究工件协作。"
        },
        {
          "icon": "⚠️",
          "title": "不要过度推断",
          "desc": "架构描述不等于已在所有领域验证。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "paperSection": "§2 System Overview",
      "title": "一个科研系统，怎样才能越做越“有经验”？",
      "badge": "inf",
      "badgeLabel": "SciMem",
      "bridge": "SciMem 不把所有内容混成一堆笔记，而是区分可复用知识与当前项目工件。",
      "analogy": {
        "title": "把卡片夹进正确页",
        "text": "左页保存跨项目复用的知识，右页保存本项目正在推进的工件；<b>分区让状态与用途不再混淆。</b>",
        "componentId": "research-binder"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "把卡片放进正确记忆区",
          "desc": "试着将 Paper、Concept、Idea 与 Experiment 放入长期知识或活跃研究页。",
          "componentId": "autosci-lab"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "实体不是普通笔记",
          "desc": "SciMem 用类型化实体、关系与生命周期状态组织记忆，而不只是向量库。",
          "componentId": "autosci-lab"
        }
      ],
      "formula": {
        "lead": "两种记忆区域各有职责：",
        "unicode": "M = { Long-Term Knowledge, Active Research }",
        "symbols": [
          {
            "sym": "Long-Term",
            "desc": "跨项目可复用知识"
          },
          {
            "sym": "Active",
            "desc": "当前研究工件"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📚",
          "title": "长期知识",
          "desc": "论文、主题、概念与方法可积累。"
        },
        {
          "icon": "🧪",
          "title": "活跃工件",
          "desc": "想法、实验、手稿与评审有明确状态。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "paperSection": "§3 SciMem",
      "title": "一套科研记忆，为什么要分成两部分？",
      "badge": "inf",
      "badgeLabel": "语义结构",
      "bridge": "研究系统需要按实体类型与证据关系定位信息，而不只依赖关键词相似。",
      "analogy": {
        "title": "在页面上拉出引用线",
        "text": "一条线连接 Topic、Paper、Concept、Method 与当前 Idea；<b>线的含义让检索能回到证据来源。</b>",
        "componentId": "research-binder"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "点选实体，查看关系",
          "desc": "选择 Topic、Paper、Method 或 Idea，观察一张研究页能暴露哪些关系。",
          "componentId": "autosci-lab"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "按关系取回上下文",
          "desc": "后续技能可获得与任务相关的证据、失败教训或方法，而不必暴露整个记忆图。",
          "componentId": "autosci-lab"
        }
      ],
      "takeaways": [
        {
          "icon": "🔗",
          "title": "类型化关系",
          "desc": "实体页与双向链接构成可查询结构。"
        },
        {
          "icon": "🔎",
          "title": "按需上下文",
          "desc": "相关性来自类型和关系，而非整段聊天回放。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "paperSection": "§4 SciMem — Memory Growth and Flow",
      "title": "科研记忆如何积累、流动并跨项目复用？",
      "badge": "both",
      "badgeLabel": "记忆增长",
      "bridge": "一项已完成研究不该只停在项目文件夹：它可以沉淀为下次研究的可用线索。",
      "analogy": {
        "title": "把验证过的页签归档",
        "text": "翻动一张已完成实验页：先从长期页激活，再把可复用发现巩固回去，<b>而不是把所有草稿自动写入。</b>",
        "componentId": "research-binder"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "四步查看跨区流动",
          "desc": "逐步推进长期聚合、激活、巩固与跨周期积累。",
          "componentId": "autosci-lab"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "辨认可回写工件",
          "desc": "仅终态、已验证或有价值的项目痕迹才构成可复用知识候选。",
          "componentId": "autosci-lab"
        }
      ],
      "formula": {
        "lead": "记忆并非单向日志：",
        "unicode": "Long-Term ⇄ Active  +  cross-cycle accumulation",
        "symbols": [
          {
            "sym": "Long-Term",
            "desc": "长期知识记忆：为当前项目提供可复用的主题、概念、方法与先前证据。"
          },
          {
            "sym": "⇄",
            "desc": "双向关系：激活让长期知识支撑项目工件，巩固让终态项目工件回写为可复用知识。"
          },
          {
            "sym": "Active",
            "desc": "活跃研究记忆：保存当前项目中的想法、实验、手稿与评审等有生命周期状态的工件。"
          },
          {
            "sym": "cross-cycle accumulation",
            "desc": "跨周期积累：保留方法、评审与反驳经验，供未来项目在写作和回应评审时使用。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "↔️",
          "title": "双向流动",
          "desc": "激活与巩固连接两类记忆。"
        },
        {
          "icon": "🗓️",
          "title": "跨周期经验",
          "desc": "评审与反驳教训也能服务未来工作。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "paperSection": "§5 Trust-Guarded Writes",
      "title": "哪有内容有资格被记住？",
      "badge": "both",
      "badgeLabel": "可靠性边界",
      "bridge": "持久记忆会影响未来项目，因此写入应有形式与内容两层门禁。",
      "analogy": {
        "title": "给一张页签盖状态章",
        "text": "每张候选页都要先通过检查：<b>PASS 可用，ARN 表示需要注意，BLOCK 则隔离待处理。</b>",
        "componentId": "research-binder"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "切换 PASS / ARN / BLOCK",
          "desc": "点击状态章，比较三种处理结果及 BLOCK 的隔离含义。",
          "componentId": "autosci-lab"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "两层检查不能省略",
          "desc": "确定性 lint 检查模式、状态、链接；独立审阅检查证据支持与一致性。",
          "componentId": "autosci-lab"
        }
      ],
      "formula": {
        "lead": "门禁给出的是可用性状态，而非真理保证：",
        "unicode": "Guard(write) ∈ { PASS, ARN, BLOCK }",
        "symbols": [
          {
            "sym": "PASS",
            "desc": "通过检查"
          },
          {
            "sym": "BLOCK",
            "desc": "隔离直到解决"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "✅",
          "title": "形式检查",
          "desc": "字段、生命周期状态和链接类型须合规。"
        },
        {
          "icon": "🛡️",
          "title": "内容检查",
          "desc": "证据与一致性仍需独立审阅。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "paperSection": "§6 SciFlow",
      "title": "有了记忆以后，科研怎么真正跑起来？",
      "badge": "both",
      "badgeLabel": "SciFlow",
      "bridge": "阶段之间通过 SciMem 的显式读写交接，而不是靠代理临时记忆上一段说过什么。",
      "analogy": {
        "title": "在同一页上放置阶段书签",
        "text": "选择一枚书签，页面就显示该阶段读入什么、写出什么；<b>研究交接依靠工件契约。</b>",
        "componentId": "research-binder"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "点选生命周期阶段",
          "desc": "在 Literature、Ideation、Experiment、Writing、Rebuttal 间切换，查看每步的读写工件。",
          "componentId": "autosci-lab"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "不要忽略案例范围",
          "desc": "案例研究是模拟研究提交，作者明确未评测 rebuttal 阶段。",
          "componentId": "autosci-lab"
        }
      ],
      "formula": {
        "lead": "论文给出的工作流为：",
        "unicode": "/research: Literature → Ideation → Experiment → Writing → Rebuttal",
        "symbols": [
          {
            "sym": "read",
            "desc": "从 SciMem 获取所需上下文"
          },
          {
            "sym": "write",
            "desc": "写入下一阶段可用工件"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧭",
          "title": "五阶段",
          "desc": "从文献理解直到提交后评审处理。"
        },
        {
          "icon": "🧾",
          "title": "显式交接",
          "desc": "知识、想法、证据、手稿和评审记录可追溯。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "paperSection": "§7 SciDAG",
      "title": "一个 Agent 不够时，怎么把任务拆成协作图？",
      "badge": "trn",
      "badgeLabel": "SciDAG",
      "bridge": "SciDAG 不是固定的多代理流水线，而是 SciFlow 可选调用的操作图增强。",
      "analogy": {
        "title": "在页边展开一张可折叠的协作图",
        "text": "一张页边折图可以继续、重试、分支、裁剪或停止；<b>最后仍要回到同一份工件契约。</b>",
        "componentId": "research-binder"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "选择图节点的下一步",
          "desc": "点选生成、审阅或验证节点，再决定继续、重试或停止，感受条件边的作用。",
          "componentId": "autosci-lab"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "模板让编排可复用",
          "desc": "不同阶段可使用不同模板：构思偏向多样生成与辩论，实验偏向可靠性检查，写作偏向证据忠实与润色。",
          "componentId": "autosci-lab"
        }
      ],
      "formula": {
        "lead": "对一个阶段任务，SciDAG 在同一契约内增强执行：",
        "unicode": "G = (V, E)  →  artifact contract",
        "symbols": [
          {
            "sym": "V",
            "desc": "专业子代理操作节点"
          },
          {
            "sym": "E",
            "desc": "信息流和条件边"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🕸️",
          "title": "可选增强",
          "desc": "SciDAG 是 SciFlow 技能可调用的工具。"
        },
        {
          "icon": "📐",
          "title": "阶段模板",
          "desc": "质量、成本与收敛信号可影响操作图。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "paperSection": "§8 SciEvolve",
      "title": "记住经验，还不算真正的“进化”",
      "badge": "both",
      "badgeLabel": "SciEvolve",
      "bridge": "自改进不应是黑箱重写：AutoSci 把反馈信号转成可审计的记忆、技能和模板更新。",
      "analogy": {
        "title": "在修订页上记录来源与版本",
        "text": "每次修订先标出来自用户、任务还是开放环境；<b>稳定的重复模式才触发相应模块的更新。</b>",
        "componentId": "research-binder"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "选择反馈信号来源",
          "desc": "在用户纠正、任务失败和新论文/代码间切换，查看信号为何不能被一概而论。",
          "componentId": "autosci-lab"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "选择要修订的系统层",
          "desc": "/dream 维护记忆，/forge 修订研究技能，/morph 改进多智能体模板。",
          "componentId": "autosci-lab"
        }
      ],
      "formula": {
        "lead": "反馈须形成有出处的更新闭环：",
        "unicode": "signals → versioned updates to { SciMem, SciFlow, SciDAG }",
        "symbols": [
          {
            "sym": "/dream",
            "desc": "记忆演化"
          },
          {
            "sym": "/forge /morph",
            "desc": "技能与模板演化"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧾",
          "title": "可审计",
          "desc": "信号先存入仓库并检测重复模式。"
        },
        {
          "icon": "🧩",
          "title": "分层更新",
          "desc": "不是一次反馈就自动重写全部系统。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "paperSection": "§9 Case Studies and Evaluation",
      "title": "AutoSci现实中真的能跑起来了吗？",
      "badge": "both",
      "badgeLabel": "案例与局限",
      "bridge": "看案例结果时，也要同时看运行条件、自动评审的代理性质，以及作者自己指出的局限。",
      "analogy": {
        "title": "把证据页和边界页并排夹好",
        "text": "一册严谨的研究记录不会只展示高光数字：<b>它也标注环境、代理指标和仍未解决的问题。</b>",
        "componentId": "research-binder"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "在三种证据页签间切换",
          "desc": "查看 GPU 案例结果、自动论文级评审代理分数和作者列出的局限。",
          "componentId": "evidence-tabs"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "案例不是通用基准",
          "desc": "两项案例覆盖 GPU kernel optimization 与 biomedical drug discovery；它们是系统级案例研究而不是大规模统一基准。",
          "componentId": "evidence-tabs"
        }
      ],
      "formula": {
        "lead": "GPU 数值只在论文报告的条件下成立：",
        "unicode": "1.52× (matched baselines); 1.18× (excluding degenerate baselines)",
        "symbols": [
          {
            "sym": "1.52×",
            "desc": "4× A40、157 算子、五次迭代下的几何平均加速"
          },
          {
            "sym": "6.3 / 5.8",
            "desc": "PaperReview.ai、ICLR 目标会场设定下的代理分数"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📊",
          "title": "报告条件",
          "desc": "不要把 GPU 案例外推为通用 GPU 加速结论。"
        },
        {
          "icon": "⚖️",
          "title": "保留边界",
          "desc": "自动评审不替代正式同行评审，科学专用底座与基准仍待发展。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "paperSection": "§10 Conclusion",
      "title": "AutoSci 最终说明了什么？",
      "badge": "both",
      "badgeLabel": "Conclusion",
      "bridge": "结论页由独立教学组件呈现。",
      "analogy": {
        "title": "总结",
        "text": "",
        "componentId": "research-binder"
      },
      "modules": [],
      "takeaways": []
    }
  ],
  "bilibili": [
    {
      "bvid": "BV19gVg6pEk6",
      "category": "AutoSci 概览",
      "title": "北大做了一个会自我进化的科研 Agent：AutoSci",
      "reason": "快速回顾论文的整体问题、四个模块与系统目标。"
    },
    {
      "bvid": "BV1QN8C6XE9A",
      "category": "SciMem · Agent Memory",
      "title": "AI Agent总是失忆？从0开始搭建智能体长期记忆系统：Basic Memory 完整教程",
      "reason": "从 Agent Memory 角度理解为什么科研经验需要长期保存和复用。"
    },
    {
      "bvid": "BV1awtb6kEdY",
      "category": "SciFlow · Harness",
      "title": "DeepSeek Harness 科研实操｜详解 Agent 科研工作流完整闭环",
      "reason": "从 Harness 实践理解长期科研任务如何被组织和执行。"
    },
    {
      "bvid": "BV1FCTt6AETZ",
      "category": "SciEvolve · Self-Evolution",
      "title": "[AI4Research] 快手爆火研究 AgentX：基于Agent自进化，自动推进推荐系统研发",
      "reason": "从自进化科研 Agent 理解反馈如何进一步改变系统。"
    }
  ]
};
