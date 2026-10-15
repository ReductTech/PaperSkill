import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Dark-ISP: Enhancing RAW Image Processing for Low-Light Object Detection",
    "titleZh": "Dark-ISP：让低照度 RAW 图像更利于目标检测",
    "venue": "ICCV 2025 · pp. 9583–9593",
    "authors": "Jiasheng Guo · Xin Gao · Yuxiang Yan · Guanghao Li · Jian Pu",
    "affiliation": "复旦大学类脑智能科学与技术研究院",
    "domain": "计算机视觉 / 低照度目标检测 / 可微 ISP",
    "coreProblem": "暗光中的 RGB 图像可能丢失传感器信息；复杂 RAW 处理流程又不利于轻量部署。",
    "coreInsight": "让 Bayer RAW 依次经过可微的动态线性校准与多项式色调映射，并以检测损失和 Self-Boost 协同训练。",
    "keywords": [
      "Bayer RAW",
      "局部与全局注意力",
      "多项式色调映射",
      "Self-Boost"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "固定或先量化的 ISP 处理可能压缩暗部细节，检测器难以找到目标。",
      "componentId": "dark-widget"
    },
    "newMethod": {
      "desc": "Dark-ISP 在保留 Bayer RAW 输入的前提下，联合学习线性与非线性处理来服务检测。",
      "componentId": "dark-widget"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "为什么黑夜里会漏检？",
      "badge": "inf",
      "badgeLabel": "问题",
      "bridge": "论文引言与图 1：传统 RGB 流程面向观感，低照度噪声和信息压缩会让目标检测更难。先从同一幅暗光场景感受问题。",
      "analogy": {
        "title": "夜间寻物 · 看不清轮廓",
        "text": "手电照向远处的猫，光太弱时轮廓与背景混在一起。场景是教学示意，不是数据集图片。",
        "componentId": "dark-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "光线和噪声",
          "desc": "调节暗度，再切换“传统处理 / Dark-ISP 示意”。可视变化只用于解释机制，绝非模型预测分数。",
          "componentId": "dark-widget"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "同一起点的对照",
          "desc": "在同一暗光条件下比较固定 RGB 流程与 Bayer RAW 任务驱动处理，辨认信息瓶颈。",
          "componentId": "dark-widget"
        }
      ],
      "insight": "论文不是单纯追求“更亮”，而是让处理结果对检测器更有用。",
      "takeaways": [
        {
          "icon": "🌙",
          "title": "场景",
          "desc": "暗光会降低对比度并放大噪声。"
        },
        {
          "icon": "📷",
          "title": "输入差异",
          "desc": "Bayer RAW 保留尚未经过传统 ISP 的传感器信息。"
        },
        {
          "icon": "🎯",
          "title": "任务目标",
          "desc": "好看不等于检测准确。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "RAW 不是普通 RGB",
      "badge": "inf",
      "badgeLabel": "输入",
      "bridge": "论文 §3.1 以四通道 Bayer RAW 为输入。理解它的通道和相机参数，才能看懂后面的 3×4 映射。",
      "analogy": {
        "title": "夜间寻物 · 换滤镜",
        "text": "手电前的滤镜改变颜色线索；同一只猫仍在原处。",
        "componentId": "dark-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "四通道图鉴",
          "desc": "切换 R、Gᵣ、B、Gᵦ，查看 Bayer 四个通道及双绿采样的意义。",
          "componentId": "dark-widget"
        }
      ],
      "insight": "四通道 Bayer RAW 与三通道 RGB 不应被当成同一格式；论文还区分高位深 Bayer RAW 与量化 RAW-RGB。",
      "formula": {
        "lead": "论文式 (2)：Binning 把四个通道变为三个。",
        "unicode": "[R, G, B]ᵀ = B · [r′, gᵣ′, b′, gᵦ′]ᵀ",
        "symbols": [
          {
            "sym": "B",
            "desc": "3×4 稀疏合并矩阵"
          },
          {
            "sym": "G",
            "desc": "两路绿色通道的平均结果"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🔴",
          "title": "四个通道",
          "desc": "输入是 R、Gᵣ、B、Gᵦ。"
        },
        {
          "icon": "🟢",
          "title": "双绿通道",
          "desc": "Binning 将两个绿色通道平均。"
        },
        {
          "icon": "⚠️",
          "title": "格式边界",
          "desc": "实验中的 Bayer RAW 和 RAW-RGB 不能混称。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "把传统 ISP 折成一个矩阵",
      "badge": "both",
      "badgeLabel": "线性",
      "bridge": "论文 §3.1 式 (1)–(4)：白平衡、双绿合并、颜色空间变换可以复合为一个线性映射。",
      "analogy": {
        "title": "夜间寻物 · 校正颜色",
        "text": "手电照着同一目标，色片逐步校正偏色。",
        "componentId": "dark-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "线性映射三步",
          "desc": "逐步切换 W（白平衡）、B（Binning）、C（颜色变换），观察 4 通道到 3 通道的映射。",
          "componentId": "dark-widget"
        }
      ],
      "insight": "这三步的复合是线性部分的物理先验，而不是任意堆叠的黑箱卷积。",
      "formula": {
        "lead": "论文式 (4)：矩阵可合并。",
        "unicode": "I′ = C · B · W · I = P · I",
        "symbols": [
          {
            "sym": "I",
            "desc": "4×H×W 的 Bayer RAW"
          },
          {
            "sym": "P",
            "desc": "3×4 的基础相机映射"
          },
          {
            "sym": "I′",
            "desc": "3×H×W 的线性校正图像"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "⚖️",
          "title": "W",
          "desc": "按通道增益补偿照明颜色。"
        },
        {
          "icon": "🟢",
          "title": "B",
          "desc": "把 Bayer 四通道合为 RGB。"
        },
        {
          "icon": "🎨",
          "title": "C",
          "desc": "3×3 颜色校正完成线性转换。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "固定矩阵为何不够？",
      "badge": "both",
      "badgeLabel": "自适应",
      "bridge": "论文 §3.1 式 (5)–(6)：局部与全局注意力从图像内容推断修正项，让线性处理随像素与场景变化。",
      "analogy": {
        "title": "夜间寻物 · 调整光束",
        "text": "手电光束移向目标，暗角与整体环境需要不同的修正。",
        "componentId": "dark-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "局部 / 全局 / 基础",
          "desc": "点击三种贡献，观察局部映射、全局映射和基础矩阵如何相加；选中项与输出同步高亮。",
          "componentId": "dark-widget"
        }
      ],
      "insight": "局部 Pₗ 有空间位置，Pᵍ 面向整幅图像；两者和基础 P 共同得到 P′。",
      "formula": {
        "lead": "论文式 (6)：动态修正不会丢掉基础映射。",
        "unicode": "P′ = Pₗ + Pᵍ + P；I′ = P′ · I",
        "symbols": [
          {
            "sym": "Pₗ",
            "desc": "逐像素 3×4 映射"
          },
          {
            "sym": "Pᵍ",
            "desc": "广播到全图的 3×4 映射"
          },
          {
            "sym": "P′",
            "desc": "内容自适应映射"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📍",
          "title": "局部",
          "desc": "捕捉像素级内容差异。"
        },
        {
          "icon": "🌐",
          "title": "全局",
          "desc": "提供整幅图像的上下文。"
        },
        {
          "icon": "➕",
          "title": "残差",
          "desc": "保留基础相机矩阵。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "怎样把暗部拉出来？",
      "badge": "both",
      "badgeLabel": "色调",
      "bridge": "论文 §3.2、图 3：非线性部分不直接拟合任意曲线，而是逐像素组合带低照度先验的多项式基。",
      "analogy": {
        "title": "夜间寻物 · 调亮影子",
        "text": "手电照向暗处，使猫的轮廓变明显，同时避免灯下区域过曝。",
        "componentId": "dark-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "色调曲线实验台",
          "desc": "拖动曲率控制，查看暗部拉伸、亮部压缩。曲线为教学示意，不是论文精确学习到的曲线。",
          "componentId": "dark-widget"
        }
      ],
      "insight": "实验采用最高 8 阶基函数；逐像素系数由 3×3 卷积预测，且论文使用跳连缓解梯度消失。",
      "formula": {
        "lead": "论文式 (7)：由位置相关的系数混合基函数。",
        "unicode": "𝓕(xᵢⱼ) = Σₖ₌₀ⁿ Cₖ(i,j) fₖ(xᵢⱼ)",
        "symbols": [
          {
            "sym": "Cₖ(i,j)",
            "desc": "像素位置 (i,j) 的第 k 个系数"
          },
          {
            "sym": "fₖ",
            "desc": "预定义多项式基"
          },
          {
            "sym": "n",
            "desc": "实验中取 8"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📈",
          "title": "曲线目的",
          "desc": "暗部细节与亮部保留要兼顾。"
        },
        {
          "icon": "🧮",
          "title": "基函数",
          "desc": "有限阶多项式限制映射空间。"
        },
        {
          "icon": "🧩",
          "title": "逐像素",
          "desc": "不同位置可有不同组合系数。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "Self-Boost：让前后级互相借力",
      "badge": "trn",
      "badgeLabel": "协同",
      "bridge": "论文 §3.3：非线性输出 U 被当作伪目标，近似指导线性映射；它不是“正常光真值”，也不是严格闭式最优解。",
      "analogy": {
        "title": "夜间寻物 · 对准光束",
        "text": "手电缓缓对准已显出的轮廓，偏离方向越大越难看清。",
        "componentId": "dark-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "方向而非强制相等",
          "desc": "拖动线性映射向量的方向，观察它与伪目标向量的夹角和余弦距离。数值为示意几何。",
          "componentId": "dark-widget"
        }
      ],
      "insight": "论文采用逐行余弦距离，因为伪目标只是近似且两个矩阵会持续更新；预热若干 epoch 后再启用约束。",
      "formula": {
        "lead": "论文式 (11)–(12)：方向约束与检测损失相加。",
        "unicode": "L = Ldet + λLsb；Lsb = Σᵢ[1 − cos(p′ᵢ, p̃ᵢ)]",
        "symbols": [
          {
            "sym": "λ",
            "desc": "实验统一取 0.01"
          },
          {
            "sym": "p′ᵢ",
            "desc": "动态线性映射第 i 行"
          },
          {
            "sym": "p̃ᵢ",
            "desc": "由伪目标估计的近似矩阵第 i 行"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "伪目标",
          "desc": "来自非线性输出 U，不是配对真值。"
        },
        {
          "icon": "📐",
          "title": "方向一致",
          "desc": "用余弦距离，而非强制矩阵相等。"
        },
        {
          "icon": "⏳",
          "title": "延迟启用",
          "desc": "避免训练过早收敛。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "训练目标与可复现实验",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "论文 §4：RetinaNet + ImageNet 预训练 ResNet，SGD 训练 15 个 epoch，图像统一缩放到 400×600。",
      "analogy": {
        "title": "夜间寻物 · 做一次记录",
        "text": "手电照到目标后，记录是否更容易辨认，下一次再微调。",
        "componentId": "dark-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "训练条件检查",
          "desc": "切换检测损失、预热、自增强三阶段，区分训练时存在的约束与推理时保留的 ISP 组件。",
          "componentId": "dark-widget"
        }
      ],
      "insight": "LOD 使用 VOC-style mAP；NOD 和 SynCOCO 使用 COCO-style mAP。不同协议数值不可直接相减。",
      "takeaways": [
        {
          "icon": "🧪",
          "title": "检测器",
          "desc": "实验使用 RetinaNet/ResNet，而非上一作业的 YOLOv3。"
        },
        {
          "icon": "⏱️",
          "title": "训练",
          "desc": "SGD，初始学习率 0.001，15 个 epoch。"
        },
        {
          "icon": "📏",
          "title": "指标",
          "desc": "跨 VOC/COCO 协议不直接比较绝对值。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "打开 Dark-ISP 的结构图",
      "badge": "trn",
      "badgeLabel": "架构",
      "bridge": "论文图 2：四通道 Bayer RAW 经动态线性映射，再经逐像素多项式色调映射进入检测器。Self-Boost 只在训练期约束前级。",
      "analogy": {
        "title": "夜间寻物 · 查看工具",
        "text": "手电保持照向同一目标，观察滤镜、光束与目标之间的关系。",
        "componentId": "dark-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点击结构节点",
          "desc": "点击 Bayer RAW、局部/全局映射、非线性、检测器或 Self-Boost，查看所选节点与相关路径。",
          "componentId": "dark-widget"
        }
      ],
      "insight": "推理主路径是 RAW → 线性 ISP → 非线性 ISP → 检测器；Self-Boost 是训练正则，不是推理时新增的一次图像处理。",
      "takeaways": [
        {
          "icon": "🧱",
          "title": "线性",
          "desc": "3×4 动态映射连接 RAW 与 RGB。"
        },
        {
          "icon": "〰️",
          "title": "非线性",
          "desc": "像素级曲线调整色调。"
        },
        {
          "icon": "🔒",
          "title": "边界",
          "desc": "Self-Boost 在训练时计算。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "消融：每一块真的有用吗？",
      "badge": "both",
      "badgeLabel": "证据",
      "bridge": "论文表 4–5 都在 LOD 上做消融。单独的线性、非线性与组合、再加 Self-Boost 有不同贡献。",
      "analogy": {
        "title": "夜间寻物 · 比较设置",
        "text": "在同一暗处，依次比较单一工具和组合工具能否照出轮廓。",
        "componentId": "dark-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "模块消融对比",
          "desc": "切换四种模块组合，对照 66.6 → 67.1 → 68.7 → 70.4 的 LOD mAP；这是论文结果，不是实时实验。",
          "componentId": "dark-widget"
        }
      ],
      "insight": "表 5 中本法 70.4 mAP，高于 Gamma† 68.0、LUT 67.8、Zero-DCE 68.0；比较限于该表设定。",
      "takeaways": [
        {
          "icon": "🔬",
          "title": "独立贡献",
          "desc": "仅线性 66.6；仅非线性 67.1。"
        },
        {
          "icon": "➕",
          "title": "组合增益",
          "desc": "两者结合达到 68.7。"
        },
        {
          "icon": "🚀",
          "title": "自增强",
          "desc": "再加入 Self-Boost 达 70.4。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、适用边界与我的问题",
      "badge": "both",
      "badgeLabel": "结论",
      "bridge": "论文表 1–3 在真实 LOD/NOD 与合成 SynCOCO 报告结果。以下按数据集分别展示，避免混用指标协议。",
      "analogy": {
        "title": "夜间寻物 · 找到目标",
        "text": "手电最后照出猫的轮廓；同一起点的几种方法可在同一指标上比较。",
        "componentId": "dark-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "同协议结果赛",
          "desc": "选择 LOD、NOD Sony、NOD Nikon 或 SynCOCO，再启动同一数据集内的 mAP 对照。",
          "componentId": "dark-widget"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "适用性与质疑",
          "desc": "切换 RAW 可用性、跨相机、能耗、伪目标偏差等场景，判断论文证据支持到哪里。",
          "componentId": "dark-widget"
        }
      ],
      "insight": "我的判断：论文证明的是特定数据集/检测器配置下的效果；未在主文验证任意相机、极端光照、分割追踪或真实设备能耗。",
      "takeaways": [
        {
          "icon": "🏆",
          "title": "LOD",
          "desc": "ResNet-50：70.4 VOC-style mAP。"
        },
        {
          "icon": "📷",
          "title": "NOD",
          "desc": "Sony 31.5、Nikon 29.9 COCO-style mAP。"
        },
        {
          "icon": "❓",
          "title": "下一步",
          "desc": "测跨相机零样本、伪目标偏差与端侧代价。"
        }
      ]
    }
  ]
};
