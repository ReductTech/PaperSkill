import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "MiniMind-O",
    "titleZh": "小规模模型，怎样听、看、说？",
    "venue": "Jingyao Gong · arXiv 2026 · v1",
    "authors": "Jingyao Gong",
    "affiliation": "Independent Researcher",
    "domain": "语音与多模态",
    "coreProblem": "如何在小规模主模型中建立可检查的语音原生全模态交互？",
    "coreInsight": "理解由 <b>Thinker</b> 完成，语音码由 <b>Talker</b> 生成。用 10 个可操作章节，拆解两者之间的连接与证据。<br/><a href=\"https://arxiv.org/abs/2605.03937v1\" target=\"_blank\" rel=\"noreferrer\">论文原文</a> · <a href=\"https://github.com/jingyaogong/minimind-o\" target=\"_blank\" rel=\"noreferrer\">作者代码</a> · <a href=\"https://modelscope.cn/studios/gongjy/MiniMind-O\" target=\"_blank\" rel=\"noreferrer\">官方模型演示</a>",
    "keywords": [
      "三种输入",
      "文本与流式语音",
      "机制演示",
      "有基础的初学者"
    ]
  },
  "hero": {
    "oldMethod": {
      "componentId": "hero-old",
      "desc": "常见级联方案：语音先转成文字，语言模型回答，再由独立 TTS 合成语音。图为配音类比。"
    },
    "newMethod": {
      "componentId": "hero-new",
      "desc": "本文让 Talker 读取 Thinker 的中间隐状态与音频码历史，生成可逐帧解码的声音。图示不代表速度实测。"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "一个小模型，怎样听、看、说？",
      "badge": "inf",
      "badgeLabel": "任务与推理",
      "bridge": "先确定模型接收什么、产生什么，再进入内部。MiniMind-O 研究的是可检查的小规模全模态系统。",
      "analogy": {
        "title": "阅读图示时关注什么",
        "text": "文字 / 语音 / 图片。共同输出：文字与语音。在下方操作后，留意哪些信息发生了变化。",
        "componentId": "analogy-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "换一种输入，输出任务会怎样？",
          "desc": "用“下雨出门要带什么”比较三种输入，查看编码、理解与输出的变化。例句为教学示例。依据：论文 p1 摘要、p2 图 1。",
          "componentId": "c1-main"
        }
      ],
      "insight": "语音原生路径不要求先把声音完全转成文字；任务范围与通用能力强弱需要分开理解。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "任务边界",
          "desc": "接收文字、语音和图片，生成文字与流式语音。"
        },
        {
          "icon": "🔀",
          "title": "输入路径不同",
          "desc": "声音和图片需要特征提取，文字则通过词嵌入进入模型。"
        },
        {
          "icon": "🔎",
          "title": "研究价值与限制",
          "desc": "小规模实现便于学习与检查，不保证大型全模态模型的能力。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "把声音和图片放进同一条序列",
      "badge": "both",
      "badgeLabel": "表示与训练",
      "bridge": "输入类型已经清楚，但语言模型怎样读懂非文字特征？试着把特征接到序列中，检查编码、投影和位置之间的关系。",
      "analogy": {
        "title": "阅读图示时关注什么",
        "text": "位置数 × 特征维度。64 个图像位置，每个 768 维。在下方操作后，留意哪些信息发生了变化。",
        "componentId": "analogy-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "特征在哪一步进入 Thinker？",
          "desc": "先投影，再拖放特征到统一序列；尝试错误位置，检查维度与表示类型。图片可逐位置查看映射。依据：论文 p5 §3、p13 表 6。",
          "componentId": "c2-main"
        }
      ],
      "insight": "冻结编码器负责提取特征，可训练投影器将其接入 768 维隐空间；统一接口不等于消除模态差异。",
      "takeaways": [
        {
          "icon": "🎧",
          "title": "先提特征",
          "desc": "语音由 SenseVoice-Small 编码，图像由 SigLIP2 编码；两者保持冻结。"
        },
        {
          "icon": "↔️",
          "title": "再做映射",
          "desc": "语音的 512 维特征投影到 768 维；图像对应 64 个序列位置。"
        },
        {
          "icon": "📐",
          "title": "形状有条件",
          "desc": "64 个图像位置对应论文的 256×256 设置，文本与语音长度不能套用固定数量。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "Thinker 想内容，Talker 生成语音码",
      "badge": "inf",
      "badgeLabel": "双路径推理",
      "bridge": "统一输入之后，系统还要同时组织回答和生成声音。沿着一次示意回答查看两个模块的分工。",
      "analogy": {
        "title": "阅读图示时关注什么",
        "text": "文字输出 ≠ 中间隐状态。Talker 还依赖自己的音频历史。在下方操作后，留意哪些信息发生了变化。",
        "componentId": "analogy-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "Talker 从哪里获得回答的意思？",
          "desc": "在图面或进度条上滚动，连续展开两条出口；点击模块固定查看解释。讲解进度不代表真实计算耗时。依据：论文 p5 §3.1。",
          "componentId": "c3-main"
        }
      ],
      "insight": "连接 Talker 的是 Thinker 中间隐状态；系统并非把最终文字交给一个独立 TTS 就结束。",
      "takeaways": [
        {
          "icon": "💬",
          "title": "Thinker 组织内容",
          "desc": "默认 8 层、768 维的 Thinker 负责理解输入与生成文字。"
        },
        {
          "icon": "🔗",
          "title": "Talker 接收隐状态",
          "desc": "独立 4 层 Talker 结合桥接语义和自身音频码历史预测声音表示。"
        },
        {
          "icon": "🔈",
          "title": "解码与规模边界",
          "desc": "Mimi 将完整音频帧转成波形；外部编解码器不应混入主模型参数口径。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "为什么从中间层连接？",
      "badge": "both",
      "badgeLabel": "训练与推理",
      "bridge": "上下文积累与文本分类偏向之间的折中。",
      "analogy": {
        "title": "阅读图示时关注什么",
        "componentId": "analogy-4",
        "text": "读取哪一层的状态？。默认零基层 3，即第 4 层之后。在下方操作后，留意哪些信息发生了变化。"
      },
      "modules": [
        {
          "desc": "拖动橙色桥接点，联动查看已经过的层与剩余层；也可点击层编号。依据：论文 p5 §3.1，默认零基位置为 3。",
          "id": "4.1",
          "componentId": "c4-main",
          "title": "为什么从中间层连接？",
          "kind": "module"
        }
      ],
      "insight": "上下文积累与文本分类偏向之间的折中。",
      "takeaways": [
        {
          "desc": "浅层仍在积累上下文，末层偏向文字分类。",
          "title": "理解语境",
          "icon": "🔎"
        },
        {
          "desc": "8 层 Thinker 默认在零基第 3 号层后提取桥接状态。",
          "title": "默认连接",
          "icon": "🔗"
        },
        {
          "desc": "论文没有给出逐层 CER 数值表；图示是定性解释。",
          "title": "不编造分数",
          "icon": "📌"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "声音不是一串文字：八层码本",
      "badge": "both",
      "badgeLabel": "训练与推理",
      "bridge": "每个音频帧由8个离散码共同表达。",
      "analogy": {
        "title": "阅读图示时关注什么",
        "componentId": "analogy-5",
        "text": "8 层码本共同组成。码本层与时间帧不是一回事。在下方操作后，留意哪些信息发生了变化。"
      },
      "modules": [
        {
          "desc": "悬停预览、点击固定一帧；移除一层码再尝试解码，检查八码完整性。码值为教学示意。依据：论文 p4 图 3、p13 表 6。",
          "id": "5.1",
          "componentId": "c5-main",
          "title": "声音不是一串文字：八层码本",
          "kind": "module"
        }
      ],
      "insight": "每个音频帧由8个离散码共同表达。",
      "takeaways": [
        {
          "desc": "每个音频帧由 8 层码本索引共同表达。",
          "title": "离散音频表示",
          "icon": "🔎"
        },
        {
          "desc": "同一帧的八个码共同送入 Mimi，解码得到波形。",
          "title": "完整帧解码",
          "icon": "🔗"
        },
        {
          "desc": "12.5 Hz 意味每帧覆盖 80 ms 音频，不代表首包延迟。",
          "title": "时间口径",
          "icon": "📌"
        }
      ],
      "formula": {
        "symbols": [
          {
            "sym": "a",
            "desc": "离散码矩阵，每个元素是码本索引"
          },
          {
            "sym": "8",
            "desc": "码本层数"
          },
          {
            "sym": "T",
            "desc": "音频帧数，不是文本 token 数"
          }
        ],
        "unicode": "a ∈ ℕ^(8×T)",
        "lead": "把全部离散音频码写成一个矩阵，每列是一帧。"
      }
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "还没说完，为什么已经能播放？",
      "badge": "both",
      "badgeLabel": "训练与推理",
      "bridge": "延迟排列后逐帧解码。",
      "analogy": {
        "title": "阅读图示时关注什么",
        "componentId": "analogy-6",
        "text": "八个位置，同一帧。第 8 步才凑齐第一帧。在下方操作后，留意哪些信息发生了变化。"
      },
      "modules": [
        {
          "desc": "滚动或拖动同一个时间游标，同时查看延迟矩阵、八码汇合与可释放帧数。动画连续，完成计数按整步变化。依据：论文 p6 §4。",
          "id": "6.1",
          "componentId": "c6-main",
          "title": "还没说完，为什么已经能播放？",
          "kind": "module"
        }
      ],
      "insight": "延迟排列后逐帧解码。",
      "takeaways": [
        {
          "desc": "第一个文字生成步没有音频，第 q 层码本从相对步 q+1 开始。",
          "title": "错开码本",
          "icon": "🔎"
        },
        {
          "desc": "第一帧在图示第 8 步完整；完整帧可增量解码。",
          "title": "逐帧可用",
          "icon": "🔗"
        },
        {
          "desc": "两种播放策略共享生成顺序，图示步骤不对应实测毫秒。",
          "title": "机制而非测速",
          "icon": "📌"
        }
      ],
      "formula": {
        "symbols": [
          {
            "sym": "q",
            "desc": "码本零基编号 0…7"
          },
          {
            "sym": "assistant_start",
            "desc": "第一个助手文字生成位置"
          },
          {
            "sym": "start(q)",
            "desc": "该码本首个音频码出现的位置，不是时钟时间"
          }
        ],
        "unicode": "start(q) = assistant_start + q + 1",
        "lead": "零基码本 q 的音频流相对第一个文字步再延后 q+1 步开始。"
      }
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "同一句话，音色条件放在哪里？",
      "badge": "both",
      "badgeLabel": "训练与推理",
      "bridge": "音色向量与右对齐参考码是条件，非重建目标。",
      "analogy": {
        "title": "阅读图示时关注什么",
        "componentId": "analogy-7",
        "text": "参考条件 / 生成目标。条件区不计算目标音频损失。在下方操作后，留意哪些信息发生了变化。"
      },
      "modules": [
        {
          "desc": "切换参考条件，用画笔点选或刷选损失掩码，观察计分位置和人工损失总和如何变化。依据：论文 p5 §3、p6 §4。",
          "id": "7.1",
          "componentId": "c7-main",
          "title": "同一句话，音色条件放在哪里？",
          "kind": "module"
        }
      ],
      "insight": "音色向量与右对齐参考码是条件，非重建目标。",
      "takeaways": [
        {
          "desc": "参考码右对齐，用于引导音色，不作为重建目标。",
          "title": "参考是条件",
          "icon": "🔎"
        },
        {
          "desc": "CAM++ 预计算 192 维说话人条件；forward 不现场提取。",
          "title": "预计算向量",
          "icon": "🔗"
        },
        {
          "desc": "切换的是示意条件，不改变模型权重，也不合成声音。",
          "title": "不要误读演示",
          "icon": "📌"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "八套接口，怎样避免八份大参数？",
      "badge": "both",
      "badgeLabel": "结构与训练",
      "bridge": "认识八层码本后，还需要解决接口参数重复的问题。先比较结构，再读同协议下的秩消融。",
      "analogy": {
        "title": "阅读图示时关注什么",
        "text": "嵌入端 E / 输出头 H。选择真实实验配置比较 loss。在下方操作后，留意哪些信息发生了变化。",
        "componentId": "analogy-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "共享主体，保留每层差异",
          "desc": "先操作小矩阵，查看方向、重建与存储成本，再比较论文四组 E/H 秩配置。教学重建误差与真实 audio loss 分开呈现。依据：论文图 8(f)。",
          "componentId": "c8-main"
        }
      ],
      "insight": "共享基表与输出头保留通用能力，码本专属低秩适配器表达差异；本组消融显示输出头秩更敏感。",
      "takeaways": [
        {
          "icon": "🧩",
          "title": "避免重复",
          "desc": "八层码本需要各自接口，但不必复制八份完整大矩阵。"
        },
        {
          "icon": "🔧",
          "title": "共享与适配",
          "desc": "共享主体配合码本专属低秩适配器；E 与 H 分别控制嵌入和输出头的秩。"
        },
        {
          "icon": "📏",
          "title": "限定结论",
          "desc": "图 8 的音频 loss 是冻结 Thinker、A2A 子集上的结果，不是 CER 或任意任务的最优秩。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "训练时，哪些模块会变化？",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "结构搭好后，训练既要决定用什么数据，也要决定更新哪些参数。这是两个不同维度。",
      "analogy": {
        "title": "阅读图示时关注什么",
        "text": "学什么 / 更新谁。训练任务与训练模式分别选择。在下方操作后，留意哪些信息发生了变化。",
        "componentId": "analogy-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "任务 × 参数范围",
          "desc": "切换训练任务与更新范围，在固定工作区追踪前向、损失、导数和参数更新；比较同一初值下冻结与更新的区别。依据：论文 p6 §5，数值计算为教学例子。",
          "componentId": "c9-main"
        }
      ],
      "formula": {
        "lead": "有目标语音时，联合目标包含文本损失与各层音频损失；条件和无效位置由掩码排除。",
        "unicode": "L = Ltext + λaudio Σ(q=1…8) Laudio(q)",
        "symbols": [
          {
            "sym": "Ltext",
            "desc": "目标文字的预测损失"
          },
          {
            "sym": "Laudio(q)",
            "desc": "第 q 个码本目标位置的损失；此公式 q 从 1 开始"
          },
          {
            "sym": "λaudio",
            "desc": "音频损失权重；不为原文公式虚构固定数值"
          }
        ]
      },
      "insight": "任务决定监督内容，模式决定参数更新范围；不更新参数的模块仍可能参与计算。",
      "takeaways": [
        {
          "icon": "📚",
          "title": "数据任务",
          "desc": "T2A、I2T、A2A 描述文字、图片和语音的输入与目标组合。"
        },
        {
          "icon": "🔒",
          "title": "参数范围",
          "desc": "all 或投影器模式选择可训练范围，SenseVoice、SigLIP2 与 Mimi 保持冻结。"
        },
        {
          "icon": "🎯",
          "title": "监督边界",
          "desc": "条件区域不是音频重建目标；任务选择不是唯一固定训练顺序，完整数据规模也不等于 mini 子集。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果好在哪里，边界又在哪里？",
      "badge": "both",
      "badgeLabel": "实验与边界",
      "bridge": "最后用真实数据检验设计。先在同一协议里比较，再问每项指标能支持什么结论。",
      "analogy": {
        "title": "阅读图示时关注什么",
        "text": "比较对象与指标定义。CER 不是音质评分。在下方操作后，留意哪些信息发生了变化。",
        "componentId": "analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "Talker 宽度与内容一致性",
          "desc": "点击真实实验条形查看对应证据与指标口径；编辑转录并检查字符对齐，理解 CER 的含义和局限。依据：论文 p8 表 2、p9 表 3–5。",
          "componentId": "c10-main"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "先看协议，再读数字",
          "desc": "切换英文 T2A、音色和视觉三种独立评估。来源：PDF 第 9 页表 3、4、5。它们不组成统一排行榜。",
          "componentId": "c10-metrics"
        }
      ],
      "insight": "低 CER 说明特定协议下转录与目标更一致；自然度、说话人相似度和视觉理解需要分别判断。",
      "takeaways": [
        {
          "icon": "📊",
          "title": "同条件比较",
          "desc": "表 2 中 Dense 与 MoE 都在所测 768 宽度获得最低平均 CER，不保证所有场景最优。"
        },
        {
          "icon": "🔎",
          "title": "指标有对象",
          "desc": "CER/WER 检查转录误差，CAM++ 相似度检查音色条件；这些不是主观音质评分。"
        },
        {
          "icon": "🚧",
          "title": "保留局限",
          "desc": "论文仍有自然度、长句稳定性及有限评估等限制；约 0.1B 也不包含所有冻结外部组件。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1V1RsBcEMX",
      "title": "MiniMind-O 作者项目介绍",
      "reason": "作者官方 README 提供的直接相关视频，作为机制学习的补充；播放状态以站点为准。"
    }
  ]
};
