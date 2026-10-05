import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "DETRs Beat YOLOs on Real-time Object Detection",
    "titleZh": "RT-DETR：计算效率与查询质量",
    "venue": "CVPR 2024 · 专题三 · 交互式导读",
    "authors": "Yian Zhao · Wenyu Lv · Shangliang Xu · Jinman Wei · Guanzhong Wang · Qingqing Dang · Yi Liu · Jie Chen",
    "affiliation": "百度 · 北京大学",
    "domain": "实时目标检测",
    "coreProblem": "去掉 NMS 之后，怎样让 Transformer 检测器同时做到快和准？",
    "coreInsight": "将尺度内交互与跨尺度融合分开处理，通过训练改善初始查询质量，再按推理预算选择解码深度。实验数值取自作者原文，交互用于解释机制与比较结果。",
    "keywords": [
      "高效混合编码器",
      "查询选择",
      "速度与精度",
      "证据可追溯"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "论文比较的 YOLO 检测器需要 NMS 清理重复框；DETR 虽无需 NMS，其计算成本仍是实现实时检测的障碍。下图用取景过程作类比。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "RT-DETR 用 AIFI 与 CCFF 分别处理尺度内交互和跨尺度融合，通过训练改善初始查询质量，并以推理解码深度调节速度与精度。下图是机制类比。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "实时，究竟在计时什么？",
      "badge": "inf",
      "badgeLabel": "推理与测速",
      "bridge": "理解 RT-DETR，要先问清楚一张图从预测到得到可用检测结果，哪些步骤被算进了时间。传统检测器的重复框处理也有成本。",
      "analogy": {
        "title": "拍完不等于交片",
        "text": "连拍后还要挑掉重复照片，交片才算完成。检测网络输出之后，清除重复框同样需要时间；这个类比不代表 NMS 会理解物体身份。",
        "componentId": "analogy-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "先亲手改变去重强度",
          "desc": "同类别候选先按分数排序，再用已保留的高分框抑制与它重叠过大的候选。拖动阈值，看同一张图上哪些框被保留。这里的几何运算是真实计算，但图像与候选是教学构造，不代表模型预测。",
          "componentId": "nms-lab"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "再看论文真正测了什么",
          "desc": "<a href=\"https://openaccess.thecvf.com/content/CVPR2024/papers/Zhao_DETRs_Beat_YOLOs_on_Real-time_Object_Detection_CVPR_2024_paper.pdf#page=3\" target=\"_blank\" rel=\"noreferrer\">原文第 3 页 Table 1</a> 把精度和后处理成本放在一起。下面只展示原文三个离散配置，不对任意阈值插值，也不将 kernel 耗时写成整套系统耗时。",
          "componentId": "nms-evidence"
        }
      ],
      "insight": "RT-DETR 的端到端预测避免依赖 NMS 去重，但这不意味着所有输入输出、数据传输和部署成本自动消失。比较速度，必须统一计时边界。",
      "formula": {
        "lead": "用两个矩形的重叠程度衡量是否需要去重。这是定义性教学算式，不是论文新增公式。",
        "unicode": "IoU = 交集面积 / 并集面积",
        "symbols": [
          {
            "sym": "交集",
            "desc": "两个框共同覆盖的面积"
          },
          {
            "sym": "并集",
            "desc": "两个框覆盖的总面积，重叠部分只计一次"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "⏱",
          "title": "网络外也有成本",
          "desc": "后处理可能影响检测的实际速度。"
        },
        {
          "icon": "↔",
          "title": "阈值会改变结果",
          "desc": "去重强度与精度需要一起观察。"
        },
        {
          "icon": "◎",
          "title": "统一测速边界",
          "desc": "EfficientNMS kernel 不等于完整插件或系统。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "先看全景，再看细节",
      "badge": "inf",
      "badgeLabel": "特征与计算",
      "bridge": "减少后处理还不够，网络内部也要控制成本。先认识骨干网络输出的三个尺度，才能看懂作者把注意力放在了哪里。",
      "analogy": {
        "title": "一张照片，三种观察尺度",
        "text": "全景帮助辨认关系，细节帮助定位边缘。尺度是特征表示的分辨率，不是三张独立照片；强调高层交互，也不是删去低层细节。",
        "componentId": "analogy-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "切换尺度，数一数 token",
          "desc": "点击右侧特征层，或用按钮选择 S3 / S4 / S5，观察同一尺度对应的取景类比与网格计数。<a href=\"https://openaccess.thecvf.com/content/CVPR2024/papers/Zhao_DETRs_Beat_YOLOs_on_Real-time_Object_Detection_CVPR_2024_paper.pdf#page=5\" target=\"_blank\" rel=\"noreferrer\">原文第 5 页 Eq. (1)</a> 保留三个尺度，只有 S5 进入 AIFI；示例网格尺寸由已核对官方配置的步长计算。",
          "componentId": "scale-lab"
        }
      ],
      "insight": "如果只比较假设中的稠密 self-attention 两两组合数，8,400² / 400² = 441。它只是教学计算，既不是实测加速比，也不是 FLOPs 比，更不能代表 deformable attention 的复杂度。",
      "formula": {
        "lead": "每个空间位置作为一个 token 时，元素数就是网格的行数乘列数。",
        "unicode": "N = H × W",
        "symbols": [
          {
            "sym": "H、W",
            "desc": "特征图的空间高和宽，不是原图尺寸"
          },
          {
            "sym": "N",
            "desc": "展开后的空间 token 数；不直接等于计算耗时"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "▦",
          "title": "多尺度仍然保留",
          "desc": "S3、S4、S5 都参与后续检测。"
        },
        {
          "icon": "◎",
          "title": "高层承担 AIFI",
          "desc": "尺度内注意力集中在 S5。"
        },
        {
          "icon": "≠",
          "title": "元素数不等于耗时",
          "desc": "算术示例不能替代设备上的真实测量。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "把两种交流拆开",
      "badge": "inf",
      "badgeLabel": "编码器消融",
      "bridge": "知道有哪些尺度之后，再问怎样让信息交流更划算。作者逐步比较尺度内交互与跨尺度融合，用消融检验设计选择。",
      "analogy": {
        "title": "把精力放到合适的观察上",
        "text": "反复调整每个细节并不一定更有效。像调整对焦一样，要看这次操作实际带来了什么；论文用实验检查哪些交流值得保留，而不是按结构复杂程度判断好坏。",
        "componentId": "analogy-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "从 A 到 E，每一步真的都更好吗？",
          "desc": "选择一个变体，看它在精度与延迟平面上的位置，并与前一项比较。数据全部来自<a href=\"https://openaccess.thecvf.com/content/CVPR2024/papers/Zhao_DETRs_Beat_YOLOs_on_Real-time_Object_Detection_CVPR_2024_paper.pdf#page=8\" target=\"_blank\" rel=\"noreferrer\">原文第 8 页 Table 3</a>，对应作者的 1× 训练设置；不要与主表完整模型的结果混用。",
          "componentId": "encoder-lab"
        }
      ],
      "insight": "D → D_S5 同时降低延迟并提高 AP；D_S5 → E 则多花 1.4 ms，换来 1.1 AP 点，参数量也发生变化。这组实验比较的是完整设计组合，不能把收益全部归因于某个算子，也不能概括成“每一步都更快、更准”。",
      "takeaways": [
        {
          "icon": "▤",
          "title": "先做受控消融",
          "desc": "在同表实验条件下比较结构改动。"
        },
        {
          "icon": "↔",
          "title": "解耦有实证支持",
          "desc": "尺度内交互与跨尺度融合可以分别设计。"
        },
        {
          "icon": "⚖",
          "title": "最优取决于预算",
          "desc": "AP 最高的变体不一定延迟最低。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "AIFI 与 CCFF 怎样分工？",
      "badge": "both",
      "badgeLabel": "方法结构",
      "bridge": "上一章说明了为何这样设计，这一章把最终编码器拆开：在 S5 内部交流，再让高层和低层信息跨尺度融合。",
      "analogy": {
        "title": "全景关系与局部边缘对齐",
        "text": "把看全景得到的线索对齐到细节上，才能同时知道是什么、在哪里。透明取景片帮助理解信息融合；它不是卷积或注意力的实际计算过程。",
        "componentId": "analogy-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "沿着公式走四步",
          "desc": "每次前进只突出一个阶段，同时保留 S3 / S4 的旁路。结构依据<a href=\"https://openaccess.thecvf.com/content/CVPR2024/papers/Zhao_DETRs_Beat_YOLOs_on_Real-time_Object_Detection_CVPR_2024_paper.pdf#page=5\" target=\"_blank\" rel=\"noreferrer\">原文第 5 页 Eq. (1)、Fig. 4–5</a>；示例形状使用 640 输入与标准 embedding 256。 这里的 256 维指编码器通道投影后的特征，并非原始骨干输出通道；省略 batch 维。",
          "componentId": "hybrid-lab"
        }
      ],
      "insight": "AIFI 是 Attention-based Intra-scale Feature Interaction，CCFF 是 CNN-based Cross-scale Feature Fusion。最终论文使用 CCFF 这个名称；AIFI 只看 S5 不意味着整个检测器只用 S5。",
      "formula": {
        "lead": "将论文公式按执行顺序拆开读。Q、K、V 来自相同特征，等式是论文概括，不展开位置编码与投影等实现。",
        "unicode": "Q = K = V = Flatten(S5)<br>F5 = Reshape(AIFI(Q, K, V))<br>O = CCFF({S3, S4, F5})",
        "symbols": [
          {
            "sym": "S3",
            "desc": "骨干第三阶段特征；低层信息仍进入CCFF。"
          },
          {
            "sym": "S4",
            "desc": "骨干第四阶段特征；仍参与跨尺度融合。"
          },
          {
            "sym": "S5",
            "desc": "骨干第五阶段特征；示例形状采用通道投影到256维后的表示。"
          },
          {
            "sym": "Q",
            "desc": "Query，注意力查询输入。"
          },
          {
            "sym": "K",
            "desc": "Key，注意力键输入。"
          },
          {
            "sym": "V",
            "desc": "Value，注意力值输入。"
          },
          {
            "sym": "F5",
            "desc": "S5经AIFI交互并恢复二维后的特征。"
          },
          {
            "sym": "O",
            "desc": "CCFF跨尺度融合后的输出。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "◎",
          "title": "尺度内用注意力",
          "desc": "AIFI 负责 S5 内部的特征交互。"
        },
        {
          "icon": "↕",
          "title": "跨尺度用卷积",
          "desc": "CCFF 负责不同分辨率之间的融合。"
        },
        {
          "icon": "▦",
          "title": "低层信息没有被丢弃",
          "desc": "S3、S4 通过旁路进入最终融合。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "高分类分数，等于好查询吗？",
      "badge": "both",
      "badgeLabel": "查询质量",
      "bridge": "编码器提供大量特征，解码器只从选中的候选出发。查询选择的关键不只是怎样排序，还在于排序所用的分类分数能否反映定位质量。",
      "analogy": {
        "title": "认得出，还要框得准",
        "text": "认出照片里是鸟，不代表取景框正好贴住鸟。类别与位置是两个问题；好候选需要兼顾二者，不能让一种分数代替另一种质量。",
        "componentId": "analogy-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "移动框，不改分类分数",
          "desc": "拖动预测框，观察几何 IoU 改变，而分类分数保持为教学设定的 0.90。这说明类别判断与框的位置需要分别考察。下方两种训练方案的对照是概念示意；方法依据<a href=\"https://openaccess.thecvf.com/content/CVPR2024/papers/Zhao_DETRs_Beat_YOLOs_on_Real-time_Object_Detection_CVPR_2024_paper.pdf#page=5\" target=\"_blank\" rel=\"noreferrer\">原文第 5 页 Eq. (2)–(3)</a>，实际推理选择见第 7 页 §5.3，作者消融结果见第 8 页 Table 4。",
          "componentId": "query-lab"
        }
      ],
      "insight": "训练时，真实标注使定位质量能够参与监督，从而改善学到的特征与得分。推理时没有真实标注，仍按预测分类分数选择 Top-K = 300 个编码器特征作为内容查询，对应预测框作为初始位置查询。改进来自训练后得分携带的信息，不是部署时再用真实 IoU 排序。",
      "formula": {
        "lead": "论文用分类预测分布与定位预测分布的差异概括不确定性。原文未指定范数类型，也未给出可直接相减的完整张量实现。",
        "unicode": "U(X̂) = ‖P(X̂) − C(X̂)‖",
        "symbols": [
          {
            "sym": "X̂",
            "desc": "待选择的 encoder feature"
          },
          {
            "sym": "P、C",
            "desc": "论文定义的定位预测分布与分类预测分布"
          },
          {
            "sym": "‖ · ‖",
            "desc": "原文未明确类型；本页不擅自解释为 L2、KL 或 JS"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "≠",
          "title": "高分不等于好框",
          "desc": "分类可信与定位准确需要分别理解。"
        },
        {
          "icon": "↗",
          "title": "改进发生在训练",
          "desc": "Table 4 在 1× 设置下报告 0.8 AP 点的提升；教学图不产生实验测量。"
        },
        {
          "icon": "▤",
          "title": "推理仍按分类排序",
          "desc": "Top-300 选择不依赖未知的真实 IoU。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "解码到第几层就够了？",
      "badge": "inf",
      "badgeLabel": "推理 · 深度调节",
      "bridge": "选好初始查询后，解码器还要逐层细化预测。固定同一个训练模型，提前一层输出能节省多少时间，又会付出多大的精度代价？",
      "analogy": {
        "title": "最后一点清晰，也有时间成本",
        "text": "摄影师会反复微调取景，但最后一次调整是否值得，还要看它带来的改善与时间成本。这个类比帮助理解提前结束；具体取舍以论文的验证集统计为准。摄影框仍是教学示意。",
        "componentId": "analogy-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "固定 Det6，调节推理深度",
          "desc": "滑动 1–6 层，查看 Table 5 的 Det6 同一列：固定训练 72 epochs 的六层模型，推理时使用前 k 层并取第 k 层输出。延迟来自作者的 T4 / TensorRT FP16 测量；这里不混入其他训练深度的模型。",
          "componentId": "decoder-lab"
        }
      ],
      "insight": "五层与六层相差 0.1 AP 点和 0.5 ms。这是验证集整体指标，不能保证每张图、每个框都随层数增加而改善，也不能据此保证任意删除中间层仍无需重训。",
      "formula": {
        "lead": "只做原表差值，不把教学框变化解释成实际预测。",
        "unicode": "ΔAP = AP(所选层) − 53.1；节省时间 = 9.3 − t(所选层)",
        "symbols": [
          {
            "sym": "AP",
            "desc": "COCO 平均精度；这里使用训练六层模型对应列。"
          },
          {
            "sym": "t",
            "desc": "Table 5 报告的推理延迟，单位 ms。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🔒",
          "title": "固定同一训练模型",
          "desc": "只比较 Det6 列，改变取到哪一层的输出，不更换训练权重。"
        },
        {
          "icon": "⚖️",
          "title": "省时伴随精度取舍",
          "desc": "五层为 53.0 AP，六层为 53.1 AP，差值应如实保留。"
        },
        {
          "icon": "🎛️",
          "title": "根据部署预算选层",
          "desc": "作者设备的延迟不能直接替代自己硬件的实际测量。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "训练怎样让分数懂得位置？",
      "badge": "trn",
      "badgeLabel": "训练 · 监督边界",
      "bridge": "查询在推理时仍按分类得分排序，为什么训练能改善选中框的质量？逐步检查预测、匹配、损失和更新，尤其注意真值在哪些环节可用。",
      "analogy": {
        "title": "练习时有参考，现场时没有答案",
        "text": "练习构图时可以对照标准框；实际拍摄只能依靠学到的判断。类比用于理解监督，不能把标准框当成推理时可访问的额外输入。",
        "componentId": "analogy-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "从训练监督走到无真值推理",
          "desc": "逐步前进，观察真实标注在哪些训练环节参与监督，以及为什么在推理时消失。图中的框与流程是教学示意，用来解释损失如何作用，不代表实际训练记录。",
          "componentId": "training-lab"
        }
      ],
      "insight": "真实 IoU 在训练与评测中可计算；部署推理只读取预测分类分数来选择查询。所引用的官方代码快照提供实现线索，仍需与论文的概括表达及 2024 年实验环境区分。",
      "formula": {
        "lead": "论文 Eq. (3) 给出总体监督关系；它不是本页可直接运行的训练程序。",
        "unicode": "L(X̂, Ŷ, Y) = L_box(b̂, b) + L_cls(U(X̂), ĉ, c)",
        "symbols": [
          {
            "sym": "X̂",
            "desc": "编码器特征。"
          },
          {
            "sym": "b̂ / b",
            "desc": "预测框与真实框。"
          },
          {
            "sym": "ĉ / c",
            "desc": "预测类别与真实类别。"
          },
          {
            "sym": "U(X̂)",
            "desc": "论文概括的分类与定位分布差异，未指定可直接照搬的完整张量计算。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📐",
          "title": "训练可以用真值",
          "desc": "匹配与质量监督依赖训练标注，部署时不能继续读取。"
        },
        {
          "icon": "🎯",
          "title": "质量通过监督学习",
          "desc": "得分与定位质量的关系来自学习，不是推理时偷看答案。"
        },
        {
          "icon": "📝",
          "title": "区分流程与实验",
          "desc": "流程示意解释监督关系，模型效果则需要约定数据和环境下的实验。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "把整张网络图连起来",
      "badge": "both",
      "badgeLabel": "训练 / 推理 · 整体结构",
      "bridge": "将各项设计放回完整网络：图像特征在哪里保留，查询从哪里初始化，解码器除了查询还接收什么？点击节点追踪职责与信息边界。",
      "analogy": {
        "title": "每个部件都有自己的职责",
        "text": "镜头、取景和对焦协同完成一张照片。网络结构也要看清输入、输出与旁路；这不意味着每个网络部件都对应一种相机硬件。",
        "componentId": "analogy-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点击六个节点，检查输入与输出",
          "desc": "可直接点图，也可用 Tab 和 Enter 操作上方按钮。虚线保留编码器特征通往解码器的连接，避免把网络误读成仅传递查询的一条链。",
          "componentId": "architecture-lab"
        }
      ],
      "insight": "端到端在这里描述目标检测流程；类别与框是单帧输出，没有因此获得跨帧身份或未来轨迹。",
      "takeaways": [
        {
          "icon": "🧩",
          "title": "串起三项改进",
          "desc": "高效编码、可靠初始化与可调解码共同构成实时检测器。"
        },
        {
          "icon": "🔎",
          "title": "区分训练与推理",
          "desc": "辅助监督和真实标注不等于部署时额外可用的输入。"
        },
        {
          "icon": "🖼️",
          "title": "输出检测而非轨迹",
          "desc": "预测类别不是身份编号，框序列也不会自动成为轨迹。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "移到动态场景前，先查边界",
      "badge": "both",
      "badgeLabel": "应用 · 证据边界",
      "bridge": "实时检测与专题三直接相关，但能用在哪里、还缺什么证据，需要分别检查。切换小目标、连续视频与额外预训练三个情境，避免扩大论文结论。",
      "analogy": {
        "title": "放大看，才会发现遗漏",
        "text": "照片整体看着清楚，不代表远处的小主体也拍得好。换到自己的应用前，要检查目标大小、输入类型和数据条件。",
        "componentId": "analogy-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "三种情境，三条不能省略的限制",
          "desc": "把作者已经报告的数字与尚待验证的下游问题分开。相片和帧框是教学示意；动态系统收益没有在本页测量。",
          "componentId": "boundary-lab"
        }
      ],
      "insight": "检测 AP 提升并不能推出跟踪身份更稳定；额外预训练提高 AP 也不能证明仅靠网络结构获得了相同提升。",
      "takeaways": [
        {
          "icon": "🔍",
          "title": "关注小目标限制",
          "desc": "R50 的 APs=34.8，低于 YOLOv8-L 的 35.3。"
        },
        {
          "icon": "🎞️",
          "title": "检测不等于跟踪",
          "desc": "需要额外检验关联、身份保持和轨迹误差。"
        },
        {
          "icon": "🗂️",
          "title": "分开训练数据条件",
          "desc": "Objects365 预训练与仅 COCO 训练分组呈现。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "如何读懂“胜过 YOLO”？",
      "badge": "both",
      "badgeLabel": "证据 · 比较与自测",
      "bridge": "最后回到标题。选择总体 AP、FPS 或小目标 AP，按按钮观察同一组模型在不同指标下的差别，再用三个问题检验自己是否保留了结论边界。",
      "analogy": {
        "title": "同一把尺子，再比较作品",
        "text": "比较作品要先讲清相机设置和评判标准。总体质量、小细节与处理速度的排名可能不同，单一数字不能代表所有能力。",
        "componentId": "analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "让指标说话：启动主表对比",
          "desc": "图表选取 Table 2 中的五个模型：COCO val2017，输入 640×640；速度采用 T4、TensorRT FP16、batch size 1。切换总体 AP、每秒帧数 FPS 与小目标 APs，观察指标改变时的差别；条长动画从零出发，精确数值始终保留在表中。",
          "componentId": "results-lab"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "三个判断，再回到原文",
          "desc": "三道题分别检查训练与推理的信息边界、解码深度的比较方式，以及主表结果能支持哪些结论。点选答案即可看到解释，再回到对应原文核对依据。",
          "componentId": "reading-check"
        }
      ],
      "insight": "“胜过”限定于论文当年的比较对象与协议。测速包含 YOLO 的对应 NMS，排除 I/O 与 MemoryCopy，不能代表完整视频系统。0.2 个 AP 点是作者报告的点差，仅凭表中的单个报告值，不能称为统计显著优势。",
      "formula": {
        "lead": "把 AP 点差与 FPS 比例分开；下面只是表内数值的算术。",
        "unicode": "R50 对比 YOLOv8-L：ΔAP = 53.1 − 52.9 = 0.2 点；FPS 比例 = 108 / 71 − 1 ≈ 52.1%",
        "symbols": [
          {
            "sym": "AP 点差",
            "desc": "两个 AP 数值直接相减，不写成速度百分比。"
          },
          {
            "sym": "FPS 比例",
            "desc": "在作者相应计时协议下计算，不是重新测量。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📋",
          "title": "结论有协议范围",
          "desc": "保留设备、精度、输入、计时边界和比较版本。"
        },
        {
          "icon": "📖",
          "title": "区分数据与演示",
          "desc": "表格记录作者实验结果，交互动画帮助阅读和比较这些结果。"
        },
        {
          "icon": "💭",
          "title": "用反例检查结论",
          "desc": "总体 AP 更高，不等于每个目标尺度、设备和应用场景都更好。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV18u4y1X7Js",
      "title": "RT-DETR 论文简介",
      "reason": "第三方辅助讲解，发布于2023年，早于CVPR正式版。事实以本导读链接的论文原文为准。",
      "views": "搜索快照约1.6万播放（2026-09-30）"
    }
  ]
};
