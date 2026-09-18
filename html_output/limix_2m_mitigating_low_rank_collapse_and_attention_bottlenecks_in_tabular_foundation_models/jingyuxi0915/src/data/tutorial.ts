import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "LimiX-2M: Mitigating Low-Rank Collapse and Attention Bottlenecks in Tabular Foundation Models",
    "titleZh": "LimiX-2M：通过改进数值编码与注意力组织，提高表示与计算效率的约200万参数表格基础模型",
    "venue": "ICML 2026 · arXiv:2606.04485v2",
    "authors": "Yuanrui Wang、Xingxuan Zhang、Han Yu、Mingchao Hao、Gang Ren、Hao Yuan、Li Mao、Yunjia Zhang、Chun Yuan、Peng Cui",
    "affiliation": "作者单位见固定版本论文首页",
    "domain": "表格分类与回归",
    "coreProblem": "长向量可能仍有低秩冗余，部分末层注意力信息在特定读出条件下未被利用。",
    "coreInsight": "一分钟内核：原有数值编码可能存在<b>低秩冗余</b>；<b>RaBEL提供局部非线性响应</b>；<b>样本注意力→FFN→特征注意力</b>的重排配合读出安排改善信息利用；论文在<b>所测条件下</b>展示了小模型的竞争力。",
    "keywords": [
      "表格基础模型",
      "低秩与SVD",
      "RaBEL数值编码",
      "注意力顺序与读出"
    ]
  },
  "hero": {
    "oldMethod": {
      "componentId": "hero-old",
      "desc": "<b>教学类比：</b>同一只杯子受限于较窄的取景范围。引出两处限制：数值表示变化单一；部分末层信息在特定条件下未进入读出。"
    },
    "newMethod": {
      "componentId": "hero-new",
      "desc": "<b>教学类比：</b>拉开取景框，保留更多目标信息。对应RaBEL的局部响应，以及注意力重排配合读出安排；画面效果不是模型性能。"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "ch01-context",
      "title": "带着几行例子，怎样预测新一行？",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "给出杯高和口径，怎样为容量找到参考？<b>树模型长期是表格预测的强基线</b>，通常为具体数据集拟合；原始TabPFN等TFM提供预训练后利用新任务上下文的路线，本文重点诊断 TabPFN-v2，并与多种 TFM 比较；树模型仍是重要参照。接下来分别检查数值表示与信息流效率这两个问题。<table class=\"paper\"><thead><tr><th>路线</th><th>新任务信息怎样进入</th></tr></thead><tbody><tr><td>为数据集拟合模型</td><td>利用该数据集训练模型，如常用树模型路线</td></tr><tr><td>预训练后的上下文推理</td><td>提供已知样本及查询，前向推理时不更新参数</td></tr></tbody></table>",
      "analogy": {
        "title": "摄影短引入：参考样片",
        "text": "教学类比：揭开样片能获得参照；模型真正使用的是表格上下文。",
        "componentId": "analogy-01"
      },
      "modules": [
        {
          "kind": "module",
          "id": "M01-context",
          "title": "输入查询，找一个可核对的参考",
          "desc": "只编辑查询行，用公开的二维最近邻规则计算。观察上下文、距离与参考值怎样联动，而模型参数状态保持固定。",
          "componentId": "context-explorer"
        }
      ],
      "insight": "上下文提供当前任务的信息；这与更新模型参数是两件事。这里用最近邻规则演示上下文怎样提供参考，真实 TFM 则使用预训练得到的参数。",
      "formula": {
        "lead": "在本算例中，比较平方距离即可找到与欧氏距离相同的最近者。",
        "unicode": "dᵢ² = (h − hᵢ)² + (r − rᵢ)²",
        "symbols": [
          {
            "sym": "h",
            "desc": "查询杯高，单位 cm。"
          },
          {
            "sym": "hᵢ",
            "desc": "第 i 个已知样本的杯高，单位 cm。"
          },
          {
            "sym": "r",
            "desc": "查询口径，单位 cm。"
          },
          {
            "sym": "rᵢ",
            "desc": "第 i 个已知样本的口径，单位 cm。"
          },
          {
            "sym": "dᵢ²",
            "desc": "平方距离，单位 cm²。最近距离并列时，参考容量取并列样本容量的均值。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "上下文有已知标签",
          "desc": "已知样本的输入及标签为当前任务提供参照。"
        },
        {
          "icon": "🔧",
          "title": "查询标签隐藏",
          "desc": "查询容量保持未知，不能把答案放进上下文。"
        },
        {
          "icon": "✨",
          "title": "输入变化不等于训练",
          "desc": "上下文可以变化，预训练模型的新任务前向推理不因此更新参数。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "ch02-value",
      "title": "向量很长，变化方向就多吗？",
      "badge": "inf",
      "badgeLabel": "表示诊断",
      "bridge": "上一章把一行已知样本当成上下文。进入 Transformer 之前，每个数值单元格还要编码成向量。这里固定同一列、共享参数、LN 之前的观察条件，检查“4个坐标”与“4个独立方向”的区别。下一章用SVD量化这些方向及其重要程度。",
      "analogy": {
        "title": "单一控制方向",
        "text": "教学类比：相机在直滑轨上平移，只控制一个位置。类比只引入问题；完整表示的秩仍须由矩阵计算。",
        "componentId": "analogy-02"
      },
      "modules": [
        {
          "kind": "module",
          "id": "M02-value-line",
          "title": "同一列数值，长向量与变化方向",
          "desc": "先保持默认五个值，比较无偏置、仿射与按样本中心化。再拖动第5个值，观察对应行、二维投影和完整矩阵的谱同步改变。",
          "componentId": "value-line-explorer"
        }
      ],
      "insight": "在同一列、共享标量仿射映射且LN之前，未中心化秩至多2；按样本中心化后至多1。常数列还能退化到0。这说明秩要连同映射与观察条件一起理解。",
      "formula": {
        "lead": "共同偏置在按样本中心化时被消去，因此所有变化仍沿同一个w。",
        "unicode": "Z = xwᵀ + 1bᵀ； Zc = (x − mean(x))wᵀ",
        "symbols": [
          {
            "sym": "x",
            "desc": "5个样本在同一列上的标量输入，形状5×1。"
          },
          {
            "sym": "w",
            "desc": "共享斜率向量[1,2,−1,0]，形状4×1。"
          },
          {
            "sym": "b",
            "desc": "共享偏置[0,1,0,1]，与每个样本使用相同的值。"
          },
          {
            "sym": "Zc",
            "desc": "对Z的每个通道减去样本均值；不是每token LayerNorm。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "长度不等于秩",
          "desc": "4个通道可以只承载1～2个线性方向。"
        },
        {
          "icon": "🔧",
          "title": "先说清观察条件",
          "desc": "线性、仿射、中心化与LN前后不能混用。"
        },
        {
          "icon": "✨",
          "title": "下一步看奇异值",
          "desc": "用完整矩阵计算，避免凭二维投影判断秩。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "ch03-spectrum",
      "title": "SVD：有多少方向，哪些方向重要？",
      "badge": "inf",
      "badgeLabel": "诊断与证据",
      "bridge": "上一章解释了表示方向为何可能重复。现在用SVD把“非零方向的数量”与“谱量如何分布”分开；随后阅读论文对TabPFN-v2做的真实截断实验。若输入端的变化过于集中，下一章将考察局部非线性响应。",
      "analogy": {
        "title": "保留主要细节",
        "text": "教学类比：遮掉一些照片细节仍可辨认主体。具体丢失多少信息要由矩阵及谱决定，照片效果不代表模型准确率。",
        "componentId": "analogy-03"
      },
      "modules": [
        {
          "kind": "module",
          "id": "M03-spectrum",
          "title": "奇异值个数与能量分布",
          "desc": "在同列矩阵与两个等平方能量的对角矩阵之间切换。比较数值秩、教学k95/k99与熵有效秩各自回答什么问题。",
          "componentId": "spectrum-explorer"
        },
        {
          "kind": "module",
          "id": "M03-truncation",
          "title": "查阅真实截断实验",
          "desc": "只选择论文Table1已经测过的r。观察原始AUC及相对差值，区分表示诊断与模型性能证据。",
          "componentId": "truncation-evidence"
        }
      ],
      "insight": "同为数值秩4，谱可以集中也可以均匀。论文截断实验显示了一定冗余，也显示过度截断会退化；秩不是准确率旋钮。",
      "formula": {
        "lead": "SVD给出方向与尺度；实际截断只保留前r项。r个槽位与r项都重要是两回事。",
        "unicode": "A = UΣVᵀ； Aᵣ = Σᵢ₌₁ʳ sᵢuᵢvᵢᵀ",
        "symbols": [
          {
            "sym": "U",
            "desc": "左奇异向量矩阵；其列 uᵢ 给出输出空间中的正交方向。"
          },
          {
            "sym": "Σ",
            "desc": "奇异值矩阵：对角线上是降序排列的非负奇异值 sᵢ。右边带上下限的 Σ 表示求和，与这个矩阵符号含义不同。"
          },
          {
            "sym": "Vᵀ",
            "desc": "右奇异向量矩阵 V 的转置。V 的列 vᵢ 给出输入空间中的正交方向。"
          },
          {
            "sym": "sᵢ",
            "desc": "第 i 个非负奇异值，表示该方向的尺度。数值秩只统计超过指定容差的项。"
          },
          {
            "sym": "uᵢ",
            "desc": "U 的第 i 列，是左奇异列向量。"
          },
          {
            "sym": "vᵢ",
            "aliases": [
              "vᵢᵀ"
            ],
            "desc": "V 的第 i 列，是右奇异列向量。公式里的 vᵢᵀ 是它的转置；sᵢuᵢvᵢᵀ 给出一项秩至多 1 的矩阵。"
          },
          {
            "sym": "r",
            "aliases": [
              "ʳ"
            ],
            "desc": "截断保留的项数，出现在求和上限。论文查表中的 r 与教学矩阵的保留项数用于不同实验，不能把二者的准确率联系起来。"
          },
          {
            "sym": "Aᵣ",
            "desc": "前 r 项组成的截断矩阵，秩至多为 r。这里演示 SVD 计算，论文真实隐藏张量的结果见截断实验表。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "个数与分布不同",
          "desc": "多个非零奇异值不一定均匀分担谱量。"
        },
        {
          "icon": "🔧",
          "title": "分清谱指标",
          "desc": "教学k95/k99用Σs²，熵有效秩用归一化的s。"
        },
        {
          "icon": "✨",
          "title": "诊断与性能分开",
          "desc": "Table 1 记录真实模型的截断实验；教学矩阵的变化不会改变这些 AUC。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "ch04-rbf",
      "title": "让不同数值激活不同的局部响应",
      "badge": "both",
      "badgeLabel": "数值机制",
      "bridge": "共享仿射映射把一个标量放到一条固定方向上。RBF换一种表示方式：检查它与多个中心分别有多近，让不同数值激活不同的响应组合。本章只解释RBF；下一章再补上标准化、投影和LN，得到完整RaBEL。",
      "analogy": {
        "title": "局部响应",
        "text": "教学类比：对焦范围可引出“某一位置附近响应更强”。这里不把相机真实光学当作RBF公式，也不把清晰度当成预测成绩。",
        "componentId": "analogy-04"
      },
      "modules": [
        {
          "kind": "module",
          "id": "M04-rbf-local",
          "title": "拖动数值，看局部响应如何分开",
          "desc": "把当前值x从0移到1，再比较窄、默认与宽带宽。曲线采样、响应向量和公式代入同时改变；没有准确率输出。",
          "componentId": "rbf-local-explorer"
        }
      ],
      "insight": "RBF把一个标量变成多个局部响应。非线性来自距离平方经过指数函数；更高维或更宽的响应不保证更高秩、更高准确率。",
      "formula": {
        "lead": "离某个中心越近，对应响应越强；带宽σ决定衰减有多快。把M个响应拼起来才得到φ。",
        "unicode": "κ(x,c,σ) = exp(−(x−c)²/(2σ²))； φ(x) = [κ₁(x), …, κᴹ(x)]",
        "symbols": [
          {
            "sym": "x",
            "desc": "送入RBF的当前标量。本章直接控制它；下一章展示其前面的列标准化。"
          },
          {
            "sym": "c",
            "desc": "核中心；教学例固定为−1、0、1。"
          },
          {
            "sym": "σ",
            "desc": "严格为正的带宽。教学例提供0.25、1、4三个条件。"
          },
          {
            "sym": "φ",
            "desc": "三个核响应组成的向量，还需要共享投影与每token LN，才完成RaBEL数值分支。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "中心决定位置",
          "desc": "x恰好等于中心时，该核响应为1。"
        },
        {
          "icon": "🔧",
          "title": "带宽决定范围",
          "desc": "窄核更局部；宽核的多个响应可能更相近。"
        },
        {
          "icon": "✨",
          "title": "RBF不是完整RaBEL",
          "desc": "下一章串起列标准化、展开、共享投影和LN。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "ch05-rabel",
      "title": "RaBEL：逐步算到模型输入",
      "badge": "both",
      "badgeLabel": "方法与机制",
      "bridge": "RBF 给出局部响应，但模型还需要固定宽度的输入。先分清列标准化、响应展开、共享投影和每 token LN，再与线性编码在共同条件下比较。依据固定 v2 p4 式(1)–(4)；可选门控见 pp4–5 式(5)–(10)。下一章观察这些 token 怎样交流。",
      "analogy": {
        "title": "校准只作引入",
        "text": "教学类比：摄影校准提示不同步骤各有作用；列标准化、投影和 LN 的对象与轴仍须按下面的数学视图区分。",
        "componentId": "analogy-05"
      },
      "modules": [
        {
          "kind": "module",
          "id": "M05-rabel-steps",
          "title": "从一列数到完整 RaBEL 输入",
          "desc": "用“下一步”追踪同一行：列标准化 → RBF → 共享投影 → 每 token LN。门控默认关闭，理解基础流程后可展开选读。所有小矩阵由手工教学参数实际计算。",
          "componentId": "rabel-stepper"
        },
        {
          "kind": "module",
          "id": "M05-embedding-compare",
          "title": "同一组数值，线性编码与 RaBEL 怎样不同？",
          "desc": "选择共同观察状态，同步查看两边矩阵与实际奇异谱。统一输入预处理和宽度 d=4，明确不同参数形状；不从高秩推出高准确率。",
          "componentId": "embedding-comparison-explorer"
        }
      ],
      "insight": "RBF 是响应展开，RaBEL 还包含共享投影与 LN。比较表示时必须同时说清预处理、观察阶段、中心化和归一化条件。",
      "formula": {
        "lead": "基础 RaBEL 的核心连接：先得到局部响应，再投到模型宽度并逐 token 归一化。",
        "unicode": "φⱼ(x̃) = exp[−(x̃ − cⱼ)² / (2σⱼ²)]；z = LN(Wφ(x̃) + b)",
        "symbols": [
          {
            "sym": "φⱼ",
            "desc": "第 j 个 RBF 的标量响应；所有 M 个响应合起来构成向量 φ。"
          },
          {
            "sym": "x̃",
            "desc": "经列 z-score 得到的标量；此步跨样本计算统计量。"
          },
          {
            "sym": "cⱼ",
            "desc": "第 j 个核的中心。教学值为 −1、0、1。"
          },
          {
            "sym": "σⱼ",
            "desc": "严格为正的带宽；基础教学值为1。"
          },
          {
            "sym": "φ",
            "desc": "M个局部响应组成的向量；本例M=3。"
          },
          {
            "sym": "W",
            "desc": "跨数值列共享的投影；本例形状4×3。"
          },
          {
            "sym": "LN",
            "desc": "沿一个token的隐藏通道归一化，与列标准化不是同一个轴。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "RBF 只是展开",
          "desc": "局部响应须经过共享投影和每 token LN 才完成基础 RaBEL。"
        },
        {
          "icon": "🔧",
          "title": "先锁定比较条件",
          "desc": "相同输入与宽度不等于等参数；LN前后与样本中心化的秩约束不同。"
        },
        {
          "icon": "✨",
          "title": "门控是可选扩展",
          "desc": "两个正门调中心与带宽，不增加幅值门，也不承诺严格尺度等变。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "ch06-attention",
      "title": "同一套 QKV，沿行还是沿列聚合？",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "数值已变成 token，现在要回答“谁向谁汇聚”。用小矩阵复算 QKV，再区分同行的 Feature Attention、同列的 Sample Attention 和逐 token 的 FFN。依据固定 v2 pp4–6 §4 与附录A。下一章补足这些参数与能力从哪里学来。",
      "analogy": {
        "title": "选一个关注位置",
        "text": "教学类比：取景范围引出 query；真实注意力按权重汇聚多项 V，不是相机只截取一块图像。",
        "componentId": "analogy-06"
      },
      "modules": [
        {
          "kind": "module",
          "id": "M06-axis-qkv",
          "title": "选一个 token，看它向谁汇聚",
          "desc": "点击高亮网格或对应按钮选 query，再切换交流轴。QK打分、softmax权重、V的加权和同步更新；输出明确是教学隐藏向量。",
          "componentId": "axis-attention-explorer"
        }
      ],
      "insight": "Feature / Sample Attention 改变交流轴，QK仍负责权重，V仍提供内容。FFN只在各 token 内变换通道。",
      "formula": {
        "lead": "本例为单头、dₖ=2：选择的 query 先计算匹配权重，再汇聚各 token 的 V。",
        "unicode": "a = softmax(qKᵀ / √dₖ)；o = aV",
        "symbols": [
          {
            "sym": "q",
            "desc": "当前选中token的查询向量；本例为2维。"
          },
          {
            "sym": "K",
            "desc": "参与交流的3个键向量，形状3×2；与q点积给出匹配分数。"
          },
          {
            "sym": "V",
            "desc": "3个值向量，形状3×2；提供实际被加权的内容。"
          },
          {
            "sym": "a",
            "desc": "3个非负softmax权重，总和为1。"
          },
          {
            "sym": "o",
            "desc": "2维教学隐藏向量，不是LimiX-2M任务预测。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "QK算权重，V供内容",
          "desc": "换query会改变匹配和加权结果，不能将注意力权重直接当成因果证明。"
        },
        {
          "icon": "🔧",
          "title": "两轴改变交流范围",
          "desc": "Feature Attention同行跨特征，Sample Attention同列跨样本。"
        },
        {
          "icon": "✨",
          "title": "FFN逐 token 变换",
          "desc": "FFN本身不跨行列传递信息；模块的前后安排留到第8章。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "ch07-pretrain",
      "title": "预训练学能力，新任务给上下文",
      "badge": "trn",
      "badgeLabel": "机制与训练",
      "bridge": "前面已经看过 Q、K、V 怎样汇聚信息。现在只补足一个区别：预训练时哪些东西会更新，新任务时哪些东西只是输入？理解后，再检查学好的模块如何排列并接到读出。",
      "analogy": {
        "title": "练习与使用",
        "text": "教学类比：练习可调整能力；新任务上下文并不意味着模型参数再次更新。相机只是短引入，技术流程如下。",
        "componentId": "analogy-07"
      },
      "modules": [
        {
          "kind": "module",
          "id": "M07-training-context",
          "title": "同一张任务卡，哪些东西会更新？",
          "desc": "先逐步查看预训练，再切换新任务使用。留意参数状态；一次回归更新只在选读中演示，不是 LimiX 的损失或权重。",
          "componentId": "training-context-stepper"
        }
      ],
      "insight": "预训练学习参数，新任务提供上下文。输入引起表示变化，不等于又执行了一次参数训练。",
      "formula": {
        "lead": "用一次线性回归更新理解这些记号；此处使用独立的教学损失。",
        "unicode": "θ′ = θ − η∇θL",
        "symbols": [
          {
            "sym": "θ",
            "desc": "待学习的参数；具体回归算例从 1 开始，不是 LimiX 权重。"
          },
          {
            "sym": "η",
            "desc": "学习率；教学算例固定为 0.1。"
          },
          {
            "sym": "∇θL",
            "desc": "损失对参数的梯度；教学算例初始值为 −10/3。"
          },
          {
            "sym": "θ′",
            "desc": "一次更新后的参数；新任务使用流程没有执行这个更新。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "任务提供经验",
          "desc": "本文从 DAG 和函数机制生成合成预训练任务。"
        },
        {
          "icon": "🔧",
          "title": "预训练更新参数",
          "desc": "参数沿减小损失的方向更新；本例的线性回归损失帮助理解更新过程。"
        },
        {
          "icon": "✨",
          "title": "新任务给上下文",
          "desc": "固定参数下处理新输入，再由读出完成任务输出。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "ch08-routing",
      "title": "FSN到SNF：信息能抵达最终读出吗？",
      "badge": "trn",
      "badgeLabel": "信息流机制",
      "bridge": "会沿行、沿列聚合还不够：先聚合什么、最后读取什么，会改变信息的去向。先保持两边读出相同，再分别考察模块顺序和读出范围。",
      "analogy": {
        "title": "摄影短引入：读出范围",
        "text": "教学类比：拉开裁切框能保留目标；网络中的路径仍要在下方技术图中核对。",
        "componentId": "analogy-08"
      },
      "modules": [
        {
          "kind": "module",
          "id": "M08-order-readout",
          "title": "把模块顺序与读出条件分开比较",
          "desc": "选中查询行的Sample Attention输出，比较原顺序与新顺序到读出的路径。路径可达只表示结构上可能传递信息，不表示贡献一定非零。",
          "componentId": "order-readout-explorer"
        }
      ],
      "insight": "先沿列收集上下文，再经FFN和Feature Attention融合，可以使上下文信息进入后续跨特征读出；结论须同时说明所在层与读出条件。",
      "formula": {
        "lead": "读出接收的是经过模块处理的表示；论文没有给出精确attention pooling权重公式。",
        "unicode": "h_out = Readout(Block(E))",
        "symbols": [
          {
            "sym": "E",
            "desc": "输入单元格嵌入。教学图只展开查询行的三个特征。"
          },
          {
            "sym": "Block",
            "desc": "原结构Feature Attention→Sample Attention→FFN；新结构Sample Attention→FFN→Feature Attention。"
          },
          {
            "sym": "Readout",
            "desc": "这里比较目标token读出和全部特征attention pooling；不能当作无条件算术平均。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "先获取列上下文",
          "desc": "Sample Attention先聚合同列样本信息，再供跨特征融合。"
        },
        {
          "icon": "🔧",
          "title": "N是FFN",
          "desc": "FSN/SNF是模块顺序缩写，Q、K、V的数学角色没有改变。"
        },
        {
          "icon": "✨",
          "title": "同时检查读出条件",
          "desc": "末层非目标路径的结论不能推广到目标列、更早层或任意读出。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "ch09-ablation",
      "title": "拆开改动，证据支持到哪里？",
      "badge": "both",
      "badgeLabel": "方法与证据",
      "bridge": "RaBEL 改变表示，注意力重排配合读出改变信息利用。机制说得通，还需要实验核对：先辨认保持项和改变项，再读分数；最后才看完整模型的成绩与成本。",
      "analogy": {
        "title": "只改变一项",
        "text": "教学类比：遮住补光板只帮助理解控制变量；真正实验数字来自论文固定记录，不来自摄影效果。",
        "componentId": "analogy-09"
      },
      "modules": [
        {
          "kind": "module",
          "id": "M09-ablation-evidence",
          "title": "选择一个结论，检查它依赖哪张证据",
          "desc": "四个入口分别对应浅层秩、替代嵌入、模块组合和模块次序。选择后同时核对条件、指标、原值和结论边界。",
          "componentId": "ablation-evidence-explorer"
        }
      ],
      "insight": "同一张图也有条件。更高的浅层秩、较好的实验分数与机制的完整因果证明，是不同层次的证据。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "先辨认改变项",
          "desc": "Tables 3/4、Table 5 与 Fig.3 回答不同问题。"
        },
        {
          "icon": "🔧",
          "title": "先看数据集和指标",
          "desc": "基准、指标方向、原表值与保持项一起看。"
        },
        {
          "icon": "✨",
          "title": "保留真实例外",
          "desc": "TabZilla 的 SNFN 高于 SNF，不能声称一种顺序处处最好。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "ch10-evidence",
      "title": "小模型的成绩、速度与结论边界",
      "badge": "both",
      "badgeLabel": "方法与证据",
      "bridge": "现在把局部改进与完整模型联系起来。按平均分、平均排名、参数量和指定条件耗时分别比较，再用两项改进、一条证据和一条局限收束整篇论文。",
      "analogy": {
        "title": "看结果也看条件",
        "text": "教学类比：成片有多种评价尺度；参数、成绩、耗时不能相互代替，下面每项使用各自的数据和单位。",
        "componentId": "analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "M10-results-boundary",
          "title": "比较成绩，也比较条件",
          "desc": "先读 BCCO 分类均值；再切到回归的平均分与平均排名，看排序如何改变。最后对照参数量和指定硬件耗时。",
          "componentId": "results-boundary-explorer"
        }
      ],
      "insight": "论文展示了约 200 万参数模型在所测条件下的竞争力。准确性、规模与速度的结论都要保留各自的比较条件。",
      "formula": {
        "lead": "例如 Table 26 的 GPU 耗时比可直接复算；这是指定实验的比值，不是训练提速。",
        "unicode": "耗时比 = t参考 / t本文 = 352.60 / 171.40 ≈ 2.06",
        "symbols": [
          {
            "sym": "t参考",
            "desc": "TabPFN-v2 的 GPU 平均耗时，352.60 ms。"
          },
          {
            "sym": "t本文",
            "desc": "LimiX-2M 的 GPU 平均耗时，171.40 ms。"
          },
          {
            "sym": "2.06",
            "desc": "900 样本、60 特征合成分类，RTX4090，3 次均值之比。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "小模型有竞争力",
          "desc": "1.92M 参数与多套件成绩共同构成证据，不意味着全面获胜。"
        },
        {
          "icon": "🔧",
          "title": "均值与排名不同",
          "desc": "回归例子中，平均分与平均排名给出不同排序。"
        },
        {
          "icon": "✨",
          "title": "速度依赖条件",
          "desc": "耗时比描述的是报告中的硬件、输入规模与测量流程。"
        }
      ]
    }
  ]
};
