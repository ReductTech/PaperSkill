import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "LLaMA-MoE: Building Mixture-of-Experts from LLaMA with Continual Pre-Training",
    "titleZh": "LLaMA-MoE：以持续预训练从 LLaMA 构建混合专家模型",
    "venue": "EMNLP 2024",
    "authors": "Tong Zhu, Xiaoye Qu, Daize Dong, Jiacheng Ruan, Jingqi Tong, Conghui He, Yu Cheng",
    "affiliation": "Soochow University · Shanghai AI Laboratory · Shanghai Jiao Tong University",
    "domain": "大语言模型 · 混合专家 · 持续预训练",
    "coreProblem": "从零训练大规模 MoE 数据需求大、成本高且不稳定；直接切分已训练模型又会损失语言能力。",
    "coreInsight": "从密集 LLaMA 出发，把 FFN 中间神经元等量切分为专家，加入 top-k 门控和 N/k 重标定，再通过持续预训练恢复语言能力。",
    "keywords": [
      "混合专家",
      "FFN 切分",
      "top-k 路由",
      "持续预训练",
      "专家专业化",
      "负载均衡",
      "指令微调"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "密集模型：总参数与每次计算都很大，全声部一起参与。",
      "componentId": "hero-dense"
    },
    "newMethod": {
      "desc": "LLaMA-MoE：从已有 FFN 等量切分专家，每个 token 只组合 top-k 个专家。",
      "componentId": "hero-sparse"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "为什么要把密集模型改造成 MoE",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "第一问不是“MoE 有多大”，而是“为什么要从已有模型出发改造”。论文从训练成本与稳定性切入。",
      "analogy": {
        "title": "全奏还是分组？",
        "text": "不是让乐团变大，而是让每次演奏只唤醒需要的声部。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "两条路线：从零训练还是密集改造？",
          "desc": "点击路线按钮，比较论文图 7 的定性趋势；红色表示从零训练，绿色表示密集改造。损失面板越低越好，表现面板越高越好；曲线不当作精确数值重拟合。",
          "componentId": "basics-lab"
        }
      ],
      "insight": "问题不是“MoE 是否值得”，而是“能否避免从零训练的巨大代价”。",
      "takeaways": [
        {
          "icon": "🎼",
          "title": "规模与计算",
          "desc": "稀疏路由让总容量和单次激活量分离。"
        },
        {
          "icon": "🧭",
          "title": "研究路径",
          "desc": "论文从已有 LLaMA-2 7B 出发，而不是重新训练一个 MoE。"
        },
        {
          "icon": "⚠️",
          "title": "边界",
          "desc": "论文的对比是特定 30B-token 设置，不外推为普遍结论。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "先认识 LLaMA 的 FFN：三组投影",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "要切分专家，先要知道切分发生在 FFN 的哪个维度。",
      "analogy": {
        "title": "三条谱线",
        "text": "同一段音乐先展开、再门控、最后收束。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "点选 FFN 的三个投影",
          "desc": "点击 up、gate、down，观察一次前馈变换如何展开、门控并收束；橙色乘法节点表示 up 与 gate 的逐元素相乘，d 与 d_h 标注输入和中间维度。",
          "componentId": "basics-lab"
        }
      ],
      "formula": {
        "lead": "LLaMA 的 SwiGLU FFN 可以写成一次“扩展—门控—回收”的组合。",
        "unicode": "y = hW_down, h = xW_up ⊙ Swish(xW_gate)",
        "symbols": [
          {
            "sym": "x",
            "desc": "输入向量"
          },
          {
            "sym": "h",
            "desc": "中间隐藏状态"
          },
          {
            "sym": "W_up",
            "desc": "升维投影"
          },
          {
            "sym": "W_gate",
            "desc": "门控投影"
          },
          {
            "sym": "W_down",
            "desc": "降维投影"
          },
          {
            "sym": "⊙",
            "desc": "逐元素相乘"
          },
          {
            "sym": "Swish",
            "desc": "非线性激活函数"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧩",
          "title": "结构",
          "desc": "FFN 的三组投影共同完成一次前馈变换。"
        },
        {
          "icon": "✂️",
          "title": "切分位置",
          "desc": "专家从中间神经元索引集合构造。"
        },
        {
          "icon": "🚫",
          "title": "误读",
          "desc": "这是一个具体 SwiGLU FFN，不是所有前馈网络的定义。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "把 FFN 等分成专家",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "知道了神经元维度，下一步看论文如何把同一批神经元重新分组。",
      "analogy": {
        "title": "切成声部",
        "text": "每个声部只拿一部分谱线，合起来仍是原来的总谱。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "从密集神经元到 8 / 16 个专家",
          "desc": "逐步切换密集、8 专家、16 专家；用 32 个神经元槽位示意 d_h，专家大小满足 m=d_h/n，任意两组在独立切分下交集为空。",
          "componentId": "basics-lab"
        }
      ],
      "formula": {
        "lead": "独立切分把完整神经元集合分成互斥的等大小专家。",
        "unicode": "⋃ᵢ Sᵢ = U，Sᵢ ∩ Sⱼ = ∅ (i≠j)，m = d_h / n",
        "symbols": [
          {
            "sym": "U",
            "desc": "全部中间神经元索引"
          },
          {
            "sym": "Sᵢ",
            "desc": "第 i 个专家使用的索引集合"
          },
          {
            "sym": "d_h",
            "desc": "中间隐藏维度"
          },
          {
            "sym": "n",
            "desc": "专家数量"
          },
          {
            "sym": "m",
            "desc": "每个专家的神经元数量"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧠",
          "title": "总量不变",
          "desc": "神经元只被重新分组。"
        },
        {
          "icon": "➗",
          "title": "大小关系",
          "desc": "专家大小等于总中间维度除以专家数。"
        },
        {
          "icon": "🔍",
          "title": "关键限制",
          "desc": "独立切分强调互斥，后续会看到共享神经元的替代方案。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "MoE 层：top-k 路由与激活规模",
      "badge": "both",
      "badgeLabel": "基础 + 训练",
      "bridge": "专家已经切好，接下来要决定每个 token 应该叫醒哪些专家。",
      "analogy": {
        "title": "选谁演奏",
        "text": "每个 token 不需要全乐团一起发声，只选择最合适的几组。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "有效组合：2/8、4/16、2/16",
          "desc": "切换论文表 1 中的三种配置，观察“总专家数”和“每次激活专家数”是两个不同变量；论文门控采用 token-level noisy top-k gating 并加入负载均衡。",
          "componentId": "routing-lab"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "总参数不变，激活参数变化",
          "desc": "拖动配置滑块，区分约 7B 总参数与 3.0B / 3.5B 激活参数。",
          "componentId": "routing-lab"
        }
      ],
      "insight": "专家数量增加时，每个 token 仍然可以保持很小的激活集合。",
      "formula": {
        "lead": "MoE 层只把门控选中的专家输出加权相加。",
        "unicode": "y = Σ_{i∈K} G(x)ᵢ · Eᵢ(x)",
        "symbols": [
          {
            "sym": "x",
            "desc": "token 表示"
          },
          {
            "sym": "N",
            "desc": "专家总数"
          },
          {
            "sym": "k",
            "desc": "激活专家数"
          },
          {
            "sym": "Eᵢ",
            "desc": "第 i 个专家"
          },
          {
            "sym": "G(x)ᵢ",
            "desc": "门控权重"
          },
          {
            "sym": "K",
            "desc": "top-k 选中集合"
          },
          {
            "sym": "y",
            "desc": "MoE 输出"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "⚖️",
          "title": "路由与均衡",
          "desc": "每个 token 只组合 top-k 个专家；论文在门控中加入负载均衡。"
        },
        {
          "icon": "📏",
          "title": "参数",
          "desc": "总参数约 7B，激活参数约 3.0B 或 3.5B。"
        },
        {
          "icon": "🧭",
          "title": "配置",
          "desc": "2/8、4/16、2/16 是论文表格中的有效配置。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "为什么随机切分反而最好",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "既然专家来自同一批神经元，不同切分方式会带来什么差异？",
      "analogy": {
        "title": "四种分工",
        "text": "可以用随机、聚类或共享重要神经元，但排练结果并不相同。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "切换四种专家构造",
          "desc": "用 32 个神经元槽位比较四种分工：独立切分强调互斥，内共享和外共享用紫色表示跨专家复用，并给出论文的当前预算结论。",
          "componentId": "routing-lab"
        }
      ],
      "formula": {
        "lead": "共享方案先估计每个中间神经元的重要度。",
        "unicode": "v := v + Σ_{(x,y)∈D} |h ⊙ ∇_h L(x,y)|",
        "symbols": [
          {
            "sym": "v",
            "desc": "神经元重要度向量"
          },
          {
            "sym": "D",
            "desc": "用于估计的批次数据"
          },
          {
            "sym": "h",
            "desc": "中间激活"
          },
          {
            "sym": "∇_h L",
            "desc": "损失对中间激活的梯度"
          },
          {
            "sym": "⊙",
            "desc": "逐元素相乘"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎲",
          "title": "随机也有结构",
          "desc": "等分和不重叠本身就是约束。"
        },
        {
          "icon": "🧠",
          "title": "重要神经元",
          "desc": "共享可能保留通用能力，但也降低专家独立性。"
        },
        {
          "icon": "📊",
          "title": "结论边界",
          "desc": "这是论文 token budget 下的消融结果。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "重标定：少数组也要保持能量",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "只激活少数专家后，输出尺度会下降；论文用 N/k 补偿。",
      "analogy": {
        "title": "把音量抬回来",
        "text": "少数组演奏时，输出需要经过重标定才能保持有效。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "不重标定 vs 重标定",
          "desc": "从同一基线启动对比，观察 5B-token 消融中 ARC 与 Hella 的变化；灰色虚线是起始基线，红/绿色柱显示无缩放/有缩放结果。",
          "componentId": "routing-lab"
        }
      ],
      "takeaways": [
        {
          "icon": "⚖️",
          "title": "补偿机制",
          "desc": "输出乘以 N/k。"
        },
        {
          "icon": "📈",
          "title": "证据",
          "desc": "两个 benchmark 在 5B-token 消融中都提升。"
        },
        {
          "icon": "🧱",
          "title": "边界",
          "desc": "必须保留消融设置，不把提升写成普遍保证。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "持续预训练：采样、进度与损失",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "切分改变了网络结构，所以必须继续训练；训练目标沿用 LLaMA-2，数据来自 627B tokens 的 SlimPajama 七个领域。",
      "analogy": {
        "title": "排练什么",
        "text": "结构变了以后，需要继续排练，而不是直接交给下游任务。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "四种采样策略",
          "desc": "切换静态与动态数据权重，观察论文 30B-token 分析中的趋势差异。",
          "componentId": "training-lab"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "采样分析进度（30B）",
          "desc": "拖动 0–30B token 的采样分析进度；该预算只用于数据策略分析，最终模型训练使用 200B tokens。",
          "componentId": "training-lab"
        }
      ],
      "insight": "训练损失与下游效果不是同一条单调曲线。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两种预算",
          "desc": "30B tokens 用于采样与过滤分析；最终 LLaMA-MoE 用 200B tokens 继续预训练。"
        },
        {
          "icon": "⏱️",
          "title": "动态采样",
          "desc": "动态权重每 2.5B tokens 调整一次。"
        },
        {
          "icon": "🔬",
          "title": "判据",
          "desc": "训练 loss 与下游平均分数不能互相替代。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "交互式架构：每个 Transformer 层都有 MoE 块",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "把结构、路由、重标定和数据过滤合起来，才能看到完整的 LLaMA-MoE。",
      "analogy": {
        "title": "全谱排练",
        "text": "每层都有自己的分工，但所有层仍共同决定一段输出。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点选 LLaMA-MoE 的关键组件",
          "desc": "点击 Token、Gate、Experts、Re-scale、Output，查看活动路径；Gate 使用 noisy top-k 与负载均衡，专家输出再经过 N/k 重标定。",
          "componentId": "training-lab"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "数据过滤：更低的 loss 不一定更好",
          "desc": "切换原始、去低流畅、去广告，比较训练损失与下游平均分数；论文从 CommonCrawl 与 C4 约过滤 50% 广告和 15% 低流畅文本。",
          "componentId": "training-lab"
        }
      ],
      "formula": {
        "lead": "每层都使用同一类 top-k 专家组合公式，只是参数配置不同。",
        "unicode": "输出 = Σ_{i∈K} G(x)ᵢ · Eᵢ(x)",
        "symbols": [
          {
            "sym": "K",
            "desc": "当前 token 选择的专家集合"
          },
          {
            "sym": "G(x)ᵢ",
            "desc": "门控权重"
          },
          {
            "sym": "Eᵢ(x)",
            "desc": "专家输出"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🏗️",
          "title": "系统层",
          "desc": "每层 FFN 都可变成 MoE block。"
        },
        {
          "icon": "🎚️",
          "title": "重标定",
          "desc": "N/k 随配置变化，影响所选专家的输出尺度。"
        },
        {
          "icon": "🧹",
          "title": "数据质量",
          "desc": "低 loss 不是唯一目标，过滤策略要看下游表现。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "专家专业化与层级差异",
      "badge": "both",
      "badgeLabel": "基础 + 训练",
      "bridge": "路由不是完全均匀的；层深会改变专家偏好，也会暴露负载均衡问题。",
      "analogy": {
        "title": "谁在专门演奏",
        "text": "层越深，声部越像有各自擅长的曲目。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "拖动层深标记：查看 16 专家的路由偏好",
          "desc": "拖动标记到第 1、8、28、32 层，观察论文图 8 中 CommonCrawl 的实际路由计数。",
          "componentId": "analysis-lab"
        }
      ],
      "formula": {
        "lead": "论文把每个域的路由计数归一化为向量，再用 L2 距离比较相似性。",
        "unicode": "distance(a,b) = ||a − b||₂",
        "symbols": [
          {
            "sym": "a",
            "desc": "第一个域的路由向量"
          },
          {
            "sym": "b",
            "desc": "第二个域的路由向量"
          },
          {
            "sym": "||·||₂",
            "desc": "L2 范数"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧭",
          "title": "层级差异",
          "desc": "深层更特化，浅层更通用。"
        },
        {
          "icon": "🔁",
          "title": "共享专家",
          "desc": "不同领域之间也可能共享路由偏好。"
        },
        {
          "icon": "⚠️",
          "title": "负载问题",
          "desc": "第一、二层出现少数专家很少被选中的现象。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、指令微调与未决点",
      "badge": "both",
      "badgeLabel": "基础 + 训练",
      "bridge": "最后把论文的按规模对比与指令微调结果放回统一协议中比较，并明确最终训练成本和仍未解决的问题。",
      "analogy": {
        "title": "合奏成绩",
        "text": "不是只看总参数，而是看相似激活规模下的实际表现。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "同规模对比：LLaMA-MoE 的位置",
          "desc": "启动结果对比，查看论文表 2 的四个平均分；Average 由 SciQ、PIQA、WinoGrande、ARC-E、ARC-C、HellaSwag、LogiQA、BoolQ、LAMBADA、NQ、MMLU 组成，最终模型按 200B tokens 训练。",
          "componentId": "analysis-lab"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "指令微调：ARC-c、HellaSwag 与总体",
          "desc": "切换密集模型和指令微调结果，比较表 3 中三项指标；微调数据为 6k ShareGPT、训练 2 epochs。",
          "componentId": "analysis-lab"
        }
      ],
      "takeaways": [
        {
          "icon": "🏆",
          "title": "主结果",
          "desc": "LLaMA-MoE-3.5B(4/16) 的论文平均分为 57.7，表中 Sheared-LLaMA-2.7B 为 56.4。"
        },
        {
          "icon": "📈",
          "title": "指令微调",
          "desc": "6k ShareGPT、2 epochs 后，总体分数由 47.41 提升到 48.95。"
        },
        {
          "icon": "🚧",
          "title": "成本与未决",
          "desc": "最终主模型使用 112×A100、200B tokens；参考损失、广告过滤阈值和后层专家划分仍待研究。"
        }
      ],
      "insight": "主实验表 2 回答“同激活规模下表现如何”，表 3 进一步回答“指令微调后能否继续提升”。"
    }
  ]
};
