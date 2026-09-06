import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "LLaDA2.0-Uni: Unifying Multimodal Understanding and Generation with Diffusion Large Language Model",
    "titleZh": "LLaDA2.0-Uni：统一多模态理解与生成",
    "venue": "arXiv:2604.20796v1 · 2026",
    "authors": "Tiwei Bie, Haoxing Chen, Tieyuan Chen, Zhenglin Cheng, Long Cui, Kai Gan 等",
    "affiliation": "AGI Research Center · InclusionAI",
    "domain": "统一多模态模型 · 离散扩散 · 理解 / 生成 / 编辑",
    "coreProblem": "怎样让图像理解与图像生成不再依赖两套割裂的视觉表示和训练目标？",
    "coreInsight": "先把图像变成语义离散 Token，再用同一个 16B MoE 扩散语言主干做块级 Mask 预测；文本直接解码，视觉 Token 进入 6B 扩散解码器。",
    "keywords": [
      "SigLIP-VQ",
      "Block Diffusion",
      "MoE",
      "SPRINT",
      "InterGen"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "理解走 ViT、生成走 VAE：表示与目标分裂，模态之间难以原生互相条件化。",
      componentId: "hero-old-v4"
    },
    "newMethod": {
      "desc": "图像与文字先成为统一离散 Token，共享块级掩码扩散主干，再按输出模态正确分流。",
      componentId: "hero-new-v4"
    }
  },
  "chapters": [
    {
      kind: "chapter",
      "id": "chap-1",
      "title": "为什么需要统一模型",
      "badge": "inf",
      "badgeLabel": "第一幕 · 问题",
      "bridge": "",
      "analogy": {
        "title": "同一画面，不该准备两套视觉表示",
        "text": "已有路线要么让重建型视觉 Token 兼顾理解，要么为理解与生成保留不同表示。本文先把图像量化为语义离散 Token，再交给共享 dLLM。",
        componentId: "darkroom-analogy-1"
      },
      "modules": [
        {
          kind: "module",
          "id": "1.1",
          "title": "为什么已有的“统一模型”仍不够统一？",
          "desc": "依次切换重建型 Token、双视觉模块和本文方案，从视觉表示、主干目标与图像重建三个维度比较。",
          componentId: "system-contrast"
        },
        {
          kind: "module",
          "id": "1.2",
          "title": "理解与生成，要分量纲看证据",
          "desc": "切换理解、生成与编辑、比较原则三个视角；每张图只在自身 benchmark 和量纲内比较。",
          componentId: "benchmark-lens"
        }
      ],
      "insight": "论文真正统一的是语义离散表示与共享 dLLM 中的块级 Mask 预测；图像输出仍由专门的 Diffusion Decoder 将视觉 Token 重建为像素。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "统一入口",
          "desc": "文字与图像都成为离散 Token。"
        },
        {
          "icon": "◇",
          "title": "共享主干",
          "desc": "两种 Token 接受同一种块级 Mask 预测。"
        },
        {
          "icon": "△",
          "title": "正确分流",
          "desc": "文本直接输出，视觉 Token 进入扩散解码器。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-2",
      "title": "图像如何变成语义 Token",
      "badge": "inf",
      "badgeLabel": "第二幕 · 表示",
      "bridge": "",
      "analogy": {
        "title": "先认出内容，再记下编号",
        "text": "图像块先由 SigLIP2-g ViT 提取 2048 维语义特征，再在 16,384 个码本向量中寻找最近项，最终输出离散 Token ID。",
        componentId: "darkroom-analogy-2"
      },
      "modules": [
        {
          kind: "module",
          "id": "2.1",
          "title": "从图像局部到离散语义",
          "desc": "点选“人物、杯子、竹叶”图像块，联动观察语义向量、Codebook 匹配结果和视觉 Token。码本规模为 16,384，向量维度为 2,048。",
          componentId: "semantic-tokenizer"
        },
        {
          kind: "module",
          "id": "2.2",
          "title": "语义一致与细节保真要分开看",
          "desc": "按人物与材质、图中文字、构图与风格观察论文 Figure 2 样例；可切换局部并调整放大比例。",
          componentId: "generation-gallery"
        }
      ],
      "insight": "语义 Token 更适合理解，却不自带像素级重建能力。",
      "formula": {
        "lead": "用最小距离表达向量量化的直觉：",
        "unicode": "q(v) = argminᵢ ‖v − eᵢ‖₂",
        "symbols": [
          {
            "sym": "v",
            "desc": "输入向量：图像块经 SigLIP 编码后生成的 2048 维连续语义特征。"
          },
          {
            "sym": "eᵢ",
            "desc": "码本向量：视觉码本中的第 i 个离散向量，总共有 16,384 个这样的向量。"
          },
          {
            "sym": "‖v − eᵢ‖₂",
            "desc": "欧氏距离：计算连续特征与码本向量之间的距离；数值越小，表示语义越接近。"
          },
          {
            "sym": "argmin",
            "desc": "最小寻址：在全部码本向量中，找到与输入特征距离最近的一项，并返回它的离散编号。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "◎",
          "title": "语义优先",
          "desc": "tokenizer 由理解任务塑形。"
        },
        {
          "icon": "◇",
          "title": "离散桥梁",
          "desc": "视觉 Token 被追加进共享词表。"
        },
        {
          "icon": "△",
          "title": "承认损失",
          "desc": "细粒度视觉细节仍可能丢失。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-3",
      "title": "统一扩散模型如何工作",
      "badge": "both",
      "badgeLabel": "第三幕 · 机制",
      "bridge": "",
      "analogy": {
        "title": "块间有顺序，块内可并行",
        "text": "点击“并行显影一步”：前序干净 Block 始终作为稳定条件，只有当前 Block 中的 Mask 位置被并行预测并计入本轮损失。",
        componentId: "darkroom-analogy-3"
      },
      "modules": [
        {
          kind: "module",
          "id": "3.1",
          "title": "BDLM 损失显微镜：从一个 Mask 位置读懂整条公式",
          "desc": "切换当前 Block、改变 Mask 集合并点选一个位置，观察输入分块、条件视窗、预测概率与损失求和项如何同步变化。",
          componentId: "unified-token-diffusion"
        },
        {
          kind: "module",
          "id": "3.2",
          "title": "点进三段架构，看一条 Token 走完全程",
          "desc": "逐步检查 SigLIP-VQ、16B MoE dLLM 与 6B Diffusion Decoder 的有效路径。",
          componentId: "architecture-route"
        }
      ],
      "insight": "BDLM 把前序干净块作为条件，只让当前块中被 Mask 的位置进入损失；这些位置可以在同一轮并行预测。",
      "formula": {
        "lead": "先把当前被 Mask 的位置写成集合，再对这些位置的负对数概率求和；期望同时遍历时间步、干净序列及其掩码版本。",
        "unicode": "𝓜ₜ={(k,i) | xₜ,ᵢ,ₖ=[MASK]}<br>L_BDLM(θ)=−Eₜ,ₓ₀,ₓₜ[w(t) Σ<sub>(k,i)∈𝓜ₜ</sub> log pθ(x₀,ᵢ,ₖ | x₀,<ₖ, xₜ,ₖ)]<br>w(t)=−α′ₜ/(1−αₜ)",
        "symbols": [
          {
            "sym": "𝓜ₜ",
            "desc": "时刻 t 的 Mask 位置集合。只有集合中的位置进入当前损失求和。"
          },
          {
            "sym": "w(t)",
            "desc": "由离散扩散过程导出的时间权重，论文中写为 −α′ₜ/(1−αₜ)。"
          },
          {
            "sym": "k,i",
            "desc": "k 是 Block 编号，i 是该 Block 内的 Token 位置。"
          },
          {
            "sym": "x₀,<ₖ",
            "desc": "当前 Block 之前的干净 Block，它们为当前预测提供稳定上下文。"
          },
          {
            "sym": "xₜ,ₖ",
            "desc": "时刻 t 的当前噪声 Block，其中一部分 Token 被替换为 [MASK]。"
          },
          {
            "sym": "pθ",
            "desc": "参数为 θ 的模型对目标干净 Token 给出的条件概率。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "◎",
          "title": "只算 Mask",
          "desc": "未被遮挡的位置用于条件，不进入当前损失求和。"
        },
        {
          "icon": "◇",
          "title": "条件有边界",
          "desc": "预测当前块时使用前序干净块与当前噪声块。"
        },
        {
          "icon": "△",
          "title": "块内并行",
          "desc": "同一 Block 的多个 Mask 位置可以同时预测。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-4",
      "title": "如何同时理解与生成",
      "badge": "both",
      "badgeLabel": "第四幕 · 能力",
      "bridge": "",
      "analogy": {
        "title": "同一序列，通过 Mask 位置定义任务",
        "text": "切换理解、生成、编辑与交错任务：文字和图像都留在同一离散序列里，保留位置提供条件，Mask 位置定义模型需要补全的目标。",
        componentId: "darkroom-analogy-4"
      },
      "modules": [
        {
          kind: "module",
          "id": "4.1",
          "title": "同一目标，四种条件掩码",
          "desc": "切换图片问答、图像生成、图像编辑和交错任务，看条件 Token 与目标 Mask 如何重新排列。",
          componentId: "task-mask-studio"
        },
        {
          kind: "module",
          "id": "4.2",
          "title": "交错生成：用四个切片追踪图文上下文",
          "desc": "每次只展开两个相邻图文步骤，观察前一步生成的图像如何与文字一起成为下一视觉块的条件。",
          componentId: "storyboard-figure"
        }
      ],
      "insight": "理解时图像是条件、文本是答案；生成时文本是条件、视觉是目标；编辑与交错则组合两类上下文。",
      "formula": {
        "lead": "把任务差异写成统一条件形式：",
        "unicode": "C + M → pθ(target tokens | C, M)",
        "symbols": [
          {
            "sym": "C",
            "desc": "用户保留的文字、图像或前序交错上下文。"
          },
          {
            "sym": "M",
            "desc": "等待模型补全的 Mask 位置。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "◎",
          "title": "任务即掩码",
          "desc": "条件与目标的位置定义任务。"
        },
        {
          "icon": "◇",
          "title": "上下文交错",
          "desc": "文字和图像都能成为后续条件。"
        },
        {
          "icon": "△",
          "title": "证据分级",
          "desc": "案例、基准与结论不能混为一谈。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-5",
      "title": "如何加速生成",
      "badge": "trn",
      "badgeLabel": "第五幕 · 效率",
      "bridge": "",
      "analogy": {
        "title": "两个瓶颈，必须分开计时",
        "text": "切换标准与加速方案：SPRINT 减少 dLLM 主干的重复前缀计算，8步蒸馏减少图像 Decoder 的重建轮数，两组加速不能相乘。",
        componentId: "darkroom-analogy-5"
      },
      "modules": [
        {
          kind: "module",
          "id": "5.1",
          "title": "SPRINT：少看前缀，动态接收 Token",
          "desc": "启用稀疏前缀保留和非均匀解掩码，联动查看保留缓存、吞吐和平均分。",
          componentId: "sprint-lab"
        },
        {
          kind: "module",
          "id": "5.2",
          "title": "双阶段生成播放器：从 Mask Token 到高清图像",
          "desc": "播放、暂停或拖动时间轴，先观察离散视觉 Token 的分批恢复，再比较 8 步蒸馏与 50 步基线如何将语义 Token 解码为 1024² 图像。",
          componentId: "decoder-figure-compare"
        }
      ],
      "insight": "SPRINT 的 1.6× 是主干平均 TPS；11.4× 是解码器在单卡 1024²、batch=1、BF16 下的秒/图加速。",
      "formula": {
        "lead": "SPRINT 接收所有置信度超过阈值的位置，并保留最低接收数保证结束：",
        "unicode": "A = { n ∈ [m] : cₙ > τ }",
        "symbols": [
          {
            "sym": "cₙ",
            "desc": "第 n 个 Mask 位置的预测置信度。"
          },
          {
            "sym": "τ",
            "desc": "论文实验使用 0.93 或 0.95。"
          },
          {
            "sym": "A",
            "desc": "当前步被接收并解除 Mask 的位置集合。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "◎",
          "title": "两个瓶颈",
          "desc": "主干与解码器分别加速。"
        },
        {
          "icon": "◇",
          "title": "动态预算",
          "desc": "困难 Token 获得更多精修机会。"
        },
        {
          "icon": "△",
          "title": "条件先行",
          "desc": "速度数字必须附带协议。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-6",
      "title": "证据与边界：论文真正证明了什么",
      "badge": "both",
      "badgeLabel": "尾声 · 证据",
      "bridge": "",
      "analogy": {
        "title": "把每条结论放到证据放大镜下",
        "text": "拖动检查深度：从定性现象进入指标、协议和结论边界。越接近最终结论，越要保留比较对象、量纲、测试条件与尚未解决的问题。",
        componentId: "darkroom-analogy-6"
      },
      "modules": [
        {
          kind: "module",
          "id": "6.1",
          "title": "主张—证据—条件—边界矩阵",
          "desc": "选择理解、生成与编辑、速度或交错能力，沿同一条证据链检查论文允许得出的结论以及不能推出的内容。",
          componentId: "metrics-dashboard"
        },
        {
          kind: "module",
          "id": "6.2",
          "title": "InterGen 分步演示与结论裁判",
          "desc": "切换滑板故事、液压机预测与可乐鸡翅任务，分步阅读 Figure 6；再通过滑轮和棋局案例追踪 Figure 8 的推演过程，最后判断五条陈述的证据等级。",
          componentId: "intergen-limits"
        }
      ],
      "insight": "稳妥结论是：统一扩散架构在多类理解与生成任务上具有竞争力，并展示交错能力潜力；它不是“所有任务全面第一”。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "竞争力",
          "desc": "多任务表现强，但不是全榜第一。"
        },
        {
          "icon": "◇",
          "title": "初步交错",
          "desc": "InterGen 有可见证据，也有裁判边界。"
        },
        {
          "icon": "△",
          "title": "诚实局限",
          "desc": "细节、规模化和 RL 仍待改进。"
        }
      ]
    }
  ]
};
