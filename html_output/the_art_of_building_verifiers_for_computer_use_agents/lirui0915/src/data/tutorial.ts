import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "The Art of Building Verifiers for Computer Use Agents",
    "titleZh": "计算机操作智能体验证器的构建之道",
    "venue": "arXiv 2604.06240v1",
    "authors": "Corby Rosset, Pratyusha Sharma, Andrew Zhao, Miguel Gonzalez-Fernandez, Ahmed Awadallah",
    "affiliation": "Microsoft Research · Browserbase",
    "domain": "电脑操作智能体 · 多模态验证 · 奖励设计",
    "coreProblem": "代理说完成了，用户的目标真的实现了吗？",
    "coreInsight": "把操作轨迹当作待校对的稿件：Universal Verifier 按清单核查证据、定位差错，分别判断“执行是否合理”与“目标是否达成”。",
    "keywords": [
      "Universal Verifier",
      "过程与结果",
      "截图证据",
      "CUAVerifierBench"
    ]
  },
  "hero": {
    "oldMethod": {
      "componentId": "hero-old",
      "desc": "像审阅整份校样：WebVoyager 结合截图与最终答复判断成功；WebJudge 先按任务要点筛选截图，再结合动作历史作结果判断（原文 §2）。"
    },
    "newMethod": {
      "componentId": "hero-new",
      "desc": "像按委托清单逐项校对：从全轨迹中为每项标准选取相关截图，用证据核查自述、处理条件与失败归因，再分别报告过程分、结果标签和失败诊断。"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "说完成了，真的完成了吗？",
      "badge": "inf",
      "badgeLabel": "论文精读",
      "bridge": "代理自述不能替代可核验的结果。",
      "analogy": {
        "title": "放大镜扫过校样的一处错字",
        "text": "校样上的错字不会因为作者说‘已校对’就消失。验证器必须回到证据。",
        "componentId": "analogy-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "说完成了，真的完成了吗？",
          "desc": "代理自述不能替代可核验的结果。",
          "componentId": "evidence-compare"
        }
      ],
      "insight": "代理自述不能替代可核验的结果。",
      "takeaways": [
        {
          "icon": "🧭",
          "title": "验证轨迹",
          "desc": "任务目标、动作、截图和最终答复都可能重要。"
        },
        {
          "icon": "🔎",
          "title": "自述需核实",
          "desc": "合理的语气不等于有证据。"
        },
        {
          "icon": "✍️",
          "title": "重视差异",
          "desc": "图5中的2.8与6.2改变了事实。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-background",
      "title": "已有验证器如何判断？",
      "badge": "both",
      "badgeLabel": "背景与相关工作",
      "bridge": "第1节提出“自述不等于完成”。论文 §2 接着回顾既有验证器的证据入口，以及从结果判断走向过程评价与失败诊断的研究。",
      "analogy": {
        "title": "书签标记校样中需要检查的一段",
        "text": "通读校样与按问题定位段落，会得到不同的证据覆盖。书签帮助定位，却不能替代对内容的判断。",
        "componentId": "background-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "比较三种验证器的证据与策略",
          "desc": "切换方法，查看截图、动作历史、最终答复和评分标准是否参与判断。",
          "componentId": "background-methods"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "相关工作：从成功标签到过程与诊断",
          "desc": "切换研究线索，区分失败定位、多维评估以及过程/结果奖励。",
          "componentId": "background-research"
        }
      ],
      "insight": "证据入口、评价对象与输出粒度不同，决定验证器能发现什么，也决定其盲区。",
      "takeaways": [
        {
          "icon": "🔎",
          "title": "先看证据入口",
          "desc": "不同方法不一定同时使用截图、动作历史、最终答复与rubric。"
        },
        {
          "icon": "⚖️",
          "title": "不只判断成功",
          "desc": "失败位置、副作用、重复与过程质量提供不同的改进信号。"
        },
        {
          "icon": "📌",
          "title": "区分比较协议",
          "desc": "相关工作历史成绩不与本文主表混排；机制差异还需实验检验。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "先写好评分标准",
      "badge": "inf",
      "badgeLabel": "论文精读",
      "bridge": "具体且不重叠的标准避免幽灵要求。",
      "analogy": {
        "title": "橡皮擦掉校样清单里多余的一行",
        "text": "校对委托只要求检查内容，不能临时把装帧也算成缺陷。多余要求会把分母越写越大。",
        "componentId": "analogy-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "先写好评分标准",
          "desc": "具体且不重叠的标准避免幽灵要求。",
          "componentId": "rubric-repair"
        }
      ],
      "insight": "具体且不重叠的标准避免幽灵要求。",
      "takeaways": [
        {
          "icon": "📋",
          "title": "先任务后轨迹",
          "desc": "初始标准只根据任务生成。"
        },
        {
          "icon": "🧽",
          "title": "排除幽灵标准",
          "desc": "不把额外偏好当成用户要求。"
        },
        {
          "icon": "🧩",
          "title": "避免重叠",
          "desc": "每一条对应可独立评价的子目标。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "过程做对，不代表结果完成",
      "badge": "both",
      "badgeLabel": "论文精读",
      "bridge": "过程质量与用户目标是否达成是两个信号。",
      "analogy": {
        "title": "印章压在校样的过程验收栏",
        "text": "编辑认真完成了校对，但印刷被停电阻断：工作质量与成品交付要分开记录。",
        "componentId": "analogy-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "过程做对，不代表结果完成",
          "desc": "过程质量与用户目标是否达成是两个信号。",
          "componentId": "process-outcome"
        }
      ],
      "insight": "过程质量与用户目标是否达成是两个信号。",
      "takeaways": [
        {
          "icon": "⚖️",
          "title": "独立信号",
          "desc": "过程分与结果标签不能互相替代。"
        },
        {
          "icon": "🚧",
          "title": "归因有条件",
          "desc": "环境免责要求合理尝试和如实报告。"
        },
        {
          "icon": "🎯",
          "title": "结果看意图",
          "desc": "替代路径不得违反用户硬性约束。"
        }
      ],
      "formula": {
        "lead": "验证器同时输出过程分、结果标签和失败诊断。",
        "unicode": "V(g, τ) = (r_proc, r_out, d)",
        "symbols": [
          {
            "sym": "g",
            "desc": "自然语言目标"
          },
          {
            "sym": "τ",
            "desc": "完整轨迹"
          },
          {
            "sym": "r_proc",
            "desc": "[0,1]过程分"
          },
          {
            "sym": "r_out",
            "desc": "0或1的结果标签"
          },
          {
            "sym": "d",
            "desc": "失败诊断"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "条件不成立，分母也要改变",
      "badge": "both",
      "badgeLabel": "论文精读",
      "bridge": "只对适用的标准加权归一化。",
      "analogy": {
        "title": "尺子缩短校样的有效评分范围",
        "text": "不适用的校对项目应从评分尺上拿掉，不是保留满分却给零分。",
        "componentId": "analogy-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "条件不成立，分母也要改变",
          "desc": "只对适用的标准加权归一化。",
          "componentId": "conditional-score"
        }
      ],
      "insight": "只对适用的标准加权归一化。",
      "takeaways": [
        {
          "icon": "🧮",
          "title": "适用集合A",
          "desc": "条件由执行证据决定。"
        },
        {
          "icon": "➗",
          "title": "同删分子分母",
          "desc": "不适用不是简单打零分。"
        },
        {
          "icon": "0️⃣",
          "title": "0.8是阈值",
          "desc": "只用于过程标签二值化，不自动决定结果成功。"
        }
      ],
      "formula": {
        "lead": "过程分只在适用条目集合上归一化。",
        "unicode": "r_proc = Σᵢ∈A earnedᵢ / Σᵢ∈A maxᵢ",
        "symbols": [
          {
            "sym": "A",
            "desc": "实际适用的条目集合"
          },
          {
            "sym": "earnedᵢ",
            "desc": "第i项所得分"
          },
          {
            "sym": "maxᵢ",
            "desc": "第i项最高分"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "一个根本错误，不重复扣三次",
      "badge": "both",
      "badgeLabel": "论文精读",
      "bridge": "级联无关评分保留根因扣分但不重复惩罚后续一致行为。",
      "analogy": {
        "title": "红笔只圈出校样的原始错误",
        "text": "一个错字被后文引用了两次，校对时要定位源头，而非假装出现了三个独立错误。",
        "componentId": "analogy-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "一个根本错误，不重复扣三次",
          "desc": "级联无关评分保留根因扣分但不重复惩罚后续一致行为。",
          "componentId": "cascade-trace"
        }
      ],
      "insight": "级联无关评分保留根因扣分但不重复惩罚后续一致行为。",
      "takeaways": [
        {
          "icon": "📍",
          "title": "保留根因",
          "desc": "防止重复扣分不等于不扣分。"
        },
        {
          "icon": "🧠",
          "title": "局部合理性",
          "desc": "按当时信息判断下游动作。"
        },
        {
          "icon": "🚫",
          "title": "结果仍失败",
          "desc": "内部自洽不保证满足用户目标。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "证据可能藏在第3张截图",
      "badge": "inf",
      "badgeLabel": "论文精读",
      "bridge": "从评分转向多模态输入，展示相关性和top-k。",
      "analogy": {
        "title": "放大镜横移扫描整张校样",
        "text": "只看校样最后一行，会错过开头已经出现的错误。带着明确问题检查，才能找到相关证据。",
        "componentId": "analogy-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "证据可能藏在第3张截图",
          "desc": "全轨迹扫描后按每项标准选图优于只截取末尾。",
          "componentId": "screenshot-select"
        }
      ],
      "insight": "全轨迹扫描后按每项标准选图优于只截取末尾。",
      "takeaways": [
        {
          "icon": "🔎",
          "title": "全量参与筛选",
          "desc": "截图不能因位置靠前直接被遗忘。"
        },
        {
          "icon": "🧾",
          "title": "逐标准选证据",
          "desc": "不同子目标有不同的相关帧。"
        },
        {
          "icon": "⚠️",
          "title": "筛选仍有风险",
          "desc": "相关性判断与最终推理都可能出错。"
        }
      ],
      "formula": {
        "lead": "相关性矩阵为每帧、每项标准记录分数，并限制每项证据数量。",
        "unicode": "R ∈ ℝ⁽ᵀ⁺¹⁾×ᴺ，|Sⱼ| ≤ k",
        "symbols": [
          {
            "sym": "T",
            "desc": "动作步数，截图数为T+1"
          },
          {
            "sym": "N",
            "desc": "评分标准条目数"
          },
          {
            "sym": "k",
            "desc": "每项最多选取的截图数"
          },
          {
            "sym": "R",
            "desc": "截图与标准的相关性矩阵"
          },
          {
            "sym": "Sⱼ",
            "desc": "第j项选择的截图集合"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "让截图推翻自述",
      "badge": "both",
      "badgeLabel": "论文精读",
      "bridge": "选到证据之后，判断它如何支持或反驳陈述。",
      "analogy": {
        "title": "透明校样片覆在原稿上对齐差异",
        "text": "把原稿和校样叠在一起，缺字、改字和多字才会显现；不能替作者把没写的内容脑补完整。",
        "componentId": "analogy-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "让截图推翻自述",
          "desc": "两遍评分与视觉证据分类减少补脑式判断。",
          "componentId": "evidence-taxonomy"
        }
      ],
      "insight": "两遍评分与视觉证据分类减少补脑式判断。",
      "takeaways": [
        {
          "icon": "🔁",
          "title": "分两遍看",
          "desc": "先动作文本，再用截图整体校验。"
        },
        {
          "icon": "📸",
          "title": "截图优先",
          "desc": "显式矛盾不能被流畅叙述掩盖。"
        },
        {
          "icon": "✅",
          "title": "不是一律苛刻",
          "desc": "有根据的推断与视觉确认可接受。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "把原则接成一个验证器",
      "badge": "both",
      "badgeLabel": "论文精读",
      "bridge": "汇总前七章，展示Algorithm 1实际结构，不虚构神经网络。",
      "analogy": {
        "title": "夹子固定校样与审阅记录",
        "text": "用夹子把校样和审阅记录固定在一起，结论才能一直追溯到对应证据。",
        "componentId": "analogy-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "把原则接成一个验证器",
          "desc": "完整系统从任务标准到证据分析再到三个输出。",
          "componentId": "verifier-pipeline"
        }
      ],
      "insight": "完整系统从任务标准到证据分析再到三个输出。",
      "takeaways": [
        {
          "icon": "🧩",
          "title": "按功能分工",
          "desc": "系统图是验证流程，不是新网络架构。"
        },
        {
          "icon": "🧭",
          "title": "保留诊断",
          "desc": "除了分数，还要定位失败类型和位置。"
        },
        {
          "icon": "🗳️",
          "title": "投票可选",
          "desc": "重复重评分时过程取中位数，结果取多数票。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "验证器可靠吗？",
      "badge": "both",
      "badgeLabel": "论文精读",
      "bridge": "方法能否带来可靠判断？先看§5如何构造参考标签，再用§6的主结果、消融与分歧研究检验其收益和代价。",
      "analogy": {
        "title": "验收印章压在已经核对的校样上",
        "text": "验收要同时看错放和错拦：拦住错误稿件重要，但也不能把合格稿件全退回。",
        "componentId": "analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "Experiments：实验如何设计",
          "desc": "切换研究问题、数据集与标注阶段，理解比较对象和参考标签的形成。",
          "componentId": "experiment-protocol"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "Results：结果说明了什么",
          "desc": "交互比较两数据集、两标签、五指标，并探索模型消融、人工一致性与自动研究。",
          "componentId": "experiment-results"
        }
      ],
      "insight": "低误报是重要收益，但需同时报告漏报、参考标签协议和实验不确定性。",
      "takeaways": [
        {
          "icon": "📐",
          "title": "先明确协议",
          "desc": "Internal140条；Browserbase106条。主表Browserbase使用知情聚合标签。"
        },
        {
          "icon": "⚖️",
          "title": "联合阅读指标",
          "desc": "UV减少假成功，但并非漏报最低；同骨干与固定rubric回答不同问题。"
        },
        {
          "icon": "🔎",
          "title": "保留证据边界",
          "desc": "验证器分歧不等于金标准，自动研究同集迭代不等于独立泛化。"
        }
      ]
    }
  ]
};
