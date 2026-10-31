import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "LLM.int8(): 8-bit Matrix Multiplication for Transformers at Scale",
    "titleZh": "LLM.int8()：面向大规模 Transformer 的 8 位矩阵乘法",
    "venue": "NeurIPS 2022 · arXiv:2208.07339",
    "authors": "Tim Dettmers, Mike Lewis, Younes Belkada, Luke Zettlemoyer",
    "affiliation": "华盛顿大学 · Meta AI · Hugging Face · ENS Paris-Saclay",
    "domain": "大语言模型 / 8 位量化 / 高效推理",
    "coreProblem": "大模型推理显存高；朴素 8 位量化在 6.7B 后因固定通道的极端离群特征而崩，且此前方法只研究到 3.5 亿参数。",
    "coreInsight": "向量级量化 + 混合精度分解：把约 0.1% 的离群特征维度单独用 16 位算，其余 99.9% 用 8 位，实现 175B 无损 8 位推理、显存约减半。",
    "keywords": [
      "8 位量化",
      "离群特征",
      "混合精度分解",
      "大模型推理"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "FP16 直接推理：显存占用大，175B 很难塞进小机器；朴素 8 位又会被离群值毁掉精度。",
      "componentId": "li-hero-old"
    },
    "newMethod": {
      "desc": "LLM.int8() 把离群维度单独用 16 位算，其余 99.9% 用 8 位：显存约减半、精度保持，175B 可上 8×3090。",
      "componentId": "li-hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "装不下的衣筐：为什么需要 8 位",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "先看清显存约束：175B 的 FP16 很难塞进小机器，而 FFN 与注意力投影层占了 95% 的参数。这一章用一筐装不下的衣服，带出 8 位量化的动机。",
      "analogy": {
        "title": "盆装不下",
        "text": "一大筐衣服塞进一个盆，<b>装不下</b>。模型也一样：<b>显存放不下</b>全部权重。",
        "componentId": "li-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "显存容量",
          "desc": "拖动显存容量，看 FP16 与 8 位的 175B 能否放下，以及 8 位能让多少设备装下。",
          "componentId": "m1-budget"
        }
      ],
      "insight": "8 位是让大模型上更小设备的前提；难点不在显存，而在低比特下的精度。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "显存是瓶颈",
          "desc": "175B 的 FP16 很大，8 位能减半。"
        },
        {
          "icon": "🔧",
          "title": "投影层占大头",
          "desc": "FFN 与注意力投影层占 95% 参数。"
        },
        {
          "icon": "✨",
          "title": "难点在精度",
          "desc": "朴素 8 位会在 6.7B 后崩。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "量洗衣液：量化与向量级缩放",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "要把衣服洗好，先得会量洗衣液。这一章讲 8 位量化的基本做法，以及「每格单独量」的向量级缩放。",
      "analogy": {
        "title": "每格单独量",
        "text": "整盆一个剂量太粗，<b>每格单独量</b>才准。",
        "componentId": "li-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "量化三步",
          "desc": "分步展示 absmax 量化、向量级缩放与反缩放。",
          "componentId": "m2-quant"
        }
      ],
      "insight": "缩放粒度越细越准；向量级量化为每个内积单独定缩放，能撑到 2.7B。",
      "formula": {
        "lead": "量化是把浮点按最大绝对值缩放后四舍五入；向量级量化给每一行/列单独的缩放，最后用外积反缩放。",
        "unicode": "X_i8 = round(127 · X / max|X|)；C ≈ S · A_i8 B_i8，S = 1/(c_x ⊗ c_w)",
        "symbols": [
          {
            "sym": "X_i8",
            "desc": "Int8 量化结果。"
          },
          {
            "sym": "max|X|",
            "desc": "张量最大绝对值。"
          },
          {
            "sym": "c_x / c_w",
            "desc": "行 / 列缩放常数。"
          },
          {
            "sym": "⊗",
            "desc": "外积。"
          },
          {
            "sym": "S",
            "desc": "反缩放矩阵。"
          },
          {
            "sym": "A_i8 / B_i8",
            "desc": "量化后的两个矩阵。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "量化先缩放",
          "desc": "absmax 用最大绝对值定步长。"
        },
        {
          "icon": "🔧",
          "title": "粒度越细越准",
          "desc": "每行/列一个缩放。"
        },
        {
          "icon": "✨",
          "title": "但只撑到 2.7B",
          "desc": "再大就会被离群值拖垮。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "几件超大件：离群特征",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "为什么 8 位会在 6.7B 后崩？这一章翻看衣筐，找到那几件固定出现、特别占地方的超大件。",
      "analogy": {
        "title": "几件超大件",
        "text": "筐里<b>几件超大件</b>特别占地方，而且每次都在。",
        "componentId": "li-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "特征直方图",
          "desc": "拖动检查线扫过特征维度，看少数维度幅值远超其他，理解它们为何毁掉一个全局缩放。",
          "componentId": "m3-outlier"
        }
      ],
      "insight": "问题不在所有值，而在少数固定维度的极端值：它们只占约 0.1%，却能撑爆全局量化范围。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "离群很极端",
          "desc": "幅值可达其他维度的 20×。"
        },
        {
          "icon": "🔧",
          "title": "又少又固定",
          "desc": "约 0.1%，集中在少数维度。"
        },
        {
          "icon": "✨",
          "title": "却很重要",
          "desc": "去掉它们性能会崩。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "换大盆也没用：向量级量化的极限",
      "badge": "both",
      "badgeLabel": "深入原理",
      "bridge": "第一种武器是更细的缩放。这一章看它在模型变大时为什么失效：离群值在特征维度上，换更大的盆也装不下。",
      "analogy": {
        "title": "换大盆也没用",
        "text": "盆再大，<b>超大件</b>还是露在外面。",
        "componentId": "li-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "模型规模 vs 困惑度",
          "desc": "拖动模型规模，看 vector-wise 的困惑度在 6.7B 后如何恶化。",
          "componentId": "m4-scale"
        }
      ],
      "insight": "行/列缩放救不了列上的离群值；2.7B 后 vector-wise 开始掉点，必须显式处理离群维度。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "行缩放救不了列",
          "desc": "离群在特征维度上。"
        },
        {
          "icon": "🔧",
          "title": "2.7B 是分水岭",
          "desc": "再大 vector-wise 开始掉。"
        },
        {
          "icon": "✨",
          "title": "需要新武器",
          "desc": "显式处理离群维度。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "挑出来单独洗：混合精度分解",
      "badge": "both",
      "badgeLabel": "深入原理",
      "bridge": "既然盆够大也压不住离群值，就把它挑出来单独处理。这一章给出 LLM.int8() 的核心：把极少数的离群维度用 16 位算，其余 99.9% 仍用 8 位。",
      "analogy": {
        "title": "挑出来单独洗",
        "text": "超过<b>尺寸线</b>的大件挑到小盆，其余留在主盆。",
        "componentId": "li-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "阈值 α",
          "desc": "调节离群阈值，观察被挑出的维度数与精度/额外内存的权衡。",
          "componentId": "m5-alpha"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "拖进轻柔盆",
          "desc": "把一件大件拖进或拖出轻柔盆，观察 16 位通路如何恢复该维度的精度。",
          "componentId": "m5-gentle"
        }
      ],
      "insight": "只把约 0.1% 的离群维度搬到 16 位通路，就能用极小代价换回精度；阈值 6.0 是甜点。",
      "formula": {
        "lead": "把特征维度分成离群集合 O 与其余，离群用 16 位、其余用 8 位，最后在 16 位相加。",
        "unicode": "C ≈ Σ_{h∈O} X_f16^h W_f16^h + S · Σ_{h∉O} X_i8^h W_i8^h",
        "symbols": [
          {
            "sym": "O",
            "desc": "幅值超过 α 的离群特征维度集合。"
          },
          {
            "sym": "X_f16^h / W_f16^h",
            "desc": "离群维度的 16 位激活 / 权重。"
          },
          {
            "sym": "X_i8^h / W_i8^h",
            "desc": "其余维度的 Int8 激活 / 权重。"
          },
          {
            "sym": "S",
            "desc": "Int8 通路的反缩放。"
          },
          {
            "sym": "α",
            "desc": "离群阈值，论文取 6.0。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "分开算",
          "desc": "离群 16 位、其余 8 位。"
        },
        {
          "icon": "🔧",
          "title": "代价很小",
          "desc": "离群维度 ≤7，额外内存约 0.1%。"
        },
        {
          "icon": "✨",
          "title": "阈值有甜点",
          "desc": "α=6.0 足够恢复精度。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "主盆标准洗：Int8 矩阵乘与显存",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "挑走大件后，主盆按标准程序洗。这一章看 8 位矩阵乘怎么算、省多少显存、什么时候真正变快。",
      "analogy": {
        "title": "主盆标准洗",
        "text": "大多数衣服按<b>标准程序</b>洗，省水省时。",
        "componentId": "li-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "三种精度通路",
          "desc": "切换 FP16 / 纯 Int8 / LLM.int8，比较显存与速度。",
          "componentId": "m6-precision"
        }
      ],
      "insight": "8 位既省显存也可能加速，但加速只在大模型的大矩阵乘时成立；小模型反而会被量化开销拖慢。",
      "formula": {
        "lead": "Int8 矩阵乘在 Int32 里累加，最后用缩放常数反缩放回 16 位。",
        "unicode": "C_f16 ≈ S_f16 · C_i32 ≈ S_f16 · Q(A_f16) Q(B_f16)",
        "symbols": [
          {
            "sym": "C_f16",
            "desc": "16 位输出。"
          },
          {
            "sym": "C_i32",
            "desc": "Int32 累加结果。"
          },
          {
            "sym": "S_f16",
            "desc": "反缩放常数（或外积）。"
          },
          {
            "sym": "Q(·)",
            "desc": "absmax / zeropoint 量化。"
          },
          {
            "sym": "A_f16 / B_f16",
            "desc": "两个输入矩阵。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "Int32 累加",
          "desc": "8 位乘、32 位加、再反缩放。"
        },
        {
          "icon": "🔧",
          "title": "显存约减半",
          "desc": "BLOOM-176B 降到 1/1.96。"
        },
        {
          "icon": "✨",
          "title": "大矩阵才快",
          "desc": "175B 约 1.81×，小模型反而慢。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "轻揉力度：训练/微调与分解比例",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "推理能无损，训练和微调也能吗？这一章看 8 位 FFN、注意力线性层与分解比例之间的取舍。",
      "analogy": {
        "title": "轻揉力度",
        "text": "娇贵衣物要<b>轻揉</b>；力度太大就搓坏。",
        "componentId": "li-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "推理 vs 微调",
          "desc": "对比推理与微调所需的分解比例，理解「2% 门槛」。",
          "componentId": "m7-decomp"
        }
      ],
      "insight": "8 位 FFN 训练/微调基本无损；但注意力线性层也压到 8 位时，至少 2% 的维度要用 16 位分解。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "推理最宽松",
          "desc": "0% 分解即可。"
        },
        {
          "icon": "🔧",
          "title": "微调要 2%",
          "desc": "注意力线性层需 16 位余量。"
        },
        {
          "icon": "✨",
          "title": "8 位注意力不行",
          "desc": "训练时注意力本身 8 位会严重掉点。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "分两盆同时洗：LLM.int8 系统流程",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "公式怎么落成系统？这一章把混合精度分解拆成可实现的四步：拆分、16 位乘、8 位乘、累加。",
      "analogy": {
        "title": "两盆一起洗",
        "text": "一个主盆、一个轻柔盆，<b>同时洗</b>，最后合在一起。",
        "componentId": "li-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "分解流程",
          "desc": "点击流程节点，理解每一步在做什么。",
          "componentId": "m8-flow"
        }
      ],
      "insight": "分解就是「按阈值拆分 → 两路矩阵乘 → 16 位累加」，实现简单、额外代价小。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "先拆",
          "desc": "按阈值分离群维度。"
        },
        {
          "icon": "🔧",
          "title": "两路算",
          "desc": "16 位 + 8 位。"
        },
        {
          "icon": "✨",
          "title": "再累加",
          "desc": "16 位相加得输出。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "换洗衣房：硬件、速度与相邻方法",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "方法能上什么机器、什么时候真的快、与相邻方法怎么分工？这一章给出工程边界。",
      "analogy": {
        "title": "换洗衣房",
        "text": "换个更小的洗衣房，<b>两盆照样放得下</b>。",
        "componentId": "li-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "硬件可及性",
          "desc": "切换硬件，看 8 位与 16 位分别能跑多大的模型。",
          "componentId": "m9-hardware"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "与相邻方法分工",
          "desc": "点击方法，理解 LLM.int8、SmoothQuant、GPTQ 的定位。",
          "componentId": "m9-methods"
        }
      ],
      "insight": "8 位最大的价值是让更大的模型装得下；速度只在大矩阵乘时提升；它与 SmoothQuant、GPTQ 互补而非互斥。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "更小的机器",
          "desc": "8×3090 可跑 175B。"
        },
        {
          "icon": "🔧",
          "title": "速度有边界",
          "desc": "只有大矩阵乘才快。"
        },
        {
          "icon": "✨",
          "title": "方法互补",
          "desc": "混合精度 / 纯 INT8 / 权重量化。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、速度与局限",
      "badge": "both",
      "badgeLabel": "深入原理",
      "bridge": "前面讲的是机制，这一章把各方案放到同一把尺子上比较，并说清边界。",
      "analogy": {
        "title": "两筐比一比",
        "text": "一筐用旧办法、一筐用<b>分盆法</b>，比洗净度和用水。",
        "componentId": "li-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "结果对照",
          "desc": "按下开始，让各方案在同一坐标上赛跑，并切换困惑度／显存／速度三个指标。",
          "componentId": "m10-race"
        }
      ],
      "insight": "LLM.int8() 让 125M–175B 保持 16 位精度、显存约减半；但加速只在大模型，注意力未量化，训练仍受限。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "无损 8 位",
          "desc": "125M–175B 保持 16 位精度。"
        },
        {
          "icon": "🔧",
          "title": "显存减半",
          "desc": "BLOOM-176B 降到 1/1.96。"
        },
        {
          "icon": "✨",
          "title": "认清边界",
          "desc": "速度只在大模型；注意力未量化；训练仍受限。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV17pwEzMETL",
      "title": "62．LLM.int8 是如何利用向量外积进行量化的？",
      "reason": "专题讲 LLM.int8 的向量级量化，直接对应 §3.1。",
      "cover": "https://i0.hdslb.com/bfs/archive/bb1307aedb2446058e6468366d5474ad36de6d03.jpg",
      "views": "1380播放"
    },
    {
      "bvid": "BV1BeoNB9EQP",
      "title": "[16] LLM.int8()：大模型量化论文解读",
      "reason": "按论文结构讲 LLM.int8()，适合先看整体。",
      "cover": "https://i0.hdslb.com/bfs/archive/f7bee354fda05de2dd5c30938d300acdde6de6ac.jpg",
      "views": "1336播放"
    },
    {
      "bvid": "BV1dofUByEw8",
      "title": "LLM.int8() 8 位量化-论文精读",
      "reason": "逐段精读论文；播放量低但主题完全对应。",
      "cover": "https://i0.hdslb.com/bfs/archive/d32543909e785bbd6ed1026fb1a7f2292a321383.jpg",
      "views": "246播放"
    },
    {
      "bvid": "BV1LkM86vE2f",
      "title": "int8、mxfp8、fp8 选哪个？CUDA 环境怎么选？真实测试报告",
      "reason": "8 位数据类型的工程对比，补充 8 位推理背景。",
      "cover": "https://i2.hdslb.com/bfs/archive/650c1a45d224369c1bef69465dd24db91402ecbe.jpg",
      "views": "8171播放"
    }
  ]
};
