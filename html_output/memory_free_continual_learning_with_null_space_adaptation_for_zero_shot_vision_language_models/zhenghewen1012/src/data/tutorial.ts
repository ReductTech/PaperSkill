import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Memory-Free Continual Learning with Null Space Adaptation for Zero-Shot Vision-Language Models",
    "titleZh": "NuSA-CL：在低能量方向中持续学习",
    "venue": "ICLR 2026",
    "authors": "Yujin Jo · Taesup Kim",
    "affiliation": "Seoul National University",
    "domain": "视觉语言模型 · 持续学习",
    "coreProblem": "如何在固定模型容量、无历史存储的条件下，学会新任务并保留零样本能力？",
    "coreInsight": "从当前权重提取尾部奇异基，只训练中间矩阵 M；每个任务结束后合并更新，再重新分解。",
    "keywords": [
      "NuSA-CL",
      "CLIP",
      "SVD",
      "低秩适配",
      "持续学习"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "持续微调会触动已有方向",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "冻结尾部基，在固定骨干内累积更新",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "新知识要放在哪里",
      "badge": "inf",
      "badgeLabel": "研究问题",
      "bridge": "CLIP 已经通过预训练积累了图文对应关系。任务接连到来时，模型既要学习当前任务，也要保留旧任务和未见类别上的能力。NuSA-CL 把问题进一步收紧：长期保存的模型保持固定容量，学习过程不依赖历史样本、统计量或逐任务累积的专家。",
      "analogy": {
        "title": "留住轮廓，继续补色",
        "text": "一幅画会不断添入细节。限制补色区域，可以继续修改同一张画布，同时保留已有轮廓。固定画布对应固定大小的骨干，逐轮补色对应写回权重的任务更新。",
        "componentId": "analogy-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "历史越长，需要保存什么",
          "desc": "把任务数从 1 切换到 50，比较四种学习方式的长期存储账本，再选择 NuSA-CL 查看更新如何落回同一个骨干。",
          "componentId": "nusa-storage"
        }
      ],
      "insight": "NuSA-CL 用临时的尾部子空间适配分支学习当前任务，再将结果合并到固定大小的骨干；下一任务从新的骨干权重重新开始分解。",
      "formula": {
        "lead": "每轮训练后，新知识写回当前权重：",
        "unicode": "Wₜ = Wₜ₋₁ + ΔWₜ",
        "symbols": [
          {
            "sym": "Wₜ₋₁",
            "desc": "任务 t 开始前的已合并权重。"
          },
          {
            "sym": "ΔWₜ",
            "desc": "任务 t 学到的同形状权重增量。"
          },
          {
            "sym": "Wₜ",
            "desc": "任务 t 结束时合并后的权重，作为下一任务的起点。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "",
          "title": "固定容量",
          "desc": "每个任务结束后，更新写回同一组骨干权重，无需增加长期保存的任务分支。"
        },
        {
          "icon": "",
          "title": "学习目标",
          "desc": "同时关注当前任务适应、旧任务保留以及未见任务上的零样本迁移。"
        },
        {
          "icon": "",
          "title": "核心选择",
          "desc": "从当前权重自身寻找更新空间，将知识保存的边界写入适配器的参数化结构。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "图像与文字共享方向",
      "badge": "inf",
      "badgeLabel": "图文对齐",
      "bridge": "零样本分类使用类别文本作为语义参照。图像编码器与文本编码器输出归一化向量，方向越接近，匹配分数越高。持续学习改变编码器权重时，这些方向及其相对关系也会改变。",
      "analogy": {
        "title": "让笔尖对准色样",
        "text": "修补时需要对准已有色样。图像与类别文本也要落在相容的特征方向上，匹配分数才能保持稳定。拖动图像方向，观察同一组文本参照下分类如何变化。",
        "componentId": "analogy-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "转动图像向量，观察分类",
          "desc": "三个文本向量保持固定，橙色图像向量由你控制。方向变化会同时改变余弦相似度、softmax 概率和预测类别。",
          "componentId": "nusa-alignment"
        }
      ],
      "insight": "保护预训练知识需要关注图像与文本之间的相对几何关系。NuSA-CL 在两侧编码器内约束权重更新方向，以兼顾适应能力与既有对齐。",
      "formula": {
        "lead": "CLIP 对归一化特征计算相似度，再得到类别概率：",
        "unicode": "p(y=j | x) = exp(s · zᵢᵀzⱼ) / ∑ₖ exp(s · zᵢᵀzₖ)",
        "symbols": [
          {
            "sym": "p(y=j | x)",
            "desc": "输入图像 x 属于类别 j 的预测概率。"
          },
          {
            "sym": "zᵢ",
            "desc": "ℓ₂ 归一化后的图像向量，和文本向量内积得到余弦相似度。"
          },
          {
            "sym": "zⱼ",
            "desc": "类别 j 的归一化文本向量。"
          },
          {
            "sym": "s",
            "desc": "正值 logit 缩放；教学示例为 5，CLIP 使用 exp(logit_scale)。"
          },
          {
            "sym": "∑ₖ",
            "desc": "在当前候选类别 k 上求和，构成 softmax 分母。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "",
          "title": "分类依据",
          "desc": "归一化后，图像与类别文本的点积直接反映方向的接近程度。"
        },
        {
          "icon": "",
          "title": "同时变化",
          "desc": "一次图像方向变化会影响全部候选类别分数；softmax 将这些分数共同归一化。"
        },
        {
          "icon": "",
          "title": "对齐目标",
          "desc": "持续学习需要保留预训练图文关系，让新任务更新后的编码器继续支持零样本推理。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "用能量找到可用的细节空间",
      "badge": "inf",
      "badgeLabel": "SVD 分解",
      "bridge": "对当前权重做奇异值分解 W=UΣVᵀ，将奇异值从大到小排列。前若干方向承载大部分平方能量，构成主空间；NuSA-CL 在剩余尾部方向中选择低秩更新空间。",
      "analogy": {
        "title": "先遮住主轮廓",
        "text": "遮罩覆盖画面的主要轮廓，留下可以修补的细小区域。能量阈值决定保护多少方向，秩上限决定一次使用多少方向。前者改变开口范围，后者限制笔触能够组合的方向数。",
        "componentId": "analogy-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "能量阈值如何改变更新空间",
          "desc": "拖动能量阈值 ρ，再切换秩上限 rmax。主空间、可用尾部和实际选中的最末方向会同步更新；展开数值表可逐项检查累计能量。",
          "componentId": "nusa-spectrum"
        }
      ],
      "insight": "ρ 越高，主空间需要覆盖的能量越多；r 同时受尾部维数与配置上限限制。当尾部更宽时，官方实现优先选择奇异值最小的 r 个方向。",
      "formula": {
        "lead": "先确定累计能量首次达到阈值的位置，再确定有效更新秩：",
        "unicode": "k = min{j : ∑ᵢ₌₁ʲ σᵢ² ≥ ρ‖W‖²F}，r = min(d−k, rmax)",
        "symbols": [
          {
            "sym": "W",
            "desc": "当前任务开始时的 m×n 权重矩阵"
          },
          {
            "sym": "d",
            "desc": "奇异值数量，d=min(m,n)"
          },
          {
            "sym": "σᵢ",
            "desc": "第 i 个奇异值，按非增序排列；‖W‖²F=∑ᵢ σᵢ²"
          },
          {
            "sym": "ρ",
            "desc": "主空间需要覆盖的累计平方能量比例"
          },
          {
            "sym": "k",
            "desc": "满足能量阈值的最小主空间维数"
          },
          {
            "sym": "rmax",
            "desc": "配置的适配器秩上限"
          },
          {
            "sym": "r",
            "desc": "实际可用的更新秩；本节图示直接使用有效的 r 个方向"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "",
          "title": "平方能量",
          "desc": "主空间的选取依据 σᵢ² 的累计比例。教学例在 ρ=95% 时，前 3 维已经覆盖 98.289%。"
        },
        {
          "icon": "",
          "title": "两个约束",
          "desc": "默认 k=3 时剩余 5 个尾部方向，rmax=4 将有效更新秩限制为 4。"
        },
        {
          "icon": "",
          "title": "尾部选择",
          "desc": "有效秩确定后，官方实现取最末 r 个奇异方向；本节默认选中第 5–8 个方向。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "只训练中间的矩阵",
      "badge": "both",
      "badgeLabel": "固定基与可训练系数",
      "bridge": "找到尾部方向以后，NuSA-CL 冻结两侧奇异基，并把新任务的可学习变化集中在小矩阵 M。四个系数的组合，可以直接决定更新落在权重矩阵的哪些位置。",
      "analogy": {
        "title": "在开口中补色",
        "text": "遮罩固定后，笔触可以在开口内变化。两侧奇异基提供固定边界，中间矩阵决定在边界内怎样组合更新。",
        "componentId": "analogy-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "编辑 M，看更新落到哪里",
          "desc": "依次点击四个单元，尝试正向与反向更新。画布笔触、ΔW 网格、更新范数随同一个 M 实时变化。",
          "componentId": "nusa-matrix"
        }
      ],
      "insight": "M 改变子空间内部的组合系数，固定 Uₙ、Vₙ 保持更新可达方向。",
      "formula": {
        "lead": "把低维系数还原为原权重形状：",
        "unicode": "ΔW = Uₙ M Vₙᵀ；UₚᵀΔW = 0，ΔWVₚ = 0",
        "symbols": [
          {
            "sym": "ΔW",
            "desc": "m×n 的权重增量，与当前 W 同形。"
          },
          {
            "sym": "Uₙ",
            "desc": "m×r 的固定左尾部奇异基。"
          },
          {
            "sym": "Vₙ",
            "desc": "n×r 的固定右尾部奇异基。"
          },
          {
            "sym": "M",
            "desc": "r×r 的可训练系数矩阵，每个新任务从零初始化。"
          },
          {
            "sym": "Uₚ",
            "desc": "左主空间正交基；UₚᵀUₙ=0。"
          },
          {
            "sym": "Vₚ",
            "desc": "右主空间正交基；VₙᵀVₚ=0。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "",
          "title": "可学习部分集中在 M",
          "desc": "任务内冻结原权重与两侧尾部奇异基，只优化 r × r 个系数。"
        },
        {
          "icon": "",
          "title": "零初始化保留起点",
          "desc": "M = 0 时 ΔW = 0，模型从当前已合并的权重开始新任务。"
        },
        {
          "icon": "",
          "title": "主空间行列保持为零",
          "desc": "教学例使用 [e₃, e₄]，四个系数只能写入 ΔW 的右下 2 × 2 区域；对应论文式（3）的固定子空间参数化。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "初始化之后，边界仍然要在",
      "badge": "both",
      "badgeLabel": "冻结约束与消融",
      "bridge": "尾部方向给出了一个起点。训练中允许基向量继续变化，会使更新方向发生偏转；保持两侧基固定，则让同一组正交约束持续生效。",
      "analogy": {
        "title": "固定好遮罩的边缘",
        "text": "开始时对齐遮罩，还需要在补色过程中保持位置。若边界跟着笔移动，新增颜色会越过原来的保护区。",
        "componentId": "analogy-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "同步比较：方向漂移与冻结方向",
          "desc": "先点击“同步比较”，再切换偏转角度。两侧写入相同幅度的秩 1 更新，比较主方向二次项与输入泄漏。",
          "componentId": "nusa-constraint"
        }
      ],
      "insight": "固定奇异基把主空间正交性保留在整个任务的训练过程中。",
      "formula": {
        "lead": "二维例中，偏转角度直接决定更新与主方向的耦合：",
        "unicode": "v = (sin θ, cos θ)ᵀ；ΔW = p vvᵀ；e₁ᵀΔW e₁ = p sin²θ；‖ΔW e₁‖₂ = p |sin θ|",
        "symbols": [
          {
            "sym": "e₁",
            "desc": "教学例的主方向，e₁=(1,0)ᵀ；尾部方向为 e₂=(0,1)ᵀ。"
          },
          {
            "sym": "θ",
            "desc": "方向可变更新相对尾部方向的偏转角。"
          },
          {
            "sym": "p",
            "desc": "比较进度，取值 0 到 1，控制两侧更新的共同幅度。"
          },
          {
            "sym": "‖ΔW e₁‖₂",
            "desc": "主方向输入经过当前更新后的向量长度。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "",
          "title": "初始对齐后仍可能偏转",
          "desc": "θ 从 0° 增大，p = 1 时主方向二次项由 0 增至 sin²θ，输入泄漏增至 |sin θ|。"
        },
        {
          "icon": "",
          "title": "冻结两侧基维持正交性",
          "desc": "NuSA-CL 在任务内固定 Uₙ、Vₙ，因此 UₚᵀΔW = 0 且 ΔWVₚ = 0。"
        },
        {
          "icon": "",
          "title": "消融支持冻结设计",
          "desc": "表 4a 的 full-shot MTIL 中，只训练 M 的 Avg 为 75.08%；共同训练 M、Uₙ、Vₙ 为 68.12%。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "合并一次，再重新分解",
      "badge": "inf",
      "badgeLabel": "任务间更新循环",
      "bridge": "新任务的系数训练完成后，更新被写回同一个骨干。下一任务从当前权重重新寻找尾部方向，M 再次从零开始。",
      "analogy": {
        "title": "让补色成为原画的一部分",
        "text": "上一轮补上的颜色已成为画面本身。下一轮需要根据现在的画面重新放置遮罩。",
        "componentId": "analogy-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "走过两个任务的更新循环",
          "desc": "逐步完成提取、训练、合并、重新分解。这个固定 r = 1 的二维例中，合并改变了奇异值次序，也改变了下一任务的尾部方向。",
          "componentId": "nusa-cycle"
        }
      ],
      "insight": "任务内基保持固定，任务间基随当前权重重新提取；骨干尺寸在循环中保持不变。",
      "formula": {
        "lead": "每一轮学习写入当前骨干，再建立下一轮适配分支：",
        "unicode": "Wₜ ← Wₜ₋₁ + Uₙ,ₜ Mₜ Vₙ,ₜᵀ；(Uₙ,ₜ₊₁, Vₙ,ₜ₊₁) ← tail(SVD(Wₜ))；Mₜ₊₁ ← 0",
        "symbols": [
          {
            "sym": "Wₜ",
            "desc": "第 t 个任务合并后的骨干权重。"
          },
          {
            "sym": "tail(SVD(Wₜ))",
            "desc": "对当前合并权重重新分解，取最小奇异值对应的有效尾部方向。"
          },
          {
            "sym": "Mₜ₊₁",
            "desc": "下一任务的可训练系数矩阵，重新置零。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "",
          "title": "合并写回同一个骨干",
          "desc": "论文式（4）把本任务增量加入 W，模型无须为每个历史任务保留独立适配分支。"
        },
        {
          "icon": "",
          "title": "当前权重决定下一轮方向",
          "desc": "教学例从 diag(4, 1) 更新为 diag(4, 5)，重新 SVD 后尾部方向由 e₂ 变为 e₁。"
        },
        {
          "icon": "",
          "title": "每任务重新建立零起点",
          "desc": "重新提取基后，M 置零；固定尺寸的骨干继续累积各任务更新。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "用当前任务训练，再检验更新界",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "用一个可逐步计算的分类例子观察梯度，再用明确的矩阵检验更新内积的理论上界。",
      "analogy": {
        "title": "一笔下去，力度有多大",
        "text": "同一支笔在多个细节区域同时补色，累计变化也随区域数量增加。检查更新的尺度，需要同时保留每一处的贡献。",
        "componentId": "analogy-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "一小步交叉熵更新",
          "desc": "逐次更新标量 logit，观察目标类别概率、梯度和损失如何一起变化。",
          "componentId": "nusa-objective"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "把论文式（5）代入一个可算例子",
          "desc": "切换维数和尾部奇异值，在相同矩阵上计算三个代数量。",
          "componentId": "nusa-bound"
        }
      ],
      "insight": "分类损失驱动 M 的学习；更新界的维数依赖可以通过矩阵实例直接检验。",
      "formula": {
        "lead": "交叉熵训练与独立推导的 Cauchy 上界",
        "unicode": "ℒ = −∑ⱼ qⱼ log pⱼ<br/>|Tr(ΣₙM)| ≤ ‖Σₙ‖F‖M‖F ≤ √r · σₙ,max ‖M‖F",
        "symbols": [
          {
            "sym": "qⱼ",
            "desc": "平滑后的类别目标概率。"
          },
          {
            "sym": "pⱼ",
            "desc": "模型预测类别 j 的概率。"
          },
          {
            "sym": "Σₙ",
            "desc": "选中尾部奇异值组成的对角矩阵。"
          },
          {
            "sym": "r",
            "desc": "有效尾部空间维数。"
          },
          {
            "sym": "‖Σₙ‖F",
            "desc": "尾部奇异值平方和的平方根。"
          },
          {
            "sym": "‖M‖F",
            "desc": "M 中全部元素平方和的平方根。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "",
          "title": "当前任务提供梯度",
          "desc": "图像与类别文本归一化后计算相似度，用当前标签的平滑交叉熵优化 M。"
        },
        {
          "icon": "",
          "title": "维数检验得到反例",
          "desc": "Σₙ = εIᵣ、M = Iᵣ 时，内积为 rε；r > 1 时超过论文式（5）右端 ε√r。"
        },
        {
          "icon": "",
          "title": "Frobenius 界保留累积贡献",
          "desc": "独立应用 Cauchy–Schwarz，得到 ‖Σₙ‖F‖M‖F；该例上界恰好等于 rε。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "把约束接到图文两条分支",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "把单个受限矩阵更新放回 CLIP：图像与文本编码器都在注意力投影中适配，并共同决定分类相似度。",
      "analogy": {
        "title": "两侧色调一起对齐",
        "text": "图案和色样共同决定修补是否协调。图像编码器和文本编码器都参与适配，保留共同的相似度空间。",
        "componentId": "analogy-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "选择投影，追踪适配分支",
          "desc": "切换编码器、注意力投影和适配范围，观察可训练路径、矩阵维数与论文消融结果。",
          "componentId": "nusa-architecture"
        }
      ],
      "insight": "视觉与文本两侧使用相同的固定基参数化；双模态消融在 Full-shot MTIL 中得到更高的 Avg。",
      "formula": {
        "lead": "官方实现中的注意力投影更新",
        "unicode": "h = Wx + (α / √rmax) · UₙMVₙᵀx",
        "symbols": [
          {
            "sym": "W",
            "desc": "当前注意力投影权重，任务内冻结。"
          },
          {
            "sym": "Uₙ",
            "desc": "固定的左尾部基；官方实现按配置秩预留列槽位。"
          },
          {
            "sym": "Vₙ",
            "desc": "固定的右尾部基；有效方向不足时其余槽位置零。"
          },
          {
            "sym": "M",
            "desc": "唯一可训练的中间系数矩阵。"
          },
          {
            "sym": "α",
            "desc": "更新缩放系数，full-shot 为 2、5-shot 为 1。"
          },
          {
            "sym": "rmax",
            "desc": "配置秩上限，MTIL 默认 128；官方缩放分母使用其平方根。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "",
          "title": "两侧均适配 q、k、v、o",
          "desc": "视觉与文本编码器各 12 层，共 96 个注意力投影；训练期间原权重与奇异基冻结。"
        },
        {
          "icon": "",
          "title": "参数成本集中在 M",
          "desc": "rank 128 时，每个 M 有 16,384 个系数；双分支固定槽位合计 1,572,864 个。"
        },
        {
          "icon": "",
          "title": "双模态消融表现更好",
          "desc": "Table 4(a) 的 Avg：双模态 75.08%，仅文本 72.62%，仅视觉 70.49%。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "保护程度与学习容量怎样折中",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "把前面的空间与能量机制映射到实测结果，分别比较更新秩、子空间位置和能量阈值。",
      "analogy": {
        "title": "选一支合适宽度的笔",
        "text": "细笔适合保留边缘，宽笔可以覆盖更大的区域。可用方向增加时，新任务精度与旧知识保持出现不同变化。",
        "componentId": "analogy-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "尾部、顶部和随机空间的取舍",
          "desc": "选择五个实测秩之一，再比较三种空间的遗忘率与目标任务准确率。",
          "componentId": "nusa-rank"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "能量阈值的五个实测点",
          "desc": "比较 ρ 对多任务准确率的影响，连接主空间保护与剩余更新容量。",
          "componentId": "nusa-rho"
        }
      ],
      "insight": "更大的更新秩提高目标任务准确率，也伴随更多遗忘；更高的保护阈值会收缩可用尾部空间。",
      "formula": {
        "lead": "可用尾部维数与有效更新系数",
        "unicode": "k = min{j : ∑ᵢ₌₁ʲ σᵢ² ≥ ρ‖W‖F²}<br/>r = min(d − k, rmax)，有效系数数量为 r²",
        "symbols": [
          {
            "sym": "ρ",
            "desc": "受保护主空间覆盖的平方奇异值能量比例"
          },
          {
            "sym": "k",
            "desc": "满足能量阈值的最小主空间维数"
          },
          {
            "sym": "d",
            "desc": "min(m, n)"
          },
          {
            "sym": "r",
            "desc": "尾部可用维数与配置秩上限共同决定的有效秩"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "",
          "title": "尾部更新遗忘更小",
          "desc": "Table 10，r = 128 时尾部遗忘率为 2.57%，顶部为 4.44%，随机空间为 4.57%。"
        },
        {
          "icon": "",
          "title": "秩扩大带来双向变化",
          "desc": "尾部秩从 32 增至 256，目标准确率从 78.05% 增至 87.34%，遗忘率从 1.46% 增至 5.11%。"
        },
        {
          "icon": "",
          "title": "极高阈值压缩适配空间",
          "desc": "Table 4(b)，ρ 从 0.95 升至 0.999，Avg 从 75.08% 降至 72.89%，Last 从 82.79% 降至 79.16%。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、成本与持续学习的边界",
      "badge": "both",
      "badgeLabel": "证据",
      "bridge": "结合准确率、额外存储、训练开销和任务长度，评价固定骨干中的持续学习表现。",
      "analogy": {
        "title": "检视完成的修补",
        "text": "细节补上了，还要检查轮廓、色调和整体效果。论文通过多任务增量与类增量实验衡量学习与保留。",
        "componentId": "analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "选择指标，比较实测结果",
          "desc": "切换 Full-shot、5-shot 与三个 MTIL 指标，启动准确率对比，并检查训练成本。",
          "componentId": "nusa-results"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "任务变长后还保留多少能力",
          "desc": "选择 CIFAR-100 类增量步数与指标，保留优势和较弱结果的完整对照。",
          "componentId": "nusa-horizon"
        }
      ],
      "insight": "NuSA-CL 在固定骨干与无历史存储设置下获得较好的效果和训练效率；不同任务长度与指标呈现不同优势。",
      "formula": {
        "lead": "MTIL 中的三个观察角度",
        "unicode": "Transfer：尚未训练任务的零样本表现<br/>Avg：学习过程中多任务准确率的平均<br/>Last：最后一步的全部任务平均表现",
        "symbols": [
          {
            "sym": "Transfer",
            "desc": "多任务增量实验中，在学习某任务前对该任务的零样本准确率。"
          },
          {
            "sym": "Avg",
            "desc": "在持续学习过程中，对每一步的多任务准确率取平均。"
          },
          {
            "sym": "Last",
            "desc": "最后一步完成全部任务后，在全部任务上的平均准确率。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "",
          "title": "Full-shot 效果与开销",
          "desc": "Table 1：NuSA-CL 的 Avg 为 75.1%，训练参数约 1.5M，峰值显存 6.6GB，训练时间 1.21 GPU h。"
        },
        {
          "icon": "",
          "title": "长期类增量保持优势",
          "desc": "Table 3：50 步 Last 为 71.85%，比 ZSCL 高 4.49 个百分点；10 步 Avg 为 80.25%，比 ZSCL 低 1.90 个百分点。"
        },
        {
          "icon": "",
          "title": "容量仍需随任务跟踪",
          "desc": "11 个 MTIL 任务后视觉输出投影平均剩余 313.58 维；更长序列的容量饱和和大模型 SVD 成本仍是论文提出的问题。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1SL4y1s7LQ",
      "title": "CLIP 论文逐段精读【论文精读】",
      "cover": "https://i1.hdslb.com/bfs/archive/b741a268f24deacb2eba536bf5f990817e82a01f.jpg",
      "views": "38.5万播放",
      "reason": "CLIP 图文对齐、零样本分类与预训练背景。"
    },
    {
      "bvid": "BV1ExWxesEVf",
      "title": "超详细！彻底搞懂矩阵奇异值分解（SVD）本质+计算+应用！",
      "cover": "https://i2.hdslb.com/bfs/archive/31f9edf307a55514235236ff2530e247b923ca43.jpg",
      "views": "8.9万播放",
      "reason": "理解奇异向量、奇异值和矩阵分解，为谱能量阈值与尾部空间交互提供数学基础。"
    },
    {
      "bvid": "BV1cM4m1r7Fe",
      "title": "LoRA_01_算法原理深入解析-上集",
      "cover": "https://i1.hdslb.com/bfs/archive/1f73ee065574b2a93459639fec561494d3798866.jpg",
      "views": "1.2万播放",
      "reason": "低秩更新与参数高效微调，帮助比较自由 LoRA 和 NuSA 的固定子空间约束。"
    }
  ]
};
