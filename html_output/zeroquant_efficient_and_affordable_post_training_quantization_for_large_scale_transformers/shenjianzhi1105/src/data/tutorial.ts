import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "ZeroQuant: Efficient and Affordable Post-Training Quantization for Large-Scale Transformers",
    "titleZh": "ZeroQuant：面向大规模 Transformer 的高效低成本训练后量化",
    "venue": "NeurIPS 2022 · arXiv:2206.01861",
    "authors": "Zhewei Yao, Reza Yazdani Aminabadi, Minjia Zhang, Xiaoxia Wu, Conglong Li, Yuxiong He",
    "affiliation": "Microsoft",
    "domain": "大语言模型 / 训练后量化 / 推理系统",
    "coreProblem": "大模型部署受显存与算力限制；INT8 量化中激活量化最伤精度，静态范围无法覆盖逐 token 差异；INT4 需要昂贵蒸馏。",
    "coreInsight": "分组权重 + 逐 token 动态激活 + 低成本逐层蒸馏 LKD + 融合后端：INT8 零成本无损，W4/8 显存省 3×，最高 5.19×/5.2× 加速。",
    "keywords": [
      "后训练量化",
      "分组量化",
      "逐 token 量化",
      "逐层蒸馏",
      "推理加速"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "一把尺子量所有人：单一缩放、静态激活范围，衣服不合身；朴素 INT8 掉点，INT4 又要昂贵重训练。",
      "componentId": "zq-hero-old"
    },
    "newMethod": {
      "desc": "分组纸样 + 逐人量体 + 师傅改衣：分组权重、逐 token 动态激活、LKD，INT8 几乎无损、W4/8 省 3× 显存。",
      "componentId": "zq-hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "一把尺子量所有人：为什么需要 ZeroQuant",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "大模型部署先卡在显存和算力上。这一章用一家裁缝店的开局——一把尺子量所有人、衣服全不合身——带出 ZeroQuant 要解决的三件事。",
      "analogy": {
        "title": "一把尺子量所有人",
        "text": "一把尺子量所有人，<b>衣服全不合身</b>。量化也一样：一个范围覆盖不了所有 token。",
        "componentId": "zq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "仓库与交期",
          "desc": "拖动显存预算，看 FP16、INT8、W4/8 分别能否放下 20B 模型，理解 3× 显存节省。",
          "componentId": "m1-budget"
        }
      ],
      "insight": "低比特首先决定“能不能放下”，其次才决定“掉不掉点”；ZeroQuant 用分组权重、逐 token 激活、LKD 与融合后端同时解决两者。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "部署很贵",
          "desc": "20B 的 FP16 约 40GB，INT8 约 20GB，W4/8 约 13GB。"
        },
        {
          "icon": "🔧",
          "title": "三件套",
          "desc": "分组权重 + 逐 token 激活 + LKD/后端。"
        },
        {
          "icon": "✨",
          "title": "目标是零成本",
          "desc": "INT8 不重训练也要几乎无损。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "逐人量体：逐 token 激活范围",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "衣服不合身，往往是因为只用了一张尺码表。这一章看同一层里不同 token 的激活范围差多大，以及静态范围为什么压扁小 token。",
      "analogy": {
        "title": "逐人量体",
        "text": "每个人的<b>范围不同</b>，一张固定尺码表不够。",
        "componentId": "zq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "顾客与刻度",
          "desc": "拖动检查线扫过 token，看到范围差异，理解静态缩放的误差来源。",
          "componentId": "m2-token"
        }
      ],
      "insight": "误差不是均匀的：范围小的 token 被全局最大范围压扁，受害最重；这就是激活量化掉点的主因。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "范围差很大",
          "desc": "同一层约 35 vs 8。"
        },
        {
          "icon": "🔧",
          "title": "静态范围会压扁小 token",
          "desc": "大部分量化档位被浪费。"
        },
        {
          "icon": "✨",
          "title": "要逐 token",
          "desc": "每个 token 用自己的 min/max。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "分组打纸样：分组权重量化",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "顾客要逐人量，布料也不能整批一个纸样。这一章讲分组权重量化：按组切分、每组一个缩放，并用消融看它救回多少精度。",
      "analogy": {
        "title": "分组打纸样",
        "text": "整批一个纸样太粗，<b>按组打</b>才合身。",
        "componentId": "zq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "组数与精度",
          "desc": "切换分组数，观察精度恢复与硬件开销的权衡。",
          "componentId": "m3-group"
        }
      ],
      "insight": "权重行之间范围差约 10×；分组给每组一个缩放，能把 W4/8 从“随机”救回可用，但组数越多系统开销越大。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "行间差 10×",
          "desc": "整矩阵一个缩放不够。"
        },
        {
          "icon": "🔧",
          "title": "分组救精度",
          "desc": "1 组 35.85 → 分组约 81。"
        },
        {
          "icon": "✨",
          "title": "组数有讲究",
          "desc": "BERT 48/64，GPT 64/128。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "量体与裁剪的数学",
      "badge": "both",
      "badgeLabel": "深入原理",
      "bridge": "直觉需要落成可计算的步骤。这一章把“量体”和“裁剪”写成对称量化：缩放、取整、截断，再说明权重静态、激活动态、分组各一个缩放。",
      "analogy": {
        "title": "先算再剪",
        "text": "量体、定尺、下剪，<b>三步</b>都要准。",
        "componentId": "zq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "量化三步",
          "desc": "分步展示对称量化、静态权重缩放、逐 token 动态缩放与分组。",
          "componentId": "m4-quant"
        }
      ],
      "insight": "量化的三件事是缩放、取整、截断；粒度决定误差——权重按组、激活按 token，是 ZeroQuant 精度与硬件效率的平衡点。",
      "formula": {
        "lead": "对称均匀量化先除以缩放因子，四舍五入，再截断到 b 位能表示的范围；权重用固定的最大绝对值，激活每个 token 现算。",
        "unicode": "x_q = round( clamp( x / S, −2^{b−1}, 2^{b−1}−1 ) )",
        "symbols": [
          {
            "sym": "x",
            "desc": "浮点输入。"
          },
          {
            "sym": "S",
            "desc": "缩放因子；权重取 max|x|，激活逐 token 取 max|x|。"
          },
          {
            "sym": "b",
            "desc": "位宽（8 或 4）。"
          },
          {
            "sym": "clamp",
            "desc": "截断到 b 位有符号整数范围。"
          },
          {
            "sym": "x_q",
            "desc": "量化后的整数。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "三步",
          "desc": "缩放、取整、截断。"
        },
        {
          "icon": "🔧",
          "title": "权重静态",
          "desc": "S = max|x|，离线算好。"
        },
        {
          "icon": "✨",
          "title": "激活动态",
          "desc": "每个 token 现算 S。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "一起试穿：动态激活量化",
      "badge": "both",
      "badgeLabel": "深入原理",
      "bridge": "既然每个 token 范围不同，就现场量体。这一章对比静态与动态激活量化，并解释为什么动态版可以“零成本”。",
      "analogy": {
        "title": "现场量体",
        "text": "旧尺码表<b>对不上</b>，现场量才合身。",
        "componentId": "zq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "静态 vs 动态",
          "desc": "切换静态/动态激活量化，比较掉点与是否需要校准。",
          "componentId": "m5-dynamic"
        }
      ],
      "insight": "激活量化的关键不是位宽，而是范围是否跟着 token 走；动态量化把 GPT-3-350M 的 Wikitext-2 PPL 从 26.2 拉回 21.7，且免校准。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "静态会掉点",
          "desc": "平均 37.8、PPL 26.2。"
        },
        {
          "icon": "🔧",
          "title": "动态拉回来",
          "desc": "38.7 / 21.7，接近 FP16。"
        },
        {
          "icon": "✨",
          "title": "免校准",
          "desc": "不需要激活范围校准。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "工作台：量体、裁剪、缝纫一次完成",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "精度方案再好，如果量化/反量化的数据搬运太贵，也不会变快。这一章看 ZeroQuant 如何用算子融合把收益落到真实延迟上。",
      "analogy": {
        "title": "合成一条工作台",
        "text": "来回搬布料<b>最费时间</b>；合成一条台子才快。",
        "componentId": "zq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "融合流程",
          "desc": "点击流程节点，理解量化融合、INT8 GEMM、epilogue 反量化与 CUDA Graph 各自解决什么。",
          "componentId": "m6-kernel"
        }
      ],
      "insight": "低比特不会自动变快：量化融合进前一算子、反量化融合进 GEMM epilogue、小模型用 CUDA Graph，才有 2-5× 的真实加速。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "搬运是敌人",
          "desc": "量化/反量化会读写显存。"
        },
        {
          "icon": "🔧",
          "title": "融合三处",
          "desc": "前一算子、GEMM epilogue、CUDA Graph。"
        },
        {
          "icon": "✨",
          "title": "才有加速",
          "desc": "BERT 最高 5.19×。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "师傅带徒弟：LKD",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "W4/8 直接量化会崩，需要有人纠正。这一章讲逐层知识蒸馏：师傅（原层）只改当前这一件，不用标签，也不一定要原始数据。",
      "analogy": {
        "title": "师傅带徒弟",
        "text": "只改<b>当前这一件</b>，师傅当场纠正。",
        "componentId": "zq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "无 LKD vs LKD",
          "desc": "对比不加蒸馏与加 LKD 的精度/PPL，理解 W4/8 的恢复幅度。",
          "componentId": "m7-lkd"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "数据来源",
          "desc": "切换 LKD 使用的数据，理解“没有原始训练数据也能做”。",
          "componentId": "m7-data"
        }
      ],
      "insight": "LKD 只保留当前层、只优化当前层，成本约为预训练的 0.02%-0.03%；没有原始数据时，Wikipedia 甚至随机数据也能显著恢复。",
      "formula": {
        "lead": "对第 k 层，把前 k−1 层的同一份输出分别送进原层和量化层，让两者的输出尽量接近。",
        "unicode": "L_LKD,k = MSE( L_k·L_{k−1}·…·L_1(X) − L̂_k·L_{k−1}·…·L_1(X) )",
        "symbols": [
          {
            "sym": "L_k",
            "desc": "第 k 层原层（老师）。"
          },
          {
            "sym": "L̂_k",
            "desc": "第 k 层量化层（学生）。"
          },
          {
            "sym": "X",
            "desc": "可访问的数据输入。"
          },
          {
            "sym": "MSE",
            "desc": "均方误差，也可换成 KL。"
          },
          {
            "sym": "L_1…L_{k−1}",
            "desc": "共享前缀，只保留一份。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "逐层改",
          "desc": "只优化当前层，内存只要一层。"
        },
        {
          "icon": "🔧",
          "title": "不用标签",
          "desc": "目标只是输出一致。"
        },
        {
          "icon": "✨",
          "title": "数据可替代",
          "desc": "Wikipedia 接近原始数据。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "从接单到交衣：端到端流水线",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "前面分别讲了量化、蒸馏、后端。这一章把它们串成一条可执行流水线：读取/量化 → （W4/8 时）LKD → 融合内核 → 部署。",
      "analogy": {
        "title": "接单到交衣",
        "text": "一条流水线走完，<b>不用回炉重做</b>。",
        "componentId": "zq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "端到端流水线",
          "desc": "点击流程节点，理解每步的输入输出与何时需要 LKD。",
          "componentId": "m8-pipeline"
        }
      ],
      "insight": "INT8 是零成本路径，跳过 LKD 即可；W4/8 才需要逐层蒸馏。把量化、蒸馏、融合内核排成流水线，才是 ZeroQuant 的完整形态。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "先量化",
          "desc": "分组权重 + 逐 token 激活。"
        },
        {
          "icon": "🔧",
          "title": "再蒸馏",
          "desc": "只在 W4/8 需要。"
        },
        {
          "icon": "✨",
          "title": "最后部署",
          "desc": "融合内核跑 INT8。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "换料子、换分店：精度与边界",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "能跑不等于该用。这一章比较 INT8、W4/8、W4/8+注意力 FP16，以及 QAT/PTQ/ZeroQuant 三条路线，给出选型边界。",
      "analogy": {
        "title": "换料子",
        "text": "不同订单用<b>不同料子</b>，不是越省越好。",
        "componentId": "zq-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "精度选型",
          "desc": "切换 INT8 / W4/8 / W4/8+注意力 FP16，比较精度与显存。",
          "componentId": "m9-precision"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "三条路线",
          "desc": "点击路线，比较 QAT、普通 PTQ、ZeroQuant 的精度与成本。",
          "componentId": "m9-compare"
        }
      ],
      "insight": "INT8 是首选；W4/8 省 3× 显存但要 LKD，且只是 FC 权重 INT4；20B 上注意力输入激活要留 FP16。ZeroQuant 的定位是“QAT 的精度、PTQ 的成本”。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "INT8 首选",
          "desc": "零成本、几乎无损。"
        },
        {
          "icon": "🔧",
          "title": "W4/8 要 LKD",
          "desc": "且只是 FC 权重 INT4。"
        },
        {
          "icon": "✨",
          "title": "20B 留一手",
          "desc": "注意力输入激活留 FP16。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "两家店比一比：结果、速度与局限",
      "badge": "both",
      "badgeLabel": "深入原理",
      "bridge": "机制讲完，最后把精度、显存、延迟放到同一把尺子上比较，并说清 ZeroQuant 的边界。",
      "analogy": {
        "title": "两家店比一比",
        "text": "一家只快不合身，一家<b>又合身又快</b>。",
        "componentId": "zq-analogy"
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
      "insight": "ZeroQuant 在 BERT/GPT 上做到 INT8 几乎无损、最高 5.19× 加速；W4/8 + LKD 省 3× 显存；但只验证到 20B、只做 NLP，20B 注意力输入仍需 FP16。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "INT8 几乎无损",
          "desc": "BERT 83.75 vs 83.95。"
        },
        {
          "icon": "🔧",
          "title": "最高 5.19×",
          "desc": "BERT 延迟；GPT 约 4.1×。"
        },
        {
          "icon": "✨",
          "title": "边界要记住",
          "desc": "只到 20B、只做 NLP。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1NU9wY4ENo",
      "title": "【大模型部署】8bit量化算子解析（已完结！）",
      "reason": "8bit 量化算子解析，直接对应 §4.3/§6 的融合与反量化。",
      "cover": "https://i0.hdslb.com/bfs/archive/c6dae2d7b4a6f080d3e30e56e40755c449d4683e.jpg",
      "views": "12889播放"
    },
    {
      "bvid": "BV17m411f7Cm",
      "title": "大模型量化一网打尽（一）理论基础",
      "reason": "量化理论基础，覆盖 §3/§4 的范围与缩放问题。",
      "cover": "https://i2.hdslb.com/bfs/archive/358b87ff40846f2922064033b3bb858af8c65ac5.jpg",
      "views": "31396播放"
    },
    {
      "bvid": "BV1FH4y1c73W",
      "title": "[LLMs inference] quantization 量化整体介绍（bitsandbytes、GPTQ、GGUF、AWQ）",
      "reason": "量化方法整体介绍，对应 §9 的方法定位。",
      "cover": "https://i2.hdslb.com/bfs/archive/819cd669ab7121121a8ebe9cea707d0ca22a5c7f.jpg",
      "views": "13558播放"
    },
    {
      "bvid": "BV1euPkerEun",
      "title": "【13】GPTQ、AWQ、GGUF等模型量化概念讲解",
      "reason": "量化概念与选型，补充 §9 的工程视角。",
      "cover": "https://i0.hdslb.com/bfs/archive/f826010fd169fdc2c19a5572d09dcd81a6d305c7.jpg",
      "views": "27341播放"
    }
  ]
};
