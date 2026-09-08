import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Mage-Flow: An Efficient Native-Resolution Foundation Model for Image Generation and Editing",
    "titleZh": "Mage-Flow：高效原生分辨率图像生成与编辑基础模型",
    "venue": "arXiv 2607.19064v2 · 2026",
    "authors": "Microsoft Mage Team · Xinjie Zhang、Peng Zhang、Shicheng Zheng 等",
    "affiliation": "Microsoft",
    "domain": "视觉生成 · 指令式图像编辑 · 整流流",
    "coreProblem": "高质量原生分辨率生成与编辑若只优化单个模块，分词器、变长批处理与内存流量仍会形成高成本瓶颈。",
    "coreInsight": "先用一张生成模型全局图建立坐标，再沿两条主线阅读 Mage-Flow：模块一优化 VAE、原生打包、CUDA 执行与少步推理；模块二通过数据课程和 Diffusion-NFT 提升模型能力。",
    "keywords": [
      "Mage-VAE",
      "原生分辨率打包",
      "NR-MMDiT",
      "Diffusion-NFT",
      "四步蒸馏"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "只放大生成骨干，分词器、固定分桶与重复内存读写仍会拖慢高分辨率训练和推理。",
      componentId: "hero-stack-contrast"
    },
    "newMethod": {
      "desc": "Mage-Flow 联合设计轻量 Mage-VAE、原生分辨率 NR-MMDiT 与融合内核，在 4B 规模上同时优化质量、速度和显存。",
      componentId: "hero-stack-contrast"
    }
  },
  "prerequisites": [
    {
      "id": "latent-vae",
      "title": "潜空间与 VAE",
      "intuition": "先把像素图压成更小的“工作稿”，模型在工作稿上生成，最后再还原成图片。",
      "minimalDefinition": "编码器把图像 x 映射为低分辨率潜变量 z，解码器再从 z 重建像素；压缩率、通道数和重建质量共同决定这个表示是否可用。",
      "whyNeeded": "Mage-Flow 的速度与质量首先受 Mage-VAE 影响，后续整流流、原生分辨率 token 和编辑条件都发生在它的潜空间中。"
    },
    {
      "id": "rectified-flow",
      "title": "扩散生成与整流流",
      "intuition": "生成可以看成把一团噪声沿路径逐步推回有结构的图像；模型学习的是每一步该往哪走。",
      "minimalDefinition": "整流流在 zₜ=(1−t)z+tε 的插值点上学习速度 z−ε；本论文约定 t=0 是数据端、t=1 是噪声端。",
      "whyNeeded": "它解释 NR-MMDiT 的训练目标、采样步数、四步蒸馏，以及为什么“路径正确”和“步数少”是不同问题。"
    },
    {
      "id": "tokens-attention",
      "title": "Token、注意力与位置编码",
      "intuition": "模型把文字和图像切成一串可交互的小单元，并用坐标告诉它们各自来自哪里。",
      "minimalDefinition": "Transformer 通过注意力让 token 交换信息；RoPE 编码位置，变长注意力用累计偏移隔离不同样本，MMDiT 对不同模态使用专属投影后进行联合注意力。",
      "whyNeeded": "原生分辨率打包、NR-MMDiT 信息流以及编辑中的源图/目标图角色都依赖这些概念。"
    },
    {
      "id": "conditioning-cfg",
      "title": "条件生成与 CFG",
      "intuition": "同一个生成器可以被文字、源图或编辑指令“牵引”；牵引方式会改变输入条件，但不一定改变骨干。",
      "minimalDefinition": "条件分支与无条件分支可组合成 CFG 引导；编辑还加入源图条件和帧坐标，而训练损失只监督目标图 token。",
      "whyNeeded": "它帮助区分文生图、指令编辑、打包式 CFG 和四步蒸馏各自解决的问题。"
    },
    {
      "id": "evaluation-protocol",
      "title": "评测协议与效率前沿",
      "intuition": "只有使用同一把尺子、同一硬件和同一任务的数字才能直接比赛。",
      "minimalDefinition": "完整协议至少包括数据集或任务、模型版本、采样步数、分辨率、硬件、单位和指标方向；缺少其中一项就可能形成误导比较。",
      "whyNeeded": "Mage-Flow 同时报告重建、生成、编辑、训练和推理结果，必须避免把不同协议的倍数相乘或压成一个总排名。"
    }
  ],
  "chapters": [
    {
      kind: "chapter",
      "id": "guide-architecture",
      "title": "先建立一张生成模型全局图",
      "badge": "inf",
      "badgeLabel": "必读导读",
      "bridge": "这一章只建立一张全局图：先理解条件编码、潜空间生成、DiT 更新与像素解码，再把 Qwen3-VL、Mage-VAE 和 NR-MMDiT 放回对应位置。后续六个 Part 都从这张图出发。",
      "analogy": {
        "title": "先看整张海报工作台，再研究每件工具",
        "text": "设计海报时，需求说明、工作稿、反复修改与最终导出属于不同环节。生成模型同样由条件、潜变量、生成骨干和解码器组成，后文的每项优化都能放回这张图。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "0.1",
          "title": "从 Prompt 到 RGB 图像：完整生成路径",
          "desc": "沿流程逐步查看 Prompt 如何变成文本条件 τ，NR-MMDiT 如何反复预测 latent token 的速度，以及 Mage-VAE 如何把最终 z₀ 解码为 RGB 图像。",
          componentId: "generative-architecture-primer"
        },
        {
          kind: "module",
          "id": "0.2",
          "title": "对照论文 Figure 5：Mage-Flow 的完整架构",
          "desc": "论文原图展示 Qwen3-VL、Mage-VAE、原生分辨率序列和 NR-MMDiT 的连接方式。下方交互图进一步拆解各节点的输入、输出与任务角色。",
          componentId: "static-figure",
          "figure": "./images/mage-flow-architecture.png",
          "figureCaption": "论文 Figure 5：左侧为 Mage-Flow 整体架构与原生分辨率打包，右侧为 Native-Resolution MMDiT 模块。"
        },
        {
          kind: "module",
          "id": "0.3",
          "title": "逐节点拆解：输入、输出与关键规格",
          "desc": "沿 Mage-VAE 编码、原生打包、NR-MMDiT、Mage-VAE 解码与冻结条件编码逐节点查看规格，并区分生成 (h,w) 与编辑 (h,w,f) 两种条件视图。",
          componentId: "architecture-map-lab"
        }
      ],
      "insight": "Mage-Flow 的贡献不是替换生成模型的基本范式，而是分别优化这条链的执行成本、训练组织和能力校准。",
      "takeaways": [
        {
          "icon": "T",
          "title": "条件定义任务",
          "desc": "文本、源图与编辑指令决定生成目标和任务角色。"
        },
        {
          "icon": "z",
          "title": "潜空间连接 VAE 与 DiT",
          "desc": "Mage-VAE 负责像素转换，NR-MMDiT 在潜变量 token 上预测更新方向。"
        },
        {
          "icon": "2×3",
          "title": "两条主线、六个部分",
          "desc": "效率主线优化 VAE、打包、CUDA 与步数；能力主线优化数据课程与后训练。"
        }
      ],
      "prerequisiteRefs": [
        "latent-vae",
        "rectified-flow",
        "tokens-attention",
        "conditioning-cfg"
      ],
      "quiz": [
        {
          "id": "framework-architecture-1",
          "prompt": "DiT 在典型潜空间生成模型中主要处理什么？",
          "options": [
            {
              "id": "a",
              "text": "直接处理最终 PNG 文件的压缩编码。",
              "feedback": "PNG 文件格式不是 DiT 的主要建模对象。"
            },
            {
              "id": "b",
              "text": "VAE 产生的潜变量 token，并根据条件预测更新方向。",
              "feedback": "正确，这也是理解 NR-MMDiT 的起点。"
            },
            {
              "id": "c",
              "text": "只负责把文本提示切成字符。",
              "feedback": "文本条件通常由独立编码器提供，DiT 负责条件化生成。"
            }
          ],
          "correctOptionId": "b",
          "explanation": "典型流程是条件编码 → 潜空间中的生成骨干 → VAE 解码；Mage-Flow 在这条链上分别做效率与能力优化。",
        }
      ]
    },
    {
      "kind": "section",
      "id": "guide-flow",
      "title": "训练学方向，推理沿方向生成",
      "badge": "both",
      "badgeLabel": "蒸馏基础",
      "bridge": "理解少步蒸馏前，先确认教师模型学习的整流流路径与速度目标；否则“四步”只剩一个没有机制解释的数字。",
      "analogy": {
        "title": "沿直尺一笔描回成稿",
        "text": "触控笔只沿一条直线导轨移动：一端更像噪声，另一端是完成的海报。整流流匹配学习的，就是沿这条路径指向数据端的速度。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "0.4",
          "title": "拖动 t：看见整流流的直线路径",
          "desc": "拖动插值时间，联动观察海报噪声、潜变量位置和指向数据端的目标速度。论文约定 t=0 是数据端，t=1 是噪声端。",
          componentId: "flow-matching-lab"
        }
      ],
      "insight": "直线路径本身还不够：速度预测必须知道当前时间，也必须知道用户想生成或编辑什么。",
      "formula": {
        "lead": "把数据潜变量与同形状高斯噪声做线性插值，NR-MMDiT 便可在随机时间点学习指向数据端的目标速度。",
        "unicode": "zₜ = (1−t)z + tε<br/>L(θ) = E<sub>(x,τ),t,ε</sub> ‖vθ(zₜ,t,τ) − (z−ε)‖<sup>2</sup><sub>2</sub>",
        "symbols": [
          {
            "sym": "z",
            "desc": "Mage-VAE 输出的数据潜变量，空间下采样 16×、128 通道。"
          },
          {
            "sym": "ε",
            "desc": "与 z 同形状的标准高斯噪声，ε ~ N(0,I)。"
          },
          {
            "sym": "t",
            "desc": "[0,1] 内的插值时间；0 为数据端，1 为噪声端。"
          },
          {
            "sym": "zₜ",
            "desc": "时间 t 的线性插值潜变量。"
          },
          {
            "sym": "τ",
            "desc": "冻结 Qwen3-VL 给出的上下文条件嵌入。"
          },
          {
            "sym": "vθ",
            "desc": "NR-MMDiT 在给定 zₜ、t、τ 时的速度预测，训练目标为 z−ε。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "↔",
          "title": "端点约定",
          "desc": "t=0 对应数据潜变量，t=1 对应标准高斯噪声，阅读路径方向不能颠倒。"
        },
        {
          "icon": "→",
          "title": "学习速度",
          "desc": "NR-MMDiT 沿线性插值路径拟合目标速度 z−ε，而不是直接记住一张成图。"
        },
        {
          "icon": "⚖",
          "title": "适用边界",
          "desc": "画面采用二维投影呈现高维潜空间；连续路径本身也不等于少步推理。"
        }
      ],
      "prerequisiteRefs": [
        "latent-vae",
        "rectified-flow"
      ],
      "quiz": [
        {
          "id": "quiz-4-1",
          "prompt": "在论文采用的整流流约定中，t=0 与 t=1 分别表示什么？",
          "options": [
            {
              "id": "a",
              "text": "t=0 是数据端，t=1 是噪声端。",
              "feedback": "正确。读公式和采样方向时必须保留这个端点约定。"
            },
            {
              "id": "b",
              "text": "t=0 是噪声端，t=1 是数据端。",
              "feedback": "方向颠倒了；论文的 zₜ=(1−t)z+tε 在 t=0 得到 z。"
            },
            {
              "id": "c",
              "text": "t 只表示训练轮数，与路径端点无关。",
              "feedback": "t 是潜变量插值时间，不是 epoch 或优化步数。"
            }
          ],
          "correctOptionId": "a",
          "explanation": "由 zₜ=(1−t)z+tε 可直接看出：t=0 得到数据潜变量 z，t=1 得到噪声 ε。",
        }
      ]
    },
    {
      "kind": "section",
      "id": "guide-conditioning",
      "title": "条件如何区分生成与编辑",
      "badge": "both",
      "badgeLabel": "任务条件",
      "bridge": "Diffusion-NFT 同时服务生成与编辑，因此先用一个内部章节说明两种任务如何共享骨干、又如何通过条件格式保持角色差异。",
      "analogy": {
        "title": "参考色卡对准哪张画布？",
        "text": "只有创作要求时，海报从文字条件起步；加入源图后，还要用帧坐标分清参考与目标。共享骨干不等于共享完全相同的条件格式。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "0.5",
          "title": "切换任务：条件序列怎样改变",
          "desc": "切换文生图与指令编辑，观察条件序列、位置坐标和目标监督范围如何同步改变。",
          componentId: "conditioning-lab"
        }
      ],
      "insight": "统一骨干的关键不是把两种任务混成一种输入，而是保留目标去噪主线，同时显式标记源图条件和帧角色。",
      "takeaways": [
        {
          "icon": "T",
          "title": "文生图条件",
          "desc": "冻结 Qwen3-VL 提供文本上下文 τ，NR-MMDiT 在该条件下去噪目标潜变量。"
        },
        {
          "icon": "▣",
          "title": "编辑多一帧角色",
          "desc": "编辑加入源图潜变量，并用 (h,w,f) 中的 f 区分源图与目标图 token。"
        },
        {
          "icon": "◎",
          "title": "只监督目标",
          "desc": "源图参与条件化，但论文的整流流损失仍只计算目标 token，不能把源图路径画成第二个生成目标。"
        }
      ],
      "prerequisiteRefs": [
        "rectified-flow",
        "tokens-attention",
        "conditioning-cfg"
      ],
      "quiz": [
        {
          "id": "quiz-5-1",
          "prompt": "生成与编辑共享骨干时，编辑任务额外改变了什么？",
          "options": [
            {
              "id": "a",
              "text": "只更换输出图片格式，输入条件完全相同。",
              "feedback": "编辑的条件序列和位置角色都会改变，并非只换文件格式。"
            },
            {
              "id": "b",
              "text": "加入源图与编辑指令，用帧坐标区分角色，并只监督目标 token。",
              "feedback": "正确。共享的是骨干，条件格式与监督范围仍然明确不同。"
            },
            {
              "id": "c",
              "text": "为编辑重新训练一套完全独立的解码器。",
              "feedback": "论文复用 Mage-VAE 与 NR-MMDiT，没有为编辑另造完整骨干和解码器。"
            }
          ],
          "correctOptionId": "b",
          "explanation": "统一骨干并不意味着统一输入：编辑额外加入源图条件和 frame-aware RoPE，损失仍只落在目标 token。",
        }
      ]
    },
    {
      kind: "chapter",
      "id": "part-1-bottleneck",
      "title": "为什么现在必须优化 VAE？",
      "badge": "both",
      "badgeLabel": "训练与推理",
      "bridge": "VAE 一直存在于生成流水线里，只是过去被几十次扩散主干前向遮住了；高分辨率与少步化让这项固定成本重新浮出水面。",
      "analogy": {
        "title": "高速公路拓宽后，收费站成了新堵点",
        "text": "传统多步扩散像一段拥堵的主干路，入口和出口各停一次并不显眼。当主干被蒸馏到四步，车辆很快抵达出口，原本次要的 VAE 解码就开始限制全程速度。这不是 VAE 突然变慢，而是系统瓶颈发生了转移。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "1.1",
          "title": "切换步数：看 VAE 占比如何浮出水面",
          "desc": "对比传统 30 步与少步 4 步生成中主干与 VAE 的时间占比，理解瓶颈转移与阿姆达尔定律。",
          componentId: "vae-bottleneck-lab"
        }
      ],
      "insight": "优化对象不能只看单个模块有多慢，还要看它在加速后的完整系统中占多大比例。",
      "formula": {
        "lead": "端到端时间由可重复的主干成本与固定的 VAE 成本共同构成",
        "unicode": "T<sub>total</sub> = N · T<sub>DiT</sub> + T<sub>VAE</sub>",
        "symbols": [
          { "sym": "N", "desc": "扩散或流模型的采样步数；蒸馏会显著减小 N。" },
          { "sym": "T<sub>VAE</sub>", "desc": "一次编码或解码的固定成本，不会随采样步数同步下降。" }
        ]
      },
      "takeaways": [
        { "icon": "🖼️", "title": "分辨率放大旧架构缺点", "desc": "全局注意力与重型高分辨率块在 1K—4K 下带来快速增长的延迟和显存。" },
        { "icon": "⏱️", "title": "少步化改变成本占比", "desc": "主干前向从几十次降到四次，VAE 的一次固定解码不再可以忽略。" },
        { "icon": "14%", "title": "论文给出的实例", "desc": "FLUX.2-Klein-4B 在 1K 四步生成中，VAE 解码约占总时间的 14%。" }
      ],
      "prerequisiteRefs": ["latent-vae", "evaluation-protocol"],
      "quiz": [
        {
          "id": "quiz-1-bottleneck",
          "prompt": "为什么 DiT 被蒸馏到四步后，VAE 优化反而更重要？",
          "options": [
            { "id": "a", "text": "因为四步模型会让 VAE 自动执行四次。", "feedback": "VAE 通常仍只在末端解码一次，关键不是执行次数增加。" },
            { "id": "b", "text": "因为主干耗时下降后，VAE 固定成本在端到端时间中的占比上升。", "feedback": "正确。这正是瓶颈转移与阿姆达尔定律的含义。" },
            { "id": "c", "text": "因为少步蒸馏会强制图像分辨率变成 4K。", "feedback": "采样步数和输出分辨率是两件不同的事。" }
          ],
          "correctOptionId": "b",
          "explanation": "主干加速不会自动降低 VAE 的固定编解码成本，因此 VAE 会成为新的端到端瓶颈。",
        }
      ]
    },
    {
      "kind": "section",
      "id": "part-1-architecture",
      "title": "一步全卷积编解码与 Transformer-ready latent",
      "badge": "both",
      "badgeLabel": "训练与推理",
      "bridge": "确认瓶颈后，Mage-VAE 没有单纯缩减参数，而是重新设计高分辨率计算图，并让输出直接对接 Transformer。",
      "analogy": {
        "title": "把压缩、装箱和贴标签合并成一道工序",
        "text": "旧流程先压缩成 8×、32 通道的 latent，再做一次 2×2 分块，才能交给 Transformer。Mage-VAE 把这一步内化，直接交付 16×、128 通道的 Transformer-ready latent，减少中间转换，也固定了下游接口。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "1.2",
          "title": "Decoder、Encoder 与 Transformer-ready 接口",
          "desc": "分别查看全卷积 decoder 的一次前向解码、结构对偶的 encoder，以及直接交付 16×、128 通道 latent 的接口设计。",
          componentId: "vae-architecture-lab"
        }
      ],
      "insight": "Mage-VAE 的轻量化来自适合高分辨率的计算图，而不是简单地把网络参数做少。",
      "formula": {
        "lead": "Mage-VAE 直接输出可送入 NR-MMDiT 的潜变量网格",
        "unicode": "x ∈ ℝ<sup>H×W×3</sup> → z ∈ ℝ<sup>H/16×W/16×128</sup>",
        "symbols": [
          { "sym": "x", "desc": "输入 RGB 图像；H、W 分别是图像高度和宽度。" },
          { "sym": "z", "desc": "空间高宽各下采样 16 倍、通道数为 128 的 Transformer-ready latent。" }
        ]
      },
      "takeaways": [
        { "icon": "🧱", "title": "全卷积 Decoder", "desc": "卷积扩散块与解耦像素头避免全局注意力，最终一次前向完成解码。" },
        { "icon": "↔️", "title": "对偶 Encoder", "desc": "一次前向编码真实图像，降低大规模训练和反复编辑的输入成本。" },
        { "icon": "🔌", "title": "接口内化", "desc": "将原来的 2×2 patchification 内化，直接生成 16×、128 通道 latent。" }
      ],
      "prerequisiteRefs": ["latent-vae"],
      "quiz": [
        {
          "id": "quiz-1-architecture",
          "prompt": "论文说 Mage-VAE 是“一步”的准确含义是什么？",
          "options": [
            { "id": "a", "text": "最终 encoder 和 decoder 各用一次网络前向完成编解码。", "feedback": "正确。“一步”描述部署时的编解码执行。" },
            { "id": "b", "text": "Mage-VAE 从初始化到训练结束只更新一次参数。", "feedback": "训练包含多步预训练、蒸馏和联合微调，不是一次参数更新。" },
            { "id": "c", "text": "整套 Mage-Flow 只采样一步即可生成图像。", "feedback": "VAE 的一步编解码与生成骨干的采样步数不同。" }
          ],
          "correctOptionId": "a",
          "explanation": "多步扩散训练提供能力，最终被蒸馏成一次前向的 encoder 与 decoder；这不等于整个生成过程只有一步。",
        }
      ]
    },
    {
      "kind": "section",
      "id": "part-1-training",
      "title": "Anchor latent 与三阶段训练",
      "badge": "trn",
      "badgeLabel": "训练机制",
      "bridge": "计算图变轻以后，还要回答两个问题：怎样保留强 decoder 的能力，以及怎样避免轻量 encoder 学出一套下游骨干无法使用的新潜空间。",
      "analogy": {
        "title": "换一台更快的翻译器，但不能改变词典含义",
        "text": "像素重建得像，只说明译回图片没有明显错误；生成骨干还要求每个 latent token 保持原有“语义坐标”。冻结的 FLUX.2-VAE 充当参照词典，anchor KL 让 Mage-VAE 在变快时仍尽量使用同一套潜空间语言。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "1.3",
          "title": "三阶段训练：先获得能力，再单步化，最后对齐",
          "desc": "Stage I 分别预训练多步 encoder 和 decoder；Stage II 将 decoder 蒸馏为单步；Stage III 先固定 decoder 训练单步 encoder，再解冻二者联合微调。论文原图给出三个阶段及其依赖关系。",
          componentId: "static-figure",
          "figure": "./images/mage-vae-training.png",
          "figureCaption": "论文 Figure 6：左侧给出 FLUX.2 anchor 与 Mage-VAE 对偶架构，右侧展示三阶段训练过程。"
        },
        {
          kind: "module",
          "id": "1.4",
          "title": "开关 anchor KL：潜空间对齐还是漂移",
          "desc": "切换 anchor KL 约束，观察轻量 encoder 的 posterior 是否被拉向 FLUX.2 的 generation-ready latent 分布。",
          componentId: "vae-anchor-lab"
        },
        {
          kind: "module",
          "id": "1.5",
          "title": "三阶段各自解决什么问题",
          "desc": "多步预训练提供能力、decoder 蒸馏提供速度、encoder 单步化与联合微调配合 anchor KL 保证潜空间可用性。",
          componentId: "vae-training-lab"
        }
      ],
      "insight": "多步模型是能力教师，单步模型是部署形态，anchor latent 则负责把新 tokenizer 留在可供现有生成骨干使用的坐标系里。",
      "formula": {
        "lead": "以冻结 FLUX.2-VAE 的条件 latent 分布替代标准高斯先验",
        "unicode": "ℒ<sub>KL</sub> = 𝔼<sub>x</sub>[D<sub>KL</sub>(q<sub>φ</sub>(z|x) ∥ q<sub>a</sub>(z|x))]",
        "symbols": [
          { "sym": "q<sub>φ</sub>(z|x)", "desc": "Mage-VAE encoder 产生的 posterior。" },
          { "sym": "q<sub>a</sub>(z|x)", "desc": "由冻结 FLUX.2-VAE anchor latent 定义的参照分布。" }
        ]
      },
      "takeaways": [
        { "icon": "1", "title": "多步预训练", "desc": "先让 encoder 和 decoder 两个方向获得充分的扩散式建模能力。" },
        { "icon": "2", "title": "Decoder 蒸馏", "desc": "ℓ1、LPIPS、DINOv2 projected GAN 与 DMD 共同约束单步重建。" },
        { "icon": "3", "title": "联合单步化", "desc": "先固定 decoder 训练 encoder，再联合微调，并持续使用 anchor KL。" }
      ],
      "prerequisiteRefs": ["latent-vae"],
      "quiz": [
        {
          "id": "quiz-1-anchor",
          "prompt": "Anchor KL 最关键的作用是什么？",
          "options": [
            { "id": "a", "text": "强迫所有图像使用完全相同的 latent。", "feedback": "它对齐的是条件分布，不是把不同图像压成同一个表示。" },
            { "id": "b", "text": "让 Mage-VAE posterior 接近 FLUX.2 的 generation-ready latent 分布，抑制漂移。", "feedback": "正确。这样重建之外还保留了下游生成骨干需要的潜空间结构。" },
            { "id": "c", "text": "把 decoder 的推理次数从四步降到一步。", "feedback": "单步化主要由蒸馏完成，anchor KL 负责潜空间对齐。" }
          ],
          "correctOptionId": "b",
          "explanation": "Anchor KL 解决的是 latent 兼容性，而不是像素损失或采样步数问题。",
        },
        {
          "id": "quiz-1-training",
          "prompt": "哪一项最准确地概括三阶段训练的顺序？",
          "options": [
            { "id": "a", "text": "直接联合训练一步模型，再增加全局注意力。", "feedback": "论文先建立多步建模能力，且轻量设计明确避免昂贵全局注意力。" },
            { "id": "b", "text": "多步预训练 → decoder 单步蒸馏 → encoder 单步化并联合微调。", "feedback": "正确。能力、速度与端到端适配按这一顺序建立。" },
            { "id": "c", "text": "先训练 encoder → 冻结整个 VAE → 只训练像素 GAN。", "feedback": "这忽略了 decoder 的多步预训练、DMD 蒸馏与最终联合微调。" }
          ],
          "correctOptionId": "b",
          "explanation": "三阶段训练不是单一损失的一次训练，而是先学能力、再压缩 decoder、最后完成 encoder 和整体对齐。",
        }
      ]
    },
    {
      "kind": "section",
      "id": "part-1-results",
      "title": "最终收益：参数没有明显减少，计算却下降一个数量级",
      "badge": "both",
      "badgeLabel": "结果与边界",
      "bridge": "评价 Mage-VAE 不能只数参数：真正需要核对的是每像素计算、不同分辨率下的延迟与显存，以及 tokenizer 交换后的生成和编辑表现。",
      "analogy": {
        "title": "发动机重量相近，不代表油耗相同",
        "text": "Mage-VAE encoder 从 34M 增至 49M 参数，看起来并没有“缩小”；但它去掉不适合高分辨率的昂贵路径，使每个像素实际经过的计算大幅减少。参数量描述储存了多少权重，kMACs/像素才更接近这里关心的执行成本。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "1.6",
          "title": "计算下降多少，重建质量是否守住？",
          "desc": "在 CLIC 2020 原生分辨率协议下切换 tokenizer，对照编码/解码 kMACs 与 PSNR、LPIPS。FFHQ、不同分辨率延迟以及 tokenizer-swap 的生成编辑实验共同补充了这张表无法单独回答的问题。",
          componentId: "vae-tokenizer-lab"
        }
      ],
      "insight": "Mage-VAE 的价值不是“更小的 VAE”，而是“更适合高分辨率执行、又保留 generation-ready 潜空间的 VAE”。",
      "takeaways": [
        { "icon": "12.3×", "title": "编码计算下降", "desc": "FLUX.2-VAE 的 2134 降至 Mage-VAE 的 173 kMACs/像素。" },
        { "icon": "22.3×", "title": "解码计算下降", "desc": "FLUX.2-VAE 的 4798 降至 Mage-VAE 的 215 kMACs/像素。" },
        { "icon": "≈", "title": "质量与兼容性基本守住", "desc": "CLIC 2020、FFHQ 重建接近强基线，tokenizer-swap 后生成与编辑指标仅小幅波动。" }
      ],
      "prerequisiteRefs": ["evaluation-protocol"],
      "quiz": [
        {
          "id": "quiz-1-results",
          "prompt": "为什么 Mage-VAE 参数量没有明显下降，却仍能称为高效？",
          "options": [
            { "id": "a", "text": "参数量与计算效率完全无关，所以可以忽略所有指标。", "feedback": "参数量仍有意义，只是不能单独代表高分辨率执行成本。" },
            { "id": "b", "text": "它重构了高分辨率计算图，使每像素编解码计算大幅下降，同时保持接近的质量。", "feedback": "正确。这里的效率证据来自 kMACs、延迟和显存，而非单看参数。" },
            { "id": "c", "text": "因为它把所有计算都转移给 NR-MMDiT。", "feedback": "Mage-VAE 仍独立负责像素与 latent 的转换，并没有把编解码交给生成骨干。" }
          ],
          "correctOptionId": "b",
          "explanation": "执行路径和算子类型决定了实际计算；Mage-VAE 以更适合高分辨率的全卷积结构换取数量级的 kMACs 降低。",
        }
      ]
    },
    {
      kind: "chapter",
      "id": "part-2-buckets",
      "title": "定长 batch 为什么需要分辨率桶？",
      "badge": "trn",
      "badgeLabel": "训练组织",
      "bridge": "Mage-VAE 保留图像的原生长宽比，因此不同图片会产生不同数量的视觉 token；标准张量堆叠要求形状一致，这正是分辨率桶出现的原因。",
      "analogy": {
        "title": "固定尺寸的托盘，只能装同一种箱子",
        "text": "传统 batch 像固定尺寸托盘：同一次运输中的箱子必须一样大，于是连续变化的真实画幅被归入少量预设规格。这样便于堆叠，却让一个 step 只能看到一种画幅，极宽或极高的样本还要专门增加新托盘。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "2.1",
          "title": "同一个 step：分辨率桶 vs 原生打包",
          "desc": "对比传统分桶 batch 与原生打包 batch 中样本的分辨率构成，直观看到 bucket-quantization mismatch 和单一画幅限制。",
          componentId: "bucket-mismatch-lab"
        }
      ],
      "insight": "分桶解决的是定长张量堆叠问题，但代价是 bucket-quantization mismatch，以及一个 step 只能接触单一分辨率和长宽比。",
      "formula": {
        "lead": "视觉序列长度由下采样后的二维网格面积决定",
        "unicode": "N<sub>i</sub> = H′<sub>i</sub>W′<sub>i</sub>",
        "symbols": [
          { "sym": "H′<sub>i</sub>, W′<sub>i</sub>", "desc": "第 i 张图经 Mage-VAE 后保留长宽比的 latent 网格尺寸。" },
          { "sym": "N<sub>i</sub>", "desc": "展平后的视觉 token 数；不同图像通常具有不同 Nᵢ。" }
        ]
      },
      "takeaways": [
        { "icon": "≠", "title": "序列天然变长", "desc": "在相同 16× 下采样率下，不同像素尺寸仍对应不同 latent 网格和 token 数。" },
        { "icon": "🪣", "title": "分桶方便堆叠", "desc": "传统方案让一个 step 只从同一尺寸桶取样，以构造普通定长 batch。" },
        { "icon": "△", "title": "连续分布被量化", "desc": "有限预设桶难以完整覆盖真实尺寸分布、变长文本和极端画幅。" }
      ],
      "prerequisiteRefs": ["latent-vae", "tokens-attention"],
      "quiz": [
        {
          "id": "quiz-2-buckets",
          "prompt": "传统训练为什么常要求一个 step 中的图像来自同一个分辨率桶？",
          "options": [
            { "id": "a", "text": "为了让 latent 形状一致，从而可以堆叠成普通定长 batch。", "feedback": "正确。分桶首先解决的是张量形状和批处理问题。" },
            { "id": "b", "text": "因为 MMDiT 只能生成正方形图片。", "feedback": "MMDiT 并非只能生成正方形；限制来自传统 batch 组织。" },
            { "id": "c", "text": "为了让每张图片的视觉 token 永远只有 1,024 个。", "feedback": "不同桶仍可对应不同 token 数，只是同一步内选择相同形状。" }
          ],
          "correctOptionId": "a",
          "explanation": "普通 batch 需要每个样本张量形状一致；预设桶以牺牲同一步的尺寸多样性换取直接堆叠。",
        }
      ]
    },
    {
      "kind": "section",
      "id": "part-2-packing",
      "title": "从单样本联合序列到多样本原生打包",
      "badge": "trn",
      "badgeLabel": "训练机制",
      "bridge": "原生打包分两层理解：先在每个样本内部形成文本—图像联合序列，再把多个不同长度的样本连续放入同一大张量。",
      "analogy": {
        "title": "每位乘客带着自己的行李上车，座位边界不能混",
        "text": "文本条件和图像 token 先组成一个完整样本，多个样本再首尾相接进入同一车厢。连续存放节省空位，但车票仍记录每位乘客的起止位置；FlashAttention 依据这些边界，禁止注意力越过样本。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "2.2",
          "title": "Sᵢ 如何组成，多个 Sᵢ 又如何安全地连续存放？",
          "desc": "图像经 Mage-VAE、展平和线性投影得到 Zᵢ；prompt 经冻结 Qwen3-VL 得到 τᵢ。在单样本内部，二者构成联合序列 Sᵢ=[τᵢ;Zᵢ]：两种模态保留各自归一化与投影，但在 joint self-attention 中交互。图中以 S₂ 为例标出注意力边界。",
          componentId: "packing-boundary-lab"
        }
      ],
      "insight": "多个样本在显存中相邻，不等于它们能彼此注意；物理布局由 packing 决定，逻辑隔离由 variable-length attention 的累计边界决定。",
      "formula": {
        "lead": "样本序列首尾相接，累计长度标出每个样本的起止位置",
        "unicode": "S<sub>packed</sub> = [S₁; S₂; …; S<sub>B</sub>], cu_seqlens = [0, |S₁|, |S₁|+|S₂|, …]",
        "symbols": [
          { "sym": "S<sub>i</sub>", "desc": "第 i 个样本的文本条件 τᵢ 与视觉 token Zᵢ 组成的联合序列。" },
          { "sym": "cu_seqlens", "desc": "累计长度边界；FlashAttention variable-length kernel 据此隔离样本。" }
        ]
      },
      "takeaways": [
        { "icon": "[τ;Z]", "title": "样本内联合", "desc": "文本和图像使用模态专属投影，并在 joint self-attention 中直接交互。" },
        { "icon": "∑", "title": "样本间连续", "desc": "不同长度的 Sᵢ 首尾相接，避免补齐到 batch 中的最大长度。" },
        { "icon": "│", "title": "累计边界隔离", "desc": "无需显式巨大块对角 mask，变长 kernel 依据 cu_seqlens 限制注意力范围。" }
      ],
      "prerequisiteRefs": ["tokens-attention"],
      "quiz": [
        {
          "id": "quiz-2-packing",
          "prompt": "哪一步才是多个样本之间的原生分辨率 packing？",
          "options": [
            { "id": "a", "text": "在单个样本内让文本 token 与图像 token 进行联合注意力。", "feedback": "这是 MMDiT 的样本内多模态交互，还没有发生多样本 packing。" },
            { "id": "b", "text": "把不同长度的 Sᵢ 连续存放，并记录每个样本的累计长度边界。", "feedback": "正确。这一步才把多个变长样本组织成 packed sequence。" },
            { "id": "c", "text": "把所有 latent 补齐到最长图像，再执行普通注意力。", "feedback": "原生 packing 正是为了避免这种最大长度 padding。" }
          ],
          "correctOptionId": "b",
          "explanation": "文本—图像联合是样本内部结构；多样本 packing 额外需要连续存储与 cu_seqlens。",
        },
        {
          "id": "quiz-2-boundary",
          "prompt": "为什么 packed sequence 中相邻的两个样本不会互相注意？",
          "options": [
            { "id": "a", "text": "因为两个样本一定使用不同 GPU。", "feedback": "它们可以位于同一个大张量和同一设备上。" },
            { "id": "b", "text": "因为 2D RoPE 会自动屏蔽其他样本。", "feedback": "2D RoPE 编码空间位置，不负责样本注意力隔离。" },
            { "id": "c", "text": "因为 variable-length attention 根据 cu_seqlens 将计算限制在各自边界内。", "feedback": "正确。边界来自累计偏移，而不是连续存储位置本身。" }
          ],
          "correctOptionId": "c",
          "explanation": "FlashAttention 的变长 kernel 使用累计起止位置执行分段注意力，因此不需要显式巨大 mask。",
        }
      ]
    },
    {
      "kind": "section",
      "id": "part-2-position-budget",
      "title": "固定 token 预算与逐样本空间坐标",
      "badge": "trn",
      "badgeLabel": "训练机制",
      "bridge": "边界解决了谁能关注谁，仍有两个问题：怎样稳定每一步的训练负载，以及展平后怎样保留各张图自身的二维布局。",
      "analogy": {
        "title": "车厢总座位固定，地图坐标却要逐张重置",
        "text": "小画幅占座少，同一 token 预算中可以放入更多样本；大画幅占座多，样本数相应减少。上车顺序只是显存位置，不能当作图像坐标，因此每张图都要保留自己的 (h,w) 网格。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "2.3",
          "title": "为什么不能直接使用 packed sequence 的一维位置？",
          "desc": "每个样本在大张量中的起点不同，但视觉 token 的空间意义应由原图网格决定。切换 packed 一维位置、生成 2D RoPE 与编辑 (h,w,f) 坐标，比较它们表达的信息。",
          componentId: "spatial-position-lab"
        },
        {
          kind: "module",
          "id": "2.4",
          "title": "拖动原生画布：token 数随画幅变化",
          "desc": "拖动画布宽高（论文展示范围为每边 512–2048），观察变长 token 序列如何在固定预算内与其他样本共同打包。",
          componentId: "native-pack-lab"
        }
      ],
      "insight": "cu_seqlens 负责样本边界，2D RoPE 负责图像内部空间；二者互补但不能互相替代。",
      "formula": {
        "lead": "生成保留二维坐标，编辑再增加区分源图与目标图的 frame 维",
        "unicode": "generation: (h,w) → editing: (h,w,f)",
        "symbols": [
          { "sym": "(h,w)", "desc": "视觉 token 在其所属图像 latent 网格中的二维位置。" },
          { "sym": "f", "desc": "编辑模型中的 frame 标识，用于区分源图和目标图。" }
        ]
      },
      "takeaways": [
        { "icon": "ΣN", "title": "固定总 token 预算", "desc": "小图可混入更多样本，大图相应减少样本数，从而控制每步负载。" },
        { "icon": "(h,w)", "title": "逐样本 2D RoPE", "desc": "位置按各自 latent 网格定义，不沿整个 packed sequence 一维累加。" },
        { "icon": "512—2048", "title": "论文展示范围", "desc": "高度与宽度覆盖 512—2048，并展示 512×2048 和 2048×512；范围外能力不能外推。" }
      ],
      "prerequisiteRefs": ["tokens-attention", "evaluation-protocol"],
      "quiz": [
        {
          "id": "quiz-2-position",
          "prompt": "cu_seqlens 与 2D RoPE 的职责分别是什么？",
          "options": [
            { "id": "a", "text": "前者隔离样本注意力，后者保留每张图内部的二维空间位置。", "feedback": "正确。边界和空间是两个独立问题。" },
            { "id": "b", "text": "前者记录图像颜色，后者决定 batch 中有多少样本。", "feedback": "二者都不承担这些职责。" },
            { "id": "c", "text": "两者完全等价，保留其中一个即可。", "feedback": "缺少任意一个都会丢失样本隔离或图像空间结构。" }
          ],
          "correctOptionId": "a",
          "explanation": "累计边界限制注意力范围；二维位置编码告诉模型 token 在所属图像网格中的相对空间关系。",
        }
      ]
    },
    {
      "kind": "section",
      "id": "part-2-packed-cfg",
      "title": "推理侧：同一种 packing 如何用于 CFG",
      "badge": "inf",
      "badgeLabel": "推理效率",
      "bridge": "训练侧把不同图像样本打包，推理侧则把同一步中的条件与无条件 CFG 分支视为两个变长样本，一次送入骨干。",
      "analogy": {
        "title": "两张校样放在同一块工作台检查",
        "text": "设计师仍需要“有要求”和“无要求”两张校样，也仍按原公式合成结果；改变的是把两张校样放入一次检查，减少重复打开工具、补齐和调度的成本。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "2.5",
          "title": "条件与无条件分支的一次打包前向",
          "desc": "查看 CFG 两条分支如何作为两个变长样本共享同一次前向执行，同时保持原有采样轨迹与合成公式不变。",
          componentId: "packed-cfg-lab"
        }
      ],
      "insight": "packed CFG 的收益来自减少独立前向、kernel launch、padding 与调度开销，而不是改变采样算法本身。",
      "takeaways": [
        { "icon": "⇉", "title": "一次前向，两条分支", "desc": "条件与无条件分支作为两个变长样本共同执行。" },
        { "icon": "=", "title": "CFG 轨迹不变", "desc": "仍得到 v_cond 和 v_uncond，并按原指导公式组合。" },
        { "icon": "1.09—1.15×", "title": "有限但真实的加速", "desc": "论文报告约 1.09×—1.15× 推理加速；它不是把全部 CFG 算术量消除。" }
      ],
      "prerequisiteRefs": ["tokens-attention", "conditioning-cfg", "evaluation-protocol"],
      "quiz": [
        {
          "id": "quiz-2-cfg",
          "prompt": "packed CFG 的 1.09×—1.15× 加速主要来自哪里？",
          "options": [
            { "id": "a", "text": "彻底删除无条件分支的所有算术计算。", "feedback": "两条分支的结果仍然都需要得到。" },
            { "id": "b", "text": "减少独立前向、kernel launch、padding 与调度开销。", "feedback": "正确。它优化执行组织，而非取消 CFG 定义。" },
            { "id": "c", "text": "自动把任意采样器蒸馏成四步模型。", "feedback": "少步蒸馏属于 Part 4，与 packed CFG 处在不同层级。" }
          ],
          "correctOptionId": "b",
          "explanation": "packed CFG 保持两条分支和去噪轨迹，只把它们组织为同一次变长前向。",
        }
      ]
    },
    {
      kind: "chapter",
      "id": "part-3-memory-bound",
      "title": "FLOPs 没有明显减少，为什么仍能更快？",
      "badge": "trn",
      "badgeLabel": "系统瓶颈",
      "bridge": "卷积、矩阵乘法和 Attention 承担主要算术量，但重复 Block 中夹杂的大量小算子可能受限于数据搬运，而不是受限于计算单元。",
      "analogy": {
        "title": "真正拖慢流水线的是反复去仓库取料",
        "text": "工人完成每道小工序只需几秒，却必须在工序之间把整批材料送回仓库，再重新取出。单看加工次数不会发现问题；减少仓库往返和重复开工手续，才会释放整条流水线的速度。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "3.1",
          "title": "独立 kernel vs 融合 kernel",
          "desc": "切换执行方式，比较 kernel launch 次数与中间激活的 HBM 往返，确认理论 FLOPs 近似不变。",
          componentId: "kernel-traffic-lab"
        },
        {
          kind: "module",
          "id": "3.2",
          "title": "三个相对档位：瓶颈落在谁身上",
          "desc": "切换相对档位，观察分词器、生成骨干与内存流量的负载变化，定位栈级瓶颈。",
          componentId: "stack-bottleneck-lab"
        }
      ],
      "insight": "算子融合主要提高算术强度和执行效率：减少的是数据搬运与调度，不是模型参数量，也不一定明显改变理论 FLOPs。",
      "takeaways": [
        { "icon": "↕", "title": "Memory-bound 小算子", "desc": "计算很少，但每次都可能读取和写回大块激活张量。" },
        { "icon": "🚀", "title": "Kernel launch 有固定成本", "desc": "重复 Block 中大量零散启动会累积成可观的调度开销。" },
        { "icon": "≠", "title": "参数与 FLOPs 近似不变", "desc": "融合改变 CUDA 执行路径，并不改变模型数学定义或训练目标。" }
      ],
      "prerequisiteRefs": ["tokens-attention"],
      "quiz": [
        {
          "id": "quiz-3-memory",
          "prompt": "栈级 CUDA 算子融合主要减少了什么？",
          "options": [
            { "id": "a", "text": "模型参数量与 Attention 的全部理论 FLOPs。", "feedback": "融合通常不明显改变参数量或主要矩阵计算的理论 FLOPs。" },
            { "id": "b", "text": "小算子之间重复的 HBM 读写与 kernel launch 开销。", "feedback": "正确。这些 memory-bound 成本正是融合的主要目标。" },
            { "id": "c", "text": "训练数据中的低质量图片。", "feedback": "数据筛选属于 Part 5，不是 CUDA 执行优化。" }
          ],
          "correctOptionId": "b",
          "explanation": "融合让连续操作共享一次 kernel，中间值尽量留在片上，只把最终结果写回显存。",
        }
      ]
    },
    {
      "kind": "section",
      "id": "part-3-stack-fusion",
      "title": "Mage-Flow 的三个子系统分别融合什么？",
      "badge": "trn",
      "badgeLabel": "融合范围",
      "bridge": "局部融合只有放进高频重复 Block 才能形成整栈收益。论文同时覆盖 Mage-VAE、冻结的 Qwen3-VL 文本编码器和 4B NR-MMDiT。",
      "analogy": {
        "title": "不是建一个万能车间，而是改造三条重复产线",
        "text": "卷积 VAE 与 Transformer 的工序不同，因此不能强行使用同一条融合链。论文分别识别三类 Block 中反复出现的 memory-bound 路径，再为各自产线定制 CUDA kernel。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "3.3",
          "title": "三个子系统各自的融合链",
          "desc": "切换 Mage-VAE、Qwen3-VL 与 4B NR-MMDiT，查看每条重复 Block 中被融合的小算子链及其原因。",
          componentId: "fusion-stack-detail-lab"
        }
      ],
      "insight": "中间结果尽量停留在寄存器或共享内存等片上存储中，只将融合链的最终输出写回 HBM。",
      "takeaways": [
        { "icon": "VAE", "title": "卷积扩散块", "desc": "融合 normalization、activation 与 residual 链。" },
        { "icon": "TXT", "title": "文本 Transformer", "desc": "融合自适应归一化、RoPE 与门控残差等常见路径。" },
        { "icon": "4B", "title": "NR-MMDiT 主干", "desc": "同类链存在于大量 4B 重复 Block 中，前向和反向都会累积收益。" }
      ],
      "prerequisiteRefs": ["tokens-attention"],
      "quiz": [
        {
          "id": "quiz-3-stack",
          "prompt": "为什么论文没有只优化单个最重的矩阵乘法？",
          "options": [
            { "id": "a", "text": "因为主要矩阵乘法完全不消耗时间。", "feedback": "卷积、矩阵乘法和 Attention 仍是主要算术来源。" },
            { "id": "b", "text": "因为重复 Block 间的小算子链会产生大量内存流量和启动开销，需要整栈处理。", "feedback": "正确。融合补的是主算子之间的执行效率缺口。" },
            { "id": "c", "text": "因为 CUDA 不能执行矩阵乘法。", "feedback": "CUDA 当然可以高效执行矩阵乘法；问题在零散小算子的组织。" }
          ],
          "correctOptionId": "b",
          "explanation": "高效主算子之间若夹着大量独立的 memory-bound kernel，完整训练步骤仍会受到显存流量和调度限制。",
        }
      ]
    },
    {
      "kind": "section",
      "id": "part-3-results",
      "title": "逐项消融：最大收益来自 4B NR-MMDiT",
      "badge": "trn",
      "badgeLabel": "训练证据",
      "bridge": "最终 2.48× 并非全部来自 CUDA：先替换轻量 Mage-VAE，再依次加入 VAE、文本编码器和 NR-MMDiT 融合，才能看清架构与系统优化各自贡献。",
      "analogy": {
        "title": "逐段改造生产线，才能知道瓶颈在哪里",
        "text": "先更换高分辨率编解码设备，再逐条合并三个子系统的零散工序。VAE 与文本侧融合只带来小幅增益；当高频执行的 4B 主干完成融合后，时间、利用率和峰值显存才出现最大跃迁。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "3.4",
          "title": "逐层打开优化，观察时间、MFU 与峰值显存",
          "desc": "按 Table 4 的五个阶段切换：FLUX.2-VAE 基线、仅替换 Mage-VAE、VAE Fuse、Text Fuse、NR-MMDiT Fuse。注意前两项比较架构替换，后三项才是逐层 CUDA 融合。",
          componentId: "cuda-fusion-lab"
        },
        {
          kind: "module",
          "id": "3.5",
          "title": "只缩骨干 vs 全栈协同设计",
          "desc": "对比只压缩骨干与协同优化分词器、打包和内存流量两种方案的概念负载，理解为什么单点优化不够。",
          componentId: "codesign-repair-lab"
        }
      ],
      "insight": "完整系统从 1.9285 降至 0.7775 秒/步，但因果应写成“轻量 VAE 替换 + 栈级融合”的联合收益；其中融合侧最大增量来自 NR-MMDiT。",
      "formula": {
        "lead": "在论文的 8-GPU B200 训练协议下计算完整系统相对加速",
        "unicode": "speedup = 1.9285 / 0.7775 ≈ 2.48×",
        "symbols": [
          { "sym": "1.9285", "desc": "FLUX.2-VAE、未启用三个融合项时的基线秒/步。" },
          { "sym": "0.7775", "desc": "替换 Mage-VAE 并完成三类融合后的秒/步。" }
        ]
      },
      "takeaways": [
        { "icon": "0.7775s", "title": "训练单步时间", "desc": "完整系统由 1.9285 秒/步降至 0.7775 秒/步。" },
        { "icon": "29.28%", "title": "MFU 提升", "desc": "模型 FLOP 利用率从 13.88% 提升到 29.28%。" },
        { "icon": "141.44GB", "title": "峰值显存下降", "desc": "单卡峰值显存从 175.45 GB 降至 141.44 GB。" }
      ],
      "prerequisiteRefs": ["evaluation-protocol"],
      "quiz": [
        {
          "id": "quiz-3-ablation",
          "prompt": "从逐项消融看，哪个 CUDA 融合阶段贡献最大？",
          "options": [
            { "id": "a", "text": "Mage-VAE 融合。", "feedback": "VAE Fuse 只带来很小的附加变化；Mage-VAE 的主要收益来自前一步架构替换。" },
            { "id": "b", "text": "Qwen3-VL 文本编码器融合。", "feedback": "文本侧融合有额外收益，但幅度明显小于主干。" },
            { "id": "c", "text": "4B NR-MMDiT 融合。", "feedback": "正确。大量重复主干 Block 使局部融合累积成最大增益。" }
          ],
          "correctOptionId": "c",
          "explanation": "NR-MMDiT 是训练步骤中反复执行的 4B 主干，因此其 memory-bound 链融合贡献最大。",
        },
        {
          "id": "quiz-3-evidence",
          "prompt": "对 2.48× 结果最准确的表述是什么？",
          "options": [
            { "id": "a", "text": "它完全由 CUDA 融合单独产生，并适用于所有 GPU 推理。", "feedback": "结果还包含 Mage-VAE 替换，且协议是 8-GPU B200 训练。" },
            { "id": "b", "text": "它是 Mage-VAE 替换与整栈融合在指定 B200 训练协议下的联合端到端收益。", "feedback": "正确。必须同时保留优化组成和硬件协议。" },
            { "id": "c", "text": "它表示模型参数量减少了 2.48 倍。", "feedback": "2.48× 是训练速度比，不是参数压缩比。" }
          ],
          "correctOptionId": "b",
          "explanation": "Table 4 的基线到最终行跨越 tokenizer 替换和三个融合步骤，且测量条件是单个 8-GPU NVIDIA B200 节点。",
        }
      ]
    },
    {
      kind: "chapter",
      "id": "part-4-inference-family",
      "title": "从教师轨迹到少步学生",
      "badge": "inf",
      "badgeLabel": "推理基础",
      "bridge": "打包式 CFG 优化了每一步，但低延迟还需要减少总步数。先区分 Base、对齐版与 Turbo，再看学生如何从长轨迹压缩到四步。",
      "analogy": {
        "title": "四格秒表完成一次渲染",
        "text": "极速版把对齐教师压缩到四步，让同一张海报更快到达完成态。但步数减少是质量与延迟的取舍，不能直接等同于打包式 CFG 的分支合并。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "4.1",
          "title": "逐步采样：三个版本怎样取舍",
          "desc": "选择基础版、对齐版或极速版并逐步推进采样，区分模型步数、打包式 CFG 与四步 Turbo 的不同效率来源。",
          componentId: "inference-family-lab"
        }
      ],
      "insight": "速度来自两类互补改动：打包式 CFG 减少同一路径的重复前向，四步 Turbo 则用蒸馏改变所需采样步数。",
      "takeaways": [
        {
          "icon": "30·20·4",
          "title": "三个推理档位",
          "desc": "论文默认文生图评测中，基础版、对齐版、极速版分别使用 30、20、4 个去噪步。"
        },
        {
          "icon": "↔",
          "title": "先分清版本角色",
          "desc": "Base 提供基础能力，对齐版改善偏好，Turbo 再从对齐教师蒸馏少步学生。"
        },
        {
          "icon": "⚖",
          "title": "低延迟不是全指标胜出",
          "desc": "Turbo 在 A100、1024² 报告 0.59 秒端到端生成，但四步取舍不能被表述为所有质量指标都超过对齐版。"
        }
      ],
      "prerequisiteRefs": [
        "rectified-flow",
        "conditioning-cfg",
        "evaluation-protocol"
      ],
      "quiz": [
        {
          "id": "quiz-6-1",
          "prompt": "打包式 CFG 与四步 Turbo 的关键区别是什么？",
          "options": [
            {
              "id": "a",
              "text": "前者合并条件/无条件分支的前向，后者通过蒸馏减少采样步数。",
              "feedback": "正确。它们作用在不同层面，因此速度数字不能混成同一个来源。"
            },
            {
              "id": "b",
              "text": "两者都是把 20 步固定改成 4 步。",
              "feedback": "打包式 CFG 保留原去噪轨迹，不等于把采样改成四步。"
            },
            {
              "id": "c",
              "text": "两者都只发生在训练阶段。",
              "feedback": "CFG 打包是推理执行优化，Turbo 蒸馏也直接改变推理步数。"
            }
          ],
          "correctOptionId": "a",
          "explanation": "打包式 CFG 减少一次采样步骤内的重复前向；Turbo 蒸馏减少完成生成所需的采样步骤。",
        }
      ]
    },
    {
      "kind": "section",
      "id": "part-4-rectified-flow",
      "title": "整流流：从噪声到图像的多次短距离更新",
      "badge": "both",
      "badgeLabel": "训练与推理",
      "bridge": "理解少步蒸馏前，先明确原模型学的是什么：它在噪声与真实 latent 的直线路径上预测速度，再由采样器多次积分回到数据端。",
      "analogy": {
        "title": "沿导航箭头分段行走",
        "text": "教师像不断重新校准方向的导航员：每次只走一小段，再根据当前位置预测下一段速度。步数多时，单次方向误差不容易造成巨大偏离。",
        componentId: "studio-analogy"
      },
      "modules": [],
      "insight": "整流流把训练定义为速度场回归；采样步数决定连续路径被离散成多少次 MMDiT 调用。",
      "formula": {
        "lead": "流匹配在随机时间点回归从噪声指向数据的速度",
        "unicode": "ℒ<sub>FM</sub>(θ)=𝔼[‖v<sub>θ</sub>(z<sub>t</sub>,t,c)−(z−ε)‖²<sub>2</sub>]",
        "symbols": [
          { "sym": "z<sub>t</sub>", "desc": "(1−t)z+tε；数据与噪声之间的中间状态。" },
          { "sym": "c", "desc": "Prompt、编辑指令和源图等条件。" }
        ]
      },
      "takeaways": [
        { "icon": "t=0", "title": "干净 latent", "desc": "直线路径的数据端，对应真实图像 latent z。" },
        { "icon": "t=1", "title": "纯噪声", "desc": "采样起点，对应高斯噪声 ε。" },
        { "icon": "v", "title": "预测速度场", "desc": "采样器重复调用 MMDiT，根据速度更新当前 latent。" }
      ],
      "prerequisiteRefs": ["rectified-flow", "latent-vae"],
      "quiz": [{
        "id": "quiz-4-flow",
        "prompt": "整流流训练时，NR-MMDiT 直接回归的目标是什么？",
        "options": [
          { "id": "a", "text": "在插值点 zₜ 上回归指向数据端的目标速度 z−ε。", "feedback": "正确。推理时再由采样器对这个速度场做多次数值更新。" },
          { "id": "b", "text": "直接预测最终 RGB 图像的像素值。", "feedback": "预测发生在潜空间，且目标是速度而不是像素。" },
          { "id": "c", "text": "预测每张候选图的奖励分数。", "feedback": "奖励信号属于 Diffusion-NFT 后训练，不是整流流预训练目标。" }
        ],
        "correctOptionId": "a",
        "explanation": "训练把流匹配定义为速度场回归；采样步数决定这条连续路径被离散成多少次 MMDiT 调用。",
      }]
    },
    {
      "kind": "section",
      "id": "part-4-large-step-student",
      "title": "四步学生不是把教师采样器直接改成四步",
      "badge": "both",
      "badgeLabel": "蒸馏目标",
      "bridge": "教师用生成约 20 步、编辑约 30 步完成短距离更新；四步推理让每次更新跨度显著变大，因此学生必须重新学习适合这些跨度的速度场。",
      "analogy": {
        "title": "从二十个小路标压缩成四次长距离导航",
        "text": "直接删除中间路标，原导航误差会在长距离行走中迅速放大。四步学生从教师 checkpoint 出发，重新训练出适合四个大跨度区间的新导航策略。",
        componentId: "studio-analogy"
      },
      "modules": [{
        kind: "module",
        "id": "4.2",
        "title": "多步教师、直接四步与蒸馏学生有何区别？",
        "desc": "教师来自 Base、SFT 与 Diffusion-NFT 后训练后的对齐 checkpoint，并在蒸馏时冻结；学生从相应教师初始化，主干规模基本不变，但参数继续更新以适应固定四步轨迹。",
        componentId: "large-step-distillation-lab"
      }],
      "insight": "少步蒸馏改变的是学生参数所描述的速度场，而不只是采样器配置；训练映射也不等于每次 iteration 都展开完整四步。",
      "formula": {
        "lead": "四步轨迹增大一次离散更新跨越的时间区间",
        "unicode": "z<sub>tₖ₊₁</sub> = z<sub>tₖ</sub> + (t<sub>k+1</sub>−t<sub>k</sub>)v<sub>θ</sub>(z<sub>tₖ</sub>,t<sub>k</sub>,c)",
        "symbols": [
          { "sym": "t<sub>k+1</sub>−t<sub>k</sub>", "desc": "一次更新跨度；四步轨迹的区间更大。" },
          { "sym": "S<sub>θ</sub>", "desc": "从某个带噪状态预测近干净样本 ẑ₀ 的学生映射。" }
        ]
      },
      "takeaways": [
        { "icon": "20/30", "title": "冻结对齐教师", "desc": "生成教师约 20 步、编辑教师约 30 步，提供目标分布与条件方向。" },
        { "icon": "4", "title": "重训四步学生", "desc": "学生从教师初始化，但参数需要针对四次大跨度更新继续学习。" },
        { "icon": "≠", "title": "不是简单删步", "desc": "直接改成四步会放大结构、细节、文字和指令误差。" }
      ],
      "prerequisiteRefs": ["rectified-flow"],
      "quiz": [{
        "id": "quiz-4-student",
        "prompt": "为什么不能直接把同一教师模型的采样步数改成四步？",
        "options": [
          { "id": "a", "text": "四步时每次跨越更长区间，原速度场的局部误差会被放大。", "feedback": "正确。学生需要针对大跨度更新重新训练。" },
          { "id": "b", "text": "因为四步推理必须把参数量缩小四倍。", "feedback": "Turbo 的主干规模基本不变。" },
          { "id": "c", "text": "因为教师从来没有学习速度场。", "feedback": "教师同样通过整流流学习速度场。" }
        ],
        "correctOptionId": "a",
        "explanation": "少步化增大离散积分跨度；蒸馏让学生速度场适应四个大跨度区间。",
      }]
    },
    {
      "kind": "section",
      "id": "part-4-decoupled-dmd",
      "title": "Decoupled-DMD：条件增强与分布匹配分开学习",
      "badge": "trn",
      "badgeLabel": "核心蒸馏",
      "bridge": "学生先从带噪 zₜ 预测近干净样本 ẑ₀，再把它独立加噪到 τca 与 τdm；两个分支分别解决条件遵循和整体分布问题。",
      "analogy": {
        "title": "一位老师检查是否答题，另一位检查整体作品集",
        "text": "CA 关心这张图有没有充分服从 Prompt 或编辑指令；DM 关心学生的一批作品在质量、结构和多样性上是否接近教师。两个目标不同，因此允许在不同噪声难度下工作。",
        componentId: "studio-analogy"
      },
      "modules": [{
        kind: "module",
        "id": "4.3",
        "title": "同一个 ẑ₀ 为什么要重新加噪成两个状态？",
        "desc": "调整 τ<sub>ca</sub> 与 τ<sub>dm</sub> 并切换分支。CA 使用冻结教师的有条件/无条件差，继承 CFG 增强方向；DM 使用冻结教师与可训练 fake-score 网络的差，修正学生整体生成分布。",
        componentId: "decoupled-dmd-lab"
      }],
      "insight": "DM 不是让教师判断单张图是否真实，也不是像素复制教师输出；它用目标分布与当前学生分布的预测差提供修正方向。",
      "formula": {
        "lead": "CA 与 DM 作用于独立重新加噪的状态",
        "unicode": "Δ<sub>CA</sub>=(w−1)[T<sup>real</sup><sub>cond</sub>(x<sup>ca</sup>)−T<sup>real</sup><sub>uncond</sub>(x<sup>ca</sup>)]<br/>Δ<sub>DM</sub>=T<sup>real</sup><sub>cond</sub>(x<sup>dm</sup>)−T<sup>fake</sup><sub>cond</sub>(x<sup>dm</sup>)",
        "symbols": [
          { "sym": "w=7.5", "desc": "CA 分支的教师 CFG 引导强度。" },
          { "sym": "T<sup>fake</sup>", "desc": "描述当前学生生成分布的可训练 fake-score 网络。" }
        ]
      },
      "takeaways": [
        { "icon": "CA", "title": "继承条件增强", "desc": "保留 Prompt、文字渲染和编辑指令遵循能力。" },
        { "icon": "DM", "title": "匹配整体分布", "desc": "匹配质量、结构和多样性，而非复现某张图。" },
        { "icon": "τ₁≠τ₂", "title": "噪声调度解耦", "desc": "两个目标可在不同噪声水平工作，提高蒸馏稳定性。" }
      ],
      "prerequisiteRefs": ["rectified-flow", "conditioning-cfg"],
      "quiz": [
        {
          "id": "quiz-4-ca-dm",
          "prompt": "CA 与 DM 的职责如何区分？",
          "options": [
            { "id": "a", "text": "CA 保留条件引导，DM 匹配学生与教师的整体生成分布。", "feedback": "正确。一个关注条件遵循，一个关注分布差异。" },
            { "id": "b", "text": "CA 减少参数量，DM 融合 CUDA kernel。", "feedback": "这两项都不是 Decoupled-DMD 的职责。" },
            { "id": "c", "text": "二者都要求学生逐像素复制教师。", "feedback": "它们提供方向性信号，不是逐像素教师复刻。" }
          ],
          "correctOptionId": "a",
          "explanation": "CA 来自教师条件与无条件预测差；DM 来自目标分布与学生分布估计的预测差。",
        },
        {
          "id": "quiz-4-decoupling",
          "prompt": "Decoupled-DMD 的关键设计是什么？",
          "options": [
            { "id": "a", "text": "让 CA 与 DM 使用独立的重新加噪时间分布。", "feedback": "正确。两种目标可在不同噪声水平工作。" },
            { "id": "b", "text": "删除教师，只训练 fake-score 网络。", "feedback": "冻结教师仍同时参与 CA 与 DM。" },
            { "id": "c", "text": "把四步学生扩展回三十步。", "feedback": "目标仍是四步推理。" }
          ],
          "correctOptionId": "a",
          "explanation": "τca 与 τdm 解耦，使条件增强和分布匹配不必共享同一噪声难度。",
        }
      ]
    },
    {
      "kind": "section",
      "id": "part-4-perceptual",
      "title": "DINOv2/CLIP 对抗感知引导：补回四步细节",
      "badge": "trn",
      "badgeLabel": "感知约束",
      "bridge": "Decoupled-DMD 负责条件与分布方向，但高度压缩的四步轨迹仍容易丢失纹理、局部结构、文字形状和真实感。",
      "analogy": {
        "title": "不仅检查答案正确，还要检查笔画和质感",
        "text": "冻结视觉基础模型像两套稳定的放大镜，判别器在其特征上学习区分真实目标与学生结果，并把感知误差传回学生。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "4.4",
          "title": "开关对抗感知引导",
          "desc": "对比仅 Decoupled-DMD 与加入 DINOv2/CLIP 特征判别器的差异，注意判别器与学生 5:1 的交替更新节奏。",
          componentId: "perceptual-guidance-lab"
        }
      ],
      "insight": "对抗感知引导补的是特征空间的局部与真实感，不替代 CA 的条件遵循或 DM 的整体分布匹配。",
      "formula": {
        "lead": "三个互补方向共同更新四步学生",
        "unicode": "∇L<sub>Total</sub> = Δ<sub>CA</sub> + Δ<sub>DM</sub> + λ<sub>GAN</sub>∇L<sub>GAN</sub><br/>λ<sub>GAN</sub>=0.13",
        "symbols": [
          { "sym": "φ(x)", "desc": "冻结 DINOv2 与 CLIP 提取并拼接的图像特征。" },
          { "sym": "∇L<sub>GAN</sub>", "desc": "轻量特征判别器提供的对抗感知梯度。" }
        ]
      },
      "takeaways": [
        { "icon": "❄", "title": "视觉基础模型冻结", "desc": "DINOv2 与 CLIP 只提取稳定特征。" },
        { "icon": "5:1", "title": "交替更新", "desc": "每更新判别器 5 次，再更新学生 1 次。" },
        { "icon": "0.13", "title": "有限权重", "desc": "感知信号作为 D-DMD 之外的补充。" }
      ],
      "prerequisiteRefs": ["evaluation-protocol"],
      "quiz": [{
        "id": "quiz-4-perceptual",
        "prompt": "对抗感知分支中哪些组件会被训练？",
        "options": [
          { "id": "a", "text": "DINOv2、CLIP、判别器和教师全部更新。", "feedback": "DINOv2、CLIP 与教师保持冻结。" },
          { "id": "b", "text": "轻量判别器和四步学生更新，DINOv2 与 CLIP 冻结。", "feedback": "正确。基础模型只提供特征空间。" },
          { "id": "c", "text": "只更新 Mage-VAE，MMDiT 学生冻结。", "feedback": "蒸馏目标正是更新四步 MMDiT 学生。" }
        ],
        "correctOptionId": "b",
        "explanation": "冻结视觉基础模型保证参照稳定，判别器与学生通过交替训练形成对抗梯度。",
      }]
    },
    {
      "kind": "section",
      "id": "part-4-data-results",
      "title": "蒸馏数据、四步速度与能力边界",
      "badge": "both",
      "badgeLabel": "结果与边界",
      "bridge": "生成和编辑使用不同的数据组织，但最终都把完整主干调用压到四次；参数规模基本不变，速度来自调用次数减少。",
      "analogy": {
        "title": "课程数量不变，改成四次综合考试",
        "text": "Turbo 没有把 4B 主干缩成更小模型，而是让同规模学生在四个关键时间点完成任务。编辑课程还要兼顾指令、源图保持和开放式生成能力。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "4.5",
          "title": "生成与编辑 Turbo 的数据组织",
          "desc": "切换 Mage-Flow-Turbo 与 Mage-Flow-Edit-Turbo，查看蒸馏数据规模、编辑 3:1 混合生成数据的配比与四步端到端延迟。",
          componentId: "turbo-training-data-lab"
        }
      ],
      "insight": "Turbo 的关键收益是减少 MMDiT 完整调用次数，而非缩小参数；代价是部分精细能力仍会退化，尤其是复杂文字编辑。",
      "takeaways": [
        { "icon": "0.59s", "title": "四步生成", "desc": "单张 A100、1024² 下端到端生成约 0.59 秒。" },
        { "icon": "1.02s", "title": "四步编辑", "desc": "相同硬件与分辨率下编辑约 1.02 秒。" },
        { "icon": "⚖", "title": "质量仍有取舍", "desc": "总体能力较好保留，但复杂文字编辑等精细任务仍可能退化。" }
      ],
      "prerequisiteRefs": ["evaluation-protocol"],
      "quiz": [
        {
          "id": "quiz-4-edit-data",
          "prompt": "编辑蒸馏为什么按 3:1 混入生成数据？",
          "options": [
            { "id": "a", "text": "编辑数据学习指令与源图保持，生成数据帮助保留开放式生成和大幅变化能力。", "feedback": "正确。两类数据承担互补作用。" },
            { "id": "b", "text": "为了把参数量缩小到四分之一。", "feedback": "数据比例不会这样改变主干参数规模。" },
            { "id": "c", "text": "因为编辑数据不能提供目标图。", "feedback": "目标图还会用于判别器真实分支。" }
          ],
          "correctOptionId": "a",
          "explanation": "生成数据帮助学生在强编辑和开放式生成之间保持更稳健的能力。",
        },
        {
          "id": "quiz-4-result",
          "prompt": "Turbo 速度提升最准确的来源是什么？",
          "options": [
            { "id": "a", "text": "把 4B MMDiT 参数量压缩了四倍。", "feedback": "学生主干规模基本不变。" },
            { "id": "b", "text": "通过专门蒸馏，把完整 MMDiT 调用次数压到四次。", "feedback": "正确。减少的是主干调用次数。" },
            { "id": "c", "text": "完全删除 CA、DM 和感知训练。", "feedback": "这些信号正用于保留四步学生能力。" }
          ],
          "correctOptionId": "b",
          "explanation": "少步蒸馏让同规模学生适应四步轨迹，以更少完整主干前向换取低延迟。",
        }
      ]
    },
    {
      kind: "chapter",
      "id": "part-5-nft-motivation",
      "title": "强化学习式后训练，但不是 PPO / GRPO",
      "badge": "trn",
      "badgeLabel": "对齐动机",
      "bridge": "预训练和 SFT 让模型学会生成与编辑，但数据分布学习不保证它稳定满足复杂 Prompt、文字、美学和局部编辑等偏好。Diffusion-NFT 用在线奖励直接改造流匹配目标，而不是计算策略梯度和显式 likelihood ratio。",
      "analogy": {
        "title": "会画图，不等于每次都能按客户要求交稿",
        "text": "Base 模型已经掌握图像分布，像一位技术熟练的设计师；但复杂文字、审美标准和“只改指定区域”属于交付偏好，需要让它针对同一要求反复出稿，并根据专业反馈校准选择。",
        componentId: "studio-analogy"
      },
      "modules": [{
        kind: "module",
        "id": "5.1",
        "title": "从当前策略在线采样到正向匹配与负向抑制",
        "desc": "沿完整流程阅读：带 capability tag 的 Prompt → 当前策略 π<sub>old</sub> 以 10 步、CFG 5.0 在线生成同条件候选 → 路由到唯一评估器 → 同奖励类型、候选组内归一化 → 得到 rᵢ<sup>(s)</sup> → 强化高奖励方向并抑制低奖励方向。",
        componentId: "nft-candidate-lab"
      }],
      "insight": "更准确的定义是“基于在线奖励的、负样本感知的流匹配微调”：它不需要完整扩散轨迹的显式似然，也不依赖特定采样器。",
      "takeaways": [
        { "icon": "≠PPO", "title": "不是策略梯度 RL", "desc": "没有 PPO/GRPO 式显式 likelihood ratio，奖励直接进入流匹配目标。" },
        { "icon": "×N", "title": "同条件在线采样", "desc": "当前策略用 10 步、CFG 5.0 为同一条件产生一组候选。" },
        { "icon": "FM", "title": "负样本感知", "desc": "高分方向被正向匹配，低分方向由隐式负策略抑制。" }
      ],
      "prerequisiteRefs": ["rectified-flow", "evaluation-protocol"],
      "quiz": [
        {
          "id": "quiz-5-motivation",
          "prompt": "为什么已经完成预训练和 SFT 的 Base 模型仍需要 Diffusion-NFT？",
          "options": [
            { "id": "a", "text": "Base 主要学习数据分布，不保证稳定满足复杂的人类偏好。", "feedback": "正确。后训练在已有能力上校准偏好。" },
            { "id": "b", "text": "因为 Base 完全不能生成任何图像。", "feedback": "Base 已具备生成或编辑能力。" },
            { "id": "c", "text": "为了把模型参数量缩小四倍。", "feedback": "参数压缩不是 Diffusion-NFT 的目标。" }
          ],
          "correctOptionId": "a",
          "explanation": "基础训练回答“模型能生成什么”，NFT 更关注“模型是否稳定生成更符合偏好的结果”。",
        },
        {
          "id": "quiz-5-rl-boundary",
          "prompt": "为什么 Diffusion-NFT 不属于 PPO / GRPO 式传统策略梯度方法？",
          "options": [
            { "id": "a", "text": "它把在线奖励直接作用于正负流匹配目标，不计算显式 likelihood ratio。", "feedback": "正确。这是它与传统策略梯度 RL 的关键区别。" },
            { "id": "b", "text": "因为它完全不使用任何奖励。", "feedback": "在线奖励正是 NFT 后训练的核心信号。" },
            { "id": "c", "text": "因为它只能离线训练一个固定采样器。", "feedback": "它使用在线候选，也不依赖特定采样器。" }
          ],
          "correctOptionId": "a",
          "explanation": "可以把 NFT 归为强化学习式后训练，但其优化对象是奖励加权的流匹配，而不是轨迹 likelihood ratio。",
        }
      ]
    },
    {
      "kind": "section",
      "id": "part-5-reward-routing",
      "title": "唯一奖励路由与组内同类型归一化",
      "badge": "trn",
      "badgeLabel": "奖励设计",
      "bridge": "每个 Prompt 预先带有 capability tag，并且只被路由到一个对应评估器；不是同一张图同时交给多个奖励模型，也不会把多个分数相加。",
      "analogy": {
        "title": "文字校对、艺术指导和编辑验收分别签字",
        "text": "文字任务交给 OCR 专家，美学和复杂语义交给视觉语言评审，编辑则需要同时检查指令执行、源图保持与视觉合理性。不同专家的分数不能直接相加，只能在同类候选中比较。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "5.2",
          "title": "选择奖励类型：评分器、归一化与配比",
          "desc": "切换 OCR、美学、语义与编辑奖励，观察唯一评分器路由、同类候选归一化和训练数据配比如何同步变化。",
          componentId: "nft-alignment-lab"
        }
      ],
      "insight": "rᵢ(s) 不是评估器的原始分数，而是同一条件候选组、同一奖励类型内归一化得到的最优概率；OCR、美学与语义分数不可跨类型直接比较。",
      "takeaways": [
        { "icon": "OCR", "title": "文字渲染", "desc": "PaddleOCR-VL-1.5 检查目标文字、排版和文字—对象关系。" },
        { "icon": "VLM", "title": "美学与语义", "desc": "Qwen3.5-27B 按相应 rubric 评价构图、质感与复杂语义。" },
        { "icon": "Edit", "title": "多维编辑奖励", "desc": "RationalRewards 同时检查指令、源图保持、合理性和文字。" }
      ],
      "prerequisiteRefs": ["evaluation-protocol"],
      "quiz": [{
        "id": "quiz-5-routing",
        "prompt": "为什么不把 OCR、美学、语义和编辑评分直接加成一个总分？",
        "options": [
          { "id": "a", "text": "不同评分器对应不同能力且尺度不同，应先路由并在同类内部归一化。", "feedback": "正确。这样奖励才具有可比较含义。" },
          { "id": "b", "text": "因为一个候选只能包含一种颜色。", "feedback": "这与评分路由无关。" },
          { "id": "c", "text": "因为 RationalRewards 只能评价文生图。", "feedback": "RationalRewards 用于编辑质量评价。" }
        ],
        "correctOptionId": "a",
        "explanation": "能力匹配与尺度一致性比奖励数量更重要，跨类型分数相加会制造不可解释的偏好信号。",
      }]
    },
    {
      "kind": "section",
      "id": "part-5-nft-objective",
      "title": "NFT 目标：强化高奖励方向，抑制低奖励方向",
      "badge": "trn",
      "badgeLabel": "优化目标",
      "bridge": "候选得到组内最优概率后，Diffusion-NFT 用 rᵢ 与 1−rᵢ 分别调节隐式正策略和隐式负策略的流匹配权重；这正是“负样本感知”的含义。",
      "analogy": {
        "title": "好草稿留下笔法，差草稿标记为反例",
        "text": "高分草稿的去噪方向更值得被正策略吸收；低分草稿则为负策略提供需要压低的方向。奖励越高，正向匹配越强；奖励越低，负向抑制越强。",
        componentId: "studio-analogy"
      },
      "modules": [{
        kind: "module",
        "id": "5.3",
        "title": "拖动奖励 r，观察正向匹配与负向抑制",
        "desc": "rᵢ(s) 控制高奖励候选对隐式正策略 v⁺θ 的匹配权重，1−rᵢ(s) 控制低奖励候选对隐式负策略 v⁻θ 的抑制权重。下方同时展示 Base、对齐模型与 Turbo 教师链路。",
        componentId: "nft-positive-negative-lab"
      }],
      "insight": "Diffusion-NFT 将 Base 对齐为 Mage-Flow 与 Mage-Flow-Edit；这两个对齐 checkpoint 随后冻结，成为 Part 4 四步蒸馏的教师。",
      "formula": {
        "lead": "归一化奖励同时控制正向匹配和负向抑制",
        "unicode": "L<sup>(s)</sup><sub>NFT</sub>(θ)=𝔼[r<sup>(s)</sup><sub>i</sub>‖v<sup>+</sup><sub>θ</sub>(x<sub>i,t</sub>,t,c)−v<sub>i,t</sub>‖²<sub>2</sub>+(1−r<sup>(s)</sup><sub>i</sub>)‖v<sup>−</sup><sub>θ</sub>(x<sub>i,t</sub>,t,c)−v<sub>i,t</sub>‖²<sub>2</sub>]",
        "symbols": [
          { "sym": "v<sup>+</sup><sub>θ</sub>", "desc": "高奖励候选强化的隐式正策略速度场。" },
          { "sym": "v<sup>−</sup><sub>θ</sub>", "desc": "用于抑制低奖励候选方向的隐式负策略。" }
        ]
      },
      "takeaways": [
        { "icon": "r", "title": "高奖励强化", "desc": "r 越大，候选对应的正向流匹配权重越高。" },
        { "icon": "1−r", "title": "低奖励抑制", "desc": "r 越小，负向策略对该候选方向的抑制越强。" },
        { "icon": "→4", "title": "对齐模型成为教师", "desc": "Mage-Flow 与 Mage-Flow-Edit 是四步 Turbo 蒸馏的冻结教师。" }
      ],
      "prerequisiteRefs": ["rectified-flow"],
      "quiz": [
        {
          "id": "quiz-5-objective",
          "prompt": "当某个候选的归一化奖励 r 接近 1 时，NFT 目标如何处理它？",
          "options": [
            { "id": "a", "text": "主要增强正策略对其流匹配方向的学习。", "feedback": "正确。此时 r 权重大，1−r 权重小。" },
            { "id": "b", "text": "主要通过负策略抑制它。", "feedback": "负向抑制主要作用于低奖励候选。" },
            { "id": "c", "text": "直接删除整个模型 checkpoint。", "feedback": "NFT 更新速度场参数，不会删除模型。" }
          ],
          "correctOptionId": "a",
          "explanation": "奖励在 [0,1] 内连续调节两项权重，高奖励强化正向匹配，低奖励提高负向抑制。",
        },
        {
          "id": "quiz-5-family",
          "prompt": "Diffusion-NFT 在模型家族中的位置是什么？",
          "options": [
            { "id": "a", "text": "把 Base 对齐成 Mage-Flow / Mage-Flow-Edit，后者再作为 Turbo 教师。", "feedback": "正确。对齐先于少步蒸馏。" },
            { "id": "b", "text": "在 Turbo 完成后把四步学生还原成 Base。", "feedback": "模型家族的顺序恰好相反。" },
            { "id": "c", "text": "只负责 VAE 编解码。", "feedback": "VAE 属于 Part 1。" }
          ],
          "correctOptionId": "a",
          "explanation": "Base → Diffusion-NFT 对齐模型 → 四步蒸馏 Turbo，构成能力对齐到低延迟学生的顺序。",
        }
      ]
    },
    {
      kind: "chapter",
      "id": "part-6-data-engineering",
      "title": "数据工程：先决定模型能够看见什么",
      "badge": "trn",
      "badgeLabel": "能力基础",
      "bridge": "能力优化不从奖励开始。基础模型首先需要覆盖文生图与编辑任务的数据，并通过质量、一致性和指令可执行性筛选监督信号。",
      "analogy": {
        "title": "先整理参考素材，再开始设计",
        "text": "素材库若缺少文字、复杂画幅或可执行编辑案例，后续再精细评分也无法凭空补齐。数据工程决定模型学习世界的范围。",
        componentId: "studio-analogy"
      },
      "modules": [],
      "insight": "数据工程负责“给模型什么经验”；Diffusion-NFT 负责“在已有能力中更偏好哪些结果”。",
      "takeaways": [
        {
          "icon": "◫",
          "title": "生成与编辑都要覆盖",
          "desc": "两类任务需要不同形式的数据与监督关系。"
        },
        {
          "icon": "⌁",
          "title": "质量和一致性过滤",
          "desc": "过滤决定哪些样本值得进入后续训练阶段。"
        },
        {
          "icon": "✎",
          "title": "描述必须可学习",
          "desc": "具体描述与可执行编辑指令减少监督歧义。"
        }
      ],
      "prerequisiteRefs": [
        "evaluation-protocol"
      ],
      "quiz": [
        {
          "id": "data-engineering-1",
          "prompt": "为什么后训练奖励不能替代前期数据工程？",
          "options": [
            {
              "id": "a",
              "text": "奖励只能调整已有候选的偏好，不能可靠补出训练数据从未覆盖的基础能力。",
              "feedback": "正确，能力覆盖首先由数据与基础训练决定。"
            },
            {
              "id": "b",
              "text": "奖励模型完全不能读取图像。",
              "feedback": "论文使用多类图像相关评分器，这个说法不成立。"
            },
            {
              "id": "c",
              "text": "数据工程只影响训练速度，不影响模型能力。",
              "feedback": "数据覆盖与质量直接影响模型能学到什么。"
            }
          ],
          "correctOptionId": "a",
          "explanation": "数据工程建立能力地基，奖励后训练在地基上校准偏好；两者不是替代关系。",
        }
      ]
    },
    {
      "kind": "section",
      "id": "part-6-curriculum",
      "title": "课程学习：分辨率、质量与任务逐级推进",
      "badge": "trn",
      "badgeLabel": "训练课程",
      "bridge": "准备好数据后，还要决定先学什么、后学什么。论文采用逐级分辨率与逐步收紧质量的课程，再进入高质量 SFT 和能力后训练。",
      "analogy": {
        "title": "先练版式，再完成高分辨率成稿",
        "text": "设计训练不会从最复杂的成品开始：先掌握基本构图，再提高尺寸、细节与任务要求。课程顺序同时影响训练成本和最终能力。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "6.1",
          "title": "沿课程阶段查看学习重点",
          "desc": "查看低分辨率预训练、逐级提高分辨率、高质量 SFT 与能力后训练之间的依赖关系。",
          componentId: "data-curriculum-lab"
        }
      ],
      "insight": "课程学习是能力与效率的交叉点：早期低成本学习广泛概念，后期把计算集中到更高分辨率和更严格数据。",
      "takeaways": [
        {
          "icon": "1",
          "title": "从广覆盖开始",
          "desc": "早期阶段先建立基本图文对应与视觉概念。"
        },
        {
          "icon": "↗",
          "title": "逐级提高难度",
          "desc": "分辨率和质量要求随阶段推进，而不是一次拉满。"
        },
        {
          "icon": "◎",
          "title": "SFT 后再做偏好对齐",
          "desc": "Diffusion-NFT 建立在已经训练好的 Base/SFT 能力之上。"
        }
      ],
      "prerequisiteRefs": [
        "latent-vae",
        "evaluation-protocol"
      ],
      "quiz": [
        {
          "id": "curriculum-1",
          "prompt": "课程学习为什么可能同时影响能力和效率？",
          "options": [
            {
              "id": "a",
              "text": "因为所有阶段始终使用完全相同的分辨率和数据。",
              "feedback": "这与逐级课程的定义相反。"
            },
            {
              "id": "b",
              "text": "因为早期用较低成本学习广泛概念，后期再集中计算处理高分辨率与高质量样本。",
              "feedback": "正确，它在训练成本和学习难度之间安排顺序。"
            },
            {
              "id": "c",
              "text": "因为它会自动把推理改成四步。",
              "feedback": "四步推理由少步蒸馏实现，不是课程学习的直接结果。"
            }
          ],
          "correctOptionId": "b",
          "explanation": "课程学习通过训练顺序分配难度和计算：先打基础，再提高分辨率、质量与任务要求。",
        }
      ]
    },
    {
      "kind": "section",
      "id": "appendix-results",
      "title": "两条主线汇合：质量—速度—显存的证据边界",
      "badge": "both",
      "badgeLabel": "训练与推理",
      "bridge": "第 9 章已经把训练融合与四步蒸馏分开，现在只剩最后一个问题：这些机制在统一协议下换来了什么。结果必须按延迟、生成、编辑和分词器四种指标分别阅读，不能压成一个“总体最好”的分数。",
      "analogy": {
        "title": "同一完成线，只比较同类刻度",
        "text": "秒表只在共同完成线前比较同一类指标：时间看谁先到，质量看谁的刻度更高。换指标就重置比赛，不能把秒数与评分接成一条总排名。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "A.1",
          "title": "按协议启动一次结果赛",
          "desc": "选择 A100 延迟、文生图质量、编辑质量或 VAE 计算，再启动比较。每次只比较同单位、同方向、同协议的值；限制面板始终保留。",
          componentId: "result-frontier-lab"
        },
        {
          kind: "module",
          "id": "A.2",
          "title": "四种效率动作，各自回到各自实验",
          "desc": "切换分词器替换、全栈融合、四步蒸馏与对抗感知引导，核对每项收益各自的协议边界。",
          componentId: "efficiency-distill-lab"
        }
      ],
      "insight": "Mage-Flow 给出的是有条件的效率前沿，而不是跨硬件、跨协议、跨任务的普遍第一。",
      "takeaways": [
        {
          "icon": "A100",
          "title": "四步端到端延迟",
          "desc": "在单张 A100、1024×1024 条件下，四步 Turbo 的端到端时间为文生图 0.59s、编辑 1.02s。"
        },
        {
          "icon": "↕",
          "title": "质量取舍依协议",
          "desc": "20 步 Mage-Flow 的 GenEval 为 0.90，而四步编辑器在 GEdit EN/CN 为 8.271/8.264。"
        },
        {
          "icon": "△",
          "title": "能力仍有缺口",
          "desc": "精确文字布局、复杂文字替换、多图编辑和多语言长文本仍是论文明确承认的限制。"
        }
      ],
      "prerequisiteRefs": [
        "evaluation-protocol"
      ],
      "quiz": [
        {
          "id": "quiz-10-1",
          "prompt": "阅读 Mage-Flow 的结果时，哪种比较最可靠？",
          "options": [
            {
              "id": "a",
              "text": "把延迟、GenEval 和编辑分数合成一个总排名。",
              "feedback": "这些指标单位和方向不同，压成一个总分会丢失协议边界。"
            },
            {
              "id": "b",
              "text": "只比较参数量，参数更少就必然更好。",
              "feedback": "参数规模只是一个维度，不能替代质量、延迟和显存证据。"
            },
            {
              "id": "c",
              "text": "在相同任务、协议、硬件与指标方向下比较，并保留限制说明。",
              "feedback": "正确。效率前沿是有条件的结论，不能外推为跨协议普遍第一。"
            }
          ],
          "correctOptionId": "c",
          "explanation": "结论必须带上数据集、步数、分辨率、硬件、单位和指标方向；多图编辑与多语言长文本仍是后续方向。",
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1wig26hETc",
      "title": "Mage Flow Edit Turbo 首发评测",
      "reason": "直接评测 Mage-Flow-Edit-Turbo 的编辑效果与实际使用表现。",
      "cover": "https://i2.hdslb.com/bfs/archive/6503ecc475e50e94028db2fb5f7d092254e5ac6e.jpg",
      "views": "4343播放"
    },
    {
      "bvid": "BV1t6GA6dEDv",
      "title": "Mage-Flow-Turbo 文生图演示",
      "reason": "展示 Mage-Flow-Turbo 的文生图输出，可用于观察少步模型的生成效果。",
      "cover": "https://i1.hdslb.com/bfs/archive/4b06e2980c41fe33f1e9648e6f38957b228f7ad5.jpg",
      "views": "104播放"
    },
    {
      "bvid": "BV1crGK6XEGq",
      "title": "Mage-Flow-Edit-Turbo 图生图演示",
      "reason": "展示 Mage-Flow-Edit-Turbo 的图像编辑效果，与生成/编辑条件和少步推理内容对应。",
      "cover": "https://i2.hdslb.com/bfs/archive/17a077bf4a7c62fb536e0f725076bea20d02e217.jpg",
      "views": "53播放"
    }
  ],
  "parts": [
    {
      "id": "part-0",
      "number": 0,
      "title": "生成模型整体架构",
      "summary": "建立条件—潜空间—DiT—解码器的全局图，再补齐整流流速度学习与生成/编辑条件格式两个后续章节反复使用的基础。",
      "moduleId": "guide",
      "moduleLabel": "导读",
      "chapterIds": [
        "guide-architecture",
        "guide-flow",
        "guide-conditioning"
      ]
    },
    {
      "id": "part-1",
      "number": 1,
      "title": "Mage-VAE 编解码加速",
      "summary": "从高分辨率与少步化造成的瓶颈转移出发，理解一步全卷积编解码、anchor latent、三阶段训练与质量—效率边界。",
      "moduleId": "efficiency",
      "moduleLabel": "模块一 · 训练与推理效率优化",
      "chapterIds": [
        "part-1-bottleneck",
        "part-1-architecture",
        "part-1-training",
        "part-1-results"
      ]
    },
    {
      "id": "part-2",
      "number": 2,
      "title": "NR-MMDiT 原生分辨率打包",
      "summary": "从分辨率桶的局限出发，理解样本内联合序列、样本间变长打包、累计边界、逐样本 2D RoPE，以及 packed CFG。",
      "moduleId": "efficiency",
      "moduleLabel": "模块一 · 训练与推理效率优化",
      "chapterIds": [
        "part-2-buckets",
        "part-2-packing",
        "part-2-position-budget",
        "part-2-packed-cfg"
      ],
      "crossImpact": "它不仅提高批处理与 CFG 执行效率，也直接扩展原生画幅和分辨率能力。"
    },
    {
      "id": "part-3",
      "number": 3,
      "title": "栈级 CUDA 算子融合",
      "summary": "理解 memory-bound 小算子为何拖慢重复 Block、三个子系统分别融合什么，以及 Mage-VAE 替换与整栈融合如何共同实现 2.48× 训练加速。",
      "moduleId": "efficiency",
      "moduleLabel": "模块一 · 训练与推理效率优化",
      "chapterIds": [
        "part-3-memory-bound",
        "part-3-stack-fusion",
        "part-3-results"
      ]
    },
    {
      "id": "part-4",
      "number": 4,
      "title": "少步蒸馏",
      "summary": "从整流流多步积分出发，理解四步学生为何必须重训，以及 Decoupled-DMD、对抗感知引导、蒸馏数据和速度—质量边界。",
      "moduleId": "efficiency",
      "moduleLabel": "模块一 · 训练与推理效率优化",
      "chapterIds": [
        "part-4-inference-family",
        "part-4-rectified-flow",
        "part-4-large-step-student",
        "part-4-decoupled-dmd",
        "part-4-perceptual",
        "part-4-data-results"
      ]
    },
    {
      "id": "part-5",
      "number": 5,
      "title": "Diffusion-NFT 后训练",
      "summary": "让当前模型在线生成候选，按任务路由奖励并在同类内部归一化，再强化高奖励流方向、抑制低奖励方向。",
      "moduleId": "capability",
      "moduleLabel": "模块二 · 模型能力优化",
      "chapterIds": [
        "part-5-nft-motivation",
        "part-5-reward-routing",
        "part-5-nft-objective"
      ]
    },
    {
      "id": "part-6",
      "number": 6,
      "title": "数据工程与渐进式课程学习",
      "summary": "先确定模型看见什么，再安排从低成本广覆盖到高分辨率、高质量任务的渐进式学习顺序。",
      "moduleId": "capability",
      "moduleLabel": "模块二 · 模型能力优化",
      "chapterIds": [
        "part-6-data-engineering",
        "part-6-curriculum"
      ],
      "crossImpact": "课程设计也在分配训练计算，既影响能力上限，也影响训练效率。"
    }
  ],
  "appendixChapterIds": [
    "appendix-results"
  ]
};
