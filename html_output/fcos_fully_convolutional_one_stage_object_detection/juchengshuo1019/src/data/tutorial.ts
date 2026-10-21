import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "affiliation": "The University of Adelaide, Australia",
    "authors": "Zhi Tian, Chunhua Shen, Hao Chen, Tong He",
    "coreInsight": "去掉所有锚框：每个特征位置直接量出到目标框四条边的距离来画框，用 FPN 多尺度分层与中心性抑制解决歧义和低质量框。",
    "coreProblem": "主流检测器依赖预制锚框：尺寸、宽高比、数量都要手工调，还要在训练时反复算 IoU 匹配，超参数敏感且计算复杂。",
    "domain": "视觉 · 目标检测",
    "keywords": [
      "anchor-free",
      "逐像素预测",
      "FPN",
      "中心性",
      "focal loss"
    ],
    "titleEn": "FCOS: Fully Convolutional One-Stage Object Detection",
    "titleZh": "FCOS：全卷积单阶段目标检测",
    "venue": "arXiv:1904.01355 (2019)"
  },
  "hero": {
    "newMethod": {
      "componentId": "hero-new",
      "desc": "钉住一个点，直接量出到四条边的距离来形成框。"
    },
    "oldMethod": {
      "componentId": "hero-old",
      "desc": "预先套好锚框：尺寸、宽高比、数量等人工决定，还要算 IoU 做匹配。"
    }
  },
  "chapters": [
    {
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "在认识 FCOS 之前，先看看它要干掉的东西：主流检测器都在用的预制锚框。传统检测器预设锚框，通过调整锚框尺寸、位置等来预测，依赖锚框的选取，并且大量的锚框消耗大量的人力以及算力。",
      "id": "chap-1",
      "insight": "不再套框，通过钉住一个点量出四条边的方式画出框。",
      "kind": "chapter",
      "modules": [
      ],
      "takeaways": [
        {
          "desc": "尺寸、宽高比、数量全是手工超参数，难以调整。",
          "icon": "🔧",
          "title": "锚框的缺点"
        },
        {
          "desc": "密密麻麻的框大多是负样本，正负样本比例失衡。",
          "icon": "⚖️",
          "title": "负样本太多"
        },
        {
          "desc": "每个框都要和标注框算 IoU 做匹配，训练又慢又占内存。",
          "icon": "🧮",
          "title": "算力消耗大"
        }
      ],
      "title": "问题：锚框是怎样工作的？"
    },
    {
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "面对第 1 章的问题。FCOS 的回答是：用位置本身来替代锚框。FCOS 不再把锚框当样本，而是把位置当样本：落在目标框内的点是正样本，落在目标框外的是负样本。",
      "id": "chap-2",
      "insight": "位置本身就是样本——检测于是变成了逐点预测。",
      "kind": "chapter",
      "modules": [
        {
          "componentId": "mod-2-1",
          "desc": "在木板上拖动那颗钉子：看看它在板里、板边、板外时，身份如何变化。",
          "id": "2.1",
          "kind": "module",
          "title": "拖一拖钉位"
        }
      ],
      "takeaways": [
        {
          "desc": "样本不再是锚框，而是特征图上的每个位置。",
          "icon": "📍",
          "title": "位置即样本"
        },
        {
          "desc": "落在框里就是正样本，框外就是负样本——不用算 IoU。",
          "icon": "✅",
          "title": "划分极简"
        },
        {
          "desc": "检测于是和语义分割统一成了逐像素预测。",
          "icon": "🧩",
          "title": "任务统一"
        }
      ],
      "title": "把图片变成逐点表示"
    },
    {
      "badge": "both",
      "badgeLabel": "基础+训练",
      "bridge": "FCOS 在单阶段、FPN、focal loss 这些地方与 RetinaNet 一样，只是每个点不再套框，而是直接量。「直接量」听起来简单，但到底量什么、怎么算？这一章把四个读数落成公式。从每个点出发，往左、上、右、下各量出长度——四个读数就是回归目标 (l*, t*, r*, b*)。",
      "id": "chap-3",
      "insight": "四个距离全是正数——这就是为什么回归头的输出要套一个 exp：把任意实数变成正数。",
      "kind": "chapter",
      "modules": [
        {
          "componentId": "mod-4-1",
          "desc": "拖动钉位：四条尺带实时伸缩，右边的公式读数跟着变",
          "id": "3.1",
          "kind": "module",
          "title": "拉尺读数"
        }
      ],
      "takeaways": [
        {
          "desc": "回归目标 = 四个距离，全是正数。",
          "icon": "📏",
          "title": "四个正数"
        },
        {
          "desc": "输出套 exp(x)，保证预测出来也是正数。",
          "icon": "🔢",
          "title": "exp 保正"
        }
      ],
      "title": "四维回归：l*, t*, r*, b*",
      "formula": {
        "lead": "一句话：回归目标就是点到四条边的距离——验证均为正数",
        "symbols": [
          {
            "desc": "点到左边的距离（正实数）",
            "sym": "l*"
          },
          {
            "desc": "点到上边的距离（正实数）",
            "sym": "t*"
          },
          {
            "desc": "点到右边的距离（正实数）",
            "sym": "r*"
          },
          {
            "desc": "点到下边的距离（正实数）",
            "sym": "b*"
          },
          {
            "desc": "特征位置（钉位）",
            "sym": "(x, y)"
          },
          {
            "desc": "框的左上角 / 右下角",
            "sym": "(x₀,y₀),(x₁,y₁)"
          }
        ],
        "unicode": "l* = x − x₀， t* = y − y₀， r* = x₁ − x， b* = y₁ − y"
      }
    },
    {
      "badge": "both",
      "badgeLabel": "基础+训练",
      "bridge": "有了四个读数。但目标框有大有小：一张特征图、一种步长，怎么兼容所有尺寸？P3–P7 各有尺寸区间：目标框按最大边距对号入座，对不上区间的在这层判为负样本。",
      "id": "chap-4",
      "insight": "尺寸问题不是靠图像金字塔解决的，而是一次前向、五个层级、按最大边距分配——重叠的框大多被分到了不同层，歧义自然少了。",
      "kind": "chapter",
      "modules": [
        {
          "componentId": "mod-5-1",
          "desc": "点一张工作台：看这个中等大小的目标框在哪层是正样本，在哪层直接判负。",
          "id": "4.1",
          "kind": "module",
          "title": "选一张工作台"
        }
      ],
      "takeaways": [
        {
          "desc": "P3–P7 共五个层级，步长 8/16/32/64/128。",
          "icon": "🪜",
          "title": "五张台"
        },
        {
          "desc": "分层只看 max(l*,t*,r*,b*) 落在哪个区间。",
          "icon": "📐",
          "title": "一把刻度尺"
        },
        {
          "desc": "区间外的目标框在这层直接判负，不参与回归。",
          "icon": "🎯",
          "title": "不对就判负"
        }
      ],
      "title": "按尺寸分层",
      "formula": {
        "lead": "一句话：分层规则只看一个数——",
        "symbols": [
          {
            "desc": "四个距离中的最大值",
            "sym": "max(l*,t*,r*,b*)"
          },
          {
            "desc": "第 i 层最大回归距离（0, 64, 128, 256, 512, ∞）",
            "sym": "mᵢ"
          }
        ],
        "unicode": "若 max(l*, t*, r*, b*) > mᵢ 或 < mᵢ₋₁，则该位置在第 i 层为负样本"
      }
    },
    {
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "下面展开 FCOS 的完整网络结构。",
      "id": "chap-5",
      "insight": "检测头是共享的，但每层的尺度 s_i 是独立学的——共享省参数，s_i 保精度。",
      "kind": "chapter",
      "modules": [
        {
          "componentId": "mod-8-1",
          "desc": "点架构图上的部件（或下面的按钮）：看它的输入、输出和存在理由。",
          "id": "5.1",
          "kind": "module",
          "title": "点一点架构图"
        }
      ],
      "takeaways": [
        {
          "desc": "主干提特征，FPN 分层，三个检测头分工。",
          "icon": "👁️",
          "title": "三段分工"
        },
        {
          "desc": "三个检测头在各层之间共享。",
          "icon": "🤝",
          "title": "检测头共享"
        },
        {
          "desc": "回归头的输出是 exp(s_i·x)：尺度 s_i 每层独立学。",
          "icon": "📈",
          "title": "自适应指数"
        }
      ],
      "title": "架构：FCOS 的完整网络结构"
    },
    {
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "离框中心远的点位画出的框质量很差。怎么描述这一指标？使用中心性",
      "id": "chap-6",
      "insight": "中心性分支只有一层——这是全教程里性价比最高的改动：AP 涨 3.6%。",
      "kind": "chapter",
      "modules": [
        {
          "componentId": "mod-9-1",
          "desc": "开关中心性：看散点图上那些「高分低质」的框如何被压下去。（散点为示意分布；AP 数字来自论文表 4）",
          "id": "6.1",
          "kind": "module",
          "title": "开/关中心性"
        },
        {
          "componentId": "mod-9-2",
          "desc": "两个目标框重叠了：切换规则，看重叠区的钉位归属哪个框。",
          "id": "6.2",
          "kind": "module",
          "title": "重叠了，选谁的框"
        }
      ],
      "takeaways": [
        {
          "desc": "中心性 = 描述点在目标框中有多正，0~1，中心为 1。",
          "icon": "🎯",
          "title": "正不正打分"
        },
        {
          "desc": "推理时分类分数×中心性，低质量框被打折。",
          "icon": "✖️",
          "title": "打折"
        },
        {
          "desc": "重叠分不开就选面积最小的框。",
          "icon": "📦",
          "title": "选小不选大"
        }
      ],
      "title": "中心性与歧义",
      "formula": {
        "lead": "中心性就是「偏心程度」的量化——",
        "symbols": [
          {
            "desc": "水平方向的「正不正」（0~1）",
            "sym": "min(l*,r*)/max(l*,r*)"
          },
          {
            "desc": "垂直方向的「正不正」（0~1）",
            "sym": "min(t*,b*)/max(t*,b*)"
          },
          {
            "desc": "开方放缓衰减",
            "sym": "√"
          },
          {
            "desc": "取值 0~1，中心处为 1",
            "sym": "centerness*"
          }
        ],
        "unicode": "centerness* = √[ min(l*,r*)/max(l*,r*) × min(t*,b*)/max(t*,b*) ]"
      }
    },
    {
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "模型练好了，怎么用？推理就是一条五步流水线。",
      "id": "chap-7",
      "insight": "注意第 3 步：centerness 是在推理时才乘上去的——训练时它只是一个独立的分支。",
      "kind": "chapter",
      "modules": [
        {
          "componentId": "mod-6-1",
          "desc": "一步一步点：看分数和框在每一步如何变化，最后剩下几个框。",
          "id": "7.1",
          "kind": "module",
          "title": "五步交工"
        }
      ],
      "takeaways": [],
      "title": "推理"
    },
    {
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "模型是怎么练出来的？三个损失，各管一处。",
      "id": "chap-8",
      "insight": "罚分类出错，罚框的位置偏移，罚点位偏离中心——三个方向一起改。",
      "kind": "chapter",
      "modules": [
        {
          "componentId": "mod-7-1",
          "desc": "在 0 / 30K / 60K / 90K 四个检查点间步进：看三条损失曲线下降，看学习率在 60K、80K 处阶梯下降。（曲线为按论文训练配置的示意）",
          "id": "8.1",
          "kind": "module",
          "title": "九万次练习"
        }
      ],
      "takeaways": [
        {
          "desc": "总损失 = focal + IoU + BCE",
          "icon": "🧮",
          "title": "三损失"
        },
        {
          "desc": "回归损失只算在正样本上，背景不参与画框。",
          "icon": "📉",
          "title": "正样本才画框"
        }
      ],
      "title": "训练：损失函数",
      "formula": {
        "lead": "总损失是三部分按正样本数平均——",
        "symbols": [
          {
            "desc": "分类 focal loss",
            "sym": "L𝚌ₗₛ"
          },
          {
            "desc": "回归 IoU loss",
            "sym": "Lᵣₑ₉"
          },
          {
            "desc": "正样本数",
            "sym": "Nₚₒₛ"
          },
          {
            "desc": "回归权重（=1）",
            "sym": "λ"
          },
          {
            "desc": "指示函数：正样本才算回归损失",
            "sym": "1{c*>0}"
          }
        ],
        "unicode": "L = (1/Nₚₒₛ) Σ L𝚌ₗₛ + λ·(1/Nₚₒₛ) Σ 1{c*>0}·Lᵣₑ₉ ，λ = 1"
      }
    },
    {
      "badge": "both",
      "badgeLabel": "基础+训练",
      "bridge": "最后检验模型同等条件下比 AP，比召回上限——FCOS 表现良好",
      "id": "chap-9",
      "insight": "FCOS 证明：不要锚框，检测器可以更简单、还更强。",
      "kind": "chapter",
      "modules": [
        {
          "componentId": "mod-10-1",
          "desc": "点「开始检验」：看 FCOS 和 RetinaNet 在真实论文数字上的赛跑；切换指标看 AP 和 BPR 两场。（数值来自论文表 1/3/5，按真实比例绘制）",
          "id": "9.1",
          "kind": "module",
          "title": "检验赛"
        }
      ],
      "takeaways": [
        {
          "desc": "AP 超 RetinaNet，最终版 test-dev 44.7%。",
          "icon": "🏆",
          "title": "同等条件"
        },
        {
          "desc": "BPR 98.40%≈锚框最优，纸面差距 <1% 不影响实战。",
          "icon": "📊",
          "title": "召回上限"
        },
        {
          "desc": "重叠严重时仍有约 3.8% 歧义；超参数是照搬 RetinaNet 的，为 FCOS 细调还能更好。",
          "icon": "⚠️",
          "title": "局限与空间"
        }
      ],
      "title": "成品检验"
    }
  ]
};
