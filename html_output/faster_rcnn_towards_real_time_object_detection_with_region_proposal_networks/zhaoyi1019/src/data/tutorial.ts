import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Faster R-CNN: Towards Real-Time Object Detection with Region Proposal Networks",
    "titleZh": "Faster R-CNN：面向实时目标检测的区域候选网络",
    "venue": "NeurIPS 2015 · TPAMI 2017",
    "authors": "Shaoqing Ren, Kaiming He, Ross Girshick, Jian Sun",
    "affiliation": "Microsoft Research；Ren：中科大（实习于 MSR）；Girshick：Facebook AI Research",
    "domain": "计算机视觉 · 目标检测",
    "coreProblem": "在 Fast R-CNN 让检测变快之后，外部区域提案（Selective Search 约 2 秒/张）成了测试时的速度瓶颈。",
    "coreInsight": "用与检测网络<b>共享卷积特征</b>的区域候选网络（RPN）生成候选框，让提案近乎免费（约 10 毫秒），同时提升精度。",
    "keywords": [
      "目标检测",
      "区域候选网络",
      "锚框",
      "共享卷积"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "外部算法在 CPU 上慢慢生成候选框：<b>Selective Search 约 2 秒/张</b>，成为瓶颈。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "RPN 与检测器共享卷积特征：<b>寻星镜指出方向，目镜确认</b>，提案约 10 毫秒。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "两个问题：哪里有目标，目标是什么",
      "badge": "inf",
      "badgeLabel": "必读",
      "bridge": "检测本质上是两步：先回答<b>哪里有目标</b>，再回答<b>是什么</b>。本章先暴露旧管线的速度瓶颈。",
      "analogy": {
        "title": "一次只找一颗星，太慢了",
        "text": "旧方法像只用一支细目镜<b>逐个扫过整片星空</b>，找到目标前时间就耗尽了。",
        "componentId": "stargaze-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "旧管线：先慢慢找，再慢慢认",
          "desc": "亲手走一遍「外部提案 → 检测」的旧流程，感受提案才是耗时瓶颈。",
          "componentId": "ch1mod1"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "新方法：寻星镜指出方向，目镜确认",
          "desc": "用同一束星光同时完成「找」和「认」，感受提案从约 2 秒降到约 10 毫秒。",
          "componentId": "ch1mod2"
        }
      ],
      "insight": "与其用外部算法慢慢生成候选，不如让同一个网络自己学会「该往哪里看」。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两步检测",
          "desc": "检测 = 「哪里有目标」+「是什么」两步。"
        },
        {
          "icon": "🔧",
          "title": "旧瓶颈",
          "desc": "Selective Search 约 2 秒/张，提案成了速度瓶颈。"
        },
        {
          "icon": "✨",
          "title": "近乎免费",
          "desc": "共享特征让提案边际成本降到约 10ms。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "共享的卷积特征图",
      "badge": "inf",
      "badgeLabel": "必读",
      "bridge": "要让「找」与「认」共享计算，它们必须先共用同一份表示——也就是卷积特征图。",
      "analogy": {
        "title": "一束星光，两个用途",
        "text": "同一个光信号<b>同时</b>给寻星镜定位和目镜辨认用，不用再单独收集一次。",
        "componentId": "stargaze-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "同一张特征图，两个任务共用",
          "desc": "拖动星星，看特征响应跟着平移，体会卷积特征的平移不变性。",
          "componentId": "ch2mod1"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "一张图一份特征",
          "desc": "一张输入图先变成一张卷积特征图。"
        },
        {
          "icon": "🔧",
          "title": "两个任务共用",
          "desc": "RPN 与 Fast R-CNN 共用这张特征图。"
        },
        {
          "icon": "✨",
          "title": "平移不变",
          "desc": "同一套函数对所有位置共享，目标平移、响应平移。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "让网络先「往哪里看」",
      "badge": "inf",
      "badgeLabel": "必读",
      "bridge": "有了共享表示，RPN 就能扮演「注意力」：先告诉检测器往哪里看，再由检测器识别。",
      "analogy": {
        "title": "共享，还是各干各的",
        "text": "同一台望远镜复用星光，比两套独立设备更快更省。",
        "componentId": "stargaze-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "共享光路 vs 独立光路",
          "desc": "同步比较共享与独立卷积特征两套方案，确认共享是核心洞见。",
          "componentId": "ch3mod1"
        }
      ],
      "insight": "RPN 就是统一网络里的注意力：它用同一张特征图指出候选位置，让检测器只关注这些位置。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "注意力",
          "desc": "RPN = 告诉检测器「往哪里看」的注意力。"
        },
        {
          "icon": "🔧",
          "title": "共享卷积",
          "desc": "共享让提案的边际成本几乎为零。"
        },
        {
          "icon": "✨",
          "title": "一张图两个任务",
          "desc": "同一张特征图同时服务「找」与「认」。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "九种锚框：多尺度的参考框",
      "badge": "both",
      "badgeLabel": "通用",
      "bridge": "RPN 在每个位置该框多大的目标？答案是用一组预设的参考框——锚框。",
      "analogy": {
        "title": "一种框套不住所有星",
        "text": "不同大小、不同长宽比的星，需要多种<b>参考框</b>来套。",
        "componentId": "stargaze-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "9 个锚框，哪个算「有目标」",
          "desc": "切换锚框配置并拖拽锚框，理解 3 尺度 × 3 长宽比与 IoU 正负样本判定。",
          "componentId": "ch4mod1"
        }
      ],
      "formula": {
        "lead": "正负样本由锚框与真值框的<b>交并比</b>决定，|·| 表示区域面积：",
        "unicode": "IoU = |A ∩ G| / |A ∪ G|",
        "symbols": [
          {
            "sym": "A",
            "desc": "锚框（候选参考框）"
          },
          {
            "sym": "G",
            "desc": "真值框（ground truth）"
          },
          {
            "sym": "∩",
            "desc": "两个框的交叠区域"
          },
          {
            "sym": "∪",
            "desc": "两个框的并集区域"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "9 个锚框",
          "desc": "每位置 9 个锚框：3 尺度 × 3 长宽比。"
        },
        {
          "icon": "🔧",
          "title": "IoU 阈值",
          "desc": "IoU>0.7 为正样本，IoU<0.3 为负样本。"
        },
        {
          "icon": "✨",
          "title": "多尺度关键",
          "desc": "9 锚框比单锚框 mAP 高 3-4 个百分点。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "边框回归：把框对准目标",
      "badge": "both",
      "badgeLabel": "通用",
      "bridge": "锚框只是起点，还要学会把它校正到目标上——这就是边框回归。",
      "analogy": {
        "title": "框偏了，就校正到对准",
        "text": "先用参考框给个起点，再<b>回归</b>四个量把框校正到目标上。",
        "componentId": "stargaze-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "从锚框到预测框的四个偏移量",
          "desc": "调整四个偏移量，看预测框从锚框出发贴合真值框，残差越小越好。",
          "componentId": "ch5mod1"
        }
      ],
      "formula": {
        "lead": "回归预测的是相对锚框的归一化偏移：",
        "unicode": "t_x=(x−x_a)/w_a,  t_y=(y−y_a)/h_a,  t_w=log(w/w_a),  t_h=log(h/h_a)",
        "symbols": [
          {
            "sym": "x, y",
            "desc": "框中心坐标"
          },
          {
            "sym": "w, h",
            "desc": "框的宽与高"
          },
          {
            "sym": "x_a, y_a, w_a, h_a",
            "desc": "锚框的中心与宽高（下标 a = anchor）"
          },
          {
            "sym": "x*, y*, w*, h*",
            "desc": "真值框的中心与宽高（* = ground truth）"
          },
          {
            "sym": "t_x, t_y, t_w, t_h",
            "desc": "四个回归目标：中心偏移归一化、宽高取对数"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "四个偏移量",
          "desc": "回归预测相对锚框的四个偏移量。"
        },
        {
          "icon": "🔧",
          "title": "归一化",
          "desc": "中心用 (x−x_a)/w_a 归一化，宽高用 log 尺度。"
        },
        {
          "icon": "✨",
          "title": "稳健",
          "desc": "smooth L1 让回归对离群点更稳健。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "前向推理：从图像到检测框",
      "badge": "inf",
      "badgeLabel": "必读",
      "bridge": "各部件已就位，本章把它们串成一次完整的前向推理。",
      "analogy": {
        "title": "一次观测，五步完成",
        "text": "星光依次经过<b>寻星镜</b>和<b>目镜</b>，一步定位、一步确认。",
        "componentId": "stargaze-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "推理五步：卷积 → 提案 → NMS → RoI → 分类",
          "desc": "逐步推进推理流水线，看清每个阶段的输入输出。",
          "componentId": "ch6mod1"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "五步流水线",
          "desc": "卷积 → RPN → NMS → 前 300 → Fast R-CNN。"
        },
        {
          "icon": "🔧",
          "title": "NMS 与 top-N",
          "desc": "NMS 阈值 0.7，检测只用前 300 个提案。"
        },
        {
          "icon": "✨",
          "title": "单尺度",
          "desc": "全程单尺度输入，VGG 总耗时约 198ms（5fps）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "多任务损失：分类与回归一起学",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "RPN 要同时学会两件事：判断是不是目标、把框回归准。它的损失函数把这两件事放在一起。",
      "analogy": {
        "title": "既要认得出，也要框得准",
        "text": "校准<b>目镜</b>时同时考核两件事：认不认得，框得准不准。",
        "componentId": "stargaze-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "分类损失 + λ·回归损失",
          "desc": "调节 λ，看两项损失如何平衡，并发现结果对 λ 不敏感。",
          "componentId": "ch7mod1"
        }
      ],
      "formula": {
        "lead": "RPN 的多任务损失由分类项与回归项组成：",
        "unicode": "L({p_i},{t_i}) = 1/N_cls · Σ L_cls(p_i, p*_i) + λ · 1/N_reg · Σ p*_i L_reg(t_i, t*_i)",
        "symbols": [
          {
            "sym": "p_i",
            "desc": "第 i 个锚框是目标的预测概率"
          },
          {
            "sym": "p*_i",
            "desc": "第 i 个锚框的正负标签（1 或 0）"
          },
          {
            "sym": "t_i, t*_i",
            "desc": "预测框偏移与真值框偏移"
          },
          {
            "sym": "L_cls, L_reg",
            "desc": "分类损失与回归损失（smooth L1）"
          },
          {
            "sym": "N_cls",
            "desc": "分类项归一化量 = 256（mini-batch）"
          },
          {
            "sym": "N_reg",
            "desc": "回归项归一化量 ≈ 2400（锚框位置数）"
          },
          {
            "sym": "λ",
            "desc": "平衡系数，默认 10"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两项损失",
          "desc": "RPN 的损失 = 分类项 + 回归项。"
        },
        {
          "icon": "🔧",
          "title": "正样本门控",
          "desc": "回归只在正样本锚框上生效。"
        },
        {
          "icon": "✨",
          "title": "λ 不敏感",
          "desc": "λ 在 [1,100] 内对 mAP 影响约 1%。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "统一网络架构：RPN + Fast R-CNN",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "把 RPN 与 Fast R-CNN 合并成一个网络：共享卷积主干 + 两个头。",
      "analogy": {
        "title": "一台镜子，两个头",
        "text": "同一个<b>镜筒</b>（共享卷积）上装着<b>寻星镜</b>和<b>目镜</b>两个头。",
        "componentId": "stargaze-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点击组件，看架构与形状",
          "desc": "点击共享卷积、RPN、RoI 池化、检测头，切换主干看输出形状与作用。",
          "componentId": "ch8mod1"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "统一网络",
          "desc": "共享卷积 + RPN 头 + 检测头。"
        },
        {
          "icon": "🔧",
          "title": "2k / 4k 输出",
          "desc": "RPN 输出 2k 个目标性分数与 4k 个框坐标。"
        },
        {
          "icon": "✨",
          "title": "更强主干",
          "desc": "换更强主干（VGG→ResNet）精度继续涨。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "交替训练与实用技巧",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "共享特征不是凭空来的，需要特殊的训练方案，还有 NMS、边界处理等实用技巧。",
      "analogy": {
        "title": "交替校准，两个头同步进步",
        "text": "先校准<b>寻星镜</b>，再校准<b>目镜</b>，来回几轮两者就共享同一镜筒了。",
        "componentId": "stargaze-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "共享特征怎么训出来",
          "desc": "对比 4 步交替训练与近似联合训练。",
          "componentId": "ch9mod1"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "重叠候选太多？NMS 来去重",
          "desc": "开关 NMS，看候选数量与检测质量。",
          "componentId": "ch9mod2"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "4 步交替",
          "desc": "共享特征靠 4 步交替训练学出来。"
        },
        {
          "icon": "🔧",
          "title": "联合更快",
          "desc": "近似联合训练省 25-50% 时间。"
        },
        {
          "icon": "✨",
          "title": "NMS 去重",
          "desc": "NMS（IoU 0.7）去掉冗余候选，几乎不掉点。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、对比与局限",
      "badge": "both",
      "badgeLabel": "通用",
      "bridge": "最后用论文的真实数字收尾：更快的同时也更准，并诚实说明局限。",
      "analogy": {
        "title": "同一片星空，比谁认得快又准",
        "text": "比赛看的是<b>又快又准</b>：定位快、分类对、框得准。",
        "componentId": "stargaze-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "已验证的基准对比",
          "desc": "用真实 mAP 数字比较 SS、Fast R-CNN、Faster R-CNN。",
          "componentId": "ch10mod1"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "VOC 精度",
          "desc": "VOC 2007：69.9%（VGG-16 共享），加数据到 78.8%。"
        },
        {
          "icon": "🔧",
          "title": "COCO + 速度",
          "desc": "COCO：42.7% mAP@.5 / 21.9% mAP@[.5,.95]，同时 5fps。"
        },
        {
          "icon": "✨",
          "title": "局限",
          "desc": "小目标与极端长宽比仍是难点，方法本身是两阶段。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1GB4y1r7rM",
      "title": "目标检测之Faster R-CNN论文精讲，Faster RCNN",
      "reason": "论文逐节精讲，方法深挖",
      "cover": "https://i0.hdslb.com/bfs/archive/bed198683aa043ad7df05262e997f3ff9642e410.png",
      "views": "2.2万播放"
    },
    {
      "bvid": "BV1BK41157Vs",
      "title": "Pytorch 搭建自己的Faster-RCNN目标检测平台（Bubbliiiing 深度学习 教程）",
      "reason": "代码实战，播放量高",
      "cover": "https://i0.hdslb.com/bfs/archive/ad87e05ffe04f4cb41e74ec086b62a830aa6ea24.png",
      "views": "25.8万播放"
    },
    {
      "bvid": "BV1SWfwY3Evr",
      "title": "超全超简单！一口气刷完YOLO、SSD、DETR、Faster R-CNN、Fast R-CNN、Mask R-CNN等六大目标检测常用算法！",
      "reason": "多算法横向概览",
      "cover": "https://i1.hdslb.com/bfs/archive/6e84858afe8bdef5d94588d879328629e67cb26a.jpg",
      "views": "7812播放"
    },
    {
      "bvid": "BV1d4411U7AC",
      "title": "CV15 任少卿 From Faster R CNN to Mask R CNN",
      "reason": "第一作者任少卿本人演讲，唯一相关",
      "cover": "https://i0.hdslb.com/bfs/archive/b64f5df7c0a751293857fcfc5b7f14098d2baa51.jpg",
      "views": "671播放"
    }
  ]
};
