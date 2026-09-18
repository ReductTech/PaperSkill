import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "World-Language-Action Model for Unified World Modeling, Language Reasoning, and Action Synthesis",
    "titleZh": "世界-语言-动作模型：统一世界建模、语言推理与动作合成",
    "venue": "arXiv:2606.05979v1 · 2026",
    "authors": "Yi Yang, Zhihong Liu, Siqi Kou, Yiyang Chen, Yanzhe Hu, Jianbo Zhou, Boyuan Zhao, Zhijie Wei, Xiao Xia, Xueqi Li, Pengfei Liu, Zhijie Deng",
    "affiliation": "上海交通大学（SJTU）等 7 家单位，通讯作者 Zhijie Deng",
    "domain": "具身智能 / 机器人操作 / 世界模型 / 视觉-语言-动作模型",
    "coreProblem": "只预测下一帧画面的世界-动作模型把容量压在低层像素细节上，长时程任务容易失位；只输出动作的 VLA 又缺少物理动力学的监督信号。",
    "coreInsight": "<b>具身智能</b>要让机器人听懂一句人话、看懂眼前画面，还要动得准。论文提出 <b>WLA（世界-语言-动作模型）</b>：它主张<b>下一状态</b>不该只是下一帧画面，而应同时包含一句<b>文本意图</b>与一段<b>物理动力学</b>——主干用自回归 Transformer 把两者一起预测，世界专家负责想象未来画面、动作专家负责生成动作块，推理时世界专家还能整块丢掉，单张 RTX 5090 上约 40 毫秒产出一次动作。本教程用<b>台球练习</b>作贯穿全篇的比喻：一杆球既要先说清打哪颗（意图），又要控制手感与走位（动力学），而老练的球员会先在脑内比几种走法再挑最稳的一杆——这正对应论文的测试时扩展；十章各换一个动作（摆位、试杆、擦粉、走位、清台……），分别对应论文里的一个概念，每章一屏，用左侧目录或底部按钮推进。",
    "keywords": [
      "具身智能",
      "世界模型",
      "隐动作",
      "测试时扩展",
      "跨构型视频学习"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "世界-动作模型只预测下一帧画面，把容量花在像素细节上；局面一长，靶球就漂出袋口。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "WLA 用自回归主干同时给出<b>文本意图</b>与<b>物理动力学</b>，动作由隐动作 h<sub>t</sub> 与本体状态生成。用台球的话说，就是把「打哪颗」和「怎么推」一起想清楚。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "一杆之前：为什么「只看画面」不够",
      "badge": "inf",
      "badgeLabel": "推理必备",
      "bridge": "本节是全篇入口：先把论文要解决的问题说清楚，再建立核心回路——指令 → 意图 + 动力学 → 动作块 → 新观测。全篇共用「台球练习」这一个日常比喻，这一节先从最简单的一杆（白球撞向袋口）开始，让你亲手体会：为什么只盯着画面不够。",
      "analogy": {
        "title": "先看清这一杆要干什么",
        "text": "十章共用「打一杆台球」这一个比喻：一杆球要同时说清「打哪颗」和「怎么推」。可局面越长，越不能只盯着「画面像不像」——你得先说出这一杆要达成什么。",
        "componentId": "ana-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "台面越长，「只看画面」越容易失位",
          "desc": "拖动「任务长度」滑块（1–6 杆，默认 1）把局面拉长，你会看到只对齐画面相似度的打法把球打离目标袋口——这就是「下一状态还需要一句意图」的原因。再按「加入语言意图」切换打法对照，画面与反馈会立刻跟着变。",
          "componentId": "wla-1-1"
        }
      ],
      "insight": "一帧画面说不出「这一杆要达成什么」——WLA 把下一状态拆成一句文本意图和一段物理动力学。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两种现成范式各有缺口",
          "desc": "WAM 只想象画面，VLA 缺少物理预判。"
        },
        {
          "icon": "🔧",
          "title": "WLA 的回路",
          "desc": "指令 → 文本意图 + 物理动力学 → 动作块 → 新观测。"
        },
        {
          "icon": "✨",
          "title": "局面越长，「只看画面」越容易失位",
          "desc": "这正是本文要解决的问题。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "上台前的五样东西：模型到底看什么",
      "badge": "inf",
      "badgeLabel": "推理必备",
      "bridge": "上一章要同时给出意图与动力学，本章先看清它们从哪里来：把当前帧、历史帧、本体状态、指令与记忆五样输入摆清楚，回答「模型凭什么知道做到哪一步了」。",
      "analogy": {
        "title": "先把手架和母球摆好",
        "text": "每一杆之前，球员都会把支撑手架好、把白球摆到起点。WLA 也一样：先把五样输入摆到位，再谈预测。",
        "componentId": "ana-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "输入槽位检查器",
          "desc": "逐个点开左侧五个输入槽（当前帧、历史帧、本体状态、指令、记忆）和右侧两个输出槽（子任务窗口、动作块），看清每一格承担什么。点完之后你会发现：模型不是只看当前一帧，而是带着历史、自身状态、指令和记忆一起做决定。",
          "componentId": "wla-2-1"
        }
      ],
      "formula": {
        "lead": "先说清楚这句话在讲什么：模型把历史帧、当前帧、指令和记忆一起拿来，预测出这一段该做哪些子任务。",
        "unicode": "S<sub>t</sub> = f(o<sub>t−h</sub>, o<sub>t</sub>, ℓ, M)",
        "symbols": [
          {
            "sym": "o_{t−h}",
            "desc": "历史观测帧；图像序列，提供趋势信息。"
          },
          {
            "sym": "o_t",
            "desc": "当前观测帧；图像，H×W×3。"
          },
          {
            "sym": "ℓ",
            "desc": "用户的语言指令；文本。"
          },
          {
            "sym": "M",
            "desc": "记忆缓冲；由历史子任务组成的文本序列。"
          },
          {
            "sym": "S_t",
            "desc": "覆盖未来动作时段 [t, t+n] 的连续子任务窗口；文本序列。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "五样输入里，只有指令和记忆是文本",
          "desc": "模型不是只看当前一帧，它带着历史、自身状态、用户指令和一路累积的记忆一起做决定。"
        },
        {
          "icon": "🔧",
          "title": "记忆不是重读全部历史",
          "desc": "而是一条不断追加的子任务痕迹。"
        },
        {
          "icon": "✨",
          "title": "输出端有两样",
          "desc": "先出子任务窗口，再出动作块。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "两个下一状态：一句意图 + 一段动力学",
      "badge": "inf",
      "badgeLabel": "推理必备",
      "bridge": "本节直接回答第 1 章留下的问题：凭什么能同时说清「做什么」和「怎么动」，它是全篇的核心洞察章。下一状态在这里被拆成两条互补表示——一句<b>文本意图</b>加一段<b>物理动力学</b>。",
      "analogy": {
        "title": "先想清打哪颗，再感觉怎么推",
        "text": "试杆的时候，你一边确认目标，一边用身体记住这一杆的手感——这就是 WLA 同时给出意图和动力学的方式。",
        "componentId": "ana-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "同步对比：只想画面 vs 意图 + 动力学",
          "desc": "按一次「开始这一杆」，两块台面会从同一初始状态、同一时间基同时开球，让你在同一条件下比较两条表示。跑完可以再按一次重放：只对齐画面的一方会一步步偏出袋口，意图 + 动力学的一方则全程停在目标环内。",
          "componentId": "wla-3-1"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "子任务窗口与记忆",
          "desc": "用「上一杆」「下一杆」逐步走完五个时间点，看子任务窗口如何前移、已经说出来的子任务又如何变成一条可追踪的记忆痕迹。走到第 5 步时「下一杆」会禁用，表示这一段已经规划完。",
          "componentId": "wla-3-2"
        }
      ],
      "insight": "只有画面，模型知道「长什么样」却不知道「下一步要做什么」；只有动作，它又不会预判。WLA 把两个下一状态一起预测。",
      "formula": {
        "lead": "这句话说：主干把上下文和已经确定的子任务、以及一组元查询一起读进去，输出物理动力学 h_t。",
        "unicode": "h<sub>t</sub> = f(o<sub>t−h</sub>, o<sub>t</sub>, ℓ, M, S<sub>t</sub>, Q)",
        "symbols": [
          {
            "sym": "h_t",
            "desc": "物理动力学（隐动作）；向量，只保留驱动状态转移的核心信息。"
          },
          {
            "sym": "S_t",
            "desc": "已经确定的文本子任务窗口；文本序列。"
          },
          {
            "sym": "Q",
            "desc": "64 个元查询；形状 64×d，通过因果注意力聚合上下文。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "下一状态不是一张图",
          "desc": "而是一句意图加一段动力学。"
        },
        {
          "icon": "🔧",
          "title": "h_t 可以当成隐动作",
          "desc": "它只保留驱动状态转移的最少信息。"
        },
        {
          "icon": "✨",
          "title": "子任务窗口前移",
          "desc": "走过的那一段自动变成记忆痕迹。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "世界专家：未来那一帧由谁负责想象",
      "badge": "both",
      "badgeLabel": "推理与训练都值得看",
      "bridge": "本节解释「动力学」是怎么被监督出来的：没有下一帧的真值标签时，让一个轻量扩散 Transformer 承担视觉细节，主干只负责核心转移信息。",
      "analogy": {
        "title": "把母球停在打下一杆的位置",
        "text": "会打球的人不只把球打进，还要把白球停在下一杆顺手的位置。这一步「停到哪」，就是物理动力学要负责的事。",
        "componentId": "ana-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "力度 → 走位距离",
          "desc": "拖动「出杆力度」滑块，把母球停进橙色圆环。你会体会到「怎么动」是一个可调、也可被监督的量——打球不只是把球推进袋口，还要决定它停下来时给下一杆留什么位置。",
          "componentId": "wla-4-1"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "世界专家该预测什么",
          "desc": "用两枚芯片分别切换预测目标（整段视频 / 目标帧）与特征类型（语义特征 / VAE 特征），柱状图的高亮、说明区与反馈会随之更新。切换几次你会发现：帧数越密不一定越好，论文也因此选了 VAE 特征（柱高始终是论文数值，不随切换变化）。",
          "componentId": "wla-4-2",
          "figure": "/images/fig10.png"
        }
      ],
      "insight": "未来那一帧没人替模型标注，于是 WLA 让一个轻量的世界专家专门负责视觉细节，主干只保留驱动变化的核心信息。",
      "formula": {
        "lead": "这句话说：世界专家拿到 h_t 和当前帧 o_t 的表示，输出未来的那一帧。",
        "unicode": "o<sub>t+n</sub> = f<sub>wm</sub>(h<sub>t</sub>, o<sub>t</sub>)",
        "symbols": [
          {
            "sym": "o_{t+n}",
            "desc": "未来视觉状态；图像，实际监督的是它的 VAE 特征。"
          },
          {
            "sym": "f_wm",
            "desc": "世界专家；轻量扩散 Transformer（SANA-600M），可选在推理时丢弃。"
          },
          {
            "sym": "o_t",
            "desc": "当前观测帧；图像。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "世界专家只负责「下一帧长什么样」",
          "desc": "主干只负责「为什么变」。"
        },
        {
          "icon": "🔧",
          "title": "只预测目标帧比预测整段视频更好",
          "desc": "LIBERO 上 98.2% 对 94.2%。"
        },
        {
          "icon": "✨",
          "title": "选 VAE 特征而不是语义特征",
          "desc": "是因为语义已经由 h_t 承担了。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "元查询：把上下文压成一颗「隐动作」",
      "badge": "both",
      "badgeLabel": "推理与训练都值得看",
      "bridge": "本节回答「意图和动力学怎么接起来」这个问题：它引入<b>隐式条件化</b>这个关键设计，并交代推理时为什么可以省掉世界专家这块算力。",
      "analogy": {
        "title": "杆头擦匀，杆才咬得住球",
        "text": "出杆前擦一点巧粉，是为了让皮头和球之间「有抓力」。h_t 对两个专家起的就是这个作用。",
        "componentId": "ana-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "元查询面板",
          "desc": "在图上点击或拖动 6 个元查询圆点之一选中它，看它把哪几路上下文汇总进 h_t；再按开关「推理时丢掉世界专家」，观察世界专家退场后动作为什么仍然能生成。",
          "componentId": "wla-5-1"
        }
      ],
      "insight": "世界专家是训练期的「陪练」，不是推理时的「拐棍」——它把知识压进共享参数后就可以退场。",
      "formula": {
        "lead": "这句话说：动作专家拿到隐动作 h_t 和机器人自己的状态 q_t，输出一段动作。",
        "unicode": "a<sub>t:t+n</sub> = f<sub>act</sub>(h<sub>t</sub>, q<sub>t</sub>)",
        "symbols": [
          {
            "sym": "a_{t:t+n}",
            "desc": "n 步动作块；n×动作维。"
          },
          {
            "sym": "f_act",
            "desc": "动作专家；flow-matching 头（390M 参数）。"
          },
          {
            "sym": "q_t",
            "desc": "本体感受状态；向量，保证动作与机器人当前姿势对齐。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "h_t 不是给动作模块看的图",
          "desc": "而是压出来的「最小够用」信息。"
        },
        {
          "icon": "🔧",
          "title": "元查询负责把上下文分成几路汇总",
          "desc": "再合成一颗 h_t。"
        },
        {
          "icon": "✨",
          "title": "世界专家可以整块丢掉",
          "desc": "这是隐式条件化换来的省算力。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "出杆前先在脑内打三杆：测试时扩展",
      "badge": "inf",
      "badgeLabel": "推理必备",
      "bridge": "本节回答 §5 留下的问题：既然世界专家推理时不用了，它还能干嘛？答案是拿它换来「多花算力更准」的选择权，也就是<b>测试时扩展（TTS）</b>。",
      "analogy": {
        "title": "先试两杆，再打真的一杆",
        "text": "老练的球员会先空杆试摆两下，比较手感再出杆。TTS 就是在想象里做同一件事：先看几种走法，再挑一种。",
        "componentId": "ana-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "候选球路裁决",
          "desc": "先选候选数（3 或 6，默认 3），按「开始」，再按「下一杆」逐个「想象」每个候选执行后的未来帧并比较价值分，最后按「出杆」执行最高分的那一个。走完一遍你就明白：TTS 不是把动作重复几遍，而是先在想象的未来里筛掉会失败的那几种。",
          "componentId": "wla-6-1"
        }
      ],
      "insight": "多花算力不是把同一件事重复做几遍，而是先在想象里把几种未来比一遍。",
      "formula": {
        "lead": "这句话说：某个时间点的价值标签，等于「这局最后成不成」乘上一个越往后越小的折扣。",
        "unicode": "v<sub>t</sub> = y · γ<sup>T−t</sup>",
        "symbols": [
          {
            "sym": "v_t",
            "desc": "时间步 t 的价值标签；标量，训练价值模型用。"
          },
          {
            "sym": "y",
            "desc": "这一局最终成功与否；取值 0 或 1。"
          },
          {
            "sym": "γ",
            "desc": "折扣因子；小于 1，表示越早的状态折扣越少。"
          },
          {
            "sym": "T",
            "desc": "一局的长度；T − t 是剩余步数。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "TTS 采多个候选",
          "desc": "靠世界专家「想象」后果，再让价值模型挑一个。"
        },
        {
          "icon": "🔧",
          "title": "价值标签是「成败 × 剩余时间折扣」",
          "desc": "越接近成功的状态越值钱。"
        },
        {
          "icon": "✨",
          "title": "LIBERO 上把候选数开到 6",
          "desc": "平均成功率从 98.6% 升到 98.9%。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "三份损失一起练：动作、世界、语言",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "这一节从推理技巧回到训练本身：这套东西是怎么练出来的。论文用两处消融说明，三项损失里去掉任何一项都会掉分。",
      "analogy": {
        "title": "同一个球位练到稳",
        "text": "练球不是换着花样打，而是把同一个球位重复到落点稳定。WLA 的训练，也是三份目标同时盯着同一段经验。",
        "componentId": "ana-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "三份损失的配比",
          "desc": "用三枚芯片切换训练配置（完整 / 去掉世界建模损失 / 去掉语言损失），两组柱的高亮、数值与反馈会随之更新。对比之后你会发现两项监督各自值多少：语言监督决定长时程记忆任务的成败，世界建模损失则稳定提升多任务成功率。",
          "componentId": "wla-7-1"
        }
      ],
      "insight": "三份损失不是凑数——语言监督管「长时程还记得住」，世界建模管「多任务更稳」。",
      "formula": {
        "lead": "这句话说：总损失是动作损失、世界建模损失和语言损失三项加权相加。",
        "unicode": "L = L<sub>act</sub> + α·L<sub>wm</sub> + β·L<sub>lang</sub>",
        "symbols": [
          {
            "sym": "L_act",
            "desc": "动作预测的 flow-matching 损失；标量。"
          },
          {
            "sym": "L_wm",
            "desc": "世界建模的 flow-matching 损失；标量，权重 α = 0.1。"
          },
          {
            "sym": "L_lang",
            "desc": "文本子任务的交叉熵损失；标量，权重 β = 0.005。"
          },
          {
            "sym": "α、β",
            "desc": "辅助损失权重；论文取 0.1 与 0.005。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "三项损失一起端到端优化",
          "desc": "不需要先训动作量化器。"
        },
        {
          "icon": "🔧",
          "title": "语言监督是长时程任务的关键",
          "desc": "去掉后 RMBench 从 56.5% 掉到 17.3%。"
        },
        {
          "icon": "✨",
          "title": "世界建模损失带来稳定但更小的提升",
          "desc": "RoboTwin 2.0 Clean 90.98% → 92.94%。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "三件家伙：主干、世界专家、动作专家",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "这一节把前几章的部件拼成一张可点的结构图：它们怎么接在一起，谁在推理时还在。",
      "analogy": {
        "title": "手架稳，杆才走得直",
        "text": "手架负责支撑，杆身负责给力量，皮头负责接触。三件各管一段，少一件这杆就画不稳。",
        "componentId": "ana-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "三件家伙的接线图",
          "desc": "依次点击主干 / 元查询 / 世界专家 / 动作专家四个节点，看清每个部件的作用、规模和它在推理时是否还在；再切换「高效推理模式」开关，观察世界专家退场后整机参数量的变化。也可以对照下方的论文原图 2。",
          "componentId": "wla-8-1",
          "figure": "/images/fig2.png"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "主干 2.1B、世界专家 900M、动作专家 390M",
          "desc": "三件合计 3.4B。"
        },
        {
          "icon": "🔧",
          "title": "推理时世界专家退场",
          "desc": "只剩约 2B 激活参数。"
        },
        {
          "icon": "✨",
          "title": "64 枚元查询和 28 层",
          "desc": "是论文给出的实现细节：每个专家 28 层。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "把 40 毫秒抠出来：加速与消融",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "本章讲工程落地与稳健性：这套结构不仅要准，还要能在机器人上实时跑起来。",
      "analogy": {
        "title": "杆身擦干净，出杆才顺",
        "text": "杆身有一层手汗，出杆就会发涩。工程优化做的事很像擦杆：去掉不必要的摩擦，同样的动作才能做得又快又稳。",
        "componentId": "ana-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "谁在吃时间",
          "desc": "按「开始对比」，两条进度条会从同一基线同时跑完 100 次推理，跑完可再按一次重放。你会看清同一份计算在两条基线上的差距：40 毫秒是论文报告的区间，37.7 毫秒是真实世界实测。",
          "componentId": "wla-9-1"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "三项加速把延迟从约 116 毫秒压到 40 毫秒以内",
          "desc": "真实世界实测 37.7 毫秒。"
        },
        {
          "icon": "🔧",
          "title": "加速的着力点是调度开销、kernel 启动和重复计算",
          "desc": "不是砍模型能力。"
        },
        {
          "icon": "✨",
          "title": "监督要够用，而不是越密越好",
          "desc": "只预测目标帧优于整段视频；但世界建模损失不能去掉——去掉后 RoboTwin 2.0 Clean 从 92.94% 降到 90.98%。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "成绩单与边界：能打多远、哪里还打不好",
      "badge": "both",
      "badgeLabel": "推理与训练都值得看",
      "bridge": "本章收束全篇，交代能打多远、哪里还打不好，并提醒哪些数字不能并列比较。",
      "analogy": {
        "title": "清台收官",
        "text": "一局好不好，看的是整局稳不稳，而不是某一杆漂不漂亮。结果章节要看的，也是同一件事。",
        "componentId": "ana-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "成绩竞赛",
          "desc": "用芯片选一个指标（RoboTwin 2.0 Clean / LIBERO 平均 / RMBench 平均），再按「开始对比」，让几位选手从同一基线起跑、比出各自的名次。看结果时记住两条规矩：越高越好，协议不同不能并列比较。",
          "componentId": "wla-10-1",
          "figure": "/images/fig3.png"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "从视频学新任务，以及它还没学会的",
          "desc": "用「上一个 / 下一个」在五种训练设置之间切换，每切换一次柱与反馈都会更新。走完五档你会看到：不加动作标注的视频确实能学新技能，而人类第一视角视频目前还学不会——这也是作者自述的边界之一。",
          "componentId": "wla-10-2"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "RoboTwin 2.0 Clean 92.94%、LIBERO 平均 98.6%、RMBench 平均 56.5%",
          "desc": "都只用 2B 激活参数且没有具身预训练。"
        },
        {
          "icon": "🔧",
          "title": "无动作标注的视频能学新技能",
          "desc": "同构型视频把新任务平均成功率从 13.0% 提到 34.4%。"
        },
        {
          "icon": "✨",
          "title": "人类第一视角视频目前行不通（7.8% / 7.8%）",
          "desc": "作者推测是域差，也承认真实世界评测规模有限。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV137gW6LEUU",
      "title": "具身智能：从 VLA 到 World Action Model（清华大学计算机系科协）",
      "reason": "正好是本文的动机主线：从 VLA 到 World Action Model 的演进，适合看完全篇后回看整体脉络。",
      "cover": "https://i0.hdslb.com/bfs/archive/bbde27034cf9a29f06510dbae6fdf28246eaaf0e.jpg",
      "views": "2.4万播放"
    },
    {
      "bvid": "BV1CLCzBoEXU",
      "title": "科普！什么是具身智能？VLA vs 世界模型？",
      "reason": "把第 1 章的两类范式差别讲得最直白，适合先建立直觉再进入公式。",
      "cover": "https://i2.hdslb.com/bfs/archive/afe4fedc3a0c80cea9e8c71c78b775925600cc8d.jpg",
      "views": "7.3万播放"
    },
    {
      "bvid": "BV1Zp9dBpEwr",
      "title": "【Frontier】具身的下一战！World Action Model 才是未来！| Nvidia | Jim Fan",
      "reason": "围绕 World Action Model 的观点展开，适合配合第 6、7 章理解「世界预测为什么要接进动作生成」。",
      "cover": "https://i2.hdslb.com/bfs/archive/7a3be2751a92c7ad6b390813a7160e7ad0ae669c.jpg",
      "views": "8736播放"
    },
    {
      "bvid": "BV17ym7BAEMw",
      "title": "【Lumina Talk 第22期】RynnVLA-002：统一具身 VLA 模型和世界模型",
      "reason": "与本论文主干 RynnBrain 属同一研究脉络；播放量偏低但与本文直接相关，故保留。",
      "cover": "https://i1.hdslb.com/bfs/archive/7dfe54cb7577e783b3705ed5d8384d3bc609d758.jpg",
      "views": "1940播放"
    }
  ]
};
