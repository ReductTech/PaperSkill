import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "π0.5: a Vision-Language-Action Model with Open-World Generalization",
    "titleZh": "π0.5：开放世界泛化的视觉-语言-动作模型",
    "venue": "arXiv 2504.16054 · 2025",
    "authors": "Kevin Black, Noah Brown, James Darpinian, Karan Dhabalia, Danny Driess, et al.",
    "affiliation": "Physical Intelligence",
    "domain": "具身智能 · 开放世界泛化 · 共训",
    "coreProblem": "VLA 在实验室内表现亮眼，但离开实验室进入开放世界（没见过的家、物体、布局）还能不能泛化，是悬而未决的问题。",
    "coreInsight": "<b>见过一百家的保洁队，才敢推开第一百零一扇门</b>：五路数据共训（自家机器/别家经验/练习房/拆单笔记/万物图鉴）+ 两段式训练（FAST 速记→流匹配真功夫），π0.5 首次端到端在<b>全新真实家庭</b>完成 10-15 分钟清洁。",
    "keywords": [
      "开放世界泛化",
      "共训",
      "高层推理",
      "流匹配",
      "移动操作"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "<b>旧 VLA 评测</b>：在像训练数据的环境里刷分；推不开陌生的门——开放世界泛化无人验证。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "<b>π0.5</b>：异构共训（多机器人+拆单示范+网页图鉴）+两段式混合训练——首次端到端在全新真实家庭完成多阶段清洁。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "出了实验室还会干活吗",
      "badge": "inf",
      "badgeLabel": "人人必读",
      "bridge": "实验室内刷分如探囊取物，可用户的家从来不是实验室。本章先看清问题：那扇推不开的陌生门，到底难在哪。",
      "analogy": {
        "title": "陌生的大门",
        "text": "在练习房里百战百胜，<b>推开门全是没见过的家</b>——背题时代结束了。",
        "componentId": "ch1-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "同钟对比：旧路线 vs π0.5",
          "desc": "按下共同开始：上=<b>旧路线</b>——只在训练环境内评测的 VLA（熟悉的桌椅一尘不染，红叉出现在新家门上）；下=<b>π0.5</b>——新家推门即扫（绿勾+10-15 分钟多阶段任务徽章）。",
          "componentId": "ch1-openworld"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "开放世界",
          "desc": "没见过的家、物体、布局"
        },
        {
          "icon": "🔧",
          "title": "首次端到端",
          "desc": "新家 10-15 分钟多阶段清洁"
        },
        {
          "icon": "✨",
          "title": "异构共训",
          "desc": "多源知识迁移是钥匙"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "领班喊单，队员动手",
      "badge": "inf",
      "badgeLabel": "人人必读",
      "bridge": "想在新家干活，第一步是会把大任务拆成小步骤。看 π0.5 如何用一个模型、两级推理，先喊单、再动手。",
      "analogy": {
        "title": "喊单与动手",
        "text": "<b>领班先说做什么，队员照着动手</b>——一个大脑，两种角色。",
        "componentId": "ch2-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "步进一个清洁循环",
          "desc": "步进一次清洁循环的四步：<b>①接收总指令</b>（\"把餐具放进水池\"）→ <b>②高层推理</b>：模型输出文字子任务（\"pick up the plate\"，类比链式思考）→ <b>③低层推理</b>：条件于子任务输出动作块（流匹配专家）→ <b>④执行完毕回到②</b>（下一件餐具）。",
          "componentId": "ch2-hierarchy"
        }
      ],
      "formula": {
        "lead": "一个模型两级推理——联合分布按链式法则分解：",
        "unicode": "πθ(a, ℓ̂ | o, ℓ) = πθ(a | o, ℓ̂) · πθ(ℓ̂ | o, ℓ)",
        "symbols": [
          {
            "sym": "ℓ",
            "desc": "总任务指令"
          },
          {
            "sym": "ℓ̂",
            "desc": "模型输出的文字子任务"
          },
          {
            "sym": "a",
            "desc": "动作块"
          },
          {
            "sym": "o",
            "desc": "观测（多相机图像+机器人状态）"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "一个模型",
          "desc": "高层低层同权重"
        },
        {
          "icon": "🔧",
          "title": "类比链式思考",
          "desc": "先想一步再动手"
        },
        {
          "icon": "✨",
          "title": "消融将证明",
          "desc": "这一步贡献巨大"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "五路功课笔记",
      "badge": "inf",
      "badgeLabel": "人人必读",
      "bridge": "拆任务的本事不是天生的，是六路功课喂出来的。翻开每本笔记，看看各路数据分别教了什么。",
      "analogy": {
        "title": "五路功课",
        "text": "自家车队跑过<b>一百家</b>，别家的经验、学校的练习房、领班的拆单笔记、网上的万物图鉴——<b>五路功课</b>缺一不可。",
        "componentId": "ch3-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "点开六路功课笔记",
          "desc": "点击 chips 或画布里的笔记本：MM/ME/CE/HL/WD 五路预训练功课 + 后训练才加入的 <b>VI 口令演练</b>——点哪本，看哪路的内容缩略与配方角色。",
          "componentId": "ch3-sources",
          "figure": "./images/figure-4.png"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "MM 400h·100 家",
          "desc": "最贴近任务的主力"
        },
        {
          "icon": "🔧",
          "title": "ME+CE",
          "desc": "别家机器与练习房的迁移"
        },
        {
          "icon": "✨",
          "title": "WD 万物图鉴",
          "desc": "OOD 语言跟随的功臣"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "清单速记，真功夫",
      "badge": "both",
      "badgeLabel": "进阶·含训练",
      "bridge": "功课怎么消化？答案是两段式：先按清单速记学流程，再用真功夫临场发挥。本章走进训练配方内部。",
      "analogy": {
        "title": "速记与真功夫",
        "text": "<b>学的时候按清单速记</b>（FAST token，学得快），<b>干的时候用真功夫</b>（流匹配，实时好）——两段式两全其美。",
        "componentId": "ch4-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "两段式混合训练步进",
          "desc": "步进六步：<b>①预训练阶段</b>：全部任务（含动作）都是离散 token，标准下一词预测（α=0，280k 步，简单可扩展）→ <b>②FAST 卷轴</b>：动作块压成少量高信息 token → <b>③后训练开始</b>：加随机初始化的动作专家（流匹配）→ <b>④联合损失</b>：文本交叉熵 + α=10.0·流匹配（两种动作表示互不注意）→ <b>⑤推理</b>：自回归出子任务 → <b>⑥10 步去噪</b>条件于子任务出动作块。",
          "componentId": "ch4-hybrid",
          "figure": "./images/figure-3.png"
        }
      ],
      "formula": {
        "lead": "联合训练目标（原文 Eq.1）——",
        "unicode": "L = H(x, f^ℓ) + α·‖ω − a − f^a(a^τ,ω, o, ℓ)‖²，α = 10.0",
        "symbols": [
          {
            "sym": "H",
            "desc": "文本 token 交叉熵（含 FAST 动作 token）"
          },
          {
            "sym": "f^a",
            "desc": "动作专家输出"
          },
          {
            "sym": "α",
            "desc": "流匹配权重"
          },
          {
            "sym": "ω − a",
            "desc": "流匹配目标场"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "预训练 280k 步",
          "desc": "全离散 token，快而稳"
        },
        {
          "icon": "🔧",
          "title": "后训练 80k 步",
          "desc": "加流匹配专家 α=10.0"
        },
        {
          "icon": "✨",
          "title": "推理两跳",
          "desc": "子任务自回归 + 10 步去噪"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "出发前的口令演练",
      "badge": "inf",
      "badgeLabel": "人人必读",
      "bridge": "两段式把「动手」练成了，还差「动嘴」——后训练新增的 VI 语言示范：专家只用一句话，就把拆任务的功夫教给模型。",
      "analogy": {
        "title": "口令演练",
        "text": "出发前，领班<b>用嘴开一遍工</b>：口令本身就是最好的示范数据。",
        "componentId": "ch5-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "VI 语言示范：只用嘴的实况课",
          "desc": "步进一段 <b>VI 语言示范</b>：专家不碰操纵杆，只对机器人喊口令——「捡起蓝衬衫」→「放进洗衣篮」→「擦桌面」→「整理床铺」，共 4 句收拾完整间卧室；每句口令被执行一步（房间整洁度前进一格）。右侧同步显示模型学到的：<b>口令历史 = 训练时的 ℓ̂ 标签</b>——VI 只占高层 MM 例的 ~11%，教的不是动手（低层已会），是拆单。",
          "componentId": "ch5-vi"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "语言当示范",
          "desc": "口令本身就是标签"
        },
        {
          "icon": "🔧",
          "title": "教的是拆单",
          "desc": "高层而非低层"
        },
        {
          "icon": "✨",
          "title": "~11% 占比",
          "desc": "删掉却大降（Fig 13）"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "见过的家越多，新家越稳",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "配方与功课都齐了，现在验货：把训练见过的家从 3 家一路加到 104 家，没见过的家会跟着好多少？",
      "analogy": {
        "title": "走过的路",
        "text": "<b>走过的家越多</b>，下一扇陌生的门越好开——104 家功力≈在新房特训过。",
        "componentId": "ch6-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "环境数扩展：3 → 104 家",
          "desc": "拖动<b>训练环境数</b>滑条（档位 3/12/22/53/82/104；各档同样 40k 步、同样本数，在未见模拟屋评测）：<b>上</b>=走过的房子队列（小房子图标随档位加密）；<b>中</b>=四项测试任务（餐具入池/物品入抽屉/衣物入篮/铺床）成绩柱逐档上升（示意柱，结论以论文 Fig 8 为准）；<b>下</b>=对照条——104 家模型（绿）≈ 测试家特训对照（绿虚线）≫ 无共训基线（红，含测试家数据也不行）。",
          "componentId": "ch6-scaling",
          "figure": "./images/figure-8.png"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "3→104 家",
          "desc": "环境数换泛化"
        },
        {
          "icon": "🔧",
          "title": "打平特训",
          "desc": "104 家 ≈ 测试家对照"
        },
        {
          "icon": "✨",
          "title": "数据救不了配方",
          "desc": "无共训连测试家数据也白搭"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "撤掉一本功课会怎样",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "上一节做加法——见过的家越多，新家越稳；这一节反过来做减法：把五路功课<b>逐本撤走</b>，看哪路教官教出哪种本事。消融实验是配方的验收单，结论写在图 10/11 上：<b>每一路数据都各自扛着一角</b>。",
      "analogy": {
        "title": "抽走功课",
        "text": "撤掉哪本功课，<b>哪种活就变差</b>——五路教官各有分工。",
        "componentId": "ch7-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "消融实验台：逐本撤功课",
          "desc": "切换 chips 做<b>共训消融</b>：左侧五本功课笔记（MM/ME/CE/HL/WD）中被撤的一路变灰打叉；右侧两组成绩柱随之变化——<b>模拟屋四任务</b>总柱与 <b>OOD 语言跟随</b>专项柱。柱高为示意，结论以论文图 10/11 为准。",
          "componentId": "ch7-ablation",
          "figure": "./images/figure-10.png"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "ME/CE 双降",
          "desc": "跨本体迁移双向有价值"
        },
        {
          "icon": "🔧",
          "title": "WD 专攻 OOD",
          "desc": "万物图鉴撑语言理解"
        },
        {
          "icon": "✨",
          "title": "五路缺一不可",
          "desc": "各司其职"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "与老车队同场竞技",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "消融说清了『哪路功课有用』；这一节把五路功课全部装上，跟不读功课的老车队<b>同数据、同算力</b>正面比一场——π0.5 vs π0-FAST+Flow vs π0。结论（图 12）：配方本身，就是超车的全部理由。",
      "analogy": {
        "title": "同场竞技",
        "text": "同样的里程、同样的油——<b>读过五路功课的车队</b>先到。",
        "componentId": "ch8-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "三条泳道：π0.5 vs π0 vs π0-FAST+Flow",
          "desc": "切换 chips 看<b>两种视角</b>：<b>总成绩</b>——π0.5 / π0-FAST+Flow（同两段式但无 HL/WD）/ π0（纯扩散，含 300k 步加练）三柱对比；<b>训练效率</b>——FAST token 与纯扩散的算力账。柱高为示意，结论以论文图 12 为准。",
          "componentId": "ch8-compare",
          "figure": "./images/figure-12.png"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "显著胜出",
          "desc": "同数据同算力下"
        },
        {
          "icon": "🔧",
          "title": "差距来自共训",
          "desc": "HL+WD+两段式"
        },
        {
          "icon": "✨",
          "title": "300k 步也追不上",
          "desc": "配方>堆算力"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "谁来当领班",
      "badge": "both",
      "badgeLabel": "进阶·含训练",
      "bridge": "上一章证明了配方整体能赢过更强的老车队；这一章把放大镜对准<b>领班本人</b>——负责拆任务、喊子任务的高层推理，这份能力到底从哪里来？让七位领班候选同台打分：答案指向同一处——<b>数据，而不是天生的通用模型</b>。",
      "analogy": {
        "title": "选领班",
        "text": "七个领班候选——<b>自家练出来的最会喊单</b>，请来的顾问反而垫底。",
        "componentId": "ch9-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "七位领班候选，同台打分",
          "desc": "点选领班候选（π0.5 完整 / 无 WD / 无 VI / implicit HL / 无 HL / GPT-4 / 人类专家）：七位领班卡片，选中者柱状排名展示（柱高为示意，结论以论文图 13 为准）+ 一句评语——π0.5「最优——<b>甚至超过人类专家</b>」；implicit HL「不喊单但训练读过拆单笔记——<b>大半收益来自数据本身</b>」；GPT-4「零样本当领班<b>最差</b>：VLM 必须用机器人数据适配」。",
          "componentId": "ch9-coach",
          "figure": "./images/figure-13.png"
        }
      ],
      "insight": "拆任务的能力主要<b>从数据里学来</b>，不是天生的：GPT-4 零样本当高层最差，而训练读过拆单数据但不显式喊单的 implicit HL 已拿下大半收益。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "完整版超人类",
          "desc": "数据里学出的拆单最强"
        },
        {
          "icon": "🔧",
          "title": "数据>显式推理",
          "desc": "implicit 第二名说明大半收益在训练"
        },
        {
          "icon": "✨",
          "title": "GPT-4 垫底",
          "desc": "通用 VLM 不适配就不行"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "新家实录与告示",
      "badge": "both",
      "badgeLabel": "进阶·含训练",
      "bridge": "评测的终点不是模拟屋里的分数，而是<b>真刀真枪的新家</b>。这一章先看三所从没进过的真实住家能不能持续干完（卧室 + 厨房），再把论文自己贴在门上的三张「告示」（局限）与一条前景（VI）读给你听。",
      "analogy": {
        "title": "交房",
        "text": "三所从没进过的房子，<b>扫完交付</b>；告示也照贴——好队伍连短板都写在门上。",
        "componentId": "ch10-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "三所真实新家：持续成功",
          "desc": "切换「真实家 / 模拟屋」：真实家 = 三所家（Home 1/2/3）× 任务（抽屉 / 衣物篮 / 餐具入池）成绩展示（示意，结论以论文图 7 为准）+ <b>「模拟屋成绩可代表真实家」</b>徽章；模拟屋 = 可控、可复现的对照环境说明。条件：2-5 分钟多阶段任务 · 10 trials。",
          "componentId": "ch10-real",
          "figure": "./images/figure-6.png"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "新家实录画廊：高亮框走查",
          "desc": "论文图 7 大图内嵌于此：按「下一步」让<b>高亮框沿三段实录移动</b>（Home 1 抽屉 4 步 / Home 2 餐具 3 步 / Home 3 衣物 3 步，共 10 步），每步一句讲解（子任务气泡译文 + 执行内容）；下方三张红边<b>告示卡</b>（部分可观测 / 易分心 / 难开的柜门）+ 绿边前景卡（VI：语言示范是新一代监督模态）+ 官方视频外链。",
          "componentId": "ch10-rollout"
        }
      ],
      "insight": "三所新家<b>持续成功</b>，且模拟屋成绩可代表真实家——但作者把短板也写在门上：部分可观测（臂挡污渍）、易分心（反复开关抽屉）、难开的柜门，以及有限的上下文与记忆。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "三所新家",
          "desc": "持续成功，模拟屋可代表"
        },
        {
          "icon": "🔧",
          "title": "三张告示",
          "desc": "遮挡 / 分心 / 物理难件"
        },
        {
          "icon": "✨",
          "title": "VI 是方向",
          "desc": "语言示范=新监督模态"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1xDLxzuE7q",
      "title": "π0.5：pi0.5机器人在全新环境中自主完成超长任务",
      "reason": "π0.5 实机新家超长任务演示",
      "cover": "https://i2.hdslb.com/bfs/archive/ea0f09817471e6402f68c9feb10582074d7a09a1.jpg",
      "views": "5434播放"
    },
    {
      "bvid": "BV1DMYT6dE8K",
      "title": "VLA 入门第二讲：Physical Intelligence 的 π0.5 怎么让机器人进没见过的家干活",
      "reason": "π0.5 机制系列讲解（VLA 入门系列）",
      "cover": "https://i0.hdslb.com/bfs/archive/1e6d608af66cf84b10216d291512800f8e78a1f2.jpg",
      "views": "4694播放"
    },
    {
      "bvid": "BV1G9Mn6KEa8",
      "title": "【arXiv 2025】π0.5 — 开放世界泛化的视觉-语言-动作模型 — Paper Explain",
      "reason": "唯一逐节论文精读（内容对口优先于播放量）",
      "cover": "https://i1.hdslb.com/bfs/archive/3708509aec89642a0da0b33d4b53b5191877c095.png",
      "views": "225播放"
    },
    {
      "bvid": "BV1fczaBJErf",
      "title": "Physical Intelligence：具身智能VLA模型π0.5",
      "reason": "π0.5 模型概览讲解",
      "cover": "https://i1.hdslb.com/bfs/archive/ad8b19e2ff4b66b6a4f4548c0914fbe907012fe1.jpg",
      "views": "267播放"
    }
  ]
};
