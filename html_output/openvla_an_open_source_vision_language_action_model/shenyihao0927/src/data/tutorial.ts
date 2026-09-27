import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "OpenVLA: An Open-Source Vision-Language-Action Model",
    "titleZh": "OpenVLA：开源视觉-语言-动作模型",
    "venue": "arXiv 2406.09246 · 2024",
    "authors": "Moo Jin Kim*, Karl Pertsch*, Siddharth Karamcheti*, Ted Xiao, et al.",
    "affiliation": "Stanford · UC Berkeley · Toyota Research Institute · Google DeepMind",
    "domain": "具身智能 · 视觉语言模型 · 机器人操作",
    "coreProblem": "现有 VLA 闭源不可得、微调方法无人探索——社区拿不到也改不动。",
    "coreInsight": "把「闭源大厂 VLA」拆成<b>人人可组装的开源套件</b>：Llama 2 骨干 + SigLIP·DINOv2 双眼 + 970k 开放轨迹——<b>7B 参数反超 55B 闭源 16.5 个百分点</b>，还能用 1.4% 参数的 LoRA 和 4-bit 量化把它装进消费级显卡。",
    "keywords": [
      "开源",
      "VLA",
      "双视觉编码器",
      "LoRA",
      "量化"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "<b>闭源 VLA（RT-2-X，55B）</b>：只能整柜购买、不许拆改；连微调 API 都不开放。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "<b>OpenVLA（7B）</b>：Llama 2 + 双视觉编码器，OXE 970k 轨迹训练；以 1/7 参数反超 RT-2-X 16.5 个百分点——权重、代码、微调笔记本全部开源。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "上锁的黑箱柜",
      "badge": "inf",
      "badgeLabel": "人人必读",
      "bridge": "要懂 OpenVLA 的价值，先看清它针对的两堵墙：现有 VLA 闭源不可得、高效微调无人探索。这一节用两家店的对比，把「为什么必须开源」讲透，也为后面每一节的机制铺垫。",
      "analogy": {
        "title": "上锁的黑箱柜",
        "text": "名牌店的柜子只能整柜买、不许拆、更不许改——<b>连图纸都锁在保险柜里</b>。",
        "componentId": "ch1-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "双店检查台",
          "desc": "同一份「改装清单」逐项过检：<b>下载权重 / 改结构 / 微调新任务 / 消费级显卡跑</b>——左边闭源 VLA 店（RT-2-X），右边 OpenVLA 开源店，按下开始逐项亮判定。",
          "componentId": "ch1-access"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "开源三件套开箱",
          "desc": "「开源」到底开的是什么？点选三件套逐一开箱：<b>模型权重</b>（HuggingFace 一行代码下载）、<b>微调笔记本</b>（LoRA + 量化全流程，消费级显卡可跑）、<b>PyTorch 代码库</b>（OpenX 数据到多机集群全流程）。",
          "componentId": "ch1-trio"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两堵墙",
          "desc": "闭源不可得，微调无人探索"
        },
        {
          "icon": "🔧",
          "title": "RT-2-X 之锁",
          "desc": "连微调 API 都不对外开放"
        },
        {
          "icon": "✨",
          "title": "三件套开源",
          "desc": "权重+代码+微调笔记本"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "两把尺子看世界",
      "badge": "inf",
      "badgeLabel": "人人必读",
      "bridge": "问题明确之后，拆开 OpenVLA 的第一件套：眼睛。这一节看 Prismatic 双视觉编码器如何既认出「是什么」又量准「在哪里」，读数拼接后再经 MLP 投影交给 Llama 2。",
      "analogy": {
        "title": "两把尺子",
        "text": "<b>语义尺</b>认出『这是搁板』，<b>空间尺</b>量准『孔位在哪』——两把读数并排誊进说明书。",
        "componentId": "ch2-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "工作台读数卡",
          "desc": "点击切换<b>单语义眼 / 单空间眼 / 双眼融合</b>，看同一工作台场景的「读数卡」如何变化——这正是 Prismatic 编码器与 RT-2 单编码器的差别。",
          "componentId": "ch2-eyes"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "誊进说明书",
          "desc": "两把尺的读数怎么变成「话」？步进四步：<b>双尺读数 → 通道拼接 → 2 层 MLP 投影 → 进 Llama 2 词元序列</b>——图像从此与文字排在同一条序列里。",
          "componentId": "ch2-project"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "三段式",
          "desc": "编码器→MLP 投影→Llama 2"
        },
        {
          "icon": "🔧",
          "title": "通道拼接",
          "desc": "两把尺读数并排记录"
        },
        {
          "icon": "✨",
          "title": "+10%",
          "desc": "融合骨干比 LLaVA 单眼高约 10 个百分点"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "说明书里的动作口令",
      "badge": "both",
      "badgeLabel": "进阶·含训练",
      "bridge": "看完了眼睛，轮到「手」：连续动作要先变成词，Llama 2 才能预测。这一节拆开说明书，看 256 条动作口令如何挤进只有 100 个特殊词名额的词表。",
      "analogy": {
        "title": "腾出注记页",
        "text": "说明书只预留了 100 页空白注记，写不下 256 条口令——<b>撕掉最少人看的小字，改写成动作口令</b>。",
        "componentId": "ch3-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "词表改造器",
          "desc": "切换三款「词表方案」看名额账本：<b>RT-2·PaLI-X</b>（整数自带专属词，直接用）/ <b>RT-2·PaLM-E</b>（征用低频词）/ <b>OpenVLA·Llama 2</b>（只有 100 个特殊词名额，仍需覆写 256 最低频词）。",
          "componentId": "ch3-vocab"
        }
      ],
      "formula": {
        "lead": "离散后的动作串按词表映射——",
        "unicode": "动作 a = (a₁ … a_N)，aₖ ∈ {0…255} → 覆写后的 256 个最低频词",
        "symbols": [
          {
            "sym": "aₖ",
            "desc": "第 k 维档位（0-255 整数）"
          },
          {
            "sym": "N",
            "desc": "动作维数"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "动作即词",
          "desc": "每维 256 档拼成一句话"
        },
        {
          "icon": "🔧",
          "title": "100 < 256",
          "desc": "Llama 名额不够，覆写最低频词"
        },
        {
          "icon": "✨",
          "title": "零新结构",
          "desc": "训练目标原样是下一词预测"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "按 1%–99% 标刻度",
      "badge": "both",
      "badgeLabel": "进阶·含训练",
      "bridge": "动作词只是外壳，边界才是灵魂：同样 256 档，刻度怎么标直接决定有效精度。这一节拖入离群值，对比 RT-2 的 min-max 与 OpenVLA 的 1%-99% 分位两种刻度。",
      "analogy": {
        "title": "标刻度",
        "text": "按<b>实际货物的 1%-99%</b> 标刻度——历史最离谱的那一件，不该毁掉整把尺子。",
        "componentId": "ch4-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "刻度标定器",
          "desc": "拖动滑条把一个<b>离群动作点</b>拖进数据分布：上半把尺用 min-max（刻度瞬间被撑爆、有效精度骤降，红）；下半用 1%-99% 分位（离群点被门神拦在外面，刻度稳定，绿）。右下实时显示两种方案的有效档宽。",
          "componentId": "ch4-quantile"
        }
      ],
      "formula": {
        "lead": "分位离散化——",
        "unicode": "区间 [q₁, q₉₉] 均分 256 档：W_low = q₁, W_high = q₉₉, 档宽 = (W_high − W_low) / 256",
        "symbols": [
          {
            "sym": "q₁",
            "desc": "训练数据的 1% 分位"
          },
          {
            "sym": "q₉₉",
            "desc": "训练数据的 99% 分位"
          },
          {
            "sym": "档宽",
            "desc": "每一档覆盖的动作范围"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "同样 256 档",
          "desc": "边界改用分位数"
        },
        {
          "icon": "🔧",
          "title": "抗离群",
          "desc": "极值不再稀释精度"
        },
        {
          "icon": "✨",
          "title": "min-max 被修掉",
          "desc": "RT-2 的 min-max 被 quietly 修掉了"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "零件交换大会",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "上一节把刻度尺标定好了，接下来往货架进料：Open X-Embodiment 拿来 70+ 数据集、200 万+ 条开放轨迹，怎么筛、怎么配，才炼得出 970k 的优质底料？",
      "analogy": {
        "title": "零件交换大会",
        "text": "70 多家摊位、200 万件零件——<b>筛规范、配比例</b>，最后装箱 97 万件。",
        "componentId": "ch5-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "混料步进机",
          "desc": "步进四步：<b>①倾倒</b>（OXE 全量 70+ 数据集 / 200 万+ 轨迹）→ <b>②过滤</b>（只留单臂操作 + 第三人称相机的操作数据集）→ <b>③配比</b>（沿用 Octo 混合权重，多样的上调、单调的下调）→ <b>④试错</b>（DROID 以 10% 保守混入；动作 token 准确率始终偏低 → 训练后三分之一撤出）。",
          "componentId": "ch5-mixer"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "200万→97万",
          "desc": "过滤+配比出好料"
        },
        {
          "icon": "🔧",
          "title": "Octo 配方",
          "desc": "多样性权重沿用前人"
        },
        {
          "icon": "✨",
          "title": "敢加敢撤",
          "desc": "DROID 试 10% 后期剔除"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "踩坑笔记实验室",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "970k 底料装箱完毕，开炉训练前还要拍板一堆选择——骨干选谁、分辨率多大、视觉编码器冻不冻、练多少轮？小店把每一步试错都写进了踩坑笔记。",
      "analogy": {
        "title": "踩坑笔记",
        "text": "小店把试错过程全写进笔记——<b>四条经验，条条反直觉</b>。",
        "componentId": "ch6-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "决策实验室",
          "desc": "四组决策各配 chips，切换即显示论文实测结论：<b>①骨干</b>{IDEFICS-1 | LLaVA | Prismatic}（语言接地：LLaVA +35% 于 IDEFICS-1；Prismatic 再 +10%）；<b>②分辨率</b>{224px | 384px}（效果持平，384 训练慢 3 倍）；<b>③视觉编码器</b>{冻结 | 微调}（VLM 惯例是冻结；VLA 上<b>必须微调</b>，否则空间细节不够抓不准）；<b>④训练轮数</b>{1-2 轮 | 练到动作词准确率 >95%}（LLM 惯例 1-2 轮；真机性能一路涨到 95% 才停，最终 27 轮）。",
          "componentId": "ch6-decisions"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "224=384",
          "desc": "效果持平但训练快 3 倍"
        },
        {
          "icon": "🔧",
          "title": "解冻视觉",
          "desc": "反 VLM 惯例的 VLA 必修课"
        },
        {
          "icon": "✨",
          "title": "95% 才停",
          "desc": "27 轮 epoch 真机性能持续涨"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "不换柜体，只换门贴",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "数据和训练决策都敲定了，这一章回答「改得起吗」：不换柜体、只换门贴的 LoRA 用 1.4% 参数追平全量微调，把微调成本从 8 张 A100 压到单卡十来小时。",
      "analogy": {
        "title": "换门贴",
        "text": "想换风格不必拆柜重装——<b>贴层门贴就焕新</b>：只动 1.4% 的『表面积』。",
        "componentId": "ch7-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "微调配方台",
          "desc": "切换六种微调方案——<b>全量微调 / 只调末层 / 冻结视觉 / 三明治 / LoRA·r=32 / LoRA·r=64</b>——成功率、训练参数量、显存三组柱联动（论文 Table 1 实测：69.7 / 30.3 / 47.0 / 62.1 / 68.2 / 68.2%；参数 7188.1M / 465.1M / 6760.4M / 914.2M / 97.6M / 195.2M；显存 163.3 / 51.4 / 156.2 / 64.0 / 59.7 / 60.5GB）。",
          "componentId": "ch7-lora"
        }
      ],
      "insight": "LoRA（低秩适配）：只训 1.4% 参数（97.6M）就以 68.2% 追平全量微调的 69.7%，单卡 A100 十来小时，省 8 倍算力。",
      "formula": {
        "lead": "LoRA 参数化——",
        "unicode": "θ′ = θ + Δθ，Δθ·x = B·A·x，rank r = 32",
        "symbols": [
          {
            "sym": "θ",
            "desc": "冻结的原始权重"
          },
          {
            "sym": "B·A",
            "desc": "低秩分解增量（r=32）"
          },
          {
            "sym": "r = 32",
            "desc": "LoRA 秩——实测 rank 影响可忽略，推荐取 32"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "1.4% 追平",
          "desc": "68.2 vs 69.7，参数 97.6M vs 7188M"
        },
        {
          "icon": "🔧",
          "title": "省 8 倍",
          "desc": "单卡 A100 十来小时"
        },
        {
          "icon": "✨",
          "title": "rank 不敏感",
          "desc": "32 够用，64 不涨"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "出包检查与压缩打包",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "微调方案定了，发货前还要做两件事：把整机管线从头到尾过一遍出包检查，再用 bf16 / int8 / int4 三种精度压缩打包——7GB 显存也能不掉点。",
      "analogy": {
        "title": "出包检查",
        "text": "发货前把<b>全套家伙</b>过一遍，再压缩打包省运费。",
        "componentId": "ch8-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "交互架构图",
          "desc": "7 节点：①相机图像+指令 ②SigLIP 语义编码 ③DINOv2 空间编码 ④通道拼接 ⑤MLP 投影 ⑥Llama 2 7B（下一词预测）⑦动作词→反 token 化→机械臂——点击任一节点查看它的职责。",
          "componentId": "ch8-arch",
          "figure": "./images/figure-2.png"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "部署配置器",
          "desc": "切换推理精度 <b>bf16 / int8 / int4</b>：显存柱、速度、成功率三卡联动（Table 2 实测：71.3%/16.8GB · 58.1%/10.2GB · 71.9%/7.0GB；A5000 上 int8 仅 1.2Hz、int4 3Hz）。",
          "componentId": "ch8-deploy",
          "figure": "./images/figure-6.png"
        }
      ],
      "insight": "一条管线：双视觉编码器→通道拼接→MLP 投影→Llama 2 下一词预测→反 token 化执行；部署上 int4 量化 7GB 显存不掉点，慢才是杀手。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "一条管线",
          "desc": "双尺→拼接→投影→Llama 2→执行"
        },
        {
          "icon": "🔧",
          "title": "int4 神器",
          "desc": "7GB 不掉点"
        },
        {
          "icon": "✨",
          "title": "慢才是杀手",
          "desc": "int8 输在 1.2Hz 跟不上控制"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "三家门店比装修",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "预训练与微调都过关了，本章把整机拉上三条真机战线——BridgeData V2、Google Robot、Franka 微调——与 RT-2-X、Octo、Diffusion Policy 同台比装修，让同一批顾客（评测任务）当场打分。",
      "analogy": {
        "title": "三家门店比装修",
        "text": "同一条商业街开三家分店——<b>比的是同一批顾客的打分</b>。",
        "componentId": "ch9-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "战场柱状图",
          "desc": "切换三个评测战场看核心柱：<b>BridgeData V2</b>（170 次评测：总平均 70.6 vs 50.6，除语义泛化 36.3 vs 38.8 外全类别压过 RT-2-X，语言接地 90 vs 85）/ <b>Google Robot</b>（60 次：总平均 85.0 vs 78.3，误差棒重叠≈相当）/ <b>Franka 微调</b>（129 次：比 Diffusion Policy 高 20.4%，唯一全任务 ≥50%）。",
          "componentId": "ch9-battlefield",
          "figure": "./images/figure-3.png"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "语言接地步进",
          "desc": "步进一个多物体场景的指令执行：<b>「把黄色玉米放到粉色盘」</b>——干扰物在场，看 OpenVLA 逐拍锁定正确物体；以及 Google Robot 上的<b>「把可乐拿给泰勒·斯威夫特」</b>（图卡+标签「语义任务：RT-2-X 更强，因网页共练」）。",
          "componentId": "ch9-grounding",
          "figure": "./images/figure-5.png"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "+16.5pp",
          "desc": "29 任务总计反超 55B 的 RT-2-X；Bridge 总平均 70.6 vs 50.6"
        },
        {
          "icon": "🔧",
          "title": "85.0 vs 78.3",
          "desc": "Google Robot 总平均相当（误差棒重叠），7B 对 55B"
        },
        {
          "icon": "✨",
          "title": "唯一 ≥50%",
          "desc": "Franka 全任务下限最高"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "开箱验货与告示牌",
      "badge": "both",
      "badgeLabel": "进阶·含训练",
      "bridge": "收官一章先验货再挂牌：把参数量、反超幅度、LoRA、量化四组硬数字摆上评分板，开三段官方演示视频，最后把两条边界写上门口的告示牌——开源店连缺点都摆在明面上。",
      "analogy": {
        "title": "开箱验货",
        "text": "分数亮眼也别忘看<b>告示牌</b>——开源店连缺点都写在明面上。",
        "componentId": "ch10-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "证据柱状图",
          "desc": "四组硬指标切换：<b>参数量</b>（7B vs 55B vs 0.093B vs 0.035B，越少越好）/ <b>反超幅度</b>（+16.5pp，成功率越高越好）/ <b>LoRA 参数占比</b>（1.4% vs 100%，越少越好）/ <b>量化显存</b>（16.8 vs 7.0GB，越少越好）——每组柱+数值胶囊+最优绿框，方向随指标标注。",
          "componentId": "ch10-evidence",
          "figure": "./images/figure-1.png"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "真实演示与边界",
          "desc": "三段官方远程演示切换播放：<b>杂乱抓取</b>（BridgeData V2）/ <b>微调后倒玉米</b>（Franka）/ <b>可乐立正</b>（Google Robot）；下方两张红边<b>边界卡</b>与一张绿边<b>生态卡</b>——优点与局限都挂在明面上。",
          "componentId": "ch10-demos"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "7B>55B",
          "desc": "以 1/7 参数反超 16.5pp"
        },
        {
          "icon": "🔧",
          "title": "平民化",
          "desc": "1.4% 参数微调·7GB 推理"
        },
        {
          "icon": "✨",
          "title": "告示牌",
          "desc": "无分块、无本体感知、单帧——下一代排队解决"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV13Kb5z2ExX",
      "title": "OpenVLA：开源多模态具身智能大模型",
      "reason": "OpenVLA 专题解读，播放量最高",
      "cover": "https://i1.hdslb.com/bfs/archive/5a1cc609b3849f329e7e3de484195b16fa86d574.jpg",
      "views": "14.9万播放"
    },
    {
      "bvid": "BV1HAkZYLEZb",
      "title": "具身智能领域的里程碑：OpenVLA讲解",
      "reason": "里程碑式工作讲解，结构清晰",
      "cover": "https://i0.hdslb.com/bfs/archive/7696cc14cb057963ec383d6de08d2ab50964bc98.jpg",
      "views": "3.6万播放"
    },
    {
      "bvid": "BV15q8t62EzR",
      "title": "具身智能入门科普02：从VLM到VLA--OpenVLA、Octo与π₀具身智能架构解析",
      "reason": "从 VLM 到 VLA 的架构脉络对比（含 OpenVLA/Octo/π₀）",
      "cover": "https://i1.hdslb.com/bfs/archive/478fb842fb632060bf1b67c794600d9f4bb3c80d.jpg",
      "views": "2.2万播放"
    },
    {
      "bvid": "BV1R7jc6qEcb",
      "title": "具身智能到底是什么？一张图讲清整个领域！【5分钟具身智能系列】",
      "reason": "具身智能领域全景入门科普",
      "cover": "https://i2.hdslb.com/bfs/archive/ba7629e9a500768e96ef64cc19c31c61352b2c1b.jpg",
      "views": "10.6万播放"
    }
  ]
};
