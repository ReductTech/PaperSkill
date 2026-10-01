import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Hierarchical Decomposition of Prompt-Based Continual Learning: Rethinking Obscured Sub-optimality",
    "titleZh": "基于提示的持续学习的分层分解：重思被遮蔽的次优性",
    "venue": "arXiv preprint · 2023",
    "authors": "Liyuan Wang, Jingyi Xie, Xingxing Zhang, Mingyi Huang, Hang Su, Jun Zhu",
    "affiliation": "清华大学计算机科学与技术系、人工智能研究院",
    "domain": "持续学习 / Prompt / 自监督预训练",
    "coreProblem": "现有 prompt 持续学习在监督预训练下接近上限，但在更现实的自监督预训练下会暴露明显次优性。",
    "coreInsight": "持续学习目标可拆成 WTP、TII 与 TAP；通过任务专属 prompt 集成、表示统计和对比正则显式优化三者，可在多种预训练范式和基准上提升最终准确率并降低遗忘。",
    "keywords": [
      "持续学习",
      "Prompt 集成",
      "WTP",
      "TII",
      "TAP",
      "表示统计"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "现有方案常把任务身份与任务内预测混在同一流程中，自监督表示又更相似，从而暴露任务知识写入不足的问题。",
      "componentId": "hero-old-scene"
    },
    "newMethod": {
      "desc": "HiDe-Prompt 将目标拆成三层，并用任务专属 prompt、统计表示与对比正则来协调 WTP、TII 与 TAP。",
      "componentId": "hero-new-scene"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "被遮蔽的次优性",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "先不从公式出发：如果所有旅行页都盖同一枚印章，任务差异会在什么时候消失？",
      "analogy": {
        "title": "一张通用印章，为什么盖出相似的旅行页？",
        "text": "通用印章让所有页面都像同一次旅行。自监督预训练下，这种“看似通用”反而遮住了任务差异。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "通用印章强度",
          "desc": "拖动强度，观察<b>无指令表示</b>与<b>有指令表示</b>如何越来越相似，任务身份又如何变难预测。",
          "componentId": "universal-stamp"
        }
      ],
      "insight": "任务不是越“统一”越好：prompt 需要写入任务专属知识，才能让持续学习不被表面的通用性遮蔽。",
      "takeaways": [
        {
          "icon": "🫥",
          "title": "监督预训练会有错觉",
          "desc": "接近上限的表现可能来自预训练范式，而不是方法本身已经足够。"
        },
        {
          "icon": "📎",
          "title": "表示相似度是诊断",
          "desc": "自监督下无指令与有指令表示更接近，任务知识更难被 prompt 注入。"
        },
        {
          "icon": "🧭",
          "title": "任务身份会变难",
          "desc": "论文诊断中任务身份预测常低于 40%，它不能被视为自动可靠。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "两种表示的距离",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "既然问题是任务知识没有被写入，我们需要先看清两种表示到底差在哪里。",
      "analogy": {
        "title": "同一张照片，两层“装帧”",
        "text": "松散照片更像无指令表示，盖章后的页签更像有指令表示；两者越接近，任务知识越难注入。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "表示距离滑轨",
          "desc": "拖动照片卡：横向越靠右，两种表示的 <b>CKA 相似度</b> 越高；纵向位置表示任务特异性。",
          "componentId": "representation-map"
        }
      ],
      "insight": "CKA 是诊断量，不是越大越好；论文指出自监督表示更相似，因而 prompt 更难注入任务知识。",
      "formula": {
        "lead": "当两种表示越来越相似，任务专属信息就越难只留在有指令一侧。",
        "unicode": "<b>CKA(ĥ, h) ↑</b>",
        "symbols": [
          {
            "sym": "CKA",
            "desc": "Centered Kernel Alignment，用于比较两组表示的相似程度。"
          },
          {
            "sym": "ĥ",
            "desc": "无指令表示（uninstructed representation）。"
          },
          {
            "sym": "h",
            "desc": "经 prompt 指令后的表示（instructed representation）。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧺",
          "title": "两个表示空间",
          "desc": "无指令表示负责任务识别和统计，有指令表示负责任务内分类。"
        },
        {
          "icon": "📐",
          "title": "相似度是诊断",
          "desc": "高 CKA 只说明两空间更接近，并不直接等于最终性能好。"
        },
        {
          "icon": "🪄",
          "title": "需要主动写入",
          "desc": "要让 prompt 有效，必须先让任务知识有可注入的差异。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "任务知识需要分层",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "表示差异说明需要主动写入，但究竟要写入哪些目标？论文给出的答案是三个层次。",
      "analogy": {
        "title": "翻过三张索引卡",
        "text": "先学会本页内的分类，再认出是哪次旅行，最后把所有页的照片放回全局索引。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "三层目标步进器",
          "desc": "按顺序步进，观察 <b>WTP、TII、TAP</b> 如何从局部任务内预测扩展到全局类别预测。",
          "componentId": "hierarchy-stepper"
        }
      ],
      "insight": "这不是三个彼此独立的名字，而是一条从任务内到任务身份再到全局类别的层级链路。",
      "formula": {
        "lead": "CIL 的目标先被拆成一个任务内概率和一个任务身份概率的乘积。",
        "unicode": "<b>P(X<sup>i,j</sup>|D,θ) = P(X<sup>i,j</sup>|X<sup>i</sup>,D,θ) · P(X<sup>i</sup>|D,θ)</b>",
        "symbols": [
          {
            "sym": "P",
            "desc": "类别或任务的后验概率。"
          },
          {
            "sym": "X<sup>i,j</sup>",
            "desc": "任务 i 中的第 j 个类别域。"
          },
          {
            "sym": "X<sup>i</sup>",
            "desc": "任务 i 的域。"
          },
          {
            "sym": "D",
            "desc": "已经见到的任务数据序列。"
          },
          {
            "sym": "θ",
            "desc": "预训练并冻结的主干参数。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "WTP",
          "desc": "在已知任务内区分类别，回答“这是任务里的哪一类”。"
        },
        {
          "icon": "🧩",
          "title": "TII",
          "desc": "从无指令表示判断任务身份，回答“这是哪一册”。"
        },
        {
          "icon": "🌍",
          "title": "TAP",
          "desc": "直接在全部已见类别上预测标签，回答“全局索引指向谁”。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "CIL 目标的三层分解",
      "badge": "both",
      "badgeLabel": "基础 + 进阶",
      "bridge": "有了三层视角，下一步要问：只修好其中一两层，为什么仍然不够？",
      "analogy": {
        "title": "三条装订环，不能只扣一条",
        "text": "WTP、TII、TAP 像三个装订环：任意一个松掉，整本相册都不稳定。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "误差上界组合",
          "desc": "切换组件组合，观察 <b>WTP/TII 的联合误差</b> 与 <b>TAP 的独立误差</b> 如何被同一个上界控制。",
          "componentId": "objective-balance"
        }
      ],
      "insight": "论文的充分条件不是让某一个损失最小，而是让 WTP/TII 之和与 TAP 都不成为短板。",
      "formula": {
        "lead": "当三个交叉熵分别被 δ、ε、η 约束时，CIL 的损失误差落在以下区间。",
        "unicode": "<b>L ∈ [0, max{δ + ε, η}]</b>",
        "symbols": [
          {
            "sym": "L",
            "desc": "持续学习的损失误差。"
          },
          {
            "sym": "δ",
            "desc": "WTP 的交叉熵上界。"
          },
          {
            "sym": "ε",
            "desc": "TII 的交叉熵上界。"
          },
          {
            "sym": "η",
            "desc": "TAP 的交叉熵上界。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "➕",
          "title": "δ + ε",
          "desc": "WTP 与 TII 通过乘积关系共同决定一个可用上界。"
        },
        {
          "icon": "🌐",
          "title": "η",
          "desc": "TAP 直接在全部已见类别上预测，是预训练场景中的独立目标。"
        },
        {
          "icon": "⚖️",
          "title": "短板决定上界",
          "desc": "max{δ+ε, η} 提示三层需要协同，而不是只看一个损失。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "任务身份推断",
      "badge": "both",
      "badgeLabel": "基础 + 进阶",
      "bridge": "三层目标中，最容易被忽略的是任务身份：如果连在哪一册都不知道，后续预测还能可靠吗？",
      "analogy": {
        "title": "先认出这是哪一册",
        "text": "照片内容再清楚，如果放进错误章节，整本相册的索引仍然会错。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "任务身份热点图",
          "desc": "点击照片，观察它从<b>无指令表示</b>被预测到哪个任务；再启用 TII 看错误如何收敛。",
          "componentId": "identity-hotspots"
        }
      ],
      "insight": "任务身份不是顺手得到的附属品，论文用额外输出层直接学习无指令表示到任务身份的映射。",
      "formula": {
        "lead": "TII 的目标是在观测到任务数据后，对任务身份做分类。",
        "unicode": "<b>H<sub>TII</sub>(x) = H(1<sub>i</sub>, {P(x ∈ X<sup>i</sup>|D,θ)}<sub>i</sub>)</b>",
        "symbols": [
          {
            "sym": "H",
            "desc": "交叉熵。"
          },
          {
            "sym": "1<sub>i</sub>",
            "desc": "任务身份 i 的 one-hot 编码。"
          },
          {
            "sym": "X<sup>i</sup>",
            "desc": "任务 i 的域。"
          },
          {
            "sym": "D",
            "desc": "已观测到任务序列。"
          },
          {
            "sym": "θ",
            "desc": "冻结的预训练主干。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🪪",
          "title": "从无指令表示出发",
          "desc": "TII 在不依赖已选 prompt 的表示上判断任务身份。"
        },
        {
          "icon": "🧱",
          "title": "独立辅助层",
          "desc": "任务身份由专门输出层持续学习，不让错误传导到后续分类。"
        },
        {
          "icon": "🔗",
          "title": "错误会连锁",
          "desc": "任务身份错了，后续 prompt 选择和类别预测也会受影响。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "Prompt 集成改善 WTP",
      "badge": "both",
      "badgeLabel": "基础 + 进阶",
      "bridge": "任务身份推理解决了“用哪一册”，接下来要解决“这一册里的知识怎样稳定继承”。",
      "analogy": {
        "title": "旧墨与新墨，怎样滚在一起？",
        "text": "新任务不是从空白开始，旧 prompt 负责传递知识；但混得太多，也会压住当前任务。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "Prompt 集成比例",
          "desc": "调整旧知识权重 α，观察旧任务知识与当前任务适配如何共同决定新页面的颜色。",
          "componentId": "ensemble-mixer"
        }
      ],
      "insight": "论文让新 prompt 从上一任务初始化，再与冻结的历史 prompt 加权组合；α 控制传递多少旧知识。",
      "formula": {
        "lead": "第 t 个任务的组合 prompt，由历史 prompt 的加权和与当前 prompt 共同构成。",
        "unicode": "<b>p<sub>t</sub> = α Σ<sub>i=1</sub><sup>t-1</sup> e<sub>i</sub> + (1-α)e<sub>t</sub></b>",
        "symbols": [
          {
            "sym": "p<sub>t</sub>",
            "desc": "当前任务使用的组合 prompt。"
          },
          {
            "sym": "α",
            "desc": "历史 prompt 的权重；论文默认 0.1。"
          },
          {
            "sym": "e<sub>i</sub>",
            "desc": "第 i 个任务专属 prompt。"
          },
          {
            "sym": "e<sub>t</sub>",
            "desc": "当前任务 prompt，从上一任务初始化。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🌱",
          "title": "继承初始化",
          "desc": "新任务 prompt 从上一任务出发，减少从零学习成本。"
        },
        {
          "icon": "🧊",
          "title": "旧 prompt 冻结",
          "desc": "历史知识不会因为学习新任务而被直接覆盖。"
        },
        {
          "icon": "🎚️",
          "title": "α 控制平衡",
          "desc": "0.1 让旧知识提供迁移，同时让当前任务保持主导。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "对比正则协调 TAP",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "Prompt 集成把知识带进当前任务，但新类与旧类还不能互相挤压；这需要表示层面的协调。",
      "analogy": {
        "title": "不是擦掉旧照片，而是让它们互不挤压",
        "text": "对比正则在同页中保留旧类信息，让新照片与旧照片兼容，同时避免重叠成一片。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "对比正则强度",
          "desc": "切换论文报告的 λ 值，比较 <b>WTP 单独训练</b> 与 <b>完整 WTP+TII+TAP</b> 的不同趋势。",
          "componentId": "contrastive-modes"
        }
      ],
      "insight": "CR 不是无条件提升 WTP，而是让旧类原型参与表示协调，从而改善完整模型的兼容性。",
      "formula": {
        "lead": "当前表示 h 要与旧类原型 μ_c 兼容，同时避免与当前 batch 中的其他表示混淆。",
        "unicode": "<b>L<sub>CR</sub>(p<sub>t</sub>) = Σ<sub>h∈H<sub>t</sub></sub> −log( exp(h·μ<sub>c</sub>/τ) / Σ<sub>h′</sub> exp(h·h′/τ) + Σ<sub>c</sub> exp(h·μ<sub>c</sub>/τ) )</b>",
        "symbols": [
          {
            "sym": "L<sub>CR</sub>",
            "desc": "对比正则损失。"
          },
          {
            "sym": "H<sub>t</sub>",
            "desc": "当前任务样本经过 fθ 与 p_t 后的表示集合。"
          },
          {
            "sym": "μ<sub>c</sub>",
            "desc": "旧任务类别 c 的表示原型均值。"
          },
          {
            "sym": "τ",
            "desc": "温度系数；论文默认 0.8。"
          },
          {
            "sym": "λ",
            "desc": "CR 在总损失中的强度；论文默认 0.1。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📌",
          "title": "旧类统计是锚点",
          "desc": "μ_c 帮助当前表示与旧任务保持兼容。"
        },
        {
          "icon": "🪞",
          "title": "兼容但不混淆",
          "desc": "新类需要与旧类共存，同时保持可区分。"
        },
        {
          "icon": "🔄",
          "title": "存在取舍",
          "desc": "λ 增大时完整模型可以更好，但 WTP 单独指标可能下降。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "可交互的 HiDe-Prompt 架构",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "现在把 WTP、TII、TAP 与 prompt 集成、表示统计放到同一张架构图上，追踪一条样本路径。",
      "analogy": {
        "title": "把一页相册折成三层结构",
        "text": "同一张页面可以折出任务身份、任务内预测和全局预测三条路径，最后再钉回同一本相册。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "架构热点与路径",
          "desc": "点击架构节点，观察样本从无指令表示经 TII、Prompt 集成到有指令表示与 TAP 的路径。",
          "componentId": "hierarchical-architecture"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "场景路径切换",
          "desc": "切换 CIL、DIL、TIL，观察哪些层级必须显式建模，以及误差界如何变化。",
          "componentId": "path-switcher"
        }
      ],
      "insight": "共享冻结主干只是起点；真正关键是让 TII、WTP、TAP 各自获得合适的表示统计和预测路径。",
      "formula": {
        "lead": "测试时先从无指令表示预测任务身份，再用该任务对应的 prompt 做标签预测。",
        "unicode": "<b>i = ĥ<sub>ω</sub>(f<sub>θ</sub>(x)), &nbsp; y = h<sub>ψ</sub>(f<sub>θ</sub>(x; p<sub>i</sub>))</b>",
        "symbols": [
          {
            "sym": "i",
            "desc": "预测得到的任务身份。"
          },
          {
            "sym": "ĥ<sub>ω</sub>",
            "desc": "任务身份辅助输出层。"
          },
          {
            "sym": "f<sub>θ</sub>",
            "desc": "冻结的预训练视觉 Transformer 主干。"
          },
          {
            "sym": "h<sub>ψ</sub>",
            "desc": "覆盖全部已见类别的输出层。"
          },
          {
            "sym": "p<sub>i</sub>",
            "desc": "任务 i 对应的组合 prompt。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧱",
          "title": "冻结主干",
          "desc": "θ 不做反向更新，prompt 与辅助输出层承担持续适配。"
        },
        {
          "icon": "🪜",
          "title": "分路优化",
          "desc": "TII、WTP、TAP 分别优化，但通过统计与表示彼此协同。"
        },
        {
          "icon": "🔀",
          "title": "场景有边界",
          "desc": "CIL、DIL、TIL 的可用组件和误差界并不相同。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "表示统计与存储预算",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "架构需要保存表示统计，但样本不是越多越好；回到相册色卡，看看保留多少才够用。",
      "analogy": {
        "title": "保留几张色卡才够？",
        "text": "统计不是把整页照片都存下来，而是保留少量代表点；关键是用得少，还能保持区分能力。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "质心预算拖拽",
          "desc": "拖动样本夹选择 1–10 个质心，并比较单高斯与多质心在对应协议下的 FAA。",
          "componentId": "statistics-budget"
        }
      ],
      "insight": "论文用均值与协方差近似类别分布，也允许用 KNN 多质心；平均约 5 个质心就能保持较强表现。",
      "formula": {
        "lead": "多质心把类别统计写成若干代表点的平均，降低保存整类分布的成本。",
        "unicode": "<b>μ<sub>c</sub> ≈ (1/K) Σ<sub>k=1</sub><sup>K</sup> μ<sub>c,k</sub></b>",
        "symbols": [
          {
            "sym": "μ<sub>c</sub>",
            "desc": "类别 c 的代表统计。"
          },
          {
            "sym": "K",
            "desc": "保留的质心数量。"
          },
          {
            "sym": "c",
            "desc": "某个已见类别。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "💾",
          "title": "单高斯",
          "desc": "保存均值与方差，存储最省，适合分布较稳定的表示。"
        },
        {
          "icon": "🗂️",
          "title": "多质心",
          "desc": "约 5 个代表点即可接近单高斯，同时更具通用性。"
        },
        {
          "icon": "🧾",
          "title": "看协议",
          "desc": "不同预训练模型与基准的统计趋势并不完全一致。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "跨预训练、跨基准的结果",
      "badge": "both",
      "badgeLabel": "基础 + 进阶",
      "bridge": "最后回到可核验的结果：同一预训练模型、同一数据拆分下，HiDe-Prompt 与其他 prompt 方法差多少？",
      "analogy": {
        "title": "同一把尺子，比较最后结果",
        "text": "结果不是靠颜色深浅判断，而是用相同的预训练模型、数据集和拆分协议，读取最终平均准确率。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "验证结果竞速",
          "desc": "选择匹配协议后开始比较：FAA 向上增长，FFM 向下表示遗忘更少。",
          "componentId": "result-race"
        }
      ],
      "insight": "结论应和协议绑定：论文报告相同设定下 HiDe-Prompt 的 FAA/CAA 更高、FFM 更低，但限定于充分预训练与 Transformer 主干。",
      "formula": {
        "lead": "三个持续学习指标的方向不同，读取结果时必须同时看准确率与遗忘。",
        "unicode": "<b>FAA ↑ &nbsp; CAA ↑ &nbsp; FFM ↓</b>",
        "symbols": [
          {
            "sym": "FAA",
            "desc": "最终平均准确率，越高越好。"
          },
          {
            "sym": "CAA",
            "desc": "历史累计平均准确率，越高越好。"
          },
          {
            "sym": "FFM",
            "desc": "最终遗忘指标，越低越好。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧪",
          "title": "同等协议",
          "desc": "预训练模型、数据集拆分和评测基线必须一一对应。"
        },
        {
          "icon": "📈",
          "title": "准确率和遗忘分开看",
          "desc": "FAA/CAA 向上，FFM 向下，不能混成单一分数。"
        },
        {
          "icon": "🚧",
          "title": "边界明确",
          "desc": "方法依赖充分预训练，且主要适用于 Transformer 主干。"
        }
      ]
    }
  ]
};
