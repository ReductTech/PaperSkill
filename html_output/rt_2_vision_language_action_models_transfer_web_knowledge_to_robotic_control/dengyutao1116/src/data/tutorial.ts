import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic Control",
    "titleZh": "RT-2：把网页知识迁移到机器人控制的视觉-语言-动作模型",
    "venue": "CoRL 2023 · Oral",
    "authors": "Brianna Zitkovich, Tianhe Yu, Sichun Xu, Peng Xu, Ted Xiao, Fei Xia, et al.",
    "affiliation": "Google DeepMind",
    "domain": "机器人学习 · 视觉-语言-动作模型",
    "coreProblem": "机器人示范只有几千条，遇到没见过的物体、背景或说法就失灵；网页预训练的视觉-语言模型懂语义，却不会输出动作。",
    "coreInsight": "把动作拆成 8 个整数 token，与网页 VQA 文本共用词表并共同微调，视觉-语言模型就能直接“说出”动作。",
    "keywords": [
      "RT-2",
      "VLA",
      "动作 token",
      "256 bins",
      "共同微调",
      "约束解码",
      "链式推理",
      "泛化",
      "涌现",
      "55B",
      "PaLM-E",
      "Language-Table",
      "6k 评估",
      "PaLI-X"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "只输出文字：认得杯子，却给不出关节增量。",
      "componentId": "rt2-cover"
    },
    "newMethod": {
      "desc": "8 个 token 一句话：同一词表，直接说出机械臂该怎么动。",
      "componentId": "rt2-cover"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "只会说话，或只会照抄",
      "badge": "inf",
      "badgeLabel": "问题",
      "bridge": "<span class=\"bridge-mark b1\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"10.5\" cy=\"10.5\" r=\"5.2\"/><path d=\"M14.4 14.4 L19 19\"/></svg></span> 机器人要同时做两件事：听懂“把草莓放进正确的碗”，再给出 7 自由度机械臂每一维的增量。过去，这两件事分属两个模型。",
      "analogy": {
        "title": "同声传译员的两本册子",
        "text": "她随身带两本册子：一本记<b>词义</b>，一本记<b>句型</b>。只背句型时，换个没见过的说法就卡住；只背词义时，句子再漂亮也落不到嘴上。RT-2 要做的，是把两本合成一本。",
        "componentId": "interpreter-strip"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "两种半吊子专家",
          "desc": "点左侧或右侧：一个只会产出文字，一个只会背动作片段。看它们各自漏掉哪一半。",
          "componentId": "problem-baseline"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "把语义接到动作上的三条路",
          "desc": "点三张卡：模块拼接、从零训练、共同微调。比较它们各自保住了什么、丢掉了什么。",
          "componentId": "approach-compare"
        }
      ],
      "insight": "真正的缺口不是“看不懂”，而是“看懂了却写不成动作”。",
      "takeaways": [
        {
          "icon": "①",
          "title": "语义在网页里",
          "desc": "VLM 知道物体、关系与指令的含义。"
        },
        {
          "icon": "②",
          "title": "动作在轨迹里",
          "desc": "策略要输出 6 维位姿增量与 1 个夹爪状态。"
        },
        {
          "icon": "③",
          "title": "缺口在接口",
          "desc": "两套模型各会一半，谁也不能独立闭环。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "把动作当成一种语言",
      "badge": "both",
      "badgeLabel": "核心思想",
      "bridge": "<span class=\"bridge-mark b2\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 5 H20 V17 H12 L7 21 V17 H4 Z\"/><path d=\"M7.5 10 H16.5 M7.5 13 H13.5\"/></svg></span> 如果动作也能写成一句话，那么“看图回答”的模型就能顺带学会“看图动手”，而不必另造一个动作头。",
      "analogy": {
        "title": "两本册子合订成一本",
        "text": "网页图文教她<b>词义与常识</b>，机器人轨迹教她<b>句型</b>。合订之后，没见过的词也能落进熟悉的句式，输出仍然是同一套 token。",
        "componentId": "interpreter-strip"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "RT-2 总览：一条序列从画面走到动作",
          "desc": "点图上的 1–5，逐段看图文语料、ViT、共享词表、去 token 化与闭环执行。原图完整保留，不在图上压大段文字。",
          "componentId": "rt2-arch-overview"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "同一张词表，两种句子",
          "desc": "切换网页样本与机器人样本，再点任意 token：看它来自哪里、在序列里占哪一格。",
          "componentId": "shared-vocab"
        }
      ],
      "insight": "动作不是另一套网络，而是词表里的另一段句子。",
      "formula": {
        "lead": "训练目标没有变：仍然是在给定图像与指令后，预测下一个 token。文字答案与动作数字走同一条损失。",
        "unicode": "p(y_t | x, y_prev, ℓ) = softmax(W · h_t)",
        "symbols": [
          {
            "sym": "x",
            "desc": "当前帧图像（经 ViT 变成视觉 token）"
          },
          {
            "sym": "ℓ",
            "desc": "任务指令，例如“把草莓放进正确的碗”"
          },
          {
            "sym": "y_prev",
            "desc": "已经写出的 token：可能是词，也可能是动作整数"
          },
          {
            "sym": "y_t",
            "desc": "当前要预测的 token"
          },
          {
            "sym": "h_t",
            "desc": "语言模型在第 t 步的隐状态"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "①",
          "title": "同一词表",
          "desc": "动作整数与文字共享输出层，不新增动作头。"
        },
        {
          "icon": "②",
          "title": "同一损失",
          "desc": "都用下一个 token 的交叉熵训练。"
        },
        {
          "icon": "③",
          "title": "同一主干",
          "desc": "ViT 与 LLM 全部来自网页预训练。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "八个整数，一句话说完一个动作",
      "badge": "both",
      "badgeLabel": "表征",
      "bridge": "<span class=\"bridge-mark b3\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M9 4 L7.5 20 M16.5 4 L15 20 M4 9 H20 M3 15 H19\"/></svg></span> 机器人输出 6 维位姿增量 + 1 维夹爪，共 7 个连续量。每个连续量按训练范围切成 256 个等宽 bin，取最近格的编号 0–255；再补一个离散终止命令（本页教学显示为 256），得到 8 个 token。动作因此能和文字共用同一张词表。",
      "analogy": {
        "title": "行李箱的八个格子",
        "text": "前 7 格放 0–255 号的动作编号，第 8 格贴“结束”封条。格子固定、编号固定，但每次动作的内容可以不同——这就是动作分词的日常版本。",
        "componentId": "interpreter-strip"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "动作分词：把连续控制改写成整数",
          "desc": "通过四步引导完成一次“翻译”：先认识 7 个连续量，再理解为什么要切成 256 个 bin，随后逐维替换成 0–255 的编号，最后补上终止命令，拼出模型能逐 token 预测的动作句。",
          "componentId": "action-tokenize"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "一格到底有多细：量化实验",
          "desc": "拖动连续值、切换维度与 bin 数：看 256 格怎样把一个小数舍入成整数，以及最大误差是多少。",
          "componentId": "quantization-lab"
        }
      ],
      "insight": "模型只会预测下一个 token；先把连续控制量化成 bin 编号，动作才能和文字走同一条 next-token 损失。离散化不是压缩，而是把连续控制翻译成模型已经会读的符号。",
      "formula": {
        "lead": "7 个连续量（6 维位姿增量 + 夹爪）各落到 256 个 bin 中的编号 0–255；另有一个离散 terminate 命令。8 个位置拼成一条动作句子，使动作可以按 next-token 方式训练，而不是额外回归头。",
        "unicode": "a = (ΔT, ΔR, g) → (v_1, …, v_7),  v_i ∈ {0, …, 255}; 另加 terminate",
        "symbols": [
          {
            "sym": "ΔT",
            "desc": "末端执行器的三维平移增量"
          },
          {
            "sym": "ΔR",
            "desc": "三维旋转增量（roll / pitch / yaw）"
          },
          {
            "sym": "g",
            "desc": "夹爪的开合状态"
          },
          {
            "sym": "v_i",
            "desc": "第 i 个连续量（i=1…7）落在 256 个 bin 中的整数编号，取 0–255"
          },
          {
            "sym": "END",
            "desc": "离散终止命令，用来表示任务成功完成；本页教学显示为 256，论文原始串行化把 terminate 放在最前"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "①",
          "title": "7 连续 + 1 结束",
          "desc": "6 维位姿增量 + 夹爪，先变成 7 个 bin 编号，再补终止命令。"
        },
        {
          "icon": "②",
          "title": "256 bin",
          "desc": "每个连续量切成 256 个等宽格，编号 0–255。"
        },
        {
          "icon": "③",
          "title": "8 token",
          "desc": "7 个编号 + 结束位，拼成一句动作；与文字共用词表。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "共同微调，而不是让模型改行",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "<span class=\"bridge-mark b4\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 6 H20 M4 12 H20 M4 18 H20\"/><circle cx=\"9\" cy=\"6\" r=\"2\"/><circle cx=\"16\" cy=\"12\" r=\"2\"/><circle cx=\"7\" cy=\"18\" r=\"2\"/></svg></span> 把 VLM 直接改成动作模型，会让它忘掉网页知识；只喂机器人数据，又会把预训练挤掉。论文的选择是两边同时喂。",
      "analogy": {
        "title": "一口锅煮两份食材",
        "text": "只放机器人数据，汤浓了但营养单一；只放网页数据，味道还在却做不成菜。共同微调是两份一起下锅：动作学会，语义也不丢。",
        "componentId": "interpreter-strip"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "三种配方，三种结局",
          "desc": "并排比较从零训练、机器人数据微调、共同微调三种配方，并对照同规模 5B 的 3%、28%、44% 泛化结果。",
          "componentId": "training-recipe"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "约束解码：只让该出现的名词出现",
          "desc": "用大候选列表和允许/屏蔽徽章对照约束开关：只保留场景物体或指令名词，donkey 即使分数更高也会被屏蔽。",
          "componentId": "output-constraint"
        }
      ],
      "insight": "共同微调的关键不是“多喂数据”，而是“别停掉原来的课”。",
      "formula": {
        "lead": "教学示意：把网页与机器人两路的负对数似然相加。论文实际沿用各自预训练的超参与数据配比，没有给出这个简化式。",
        "unicode": "L(θ) = L_web(θ) + L_robot(θ)",
        "symbols": [
          {
            "sym": "L_web",
            "desc": "网页图文（VQA / 描述）的下一 token 损失"
          },
          {
            "sym": "L_robot",
            "desc": "机器人轨迹的动作 token 损失"
          },
          {
            "sym": "θ",
            "desc": "共享的 VLM 参数"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "①",
          "title": "别改行",
          "desc": "不是把 VLM 换头，而是让它多会一种输出。"
        },
        {
          "icon": "②",
          "title": "别停课",
          "desc": "训练时保留网页数据，语义才不退化。"
        },
        {
          "icon": "③",
          "title": "别放任",
          "desc": "推理期用约束解码收窄名词候选。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "训练数据与对照组：它到底从哪学",
      "badge": "inf",
      "badgeLabel": "数据",
      "bridge": "<span class=\"bridge-mark b5\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><ellipse cx=\"12\" cy=\"6\" rx=\"7\" ry=\"3\"/><path d=\"M5 6 V18 C5 19.7 8.1 21 12 21 C15.9 21 19 19.7 19 18 V6\"/><path d=\"M5 12 C5 13.7 8.1 15 12 15 C15.9 15 19 13.7 19 12\"/></svg></span> RT-2 的语义来自网页语料，动作来自 13 台机器人、17 个月、一间办公室厨房的演示。论文的四个基线全部吃同一批机器人数据，只换“怎么用预训练”。",
      "analogy": {
        "title": "同一间厨房，两套教材",
        "text": "网页教材教她认世界，机器人示范教她动手。陪考的四个人拿的是同一套动手教材，差别只在有没有网页教材、以及网页知识怎么接进来。",
        "componentId": "interpreter-strip"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "13 台机器人、17 个月、一间厨房",
          "desc": "用大数字和对比卡查看机器人轨迹、网页语料和共同微调比例：13 台机器人、17 个月、同一间厨房，以及网页知识如何进入训练。",
          "componentId": "data-provenance"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "四个基线，各盯住一个变量",
          "desc": "用大卡片查看 RT-1、VC-1、R3M、MOO 各自盯住的变量；它们共用同一批机器人数据，只比较预训练用法。",
          "componentId": "baseline-lineup"
        }
      ],
      "insight": "共同微调不是把两堆数据混在一起，而是让网页语义与机器人动作在同一批权重里各管一段。",
      "takeaways": [
        {
          "icon": "①",
          "title": "网页语料",
          "desc": "VQA、captioning、图文交错；提供语义与常识。"
        },
        {
          "icon": "②",
          "title": "机器人轨迹",
          "desc": "13 台机器人、17 个月、办公室厨房；提供动作。"
        },
        {
          "icon": "③",
          "title": "公平对照",
          "desc": "四个基线共用同一批机器人数据，只换预训练用法。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "55B 的模型，怎么在 1–3 Hz 下闭环",
      "badge": "inf",
      "badgeLabel": "部署",
      "bridge": "<span class=\"bridge-mark b6\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M7 18 A4 4 0 0 1 7 10 A6 6 0 0 1 18 9 A4.5 4.5 0 0 1 18 18 H7 Z\"/></svg></span> 机器人控制通常要 5 Hz 左右；55B 参数放不进机载 GPU。论文把推理搬到多 TPU 云服务，用网络查询换回算力。",
      "analogy": {
        "title": "远程同传箱",
        "text": "译员不在会场，声音经专线送到后台，译文再送回来。只要往返够快，听众仍觉得是“现场同传”——代价是延迟被算进了每一句话。",
        "componentId": "interpreter-strip"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "四个实例，四种控制频率",
          "desc": "用大卡片理解 Hz 的含义，并对照四个实例的部署环境、已报告频率和云端闭环步骤。",
          "componentId": "model-realtime"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "延迟预算：谁把频率拖慢了",
          "desc": "切换 5B / 55B，拖动网络往返、推理与控制开销：看总周期怎样被最慢的一段决定。",
          "componentId": "latency-budget"
        }
      ],
      "insight": "大模型上机器人，先解决“在哪算”，再谈“算得多好”。",
      "takeaways": [
        {
          "icon": "①",
          "title": "55B → 1–3 Hz",
          "desc": "最大实例必须走云端多 TPU 服务。"
        },
        {
          "icon": "②",
          "title": "5B → 约 5 Hz",
          "desc": "较小实例接近常规控制频率。"
        },
        {
          "icon": "③",
          "title": "延迟进回路",
          "desc": "网络往返直接占用每个控制周期。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "6k 次试验：数字是怎么来的",
      "badge": "inf",
      "badgeLabel": "评估",
      "bridge": "<span class=\"bridge-mark b7\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M9 3 H15 M10 3 V9 L5 19 A2 2 0 0 0 7 21 H17 A2 2 0 0 0 19 19 L14 9 V3\"/><path d=\"M8 16 H16\"/></svg></span> 论文用约 6,000 次真实机器人评估回答四个问题：seen 200+、unseen 280+，每类再分 easy / hard；四款模型在同一时段轮流上场。",
      "analogy": {
        "title": "同一场考试，四张评分表",
        "text": "不是各考各的、考完再比；而是同一间考场、同一批题，四名考生轮流上场。分数仍会抖，但至少题目和灯光没变。",
        "componentId": "interpreter-strip"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "6,000 次评估，先看分母",
          "desc": "切换 Seen / Unseen Objects / Backgrounds / Environments / Average：看任务规模、easy/hard 分档，以及 RT-2-PaLI-X-55B 在表 5 中的读数。",
          "componentId": "eval-protocol"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "A/B 轮转：把场景噪声压下去",
          "desc": "对比“各测各的”和“同一时段轮转”：观察场景条件如何从漂移变成锁定，再点“下一棒”看四款模型如何在相同条件下比较。",
          "componentId": "ab-testing"
        }
      ],
      "insight": "先看分母与协议，再看成功率；数字的边界比数字本身更重要。",
      "takeaways": [
        {
          "icon": "①",
          "title": "6k 次",
          "desc": "约 6,000 次真实机器人评估轨迹。"
        },
        {
          "icon": "②",
          "title": "200+ / 280+",
          "desc": "Seen 200+ 任务，Unseen 三类合计 280+。"
        },
        {
          "icon": "③",
          "title": "同场轮转",
          "desc": "四款模型在完全相同条件下依次评估。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "泛化：换物体、换背景、换环境",
      "badge": "inf",
      "badgeLabel": "证据",
      "bridge": "<span class=\"bridge-mark b8\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"8\"/><path d=\"M15 9 L13 13 L9 15 L11 11 Z\"/></svg></span> 最难的地方不是背住训练任务，而是换物体、换背景、换环境后还能把动作接上。论文把泛化拆成三类，每类再分 easy / hard 两档。",
      "analogy": {
        "title": "同一份菜单，换三家厨房",
        "text": "菜谱没变，灶台、锅具和光线全变了。真正的本事不是背住某间厨房，而是认出“这还是同一道菜”，并把手上的动作对上眼前的物件。",
        "componentId": "interpreter-strip"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "三组泛化：差距到底出现在哪",
          "desc": "切换 Seen / Unseen Objects / Backgrounds / Environments / Average，比较 6 个模型的成功率；浅色 easy、深色 hard。数据取自附录表 5。",
          "componentId": "generalization-evidence",
          "figure": "./images/paper/fig-3.png"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "另一条证据：开源 Language-Table",
          "desc": "表 1 原值：同一个 RT-2-PaLI-3B checkpoint，在仿真里 90±10，随后搬到真机看新推动行为（图 5）。",
          "componentId": "langtable-table",
          "figure": "./images/paper/fig-5.png"
        }
      ],
      "insight": "泛化提升集中在没见过的分布；见过任务的绝对值与 RT-1 接近。",
      "formula": {
        "lead": "所有成功率都按同一协议计算：成功回合数除以尝试回合数。跨表比较前，先确认分母与难度档一致。",
        "unicode": "SR = n_success / n_trials",
        "symbols": [
          {
            "sym": "SR",
            "desc": "成功率（success rate），越高越好"
          },
          {
            "sym": "n_success",
            "desc": "成功完成任务的回合数"
          },
          {
            "sym": "n_trials",
            "desc": "该条件下的总尝试回合数"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "①",
          "title": "看未见分布",
          "desc": "新物体、新背景、新环境才是差距所在。"
        },
        {
          "icon": "②",
          "title": "别混难度档",
          "desc": "easy 与 hard 不能合成一个数再比。"
        },
        {
          "icon": "③",
          "title": "看同协议",
          "desc": "表 1 与图 5 共用同一个 3B checkpoint。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "涌现：没教过的语义，自己会了",
      "badge": "inf",
      "badgeLabel": "证据",
      "bridge": "<span class=\"bridge-mark b9\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M9 18 H15 M10 21 H14 M8 15 A6 6 0 1 1 16 15 C14.5 16.5 14 17 14 18 H10 C10 17 9.5 16.5 8 15 Z\"/></svg></span> 论文把“训练数据里没有、模型却能答对”的能力称为涌现，并拆成符号理解、推理、人物识别三类来测。",
      "analogy": {
        "title": "不看图也能点菜",
        "text": "熟客没看菜单，只听见“给戴眼镜的那位来杯热的”，就能指对人和杯。她靠的不是背菜单，而是把语言、常识和眼前场景接在一起。",
        "componentId": "interpreter-strip"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "三类涌现能力的定量对比",
          "desc": "切换符号理解 / 推理 / 人物识别，比较 VC-1、RT-1、PaLM-E、PaLI-X 的平均成功率；下方给出该类的真实指令样例。",
          "componentId": "emergence-evidence",
          "figure": "./images/paper/fig-6a.png"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "链式推理：先写计划，再写动作",
          "desc": "切换图 7 任务，按顺序解锁 Prompt、Plan、Action 和执行，理解先写计划再写动作。",
          "componentId": "cot-rollout",
          "figure": "./images/paper/fig-7.png"
        }
      ],
      "insight": "它迁移的是语义与视觉概念，不是新的运动技能。",
      "takeaways": [
        {
          "icon": "①",
          "title": "符号",
          "desc": "数字、字母、图标从未进过机器人数据。"
        },
        {
          "icon": "②",
          "title": "推理",
          "desc": "算术、常识与跨语言来自网页预训练。"
        },
        {
          "icon": "③",
          "title": "计划",
          "desc": "Plan 是自然语言，Action 仍是动作 token。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "能带走什么，不能带走什么",
      "badge": "both",
      "badgeLabel": "边界",
      "bridge": "<span class=\"bridge-mark b10\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 3 L19 6 V12 C19 17 16 20 12 22 C8 20 5 17 5 12 V6 Z\"/><path d=\"M8.5 12 L11 14.5 L15.5 9.5\"/></svg></span> 最后把设计决策与边界对齐：规模、训练策略、推理成本、动作分布。哪些结论能推广，哪些只在论文条件下成立。",
      "analogy": {
        "title": "搬家清单",
        "text": "带得走的是理解：词义、常识、人物与符号。带不走的是没练过的动作，以及没接触过的接触动力学——箱子装得下书，装不下另一双手。",
        "componentId": "interpreter-strip"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "规模 × 训练策略：五根柱子的消融",
          "desc": "点柱子或切换对比视角：在 5B 内部看训练策略，在同策略下比模型规模，再看最差到最佳的差距。页面直接显示图 6b，并配套读图讲解。",
          "componentId": "ablation-recap"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "边界：五种“新”里，哪些真的成立",
          "desc": "用证据矩阵筛选五种“新”的成立状态，并结合图 9 理解新动作和新动力学为什么不成立。",
          "componentId": "limitation-recap"
        }
      ],
      "insight": "RT-2 的上限由动作数据决定，下限由语义预训练抬高。",
      "takeaways": [
        {
          "icon": "①",
          "title": "语义可迁移",
          "desc": "物体、关系、符号与指令理解来自网页。"
        },
        {
          "icon": "②",
          "title": "动作不可凭空长",
          "desc": "新运动技能仍受机器人轨迹分布限制。"
        },
        {
          "icon": "③",
          "title": "部署有代价",
          "desc": "55B 需要云端服务，频率与延迟要一起算。"
        }
      ]
    }
  ]
};
