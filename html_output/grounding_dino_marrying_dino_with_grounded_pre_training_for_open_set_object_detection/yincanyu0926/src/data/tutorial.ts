import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Grounding DINO: Marrying DINO with Grounded Pre-Training for Open-Set Object Detection",
    "titleZh": "Grounding DINO：从图文对齐到开放集检测",
    "venue": "ECCV 2024 · 正式论文版",
    "authors": "Shilong Liu、Zhaoyang Zeng、Tianhe Ren 等",
    "affiliation": "清华大学、IDEA 等",
    "domain": "开放集目标检测 · 图文定位",
    "coreProblem": "固定类别检测器怎样根据新的文字描述找到图像目标？",
    "coreInsight": "在特征增强、查询初始化和解码阶段连续融入语言，并用定位数据训练。",
    "keywords": [
      "语言引导查询",
      "三阶段融合",
      "子句级掩码",
      "零样本迁移"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "固定类别检测器只能从原有标签表给框；新的描述无法在多个相似目标中明确指定。",
      "componentId": "bird-hero-old"
    },
    "newMethod": {
      "desc": "Grounding DINO接收图片和文字，在特征、查询和解码三个阶段结合两种信息；图中鸟与框是原创教学示意。",
      "componentId": "bird-hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "从固定类别到文字寻物",
      "badge": "inf",
      "badgeLabel": "推理与理解",
      "bridge": "固定类别检测只认事先写在名单里的对象。试着改写要找的鸟，再看文字寻物如何给出目标框。",
      "analogy": {
        "title": "让观鸟者指定任意描述",
        "text": "把观鸟当作寻找指定目标的类比：在树林中举起望远镜。实际模型处理的是图像特征与文本特征，不是望远镜。",
        "componentId": "bird-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "文字寻物",
          "desc": "切换对象和固定类别/文字提示，观察目标框是否能表达需求。来源：p1–2 Fig.1。",
          "componentId": "task"
        }
      ],
      "insight": "固定名单不能覆盖新的目标，输入文字可指定要找的对象。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "研究问题",
          "desc": "从固定类别到文字寻物"
        },
        {
          "icon": "↔",
          "title": "机制与结论",
          "desc": "固定名单不能覆盖新的目标，输入文字可指定要找的对象。"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "图中的示意数值不等于论文模型输出；真实实验请对照页面所列条件。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "一句话怎样变成目标",
      "badge": "inf",
      "badgeLabel": "推理与理解",
      "bridge": "同一张图片可以配类别名，也可以配带属性的指代表达；它们对“找哪一只”提出不同要求。",
      "analogy": {
        "title": "读鸟类描述中的对象词",
        "text": "把观鸟当作寻找指定目标的类比：对照鸟图鉴寻找翅纹。实际模型处理的是图像特征与文本特征，不是望远镜。",
        "componentId": "bird-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "组合短语与候选集合",
          "desc": "勾选颜色、位置和大小，观察描述约束如何消除歧义。规则教学，不是实际推理。",
          "componentId": "prompt"
        }
      ],
      "insight": "类别名和指代表达都能进入同一检测接口，但指代需要更细的定位证据。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "研究问题",
          "desc": "一句话怎样变成目标"
        },
        {
          "icon": "↔",
          "title": "机制与结论",
          "desc": "类别名和指代表达都能进入同一检测接口，但指代需要更细的定位证据。"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "图中的示意数值不等于论文模型输出；真实实验请对照页面所列条件。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "图像与语言先交换线索",
      "badge": "inf",
      "badgeLabel": "推理与理解",
      "bridge": "如果图像和文字只在最后比较，早期特征没有跨模态上下文。启用双向特征增强，观察信息路径。",
      "analogy": {
        "title": "先扫视，再互相提醒",
        "text": "把观鸟当作寻找指定目标的类比：转动望远镜使文字提示对上鸟影。实际模型处理的是图像特征与文本特征，不是望远镜。",
        "componentId": "bird-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "双向增强",
          "desc": "打开图像到文字及文字到图像的连接，查看示意区域匹配变化。来源：p6 §3.1 Fig.3。",
          "componentId": "enhancer"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "跨注意力数值实验",
          "desc": "改变 logits 与温度，观察归一化权重和加权聚合；构造算例，机制来源 §3.1。",
          "componentId": "attention-lab"
        }
      ],
      "insight": "特征增强器让图像和文字在查询产生前交换信息。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "研究问题",
          "desc": "图像与语言先交换线索"
        },
        {
          "icon": "↔",
          "title": "机制与结论",
          "desc": "特征增强器让图像和文字在查询产生前交换信息。"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "图中的示意数值不等于论文模型输出；真实实验请对照页面所列条件。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "语言怎样挑出候选查询",
      "badge": "both",
      "badgeLabel": "机制与证据",
      "bridge": "每个图像位置与多个文本词计算相似度；先沿文本维取最大值，再选排名靠前的图像位置。",
      "analogy": {
        "title": "从许多位置挑少数焦点",
        "text": "把观鸟当作寻找指定目标的类比：把镜头移向得分最高的鸟影。实际模型处理的是图像特征与文本特征，不是望远镜。",
        "componentId": "bird-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "编辑点积矩阵，重排查询",
          "desc": "逐格修改 S，核对 max 与 Top-Nq 的计算；原始点积不预先做 softmax。",
          "componentId": "query"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "混合查询：空间锚点与可学习内容",
          "desc": "并排操作锚框与内容向量，辨认两类初始化来源；展开说明理解它们在解码中的关系。",
          "componentId": "mixed"
        }
      ],
      "insight": "Eq.1 选出的是图像位置索引；混合查询的内容部分仍是可学习的。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "研究问题",
          "desc": "语言怎样挑出候选查询"
        },
        {
          "icon": "↔",
          "title": "机制与结论",
          "desc": "Eq.1 选出的是图像位置索引；混合查询的内容部分仍是可学习的。"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "图中的示意数值不等于论文模型输出；真实实验请对照页面所列条件。"
        }
      ],
      "formula": {
        "lead": "先沿文本维逐行取最大值，再选前 Nq 个图像 token。",
        "unicode": "I_Nq = Top_Nq( Max_text( X_I X_Tᵀ ) )",
        "symbols": [
          {
            "sym": "X_I",
            "desc": "图像特征，N_I×d"
          },
          {
            "sym": "X_T",
            "desc": "文本特征，N_T×d"
          },
          {
            "sym": "Nq",
            "desc": "待选查询索引数量；论文默认900"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "查询如何逐层修正",
      "badge": "both",
      "badgeLabel": "机制与证据",
      "bridge": "初始焦点并不等于最终边框。逐步查看查询如何通过自注意、图像跨注意、文本跨注意与 FFN 更新。",
      "analogy": {
        "title": "焦点还要继续看图和文字",
        "text": "把观鸟当作寻找指定目标的类比：调整焦距使鸟影边缘更清楚。实际模型处理的是图像特征与文本特征，不是望远镜。",
        "componentId": "bird-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "解码器四步",
          "desc": "逐步切换查询更新环节，查看框与词的联系。来源：p7 §3.3 Fig.3。",
          "componentId": "decoder"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "拖动框：定位误差从哪里来",
          "desc": "同时改变位置与尺度，计算交集、并集和 IoU；区分几何练习与真实解码。",
          "componentId": "box-lab"
        }
      ],
      "insight": "跨模态解码器持续利用图像和文字修正查询，最终输出框和词。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "研究问题",
          "desc": "查询如何逐层修正"
        },
        {
          "icon": "↔",
          "title": "机制与结论",
          "desc": "跨模态解码器持续利用图像和文字修正查询，最终输出框和词。"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "图中的示意数值不等于论文模型输出；真实实验请对照页面所列条件。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "不同类别为何要隔开",
      "badge": "inf",
      "badgeLabel": "推理与理解",
      "bridge": "任意拼接的类别名可能在文本自注意时互相影响。给无关类别加掩码，保留同一短语内部的联系。",
      "analogy": {
        "title": "避免无关鸟名串台",
        "text": "把观鸟当作寻找指定目标的类比：遮住无关图鉴页再辨识。实际模型处理的是图像特征与文本特征，不是望远镜。",
        "componentId": "bird-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "亲手绘制子句掩码",
          "desc": "点击 4×4 矩阵改变连接，观察一整行权重重新归一化及全遮挡失败情形。",
          "componentId": "mask"
        }
      ],
      "insight": "子句级掩码阻断无关类别的注意力，同时保留细粒度词特征。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "研究问题",
          "desc": "不同类别为何要隔开"
        },
        {
          "icon": "↔",
          "title": "机制与结论",
          "desc": "子句级掩码阻断无关类别的注意力，同时保留细粒度词特征。"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "图中的示意数值不等于论文模型输出；真实实验请对照页面所列条件。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "训练时如何配对并纠错",
      "badge": "trn",
      "badgeLabel": "训练与结构",
      "bridge": "多个预测和多个目标需要先一对一匹配。试着选匹配方案，再看分类、L1 和 GIoU 如何一起约束模型。",
      "analogy": {
        "title": "先配对，再计算损失",
        "text": "把观鸟当作寻找指定目标的类比：给两幅照片各贴一张说明卡。实际模型处理的是图像特征与文本特征，不是望远镜。",
        "componentId": "bird-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "寻找全局最小匹配",
          "desc": "点击成本格交换一对一分配，用连线与总成本发现按行贪心的反例。",
          "componentId": "matching"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "匹配之后：拆开训练目标",
          "desc": "调整三个构造损失项，比较加权贡献；区分匹配成本与最终训练目标。",
          "componentId": "loss-lab"
        }
      ],
      "insight": "匈牙利匹配先决定对应关系；匹配后才对对应预测计算最终损失。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "研究问题",
          "desc": "训练时如何配对并纠错"
        },
        {
          "icon": "↔",
          "title": "机制与结论",
          "desc": "匈牙利匹配先决定对应关系；匹配后才对对应预测计算最终损失。"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "图中的示意数值不等于论文模型输出；真实实验请对照页面所列条件。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "把三个融合阶段接起来",
      "badge": "trn",
      "badgeLabel": "训练与结构",
      "bridge": "把增强器、语言引导查询、跨模态解码器串成一条路径，逐点检查图文信息何时进入。",
      "analogy": {
        "title": "追踪完整的观鸟路径",
        "text": "把观鸟当作寻找指定目标的类比：沿观鸟记录的三处标记复查。实际模型处理的是图像特征与文本特征，不是望远镜。",
        "componentId": "bird-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "结构热点",
          "desc": "点击三个阶段，查看当前输入、输出与参与的模态。来源：p2 §1、p5 Fig.3。",
          "componentId": "architecture"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "拆掉一个组件，证据怎样变化",
          "desc": "按相同配置比较 Table 7 的单项消融；分别考察零样本与微调协议。",
          "componentId": "ablation-lab"
        }
      ],
      "insight": "论文以 A、B、C 三阶段紧密融合，而非只在最终分类时加入语言。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "研究问题",
          "desc": "把三个融合阶段接起来"
        },
        {
          "icon": "↔",
          "title": "机制与结论",
          "desc": "论文以 A、B、C 三阶段紧密融合，而非只在最终分类时加入语言。"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "图中的示意数值不等于论文模型输出；真实实验请对照页面所列条件。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "数据多了，哪里可能变差",
      "badge": "both",
      "badgeLabel": "机制与证据",
      "bridge": "添加 RefC 数据可以让某些任务获益，同时让其他数据集零样本成绩下降。逐个切换训练条件。",
      "analogy": {
        "title": "观察不同栖地的成绩",
        "text": "把观鸟当作寻找指定目标的类比：换一个栖地继续观测。实际模型处理的是图像特征与文本特征，不是望远镜。",
        "componentId": "bird-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "数据转移",
          "desc": "切换有无 RefC，观察 COCO、LVIS 与 ODinW 同协议各自变化。来源：p13 Table 6。",
          "componentId": "transfer"
        }
      ],
      "insight": "训练数据变化的收益依赖评测任务；不能从某个 AP 提升推出全面更好。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "研究问题",
          "desc": "数据多了，哪里可能变差"
        },
        {
          "icon": "↔",
          "title": "机制与结论",
          "desc": "训练数据变化的收益依赖评测任务；不能从某个 AP 提升推出全面更好。"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "图中的示意数值不等于论文模型输出；真实实验请对照页面所列条件。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果要带条件一起读",
      "badge": "both",
      "badgeLabel": "机制与证据",
      "bridge": "论文给出 52.5 零样本 AP，也列出标注 COCO 训练的 60.7；两个数不能写成同一种结果。",
      "analogy": {
        "title": "先看协议，再下结论",
        "text": "把观鸟当作寻找指定目标的类比：在日志中核对一条观测记录。实际模型处理的是图像特征与文本特征，不是望远镜。",
        "componentId": "bird-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "协议核对",
          "desc": "切换结果组，对照模型条件；再检查零样本与稀有类别结论。来源：Tables 2、3、4、7。",
          "componentId": "results"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "四个结论，逐项找证据",
          "desc": "判断 52.5、60.7、稀有类 APr 与 RefC 影响；错误选择显示对应表格。",
          "componentId": "quiz"
        }
      ],
      "insight": "同一个数字需要骨干、训练数据、划分和指标共同界定。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "研究问题",
          "desc": "结果要带条件一起读"
        },
        {
          "icon": "↔",
          "title": "机制与结论",
          "desc": "同一个数字需要骨干、训练数据、划分和指标共同界定。"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "图中的示意数值不等于论文模型输出；真实实验请对照页面所列条件。"
        }
      ]
    }
  ]
};
