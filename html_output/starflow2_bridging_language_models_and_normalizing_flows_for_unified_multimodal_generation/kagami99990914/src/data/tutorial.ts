import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "STARFlow2: Bridging Language Models and Normalizing Flows for Unified Multimodal Generation",
    "titleZh": "STARFlow2：连接语言模型与归一化流的统一多模态生成",
    "venue": "arXiv:2605.08029v1 [cs.CV], 2026",
    "authors": "Ying Shen, Tianrong Chen, Yuan Gao, Yizhe Zhang, Yuyang Wang, Miguel Angel Bautista, Shuangfei Zhai, Josh Susskind, Jiatao Gu",
    "affiliation": "Apple · UIUC",
    "domain": "统一多模态生成 / 归一化流",
    "coreProblem": "现有“统一”多模态模型在生成机制上并不统一：离散分词损失保真度、扩散混合存在结构不对称、为生成而适配 VLM 会损伤理解能力。",
    "coreInsight": "用 Pretzel 架构把冻结的预训练 VLM 流与可训练的 TARFlow 流垂直交错，在同一因果掩码下用同一种自回归机制生成文本与连续视觉隐变量。",
    "keywords": [
      "统一多模态生成",
      "归一化流",
      "TARFlow",
      "Pretzel",
      "连续隐空间",
      "KV 缓存"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "离散分词丢连续性、扩散混合丢结构统一、改动 VLM 伤理解——三者都做不到“真统一”。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "冻结的 VLM 提供语义、可训练的流负责生成，两条流共享同一因果掩码，文本与图像都直接进入 KV 缓存。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "三条路线都不够“统一”",
      "badge": "inf",
      "badgeLabel": "入门",
      "bridge": "先看清问题：现有“统一”多模态模型，真的在用同一套机制生成文本和图像吗？这一章把三条主流路线各自的代价摆到织机前。",
      "analogy": {
        "title": "被剪碎的线织不成整行",
        "text": "把图像切成离散符号，就像把线剪成一段段再织。<b>碎片之间的缝隙</b>就是量化损失掉的信息。",
        "componentId": "ana-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "碎裂程度 vs 织面完整度",
          "desc": "拖动滑块把“离散化程度”推大，看这一行织面如何从完整变成破碎。",
          "componentId": "m1-1"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "三条路线的代价",
          "desc": "逐条切换现有路线，观察每条路线让哪一格设计目标先变红。",
          "componentId": "m1-2"
        }
      ],
      "insight": "三条路线都各缺一角，所以需要一个<b>既不量化、又不迭代、还能和语言共享同一套因果机制</b>的统一方案。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "现有方案各缺一角",
          "desc": "离散分词丢连续性、扩散混合丢结构统一、适配 VLM 伤理解。"
        },
        {
          "icon": "🔧",
          "title": "三格目标同时成立",
          "desc": "D1 保留理解、D2 连续保真、D3 同一因果机制。"
        },
        {
          "icon": "✨",
          "title": "判断标准是通路",
          "desc": "不是看名字，而是看文本与图像是否走同一条因果通路。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "统一的原料：FAE 连续隐空间",
      "badge": "inf",
      "badgeLabel": "入门",
      "bridge": "既然必须连续，那“连续”的原料长什么样、又从哪里来？先把原料理清楚，再谈建模。",
      "analogy": {
        "title": "先把原料理成均匀的一束",
        "text": "原始图像信息杂乱又冗余，<b>FAE 把它整理成固定长度的连续隐变量</b>，理解和生成才能共用同一份原料。",
        "componentId": "ana-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "连续取样还是分桶取样",
          "desc": "在隐变量平面上拖动取样点，对比连续表示与被压成桶的离散表示。",
          "componentId": "m2-1"
        }
      ],
      "formula": {
        "lead": "图像经过 FAE 编码后，不再是一串离散符号，而是一张固定形状的连续数值表。",
        "unicode": "x ∈ ℝ<sup>N×D</sup>",
        "symbols": [
          {
            "sym": "x",
            "desc": "FAE 编码出的连续视觉隐变量，既是理解分支的视觉输入，也是流的生成目标。"
          },
          {
            "sym": "N",
            "desc": "视觉 token 的数量（序列长度）；论文未给出具体数值。"
          },
          {
            "sym": "D",
            "desc": "每个视觉 token 的隐变量维度；论文未给出具体数值。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "统一先统一原料",
          "desc": "图像先变成连续隐变量，而不是离散符号。"
        },
        {
          "icon": "🔧",
          "title": "一份数据两处用",
          "desc": "x ∈ ℝ^{N×D} 同时服务理解分支与生成目标。"
        },
        {
          "icon": "✨",
          "title": "表示的可选空间",
          "desc": "论文用 DINOv2-g/14 特征训练 FAE，并称其比 SIGLIP 表示更适合生成。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "关键洞察：归一化流就是自回归 Transformer",
      "badge": "inf",
      "badgeLabel": "入门",
      "bridge": "原料是连续的，那用什么去建模它？答案有些反直觉：用的就是语言模型那套自回归结构。",
      "analogy": {
        "title": "引出去，还能原路退回来",
        "text": "流是<b>可逆</b>的：正向把数据变成噪声，反向再从噪声变回数据，两次用的是同一套因果计算。",
        "componentId": "ana-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "前向与反向是同一行",
          "desc": "单步推进一行纬线，再试着原路退回；看看前向信息不完整时会发生什么。",
          "componentId": "m3-1"
        }
      ],
      "formula": {
        "lead": "一个流块对第 n 个位置做的事，就是把这一格的数值平移再缩放；两个参数都由前面所有位置通过因果 Transformer 预测出来。",
        "unicode": "z<sub>n</sub> = (x<sub>n</sub> − μ<sub>θ</sub>(x<sub>&lt;n</sub>)) ⁄ σ<sub>θ</sub>(x<sub>&lt;n</sub>)　⟷　x<sub>n</sub> = μ<sub>θ</sub>(x<sub>&lt;n</sub>) + σ<sub>θ</sub>(x<sub>&lt;n</sub>) · z<sub>n</sub>",
        "symbols": [
          {
            "sym": "x_n",
            "desc": "第 n 个位置的输入数值（连续隐变量的一格）。"
          },
          {
            "sym": "z_n",
            "desc": "第 n 个位置变换到标准高斯空间的数值。"
          },
          {
            "sym": "μ_θ(x_<n)",
            "desc": "由因果 Transformer 预测的位置参数，只看严格在前的位置。"
          },
          {
            "sym": "σ_θ(x_<n)",
            "desc": "同一位置预测的尺度参数，决定这一格的缩放。"
          },
          {
            "sym": "θ",
            "desc": "预测这两个参数的因果 Transformer 权重。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "结构完全同源",
          "desc": "自回归流与语言模型共享因果掩码、KV 缓存和从左到右结构。"
        },
        {
          "icon": "🔧",
          "title": "差别只在输出头",
          "desc": "输出头预测仿射参数 μ、σ，而不是词表上的离散 logits。"
        },
        {
          "icon": "✨",
          "title": "可逆即同一套计算",
          "desc": "正向与反向是同一套计算，生成不必再引入第二套机制。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "可逆的仿射变换与精确似然",
      "badge": "both",
      "badgeLabel": "通用",
      "bridge": "上一章走了一遍可逆过程，但还没有量化的判据。这一章把“可逆”变成可以精确计算的似然。",
      "analogy": {
        "title": "压得准，也要压得稳",
        "text": "位置决定这一行落在哪里，力度决定它铺多开。<b>两个量一起决定布面是否可信</b>，也一起决定似然有多高。",
        "componentId": "ana-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "位置、尺度与似然",
          "desc": "同时拖动落点与铺开程度，观察高斯、雅可比体积项与似然如何同步变化。",
          "componentId": "m4-1"
        }
      ],
      "insight": "只要变换可逆、雅可比能算，似然就是精确的——不需要对抗训练，也不需要多步迭代去逼近一个分布。",
      "formula": {
        "lead": "数据的似然由两部分相乘得到：它落在先验高密度区的概率，以及变换在这一点上把空间放大了多少倍。",
        "unicode": "𝓛<sub>NF</sub>(θ) = − 𝔼<sub>x</sub>[ log p<sub>0</sub>(f<sub>θ</sub>(x)) + log |det J<sub>f<sub>θ</sub></sub>(x)| ]",
        "symbols": [
          {
            "sym": "L_NF(θ)",
            "desc": "流的负对数似然，训练时最小化它。"
          },
          {
            "sym": "p_0",
            "desc": "标准高斯先验密度。"
          },
          {
            "sym": "f_θ",
            "desc": "由因果 Transformer 参数化的可逆映射。"
          },
          {
            "sym": "J_fθ(x)",
            "desc": "变换在 x 处的雅可比矩阵，其行列式绝对值表示局部体积变化倍数。"
          },
          {
            "sym": "det",
            "desc": "行列式，衡量局部体积的伸缩。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "每块只做一次仿射",
          "desc": "平移加缩放，参数由因果 Transformer 预测。"
        },
        {
          "icon": "🔧",
          "title": "似然精确可算",
          "desc": "先验密度项 + 雅可比体积项；后者防止模型把体积压成零。"
        },
        {
          "icon": "✨",
          "title": "尺度被两侧约束",
          "desc": "塌缩和摊散都会让似然变差，σ 不是可以随便设的超参。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "垂直跳跃连接：让冻结的 VLM 指导生成",
      "badge": "both",
      "badgeLabel": "通用",
      "bridge": "似然告诉我们怎么训练一条流，但生成还需要“语义指令”。这一章看冻结的 VLM 如何在不被改动的前提下影响生成。",
      "analogy": {
        "title": "参照线只搭手，不改动",
        "text": "预训练 VLM 就是那根<b>绷好就不动的参照线</b>：它只提供语义参照，自己被冻结，真正被训练的是梭线那一侧。",
        "componentId": "ana-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "参照强度：注入多少才合适",
          "desc": "在三个注入档位之间切换，看语义信息与低层视觉信息如何取舍。",
          "componentId": "m5-1"
        }
      ],
      "formula": {
        "lead": "在视觉位置上，进入 TARFlow 流的东西不是原始隐变量，而是“原始隐变量 + 投影后的 VLM 表示”这一份融合输入。",
        "unicode": "ĉ<sub>t</sub> = u<sub>t</sub> + W<sub>vlm</sub> · y<sub>vlm,t</sub>（视觉位置）；　ĉ<sub>t</sub> = y<sub>vlm,t</sub>（文本位置）",
        "symbols": [
          {
            "sym": "ĉ_t",
            "desc": "第 t 个位置真正送入 TARFlow 流的输入。"
          },
          {
            "sym": "u_t",
            "desc": "浅层块产出的中间视觉隐变量（低层视觉信息）。"
          },
          {
            "sym": "y_vlm,t",
            "desc": "VLM 流在第 t 个位置的输出隐状态（高层语义）。"
          },
          {
            "sym": "W_vlm",
            "desc": "把 VLM 表示投影到视觉隐变量空间的线性层，零初始化。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "冻结不等于不参与",
          "desc": "垂直跳跃连接让冻结的 VLM 在每个位置都能影响生成。"
        },
        {
          "icon": "🔧",
          "title": "融合保留低层信息",
          "desc": "输入侧既保留 u 的低层视觉信息，又注入 VLM 的高层语义。"
        },
        {
          "icon": "✨",
          "title": "互补而非重复",
          "desc": "论文在 50 条随机提示词的文生图实验中测得视觉贡献比均值约 0.472、方向对齐接近零。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "单次从左到右采样与缓存友好",
      "badge": "inf",
      "badgeLabel": "入门",
      "bridge": "两条流能交换信息了，那跑一次到底要多少代价？这一章比较“一遍走完”和“反复补织”。",
      "analogy": {
        "title": "一次引过去，别来回补",
        "text": "扩散式路线要反复回头补织；<b>同一个因果机制下只需要一遍</b>，而且已经织好的部分不用再重新缠一遍。",
        "componentId": "ana-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "一次走完 vs 反复补织",
          "desc": "按下同一个开始按钮，让两条路线从同一起点同时开跑，比较重编码次数。",
          "componentId": "m6-1"
        }
      ],
      "formula": {
        "lead": "采样时不再有迭代，而是逐位置从预测出的高斯里取一个值，从左到右走一遍。",
        "unicode": "u<sub>n</sub> = μ<sub>D</sub>(u<sub>&lt;n</sub>; c) + σ<sub>D</sub>(u<sub>&lt;n</sub>; c) · z<sub>n</sub>，　z<sub>n</sub> ∼ 𝒩(0, I)",
        "symbols": [
          {
            "sym": "u_n",
            "desc": "第 n 个位置采样得到的中间视觉隐变量。"
          },
          {
            "sym": "μ_D(u_<n; c)",
            "desc": "深层流在给定前置上下文 c 下预测的位置参数。"
          },
          {
            "sym": "σ_D(u_<n; c)",
            "desc": "深层流预测的尺度参数。"
          },
          {
            "sym": "z_n",
            "desc": "标准高斯噪声采样值，各位置相互独立。"
          },
          {
            "sym": "c",
            "desc": "前置多模态上下文（已经生成的文本与视觉内容）。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "采样就是一遍",
          "desc": "从左到右逐位置取数，不是多步迭代去噪。"
        },
        {
          "icon": "🔧",
          "title": "输出直接进缓存",
          "desc": "共享同一因果掩码，文本与视觉输出都直接进入 KV 缓存。"
        },
        {
          "icon": "✨",
          "title": "交错生成不用重编码",
          "desc": "这是结构性优势，而不是调参调出来的。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "训练目标：u 空间的“下一个高斯预测”",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "已经知道采样是一遍走完，那模型到底在学什么？这一章把训练目标摊开来看。",
      "analogy": {
        "title": "先预判落点，再压下去",
        "text": "连续隐变量没有词表，所以模型预测的不是“下一个符号”，而是<b>下一个高斯的位置与尺度</b>。",
        "componentId": "ana-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "预判位置与尺度",
          "desc": "逐轮推进训练，看每个位置预测的高斯如何收拢、损失如何压平。",
          "componentId": "m7-1"
        }
      ],
      "insight": "“下一个高斯预测”把 LLM 的核心训练信号搬到了连续空间——这正是论文敢说两模态共用一套机制的原因。",
      "formula": {
        "lead": "把组合流的负对数似然展开后，每一项都变成“这个位置的真实值离预测的高斯有多远”加上一个尺度惩罚。",
        "unicode": "𝓛<sub>NF</sub> = 𝔼<sub>x</sub>[ Σ<sub>n=1..N</sub> ( ½‖z<sub>n</sub>‖² + log σ<sub>D</sub>(u<sub>&lt;n</sub>; c) ) − log |det J<sub>f<sub>S</sub></sub>(x)| ]",
        "symbols": [
          {
            "sym": "u = f_S(x)",
            "desc": "浅层块先把 FAE 隐变量变成的中间表示。"
          },
          {
            "sym": "z_n",
            "desc": "第 n 个位置标准化后的残差；这一项惩罚“预测偏了”。"
          },
          {
            "sym": "log σ_D(u_<n; c)",
            "desc": "尺度项；σ 太小会被这一项惩罚，防止概率塌到一点上。"
          },
          {
            "sym": "log |det J_fS(x)|",
            "desc": "浅层块的雅可比体积项，浅层块同样参与似然。"
          },
          {
            "sym": "c",
            "desc": "该位置之前的多模态上下文。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "第一阶段只训流",
          "desc": "Stage 1 冻结 VLM，只训练深层流与浅层块。"
        },
        {
          "icon": "🔧",
          "title": "目标仍是预测下一个",
          "desc": "训练信号是“下一个高斯的位置与尺度”，即 NTP 的连续版本。"
        },
        {
          "icon": "✨",
          "title": "两项一起约束",
          "desc": "残差项惩罚“偏”，尺度项惩罚“塌”。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "Pretzel 架构：两条流垂直交错",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "前面几章分别看清了连接、采样与目标，这一章把它们拼成完整架构，并回答“为什么是垂直交错”。",
      "analogy": {
        "title": "上下来回穿，才织成一块",
        "text": "两条流不是各走各的，而是<b>在每个位置上下交错并交换信息</b>；交叉点就是垂直跳跃连接。",
        "componentId": "ana-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点开 Pretzel 的每个部件",
          "desc": "逐个点开架构里的部件，看清它属于哪条流、是否被冻结、参与哪条路径。",
          "componentId": "m8-1"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "三张架构的权衡",
          "desc": "切换四种架构变体，在同一组四个维度上比较取舍。",
          "componentId": "m8-2"
        }
      ],
      "formula": {
        "lead": "在输出端，同一个架构对两种位置给出两种分布：视觉位置给高斯，文本位置给类别分布。",
        "unicode": "ô<sub>t</sub> = 𝒩(μ<sub>D</sub>(y<sub>D,t</sub>), σ<sub>D</sub>²(y<sub>D,t</sub>))（视觉位置）；　ô<sub>t</sub> = Cat(softmax(LM(y<sub>vlm,t</sub> + W<sub>D</sub>·y<sub>D,t</sub>)))（文本位置）",
        "symbols": [
          {
            "sym": "y_D,t",
            "desc": "深层 TARFlow 流在第 t 个位置的输出隐状态。"
          },
          {
            "sym": "y_vlm,t",
            "desc": "VLM 流在第 t 个位置的输出隐状态。"
          },
          {
            "sym": "μ_D(·), σ_D(·)",
            "desc": "由深层流隐状态预测的位置与尺度。"
          },
          {
            "sym": "LM(·)",
            "desc": "语言建模头，把融合后的文本表示映射成词表 logits。"
          },
          {
            "sym": "W_D",
            "desc": "把深层流输出投影到文本表示空间的线性层，零初始化。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "垂直交错取代水平分离",
          "desc": "Pretzel 用逐位置跳跃连接让两条流在每个位置交换信息。"
        },
        {
          "icon": "🔧",
          "title": "两种位置两种分布",
          "desc": "视觉位置输出高斯、文本位置输出类别分布，两条投影零初始化。"
        },
        {
          "icon": "✨",
          "title": "失败模式驱动设计",
          "desc": "论文自己的 MoT 对照显示冻结与联合微调各有失败模式。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "深-浅流与三阶段训练",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "架构已经完整，但还有两块拼图没解释：为什么需要浅层块，为什么训练要分三步。",
      "analogy": {
        "title": "粗线定形，细线补织",
        "text": "局部絮乱交给<b>浅层块</b>先抹平，全局结构再交给<b>深层流</b>一次建模——分工之后，一次 pass 才够用。",
        "componentId": "ana-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "粗线与细线怎么分工",
          "desc": "拖动分工滑块，看容量在浅层与深层之间如何分配才不糊也不散。",
          "componentId": "m9-1"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "三阶段激活",
          "desc": "按顺序走过三个阶段，看每个阶段冻结了什么、训练了什么、加了什么损失。",
          "componentId": "m9-2"
        }
      ],
      "insight": "把“局部”与“全局”拆给两种不同深度的流，是让单次因果建模真正可行的那一步。",
      "formula": {
        "lead": "两个部件各自贡献一个雅可比项，整条流的似然就是三部分相乘；到了第三阶段，再叠上语言建模的损失。",
        "unicode": "p(x) = p<sub>0</sub>(z) · |det J<sub>f<sub>D</sub></sub>(u; C)| · |det J<sub>f<sub>S</sub></sub>(x)|，　𝓛 = 𝓛<sub>NF</sub> + λ · 𝓛<sub>NTP</sub>",
        "symbols": [
          {
            "sym": "p(x)",
            "desc": "数据 x 的精确似然。"
          },
          {
            "sym": "u = f_S(x)",
            "desc": "浅层块（两个视觉专用块、交替扫描方向）产出的中间表示。"
          },
          {
            "sym": "z = f_D(u; C)",
            "desc": "深层流在完整多模态上下文 C 下把 u 映射到先验空间的结果。"
          },
          {
            "sym": "J_fS / J_fD",
            "desc": "两个部件的雅可比行列式绝对值，分别记录各自的体积变化。"
          },
          {
            "sym": "λ",
            "desc": "两项损失的权重，论文未给出其具体取值。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "先局部，后全局",
          "desc": "浅层块吸收局部相关性，深层流才能建全局与跨模态依赖。"
        },
        {
          "icon": "🔧",
          "title": "论文的容量分配",
          "desc": "浅层 2 块 × 4 层、深层 24 层，宽度均为 3072。"
        },
        {
          "icon": "✨",
          "title": "三阶段逐步激活",
          "desc": "跳跃连接只在第三阶段打开；论文未公布权重 λ 的取值。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、对比与局限",
      "badge": "both",
      "badgeLabel": "通用",
      "bridge": "机制讲完了，最后一章把结果落到可核对的数字上，并如实标注论文自己承认的局限。",
      "analogy": {
        "title": "同时收边，再看布面",
        "text": "结果要看<b>同一基准下的完整布面</b>，而不是只看一句口号；论文也照实写下了自己没赢的地方。",
        "componentId": "ana-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "结果赛跑与验证表",
          "desc": "在同一基线上让各方法同时开跑，并切换两个基准看本文方法的真实位置。",
          "componentId": "m10-1"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "理解能力基本保留",
          "desc": "MME-P 1528.8、GQA 55.8、SEED 71.1、MMBench(en) 71.5、MMMU(val) 44.7、AI2D 67.7，均低于冻结骨干 Qwen2.5-VL-7B-Instruct，且评测受 256×256 分辨率限制。"
        },
        {
          "icon": "🔧",
          "title": "文生图有竞争力",
          "desc": "GenEval 0.82、DPG-Bench 84.94；从 Stage 1 到 Stage 3，两项分别由 0.51 升到 0.82、由 82.02 升到 84.94（论文记为相对 +60.8% 与 +3.6%）。"
        },
        {
          "icon": "✨",
          "title": "论文自述三点局限",
          "desc": "多阶段训练复杂度与欠优化风险、受 FAE 编码器限制分辨率与细节、并非在所有基准上都达到 SOTA。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1dS4y1c7xB",
      "title": "50、NormalizingFlow(标准化流)论文导读与原理精讲",
      "reason": "归一化流论文导读与原理精讲，覆盖理解第 3、4 章所需的流与可逆变换直觉。",
      "cover": "https://i1.hdslb.com/bfs/archive/a8daec64e66d4d63b874abb493c1bb4e59bb3e80.jpg",
      "views": "1.7万播放"
    },
    {
      "bvid": "BV1tYyfYhEzc",
      "title": "2.2 介绍连续归一化流 CNF 的定义和性质",
      "reason": "直接讲连续归一化流的定义、变量变换公式与流/向量场/密度三者关系，与第 3、4 章的数学核心高度对应。",
      "cover": "https://i1.hdslb.com/bfs/archive/d234e5989a5fb9d6148668a6120620d5ed15eff2.jpg",
      "views": "2389播放"
    },
    {
      "bvid": "BV1QF411j7ee",
      "title": "53、NormalizingFlow(标准化流)的PyTorch代码逐行讲解",
      "reason": "归一化流的 PyTorch 逐行实现讲解，对应第 7 章的训练目标与第 9 章的容量分配。",
      "cover": "https://i2.hdslb.com/bfs/archive/5953c8df97ad846c844fb18449e67a6db1c6dd0e.jpg",
      "views": "1.3万播放"
    }
  ]
};
