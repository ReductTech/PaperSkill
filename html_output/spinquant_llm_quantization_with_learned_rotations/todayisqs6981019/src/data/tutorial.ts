import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "SpinQuant: LLM Quantization with Learned Rotations",
    "titleZh": "SpinQuant：用学习到的旋转矩阵做 LLM 量化",
    "venue": "ICLR 2025 · arXiv:2405.16406",
    "authors": "Zechun Liu, Changsheng Zhao, Igor Fedorov, Bilge Soran, Dhruv Choudhary, Raghuraman Krishnamoorthi, Vikas Chandra, Yuandong Tian, Tijmen Blankevoort",
    "affiliation": "Meta",
    "domain": "LLM 量化 · 后训练量化 · 旋转矩阵 · 流形优化",
    "coreProblem": "W4A4KV4 下 outlier 拉爆量化步长：LLaMA-2 7B 直接量化 0-shot 均值只剩 37.1 分（全精度 66.9），GPTQ 也只有 36.8 分——问题出在激活分布的尖峰。",
    "coreInsight": "利用旋转不变性，把可学习的正交旋转 R1/R2 插入 LLaMA 块（训练后融合进权重，推理零开销），用 Cayley SGD 在 Stiefel 流形上直接最小化量化网络的损失；W4A4KV4 下 LLaMA-2 7B 达 64.0 分，距全精度仅 2.9 分。",
    "keywords": [
      "旋转不变性",
      "Cayley SGD",
      "Stiefel 流形",
      "W4A4KV4",
      "在线 Hadamard"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "传统 4-bit 量化：<b>outlier 拉爆步长</b>，正常值全被挤进 0 附近的桶（LLaMA-2 7B W4A4KV4，0-shot 均值）。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "SpinQuant：<b>学习旋转摊平 outlier</b>，W4A4KV4 达 64.0 分，距全精度仅 2.9。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "4-bit 量化为什么会被拉爆",
      "badge": "inf",
      "badgeLabel": "入门",
      "bridge": "LLM 要部署就得同时压缩权重、激活和 KV 缓存。但把三者的位宽都压到 4 bit 时，激活分布里的 outlier 会第一个毁掉精度——这是全文要解决的问题基线。",
      "analogy": {
        "title": "一个超大的数，毁掉整张量化表",
        "text": "4-bit 只有 8 个刻度。<b>最大值决定步长</b>，一个 outlier 就能把所有正常值挤进同一两个桶。",
        "componentId": "ana-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "量化实验台：outlier 吃掉分辨率",
          "desc": "拖动滑块改变 outlier 幅度：左侧直方图尖峰随之升高，4-bit 量化刻度尺被拉长，正常值被舍入挤进少数桶；右侧读数面板实时给出步长 s、可分辨桶数与最大误差。<b>证据口径：LLaMA-2 7B，W4A4KV4，0-shot 均值（Table 1）。</b>",
          "componentId": "ch1-bench"
        }
      ],
      "insight": "想让 4-bit 不崩，必须先处理 outlier——SVDQuant 用低秩分支拎走它，而 SpinQuant 的答案是：<b>把整个分布转平</b>。",
      "formula": {
        "lead": "对称 INT4 的量化刻度由一组数值的最大绝对值决定。",
        "unicode": "s = max|Z| / (2³−1)，&nbsp; Q(Z) = s · round(Z/s)",
        "symbols": [
          {
            "sym": "Z",
            "desc": "一组待量化的数值（激活或权重）"
          },
          {
            "sym": "s",
            "desc": "量化步长（scale），由最大绝对值决定"
          },
          {
            "sym": "Q(Z)",
            "desc": "反量化后的近似值"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "计算密集",
          "desc": "LLM 要 W4A4KV4 才能拿到原生低比特吞吐与 KV 压缩。"
        },
        {
          "icon": "🔧",
          "title": "刻度被拉爆",
          "desc": "outlier 决定步长，正常值全被挤扁（66.9 → 37.1 分）。"
        },
        {
          "icon": "✨",
          "title": "两条路线",
          "desc": "低秩拎走（SVDQuant）或旋转摊平（SpinQuant），本教程讲后者。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "旋转不变性：转一下，输出不变",
      "badge": "inf",
      "badgeLabel": "入门",
      "bridge": "上一章看到 outlier 毁掉 4-bit。SpinQuant 的解法是「把分布转平」——但凭什么网络允许你乱转？这一章给出全文的免费午餐。",
      "analogy": {
        "title": "转出去，再转回来",
        "text": "进注意力前用 <b>R₁</b> 转出去，进非线性块前用 <b>R₁ᵀ</b> 转回来——全精度网络一个数都不变。",
        "componentId": "ana-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "旋转实验台：拖动框架，输出纹丝不动",
          "desc": "直接拖拽旋转框架（或用左右方向键微调）：坐标框架带着尖峰直方图转动，分布形状随之改变；右侧读数实时显示 kurtosis，而「输出差」恒为 0.000。下图是论文 Figure 5：注意力旋转的等价变换。",
          "componentId": "ch2-rotate",
          "figure": "./images/S2_F2.png"
        }
      ],
      "formula": {
        "lead": "旋转激活的同时把权重反旋，乘积不变。",
        "unicode": "Y = X·W = (X·R)(Rᵀ·W)",
        "symbols": [
          {
            "sym": "R",
            "desc": "正交旋转矩阵（RᵀR=I，Rᵀ=R⁻¹）"
          },
          {
            "sym": "X·R",
            "desc": "旋转后的激活"
          },
          {
            "sym": "Rᵀ·W",
            "desc": "反旋后的权重"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "数值等价",
          "desc": "任何正交 R 都不改变全精度输出。"
        },
        {
          "icon": "🔧",
          "title": "成对出现",
          "desc": "激活转出去（X·R），权重反旋（RᵀW）或激活转回来（·Rᵀ）。"
        },
        {
          "icon": "✨",
          "title": "自由度到手",
          "desc": "既然随便转都不坏，「挑一个最好量化的角度」就成了优化问题。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "随机旋转：13 分的赌局",
      "badge": "inf",
      "badgeLabel": "入门",
      "bridge": "旋转是合法的——但合法不等于平等。抽 100 次随机旋转，最好比最差高 13 分：随机抽签不可靠，必须「学习」。",
      "analogy": {
        "title": "同一个方法，13 分的手气差",
        "text": "随机旋转下 W4A4 的 0-shot 均值能差 <b>13 分</b>；连 Hadamard 都有 6 分方差——抽签不可靠。",
        "componentId": "ana-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "抽签实验台：从 100 次抽样到 1 个优化解",
          "desc": "用「下一步」走过 5 个步骤：空白数轴 → 随机 FP 抽样落点 → 100 次铺成 13 分散布带 → 叠加 Hadamard 带（6 分方差）→ Cayley 优化后的聚焦点。右侧统计面板同步高亮当前组。<b>口径：W4A4 RTN，LLaMA-2 7B，0-shot 均值，100 次试验（Figure 4）。</b>",
          "componentId": "ch3-trials"
        }
      ],
      "insight": "既然旋转合法又不平等，问题就变成：怎么<b>找到</b>那个最好的旋转？",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "方差惊人",
          "desc": "随机 FP 旋转最好最差差 13 分。"
        },
        {
          "icon": "🔧",
          "title": "Hadamard 更稳",
          "desc": "仍有 6 分方差，只是「较好的起点」。"
        },
        {
          "icon": "✨",
          "title": "必须学习",
          "desc": "与其抽签，不如直接优化旋转矩阵。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "Cayley SGD：在正交流形上学习",
      "badge": "trn",
      "badgeLabel": "机制",
      "bridge": "怎么「学」旋转？普通 SGD 更新几步就滑出正交空间。SpinQuant 把优化约束在 Stiefel 流形上，用 Cayley 变换保证每一步都合法。",
      "analogy": {
        "title": "每一步都踩在流形上",
        "text": "Cayley 变换保证更新后的矩阵<b>仍然正交</b>（R′ᵀR′=I）——学得动，也转不歪。",
        "componentId": "ana-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "流形实验台：把动点拉回正交空间",
          "desc": "拖拽圆内/圆外的动点：偏离圆周越远，「偏离」读数越大、描边越红；松手后动点被投影动画拉回圆上最近点。单位圆是 Stiefel 流形（正交矩阵集合）的二维示意。下图是论文 Figure 6：旋转与 kurtosis 的关系。",
          "componentId": "ch4-cayley",
          "figure": "./images/S4_F6.png"
        }
      ],
      "formula": {
        "lead": "每步更新用 Cayley 变换生成一个正交矩阵。",
        "unicode": "R′ = R·ΔR(Y)，&nbsp; ΔR(Y) = (I − (α/2)Y)⁻¹(I + (α/2)Y)，&nbsp; Yᵀ = −Y",
        "symbols": [
          {
            "sym": "Y",
            "desc": "由梯度 ∇_R L_Q 投影得到的斜对称矩阵"
          },
          {
            "sym": "α",
            "desc": "Cayley 更新的步长"
          },
          {
            "sym": "ΔR(Y)",
            "desc": "Cayley 变换，恒为正交矩阵"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "约束即流形",
          "desc": "正交矩阵集合是 Stiefel 流形，优化必须在其上。"
        },
        {
          "icon": "🔧",
          "title": "Cayley 保正交",
          "desc": "更新公式从数学上保证 R′ᵀR′=I。"
        },
        {
          "icon": "✨",
          "title": "工程实现",
          "desc": "源码为投影动量 SGD + 每 100 步 QR 重正交化（源码核实口径）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "R1–R4：四个旋转各管一段",
      "badge": "trn",
      "badgeLabel": "机制",
      "bridge": "「旋转」落进 LLaMA 块要回答三个问题：放哪里、能不能学、能不能融。SpinQuant 定义了四个旋转位，两种待遇。",
      "analogy": {
        "title": "四个旋转，两种待遇",
        "text": "<b>R1/R2</b> 能融合进权重还能学习；<b>R3/R4</b> 只能在线跑，固定用 Hadamard。",
        "componentId": "ana-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "位置实验台：R1–R4 挂在哪里",
          "desc": "点击 R1/R2/R3/R4 芯片切换当前旋转：架构管线上的挂载点高亮脉冲、数据路径点亮，右侧详情同步给出「位置 / 能否融合 / 是否学习」三行属性。SpinQuant 每块只需 2 个在线 Hadamard（QuaRot 要 4 个）。",
          "componentId": "ch5-locations",
          "figure": "./images/S1_F1.png"
        }
      ],
      "formula": {
        "lead": "旋转矩阵成对地夹住残差流与子层。",
        "unicode": "X·R₁ →(注意力/FFN 前)·R₁ᵀ；&nbsp; V = (X·R₁)·W_v·R₂ᵀ …（Wv–Wo 对内旋转）",
        "symbols": [
          {
            "sym": "R₁",
            "desc": "残差捷径旋转（进非线性块前用 R₁ᵀ 转回）"
          },
          {
            "sym": "R₂",
            "desc": "Wv–Wo 对旋转，按 head_dim 分块作用"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "四个位置",
          "desc": "R1 残差、R2 Wv–Wo、R3 作用于 K、R4 于 MLP。"
        },
        {
          "icon": "🔧",
          "title": "两种待遇",
          "desc": "R1/R2 融合+学习；R3/R4 在线+固定 Hadamard。"
        },
        {
          "icon": "✨",
          "title": "更省的在线开销",
          "desc": "每块只需 2 个在线 Hadamard，比 QuaRot 的 4 个更省。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "融合进权重：推理零开销",
      "badge": "trn",
      "badgeLabel": "机制",
      "bridge": "部署者最关心：学了旋转，推理时要不要多算？把 R 乘进相邻权重后，答案是不要——推理图和原版 LLaMA 完全一样。",
      "analogy": {
        "title": "把旋转塞进权重里",
        "text": "训练完直接把 <b>R 融合进 W</b>，推理时一个额外算子都没有——零开销。",
        "componentId": "ana-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "同步对比：运行时旋转 vs 融合进权重",
          "desc": "两列网络共用同一时间基准同步跑 token 流：左列入口多一个旋转节点，右列没有。跑完看读数——输出差恒为 0.000，右列延迟条更短。",
          "componentId": "ch6-fusion",
          "figure": "./images/S3_F5.png"
        }
      ],
      "formula": {
        "lead": "融合就是把 R 乘进权重，写死在模型文件里。",
        "unicode": "W̃ = Rᵀ·W（读旋转流的权重）；&nbsp; X·R·(Rᵀ·W) ≡ X·W",
        "symbols": [
          {
            "sym": "W̃",
            "desc": "融合后的权重（离线替换，量化后写回 checkpoint）"
          },
          {
            "sym": "Rᵀ",
            "desc": "与 X·R 配对的反旋"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "输出不变",
          "desc": "融合前后数值一致（读数恒 0）。"
        },
        {
          "icon": "🔧",
          "title": "零推理开销",
          "desc": "无新参数、无新算子，推理图与原版相同。"
        },
        {
          "icon": "✨",
          "title": "实现细节",
          "desc": "源码在 QuantizeLinear.forward 运行时融合，评测要带 --rotate（源码口径）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "训练目标：让量化网络的损失最小",
      "badge": "trn",
      "badgeLabel": "机制",
      "bridge": "旋转「学」什么？不是模仿 FP 输出，而是把量化后的网络（Q 在回路里）在校准集上的交叉熵损失直接压到最低——权重全程冻结。",
      "analogy": {
        "title": "对着量化后的网络练",
        "text": "损失直接在<b>量化网络</b>上算（校准集交叉熵），权重冻结——128 条样本、100 步就够。",
        "componentId": "ana-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "训练实验台：六步看完一次优化",
          "desc": "「下一步」在六个步骤间推进：校准集 → 固定 W 前向 → 激活量化（Q）→ 交叉熵损失 → 对 R 求梯度 → Cayley 更新。损失曲线随步数下降，右栏数据流微图同步高亮。",
          "componentId": "ch7-train"
        }
      ],
      "formula": {
        "lead": "在 Stiefel 流形上找让量化网络损失最小的 R1、R2。",
        "unicode": "min<sub>R₁,R₂∈M</sub> &nbsp; L_Q( f<sub>quantized</sub>(X; R₁, R₂, W<sub>frozen</sub>) )",
        "symbols": [
          {
            "sym": "M",
            "desc": "Stiefel 流形（正交矩阵集合）"
          },
          {
            "sym": "L_Q",
            "desc": "量化网络的任务损失（如交叉熵，在校准集上）"
          },
          {
            "sym": "W_frozen",
            "desc": "冻结的预训练权重"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "直接最小化量化损失",
          "desc": "不是蒸馏 FP 输出，是 Q 在回路的真实损失。"
        },
        {
          "icon": "🔧",
          "title": "便宜",
          "desc": "128 条校准样本、100 步迭代即收敛（附录 A.3）。"
        },
        {
          "icon": "✨",
          "title": "诚实边界",
          "desc": "源码训练只量化激活（W16A4KV4 式），与 W4A4KV4 评测之间有 gap（源码口径）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "工程细节：从论文到代码",
      "badge": "both",
      "badgeLabel": "综合",
      "bridge": "机制讲完了，复现还要过三道工程门槛：fuse_layer_norms（γ 融合 + embedding 减均值）、bias 处理（O 投影 bias 额外乘 R2）、tie_word_embeddings（共享权重先拷贝 lm_head）。",
      "analogy": {
        "title": "融合前，先对齐结构",
        "text": "<b>γ 融合</b>、<b>bias 处理</b>、<b>tie_word_embeddings</b>——三件小事不做，旋转就融不对。",
        "componentId": "ana-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "架构热点：每处结构发生了什么",
          "desc": "点击 5 个热点（RMSNorm γ / Embedding / Wqkv+Wo / down_proj / lm_head）：部件高亮脉冲、相关旋转徽标点亮，详情区给出「论文 / 源码」双口径说明。",
          "componentId": "ch8-arch"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "配置芯片：--rotate 与融合时机",
          "desc": "三个开关：fuse_layer_norms、融合时机（离线写回 / 运行时）、eval --rotate。源码在运行时融合，所以「运行时 + 忘开 --rotate」是非法组合——右侧流程图直接标红。",
          "componentId": "ch8-eng"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "三件工程事",
          "desc": "γ 融合、bias 处理、tie 解共享。"
        },
        {
          "icon": "🔧",
          "title": "--rotate 之谜",
          "desc": "融合在 QuantizeLinear.forward 运行时做，评测必须显式开启（源码口径）。"
        },
        {
          "icon": "✨",
          "title": "论文/源码分层",
          "desc": "机制是论文的，融合时机是实现选的。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "配置选择：在线 Hadamard 与位宽",
      "badge": "trn",
      "badgeLabel": "机制",
      "bridge": "发布时有两种配置：SpinQuant_no-had 只用 R1/R2（W4A8KV8，把 Mistral 差距从 12.1 缩到 1.6）；SpinQuant_Had 加上 R3/R4 在线 Hadamard（W4A4KV4 用）。按目标位宽选。",
      "analogy": {
        "title": "按位宽选配置",
        "text": "W4A8KV8 用 <b>no-had</b>（差距 12.1→1.6）；W4A4KV4 上 <b>had</b>（加 R3/R4）。",
        "componentId": "ana-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "配置实验台：no-had vs had",
          "desc": "点击两个配置芯片：管线上的 R3/R4 徽标挂载/卸下，W·A·KV 位宽条同步变化，右栏读数切换关键数字（64.0 分 / 12.1→1.6）。",
          "componentId": "ch9-config"
        }
      ],
      "formula": {
        "lead": "每块的在线 Hadamard 数量决定运行时开销。",
        "unicode": "每块在线 Hadamard：SpinQuant 2 个（R₃, R₄）&nbsp;vs&nbsp; QuaRot 4 个",
        "symbols": [
          {
            "sym": "R₃/R₄",
            "desc": "在线 Hadamard：R₃ 作用于 K，R₄ 融进 down_proj 输入侧（源码口径）"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两种配置",
          "desc": "no-had 管 W4A8KV8（12.1→1.6），had 管 W4A4KV4。"
        },
        {
          "icon": "🔧",
          "title": "分工优化",
          "desc": "旋转只管激活误差，权重误差交给 GPTQ（64.0 vs 60.9）。"
        },
        {
          "icon": "✨",
          "title": "更省的在线开销",
          "desc": "每块 2 个在线 Hadamard，QuaRot 要 4 个。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果与边界：低比特激活才见真章",
      "badge": "both",
      "badgeLabel": "综合",
      "bridge": "收官看真实数据：W4A4KV4 下 LLaMA-2 7B 拿到 64.0 分（FP 66.9，GPTQ 36.8）；但 W4A16KV16 下与 QuaRot 几乎打平——学习旋转的价值在低比特激活下才凸显。",
      "analogy": {
        "title": "同一条赛道，两份成绩单",
        "text": "W4A4KV4 拉开 27 分；但 <b>W4A16KV16</b> 下与 QuaRot 打平——学习旋转只在低比特激活时兑现。",
        "componentId": "ana-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "结果竞赛：W4A4KV4 真实成绩",
          "desc": "五条赛道按真实分数从 0 错峰生长：RTN 37.1、GPTQ 36.8、QuaRot 62.5（README 口径）、SpinQuant 64.0，FP 标线 66.9。切换芯片可对照 W4A16KV16——那里大家挤在一起。",
          "componentId": "ch10-race",
          "figure": "./images/S4_F6.png"
        }
      ],
      "insight": "分数之外还有边界：官方 README 承认论文数字出自 Meta 内部代码；第三方复现提示 <b>PPL 可能对 WikiText2 过拟合</b>——评测必须加下游任务（非论文结论，第三方口径）。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "量级",
          "desc": "W4A4KV4 LLaMA-2 7B 64.0 分，距 FP 2.9，超此前 SoTA 19.1。"
        },
        {
          "icon": "🔧",
          "title": "价值边界",
          "desc": "W4A16KV16 与 QuaRot 打平；低比特激活 + 大模型才明显拉开。"
        },
        {
          "icon": "✨",
          "title": "评测警示",
          "desc": "不能只看 WikiText PPL，要加 OpenCompass/lm-eval 下游任务（第三方复现口径）。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1Rfa3zWEzn",
      "title": "大模型最新量化算法 SPIN Quant",
      "reason": "直接讲解 SpinQuant 的量化思路，与本文主题一致"
    },
    {
      "bvid": "BV1fjaP6fE9r",
      "title": "LLM量化深度解析(完整版)",
      "reason": "覆盖 PTQ/GPTQ/AWQ 主流路线，为第 1、10 章提供背景"
    },
    {
      "bvid": "BV1WLoYB6Ewn",
      "title": "英伟达加速版Qwen3.6，NVFP4 性能实测",
      "reason": "W4A4 低比特量化的当代工程视角，呼应第 9/10 章配置选择"
    }
  ]
};
