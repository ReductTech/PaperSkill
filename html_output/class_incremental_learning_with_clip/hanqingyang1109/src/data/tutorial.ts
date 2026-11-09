import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Class-Incremental Learning with CLIP: Adaptive Representation Adjustment and Parameter Fusion",
    "titleZh": "CLIP 类增量学习：自适应表征调整与参数融合",
    "venue": "",
    "authors": "Linlan Huang, Xusheng Cao, Haori Lu, Xialei Liu",
    "affiliation": "南开大学 VCIP / NKIARI",
    "domain": "计算机视觉 · 类增量学习 · 视觉语言模型",
    "coreProblem": "用 CLIP 做类增量学习：新类一来，挨着的老类先被抢走（ECCV 2024）。",
    "coreInsight": "遗忘集中在相邻类别：用文本特征找出邻居，只把被波及的老类推开一点；训练后按改动大小融合新旧参数。",
    "keywords": [
      "类增量学习",
      "CLIP",
      "邻居类别",
      "铰链损失",
      "参数融合"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "只微调那一层",
      "desc": "只微调适配层，不处理相邻类别。",
      "componentId": "rapf-cover"
    },
    "newMethod": {
      "title": "RAPF：认邻居 · 拉开 · 融合",
      "desc": "先用款名圈出邻居，再把样板推开，最后按改动合并纸样。",
      "componentId": "rapf-cover"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "01 · 邻居才是遗忘的入口",
      "modules": [
        {
          "kind": "module",
          "id": "m1",
          "title": "相邻类别的错误流向",
          "desc": "把新到的款式推向衣架，看哪一件老款先被抢走。",
          "componentId": "rapf-rack"
        }
      ],
      "scenes": [
        {
          "id": "p1-rack",
          "title": "新类一来，先塌的是挨着的那件",
          "goal": "拖动新款靠近衣架，比较两件老款被抢走的比例。",
          "summary": "遗忘不是均匀下降，而是沿着“最像”的那条边集中发生。",
          "interaction": "左右拖动新款衣架，观察相邻老款的错判条与远端老款几乎不动",
          "next": "旧数据都拿不到，替身从哪里来",
          "notes": "证据：p.6 §4.2 指出新类与旧类语义相近时遗忘更严重；Fig.5 的混淆矩阵与 Table 6 的 kingsnake 计数都指向“错判集中流向相邻新类”。页面上的比例条是示意，唯一实测数字用 Table 6：无 hinge 时 50 张里 25 张判给新类（准确率 0.50），加 hinge 后 15 张（0.70）。类比边界：真实遗忘还受类别顺序与样本量影响，不是只看相似度。",
          "componentId": "rapf-rack",
          "moduleId": "m1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "02 · 没有旧样衣，就按尺码册造替身",
      "modules": [
        {
          "kind": "module",
          "id": "m2",
          "title": "旧类特征的高斯近似",
          "desc": "调协方差收缩强度，看替身点云怎么变。",
          "componentId": "rapf-gaussian"
        }
      ],
      "scenes": [
        {
          "id": "p2-gaussian",
          "title": "替身不是真样衣，是按尺码册裁的",
          "goal": "调节收缩强度 λ，观察特征点云与协方差椭圆的变化。",
          "summary": "旧类只剩均值与协方差；样本少时要用收缩保证可采样。",
          "interaction": "拖动 λ 滑块，椭球在“被噪声拉扁”与“被抹成圆”之间变化",
          "next": "先判断哪些老类与新款挨着",
          "notes": "证据：p.5–6 Feature Generation 用 N(µ_c, Σ_c) 近似类别分布；p.9 说明细类样本不足时协方差不满秩，按前作采用协方差收缩。论文未给出收缩系数的具体公式，页面上的 λ 公式与点云是教学示意，不能当成论文公式。",
          "componentId": "rapf-gaussian",
          "moduleId": "m2"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "03 · 用款名找出邻居对",
      "modules": [
        {
          "kind": "module",
          "id": "m3",
          "title": "阈值 α 与邻居集合",
          "desc": "拖动阈值线，看哪些类别对进入集合 P。",
          "componentId": "rapf-textdistance"
        },
        {
          "kind": "module",
          "id": "m4",
          "title": "距离矩阵与调整范围",
          "desc": "点选矩阵格子，判断这一对是否会被推开。",
          "componentId": "rapf-pairmatrix"
        }
      ],
      "scenes": [
        {
          "id": "p3-alpha",
          "title": "多近才算邻居，由阈值 α 定",
          "goal": "拖动 α 阈值线，观察邻居对数量的变化。",
          "summary": "P = {(i,j) | D_ij < α}；α 太小漏邻居，太大拉进不相干类别。",
          "interaction": "左右拖动橙色阈值线，邻居吊牌被圈中或淘汰",
          "next": "被波及的老类不止一个，怎么逐个看",
          "notes": "证据：Eq.(3)(4)（p.6）用归一化文本特征的欧氏距离；p.9 给出默认 α=0.65；p.13 Fig.6 的阈值实验显示 α 增大先涨后平，过大反而引入干扰。右下角曲线只画论文 Fig.6 的定性形状（y 轴 78.4–80.4，ImageNet100 B0 Inc10），未逐点读数。",
          "componentId": "rapf-textdistance",
          "moduleId": "m3"
        },
        {
          "id": "p4-matrix",
          "title": "只修被波及的老款",
          "goal": "点选距离矩阵的格子，判断该对是否入选。",
          "summary": "新类不调整，进入调整集合的只有被选中的老类。",
          "interaction": "点格子看距离、是否入选，以及该老类是否进入调整集合",
          "next": "推开的力度由 margin 决定",
          "notes": "证据：p.6 §4.2 明确新类数据充足故不修改其表示；p.7 只对邻居对的老类采样并计算分离损失。矩阵数值为教学示意，真实邻居集合由具体数据集的文本特征算出。",
          "componentId": "rapf-pairmatrix",
          "moduleId": "m4"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "04 · 把邻居推开一个 margin",
      "modules": [
        {
          "kind": "module",
          "id": "m5",
          "title": "铰链损失与 margin",
          "desc": "拖动样本与 margin，观察 L_hinge 归零。",
          "componentId": "rapf-hinge"
        },
        {
          "kind": "module",
          "id": "m6",
          "title": "推开后的错判计数",
          "desc": "拖动替身点云，看点云越过分界的结果。",
          "componentId": "rapf-samplepush"
        }
      ],
      "scenes": [
        {
          "id": "p5-hinge",
          "title": "推到一个 margin 就撒手",
          "goal": "拖动采样样本与 margin，观察 L_hinge 何时归零。",
          "summary": "L_hinge = Σ max(d(c) − d(c̄) + m, 0)，够了就不再惩罚。",
          "interaction": "左右拖动样本点，或调 margin m，看两段距离与铰链条",
          "next": "错判点是不是真的少了",
          "notes": "证据：Eq.(5)（p.7）。d(c) 为样本到本类文本特征的距离，d(c̄) 为到相邻新类的距离，m 为常数余量。论文强调只做“小而有效”的调整，避免伤到其它旧类。",
          "componentId": "rapf-hinge",
          "moduleId": "m5"
        },
        {
          "id": "p6-push",
          "title": "推开后，错判点几乎消失",
          "goal": "拖动点云，看越过分界的替身数量。",
          "summary": "铰链把替身刚好推过边界，不追求越远越好。",
          "interaction": "左右拖动紫色点云，观察红点数与铰链总和下降",
          "next": "训练完之后，新旧参数怎么合并",
          "notes": "证据：Fig.5c（p.13）显示错判到新类的样本减少、正确分类增加、对其它类影响小；Table 6 是同一现象的单类计数。本页点云与计数为示意，m 固定 0.2。",
          "componentId": "rapf-samplepush",
          "moduleId": "m6"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "05 · 同一张方格纸上的参数融合",
      "modules": [
        {
          "kind": "module",
          "id": "m7",
          "title": "共享正交基与坐标",
          "desc": "点格子读旧、新坐标，理解为什么必须先换基。",
          "componentId": "rapf-basis"
        },
        {
          "kind": "module",
          "id": "m8",
          "title": "软掩码与偏置 b",
          "desc": "调 b，看每格融合权重与结果怎么变。",
          "componentId": "rapf-softmask"
        },
        {
          "kind": "module",
          "id": "m9",
          "title": "直接平均与分解融合",
          "desc": "切换看两种融合的版型差别。",
          "componentId": "rapf-fusion"
        }
      ],
      "scenes": [
        {
          "id": "p7-basis",
          "title": "先换到同一把尺，坐标才能相减",
          "goal": "点选方格纸上的格子，读出旧、新坐标与差值。",
          "summary": "W_old 经 SVD 拆成 B·R_old，新参数投影到同一 B 得到 R_new。",
          "interaction": "点格子读 R_old、R_new 与 |Δ|，对比“不同基直接相减”的错误",
          "next": "每个格子该用新坐标还是旧坐标",
          "notes": "证据：Eq.(8)(9)（p.7）；p.8 说明 W_old/W_new 在同一正交基下表示为 B·R，R 是任务特定知识，B 是共享知识空间。",
          "componentId": "rapf-basis",
          "moduleId": "m7"
        },
        {
          "id": "p8-mask",
          "title": "改动大的格子取新坐标",
          "goal": "调节偏置 b，观察软掩码与融合坐标的变化。",
          "summary": "M = min(1, |Δ|/max|Δ| + b)，R = (J−M)⊙R_old + M⊙R_new。",
          "interaction": "拖动 b 滑块，两幅格子同步变化，平均权重实时显示",
          "next": "不先对齐会怎样",
          "notes": "证据：Eq.(7)(10)（p.7–8）。改动越大表示越是在学新任务，融合时越保留新的；b 为常数偏置，正文未给取值。",
          "componentId": "rapf-softmask",
          "moduleId": "m8"
        },
        {
          "id": "p9-fusion",
          "title": "整体平均，还是逐格替换",
          "goal": "拖动改动格比例，比较整体平均与逐格掩码替换的差别。",
          "summary": "平均只把改动格拉到新旧中间值，未改的格保持原样；掩码在这些格上直接取新值。",
          "interaction": "拖动改动格比例滑块，看两件衣服的布块与旧款保留度",
          "next": "这些设计在真实数据上值多少",
          "notes": "证据：p.3 明确指出“不同于直接计算参数平均，本文的融合更细粒度、并考虑了任务间的共享知识”；Eq.(10)(11)（p.8）给出掩码融合。两侧布块为教学示意；对应的实测增益是 Table 5 中 PF w/o MD 79.28 → PF w/ MD 80.23。原文并未论证“直接平均会让版型走形”，此页不作该主张。页内把掩码简化为“全取或全不取”，真实 M 为 0–1 连续权重；逐元素平均只把改写过的格拉到新旧中点，未改的格不受影响。",
          "componentId": "rapf-fusion",
          "moduleId": "m9"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "06 · 结果与消融",
      "modules": [
        {
          "kind": "module",
          "id": "m10",
          "title": "三个数据集的对比",
          "desc": "切换数据集与指标，比较本方法与最强对比方法。",
          "componentId": "rapf-results"
        },
        {
          "kind": "module",
          "id": "m11",
          "title": "五级消融",
          "desc": "点任一级，看该级新增组件与增益。",
          "componentId": "rapf-ablation"
        }
      ],
      "scenes": [
        {
          "id": "p10-results",
          "title": "多数设置领先，但不是全部",
          "goal": "切换数据集与指标，比较本方法与最强对比方法。",
          "summary": "CIFAR100 / ImageNet100 / ImageNet-R 上按 Last 与 Avg 对照。",
          "interaction": "切换数据集与指标按钮，逐组比较绿柱与蓝柱",
          "next": "每一处设计各贡献了多少",
          "notes": "证据：Table 1–3（p.9–10），ViT-B/16 CLIP 权重、多类别顺序打乱取均值。蓝柱为该设置下最强的对比方法（逐组标注名称）。如实保留 CIFAR100 B50 Inc10 上 SLCA 79.92 高于本方法 79.36 的情况：论文也说“most settings”。",
          "componentId": "rapf-results",
          "moduleId": "m10"
        },
        {
          "id": "p11-ablation",
          "title": "每一级都算数",
          "goal": "点击消融阶梯的任一级，看新增组件与增益。",
          "summary": "随机配对几乎无效，文本配对 +2.24，融合 +3.24，分解再 +0.95。",
          "interaction": "点阶梯柱，侧栏给出该级增量与相对基线增益",
          "next": "什么情况下这套方法不成立",
          "notes": "证据：Table 5（p.12），ImageNet100 B0 Inc10，Last 精度：73.80 → 74.08 → 76.04 → 79.28 → 80.23。",
          "componentId": "rapf-ablation",
          "moduleId": "m11"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "07 · 边界与代价",
      "modules": [],
      "scenes": [
        {
          "id": "p12-limits",
          "title": "先问这条前提成立吗",
          "goal": "点击条件卡，判断该方法在这类数据上是否成立。",
          "summary": "依赖可靠类名；风格差异大时收益变小；α 需要手工选定。",
          "interaction": "点四张条件卡，看结论与依据",
          "next": "",
          "notes": "证据：p.14 Conclusion 自述手工阈值是局限；ImageNet-R 上仍领先但幅度小于 ImageNet100（按 Table 1–3 的 Last 差值计算，原文未解释）；Fig.4 与 p.3 说明只加一层线性 adapter、参数量远少于多 adapter 方法，能力上限也来自这里。",
          "componentId": "rapf-limits"
        }
      ]
    }
  ],
  "thumbnails": {
    "cover": "./thumbnails/cover.jpg",
    "p1-rack": "./thumbnails/p1-rack.jpg",
    "p2-gaussian": "./thumbnails/p2-gaussian.jpg",
    "p3-alpha": "./thumbnails/p3-alpha.jpg",
    "p4-matrix": "./thumbnails/p4-matrix.jpg",
    "p5-hinge": "./thumbnails/p5-hinge.jpg",
    "p6-push": "./thumbnails/p6-push.jpg",
    "p7-basis": "./thumbnails/p7-basis.jpg",
    "p8-mask": "./thumbnails/p8-mask.jpg",
    "p9-fusion": "./thumbnails/p9-fusion.jpg",
    "p10-results": "./thumbnails/p10-results.jpg",
    "p11-ablation": "./thumbnails/p11-ablation.jpg",
    "p12-limits": "./thumbnails/p12-limits.jpg"
  }
};
