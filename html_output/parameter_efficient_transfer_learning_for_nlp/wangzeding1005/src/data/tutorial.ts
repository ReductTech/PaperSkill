import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Parameter-Efficient Transfer Learning for NLP",
    "titleZh": "面向自然语言处理的参数高效迁移学习",
    "venue": "ICML 2019 · PMLR 97",
    "authors": "Neil Houlsby, Andrei Giurgiu, Stanisław Jastrzębski, Bruna Morrone, Quentin de Laroussilhe, Andrea Gesmundo, Mona Attariyan, Sylvain Gelly",
    "affiliation": "Google Research · Jagiellonian University",
    "domain": "自然语言处理 · 参数高效迁移学习 · BERT",
    "coreProblem": "全量微调会为每个下游任务保存一套完整模型，任务越多，训练与存储成本越高。",
    "coreInsight": "冻结同一套预训练主干，只在每层插入很小的瓶颈适配器，并训练任务层归一化与输出头：像保留同一台相机，只为不同任务更换轻量滤镜。",
    "keywords": [
      "Adapter",
      "参数高效微调",
      "迁移学习",
      "BERT"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "<b>全量微调：</b>每个任务一套完整权重，存储随任务数近似线性增长。",
      "componentId": "c1-hero-old"
    },
    "newMethod": {
      "desc": "<b>Adapter：</b>共享并冻结主干，每个任务只增加适配器、层归一化参数和任务头。",
      "componentId": "c1-hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "为什么每个任务都买一台相机？",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "先从部署成本出发：能完成一个任务还不够，关键是第 2、9、17 个任务到来时要新增多少参数。",
      "analogy": {
        "title": "同一机身，还是整机复制？",
        "text": "拍摄任务增加时，全量微调像为每种风格再买一台完整相机。论文追问：能否保留同一机身，只换一片很小的滤镜？",
        "componentId": "c1-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "让任务数量增长一次",
          "desc": "选择任务数并启动比较。画面只表达参数存储如何增长，不暗示推理更快或精度更高。",
          "componentId": "c1-storage-compare"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "哪些东西必须复制？",
          "desc": "逐行检查共享主干 <code>w</code>、任务参数 <code>v</code> 与旧任务数据在两种方案中的归属。",
          "componentId": "c1-ownership"
        }
      ],
      "insight": "真正的瓶颈不是“能不能适配”，而是每增加一个任务要保存多少新参数。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "问题",
          "desc": "整模复制难以扩展"
        },
        {
          "icon": "🔧",
          "title": "目标",
          "desc": "共享主干，只增小模块"
        },
        {
          "icon": "✨",
          "title": "边界",
          "desc": "每任务存储仍不为零"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "四条迁移路线，改动深浅不同",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "有了“新增参数”的尺度，再比较四类迁移方法究竟读取或改写了网络的哪些位置。",
      "analogy": {
        "title": "同一任务，四种改装深度",
        "text": "有的方法只读取机身已有特征，有的方法拆开整机重调。Adapter 在主干内部加入小滤镜，却保持原机身不动。",
        "componentId": "c2-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "切换迁移方法",
          "desc": "选择方法，观察 12 层主干、任务模块和参数归属如何改变。这里比较的是写入位置，不是把参数量直接等同于效果。",
          "componentId": "c2-transfer-modes"
        }
      ],
      "insight": "论文需要一种既能写入中间层、又不改动共享主干的方法。",
      "formula": {
        "lead": "用函数写法区分“读取特征”和“改造网络”。",
        "unicode": "特征迁移：χᵥ(φ_w(x))；Adapter：ψ_{w,v}(x)",
        "symbols": [
          {
            "sym": "w",
            "desc": "共享的预训练主干参数"
          },
          {
            "sym": "v",
            "desc": "当前任务参数"
          },
          {
            "sym": "φ / χ / ψ",
            "desc": "原模型、下游读取函数与插入任务模块后的网络"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "比较维度",
          "desc": "任务信息写到哪里"
        },
        {
          "icon": "🔧",
          "title": "Adapter",
          "desc": "在内部层加入小模块"
        },
        {
          "icon": "✨",
          "title": "避免混淆",
          "desc": "顶层微调不等于全量微调"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "冻结 w，只为新任务学习 v",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "Adapter 的系统价值来自参数所有权：共享的 w 锁住，每个任务拥有自己的 v。",
      "analogy": {
        "title": "换滤镜，不改机身",
        "text": "任务到来时只新增一片任务滤镜。旧滤镜被原样保留，再次装回时不会被新任务训练改写。",
        "componentId": "c3-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "让三个任务依次到来",
          "desc": "按步骤经历共享预训练、训练任务 A、训练任务 B，再返回 A；观察参数账本中的锁与新增条目。",
          "componentId": "c3-sequential-tasks"
        }
      ],
      "formula": {
        "lead": "新插入结构在初始化时应尽量保留原模型行为。",
        "unicode": "ψ_{w,v₀}(x) ≈ φ_w(x)",
        "symbols": [
          {
            "sym": "v₀",
            "desc": "任务参数的初始值"
          },
          {
            "sym": "≈",
            "desc": "初始化时近似相等，而非严格相等"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "任务到达",
          "desc": "可以顺序加入"
        },
        {
          "icon": "🔧",
          "title": "参数策略",
          "desc": "冻结共享 w"
        },
        {
          "icon": "✨",
          "title": "边界",
          "desc": "隔离避免干扰，但不共享任务知识"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "一片小滤镜如何改写高维表示？",
      "badge": "both",
      "badgeLabel": "核心",
      "bridge": "现在进入方法本体：一个适配器如何用 d→m→d 的瓶颈在小参数预算下改写表示。",
      "analogy": {
        "title": "先压缩，再还原",
        "text": "适配器先把 d 维表示压到更窄的 m 维通道，再恢复到 d 维。m 越小，滤镜越轻，但可调整容量也更有限。",
        "componentId": "c4-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "调节瓶颈宽度 m",
          "desc": "在论文相关的宽度 2、8、64、256 之间切换。示例取 BERT-BASE 的 <code>d=768</code>，准确计算单个适配器的投影参数量。",
          "componentId": "c4-bottleneck"
        }
      ],
      "formula": {
        "lead": "两个线性投影的权重和偏置给出单个适配器的参数量。",
        "unicode": "P_adapter = 2md + d + m",
        "symbols": [
          {
            "sym": "d",
            "desc": "Transformer 子层接口维度"
          },
          {
            "sym": "m",
            "desc": "适配器瓶颈宽度，m≪d 时节省明显"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "结构",
          "desc": "d→m→d"
        },
        {
          "icon": "🔧",
          "title": "精确参数",
          "desc": "2md+d+m"
        },
        {
          "icon": "✨",
          "title": "控制旋钮",
          "desc": "m 控制成本与容量，不保证精度单调增加"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "为什么要从“透明滤镜”开始？",
      "badge": "both",
      "badgeLabel": "核心",
      "bridge": "在每层插入新模块可能扰乱预训练表示，因此论文让适配器从接近恒等映射的位置起步。",
      "analogy": {
        "title": "先保持原样，再逐步校正",
        "text": "刚装上的滤镜应近似透明，让相机先保留原有成像；训练再逐步学出任务需要的改动。",
        "componentId": "c5-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "把初始化尺度拖离恒等点",
          "desc": "沿对数轴改变初始化标准差 σ。右侧只展示论文在 MNLI/CoLA 上的定性趋势，不伪造中间精确数值。",
          "componentId": "c5-identity-init"
        }
      ],
      "insight": "跳连提供原路径，小尺度投影只在其上学习残差式修正。",
      "formula": {
        "lead": "近恒等是受控的初始条件，不是收敛保证。",
        "unicode": "ψ_{w,v₀}(x) ≈ φ_w(x)",
        "symbols": [
          {
            "sym": "σ",
            "desc": "适配器投影初始化的尺度"
          },
          {
            "sym": "v₀",
            "desc": "接近零扰动的任务参数初值"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "起点",
          "desc": "接近原模型"
        },
        {
          "icon": "🔧",
          "title": "结构保障",
          "desc": "跳连保留主路径"
        },
        {
          "icon": "✨",
          "title": "风险",
          "desc": "过大初始化会破坏稳定性"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "推理时如何切换任务？",
      "badge": "inf",
      "badgeLabel": "应用",
      "bridge": "训练完成后，参数隔离转化为清晰的部署动作：保留同一主干，切换完整任务套件。",
      "analogy": {
        "title": "切任务，只换任务套件",
        "text": "共享主干始终不动；切换任务时，加载对应适配器、层归一化参数和输出头。",
        "componentId": "c6-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "在三个任务套件间切换",
          "desc": "情感、句对与问答只是路由示例，不代表本章比较这些任务的效果。每次切换都核对四类参数的状态。",
          "componentId": "c6-task-switch"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "复用",
          "desc": "一个共享主干"
        },
        {
          "icon": "🔧",
          "title": "切换",
          "desc": "适配器、归一化与任务头一起切"
        },
        {
          "icon": "✨",
          "title": "边界",
          "desc": "模块化不等于零存储"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "到底训练哪些参数？",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "参数量节省来自更新掩码，而不是跳过主干计算；下面沿一次优化步骤确认梯度与参数写入的区别。",
      "analogy": {
        "title": "只调焦环，不拆机身",
        "text": "训练时，梯度流经整台相机，但更新权限只开放给任务适配器、层归一化参数和任务头。",
        "componentId": "c7-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "跟一次训练更新",
          "desc": "从批次读取走到掩码更新。反向传播时可以计算主干相关梯度，但冻结参数不会被优化器写入。",
          "componentId": "c7-update-mask"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "学习率是否仍需调节？",
          "desc": "在论文附录搜索范围内选择低、中、高学习率，理解参数高效并不等于免除超参数选择。",
          "componentId": "c7-learning-rate"
        }
      ],
      "insight": "论文实验使用 Adam、前 10% 训练步 warmup，随后线性衰减；具体最优值仍由验证集选择。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "写入权限",
          "desc": "由更新掩码决定"
        },
        {
          "icon": "🔧",
          "title": "实验协议",
          "desc": "仍需调参与验证集选择"
        },
        {
          "icon": "✨",
          "title": "计算边界",
          "desc": "冻结主干不等于跳过主干计算"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "两个适配器插在 Transformer 的哪里？",
      "badge": "trn",
      "badgeLabel": "结构",
      "bridge": "理解目的、参数量和训练方式后，再把适配器精确放回论文采用的 Transformer 层结构。",
      "analogy": {
        "title": "每层有两个滤镜卡位",
        "text": "论文在每个 Transformer 层设置两个适配器卡位：注意力子层投影后一个，前馈子层投影后一个。",
        "componentId": "c8-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点击组件，检查训练状态",
          "desc": "选择层内组件，核对其位置、作用与冻结状态。交互只呈现论文结构，不开放未经论文验证的任意插入位置。",
          "componentId": "c8-architecture-map"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "让一个隐藏状态走过当前层",
          "desc": "逐步经过注意力投影、Adapter A、残差与归一化、前馈投影、Adapter B，再回到 d 维层接口。",
          "componentId": "c8-propagation"
        }
      ],
      "formula": {
        "lead": "每个适配器保持输入输出维度 d，只在内部经过 m。",
        "unicode": "ℝᵈ → ℝᵐ → ℝᵈ",
        "symbols": [
          {
            "sym": "d",
            "desc": "Transformer 层接口维度"
          },
          {
            "sym": "m",
            "desc": "适配器内部瓶颈宽度，通常 m≪d"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "重复位置",
          "desc": "每层两个串联适配器"
        },
        {
          "icon": "🔧",
          "title": "维度",
          "desc": "层接口保持 d"
        },
        {
          "icon": "✨",
          "title": "条件",
          "desc": "位置是论文设计，不是任意插入"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "消融告诉我们什么，不能告诉我们什么？",
      "badge": "trn",
      "badgeLabel": "分析",
      "bridge": "先学会给消融结论加条件，再阅读最后的总成绩，避免把局部观察升级成普遍规律。",
      "analogy": {
        "title": "遮住一段镜组再观察",
        "text": "作者不重训模型，而是移除已训练适配器的一段层区间，观察验证性能如何变化。",
        "componentId": "c9-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "选择要移除的连续层区间",
          "desc": "用起始层、结束层和数据集控件选择消融区间。仅对论文明确报告的状态给出精确值，其余状态只描述趋势。",
          "componentId": "c9-ablation-span"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "比较三个已报告宽度",
          "desc": "比较 m=8、64、256 在八个分类条目上的平均验证准确率；STS-B 因为是回归任务而未纳入该平均。",
          "componentId": "c9-width-robustness"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "整体作用",
          "desc": "单层小影响可累积"
        },
        {
          "icon": "🔧",
          "title": "条件性",
          "desc": "高层更关键只来自特定消融"
        },
        {
          "icon": "✨",
          "title": "读法",
          "desc": "结论必须带模型、数据和配置"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "参数效率换来了什么，又没有解决什么？",
      "badge": "both",
      "badgeLabel": "结果",
      "bridge": "最后把效果、训练参数和整套任务存储放回各自协议中，形成一条不夸大的证据链。",
      "analogy": {
        "title": "按同一规则冲线",
        "text": "只有在同一数据集、模型、划分和指标下，终点才可比较。GLUE、17 任务与 SQuAD 必须分轨展示。",
        "componentId": "c10-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "选择协议，再开始比较",
          "desc": "分别查看 GLUE、17 个分类任务和 SQuAD v1.1；每条轨道使用自己的指标，不把不可比的分数放在同一坐标轴。",
          "componentId": "c10-result-race"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "给结论加上适用边界",
          "desc": "点击结论类型，辨别过度概括与论文证据支持的限定表述。",
          "componentId": "c10-boundaries"
        }
      ],
      "insight": "论文证明的是“在这些 BERT 迁移协议下接近全量微调并显著减小每任务参数”，不是所有任务上无条件更优。",
      "formula": {
        "lead": "结果章只保留部署比例，不制造跨协议统一分数。",
        "unicode": "每任务训练比例 = 任务可训练参数 / 主干参数",
        "symbols": [
          {
            "sym": "训练比例",
            "desc": "论文表格在命名协议下给出的百分比"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "主要结果",
          "desc": "效果接近而参数大幅减少"
        },
        {
          "icon": "🔧",
          "title": "证据范围",
          "desc": "分类与问答协议分别验证"
        },
        {
          "icon": "✨",
          "title": "仍未解决",
          "desc": "任务知识共享、零存储与普适最优"
        }
      ]
    }
  ]
};
