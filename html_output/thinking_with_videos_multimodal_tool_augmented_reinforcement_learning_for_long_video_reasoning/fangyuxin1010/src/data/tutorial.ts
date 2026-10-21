import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Thinking With Videos: Multimodal Tool-Augmented Reinforcement Learning for Long Video Reasoning",
    "titleZh": "边看边想：让长视频推理学会回看",
    "venue": "arXiv 2508.04416v2 · 2025",
    "authors": "Haoji Zhang、Xin Gu、Jiawen Li 等",
    "affiliation": "清华大学深圳国际研究生院 · 中国科学院大学 · 字节跳动",
    "domain": "长视频理解 · 多模态推理 · 强化学习",
    "coreProblem": "关键片段没看清，再长的文字推理也可能沿着错误线索走下去。",
    "coreInsight": "VITAL 在推理中按需裁剪视频、补充视觉证据，并用多任务数据与 DGRPO 学习何时回看。",
    "keywords": [
      "VITAL",
      "多模态思维链",
      "视频裁剪",
      "MTVR",
      "DGRPO"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "只凭最初稀疏帧继续推理，可能漏掉关键瞬间。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "带着问题回看片段，将新视觉证据纳入判断。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "推理再长，也补不回没看见的画面",
      "badge": "inf",
      "badgeLabel": "理解与推理",
      "bridge": "先辨认问题：长视频中，关键动作可能落在稀疏帧之间。文字推理能组织已有线索，却不能凭空补回缺失的视觉证据。",
      "analogy": {
        "title": "回看录像，别只凭印象",
        "text": "像回看生活录像时寻找“钥匙何时被放下”：快速浏览会漏掉短暂动作。这里的桌面、钥匙和时间均为教学示意。",
        "componentId": "analogy1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "同一段录像，两种观察方式",
          "desc": "按下比较按钮，观察同一教学片段：固定稀疏观察与按需回看。画面展示证据覆盖，不模拟真实模型准确率。",
          "componentId": "compare"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "先说清楚，要回答哪一类问题",
          "desc": "同一事件可以用于三种任务。切换问题，观察输出中需要“答案”“时间区间”还是两者。依据：§3.2。",
          "componentId": "tasks"
        }
      ],
      "takeaways": [
        {
          "icon": "◆",
          "title": "证据先于长推理",
          "desc": "更多文字不等于更多视觉信息。"
        },
        {
          "icon": "◆",
          "title": "工具可以补看",
          "desc": "VITAL 在推理途中返回原视频采样新帧。"
        },
        {
          "icon": "◆",
          "title": "教学边界",
          "desc": "页面交互是机制演示，不运行 VITAL，也不预测模型正确率。"
        }
      ],
      "insight": "VITAL 的核心变化，是让推理过程能够再次接触视频证据。"
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "把有限的观察机会放到关键片段",
      "badge": "inf",
      "badgeLabel": "理解与推理",
      "bridge": "知道要找什么之后，要决定在哪里补看。视频裁剪工具接收起止时间，返回该区间更密集的画面；它不是放大单张图片。",
      "analogy": {
        "title": "拖动播放头，靠近关键瞬间",
        "text": "在同一段录像上移动选区，相当于把注意力从整段概览移向一个局部。播放器仍指向原始录像。",
        "componentId": "analogy2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "移动回看窗口",
          "desc": "拖动橙色窗口，或用左右按钮调整。窗口固定为24秒，事件设为52–58秒；采样点和命中提示均是教学演示。依据：§3.1 式(2)。",
          "componentId": "window"
        }
      ],
      "takeaways": [
        {
          "icon": "◆",
          "title": "局部重采样",
          "desc": "工具返回视频帧，而不是只返回一段文字摘要。"
        },
        {
          "icon": "◆",
          "title": "上下文仍保留",
          "desc": "新证据被加入已有推理历史。"
        },
        {
          "icon": "◆",
          "title": "采样有上限",
          "desc": "训练工具返回最多64帧、每帧像素上限224×224；不是无限清晰度。"
        }
      ],
      "formula": {
        "lead": "裁剪工具从原视频中提取指定时间范围的新视觉证据。",
        "unicode": "Vₖ₊₁ = g_clip(V₀, t_start, t_end)",
        "symbols": [
          {
            "sym": "V₀",
            "desc": "原始输入视频，不是上一轮的文本回答。"
          },
          {
            "sym": "Vₖ₊₁",
            "desc": "下一轮可用的视频片段或视觉 token 序列。"
          },
          {
            "sym": "t_start",
            "desc": "区间起点，单位秒；教学界面限制在合法视频范围内。"
          },
          {
            "sym": "t_end",
            "desc": "区间终点，必须晚于起点。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "让新画面进入推理历史",
      "badge": "inf",
      "badgeLabel": "理解与推理",
      "bridge": "选到了片段，还要让新证据改变判断。多模态思维链在文字、工具请求和返回画面之间交替，而不只是把同一段文字反复改写。",
      "analogy": {
        "title": "看清一格，再修正记忆",
        "text": "用放大镜检查录像中的一个瞬间：新的细节能纠正最初印象。放大镜只是类比，真实工具是在时间维度重采样。",
        "componentId": "analogy3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "逐步展开一次证据更新",
          "desc": "逐步查看一条教学轨迹：粗看、请求片段、接收新帧、修正回答。轨迹台词为教学编写，不是论文中的模型原始输出。",
          "componentId": "history"
        }
      ],
      "takeaways": [
        {
          "icon": "◆",
          "title": "交替积累",
          "desc": "文字推理、工具调用和视觉结果共同组成历史。"
        },
        {
          "icon": "◆",
          "title": "依据可追溯",
          "desc": "“再看一眼”必须对应真实的返回帧。"
        },
        {
          "icon": "◆",
          "title": "不是必须调用",
          "desc": "模型也可以在证据足够时直接输出答案。"
        }
      ],
      "formula": {
        "lead": "每一轮模型读取截至当前轮的多模态历史，再生成下一段输出。",
        "unicode": "Oₖ = f_MLLM({Tᵢ, Cᵢ, Vᵢ}ᵢ₌₀…ₖ)",
        "symbols": [
          {
            "sym": "Oₖ",
            "desc": "第k轮模型生成的输出序列。"
          },
          {
            "sym": "Tᵢ",
            "desc": "问题或该轮文字推理。"
          },
          {
            "sym": "Cᵢ",
            "desc": "工具调用请求；初始C₀为空。"
          },
          {
            "sym": "Vᵢ",
            "desc": "初始视频或某次工具返回的视频。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "“找对片段”如何变成可计算的分数",
      "badge": "both",
      "badgeLabel": "方法与判断",
      "bridge": "工具要找时间范围，训练也需要评价预测区间。交并比同时惩罚漏掉事件和把大量无关时间算进去。",
      "analogy": {
        "title": "用尺子比对两个时间段",
        "text": "在录像纸条上移动一把尺子：预测区间与参考区间越吻合，重叠部分相对并集就越大。",
        "componentId": "analogy4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "移动预测区间，观察 IoU",
          "desc": "参考区间固定为50–70秒；拖动长度20秒的预测区间，观察交集、并集和 IoU 同步变化。此处为公式演算示例。",
          "componentId": "iou"
        }
      ],
      "takeaways": [
        {
          "icon": "◆",
          "title": "不是只看重叠长度",
          "desc": "IoU 的分母是并集长度，单位秒会约掉。"
        },
        {
          "icon": "◆",
          "title": "指标不能混用",
          "desc": "R@0.5 是达到阈值的样本比例；mIoU 是平均 IoU。"
        },
        {
          "icon": "◆",
          "title": "范围合法",
          "desc": "零交集得0，完全重合得1；预测时间段必须有正长度。"
        }
      ],
      "formula": {
        "lead": "交并比用共同覆盖的时长除以至少一方覆盖的总时长。",
        "unicode": "IoU = |P ∩ G| / |P ∪ G|",
        "symbols": [
          {
            "sym": "P",
            "desc": "预测时间区间；这里固定长度20秒。"
          },
          {
            "sym": "G",
            "desc": "参考时间区间；这里为[50,70]秒。"
          },
          {
            "sym": "IoU",
            "desc": "无量纲标量，范围[0,1]；越大越好。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "有工具，不等于会用工具",
      "badge": "both",
      "badgeLabel": "方法与判断",
      "bridge": "裁剪能返回更直接的证据，但把工具挂到模型旁边就一定更好吗？论文先比较三种工具，再通过专门训练教模型使用它们。",
      "analogy": {
        "title": "选遥控器按钮，也要懂何时按",
        "text": "同一个遥控器上，“读字幕”“提问”和“回看画面”得到的是不同信息。按钮更多，本身不会让观看者更会判断。",
        "componentId": "analogy5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "比较零样本工具实验",
          "desc": "选择工具，查看 GPT-4.1 在 VidChapters-7M 的3k子集上报告的 mIoU。这个实验不是 VITAL 的最终成绩。依据：表6。",
          "componentId": "tools"
        }
      ],
      "takeaways": [
        {
          "icon": "◆",
          "title": "回传内容不同",
          "desc": "Caption 和 QA 返回文字；Video clip 返回视觉内容。"
        },
        {
          "icon": "◆",
          "title": "结果并非单向提升",
          "desc": "该零样本实验中，所有工具模式都低于无工具的 Think 基线。"
        },
        {
          "icon": "◆",
          "title": "训练是关键条件",
          "desc": "作者据此选择视频裁剪，并用四阶段训练学习工具调用。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "一次调用何时继续，何时结束",
      "badge": "inf",
      "badgeLabel": "理解与推理",
      "bridge": "新证据需要被可靠地取回。VITAL 解析模型输出、执行工具并接收结果；解析或执行失败会返回错误信息，直接答案则终止循环。",
      "analogy": {
        "title": "松开播放键，停在足够的证据上",
        "text": "回看录像不是无限快进。遥控器可以继续播放，也可以在已经看清之后停下；停止条件与工具结果一样重要。",
        "componentId": "analogy6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "切换一轮执行的分支",
          "desc": "选择直接回答、合法裁剪或参数错误，观察对应路径与输出。错误文本和示例参数为教学示意。论文评测最多允许2轮工具调用。",
          "componentId": "runtime"
        }
      ],
      "takeaways": [
        {
          "icon": "◆",
          "title": "模型选择动作",
          "desc": "工具不是固定每轮必走的一步。"
        },
        {
          "icon": "◆",
          "title": "错误也进入交互",
          "desc": "解析错误或工具执行错误需要以错误信息返回。"
        },
        {
          "icon": "◆",
          "title": "上限不是固定次数",
          "desc": "max_num_turns=2 是评测限制，不表示每个问题都调用两次。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "先学会推理，再练习带工具推理",
      "badge": "trn",
      "badgeLabel": "训练机制",
      "bridge": "推理时能做的动作，来自训练。VITAL 先在无工具条件下训练，再用工具轨迹冷启动，最后进行带工具强化学习。",
      "analogy": {
        "title": "练习回看，先有示范再自己判断",
        "text": "在同一个录像练习本上盖下一枚印章：一个训练阶段完成一种准备。印章表示阶段，不表示模型能力必然线性增长。",
        "componentId": "analogy7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "四阶段训练，分别用了什么",
          "desc": "逐步查看 SFT → DGRPO → 工具 SFT → 工具 DGRPO。图中数据量来自论文§3.2和表10，单位是样本，不是独立视频数。",
          "componentId": "training"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "筛掉没有区分度的练习题",
          "desc": "选择8次 rollout 的奖励样例，查看极差是否大于0.05。即使平均奖励不是0或1，极差太小仍会被过滤。依据：附录C.2。",
          "componentId": "filter"
        }
      ],
      "takeaways": [
        {
          "icon": "◆",
          "title": "两类冷启动",
          "desc": "第1阶段学习基本推理，第3阶段学习工具轨迹。"
        },
        {
          "icon": "◆",
          "title": "三类任务协同",
          "desc": "时间定位、推理问答和带定位问答共同构成 MTVR。"
        },
        {
          "icon": "◆",
          "title": "标注与推理分开",
          "desc": "构造部分定位训练轨迹时可用真值扰动建议；真实推理时没有真值提示。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "模型与工具如何接起来",
      "badge": "trn",
      "badgeLabel": "训练机制",
      "bridge": "现在把前面学到的动作放回系统。VITAL 基于 Qwen2.5-VL-7B，在视觉编码器、投影器和语言模型之外，连接解析器与视频工具。",
      "analogy": {
        "title": "转动遥控器，看懂它控制什么",
        "text": "翻看遥控器的不同部位，理解每个部位的职责。真实模型结构放在下面的交互图中，类比不替代网络细节。",
        "componentId": "analogy8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点击组件，追踪信息去向",
          "desc": "选择图中的节点或下方按钮，观察活动路径、输入输出与职责。网络结构依据§3.1、§4.1和图3；未给出的张量维度不做推测。",
          "componentId": "architecture"
        }
      ],
      "takeaways": [
        {
          "icon": "◆",
          "title": "视觉主干被复用",
          "desc": "视觉编码器与 merger projector 将帧连接到语言模型。"
        },
        {
          "icon": "◆",
          "title": "工具扩展可观察信息",
          "desc": "裁剪回传的视觉内容再次进入多模态上下文。"
        },
        {
          "icon": "◆",
          "title": "端到端的边界",
          "desc": "训练面向代理推理流程，并不意味着裁剪操作可微，或视觉编码器也更新。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "DGRPO：区分任务难度与样本难度",
      "badge": "trn",
      "badgeLabel": "训练机制",
      "bridge": "不同任务的奖励增长速度不一样，同一任务里的题目也有难易。DGRPO 先调整定位奖励的尺度，再根据同题多次尝试的平均奖励，软性降低容易样本的权重。",
      "analogy": {
        "title": "给录像练习打分，要校准尺子",
        "text": "同一本练习册上移动评分标尺：难题与简单题不能机械地套同一刻度。这个类比只解释奖励变换，不把奖励权重当作最终梯度倍数。",
        "componentId": "analogy9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "相同 IoU，任务尺度不同",
          "desc": "调节 IoU，比较短视频定位与长视频 VidCh 定位的分段线性映射。依据算法1、附录A.2与表9。",
          "componentId": "task-reward"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "平均奖励越高，软性折扣越大",
          "desc": "调节同题8次 rollout 的平均预权重奖励 D，观察权重 w 与最终奖励 wD。这里用8次奖励相等的教学情形展示乘法，不推导最终策略梯度。",
          "componentId": "sample-reward"
        }
      ],
      "takeaways": [
        {
          "icon": "◆",
          "title": "先做任务尺度变换",
          "desc": "短定位α=0.2、β=0.8；长VidCh定位α=0、β=0.5。带定位问答先变换IoU再与答案分数平均。"
        },
        {
          "icon": "◆",
          "title": "再做样本软折扣",
          "desc": "D越高表示平均奖励越高、通常更容易；w始终在0.5到1之间。"
        },
        {
          "icon": "◆",
          "title": "奖励不是调用计数",
          "desc": "工具阶段格式与成功调用奖励各最多0.5，多次调用不会逐次累加工具奖励。"
        }
      ],
      "formula": {
        "lead": "先把 IoU 变成任务分数，再对总奖励施加有下限的样本权重。",
        "unicode": "S = clamp((IoU − α) / (β − α), 0, 1)<br/>D = mean(R̂₁…R̂₈), w = 0.5 + 0.5 × clamp(2 − D, 0, 1), R = wR̂",
        "symbols": [
          {
            "sym": "α",
            "desc": "任务映射的下界；无量纲超参数。"
          },
          {
            "sym": "β",
            "desc": "任务映射的上界；这里不是GRPO目标中的KL系数。"
          },
          {
            "sym": "R̂",
            "desc": "准确性经相应变换后，加格式与工具奖励；范围[0,2]。"
          },
          {
            "sym": "D",
            "desc": "同一样本8次rollout的平均预权重奖励；不是错误率。"
          },
          {
            "sym": "w",
            "desc": "样本权重，范围[0.5,1]；不能直接等同于最终梯度的缩放倍数。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、消融与不能跨越的边界",
      "badge": "both",
      "badgeLabel": "方法与判断",
      "bridge": "最后回到实测证据：既看长视频收益，也看没有胜出的指标、额外训练与计算开销，以及音频和空间任务的局限。",
      "analogy": {
        "title": "把录像练习的成绩放在同一把尺上",
        "text": "成绩要在相同项目、相同量纲下比较。切换基准后，分数含义也随之改变；不同指标不合并成一个虚构总分。",
        "componentId": "analogy10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "在同一指标上比较",
          "desc": "先选择指标，再启动对比。表格保留精确数值；条形统一从0到100。来源：论文表2–4与附录B.2，全部越高越好。",
          "componentId": "results"
        }
      ],
      "takeaways": [
        {
          "icon": "◆",
          "title": "提升有明确场景",
          "desc": "LVR准确率79.3%，比无工具VITAL高9.1个百分点；不能写成相对提升9.1%。"
        },
        {
          "icon": "◆",
          "title": "工具与训练共同作用",
          "desc": "表13更高像素无工具基线LVR为73.7%，仍低于79.3%；这不是完全等计算量的比较。"
        },
        {
          "icon": "◆",
          "title": "能力仍有局限",
          "desc": "论文主要使用视觉，忽略音频；空间定位支持有限，多轮推理也增加计算成本。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1wFNCehERn",
      "title": "GRPO 基础：图解原理与实现",
      "reason": "补充 GRPO 基础；不是 VITAL 或 DGRPO 的论文专讲。"
    },
    {
      "bvid": "BV1M9NyeVEUp",
      "title": "GRPO 背景：从强化学习到策略优化",
      "reason": "帮助理解策略优化背景；VITAL 的具体设计以论文为准。"
    }
  ]
};
