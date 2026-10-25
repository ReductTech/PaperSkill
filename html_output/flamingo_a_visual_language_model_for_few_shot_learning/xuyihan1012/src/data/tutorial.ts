import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Flamingo: a Visual Language Model for Few-Shot Learning",
    "titleZh": "Flamingo：面向少样本学习的视觉语言模型",
    "venue": "NeurIPS 2022 · arXiv:2204.14198v2",
    "authors": "Alayrac, Donahue, Luc, Miech, Barr, Hasson, Lenc, Mensch, Millican, Reynolds, Ring, Rutherford, Cabi, Han, Gong, Samangooei, Monteiro, Menick, Borgeaud, Brock, Nematzadeh, Sharifzadeh, Binkowski, Barreira, Vinyals, Zisserman, Simonyan (DeepMind)",
    "affiliation": "DeepMind",
    "domain": "视觉语言模型 / 多模态少样本学习",
    "coreProblem": "把多模态模型适配到新任务通常要成千上万条标注并逐任务微调；对比式零样本模型只会给相似度分数、不能生成文字，而已有的视觉条件语言模型在低数据量下表现很弱。",
    "coreInsight": "冻结视觉编码器与语言模型，只用可训练的 Perceiver Resampler 与门控交叉注意力层把两者<b>接起来</b>，再用<b>交错图文数据</b>训练，于是新任务只需在提示里放几个示例即可适配。",
    "keywords": [
      "视觉语言模型",
      "少样本上下文学习",
      "冻结骨干",
      "门控交叉注意力",
      "交错图文数据"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "<b>传统做法</b>：为每个任务重新训练整台模型，需要数千到数十万个标注样本。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "<b>本文方法</b>：冻结视觉编码器与语言模型，只训练 Resampler 和门控交叉注意力层。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "旧办法：把整台模型重练一遍",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "本节建立整篇教程的核心对比：重练 vs 组合。它回答的问题是——为什么换一个任务就要重训一遍，代价到底在哪里。",
      "analogy": {
        "title": "换一首歌就重刻一张唱片",
        "text": "传统做法像每换一个任务就<b>把整张唱片重刻一遍</b>：费力，而且原来刻好的内容也一起被改掉了。Flamingo 不改唱片，只调混音台。",
        "componentId": "ch1-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "重新训练要付多少代价",
          "desc": "按一次开始键，让「每个任务都重训」和「冻结骨干只加少量层」在同样条件下各跑一次，看两条电平表的差距。",
          "componentId": "ch1-mod1"
        }
      ],
      "insight": "需要的是不破坏已训练好的能力、又能接入视觉信息的一种组合方式——而不是把整个模型再练一遍。",
      "formula": {
        "lead": "论文把「看图生成文字」写成一句话：给定交错的图片和文本，模型逐词预测下一段文字。",
        "unicode": "p(y|x) = ∏_{ℓ=1}^{L} p(y_ℓ | y_<ℓ, x_≤ℓ)",
        "symbols": [
          {
            "sym": "y",
            "desc": "文本 token 序列"
          },
          {
            "sym": "x",
            "desc": "视觉输入（图片或视频）序列"
          },
          {
            "sym": "ℓ",
            "desc": "文本 token 的位置"
          },
          {
            "sym": "y_<ℓ",
            "desc": "该位置之前的文本 token 集合"
          },
          {
            "sym": "x_≤ℓ",
            "desc": "该位置可以使用的视觉输入集合，由 φ 决定"
          },
          {
            "sym": "L",
            "desc": "序列中文本 token 的数量"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "痛点真实",
          "desc": "每个任务都重训整台模型，代价是成千上万标注样本和一次完整训练。"
        },
        {
          "icon": "🔧",
          "title": "路线不同",
          "desc": "本文冻结视觉编码器和语言模型，只训练很小的适配层。"
        },
        {
          "icon": "✨",
          "title": "判断标准",
          "desc": "能用几十个示例就适配新任务，才算真正解决这个问题。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "图片如何变成固定数量的视觉 token",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "上一章说「只加少量可训练层」，这一章先看清楚视觉信息进入模型的形状：它是被压缩后进入的。它也为后面「语言查询视觉」做好准备。",
      "analogy": {
        "title": "长曲压成有限提示点",
        "text": "一张图或一段视频的特征数量随分辨率变化，直接拿来做注意力会很不稳定；<b>先压成固定数量的视觉 token</b>，后面才好算。",
        "componentId": "ch2-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "压成固定 64 个视觉 token",
          "desc": "点击输入条上的位置换一张更高分辨率的图或更长的视频，看特征数量变化、而输出 token 数始终锁定在 64。这是理解后面交叉注意力计算量为何可控的关键一步。",
          "componentId": "ch2-mod1",
          "figure": "./images/fig5-resampler.png"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "形状问题",
          "desc": "图像分辨率和视频帧数都是可变的，直接做交叉注意力会让计算量失控。"
        },
        {
          "icon": "🔧",
          "title": "压缩方式",
          "desc": "用一组可学习的 latent query 去交叉注意视觉特征，输出固定 64 个 token。"
        },
        {
          "icon": "✨",
          "title": "适用范围",
          "desc": "同一套 Resampler 在 3B/9B/80B 三个规模上都不变，所以它是可复用的固定小模块。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "关键一招：让新通道从「零」开始",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "这是全文最关键的设计决定。它回答第 1 章留下的问题：怎么在不破坏原有能力的前提下加东西。",
      "analogy": {
        "title": "推子先停在正中间",
        "text": "新加入的通道如果一上来就很响，原来的混音就被冲坏了。<b>把门控的初始值设成 0</b>，等于让新通道从「完全听不见」开始，再慢慢推上来。",
        "componentId": "ch3-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "门控从 0 开始增长",
          "desc": "拖动交叉推子改变 tanh(α) 的大小，观察原始输出与视觉输出的混合比例，以及不加门控时会发生什么。",
          "componentId": "ch3-mod1"
        }
      ],
      "insight": "需要一个能让新模块「无害接入」的机制：先保持原输出不变，再逐步让它参与。",
      "formula": {
        "lead": "新增层的输出先乘一个门控系数，再加回残差连接；门控系数是 tanh(α)，而 α 是可学习标量。",
        "unicode": "y = y + tanh(α_xattn) · attention(q = y, kv = x)　然后　y = y + tanh(α_dense) · ffw(y)",
        "symbols": [
          {
            "sym": "y",
            "desc": "语言侧的特征（同时充当查询）"
          },
          {
            "sym": "x",
            "desc": "视觉侧的特征（充当 key 与 value）"
          },
          {
            "sym": "α_xattn",
            "desc": "交叉注意力分支的门控标量，初始化为 0"
          },
          {
            "sym": "α_dense",
            "desc": "前馈分支的门控标量，初始化为 0"
          },
          {
            "sym": "tanh",
            "desc": "把门控值限制在 (−1, 1) 的双曲正切函数"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "风险所在",
          "desc": "直接插入新层会立刻改变输出，破坏预训练语言模型已有的能力。"
        },
        {
          "icon": "🔧",
          "title": "解决方式",
          "desc": "每层输出乘以 tanh(α)，α 初始化为 0，于是初始状态与原模型等价，再逐步放开。"
        },
        {
          "icon": "✨",
          "title": "代价与收益",
          "desc": "消融显示去掉这个门控，总体得分下降 4.2% 并且训练不稳定。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "用语言去查询视觉",
      "badge": "both",
      "badgeLabel": "基础 + 进阶",
      "bridge": "把第 3 章的「怎么安全接入」变成「接入的是什么」。它回答：视觉信息以什么形式、从哪一侧进入语言模型。",
      "analogy": {
        "title": "谁提问，谁提供素材",
        "text": "在这套设计里，<b>语言的 query 去查询视觉的 key/value</b>：语言决定「想看什么」，视觉提供「有什么可看」。",
        "componentId": "ch4-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "三种条件化方式的取舍",
          "desc": "在 GATED XATTN-DENSE、VANILLA XATTN、GRAFTING 之间切换，比较总体得分、可训练参数量和单步时间。得分最高的那种同时参数最多、单步最慢，所以这里看到的是取舍，而不是单一赢家。",
          "componentId": "ch4-mod1"
        }
      ],
      "formula": {
        "lead": "交叉注意力就是一次标准的注意力计算，只是查询来自语言、键和值来自视觉。",
        "unicode": "attention(Q, K, V) = softmax(QKᵀ / √d_k) V，其中 Q = y，K = V = x",
        "symbols": [
          {
            "sym": "Q",
            "desc": "查询矩阵，来自语言侧特征 y"
          },
          {
            "sym": "K",
            "desc": "键矩阵，来自视觉侧特征 x"
          },
          {
            "sym": "V",
            "desc": "值矩阵，同样来自视觉侧特征 x"
          },
          {
            "sym": "d_k",
            "desc": "键向量的维度，即 D/H（交叉注意力与语言模型为 128，Resampler 为 96）"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "信息流向",
          "desc": "语言侧提问、视觉侧提供内容，方向是单向的「语言查询视觉」。"
        },
        {
          "icon": "🔧",
          "title": "插入位置",
          "desc": "新层夹在冻结的 LM 层之间，而不是堆在整台模型之后。"
        },
        {
          "icon": "✨",
          "title": "取舍意识",
          "desc": "得分最好的配置同时参数最多、单步最慢，论文按硬件条件再决定插入频率。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "一段文字只看最近的那张图",
      "badge": "both",
      "badgeLabel": "基础 + 进阶",
      "bridge": "解决「交错图文里多张图怎么处理」的问题：每个文字位置只看它前面最近的那张图。它也为第 6 章「为什么能用 32 个示例」铺路——训练时最多见过 5 张图，推理时却能扩展到 <b>32 组图文示例</b>。",
      "analogy": {
        "title": "监听只对准最近那一段",
        "text": "交错图文里可能有几十张图，但每个文字位置只需要看<b>它前面最近的那一张</b>；更早的图靠语言模型自己的记忆保留。",
        "componentId": "ch5-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "每个 token 只能看最近一张图",
          "desc": "点击文本位置或监听的图片，看<b>交叉注意力</b>的可见范围如何被限制；再切换到「<b>允许看全部图</b>」的对照组，比较两种规则的可见格数量。",
          "componentId": "ch5-mod1"
        }
      ],
      "formula": {
        "lead": "论文用一个函数 φ 描述「某个文字位置能用到哪些视觉输入」，然后把它写成集合。",
        "unicode": "φ: [1, L] → [0, N]，x_≤ℓ ≜ { x_i | i ≤ φ(ℓ) }",
        "symbols": [
          {
            "sym": "φ",
            "desc": "把文本位置映射到「最近一张图的索引」，没有图片时为 0"
          },
          {
            "sym": "L",
            "desc": "文本 token 数量"
          },
          {
            "sym": "N",
            "desc": "序列中视觉输入的数量"
          },
          {
            "sym": "x_≤ℓ",
            "desc": "第 ℓ 个位置上可以使用的视觉输入集合"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "多图难题",
          "desc": "交错图文里图片数量和位置都不固定，全部互相注意会让计算量和噪声都上升。"
        },
        {
          "icon": "🔧",
          "title": "论文选择",
          "desc": "每个文字位置只看它前面最近的一张图，更早的信息由语言模型自注意力承载。"
        },
        {
          "icon": "✨",
          "title": "直接收益",
          "desc": "训练只见过最多 5 张图，推理时却能利用多达 32 组图文示例。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "推理：把示例垫起来，不改任何权重",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "把前面所有机制落到使用方式上。它回答：训练完之后，用户到底怎么用这个模型完成一个新任务。",
      "analogy": {
        "title": "示例垫排成一条提示",
        "text": "适配新任务时不用改唱片，而是<b>把示例按顺序垫在查询前面</b>，让模型顺着这个提示续写答案。",
        "componentId": "ch6-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "零样本 / 4 示例 / 32 示例的提示",
          "desc": "用上一步和下一步走过 0→4→32 三个档位，看提示里多出了什么、提示有多长、模型如何作答。",
          "componentId": "ch6-mod1"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "使用方式",
          "desc": "不更新任何权重，只用 (图片, 文本) 示例拼提示，然后让模型续写。"
        },
        {
          "icon": "🔧",
          "title": "两种打分",
          "desc": "开放式任务用束搜索生成文本，封闭式任务把候选答案逐个算对数似然再排序。"
        },
        {
          "icon": "✨",
          "title": "边界意识",
          "desc": "示例越多效果越好，但推理成本线性上升；示例过多时收益递减，需要检索选例（第 9 章）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "训练目标：四路数据的加权混合",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "揭示交错图文数据为什么是能力的来源。它回答第 6 章留下的问题：模型凭什么能从示例里学会任务。",
      "analogy": {
        "title": "四路数据的配比",
        "text": "训练不是只用一种数据：<b>交错图文、图文对和视频文本对各有分量</b>，比例调错，能力就会缺一块。",
        "componentId": "ch7-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "调四路数据权重，看损失与总体得分",
          "desc": "拖动四个数据集推子改变权重，观察加权损失条如何变化；再点击「去掉某一路」的预设，看论文消融报告的总体得分。损失条是按权重覆盖度换算的相对示意，得分条只在论文报告过的组合下给出数值。",
          "componentId": "ch7-mod1"
        }
      ],
      "formula": {
        "lead": "训练时把每个数据集的「给定视觉输入、预测文本」的负对数似然算出来，再按权重相加。",
        "unicode": "L = Σ_{m=1}^{M} λ_m · E_{(x,y)~𝒟_m} [ − Σ_{ℓ=1}^{L} log p(y_ℓ | y_<ℓ, x_≤ℓ) ]",
        "symbols": [
          {
            "sym": "M",
            "desc": "训练数据集个数（本文为 4）"
          },
          {
            "sym": "λ_m",
            "desc": "第 m 个数据集的损失权重"
          },
          {
            "sym": "𝒟_m",
            "desc": "第 m 个数据集"
          },
          {
            "sym": "L",
            "desc": "单个序列的文本 token 数"
          },
          {
            "sym": "p(y_ℓ | y_<ℓ, x_≤ℓ)",
            "desc": "给定前文与该位置可用视觉输入时，第 ℓ 个 token 的条件概率"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "数据是关键",
          "desc": "去掉交错图文数据集 M3W，总体得分下降超过 17%，远大于其他数据的贡献。"
        },
        {
          "icon": "🔧",
          "title": "实现细节",
          "desc": "论文在所有数据集上累积梯度，而不是轮换更新，消融显示前者总体得分 70.7 对 62.9。"
        },
        {
          "icon": "✨",
          "title": "结论边界",
          "desc": "权重组合只在小规模上调好再固定，论文未报告的组合不能外推结论。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "架构：一条可点击的信号链",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "把前七章的零件组装成一张可操作的整机图。它回答：这些机制在同一台模型里是怎么连接的，<b>谁被训练、谁被冻结</b>。",
      "analogy": {
        "title": "把两路接进同一条链",
        "text": "视觉编码器和语言模型都保持不动，真正被接进这条链的是<b>中间的 Resampler 与门控交叉注意力层</b>。",
        "componentId": "ch8-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点击信号链，看每个部件被训练还是被冻结",
          "desc": "点击信号链上的任一部件，看它的<b>参数量</b>、是否<b>冻结</b>、以及在数据流里的作用；再用芯片切换模型规模。",
          "componentId": "ch8-mod1",
          "figure": "./images/fig3-architecture.png"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "插入频率与参数预算的取舍",
          "desc": "切换「每层 / 每四层 / 每七层」<b>插入</b>一次，看<b>可训练参数量</b>、单步时间和总体得分如何一起变化。",
          "componentId": "ch8-mod2"
        }
      ],
      "insight": "整台模型里可训练的只是很小的一块——把两个冻结模型的信号接起来的那部分。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "真实结构",
          "desc": "一条从视觉编码器经 Resampler 与门控交叉注意力层到语言模型输出的链，可训练的只有中间两个部件。"
        },
        {
          "icon": "🔧",
          "title": "规模差异",
          "desc": "三个规模主要放大冻结 LM 和可训练交叉注意力层，视觉编码器与 Resampler 尺寸固定。"
        },
        {
          "icon": "✨",
          "title": "工程取舍",
          "desc": "插入频率是效果与算力的直接交换：每四层可省约 66% 训练时间，代价是 1.9% 的总体得分。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "示例太多时：检索选例与工程细节",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "补上前一章「示例越多越贵」的工程解法。它回答：示例多到放不进提示时怎么办，以及数据侧有哪些必须注意的细节。",
      "analogy": {
        "title": "把最像的示例排在最后",
        "text": "提示长度有限，所以不能把所有示例都塞进去。<b>用视觉特征检索最相似的几个，并按相似度递增排序</b>，让最像的那个紧挨查询。",
        "componentId": "ch9-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "选例策略与示例数量上限",
          "desc": "在随机选例、检索选例、检索加排列平均三种策略间切换，并拖动阈值改变入选示例数，看入选数量、相似度排序与得分如何一起变化。",
          "componentId": "ch9-mod1"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "长度限制",
          "desc": "提示放不下成百上千个示例，必须选出少数几个。"
        },
        {
          "icon": "🔧",
          "title": "选择方法",
          "desc": "用冻结视觉编码器的特征检索最相似的示例，并按相似度递增排序，最相似的放在查询之前。"
        },
        {
          "icon": "✨",
          "title": "工程细节",
          "desc": "训练数据做过针对基准的去重与内容过滤；这些步骤不显眼但影响结论可信度。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、边界与结论",
      "badge": "both",
      "badgeLabel": "基础 + 进阶",
      "bridge": "收束全篇。它回答：这些机制合起来到底换来了什么，以及哪些<b>结论不能过度推广</b>。",
      "analogy": {
        "title": "同一起点的一次压轴混音",
        "text": "把同一套模型权重放到不同任务上，<b>只换提示里的示例</b>，就能在多个基准上跑到前列——这是这套设计真正的产出。",
        "componentId": "ch10-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "32 个示例的结果竞速",
          "desc": "按一次比较键，让 <b>32 示例</b>的 Flamingo 与上一版最好结果在同一个基准、<b>同一指标</b>下从同一基准线跑起，再看这条结果的适用边界。",
          "componentId": "ch10-mod1"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "主要结果",
          "desc": "32 个示例、不更新权重，单个模型在 16 个基准中约有六个超过微调最好成绩，并在此前少样本最好结果上大幅领先。"
        },
        {
          "icon": "🔧",
          "title": "再进一步",
          "desc": "允许微调后，在 VQAv2、VATEX、VizWiz、MSRVTTQA、HatefulMemes 五个任务上刷新最好成绩。"
        },
        {
          "icon": "✨",
          "title": "边界同样重要",
          "desc": "分类仍弱于对比模型，开放式生成会幻觉，示例选择敏感且推理成本随示例数增长。"
        }
      ]
    }
  ]
};
