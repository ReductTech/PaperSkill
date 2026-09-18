import type { TutorialData } from '../types';
export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "DeltaV: Thinking with Visual State Updates in Unified Large Multimodal Models",
    "titleZh": "DeltaV：让视觉推理只更新必要的变化",
    "venue": "arXiv · 2026 · v1",
    "authors": "Pengjie Wang、Linger Deng 等",
    "affiliation": "华中科技大学 · 小米 MiLM Plus",
    "domain": "统一多模态模型 / 视觉状态更新",
    "coreProblem": "只改变一小部分视觉状态，为什么要重新生成整张图？",
    "coreInsight": "把初始视觉状态保留下来，让文本推理与紧凑视觉更新交替推进。 <br/><small>教程整理：何熹淳 · XichunHe · AI 辅助制作</small>",
    "keywords": [
      "视觉状态更新",
      "TSIM Router",
      "StructCoT",
      "交互式论文精读"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "完整状态：每一步重新记录整幅画面，也重复了没有变化的内容。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "视觉更新：利用历史状态，仅生成推动下一步推理的更新。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "只改一笔，为什么重画整页？",
      "badge": "inf",
      "badgeLabel": "理解机制",
      "bridge": "先观察浪费发生在哪里：中间视觉状态可能高度相似，却被当成完整的新图像生成。",
      "analogy": {
        "title": "在地图上补一段路线",
        "text": "画板上的底图没有改变，只补一小段路线就能表达新的判断。这个类比解释视觉连续性，不代表 token 与笔画一一对应。",
        "componentId": "analogy1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "同一张画板，两种记录方式",
          "desc": "教学示意：同步推进同一条路线，对比每步重新记录完整状态与只记录更新。图中计数是笔画记录数，不是模型 token。<a href=\"https://arxiv.org/html/2607.08434v1\" target=\"_blank\" rel=\"noreferrer\">原文 §1、§3.1</a>",
          "componentId": "lab1"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "问题",
          "desc": "重复完整状态会消耗视觉 token，并可能稀释关键变化的监督。"
        },
        {
          "icon": "🔎",
          "title": "核心",
          "desc": "把关注点放在推动推理的状态变化上。"
        },
        {
          "icon": "⚖️",
          "title": "边界",
          "desc": "不是任何中间图像都能提高推理表现。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "图像、查询与视觉 token",
      "badge": "inf",
      "badgeLabel": "理解机制",
      "bridge": "知道要减少重复之后，还需要弄清：模型记录的究竟是什么？",
      "analogy": {
        "title": "用描图框取景",
        "text": "同一张画板可以被取景、概括和编码。视觉 token 是学习到的离散表示，不能理解成固定的一块像素或一笔线条。",
        "componentId": "analogy2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "一幅图的三种表示",
          "desc": "教学示意：选择表示层，观察画板、查询槽与离散索引的区别。索引编号仅作示例。<a href=\"https://arxiv.org/html/2607.08434v1\" target=\"_blank\" rel=\"noreferrer\">原文 §3.2、附录 B.1</a>",
          "componentId": "lab2"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "视觉骨干",
          "desc": "TSIM-Tok 使用冻结的 SigLIP2-Large。"
        },
        {
          "icon": "🔎",
          "title": "离散化",
          "desc": "查询聚合视觉信息，再量化为视觉 token。"
        },
        {
          "icon": "⚖️",
          "title": "不要混淆",
          "desc": "离线相似度估计使用 DINOv2，职责不同。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "更新必须放回历史中理解",
      "badge": "inf",
      "badgeLabel": "理解机制",
      "bridge": "紧凑表示如何表达完整状态？先让更新离开底图，看看会丢掉什么。",
      "analogy": {
        "title": "叠上透明描图纸",
        "text": "描图纸上的一小段路线，只有叠回原地图才有位置和意义。模型中的“叠回”由历史条件与学习到的解码完成，不是机械叠加像素。",
        "componentId": "analogy3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "拖动更新，找回上下文",
          "desc": "教学示意：把透明更新片拖回底图对齐位置；也可用方向按钮调整。实际 ΔZ 是潜在离散更新，不能单独当作差分图片。<a href=\"https://arxiv.org/html/2607.08434v1\" target=\"_blank\" rel=\"noreferrer\">原文 式 (2)、(11)、附录 B.1</a>",
          "componentId": "lab3"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "序列",
          "desc": "初态 Z₀ 与文本、视觉更新交错排列。"
        },
        {
          "icon": "🔎",
          "title": "条件",
          "desc": "ΔZₜ 依赖基础状态与先前更新，不能读取未来。"
        },
        {
          "icon": "⚖️",
          "title": "边界",
          "desc": "Δ 符号表示状态更新，不宣称它等于像素减法。"
        }
      ],
      "formula": {
        "lead": "完整视觉状态不再在每一步重复加入序列。<a href=\"https://arxiv.org/html/2607.08434v1\" target=\"_blank\" rel=\"noreferrer\">原文 式 (2)</a>",
        "unicode": "Y = { Z₀, X₁, ΔZ₁, X₂, ΔZ₂, … }",
        "symbols": [
          {
            "sym": "Z₀",
            "desc": "初始视觉状态的离散 token 序列。"
          },
          {
            "sym": "X₁",
            "desc": "第 1 步的文本 token 序列。"
          },
          {
            "sym": "ΔZ₁",
            "desc": "第 1 步的变长视觉更新 token 序列，不是数值减法。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "怎样判断这次变化有多大？",
      "badge": "both",
      "badgeLabel": "证据与判断",
      "bridge": "历史很多，参考价值却不相同。需要同时考虑相似程度、时间远近与历史容量。",
      "analogy": {
        "title": "翻看最近的草图",
        "text": "查看画板的旧草图时，最近版本通常更贴近现在，但细节丰富的历史版本也可能有参考价值。",
        "componentId": "analogy4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "调整时间权重，计算 TSIM",
          "desc": "用固定的教学样例计算论文式 (5)：三个历史相似度为 0.30、0.60、0.90，对应 token 预算为 144、64、16。样例数值非论文实测。<a href=\"https://arxiv.org/html/2607.08434v1\" target=\"_blank\" rel=\"noreferrer\">原文 式 (5)、图 9(a)、表 7(b)</a>",
          "componentId": "lab4"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "分子",
          "desc": "相似度乘上时间与容量权重，再求和。"
        },
        {
          "icon": "🔎",
          "title": "分母",
          "desc": "权重总和负责归一化，结果是加权平均。"
        },
        {
          "icon": "⚖️",
          "title": "证据",
          "desc": "论文中 α 约 0.6–0.8 表现较好，不是所有数据上的最优保证。"
        }
      ],
      "formula": {
        "lead": "时间衰减与 token 容量共同决定参考权重。<a href=\"https://arxiv.org/html/2607.08434v1\" target=\"_blank\" rel=\"noreferrer\">原文 式 (5)</a>",
        "unicode": "TSIMₜ = [ Σ(j=0…t−1) sₜⱼ αᵗ⁻¹⁻ʲ Kⱼ ] / [ Σ(j=0…t−1) αᵗ⁻¹⁻ʲ Kⱼ ]",
        "symbols": [
          {
            "sym": "sₜⱼ",
            "desc": "当前与历史视觉特征的余弦相似度，无量纲。"
          },
          {
            "sym": "α",
            "desc": "0 到 1 的时间衰减系数；最近项指数为 0。"
          },
          {
            "sym": "Kⱼ",
            "desc": "历史第 j 步的视觉 token 预算，正整数。"
          },
          {
            "sym": "TSIMₜ",
            "desc": "历史加权相似度；不是结构相似性指标 SSIM。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "再加 token，还值得吗？",
      "badge": "both",
      "badgeLabel": "证据与判断",
      "bridge": "相似度只描述变化，不能直接告诉我们该分配多少 token。还要观察重建质量如何随预算增长。",
      "analogy": {
        "title": "决定何时收笔",
        "text": "补画细节的前几笔作用明显，后来可能收益越来越小。收笔依据是新增一笔是否还值得，不是纸面必须达到同一个固定分数。",
        "componentId": "analogy5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "在收益曲线上选择预算",
          "desc": "教学曲线，不是论文拟合数据。实际方法按 TSIM 区间离线拟合 SSIM—预算曲线，找到边际收益低于阈值的位置，再映射到最近候选预算。<a href=\"https://arxiv.org/html/2607.08434v1\" target=\"_blank\" rel=\"noreferrer\">原文 式 (6)–(9)、图 7</a>",
          "componentId": "lab5"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "离线校准",
          "desc": "在验证集估计相似度、预算与重建质量的关系。"
        },
        {
          "icon": "🔎",
          "title": "离散预算",
          "desc": "候选为 9、16、25、36、49、64、81、100、121、144。"
        },
        {
          "icon": "⚖️",
          "title": "经验策略",
          "desc": "最小边际收益阈值不等于理论最优压缩。"
        }
      ],
      "formula": {
        "lead": "先找收益开始饱和的位置，再选最近的可用预算。<a href=\"https://arxiv.org/html/2607.08434v1\" target=\"_blank\" rel=\"noreferrer\">原文 式 (9)</a>",
        "unicode": "x* = inf { x : C′ₘ(x) ≤ τ }；Kₜ = argminₖ∈𝒦 | k − x* |",
        "symbols": [
          {
            "sym": "C′ₘ(x)",
            "desc": "第 m 个 TSIM 区间的拟合 SSIM 对连续预算的导数。"
          },
          {
            "sym": "τ",
            "desc": "正的边际重建收益阈值，单位是 SSIM/每 token。"
          },
          {
            "sym": "𝒦",
            "desc": "离线预设的离散候选预算集合。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "推理时，模型如何知道停？",
      "badge": "inf",
      "badgeLabel": "理解机制",
      "bridge": "未来图像还没有生成，模型无法先计算它与历史的 TSIM。这是最容易误读的方法细节。",
      "analogy": {
        "title": "写完后主动抬笔",
        "text": "练习时看范例学会何时收笔；独立作画时按学到的规则抬笔。并不是先偷看尚未完成的答案。",
        "componentId": "analogy6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "训练的老师，推理的学生",
          "desc": "教学轨迹：训练使用已知中间图产生预算与结束监督；推理只使用已有上下文生成视觉索引，直到视觉结束标记。<a href=\"https://arxiv.org/html/2607.08434v1\" target=\"_blank\" rel=\"noreferrer\">原文 §3.3、附录 B.2</a>",
          "componentId": "lab6"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "监督",
          "desc": "训练目标包含变长更新及视觉结束标记。"
        },
        {
          "icon": "🔎",
          "title": "推理",
          "desc": "通过自回归预测结束标记来控制长度。"
        },
        {
          "icon": "⚖️",
          "title": "效率边界",
          "desc": "正常推理无需为每一步调用 tokenizer 的图像解码器。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "先学会编码，再学会推理",
      "badge": "trn",
      "badgeLabel": "深入方法",
      "bridge": "自主结束来自训练。把 tokenizer 的表示学习与语言模型的预测学习分开看，目标才不会混淆。",
      "analogy": {
        "title": "按范例修正笔触",
        "text": "练习画板时先把笔触练稳定，再练习如何组织整幅图。这里只用来类比分阶段学习，不把模型训练简化成手工规则。",
        "componentId": "analogy7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "四个阶段，哪些参数在学习？",
          "desc": "阶段配置来自论文；网页只展示参数冻结与目标，不进行模型训练。<a href=\"https://arxiv.org/html/2607.08434v1\" target=\"_blank\" rel=\"noreferrer\">原文 §5.1、附录 B、表 9</a>",
          "componentId": "lab7"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两类目标",
          "desc": "tokenizer 重建与语义保持，DeltaV 预测下一 token。"
        },
        {
          "icon": "🔎",
          "title": "结束标记",
          "desc": "属于视觉预测监督，使模型学会更新长度。"
        },
        {
          "icon": "⚖️",
          "title": "计算规模",
          "desc": "这是论文方法讲解，网页没有复现论文的大规模训练。"
        }
      ],
      "formula": {
        "lead": "文本与视觉损失先按各自有效位置取平均，再进行加权。<a href=\"https://arxiv.org/html/2607.08434v1\" target=\"_blank\" rel=\"noreferrer\">原文 式 (23)–(25)</a>",
        "unicode": "L_DeltaV = L_text + λ_vis L_vis",
        "symbols": [
          {
            "sym": "L_text",
            "desc": "监督文本位置上的平均下一 token 交叉熵。"
          },
          {
            "sym": "L_vis",
            "desc": "监督视觉位置上的平均交叉熵，包含视觉结束 token。"
          },
          {
            "sym": "λ_vis",
            "desc": "视觉项相对权重；不能直接用序列长度替代。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "结构里，历史从哪里进入？",
      "badge": "trn",
      "badgeLabel": "深入方法",
      "bridge": "现在把已经理解的部分连接起来，定位当前图像、历史表示与离散生成各自的职责。",
      "analogy": {
        "title": "用尺子对准已有线段",
        "text": "新笔画要参照旧线段的位置。模型中对应的是受因果约束的历史信息聚合，不允许借用未来状态。",
        "componentId": "analogy8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点亮 TSIM-Tok 的关键部件",
          "desc": "可点击结构节点，也可用按钮选择。编码结构与可选重建路径分开显示，避免把可视化解码误认为推理必经步骤。<a href=\"https://arxiv.org/html/2607.08434v1\" target=\"_blank\" rel=\"noreferrer\">原文 图 3、式 (11)、附录 B.1</a>",
          "componentId": "lab8"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "当前内容",
          "desc": "可变形交叉注意力让查询读取当前视觉特征。"
        },
        {
          "icon": "🔎",
          "title": "历史内容",
          "desc": "差异感知因果自注意力聚合过去信息。"
        },
        {
          "icon": "⚖️",
          "title": "正常路径",
          "desc": "DeltaV 使用离散视觉索引进行自回归建模。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "数据与消融：什么证据支持设计？",
      "badge": "trn",
      "badgeLabel": "深入方法",
      "bridge": "结构合理还不够。需要检查数据覆盖，并用消融研究区分“更新本身”和“预算分配”的作用。",
      "analogy": {
        "title": "换一种画题练习",
        "text": "只练一种图案，很难说明能处理不同问题。换题可以观察迁移，但成绩提升也可能同时来自更多练习。",
        "componentId": "analogy9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "在相同预算下比较分配方式",
          "desc": "Zebra-CoT 重建消融，所有配置平均 64 token；rFID 越低越好，PSNR 与 SSIM 越高越好。<a href=\"https://arxiv.org/html/2607.08434v1\" target=\"_blank\" rel=\"noreferrer\">原文 表 3、表 7、图 9(b)</a>",
          "componentId": "lab9"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "数据覆盖",
          "desc": "StructCoT 约 105 万样本，44 领域，七大类别。"
        },
        {
          "icon": "🔎",
          "title": "设计证据",
          "desc": "同预算比较支持更新表示和 TSIM 分配的价值。"
        },
        {
          "icon": "⚖️",
          "title": "迁移",
          "desc": "Zebra-CoT 校准规则迁到 StructCoT，仍观察到重建改善。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "读懂提升，也看清代价",
      "badge": "both",
      "badgeLabel": "证据与判断",
      "bridge": "最后把三种问题分开：节省了什么、推理提升多少、哪些结论仍有边界。",
      "analogy": {
        "title": "检查完成的画作",
        "text": "画得省、画得像、推理对，是三个不同标准。评价画板不能只数笔画，还要查看关键细节有没有保住。",
        "componentId": "analogy10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "同一协议下的推理成绩",
          "desc": "按“开始比较”展示 Zebra-CoT 测试集随机 4K 例的成绩。总体分数与子类分数均越高越好；数值来自论文，不是网页运行结果。<a href=\"https://arxiv.org/html/2607.08434v1\" target=\"_blank\" rel=\"noreferrer\">原文 表 1、§5.1</a>",
          "componentId": "lab10"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "更多 token，一定更会推理吗？",
          "desc": "改变 TSIM 阈值得到的三种平均预算配置；重建与推理指标不能混为一谈。<a href=\"https://arxiv.org/html/2607.08434v1\" target=\"_blank\" rel=\"noreferrer\">原文 附录 A.1、表 6</a>",
          "componentId": "lab10b"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "节省对象",
          "desc": "64 对 144 是新增视觉 token 的平均数，减少约 55.6%。"
        },
        {
          "icon": "🔎",
          "title": "不要越界",
          "desc": "3.3 是百分点；最终模型比较包含数据与训练的共同作用。"
        },
        {
          "icon": "⚖️",
          "title": "适用边界",
          "desc": "细粒度感知、纯语言任务或确定性图像操作可能需要其他方式。"
        }
      ]
    }
  ]
};
