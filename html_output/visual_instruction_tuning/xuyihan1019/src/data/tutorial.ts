import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Visual Instruction Tuning",
    "titleZh": "视觉指令微调 —— 让语言模型学会「看图说话」",
    "venue": "NeurIPS 2023 · arXiv:2304.08485v2",
    "authors": "Haotian Liu, Chunyuan Li, Qingyang Wu, Yong Jae Lee (University of Wisconsin–Madison · Microsoft Research · Columbia University)",
    "affiliation": "University of Wisconsin–Madison / Microsoft Research / Columbia University",
    "domain": "多模态大模型 / 视觉指令微调",
    "coreProblem": "视觉模型过去每个任务单独训练、接口写死；语言模型能听自由指令却看不见。二者之间既缺<b>指令数据</b>，也缺一座把视觉接进语言的桥。",
    "coreInsight": "用纯文本 GPT-4 把图像改写成对话数据，再用<b>一个线性投影</b>把冻结的 CLIP 接到 Vicuna 上做视觉指令微调——数据与极简连接，就是 LLaVA。",
    "keywords": [
      "视觉指令微调",
      "多模态大模型",
      "指令数据合成",
      "视觉问答",
      "LLaVA"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "<b>传统做法</b>：视觉模型按任务单独训练、接口写死；语言模型看不见，接不上。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "<b>本文方法</b>：冻结 CLIP 与 Vicuna，只训一个线性投影并做视觉指令微调。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "老办法：没有翻译本，只能靠人写死",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "建立核心矛盾（能看的不能说、能听的看不见）。为后面所有机制提供动机。",
      "analogy": {
        "title": "一次说完的整段路",
        "text": "没有<b>翻译本</b>时，看见的人只能靠嘴把话一次性说完，听的人一旦漏掉一句就会走偏。",
        "componentId": "ch1-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "没有桥，任务就只能写死",
          "desc": "按「下一步」走过三种做法，看任务一变，旧做法的偏差如何累积。",
          "componentId": "ch1-mod1"
        }
      ],
      "insight": "要的是让「能看的」把场景说成话，让「能听的」照着话做事——而且这份「说法」得靠数据教会它。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "接口写死",
          "desc": "过去每个视觉任务单独训练，换一种问法就失效。"
        },
        {
          "icon": "🔧",
          "title": "缺的是数据",
          "desc": "语言模型能听指令，但缺少「看图 + 指令 → 回答」的数据。"
        },
        {
          "icon": "✨",
          "title": "方向",
          "desc": "把图像信息译成语言，再用指令微调把这条通路练出来。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "把眼前的景物说成话",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "解释数据从哪来。回答第 1 章留下的问题：指令数据怎么在没有人工标注的情况下造出来。",
      "analogy": {
        "title": "看见一样，说出一句",
        "text": "GPT-4 只能读文字，所以图像要先被<b>译成文字</b>：几条描述，加上目标框的坐标。",
        "componentId": "ch2-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "图像怎么变成 GPT 能读的文字",
          "desc": "点选画面里的景物，看它如何进入「描述 + 框坐标」的提示；再切换三种回答类型。",
          "componentId": "ch2-mod1",
          "figure": "./images/table1-instruction-data.png"
        }
      ],
      "insight": "图像的「文字版」一旦存在，纯文本 GPT-4 就能当老师，批量生产指令数据。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "桥梁是文字",
          "desc": "图像先变成描述与框坐标，才能喂给纯文本模型。"
        },
        {
          "icon": "🔧",
          "title": "三类回答",
          "desc": "对话、详细描述、复杂推理，共 15.8 万条。"
        },
        {
          "icon": "✨",
          "title": "只在种子处人工",
          "desc": "人工只写了少量示例，其余由 GPT-4 生成。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "关键一招：一本很薄的翻译本",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "给出本文的架构选择，并说明它刻意轻量。回答第 2 章之后的问题：文字有了，视觉怎么进语言模型。",
      "analogy": {
        "title": "一本很薄的翻译本",
        "text": "视觉特征不需要复杂结构，<b>一个线性投影</b>就能把它译成词向量——薄，但够用。",
        "componentId": "ch3-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "一个线性投影就够了吗",
          "desc": "拖动投影宽度，看视觉 token 与词向量空间的对齐程度如何变化；再对比三种连接方式。",
          "componentId": "ch3-mod1"
        }
      ],
      "insight": "桥越薄，越能把精力放在数据上——而本文的胜负手正是数据。",
      "formula": {
        "lead": "视觉特征乘一个可训练矩阵，就得到与词向量同维度的视觉 token。",
        "unicode": "H_v = W · Z_v，  其中 Z_v = g(X_v)",
        "symbols": [
          {
            "sym": "H_v",
            "desc": "投影后的视觉 token"
          },
          {
            "sym": "W",
            "desc": "可训练线性投影矩阵"
          },
          {
            "sym": "Z_v",
            "desc": "视觉编码器输出特征"
          },
          {
            "sym": "g",
            "desc": "视觉编码器"
          },
          {
            "sym": "X_v",
            "desc": "输入图像"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "极简连接",
          "desc": "一个线性投影就把视觉特征送进词向量空间。"
        },
        {
          "icon": "🔧",
          "title": "刻意轻量",
          "desc": "作者要的是快速迭代数据实验，不是堆结构。"
        },
        {
          "icon": "✨",
          "title": "已知替代",
          "desc": "Flamingo 的门控交叉注意力、BLIP-2 的 Q-Former 更强但更重。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "一问一答：一条序列，只算回答",
      "badge": "both",
      "badgeLabel": "基础 + 进阶",
      "bridge": "把「一条对话」变成可训练的序列。回答：数据怎么组织给自回归模型。",
      "analogy": {
        "title": "只把回答圈起来",
        "text": "一条序列里问题和图像都只是<b>提示</b>，真正要学的是<b>回答</b>——所以只在回答上算损失。",
        "componentId": "ch4-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "一条序列，哪些 token 要学",
          "desc": "用上一步/下一步走过两轮对话，切换「只算回答」开关，看高亮区和损失条。",
          "componentId": "ch4-mod1"
        }
      ],
      "insight": "序列的组织方式决定了模型在学什么——把提示也当答案学，等于教它复读问题。",
      "formula": {
        "lead": "给定图像与指令，模型按自回归方式逐词给出回答的概率。",
        "unicode": "p(X_a | X_v, X_instruct) = ∏_{i=1}^{L} p_θ(x_i | X_v, X_instruct,&lt;i, X_a,&lt;i)",
        "symbols": [
          {
            "sym": "X_a",
            "desc": "回答"
          },
          {
            "sym": "X_v",
            "desc": "图像"
          },
          {
            "sym": "X_instruct",
            "desc": "指令"
          },
          {
            "sym": "L",
            "desc": "序列长度"
          },
          {
            "sym": "x_i",
            "desc": "第 i 个输出 token"
          },
          {
            "sym": "θ",
            "desc": "可训练参数"
          },
          {
            "sym": "X_a,<i",
            "desc": "之前的回答 token"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "统一序列",
          "desc": "多轮对话拼成一条，角色用固定标记分隔。"
        },
        {
          "icon": "🔧",
          "title": "只算回答",
          "desc": "损失只落在助手回答与停止符上。"
        },
        {
          "icon": "✨",
          "title": "首轮随机",
          "desc": "问题与图像谁在前随机，降低顺序偏置。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "两段训练：先认路标，再走全程",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "桥和序列都定了，剩下的问题是<b>怎么训</b>。这一节说明为什么不能一步到位：先在路牌前认字，再走完整条路。",
      "analogy": {
        "title": "先认路标，再上路",
        "text": "一上来就练全程，桥还没对准，语言模型再强也读不懂视觉 token；<b>先对齐，再联合训练</b>。",
        "componentId": "ch5-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "少做第一阶段会损失多少",
          "desc": "切换「两阶段」与「跳过第一阶段」，比较两条曲线与最终准确率。",
          "componentId": "ch5-mod1"
        }
      ],
      "insight": "先让两种表示「对上眼」，再让它们一起学——这就是两阶段的全部道理。",
      "formula": {
        "lead": "两阶段的区别只在可训练参数集合 θ：第一阶段只含投影，第二阶段再加上语言模型。",
        "unicode": "θ = { W }（第一阶段）  →  θ = { W , φ }（第二阶段）",
        "symbols": [
          {
            "sym": "θ",
            "desc": "可训练参数集合"
          },
          {
            "sym": "W",
            "desc": "可训练线性投影矩阵"
          },
          {
            "sym": "φ",
            "desc": "语言模型的参数"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "第一阶段",
          "desc": "冻结两端，只训投影，用 59.5 万图文对训 1 个 epoch。"
        },
        {
          "icon": "🔧",
          "title": "第二阶段",
          "desc": "视觉编码器仍冻结，投影与语言模型联合训练。"
        },
        {
          "icon": "✨",
          "title": "省不得",
          "desc": "跳过第一阶段准确率掉 5.11 个点。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "照着话迈步",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "从训练转到使用。回答：模型实际怎么回答一个问题。",
      "analogy": {
        "title": "一句话一步",
        "text": "每生成一段话，同伴就往前走一步；话说得越清楚，步子越稳。",
        "componentId": "ch6-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "先推理还是先给答案",
          "desc": "用上一步走过 0/6/12 轮，切换「先答」与「先推理」，看收敛标记与准确率。",
          "componentId": "ch6-mod1"
        }
      ],
      "insight": "同样的终点，先推理能少走一半的步数——顺序是效率问题，不是能力问题。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "生成方式",
          "desc": "图像与指令拼成序列，自回归逐词生成回答。"
        },
        {
          "icon": "🔧",
          "title": "顺序影响收敛",
          "desc": "先推理 6 轮收敛，先答要 12 轮。"
        },
        {
          "icon": "✨",
          "title": "终点相近",
          "desc": "两者最终都在 89.77% 附近。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "同一条路，反复走到不用想",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "讲训练强度与稳定性。回答：练多少、练多快。",
      "analogy": {
        "title": "走成肌肉记忆",
        "text": "一遍不够。<b>同一批指令反复练</b>，路径才会被踩实。",
        "componentId": "ch7-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "练几遍才稳",
          "desc": "拖动训练轮数，看路径稳度与训练损失如何变化。",
          "componentId": "ch7-mod1"
        }
      ],
      "insight": "练到「不用想」需要重复，但重复过头并不继续变好。",
      "formula": {
        "lead": "本章复用第 4 章损失式，不新增公式。",
        "unicode": "p(X_a | X_v, X_instruct) = ∏_{i=1}^{L} p_θ(x_i | X_v, X_instruct,&lt;i, X_a,&lt;i)",
        "symbols": [
          {
            "sym": "X_a",
            "desc": "回答"
          },
          {
            "sym": "X_v",
            "desc": "图像"
          },
          {
            "sym": "X_instruct",
            "desc": "指令"
          },
          {
            "sym": "L",
            "desc": "序列长度"
          },
          {
            "sym": "x_i",
            "desc": "第 i 个输出 token"
          },
          {
            "sym": "θ",
            "desc": "可训练参数"
          },
          {
            "sym": "X_a,<i",
            "desc": "之前的回答 token"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "3 个 epoch",
          "desc": "论文在 158K 指令数据上训练 3 轮。"
        },
        {
          "icon": "🔧",
          "title": "小学习率",
          "desc": "2e-5，配合 3% warmup 的余弦调度。"
        },
        {
          "icon": "✨",
          "title": "收益递减",
          "desc": "稳度在 3 轮附近饱和。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "整条导盲链摊开看",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "前面各章的零件在这里装成一台整机。这一节把<b>导盲链</b>摊开：谁在看、谁在说、谁在被训练。",
      "analogy": {
        "title": "把本子塞进链条中间",
        "text": "链条上只有<b>翻译本</b>是新加的，眼睛和嘴都已经很强——这是 LLaVA 的全部结构。",
        "componentId": "ch8-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点一点，看谁在训练",
          "desc": "点击链条上的四个部件，再用芯片切换两个阶段，看每个部件是否被训练。",
          "componentId": "ch8-mod1",
          "figure": "./images/fig1-llava-arch.png"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "两个阶段各训练什么",
          "desc": "切换阶段，比较可训练参数比例与训练时长。",
          "componentId": "ch8-mod2"
        }
      ],
      "insight": "整条链上真正新学的只有一本翻译本和语言模型的微调。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "四个部件",
          "desc": "视觉编码器、投影、语言模型、输出。"
        },
        {
          "icon": "🔧",
          "title": "只有一处新学",
          "desc": "跨模态的只有投影层。"
        },
        {
          "icon": "✨",
          "title": "阶段差异",
          "desc": "第一阶段只训投影（4 小时），第二阶段联合（10 小时）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "换几种说法再走一遍",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "讲数据消融。回答：三类数据各自值多少。",
      "analogy": {
        "title": "同一条路，几种说法",
        "text": "说法不同，同伴走出来的路就不同——<b>数据配比就是说法配比</b>。",
        "componentId": "ch9-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "三类数据各值多少",
          "desc": "切换四种配比，看 LLaVA-Bench (COCO) 相对分如何变化。",
          "componentId": "ch9-mod1"
        }
      ],
      "insight": "三类数据像三种说法，缺哪一种，同伴就在对应的路段上走不好。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "配比关键",
          "desc": "只有对话 73.8，齐全 85.1。"
        },
        {
          "icon": "🔧",
          "title": "少量也有效",
          "desc": "加 5% 描述 + 10% 推理就涨到 80.5。"
        },
        {
          "icon": "✨",
          "title": "互补",
          "desc": "推理能力提升也带动对话表现。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "和另一份录音比一比",
      "badge": "both",
      "badgeLabel": "基础 + 进阶",
      "bridge": "机制讲完，最后看结果。这一节把<b>相对分</b>和边界一起摊开：和对手比，也和给出标准答案的纯文本 GPT-4 比。",
      "analogy": {
        "title": "同一起点的两份录音",
        "text": "和对手、和给出标准答案的纯文本 GPT-4 比，差距和边界都要一起看。",
        "componentId": "ch10-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "谁更好，以及好到什么程度",
          "desc": "按「开始比较」跑一次竞速，切换基准看四组已验证数值与边界说明。",
          "componentId": "ch10-mod1"
        }
      ],
      "insight": "领先是真的，边界也是真的——这套方法强在「用手上有的数据把指令能力练出来」。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "自建基准",
          "desc": "In-the-Wild 上 67.3，对比 BLIP-2 的 38.1。"
        },
        {
          "icon": "🔧",
          "title": "学术基准",
          "desc": "ScienceQA 上组合 GPT-4 裁判达 92.53%。"
        },
        {
          "icon": "✨",
          "title": "读法要谨慎",
          "desc": "都是相对分与自建基准，且有幻觉与偏见。"
        }
      ]
    }
  ]
};
