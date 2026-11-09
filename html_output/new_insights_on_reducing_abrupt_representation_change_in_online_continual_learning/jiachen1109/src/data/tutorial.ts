import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "New Insights on Reducing Abrupt Representation Change in Online Continual Learning",
    "titleZh": "减少在线持续学习中表示突变的新认识",
    "venue": "ICLR 2022 · ER-ACE / ER-AML",
    "authors": "Lucas Caccia · Rahaf Aljundi · Nader Asadi · Tinne Tuytelaars · Joelle Pineau · Eugene Belilovsky",
    "affiliation": "McGill / Mila / FAIR · Toyota Motor Europe · Concordia · KU Leuven",
    "domain": "在线持续学习 · 表示漂移 · 非对称损失",
    "coreProblem": "为什么已经使用经验回放，旧类别的表示仍会在新类别出现时突然改变？",
    "coreInsight": "新数据先在本批类别中学习，回放数据再承担所有已见类别之间的辨别。",
    "keywords": [
      "在线持续学习",
      "表示漂移",
      "非对称交叉熵",
      "监督对比学习",
      "随时评价"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "普通经验回放：新旧数据使用相同损失，新样本也会对旧类别产生竞争压力。",
      "componentId": "ace-hero-old"
    },
    "newMethod": {
      "desc": "ER-ACE / ER-AML：缩小新数据的竞争范围，保留回放的全局辨别作用；共享参数仍会更新。",
      "componentId": "ace-kit"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "问题：回放为何仍会突然遗忘",
      "badge": "inf",
      "badgeLabel": "问题与整体理解",
      "bridge": "普通回放已经保存了旧样本，为什么新类别到来时旧知识仍会突然下降？先从标题、摘要和引言定位本文真正干预的通路。",
      "analogy": {
        "title": "先护住旧轮廓",
        "text": "画笔新增花纹时可能擦过已经成形的轮廓。限定本次笔触范围，可以减少这种直接扰动；整幅画的协调还要靠后续检查。",
        "componentId": "ace-analogy-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "回放还在，干扰从哪里来？",
          "desc": "比较同一教学样本下，新数据损失对旧类别分类器行的直接作用，再对照原文 Figure 1 的证据。",
          "componentId": "ace-a1"
        }
      ],
      "insight": "旧数据存在，不代表新数据损失不会推动旧类别改变。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "问题不止在记忆容量",
          "desc": "新类别的错误竞争关系可能在少数更新内扰动旧表示。"
        },
        {
          "icon": "🔧",
          "title": "贡献是非对称目标",
          "desc": "新数据先在受限集合内学习，回放仍处理整体辨别。"
        },
        {
          "icon": "🔎",
          "title": "观察与定理分开",
          "desc": "原文用实验支持表示漂移机制，没有给出普遍的不遗忘保证。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "设定与相关工作：什么信息可以用",
      "badge": "inf",
      "badgeLabel": "设定与知识联系",
      "bridge": "要评价一种持续学习方法，必须先明确可用信息。这里从带标签的数据流、共享分类头与有限缓冲出发，再比较 GEM、MIR、DER 和本文的干预位置。",
      "analogy": {
        "title": "画框不能替你认物",
        "text": "只看一个小画框，辨认其中两种花纹会更容易。真实的单头分类却必须面对整幅画，不能事先知道答案所在的任务。",
        "componentId": "ace-analogy-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "候选集合藏着哪些额外信息？",
          "desc": "切换任务提示与模糊边界，观察候选类别数量及其信息条件如何变化。",
          "componentId": "ace-a2"
        }
      ],
      "insight": "当前批次的真实标签足以构造掩码，不需要借助任务编号。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "任务编号与类别标签不同",
          "desc": "本文使用样本类别标签，训练和测试均不需要任务提示器。"
        },
        {
          "icon": "🔧",
          "title": "方法可以处于不同层面",
          "desc": "GEM 改更新、MIR 改检索、DER 改回放目标，本文改损失的竞争集合。"
        },
        {
          "icon": "🔎",
          "title": "缓冲预算要统一",
          "desc": "区分每类名义预算 M 与总容量 K，避免跨协议直接比数值。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "ER-AML：先学批内距离，再做全局辨别",
      "badge": "both",
      "badgeLabel": "方法与数学精读",
      "bridge": "先按原文 §4.1–4.2 学习度量版本：为什么把旧类别当作新样本的负例会造成冲击，又为什么限制负例之后仍需要全局回放？",
      "analogy": {
        "title": "调色先局部，成画看整体",
        "text": "新花纹先在局部空间里形成清晰差异，再回看完整画作的关系。局部约束减少直接挤压，却不能替代全局辨别。",
        "componentId": "ace-analogy-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "负例选谁，会改变谁的梯度",
          "desc": "拖动橙色锚点或用方向键改变角度，比较两种负例集合下的概率、损失与旧负例切向梯度。",
          "componentId": "ace-a3"
        }
      ],
      "insight": "限制的是负例的类别来源，候选样本本身仍可来自缓冲。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "负例不只是背景",
          "desc": "负例特征也会接收反向梯度，旧类不应被无条件用于排斥新锚点。"
        },
        {
          "icon": "🔧",
          "title": "两项损失职责不同",
          "desc": "新数据用受限 SupCon 整理局部结构，回放用全局余弦交叉熵整合新旧类。"
        },
        {
          "icon": "🔎",
          "title": "实现要处理候选不足",
          "desc": "空正例、无有效负例和首批数据都需要明确策略，不能直接计算空平均。"
        }
      ],
      "formula": {
        "lead": "局部度量与全局回放相加，形成非对称学习目标。",
        "unicode": "L = γL₁(Xᵢₙ) + L₂(Xᵦf)",
        "symbols": [
          {
            "sym": "γ",
            "desc": "当前流度量目标的非负权重，需与损失求和或平均的尺度配合。"
          },
          {
            "sym": "L₁",
            "desc": "只用当前类别作为负例的监督式对比损失，详见上方逐步推导。"
          },
          {
            "sym": "L₂",
            "desc": "对回放样本使用所有已见类别的余弦分类交叉熵。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "ER-ACE：只让当前类别参与新数据竞争",
      "badge": "both",
      "badgeLabel": "方法与分析",
      "bridge": "ER-AML 通过选择负例限制干扰。现在回到更常用的交叉熵：能否只改变类别分母，得到同样的非对称结构？",
      "analogy": {
        "title": "遮住旧轮廓，画好新花纹",
        "text": "模板限定新笔触接触的范围；回看整幅画时，仍要检查新旧图案是否协调。训练损失的局部比较与推理的全局辨别承担不同职责。",
        "componentId": "ace-analogy-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "同一新样本，三种损失结构",
          "desc": "四条概率柱对应类别0到3，短箭头编码各输出的直接梯度。所有数值由固定分数与选定分母实际计算。",
          "componentId": "ace-b4"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "边界检查：本批只有一类会怎样？",
          "desc": "同一公式在单类与全类别批次上有明确退化情形；这是理解适用条件的直接入口。",
          "componentId": "ace-b4edge"
        }
      ],
      "insight": "保护来自新分支的选择性竞争，学习跨类别辨别依靠全类别回放；两个分支不能同时隔离。",
      "formula": {
        "lead": "将本章机制写成可逐项检查的公式；详细推导见上方正文。",
        "unicode": "LACE = LCE(X回放, C旧 ∪ C当前) + LCE(X新, C当前)",
        "symbols": [
          {
            "sym": "LCE",
            "desc": "给定候选类别集合的交叉熵聚合；新旧批次分别计算。"
          },
          {
            "sym": "C当前",
            "desc": "当前输入小批次实际出现的标签集合，不是整个任务标签集合。"
          },
          {
            "sym": "C旧",
            "desc": "已见类别中不在当前小批次内的类别；与当前集合之并为全部已见类别。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "改的是分母",
          "desc": "旧类从新样本的竞争集合排除，其直接输出梯度变为0。"
        },
        {
          "icon": "🔧",
          "title": "回放保持全局",
          "desc": "回放必须提供新旧类别之间的统一辨别信号。"
        },
        {
          "icon": "🔎",
          "title": "批次结构很关键",
          "desc": "纯论文掩码在单类批次上损失为0，在全类别批次上退化为普通 ER。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "数学精读：从交叉熵到表示漂移",
      "badge": "both",
      "badgeLabel": "方法与分析",
      "bridge": "类别分母为何能影响旧知识？接下来从负对数概率出发，逐层追踪输出、原型、特征和共享参数的梯度。",
      "analogy": {
        "title": "压力改变笔触，不只改变笔尖",
        "text": "笔尖的受力位置改变了，但纸面与整只画笔仍然相连。排除某个直接接触点，不等于其他部位完全静止。",
        "componentId": "ace-analogy-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "让竞争强度显形，再推导梯度",
          "desc": "调节旧类分数会同步改变概率、画笔受力和旧原型梯度；后面的推导逐项说明这条联系。",
          "componentId": "ace-b5"
        }
      ],
      "insight": "掩码准确切断一条直接输出梯度通路，但共享参数的雅可比仍决定旧特征怎样变化。",
      "formula": {
        "lead": "将本章机制写成可逐项检查的公式；详细推导见上方正文。",
        "unicode": "δⱼ = 1[j∈C](pⱼ − 1[j=y])； ∇ₕℓ = Wᵀδ； Δh旧 ≈ −ηJ旧∇θL总",
        "symbols": [
          {
            "sym": "δⱼ",
            "desc": "第j个输出的损失偏导；候选内是概率减目标，候选外为0。"
          },
          {
            "sym": "W",
            "desc": "C×d分类权重矩阵，行向量对应类别原型。"
          },
          {
            "sym": "J旧",
            "desc": "旧样本d维表示对p维参数的d×p雅可比矩阵；乘参数更新产生一阶特征变化。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧮",
          "title": "每一步可检查",
          "desc": "从−log softmax 展开，经逐项求导得到概率减目标。"
        },
        {
          "icon": "📐",
          "title": "余弦还需投影",
          "desc": "原始向量归一化的导数包含切空间投影与范数尺度。"
        },
        {
          "icon": "🔎",
          "title": "区分直接和间接",
          "desc": "旧原型直接梯度为0，仍不保证共享骨干不改变旧样本表示。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "算法与实现：一次在线更新究竟做什么",
      "badge": "trn",
      "badgeLabel": "算法复现",
      "bridge": "公式已经明确了两个分支。现在把它放进一次在线更新，并逐项检查论文定义与官方代码快照的差异。",
      "analogy": {
        "title": "沿模板描一笔",
        "text": "描绘新花纹时只用一支画笔，局部限制来自模板。同一个模型服务新旧数据，变化的是损失的比较集合。",
        "componentId": "ace-analogy-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "六步在线更新与共享网络",
          "desc": "选择步骤会改变高亮节点、损失分支与数值解释；固定模型图的两条支路代表共享参数，而非两个分类器。",
          "componentId": "ace-b6"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "代码审计：当前集合为何不等于索引后缀",
          "desc": "同一组已见标签下，分别计算论文当前类别掩码与官方代码 present 加 max-seen 后缀的实际集合。",
          "componentId": "ace-b6code"
        }
      ],
      "insight": "重现既要报告目标函数，也要报告实际掩码；首批策略、输出维度与损失尺度都会改变结果。",
      "formula": {
        "lead": "将本章机制写成可逐项检查的公式；详细推导见上方正文。",
        "unicode": "L总 = mean(ℓ新) + mean(ℓ回放)； θ′ = θ − η∇θL总",
        "symbols": [
          {
            "sym": "mean",
            "desc": "分别在新批次与回放批次内取均值；不是把两批直接合并后的单个均值。"
          },
          {
            "sym": "θ′",
            "desc": "完成本次梯度更新后的共享模型参数。"
          },
          {
            "sym": "η",
            "desc": "学习率；相同梯度方向但不同损失尺度会产生不同更新幅度。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🔁",
          "title": "先学再存",
          "desc": "采样来自已有缓冲，本批在优化完成后写入储水池。"
        },
        {
          "icon": "💻",
          "title": "复现集合要精确",
          "desc": "论文当前类集合与公开代码的索引后缀策略并非逐项相同。"
        },
        {
          "icon": "📌",
          "title": "保持实现口径",
          "desc": "固定代码提交、类序、增强、批量与聚合尺度后再比较实验。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "理论边界与诊断：零梯度不等于冻结知识",
      "badge": "both",
      "badgeLabel": "方法与分析",
      "bridge": "实现中确实可以把旧输出的直接梯度设为0。这个事实能推出什么稳定性结论，又有哪些推断超出了它的范围？",
      "analogy": {
        "title": "扶住轮廓，纸面仍会受力",
        "text": "支撑可以减少局部扰动，却不会让整张画纸与后续动作脱离。稳定旧轮廓与画出新内容需要一起衡量。",
        "componentId": "ace-analogy-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "一个共享参数就足以产生间接漂移",
          "desc": "解析的一维教学网络保持旧输出直接梯度为0，但共享参数更新仍使旧样本特征移动；数值由选定损失实际计算。",
          "componentId": "ace-b7"
        }
      ],
      "insight": "低表示漂移是机制证据，不是持续学习的完整成功标准；还要检查新类学习与全局分类能力。",
      "formula": {
        "lead": "将本章机制写成可逐项检查的公式；详细推导见上方正文。",
        "unicode": "dₜ(x) = ‖uₜ₊₁(x) − uₜ(x)‖₂， uₜ(x)=hₜ(x)/‖hₜ(x)‖₂",
        "symbols": [
          {
            "sym": "uₜ",
            "desc": "同一样本在时刻t的单位化表示；假设原始表示非零。"
          },
          {
            "sym": "dₜ(x)",
            "desc": "单次更新的归一特征欧氏距离；不同于平方距离和逐维均方差。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📚",
          "title": "经验分析有边界",
          "desc": "论文没有给出不遗忘定理；机制解释需用消融与性能共同检验。"
        },
        {
          "icon": "⚖️",
          "title": "稳定与可塑并重",
          "desc": "完全冻结可实现零漂移，却不能完成学习新类别的任务。"
        },
        {
          "icon": "🔎",
          "title": "区分两种漂移",
          "desc": "内部表示随训练变化，不等于数据生成关系发生概念漂移。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "实验：准确率、随时表现与算力一起看",
      "badge": "both",
      "badgeLabel": "实验精读",
      "bridge": "方法与梯度已经明确。现在按实验目的、数据集、基线、指标和结果的顺序，检验非对称更新是否在真实在线流中有用。",
      "analogy": {
        "title": "比较整幅画的完成质量",
        "text": "只看最后一笔，不能知道画作中途是否长期失真。对同一幅画，既要比较最终效果，也要记录整个创作过程与耗费。",
        "componentId": "ace-analogy-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "同协议比较：结果、误差与预算",
          "desc": "选择原文协议与指标，再比较准确率；数值来自 Tables 1–2，条长从零开始，完整表格保留标准误与资源成本。",
          "componentId": "ace-c8"
        }
      ],
      "insight": "较少计算、较高全程表现与较高最终准确率，是需要同时检查的三个目标。",
      "formula": {
        "lead": "AAA 将各评价时点的 AA 等权平均，资源指标分别记录平均存储量与累计计算量。",
        "unicode": "AAA = (1/T) Σₖ₌₁ᵀ AAₖ；Comp = Σₜ O(m(·; θₜ))",
        "symbols": [
          {
            "sym": "AAₖ",
            "desc": "第 k 次评价时，在所有已见测试分布上的平均准确率。"
          },
          {
            "sym": "T",
            "desc": "AAA 计算中使用的评价时点总数；实验每 10 更新评价一次。"
          },
          {
            "sym": "Comp",
            "desc": "累计浮点运算数；本文包含评价所需的额外推理开销。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "比较目标完整",
          "desc": "最终 Acc 看终点，AAA 看全程，TFLOPs 与内存看资源代价。"
        },
        {
          "icon": "📊",
          "title": "协议决定可比性",
          "desc": "增强、任务提示、预算、骨干与评价频率都要对齐。"
        },
        {
          "icon": "🔎",
          "title": "保留排序反例",
          "desc": "MiniImagenet 上 ACE 的 AAA 更高，SS-IL 的最终准确率更高。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "消融与模糊边界：什么证据支持机制",
      "badge": "both",
      "badgeLabel": "证据分析",
      "bridge": "总体收益不能独自解释方法为什么有效。进一步拆开负例范围、损失形式、边界重叠与数据预算，才能辨别论文的机制主张。",
      "analogy": {
        "title": "检查新花纹是否挤歪旧轮廓",
        "text": "只看到成品更好，还不知道是模板还是颜料在起作用。保持画作相同，逐一更换条件，才能检查哪一步改变了旧轮廓。",
        "componentId": "ace-analogy-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "负例消融：准确率与遗忘率分别比较",
          "desc": "Table 7 采用独立消融协议；选择缓冲预算与指标。遗忘率越低越好，不能把所有较长的条都判作更优。",
          "componentId": "ace-c9"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "独立协议：模糊边界、损失与数据稀缺",
          "desc": "切换实验条件，同时查看协议图、原文表格与能支持的结论；每种实验保留独立比较范围。",
          "componentId": "ace-c9protocol"
        }
      ],
      "insight": "负例限制既改变扰动，也改变新旧知识的整合；更小漂移与更好学习必须分别验证。",
      "takeaways": [
        {
          "icon": "🧪",
          "title": "负例范围关键",
          "desc": "所有负例 AML 在 M=20 的遗忘甚至高于 ER，限制负例才改善这组结果。"
        },
        {
          "icon": "🌫️",
          "title": "边界可逐渐变化",
          "desc": "模糊任务实验仍使用标签，收益不要求显式任务标识。"
        },
        {
          "icon": "⚖️",
          "title": "消融不能串表",
          "desc": "主文、附录负例消融、Mammoth 组合与少数据实验的协议要分别报告。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结论与研究延伸：从分类走向你的研究",
      "badge": "both",
      "badgeLabel": "研究视角",
      "bridge": "完成方法与证据审查后，将论文整理成十二项研究记录。最后区分可直接复现的结论与仍需机制研究的扩展问题。",
      "analogy": {
        "title": "完成画作，也检查留下的轮廓",
        "text": "模板帮助控制局部笔触，但成品还需要全局检查。研究方法同样要同时解释改善了什么，以及还有哪些变化没有被解释。",
        "componentId": "ace-analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "迁移判断与十二项精读记录",
          "desc": "选择研究场景，查看机制是否仍有对应对象；再按十二项记录回顾论文，并设计可区分竞争解释的实验。",
          "componentId": "ace-c10"
        }
      ],
      "insight": "值得推进的方向，应解释尚未清楚的机制，并给出能推翻自己解释的实验。",
      "takeaways": [
        {
          "icon": "🧠",
          "title": "从竞争结构理解遗忘",
          "desc": "控制新数据的局部竞争，仍用回放建立全局辨别。"
        },
        {
          "icon": "🛠️",
          "title": "复现先对齐实现",
          "desc": "核对损失分母、类序、缓冲插入时点和预算，再解释效果。"
        },
        {
          "icon": "🔬",
          "title": "研究先辨别机制",
          "desc": "从批次类别集合、共享雅可比与延迟反馈提出可证伪问题。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1ciLizbEZ1",
      "title": "扩展讨论：面向大模型持续学习的方法与应用",
      "reason": "持续学习的评估与应用；并非本篇论文报告",
      "cover": "https://i2.hdslb.com/bfs/archive/1949b3c76b5761ea5dbf857ac170637f792ec088.jpg",
      "views": "1994播放"
    },
    {
      "bvid": "BV1Ta411Z71A",
      "title": "背景补充：浅谈机器学习中的数据漂移问题",
      "reason": "连接概念漂移与时间序列；并非ER-ACE机制讲解",
      "cover": "https://i2.hdslb.com/bfs/archive/37264a2cd776c00d4d050f5b9046639724c86587.jpg",
      "views": "3.6万播放"
    }
  ]
};
