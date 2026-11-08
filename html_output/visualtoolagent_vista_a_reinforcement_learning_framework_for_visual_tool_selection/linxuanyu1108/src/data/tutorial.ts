import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "VisualToolAgent (VisTA): A Reinforcement Learning Framework for Visual Tool Selection",
    "titleZh": "VisTA：视觉工具如何按题选择",
    "venue": "arXiv 2505.20289v2",
    "authors": "Zeyi Huang 等",
    "affiliation": "威斯康星大学麦迪逊分校等",
    "domain": "视觉推理 · 强化学习",
    "coreProblem": "怎样针对每道视觉题选择工具？",
    "coreInsight": "让选择器从冻结推理器的答题结果中学习，发现何时该调用哪些工具。<br><a href=\"https://arxiv.org/html/2505.20289v2\" target=\"_blank\" rel=\"noreferrer\">论文原文</a> · <a href=\"https://oodbag.github.io/vista_web/\" target=\"_blank\" rel=\"noreferrer\">官方项目页</a>",
    "keywords": [
      "视觉问答",
      "工具选择",
      "GRPO"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "依据工具说明或固定策略选取。"
    },
    "newMethod": {
      "desc": "依据冻结推理器的答题反馈学习。"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "为什么要学习选工具？",
      "badge": "inf",
      "badgeLabel": "推理",
      "bridge": "固定工具或仅凭提示挑工具，难以从下游答题反馈中发现工具实际效用。",
      "analogy": {
        "title": "为什么要学习选工具？",
        "text": "固定工具或仅凭提示挑工具，难以从下游答题反馈中发现工具实际效用。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "比较三种选择思路",
          "desc": "",
          "componentId": "lab-1"
        }
      ],
      "takeaways": [
        {
          "icon": "◆",
          "title": "本章要点",
          "desc": "固定工具或仅凭提示挑工具，难以从下游答题反馈中发现工具实际效用。"
        },
        {
          "icon": "→",
          "title": "接下来",
          "desc": "下一章讨论输入与工具表示。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "Agent 看到什么，输出什么？",
      "badge": "inf",
      "badgeLabel": "推理",
      "bridge": "选择策略读取问题和原图，输出预先登记的工具编号。工具分别读取原图。",
      "analogy": {
        "title": "Agent 看到什么，输出什么？",
        "text": "选择策略读取问题和原图，输出预先登记的工具编号。工具分别读取原图。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "从图像与问题选出工具",
          "desc": "",
          "componentId": "lab-2"
        }
      ],
      "takeaways": [
        {
          "icon": "◆",
          "title": "本章要点",
          "desc": "选择策略读取问题和原图，输出预先登记的工具编号。工具分别读取原图。"
        },
        {
          "icon": "→",
          "title": "接下来",
          "desc": "下一章讨论冻结推理器与两条路径。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "工具输出怎样帮助冻结推理器？",
      "badge": "both",
      "badgeLabel": "训练与推理",
      "bridge": "增强路径保留原图和原题，加入工具输出。训练同时评估直接路径，推理阶段只走增强路径。",
      "analogy": {
        "title": "工具输出怎样帮助冻结推理器？",
        "text": "增强路径保留原图和原题，加入工具输出。训练同时评估直接路径，推理阶段只走增强路径。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "训练双路径与部署单路径",
          "desc": "",
          "componentId": "lab-3"
        }
      ],
      "takeaways": [
        {
          "icon": "◆",
          "title": "本章要点",
          "desc": "增强路径保留原图和原题，加入工具输出。训练同时评估直接路径，推理阶段只走增强路径。"
        },
        {
          "icon": "→",
          "title": "接下来",
          "desc": "下一章讨论从对错得到奖励。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "工具帮忙还是添乱，怎么计分？",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "增强正确记 +1。增强错误而直接正确记 −0.5。两者均错记 0。",
      "analogy": {
        "title": "工具帮忙还是添乱，怎么计分？",
        "text": "增强正确记 +1。增强错误而直接正确记 −0.5。两者均错记 0。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "点击四格，查看奖惩",
          "desc": "",
          "componentId": "lab-4"
        }
      ],
      "takeaways": [
        {
          "icon": "◆",
          "title": "本章要点",
          "desc": "增强正确记 +1。增强错误而直接正确记 −0.5。两者均错记 0。"
        },
        {
          "icon": "→",
          "title": "接下来",
          "desc": "下一章讨论GRPO 如何更新选择策略。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "一组候选怎样改变策略？",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "同题采样多份候选，用组内奖励均值与标准差计算相对优势。更新目标含比率裁剪和参考策略 KL 项。",
      "analogy": {
        "title": "一组候选怎样改变策略？",
        "text": "同题采样多份候选，用组内奖励均值与标准差计算相对优势。更新目标含比率裁剪和参考策略 KL 项。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "从候选奖励到裁剪目标",
          "desc": "",
          "componentId": "lab-5"
        }
      ],
      "takeaways": [
        {
          "icon": "◆",
          "title": "本章要点",
          "desc": "同题采样多份候选，用组内奖励均值与标准差计算相对优势。更新目标含比率裁剪和参考策略 KL 项。"
        },
        {
          "icon": "→",
          "title": "接下来",
          "desc": "下一章讨论训练配置与工具库。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "工具池里有什么，如何训练？",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "ChartQA 与 Geometry3K 各随机抽 800 道训练题。每题生成四个候选，批量大小 8，使用 8 张 A100，AdamW 学习率 5×10⁻⁵，100 次迭代。",
      "analogy": {
        "title": "工具池里有什么，如何训练？",
        "text": "ChartQA 与 Geometry3K 各随机抽 800 道训练题。每题生成四个候选，批量大小 8，使用 8 张 A100，AdamW 学习率 5×10⁻⁵，100 次迭代。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "查看工具目录和训练参数",
          "desc": "",
          "componentId": "lab-6"
        }
      ],
      "takeaways": [
        {
          "icon": "◆",
          "title": "本章要点",
          "desc": "ChartQA 与 Geometry3K 各随机抽 800 道训练题。每题生成四个候选，批量大小 8，使用 8 张 A100，AdamW 学习率 5×10⁻⁵，100 次迭代。"
        },
        {
          "icon": "→",
          "title": "接下来",
          "desc": "下一章讨论实验与迁移。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "实验怎样检验选工具策略？",
      "badge": "both",
      "badgeLabel": "训练与推理",
      "bridge": "ChartQA 数值题容差 5%，Geometry3K 按正确选项计分。各子集和推理器协议分别比较。",
      "analogy": {
        "title": "实验怎样检验选工具策略？",
        "text": "ChartQA 数值题容差 5%，Geometry3K 按正确选项计分。各子集和推理器协议分别比较。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "主结果、消融与策略行为",
          "desc": "切换图表和表格，比较同一实验协议下的准确率。",
          "componentId": "lab-7"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "迁移与泛化",
          "desc": "",
          "componentId": "benchmark-transfer"
        }
      ],
      "takeaways": [
        {
          "icon": "◆",
          "title": "本章要点",
          "desc": "ChartQA 数值题容差 5%，Geometry3K 按正确选项计分。各子集和推理器协议分别比较。"
        },
        {
          "icon": "→",
          "title": "接下来",
          "desc": "下一章讨论部署边界。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "VisTA 支持哪些工具组合？",
      "badge": "both",
      "badgeLabel": "训练与推理",
      "bridge": "工具库预先人工指定。所选工具独立处理原图，论文框架不支持必须顺序消费中间产物的工具组合。",
      "analogy": {
        "title": "VisTA 支持哪些工具组合？",
        "text": "工具库预先人工指定。所选工具独立处理原图，论文框架不支持必须顺序消费中间产物的工具组合。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "同图取证与顺序依赖",
          "desc": "",
          "componentId": "lab-8"
        }
      ],
      "takeaways": [
        {
          "icon": "◆",
          "title": "本章要点",
          "desc": "工具库预先人工指定。所选工具独立处理原图，论文框架不支持必须顺序消费中间产物的工具组合。"
        },
        {
          "icon": "→",
          "title": "适用范围",
          "desc": "新工具仍需先纳入工具库。跨场景使用时需重新验证工具和推理器的配合。"
        }
      ]
    }
  ]
};
