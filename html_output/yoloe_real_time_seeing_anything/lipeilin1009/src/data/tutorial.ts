import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "YOLOE: Real-Time Seeing Anything",
    "titleZh": "YOLOE：实时看见万物",
    "venue": "arXiv:2503.07465v2 · 2025",
    "authors": "Ao Wang, Lihao Liu, Hui Chen, Zijia Lin, Jungong Han, Guiguang Ding",
    "affiliation": "清华大学软件学院 / BNRist / 自动化系（THU-MIG）",
    "domain": "计算机视觉 · 开放词汇目标检测与分割",
    "coreProblem": "闭集 YOLO 只能识别预定义类别；已有开放提示方法在文本、视觉、无提示三条路线上分别付出计算、部署或语言模型依赖的代价。",
    "coreInsight": "把分类改写成锚点嵌入与提示嵌入的对比，用 RepRTA、SAVPE、LRPC 三种策略在单一高效模型里统一文本、视觉、无提示三种开放提示。",
    "keywords": [
      "开放词汇检测",
      "提示嵌入",
      "重参数化",
      "视觉提示",
      "懒检索",
      "零样本"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "闭集检测器：类别表在训练时写死。图鉴之外的新鸟一一飞过，翻遍 80 页也叫不出名字。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "YOLOE：文本、视觉、无提示三种方式亮出对应卡片，同一双眼睛把每只鸟认出并挂上名牌。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "类别墙：检测器的图鉴困境",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "我们熟悉的 YOLO 检测器又快又准，但它只能认出训练表里的那些类。本节先亲手体验这堵“类别墙”，再走一遍 YOLOE 的破局四步。",
      "analogy": {
        "title": "图鉴里没有的那只鸟",
        "text": "老图鉴只收录 <b>80</b> 种鸟。飞来的鸟再多，只要图鉴里没有，你就永远叫不出它的名字——这就是闭集检测器的日常。",
        "componentId": "ana-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "亲手体验：类别墙有多硬",
          "desc": "拖动滑块增加“未收录新物种”，看闭集检测的认出率如何变化；再换上会学习的图鉴对比。",
          "componentId": "m1-1"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "YOLOE 的看见循环：四步走一遍",
          "desc": "点击步进，把“提示→嵌入→对比→标签”四步循环完整走一遍，建立全教程的地图。",
          "componentId": "m1-2"
        }
      ],
      "insight": "问题不是“看不看得见”，而是“叫不叫得出”——把写死的类别表换成一张可以临时填写的卡片，同一双眼睛就能看见任何东西。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "闭集困境",
          "desc": "类别表写死在训练里，新类别永远认不出（论文 §1）。"
        },
        {
          "icon": "🔧",
          "title": "核心思路",
          "desc": "把分类器换成“提示嵌入的对比”，类别数不再固定。"
        },
        {
          "icon": "✨",
          "title": "一模型三提示",
          "desc": "文本、视觉、无提示，YOLOE 一个模型全支持。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "把提示翻译成模型懂的语言",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "上一节说要把类别表换成“临时卡片”。这张卡片在模型里长什么样？本节看文字如何变成嵌入向量。",
      "analogy": {
        "title": "把描述抄成卡片",
        "text": "听到“白头顶、红喙”，你会先记成笔记。模型也一样：先把文字提示<b>翻译</b>成一串数字——嵌入向量，之后全靠它对照。",
        "componentId": "ana-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "嵌入空间探秘：语义就是距离",
          "desc": "在二维嵌入空间里拖动“麻雀”词卡：和谁靠得近，就和谁语义更像。图：论文的自定义文本提示效果（Fig. 4b）。",
          "componentId": "m2-1",
          "figure": "./images/fig-text.png"
        }
      ],
      "formula": {
        "lead": "文本提示先被预训练文本编码器翻译成嵌入向量：",
        "unicode": "P = TextEncoder(T)，并做归一化",
        "symbols": [
          {
            "sym": "T",
            "desc": "长度为 C 的文本提示（如 1203 个 LVIS 类别名）"
          },
          {
            "sym": "P",
            "desc": "归一化提示嵌入，形状 C×D，后续充当“分类权重”"
          },
          {
            "sym": "TextEncoder",
            "desc": "预训练 CLIP 文本编码器（论文用 MobileCLIP-B(LT)，训练前缓存、随后移除）"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "语义即位置",
          "desc": "嵌入空间把“像不像”变成“近不近”。"
        },
        {
          "icon": "🔧",
          "title": "提前缓存",
          "desc": "全部文本嵌入训练前算好，训练不再调用文本编码器，零额外成本（§3.2）。"
        },
        {
          "icon": "✨",
          "title": "提示可任意",
          "desc": "任何能写成文字的类别都能变成一张“卡片”。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "关键一跃：分类就是对照卡片",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "卡片有了，怎么用它认出一只鸟？本节完成全文最关键的一跃：把分类改写成嵌入对比。",
      "analogy": {
        "title": "哪只更像，谁就得名",
        "text": "认出一只鸟，就是把它的样子和卡片<b>逐一对照</b>，最像的那张卡片就是它的名字——分类，本质是一次比对。",
        "componentId": "ana-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "新旧对照：固定分类器 vs 嵌入对比",
          "desc": "同一个开始按钮，同步看旧分类器与新嵌入对比在遇到新物种时的分水岭。",
          "componentId": "m3-1"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "亲手对上：锚点向量与提示向量",
          "desc": "拖拽蓝色锚点向量靠近或远离绿色提示向量，亲手感受点积分数与阈值命中。",
          "componentId": "m3-2"
        }
      ],
      "formula": {
        "lead": "整张图的分类结果，就是所有锚点与所有提示两两比对的一张分数表：",
        "unicode": "Label = O · Pᵀ : Rᴺˣᴰ × Rᴰˣᶜ → Rᴺˣᶜ",
        "symbols": [
          {
            "sym": "O",
            "desc": "锚点物体嵌入，N×D，每行一个锚点的特征"
          },
          {
            "sym": "P",
            "desc": "提示嵌入，C×D，每行一个类别的“卡片”"
          },
          {
            "sym": "N",
            "desc": "锚点数量（如 8400）"
          },
          {
            "sym": "C",
            "desc": "提示数量（闭集 80 → 开放任意，如 LVIS 1203）"
          },
          {
            "sym": "D",
            "desc": "嵌入维度"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "分类=对比",
          "desc": "把权重换成提示嵌入，类别就成了输入而非参数（Eq.1）。"
        },
        {
          "icon": "🔧",
          "title": "分数即相似度",
          "desc": "点积高低决定命名，阈值把关。"
        },
        {
          "icon": "✨",
          "title": "一箭双雕",
          "desc": "同一机制同时服务文本、视觉、无提示三条路线。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "RepRTA：训练请家教，出师零负担",
      "badge": "both",
      "badgeLabel": "基础+进阶",
      "bridge": "卡片质量决定识别上限。本节看 YOLOE 如何在训练时把卡片改得更好——而且推理时一分钱不多花。",
      "analogy": {
        "title": "把笔记烙进图鉴",
        "text": "练习时可以带小笔记本增补心得；真正出门时，心得已经<b>贴进图鉴</b>——不多带一件东西，却看得更准。",
        "componentId": "ana-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "重参数化三步走：训练→合并→推理",
          "desc": "三步看清辅助网络 f_θ 从登场、合并到消失——重参数化的全过程。",
          "componentId": "m4-1"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "对齐值多少：路线图里的 RepRTA",
          "desc": "三枚芯片切换路线图三档，看 RepRTA 如何在 FPS 不变时抬升 AP，尤其是罕见类（数据来自论文 Tab 5）。",
          "componentId": "m4-2"
        }
      ],
      "insight": "训练时的小网络不是为了带上路，而是为了在出门前“烙”进分类器——增强，从此免费。",
      "formula": {
        "lead": "训练结束后，辅助网络被折算进分类头最后一层卷积核：",
        "unicode": "K′ = R(f_θ(P)) ⊛ Kᵀ，之后 Label = I ⊛ K′",
        "symbols": [
          {
            "sym": "f_θ",
            "desc": "轻量辅助网络（仅一个 SwiGLU 前馈块），θ 为其可训练参数"
          },
          {
            "sym": "K",
            "desc": "物体嵌入头最后 1×1 卷积核，形状 D×D′×1×1"
          },
          {
            "sym": "K′",
            "desc": "重参数化后的卷积核，形状 C×D′×1×1"
          },
          {
            "sym": "⊛, R",
            "desc": "卷积算子与形状重整函数"
          },
          {
            "sym": "I",
            "desc": "嵌入头输入特征，D′×H×W"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "训练增强、推理免费",
          "desc": "f_θ 只在训练存在，推理时并入卷积核（Eq.3）。"
        },
        {
          "icon": "🔧",
          "title": "小网络大收益",
          "desc": "一个 SwiGLU 块换来 +2.3 AP，罕见类 +9.3 APr（Tab 5）。"
        },
        {
          "icon": "✨",
          "title": "迁移友好",
          "desc": "重参数化后结构与普通 YOLO 一致，下游零适配成本（§4.4）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "SAVPE：看一眼照片，找到同一类",
      "badge": "both",
      "badgeLabel": "基础+进阶",
      "bridge": "文字能描述的都好办，说不清楚的怎么办？本节引入视觉提示，以及它的双支路编码器 SAVPE。",
      "analogy": {
        "title": "照“片”寻鸟",
        "text": "有些鸟学名拗口，不如说“就长这样”。给模型<b>看一眼照片</b>，它就能在图里找出所有同类——这就是视觉提示。",
        "componentId": "ana-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "三种提示方式：什么时候用哪种",
          "desc": "切换文本、视觉、无提示三种方式，弄清各自最擅长的场景。图：论文的视觉提示效果（Fig. 4c，红虚线框为线索）。",
          "componentId": "m5-1",
          "figure": "./images/fig-visual.png"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "双支路探秘：内容归内容，位置归位置",
          "desc": "点击语义分支、激活分支与聚合，拆解 SAVPE 的双支路低维设计。",
          "componentId": "m5-2"
        }
      ],
      "insight": "视觉提示的秘密在于分工：一条支路回答“是什么”，另一条回答“看哪里”——而且只在低维空间里商量。",
      "formula": {
        "lead": "两条支路的输出按分组加权聚合成提示嵌入：",
        "unicode": "P = Concat(G₁, …, G_A)；G_i = W_i · Sᵀ_(D/A·i : D/A·(i+1))",
        "symbols": [
          {
            "sym": "S",
            "desc": "语义特征，D×H×W，提示无关"
          },
          {
            "sym": "W",
            "desc": "提示感知权重，A×H×W，提示区域内 softmax 归一化"
          },
          {
            "sym": "A",
            "desc": "分组数，默认 16，远小于 D（低维交互控制成本）"
          },
          {
            "sym": "G_i",
            "desc": "第 i 组的加权聚合结果"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "双支路解耦",
          "desc": "语义管内容、激活管位置，各司其职（§3.3）。"
        },
        {
          "icon": "🔧",
          "title": "低维分组",
          "desc": "A=16≪D，把视觉提示的代价压到最小（Tab 6）。"
        },
        {
          "icon": "✨",
          "title": "互补关系",
          "desc": "视觉提示在文本难描述的罕见类上尤其有用，2 轮即可追加（§4.1）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "LRPC：先找到，再查名",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "连照片都不给，模型还能认出所有物体吗？本节看 LRPC 如何用“先找后查”取代大语言模型。",
      "analogy": {
        "title": "先插旗，再查名",
        "text": "看到什么先<b>记下来</b>，回家只查记下的那几种——而不是把 4585 页图鉴从头到尾背一遍。这就是“懒检索”。",
        "componentId": "ana-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "懒检索调节台：阈值 δ 的取舍",
          "desc": "拖动阈值 δ，看 8400 个锚点里有多少需要去查 4585 类词表——以及省下的时间。图：论文的无提示效果（Fig. 4d）。",
          "componentId": "m6-1",
          "figure": "./images/fig-free.png"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "生成 vs 检索：两种“全都要”",
          "desc": "同一幅图，左边语言模型逐字生成、右边翻图鉴检索——53 倍差距一目了然。",
          "componentId": "m6-2"
        }
      ],
      "insight": "无提示的关键一步，是把开放式的“逐字生成”改写成封闭词表的“先找后查”——快，是有道理的。",
      "formula": {
        "lead": "专用嵌入先把“是物体”的锚点筛出来，只有它们才去查词表：",
        "unicode": "O′ = { o ∈ O | o · P_sᵀ > δ }",
        "symbols": [
          {
            "sym": "P_s",
            "desc": "专用提示嵌入，把“所有物体”当作一类来识别"
          },
          {
            "sym": "δ",
            "desc": "过滤阈值，默认 0.001；越大留下的锚点越少、越快但可能漏"
          },
          {
            "sym": "O′",
            "desc": "通过过滤、需要去词表检索名称的锚点集合"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "检索代替生成",
          "desc": "命名变成查表，摆脱语言模型依赖（§3.4）。"
        },
        {
          "icon": "🔧",
          "title": "先找后查",
          "desc": "只对“有物体”的锚点查 4585 类词表，默认跳过 80%（附录 B）。"
        },
        {
          "icon": "✨",
          "title": "实用主义",
          "desc": "27.2 AP + 25.3 FPS，比生成式 GenerateU 快 53 倍（Tab 3）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "三段式训练：循序渐进的练习计划",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "三种能力塞进一个模型，训练会不会贵得离谱？本节拆解 30+2+1 的三段式训练，答案比想象中便宜。",
      "analogy": {
        "title": "30 + 2 + 1 的练习表",
        "text": "先跟描述练 <b>30</b> 轮，再看照片练 <b>2</b> 轮，最后练全盘记录 <b>1</b> 轮——三种本事分开练，谁也不拖累谁。",
        "componentId": "ana-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "三阶段步进：每阶段练什么、冻什么",
          "desc": "步进三阶段训练：每阶段练什么、冻结什么、花多少时间（口径：8×RTX4090）。",
          "componentId": "m7-1"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "数据家底：检测 + Grounding + 伪掩码",
          "desc": "点击四张数据卡，看训练家底：检测、Grounding 与 SAM-2.1 伪掩码（规模来自附录 A 表 8）。",
          "componentId": "m7-2"
        }
      ],
      "insight": "低成本的秘诀不是少练，而是会“冻”——后两个阶段只唤醒极小部分参数。",
      "formula": {
        "lead": "训练目标按任务拆开，各自用最常用的损失：",
        "unicode": "L = L_BCE(分类) + L_IoU(框) + L_DFL(框) + L_BCE(掩码)",
        "symbols": [
          {
            "sym": "L_BCE(分类)",
            "desc": "二元交叉熵，监督“锚点×提示”的对比分数"
          },
          {
            "sym": "L_IoU / L_DFL",
            "desc": "边界框回归损失（IoU 损失 + 分布式焦点损失）"
          },
          {
            "sym": "L_BCE(掩码)",
            "desc": "分割掩码的二元交叉熵（YOLACT 原型+系数路线）"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "分阶段训练",
          "desc": "30+2+1 轮，三种能力互不拖累（§4.1）。"
        },
        {
          "icon": "🔧",
          "title": "冻结出效率",
          "desc": "视觉提示与无提示只追加 3 轮、只动小部分参数。"
        },
        {
          "icon": "✨",
          "title": "损失常规",
          "desc": "BCE+IoU+DFL+BCE，工程复现门槛低（§3.5）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "全景拆解：YOLOE 的观察背包",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "零件都见过了，整机长什么样？本节把前七节的积木装回一台完整的 YOLOE。",
      "analogy": {
        "title": "一个背包装齐",
        "text": "望远镜负责找、卡片负责认、图鉴负责兜底——三件装备<b>装进同一个背包</b>，这就是 YOLOE 的全部家当。",
        "componentId": "ana-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "交互式整机图：点哪讲哪",
          "desc": "点击整机图的每个组件查看职责与输出；切换提示类型，看三条支路如何在对比处汇流。",
          "componentId": "m8-1"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "选型指南：S/M/L × v8/11 怎么挑",
          "desc": "六枚型号芯片，对比参数量、速度与精度（数据来自论文 Tab 1 文本提示列）。",
          "componentId": "m8-2"
        }
      ],
      "insight": "“统一”二字落在实处：三条提示支路共享同一主干与同一个嵌入对比头。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "一图总览",
          "desc": "骨干+PAN+三头+三支路，提示在嵌入对比处汇流（Fig 2）。"
        },
        {
          "icon": "🔧",
          "title": "嵌入头即分类头",
          "desc": "只改最后 1×1 卷积的输出通道为 D（§3.1）。"
        },
        {
          "icon": "✨",
          "title": "按需选型",
          "desc": "S 快、L 准，v8/11 两代架构通吃（Tab 1）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "效率工程：每一次权衡都有代价",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "前面说了很多“便宜”和“零开销”，到底省在哪、亏在哪？本节把六步路线图放到放大镜下，一步一步算清楚。",
      "analogy": {
        "title": "减一件，快一程",
        "text": "每去掉一件装备都能走得更远，但也可能少一分把握——YOLOE 的工程设计，就是把每笔<b>取舍</b>算清楚。",
        "componentId": "ana-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "六步路线图：从 YOLO-Worldv2 到 YOLOE",
          "desc": "逐格重走消融路线，看每个设计决策谁买单、谁受益（数据来自论文 Tab 5，v8-L、30 轮口径）。",
          "componentId": "m9-1"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "部署指标尺：同一把尺子量到底",
          "desc": "切换 T4/TensorRT 与 iPhone 12/CoreML 两种协议，理解 FPS 为什么只能在同设备同引擎下比较。",
          "componentId": "m9-2"
        }
      ],
      "insight": "效率不是白来的：每一次提速背后都有一笔明码标价的交易，除了 RepRTA——它真的零开销。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "权衡显性化",
          "desc": "去融合换 1.28× 速度、RepRTA 零开销补强（Tab 5）。"
        },
        {
          "icon": "🔧",
          "title": "协议先行",
          "desc": "FPS 必须同设备同引擎比较（§4.1 Metric）。"
        },
        {
          "icon": "✨",
          "title": "工程读法",
          "desc": "看消融先问“谁买单、谁受益”。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "成绩单与边界：看见万物的代价",
      "badge": "both",
      "badgeLabel": "基础+进阶",
      "bridge": "十节旅程到了终点。最后一节不打新仗，用一场竞速收束全部对比，再用完整成绩单与边界清单把证据钉牢。",
      "analogy": {
        "title": "标满图鉴比赛",
        "text": "同样的鸟群、同样的时间：旧图鉴还在翻页，新图鉴已经<b>标满收工</b>——这场面就是 YOLOE 的成绩单。",
        "componentId": "ana-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "三线竞速：精度、速度、成本",
          "desc": "点击开始，看 YOLOE-v8-S 与 YOLO-Worldv2-S 在精度、速度、训练成本三条跑道上的同步竞速（Tab 1）。",
          "componentId": "m10-1"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "全景成绩单：四张表 + 三条边界",
          "desc": "芯片切换文本提示、分割、无提示、COCO 迁移四组实测表，右侧常驻三条引用边界。图：论文的 LVIS 零样本检测效果（Fig. 4a）。",
          "componentId": "m10-2",
          "figure": "./images/fig-zeroshot.png"
        }
      ],
      "insight": "优势与边界同样真实：引用论文结论时，请把表号和协议口径一起带上。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "三线全胜",
          "desc": "小模型档 +3.5 AP、1.4×、约 1/3 训练成本（Tab 1）。"
        },
        {
          "icon": "🔧",
          "title": "全线验证",
          "desc": "文本/视觉/无提示/分割/迁移，证据链完整（Tab 1–4）。"
        },
        {
          "icon": "✨",
          "title": "边界须知",
          "desc": "多任务 APf 微降、词表覆盖、协议口径——引用时带边界。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1ax421S7hE",
      "title": "越用越爽！【YOLO-World】顶会CVPR2024全新发布！看计算机博士如何解读开放性词汇目标检测",
      "reason": "全景入门：先建立开放词汇检测的领域地图（YOLOE 的直接前身）",
      "cover": "https://i1.hdslb.com/bfs/archive/58be3604beadd8dad6bbd89fde50f3d5b9220a99.png",
      "views": "967播放"
    },
    {
      "bvid": "BV1dH4y1T7v2",
      "title": "CVPR2024最新发布！实时开放词汇物体检测论文YOLO-world，同济大佬一小时逐行解读及论文复现",
      "reason": "方法深挖：逐行解读基线 YOLO-World，对照看 YOLOE 改了什么",
      "cover": "https://i1.hdslb.com/bfs/archive/f9eafcc34de0c4aa1efc4bdf8afe957a16341b13.png",
      "views": "822播放"
    },
    {
      "bvid": "BV1n3ojYfETk",
      "title": "支持多种场景下的目标检测与分割，一键部署 YOLOE 教程",
      "reason": "动手实操：直接讲 YOLOE 的部署与三种提示玩法（稀缺素材）",
      "cover": "https://i2.hdslb.com/bfs/archive/cd9aeb4f82ea56951a5ab52ef4c51aed0cb9c4f0.jpg",
      "views": "1339播放"
    },
    {
      "bvid": "BV1eK3uz8E43",
      "title": "一节课搞定YOLO-World项目实战与轻量化部署",
      "reason": "延伸实战：轻量化部署经验，对应本教程的效率与部署议题",
      "cover": "https://i1.hdslb.com/bfs/archive/798ab0e0d9093ec53f0d8fa1bb2abb87f20dc4f5.jpg",
      "views": "7246播放"
    }
  ]
};
