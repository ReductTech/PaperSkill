import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "ERNIE-Image Technical Report",
    "titleZh": "ERNIE-Image 技术报告：从数据监督到开放文生图系统",
    "venue": "arXiv 预印本 · 2026",
    "authors": "ERNIE Team, Baidu",
    "affiliation": "Baidu",
    "domain": "文生图 · 潜空间扩散 · DiT · 偏好对齐 · 蒸馏 · 审美评估",
    "coreProblem": "开放权重文生图模型在复杂指令、可见文字和审美质量上仍有缺口；单纯扩大模型参数规模会遇到边际收益递减和更高计算成本，不能替代对数据与监督质量的改进。",
    "coreInsight": "ERNIE-Image 以 8B 单流 DiT 为生成主体，系统涵盖预训练数据组织、审美评估、分辨率课程、真实提示词适配、偏好对齐和多教师蒸馏的完整链路",
    "keywords": [
      "8B 单流 DiT",
      "分层采样",
      "SFT 与 PE",
      "DPO 锚定",
      "MT-DMD",
      "ERIA-1K"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "传统思路主要通过<b>提高模型参数规模</b>增强能力；论文指出这种直接扩展会出现边际收益递减，并增加计算需求。",
      "componentId": "poster-hero"
    },
    "newMethod": {
      "desc": "ERNIE-Image 用<b>数据—训练—对齐—蒸馏—评估</b>的完整链路提高模型能力，而不是把扩大参数规模作为唯一杠杆。",
      "componentId": "poster-hero"
    }
  },
  "chapters": [
    {
      kind: "chapter",
      "id": "chap-2",
      "title": "ERNIE-Image 的整体架构",
      "badge": "inf",
      "badgeLabel": "架构",
      "bridge": "8B 单流 DiT 是生成主体，FLUX.2 VAE 提供图像潜空间，Ministral-3（3B）提供文字条件，Prompt Enhancer 与 ERNIE-Image-Aes 分别承担提示扩展和数据/评估侧路。",
      "analogy": {
        "title": "先把生成主路与辅助侧路分开",
        "text": "像阅读一张系统蓝图：文字条件与图像潜变量汇入生成主体；提示增强发生在输入前，Aes 则位于数据筛选和审美评估侧。",
        "componentId": "poster-analogies"
      },
      "modules": [
        {
          kind: "module",
          "id": "1.1",
          "title": "Pipeline",
          "desc": "",
          componentId: "ch2-representation"
        }
      ],
      "insight": "",
      "takeaways": [
        {
          "icon": "🖼️",
          "title": "生成主体",
          "desc": "8B 单流 DiT 接收文字条件与图像潜变量，是核心生成器。"
        },
        {
          "icon": "📝",
          "title": "双路条件",
          "desc": "Ministral-3（3B）形成文字条件，FLUX.2 VAE 提供图像潜空间。"
        },
        {
          "icon": "📐",
          "title": "辅助组件",
          "desc": "Prompt Enhancer 是可选提示词预处理；Aes 位于数据筛选和审美评估侧，不参与生成图像。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-3",
      "title": "如何筛选海量数据？",
      "badge": "inf",
      "badgeLabel": "预训练数据",
      "bridge": "表征确定后，下一步是决定喂给模型什么数据。论文先用 10,000 个细粒度类别组织海量样本，再把类间语义覆盖与类内审美质量拆成两级采样问题。",
      "modules": [
        {
          kind: "module",
          "id": "2.1",
          "title": "看两级采样如何兼顾长尾与质量",
          "desc": "依次切换原始数据池、类间平衡和类内择优：先观察样本如何集中在高频类别，再看长尾类别获得更多采样机会，最后查看各类别中高审美质量样本如何被共同高亮。",
          componentId: "ch3-data"
        }
      ],
      "takeaways": [
        {
          "icon": "🗂️",
          "title": "语义组织",
          "desc": "论文用 10,000 个细粒度类别组织预训练数据。"
        },
        {
          "icon": "⚖️",
          "title": "两级分工",
          "desc": "类间采样关注覆盖，类内采样结合 ERNIE-Image-Aes 分数关注质量。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-9",
      "title": "审美筛选",
      "badge": "trn",
      "badgeLabel": "审美数据治理",
      "bridge": "上一章的类内采样依赖可靠的审美分数，那这个分数如何获得：论文先用两两判断和 Swiss 配对构造人工标签，再训练 ERNIE-Image-Aes 为预训练语料评分；ERIA-1K 则作为持出集检查评分器是否符合人工判断。",
      "analogy": {
        "title": "只比较这一对校样",
        "text": "绝对打分容易随时间漂移，两两判断只回答“这一对谁更美”。Swiss配对再让相近名次继续比较。",
        "componentId": "poster-analogies"
      },
      "modules": [
        {
          kind: "module",
          "id": "3.1",
          "title": "从 Swiss 标注到 ERNIE-Image-Aes",
          "desc": "在四张校样的三次微型判断中，读者每次只选择更美的一张；胜负会即时更新当前名次，随后再比较排名接近的样本。切到 ERIA-1K 后，可查看评分器在持出集上的 SRCC、PLCC；这些结果验证评分器，而审美分数随后用于预训练数据的过滤与分层采样。",
          componentId: "ch9-aesthetic"
        }
      ],
      "insight": "Swiss 人工标注负责建立审美监督，ERNIE-Image-Aes 把这种监督扩展到海量预训练图片，ERIA-1K 再独立检查评分器的泛化能力；三者分别对应标签、应用与验证。",
      "takeaways": [
        {
          "icon": "⚖️",
          "title": "相近排名配对",
          "desc": "Swiss 赛制把当前排名接近的样本集中到后续两两比较。"
        },
        {
          "icon": "🧹",
          "title": "服务预训练数据",
          "desc": "ERNIE-Image-Aes 为候选图片打分，用于大规模过滤和分层采样。"
        },
        {
          "icon": "📊",
          "title": "持出验证",
          "desc": "ERIA-1K 用于评测评分器相关性，不是 ERNIE-Image-Aes 的训练集。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-8",
      "title": "Flow Matching：模型如何学会把噪声变成图像？",
      "badge": "trn",
      "badgeLabel": "预训练目标",
      "bridge": "前三章解决了模型结构和预训练数据问题，但数据本身不会告诉 DiT 如何生成图像。Flow Matching 把生成过程写成一条从噪声潜变量到图像潜变量的连续路径，让模型学习路径上每个位置应该前进的速度。",
      "analogy": {
        "title": "沿着修正方向打磨校样",
        "text": "编辑不必一次完成整张海报，只要在每个中间状态判断下一笔该往哪里修正；连续采用这些局部方向，模糊校样最终就会形成清晰结构。",
        "componentId": "poster-analogies"
      },
      "modules": [
        {
          kind: "module",
          "id": "4.1",
          "title": "在路径中随机抽一道训练题",
          "desc": "拖动时间 t，观察噪声 ε、图像潜变量 z 与中间状态 zₜ 的关系。每道训练题只要求 DiT 根据 zₜ、t 和文本条件 c 预测当前位置的目标速度。",
          componentId: "ch8-flow-training"
        },
        {
          kind: "module",
          "id": "4.2",
          "title": "把局部速度连成一次完整生成",
          "desc": "逐次调用 DiT：每次函数调用预测当前位置的速度，ODE 求解器据此更新潜变量。连续积分后得到结构化图像潜变量，最后再由 VAE 解码成可见图片。",
          componentId: "ch8-flow-sampling"
        }
      ],
      "insight": "Flow Matching 不是让模型背出终点图片，而是回归一条概率路径上的速度场；训练可以直接随机抽取时刻，生成时再沿学到的场积分。",
      "formula": {
        "lead": "一般地，先选定连接噪声与数据的条件路径 ψₜ，再让模型回归这条路径的时间导数。",
        "unicode": "zₜ = ψₜ(ε,z),　uₜ = ∂ψₜ(ε,z)/∂t,　L_FM = E‖vθ(zₜ,t,c) − uₜ‖²",
        "symbols": [
          { "sym": "ε / z", "desc": "噪声潜变量与真实图像经 VAE 编码得到的数据潜变量。" },
          { "sym": "t / zₜ", "desc": "连续时间，以及路径在该时刻的中间潜变量。" },
          { "sym": "uₜ", "desc": "所选条件路径在 zₜ 处提供的目标速度。" },
          { "sym": "vθ", "desc": "DiT 在文本条件 c 下预测的速度场。" }
        ]
      },
      "takeaways": [
        {
          "icon": "🛣️",
          "title": "先规定路径",
          "desc": "路径 ψₜ 连接简单噪声分布与图像潜变量分布。"
        },
        {
          "icon": "🧭",
          "title": "学习局部速度",
          "desc": "DiT 回归当前位置应有的速度，而不是一次直接输出最终图片。"
        },
        {
          "icon": "∫",
          "title": "积分得到样本",
          "desc": "推理时从噪声出发，沿预测速度场进行 ODE 积分，再由 VAE 解码。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-4",
      "title": "渐进提高分辨率的三阶段训练策略",
      "badge": "trn",
      "badgeLabel": "预训练阶段",
      "bridge": "语义组织、文字描述与审美筛选共同确定预训练数据后，基础模型再按 256×256、512×512、1024×1024 三段课程逐步提高分辨率，并在每个阶段保留多种长宽比。",
      "analogy": {
        "title": "把取景框扩到目标尺寸",
        "text": "先练整体布局，再提高细节分辨率；每一步都保留不同长宽比，而不是只练正方形。",
        "componentId": "poster-analogies"
      },
      "modules": [
        {
          kind: "module",
          "id": "5.1",
          "title": "推进三段分辨率课程",
          "desc": "用前后按钮推进论文报告的三段分辨率，再切换正方形、竖版或横版取景框。页面不生成质量百分比、阶段步数或优化器参数。",
          componentId: "ch4-curriculum"
        }
      ],
      "insight": "分辨率课程解决的是基础训练如何逐步提高细节。",
      "takeaways": [
        {
          "icon": "1️⃣",
          "title": "三段分辨率",
          "desc": "预训练依次采用 256×256、512×512 和 1024×1024。"
        },
        {
          "icon": "▭",
          "title": "多种长宽比",
          "desc": "三个阶段都保留多种长宽比，不等于只训练正方形。"
        },
        {
          "icon": "🧱",
          "title": "训练课程",
          "desc": ""
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-5",
      "title": "模型如何听懂真实用户的不同说法？",
      "badge": "both",
      "badgeLabel": "SFT与BE",
      "bridge": "后训练时，监督微调（SFT）让模型学习不同领域与用户表达；推理时，提示增强器（Prompt Enhancer, PE）再把过短输入扩成结构化说明。",
      "analogy": {
        "title": "把标准描述拓展为多样化的用户风格描述",
        "text": "训练时先学习短描述、自然请求和详细构图，使用时再把过短需求补成结构化说明。两步发生在不同阶段。",
        "componentId": "poster-analogies"
      },
      "modules": [
        {
          kind: "module",
          "id": "6.1",
          "title": "同一图片，换成四种用户表达",
          "desc": "选择海报、游戏、人像、产品或动漫图片：左侧显示同一张真实图片及原始描述，右侧并列展示关键词、自然请求、指令式和详细构图四种用户表达。",
          componentId: "ch5-sft"
        },
        {
          kind: "module",
          "id": "6.2",
          "title": "Prompt Enhancer",
          "desc": "",
          componentId: "ch5-pe"
        }
      ],
      "insight": "训练时让模型见过多种表达，解决的是鲁棒性；用户输入仍过短时，才轮到推理前的 PE。",
      "takeaways": [
        {
          "icon": "🏋️",
          "title": "SFT",
          "desc": "监督微调在训练期引入重点领域和多样用户表达。"
        },
        {
          "icon": "✍️",
          "title": "PE",
          "desc": "提示增强器在推理前把短提示扩成结构化说明。"
        },
        {
          "icon": "🖼️",
          "title": "强大的指令遵循",
          "desc": ""
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-6",
      "title": "如何生成符合人类偏好的图片？",
      "badge": "both",
      "badgeLabel": "DPO",
      "bridge": "直接偏好优化（DPO）比较策略模型与冻结参考模型的胜负重建误差差距。只把负样本误差推高也能拉开差距，却会形成奖励投机；论文用胜负锚定项约束这种路径。",
      "analogy": {
        "title": "把偏好旋钮拧到安全区",
        "text": "只让负样本变得更差也能拉开差距，却会破坏模型。锚定项要求胜负两边都留在可控范围。",
        "componentId": "poster-analogies"
      },
      "modules": [
        {
          kind: "module",
          "id": "7.1",
          "title": "对比健康优化与奖励投机",
          "desc": "点击播放，让同一参考点在两张二维等损失图上同时下降。左侧展示仅 DPO 如何走向提高负样本误差的投机区，右侧展示 Anchor Losses 如何把总目标的下降方向转向受约束区域。",
          componentId: "ch6-dpo"
        }
      ],
      "insight": "降低胜样本误差和抬高负样本误差都能改善 DPO 单项；Anchor Losses 给胜负误差都加上正向代价，使一味抬高负样本误差不再是总目标的下降方向。",
      "formula": {
        "lead": "sigmoid 是 logistic 函数 sigmoid(z)=1/(1+e^(−z))；这里的 sigmoid 与下一章表示噪声尺度的符号无关。",
        "unicode": "Diff_policy = ℓ_pol^win − ℓ_pol^lose<br/>L_DPO = −E[log sigmoid(−β(Diff_policy − Diff_ref))]<br/>L_total = L_DPO + λ_win E[ℓ_win] + λ_lose E[ℓ_lose]<br/>ℓ = ‖vθ(x_t,h,t) − v_t‖₂²",
        "symbols": [
          {
            "sym": "Diff_policy",
            "desc": "策略模型的胜样本重建误差减负样本重建误差。"
          },
          {
            "sym": "Diff_ref",
            "desc": "冻结参考模型按相同方式计算的胜负误差差距。"
          },
          {
            "sym": "sigmoid",
            "desc": "logistic 函数，把实数映射到 0 与 1 之间。"
          },
          {
            "sym": "β",
            "desc": "DPO 缩放系数，论文设置为 0.05。"
          },
          {
            "sym": "λ_win",
            "desc": "胜样本锚定权重，论文设置为 0.35。"
          },
          {
            "sym": "λ_lose",
            "desc": "负样本锚定权重，论文设置为 0.15。"
          },
          {
            "sym": "vθ",
            "desc": "策略模型预测的流匹配速度场。"
          },
          {
            "sym": "v_t",
            "desc": "时间 t 的目标流速度。"
          },
          {
            "sym": "h",
            "desc": "提示词隐藏状态。"
          },
          {
            "sym": "x_t",
            "desc": "时间 t 的噪声图像潜变量。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "⚖️",
          "title": "DPO",
          "desc": "DPO 比较策略模型与冻结参考模型的胜负重建误差差距。"
        },
        {
          "icon": "⚠️",
          "title": "识别奖励投机",
          "desc": "无界 L2 误差会诱发只破坏负样本来拉开差距的路径。"
        },
        {
          "icon": "⚓",
          "title": "优化后的DPO",
          "desc": "用Anchor Loss避免奖励投机"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-7",
      "title": "为什么要蒸馏？",
      "badge": "trn",
      "badgeLabel": "MT-DMD",
      "bridge": "扩散模型通常要反复调用生成网络，逐步把噪声还原成图像。蒸馏要把这条迭代过程压缩进少步学生模型；但论文观察到，使用数据子集训练会带来轻微能力漂移。因此 ERNIE-Image 不是只追求少步，而是用 MT-DMD 汇集不同专长教师的监督，再让 Turbo 学生独立以 8 NFE 完成推理。",
      "analogy": {
        "title": "先学会多位教师的长程修正，再独立走完短路径",
        "text": "训练时，多位领域教师针对当前噪声、语义与优化目标提供监督；推理时，监督已经写入学生参数，Turbo 不再调用任何教师。",
        "componentId": "poster-analogies"
      },
      "modules": [
        {
          kind: "module",
          "id": "8.1",
          "title": "从多教师蒸馏到学生独立推理",
          "desc": "先切到训练阶段，观察高噪声到低噪声时教师专长如何变化，以及 CA 与 DM 分别约束什么；再切到推理阶段，播放 Turbo 的 8 次模型函数求值。",
          componentId: "ch7-turbo"
        }
      ],
      "insight": "蒸馏压缩的是去噪过程，不是简单删掉步骤：MT-DMD 在训练期用动态路由组合多位专家教师，尽量把构图、文字、风格和细节能力一同保留下来。",
      "formula": {
        "lead": "路由权重 Wₖ 会同时读取当前潜变量、噪声尺度、语义条件和 CA/DM 目标，为这一训练状态组合教师的去噪预测。",
        "unicode": "x̂₀ = Σₖ Wₖ(x_t, noise_scale, c, O) · Eₖ(x_t, noise_scale, c)",
        "symbols": [
          {
            "sym": "x̂₀",
            "desc": "多教师集合给出的去噪目标。"
          },
          {
            "sym": "Eₖ",
            "desc": "第 k 个专家教师。"
          },
          {
            "sym": "Wₖ",
            "desc": "第 k 个专家的路由权重，论文给出的范围为 [0,1]。"
          },
          {
            "sym": "x_t",
            "desc": "当前噪声图像潜变量。"
          },
          {
            "sym": "noise_scale",
            "desc": "扩散噪声尺度，与上一章的 sigmoid 函数不是同一概念。"
          },
          {
            "sym": "c",
            "desc": "语义条件。"
          },
          {
            "sym": "O",
            "desc": "优化目标分支，取 CA 或 DM。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "⚡",
          "title": "为什么蒸馏",
          "desc": "把需要多次网络调用的迭代去噪过程压缩为少步生成，同时尽量保留原模型能力。"
        },
        {
          "icon": "🧩",
          "title": "训练时做什么",
          "desc": "MT-DMD 根据 x_t、噪声尺度、语义条件和 CA/DM 目标动态组合多位专家教师的监督。"
        },
        {
          "icon": "🏁",
          "title": "推理时做什么",
          "desc": "Turbo 学生独立执行 8 NFE；教师模型和训练期路由都不再参与生成。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-10",
      "title": "模型表现",
      "badge": "both",
      "badgeLabel": "Evaluation",
      "bridge": "",
      "modules": [
        {
          kind: "module",
          "id": "9.1",
          "title": "定性比较",
          "desc": "",
          componentId: "ch10-results"
        }
      ],
      "takeaways": []
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1qMdzB1E2T",
      "title": "6大维度硬核实测：ERNIE-Image 开源生图模型",
      "reason": "直接展示 ERNIE-Image 在文字、海报与复杂指令场景中的实际表现，适合作为论文结果的应用补充。",
      "cover": "https://i1.hdslb.com/bfs/archive/5e3c34eee7cd3200d029b745e90d818ace6d2158.jpg",
      "views": "1.6万播放"
    },
    {
      "bvid": "BV1cRwJeREgk",
      "title": "【NeurIPS 2024 Tutorial】Flow Matching for Generative Modeling",
      "reason": "系统讲解流匹配，为理解 DPO 中的速度预测误差提供数学背景。",
      "cover": "https://i2.hdslb.com/bfs/archive/8b8b9ed954bfb61bebe9a933b85b1858b644390d.jpg",
      "views": "2.6万播放"
    },
    {
      "bvid": "BV1ZzrHB8ESf",
      "title": "Decoupled DMD 与 DMDR：少步蒸馏实践",
      "reason": "播放量较低但主题直接覆盖 DMD、DMDR 与少步生成，对 MT-DMD 章节最相关。",
      "cover": "https://i2.hdslb.com/bfs/archive/998055e827346f09d41d3f8c57ab398f3e0a0796.jpg",
      "views": "1341播放"
    },
    {
      "bvid": "BV1Yu4y1w7Lt",
      "title": "Diffusion Model Alignment Using Direct Preference Optimization",
      "reason": "播放量较低但直接解释扩散模型中的 DPO，是偏好对齐章节的针对性延伸。",
      "cover": "https://i2.hdslb.com/bfs/archive/7ff127d72ac8a328291237e5c0b5c36728535d6f.png",
      "views": "1507播放"
    }
  ]
};
