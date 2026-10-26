import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "A Decoupled Spatio-Temporal Framework for Skeleton-based Action Segmentation",
    "titleZh": "DeST：面向骨架动作分割的解耦时空框架",
    "venue": "arXiv v1 · 2023",
    "authors": "Yun-Heng Li, Zhong-Yu Li, Shanghua Gao, Qilong Wang, Qibin Hou, Ming-Ming Cheng",
    "affiliation": "南开大学、天津大学",
    "domain": "骨架动作分割 · 时空建模",
    "coreProblem": "一段长骨架序列里，既有姿态差别，也有动作随时间的切换。怎样在保留这些细节的同时，为每一帧判断动作类别？",
    "coreInsight": "DeST 做了两次解耦：空间表示只提取一次，再分组参与不同时间层的交互；不同关节采用独立的时间权重。目标是在长序列中既充分交流信息，又保留动作差别。",
    "keywords": [
      "动作分割",
      "骨架序列",
      "解耦时空建模"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "反复交替空间与时间建模，可能让细粒度特征趋同；所有关节共用时间权重，又容易忽略运动模式的差别。",
      "componentId": "dest-hero"
    },
    "newMethod": {
      "desc": "先统一提取空间线索，分组注入不同时间层；再让各关节拥有独立时间权重。下面从“每帧在做什么”开始，逐步理解这两次解耦。",
      "componentId": "dest-hero"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "这篇论文究竟在“分割”什么",
      "badge": "inf",
      "badgeLabel": "任务定义",
      "bridge": "想象一段未经剪辑的运动视频，里面先起势、再抬臂、最后收势。只认出“这是一段运动”还不够：动作分割要为每一帧预测类别，并找出类别切换的位置。DeST 的输入是骨架关节序列。",
      "analogy": {
        "title": "从一个动作到逐帧标签",
        "text": "练习者抬手触碰标记。同一动作沿时间展开，不能只用一个静止姿态或整段标签说清；我们还需要知道动作何时开始、何时结束。",
        "componentId": "dest-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "选任务，看输出粒度",
          "desc": "切换任务，先看输入条件，再看答案形式。文本条件时序视频定位（TVG）要按一句查询找时间区间；DeST 研究的是另一种时序理解任务。<a href=\"https://arxiv.org/pdf/2312.05830.pdf\" target=\"_blank\" rel=\"noreferrer\">打开原论文 PDF</a>。",
          "componentId": "dest-task"
        }
      ],
      "insight": "这篇论文的输出是覆盖整段序列的逐帧类别。与 TVG 共有“何时发生”的问题，但它不接收文本查询；理解这一边界，才知道哪些想法可以迁移、哪些结果不能外推。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "逐帧分类",
          "desc": "动作分割为长序列中的每一帧预测动作类别。"
        },
        {
          "icon": "🦴",
          "title": "骨架输入",
          "desc": "DeST 建模的是人体关节序列。"
        },
        {
          "icon": "🧭",
          "title": "与 TVG 的连接",
          "desc": "可借鉴时序表示和边界意识，任务输入与输出仍不同。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "骨架序列把动作变成时间过程",
      "badge": "inf",
      "badgeLabel": "输入表示",
      "bridge": "上一节明确了“每帧一个类别”。现在把输入拆开看：同一帧里有关节之间的空间关系，连续帧里有关节随时间的变化。动作分割需要同时使用这两类线索。",
      "analogy": {
        "title": "一个姿态接着一个姿态",
        "text": "练习者完成一次“起势—抬臂—触点—收势”。拖动时间轴时，同步观察骨架姿态和动作标签，尤其留意标签改变的时刻。",
        "componentId": "dest-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "沿时间拖动，检查姿态与标签",
          "desc": "拖动橙色标记，或用下方滑块逐帧查看。这里用 8 帧合成序列解释“关节 × 时间”，不代表论文数据长度或真实动作标注。",
          "componentId": "dest-time"
        }
      ],
      "insight": "单帧姿态告诉你关节在哪里；一段姿态变化才帮助判断动作过程。模型既要保留空间差别，也要积累足够长的时间上下文。",
      "takeaways": [
        {
          "icon": "🦴",
          "title": "关节随时间变化",
          "desc": "骨架用关节位置描述姿态。"
        },
        {
          "icon": "🕒",
          "title": "每帧都有预测",
          "desc": "这是动作分割的输出粒度。"
        },
        {
          "icon": "📍",
          "title": "边界是类别切换",
          "desc": "动作相邻的时刻尤其需要细粒度辨别。"
        }
      ],
      "formula": {
        "lead": "原文用三个维度组织输入；先分清坐标、时间与关节，不必把骨架当成普通图像。",
        "unicode": "X 的维度：C × T × V",
        "symbols": [
          {
            "sym": "C",
            "desc": "每个关节的输入特征维度，例如坐标属性。"
          },
          {
            "sym": "T",
            "desc": "时间帧数；模型最终为每一帧输出动作类别。"
          },
          {
            "sym": "V",
            "desc": "人体关节数；同一帧的这些关节构成骨架。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "为什么简单堆叠时空交互可能不够",
      "badge": "inf",
      "badgeLabel": "核心动机",
      "bridge": "有了空间和时间两类线索，最直接的想法是交替堆叠空间层与时间层。作者发现，重复混合可能让不同动作的特征越来越相近；可如果只交流一次，深层又缺少持续的空间信息。",
      "analogy": {
        "title": "让动作变化仍然看得见",
        "text": "练习者完成一次平滑伸手。我们要保留时间上的动作变化，同时让空间线索与时间上下文充分交流。",
        "componentId": "dest-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "比较三种信息交流方式",
          "desc": "先看两种已有安排的代价，再切到 DeST。点击“开始同步对照”可同时检查结构关系；这里展示组织方式，不用虚构曲线代替原文证据。",
          "componentId": "dest-coupling"
        }
      ],
      "insight": "DeST 的出发点是：让空间线索在不同时间层持续参与，但不反复重做空间建模。Figure 9 提供过平滑的定性证据；“解耦”并不意味着切断时空联系。",
      "takeaways": [
        {
          "icon": "⚠️",
          "title": "级联可能过平滑",
          "desc": "这是论文对已有方法的诊断。"
        },
        {
          "icon": "⚖️",
          "title": "单次可能不够",
          "desc": "时空信息仍需要充分交互。"
        },
        {
          "icon": "🧩",
          "title": "解耦重新安排",
          "desc": "DeST 改变交互的组织方式。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "DSTI：空间线索如何与不同时间层交互",
      "badge": "both",
      "badgeLabel": "核心机制",
      "bridge": "上一节留下的问题是：只做一次空间建模，怎样仍让深层获得不同空间线索？DSTI（解耦时空交互）把空间表示沿通道分组，再把不同组分别送到不同时间层。",
      "analogy": {
        "title": "先理解姿态，再看变化",
        "text": "练习者看准标记再伸手。动作过程中仍要参照目标位置，但不必每次都重新理解整个场景。类比只帮助理解“一次提取、持续使用”。",
        "componentId": "dest-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "逐步追踪：一次空间建模，怎样连接多层时间",
          "desc": "依次选择四个阶段。上方是同一次空间建模产生的不同子特征，下方是连续推进的时间主干；两条路径在不同深度相遇。",
          "componentId": "dest-dsti"
        }
      ],
      "insight": "分组发生在特征通道上，每组仍含多个关节的信息。交叉注意力让“这一层该怎样使用空间线索”随输入变化，残差保留已有的时间表示。",
      "formula": {
        "lead": "先把式（3）理解为：空间线索决定交互权重 A，时间特征被重组后，再加回原时间表示。完整注意力细节可展开上方补充。",
        "unicode": "R = AH + H",
        "symbols": [
          {
            "sym": "H",
            "desc": "当前层的时间特征。这里省略原文的层下标。"
          },
          {
            "sym": "A",
            "desc": "由映射后的空间子特征与时间特征计算，并经过 Softmax 的交叉注意力权重。"
          },
          {
            "sym": "R",
            "desc": "交互后的时空表示，继续送入后续时间层；+ H 是残差连接。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧱",
          "title": "先统一建模空间",
          "desc": "获得空间表示后再安排交互。"
        },
        {
          "icon": "🪄",
          "title": "子特征分组",
          "desc": "不同子特征学习不同的交互模式。"
        },
        {
          "icon": "🔗",
          "title": "连接多层时间",
          "desc": "DSTI 将空间语义与不同时间层相联系。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "JTM：不同关节不必共享同一套时间权重",
      "badge": "both",
      "badgeLabel": "时序模块",
      "bridge": "DSTI 解决“空间信息怎样进入时间层”。时间层内部还剩一个问题：手臂、躯干和腿的运动模式不一样，为何一定要用同一套参数处理？JTM（逐关节解耦时间建模）为关节分配独立权重。",
      "analogy": {
        "title": "同一动作，关节节奏不同",
        "text": "一个练习者抬起手臂，不同关节的变化方式并不完全相同。论文展示了关节运动速度分布差异，但没有给出可概括所有关节的单一速度值。",
        "componentId": "dest-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "先看参数怎样共享，再读单折消融",
          "desc": "先在“共享 JWTM / 逐关节 JTM”之间切换，观察参数组织改变；再切换时间骨干查看原文 Table 8(b)。图里的轨迹与权重只解释关系，不是实测数值。",
          "componentId": "dest-jtm"
        }
      ],
      "insight": "逐关节独立建模后，各关节贡献会汇总成时间表示。它改变参数共享方式，空间关系仍由前面的空间建模提供；并非让人体关节彼此完全隔离。",
      "takeaways": [
        {
          "icon": "🦵",
          "title": "关节模式有差异",
          "desc": "Figure 10 的 MCFS-130 统计显示不同关节的速度分布不同。"
        },
        {
          "icon": "🔧",
          "title": "JTM逐关节建模",
          "desc": "先各自学习时间关系，再汇总各关节贡献。"
        },
        {
          "icon": "📊",
          "title": "读清表8协议",
          "desc": "这里比较的是 MCFS-130 单个 split 的消融。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "两个输出分支，各自负责什么",
      "badge": "trn",
      "badgeLabel": "训练目标",
      "bridge": "现在已有兼顾空间与时间的表示，还要告诉模型“什么是好预测”。逐帧类别回答“做什么”，边界分数回答“在哪里切换”；分割损失还要抑制一个动作被切成许多碎片。",
      "analogy": {
        "title": "既做对动作，也踩准时刻",
        "text": "练习者既要完成正确动作，也要在正确时刻碰到地面标记；类别与边界相关，但回答的是不同问题。",
        "componentId": "dest-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "逐步揭示训练目标",
          "desc": "依次展开“类别正确 → 减少碎片 → 边界监督”，看每一项补上哪一种错误，再读总目标。",
          "componentId": "dest-loss"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "切换输出，观察监督对象",
          "desc": "类别分支识别动作是什么；边界分支预测变化发生在哪里。下方时间条是教学示意。",
          "componentId": "dest-branches"
        }
      ],
      "insight": "稳定同一动作内部的预测，与识别真正的切换位置，需要同时考虑。平滑项不是要求所有帧相同；边界分支提供另一种监督，论文默认权重 γ=0.1。",
      "formula": {
        "lead": "论文先定义动作分割分支损失，再与边界分支损失合并为训练目标。",
        "unicode": "Lₐₛᵦ = L_ce + L_gs-tmse　；　L = Lₐₛᵦ + γL_brb",
        "symbols": [
          {
            "sym": "Lₐₛᵦ",
            "desc": "动作分割分支损失。"
          },
          {
            "sym": "L_ce",
            "desc": "逐帧类别预测的交叉熵损失。"
          },
          {
            "sym": "L_gs-tmse",
            "desc": "高斯相似度加权的 TMSE，用来抑制过分割。"
          },
          {
            "sym": "γ",
            "desc": "边界回归损失的权重，论文默认 0.1。"
          },
          {
            "sym": "L_brb",
            "desc": "边界回归分支的二元逻辑回归损失。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "类别分支判断做什么",
          "desc": "每帧预测属于哪个动作类别。"
        },
        {
          "icon": "📍",
          "title": "边界分支判断何时",
          "desc": "预测动作边界所在位置。"
        },
        {
          "icon": "⚖️",
          "title": "总目标联合优化",
          "desc": "分割分支与边界分支共同训练。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "消融：子特征与交互方式都值得检查",
      "badge": "trn",
      "badgeLabel": "组件证据",
      "bridge": "结构听起来合理，还要看受控比较。Table 7 在同一数据划分下改变两个因素：各层是否使用不同空间子特征，以及交互采用求和还是交叉注意力。先固定骨干，再一次只改一个因素。",
      "analogy": {
        "title": "保持同一动作，改变一个因素",
        "text": "练习者重复同一个伸手动作。下面的选择切换论文消融条件，观察一个固定指标如何变化。",
        "componentId": "dest-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "控制两个因素，读出条件下的收益",
          "desc": "TCN 与线性 Transformer 两个面板分别对应 Table 7(a)(b)。点击因素卡片或四种组合，数值和条件增益会同步变化；所有分数均来自原表。",
          "componentId": "dest-ablation"
        }
      ],
      "insight": "“不同空间子特征 + 交叉注意力”在两种骨干的所列组合中都最高，但各因素的收益随另一因素而变。消融支持组件设计，不足以承诺任意任务、骨干都获同样提升。",
      "takeaways": [
        {
          "icon": "🧪",
          "title": "消融保持协议",
          "desc": "理解结果前先确认数据集、划分和骨干。"
        },
        {
          "icon": "📈",
          "title": "两个因素一起检查",
          "desc": "TCN 最高 61.9；线性 Transformer 最高 62.1。"
        },
        {
          "icon": "🧭",
          "title": "单折不是主表",
          "desc": "不能把 split #1 与五折均值混为一谈。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "结果揭晓：质量与计算开销要一起看",
      "badge": "both",
      "badgeLabel": "结果边界",
      "bridge": "有了组件证据，最后回到完整模型：Table 3 用 MCFS-130 五折均值比较不同变体。先理解逐帧准确率与片段 F1 的差别，再把分割质量与计算代价放在一起看。",
      "analogy": {
        "title": "抵达标记，也要看付出",
        "text": "练习者完成标记动作。比较不同模型时，要同时看分割质量、参数量、计算量，以及结果所用的数据集和协议。",
        "componentId": "dest-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "为什么只错一帧，也可能把动作切碎",
          "desc": "切换同一条 12 帧教学序列的三种预测。短暂误报与边界偏移都只错一帧，却产生不同的片段 F1。先读懂指标，再比较模型分数。",
          "componentId": "dest-metrics"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "比较 Table 3：分割质量、计算量与参数量",
          "desc": "切换指标、点选模型，观察同一配置的质量与开销。DeST† 使用 TCN；标准版使用线性 Transformer；DeST* 额外加入 TSR。每个柱条均有对应方法名称。",
          "componentId": "dest-results"
        }
      ],
      "insight": "标准 DeST 的 F1@50 为 63.0、计算量 6.89G。加 TSR 的 DeST* 为 66.0 和 12.32G；DeST† 为 61.8 和 4.91G。最高分与最低开销来自不同配置，研究结论必须连同任务、变体和协议一起读。",
      "takeaways": [
        {
          "icon": "🏁",
          "title": "标准 DeST 为63.0",
          "desc": "MCFS-130 Table 3 五折均值 F1@50。"
        },
        {
          "icon": "⚖️",
          "title": "质量和开销要同看",
          "desc": "加入 TSR 的 DeST* 分数更高、计算也更多。"
        },
        {
          "icon": "🚧",
          "title": "不能外推成TVG结论",
          "desc": "本文做骨架动作分割；arXiv v1 与 IJCV 版差异待核。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1wt411p7Ut",
      "title": "人工智能 | 基于人体骨架的行为识别",
      "reason": "补充骨架动作表示的入门背景；视频不是 DeST 论文讲解，也不等同于长序列动作分割。",
      "cover": "https://i1.hdslb.com/bfs/archive/97c9342267ea0a0b46f20f58c7c886252fbcde39.jpg",
      "views": "1.1万播放"
    }
  ]
};
