import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "LoRA: Low-Rank Adaptation of Large Language Models",
    "titleZh": "LoRA：大语言模型的低秩适配",
    "venue": "arXiv:2106.09685v2 · 2021",
    "authors": "Edward Hu 等",
    "affiliation": "Microsoft Corporation",
    "domain": "参数高效微调 · Transformer · 大语言模型",
    "coreProblem": "完整微调会为每个下游任务保存一套与基础模型同规模的更新，训练显存、存储和服务切换成本随模型规模迅速上升。",
    "coreInsight": "冻结预训练权重，只学习两个小型低秩矩阵 <b>A、B</b> 来表示任务更新；训练时节省可训练参数和优化器状态，部署时还能把更新合并回原权重。",
    "keywords": [
      "低秩分解",
      "参数高效微调",
      "零额外推理层"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "每个任务都保存一整套参数更新：模型越大、任务越多，副本越沉重。",
      "componentId": "lora-lab"
    },
    "newMethod": {
      "desc": "共享冻结的基础模型，每个任务只携带一组小型低秩因子，并可在部署前合并。",
      "componentId": "lora-lab"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "复制大模型的代价",
      "badge": "trn",
      "badgeLabel": "问题",
      "bridge": "先不看 LoRA 的结构，先体验完整微调在多任务部署中如何累积成本。",
      "analogy": {
        "title": "每场都搬整本谱",
        "text": "基础总谱很厚；若每场演出都复制整本，任务数量一多，搬运与存放就成为主要负担。",
        "componentId": "lora-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "任务一多，副本如何增长？",
          "desc": "拖动任务数。完整微调需要为每个任务保存与基础模型同维度的更新，红色存储条会随任务数增长。",
          "componentId": "lora-lab"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "改变的是每任务增量",
          "desc": "在相同任务数下切换完整微调与参数高效更新，观察总存储的缩放方式。",
          "componentId": "lora-lab"
        }
      ],
      "insight": "瓶颈不只是一次训练，而是每个任务都要长期保存、加载和切换一份巨大的更新。",
      "formula": {
        "lead": "把任务数记为 T，多任务部署的核心差别可以写成：",
        "unicode": "总存储 ≈ |Φ₀| + T·|ΔΦ|",
        "symbols": [
          {
            "sym": "Φ₀",
            "desc": "共享的预训练模型参数"
          },
          {
            "sym": "ΔΦ",
            "desc": "每个任务需要保存的参数增量"
          },
          {
            "sym": "T",
            "desc": "下游任务数量"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "1",
          "title": "成本按任务累积",
          "desc": "完整微调的任务增量与基础模型同维度。"
        },
        {
          "icon": "2",
          "title": "规模放大问题",
          "desc": "175B 级模型让每个副本都十分昂贵。"
        },
        {
          "icon": "3",
          "title": "目标是压缩更新",
          "desc": "共享基础模型，同时缩小每任务新增参数。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "为什么可以尝试低秩",
      "badge": "both",
      "badgeLabel": "假设",
      "bridge": "如果任务更新真正有用的变化只集中在少数方向，就不必学习完整的稠密矩阵。",
      "analogy": {
        "title": "只圈出关键声部",
        "text": "编曲者不重写整本总谱，而是圈出少数决定改编风格的声部，让有限批注承载主要变化。",
        "componentId": "lora-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "用少数方向重建变化",
          "desc": "选择保留的方向数，观察低秩重建如何逐步覆盖目标更新。",
          "componentId": "lora-lab"
        }
      ],
      "insight": "LoRA 对适配产生的更新 ΔW 施加低秩约束，预训练权重 W₀ 保持冻结。",
      "formula": {
        "lead": "用 r 限制任务更新能使用的独立方向数：",
        "unicode": "rank(ΔW) ≤ r ≪ min(d, k)",
        "symbols": [
          {
            "sym": "ΔW",
            "desc": "任务特定的权重更新"
          },
          {
            "sym": "r",
            "desc": "允许使用的低秩维度"
          },
          {
            "sym": "d,k",
            "desc": "原权重的输出与输入维度"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "1",
          "title": "压缩更新",
          "desc": "基础权重仍可保持完整表达能力。"
        },
        {
          "icon": "2",
          "title": "少数方向",
          "desc": "低秩把任务变化限制在小子空间。"
        },
        {
          "icon": "3",
          "title": "任务适配",
          "desc": "合适的低秩维度取决于任务与数据。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "两个小矩阵如何改写更新",
      "badge": "both",
      "badgeLabel": "方法",
      "bridge": "低秩假设落实为一个可训练的旁路：先降到 r 维，再升回输出维度。",
      "analogy": {
        "title": "把批注叠回总谱",
        "text": "公共总谱保持不动，窄小的任务批注只补充差异；两者相加形成当前任务的演奏版本。",
        "componentId": "lora-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "沿着低秩旁路走一遍",
          "desc": "逐步查看输入经过 A 降维、B 升维，再与冻结路径相加的过程。每一步都标出当前向量维度。",
          "componentId": "lora-lab"
        }
      ],
      "insight": "A 与 B 是唯一的大块可训练参数；B 从零初始化，使训练开始时 ΔW=0，不会突然改变基础模型。",
      "formula": {
        "lead": "同一个输入同时经过冻结主路和可训练低秩旁路：",
        "unicode": "h = W₀x + (α/r)BAx",
        "symbols": [
          {
            "sym": "W₀",
            "desc": "冻结的 d×k 预训练权重"
          },
          {
            "sym": "A",
            "desc": "r×k 的降维因子"
          },
          {
            "sym": "B",
            "desc": "d×r 的升维因子"
          },
          {
            "sym": "α/r",
            "desc": "控制更新尺度的缩放项"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "1",
          "title": "主路冻结",
          "desc": "W₀ 不接收梯度更新。"
        },
        {
          "icon": "2",
          "title": "旁路低秩",
          "desc": "A、B 通过 r 维瓶颈表达 ΔW。"
        },
        {
          "icon": "3",
          "title": "初始不扰动",
          "desc": "B=0 让初始输出等于基础模型。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "LoRA 放在 Transformer 哪里",
      "badge": "trn",
      "badgeLabel": "结构",
      "bridge": "LoRA 可以作用于稠密层，但论文主要研究自注意力中的投影矩阵，并在多数实验选择 Wq 与 Wv。",
      "analogy": {
        "title": "批注夹在哪个声部",
        "text": "同样数量的批注夹，夹在不同声部会改变覆盖范围；位置选择与每处批注容量必须一起考虑。",
        "componentId": "lora-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "点选注意力投影",
          "desc": "点击结构节点查看 LoRA 的可选落点；论文主实验在注意力投影上使用 LoRA，并冻结 MLP。",
          "componentId": "lora-lab"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "18M 参数预算如何分配",
          "desc": "在固定预算下选择投影组合。覆盖更多矩阵时，每个矩阵可用的秩会下降，结果来自论文表 5。",
          "componentId": "lora-lab"
        }
      ],
      "insight": "论文多数实验采用 Wq 与 Wv 作为兼顾参数预算与效果的实用组合。",
      "takeaways": [
        {
          "icon": "1",
          "title": "方法可泛化",
          "desc": "任意稠密权重都可采用低秩更新。"
        },
        {
          "icon": "2",
          "title": "实验重点",
          "desc": "主实验聚焦注意力投影并冻结 MLP。"
        },
        {
          "icon": "3",
          "title": "位置与秩耦合",
          "desc": "固定预算下，覆盖面越大，每处秩越小。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "训练、合并与任务切换",
      "badge": "both",
      "badgeLabel": "运行",
      "bridge": "LoRA 的优势不仅来自参数量，还来自训练时冻结主干、部署时可合并、切换时只替换小模块。",
      "analogy": {
        "title": "覆盖一张任务批注",
        "text": "总谱常驻，任务批注可以覆盖后演奏，也可以保留为独立薄页随时替换。",
        "componentId": "lora-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "三种运行状态",
          "desc": "切换训练、合并推理和动态任务模式，观察哪些矩阵可训练、前向路径是否增加，以及任务切换方式。",
          "componentId": "lora-lab"
        }
      ],
      "insight": "合并后的 W 与普通稠密权重形状相同，因此不会额外增加一层；但同一批次混用不同任务因子会更难处理。",
      "formula": {
        "lead": "部署前可把任务更新直接吸收到权重中：",
        "unicode": "W = W₀ + BA",
        "symbols": [
          {
            "sym": "W",
            "desc": "合并后用于推理的权重"
          },
          {
            "sym": "BA",
            "desc": "当前任务的低秩更新"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "1",
          "title": "训练省状态",
          "desc": "冻结参数无需梯度和 Adam 优化器状态。"
        },
        {
          "icon": "2",
          "title": "合并省延迟",
          "desc": "部署前相加后保持原有前向结构。"
        },
        {
          "icon": "3",
          "title": "切换有取舍",
          "desc": "独立因子灵活，合并权重延迟最低。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "跨模型实验结果",
      "badge": "inf",
      "badgeLabel": "实验",
      "bridge": "作者从 RoBERTa、DeBERTa 到 GPT-2、GPT-3 检查 LoRA，覆盖语言理解与生成任务。",
      "analogy": {
        "title": "同一批注参加多场演出",
        "text": "评审逐场打分，同时记录携带的谱页重量；效果与参数量必须放在同一实验协议中阅读。",
        "componentId": "lora-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "按协议检查三组证据",
          "desc": "选择模型与数据集，分别比较 LoRA 和完整微调的可训练参数与对应任务指标。",
          "componentId": "lora-lab"
        }
      ],
      "insight": "在论文覆盖的模型、任务与训练设置中，LoRA 以更少可训练参数匹配或超过完整微调基线。",
      "takeaways": [
        {
          "icon": "1",
          "title": "覆盖 NLU 与 NLG",
          "desc": "证据不只来自单一任务类型。"
        },
        {
          "icon": "2",
          "title": "参数显著减少",
          "desc": "从百万级到数十亿级模型都减少可训练参数。"
        },
        {
          "icon": "3",
          "title": "协议必须保留",
          "desc": "数据集、指标和误差范围决定可比性。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "固定预算该适配哪些投影",
      "badge": "both",
      "badgeLabel": "消融",
      "bridge": "同样是 18M 可训练参数，可以集中给一个投影较高秩，也可以分给多个投影较低秩。",
      "analogy": {
        "title": "有限标记如何分配",
        "text": "编曲者把有限批注夹分给不同声部；关键不只是每个夹子写多少，还包括覆盖哪些声部。",
        "componentId": "lora-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "复现实验的预算分配",
          "desc": "选择论文表 5 中的七种配置，秩和 WikiSQL、MultiNLI 验证准确率会同步更新。",
          "componentId": "lora-lab"
        }
      ],
      "insight": "Wq+Wv 是整体表现很强的两投影组合；全四投影在 MultiNLI 更高，并在 WikiSQL 与 Wq+Wv 持平。",
      "takeaways": [
        {
          "icon": "1",
          "title": "固定总预算",
          "desc": "比较位置时必须同时调整秩。"
        },
        {
          "icon": "2",
          "title": "覆盖优于独占",
          "desc": "Wq+Wv 优于把更高秩只给 Wq 或 Wv。"
        },
        {
          "icon": "3",
          "title": "不存在单格全胜",
          "desc": "配置选择仍取决于任务指标。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "r 越大越好吗",
      "badge": "inf",
      "badgeLabel": "秩消融",
      "bridge": "如果容量越大效果越好，曲线应随 r 单调上升；论文表 6 给出了不同的观察。",
      "analogy": {
        "title": "声部够用，不必堆满",
        "text": "指挥调节改编声部数；少数关键声部到位后，继续增加并不一定让演出更好。",
        "componentId": "lora-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "让实验点严格落在曲线上",
          "desc": "选择数据集、投影组合和 r，观察验证准确率随秩变化的曲线。",
          "componentId": "lora-lab"
        }
      ],
      "insight": "在 WikiSQL 与 MultiNLI 上，Wq+Wv 的 r=1 已有竞争力；合适的秩会随任务和投影位置变化。",
      "takeaways": [
        {
          "icon": "1",
          "title": "不保证单调",
          "desc": "更大的 r 没有稳定带来更高验证准确率。"
        },
        {
          "icon": "2",
          "title": "位置影响秩需求",
          "desc": "只适配 Wq 时更依赖较高秩。"
        },
        {
          "icon": "3",
          "title": "任务差异",
          "desc": "分布差异大的任务可能需要更高秩。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "低秩为什么可能有效",
      "badge": "inf",
      "badgeLabel": "机制",
      "bridge": "性能消融说明小秩可用，子空间分析进一步追问：不同秩、不同随机种子学到的方向是否稳定。",
      "analogy": {
        "title": "照亮原谱中的暗线",
        "text": "窄光束没有重画总谱，而是照亮其中原本存在但不突出的旋律，形成任务需要的强调。",
        "componentId": "lora-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "拖动查看子空间重合",
          "desc": "在 8×8 相似度热图中拖动选择 i、j，观察主要方向之间的归一化重合程度。",
          "componentId": "lora-lab"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "更新放大了哪些方向",
          "desc": "切换 ΔW、W 与随机子空间，并选择 r=4 或 64，比较表 7 的投影范数。",
          "componentId": "lora-lab"
        }
      ],
      "insight": "这些结果支持“有效更新集中在少数方向，并放大基础模型中未被强调的特征”这一解释。",
      "formula": {
        "lead": "论文用归一化 Frobenius 范数度量两个奇异向量子空间的重合：",
        "unicode": "φ = ||UᵀᵢUⱼ||²F / min(i,j) ∈ [0,1]",
        "symbols": [
          {
            "sym": "Uᵢ,Uⱼ",
            "desc": "两个低秩解的前 i、j 个奇异向量"
          },
          {
            "sym": "φ",
            "desc": "0 表示分离，1 表示完全重合"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "1",
          "title": "顶层方向稳定",
          "desc": "r=8 与 r=64 的首要方向有明显重合。"
        },
        {
          "icon": "2",
          "title": "非随机结构",
          "desc": "随机高斯矩阵没有同样的公共方向。"
        },
        {
          "icon": "3",
          "title": "像任务放大器",
          "desc": "ΔW 可能增强预训练中未突出的相关特征。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "从训练到部署的选择",
      "badge": "both",
      "badgeLabel": "决策",
      "bridge": "把低秩假设、训练节省、合并部署与实验结果放回一个决策框架。",
      "analogy": {
        "title": "一份总谱，多张薄批注",
        "text": "共享总谱长期保留，不同演出只收纳各自的薄批注；需要混合演奏时，再决定是否提前合并。",
        "componentId": "lora-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "按部署场景选择运行方式",
          "desc": "选择部署场景，得到合并 LoRA、动态 LoRA 或调整秩与落点的建议。",
          "componentId": "lora-lab"
        }
      ],
      "insight": "LoRA 用可训练、可部署的低秩约束表示任务更新，以极少任务参数获得接近完整微调的效果。",
      "takeaways": [
        {
          "icon": "1",
          "title": "压缩任务差异",
          "desc": "共享预训练模型，单独保存低秩更新。"
        },
        {
          "icon": "2",
          "title": "部署模式可选",
          "desc": "合并追求最低延迟，分离追求灵活切换。"
        },
        {
          "icon": "3",
          "title": "按任务配置",
          "desc": "秩、目标矩阵与组合方式随任务需求调整。"
        }
      ]
    }
  ]
};
