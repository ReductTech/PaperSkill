import type { TutorialData } from "../types";

// Official import source for the current eight-chapter LwF learning spine.
export const tutorial: TutorialData = {
  meta: {
    titleEn: "Learning without Forgetting",
    titleZh: "不遗忘学习",
    venue: "ECCV 2016 · arXiv:1606.09282v3",
    authors: "Zhizhong Li · Derek Hoiem",
    affiliation: "论文首页未列机构",
    domain: "视觉分类与连续任务学习",
    coreProblem: "无法访问旧任务训练数据时，怎样给已有卷积网络添加新预测能力并限制旧能力退化？",
    coreInsight: "用旧模型在新任务输入上的旧任务响应作软约束，同时用新标签学习新任务。",
    keywords: ["持续学习", "知识蒸馏", "卷积神经网络"],
  },
  hero: {
    oldMethod: {
      desc: "直接微调会更新共享层，旧任务表现存在退化风险。",
      componentId: "lwf-hero",
    },
    newMethod: {
      desc: "LwF 在同一新输入上匹配旧响应，并学习新任务标签。",
      componentId: "lwf-hero",
    },
  },
  chapters: [
    {
      "kind": "chapter",
      "id": "chap-00",
      "title": "问题设定",
      "badge": "inf",
      "badgeLabel": "问题设定",
      "bridge": "先确认旧模型仍可运行、旧训练数据不可访问，而当前任务输入与标签可用。",
      "analogy": {
        "title": "本章焦点",
        "text": "旧模型能处理当前新输入；旧任务训练样本与标签仍不可用。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "00.1",
          "title": "核对问题条件",
          "desc": "切换常见训练路线，查看它们对新任务适应、旧任务保持与旧数据的不同要求。",
          "componentId": "problem-compare"
        }
      ],
      "insight": "LwF 用旧模型对当前输入的响应提供旧任务参照，不取回旧训练数据。",
      "takeaways": [
        {
          "icon": "▣",
          "title": "旧模型可用",
          "desc": "已有模型仍能对当前输入产生预测。"
        },
        {
          "icon": "∅",
          "title": "旧训练数据不可用",
          "desc": "适配不依赖旧任务训练图像与标签。"
        },
        {
          "icon": "＋",
          "title": "新任务数据可用",
          "desc": "当前输入与新标签提供新增任务监督。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-01",
      "title": "模型结构",
      "badge": "inf",
      "badgeLabel": "模型结构",
      "bridge": "识别固定的 Teacher、可训练的 Student、共享主体和任务专属输出头。",
      "analogy": {
        "title": "本章焦点",
        "text": "共享表示连接旧、新任务 head；Teacher 保留旧模型状态。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "01.1",
          "title": "检查 Teacher 与 Student",
          "desc": "交互查看共享参数、任务专属 head 和模型分工。",
          "componentId": "architecture-map"
        }
      ],
      "insight": "Teacher 提供旧行为目标；Student 保留旧 head 并新增当前任务 head。",
      "takeaways": [
        {
          "icon": "T",
          "title": "Teacher 固定",
          "desc": "它在当前适配阶段提供旧任务响应。"
        },
        {
          "icon": "S",
          "title": "Student 更新",
          "desc": "新旧目标会影响 Student 的共享主体。"
        },
        {
          "icon": "↗",
          "title": "新增任务 head",
          "desc": "每个任务可以保留自己的输出头。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-02",
      "title": "关键做法",
      "badge": "both",
      "badgeLabel": "核心做法",
      "bridge": "旧模型对当前新任务输入给出旧任务响应；该响应成为 Student 的旧任务目标。",
      "analogy": {
        "title": "本章焦点",
        "text": "Teacher 与 Student 处理同一批当前输入，监督来源按任务区分。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "02.1",
          "title": "选择监督信号来源",
          "desc": "切换旧响应、新任务标签与不可用旧样本，观察它们服务的训练目标。",
          "componentId": "signal-source"
        }
      ],
      "insight": "旧任务响应是当前输入上的模型输出，不是旧样本或旧标签。",
      "takeaways": [
        {
          "icon": "X",
          "title": "使用当前输入",
          "desc": "同一新任务输入进入 Teacher 与 Student。"
        },
        {
          "icon": "Yₒ",
          "title": "读取旧响应",
          "desc": "Teacher 生成当前输入上的旧任务目标。"
        },
        {
          "icon": "Yₙ",
          "title": "监督新任务",
          "desc": "当前真实标签监督新任务输出。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-03",
      "title": "一次训练",
      "badge": "trn",
      "badgeLabel": "训练过程",
      "bridge": "跟随一次 minibatch 的 forward、损失、反向传播与参数更新。",
      "analogy": {
        "title": "本章焦点",
        "text": "目标先产生梯度；Student 参数只在更新步骤后改变。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "03.1",
          "title": "逐步执行一个训练周期",
          "desc": "手动查看前向计算、旧响应与新任务损失、梯度传递和 Student 更新。",
          "componentId": "training-steps"
        }
      ],
      "insight": "L_old 和 L_new 在共享参数上共同作用；Teacher 保持固定。",
      "takeaways": [
        {
          "icon": "1",
          "title": "先前向",
          "desc": "Teacher 与 Student 对当前输入产生输出。"
        },
        {
          "icon": "2",
          "title": "再合并目标",
          "desc": "旧响应损失与新标签损失组成训练目标。"
        },
        {
          "icon": "3",
          "title": "最后更新",
          "desc": "优化器在反向计算后改变 Student。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-04",
      "title": "机制与边界",
      "badge": "both",
      "badgeLabel": "机制与边界",
      "bridge": "解释 LwF 保持什么、多个目标如何影响共享参数，以及当前输入没有约束到哪里。",
      "analogy": {
        "title": "本章焦点",
        "text": "响应保持作用于当前可观察输入；参数距离与未观察区域是不同问题。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "04.1",
          "title": "比较参数保持与响应保持",
          "desc": "在同一输入上比较 Teacher 与 Student 的旧任务响应，并切换到参数位置视图。",
          "componentId": "lwf-preservation-compare"
        },
        {
          "kind": "module",
          "id": "04.2",
          "title": "检查共同优化目标",
          "desc": "查看旧响应权重、温度和新任务目标如何共同影响共享参数。",
          "componentId": "lwf-objective-balance"
        },
        {
          "kind": "module",
          "id": "04.3",
          "title": "检查输入覆盖边界",
          "desc": "调整示意覆盖状态，区分当前目标约束与未观察的旧域行为。",
          "componentId": "lwf-coverage-boundary"
        }
      ],
      "insight": "匹配 Xₙ 上的旧响应不等于 Student 在整个旧输入域上保持不变。",
      "takeaways": [
        {
          "icon": "Y",
          "title": "保持响应",
          "desc": "LwF 约束当前输入上的旧任务输出行为。"
        },
        {
          "icon": "λ",
          "title": "平衡目标",
          "desc": "旧、新任务损失共同影响共享参数。"
        },
        {
          "icon": "…",
          "title": "承认覆盖边界",
          "desc": "没有进入当前输入的区域不受本轮直接约束。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-05",
      "title": "连续任务",
      "badge": "trn",
      "badgeLabel": "连续任务",
      "bridge": "将一次训练提升到任务阶段：完成后的 Student 成为下一阶段 Teacher。",
      "analogy": {
        "title": "本章焦点",
        "text": "每个新阶段都在当前输入上重新生成已有任务的响应目标。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "05.1",
          "title": "跟随任务级状态机",
          "desc": "手动推进冻结 Teacher、接收新任务、生成响应、适配 Student 与下一任务交接。",
          "componentId": "lwf-task-handoff"
        }
      ],
      "insight": "上一阶段的响应目标不是永久缓存；新阶段由当前 Teacher 在当前输入上重算。",
      "takeaways": [
        {
          "icon": "T",
          "title": "固定阶段 Teacher",
          "desc": "上一阶段模型提供旧任务响应。"
        },
        {
          "icon": "↻",
          "title": "刷新响应目标",
          "desc": "当前输入到来后重新计算旧任务响应。"
        },
        {
          "icon": "→",
          "title": "交接 Student",
          "desc": "更新模型成为下一阶段的 Teacher。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-06",
      "title": "论文证据",
      "badge": "inf",
      "badgeLabel": "论文证据",
      "bridge": "先读实验协议，再把主张与论文表格、曲线、解释和结论边界对应起来。",
      "analogy": {
        "title": "本章焦点",
        "text": "实验结果只支持与其数据集、模型、指标和协议相符的结论。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "06.1",
          "title": "核验主张与证据",
          "desc": "选择论文证据并判断结论是 Supported、Too Strong 还是 Unsupported。",
          "componentId": "lwf-evidence-explorer"
        }
      ],
      "insight": "局部实验结果不能推出 LwF 消除遗忘或普遍优于所有基线。",
      "takeaways": [
        {
          "icon": "P",
          "title": "先核对协议",
          "desc": "确认任务、架构、划分和指标。"
        },
        {
          "icon": "E",
          "title": "再看证据",
          "desc": "读取原表、原图和作者报告。"
        },
        {
          "icon": "B",
          "title": "最后看边界",
          "desc": "避免将有限结果扩大为普遍保证。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-07",
      "title": "完整回放",
      "badge": "both",
      "badgeLabel": "完整回放",
      "bridge": "沿着独立的模型轨迹，从旧模型走到下一阶段 Teacher。",
      "analogy": {
        "title": "本章焦点",
        "text": "旧响应、新任务监督与模型交接组成可重复的任务生命周期。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "07.1",
          "title": "回放模型生命周期轨迹",
          "desc": "沿九个检查点查看输入、输出、参数状态与模型交接；联合训练步骤可回看 Chapter 03。",
          "componentId": "lwf-grand-trail"
        }
      ],
      "insight": "完整流程以更新后的 Student 成为下一阶段 Teacher 收尾。",
      "takeaways": [
        {
          "icon": "1",
          "title": "旧模型仍可用",
          "desc": "即使旧训练样本不可访问，模型仍提供旧响应。"
        },
        {
          "icon": "2",
          "title": "两个目标共同训练",
          "desc": "旧响应保持与新任务学习影响共享 Student 参数。"
        },
        {
          "icon": "↻",
          "title": "任务阶段闭环",
          "desc": "当前 Student 成为下一阶段 Teacher。"
        }
      ]
    }
  ],
};
