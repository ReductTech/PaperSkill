import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers",
    "titleZh": "GPTQ：面向生成式预训练 Transformer 的精确后训练量化",
    "venue": "ICLR 2023 · arXiv:2210.17323",
    "authors": "Elias Frantar, Saleh Ashkboos, Torsten Hoefler, Dan Alistarh",
    "affiliation": "IST Austria · ETH Zurich · NeuralMagic",
    "domain": "大语言模型 / 后训练量化 / 高效推理",
    "coreProblem": "175B 模型 FP16 约 326GB，单卡装不下；已有后训练量化只在 8 位好用，更精确的方法又太慢，难以扩展到千亿参数。",
    "coreInsight": "用逐层二阶信息做误差补偿：固定顺序让所有行共用同一份 H⁻¹，再配分块更新与 Cholesky 分解，即可在数小时内把 175B 量化到 3-4 位。",
    "keywords": [
      "后训练量化",
      "二阶信息",
      "误差补偿",
      "大模型压缩"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "FP16 直接部署：GPT-3 175B 约 326GB，需 5 张 80GB 卡，单卡装不下。",
      "componentId": "gptq-hero-old"
    },
    "newMethod": {
      "desc": "GPTQ 逐层二阶补偿量化到 3-4 位，约 4 小时完成；3 位 OPT-175B 可进单张 A100 并提速 3.24×。",
      "componentId": "gptq-hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "装不下与铺不平的起点",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "先看清真实约束：175B 模型 FP16 约 326GB，单卡装不下；已有后训练量化到 3-4 位会崩。这一章用一条铺不平的长路，带出 GPTQ 的主线。",
      "analogy": {
        "title": "铺不平的长路",
        "text": "想一口气把长路铺完，可砖块尺寸不齐、<b>路面铺不平</b>。模型也一样：<b>326GB</b> 根本装不下。",
        "componentId": "gptq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "显存预算",
          "desc": "拖动可用显存，看 FP16、INT8 与 GPTQ-3bit 的 175B 能否放下，以及能否进单张 80GB 卡。",
          "componentId": "m1-budget"
        }
      ],
      "insight": "低比特后训练量化是让 175B 进单卡的前提；难点在于不重训练的前提下保住精度。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "装不下是常态",
          "desc": "GPT-3 175B 的 FP16 约 326GB，单卡远不够。"
        },
        {
          "icon": "🔧",
          "title": "8 位不够用",
          "desc": "已有后训练方法在 3-4 位会明显掉点。"
        },
        {
          "icon": "✨",
          "title": "本文三步走",
          "desc": "逐层量化、二阶补偿、分块与稳定化，数小时量化 175B。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "层输入与 Hessian：地面的软硬",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "要铺路，先量地面。这一章说明 GPTQ 用什么信息：不是整模型反传，而是每层的校准输入与由它得到的 Hessian。",
      "analogy": {
        "title": "先量地面",
        "text": "铺之前先量<b>地面的软硬</b>：软的能垫，硬的难动。",
        "componentId": "gptq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "逐层校准流程",
          "desc": "分步走一遍「载入一层 → 收集校准输入 → 累加 Hessian → 准备量化」。",
          "componentId": "m2-calib"
        }
      ],
      "insight": "量化只需要少量通用文本的激活统计，不需要任务数据或反向传播，这让它天然可扩展到千亿参数。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "只用量输入",
          "desc": "逐层量化，只需要每层的校准输入 X。"
        },
        {
          "icon": "🔧",
          "title": "通用数据即可",
          "desc": "128 段 C4 文本，不是任务数据。"
        },
        {
          "icon": "✨",
          "title": "二次型可解",
          "desc": "误差是二次型，Hessian 与权重无关，可预先算好。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "核心洞见：固定顺序也能铺平",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "OBQ 每次贪心挑最划算的一块，但代价极高。这一章给出 GPTQ 的第一个关键简化：固定顺序，以及它带来的复杂度下降。",
      "analogy": {
        "title": "从头依次铺",
        "text": "每次都挑<b>最软的点</b>很聪明，但其实<b>从头依次铺</b>效果差不多，还快得多。",
        "componentId": "gptq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "顺序策略",
          "desc": "对比「贪心顺序」与「固定顺序」的用时与误差，理解固定顺序的代价很小。",
          "componentId": "m3-order"
        }
      ],
      "insight": "任意固定顺序在大层上效果几乎一样；这允许所有行共用同一份 H⁻¹，把复杂度从每权重降为每列。",
      "formula": {
        "lead": "固定顺序让逆矩阵只需按列更新，复杂度从「每权重一次」降到「每列一次」。",
        "unicode": "O( d_row · d_col³ )  →  O( max{ d_row · d_col² , d_col³ } )，快 min{ d_row , d_col } 倍",
        "symbols": [
          {
            "sym": "d_row / d_col",
            "desc": "权重矩阵的行数 / 列数。"
          },
          {
            "sym": "O(...)",
            "desc": "渐近复杂度。"
          },
          {
            "sym": "min{d_row, d_col}",
            "desc": "提速倍数；大模型上约三个数量级。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "固定顺序够好",
          "desc": "贪心顺序的优势在大层上很小。"
        },
        {
          "icon": "🔧",
          "title": "共享 H⁻¹",
          "desc": "所有行同序，逆矩阵只更新 d_col 次。"
        },
        {
          "icon": "✨",
          "title": "复杂度降一档",
          "desc": "从 O(d_row·d_col³) 到 O(max{d_row·d_col², d_col³})。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "逐层目标与二次型",
      "badge": "both",
      "badgeLabel": "深入原理",
      "bridge": "知道要快，还要知道误差从哪来。这一章建立逐层目标与 Hessian，解释二阶信息为什么可用，并感受不同位置的「曲率」。",
      "analogy": {
        "title": "摸清曲率",
        "text": "每处的<b>曲率</b>不同：平缓处好调整，陡峭处很难动。",
        "componentId": "gptq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "曲率与代价",
          "desc": "沿小径拖动位置标记，看不同位置的曲率如何决定「在这里放砖」的代价。",
          "componentId": "m4-curv"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "先铺哪一块",
          "desc": "切换「挑误差最小」与「从左到右固定铺」，看两种选择对单层误差的影响。",
          "componentId": "m4-pick"
        }
      ],
      "insight": "每行误差是二次型，曲率是常数 Hessian H=2XXᵀ；曲率大的位置一动就伤全局，这决定补偿方向与大小。",
      "formula": {
        "lead": "逐层目标是最小化量化前后的输出差；每行是二次型，曲率是常数 Hessian。",
        "unicode": "argmin_Ŵ ‖ W X − Ŵ X ‖₂² ,  H_F = 2 X_F X_Fᵀ",
        "symbols": [
          {
            "sym": "W / Ŵ",
            "desc": "原始 / 量化权重矩阵。"
          },
          {
            "sym": "X",
            "desc": "校准输入（d_col × n）。"
          },
          {
            "sym": "‖·‖₂²",
            "desc": "平方 L2 误差，越小越好。"
          },
          {
            "sym": "H_F",
            "desc": "剩余权重集合 F 对应的 Hessian。"
          },
          {
            "sym": "2 X Xᵀ",
            "desc": "输入 Gram 矩阵乘常数 2，与权重无关。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "目标是保输出",
          "desc": "让量化后的层输出接近原始输出。"
        },
        {
          "icon": "🔧",
          "title": "误差是二次型",
          "desc": "曲率 H=2XXᵀ 与权重无关，可预先算。"
        },
        {
          "icon": "✨",
          "title": "曲率定代价",
          "desc": "曲率大的位置一动就伤全局。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "最优补偿：放一块、垫平其余",
      "badge": "both",
      "badgeLabel": "深入原理",
      "bridge": "知道曲率后，就能回答「放下一块砖怎么办」。这一章给出 GPTQ/OBQ 的核心更新：量化一个权重，用 H⁻¹ 把其余权重最优地补偿回来。",
      "analogy": {
        "title": "放一块垫一片",
        "text": "放好一块标准砖，立刻把<b>其余砖位一起垫平</b>，路面几乎不动。",
        "componentId": "gptq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "补偿三步",
          "desc": "分步展示「选一块 → 量误差 → 更新其余」的补偿过程。",
          "componentId": "m5-compensate"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "补偿强度",
          "desc": "拖动补偿比例，观察补得太少、刚好与补过头对层输出误差的影响。",
          "componentId": "m5-strength"
        }
      ],
      "insight": "补偿不是乱调：它沿 H⁻¹ 的最优方向、按曲率的逆加权分摊，使层输出几乎不变。",
      "formula": {
        "lead": "选一个权重化到最近格点；补偿量等于误差除以该处「软度」，再沿 H⁻¹ 的对应列分摊。",
        "unicode": "δ_F = − ( w_q − quant(w_q) ) / [H_F⁻¹]_qq · (H_F⁻¹)_{:,q}",
        "symbols": [
          {
            "sym": "w_q",
            "desc": "当前被量化的权重。"
          },
          {
            "sym": "quant(w_q)",
            "desc": "化到最近格点的值。"
          },
          {
            "sym": "δ_F",
            "desc": "其余未量化权重的补偿更新。"
          },
          {
            "sym": "[H_F⁻¹]_qq",
            "desc": "该位置的「软度」（曲率的逆对角元）。"
          },
          {
            "sym": "(H_F⁻¹)_{:,q}",
            "desc": "补偿分摊的方向。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "放一块补其余",
          "desc": "量化一个权重后立即补偿其余权重。"
        },
        {
          "icon": "🔧",
          "title": "沿 H⁻¹ 走",
          "desc": "补偿方向与大小由二阶信息决定。"
        },
        {
          "icon": "✨",
          "title": "过犹不及",
          "desc": "补偿有最优值，补多补少都变差。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "分块更新：一次铺一段",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "算法够准了，但它一开始跑得很慢——瓶颈在显存带宽。这一章看 GPTQ 如何用分块更新把 GPU 利用率拉起来。",
      "analogy": {
        "title": "一次铺一段",
        "text": "别一块一块来回跑，<b>一次铺满一段</b>再统一对齐。",
        "componentId": "gptq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "块大小 B",
          "desc": "切换块大小，观察对吞吐与数值稳定性的影响。",
          "componentId": "m6-block"
        }
      ],
      "insight": "分块不减少理论计算，却把访存瓶颈按下去，给超大模型带来约一个数量级的实际提速。",
      "formula": {
        "lead": "一次处理一个块的列集合 Q，块内先更新，块末再用多权重版本整体更新其余列。",
        "unicode": "δ_F = − ( w_Q − quant(w_Q) ) ( [H_F⁻¹]_QQ )⁻¹ (H_F⁻¹)_{:,Q}",
        "symbols": [
          {
            "sym": "Q",
            "desc": "当前块内被量化的列集合（大小 B=128）。"
          },
          {
            "sym": "w_Q / quant(w_Q)",
            "desc": "块内权重及其量化值。"
          },
          {
            "sym": "[H_F⁻¹]_QQ",
            "desc": "对应的 B×B 子块。"
          },
          {
            "sym": "δ_F",
            "desc": "对块内其余列与后续列的补偿。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "一次一段",
          "desc": "B=128 列一起处理，减少来回更新。"
        },
        {
          "icon": "🔧",
          "title": "块内先不动",
          "desc": "块内只更新本块，块末再全局更新。"
        },
        {
          "icon": "✨",
          "title": "不省计算省带宽",
          "desc": "不减少理论计算，却把访存瓶颈按下去了。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "数值稳定：Cholesky 与阻尼",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "大模型上逆矩阵会变得不定，导致补偿「越补越歪」。这一章看 GPTQ 如何用 Cholesky 分解与阻尼让它稳定。",
      "analogy": {
        "title": "用水平尺找平",
        "text": "不找平，小径会<b>越铺越斜</b>；用水平尺加找平才稳。",
        "componentId": "gptq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "稳定 vs 崩坏",
          "desc": "对比「无稳定化」与「Cholesky+阻尼」在不同层上的表现。",
          "componentId": "m7-stable"
        }
      ],
      "insight": "算法正确之外，数值稳定性决定它能否真正跑在 175B 上；Cholesky 预计算与 1% 阻尼是可行性的关键。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "不稳就崩坏",
          "desc": "H⁻¹ 不定会让补偿方向失控。"
        },
        {
          "icon": "🔧",
          "title": "Cholesky 预计算",
          "desc": "预先算好需要的行，更稳也更快。"
        },
        {
          "icon": "✨",
          "title": "1% 阻尼",
          "desc": "在对角加平均对角的 1%，避免数值问题。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "完整算法：Algorithm 1",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "固定顺序、分块更新、Cholesky 三步都讲完了。这一章把它们合起来，给出可实现的完整算法流程。",
      "analogy": {
        "title": "按工序推进",
        "text": "把前面的做法写成<b>工序表</b>：按块逐列、段末对齐。",
        "componentId": "gptq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "算法流水线",
          "desc": "点击阶段节点或用分步按钮走一遍：准备 H⁻¹ → 进入块 → 逐列量化 → 累积误差 → 块末全局更新。",
          "componentId": "m8-algo"
        }
      ],
      "insight": "GPTQ = 固定顺序 + 分块更新 + Cholesky 的组合；三者叠加才能数小时量化 175B。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "三步合一",
          "desc": "固定顺序、分块、Cholesky。"
        },
        {
          "icon": "🔧",
          "title": "块内逐列",
          "desc": "每列量化后累积误差 E。"
        },
        {
          "icon": "✨",
          "title": "块末更新",
          "desc": "用 E 与 H⁻¹ 整体更新剩余列。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "分组与极端低比特",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "量化网格可以换。这一章看分组量化如何在 3-4 位加成，以及压缩到 2 位与三值时的表现与边界。",
      "analogy": {
        "title": "换更窄的砖",
        "text": "换成<b>更窄的砖</b>，甚至只留<b>三种规格</b>，路也能铺出来。",
        "componentId": "gptq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "位宽与分组",
          "desc": "切换位宽与分组，观察 OPT-175B 的困惑度变化，理解压缩极限。",
          "componentId": "m9-bits"
        }
      ],
      "insight": "位宽与分组共同决定压缩-精度权衡；GPTQ 可与任意网格组合，小分组下 2 位甚至三值仍可用。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "兼容任意网格",
          "desc": "GPTQ 可配分组与其他量化方案。"
        },
        {
          "icon": "🔧",
          "title": "分组加成",
          "desc": "g1024/g128 在 3-4 位明显改善。"
        },
        {
          "icon": "✨",
          "title": "可到 2 位/三值",
          "desc": "小分组下 OPT-175B 仍可用。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、速度与局限",
      "badge": "both",
      "badgeLabel": "深入原理",
      "bridge": "前面讲的是机制，这一章把各方法放到同一把尺子上比较，并说清适用条件与边界。",
      "analogy": {
        "title": "两条小径比一比",
        "text": "一条又慢又坑，一条又快又平，<b>走到还是一样的终点</b>。",
        "componentId": "gptq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "结果对照",
          "desc": "按下开始，让各方法在同一坐标上赛跑，并切换困惑度／运行时间／端到端提速三个指标。",
          "componentId": "m10-race"
        }
      ],
      "insight": "GPTQ 在 3-4 位显著优于 RTN 且几乎无损；但加速来自减少访存而非计算，也未做激活量化——这是明确的边界。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "精度几乎无损",
          "desc": "4 位 OPT-175B 只差 0.03，3 位仍可用。"
        },
        {
          "icon": "🔧",
          "title": "单卡可跑",
          "desc": "3 位 OPT-175B 进单张 80GB A100，提速 3.24×。"
        },
        {
          "icon": "✨",
          "title": "认清边界",
          "desc": "加速来自省访存、未做激活量化，聚焦低 batch 生成。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1euPkerEun",
      "title": "【13】GPTQ、AWQ、GGUF 等模型量化概念讲解",
      "reason": "量化概念总览，先分清 GPTQ/AWQ/GGUF 的定位。",
      "cover": "https://i0.hdslb.com/bfs/archive/f826010fd169fdc2c19a5572d09dcd81a6d305c7.jpg",
      "views": "2.7万播放"
    },
    {
      "bvid": "BV1AFpB6TE3o",
      "title": "模型压到 4bit 之后，究竟丢掉了什么？",
      "reason": "用动画讲清 4bit 量化丢掉了什么，并提到 GPTQ 的误差补偿。",
      "cover": "https://i2.hdslb.com/bfs/archive/526c3af2ac494462af630515610d32721d70dadc.jpg",
      "views": "1.0万播放"
    },
    {
      "bvid": "BV1TX4y1U74K",
      "title": "GPTQ&OBC：量化你的 GPT【论文粗读·4】",
      "reason": "直接精读 GPTQ 与 OBC 论文，对应本文核心。",
      "cover": "https://i1.hdslb.com/bfs/archive/9dd59d86aac7a6d6fd8d26f12509f3a1b4aa5a05.jpg",
      "views": "9130播放"
    },
    {
      "bvid": "BV1UjiuBFECB",
      "title": "[LLM推理] 深入理解大模型量化：GPTQ 原理解析",
      "reason": "专题解析 GPTQ 原理（后训练量化 PTQ），主题完全对应。",
      "cover": "https://i0.hdslb.com/bfs/archive/61745425245977652b1d1411fce0a8ee56adc199.jpg",
      "views": "7689播放"
    }
  ]
};
