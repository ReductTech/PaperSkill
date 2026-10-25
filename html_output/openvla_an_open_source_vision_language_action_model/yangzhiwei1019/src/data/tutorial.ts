import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "OpenVLA: An Open-Source Vision-Language-Action Model",
    "titleZh": "OpenVLA：一个开源的视觉-语言-动作模型",
    "venue": "CoRL 2024",
    "authors": "Moo Jin Kim, Karl Pertsch, Siddharth Karamcheti, Ted Xiao 等 18 人",
    "affiliation": "Stanford · UC Berkeley · Toyota Research Institute · Google DeepMind · Physical Intelligence · MIT",
    "domain": "机器人操作 / 视觉-语言-动作模型",
    "coreProblem": "最强的通用 VLA 大多闭源，且几乎没有工作研究如何把 VLA 高效微调到新的机器人设置。",
    "coreInsight": "用一个 <b>7B</b> 的开源 VLA，在 <b>970k</b> 条真实机器人示教上把「看图 + 听话 → 出动作」写成下一 token 预测：跨本体开箱可用，还能用 LoRA 与 4-bit 量化在消费级显卡上跑。",
    "keywords": [
      "VLA",
      "机器人操作",
      "动作离散化",
      "LoRA",
      "量化",
      "开源"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "只认一种木料的刨子：换个场景就跳刀起毛，参数再大也补不回缺失的先验。",
      "componentId": "ov2-hero"
    },
    "newMethod": {
      "desc": "先看图读口令，再一刨一刨贴住墨线：同一把刨子换料也能干活。",
      "componentId": "ov2-hero"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "换一种木料就刨不动",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "先看清旧办法到底卡在哪：不是参数不够，而是模型没有可迁移的先验，换一种木料就整类失效。",
      "analogy": {
        "title": "乱纹跳刀",
        "text": "顺纹一推就平；木纹一乱，同一把刨子立刻跳刀起毛。<b>手艺没变，木料变了。</b>",
        "componentId": "ov2-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "17 个任务，逐项看原始次数",
          "desc": "拖动滑块在 BridgeData V2 的 17 个任务间移动。柱高是该任务 10 次试跑里的<b>成功次数</b>（部分任务允许 0.5 的部分成功），全部取自论文 Table 4，不做任何平均。",
          "componentId": "ov2-ch1-tasks"
        }
      ],
      "insight": "差距不是均匀的：视觉与语义泛化上几乎全员失败，语言定位上两个 VLA 都在 7.5 次以上——这说明缺的是「见过的世界」，不是训练时长。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "瓶颈是泛化",
          "desc": "在没见过的背景、物体、指令上，从零训练的通用策略会整类失效，而不是均匀掉几个点。"
        },
        {
          "icon": "🔧",
          "title": "闭源挡住了改造",
          "desc": "最强的通用 VLA 不开放权重与训练流程，研究者既无法复现，也无法研究怎么微调。"
        },
        {
          "icon": "✨",
          "title": "把控制写成语言任务",
          "desc": "本文的核心动作：把「看图 + 听话 → 出动作」写成一段下一 token 预测，让语言模型直接承担控制。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "图纸与口令",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "上一章说缺的是先验。先验从哪进来？从图像与指令拼成的那段前缀进来，所以先看模型到底「看见」了什么。",
      "analogy": {
        "title": "把图纸摊平",
        "text": "图纸歪着放，后面每一刨都会偏；<b>摊平对齐</b>，口令才有落点。",
        "componentId": "ov2-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "换一只眼睛试试",
          "desc": "同一块木板、同一条墨线，只换视觉编码器的组合。看定位框是糊成一片，还是能卡在边上。",
          "componentId": "ov2-ch2-encoder"
        }
      ],
      "insight": "机器人要的不只是「这是什么」，还有「边在哪、差几毫米」——所以本文没有沿用单一语义编码器。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两路特征各补一半",
          "desc": "SigLIP 给语义，DINOv2 给精确空间位置；按通道拼接后一起送进投影器。"
        },
        {
          "icon": "🔧",
          "title": "投影器负责搬家",
          "desc": "两层 MLP 把视觉特征搬进 Llama 的嵌入空间，图像 token 与指令 token 才能拼成同一段前缀。"
        },
        {
          "icon": "✨",
          "title": "视觉必须一起微调",
          "desc": "论文消融显示，冻结视觉会把微调成功率从 69.7% 压到 47.0%，位置精度得为目标场景重新适配。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "把推力切成 256 档",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "图纸和口令都进了前缀，可语言模型只会吐 token——连续的推力怎么变成 token？这一步是整个方法的铰链。",
      "analogy": {
        "title": "落进一格",
        "text": "连续进刀量说不出口，落进固定档位就能<b>一个词一个词</b>地说出来。",
        "componentId": "ov2-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "一个异常动作能毁掉多少分辨率",
          "desc": "同一批示教里混进一个离谱的动作。对比两种定标方式，看常用区间还剩几档可用。",
          "componentId": "ov2-ch3-binning"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "一次动作就是七个档位",
          "desc": "拖动木板上的黄色手柄，七个动作维度同时落到各自那一档；顶到边界就表达不出来了。",
          "componentId": "ov2-ch3-drag"
        }
      ],
      "insight": "动作一旦变成离散 token，就能直接复用语言模型的下一词预测，不需要另造一个动作头网络——这也是「动作头藏在词表里」的由来。",
      "formula": {
        "lead": "每一维动作按训练数据的 1% 与 99% 分位数映射到 0–255，而不是按最小最大值。",
        "unicode": "z_d = round( 255 × (a_d − q1) / (q99 − q1) )",
        "symbols": [
          {
            "sym": "a_d",
            "desc": "第 d 维的连续动作值，例如末端在 x 方向的位移，单位由机器人控制器决定。"
          },
          {
            "sym": "q1",
            "desc": "该维动作在训练数据里的 1% 分位数，用来挡住极小的离群值。"
          },
          {
            "sym": "q99",
            "desc": "该维动作的 99% 分位数；与 q1 共同定出箱宽，离群动作不会把区间撑大。"
          },
          {
            "sym": "z_d",
            "desc": "离散后的档位，取 0–255 的整数，随后被当作一个 token 送进词表。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "离散化是唯一的桥",
          "desc": "语言模型只认 token，连续控制必须先落到有限档位，才能写进下一词预测。"
        },
        {
          "icon": "🔧",
          "title": "分位数比 min-max 抗脏",
          "desc": "一个离群动作就能让 min-max 的有效档位从 256 掉到十几个；分位数把它挡在区间外。"
        },
        {
          "icon": "✨",
          "title": "七维就是七个 token",
          "desc": "末端平移、姿态与夹爪各占一维，每维 256 档，一次动作共 7 个 token。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "四个训练决定",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "有了 token 序列，还得决定怎么练。这一章的四项决定都由实验定出来，和训练 VLM 的直觉并不一样。",
      "analogy": {
        "title": "只量这七刀",
        "text": "图纸念得对不对没人管，只拿直尺量<b>刨出来的那七刀</b>贴不贴线。",
        "componentId": "ov2-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "逐条对照：常规做法 vs 本文选择",
          "desc": "用「上一条 / 下一条」走完四项决定，每项都给出论文的实测依据。",
          "componentId": "ov2-ch4-decisions"
        }
      ],
      "insight": "VLA 不能照搬 VLM 的训练直觉：常规做法是「一两个 epoch、冻结视觉」，这两条在这里都行不通。",
      "formula": {
        "lead": "损失只在七个动作 token 上求和，前缀 token 不参与。",
        "unicode": "L = − Σ_t log p( a_t | 图像, 指令, a_(t−1) ),  t = 1…7",
        "symbols": [
          {
            "sym": "L",
            "desc": "这一条样本的交叉熵损失，只累加动作 token 的负对数概率。"
          },
          {
            "sym": "a_t",
            "desc": "第 t 个动作 token，即第 t 维动作离散后的档位；七个 token 依次条件依赖。"
          },
          {
            "sym": "Σ_t",
            "desc": "对 t = 1…7 求和，也就是七维动作逐位累加，前缀 token 不进入求和。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "27 个 epoch",
          "desc": "动作 token 准确率要超过 95%，真实机器人性能才停止上升；常规 VLM 的一两个 epoch 远远不够。"
        },
        {
          "icon": "🔧",
          "title": "固定 2e-5、不做 warmup",
          "desc": "扫了多个数量级后，与预训练一致的固定学习率最好；最终 64×A100 训练 14 天（21,500 A100-hours）。"
        },
        {
          "icon": "✨",
          "title": "224 就够、视觉要解冻",
          "desc": "224 与 384 在本文实验中无差异而后者慢 3 倍；冻结视觉则把成功率打到 47.0%。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "一刨接一刨",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "训练让模型学会「下一档该是什么」，真正控制时却要把七个档位一个一个吐出来。这一章看一次控制周期。",
      "analogy": {
        "title": "连推三刨",
        "text": "没有一次刨到底，只有<b>一刀接一刀</b>，每一刀都基于上一刀的结果。",
        "componentId": "ov2-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "七个 token 的顺序解码",
          "desc": "点「下一个 token」，看七维动作怎么一档一档凑齐；七个没出完之前，机器人不会动。",
          "componentId": "ov2-ch5-decode"
        }
      ],
      "insight": "自回归在这里不是写文章，而是把一次动作拆成七个有先后依赖的档位——前面的档位会成为后面的上下文。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "先平移，再姿态，最后夹爪",
          "desc": "解码顺序固定为 Δx、Δy、Δz、Δroll、Δpitch、Δyaw、夹爪，前面几位是后面几位的条件。"
        },
        {
          "icon": "🔧",
          "title": "七位齐了才下发",
          "desc": "七位出完才会下发这一刨；论文给出的实测是 bf16 精度、单张 4090 上约 6Hz。"
        },
        {
          "icon": "✨",
          "title": "约 6Hz 的现实约束",
          "desc": "bf16 下需 15GB 显存，单张 RTX 4090 约 6Hz；这对 50Hz 的高频控制远远不够。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "三件套装成一把刨子",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "前面每一步都在局部打转：看什么、变成什么 token、惩罚谁。把零件装到一起，才知道为什么缺一件都不行。",
      "analogy": {
        "title": "装成一把",
        "text": "刨刀、压铁、刨身单看都能用，<b>装错顺序就刨不动</b>。",
        "componentId": "ov2-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "点开每个零件",
          "desc": "点选结构图上的编号，看这一段的输入输出是什么、为什么不能省。",
          "componentId": "ov2-ch6-arch"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "换一根主轴试试",
          "desc": "同样两块相似木料，只换视觉语言主干。看目标框会不会落到错的那一块上。",
          "componentId": "ov2-ch6-backbone"
        }
      ],
      "insight": "动作头不是额外网络：它就是词表里被借走的 256 个 token，所以三件套之间只靠一段文本序列连接。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "顺序固定",
          "desc": "先双路编码，再按通道拼接，再经两层 MLP 投影，最后与指令一起进 Llama 2。"
        },
        {
          "icon": "🔧",
          "title": "动作头藏在词表里",
          "desc": "Llama 分词器只留 100 个特殊 token，不够 256 档，于是直接覆盖词表末尾最少使用的 256 个。"
        },
        {
          "icon": "✨",
          "title": "主轴影响语言定位",
          "desc": "换主干不只是换参数量：IDEFICS-1 → LLaVA 提升 35 个百分点，Prismatic 再高约 10 个。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "省钱的两条路",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "全参数微调要 8 张 A100。想在自己的卡上跑，只有两条路：少训参数，或少占显存。两者用的是两套不同的评测协议。",
      "analogy": {
        "title": "换一片薄刃",
        "text": "不换整台刨子，只换一片薄刃；<b>刀还是那把刀</b>，活儿照样干。",
        "componentId": "ov2-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "微调方案：省参数",
          "desc": "六种方案，同一套 33 次试跑（Table 1）。看成功率与可训练参数一起怎么变。",
          "componentId": "ov2-ch7-peft"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "量化推理：省显存",
          "desc": "三种精度，8 个 Bridge 任务共 80 次试跑（Table 2）。看成功率、显存与实测吞吐。",
          "componentId": "ov2-ch7-quant"
        }
      ],
      "insight": "开源的价值不只在权重：LoRA 用 1.4% 的参数基本追平全参数微调（68.2% 对 69.7%），4-bit 把显存砍到 7GB 还不掉点——但这两组数字来自不同协议，不能混着比。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "LoRA 最划算",
          "desc": "r=32 只训 97.6M（1.4%）参数即达 68.2%，接近全参数 69.7%；单卡 A100 10–15 小时，约 8 倍算力下降。"
        },
        {
          "icon": "🔧",
          "title": "4-bit 不掉点",
          "desc": "71.9% 与 bf16 的 71.3% 相当，显存从 16.8GB 降到 7.0GB；8-bit 反而掉到 58.1%，原因是推理降到 1.2Hz。"
        },
        {
          "icon": "✨",
          "title": "两套协议别混比",
          "desc": "Table 1 是 Franka-Tabletop 的 33 次微调试跑，Table 2 是 Bridge 8 任务 80 次推理试跑，数字不可横向相减。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "验收与边界",
      "badge": "both",
      "badgeLabel": "综合",
      "bridge": "零件装好、成本算清，最后一步是把木板翻过来量：同一套初始状态下它到底赢多少，以及它明确做不到什么。",
      "analogy": {
        "title": "合上墨线",
        "text": "刨面贴不贴线，<b>一量就知道</b>；不同木料的验收标准并不一样。",
        "componentId": "ov2-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "两种验收台",
          "desc": "先选验收台，再让四个策略从同一基线起跑。两套数据不能混着比，协议写在反馈里。",
          "componentId": "ov2-ch8-race"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "四条边界",
          "desc": "切换作者自述的四条局限，每条都有一个具体的受限场景。",
          "componentId": "ov2-ch8-limits"
        }
      ],
      "insight": "领先是相对的，边界是绝对的：70.6% 对 50.6% 只在同一套 170 次试跑里成立，而 6Hz 与单图输入是模型本身的硬约束。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "赢在跨本体泛化",
          "desc": "Bridge 17 任务上 70.6% 对 50.6%，同协议下高 20 个百分点，而参数只有它的约 1/8（7B vs 55B）。"
        },
        {
          "icon": "🔧",
          "title": "Google 上打平",
          "desc": "85.0% 对 78.3%，差距 6.7 个百分点但误差条重叠，论文自己认定为性能相当；语义泛化则是 RT-2-X 更强。"
        },
        {
          "icon": "✨",
          "title": "四条边界",
          "desc": "只吃单张图、没有历史与本体感知、6Hz 撑不起 50Hz、成功率普遍不到 90%——这些都来自作者自述。"
        }
      ]
    }
  ]
};
