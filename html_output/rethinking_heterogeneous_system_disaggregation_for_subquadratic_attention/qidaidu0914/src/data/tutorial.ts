import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Rethinking Heterogeneous System Disaggregation for Subquadratic Attention",
    "titleZh": "重新思考面向次二次注意力的异构系统解耦",
    "venue": "arXiv preprint 2026",
    "authors": "Arya Tschand, Yaosheng Fu, Vikram Sharma Mailthody, Nicolai Oswald, Po-An Tsai, Ritchie Zhao, Oreste Villa, Vijay Janapa Reddi, Karu Sankaralingam",
    "affiliation": "Harvard University, NVIDIA",
    "domain": "LLM 推理系统 / 异构算力 / 注意力机制",
    "coreProblem": "长上下文解码在 GPU 上受内存带宽与静态功耗约束；传统按算子类型的解耦把随上下文增长的二次注意力与固定状态工作混在同一位置，难以同时获得低时延和高能效。",
    "coreInsight": "SQD 按解码阶段的算术强度与内存占用重新划分边界：二次注意力与 prefill 留在持有 KV 的 GPU，次二次注意力与 FFN 放到 SRAM-only 加速器，并用 top-k 缓存和重叠传输隐藏跨池通信。",
    "keywords": [
      "次二次注意力",
      "异构系统解耦",
      "长上下文推理",
      "SRAM-only ASIC",
      "Top-k 缓存"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "GPU-only 或 attention-FFN 解耦让上下文相关状态与固定状态争用同一侧资源，并频繁等待跨池通信。",
      "componentId": "sqd-analogy"
    },
    "newMethod": {
      "desc": "SQD 把会随上下文增长的工作留在 KV 所在 GPU，把固定状态工作放到 SRAM-only 加速器，并按层组隐藏通信。",
      "componentId": "sqd-analogy"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "长上下文解码为何被拖慢",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "<b>本章作用：</b>先让读者亲手把上下文拉长，看到统一 GPU 上的资源错配，再引出重新划分系统的需要。",
      "analogy": {
        "title": "越长的路，越重的行囊",
        "text": "上下文变长时，<b>二次注意力</b>的行囊持续加重；GPU 必须不断搬运它，时间和能耗同时上升。",
        "componentId": "sqd-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "上下文负载压力测试",
          "desc": "拖动上下文长度，观察传统 GPU-only 解码为什么从带宽受限滑向高能耗。",
          "componentId": "sqd-module"
        }
      ],
      "insight": "真正增长的只有二次状态；把固定状态留在同一个大设备上，会让低时延解码付出不必要的带宽与功耗。",
      "formula": {
        "lead": "判断瓶颈，先看一次解码需要搬运多少字节。",
        "unicode": "AI = FLOPs / Off&#8209;chip&nbsp;bytes",
        "symbols": [
          {
            "sym": "AI",
            "desc": "算术强度，每搬运一字节可执行的计算量。"
          },
          {
            "sym": "FLOPs",
            "desc": "一步解码中的浮点运算量。"
          },
          {
            "sym": "Off-chip bytes",
            "desc": "必须从片外读取的权重与状态字节。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎒",
          "title": "负载会增长",
          "desc": "上下文越长，二次注意力需要读取的状态越多。"
        },
        {
          "icon": "⚡",
          "title": "算术单元常闲置",
          "desc": "GPU 在低 batch 解码中等待内存，却仍付出静态功耗。"
        },
        {
          "icon": "🧭",
          "title": "先改边界",
          "desc": "SQD 的起点是重新决定哪些工作留在 GPU。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "一次解码的四类搬运",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "<b>本章作用：</b>把“解码”拆成可单独判断的四个阶段，为后续放置与缓存策略建立共同语言。",
      "analogy": {
        "title": "四种挡位，不是同一种力",
        "text": "四种挡位对齿比、耐力和载重的要求不同；<b>解码阶段</b>也一样，不能用一个放置策略覆盖。",
        "componentId": "sqd-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "四阶段传动台",
          "desc": "逐步查看每个阶段的 AI、footprint 与是否随上下文增长。",
          "componentId": "sqd-module"
        }
      ],
      "insight": "prefill 与 FFN 喜欢大设备，解码中的二次状态会在小设备上超载；阶段拆分是放置决策的前提。",
      "formula": {
        "lead": "阶段状态是否增长，比它属于 attention 还是 FFN 更重要。",
        "unicode": "Footprint<sub>quadratic</sub> ∝ C&nbsp;&nbsp;·&nbsp;&nbsp;Footprint<sub>subquadratic</sub> = O(1)",
        "symbols": [
          {
            "sym": "C",
            "desc": "上下文长度。"
          },
          {
            "sym": "O(1)",
            "desc": "不随上下文长度增长的固定状态。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🚴",
          "title": "Prefill 计算密集",
          "desc": "大 prompt 可平摊权重读取。"
        },
        {
          "icon": "🧱",
          "title": "二次状态增长",
          "desc": "它决定 KV 与扫描必须留在何处。"
        },
        {
          "icon": "📦",
          "title": "固定状态可放置",
          "desc": "次二次注意力与 FFN 可按容量规划。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "边界不在算子名称",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "<b>本章作用：</b>解释为什么 attention-FFN 的粗粒度切分不足以覆盖稀疏注意力，并引出模型特定边界。",
      "analogy": {
        "title": "同一座山，三条路",
        "text": "GLM、Nemotron 与 Gemma4 的坡道不同；<b>切分点</b>必须落在状态开始增长的位置。",
        "componentId": "sqd-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "模型边界切换器",
          "desc": "切换三种前沿模型，观察 quadratic 与 subquadratic 层如何分布。",
          "componentId": "sqd-module"
        }
      ],
      "insight": "稀疏模型需要在 attention 算子内部切分：全 KV 的 indexer 留在 GPU，固定大小的 top-k attention 可以去 ASIC。",
      "formula": {
        "lead": "把边界写在状态增长项上，而不是写在模块名称上。",
        "unicode": "quadratic ⇔ read&nbsp;state(C)&nbsp;&nbsp;·&nbsp;&nbsp;subquadratic ⇔ read&nbsp;state(O(1))",
        "symbols": [
          {
            "sym": "state(C)",
            "desc": "随上下文长度增长的状态。"
          },
          {
            "sym": "state(O(1))",
            "desc": "与上下文长度无关的固定状态。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🪶",
          "title": "GLM 切在算子内",
          "desc": "indexer 与 top-k attention 分居两侧。"
        },
        {
          "icon": "🧱",
          "title": "Nemotron 切在层之间",
          "desc": "dense 层与 recurrent 层分开。"
        },
        {
          "icon": "🪟",
          "title": "Gemma4 切在窗口上",
          "desc": "dense 层与 sliding-window 层分开。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "用算术强度做放置决策",
      "badge": "both",
      "badgeLabel": "系统",
      "bridge": "<b>本章作用：</b>把“搬多少字节”转化为可操作的放置判断，解释为什么解码阶段更适合较低的带宽计算比。",
      "analogy": {
        "title": "齿比要匹配坡度",
        "text": "陡坡用过重齿比会拖慢骑手；<b>解码阶段</b>在不匹配的岭点上也会被带宽和静态功耗拖住。",
        "componentId": "sqd-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "岭点工作点拖动",
          "desc": "拖动工作点，观察它相对 GPU 与 SRAM-only 设备岭点的位置。",
          "componentId": "sqd-module"
        }
      ],
      "insight": "选择不是“GPU 更强”，而是让工作点靠近执行设备的计算/带宽比。",
      "formula": {
        "lead": "岭点把内存受限与计算受限分开。",
        "unicode": "Ridge = Peak&nbsp;FLOPs / Memory&nbsp;Bandwidth",
        "symbols": [
          {
            "sym": "Peak FLOPs",
            "desc": "设备可达到的峰值浮点吞吐。"
          },
          {
            "sym": "Memory Bandwidth",
            "desc": "设备可持续读取的字节速率。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📐",
          "title": "先算强度",
          "desc": "阶段属性用 FLOP/byte 统一比较。"
        },
        {
          "icon": "⛰️",
          "title": "再对岭点",
          "desc": "同一工作点在不同设备上含义不同。"
        },
        {
          "icon": "🔀",
          "title": "按匹配放置",
          "desc": "内存受限阶段靠近低岭点设备。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "容量决定哪些工作能搬走",
      "badge": "both",
      "badgeLabel": "系统",
      "bridge": "<b>本章作用：</b>对比标准 PD、attention-FFN 和 SQD 的放置方案，展示容量成本与通信次数的权衡。",
      "analogy": {
        "title": "工具包放在哪里",
        "text": "工具放在车架和背包的位置不同，重心与取用次数就不同；<b>固定状态工作</b>也需要重新选择驻留侧。",
        "componentId": "sqd-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "三种放置方案的同步比较",
          "desc": "同条件启动 standard PD、attention-FFN 与 SQD，比较驻留增长和跨池次数。",
          "componentId": "sqd-module"
        }
      ],
      "insight": "SQD 不是免费移动所有工作；它把固定状态工作移走，但必须支付容量增长并依赖二次与次二次注意力边界。",
      "formula": {
        "lead": "工程约束，不是论文中的原始等式：解耦可用性的第一约束是容量。",
        "unicode": "Capacity<sub>ASIC</sub> ≥ Resident<sub>static</sub> + WorkingSet<sub>cache</sub>",
        "symbols": [
          {
            "sym": "Resident static",
            "desc": "权重和固定状态驻留量。"
          },
          {
            "sym": "WorkingSet cache",
            "desc": "top-k 缓存与选中 KV 工作集。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📏",
          "title": "容量先过关",
          "desc": "SRAM-only 侧必须能装下固定状态。"
        },
        {
          "icon": "🔁",
          "title": "通信次数下降",
          "desc": "只在二次层跨界而不是每层跨界。"
        },
        {
          "icon": "🧮",
          "title": "按模型核算",
          "desc": "GLM、Nemotron、Gemma4 的驻留增长差异很大。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "SQD 如何让 GPU 与 ASIC 同时工作",
      "badge": "both",
      "badgeLabel": "系统",
      "bridge": "<b>本章作用：</b>从静态放置推进到执行时间线，解释为什么一步成本接近两个池的最大值而不是总和。",
      "analogy": {
        "title": "滑行时准备下一个弯",
        "text": "骑手不是停下等换挡，而是在滑行时完成准备；<b>通信</b>也可以被后续层计算覆盖。",
        "componentId": "sqd-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "SQD 执行路线",
          "desc": "步进查看 prefill、GPU 二次注意力、ASIC 次二次注意力与跨池传输的相互关系。",
          "componentId": "sqd-module"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "通信覆盖时间线",
          "desc": "拖动缓存大小，观察残余 miss 是否落入 offset 的 slack 预算；曲线为结构示意，阈值与预算来自论文。",
          "componentId": "sqd-module"
        }
      ],
      "insight": "真正决定吞吐的不是跨池带宽，而是暴露在关键路径上的残余 miss。",
      "formula": {
        "lead": "共置与重叠后，步骤时间从求和变为最大项加残余通信。",
        "unicode": "t<sub>step</sub> ≈ max(t<sub>decode</sub>, t<sub>prefill</sub>) + t<sub>exposed</sub>",
        "symbols": [
          {
            "sym": "t_decode",
            "desc": "GPU 侧解码阶段时间。"
          },
          {
            "sym": "t_prefill",
            "desc": "一个 chunk 的 prefill 时间。"
          },
          {
            "sym": "t_exposed",
            "desc": "无法被覆盖的通信时间。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧵",
          "title": "两个池并行",
          "desc": "GPU 与 ASIC 可以同时处理不同工作。"
        },
        {
          "icon": "⏱️",
          "title": "只暴露残余",
          "desc": "大部分通信要藏在后续层计算中。"
        },
        {
          "icon": "🎯",
          "title": "按 deadline 缓存",
          "desc": "缓存大小由预算与 p99 miss 共同决定。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "让 top-k 选择住进小缓存",
      "badge": "trn",
      "badgeLabel": "训练/系统",
      "bridge": "<b>本章作用：</b>解释 SQD 如何把“每次都读全 KV”转化为可预测的 miss 与 prefetch。",
      "analogy": {
        "title": "把常走路段记在身体里",
        "text": "重复出现的路段不需要每次查地图；<b>top-k 位置</b>也可以在连续解码步骤中复用。",
        "componentId": "sqd-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "缓存大小与命中率曲线",
          "desc": "拖动 selected-KV 缓存大小，观察命中率是否跨过通信所需的阈值；曲线为结构示意，required hit rate 与 slack 来自论文。",
          "componentId": "sqd-module"
        }
      ],
      "insight": "选择局部性把随机通信变成了可预取的固定集合，这才使小 SRAM 侧执行 top-k attention 成为可能。",
      "formula": {
        "lead": "命中率必须让残余 miss 落进可用 slack。",
        "unicode": "η ≥ 1 − slack · p / (B · k · e)",
        "symbols": [
          {
            "sym": "η",
            "desc": "所需缓存命中率。"
          },
          {
            "sym": "slack",
            "desc": "可覆盖通信的时间窗口。"
          },
          {
            "sym": "p",
            "desc": "跨池读取带宽。"
          },
          {
            "sym": "B",
            "desc": "batch。"
          },
          {
            "sym": "k",
            "desc": "每 token 选择的条目数。"
          },
          {
            "sym": "e",
            "desc": "每个 entry 的字节数。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧠",
          "title": "局部性存在",
          "desc": "连续步骤会重复选择相近位置。"
        },
        {
          "icon": "♻️",
          "title": "IndexShare 复用",
          "desc": "一次选择可服务多个层。"
        },
        {
          "icon": "📊",
          "title": "按阈值定容量",
          "desc": "缓存目标是隐藏 miss，不是装满内存。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "SQD 的系统结构",
      "badge": "trn",
      "badgeLabel": "训练/系统",
      "bridge": "<b>本章作用：</b>把前几章的放置、缓存和通信结论合成一个可点击的简化系统结构。",
      "analogy": {
        "title": "调紧一条传动链",
        "text": "链条松散时动力会丢在空转中；<b>跨池链路</b>也需要稳定地把 GPU 与 ASIC 连接起来。",
        "componentId": "sqd-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "SQD 交互结构图",
          "desc": "点击部件查看它在 SQD 中的角色、数据形态与放置依据。",
          "componentId": "sqd-module"
        }
      ],
      "insight": "SQD 的结构图不是“GPU + 加速器”的简单拼接，而是一组有状态的路径：KV 留在 GPU，selected-KV 留在 ASIC。",
      "formula": {
        "lead": "工程示意，不是论文原始公式：结构选择回答每个状态放在哪里。",
        "unicode": "KV → GPU&nbsp;&nbsp;·&nbsp;&nbsp;SelectedKV + FFN → ASIC",
        "symbols": [
          {
            "sym": "KV",
            "desc": "随上下文增长的完整键值状态。"
          },
          {
            "sym": "SelectedKV",
            "desc": "top-k 选中的固定大小 KV 集合。"
          },
          {
            "sym": "FFN",
            "desc": "静态权重的全连接或 MoE 工作。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧩",
          "title": "按状态切分",
          "desc": "KV 与 selected-KV 不放在一起。"
        },
        {
          "icon": "🖱️",
          "title": "结构可操作",
          "desc": "点击节点才能看清实际数据流。"
        },
        {
          "icon": "📡",
          "title": "链路是血管",
          "desc": "延迟和带宽共同决定跨界成本。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "低延迟链路与容量上限",
      "badge": "trn",
      "badgeLabel": "训练/系统",
      "bridge": "<b>本章作用：</b>把实现细节与系统级取舍连起来，说明什么时候增加带宽有用，什么时候应优先降低延迟。",
      "analogy": {
        "title": "过弯前先收好装备",
        "text": "真正的等待发生在动作太晚；<b>one-sided put</b> 与图捕获把晚到的通信提前安排。",
        "componentId": "sqd-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "延迟、带宽与成本扫线",
          "desc": "分别调整延迟与带宽，观察吞吐和每 token 互连成本的响应。",
          "componentId": "sqd-module"
        }
      ],
      "insight": "SRAM-only 系统的边界由容量和暴露通信共同决定，而不是单纯由带宽决定。",
      "formula": {
        "lead": "论文的链路 sweep 给出的是方向性结论，不是拟合等式。",
        "unicode": "L<sub>cross</sub> ↑ ⇒ Throughput ↓；带宽 ↑ 的收益有限",
        "symbols": [
          {
            "sym": "L_cross",
            "desc": "一次跨池通信的端到端延迟；论文显示它比额外带宽更影响吞吐。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "⏳",
          "title": "延迟优先",
          "desc": "跨池等待直接占用关键路径。"
        },
        {
          "icon": "🔗",
          "title": "带宽是次级项",
          "desc": "传输小批次激活，额外带宽利用不足。"
        },
        {
          "icon": "🏗️",
          "title": "容量决定规模",
          "desc": "SRAM 只应买到静态驻留真正需要的点。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、边界与下一步",
      "badge": "both",
      "badgeLabel": "结果",
      "bridge": "<b>本章作用：</b>用可追溯的指标比较 SQD、no-disagg、standard PD 与 attention-FFN，并把限制写清楚。",
      "analogy": {
        "title": "同一赛道上的终点比较",
        "text": "不同起跑线不能证明优势；<b>相同功率、相同指标</b>下的终点才可比较。",
        "componentId": "sqd-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "指标结果赛",
          "desc": "选择模型后，比较 SQD 相对 no-disaggregation 与 attention-FFN 的 tokens/J；功率使用实测代理值，TPS 使用投影区间。",
          "componentId": "sqd-module"
        }
      ],
      "insight": "SQD 的强点出现在中低延迟区与长上下文场景；在吞吐优先的大 batch 区间，GPU-only 基线仍可能更快。实测性能使用 dummy weights，真实权重只用于 top-k trace；Nemotron 与 Gemma4 的 1M 点超过 262144 位置服务配置；Rubin/LPX 的绝对结果来自分析模型。",
      "formula": {
        "lead": "能效指标把功率与吞吐放在一起看。",
        "unicode": "tokens/J = Throughput / System&nbsp;Power",
        "symbols": [
          {
            "sym": "Throughput",
            "desc": "单位时间生成的 token 数。"
          },
          {
            "sym": "System Power",
            "desc": "整套异构系统的功率。"
          },
          {
            "sym": "tokens/J",
            "desc": "每焦耳生成的 token 数，越高越好。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🔋",
          "title": "能效大幅提升",
          "desc": "三个模型上相对 no-disagg 为 31% 到 56%。"
        },
        {
          "icon": "🚦",
          "title": "低延迟区占优",
          "desc": "交互场景比大 batch 吞吐场景更适合 SQD。"
        },
        {
          "icon": "🧪",
          "title": "投影有边界",
          "desc": "实测用 dummy weights；Nemotron 与 Gemma4 的 1M 点为外推；Rubin/LPX 绝对值为分析模型投影。"
        }
      ]
    }
  ]
};
