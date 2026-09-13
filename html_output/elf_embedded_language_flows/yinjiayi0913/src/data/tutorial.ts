import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "ELF: Embedded Language Flows",
    "titleZh": "ELF：嵌入语言流",
    "venue": "arXiv 2605.10938v2 · 2026",
    "authors": "Keya Hu, Linlu Qiu, Yiyang Lu, Hanhong Zhao, Tianhong Li, Yoon Kim, Jacob Andreas, Kaiming He",
    "affiliation": "MIT",
    "domain": "语言建模 · 连续扩散与流匹配",
    "coreProblem": "离散扩散语言模型主导了近期进展，连续扩散在语言上却长期落后。原因究竟来自语言本身的离散性，还是算法设计尚未被充分探索，此前没有定论。",
    "coreInsight": "ELF 把语言生成放进连续嵌入空间，用连续时间的 Flow Matching 沿直线路径把噪声推向干净嵌入，直到最后一步才用共享权重网络离散化成词元。",
    "keywords": [
      "扩散语言模型",
      "Flow Matching",
      "连续嵌入空间",
      "共享权重解码",
      "分类器无关引导"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "旧法：每一步都在离散词元空间取值，取整误差不断累积，还要额外训练一个解码器才能回到文本。",
      "componentId": "clay-hero-compare"
    },
    "newMethod": {
      "desc": "ELF：全程在连续嵌入空间沿直线轨迹传输，末步用同一套权重直接落款成词元，不需要独立解码器。",
      "componentId": "clay-hero-compare",
      "figure": "/images/figure-3.png"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "连续空间里的语言生成",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "扩散与流模型在图像和视频上已经成为主流做法，但语言上的扩散模型长期以离散词元为主。本节先看清问题：每一步都回到离散词元，为什么会让误差不断累积。",
      "analogy": {
        "title": "泥心偏移",
        "text": "轮子一转，偏心就累积成歪形。ELF 的做法是让整个过程留在连续的泥里，只在最后落款。",
        "componentId": "clay-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "偏移与推回",
          "componentId": "ch1-offset",
          "desc": "拖动「噪声强度」观察偏心如何越积越大，再点「推回中心」施加一次引导。泥团与右下角误差曲线由同一状态驱动。"
        }
      ],
      "insight": "需要一种让去噪尽量待在连续空间、只在最后一步才落款的做法。",
      "formula": {
        "lead": "把噪声与干净嵌入用一条直线连起来，任意时刻的位置就是两者的加权和。",
        "unicode": "z_t = t · x + (1 − t) · ε",
        "symbols": [
          {
            "sym": "z_t",
            "desc": "t 时刻的含噪嵌入序列，形状与句子嵌入相同。"
          },
          {
            "sym": "t",
            "desc": "连续时间，从 0（纯噪声）走到 1（干净嵌入）。"
          },
          {
            "sym": "x",
            "desc": "编码器给出的干净嵌入，是这条直线的终点。"
          },
          {
            "sym": "ε",
            "desc": "标准高斯噪声，是这条直线的起点。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "问题在取整",
          "desc": "每一步都回到离散词元，取整误差会沿轨迹累积。"
        },
        {
          "icon": "🌊",
          "title": "连续路径",
          "desc": "让去噪留在连续空间，修正和引导都更容易做。"
        },
        {
          "icon": "🔑",
          "title": "只离散一次",
          "desc": "把离散化推迟到终点，是 ELF 的核心循环。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "嵌入：把词元放进连续的泥里",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "上一节确立了「去噪要留在连续空间」这个方向，但连续空间不是唯一的。本节要决定用哪种连续表示来承载语言。",
      "analogy": {
        "title": "换泥料",
        "text": "泥料的粗细与均匀度决定后面能不能推得动。语言也要先选一种连续表示。",
        "componentId": "clay-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "泥料选择台",
          "componentId": "ch2-embedding",
          "desc": "在四种连续表示之间切换，观察嵌入散点的紧致程度，并比较论文报告的困惑度-熵权衡。"
        }
      ],
      "insight": "表示方式本身就是设计选择：上下文嵌入把整句信息一起带进了连续空间。",
      "formula": {
        "lead": "训练时的目标很朴素：让网络预测的方向与真实方向一致。",
        "unicode": "L_MSE = E‖v_θ(z_t, t) − v‖²",
        "symbols": [
          {
            "sym": "L_MSE",
            "desc": "去噪分支的均方误差损失，越低越好。"
          },
          {
            "sym": "v_θ",
            "desc": "网络预测的速度，参数量与嵌入同形。"
          },
          {
            "sym": "z_t",
            "desc": "当前时刻的含噪嵌入，是网络的输入。"
          },
          {
            "sym": "v",
            "desc": "目标速度 x − ε，由这条直线的两端直接算出。"
          },
          {
            "sym": "E",
            "desc": "对时间、数据与噪声样本取期望。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧱",
          "title": "先选连续表示",
          "desc": "嵌入方法决定了后面所有步骤的上限。"
        },
        {
          "icon": "📐",
          "title": "上下文更全",
          "desc": "预训练上下文嵌入取得更好的困惑度-熵权衡。"
        },
        {
          "icon": "⚠️",
          "title": "联合学习最难",
          "desc": "可学习嵌入与去噪器互相拖累，表现最差。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "洞见：只在终点落款",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "有了连续表示，接下来的关键问题是：离散化究竟放在哪一步。本节直接比较「中途反复切块」与「终点只落款一次」两条路径。",
      "analogy": {
        "title": "最后落款",
        "text": "全程保持连续的泥形，收工时才刻上印记——这就是「只离散一次」。",
        "componentId": "clay-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "中途切块 vs 终点落款",
          "componentId": "ch3-once-vs-many",
          "desc": "按下「开始对比」后两侧在同一时间基准上同时推进：左边每一步都在切块，右边保持连续直到最后落款。",
          "figure": "/images/figure-2.png"
        }
      ],
      "insight": "论文把整条去噪轨迹留在不受限的连续嵌入空间，只在最后一步施加词元级监督。",
      "formula": {
        "lead": "要让网络用上自己上一步的判断，就把上一次的预测拼进输入。",
        "unicode": "x̂ = net_θ(z_t | x̂′, t)",
        "symbols": [
          {
            "sym": "x̂",
            "desc": "本次网络输出的干净嵌入预测。"
          },
          {
            "sym": "x̂′",
            "desc": "上一次的预测，作为自条件拼进输入。"
          },
          {
            "sym": "net_θ",
            "desc": "与去噪、解码共用的同一套权重。"
          },
          {
            "sym": "z_t",
            "desc": "当前时刻的含噪嵌入。"
          },
          {
            "sym": "t",
            "desc": "当前时间；推理时复用上一步预测，不增加前向次数。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "✂️",
          "title": "反复取整丢信息",
          "desc": "每切一次就丢一次轮廓细节，误差会累积。"
        },
        {
          "icon": "🪶",
          "title": "终点只付一次",
          "desc": "离散化集中在最后一步，代价只付一次。"
        },
        {
          "icon": "🧩",
          "title": "接得住成熟技巧",
          "desc": "连续轨迹让图像域的引导与采样方法可以直接搬来。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "连续时间的直线路径",
      "badge": "both",
      "badgeLabel": "基础 + 训练",
      "bridge": "前面说清了「在哪里离散」。本节给出路径本身：Flow Matching 用直线插值连接噪声与数据，速度可以解析地写出来。",
      "analogy": {
        "title": "沿直线推",
        "text": "两点之间走直路：手越接近终点，需要补的距离越小，权重也越大。",
        "componentId": "clay-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "速度与权重",
          "componentId": "ch4-velocity",
          "desc": "拖动「时间 t」，观察泥团在直线上的位置、速度箭头长度，以及右下角权重曲线的变化。"
        }
      ],
      "insight": "速度可以用解析式写出来，所以网络只需要预测干净嵌入 x，再由它换算速度。",
      "formula": {
        "lead": "已知直线的两端，就能把任意时刻的速度写成不依赖网络的表达式。",
        "unicode": "v(z_t, t) = (x − z_t) / (1 − t)",
        "symbols": [
          {
            "sym": "v",
            "desc": "当前位置的目标速度，等于 x − ε。"
          },
          {
            "sym": "z_t",
            "desc": "当前时刻的含噪嵌入。"
          },
          {
            "sym": "x",
            "desc": "干净嵌入，直线的终点。"
          },
          {
            "sym": "t",
            "desc": "连续时间；当 t 趋近 1 时分母趋近 0。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📏",
          "title": "直线让速度可解析",
          "desc": "速度不需要额外网络，直接从两端算出。"
        },
        {
          "icon": "⚖️",
          "title": "权重越接近终点越大",
          "desc": "误差权重含 1/(1−t)²，末段会被急剧放大。"
        },
        {
          "icon": "🚪",
          "title": "所以末步交给解码",
          "desc": "末段不适合继续用去噪损失，改由解码分支负责。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "引导：手感与 CFG",
      "badge": "both",
      "badgeLabel": "基础 + 训练",
      "bridge": "有了路径与目标，还需要控制生成往哪个方向走。本节引入自条件提供的条件信号，以及连续量上的分类器无关引导。",
      "analogy": {
        "title": "按样板",
        "text": "手上的力度越大，形状越贴合样板，但泥的随机手味也越少。",
        "componentId": "clay-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "引导强度",
          "componentId": "ch5-guidance",
          "desc": "选择引导尺度 ω，观察贴合度与多样性两条权衡条如何此消彼长。"
        }
      ],
      "insight": "自条件提供了条件信号，于是连续量上的 CFG 可以直接搬进来，并且能在训练时一次前向完成。",
      "formula": {
        "lead": "把有条件与无条件的预测做一次线性外推，就得到受控的速度场。",
        "unicode": "v_cfg(z_t | c) = ω · v(z_t | c) + (1 − ω) · v(z_t | ∅)",
        "symbols": [
          {
            "sym": "v_cfg",
            "desc": "受控后的速度场，训练时由单次前向直接建模。"
          },
          {
            "sym": "ω",
            "desc": "引导尺度，越大越贴合条件、多样性越低。"
          },
          {
            "sym": "c",
            "desc": "条件信号，来自自条件或前置的干净嵌入。"
          },
          {
            "sym": "∅",
            "desc": "无条件对照，把条件置零得到。"
          },
          {
            "sym": "v",
            "desc": "未加引导的速度预测。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎛️",
          "title": "引导是线性外推",
          "desc": "有条件与无条件预测按尺度加权组合。"
        },
        {
          "icon": "🎚️",
          "title": "越大越贴合",
          "desc": "困惑度下降，但熵（多样性）也随之下降。"
        },
        {
          "icon": "🧷",
          "title": "训练时 CFG",
          "desc": "把两次前向压成一次，推理不额外加价。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "采样：转轮步数与两种求解器",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "训练解决的是「怎么学」。本节回答推理时的事：怎么一步步把纯噪声推成一段文本，以及步数与求解器如何影响质量。",
      "analogy": {
        "title": "分步进刀",
        "text": "每一转都只推进一点；步子迈得越少，越需要有人扶稳。",
        "componentId": "clay-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "转轮步进",
          "componentId": "ch6-steps",
          "desc": "用「上一步 / 下一步 / 重置」逐步推进 32 步采样，泥形与右下角曲线会同步收敛。"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "ODE 与 SDE 同起跑",
          "componentId": "ch6-ode-sde",
          "desc": "按下「开始对比」，两侧在同一时间基准上出发：一边是确定的 ODE，一边是每步注入噪声的 SDE。"
        }
      ],
      "insight": "因为公式是连续时间的，确定性 ODE 与随机化 SDE 两种求解器都能直接套用。",
      "formula": {
        "lead": "推理就是把网络输出的速度场积分起来，从噪声走到数据。",
        "unicode": "dz_t / dt = v_θ(z_t, t)",
        "symbols": [
          {
            "sym": "z_t",
            "desc": "当前时刻的嵌入状态，起点是高斯噪声。"
          },
          {
            "sym": "t",
            "desc": "连续时间，从 0 积分到 1。"
          },
          {
            "sym": "v_θ",
            "desc": "网络输出的速度场，决定每一步往哪走。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🪜",
          "title": "采样是数值积分",
          "desc": "步数越多，积分越细，但推理越贵。"
        },
        {
          "icon": "🌪️",
          "title": "SDE 每步加少量噪声",
          "desc": "少步区间里它能明显减小误差累积。"
        },
        {
          "icon": "⏱️",
          "title": "步数与质量此消彼长",
          "desc": "论文以 32 步达到约 24 的生成困惑度。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "训练：一张网、两道工序",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "采样之前先要训练。本节说明 ELF 用同一套权重同时承担去噪与解码两类目标，以及两条损失怎么在同一批里混合。",
      "analogy": {
        "title": "两道工序",
        "text": "同一个师傅交替做拉坯和落款，两件事共用一双手。",
        "componentId": "clay-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "双工序合批",
          "componentId": "ch7-two-branch",
          "desc": "按「下一步」在去噪与解码两道工序之间切换，观察同一条批内两条损失的占比。"
        }
      ],
      "insight": "末步的解码被当作整条 Flow 轨迹的终点，而不是外挂上去的独立解码器。",
      "formula": {
        "lead": "终点这一步换成分类目标：把干净嵌入映射成词元并做交叉熵。",
        "unicode": "L_CE = E[ CrossEnt(W · x_θ(z̃), s) ]",
        "symbols": [
          {
            "sym": "L_CE",
            "desc": "解码分支的逐词元交叉熵，越低越好。"
          },
          {
            "sym": "W",
            "desc": "可学习的反嵌入矩阵，把嵌入映射到词表维度。"
          },
          {
            "sym": "x_θ",
            "desc": "网络在解码模式下输出的干净嵌入。"
          },
          {
            "sym": "z̃",
            "desc": "末步经过词元级腐蚀的输入，避免平凡输入。"
          },
          {
            "sym": "s",
            "desc": "真实词元序列，作为监督信号。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🔁",
          "title": "一步去噪、一步解码",
          "desc": "同一套权重靠 mode 标记切换两种目标。"
        },
        {
          "icon": "⚖️",
          "title": "默认 80% / 20%",
          "desc": "两个分支合批采样，不增加训练开销。"
        },
        {
          "icon": "🤝",
          "title": "省掉独立解码器",
          "desc": "共享权重让解码与去噪互相受益，流程更简单。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "架构：同一双手与收腰瓶颈",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "前面分别讲了两道工序与两种求解器，本节把它们放进同一个结构里：编码器、共享权重网络与反嵌入矩阵各司其职。",
      "analogy": {
        "title": "一双手",
        "text": "换捏法不换人；中间的腰收细一点，既省力又不丢形。",
        "componentId": "clay-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "同手双模",
          "componentId": "ch8-arch-map",
          "desc": "点击画布中的节点或下方按钮，切换去噪与解码模式，看激活路径和输出标注怎么变。"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "收腰瓶颈",
          "componentId": "ch8-bottleneck",
          "desc": "在「有瓶颈 128」与「无瓶颈」之间切换，比较腰部宽度与计算量条。"
        }
      ],
      "insight": "本章不引入新公式：去噪与解码的算式已经在前两章给出，这里只说明结构如何支撑它们。",
      "takeaways": [
        {
          "icon": "🧊",
          "title": "编码器只训练时用",
          "desc": "推理阶段不引入编码器，也不需要独立解码器。"
        },
        {
          "icon": "🪢",
          "title": "共享权重",
          "desc": "一张网同时做去噪与解码，靠 mode 标记区分。"
        },
        {
          "icon": "🩻",
          "title": "128 维瓶颈",
          "desc": "先把 512 维压到 128 维再展开，压低计算量。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "实用技巧：泥料、学徒与泥量",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "结构确定之后，落地成本取决于三个选择：用什么嵌入、要不要蒸馏、训练多少词元。本节把它们放到同一张账本上比较。",
      "analogy": {
        "title": "省泥配方",
        "text": "同样的成品，有的配方只用一小团泥。",
        "componentId": "clay-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "泥料账本",
          "componentId": "ch9-budget",
          "desc": "选择嵌入方案并拖动训练词元预算，比较与基线 500B 的用量差距。"
        }
      ],
      "insight": "本节不需要新公式：结论直接来自消融实验的对照，而不是新的推导。",
      "takeaways": [
        {
          "icon": "🧪",
          "title": "嵌入方案决定上限",
          "desc": "预训练上下文嵌入在权衡上最好。"
        },
        {
          "icon": "🎓",
          "title": "蒸馏可换少步",
          "desc": "蒸馏后的 ELF 在 1–32 步优于蒸馏基线。"
        },
        {
          "icon": "🧾",
          "title": "词元预算差 10 倍",
          "desc": "ELF 约用 45B，基线常超过 500B。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、对比与边界",
      "badge": "both",
      "badgeLabel": "基础 + 训练",
      "bridge": "最后一节把前面的机制换成可检验的数字：在相同协议下，步数、训练词元与生成质量各是什么水平，以及这些结论在哪里适用。",
      "analogy": {
        "title": "同台比试",
        "text": "同一张轮盘、同一团泥，看谁用更少转数做出更稳的形。",
        "componentId": "clay-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "同台比试",
          "componentId": "ch10-race",
          "desc": "按下「开始比试」，可在 OWT 无条件协议与条件任务口径之间切换，观察进度条与协议提示。"
        }
      ],
      "insight": "指标方向不同：生成困惑度越低越好，BLEU 与 ROUGE 越高越好，跨协议比较没有意义。",
      "takeaways": [
        {
          "icon": "🏁",
          "title": "更少步数更低困惑度",
          "desc": "OWT 上 32 步达到生成困惑度约 24。"
        },
        {
          "icon": "📚",
          "title": "翻译与摘要同规模最优",
          "desc": "De-En BLEU 26.4；XSum R1 36.0±0.13。"
        },
        {
          "icon": "🚧",
          "title": "结论有边界",
          "desc": "数值限于本文的数据集、协议与模型规模。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV142ur6sEZY",
      "title": "【Proof-Trivial】流匹配 (Flow Matching) 与扩散模型 (Diffusion Model)【MIT2026 中英字幕与讲义】",
      "reason": "直接讲解 ELF 所依赖的 Flow Matching 与扩散模型的对应关系，是本教程最贴题的背景延伸。",
      "views": "2577播放"
    },
    {
      "bvid": "BV1SEdWBXEqj",
      "title": "【π系列 EP01】π0：让一个模型控制所有机器人？Flow Matching + VLM 架构详解",
      "reason": "展示 Flow Matching 在具体模型中的工程落地，可作为方法应用的延伸参考。",
      "views": "1.2万播放"
    }
  ]
};
