import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "The Power of Scale for Parameter-Efficient Prompt Tuning",
    "titleZh": "规模的力量：参数高效的提示调优",
    "venue": "EMNLP 2021",
    "authors": "Brian Lester · Rami Al-Rfou · Noah Constant",
    "affiliation": "Google Research",
    "domain": "自然语言处理 · 参数高效迁移学习",
    "coreProblem": "全量调优为每个任务保存并服务一整套巨大参数，而离散文本提示又受人工设计、上下文长度和表达空间限制。",
    "coreInsight": "冻结语言模型，只学习输入前的一小段连续提示向量；当模型规模增大时，这种受限更新可以接近全量调优，同时显著降低每任务参数成本。",
    "keywords": [
      "软提示",
      "参数高效微调",
      "模型规模"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "每个任务都保存一份完整模型更新：任务越多，存储、加载和分批服务越沉重。",
      "componentId": "studio-scene"
    },
    "newMethod": {
      "desc": "共享一套冻结模型，每个任务只携带小型连续提示，还能把不同任务混在同一批次中服务。",
      "componentId": "studio-scene"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "为什么每个任务都复制整台相机",
      "badge": "inf",
      "badgeLabel": "问题",
      "bridge": "先从多任务部署的成本出发：真正不断累积的，是每个任务单独保存的更新。",
      "analogy": {
        "title": "每个任务都搬一台相机",
        "text": "全量调优会为每个任务保存一套巨大参数；任务越多，存储和服务负担越重。",
        "componentId": "studio-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "任务一多，保存成本怎样变化？",
          "desc": "拖动任务数量，再切换全量调优与提示调优，观察多任务场景中的总存储变化。",
          "componentId": "cost-scaling"
        }
      ],
      "insight": "真正需要压缩的不是共享知识，而是每个任务重复保存的那部分参数。",
      "formula": {
        "lead": "把共享模型与任务增量分开看，存储随任务数 T 的增长方式就很清楚。",
        "unicode": "总存储 ≈ |θ| + T·|θtask|",
        "symbols": [
          {
            "sym": "θ",
            "desc": "所有任务共享的冻结基础模型参数。"
          },
          {
            "sym": "θtask",
            "desc": "每个任务单独保存的完整更新或软提示参数。"
          },
          {
            "sym": "T",
            "desc": "需要部署的下游任务数量。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "瓶颈",
          "desc": "多任务会让完整模型副本迅速累积。"
        },
        {
          "icon": "🔧",
          "title": "分离",
          "desc": "共享基础模型，只缩小每个任务的状态。"
        },
        {
          "icon": "✨",
          "title": "边界",
          "desc": "T5-XXL 在提示长度为 5 时，每个任务新增 20,480 个参数。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "软提示究竟放在哪里",
      "badge": "inf",
      "badgeLabel": "结构",
      "bridge": "知道要缩小任务状态后，下一步要分清软提示的形状、位置，以及它与真实输入的关系。",
      "analogy": {
        "title": "先放设置条，再按快门",
        "text": "软提示不是一段必须属于词表的文字，而是一组直接放在输入嵌入前的可训练向量。",
        "componentId": "studio-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "提示、输入与模型怎样连接？",
          "desc": "依次点击四个位置，观察软提示和输入沿序列维拼接后怎样进入冻结模型。",
          "componentId": "prompt-placement"
        }
      ],
      "formula": {
        "lead": "提示与输入位于同一个嵌入空间，并沿序列维拼接。",
        "unicode": "[Pe; Xe] ∈ R^(p+n)×e",
        "symbols": [
          {
            "sym": "Pe",
            "desc": "形状为 p×e 的可训练软提示嵌入。"
          },
          {
            "sym": "Xe",
            "desc": "形状为 n×e 的真实输入 token 嵌入。"
          },
          {
            "sym": "e",
            "desc": "模型的 token 嵌入维度，拼接前后保持不变。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "位置",
          "desc": "软提示被放在输入嵌入之前。"
        },
        {
          "icon": "🔧",
          "title": "形状",
          "desc": "拼接增加序列长度，不改变嵌入宽度。"
        },
        {
          "icon": "✨",
          "title": "冻结",
          "desc": "编码器和解码器按原方式运行。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "为什么叫软提示",
      "badge": "inf",
      "badgeLabel": "直觉",
      "bridge": "软提示虽然也位于输入前，但它不必从已有词表中挑选；关键差异是连续、独立且可微。",
      "analogy": {
        "title": "预设档位之外还能连续调焦",
        "text": "离散提示只能选已有词向量；软提示拥有独立参数，可以沿连续嵌入空间移动。",
        "componentId": "studio-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "离散词表与连续向量差在哪里？",
          "desc": "切换提示类型并拖动橙色点，观察软提示如何在连续嵌入空间中移动。",
          "componentId": "continuous-space"
        }
      ],
      "formula": {
        "lead": "训练目标仍是提高正确输出的条件概率，只是可更新参数换成了 θP。",
        "unicode": "max θP log Pr(Y | [P; X]; θ, θP)，θ 固定",
        "symbols": [
          {
            "sym": "θP",
            "desc": "通过反向传播更新的提示参数。"
          },
          {
            "sym": "θ",
            "desc": "保持冻结的预训练模型参数。"
          },
          {
            "sym": "X, Y",
            "desc": "文本到文本任务中的输入与目标序列。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "连续",
          "desc": "软提示不受词表离散位置限制。"
        },
        {
          "icon": "🔧",
          "title": "可导",
          "desc": "反向传播只推动提示参数。"
        },
        {
          "icon": "✨",
          "title": "探索",
          "desc": "拖动橙色点可以连续探索任务需要的提示位置。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "规模为何改变方法竞争力",
      "badge": "both",
      "badgeLabel": "规模",
      "bridge": "连续提示的竞争力会随模型规模增强；论文接下来比较从 Small 到 XXL 的方法差距。",
      "analogy": {
        "title": "机身越强，小设置越够用",
        "text": "在同一 T5 系列中，模型越大，软提示与全量调优的效果差距越小。",
        "componentId": "studio-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "模型变大时，质量差距怎样变化？",
          "desc": "启动同步比较，沿 Small 到 XXL 观察提示调优与全量调优的差距如何收窄。",
          "componentId": "scale-gap"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "主结论",
          "desc": "提示调优与全量调优的差距随 T5 规模增大而收窄。"
        },
        {
          "icon": "🔧",
          "title": "条件",
          "desc": "结论来自 T5.1.1 与 SuperGLUE 的特定实验。"
        },
        {
          "icon": "✨",
          "title": "规模前提",
          "desc": "基础模型越大，软提示越能发挥预训练模型已有能力。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "提示长度与初始化怎么选",
      "badge": "both",
      "badgeLabel": "消融",
      "bridge": "规模决定方法上限，也改变超参数敏感度；长度和初始化都不能脱离模型规模单独讨论。",
      "analogy": {
        "title": "设置条不是越长越好",
        "text": "多数规模从 1 增加到 20 token 收益明显，继续加长通常只带来边际收益；XXL 对短提示更宽容。",
        "componentId": "studio-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "长度、初始化与模型规模如何联动？",
          "desc": "选择论文测试过的提示长度、模型规模和初始化方式，观察性能敏感度与参数成本的变化。",
          "componentId": "length-init"
        }
      ],
      "formula": {
        "lead": "提示参数量由提示长度与嵌入维度直接决定。",
        "unicode": "|θP| = p·e",
        "symbols": [
          {
            "sym": "p",
            "desc": "提示 token 数；论文测试 1、5、20、100、150。"
          },
          {
            "sym": "e",
            "desc": "对应 T5 规模的嵌入维度。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "长度",
          "desc": "20 token 左右已获得主要长度收益。"
        },
        {
          "icon": "🔧",
          "title": "初始化",
          "desc": "类别标签初始化对较小模型帮助更明显。"
        },
        {
          "icon": "✨",
          "title": "规模",
          "desc": "XXL 对长度与初始化选择更宽容。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "冻结模型也要先学会响应提示",
      "badge": "both",
      "badgeLabel": "预训练",
      "bridge": "即使提示本身可训练，它仍要借助冻结模型已有能力；预训练目标是否匹配自然文本生成非常关键。",
      "analogy": {
        "title": "先校准，再用小设置控制",
        "text": "模型是否熟悉自然输入到自然输出的任务形式，会直接影响软提示能否有效控制它。",
        "componentId": "studio-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "Span Corruption、Sentinel 与 LM 适配有何差别？",
          "desc": "切换预训练设置与模型规模，观察冻结模型对下游自然文本任务的匹配程度。",
          "componentId": "pretrain-fit"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "先验",
          "desc": "冻结模型会保留预训练形成的输出习惯。"
        },
        {
          "icon": "🔧",
          "title": "适配",
          "desc": "LM 目标让模型更习惯自然文本续写。"
        },
        {
          "icon": "✨",
          "title": "边界",
          "desc": "规模提高宽容度，但不会让预训练目标失去作用。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "训练时到底更新了什么",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "预训练决定起点，提示训练决定任务方向；冻结模型仍参与完整的前向与反向计算。",
      "analogy": {
        "title": "误差能穿过机身，改动只落在设置条",
        "text": "模型参与前向与反向计算，但主参数 θ 被锁住；优化器只更新 θP。",
        "componentId": "studio-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "前向、损失、反向与更新分别发生什么？",
          "desc": "逐步走过训练循环，区分梯度经过模型与参数被优化器更新这两件事。",
          "componentId": "training-loop"
        }
      ],
      "formula": {
        "lead": "论文使用标准交叉熵训练提示参数。",
        "unicode": "L = −log Prθ;θP(Y | [P; X])",
        "symbols": [
          {
            "sym": "L",
            "desc": "目标序列的负对数似然损失。"
          },
          {
            "sym": "θP",
            "desc": "优化器实际更新的提示参数。"
          },
          {
            "sym": "θ",
            "desc": "参与计算但保持冻结的模型参数。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "前向",
          "desc": "冻结模型仍完成完整概率计算。"
        },
        {
          "icon": "🔧",
          "title": "反向",
          "desc": "误差穿过模型以得到提示梯度。"
        },
        {
          "icon": "✨",
          "title": "更新",
          "desc": "参数锁只允许 θP 改变。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "一条提示如何穿过完整 T5",
      "badge": "trn",
      "badgeLabel": "架构",
      "bridge": "训练循环说明了哪些参数会变；现在把软提示放回完整模型，观察它与相近参数高效方法的结构差异。",
      "analogy": {
        "title": "设置条只在入口，机身内部照常工作",
        "text": "提示调优不在每层插入新模块，也不增加任务专用输出头；连续提示从输入端影响后续表示。",
        "componentId": "studio-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "Prompt Tuning 改了哪一处？",
          "desc": "切换 Prompt、Prefix、WARP 与全量调优，再点击结构节点，比较任务参数进入模型的位置。",
          "componentId": "architecture-map"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "入口",
          "desc": "Prompt Tuning 只训练输入端的连续提示。"
        },
        {
          "icon": "🔧",
          "title": "共享",
          "desc": "编码器、解码器与输出过程保持通用。"
        },
        {
          "icon": "✨",
          "title": "比较",
          "desc": "参数效率与任务效果需要结合具体任务一起比较。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "冻结是否带来更稳健的迁移",
      "badge": "both",
      "badgeLabel": "泛化",
      "bridge": "参数位置解释了模型为何更受约束；接下来用域外数据与提示集成观察这种约束带来的效果。",
      "analogy": {
        "title": "换了灯光，设置还能不能稳住",
        "text": "冻结通用参数限制了任务内过拟合的自由度；论文在多数域外数据上观察到收益，但也报告了反例。",
        "componentId": "studio-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "迁移优势是否对每个数据集都成立？",
          "desc": "逐个选择从 SQuAD 迁移到 MRQA 域外数据集的 F1 结果，比较全量调优与提示调优。",
          "componentId": "domain-transfer"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "共享一个大模型，为什么还能做集成？",
          "desc": "选择提示数量和比较方式，观察多个提示如何共享同一冻结模型并形成集成。",
          "componentId": "prompt-ensemble"
        }
      ],
      "insight": "参数限制可能减少任务内过拟合，域外表现会随评测协议和数据集发生变化。",
      "formula": {
        "lead": "提示集成仍共享同一个 θ，只为同一任务保存 N 组提示参数。",
        "unicode": "任务状态 = {θP¹, …, θPᴺ}，共享 θ",
        "symbols": [
          {
            "sym": "N",
            "desc": "集成中的提示数量；N=5 对应五提示集成。"
          },
          {
            "sym": "θPⁱ",
            "desc": "第 i 个独立训练的软提示。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "迁移",
          "desc": "多数域外数据更好，但并非全部。"
        },
        {
          "icon": "🔧",
          "title": "集成",
          "desc": "多个提示可以共享同一冻结模型。"
        },
        {
          "icon": "✨",
          "title": "证据",
          "desc": "五提示多数投票在 SuperGLUE 开发集上达到 91.3。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "把效果、效率与限制放在一起",
      "badge": "both",
      "badgeLabel": "结论",
      "bridge": "最后把规模、参数、迁移与集成四类证据放在一起，形成完整的使用判断。",
      "analogy": {
        "title": "小设置卡赢在可复用",
        "text": "基础模型规模增大且预训练形式匹配时，软提示能以极少任务参数逼近全量调优。",
        "componentId": "studio-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "四类证据如何共同支持结论？",
          "desc": "选择一种证据并启动比较，分别查看规模趋势、参数比例、域迁移与提示集成。",
          "componentId": "result-race"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "适用",
          "desc": "大模型、多任务和共享服务场景最契合。"
        },
        {
          "icon": "🔧",
          "title": "验证",
          "desc": "长度、初始化与预训练目标随规模改变。"
        },
        {
          "icon": "✨",
          "title": "限制",
          "desc": "域迁移并非全胜，软提示也难直接解释。"
        }
      ]
    }
  ]
};
