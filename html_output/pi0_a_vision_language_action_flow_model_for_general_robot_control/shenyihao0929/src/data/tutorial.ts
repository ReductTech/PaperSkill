import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "π0: A Vision-Language-Action Flow Model for General Robot Control",
    "titleZh": "π0：面向通用机器人控制的视觉-语言-动作流模型",
    "venue": "arXiv 2410.24164 · 2024",
    "authors": "Kevin Black, Noah Brown, Danny Driess, Adnan Esmail, Michael Equi, et al.",
    "affiliation": "Physical Intelligence",
    "domain": "具身智能 · 流匹配 · 灵巧操作",
    "coreProblem": "灵巧长程任务（叠衣、装箱）要求高频、连续、精细的动作输出；离散 token 的 VLA 又慢又粗，撑不起 50Hz 灵巧控制。",
    "coreInsight": "动作不必是「词」，可以是「流」：<b>3B 掌眼 + 300M 巧手</b>，从噪声泥团沿速度场十步拉出 50 步连续动作——<b>50Hz</b> 灵巧控制与 5-20 分钟长程任务的门槛从此跨过。",
    "keywords": [
      "流匹配",
      "动作专家",
      "动作块",
      "灵巧操作",
      "机器人基础模型"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "<b>档位词 VLA（如 OpenVLA）</b>：动作离散成 256 档逐词生成，无动作块、难上高频——灵巧任务之痛。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "<b>π0</b>：3B VLM + 300M 动作专家，流匹配直接输出连续 50 步动作块——50Hz 灵巧控制，叠衣装箱 5-20 分钟长程任务全过半得分。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "细颈花瓶之难",
      "badge": "inf",
      "badgeLabel": "人人必读",
      "bridge": "工坊刚接下一张难单——先看清旧做法到底卡在哪儿，才明白 π0 为什么换赛道：同一张订单，两条轨迹摆上同一座钟。",
      "analogy": {
        "title": "细颈花瓶",
        "text": "这张订单要的是<b>连续流畅的高频手法</b>——模具一格一格压，颈口全成锯齿；转盘拉坯才能一气呵成。",
        "componentId": "ch1-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "同一订单，两条轨迹",
          "desc": "按下共同开始：同一句「抓起杯子放进盘」画出两条轨迹——<b>上：档位词轨迹</b>（256 档离散，锯齿折线，红）对应前两篇 VLA 的做法；<b>下：流式轨迹</b>（连续向量+50 步动作块，平滑弧线，绿）。旁注控制频率上限对比（档位自回归慢 vs 流匹配 50Hz）。",
          "componentId": "ch1-order"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "灵巧之难",
          "desc": "连续、高频、精细，格子给不了"
        },
        {
          "icon": "🔧",
          "title": "慢在自回归",
          "desc": "逐词生成的 VLA 快不起来"
        },
        {
          "icon": "✨",
          "title": "换赛道",
          "desc": "动作不当词，当「流」"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "掌眼与巧手",
      "badge": "inf",
      "badgeLabel": "人人必读",
      "bridge": "接单之前先认识店里的两位师傅——一位掌眼、一位巧手：3.3B 的家底怎么分、语言与动作各归谁管，点一点便知。",
      "analogy": {
        "title": "掌眼与巧手",
        "text": "<b>掌眼师傅</b>读单看料（3B VLM），<b>巧手师傅</b>只管拉坯（300M 专家）——各拿各的家伙，同桌吃饭。",
        "componentId": "ch2-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "两师傅分工台",
          "desc": "点击任一师傅看分工：<b>掌眼（PaliGemma 3B）</b>——图像、语言、关节状态进 token 空间，交叉熵管语言；<b>巧手（300M 动作专家）</b>——独立权重、从零初始化、动作 token 全双向注意、流匹配管动作。总量 3.3B；对照 470M 无掌眼的 π0-small。",
          "componentId": "ch2-experts"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "3.3B",
          "desc": "3B 骨干 + 300M 专家"
        },
        {
          "icon": "🔧",
          "title": "双目标同灶",
          "desc": "语言交叉熵 + 动作流匹配"
        },
        {
          "icon": "✨",
          "title": "独立权重",
          "desc": "MoE 式二专家，各司其职"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "转盘上的流",
      "badge": "inf",
      "badgeLabel": "人人必读",
      "bridge": "人物到齐，该看核心手艺了：动作不是逐词挑格子，而是噪声泥团沿速度场连续成形——亲手拖一拖 τ 就明白。",
      "analogy": {
        "title": "转盘上的流",
        "text": "<b>一团噪声泥</b>，在转盘上按『该往哪儿推』一步步拉——直到它成为一段动作。",
        "componentId": "ch3-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "拖动流时间 τ",
          "desc": "拖动<b>流时间 τ</b>：0 是纯噪声泥团，1 是成形动作。轨迹条上同时显示插值状态——这正是训练时网络看到的输入。",
          "componentId": "ch3-wheel"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "多模态轨迹台",
          "desc": "同一个订单、同一张桌子，<b>左绕、右绕、先抬后移都是对的</b>——flow matching 建模的是整条动作分布；切到「平均路线」看单模态回归的下场：多条好路线被平均成一条撞上杯子的中间路线。",
          "componentId": "ch3-multimodal"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "噪声→动作",
          "desc": "τ 从 0 拉到 1"
        },
        {
          "icon": "🔧",
          "title": "学的是方向",
          "desc": "速度场=每一步往哪儿推"
        },
        {
          "icon": "✨",
          "title": "多模态",
          "desc": "同一订单可以有多条好轨迹"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "拉坯的数学",
      "badge": "both",
      "badgeLabel": "进阶·含训练",
      "bridge": "直觉之后是账本：本章把『往哪儿推』写成四步可执行的训练目标，一步一步按给你看。",
      "analogy": {
        "title": "糅泥教学",
        "text": "把<b>成品动作</b>与<b>噪声泥</b>按 τ 糅合，让巧手学会指着成品说：往那边推。",
        "componentId": "ch4-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "流匹配四步",
          "desc": "步进流匹配训练的四步：<b>①采成品</b> A（演示数据里的动作块）→ <b>②采噪声</b> ε∼N(0,I) → <b>③糅合</b> Aτ=τA+(1−τ)ε（转盘上显示混合体）→ <b>④学方向</b> 网络输出 vθ 逼近 u=A−ε（箭头对齐打勾）。附注：τ 从 Beta 分布采样、偏爱更吵的泥。",
          "componentId": "ch4-loss"
        }
      ],
      "formula": {
        "lead": "流匹配训练目标",
        "unicode": "Lτ = E‖vθ(Aτ, o) − u‖²，Aτ = τA + (1−τ)ε，u = A − ε",
        "symbols": [
          {
            "sym": "vθ",
            "desc": "网络预测的速度场"
          },
          {
            "sym": "u = A − ε",
            "desc": "目标速度（成品减噪声）"
          },
          {
            "sym": "Aτ",
            "desc": "按 τ 糅合的噪声动作"
          },
          {
            "sym": "τ",
            "desc": "流时间∈[0,1]"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "线性糅合",
          "desc": "τA+(1−τ)ε，最优传输路径"
        },
        {
          "icon": "🔧",
          "title": "目标简单",
          "desc": "成品减噪声就是方向"
        },
        {
          "icon": "✨",
          "title": "Beta 采样",
          "desc": "训练偏爱更吵的泥团"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "十步成坯",
      "badge": "both",
      "badgeLabel": "进阶·含训练",
      "bridge": "上一节算清了训练的账：巧手学会的是『往哪儿推』。这一节看它上盘干活——从纯噪声泥团出发，沿速度场十步走到成形，而且观测那笔账只算一次。",
      "analogy": {
        "title": "十步成坯",
        "text": "不必无限细拉——<b>十步欧拉</b>，泥团到器形。",
        "componentId": "ch5-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "十步采样与缓存省算",
          "desc": "步进采样：τ=0 纯噪声起步，每按一步执行 Aτ+δ=Aτ+δ·vθ（δ=0.1），共 10 步。下方显示<b>缓存省算</b>：观测前缀（订单+图像）键值灰色锁定，仅动作后缀逐步重算。",
          "componentId": "ch5-sample"
        }
      ],
      "insight": "推理=从纯噪声沿学到的速度场欧拉积分 10 步（δ=0.1）；前缀 KV 缓存只算一次，每步仅重算动作后缀。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "十步欧拉",
          "desc": "δ=0.1 从噪声到动作"
        },
        {
          "icon": "🔧",
          "title": "前缀缓存",
          "desc": "观测键值只算一次"
        },
        {
          "icon": "✨",
          "title": "只重算后缀",
          "desc": "每步只动动作 token"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "一口气拉五十步",
      "badge": "inf",
      "badgeLabel": "人人必读",
      "bridge": "手法再好，也得跟上转盘的转速。这一节看 π0 怎么排班：一次拉出五十步，推理下一段的同时执行上一段——机器人不再干等。",
      "analogy": {
        "title": "一气呵成",
        "text": "转盘不停手不停——<b>拉一段、演一段</b>，五十步一气呵成。",
        "componentId": "ch6-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "推理/执行重叠流水线",
          "desc": "按下开始看<b>推理/执行重叠</b>流水线：上=档位词 VLA（逐词生成→整段才执行，机器人干等，红）；下=π0（推理下一段时执行上一段，绿）。切 <b>20Hz / 50Hz</b> 看（0.8s/16 步 vs 0.5s/25 步）。",
          "componentId": "ch6-async"
        }
      ],
      "insight": "动作块 H=50 一次生成；异步执行：20Hz 机每 0.8s 推理执行 16 步、50Hz 机每 0.5s 执行 25 步；开环执行（集成反而伤）。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "H=50",
          "desc": "一次生成一整段动作块"
        },
        {
          "icon": "🔧",
          "title": "推理执行重叠",
          "desc": "机器人不再干等"
        },
        {
          "icon": "✨",
          "title": "50Hz",
          "desc": "灵巧控制的频率门槛"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "万家手法库与学徒制",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "手法从哪来？本章把 π0 的数据策展摆上书架：先倾入开源、再码上自有主力、按 n^0.43 配比，最后用『先博后精』的学徒制把『会』练成『熟』。",
      "analogy": {
        "title": "手法大库",
        "text": "<b>一万小时</b>、七种窑炉、六十八种器型——先博后精，学徒成师。",
        "componentId": "ch7-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "数据策展四步",
          "desc": "步进数据策展四步：<b>①倾入</b>（开源 9.1%：OXE Magic Soup/Bridge/DROID，低频 2-10Hz 但场景广）→ <b>②自有主力</b>（903M 步：单臂 106M+双臂 797M，1 万小时 68 任务）→ <b>③配比</b>（任务-平台按 n^0.43 降权；动作零填充到最大 18 维；缺图槽掩码）→ <b>④学徒制</b>（预训练博采→后训练 5-100+ 小时精修，类比 LLM 预/后训练）。",
          "componentId": "ch7-library",
          "figure": "./images/figure-4.png"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "七种窑炉配置台",
          "desc": "点选七种训练平台（<b>UR5e / 双臂 UR5e / Franka / 双臂 Trossen / 双臂 ARX / 移动 Trossen / 移动 Fibocom</b>）：看各自的关节配置维、动作维与相机数——全部<b>零填充到统一的 18 维</b>动作空间后同灶混训。",
          "componentId": "ch7-kilns"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "一万小时",
          "desc": "7 平台 68 任务 903M 步"
        },
        {
          "icon": "🔧",
          "title": "n^0.43",
          "desc": "超采样组合降权"
        },
        {
          "icon": "✨",
          "title": "先博后精",
          "desc": "预训练广、后训练精"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "工坊总览",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "最后巡一遍工坊：八个站点串起从观测到动作块执行的整条管线，再由 KV 缓存把推理塞进 0.5 秒。",
      "analogy": {
        "title": "工坊巡查",
        "text": "开工前把<b>每件家什</b>过一遍——件件有讲究。",
        "componentId": "ch8-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "整机管线巡查",
          "desc": "点击画布节点或下方按钮，逐站查看 π0 的整机管线：从<b>观测</b>（2-3 张 RGB+语言+关节角）一路走到<b>动作块执行</b>共八站；选中节点亮绿环，上游站点亮蓝。",
          "componentId": "ch8-arch",
          "figure": "./images/figure-3.png"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "前缀缓存速拉",
          "desc": "步进三次推理循环，看<b>前缀锁定、后缀重算</b>：观测键值首次计算后灰锁；每轮只亮动作后缀的键值块；计时条显示因此省下的计算（计时条为相对示意，非实测毫秒）。",
          "componentId": "ch8-cache"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "一条管线",
          "desc": "观测→骨干→专家→流输出"
        },
        {
          "icon": "🔧",
          "title": "双向注意",
          "desc": "动作整段互相看得见"
        },
        {
          "icon": "✨",
          "title": "前缀缓存",
          "desc": "推理塞进 0.5 秒的另一半"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "出师比武",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "学徒期满，该下山比武了。这一章打三场硬仗——<b>开箱能不能打、听不听得懂指令、学新活快不快</b>，再加一场只有 π0 自己能上场的大师赛：5-20 分钟的长程任务，能不能全都过半？",
      "analogy": {
        "title": "出师比武",
        "text": "三场比武：<b>开箱、听令、学新活</b>——场场见真章。",
        "componentId": "ch9-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "三块比武牌",
          "desc": "切换比武牌看三组柱状对比。<b>开箱五任务</b>：π0（700k 步）全胜，叠衣与易收拾两项近满分；只练 160k 步的算力对齐版仍胜全部基线；470M 的 π0-small 也赢 OpenVLA 与 Octo——OpenVLA 输在自回归离散化、没有动作块。<b>语言跟随</b>：π0 从 flat 到 human、HL 逐档上行，π0-small 却几乎平躺。<b>微调新活</b>：1/5/10 小时三档数据，预训练起步的 π0 常胜自身从零版最多 2×，ACT/DP/OpenVLA/Octo 全程低位。",
          "componentId": "ch9-arena",
          "figure": "./images/figure-7.png"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "大师赛：七项长程任务",
          "desc": "步进七项 <b>5-20 分钟大师任务</b>：叠皱衣、移动叠衣、卸烘干机、新物收拾、纸箱组装、外带盒、装鸡蛋。这些任务其他方法无法解决，只能比 π0 自己的消融——<b>完整配方</b>全场最佳、最难任务提升最大，且<b>所有任务得分均超过最大分的一半</b>（10 trials 平均）。",
          "componentId": "ch9-master",
          "figure": "./images/figure-13.png"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "开箱全胜",
          "desc": "parity 与 π0-small 都赢基线"
        },
        {
          "icon": "🔧",
          "title": "预训练 2×",
          "desc": "新任务 1 小时也领先"
        },
        {
          "icon": "✨",
          "title": "全过半",
          "desc": "5-20 分钟大师任务"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "传世作品与告示",
      "badge": "both",
      "badgeLabel": "进阶·含训练",
      "bridge": "比武归来，开窑验货。这一章把证据摆上评分板——<b>参数、动作块、控制频率、大师赛</b>四项各是什么成色；再把三条边界写成告示贴在门口：好工坊连短板都摆在明处。",
      "analogy": {
        "title": "出窑",
        "text": "作品说话，<b>告示也照贴</b>——好工坊连短板都摆在明处。",
        "componentId": "ch10-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "出窑评分板",
          "desc": "四项证据各看一眼：<b>参数构成</b>——3.3B（3B 掌眼 + 300M 巧手）对 OpenVLA 7B、Octo 0.093B，只示规模、不论优劣；<b>动作块长度</b>——H=50 对无块，越长越撑高频灵巧；<b>控制频率</b>——50Hz 对开源数据的 2-10Hz；<b>大师任务</b>——七项 5-20 分钟长程任务全部超过最大分一半。",
          "componentId": "ch10-evidence",
          "figure": "./images/figure-11.png"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "画廊与告示",
          "desc": "官方画廊七件传世作品（配图即画廊全景）：点任务名换卡片，看每件的一句话难度；再读三张红边告示——<b>配方未明、并非全可靠、边界未试</b>，都是作者自己贴的。看分，也看边界。",
          "componentId": "ch10-gallery",
          "figure": "./images/figure-12.png"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "3.3B>7B",
          "desc": "小队伍+巧手专家胜大而无块"
        },
        {
          "icon": "🔧",
          "title": "全过半",
          "desc": "大师任务的历史性门槛"
        },
        {
          "icon": "✨",
          "title": "三条告示",
          "desc": "配方、可靠性、边界"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1kreGzkEHx",
      "title": "具身智能π0简介",
      "reason": "π0 入门首选简介",
      "cover": "https://i2.hdslb.com/bfs/archive/b0d524b8948d1861f8e9ffc0ba3367fbb560d898.jpg",
      "views": "4359播放"
    },
    {
      "bvid": "BV12Wh965EUk",
      "title": "论文精读-π0: 一种用于通用机器人控制的视觉-语言-动作流模型",
      "reason": "与本论文逐节对应的唯一精读（内容对口优先于播放量）",
      "cover": "https://i0.hdslb.com/bfs/archive/6205b96dac24bbf8633ec846a212c247d6152dc4.jpg",
      "views": "27播放"
    },
    {
      "bvid": "BV1DMYT6dE8K",
      "title": "VLA 入门第二讲：Physical Intelligence 的 π0.5",
      "reason": "VLA 系列脉络讲解",
      "cover": "https://i0.hdslb.com/bfs/archive/1e6d608af66cf84b10216d291512800f8e78a1f2.jpg",
      "views": "3169播放"
    },
    {
      "bvid": "BV1ip3b6gEip",
      "title": "π0→π0.7 全拆解：机器人大模型进化史",
      "reason": "π 系列后续进化全景",
      "cover": "https://i0.hdslb.com/bfs/archive/6798a7c4ee886a96bc025958d3e421c7ba2c694d.jpg",
      "views": "7573播放"
    }
  ]
};
