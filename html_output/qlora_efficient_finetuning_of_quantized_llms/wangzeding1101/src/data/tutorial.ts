import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "QLoRA: Efficient Finetuning of Quantized LLMs",
    "titleZh": "QLoRA：量化大语言模型的高效微调",
    "venue": "NeurIPS 2023",
    "authors": "Tim Dettmers, Artidoro Pagnoni, Ari Holtzman, Luke Zettlemoyer",
    "affiliation": "University of Washington",
    "domain": "大语言模型 · 参数高效微调 · 量化",
    "coreProblem": "65B 模型的 16 位全量微调需要超过 780 GB 显存，如何让单张 48 GB GPU 也能承担高质量微调？",
    "coreInsight": "以 NF4 冻结存储基础权重，按需反量化为 BF16 计算，只训练 LoRA，并用双重量化与分页优化器继续压低内存峰值。",
    "keywords": [
      "NF4",
      "双重量化",
      "LoRA",
      "分页优化器"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "16 位全量微调：65B 模型的报告需求超过 780 GB，背包早已超载。",
      "componentId": "qlora-lab"
    },
    "newMethod": {
      "desc": "QLoRA：冻结 4 位基础模型并训练轻量适配器，论文在单张 48 GB GPU 上微调 65B。",
      "componentId": "qlora-lab"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "为什么 65B 微调装不进一张卡",
      "badge": "inf",
      "badgeLabel": "问题",
      "bridge": "先从显存账本出发：模型权重只是第一项，全量微调还要保存梯度、优化器状态和激活。",
      "analogy": {
        "title": "先称一称登山包",
        "text": "把模型看作登山装备。16 位全量微调不仅带上全部装备，还要携带训练副本；QLoRA 则把基础装备压紧，只留一本可修改的小笔记。",
        "componentId": "qlora-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "显存预算试算器",
          "desc": "选择模型规模和微调方式，比较论文报告的 QLoRA 部署占用与 65B 全量微调边界。只有 QLoRA 的 5/10/21/41 GB 与 65B 全量微调超过 780 GB 是论文报告值。",
          "componentId": "qlora-lab"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "同一张 48 GB 卡，两种装法",
          "desc": "启动比较，观察全量微调背包溢出，而 QLoRA 背包在论文设置下闭合。",
          "componentId": "qlora-lab"
        }
      ],
      "insight": "参数高效不等于只数可训练参数；能否运行还取决于基础权重、激活和优化器状态共同形成的显存峰值。",
      "takeaways": [
        {
          "icon": "⚖",
          "title": "瓶颈是整张账单",
          "desc": "权重、梯度、优化器状态和激活共同占用显存。"
        },
        {
          "icon": "🔒",
          "title": "先冻结基础模型",
          "desc": "QLoRA 不为每个任务复制并更新全部基础权重。"
        },
        {
          "icon": "📍",
          "title": "结论有实验边界",
          "desc": "单卡 65B 是论文特定模型、数据和硬件设置下的结果。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "一套权重，两种精度",
      "badge": "inf",
      "badgeLabel": "表示",
      "bridge": "4 位并不意味着所有计算都在 4 位中完成。QLoRA 把低成本存储与稳定计算拆开处理。",
      "analogy": {
        "title": "压紧睡袋，使用时再展开",
        "text": "背包里把睡袋压缩存放，需要时再展开；NF4 权重也以 4 位保存，在矩阵乘法前反量化为 BF16。",
        "componentId": "qlora-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "沿着一次前向与反向传播",
          "desc": "逐步查看 NF4 存储、BF16 反量化、矩阵乘法和 LoRA 梯度。反向传播只更新适配器。",
          "componentId": "qlora-lab"
        }
      ],
      "formula": {
        "lead": "基础权重的存储精度与计算精度分离：",
        "unicode": "Wᴮᶠ¹⁶ = doubleDequant(c₁, c₂, Wᴺᶠ⁴)",
        "symbols": [
          {
            "sym": "Wᴺᶠ⁴",
            "desc": "冻结的 NF4 存储权重"
          },
          {
            "sym": "Wᴮᶠ¹⁶",
            "desc": "反量化后的 BF16 计算权重"
          },
          {
            "sym": "c₁,c₂",
            "desc": "两级量化常数"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📦",
          "title": "4 位负责存储",
          "desc": "压低常驻基础权重的内存成本。"
        },
        {
          "icon": "🧮",
          "title": "BF16 负责计算",
          "desc": "运算前按需反量化，计算数据类型仍是 BF16。"
        },
        {
          "icon": "🧊",
          "title": "基础权重保持冻结",
          "desc": "梯度流向 LoRA，而不是 4 位权重。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "NF4 为什么顺着权重分布放刻度",
      "badge": "both",
      "badgeLabel": "核心",
      "bridge": "量化不只是减少刻度数量，还要决定刻度放在哪里。NF4 针对近似正态分布的预训练权重设计表示点。",
      "analogy": {
        "title": "在布料最密处多留刻度",
        "text": "折叠后的布料并非均匀堆积。把有限刻度集中在最常出现的位置，比等距标记更贴合实际分布。",
        "componentId": "qlora-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "均匀刻度与等概率刻度",
          "desc": "拖动橙色探针并切换 FP4/NF4：FP4 保持等宽，NF4 让每个区间承载近似相等的概率质量。",
          "componentId": "qlora-lab"
        }
      ],
      "formula": {
        "lead": "NF4 的表示点由相邻标准正态分位点构造：",
        "unicode": "qᵢ = ½[Qₓ(i/(2ᵏ+1)) + Qₓ((i+1)/(2ᵏ+1))]",
        "symbols": [
          {
            "sym": "qᵢ",
            "desc": "第 i 个 NF4 表示点"
          },
          {
            "sym": "Qₓ",
            "desc": "标准正态分布的分位函数"
          },
          {
            "sym": "k",
            "desc": "量化位数"
          }
        ]
      },
      "insight": "NF4 的优势依赖权重近似零均值正态分布的假设；若分布显著偏离，匹配收益可能减弱。",
      "takeaways": [
        {
          "icon": "🔔",
          "title": "匹配权重分布",
          "desc": "表示点密度随标准正态分布变化。"
        },
        {
          "icon": "▥",
          "title": "等概率而非等宽",
          "desc": "中心区域区间更窄，尾部区间更宽。"
        },
        {
          "icon": "⚠",
          "title": "假设不是定律",
          "desc": "分布偏移时仍需实测量化误差。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "双重量化压缩“压缩说明书”",
      "badge": "both",
      "badgeLabel": "数学",
      "bridge": "权重被量化后，每个块仍需保存缩放常数；模型足够大时，这些元数据也会成为可观开销。",
      "analogy": {
        "title": "把许多标签再装进索引袋",
        "text": "先压缩装备，再把每包装备的标签集中压缩。双重量化处理的是第一次量化产生的常数。",
        "componentId": "qlora-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "常数也要占空间",
          "desc": "调整第一层块大小并开关双重量化。块大小 64 时，论文设置把常数开销从约 0.5 降到 0.127 bit/参数，节省约 0.373 bit/参数。",
          "componentId": "qlora-lab"
        }
      ],
      "formula": {
        "lead": "先恢复量化常数，再用它恢复权重：",
        "unicode": "doubleDequant(c₁,c₂,W⁴) = dequant(dequant(c₁,c₂),W⁴)",
        "symbols": [
          {
            "sym": "c₁",
            "desc": "被再次量化的第一层常数"
          },
          {
            "sym": "c₂",
            "desc": "第二层量化常数"
          },
          {
            "sym": "W⁴",
            "desc": "4 位量化权重"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🏷",
          "title": "元数据也有成本",
          "desc": "小块带来更多第一层缩放常数。"
        },
        {
          "icon": "🗜",
          "title": "再量化一次常数",
          "desc": "第二层量化继续减少常驻内存。"
        },
        {
          "icon": "≈",
          "title": "精确值对应特定设置",
          "desc": "0.373 bit/参数来自块 64 与第二层块 256。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "分页优化器只处理峰值",
      "badge": "trn",
      "badgeLabel": "机制",
      "bridge": "即使稳定占用能放进显存，长序列或批次变化仍可能制造短时峰值并触发内存不足。",
      "analogy": {
        "title": "拥挤时临时借用同伴背包",
        "text": "平时装备留在主背包，只有体积突然膨胀时才把一件物品临时移到旁边；峰值过去后再取回。",
        "componentId": "qlora-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "稳定占用与瞬时峰值",
          "desc": "切换稳定、长序列和尖峰场景，再开启分页优化器。它通过统一内存迁移优化器状态，目标是避免峰值 OOM。",
          "componentId": "qlora-lab"
        }
      ],
      "insight": "分页优化器不是压缩算法，也不直接提高精度；它缓解的是瞬时内存压力，并可能引入 CPU/GPU 迁移开销。",
      "takeaways": [
        {
          "icon": "📈",
          "title": "关注峰值",
          "desc": "稳定平均值不能说明训练一定不会 OOM。"
        },
        {
          "icon": "↔",
          "title": "按需分页",
          "desc": "峰值时让优化器状态在 CPU 与 GPU 间迁移。"
        },
        {
          "icon": "≠",
          "title": "不等于减少计算",
          "desc": "它不降低稳定阶段的前向与反向计算量。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "梯度究竟更新谁",
      "badge": "trn",
      "badgeLabel": "执行",
      "bridge": "QLoRA 的关键不是停止反向传播，而是让梯度穿过反量化基础权重，最终只落在 LoRA 参数上。",
      "analogy": {
        "title": "装备不动，只改随身笔记",
        "text": "背包里的基础装备已经固定；每次练习只在轻薄笔记中记录任务变化，不重新制作全部装备。",
        "componentId": "qlora-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "追踪一轮前向与反向",
          "desc": "逐步经过输入、反量化基础分支、输出与损失，再观察反向阶段只有 LoRA 分支被更新。",
          "componentId": "qlora-lab"
        }
      ],
      "formula": {
        "lead": "输出由冻结基础映射与可训练低秩增量共同构成：",
        "unicode": "Y = XWᴮᶠ¹⁶ + XL₁L₂",
        "symbols": [
          {
            "sym": "X,Y",
            "desc": "层输入与输出"
          },
          {
            "sym": "Wᴮᶠ¹⁶",
            "desc": "用于计算但保持冻结的基础权重"
          },
          {
            "sym": "L₁,L₂",
            "desc": "BF16 可训练 LoRA 矩阵"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "➡",
          "title": "梯度路径仍然完整",
          "desc": "反量化参与前向，误差可以传播到适配器。"
        },
        {
          "icon": "🔐",
          "title": "基础权重不更新",
          "desc": "NF4 权重没有优化器状态和参数梯度。"
        },
        {
          "icon": "✎",
          "title": "只保存任务增量",
          "desc": "不同任务共享同一基础模型。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "LoRA 放在哪里比秩多大更关键",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "参数预算不仅由秩决定，也由适配器覆盖哪些线性层决定。论文在 LLaMA 7B 的实验中比较了这两种选择。",
      "analogy": {
        "title": "多处分布小口袋",
        "text": "与其只把一个口袋做得很大，不如在背包多个关键位置放置薄口袋，让增量信息覆盖整条处理路径。",
        "componentId": "qlora-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "覆盖范围与低秩维度",
          "desc": "切换仅查询/值投影或全部线性层，再比较 rank 8、16、64。论文测试中，覆盖全部线性层更关键，rank 增大没有稳定带来同等收益。",
          "componentId": "qlora-lab"
        }
      ],
      "insight": "“rank 不敏感”只来自论文测试的模型、数据和秩范围，不能推断所有任务都可固定使用同一 rank。",
      "takeaways": [
        {
          "icon": "◫",
          "title": "覆盖全部线性层",
          "desc": "QLoRA 的实验结论强调广泛放置适配器。"
        },
        {
          "icon": "r",
          "title": "rank 是次级旋钮",
          "desc": "在报告范围内，提高秩没有系统性改善。"
        },
        {
          "icon": "⌁",
          "title": "仍需任务验证",
          "desc": "跨模态或强领域迁移可能需要不同预算。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "QLoRA 的完整结构图",
      "badge": "trn",
      "badgeLabel": "架构",
      "bridge": "把分散机制重新拼回一条计算链，才能区分哪些组件常驻、哪些可训练、哪些只在峰值出现。",
      "analogy": {
        "title": "打开背包查看分区",
        "text": "压缩主仓、可修改笔记、标签索引袋和临时侧袋各司其职；任何单一组件都不能独立代表 QLoRA。",
        "componentId": "qlora-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "五个组件如何连成一条链",
          "desc": "点击 NF4 基础权重、双反量化、BF16 计算、LoRA 或分页优化器，查看数据类型、训练状态和作用阶段。",
          "componentId": "qlora-lab",
          "figure": "./images/figure-1-themed.png"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "全量微调、LoRA 与 QLoRA",
          "desc": "切换三种方法，比较基础权重存储、可训练路径和峰值处理方式。图示表达组成关系，不把未报告的分项画成精确总量。",
          "componentId": "qlora-lab"
        }
      ],
      "takeaways": [
        {
          "icon": "4",
          "title": "NF4 保存基础权重",
          "desc": "常驻内存的主要压缩来自 4 位存储。"
        },
        {
          "icon": "16",
          "title": "BF16 承担计算",
          "desc": "低位存储没有取消高精度计算路径。"
        },
        {
          "icon": "+",
          "title": "LoRA 与分页各有职责",
          "desc": "一个学习增量，一个缓解瞬时峰值。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "数据质量与评测不能混为一谈",
      "badge": "both",
      "badgeLabel": "实践",
      "bridge": "高效训练解决了“能不能训”，却不保证“用什么数据训”和“如何评价”自然得到正确答案。",
      "analogy": {
        "title": "少带但带对装备",
        "text": "适合路线的少量可靠装备，可能比一大包不匹配物品更有用；但到达不同检查点时，衡量标准也会改变。",
        "componentId": "qlora-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "数据集大小不是唯一解释",
          "desc": "比较 OASST1、FLAN v2 与 Alpaca 的规模和任务匹配方向。论文观察支持质量与匹配的重要性，但这些数据集并非严格控制变量实验。",
          "componentId": "qlora-lab"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "知识测验与聊天偏好是两把尺",
          "desc": "对照两种评测的输入与输出：MMLU 统计选择题正确率，聊天评测比较多轮回答的相对偏好，两者衡量的能力并不相同。",
          "componentId": "qlora-lab"
        }
      ],
      "insight": "GPT-4 自动评审比人工更便宜且较一致，但会继承提示、顺序和评审模型本身的偏差；单一排名不能替代多维评估。",
      "takeaways": [
        {
          "icon": "◆",
          "title": "质量与匹配优先",
          "desc": "样本数量不是表现的充分解释。"
        },
        {
          "icon": "⇄",
          "title": "指标不可互换",
          "desc": "MMLU 与聊天偏好关注不同能力。"
        },
        {
          "icon": "👁",
          "title": "评审者也有偏差",
          "desc": "模型裁判需要与人工及多种协议交叉验证。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、代价与边界",
      "badge": "both",
      "badgeLabel": "结论",
      "bridge": "最后把效率、效果和局限放在同一张表上：QLoRA 显著降低微调门槛，但没有消除模型能力与评测风险。",
      "analogy": {
        "title": "终点称重，也检查遗漏",
        "text": "背包顺利到达终点并不等于路线上的所有任务都完成。称重结果要与装备能力、失误和检查方式一起解读。",
        "componentId": "qlora-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "按指标读取论文结果",
          "desc": "切换显存与 Vicuna 协议结果并启动比较。显存为 Guanaco 7B/13B/33B/65B 的报告占用；Vicuna 为相对 ChatGPT aggregate，不能外推为通用等价。",
          "componentId": "qlora-lab"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "四类不能被效率掩盖的局限",
          "desc": "点击事实错误、数学推理、拒答一致性与评测偏差，区分论文中的定性案例与有统计意义的错误率。",
          "componentId": "qlora-lab"
        }
      ],
      "insight": "QLoRA 改变了微调的资源门槛，却没有免费消除基础模型推理缺陷、数据风险、量化误差或评测盲区。",
      "takeaways": [
        {
          "icon": "↓",
          "title": "效率贡献明确",
          "desc": "低位存储、双重量化和分页共同降低内存门槛。"
        },
        {
          "icon": "≈",
          "title": "质量结论受协议约束",
          "desc": "99.3% 对应论文的 GPT-4/Vicuna aggregate。"
        },
        {
          "icon": "!",
          "title": "安全证据仍有限",
          "desc": "事实性、数学、拒答与责任评估仍需扩展。"
        }
      ]
    }
  ]
};
