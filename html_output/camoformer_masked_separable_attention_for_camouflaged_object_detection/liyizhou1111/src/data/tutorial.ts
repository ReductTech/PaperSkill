import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "CamoFormer: Masked Separable Attention for Camouflaged Object Detection",
    "titleZh": "CamoFormer：把伪装目标与背景分开看",
    "venue": "IEEE TPAMI 2024 · 作者稿",
    "authors": "Bowen Yin、Xuying Zhang、Deng-Ping Fan、Shaohui Jiao、Ming-Ming Cheng、Luc Van Gool、Qibin Hou",
    "affiliation": "南开大学 · 字节跳动 · 苏黎世联邦理工学院",
    "domain": "计算机视觉 · 伪装目标检测",
    "coreProblem": "当目标与背景纹理高度相似时，怎样找到完整目标并保住细致边界？",
    "coreInsight": "分别从预测前景、背景和全图构建相关性，保留完整的值特征，再逐层细化分割。",
    "keywords": [
      "伪装目标检测",
      "掩码可分离注意力",
      "软掩码",
      "渐进精修",
      "边界区域评价"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "不区分区域的全局取证，容易混入相似背景线索。",
      "componentId": "camo-old"
    },
    "newMethod": {
      "desc": "前景、背景、全局三组注意力互补，在解码过程中逐层精修。",
      "componentId": "camo-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "在相似纹理里找出完整目标",
      "badge": "inf",
      "badgeLabel": "问题与任务",
      "bridge": "伪装目标检测要给出目标的像素级分割结果。目标与背景颜色、纹理相似时，难点不仅是找到目标，还包括补全容易遗漏的部分与边界。",
      "analogy": {
        "title": "把叶片画在相似底色上",
        "text": "叶片和底色越接近，随意涂一遍就越容易越界。先辨清哪些线索属于叶片、哪些属于周围，才能保住轮廓。",
        "componentId": "camo-scene-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "相似纹理带来什么困难",
          "desc": "调节背景相似度，观察局部颜色线索如何变弱。右侧红色区域是遗漏现象的概念示意，不是模型预测或准确率测量。依据原文第1节（第1—2页）。",
          "componentId": "camo-1"
        }
      ],
      "insight": "相似纹理让局部线索不够可靠，CamoFormer 尝试分开检查前景和背景，同时保留全局联系。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "任务是像素级分割",
          "desc": "不仅确定目标位置，还要尽量找全目标轮廓。"
        },
        {
          "icon": "🔎",
          "title": "相似性是主要困难",
          "desc": "小目标和不规则边界会进一步增加辨别难度。"
        },
        {
          "icon": "🖌️",
          "title": "演示不等于预测",
          "desc": "画布用于解释现象，没有在浏览器里运行神经网络。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "从图像到四层特征",
      "badge": "inf",
      "badgeLabel": "输入与表示",
      "bridge": "要区分相似区域，首先需要合适的图像表示。CamoFormer 使用多层特征兼顾较密的空间线索与高层语义，再把后三层聚合为精修的起点。",
      "analogy": {
        "title": "用不同画框观察同一片叶子",
        "text": "大画框保留整体布局，细节需要更密的观察位置。多层表示把不同分辨率的线索留给后续精修。",
        "componentId": "camo-scene-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "点击一个特征层",
          "desc": "以384×384输入为例，查看各层空间尺寸。画布中的网格仅表示分辨率变化，不代表实际特征值；右侧四块对应E1至E4，下方汇合块为E5。依据原文第3.1节、图2（第3页）。",
          "componentId": "camo-2"
        }
      ],
      "insight": "E5 来自 E2、E3、E4 的尺寸对齐与聚合，不是额外增加的第五个骨干阶段。",
      "takeaways": [
        {
          "icon": "🧩",
          "title": "默认骨干",
          "desc": "论文默认采用PVTv2，表1中的CamoFormer-P具体使用PVTv2-b4。"
        },
        {
          "icon": "📐",
          "title": "统一通道",
          "desc": "各层通过1×1卷积映射到默认128通道，方便后续融合。"
        },
        {
          "icon": "🔗",
          "title": "聚合后的E5",
          "desc": "后三层对齐到H/16×W/16，再拼接、卷积得到E5。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "让前景、背景与全局各司其职",
      "badge": "inf",
      "badgeLabel": "核心直觉",
      "bridge": "多层表示提供了线索，但把所有区域一视同仁仍容易混淆。CamoFormer 的掩码可分离注意力（MSA）让不同组注意力头从不同区域构建关系，再整合互补信息。",
      "analogy": {
        "title": "给叶片套上遮版",
        "text": "遮版帮助画者分别检查叶片内外，但仍要抬眼看整幅画。三种视角提供互补线索，完整模型将它们融合使用。",
        "componentId": "camo-scene-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "三种取证范围",
          "desc": "左侧保留普通TA，右侧切换不同取证范围。覆盖颜色是空间掩码的概念示意；注意力实际计算的是通道之间的关系，并非直接裁掉图像。依据原文第3.2节、公式4—7（第4页）。",
          "componentId": "camo-3"
        }
      ],
      "insight": "前景和背景分支改变构建关系时使用的证据，全局分支保留整幅特征中的联系；各分支的V都保持完整。",
      "formula": {
        "lead": "预测背景掩码由前景掩码逐位置取补集得到，两者都是连续权重。",
        "unicode": "Mᴮ = 1 − Mᶠ",
        "symbols": [
          {
            "sym": "Mᴮ",
            "desc": "预测背景掩码，与前景掩码同尺寸；逐位置与Mᶠ相加为1。"
          },
          {
            "sym": "Mᶠ",
            "desc": "取值0到1的预测前景软掩码，沿通道广播后用于加权Q和K，不是测试时的真值标签。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🍃",
          "title": "前景分支F-TA",
          "desc": "利用预测前景区域的Q、K构建通道关系。"
        },
        {
          "icon": "🌿",
          "title": "背景分支B-TA",
          "desc": "利用互补背景区域构建关系，补充背景证据。"
        },
        {
          "icon": "🖼️",
          "title": "全局分支TA",
          "desc": "保留未加掩码的全图关系，三组输出最终拼接并融合。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "掩码改变相关性，V 保持完整",
      "badge": "both",
      "badgeLabel": "核心机制",
      "bridge": "前景、背景、全局三组各有取证范围。接下来要弄清掩码究竟乘在哪里，以及“转置注意力”算的是哪些关系。",
      "analogy": {
        "title": "调整遮版的透过程度",
        "text": "半透明遮版表达还不确定，无需急着切成非黑即白。它决定如何取证，不等于把整张画裁掉。",
        "componentId": "camo-scene-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "用小算例改变软掩码",
          "desc": "算例中 Q=K=[[1,0],[0.6,0.8],[0,1]]，前景掩码为 [0.9,p,0.1]，V=[[1,0.2],[0.6,0.8],[0.1,1]]。固定 α=1，省略特征投影及输入特征的归一化，保留掩码加权、按行 Softmax 与矩阵乘法；这些不是模型实际激活。",
          "componentId": "camo-4"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "沿矩阵维度核对计算",
          "desc": "用 N=3 个位置、C=2 个通道核对三步计算。下图为原文第4页图3，展示 F-TA 的掩码位置，B-TA 仅使用不同的掩码。",
          "componentId": "camo-4b",
          "figure": "./images/fig3.png"
        }
      ],
      "insight": "掩码约束相关性构建，完整 V 承载被聚合的内容。",
      "formula": {
        "lead": "式（5）中，Q、K 已经乘过前景软掩码，而 V 不加掩码。",
        "unicode": "F-TA = Vᶠ · Softmax((Qᶠ)ᵀKᶠ / αᶠ)",
        "symbols": [
          {
            "sym": "Qᶠ",
            "desc": "前景掩码加权后的查询。单头简化表示为 N×C，N=HW，掩码按空间位置广播。"
          },
          {
            "sym": "Kᶠ",
            "desc": "前景掩码加权后的键，形状 N×C；QᶠᵀKᶠ 产生 C×C 通道相关矩阵。"
          },
          {
            "sym": "Vᶠ",
            "desc": "前景分支的完整值矩阵，形状 N×C，不乘前景掩码。"
          },
          {
            "sym": "αᶠ",
            "desc": "可学习的缩放参数。小算例固定为1以便理解，不能把这个值当作训练配置。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "●",
          "title": "掩码作用于 Q、K",
          "desc": "前景和背景分支的 V 都保留完整内容。"
        },
        {
          "icon": "●",
          "title": "通道间的关系",
          "desc": "简化单头表示中，注意力矩阵为 C×C，而非 N×N。"
        },
        {
          "icon": "●",
          "title": "保留数学前提",
          "desc": "完整模块还有投影、深度卷积与归一化；小算例仅拆解核心操作。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "软掩码由当前预测生成",
      "badge": "both",
      "badgeLabel": "机制",
      "bridge": "掩码决定取证范围，但测试图像没有标注可用。CamoFormer 让当前层的预测产生连续掩码，再用它引导后续精修。",
      "analogy": {
        "title": "对齐半透明遮版",
        "text": "遮版的位置来自当前草图，因此可能有偏差。保留半透明程度，可以表达不确定区域，后续还会继续修正。",
        "componentId": "camo-scene-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "拖动遮版观察互补区域",
          "desc": "拖动橙色标记或使用方向按钮，观察三个示意位置的前景与背景概率。概率由位置关系构造，仅解释互补软掩码；不代表网络输出或论文测得的错误率。依据第4页 Mask Generation。",
          "componentId": "camo-5"
        }
      ],
      "insight": "预测本身成为下一次取证的线索；前景和背景掩码始终互补。",
      "formula": {
        "lead": "每一级用3×3卷积和 Sigmoid 生成连续掩码，背景掩码由前景掩码的补集得到。",
        "unicode": "Mᶠ = Sigmoid(Conv₃×₃(X))；Mᴮ = 1 − Mᶠ",
        "symbols": [
          {
            "sym": "Mᶠ",
            "desc": "预测前景软掩码，范围0到1。论文保留连续值，不做二值化。"
          },
          {
            "sym": "Mᴮ",
            "desc": "互补背景软掩码；在每个位置都有 Mᶠ+Mᴮ=1。"
          },
          {
            "sym": "X",
            "desc": "当前层的特征，用于产生当前预测掩码，并非真值标注。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "●",
          "title": "来自当前预测",
          "desc": "P2 至 P5 用作对应 MSA 的掩码，P1 是最终预测。"
        },
        {
          "icon": "●",
          "title": "连续表达不确定性",
          "desc": "Sigmoid 输出保留0到1的软概率，不进行硬阈值切分。"
        },
        {
          "icon": "●",
          "title": "推理没有参考答案",
          "desc": "真值只用于训练监督和离线评价，不用于生成测试时的掩码。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "从粗预测逐层精修",
      "badge": "inf",
      "badgeLabel": "推理",
      "bridge": "有了当前预测生成的软掩码，一次 MSA 可以改善一层特征。接下来把它放进顶向下的解码过程，观察从 P5 到 P1 的五级预测。",
      "analogy": {
        "title": "沿草图修细叶缘",
        "text": "草图确定大致形状，细笔保留原有线索并修正轮廓。每次查看合适尺度，直到得到最终分割。",
        "componentId": "camo-scene-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "逐级查看预测",
          "desc": "以384×384输入说明各级尺寸。左侧轮廓只是粗到细的概念示意，右侧方块对应 E5、D4、D3、D2、D1；数字为特征边长。依据第3页图2及式（1）（2）。",
          "componentId": "camo-6"
        }
      ],
      "insight": "先用高层结果调制当前层，再加回当前层特征，逐级保留线索并修正。",
      "formula": {
        "lead": "对 i=3、2、1，先把 MSA 输出对齐到当前层再融合。初始化的 D4 单独使用 MSA(E5)⊙Up(E4)+Up(E4)。",
        "unicode": "Dᵢ = Up(MSA(Dᵢ₊₁)) ⊙ Eᵢ + Eᵢ",
        "symbols": [
          {
            "sym": "Dᵢ₊₁",
            "desc": "上一解码层的特征，经 MSA 增强后引导当前层。"
          },
          {
            "sym": "Dᵢ",
            "desc": "当前解码层融合后的特征。这里的递推范围为 i=3、2、1。"
          },
          {
            "sym": "Eᵢ",
            "desc": "当前层编码器特征，已统一通道并满足尺寸对齐要求。"
          },
          {
            "sym": "Up",
            "desc": "双线性尺寸匹配操作；应匹配目标层，不等于每一级都固定放大两倍。"
          },
          {
            "sym": "⊙",
            "desc": "逐元素乘法。随后加回 Eᵢ，保留当前层特征。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "●",
          "title": "乘法与残差相结合",
          "desc": "当前层特征既参与调制，也通过相加保留。"
        },
        {
          "icon": "●",
          "title": "尺寸要逐级核对",
          "desc": "384输入下，E5、D4、D3均为24×24，D2和D1分别为48×48和96×96。"
        },
        {
          "icon": "●",
          "title": "一次前向中的精修",
          "desc": "最终 P1 恢复输入分辨率；逐层精修不代表重复训练模型。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "五级预测共同接受监督",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "逐层精修解释了预测怎样产生。本节进一步区分训练时的真值监督和推理时的预测掩码。",
      "analogy": {
        "title": "对着参考轮廓练习",
        "text": "参考轮廓帮助每张草图知道哪里画错。训练时逐级得到反馈，识别新图时则没有参考答案。",
        "componentId": "camo-scene-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "检查五级监督",
          "desc": "依次检查各级预测如何接受 BCE 与 IoU 监督。数字表示 P5 到 P1；配置来自论文第 4 页公式 3、第 5—6 页实验设置，没有执行训练。",
          "componentId": "camo-7"
        }
      ],
      "insight": "中间预测同时接受分割监督并作为后续精修的掩码，使各级预测都有直接的学习信号。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两类损失",
          "desc": "BCE 关注像素判别，IoU 关注区域重叠。"
        },
        {
          "icon": "🔎",
          "title": "五级相加",
          "desc": "所有预测先对齐输入分辨率，再计算损失并相加。"
        },
        {
          "icon": "⚖️",
          "title": "原文训练配置",
          "desc": "384×384、60 轮、batch size 6；耗时是作者设备上的报告。"
        }
      ],
      "formula": {
        "lead": "五级预测都恢复到输入分辨率，并以相同方式计算两类损失。",
        "unicode": "L = ∑ᵢ₌₁⁵ [Lᵦ꜀ₑ(Pᵢ, G) + Lᵢₒᵤ(Pᵢ, G)]",
        "symbols": [
          {
            "sym": "Lᵦ꜀ₑ",
            "desc": "二元交叉熵，衡量像素预测与标签的差异。"
          },
          {
            "sym": "Lᵢₒᵤ",
            "desc": "IoU 损失，约束预测区域与真值的重叠。"
          },
          {
            "sym": "Pᵢ",
            "desc": "第 i 级预测，计算损失前恢复到输入图像尺寸。"
          },
          {
            "sym": "G",
            "desc": "真值分割标注，只用于训练监督和离线评价。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "把完整网络连起来",
      "badge": "trn",
      "badgeLabel": "结构",
      "bridge": "现在已经理解多层特征、三种取证视角和监督方式，可以将它们放回完整网络，并考察解码器宽度的代价。",
      "analogy": {
        "title": "揭开遮版看全貌",
        "text": "各次局部检查最终服务于同一幅画。需要同时看清多层线索、修正操作与最终结果的联系。",
        "componentId": "camo-scene-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点击网络中的一个位置",
          "desc": "选择组件会同步高亮对应位置与后续路径。下方附原文图 2；宽度实验来自表 7，数值为 COD10K 测试集结果。",
          "componentId": "camo-8",
          "figure": "./images/fig2.png"
        }
      ],
      "insight": "多层表示与分区取证在渐进解码器中结合。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "完整结构",
          "desc": "骨干、聚合、MSA 和渐进解码共同构成 CamoFormer。"
        },
        {
          "icon": "🔎",
          "title": "默认宽度 128",
          "desc": "在论文配置下兼顾精度与计算量。"
        },
        {
          "icon": "⚖️",
          "title": "更宽不必更好",
          "desc": "通道从 128 增至 192 时，COD10K wF 从 0.793 变为 0.790。"
        }
      ],
      "formula": {
        "lead": "三组注意力的输出先拼接，再映射回解码器通道数 Cd。",
        "unicode": "Z = Conv₃×₃([F-TA, B-TA, TA])",
        "symbols": [
          {
            "sym": "Z",
            "desc": "MSA 聚合后的特征，通道数恢复为 Cd。"
          },
          {
            "sym": "Conv₃×₃",
            "desc": "3×3 卷积，融合拼接后的三组信息。"
          },
          {
            "sym": "F-TA",
            "desc": "依据预测前景构建关系的注意力分支。"
          },
          {
            "sym": "B-TA",
            "desc": "依据互补背景构建关系的注意力分支。"
          },
          {
            "sym": "TA",
            "desc": "保留整幅特征关系的分支。方括号表示拼接，不是相加。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "把评价放到边界附近",
      "badge": "trn",
      "badgeLabel": "评价",
      "bridge": "网络输出是否精细，不能只看整图平均分。本节学习 TPAMI 版本提出的边界区域评价，特别区分评价区域与预测掩码。",
      "analogy": {
        "title": "放大检查叶片边缘",
        "text": "整张画看着不错，叶缘仍可能溢色。只检查轮廓附近，能看到整图平均分容易掩盖的问题。",
        "componentId": "camo-scene-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "选择评价区域",
          "desc": "切换统计区域，观察哪些误差被纳入评价。画布为概念示意；下方原文图 4 展示实际边界区域，第 5 页公式 8—13 定义计算过程。",
          "componentId": "camo-9",
          "figure": "./images/fig4.png"
        }
      ],
      "insight": "评价区域由真值边界定义，和推理中生成的软掩码用途不同。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "区域来自真值",
          "desc": "BR 仅用于离线评价，不为推理提供答案。"
        },
        {
          "icon": "🔎",
          "title": "自适应宽度",
          "desc": "先用目标面积求 r，再由基础宽度 C 乘 r 定义膨胀宽度。"
        },
        {
          "icon": "⚖️",
          "title": "指标方向不同",
          "desc": "BR-M 越低越好，BR-F 越高越好，比较须保持区域设置一致。"
        }
      ],
      "formula": {
        "lead": "BR-M 只对选定边界区域内的绝对误差求平均，越低越好。",
        "unicode": "BR-M = ∑(|P − G| ⊙ BR) / ∑BR",
        "symbols": [
          {
            "sym": "P",
            "desc": "与真值和 BR 尺寸相同的预测图。"
          },
          {
            "sym": "G",
            "desc": "真值标注，既用于误差比较，也用于定义边界。"
          },
          {
            "sym": "BR",
            "desc": "真值边界膨胀得到的二值区域；分母假设区域非空。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "数据支持什么，结论止于哪里",
      "badge": "both",
      "badgeLabel": "结果",
      "bridge": "最后把机制放回实验：比较完整系统的表现，核对三分支消融，并观察将 MSA 加入前面学过的 ZoomNet 会带来什么变化。",
      "analogy": {
        "title": "完成后再比较作品",
        "text": "既看整幅画，也检查边缘和用料。比较时必须使用同一把尺子。",
        "componentId": "camo-scene-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "在相同设置下比较",
          "desc": "开始比较后，柱条从共同零点增长，表格保留精确数值。实验来自 2024 作者稿的表 1—7。<a href=\"https://mftp.mmcheng.net/Papers/24PAMI-CamoFormer.pdf\" target=\"_blank\" rel=\"noreferrer\">阅读原论文</a> · <a href=\"https://github.com/HVision-NKU/CamoFormer\" target=\"_blank\" rel=\"noreferrer\">作者代码</a>。早期 arXiv:2212.06570 与该作者稿版本不同，本教程采用 2024 版。",
          "componentId": "camo-10"
        }
      ],
      "insight": "实验提升必须与骨干、数据集、指标方向和计算代价一起阅读。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "准确但有成本",
          "desc": "论文报告 71.3 M 参数、47.1 G MACs、单张 3090 上 41.3 FPS，并非最小最快。"
        },
        {
          "icon": "🔎",
          "title": "迁移范围有限",
          "desc": "SINet 与 ZoomNet 仍属于 COD，不能据此宣称医学或视频验证。"
        },
        {
          "icon": "⚖️",
          "title": "读表保留边界",
          "desc": "相对提升不是百分点，论文当年的对比也不是当前排行榜。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV15P4y137jb",
      "title": "ViT论文逐段精读【论文精读】",
      "reason": "跟李沐学AI的视觉Transformer基础讲解。用于补充注意力背景；CamoFormer实际采用PVTv2，结构并不等同于ViT。",
      "views": "53.4万播放"
    }
  ]
};
