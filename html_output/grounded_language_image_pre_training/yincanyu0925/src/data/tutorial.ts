import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Grounded Language-Image Pre-training",
    "titleZh": "GLIP：让文字找到图像中的物体",
    "venue": "CVPR 2022 · 正式论文版",
    "authors": "Liunian Harold Li、Pengchuan Zhang、Haotian Zhang 等",
    "affiliation": "UCLA · Microsoft Research · University of Washington 等",
    "domain": "多模态基础模型 · 开放词汇目标检测",
    "coreProblem": "固定类别与整图对齐，如何走向可以用文字描述的区域定位？",
    "coreInsight": "统一检测与短语定位，深度融合图文，再用语义丰富的数据预训练。",
    "keywords": [
      "区域—词语对齐",
      "双向深度融合",
      "伪标注",
      "零样本跨域"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "固定名录只能输出预先设定的类别；图文整体相似也没有告诉我们物体在哪里。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "输入图片和候选描述，学习框与词的对应。这里用展览导览作类比，所有框与小矩阵均为教学示意。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "从“是什么”到“在哪里”",
      "badge": "inf",
      "badgeLabel": "推理与理解",
      "bridge": "CLIP让图像与文字在整体层面对齐，但“这张图有杯子”还没有回答杯子的位置。先试试只有固定类别的检测器会漏掉什么。",
      "analogy": {
        "title": "一支指示笔指向展品",
        "text": "只拿着一张固定名录，讲解员就难以回应新的寻物描述；换成文字导览卡，才有机会指出具体展品。类比不意味着模型能识别任意概念。",
        "componentId": "museum-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "给检测器换一张寻物卡",
          "desc": "切换目标与固定词表/文字提示。展柜中的框是教学示意，不是真实GLIP推理；未知词也不保证可以被定位。来源：§1、§3.1。",
          "componentId": "task"
        }
      ],
      "insight": "目标检测需要框和语义；开放文字改变可表达的目标。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "输出包含位置",
          "desc": "检测同时回答类别和边界框，图文整体相似度不够。"
        },
        {
          "icon": "↔",
          "title": "输入可以是描述",
          "desc": "GLIP用提示中的词语承载候选概念。"
        },
        {
          "icon": "✓",
          "title": "开放不是万能",
          "desc": "文本可变不保证任意新概念都识别正确。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "把短语拆成可监督的词",
      "badge": "inf",
      "badgeLabel": "推理与理解",
      "bridge": "文字不是一个不可分的类别编号。一个区域可能对应多个词，需要把短语级标签展开到token级。",
      "analogy": {
        "title": "一支铅笔划出卡片关键词",
        "text": "在“红色陶瓷杯”的说明卡上划出完整短语，不能只认最后一个字。这里的英文小例子用于展示标签展开，不模拟BERT分词器。",
        "componentId": "museum-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "为一个框选择完整短语",
          "desc": "选择 traffic 与 light，观察区域—词语目标矩阵。标点不属于正短语；这里采用正文的sigmoid focal分支。来源：PDF p4 §3.1。",
          "componentId": "tokens"
        }
      ],
      "insight": "短语的所有子词共享正匹配标签。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "短语不等于token",
          "desc": "多词短语和子词分割都会让token数多于类别数。"
        },
        {
          "icon": "↔",
          "title": "监督需要展开",
          "desc": "同一正短语的所有子词都对应正匹配。"
        },
        {
          "icon": "✓",
          "title": "别混损失分支",
          "desc": "正文sigmoid focal与脚注CE在无目标处理和聚合上不同。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "统一检测与短语定位",
      "badge": "both",
      "badgeLabel": "原理与证据",
      "bridge": "词级目标矩阵让两类数据有了共同接口：检测数据提供类别词，定位数据提供带上下文的短语。",
      "analogy": {
        "title": "一张展品卡对齐展品底座",
        "text": "“杯子”和“架子上的杯子”都能成为导览卡，区别在于后者带了上下文。相同的指认任务让两种卡片可以一起用于练习。",
        "componentId": "museum-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "同一张图，两种监督",
          "desc": "切换检测标注与短语定位标注，比较候选描述和正匹配矩阵。示例标签为教学构造；来源：§3.1、图1。",
          "componentId": "unify"
        }
      ],
      "insight": "统一监督形式而不是取消边界框。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "共同接口",
          "desc": "两种数据都能形成区域与词语的对应监督。"
        },
        {
          "icon": "↔",
          "title": "定位仍保留",
          "desc": "分类项换成对齐项，边框定位项仍然存在。"
        },
        {
          "icon": "✓",
          "title": "与CLIP的衔接",
          "desc": "教学上可理解为从整体匹配走向细粒度匹配，GLIP并非简单裁剪后调用CLIP。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "点积如何变成匹配证据",
      "badge": "both",
      "badgeLabel": "原理与证据",
      "bridge": "监督告诉模型谁该匹配；分数告诉我们当前匹配得怎样。用一个能手算的二维例子区分点积、概率和短语分数。",
      "analogy": {
        "title": "一把尺子量出卡片方向",
        "text": "两张卡片的方向越接近，越容易对齐；向量点积也与方向和长度有关。这里只固定单位长度，真实特征不必单位归一化。",
        "componentId": "museum-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "拖动词向量，亲手算一次点积",
          "desc": "橙色端点可拖动，键盘左右键也可调整。区域向量O=(1,0)，词向量P=(cosθ,sinθ)，d=2只是教学构造；GLIP式(3)未要求归一化。",
          "componentId": "dot"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "两种“先平均”真的一样吗？",
          "desc": "使用logits 0与2的可核算例子，比较先sigmoid再平均和先平均再sigmoid。正确顺序来自PDF p4 §3.1。",
          "componentId": "aggregate"
        }
      ],
      "insight": "S=OPᵀ得到N×M词区域logits。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "形状要对齐",
          "desc": "O为N×d，P为M×d，OPᵀ才得到N×M。"
        },
        {
          "icon": "↔",
          "title": "分数不是概率",
          "desc": "点积可能为负且无上界；本例再用sigmoid映射。"
        },
        {
          "icon": "✓",
          "title": "先概率后聚合",
          "desc": "正文推理对短语内各token概率取平均，不是先平均logit。"
        }
      ],
      "formula": {
        "lead": "先算每个区域与每个词的分数，再形成词级概率。",
        "unicode": "S = O Pᵀ；pᵢⱼ = sigmoid(Sᵢⱼ)",
        "symbols": [
          {
            "sym": "S",
            "desc": "N×M对齐logits，不是已归一化概率。"
          },
          {
            "sym": "O",
            "desc": "N×d区域表示；示例N=1、d=2。"
          },
          {
            "sym": "P",
            "desc": "M×d词表示；与O共享点积维度。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "语言不仅在最后打分",
      "badge": "both",
      "badgeLabel": "原理与证据",
      "bridge": "只有末端点积，图像编码时还不知道要找什么。GLIP在后部编码层用双向注意力交换图像与语言上下文。",
      "analogy": {
        "title": "一面放大镜对准导览关键词",
        "text": "看展品时参照说明卡，读说明卡时又回头看展品。自动画面只表现放大镜对准的一个动作；下方交互展示真正的双向计算。",
        "componentId": "museum-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "一步步注入跨模态上下文",
          "desc": "单头、单区域、两词的简化计算；省略可学习投影与后续编码层，只演示式(4)–(6)的信息交换，数值不是GLIP权重。",
          "componentId": "fusion"
        }
      ],
      "insight": "跨模态上下文在特征更新前注入。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "双向交换",
          "desc": "区域关注词，词也关注区域。"
        },
        {
          "icon": "↔",
          "title": "残差后更新",
          "desc": "跨模态上下文相加后分别进入DyHead模块和BERT层。"
        },
        {
          "icon": "✓",
          "title": "别只翻转权重",
          "desc": "反向使用转置logits重新softmax，而非简单转置概率。"
        }
      ],
      "formula": {
        "lead": "每个方向在被关注的一组元素上单独归一化。",
        "unicode": "A = Qᴵ(Qᴸ)ᵀ / √d；Cᴵ = softmax(A) Vᴸ",
        "symbols": [
          {
            "sym": "A",
            "desc": "N×M注意力logits；正向按词维归一化。"
          },
          {
            "sym": "Qᴵ",
            "desc": "视觉查询，N×d。"
          },
          {
            "sym": "Qᴸ",
            "desc": "语言查询，M×d。"
          },
          {
            "sym": "Vᴸ",
            "desc": "语言值向量；此处省略输出投影以突出加权和。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "从词分数得到检测框",
      "badge": "inf",
      "badgeLabel": "推理与理解",
      "bridge": "融合后的特征仍要输出词级匹配分数和位置。候选短语的得分聚合后，筛选阈值会改变保留哪些框。",
      "analogy": {
        "title": "一个取景框收拢到展品边缘",
        "text": "取景框可以圈得更严格，但收紧标准也会漏掉目标。门槛不是知识，删掉低分框不会让模型突然认识新展品。",
        "componentId": "museum-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "调节筛选门槛，观察漏检与误检",
          "desc": "固定四个教学候选：两个正确目标0.90/0.55，一个错误框0.65，一个重复框0.80。此控件只演示阈值，不实现完整GLIP后处理或AP评测。来源：§3.1推理聚合。",
          "componentId": "threshold"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "亲手把框放准",
          "desc": "拖动、缩放预测框，观察交集、并集与 IoU 的实时变化；再试试用大框包住整个目标。原创几何练习，不是论文实验结果。",
          "componentId": "localize"
        }
      ],
      "insight": "阈值控制精确率/召回权衡而非改变模型学到的知识。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "概率按短语聚合",
          "desc": "多词短语对token概率取平均。"
        },
        {
          "icon": "↔",
          "title": "位置与语义缺一不可",
          "desc": "类别分数高不代表框的位置正确。"
        },
        {
          "icon": "✓",
          "title": "单图不等于AP",
          "desc": "本例精确率/召回率不是跨阈值、跨IoU的COCO AP。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "训练：匹配与定位一起学",
      "badge": "trn",
      "badgeLabel": "训练与结构",
      "bridge": "推理门槛不改模型；训练才通过损失更新参数。GLIP把分类损失的输入换成区域—词对齐分数，同时保留定位损失。",
      "analogy": {
        "title": "一块橡皮擦掉错误标记",
        "text": "校正展品卡有两件事：指向正确对象，并把边框画准。擦掉错词不能自动修好歪框，两类误差都需要监督。",
        "componentId": "museum-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "执行一次小型训练更新",
          "desc": "正标签的单logit sigmoid focal教学例：α=0.25、γ=2、学习率0.5，z初值−1。此参数仅用于可计算演示，不声明为GLIP完整训练配置；框图展示定位项独立性。来源：式(1)–(3)。",
          "componentId": "train"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "给教师的伪标签做质检",
          "desc": "先用分数门槛批量筛选，再逐个决定保留哪些伪框；审校会显示误标和遗漏。教学构造，用于理解 §3.3 的教师—学生数据扩展与标签噪声。",
          "componentId": "pseudo"
        }
      ],
      "insight": "对齐损失与定位损失分工。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "替换分类项",
          "desc": "对齐分数进入检测损失，不是仅做整图对比学习。"
        },
        {
          "icon": "↔",
          "title": "定位项保留",
          "desc": "框回归等任务由定位相关损失负责。"
        },
        {
          "icon": "✓",
          "title": "示例不是训练复现",
          "desc": "这里只更新一个教学变量，未训练GLIP网络。"
        }
      ],
      "formula": {
        "lead": "知道“是哪一个”与知道“框在哪里”都要付出错误代价。",
        "unicode": "L = Lcls + Lloc",
        "symbols": [
          {
            "sym": "L",
            "desc": "总检测目标；在具体模型中还可能包含定位相关子项。"
          },
          {
            "sym": "Lcls",
            "desc": "用区域—词语对齐分数计算的分类/匹配损失。"
          },
          {
            "sym": "Lloc",
            "desc": "边框定位相关项；不同检测器实现可包含其他定位相关损失。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "把模块放回真实结构",
      "badge": "trn",
      "badgeLabel": "训练与结构",
      "bridge": "小例子展示了单次交换。实际GLIP把Swin视觉骨干、BERT语言骨干和多层深度融合接起来，再输出对齐分数与框。",
      "analogy": {
        "title": "一只手转动展品支架",
        "text": "转动支架能从不同侧面看同一件展品，结构本身没有被换掉。下方选择模块时会突出它参与的信息路径，而不是模拟完整神经网络。",
        "componentId": "museum-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点击结构，追踪信息与维度",
          "desc": "选择节点查看参与路径和输入输出。简化图省略金字塔尺度细节；N为区域/位置数量，不表示一定先生成固定框。来源：图1、式(3)–(6)。",
          "componentId": "architecture"
        }
      ],
      "insight": "分清骨干、融合层、输出头。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "实现有具体选择",
          "desc": "本文使用DyHead与BERT融合，不等于所有开放词汇检测器都如此。"
        },
        {
          "icon": "↔",
          "title": "深度不同于末端",
          "desc": "移除跨模态上下文后退化为晚期融合。"
        },
        {
          "icon": "✓",
          "title": "两路输出",
          "desc": "对齐与定位共同组成目标检测结果。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "数据扩展与任务适配",
      "badge": "trn",
      "badgeLabel": "训练与结构",
      "bridge": "结构统一后才能混合检测和定位数据，并用teacher给网络图文对生成伪框。迁移时，改文字和训练提示向量又是两种不同操作。",
      "analogy": {
        "title": "一枚印章核验展品卡",
        "text": "新导览卡要经过核验，但老师盖过章也不保证绝对正确。伪标注让资料更多，也可能继承老师的错误。",
        "componentId": "museum-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "沿着A、B、C、T检查证据",
          "desc": "切换真实模型配置，读取同骨干的COCO零样本AP与LVIS MiniVal APr。图形使用相同0–60刻度但两指标不可比较大小；每组独立看变化。来源：表1–3。",
          "componentId": "data"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "改一句话，还是更新参数？",
          "desc": "切换三种适配策略，观察可训练部分。手动描述、prompt tuning和全量微调不是同义词；来源：§5.2、图4–5。",
          "componentId": "adapt"
        }
      ],
      "insight": "区分预训练数据扩展与下游提示适配。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "先teacher后student",
          "desc": "teacher用人工检测/定位数据，student再混合伪框数据。"
        },
        {
          "icon": "↔",
          "title": "不要误读消融",
          "desc": "L同时扩大数据和骨干，不能把收益全归因于一个因素。"
        },
        {
          "icon": "✓",
          "title": "迁移需要边界",
          "desc": "13个ODinW集的平均趋势不能保证每个任务都成功。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果：先选协议，再谈提升",
      "badge": "both",
      "badgeLabel": "原理与证据",
      "bridge": "最后用真实表格验收三件事：跨域检测是否有效，稀有概念是否获益，比较是否遵守相同数据集与训练条件。",
      "analogy": {
        "title": "一枚评审标记贴到展品卡",
        "text": "展览评审要先看同一张评分表；不同评分项目的数字不能混排成冠军榜。结果动画只用于读数，不代表推理速度。",
        "componentId": "museum-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "启动同协议实验对比",
          "desc": "选择数据集后启动柱形对比，所有数值来自CVPR2022表2–4。动画时长不表示模型速度；这些是原论文结果，非本机复现。",
          "componentId": "results"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "四道结论题：用证据说话",
          "desc": "亲自判断指标、划分、训练配置与数据扩展结论。每题即时给出论文表格依据，可以订正并重新挑战。来源：表 1–4 与数据说明。",
          "componentId": "evidence-quiz"
        }
      ],
      "insight": "实验数值必须绑定协议。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "明确证据范围",
          "desc": "GLIP-L的COCO零样本49.8 AP和LVIS 26.9 AP来自不同评测集。"
        },
        {
          "icon": "↔",
          "title": "注意特殊配置",
          "desc": "常规L微调60.8 val/61.0 test-dev；61.5是增加GoldG+和COCO的特殊test-dev配置。"
        },
        {
          "icon": "✓",
          "title": "留给后续的问题",
          "desc": "GLIP展示语言引导检测；下一篇Grounding DINO继续研究开放集检测结构，本网页不做未经验证的优劣排名。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1FV4y1p7Lm",
      "title": "CLIP 改进工作串讲（上）",
      "reason": "包含GLIP专章，可补充CLIP到细粒度视觉语言任务的背景；不是本教程实验数据来源。",
      "views": "16.4万播放（检索快照）"
    }
  ]
};
