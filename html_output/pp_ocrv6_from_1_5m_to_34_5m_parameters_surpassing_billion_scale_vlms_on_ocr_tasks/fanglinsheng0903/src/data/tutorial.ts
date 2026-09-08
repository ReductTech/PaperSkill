import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "PP-OCRv6",
    "titleZh": "从 150 万到 3450 万参数：轻量专用 OCR 如何超越十亿级 VLM",
    "venue": "arXiv · 2026",
    "authors": "Yubo Zhang, Xueqing Wang, Manhui Lin, Yue Zhang, Penglongyi Deng, Ting Sun, Tingquan Gao, Zelun Zhang, Jiaxuan Liu, Changda Zhou, Hongen Liu, Suyin Liang, Cheng Cui, Yi Liu, Dianhai Yu, Yanjun Ma",
    "affiliation": "PaddlePaddle Team, Baidu Inc.",
    "domain": "场景文本检测 · 文本识别 · 轻量网络 · 结构重参数化",
    "coreProblem": "生产 OCR 不只要求“读得像”，还要求<b>框得准、抄得真、跑得快</b>。通用 VLM 的语言先验和巨大计算量未必适合这组目标。",
    "coreInsight": "PP-OCRv6 以统一、可缩放的 LCNetV4 为骨干，针对文本检测与识别分别设计轻量化模块，并结合训练期辅助监督和继承自 PP-OCRv5 的数据优化，在专用 OCR 任务上兼顾检测/识别精度、低幻觉与部署效率。",
    "keywords": [
      "LCNetV4",
      "轻量 OCR",
      "检测 + 识别",
      "1.5M–34.5M"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "通用 VLM 可能给出<b>通顺但改写过</b>的文字，定位框也不够贴合。",
      componentId: "hero-old"
    },
    "newMethod": {
      "desc": "PP-OCRv6 以视觉证据为中心：<b>精确框选，忠实转录</b>。",
      componentId: "hero-new"
    }
  },
  "chapters": [
    {
      kind: "chapter",
      "id": "chap-1",
      "title": "OCR 任务：从图像到可用文字",
      "shortTitle": "OCR 任务",
      "badge": "inf",
      "badgeLabel": "任务入门",
      "bridgeIcon": "scan-text",
      "bridge": "在比较专用 OCR 与通用 VLM 之前，先明确 OCR 的基本目标：找到图像中的文字，把视觉符号忠实转换为可检索、可复制、可校验的文本。",
      "analogy": {
        "title": "先圈位置，再抄内容",
        "text": "OCR 是 Optical Character Recognition，即光学字符识别。典型场景文本系统通常先回答<b>文字在哪里</b>，再回答<b>文字是什么</b>；复杂文档还会继续恢复版面与结构。",
        componentId: "ppocrv6-ocr-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "1.1",
          "title": "选择文字，让 OCR 扫描并输出",
          "desc": "选择票据、招牌或包装上的文字，观察检测框如何确定位置，识别结果又如何按阅读顺序逐字出现。",
          componentId: "ppocrv6-ocr-scan"
        },
        {
          kind: "module",
          "id": "1.2",
          "title": "近期 OCR 代表性研究路线",
          "desc": "点击查看 2024–2026 年代表工作的关注重点。列表同时包含专用 OCR、统一端到端模型和文档视觉语言模型，不把不同协议混成同一性能榜单。",
          componentId: "ppocrv6-ocr-research"
        }
      ],
      "insight": "OCR 不只是把整张图“看懂”：定位、字符转录、阅读顺序和文档结构可以是不同层级的任务，模型路线取决于实际需要的输出。",
      "takeaways": [
        {
          "icon": "image",
          "title": "输入",
          "desc": "照片、扫描件、票据、招牌和复杂文档都可能包含待读取文字。"
        },
        {
          "icon": "workflow",
          "title": "过程",
          "desc": "常见流程把文字检测与文字识别连接起来。"
        },
        {
          "icon": "file-check",
          "title": "输出",
          "desc": "结果必须忠实、可定位，并能进入搜索、录入或审核流程。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-2",
      "title": "为什么还需要专用 OCR",
      "shortTitle": "专用 OCR",
      "badge": "inf",
      "badgeLabel": "推理基础",
      "bridgeIcon": "eye-check",
      "bridge": "上一节说明了 OCR 要找到文字并读出原字。本节先核验一个“合理但错误”的答案，再亲手削弱视觉证据，观察定位、裁剪和识别为什么会依次变得不稳定。",
      "analogy": {
        "title": "核验不是猜词",
        "text": "这里只回答一个问题：为什么看起来更合理的答案，仍可能是错误 OCR？先预测输出，再把字符与图像逐位对齐，亲自确认<b>合理不等于忠实</b>。",
        componentId: "ana-1"
      },
      "modules": [
        {
          kind: "module",
          "id": "2.1",
          "title": "把任务推到难处",
          "desc": "沿用同一个 TEH 2026 教学样例。先用一条教学压力滑块直接破坏画面中的定位与字符证据，再按需展开 crop margin、分辨率和场景变量；交互阈值与状态均不是论文指标。",
          componentId: "ppocrv6-ch1-stress"
        }
      ],
      "insight": "既然 OCR 同时要知道文字“在哪里”和“是什么”，下一页就要继续追问：为什么这两件事需要不同形状的空间表示？",
      "takeaways": [
        {
          "icon": "target",
          "title": "目标",
          "desc": "忠实恢复图像中的文字。"
        },
        {
          "icon": "alert",
          "title": "风险",
          "desc": "定位误差和语言先验都可能改变结果。"
        },
        {
          "icon": "eye-check",
          "title": "结论",
          "desc": "“读起来合理”不能替代“与图像一致”。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-3",
      "title": "一张图，为何要两种表示",
      "shortTitle": "两种表示",
      "badge": "inf",
      "badgeLabel": "推理基础",
      "bridgeIcon": "split-panels",
      "bridge": "上一节说明了 OCR 为什么必须“找准、读真”。这一节继续追问：既然检测和识别处理的是同一段文字，为什么网络还要保留两种不同形状的空间表示？",
      "analogy": {
        "title": "先看一遍：从完整页面到文字序列",
        "text": "先只跟随同一个文字区域，看它怎样经过 <b>Detection → Crop &amp; Resize → Recognition</b>；具体的 stride 差异留到 3.2 再揭晓。",
        componentId: "ppocrv6-ch2-pipeline-intro"
      },
      "modules": [
        {
          kind: "module",
          "id": "3.1",
          "title": "拖动检测框，看看识别模型最终拿到什么",
          "desc": "直接移动 Detection Box 或调整两侧边缘，观察实际 crop、W_in、W_feat 与横向 sequence 如何沿同一条因果链变化；右侧二维金字塔来自完整页面，整体尺寸不会随 bbox 改变。",
          componentId: "ppocrv6-ch2-representation"
        },
        {
          kind: "module",
          "id": "3.2",
          "title": "检测要“地图”，识别要“长条”",
          "desc": "同一张文字图，为什么 Detection 可以不断缩小空间，而 Recognition 必须保住横向顺序？先选择 feature map 的压缩方式，再从视觉结果理解 task-specific stride。",
          componentId: "ppocrv6-ch2-stride"
        }
      ],
      "takeaways": [
        {
          "icon": "scan-search",
          "title": "检测",
          "desc": "保留二维空间关系，回答文字在哪里。"
        },
        {
          "icon": "text-line",
          "title": "识别",
          "desc": "保住横向顺序，从左到右读取字符。"
        },
        {
          "icon": "layers",
          "title": "统一",
          "desc": "不换骨干，只采用任务特定的 stride。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-4",
      "title": "LCNetV4：先拆职责，再统一骨干",
      "shortTitle": "统一骨干",
      "badge": "inf",
      "badgeLabel": "推理基础",
      "bridgeIcon": "layers",
      "bridge": "上一节已经看到，同一种 LCNetV4 可以通过不同 stride 输出二维检测特征或横向识别序列。现在继续往 block 内部看：为什么同一种基本块能够同时成为两种任务的共同骨架？关键不是把所有操作堆进一条链，而是先把不同职责拆开。",
      "analogy": {
        "title": "一条链，拆成两种职责",
        "text": "与其把所有操作串成一条链，不如先明确空间和通道分别负责什么。LCNetV4 将它们拆成 <b>Token Mixer</b> 与 <b>Channel Mixer</b>。",
        componentId: "ana-3"
      },
      "modules": [
        {
          kind: "module",
          "id": "4.1",
          "title": "同一个 Tensor，两种观察方式",
          "desc": "在同一个 C × H × W feature tensor 上切换空间与通道视角：固定 channel 观察 H×W 的邻域关系，或固定位置观察 C 个通道如何重新组合。",
          componentId: "ppocrv6-ch3-mixers"
        },
        {
          kind: "module",
          "id": "4.2",
          "title": "拆开之后，得到了什么？",
          "desc": "职责分离带来三个直接结果：空间与通道可以分别优化，结构重参数化可以定向作用于 Token Mixer，同一种 block primitive 也更容易统一任务并按 depth / width 缩放。",
          componentId: "ppocrv6-ch3-benefits"
        }
      ],
      "takeaways": [
        {
          "icon": "grid",
          "title": "空间",
          "desc": "Token Mixer 处理位置关系。"
        },
        {
          "icon": "channels",
          "title": "通道",
          "desc": "Channel Mixer 组合通道特征。"
        },
        {
          "icon": "scale",
          "title": "价值",
          "desc": "职责拆开后可以分别优化与缩放。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-5",
      "title": "训练多分支，部署单分支",
      "shortTitle": "结构重参",
      "badge": "both",
      "badgeLabel": "训练与推理",
      "bridgeIcon": "merge",
      "bridge": "上一节把空间混合和通道混合拆开之后，空间 Token Mixer 可以单独做进一步优化。问题是：怎样让训练时的空间分支更丰富，却不让部署结构变复杂？RepDWConv 的答案不是保留更多推理分支，而是在部署前把它们变成一个等价卷积。",
      "analogy": {
        "title": "训练走三条路，部署只走一条路",
        "text": "训练时让 3×3 DW、1×1 DW 和 Identity 三条路径共同学习；部署前做一次等价变换，把它们折叠成一个普通的 <b>3×3 DWConv</b>。",
        componentId: "ana-4"
      },
      "modules": [
        {
          kind: "module",
          "id": "5.1",
          "title": "把三条训练路径折成一个 3×3 DWConv",
          "desc": "沿同一个固定计算图完成训练图、等价化、参数合并和推理图四个阶段；随时验证融合前后的 Input → Output 函数关系为什么保持等价。",
          componentId: "ppocrv6-ch4-fusion"
        },
        {
          kind: "module",
          "id": "5.2",
          "title": "多分支很好，为什么不全都用？",
          "desc": "RepDWConv 可以丰富训练分支，再在部署前融合。现在站在论文作者的位置做一次选择：这项升级应该给负责空间的 Token Mixer，还是负责通道的 Channel Mixer？",
          componentId: "ppocrv6-ch4-reparam-scope"
        }
      ],
      "takeaways": []
    },
    {
      kind: "chapter",
      "id": "chap-6",
      "title": "检测：看得更广，也学得更细",
      "shortTitle": "文本检测",
      "badge": "both",
      "badgeLabel": "训练与推理",
      "bridgeIcon": "scan-search",
      "bridge": "检测文字不只是判断“这里像不像文字”。既要利用更大范围的上下文，也要让困难像素和中间层得到足够监督。本节只回答一个问题：为什么检测需要既看得更广，又学得更细？",
      "analogy": {
        "title": "同一个位置，多看一圈上下文",
        "text": "局部窗口太小时，模型看到的可能只是单个笔画；扩大 refinement 的局部感受野后，同一位置可以同时参考更多字符、字符关系和周边背景。",
        componentId: "ppocrv6-compact-detection-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "6.1",
          "title": "3×3 → 7×7：检测为什么需要更大的视野？",
          "desc": "切换 3×3 与 7×7，观察同一个 feature point 能利用多少局部上下文；另外两项检测改进以训练提示卡呈现。",
          componentId: "ppocrv6-compact-detection"
        }
      ],
      "takeaways": []
    },
    {
      kind: "chapter",
      "id": "chap-7",
      "title": "识别：先看局部，再看全行",
      "shortTitle": "文本识别",
      "badge": "inf",
      "badgeLabel": "推理基础",
      "bridgeIcon": "text-line",
      "bridge": "检测已经找到文字区域，接下来要把一行视觉特征读成字符。读一个字符时，为什么既要看邻近字符，又要理解整行文字？PP-OCRv6 的识别思路可以概括为 local first，global next。",
      "analogy": {
        "title": "先看邻近笔画，再联系整行语境",
        "text": "相邻位置提供边界、间距和局部形状，整行关系帮助消歧。识别模块先聚合局部横向上下文，再建立全局依赖。",
        componentId: "ana-6"
      },
      "modules": [
        {
          kind: "module",
          "id": "7.1",
          "title": "Local → Global：读一个字符要看多远？",
          "desc": "点击字符并在“看附近 / 看整行”之间切换，直观看见 1×7 DWConv 与 Transformer 的职责分工。",
          componentId: "ppocrv6-compact-recognition"
        }
      ],
      "takeaways": []
    },
    {
      kind: "chapter",
      "id": "chap-8",
      "title": "训练可以复杂，推理必须简单",
      "shortTitle": "训练与部署",
      "badge": "both",
      "badgeLabel": "训练与推理",
      "bridgeIcon": "signals",
      "bridge": "§5–§7 已经出现多分支、辅助监督和额外 Head。它们会不会让线上模型越来越重？本节不再介绍新结构，只用 Training / Inference 两个视图总结论文贯穿始终的设计选择。",
      "analogy": {
        "title": "训练时可以多给帮助，部署时只留下学生本身",
        "text": "多分支、辅助 Head 和 Teacher 服务于<b>怎样学</b>；导出后，能融合的结构被融合，只服务训练的结构被删除。",
        componentId: "ana-7"
      },
      "modules": [
        {
          kind: "module",
          "id": "8.1",
          "title": "Training / Inference：哪些结构会留到部署？",
          "desc": "切换训练与推理视图，观察 RepDWConv 分支如何融合，以及 Auxiliary Heads、NRTR Head 和 Tiny Teacher 如何从部署图中消失。",
          componentId: "ppocrv6-compact-training"
        }
      ],
      "takeaways": []
    },
    {
      kind: "chapter",
      "id": "chap-9",
      "title": "同一种设计，三档模型",
      "shortTitle": "三档系统",
      "badge": "trn",
      "badgeLabel": "模型族",
      "bridgeIcon": "boxes",
      "bridge": "训练与部署已经解耦，下一步是把同一套设计放到不同设备上。Tiny、Small、Medium 不是重新发明三套网络，而是用共同的 LCNetV4 block primitive 组合出不同 depth / width。",
      "analogy": {
        "title": "积木相同，堆叠的深度和宽度不同",
        "text": "三档模型共享 LCNetV4 block primitive，通过不同 <b>depth / width configuration</b> 覆盖从资源受限设备到服务器的部署需求。",
        componentId: "ana-8"
      },
      "modules": [
        {
          kind: "module",
          "id": "9.1",
          "title": "Tiny / Small / Medium：同一种设计怎样缩放？",
          "desc": "切换三档模型，只观察 depth 与 width 两个视觉维度如何变化，并始终保持同一个 LCNetV4Block 基元。",
          componentId: "ppocrv6-compact-scaling"
        }
      ],
      "takeaways": []
    },
    {
      kind: "chapter",
      "id": "chap-10",
      "title": "结果、边界与延伸学习",
      "shortTitle": "结果边界",
      "badge": "both",
      "badgeLabel": "实验与复盘",
      "bridgeIcon": "chart",
      "bridge": "前面我们已经知道模型怎么工作。最后不再添加新模块，而是回到论文实验：哪些结论被数据支持、这些数字有什么边界，以及下一步可以继续读什么。",
      "analogy": {
        "title": "数字很好看，但要先问：它证明了什么？",
        "text": "同一个模型可能在准确率、忠实性、鲁棒性和速度上表现不同。最后一页把这些证据放到一起，同时标清 <b>benchmark、硬件和模型配置</b>，避免只记住一个最高分。",
        componentId: "ppocrv6-final-intro"
      },
      "modules": [
        {
          kind: "module",
          "id": "10.1",
          "title": "论文到底证明了什么？",
          "desc": "在同一个结果舞台中切换检测、识别、忠实性、鲁棒性与效率。每个数字都同时标出指标、模型档位、benchmark 或硬件协议。",
          componentId: "ppocrv6-final-evidence"
        },
        {
          kind: "module",
          "id": "10.2",
          "title": "数字应该怎样读？",
          "desc": "先确认在哪测、指标方向是什么，再检查硬件、后端、输入和测量协议是否一致。",
          componentId: "ppocrv6-final-reading-guide"
        },
        {
          kind: "module",
          "id": "10.3",
          "title": "这些结果还不能告诉我们什么？",
          "desc": "把自建 benchmark、模型档位与部署环境三类边界单独列出，避免把局部证据扩大成无条件结论。",
          componentId: "ppocrv6-final-boundaries"
        },
        {
          kind: "module",
          "id": "10.4",
          "title": "延伸学习：从 PP-OCR v1 到 v6",
          "desc": "沿时间线查看 PP-OCR 系列从实用轻量系统、训练技巧、SVTR / LK-PAN 到数据优化与统一可缩放架构的演进。",
          componentId: "ppocrv6-series"
        }
      ],
      "insight": "PP-OCRv6 证明的是：在论文给定的 OCR benchmark、模型档位与部署协议下，专用轻量系统可以同时取得强检测、强识别、较高忠实性和有竞争力的效率；它不是“任何条件下全面胜出”的总排名。",
      "takeaways": [
        {
          "icon": "chart",
          "title": "结果",
          "desc": "PP-OCRv6 在论文多个 OCR 指标上取得提升。"
        },
        {
          "icon": "scale",
          "title": "边界",
          "desc": "数字属于特定 benchmark、模型档位与硬件协议。"
        },
        {
          "icon": "evidence",
          "title": "结论",
          "desc": "论文支持强 OCR 专用系统，而非无条件的全面胜出。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      bvid: "BV1WTJ56YEuD",
      "title": "PP-OCRv6 全场景实测与本地部署",
      "reason": "覆盖模型效果、部署与 PaddleOCR-VL 对比。",
      "cover": "https://i2.hdslb.com/bfs/archive/f796caaf299cc6dbc60d32f643670d8005712cb1.jpg",
      "views": "4647播放"
    },
    {
      bvid: "BV1BBjP6DEB6",
      "title": "PP-OCRv6 正式发布与 Tiny 实测",
      "reason": "展示轻量档位和 AI 工作流接入。",
      "cover": "https://i2.hdslb.com/bfs/archive/9fb6029467bf94fa6cef88e433464eabe1511668.jpg",
      "views": "5997播放"
    }
  ]
};
