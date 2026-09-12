import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "DeepSWE: Measuring Frontier Coding Agents on Original, Long-Horizon Engineering Tasks",
    "titleZh": "DeepSWE：原创长时程工程任务上的编程智能体评测",
    "venue": "arXiv · 2026",
    "authors": "Wenqi Huang · Charley Lee · Leonard Tng · Serena Ge",
    "affiliation": "Datacurve",
    "domain": "Coding Agents · Software Engineering Benchmark",
    "coreProblem": "公开补丁污染与继承测试可能让排行榜分数偏离智能体解决原创工程问题的能力。",
    "coreInsight": "DeepSWE用原创、未合并上游的长时程任务与面向可观察行为的手写验证器，在固定脚手架下测量前沿编程智能体。",
    "keywords": [
      "113项原创任务",
      "91个仓库",
      "5种语言",
      "功能验证器",
      "pass@k"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "传统公开补丁基准：任务容易规模偏短，公开答案与继承测试也可能影响分数可信度。"
    },
    "newMethod": {
      "desc": "DeepSWE：用原创长时程任务、功能验证器和统一实验协议，更聚焦持续完成真实工程改动的能力。"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "排行榜的高分陷阱",
      "badge": "inf",
      "badgeLabel": "评测设计",
      "bridge": "先别急着相信排行榜：Agent是能在代码仓库中查找、修改并运行测试的模型程序，我们要检查它所得分数背后的题目与裁判。",
      "analogy": {
        "title": "检查旧路线",
        "text": "把评测想成一次<b>单人攀岩</b>：检查旧岩壁路线，目标是识别隐藏风险。<span class=\"aside-note\">（类比用于建立直觉，论文结论以实验证据为准。）</span>",
        "componentId": "deepswe-lab-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "污染风险开关",
          "desc": "公开补丁与继承测试可能让分数偏离真实问题求解。<span class=\"interaction-note\">（操作：切换三种风险来源。）</span>",
          "componentId": "deepswe-lab-1"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "哪一个70%更可信？",
          "desc": "三个排行榜都显示70%，但证据条件不同。先判断哪一个更能支持“Agent解决了原创工程任务”。<span class=\"interaction-note\">（操作：先选择一个评测案例，再查看反馈。）</span>",
          "componentId": "deepswe-lab-1"
        }
      ],
      "insight": "高分可能混合了问题求解、答案回忆和测试缺陷。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "公开答案可能污染",
          "desc": "高分可能混合了问题求解、答案回忆和测试缺陷。"
        },
        {
          "icon": "🔧",
          "title": "继承测试可能误判",
          "desc": "页1-2：随合并修复继承的测试可能拒绝正确替代方案，也可能放过不完整实现。"
        },
        {
          "icon": "⚖️",
          "title": "先审题目与裁判",
          "desc": "（适用范围：论文给定的任务、脚手架、模型配置与评测时间。）"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "什么才叫长时程",
      "badge": "inf",
      "badgeLabel": "评测设计",
      "bridge": "上一章发现题目来源会影响可信度；现在看DeepSWE所说的长时程究竟是什么。",
      "analogy": {
        "title": "观察岩壁跨度",
        "text": "路线说明看起来不长，真正攀登却要跨越更宽的岩面、寻找更多落脚点。<span class=\"aside-note\">（对应短需求下的大规模、多文件工程改动。）</span>",
        "componentId": "deepswe-lab-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "任务剖面探针",
          "desc": "相对SWE-Bench Pro更短的提示，要求智能体自主定位并完成更大、跨更多文件的改动。<span class=\"interaction-note\">（操作：切换三项任务统计。）</span>",
          "componentId": "deepswe-lab-2"
        }
      ],
      "insight": "长时程指短需求下的大规模、多文件探索，不等于作者估算的人类工时。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "提示均值2158字符",
          "desc": "长时程指短需求下的大规模、多文件探索，不等于作者估算的人类工时。"
        },
        {
          "icon": "🔧",
          "title": "参考方案均值668行",
          "desc": "页5-6，图2：2158字符、668行、7.4文件。"
        },
        {
          "icon": "⚖️",
          "title": "平均修改7.4个文件",
          "desc": "（适用范围：论文给定的任务、脚手架、模型配置与评测时间。）"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "113项原创挑战",
      "badge": "inf",
      "badgeLabel": "评测设计",
      "bridge": "“113项原创挑战”指113个从零编写、评测时未合并上游的任务。任务很大仍不够，答案若已公开，Agent可能只是在回忆。",
      "analogy": {
        "title": "选择陌生路线",
        "text": "换到一条从未公开过的新路线，攀登者就更难依靠背熟的动作过关。<span class=\"aside-note\">（对应原创且评测时未合并上游的任务。）</span>",
        "componentId": "deepswe-lab-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "任务来源拖拽器",
          "desc": "原创且未合并上游的任务如何降低回忆公开答案的机会。<span class=\"interaction-note\">（操作：切换任务公开状态。）</span>",
          "componentId": "deepswe-lab-3"
        }
      ],
      "insight": "原创、评测时未合并上游与浅克隆降低已知的公开答案泄漏风险，但不能证明模型绝对没见过相关信息。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "任务从零编写",
          "desc": "任务从零编写，参考实现评测时不在上游；这是降低污染风险的设计，不是无污染证明。"
        },
        {
          "icon": "🔧",
          "title": "方案评测时不在上游",
          "desc": "页7 §3.3及页21：基础仓库和任务动机仍可能来自公开代码与issue。"
        },
        {
          "icon": "⚖️",
          "title": "公开后未来仍可能污染",
          "desc": "论文公开后，任务与参考解可能进入未来训练语料；“未上游”不等于“绝对未见”。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "覆盖91个真实仓库",
      "badge": "inf",
      "badgeLabel": "评测设计",
      "bridge": "“覆盖91个真实仓库”表示113项任务分散在91个开源项目中，而不是反复测试少数明星仓库。原创之外，还要控制仓库集中带来的偏差。",
      "analogy": {
        "title": "巡视不同岩区",
        "text": "如果比赛总在同一面明星岩壁上进行，成绩会偏向熟悉它的人；因此需要巡视不同岩区。<span class=\"aside-note\">（对应覆盖更多仓库与编程语言。）</span>",
        "componentId": "deepswe-lab-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "语料分布切换",
          "desc": "广泛覆盖仓库与语言，降低少数明星代码库主导排行榜的风险。<span class=\"interaction-note\">（操作：切换语言分布。）</span>",
          "componentId": "deepswe-lab-4"
        }
      ],
      "insight": "91个仓库让单一代码库更难主导总体分数。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "113个任务",
          "desc": "91个仓库让单一代码库更难主导总体分数。"
        },
        {
          "icon": "🔧",
          "title": "91个仓库",
          "desc": "页5-6，图3-4。"
        },
        {
          "icon": "⚖️",
          "title": "覆盖5种语言",
          "desc": "（适用范围：论文给定的任务、脚手架、模型配置与评测时间。）"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "功能验证器",
      "badge": "both",
      "badgeLabel": "评测设计",
      "bridge": "“功能验证器”是依据外部可观察行为判定补丁通过或失败的程序化裁判。有了多样任务，下一步是让裁判接受不同但正确的实现。",
      "analogy": {
        "title": "验证到顶行为",
        "text": "不同攀法都可能抵达同一顶点；裁判应检查是否真正登顶，而不是要求每个人复刻参考选手的手脚顺序。<span class=\"aside-note\">（对应按可观察行为评分的功能验证器。）</span>",
        "componentId": "deepswe-lab-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "验证器法庭",
          "desc": "Verifier（功能验证器）是依据测试给出通过或失败的程序化裁判；Judge则是复查完整轨迹和补丁的独立模型评审者。评分应检查外部行为，而不是强迫复刻参考实现。<span class=\"interaction-note\">（操作：切换三种实现结果。）</span>",
          "componentId": "deepswe-lab-5"
        }
      ],
      "insight": "功能验证器按可观察行为评分；较低的Judge分歧是支持性证据，不是验证器绝对正确的证明。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "检查外部行为",
          "desc": "评分目标应是需求对应的可观察行为，而不是内部符号是否与参考补丁一致。"
        },
        {
          "icon": "🔧",
          "title": "Judge分歧较少",
          "desc": "页8 §3.4、图5：在该样本与GPT-5.5 Judge下，DeepSWE为10/735（1.4%），SWE-Bench Pro为256/789（32.4%）。"
        },
        {
          "icon": "⚖️",
          "title": "分歧率不是错误率",
          "desc": "1.4%是Judge与验证器的分歧率，不是验证器错误率；Judge也可能误判，两组审计对象亦不完全相同。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "怎样公平跑Agent",
      "badge": "inf",
      "badgeLabel": "实验解读",
      "bridge": "可靠裁判仍需公平赛场；本章固定所有模型使用的脚手架。",
      "analogy": {
        "title": "同装备，才好比成绩",
        "text": "让每位攀登者使用同一套绳索、锚点和时间规则，成绩差异才更可能来自攀登者本身，而不是装备优势。<span class=\"aside-note\">（对应固定mini-swe-agent、共享提示和统一超时。）</span>",
        "componentId": "deepswe-lab-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "评测协议步进器",
          "desc": "脚手架是给模型提供提示、工具和执行循环的软件外壳；rollout是从接收任务到提交补丁的一次完整尝试。每个配置对每项任务计划运行约4次，排除基础设施错误后，各配置保留428–452次，16个配置合计7,174次计分运行。<span class=\"interaction-note\">（操作：切换协议环节，并展开配置表。）</span>",
          "componentId": "deepswe-lab-6"
        }
      ],
      "insight": "固定脚手架增强模型可比性，却不能代表完整产品体验。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "16种模型配置",
          "desc": "所有配置固定使用mini-swe-agent、共享系统提示与单一bash工具。"
        },
        {
          "icon": "🔧",
          "title": "9000秒超时",
          "desc": "页10 §5.2：9000秒超时，不设步数或成本上限。"
        },
        {
          "icon": "⚖️",
          "title": "错误计分有边界",
          "desc": "超时与上下文耗尽计失败；provider、验证器和网络错误被排除。少数任务因此不足4次有效运行。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "读懂pass@1与pass@4",
      "badge": "both",
      "badgeLabel": "实验解读",
      "bridge": "“pass@1”衡量单次运行的平均成功比例，“pass@4”衡量每项任务最多四次尝试中能否至少成功一次。协议固定后，还要分清稳定性与重试可达性。",
      "analogy": {
        "title": "同一路线，尝试四次",
        "text": "一次就登顶体现稳定性；允许四次，只要其中一次登顶，就体现小预算重试后的可达性。<span class=\"aside-note\">（对应pass@1与pass@4。）</span>",
        "componentId": "deepswe-lab-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "论文指标拆解器",
          "desc": "用实际运行结果理解按任务宏平均；另将独立重复概率作为单独的教学假设，避免混为一谈。<span class=\"interaction-note\">（操作：切换三种解释。）</span>",
          "componentId": "deepswe-lab-7"
        }
      ],
      "insight": "pass@1看单次可靠性，pass@4看小预算重试后的可达性。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "pass@1看可靠性",
          "desc": "pass@1看单次可靠性，pass@4看小预算重试后的可达性。"
        },
        {
          "icon": "🔧",
          "title": "pass@4看重试收益",
          "desc": "论文按每项任务四次实际运行是否至少成功一次计分，再对113项任务等权平均；不要求各次独立同分布。"
        },
        {
          "icon": "⚖️",
          "title": "按任务宏平均",
          "desc": "教学式1-(1-p)^4只有在每次独立且成功率固定时成立，不能据此反推论文报告的pass@4。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "不确定性与名次",
      "badge": "both",
      "badgeLabel": "实验解读",
      "bridge": "一个百分比没有误差范围；名次必须连同不确定性阅读。",
      "analogy": {
        "title": "别只看一次计时",
        "text": "同一位攀登者多次成绩会波动；两人的计时区间若大量重叠，就不能仅凭平均值断言谁一定更强。<span class=\"aside-note\">（对应论文报告的运行间95%置信区间。）</span>",
        "componentId": "deepswe-lab-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "置信区间比较器",
          "desc": "置信区间是兼顾点估计与运行波动的一段合理范围，不是模型真值的保证。比较论文报告的运行间95%区间；重叠或不重叠都不能替代正式差异检验。<span class=\"interaction-note\">（操作：切换三个模型配置。）</span>",
          "componentId": "deepswe-lab-8"
        }
      ],
      "insight": "论文区间反映运行间波动；区间重叠不证明相同，不重叠也不是正式的模型差异检验。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "报告运行间区间",
          "desc": "区间应与点估计一起读，但重叠或不重叠都不能替代正式差异检验。"
        },
        {
          "icon": "🔧",
          "title": "相邻区间可能重叠",
          "desc": "页12 §5.5。"
        },
        {
          "icon": "⚖️",
          "title": "任务抽样会给出更宽区间",
          "desc": "页12 §5.5：当前区间未计入更换任务集合带来的不确定性。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "轨迹里的失败模式",
      "badge": "inf",
      "badgeLabel": "实验解读",
      "bridge": "“轨迹”是Agent从阅读需求、查看文件、修改代码到运行测试的完整操作记录。总分只说成败，轨迹才能帮助定位失败发生在哪里。",
      "analogy": {
        "title": "回放停在失败点",
        "text": "只知道“没登顶”还不够；沿录像重放整条路线，才能定位是漏看要求、没有自检，还是裁判判断错配。<span class=\"aside-note\">（对应Agent完整操作轨迹审计。）</span>",
        "componentId": "deepswe-lab-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "KaTeX轨迹决策题",
          "desc": "真实任务：为KaTeX增加\\multicolumn，让数组单元格跨多列并支持左、中、右对齐。面对陌生解析链路，你会先做什么？<span class=\"interaction-note\">（操作：选择一种行动，查看它为何可靠或危险。）</span>",
          "componentId": "deepswe-lab-9"
        }
      ],
      "insight": "轨迹审计是结构化第二意见，不是真值判决。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "漏需求与未验证",
          "desc": "轨迹审计是结构化第二意见，不是真值判决。"
        },
        {
          "icon": "🔧",
          "title": "对照基准的gold泄漏",
          "desc": "页16-19 §7：`.git`读取gold commit发生在SWE-Bench Pro审计样本，并非DeepSWE任务。"
        },
        {
          "icon": "⚖️",
          "title": "Judge也可能有偏差",
          "desc": "（适用范围：论文给定的任务、脚手架、模型配置与评测时间。）"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、效率与边界",
      "badge": "both",
      "badgeLabel": "实验解读",
      "bridge": "“结果、效率与边界”要一起回答三件事：谁通过得更多、付出了多少资源，以及这些数字不能证明什么。最后把结论放回适用范围中解释。",
      "analogy": {
        "title": "登顶之后，读懂奖牌",
        "text": "登顶证明完成了这条指定路线，却不能证明在所有岩壁、装备和规则下都最强；还要结合耗时、成本和比赛规则解释成绩。<span class=\"aside-note\">（对应DeepSWE分数的能力范围与测量边界。）</span>",
        "componentId": "deepswe-lab-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "证据排行榜",
          "desc": "比较论文中的pass@1与运行间区间，同时明确这项测量不能推出哪些结论。下方提供论文、代码与轨迹来源。<span class=\"interaction-note\">（操作：切换三个模型配置。）</span>",
          "componentId": "deepswe-lab-10"
        }
      ],
      "insight": "DeepSWE是一项互补测量，不是模型或产品的全局总排名。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "GPT-5.5论文值70%",
          "desc": "DeepSWE是一项互补测量，不是模型或产品的全局总排名。"
        },
        {
          "icon": "🔧",
          "title": "资源投入不保证更高分",
          "desc": "页14、图8：在所测配置中，更多Token、更久时间或更高成本都不稳定地对应更高通过率。"
        },
        {
          "icon": "⚖️",
          "title": "不能从分数推出什么",
          "desc": "不能推出模型整体智力或产品体验排名，也不能代表代码可维护性、安全性、工程质量、真实成本收益，或证明所有验证器完整无漏洞。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1HnB7BjEAN",
      "title": "大模型评估完全指南",
      "reason": "包含SWE-bench与智能体评估背景",
      "views": "2.1万播放"
    },
    {
      "bvid": "BV17CoTBxEjM",
      "title": "四款AI编程Agent实战横向对比",
      "reason": "帮助区分基准分数与真实产品体验",
      "views": "10.7万播放"
    },
    {
      "bvid": "BV1Dc2xB6EUU",
      "title": "AgentBench大模型Agent性能横评",
      "reason": "直接补充智能体评测视角",
      "views": "611播放"
    }
  ]
};
