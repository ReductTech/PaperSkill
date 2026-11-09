import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "YOLO-World: Real-Time Open-Vocabulary Object Detection",
    "titleZh": "YOLO-World：实时开放词汇目标检测",
    "venue": "arXiv:2401.17270v3 [cs.CV]，2024年2月22日",
    "authors": "Tianheng Cheng，Lin Song，Yixiao Ge，Wenyu Liu，Xinggang Wang，Ying Shan",
    "affiliation": "腾讯 AI Lab；腾讯 PCG ARC Lab；华中科技大学电信学院",
    "domain": "视觉 · 开放词汇目标检测",
    "coreProblem": "传统 YOLO 只能检测训练时定死的类别。",
    "coreInsight": "用视觉-语言预训练和可重参数化的 RepVL-PAN，把文本提示写进检测器。",
    "keywords": [
      "开放词汇检测",
      "YOLO-World",
      "RepVL-PAN",
      "区域-文本对比",
      "零样本"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "固定词表 YOLO",
      "desc": "只认印刷好的类名。",
      "componentId": "yw-cover-old"
    },
    "newMethod": {
      "title": "YOLO-World",
      "desc": "先把说法写进权重，再圈花。",
      "componentId": "yw-cover-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "固定词表的边界",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "固定词表认不出卡片外的花",
          "desc": "点一盆花，看印刷类名和外形说法哪一种能被固定词表接受。",
          "componentId": "yw-fixed-vocab"
        }
      ],
      "scenes": [
        {
          "id": "fixed-vocab",
          "title": "固定词表认不出卡片外的花",
          "goal": "为什么换一种说法，同一盆花就检测失败？",
          "summary": "固定词表检测器只输出训练时定义过的类名。外形短语和词表外的猪笼草都会落空。",
          "interaction": "点花盆，或在类名和外形说法之间切换。",
          "next": "下一页把这句话变成可以打分的区域-文本相似度。",
          "notes": "来源：第 1 页引言与第 3 页图 2(a)。COCO 的 80 类是论文例子；画面只用玫瑰、蕨、向日葵三张卡片做演示，不代表数据集只有三类。类比边界：花市卡片不是检测器的分类头。",
          "componentId": "yw-fixed-vocab",
          "moduleId": "1.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "区域与文本对齐",
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "区域嵌入和名词怎么打分",
          "desc": "选择一句短语并调节缩放，观察哪一盆花的演示相似度最高。",
          "componentId": "yw-region-text"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "对比损失何时计算框",
          "desc": "拖动预测框，并在检测数据与图文数据之间切换，看总损失是否跟着框走。",
          "componentId": "yw-contrastive"
        }
      ],
      "scenes": [
        {
          "id": "region-text",
          "title": "区域嵌入和名词怎么打分",
          "goal": "一句新说法怎样挑中对应的花？",
          "summary": "相似度是缩放后的余弦，再加平移。短语一换，最高的那盆花就换。",
          "interaction": "点选短语，或拖动缩放系数。",
          "next": "下一页看这个相似度怎样进入训练损失。",
          "notes": "公式 (1)，第 4 页。alpha 与 beta 可学习，论文未给数值；本页 beta 固定为 0，概率是四盆嵌入上的演示 softmax，不是 LVIS AP。嵌入坐标是教学用的二维单位向量。",
          "componentId": "yw-region-text",
          "moduleId": "2.1"
        },
        {
          "id": "contrastive-loss",
          "title": "对比损失何时计算框",
          "goal": "伪框很吵时，为什么不去回归框？",
          "summary": "检测和定位数据打开框损失；图文数据把指示系数设为 0，拖框不再改变总损失。",
          "interaction": "点正样本花盆，拖预测框，切换数据类型。",
          "next": "下一页看文字和图像在 RepVL-PAN 里怎样互相改写。",
          "notes": "第 5 页 3.4 节。总损失等于对比项加上指示系数乘框回归。画面固定标注「演示代理损失，非论文数值」：用 1 减重叠代替 IoU 与 DFL。在线词表默认最多 80 个名词，这里只用四盆花。",
          "componentId": "yw-contrastive",
          "moduleId": "2.2"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "视觉语言通路",
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "RepVL-PAN 的两个方向",
          "desc": "打开文字照花和花改写说法，并对照表 4 里真实存在的格子。",
          "componentId": "yw-repvl"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "提示先编码再检测",
          "desc": "把选定说法写入离线词表，再连续看新图；改口之后必须重新编码。",
          "componentId": "yw-reparam"
        },
        {
          "kind": "module",
          "id": "3.3",
          "title": "自定义说法与指称短语",
          "desc": "用类名、外形或指称短语提示，看哪一盆花被圈住。",
          "componentId": "yw-referring"
        }
      ],
      "scenes": [
        {
          "id": "repvl-pan",
          "title": "RepVL-PAN 的两个方向",
          "goal": "文字照进花，和花改写说法，各改变什么？",
          "summary": "文字到图像用 max-sigmoid，图像到文本用 27 个池化块。表 4 只给了部分开关组合的 AP。",
          "interaction": "切换两个融合方向，以及是否带上 GQA 短语。",
          "next": "下一页把编好的说法折进权重，推理时不再每次翻词典。",
          "notes": "公式 (2)(3)，第 4 到 5 页；表 4。未报告的组合不显示 AP。表 4 的 22.4 到 31.9 是消融，不是表 2 的 35.4。亮暗是机制演示。",
          "componentId": "yw-repvl",
          "moduleId": "3.1"
        },
        {
          "id": "prompt-deploy",
          "title": "提示先编码再检测",
          "goal": "词表写进权重之后，换一句话会发生什么？",
          "summary": "先编码用户提示，再重参数化。新图片不必重跑文本编码器；说法变了就必须重新编码。",
          "interaction": "勾选说法，编码并封箱，再来一张图，或在写入后改口。",
          "next": "下一页用自定义与指称短语继续圈花。",
          "notes": "第 2 到 4 页的 prompt-then-detect，图 2(c)、图 3，附录 A.1。表 2：重参数化 YOLO-World-L 为 48M、52.0 FPS，括号内带文本编码器为 110M、17.6 FPS；一张 V100，无 TensorRT。速度不随本页勾选的词数变化，论文没有给出这条曲线。封箱动效对应封面「先写说法再圈花」。",
          "componentId": "yw-reparam",
          "moduleId": "3.2"
        },
        {
          "id": "referring-prompt",
          "title": "自定义说法与指称短语",
          "goal": "除了印刷类名，外形和指称说法能不能圈中同一盆花？",
          "summary": "开放词汇提示可以是类名、外形短语或指称短语。画面没有的物体不会被圈中。",
          "interaction": "点选一句提示，观察哪一盆被圈住。",
          "next": "下一页比较该用纯文本词典还是图文词典。",
          "notes": "论文图 6–7 的定性开放词汇与指称演示。本页是机制示意，不是新的 AP 表，也不声称复现 referring 基准分数。布局标签（左边、右边）只服务教学，不是模型输出。",
          "componentId": "yw-referring",
          "moduleId": "3.3"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "预训练从哪来",
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "文本编码器该不该微调",
          "desc": "在四种编码器设定之间切换，对照表 5 的 AP 和稀有类 AP。",
          "componentId": "yw-text-encoder"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "预训练数据加到什么程度",
          "desc": "切换表 3 或表 9 中已经报告的数据配方，看 AP 怎样变化。",
          "componentId": "yw-pretrain"
        }
      ],
      "scenes": [
        {
          "id": "text-encoder",
          "title": "文本编码器该不该微调",
          "goal": "为什么默认要冻住 CLIP？",
          "summary": "冻结的 CLIP 稀有类最高。在 Objects365 上微调 CLIP，精度反而下降。",
          "interaction": "点选 BERT 或 CLIP，以及冻结还是微调。",
          "next": "下一页在货箱视角里把检测、短语和伪标注一筐筐加进去。",
          "notes": "表 5，第 6 到 7 页。微调学习率为基础学习率的 0.01 倍。CLIP 冻结 22.4 与稀有类 14.5，微调后 19.3 与 8.6。BERT 冻结 14.6 与 3.4，微调 18.3 与 6.6。不是表 2 的完整模型。",
          "componentId": "yw-text-encoder",
          "moduleId": "4.1"
        },
        {
          "id": "pretrain-data",
          "title": "预训练数据加到什么程度",
          "goal": "多加数据就一定更好吗？",
          "summary": "表 3 里短语和少量伪标注提高大模型消融分数。表 9 里过多伪标注会让小模型总体 AP 回落。",
          "interaction": "选择表 3 或表 9；表 9 可用滑块在已报告的伪标注量之间跳转。",
          "next": "下一页在同一套 LVIS 测速协议里比较各模型。",
          "notes": "表 1、表 3、表 9。表 3 为 23.5、31.9、32.5、33.0。表 9 小模型 O365+GoldG 为 24.2，不要写成表 2 的 26.2。CC3M 52 万为 19.2，75 万为 18.2。滑块只落在离散报告点，不做插值。表 3 与表 2 的 35.0 和 35.4 不是同一次报告。",
          "componentId": "yw-pretrain",
          "moduleId": "4.2"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "零样本有多快",
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "LVIS 上的精度和速度",
          "desc": "点选同一协议下的模型，读取它的 Fixed AP 与 FPS。",
          "componentId": "yw-lvis"
        }
      ],
      "scenes": [
        {
          "id": "lvis-zero",
          "title": "LVIS 上的精度和速度",
          "goal": "同数据比看 35.0；35.4 又是什么条件？",
          "summary": "同数据比看 35.0；35.4 是加伪标注后的点。速度都是不用 TensorRT 的 V100 FPS。",
          "interaction": "点一个模型；可另显示带伪标注的 35.4。",
          "next": "下一页看微调分割头和微调整体会怎样交换掩码与稀有框。",
          "notes": "摘要与表 2。LVIS minival、零样本、Fixed AP，最多 1000 个预测；一张 V100，无 TensorRT。YOLO-World-L 加 CC3M 伪标注为 35.4 AP、稀有类 27.6、52.0 FPS、48M。同表只用 O365 加 GoldG 的 L 是 35.0 AP，与 DetCLIP-T 34.4 / 2.3 FPS 同配可比。论文写约 20 倍加速。COCO 的 TensorRT 速度不在此图。",
          "componentId": "yw-lvis",
          "moduleId": "5.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "下游与失手",
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "微调分割时的取舍",
          "desc": "只微调分割头或微调整体，同时看掩码 AP 和框的稀有类 AP。",
          "componentId": "yw-finetune"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "三种失手与补救",
          "desc": "查看微调 CLIP、伪标注过多，以及部署后改口令这三种边界。",
          "componentId": "yw-limits"
        }
      ],
      "scenes": [
        {
          "id": "finetune-mask",
          "title": "微调分割时的取舍",
          "goal": "掩码变好时，稀有类的框会不会变差？",
          "summary": "只微调分割头能留下较高的框稀有类 AP。微调整体把掩码 AP 从 19.1 提到 28.7，框稀有类 AP 从 18.0 降到 17.4。",
          "interaction": "在两种微调范围之间切换。",
          "next": "最后一页把编码器、伪标注和离线词表的失手放回花摊上。",
          "notes": "表 8，第 8 到 10 页，YOLO-World-L，LVIS-base。掩码 AP 与框 AP 都是越高越好。主画面只讲表 8，不并列 COCO TensorRT 速度。讲稿补充：COCO 表 6 去掉 RepVL-PAN 后 53.3 AP、156 FPS（含 TensorRT），不可与表 2 的 52.0 直接比；YOLOv8-L 从零训练 52.9 AP、159 FPS；零样本 45.1 AP。",
          "componentId": "yw-finetune",
          "moduleId": "6.1"
        },
        {
          "id": "failure-repair",
          "title": "三种失手与补救",
          "goal": "开放词汇在什么条件下会退回去？",
          "summary": "微调 CLIP 会伤稀有类，过多伪标注会伤小模型的总体 AP，部署后改口则必须重新编码。",
          "interaction": "选择一种失手；在伪标注数量或重新编码上再操作一次。",
          "next": "回到封面，对比固定词表和写进权重的离线词表。",
          "notes": "表 5 与表 9，附录 B 与 C，第 3.2 节。伪标注 NMS 阈值 0.5，区域与图像置信阈值 0.3，无人工复核。改口是机制条件，不是一条新的掉点实验。PDF 出处是 arXiv:2401.17270v3，2024 年 2 月 22 日。",
          "componentId": "yw-limits",
          "moduleId": "6.2"
        }
      ]
    }
  ]
};
