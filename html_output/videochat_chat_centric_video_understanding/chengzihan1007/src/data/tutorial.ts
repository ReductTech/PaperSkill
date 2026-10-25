import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "VideoChat",
    "titleZh": "视频侦探放映室",
    "venue": "arXiv 2023 · v2 2024",
    "authors": "Kunchang Li, Yinan He, Yi Wang 等",
    "affiliation": "OpenGVLab · 上海人工智能实验室等",
    "domain": "视频理解 · 多模态对话",
    "coreProblem": "如何让语言模型利用视频里的对象、动作和时间关系，回答连续的问题？",
    "coreInsight": "<b>把视频变成一场有证据的对话。</b><br/>从一帧画面到时间日志，再到可学习的视频—语言接口，亲手拆解 VideoChat 的两条路线。<br/>基于 <a href=\"https://arxiv.org/abs/2305.06355v2\" target=\"_blank\" rel=\"noreferrer\">VideoChat: Chat-Centric Video Understanding</a>。交互为教学模拟；标注论文图号的案例引用原文回答。",
    "keywords": [
      "10 章主线",
      "20 个交互实验",
      "20 道可选小测",
      "原论文图像与公式"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "只看一张照片，或只读一段字幕。<br/><b>看见了线索，却可能丢掉先后关系。</b>",
      "componentId": "vc-hero-old"
    },
    "newMethod": {
      "desc": "让视频信息进入语言模型，并结合问答历史。<br/><b>追问“那之前呢”，仍然有上下文。</b>",
      "componentId": "vc-hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "一张图，能看懂一段故事吗？",
      "badge": "inf",
      "badgeLabel": "问题与动机",
      "bridge": "先进入放映室，亲自比较单帧、字幕与完整片段：哪些结论来自可见证据，哪些只是猜测？",
      "analogy": {
        "title": "放映室手记 · 01",
        "text": "放大镜沿胶片移动，才看见动作如何变化。静止照片可以留下姿势，却不会自动告诉我们事情的先后。",
        "componentId": "vc-analogy-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "你到底看到了多少？",
          "desc": "切换可见模态，并逐帧观察同一个故事。人物动作、事件顺序和动机需要不同层次的证据。",
          "componentId": "vc-1-a"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "同一个视频，三个任务",
          "desc": "在动作识别、时间问题与因果解释之间切换，观察任务如何被写进一句自然语言问题。",
          "componentId": "vc-1-b"
        }
      ],
      "insight": "增加有序帧可以补充时间信息；时间先后仍不等于因果证明。",
      "takeaways": [
        {
          "icon": "🎞",
          "title": "顺序来自序列",
          "desc": "单帧只能直接呈现一个时刻；动作前后要从时间证据中读取。"
        },
        {
          "icon": "💬",
          "title": "任务写进问题",
          "desc": "VideoChat 用聊天接口组织不同视频任务，由语言模型结合视觉信息回答。"
        },
        {
          "icon": "🔎",
          "title": "证据决定边界",
          "desc": "看到动作切换，也可能无法确认人物动机；会回答不等于答得可靠。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "把视频任务写进一句问题",
      "badge": "inf",
      "badgeLabel": "表示与对话",
      "bridge": "上一章看见了输入差异。现在把视频表示 E、当前问题和历史答案放到同一张图上，理解聊天接口怎样工作。",
      "analogy": {
        "title": "放映室手记 · 02",
        "text": "在记录卡上划出关键线索，再接上前面的记录。每一条追问都需要知道它正在指向哪个事件。",
        "componentId": "vc-analogy-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "视频表示解剖器",
          "desc": "点击 Eq. 1 的符号，查看单帧与整段视频的处理分支，并切换文字或 embedding 中介。",
          "componentId": "vc-2-a"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "聊天记忆轨道",
          "desc": "逐轮发送问题，再移除历史：同一段视频还在，“那之前”的指代却可能失去参照。",
          "componentId": "vc-2-b"
        }
      ],
      "insight": "E 提供视频信息，历史问答帮助解释当前问题；二者不能互相替代。",
      "formula": {
        "lead": "读过两张联动图后，再看论文 p3 Eq. 1–2：视觉表示先产生，当前答案再由表示与对话上下文共同生成。",
        "unicode": "[E]ᵢʲ = f_imgʲ(Iᵢ) 或 Eʲ = f_vidʲ(V)；V = [Iᵢ]ᵢ₌₁…T；Wᵃₜ = f_llm(E | Wᑫ≤ₜ, Wᵃ<ₜ)",
        "symbols": [
          {
            "sym": "Iᵢ / V",
            "desc": "第 i 帧 / 包含 T 帧的有序视频序列。"
          },
          {
            "sym": "i / j / T",
            "desc": "帧索引 / 感知模型索引 / 帧数。"
          },
          {
            "sym": "E",
            "desc": "文字描述或 embedding；公式不指定统一的张量维度。"
          },
          {
            "sym": "t / Wᑫ≤ₜ / Wᵃ<ₜ",
            "desc": "当前对话轮次 / 包含当前问题的问句序列 / 仅当前轮之前的答案序列。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧩",
          "title": "中介有两种路线",
          "desc": "Text 用文字，Embed 用特征表示；二者都向 LLM 提供视觉信息。"
        },
        {
          "icon": "🧵",
          "title": "历史解开指代",
          "desc": "“那之前”通常依赖前面谈过的事件；移除上下文会造成歧义。"
        },
        {
          "icon": "📐",
          "title": "输入不含当前答案",
          "desc": "第 t 轮包含当前问题，但历史答案只到 t−1；当前答案是待生成输出。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "VideoChat-Text：给视频写时间日志",
      "badge": "inf",
      "badgeLabel": "文字路线",
      "bridge": "既然 E 可以是文字，怎样把视频变成 LLM 可读的日志？打开感知工具，观察信息来源，再把日志组装进提示。",
      "analogy": {
        "title": "放映室手记 · 03",
        "text": "给每条线索盖上时间戳，就能把散落的观察放回事件顺序。记录员能整理日志，却不能凭整理补出没看见的事情。",
        "componentId": "vc-analogy-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "感知工具工作台",
          "desc": "开关五种工具，让动作、标签、区域描述和语音在画面与日志中联动。T5 只整理已有文字。",
          "componentId": "vc-3-a"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "Prompt 拼装器",
          "desc": "组合视频上下文、问题和系统约束，发送教学提示，再判断回答有多少证据支撑。",
          "componentId": "vc-3-b"
        }
      ],
      "insight": "VideoChat-Text 的可解释性来自可读日志；日志漏掉的信息也会限制后续回答。",
      "takeaways": [
        {
          "icon": "🛠",
          "title": "工具各有职责",
          "desc": "InternVideo 提供动作线索，Tag2Text 提供标签和描述，GRiT 提供区域描述，Whisper 转写语音。"
        },
        {
          "icon": "📝",
          "title": "按时间组织文字",
          "desc": "感知结果变成带时间信息的文字，T5 可整理文本，再交给 LLM 解释。"
        },
        {
          "icon": "⚖",
          "title": "约束不是保证",
          "desc": "系统提示可以要求依视频回答，但无法保证消除幻觉；流畅文字也不代表事实完整。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "文字日志会漏掉什么？",
      "badge": "both",
      "badgeLabel": "两条路线",
      "bridge": "感知工具已经把视频写成日志，下一步要问：没有写进日志的细节，还能被语言模型知道吗？",
      "analogy": {
        "title": "放映室手记 · 04",
        "text": "橡皮擦去线索纸上的一处细节：记录仍然流畅，但证据已经变少。文字中介便于检查，也受表达能力限制。",
        "componentId": "vc-analogy-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "同一事件，两种中介",
          "desc": "选择事件，再切换 Text 与 Embed，观察文字概括与特征示意的区别。依据 p5 Analysis；Fig.1。",
          "componentId": "vc-4-a"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "删掉一个线索",
          "desc": "主动删除动作、位置或时间线索，重新判断哪些结论仍有依据。因果解释始终需要额外证据。",
          "componentId": "vc-4-b"
        }
      ],
      "insight": "绕过显式文字瓶颈是 Embed 的动机；它仍然会压缩信息，并不保证看见每个细节。",
      "takeaways": [
        {
          "icon": "📝",
          "title": "文字有边界",
          "desc": "感知工具的解码器决定哪些信息能进入文字中介。"
        },
        {
          "icon": "🧩",
          "title": "特征提供另一条路",
          "desc": "可学习接口把视觉表示送入语言模型，减少对显式描述的依赖。"
        },
        {
          "icon": "🔍",
          "title": "顺序不是原因",
          "desc": "完整事件序列可以支持排序，不能直接证明行为动机。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "VideoChat-Embed：把视频接入语言模型",
      "badge": "both",
      "badgeLabel": "架构与接口",
      "bridge": "如果不先把视频写成文字，怎样让语言模型接收视觉信息？沿着视觉编码、查询压缩与投影三个环节寻找答案。",
      "analogy": {
        "title": "放映室手记 · 05",
        "text": "聚光灯扫过胶片，照亮当前需要的线索。可学习查询像聚焦机制，从大量视觉信息中组织紧凑表示。",
        "componentId": "vc-analogy-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "可点击神经网络",
          "desc": "逐个选择架构节点，查看它的角色与相邻信息流。GMHRA 集成在视觉编码器中；依据 p5 §3.2.1、Fig.2(a)。",
          "componentId": "vc-5-a"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "Q-Former 聚光镜",
          "desc": "拖动查询或使用方向键，观察示意注意力与输出聚合变化。64 → 8 仅为缩小教学示意。",
          "componentId": "vc-5-b"
        }
      ],
      "insight": "视觉特征提供 K/V，查询提供 Q；Q-Former 压缩信息，线性投影把表示对齐到语言模型输入。",
      "takeaways": [
        {
          "icon": "🎞️",
          "title": "跨帧建模",
          "desc": "新增 GMHRA 在视觉编码器中增强时间信息处理。"
        },
        {
          "icon": "🔦",
          "title": "查询聚合",
          "desc": "Q-Former 使用查询压缩视觉特征，新增 queries 是可学习向量。"
        },
        {
          "icon": "🔗",
          "title": "映射语言空间",
          "desc": "线性投影适配 LLM 输入；压缩的表示仍可能丢失信息。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "视频指令数据怎样诞生？",
      "badge": "trn",
      "badgeLabel": "指令数据",
      "bridge": "接口连接好之后，模型仍需要学习如何回应问题。把时间日志转换成描述、时间与因果指令，观察数据设计的作用与风险。",
      "analogy": {
        "title": "放映室手记 · 06",
        "text": "线索卡在桌面翻转，正面记录观察，背面组织问题。不同问题把同一段视频的不同关系带到前台。",
        "componentId": "vc-analogy-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "Instruction Builder",
          "desc": "用同一段教学日志构造三类指令，区分观察内容与推测。依据 p6 §3.2.2、Tables 3–7。",
          "componentId": "vc-6-a"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "Prompt 手术台",
          "desc": "选择提示词约束，检查对应样例，再清理重复句与残句。后处理改善表达，不自动验证事实。",
          "componentId": "vc-6-b"
        }
      ],
      "insight": "7K 详细视频描述与 4K 视频对话让训练覆盖丰富叙述和时间、因果问答；生成的数据仍需要事实核验。",
      "takeaways": [
        {
          "icon": "📚",
          "title": "从日志到指令",
          "desc": "WebVid 视频经过 Text 文字信息与语言模型辅助，组织成指令样本。"
        },
        {
          "icon": "⏱️",
          "title": "问题决定关注点",
          "desc": "描述问对象与动作，时间问先后，因果问解释并保留不确定性。"
        },
        {
          "icon": "🧹",
          "title": "清理不等于核实",
          "desc": "重复与残句可以清理，视频事实和因果关系仍需证据支持。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "两阶段训练：先对齐，再学会聊天",
      "badge": "trn",
      "badgeLabel": "训练策略",
      "bridge": "配对数据与指令数据各司其职。切换训练阶段，分清变化的是数据和目标，哪些模型参数始终冻结。",
      "analogy": {
        "title": "放映室手记 · 07",
        "text": "调焦旋钮转动，让固定的放映画面逐渐清晰。训练主要调整新增接口，视觉与语言主干保持冻结。",
        "componentId": "vc-analogy-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "训练控制台",
          "desc": "对照两个阶段的训练目标、epoch 与参数范围。依据 p5 §3.2.1、p6 §3.2.3、Fig.2(b)。",
          "componentId": "vc-7-a"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "训练数据配方",
          "desc": "点选按真实阶段内比例绘制的数据段，查看来源与用途。25M 与 18K 使用独立归一化尺度。",
          "componentId": "vc-7-b"
        }
      ],
      "insight": "先用 25M 配对数据训练 1 epoch，再用 18K 指令样本训练 3 epochs；两阶段均仅训练新增 GMHRA、queries 和线性投影。",
      "takeaways": [
        {
          "icon": "🔗",
          "title": "阶段一：对齐",
          "desc": "10M 视频对与 15M 图像对合计 25M，建立视觉—语言联系。"
        },
        {
          "icon": "💬",
          "title": "阶段二：指令",
          "desc": "11K 视频与 7K 图像指令样本合计 18K，学习指令遵循与对话。"
        },
        {
          "icon": "❄️",
          "title": "主干保持冻结",
          "desc": "视觉主干、预训练 Q-Former 主体与 LLM 在两个阶段均冻结。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "多轮视频聊天：那之前发生了什么？",
      "badge": "inf",
      "badgeLabel": "推理 · 对话历史",
      "bridge": "模型已完成对齐和指令训练，接下来观察视频信息与问答历史如何一起支撑连续追问。",
      "analogy": {
        "title": "放映室手记 · 08",
        "text": "一枚书签沿固定时间日志滑动，停在引用事件。问“那之前”时，我们也需要先找到“那”究竟指向哪件事。",
        "componentId": "vc-analogy-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "Multi-turn VideoChat Simulator",
          "desc": "在论文的篮球与舞蹈案例中建立问答历史，观察事件引用与时间线的连接。",
          "componentId": "vc-8-a"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "时间推理沙盘",
          "desc": "同一段事件记录可以回答时间问题，却不自动构成原因证明。",
          "componentId": "vc-8-b"
        }
      ],
      "insight": "历史负责帮助解析指代，视频提供内容依据；二者缺一，都可能让连贯的回答失去证据。",
      "formula": {
        "lead": "把第 2 章的多轮关系放回实际问答：",
        "unicode": "Wᵃₜ = f_llm(E | Wᑫ≤ₜ, Wᵃ<ₜ)",
        "symbols": [
          {
            "sym": "E",
            "desc": "视频的文字或 embedding 表示"
          },
          {
            "sym": "Wᑫ≤ₜ",
            "desc": "包含本轮问题在内的提问历史"
          },
          {
            "sym": "Wᵃ<ₜ",
            "desc": "本轮之前的回答，不包含待生成答案"
          },
          {
            "sym": "Wᵃₜ",
            "desc": "当前回答；t 为对话轮次"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🔖",
          "title": "历史帮助定位指代",
          "desc": "“那之前”需要先从前文确定参照事件，再查视频中的时间关系。"
        },
        {
          "icon": "⏱",
          "title": "时序与因果分开",
          "desc": "先发生的事件未必是后续事件的原因；因果解释还需要额外证据。"
        },
        {
          "icon": "🔎",
          "title": "案例回答不是测量",
          "desc": "Fig.8 的 9.8 秒来自模型回答，不能当作定位精度或人工标注。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "案例博物馆：证据究竟支持什么？",
      "badge": "both",
      "badgeLabel": "证据 · 定性案例",
      "bridge": "多轮交互展示了可能性，但一段成功对话究竟能支撑多强的结论？回到论文原图检查。",
      "analogy": {
        "title": "放映室手记 · 09",
        "text": "一枚放大镜检查固定案例照片，圈出可见证据。每次解释都应问：画面真的给出了这些信息吗？",
        "componentId": "vc-analogy-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "TVQA 三路对照",
          "desc": "同一问题、不同输入，逐项核对 Fig.3 的系统回答，保留图像 VideoChat 也答对的事实。",
          "componentId": "vc-9-a"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "能力博物馆",
          "desc": "六张原图串起幽默、事故、配乐、时间、多轮与安全问题，从线索走向解释。",
          "componentId": "vc-9-b"
        }
      ],
      "insight": "定性案例能展示潜力，也能暴露失败；它们不能替代控制条件明确、规模充分的量化评测。",
      "takeaways": [
        {
          "icon": "🖼",
          "title": "保留案例中的例外",
          "desc": "Fig.3 并不是“只有视频答对”：单帧输入的 VideoChat-Embed 也给出了公园长椅。"
        },
        {
          "icon": "🏛",
          "title": "原图是审阅起点",
          "desc": "先辨认可见信息，再检查模型解释是否跨越了证据能够支持的范围。"
        },
        {
          "icon": "⚖",
          "title": "不外推整体可靠性",
          "desc": "幽默解释、事故推断和安全建议都需要额外验证，不能由单个案例证明。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "研究边界：还没有看懂所有视频",
      "badge": "both",
      "badgeLabel": "边界 · 未来方向",
      "bridge": "把案例里的证据缺口整理为下一步研究问题：更长的视频、更好的表示、更可靠的训练与评价。",
      "analogy": {
        "title": "放映室手记 · 10",
        "text": "一只卷盘转动，展开更长的胶片。材料变长以后，保存线索、寻找联系与及时回答都变得更困难。",
        "componentId": "vc-analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "长视频压力实验",
          "desc": "用胶片长度表达时间跨度，了解上下文、响应效率与显存的定性取舍。",
          "componentId": "vc-10-a"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "你来设计下一代 VideoChat",
          "desc": "选择优先研究方向，检查收益、局限和评价方法，再沿知识地图复习整条路线。",
          "componentId": "vc-10-b"
        }
      ],
      "insight": "聊天统一了提问方式，可靠的视频理解仍需表示、数据、推理、资源和评价共同进步。",
      "takeaways": [
        {
          "icon": "🎞",
          "title": "长视频仍是难题",
          "desc": "论文强调约一分钟及以上的困难范围；这不是 60 秒突然失效的硬阈值。"
        },
        {
          "icon": "🧪",
          "title": "研究方向需要验证",
          "desc": "更强基础模型、更多指令数据与推理评测、长视频处理各自解决不同缺口。"
        },
        {
          "icon": "💬",
          "title": "回到聊天中心思想",
          "desc": "用文字或可学习接口连接视频表示与 LLM，依托历史以自然语言统一视频任务。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1dXYTesEMj",
      "title": "来和AI视频对话吧！InternVideo2 开源视频理解大模型",
      "reason": "OpenGVLab 作者团队的后续演示，作为研究延伸；不是本篇原始实验。",
      "views": "1906播放（检索快照）"
    }
  ]
};
