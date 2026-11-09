import type { TutorialData } from '../types';

/* Refinement 2026-10-22: evidence and teaching audit; not rendered. */
export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "TempSamp-R1: Effective Temporal Sampling with Reinforcement Fine-Tuning for Video LLMs",
    "titleZh": "TempSamp-R1：用强化微调学会更有效的视频时序定位",
    "venue": "NeurIPS 2025",
    "authors": "Yunheng Li, Jing Cheng, Shaoyong Jia, Hangyi Kuang, Shaohui Jiao, Qibin Hou, Ming-Ming Cheng",
    "affiliation": "南开大学、字节跳动",
    "domain": "视频时序定位 · 多模态大模型强化微调",
    "coreProblem": "模型知道视频讲什么，却未必能找准事件的起止时刻。长视频的答案区间很多，纯策略采样可能迟迟找不到有用的训练候选。",
    "coreInsight": "训练时把一个真值答案与模型生成的候选放入同组，再用非线性奖励变换调节相对优势，让精确示范与策略探索共同提供学习信号。",
    "keywords": [
      "视频时序定位（Temporal Grounding）",
      "组相对策略优化（GRPO）",
      "策略外指导（Off-policy Guidance）",
      "软奖励整形（Soft Reward Shaping）",
      "思维链（CoT）"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "GRPO 已用真值给候选打分，但答案仍完全由当前模型生成。若这些候选都偏离事件，反复比较也难获得准确的方向。",
      "componentId": "ts-hero-old"
    },
    "newMethod": {
      "desc": "训练时让一个准确标注直接充当候选答案，并调整它与策略候选的奖励差距。推理时仍只输入视频与查询，由模型预测时间区间。",
      "componentId": "ts-hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "回答内容，还是定位时间？",
      "badge": "inf",
      "badgeLabel": "任务边界",
      "bridge": "给定视频和一句查询“一个人打开了灯”，任务是返回这个事件的起点与终点。Video QA 的内容答案可能只有一句话；时序定位还要将这句话对准时间轴。本文研究怎样通过训练改善这种对齐。",
      "analogy": {
        "title": "拖动游标，标出事件",
        "text": "剪辑时，知道画面里发生什么还不够；还要在时间轴上标出动作开始和结束的位置。",
        "componentId": "ts-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "切换问题：What 还是 When？",
          "desc": "同一段示意视频，分别选择内容问答和时序定位，观察答案为什么不同。交互区间为教学示意。 <a href=\"https://proceedings.neurips.cc/paper_files/paper/2025/file/39da069a3e1baa8139b62d6603d37979-Paper-Conference.pdf\" target=\"_blank\" rel=\"noreferrer\">查看 NeurIPS 2025 原文</a>。",
          "componentId": "ts-task"
        }
      ],
      "insight": "本文不是要让模型多描述视频，而是要让它把语言事件落到正确的起止时刻。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "内容答案",
          "desc": "Video QA 通常回答视频里发生了什么。"
        },
        {
          "icon": "⏱️",
          "title": "时间区间",
          "desc": "时序定位还需要给出事件的起止边界。"
        },
        {
          "icon": "🧭",
          "title": "本文目标",
          "desc": "本文的 temporal sampling 是采样答案区间，不是自适应选择视频帧。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "候选很多，命中很难",
      "badge": "inf",
      "badgeLabel": "问题诊断",
      "bridge": "仅有真值标注还不够，关键是怎样利用它。SFT 直接学习参考答案；GRPO 则让模型为同一问题生成多个候选，用奖励作组内比较。如果模型还不会准确定位，候选都不够好，学习会缺少精确示范。",
      "analogy": {
        "title": "沿时间轴搜寻动作",
        "text": "剪辑师拖动播放头逐段查找事件；如果搜寻范围很长，几次试探都可能只碰到部分片段。",
        "componentId": "ts-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "逐步查看候选区间",
          "desc": "切换 Figure 1 的两个策略候选与一个外部真值，时间轴按秒数准确绘制，并实时计算 IoU。这里演示的是答案采样，不是视频帧采样。",
          "componentId": "ts-sampling"
        }
      ],
      "insight": "组内比较能判断“谁相对更好”，却不能保证当前模型能生成一个真正对准事件的答案。",
      "takeaways": [
        {
          "icon": "🔎",
          "title": "搜索空间",
          "desc": "每个答案都要选择时间轴上的起点和终点。"
        },
        {
          "icon": "🔁",
          "title": "策略内采样",
          "desc": "候选由当前模型生成并按任务奖励比较。"
        },
        {
          "icon": "⚠️",
          "title": "反馈稀疏",
          "desc": "大搜索空间会让早期探索不稳定。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "把真值答案放进候选组",
      "badge": "inf",
      "badgeLabel": "方法直觉",
      "bridge": "既然已有准确的起止标注，能否让它直接成为一个待学习的答案？本文对每个训练问题采样 G−1 个策略候选，再加入 1 个外部真值答案，构成总数为 G 的混合组。这个改动发生在强化微调阶段。",
      "analogy": {
        "title": "加入一个参考剪辑点",
        "text": "剪辑师保留几个当前尝试，再把已确认的参考区间放到同一轨道上作为对照。",
        "componentId": "ts-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "混合策略采样：G−1 + 1",
          "desc": "仅切换最后一个样本槽，就能把“纯策略内”改成“策略内 + 真值”。总数保持不变，比较的区别是答案来源。下方同时展示训练与推理各能获得什么信息。",
          "componentId": "ts-mix"
        }
      ],
      "insight": "真值原来已用于评分；本文进一步让它作为答案参与组内学习。测试时并不会获得待预测事件的真值。",
      "takeaways": [
        {
          "icon": "🟦",
          "title": "策略内候选",
          "desc": "来自当前模型的输出，保留探索。"
        },
        {
          "icon": "🟩",
          "title": "策略外指导",
          "desc": "来自外部标注的高质量时间区间。"
        },
        {
          "icon": "🧩",
          "title": "混合训练组",
          "desc": "把两类答案放入同一组进行策略更新。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "真值太强，也可能挤歪标尺",
      "badge": "inf",
      "badgeLabel": "关键风险",
      "bridge": "但加入一个好答案，不等于其他答案就能被正确鼓励。GRPO 的优势值 A 表示奖励相对组均值有多好；新加入的高奖励真值会改变这把标尺。一个原本应鼓励的策略答案，可能因此得到负优势。",
      "analogy": {
        "title": "调节组内刻度",
        "text": "剪辑台上先将不同候选按相对表现打分，再看一个极高的参考分怎样改变全组的刻度。",
        "componentId": "ts-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "拖动真值奖励，观察组标准化",
          "desc": "三个策略候选保持不变，只拖动外部奖励。左右两栏同步计算加入前后的均值、标准差和优势；观察奖励 0.65 的候选何时从正优势变为负优势。所有数字均为教学示意。",
          "componentId": "ts-skew"
        }
      ],
      "insight": "关键难点不只是把真值放进组里，还要防止它改变组内奖励分布，使策略更新失真。",
      "takeaways": [
        {
          "icon": "📏",
          "title": "组内标尺",
          "desc": "GRPO 依据同组奖励的均值和标准差计算优势值。"
        },
        {
          "icon": "↘️",
          "title": "优势为负",
          "desc": "负优势意味着该答案在这一组里的生成概率受到抑制，不表示它的原始奖励改变。"
        },
        {
          "icon": "🛠️",
          "title": "需要调节",
          "desc": "后续奖励整形负责平衡指导强度与策略探索。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "三种办法调节外部指导",
      "badge": "trn",
      "badgeLabel": "机制比较",
      "bridge": "问题出在“如何让外部示范提供方向，又不扭曲组内比较”。作者独立比较三种调节策略，而非依次叠加三道步骤。先看 Table 4 的消融，再用同一组奖励检查非线性整形究竟改变了什么。",
      "analogy": {
        "title": "选择一把校准尺",
        "text": "剪辑师拿到一个满分参考段后，需要校准评分尺，让它能指导修剪，也能辨认现有候选的细微差别。",
        "componentId": "ts-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "切换三种调节方案",
          "desc": "切换方法查看机制解释与论文 Table 4 的 Charades-STA R1@0.7 结果。数值来自消融表，不代表其他数据集。",
          "componentId": "ts-strategy"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "比较混合前后的组内优势",
          "desc": "固定原始奖励为 0.45、0.55、0.65、1.00，切换直接混合与非线性整形，实时对比输入数值、组统计和优势符号。这里展示机制，不声称任何训练组必然得到相同效果。",
          "componentId": "ts-mix"
        }
      ],
      "insight": "本篇的要点不是“多加入真值就一定更好”，而是外部指导和优势值处理要一起设计。",
      "takeaways": [
        {
          "icon": "🪫",
          "title": "奖励缩放",
          "desc": "例如把外部奖励限制到最大可能值的 80%；比例固定，可能压低有效指导。"
        },
        {
          "icon": "⚓",
          "title": "优势锚定",
          "desc": "只用策略候选计算均值和标准差；外部优势设为策略内最大优势的 1.2 倍。"
        },
        {
          "icon": "〰️",
          "title": "非线性整形",
          "desc": "在归一化前重塑高、低奖励之间的差距。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "先重塑奖励，再计算优势",
      "badge": "trn",
      "badgeLabel": "核心公式",
      "bridge": "本文最终采用非线性奖励整形：同一个变换作用于各答案的原始奖励，然后再标准化为优势。阈值以上的奖励被强烈压缩，阈值以下保留更高分辨率。先移动点观察真实函数曲线，再按需展开分段公式。",
      "analogy": {
        "title": "调整评分曲线",
        "text": "剪辑师把接近满分的候选轻轻压缩，同时把低分候选之间的差异拉开，避免最高分完全主导刻度。",
        "componentId": "ts-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "逐步揭示软奖励函数",
          "desc": "实线严格按 Eq. 4 绘制，虚线表示保持原奖励。移动橙点查看输入与输出，再逐步展开公式。曲线值是公式计算，不是模型的验证分数。",
          "componentId": "ts-shape"
        }
      ],
      "insight": "奖励先经过非线性变换，再计算组内优势；这一顺序有助于缓和偏斜奖励带来的更新不稳。",
      "takeaways": [
        {
          "icon": "⬆️",
          "title": "高奖励侧",
          "desc": "对接近最优的奖励做对数压缩，减少梯度尖峰。"
        },
        {
          "icon": "⬇️",
          "title": "低奖励侧",
          "desc": "阈值以下使用指数分支，相比被强压缩的高奖励区域，保留候选差异。"
        },
        {
          "icon": "⚙️",
          "title": "默认参数",
          "desc": "论文报告 τ=0.8、α₁=0.01、α₂=1。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "同一模型，也要看任务和推理方式",
      "badge": "both",
      "badgeLabel": "训练与任务",
      "bridge": "前面解决了如何把奖励变成更新信号，接下来要问奖励本身衡量什么。时间定位看区间 IoU；高光检测还要看显著性。论文先优化最终答案，再引入格式奖励支持 CoT，但输出更长的推理并不保证定位更准。",
      "analogy": {
        "title": "在时间轴与高光轨间切换",
        "text": "同一剪辑台既可标事件起止，也可挑选值得关注的片段；两项工作需要不同的评分标准。",
        "componentId": "ts-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "切换任务奖励",
          "desc": "选择时序定位或高光检测，查看各自奖励在衡量什么。权重和形式以论文 Sec. 3.3 为准。",
          "componentId": "ts-reward"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "查看两阶段训练与推理模式",
          "desc": "切换直接作答与显式推理，查看同一统一模型的两种输出格式。两阶段训练分别强调答案准确与推理格式；格式奖励只检查结构，不能单独证明推理正确。",
          "componentId": "ts-cot"
        }
      ],
      "insight": "训练方式服务于具体输出任务：时间边界看 IoU，高光检测还要评价片段显著性。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "时序定位",
          "desc": "用预测区间与真值区间的时间 IoU 计算奖励。"
        },
        {
          "icon": "✨",
          "title": "高光检测",
          "desc": "综合时间匹配的 F2 与显著性分数的加权误差。"
        },
        {
          "icon": "🧠",
          "title": "两种推理",
          "desc": "统一模型可按训练和任务选择 CoT 或直接作答。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "主结果：不同指标，不同赢家",
      "badge": "both",
      "badgeLabel": "实验结果",
      "bridge": "训练机制讲通后，要用什么证据检验它？Table 1 报告两个时间定位数据集和 QVHighlights 高光检测，三种推理模式的结果。每列越高越好，但不同任务的数值含义不同；Mixed CoT 的选择条件也要一起读。",
      "analogy": {
        "title": "并排比较不同轨道",
        "text": "剪辑师把多个项目的指标牌并排摆放；每一项都保留自己的评价标准。",
        "componentId": "ts-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "选择数据集，比较推理模式",
          "desc": "切换数据集与模式查看 Table 1 精确结果。关注不同任务的指标差异，以及 no-CoT、CoT、Mixed CoT 各自的领先项。",
          "componentId": "ts-results"
        }
      ],
      "insight": "部署时可选择 CoT 或直接作答。Mixed CoT 是逐查询选择较优输出的比较设定，不能直接当作无需选择机制的一次推理结果。",
      "takeaways": [
        {
          "icon": "📊",
          "title": "Charades-STA",
          "desc": "时序定位 Recall@1 与平均交并比。"
        },
        {
          "icon": "🌐",
          "title": "ActivityNet",
          "desc": "更丰富、更长时序片段下的定位结果。"
        },
        {
          "icon": "✨",
          "title": "QVHighlights",
          "desc": "高光检测的 mAP 与 HIT@1，要单独解读。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "少样本与跨数据集的检验",
      "badge": "both",
      "badgeLabel": "稳健性检查",
      "bridge": "主表较高还不能回答“小数据是否仍有用、换一个视频域是否还能工作”。作者分别设计跨数据集测试、少样本实验与组大小消融；它们回答不同问题，不宜用彼此的绝对分数横向比较。",
      "analogy": {
        "title": "抽取少量片段复查",
        "text": "剪辑师抽出不同数量的样本，或把在一类素材上学到的办法放到另一类素材上检查。",
        "componentId": "ts-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "查看跨数据集迁移",
          "desc": "按 Table 2 的协议比较方法：在 Charades-STA 训练，再直接在 ActivityNet Captions 测试。",
          "componentId": "ts-general"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "拖动样本数与候选组大小",
          "desc": "只提供原表测试的离散档位，不对中间样本量插值。Table 3 比较 50/100/200/500 个训练视频，Table 5 比较每组 2/4/6/8 个解。",
          "componentId": "ts-fewshot"
        }
      ],
      "insight": "在论文测试的低样本和跨域设置中，改进仍可观察到；但结论受数据、模型和训练预算约束。",
      "takeaways": [
        {
          "icon": "🧪",
          "title": "跨域",
          "desc": "Table 2 明确是在 Charades 训练、ActivityNet 测试。"
        },
        {
          "icon": "🗂️",
          "title": "少样本",
          "desc": "Table 3 测试 50、100、200、500 个训练视频。"
        },
        {
          "icon": "👥",
          "title": "组大小",
          "desc": "Table 5 测试每组 2、4、6、8 个解。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "贡献有边界，研究可以继续",
      "badge": "both",
      "badgeLabel": "总结与边界",
      "bridge": "现在可以把贡献连成因果链：答案探索不足 → 把标注作为候选 → 处理组内奖励偏斜 → 改善时间定位训练。它解决了学习信号的问题，但重复事件和边界歧义依然存在。选择一个失败来源，判断还缺哪类证据。",
      "analogy": {
        "title": "放大检查边界",
        "text": "剪辑师最后放大时间线，核对重复动作、模糊画面和标注边界。",
        "componentId": "ts-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "点击误差来源，整理结论",
          "desc": "点选论文定性分析中的错误来源，查看方法贡献、适用边界，以及连接后续 OraRL 学习的研究问题。<a href=\"https://github.com/HVision-NKU/TempSamp-R1\" target=\"_blank\" rel=\"noreferrer\">作者代码仓库</a>。",
          "componentId": "ts-limits"
        }
      ],
      "insight": "更好的策略更新能帮助模型找区间，但无法消除视频本身的歧义或不精确标注。",
      "takeaways": [
        {
          "icon": "✅",
          "title": "本文贡献",
          "desc": "策略外真值指导与非线性优势整形协同改善更新。"
        },
        {
          "icon": "⚠️",
          "title": "仍有边界",
          "desc": "重复事件、视觉歧义和模糊标注仍会带来定位错误。"
        },
        {
          "icon": "➡️",
          "title": "下一步问题",
          "desc": "在有限样本和算力下，怎样让强化学习信号更稳定、更有效？"
        }
      ]
    }
  ]
};
