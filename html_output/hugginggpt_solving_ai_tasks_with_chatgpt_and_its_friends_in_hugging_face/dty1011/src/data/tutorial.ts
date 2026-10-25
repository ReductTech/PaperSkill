import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "HuggingGPT: Solving AI Tasks with ChatGPT and its Friends in Hugging Face",
    "titleZh": "HuggingGPT：用 ChatGPT 与 Hugging Face 伙伴解决 AI 任务",
    "venue": "NeurIPS 2023",
    "authors": "Yongliang Shen, Kaitao Song, Xu Tan, Dongsheng Li, Weiming Lu, Yueting Zhuang",
    "affiliation": "Zhejiang University; Microsoft Research Asia",
    "domain": "多模态大模型智能体 / 工具调用 / 视觉与跨模态应用",
    "coreProblem": "单个 LLM 主要处理文本，难以自主完成需要视觉、语音、生成和多模型协作的复杂任务。",
    "coreInsight": "论文的关键想法是把<b>语言当作通用接口</b>：让 LLM 做控制器，读取任务与模型描述，规划、选模、执行并汇总多模态专家模型的结果。",
    "keywords": [
      "LLM Agent",
      "Multimodal",
      "Tool Orchestration",
      "Vision Applications",
      "Hugging Face"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "传统单模型或纯文本 LLM 像一台只会看文字的相机：遇到图像、语音、视频或组合任务时，需要人工拆分、人工选工具。",
      "componentId": "hugginggpt-lab"
    },
    "newMethod": {
      "desc": "HuggingGPT 把 LLM 放在控制器位置：先规划任务，再按模型描述选专家，执行后把多模态结果组织成回答。",
      "componentId": "hugginggpt-lab"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "为什么纯文本大模型不够用",
      "badge": "inf",
      "badgeLabel": "问题入口",
      "bridge": "从一个“描述图片并数物体”的请求开始：用户要的是视觉理解、检测和自然语言汇总，但纯文本 LLM 本身没有这些专家能力。本节先让你看见旧方法的断点，再引出 HuggingGPT 的控制器视角。",
      "analogy": {
        "title": "取景框只剩文字",
        "text": "像一台相机只看得到纸条，遇到真实场景就会错过<b>图像与动作</b>。HuggingGPT 的问题意识是：让相机能叫来镜头、测光表和冲印工具。",
        "componentId": "hugginggpt-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "复杂请求会压垮单一能力",
          "desc": "调高请求复杂度，观察一个纯文本控制器如何从“能回答”变成“需要外部专家”。",
          "componentId": "hugginggpt-lab"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "四阶段闭环修复断点",
          "desc": "用同一个请求比较旧流程和 HuggingGPT：差异不在某个专家模型，而在是否有可追踪的规划、选模、执行和汇总闭环。",
          "componentId": "hugginggpt-lab"
        }
      ],
      "insight": "如果任务横跨视觉、语言和语音，关键能力不是“再训练一个全能模型”，而是让 LLM 学会组织已有专家。",
      "formula": {
        "lead": "本章只需要一个任务分解视角：复杂请求被拆成可执行子任务集合。",
        "unicode": "<span class=\"fe-formula-sym\">R</span> → {<span class=\"fe-formula-sym\">tᵢ</span>} + <span class=\"fe-formula-sym\">D</span>",
        "symbols": [
          {
            "sym": "R",
            "desc": "用户的自然语言请求，可以包含图像、音频、视频等资源。"
          },
          {
            "sym": "tᵢ",
            "desc": "第 i 个可执行子任务，例如 image-captioning 或 object-detection。"
          },
          {
            "sym": "D",
            "desc": "任务之间的依赖关系，决定哪些输出会成为后续输入。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "问题不是只缺模型",
          "desc": "复杂任务还缺少把模型组织起来的控制逻辑。"
        },
        {
          "icon": "🔧",
          "title": "LLM 做脑",
          "desc": "论文让 ChatGPT 负责理解、规划、选择和汇总。"
        },
        {
          "icon": "✨",
          "title": "视觉应用入口",
          "desc": "图像描述、检测、生成和语音输出都能进入同一工作流。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "语言如何变成模型接口",
      "badge": "inf",
      "badgeLabel": "表示",
      "bridge": "上一节看到 LLM 需要专家模型，但专家模型怎样被 LLM 理解？论文的回答很朴素：把模型能力写成语言描述，作为选择和调度的接口。",
      "analogy": {
        "title": "对焦模型说明书",
        "text": "摄影师先读镜头说明，再决定用广角还是长焦。HuggingGPT 同样先读<b>模型描述</b>，再选择任务对应的专家。",
        "componentId": "hugginggpt-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "拖动焦点看模型卡",
          "desc": "拖动焦点从任务名移到模型描述，观察选择依据如何从粗糙标签变成可比较的能力信息。",
          "componentId": "hugginggpt-lab"
        }
      ],
      "formula": {
        "lead": "模型选择可以理解为在语言空间里匹配任务描述与模型描述。",
        "unicode": "m* = argmaxₘ score(desc(<span class=\"fe-formula-sym\">t</span>), desc(<span class=\"fe-formula-sym\">m</span>))",
        "symbols": [
          {
            "sym": "t",
            "desc": "当前待解决任务。"
          },
          {
            "sym": "m",
            "desc": "候选专家模型及其模型卡描述。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "接口是语言",
          "desc": "语言描述让 LLM 能“读懂”外部工具。"
        },
        {
          "icon": "🔧",
          "title": "模型卡很关键",
          "desc": "功能、领域、语言、许可证等信息都会影响选择。"
        },
        {
          "icon": "✨",
          "title": "可扩展性来自社区",
          "desc": "模型社区越丰富，系统可调用能力越多。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "任务规划：把请求拆成依赖图",
      "badge": "inf",
      "badgeLabel": "核心机制",
      "bridge": "有了模型说明，下一步是把用户请求拆成可执行单元。HuggingGPT 的规划模板把每个子任务写成 task、id、dep、args 四类信息。",
      "analogy": {
        "title": "安排拍摄清单",
        "text": "拍摄前先写清单：先取姿态，再生成新图，再描述和配音。清单顺序错了，后面的镜头就没有素材。",
        "componentId": "hugginggpt-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "逐步展开依赖图",
          "desc": "点击下一步，把“生成同姿态女孩图片并朗读描述”拆成带依赖的多模态任务链。",
          "componentId": "hugginggpt-lab"
        }
      ],
      "formula": {
        "lead": "论文的任务模板强调 id 与 dep，因为它们决定资源引用。",
        "unicode": "taskᵢ = {type, id, dep, args(<span class=\"fe-formula-sym\">text</span>, <span class=\"fe-formula-sym\">image</span>, <span class=\"fe-formula-sym\">audio</span>)}",
        "symbols": [
          {
            "sym": "text",
            "desc": "来自用户或前置任务的文本参数。"
          },
          {
            "sym": "image",
            "desc": "用户图像或前置生成图像资源。"
          },
          {
            "sym": "audio",
            "desc": "语音任务需要的音频资源。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "规划是瓶颈",
          "desc": "任务顺序和依赖错误会直接破坏后续执行。"
        },
        {
          "icon": "🔧",
          "title": "依赖显式化",
          "desc": "dep 字段让系统知道哪个资源来自哪个前置任务。"
        },
        {
          "icon": "✨",
          "title": "多模态可串联",
          "desc": "姿态、图像生成、字幕和语音可以变成同一张图。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "控制器强弱决定规划质量",
      "badge": "both",
      "badgeLabel": "评测",
      "bridge": "规划模板只是格式，真正难的是 LLM 能否给出正确计划。论文用单任务、顺序任务和图任务来量化不同控制器的规划能力。",
      "analogy": {
        "title": "调节快门稳定性",
        "text": "快门太弱，照片虚；控制器太弱，计划乱。调稳控制器，任务图才会清晰。",
        "componentId": "hugginggpt-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "控制器能力与规划指标",
          "desc": "移动控制器强度，比较 Alpaca、Vicuna、GPT-3.5 与 GPT-4 在论文表格中的规划表现。",
          "componentId": "hugginggpt-lab"
        }
      ],
      "formula": {
        "lead": "顺序任务中，论文同时看重 F1 和编辑距离。",
        "unicode": "PlanQuality = high <span class=\"fe-formula-sym\">F1</span> + low <span class=\"fe-formula-sym\">ED</span>",
        "symbols": [
          {
            "sym": "F1",
            "desc": "任务预测的综合准确性，越高越好。"
          },
          {
            "sym": "ED",
            "desc": "归一化编辑距离，越低表示顺序越接近参考规划。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "强控制器必要",
          "desc": "GPT-3.5 在作者构造的三类规划集上明显优于开源 7B 模型。"
        },
        {
          "icon": "🔧",
          "title": "指标要分任务",
          "desc": "单任务、顺序任务和图任务不能只用一个指标概括。"
        },
        {
          "icon": "✨",
          "title": "不要神化规划",
          "desc": "人标数据里 GPT-4 仍有明显差距。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "模型选择：读懂任务再选专家",
      "badge": "both",
      "badgeLabel": "选模",
      "bridge": "规划给出“要做什么”，模型选择回答“谁来做”。HuggingGPT 让 LLM 基于 Hugging Face 模型描述做任务-模型匹配。",
      "analogy": {
        "title": "换镜头而不是换相机",
        "text": "同一台相机遇到远景、人像、微距会换镜头。HuggingGPT 遇到 caption、detection、tts 也要换专家。",
        "componentId": "hugginggpt-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "为任务挑选专家模型",
          "desc": "点击不同任务类型，观察模型选择依据如何随任务改变；错误任务类型会触发红色反馈。",
          "componentId": "hugginggpt-lab"
        }
      ],
      "formula": {
        "lead": "选模不是随机挑一个热门模型，而是让任务要求与模型能力对齐。",
        "unicode": "select(<span class=\"fe-formula-sym\">t</span>) = model with matching function + modality + constraints",
        "symbols": [
          {
            "sym": "t",
            "desc": "来自规划阶段的子任务。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "任务驱动选模",
          "desc": "caption、检测、姿态、语音合成需要不同专家。"
        },
        {
          "icon": "🔧",
          "title": "描述越准越稳",
          "desc": "模型说明的质量直接影响 LLM 的选择。"
        },
        {
          "icon": "✨",
          "title": "视觉应用最受益",
          "desc": "图像任务能调用检测、分割、caption、生成等专门模型。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "执行：让中间资源流动起来",
      "badge": "inf",
      "badgeLabel": "推理",
      "bridge": "选好模型后，系统必须真的执行任务，并把输出资源交给后续任务。论文特别强调资源依赖，例如 <resource-2> 可以成为下一个任务的 image 参数。",
      "analogy": {
        "title": "冲洗一张底片",
        "text": "一张底片洗出来后，才能继续裁切、标注和配音。资源符号就是这张底片的编号。",
        "componentId": "hugginggpt-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "沿着资源依赖执行",
          "desc": "逐步执行一个视觉链路，观察每一步如何产出资源并喂给后续任务。",
          "componentId": "hugginggpt-lab"
        }
      ],
      "formula": {
        "lead": "任务执行阶段把前置输出解析成后续参数。",
        "unicode": "argsᵢ.image = <resource-<span class=\"fe-formula-sym\">j</span>> when j ∈ depᵢ",
        "symbols": [
          {
            "sym": "j",
            "desc": "产生可复用资源的前置任务编号。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "资源是链路胶水",
          "desc": "没有资源引用，多模型就只能孤立运行。"
        },
        {
          "icon": "🔧",
          "title": "执行可本地可云端",
          "desc": "论文采用混合端点来平衡速度、覆盖和稳定性。"
        },
        {
          "icon": "✨",
          "title": "可追踪更重要",
          "desc": "每个输出都能对应到产生它的子任务。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "少样本演示怎样帮助规划",
      "badge": "trn",
      "badgeLabel": "提示设计",
      "bridge": "HuggingGPT 不是只给 LLM 一个空白命令。论文在提示中加入示例，并做了演示数量与多样性的消融实验。",
      "analogy": {
        "title": "参考样片的多样性",
        "text": "摄影课上看同一种样片不够，风景、人像、运动都看一点，构图才更稳。规划演示也需要多样性。",
        "componentId": "hugginggpt-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "示例多样性带来的收益",
          "desc": "调节演示覆盖的任务类型数，观察论文表 7 中 GPT-3.5/GPT-4 的规划趋势。",
          "componentId": "hugginggpt-lab"
        }
      ],
      "formula": {
        "lead": "演示帮助 LLM 形成任务格式和依赖模式，但收益会趋于饱和。",
        "unicode": "gain ≈ f(variety, shots), with shots > 4 → smaller marginal gain",
        "symbols": [
          {
            "sym": "variety",
            "desc": "示例覆盖的不同任务类型数。"
          },
          {
            "sym": "shots",
            "desc": "提示中的示例数量。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "示例不是越多越好",
          "desc": "论文观察到超过约 4 个示例后收益有限。"
        },
        {
          "icon": "🔧",
          "title": "多样性有用",
          "desc": "不同任务类型的示例能更好覆盖规划形态。"
        },
        {
          "icon": "✨",
          "title": "提示也是系统部件",
          "desc": "HuggingGPT 的效果来自模型、提示和工具库共同作用。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "系统结构：四个阶段如何协作",
      "badge": "trn",
      "badgeLabel": "架构",
      "bridge": "现在把前面的概念拼回完整系统。HuggingGPT 的非平凡结构不是一张静态图，而是一个可点击的控制链路。",
      "analogy": {
        "title": "布置拍摄台",
        "text": "拍摄台上只有一盏主灯移动，但灯光会依次照亮计划、镜头、冲洗和成片。系统结构也要看清主控流向。",
        "componentId": "hugginggpt-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点击四阶段架构图",
          "desc": "点击系统阶段，查看它负责的状态、输入输出和失败风险；高亮路径会随选择变化。",
          "componentId": "hugginggpt-lab"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "本地端点与云端点的取舍",
          "desc": "切换部署模式，比较本地端点覆盖少但快、云端点覆盖广但可能更慢的论文设定。",
          "componentId": "hugginggpt-lab"
        }
      ],
      "formula": {
        "lead": "完整回答来自四阶段日志和模型执行结果的汇总。",
        "unicode": "response = summarize(request, <span class=\"fe-formula-sym\">plan</span>, <span class=\"fe-formula-sym\">models</span>, results)",
        "symbols": [
          {
            "sym": "plan",
            "desc": "任务规划阶段输出的任务列表和依赖。"
          },
          {
            "sym": "models",
            "desc": "模型选择阶段绑定到任务的专家模型集合。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "架构是闭环",
          "desc": "规划、选模、执行、回答缺一不可。"
        },
        {
          "icon": "🔧",
          "title": "混合部署实用",
          "desc": "本地与云端端点解决覆盖和稳定性的不同侧面。"
        },
        {
          "icon": "✨",
          "title": "结构可解释",
          "desc": "每个阶段都有可检查的输入、输出和风险点。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "鲁棒性边界：规划、长度、时延和不稳定",
      "badge": "trn",
      "badgeLabel": "边界",
      "bridge": "论文没有把 HuggingGPT 描述成万能系统。作者明确列出四类限制：规划依赖 LLM、效率成本、上下文长度和生成不稳定。",
      "analogy": {
        "title": "检查拍摄风险",
        "text": "开拍前检查电量、存储卡和脚架。智能体系统也要先看风险，不要只看演示成功的样例。",
        "componentId": "hugginggpt-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "切换四类失效模式",
          "desc": "点击不同风险，观察系统在哪个阶段变红，以及应如何缓解而不是盲目相信自动化。",
          "componentId": "hugginggpt-lab"
        }
      ],
      "formula": {
        "lead": "系统可靠性可以粗略看作多阶段成功率的乘积，因此任何一段不稳都会放大风险。",
        "unicode": "P(success) ≈ Πₖ P(stageₖ works)",
        "symbols": [
          {
            "sym": "stageₖ",
            "desc": "规划、选模、执行或回答中的第 k 个阶段。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "边界要明说",
          "desc": "规划并不保证可行或最优。"
        },
        {
          "icon": "🔧",
          "title": "成本不可忽视",
          "desc": "多轮 LLM 调用会增加响应时间和上下文压力。"
        },
        {
          "icon": "✨",
          "title": "工程需要兜底",
          "desc": "校验、缓存、回退和错误处理同样重要。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果与启发：强控制器加专家生态",
      "badge": "both",
      "badgeLabel": "结果",
      "bridge": "最后回到证据：HuggingGPT 的价值不只来自一个炫酷演示，而是来自规划评测、人评结果、跨模态案例和作者承认的局限一起构成的判断。",
      "analogy": {
        "title": "冲印后的样张对比",
        "text": "同一主题下比较不同相机的成片：谁能完成任务，谁只是看起来会拍。结果必须对应同一评价协议。",
        "componentId": "hugginggpt-lab"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "启动论文结果赛跑",
          "desc": "选择评测指标并启动比较，注意每个指标的方向：通过率和成功率越高越好，编辑距离越低越好。",
          "componentId": "hugginggpt-lab"
        }
      ],
      "insight": "这篇论文对你的研究方向最有用的启发是：多模态智能体的核心不是把所有视觉能力塞进一个模型，而是设计可解释、可检查、可扩展的工具协作协议。",
      "formula": {
        "lead": "最终判断要同时看任务规划、模型选择和回答成功率。",
        "unicode": "AgentValue = controller quality + expert coverage + execution stability",
        "symbols": [
          {
            "sym": "controller",
            "desc": "负责规划和选择的 LLM 能力。"
          },
          {
            "sym": "expert",
            "desc": "模型社区中可调用专家的覆盖范围与质量。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "证据支持方向",
          "desc": "人评中 GPT-3.5 的规划通过率 91.22%，模型选择通过率 93.89%。"
        },
        {
          "icon": "🔧",
          "title": "仍需工程化",
          "desc": "响应成功率 63.08% 说明完整系统还有很多可靠性空间。"
        },
        {
          "icon": "✨",
          "title": "后续选题",
          "desc": "可继续研究视觉工具选择、规划校验、多模态记忆与失败恢复。"
        }
      ]
    }
  ]
};
