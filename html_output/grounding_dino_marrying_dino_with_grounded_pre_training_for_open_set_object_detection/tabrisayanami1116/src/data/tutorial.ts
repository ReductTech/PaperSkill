import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Grounding DINO: Marrying DINO with Grounded Pre-Training for Open-Set Object Detection",
    "titleZh": "Grounding DINO：用文字在图里找物体",
    "venue": "ECCV 2024",
    "authors": "Shilong Liu、Zhaoyang Zeng、Tianhe Ren、Feng Li 等",
    "affiliation": "IDEA 研究院、清华大学等",
    "domain": "多模态视觉 · 开集目标检测",
    "coreProblem": "相机里有三个苹果，输入“红苹果”或“右边的苹果”，怎样让模型给对的那个画框？",
    "coreInsight": "让文字在特征融合、查询初始化和框的细化三个位置都参与计算，最后把每个预测框与提示词配起来。",
    "keywords": [
      "目标检测",
      "指代定位",
      "目标查询",
      "图文注意力",
      "Grounding DINO"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "固定分类表会给三个框都标上“苹果”。如果只想找红色的那个，还缺少一句能改变检测目标的描述。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "把“红苹果”与照片一起交给模型。文字线索会提前参与选择，再影响最后框和词的对应。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "三个苹果，找哪一个？",
      "badge": "inf",
      "badgeLabel": "推理",
      "bridge": "学 DETR 时，我们让模型负责找出画面里有哪些物体，再给每个物体画框。现在镜头对着三个苹果，任务改成“只找右边的苹果”。类名仍然是苹果，答案却随这句话改变。",
      "analogy": {
        "title": "用取景框圈一个苹果",
        "text": "你和朋友看到的是同一张照片。朋友说“右边那个”，你会在三个同类物体里重新挑一个。",
        "componentId": "scene-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "同一张图，三种找法",
          "desc": "切换要找的东西。左边模拟固定类别检测给出的框，右边展示按描述定位时希望得到的框。这是任务示意。",
          "componentId": "tasks"
        }
      ],
      "insight": "把描述交给模型，等于让模型在看图时知道自己正在找什么。",
      "takeaways": [
        {
          "icon": "🔎",
          "title": "类别检测",
          "desc": "输入类别名，可能要找出该类所有实例。"
        },
        {
          "icon": "📌",
          "title": "指代定位",
          "desc": "输入一段描述，利用颜色或方位选中具体物体。"
        },
        {
          "icon": "🧭",
          "title": "输出长什么样",
          "desc": "结果可以写成（框坐标，对应短语）。论文的指代评估取最高分框。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "照片和文字怎样变成向量",
      "badge": "inf",
      "badgeLabel": "推理",
      "bridge": "一张照片由像素组成，一句话由字符写成。模型需要把它们都换成向量才能比较。图像保留哪些位置有信息，句子保留哪些词提供了线索。",
      "analogy": {
        "title": "拨动相机的对焦环",
        "text": "同一颗苹果既有整体的形状，也有果梗这样的小细节。照片可以用不同大小的观察范围来表示。",
        "componentId": "scene-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "从图像位置读到词",
          "desc": "点一个位置或词，看看它对应哪条特征。小格只示意特征采样位置。Tiny 从 Swin-T 主干取三种尺度，再将最粗的特征下采样至第四种尺度。文字由 BERT 编码，两路特征都投影到 256 维。",
          "componentId": "inputs"
        }
      ],
      "insight": "一个图像 token 代表某处的视觉特征，一个文字 token 代表提示词中的一个单位。向量中保存的是模型学到的特征。",
      "takeaways": [
        {
          "icon": "🔎",
          "title": "图像分尺度",
          "desc": "细网格保留小细节，粗网格覆盖更大的范围。"
        },
        {
          "icon": "📌",
          "title": "用 token 表示文字",
          "desc": "短语可以拆成多个 token，每个 token 有自己的表示。"
        },
        {
          "icon": "🧭",
          "title": "维数与数量",
          "desc": "256 维是一个向量的长度。图像 token 数会随输入大小变化。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "一句提示里有两组词",
      "badge": "inf",
      "badgeLabel": "推理",
      "bridge": "要让模型一次找多类物体，可以把多个类别或短语写在同一个输入里。独立的类别挨在一起时，文字编码器需要知道哪里是一组。",
      "analogy": {
        "title": "在照片下插一张便签",
        "text": "“红苹果”和“绿苹果”各写一张便签。读第一张时，颜色应该和这张上的“苹果”联系起来。",
        "componentId": "scene-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "谁能读到谁",
          "desc": "切换全句互读和按组注意，再点源词。连线表示编码文本时允许读哪些词。短语之间的句号在这里当作分隔符。",
          "componentId": "phrase-mask"
        }
      ],
      "insight": "子句级文本表示给注意力加了掩码，每组保留词级细节，独立类别之间的直接连线被挡住。",
      "takeaways": [
        {
          "icon": "🔎",
          "title": "组内互读",
          "desc": "“red”可以读取同组的“apple”，组合出属性和类别。"
        },
        {
          "icon": "📌",
          "title": "组间屏蔽",
          "desc": "另一组的“green”与这组“apple”之间没有直接文本注意力。"
        },
        {
          "icon": "🧭",
          "title": "保留多个向量",
          "desc": "编码后每个词仍然有自己的特征，方便后面给框与词打分。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "文字怎样挑出查询位置",
      "badge": "both",
      "badgeLabel": "训练与推理",
      "bridge": "一张图有许多视觉位置。上次 DETR 的目标查询可以看成一组会学习的预测位置。Grounding DINO 的初始化要多回答一个问题：看见这次的文字后，先从图里哪几处查起？",
      "analogy": {
        "title": "移动相机取景框",
        "text": "拍“红苹果”时，你先看红色最明显的几处，再决定把取景框落在哪里。",
        "componentId": "scene-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "从点积到前 K 个位置",
          "desc": "三处视觉位置分别和两个词向量点乘。拖动“红”在特征轴上的分量，观察每行最高分和入选位置怎样变化。数值为二维教学算例。",
          "componentId": "ranking"
        }
      ],
      "insight": "文字可以改变初始候选位置的排名。论文按行取最大值，再沿图像位置这一维取前 K 个索引。",
      "formula": {
        "lead": "先用点积计算每个图像位置和每个文字 token 的匹配分。",
        "unicode": "S = Xᵢ Xₜᵀ   ·   rⱼ = maxₜ Sⱼₜ   ·   I = TopKₖ(r)",
        "symbols": [
          {
            "sym": "Xᵢ",
            "desc": "图像特征矩阵，形状 Nᵢ × d。"
          },
          {
            "sym": "Xₜ",
            "desc": "文字特征矩阵，形状 Nₜ × d。"
          },
          {
            "sym": "Sⱼₜ",
            "desc": "第 j 个图像位置和第 t 个词的点积。"
          },
          {
            "sym": "rⱼ",
            "desc": "该位置的最高匹配分，可正可负。"
          },
          {
            "sym": "I",
            "desc": "选中的位置索引。论文 d = 256、K = 900，算例取 d = 2、K = 2。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🔎",
          "title": "点积",
          "desc": "对应分量相乘再相加，得到一对图文特征的分数。"
        },
        {
          "icon": "📌",
          "title": "先比词，再比位置",
          "desc": "在同一行里取最大值，再给所有图像位置排序。"
        },
        {
          "icon": "🧭",
          "title": "候选位置先入场",
          "desc": "排名靠前的位置用于初始化动态锚框，仍要经过解码细化。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "一个查询如何把框画准",
      "badge": "both",
      "badgeLabel": "训练与推理",
      "bridge": "候选位置帮查询决定从哪里开始看。查询还带着一个可训练的内容向量，模型会根据图像细节和描述更新它。框在解码过程中逐步细化。",
      "analogy": {
        "title": "缩紧取景框",
        "text": "刚对到苹果时，你会多框进一圈背景。接着调整边缘，让取景框更靠近水果的轮廓。",
        "componentId": "scene-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "沿一个查询看框的变化",
          "desc": "逐步查看锚框、读取图像、读取文字、到该层输出的示意。初始锚框来自所选位置的编码器输出，内容向量是可训练参数。尺寸变化为讲解示意。",
          "componentId": "refinement"
        }
      ],
      "insight": "解码层每轮都可以参考两种信息：图像告诉它边界在哪，短语帮助它保持当前要找的对象。",
      "takeaways": [
        {
          "icon": "🔎",
          "title": "位置部分",
          "desc": "动态锚框用中心、宽和高表示初始范围。"
        },
        {
          "icon": "📌",
          "title": "内容部分",
          "desc": "可学习的内容查询在解码中被更新。"
        },
        {
          "icon": "🧭",
          "title": "六层细化",
          "desc": "每层有查询自注意力、图像交叉注意力、文本交叉注意力和前馈网络。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "框阈值与文字阈值",
      "badge": "inf",
      "badgeLabel": "推理",
      "bridge": "Tiny 对每个查询输出一组 token 分数和一个框。实际使用时，还要决定框要不要留下、留下的框标上哪几个词。",
      "analogy": {
        "title": "调到看得清的位置",
        "text": "调亮照片时，有些细节刚好越过你能辨认的门槛。换一条门槛，能留下来的部分也会变。",
        "componentId": "scene-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "动两个门槛，读一次推理",
          "desc": "使用“红苹果. 绿苹果.”的真实 Tiny 输出。调框阈值看哪些框留下，再调文字阈值看最高分框上各词是否达标。照片与模型输出固定。",
          "componentId": "thresholds"
        }
      ],
      "insight": "框分数取 token 分数里的最大值。用文字阈值解码短语的步骤发生在前向计算之后。",
      "formula": {
        "lead": "把每个 token 的 logit 压到 0 和 1 之间，获得用于筛选的分数。",
        "unicode": "pⱼₜ = σ(zⱼₜ)   ·   boxScoreⱼ = maxₜ pⱼₜ",
        "symbols": [
          {
            "sym": "zⱼₜ",
            "desc": "查询 j 对 token t 的原始得分。"
          },
          {
            "sym": "σ",
            "desc": "sigmoid，逐项计算 1/(1+exp(−z))。"
          },
          {
            "sym": "pⱼₜ",
            "desc": "查找词的分数，多个词可以同时得高分。"
          },
          {
            "sym": "boxScoreⱼ",
            "desc": "查询最高 token 分数，超过框阈值才显示。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🔎",
          "title": "框先筛选",
          "desc": "太低会保留更多低分框。"
        },
        {
          "icon": "📌",
          "title": "再读标签",
          "desc": "提高文字阈值可缩短短语，甚至出现框留下而词为空。"
        },
        {
          "icon": "🧭",
          "title": "分数用来排序",
          "desc": "图上的人工标注提供位置核对。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "训练时谁该配给谁",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "两颗苹果对应同一句类别名时，预测框顺序可以交换。训练先找预测与标注的一一对应，再让配中的框贴边，并让对应的提示词得分更高。",
      "analogy": {
        "title": "把照片夹进对应的相格",
        "text": "桌上有两张照片和两个相格。给它们配对时，要看整组怎么放更合适，不能每张都去抢同一个相格。",
        "componentId": "scene-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "试两种一一配对",
          "desc": "切换两种配法，比较四格配对成本。数值为课堂例子，成本越小越容易配上。论文先用匈牙利匹配找到整组最低成本，再给配中的查询计算训练监督。",
          "componentId": "matching"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "给对应词打高分",
          "desc": "切换“绿色”词的 logit，观察它作为正例时的 focal loss。三项框与词的总权重取自论文 §4.1。这一格只演示单个词的分类项。",
          "componentId": "token-loss"
        }
      ],
      "insight": "分类监督落在提示词中的 token 上。真实框和相应的词需要预先在训练样本中建立对应。",
      "formula": {
        "lead": "总损失同时考虑词的匹配和框的几何误差。",
        "unicode": "L = 1·L词 + 5·L₁ + 2·Lᴳᴵᵒᵁ",
        "symbols": [
          {
            "sym": "L词",
            "desc": "查询对文字 token 的 focal loss。"
          },
          {
            "sym": "L₁",
            "desc": "预测框与标注框相应坐标的绝对误差。"
          },
          {
            "sym": "Lᴳᴵᵒᵁ",
            "desc": "基于广义交并比的框损失。"
          },
          {
            "sym": "L",
            "desc": "论文 §4.1 的最终损失加权，示意主项，训练另有辅助监督。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🔎",
          "title": "匹配成本",
          "desc": "词、框 L1、GIoU 的匹配权重为 2、5、2。"
        },
        {
          "icon": "📌",
          "title": "最终训练损失",
          "desc": "同三种成分的最终权重为 1、5、2。"
        },
        {
          "icon": "🧭",
          "title": "数据提供对应",
          "desc": "检测数据给框及类别，短语定位与带字幕图文扩展词和物体的覆盖。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "把图文相遇的三处连起来",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "现在把特征、查询和解码接起来。Grounding DINO 沿用 DINO 检测器的主线，在特征增强、查询选择和解码细化三个位置注入文字线索。",
      "analogy": {
        "title": "翻开带便签的相册",
        "text": "一张照片和它的说明同时到手。你可以来回查看照片里的细节和描述里的词。",
        "componentId": "scene-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点亮从图文到框的路径",
          "desc": "点图中的组件，观察当前输入、输出与走过的路线。模型是双编码器、单解码器。增强器中图文可双向读取，解码查询中还有单独的文字交叉注意力。",
          "componentId": "architecture"
        }
      ],
      "insight": "在已有 DETR 知识里，可以把增强器看成提前互通线索，把查询选取看成找起点，把解码看成不断缩紧和改判。",
      "takeaways": [
        {
          "icon": "🔎",
          "title": "特征增强",
          "desc": "图像自注意力、文本自注意力和双向跨模态注意力。"
        },
        {
          "icon": "📌",
          "title": "语言引导查询",
          "desc": "提取相关图像位置，给解码器初始化锚框。"
        },
        {
          "icon": "🧭",
          "title": "跨模态解码",
          "desc": "查询读取两路特征，输出框及各 token 的匹配分。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "实测：换词以后框到了谁",
      "badge": "inf",
      "badgeLabel": "推理",
      "bridge": "同一张照片固定下来，只换提示词，可以看到模型输出怎样改变。双人合影再左右翻转一次，检查朝向提示能否跟着画面改变。",
      "analogy": {
        "title": "翻转照片比较位置",
        "text": "照片左右翻过来之后，原先站在左边的人到了右边。文字里的“左边”仍然以画面为准。",
        "componentId": "scene-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "拿真实输出对照人工框",
          "desc": "切换照片与提示。实线是模型框，虚线是本次描述对应的人工框。框阈值 0.35、文字阈值 0.25。配对按分数降序贪心匹配，IoU 至少 0.50；多余框和遗漏均计入。",
          "componentId": "photo-lab"
        }
      ],
      "insight": "最高分有时落在另一位人物上。颜色提示、方位提示和不存在的物体要分开看，能在框的位置上直接核对。",
      "takeaways": [
        {
          "icon": "🔎",
          "title": "照片来源",
          "desc": "合影由 NASA／Robert Markowitz 拍摄，苹果照来自 Pexels 上的 Pixabay。"
        },
        {
          "icon": "📌",
          "title": "实验口径",
          "desc": "公开 Tiny 权重在两张真实照片和一张镜像上做 14 次 CPU 推理。"
        },
        {
          "icon": "🧭",
          "title": "复核入口",
          "desc": "每次的提示、手工框和 900 个查询的原始输出保存在项目 experiments/。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "怎样读论文的成绩",
      "badge": "both",
      "badgeLabel": "训练与推理",
      "bridge": "论文同时考察模型能否迁移到新的数据集，以及能不能按一句话选中某个物体。AP 衡量一组检测在不同精确率／召回率下的表现，指代任务的 Top-1 则核对模型交出的首选框。",
      "analogy": {
        "title": "在相册上对照印样",
        "text": "把两张同样冲印规格的照片放进相邻相格，比较细节才有共同依据。",
        "componentId": "scene-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "按评测任务比较成绩",
          "desc": "切换 COCO、LVIS 消融、ODinW 和 RefCOCO。每次只在选定协议下看同一条坐标轴。按“展开对比”让各分数从同一个零点出发。",
          "componentId": "paper-results"
        }
      ],
      "insight": "结果要和训练数据、模型体量和评测口径放在一起读。表 7 的消融最适合观察一个组件的贡献。",
      "takeaways": [
        {
          "icon": "🔎",
          "title": "COCO 零样本迁移",
          "desc": "更大型的 Swin-L 版本在 COCO val2017 得到 52.5 AP，见表 2 的训练配置。"
        },
        {
          "icon": "📌",
          "title": "LVIS 消融",
          "desc": "表 7 中，去掉编码器融合后 LVIS minival AP 由 16.1 降至 13.1。"
        },
        {
          "icon": "🧭",
          "title": "定位还有边界",
          "desc": "论文报告指代表达可能返回多个目标，且存在误报。输出框描述物体的外接范围。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1rjgBzHEBW",
      "title": "一节课搞懂 Grounding DINO",
      "reason": "结构、训练方法和代码演示。",
      "cover": "https://i0.hdslb.com/bfs/archive/d379149435ea7289d1c3aab13745e5395e5adbb2.jpg",
      "views": "1.4万播放"
    },
    {
      "bvid": "BV1kY8zeUEAX",
      "title": "Transformer DINO 和 Grounding DINO 讲解",
      "reason": "从 DINO 复习接到语言引导检测。",
      "cover": "https://i1.hdslb.com/bfs/archive/4cbf594dc4712369bfbf30c76c182f05d88f4869.jpg",
      "views": "5689播放"
    },
    {
      "bvid": "BV1Mk4y1F7cp",
      "title": "迈向更强的开集目标检测",
      "reason": "介绍 Grounding DINO 及开集检测的研究脉络。",
      "cover": "https://i1.hdslb.com/bfs/archive/527e04ce2405a8b4bdf6fe500e641599ec969c07.jpg",
      "views": "9123播放"
    }
  ]
};
