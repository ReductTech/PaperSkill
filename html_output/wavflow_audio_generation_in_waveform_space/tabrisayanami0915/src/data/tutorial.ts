import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "WavFlow: Audio Generation in Waveform Space",
    "titleZh": "WavFlow：波形空间中的音频生成",
    "venue": "arXiv 2026",
    "authors": "Feiyan Zhou, Luyuan Wang, Shoufa Chen, Zhe Wang, Zhiheng Liu, Yuren Cong, Xiaohui Zhang, Fanny Yang, Belinda Zeng (Meta AI, Northeastern University)",
    "affiliation": "Meta AI, Northeastern University",
    "domain": "多模态音频生成 / 条件流匹配 / 深度学习",
    "coreProblem": "音频生成通常依赖预训练音频 VAE 或 Codec。WavFlow 探索：能否绕过中间压缩表示，直接学习原始波形生成？",
    "coreInsight": "Waveform Patchify、振幅提升与 x-prediction 流匹配，结合大规模数据，使直接波形生成在论文所比较的基准上达到有竞争力的质量。",
    "keywords": [
      "WavFlow",
      "波形空间直接生成",
      "条件流匹配",
      "MMDiT",
      "音画时序同步",
      "视频生音频 (VT2A)"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "潜空间方法先以音频编码器构建训练表示；推理时在潜空间生成，再经解码器还原波形。中间压缩可能限制重构保真度。",
      "componentId": "ch1-codec-vs-raw"
    },
    "newMethod": {
      "desc": "WavFlow 从波形空间噪声开始积分，经 Unpatchify 输出波形，不需要预训练音频编码器或声码器；视觉与文本条件仍使用预训练编码器。",
      "componentId": "ch1-codec-vs-raw"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "直接波形生成：动机与边界",
      "badge": "inf",
      "badgeLabel": "核心问题",
      "bridge": "从训练表示和推理流程理解为何移除音频压缩层。",
      "analogy": {
        "title": "直接处理材料与借助模具 · 教学类比",
        "text": "可以把中间表示理解为模具。省去模具减少一个环节，但成品质量仍取决于加工能力；类比不代表真实声学机制。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "直接波形生成：动机与边界",
          "desc": "论文 §1–§3（第 1–6 页）比较潜空间与原始波形生成。连续 VAE 与离散 Codec 是不同路线，不应统一描述为 Codec 后必接 HiFi-GAN。WavFlow 直接建模波形，避免了音频编码与解码瓶颈，但生成质量仍取决于模型、训练数据及采样。",
          "componentId": "ch1-codec-vs-raw"
        }
      ],
      "insight": "无损的是分块与重排操作；不经过音频 Codec 并不保证生成音频没有误差。",
      "formula": {
        "lead": "公式与定义（依据本章标注的论文来源）",
        "unicode": "潜空间：z₀ → 条件生成 ẑ → Dec(ẑ)；WavFlow：x₀ → ODE(vθ,c) → Unpatchify → 后处理",
        "symbols": [
          {
            "sym": "x₀ / z₀",
            "desc": "相应生成空间中的噪声初态"
          },
          {
            "sym": "c",
            "desc": "视频和文本条件；仍依赖 CLIP 与 Synchformer"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧩",
          "title": "省去音频 Codec",
          "desc": "不再以预训练音频编码器的压缩表示作为生成目标。"
        },
        {
          "icon": "📐",
          "title": "保留重排信息",
          "desc": "Patchify 本身不丢采样点，不等同于整条生成流程无损。"
        },
        {
          "icon": "🎯",
          "title": "以评测判断质量",
          "desc": "论文报告部分指标领先，不能据此断言所有指标优于潜空间方法。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "波形分块与振幅尺度",
      "badge": "inf",
      "badgeLabel": "数据表达",
      "bridge": "区分 token 长度、音频采样率和预处理尺度。",
      "analogy": {
        "title": "分段整理一条长记录 · 教学类比",
        "text": "把长记录分成等长行，内容仍在；每行越长，单次阅读需要处理的内容越多。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "波形分块与振幅尺度",
          "desc": "§3.2、Appendix D：8 秒 16 kHz 音频有 128,000 个采样点。D=200 时重排为 C=640 个 token，每个 token 含连续的 200 个采样点，时长 12.5 ms。44.1 kHz 时 C=1764、每 token 约 4.54 ms。不整除时先补零，再在 Unpatchify 后截去填充。",
          "componentId": "ch2-waveform-patchify"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "Amplitude Lifting：RMS 归一化与 3.0× 尺度对齐",
          "desc": "§3.2 Eq. (4)、Appendix B：转单声道后，先按目标 RMS 0.33 缩放，截断到 [−1,1]，再乘 3。结果振幅位于 [−3,3]，分布仍不均匀。Table 5 比较不同预处理组合，支持作者采用 RMS 归一化与 3 倍缩放。",
          "componentId": "ch2-amplitude-lifting"
        }
      ],
      "insight": "增大 D 不会在重排时删除瞬态，而会增加单个 token 的建模难度；D=200 是论文所测设置中的质量与计算折中。",
      "formula": {
        "lead": "公式与定义（依据本章标注的论文来源）",
        "unicode": "x_lift = s_a · clamp((r* / rms(x)) · x, −1, 1),  r*=0.33, s_a=3.0",
        "symbols": [
          {
            "sym": "rms(x)",
            "desc": "波形振幅的均方根；不是能量本身"
          },
          {
            "sym": "s_a",
            "desc": "全局尺度因子，使音频振幅尺度更接近标准高斯先验"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📐",
          "title": "token 时长不是同步误差",
          "desc": "12.5 ms 对应 16 kHz；不能从这一数值推导实际声画同步精度。"
        },
        {
          "icon": "🔊",
          "title": "尺度接近而非分布相同",
          "desc": "归一化、clamp 与缩放不会把音频变成高斯分布。"
        },
        {
          "icon": "🔄",
          "title": "后处理并非无损逆变换",
          "desc": "生成后除以 3 并归一化至 −23 LUFS；clamp 和响度处理不能恢复原始录音。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "预测干净波形：流形假设的启发",
      "badge": "inf",
      "badgeLabel": "核心洞察",
      "bridge": "区分网络预测的对象与训练损失的度量空间。",
      "analogy": {
        "title": "先估计目的地，再计算方向 · 教学类比",
        "text": "先估计目的地对应 x-pred，再按当前位置求速度。类比不保证目的地估计总是正确。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "预测干净波形：流形假设的启发",
          "desc": "§3.1 与 §4.4：网络输出干净波形估计 x̂1，再代数转换为速度。作者借助流形假设解释 x-pred 的优势；这不是将输出硬性限制在某个低维线性子空间。Table 4 中 x-pred 在多数指标上更优，但论文明确指出 x-pred 与 v-pred 均可用于该框架。",
          "componentId": "ch3-manifold-xpred"
        }
      ],
      "insight": "流形假设提供解释视角，实验优势不意味着 v-pred 必然发散。",
      "formula": {
        "lead": "公式与定义（依据本章标注的论文来源）",
        "unicode": "x̂1 = fθ(x_t,t,c),   vθ = (x̂1 − x_t)/(1 − t),   t < 1",
        "symbols": [
          {
            "sym": "x̂1",
            "desc": "网络对干净波形的估计"
          },
          {
            "sym": "vθ",
            "desc": "相对于生成时间 t 的速度，非音频播放时间导数"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧭",
          "title": "结构化目标",
          "desc": "直接估计干净信号是本文采用的参数化方式。"
        },
        {
          "icon": "📊",
          "title": "比较有适用范围",
          "desc": "Table 4：x-pred + v-loss 的 FD 63.05、IS 15.58；v-pred + v-loss 为 77.19、13.48。"
        },
        {
          "icon": "🔗",
          "title": "目标与损失可分开选",
          "desc": "预测 x 不要求只使用 x-loss；可将其转换为速度后监督。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "训练插值与推理 ODE",
      "badge": "both",
      "badgeLabel": "数学框架",
      "bridge": "线性训练路径不等于每条生成轨迹都严格笔直。",
      "analogy": {
        "title": "规划路线与实际行进 · 教学类比",
        "text": "训练提供路线样例，推理依靠学到的方向行进；实际路径仍受估计和离散步长影响。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "训练插值与推理 ODE",
          "desc": "§3.1 Eq. (1)–(3)：训练时给定噪声 x0 和干净数据 x1，以 xt=(1−t)x0+t x1 构造样本，目标速度为 x1−x0。推理时没有已知 x1，需积分模型学到的速度场。下面动画只演示已知端点的训练插值，不运行 WavFlow。",
          "componentId": "ch4-flow-matching-ode"
        }
      ],
      "insight": "论文采用 50 步 Euler 采样；学习误差与数值积分误差依然存在，论文没有给出无误差或普遍快于扩散模型的保证。",
      "formula": {
        "lead": "公式与定义（依据本章标注的论文来源）",
        "unicode": "x_t=(1−t)x₀+t x₁；v*=x₁−x₀；dx_t/dt=vθ(x_t,t,c)",
        "symbols": [
          {
            "sym": "t",
            "desc": "从噪声到数据的生成时间，范围 [0,1]"
          },
          {
            "sym": "v*",
            "desc": "给定训练样本对的目标速度，非音频播放速度"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🛤️",
          "title": "训练路径",
          "desc": "对一个固定样本对做线性插值。"
        },
        {
          "icon": "⚙️",
          "title": "推理路径",
          "desc": "由网络预测的速度场逐步积分，终点并非预先给定。"
        },
        {
          "icon": "📊",
          "title": "步数是实验折中",
          "desc": "Appendix F 中 50 步以后总体收益有限，而非理论精度上限。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "双层条件：语义与时序",
      "badge": "both",
      "badgeLabel": "跨模态对齐",
      "bridge": "理解全局条件 cg 与包含它的帧级条件 ce。",
      "analogy": {
        "title": "乐谱主题与节拍提示 · 教学类比",
        "text": "主题和节拍共同帮助理解音乐；这里的帧级提示还包含全局主题信息。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "双层条件：语义与时序",
          "desc": "§3.2（第 5–6 页）：cg 是池化视觉特征、池化文本特征和生成时间嵌入之和。冻结 Synchformer 提供长度为 192 的同步特征序列，加入可学习分段位置嵌入后最近邻上采样至 C，再加 cg 得到 ce。两类条件通过 AdaLN 调制网络。",
          "componentId": "ch5-dual-conditioning"
        }
      ],
      "insight": "ce 已包含 cg。交互用于突出各条结构路径，论文没有报告只保留 cg 或 ce 的定量消融。",
      "formula": {
        "lead": "公式与定义（依据本章标注的论文来源）",
        "unicode": "c_g=Pool(v_clip)+Pool(e_text)+e_t；c_e=Nearest(v_sync+p_segment)+c_g",
        "symbols": [
          {
            "sym": "192",
            "desc": "同步特征序列长度，而非特征通道维度"
          },
          {
            "sym": "c_e",
            "desc": "形状 C×d 的帧级条件；最近邻插值是离散复制，不是平滑插值"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "语义条件",
          "desc": "视觉、文本与生成时间共同构成全局条件。"
        },
        {
          "icon": "⏱️",
          "title": "时序条件",
          "desc": "同步特征提供视频事件的时间信息。"
        },
        {
          "icon": "🎛️",
          "title": "联合调制",
          "desc": "双层条件并非互不依赖的两个开关。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "CFG 与采样步数的权衡",
      "badge": "inf",
      "badgeLabel": "采样推断",
      "bridge": "分开阅读固定步数的 CFG 扫描和固定 CFG 的步数扫描。",
      "analogy": {
        "title": "调节强调程度与检查次数 · 教学类比",
        "text": "更强强调或更多检查不必改善所有结果；需要观察具体指标的权衡。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "CFG 与采样步数的权衡",
          "desc": "Appendix F、Table 10（第 19–20 页）：在 WavFlow-M-16k、1M 数据规模、VGGSound-Val 上，CFG=2.5 的 FDPaSST 最低（108.19），CFG=4.5 的 IS 和 IB 最高（16.42、0.33）。论文采用 CFG=4.5、50 步作为默认折中，没有报告所有 CFG 与步数的笛卡尔组合。",
          "componentId": "ch6-cfg-ode-space"
        }
      ],
      "insight": "CFG=7.0 时 FD 变差不能直接证明过拟合或模式崩溃。50 到 100 步总体收益有限，但 FDPANNs 仍从 9.58 改善至 9.41。",
      "formula": {
        "lead": "公式与定义（依据本章标注的论文来源）",
        "unicode": "v̂θ=(1+w)vθ(x_t,t,c)−w vθ(x_t,t,∅)",
        "symbols": [
          {
            "sym": "w",
            "desc": "沿用论文 Eq. (5) 的约定，w=0 去掉额外引导；表中 CFG 默认值为 4.5"
          },
          {
            "sym": "∅",
            "desc": "学习到的空条件；VT2A 训练时视觉与文本各以 10% 概率独立替换；T2A 设置仅对文本 dropout（Table 6）"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "⚖️",
          "title": "指标并非同时最优",
          "desc": "FD、IS、IB 和 DeSync 反映不同方面。"
        },
        {
          "icon": "🚀",
          "title": "50 步是默认配置",
          "desc": "不是所有模型和数据条件下的普遍最优值。"
        },
        {
          "icon": "🔄",
          "title": "跨任务能力与训练设置",
          "desc": "空视觉条件支持 T2A；Appendix A 明确 AudioCaps 模型按 T2A 数据混合单独训练。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "x-prediction 与 v-loss",
      "badge": "trn",
      "badgeLabel": "训练目标",
      "bridge": "生成时间上的加权误差，不是音频时间导数惩罚。",
      "analogy": {
        "title": "同一误差采用不同权重 · 教学类比",
        "text": "可以在不同学习阶段改变误差的权重；权重变化并不自动对应某种音频频段。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "x-prediction 与 v-loss",
          "desc": "§3.1 Eq. (3)、Table 4：网络预测 x̂1，损失比较模型速度与目标速度。代数消去 xt 后，v-loss 等价于按 1/(1−t)² 加权的波形平方误差。这里 t 是流匹配生成时间，不能据此声称损失显式增强高频或求取音频播放时间导数。",
          "componentId": "ch7-vloss-stepper"
        }
      ],
      "insight": "Table 4 中 v-loss 的 FDPaSST 与 IS 更优，而 x-loss 的 FDPANNs、KL 和 IB 更优；作者按总体权衡选用 v-loss。",
      "formula": {
        "lead": "公式与定义（依据本章标注的论文来源）",
        "unicode": "L_v=E[||(x̂1−x_t)/(1−t)−(x₁−x_t)/(1−t)||²]=E[||x̂1−x₁||²/(1−t)²]",
        "symbols": [
          {
            "sym": "等式右侧",
            "desc": "由论文 Eq. (3) 代数推导；没有显式频率权重"
          },
          {
            "sym": "t < 1",
            "desc": "速度恢复分母在端点 t=1 为零，数值实现需避免直接在该端点求值"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "参数化与损失解耦",
          "desc": "网络输出 x，监督可以定义在速度空间。"
        },
        {
          "icon": "📊",
          "title": "真实实验权衡",
          "desc": "x-loss 的 FDPANNs 4.86 优于 v-loss 6.21；两者 DeSync 都为 0.50。"
        },
        {
          "icon": "🌊",
          "title": "频率结论来自实测解释",
          "desc": "作者用 PaSST 的评测特征讨论保真度，而非提出显式高频导数损失。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "MMDiT 结构与 RoPE 对齐",
      "badge": "trn",
      "badgeLabel": "网络架构",
      "bridge": "先进行多模态联合处理，再用音频块细化输出。",
      "analogy": {
        "title": "联合排练与单声部练习 · 教学类比",
        "text": "可用合奏后再练单声部理解结构分工；论文未证明此设计会消除视觉干扰或杂散噪声。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "MMDiT 结构与 RoPE 对齐",
          "desc": "§3.2：M 版本采用 4 个联合块和 8 个音频块，约 624M 参数；L 版本为 7+14 块，约 1.03B 参数。两者隐藏维度 896、14 个注意力头。音频与视觉使用卷积输入块，文本使用线性投影；输出头为 AdaLN 与 kernel=7 的 1D 卷积。",
          "componentId": "ch8-mmdit-blocks"
        }
      ],
      "insight": "视频 RoPE 频率按 C/Nclip 缩放，文本不使用该时序 RoPE。10 倍仅对应 C=640、Nclip=64 的示例，不能泛化为所有采样率。",
      "formula": {
        "lead": "公式与定义（依据本章标注的论文来源）",
        "unicode": "ω_visual=ω_audio·C/N_clip；16kHz:640/64=10；44.1kHz:1764/64=27.5625",
        "symbols": [
          {
            "sym": "C",
            "desc": "音频 token 数；8 秒、D=200 时随采样率变化"
          },
          {
            "sym": "N_clip",
            "desc": "视觉 CLIP 特征长度，此例为 64"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧩",
          "title": "两段结构",
          "desc": "联合块处理多模态，后续块处理音频。"
        },
        {
          "icon": "📐",
          "title": "位置编码按长度匹配",
          "desc": "让对应相对时刻具有匹配的旋转相位。"
        },
        {
          "icon": "🔊",
          "title": "输出与后处理",
          "desc": "Unpatchify 后除以尺度因子并进行响度归一化。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "数据清洗、混合与训练",
      "badge": "trn",
      "badgeLabel": "数据工程",
      "bridge": "区分质量过滤、类别平衡与最终训练混合。",
      "analogy": {
        "title": "筛选材料再安排配比 · 教学类比",
        "text": "合格材料池、均衡后的池与最终混合不是同一个数量。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "数据清洗、混合与训练",
          "desc": "§4.1、Figure 3：Media 质量过滤后约 50M，按 VGGSound 类别分布平衡后形成 5M 池。公开 VGGSound 与 T2A 数据分别从 100K、150K 经时移增广变成 200K、300K。最终 VT2A 是 5M+200K；T2A 是 1M+300K，论文简写为约 5M 和约 1M。",
          "componentId": "ch9-data-curation"
        }
      ],
      "insight": "Appendix C 比较不同混合：稀疏 VGGSound 与公开 T2A 混合发散；密集描述版本可稳定但部分指标较差。视觉锚点是作者针对实验提出的解释，不是普遍消除语义差异的保证。",
      "formula": {
        "lead": "公式与定义（依据本章标注的论文来源）",
        "unicode": "保留条件：时长≥8s；静音占比≤80%；PQ≥6.0；排除每类 PANNs 置信度最低 10%",
        "symbols": [
          {
            "sym": "PQ",
            "desc": "Audiobox Aesthetics 的品质评分"
          },
          {
            "sym": "训练轮次",
            "desc": "16 kHz 主设置约 400 epochs；44.1 kHz 微调及 200K 设置约 650 epochs"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧹",
          "title": "过滤后再平衡",
          "desc": "50M 指质量过滤后的媒体片段数。"
        },
        {
          "icon": "🌉",
          "title": "数据混合影响训练",
          "desc": "稀疏 VGGSound + Media 是最终 VT2A 选择；不能说任意混合加视频都能修复。"
        },
        {
          "icon": "📈",
          "title": "训练配置需区分",
          "desc": "VT2A batch 10,752；T2A 单独训练、batch 8,192；44.1 kHz 在 200K VGGSound 上微调，batch 1536。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "评测结果与适用边界",
      "badge": "both",
      "badgeLabel": "全景评估",
      "bridge": "按模型、采样率和指标逐项比较。",
      "analogy": {
        "title": "看多项成绩而非一个总分 · 教学类比",
        "text": "不同指标衡量不同方面；某一项最好并不代表所有方面领先。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "评测结果与适用边界",
          "desc": "Table 1：WavFlow-L-44.1kHz 的 FDPaSST 55.82 是所比较方法中最佳，DeSync 为 0.46；L-16kHz 为 59.98、0.44。Table 2：M-16kHz 在 AudioCaps 的 FDPANNs 10.63、IS 12.62 最佳，但 FDVGG 与 CLAP 并非最佳。原始波形建模取得有竞争力的结果，不意味着全面优于潜空间方法。",
          "componentId": "ch10-results-benchmark"
        }
      ],
      "insight": "Table 11 的 IS 8.95 是自动评测指标，不是十分制人工音质分；WavFlow 的 IB 0.24 低于 MMAudio 0.27 和 MovieGen 0.36。",
      "formula": {
        "lead": "公式与定义（依据本章标注的论文来源）",
        "unicode": "VGGSound-Test FDPaSST↓：MMAudio-L-44.1kHz 60.60；WavFlow-L-16kHz 59.98；WavFlow-L-44.1kHz 55.82",
        "symbols": [
          {
            "sym": "FDPaSST",
            "desc": "基于 PaSST 特征的 Fréchet 距离，越低越好；不是直接的频谱误差"
          },
          {
            "sym": "DeSync",
            "desc": "论文的音画同步度量，越低越好；不能将显示值直接称为毫秒或微秒精度"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🏆",
          "title": "领先指标有范围",
          "desc": "比较对象、测试划分与输入条件以指定 v1 论文为准。"
        },
        {
          "icon": "🎬",
          "title": "合成视频泛化",
          "desc": "MovieGen-Audio-Bench 没有真实参考音频，使用无参考指标。"
        },
        {
          "icon": "🔎",
          "title": "当前局限",
          "desc": "尚不支持有意义语言的语音与显式歌唱合成；更大语言数据与细粒度描述是未来方向。"
        }
      ]
    }
  ]
};
