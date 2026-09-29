import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "LoRA: Low-Rank Adaptation of Large Language Models",
    "titleZh": "LoRA：大语言模型的低秩适配",
    "venue": "arXiv:2106.09685v2 · 2021",
    "authors": "Edward Hu, Yelong Shen, Phillip Wallis, Zeyuan Allen-Zhu, Yuanzhi Li, Shean Wang, Lu Wang, Weizhu Chen",
    "affiliation": "Microsoft Corporation · Carnegie Mellon University",
    "domain": "参数高效微调 · Transformer · NLP",
    "coreProblem": "超大模型的全量微调让训练显存、优化器状态、任务检查点和部署切换成本一起膨胀。",
    "coreInsight": "你将作为模型适配工程师，从一次失败的全量微调实验出发，亲手发现任务更新 ΔW 可以用低秩 BA 表达，并完成冻结、选 rank、选插入位置、合并与任务切换。",
    "keywords": [
      "LoRA",
      "低秩适配",
      "互动实验",
      "蒸汽朋克实验室"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "<b>Full Fine-Tuning</b>：每个任务都推动整台 175B 引擎，显存与检查点迅速进入红区。",
      "componentId": "lora-ch1"
    },
    "newMethod": {
      "desc": "<b>LoRA</b>：冻结基座，只训练小型低秩支路；部署前还能合并回主权重。",
      "componentId": "lora-ch9"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "ACT 0 — Full Fine-Tuning Crisis",
      "badge": "inf",
      "badgeLabel": "直觉入门",
      "bridge": "你刚接管维多利亚模型适配工厂的夜班。每一张新任务单，都要求这台 175B 思维机器重新学习。",
      "analogy": {
        "title": "Overloaded Engine",
        "text": "接收任务、启动全量微调，并观察整台 175B 思维机器的代价。",
        "componentId": "lora-ch1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "启动 Full Fine-Tune",
          "desc": "收到任务后，解锁整台机器的全部 175B 参数。",
          "componentId": "lora-ch1"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "连续接收任务",
          "desc": "为每个新任务保存一份完整的 175B 模型副本。",
          "componentId": "lora-ch1"
        }
      ],
      "insight": "Do we really need to modify the whole machine?",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "参数",
          "desc": "模型内部可学习的数值旋钮。"
        },
        {
          "icon": "🔧",
          "title": "Fine-Tuning",
          "desc": "在任务数据上继续训练预训练模型。"
        },
        {
          "icon": "✨",
          "title": "Optimizer State",
          "desc": "Adam 还需为可训练参数保存额外状态。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "ACT 1 — Existing Solution Museum",
      "badge": "inf",
      "badgeLabel": "方法比较",
      "bridge": "进入旧机械博物馆，依次操作 Full Fine-Tuning、Adapter 与 Prefix Tuning 三座展台。",
      "analogy": {
        "title": "Gallery of Old Solutions",
        "text": "转动整机手轮、插入 Adapter、增加 Prefix token，亲手观察三种适配方式留下的代价。",
        "componentId": "lora-ch2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "操作三座机械展台",
          "desc": "依次观察整机改写、网络深度增加与输入空间缩短。",
          "componentId": "lora-ch2"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "寻找三种代价之外的路线",
          "desc": "在展厅熄灯后，用三个问题限定下一种设计必须避免的代价。",
          "componentId": "lora-ch2"
        }
      ],
      "insight": "Can we adapt without adding depth, consuming input space, or rewriting everything?",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "Transformer",
          "desc": "由多层注意力与前馈模块组成的序列模型。"
        },
        {
          "icon": "🔧",
          "title": "Self-Attention",
          "desc": "让 token 按相关性读取其他 token。"
        },
        {
          "icon": "✨",
          "title": "Inference",
          "desc": "训练完成后，模型处理新输入的过程。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "ACT 2 — What Really Changes?",
      "badge": "both",
      "badgeLabel": "核心洞察",
      "bridge": "把预训练权重与微调后权重送上机械解剖台，分离并观察任务相关的变化。",
      "analogy": {
        "title": "DeltaW Autopsy",
        "text": "用显影滑杆观察 W′、W₀ 与 ΔW 的关系，最后锁住共享基座。",
        "componentId": "lora-ch3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "把改动从基座中剥离",
          "desc": "<b>提出问题：</b>拖动探照灯，把共享权重 W₀ 与任务变化 ΔW 分开。 <b>先预测，再操作；</b>结果出现后才展开论文解释。",
          "componentId": "lora-ch3"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "选择冻结或改写",
          "desc": "<b>提出问题：</b>锁住或解锁 W₀，观察共享基座与任务副本的差别。 <b>先预测，再操作；</b>结果出现后才展开论文解释。",
          "componentId": "lora-ch3"
        }
      ],
      "insight": "微调后的模型不是凭空出现：它由预训练权重 W₀ 与任务相关更新 ΔW 共同组成。",
      "formula": {
        "lead": "互动后再写成一行：任务权重等于共享基座加任务增量。",
        "unicode": "<span class=\"sym\">W</span> = <span class=\"sym\">W₀</span> + <span class=\"sym\">ΔW</span>",
        "symbols": [
          {
            "sym": "W₀",
            "desc": "预训练权重矩阵，LoRA 中保持冻结。"
          },
          {
            "sym": "ΔW",
            "desc": "下游任务学习到的权重增量。"
          },
          {
            "sym": "W",
            "desc": "适配后的任务权重。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "W₀",
          "desc": "共享的预训练知识。"
        },
        {
          "icon": "🔧",
          "title": "ΔW",
          "desc": "任务适配真正新增的变化。"
        },
        {
          "icon": "✨",
          "title": "Frozen Parameter",
          "desc": "不接收梯度更新的参数。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "ACT 3 — Low-Rank Lab",
      "badge": "both",
      "badgeLabel": "矩阵直觉",
      "bridge": "面对 4096×4096 的巨大 ΔW 矩阵墙，先通过机械音乐盒理解“独立方向”，再扫描它的内在结构。",
      "analogy": {
        "title": "Low-Rank Lab",
        "text": "许多可见运动可能只由少数主轴驱动；扫描 ΔW，寻找相同的结构线索。",
        "componentId": "lora-ch4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "亲手拆出 B × A",
          "desc": "<b>提出问题：</b>拖动 rank 手柄，把完整 ΔW 拆成两块窄矩阵并实时计算参数量。 <b>先预测，再操作；</b>结果出现后才展开论文解释。",
          "componentId": "lora-ch4"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "独立方向实验",
          "desc": "<b>提出问题：</b>选择允许通过的独立轨道数，观察表达能力与冗余。 <b>先预测，再操作；</b>结果出现后才展开论文解释。",
          "componentId": "lora-ch4"
        }
      ],
      "insight": "Rank 描述系统真正独立的信息方向数量，而不是表面上有多少个零件或参数。",
      "formula": {
        "lead": "现在把刚才的窄通道写成矩阵乘积。",
        "unicode": "<span class=\"sym\">ΔW</span> = <span class=\"sym\">B</span><span class=\"sym\">A</span>",
        "symbols": [
          {
            "sym": "B",
            "desc": "d×r 的可训练矩阵，把低维方向映回输出空间。"
          },
          {
            "sym": "A",
            "desc": "r×k 的可训练矩阵，把输入压到低秩空间。"
          },
          {
            "sym": "r",
            "desc": "低秩通道宽度，远小于 d 与 k。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "Matrix",
          "desc": "按行列组织数字、执行线性变换。"
        },
        {
          "icon": "🔧",
          "title": "Rank",
          "desc": "矩阵中独立方向的数量。"
        },
        {
          "icon": "✨",
          "title": "Low Rank",
          "desc": "用少数方向承载主要变化。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "ACT 4 — Freeze & Train",
      "badge": "trn",
      "badgeLabel": "训练机制",
      "bridge": "分解完成后，谁该训练、谁该冻结？请亲自配置梯度开关，错误配置会立刻暴露。",
      "analogy": {
        "title": "实验日志 05",
        "text": "<b>Level 1：</b>冰霜锁固定主引擎，只有旁路阀门随训练脉冲转动。",
        "componentId": "lora-ch5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "配置训练开关",
          "desc": "<b>提出问题：</b>切换 W₀、A、B 的冻结状态并执行一步训练。 <b>先预测，再操作；</b>结果出现后才展开论文解释。",
          "componentId": "lora-ch5"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "沿前向路径走一次",
          "desc": "<b>提出问题：</b>逐步查看 x→Ax→BAx→与 W₀x 相加。 <b>先预测，再操作；</b>结果出现后才展开论文解释。",
          "componentId": "lora-ch5"
        }
      ],
      "insight": "LoRA 的训练对象是 A、B；W₀ 保持共享，优化器状态也只服务于小支路。",
      "formula": {
        "lead": "两条分支在输出处相加，缩放只作用于低秩支路。",
        "unicode": "<span class=\"sym\">h</span> = <span class=\"sym\">W₀</span><span class=\"sym\">x</span> + (<span class=\"sym\">α</span>/<span class=\"sym\">r</span>)<span class=\"sym\">B</span><span class=\"sym\">A</span><span class=\"sym\">x</span>",
        "symbols": [
          {
            "sym": "x",
            "desc": "输入向量。"
          },
          {
            "sym": "h",
            "desc": "该层输出。"
          },
          {
            "sym": "α/r",
            "desc": "论文使用的低秩分支缩放。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "Freeze W₀",
          "desc": "保留共享基座，不计算其梯度。"
        },
        {
          "icon": "🔧",
          "title": "Train A,B",
          "desc": "把任务变化集中到低秩矩阵。"
        },
        {
          "icon": "✨",
          "title": "Scaling",
          "desc": "α/r 让改变 r 时更容易保持有效尺度。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "ACT 5 — Rank Roulette",
      "badge": "both",
      "badgeLabel": "实验判断",
      "bridge": "直觉可能告诉你 rank 越大越好。先下注，再用论文的 GPT-3 与 GPT-2 实验拆穿或修正这个直觉。",
      "analogy": {
        "title": "实验日志 06",
        "text": "<b>Level 1：</b>一只铜制调谐旋钮跨过多个 rank 刻度，指针却没有在最大值处达到最佳。",
        "componentId": "lora-ch6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "先预测：r 越大越好吗",
          "desc": "<b>提出问题：</b>选择你认为最优的 r，再揭示 GPT-3 Table 6。 <b>先预测，再操作；</b>结果出现后才展开论文解释。",
          "componentId": "lora-ch6"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "换模型再下注",
          "desc": "<b>提出问题：</b>切换 GPT-2 E2E 的 BLEU 与验证损失，观察最佳 r 随指标变化。 <b>先预测，再操作；</b>结果出现后才展开论文解释。",
          "componentId": "lora-ch6"
        }
      ],
      "insight": "rank 是容量与参数量的旋钮，不是保证性能单调上升的旋钮。",
      "formula": {
        "lead": "一个 d×k 更新被分解后，可训练参数随 r 线性增长。",
        "unicode": "参数量 = <span class=\"sym\">r</span>(<span class=\"sym\">d</span> + <span class=\"sym\">k</span>)",
        "symbols": [
          {
            "sym": "r",
            "desc": "低秩宽度。"
          },
          {
            "sym": "d,k",
            "desc": "原权重矩阵的输出与输入维度。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "很小也可能够",
          "desc": "论文 GPT-3 任务中 r=1 已可竞争。"
        },
        {
          "icon": "🔧",
          "title": "不是普适值",
          "desc": "作者明确提醒不同任务可能需要更高 rank。"
        },
        {
          "icon": "✨",
          "title": "看指标调参",
          "desc": "GPT-2 的 BLEU 与验证损失偏好不同 r。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "ACT 6 — Transformer Surgery",
      "badge": "trn",
      "badgeLabel": "结构选择",
      "bridge": "rank 已经选好，但 LoRA 应插在哪里？请在自注意力的 Wq、Wk、Wv、Wo 上进行一次预算受限的手术。",
      "analogy": {
        "title": "实验日志 07",
        "text": "<b>Level 1：</b>一根精密探针触碰注意力腔体的端口，选中的路径亮起。",
        "componentId": "lora-ch7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "选择手术位置",
          "desc": "<b>提出问题：</b>在固定 18M 参数预算下选择一个或两个注意力投影。 <b>先预测，再操作；</b>结果出现后才展开论文解释。",
          "componentId": "lora-ch7"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "理解 Q / K / V",
          "desc": "<b>提出问题：</b>切换 Q、K、V，观察查询、匹配与内容传递的角色。 <b>先预测，再操作；</b>结果出现后才展开论文解释。",
          "componentId": "lora-ch7"
        }
      ],
      "insight": "论文在其 GPT-3、WikiSQL/MNLI、固定预算实验中发现 Wq+Wv 整体最好；这不是通用定律。",
      "formula": {
        "lead": "本章不新增运算公式，而是确认四个注意力投影的位置。",
        "unicode": "Self-Attention: <span class=\"sym\">Wq</span> · <span class=\"sym\">Wk</span> · <span class=\"sym\">Wv</span> · <span class=\"sym\">Wo</span>",
        "symbols": [
          {
            "sym": "Wq",
            "desc": "查询投影。"
          },
          {
            "sym": "Wk",
            "desc": "键投影。"
          },
          {
            "sym": "Wv",
            "desc": "值投影。"
          },
          {
            "sym": "Wo",
            "desc": "注意力输出投影。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "Q",
          "desc": "当前 token 想找什么。"
        },
        {
          "icon": "🔧",
          "title": "K/V",
          "desc": "K 用于匹配，V 携带内容。"
        },
        {
          "icon": "✨",
          "title": "条件化结论",
          "desc": "Wq+Wv 只在论文所测条件下是优选。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "ACT 7 — Performance Arena",
      "badge": "both",
      "badgeLabel": "结果证据",
      "bridge": "方法设计完成，是否真的兼顾参数与质量？先押注，再用论文表格的原始协议揭晓。",
      "analogy": {
        "title": "实验日志 08",
        "text": "<b>Level 1：</b>启动杆让四只方法仪表从同一基线出发，数值按真实结果停止。",
        "componentId": "lora-ch8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "下注后揭示 GPT-3 结果",
          "desc": "<b>提出问题：</b>选择方法和数据集，再启动 Table 4 的参数—性能对比。 <b>先预测，再操作；</b>结果出现后才展开论文解释。",
          "componentId": "lora-ch8"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "低数据区再检验",
          "desc": "<b>提出问题：</b>切换 MNLI 样本规模，比较 Full FT、Prefix 与 LoRA。 <b>先预测，再操作；</b>结果出现后才展开论文解释。",
          "componentId": "lora-ch8"
        }
      ],
      "insight": "LoRA 在论文报告的多项任务中以更少可训练参数达到可比或更好结果，但不能跨协议随意比较。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "协议先行",
          "desc": "先确认数据集、划分、指标与方向。"
        },
        {
          "icon": "🔧",
          "title": "质量未必下降",
          "desc": "更少可训练参数不等于更低任务表现。"
        },
        {
          "icon": "✨",
          "title": "保持边界",
          "desc": "论文胜出不代表所有新任务都必胜。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "ACT 8 — Merge Room",
      "badge": "inf",
      "badgeLabel": "部署推理",
      "bridge": "训练时有主干与低秩支路。部署时如果还保留两条路径，会不会变慢？请执行权重合并。",
      "analogy": {
        "title": "实验日志 09",
        "text": "<b>Level 1：</b>耦合轮转动，小型旁路齿轮被吸收到主轴中，只留一条推理路径。",
        "componentId": "lora-ch9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "执行 Merge Weights",
          "desc": "<b>提出问题：</b>逐步把 BA 缩放并加到 W₀，观察分支消失。 <b>先预测，再操作；</b>结果出现后才展开论文解释。",
          "componentId": "lora-ch9"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "同起点推理竞速",
          "desc": "<b>提出问题：</b>让 Full FT 与已合并 LoRA 同时推理，比较路径结构。 <b>先预测，再操作；</b>结果出现后才展开论文解释。",
          "componentId": "lora-ch9"
        }
      ],
      "insight": "合并后的 LoRA 推理只使用 W，因此按构造不增加额外模型路径延迟。",
      "formula": {
        "lead": "部署前把低秩更新直接写回主权重。",
        "unicode": "<span class=\"sym\">W</span> = <span class=\"sym\">W₀</span> + (<span class=\"sym\">α</span>/<span class=\"sym\">r</span>)<span class=\"sym\">B</span><span class=\"sym\">A</span>",
        "symbols": [
          {
            "sym": "W",
            "desc": "部署时实际使用的合并权重。"
          },
          {
            "sym": "BA",
            "desc": "训练得到的低秩任务更新。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "Merge",
          "desc": "把低秩分支吸收进主权重。"
        },
        {
          "icon": "🔧",
          "title": "No Extra Path",
          "desc": "推理图不再多一层或多一支。"
        },
        {
          "icon": "✨",
          "title": "部署限制",
          "desc": "预合并后，同批次混用不同任务模块不直接。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "ACT 9 — Low-Rank Abyss",
      "badge": "both",
      "badgeLabel": "综合推导",
      "bridge": "最后，把一个基座模型与多个任务模块组织起来，再用 rank、子空间与局限证据完成你自己的 LoRA 推导。",
      "analogy": {
        "title": "实验日志 10",
        "text": "<b>Level 1：</b>选择臂替换一枚小型任务卡匣，巨大基座引擎始终保持不动。",
        "componentId": "lora-ch10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "切换任务 LoRA",
          "desc": "<b>提出问题：</b>在摘要、NL2SQL、分类模块之间切换，并比较合并与未合并。 <b>先预测，再操作；</b>结果出现后才展开论文解释。",
          "componentId": "lora-ch10"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "低秩证据与最终推导",
          "desc": "<b>提出问题：</b>查看 rank、子空间、放大方向证据，再按因果顺序完成六步推导。 <b>先预测，再操作；</b>结果出现后才展开论文解释。",
          "componentId": "lora-ch10"
        }
      ],
      "insight": "LoRA 是工程折中：共享基座、低秩更新、按任务验证、可合并部署，同时保留 rank 与混合任务等边界。",
      "formula": {
        "lead": "Level 3：论文用归一化子空间相似度检查不同 rank 学到的方向是否重合。",
        "unicode": "<span class=\"sym\">φ</span>(A,B,i,j) = ‖UᵢᴬᵀUⱼᴮ‖²F / min(i,j)",
        "symbols": [
          {
            "sym": "φ",
            "desc": "0 到 1 的子空间重合度。"
          },
          {
            "sym": "U",
            "desc": "由奇异值分解得到的方向基。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "Fast Switching",
          "desc": "共享 W₀，只替换小型任务模块。"
        },
        {
          "icon": "🔧",
          "title": "Empirical Evidence",
          "desc": "低秩有效性有实验支持，但不是理论保证。"
        },
        {
          "icon": "✨",
          "title": "Final Judgment",
          "desc": "rank、位置与部署方式必须结合任务选择。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV13w411y7fq",
      "title": "LoRA 原理与实战",
      "reason": "从原理到 HuggingFace 实战，适合完成网页后继续练习。",
      "views": "3.2万播放"
    },
    {
      "bvid": "BV1sT4y1t7Cu",
      "title": "作者亲自讲解：LoRA 是什么？",
      "reason": "由 LoRA 作者解释发明动机、rank 与工程收益。",
      "views": "9.7万播放"
    },
    {
      "bvid": "BV1waZ2YDEcp",
      "title": "从原理到调参，7 个问题理解 LoRA",
      "reason": "面向初学者串起低秩直觉与调参判断。",
      "views": "4.7万播放"
    },
    {
      "bvid": "BV11F4m1M7ME",
      "title": "LLM 微调技术概述与 LoRA 解读",
      "reason": "对比 Adapter、P-Tuning 与 LoRA，并包含实现视角。",
      "views": "1.3万播放"
    }
  ]
};
