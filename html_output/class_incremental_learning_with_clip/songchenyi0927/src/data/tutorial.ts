import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Class-Incremental Learning with CLIP: Adaptive Representation Adjustment and Parameter Fusion",
    "titleZh": "面向CLIP的类增量学习：自适应表示调整与参数融合",
    "venue": "arXiv 2024 · arXiv:2407.14143v1",
    "authors": "Linlan Huang · Xusheng Cao · Haori Lu · Xialei Liu",
    "affiliation": "南开大学 VCIP / NKIARI",
    "domain": "视觉语言模型 · 类增量学习",
    "coreProblem": "直接微调 CLIP 时，语义相邻的新类会吞掉旧类样本，导致旧知识发生非均匀遗忘。",
    "coreInsight": "RAPF 用固定文本几何找出危险邻居，用高斯旧特征和铰链损失修复边界，再以 SVD 分解的重要性掩码融合固定线性适配器。",
    "keywords": [
      "CLIP",
      "类增量学习",
      "相邻类别",
      "参数融合",
      "SVD"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "直接微调 CLIP：新知识进入，但相近旧类容易被误判。",
      "componentId": "hero-rapf"
    },
    "newMethod": {
      "desc": "RAPF：文本挑邻居、生成旧特征、固定适配器，再分解融合。",
      "componentId": "hero-rapf"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "相邻类为何偷走旧知识",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "先看类增量学习最隐蔽的失败：新类并不平均伤害所有旧类，而是优先吞掉语义相近的旧类样本。",
      "analogy": {
        "title": "两片太像的拼图",
        "text": "旧类拼片与新类拼片颜色、边缘都相近，边界一旦偏向新类，旧类样本就会滑错位置。",
        "componentId": "ana-puzzle"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "相似邻居压力测试",
          "desc": "增加相似压力，观察旧类边界如何被新类拉走；红色区域代表受影响的旧类样本。",
          "componentId": "ch1-neighbor-stress"
        }
      ],
      "insight": "真正需要优先修复的，是会被相似新类划走的旧类表示。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "遗忘有方向",
          "desc": "相似新类最容易吞掉旧类样本。"
        },
        {
          "icon": "📉",
          "title": "邻类错误集中",
          "desc": "ImageNet100 B0 Inc10 中，25个错误预测有23个落在文本近邻。"
        },
        {
          "icon": "🧩",
          "title": "按影响修复",
          "desc": "先用文本关系找出危险邻居，再局部调整。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "CLIP 的共享语义坐标",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "既然文本能指出旧新关系，下一步要理解图像与类名为什么能放进同一张坐标图。",
      "analogy": {
        "title": "读盒盖，找拼片",
        "text": "拼片是图像侧证据，盒盖说明是文本侧线索；它们共享同一套花纹坐标。",
        "componentId": "ana-puzzle"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "共享空间拖拽",
          "desc": "拖动橙色图像特征，观察它更接近旧类还是新类的文本锚点。",
          "componentId": "ch2-embedding-drag"
        }
      ],
      "insight": "类名文本不是装饰，它给出了旧新类别在共享空间里的相对位置。",
      "formula": {
        "lead": "给定图像 xᵢ，先由图像编码器和适配器得到特征，再与类名文本特征 tⱼ 计算余弦相似度。",
        "unicode": "p(yᵢ|xᵢ) = softmax(cos(A(f_img(xᵢ)), f_text(tᵢ)) / τ)",
        "symbols": [
          {
            "sym": "xᵢ",
            "desc": "当前图像。"
          },
          {
            "sym": "A",
            "desc": "唯一训练的线性适配器。"
          },
          {
            "sym": "f_img",
            "desc": "冻结的 CLIP 图像编码器。"
          },
          {
            "sym": "f_text",
            "desc": "冻结的 CLIP 文本编码器。"
          },
          {
            "sym": "tᵢ",
            "desc": "类名提示文本特征。"
          },
          {
            "sym": "τ",
            "desc": "温度参数。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧠",
          "title": "共享空间",
          "desc": "图像和类名被映射到同一语义坐标。"
        },
        {
          "icon": "🧭",
          "title": "文本可用",
          "desc": "固定文本特征能指示旧新类别的相对远近。"
        },
        {
          "icon": "🔒",
          "title": "保护底座",
          "desc": "RAPF 只训练小适配器，避免破坏CLIP特征。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "从文本距离找出危险邻居",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "现在把共享空间变成一条筛选规则：只让距离足够近的旧新组合进入修复名单。",
      "analogy": {
        "title": "给邻居排队",
        "text": "尺子先量文本花纹的距离，只把最靠近新类的旧拼片放进同一组。",
        "componentId": "ana-puzzle"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "邻居排序步进",
          "desc": "逐步浏览候选旧新对；蓝色表示进入相邻集合，红色表示超出阈值。",
          "componentId": "ch3-pair-step"
        }
      ],
      "insight": "文本距离不是新的分类器，而是把修正范围缩到最可能互相伤害的旧新对。",
      "formula": {
        "lead": "先计算所有新类与旧类文本特征的距离矩阵，再用阈值 α 筛出相邻对集合。",
        "unicode": "D = dist(f_text(t_new), f_text(t_old)) ；P = {(i,j) | Dᵢⱼ < α}",
        "symbols": [
          {
            "sym": "D",
            "desc": "文本特征距离矩阵。"
          },
          {
            "sym": "f_text",
            "desc": "文本编码器。"
          },
          {
            "sym": "t_new",
            "desc": "新类名文本特征。"
          },
          {
            "sym": "t_old",
            "desc": "旧类名文本特征。"
          },
          {
            "sym": "α",
            "desc": "相邻类别阈值，论文设置为0.65。"
          },
          {
            "sym": "P",
            "desc": "进入修复集的旧新对集合。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📏",
          "title": "先筛选",
          "desc": "不是所有旧类都同等受新类影响。"
        },
        {
          "icon": "⚖️",
          "title": "范围可控",
          "desc": "α 越小越省计算，α 越大越可能吸收远邻居。"
        },
        {
          "icon": "🔗",
          "title": "降低复杂度",
          "desc": "论文用近邻对而不是稠密多对多关系。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "铰链损失：给易混边界留出间隔",
      "badge": "both",
      "badgeLabel": "核心",
      "bridge": "邻居名单只解决“修谁”；这一章解释怎样用很小的方向修正拉开旧新边界。",
      "analogy": {
        "title": "塞入距离垫片",
        "text": "不是把旧拼片搬走，而是在旧类和新类之间撑开一个刚好够用的间隔。",
        "componentId": "ana-puzzle"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "拖动间隔边际",
          "desc": "拖动旧类特征，让它离旧文本更近、离新文本更远，观察铰链状态从红变绿。",
          "componentId": "ch4-hinge-margin"
        }
      ],
      "insight": "RAPF 只推受影响的旧类，而且追求刚好越过间隔，避免过度修正。",
      "formula": {
        "lead": "每对相邻类别都计算一次间隔损失，再与当前数据的交叉熵相加。",
        "unicode": "L_hinge = Σₖ max(dist(A(ê_c), f_text(t_c)) − dist(A(ê_c), f_text(t_c′)) + m, 0) ；L = L_hinge + L_ce",
        "symbols": [
          {
            "sym": "ê_c",
            "desc": "采样得到的旧类图像特征。"
          },
          {
            "sym": "A",
            "desc": "线性适配器。"
          },
          {
            "sym": "f_text",
            "desc": "文本编码器。"
          },
          {
            "sym": "t_c",
            "desc": "旧类文本特征。"
          },
          {
            "sym": "t_c′",
            "desc": "相邻新类文本特征。"
          },
          {
            "sym": "m",
            "desc": "间隔常量。"
          },
          {
            "sym": "L_ce",
            "desc": "交叉熵损失。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎚",
          "title": "小修正",
          "desc": "只处理易混方向，减少对无关表示的扰动。"
        },
        {
          "icon": "🧱",
          "title": "先近旧再远新",
          "desc": "旧类特征必须比邻近新类更接近自己的文本。"
        },
        {
          "icon": "🧪",
          "title": "选择很重要",
          "desc": "文本选对时 Last 为76.04，随机对仅74.08。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "没有旧图片，如何补回旧样本",
      "badge": "both",
      "badgeLabel": "核心",
      "bridge": "铰链损失需要旧类特征，但 RAPF 不保存旧图片；本章解释旧类样本从哪里生成。",
      "analogy": {
        "title": "从轮廓补画旧片",
        "text": "没有原拼片时，用类别特征的均值、形状和采样结果，补回差一点就足够训练的旧片。",
        "componentId": "ana-puzzle"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "高斯采样密度",
          "desc": "调整每个被选类别的采样量；20个特征对应论文实现中的单次迭代设置。",
          "componentId": "ch5-gaussian-sample"
        }
      ],
      "insight": "旧样本不是被记住的图片，而是由冻结特征分布生成的可训练替身。",
      "formula": {
        "lead": "从类别 c 的均值 μ_c 和协方差 Σ_c 中采样旧类图像特征。",
        "unicode": "ê_c ∼ N(μ_c, Σ_c)",
        "symbols": [
          {
            "sym": "ê_c",
            "desc": "生成的旧类特征。"
          },
          {
            "sym": "μ_c",
            "desc": "类别中心。"
          },
          {
            "sym": "Σ_c",
            "desc": "类别协方差。"
          },
          {
            "sym": "N",
            "desc": "高斯分布。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📦",
          "title": "不存旧图",
          "desc": "用特征分布替代原始旧图片。"
        },
        {
          "icon": "🌫",
          "title": "保留散布",
          "desc": "协方差让生成点不只是一簇均值。"
        },
        {
          "icon": "🧷",
          "title": "避免奇异",
          "desc": "数据不足时用协方差收缩获得满秩矩阵。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "一个线性适配器怎样完成增量训练",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "有了旧类近似样本，接下来跟踪一次真正的任务训练：主干不动，只有固定适配器更新。",
      "analogy": {
        "title": "在同一槽位反复试拼",
        "text": "每轮只微调适配器，不重建整张拼图；固定结构能持续容纳新任务。",
        "componentId": "ana-puzzle"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "训练阶段步进",
          "desc": "推进15个训练阶段，观察冻结模块、适配器和学习率调度的变化。",
          "componentId": "ch6-training-steps"
        }
      ],
      "insight": "增量学习不等于不断加网络；冻结底座加固定适配器也能吸收新任务。",
      "formula": {
        "lead": "适配器仅更新 A；总目标由相邻类间隔损失和当前数据交叉熵组成。",
        "unicode": "θ_A ← θ_A − η∇(L_hinge + L_ce)",
        "symbols": [
          {
            "sym": "θ_A",
            "desc": "适配器参数。"
          },
          {
            "sym": "η",
            "desc": "学习率。"
          },
          {
            "sym": "∇",
            "desc": "梯度。"
          },
          {
            "sym": "L_hinge",
            "desc": "相邻类别间隔损失。"
          },
          {
            "sym": "L_ce",
            "desc": "交叉熵损失。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "❄️",
          "title": "保护底座",
          "desc": "CLIP 图像与文本编码器不更新。"
        },
        {
          "icon": "🔁",
          "title": "15轮",
          "desc": "学习率在 epoch 4 和 10 各降为原来的0.1。"
        },
        {
          "icon": "📐",
          "title": "不扩张",
          "desc": "线性适配器参数量不随任务数量增加。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "参数融合：稳定与可塑的细粒度平衡",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "只用新参数会忘记旧任务，直接平均又会互相拖拽；本章把选择权交到每个参数上。",
      "analogy": {
        "title": "对齐两半拼图",
        "text": "接缝不是整条一起平均，而是逐块判断哪些花纹该保留、哪些该更新。",
        "componentId": "ana-puzzle"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "融合模式切换",
          "desc": "切换旧参数、等权平均和 RAPF 融合，比较接缝稳定性与可塑性。",
          "componentId": "ch7-fusion-modes"
        }
      ],
      "insight": "参数融合的关键不是平均，而是用变化幅度判断每个参数该改多少。",
      "formula": {
        "lead": "按归一化参数变化生成重要性 M，并用 M 在旧、新任务系数之间逐元素插值。",
        "unicode": "M = min(1, |W_new − W_old| / (max(|W_new − W_old|) + b)) ；R = (J − M) ⊙ R_old + M ⊙ R_new",
        "symbols": [
          {
            "sym": "W_old",
            "desc": "上一任务参数。"
          },
          {
            "sym": "W_new",
            "desc": "当前任务训练后的参数。"
          },
          {
            "sym": "M",
            "desc": "逐参数重要性掩码。"
          },
          {
            "sym": "b",
            "desc": "常数偏置。"
          },
          {
            "sym": "J",
            "desc": "全1矩阵。"
          },
          {
            "sym": "R_old",
            "desc": "旧任务系数。"
          },
          {
            "sym": "R_new",
            "desc": "当前任务系数。"
          },
          {
            "sym": "⊙",
            "desc": "逐元素乘积。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧮",
          "title": "逐参数判断",
          "desc": "一个矩阵不必整体偏旧或偏新。"
        },
        {
          "icon": "⚖️",
          "title": "稳定与可塑",
          "desc": "变化大的参数更多吸收新知识。"
        },
        {
          "icon": "📈",
          "title": "融合有效",
          "desc": "加入融合无分解为79.28，完整融合为80.23。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "RAPF 框架与矩阵分解流水线",
      "badge": "trn",
      "badgeLabel": "架构",
      "bridge": "所有部件已经具备，现在把它们按训练时序连起来，并进入参数融合的内部矩阵。",
      "analogy": {
        "title": "用公共花纹搭桥",
        "text": "旧新参数不是两座孤岛，正交基像公共花纹，任务系数像各自的花纹比例。",
        "componentId": "ana-puzzle"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "RAPF 架构路径",
          "desc": "点击编码器、适配器、邻居选择、高斯采样、损失和融合节点，查看冻结状态与数据路径。",
          "componentId": "ch8-architecture-hotspots"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "SVD 融合步进",
          "desc": "依次推进分解、投影、重要性掩码、系数融合与最终重构。",
          "componentId": "ch8-fusion-steps"
        }
      ],
      "insight": "RAPF 的每个组件都有明确触发时机，冻结与训练边界不能混淆。",
      "formula": {
        "lead": "共享基让旧新参数可以在同一坐标系比较，再重构最终矩阵。",
        "unicode": "W_old → B R_old ；R_new = Bᵀ W_new ；W = B R",
        "symbols": [
          {
            "sym": "W_old",
            "desc": "上一任务适配器矩阵。"
          },
          {
            "sym": "B",
            "desc": "从 W_old 得到的正交基。"
          },
          {
            "sym": "R_old",
            "desc": "旧任务系数。"
          },
          {
            "sym": "R_new",
            "desc": "当前任务在同一基下的系数。"
          },
          {
            "sym": "W",
            "desc": "融合后的适配器矩阵。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧱",
          "title": "邻居修复",
          "desc": "语言引导只调整受影响边界。"
        },
        {
          "icon": "🧵",
          "title": "结构固定",
          "desc": "冻结CLIP，不按任务增加参数。"
        },
        {
          "icon": "🧬",
          "title": "共享坐标",
          "desc": "正交基使参数差异可比。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "阈值、参数预算与边界",
      "badge": "trn",
      "badgeLabel": "实践",
      "bridge": "方法有效不等于没有代价；本章检查 α、计算预算和产品化时需要保留的边界。",
      "analogy": {
        "title": "只留下需要的拼片",
        "text": "阈值太窄会漏掉危险邻居，太宽会把远关系也搬进训练。",
        "componentId": "ana-puzzle"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "阈值与预算",
          "desc": "拖动 α 观察相邻对预算变化；0.65是论文实验选择的默认阈值。",
          "componentId": "ch9-threshold-budget"
        }
      ],
      "insight": "0.65 不是自然常数，而是论文在覆盖率和计算预算之间做出的手动选择。",
      "takeaways": [
        {
          "icon": "🎛",
          "title": "手动选择",
          "desc": "α=0.65 来自实验设置，并非自适应结果。"
        },
        {
          "icon": "💸",
          "title": "纳入越多越贵",
          "desc": "超出近邻范围会增加计算和干扰。"
        },
        {
          "icon": "🧭",
          "title": "未来方向",
          "desc": "论文明确提出动态阈值和更高效融合值得继续研究。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果检验：提升是否可复现",
      "badge": "both",
      "badgeLabel": "结果",
      "bridge": "最后把结论放回各自的数据集与 B/Inc 协议中验证，并检查噪声下的边界表现。",
      "analogy": {
        "title": "同规则完成拼图",
        "text": "只有起点、赛道和计分方式一致，完成度比较才成立。",
        "componentId": "ana-puzzle"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "结果赛跑",
          "desc": "选择同一数据集与 B/Inc 设置，再启动 Last 准确率赛跑。",
          "componentId": "ch10-result-race"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "噪声边界",
          "desc": "切换测试标签噪声比例，比较 RAPF 与 RanPAC 的 Last 准确率。",
          "componentId": "ch10-noise-chips"
        }
      ],
      "insight": "结果可信的前提是协议一致；RAPF 的优势主要来自邻居修复与分解融合，但这些结论仍受手动阈值和测试范围限制。",
      "takeaways": [
        {
          "icon": "🏁",
          "title": "Last更敏感",
          "desc": "最终任务的旧类保留最能暴露遗忘。"
        },
        {
          "icon": "📚",
          "title": "分协议",
          "desc": "CIFAR100、ImageNet100、ImageNet-R 的 B/Inc 设置不可混用。"
        },
        {
          "icon": "🧯",
          "title": "仍有代价",
          "desc": "手动α、远邻居计算和更强噪声限制适用范围。"
        }
      ]
    }
  ]
};
