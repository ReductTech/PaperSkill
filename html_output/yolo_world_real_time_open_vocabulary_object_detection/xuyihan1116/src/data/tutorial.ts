import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "YOLO-World: Real-Time Open-Vocabulary Object Detection",
    "titleZh": "YOLO-World：把词表预先录进检测器",
    "venue": "CVPR 2024 · arXiv:2401.17270v3",
    "authors": "Tianheng Cheng, Lin Song, Yixiao Ge, Wenyu Liu, Xinggang Wang, Ying Shan",
    "affiliation": "腾讯 AI Lab / 腾讯 PCG ARC Lab / 华中科技大学",
    "domain": "开放词表检测 / 实时检测 / 视觉语言预训练",
    "coreProblem": "YOLO 只认训练时定好的类别；现有开放词表检测器又靠大主干、还在每张图上重新编码文本，快不起来。",
    "coreInsight": "把词表做成<b>一次性的离线产物</b>：先编码一次，再<b>重参数化进层权重</b>，之后每张图都不用再读提示——开放和实时才能同时成立。",
    "keywords": [
      "开放词表检测",
      "实时检测",
      "视觉语言预训练",
      "重参数化",
      "YOLO"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "<b>传统做法</b>：YOLO 只认训练时定好的类别，册子外的孩子一直点不到。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "<b>本文方法</b>：名单先录一次、再折进权重，之后一眼扫过去——零样本 LVIS 35.4 AP，52 FPS。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "只认旧册子上的名字",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "建立「词表锁死」这一痛点，并引出「换成一份可以随时加名字的点名册」。",
      "analogy": {
        "title": "册子上没有他",
        "text": "旧检测器像一本<b>写死了的册子</b>：册子上没有的名字，坐着也点不到。",
        "componentId": "ch1-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "册子有多厚，能点的名就有多少",
          "desc": "用上一步走过两种做法，看叫对几个人、漏掉几个人。",
          "componentId": "ch1-mod1"
        }
      ],
      "insight": "要让检测器认新东西，得先让「名字」变成可以随时写进去的东西。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "封闭集",
          "desc": "YOLO 只认训练时定好的类别。"
        },
        {
          "icon": "🔧",
          "title": "后果",
          "desc": "册子外的东西，坐着也点不到。"
        },
        {
          "icon": "✨",
          "title": "方向",
          "desc": "把「类别名单」换成可随时增补的花名册。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "名字怎么对上座位上的孩子",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "给出全文的核心改写。回答第 1 章之后的问题：类别号换成文字，那怎么比较。",
      "analogy": {
        "title": "一行名字，一个座位",
        "text": "不再问「这是第几类」，而是问<b>「他像册子上的哪一行」</b>。",
        "componentId": "ch2-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "每个孩子都去对一遍名字",
          "desc": "点一个名字、再点一个座位，看它们之间的相似度；对比旧的类别号。",
          "componentId": "ch2-mod1"
        }
      ],
      "insight": "把类别号换成一段文字，能认什么就只取决于册子上写了什么。",
      "formula": {
        "lead": "目标嵌入和词嵌入各自归一化后点积，就是这一目标对这一词的相似度。",
        "unicode": "s_{k,j} = α · L2-Norm(e_k) · L2-Norm(w_j)^⊺ + β",
        "symbols": [
          {
            "sym": "e_k",
            "desc": "第 k 个目标的嵌入"
          },
          {
            "sym": "w_j",
            "desc": "第 j 个词的嵌入"
          },
          {
            "sym": "L2-Norm",
            "desc": "二范数归一化"
          },
          {
            "sym": "α",
            "desc": "可学缩放"
          },
          {
            "sym": "β",
            "desc": "可学偏移"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "改写",
          "desc": "标注从「框 + 类别号」变成「框 + 文字」。"
        },
        {
          "icon": "🔧",
          "title": "比较",
          "desc": "目标嵌入与词嵌入归一化后点积。"
        },
        {
          "icon": "✨",
          "title": "作用",
          "desc": "α 和 β 让训练更稳。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "开学前录一次，之后不用再翻",
      "badge": "both",
      "badgeLabel": "基础 + 进阶",
      "bridge": "讲清本文最实用的那一步。回答：为什么它既开放又实时。",
      "analogy": {
        "title": "录一次，一直用",
        "text": "名单只读一遍，<b>之后每节课直接扫一眼</b>，不用再翻册子。",
        "componentId": "ch3-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "名单在哪一步被\"装进去\"",
          "desc": "用上一步走过三个环节，看每次扫描图像时还需不需要读名单。",
          "componentId": "ch3-mod1"
        }
      ],
      "insight": "把语言那一步挪到离线，实时才谈得上。",
      "formula": {
        "lead": "离线词表被重参数化成层权重后，推理时不再有文本编码这一步。",
        "unicode": "W_offline = TextEncoder(T_offline)　→　(re-parameterize)　→　检测直接前向",
        "symbols": [
          {
            "sym": "T_offline",
            "desc": "用户离线给定的提示"
          },
          {
            "sym": "W_offline",
            "desc": "离线词表嵌入"
          },
          {
            "sym": "re-parameterize",
            "desc": "把嵌入折进层权重"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "离线词表",
          "desc": "提示只编码一次。"
        },
        {
          "icon": "🔧",
          "title": "重参数化",
          "desc": "词表折进卷积/线性层权重。"
        },
        {
          "icon": "✨",
          "title": "结果",
          "desc": "每张图不再编码文本，实时才成立。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "名字读进脑子里变成可比的分量",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "讲清 §2 那条公式的两个旋钮到底在调什么。",
      "analogy": {
        "title": "把名字摆成一排",
        "text": "名字要先变成<b>可以比远近的分量</b>，才谈得上「像不像」。",
        "componentId": "ch4-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "两个旋钮在调什么",
          "desc": "拖动缩放与偏移，看相似度分布的松紧，以及判定会不会变得犹豫。",
          "componentId": "ch4-mod1"
        }
      ],
      "insight": "相似度要能当分数用，先得把它摆到一个合适的刻度上。",
      "formula": {
        "lead": "归一化保证只比方向、不比长度；仿射把结果挪到合适的刻度。",
        "unicode": "s = α · (L2-Norm(e) · L2-Norm(w)^⊺) + β",
        "symbols": [
          {
            "sym": "e",
            "desc": "目标嵌入"
          },
          {
            "sym": "w",
            "desc": "词嵌入"
          },
          {
            "sym": "α",
            "desc": "缩放"
          },
          {
            "sym": "β",
            "desc": "偏移"
          },
          {
            "sym": "s",
            "desc": "相似度"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "归一化",
          "desc": "只比方向，不比向量长度。"
        },
        {
          "icon": "🔧",
          "title": "两个旋钮",
          "desc": "α 缩放、β 偏移，都可学。"
        },
        {
          "icon": "✨",
          "title": "为什么重要",
          "desc": "这两步让区域-文本训练稳定下来。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "册子上的名字决定先看哪一片",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "讲清 T→I 这一半融合。回答：语言怎么影响「看图」本身。",
      "analogy": {
        "title": "名字照到哪儿",
        "text": "名字不只是事后比对，<b>它先决定老师往哪儿看</b>。",
        "componentId": "ch5-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "名字怎么\"照\"到座位上",
          "desc": "把名字拖到某一列上，看该列特征的通道\"门\"被打开，以及最后的得分。",
          "componentId": "ch5-mod1"
        }
      ],
      "insight": "名字在这里不是比对用的，而是用来「调光」的。",
      "formula": {
        "lead": "每个通道取「图像特征与所有词的最大相似度」，过 sigmoid 得到门，再乘回特征。",
        "unicode": "X′_l = X_l · δ( max_{j∈{1..C}}(X_l · W_j^⊺) )^⊺",
        "symbols": [
          {
            "sym": "X_l",
            "desc": "第 l 层图像特征"
          },
          {
            "sym": "W_j",
            "desc": "第 j 个词的嵌入"
          },
          {
            "sym": "C",
            "desc": "名词数"
          },
          {
            "sym": "δ",
            "desc": "sigmoid"
          },
          {
            "sym": "X′_l",
            "desc": "更新后的特征"
          },
          {
            "sym": "max",
            "desc": "沿通道取最大"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "做法",
          "desc": "max-sigmoid 注意力按通道乘进图像特征。"
        },
        {
          "icon": "🔧",
          "title": "效果",
          "desc": "每个通道有一个「对哪些词敏感」的门。"
        },
        {
          "icon": "✨",
          "title": "消融",
          "desc": "只加这一半，LVIS 22.4 → 23.2。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "老师也会回头看孩子桌上的名牌",
      "badge": "both",
      "badgeLabel": "基础 + 进阶",
      "bridge": "讲清 I→T 这一半融合，与 §5 构成双向。回答：为什么还要反过来改名字。",
      "analogy": {
        "title": "回头改一行",
        "text": "不只看名字认人，<b>也看人回来修名字</b>——两边都要动。",
        "componentId": "ch6-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "反过来也要动",
          "desc": "切换单向/双向，看点过孩子之后册子上的词向量会不会被修正。",
          "componentId": "ch6-mod1"
        }
      ],
      "insight": "名字和图要互相修改，只改一边永远对不齐。",
      "formula": {
        "lead": "把多尺度特征池化成 27 个 patch，用它做一次多头注意力加回词嵌入。",
        "unicode": "W′ = W + MHCA(W, X̃, X̃)　　其中 X̃ ∈ R^{27×D}",
        "symbols": [
          {
            "sym": "W",
            "desc": "词嵌入"
          },
          {
            "sym": "X̃",
            "desc": "池化后的 27 个 patch token"
          },
          {
            "sym": "MHCA",
            "desc": "多头交叉注意力"
          },
          {
            "sym": "D",
            "desc": "嵌入维度"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "做法",
          "desc": "池化成 3×3×3 = 27 个 patch。"
        },
        {
          "icon": "🔧",
          "title": "更新",
          "desc": "用多头注意力把图像信息加回词嵌入。"
        },
        {
          "icon": "✨",
          "title": "消融",
          "desc": "两半都加：23.2 → 23.5；有 GQA 时 29.7 → 31.9。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "整条链摊开看",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "把各章零件组装成可点的整机图。",
      "analogy": {
        "title": "把链子接通",
        "text": "名字进册子、教室进眼睛，中间靠两次对照连起来——<b>一条链，两种场景</b>。",
        "componentId": "ch7-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "点一点，看每一段在做什么",
          "desc": "点击链条上的四个部件，看它的输入输出，以及训练和部署时哪一段不同。",
          "componentId": "ch7-mod1",
          "figure": "./images/fig3-architecture.png"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "同一张链，两种跑法",
          "desc": "切换训练与部署，看词表从哪来、什么时候被编码。",
          "componentId": "ch7-mod2"
        }
      ],
      "insight": "「开放」和「实时」在同一张图里并不矛盾，因为语言那一步被挪走了。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "四段",
          "desc": "文本编码器、YOLO 主干、RepVL-PAN、两个头。"
        },
        {
          "icon": "🔧",
          "title": "训练",
          "desc": "每张 mosaic 现组在线词表（M=80）。"
        },
        {
          "icon": "✨",
          "title": "部署",
          "desc": "离线词表重参数化，不再编码文本。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "每节课临时点几个名字",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "讲清数据是怎么组起来的。回答：开放词表要多少数据才成立。",
      "analogy": {
        "title": "名单一次能写几个",
        "text": "每份名单有上限，<b>写太满容易互相干扰，写太少又学不到东西</b>。",
        "componentId": "ch8-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "名单写多少个才合适",
          "desc": "拖动词表上限，看名单长度与零样本 AP 的示意关系，并对照论文的数据消融。",
          "componentId": "ch8-mod1"
        }
      ],
      "insight": "开放词表不是「词随便加」，而是「每次给一个受控的小词表」。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "在线词表",
          "desc": "每张 mosaic 现组，最多 80 个名词。"
        },
        {
          "icon": "🔧",
          "title": "伪标注",
          "desc": "24.6 万图、82.1 万伪框才把图文数据用起来。"
        },
        {
          "icon": "✨",
          "title": "数据越多越好",
          "desc": "23.5 → 31.9 → 32.5 → 33.0。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "一节课能点几遍名",
      "badge": "both",
      "badgeLabel": "基础 + 进阶",
      "bridge": "讲「实时」到底是多少。回答：开放词表能不能真的跑在实时。",
      "analogy": {
        "title": "点一遍要多久",
        "text": "<b>只看精度会漏掉「能不能实时」</b>，两个轴要一起看。",
        "componentId": "ch9-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "三个型号怎么选",
          "desc": "切型号跑一次竞速，看帧率和精度各自落在哪。",
          "componentId": "ch9-mod1"
        }
      ],
      "insight": "速度不是附赠的，它是用更小的主干换来的。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "三个型号",
          "desc": "S 26.2/74.1，M 31.0/58.1，L 35.0/52.0。"
        },
        {
          "icon": "🔧",
          "title": "参数",
          "desc": "13M / 29M / 48M。"
        },
        {
          "icon": "✨",
          "title": "对比",
          "desc": "比它大的模型慢一到两个数量级。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "成绩与边界",
      "badge": "both",
      "badgeLabel": "基础 + 进阶",
      "bridge": "收束全篇，给结果与边界。",
      "analogy": {
        "title": "一学期结束",
        "text": "成绩要连<b>条件</b>一起看：零样本、微调、以及它仍然点不到的那一类。",
        "componentId": "ch10-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "各条战线分别到什么水平",
          "desc": "按「开始比较」跑一次竞速，切换三组已验证结果与边界说明。",
          "componentId": "ch10-mod1"
        }
      ],
      "insight": "这篇真正的贡献不是多了几个点，而是让「开放词表」第一次能跑在实时档。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "零样本",
          "desc": "LVIS 35.4 AP，同时 52 FPS。"
        },
        {
          "icon": "🔧",
          "title": "微调",
          "desc": "COCO 53.3、LVIS 34.1（只训 base）。"
        },
        {
          "icon": "✨",
          "title": "边界",
          "desc": "帧率口径、伪标注数据、封闭集成绩不可混读。"
        }
      ]
    }
  ]
};
