import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Probing Low-Level Acoustic Attribute Encoding in CLAP Audio Embeddings",
    "titleZh": "探测 CLAP 音频嵌入中的低层声学属性编码",
    "venue": "DAFx26 · 2026",
    "authors": "Héctor Martel · Joe Hennessy-Priest · Taemin Cho",
    "affiliation": "BandLab Technologies, Singapore",
    "domain": "音频表示学习 · 可解释性 · 回归 probing",
    "coreProblem": "CLAP 被广泛用作通用音频特征提取器，但最终 embedding 中的低层声学属性是否存在、是否线性可读、能否跨域复用仍不清楚。",
    "coreInsight": "冻结 LAION-CLAP，只训练复杂度递增的 probe，并在单因素增强与多数据域上比较，就能把可恢复性、线性可读性和跨域几何一致性拆开检验。",
    "keywords": [
      "CLAP",
      "Audio embedding",
      "Probing",
      "RT60 · LUFS · SC · RP",
      "Linear vs non-linear",
      "R² · MAE · r"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "<b>传统读法：</b>只看最终任务分数，知道“能不能用”，却很难知道低层属性到底怎样被编码。",
      "componentId": "hero-compare"
    },
    "newMethod": {
      "desc": "<b>本文 probing：</b>固定一个属性，冻结 CLAP 得到 z，再用 Linear、MLP、Kernel 读出并比较几何形状。",
      "componentId": "hero-compare"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "先问：属性真的在 CLAP 里吗",
      "badge": "inf",
      "badgeLabel": "问题",
      "bridge": "先把论文的核心疑问钉住：<b>一个模型能完成任务</b>，不等于我们知道低层声学属性怎样存在于它的表示里。",
      "analogy": {
        "title": "先把问题调准",
        "text": "调音时，听见“好听”并不等于知道混响、响度或频谱分别改变了多少。论文先把目标属性单独拿出来，再问冻结表示能否读出它。",
        "componentId": "audio-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "两种问法的对照",
          "desc": "按下开始，让传统的“只看任务分数”和本文的 probing 从同一个音频条件出发。动画结束后，比较哪一种问法真正回答了“属性信息在哪里”。",
          "componentId": "audio-lab"
        }
      ],
      "insight": "先固定属性，再冻结 CLAP，最后比较读出器，才能把“信息存在”“怎么编码”“能否跨域”分开。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "核心问题",
          "desc": "本文问的是低层属性能否从最终 embedding 被恢复。"
        },
        {
          "icon": "🔍",
          "title": "读出而非重训",
          "desc": "probing 不更新 CLAP，只测试已有表示。"
        },
        {
          "icon": "🧭",
          "title": "三层判断",
          "desc": "可恢复、线性可恢复、跨域可迁移不是同一件事。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "从波形到 512 维 z",
      "badge": "inf",
      "badgeLabel": "表示",
      "bridge": "上一章确定了问题，这一章限定观察窗口：probe <b>不能偷看原始波形或增强标签</b>，它只接收冻结编码器吐出的 z。",
      "analogy": {
        "title": "话筒先放到正确位置",
        "text": "论文的读出器不能偷看原始波形，也不能偷看增强标签。它只接收冻结音频编码器输出的 z ∈ R^512。",
        "componentId": "audio-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "选择表示阶段",
          "desc": "点击三个阶段，观察输入从双通道波形变成单声道，再被压缩成所有 probe 唯一能看到的 512 维表示。",
          "componentId": "audio-lab"
        }
      ],
      "formula": {
        "lead": "论文的输入链路可以压缩成一条很重要的边界：",
        "unicode": "<span class=\"sym\">x</span> ∈ R<sup>C×T</sup> → <span class=\"sym\">x′</span> ∈ R<sup>1×T</sup> → <span class=\"sym\">z</span> ∈ R<sup>512</sup>",
        "symbols": [
          {
            "sym": "x",
            "desc": "原始多通道波形，形状为 R^(C×T)。"
          },
          {
            "sym": "x′",
            "desc": "下混后的单声道波形，形状为 R^(1×T)。"
          },
          {
            "sym": "z",
            "desc": "冻结 LAION-CLAP 音频编码器输出的 512 维 embedding，也是三个 probe 的唯一输入。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎙️",
          "title": "输入有边界",
          "desc": "probe 不能直接使用原始波形。"
        },
        {
          "icon": "📦",
          "title": "表示是瓶颈",
          "desc": "全部属性判断都压在 z 上。"
        },
        {
          "icon": "📐",
          "title": "维度已知",
          "desc": "LAION-CLAP 音频编码器在本文中输出 512 维。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "四个属性，四种可测目标",
      "badge": "inf",
      "badgeLabel": "目标",
      "bridge": "有了固定的表示，还要把“声音特征”变成有单位的标量。这里先认识四个目标，再看同一谱属性换尺度后会发生什么。",
      "analogy": {
        "title": "先决定要量哪一个旋钮",
        "text": "“声音更亮”“空间更大”都太宽泛。论文把它们拆成有单位、有范围、可以逐样本计算的四个标量目标。",
        "componentId": "audio-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "选择目标属性",
          "desc": "点击 RT60、LUFS、SC 或 RP，观察同一间录音棚里的测量表如何换单位。每次只选择一个目标，避免把四个问题混成一个分数。",
          "componentId": "audio-lab"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "拖动 SC，看线性尺度为何会变",
          "desc": "拖动频率重心，右侧同步显示相对 A4 的半音坐标。两个目标描述同一谱属性，但它们的数值间距并不一样。",
          "componentId": "audio-lab"
        }
      ],
      "formula": {
        "lead": "SC 是频谱的加权重心，RP 则把它换成相对 440 Hz 的对数半音尺度：",
        "unicode": "<span class=\"sym\">SC</span> = Σ<sub>k</sub> f<sub>k</sub>|X<sub>k</sub>| / Σ<sub>k</sub>|X<sub>k</sub>|　；　<span class=\"sym\">RP</span> = 12 log<sub>2</sub>(<span class=\"sym\">SC</span> / <span class=\"sym\">f<sub>ref</sub></span>)",
        "symbols": [
          {
            "sym": "SC",
            "desc": "Spectral Centroid，幅度频谱的加权中心，单位是 Hz。"
          },
          {
            "sym": "RP",
            "desc": "Relative Pitch，把 SC 变换为相对参考音高的半音数。"
          },
          {
            "sym": "fref",
            "desc": "参考频率，论文取 A4 = 440 Hz。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎚️",
          "title": "目标要有单位",
          "desc": "否则无法构造 ground truth 和误差。"
        },
        {
          "icon": "🔁",
          "title": "SC 与 RP 相连",
          "desc": "它们共享谱内容，但使用线性 Hz 与对数半音两种尺度。"
        },
        {
          "icon": "🧠",
          "title": "尺度影响读出",
          "desc": "同一个声学变化在不同坐标下可能呈现不同几何形状。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "Probe 是给 embedding 装一把尺子",
      "badge": "both",
      "badgeLabel": "方法",
      "bridge": "目标已经明确，接下来用复杂度递增的读出器提问：如果直尺贴不上轨迹，问题可能在 <b>路径形状</b>，而不在信息是否存在。",
      "analogy": {
        "title": "同一条痕迹，尺子要多灵活",
        "text": "直尺贴不上弯曲轨迹，并不说明轨迹不存在。论文用 Linear、MLP 和 Kernel 逐步增加读出器的形状能力。",
        "componentId": "audio-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "切换三种 probe",
          "desc": "在同一张技术图上切换 Linear、MLP 和 Kernel。路径形状、参数规模和代表性的 VCTK 结果会一起更新。",
          "componentId": "audio-lab"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "点击轨迹点看误差从哪里来",
          "desc": "选择轨迹上的 A、B、C 三个位置，观察同一条直线在中段弯曲和边界尺度处分别怎样产生残差。",
          "componentId": "audio-lab"
        }
      ],
      "insight": "Linear 失败而 MLP/Kernel 成功，首先说明需要检查几何形状，而不是直接宣布信息不存在。",
      "formula": {
        "lead": "Linear probe 用一根方向和一个偏置把 512 维表示读成一个标量：",
        "unicode": "<span class=\"sym\">ŷ</span> = <span class=\"sym\">w</span><sup>⊤</sup><span class=\"sym\">z</span> + <span class=\"sym\">b</span>",
        "symbols": [
          {
            "sym": "ŷ",
            "desc": "probe 对单个声学属性的标量预测。"
          },
          {
            "sym": "w",
            "desc": "R^512 中的 Linear 权重向量，它定义了最能预测目标的 feature axis。"
          },
          {
            "sym": "z",
            "desc": "冻结 CLAP 的 512 维音频 embedding。"
          },
          {
            "sym": "b",
            "desc": "Linear probe 的标量偏置。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📏",
          "title": "Linear 是方向测试",
          "desc": "它用 513 个参数检验单一主方向。"
        },
        {
          "icon": "🪢",
          "title": "MLP 会弯曲",
          "desc": "约 32.9k 参数提供有限非线性。"
        },
        {
          "icon": "🟣",
          "title": "Kernel 是参照",
          "desc": "灵活但计算更重，不能把它的表现直接当成 CLAP 的线性结构。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "单因素增强：只改变一个属性",
      "badge": "both",
      "badgeLabel": "控制",
      "bridge": "如果混响、响度和谱内容同时变化，probe 可能学到增强流程的副作用。本章解释论文如何把实验变成一个更可信的控制变量问题。",
      "analogy": {
        "title": "一次只推一个推子",
        "text": "如果混响、响度和谱内容一起变化，probe 学到的方向就可能只是增强流程的副作用。论文为每个属性单独生成一份数据副本。",
        "componentId": "audio-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "调整目标强度",
          "desc": "拖动一个目标推子，观察目标范围覆盖和混淆风险如何变化。另一个属性只有在你显式打开错误示例时才会一起变化。",
          "componentId": "audio-lab"
        }
      ],
      "takeaways": [
        {
          "icon": "🧪",
          "title": "单因素增强",
          "desc": "每个样本一次只施加一个目标属性扰动。"
        },
        {
          "icon": "🧷",
          "title": "避免共变",
          "desc": "否则 learned direction 可能是 pipeline confound。"
        },
        {
          "icon": "⚖️",
          "title": "范围要平衡",
          "desc": "目标值覆盖感知范围，才不会只学到局部。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "结果不能只看一个分数",
      "badge": "both",
      "badgeLabel": "指标",
      "bridge": "有了目标和 probe，还要知道如何读结果。MAE、R² 和 Pearson r 分别回答误差、解释方差和方向问题，不能混成一个排行榜。",
      "analogy": {
        "title": "同一根指针，三种读法",
        "text": "平均差多少、解释了多少方差、方向是否一致，是三种不同的问题。论文因此同时报告 MAE、R² 和 Pearson r。",
        "componentId": "audio-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "逐步检查三个指标",
          "desc": "按步骤查看 MAE、R² 和 Pearson r。示意数值只帮助理解指标含义，论文结果仍以带 dataset、单位和方向的表格为准。",
          "componentId": "audio-lab"
        }
      ],
      "formula": {
        "lead": "论文用两个核心公式把误差和解释方差写清楚：",
        "unicode": "<span class=\"sym\">MAE</span> = (1/<span class=\"sym\">N</span>)Σ|<span class=\"sym\">yᵢ</span>−<span class=\"sym\">ŷᵢ</span>|　；　<span class=\"sym\">R²</span> = 1 − Σ(<span class=\"sym\">yᵢ</span>−<span class=\"sym\">ŷᵢ</span>)² / Σ(<span class=\"sym\">yᵢ</span>−<span class=\"sym\">ȳ</span>)²",
        "symbols": [
          {
            "sym": "MAE",
            "desc": "Mean Absolute Error，原单位的平均绝对误差，越低越好。"
          },
          {
            "sym": "N",
            "desc": "评估样本数量。"
          },
          {
            "sym": "R²",
            "desc": "Coefficient of Determination，解释目标方差的比例，越高越好；负值表示不如预测均值。"
          },
          {
            "sym": "r",
            "desc": "Pearson correlation，预测与真实值的线性方向关联，越高越好，负值表示方向相反。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📉",
          "title": "MAE 看原单位",
          "desc": "不同属性的 MAE 不能不加条件地横向比较。"
        },
        {
          "icon": "📊",
          "title": "R² 看方差",
          "desc": "负值是明显的失败信号。"
        },
        {
          "icon": "🧭",
          "title": "r 看方向",
          "desc": "高 r 仍可能有尺度校准问题。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "从噪声到母带：数据域改变难度",
      "badge": "trn",
      "badgeLabel": "数据",
      "bridge": "同一个属性在不同内容域里不一定同样容易读出。本章把五个数据集和它们的切分协议放在同一张可检查的桌面上。",
      "analogy": {
        "title": "先知道在哪个房间测",
        "text": "White Noise 只有增强变化，NSynth 是单音，VCTK 是语音，MusDB18HQ 与 SonicMaster 则逐步接近真实音乐制作。",
        "componentId": "audio-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "点击数据集",
          "desc": "点击一个数据域，查看样本规模、内容复杂度和一条带协议的代表性结果。这里不把不同属性和不同单位强行排成一个总榜。",
          "componentId": "audio-lab"
        }
      ],
      "takeaways": [
        {
          "icon": "🧱",
          "title": "复杂度阶梯",
          "desc": "五个域从受控噪声走向真实母带音乐。"
        },
        {
          "icon": "🚫",
          "title": "防止泄漏",
          "desc": "VCTK、NSynth 和音乐数据使用相应的 speaker/instrument/song split。"
        },
        {
          "icon": "📝",
          "title": "结果要带协议",
          "desc": "同一个 R² 只有在 dataset-feature-probe 条件一致时才可比较。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "线性方向：可读出不等于可迁移",
      "badge": "trn",
      "badgeLabel": "几何",
      "bridge": "Linear probe 找到一根方向，但不同数据集各自找到的方向是否一致，是另一个几何问题。这里把“域内好用”和“跨域共用”分开。",
      "analogy": {
        "title": "同一把尺，能不能放进另一间房",
        "text": "Linear probe 找到的是一根 embedding 方向。论文再比较不同数据集独立训练出的方向，检查它们是否真的指向相近的结构。",
        "componentId": "audio-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "拖动投影点",
          "desc": "拖动一个教学示意点，观察归一化投影 p 和 RT60 预测如何沿主要方向变化，再切换两个论文报告过的 dataset pair 比较轴的一致性。",
          "componentId": "audio-lab"
        }
      ],
      "formula": {
        "lead": "把 512 维 embedding 投到 Linear 方向上，再用绝对余弦比较不同数据集的轴：",
        "unicode": "<span class=\"sym\">p</span> = <span class=\"sym\">w</span><sup>⊤</sup><span class=\"sym\">z</span> / ||<span class=\"sym\">w</span>||　；　cos(<span class=\"sym\">wᵢ</span>,<span class=\"sym\">wⱼ</span>) = |<span class=\"sym\">wᵢ</span><sup>⊤</sup><span class=\"sym\">wⱼ</span>| / (||<span class=\"sym\">wᵢ</span>|| ||<span class=\"sym\">wⱼ</span>||)",
        "symbols": [
          {
            "sym": "p",
            "desc": "归一化后的标量投影，论文 Figure 3 用它作为横轴。"
          },
          {
            "sym": "w",
            "desc": "Linear probe 权重向量，也就是属性方向。"
          },
          {
            "sym": "cos",
            "desc": "两个方向的绝对余弦相似度；绝对值把 w 与 -w 视为同一条轴。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📍",
          "title": "方向可读",
          "desc": "w 把 512 维表示压到一个属性投影。"
        },
        {
          "icon": "🔗",
          "title": "方向可比",
          "desc": "pairwise cosine 检验不同数据集是否共享轴。"
        },
        {
          "icon": "🧩",
          "title": "RP 更特殊",
          "desc": "域内能读出，不代表跨 speech、notes、noise、music 共用方向。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "换模型：振幅不变性会抹掉 LUFS",
      "badge": "trn",
      "badgeLabel": "泛化",
      "bridge": "如果结论只在一个 checkpoint 上成立，还不能知道它来自音频预训练的共同规律，还是来自某个模型的架构选择。",
      "analogy": {
        "title": "换一台监听器再听一次",
        "text": "同样是音频 embedding，不同模型可能保留或消除全局振幅。Table 3 让我们看到：LUFS 的可读性尤其依赖架构。",
        "componentId": "audio-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "选择音频模型",
          "desc": "选择一个 embedder，查看 VCTK-Corpus 上四个属性的 R² 条形比较。红色只表示该属性在这个模型与协议下接近失败。",
          "componentId": "audio-lab"
        }
      ],
      "takeaways": [
        {
          "icon": "🔄",
          "title": "趋势可泛化",
          "desc": "RT60、SC、RP 的总体模式在额外模型中延续。"
        },
        {
          "icon": "🔇",
          "title": "响度会消失",
          "desc": "振幅归一化会让 LUFS 无法从后续表示恢复。"
        },
        {
          "icon": "⚠️",
          "title": "别过度归因",
          "desc": "不同 checkpoint 同时改变了 backbone 和训练数据，原因不能拆成单一因素。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结论与边界：让证据自己收束",
      "badge": "both",
      "badgeLabel": "结果",
      "bridge": "最后不追求一个万能冠军，而是把四张表放回各自的 dataset、metric 和边界中，形成条件化的论文结论。",
      "analogy": {
        "title": "最后做一次监听核验",
        "text": "好的教程不是把一个数字涂成绿色，而是让每个数字带着数据集、指标方向和适用边界一起出现。",
        "componentId": "audio-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "启动结果对照",
          "desc": "启动一次按论文表格组织的结果核验。可以切换 Table 1-4，比较会保留单位、指标方向和“教学重绘/原论文记录”的边界。",
          "componentId": "audio-lab"
        }
      ],
      "takeaways": [
        {
          "icon": "✅",
          "title": "总判断",
          "desc": "可恢复与线性可恢复必须分开报告。"
        },
        {
          "icon": "🧭",
          "title": "几何边界",
          "desc": "RT60/LUFS 方向更稳定，RP 更依赖域，SC 通常需要弯曲读出。"
        },
        {
          "icon": "📎",
          "title": "研究边界",
          "desc": "只研究最终层、shoebox 房间和可能残留混响的音乐混音，不能外推成普遍定律。"
        }
      ]
    }
  ]
};
