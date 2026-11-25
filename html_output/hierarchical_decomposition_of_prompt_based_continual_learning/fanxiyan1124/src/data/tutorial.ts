import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Hierarchical Decomposition of Prompt-Based Continual Learning: Rethinking Obscured Sub-optimality",
    "titleZh": "提示式持续学习的层级分解：重新审视被遮蔽的次优性",
    "venue": "NeurIPS 2023 Spotlight · Tsinghua University",
    "authors": "Liyuan Wang, Jingyi Xie, Xingxing Zhang, Mingyi Huang, Hang Su, Jun Zhu",
    "affiliation": "Tsinghua University",
    "domain": "视觉持续学习 · 预训练 ViT · 层级提示",
    "coreProblem": "自监督预训练下，任务知识难以写进提示后的表征，测试时也难以从未受提示的表征里选对任务；现有提示方法为何会在监督预训练上看似接近饱和？",
    "coreInsight": "把联合类别预测拆成任务内预测、任务身份推断与任务自适应预测，用任务专属提示、双表征统计量和对比正则显式优化三个层级。",
    "keywords": [
      "持续学习",
      "参数高效提示",
      "类别增量学习",
      "自监督预训练",
      "任务身份推断",
      "表征统计"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "旧式单头提示",
      "desc": "一张负片只经过当前显影液，旧画面被新任务反复覆盖；看似完成，边角却逐渐发灰。",
      "componentId": "hide-cover-old"
    },
    "newMethod": {
      "title": "层级显影台",
      "desc": "负片先被归档、再由任务提示显影；接触表定位任务，放大镜检查类别，旧底片不被重放。",
      "componentId": "hide-cover-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "顺序提示调优为何遮蔽次优性",
      "modules": [
        {
          "kind": "module",
          "id": "obscured",
          "title": "被监督预训练遮住的性能缺口",
          "desc": "切换 Sup-21K 与 iBOT-21K，对照 CKA、任务身份预测和单头补偿，观察次优性为何会被遮住。",
          "componentId": "hide-ch1-obscured"
        }
      ],
      "scenes": [
        {
          "id": "hide-ch1-obscured",
          "componentId": "hide-ch1-obscured",
          "moduleId": "obscured",
          "title": "顺序提示调优为何遮蔽次优性",
          "goal": "为什么监督预训练上看似接近饱和的提示方法，在自监督预训练下会暴露出被遮住的次优性？",
          "summary": "同一组旧式提示方法在 Sup-21K 与 iBOT-21K 上呈现不同图景：Sup-21K 的 CKA 较低，提示能够写入较多任务知识，单头分类又能补偿部分错误；iBOT-21K 的 CKA 更高，提示难以改写表征，任务身份预测随之下降，底层次优性才暴露出来。",
          "interaction": "点击 Sup-21K / iBOT-21K 切换观测范式。CIFAR-100 与 ImageNet-R 的 CKA 指标、色条和解释文字同步更新，并联动展示单头补偿的推理链。",
          "next": "先把两种表征分清：负片是未受提示表征，显影后的照片才是受提示表征。",
          "notes": "Evidence: p.1 Abstract; p.4-5 §3.2 and Fig.2. The two preset states use CKA values reported in Fig.2(c); task-identity prediction and single-head compensation are summarized qualitatively. The key conditional claim concerns the tested ViT prompt methods under supervised versus self-supervised pre-training."
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "未指导表征与指导后表征",
      "modules": [
        {
          "kind": "module",
          "id": "representations",
          "title": "同一负片的两种光学状态",
          "desc": "切换 Sup-21K 与 iBOT-21K，比较未受提示表征与受提示表征的 CKA 差距及各自职责。",
          "componentId": "hide-ch2-representations"
        }
      ],
      "scenes": [
        {
          "id": "hide-ch2-representations",
          "componentId": "hide-ch2-representations",
          "moduleId": "representations",
          "title": "未指导表征与指导后表征",
          "goal": "同一批样本经过冻结主干与任务提示后，未受提示表征和受提示表征究竟差在哪里？",
          "summary": "同一任务先保留未受提示表征，再经过任务提示得到受提示表征。前者用于推断任务身份（TII），后者用于任务内分类（WTP）。Sup-21K 的 CKA 为 0.743，表征改写空间较大；iBOT-21K 的 CKA 为 0.928，两种表征高度相似，提示更难写入任务特定知识。",
          "interaction": "点击 Sup-21K / iBOT-21K 切换观测范式。CKA、1−CKA 表征改写空间、相似度色条和两种表征的职责说明由同一状态同步更新。",
          "next": "如果两种表征承担不同职责，联合类别预测就不该被当成一个不可拆的黑箱。",
          "notes": "Evidence: p.3 §3.1; p.5 §3.2; Fig.2(c). CKA values are CIFAR-100 Sup-21K 0.743 and iBOT-21K 0.928. The interaction treats 1−CKA as a compact visual proxy for representational rewrite room, not as a separately reported paper metric."
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "联合类别预测的层级分解",
      "modules": [
        {
          "kind": "module",
          "id": "decomposition",
          "title": "先找任务行，再找类别格",
          "desc": "按任务、类别、全类三个层级逐步查看接触表，观察概率链如何从粗到细，TAP 又如何直接跨层预测。",
          "componentId": "hide-ch3-decomposition"
        }
      ],
      "scenes": [
        {
          "id": "hide-ch3-decomposition",
          "componentId": "hide-ch3-decomposition",
          "moduleId": "decomposition",
          "title": "联合类别预测的层级分解",
          "goal": "为什么联合类别预测应被拆成 WTP、TII 与 TAP，三者各自回答什么问题？",
          "summary": "一张接触表把所有已见任务排成任务行。第一步先选任务行，对应 TII；第二步在选中行内挑类别格，对应 WTP；两项概率相乘得到层级路径。TAP 不走这条显式链，而是把来自不同任务行、经过提示后的全部类别格放进同一个共享输出层直接比较。定理进一步说明，两阶段路径的误差不超过 δ+ε，直接全类预测的误差不超过 η，最终上界取二者中的较大值。",
          "interaction": "点击三个阶段按钮或按数字键 1-3；阶段一聚焦任务行，阶段二聚焦类别格，阶段三让全部已见类同时亮起。Canvas 上的选择框、概率链与 SymbolHint 同步切换。",
          "next": "概率分解给出目标，但训练时还要解决两个工程问题：怎样继承旧提示，怎样让新提示兼容旧类别。",
          "notes": "Evidence: p.5-6 §4.1 Eq.(5)-(8), Theorems 1-2; p.6 Fig.3. WTP and TII are categorical distributions at different granularities; TAP is over all observed classes. The theorem reports a bound, not a measured error percentage. Use a compact original Figure 3 crop for one of the three panels."
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "提示继承与提示集成",
      "modules": [
        {
          "kind": "module",
          "id": "prompt-ensemble",
          "title": "旧曝光与当前曝光的混合",
          "desc": "拖动 α 在继承旧提示与学习当前任务之间移动，观察放大机光和冻结提示柜一起变化。",
          "componentId": "hide-ch4-prompt-ensemble"
        }
      ],
      "scenes": [
        {
          "id": "hide-ch4-prompt-ensemble",
          "componentId": "hide-ch4-prompt-ensemble",
          "moduleId": "prompt-ensemble",
          "title": "提示继承与提示集成",
          "goal": "新任务提示为什么要从上一提示出发，又与全部旧提示按 α 混合？",
          "summary": "暗房保留每个任务的提示底片，旧底片冻结在柜中。新任务到来时，当前提示先继承上一任务的参数，再把全部旧提示按 α 汇总，与当前提示按 1−α 混合。α=0.1 时，大部分显影强度仍用于当前任务，少量旧曝光提供可迁移知识；α 过大时旧纹理压过当前画面，过小则继承不足。",
          "interaction": "拖动 α 滑块，或在提示柜上左右拖动当前曝光条；范围 0-0.6，默认 0.1。旧提示计数、当前曝光份额、继承曝光份额和回执文字由 α 与任务序号 t 重算。",
          "next": "提示组合好以后，推理仍必须自己发现该调用哪一条提示。",
          "notes": "Evidence: p.6-7 §4.2 Eq.(9); p.14 Algorithm 1 lines 5-9. pe_t initializes from e_{t-1}; p_t=alpha sum old prompts+(1-alpha)e_t; first task uses e_1 directly. Reported main alpha=0.1. The scene is a teaching blend, not literal image compositing."
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "任务优先的两阶段推理",
      "modules": [
        {
          "kind": "module",
          "id": "inference",
          "title": "放大镜先定位任务，再检查类别",
          "desc": "按顺序推进五个推理站点：未受提示表征、任务身份、对应提示、受提示表征、类别输出。",
          "componentId": "hide-ch5-inference"
        }
      ],
      "scenes": [
        {
          "id": "hide-ch5-inference",
          "componentId": "hide-ch5-inference",
          "moduleId": "inference",
          "title": "任务优先的两阶段推理",
          "goal": "没有测试任务编号时，HiDe-Prompt 如何自己选择任务提示并完成类别预测？",
          "summary": "测试负片先交给冻结主干，得到未受提示表征；任务头 ĥω 只在已见任务上判断该调用哪一条提示。选中提示后，同一张图重新显影成受提示表征，任务内输出层 hψ 再在该任务的类别中给出结果。放大镜的第一次落点是任务行，第二次落点才是类别格；CIL 测试时没有人为提供的任务编号。",
          "interaction": "点击五个推理站点，或用左右方向键逐步推进；也可点击接触表上的任务行触发一次完整推理。当前站点、被选提示、特征层、最终类别和错误提示下的反馈都由同一选择推导。",
          "next": "类别输出本身还受对比正则约束，避免新任务显影与旧类记录重叠。",
          "notes": "Evidence: p.7 §4.2; p.6 Fig.3 TII/WTP panels; p.14 Algorithm 1. Inference is i=hat{h}_omega(f_theta(x)), then y=h_psi(f_theta(x;p_i)). Task identity is not supplied in CIL. Figure 3 original panel crop may be shown beside the sequence."
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "WTP 分类与 CR 兼容正则",
      "modules": [
        {
          "kind": "module",
          "id": "wtp",
          "title": "把新照片拉向旧档案",
          "desc": "拖动当前受提示表征簇，观察它与旧类均值的兼容性和当前任务内部可分离性如何此消彼长。",
          "componentId": "hide-ch6-wtp"
        }
      ],
      "scenes": [
        {
          "id": "hide-ch6-wtp",
          "componentId": "hide-ch6-wtp",
          "moduleId": "wtp",
          "title": "WTP 分类与 CR 兼容正则",
          "goal": "对比正则怎样让当前任务表征与旧类记录兼容，又为什么存在任务内可分离性的权衡？",
          "summary": "正在显影的新任务照片可以向左靠近旧类档案，也可以向右保留当前任务内部的清晰边界。对比正则把当前受提示表征 h 拉向旧类均值 μc，同时把同批次的其他表征 h′ 作为负项推开；WTP 损失由交叉熵和加权 CR 相加。λ=0.1 是主实验设置，较强 CR 可能让只做 WTP 的准确率下降，却能改善完整层级模型。",
          "interaction": "在显影托盘内拖动橙色当前任务簇，位置同时决定“旧类兼容度”和“任务内分离度”；点击 λ=0 / 0.01 / 0.1 档更新目标位置与公式旁反馈。",
          "next": "CR 需要旧类均值，而均值背后是一套不回放样本的紧凑统计。",
          "notes": "Evidence: p.7 §4.2 Eq.(9)-(10); p.10 Table 4 and §5. Main tau=0.8, lambda=0.1. Stronger CR decreases WTP-only accuracy but improves WTP+TII+TAP in the reported iBOT-1K and DINO-1K study. Do not claim CR is universally better or that the dragged 2D cluster is a real embedding."
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "类统计、伪表征与无回放边界",
      "modules": [
        {
          "kind": "module",
          "id": "statistics",
          "title": "档案柜里保存的是统计，不是旧照片",
          "desc": "点击统计抽屉或模型按钮，查看均值、协方差近似、方差退化与约五个 KNN 中心怎样生成伪表征。",
          "componentId": "hide-ch7-statistics"
        }
      ],
      "scenes": [
        {
          "id": "hide-ch7-statistics",
          "componentId": "hide-ch7-statistics",
          "moduleId": "statistics",
          "title": "类统计、伪表征与无回放边界",
          "goal": "不回放旧样本时，HiDe-Prompt 究竟保存什么，又怎样用它训练任务头和全类输出层？",
          "summary": "每个类别在档案柜里只留下一个紧凑记录：默认是均值与协方差描述的高斯；也可以退化为方差模型，或用 KNN 选出约五个中心。训练 TII 时，从每个任务的未受提示表征分布中平衡采样；训练 TAP 时，从受提示表征分布中平衡采样。抽屉里出现的是合成的伪表征，不是被保存的旧图片，因此仍是 rehearsal-free。",
          "interaction": "点击档案柜的均值、协方差、KNN 中心三个热点，或在模型按钮间选择 Gaussian / variance / KNN centroids。伪表征槽位、存储厚度和 TII/TAP 采样方向随模型更新。",
          "next": "这些统计、提示与输出头在架构中各有所有者，不能混成一次端到端训练。",
          "notes": "Evidence: p.7 §4.2; p.20 Appendix D.4; p.22-23 Figures 5-6; p.9 §5. Default is per-class Gaussian mean+covariance; alternatives are variance-only and about five KNN centroids. Equal pseudo-representation counts per class are sampled for TII/TAP. Compact statistics are allowed, but old samples are not rehearsed."
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "架构所有权与训练目标",
      "modules": [
        {
          "kind": "module",
          "id": "architecture",
          "title": "沿显影光路检查谁冻结、谁更新",
          "desc": "点击六个部件，核对冻结骨干、任务提示、任务头、输出头和两类统计的所有权。",
          "componentId": "hide-ch8-architecture"
        },
        {
          "kind": "module",
          "id": "objectives",
          "title": "四个目标如何共同闭环",
          "desc": "切换五个目标组合，查看 WTP、TII、TAP 与 CR 怎样改变同一个输出层和任务头。",
          "componentId": "hide-ch8-objectives"
        }
      ],
      "scenes": [
        {
          "id": "hide-ch8-architecture",
          "componentId": "hide-ch8-architecture",
          "moduleId": "architecture",
          "title": "架构所有权与训练目标",
          "goal": "HiDe-Prompt 的哪些部件冻结，哪些轻量部件在每个任务被优化，统计量又保存了什么？",
          "summary": "光路从冻结 ViT 主干开始，经过当前受提示表征到达分类头。旧任务提示冻结，当前提示与输出层学习；任务头 ω 持续适配所有已见任务，输出层 ψ 同时服务 WTP 与 TAP。每个任务结束时，再收集本任务的受提示表征统计。架构边界不是“什么都不训练”，而是骨干冻结、提示和轻光输出层更新、统计档案累计。",
          "interaction": "点击显影光路上的六个部件，或按数字键 1-6；上游依赖、冻结锁、训练状态与存储内容一起高亮。",
          "next": "同一光路上有多个目标，下一步选择哪些目标共同参与优化。",
          "notes": "Evidence: p.3 §3.1; p.6 Fig.3; p.14 Algorithm 1. Backbone f_theta is frozen; prompts and lightweight output layers train. TII samples uninstructed distributions; TAP samples instructed distributions. Old prompts are frozen, but omega/psi remain light-weight trainable components."
        },
        {
          "id": "hide-ch8-objectives",
          "componentId": "hide-ch8-objectives",
          "moduleId": "objectives",
          "title": "架构所有权与训练目标",
          "goal": "三个层级目标和一个正则项为什么必须协同，而不能只优化其中一个？",
          "summary": "WTP 用交叉熵训练当前任务提示和类别输出；TII 用平衡伪表征持续训练任务头；TAP 用全部已见类的受提示伪表征直接训练共享输出层；CR 再加一项旧类兼容约束。WTP+TII+TAP 的目标不是三个断开的流水线：ψ 同时参与 WTP 与 TAP，ω 只在已见任务上判别，CR 只修改 WTP 的表示空间。",
          "interaction": "点击 Naive / WTP / +TII / +TAP / +CR 五个组合，或按数字键切换。目标卡片、受影响参数、闭环路径和公式高亮同步变化。",
          "next": "目标设计是否真的有效，要看逐级消融、任务身份分析和训练代价。",
          "notes": "Evidence: p.6-7 §4.2 Eq.(10)-(12); p.9 Table 3. L_WTP=CE+lambda L_CR; TII and TAP are separate light-weight cross-entropy objectives. Table 3 makes WTP+TII stronger when paired with TAP. Do not imply all components are trained by one monolithic loss."
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "机制分析、消融与稳健性",
      "modules": [
        {
          "kind": "module",
          "id": "analysis",
          "title": "五级消融逐层洗出轮廓",
          "desc": "切换预训练范式，再选 Naive、WTP、+TII、+TAP、+CR，读取 Table 3 的精确 FAA。",
          "componentId": "hide-ch9-analysis"
        },
        {
          "kind": "module",
          "id": "robustness",
          "title": "λ 自动扫过，悬停就暂停",
          "desc": "自动播放 λ={0, 0.001, 0.01, 0.1}，同时比较仅 WTP 与完整模型在 iBOT-1K、DINO-1K 上的方向。",
          "componentId": "hide-ch9-robustness"
        }
      ],
      "scenes": [
        {
          "id": "hide-ch9-analysis",
          "componentId": "hide-ch9-analysis",
          "moduleId": "analysis",
          "title": "机制分析、消融与稳健性",
          "goal": "表 3 的逐级消融说明三个层级与 CR 各自贡献了什么，又为什么 TII 的收益依赖 TAP？",
          "summary": "五级显影把 Naive 架构逐层加上 WTP、TII、TAP 与 CR。以 iBOT-1K Split CIFAR-100 为例，FAA 从 72.20 升到 75.93、78.90、86.04、90.52，最后到 93.48；加入 TAP 后 TII 的收益才明显释放。Figure 4 的任务身份分析进一步显示，显式 TII 的准确率最高达到 67.74%，但这是任务识别指标，不是全类准确率。",
          "interaction": "先用按钮选择五种预训练范式，再点击五个消融阶段或按数字键；柱高、增量区间、精确数值和当前条件卡同步更新。",
          "next": "CR 的强度不能只看单层 WTP，还要看完整模型在不同 λ 下的方向。",
          "notes": "Evidence: p.9-10 Table 3, Table 4, Fig.4, §5. Exact Split CIFAR-100 iBOT-1K sequence: 72.20/75.93/78.90/86.04/90.52/93.48. Use Figure 4(a),(b) crops only as qualitative evidence. 67.74% is TII accuracy. FAA is higher-is-better and all values are percentage values from the reported protocol."
        },
        {
          "id": "hide-ch9-robustness",
          "componentId": "hide-ch9-robustness",
          "moduleId": "robustness",
          "title": "机制分析、消融与稳健性",
          "goal": "增强 CR 为什么可能压低仅 WTP 的表现，却提升完整 HiDe-Prompt？",
          "summary": "在固定化学条件下，四个 λ 档位像检验条逐格显影。iBOT-1K 的仅 WTP 在 Split CIFAR-100 从 λ=0 的 75.13 降到 λ=0.1 的 71.53；完整模型却从 90.15 升到 93.35。Split ImageNet-R 也呈同样方向。CR 让任务提示吸收更多跨任务兼容知识，牺牲一点纯任务内特异性，换取层级组合后的更好兼容。",
          "interaction": "点击播放/暂停，或把指针移到检验条上暂停自动扫档；点击四个 λ 刻度可直接跳转。仅 WTP 与完整模型的数值条、方向箭头和条件说明同步更新。",
          "next": "消融清楚后，最后回到多个基准的真实结果、显存、训练时间与适用边界。",
          "notes": "Evidence: p.10 Table 4 and §5. Exact iBOT-1K Split CIFAR-100 WTP-only: 75.13/72.75/72.53/71.53; full: 90.15/91.18/91.60/93.35. Split ImageNet-R WTP-only: 61.47/61.17/61.07/59.52; full: 70.97/71.25/71.57/71.71. P7 is a supporting robustness interaction because chapter 9 already has the P4 ablation module."
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "多基准结果、代价与限制",
      "modules": [
        {
          "kind": "module",
          "id": "results",
          "title": "同一化学条件下核对最终结果",
          "desc": "选择数据集与预训练范式，让最佳基线、未加 CR 与完整模型从零基线增长到 Table 1 的精确 FAA；右侧并列代价与限制。",
          "componentId": "hide-ch10-results"
        }
      ],
      "scenes": [
        {
          "id": "hide-ch10-results",
          "componentId": "hide-ch10-results",
          "moduleId": "results",
          "title": "多基准结果、代价与限制",
          "goal": "HiDe-Prompt 在哪些统一协议下领先，它的显存、训练时间与应用边界又是什么？",
          "summary": "最终平均准确率按同一预训练范式、同一十任务 CIL 协议比较。Sup-21K 下 Split CIFAR-100 的 HiDe-Prompt FAA 为 92.61%，Split ImageNet-R 为 75.06%；自监督范式下差距更大，最大领先分别为 15.01 与 9.61 个百分点。代价并非全面更省：Split CIFAR-100 上显存 16141MB 低于 CODA-Prompt 的 25325MB，但训练时间 2.80h 长于 2.08h。",
          "interaction": "选择 Split CIFAR-100 / Split ImageNet-R 与五种预训练范式，再点击“开始核对”；两根或三根结果柱从零增长并停在报告值。点击“代价与边界”切入显存、时间和三条作者限制。",
          "next": "本教程主线闭合：冻结负片不被重放，层级显影靠提示、统计和轻量输出头共同完成；收益仍以足够强的预训练为前提。",
          "notes": "Evidence: p.8 Table 1; p.9 Table 2 and §5; p.10 §6. Main protocol: ViT-B/16, ten tasks, three seeds/splits, FAA higher-is-better. Largest FAA leads: 15.01 and 9.61 percentage points. Memory 16141MB vs 25325MB; training time 2.80h vs 2.08h on one A100. Author limitations: adequate pre-training assumed, mainly Transformer backbones, frozen backbone cannot enrich pre-trained knowledge."
        }
      ]
    }
  ]
};
