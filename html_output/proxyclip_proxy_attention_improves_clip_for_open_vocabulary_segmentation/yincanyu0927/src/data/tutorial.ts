import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "ProxyCLIP: Proxy Attention Improves CLIP for Open-Vocabulary Segmentation",
    "titleZh": "ProxyCLIP：借来空间关系，保留语义能力",
    "venue": "ECCV 2024 · 正式论文",
    "authors": "Mengcheng Lan、Chaofeng Chen、Yiping Ke、Xinjiang Wang、Litong Feng、Wayne Zhang",
    "affiliation": "南洋理工大学 · 商汤研究院 · 广东省数字电网技术重点实验室",
    "domain": "开放词汇语义分割 · 无需额外训练",
    "coreProblem": "认识物体，为什么仍画不准边界？",
    "coreInsight": "用视觉基础模型决定“向谁借信息”，用 CLIP 决定“借到什么语义”。",
    "keywords": [
      "代理注意力",
      "自适应mask",
      "密集图文对齐",
      "证据与成本"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "有了颜色，却缺少可靠轮廓：局部语义会混入无关区域。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "借助纹理轮廓安排颜色：代理关系聚合 CLIP 语义。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "从框到像素：定位还缺什么",
      "badge": "inf",
      "badgeLabel": "推理与机制",
      "bridge": "一幅拼贴画中，画出物体外框仍然会混入周围背景。开放词汇语义分割需要给每个位置赋予类别，而不是只回答图中有什么。",
      "analogy": {
        "title": "拼贴画修复 · 描边",
        "text": "修复者用一个工具描边画片。画片的颜色好比语义，轮廓好比空间组织；这个类比只帮助理解分工，不能证明模型性能。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "修复一块像素画",
          "desc": "在8×6格拼贴画上涂画前景，比较外接框与逐格标注。",
          "componentId": "paint"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "同一幅画，两种平均",
          "desc": "修改一个三类像素预测，观察混淆矩阵、像素准确率与mIoU如何分离。",
          "componentId": "metric"
        }
      ],
      "insight": "语义分割按类别合并像素；它不负责区分同类别的不同实例。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "本章问题",
          "desc": "从框到像素：定位还缺什么"
        },
        {
          "icon": "↔",
          "title": "可观察的机制",
          "desc": "在8×6格拼贴画上涂画前景，比较外接框与逐格标注。"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "语义分割按类别合并像素；它不负责区分同类别的不同实例。"
        }
      ],
      "formula": {
        "lead": "按类别比较交集与并集，避免大面积背景掩盖少数类错误。",
        "unicode": "IoUₖ = TPₖ / (TPₖ + FPₖ + FNₖ)",
        "symbols": [
          {
            "sym": "TPₖ",
            "desc": "类别k的正确像素数"
          },
          {
            "sym": "FPₖ",
            "desc": "错误预测为k的像素数"
          },
          {
            "sym": "FNₖ",
            "desc": "实际为k但漏掉的像素数"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "语义方向：名字怎样成为坐标",
      "badge": "inf",
      "badgeLabel": "推理与机制",
      "bridge": "CLIP 让图像和文本可在共享空间比较。但“方向相似”既不是分割边界，也不是经过校准的概率。",
      "analogy": {
        "title": "拼贴画修复 · 调色",
        "text": "修复者用一个工具调色画片。画片的颜色好比语义，轮廓好比空间组织；这个类比只帮助理解分工，不能证明模型性能。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "拖动二维语义向量",
          "desc": "旋转图像方向，比较三个固定文本方向的余弦及argmax。",
          "componentId": "vector"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "候选词表改变输出",
          "desc": "增删候选词，比较同一批固定向量的分类；缺少正确名字时会发生什么？",
          "componentId": "vocab"
        }
      ],
      "insight": "二维向量是教学构造；真实系统使用高维编码和提示集合。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "本章问题",
          "desc": "语义方向：名字怎样成为坐标"
        },
        {
          "icon": "↔",
          "title": "可观察的机制",
          "desc": "旋转图像方向，比较三个固定文本方向的余弦及argmax。"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "二维向量是教学构造；真实系统使用高维编码和提示集合。"
        }
      ],
      "formula": {
        "lead": "余弦比较方向，非零向量才能归一化。",
        "unicode": "score(zᵥ, zₜ) = zᵥ · zₜ / (‖zᵥ‖₂ ‖zₜ‖₂)",
        "symbols": [
          {
            "sym": "zᵥ",
            "desc": "局部图像在共享空间的表示"
          },
          {
            "sym": "zₜ",
            "desc": "候选类别文本表示"
          },
          {
            "sym": "score",
            "desc": "相似度，范围−1到1，不是概率"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "借谁的邻域：先测对应关系",
      "badge": "inf",
      "badgeLabel": "推理与机制",
      "bridge": "局部聚合前，需要先判断哪些 patch 值得彼此借用信息。论文把“同一语义标签”作为二元真值，检查对应关系的精确率和召回率。",
      "analogy": {
        "title": "拼贴画修复 · 寻纹",
        "text": "修复者用一个工具寻纹画片。画片的颜色好比语义，轮廓好比空间组织；这个类比只帮助理解分工，不能证明模型性能。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "选择种子，找同类邻居",
          "desc": "点击拼贴画的一个格点，切换构造的局部一致/噪声特征；移动阈值查看选中邻域与TP/FP/FN。",
          "componentId": "affinity"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "手绘邻域：连接越多越好吗？",
          "desc": "直接连接或断开语义节点，观察聚合方向和错误传播。",
          "componentId": "graph"
        }
      ],
      "insight": "特征对应关系不等于视觉模型自己的最后一层注意力；两者在论文中分别比较。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "本章问题",
          "desc": "借谁的邻域：先测对应关系"
        },
        {
          "icon": "↔",
          "title": "可观察的机制",
          "desc": "点击拼贴画的一个格点，切换构造的局部一致/噪声特征；移动阈值查看选中邻域与TP/FP/FN。"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "特征对应关系不等于视觉模型自己的最后一层注意力；两者在论文中分别比较。"
        }
      ],
      "formula": {
        "lead": "归一化特征的内积，表达位置之间的关系。",
        "unicode": "Sᵢⱼ = xᵢ · xⱼ，‖xᵢ‖₂ = 1",
        "symbols": [
          {
            "sym": "Sᵢⱼ",
            "desc": "位置i与j的余弦相似度"
          },
          {
            "sym": "xᵢ",
            "desc": "VFM局部单位特征，不是文本向量"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "代理注意力：筛选与分配",
      "badge": "inf",
      "badgeLabel": "推理与机制",
      "bridge": "直接对余弦矩阵做softmax会给所有位置正权重。ProxyCLIP 用全矩阵均值自适应设定保留门槛，再在保留位置分配权重。",
      "analogy": {
        "title": "拼贴画修复 · 筛片",
        "text": "修复者用一个工具筛片画片。画片的颜色好比语义，轮廓好比空间组织；这个类比只帮助理解分工，不能证明模型性能。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "一张矩阵，三种处理",
          "desc": "编辑四个单位向量的角度，联动S、A、mask和逐行softmax；调整β与γ，检查整行屏蔽。",
          "componentId": "normal"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "为什么只减均值还不够",
          "desc": "改变统一平移量，并对照是否启用mask，观察概率和支持集。",
          "componentId": "shift"
        }
      ],
      "insight": "这里的归一化是平移与缩放，不是除以标准差；负位置必须屏蔽成−∞。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "本章问题",
          "desc": "代理注意力：筛选与分配"
        },
        {
          "icon": "↔",
          "title": "可观察的机制",
          "desc": "编辑四个单位向量的角度，联动S、A、mask和逐行softmax；调整β与γ，检查整行屏蔽。"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "这里的归一化是平移与缩放，不是除以标准差；负位置必须屏蔽成−∞。"
        }
      ],
      "formula": {
        "lead": "原论文Eq6–8：先选支持集，再在支持集内分配权重。",
        "unicode": "A = γ(S − βμ)，P = softmax(A + M)",
        "symbols": [
          {
            "sym": "μ",
            "desc": "全矩阵L²项的均值，包括对角线"
          },
          {
            "sym": "β",
            "desc": "平移因子，默认1.2"
          },
          {
            "sym": "γ",
            "desc": "缩放因子，默认3"
          },
          {
            "sym": "M",
            "desc": "A≥0为0，否则为−∞；softmax逐行计算"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "权重×语义：是谁在被混合",
      "badge": "inf",
      "badgeLabel": "推理与机制",
      "bridge": "VFM 的任务是提供空间对应关系；CLIP 的 value 仍然是语义内容。权重错误时，精细的传播也可能把错误语义扩散。",
      "analogy": {
        "title": "拼贴画修复 · 拼合",
        "text": "修复者用一个工具拼合画片。画片的颜色好比语义，轮廓好比空间组织；这个类比只帮助理解分工，不能证明模型性能。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "手动追踪一行矩阵乘法",
          "desc": "选择查询格，修改一个CLIP value分量，观察贡献条、聚合向量与标签；插入跨类错误连边。",
          "componentId": "aggregate"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "拖放配对：形状合法，语义也对吗？",
          "desc": "交换CLIP语义片与空间位置，观察同一代理矩阵怎样产生不同分类。",
          "componentId": "permutation"
        }
      ],
      "insight": "PAM 使用冻结投影；教学的二维加权和省略多头与最终投影，不能当完整模型。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "本章问题",
          "desc": "权重×语义：是谁在被混合"
        },
        {
          "icon": "↔",
          "title": "可观察的机制",
          "desc": "选择查询格，修改一个CLIP value分量，观察贡献条、聚合向量与标签；插入跨类错误连边。"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "PAM 使用冻结投影；教学的二维加权和省略多头与最终投影，不能当完整模型。"
        }
      ],
      "formula": {
        "lead": "乘法要求空间位置已对齐；投影沿用CLIP参数。",
        "unicode": "z = Proj(P · v)",
        "symbols": [
          {
            "sym": "P",
            "desc": "VFM生成的L×L代理权重"
          },
          {
            "sym": "v",
            "desc": "CLIP最后自注意力层value，n×L×Dv"
          },
          {
            "sym": "Proj",
            "desc": "融合多头输出的原有投影；随后映射到图文空间"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "分辨率：细格子并非免费的",
      "badge": "inf",
      "badgeLabel": "推理与机制",
      "bridge": "VFM 与 CLIP 的 patch 数可不同。先将v插值到x的空间网格才能相乘；更小patch使网格更细，也使全局关系矩阵变大。",
      "analogy": {
        "title": "拼贴画修复 · 切细",
        "text": "修复者用一个工具切细画片。画片的颜色好比语义，轮廓好比空间组织；这个类比只帮助理解分工，不能证明模型性能。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "把语义网格对齐到轮廓",
          "desc": "编辑2×2源值，比较最近邻与双线性4×4插值；选择目标格查看四角权重。",
          "componentId": "resolution"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "更细patch的计算账本",
          "desc": "切换patch尺寸，比较L、L²与单张注意力矩阵存储；同时看官方效率表。",
          "componentId": "cost"
        }
      ],
      "insight": "B/8平均更准，但补充实验中IPS从52.9降至26.9；不是“无需训练所以没有成本”。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "本章问题",
          "desc": "分辨率：细格子并非免费的"
        },
        {
          "icon": "↔",
          "title": "可观察的机制",
          "desc": "编辑2×2源值，比较最近邻与双线性4×4插值；选择目标格查看四角权重。"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "B/8平均更准，但补充实验中IPS从52.9降至26.9；不是“无需训练所以没有成本”。"
        }
      ],
      "formula": {
        "lead": "只估算一张全局对应矩阵，不等于全模型峰值显存。",
        "unicode": "L = (H/p)(W/p)，关系数 = L²",
        "symbols": [
          {
            "sym": "H, W",
            "desc": "图像空间尺寸；示例336×336"
          },
          {
            "sym": "p",
            "desc": "patch边长；要求示例可整除"
          },
          {
            "sym": "L",
            "desc": "去除class token后的局部位置数"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "冻结的系统：改变计算而非权重",
      "badge": "inf",
      "badgeLabel": "推理与机制",
      "bridge": "ProxyCLIP 本身不需要新增训练。这个结论指组合与下游推理阶段；CLIP、DINO 等基础模型已经接受过预训练。",
      "analogy": {
        "title": "拼贴画修复 · 固定",
        "text": "修复者用一个工具固定画片。画片的颜色好比语义，轮廓好比空间组织；这个类比只帮助理解分工，不能证明模型性能。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "沿信息依赖检查结构",
          "desc": "逐节点查看两条图像支路、插值、PAM、投影、文本对齐；切换教学网格检查维度是否合法。",
          "componentId": "network"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "哪些成本被省掉了",
          "desc": "逐项判断训练/推理/评测行为，提交后在计算账本定位仍然存在的成本。",
          "componentId": "audit"
        }
      ],
      "insight": "training-free 不意味着没有训练数据历史，也不意味着不需要两个图像编码器。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "本章问题",
          "desc": "冻结的系统：改变计算而非权重"
        },
        {
          "icon": "↔",
          "title": "可观察的机制",
          "desc": "逐节点查看两条图像支路、插值、PAM、投影、文本对齐；切换教学网格检查维度是否合法。"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "training-free 不意味着没有训练数据历史，也不意味着不需要两个图像编码器。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "推理闭环：从局部语义回到像素",
      "badge": "inf",
      "badgeLabel": "推理与机制",
      "bridge": "有了代理聚合后的图文对齐特征，还需逐位置分类、空间恢复与滑窗覆盖。每一步有输入和输出，不能把注意力图直接当类别分割图。",
      "analogy": {
        "title": "拼贴画修复 · 铺开",
        "text": "修复者用一个工具铺开画片。画片的颜色好比语义，轮廓好比空间组织；这个类比只帮助理解分工，不能证明模型性能。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "单步执行一个微型分割器",
          "desc": "按步执行相似度→mask→加权和→余弦分类→恢复网格，查看当前中间量；切换错误邻域作对照。",
          "componentId": "pipeline"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "滑窗显微镜：逐窗累计整张图",
          "desc": "改变步长并累计窗口，联动覆盖次数、重叠分数均值与计算次数。",
          "componentId": "windows"
        }
      ],
      "insight": "真实评测使用标准ImageNet提示集合与滑窗；微型单头例子只演示计算依赖。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "本章问题",
          "desc": "推理闭环：从局部语义回到像素"
        },
        {
          "icon": "↔",
          "title": "可观察的机制",
          "desc": "按步执行相似度→mask→加权和→余弦分类→恢复网格，查看当前中间量；切换错误邻域作对照。"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "真实评测使用标准ImageNet提示集合与滑窗；微型单头例子只演示计算依赖。"
        }
      ],
      "formula": {
        "lead": "注意力是位置关系；类别需要额外与文本比较。",
        "unicode": "ŷᵢ = argmax_c cos(zᵥ,ᵢ, zₜ,c)",
        "symbols": [
          {
            "sym": "ŷᵢ",
            "desc": "第i个位置的类别"
          },
          {
            "sym": "c",
            "desc": "候选词表中的类别索引"
          },
          {
            "sym": "zₜ,c",
            "desc": "类别c的文本表征"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "消融证据：哪一步贡献了改善",
      "badge": "both",
      "badgeLabel": "实验与证据",
      "bridge": "机制图能够说明计算，却不能证明真实准确率。消融应固定其余条件，并且只比较论文确实报告的组合。",
      "analogy": {
        "title": "拼贴画修复 · 对照",
        "text": "修复者用一个工具对照画片。画片的颜色好比语义，轮廓好比空间组织；这个类比只帮助理解分工，不能证明模型性能。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "归一化和mask的证据",
          "desc": "选择Table4已报告的三个变体，联动每数据集差值与平均；缺失mask-only明确不可选择。",
          "componentId": "ablation"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "主干、patch与固定阈值",
          "desc": "切换Table2/3/补充Table2的独立实验；选择VFM查看均值或阈值曲线，识别自适应不总赢最佳手调值。",
          "componentId": "backbone"
        }
      ],
      "insight": "更高均值不能证明所有数据集都提升；不同主干和分辨率也不是等成本比较。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "本章问题",
          "desc": "消融证据：哪一步贡献了改善"
        },
        {
          "icon": "↔",
          "title": "可观察的机制",
          "desc": "选择Table4已报告的三个变体，联动每数据集差值与平均；缺失mask-only明确不可选择。"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "更高均值不能证明所有数据集都提升；不同主干和分辨率也不是等成本比较。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果与边界：如何写可信结论",
      "badge": "both",
      "badgeLabel": "实验与证据",
      "bridge": "主表覆盖八个验证集，分别含背景或不含背景。读懂模型配置和每一列后，再判断“平均提升”能够支持多强的结论。",
      "analogy": {
        "title": "拼贴画修复 · 验收",
        "text": "修复者用一个工具验收画片。画片的颜色好比语义，轮廓好比空间组织；这个类比只帮助理解分工，不能证明模型性能。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "逐数据集检验平均提升",
          "desc": "选择比较对象和数据集，显示实际柱形与差值；切换到ADE847/PC459时分开显示协议。",
          "componentId": "results"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "把结论放回证据条件",
          "desc": "回答四道机制/成本/反例挑战，提交后显示证据卡；可重答。",
          "componentId": "quiz"
        }
      ],
      "insight": "本页复述ECCV2024结果，不声称今天仍为最优方法；未运行真实权重。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "本章问题",
          "desc": "结果与边界：如何写可信结论"
        },
        {
          "icon": "↔",
          "title": "可观察的机制",
          "desc": "选择比较对象和数据集，显示实际柱形与差值；切换到ADE847/PC459时分开显示协议。"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "本页复述ECCV2024结果，不声称今天仍为最优方法；未运行真实权重。"
        }
      ]
    }
  ]
};
