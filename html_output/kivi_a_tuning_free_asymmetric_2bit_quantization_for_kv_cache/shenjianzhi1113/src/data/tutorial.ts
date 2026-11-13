import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "KIVI: A Tuning-Free Asymmetric 2bit Quantization for KV Cache",
    "titleZh": "KIVI：面向 KV Cache 的免调优非对称 2bit 量化",
    "venue": "ICML 2024 · arXiv:2402.02750",
    "authors": "Zirui Liu, Jiayi Yuan, Hongye Jin, Shaochen Zhong, Zhaozhuo Xu, Vladimir Braverman, Beidi Chen, Xia Hu",
    "affiliation": "Rice University · Texas A&M · Stevens Institute · CMU",
    "domain": "大语言模型 / KV Cache 压缩 / 高效推理",
    "coreProblem": "批量与长上下文下 KV cache 成为显存/速度瓶颈；4bit 以下量化缺乏元素分布分析，统一按 token 量化在 2bit 会崩。",
    "coreInsight": "Key 按通道、Value 按 token 的非对称分组量化 + 全精度残差窗口 + 融合后端：免调优 2bit，显存省 2.6×，吞吐 2.35-3.47×。",
    "keywords": [
      "KV cache",
      "2bit 量化",
      "非对称量化",
      "逐通道",
      "逐 token",
      "免调优"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "所有案卷都厚厚一摞、按同一规格塞进档案架，架子很快溢出；对应全精度 KV cache、统一按 token 量化。",
      "componentId": "kv-hero-old"
    },
    "newMethod": {
      "desc": "索引卡按栏目、正文按文件、最近一叠留桌面：Key 按通道、Value 按 token，2bit 微缩 + 全精度残差窗口。",
      "componentId": "kv-hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "越堆越高的案卷：为什么需要 KV cache 量化",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "长上下文和多请求批量，会让 KV cache 变成显存与速度的新瓶颈。这一章用一桩越堆越高的案卷，带出 KIVI 要解决的容量问题。",
      "analogy": {
        "title": "架子塞满了",
        "text": "案卷越堆越高，<b>档案室放不下</b>。KV cache 也一样。",
        "componentId": "kv-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "档案室容量",
          "desc": "拖动上下文长度，看 FP16 KV cache 与 2bit 的显存差异，理解长上下文为什么必须先压缩 KV。",
          "componentId": "m1-budget"
        }
      ],
      "insight": "长上下文的主要成本不是权重，而是随 token 线性增长的 KV cache；2bit 把每个元素的字节数压到 1/8。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "KV 随 token 线性长",
          "desc": "长上下文先卡 KV。"
        },
        {
          "icon": "🔧",
          "title": "搬运也费时",
          "desc": "每 token 都要把 KV 搬进 SRAM。"
        },
        {
          "icon": "✨",
          "title": "量化最直接",
          "desc": "2bit 把字节数压到 1/8。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "两种档案：Key 索引卡与 Value 正文页",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "KV cache 是两个形状为 长度×通道 的张量。这一章把 Key 比作索引卡、Value 比作正文页，并画出“按行”和“按列”两个方向。",
      "analogy": {
        "title": "卡片与正文",
        "text": "Key 像<b>索引卡</b>，Value 像<b>正文页</b>。",
        "componentId": "kv-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "行与列",
          "desc": "拖动检查线，在 token 行与 channel 列之间切换，理解两种量化方向。",
          "componentId": "m2-layout"
        }
      ],
      "insight": "“按行还是按列”不是实现细节，而是精度的核心选择；同一份数据换方向，误差完全不同。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两个张量",
          "desc": "K 和 V 都是 长度×通道。"
        },
        {
          "icon": "🔧",
          "title": "两个方向",
          "desc": "按 token（行）或按 channel（列）。"
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
      "title": "核心洞见：按栏目还是按文件",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "KIVI 的核心不是“把 KV 量化”，而是“K 和 V 沿不同方向量化”。这一章用四种组合的 2bit 精度，说明为什么必须非对称。",
      "analogy": {
        "title": "按栏目归档",
        "text": "索引卡<b>按栏目</b>，正文<b>按文件</b>。",
        "componentId": "kv-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "四种组合",
          "desc": "切换 K/V 的量化方向，比较 2bit 精度，理解非对称配置为什么最好。",
          "componentId": "m3-axis"
        }
      ],
      "insight": "Key 有少数固定离群 channel，必须按列；Value 没有固定离群 channel，但注意力输出是稀疏加权和，必须按行。放错方向会直接崩。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "Key 按列",
          "desc": "少数固定离群 channel。"
        },
        {
          "icon": "🔧",
          "title": "Value 按行",
          "desc": "输出是稀疏加权和。"
        },
        {
          "icon": "✨",
          "title": "非对称最好",
          "desc": "2bit 下 63.53 vs 52.93。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "核心数学：非对称分组压缩",
      "badge": "both",
      "badgeLabel": "深入原理",
      "bridge": "“按栏目/按文件”需要写成可计算的步骤。这一章讲非对称量化：用每组最小值做零点、用动态范围做缩放，再取整与反量化。",
      "analogy": {
        "title": "先量再缩",
        "text": "先看<b>最小/最大</b>，再定尺微缩。",
        "componentId": "kv-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "量化三步",
          "desc": "分步展示非对称量化的零点、缩放与反量化。",
          "componentId": "m4-quant"
        }
      ],
      "insight": "零点处理非对称分布，分组限制离群值的影响范围；2bit 只有 4 个档位，所以“组”和“方向”都必须对。",
      "formula": {
        "lead": "非对称量化先把每组减去最小值，再按动态范围缩放并取整；反量化时乘回缩放再加回零点。",
        "unicode": "Q(X) = floor((X − z_X) / s_X)；X' = Q(X) · s_X + z_X，其中 z_X = min X，s_X = (max X − min X) / (2^B − 1)",
        "symbols": [
          {
            "sym": "X",
            "desc": "一组的 key 或 value 元素。"
          },
          {
            "sym": "z_X",
            "desc": "零点，取该组最小值。"
          },
          {
            "sym": "s_X",
            "desc": "缩放因子，由动态范围决定。"
          },
          {
            "sym": "B",
            "desc": "位宽（2 或 4）。"
          },
          {
            "sym": "Q(·)",
            "desc": "取整到 B 位整数。"
          },
          {
            "sym": "X'",
            "desc": "反量化后的近似值。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "减零点",
          "desc": "处理非对称分布。"
        },
        {
          "icon": "🔧",
          "title": "除缩放",
          "desc": "用动态范围定步长。"
        },
        {
          "icon": "✨",
          "title": "分组",
          "desc": "把离群值关进小组。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "桌面留一叠：残差窗口",
      "badge": "both",
      "badgeLabel": "深入原理",
      "bridge": "如果所有 token 都压到 2bit，难题会掉点。KIVI 把最近 R 个 token 留在桌面不压缩，旧的攒够一组再转微缩。这一章讲清这个窗口。",
      "analogy": {
        "title": "桌面留一叠",
        "text": "最近一叠<b>留桌面</b>，旧的攒够再微缩。",
        "componentId": "kv-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "残差长度",
          "desc": "调节 R，观察 GSM8K 的变化，理解“留一叠”对难题的作用。",
          "componentId": "m5-residual"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "流式归档",
          "desc": "点击流程节点，理解新 token 如何进入残差、何时转量化、Key/Value 的差别。",
          "componentId": "m5-stream"
        }
      ],
      "insight": "全精度残差窗口让“按列量化”在自回归生成里可行；它把 fake 2bit 的 GSM8K 5.76 拉回 KIVI-2 的 12.74。",
      "formula": {
        "lead": "把注意力分成“已微缩的旧卷”和“桌面的新卷”两段，分别算分数再拼起来。",
        "unicode": "A = Concat([t_Q · Q(X_Kg)^T, t_Q · X_Kr^T])；t_O = A_g · Q(X_Vg) + A_r · X_Vr",
        "symbols": [
          {
            "sym": "X_Kg / X_Vg",
            "desc": "已量化的分组 K/V。"
          },
          {
            "sym": "X_Kr / X_Vr",
            "desc": "残差窗口里的全精度 K/V。"
          },
          {
            "sym": "Q(·)",
            "desc": "量化（反量化融合在矩阵乘里）。"
          },
          {
            "sym": "A_g / A_r",
            "desc": "两段注意力分数。"
          },
          {
            "sym": "t_Q",
            "desc": "当前查询。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "最近留全精度",
          "desc": "R 个 token 不压缩。"
        },
        {
          "icon": "🔧",
          "title": "攒满再转",
          "desc": "旧卷按组进微缩。"
        },
        {
          "icon": "✨",
          "title": "难题靠它",
          "desc": "fake 2bit 5.76 → KIVI-2 12.74。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "边查边解压：系统后端",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "量化省了字节，但解压也要成本。这一章看 KIVI 如何把反量化融进矩阵乘、用 Triton 写分组量化 kernel，避免额外搬运。",
      "analogy": {
        "title": "边查边解压",
        "text": "不用整卷搬回，<b>边查边解压</b>。",
        "componentId": "kv-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "融合流程",
          "desc": "点击流程节点，理解 Q_MatMul、Triton kernel 与显存搬运的关系。",
          "componentId": "m6-kernel"
        }
      ],
      "insight": "量化收益取决于解压是否融合；把反量化放进矩阵乘的 tile 里，才能既省显存又省带宽。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "解压也要钱",
          "desc": "不融合会多吃带宽。"
        },
        {
          "icon": "🔧",
          "title": "融进矩阵乘",
          "desc": "tile 级解压。"
        },
        {
          "icon": "✨",
          "title": "才有吞吐",
          "desc": "2.35-3.47×。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "免培训直接上岗：tuning-free",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "很多量化方法要先训练或校准。KIVI 不需要：每组参数在推理时现算。这一章讲清“免调优”免了什么，以及它的边界。",
      "analogy": {
        "title": "免培训上岗",
        "text": "不用先培训，<b>直接上岗</b>。",
        "componentId": "kv-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "调优 vs 免调优",
          "desc": "对比 QAT/校准 PTQ 与 KIVI 的部署成本与精度，理解“免调优”的边界。",
          "componentId": "m7-tuning"
        }
      ],
      "insight": "免调优是部署优势，但不是无条件无损：Falcon 这类 MQA 模型仍建议 4bit，2bit 在 Llama/Mistral 上也可能掉约 2%。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "免微调",
          "desc": "不用改模型参数。"
        },
        {
          "icon": "🔧",
          "title": "免校准",
          "desc": "每组现算 min/max。"
        },
        {
          "icon": "✨",
          "title": "有边界",
          "desc": "MQA 模型需 4bit。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "接案到调阅：端到端流水线",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "前面分别讲了方向、量化、残差和系统。这一章把它们串成 prefill 建库、decode 增量归档的完整流水线。",
      "analogy": {
        "title": "接案到调阅",
        "text": "一条流水线走完，<b>不用重做</b>。",
        "componentId": "kv-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "prefill / decode",
          "desc": "点击流程节点，理解两个阶段各自做什么、缓存里保留什么。",
          "componentId": "m8-pipeline"
        }
      ],
      "insight": "KIVI 是“建库 + 增量归档”：prefill 只留量化缓存，decode 把新 token 放进残差，满了再转 2bit；查询时旧卷与桌面两段合并。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "prefill 建库",
          "desc": "只留量化缓存。"
        },
        {
          "icon": "🔧",
          "title": "decode 增量",
          "desc": "新 token 先进残差。"
        },
        {
          "icon": "✨",
          "title": "两段注意力",
          "desc": "旧卷 + 桌面。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "选胶片：2bit/4bit、组大小、MQA",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "2bit 不是所有模型都能直接上。这一章比较 2bit/4bit、组大小与 MQA 模型，并给出与 SmoothQuant、FlexGen 的定位差异。",
      "analogy": {
        "title": "选胶片",
        "text": "不是越省越好，<b>按案卷选</b>。",
        "componentId": "kv-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "配置选型",
          "desc": "切换 2bit/4bit 与组大小，比较 GSM8K 与压缩率。",
          "componentId": "m9-config"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "方法对比",
          "desc": "点击路线，比较 SmoothQuant、FlexGen、KIVI 的 KV 压缩能力。",
          "componentId": "m9-compare"
        }
      ],
      "insight": "Llama/Mistral 可用 2bit；Falcon 只有一个 KV head，2bit 掉点多，建议 4bit；组大小 32/64 稳，128 会掉。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "2bit 有前提",
          "desc": "Llama/Mistral 可用。"
        },
        {
          "icon": "🔧",
          "title": "MQA 用 4bit",
          "desc": "Falcon 只有一个 KV head。"
        },
        {
          "icon": "✨",
          "title": "组大小 32/64",
          "desc": "128 会掉点。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "两家档案室比一比：结果、速度与局限",
      "badge": "both",
      "badgeLabel": "深入原理",
      "bridge": "机制讲完，最后把精度、显存、吞吐放到同一把尺子上比较，并说清 KIVI 的适用边界。",
      "analogy": {
        "title": "两家比一比",
        "text": "一家<b>又快又清楚</b>，一家省空间但会糊。",
        "componentId": "kv-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "结果对照",
          "desc": "按下开始，让各方案在同一坐标上赛跑，并切换精度／显存／吞吐三个指标。",
          "componentId": "m10-race"
        }
      ],
      "insight": "KIVI 在 Llama/Mistral 上 2bit 几乎无损，显存省 2.6×、吞吐 2.35-3.47×；但 Falcon 需 4bit，2bit 仍可能掉约 2%，量化开销未完全融合。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "2bit 几乎无损",
          "desc": "Llama-2-7B 63.05 vs 63.88。"
        },
        {
          "icon": "🔧",
          "title": "显存省 2.6×",
          "desc": "峰值含权重。"
        },
        {
          "icon": "✨",
          "title": "吞吐 2.35-3.47×",
          "desc": "长上下文更明显。"
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
      "views": "65858播放"
    },
    {
      "bvid": "BV1Ds4h66EE7",
      "title": "大模型写一个字，为什么不用把前面十万行重算一遍？KV Cache 到 MLA、DSA、KDA、CSA2 全梳理",
      "reason": "从 KV Cache 梳理到 MLA/DSA，补足长上下文与缓存结构背景（§1/§8）。",
      "cover": "https://i0.hdslb.com/bfs/archive/e50c280820bc686d50a08f432ee2e1e201cad5e3.jpg",
      "views": "9730播放"
    },
    {
      "bvid": "BV17m411f7Cm",
      "title": "大模型量化一网打尽（一）理论基础",
      "reason": "量化理论基础，对应 §4/§9 的零点、缩放与位宽。",
      "cover": "https://i2.hdslb.com/bfs/archive/358b87ff40846f2922064033b3bb858af8c65ac5.jpg",
      "views": "31519播放"
    },
    {
      "bvid": "BV1UAGXz5Eze",
      "title": "KV Cache Offloading方案加速大模型推理",
      "reason": "KV Cache Offloading，补足“显存瓶颈”与系统侧优化（§1/§9）。",
      "cover": "https://i1.hdslb.com/bfs/archive/43e40589018ad5934602704d2ea435851ee47d18.jpg",
      "views": "1652播放"
    }
  ]
};
