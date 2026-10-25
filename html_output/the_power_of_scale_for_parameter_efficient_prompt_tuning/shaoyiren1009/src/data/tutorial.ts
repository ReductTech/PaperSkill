import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "The Power of Scale for Parameter-Efficient Prompt Tuning",
    "titleZh": "桃源 · 提示训练师",
    "venue": "2021 · arXiv v2 · 2104.08691",
    "authors": "Brian Lester / Rami Al-Rfou / Noah Constant",
    "affiliation": "Google Research",
    "domain": "Robot Prompt Trainer · 交互论文故事",
    "coreProblem": "如果机器人已经足够聪明，我们到底需要重新训练它，还是教会它理解当前任务？",
    "coreInsight": "在本文的T5实验中，模型越大，轻量软提示越接近完整模型调优。",
    "keywords": [
      "Prompt Tuning",
      "Soft Prompt",
      "Frozen Backbone",
      "机器人训练师"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "为每个任务准备完整模型副本，任务一多，存储负担也变大。你的核心大脑不开放修改。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "你是 Robot Prompt Trainer。学习任务专用软提示，引导一个冻结底座；以论文证据而非故事成功率检验它。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "聪明，却不知此刻该做什么",
      "badge": "inf",
      "badgeLabel": "观察与实验",
      "bridge": "机器人在桃源醒来。它理解语言，也能回答常识，但“判断情绪”“判断两句是否同义”需要不同的任务约定。你是 <b>Robot Prompt Trainer</b>，核心大脑只读。",
      "analogy": {
        "title": "知识是底座，任务是方向",
        "text": "它不是失去语言能力；缺少任务约定时，同一句输入可以得到许多合理输出。故事中的机器人是语言模型的比喻。",
        "componentId": "analogy-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "交付第一项任务",
          "desc": "选择情绪或同义判断任务，并尝试无提示与任务提示；输出是脚本化教学示例，不是在线语言模型。",
          "componentId": "task"
        }
      ],
      "takeaways": [
        {
          "icon": "◌",
          "title": "基础能力",
          "desc": "底座能理解语言，不保证自动知道当前任务约定。"
        },
        {
          "icon": "⌁",
          "title": "任务约定",
          "desc": "相同输入可以对应情绪、同义判断等不同目标。"
        },
        {
          "icon": "✧",
          "title": "核心只读",
          "desc": "故事输出是脚本示例，不是在线模型的能力测试。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "为每个任务重写大脑，代价多大？",
      "badge": "inf",
      "badgeLabel": "观察与实验",
      "bridge": "机器人有能力，直接给它完整微调似乎也能学会任务。但当花园里出现许多任务，你真的要保存许多份庞大的核心吗？这里比较方案成本，不允许改写你的机器人。",
      "analogy": {
        "title": "保存一颗大脑，还是许多份副本",
        "text": "选择适配方案时，也要计算每任务需要保存的参数；完整微调可以有效，但成本随任务数增加。",
        "componentId": "analogy-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "任务越来越多",
          "desc": "任务数量与方案切换驱动共享机器人及参数总数；仅比较参数存储。",
          "componentId": "cost"
        }
      ],
      "takeaways": [
        {
          "icon": "◌",
          "title": "完整微调有效",
          "desc": "完整模型调优是强基线；此处只观测副本成本。"
        },
        {
          "icon": "⌁",
          "title": "任务参数很少",
          "desc": "5个提示token×4,096维＝20,480个任务参数。"
        },
        {
          "icon": "✧",
          "title": "不等于训练免费",
          "desc": "仍需保存并运行庞大底座，训练也有前后向成本。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "写一句指令，还不够稳定",
      "badge": "inf",
      "badgeLabel": "观察与实验",
      "bridge": "保留大脑，只告诉它“现在做什么”行不行？先试试文字提示，再观察为何人类必须反复设计说明与示例。",
      "analogy": {
        "title": "一句话指向同一任务",
        "text": "<b>Hard Prompt</b> 是词表里的离散文字。它能引导输出，但人工设计易出错；故事示例不代表所有大模型的实际表现。",
        "componentId": "analogy-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "选择任务签",
          "desc": "切换没有说明、含糊说明、明确标签约定；同步机器人表情、文字签与脚本输出。",
          "componentId": "hard"
        }
      ],
      "takeaways": [
        {
          "icon": "◌",
          "title": "文字是离散的",
          "desc": "文字提示从固定词表选择token，嵌入本身不更新。"
        },
        {
          "icon": "⌁",
          "title": "人类设计成本",
          "desc": "含糊说明不限定输出；明确标签约定更易控制示例。"
        },
        {
          "icon": "✧",
          "title": "需要学习信号",
          "desc": "论文还指出上下文容量、人类设计与效果差距。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "让提示自己学习",
      "badge": "both",
      "badgeLabel": "观察与实验",
      "bridge": "人工任务签需要试错。能否跳出固定词语，直接学习输入前的一小组连续向量？你把任务签换成可调的 <b>Soft Prompt</b>，大脑封印仍然完好。",
      "analogy": {
        "title": "提示石不是秘密词语",
        "text": "软提示并不一定对应可读词语；它是模型嵌入空间里的可训练参数。向量位置实验只是二维示意。",
        "componentId": "analogy-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "安放软提示",
          "desc": "拖动或按钮移动提示点，连到输入嵌入；真实维度用文字说明，二维坐标不声称是T5表示。",
          "componentId": "embed"
        }
      ],
      "takeaways": [
        {
          "icon": "◌",
          "title": "连续向量",
          "desc": "软提示Pₑ是p×e连续参数矩阵，不是隐藏的自然语言句子。"
        },
        {
          "icon": "⌁",
          "title": "输入前拼接",
          "desc": "Pₑ放在Xₑ之前，合成(p+n)×e输入。"
        },
        {
          "icon": "✧",
          "title": "不是Prefix Tuning",
          "desc": "本文只在编码器输入前加提示，不为每层添加前缀。"
        }
      ],
      "formula": {
        "lead": "先把可学习提示接到嵌入输入前，再让冻结的编码器与解码器照常工作。",
        "unicode": "[Pₑ ; Xₑ] ∈ ℝ⁽ᵖ⁺ⁿ⁾ˣᵉ",
        "symbols": [
          {
            "sym": "Pₑ",
            "desc": "p×e可训练提示矩阵；p为提示长度，e为T5嵌入维度。"
          },
          {
            "sym": "Xₑ",
            "desc": "n×e输入嵌入；来自冻结词表，n为输入token数量。"
          },
          {
            "sym": ";",
            "desc": "沿序列长度维拼接，不是逐元素相加；总长度p+n。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "封印大脑，只更新提示",
      "badge": "trn",
      "badgeLabel": "训练现场",
      "bridge": "提示石已经接上接口，但随机向量还不懂任务。标注样本告诉我们哪种输出正确，误差经冻结模型传回提示；你只修改提示参数。",
      "analogy": {
        "title": "让误差找到可以改变的地方",
        "text": "<b>冻结权重</b> 和 <b>停止梯度</b> 是两回事：底座不更新，但仍要计算提示的梯度。此处是一维逻辑回归教学模型，非T5训练。",
        "componentId": "analogy-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "执行一次提示更新",
          "desc": "逐步更新单参数二分类toy，按钮更新/重置；损失与概率是真实toy计算，核心校验始终只读。",
          "componentId": "train"
        }
      ],
      "takeaways": [
        {
          "icon": "◌",
          "title": "监督训练",
          "desc": "训练需要带目标输出Y的下游标注数据。"
        },
        {
          "icon": "⌁",
          "title": "梯度穿过底座",
          "desc": "误差可穿过冻结底座；冻结不表示把梯度截断。"
        },
        {
          "icon": "✧",
          "title": "只更新提示",
          "desc": "真实论文训练30,000步；演示只是一维toy。"
        }
      ],
      "formula": {
        "lead": "下面是§2最大化标签序列概率的等价负对数目标，仅对提示求更新。",
        "unicode": "L(Pₑ) = −Σₜ log Prθ(yₜ | y₁,…,yₜ₋₁, [Pₑ ; Xₑ])",
        "symbols": [
          {
            "sym": "Pₑ",
            "desc": "唯一被优化的任务参数；θ保持冻结。"
          },
          {
            "sym": "θ",
            "desc": "T5底座全部权重，仍参与前向与输入梯度计算。"
          },
          {
            "sym": "Σₜ",
            "desc": "对目标序列token的负对数概率求和；toy仅有一个二分类目标。"
          },
          {
            "sym": "y₁,…,yₜ₋₁",
            "desc": "当前token之前的目标序列；教师强制条件生成。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "这么少参数，真的够吗？",
      "badge": "both",
      "badgeLabel": "观察与实验",
      "bridge": "少量提示是否足够，不能只看机器人刚才的演示。你进入尺度观测室，比较论文的五种T5大小与模型调优基线。",
      "analogy": {
        "title": "越强的底座，越能响应引导",
        "text": "Figure 1 展示：模型变大后，Prompt Tuning 与 Model Tuning 的差距缩小。图上没有给出精确数值表，下面呈现定性趋势，不伪造数据点。",
        "componentId": "analogy-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "选择机器人底座尺度",
          "desc": "Small/Base/Large/XL/XXL按钮驱动机器人尺寸与差距定性显示；标明Figure1协议。",
          "componentId": "scale"
        }
      ],
      "takeaways": [
        {
          "icon": "◌",
          "title": "SuperGLUE开发集",
          "desc": "对比在SuperGLUE开发集，调优结果取3次均值及标准差。"
        },
        {
          "icon": "⌁",
          "title": "3次均值及标准差",
          "desc": "默认为100K LM适配、100token、类别标签初始化。"
        },
        {
          "icon": "✧",
          "title": "结论有条件",
          "desc": "XXL接近模型调优是实验证据，不是全任务定理。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "提示多长，从哪里开始？",
      "badge": "trn",
      "badgeLabel": "训练现场",
      "bridge": "机器人变大了，提示设计还那么敏感吗？你比较提示长度与初始化，发现更多提示不必然更好，大底座也更宽容。",
      "analogy": {
        "title": "留白也可以是能力",
        "text": "长度消融取1、5、20、100、150；默认长度为100。初始化比较随机、常见词表、类别标签；大模型上的差距趋小。",
        "componentId": "analogy-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "选择初始化",
          "desc": "模型尺度与初始化模式选择更新提示起点和论文定性结论；图为示意。",
          "componentId": "ablation"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "提示长度的留白实验",
          "desc": "选择1、5、20、100、150个token；仅展示Figure3(a)定性趋势，参数数目精确计算。",
          "componentId": "length"
        }
      ],
      "takeaways": [
        {
          "icon": "◌",
          "title": "初始化有条件",
          "desc": "类别标签多token时取嵌入均值，剩余位置由词表初始化。"
        },
        {
          "icon": "⌁",
          "title": "XXL更宽容",
          "desc": "XXL对长度和初始化更不敏感，1token也能表现强。"
        },
        {
          "icon": "✧",
          "title": "不能无限加长",
          "desc": "超过20token收益有限，超过100可能轻微变差。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "聪明之外，还要容易被引导",
      "badge": "trn",
      "badgeLabel": "训练现场",
      "bridge": "同样的软提示，在不同预训练底座上并不一样好用。这里翻阅机器人出厂记录：你选择上游已准备好的底座，不执行改写大脑。",
      "analogy": {
        "title": "读写习惯，也是底座的一部分",
        "text": "T5 span corruption习惯输出哨兵。论文比较原始底座、目标加哨兵、一次性LM适配；LM适配在冻结之前发生，之后共享给所有任务。",
        "componentId": "analogy-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "比较出厂目标",
          "desc": "三种预训练设置按钮驱动机器人输出样式和定性表现。",
          "componentId": "objective"
        }
      ],
      "takeaways": [
        {
          "icon": "◌",
          "title": "上游适配≠任务调优",
          "desc": "原始T5的哨兵读写习惯可能不匹配下游自然文本。"
        },
        {
          "icon": "⌁",
          "title": "100K步也有成本",
          "desc": "LM适配最多100K步，上游只做一次，任务阶段再冻结。"
        },
        {
          "icon": "✧",
          "title": "XXL仍更宽容",
          "desc": "XXL较宽容；适配并非免费，也不是仅训练提示。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "离开熟悉的花园",
      "badge": "both",
      "badgeLabel": "观察与实验",
      "bridge": "提示训练完成，机器人来到陌生领域。冻结核心可能保留通用理解，但是否泛化更好，必须逐个数据集核对。",
      "analogy": {
        "title": "把已学会的任务带到别处",
        "text": "论文在SQuAD训练并按其开发集选择检查点，零样本评估MRQA跨域集。多数改善，但DuoRC与DROP下降；冻结减少过拟合是合理解释，非因果证明。",
        "componentId": "analogy-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "选择迁移目的地",
          "desc": "数据集按钮驱动同一个机器人目标场景和共享零基线F1柱；显示精确均值标准差。",
          "componentId": "domain"
        }
      ],
      "takeaways": [
        {
          "icon": "◌",
          "title": "同一训练协议",
          "desc": "SQuAD内域选择检查点，目标域未再训练。"
        },
        {
          "icon": "⌁",
          "title": "F1越高越好",
          "desc": "TextbookQA获益明显，但DuoRC与DROP给出反例。"
        },
        {
          "icon": "✧",
          "title": "呈现反例",
          "desc": "QQP→MRPC与反方向的收益不对称，不能普遍化。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "一个机器人，多份提示",
      "badge": "both",
      "badgeLabel": "观察与实验",
      "bridge": "不同任务可各存一份提示；同一任务也可训练五份提示，再让它们投票。你仍只有一颗冻结的大脑，代价是每个样本需要多个条件前向。",
      "analogy": {
        "title": "不是五颗大脑，是五种引导",
        "text": "<b>Prompt Ensemble</b> 为同一个任务独立训练五份提示，复制输入形成batch并多数投票。最终问题的答案是有条件的：强底座让适配更可能从重写权重转向学习引导。",
        "componentId": "analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "检验最终结果",
          "desc": "启动真实结果对比并切换SuperGLUE/BoolQ；精确平均/最好/集成数值共享0-100轴。",
          "componentId": "ensemble"
        }
      ],
      "takeaways": [
        {
          "icon": "◌",
          "title": "共享一颗大脑",
          "desc": "不同任务换不同提示；集成却针对同一个任务。"
        },
        {
          "icon": "⌁",
          "title": "集成不是免计算",
          "desc": "5个prompt共享底座，通过多数投票改善开发集结果。"
        },
        {
          "icon": "✧",
          "title": "引导是有条件的选择",
          "desc": "强模型促进轻量适配，但算力、监督数据、可解释性仍有边界。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1eF411n7gC",
      "title": "The Power of Scale for Parameter-Efficient Prompt Tuning",
      "reason": "本论文报告录像；播放量较低但与原论文直接相关。"
    },
    {
      "bvid": "BV19K411s7Gf",
      "title": "参数高效微调系列：Prompt Tuning",
      "reason": "中文方法讲解；用于拓展阅读，不代替原论文证据。"
    }
  ]
};
