import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Zoom In and Out: A Mixed-scale Triplet Network for Camouflaged Object Detection",
    "titleZh": "ZoomNet：放大与缩小，发现伪装目标",
    "venue": "CVPR 2022",
    "authors": "Youwei Pang · Xiaoqi Zhao · Tian-Zhu Xiang · Lihe Zhang · Huchuan Lu",
    "affiliation": "大连理工大学 · 鹏城实验室 · Inception Institute of Artificial Intelligence",
    "domain": "计算机视觉 · 伪装目标分割",
    "coreProblem": "当目标与背景纹理相似、大小不同或受到遮挡时，怎样从整张图中分割出可信的目标区域？",
    "coreInsight": "用共享编码器观察三种尺度，由 SIU 筛选尺度线索、HMU 细化通道特征，再用 BCE 与 UAL 共同约束预测。",
    "keywords": [
      "三尺度共享编码",
      "SIU 尺度整合",
      "HMU 通道交互",
      "不确定性感知损失"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "只在一个尺度观察，局部细节与整体轮廓可能难以兼顾。以下为生活类比示意。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "缩小看上下文，放大看细节，再选择并融合线索。示意动画不是真实模型预测。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "看见不显眼的目标",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "先明确任务：我们要找出目标的每一个像素，而不只是圈出大概位置。",
      "analogy": {
        "title": "扫过叶面，寻找边界",
        "text": "像在林间辨认拟态昆虫：颜色接近时，光找到位置还不够，还要描清它与叶片的边界。",
        "componentId": "analogy-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "换一种藏法，任务还是像素分割",
          "desc": "切换同一只示意昆虫的藏身方式，比较输入与目标掩膜。这里是手绘教学场景，不是 ZoomNet 的预测。",
          "componentId": "zoom-1"
        }
      ],
      "insight": "COD 的终点是一张像素掩膜；难的是在相似外观中找到可信的分界线。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "像素级任务",
          "desc": "COD 分割前景与背景，目标输出不是检测框。"
        },
        {
          "icon": "🍃",
          "title": "三类困难",
          "desc": "相似纹理、小目标和遮挡会让目标不显眼；本页仅作几何示意。"
        },
        {
          "icon": "🔎",
          "title": "尺度影响线索",
          "desc": "局部细节与整体上下文提供不同线索，观察尺度会改变这些线索的表达。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "三次缩放，一套参数",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "把同一张图送到三个尺度：保持场景内容不变，让特征提取器看到不同的采样表达。",
      "analogy": {
        "title": "调整取景，保留整张图",
        "text": "观察手记里，同一片叶子可以缩小看整体，也可以放大看纹理。这里改变的是整张图的采样尺度，不是裁下一块局部。",
        "componentId": "analogy-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "拖动观察刻度，看整图怎样重采样",
          "desc": "拖动下方取景刻度，或用按钮切换三个输入尺度；每条分支调用同一套 E-Net 与 C-Net 参数。图像与网格均为示意。",
          "componentId": "zoom-2"
        }
      ],
      "insight": "三种输入尺度增加观察角度；共享参数让它们使用同一套特征提取规则。",
      "takeaways": [
        {
          "icon": "🔍",
          "title": "三个整图尺度",
          "desc": "0.5× / 1× / 1.5× 对应192 / 384 / 576的输入边长；不是三块裁剪图。"
        },
        {
          "icon": "🔗",
          "title": "参数共享",
          "desc": "三分支共享 E-Net 与 C-Net；每支形成五级、每级64通道的压缩特征。"
        },
        {
          "icon": "⚖️",
          "title": "共享仍有代价",
          "desc": "参数复用不消除多尺度计算，需要同时衡量效果与GFLOPs。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "多看一眼，补齐线索",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "已经有了三组特征，还要区分：它们只是变多，还是能提供不同线索？",
      "analogy": {
        "title": "放大一条叶脉，也记住整片叶子",
        "text": "只盯一条纹理，可能把昆虫当叶脉；把细节放回整体轮廓里，才有机会补齐线索。",
        "componentId": "analogy-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "同一时刻开始，看线索怎样互补",
          "desc": "同时播放单尺度与混合尺度的示意对照，再用论文消融表核对设计动机。画面不是模型预测，表格才是实验数值。",
          "componentId": "zoom-3"
        }
      ],
      "insight": "增加尺度只是第一步；还要在合适的位置筛选有用的尺度线索。",
      "takeaways": [
        {
          "icon": "🧩",
          "title": "互补而非重复",
          "desc": "缩小与放大可以改变特征表达，提供局部细节和相对上下文的不同线索。"
        },
        {
          "icon": "📊",
          "title": "看对实验口径",
          "desc": "表3是 CAMO 与 COD10K 的平均消融，不能当成单一测试集成绩。"
        },
        {
          "icon": "🧠",
          "title": "融合也要选择",
          "desc": "三尺度相加和SIU是不同设置；SIU在每个位置分配尺度权重。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "SIU：在每个位置选尺度",
      "badge": "both",
      "badgeLabel": "理解与实践",
      "bridge": "三幅图带来互补线索，但不能直接拼尺寸；本节把它们对齐，再让每个位置分配三种尺度的权重。",
      "analogy": {
        "title": "给同一片叶子换观察滤镜",
        "text": "位置对齐后，再强调更有用的线索。SIU 的权重来自网络学习；这里的滤镜只是帮助理解选择与融合。",
        "componentId": "analogy-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "拨动一个权重，看三者一起变化",
          "desc": "拖动分数，观察权重柱、叶片轮廓与融合值同步变化。数值为教学示例，不是模型推理。",
          "componentId": "zoom-4"
        }
      ],
      "insight": "SIU 先解决“同一个位置”，再解决“相信哪一种尺度”。",
      "takeaways": [
        {
          "icon": "🧭",
          "title": "对齐位置",
          "desc": "小尺度双线性上采样，大尺度结合最大池化与平均池化，统一到主尺度分辨率。"
        },
        {
          "icon": "⚖️",
          "title": "跨尺度归一化",
          "desc": "每个位置的三个权重之和为 1；同一权重作用到该位置的各通道。"
        },
        {
          "icon": "🔎",
          "title": "权重需要学习",
          "desc": "手设分数只用于演示，真实注意力由卷积网络生成；大尺度并非处处最优。"
        }
      ],
      "formula": {
        "lead": "先对齐，再沿尺度维度归一化；权重在通道维度广播。这里沿用论文式（1）的简化写法。",
        "unicode": "Aᵢ = softmax(Ψ([U(fᵢ<sup>0.5</sup>), fᵢ<sup>1</sup>, D(fᵢ<sup>1.5</sup>)])); fᵢ = Aᵢ<sup>0.5</sup>·U(fᵢ<sup>0.5</sup>) + Aᵢ<sup>1</sup>·fᵢ<sup>1</sup> + Aᵢ<sup>1.5</sup>·D(fᵢ<sup>1.5</sup>)",
        "symbols": [
          {
            "sym": "fᵢ",
            "desc": "第 i 级融合后的 64 通道特征；带 0.5、1、1.5 上标时，表示相应输入尺度的特征"
          },
          {
            "sym": "U",
            "desc": "双线性上采样，将小尺度特征对齐到主尺度特征的空间分辨率"
          },
          {
            "sym": "D",
            "desc": "最大池化与平均池化结合的下采样，将大尺度特征对齐到主尺度特征的空间分辨率"
          },
          {
            "sym": "Ψ",
            "desc": "学习注意力的卷积网络；方括号表示拼接"
          },
          {
            "sym": "Aᵢ",
            "desc": "第 i 级三尺度空间注意力；上标指示具体尺度，每个位置三者和为 1，并在通道上广播"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "HMU：让通道交换线索",
      "badge": "both",
      "badgeLabel": "理解与实践",
      "bridge": "SIU 已把尺度线索合到一起；接下来，HMU 让不同通道中的信息继续交换，再筛选更有用的响应。",
      "analogy": {
        "title": "换个滤镜，交换细节线索",
        "text": "看见同一片叶子的轮廓和叶脉后，还要把这些线索联系起来。HMU 的分组交互与通道调制进一步细化融合特征。",
        "componentId": "analogy-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "分组越多，一定越好吗？",
          "desc": "切换分组数，看结构、计算量与 COD10K-Test 指标如何变化。结果来自论文表 2，结构为简化示意。",
          "componentId": "zoom-5"
        }
      ],
      "insight": "跨尺度融合解决“从哪里看”，通道交互解决“如何组合看见的线索”。",
      "takeaways": [
        {
          "icon": "🧩",
          "title": "部分线索逐组传递",
          "desc": "HMU 先扩展通道并分组；前一组的一个子特征送入下一组，不是复制全部特征。"
        },
        {
          "icon": "🎚️",
          "title": "调制后残差融合",
          "desc": "另外两路子特征分别形成通道调制信号与待加权内容，处理后与输入残差相加。"
        },
        {
          "icon": "📊",
          "title": "默认值有实验边界",
          "desc": "表 2 的 COD10K-Test 消融支持选择 6 组；GFLOPs 是运算量，不是延迟。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "一次前向，得到一张掩膜",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "理解了 SIU 与 HMU 后，把它们接回一次完整预测：三种尺度一起提供线索，最后仍输出一张像素概率图。",
      "analogy": {
        "title": "把观察到的轮廓画在同一页上",
        "text": "多种观察线索最终落到同一张像素图上。这里的描边用于说明输出形态，不代表模型真的按轮廓逐点搜索。",
        "componentId": "analogy-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "逐步走完一次前向",
          "desc": "按顺序查看信息如何变化；图中图像、特征与掩膜均为教学示意。",
          "componentId": "zoom-6"
        }
      ],
      "insight": "三份尺度信息不等于三张最终答案：ZoomNet 产生的是同一目标的像素级概率图。",
      "takeaways": [
        {
          "icon": "🔁",
          "title": "一次前向",
          "desc": "三尺度共同参与一次预测；教程分步展示不代表反复迭代推理。"
        },
        {
          "icon": "🗺️",
          "title": "一张像素图",
          "desc": "输出是单通道概率图，任务是分割目标区域，而不是回归检测框。"
        },
        {
          "icon": "🧪",
          "title": "演示不是实测",
          "desc": "本页掩膜用几何图形绘制，帮助理解结构，不用于评价检测效果。"
        }
      ],
      "formula": {
        "lead": "预测头先产生实数 logits，再把每个位置映射到概率区间。",
        "unicode": "p = sigmoid(z) = 1 / (1 + exp(−z))",
        "symbols": [
          {
            "sym": "z",
            "desc": "单个像素的实数 logit"
          },
          {
            "sym": "p",
            "desc": "该像素的前景概率，取值在 0 与 1 之间"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "UAL：明确，也要正确",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "概率图有了，还要让它既少犹豫又不乱猜。本节把“置信”与“正确”分开，看 BCE 和 UAL 为什么要一起用。",
      "analogy": {
        "title": "把轮廓画清楚，也要画对位置",
        "text": "落笔果断不等于描对目标。UAL 鼓励概率远离模糊中间值，BCE 则根据真实标签约束该往哪一端走。",
        "componentId": "analogy-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "拖动概率，拆开两种损失",
          "desc": "真实标签固定为前景 g=1。拖动概率，比较 UAL 与 BCE：这两条曲线是精确数学算例。",
          "componentId": "zoom-7"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "四个像素，识破“低 UAL 就是对”",
          "desc": "切换概率与标签的组合，检验“置信”是否等于“正确”。本算例固定 λ=1，不是训练日程。",
          "componentId": "zoom-7b"
        }
      ],
      "insight": "UAL 回答“是否犹豫”，BCE 回答“是否答对”；它们解决的不是同一个问题。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "正确方向靠标签",
          "desc": "BCE 使用真实标签；UAL 不读取标签，不能独立决定一个像素属于前景还是背景。"
        },
        {
          "icon": "🌗",
          "title": "极化不等于校准",
          "desc": "UAL 在 p=0.5 时最大、两端最小；低 UAL 只表示更不犹豫，不证明预测正确。"
        },
        {
          "icon": "⏱️",
          "title": "逐步增强正则",
          "desc": "论文默认递增余弦权重，早期减轻 UAL 对 BCE 的干扰；主文未展开精确日程。"
        }
      ],
      "formula": {
        "lead": "第一式定义单像素 UAL；第二式将按像素聚合后的 BCE 与 UAL 组合为训练目标。",
        "unicode": "ℓUAL = 1 − |2p − 1|² = 4p(1 − p); L = LBCE + λ LUAL",
        "symbols": [
          {
            "sym": "p",
            "desc": "预测前景概率"
          },
          {
            "sym": "ℓUAL",
            "desc": "单个像素的不确定性感知损失；只取决于预测概率 p，不直接使用真实标签"
          },
          {
            "sym": "LUAL",
            "desc": "单像素 ℓUAL 按像素聚合后的辅助损失；与 BCE 共同训练"
          },
          {
            "sym": "λ",
            "desc": "UAL 权重；论文默认递增余弦策略，此处算例固定为 1"
          },
          {
            "sym": "L",
            "desc": "像素损失聚合后的训练目标"
          },
          {
            "sym": "LBCE",
            "desc": "BCE 按像素聚合；单像素 ℓBCE = −g ln p − (1 − g) ln(1 − p)。g 为真实标签：前景为 1，背景为 0"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "把三种尺度接回完整网络",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "学完 SIU、HMU 与 UAL，现在把它们放回同一张网络图，核对输入、共享参数和输出。",
      "analogy": {
        "title": "展开自然观察手记",
        "text": "同一次观察中，远景、原景和近景最终汇入同一张手记；结构图帮助我们核对这些线索在哪里合并。",
        "componentId": "analogy-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点击节点，追踪后续路径",
          "desc": "选择一个节点，观察它连接到哪里，并检查该位置的特征含义。结构图为教学重绘。",
          "componentId": "zoom-8"
        }
      ],
      "insight": "参数共享节省重复参数，但三份缩放图仍要经过编码器；共享不等于免费计算。",
      "takeaways": [
        {
          "icon": "🧩",
          "title": "一套编码器，三份输入",
          "desc": "0.5×、1×、1.5×是全图缩放；编码器共享参数，而不是三个独立模型。"
        },
        {
          "icon": "🔀",
          "title": "先整合尺度，再细化通道",
          "desc": "SIU在对应层级整合三尺度，HMU在解码端处理混合后的分组特征。"
        },
        {
          "icon": "🎯",
          "title": "一次前向，像素预测",
          "desc": "输出是单通道前景概率图；动画分步展示不代表循环推理。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "为复现锁定实验条件",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "结构对齐以后，还要锁定训练数据与超参数，才能解释复现结果为什么接近或偏离论文。",
      "analogy": {
        "title": "用同一把尺记录叶片",
        "text": "测量条件变了，记录就不能直接比较；复现也需要固定数据、分辨率和优化设置。",
        "componentId": "analogy-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "找出偏离论文的设置",
          "desc": "切换假设场景，区分测试泄漏与需要单独报告的配置变更。这里只演示协议判断，不执行训练。",
          "componentId": "zoom-9"
        }
      ],
      "insight": "先复现一个可核对的基线，再做改进；否则数据、分辨率和优化器的变化会混在一起。",
      "takeaways": [
        {
          "icon": "🗂️",
          "title": "划分先固定",
          "desc": "训练：CAMO 1000 + COD10K 3040。测试：CAMO 250、CHAMELEON 76、COD10K 2026、NC4K 4121。"
        },
        {
          "icon": "⚙️",
          "title": "训练条件要对齐",
          "desc": "ImageNet预训练ResNet-50；40轮、batch 8、主尺度384；SGD学习率0.05、动量0.9、权重衰减0.0005，线性预热与衰减；训练增强使用随机翻转和旋转。"
        },
        {
          "icon": "🔍",
          "title": "移植后逐项核对",
          "desc": "Jittor检查建议：共享参数、插值坐标、混合池化、尺度softmax轴、BCE数值稳定性；这份教程不代表已完成模型移植。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、代价与适用边界",
      "badge": "both",
      "badgeLabel": "理解与实践",
      "bridge": "条件明确后，再读指标：哪些证据支持收益，哪些代价和边界必须一起报告？",
      "analogy": {
        "title": "给观察记录盖上核对章",
        "text": "一份可靠的观察记录既写发现，也写测量条件和代价；结论需要证据共同盖章。",
        "componentId": "analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "在相同坐标下比较两种方法",
          "desc": "选择数据集和指标，让两条图形在同一坐标下展开。数值来自论文主表，条形动画不代表真实训练。",
          "componentId": "zoom-10"
        }
      ],
      "insight": "更好要带上条件：哪个测试集、哪个指标、增加多少计算，以及结论适用到哪里。",
      "takeaways": [
        {
          "icon": "📊",
          "title": "提升需要对照条件",
          "desc": "主表比较的是2022年论文所列方法与指定数据划分；动画不是本机复现的测量结果。"
        },
        {
          "icon": "⚖️",
          "title": "收益伴随计算代价",
          "desc": "COD10K组件消融Fωβ从.637到.729；计算量41.885→203.496 GFLOPs，且UAL并非改善所有指标。"
        },
        {
          "icon": "🌱",
          "title": "迁移结论保留边界",
          "desc": "作者报告SOD迁移表现；具体数表在未提供的补充材料中，不能宣称COD权重零样本成功。遮挡、复杂背景仍是任务难点。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1bV41177ap",
      "title": "残差网络 ResNet：动手学深度学习",
      "reason": "补充编码器基础：共享 ResNet-50 的前置知识，并非 ZoomNet 专题讲解。"
    },
    {
      "bvid": "BV1vb4y1k7BV",
      "title": "ResNet 深度残差网络论文精读",
      "reason": "理解残差连接与深层特征表达，辅助阅读 HMU 残差结构。"
    },
    {
      "bvid": "BV1Si421h7YW",
      "title": "ResNet 模型构建、训练与推理",
      "reason": "补充代码和训练流程背景；不是 ZoomNet 的 Jittor 复现。"
    }
  ]
};
