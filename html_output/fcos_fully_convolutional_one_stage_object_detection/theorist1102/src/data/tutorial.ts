import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "FCOS: Fully Convolutional One-Stage Object Detection",
    "titleZh": "FCOS：全卷积单阶段目标检测",
    "venue": "arXiv:1904.01355v5 · 2019-08-20",
    "authors": "Zhi Tian, Chunhua Shen, Hao Chen, Tong He",
    "affiliation": "The University of Adelaide",
    "domain": "计算机视觉 · 目标检测",
    "coreProblem": "主流检测器先铺锚框，尺寸和长宽比一变，精度就会晃。",
    "coreInsight": "每个前景位置直接量到四边，再用金字塔和中心度处理歧义与低质量框。",
    "keywords": [
      "FCOS",
      "无锚框",
      "中心度",
      "FPN",
      "目标检测"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "锚框检测器",
      "desc": "固定相框不跟着照片变。",
      "componentId": "cover-anchors"
    },
    "newMethod": {
      "title": "FCOS",
      "desc": "量到四边，相框始终合上。",
      "componentId": "cover-fcos"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "锚框的代价",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "固定相框",
          "desc": "改变照片长宽比，看预制相框还能套住几张。",
          "componentId": "anchor-drawer"
        }
      ],
      "scenes": [
        {
          "id": "anchor-cost",
          "title": "固定相框套不住照片",
          "goal": "看锚框的长宽比为什么要反复调",
          "summary": "九个预制相框的交并比会随照片形状掉下去。表 8 消融里：单锚框 32.5，九锚框与纯 FCOS（C5）都是 35.7（勿与表 3 的 35.9 混淆）。",
          "interaction": "拖动长宽比，数一数还有几个相框的交并比达到 0.5。",
          "next": "下一步不先摆相框，改从照片上的一个点量四条边。",
          "notes": "来源：第 1 页引言。论文称 RetinaNet 改动锚框超参数，COCO AP 最多相差约 4 个点；短边 800 的 FPN 例子可以超过 18 万个锚框。表 8（附录消融，minival）：RetinaNet 单锚框 32.5，九锚框 35.7，纯 FCOS（C5）35.7。表 3 主实验里同骨干对照是 RetinaNet 35.9 vs FCOS 36.3，数字不同，协议行也不完全等同于表 8。画面里的 9 个相框和交并比 0.5 是教学示意，不是论文的锚框集合。类比边界：相框只对应“预先规定形状”。",
          "componentId": "anchor-drawer",
          "moduleId": "1.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "四边回归",
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "四边距离",
          "desc": "在照片上移动一点，读取到四条边的距离并还原相框。",
          "componentId": "edge-measure"
        }
      ],
      "scenes": [
        {
          "id": "four-sides",
          "title": "每个点回归四条边",
          "goal": "不用锚框时，一个位置怎样表示整张框",
          "summary": "框内的点用到左、上、右、下的距离表示边框；框外是背景，不再回归。",
          "interaction": "拖动或用方向键移动橙点。点在照片内就量四边，离开照片就变成背景。",
          "next": "一个点如果同时落在两张照片上，该回归哪一张？",
          "notes": "来源：第 4 页公式 (1) 与第 3.1 节。l*=x-x0，t*=y-y0，r*=x1-x，b*=y1-y。位置先按步长映回原图，靠近感受野中心。落在任一真值框内是正样本，否则类别目标为 0。落在多个框内时取面积最小的框。推理时把公式反过来。回归输出经过指数变成正数。相对每位置 9 个锚框，输出变量大约少 9 倍。损失是公式 (2)：正样本数归一化的 focal 分类损失加 λ=1 的 IoU 回归损失。画面用示意像素，没有特征图步长。图 1 只作对照，拖动不会改论文照片。",
          "componentId": "edge-measure",
          "moduleId": "2.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "多层级消歧",
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "重叠时取小框",
          "desc": "手指同时落在两张照片上时，回归面积更小的那张。",
          "componentId": "overlap-choice"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "按边距分层",
          "desc": "改变最大边距，看 P3 到 P7 哪一层允许回归。",
          "componentId": "fpn-levels"
        }
      ],
      "scenes": [
        {
          "id": "overlap-min",
          "title": "重叠处取更小的框",
          "goal": "一个点落进两张照片时回归谁",
          "summary": "同时落在多个框里就取面积最小的目标。金字塔能把很多不同大小的重叠拆开，但拆不干净。",
          "interaction": "拖动橙点。比较只落在海报上、只落在杯子上，以及两张都盖住的三种位置。",
          "next": "大小不同的照片会被分到金字塔的不同层。",
          "notes": "来源：第 3.1 节与第 6–7 页表 2。歧义正样本比例在不用 FPN、只用 P4 时是 23.16%，用 FPN 后是 7.14%。不同类别的歧义从 17.84% 降到 3.75%。推理时约 2.3% 的检测框来自歧义位置，只计不同类别时约 1.5%。这些位置有漏掉较大物体的风险。同类重叠在推理时类别仍然正确，论文认为可以由只属于另一物体的位置补上。本页两张照片的面积是示意，不重算表 2 的百分比。",
          "componentId": "overlap-choice",
          "moduleId": "3.1"
        },
        {
          "id": "pyramid-range",
          "title": "边距决定金字塔层级",
          "goal": "多大的距离交给 P3 到 P7 的哪一层",
          "summary": "每层只回归一段最大边距。界限取等号时，相邻两层都不会把它判成负样本。",
          "interaction": "拖动最大边距。看哪一层亮起，并在 64、128、256、512 这几条分界上停一下。",
          "next": "层分配之后，离中心太远的框还要靠中心度降权。",
          "notes": "来源：第 5 页第 3.2 节，图 2，表 1。P3 到 P7 步长为 8、16、32、64、128。m2 到 m7 为 0、64、128、256、512、∞。某位置在第 i 层为负样本，当且仅当 max(l*,t*,r*,b*) > m_i 或 < m_{i-1}。因此恰好等于分界时两层都可以是正样本。P6、P7 由 P5、P6 上步长为 2 的卷积得到。各层共享检测头，但回归用 exp(s_i x)，s_i 可学习。表 1：FCOS 无 FPN 的最好可能召回 95.55%，有 FPN 为 98.40%；RetinaNet 在官方低质量匹配（IoU≥0.4）为 90.92%，用全部匹配为 99.23%。这是训练能否分到真值框的上界，不是测试 AP。滑块只改变示意边距。",
          "componentId": "fpn-levels",
          "moduleId": "3.2"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "中心度",
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "中心度降权",
          "desc": "把手指从花瓶中心移到边缘，看最终分数怎样变小。",
          "componentId": "center-ness"
        }
      ],
      "scenes": [
        {
          "id": "center-score",
          "title": "离中心越远分数越低",
          "goal": "为什么边缘位置预测的框要被降权",
          "summary": "中心度是左右、上下两组距离比再开方。测试时乘到分类分数上。",
          "interaction": "在照片里拖动橙点，或用方向键。比较中心和四角的最终分数。",
          "next": "降权之后，重叠的预测还要靠 NMS 决定留哪一张。",
          "notes": "来源：第 5 页公式 (3)，图 3，第 7 页表 4。中心度 = sqrt( min(l*,r*)/max(l*,r*) × min(t*,b*)/max(t*,b*) )，开方是为了让衰减慢一些，范围在 0 到 1，用二元交叉熵训练，并加进公式 (2)。测试分数是预测中心度乘分类分。图 2 的默认分支与分类头平行；脚注说改到回归头旁可以再提高 AP，除非特别说明仍用图 2。表 4（minival，默认 ResNet-50）：不用中心度 33.5，用回归向量现算仍是 33.5，单独分支 37.1。页面里的分类分 0.80 是固定示意，不是网络输出，拖动不改变表 4。",
          "componentId": "center-ness",
          "moduleId": "4.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "非极大值抑制",
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "只留一张",
          "desc": "调节两张重叠装裱的分类分，看 NMS 留下谁。",
          "componentId": "nms-keep"
        }
      ],
      "scenes": [
        {
          "id": "nms-one",
          "title": "重叠预测只留一张",
          "goal": "中心度降权之后，NMS 怎样取舍",
          "summary": "最终分数是分类分乘中心度。先按与 RetinaNet 相同的后处理过滤低分框，交并比超过 0.5 时只留分高的那张。",
          "interaction": "分别拖动居中框和偏边框的分类分。试着把偏边框拉到很高。",
          "next": "接下来看这些设计在 COCO 上实际差多少，柱子不能被拖动。",
          "notes": "来源：第 6 页推理细节——后处理与 RetinaNet 相同（超参直接沿用）。正文未单独印死分数阈值；页面演示用约 0.05 的惯例阈值。表 3 明确试过 NMS 阈值 0.5 和 0.6。摘要说 NMS 是唯一后处理。本页中心度 0.92 / 0.35 是示意，不是从表里抄来的实验数。",
          "componentId": "nms-keep",
          "moduleId": "5.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "COCO 结果",
      "modules": [],
      "scenes": [
        {
          "id": "coco-minival",
          "title": "minival 上的对照",
          "goal": "同一训练设定下 AP 实际差多少",
          "summary": "表 3 主实验：同设定 C5 上 RetinaNet 35.9、FCOS 36.3；再叠加 P5、GN 与 NMS 0.6 到 37.1；后续改进累计到 38.6。AP50 并未同步领先。",
          "interaction": "这页没有可拖动的实验数字。看完柱子后，下一页换到 test-dev。",
          "next": "test-dev 把不同骨干的结果放在一起，读的时候要看骨干。",
          "notes": "来源：第 7 页表 3（主实验，勿与表 8 消融的 35.7 混读）。协议：COCO trainval35k 训练，minival 验证，ResNet-50。默认训练：SGD 90K，lr 0.01，batch 16，60K/80K 降 lr，短边 800。C5、无 GN、NMS 0.5：FCOS 36.3（AP50 54.8）对 RetinaNet 35.9（AP50 56.0）。37.1 对应 P5 + GN + NMS 0.6，不是“只在 C5 上加 GN”。后续改进累计：ctr.on reg. 37.4 → sampling 38.1 → GIoU 38.3 → Normalization 38.6。",
          "componentId": "minival-bars"
        },
        {
          "id": "coco-testdev",
          "title": "test-dev 上的 AP",
          "goal": "哪些数字是同骨干比较，哪些只是同表罗列",
          "summary": "FCOS 用 ResNet-101-FPN 得到 41.5，论文称比同骨干 RetinaNet 的 39.1 高 2.4。44.7 来自更强骨干加上后续改进。",
          "interaction": "柱子固定。先看 FCOS 和 RetinaNet 两根同色对比，再看其余方法的骨干并不相同。",
          "next": "回到两张相近照片的重叠，看最小面积仍然会选错谁。",
          "notes": "来源：第 1 页摘要与第 8 页表 5、第 4.2 节。FCOS 的 test-dev 模型把短边随机缩放到 640–800，迭代加到 18 万，其余从 minival 上 37.1 的配方出发。单模型单尺度。论文明确写出的同骨干差距是 ResNet-101-FPN：41.5 对 RetinaNet 39.1。ResNeXt-64x4d-101-FPN 为 43.2，加上表 3 的改进为 44.7。同表还有 YOLOv2 DarkNet-19 的 21.6、SSD513 ResNet-101 的 31.2、Faster R-CNN w/ FPN ResNet-101-FPN 的 36.2、CornerNet Hourglass-104 的 40.5。这些数字来自各文发表结果，不能当成同一训练日程的消融。表 6 是另一件事：ResNet-50 上 FCOS+GN 作为 RPN 的 AR100 为 52.8、AR1k 为 60.3，对照 RPN+FPN+GN 为 44.7 和 56.9。AR 越高越好，但不能和 AP 画在同一根轴上。",
          "componentId": "testdev-bars"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "边界与补救",
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "中心采样补救",
          "desc": "在两张大小接近的照片上切换中心采样，看回归目标会不会改。",
          "componentId": "overlap-repair"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "仍然留下的限制",
          "desc": "查看去掉 NMS、固定距离界限，以及必须单独学习中心度这三件事。",
          "componentId": "limit-desk"
        }
      ],
      "scenes": [
        {
          "id": "repair-overlap",
          "title": "同层重叠仍可能漏检",
          "goal": "大小接近的两张照片，最小面积还会选错",
          "summary": "不同类别、尺寸又接近时，金字塔分不开它们。只取中心区域可以换掉一部分错误目标，但中心仍重叠时歧义还在。",
          "interaction": "先在默认位置观察目标是书，再打开中心采样。也可以把点拖进两个中心区域的交集。",
          "next": "最后确认：锚框没有了，NMS 和距离界限还在。",
          "notes": "来源：第 3.3 节与表 3 的 “ctr. sampling” 行。论文说只把真值框中心部分当正样本会多一个超参数；投稿后与中心度合用更好。表 3 在已把中心度放到回归支（37.4）之后，中心采样到 38.1。协议仍是 minival、ResNet-50、P5、GN、NMS 0.6。页面用各框向内 25% 代表中心区域，这是示意半径，不是论文给出的唯一比例。最小面积规则仍用于同时命中的框。不同类别的歧义在有 FPN 时仍占正样本的 3.75%（表 2）。",
          "componentId": "overlap-repair",
          "moduleId": "7.1"
        },
        {
          "id": "still-nms",
          "title": "锚框没了，NMS 还在",
          "goal": "无锚框之后还有哪些条件没有消失",
          "summary": "检测仍然要做 NMS。金字塔的距离界限是固定超参数。中心度必须单独学习，不能从回归向量里现算。",
          "interaction": "点三个按钮：去掉 NMS、看距离界限、比较边缘点和中心点。",
          "next": "讲稿里还有把它用作 RPN 时的召回，那是另一套指标。",
          "notes": "来源：摘要对 NMS 的表述；第 3.2 节的 m_i；表 4 的 33.5 / 33.5 / 37.1；附录“RetinaNet with Center-ness”。一个位置只有一个中心度，不能原样套到同一位置有多个锚框的 RetinaNet 上。训练超参数直接沿用为锚框检测器调过的 RetinaNet，论文也写了若为 FCOS 再调可能更好。最好可能召回 98.40% 仍略低于 RetinaNet 用全部匹配时的 99.23%，论文认为实际召回远低于 90%，这个上界差距不是主要瓶颈。图 8 是成功案例的定性展示，不是失败率统计。",
          "componentId": "limit-desk",
          "moduleId": "7.2"
        }
      ]
    }
  ]
};
