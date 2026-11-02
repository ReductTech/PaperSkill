import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Camouflaged Object Detection",
    "titleZh": "伪装目标检测：搜索—识别网络",
    "venue": "CVPR '20 · 论文交互教程",
    "authors": "Deng-Ping Fan, Ge-Peng Ji, Guolei Sun, Ming-Ming Cheng, Jianbing Shen, Ling Shao",
    "affiliation": "IIAI · 南开大学 · 武汉大学 · ETH Zurich",
    "domain": "计算机视觉 · 伪装目标分割",
    "coreProblem": "伪装目标与背景在边缘、纹理、颜色上几乎一致，通用与显著目标检测既找不到它，也切不准它的边界。",
    "coreInsight": "先搜寻把目标从背景里挑出来，再精修它的边界。",
    "keywords": [
      "伪装目标检测",
      "COD10K",
      "感受野",
      "部分解码器",
      "双监督"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "显著 / 通用目标检测",
      "desc": "光斑只跟着画面里最显眼的地方走，藏在叶间的虫子始终没被看见。",
      "componentId": "sinet-cover"
    },
    "newMethod": {
      "title": "SINet：搜索 + 识别",
      "desc": "光斑由大到小扫过灌木，锁定后放大镜凑近，虫子的边界被勾出来。",
      "componentId": "sinet-cover"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "01 · 伪装目标检测的问题",
      "modules": [
        {
          "kind": "module",
          "id": "m-similarity",
          "title": "相似度决定可分辨性",
          "desc": "拖动背景匹配度，观察前景与背景的 RGB 分布如何重合，χ² 距离何时跌破 0.9。",
          "componentId": "sinet-similarity"
        }
      ],
      "scenes": [
        {
          "id": "s2-similarity",
          "title": "伪装为什么难：前景与背景的直方图几乎重合",
          "goal": "拖动背景匹配度，看虫体与叶片的颜色如何靠拢，什么时候连边界都判不出来。",
          "summary": "χ² 距离小于 0.9 时，论文把这张图记为 IB（边界不可辨）。",
          "interaction": "拖动背景匹配度滑块，观察虫体颜色、两条直方图与 χ² 读数",
          "next": "有了数据集，才能把这种难度变成可训练的样本",
          "notes": "证据：Tab.2 的 IB 定义——前景与背景 RGB 直方图的 χ² 距离小于 0.9；Fig.2 的蝴蝶与香蕉。界面里「匹配度→χ²」是线性示意映射，不是论文的测量结果。χ² 阈值是论文给属性打标签的判据之一，不能等同于模型内部困难的全部来源。",
          "componentId": "sinet-similarity",
          "moduleId": "m-similarity"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "02 · COD10K 数据集",
      "modules": [
        {
          "kind": "module",
          "id": "m-cod10k",
          "title": "规模与标注层级",
          "desc": "点选三个数据集，比较图像数量与标注完整度。",
          "componentId": "sinet-cod10k"
        }
      ],
      "scenes": [
        {
          "id": "s3-cod10k",
          "title": "COD10K：10,000 张图像与五层标注",
          "goal": "点选数据集，判断这个任务为什么一开始就得自建数据。",
          "summary": "COD10K 是四类标注齐全、并显式划分训练与测试的那个。",
          "interaction": "点选 CHAMELEON / CAMO / COD10K，观察条长与右侧标注层级点亮",
          "next": "数据齐了，接下来看 SINet 怎么把它找出来",
          "notes": "证据：Tab.1 与 §3.1–§3.3（10,000 图 = 5,066 伪装 + 3,000 背景 + 1,934 非伪装；78 个子类；5,069 个 object 掩码、5,930 个 instance GT；6,000/4,000 划分；instance 级标注平均约 60 分钟/图）。正文对超类数目不一致：§3.1 写 10 个超类，§3.2/§3.3 写 5 个（terrestrial/atmobios/aquatic/amphibian/other）。条形只表示图像数量，不代表难度。",
          "componentId": "sinet-cod10k",
          "moduleId": "m-cod10k"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "03 · SINet 结构：搜索与识别",
      "modules": [
        {
          "kind": "module",
          "id": "m-rf",
          "title": "RF 感受野组",
          "desc": "选择五个分支之一，观察光斑尺度与核尺寸如何变化。",
          "componentId": "sinet-rf"
        },
        {
          "kind": "module",
          "id": "m-search",
          "title": "搜索阶段 Cs 与 Ch",
          "desc": "移动注意力中心、调整 σ，观察 g(X2) 与 Ch=max(g,Cs) 的变化。",
          "componentId": "sinet-search"
        },
        {
          "kind": "module",
          "id": "m-pdc",
          "title": "PDC 门控融合",
          "desc": "逐层确认并与「直接相加」对比，观察边界完整度。",
          "componentId": "sinet-pdc"
        },
        {
          "kind": "module",
          "id": "m-arch",
          "title": "整体数据流",
          "desc": "点选组件，高亮通路并读取张量尺寸。",
          "componentId": "sinet-arch"
        }
      ],
      "scenes": [
        {
          "id": "s4-rf",
          "title": "RF 感受野组：五个分支看到不同尺度",
          "goal": "点选分支 k，看光斑能覆盖到虫体的哪一部分。",
          "summary": "k 越大，卷积核 (2k−1)×(2k−1) 越大，k>2 时再加膨胀率 2k−1。",
          "interaction": "点选 k=1…5，观察光斑半径、核尺寸标签与虫体被覆盖的部位",
          "next": "光斑扫过之后，怎么把候选区域标出来",
          "notes": "证据：§4.1 RF 组件——五个分支，每支先用 1×1 卷积把通道降到 32，再接 (2k−1)×(2k−1) 卷积，k>2 的分支再加 dilation=2k−1 的 3×3 卷积，前四支拼接后 1×1 降回 32，再与第五支相加并过 ReLU。类比边界：光斑只示意「看得多广」，不代表卷积权重学到了什么。",
          "componentId": "sinet-rf",
          "moduleId": "m-rf"
        },
        {
          "id": "s5-search",
          "title": "搜索阶段：粗图 Cs 与注意力增强 Ch",
          "goal": "拖动注意力中心与 σ，观察 Ch 为什么能在 Cs 之上补出细节。",
          "summary": "Ch 逐像素取 g(X2) 与 Cs 的较大值，注意力没打到的地方仍保留粗定位。",
          "interaction": "在 16×16 网格上拖动光斑，调 σ，观察 g(X2)、Ch 与读数",
          "next": "确定了大致位置，再靠识别阶段把边界修好",
          "notes": "证据：Eq.(1) Cs=PDs(rf1..rf4)；Eq.(2) Ch=fmax(g(X2,σ,λ),Cs)，其中 g 是 σ=32、λ=4 的高斯滤波后归一化，fmax 逐像素取最大。论文里 σ、λ 是固定值，滑块只用于观察敏感性。类比边界：真实 g(·) 作用在中层特征图上，不是在人工概率网格上。",
          "componentId": "sinet-search",
          "moduleId": "m-search"
        },
        {
          "id": "s6-pdc",
          "title": "识别阶段：PDC 的逐级门控融合",
          "goal": "逐层确认并与「直接相加」对比，判断门控乘法解决了什么。",
          "summary": "PDC 用逐元素乘法把深层定位压到浅层特征上，再上采样拼接。",
          "interaction": "点层 k=4→1 逐级确认，切换门控乘法 / 直接相加",
          "next": "把四个模块放回同一张结构图",
          "notes": "证据：Eq.(4) rf_c2_k = rf_c1_k ⊗ Π_{j=k+1..M} Bconv(UP(rf_c1_j))；PDC 是对 partial decoder component [68] 的稠密连接扩展。界面里的「逐层确认」是融合顺序的教学化，不是网络运行时序。",
          "componentId": "sinet-pdc",
          "moduleId": "m-pdc"
        },
        {
          "id": "s7-arch",
          "title": "SINet 数据流：从 352×352 到两张伪装图",
          "goal": "点选组件，说出它接在谁后面、输出什么尺寸。",
          "summary": "ResNet-50 五级特征 → 三级融合 → RF → PDC_s → SA → PDC_i → 两张 352×352 概率图。",
          "interaction": "点选输入、骨干、RF、PDC_s、SA、PDC_i、上采样、损失，观察高亮通路与尺寸",
          "next": "结构之外，两处监督怎么分工",
          "notes": "证据：Fig.8 的尺寸标注（352×352×3；88×88×64；44×44×256；22×22×1024；11×11×2048）与 §4.1–§4.2。图上层级按 ResNet-50 五级输出标注，具体实现以官方代码为准。",
          "componentId": "sinet-arch",
          "moduleId": "m-arch"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "04 · 训练与双监督",
      "modules": [
        {
          "kind": "module",
          "id": "m-loss",
          "title": "双监督损失",
          "desc": "切换监督组合，观察两路输出的错分区域与损失读数。",
          "componentId": "sinet-loss"
        }
      ],
      "scenes": [
        {
          "id": "s8-loss",
          "title": "双监督：粗看与细看分别被约束",
          "goal": "切换监督组合，判断为什么粗图和细图都要算交叉熵。",
          "summary": "L = Ls_CE + Li_CE，两处监督来自搜索与识别两个阶段。",
          "interaction": "切换「仅 Ls」「仅 Li」「双 CE」，观察两路掩码与损失读数",
          "next": "训练完，看实测结果",
          "notes": "证据：Eq.(5)；§4.3——Adam、batch size 36、lr 1e-4、30 epoch 约 70 分钟（early-stop）、352×352 推理 0.2 秒（TITAN RTX）。界面上的错分区域与损失读数是构造的教学示意，标注「示意」，不是论文报告的训练曲线。",
          "componentId": "sinet-loss",
          "moduleId": "m-loss"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "05 · 结果与适用边界",
      "modules": [
        {
          "kind": "module",
          "id": "m-results",
          "title": "Tab.3 实测结果",
          "desc": "切换测试集与指标，比较 SINet 三档设置与 CPD / EGNet / FPN。",
          "componentId": "sinet-results"
        },
        {
          "kind": "module",
          "id": "m-general",
          "title": "跨数据集泛化",
          "desc": "切换训练集，读取自测与跨域均值、下降幅度。",
          "componentId": "sinet-general"
        }
      ],
      "scenes": [
        {
          "id": "s9-results",
          "title": "Tab.3 实测结果：三种训练设置与四条基线",
          "goal": "切换测试集与指标，判断「换哪个测试集」会不会改变结论。",
          "summary": "同一张表里，SINet (iii) 全面领先，但幅度随指标与测试集变化。",
          "interaction": "点选 CHAMELEON / CAMO-Test / COD10K-Test 与四个指标，读取六条条形与差值",
          "next": "换个场景还成立吗",
          "notes": "证据：Tab.3。三档训练设置 (i) CAMO、(ii) COD10K、(iii) CAMO+COD10K+EXTRA；基线 CPD / EGNet / FPN 用设置 (iv) 训练。Sα/Eφ/Fwβ 越高越好，M 越低越好。看点：COD10K 训练在 CAMO 上反而最低（0.665），只看单一测试集会误判；CHAMELEON 仅 76 张，差距更小。这是训练数据不同的三档设置，不是模块消融；论文未给出模块级消融表。",
          "componentId": "sinet-results",
          "moduleId": "m-results"
        },
        {
          "id": "s11-general",
          "title": "换个场景：跨数据集泛化与适用边界",
          "goal": "切换训练集，判断换林子之后会掉多少，以及论文没做什么。",
          "summary": "CAMO 训练换域掉 15.6%，COD10K 训练只掉 2.40%。",
          "interaction": "切换训练集 CAMO / COD10K，读取自测、其他均值与 drop",
          "next": "",
          "notes": "证据：Tab.4（每个数据集随机 800 训练 / 200 测试，训练到损失稳定）——CAMO 训练：自测 0.803、其他均值 0.678、drop 15.6%；COD10K 训练：自测 0.700、其他均值 0.683、drop 2.40%。Tab.4 与 Tab.3 协议不同，两表数字不可直接比较。边界：object-level only，instance 级、RGB-D、弱监督、零样本均为作者列出的未来工作（§7）。",
          "componentId": "sinet-general",
          "moduleId": "m-general"
        }
      ]
    }
  ],
  "thumbnails": {
    "cover": "./thumbnails/cover.png",
    "s2-similarity": "./thumbnails/s2-similarity.png",
    "s3-cod10k": "./thumbnails/s3-cod10k.png",
    "s4-rf": "./thumbnails/s4-rf.png",
    "s5-search": "./thumbnails/s5-search.png",
    "s6-pdc": "./thumbnails/s6-pdc.png",
    "s7-arch": "./thumbnails/s7-arch.png",
    "s8-loss": "./thumbnails/s8-loss.png",
    "s9-results": "./thumbnails/s9-results.png",
    "s11-general": "./thumbnails/s11-general.png"
  }
};
