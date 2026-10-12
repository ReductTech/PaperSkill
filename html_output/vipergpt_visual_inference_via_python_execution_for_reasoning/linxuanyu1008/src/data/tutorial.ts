import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "ViperGPT: Visual Inference via Python Execution for Reasoning",
    "titleZh": "ViperGPT 交互教程",
    "venue": "ICCV 2023",
    "authors": "Dídac Surís · Sachit Menon · Carl Vondrick",
    "affiliation": "哥伦比亚大学",
    "domain": "视觉问答 · 程序合成 · 模块化推理",
    "coreProblem": "复杂视觉查询把“看见”和“推理”混在一个直接答案里，难以检查。",
    "coreInsight": "LLM 决定怎么做，预训练模型负责看，Python 负责确定性的逻辑与执行。网页为教学演示，不调用真实模型。",
    "keywords": [
      "可组合工具",
      "执行痕迹",
      "无需下游再训练",
      "图像与视频"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "端到端视觉问答（概念示意）：黑箱式呈现最终答案。网页没有运行真实基线模型。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "无需针对这些下游任务重新训练或微调 ViperGPT 系统。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "为什么写成程序？",
      "badge": "inf",
      "badgeLabel": "推理基础",
      "bridge": "检查答案4背后的计数，再观察一次漏检怎样传到结果。",
      "analogy": {
        "title": "检查线索，不靠猜测",
        "text": "拿放大镜核对线索。",
        "componentId": "analogy-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "同一个答案，逐步看见依据",
          "desc": "逐步读出8个松饼、2个孩子，最后检查整除。",
          "componentId": "c6-trace"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "教学实验：漏检一个松饼",
          "desc": "照片不变，只替换一个检测结果。",
          "componentId": "c1-share"
        }
      ],
      "insight": "程序让错误路径可检查，但不会自动修复错误的视觉检测。",
      "takeaways": [
        {
          "icon": "🔎",
          "title": "先感知，再计算",
          "desc": "数量来自视觉工具，整数除法来自程序。"
        },
        {
          "icon": "⚠️",
          "title": "忠实不等于正确",
          "desc": "能追踪输入，并不保证输入准确。"
        },
        {
          "icon": "🧾",
          "title": "证据来自计算路径",
          "desc": "不要用事后理由替代中间值。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "Codex 写程序",
      "badge": "inf",
      "badgeLabel": "推理基础",
      "bridge": "把查询和接口规范变成程序；此时还不读取图像。",
      "analogy": {
        "title": "在纸上写解谜步骤",
        "text": "拿笔写计划，尚未查看现场。",
        "componentId": "analogy-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "从问题到可执行的函数",
          "desc": "每前进一步，计划与代码同步增长；生成过程为预设教学演示。",
          "componentId": "pizza-program"
        }
      ],
      "insight": "π 生成程序 z；工具调用发生在后续执行阶段。",
      "takeaways": [
        {
          "icon": "✍️",
          "title": "查询驱动生成",
          "desc": "先把问题变成工具调用与排序。"
        },
        {
          "icon": "📘",
          "title": "规范进入提示",
          "desc": "接口说明帮助模型选择操作。"
        },
        {
          "icon": "🧩",
          "title": "复用预训练能力",
          "desc": "新增程序不代表新增任务训练。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "API 工具箱",
      "badge": "both",
      "badgeLabel": "共同基础",
      "bridge": "选择工具，区分接口说明、实际实现和返回类型。",
      "analogy": {
        "title": "从工具箱选工具",
        "text": "按问题从工具箱取工具。",
        "componentId": "analogy-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "选择工具，查看接口与模型",
          "desc": "按能力选择API，查看输入、返回类型和模型来源。",
          "componentId": "api-toolbox"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "ImagePatch：区域、几何与方法",
          "desc": "切换整图与局部，检查图像块对象的封装。",
          "componentId": "c2-crop"
        }
      ],
      "insight": "只把接口契约放进提示，执行时再调用实现；这样能节省上下文并更换底层能力。",
      "takeaways": [
        {
          "icon": "📘",
          "title": "规范不等于实现",
          "desc": "输入、输出、说明让模型知道怎么调用。"
        },
        {
          "icon": "🧩",
          "title": "能力有明确来源",
          "desc": "检测、匹配、深度、问答分别复用已有模型。"
        },
        {
          "icon": "⚙️",
          "title": "返回类型决定后续逻辑",
          "desc": "列表可计数、数值可排序、布尔值可组合。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "感知 vs Python",
      "badge": "both",
      "badgeLabel": "共同基础",
      "bridge": "模型给出感知值，Python按明确规则组合它们。",
      "analogy": {
        "title": "取到证据，再按规则判断",
        "text": "用尺子比较已取得的线索。",
        "componentId": "analogy-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "复现图4的属性与空间判断",
          "desc": "切换感知值，观察AND、OR和空间比较的结果。",
          "componentId": "gqa-reasoning"
        }
      ],
      "insight": "模型给出感知值；and、>、if、sort 等采用 Python 的明确语义。",
      "takeaways": [
        {
          "icon": "🔗",
          "title": "属性合取",
          "desc": "True and True 得到 True。"
        },
        {
          "icon": "📏",
          "title": "空间比较",
          "desc": "608.5 > 239.0 支持该视角中的右侧关系。"
        },
        {
          "icon": "⚠️",
          "title": "逻辑不修复感知",
          "desc": "错误属性或区域仍会传递到结果。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "Pizza 完整执行",
      "badge": "inf",
      "badgeLabel": "推理基础",
      "bridge": "运行第二章的程序，看深度键怎样决定返回区域。",
      "analogy": {
        "title": "给候选线索排序",
        "text": "给线索卡排序，选最前的一张。",
        "componentId": "analogy-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "沿执行链找到最前方区域",
          "desc": "先预测，再执行；修改深度和检测的实验可按需展开。",
          "componentId": "pizza-execution"
        }
      ],
      "insight": "find 和深度估计提供候选信息，排序选出 0.3 对应的区域，返回值仍是 ImagePatch。",
      "takeaways": [
        {
          "icon": "▣",
          "title": "区域列表先产生",
          "desc": "没有 find 的候选，就没有排序对象。"
        },
        {
          "icon": "📏",
          "title": "深度有相对尺度",
          "desc": "本例按升序选首项，不能改写为绝对距离。"
        },
        {
          "icon": "🧾",
          "title": "路径可复核",
          "desc": "生成的程序和执行中的数值要分别查看。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "外部知识",
      "badge": "both",
      "badgeLabel": "共同基础",
      "bridge": "先认出玩具对应的动物，再用文本知识回答习性。",
      "analogy": {
        "title": "翻开百科补常识",
        "text": "翻百科补充对象的习性。",
        "componentId": "analogy-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "识别、知识查询与基线回答",
          "desc": "沿 toy → bear → hibernate 检查图5的证据链。",
          "componentId": "bear-knowledge"
        }
      ],
      "insight": "识别结果连接图像与文本知识；知识模型不是保证正确的数据库。",
      "takeaways": [
        {
          "icon": "🐻",
          "title": "先明确对象",
          "desc": "simple_query 识别 bear。"
        },
        {
          "icon": "📚",
          "title": "再查询知识",
          "desc": "llm_query 在论文中由 GPT-3 提供。"
        },
        {
          "icon": "⚠️",
          "title": "别混淆错误类型",
          "desc": "ski 是基线的最终回答，不是对象识别类别。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "视频时间推理",
      "badge": "inf",
      "badgeLabel": "推理基础",
      "bridge": "用帧索引区分事件之后、视频结尾和事件缺失。",
      "analogy": {
        "title": "翻照片找时间位置",
        "text": "翻照片找到指定时间位置。",
        "componentId": "analogy-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "比较三种帧选择路径",
          "desc": "切换分支，查看自然语言怎样变成帧索引。",
          "componentId": "temporal-examples"
        }
      ],
      "insight": "此实验主要复用图像感知模块；程序把视频组织为有序帧，再用明确帧号完成时序推理。select_answer依据提取的文本证据选答案。",
      "takeaways": [
        {
          "icon": "🎞️",
          "title": "之后：先找到事件",
          "desc": "检测到 i = 25 后读取 i + 1 = 26。"
        },
        {
          "icon": "📍",
          "title": "最后：直接取末帧",
          "desc": "ImagePatch(video_segment, -1) 定位结尾。"
        },
        {
          "icon": "⚠️",
          "title": "缺失：直接取中间",
          "desc": "遍历后未检测到事件时使用 num_frames // 2，不再加一。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "完整架构",
      "badge": "trn",
      "badgeLabel": "系统与训练",
      "bridge": "把前七章拼回系统图，明确无需下游再训练的边界。",
      "analogy": {
        "title": "把计划与工具放到现场",
        "text": "将计划放到现场，使用工具执行。",
        "componentId": "analogy-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点选节点，检查系统依赖",
          "desc": "点选节点，追踪输入、调用与返回。",
          "componentId": "c8-system"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "training-free 的三个边界",
          "desc": "区分预训练、任务特定再训练与API扩展。",
          "componentId": "c7-training"
        }
      ],
      "insight": "π 生成程序 z；φ 用 x 与 z 得到 r。φ 由 Python 解释器与API实现构成。",
      "takeaways": [
        {
          "icon": "👁️",
          "title": "图像不进入 Codex",
          "desc": "视觉输入在执行阶段使用。"
        },
        {
          "icon": "⚙️",
          "title": "工具在执行中调用",
          "desc": "不是先把所有工具跑完，再交给 Python。"
        },
        {
          "icon": "🧠",
          "title": "预训练是能力基础",
          "desc": "无需额外任务训练仍依赖已训练模型。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "Context 与干预",
      "badge": "trn",
      "badgeLabel": "系统与训练",
      "bridge": "切换背景改变程序，替换组件检查同一程序的依赖。",
      "analogy": {
        "title": "加入背景提示卡",
        "text": "加入背景提示卡，改变判断。",
        "componentId": "analogy-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "同一张图，切换 US／UK 上下文",
          "desc": "同一照片切换背景，条件、高亮侧和返回值一起改变。",
          "componentId": "context-switch"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "保持程序，替换一个组件输出",
          "desc": "选择组件，检查原图换算的近似下降与被替换的输出。",
          "componentId": "c9-intervene"
        }
      ],
      "insight": "上下文改变生成出来的程序条件；干预保持同一程序与同批样本，替换某个组件输出以检查贡献。",
      "takeaways": [
        {
          "icon": "📝",
          "title": "上下文先于生成",
          "desc": "附加评论能改变生成的分支条件。"
        },
        {
          "icon": "🧪",
          "title": "干预有固定条件",
          "desc": "论文在使用受影响模块的样本上执行同一代码。"
        },
        {
          "icon": "🧩",
          "title": "能力扩展有边界",
          "desc": "图1展示超出基准的组合；OCR、分割等是未来扩展方向。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "实验结果",
      "badge": "both",
      "badgeLabel": "共同基础",
      "bridge": "按数据集和评测协议比较论文报告的结果。",
      "analogy": {
        "title": "按同一规则给方案评分",
        "text": "拿评分表核对结果。",
        "componentId": "analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "在同一协议上比较",
          "componentId": "c10-results",
          "desc": "先选数据集，再选切片；只在相同协议内比较。"
        }
      ],
      "insight": "透明程序是一种可组合的系统设计；收益必须由同条件评测支持。",
      "takeaways": [
        {
          "icon": "📊",
          "title": "只比同一协议",
          "desc": "分数、拆分、指标方向与训练方式都要一起看。"
        },
        {
          "icon": "🏷️",
          "title": "结论有范围",
          "desc": "zero-shot指没有该benchmark的额外任务训练；底层模型已经预训练。"
        },
        {
          "icon": "⚠️",
          "title": "组件仍会失误",
          "desc": "代码生成、视觉感知与外部知识都可能出错；附录未提供的细节不补造。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1BV4y1879K",
      "title": "[论文速览] ViperGPT",
      "reason": "来源：秋刀鱼的炼丹工坊。中文短讲，直接讲解本篇论文；与原文对照阅读。",
      "cover": "https://i1.hdslb.com/bfs/archive/06a1c2f6646dbfe34f4c0bdec2d3f24b40227b69.jpg",
      "views": "秋刀鱼的炼丹工坊 · 3007播放 · 2026-10-08快照"
    }
  ]
};
