import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Lens: Rethinking Training Efficiency for Foundational Text-to-Image Models",
    "titleZh": "Lens：重新思考基础文生图模型的训练效率",
    "venue": "arXiv 预印本 · 2026",
    "authors": "Microsoft Lens Team",
    "affiliation": "Microsoft",
    "domain": "文生图 · 生成模型",
    "coreProblem": "如何在有限训练算力下，仍然让文生图模型准确理解复杂指令并生成高质量图像？",
    "coreInsight": "Lens 从三个方面提高训练效率：控制模型规模、让每批数据包含更多有用信息、让模型更快学好。随后再通过后训练和快速采样，改进生成质量与速度。",
    "keywords": [
      "约 38 亿参数",
      "详细图文描述",
      "MMDiT",
      "Flow Matching",
      "Lens-Turbo"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "训练高质量文生图模型需要大量计算。图片描述过于简短时，颜色、数量和布局等细节也容易被遗漏，减少模型能学到的信息。",
      "componentId": "teaching-illustration"
    },
    "newMethod": {
      "desc": "Lens 使用更详细的图片描述和更多样的图像尺寸，并选择更适合文生图训练的模型组件，让每次训练更有效。",
      "componentId": "teaching-illustration"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "先看懂 Lens 的整体框架",
      "badge": "inf",
      "badgeLabel": "整体框架",
      "bridge": "先看 Lens 的整体框架：文字怎样变成条件，图片怎样变成潜表示，两路信息怎样进入 MMDiT，最后又怎样得到可见图片。后续章节再逐一解释这些部件。",
      "analogy": {
        "title": "先认识整个模型",
        "text": "文字由 GPT-OSS 转成文字特征。训练图片由 VAE 压缩成潜表示；生成时则从随机潜噪声开始。两路信息进入 48 个 MMDiT 块，最后经 VAE 解码成图片。",
        "componentId": "teaching-illustration"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "切换训练与生成，看两条路径如何变化",
          "desc": "点选“训练时”或“生成时”，观察图片路径的起点和 MMDiT 的任务有什么不同。",
          "componentId": "lens-interactive"
        }
      ],
      "insight": "框架示意中的 VAE 解码器不表示训练 Lens 时每一步都要把 latent 解码重建图片。预训练时 VAE 和 GPT-OSS 保持冻结，更新生成骨干；生成时从随机潜噪声开始，最后才解码成图。",
      "takeaways": [
        {
          "icon": "📝",
          "title": "文字路径",
          "desc": "GPT-OSS 把提示词变成文字特征。"
        },
        {
          "icon": "🖼️",
          "title": "图像路径",
          "desc": "训练图像经 VAE 编码；生成从随机潜噪声开始。"
        },
        {
          "icon": "🔄",
          "title": "汇合与输出",
          "desc": "MMDiT 处理图文特征，VAE 解码最终图片。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "详细标题：让一张图说出更多信息",
      "badge": "inf",
      "badgeLabel": "输入信息",
      "bridge": "论文的第一条改进不是盲目堆更多图片，而是让每个图文对携带更多可学习的细节。先用同一张猫图看描述如何增加线索，再看 Lens-Toy 的对照结果，最后联系论文的大规模训练数据。",
      "analogy": {
        "title": "描述越具体，学习线索越多",
        "text": "“一只猫”只说明主体；“一只橘猫坐在蓝色椅子上”还提供了颜色和位置关系。详细描述让同一张训练图片提供更多学习线索。",
        "componentId": "teaching-illustration"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "同一张图，哪份说明更有用？",
          "desc": "切换三种标题写法。这里的 Lens-Toy 是论文为做对照实验训练的缩小版模型；GenEval 是专门检查文字与图像是否匹配的测试。",
          "componentId": "lens-interactive"
        }
      ],
      "insight": "<b>从刚才的对照实验到真实训练数据：</b>论文把“让一张图说出更多信息”的思路扩展到 Lens-800M——约 8 亿图文对，GPT-4.1 生成的详细英文描述平均约 109 词。",
      "takeaways": [
        {
          "icon": "📝",
          "title": "先补充细节",
          "desc": "主体、颜色、数量和位置都可以成为学习线索。"
        },
        {
          "icon": "🔬",
          "title": "再看对照结果",
          "desc": "Lens-Toy 中详细描述更好，但结论限定在这组实验条件。"
        },
        {
          "icon": "📚",
          "title": "最后扩展规模",
          "desc": "Lens-800M 约有 8 亿图文对，详细英文描述平均约 109 词。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "只练 27 种尺寸，也能生成新构图",
      "badge": "inf",
      "badgeLabel": "构图泛化",
      "bridge": "Lens 先用 512×512 方图训练，再用 27 个不同面积和长宽比的桶续训。关键成果是：推理时它能生成训练未见过的尺寸和比例，包括 5:4、6:7 等比例；论文报告的范围为 1:2 至 2:1，图像面积最高 1440²。",
      "analogy": {
        "title": "见过多种画幅，学会举一反三",
        "text": "方图、横图和竖图让模型接触不同的主体位置与构图。论文报告：Lens 不只会生成训练桶中的 27 种尺寸，还能把学到的规律用到新尺寸与新比例上。",
        "componentId": "teaching-illustration"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "点选训练桶，再看模型如何超出这些桶",
          "desc": "点任一格查看训练时见过的尺寸，再对照论文报告的未见过比例和更高图像面积。",
          "componentId": "resolution-buckets"
        }
      ],
      "insight": "论文报告的亮点：只在 27 个具体分辨率桶上续训，Lens 推理时仍能生成未见过的比例与尺寸，包括 5:4、6:7，以及训练时未覆盖的 1024² 至 1440² 图像面积区间。这让模型可以用较低分辨率训练，仍输出更高分辨率图像，减少训练计算。",
      "formula": {
        "lead": "续训的组合数来自面积与长宽比的笛卡尔组合：",
        "unicode": "3 种基础面积 × 9 种长宽比 = 27 个训练桶",
        "symbols": [
          {
            "sym": "3",
            "desc": "三种基础面积"
          },
          {
            "sym": "9",
            "desc": "九种长宽比"
          },
          {
            "sym": "27",
            "desc": "混合分辨率续训使用的桶数"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📐",
          "title": "超出训练桶",
          "desc": "5:4、6:7 等未见过的比例也能生成。"
        },
        {
          "icon": "🖼️",
          "title": "更高分辨率",
          "desc": "论文报告的图像面积最高达 1440²。"
        },
        {
          "icon": "⚡",
          "title": "节省训练计算",
          "desc": "不必在 1440² 面积上训练，也能输出该面积的图像。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "VAE：图片怎么进入、离开潜空间？",
      "badge": "both",
      "badgeLabel": "表示与生成",
      "bridge": "先分清“训练 VAE 本身”和“训练 Lens 生成骨干”。前者会把图片编码成 latent、再解码重建图片；Lens 则使用已有的 FLUX.2 VAE，在 latent 中训练生成骨干，出图时再用解码器把结果变回图片。",
      "analogy": {
        "title": "三种情境，别把训练混在一起",
        "text": "VAE 自身学习重建时走“原图 → latent → 重建图”；训练 Lens 时，冻结的 VAE 编码训练图片，生成骨干在 latent 中学习；用 Lens 文生图时，从随机潜噪声开始，最后由 VAE 解码出图。",
        "componentId": "teaching-illustration"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "点击候选 VAE，看选择依据",
          "desc": "流程已在上方讲清。现在点击四个 VAE 候选，看看论文为何选择 FLUX.2：作者比较了文生图表现和收敛速度。",
          "componentId": "lens-interactive"
        }
      ],
      "insight": "论文的 Lens 预训练冻结 VAE，只优化生成骨干，并在 latent 中计算 flow-matching 误差；不需要每一步都解码回图片来计算损失。在 Lens-Toy 的 VAE 消融中，FLUX.2 的文生图表现和收敛速度最好，因此被 Lens 采用。",
      "takeaways": [
        {
          "icon": "🗜️",
          "title": "潜表示 z",
          "desc": "z 代表当前整幅图的紧凑数字表示，不是一个数字。"
        },
        {
          "icon": "🧪",
          "title": "选型靠消融",
          "desc": "只比较了 FLUX.1、SD3、FLUX.2、VTP。"
        },
        {
          "icon": "🖼️",
          "title": "文生图仍要解码",
          "desc": "生成从随机潜噪声出发，最后解码成图片。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "文字条件 c 从哪里来？",
      "badge": "both",
      "badgeLabel": "条件输入",
      "bridge": "你已知道 prompt 会影响生成方向。现在细化一步：文字先经语言编码器变成特征，生成骨干再读取这些特征，而不是把文字写死成参数。",
      "analogy": {
        "title": "把文字变成模型能使用的数字",
        "text": "GPT-OSS 将提示词转成数字特征 c，供生成网络使用。提示词变了，c 也会变化，从而影响生成结果。",
        "componentId": "teaching-illustration"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "高亮四层文字特征",
          "desc": "点第 4、12、18、24 层，查看每一层在示意路径上的位置。真实模型把四层特征全部拼接再投影；点击只改变高亮，不会让其他层停止工作。",
          "componentId": "lens-interactive"
        }
      ],
      "insight": "论文第 2.2 节在 Lens-Toy、仅英语标题的 Lens-130M 设置下，比较 GPT-OSS 与三种规模的 Qwen3；作者据收敛及英文、多语言生成表现选择 GPT-OSS。它是文字编码器，不是后面可独立替换的默认 GPT-5.5 Reasoner。c 随 prompt 改变，不是固定权重。",
      "takeaways": [
        {
          "icon": "4️⃣",
          "title": "四层特征",
          "desc": "第 4、12、18、24 层的特征拼接后投影。"
        },
        {
          "icon": "🔁",
          "title": "c 随输入变",
          "desc": "提示词不同，送入骨干的文字特征不同。"
        },
        {
          "icon": "🧩",
          "title": "c 与 z 分工",
          "desc": "c 提供文字条件；z 是待生成图片的潜表示。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "从随机潜噪声到一幅图",
      "badge": "inf",
      "badgeLabel": "推理过程",
      "bridge": "训练时有配对图片可学习；真正文生图时没有一张“标准答案图片”等着比较。用户的模糊要求可先由 Reasoner 改写，再经 GPT-OSS 得到文字条件 c。生成从随机潜噪声开始，模型根据当前潜表示 z、时刻 t 和 c 预测方向并逐步更新 z。",
      "analogy": {
        "title": "从随机起点，一步步生成",
        "text": "生成从随机潜噪声开始。模型根据文字要求反复更新潜表示，最后将它解码成图片；过程中没有一张现成的“标准答案”图片。",
        "componentId": "teaching-illustration"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "切换训练与生成，追踪方向的用途",
          "desc": "先切换“训练 / 生成”，再点击路径节点。重点观察：训练有目标图像可计算误差；纯文生图没有标准答案，使用学到的方向多步更新潜表示。",
          "componentId": "flow-matching-lab"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "Reasoner 在生成前做什么？",
          "desc": "点击用户请求、Reasoner、GPT-OSS、MMDiT，分清提示词改写、文字编码和图像生成。Reasoner 位于推理入口，不参与第 9 章的后训练评分。",
          "componentId": "lens-interactive"
        }
      ],
      "insight": "Flow matching 是训练骨干学习方向场的目标；采样则沿模型预测的方向多步更新。Reasoner 是推理前独立的文字改写模块，和 GPT-OSS 文字编码器不同，也不是后训练的评分器。",
      "takeaways": [
        {
          "icon": "🎲",
          "title": "起点随机",
          "desc": "生成时没有输入的标准答案图片。"
        },
        {
          "icon": "🧭",
          "title": "条件参与",
          "desc": "当前潜表示、时刻、文字条件共同影响方向。"
        },
        {
          "icon": "🖼️",
          "title": "最后解码",
          "desc": "VAE 解码器将潜表示变为可见图片。"
        },
        {
          "icon": "💬",
          "title": "生成前改写",
          "desc": "Reasoner 可细化模糊请求，再交给 GPT-OSS。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "两段预训练怎样安排？",
      "badge": "trn",
      "badgeLabel": "训练方案",
      "bridge": "已经知道模型在潜空间中学习预测方向，再看训练顺序。作者先用固定尺寸打基础，然后增加分辨率和长宽比的变化。",
      "analogy": {
        "title": "先学固定尺寸，再适应更多尺寸",
        "text": "第一阶段用 512×512 的图片进行 40 万次训练更新。第二阶段接着训练这个模型，改用 27 种尺寸，同样进行 40 万次更新。",
        "componentId": "teaching-illustration"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "切换预训练的两个阶段",
          "desc": "比较第一阶段与第二阶段的输入尺寸和训练范围。两阶段论文均报告使用 128 张 A100 80GB；40 万次迭代不是读完数据集 40 万轮。",
          "componentId": "lens-interactive"
        }
      ],
      "insight": "预训练时 VAE 与 GPT-OSS 文字编码器保持冻结，更新的是生成骨干；其目标是 flow-matching MSE。",
      "takeaways": [
        {
          "icon": "⬜",
          "title": "固定尺寸",
          "desc": "第一阶段 512×512、40 万步。"
        },
        {
          "icon": "▭",
          "title": "混合尺寸",
          "desc": "第二阶段 27 个桶、40 万步。"
        },
        {
          "icon": "🧊",
          "title": "哪些不训练",
          "desc": "VAE 与文字编码器冻结。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "MMDiT：文字与图像怎样在骨干里相遇？",
      "badge": "trn",
      "badgeLabel": "网络结构",
      "bridge": "先补上图像 token：前面说的 z 是当前整幅图的潜表示；送入 Transformer 前，它按空间位置分成小块，每块变成一个供网络处理的图像 token。文字条件 c 来自 GPT-OSS。下面看两路特征如何进入 Lens 的 48 个 MMDiT 块。",
      "analogy": {
        "title": "文字如何影响图像？",
        "text": "文字特征和图像特征进入 MMDiT，通过注意力交换信息。生成网络利用这些信息预测潜表示的更新方向，引导图像符合文字要求。",
        "componentId": "teaching-illustration"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "先认识图像 token，再走一遍 MMDiT",
          "desc": "先看“整幅 z → 多个图像 token”示意，再按顺序点击文字条件、图像 token、图文交互与预测方向。画面只画一个代表性块；48 是骨干块数，不是采样步数。",
          "componentId": "mmdit-explorer"
        }
      ],
      "insight": "z 是当前整幅潜表示，不是一个 token；图像 token 是从 z 的各小块得到、供 Transformer 处理的数字向量。c 提供文字条件。骨干让这些信息相互作用，预测如何更新 z。",
      "takeaways": [
        {
          "icon": "🔤",
          "title": "文字分支",
          "desc": "接收与 prompt 有关的特征。"
        },
        {
          "icon": "🖼️",
          "title": "图像分支",
          "desc": "处理当前潜表示的图像 token。"
        },
        {
          "icon": "🔢",
          "title": "48 ≠ 采样步",
          "desc": "48 是骨干块数，与推理的 20/4 步不同。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "后训练：让模型按规则画得更好",
      "badge": "trn",
      "badgeLabel": "强化学习",
      "bridge": "基础模型 Lens-Base 已能生成图片，但仍可能有伪影或不符合要求的细节。论文在预训练之后，用覆盖多种场景的提示词、针对每条提示词的评分规则和自动奖励，继续更新生成模型。这里讲的是训练，不是用户生成前的 Reasoner 改写。",
      "analogy": {
        "title": "先定检查标准，再让模型练习",
        "text": "给出提示词后，先列出需要检查的细节；Lens-Base 生成图片，评审按规则给出奖励，系统据此继续训练模型。评审结果是训练信号，不是每次用户生成图片时都要做的人工审核。",
        "componentId": "teaching-illustration"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "走一遍后训练：提示词、规则、奖励与更新",
          "desc": "按顺序点击五个环节，看 Lens-Base 的生成结果如何被评分，以及奖励怎样帮助模型继续改进。这是论文流程的教学示意，不会实际训练模型。",
          "componentId": "post-training-lab"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "提示词覆盖越广，后训练效果怎样？",
          "desc": "选择四分之一、一半、全部，查看论文表 1 在相同基座与 180 步后训练条件下的 GenEval 测试分数。GenEval 是训练后的外部评测，不是 GPT-4.1-mini 给单张图片的奖励。",
          "componentId": "lens-interactive"
        }
      ],
      "insight": "Lens-RL-8K 有 8406 条提示词。GPT-4.1 为每条提示词生成 10 条针对性规则，再加 1 条全局规则；GPT-4.1-mini 根据生成图和规则给出奖励，DiffusionNFT 利用奖励更新生成模型。论文表 1 显示：提示词覆盖更完整时，后训练模型的 GenEval 更高；删除文字类提示词后，文字生成相关评价下降。",
      "takeaways": [
        {
          "icon": "📋",
          "title": "规则覆盖",
          "desc": "表 1 中完整集合的 GenEval 为 0.930。"
        },
        {
          "icon": "🧑‍⚖️",
          "title": "规则评分",
          "desc": "GPT-4.1-mini 根据图片与规则给奖励。"
        },
        {
          "icon": "🔁",
          "title": "继续更新",
          "desc": "DiffusionNFT 用奖励优化 Lens-Base。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "Lens-Turbo：用 4 步更快生成",
      "badge": "both",
      "badgeLabel": "推理加速",
      "bridge": "基础 Lens 用 20 步、CFG 5.0 生成；论文把后训练后的 Lens-RL 蒸馏成 Lens-Turbo，目标是在更少步骤下保留图像质量和提示词遵循能力。先看 Turbo 怎样训练，再比较速度与各项质量指标。",
      "analogy": {
        "title": "先学会完整路线，再学会短路线",
        "text": "Lens-RL 用较多步逐渐得到结果；蒸馏让 Lens-Turbo 学会用更少的步数走到相近结果。速度提升后，仍要按同一指标比较质量。",
        "componentId": "teaching-illustration"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "Turbo 机制：从 Lens-RL 到 4 步生成器",
          "desc": "点击三个阶段，理解少步蒸馏做了什么：以 Lens-RL 的能力为目标，在平衡的图文数据上训练少步学生，最后得到 4 步且无需 CFG 的 Lens-Turbo。",
          "componentId": "turbo-distillation"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "速度提升后，质量怎样比较？",
          "desc": "选择一项质量指标，比较 Lens、Lens-Turbo 与 Z-Image 的同列分数，再看相同 H100 条件下的速度。不同基准各自回答不同问题，不能混成一个总分。",
          "componentId": "benchmark-explorer"
        }
      ],
      "insight": "论文结论的重点是：Lens-Turbo 用 4 步、无需 CFG，推理显著更快，同时大体保留原模型的图像质量和提示词遵循能力。表 2 的分数来自不同基准，Turbo 不会在每一项都最高；速度是单张 NVIDIA H100、1024² 图像条件下的报告值。",
      "takeaways": [
        {
          "icon": "🧑‍🏫",
          "title": "蒸馏迁移能力",
          "desc": "从后训练后的 Lens-RL 学习少步生成目标。"
        },
        {
          "icon": "⚡",
          "title": "4 步且无需 CFG",
          "desc": "H100 上约 0.84 秒，Lens 为 20 步、约 3.15 秒。"
        },
        {
          "icon": "📊",
          "title": "质量逐项看",
          "desc": "Turbo 大体保留能力，但不同基准的分数不能合并。"
        }
      ]
    }
  ]
};
