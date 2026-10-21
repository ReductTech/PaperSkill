import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration",
    "titleZh": "AWQ：面向大语言模型压缩与加速的激活感知权重量化",
    "venue": "MLSys 2024（最佳论文奖）· arXiv:2306.00978",
    "authors": "Ji Lin, Jiaming Tang, Haotian Tang, Shang Yang, Wei-Ming Chen, Wei-Chen Wang, Guangxuan Xiao, Xingyu Dang, Chuang Gan, Song Han",
    "affiliation": "MIT · 上海交通大学 · NVIDIA · 清华大学",
    "domain": "大语言模型 / 权重量化 / 高效推理",
    "coreProblem": "大模型 FP16 权重巨大、端侧装不下，生成阶段又受限于访存；低比特权重量化在训练后量化下掉点严重。",
    "coreInsight": "用激活分布找出约 1% 的显著通道，再用逐通道等价缩放保护它们；配合 TinyChat 把内存节省变成 3× 以上实测加速。",
    "keywords": [
      "大模型量化",
      "激活感知",
      "显著权重",
      "端侧推理"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "FP16 权重太大：GPT-3 175B 约 350GB、7B 约 14GB，端侧设备装不下。",
      "componentId": "awq-hero-old"
    },
    "newMethod": {
      "desc": "AWQ 只量化权重到 INT4，模型约小 4×，并保护约 1% 显著通道，精度几乎无损。",
      "componentId": "awq-hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "装不下的模型与访存瓶颈",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "先看清真实约束：模型太大装不下，生成阶段又受限于访存。这一章用一台排满的录音台，让你亲手感受内存与带宽的极限。",
      "analogy": {
        "title": "台面排满了",
        "text": "想再推上一条轨道，台面已经<b>排不下</b>。模型也一样：FP16 权重<b>装不进设备</b>。",
        "componentId": "awq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "内存预算",
          "desc": "拖动可用内存，看 GPT-3 175B、7B FP16 与 7B INT4 能否放下，以及 4-bit 如何把它塞进端侧。",
          "componentId": "m1-budget"
        }
      ],
      "insight": "低比特量化是端侧部署的前提；而端侧生成阶段是访存瓶颈，量化权重最有效。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "装不下是常态",
          "desc": "GPT-3 175B 的 FP16 权重约 350GB，远超端侧设备。"
        },
        {
          "icon": "🔧",
          "title": "瓶颈在访存",
          "desc": "端侧生成阶段算术强度约 1，权重读取占主导。"
        },
        {
          "icon": "✨",
          "title": "本文三步走",
          "desc": "找显著通道、等价缩放保护、分组量化，再由 TinyChat 兑现加速。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "不是所有通道都一样重要",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "既然要保护，就得先知道保护谁。这一章比较两种「重要性」标准，看看判断依据应该听谁的。",
      "analogy": {
        "title": "一轨一轨地听",
        "text": "哪条轨道重要，要<b>听观众听到的音量</b>，而不是看谱子写得多满。",
        "componentId": "awq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "看激活还是看权重",
          "desc": "拖动参考位置，在「按权重」和「按激活」之间切换，看两种标准选出的是不是同一批通道。",
          "componentId": "m2-reference"
        }
      ],
      "insight": "判断「重要」要看激活幅值，而不是权重幅值——这是 AWQ 的 activation-awareness。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "通道不等价",
          "desc": "只有约 0.1%–1% 的通道对性能特别关键。"
        },
        {
          "icon": "🔧",
          "title": "看激活不看权重",
          "desc": "按权重幅值判断重要性，效果接近随机。"
        },
        {
          "icon": "✨",
          "title": "特征才是关键",
          "desc": "吃到大幅值输入的通道，处理的是更重要的特征。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "保护 1% 显著通道",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "上一章确认了判断依据。这一章用数据看：只保护一小撮通道，量化后的表现能好多少，以及为什么还需要别的方案。",
      "analogy": {
        "title": "挂上保护牌",
        "text": "给很少几条关键轨道挂上<b>保护牌</b>，整体音质就稳住了。",
        "componentId": "awq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "保护比例与依据",
          "desc": "切换「依据」（激活／权重／随机）与「比例」（0.1%／1%／3%），对比 OPT-6.7B 的困惑度。",
          "componentId": "m3-skip"
        }
      ],
      "insight": "保护 0.1%–1% 的显著通道就能显著改善量化；但把少量权重留成 FP16 的混合精度对硬件不友好。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "保护 1% 就够",
          "desc": "0.1%–1% 的显著通道能显著改善量化表现。"
        },
        {
          "icon": "🔧",
          "title": "依据必须是激活",
          "desc": "按权重或随机选择几乎没有效果。"
        },
        {
          "icon": "✨",
          "title": "但混合精度不友好",
          "desc": "硬件难以高效支持 FP16 与低比特混排，需要等价变换。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "量化与误差：更小的格子",
      "badge": "both",
      "badgeLabel": "深入原理",
      "bridge": "在讲保护之前，先弄清量化误差从哪来。这一章把连续的权重录到有限个档位上，看清位宽与误差的关系。",
      "analogy": {
        "title": "吸附到档位",
        "text": "连续的旋钮，录到磁带上只剩<b>有限的几个档位</b>。",
        "componentId": "awq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "位宽与格子",
          "desc": "拖动位宽 N，观察格距 Δ、最大舍入误差与量化点的变化。",
          "componentId": "m4-quant"
        }
      ],
      "insight": "位宽决定格距 Δ，格距决定误差；低比特必然带来更大的舍入误差，需要想办法保护重要权重。",
      "formula": {
        "lead": "量化把每个权重四舍五入到最近的格点，格距由组内最大权重决定。",
        "unicode": "Q(w) = Δ · Round(w / Δ) ,  Δ = max(|w|) / 2^(N−1)",
        "symbols": [
          {
            "sym": "Q(w)",
            "desc": "量化后的权重。"
          },
          {
            "sym": "w",
            "desc": "组内某个权重（FP16）。"
          },
          {
            "sym": "Δ",
            "desc": "量化格距（scaler），由组内最大绝对值决定。"
          },
          {
            "sym": "N",
            "desc": "量化位数。"
          },
          {
            "sym": "Round(·)",
            "desc": "四舍五入到最近整数。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "量化=上格点",
          "desc": "Q(w)=Δ·Round(w/Δ)，格距 Δ 由组内最大权重决定。"
        },
        {
          "icon": "🔧",
          "title": "位宽决定格距",
          "desc": "位数越少，Δ 越大、误差越大。"
        },
        {
          "icon": "✨",
          "title": "端侧常用 4/3 位",
          "desc": "分组大小 128 是论文的主要设置。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "激活感知缩放：等价地放大重要通道",
      "badge": "both",
      "badgeLabel": "深入原理",
      "bridge": "混合精度又贵又难实现。这一章给出 AWQ 的核心：用一次等价变换，把显著通道「放大保护」，而不需要混合精度。",
      "analogy": {
        "title": "推高再补回来",
        "text": "把关键轨道<b>推高</b>、把监听<b>压低同样的量</b>，听到的还是一样。",
        "componentId": "awq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "推高显著通道",
          "desc": "拖动缩放 s，观察显著通道误差下降，但 s 过大会让非显著通道失真。",
          "componentId": "m5-scale"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "等价变换三步",
          "desc": "分步展示「放大权重、反向缩放激活、输出不变」的完整等价过程。",
          "componentId": "m5-equivalent"
        }
      ],
      "insight": "权重乘 s、激活除 s，输出完全等价，却让显著权重的相对量化误差变小——这就是 AWQ 保护显著通道的方式。",
      "formula": {
        "lead": "把显著权重放大 s 倍、激活缩小 s 倍，输出等价；缩放后的误差比约为 (Δ′/Δ)·(1/s)。",
        "unicode": "Q(w·s)·(x/s) = Δ′ · Round(w·s/Δ′) · x · (1/s) ， 误差比 ≈ (Δ′/Δ)·(1/s)",
        "symbols": [
          {
            "sym": "s",
            "desc": "逐通道缩放因子，s>1 时保护显著通道。"
          },
          {
            "sym": "w·s",
            "desc": "放大后的显著权重。"
          },
          {
            "sym": "x/s",
            "desc": "反向缩放后的激活。"
          },
          {
            "sym": "Δ′",
            "desc": "缩放后的量化格距，通常约等于 Δ。"
          },
          {
            "sym": "Round(·)",
            "desc": "舍入误差约 0.25，缩放后基本不变。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "等价变换",
          "desc": "权重乘 s、激活除 s，输出不变。"
        },
        {
          "icon": "🔧",
          "title": "误差变小",
          "desc": "显著权重的相对误差比约为 (Δ′/Δ) 除以 s。"
        },
        {
          "icon": "✨",
          "title": "过犹不及",
          "desc": "s 太大会抬高非显著通道误差，最佳常在 s≈2。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "搜索最优缩放 α",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "知道要缩放，还得知道缩放多少。这一章用一个参数 α 控制缩放强度，用网格搜索找到误差最小的一档。",
      "analogy": {
        "title": "一档一档地试",
        "text": "不用复杂的反馈回路，只要<b>试几档增益</b>，挑最稳的那一档。",
        "componentId": "awq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "网格搜索 α",
          "desc": "分步走一遍网格搜索，看到误差曲线在中间某个 α 处最小。",
          "componentId": "m6-search"
        }
      ],
      "insight": "单个 α 控制缩放强度，20 档网格即可稳定找到最优点；不需要反向传播，也不做过拟合校准集的回归。",
      "formula": {
        "lead": "AWQ 把逐通道缩放写成一个幂次：缩放强度由单个 α 控制，用网格搜索挑误差最小的 α。",
        "unicode": "s = s_X^α ,  α* = argmin_α L( s_X^α )",
        "symbols": [
          {
            "sym": "s_X",
            "desc": "逐通道的平均激活幅值，来自校准集。"
          },
          {
            "sym": "α",
            "desc": "缩放指数，取 [0,1]；0 不缩放、1 最激进。"
          },
          {
            "sym": "L(·)",
            "desc": "量化后层输出与原始输出的误差目标。"
          },
          {
            "sym": "argmin_α",
            "desc": "在网格上取误差最小的 α。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "单参数搜索",
          "desc": "用 α 控制缩放强度，网格跑一遍即可。"
        },
        {
          "icon": "🔧",
          "title": "不需要反向传播",
          "desc": "量化不可微、近似梯度不稳，网格搜索更稳。"
        },
        {
          "icon": "✨",
          "title": "还配权重裁剪",
          "desc": "缩放之外再做裁剪，进一步降均方误差。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "校准数据与泛化",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "搜索需要少量校准数据。这一章看 AWQ 为什么数据省，而且换个分布也不会明显掉点。",
      "analogy": {
        "title": "少量参考就够",
        "text": "只用<b>少量参考录音</b>校准；换个曲风，也不该失真。",
        "componentId": "awq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "换分布校准",
          "desc": "对比 AWQ 与 GPTQ 在「校准分布与评测分布不一致」时的困惑度增幅。",
          "componentId": "m7-calib"
        }
      ],
      "insight": "只统计激活的平均幅值，所以 AWQ 数据高效、不过拟合校准集，能保住大模型的通用能力。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "数据更省",
          "desc": "AWQ 校准只需 16 条序列，GPTQ 要 192 条。"
        },
        {
          "icon": "🔧",
          "title": "抗分布漂移",
          "desc": "跨分布校准 AWQ 只涨 0.5–0.6，GPTQ 差 2.3–4.9。"
        },
        {
          "icon": "✨",
          "title": "保住通用能力",
          "desc": "不过拟合校准集，指令模型与多模态模型也能受益。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "TinyChat：把省下的内存变成速度",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "省了内存不等于更快。这一章看 TinyChat 如何用系统优化，把 4-bit 的内存优势兑现成实测速度。",
      "analogy": {
        "title": "一次合并",
        "text": "多轨<b>一次合并</b>进小磁带，省掉来回搬运。",
        "componentId": "awq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "TinyChat 流水线",
          "desc": "点击系统各组件，理解每个优化减少了哪类开销，并切换「优化开关」看整体开销下降。",
          "componentId": "m8-tinychat"
        }
      ],
      "insight": "即时反量化、SIMD 权重打包和算子融合，才把 W4A16 的理论内存节省变成实测加速。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "需要系统",
          "desc": "W4A16 的即时反量化必须融进计算主循环。"
        },
        {
          "icon": "🔧",
          "title": "打包与融合",
          "desc": "SIMD 打包与算子融合降低指令和内核启动开销。"
        },
        {
          "icon": "✨",
          "title": "才能兑现",
          "desc": "最终相对 HuggingFace FP16 平均提速 3.2–3.3 倍。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "极端低比特与平台覆盖",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "到 INT2 会更难，也需要更多硬件覆盖。这一章看方法的适用边界，以及它在不同设备上的落地。",
      "analogy": {
        "title": "再压一档",
        "text": "把磁带<b>再压一档</b>，换到更小的设备上也能放。",
        "componentId": "awq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "更小磁带",
          "desc": "切换 FP16／INT3-g128（AWQ）／INT2-g64（AWQ+GPTQ），看 OPT-6.7B 的困惑度。",
          "componentId": "m9-bits"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "换设备播放",
          "desc": "点击 A100／4090／Orin／4070／树莓派，看同一 4-bit 模型在不同硬件上的吞吐。",
          "componentId": "m9-platform"
        }
      ],
      "insight": "极端低比特要靠方法组合（AWQ 与 GPTQ 正交）；同一 AWQ 模型也能从数据中心一路部署到树莓派。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "INT2 要靠组合",
          "desc": "RTN 在 INT2 基本失效，AWQ+GPTQ 仍可用。"
        },
        {
          "icon": "🔧",
          "title": "与 GPTQ 正交",
          "desc": "两种方法叠加可进一步降低困惑度。"
        },
        {
          "icon": "✨",
          "title": "跨平台",
          "desc": "从 A100 到树莓派 4B 都能部署。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、速度与局限",
      "badge": "both",
      "badgeLabel": "深入原理",
      "bridge": "前面讲的是机制，这一章把各方法放到同一坐标上比较，并说清适用条件与边界。",
      "analogy": {
        "title": "上秤比一比",
        "text": "一盘又大又慢，一盘又小又快，内容还一样。",
        "componentId": "awq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "结果对照",
          "desc": "按下开始，让各方法在同一坐标上赛跑，并切换困惑度／多模态／速度三个指标。",
          "componentId": "m10-race"
        }
      ],
      "insight": "INT4 几乎无损、INT3 优于 GPTQ；但 AWQ 只量化权重，收益集中在访存受限的生成阶段，极端低比特要组合方法。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "精度几乎无损",
          "desc": "INT4 接近 FP16，INT3 也优于 RTN 与 GPTQ。"
        },
        {
          "icon": "🔧",
          "title": "端侧真加速",
          "desc": "相对 HF FP16 平均 3.2–3.3 倍，最高 3.9 倍。"
        },
        {
          "icon": "✨",
          "title": "认清边界",
          "desc": "只量化权重（W4A16）；INT2 需与 GPTQ 组合。"
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
      "bvid": "BV1FH4y1c73W",
      "title": "[LLMs inference] quantization 量化整体介绍（bitsandbytes、GPTQ、GGUF、AWQ）",
      "reason": "LLM 推理量化整体介绍（含 AWQ），偏工程实现。",
      "cover": "https://i2.hdslb.com/bfs/archive/819cd669ab7121121a8ebe9cea707d0ca22a5c7f.jpg",
      "views": "1.3万播放"
    },
    {
      "bvid": "BV1cfpbeiExd",
      "title": "大模型量化之 AWQ",
      "reason": "专题讲解 AWQ；播放量较低但主题直接对应。",
      "cover": "https://i0.hdslb.com/bfs/archive/70cd2c2c2118a49a9b530fc968ab28df3db95aaf.jpg",
      "views": "628播放"
    },
    {
      "bvid": "BV1AZpJeLERZ",
      "title": "AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration",
      "reason": "以本论文标题为题的讲解视频；播放量低但主题完全对应。",
      "cover": "https://i2.hdslb.com/bfs/archive/fa1e0fb8467f75e2cbd749bd1fb88abb4a370c78.jpg",
      "views": "261播放"
    }
  ]
};
