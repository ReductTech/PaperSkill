import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "LoRA: Low-Rank Adaptation of Large Language Models",
    "titleZh": "LoRA：大型语言模型的低秩适配",
    "venue": "ICLR 2022 · arXiv:2106.09685v2",
    "authors": "Edward J. Hu · Yelong Shen · Phillip Wallis · Zeyuan Allen-Zhu · Yuanzhi Li · Shean Wang · Lu Wang · Weizhu Chen",
    "affiliation": "Microsoft Corporation",
    "domain": "参数高效微调（PEFT）· 语言模型",
    "coreProblem": "大型预训练模型为每个下游任务全量微调，训练与存储成本高。",
    "coreInsight": "冻结预训练权重，只训练一个低秩的权重增量 <strong>ΔW = BA</strong>，用较少可训练参数完成任务适配。<br/><small><a href=\"https://arxiv.org/abs/2106.09685v2\" target=\"_blank\" rel=\"noopener noreferrer\">论文原文（v2）</a> · <a href=\"https://github.com/microsoft/LoRA\" target=\"_blank\" rel=\"noopener noreferrer\">官方代码</a></small>",
    "keywords": [
      "PEFT",
      "低秩增量",
      "冻结底座",
      "合并推理",
      "论文导读"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "全量微调：每个任务改动并保存整套权重。",
      "componentId": "lora-widget"
    },
    "newMethod": {
      "desc": "LoRA：共享冻结底座，只存任务专属的低秩因子。",
      "componentId": "lora-widget"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "为什么全量微调会变贵？",
      "badge": "inf",
      "badgeLabel": "背景",
      "bridge": "先看要解决的真实成本：一个预训练底座要服务多个不同任务。",
      "analogy": {
        "title": "为什么全量微调会变贵？",
        "text": "同一张照片要修出多种版本，若每次都重做并保存整张底片，版本越多越占空间。",
        "componentId": "lora-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "一份底座，多个任务",
          "desc": "切换“全量微调 / 共享底座”，观察任务数增加时，哪一部分被重复保存。全量微调还需为训练中的可更新权重维护梯度和优化器状态；图只解释权重副本，不把存储比等同训练显存。<br/><small>依据：论文 §1、§4.2；图为教学示意图。</small>",
          "componentId": "lora-widget"
        }
      ],
      "insight": "LoRA 的出发点：让不同任务共享同一份冻结底座，只另外保存小型任务更新；底座本身仍然存在。",
      "takeaways": [
        {
          "icon": "🧱",
          "title": "重复的底座",
          "desc": "全量微调通常为每个任务保存一套模型权重。"
        },
        {
          "icon": "💾",
          "title": "训练也昂贵",
          "desc": "更新大量权重还牵涉梯度与优化器状态。"
        },
        {
          "icon": "🎯",
          "title": "设计目标",
          "desc": "缩小需要训练和保存的任务专属部分。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "此前的方法有哪些取舍？",
      "badge": "inf",
      "badgeLabel": "背景",
      "bridge": "LoRA 不是“第一个少训练参数”的方法。先看作者希望避开的几种代价。",
      "analogy": {
        "title": "此前的方法有哪些取舍？",
        "text": "同一张照片可以换不同编辑工具，但有些工具会让处理流程更长，有些会占用画布。",
        "componentId": "lora-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "选择一种适配方法",
          "desc": "先只探索 LoRA 之前的三类思路：Adapter 加入可训练模块；Prefix/Prompt 学习特殊前缀；部分参数微调只动原模型的一小部分。点击各方案，观察其结构与取舍。具体性能依配置和任务变化。<br/><small>依据：论文 §2–3、表 1；图为教学示意图。</small>",
          "componentId": "lora-widget"
        }
      ],
      "insight": "论文关注的关键取舍：一些 Adapter 设计在所测配置下增加串行推理开销；Prefix 类方法占用序列预算。",
      "takeaways": [
        {
          "icon": "🔧",
          "title": "Adapter",
          "desc": "在模型内部加入可训练模块。"
        },
        {
          "icon": "🔤",
          "title": "Prefix / Prompt",
          "desc": "学习连续提示或前缀表示。"
        },
        {
          "icon": "📍",
          "title": "部分微调",
          "desc": "只更新选中的原模型参数。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "LoRA 改的究竟是什么？",
      "badge": "both",
      "badgeLabel": "关键",
      "bridge": "先把“模型要变”改写成“权重增量要变”，然后给增量加低秩约束。",
      "analogy": {
        "title": "LoRA 改的究竟是什么？",
        "text": "底片不动，在它上方移动一层透明调色片；最终画面改变，但底片本身没有重新绘制。",
        "componentId": "lora-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "冻结 W₀，训练 A 与 B",
          "desc": "拖动半透明层，观察基础权重 W₀ 保持不动，新增分支 BA 决定任务变化。A 的形状是 r×k，B 的形状是 d×r；低秩的是 ΔW，而不是 W₀。论文将 A 高斯随机初始化、B 初始化为零，因此开始时 BA=0。<br/><small>依据：Hu 等，arXiv:2106.09685v2，Figure 1；下方图为自制教学示意。</small>",
          "componentId": "lora-widget"
        }
      ],
      "insight": "“低秩”是对任务更新的建模假设。论文实验和后续分析支持它在所测任务中可行，但不构成所有任务都成立的定理。",
      "takeaways": [
        {
          "icon": "❄️",
          "title": "底座冻结",
          "desc": "训练时不更新 W₀。"
        },
        {
          "icon": "➕",
          "title": "只学增量",
          "desc": "新任务学到的是 BA。"
        },
        {
          "icon": "📐",
          "title": "低秩对象",
          "desc": "约束的是 ΔW，而非原始模型。"
        }
      ],
      "formula": {
        "lead": "先看论文最核心的分解，再把它代入一次线性变换。原文式 (3) 写成 h=W₀x+BAx；缩放因子 α/r 在式后文字中说明。",
        "unicode": "W′ = W₀ + ΔW， ΔW = BA； h = W₀x + BAx",
        "symbols": [
          {
            "sym": "W′",
            "desc": "适配新任务后的权重，等于原权重加任务增量。"
          },
          {
            "sym": "W₀",
            "desc": "冻结的预训练权重，形状 d×k。"
          },
          {
            "sym": "ΔW",
            "desc": "任务专属权重更新，形状 d×k。"
          },
          {
            "sym": "A",
            "desc": "可训练的低秩因子，形状 r×k。"
          },
          {
            "sym": "B",
            "desc": "可训练的低秩因子，形状 d×r；BA 与 ΔW 同形状。"
          },
          {
            "sym": "r",
            "desc": "选定的低秩维度，通常远小于 d、k。"
          },
          {
            "sym": "x, h",
            "desc": "x 是线性层输入，h 是加上任务增量后的输出。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "参数为什么少这么多？",
      "badge": "both",
      "badgeLabel": "关键",
      "bridge": "把矩阵拆成两个窄因子，参数计数从面积变成两条“边”。",
      "analogy": {
        "title": "参数为什么少这么多？",
        "text": "只保存一条窄调色带，比为同一张照片复制整块调色板轻得多。",
        "componentId": "lora-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "改变 r，观察参数量",
          "desc": "在一个 d=k=4096 的单矩阵教学例子里，调节 r。完整更新需要 4096×4096=16,777,216 个可训练参数；r=8 时，LoRA 仅需 4096×8+8×4096=65,536，即 1/256。<strong>这些维度只用于讲解，不是论文实验配置。</strong>",
          "componentId": "lora-widget"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "按步骤拆开矩阵",
          "desc": "依次看完整 ΔW、两个因子 A/B、最终参数计数。只比较一个矩阵的可训练更新量；模型的 W₀ 仍需存储和加载。<br/><small>依据：论文 §4.1 的矩阵形状与参数公式；交互为教学示意。</small>",
          "componentId": "lora-widget"
        }
      ],
      "insight": "参数节省来自 r(d+k) ≪ dk；它不意味着推理时可以省去原始大模型。",
      "takeaways": [
        {
          "icon": "🧮",
          "title": "按形状计数",
          "desc": "dk 对比 r(d+k)，范围是单个权重矩阵。"
        },
        {
          "icon": "🧪",
          "title": "例子非实验",
          "desc": "4096 与 r=8 是教学数字。"
        },
        {
          "icon": "🧱",
          "title": "底座仍在",
          "desc": "LoRA 没有消除 W₀ 的存储与加载。"
        }
      ],
      "formula": {
        "lead": "若 W₀∈ℝᵈˣᵏ，完整更新与低秩因子的可训练参数数分别为：",
        "unicode": "完整更新：dk；LoRA：r(d+k)，其中 r ≪ min(d,k)",
        "symbols": [
          {
            "sym": "d, k",
            "desc": "原稠密权重的输出维和输入维。"
          },
          {
            "sym": "r",
            "desc": "低秩因子的中间维度。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "LoRA 加在 Transformer 哪里？",
      "badge": "trn",
      "badgeLabel": "结构",
      "bridge": "低秩增量是通用稠密层想法，但要看论文实际上放在了哪里。",
      "analogy": {
        "title": "LoRA 加在 Transformer 哪里？",
        "text": "一个取景框里有四块区域；论文主实验重点调整其中两块，其他位置用于比较。",
        "componentId": "lora-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "点选注意力投影",
          "desc": "点击 Wq、Wk、Wv、Wo，或选择 Wq+Wv。论文主实验重点在 query 与 value 投影加入 LoRA，并冻结 MLP；原则上也可用于其他稠密矩阵。这里的四投影路径是简化示意图。<br/><small>依据：论文 §4.2、§5.1。</small>",
          "componentId": "lora-widget"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "相近预算的位置消融",
          "desc": "在 GPT-3 175B 约 18M 可训练参数的预算下，切换注意力投影组合，比较 WikiSQL 与 MNLI 的验证准确率。两项任务的最佳位置并不完全相同。<br/><small>来源：论文表 5；Wq+Wv 不是所有任务的绝对最优配置。</small>",
          "componentId": "lora-widget"
        }
      ],
      "insight": "在相近参数预算下，把更新合理分配到多个投影有竞争力；具体最佳位置依任务而变。",
      "takeaways": [
        {
          "icon": "🔎",
          "title": "主实验",
          "desc": "重点修改 Wq、Wv。"
        },
        {
          "icon": "🧊",
          "title": "保持冻结",
          "desc": "原预训练权重及 MLP 不因 LoRA 主设置而全量更新。"
        },
        {
          "icon": "⚖️",
          "title": "位置要选",
          "desc": "表 5 的不同任务偏好不完全一致。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "合并后如何推理？",
      "badge": "inf",
      "badgeLabel": "背景",
      "bridge": "LoRA 训练时保留低秩分支；部署时可将更新加回原矩阵。",
      "analogy": {
        "title": "合并后如何推理？",
        "text": "将调色层压入成片，展示时只需读取合成后的图像。",
        "componentId": "lora-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "从训练态走到合并态",
          "desc": "逐步看冻结底座、任务因子、合并后的稠密权重，以及切换多任务时的限制。<strong>无额外推理层/延迟</strong>是指已将 LoRA 增量合并回 W₀、并与相同稠密结构比较；未合并的计算方式不在此结论内。<br/><small>依据：论文 §4.1–4.2。</small>",
          "componentId": "lora-widget"
        }
      ],
      "insight": "合并并不会消除原权重；多个任务各自已合并的 LoRA，也不便直接在同一批次动态混用。",
      "takeaways": [
        {
          "icon": "⚙️",
          "title": "训练双分支",
          "desc": "W₀ 冻结，A/B 可训练。"
        },
        {
          "icon": "🧩",
          "title": "部署可合并",
          "desc": "合并后用同形状稠密层推理。"
        },
        {
          "icon": "⚠️",
          "title": "条件要写清",
          "desc": "未合并或批内多任务混用是不同情形。"
        }
      ],
      "formula": {
        "lead": "原文以 W₀+BA 简写合并。若 A、B 保持未缩放，按论文 §4.1 将 LoRA 分支乘 α/r 后，部署时应把这一缩放后的增量合并：",
        "unicode": "Wmerged = W₀ + (α/r)BA",
        "symbols": [
          {
            "sym": "Wmerged",
            "desc": "合并后的任务专属稠密权重。"
          },
          {
            "sym": "BA",
            "desc": "训练得到的低秩因子乘积；若缩放已吸收到因子中，合并式可简写为 W₀+BA。"
          },
          {
            "sym": "α/r",
            "desc": "论文 §4.1 对 LoRA 分支使用的缩放；α 是超参数，r 是所选 rank。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "与其他方法如何比较？",
      "badge": "both",
      "badgeLabel": "关键",
      "bridge": "回到第 2 节，把四种方案放在同一套比较维度上。",
      "analogy": {
        "title": "与其他方法如何比较？",
        "text": "比较修图工具，要问“改哪里、保存什么、展示时是否还要额外步骤”。",
        "componentId": "lora-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "切换方法比较",
          "desc": "第 2 节已介绍各方法的动机。现在以 LoRA 为参照，按训练对象、推理结构、任务存储三项维度比较设计取舍；这里不做跨论文性能排名。<br/><small>依据：论文 §2–4、表 1。</small>",
          "componentId": "lora-widget"
        }
      ],
      "insight": "LoRA 的独特组合是：保留原层形状、训练低秩更新、合并后不另加串行层。",
      "takeaways": [
        {
          "icon": "📦",
          "title": "Full FT",
          "desc": "改动整个底座，任务副本大。"
        },
        {
          "icon": "🧱",
          "title": "Adapter / Prefix",
          "desc": "各自引入模块或前缀的代价。"
        },
        {
          "icon": "🟢",
          "title": "LoRA",
          "desc": "小型任务因子可并入原权重。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "论文验证了哪些任务？",
      "badge": "trn",
      "badgeLabel": "结构",
      "bridge": "看结果前先看实验覆盖：模型、数据集和指标必须配对阅读。",
      "analogy": {
        "title": "论文验证了哪些任务？",
        "text": "用放大镜检查不同照片时，要按各自的检验标准评估，不能把两种刻度混算。",
        "componentId": "lora-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点选模型，看任务与指标",
          "desc": "RoBERTa、DeBERTa 用 GLUE 文本理解任务；GPT-2 做 E2E 等文本生成；GPT-3 验证 WikiSQL、MNLI 与 SAMSum 等。E2E 看 BLEU，MNLI/WikiSQL 看准确率；不同指标不能直接横比。论文部分 Full FT 基线摘自既有工作。<br/><small>依据：论文 §5、表 2–4。</small>",
          "componentId": "lora-widget"
        }
      ],
      "insight": "论文在语言模型的理解与生成任务上做了广泛实验；这些实验本身不验证视觉语言或用户长期个性化。",
      "takeaways": [
        {
          "icon": "🧠",
          "title": "理解",
          "desc": "RoBERTa / DeBERTa 与 GLUE。"
        },
        {
          "icon": "✍️",
          "title": "生成",
          "desc": "GPT-2 与 E2E 等任务。"
        },
        {
          "icon": "📊",
          "title": "大模型",
          "desc": "GPT-3 与 WikiSQL、MNLI、SAMSum。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "结果与消融支持什么？",
      "badge": "both",
      "badgeLabel": "关键",
      "bridge": "只挑最能说明“少训练参数”和“具体任务效果”的论文数字。",
      "analogy": {
        "title": "结果与消融支持什么？",
        "text": "同一张成片只在相同的评测标准下比较；若换任务或指标，就要换一张对照卡。",
        "componentId": "lora-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "三组代表性结果",
          "desc": "按同一任务的指标比较参数与效果。WikiSQL：LoRA 73.4、Full FT 73.8，论文报告约 ±0.5% 波动。GPT-2 的 Full FT 基线来自既有工作；LoRA E2E BLEU 旁的 ±0.1 是表 3 的置信区间。<br/><small>来源：论文表 3、表 4；图为重排对照。</small>",
          "componentId": "lora-widget"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "rank 越大越好吗？",
          "desc": "GPT-3 175B 的 Wq+Wv 设置下，表 6 比较 r=1、2、4、8、64 的 WikiSQL 验证准确率。结果不随 rank 单调提高；最大点差 0.5 个百分点，与论文报告约 ±0.5 个百分点的波动同量级，不能据此排出稳定的最佳 r 或推广到所有任务。<br/><small>来源：论文表 6；点图按表中数字重绘。</small>",
          "componentId": "lora-widget"
        }
      ],
      "insight": "在所测任务中，LoRA 以少量可训练参数获得有竞争力的结果；性能高低随任务、位置和 rank 而变化。",
      "takeaways": [
        {
          "icon": "📉",
          "title": "参数骤降",
          "desc": "GPT-3 表 4：175,255.8M 对 4.7M。"
        },
        {
          "icon": "🎯",
          "title": "结果分任务",
          "desc": "MNLI 有优势；WikiSQL 略低且差值处于报告波动范围。"
        },
        {
          "icon": "📈",
          "title": "rank 非单调",
          "desc": "表 6 的 r=64 未超过 r=8；点差与报告波动同量级。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "LoRA 的局限与后续四篇",
      "badge": "both",
      "badgeLabel": "关键",
      "bridge": "把 LoRA 的贡献放在适用范围内，也看清下一篇为什么要走向视觉语言。",
      "analogy": {
        "title": "LoRA 的局限与后续四篇",
        "text": "装框时写清作品的适用范围：这张图解释适配成本，但不能证明所有交互需求已解决。",
        "componentId": "lora-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "逐项看边界与后续问题",
          "desc": "上方已列出四项边界。这里逐步查看它们如何影响使用情境，再点选五篇路线的节点，阅读每篇要追问的问题。<br/><small>依据：论文 §4.2、§5、§7；路线为本项目组织方式。</small>",
          "componentId": "lora-widget"
        }
      ],
      "insight": "LoRA 回答“如何低成本适配大模型”。后续页面将依次研究视觉语言适配、用户特有视觉概念、多模态助手、长期个性化。",
      "takeaways": [
        {
          "icon": "✅",
          "title": "真正贡献",
          "desc": "低秩任务增量、参数节省、可合并推理与实验证据。"
        },
        {
          "icon": "🧭",
          "title": "研究边界",
          "desc": "原论文主要验证语言模型，没有长期记忆与用户偏好机制。"
        },
        {
          "icon": "➡️",
          "title": "后续四篇",
          "desc": "VL-Adapter → MyVLM → Yo'LLaVA → PersonaVLM。"
        }
      ]
    }
  ]
};
