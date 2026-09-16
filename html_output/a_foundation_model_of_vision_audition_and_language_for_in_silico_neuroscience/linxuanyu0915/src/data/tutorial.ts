import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "A foundation model of vision, audition, and language for in-silico neuroscience",
    "titleZh": "从感官刺激到脑响应：理解 TRIBE v2",
    "venue": "arXiv 2605.04326v1 · 2026",
    "authors": "Stéphane d’Ascoli · Jérémy Rapin · Yohann Benchetrit · Teon Brooks · Katelyn Begany · Joséphine Raugel · Hubert Banville · Jean-Rémi King",
    "affiliation": "FAIR at Meta · École Normale Supérieure – PSL",
    "domain": "多模态学习 · fMRI 脑编码 · Transformer · in-silico 神经科学",
    "coreProblem": "这里的 in-silico 指在计算机内模拟和复现神经科学实验。传统脑编码器常按被试、任务、脑区与模态拆分，难以在异质、跨研究的全脑数据中积累共享知识。",
    "coreInsight": "TRIBE v2 冻结视觉、听觉与语言特征提取器，用非线性 Transformer 整合长时间上下文，并通过已见或未见被试路线预测全脑 BOLD 响应。",
    "keywords": [
      "TRIBE v2",
      "脑编码",
      "多模态",
      "fMRI",
      "Transformer",
      "未见被试"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "旧方案：每项研究各自拟合。被试、任务、脑区与模态越多，专用路径越碎。",
      "componentId": "hero-fragmented"
    },
    "newMethod": {
      "desc": "TRIBE v2：统一整合视觉、听觉与语言特征，学习可跨任务、跨被试泛化的脑编码规律。",
      "componentId": "hero-unified"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "统一脑编码与外部泛化",
      "badge": "both",
      "badgeLabel": "方法与证据",
      "bridge": "这是一项脑编码任务：输入视觉、听觉与语言刺激，预测 fMRI 测得的 BOLD 响应。先区分两个问题：模型能否预测训练研究中的新刺激，以及能否推广到完全未见的研究与被试。",
      "analogy": {
        "title": "先看真实框架与数据划分",
        "text": "下面先看论文真实框架，再看训练研究与外部测试研究如何统一到同一个模型中。",
        "componentId": "analogy-ch1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "共享架构概览",
          "desc": "论文 Fig.1B 给出总体结构：文本、音频和视频首先通过各自冻结的预训练模型提取特征，再统一送入共享 Transformer；随后通过被试相关映射得到预测脑活动。",
          "figure": "./images/fig1-annotated.jpg",
          "figureLabel": "论文 Fig.1B · 原图",
          "componentId": "paper-figure-only"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "跨研究训练与独立测试",
          "desc": "论文使用四个 deep datasets 联合训练，并在研究内部保留不与训练刺激重叠的验证数据；此外，四个 broad datasets 完全不参与训练，用来检验跨研究与跨被试的外部泛化。两层测试回答不同的问题。",
          "figure": "./images/table1-annotated.jpg",
          "figureLabel": "论文 Table 1 · 原图",
          "componentId": "unified-coverage"
        }
      ],
      "insight": "统一模型共享表示，同时保留个体映射。训练研究中的留出刺激测试，与完全未见研究上的外部泛化，需要分别阅读。",
      "formula": {
        "lead": "编码方向与独立验证",
        "unicode": "视觉 / 听觉 / 语言刺激 x → TRIBE v2 → 全脑 BOLD ŷ<br/>4 个训练研究 → 4 个完全独立的外部测试研究",
        "symbols": [
          {
            "sym": "x",
            "desc": "视觉、听觉或语言刺激"
          },
          {
            "sym": "ŷ",
            "desc": "与实测 y 同一目标空间中的预测 BOLD"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧭",
          "title": "先辨方向",
          "desc": "TRIBE v2 是刺激到脑活动的编码器，不是脑解码器。"
        },
        {
          "icon": "👥",
          "title": "研究级留出",
          "desc": "外部测试研究完全不参与训练，这不是普通随机 train/test split。"
        },
        {
          "icon": "🧩",
          "title": "两层统一",
          "desc": "共享多模态表征，并跨独立研究与被试检验泛化。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "三条模态轨道如何对齐",
      "badge": "inf",
      "badgeLabel": "推理与理解",
      "bridge": "TRIBE v2 首先要解决两个不统一的问题——不同模态的特征维度不同，时间采样方式也不同。模型先分别规范三种模态，再把它们对齐到共同时间网格。<br/><span class=\"chapter2-direction\">对齐 = 维度统一 + 时间统一</span>",
      "analogy": {
        "title": "把三条轨道转成统一规格",
        "text": "类比：三条规格不同的音视频轨道，先分别转成统一格式，再对齐到同一时间轴。",
        "componentId": "analogy-ch2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "模态对齐器",
          "desc": "<span class=\"chapter2-subhead\">A. 维度统一</span>文本、音频和视频编码器的单层 embedding 维度分别为 <b>2048、1024 和 1280</b>。每个模态都在自己的路径内提取多个 intermediate layers，依次完成层分组、组内平均、组间拼接，再经 Linear 投影到 <b>384D</b> 并进行 LayerNorm。<br/><br/><span class=\"chapter2-subhead\">B. 时间统一</span>三种模态最终被放到 <b>2 Hz</b> 的共同时间网格上。文本在当前词之前最多使用 1024 个词的上下文；视频每个时间点读取此前约 4 秒、共 64 帧；音频使用 60 秒 chunk。",
          "componentId": "modality-aligner"
        }
      ],
      "insight": "<b>本页结论：</b>对齐不是把三种模态平均成一种信息，而是让文本、音频和视频的专家特征分别规范到统一维度和共同时间位置，再交给后续 Transformer 联合建模。<br/><span class=\"chapter2-result-line\">最终表示：3 × 384D = 1152D，时间网格为 2 Hz。</span>",
      "formula": {
        "lead": "三模态表示宽度",
        "unicode": "D_model = 3 × 384 = 1152",
        "symbols": [
          {
            "sym": "D",
            "desc": "每个模态投影后的宽度"
          },
          {
            "sym": "D_model",
            "desc": "三条模态都被表示时的拼接宽度"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📐",
          "title": "维度统一",
          "desc": "每个模态最终 384D。"
        },
        {
          "icon": "⏱️",
          "title": "时间统一",
          "desc": "共同 2 Hz 时间网格。"
        },
        {
          "icon": "🎧",
          "title": "因果边界",
          "desc": "音频 60 s chunk 内含未来上下文。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "为什么线性滤波还不够",
      "badge": "inf",
      "badgeLabel": "推理与理解",
      "bridge": "如果输入特征相同，为什么模型成绩仍会不同？本章先观察自然刺激下的编码结果，再比较 Deep FIR 的局部线性窗口与 TRIBE v2 的长时非线性上下文。",
      "analogy": {
        "title": "局部窗口与长上下文",
        "text": "类比：同样一段连续刺激，一个模型只看局部时间窗口，另一个模型能整合更长上下文。",
        "componentId": "analogy-ch3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "自然刺激下的全脑编码性能",
          "desc": "Figure 2A–C 先回答一个基本问题：TRIBE v2 预测出的脑活动分布是否与刺激模态相符。不同自然刺激下，模型在不同脑区呈现出符合神经功能组织的 encoding performance。",
          "componentId": "figure2-highlights"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "公平基线：Deep FIR vs Transformer",
          "desc": "Deep FIR 与 TRIBE v2 使用相同的 pretrained multimodal stimulus features，因此两者的差异并不是来自 Llama、Wav2Vec-BERT 或 V-JEPA 特征不同，而主要来自后续 temporal model：Deep FIR 以 9 TR 线性时间卷积建模局部窗口；TRIBE v2 用 Transformer 在约 100 s 的窗口中进行非线性长时上下文整合。",
          "componentId": "linear-vs-transformer"
        }
      ],
      "insight": "<b>本页结论：</b>在相同 pretrained stimulus features 下，TRIBE v2 的非线性长时上下文建模显著优于 Deep FIR 的局部线性时间映射；同时，性能随训练数据增加仍持续提升。<br/><span class=\"chapter3-boundary-line\">但这一结果是模型层面的比较，并不能直接证明人脑使用 Transformer 式计算。</span>",
      "formula": {
        "lead": "两种时间模型",
        "unicode": "Deep FIR：9 TR 线性卷积　｜　TRIBE v2：100 s Transformer context",
        "symbols": [
          {
            "sym": "TR",
            "desc": "fMRI 重复时间单位"
          },
          {
            "sym": "T",
            "desc": "Transformer 刺激上下文窗口"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "⚖️",
          "title": "输入公平",
          "desc": "Deep FIR 与 TRIBE v2 使用相同 pretrained stimulus features。"
        },
        {
          "icon": "🪟",
          "title": "时间建模不同",
          "desc": "Deep FIR 是局部线性滤波；TRIBE v2 使用长时非线性 Transformer。"
        },
        {
          "icon": "📈",
          "title": "结果更强",
          "desc": "TRIBE v2 显著优于 Deep FIR，并随更多训练数据继续提升。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "把刺激时间对准 BOLD 时间",
      "badge": "both",
      "badgeLabel": "方法与证据",
      "bridge": "跨时间整合之前，必须区分采样率转换与血流动力学对齐：它们是两件不同的事。",
      "analogy": {
        "title": "给延迟画面对准声音",
        "text": "类比：蓝色播放头沿静态波形移动，在五秒目标处完成同步。五秒是论文采用的数据配对规则，不是每个脑区都恒定的生理常数。",
        "componentId": "analogy-ch4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "时间对齐台",
          "desc": "播放目标 BOLD 时间轴，观察它始终配对到 5 秒之前的刺激。再切换到未做偏移的对照，理解血流动力学延迟。图中的 2 Hz 与 1 Hz 分别表示刺激特征和重采样 fMRI 的频率。",
          "componentId": "time-alignment"
        }
      ],
      "insight": "2 Hz→1 Hz 改变采样网格；5 秒偏移把更早的刺激与更晚的 BOLD 目标配对。",
      "formula": {
        "lead": "时间配对",
        "unicode": "T=100 s；f_stim=2 Hz → f_fMRI=1 Hz；ŷ[0,T] ← x_stim[-5,T-5]",
        "symbols": [
          {
            "sym": "T",
            "desc": "100 秒刺激上下文"
          },
          {
            "sym": "5 s",
            "desc": "论文预处理采用的协议偏移"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🕰️",
          "title": "窗口不是延迟",
          "desc": "T=100 s 描述上下文，不是血流延迟。"
        },
        {
          "icon": "🔽",
          "title": "池化到 1 Hz",
          "desc": "采样率转换服务于时间网格一致。"
        },
        {
          "icon": "🎯",
          "title": "五秒配对",
          "desc": "协议用更早刺激预测更晚 BOLD。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "缺一条轨道也能继续",
      "badge": "trn",
      "badgeLabel": "训练与适配",
      "bridge": "不同数据集并不总同时拥有三种刺激。训练时的模态丢弃让模型练习在缺轨条件下工作。",
      "analogy": {
        "title": "临时静音一条轨道",
        "text": "类比：蓝色静音游标经过一条静态轨道时，该轨变为斜线缺失态，预览仍由其余轨道继续。轨道是环境，监视器是唯一道具。",
        "componentId": "analogy-ch5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "模态丢弃模拟器",
          "desc": "亲手关闭文本、音频或视频，观察对应特征张量如何变成零，而网络结构与槽位数量保持不变。至少保留一种模态：这是论文训练时模态丢弃的约束。",
          "componentId": "modality-dropout"
        }
      ],
      "insight": "缺失输入显示为缺失，不伪装成活跃特征；稳健性训练也不等于所有组合精度相同。",
      "formula": {
        "lead": "训练遮蔽规则",
        "unicode": "P（单模态输入置零）=p_mod=0.3<br/>若文本、音频、视频全部置零，则重新采样",
        "symbols": [
          {
            "sym": "p_mod",
            "desc": "每种模态独立遮蔽概率"
          },
          {
            "sym": "masked",
            "desc": "该模态输入被置零并标为缺失"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎛️",
          "title": "独立遮蔽",
          "desc": "每种模态以 0.3 概率单独遮蔽。"
        },
        {
          "icon": "🛟",
          "title": "至少保留一条",
          "desc": "全遮蔽组合会重新采样。"
        },
        {
          "icon": "🚧",
          "title": "不承诺等精度",
          "desc": "稳健性不等于任意组合表现一致。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "同一模型，适配不同大脑",
      "badge": "trn",
      "badgeLabel": "训练与适配",
      "bridge": "共享时间表示之后，模型仍需决定为已见被试、完全未见被试或少量新数据的个体走哪条映射路线。",
      "analogy": {
        "title": "切换观众配置文件",
        "text": "类比：同一个蓝色配置拨盘在已保存档案、群体默认档案与新观众适配之间切换，目标是让同一预览符合当前观众路线。",
        "componentId": "analogy-ch6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "先读 Figure 3：零样本群体预测",
          "desc": "Figure 3A–B 的核心不是低秩参数，而是未见被试泛化：zero-shot TRIBE 对群体平均响应的预测，比大多数单个真人记录更接近群体平均；在高信噪比、重复刺激较多的 HCP 中，R_group 接近 0.4，约为中位被试 group-predictivity 的两倍。",
          "figure": "./images/fig3-generalization-finetuning.png",
          "figureLabel": "论文 Fig.3 · 原图",
          "componentId": "figure3-highlights"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "被试路线选择器",
          "desc": "Transformer 输出明确分叉：①已见被试按索引进入形状为 (S,D_model,N_targets) 的 subject-conditioned block；②未见被试完全绕过该张量，进入独立的 shared linear layer 来预测群体平均响应。训练时以 p_subj=0.1 走未见被试旁路，它不是 subject block 中的“平均被试槽位”。",
          "componentId": "subject-route"
        },
        {
          "kind": "module",
          "id": "6.3",
          "title": "低秩微调沙盘",
          "desc": "最后再看适配实现：每位新被试取一半数据用于适配（该训练部分最多约 1 小时），另一半用于测试；用群体平均映射的 rank=128 低秩分解初始化新 subject block，随后解冻全部 TRIBE 参数并微调 1 个 epoch。",
          "componentId": "finetune-rank"
        }
      ],
      "insight": "零样本群体预测和少样本个体微调回答不同问题，不应混成同一个分数。",
      "formula": {
        "lead": "被试映射与低秩初始化",
        "unicode": "Seen：W_subject ∈ ℝ^(S×D_model×N_targets)<br/>Unseen：独立 shared linear layer（训练旁路 p_subj=0.1）<br/>Fine-tune：L_avg ≃ U·Σ·Vᵀ，r=128",
        "symbols": [
          {
            "sym": "S",
            "desc": "训练中已见被试数量"
          },
          {
            "sym": "r",
            "desc": "低秩微调初始化的秩"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "👤",
          "title": "已见被试",
          "desc": "个体模块保留训练被试映射。"
        },
        {
          "icon": "👥",
          "title": "未见被试",
          "desc": "旁路线预测群体平均响应。"
        },
        {
          "icon": "🧰",
          "title": "有限数据适配",
          "desc": "rank 128 初始化后，全模型微调一个 epoch。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "训练、验证与防止虚高",
      "badge": "trn",
      "badgeLabel": "训练与适配",
      "bridge": "模型“学得像”不等于“验证得真”：训练目标、选择指标、刺激隔离和去趋势共同构成可信评估链。",
      "analogy": {
        "title": "校准参考镜头",
        "text": "类比：蓝色校准游标扫过静态波形，将红色慢漂移基线拉回绿色稳定线。它去掉的是虚高风险，不是美化画面。",
        "componentId": "analogy-ch7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "训练—验证校准台",
          "desc": "沿优化、调度、隔离、去趋势四步检查：训练以 MSE 为唯一损失且不加额外正则，Pearson 用于早停和模型选择；验证刺激不得与训练刺激重叠。编码分数先对每名被试、每个 parcel 汇集全部验证 TR 计算相关，再跨被试和 parcel 平均。",
          "componentId": "training-validation"
        }
      ],
      "insight": "去趋势会让表观 encoding score 下降，却能削弱长上下文模型利用慢漂移获得虚高分的捷径，因此验证结果更可信。",
      "formula": {
        "lead": "训练与验证使用不同量",
        "unicode": "MSE=(1/N)Σᵢ(yᵢ−ŷᵢ)²；验证 R=corr(y,ŷ)，越高越好",
        "symbols": [
          {
            "sym": "MSE",
            "desc": "训练时最小化的平均平方误差"
          },
          {
            "sym": "R",
            "desc": "按论文协议聚合的 Pearson 编码分数"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧪",
          "title": "目标分工",
          "desc": "训练用 MSE，选择模型用验证 Pearson。"
        },
        {
          "icon": "🔒",
          "title": "刺激隔离",
          "desc": "验证刺激与训练刺激无重叠。"
        },
        {
          "icon": "🧹",
          "title": "诚实去趋势",
          "desc": "降低漂移混杂比保住表面高分更重要。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "走进 TRIBE v2 的完整架构",
      "badge": "both",
      "badgeLabel": "方法与证据",
      "bridge": "现在把模态对齐、时间上下文、池化和被试路线组装成一条刺激到预测 BOLD 的完整路径。",
      "analogy": {
        "title": "打开当前工具面板",
        "text": "类比：蓝色游标经过素材、合轨、上下文与输出，右侧只打开当前工具面板。它只揭示当前变换，不搬运素材。",
        "componentId": "analogy-ch8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "架构检查器",
          "desc": "用播放、单步或阶段按钮走完一条脑编码路径：多层冻结特征、384D 规范、1152D 拼接、长上下文 Transformer、2 Hz→1 Hz 池化，再到已见或未见被试的输出路线。",
          "figure": "./images/fig1-approach.png",
          "figureLabel": "论文 Fig.1 · 原图",
          "componentId": "tribe-architecture"
        }
      ],
      "insight": "皮层 20,484 顶点和皮层下 8,802 体素是替代目标头，不能相加为一个输出。",
      "formula": {
        "lead": "主干尺寸",
        "unicode": "[2048,1024,1280] → 每模态 384 → D_model=1152；T=100 s；2 Hz→1 Hz",
        "symbols": [
          {
            "sym": "N_targets",
            "desc": "20,484 皮层顶点或 8,802 皮层下体素"
          },
          {
            "sym": "D_model",
            "desc": "三模态共同表示宽度"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧊",
          "title": "冻结专家",
          "desc": "三种预训练模型提取 2 Hz 特征。"
        },
        {
          "icon": "🧠",
          "title": "非线性上下文",
          "desc": "8 层、8 头在 100 秒内整合时间。"
        },
        {
          "icon": "🚦",
          "title": "路线互斥",
          "desc": "被试条件与目标头选择都有清晰边界。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "用数字大脑做实验并寻找功能地图",
      "badge": "inf",
      "badgeLabel": "推理与理解",
      "bridge": "固定实验刺激、时序和对比规则后，未见被试路线可以生成群体预测，用于复现协议内功能地图。",
      "analogy": {
        "title": "扫描预览中的响应区域",
        "text": "类比：蓝色放大镜扫过一个静态预览，皮层剪影只亮起对应区域。放大镜不创造反应，只帮助查看局部结构。",
        "componentId": "analogy-ch9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "计算机内实验协议",
          "desc": "先锁定刺激、时序与未见被试路线。视觉按 Methods §5.9 在刺激后 t=5 s 读取预测并减去其他类别均值；论文 Fig.4 caption 却写成对预测时间序列拟合 GLM，两处表述不一致，本教程保留并明确标注该差异。Fig.4 的 face 图片仅用于示意，不是实际 FaceBody 刺激。",
          "figure": "./images/fig4-5-protocol-detail.png",
          "figureLabel": "论文 Fig.4A–B / Fig.5A–B · 分面原图",
          "componentId": "insilico-map"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "视觉与语言定位结果",
          "desc": "再读预测与实测功能地图。语言任务必须分开：Bang 使用替代数据；Audio 随机呈现音频片段；只有 EmotionalPain/RSVP 为取得词级时间戳而走翻译→TTS→语音识别。Fig.5 caption 把第二项写成 ArchiSocial，而 Methods §5.9 写作 Audio；本教程按 Methods 使用 Audio。",
          "figure": "./images/fig4-5-results-detail.png",
          "figureLabel": "论文 Fig.4C–E / Fig.5C–E · 分面原图",
          "componentId": "insilico-results"
        },
        {
          "kind": "module",
          "id": "9.3",
          "title": "模型内部表示：ICA",
          "desc": "FastICA 的对象是 unseen-subject 最终映射权重矩阵，不是 fMRI 时间序列。五个成分无先后名次；Fig.6A 对 ICA 与 NeuroSynth 都只显示数值最高的 10% vertices，因此白/灰区域不等于“没有该功能”。",
          "figure": "./images/fig6-ica-detail.png",
          "figureLabel": "论文 Fig.6A–B · 分面原图",
          "componentId": "ica-explorer"
        },
        {
          "kind": "module",
          "id": "9.4",
          "title": "多模态脑地形",
          "desc": "Figure 7 是另一套 Algonauts 重训练/消融协议：文本=红、音频=绿、视频=蓝；洋红=text+video、黄=text+audio、青=video+audio。三模态相对最佳单模态的最高约 50% 增益主要位于颞—顶—枕交界（TPOJ），前额叶次之，并非全脑平均。",
          "figure": "./images/fig7-multimodality-detail.png",
          "figureLabel": "论文 Fig.7A–E · 分面放大原图",
          "componentId": "multimodal-map"
        }
      ],
      "insight": "IBC 对比、ICA 解释和 Algonauts 消融是三套证据；共享“空间地图”外观不意味着指标可混用。",
      "formula": {
        "lead": "协议内空间比较",
        "unicode": "R_space=corr(z_pred,z_measured)；FastICA(W_unseen), n_components=5",
        "symbols": [
          {
            "sym": "R_space",
            "desc": "IBC 协议内预测与实测空间图一致性"
          },
          {
            "sym": "5 个成分",
            "desc": "无先后名次的 ICA 成分"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🔬",
          "title": "复现实验协议",
          "desc": "计算机内实验不是自由生成。"
        },
        {
          "icon": "🗺️",
          "title": "ICA 无名次",
          "desc": "相关用于解释成分，不给成分排序。"
        },
        {
          "icon": "🌈",
          "title": "模态互补",
          "desc": "约 50% 是局部最大报告增益，不是全脑平均。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "成绩、边界与下一步",
      "badge": "both",
      "badgeLabel": "方法与证据",
      "bridge": "最后锁定评分规则：Figure 2、Figure 3 可在各自协议内比较，但跨数据集或跨评估协议不能把 Pearson、R_group 与 competition mean score 混成同一排行榜。",
      "analogy": {
        "title": "锁定交付评分",
        "text": "类比：蓝色播放头沿同一质量尺到达绿色交付标记。不同用途的检查单必须各自阅读，不能硬塞进同一排行榜。",
        "componentId": "analogy-ch10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "同标尺成绩与证据边界",
          "desc": "启动一次五项同协议成绩比较。下方论文表 2 给出 Algonauts 2025 挑战的正式名次与分数；随后用分卡阅读 Deep FIR、HCP、微调和局部多模态结果及作者限制。",
          "figure": "./images/table2-ranking.png",
          "figureLabel": "论文 Table 2 · 原图缩略证据",
          "componentId": "result-race"
        }
      ],
      "insight": "领先结果与清晰边界必须成对阅读；高编码分数不等于完整模拟了大脑。",
      "formula": {
        "lead": "相同符号不代表可横比",
        "unicode": "R=corr(y,ŷ)；R_group=corr(ŷ_unseen,y_group)",
        "symbols": [
          {
            "sym": "R",
            "desc": "具体数据协议中的编码分数"
          },
          {
            "sym": "R_group",
            "desc": "HCP 群体响应协议中的相关"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🏁",
          "title": "同表第一",
          "desc": "0.2146±0.0312 是架构谱系的挑战结果。"
        },
        {
          "icon": "🧱",
          "title": "协议分卡",
          "desc": "q值、R_group、倍数和区域增益不得共轴。"
        },
        {
          "icon": "🌍",
          "title": "边界真实",
          "desc": "fMRI、感官、行为和人群范围仍有限。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1T94y1w7zJ",
      "title": "磁共振数据MVPA分析入门",
      "reason": "补充理解多变量 fMRI 分析与脑响应模式；它是背景材料，不是本文讲解。",
      "cover": "https://i0.hdslb.com/bfs/archive/7a9b960f760b181830034bf92b12d6b33c2a4bfe.jpg",
      "views": "1811播放"
    },
    {
      "bvid": "BV1rJLtzMEfD",
      "title": "Transformer模型超强动画演示，直观理解注意力机制",
      "reason": "用动画补充 Transformer 与注意力机制背景，帮助理解 100 秒上下文整合。",
      "cover": "https://i1.hdslb.com/bfs/archive/274ad148cda98246fd5d17b14accc4d218acc124.png",
      "views": "1.9万播放"
    },
    {
      "bvid": "BV1sj411y7kM",
      "title": "多模态入门-ViT模型基础",
      "reason": "补充视觉表示与多模态入门背景；具体网络与论文方法并不等同。",
      "cover": "https://i2.hdslb.com/bfs/archive/ec7ab99dfc5a0bc2ed9dffe0621ff9d4045ab380.jpg",
      "views": "18.3万播放"
    }
  ]
};
