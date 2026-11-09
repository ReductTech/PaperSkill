import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Grounding DINO: Marrying DINO with Grounded Pre-Training for Open-Set Object Detection",
    "titleZh": "Grounding DINO：给 DINO 装上「看得懂需求」的眼睛",
    "venue": "ECCV 2024 · arXiv:2303.05499v5",
    "authors": "Shilong Liu, Zhaoyang Zeng, Tianhe Ren, Feng Li, Hao Zhang, Jie Yang, Qing Jiang, Chunyuan Li, Jianwei Yang, Hang Su, Jun Zhu, Lei Zhang",
    "affiliation": "清华大学 / IDEA / 港科大 / 港中文（深圳）/ 微软研究院 / 华南理工",
    "domain": "开放集检测 / 指代表达理解 / 跨模态融合",
    "coreProblem": "封闭集检测器只认数据集里预定义的类别；只在一个环节硬塞语言，两个模态又对不齐。",
    "coreInsight": "在<b>三个环节</b>都接进语言：neck 的 feature enhancer、语言引导的 query 选择、跨模态 decoder，让每次对照都在最该发生的地方发生。",
    "keywords": [
      "开放集检测",
      "指代表达理解",
      "跨模态融合",
      "子句级文本",
      "DETR"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "<b>传统做法</b>：检测器只认数据集里预定义的类别，名单外的物体一直漏着。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "<b>本文方法</b>：三个环节都对照语言——零样本 COCO 52.5 AP，ODinW 零样本 26.1。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "只认登记册上的位置",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "建立「封闭集」这一痛点，并引出「换成一张可以随便写的需求卡」的方向。",
      "analogy": {
        "title": "册子上没有他",
        "text": "旧检测器像一本<b>只登记了固定位置的册子</b>：册子上没写的，场上站着也认不出来。",
        "componentId": "ch1-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "册子有多厚，能认的就有多少",
          "desc": "用上一步走过两种做法，看能圈中多少人、漏掉多少人。",
          "componentId": "ch1-mod1"
        }
      ],
      "insight": "要让检测器认新东西，得先把「要认什么」从名单变成一句话。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "封闭集",
          "desc": "检测器只能认数据集里预定义的类别。"
        },
        {
          "icon": "🔧",
          "title": "后果",
          "desc": "册子外的概念，站着也认不出来。"
        },
        {
          "icon": "✨",
          "title": "方向",
          "desc": "把「类别名单」换成可以随便写的需求。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "三个环节都能对照需求",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "给出全文的框架主张。回答第 1 章之后的问题：语言到底该在哪一步接进来。",
      "analogy": {
        "title": "三处都能对照",
        "text": "只看球不看卡、或看完再对卡，都不如<b>三个环节都对照着卡</b>。",
        "componentId": "ch2-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "语言接在哪一步",
          "desc": "切换三个环节，看每一步接上语言后哪些信息变了。",
          "componentId": "ch2-mod1"
        }
      ],
      "insight": "越多环节接上语言，两种模态就对得越齐。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "三个位置",
          "desc": "neck、query 初始化、head。"
        },
        {
          "icon": "🔧",
          "title": "前人只做一个",
          "desc": "GLIP 只做 neck，OV-DETR 只做 query。"
        },
        {
          "icon": "✨",
          "title": "本文三个都做",
          "desc": "这就是 tight fusion。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "边看球边读卡",
      "badge": "both",
      "badgeLabel": "基础 + 进阶",
      "bridge": "把 phase A 落到具体结构。回答：neck 上的融合到底做了什么。",
      "analogy": {
        "title": "边看边对",
        "text": "不是先看完再对卡，而是<b>看着球场的同时一直读卡</b>。",
        "componentId": "ch3-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "一次增强里发生了三次注意力",
          "desc": "点击卡片或球场，看它们之间建立的双向联系，以及三种注意力各自的输出。",
          "componentId": "ch3-mod1"
        }
      ],
      "insight": "「互相看见」比「拼在一起」有用得多。",
      "formula": {
        "lead": "一层增强里，图像和文本各走一次自注意力，再做两次方向相反的交叉注意力。",
        "unicode": "X_I ← DeformAttn(X_I)　　X_T ← SelfAttn(X_T)　　X_I, X_T ← CrossAttn(X_I, X_T)",
        "symbols": [
          {
            "sym": "X_I",
            "desc": "图像特征"
          },
          {
            "sym": "X_T",
            "desc": "文本特征"
          },
          {
            "sym": "DeformAttn",
            "desc": "deformable 自注意力"
          },
          {
            "sym": "SelfAttn",
            "desc": "普通自注意力"
          },
          {
            "sym": "CrossAttn",
            "desc": "双向交叉注意力"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "三次注意力",
          "desc": "自注意力 + 图→文 + 文→图。"
        },
        {
          "icon": "🔧",
          "title": "分工",
          "desc": "图用 deformable，文用普通自注意力。"
        },
        {
          "icon": "✨",
          "title": "效果",
          "desc": "特征在 neck 就对齐了一次。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "先圈出几个苗子",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "讲 phase B，本文最有辨识度的机制。回答：decoder 一开始该看哪里。",
      "analogy": {
        "title": "先圈一小圈人",
        "text": "不用整个场都细看，<b>先按需求圈出最像的几个</b>，后面只重点看他们。",
        "componentId": "ch4-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "阈值调高调低，圈几个人",
          "desc": "拖动阈值，看有多少个位置被圈中、它们和需求的匹配分是多少。",
          "componentId": "ch4-mod1"
        }
      ],
      "insight": "语言在这里第一次直接改写了「模型往哪看」。",
      "formula": {
        "lead": "每个图像 token 先在所有文本 token 上取最高分，再取分数最高的前 Nq 个下标。",
        "unicode": "I_{Nq} = Top_{Nq}( Max^{(−1)}(X_I · X_T^⊺) )",
        "symbols": [
          {
            "sym": "X_I",
            "desc": "图像特征 (N_I×d)"
          },
          {
            "sym": "X_T",
            "desc": "文本特征 (N_T×d)"
          },
          {
            "sym": "Max^(−1)",
            "desc": "沿最后一维取最大"
          },
          {
            "sym": "Top_{Nq}",
            "desc": "取前 Nq 个下标"
          },
          {
            "sym": "I_{Nq}",
            "desc": "选中的下标集合"
          },
          {
            "sym": "Nq",
            "desc": "900"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "打分",
          "desc": "每个图像 token 与所有文本 token 取最高分。"
        },
        {
          "icon": "🔧",
          "title": "取前 Nq",
          "desc": "论文用 Nq = 900，维度 d = 256。"
        },
        {
          "icon": "✨",
          "title": "意义",
          "desc": "语言直接决定了 decoder 先看哪里。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "逐个走近，对着卡确认",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "讲 phase C。回答：圈出苗子之后，怎么把框和词对起来。",
      "analogy": {
        "title": "走到他面前",
        "text": "远处只看得像，<b>走近了对着卡再确认</b>，才知道是不是要找的人。",
        "componentId": "ch5-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "确认的时候还在看卡",
          "desc": "拖动走近某个苗子，看确认框怎么收紧、判定怎么变化。",
          "componentId": "ch5-mod1"
        }
      ],
      "insight": "decoder 多出来的那一路文本注意力，就是「边走边看卡」。",
      "formula": {
        "lead": "每层 decoder 依次做自注意力、图像交叉注意力、文本交叉注意力，再过 FFN。",
        "unicode": "q ← SelfAttn(q)　q ← CrossAttn(q, X_I)　q ← CrossAttn(q, X_T)　q ← FFN(q)",
        "symbols": [
          {
            "sym": "q",
            "desc": "跨模态 query"
          },
          {
            "sym": "X_I",
            "desc": "图像特征"
          },
          {
            "sym": "X_T",
            "desc": "文本特征"
          },
          {
            "sym": "SelfAttn",
            "desc": "自注意力"
          },
          {
            "sym": "CrossAttn",
            "desc": "交叉注意力"
          },
          {
            "sym": "FFN",
            "desc": "前馈层"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "多一路注意力",
          "desc": "每层比 DINO 多一个文本交叉注意力。"
        },
        {
          "icon": "🔧",
          "title": "顺序",
          "desc": "自注意力 → 看图 → 看文本 → FFN。"
        },
        {
          "icon": "✨",
          "title": "效果",
          "desc": "框和词在确认阶段被拉到一起。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "需求要一条一条写",
      "badge": "both",
      "badgeLabel": "基础 + 进阶",
      "bridge": "讲一个容易被忽略但实测有效的细节。回答：需求怎么写，模型才听得清。",
      "analogy": {
        "title": "别揉成一段",
        "text": "关键词堆在一起会<b>互相干扰</b>；一条一句，各自独立才听得清。",
        "componentId": "ch6-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "三种写法，差别在哪",
          "desc": "切换三种文本表示，看词与词之间有没有多余的注意力，以及分数怎么变。",
          "componentId": "ch6-mod1"
        }
      ],
      "insight": "掩码看起来是小技巧，实际决定了「模型听到的是几句独立的话还是一团噪音」。",
      "formula": {
        "lead": "用注意力掩码把不同需求之间的注意力置零。",
        "unicode": "Attn(i, j) = 0　如果 i 与 j 不属于同一子句",
        "symbols": [
          {
            "sym": "Attn",
            "desc": "注意力权重"
          },
          {
            "sym": "i, j",
            "desc": "词元下标"
          },
          {
            "sym": "子句",
            "desc": "一条独立的需求"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "三种写法",
          "desc": "整句、逐词、子句级。"
        },
        {
          "icon": "🔧",
          "title": "整句丢细节",
          "desc": "逐词又互相干扰。"
        },
        {
          "icon": "✨",
          "title": "子句级",
          "desc": "用掩码切断跨类别注意力。"
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
        "text": "卡进语言端、场进视觉端，中间靠三次对照连起来——<b>一条链，两种任务</b>。",
        "componentId": "ch7-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "点一点，看每一段在做什么",
          "desc": "点击链条上的四个部件，看它的输入输出，以及检测与 REC 如何共用同一条链。",
          "componentId": "ch7-mod1",
          "figure": "./images/fig3-framework.png"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "同一张卡，两种问法",
          "desc": "切换检测与 REC，看卡上的内容和最终取哪个输出。",
          "componentId": "ch7-mod2"
        }
      ],
      "insight": "一个模型、一套参数，区别只在你把需求写成类名还是一句话。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "四段",
          "desc": "两个主干、feature enhancer、query 选择、跨模态 decoder。"
        },
        {
          "icon": "🔧",
          "title": "两个损失",
          "desc": "对比损失 + 定位损失。"
        },
        {
          "icon": "✨",
          "title": "两种问法",
          "desc": "检测用类名，REC 用一句话。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "圈对了多少，圈得准不准",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "把两个损失讲清楚。回答：什么叫「圈对了」。",
      "analogy": {
        "title": "圈对，还要圈准",
        "text": "<b>圈错了人</b>是分类的问题，<b>圈得歪</b>是位置的问题，两件事要一起管。",
        "componentId": "ch8-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "两条损失各管什么",
          "desc": "拖动权重，看对比损失与定位损失如何变化，以及它们分别对应哪种错误。",
          "componentId": "ch8-mod1"
        }
      ],
      "insight": "只把词对上或只把框画准，都不算检测成功。",
      "formula": {
        "lead": "分类项是 query 与文本 token 点积后的 focal loss，定位项是 L1 与 GIoU 的加权和。",
        "unicode": "L = L_focal(q · X_T^⊺, t) + λ₁ · L_L1(b, b*) + λ₂ · L_GIoU(b, b*)",
        "symbols": [
          {
            "sym": "q",
            "desc": "跨模态 query"
          },
          {
            "sym": "X_T",
            "desc": "文本特征"
          },
          {
            "sym": "t",
            "desc": "目标词元"
          },
          {
            "sym": "b",
            "desc": "预测框"
          },
          {
            "sym": "b*",
            "desc": "真值框"
          },
          {
            "sym": "L_focal",
            "desc": "焦点损失"
          },
          {
            "sym": "L_L1",
            "desc": "绝对误差"
          },
          {
            "sym": "L_GIoU",
            "desc": "广义交并比损失"
          },
          {
            "sym": "λ₁, λ₂",
            "desc": "权重"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两件事",
          "desc": "分类（对得上词）+ 定位（框得准）。"
        },
        {
          "icon": "🔧",
          "title": "分类",
          "desc": "query 与文本点积，再算 focal loss。"
        },
        {
          "icon": "✨",
          "title": "定位",
          "desc": "L1 + GIoU，先二分匹配再算。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "一张需求卡走遍所有场地",
      "badge": "both",
      "badgeLabel": "基础 + 进阶",
      "bridge": "讲开放集的实用价值与边界。回答：一个模型到底能通用到什么程度。",
      "analogy": {
        "title": "卡不换，场地换",
        "text": "场地、项目、问法都能换，<b>只有卡上的话在变</b>。",
        "componentId": "ch9-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "换场地还要不要重训",
          "desc": "切换三种场景，看同一套参数的表现与代价。",
          "componentId": "ch9-mod1"
        }
      ],
      "insight": "开放集的收益在检测这一侧已经兑现，指代表达那一侧还在半路。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "ODinW",
          "desc": "零样本平均 26.1 AP，当时新高。"
        },
        {
          "icon": "🔧",
          "title": "REC",
          "desc": "加 RefC 到 89～93，零样本只有 ~50。"
        },
        {
          "icon": "✨",
          "title": "应用",
          "desc": "可直接接扩散模型做图像编辑。"
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
        "title": "一场比完",
        "text": "成绩要连<b>条件</b>一起看：零样本、微调、以及论文自己承认的短板。",
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
      "insight": "这篇真正改变的是「检测器能认什么由谁来定」——从数据集交给语言。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "成绩",
          "desc": "零样本 COCO 52.5，微调 62.6/62.7。"
        },
        {
          "icon": "🔧",
          "title": "通用",
          "desc": "ODinW 全量 70.7/76.2，超过更大的 DINO。"
        },
        {
          "icon": "✨",
          "title": "边界",
          "desc": "不能分割、数据少于最大 GLIP、有误报。"
        }
      ]
    }
  ]
};
