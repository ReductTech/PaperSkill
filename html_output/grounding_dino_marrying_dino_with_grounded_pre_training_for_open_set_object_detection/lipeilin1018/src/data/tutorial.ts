import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Grounding DINO: Marrying DINO with Grounded Pre-Training for Open-Set Object Detection",
    "titleZh": "让语言参与每一次定位",
    "venue": "ECCV 2024 · arXiv v5",
    "authors": "Shilong Liu 等",
    "affiliation": "清华大学 · IDEA · 香港科技大学 · 香港中文大学（深圳） · Microsoft Research · 华南理工大学",
    "domain": "开放集目标检测 · 视觉语言对齐",
    "coreProblem": "固定类别检测器如何根据新的类别名或指代表达定位目标？",
    "coreInsight": "在特征增强、查询选择与解码三个环节引入语言，并用区域级监督预训练。",
    "keywords": [
      "图文融合",
      "语言引导查询",
      "子句级表示",
      "开放集检测",
      "指代定位"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "固定类别表回答“有什么”，对指定属性的筛选需要另行设计。<br/>图中为任务示意。",
      "componentId": "gd-hero-old"
    },
    "newMethod": {
      "desc": "根据语言条件定位区域，并关联输入词语。<br/><a href=\"https://arxiv.org/abs/2303.05499v5\" target=\"_blank\" rel=\"noopener noreferrer\">阅读原论文 ↗</a> · 教学示意，非实时模型推理。",
      "componentId": "gd-hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "从认出类别，到找到指定目标",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "你已经了解检测框如何产生。本节把问题推进一步：同一张图，换一句描述，目标为什么也应该变化？",
      "analogy": {
        "title": "取景器平移",
        "text": "拍摄委托写得越具体，取景框就应越有选择。这里演示任务目标，不代表模型已经掌握复杂关系。",
        "componentId": "gd-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "固定类别表的边界",
          "desc": "先切换类别请求，观察固定词表能表达什么。本例词表仅含“人”和“鸟”；场景与框均为手工教学构造，不是检测器实际输出。任务背景：原论文 p.5–6 §3。",
          "componentId": "task-closed"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "语言改变了要找的目标",
          "desc": "把类别扩展为属性与关系描述，观察人工定义的目标集合。Grounding DINO 接受图像和文本，输出框及输入词语关联；本图展示任务定义，不承诺真实模型理解关系。来源：p.5–6 §3；指代表达定位的实例约束见 p.25 Appendix D.3。",
          "componentId": "task-grounded"
        }
      ],
      "insight": "开放集检测把查询类别交给语言；指代定位还要求选对具体实例。能表达一个请求，与模型能准确完成请求，是两件需要分别验证的事。",
      "takeaways": [
        {
          "icon": "🔤",
          "title": "类别可开放",
          "desc": "类别名可以在推理时给出。"
        },
        {
          "icon": "🎯",
          "title": "实例需定位",
          "desc": "找到所有鸟与找到指定红鸟是不同任务。"
        },
        {
          "icon": "📋",
          "title": "目标先明确",
          "desc": "提示对应的真值集合应在实验前确定。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "保留区域，也保留词语",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "一句描述要对应某个区域，先要让图像与文本保留可对齐的细节。",
      "analogy": {
        "title": "镜头放大",
        "text": "整张照片说明场景，放大镜才让你检查局部。图像级相似不自动提供目标边界。",
        "componentId": "gd-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "检查一块区域对应什么词",
          "desc": "点击照片中的红鸟、树或人，也可使用按钮。Swin 提取多尺度图像特征，BERT-base 提取逐 token 文本特征。右侧裁剪、词语与关联是手工教学示意，不是实际网络特征或 tokenizer 结果。来源：p.6 §3.1、p.9 §4.1。",
          "componentId": "representations"
        }
      ],
      "insight": "视觉多尺度区域特征和逐 token 文本特征，为细粒度对齐保留接口；一个图像级相似度不足以直接给出各实例的边界。",
      "takeaways": [
        {
          "icon": "↔️",
          "title": "双编码器",
          "desc": "图像和文本先分别编码。"
        },
        {
          "icon": "🔎",
          "title": "保留细节",
          "desc": "区域与 token 的粒度使细粒度对齐成为可能。"
        },
        {
          "icon": "🖼️",
          "title": "多尺度",
          "desc": "小区域与大场景都提供视觉信息。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "先让图像和语言互相参照",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "有了两组特征，还不能保证它们在说同一个目标。特征增强器先建立跨模态联系。",
      "analogy": {
        "title": "相机对焦",
        "text": "拍摄者参照委托调整焦点，画面细节又帮助理解委托。类比的是信息参照，不是一次真实推理。",
        "componentId": "gd-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "对照独立特征与跨模态融合",
          "desc": "切换两种状态，检查双向联系与 2×2 对应矩阵。特征增强器包含视觉可变形自注意力、文本自注意力与双向跨模态注意力；场景、连线强弱和 0.2–0.8 分数均为手工教学示意，不是模型实验或性能提升。来源：p.5 Fig.3、p.6 §3.1。",
          "componentId": "fusion"
        }
      ],
      "insight": "双向跨注意力把图像与文本的上下文融入对方特征。这里建立区域与词语的联系，后续仍需要查询选择和解码定位。",
      "takeaways": [
        {
          "icon": "🖼️",
          "title": "视觉增强",
          "desc": "视觉分支使用可变形自注意力。"
        },
        {
          "icon": "🔤",
          "title": "文本增强",
          "desc": "文本分支使用自注意力。"
        },
        {
          "icon": "↔️",
          "title": "双向融合",
          "desc": "两种模态在特征增强阶段交换信息。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "用语言筛选值得查询的位置",
      "badge": "both",
      "badgeLabel": "机制与证据",
      "bridge": "图像特征位置很多，解码器不必从所有位置开始。语言相关性可以帮助筛选候选位置。",
      "analogy": {
        "title": "相机转向",
        "text": "拍摄前先把镜头朝向相关区域，再细调取景。候选位置多，不意味着最终物体也一样多。",
        "componentId": "gd-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "先按词取最大，再按位置取前几名",
          "desc": "图像特征 Xᵢ 与文本特征 Xₜ 做点积，得到“图像位置 × 文本 token”的分数矩阵。先沿文本轴取最大值，再沿图像轴选 TopK 索引。切换文本与候选数，看筛选位置如何改变。图示照片、6×2 分数和 K≤3 均为人工教学构造，不是真实推理；论文默认查询数为 900、特征维度为 256。来源：原论文 p.7 §3.2、Eq.(1)，p.20 Algorithm 1。",
          "componentId": "query-selection"
        }
      ],
      "insight": "先沿文本 token 轴求每个图像位置的最大点积，再在图像位置之间取 TopK。语言引导的是候选位置，不能把文本 token 直接当作检测框。",
      "formula": {
        "lead": "先把“某位置与哪些词相关”变成一个分数，再选择排名靠前的位置。",
        "unicode": "S = XᵢXₜᵀ；sᵢ = maxⱼ Sᵢⱼ；I = TopK(s)",
        "symbols": [
          {
            "sym": "Xᵢ",
            "desc": "图像特征矩阵，形状 Nᵢ×d。"
          },
          {
            "sym": "Xₜ",
            "desc": "文本特征矩阵，形状 Nₜ×d。"
          },
          {
            "sym": "S",
            "desc": "点积分数矩阵，形状 Nᵢ×Nₜ；这里没有 softmax。"
          },
          {
            "sym": "sᵢ",
            "desc": "第 i 个图像位置沿文本 token 轴的最大分数。"
          },
          {
            "sym": "K",
            "desc": "保留的图像位置数量；论文默认 Nq=900。"
          },
          {
            "sym": "I",
            "desc": "TopK 返回的位置索引集合，不是物体类别。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "↔️",
          "title": "轴别弄反",
          "desc": "先沿文本轴 max，再沿图像轴 top-k。"
        },
        {
          "icon": "📍",
          "title": "位置受语言引导",
          "desc": "位置查询来自编码器预测的动态锚框。"
        },
        {
          "icon": "🧩",
          "title": "内容仍可学习",
          "desc": "混合查询的内容部分是可学习参数。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "让相关词交流，让无关类别分开",
      "badge": "both",
      "badgeLabel": "机制与证据",
      "bridge": "把多个类别拼成一句话很方便，但无关类别之间也可能产生干扰。",
      "analogy": {
        "title": "取景遮片隔开",
        "text": "整理照片时给不同主题分隔，而同一主题的细节仍保留在一起。子句级表示也保留短语内部的联系。",
        "componentId": "gd-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "看看哪些词允许互相注意",
          "desc": "比较三种文本表示：句子级将每个独立短语压成一个向量；词级保留逐 token 特征，但拼接类别间仍可互相注意；子句级保留细粒度特征，并屏蔽无关类别之间的注意力。下面的两幅照片和 0/1 关系矩阵都是教学示意：1 表示允许注意，不能当作模型学到的注意力强度。来源：原论文 p.6 Fig.4、p.7–8 §3.4。",
          "componentId": "text-mask"
        }
      ],
      "insight": "子句级 mask 隔开的是任意拼接的无关类别，而不是把同一描述内部的属性词、目标词和关系词拆开。",
      "takeaways": [
        {
          "icon": "🔤",
          "title": "保留逐词表示",
          "desc": "细粒度属性需要词语信息。"
        },
        {
          "icon": "🪟",
          "title": "隔离无关类别",
          "desc": "mask 处理任意拼接类别带来的依赖。"
        },
        {
          "icon": "🔗",
          "title": "关系不能乱拆",
          "desc": "同一描述内的属性和关系仍应保留。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "查询如何一步步收拢成框",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "候选位置只是起点。解码器还需要反复结合图像与文本，更新查询和边界框。",
      "analogy": {
        "title": "取景框收拢",
        "text": "镜头朝对方向后，还需要细调取景范围。图中的逐步收拢是示意，不是逐层实测坐标。",
        "componentId": "gd-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "拆开一个跨模态解码层",
          "desc": "从输入查询出发，按顺序查看自注意力、图像跨注意力、文本跨注意力与 FFN。每一步都让同一查询获得或更新信息；论文默认堆叠 6 层。画面是手绘的公园照片裁剪，框收拢与三条特征刻度仅作机制示意，不是实际模型的中间结果，也不意味着每个算子单独预测一个框。来源：原论文 p.7 §3.2–3.3、p.5 Fig.3 block 3、p.9 §4.1。",
          "componentId": "decoder-step"
        }
      ],
      "insight": "语言不只用于挑选起点：每个解码层都会在图像跨注意力之后继续访问文本证据，再经过 FFN 更新查询。",
      "takeaways": [
        {
          "icon": "👁️",
          "title": "两种证据",
          "desc": "查询既访问图像，也访问文本。"
        },
        {
          "icon": "🔄",
          "title": "逐层更新",
          "desc": "默认 6 层跨模态解码。"
        },
        {
          "icon": "🖼️",
          "title": "框加词语",
          "desc": "输出框及与输入文本的对应关系。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "先匹配，再学习位置与词语",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "推理时的语言条件能力，需要在训练中把预测框、真值框和词语对应起来。接着你已学过的 DETR，我们先确定哪个预测负责哪个真值，再观察位置误差。",
      "analogy": {
        "title": "相机描摹边界",
        "text": "练习取景时，参考框告诉你偏在哪里；语义标注则告诉你框里应该是什么。",
        "componentId": "gd-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "拖动预测框，观察几何误差",
          "desc": "拖动橙色框，或使用方向按钮。这里是一个已经完成匹配的人工教学样本，IoU 与归一化角点 L1 根据几何位置精确计算，并非模型训练曲线。论文以二分匹配确定监督对应，再联合优化 token 对齐的 focal loss、框 L1 与 GIoU，并在各层加入辅助损失。检测数据提供类别标注，GoldG 提供区域—词语监督，caption 数据通过 GLIP 伪标注形成区域监督。来源：p.8 §3.5、p.9 §4.1、p.20 Appendix B。",
          "componentId": "training-box"
        }
      ],
      "insight": "二分匹配确定监督对应，再优化 token 对齐以及 L1 / GIoU 框损失。几何位置正确，不自动意味着词语对应正确。",
      "formula": {
        "lead": "匹配确定监督对象后，几何位置与词语对应共同参与优化。以下为损失组成示意，权重依实现配置。",
        "unicode": "L = Ltoken + λ₁L₁ + λgLGIoU",
        "symbols": [
          {
            "sym": "Ltoken",
            "desc": "预测查询与文本 token 点积所得 logit 上的 focal loss；不是整图 CLIP 分类。"
          },
          {
            "sym": "L₁",
            "desc": "预测框与匹配真值框的 L1 回归损失。"
          },
          {
            "sym": "LGIoU",
            "desc": "广义交并比损失；与画面显示的 IoU 不是同一个量。"
          },
          {
            "sym": "λ₁",
            "desc": "框 L1 项权重。"
          },
          {
            "sym": "λg",
            "desc": "GIoU 项权重。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "先确定对应",
          "desc": "匹配代价结合语义与几何。"
        },
        {
          "icon": "🧩",
          "title": "共同优化",
          "desc": "token 对齐、L1、GIoU 以及辅助监督。"
        },
        {
          "icon": "🗂️",
          "title": "区域监督来自数据",
          "desc": "检测标注、grounding 标注和伪标注 caption 共同使用。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "把三个融合环节接起来",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "你已经操作过特征融合、查询选择与解码。现在把它们放回同一个模型，看语言如何在三个不同位置参与定位。",
      "analogy": {
        "title": "摄影反光板照亮",
        "text": "同一拍摄任务可以在取景前、选位置时、细调时参考委托。结构图把三个参照环节具体定位。",
        "componentId": "gd-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点击组件，追踪它影响的路径",
          "desc": "点击数字节点，或用上方按钮查看每个环节的张量形状与作用。图中呈现论文各组件之间的连接关系。Swin 与 BERT-base 编码后，特征增强器做图文交互，语言引导查询位置选择，跨模态解码器持续读取图像与文本。默认隐层维度 256、查询数 900，特征增强器和解码器各 6 层。查询的内容部分仍为可学习参数。来源：p.5 Fig.3、p.6 §3.1、p.7 §3.2–3.3、p.9 §4.1。",
          "componentId": "architecture"
        }
      ],
      "insight": "双编码器、特征增强、语言查询选择和跨模态解码组成统一架构；同一份语言条件在特征、初始化和解码三个层面发挥作用。",
      "takeaways": [
        {
          "icon": "🔁",
          "title": "A · 特征层",
          "desc": "双向图文融合。"
        },
        {
          "icon": "📍",
          "title": "B · 初始化",
          "desc": "语言引导候选位置选择。"
        },
        {
          "icon": "🔎",
          "title": "C · 解码层",
          "desc": "查询持续读取图像与文本。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "哪些设计真的带来了增益",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "结构看起来合理，还需要实验回答：移除一个环节会怎样？我们固定骨干与预训练数据，再逐项检查不同评测协议中的变化。",
      "analogy": {
        "title": "摄影遮光罩抬起",
        "text": "检查一件拍摄工具的作用，需要保持同一场景和其他条件。论文消融则要重新训练对应模型。",
        "componentId": "gd-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "一次移除一个机制",
          "desc": "切换一项独立训练的消融设置，再选择指标。所有数字来自原论文 Table 7（p.14，§4.5），使用 Swin-T、O365 预训练，分别报告 COCO 零样本 AP、COCO 微调 AP、LVIS 零样本 AP，均越高越好。图形从 0 开始且固定最大值 60。网页只呈现报告结果，不是在推理时开关真实模块；微调列另含 COCO 训练。静态查询在 LVIS 为 13.6，相对完整 16.1 下降 2.5 AP，采用表格值。",
          "componentId": "ablation"
        }
      ],
      "insight": "消融需固定训练设置，并分别观察不同评测协议。模块是否有用，要由对应的实验条件支持。",
      "takeaways": [
        {
          "icon": "⚖️",
          "title": "固定条件",
          "desc": "这里全部 Swin-T、O365 预训练。"
        },
        {
          "icon": "📊",
          "title": "分协议看",
          "desc": "零样本、微调、不同数据集分别解释。"
        },
        {
          "icon": "🧪",
          "title": "机制需验证",
          "desc": "推理时关一个按钮不能替代训练消融。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "检测更开放，理解仍有边界",
      "badge": "both",
      "badgeLabel": "机制与证据",
      "bridge": "模型的价值取决于具体任务。最后把类别迁移、稀有类别和指代定位的结果放在各自条件下看，再把问题带回你上周的 YOLOE 失败案例。",
      "analogy": {
        "title": "照片对照尺伸展",
        "text": "评照片既看整体，也看想拍清楚的细节。一个总分更高，不保证每一种细节都更好。",
        "componentId": "gd-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "在相同协议下比较结果",
          "desc": "选择一个协议后点击“开始比较”，条形在 1.5 秒内展开并保持最终值；动画只展示论文数据。COCO：Swin-T / O365，Table 2（p.8）零样本 AP，DINO 使用类别映射。LVIS MiniVal：Swin-T / O365 + GoldG + Cap4M，Table 3（p.10）总体 AP 与稀有类 APr。ODinW35：相同骨干与数据，Table 4（p.11）mean / median AP。各指标均越高越好，跨协议不可混比。“零样本”按本文指目标数据集训练划分未用于训练。52.5 AP 的大模型与 63.0 AP 的微调放大输入结果另有条件。来源：p.2 脚注1、p.8–11 Tables 2–4。",
          "componentId": "results"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "加入指代数据后发生了什么",
          "desc": "切换 Grounding DINO-T / Swin-T 的三种训练条件，观察 RefCOCO val 的 top-1 定位准确率（%，越高越好）。50.41、73.98、89.19 分别对应 O365 + GoldG、加入 RefC、加入 RefC 并做 REC 微调；这些不是同一零样本设置的架构增益。REC 对每条表达选择最高分框，与检测所有相关目标不同。模型仍可能误检，不能直接输出像素级分割；在 Appendix C.2 的 COCO 闭集 ResNet50 / 12 epochs 条件下，Grounding DINO 48.1 AP 也低于 DINO 49.0，新增语言能力存在取舍。来源：p.12 Table 5、p.13 Table 6、p.14 §5、p.22 Table 11、p.25 Appendix D.3。",
          "componentId": "rec-boundary"
        }
      ],
      "insight": "开放类别泛化、稀有类与复杂指代是不同能力，训练数据决定结论适用范围。你的下一步是把“看起来成功”变成有真值、有分组、有错误统计的实测。",
      "takeaways": [
        {
          "icon": "📖",
          "title": "零样本有定义",
          "desc": "数据集未用于训练，不等于类别从未见过。"
        },
        {
          "icon": "🔍",
          "title": "能力有分项",
          "desc": "类别、属性、关系和稀有类分别评估。"
        },
        {
          "icon": "🧪",
          "title": "下一步实测",
          "desc": "固定检查点和设置，用真值框统计错误类型。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1rjgBzHEBW",
      "title": "一节课搞懂 Grounding DINO",
      "reason": "概览、模型结构与代码演示；视频标题中的宣传性比较不作为本导读结论。",
      "views": "1.4万播放",
      "cover": "https://i0.hdslb.com/bfs/archive/d379149435ea7289d1c3aab13745e5395e5adbb2.jpg"
    },
    {
      "bvid": "BV1Mk4y1F7cp",
      "title": "迈向更强的开集目标检测：From Detection to Grounding",
      "reason": "第一作者刘世隆分享；虽播放量较低，但对研究动机和方法理解直接相关。",
      "views": "9101播放",
      "cover": "https://i1.hdslb.com/bfs/archive/527e04ce2405a8b4bdf6fe500e641599ec969c07.jpg"
    },
    {
      "bvid": "BV1kY8zeUEAX",
      "title": "Transformer DINO 和 Grounding DINO 讲解",
      "reason": "补充检测器 DINO 的前置知识及 Grounding DINO 结构。",
      "views": "5627播放",
      "cover": "https://i1.hdslb.com/bfs/archive/4cbf594dc4712369bfbf30c76c182f05d88f4869.jpg"
    }
  ]
};
