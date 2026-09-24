import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic Control",
    "titleZh": "RT-2：视觉-语言-动作模型——把网页知识迁移到机器人控制",
    "venue": "arXiv 2307.15818 · 2023",
    "authors": "Anthony Brohan, Noah Brown, Justice Carbajal, Yevgen Chebotar, Xi Chen, et al.",
    "affiliation": "Google DeepMind",
    "domain": "具身智能 · 视觉语言模型 · 机器人操作",
    "coreProblem": "机器人策略只认训练过的闭集指令与场景，而网页级语义知识——认得万物、听得懂人话、会推理——始终进不了低层控制。",
    "coreInsight": "把机器人动作当成<b>另一种语言</b>：动作离散成 256 档 × 8 维的整数词，与网页看图问答数据<b>混着练</b>——大型视觉语言模型就变成了直接输出机械臂指令的 VLA 模型，网页知识从此流进机器人控制。",
    "keywords": [
      "VLA",
      "动作 token 化",
      "co-fine-tuning",
      "涌现能力",
      "机器人操作"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "<b>RT-1（2022）</b>：35M 专用策略，只认训练过的指令与场景；换个说法或新物体就失败——未见过平均 32%。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "<b>RT-2（VLA）</b>：把动作离散成 token、与网页数据共同微调大型 VLM——同一个模型既看图问答又输出机械臂动作，未见过平均 62%、涌现评测 60%。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "菜单之外的订单",
      "badge": "inf",
      "badgeLabel": "人人必读",
      "bridge": "这是全文的起点：先暴露问题。传统机器人策略只认训练里见过的闭集指令，语义稍变就失败——我们先去后厨看看，只会按按钮菜单点单的老员工遇到菜单之外的订单有多狼狈。",
      "analogy": {
        "title": "按钮菜单的老员工",
        "text": "这位老员工只会按菜单板上的按钮点单——<b>菜单上没有的菜，他只能摇头</b>。",
        "componentId": "ch1-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "点单试验台",
          "desc": "切换三类订单——<b>菜单内</b>（训练见过的指令）、<b>菜单外同义</b>（换个说法）、<b>语义新知</b>（认字/认人/推理）——看老员工（RT-1 式闭集策略）与新厨师（RT-2 式 VLA）各自能否接单。",
          "componentId": "ch1-orders"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "闭集指令",
          "desc": "老策略只认训练过的说法，换个问法就失败"
        },
        {
          "icon": "🔧",
          "title": "泛化差距",
          "desc": "RT-1 见过任务 92，没见过平均只有 32"
        },
        {
          "icon": "✨",
          "title": "需要网页知识",
          "desc": "认万物、听人话、会推理——只能从互联网规模预训练来"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "读千本菜谱的厨师",
      "badge": "inf",
      "badgeLabel": "人人必读",
      "bridge": "上一节看到闭集策略「换个说法就懵」的窘境。本节来认识 RT-2 的大脑前身——视觉语言模型（VLM）：它在网页级数据上练出了看图问答的本事，什么食材都认得、什么问题都答得上，却还不会动手。",
      "analogy": {
        "title": "会看图说话的大脑",
        "text": "这位厨师<b>读过上千本菜谱和百科</b>——看图就能答话：认食材、说成分、讲做法。",
        "componentId": "ch2-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "看图问答工作台",
          "desc": "点击左侧任一场景（食材/菜单标志/人物），再点一个问题——厨师（VLM）用<b>一句自然语言</b>回答。这正是 PaLI-X、PaLM-E 在网页数据上练出的本事。",
          "componentId": "ch2-vqa"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "会说不会做",
          "desc": "知识已就位，可它<b>发不出去</b>：把厨师的文字回答直接发给机械臂——指令口报「非法动作 token」；换成 8 个档位词立刻执行。差的不是脑子，是<b>输出格式</b>——这正是下一章要补的一步。",
          "componentId": "ch2-execute"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "图文入、文本出",
          "desc": "VLM = 看图回答问题的巨型模型"
        },
        {
          "icon": "🔧",
          "title": "网页级数据",
          "desc": "VQA、描述、图文交错——万物与语义都在其中"
        },
        {
          "icon": "✨",
          "title": "差一步",
          "desc": "会说不会做：输出是文字，不是电机指令"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "动作也是一种语言",
      "badge": "inf",
      "badgeLabel": "人人必读",
      "bridge": "VLM 会「说」不会「做」，差的只是输出格式。本节迎来全文最关键的「啊哈」时刻：把动作离散成 token、当成另一种语言塞进同一个模型——问答与控制从此共用同一颗大脑（VLA）。",
      "analogy": {
        "title": "颠勺写成一句话",
        "text": "一次颠勺，写成<b>一串数字口令</b>——从此「做菜」也能像「说话」一样教给同一颗大脑。",
        "componentId": "ch3-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "同一个大脑，两种回答",
          "desc": "按下共同开始：上例问「图里有什么？」——回答是一句话；下例问「该做什么动作？」——回答是一串动作 token。<b>同一个模型、同一种训练</b>，只是「语言」不同。",
          "componentId": "ch3-twolanguage"
        }
      ],
      "formula": {
        "lead": "论文把动作串直接拼成与文字回答同格式的字符串：",
        "unicode": "Q: 机械臂该做什么？ A: 1 128 91 241 5 101 127 30",
        "symbols": [
          {
            "sym": "Q: … A:",
            "desc": "标准看图问答格式，答案位置是 8 个动作 token（终止位 + 6 个位移旋转 + 夹爪）。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "动作即语言",
          "desc": "8 个档位数就是 8 个「词」"
        },
        {
          "icon": "🔧",
          "title": "同构训练",
          "desc": "与看图问答共用词表、目标与骨干"
        },
        {
          "icon": "✨",
          "title": "VLA 诞生",
          "desc": "不加新参数，VLM 直接学会「出手」"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "把动作编成口令",
      "badge": "both",
      "badgeLabel": "进阶·含训练",
      "bridge": "上一节接受了「动作即语言」的洞察，本节拆开这套口令的编码器：6 个位移旋转分量 + 夹爪 + 终止位，每个连续维度均匀压进 256 档——一次动作就是 8 个 0-255 的整数，从此有资格当「词」。",
      "analogy": {
        "title": "口令的档位",
        "text": "每个动作维度都有 <b>256 个档位</b>——像音量旋钮只准停在整数刻度上。",
        "componentId": "ch4-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "离散化器",
          "desc": "选一个动作维度，拖动<b>连续值</b>滑条：看它落进哪一档（bin 序号），底部实时拼出 8 维动作串。",
          "componentId": "ch4-tokenize"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "从口令还原动作",
          "desc": "离散化的逆过程：<b>反 token 化（de-tokenize）</b>——推理时把 8 个档位词逐个翻译回连续分量（终止位 + 6 个位移旋转 + 夹爪），机械臂照着执行。（论文的示例串只印了 7 个数，本演示按论文 8 维格式补全夹爪位。）",
          "componentId": "ch4-detoken"
        }
      ],
      "formula": {
        "lead": "均匀离散：把连续分量压进 256 档——",
        "unicode": "aₖ = bin(vₖ) ∈ {0, 1, …, 255}，　动作 a = (a₁ … a₈)",
        "symbols": [
          {
            "sym": "aₖ",
            "desc": "离散后的档位序号"
          },
          {
            "sym": "vₖ",
            "desc": "第 k 个连续分量（位移 m / 旋转 ° / 夹爪）"
          },
          {
            "sym": "a",
            "desc": "8 维动作串"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "8 维动作",
          "desc": "6 位移旋转 + 夹爪 + 终止位"
        },
        {
          "icon": "🔧",
          "title": "256 档",
          "desc": "均匀离散，档位序号即 token"
        },
        {
          "icon": "✨",
          "title": "一串即一句",
          "desc": "\"1 128 91 241 5 101 127 30\" （8 维）与文字同格式"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "理论课与实操课混着上",
      "badge": "both",
      "badgeLabel": "进阶·含训练",
      "bridge": "口令造好了，接下来是怎么把它教给一颗网页级大脑：光背菜谱不行，光练颠勺也不行——这节看论文的训练配方 <b>co-fine-tuning</b> 怎么排课表。",
      "analogy": {
        "title": "混排课表",
        "text": "只刷题不会颠勺，只打工忘了理论——<b>理论课与实操课混着上</b>，两边都不丢。",
        "componentId": "ch5-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "训练配方台",
          "desc": "切换三种策略——<b>从零训练 / 只用机器人数据微调 / co-fine-tuning 混合</b>——并拖动批次里<b>机器人数据占比</b>，看未见过场景平均成功率（论文 Table 6 实测：9 / 42 / 44 / 52 / 63）。",
          "componentId": "ch5-recipe"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "从零必败",
          "desc": "5B 从零训练未见过平均仅 9%"
        },
        {
          "icon": "🔧",
          "title": "混练 > 微调",
          "desc": "55B：52% → 63%"
        },
        {
          "icon": "✨",
          "title": "规模也关键",
          "desc": "同策略下 5B→55B 全面提升"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "电话那头的大厨",
      "badge": "inf",
      "badgeLabel": "人人必读",
      "bridge": "手艺练成了，该真上灶台。这节看部署形态：<b>大脑在云端</b>多 TPU 上，灶台每秒接 1-3 句口令照做——一样炒成一桌菜。",
      "analogy": {
        "title": "按拍指挥",
        "text": "大厨不在现场，在<b>电话那头</b>——每秒报 1-3 句口令，灶台照做，一样炒成一桌菜。",
        "componentId": "ch6-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "闭环步进机",
          "desc": "步进真机闭环的一拍：<b>相机观察 → 云端查询 → 约束解码（只挑合法动作词）→ 机械臂执行 → 回到观察</b>。右下角可切 55B（1-3 Hz）与 5B（≈5 Hz）看节拍差。",
          "componentId": "ch6-loop"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "云端大脑",
          "desc": "多 TPU 云服务，多机共享"
        },
        {
          "icon": "🔧",
          "title": "输出约束",
          "desc": "机器人任务只采样合法动作词"
        },
        {
          "icon": "✨",
          "title": "1-3 Hz 闭环",
          "desc": "迄今直接闭环控制的最大模型（55B）"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "师傅做一遍，学徒接龙",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "上一章模型已经在云端按拍输出指令；这一章回到训练本身——RT-2 到底用什么损失，把「会看图说话」的大脑练成「会出手」的大厨？",
      "analogy": {
        "title": "口令接龙",
        "text": "师傅的示范就是课文——<b>学徒玩接龙补全下一个词</b>，补得越准，手艺越像师傅。",
        "componentId": "ch7-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "下一词接龙",
          "desc": "步进遮词过程：模型看到图像、指令与前 k 个动作词，<b>猜第 k+1 个</b>。每猜对一步，损失下降一格——这就是行为克隆：预测下一个词 = 模仿演示。底部为「训练损失（示意）」条，非论文实测曲线。",
          "componentId": "ch7-nexttoken"
        }
      ],
      "formula": {
        "lead": "训练目标与语言模型完全一致——",
        "unicode": "L = −Σₖ log p(aₖ₊₁ | a₁..ₖ, x, l)　（= 行为克隆）",
        "symbols": [
          {
            "sym": "aₖ",
            "desc": "第 k 个动作 token"
          },
          {
            "sym": "x",
            "desc": "相机图像"
          },
          {
            "sym": "l",
            "desc": "语言指令"
          },
          {
            "sym": "p(aₖ₊₁",
            "desc": "模型的下一词概率"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "没有新损失",
          "desc": "下一词预测原样复用"
        },
        {
          "icon": "🔧",
          "title": "等价模仿学习",
          "desc": "在动作语言里就是行为克隆"
        },
        {
          "icon": "✨",
          "title": "数据即课文",
          "desc": "13 台机器人 17 个月的演示=带答案的课本"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "两副骨架，一套词表",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "训练目标还是那一个「猜下一个词」，接下来把整机装备逐件过一遍：管线由哪些部件组成，PaLI-X 与 PaLM-E 两副骨干又各自从哪里弄来动作词。",
      "analogy": {
        "title": "出包检查",
        "text": "上岗前把<b>家伙事儿</b>逐件过一遍——每件都得知道干什么用。",
        "componentId": "ch8-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "交互架构图",
          "desc": "点击通路任一部件：高亮该部件与激活路径，详情区给出张量/设计说明。可切 <b>PaLI-X / PaLM-E</b> 骨干对比动作词来源差异。",
          "componentId": "ch8-arch",
          "figure": "./images/figure-1.png"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "词表改造器",
          "desc": "切换 <b>PaLI-X / PaLM-E</b>：左看词表条（整数词区天然对齐 0-255；或 256 个最低频词被涂紫征用），右看同一串动作在两种词表下的样子。",
          "componentId": "ch8-vocab"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "一条管线",
          "desc": "图像+指令 → ViT → 语言主干 → 8 个动作词 → 执行"
        },
        {
          "icon": "🔧",
          "title": "两种词表",
          "desc": "整数词现成用 / 低频词改造用"
        },
        {
          "icon": "✨",
          "title": "零新参数",
          "desc": "预训练骨干原封不动"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "没学过的菜也敢接单",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "训练细节里藏着两件惊喜：没教过的任务也能做（涌现能力），还能先说计划再动手（思维链）。本节用论文 Table 5 的实测数字逐类验收。",
      "analogy": {
        "title": "举一反三",
        "text": "菜单上从没写过这些菜——但<b>书本里的知识</b>让厨师照样接单：认符号、会算术、认得出人。",
        "componentId": "ch9-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "涌现实验室",
          "desc": "切换三类没教过的任务——<b>符号理解</b>（把苹果移到 3）/ <b>推理</b>（算术·颜色·多语）/ <b>人脸识别</b>（拿给戴眼镜的人）——对比 RT-1 与 RT-2 的成功率柱（论文 Table 5 实测）。",
          "componentId": "ch9-emergent",
          "figure": "./images/figure-8.png"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "先说计划，再动手",
          "desc": "步进思维链推理：<b>指令 → Plan（语言）→ Action（动作串）</b>。例：「我饿了 → 计划：拿 rxbar 巧克力 → 1 128 124 …」。",
          "componentId": "ch9-cot",
          "figure": "./images/figure-7.png"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "三类涌现",
          "desc": "符号 82 / 推理 46 / 人脸 53（RT-1：16/16/20）"
        },
        {
          "icon": "🔧",
          "title": "知识来自网页",
          "desc": "机器人数据里从无这些概念"
        },
        {
          "icon": "✨",
          "title": "思维链",
          "desc": "Plan 语言步桥接问答与操作"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "出师考核",
      "badge": "both",
      "badgeLabel": "进阶·含训练",
      "bridge": "最后把所有证据摆上评分板：泛化、涌现、仿真三组数字一起看；奖章旁边也贴着两张「注意事项」——会做新事，不等于会新动作。",
      "analogy": {
        "title": "出师考核",
        "text": "理论与实操都考完了——<b>看分数，也看注意事项</b>。",
        "componentId": "ch10-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "证据柱状图",
          "desc": "切换指标，<b>柱状图</b>与说明即时更新；所有数字来自论文 Table 4/5/1，方向与测量条件随图标注。",
          "componentId": "ch10-evidence",
          "figure": "./images/figure-4.png"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "真实演示与边界",
          "desc": "两个<b>官方视频</b>（远程加载自项目页）：RT-2 真机演示与思维链对比；下方两张边界卡——<b>学不会新动作</b>（技能仍限于机器人数据分布）与<b>算力昂贵</b>（1-3 Hz，未来靠量化/蒸馏）。",
          "componentId": "ch10-demos"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "泛化 2×",
          "desc": "未见过平均 62 vs 32（RT-1）"
        },
        {
          "icon": "🔧",
          "title": "涌现 3×",
          "desc": "涌现评测 60 vs 17；仿真 90 vs 74"
        },
        {
          "icon": "✨",
          "title": "两条边界",
          "desc": "无新动作；算力昂贵待蒸馏"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1jP41147UJ",
      "title": "Robotic Transformer 2 (RT-2)｜2023【谷歌DeepMind】",
      "reason": "RT-2 官方发布解读（2023 谷歌 DeepMind），与本论文直接对应",
      "cover": "https://i2.hdslb.com/bfs/archive/ee30d04ac35a7555a37eb325587905e90e0a9cc1.jpg",
      "views": "1.1万播放"
    },
    {
      "bvid": "BV1UBtezaE1t",
      "title": "谷歌DeepMind的RT-2通用机器人模型——基于视觉-语言-动作（VLA）模型",
      "reason": "基于视觉-语言-动作（VLA）模型——术语与机制讲解最对口",
      "cover": "https://i0.hdslb.com/bfs/archive/0c4cc7fcff94a108baecfe4934f0a997dadc1155.jpg",
      "views": "5821播放"
    },
    {
      "bvid": "BV14G41127Te",
      "title": "谷歌 RT-2-X 通用型人工智能机器人",
      "reason": "RT-2-X 后续进展，看这条线的延伸",
      "cover": "https://i1.hdslb.com/bfs/archive/8711414deaf8e75dec35008fa2acb85bdf427a78.jpg",
      "views": "887播放"
    },
    {
      "bvid": "BV1pa4bzMEQx",
      "title": "从SayCan到VLA模型 VLA的来时路 RT-1 PalmE RT-2 强化学习 模仿学习 VLA原理",
      "reason": "从 SayCan/PaLM-E 到 VLA 的来龙去脉，背景最完整",
      "cover": "https://i0.hdslb.com/bfs/archive/6d41c2bd955123c2b804f2a19687de23e07e07dc.jpg",
      "views": "5525播放"
    }
  ]
};
