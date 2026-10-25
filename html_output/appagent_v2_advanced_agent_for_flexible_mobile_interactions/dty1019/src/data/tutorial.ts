import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "AppAgent v2: Advanced Agent for Flexible Mobile Interactions",
    "titleZh": "AppAgent v2：面向灵活移动交互的智能体",
    "venue": "arXiv:2408.11824v4 · 2025",
    "authors": "Yanda Li, Chi Zhang, Wenjia Jiang, Wanqi Yang, Bin Fu, Pei Cheng, Xin Chen, Ling Chen, Yunchao Wei",
    "affiliation": "论文未指定单一机构",
    "domain": "多模态大模型智能体 · 移动端视觉交互",
    "coreProblem": "移动智能体面对自定义控件、陌生界面和跨应用任务时，固定标识或单纯视觉猜测都可能失效。",
    "coreInsight": "将 Android 结构化信息与 OCR、检测和视觉特征互补使用，通过探索记录界面知识，并在部署时按需检索；遇到敏感步骤时转由人处理。",
    "keywords": [
      "多模态智能体",
      "Android GUI",
      "视觉交互",
      "检索增强"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "<b>固定标识 / 坐标</b>可能覆盖不到自定义控件。",
      "componentId": "field-scene"
    },
    "newMethod": {
      "desc": "<b>结构信息 + 视觉线索</b>互补，探索笔记按需检索。",
      "componentId": "field-scene"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "为什么“看见控件”仍会点错",
      "badge": "inf",
      "badgeLabel": "问题与机制",
      "bridge": "从固定标识的盲区出发，理解结构化解析与视觉补充各自能做什么。",
      "analogy": {
        "title": "取景框里的盲区",
        "text": "取景框可以框住自定义图标，却不能仅凭外观证明它可点击。",
        "componentId": "field-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "切换界面证据",
          "desc": "试试只依赖结构信息，再加入 OCR 与检测线索。视觉外观仍不能单独证明控件可点击。",
          "componentId": "field-scene"
        }
      ],
      "takeaways": [
        {
          "icon": "◎",
          "title": "证据有盲区",
          "desc": "先辨认资料来源与缺口，再采取动作。"
        },
        {
          "icon": "↗",
          "title": "视觉补充结构",
          "desc": "把类比当成理解支架，仍以论文描述为准。"
        },
        {
          "icon": "✓",
          "title": "候选不等于可点",
          "desc": "遇到证据不足时保留不确定性。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "让动作适配当前界面",
      "badge": "inf",
      "badgeLabel": "问题与机制",
      "bridge": "智能体需要一组适配当前界面证据的移动端动作。",
      "analogy": {
        "title": "点下快门",
        "text": "为一个明确目标选择合适的触屏动作，而不是把所有情况都当作点击。",
        "componentId": "field-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "选择一个移动动作",
          "desc": "AppAgent v2 的动作接口覆盖点击、输入、长按、滑动、导航、等待与停止。",
          "componentId": "field-scene"
        }
      ],
      "takeaways": [
        {
          "icon": "◎",
          "title": "动作有多种",
          "desc": "先辨认资料来源与缺口，再采取动作。"
        },
        {
          "icon": "↗",
          "title": "动作匹配证据",
          "desc": "把类比当成理解支架，仍以论文描述为准。"
        },
        {
          "icon": "✓",
          "title": "不确定时先观察",
          "desc": "遇到证据不足时保留不确定性。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "两种证据拼成界面理解",
      "badge": "inf",
      "badgeLabel": "问题与机制",
      "bridge": "结构化 UI 与 OCR、检测得到的视觉信息互补，帮助定位控件。",
      "analogy": {
        "title": "放大屏幕角标",
        "text": "放大一个小图标，分别检查层级、文字、视觉特征或位置。",
        "componentId": "field-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "检查界面证据来源",
          "desc": "选择一类证据，观察它能揭示什么；这里的界面内容是教学示意，不是论文数据。",
          "componentId": "field-scene"
        }
      ],
      "takeaways": [
        {
          "icon": "◎",
          "title": "XML 提供结构",
          "desc": "先辨认资料来源与缺口，再采取动作。"
        },
        {
          "icon": "↗",
          "title": "OCR 读取文字",
          "desc": "把类比当成理解支架，仍以论文描述为准。"
        },
        {
          "icon": "✓",
          "title": "坐标定位元素",
          "desc": "遇到证据不足时保留不确定性。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "用前后变化反思探索动作",
      "badge": "inf",
      "badgeLabel": "问题与机制",
      "bridge": "智能体对比操作前后截图并反思相关性；判断仍可能出错。",
      "analogy": {
        "title": "核对一次前后变化",
        "text": "对照操作前后的界面变化，判断它是否与当前任务有关。",
        "componentId": "field-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "逐条检查探索记录",
          "desc": "步进查看三个示意情境：任务相关、无关操作和证据不足。",
          "componentId": "field-scene"
        }
      ],
      "takeaways": [
        {
          "icon": "◎",
          "title": "前后截图提供证据",
          "desc": "先辨认资料来源与缺口，再采取动作。"
        },
        {
          "icon": "↗",
          "title": "无关动作可标记",
          "desc": "把类比当成理解支架，仍以论文描述为准。"
        },
        {
          "icon": "✓",
          "title": "反思并非总正确",
          "desc": "遇到证据不足时保留不确定性。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "人类引导能补足陌生界面",
      "badge": "both",
      "badgeLabel": "方法与证据",
      "bridge": "论文同时描述智能体自主探索和人工引导探索，后者不是全自动过程。",
      "analogy": {
        "title": "把现场观察记进本子",
        "text": "陌生界面难判断时，由人引导一次操作并观察屏幕变化。",
        "componentId": "field-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "选择探索方式",
          "desc": "比较 agent-driven 与 manual exploration 的角色差异。",
          "componentId": "field-scene"
        }
      ],
      "takeaways": [
        {
          "icon": "◎",
          "title": "自主探索可能误判",
          "desc": "先辨认资料来源与缺口，再采取动作。"
        },
        {
          "icon": "↗",
          "title": "人工引导观察",
          "desc": "把类比当成理解支架，仍以论文描述为准。"
        },
        {
          "icon": "✓",
          "title": "不是自动消错",
          "desc": "遇到证据不足时保留不确定性。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "把界面知识组织成可查记录",
      "badge": "trn",
      "badgeLabel": "系统方法",
      "bridge": "知识文档把观察到的多类 UI 信息组织起来，部署时也可更新。",
      "analogy": {
        "title": "翻开一条器材笔记",
        "text": "打开一条现场笔记，查看它记录的是标识、文字、视觉特征、坐标还是功能解释。",
        "componentId": "field-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "检查知识文档字段",
          "desc": "示意记录可包含 Android ID、可见文字、视觉特征、坐标和功能解释。",
          "componentId": "field-scene"
        }
      ],
      "takeaways": [
        {
          "icon": "◎",
          "title": "记录多类信息",
          "desc": "先辨认资料来源与缺口，再采取动作。"
        },
        {
          "icon": "↗",
          "title": "功能是解释",
          "desc": "把类比当成理解支架，仍以论文描述为准。"
        },
        {
          "icon": "✓",
          "title": "文档可能不完整",
          "desc": "遇到证据不足时保留不确定性。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "按当前线索检索相关笔记",
      "badge": "trn",
      "badgeLabel": "系统方法",
      "bridge": "自查询检索器可将文档内容嵌入向量库，再依据 ID 或 OCR 信息检索。",
      "analogy": {
        "title": "凭画面线索找笔记",
        "text": "以屏幕上的一条线索查找相关笔记；常见任务也可能不加载文档。",
        "componentId": "field-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "选择当前检索线索",
          "desc": "切换资源 ID、OCR 文字或不加载文档，观察检索记录如何变化。",
          "componentId": "field-scene"
        }
      ],
      "takeaways": [
        {
          "icon": "◎",
          "title": "线索触发检索",
          "desc": "先辨认资料来源与缺口，再采取动作。"
        },
        {
          "icon": "↗",
          "title": "检索按需发生",
          "desc": "把类比当成理解支架，仍以论文描述为准。"
        },
        {
          "icon": "✓",
          "title": "常见任务可不加载",
          "desc": "遇到证据不足时保留不确定性。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "探索与部署构成两阶段系统",
      "badge": "trn",
      "badgeLabel": "系统方法",
      "bridge": "探索形成可复用的界面知识；部署按需查询并可更新记录。",
      "analogy": {
        "title": "对焦当前系统阶段",
        "text": "点选系统节点，查看探索、知识记录和部署之间的关系。",
        "componentId": "field-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "探索 AppAgent v2 的两阶段结构",
          "desc": "选择节点查看其职责；部署可以使用已有文档，也可以在常见任务中省略它。",
          "componentId": "field-scene"
        }
      ],
      "takeaways": [
        {
          "icon": "◎",
          "title": "探索观察界面",
          "desc": "先辨认资料来源与缺口，再采取动作。"
        },
        {
          "icon": "↗",
          "title": "部署按需检索",
          "desc": "把类比当成理解支架，仍以论文描述为准。"
        },
        {
          "icon": "✓",
          "title": "新证据可更新",
          "desc": "遇到证据不足时保留不确定性。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "敏感步骤暂停，跨应用继续",
      "badge": "both",
      "badgeLabel": "方法与证据",
      "bridge": "论文描述敏感操作转人工，以及根据任务进度继续跨应用任务；二者都不应被夸大为普遍保证。",
      "analogy": {
        "title": "分享前停在确认页",
        "text": "在可能涉及个人信息的分享动作前停下来，先由用户确认。",
        "componentId": "field-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "遇到敏感操作时怎么办",
          "desc": "切换普通与敏感步骤。论文中的 safeguard 会暂停自动化并转为人工处理。",
          "componentId": "field-scene"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "切换任务所在应用",
          "desc": "查看跨应用任务的进度切换。论文描述该能力，但不保证所有应用都可靠。",
          "componentId": "field-scene"
        }
      ],
      "takeaways": [
        {
          "icon": "◎",
          "title": "敏感步骤暂停",
          "desc": "先辨认资料来源与缺口，再采取动作。"
        },
        {
          "icon": "↗",
          "title": "人工接手",
          "desc": "把类比当成理解支架，仍以论文描述为准。"
        },
        {
          "icon": "✓",
          "title": "跨应用需看进度",
          "desc": "遇到证据不足时保留不确定性。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "看懂基准成绩，也看见失效边界",
      "badge": "both",
      "badgeLabel": "方法与证据",
      "bridge": "把成功率与对应评测协议一起读，再检查论文报告的解析局限。",
      "analogy": {
        "title": "对照成片与参考",
        "text": "将一组结果放在其评测设置中比较，不把基准成绩外推到任意手机任务。",
        "componentId": "field-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "切换评测协议与结果",
          "desc": "选择数据集查看论文报告的指标、数值和边界；成功率及步骤准确率越高越好。",
          "componentId": "field-scene"
        }
      ],
      "takeaways": [
        {
          "icon": "◎",
          "title": "AppAgent：10 个应用",
          "desc": "先辨认资料来源与缺口，再采取动作。"
        },
        {
          "icon": "↗",
          "title": "Mobile-Eval：三组指令",
          "desc": "把类比当成理解支架，仍以论文描述为准。"
        },
        {
          "icon": "✓",
          "title": "DroidTask：158 项任务",
          "desc": "遇到证据不足时保留不确定性。"
        }
      ]
    }
  ]
};
