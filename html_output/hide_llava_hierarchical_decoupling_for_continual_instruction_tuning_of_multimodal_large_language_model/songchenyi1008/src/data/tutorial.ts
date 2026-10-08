import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "HiDe-LLaVA: Hierarchical Decoupling for Continual Instruction Tuning of Multimodal Large Language Model",
    "titleZh": "HiDe-LLaVA：面向多模态大模型持续指令微调的分层解耦",
    "venue": "arXiv 2025",
    "authors": "Haiyang Guo; Fanhu Zeng; Ziwei Xiang; Fei Zhu; Da-Han Wang; Xu-Yao Zhang; Cheng-Lin Liu",
    "affiliation": "UCAS · CASIA · HKISI-CAS · 厦门理工学院",
    "domain": "多模态大模型 / 持续学习 / 参数高效微调",
    "coreProblem": "持续指令微调必须同时解决<b>灾难性遗忘</b>、新任务适配与参数效率；旧基准还可能因预训练数据重叠而高估方法。",
    "coreInsight": "论文的 CKA 分析显示：多数下层偏向<b>共享知识</b>，顶层偏向<b>任务特异知识</b>。HiDe-LLaVA 因而融合下层 LoRA，并用图像与文本锚点为顶层选择专家。",
    "keywords": [
      "持续指令微调",
      "CKA 分层解耦",
      "LoRA 专家",
      "双模态锚点",
      "参数效率"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "全层顺序微调或全层扩展：旧任务容易漂移，参数随任务数增长。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "下层融合共享知识，顶层用图文锚点选择专家；论文 UCIT 报告 Avg 68.94 / Last 64.19。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "持续微调的两难：记住新任务，还是守住旧能力？",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "先别急着看框架。持续指令微调同时要求学会新任务、保住旧任务，还要控制每轮新增参数。",
      "analogy": {
        "title": "先看清木料叠层",
        "text": "木工先检查<b>下层底座</b>和<b>顶层面板</b>；如果每来一位顾客就重做整套柜子，成本会迅速累积。",
        "componentId": "analogy-01"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "泄漏会让考试变简单",
          "desc": "拖动<b>预训练重合度</b>，观察旧基准为何会把熟悉度误当成抗遗忘能力。",
          "componentId": "leak-model"
        }
      ],
      "insight": "评测先要保证“没见过”，方法才有资格谈抗遗忘。",
      "formula": {
        "lead": "每个任务仍用自回归损失学习当前回答。",
        "unicode": "L<sub>MLM</sub><sup>t</sup> = −Σ<sub>l</sub> log p(x<sub>ans</sub><sup>l</sup> | x<sub>v</sub><sup>t</sup>, x<sub>ins</sub><sup>t</sup>, x<sub>ans</sub><sup>&lt;l</sup>; θ)",
        "symbols": [
          {
            "sym": "L_MLM^t",
            "desc": "当前任务的多模态自回归损失"
          },
          {
            "sym": "θ",
            "desc": "MLLM 的可训练参数"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "双重约束",
          "desc": "既要学会新指令，也要保持旧任务表现。"
        },
        {
          "icon": "🔎",
          "title": "评测可信",
          "desc": "预训练数据重叠会放大旧基准分数。"
        },
        {
          "icon": "📦",
          "title": "效率入账",
          "desc": "参数与推理内存必须和性能一起比较。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "CKA先找到“共享层”和“专属层”",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "既然要分层，先得知道哪些层在跨任务时相似、哪些层在输出前分化。",
      "analogy": {
        "title": "量一量木纹",
        "text": "同一块底座上的木纹在多数区域一致，靠近端头才出现为不同用途定制的纹理。",
        "componentId": "analogy-02"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "切换观察层深度",
          "desc": "选择<b>底层、中层或顶层</b>，比较不同任务在同层输出上的 CKA 相似度。",
          "componentId": "cka-layers"
        }
      ],
      "insight": "CKA把“哪层共享、哪层专属”变成了可观察的分工。",
      "formula": {
        "lead": "CKA用核矩阵比较两组同层特征，值越高表示越相似。",
        "unicode": "CKA(X<sub>i</sub>,Y<sub>i</sub>) = HSIC(K<sub>Xi</sub>,K<sub>Yi</sub>) / √(HSIC(K<sub>Xi</sub>,K<sub>Xi</sub>)HSIC(K<sub>Yi</sub>,K<sub>Yi</sub>))",
        "symbols": [
          {
            "sym": "X_i, Y_i",
            "desc": "两个任务在第 i 层的特征"
          },
          {
            "sym": "K",
            "desc": "线性核矩阵"
          },
          {
            "sym": "HSIC",
            "desc": "核矩阵间的依赖度量"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧭",
          "title": "同层比较",
          "desc": "只有同一层输出之间的比较才有意义。"
        },
        {
          "icon": "🧱",
          "title": "下层共享",
          "desc": "多数下层在跨任务时保持较高相似度。"
        },
        {
          "icon": "🎚️",
          "title": "顶层分化",
          "desc": "接近输出的层更集中承载任务差异。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "分层解耦：顶层选择，其余融合",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "CKA给出的差异说明了结构方向：以顶层承载任务特异性，以其余层承载共享知识。",
      "analogy": {
        "title": "顶板要对准锁扣",
        "text": "底座可以共用，但顶板必须拿到正确的两把钥匙；只做其中一件事都不完整。",
        "componentId": "analogy-03"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "把顶板拖到正确锁扣",
          "desc": "拖动顶层面板，体验<b>顶层选择</b>和<b>下层融合</b>为什么必须同时成立。",
          "componentId": "decouple-drag"
        }
      ],
      "insight": "共享知识放下层，任务差异留顶层。",
      "takeaways": [
        {
          "icon": "🪵",
          "title": "下层融合",
          "desc": "把跨任务共通部分压成一个共享底座。"
        },
        {
          "icon": "🔑",
          "title": "顶层选择",
          "desc": "保留每个任务的专属 LoRA 能力。"
        },
        {
          "icon": "⚖️",
          "title": "同时成立",
          "desc": "只融合或只扩展都会留下明显缺口。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "图文双锚点：让输入自己说明来自哪类任务",
      "badge": "both",
      "badgeLabel": "训练+推理",
      "bridge": "要选择顶层专家，不必询问任务编号；先为每个已学任务留下可匹配的双模态坐标。",
      "analogy": {
        "title": "盖下两枚样章",
        "text": "一张图留下纹理章，一句指令留下文字章；两枚章一起说明这块板属于谁。",
        "componentId": "analogy-04"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "走完锚点提取三步",
          "desc": "逐步查看图像特征、文本特征如何被平均成每个任务的<b>双模态锚点</b>。",
          "componentId": "anchor-steps"
        }
      ],
      "insight": "不用任务编号，也能为输入准备“来自哪类任务”的双模态线索。",
      "formula": {
        "lead": "对每个任务，分别平均 CLIP 图像特征与指令文本特征。",
        "unicode": "m<sub>v</sub><sup>t</sup> = (1/N<sub>t</sub>)Σ<sub>n</sub> f<sub>v</sub>(x<sub>v</sub><sup>t,n</sup>),　m<sub>ins</sub><sup>t</sup> = (1/N<sub>t</sub>)Σ<sub>n</sub> f<sub>ins</sub>(x<sub>ins</sub><sup>t,n</sup>)",
        "symbols": [
          {
            "sym": "N_t",
            "desc": "任务 t 的样本数"
          },
          {
            "sym": "f_v, f_ins",
            "desc": "CLIP 图像与文本编码器"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📍",
          "title": "任务原型",
          "desc": "锚点存储在特征空间，不保存原始样本。"
        },
        {
          "icon": "🖼️",
          "title": "视觉线索",
          "desc": "图像锚点捕捉画面风格与内容差异。"
        },
        {
          "icon": "📝",
          "title": "文本线索",
          "desc": "文本锚点补足指令形式与问题类型差异。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "相似度软路由：不是硬切任务，而是分配权重",
      "badge": "both",
      "badgeLabel": "训练+推理",
      "bridge": "有了锚点，测试输入就能和每个任务比较；下一步是把相似度变成稳定、可微的专家权重。",
      "analogy": {
        "title": "用卡尺比较纹理",
        "text": "不要硬猜一块板，先量两个匹配度，再让权重按比例分配。",
        "componentId": "analogy-05"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "给两个锚点分配权重",
          "desc": "调节<b>图像权重 α、文本权重 β 和温度 T</b>，观察余弦相似度怎样变成 softmax 专家权重。",
          "componentId": "routing-weights"
        }
      ],
      "insight": "相似度不是结论，而是专家权重的原料。",
      "formula": {
        "lead": "双模态相似度先加权合成，再经温度缩放的 softmax 归一化。",
        "unicode": "d<sub>c</sub> = e<sup>r̄<sub>c</sub>/T</sup> / Σ<sub>j</sub> e<sup>r̄<sub>j</sub>/T</sup>,　r̄<sub>j</sub> = α·r<sub>v</sub><sup>j</sup> + β·r<sub>ins</sub><sup>j</sup>",
        "symbols": [
          {
            "sym": "r_v, r_ins",
            "desc": "测试输入与图像、文本锚点的余弦相似度"
          },
          {
            "sym": "α, β",
            "desc": "图像与文本相似度的融合权重"
          },
          {
            "sym": "T",
            "desc": "softmax 的温度系数"
          },
          {
            "sym": "d_c",
            "desc": "任务 c 的归一化专家权重"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📐",
          "title": "余弦匹配",
          "desc": "相似度提供输入与任务锚点的匹配分数。"
        },
        {
          "icon": "🔥",
          "title": "温度控制",
          "desc": "低温更集中，高温更接近平均。"
        },
        {
          "icon": "🧮",
          "title": "软分配",
          "desc": "专家输出按权重求和，而不是只开一个开关。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "下层融合：把通用能力压成一张共享底图",
      "badge": "both",
      "badgeLabel": "训练+推理",
      "bridge": "顶层的选择解决了适配问题，但多数层不需要多个副本；它们应被融合为共享底座。",
      "analogy": {
        "title": "把下层压成整板",
        "text": "下层不是不要多个任务，而是把它们的共同知识压成一张可复用的底座。",
        "componentId": "analogy-06"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "比较三种夹层策略",
          "desc": "切换<b>全层融合、下层融合与 HiDe-LoRA</b>，同时查看性能和参数成本。",
          "componentId": "fusion-modes"
        }
      ],
      "insight": "融合不是平均掉知识，而是把共通部分压缩成一套共享参数。",
      "formula": {
        "lead": "其余层的 LoRA 参数按融合系数合成一个共享分支。",
        "unicode": "Ē<sub>T</sub> = Σ<sub>i=1</sub><sup>T</sup> ε<sub>i</sub> E<sub>i</sub>,　O<sub>rem</sub> = Ē<sub>T</sub>(h)",
        "symbols": [
          {
            "sym": "E_i",
            "desc": "任务 i 的 LoRA 参数"
          },
          {
            "sym": "ε_i",
            "desc": "任务 i 的融合系数"
          },
          {
            "sym": "O_rem",
            "desc": "其余层 LoRA 分支输出"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧱",
          "title": "单一底座",
          "desc": "下层只保留一个融合后的参数分支。"
        },
        {
          "icon": "⚙️",
          "title": "系数可调",
          "desc": "融合系数改变跨任务共享的强度。"
        },
        {
          "icon": "📉",
          "title": "避免全扩",
          "desc": "把每层都展开会快速放大参数成本。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "训练一轮：只更新适配器，保存任务锚点",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "方法确定了参数如何组织，接下来看每个新任务到来时，训练循环究竟做什么。",
      "analogy": {
        "title": "只刨当前接缝",
        "text": "每一轮只修当前接缝，不把整张工作台重新做一遍。",
        "componentId": "analogy-07"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "按步骤跑完当前任务",
          "desc": "逐步查看前向回答、损失、LoRA/projector 更新与锚点保存。",
          "componentId": "training-steps"
        }
      ],
      "insight": "训练阶段为推理阶段准备两类资产：适配参数和任务锚点。",
      "takeaways": [
        {
          "icon": "🛠️",
          "title": "只训适配器",
          "desc": "当前任务更新 LoRA 模块与 projector。"
        },
        {
          "icon": "🧷",
          "title": "保存锚点",
          "desc": "训练后提取每个任务的图像与文本原型。"
        },
        {
          "icon": "🔁",
          "title": "逐任务继续",
          "desc": "新任务到来时重复同一循环，而非重训整个底座。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "完整框架：训练一次，推理分层执行",
      "badge": "trn",
      "badgeLabel": "训练+架构",
      "bridge": "把训练、锚点、顶层扩展与下层融合接起来，才能看清 HiDe-LLaVA 的完整数据流。",
      "analogy": {
        "title": "装好带双锁的顶板",
        "text": "先看训练留下什么，再看推理如何用自己的线索选专家。",
        "componentId": "analogy-08"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点选完整架构节点",
          "desc": "在训练与推理模式间切换，点击编码器、锚点库、顶层专家和共享下层查看职责。",
          "componentId": "architecture-map"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "同步对照训练与推理",
          "desc": "从同一起点同步观察两条流程：左侧留下参数与锚点，右侧完成匹配、选择与融合输出。",
          "componentId": "train-infer-sync"
        }
      ],
      "insight": "训练与推理共享同一套分层契约。",
      "takeaways": [
        {
          "icon": "🏗️",
          "title": "训练留资产",
          "desc": "LoRA、projector 与任务锚点在训练阶段产生。"
        },
        {
          "icon": "🚦",
          "title": "推理做分流",
          "desc": "顶层按双模态分数选择专家。"
        },
        {
          "icon": "🧩",
          "title": "下层走共享",
          "desc": "其余层始终经过同一融合分支。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "效率与消融：为什么只扩展顶层",
      "badge": "trn",
      "badgeLabel": "实践",
      "bridge": "效果提升还不够，完整方案必须回答额外参数、泛化可信度和适用边界。",
      "analogy": {
        "title": "把夹钳移到承重点",
        "text": "夹得越多不一定越稳，承重点必须放在真正需要任务区分的层。",
        "componentId": "analogy-09"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "拖动扩展深度",
          "desc": "拖动夹具从第 1 层移动到第 32 层，比较论文报告的<b>性能与参数成本端点</b>。",
          "componentId": "expansion-depth"
        }
      ],
      "insight": "只扩展顶层不是省略工作，而是把增量参数用在最需要任务区分的位置。",
      "takeaways": [
        {
          "icon": "⚖️",
          "title": "联合评价",
          "desc": "准确率、参数载入和训练开销必须一起看。"
        },
        {
          "icon": "📈",
          "title": "高分有代价",
          "desc": "全层扩展能提高 Avg，但参数约增至 5.2 倍。"
        },
        {
          "icon": "🔀",
          "title": "顺序较稳",
          "desc": "论文的三个任务顺序结果差异较小。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果与边界：更强，但不是“零成本”",
      "badge": "both",
      "badgeLabel": "结果",
      "bridge": "最后把关键结果放回各自基准、各自指标和各自代价中比较。",
      "analogy": {
        "title": "在同一刻度上承重",
        "text": "让所有木梁从同一起点承重，按真实刻度比较，而不是先宣布赢家。",
        "componentId": "analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "让结果在真实刻度上赛跑",
          "desc": "选择 <b>UCIT 或 CoIN</b>，再选择 <b>Avg 或 Last</b>，从统一基线启动比较。",
          "componentId": "result-race"
        }
      ],
      "insight": "结果可信度来自协议边界，不来自把最好的数字放在一起。",
      "takeaways": [
        {
          "icon": "🏁",
          "title": "分基准报告",
          "desc": "UCIT 与 CoIN 的数字不能混在同一榜单。"
        },
        {
          "icon": "📊",
          "title": "分指标比较",
          "desc": "Last 与 Avg 都是准确率，越高越好。"
        },
        {
          "icon": "⚠️",
          "title": "保留限制",
          "desc": "融合冲突与原始零样本能力保持仍未完全解决。"
        }
      ]
    }
  ],
  "bilibili": []
};
