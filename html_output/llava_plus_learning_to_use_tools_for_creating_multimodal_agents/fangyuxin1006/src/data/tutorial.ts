import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "LLaVA-Plus: Learning to Use Tools for Creating Multimodal Agents",
    "titleZh": "LLaVA-Plus：学习使用工具，构建多模态智能体",
    "venue": "",
    "authors": "Shilong Liu、Hao Cheng、Haotian Liu 等",
    "affiliation": "清华大学 · Microsoft Research · UW–Madison · HKUST / IDEA",
    "domain": "多模态智能体 · 视觉指令微调",
    "coreProblem": "会看图、会回答的模型，怎样进一步学会分割、编辑与检索？",
    "coreInsight": "把多模态模型作为能看图的规划器，通过完整工具对话训练它选择专家、组织提示参数并整合结果。",
    "keywords": [
      "多模态规划器",
      "工具使用",
      "视觉指令微调",
      "技能组合"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "传统 LLaVA：理解图文并生成文字，描述对象并不会直接产生可编辑选区。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "LLaVA-Plus：结合原始图像规划，学习调用专家，把目标分割成可以继续操作的区域。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "会描述，还不等于会动手",
      "badge": "inf",
      "badgeLabel": "理解与推理",
      "bridge": "能说出照片里有什么，不代表能返回物体掩码。先观察同一个请求在“只回答”和“会用工具”两种设定下的差别。 后续用自绘场景和预设结果演示输入输出及信息顺序，不运行真实模型。",
      "analogy": {
        "title": "从描述到可操作的结果",
        "text": "把机场的行李箱分割出来：文字回答只会描述它；工具协作则描出物体轮廓、提取选区，并让这一结果成为后续编辑的输入。",
        "componentId": "analogy-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "会描述，还不等于会动手",
          "desc": "观察行李箱先被检测框定位、再被细化为区域；切换点选与修补，查看掩码怎样成为后续编辑条件。",
          "componentId": "chapter-1-widget"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "能力边界",
          "desc": "文本回答与掩码、图像等输出是不同能力。"
        },
        {
          "icon": "🔧",
          "title": "扩展方式",
          "desc": "让多模态模型学习调用现成专家工具。"
        },
        {
          "icon": "◇",
          "title": "示意边界",
          "desc": "这里展示机制，不运行模型，也不代表实测速度。"
        }
      ],
      "insight": "创新点：把视觉指令微调与工具协作结合；构建完整的多模态工具使用数据；让原始图像贯穿规划、调用与结果整合。"
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "让意图落到图像上",
      "badge": "inf",
      "badgeLabel": "理解与推理",
      "bridge": "工具需要知道你说的是哪个区域。除了自然语言，LLaVA-Plus 还接收点等视觉提示，把位置转成可读的指令信息。",
      "analogy": {
        "title": "让位置提示与目标对应",
        "text": "在苹果和梨之间改变点提示，对应物体的轮廓和二值区域随之改变。自然语言说明任务，空间位置明确操作对象。",
        "componentId": "analogy-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "让意图落到图像上",
          "desc": "在果物图上拖动位置标记，比较苹果、梨与背景。坐标、二值网格和独立选区共同变化；这里用预设轮廓解释 SAM 类分割的输入输出。",
          "componentId": "chapter-2-widget"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两类输入",
          "desc": "问题说明目的，原图保留视觉证据。"
        },
        {
          "icon": "🔧",
          "title": "坐标表达",
          "desc": "点提示可转为文本坐标并拼接到问题中。"
        },
        {
          "icon": "◇",
          "title": "交互边界",
          "desc": "示例区域是手绘教学素材，不是 SAM 的预测。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "工具返回以后，还要看图",
      "badge": "inf",
      "badgeLabel": "理解与推理",
      "bridge": "位置明确了，工具结果也可能出错。模型若只复述返回的文字，就可能把误检一起带进回答。",
      "analogy": {
        "title": "回到图像，撤销错误候选",
        "text": "工具候选中先出现一只狗的类别图标。助手回到原图核对空路面，划除并撤销狗候选；原始图像始终不变。",
        "componentId": "analogy-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "工具返回以后，还要看图",
          "desc": "默认演示视觉复核：狗候选先完整出现，再被划除、移入撤销区并从输出集合消失。切换直接复述，比较错误候选如何被保留下来。",
          "componentId": "chapter-3-widget"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "视觉依据",
          "desc": "规划器自身能看图，而非只依赖工具的文字。"
        },
        {
          "icon": "🔧",
          "title": "特定证据",
          "desc": "以负类别提示构造纠错训练样本；在 COCO 验证集前100张图上检查误检。"
        },
        {
          "icon": "◇",
          "title": "仍有错误",
          "desc": "纠错能力不等于消除幻觉或保证可靠。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "把对话写成可执行的格式",
      "badge": "both",
      "badgeLabel": "方法与证据",
      "bridge": "知道需要工具，还得把意图写成执行器能够理解的请求。统一格式将直接回答和工具调用纳入同一种输出格式。",
      "analogy": {
        "title": "把请求填成真正的调用单",
        "text": "读取车票需要两次助手输出：先用统一字段请求 OCR；执行结果返回后，再用同一格式给出答案，并将 actions 设为空。",
        "componentId": "analogy-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "把对话写成可执行的格式",
          "desc": "比较发车时间、站台与底色。前两项先请求 OCR、再执行识字、最后汇总；底色问题直接看图回答。每次助手输出都保留三个统一字段。",
          "componentId": "chapter-4-widget"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "统一结构",
          "desc": "直接回答也保留相同字段，actions 可为空。"
        },
        {
          "icon": "🔧",
          "title": "执行边界",
          "desc": "调用列表交给工具执行器处理。"
        },
        {
          "icon": "◇",
          "title": "接口边界",
          "desc": "用户界面通常隐藏技能对话，显示最终 value。"
        }
      ],
      "insight": "提示组织分为任务意图、空间位置、工具参数和返回上下文。统一字段协调这些内容，并不额外假设一个独立的“提示词管理器”架构。"
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "按任务挑工具，而非全都调用",
      "badge": "both",
      "badgeLabel": "方法与证据",
      "bridge": "统一接口不意味着工具可以互换。读文字、选对象、修改图片，需要不同专家，也需要不同参数。",
      "analogy": {
        "title": "让任务匹配专业能力",
        "text": "面包店招牌需要识字，雨伞需要分割，城市夜景需要编辑，地标问题需要检索。工具的输入参数和输出形式随任务改变。",
        "componentId": "analogy-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "按任务挑工具，而非全都调用",
          "desc": "在招牌识字、雨伞分割、城市夜景和地标检索之间切换。观察扫描框、独立伞面、光照转换和图文匹配四种不同操作。",
          "componentId": "chapter-5-widget"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "专家分工",
          "desc": "检测、分割、OCR、生成和检索各有用途。"
        },
        {
          "icon": "🔧",
          "title": "参数有别",
          "desc": "有些技能仅需图像，有些还需概念、点或编辑指令。"
        },
        {
          "icon": "◇",
          "title": "接入条件",
          "desc": "通过相关工具使用数据微调扩展能力。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "一次请求，怎样走完闭环",
      "badge": "inf",
      "badgeLabel": "理解与推理",
      "bridge": "选对工具只完成一半。接下来把工具调用、返回结果和最终回复连起来，观察信息如何回到助手。",
      "analogy": {
        "title": "让工具结果回到对话",
        "text": "询问图中有几只鸟：助手请求检测，工具返回三个目标框，再把原问题、结果与原始图像结合，形成“有 3 只鸟”的回答。",
        "componentId": "analogy-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "一次请求，怎样走完闭环",
          "desc": "请求先发出，检测结果随后返回，并重新附上原问题。助手继续利用图像和已有对话，再形成最终回复；尚未返回的结果不能提前参与本步决策。",
          "componentId": "chapter-6-widget"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "四步闭环",
          "desc": "输入、技能请求、技能结果、最终回答各有角色。"
        },
        {
          "icon": "🔧",
          "title": "图像持续参与",
          "desc": "综合返回结果时仍利用原始图像信息。"
        },
        {
          "icon": "◇",
          "title": "停止条件",
          "desc": "actions=[] 表示不发起工具调用；<STOP> 表示序列结束，多轮对话仍可继续。"
        }
      ],
      "formula": {
        "lead": "两类对话共同组成序列：助手先请求技能，再读取执行结果并结合图像回答。",
        "unicode": "Human: (I_q, X_q) → Assistant: X_skill_use → Human: X_skill_result → Assistant: X_answer",
        "symbols": [
          {
            "sym": "I_q",
            "desc": "用户输入图像；始终参与规划和结果整合。"
          },
          {
            "sym": "X_q",
            "desc": "用户问题文本。"
          },
          {
            "sym": "X_skill_use",
            "desc": "助手生成的技能调用文本。"
          },
          {
            "sym": "X_skill_result",
            "desc": "工具返回信息，作为下一段对话的条件。"
          },
          {
            "sym": "X_answer",
            "desc": "最终面向用户的助手回答。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "训练什么，哪些 token 计入损失",
      "badge": "trn",
      "badgeLabel": "训练与系统",
      "bridge": "工具使用通过完整对话进行指令微调。自回归预测只使用当前位置之前可用的文本与图像条件，监督助手的调用、回答与停止。",
      "analogy": {
        "title": "保留完整上下文，只选择监督目标",
        "text": "用户、助手、工具返回与助手回答保持原有顺序。角色掩码只决定哪些目标位置计入损失，不把用户和工具内容从输入中删掉。",
        "componentId": "analogy-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "训练什么，哪些 token 计入损失",
          "desc": "点击对话行，检查本步可见的前文、目标词元概率与加权损失。风筝示例展示离线构造：先改写请求，再执行检测，最后按返回结果整理答案与四段样本。",
          "componentId": "chapter-7-widget"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "训练目标",
          "desc": "自回归学习工具请求、最终回答与停止。"
        },
        {
          "icon": "🔧",
          "title": "数据配合",
          "desc": "工具数据与转换为统一格式的 LLaVA-158K 混合。"
        },
        {
          "icon": "◇",
          "title": "评测设定",
          "desc": "定量模型用81K理解指令；演示模型用全量技能数据。"
        }
      ],
      "formula": {
        "lead": "使用角色掩码选择助手目标位置；因果条件只包含之前的文本与输入图像。这里把这一目标写成未按长度归一化的求和形式。",
        "unicode": "L = −Σ_t m_t log p_θ(y_t | I_q, y_＜t)",
        "symbols": [
          {
            "sym": "L",
            "desc": "未按长度归一化的非负标量损失，使用自然对数。"
          },
          {
            "sym": "m_t",
            "desc": "二值监督掩码：助手输出及相应停止token为1，用户和工具返回的目标位置为0；输入上下文仍保留。"
          },
          {
            "sym": "p_θ",
            "desc": "给定图像与序列前缀的词表概率分布；θ是模型参数。"
          },
          {
            "sym": "y_t",
            "desc": "第t个目标token，是离散符号。"
          },
          {
            "sym": "y_＜t",
            "desc": "当前位置之前的文本序列，含可用上下文信息。"
          },
          {
            "sym": "I_q",
            "desc": "输入图像条件。"
          }
        ]
      },
      "insight": "工具数据按技能类型构造，使用模板改写或少样本对话生成；已有图像描述、类别和标注框供离线构造使用。LLaVA-158K 也转换为统一输出格式。"
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "拆开系统：规划器、工具与执行器",
      "badge": "trn",
      "badgeLabel": "训练与系统",
      "bridge": "训练目标属于多模态规划器，专业模型承担具体任务。把系统各部分分开，才能理解“端到端学习工具使用”究竟指什么。",
      "analogy": {
        "title": "规划、执行与专家各司其职",
        "text": "规划器根据图像组织 window 目标请求，执行器解析和分派，专家返回对应区域。模型决定做什么，服务控制器协调请求到哪里执行。",
        "componentId": "analogy-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "拆开系统：规划器、工具与执行器",
          "desc": "查看规划器如何根据原图组织窗户检测，再由执行器运行专家。服务层中所有请求先交给模型理解；控制器协调工作进程，模型决定是否调用工具。",
          "componentId": "chapter-8-widget"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "All Tools 与 Fly：信息和调用如何取舍",
          "desc": "这里比较训练和评测时的配置：Fly 提供指令相关的工具结果；All Tools 汇集除分割外的视觉理解结果，作为额外符号上下文。",
          "componentId": "config-widget"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "系统边界",
          "desc": "学习工具使用，不等于所有专家联合训练。"
        },
        {
          "icon": "🔧",
          "title": "两种设定",
          "desc": "All Tools 预先补充视觉理解信息；Fly 按需调用。"
        },
        {
          "icon": "◇",
          "title": "成本边界",
          "desc": "需要考虑调用成本，但这里不虚构延迟或吞吐量。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "组合技能，也要保留失败边界",
      "badge": "trn",
      "badgeLabel": "训练与系统",
      "bridge": "模块化让工具能够组合：先选区域再修补，或先取布局再生成。但中间一步出错，后面的回答仍可能受影响。",
      "analogy": {
        "title": "先限定区域，再执行编辑",
        "text": "先点选主帆，再用 SAM 得到掩码，随后把图像、掩码和改色要求交给修补工具。这里的预设结果保留范围外内容，用于说明编辑约束。",
        "componentId": "analogy-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "组合技能，也要保留失败边界",
          "desc": "比较点选与局部修补、语义布局与条件生成、生成图像与配文，以及错误选区。同类建筑使用同一语义颜色；布局约束空间关系，不保证生成细节逐像素不变。",
          "componentId": "chapter-9-widget"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "组合来源",
          "desc": "相关组合任务的指令数据帮助学习使用多种技能。"
        },
        {
          "icon": "🔧",
          "title": "定性证据",
          "desc": "这些组合有对应的应用展示；自绘例子说明机制，不当作定量效果或普遍成功保证。"
        },
        {
          "icon": "◇",
          "title": "可靠性限制",
          "desc": "幻觉、误检和工具冲突仍然存在。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "读结果：进步在哪里，代价在哪里",
      "badge": "both",
      "badgeLabel": "方法与证据",
      "bridge": "会演示机制，还要看证据。下面按同一张表、同一种指标比较，保留负结果、评测规模和历史时间。",
      "analogy": {
        "title": "同一指标内比较，不跨尺度合并",
        "text": "两组动态条形图分别比较图像贴合与参考描述匹配。Plus 在 CLIP score 上较高，却在 CIDEr 上低于 BLIP2；数值始终可见，各指标保留各自结论。",
        "componentId": "analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "读结果：进步在哪里，代价在哪里",
          "desc": "选择评测任务，观察同一尺度下条形长度的展开；记录值立即完整显示，并保留评测协议、配置差异及不利结果。",
          "componentId": "chapter-10-widget"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "性能有条件",
          "desc": "保留 All Tools/Fly、参数规模、评测集合与指标。"
        },
        {
          "icon": "🔧",
          "title": "消融有差异",
          "desc": "不将某个数据集的退化推广到所有数据集。"
        },
        {
          "icon": "◇",
          "title": "结论有边界",
          "desc": "历史 Elo、44项工具评测与定性案例都不是通用保证。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1GS411P74b",
      "title": "自定义多模态大模型 LLaVA",
      "reason": "补充 LLaVA 基础与实现背景；不是 LLaVA-Plus 专题讲解。",
      "views": "1.6万播放",
      "cover": "https://i0.hdslb.com/bfs/archive/a0c7b72d201ec1dcbe0f1f3f5a3fbb039a1c52a5.jpg"
    }
  ]
};
