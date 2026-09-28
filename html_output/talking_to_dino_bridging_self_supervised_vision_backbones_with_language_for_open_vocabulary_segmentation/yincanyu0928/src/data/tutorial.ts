import type { TutorialData } from '../types';
export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Talking to DINO: Bridging Self-Supervised Vision Backbones with Language for Open-Vocabulary Segmentation",
    "titleZh": "Talk2DINO：让视觉地图听懂语言",
    "venue": "ICCV 2025 · DINOv2正式论文版",
    "authors": "Luca Barsellotti、Lorenzo Bianchi、Nicola Messina、Fabio Carrara、Marcella Cornia、Lorenzo Baraldi、Fabrizio Falchi、Rita Cucchiara",
    "affiliation": "摩德纳与雷焦艾米利亚大学 · ISTI-CNR · 比萨大学",
    "domain": "开放词汇分割 · 跨空间映射",
    "coreProblem": "精确的视觉结构，怎样获得语言坐标？",
    "coreInsight": "冻结两端表征，只学习文本到DINOv2的映射，用相关注意力头提供训练对齐目标。",
    "keywords": [
      "文本映射",
      "最佳注意力头",
      "双向InfoNCE",
      "背景清理"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "两张地图有相同坐标长度，地名却指向不同地方。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "先学习标定关系，再把地名送到视觉地图上的位置。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "同一维度，为什么还不能对话",
      "badge": "inf",
      "badgeLabel": "机制与证据",
      "bridge": "DINOv2提供精细视觉结构，却没有天然的语言坐标。问题不仅是让向量长度相等，更要让“同一个方向”表达相同概念。",
      "analogy": {
        "title": "双语地图标定 · 定位",
        "text": "在两张地图之间定位：名称与坐标需要对应，才能把地图上的地点讲清楚。这个生活类比只说明本章的关系，不表示模型实际按二维地图计算。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "旋转两张语义地图",
          "desc": "拖动文本坐标系，观察三个地点的匹配关系与平均余弦。",
          "componentId": "spaces"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "对照两条连接路线",
          "desc": "切换ProxyCLIP与Talk2DINO，跟踪学习对象、推理图像支路和最终比较空间。",
          "componentId": "routes"
        }
      ],
      "insight": "维度兼容是必要条件，语义对齐仍需学习。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "核心概念",
          "desc": "DINOv2提供精细视觉结构，却没有天然的语言坐标。问题不仅是让向量长度相等，更要让“同一个方向”表达相同概念。"
        },
        {
          "icon": "↔",
          "title": "可检验过程",
          "desc": "拖动文本坐标系，观察三个地点的匹配关系与平均余弦。"
        },
        {
          "icon": "✓",
          "title": "条件与边界",
          "desc": "维度兼容是必要条件，语义对齐仍需学习。"
        }
      ],
      "formula": {
        "lead": "形状和语义必须同时对齐。",
        "unicode": "S[h,w,j] = cos(v[h,w], ψ(tⱼ))",
        "symbols": [
          {
            "sym": "v",
            "desc": "DINOv2的局部视觉特征，Dv维"
          },
          {
            "sym": "tⱼ",
            "desc": "类别j的CLIP文本表征，Dt维"
          },
          {
            "sym": "ψ",
            "desc": "将Dt维文本映射到Dv维视觉空间"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "一座小桥：非线性映射",
      "badge": "inf",
      "badgeLabel": "机制与证据",
      "bridge": "学习的是文本到视觉空间的映射ψ。两个仿射变换夹着tanh，既调整坐标，也允许非线性形变。",
      "analogy": {
        "title": "双语地图标定 · 校尺",
        "text": "在两张地图之间校尺：名称与坐标需要对应，才能把地图上的地点讲清楚。这个生活类比只说明本章的关系，不表示模型实际按二维地图计算。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "给接口接上正确形状",
          "desc": "拖放或点选矩阵尺寸，检查Wa、Wb能否与文本向量相乘，并计算参数量。",
          "componentId": "shape"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "扭曲坐标网格",
          "desc": "编辑二维Wa对角值、偏置与Wb旋转角，联动网格形变、tanh曲线和文本输出。",
          "componentId": "warp"
        }
      ],
      "insight": "形变的能力不等于随机参数就有效；真实ψ需要图文训练。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "核心概念",
          "desc": "学习的是文本到视觉空间的映射ψ。两个仿射变换夹着tanh，既调整坐标，也允许非线性形变。"
        },
        {
          "icon": "↔",
          "title": "可检验过程",
          "desc": "拖放或点选矩阵尺寸，检查Wa、Wb能否与文本向量相乘，并计算参数量。"
        },
        {
          "icon": "✓",
          "title": "条件与边界",
          "desc": "形变的能力不等于随机参数就有效；真实ψ需要图文训练。"
        }
      ],
      "formula": {
        "lead": "主文Eq3的两层映射。",
        "unicode": "ψ(t) = Wbᵀ tanh(Waᵀt + ba) + bb",
        "symbols": [
          {
            "sym": "Wa",
            "desc": "Dt×Dv矩阵"
          },
          {
            "sym": "Wb",
            "desc": "Dv×Dv矩阵"
          },
          {
            "sym": "ba, bb",
            "desc": "长度Dv的偏置"
          },
          {
            "sym": "tanh",
            "desc": "逐元素非线性，输出范围−1到1"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "注意力头：从哪里取图像语义",
      "badge": "trn",
      "badgeLabel": "训练机制",
      "bridge": "一张描述可能只提及图像局部。用DINOv2不同head的CLS→patch注意力，把空间特征汇成多个候选视觉描述。",
      "analogy": {
        "title": "双语地图标定 · 选景",
        "text": "在两张地图之间选景：名称与坐标需要对应，才能把地图上的地点讲清楚。这个生活类比只说明本章的关系，不表示模型实际按二维地图计算。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "刷出一张注意力图",
          "desc": "在3×3格子上点选并增减logit，联动空间softmax和二维加权均值。",
          "componentId": "pool"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "一句话选择哪一个头",
          "desc": "切换文本方向，查看三个head的区域图、池化向量和余弦，比较max与平均。",
          "componentId": "heads"
        },
        {
          "kind": "module",
          "id": "3.3",
          "title": "注意力怎样汇成一个向量",
          "desc": "播放加权汇聚过程，比较不同head的空间贡献。",
          "componentId": "flow"
        },
        {
          "kind": "module",
          "id": "3.4",
          "title": "最佳head何时会切换",
          "desc": "改变文本方向，观察相似度曲线和选择边界。",
          "componentId": "phase"
        }
      ],
      "insight": "训练选一个head的池化向量，不是给每个像素挑最高attention。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "核心概念",
          "desc": "一张描述可能只提及图像局部。用DINOv2不同head的CLS→patch注意力，把空间特征汇成多个候选视觉描述。"
        },
        {
          "icon": "↔",
          "title": "可检验过程",
          "desc": "在3×3格子上点选并增减logit，联动空间softmax和二维加权均值。"
        },
        {
          "icon": "✓",
          "title": "条件与边界",
          "desc": "训练选一个head的池化向量，不是给每个像素挑最高attention。"
        }
      ],
      "formula": {
        "lead": "空间聚合之后，按配对文本选择最相似的head。",
        "unicode": "vAᵢ = Σₕ,𝓌 softmax(Aᵢ)[h,w] · v[h,w]",
        "symbols": [
          {
            "sym": "Aᵢ",
            "desc": "第i个head的CLS到patch注意力图"
          },
          {
            "sym": "softmax",
            "desc": "沿空间维度归一化，不沿类别维度"
          },
          {
            "sym": "vAᵢ",
            "desc": "一个Dv维池化向量"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "双向InfoNCE：正确配对胜过谁",
      "badge": "trn",
      "badgeLabel": "训练机制",
      "bridge": "选好每张图的视觉向量后，批次中的图和文本构成相似度矩阵。两个方向分别要求正确图片和正确文字更容易被找回。",
      "analogy": {
        "title": "双语地图标定 · 配签",
        "text": "在两张地图之间配签：名称与坐标需要对应，才能把地图上的地点讲清楚。这个生活类比只说明本章的关系，不表示模型实际按二维地图计算。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "编辑一张批次得分矩阵",
          "desc": "改3×3余弦得分，查看行、列softmax与双向平均损失；切换均匀或对角占优。",
          "componentId": "nce"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "负样本也可能说同一件事",
          "desc": "交换三张文字卡，观察标注配对和语义配对冲突；切换重复描述。",
          "componentId": "negatives"
        }
      ],
      "insight": "低损失只说明更符合当前配对，错误配对也可能被优化。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "核心概念",
          "desc": "选好每张图的视觉向量后，批次中的图和文本构成相似度矩阵。两个方向分别要求正确图片和正确文字更容易被找回。"
        },
        {
          "icon": "↔",
          "title": "可检验过程",
          "desc": "改3×3余弦得分，查看行、列softmax与双向平均损失；切换均匀或对角占优。"
        },
        {
          "icon": "✓",
          "title": "条件与边界",
          "desc": "低损失只说明更符合当前配对，错误配对也可能被优化。"
        }
      ],
      "formula": {
        "lead": "按原文的双向平均，不额外添加温度项。",
        "unicode": "L = −(Σᵢ log P行,ii + Σᵢ log P列,ii) / (2B)",
        "symbols": [
          {
            "sym": "B",
            "desc": "图文对的批量大小"
          },
          {
            "sym": "P行",
            "desc": "固定图像，沿文字候选softmax"
          },
          {
            "sym": "P列",
            "desc": "固定文字，沿图片候选softmax"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "冻结骨干，怎样仍然学习",
      "badge": "trn",
      "badgeLabel": "训练机制",
      "bridge": "冻结并不禁止整条计算链。梯度只更新ψ，视觉和文本编码器继续提供固定特征；不能把“骨干冻结”读成“整个方法无需训练”。",
      "analogy": {
        "title": "双语地图标定 · 调准",
        "text": "在两张地图之间调准：名称与坐标需要对应，才能把地图上的地点讲清楚。这个生活类比只说明本章的关系，不表示模型实际按二维地图计算。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "亲手执行一次参数更新",
          "desc": "执行前向、估计导数、更新一小步，观察标量映射角度与损失曲线；支持回退。",
          "componentId": "train"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "特征缓存与训练账本",
          "desc": "改变教学图片数、epoch、batch，比较缓存与逐轮编码次数，区分训练步和图像编码。",
          "componentId": "cache"
        },
        {
          "kind": "module",
          "id": "5.3",
          "title": "在损失曲线上走四十步",
          "desc": "比较不同教学步长的优化轨迹。",
          "componentId": "landscape"
        }
      ],
      "insight": "只有映射可训练仍然需要数据、损失和优化；真实论文用Adam。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "核心概念",
          "desc": "冻结并不禁止整条计算链。梯度只更新ψ，视觉和文本编码器继续提供固定特征；不能把“骨干冻结”读成“整个方法无需训练”。"
        },
        {
          "icon": "↔",
          "title": "可检验过程",
          "desc": "执行前向、估计导数、更新一小步，观察标量映射角度与损失曲线；支持回退。"
        },
        {
          "icon": "✓",
          "title": "条件与边界",
          "desc": "只有映射可训练仍然需要数据、损失和优化；真实论文用Adam。"
        }
      ],
      "formula": {
        "lead": "训练示意的更新；论文实际使用Adam。",
        "unicode": "θ下一步 = θ − η · ∂L/∂θ",
        "symbols": [
          {
            "sym": "θ",
            "desc": "示例的唯一可学习旋转参数"
          },
          {
            "sym": "η",
            "desc": "示例SGD学习率，不是论文学习率"
          },
          {
            "sym": "∂L/∂θ",
            "desc": "中心差分估计，演示而非训练日志"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "推理：把类别送进DINOv2",
      "badge": "inf",
      "badgeLabel": "机制与证据",
      "bridge": "推理阶段，任意候选类别通过文本编码与ψ进入视觉空间，逐patch计算余弦。分数上采样与argmax的顺序会影响边界。",
      "analogy": {
        "title": "双语地图标定 · 铺图",
        "text": "在两张地图之间铺图：名称与坐标需要对应，才能把地图上的地点讲清楚。这个生活类比只说明本章的关系，不表示模型实际按二维地图计算。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "逐patch选词与背景空缺",
          "desc": "选择候选词表与patch，观察得分条与整幅类别图；删去正确类观察被迫归类。",
          "componentId": "classify"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "先插值分数，还是先定类别",
          "desc": "编辑两个端点的两类得分，对照分数插值后argmax与硬标签最近邻扩展。",
          "componentId": "upsample"
        }
      ],
      "insight": "稠密图与类别分数是不同对象；类别ID不能像连续分数一样混合。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "核心概念",
          "desc": "推理阶段，任意候选类别通过文本编码与ψ进入视觉空间，逐patch计算余弦。分数上采样与argmax的顺序会影响边界。"
        },
        {
          "icon": "↔",
          "title": "可检验过程",
          "desc": "选择候选词表与patch，观察得分条与整幅类别图；删去正确类观察被迫归类。"
        },
        {
          "icon": "✓",
          "title": "条件与边界",
          "desc": "稠密图与类别分数是不同对象；类别ID不能像连续分数一样混合。"
        }
      ],
      "formula": {
        "lead": "恢复分数分辨率，再决定类别。",
        "unicode": "M[h,w] = argmaxⱼ Ŝ(I,Tⱼ)[h,w]",
        "symbols": [
          {
            "sym": "Ŝ",
            "desc": "上采样到图像尺寸的类别相似度"
          },
          {
            "sym": "j",
            "desc": "候选类别索引"
          },
          {
            "sym": "M",
            "desc": "离散类别图，不是连续特征"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "背景清理：类与注意力头再次相遇",
      "badge": "inf",
      "badgeLabel": "机制与证据",
      "bridge": "每个类别对多个head有不同相关性。先在head之间分配权重生成该类的清理图，再与原始相似度混合。",
      "analogy": {
        "title": "双语地图标定 · 去雾",
        "text": "在两张地图之间去雾：名称与坐标需要对应，才能把地图上的地点讲清楚。这个生活类比只说明本章的关系，不表示模型实际按二维地图计算。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "两个softmax，沿哪个轴",
          "desc": "编辑类×head相关矩阵，查看行softmax及三张head图的加权和，再观察空间归一化。",
          "componentId": "cleanheads"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "混合权重与背景阈值",
          "desc": "调整λ、阈值，联动S/F/混合分数、前景掩码和已知真值的IoU。",
          "componentId": "background"
        },
        {
          "kind": "module",
          "id": "7.3",
          "title": "把分割阈值变成可涂画布",
          "desc": "修改标注、扫描阈值，查看掩码、错误位置和逐类IoU。",
          "componentId": "masklab"
        }
      ],
      "insight": "清理不是PAMR；论文仅在VOC与COCO Objects启用该策略。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "核心概念",
          "desc": "每个类别对多个head有不同相关性。先在head之间分配权重生成该类的清理图，再与原始相似度混合。"
        },
        {
          "icon": "↔",
          "title": "可检验过程",
          "desc": "编辑类×head相关矩阵，查看行softmax及三张head图的加权和，再观察空间归一化。"
        },
        {
          "icon": "✓",
          "title": "条件与边界",
          "desc": "清理不是PAMR；论文仅在VOC与COCO Objects启用该策略。"
        }
      ],
      "formula": {
        "lead": "清理图归一化后，进行凸组合。",
        "unicode": "S̄ⱼ = λSⱼ + (1−λ)Fⱼ",
        "symbols": [
          {
            "sym": "λ",
            "desc": "原始相似度权重，默认5/6"
          },
          {
            "sym": "Fⱼ",
            "desc": "类别j的head加权、空间softmax、重标定图"
          },
          {
            "sym": "背景",
            "desc": "所有类别的S̄均小于阈值0.55"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "完整路径与后处理边界",
      "badge": "both",
      "badgeLabel": "机制与证据",
      "bridge": "拼成一张结构图时，要分清训练选head、推理逐patch分类、背景清理和可选PAMR各自的职责。",
      "analogy": {
        "title": "双语地图标定 · 连图",
        "text": "在两张地图之间连图：名称与坐标需要对应，才能把地图上的地点讲清楚。这个生活类比只说明本章的关系，不表示模型实际按二维地图计算。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "逐节点检查训练与推理",
          "desc": "点击节点并切换训练/推理，显示依赖路径、输入输出形状和可训练参数。",
          "componentId": "network"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "边缘感知平滑能做什么",
          "desc": "逐次运行一维分数平滑，切换忽略/尊重颜色边缘，比较边界与噪声。",
          "componentId": "refine"
        }
      ],
      "insight": "后处理可以减少局部噪声，也可能抹平边界；不能冒称它修复了语义识别。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "核心概念",
          "desc": "拼成一张结构图时，要分清训练选head、推理逐patch分类、背景清理和可选PAMR各自的职责。"
        },
        {
          "icon": "↔",
          "title": "可检验过程",
          "desc": "点击节点并切换训练/推理，显示依赖路径、输入输出形状和可训练参数。"
        },
        {
          "icon": "✓",
          "title": "条件与边界",
          "desc": "后处理可以减少局部噪声，也可能抹平边界；不能冒称它修复了语义识别。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "消融：贡献来自哪个选择",
      "badge": "both",
      "badgeLabel": "机制与证据",
      "bridge": "图解只能说明运算，实验才检验设计。比较映射方向、head选择、register与背景清理时，要保持相同表格条件。",
      "analogy": {
        "title": "双语地图标定 · 对证",
        "text": "在两张地图之间对证：名称与坐标需要对应，才能把地图上的地点讲清楚。这个生活类比只说明本章的关系，不表示模型实际按二维地图计算。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "映射、选头与register对照",
          "desc": "选择Table2/3真实变体并切换数据集，查看条形与差值，主动寻找反例。",
          "componentId": "ablation"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "背景清理×PAMR四格实验",
          "desc": "选择四个已报告组合，联动V21/Object得分、两个主效应与差分中的差分。",
          "componentId": "factorial"
        }
      ],
      "insight": "改善可能依赖数据集和后处理；不要用一个均值替代全部条件。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "核心概念",
          "desc": "图解只能说明运算，实验才检验设计。比较映射方向、head选择、register与背景清理时，要保持相同表格条件。"
        },
        {
          "icon": "↔",
          "title": "可检验过程",
          "desc": "选择Table2/3真实变体并切换数据集，查看条形与差值，主动寻找反例。"
        },
        {
          "icon": "✓",
          "title": "条件与边界",
          "desc": "改善可能依赖数据集和后处理；不要用一个均值替代全部条件。"
        }
      ],
      "formula": {
        "lead": "计算表格中的条件化差值，不夸大统计结论。",
        "unicode": "交互差值 = (清理增益 | 有PAMR) − (清理增益 | 无PAMR)",
        "symbols": [
          {
            "sym": "清理增益",
            "desc": "相同PAMR设置下，有清理减无清理"
          },
          {
            "sym": "交互差值",
            "desc": "表格算术差分；不代表显著性检验结果"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、版本与复现的下一步",
      "badge": "both",
      "badgeLabel": "机制与证据",
      "bridge": "主表八集平均与补充五集平均不是同一指标。最终结论需要同时说清视觉主干规模、后处理、背景设置和评测分辨率。",
      "analogy": {
        "title": "双语地图标定 · 验图",
        "text": "在两张地图之间验图：名称与坐标需要对应，才能把地图上的地点讲清楚。这个生活类比只说明本章的关系，不表示模型实际按二维地图计算。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "按协议探索报告结果",
          "desc": "切换Base/Large、有无PAMR、主表/补充，联动真实八列或五列；显示均值与反例。",
          "componentId": "results"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "把理解变成可检验的判断",
          "desc": "六个机制与实验挑战，提交后显示证据和纠错；并列展示未执行的复现任务清单。",
          "componentId": "quiz"
        },
        {
          "kind": "module",
          "id": "10.3",
          "title": "沿同一数据集配对看收益",
          "desc": "哑铃图比较PAMR前后结果，讨论差值与归因边界。",
          "componentId": "paired"
        }
      ],
      "insight": "教程完成不代表Jittor复现获批或已训练；本篇固定ICCV2025 DINOv2版。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "核心概念",
          "desc": "主表八集平均与补充五集平均不是同一指标。最终结论需要同时说清视觉主干规模、后处理、背景设置和评测分辨率。"
        },
        {
          "icon": "↔",
          "title": "可检验过程",
          "desc": "切换Base/Large、有无PAMR、主表/补充，联动真实八列或五列；显示均值与反例。"
        },
        {
          "icon": "✓",
          "title": "条件与边界",
          "desc": "教程完成不代表Jittor复现获批或已训练；本篇固定ICCV2025 DINOv2版。"
        }
      ]
    }
  ]
};
