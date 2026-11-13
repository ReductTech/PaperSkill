import type { TutorialData } from '../types';

// Internal refinement record: 2026-10-22.
export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Annotations as Rollouts: Efficient and Scalable Reinforcement Learning for Video MLLMs",
    "titleZh": "把正确标注变成有效的学习信号",
    "venue": "arXiv preprint · 2026",
    "authors": "Yunheng Li, Guohong Mu, Hao Li, Shengsheng Qian, Dingwen Zhang, Qibin Hou, Ming-Ming Cheng",
    "affiliation": "南开大学等",
    "domain": "视频多模态大模型的强化学习后训练",
    "coreProblem": "强化学习通常用标注给模型采样结果打分，却很少把正确标注作为一次正向候选；直接混入又可能抬高组均值，反向惩罚原本较好的策略样本。",
    "coreInsight": "已知正确的标注，为什么直接加入训练反而可能让模型变差？沿着一次候选比较，理解 OraRL 如何分开“谁更好”和“该向谁学”。",
    "keywords": [
      "视频时序定位",
      "视频多模态大模型",
      "强化学习",
      "oracle rollout（标注参考样本）",
      "优势翻转"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "模型为同一视频问题生成多次候选，标注用于评分；组内最好的一条，也可能仍不够准确。",
      "componentId": "ora-explorer"
    },
    "newMethod": {
      "desc": "保留模型的尝试，让标注额外成为学习目标；关键是安排好它参与比较和指导的方式。",
      "componentId": "ora-explorer"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "先问：标注只能打分吗？",
      "badge": "inf",
      "badgeLabel": "问题导入",
      "bridge": "视频时序定位要回答“这件事发生在什么时候”，输出事件的起止时间。训练数据已经给出正确区间，但模型的几次尝试可能都不够准：这条标注怎样才能更充分地帮助学习？",
      "analogy": {
        "title": "剪辑师选定事件区间",
        "text": "剪辑师在时间轴上选中一段范围，目标是标记被查询的事件。时间轴只是帮助理解的生活场景。",
        "componentId": "ora-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "让标注扮演哪种角色？",
          "desc": "先选择一种标注用法，再看它如何影响训练。监督微调负责模仿示范；GRPO 根据任务奖励比较多次尝试。本文继续追问：能否既保留这些尝试，又让已知的正确输出直接参与学习？",
          "componentId": "ora-explorer"
        }
      ],
      "takeaways": [
        {
          "icon": "🎞️",
          "title": "模仿目标",
          "desc": "SFT（监督微调）直接以标注示范作为学习目标。"
        },
        {
          "icon": "🔎",
          "title": "评分参照",
          "desc": "GRPO（组相对策略优化）比较多条当前策略候选的任务奖励，标注提供评分参照。"
        },
        {
          "icon": "❓",
          "title": "留住问题",
          "desc": "组内最好的候选未必足够准确；需要可靠正例，仍需保留策略探索。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "当前策略常采不到精确区间",
      "badge": "trn",
      "badgeLabel": "采样过程",
      "bridge": "先不引入新算法，只沿着一个视频问题看清训练循环：生成候选、按标注评分、计算相对优势。组里最好的候选，和真正精确的答案，是两回事。",
      "analogy": {
        "title": "沿时间轴回看候选区间",
        "text": "剪辑师沿时间轴回看目标片段，试着辨认候选边界是否贴近事件。",
        "componentId": "ora-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "一次候选组怎样形成？",
          "desc": "逐步展开同一条 120 秒时间线。比较候选区间与 40–70 秒的参考事件，再查看按时间 IoU 算出的示例奖励。区间与视频情境均为教学示意。",
          "componentId": "ora-explorer"
        }
      ],
      "takeaways": [
        {
          "icon": "🔍",
          "title": "从查询出发",
          "desc": "当前策略围绕视频与查询生成多条候选。"
        },
        {
          "icon": "⚖️",
          "title": "任务奖励作比较",
          "desc": "奖励描述候选质量；相对优势决定它比组内基准更值得强化还是抑制。"
        },
        {
          "icon": "📍",
          "title": "精确正例可能缺席",
          "desc": "论文指出不少组可能没有可靠正例；这描述的是研究动机，不是每组必然失败。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "把标注也变成候选样本",
      "badge": "trn",
      "badgeLabel": "训练机制",
      "bridge": "标注本来只作评分参照。OraRL 把它转换成模型能够输出的响应，额外放入候选组：原来的尝试全部保留，训练时多了一条已知正确的目标。",
      "analogy": {
        "title": "把参考区间插入候选行",
        "text": "剪辑师把一枚参考区间标记插入候选行，目标是让参考与已有尝试并排保留。",
        "componentId": "ora-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "把标注加入，而非替换",
          "desc": "拖入参考标注，或点击“加入标注”。观察候选数量与时间线：三条模型候选没有被替换，只额外增加一条正确参考。这里的候选数为教学设置；实际训练按论文配置使用 n 条策略候选和 1 条 oracle。",
          "componentId": "ora-explorer"
        }
      ],
      "takeaways": [
        {
          "icon": "➕",
          "title": "增加一个正向参考",
          "desc": "Oracle rollout 是标注转换成的合法响应，不要求模型先自行采到。"
        },
        {
          "icon": "🧭",
          "title": "保留策略尝试",
          "desc": "oracle rollout（标注参考样本）与当前策略候选并存，不会取代它们。"
        },
        {
          "icon": "🧩",
          "title": "仅在训练中可用",
          "desc": "模型学习这条响应的概率；推理时不会收到正确答案。适配器必须能序列化任务标注。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "答案太强，会抬高基准",
      "badge": "trn",
      "badgeLabel": "优势翻转",
      "bridge": "接下来出现反直觉问题：正确标注的奖励很高，把它也计入组均值，会把比较基准抬高。原本比模型平均表现好的候选，可能因此被判为负优势，收到相反的学习信号。",
      "analogy": {
        "title": "挪动基准线，露出翻转区间",
        "text": "剪辑师在时间线上移动一条基准标记，让原本高于候选平均的片段落到新基准之下。这个画面对应朴素混合均值抬高后，策略候选优势符号翻转的条件。",
        "componentId": "ora-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "拖动标注奖励，观察谁被翻号",
          "desc": "固定三条策略奖励为 [2, 5, 7]，只改变标注奖励。重点看候选 B：它的奖励始终是 5，为什么中心化优势会从正变负？在本例中，r_gt=6 是临界点。",
          "componentId": "ora-explorer"
        }
      ],
      "formula": {
        "lead": "均值改变了参照，候选本身没有变。先看最短的翻转条件；图中的奖励数值仅用于教学。",
        "unicode": "μ_aug = μ_op + (r_gt − μ_op)/(n + 1)<br/>当 μ_op &lt; r_i &lt; μ_aug 时：r_i − μ_op &gt; 0，r_i − μ_aug &lt; 0",
        "symbols": [
          {
            "sym": "r_i",
            "desc": "第 i 个策略候选的奖励；本章数值仅作教学示意。"
          },
          {
            "sym": "r_gt",
            "desc": "按模型输出格式序列化的标注参考样本所得奖励。"
          },
          {
            "sym": "μ_op",
            "desc": "只由当前策略候选计算的奖励均值。"
          },
          {
            "sym": "μ_aug",
            "desc": "把 n 个策略候选和一个标注参考样本一起计算的混合均值。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📈",
          "title": "混合基准会上升",
          "desc": "当 r_gt 高于策略均值时，混合均值上升；标准差归一化还可能压小策略信号幅度。"
        },
        {
          "icon": "↕️",
          "title": "符号翻转有区间",
          "desc": "候选落在两种均值之间时，中心化优势会从正变负。比较基准影响的是学习方向。"
        },
        {
          "icon": "🧭",
          "title": "这是条件性风险",
          "desc": "若标注奖励没有高于策略均值，或候选不落在翻转区间，就不会出现这里演示的翻转。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "比较基准只看策略样本",
      "badge": "trn",
      "badgeLabel": "基准设计",
      "bridge": "OraRL 先把两件事分开：比较模型的不同尝试时，只看策略候选；标注仍是学习目标，但不参与这个初始均值。这样可以去掉由标注抬高基准造成的翻转。",
      "analogy": {
        "title": "尺子只对准策略候选",
        "text": "剪辑师把标尺锚在当前策略挑出的候选上，同时把参考片段放在比较尺之外。标注仍能提供指导，但不会抬高策略候选的比较基准。",
        "componentId": "ora-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "点击切换两种比较基准",
          "desc": "切换混合均值与策略均值，比较同一组三条候选。条长表示奖励，竖线表示当前基准；右侧数值是奖励减去基准。此处只隔离基准的作用，后续还会加入有界引导与再中心化。",
          "componentId": "ora-explorer"
        }
      ],
      "formula": {
        "lead": "策略候选之间按策略均值比较；oracle rollout 保留为参考样本，后续引导单独计算。论文证据：PDF p.4，Sec.3.2。",
        "unicode": "混合基准：μ_aug=(nμ_op+r_gt)/(n+1)；OraRL 策略优势：A_i^(0)=r_i−μ_op（不做方差归一化）",
        "symbols": [
          {
            "sym": "μ_aug",
            "desc": "把 n 个策略候选和一个标注参考样本一起计算的混合奖励均值。"
          },
          {
            "sym": "μ_op",
            "desc": "只由当前策略候选计算的奖励均值；OraRL 用它作为初始比较基准。"
          },
          {
            "sym": "r_gt",
            "desc": "按模型输出格式序列化的标注参考样本所得奖励。"
          },
          {
            "sym": "r_i",
            "desc": "第 i 个策略候选的奖励。"
          },
          {
            "sym": "n",
            "desc": "当前组中由策略生成的候选数量，不包含额外的标注参考样本。"
          },
          {
            "sym": "A_i^(0)",
            "desc": "策略候选奖励减去策略均值得到的初始优势；这里不做方差归一化。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "比较只看策略样本",
          "desc": "A_i⁽⁰⁾=r_i−μ_op；初始优势不做方差归一化，标注不进入策略均值。"
        },
        {
          "icon": "🧩",
          "title": "标注仍提供指导",
          "desc": "oracle rollout 仍在增强候选组中；排除的是它对策略基准均值的影响。"
        },
        {
          "icon": "↔️",
          "title": "同组对照更清楚",
          "desc": "切换均值时策略样本不变，符号变化来自参照均值的选择。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "基准分开后，标注怎样继续指导？",
      "badge": "trn",
      "badgeLabel": "引导信号",
      "bridge": "干净的策略基准保住了初始比较关系，但没有表达“离正确标注还有多远”。OraRL 因此让差距影响两条信号：适度放大正策略优势，并给标注单独计算受限的优势。",
      "analogy": {
        "title": "校准两条引导刻度",
        "text": "剪辑师转动一只校准旋钮：一条刻度拉开高于策略均值的候选，另一条单独标出参考片段的剩余指导强度。两条刻度回应同一段差距，但承担不同作用。",
        "componentId": "ora-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "同步对照朴素混合与 OraRL",
          "desc": "先选一条候选，同步比较两种基准。这个对照只展示初始中心化优势，帮助分清“消除混合基准偏差”与“完整 OraRL 更新”两个阶段。",
          "componentId": "ora-explorer"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "一组奖励，算通两条引导信号",
          "desc": "选择一个策略场景，再调节标注奖励。均值、标准差、方向增益、再中心化优势和标注权重都从同一组奖励计算。试试“极弱正例”，观察后续再中心化为什么仍可能产生少量残余翻转。",
          "componentId": "ora-explorer"
        }
      ],
      "formula": {
        "lead": "计算器的展开区给出完整推导。这里先记住两条关系：策略优势要再中心化，标注优势单独受限。",
        "unicode": "A_i^op = U_i − mean(U)<br/>A_gt = min(2w_q, c_q)",
        "symbols": [
          {
            "sym": "A_i^op",
            "desc": "最终用于裁剪前比较的策略优势；方向增益之后减去均值，组内和为零。"
          },
          {
            "sym": "U_i",
            "desc": "正的初始策略优势乘以 g_q，非正值保持原值；完整公式见上方计算细节。"
          },
          {
            "sym": "A_gt",
            "desc": "标注的独立优势，停止梯度；不再乘 g_q。"
          },
          {
            "sym": "w_q",
            "desc": "归一化剩余奖励差的平方；策略接近标注时衰减，达到时为零。"
          },
          {
            "sym": "c_q",
            "desc": "本页简记的上限：clip(1.2A_max^+,0.05,1)。它由最强正策略信号限制标注优势，原文 Eq. (10)。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "↗️",
          "title": "正策略优势才放大",
          "desc": "先放大正的初始策略优势，再减去 U 的均值。初始比较与最终优势不能混为一谈。"
        },
        {
          "icon": "📏",
          "title": "标注信号随差距衰减",
          "desc": "w_q 衡量剩余标注指导；当策略均值达到标注奖励时，它变为零。"
        },
        {
          "icon": "🧷",
          "title": "标注优势单独受限",
          "desc": "A_gt 独立且停止梯度，并受最大正策略优势约束；它不再叠乘 g_q。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "省算力，但要保留两种方向",
      "badge": "trn",
      "badgeLabel": "效率设计",
      "bridge": "优势算好以后，全部候选都反向传播会增加成本。只取分数最高的样本又可能丢掉“该抑制”的信号。OraRL 保留标注，并在正、负优势中各选较强的候选，随后校正均值和尺度。",
      "analogy": {
        "title": "剪掉冗余片段，留下有对照的素材",
        "text": "剪辑师从候选时间段中缩减素材，同时保留参考片段，以及能代表两种不同方向的候选。这个动作帮助理解“减少计算”和“保留学习信号”必须一起考虑。",
        "componentId": "ora-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "裁剪多少，保留谁？",
          "desc": "选择裁剪比例 κ，先看哪些正、负候选被保留，再看论文报告的速度、显存和平均分。上方候选优势为教学示意；下方四档结果逐项来自 Table 16，不作插值。",
          "componentId": "ora-explorer"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "为什么裁剪后还要校正",
          "desc": "切换“裁剪后／完成校正”，观察同一组数值。再选“标注被中心化成负值”的例子，看为什么单纯减均值还不够。目标是整个保留组零和、标注非负，且控制更新尺度。",
          "componentId": "ora-explorer"
        }
      ],
      "formula": {
        "lead": "K 是最终参与更新的总数，包含 oracle；预算按原来的 n 条策略候选计算，而不是按增强组 n+1 计算。",
        "unicode": "K = ⌊n(1 − κ)⌋　；　n=8，κ=0.5 ⇒ K=4",
        "symbols": [
          {
            "sym": "n",
            "desc": "每组的 on-policy 候选数；本文该设置为 8。"
          },
          {
            "sym": "κ",
            "desc": "裁剪比例，越大通常保留越少。"
          },
          {
            "sym": "K",
            "desc": "每组最终参与反向传播的保留候选总数，包含 oracle。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "✂️",
          "title": "保留数减少",
          "desc": "裁剪主要减少进入策略更新的候选数量。"
        },
        {
          "icon": "⚖️",
          "title": "正负都重要",
          "desc": "oracle 算一个正向名额；当两种符号都有候选时，尽量保留强化与抑制两类信号。"
        },
        {
          "icon": "📉",
          "title": "速度有代价边界",
          "desc": "κ=.5 比 κ=0 节省 30.1 秒/步，三任务平均由 63.1 变为 62.7；整个保留组还需要矩校正。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "正确标注，为何能让结果变差？",
      "badge": "both",
      "badgeLabel": "关键证据",
      "bridge": "回到最初的疑问：标注正确，不代表直接混入后的训练信号就正确。先看同一受控协议下的负面结果，再逐个移除组件，判断完整设计是否有实验证据。",
      "analogy": {
        "title": "用同一把尺比较四张结果卡",
        "text": "剪辑师在相同条件下对照几种候选处理方案。屏幕上结果来自论文的受控三任务比较，不把它误当成单一时序定位指标。",
        "componentId": "ora-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "从负面结果看机制必要性",
          "desc": "选择一种方法，结果表会突出对应行，并显示相对 GRPO 的平均变化。请先看朴素真值注入在跟踪任务上的退步，再看奖励整形与 OraRL 怎样改善结果。",
          "componentId": "ora-explorer"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "移除一个组件，会发生什么？",
          "desc": "切换 Table 15 的组件消融，查看三任务平均的变化。特别比较“不裁剪”的较高质量与上一章的计算代价：论文选择的是折中配置。",
          "componentId": "ora-explorer"
        }
      ],
      "formula": {
        "lead": "Oracle 作为样本本身还不够；关键是它怎样进入优势估计。",
        "unicode": "Naive GT: 55.4　<　GRPO: 60.3　；　OraRL: 62.7",
        "symbols": [
          {
            "sym": "GT",
            "desc": "ground truth，已标注的参考答案。"
          },
          {
            "sym": "60.3 / 55.4 / 62.7",
            "desc": "Table 13 中同一三任务协议的平均分；不是 Table 1 的 temporal mIoU。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧪",
          "title": "不是“加真值就变好”",
          "desc": "Naive GT injection 的平均分低于 GRPO。"
        },
        {
          "icon": "🔄",
          "title": "优势翻转有测量",
          "desc": "Table 14 报告朴素混合的 pooled rollout flip rate 为 22.4%。"
        },
        {
          "icon": "✅",
          "title": "收益和成本一起解释",
          "desc": "组件消融支持机制作用；无裁剪质量略高，但每步更慢，完整方案兼顾效率。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "回到时序定位：边界精度怎样变化？",
      "badge": "both",
      "badgeLabel": "TVG证据",
      "bridge": "前面的受控消融帮助解释组件作用。现在看最终模型在时序定位任务上的系统表现：预测区间是否更贴合事件，严格 IoU 阈值下的命中是否也改善？",
      "analogy": {
        "title": "放大边界，检查时间段是否贴合",
        "text": "剪辑师沿同一条时间线检查三个数据集中的预测区间。分数来自论文 Table 1；不同数据集之间不混成单个成绩。",
        "componentId": "ora-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "选择一个 TimeLens 划分",
          "desc": "在同一个 TimeLens 划分中切换指标，看 Video-ORA-9B 与 TimeLens2-8B 的原表数值和差值。主表有模型规模与训练差异，不能把全部差距归因于单一组件。",
          "componentId": "ora-explorer"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "同一训练规则覆盖哪些任务？",
          "desc": "切换任务族，比较输入、可序列化的输出和评测方式。统一的是训练原则，各任务的标注形式与奖励仍各不相同。",
          "componentId": "ora-explorer"
        }
      ],
      "takeaways": [
        {
          "icon": "⏱️",
          "title": "关注时间边界",
          "desc": "Temporal grounding 回答的是事件发生在视频的哪个区间。"
        },
        {
          "icon": "📊",
          "title": "分数要带上下文",
          "desc": "数据划分、模型规模、训练设定与指标共同限定结果；受控消融更适合说明组件贡献。"
        },
        {
          "icon": "🧩",
          "title": "统一方法不等于统一指标",
          "desc": "七类任务能共用训练范式，但每类任务仍保留自己的标注表示和奖励。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结论有范围，研究还能继续",
      "badge": "both",
      "badgeLabel": "总结与局限",
      "bridge": "这篇论文的主线现在可以串起来：增加可靠目标，分离策略比较和标注指导，平衡选择正负信号，再控制更新尺度。最后用结果与限制检查：我们能得出什么结论，还有哪些问题没被解决？",
      "analogy": {
        "title": "钉住结论，也留下限制",
        "text": "剪辑师把支持结论的结果卡固定在时间线旁，再附上一条限制提醒。这样既能记住贡献，也不把一次实验外推成普遍结论。",
        "componentId": "ora-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "揭晓结果，再检查归因是否成立",
          "desc": "揭晓三组 TimeLens 划分的宏平均 mIoU，再切换标注条件、计算成本和比较条件。最后作一次判断：主表与受控消融分别能支持怎样的结论？",
          "componentId": "ora-explorer"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "机制比口号重要",
          "desc": "可靠标注可以直接指导策略更新；比较基准、独立引导、裁剪与校正需要配合。"
        },
        {
          "icon": "🧭",
          "title": "TVG 是重要切口",
          "desc": "本文改善时序定位，同时扩展到跟踪、分割等任务；统一训练不等于统一输出或奖励。"
        },
        {
          "icon": "🔎",
          "title": "结论仍有边界",
          "desc": "带噪标注、严格计算预算与模型/数据差异，都是继续研究与解释结果时需要保留的边界。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "reason": "这是理解论文所用 GRPO 组内相对比较的补充入门视频；它不是 OraRL 论文讲解，不能替代本文原文。",
      "bvid": "BV1FTjxzaEHb",
      "title": "使用 GRPO 对大模型进行强化微调",
      "views": "约 1,877 播放"
    }
  ]
};
