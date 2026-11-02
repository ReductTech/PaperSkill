import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Online Continual Learning with Maximally Interfered Retrieval",
    "titleZh": "MIR：最大干扰检索的在线持续学习",
    "venue": "NeurIPS 2019",
    "authors": "Rahaf Aljundi · Lucas Caccia · Eugene Belilovsky · Massimo Caccia · Min Lin · Laurent Charlin · Tinne Tuytelaars",
    "affiliation": "KU Leuven · Mila",
    "domain": "在线持续学习 · 回放检索",
    "coreProblem": "回放预算有限：下一步新数据更新最可能伤害哪些旧知识？",
    "coreInsight": "先在副本上模拟新数据更新，再按旧样本的预测损失增量排序；从原参数出发，用新数据和检索到的旧样本正式更新。",
    "keywords": [
      "最大干扰检索",
      "虚拟更新",
      "经验回放",
      "生成式回放",
      "在线持续学习"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "普通经验回放随机取旧样本。在这个调音类比中，检查的弦可能没有受到新调整的影响；真实随机回放也可能恰好选中重要样本。",
      "componentId": "mir-hero-old"
    },
    "newMethod": {
      "desc": "MIR 先预测哪些旧样本的损失会增加，再优先检索它们。琴弦只是风险诊断的教学映射，不代表真实训练结果或无遗忘保证。",
      "componentId": "mir-hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "为什么回放还需要选择",
      "badge": "both",
      "badgeLabel": "问题与路线",
      "bridge": "先尝试调好一个新目标，观察旧目标是否一起改善。理解预算为什么迫使我们选择回放对象，再进入 MIR 的定义。",
      "analogy": {
        "title": "调一根弦，会牵动哪些旧参照？",
        "text": "拨动一根弦之后，乐器上的其他参照未必都受损。MIR 像一次有针对性的预检：先判断哪处最可能被下一步调整牵连。",
        "componentId": "mir-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "拖动调音旋钮，观察共享参数的代价",
          "desc": "左右拖动橙色旋钮，或用方向键与按钮改变 θ。蓝条和旧损失增量由同一教学二次目标计算。",
          "componentId": "mir-c1"
        }
      ],
      "insight": "回放预算有限时，应该区分“这一步会受损的旧经验”与“现在本来就很难的旧经验”。",
      "formula": {
        "lead": "多个目标共享一个参数，新目标的改善可能伴随旧目标的损失上升。",
        "unicode": "L新(θ)=½(θ−1)²；ℓᵢ(θ)=½(θ−aᵢ)²",
        "symbols": [
          {
            "sym": "θ",
            "desc": "教学标量参数，交互中限制在 0 到 1；并非真实网络参数维数。"
          },
          {
            "sym": "aᵢ",
            "desc": "第 i 个旧目标的最优位置，例中分别为 −1、0、0.5。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "↻",
          "title": "存储之后仍要选择",
          "desc": "有限缓存并不解决每一步应该回放谁的问题。"
        },
        {
          "icon": "↗",
          "title": "看新更新造成什么",
          "desc": "MIR 先预测新数据单独更新对旧损失的影响。"
        },
        {
          "icon": "◎",
          "title": "先区分教学与实测",
          "desc": "上方二次函数解释竞争，不是论文的训练曲线。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "问题定义与相关工作",
      "badge": "both",
      "badgeLabel": "设定与位置",
      "bridge": "上一章说明了选择的重要性。本章明确数据流、预算和任务信息，并把 MIR 放回 GEM、ER 与后续 DER 的知识位置。",
      "analogy": {
        "title": "旋钮能调音，参考谱决定检查什么",
        "text": "转动一个调音旋钮只改变操作方式的一部分。保存参照、选择参照和限制调整方向，是三个可以分别设计的环节。",
        "componentId": "mir-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "切换方法，辨认它改变了哪一个环节",
          "desc": "选择 ER、GEM、DER 或 MIR，观察保留状态、约束路径与解释同步变化；这是机制对照，不是数值性能排名。",
          "componentId": "mir-c2"
        }
      ],
      "insight": "MIR 首先改变检索规则；它不等于新的缓存存储策略，也不等于 GEM 的梯度投影。",
      "takeaways": [
        {
          "icon": "⏱",
          "title": "单遍不等于一步",
          "desc": "数据只到达一次，仍可对当前批次执行多次优化。"
        },
        {
          "icon": "▦",
          "title": "预算符号要分清",
          "desc": "全局容量 K、每类记忆数 M、候选 C 与回放 B 含义不同。"
        },
        {
          "icon": "⌁",
          "title": "变体边界要逐个看",
          "desc": "共享分类头不意味着所有生成式或混合变体都无需任务信息。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "干扰分数：看增量，不看难度",
      "badge": "trn",
      "badgeLabel": "检索核心",
      "bridge": "已知 MIR 在取回样本这一环节做选择。现在用同一组旧样本，亲自比较当前难度、本次损害与历史退化。",
      "analogy": {
        "title": "拉弓前后，哪根参照弦变化最多？",
        "text": "拉弓前已有的失准，与这一次动作新造成的偏移，并不是同一个量。先保留参照，再比较变化，才能找到最受牵连的部分。",
        "componentId": "mir-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "试算一次更新：MI-1 与 MI-2 选谁",
          "desc": "先查看更新前的损失，再显示虚拟更新后结果；切换当前参照和历史最好参照，比较分数与被选择样本。",
          "componentId": "mir-c3"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "与难例挖掘正面对照",
          "desc": "固定同一组损失，切换当前最难、虚拟后最难、MI-1、MI-2，观察排序如何改变。",
          "componentId": "mir-c3-extra"
        }
      ],
      "insight": "减去参照损失，才能把原有难度与候选更新造成的风险区分开。",
      "formula": {
        "lead": "两个分数分别以当前表现、当前与历史最好中的较佳表现作为参照。",
        "unicode": "sMI-1(i)=ℓᵢ(θᵥ)−ℓᵢ(θ)；sMI-2(i)=ℓᵢ(θᵥ)−min(ℓᵢ(θ),rᵢ)",
        "symbols": [
          {
            "sym": "θᵥ",
            "desc": "只在新批次上试算一步得到的虚拟参数副本，不是正式更新后的参数。"
          },
          {
            "sym": "ℓᵢ",
            "desc": "固定旧输入和真实标签下的单样本损失；前后比较使用同一个样本。"
          },
          {
            "sym": "rᵢ",
            "desc": "该样本被评估时记录到的历史最低损失，不是无法知道的全局最小值。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "Δ",
          "title": "MI-1 关心本次受损",
          "desc": "分数是虚拟更新后损失减去当前损失，负值表示该步可能帮助旧样本。"
        },
        {
          "icon": "◷",
          "title": "MI-2 加入观察历史",
          "desc": "历史最低参照可强调已经退化的样本，但受记录时刻限制。"
        },
        {
          "icon": "↔",
          "title": "预测不会原样发生",
          "desc": "正式更新加入回放后已改变目标，不能把虚拟风险当作实际遗忘保证。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "数学精读：虚拟更新与梯度冲突",
      "badge": "trn",
      "badgeLabel": "数学精读",
      "bridge": "从上一章的损失差分出发，本章解释分数为什么与梯度冲突有关，并检验这种解释在有限步长时何时失效。",
      "analogy": {
        "title": "音叉靠近参照弦",
        "text": "调一根弦时，其他弦受牵连的幅度取决于耦合程度。先预测扰动，再决定哪条旧参照最需保护。",
        "componentId": "mir-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "改变学习率：一阶排序何时反转",
          "desc": "移动虚拟学习率，比较同一对旧损失的梯度近似与精确有限差分；本例是可计算的教学构造。",
          "componentId": "mir-c4"
        }
      ],
      "insight": "一阶梯度冲突解释了风险，但原始有限差分还会反映曲率。",
      "formula": {
        "lead": "将本章核心关系写成一个可核对的式子；条件、推导与反例见交互后的正文。",
        "unicode": "sᵢ = ℓᵢ(θ − ηg新) − ℓᵢ(θ) ≈ −ηgᵢᵀg新",
        "symbols": [
          {
            "sym": "sᵢ",
            "desc": "旧样本 i 在虚拟更新后的损失增量；正值表示预计受损。"
          },
          {
            "sym": "η",
            "desc": "虚拟学习率，非负；有限步长越大，曲率贡献可能越显著。"
          },
          {
            "sym": "g新",
            "desc": "当前批次平均损失的 p 维梯度。"
          },
          {
            "sym": "gᵢ",
            "desc": "旧样本当前损失的 p 维梯度。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "↘",
          "title": "负内积产生一阶风险",
          "desc": "沿新损失负梯度移动，会在一阶上抬高反向旧梯度对应的损失。"
        },
        {
          "icon": "⌁",
          "title": "有限步长保留曲率",
          "desc": "二阶项可使精确 MIR 排名与梯度内积近似不同。"
        },
        {
          "icon": "△",
          "title": "局部解释有条件",
          "desc": "教学误差界依赖平滑性，不是一般无遗忘定理。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "水库与候选池：存什么、取什么",
      "badge": "trn",
      "badgeLabel": "训练机制",
      "bridge": "知道分数后，还需要控制计算与记忆预算。本章把水库存储、随机候选和 Top-B 检索拆开，避免把三种数量混为一谈。",
      "analogy": {
        "title": "从乐谱册取出一张参照卡",
        "text": "参考册决定哪些旧音留下，本次检修决定先听哪些参照。固定容量和优先检查解决的是两个问题。",
        "componentId": "mir-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "逐项入库，再从候选中挑选",
          "desc": "推进样本到达，改变候选 C 与回放 B，观察水库成员、实际候选和 Top-B 的区别；随机路径固定以便核对。",
          "componentId": "mir-c5"
        }
      ],
      "insight": "MIR 改进的是如何取用记忆，水库存储仍可保持历史随机采样。",
      "formula": {
        "lead": "将本章核心关系写成一个可核对的式子；条件、推导与反例见交互后的正文。",
        "unicode": "P(第 n 步保留历史项 i) = min(1, K/n)",
        "symbols": [
          {
            "sym": "K",
            "desc": "全局水库容量；区别于实验表中每类记忆数 M。"
          },
          {
            "sym": "n",
            "desc": "包含本次到达项的已见样本总数。"
          },
          {
            "sym": "i",
            "desc": "任意一个截至第 n 步已经到达的历史项。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "▣",
          "title": "存储与检索分离",
          "desc": "水库决定留下谁，MIR 决定本轮回放谁。"
        },
        {
          "icon": "⌕",
          "title": "候选限制覆盖",
          "desc": "随机 C 再取 B 降低搜索成本，但不保证全库最优或类别均衡。"
        },
        {
          "icon": "≠",
          "title": "预算需要分项",
          "desc": "K、每类 M、候选 C 与回放 B 对存储和计算产生不同影响。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "算法实现：试走一步，再从原点更新",
      "badge": "trn",
      "badgeLabel": "训练机制",
      "bridge": "上一章确定了候选和检索规则，本章把它们放回完整训练循环，重点检查虚拟副本、真实起点、梯度与入库时序。",
      "analogy": {
        "title": "松开一次试拉，回到原参照",
        "text": "试拉弦只是检查哪些旧参照会偏离；真正调音仍从原位置开始。把试验结果当作正式起点，会多调一次。",
        "componentId": "mir-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "推进训练流程，点击模型与缓存",
          "desc": "逐步推进六个阶段，点选方框或同名按钮查看张量形状；切换空缓存可检查第一次更新。",
          "componentId": "mir-c6"
        }
      ],
      "insight": "虚拟更新只服务于检索；正式更新从原始参数计算新旧混合目标。",
      "formula": {
        "lead": "将本章核心关系写成一个可核对的式子；条件、推导与反例见交互后的正文。",
        "unicode": "θ正式 = θ − η∇θ L(新批次 ∪ 旧检索批次；θ)",
        "symbols": [
          {
            "sym": "θ",
            "desc": "本轮原始真实参数，评分过程中保持不变。"
          },
          {
            "sym": "η",
            "desc": "正式 SGD 学习率，必须与目标归一化相匹配。"
          },
          {
            "sym": "L",
            "desc": "在声明的合并批次上计算的训练损失；不能默认等同于两个批次均值相加。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "↶",
          "title": "真实起点不变",
          "desc": "评分完成后丢弃虚拟参数，再从原 θ 计算混合梯度。"
        },
        {
          "icon": "⊡",
          "title": "状态隔离要完整",
          "desc": "BN、随机数和优化器状态也可能污染试走，不能只恢复权重。"
        },
        {
          "icon": "Σ",
          "title": "复现记录归一化",
          "desc": "源码均值相加与算法合并平均可能相差比例或样本权重。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "生成式 MIR：潜空间中的风险搜索",
      "badge": "both",
      "badgeLabel": "方法与证据",
      "bridge": "前面从有限缓存挑选真实旧样本。若没有原始旧数据，怎样在生成器潜空间里寻找即将受害的经验，并保护生成器自己？",
      "analogy": {
        "title": "寻找相近但不同的音色",
        "text": "琴弓探索新的发声位置，仍要以旧参考音为依据。潜空间检索也必须同时考虑变化、可信度与重复。",
        "componentId": "mir-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "生成检索的三项取舍",
          "desc": "切换 KL、熵与多样性，观察潜空间候选集合、分数和点的大小如何改变。二维候选是教学构造。",
          "componentId": "mir-c7"
        }
      ],
      "takeaways": [
        {
          "icon": "🧭",
          "title": "检索需要代理",
          "desc": "生成样本没有现成真实标签，旧预测、熵与多样性共同约束搜索。"
        },
        {
          "icon": "∇",
          "title": "生成器也会遗忘",
          "desc": "对生成器负 ELBO 的干扰检索保护回放来源。"
        },
        {
          "icon": "⚖",
          "title": "梯度路径要明确",
          "desc": "冻结网络参数不等于切断搜索变量经过该网络的导数。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "AE-MIR：压缩与重建捷径",
      "badge": "both",
      "badgeLabel": "方法与证据",
      "bridge": "生成回放同时受生成质量和存储限制。接下来用压缩记忆理解混合方法的好处，以及处理痕迹为何会成为分类捷径。",
      "analogy": {
        "title": "压弦条件要一致",
        "text": "同一压弦条件让新旧参考更可比。重建处理若只作用于旧样本，分类器可能记住的是处理痕迹。",
        "componentId": "mir-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点击结构：谁带来了重建痕迹",
          "desc": "点选结构节点，切换混用或统一重建，并核算不同精度下的缓存字节。图示不伪造重建准确率。",
          "componentId": "mir-c8"
        }
      ],
      "takeaways": [
        {
          "icon": "♫",
          "title": "统一处理条件",
          "desc": "当前、旧回放与测试都重建，有助于削弱输入处理捷径。"
        },
        {
          "icon": "▣",
          "title": "字节不能偷换",
          "desc": "9.6 是相同标量精度下的比例，还要计入模型和计算开销。"
        },
        {
          "icon": "◷",
          "title": "协议并非全在线",
          "desc": "混合版本每任务离线训练 AE 五轮，依赖任务组织。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "实验精读：协议、结果与反例",
      "badge": "both",
      "badgeLabel": "实验与研究",
      "bridge": "有了三种方法，还需要确定比较是否公平。本章逐项固定数据、每类记忆和更新次数，再用真实结果检验主张。",
      "analogy": {
        "title": "逐个核对调音结果",
        "text": "完成调节后，再按同一条件核对参考音。实验也要固定预算与指标，才能解释收益从哪里来。",
        "componentId": "mir-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "按协议揭示论文结果",
          "desc": "选择数据、每类预算与指标，点击显示。准确率越高越好，遗忘越低越好；精确值保留在表格中。",
          "componentId": "mir-c9"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "消融、追加更新与关键图的证据",
          "desc": "切换三组原文对照，区分机制消融、额外计算和生成器本身的遗忘。每组都保留单位与协议。",
          "componentId": "mir-c9-extra"
        }
      ],
      "takeaways": [
        {
          "icon": "📊",
          "title": "两个指标一起看",
          "desc": "准确率提高不保证遗忘在所有条件都降低。"
        },
        {
          "icon": "⚖",
          "title": "固定比较条件",
          "desc": "每类预算、数据量、更新次数与教师信息必须分别记录。"
        },
        {
          "icon": "🔎",
          "title": "证据需要边界",
          "desc": "消融、定性图与主表不混作同一个实验或因果保证。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "局限、复现与研究延伸",
      "badge": "both",
      "badgeLabel": "实验与研究",
      "bridge": "结果显示检索有价值，也留下反例与资源代价。最后把机制、数学与协议串起来，形成能复现、能批评、可证伪的研究问题。",
      "analogy": {
        "title": "把琴弓稳稳放下",
        "text": "结束前保留可复查的参考位置。精读也要留下设定、推导、反例与下一步实验，而不止一个结论。",
        "componentId": "mir-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "把改进设想放到不同漂移场景",
          "desc": "切换场景，观察假设风险优先级与研究判据。示意数值仅用于设计实验，不是实测表现。",
          "componentId": "mir-c10"
        }
      ],
      "takeaways": [
        {
          "icon": "🔗",
          "title": "连接三类方法",
          "desc": "GEM 约束更新、DER 约束目标、MIR 选择回放对象。"
        },
        {
          "icon": "⏳",
          "title": "未来信息不可提前",
          "desc": "时间序列检索要等待真实标签，并计算等待队列成本。"
        },
        {
          "icon": "🧪",
          "title": "研究必须能被推翻",
          "desc": "固定资源、消融机制并明确反证条件后，再评估新颖性。"
        }
      ]
    }
  ]
};
