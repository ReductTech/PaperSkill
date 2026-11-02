import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "VTimeCoT: Thinking by Drawing for Video Temporal Grounding and Reasoning",
    "titleZh": "VTimeCoT：用可视化时间线推进视频时序定位与推理",
    "venue": "ICCV 2025",
    "authors": "Jinglei Zhang, Yuanfan Guo, Rolandos Alexandros Potamias, Jiankang Deng, Hang Xu, Chao Ma",
    "affiliation": "上海交通大学、华为诺亚方舟实验室、帝国理工学院",
    "domain": "视频时序定位 · 多模态大模型推理",
    "coreProblem": "视频大模型可能说对内容却说不准时间；如何把可读时间线索引入推理过程？",
    "coreInsight": "先把帧的时间位置画出来，再检索并高亮问题相关片段，让模型带着新增视觉证据继续推理。进度条与高亮是两种工具，视觉时间思维链负责决定何时调用、继续或停止；框架无需额外微调。",
    "keywords": [
      "视频时序定位（Temporal Grounding）",
      "视觉时间思维链（Visuotemporal CoT）",
      "进度条工具",
      "关键片段高亮",
      "长视频推理"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "传统用法通常让视频大模型直接给出一次性文字回答；时间推理过程缺少显式可视的定位线索。",
      "componentId": "vtime-hero"
    },
    "newMethod": {
      "desc": "VTimeCoT把帧同步进度条、视频—文本片段高亮和多轮视觉—文本推理接到同一回路中。",
      "componentId": "vtime-hero"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "答对了内容，还得找准“什么时候”",
      "badge": "inf",
      "badgeLabel": "任务边界",
      "bridge": "同一段录像里，“他打开了门”与“他在20—38秒打开门”回答了不同问题。视频问答（Video QA）通常输出内容答案；文本条件视频时序定位（temporal video grounding）输入视频与一句查询，输出相关事件的起止区间。后者需要内容识别和时间定位同时正确。",
      "analogy": {
        "title": "把游标停在动作发生处",
        "text": "短片里有人走向门、打开门、再穿过门口。观众需要把“打开门”与前后的准备、结果区分开，并标出真正的动作区间。",
        "componentId": "vtime-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "切换问题：内容问答还是时间定位",
          "desc": "看同一段短片，选择问题目标；图中的句子与区间都为教学示意，不是论文样本。<a href=\"https://openaccess.thecvf.com/content/ICCV2025/papers/Zhang_VTimeCoT_Thinking_by_Drawing_for_Video_Temporal_Grounding_and_Reasoning_ICCV_2025_paper.pdf\" target=\"_blank\" rel=\"noreferrer\">打开 ICCV 2025 论文 PDF</a>。 <a href=\"https://vtimecot.github.io/\" target=\"_blank\" rel=\"noreferrer\">打开作者项目页</a>。",
          "componentId": "vtime-task"
        }
      ],
      "insight": "时序定位不只要求语义正确，还要让答案落到正确的时间段。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "问“是什么”",
          "desc": "视频问答主要判断内容答案。"
        },
        {
          "icon": "⏱️",
          "title": "问“何时发生”",
          "desc": "时序定位还要预测起止边界。"
        },
        {
          "icon": "🧭",
          "title": "本文关注时间证据",
          "desc": "VTimeCoT让模型在推理中显式利用时间线索。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "只写一段思维链，为什么仍会错过时间",
      "badge": "inf",
      "badgeLabel": "问题诊断",
      "bridge": "文字CoT（chain-of-thought，思维链）让模型逐步解释，但多写几句不会自动增加缺失的时间证据。若只看到几张稀疏采样的帧，模型可能认出开门，却难把画面映射回整段视频的秒数。VTimeCoT因而把时间线索画进可视输入，再让模型观察。",
      "analogy": {
        "title": "猜得到动作，不一定停对位置",
        "text": "观众只凭一句口头描述拖动进度条，容易停在相似动作旁边。画面中的两个候选位置仅作示意。",
        "componentId": "vtime-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "对照两种证据：文字猜测与时间标记",
          "desc": "拖动同一个时间点，对比“能认出画面内容”和“能读出画面时间”的区别。图示说明缺少哪类证据，不表示所有文字CoT都会失败。",
          "componentId": "vtime-compare"
        }
      ],
      "insight": "作者的关键转向是让时间线索进入可视输入，再让模型根据证据决定下一步。",
      "takeaways": [
        {
          "icon": "🗣️",
          "title": "文字解释不等于时间坐标",
          "desc": "CoT 本身并没有给每帧标注绝对位置。"
        },
        {
          "icon": "🎞️",
          "title": "长视频更难一次看全",
          "desc": "论文指出帧数与上下文限制会妨碍时间推理。"
        },
        {
          "icon": "🔎",
          "title": "需要能回看的证据",
          "desc": "接下来先给画面加上可见的时间尺。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "第一步：让每帧带上时间坐标",
      "badge": "inf",
      "badgeLabel": "进度条工具",
      "bridge": "帧同步进度条（frame-synchronized visual progress bar）先把帧对应的时间换算成秒，再在原帧下方拼接一条带时间标记的进度条。模型于是可以同时观察“正在开门”和“当前24秒”，不必只靠采样帧顺序猜绝对位置。",
      "analogy": {
        "title": "给画面贴上进度位置",
        "text": "观众把时间尺叠在播放画面下方。停在不同帧时，游标也落在对应位置。",
        "componentId": "vtime-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "逐帧查看时间尺如何同步",
          "desc": "固定在同一帧24秒，逐步观察时间尺怎样生成、拼接、被读取。点击下一步改变的是处理阶段，画面的时间始终不变。数值和场景为教学示例；依据§3.2、Eq.1。",
          "componentId": "vtime-progress"
        }
      ],
      "insight": "它把抽象时间转成画面中可读的线索，且不要求为这个框架额外微调模型。",
      "takeaways": [
        {
          "icon": "📍",
          "title": "帧与进度条同步",
          "desc": "时间位置作为视觉信息出现在帧上。"
        },
        {
          "icon": "🧾",
          "title": "借助通用视觉能力",
          "desc": "论文通过绘图工具生成进度条，并利用模型的 OCR/形状理解。"
        },
        {
          "icon": "⚠️",
          "title": "这是线索，不是保证",
          "desc": "增加时间标记不代表模型永远能准确读取它。"
        }
      ],
      "formula": {
        "lead": "把时间尺画进模型能看的画面中。原文Eq.1中的运算表示图像上下拼接。",
        "unicode": "V′ₜ = Vₜ ⊕ Tₜ",
        "symbols": [
          {
            "sym": "V′ₜ",
            "desc": "添加进度条后，供模型观察的帧。"
          },
          {
            "sym": "Vₜ",
            "desc": "时刻t的原始视频帧。"
          },
          {
            "sym": "⊕",
            "desc": "图像沿垂直方向拼接，不是张量逐元素相加。"
          },
          {
            "sym": "Tₜ",
            "desc": "工具在时刻t生成的进度条图像。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "第二步：检索并高亮可能相关的片段",
      "badge": "inf",
      "badgeLabel": "片段检索",
      "bridge": "知道一帧在第几秒，还没有解决“该看哪一段”。高亮工具将查询和视频片段分别交给VideoCLIP-XL编码，计算余弦相似度，选出top-k片段并合并相邻区间，再把候选区间画亮。检索先缩小范围，MLLM再结合真实画面判断。",
      "analogy": {
        "title": "沿时间尺圈出候选片段",
        "text": "观众先圈出可能含开门动作的片段，再回看前后的画面。与“门”相关的片段也可能只是走近或走过门，所以高亮是候选线索。",
        "componentId": "vtime-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "回看三个候选：相关不等于边界正确",
          "desc": "点击候选后，画面、时间位置和证据解释同步变化。三个示例分别表现靠近门、开门、走过门；它们不是VideoCLIP-XL的实测检索结果。",
          "componentId": "vtime-highlight"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "拖动时间尺，检查动作的前后边界",
          "desc": "把游标拖进、拖出高亮区间，看准备动作、目标动作和后续结果怎样改变。画面与60秒时间尺为教学示意，支持触控及方向键。",
          "componentId": "vtime-sync"
        }
      ],
      "insight": "时间条提供时间坐标；检索和高亮则缩小模型后续观察的范围。",
      "takeaways": [
        {
          "icon": "🧩",
          "title": "片段化后再匹配",
          "desc": "论文默认外部检索按1 FPS抽帧，每8帧组成一个clip，再取top-8。"
        },
        {
          "icon": "🔦",
          "title": "高亮候选区间",
          "desc": "工具把预测的起止时间转成视觉强调。"
        },
        {
          "icon": "🧪",
          "title": "免训练不等于无依赖",
          "desc": "候选质量仍依赖所用视频—文本模型和输入条件。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "让模型“想—做—看”，而不是一次性回答",
      "badge": "inf",
      "badgeLabel": "推理循环",
      "bridge": "时间尺和高亮并不是预先固定展示的两张图。模型先读当前视频与问题，判断缺少什么证据，再生成工具调用代码；工具改绘画面后，带标记的视频帧与本轮文本记录进入下一轮。推理真正前进，是因为模型看到了新增证据。",
      "analogy": {
        "title": "回看后再决定是否停下",
        "text": "观众先停在候选位置，回看片段后再判断证据是否足够。每次回看都围绕同一个目标动作。",
        "componentId": "vtime-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "逐步走一遍 Visuotemporal CoT",
          "desc": "沿着同一个开门问题，逐步查看模型缺少的证据、工具调用、更新后的帧和最终区间。四个环节不是四轮推理；依据Algorithm 1与§3.1，示例思考和答案为教学推演。",
          "componentId": "vtime-loop"
        }
      ],
      "insight": "VTimeCoT 把工具调用放进推理过程，模型能动态更新视频记忆，而非只在开头看一次。",
      "takeaways": [
        {
          "icon": "💭",
          "title": "Thought：判断证据",
          "desc": "模型决定直接回答，还是还需要时间线索。"
        },
        {
          "icon": "🛠️",
          "title": "Action：执行工具",
          "desc": "模型生成脚本，调用进度条/检索工具。"
        },
        {
          "icon": "🔁",
          "title": "更新后继续或终止",
          "desc": "带标记帧与历史进入下一轮；论文实现中最大推理步数T=3。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "两种工具各自补上哪一块证据",
      "badge": "both",
      "badgeLabel": "机制对照",
      "bridge": "把系统拆开看：进度条提供时间坐标，检索与高亮提供相关区间，MLLM负责组合证据、决定工具调用并回答。前两者是本文的两种工具；动态视频记忆是让改绘画面进入下一轮推理的上下文机制。三者角色不能混为一谈。",
      "analogy": {
        "title": "先标时间，再看亮起的片段",
        "text": "观众在同一条进度尺上定位，并把问题相关的一段高亮。两个动作共享一段视频，不代表论文逐步比较过所有组合。",
        "componentId": "vtime-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "并排比较进度条与高亮的作用",
          "desc": "在同一示例画面上切换两种视觉线索；图示展示概念分工，不是论文消融结果。",
          "componentId": "vtime-dual"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "点击节点，追踪证据怎样回到推理",
          "desc": "点击不同角色查看输入、处理和输出，并分清MLLM默认32帧与外部VideoCLIP-XL检索分支。依据Figure 2、§3及§4实现细节；此处展示机制分工。",
          "componentId": "vtime-flow"
        }
      ],
      "insight": "时间坐标回答“在哪”，视频—文本检索回答“看哪里”；视觉时间思维链把两类证据交给同一个推理回路。",
      "takeaways": [
        {
          "icon": "📏",
          "title": "进度条负责时间可读性",
          "desc": "它把帧位置映射到整段视频。"
        },
        {
          "icon": "🔦",
          "title": "高亮负责聚焦相关区间",
          "desc": "它让候选片段在视觉上更容易检查。"
        },
        {
          "icon": "🔗",
          "title": "CoT 负责组合证据",
          "desc": "思维、工具与更新后的视频相互衔接。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "在标准定位基准上看结果",
      "badge": "both",
      "badgeLabel": "时序定位证据",
      "bridge": "如果把整段视频都预测成答案，虽然包含目标动作，也不算定位准确。IoU用预测区间与标注的交集除以并集，因而同时惩罚遗漏和多余部分。先亲手调区间，再读Charades-STA与QVHighlights的R1@IoU和mIoU结果。",
      "analogy": {
        "title": "在不同片段上核对落点",
        "text": "观众分别查看两段录像的目标位置。基准之间分开展示，不能把不同录像集合并成一个分数。",
        "componentId": "vtime-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "选择基准和骨干，逐项读定位指标",
          "desc": "上半部分是可操作的IoU教学计算，下半部分是Table 1–2真实结果。R1@0.3/0.5/0.7和mIoU均越高越好；差值以百分点表示，同一数据集、同一骨干内比较。",
          "componentId": "vtime-grounding"
        }
      ],
      "insight": "两套基准的数值都显示论文所测配置有提升，但它们不代表所有视频、模型和部署条件。",
      "takeaways": [
        {
          "icon": "📊",
          "title": "Charades-STA",
          "desc": "论文报告 R1@多个 IoU 阈值与 mIoU。"
        },
        {
          "icon": "🧾",
          "title": "QVHighlights",
          "desc": "其视频时长与标注任务不同，须独立读表。"
        },
        {
          "icon": "⚖️",
          "title": "同设置内比较",
          "desc": "数据集和骨干不同时，不将数值直接混比。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "长视频问答：时间线索能否帮上忙",
      "badge": "both",
      "badgeLabel": "推理任务证据",
      "bridge": "时序定位输出区间，长视频问答则把找到的片段当作回答内容问题的证据。Vript-RR给出场景提示，考查先检索再推理；VideoMME还考查事件计数与先后顺序。问答准确率与定位IoU衡量不同能力，不能混成一个总分。",
      "analogy": {
        "title": "沿长进度条找回事件顺序",
        "text": "观众回看长录像，先定位线索，再核对事件顺序。长视频示意不包含论文原始样本。",
        "componentId": "vtime-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "切换基准、题型和字幕条件",
          "desc": "展示Table 3–4的原表数值。Vript-RR的多选/开放式分开计分；VideoMME的无字幕/有字幕分开读。GPT-4o与VTimeCoT GPT-4o在此表均按32帧重测。",
          "componentId": "vtime-qa"
        }
      ],
      "insight": "作者的论点不止是区间定位：显式时间线索也有助于论文测试的长视频检索问答。",
      "takeaways": [
        {
          "icon": "🧩",
          "title": "Vript-RR",
          "desc": "原文报告152个问题，视频平均622秒；提供场景提示，含多选与开放式设置。"
        },
        {
          "icon": "📝",
          "title": "VideoMME",
          "desc": "900个视频、2700组问答；准确率按无字幕/有字幕分别报告。"
        },
        {
          "icon": "🔍",
          "title": "协议决定解释",
          "desc": "不同题型、字幕和帧数不能脱离条件比较。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "消融：思维链、进度条和高亮分别怎样加入",
      "badge": "both",
      "badgeLabel": "模块消融",
      "bridge": "Table 5 逐步加入 CoT、进度条和高亮，能帮助检查完整组合与部分组合的表现。表中差异来自一个特定 GPT-4o 设置，不能把总增益全算给某个单独工具。",
      "analogy": {
        "title": "逐个查看录像上的标记",
        "text": "观众先看纯画面，再打开文字推理、时间尺和高亮。每种组合对应论文中的一行，而不是自行生成的新实验。",
        "componentId": "vtime-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "按 Table 5 选择真实消融配置",
          "desc": "选择论文实际报告的四种配置。QVHighlights 显示 mIoU，Vript-RR 显示 M-Acc；不得把未报告的工具组合补成新数据。",
          "componentId": "vtime-ablation"
        }
      ],
      "insight": "在GPT-4o这组逐步消融中，进度条和高亮都在已有配置上带来进一步改善；此表支持的是这些条件下的增量，而非每种工具脱离上下文的普遍效应。",
      "takeaways": [
        {
          "icon": "➕",
          "title": "先加文字 CoT",
          "desc": "两个指标均较基础 GPT-4o 行提高。"
        },
        {
          "icon": "📏",
          "title": "再加进度条",
          "desc": "论文报告的两项指标继续提高。"
        },
        {
          "icon": "🔦",
          "title": "最后加入高亮",
          "desc": "完整方法行最高，但不等于独立因果证明。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结论：关键不是“多想”，而是补上时间证据",
      "badge": "both",
      "badgeLabel": "结论与边界",
      "bridge": "回到开头：文字 CoT 并不会自动提供时间坐标。VTimeCoT 的贡献是把可见进度线索、片段检索和迭代观察接入推理；最后用一组表中数值核对这条主线。",
      "analogy": {
        "title": "把游标落到可核验的区间",
        "text": "观众最后停在目标片段，并检查时间尺和高亮是否支持判断。此处的结果赛道只显示论文已报告的数值。",
        "componentId": "vtime-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "启动一次可核验的结果对照",
          "desc": "结果来自 Table 5 的 GPT-4o 消融；动效仅帮助阅读，不表示新运行实验。论文没有提供普适的推理成本最优点或统一延迟曲线。",
          "componentId": "vtime-result"
        }
      ],
      "insight": "更多观察是否值得，取决于新增时间证据能否抵过推理开销；本文未给出普适的工具调用成本最优点。",
      "takeaways": [
        {
          "icon": "🧠",
          "title": "核心结论",
          "desc": "时间线索和工具回看，为模型补上“何时”的显式证据。"
        },
        {
          "icon": "⚠️",
          "title": "适用边界",
          "desc": "证据来自指定模型、数据集与实验协议；没有普适成本结论。"
        },
        {
          "icon": "➡️",
          "title": "接到第四篇",
          "desc": "Moment-DETR学习定位结构；本文在推理时取证；TempSamp-R1再研究训练时对候选时间答案的采样与奖励。"
        }
      ]
    }
  ]
};
