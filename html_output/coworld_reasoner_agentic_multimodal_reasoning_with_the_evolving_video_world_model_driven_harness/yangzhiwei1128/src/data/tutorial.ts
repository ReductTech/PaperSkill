import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "thumbnails": {
    "cover": "./thumbnails/cover.jpg",
    "s1-unseen": "./thumbnails/s1-unseen.jpg",
    "s2-harness": "./thumbnails/s2-harness.jpg",
    "s3-ops": "./thumbnails/s3-ops.jpg",
    "s4-request": "./thumbnails/s4-request.jpg",
    "s5-stages": "./thumbnails/s5-stages.jpg",
    "s6-integrate": "./thumbnails/s6-integrate.jpg",
    "s7-coevolve": "./thumbnails/s7-coevolve.jpg",
    "s8-budget": "./thumbnails/s8-budget.jpg",
    "s9-results": "./thumbnails/s9-results.jpg",
    "s10-ablation": "./thumbnails/s10-ablation.jpg",
    "s11-boundary": "./thumbnails/s11-boundary.jpg"
  },
  "meta": {
    "titleEn": "CoWorld Reasoner: Agentic Multimodal Reasoning with the Evolving Video World Model-Driven Harness",
    "titleZh": "CoWorld Reasoner：以演进的视频世界模型驱动智能体式多模态推理",
    "venue": "arXiv:2610.21910",
    "authors": "Dongjie Cheng, Ruifeng Yuan, Ran Wei, Ning Song, Yongqi Li, Wenjie Li",
    "affiliation": "香港理工大学 · 杭州迪英加生物科技",
    "domain": "多模态推理 · 视频世界模型 · 智能体",
    "coreProblem": "只盯着输入图像，答不出没被拍到的视角与后果。",
    "coreInsight": "把视频世界模型当作统一的视觉推理引擎：按问题选择视觉操作、按规则写请求，再据此改写答案。",
    "keywords": [
      "视频世界模型",
      "视觉操作",
      "推理骨架",
      "共演化",
      "空间推理"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "固定流水线的新视角合成",
      "desc": "只会换机位这一种想象方式。",
      "componentId": "cover-fixed"
    },
    "newMethod": {
      "title": "按需选择视觉操作的 harness",
      "desc": "先判断该不该想象，再补拍中间帧。",
      "componentId": "cover-adaptive"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "01 · 观测之外的视觉证据",
      "modules": [
        {
          "kind": "module",
          "id": "m1",
          "title": "问题落在没拍到的地方",
          "desc": "点选三种提问方式，看照片外、照片之间、照片之后各自缺什么证据。",
          "componentId": "s1-unseen"
        }
      ],
      "scenes": [
        {
          "id": "s1-unseen",
          "title": "两张照片回答不了的问题",
          "goal": "为什么看清了两张图，仍然答不出第三张？",
          "summary": "问题指向未被观测的视角、中间状态或后续结果",
          "interaction": "点选「换个视角看会怎样」「两张之间发生了什么」「接下来会怎样」，观察空白区域与直接作答的猜测",
          "next": "认识可编辑的推理骨架由哪些部件组成",
          "notes": "对应论文第 2 页 Figure 1 与第 3 页 Sec.1：不同推理任务需要不同形式的视觉想象（换视角、补中间、续未来、做干预）。本页只建立「缺的是不同类型的证据」这一直觉，不主张任何世界模型能力。类比边界：真实基准测试给出的输入多于两张照片，两图设定是教学简化。",
          "componentId": "s1-unseen",
          "moduleId": "m1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "02 · Video World Model-Driven Harness",
      "modules": [
        {
          "kind": "module",
          "id": "m2",
          "title": "Harness 的四个部件",
          "desc": "点选工具、技能、验证器、执行层，看各自负责哪一段。",
          "componentId": "s2-harness"
        },
        {
          "kind": "module",
          "id": "m3",
          "title": "按问题选择视觉操作",
          "desc": "为四个不同的问题挑选四种视觉操作，看生成的片段是否对题。",
          "componentId": "s3-ops"
        },
        {
          "kind": "module",
          "id": "m4",
          "title": "请求构造：源图顺序与保持不变的条件",
          "desc": "交换源图顺序、开关保持条件，看生成片段是否还能与输入比较。",
          "componentId": "s4-request"
        }
      ],
      "scenes": [
        {
          "id": "s2-harness",
          "title": "Harness 的四个部件",
          "goal": "一个可编辑的推理骨架由哪些部件组成？",
          "summary": "工具、技能、验证器、执行层共同定义「怎么用世界模型」",
          "interaction": "点选四个部件，观察高亮、连线与公式 H=(T,S,V,E) 中被框住的项",
          "next": "看同一个世界模型如何被四种操作调用",
          "notes": "对应第 5 页 Sec.3.1 公式 (2)：H=(T,S,V,E)，T 为 L 个 VWM 驱动工具，S 为 J 个技能，V 为验证器，E 为执行层。示意图中的连线与方位是教学排版，不是论文的主张；论文没有声称四个部件中哪个更重要。",
          "componentId": "s2-harness",
          "moduleId": "m2"
        },
        {
          "id": "s3-ops",
          "title": "按问题选择视觉操作",
          "goal": "同一个世界模型，为什么要换四种操作？",
          "summary": "问题决定该用视角改变、插值、延续还是干预",
          "interaction": "先读题，再点四个操作之一；点下一个问题继续",
          "next": "进一步检查请求怎么写才不失真",
          "notes": "对应第 5 页公式 (3)、第 16 页 Table 6 与第 2 页 Figure 1：四类视觉操作为视角改变、插值、延续、干预，分别服务跨视角、隐藏中间状态、后续结果和干预后果。反馈中的「对题/不对题」是教学判断，不是论文测量的分数。",
          "componentId": "s3-ops",
          "moduleId": "m3"
        },
        {
          "id": "s4-request",
          "title": "请求构造：源图顺序与保持不变的条件",
          "goal": "同一对源图，请求写错会生成什么？",
          "summary": "请求要绑定源图顺序，并声明必须保持不变的东西",
          "interaction": "点照片交换 Picture 1/2 的顺序，开关「保持背景锚点」「保持物体身份」",
          "next": "把四个阶段连起来看一次完整的推理",
          "notes": "对应第 5 页公式 (3) 与第 18 页 Sec.A.8：请求构造指令要把图像引用对齐到 VWM 的源图顺序（第二张输入图成为 Picture 1），并把物体相对运动锚在可见的前后特征上；解读指令要求核对物体身份并在问题指定的参考系里表述关系。本页的「不可用」是按这些条件做的教学判定，不是实测失败率。",
          "componentId": "s4-request",
          "moduleId": "m4"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "03 · 四阶段执行与证据整合",
      "modules": [
        {
          "kind": "module",
          "id": "m5",
          "title": "四阶段执行与交互历史",
          "desc": "推进阶段把手，看技能、请求、验证与答案如何逐条写入历史。",
          "componentId": "s5-stages"
        },
        {
          "kind": "module",
          "id": "m6",
          "title": "证据整合：答案如何被改写",
          "desc": "在「只看原图」与「加上生成视频」之间切换，看答案与判断翻转。",
          "componentId": "s6-integrate"
        }
      ],
      "scenes": [
        {
          "id": "s5-stages",
          "title": "四阶段执行：历史如何累积",
          "goal": "四个阶段如何把证据一路带到答案？",
          "summary": "每阶段从上一阶段选定的历史继续，逐条追加到交互历史",
          "interaction": "拖动阶段把手或点阶段卡，观察日志逐条追加与条数计数",
          "next": "看一条真实案例里答案为什么翻转",
          "notes": "对应第 6 页 Sec.3.2 与第 4 页 Figure 2：四阶段依次为能力边界评估、请求 VWM 协助、视频解读、证据整合与推理，阶段 k 从上一阶段选定的历史继续。阶段调用次数上限 4/6/6/6 记在备注里，不放在页面上以免拥挤。",
          "componentId": "s5-stages",
          "moduleId": "m5"
        },
        {
          "id": "s6-integrate",
          "title": "证据整合：答案为什么被改写",
          "goal": "加入生成视频后，答案会在哪里翻转？",
          "summary": "生成片段显示其余盘子留在原处，答案从「一起掉落」改为「留在原处」",
          "interaction": "切换「只看原图」与「加上生成视频」两张答案卡，观察盘子与结论",
          "next": "看这套骨架如何被反复修订",
          "notes": "对应第 5 页公式 (5) 与第 18 页 Sec.A.8（Figure 9 案例）：生成视频显示抽出最下面的盘子后其余盘子留在原处，促使智能体修正最初答案。这是论文给出的一个定性案例，不是测得的平均提升；真实世界模型也可能产生伪影，这正是验证器存在的原因。",
          "componentId": "s6-integrate",
          "moduleId": "m6"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "04 · VLM-VWM Harness Co-Evolution",
      "modules": [
        {
          "kind": "module",
          "id": "m7",
          "title": "共演化：该修订哪一部分",
          "desc": "从执行轨迹定位问题，再选择要改的部件，观察下一轮是否复现。",
          "componentId": "s7-coevolve"
        },
        {
          "kind": "module",
          "id": "m8",
          "title": "修订预算与候选选择",
          "desc": "拖动每阶段修订预算 B，观察通过率的边际收益与提前停止。",
          "componentId": "s8-budget"
        }
      ],
      "scenes": [
        {
          "id": "s7-coevolve",
          "title": "共演化：该修订哪一部分",
          "goal": "权重不变，改哪里才能让下一轮更好？",
          "summary": "同一个问题可能属于请求指令、技能工作流、工具接口或执行代码",
          "interaction": "先点一条失败轨迹，再点要修订的部件，观察补丁与下一轮是否复现",
          "next": "看修订预算与候选怎么选",
          "notes": "对应第 6 页 Algorithm 1 与第 7 页公式 (7)：修订方案 Δ 可以影响工具接口、技能工作流、验证器与阶段指令以及执行代码。页面上的「本阶段通过率」是教学示意，不是论文测量的基准分数；论文的候选选择比较的是各阶段的指标与抽样轨迹，并权衡目标改进与回退。",
          "componentId": "s7-coevolve",
          "moduleId": "m7"
        },
        {
          "id": "s8-budget",
          "title": "修订预算与候选选择",
          "goal": "修订预算用完后，收益还在增长吗？",
          "summary": "每阶段最多 5 次修订、共 3 轮，多数阶段的收益会先饱和",
          "interaction": "拖动预算 B（0–5），观察四阶段曲线与提前停止标记",
          "next": "回到论文报告的结果",
          "notes": "对应第 6 页 Algorithm 1 与第 14 页 Sec.A.3：实验取 R=3 轮、每阶段 B=5 次修订并允许提前停止。曲线形状是教学示意（按边际收益递减构造），只有 B=5、R=3 这两个数值来自论文；不得把曲线读成实测成绩。",
          "componentId": "s8-budget",
          "moduleId": "m8"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "05 · 证据、边界与失败",
      "modules": [
        {
          "kind": "module",
          "id": "m9",
          "title": "七个基准上的整体结果",
          "desc": "点选任一基准，读取同一 VLM 直接推理与 CoWorld Reasoner 的准确率差。",
          "componentId": "s9-results"
        },
        {
          "kind": "module",
          "id": "m10",
          "title": "收益从哪里来：工具消融与技能使用",
          "desc": "在「含工具」与「去掉工具」之间切换，看哪些子类增益主要来自生成视频。",
          "componentId": "s10-ablation"
        },
        {
          "kind": "module",
          "id": "m11",
          "title": "边界：换引擎、换 VLM 与失败案例",
          "desc": "切换面板，比较换 VLM 的实测变化与换 VWM 的定性结论。",
          "componentId": "s11-boundary"
        }
      ],
      "scenes": [
        {
          "id": "s9-results",
          "title": "七个基准上的整体结果",
          "goal": "提升有多少，落在哪些基准上？",
          "summary": "同一 GPT-5.6 骨干下七个基准全部提升，平均 59.69 对 58.29",
          "interaction": "点选任一基准，读取绝对与相对提升、评估协议",
          "next": "拆开看收益来自工具还是工作流",
          "notes": "数值取自第 8 页 Table 1 的测试集准确率（%，越高越好，Avg. 按题数加权且要求七个基准齐全）；相对提升取自摘要：MMSI 11.8%、ERQA 13.0%。这两栏不可混读：4.54 是百分点，11.8% 是相对值。基线为同一 GPT-5.6 直接推理，VWM 为 MiniMax H3 Max Turbo。",
          "componentId": "s9-results",
          "moduleId": "m9"
        },
        {
          "id": "s10-ablation",
          "title": "收益从哪里来：工具消融与技能使用",
          "goal": "这些收益是生成的功劳，还是工作流的功劳？",
          "summary": "视角采择的收益在去掉工具后仍在；遮挡与碰撞的增益主要来自生成视频",
          "interaction": "切换「含 VWM 工具」与「去掉 VWM 工具」，观察八个子类增益条",
          "next": "检验结论的边界",
          "notes": "数值取自第 10 页 Figure 3a：相对 Ours (w/o VWM) 的子类增益（百分点，越高越好）。基线是同一无 VWM 变体，不是 GPT-5.6，不能与 Table 1 的增益直接相减。第 9 页 Figure 3b 的技能加载率只作一句支持性说明，不画成图以免误读。",
          "componentId": "s10-ablation",
          "moduleId": "m10"
        },
        {
          "id": "s11-boundary",
          "title": "边界：换引擎、换 VLM 与失败案例",
          "goal": "换一个引擎或换一个 VLM，结论还成立吗？",
          "summary": "迁移要再演化一轮，总体涨但 SAT 略降；换弱引擎时因果任务会掉",
          "interaction": "在「换 VLM」与「换 VWM」两个面板之间切换",
          "next": "",
          "notes": "左面板数值取自第 10 页 Figure 5：Grok-4.5 直接用 harness 迁移后按题加权准确率 32.86%→39.78%，SAT 52.7→51.0 略降。右面板是第 9-10 页 Figure 3c 的定性结论：两个 VWM 变体在总体、MMSI、Spin、SpatiaLab 上都提升，H3 增益更大且也提升 SAT，而 LTX-2.3 在 CausalSpatial 上低于 GPT-5.6；论文未报告的项目不得编造数值。",
          "componentId": "s11-boundary",
          "moduleId": "m11"
        }
      ]
    }
  ]
};
