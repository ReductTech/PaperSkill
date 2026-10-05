import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic Control",
    "titleZh": "RT-2：视觉-语言-动作模型将网络知识迁移到机器人控制",
    "venue": "arXiv 预印本 · Google DeepMind · 2023",
    "authors": "Anthony Brohan, Noah Brown, Justice Carbajal, Yevgen Chebotar, Xi Chen, Krzysztof Choromanski, ... , Brianna Zitkovich（共 54 位作者）",
    "affiliation": "Google DeepMind",
    "domain": "机器人控制 · 视觉语言模型 · 大规模预训练",
    "coreProblem": "端到端机器人策略难以把网络规模预训练带来的语义泛化能力，直接用到「像素→动作」的底层控制上。",
    "coreInsight": "把机器人动作表示成与自然语言同构的文本 token，与网络数据一起 co-fine-tuning；推理时反 token 化回动作，让语义理解与动作控制共用同一条生成序列。",
    "keywords": [
      "视觉-语言-动作模型",
      "动作即文本",
      "co-fine-tuning",
      "涌现泛化",
      "机器人控制"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "<b>像素 → 动作</b>：模型只看画面就直接决定手往哪动。它能把具体技能学会，却把网络世界里的<b>语义常识</b>挡在门外，换个物体或背景就容易失手。",
      "figure": "./images/fig1_robot_kitchen.jpg",
      "componentId": "analogy-core"
    },
    "newMethod": {
      "desc": "<b>动作即文本 token</b>：把动作写成和自然语言同构的一串 token，与指令、画面拼进同一条序列交给 VLM。语义知识与手上动作终于走同一条路。",
      "figure": "./images/fig1_robot_kitchen.jpg",
      "componentId": "m-guidance-amount"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "为什么网络世界的知识进不了机器人的手",
      "badge": "inf",
      "badgeLabel": "直觉",
      "bridge": "先别急着看公式。这一章只做一件事：让你亲手把「看得懂」和「做得对」拆开，看看一个只会「像素 → 动作」的模型，到底丢掉了什么。",
      "analogy": {
        "title": "不看指令，直接下锅",
        "text": "手上功夫再熟，若<b>没先看清要求</b>，也只能做出锅里这一盘。模型同理：<b>只有像素到动作</b>的映射，学不到语义常识。",
        "componentId": "analogy-core"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "「先看一眼」能让动作变准吗",
          "desc": "拖动滑块，看看「先看清指令与画面的程度」如何影响这一勺菜是否落到盘子正中央。",
          "componentId": "m-guidance-amount"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "锅里这一幕，到底缺了什么",
          "desc": "看一遍反复重播的厨房场景：同一双手，有没有先看清那句要求，结果完全不同。",
          "componentId": "analogy-core"
        }
      ],
      "insight": "问题不在手不够熟，而在<b>模型没把「看得懂」这件事接到「做得对」上</b>——我们需要一条能把语义理解直接送进动作的通道。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "先看清再动手",
          "desc": "先看清要求再动手，比手有多熟更决定结果。"
        },
        {
          "icon": "🔧",
          "title": "语义被挡在门外",
          "desc": "只学「像素→动作」会把网络预训练里的语义知识挡在门外。"
        },
        {
          "icon": "✨",
          "title": "引出核心通道",
          "desc": "本章的目标是引出「把动作写成语言」这条通道。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "一句话、一幅画面，怎样变成同一种输入",
      "badge": "inf",
      "badgeLabel": "直觉",
      "bridge": "既然模型「看得懂」却「做不对」，那先要弄清它本来在读什么。这一章把模型的输入摊开给你看：它读的不是两样东西，而是一条拼接好的序列。",
      "analogy": {
        "title": "话和画面，要并排看",
        "text": "模型读到的不是两样东西，而是<b>一条把话和画面接在一起的序列</b>。顺序与对齐方式会直接影响它读出的意思。",
        "componentId": "analogy-core"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "指令与画面错开，模型会读错吗",
          "desc": "拖动口味卡，让它与冰箱里的食材对齐，观察右侧两条输入行是否合并成一条连贯序列。",
          "componentId": "m-guidance-amount"
        }
      ],
      "insight": "既然模型读的是<b>一条拼接好的序列</b>，那么只要把动作也写成同样形式的 token，它就能和指令、画面一起被读取。",
      "formula": {
        "lead": "指令与图像被拼成同一条输入序列，动作也要以同样的形式插进来。",
        "unicode": "S = [ instruction tokens ] ⊕ [ image patches ] ⊕ [ action tokens ]",
        "symbols": [
          {
            "sym": "S",
            "desc": "模型实际读取的输入序列（统一表示）。"
          },
          {
            "sym": "instruction tokens",
            "desc": "自然语言指令分词后的 token 序列。"
          },
          {
            "sym": "image patches",
            "desc": "图像切成 patch 后的视觉 token 序列。"
          },
          {
            "sym": "action tokens",
            "desc": "以同样格式写成的动作 token，下一章展开。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "一条序列",
          "desc": "指令与图像会被拼成一条序列，而不是两条独立通道。"
        },
        {
          "icon": "🔧",
          "title": "顺序即语义",
          "desc": "序列中的顺序与对齐决定模型读出的意思。"
        },
        {
          "icon": "✨",
          "title": "接口已备好",
          "desc": "这为「把动作也写成 token」准备好了接口。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "把动作写成一句话：动作与语言的同构",
      "badge": "inf",
      "badgeLabel": "直觉",
      "bridge": "接口已经备好，现在把动作塞进去。这一章是全篇最反直觉的一步：一串普通的数字，凭什么既算文字、又算动作？",
      "analogy": {
        "title": "同一串数字，两种读法",
        "text": "这串数字<b>既是文本，也是动作</b>。VLM 只要会写字，就几乎已经会写动作了。",
        "componentId": "analogy-core"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "同一串数字，两种读法",
          "desc": "切换读法，看同一串数字如何分别被当成文字和动作，以及两种读法是否一致。",
          "componentId": "m-action-read"
        }
      ],
      "insight": "一旦动作变成 token，<b>VLM 的全部预训练知识就自动对动作可用</b>——这正是 RT-2 能涌现语义能力的原因。",
      "formula": {
        "lead": "目标字符串把 8 个动作量按固定顺序写成一串整数。",
        "unicode": "\"terminate  Δpos_x  Δpos_y  Δpos_z  Δrot_x  Δrot_y  Δrot_z  gripper_extension\"",
        "symbols": [
          {
            "sym": "terminate",
            "desc": "回合终止命令（离散位）。"
          },
          {
            "sym": "Δpos_x",
            "desc": "末端位置增量之一（x 方向）。"
          },
          {
            "sym": "Δpos_y",
            "desc": "末端位置增量之一（y 方向）。"
          },
          {
            "sym": "Δpos_z",
            "desc": "末端位置增量之一（z 方向）。"
          },
          {
            "sym": "Δrot_x",
            "desc": "末端旋转增量之一。"
          },
          {
            "sym": "Δrot_y",
            "desc": "末端旋转增量之一。"
          },
          {
            "sym": "Δrot_z",
            "desc": "末端旋转增量之一。"
          },
          {
            "sym": "gripper_extension",
            "desc": "夹爪开合量。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "动作即语言",
          "desc": "动作被写成与自然语言同构的 token 序列。"
        },
        {
          "icon": "🔧",
          "title": "反 token 化",
          "desc": "推理时把 token 还原回动作，即形成闭环控制。"
        },
        {
          "icon": "✨",
          "title": "复用预训练",
          "desc": "关键收益是可以直接复用 VLM 的骨干与预训练。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "把连续的量切成 256 格：离散化怎么不失真",
      "badge": "both",
      "badgeLabel": "直觉 + 训练",
      "bridge": "上一章把动作写成了一串整数，可是动作本来是连续的。这一章回答那个被跳过的问题：连续的量，怎么变成整数而不失真？",
      "analogy": {
        "title": "一点点咸，也要切成格子",
        "text": "连续的量想变成 token，必须先<b>切成有限个格子</b>。格子太稀，动作就会变粗。",
        "componentId": "m-quantize"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "量化粒度决定动作有多细",
          "desc": "拖动咸淡量，观察它被归到哪个 bin，以及右侧动作条的位置误差。",
          "componentId": "m-quantize"
        }
      ],
      "insight": "把动作切成 256 格之后，动作就<b>真的变成了一串普通的整数</b>——可以像单词一样被预测。",
      "formula": {
        "lead": "连续动作量先归一化，再四舍五入映射到 0–255 的整数格。",
        "unicode": "token = round( a_norm × 255 )  ,  a_norm ∈ [0, 1]",
        "symbols": [
          {
            "sym": "a_norm",
            "desc": "归一化后的连续动作量，取值 0–1。"
          },
          {
            "sym": "round",
            "desc": "四舍五入到最近的整数格。"
          },
          {
            "sym": "255",
            "desc": "离散化上限，共 256 个 bin，索引 0–255。"
          },
          {
            "sym": "token",
            "desc": "写进目标字符串的那个整数。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "256 个 bin",
          "desc": "除终止命令外的连续维度被均匀离散为 256 个 bin。"
        },
        {
          "icon": "🔧",
          "title": "精度与长度",
          "desc": "量化粒度直接决定动作精度与 token 长度。"
        },
        {
          "icon": "✨",
          "title": "变成整数",
          "desc": "离散化让连续控制「变成一串可预测的整数」。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "条件化与引导：先说出打算，再动手",
      "badge": "both",
      "badgeLabel": "直觉 + 训练",
      "bridge": "动作已经能被写出来了，可模型怎么知道该写哪个动作？这一章讲两件事：怎么用约束不让它跑偏，怎么用一句「打算」让它写得更聪明。",
      "analogy": {
        "title": "先说打算，再动手",
        "text": "先写下一句<b>怎么做的打算</b>，再去执行，动作就更有方向感。",
        "componentId": "m-plan-action"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "有 Plan 和没 Plan，动作差在哪",
          "desc": "逐步执行，观察先出 Plan 是否让动作更贴近目标指令。",
          "componentId": "m-plan-action"
        }
      ],
      "insight": "引导是双向的——<b>约束输出不让它跑偏，写出 Plan 让它跑得更聪明</b>。",
      "formula": {
        "lead": "机器人任务下只从合法动作 token 中采样，因此输出词表被条件化约束。",
        "unicode": "p( y_t | y_&lt;t , x ) = 0  ,  ∀ y_t ∉ A   （机器人动作任务）",
        "symbols": [
          {
            "sym": "y_t",
            "desc": "第 t 步采样的输出 token。"
          },
          {
            "sym": "y_&lt;t",
            "desc": "已经生成的 token 序列。"
          },
          {
            "sym": "x",
            "desc": "指令与图像输入。"
          },
          {
            "sym": "A",
            "desc": "合法动作 token 集合：256 个 bin × 各维度 + 终止位。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "输出约束",
          "desc": "机器人任务下只从合法动作 token 采样，输出不会跑偏。"
        },
        {
          "icon": "🔧",
          "title": "先 Plan 再行动",
          "desc": "先输出 Plan 再输出动作，能让动作更有方向感。"
        },
        {
          "icon": "✨",
          "title": "定性而非量化",
          "desc": "思维链结论是定性观察，不能当作量化结果。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "控制频率的硬约束：闭环里每一步都重新决定",
      "badge": "inf",
      "badgeLabel": "直觉",
      "bridge": "前面的章节讲的都是「一次怎么想」。可机器人是一步一步做的。这一章把动作放回时间轴上，让你亲手感到：看得越勤，动作越跟得上。",
      "analogy": {
        "title": "尝一口，再改一铲",
        "text": "闭环的意思不是一次做完，而是<b>每一步都重新看一眼</b>。看得越勤，动作越跟得上。",
        "componentId": "m-closed-loop"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "控制频率不够，动作会发飘",
          "desc": "拖动推理频率，观察手在固定时间窗内能完成几次纠正，以及轨迹是否稳定。",
          "componentId": "m-closed-loop"
        }
      ],
      "insight": "把「重新看一眼」做成闭环，是 RT-2 能完成长程任务的原因；<b>而频率就是它的天花板</b>。",
      "formula": {
        "lead": "闭环控制的周期由推理频率决定，频率越低，两次纠正之间的间隔越长。",
        "unicode": "Δt = 1 / f  ,  f ∈ [1, 3] Hz（55B）  或  f ≈ 5 Hz（5B）",
        "symbols": [
          {
            "sym": "f",
            "desc": "推理频率，单位 Hz。"
          },
          {
            "sym": "Δt",
            "desc": "两次动作决策之间的时间间隔，单位秒。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "逐步闭环",
          "desc": "闭环每一步都重新观测、预测、执行。"
        },
        {
          "icon": "🔧",
          "title": "吞吐上限",
          "desc": "55B 约 1–3 Hz、5B 约 5 Hz 是本方法的吞吐上限。"
        },
        {
          "icon": "✨",
          "title": "现实瓶颈",
          "desc": "高频控制受限是这套方法的现实瓶颈。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "从零学、只会照抄、带着家常功夫学",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "动作能写、约束能管、闭环能转，可这些能力从哪来？这一章看三种训练方式，找出「一起学」为什么比「只学机器人数据」更稳。",
      "analogy": {
        "title": "三种学菜方式",
        "text": "<b>从零开始</b>最难，<b>只照抄</b>能学会但不会变通，<b>带着家常功夫学</b>最稳。",
        "componentId": "m-recipe-chips",
        "figure": "./images/fig2_emergent_grid.png"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "为什么「带着网络知识一起学」更泛化",
          "desc": "切换三种训练方式，比较它们在同一组未见场景上的表现。",
          "componentId": "m-recipe-chips",
          "figure": "./images/fig6a_emergent_bars.png"
        }
      ],
      "insight": "关键不是「要不要用机器人数据」，而是<b>别在用机器人数据时把网络知识忘掉</b>。",
      "formula": {
        "lead": "训练时把网络数据与机器人数据按权重混合，一起参与微调。",
        "unicode": "L = Σ  w_net · ℓ(net sample)  +  w_robot · ℓ(robot sample)",
        "symbols": [
          {
            "sym": "L",
            "desc": "总训练损失。"
          },
          {
            "sym": "ℓ",
            "desc": "单个样本的自回归 token 预测损失。"
          },
          {
            "sym": "w_net",
            "desc": "网络数据的采样权重。"
          },
          {
            "sym": "w_robot",
            "desc": "机器人数据的采样权重，被上调以平衡批内比例。"
          },
          {
            "sym": "net sample",
            "desc": "网络规模视觉语言数据：VQA、captioning、图文交织。"
          },
          {
            "sym": "robot sample",
            "desc": "RT-1 机器人示范轨迹。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "一起微调",
          "desc": "co-fine-tuning 把网络数据与机器人数据一起微调。"
        },
        {
          "icon": "🔧",
          "title": "优于纯微调",
          "desc": "它明显优于只用机器人数据的朴素微调。"
        },
        {
          "icon": "✨",
          "title": "从零很差",
          "desc": "从零训练即使规模不小也表现很差。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "一条序列走完全程：交互式架构",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "前面每一章各自讲了一步。现在把它们串起来：从一幅画面到一只手，中间到底经过了哪些结构？点开每一处看个清楚。",
      "analogy": {
        "title": "三样东西，一条路",
        "text": "看得见的输入、听得懂的话、做得出的手，<b>被一条序列串起来</b>。",
        "componentId": "m-arch-hotspots"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "从画面到动作，中间发生了什么",
          "desc": "点击架构中的每一处结构，看它的形状与下游路径如何变化。",
          "componentId": "m-arch-hotspots"
        }
      ],
      "insight": "结构上只做了一件事——<b>让动作和语言共用一条生成序列</b>；其余能力都由此而来。",
      "formula": {
        "lead": "整条路径可以写成一次「编码—生成—还原」的映射。",
        "unicode": "action = detokenize( LLM( ViT(image) ⊕ tokens(instruction) ) )",
        "symbols": [
          {
            "sym": "ViT(image)",
            "desc": "视觉编码器把图像切成 patch 后输出的图像 token。"
          },
          {
            "sym": "tokens(instruction)",
            "desc": "指令分词后的文本 token。"
          },
          {
            "sym": "LLM(·)",
            "desc": "自回归地生成下一个 token。"
          },
          {
            "sym": "detokenize(·)",
            "desc": "把动作 token 还原为 7 维动作。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "共用一条序列",
          "desc": "架构把图像、指令、动作放进同一条生成序列。"
        },
        {
          "icon": "🔧",
          "title": "反 token 化",
          "desc": "反 token 化把文本 token 还原成 7 维动作。"
        },
        {
          "icon": "✨",
          "title": "两个实例",
          "desc": "PaLI-X 有 5B/55B 两档，PaLM-E 版为 12B。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "两种装法：tokenizer 绑定与迁移",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "架构清楚了，还差最后一块实现细节：动作 token 到底占词表里的哪一部分？这一章顺手看看这套做法能不能换个环境继续用。",
      "analogy": {
        "title": "装进不同的罐子",
        "text": "同一份调料，<b>可以装进现成的数字罐，也可以占掉不常用的字罐</b>。结果一样能用。",
        "componentId": "m-tokenizer-bind"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "两种绑定方式，同一套动作",
          "desc": "切换绑定方式，看动作 bin 落在词表的哪一部分，以及迁移到仿真的表现。",
          "componentId": "m-tokenizer-bind"
        }
      ],
      "insight": "换一种绑定方式，动作依然能用——<b>这说明关键在「同一条序列」，而不在某个特定模型</b>。",
      "formula": {
        "lead": "Language-Table 场景把动作简化成两个整数，仍按同样的方式写成 token。",
        "unicode": "action = \"X  Y\"  ,  X, Y ∈ { −10, −9, …, +10 }",
        "symbols": [
          {
            "sym": "X",
            "desc": "末端 2D 笛卡尔增量的横坐标设定点，取 21 个整数之一。"
          },
          {
            "sym": "Y",
            "desc": "末端 2D 笛卡尔增量的纵坐标设定点，取 21 个整数之一。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两种绑定",
          "desc": "PaLI-X 绑定整数 token，PaLM-E 覆写 256 个最低频 token。"
        },
        {
          "icon": "🔧",
          "title": "实现细节",
          "desc": "绑定方式属于实现细节，不改变核心思路。"
        },
        {
          "icon": "✨",
          "title": "可迁移",
          "desc": "方法可迁移到 Language-Table 这类开源仿真。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "两盘并排：结果、对比与局限",
      "badge": "both",
      "badgeLabel": "直觉 + 训练",
      "bridge": "方法讲完了，该看它到底换来了什么。这一章在同一张桌上、同一套标准下把各方法并排比较，也把它的边界摆在明处。",
      "analogy": {
        "title": "并排放在一起看",
        "text": "效果好不好，要看<b>同一张桌上、同一套标准</b>下的对比，而不是各说各话。",
        "componentId": "m-result-race",
        "figure": "./images/fig5_langtable.png"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "在未见场景里，差距有多大",
          "desc": "按下开始，看各方法在同一组未见评估上的成功率如何拉开。",
          "componentId": "m-result-race",
          "figure": "./images/fig4_generalization.png"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "把网络知识拿掉，会掉多少",
          "desc": "对照消融实验：去掉 co-fine-tuning 或去掉网络数据后，涌现与泛化能力分别掉到什么水平。",
          "componentId": "m-result-race",
          "figure": "./images/fig6b_ablation.png"
        }
      ],
      "insight": "RT-2 的收益是<b>把网络世界的语义常识带进机器人控制</b>；代价是算力，而边界是「没有学会新动作」。",
      "formula": {
        "lead": "泛化提升用相对倍率表示，倍率取自论文同协议下的成功率之比。",
        "unicode": "relative gain ≈ SR_RT-2 / SR_baseline  →  ≈ 2× (vs RT-1 / MOO) ; ≈ 6× (vs others)",
        "symbols": [
          {
            "sym": "SR_RT-2",
            "desc": "RT-2 在泛化评估上的平均成功率。"
          },
          {
            "sym": "SR_baseline",
            "desc": "基线在相同评估上的平均成功率。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "已见相当",
          "desc": "已见任务与 RT-1 相近，优势在泛化。"
        },
        {
          "icon": "🔧",
          "title": "2 倍与 6 倍",
          "desc": "泛化约为 RT-1/MOO 的 2 倍、其余基线的约 6 倍。"
        },
        {
          "icon": "✨",
          "title": "两条局限",
          "desc": "局限是算力成本高、且没有学会新动作技能。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1UktR6gExP",
      "title": "【全20集】目前B站最全最细的具身智能‌VLA教程，内容涵盖RT-1、Roboflamnigo、MDT、RDT、LAPA等算法，入门到实战！",
      "reason": "全景讲解：从 RT-1 讲到 RT-2，适合建立整体框架与术语。",
      "cover": "https://i1.hdslb.com/bfs/archive/a06ed49fe042c7e39235e9a16a2f15000ebccdbc.jpg",
      "views": "7269播放"
    },
    {
      "bvid": "BV1pa4bzMEQx",
      "title": "从SayCan到VLA模型 VLA的来时路 RT-1 PalmE RT-2 强化学习 模仿学习 VLA原理",
      "reason": "方法脉络：从 SayCan、PaLM-E 到 RT-2，把「动作即文本」的来路讲清楚。",
      "cover": "https://i0.hdslb.com/bfs/archive/6d41c2bd955123c2b804f2a19687de23e07e07dc.jpg",
      "views": "5569播放"
    },
    {
      "bvid": "BV1UBtezaE1t",
      "title": "谷歌DeepMind的RT-2通用机器人模型——基于视觉-语言-动作（VLA）模型",
      "reason": "论文主线：围绕 RT-2 的 VLA 模型逐点展开，对应本教程第 1–5 章。",
      "cover": "https://i0.hdslb.com/bfs/archive/0c4cc7fcff94a108baecfe4934f0a997dadc1155.jpg",
      "views": "5842播放"
    },
    {
      "bvid": "BV1rTihB1ECj",
      "title": "具身智能：RT-2视觉-语言-动作（VLA）模型：用互联网教机器人思考",
      "reason": "焦点短讲：专讲「用互联网教机器人思考」，与涌现能力章节直接呼应。",
      "cover": "https://i0.hdslb.com/bfs/archive/56cfde378ad51bf0753529501e380fffd9089971.jpg",
      "views": "50播放"
    }
  ]
};
