import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Zoom In and Out: A Mixed-scale Triplet Network for Camouflaged Object Detection",
    "titleZh": "放大与缩小：混合尺度三元网络",
    "venue": "CVPR '22 · 论文交互教程",
    "authors": "Youwei Pang, Xiaoqi Zhao, Tian-Zhu Xiang, Lihe Zhang, Huchuan Lu",
    "affiliation": "大连理工大学 · 鹏城实验室 · IIAI",
    "domain": "计算机视觉 · 伪装目标分割",
    "coreProblem": "伪装目标不仅与背景高度相似，还尺度差异大、外观模糊、常被遮挡，单一尺度的特征看不全。",
    "coreInsight": "对同一张图放大和缩小，把三档里互补的线索筛出来再融合，并把预测从犹豫逼向两极。",
    "keywords": [
      "混合尺度",
      "尺度整合单元",
      "分层混合尺度单元",
      "不确定性感知损失"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "单尺度检测",
      "desc": "定焦一张照片，虫子和草一起糊掉，对焦框始终没落到它身上。",
      "componentId": "zoomnet-cover"
    },
    "newMethod": {
      "title": "ZoomNet：混合尺度 + UAL",
      "desc": "三档变焦轮流看，注意力筛完再融合，取景器里的直方图被推向两极。",
      "componentId": "zoomnet-cover"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "01 · 单尺度为什么不够",
      "modules": [
        {
          "kind": "module",
          "id": "m-scale",
          "title": "变焦刻度与可见信息",
          "desc": "拖动变焦刻度，观察细肢、躯干、整体轮廓三者在不同缩放下的可见性。",
          "componentId": "zn-scale"
        }
      ],
      "scenes": [
        {
          "id": "s2-scale",
          "title": "同一个目标，不同缩放看到不同东西",
          "goal": "拖动变焦环，判断为什么单尺度只能兼顾「局部细节」或「整体轮廓」其中一头。",
          "summary": "细肢要放大才看得清，整体轮廓要缩小才出得来。",
          "interaction": "拖动 0.5×–1.5× 变焦滑块，观察虫体尺寸与三个结构指示灯的切换",
          "next": "既然一档不够，就把三档一起拍下来",
          "notes": "证据：§1 与 §3——论文把 COD 的第二类困难归结为尺度多样（另两类是外观模糊与遮挡），并以尺度空间理论为依据做多尺度输入。界面里三个可见性阈值是解释「互补」的教学判据，不是论文的定量结论。",
          "componentId": "zn-scale",
          "moduleId": "m-scale"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "02 · 三尺度输入与共享编码器",
      "modules": [
        {
          "kind": "module",
          "id": "m-triplet",
          "title": "输入组合与融合方式",
          "desc": "选择要哪几档变焦、以及相加还是 SIU 融合，读取 Tab.3 的实测指标。",
          "componentId": "zn-triplet"
        }
      ],
      "scenes": [
        {
          "id": "s3-triplet",
          "title": "0.5× / 1.0× / 1.5×：辅助尺度怎么用",
          "goal": "对比单尺度、简单相加与 SIU，判断辅助尺度的收益从哪来。",
          "summary": "0.5× 单独用会掉 12%，三尺度全给 SIU 才提升 6.91%。",
          "interaction": "点选输入组合与融合方式（无/相加/SIU），读取五指标条形与相对提升",
          "next": "SIU 到底按什么规则给三档分配权重",
          "notes": "证据：Tab.3（CAMO + COD10K 平均，全部基于 Tab.2 的基线 x）。1.0× 为基线 0.797/0.649/0.063/0.704/0.875；0.5× 下降 12.03%；1.5× 提升 4.05%；三尺度 SIU 0.827/0.700/0.054/0.751/0.898，+6.91%。相对提升是五个指标的平均相对变化，不是单一指标。三尺度经验取 1.0/1.5/0.5（§3.2）。",
          "componentId": "zn-triplet",
          "moduleId": "m-triplet"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "03 · 尺度整合与混合尺度解码",
      "modules": [
        {
          "kind": "module",
          "id": "m-siu",
          "title": "SIU 的注意力权重",
          "desc": "调整三个尺度的权重，观察融合图与定位的变化。",
          "componentId": "zn-siu"
        },
        {
          "kind": "module",
          "id": "m-hmu",
          "title": "HMU 分组迭代",
          "desc": "切换分组数 g 并点选组号，读取 Tab.2 的 g 消融与 FLOPs。",
          "componentId": "zn-hmu"
        }
      ],
      "scenes": [
        {
          "id": "s4-siu",
          "title": "SIU：用 softmax 给三个尺度分配权重",
          "goal": "操作三个权重的分配，判断「自适应加权」比「等权相加」强在哪。",
          "summary": "三通道注意力经 softmax 归一后加权求和，权重由数据自己决定。",
          "interaction": "拖动三个尺度权重滑块，观察归一化比例、融合图与定位反馈",
          "next": "融合之后的特征还要逐级细化",
          "notes": "证据：Eq.(1) Ai = softmax(Ψ([U(f0.5), f1.0, D(f1.5)], φ))，fi = A0.5·U(f0.5) + A1.0·f1.0 + A1.5·D(f1.5)；D 为 max+average 混合池化下采样，U 为双线性插值。类比边界：真实权重来自注意力生成器的卷积输出，界面用滑块代替，融合图的「重影」只是示意。",
          "componentId": "zn-siu",
          "moduleId": "m-siu"
        },
        {
          "id": "s5-hmu",
          "title": "HMU：分组迭代 + 通道调制",
          "goal": "切换分组数并点选组号，判断为什么 g=6 是最佳折中。",
          "summary": "组与组之间逐个交接一份特征，最后用通道调制向量加权。",
          "interaction": "点选 g=2/4/6/8，再点任一组查看它与下一组的交接",
          "next": "结构之外，还有一个不依赖标注的损失",
          "notes": "证据：Eq.(2) 先上采样相加，Eq.(3) 通道调制；TM 共 5 个 HMU 自顶向下。Tab.2（含 SIU+UAL）：g=2 0.835/0.721/0.030/0.758/0.902（173.616 GFLOPs）；g=4 0.836/0.723/0.029/0.761/0.905（188.556）；g=6 0.838/0.729/0.029/0.766/0.911（203.496）；g=8 0.836/0.726/0.029/0.763/0.907（218.436）。画布只表达串联交接，不还原卷积维度。",
          "componentId": "zn-hmu",
          "moduleId": "m-hmu"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "04 · 不确定性感知损失",
      "modules": [
        {
          "kind": "module",
          "id": "m-ual",
          "title": "UAL 与预测极化",
          "desc": "切换幂指数 α，观察概率直方图与 Tab.4 指标的变化。",
          "componentId": "zn-ual"
        }
      ],
      "scenes": [
        {
          "id": "s6-ual",
          "title": "UAL：把「犹豫」推向两极",
          "goal": "切换 α 与是否启用 UAL，判断这条损失在优化什么、代价是什么。",
          "summary": "l = 1 − |2p − 1|²，惩罚接近 0.5 的预测，且不需要 ground truth。",
          "interaction": "点选 α=1/2/4/8 或无 UAL，观察直方图形态与五指标",
          "next": "把结构和损失一起拿去四个数据集上比",
          "notes": "证据：§3.5 定义 l_UAL = 1 − |2p−1|²，L = L_BCEL + λ·L_UAL，λ 默认余弦递增。Tab.4：无 UAL 0.843/0.694/0.032/0.743/0.909；α=1 0.834/0.716/0.029/0.757/0.903；α=2 0.838/0.729/0.029/0.766/0.911（默认）；α=4 0.834/0.727/0.029/0.763/0.903；α=8 0.833/0.725/0.029/0.760/0.900。注意 Sm 在加入 UAL 后由 0.843 降到 0.838，是权衡而非全面提升。直方图是形状示意，真实直方图在补充材料。",
          "componentId": "zn-ual",
          "moduleId": "m-ual"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "05 · 结果与代价",
      "modules": [
        {
          "kind": "module",
          "id": "m-results",
          "title": "四数据集主结果",
          "desc": "切换数据集与指标，比较四条方法。",
          "componentId": "zn-results"
        },
        {
          "kind": "module",
          "id": "m-ablation",
          "title": "逐级加模块",
          "desc": "勾选 HMU/SIU/UAL，观察指标与算力同步变化。",
          "componentId": "zn-ablation"
        },
        {
          "kind": "module",
          "id": "m-boundary",
          "title": "代价与适用边界",
          "desc": "切换算力、数据、指标三个视角看这套方法的限制。",
          "componentId": "zn-boundary"
        }
      ],
      "scenes": [
        {
          "id": "s7-results",
          "title": "四个 COD 数据集上的主结果",
          "goal": "切换数据集与指标，判断领先幅度是否稳定。",
          "summary": "四数据集五指标全面领先，MAE 的优势最明显。",
          "interaction": "点选 CAMO/CHAMELEON/COD10K/NC4K 与五个指标，读取四条条形",
          "next": "看看每个模块各贡献多少",
          "notes": "证据：Tab.1。Ours 四数据集 Sm/Fωβ/MAE/Fβ/Em：CAMO .820/.752/.066/.794/.892；CHAMELEON .902/.845/.023/.864/.958；COD10K .838/.729/.029/.766/.911；NC4K .853/.784/.043/.818/.912。UJSC 用星号标注引入了额外 SOD 数据。§4.2 指出相对次优 C2F-Net，四数据集平均 MAE 提升 19.3%，Fωβ/Fβ 约 4%。Tab.1 与 Tab.2/3/4 协议不同，不可跨表比较。",
          "componentId": "zn-results",
          "moduleId": "m-results"
        },
        {
          "id": "s8-ablation",
          "title": "消融：每个模块贡献多少",
          "goal": "逐级勾选模块，判断收益来自结构设计还是参数预算。",
          "summary": "同算力的普通卷积扩展只有 0.815，说明增益来自 SIU/HMU 的设计。",
          "interaction": "勾选 HMU(g=6)/SIU/UAL，或切到「同开销普通卷积」对照，读取指标与 GFLOPs",
          "next": "这些收益要用多少算力换",
          "notes": "证据：Tab.2（COD10K-Test）。基线 41.885 GFLOPs / 30.453M → 0.812/0.637/0.039/0.692/0.898；+HMU 78.560 → 0.820/0.654/0.037/0.706/0.897；+SIU 166.821 → 0.837/0.682/0.034/0.731/0.912；+SIU+HMU 203.496/28.794 → 0.843/0.694/0.032/0.743/0.909；+SIU+HMU+UAL 203.496/32.382 → 0.838/0.729/0.029/0.766/0.911；同参数量同 FLOPs 的普通卷积扩展 207.647/41.975 → 0.815/0.632/0.040/0.689/0.896。",
          "componentId": "zn-ablation",
          "moduleId": "m-ablation"
        },
        {
          "id": "s9-boundary",
          "title": "代价、数据与指标上的三条边界",
          "goal": "切换三个视角，说出这套方法不适用或需谨慎的地方。",
          "summary": "算力涨约 4.9 倍、NC4K 只做测试、UAL 让 Sm 略降。",
          "interaction": "点选算力 / 数据 / 指标权衡三个视角，读取对应结论",
          "next": "",
          "notes": "证据：Tab.2 的 41.885→203.496 GFLOPs（约 4.9 倍），参数量 30.453M→28.794M；§4.1 训练用 COD10K 3,040 + CAMO 1,000，NC4K 4,121 只作测试，SGD、lr 0.05、40 epoch、bs 8、单张 2080Ti、主尺度 384×384；Tab.4 中加 UAL 后 Sm 0.843→0.838。SOD 上的结论在补充材料。",
          "componentId": "zn-boundary",
          "moduleId": "m-boundary"
        }
      ]
    }
  ],
  "thumbnails": {
    "cover": "./thumbnails/cover.png",
    "s2-scale": "./thumbnails/s2-scale.png",
    "s3-triplet": "./thumbnails/s3-triplet.png",
    "s4-siu": "./thumbnails/s4-siu.png",
    "s5-hmu": "./thumbnails/s5-hmu.png",
    "s6-ual": "./thumbnails/s6-ual.png",
    "s7-results": "./thumbnails/s7-results.png",
    "s8-ablation": "./thumbnails/s8-ablation.png",
    "s9-boundary": "./thumbnails/s9-boundary.png"
  }
};
