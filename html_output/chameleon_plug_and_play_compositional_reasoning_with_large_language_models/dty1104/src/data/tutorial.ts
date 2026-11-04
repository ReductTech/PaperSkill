import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Chameleon: Plug-and-Play Compositional Reasoning with Large Language Models",
    "titleZh": "变色龙：借助可插拔工具进行组合推理",
    "venue": "NeurIPS 2023",
    "authors": "Pan Lu、Baolin Peng、Hao Cheng 等",
    "affiliation": "加州大学洛杉矶分校、微软研究院",
    "domain": "多模态智能体 · 视觉问答 · 工具调用",
    "coreProblem": "语言模型单独回答视觉、知识和数值混合题时，难以同时完成图像理解、外部检索与精确计算。",
    "coreInsight": "Chameleon让规划器按题目生成工具序列，再把图像描述、文字识别、检索或计算结果逐步交给后续模块。",
    "keywords": [
      "规划器",
      "可插拔模块",
      "ScienceQA",
      "TabMWP"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "单靠语言模型容易漏掉图像细节、外部知识或精确计算。",
      "componentId": "analogy-scene"
    },
    "newMethod": {
      "desc": "规划器挑选合适模块，逐步执行并传递中间结果。",
      "componentId": "analogy-scene"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "一道题为何要用多种工具",
      "badge": "inf",
      "badgeLabel": "推理",
      "bridge": "一张科学题卡可能同时给出图片、文字和背景常识。直接让语言模型猜答案，容易把“看不清图”“不知道知识”“算错数”混在一起。论文先提出这个混合难题，再让规划器挑选合适的模块。这里先试着判断一题真正缺少哪类证据。",
      "analogy": {
        "title": "题卡滑入视野",
        "text": "题卡滑到桌面中央，插图、文字和数字一起进入视野。先看清这道题缺少哪类证据，再决定拿起哪个工具。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "选择题目需要的证据",
          "desc": "切换纯文字、插图和表格三种题型，观察所需模块如何变化。图中是根据论文工具清单制作的教学示意，工具选择不是论文对任意单题的固定答案。（论文第1页图1、第4—6页）",
          "componentId": "interactive-lab"
        }
      ],
      "insight": "若题目缺的是视觉证据，增加语言推理步骤也无法凭空读出图像。",
      "takeaways": [
        {
          "icon": "◉",
          "title": "题目先分解",
          "desc": "区分视觉、知识与计算缺口。"
        },
        {
          "icon": "⌁",
          "title": "模块有边界",
          "desc": "图像描述与程序计算解决不同问题。"
        },
        {
          "icon": "✓",
          "title": "规划是关键",
          "desc": "工具序列应由题目需要决定。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "输入与缓存怎样传递线索",
      "badge": "inf",
      "badgeLabel": "推理",
      "bridge": "规划好的模块并不是各说各话。论文把当前输入记作 x，把已经得到的图像语义、外部知识和程序等中间信息放入缓存 c。下一模块既看到题目，也能利用前一步留下的线索。这解释了为什么调用顺序会影响最终答案。",
      "analogy": {
        "title": "便签落入笔记本",
        "text": "做题时把刚观察到的一条线索写在便签上，放进笔记本。便签没有改变原题，却让后续推理可以引用新的信息。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "逐步加入中间证据",
          "desc": "按顺序向缓存加入图像描述和检索知识，观察输入区与缓存区的变化。这里用短文本展示信息流；论文的实际更新函数按模块手工设计，不是一个对所有工具都通用的自动规则。（第5页式2—4）",
          "componentId": "interactive-lab"
        }
      ],
      "insight": "缓存负责保留中间结果；如果上游线索错了，后续模块也可能沿着错误信息推理。",
      "takeaways": [
        {
          "icon": "◉",
          "title": "输入 x",
          "desc": "保留当前需要处理的题目内容。"
        },
        {
          "icon": "⌁",
          "title": "缓存 c",
          "desc": "保存描述、知识和程序等中间信息。"
        },
        {
          "icon": "✓",
          "title": "逐步更新",
          "desc": "不同模块有各自的更新方式。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "规划器如何选出工具序列",
      "badge": "inf",
      "badgeLabel": "推理",
      "bridge": "Chameleon 的中心是语言模型规划器。它读取问题、模块描述、调用约束和少量示例，一次生成工具名序列。对于“广告采用什么说服方式”这类含文字的图像题，先读出广告文字，再检索背景知识，比直接猜更有依据。",
      "analogy": {
        "title": "铅笔圈住题卡",
        "text": "铅笔在题卡上圈出准备先处理的线索。圈在哪里，决定后面到底要看图形、读文字，还是查概念。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "比较三条候选工具路线",
          "desc": "比较三条教学候选路线，并看它们各自获得什么证据。论文图1展示了图像描述、文字检测与网页搜索等不同工具组合；这里不把示例路线误称为所有题目的唯一正确程序。（第1页图1、第5页式1）",
          "componentId": "interactive-lab"
        }
      ],
      "insight": "规划器一次给出计划；如果它把视觉文字误当场景对象，后续工具再强也可能走错方向。",
      "takeaways": [
        {
          "icon": "◉",
          "title": "计划是序列",
          "desc": "每一步调用一个预建模块。"
        },
        {
          "icon": "⌁",
          "title": "约束进提示",
          "desc": "模块说明与调用限制共同影响选择。"
        },
        {
          "icon": "✓",
          "title": "任务适配",
          "desc": "不同题目应得到不同工具路线。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "模块执行的数学骨架",
      "badge": "both",
      "badgeLabel": "方法与实验",
      "bridge": "计划生成后，解释器按顺序运行模块。第 t 步模块接收当前输入 x 与历史缓存 c，输出 y；随后输入和缓存按该模块的规则更新。最终回答来自最后一个模块。这组公式让“调用工具”变成可追踪的状态变化，而不是一串装饰性名字。",
      "analogy": {
        "title": "书签沿笔记下移",
        "text": "书签往下一行移动，表示解题推进一步；笔记本里已经写下的线索仍然可读。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "逐步推进一次执行",
          "desc": "逐步查看图像描述、知识检索、形成解答和归一化答案各自写入什么。画面只演示一条符合论文机制的简化轨迹，具体工具的 update_input 和 update_cache 由作者逐个设计。（第5页式1—5）",
          "componentId": "interactive-lab"
        }
      ],
      "insight": "单步输出 y 不等于最终回答；中途结果要进入后续模块能读到的状态。",
      "takeaways": [
        {
          "icon": "◉",
          "title": "逐步执行",
          "desc": "计划不是同时运行所有工具。"
        },
        {
          "icon": "⌁",
          "title": "状态可追踪",
          "desc": "每步的输入、缓存和输出都能检查。"
        },
        {
          "icon": "✓",
          "title": "最终答案",
          "desc": "最后一步模块产生返回结果。"
        }
      ],
      "formula": {
        "lead": "一次模块调用与缓存更新",
        "unicode": "yₜ ← Mₜ(xₜ₋₁; cₜ₋₁)，cₜ ← update_cache(cₜ₋₁, yₜ)",
        "symbols": [
          {
            "sym": "Mₜ",
            "desc": "第 t 步选用的模块。"
          },
          {
            "sym": "xₜ₋₁",
            "desc": "进入该步的当前输入。"
          },
          {
            "sym": "cₜ₋₁",
            "desc": "已积累的中间信息。"
          },
          {
            "sym": "yₜ",
            "desc": "该步生成的输出。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "视觉分支：看场景还是读文字",
      "badge": "both",
      "badgeLabel": "方法与实验",
      "bridge": "视觉输入并不总是同一种信息。图像描述器擅长概括对象和关系，文字检测器负责读取广告、图表或地图中的字词。ScienceQA 中有些题靠画面语义，有些题必须准确读出画内文字。这里通过同一张示意海报体会两种工具的分工。",
      "analogy": {
        "title": "放大镜对准图中文字",
        "text": "放大镜可以对准图案，也可以对准印在图上的小字；观察位置不同，留下的笔记也不同。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "选择视觉读取方式",
          "desc": "切换视觉工具后，海报上被读取的区域和下方证据同步变化。本图为教学示意，不是论文数据集原图；论文的文字检测模块来自 EasyOCR，图像描述模块使用预训练模型。（第6页工具说明、附录A.2）",
          "componentId": "interactive-lab"
        }
      ],
      "insight": "把图像转换成一句描述会压缩信息；需要精确字词时，应走文字检测支路。",
      "takeaways": [
        {
          "icon": "◉",
          "title": "描述场景",
          "desc": "适合对象与关系的粗粒度语义。"
        },
        {
          "icon": "⌁",
          "title": "读取文字",
          "desc": "适合广告文案、图表标签等。"
        },
        {
          "icon": "✓",
          "title": "选择有因",
          "desc": "由题目的信息需求决定视觉工具。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "知识分支：检索与搜索",
      "badge": "both",
      "badgeLabel": "方法与实验",
      "bridge": "题目有时还需要画面之外的事实。论文区分知识检索模块与 Bing 网页搜索：前者为题目提供背景知识，后者可访问更广泛的外部搜索结果。进行网页搜索前，查询生成器通常先把原题改写成更适合检索的搜索词。",
      "analogy": {
        "title": "索引卡从书页翻起",
        "text": "解题时翻起一张索引卡，决定采用笔记里的背景概念，还是另外去查资料。卡片翻面表达的是选择证据源，不代表所有检索结果可靠。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "切换知识来源并观察证据",
          "desc": "选择三种知识路径，比较每种路径能提供什么、又可能缺什么。GPT-4 与 ChatGPT 在论文中的搜索调用频率不同，但调用更多本身不等于答得更准。（第5—6页模块说明、第9页图4）",
          "componentId": "interactive-lab"
        }
      ],
      "insight": "外部搜索可补充新信息，也会带来相关性与来源质量问题。",
      "takeaways": [
        {
          "icon": "◉",
          "title": "知识检索",
          "desc": "提供任务相关的背景概念。"
        },
        {
          "icon": "⌁",
          "title": "网页搜索",
          "desc": "接入更广泛的外部结果。"
        },
        {
          "icon": "✓",
          "title": "先构造查询",
          "desc": "搜索词决定查到什么。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "表格题：把读取与计算拆开",
      "badge": "inf",
      "badgeLabel": "推理",
      "bridge": "TabMWP 的输入可能是价格表、时刻表或函数表。整表直接塞给语言模型，容易在不相关的格子里迷失。Chameleon 可先用行列定位和表格转述缩小信息范围，再生成并验证 Python 程序做运算。",
      "analogy": {
        "title": "直尺横移定位表格行",
        "text": "用直尺对齐表格中的一行，相关数值会更容易核对；直尺本身不会替我们算出答案。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "切换表格处理步骤",
          "desc": "在示意费用表中，观察“看整表”“只看相关行列”“做精确运算”各阶段的信息差异。示例数字是教学用自编，论文的 98.78% 属于 TabMWP 测试集整体准确率，不能由这个小例子推出。（第6页模块说明）",
          "componentId": "interactive-lab"
        }
      ],
      "insight": "定位单元格与计算是两种不同能力；程序验证可检查代码问题，但不能保证选择的数字一定正确。",
      "takeaways": [
        {
          "icon": "◉",
          "title": "先找数据",
          "desc": "行列工具减少无关上下文。"
        },
        {
          "icon": "⌁",
          "title": "再做运算",
          "desc": "程序生成器处理精确计算。"
        },
        {
          "icon": "✓",
          "title": "保留边界",
          "desc": "程序可执行不代表题意理解无误。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "可插拔架构的真正含义",
      "badge": "trn",
      "badgeLabel": "系统",
      "bridge": "“可插拔”不是让所有模块任意混用。系统预先列出可调用模块及说明，规划器在当前任务允许的子集中选择顺序；执行器再逐一把输出送入下一步。ScienceQA 和 TabMWP 用的是不同子集。理解了模块间输入、缓存和末端答案的关系，才能理解它为什么容易扩展。",
      "analogy": {
        "title": "工具卡轻轻抬起",
        "text": "桌上抽起一张需要的工具卡，旁边的卡片仍留在原位。选卡表达任务适配，而非把所有工具一次用完。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点击模块类别检查下游信息",
          "desc": "点击不同类别，观察工具实例、适用输入和下游缓存如何改变。图中节点是论文表2和方法章节的归纳，非论文原图；选择计算模块时示例切换到 TabMWP 路线。（第4—6页）",
          "componentId": "interactive-lab"
        }
      ],
      "insight": "工具库可扩展，但规划器的提示词也要容纳模块说明与约束。",
      "takeaways": [
        {
          "icon": "◉",
          "title": "模块库存",
          "desc": "视觉、搜索、语言、Python和规则工具并存。"
        },
        {
          "icon": "⌁",
          "title": "任务子集",
          "desc": "两类基准任务调用的工具集合不同。"
        },
        {
          "icon": "✓",
          "title": "接口传递",
          "desc": "输出进入后续步骤，而不是孤立显示。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "错误计划与方法边界",
      "badge": "trn",
      "badgeLabel": "系统",
      "bridge": "工具列表丰富，也不意味着规划一定正确。论文在 ScienceQA 中要求计划以解答生成器和答案生成器结束；不满足时会回退为这两步。作者还承认计划一次生成、执行过程中不重新规划，工具描述增多也可能受上下文窗口限制。",
      "analogy": {
        "title": "橡皮擦过错误笔迹",
        "text": "橡皮擦掉错误笔迹，表示发现了不合规范的做法；纸面恢复干净不代表已经解出了题。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "切换有效与无效计划",
          "desc": "切换计划状态，查看哪种情况触发固定回退、哪种情况可以按序运行。第三项展示论文明确写出的局限：执行中不重新规划。这里的回退示意不等同于一个能自动纠错的闭环。（第6页§4.2，附录B）",
          "componentId": "interactive-lab"
        }
      ],
      "insight": "回退只能保证计划格式符合要求，无法替错误的视觉证据或推理过程纠错。",
      "takeaways": [
        {
          "icon": "◉",
          "title": "约束需检查",
          "desc": "ScienceQA 计划末两步有格式要求。"
        },
        {
          "icon": "⌁",
          "title": "无动态重规划",
          "desc": "生成的序列在执行中保持不变。"
        },
        {
          "icon": "✓",
          "title": "规模有代价",
          "desc": "模块清单越大，提示上下文越紧张。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、消融与下一步问题",
      "badge": "both",
      "badgeLabel": "方法与实验",
      "bridge": "结果页不能只看一个最高分。论文在 ScienceQA 与 TabMWP 两类不同任务上报告准确率，还做了禁用模块的消融实验。这里把相同基准、相同底座模型下的比较放在一起，并单独标明消融使用 ChatGPT 规划器和 500 道测试题，避免混用协议。",
      "analogy": {
        "title": "印章落在已核对答案上",
        "text": "解题结束后，印章只盖在已经核对的结果上。成绩说明方法在特定测试条件下有效，不代表每一种开放场景都已解决。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "切换基准并对照消融",
          "desc": "第一幅可切换 ScienceQA 和 TabMWP：ScienceQA 的 GPT-4 CoT 为 83.99%，Chameleon 为 86.54%；TabMWP 的 GPT-4 PoT 为 96.93%，Chameleon 为 98.78%。均为测试集准确率，越高越好。第二幅查看禁用知识检索、搜索、OCR、图像描述或程序生成器时的分数下降，消融基于 ChatGPT 和 500 个样本。（第7—9页表3—5）",
          "componentId": "interactive-lab"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "拆掉一个模块会怎样",
          "desc": "点选被禁用的模块，读取论文表5的准确率下降。消融基于ChatGPT和500个测试样本；这里的下降值为百分点，不与GPT-4主结果混作同一个实验。",
          "componentId": "interactive-lab"
        }
      ],
      "insight": "实验支持模块组合有效，但两类任务与底座模型的结果不能随意拼成一个统一增益。",
      "takeaways": [
        {
          "icon": "◉",
          "title": "对齐协议",
          "desc": "同数据集、同底座下比较。"
        },
        {
          "icon": "⌁",
          "title": "消融有作用",
          "desc": "禁用关键模块会导致准确率下降。"
        },
        {
          "icon": "✓",
          "title": "继续追问",
          "desc": "规划质量、动态重规划与大工具库仍有研究空间。"
        }
      ]
    }
  ]
};
