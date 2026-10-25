import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "LLaVA-Plus: Learning to Use Tools for Creating Multimodal Agents",
    "titleZh": "LLaVA-Plus：学习使用工具来构建多模态智能体",
    "venue": "ECCV 2024",
    "authors": "Shilong Liu、Hao Cheng、Haotian Liu、Hao Zhang、Feng Li、Tianhe Ren、Xueyan Zou、Jianwei Yang、Hang Su、Jun Zhu、Lei Zhang、Jianfeng Gao、Chunyuan Li",
    "affiliation": "清华大学 · Microsoft Research · UW–Madison · HKUST · IDEA",
    "domain": "多模态智能体 · 工具学习",
    "coreProblem": "模型能描述照片，却未必能选择工具、填写参数并交付视觉结果。",
    "coreInsight": "通过多模态工具指令训练，让规划者持续结合图像、请求和工具回传来行动。",
    "keywords": [
      "多模态智能体",
      "工具学习",
      "指令微调",
      "视觉提示"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "只给文字描述，无法交付选区和编辑结果（概念示意）。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "学习选择并调用专业工具，再结合图像整合结果（概念示意）。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "从“说出来”到“做出来”",
      "badge": "inf",
      "badgeLabel": "推理基础",
      "bridge": "先看同一张照片：文字回答之外，分割结果究竟从哪里来？",
      "analogy": {
        "title": "先选能完成任务的工具",
        "text": "修图时，解释怎样修还不够；手里要有能改变画面的工具。",
        "componentId": "analogy-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "同一任务：文字回答与工具输出",
          "desc": "切换两种方式，查看女孩与推车的分割结果。左侧是概念对照；右侧重放论文表1，不调用真实模型。",
          "componentId": "c1-capability"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "先判断这次需要什么输出",
          "desc": "选择请求，查看需要文本、区域还是图像；普通回答不必强行调用工具。",
          "componentId": "c1-request"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "先看目标",
          "desc": "文字、区域和图像是不同输出。"
        },
        {
          "icon": "🛠️",
          "title": "工具做专长",
          "desc": "外部模型提供分割、生成等能力。"
        },
        {
          "icon": "🔎",
          "title": "规划仍会错",
          "desc": "可用工具不等于所有任务都能成功。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "图像与视觉提示也参与决策",
      "badge": "inf",
      "badgeLabel": "推理基础",
      "bridge": "确定了输出，还要明确在图中处理哪里；只留下文字会遗漏什么？",
      "analogy": {
        "title": "在照片上指出目标",
        "text": "同一句“处理这里”，配上照片中的位置，才成为明确的修图要求。",
        "componentId": "analogy-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "移动选点，改变目标区域",
          "desc": "在原文照片上移动教学选点；坐标随选点更新。位置提示用于解释视觉交互，不是重新运行SAM。",
          "componentId": "c2-prompt"
        }
      ],
      "takeaways": [
        {
          "icon": "🖼️",
          "title": "图像不缺席",
          "desc": "规划器直接使用图像和指令。"
        },
        {
          "icon": "📍",
          "title": "位置补意图",
          "desc": "点、框或草图能表达视觉目标。"
        },
        {
          "icon": "📐",
          "title": "示意要标明",
          "desc": "教学选点不冒充论文新预测。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "从请求匹配到技能库",
      "badge": "inf",
      "badgeLabel": "推理基础",
      "bridge": "对象选好了，接下来是为任务匹配能力；技能库里有哪些不同专长？",
      "analogy": {
        "title": "从工具盘挑一件工具",
        "text": "放大镜、选区笔和画笔各有用途；选对工具比把所有工具都拿出来更重要。",
        "componentId": "analogy-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "换一种任务，观察工具的输入与输出",
          "desc": "选择任务后，工具、参数结构和输出类型一起更新。图示只解释接口，不生成新模型预测。",
          "componentId": "c3-skills"
        }
      ],
      "takeaways": [
        {
          "icon": "🧰",
          "title": "按能力分类",
          "desc": "理解、生成、检索和视觉交互各有工具。"
        },
        {
          "icon": "🔌",
          "title": "接口有差别",
          "desc": "输入参数和返回类型不能混用。"
        },
        {
          "icon": "🔗",
          "title": "还可组合",
          "desc": "单工具之外还有组合技能的数据。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "把计划、调用和回答分开",
      "badge": "both",
      "badgeLabel": "共同基础",
      "bridge": "知道选哪种工具后，还需要一套机器可执行、用户可阅读的统一输出格式。",
      "analogy": {
        "title": "在操作卡上写清要求",
        "text": "修图卡既要写给操作者的动作，也要写给顾客的说明；两者不是一回事。",
        "componentId": "analogy-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "actions为空时，会发生什么？",
          "desc": "选择工具、填写caption并检查调用；试试选错能力或留空参数，观察JSON与执行分支如何变化。",
          "componentId": "c4-format"
        }
      ],
      "takeaways": [
        {
          "icon": "🧠",
          "title": "thoughts说计划",
          "desc": "它是训练格式中的说明字段。"
        },
        {
          "icon": "⚙️",
          "title": "actions能执行",
          "desc": "调用名与参数都有明确位置。"
        },
        {
          "icon": "💬",
          "title": "value给用户看",
          "desc": "内部工具对话和最终呈现分开。"
        }
      ],
      "formula": {
        "lead": "论文用两轮对话串起请求、工具返回与最终回答；这表示序列关系，不是向量相加。",
        "unicode": "(I_q, X_q) → X_skill_use；X_skill_result → X_answer",
        "symbols": [
          {
            "sym": "I_q",
            "desc": "输入图像；像素尺寸随样本变化，论文没有在此固定张量形状。"
          },
          {
            "sym": "X_q",
            "desc": "用户的文本指令序列。"
          },
          {
            "sym": "X_skill_use",
            "desc": "助手生成的工具使用请求，包含thoughts、actions和value。"
          },
          {
            "sym": "X_skill_result",
            "desc": "工具执行结果构成的上下文，不是助手要模仿生成的答案。"
          },
          {
            "sym": "X_answer",
            "desc": "助手整合图像、问题和结果后生成的回答。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "组合技能：用布局约束生成",
      "badge": "both",
      "badgeLabel": "共同基础",
      "bridge": "统一调用能连接不同技能；但要让生成保留原图关系，还需要把什么传过去？",
      "analogy": {
        "title": "沿原照片描出布局",
        "text": "修图可以改变场景，却仍让主体留在原来位置；布局就像描好的轮廓。",
        "componentId": "analogy-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "从自行车照片到海底场景",
          "desc": "选择原图、语义布局与条件生成三个阶段，重放图3的原始图像；不把静态示例当作实时生成。",
          "componentId": "c5-composition"
        }
      ],
      "takeaways": [
        {
          "icon": "🧩",
          "title": "输出可作输入",
          "desc": "布局能成为后续生成的条件。"
        },
        {
          "icon": "🎨",
          "title": "内容可变化",
          "desc": "场景改变不等于丢掉空间关系。"
        },
        {
          "icon": "🧪",
          "title": "单例有限",
          "desc": "图3没有给出所有场景的成功率。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "一次完整工具对话怎样执行",
      "badge": "inf",
      "badgeLabel": "推理基础",
      "bridge": "把调用与组合放回完整交互：请求发出后，哪些值何时出现，什么时候结束？",
      "analogy": {
        "title": "揭开处理后的照片",
        "text": "先说明要做什么，结果真正返回后，才有依据交付完成的照片。",
        "componentId": "analogy-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "逐步检查女孩与推车的处理记录",
          "desc": "自动重放或逐步检查论文表1；可暂停、回退和重置，照片、调用、回传框和最终回答保持同步。",
          "componentId": "c6-dialogue"
        }
      ],
      "takeaways": [
        {
          "icon": "📥",
          "title": "请求包含图文",
          "desc": "规划以问题和照片为上下文。"
        },
        {
          "icon": "📤",
          "title": "回传再整合",
          "desc": "结果支持后续回答，不是事后装饰。"
        },
        {
          "icon": "🛑",
          "title": "结束有标记",
          "desc": "空actions表示没有下一次工具调用。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "学习使用工具：只监督该生成的部分",
      "badge": "trn",
      "badgeLabel": "系统与训练",
      "bridge": "上述行为不是靠界面按钮学会的：训练数据和监督目标分别是什么？",
      "analogy": {
        "title": "沿示范笔迹练习",
        "text": "练习时模仿应由自己写出的笔迹，不把别人提供的提示也当成自己的答案。",
        "componentId": "analogy-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "哪些token应该计入损失？",
          "desc": "切换监督范围并调整教学概率，观察掩码与交叉熵计算。数值是教学计算，不是论文训练曲线。",
          "componentId": "c7-loss"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "定量实验与演示系统用了什么数据？",
          "desc": "切换两种配方，查看启用的技能范围；表2的行计数可展开，不把组合行之和说成独立图像数。",
          "componentId": "c7-data"
        }
      ],
      "takeaways": [
        {
          "icon": "🟩",
          "title": "监督助手输出",
          "desc": "技能请求和最终回答是生成目标。"
        },
        {
          "icon": "📚",
          "title": "上下文有用途",
          "desc": "用户与工具结果提供条件。"
        },
        {
          "icon": "🧪",
          "title": "配方要区分",
          "desc": "81K定量模型与完整演示系统不同。"
        }
      ],
      "formula": {
        "lead": "原文只监督助手子序列。下面用标准掩码交叉熵写出教学等价形式，未声称这是论文另列的公式。",
        "unicode": "L = −Σₜ mₜ log pθ(yₜ | y₁:ₜ₋₁, I_q) / Σₜ mₜ",
        "symbols": [
          {
            "sym": "mₜ",
            "desc": "监督掩码，取0或1；只在助手目标token及相应停止token处取1，分母须大于0。"
          },
          {
            "sym": "pθ",
            "desc": "模型对正确目标token的条件概率，范围(0,1]；滑块使用教学概率而非实测模型值。"
          },
          {
            "sym": "yₜ",
            "desc": "第t个目标token；其前文y₁:ₜ₋₁包含先前可用的对话内容。"
          },
          {
            "sym": "L",
            "desc": "所选目标token的平均负对数似然，教学例子中越低表示给定词的概率越高，不代表总体能力。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "系统结构：规划者与执行者",
      "badge": "trn",
      "badgeLabel": "系统与训练",
      "bridge": "学会生成调用后，还要由系统把调用交给工具；把角色放回同一张结构图。",
      "analogy": {
        "title": "把一件工具放回工具盘",
        "text": "安排工具的位置不等于替工具做事；规划、执行和交付各有角色。",
        "componentId": "analogy-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点选角色，追踪输入、调用与回传",
          "desc": "选择结构中的一个角色，相关路径、输入与输出同步高亮；图像在规划和整合回答时持续参与。",
          "componentId": "c8-system"
        }
      ],
      "takeaways": [
        {
          "icon": "🧭",
          "title": "LMM负责规划",
          "desc": "视觉信息持续参与选择和回答。"
        },
        {
          "icon": "🔧",
          "title": "专用模型执行",
          "desc": "工具结果沿回传路径进入上下文。"
        },
        {
          "icon": "🖥️",
          "title": "服务也是系统",
          "desc": "FastChat协调界面、模型和控制器。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "反例与消融：工具并非越多越好",
      "badge": "trn",
      "badgeLabel": "系统与训练",
      "bridge": "结构能运行不代表每种训练或调用方式都更好；现在检查论文里的具体反例。",
      "analogy": {
        "title": "对照原片检查修改",
        "text": "新增一件工具不等于修得更好；比较前要对齐照片、规则和任务。",
        "componentId": "analogy-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "同一策略，换个评测会怎样？",
          "desc": "选择协议与策略，对照原表4的汇总分数。相对得分与准确率分别标注，不混成一张总榜。",
          "componentId": "c9-ablation"
        }
      ],
      "takeaways": [
        {
          "icon": "📊",
          "title": "对齐协议",
          "desc": "相对分数和准确率不是同一指标。"
        },
        {
          "icon": "⚖️",
          "title": "收益有条件",
          "desc": "Fly与All Tools的结果不能混用。"
        },
        {
          "icon": "⚠️",
          "title": "仍有局限",
          "desc": "幻觉和工具冲突是原文明确的问题。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "实验结果：收益与边界一起看",
      "badge": "both",
      "badgeLabel": "共同基础",
      "bridge": "把前面的判断放回完整结果表：哪些提升可靠，哪些结论不能扩大？",
      "analogy": {
        "title": "把修整结果放在原片旁",
        "text": "最后用同一把尺子并排比较，既看改善，也看没有改善的部分。",
        "componentId": "analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "实验结果总结",
          "desc": "直接展示当前评测的结果与结论；切换协议可查看其他结果。完整原表保留数值、实验组别和不确定性，榜单为论文当时的记录。",
          "componentId": "c10-results"
        }
      ],
      "takeaways": [
        {
          "icon": "📏",
          "title": "比较有条件",
          "desc": "数据集、规模、协议和指标都要对齐。"
        },
        {
          "icon": "🧩",
          "title": "能力能扩展",
          "desc": "工具和训练数据让系统学会更多任务。"
        },
        {
          "icon": "🛑",
          "title": "可靠性未解决",
          "desc": "幻觉、冲突和额外工具成本仍需考虑。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1u34y1w7us",
      "title": "LLaVA-Plus 论文精读",
      "reason": "直接讲解本论文；虽播放量较低，主题比通用LLaVA入门更匹配。",
      "cover": "https://i0.hdslb.com/bfs/archive/38d834eb657e1a3def0f5ae52453b323d46e87a1.jpg",
      "views": "346播放（2026-10-18快照）"
    }
  ]
};
