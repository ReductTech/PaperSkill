import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "LaViLa Explorer",
    "titleZh": "让大语言模型成为视频的旁白老师",
    "venue": "CVPR 2023 · 10 章交互论文",
    "authors": "Yue Zhao · Ishan Misra · Philipp Krähenbühl · Rohit Girdhar",
    "affiliation": "FAIR, Meta AI · University of Texas at Austin",
    "domain": "视频—语言表征学习",
    "coreProblem": "海量视频缺少密集、对齐且多样的文字监督。",
    "coreInsight": "如果视频很多、人工描述很少，能否让大语言模型为未标注的片段补上旁白？拖动时间轴，亲手探索 LaViLa 如何把生成的描述用于视频表征学习。",
    "keywords": [
      "Dense",
      "Aligned",
      "Diverse",
      "Narrator",
      "Rephraser",
      "Dual Encoder"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "少量人工描述落在时间轴的局部；灰色区间仍没有配对文字。",
      "componentId": "hero-timeline"
    },
    "newMethod": {
      "desc": "点击按钮，让 Narrator 为更多片段生成教学示意的旁白；最终仍由 Dual Encoder 学习视频表征。",
      "componentId": "hero-timeline"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "视频很多，文字却不够 · Videos Everywhere, Labels Nowhere",
      "badge": "trn",
      "badgeLabel": "问题与数据",
      "bridge": "先把目光从模型移到数据：一段长视频只有零星的人工叙述，语音转录也未必描述镜头里的动作。拖动时间轴，亲自寻找监督的空白。论文依据：第1页 Introduction；第2页 Figure 2。",
      "analogy": {
        "title": "静音片段里的空字幕位",
        "text": "想象在编辑一段没有声音的视频：光标走到某个时间点，字幕栏仍是空白。我们要知道缺口在哪里，才能讨论怎样补上可用的文字监督。",
        "componentId": "subtitle-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "可拖动监督时间轴",
          "desc": "拖动播放头，比较人工描述、ASR 和 Narrator 示意标注在当前位置的可用性；显示覆盖率。时间点与覆盖率均为教学示意，依据第1页 Introduction 与第2页 Figure 2。",
          "componentId": "lab-ch1"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "Human / ASR / LaViLa 找茬",
          "desc": "把“稀疏”“可能不描述画面”“与画面动作对齐”分别分配给三类示意句子，立即看到理由。示例为教学示意；原理见第2页 Figure 2。",
          "componentId": "lab-ch1",
          "figure": "./images/fig2.png"
        },
        {
          "kind": "module",
          "id": "1.3",
          "title": "标注成本模拟器",
          "desc": "调节视频时长与人工叙述密度，观察示意工作量和标注数；所有数字只用于说明成本随规模变化，不是论文报告的工时。依据第1页 Introduction。",
          "componentId": "lab-ch1"
        },
        {
          "kind": "module",
          "id": "1.Q",
          "title": "本章小测 · 随时展开",
          "desc": "两道可独立展开的小题；答错可重试，不影响进入下一章。依据第1页 Introduction 和第2页 Figure 2。",
          "componentId": "chapter-quiz"
        }
      ],
      "insight": "LaViLa 的起点是监督信号的数量、时间位置与语言质量；“有视频”还不等于“有可训练的视频—文本对”。",
      "takeaways": [
        {
          "icon": "◷",
          "title": "监督稀疏",
          "desc": "人工叙述只覆盖部分时间片段，未标注位置无法直接形成训练对。"
        },
        {
          "icon": "≠",
          "title": "ASR 不等于画面描述",
          "desc": "说话内容可能与镜头动作没有直接对应。"
        },
        {
          "icon": "↗",
          "title": "生成新的配对",
          "desc": "Narrator 提供补充监督的路径，但后面还需要筛选和对比训练。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "视频与文字如何相遇 · Learning Video–Text Alignment",
      "badge": "trn",
      "badgeLabel": "对比学习",
      "bridge": "有了视频—文字对，下一步是把两者映射到共享空间。先移动一组点，再观察相似度矩阵和温度如何改变匹配概率。依据第3页 §3、式(1)。",
      "analogy": {
        "title": "让字幕条对准正确镜头",
        "text": "同一条字幕要滑到对应的画面下方；错位时，看起来相关的词也帮不了模型。",
        "componentId": "subtitle-analogy"
      },
      "formula": {
        "lead": "视频编码器与文本编码器产生同维嵌入，随后用双向对比目标拉近真实配对。第3页 §3、式(1)。",
        "unicode": "v = hᵥ(fᵥ(x)),  u = hₜ(fₜ(y));  L = (1/|B|) ∑_{(x,y)∈B} [InfoNCE(v,u) + InfoNCE(u,v)]",
        "symbols": [
          {
            "sym": "x / y",
            "desc": "同一训练对中的视频片段与文字叙述。"
          },
          {
            "sym": "fᵥ / fₜ",
            "desc": "分别读取视频与文字的编码器。"
          },
          {
            "sym": "hᵥ / hₜ",
            "desc": "投影到共同表示维度的映射。"
          },
          {
            "sym": "Lᵥ→ₜ / Lₜ→ᵥ",
            "desc": "批内视频找文字、文字找视频的两个对比方向。"
          }
        ]
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "共享空间游乐场",
          "desc": "切换训练前后，并移动一个文字点；二维示意空间同步更新配对距离、最近邻和解释。坐标为教学示意，机制依据第3页 §3。",
          "componentId": "lab-ch2"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "相似度矩阵",
          "desc": "点击视频×文字矩阵中的单元格；对角线为本批次正例，其余为批内负例。显示所选单元的意义，依据第3页 §3、式(1)。",
          "componentId": "lab-ch2"
        },
        {
          "kind": "module",
          "id": "2.3",
          "title": "温度实验室",
          "desc": "拖动温度滑杆，看同一行相似度的 softmax 概率条与正例概率如何变化。数值为教学示意，不代表论文调参结果；依据第3页式(1)的对比学习机制。",
          "componentId": "lab-ch2"
        },
        {
          "kind": "module",
          "id": "2.Q",
          "title": "本章小测 · 随时展开",
          "desc": "两道可独立展开的小题；错误反馈指向第3页 §3、式(1)，无通关限制。",
          "componentId": "chapter-quiz"
        }
      ],
      "insight": "真正要学的是可复用的视频表征；LLM 扩充的文字监督，最终在这里进入视频—文本双编码器的训练。",
      "takeaways": [
        {
          "icon": "⇄",
          "title": "共享空间",
          "desc": "视频与文字被投影到同维表示，才便于计算跨模态相似度。"
        },
        {
          "icon": "◎",
          "title": "对角线是正例",
          "desc": "批内每个视频与自己的文字配对，其他文字提供对比。"
        },
        {
          "icon": "↔",
          "title": "两个方向",
          "desc": "训练目标同时包含视频找文本、文本找视频。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "LaViLa 数据工场 · Data Factory",
      "badge": "trn",
      "badgeLabel": "方法总览",
      "bridge": "现在把扩充监督的各个角色摆到同一张图里：Narrator 从画面写描述，Rephraser 从已有文字改写，Dual Encoder 从配对中学习。依据第2页 Figure 2、第3页 §4。",
      "analogy": {
        "title": "同一片段的一条字幕变多了",
        "text": "一张原字幕卡在时间线上展开到附近的空白位置，同时出现不同说法；编辑者仍要确认每条字幕与画面对应。",
        "componentId": "subtitle-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "Figure 2 拆解图",
          "desc": "点击 Narrator、Rephraser 或 Dual Encoder 热点，同步突出其输入、输出及在论文原图中的路径。原图第2页 Figure 2。",
          "componentId": "lab-ch3",
          "figure": "./images/fig2.png"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "谁负责什么",
          "desc": "选择角色与职责配对；正确或错误均解释视频输入、文字输入、表征学习的差别。依据第2页 Figure 2、第3页 §4。",
          "componentId": "lab-ch3"
        },
        {
          "kind": "module",
          "id": "3.3",
          "title": "数据池扩张",
          "desc": "逐步加入原始、recaption、pseudo-caption 和 rephrase 对，观察三类训练来源如何形成。动画数量全部标为教学示意；依据第3页 §4。",
          "componentId": "lab-ch3"
        },
        {
          "kind": "module",
          "id": "3.4",
          "title": "数据源过滤器",
          "desc": "开关三类视频—文本对，观察送往 Dual Encoder 的来源和用途；区分 Narrator 的两种生成位置。依据第3页 §4、第5页 §4.3。",
          "componentId": "lab-ch3"
        },
        {
          "kind": "module",
          "id": "3.Q",
          "title": "本章小测 · 随时展开",
          "desc": "两道可独立展开的小题，反馈锚定第2页 Figure 2、第3页 §4。",
          "componentId": "chapter-quiz"
        }
      ],
      "insight": "LLM 是监督数据的制造者；训练完成后承担检索与识别的主角，是视频—文本双编码器。",
      "takeaways": [
        {
          "icon": "▣",
          "title": "Narrator 看视频",
          "desc": "为已标注片段重新描述，也为无文字片段生成伪描述。"
        },
        {
          "icon": "✎",
          "title": "Rephraser 看文字",
          "desc": "改写已有叙述，增加语言多样性；不直接读取视频。"
        },
        {
          "icon": "◈",
          "title": "Dual Encoder 学表征",
          "desc": "把扩大后的配对集合变成共享的视频—文本空间。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "认识 Narrator · Architecture + Sampling",
      "badge": "trn",
      "badgeLabel": "视觉条件生成",
      "bridge": "上一章认识了三种数据来源，这一章进入 Narrator 内部：它怎样看视频逐词写旁白，生成时又怎样兼顾准确与多样？先观察论文原图 Figure 4，再动手调整采样。这里的词和画面均为教学示意，不是论文实际生成结果。",
      "analogy": {
        "title": "给片段写下一句字幕",
        "text": "像给一段无声视频补字幕：笔每写一个词，都要回看画面，也要回看已经写下的词。这个比喻对应视觉条件下的自回归生成。",
        "componentId": "subtitle-analogy",
        "figure": "./images/fig4.png"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "逐词生成",
          "desc": "点“下一个词”，观察已写词与视觉线索如何共同约束下一步。教学示意；论文依据：p4 §4.1 Eq.(2)。",
          "componentId": "lab-ch4"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "Cross-attention X 光",
          "desc": "选择画面区域和正在生成的词，观察概念性的视觉读取路线；连线并非模型真实注意力权重。论文依据：p4 §4.1 Figure 4。",
          "componentId": "lab-ch4",
          "figure": "./images/fig4.png"
        },
        {
          "kind": "module",
          "id": "4.3",
          "title": "组装 Narrator",
          "desc": "依次接入视觉编码、cross-attention 和语言解码，构成从视频到旁白的路径。论文依据：p4 §4.1 Figure 4。",
          "componentId": "lab-ch4"
        },
        {
          "kind": "module",
          "id": "4.4",
          "title": "Beam 对 Nucleus",
          "desc": "选择生成策略，核对 Table 7b 在 EK-100 MIR 零样本平均 mAP 上的实测记录；仅在同一表、任务、指标内比较。",
          "componentId": "lab-ch4"
        },
        {
          "kind": "module",
          "id": "4.5",
          "title": "Top-p 候选池",
          "desc": "移动 top-p 滑杆，观察教学示意的累计概率候选池。论文默认 nucleus p=0.95；依据：p4 §4.1、p8 Table 7b。",
          "componentId": "lab-ch4"
        },
        {
          "kind": "module",
          "id": "4.6",
          "title": "K 叙述旋钮",
          "desc": "调整每个片段生成的候选句数，观察可见候选卡与多样性/噪声取舍。论文默认 K=10；依据：p4 §4.1、p8 Table 7b。",
          "componentId": "lab-ch4"
        },
        {
          "kind": "module",
          "id": "4.Q",
          "title": "本章小测",
          "desc": "两题均可自由展开和收起；答错会解释并给论文定位，不影响进入下一章。",
          "componentId": "chapter-quiz"
        }
      ],
      "insight": "Narrator 是带视觉条件的语言生成器；它产出训练所需的文字监督，而不是下游检索时要运行的最终模型。Figure 4 的 gated cross-attention 使文本 token 能读取视频表征。",
      "formula": {
        "lead": "每个新词同时依赖已生成的词和视频片段（p4 §4.1 Eq.(2)）：",
        "unicode": "p_N(y′ | x′) = ∏ₗ p(s′ₗ | s′₍<ₗ₎, x′)",
        "symbols": [
          {
            "sym": "x′",
            "desc": "待描述的视频片段"
          },
          {
            "sym": "y′",
            "desc": "Narrator 生成的整句文字"
          },
          {
            "sym": "s′ₗ",
            "desc": "第 l 个待生成的词"
          },
          {
            "sym": "s′₍<ₗ₎",
            "desc": "这个词之前已经生成的词"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "👁️",
          "title": "看得见画面",
          "desc": "视觉特征通过 cross-attention 进入语言模型的生成过程。"
        },
        {
          "icon": "✍️",
          "title": "逐词写旁白",
          "desc": "新词受先前词与视频共同约束，是自回归生成。"
        },
        {
          "icon": "🎲",
          "title": "采样可调",
          "desc": "论文默认 nucleus p=0.95、每片段 K=10；比较必须保持 Table 7b 的指标条件。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "给时间轴补上空白 · Filling the Gaps",
      "badge": "trn",
      "badgeLabel": "生成与筛选",
      "bridge": "会生成旁白之后，关键是把它放在合适的时间位置。标过的片段可以重新描述，空白区间可以采样后生成伪描述；伪描述配对再由已训练的基线编码器筛选。",
      "analogy": {
        "title": "补写漏掉的时间戳",
        "text": "一段字幕只覆盖了两处画面。移动光标到空白时间点，再补上一条候选字幕；检查它是否真的说的是画面里的事。",
        "componentId": "subtitle-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "补空白时间轴",
          "desc": "点未标注区间加入伪描述，再比较与在人工标注片段上生成的 recaption。两者位置不同；论文依据：p4–5 §4.1。",
          "componentId": "lab-ch5"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "片段时长计算器",
          "desc": "修改三个教学示意片段的起止时间，计算平均时长 Δ；论文依据：p5 §4.1。",
          "componentId": "lab-ch5"
        },
        {
          "kind": "module",
          "id": "5.3",
          "title": "质量闸门",
          "desc": "滑动相似度门槛，观察教学示意配对被接受或拒绝。论文实验阈值为 0.5，依据：p5 §4.1；分数示意不代表论文实测。",
          "componentId": "lab-ch5"
        },
        {
          "kind": "module",
          "id": "5.4",
          "title": "你来当过滤器",
          "desc": "逐一判断四组视频与候选文字是否视觉对齐，提交后查看即时解释。案例均为教学示意；论文依据：p5 §4.1。",
          "componentId": "lab-ch5"
        },
        {
          "kind": "module",
          "id": "5.Q",
          "title": "本章小测",
          "desc": "两题均可自由展开和收起；答错会解释并给论文定位，不影响进入下一章。",
          "componentId": "chapter-quiz"
        }
      ],
      "insight": "Recaption 与 pseudo-caption 都出自 Narrator：前者给已有人工片段换一种说法，后者填充原本缺少文字的区间。伪描述配对须经过质量筛选，避免把错配当成监督。",
      "formula": {
        "lead": "用已标注片段的平均时长确定取样片段尺度（p5 §4.1）：",
        "unicode": "Δ = (1 / N) ∑ᵢ (eᵢ − tᵢ)",
        "symbols": [
          {
            "sym": "Δ",
            "desc": "人工标注片段的平均持续时间，单位为秒"
          },
          {
            "sym": "N",
            "desc": "统计的已标注片段数量"
          },
          {
            "sym": "tᵢ",
            "desc": "第 i 个片段的开始时间"
          },
          {
            "sym": "eᵢ",
            "desc": "第 i 个片段的结束时间"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🕒",
          "title": "补不同位置",
          "desc": "Recaption 改写已标注片段；pseudo-caption 覆盖采样的未标注区间。"
        },
        {
          "icon": "📐",
          "title": "时长有依据",
          "desc": "采样片段长度参照人工标注片段的平均持续时间 Δ。"
        },
        {
          "icon": "✅",
          "title": "先筛再学",
          "desc": "基线视频—文本编码器给伪配对打相似度，论文实验门槛是 0.5。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "认识 Rephraser · Language Diversity",
      "badge": "trn",
      "badgeLabel": "文字多样化",
      "bridge": "视频覆盖率提高后，还需要让同一动作有多种自然说法。Rephraser 读入一句已有旁白，输出语义接近但措辞不同的句子；它不直接读取视频。",
      "analogy": {
        "title": "给同一句字幕换说法",
        "text": "编辑拿着一行已有字幕，把“拿起”改成“取出”，保持动作不变。变化的是表达，不是视频片段。",
        "componentId": "subtitle-analogy",
        "figure": "./images/fig3.png"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "改写树",
          "desc": "点开原句的三种等义分支，观察词语、语序和指代变化。教学示意；论文依据：p5 §4.2、p3 Figure 3。",
          "componentId": "lab-ch6",
          "figure": "./images/fig3.png"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "什么变了",
          "desc": "选择改写句中的词，查看词汇替换或语序调整，核对语义是否仍指同一动作。教学示意；论文依据：p5 §4.2。",
          "componentId": "lab-ch6"
        },
        {
          "kind": "module",
          "id": "6.3",
          "title": "Narrator 还是 Rephraser",
          "desc": "根据输入是视频还是文字，判断应由哪一个模型生成候选句。论文依据：p4–5 §§4.1–4.2 Figure 4。",
          "componentId": "lab-ch6",
          "figure": "./images/fig4.png"
        },
        {
          "kind": "module",
          "id": "6.4",
          "title": "语义漂移仪",
          "desc": "调节示意改写距离，观察表述多样性与偏离原义的风险；并非论文测量出的漂移阈值。论文依据：p5 §4.2。",
          "componentId": "lab-ch6"
        },
        {
          "kind": "module",
          "id": "6.Q",
          "title": "本章小测",
          "desc": "两题均可自由展开和收起；答错会解释并给论文定位，不影响进入下一章。",
          "componentId": "chapter-quiz"
        }
      ],
      "insight": "Narrator 用画面生成新描述，Rephraser 用已有文字扩充说法。两者补的是不同维度：时间覆盖与语言多样性。论文的 Rephraser 以文本为条件，去重后保留三条候选。",
      "formula": {
        "lead": "改写器的条件只有原有文字 y（p5 §4.2）：",
        "unicode": "p_R(y″ | y) = ∏ₗ p(s″ₗ | s″₍<ₗ₎, y)",
        "symbols": [
          {
            "sym": "y",
            "desc": "输入的已有文字描述"
          },
          {
            "sym": "y″",
            "desc": "生成的改写句"
          },
          {
            "sym": "s″ₗ",
            "desc": "第 l 个改写句词语"
          },
          {
            "sym": "s″₍<ₗ₎",
            "desc": "此前已生成的改写句词语"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📝",
          "title": "文字作输入",
          "desc": "Rephraser 根据已有 narration 改写，不直接看视频。"
        },
        {
          "icon": "🌿",
          "title": "表达更丰富",
          "desc": "同一视频动作有多种说法，扩充语言监督的覆盖。"
        },
        {
          "icon": "🎯",
          "title": "语义不能跑偏",
          "desc": "句式可以变，描述的动作和对象应保持一致。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "训练视频编码器 · Training the Dual Encoder",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "Narrator 和 Rephraser 已经把稀疏监督扩成三类视频—文本对。现在把它们交给同一个双编码器，让视频和对应文字在共享空间里靠近。",
      "analogy": {
        "title": "字幕进入练习盘",
        "text": "同一段视频的原描述、新旁白与改写像不同版本的字幕卡；逐张放入练习盘，编码器学习辨认哪句话对应画面。",
        "componentId": "subtitle-analogy"
      },
      "insight": "生成结果会预先缓存。最终用于下游任务的是经过对比训练的视频—文本双编码器，而不是每一步都在线调用 Narrator。",
      "formula": {
        "lead": "三路监督汇入同一对比学习流程（论文第3页 §4）。点击公式中的符号可查看含义。",
        "unicode": "(X,Y) ∪ (X′,Y′) ∪ (X,Y″)",
        "symbols": [
          {
            "sym": "(X,Y)",
            "desc": "原始人工视频—文字配对。"
          },
          {
            "sym": "(X′,Y′)",
            "desc": "Narrator 生成的重描述或伪描述配对。"
          },
          {
            "sym": "(X,Y″)",
            "desc": "Rephraser 改写文字后与原视频组成的配对。"
          },
          {
            "sym": "∪",
            "desc": "这些来源合并用于训练；交互中的比例仅作教学示意，不代表论文采样权重。"
          }
        ]
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "Batch Mixer",
          "desc": "拉动四类配对的教学示意权重，观察一个混合批次的构成。论文第3页 §4、第5页 §4.3。",
          "componentId": "lab-ch7"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "Contrastive Matrix 2.0",
          "desc": "切换配对来源并点击相似度格子，判断哪些是批内正配对；矩阵数值仅作教学示意。论文第3页 Eq.(1)。",
          "componentId": "lab-ch7"
        },
        {
          "kind": "module",
          "id": "7.3",
          "title": "Offline Cache 对比",
          "desc": "切换预先缓存与在线生成，看训练步骤的先后关系。论文第5页 §4.3 报告生成结果预先缓存。",
          "componentId": "lab-ch7"
        },
        {
          "kind": "module",
          "id": "7.4",
          "title": "Frame Sampler",
          "desc": "切换预训练与微调，比较论文实验中 4 帧与 16 帧的采样条带。论文第5页 Experiments。",
          "componentId": "lab-ch7"
        },
        {
          "kind": "module",
          "id": "7.Q",
          "title": "本章小测",
          "desc": "两题均可自由展开和收起，答错不影响继续。",
          "componentId": "chapter-quiz"
        }
      ],
      "takeaways": [
        {
          "icon": "🧩",
          "title": "三路监督",
          "desc": "原始、Narrator 和 Rephraser 配对共同训练双编码器。"
        },
        {
          "icon": "💾",
          "title": "先生成再缓存",
          "desc": "论文实现将生成文字预先缓存，然后进行视频—文本对比训练。"
        },
        {
          "icon": "🎞️",
          "title": "帧数属于实验设置",
          "desc": "论文报告预训练 4 帧、微调 16 帧；它们不是所有视频模型的通则。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "基准竞技场 · Benchmark Arena",
      "badge": "both",
      "badgeLabel": "评估",
      "bridge": "模型学到了共享表征，还需要看它能否迁移到检索、问答与动作识别。先选数据集、任务和协议，再看同一指标下的结果。",
      "analogy": {
        "title": "放大镜落在成绩卡",
        "text": "放大镜一次只看一张成绩卡：数据集、任务、指标和训练协议都写在卡上，才能公平读数。",
        "componentId": "subtitle-analogy"
      },
      "insight": "零样本、微调和线性探测的设置不同；Figure 1 的雷达轴也混用指标。因此每个数字都必须附带数据集、任务、指标和协议。",
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "可交互基准概览",
          "desc": "选一个基准，逐项查看任务、指标、协议及原始 Figure 1。论文第1页 Fig.1、表1及第6–7页 Tables 2–6。",
          "componentId": "lab-ch8",
          "figure": "./images/fig1.png"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "任务地图",
          "desc": "切换检索、问答与动作识别，为这里展示的六项基准标出任务类型；论文表 1 还包含 EK-100 动作分类和 Ego4D 自然语言查询。不同任务不合并排名。论文第5–7页实验表。",
          "componentId": "lab-ch8"
        },
        {
          "kind": "module",
          "id": "8.3",
          "title": "ZS 对 FT",
          "desc": "在 CharadesEgo 同一 mAP 指标内切换零样本与微调，观察两组分别报告的 Table 5 数值。论文第7页 Table 5。",
          "componentId": "lab-ch8"
        },
        {
          "kind": "module",
          "id": "8.4",
          "title": "可排序结果镜头",
          "desc": "选 CharadesEgo、UCF-101 或 HMDB-51，再按同一数据集、同一协议内的结果排序；原值来自 Tables 5–6。",
          "componentId": "lab-ch8"
        },
        {
          "kind": "module",
          "id": "8.Q",
          "title": "本章小测",
          "desc": "两题均可自由展开和收起，答错不影响继续。",
          "componentId": "chapter-quiz"
        }
      ],
      "takeaways": [
        {
          "icon": "🗺️",
          "title": "任务跨度广",
          "desc": "评估覆盖第一人称与第三人称视频任务，包括检索、问答、自然语言查询与分类；这里的任务地图展示其中六项。"
        },
        {
          "icon": "📏",
          "title": "读数带条件",
          "desc": "同一张结果卡须标明数据集、指标与 ZS / FT / LP 协议。"
        },
        {
          "icon": "🔎",
          "title": "先筛选再比较",
          "desc": "只对同一数据集、任务、指标、协议下的方法数值排序。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "更少标签，更多学习 · Less Labels, More Learning",
      "badge": "trn",
      "badgeLabel": "半监督",
      "bridge": "如果人工 narration 只保留一部分，LaViLa 还能学习吗？Figure 5 用 10%、20%、50%、100% 标注预算分别观察四项指标。",
      "analogy": {
        "title": "剪下一段标注预算",
        "text": "剪刀缩短可用的人工字幕条，剩下空白仍可以由自动生成的叙述辅助训练；观察预算变化后证据曲线怎样走。",
        "componentId": "subtitle-analogy"
      },
      "insight": "Figure 5 中 LaViLa 在所绘四项指标上高于只用人工标注的基线。它展示低标注条件下的效果，但不能推出任意数据集、任意算力预算的最优方案。",
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "标注预算滑杆",
          "desc": "选 10/20/50/100% 人工标注并切换 Figure 5 的四个任务面板；定位竖线仅标示横轴位置，不重绘论文数值。论文第7页 Fig.5。",
          "componentId": "lab-ch9",
          "figure": "./images/fig5.png"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "50% 对 100%",
          "desc": "选择预算视角，区分论文同图中的 LaViLa、只用人工标注的基线与外部已有方法。论文第7页 §5.3 Fig.5。",
          "componentId": "lab-ch9"
        },
        {
          "kind": "module",
          "id": "9.3",
          "title": "Scaling Lab",
          "desc": "选择数据与模型扩展方向，只得到论文支持的定性启发及未验证的边界。论文第8页 Conclusion/Future Work。",
          "componentId": "lab-ch9"
        },
        {
          "kind": "module",
          "id": "9.4",
          "title": "算力预算游戏",
          "desc": "在教学示意的固定预算中分配人工标注、生成和训练资源；反馈展示取舍，不计算论文未报告的最优点。",
          "componentId": "lab-ch9"
        },
        {
          "kind": "module",
          "id": "9.Q",
          "title": "本章小测",
          "desc": "两题均可自由展开和收起，答错不影响继续。",
          "componentId": "chapter-quiz"
        }
      ],
      "takeaways": [
        {
          "icon": "📉",
          "title": "减少标签仍可学习",
          "desc": "论文 Figure 5 在四项指标上展示 LaViLa 曲线高于只用人工标注的基线。"
        },
        {
          "icon": "🔍",
          "title": "看清比较对象",
          "desc": "“50% 对 100%”必须说清是哪种模型、哪个任务及哪个比较基线。"
        },
        {
          "icon": "🧭",
          "title": "扩展是研究方向",
          "desc": "更大视觉骨干与更强语言模型是作者提出的后续方向，不是本页模拟器验证的保证。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "消融侦探与 LaViLa 控制室",
      "badge": "both",
      "badgeLabel": "实验与综合",
      "bridge": "前九章分别拆开了数据、生成、过滤、对比训练与评测。现在回到论文原表：哪些改动确有同协议证据，哪些只是值得尝试的想法？",
      "analogy": {
        "title": "给最终字幕做证据校对",
        "text": "像用一只放大镜逐行核对字幕稿，先固定任务和指标，再判断一个开关改变了什么。这里的配置控件只映射论文证据，不把未测组合冒充实验结果。",
        "componentId": "subtitle-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "Table 8：消融开关",
          "desc": "切换 Rephraser、Recaption、Pseudo Caption，找到论文真正报告的组合。指标固定为 EK-100 MIR 零样本 average mAP；表 8 还报告其他指标，需分开读。来源：论文第 8 页表 8。",
          "componentId": "lab-ch10",
          "figure": "./images/table8.png"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "Narrator 语言模型实验",
          "desc": "固定 EK-100 MIR 零样本 average mAP，比较论文表 7a 的 GPT-2 初始化和规模设置。来源：论文第 8 页表 7a。",
          "componentId": "lab-ch10",
          "figure": "./images/table7.png"
        },
        {
          "kind": "module",
          "id": "10.3",
          "title": "采样策略对决",
          "desc": "选择 Beam 或 Nucleus 与 K，读取论文表 7b 的同一指标；仅比较实际出现的三个条件。来源：论文第 8 页表 7b。",
          "componentId": "lab-ch10"
        },
        {
          "kind": "module",
          "id": "10.4",
          "title": "LaViLa Control Room：从论文证据到配置判断",
          "desc": "联合调整视觉编码器、LM、采样、p、K、Recaption、Pseudo Caption、过滤、Rephraser、帧数与文本长度。屏幕显示机制影响和证据位置；未知组合标为未报告，不计算虚构成绩。",
          "componentId": "lab-ch10"
        },
        {
          "kind": "module",
          "id": "10.Q",
          "title": "本章小测",
          "desc": "两题均可自由展开和收起；答错会给出论文线索，不影响继续浏览。",
          "componentId": "chapter-quiz"
        }
      ],
      "insight": "一项提升可能来自更多描述、更密覆盖或更强的生成器。消融表让我们识别证据范围，也提醒我们别把相关性写成无条件因果。",
      "formula": {
        "lead": "回看训练集合的三类监督来源。点击符号理解各自来自哪里。",
        "unicode": "(X,Y) ∪ (X′,Y′) ∪ (X,Y″)",
        "symbols": [
          {
            "sym": "(X,Y)",
            "desc": "人工标注的原始视频—文字对。"
          },
          {
            "sym": "(X′,Y′)",
            "desc": "Narrator 生成的新视频—描述对，包含重新描述及空白区间的伪描述。"
          },
          {
            "sym": "(X,Y″)",
            "desc": "Rephraser 根据已有文本改写得到的配对。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🔬",
          "title": "只比同指标",
          "desc": "表 7 的 average mAP 与表 8 的其他列不能混作同一个成绩。"
        },
        {
          "icon": "🧩",
          "title": "组合有边界",
          "desc": "没有出现在原表的开关组合只可讨论机制，不能推算结果。"
        },
        {
          "icon": "🎬",
          "title": "最终模型",
          "desc": "生成模型负责造监督；部署下游任务时使用学到的视频编码器。"
        }
      ]
    }
  ]
};
