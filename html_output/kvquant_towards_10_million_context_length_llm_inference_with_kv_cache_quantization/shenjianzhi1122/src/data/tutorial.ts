import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "KVQuant: Towards 10 Million Context Length LLM Inference with KV Cache Quantization",
    "titleZh": "KVQuant：面向千万级上下文 LLM 推理的 KV Cache 量化",
    "venue": "NeurIPS 2024 · arXiv:2401.18079",
    "authors": "Coleman Hooper, Sehoon Kim, Hiva Mohammadzadeh, Michael W. Mahoney, Yakun Sophia Shao, Kurt Keutzer, Amir Gholami",
    "affiliation": "UC Berkeley · ICSI · LBNL",
    "domain": "大语言模型 / KV Cache / 超低比特量化 / 长上下文",
    "coreProblem": "长上下文下 KV cache 成为主要显存/带宽瓶颈；4bit 以下现有方法精度崩，RoPE 还会打散 Key 的离群通道。",
    "coreInsight": "Key 按通道 + Pre-RoPE + 敏感度非均匀 nuq + 每向量 1% 稠密稀疏 + 自定义 kernel：3bit 掉点 <0.1、省 4.8×，7B 单卡 1M、8 卡 10M。",
    "keywords": [
      "KV cache 量化",
      "超低比特",
      "Pre-RoPE",
      "非均匀量化",
      "稠密稀疏",
      "长上下文"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "把大件衣物硬塞进一个箱子，箱盖合不上；对应全精度 KV、4bit 以下量化精度崩。",
      "componentId": "kq-hero-old"
    },
    "newMethod": {
      "desc": "按类别抽真空、按件卷、1% 超规物品进硬盒、证件包随身：Key 按通道、Value 按 token、Pre-RoPE + nuq + 稠密稀疏。",
      "componentId": "kq-hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "合不上的行李箱：为什么需要超低比特 KV 量化",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "长上下文下，KV cache 会从配角变成主要显存开销。这一章用一只合不上的行李箱，带出 1M/10M 上下文的容量问题。",
      "analogy": {
        "title": "箱子合不上",
        "text": "大件越塞越多，<b>箱盖合不上</b>。KV cache 也一样。",
        "componentId": "kq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "后备箱容量",
          "desc": "拖动上下文长度，看 FP16 与 2bit KV 的显存差异，理解 1M/10M 需要多低比特。",
          "componentId": "m1-trunk"
        }
      ],
      "insight": "上下文越长，瓶颈从模型权重转向 KV cache；它随 token 线性增长，只有压到 2bit 左右才能把 1M 装进单卡、10M 装进 8 卡。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "KV 线性增长",
          "desc": "随 token 与 batch 线性涨。"
        },
        {
          "icon": "🔧",
          "title": "加载受带宽限制",
          "desc": "每 token 都要搬 KV。"
        },
        {
          "icon": "✨",
          "title": "超低比特",
          "desc": "2bit 才能单卡 1M。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "行李清单：Key 与 Value 的通道/token",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "KV cache 是两个 token×channel 的张量。这一章把 Key 比作分类清单、Value 比作单件物品，并画出“按件”和“按类别”两个方向。",
      "analogy": {
        "title": "清单与物品",
        "text": "Key 像<b>分类清单</b>，Value 像<b>单件物品</b>。",
        "componentId": "kq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "行与列",
          "desc": "拖动检查位置，在 token 行与 channel 列之间切换，理解两种压缩方向。",
          "componentId": "m2-layout"
        }
      ],
      "insight": "“按件还是按类别”不是实现细节，而是精度的核心选择；同一份数据换方向，误差完全不同。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两个张量",
          "desc": "K 和 V 都是 token×channel。"
        },
        {
          "icon": "🔧",
          "title": "两个方向",
          "desc": "按件（token）或按类别（channel）。"
        },
        {
          "icon": "✨",
          "title": "方向会变",
          "desc": "换方向误差完全不同。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "核心洞见：按类别还是按件",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "KVQuant 的第一个关键设计不是“压得更低”，而是“Key 和 Value 沿不同方向压”。这一章用 3bit 的 PPL 说明为什么。",
      "analogy": {
        "title": "按类别压缩",
        "text": "清单<b>按类别</b>，物品<b>按件</b>。",
        "componentId": "kq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "两种配置",
          "desc": "切换“全部按件”与“Key 按类别 / Value 按件”，比较 3bit PPL。",
          "componentId": "m3-axis"
        }
      ],
      "insight": "Key 有少数固定离群 channel，按类别压缩能把误差关在类内；Value 没有固定离群 channel，但注意力输出是稀疏加权和，按件压缩才能保住重要件。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "Key 按类别",
          "desc": "少数固定离群 channel。"
        },
        {
          "icon": "🔧",
          "title": "Value 按件",
          "desc": "输出是稀疏加权和。"
        },
        {
          "icon": "✨",
          "title": "改善 3.82 PPL",
          "desc": "3bit LLaMA-7B。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "先压缩再混装：Pre-RoPE",
      "badge": "both",
      "badgeLabel": "深入原理",
      "bridge": "RoPE 会按位置旋转相邻通道，把 Key 的离群结构打散。这一章讲 KVQuant 为什么要在 RoPE 之前量化，以及怎么在取用时补上旋转。",
      "analogy": {
        "title": "先压缩再混装",
        "text": "先<b>压缩</b>再混装，别反过来。",
        "componentId": "kq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "Pre-RoPE 三步",
          "desc": "分步展示“Post-RoPE 量化 → Pre-RoPE 量化 → 反量化后施加 RoPE”。",
          "componentId": "m4-prerope"
        }
      ],
      "insight": "顺序本身就是一个方法：先量化原始 Key 能保住固定离群通道，反量化后再施加 RoPE，3bit 下改善 0.82 PPL。",
      "formula": {
        "lead": "RoPE 用位置相关的旋转矩阵作用在 Key 上；先量化原始 Key，反量化后再乘旋转矩阵。",
        "unicode": "K̃_n = R^d_{θ,n} · K_n；先存 Q(K_n)，取用时 K̂_n = R^d_{θ,n} · Q^{-1}(Q(K_n))",
        "symbols": [
          {
            "sym": "K_n",
            "desc": "第 n 个位置的原始 Key。"
          },
          {
            "sym": "R^d_{θ,n}",
            "desc": "位置 n 的 RoPE 旋转矩阵。"
          },
          {
            "sym": "θ_i",
            "desc": "各通道对的旋转频率，10000^{-2(i−1)/d}。"
          },
          {
            "sym": "Q(·) / Q^{-1}(·)",
            "desc": "量化 / 反量化。"
          },
          {
            "sym": "K̂_n",
            "desc": "反量化并施加 RoPE 后的 Key。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "RoPE 会打散",
          "desc": "相邻通道被旋转混合。"
        },
        {
          "icon": "🔧",
          "title": "先量化",
          "desc": "保住固定离群通道。"
        },
        {
          "icon": "✨",
          "title": "改善 0.82 PPL",
          "desc": "3bit LLaMA-7B。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "非均匀打包：nuq 与 1% 超规物品",
      "badge": "both",
      "badgeLabel": "深入原理",
      "bridge": "方向对了，档位怎么放、离群值怎么处理仍然关键。这一章讲敏感度加权的非均匀档位（nuq）和每向量 1% 的稠密稀疏。",
      "analogy": {
        "title": "选袋 + 硬盒",
        "text": "按重要度选<b>袋</b>，超规物品进<b>硬盒</b>。",
        "componentId": "kq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "均匀 vs 非均匀",
          "desc": "切换均匀/非均匀档位，比较 3bit PPL。",
          "componentId": "m5-nuq"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "1% 超规物品",
          "desc": "拖动阈值，挑出每向量的离群值，观察 PPL 与硬盒体积。",
          "componentId": "m5-outlier"
        }
      ],
      "insight": "低比特下“档位放哪”比“档位多少”更重要；离群值要按向量挑、单独存 FP16，而不是全层一个阈值。",
      "formula": {
        "lead": "用 Fisher 敏感度给每个量化误差加权，离线最小化；离群值单独放进稀疏矩阵，其余走稠密低比特。",
        "unicode": "Q(A)* ≈ argmin_Q Σ F_ii (A_i − Q(A_i))^2；X ≈ X_dense + X_sparse（X_sparse 只保留约 1% 离群）",
        "symbols": [
          {
            "sym": "A",
            "desc": "展平后的 Key/Value 激活。"
          },
          {
            "sym": "F_ii",
            "desc": "对角 Fisher 信息（敏感度）。"
          },
          {
            "sym": "Q(·)",
            "desc": "非均匀量化器。"
          },
          {
            "sym": "N",
            "desc": "校准集元素数。"
          },
          {
            "sym": "X_dense / X_sparse",
            "desc": "稠密低比特部分 / 稀疏 FP16 离群部分。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "档位按敏感度",
          "desc": "均匀等距会浪费。"
        },
        {
          "icon": "🔧",
          "title": "每向量挑离群",
          "desc": "1% 就够。"
        },
        {
          "icon": "✨",
          "title": "0.29 + 0.19",
          "desc": "两项合计约 0.48 PPL。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "快速打包台：自定义 kernel",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "超低比特如果解压太慢，省了显存也会赔掉速度。这一章看 KVQuant 如何用 LUT、稀疏 kernel 和融合 RoPE 把“边压边取”做快。",
      "analogy": {
        "title": "快速打包台",
        "text": "边压边取，<b>不用来回搬</b>。",
        "componentId": "kq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "打包流程",
          "desc": "点击流程节点，理解压缩、LUT 反量化、稠密/稀疏 matvec 与 RoPE 融合。",
          "componentId": "m6-kernel"
        }
      ],
      "insight": "低比特的收益取决于 kernel 是否把反量化、稀疏离群和 RoPE 融进一次访问；否则省了显存却慢了速度。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "LUT 反量化",
          "desc": "4bit 索引查表。"
        },
        {
          "icon": "🔧",
          "title": "稀疏单独算",
          "desc": "CSR/CSC + 平衡 kernel。"
        },
        {
          "icon": "✨",
          "title": "最高约 1.7×",
          "desc": "4bit vs FP16 matvec。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "出发前试装：离线校准 vs 在线",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "量化参数是提前算还是现场算？Key 和 Value 的答案不同。这一章讲 KVQuant 的校准分工，以及它为什么能保持精度。",
      "analogy": {
        "title": "试装与称重",
        "text": "能提前<b>试装</b>的就提前，不能的现场称。",
        "componentId": "kq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "离线 vs 在线",
          "desc": "对比 Key/Value 的校准方式，理解为什么要分开。",
          "componentId": "m7-calib"
        }
      ],
      "insight": "Key 的按通道缩放难以在线更新，用 16×2K 校准集离线算；Value 的按 token 缩放与离群阈值在线算，阈值可 offload 到 CPU。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "Key 离线",
          "desc": "按通道缩放一次算好。"
        },
        {
          "icon": "🔧",
          "title": "Value 在线",
          "desc": "按 token 现算。"
        },
        {
          "icon": "✨",
          "title": "16×2K",
          "desc": "校准集很小。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "装车到取用：端到端流水线",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "前面分别讲了方向、顺序、档位、离群和 kernel。这一章把它们串成 prefill 建库、decode 增量压缩、取用合并的完整流水线。",
      "analogy": {
        "title": "装车到取用",
        "text": "一路<b>不用开箱重装</b>。",
        "componentId": "kq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "prefill / decode",
          "desc": "点击流程节点，理解两个阶段各自做什么、首 token 与 RoPE 何时处理。",
          "componentId": "m8-pipeline"
        }
      ],
      "insight": "KVQuant 是“建库 + 增量压缩 + 取用合并”：首 token 永远留 FP16，Key 先存原始再按需 RoPE，Value 在线量化。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "prefill 建库",
          "desc": "首 token 留 FP16。"
        },
        {
          "icon": "🔧",
          "title": "Key/Value 分开",
          "desc": "不同方向、不同校准。"
        },
        {
          "icon": "✨",
          "title": "取用合并",
          "desc": "稠密 + 稀疏。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "选箱子：2/3/4bit、1M/10M、模型",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "3bit 是甜点，但 2bit 才能单卡 1M。这一章比较位宽、上下文与方法，给出选型边界。",
      "analogy": {
        "title": "选箱子",
        "text": "不是越省越好，<b>按旅途选</b>。",
        "componentId": "kq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "位宽与上下文",
          "desc": "切换 2/3/4bit，比较 PPL 与显存，判断能装下多长上下文。",
          "componentId": "m9-bits"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "方法对比",
          "desc": "点击路线，比较 KIVI、Atom/FlexGen、KVQuant 的比特与精度。",
          "componentId": "m9-compare"
        }
      ],
      "insight": "3bit 是精度甜点（<0.1 PPL、4.8×）；2bit 是容量甜点（单卡 1M）；10M 需要 8 卡。方法差异在方向、非均匀和离群处理。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "3bit 甜点",
          "desc": "<0.1 PPL、4.8×。"
        },
        {
          "icon": "🔧",
          "title": "2bit 容量甜点",
          "desc": "单卡 1M。"
        },
        {
          "icon": "✨",
          "title": "10M 要 8 卡",
          "desc": "约 76GB/卡。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "两位旅者比一比：结果、速度与局限",
      "badge": "both",
      "badgeLabel": "深入原理",
      "bridge": "机制讲完，最后把精度、显存、延迟放到同一把尺子上比较，并说清 KVQuant 的适用边界。",
      "analogy": {
        "title": "两位比一比",
        "text": "一位箱子合不上，一位<b>又省又快</b>。",
        "componentId": "kq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "结果对照",
          "desc": "按下开始，让各方案在同一坐标上赛跑，并切换精度／显存／延迟三个指标。",
          "componentId": "m10-race"
        }
      ],
      "insight": "3bit-1% 在 PPL/LongBench/RULER 上接近 FP16 并优于同比特基线；4bit kernel 最高 1.7×；但 2bit 仍掉点、prompt 阶段未优化。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "3bit 接近 FP16",
          "desc": "5.75 vs 5.68。"
        },
        {
          "icon": "🔧",
          "title": "128K 省 4.8×",
          "desc": "13.3GB vs 64GB。"
        },
        {
          "icon": "✨",
          "title": "最高 1.7×",
          "desc": "4bit kernel。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1fcaN6fENi",
      "title": "到底什么是KV Cache，为啥不是QKV Cache，一个动画彻底搞懂！",
      "reason": "动画讲清 KV Cache 是什么、为什么不是 QKV，对应 §1/§2。",
      "cover": "https://i2.hdslb.com/bfs/archive/b729cf3a52bb2dddcc68cd5d71c8065903aeb062.jpg",
      "views": "70166播放"
    },
    {
      "bvid": "BV1dUPuzLEu7",
      "title": "保姆级KV Cache教程！从底层原理到显存计算，新手也能一次看懂",
      "reason": "从底层原理到显存计算，对应 §1 的容量账与 §2 的布局。",
      "cover": "https://i1.hdslb.com/bfs/archive/c1dc81fe5f5b0fc8e7b646b20d1910a70a56a344.jpg",
      "views": "24544播放"
    },
    {
      "bvid": "BV1pqeQ6BE3L",
      "title": "KV Cache各种量化的智商与速度",
      "reason": "直接讨论 KV Cache 各种量化的精度与速度，对应 §3/§5/§9。",
      "cover": "https://i1.hdslb.com/bfs/archive/3a3772dd90bd943f2f4a4f37a30879abdd33e824.jpg",
      "views": "6863播放"
    },
    {
      "bvid": "BV1gTWo6MEag",
      "title": "【Transformer】MLA：把 KV Cache 压成一个隐向量",
      "reason": "MLA 把 KV Cache 压成隐向量，补足另一条压缩路线（§9）。",
      "cover": "https://i1.hdslb.com/bfs/archive/db2b3ce483037f01c14307fea8fa13720a49b31f.png",
      "views": "438播放"
    }
  ]
};
