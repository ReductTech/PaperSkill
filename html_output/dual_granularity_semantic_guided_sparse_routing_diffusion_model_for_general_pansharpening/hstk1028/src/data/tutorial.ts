import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Dual-Granularity Semantic Guided Sparse Routing Diffusion Model for General Pansharpening",
    "titleZh": "SGDiff：双粒度语义引导的通用全色锐化",
    "venue": "CVPR 2025",
    "authors": "Yinghui Xing · Litao Qu · Shizhou Zhang · Di Xu · Yingkun Yang · Yanning Zhang",
    "affiliation": "西北工业大学 · 华为云",
    "domain": "遥感影像融合",
    "coreProblem": "不同卫星与场景之间的域差异，限制同一个融合模型的泛化。",
    "coreInsight": "把场景与定位描述转为稀疏通道门控，在残差扩散中选择合适的专家。",
    "keywords": [
      "全色锐化",
      "双粒度语义",
      "稀疏路由",
      "混合专家",
      "残差扩散"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "固定处理偏好的模型",
      "desc": "同样的修片工具不一定适合所有照片。",
      "componentId": "s-g-cover"
    },
    "newMethod": {
      "title": "SGDiff 语义条件路由",
      "desc": "结合整体与局部描述，选择通道专家。",
      "componentId": "s-g-cover"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "传感器与场景依赖",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "传感器与场景依赖",
          "desc": "为什么同一模型难以覆盖不同卫星与场景？",
          "componentId": "s-g-domain"
        }
      ],
      "scenes": [
        {
          "id": "domain",
          "title": "传感器与场景依赖",
          "goal": "为什么同一模型难以覆盖不同卫星与场景？",
          "summary": "同一卫星内部也有内容差异，跨卫星也有地物共性。",
          "interaction": "选择建筑、农田或河流，观察两侧工具激活变化。",
          "next": "双粒度语义从哪里来？",
          "notes": "p.1–2 §1 Fig.1。工具选择是通道门控类比；不运行网络，不伪造质量差异。",
          "componentId": "s-g-domain",
          "moduleId": "1.1",
          "thumbnail": "./thumbnails/domain.jpg"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "双粒度语义条件",
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "双粒度语义条件",
          "desc": "场景类别与定位描述各提供什么？",
          "componentId": "s-g-semantics"
        }
      ],
      "scenes": [
        {
          "id": "semantics",
          "title": "双粒度语义条件",
          "goal": "场景类别与定位描述各提供什么？",
          "summary": "MS提供场景分类，PAN提供带位置关系的描述，两者经冻结CLIP编码。",
          "interaction": "选择地物区域，比较粗粒度类别与细粒度文本。",
          "next": "先看被重建的是什么。",
          "notes": "p.4 §3.4.1 Eq.1。真实提示场景类别为River/Agricultural/Buildings/Freeway/Forest/Harbor/Mountains；本演示只列三类。文本为教学示例，区域语义不是逐像素mask。",
          "componentId": "s-g-semantics",
          "moduleId": "2.1",
          "thumbnail": "./thumbnails/semantics.jpg"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "在残差上进行扩散",
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "在残差上进行扩散",
          "desc": "为什么不直接生成整幅HRMS？",
          "componentId": "s-g-residual"
        }
      ],
      "scenes": [
        {
          "id": "residual",
          "title": "在残差上进行扩散",
          "goal": "为什么不直接生成整幅HRMS？",
          "summary": "网络学习Y−M的修正量；最终预测残差加回上采样MS。",
          "interaction": "改变噪声程度，观察四维残差样本的变化。",
          "next": "如何在不同波段数下保持结构？",
          "notes": "p.3 §3.2，p.5 §3.5 Eq.4。前向示例sqrt(alpha)X0+sqrt(1-alpha)epsilon；alpha=1-0.95t仅为教学。本文训练目标预测X0；正文逐步重建描述不代表代码直接输出Xt−1。",
          "componentId": "s-g-residual",
          "moduleId": "3.1",
          "thumbnail": "./thumbnails/residual.jpg"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "三维去噪网络",
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "三维去噪网络",
          "desc": "波段数变化时，哪一个维度改变？",
          "componentId": "s-g-backbone"
        }
      ],
      "scenes": [
        {
          "id": "backbone",
          "title": "三维去噪网络",
          "goal": "波段数变化时，哪一个维度改变？",
          "summary": "光谱轴C与特征通道N不同；3D卷积与编码解码骨干处理融合条件。",
          "interaction": "在4波段和8波段之间切换，观察输入形状。",
          "next": "语义怎样变成通道权重？",
          "notes": "p.4 §3.3 Fig.3。输入It∈R^(3×C×H×W)，浅层F0∈R^(N×C×H×W)。PAN按光谱维对齐；每个Transformer含3DMTA与SG-MoE。示意不保证任意新传感器均成功。",
          "componentId": "s-g-backbone",
          "moduleId": "4.1",
          "thumbnail": "./thumbnails/backbone.jpg"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "从场景语义到稀疏门控",
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "从场景语义到稀疏门控",
          "desc": "为什么有些通道被关闭？",
          "componentId": "s-g-scenegate"
        }
      ],
      "scenes": [
        {
          "id": "scene-gate",
          "title": "从场景语义到稀疏门控",
          "goal": "为什么有些通道被关闭？",
          "summary": "语义向量经线性层与ReLU，得到当前层的非负通道门控。",
          "interaction": "选择场景，比较线性映射前后数值与工具激活。",
          "next": "区域信息如何继续细化？",
          "notes": "p.4–5 §3.4.1 Eq.1–2。真实权重由训练获得，本页显式三维softmax与六行矩阵仅作可复算教学；负值ReLU归零。",
          "componentId": "s-g-scenegate",
          "moduleId": "5.1",
          "thumbnail": "./thumbnails/scene-gate.jpg"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "场景到区域的顺序细化",
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "场景到区域的顺序细化",
          "desc": "两路语义是同时作用于同一输入吗？",
          "componentId": "s-g-groundgate"
        }
      ],
      "scenes": [
        {
          "id": "ground-gate",
          "title": "场景到区域的顺序细化",
          "goal": "两路语义是同时作用于同一输入吗？",
          "summary": "先场景门控得到Fs，再对Fs应用定位语义门控得到Fg。",
          "interaction": "选择小船或岸线，观察第二级权重和示例输出。",
          "next": "共享专家为何常开？",
          "notes": "p.5 §3.4.2 Eq.3。x=[.3,.8,.5]，场景权重[1,.4,0]；Fs=[.364,.35,.09]，定位权重两种，结果严格计算；线性专家是3D卷积的标量教学替代。",
          "componentId": "s-g-groundgate",
          "moduleId": "6.1",
          "thumbnail": "./thumbnails/ground-gate.jpg"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "共享专家与非固定路由",
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "共享专家与非固定路由",
          "desc": "怎样保留共性并允许专门化？",
          "componentId": "s-g-shared"
        }
      ],
      "scenes": [
        {
          "id": "shared",
          "title": "共享专家与非固定路由",
          "goal": "怎样保留共性并允许专门化？",
          "summary": "10%通道始终激活；其他专家由条件决定，激活数不固定为TopK。",
          "interaction": "开关共享工具并切换场景，观察共同底座。",
          "next": "训练如何鼓励稀疏？",
          "notes": "p.5 §3.4.2及§4.1，p.8消融。六个工具数量仅为可视化，不代表论文10%比例；数学稀疏不自动等于墙钟提速。",
          "componentId": "s-g-shared",
          "moduleId": "7.1",
          "thumbnail": "./thumbnails/shared.jpg"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "重建目标与门控正则",
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "重建目标与门控正则",
          "desc": "稀疏惩罚究竟惩罚什么？",
          "componentId": "s-g-training"
        }
      ],
      "scenes": [
        {
          "id": "training",
          "title": "重建目标与门控正则",
          "goal": "稀疏惩罚究竟惩罚什么？",
          "summary": "重建L1约束干净残差，额外L1约束门控大小。",
          "interaction": "调节弱通道权重和示例μ，观察总损失计算。",
          "next": "论文数据支持哪些结论？",
          "notes": "p.5 §3.5 Eq.4–5，§4.1。示例固定Lrec=.12，仅算损失非优化。论文Adam beta=.9/.999，lr=2e−4余弦，batch8，300000迭代，T1000；前50000迭代μ1e−6，之后冻结门控。",
          "componentId": "s-g-training",
          "moduleId": "8.1",
          "thumbnail": "./thumbnails/training.jpg"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "全分辨率与零样本证据",
      "modules": [],
      "scenes": [
        {
          "id": "results",
          "title": "全分辨率与零样本证据",
          "goal": "跨传感器表现是否有实测支持？",
          "summary": "联合训练的模型在未见WV2数据上测试，Q8/SAM/ERGAS/SCC有比较。",
          "interaction": "阅读两个协议各自的柱状图，不跨协议比较数值。",
          "next": "哪项设计带来收益？",
          "notes": "p.7 Table2，p.8 Table4。QB HQNR：U2Net .8393±.0375；TMDiff .9075±.0102；SGDiff .9341±.0105；图显示均值，±量按原表保留不擅自解释。WV2 ERGAS：4.4306、4.1420、3.8683，未报方差。WV2 Q8 SGDiff .8577/TMDiff .8310；SCC .9345/.9272；SAM 4.9679/5.1270。",
          "componentId": "s-g-results",
          "thumbnail": "./thumbnails/results.jpg"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "核心设计的消融证据",
      "modules": [],
      "scenes": [
        {
          "id": "ablation",
          "title": "核心设计的消融证据",
          "goal": "性能提升能否归因到具体组件？",
          "summary": "移除SG-MoE、定位描述、共享专家或稀疏正则，WV3 SAM均上升。",
          "interaction": "比较点的位置与精确数值，注意越低越好。",
          "next": "错误语义会有什么风险？",
          "notes": "p.7 Table3，WV3降分辨率，SAM：无SGMoE2.9264，无grounding2.9356，无共享2.9913，无正则2.8809，完整2.7708。不推断统计显著性。",
          "componentId": "s-g-ablation",
          "thumbnail": "./thumbnails/ablation.jpg"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-11",
      "title": "错误语义与应用边界",
      "modules": [
        {
          "kind": "module",
          "id": "11.1",
          "title": "错误语义与应用边界",
          "desc": "当描述不准确时，门控还能靠谱吗？",
          "componentId": "s-g-boundary"
        }
      ],
      "scenes": [
        {
          "id": "boundary",
          "title": "错误语义与应用边界",
          "goal": "当描述不准确时，门控还能靠谱吗？",
          "summary": "语义条件控制专家选择，错误条件可能引导错误路由。",
          "interaction": "切换正确与错误需求，观察同一照片的激活差别。",
          "next": "回到论文检查真实实现与应用成本。",
          "notes": "p.4–5机制推演，非作者量化失败实验。GeoChat/CLIP冻结；论文未量化本演示语义错误；训练用有参考残差，并非无监督。教学不加载模型、不上传图像、不声称实际速度。",
          "componentId": "s-g-boundary",
          "moduleId": "11.1",
          "thumbnail": "./thumbnails/boundary.jpg"
        }
      ]
    }
  ],
  "thumbnails": {
    "cover": "./thumbnails/cover.jpg"
  }
};
