import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Grounded Language-Image Pre-training",
    "titleZh": "GLIP：把目标检测变成「看图找词」",
    "venue": "CVPR 2022 · arXiv:2112.03857v2",
    "authors": "Liunian Harold Li, Pengchuan Zhang, Haotian Zhang, Jianwei Yang, Chunyuan Li, Yiwu Zhong, Lijuan Wang, Lu Yuan, Lei Zhang, Jenq-Neng Hwang, Kai-Wei Chang, Jianfeng Gao",
    "affiliation": "UCLA / Microsoft Research / University of Washington / UW–Madison / Microsoft Cloud and AI / IDEA",
    "domain": "目标检测 / 短语定位 / 开放词表",
    "coreProblem": "检测器只能识别数据集里预先标好的那几千个类别，词表被锁死，罕见和开放概念直接漏检。",
    "coreInsight": "把检测改写成<b>按清单找词</b>：每个框去对齐提示里的短语，再加<b>跨模态深度融合</b>，并用老师模型给海量图文对生成伪框，把词表撑到千万级。",
    "keywords": [
      "目标检测",
      "短语定位",
      "图文预训练",
      "开放词表",
      "深度融合"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "<b>传统做法</b>：检测器只认数据集里标好的那几千类，罕见概念直接漏掉。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "<b>本文方法</b>：把检测改写成按清单找词，词表由提示决定，零样本 COCO 49.8 AP。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "旧办法：背一本分类手册",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "建立「词表被锁死」这一痛点，并引出「换成一张清单」的方向。",
      "analogy": {
        "title": "手册里没有这一页",
        "text": "旧检测器像一本<b>翻不到底的分类手册</b>：手册里没写的概念，它就永远认不出来。",
        "componentId": "ch1-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "手册有多厚，词表就有多大",
          "desc": "用上一步走过三种做法，看能识别多少概念、漏掉多少。",
          "componentId": "ch1-mod1"
        }
      ],
      "insight": "要突破词表，就不能再把类别当成固定的权重，而要把它当成一句话。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "词表锁死",
          "desc": "检测器只能认数据集里标好的那几千类。"
        },
        {
          "icon": "🔧",
          "title": "后果",
          "desc": "罕见与开放概念直接漏检，堆数据也补不上。"
        },
        {
          "icon": "✨",
          "title": "方向",
          "desc": "把「类别」换成可以随便写的描述。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "把检测改写成找词",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "给出全文的核心视角转换。回答第 1 章之后的问题：类别不用权重表示，那用什么。",
      "analogy": {
        "title": "一圈连一行",
        "text": "不再问「这是第几类」，而是问<b>「这一圈最像清单里的哪一行」</b>。",
        "componentId": "ch2-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "每个圈都去对一遍清单",
          "desc": "点一个圈、再点一行，看它们之间的对齐分；对比旧的分类 logits。",
          "componentId": "ch2-mod1",
          "figure": "./images/fig3-grounding.png"
        }
      ],
      "insight": "一旦「类别」变成一句话，模型能认什么就只取决于你会写什么。",
      "formula": {
        "lead": "区域特征和词特征做点积，就得到每个框对每个词的分数。",
        "unicode": "S_ground = O · Pᵀ　　其中 O = Enc_I(Img)，P = Enc_L(Prompt)",
        "symbols": [
          {
            "sym": "O",
            "desc": "区域特征矩阵（N×d）"
          },
          {
            "sym": "P",
            "desc": "词元特征矩阵（M×d）"
          },
          {
            "sym": "S_ground",
            "desc": "对齐分（N×M）"
          },
          {
            "sym": "Enc_I",
            "desc": "视觉编码器"
          },
          {
            "sym": "Enc_L",
            "desc": "语言编码器"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "改写",
          "desc": "检测被改写成「区域对齐短语」。"
        },
        {
          "icon": "🔧",
          "title": "等价",
          "desc": "同一个 DyHead 换写法后 COCO 成绩不变。"
        },
        {
          "icon": "✨",
          "title": "好处",
          "desc": "词表由提示决定，而不是由权重决定。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "一份清单就是分类器",
      "badge": "both",
      "badgeLabel": "基础 + 进阶",
      "bridge": "把 §2 的视角落到公式与工程含义上。回答：那原来的分类器去哪了。",
      "analogy": {
        "title": "清单就是分类器",
        "text": "原来「类别权重」那本厚手册，现在就是<b>手里这张清单</b>。",
        "componentId": "ch3-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "把框拖到对的地方",
          "desc": "拖动一个框，看它和清单各行的分数怎么变；切换「固定类别数」与「自由提示」。",
          "componentId": "ch3-mod1"
        }
      ],
      "insight": "换掉分类器不是换了个小零件，而是换掉了「能认什么」的决定权。",
      "formula": {
        "lead": "把分类器写成点积，就能看出它和 grounding 只差一个矩阵。",
        "unicode": "S_cls = O · Wᵀ　　→　　S_ground = O · Pᵀ",
        "symbols": [
          {
            "sym": "S_cls",
            "desc": "分类 logits（N×c）"
          },
          {
            "sym": "W",
            "desc": "分类器权重（c×d）"
          },
          {
            "sym": "S_ground",
            "desc": "对齐分（N×M）"
          },
          {
            "sym": "P",
            "desc": "词特征（M×d）"
          },
          {
            "sym": "c",
            "desc": "类别数"
          },
          {
            "sym": "M",
            "desc": "词元数"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "只差一个矩阵",
          "desc": "分类器和 grounding 的区别就是 W 还是 P。"
        },
        {
          "icon": "🔧",
          "title": "可换",
          "desc": "换成词特征后，提示能自由写。"
        },
        {
          "icon": "✨",
          "title": "代价",
          "desc": "固定类别时，清单外的东西永远没有名字。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "一行描述被切成几个词块",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "讲清训练时的一个关键工程细节。回答：对齐分是 N×M，标签却是 N×c，怎么对齐。",
      "analogy": {
        "title": "一行拆成几块",
        "text": "「a small vial」在模型眼里是<b>几个词块</b>，监督得落到每一块上。",
        "componentId": "ch4-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "标签怎么落到子词上",
          "desc": "用上一步走过一行描述被拆成词块的过程，看监督格子怎么从 c 列变成 M 列。",
          "componentId": "ch4-mod1"
        }
      ],
      "insight": "分数矩阵是按词元算的，监督就必须按词元给。",
      "formula": {
        "lead": "目标矩阵乘以子词数，损失才能和分数矩阵对齐。",
        "unicode": "T ∈ {0,1}^{N×c}　→　T′ ∈ {0,1}^{N×M}　　L = loss(S_ground, T′)",
        "symbols": [
          {
            "sym": "T",
            "desc": "原匹配矩阵"
          },
          {
            "sym": "T′",
            "desc": "扩展后的匹配矩阵"
          },
          {
            "sym": "N",
            "desc": "区域数"
          },
          {
            "sym": "c",
            "desc": "短语数"
          },
          {
            "sym": "M",
            "desc": "词元数"
          },
          {
            "sym": "S_ground",
            "desc": "对齐分"
          },
          {
            "sym": "L",
            "desc": "损失"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "为什么扩",
          "desc": "M 总大于 c：多词、子词、模板词、[NoObj]。"
        },
        {
          "icon": "🔧",
          "title": "怎么扩",
          "desc": "短语的所有子词都算正，模板词算负。"
        },
        {
          "icon": "✨",
          "title": "推理",
          "desc": "取子词概率的平均作为短语概率。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "边找边看清单",
      "badge": "both",
      "badgeLabel": "基础 + 进阶",
      "bridge": "讲清「对齐分已经够了，为什么还要融合」：<b>晚期融合</b>只在对着清单算完分之后点一次积，<b>深度融合</b>则让两边在最后几层互相看一眼。",
      "analogy": {
        "title": "边找边看清单",
        "text": "找完再对清单是<b>晚期融合</b>；一边找一边看，才是<b>深度融合</b>。",
        "componentId": "ch5-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "什么时候看清单",
          "desc": "切换「找完再对」与「边找边看」，比较零样本 AP 与箭头方向。",
          "componentId": "ch5-mod1"
        }
      ],
      "insight": "「语言感知的视觉特征」不是点积出来的，是层里融出来的。",
      "formula": {
        "lead": "每一层都让两个模态交换上下文向量，再各自更新。",
        "unicode": "O_t2i, P_i2t = X-MHA(O, P)　　O ← O + O_t2i　　P ← P + P_i2t",
        "symbols": [
          {
            "sym": "O",
            "desc": "视觉特征"
          },
          {
            "sym": "P",
            "desc": "语言特征"
          },
          {
            "sym": "X-MHA",
            "desc": "跨模态多头注意力"
          },
          {
            "sym": "O_t2i",
            "desc": "由文本到图像的上下文"
          },
          {
            "sym": "P_i2t",
            "desc": "由图像到文本的上下文"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "差别",
          "desc": "晚期融合只在最后点积，深度融合在最后几层交互。"
        },
        {
          "icon": "🔧",
          "title": "收益",
          "desc": "零样本 COCO 42.9 → 44.9，约 +2 点。"
        },
        {
          "icon": "✨",
          "title": "为什么重要",
          "desc": "只有语言感知的特征，才能一个模型服务所有任务。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "往清单上加行",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "讲清「为什么是 grounding 数据救了罕见类」。回答：清单变长了，模型真的变强了吗。",
      "analogy": {
        "title": "清单越写越长",
        "text": "清单能写多少行，模型就可能认多少概念——<b>grounding 数据的词表大得多</b>。",
        "componentId": "ch6-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "加行加到什么程度",
          "desc": "拖动 grounding 数据量，看罕见类 AP 与词表规模如何变化。",
          "componentId": "ch6-mod1"
        }
      ],
      "insight": "罕见类不是靠「更大的检测集」救的，而是靠「更长的清单」。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "词表对比",
          "desc": "grounding 有数万到十万级短语，检测最多约 2000 类。"
        },
        {
          "icon": "🔧",
          "title": "罕见类收益",
          "desc": "LVIS APr 从 13.5 到 17.7。"
        },
        {
          "icon": "✨",
          "title": "反直觉",
          "desc": "266 万检测图仍输给 66 万检测 + 80 万 grounding。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "熟练者贴便利贴，新手照着找",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "解释数据是怎么从 3M 涨到 27M 的。回答：人工标注不够，哪来的监督。",
      "analogy": {
        "title": "熟练者留便利贴",
        "text": "老师把「猜出来的位置」写成便利贴，<b>学生的监督信号就来自这些便利贴</b>。",
        "componentId": "ch7-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "便利贴从哪来",
          "desc": "用上一步走过老师生成、学生学习的四个阶段，看伪框数量与词表覆盖。",
          "componentId": "ch7-mod1"
        }
      ],
      "insight": "老师不是靠认识那个词，而是靠上下文猜出来的——这正是学生能超过老师的原因。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "数据规模",
          "desc": "3M 人工 + 24M 图文 = 27M grounding。"
        },
        {
          "icon": "🔧",
          "title": "伪框",
          "desc": "7810 万个 >0.5 的高置信框，5840 万个短语。"
        },
        {
          "icon": "✨",
          "title": "为什么能超",
          "desc": "作者的解释：老师靠语言上下文做「有根据的猜测」。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "整条链摊开看",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "把前面几章的零件组装成一张能点的整机图：<b>视觉主干、深度融合、对齐分、损失</b>四段串起来，看检测与 grounding 如何共用同一条链。",
      "analogy": {
        "title": "把链子接通",
        "text": "清单进语言端，杂物进视觉端，中间靠对齐分连起来——<b>一条链，两种任务</b>。",
        "componentId": "ch8-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点一点，看每一段在做什么",
          "desc": "点击链条上的四个部件，看它的输入输出，以及检测与 grounding 如何共用同一条链。",
          "componentId": "ch8-mod1",
          "figure": "./images/fig2-unified.png"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "一张图里两条路",
          "desc": "切换任务，看同一张清单如何从「类别名」变成「自由描述」。",
          "componentId": "ch8-mod2"
        }
      ],
      "insight": "一个模型、一套参数，区别只在你递给它哪张清单。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "四段",
          "desc": "视觉主干、深度融合、对齐分、损失。"
        },
        {
          "icon": "🔧",
          "title": "共用",
          "desc": "检测与 grounding 同参数，只换提示。"
        },
        {
          "icon": "✨",
          "title": "关键",
          "desc": "深度融合让视觉特征语言感知。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "只改清单的写法",
      "badge": "both",
      "badgeLabel": "基础 + 进阶",
      "bridge": "讲清迁移策略与部署价值。回答：新任务来了，要重训多少。",
      "analogy": {
        "title": "只改清单的写法",
        "text": "不换人、不重新训练，<b>把清单写得更具体</b>，同一个模型就能找得更好。",
        "componentId": "ch9-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "到底要改多少",
          "desc": "切换三种适配方式，拖动少样本数量，看 ODinW 平均 AP。",
          "componentId": "ch9-mod1"
        }
      ],
      "insight": "当输出由语言决定，适配新任务的成本就变成「写一句更好的话」。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "数据效率",
          "desc": "零样本 GLIP-T 超过 5-shot 监督 DyHead-T。"
        },
        {
          "icon": "🔧",
          "title": "提示微调",
          "desc": "只调提示嵌入，几乎追平全模型微调。"
        },
        {
          "icon": "✨",
          "title": "只改写法",
          "desc": "不动一个参数，stingray 的 AP50 从 4.6 到 9.7。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "成绩与边界",
      "badge": "both",
      "badgeLabel": "基础 + 进阶",
      "bridge": "收束全篇：列出零样本、微调与跨任务上的成绩，并把这份成绩成立的条件一起摆出来。",
      "analogy": {
        "title": "一间屋子找完",
        "text": "命中率和代价要一起看，<b>也要看清这份成绩是在什么条件下拿到的</b>。",
        "componentId": "ch10-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "零样本、微调、定位各到什么水平",
          "desc": "按「开始比较」跑一次竞速，切换三组已验证结果与边界说明。",
          "componentId": "ch10-mod1"
        }
      ],
      "insight": "这篇真正的贡献不是 +x 个点，而是把「能认什么」从数据集手里交回给了语言。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "零样本",
          "desc": "COCO 49.8、LVIS 26.9，没见过 COCO 图。"
        },
        {
          "icon": "🔧",
          "title": "微调",
          "desc": "COCO 60.8 val / 61.5 test-dev。"
        },
        {
          "icon": "✨",
          "title": "边界",
          "desc": "仍需检测集起步；图文规模规律未研究。"
        }
      ]
    }
  ]
};
