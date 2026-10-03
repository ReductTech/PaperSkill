import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "ReAct: Synergizing Reasoning and Acting in Language Models",
    "titleZh": "ReAct：推理与行动",
    "venue": "",
    "authors": "Shunyu Yao 等",
    "affiliation": "普林斯顿大学 · Google Research",
    "domain": "语言模型 · 推理 · 交互决策",
    "coreProblem": "只推理容易缺少外部依据，只行动又难以规划与整合观察。",
    "coreInsight": "用思考指导行动，让行动带回的新观察继续修正思考。",
    "keywords": [
      "ReAct",
      "少样本提示",
      "工具调用",
      "外部观察"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "在脑中规划“找杯子 → 放到桌上”，位置和动作结果尚未得到外部验证。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "开柜发现空了，改看台面；找到杯子后拿起、放下，再检查结果。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "只会想，或者只会做，都缺了什么？",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "同样是把杯子放到桌上，只写出计划还不等于完成任务。执行动作、观察结果，再据此修改下一步，才形成交互闭环。",
      "analogy": {
        "title": "计划要经过现场检验",
        "text": "先开柜子，发现空了，再查看台面。这个家庭场景帮助区分脑中的计划与实际发生的动作。",
        "componentId": "analogy1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "同一个任务，三种处理方式",
          "desc": "CoT 展开内部推理；Act 直接产生环境动作；ReAct 用显式思考组织动作并整合观察。这里用同一个找杯子场景说明三种机制，不比较速度或成功率。",
          "componentId": "method-compare"
        }
      ],
      "insight": "推理帮助决定下一步查什么，观察则为后续推理补充依据；这个循环不保证每次都答对。",
      "takeaways": [
        {
          "icon": "🔎",
          "title": "解释不是证据",
          "desc": "CoT 可以组织已有知识，但流畅的推理文本本身不会带回新的环境信息。"
        },
        {
          "icon": "📖",
          "title": "行动需要目标",
          "desc": "Act 也可以执行动作并获得观察；区别是没有单独写出的思考步骤。"
        },
        {
          "icon": "✓",
          "title": "两者相互补充",
          "desc": "ReAct 依据实际观察调整行动；能够展示一条成功过程，并不意味着每次都能成功。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "先分清：谁说的，谁看到的",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "理解三种模式之后，先辨认轨迹中的信息来源。同样出现在上下文里的一句话，可能是模型猜测，也可能是环境返回；二者不能混为一谈。",
      "analogy": {
        "title": "分开记下三种记录",
        "text": "计划是模型写的，动作是模型提出的请求，观察则是工具返回的内容。将它们分开记录，才能追踪信息的来源。",
        "componentId": "analogy2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "用放大镜追踪信息来源",
          "desc": "用“《小王子》的作者出生在哪里”区分三种信息：模型先提出计划，再发出查询，工具才返回作者信息。拖动放大镜或使用按钮，查看每段记录来自哪里。",
          "componentId": "source-drag"
        }
      ],
      "insight": "观察带来了模型之外的信息，但仍需判断其相关性；来源不同，不意味着任何一方天然正确。",
      "takeaways": [
        {
          "icon": "🔎",
          "title": "思考由模型生成",
          "desc": "“下一步应该查什么”是模型写出的计划，可能有用，也可能出错；它不是新获得的外部证据。"
        },
        {
          "icon": "📖",
          "title": "动作是请求",
          "desc": "search[The Little Prince] 指定检索目标。写出这个调用，只表示提出行动，还不表示已经获得结果。"
        },
        {
          "icon": "✓",
          "title": "观察来自环境",
          "desc": "检索返回的条目属于观察。把它写回上下文后，模型才能结合新信息继续推理。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "查不到时，计划应该改变",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "分清来源之后，再看观察怎样改变行动。检索未命中也是信息：模型可以据此修改目标，而不是继续沿着原来的猜测作答。",
      "analogy": {
        "title": "把查询目标说清楚",
        "text": "只有姓氏时，示意检索返回多个候选；补全姓名后，再去核查出生地点。候选信息帮助修正查询，但不是最终答案。",
        "componentId": "analogy3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "回放一次查询修正",
          "desc": "沿着“作品 → 作者 → 出生地”查证。本教学情境设置一次姓氏查询未定位的反馈，以演示如何根据候选补全姓名；不是实时检索记录。用按钮回放请求、反馈、修正和作答。",
          "componentId": "repair-trace"
        }
      ],
      "insight": "新观察先帮你找到作者，未定位的反馈再帮助你补全姓名；两次信息更新各自解决不同问题。",
      "takeaways": [
        {
          "icon": "🔎",
          "title": "观察影响后续",
          "desc": "作品条目提供作者这一中间线索，但还没有回答出生地点。"
        },
        {
          "icon": "📖",
          "title": "失败也提供信息",
          "desc": "姓名未定位时，应先处理候选与歧义，不能直接编造出生地点。"
        },
        {
          "icon": "✓",
          "title": "修正目标再检索",
          "desc": "补全作者姓名后，新的观察给出出生地里昂，再把两条事实连接起来。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "把“想一想”也纳入动作空间",
      "badge": "both",
      "badgeLabel": "进阶理解",
      "bridge": "上一节中，新的观察帮助模型改写检索词。现在区分两种更新：思考扩充上下文，环境动作则与外部接口交互。",
      "analogy": {
        "title": "在笔记里加入计划",
        "text": "写下“继续核查作者的出生地”会改变下一步计划，但这句话本身并没有带回出生地点。",
        "componentId": "analogy4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "同是下一步，改变的对象不同",
          "desc": "选择思考、检索或提交答案，观察上下文与环境书页的变化。这是机制示意，不是一次实际模型运行。思考属于扩展后的动作空间，但不会产生新的环境观察。",
          "componentId": "action-space"
        }
      ],
      "insight": "把思考纳入可生成的动作集合，并不等于把模型笔记变成外部证据。",
      "formula": {
        "lead": "∪ 表示集合并集。语言思考进入上下文，策略再根据上下文选择下一步。",
        "unicode": "Â = A ∪ L；âₜ ∈ L 时，cₜ₊₁ = (cₜ, âₜ)；π(aₜ | cₜ)",
        "symbols": [
          {
            "sym": "Â",
            "desc": "扩展后的动作集合，包含环境动作与语言思考。"
          },
          {
            "sym": "A",
            "desc": "可通过环境接口执行的动作集合。"
          },
          {
            "sym": "L",
            "desc": "语言字符串空间；其中的思考可加入上下文。"
          },
          {
            "sym": "∪",
            "desc": "集合并集：汇合两类允许的动作，没有单位或向量维数。"
          },
          {
            "sym": "âₜ",
            "desc": "第 t 步生成的语言思考；这里讨论它属于 L 的情况。"
          },
          {
            "sym": "cₜ",
            "desc": "第 t 步的上下文序列，保存已发生的观察与动作；它可随轨迹增长。"
          },
          {
            "sym": "t",
            "desc": "离散的交互步骤编号，不是连续时间。"
          },
          {
            "sym": "π",
            "desc": "以当前上下文 cₜ 为条件的动作策略分布。公式不提供具体概率值。"
          },
          {
            "sym": "aₜ",
            "desc": "策略在第 t 步选择的动作。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🔎",
          "title": "并集不是相加",
          "desc": "Â = A ∪ L 扩展的是可选动作的类别，没有把思考和行动相加成一个数。"
        },
        {
          "icon": "📖",
          "title": "思考改变上下文",
          "desc": "语言思考进入后续生成的条件，但不改变外部环境，也不产生新的环境观察。"
        },
        {
          "icon": "✓",
          "title": "环境动作有边界",
          "desc": "search 返回外部观察，finish 提交答案并终止；它们不是可互换的下一步。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "示范的是做法，不是固定剧本",
      "badge": "both",
      "badgeLabel": "进阶理解",
      "bridge": "动作空间说明模型可以做什么；提示中的示例进一步演示何时思考、何时行动，以及怎样利用观察。",
      "analogy": {
        "title": "参考一段示范",
        "text": "示例演示思考、行动、观察怎样衔接。新任务借鉴这种做法，实际步骤仍应随观察变化。",
        "componentId": "analogy5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "同一个框架，不同的思考疏密",
          "desc": "切换四类任务，查看示例数与轨迹组织方式。左侧卡片数量分别为 6、3、2、1；右侧用具体内容演示思考疏密，步骤数并不固定。主要实验使用冻结的 PaLM-540B 和人工编写的少样本轨迹。",
          "componentId": "prompt-modes"
        }
      ],
      "insight": "ReAct 不要求每个动作前都生成思考；知识任务密集交错，决策任务可以只在需要时插入思考。",
      "takeaways": [
        {
          "icon": "🔎",
          "title": "示例是上下文",
          "desc": "人工编写的示范轨迹放入提示；主要实验的模型参数保持冻结。"
        },
        {
          "icon": "📖",
          "title": "思考可以稀疏",
          "desc": "ALFWorld 与 WebShop 允许连续行动，在需要规划、核验或调整时插入思考。"
        },
        {
          "icon": "✓",
          "title": "任务决定格式",
          "desc": "6、3、2、1 是实验四类任务采用的示例数，不能据此推导示例数量与效果的普遍关系。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "一次检索，怎样变成下一步依据",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "提示给出查证范例，工具接口决定每次行动实际能取得什么。亲手走一遍简化轨迹，区分找到实体与搜索页内关键词。",
      "analogy": {
        "title": "打开参考条目",
        "text": "search 打开实体页，lookup 在当前页内寻找下一句匹配内容，finish 提交答案。这里演示接口行为，不联网执行。",
        "componentId": "analogy6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "在当前页上查找，再提交答案",
          "desc": "先 search 作品，在当前页 lookup 作者，再 search 作者全名，最后 finish 提交里昂。按钮的解锁顺序仅用于引导学习；这里用已整理的事实片段模拟接口，不联网查询。",
          "componentId": "wiki-tools"
        }
      ],
      "insight": "search 切换当前实体页，lookup 只检查当前页；把页内查找当成全网搜索，会误解新证据从哪里来。",
      "takeaways": [
        {
          "icon": "🔎",
          "title": "search 找到实体",
          "desc": "实验接口返回实体页前五句；未找到实体时返回五个近似实体。这个受限接口不等同于开放网页搜索。"
        },
        {
          "icon": "📖",
          "title": "lookup 定位页内",
          "desc": "lookup 返回当前页中下一个包含关键词的句子。重新 search 后，当前页随之改变。"
        },
        {
          "icon": "✓",
          "title": "finish 提交答案",
          "desc": "finish 提交答案并结束任务，不再返回检索证据。提交成功不代表答案已经通过正确性验证。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "提示与微调，是两种学习方式",
      "badge": "trn",
      "badgeLabel": "进阶理解",
      "bridge": "会执行轨迹之后，再辨清模型有没有改变参数。ReAct 可以通过冻结模型的少样本提示实现，也可以用轨迹微调小模型。",
      "analogy": {
        "title": "输入范例与训练更新",
        "text": "提示把示例放进当前输入，参数保持不变；监督微调用轨迹训练，才会更新模型参数。",
        "componentId": "analogy7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "示例改变输入，训练更新参数",
          "desc": "主要实验使用冻结的 PaLM-540B；小模型轨迹微调会更新参数。上下文页与参数圆环是机制示意，不表示测得的学习曲线。",
          "componentId": "training-modes"
        }
      ],
      "insight": "微调用答案正确的生成轨迹更新参数，属于监督式轨迹学习。",
      "takeaways": [
        {
          "icon": "🔎",
          "title": "冻结也能做 ReAct",
          "desc": "主要实验把人工编写的轨迹放进提示上下文，PaLM-540B 参数保持冻结。"
        },
        {
          "icon": "📖",
          "title": "微调学习完整轨迹",
          "desc": "初步微调用 3,000 条答案正确的模型生成轨迹训练 PaLM-8B 或 62B，学习解码完整轨迹。"
        },
        {
          "icon": "✓",
          "title": "定性结果有范围",
          "desc": "在 HotpotQA 上，小模型直接提示 ReAct 较难；轨迹微调后，ReAct 在比较的四种格式中表现最好。这一排序不应推广到所有任务。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "闭环在哪里：模型、工具与上下文",
      "badge": "trn",
      "badgeLabel": "进阶理解",
      "bridge": "把前面的思考、动作与观察拼成系统图。重点是每个组件接收什么、产生什么，以及结果如何回到下一次生成。",
      "analogy": {
        "title": "让反馈回到笔记",
        "text": "模型读上下文、提出动作，工具执行并返回观察；观察加入上下文，影响下一步生成。思考可以直接回写上下文。",
        "componentId": "analogy8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "沿连接辨认职责",
          "desc": "四个部件从左到右是上下文、模型、工具和观察。上方短回路表示思考回写，下方长回路表示环境观察回写；选中部件可查看职责与连接。",
          "componentId": "system-map"
        }
      ],
      "insight": "环境观察回到上下文，下一步推理才有机会利用新信息。",
      "takeaways": [
        {
          "icon": "🔎",
          "title": "模型负责生成",
          "desc": "语言模型根据已有上下文生成思考或动作；ReAct 没有提出新的神经网络层。"
        },
        {
          "icon": "📖",
          "title": "工具负责执行",
          "desc": "环境执行允许的动作并返回信息。工具返回的内容仍需要模型判断和整合。"
        },
        {
          "icon": "✓",
          "title": "观察回到上下文",
          "desc": "新观察改变下一次生成的依据；模型自己写出的思考不能冒充环境返回的证据。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "不确定时，换一种信息来源",
      "badge": "both",
      "badgeLabel": "进阶理解",
      "bridge": "一条推理路径可能走偏，多条路径也可能一起受同一错误影响。先看 CoT-SC 怎样汇总内部推理，再看它为什么需要与外部查证互补。",
      "analogy": {
        "title": "多条思路，汇总到答案",
        "text": "CoT-SC 对同一道问题采样多条推理路径，再按最终答案聚合。它增加的是内部推理的多样性，并没有自动获得新的外部证据。",
        "componentId": "analogy9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "从一条推理，到多条路径的共识",
          "desc": "Self-Consistency（自一致性）采样不同的推理路径，比较它们最终给出的答案。动画用五条路径说明汇总过程；这不是固定采样数。切换情境，观察“答案一致”为什么仍不等于“答案正确”。",
          "componentId": "consistency-paths"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "什么时候从内部共识转向外部查证？",
          "desc": "先理解路径汇总，再看一个具体的回退协议：CoT-SC 以温度 0.7 采样 21 次，最多票答案不足 11 票时，转向 ReAct 补充外部信息。这个阈值属于实验设置，不是自一致性方法的定义。",
          "componentId": "fallback-rule"
        },
        {
          "kind": "module",
          "id": "9.3",
          "title": "把互补机制与实验结果连起来",
          "desc": "选择回退方向，再切换任务。左侧展示信息来源怎样切换，右侧在同一任务、同一指标下比较单独方法与组合方法；展开条形只展示固定结果，不表示学习过程。",
          "componentId": "hybrid-results"
        }
      ],
      "insight": "CoT-SC 汇总内部推理，ReAct 引入环境反馈。两者互补的价值来自不同的信息来源，而不是某个采样次数本身。",
      "takeaways": [
        {
          "icon": "🔎",
          "title": "共识不是事实证明",
          "desc": "多条路径可能减少单次推理的偶然偏差，也可能共享错误前提；一致程度不是校准后的正确概率。"
        },
        {
          "icon": "📖",
          "title": "回退方向有区别",
          "desc": "CoT-SC → ReAct 看答案是否分散；ReAct → CoT-SC 看有限步数内是否仍未作答。两种条件各有用途。"
        },
        {
          "icon": "✓",
          "title": "结果必须带着条件看",
          "desc": "组合方法在这里的两类知识任务上更好，但两个回退方向的相对表现随任务改变，不能据此断言某个方向总占优。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "看清收益，也看清边界",
      "badge": "both",
      "badgeLabel": "进阶理解",
      "bridge": "最后用原表检验直觉：先对齐任务、指标和设置，再判断哪种方法更好。保留负面结果，才能看清 ReAct 实际解决了什么。",
      "analogy": {
        "title": "对齐指标再比较",
        "text": "同一任务、同一指标下才能比较高低。条形逐渐展开只是展示固定结果，不表示训练过程。",
        "componentId": "analogy10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "结合任务与设置比较结果",
          "desc": "条形共享 0–100 标尺，启动后的增长只揭示原表数值，不代表学习速度。HotpotQA 保留 ReAct 低于 CoT 的结果；ALFWorld 区分平均与最佳；WebShop 保留人类专家参照。",
          "componentId": "result-race"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "失败来自哪里？",
          "desc": "每种方法分别抽取 50 条答对轨迹和 50 条答错轨迹；此图只比较失败案例中的类型比例。四舍五入可能使合计不为 100%；划线空框表示不适用。一次抽样中的幻觉为 0%，不等于方法不会幻觉。",
          "componentId": "failure-modes"
        },
        {
          "kind": "module",
          "id": "10.3",
          "title": "闭环仍然会遇到哪些限制？",
          "desc": "切换四种情况，观察信息不足、行动重复、上下文容量和示例覆盖如何影响同一个闭环。可读的过程有助于检查，但不会自动消除这些限制。",
          "componentId": "limitations"
        }
      ],
      "insight": "可读的轨迹便于检查，但不能证明推理正确，也不能证明幻觉已被消除。",
      "takeaways": [
        {
          "icon": "🔎",
          "title": "逐项核对协议",
          "desc": "知识任务分别比较 EM 与准确率；ALFWorld 分开平均和最佳；WebShop 区分成功率和属性覆盖分数。GPT-3 补充验证使用独立 HotpotQA 子集和特定 ALFWorld 提示，不能拼入主表。"
        },
        {
          "icon": "📖",
          "title": "提高不等于解决",
          "desc": "ReAct-IM 最佳成功率 53%，低于 ReAct 的 71%，支持灵活思考的作用；但并非所有任务都占优，WebShop 仍落后于人类专家。"
        },
        {
          "icon": "✓",
          "title": "保留失败边界",
          "desc": "错误检索、重复行动、上下文长度和示例覆盖仍构成限制。人工修改思考后成功只是个案，抽样中的零幻觉也不代表普遍可靠。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV16u411b7bq",
      "title": "ReAct 作者报告｜姚顺雨",
      "reason": "从思考、行动与环境反馈理解 ReAct。",
      "views": "6200播放",
      "cover": "video-covers/BV16u411b7bq.jpg"
    },
    {
      "bvid": "BV1WC411b7VM",
      "title": "ReAct 工具调用基础讲解",
      "reason": "补充理解工具调用与外部信息；后续工程扩展不等同于这些实验。",
      "views": "1.4万播放",
      "cover": "video-covers/BV1WC411b7VM.jpg"
    }
  ]
};
