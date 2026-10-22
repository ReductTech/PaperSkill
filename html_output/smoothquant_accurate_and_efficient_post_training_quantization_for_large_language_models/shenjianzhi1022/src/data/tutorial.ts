import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "SmoothQuant: Accurate and Efficient Post-Training Quantization for Large Language Models",
    "titleZh": "SmoothQuant：面向大语言模型的精确高效后训练量化",
    "venue": "ICML 2023 · arXiv:2211.10438",
    "authors": "Guangxuan Xiao, Ji Lin, Mickael Seznec, Hao Wu, Julien Demouth, Song Han",
    "affiliation": "MIT · NVIDIA",
    "domain": "大语言模型 / 训练后量化 / 高效推理",
    "coreProblem": "LLM 激活有固定通道的离群值，per-tensor/per-token 激活量化会崩；per-channel 精度好但与 INT8 GEMM 不兼容，LLM.int8() 又要混合精度、速度慢。",
    "coreInsight": "用逐通道等价缩放把量化难度从激活迁移到权重：X/s 与 sW 结果不变，α=0.5 时两边都好量化，从而启用 W8A8 与 INT8 GEMM。",
    "keywords": [
      "W8A8 量化",
      "激活离群值",
      "等价缩放",
      "大模型推理"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "FP16 直接部署：GPT-3 175B 至少 350GB，需要 8×48GB 或 5×80GB 卡；激活离群值让量化一碰就崩。",
      "componentId": "sq-hero-old"
    },
    "newMethod": {
      "desc": "SmoothQuant 把激活难度等价搬到权重，W8A8 保持精度，显存约减半、最高 1.56× 提速。",
      "componentId": "sq-hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "挑起两筐上路：装不下与不稳",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "先看清真实约束：175B 的 FP16 至少 350GB，单卡装不下；W8A8 才能同时省显存和算力，但激活离群值让扁担挑不稳。这一章用两筐行李带出主线。",
      "analogy": {
        "title": "前筐太重",
        "text": "前筐塞了<b>一块巨石</b>，扁担一直往前倾。模型的激活也一样：<b>离群值</b>把量化范围撑爆。",
        "componentId": "sq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "显存预算",
          "desc": "拖动可用显存，看 FP16 与 W8A8 的 175B 能否放下，以及能省下多少张卡。",
          "componentId": "m1-budget"
        }
      ],
      "insight": "W8A8 是同时省显存与算力的关键；难点不在权重，而在激活里的离群值。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "装不下是常态",
          "desc": "175B 的 FP16 至少 350GB，需要多卡。"
        },
        {
          "icon": "🔧",
          "title": "W8A8 才双省",
          "desc": "只量化权重省显存但不省算力；W8A8 才能用 INT8 GEMM。"
        },
        {
          "icon": "✨",
          "title": "难点在激活",
          "desc": "激活里有离群值，直接把量化范围撑爆。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "前筐里的巨石：激活离群值",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "既然难在激活，就先看清它长什么样。这一章翻看前筐，找到那几块固定通道里的巨石。",
      "analogy": {
        "title": "翻看前筐",
        "text": "前筐里<b>几块巨石</b>特别大，而且每趟都在同一个位置。",
        "componentId": "sq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "通道直方图",
          "desc": "拖动检查线扫过各通道，看少数通道的幅值远超其他，以及有效档位为何骤降。",
          "componentId": "m2-outlier"
        }
      ],
      "insight": "问题不在所有激活，而在少数固定通道的离群值：它们跨 token 持续，撑大了 per-tensor 的步长。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "激活更难",
          "desc": "权重分布平坦，激活有离群值。"
        },
        {
          "icon": "🔧",
          "title": "离群在固定通道",
          "desc": "同一通道跨 token 持续偏大。"
        },
        {
          "icon": "✨",
          "title": "有效档位骤降",
          "desc": "per-tensor 下普通通道只剩 2–3 档。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "把石头搬到后筐：等价缩放",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "per-channel 激活量化精度最好，但硬件不支持。这一章给出 SmoothQuant 的核心：不换量化器，只把量化难度从激活搬到权重。",
      "analogy": {
        "title": "把石头搬过去",
        "text": "把巨石<b>从前筐搬到后筐</b>，扁担就平了，总重一点没变。",
        "componentId": "sq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "三种粒度",
          "desc": "对比 per-tensor / per-token / per-channel 的精度与硬件兼容性，理解为什么必须「搬」。",
          "componentId": "m3-migrate"
        }
      ],
      "insight": "精度与硬件兼容不可兼得；SmoothQuant 用等价缩放改变难度的分布，而不是换一个硬件不支持的粒度。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "精度最好的是 per-channel",
          "desc": "71.4% 接近 FP16 71.6%。"
        },
        {
          "icon": "🔧",
          "title": "但硬件不支持",
          "desc": "INT8 GEMM 只能在外维缩放。"
        },
        {
          "icon": "✨",
          "title": "所以要「搬」",
          "desc": "保持量化器不变，改变难度分布。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "量化与等价变换的数学",
      "badge": "both",
      "badgeLabel": "深入原理",
      "bridge": "知道要搬，还要知道为什么可以「白搬」。这一章给出 INT8 量化定义与等价变换，证明输出完全不变。",
      "analogy": {
        "title": "两手交换",
        "text": "左手加一点、右手减一点，<b>总重不变</b>。",
        "componentId": "sq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "等价变换三步",
          "desc": "分步展示「原始 → 除激活/乘权重 → 融合进前一层」的等价过程。",
          "componentId": "m4-math"
        }
      ],
      "insight": "激活除以 s、权重乘以 s，输出完全等价；s 还能离线融进前一层，运行时没有额外开销。",
      "formula": {
        "lead": "INT8 量化用最大绝对值确定步长；把激活除以 s、权重乘以 s，输出完全不变。",
        "unicode": "X̄ = round(X / Δ),  Δ = max(|X|) / (2^(N−1) − 1)；Y = (X diag(s)⁻¹)(diag(s) W) = X̂ Ŵ",
        "symbols": [
          {
            "sym": "X / W",
            "desc": "激活 / 权重。"
          },
          {
            "sym": "Δ",
            "desc": "量化步长。"
          },
          {
            "sym": "N",
            "desc": "量化位数（8）。"
          },
          {
            "sym": "s",
            "desc": "逐通道平滑因子（向量）。"
          },
          {
            "sym": "diag(s)",
            "desc": "以 s 为对角元的对角矩阵。"
          },
          {
            "sym": "X̂ / Ŵ",
            "desc": "平滑后的激活 / 调整后的权重。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "量化看最大绝对值",
          "desc": "Δ=max(|X|)/(2^{N-1}-1)。"
        },
        {
          "icon": "🔧",
          "title": "等价变换",
          "desc": "激活除以 s、权重乘 s，结果不变。"
        },
        {
          "icon": "✨",
          "title": "可离线融合",
          "desc": "s 融进前一层，不增加运行时开销。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "搬多少：迁移强度 α",
      "badge": "both",
      "badgeLabel": "深入原理",
      "bridge": "知道可以搬，还得知道搬多少。这一章用一个参数 α 控制迁移强度，找到让两边都好量化的平衡点。",
      "analogy": {
        "title": "试出平衡点",
        "text": "搬太少<b>前筐沉</b>，搬太多<b>后筐沉</b>；中间有一档最稳。",
        "componentId": "sq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "α 平衡",
          "desc": "拖动迁移强度 α，观察扁担倾角与量化误差，找到甜区。",
          "componentId": "m5-alpha"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "按模型选 α",
          "desc": "切换模型族，看 α 的最优值如何随离群值严重程度变化。",
          "componentId": "m5-model"
        }
      ],
      "insight": "α 是「搬多少」的单一旋钮：OPT/BLOOM 的甜区是 0.5，GLM-130B 要 0.75，Llama-2 用到 0.85。",
      "formula": {
        "lead": "平滑因子把两边通道的最大幅值按 α 做几何平均；α 越大，越多难度搬到权重。",
        "unicode": "s_j = max(|X_j|)^α / max(|W_j|)^(1−α)",
        "symbols": [
          {
            "sym": "s_j",
            "desc": "第 j 个输入通道的平滑因子。"
          },
          {
            "sym": "X_j / W_j",
            "desc": "对应通道的激活 / 权重。"
          },
          {
            "sym": "α",
            "desc": "迁移强度，[0,1]；0.5 均分难度。"
          },
          {
            "sym": "max(|·|)",
            "desc": "校准集上的通道最大绝对值。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "一个旋钮",
          "desc": "α 控制搬多少，0.5 均分。"
        },
        {
          "icon": "🔧",
          "title": "有甜区",
          "desc": "OPT-175B 的甜区是 0.4–0.6。"
        },
        {
          "icon": "✨",
          "title": "按模型调",
          "desc": "GLM-130B 0.75，Llama-2 0.85。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "分格：硬件友好的粒度与 O1–O3",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "等价变换要落到可执行的量化方案。这一章看 INT8 GEMM 的粒度限制，以及 O1/O2/O3 三档怎么选。",
      "analogy": {
        "title": "给筐分格",
        "text": "整筐一格最省事，分格越细越准但越慢。",
        "componentId": "sq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "O1 / O2 / O3",
          "desc": "切换方案，观察精度与延迟的权衡。",
          "componentId": "m6-scheme"
        }
      ],
      "insight": "INT8 GEMM 只能在外维缩放，所以给出由细到粗的 O1–O3；精度允许时选更粗、更静态的方案。",
      "formula": {
        "lead": "缩放只能作用在矩阵乘的外维，矩阵乘完再做反缩放。",
        "unicode": "Y = diag(Δ_X) · (X̄_INT8 · W̄_INT8) · diag(Δ_W)",
        "symbols": [
          {
            "sym": "X̄ / W̄",
            "desc": "INT8 量化后的激活 / 权重。"
          },
          {
            "sym": "Δ_X / Δ_W",
            "desc": "激活 / 权重的量化步长。"
          },
          {
            "sym": "diag(·)",
            "desc": "对角缩放矩阵，作用在 token 与输出通道。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "只能外维缩放",
          "desc": "token 与输出通道可以，输入通道不行。"
        },
        {
          "icon": "🔧",
          "title": "三档方案",
          "desc": "O1 细、O2 中、O3 粗。"
        },
        {
          "icon": "✨",
          "title": "越粗越快",
          "desc": "精度允许时用更粗/更静态的方案。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "预演：校准与融合",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "等价变换会不会拖慢推理？这一章看校准只做一次、缩放离线融进前一层，运行时不额外停。",
      "analogy": {
        "title": "出发前先分好",
        "text": "把搬石头的活<b>提前做完</b>，上路后不再停。",
        "componentId": "sq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "融合前 vs 融合后",
          "desc": "对比「每次运行时缩放」与「离线融合」的额外开销，理解为什么 SmoothQuant 不拖慢推理。",
          "componentId": "m7-fuse"
        }
      ],
      "insight": "等价变换可以「免费」落地：512 句校准一次，s 融进 LayerNorm/线性层，残差分支补一次缩放。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "校准一次",
          "desc": "512 句 Pile 文本，统计一次即可。"
        },
        {
          "icon": "🔧",
          "title": "离线融合",
          "desc": "s 融进前一层，不增加内核调用。"
        },
        {
          "icon": "✨",
          "title": "残差要补",
          "desc": "残差分支需额外加一次缩放。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "分工：Transformer 精度映射",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "W8A8 不是把所有算子都量化。这一章看完整精度映射：哪些用 INT8、哪些保留 FP16，以及为什么。",
      "analogy": {
        "title": "重活才标准化",
        "text": "只把<b>重活</b>交给标准石子，轻活保留原样。",
        "componentId": "sq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "精度映射图",
          "desc": "点击 Transformer 组件，查看它是 INT8 还是 FP16，以及原因。",
          "componentId": "m8-map"
        }
      ],
      "insight": "量化要抓大放小：只把计算密集的线性层与注意力 BMM 用 INT8，轻量逐元素算子保留 FP16。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "抓大放小",
          "desc": "只量化线性层与 BMM。"
        },
        {
          "icon": "🔧",
          "title": "轻量算子保留",
          "desc": "ReLU/Softmax/LayerNorm 用 FP16。"
        },
        {
          "icon": "✨",
          "title": "平衡精度与效率",
          "desc": "这是 SmoothQuant 的工程取舍。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "换场景：530B、解码与 GPTQ 互补",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "方法能走多远、适用于哪些场景？这一章看 530B 单节点、解码加速，以及它与只量化权重的 GPTQ 的分工。",
      "analogy": {
        "title": "换条长路",
        "text": "路更长、担子更重，配平后照样能走。",
        "componentId": "sq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "规模与批量",
          "desc": "切换模型规模与场景，理解 W8A8 的收益从何而来。",
          "componentId": "m9-scale"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "W8A8 vs 权重量化",
          "desc": "点击场景，理解 SmoothQuant 与 GPTQ 的分工。",
          "componentId": "m9-compare"
        }
      ],
      "insight": "W8A8 能上 530B 单节点、也能加速解码；它与只量化权重的 GPTQ 互补，按场景选择或组合。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "能上 530B",
          "desc": "8 卡单节点，精度不变。"
        },
        {
          "icon": "🔧",
          "title": "解码也快",
          "desc": "每 token 最高 1.42×。"
        },
        {
          "icon": "✨",
          "title": "与 GPTQ 互补",
          "desc": "上下文/批量 vs 单序列生成。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、速度与局限",
      "badge": "both",
      "badgeLabel": "深入原理",
      "bridge": "前面讲的是机制，这一章把各方案放到同一条山路上比较，并说清适用条件与边界。",
      "analogy": {
        "title": "两条山路",
        "text": "一条歪歪扭扭走得慢，一条<b>配平后</b>又快又稳。",
        "componentId": "sq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "结果对照",
          "desc": "按下开始，让各方案在同一坐标上赛跑，并切换精度／延迟／显存三个指标。",
          "componentId": "m10-race"
        }
      ],
      "insight": "SmoothQuant 在 3–530B 模型上保持 FP16 精度，最高 1.56× 提速、显存约减半；但 α、方案与收益依赖模型/硬件/场景。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "精度几乎无损",
          "desc": "3–530B 模型都保持 FP16 水平。"
        },
        {
          "icon": "🔧",
          "title": "真提速省显存",
          "desc": "最高 1.56×、显存约减半、530B 单节点。"
        },
        {
          "icon": "✨",
          "title": "认清边界",
          "desc": "α/方案按模型选；与权重量化互补。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1Na4aexED4",
      "title": "【LLM学习记录】浅析 SmoothQuant-1",
      "reason": "逐段讲清激活平滑与等价变换，主题完全对应。",
      "cover": "https://i2.hdslb.com/bfs/archive/7e59ad726f246766d9a4f185451e4a86e7a84efb.jpg",
      "views": "840播放"
    },
    {
      "bvid": "BV1CkoPBbEyB",
      "title": "[18] SmoothQuant：大模型量化论文解读",
      "reason": "直接做 SmoothQuant 论文解读，适合先看整体。",
      "cover": "https://i2.hdslb.com/bfs/archive/ffe3ca63dee883b48214acb79c03651ee425491d.jpg",
      "views": "825播放"
    },
    {
      "bvid": "BV1J24FedEVQ",
      "title": "【LLM学习记录】浅析 SmoothQuant-2",
      "reason": "偏实现与 INT8 GEMM，承接第一篇。",
      "cover": "https://i2.hdslb.com/bfs/archive/3405100688a131b5407940476c6d05857ee24598.jpg",
      "views": "634播放"
    },
    {
      "bvid": "BV12VUKBmE3Q",
      "title": "【模型压缩论文阅读】SmoothQuant：用于大语言模型的准确高效的后训练量化方法",
      "reason": "模型压缩论文阅读，按论文结构讲 SmoothQuant。",
      "cover": "https://i2.hdslb.com/bfs/archive/625cf0253d01e0dcacbbeb4f6bffeaa605439233.jpg",
      "views": "581播放"
    }
  ]
};
