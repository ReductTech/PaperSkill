import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "SegAgent: Exploring Pixel Understanding Capabilities in MLLMs by Imitating Human Annotator Trajectories",
    "titleZh": "SegAgent：像标注员一样逐步修正分割",
    "venue": "CVPR 2025",
    "authors": "Muzhi Zhu, Yuzhuo Tian, Hao Chen, Chunluan Zhou, Qingpei Guo, Yang Liu, Ming Yang, Chunhua Shen",
    "affiliation": "浙江大学；蚂蚁集团",
    "domain": "多模态大模型 · 交互式分割 · 视觉决策",
    "coreProblem": "图像级问答无法证明模型能定位到像素；直接生成掩码又常依赖改变输出接口的专用解码器。",
    "coreInsight": "HLMAT让多模态模型根据当前掩码输出正负点击；SegAgent从模拟轨迹学习，并用StaR+与PRM树搜索增强复杂场景。",
    "keywords": [
      "合成点击轨迹",
      "逐步策略学习",
      "PRM 测试时搜索"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "沿边界输出较长的坐标序列，复杂曲率更难表示。",
      "componentId": "paper-hero"
    },
    "newMethod": {
      "desc": "依据当前掩码输出文本正负点击，由交互分割器迭代更新。",
      "componentId": "paper-hero"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "从整图回答到像素判断",
      "badge": "inf",
      "badgeLabel": "认识",
      "bridge": "视觉问答能说出对象，却未必能指准它的每个像素；先看清这个差距。",
      "analogy": {
        "title": "沿边剪出目标",
        "text": "看出物体是什么，还不等于知道每个边界像素。剪影的缺口与多余纸边，对应漏分和误分。",
        "componentId": "paper-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "同一对象，两种表达方式",
          "desc": "切换轮廓表达与点击表达，再检查它们如何连接分割接口。",
          "componentId": "ch1-contour"
        }
      ],
      "insight": "与其让模型一次写出整张掩码，不如观察它能否根据当前结果一步步修正。",
      "formula": {
        "lead": "一步交互由点击极性和归一化坐标组成。",
        "unicode": "aₜ = (αₜ, cₜ),   αₜ ∈ {+1, −1},   cₜ ∈ [0,1]²",
        "symbols": [
          {
            "sym": "aₜ",
            "desc": "第 t 步动作，由极性和位置组成"
          },
          {
            "sym": "αₜ",
            "desc": "点击极性，+1补入目标，−1移除多余区域"
          },
          {
            "sym": "cₜ",
            "desc": "图像中的相对二维坐标"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "粗细分工",
          "desc": "识别物体不足以证明模型懂像素边界。"
        },
        {
          "icon": "🔧",
          "title": "交互表达",
          "desc": "文本点击让掩码逐步变化。"
        },
        {
          "icon": "✨",
          "title": "研究边界",
          "desc": "HLMAT是新评测范式，不是对所有分割方法的普遍胜利声明。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "把分割写成一步步决策",
      "badge": "trn",
      "badgeLabel": "任务",
      "bridge": "如果不能一次写出可靠边界，模型怎样把当前掩码一步步修好？",
      "analogy": {
        "title": "一刀只改一处",
        "text": "一处缺口补入，一处多余裁去；下一步要看着当前剪影再决定。",
        "componentId": "paper-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "从一次点击到下一状态",
          "desc": "点击画布或回放预置轨迹，同时观察掩码与动作日志。",
          "componentId": "ch2-click"
        }
      ],
      "formula": {
        "lead": "环境用当前掩码与目标掩码的重叠评估这一步。",
        "unicode": "R(sₜ) = IoU(Mₜ, M_target)",
        "symbols": [
          {
            "sym": "sₜ",
            "desc": "当前交互状态"
          },
          {
            "sym": "Mₜ",
            "desc": "当前预测掩码"
          },
          {
            "sym": "M_target",
            "desc": "目标真值掩码；评估和轨迹合成时可用"
          },
          {
            "sym": "IoU",
            "desc": "交并比，数值越高表示重叠越好"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "状态",
          "desc": "当前掩码是下一次决策的输入。"
        },
        {
          "icon": "🔧",
          "title": "动作",
          "desc": "动作同时包含正负极性与位置。"
        },
        {
          "icon": "✨",
          "title": "奖励",
          "desc": "IoU衡量重叠，不直接告诉模型下一点落在哪。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "从静态标注合成点击轨迹",
      "badge": "both",
      "badgeLabel": "数据与方法",
      "bridge": "有了状态与点击，还缺训练轨迹；现成标注如何变成动作序列？",
      "analogy": {
        "title": "优先修最大的缺口",
        "text": "把当前剪影与目标叠在一起，先修偏差更严重的一侧。",
        "componentId": "paper-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "找到误差，再生成下一步",
          "desc": "选择漏分或误分，观察规则模拟器如何将静态标注变成轨迹。",
          "componentId": "ch3-simulator"
        }
      ],
      "formula": {
        "lead": "规则模拟器根据当前和目标掩码提出下一步动作。",
        "unicode": "aₜ₊₁ = F_sim(Mₜ, M_target)",
        "symbols": [
          {
            "sym": "F_sim",
            "desc": "基于错误区域规则生成点击的模拟器"
          },
          {
            "sym": "Mₜ",
            "desc": "当前预测掩码"
          },
          {
            "sym": "M_target",
            "desc": "目标真值掩码"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "漏分",
          "desc": "缺少目标区域时使用正点击。"
        },
        {
          "icon": "🔧",
          "title": "误分",
          "desc": "多选背景区域时使用负点击。"
        },
        {
          "icon": "✨",
          "title": "合成",
          "desc": "规则模拟器把静态掩码转成动作轨迹。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "过滤噪声与无效动作",
      "badge": "trn",
      "badgeLabel": "数据质量",
      "bridge": "模拟器能产出长轨迹，但掩码噪声可能让末尾动作失真。",
      "analogy": {
        "title": "到位就停",
        "text": "继续剪不一定更好；噪声边缘会把后几刀带偏。",
        "componentId": "paper-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "哪些动作值得保留？",
          "desc": "调整最大长度、满意度停止与低增益过滤，检查轨迹变化。",
          "componentId": "ch4-guards"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "长度上限",
          "desc": "限制轨迹尾部，减少噪声动作。"
        },
        {
          "icon": "🔧",
          "title": "停止阈值",
          "desc": "达到目标质量后停止模拟。"
        },
        {
          "icon": "✨",
          "title": "低增益过滤",
          "desc": "剔除可能使掩码恶化的动作。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "首次定位与边界精修",
      "badge": "inf",
      "badgeLabel": "能力拆解",
      "bridge": "即使轨迹更干净，模型仍需先找对对象，再看准边缘。",
      "analogy": {
        "title": "先找对，再剪细",
        "text": "第一步找目标的大致位置，后续动作才有机会修准边界。",
        "componentId": "paper-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "先找对目标，再修好边缘",
          "desc": "在全局定位与局部精修间切换，移动放大镜检查边界差异。",
          "componentId": "ch5-capabilities"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "首步",
          "desc": "粗定位决定后续修正从哪里开始。"
        },
        {
          "icon": "🔧",
          "title": "后续",
          "desc": "局部图像与当前掩码驱动边界精修。"
        },
        {
          "icon": "✨",
          "title": "风险",
          "desc": "边界附近的坐标容易跨到背景区域。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "让模型学会跟着掩码走",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "轨迹记录了人的修边方式，下一步是让模型学会复现。",
      "analogy": {
        "title": "沿着上一步继续",
        "text": "每次剪完都看当前剪影，再选下一处修正。",
        "componentId": "paper-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "状态如何进入策略回路？",
          "desc": "点击流程节点或逐步推进，检查输入、动作与下一掩码。",
          "componentId": "ch6-rollout"
        }
      ],
      "formula": {
        "lead": "策略依据当前掩码、图像和目标描述预测下一动作。",
        "unicode": "πθ(aₜ | Mₜ, I, P)",
        "symbols": [
          {
            "sym": "πθ",
            "desc": "参数为 θ 的动作策略"
          },
          {
            "sym": "Mₜ",
            "desc": "当前掩码"
          },
          {
            "sym": "I",
            "desc": "输入图像"
          },
          {
            "sym": "P",
            "desc": "目标对象的文字描述"
          },
          {
            "sym": "aₜ",
            "desc": "模型输出的点击动作"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "输入",
          "desc": "当前掩码以半透明形式叠加在原图上。"
        },
        {
          "icon": "🔧",
          "title": "输出",
          "desc": "模型输出文本形式的下一次点击。"
        },
        {
          "icon": "✨",
          "title": "训练",
          "desc": "监督微调拟合由模拟器生成的轨迹。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "StaR+逐步修正策略",
      "badge": "trn",
      "badgeLabel": "策略改进",
      "bridge": "模仿近乎最优的轨迹有了起点，但动作多样性和鲁棒性仍有限。",
      "analogy": {
        "title": "把剪坏的一刀改回来",
        "text": "逐刀检查收益；有害动作由模拟器给出替代修正。",
        "componentId": "paper-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "保留好动作，纠正坏动作",
          "desc": "先评估单步增益，再查看原始与修正轨迹如何组成训练集。",
          "componentId": "ch7-star-action"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "增益",
          "desc": "保留提高奖励的单步动作。"
        },
        {
          "icon": "🔧",
          "title": "替换",
          "desc": "负增益动作由模拟器纠正。"
        },
        {
          "icon": "✨",
          "title": "合并",
          "desc": "改进轨迹与原始轨迹合并训练。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "PRM在推理时挑下一步",
      "badge": "both",
      "badgeLabel": "推理搜索",
      "bridge": "训练能改变策略，推理时还可以用过程评分检查候选步骤。",
      "analogy": {
        "title": "落刀前比较候选",
        "text": "多试几个候选位置，用过程评分挑下一步。",
        "componentId": "paper-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "下一次点击，应该选哪里？",
          "desc": "选择候选，预览对应状态；PRM 示意排序与真实指标分开阅读。",
          "componentId": "ch8-search"
        }
      ],
      "formula": {
        "lead": "搜索选取过程奖励模型预测分最高的候选掩码。",
        "unicode": "i* = argmaxᵢ PRM(Mⁱ)",
        "symbols": [
          {
            "sym": "i*",
            "desc": "被选中的候选编号"
          },
          {
            "sym": "PRM(Mⁱ)",
            "desc": "过程奖励模型对候选掩码的预测分，不是真实IoU"
          },
          {
            "sym": "K",
            "desc": "每步采样的候选动作数"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "PRM",
          "desc": "预测当前步骤的掩码质量。"
        },
        {
          "icon": "🔧",
          "title": "搜索",
          "desc": "每步选候选；最终返回沿途预测奖励最高的掩码。"
        },
        {
          "icon": "✨",
          "title": "代价",
          "desc": "更宽搜索需要评估更多候选。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "从RES到HRES：让任务真的需要多步",
      "badge": "inf",
      "badgeLabel": "评测数据",
      "bridge": "要看清多步精修能力，测试集必须有足够复杂的边界。",
      "analogy": {
        "title": "细桥需要慢慢修",
        "text": "常见物体可能一两步就够，细长结构与孔洞需要更谨慎地修边。",
        "componentId": "paper-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "复杂边界需要怎样的推理预算？",
          "desc": "对照 RES / HRES 的数据特点和论文设置，再观察固定上限与质量停步的教学回放。",
          "componentId": "ch9-datasets"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "RES",
          "desc": "常见指代表达与相对简单的掩码。"
        },
        {
          "icon": "🔧",
          "title": "HRES",
          "desc": "来自 HQSeg-44K 的 DIS5K 与 ThinObject5K。"
        },
        {
          "icon": "✨",
          "title": "公平比较",
          "desc": "同时报告数据集、步数和候选数。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、失败边界与结论",
      "badge": "both",
      "badgeLabel": "结果",
      "bridge": "复杂数据上有收益，也要连同失败点和评测协议一起读。",
      "analogy": {
        "title": "边界外的一点会剪坏轮廓",
        "text": "分数要连着数据集、初始化与交互工具读；边界点落错仍会伤害结果。",
        "componentId": "paper-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "RES结果逐列看",
          "desc": "Table 1 的三种 SAM 设置共享 Qwen box 初始框；切换拆分读取同协议 cIoU。",
          "componentId": "ch10-results"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "点错发生在哪",
          "desc": "切换首点偏位与边界越界，查看示意位置、错误机制和可能后果。",
          "componentId": "ch10-failures"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "结果",
          "desc": "按精确数据列和评测协议阅读。"
        },
        {
          "icon": "🔧",
          "title": "能力",
          "desc": "文本点击让模型迭代修正掩码。"
        },
        {
          "icon": "✨",
          "title": "边界",
          "desc": "首点定位与精细边界坐标仍会失败。"
        }
      ]
    }
  ]
};
