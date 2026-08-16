import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "HoloAgent-0: A Unified Embodied Agent Framework with 3D Spatial Memory",
    titleZh: "从软件 Agent 的工具调用，到真实机器人的闭环执行",
    venue: "arXiv:2606.23565v1 · 2026",
    authors: "Xiaolin Zhou, Liu Liu, Tingyang Xiao, Wei Feng, Fa Fu, Xinrui Meng, Xinjie Wang, Jialiang Han, Boyang Yu, Yun Du, Wei Sui, Zhizhong Su",
    affiliation: "Horizon Robotics · D-Robotics Robotics",
    domain: "具身智能 · 机器人智能体 · 3D 空间记忆",
    coreProblem: "物理技能不像干净的软件 API：执行连续、依赖具体身体，可能部分失败，还受安全约束。",
    coreInsight: "HoloAgent-0 不试图用一个模型包办所有动作，而是用 <b>AgentOS + 空间—时序记忆 + 类型化技能 + 监控验证</b>，把异构机器人能力闭合成可观察、可验证、可恢复的执行循环。",
    keywords: [
      "Embodied AgentOS",
      "3D Spatial Memory",
      "Embodied Skills"
    ]
  },
  hero: {
    oldMethod: {
      desc: "<b>数字工具：</b>输入输出明确，反馈通常结构化、可直接读取。",
      componentId: "hero-loop"
    },
    newMethod: {
      desc: "<b>物理技能：</b>执行连续且存在不确定性，需要持续监控、验证与恢复。",
      componentId: "hero-loop"
    }
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "The Embodiment Gap",
      badge: "inf",
      badgeLabel: "推理重点",
      bridge: "<b>同样是“调用工具”，为什么到了真实机器人就难了？</b><br><span class=\"tiny-note\">Physical skills are not clean software APIs.</span><br>物理动作在真实世界中持续执行，结果受环境、机器人状态和感知误差影响，因此仅靠一次 Tool Call 不够。",
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "点击 Run Both，同时运行一次 Software Tool 和 Robot Skill",
          desc: "左侧软件工具很快返回结构化结果；右侧物理技能会经历启动、移动、障碍、定位不确定和暂停。这里展示的是论文动机的机制示意，不是实验成功率。",
          componentId: "ch1-closed-loop-lab"
        }
      ],
      insight: "<b>那么，HoloAgent-0 如何把这些不确定的物理技能，组织成一个可靠的闭环 Agent？</b>",
      takeaways: []
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "HoloAgent-0: The System View",
      badge: "inf",
      badgeLabel: "推理重点",
      bridge: "<b>HoloAgent-0 用什么结构弥合 Embodiment Gap？</b><br>答案不是让 LLM 直接控制机器人，而是用 <b>AgentOS + Memory Layer + Embodied Skills</b> 把意图、世界记忆和机器人能力组织成闭环。",
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "System View + Inside the Skill Layer",
          desc: "先看 AgentOS + Memory Layer + Embodied Skills 三层结构，再看 typed skill call 如何返回 runtime status；最后点击五类 Skill，理解不同后端怎样用同一个执行契约接入 AgentOS。",
          componentId: "ch2-skill-contract-lab"
        },
        {
          kind: "module",
          id: "2.2",
          title: "Skill Contract：所有能力按同一个接口被调用",
          desc: "把本节收成一个执行契约：Command → Execute → Status → Verify → Recover。AgentOS 调度的是这个接口，而不是直接操作底层模型。乍一看小小一条，实际上是系统能闭环的关键。",
          componentId: "checkpoint-note"
        }
      ],
      insight: "<b>HoloAgent-0 没有消除物理世界的不确定性，而是把这种不确定性显式暴露给 AgentOS。</b>",
      takeaways: []
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "Memory Layer: From 3D Map to Agent Memory",
      badge: "inf",
      badgeLabel: "推理重点",
      bridge: "<b>Memory 不只是把更多文字塞进上下文。</b><br>HoloAgent-0 的 Memory Layer 从几何地图开始，把语义对象提升到 3D，再用 HMSG 做粗到细检索，并用 Temporal Memory 记录执行历史与动态更新。",
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "四步看懂 Memory：Geometry → Semantic → HMSG → Temporal Update",
          desc: "点击四个步骤，快速走过 Memory Layer 的角色：先建立 3D 坐标世界，再把开放词汇对象提升为持久 3D 实例，随后用 HMSG 高效检索，最后用时序记忆和动态更新让 Memory 保持活性。",
          componentId: "ch3-memory-map-lab"
        },
        {
          kind: "module",
          id: "3.2",
          title: "Semantic：SAM2 和 SigLIP 的分工",
          desc: "SAM2 先确定 object mask；系统再构造整图、目标自身、局部上下文三种视图；SigLIP 分别提取 d₀、d₁、d₂ 并融合。这里要避免误解成三个 descriptor 都由 SAM2 直接产生。",
          componentId: "checkpoint-note"
        },
        {
          kind: "module",
          id: "3.3",
          title: "HMSG：先找房间，再找视角，最后确认物体",
          desc: "HMSG 是 3D Memory 的层次化目录：Floor → Room → View → Object。View 层保存过去真实看见目标的视觉证据，是导航检索和 VLM verification 之间的桥梁。",
          componentId: "checkpoint-note"
        },
        {
          kind: "module",
          id: "3.4",
          title: "Temporal + Update：让 Memory 保持活性",
          desc: "当 View 12 验证失败时，Temporal Memory 记录目标、执行轨迹和恢复经验；Spatial Update 标记旧证据失效并局部刷新 HMSG。新的观察会驱动 AgentOS re-plan。",
          componentId: "checkpoint-note"
        }
      ],
      insight: "<b>Memory 的价值不是“记得多”，而是让 AgentOS 能查到对象在哪里、为什么这么判断，以及执行后世界是否已经改变。</b>",
      takeaways: [
        {
          icon: "▧",
          title: "Geometry",
          desc: "统一坐标、机器人位姿、障碍物和可通行区域。"
        },
        {
          icon: "◎",
          title: "Semantic + HMSG",
          desc: "开放词汇对象被提升到 3D，并通过 Floor → Room → View → Object 快速检索。"
        },
        {
          icon: "↺",
          title: "Temporal Update",
          desc: "目标、Skill 结果和新观测会改变记忆，而不是只追加聊天记录。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "Closing the Loop：整套系统怎样跑起来",
      badge: "both",
      badgeLabel: "系统闭环",
      bridge: "前面已经讲完 AgentOS、Skill、Geometry / Semantic / HMSG / Temporal Memory。这里不再引入新模块，而是让它们共同完成一次任务：寻找咖啡机。",
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "Find the coffee machine",
          desc: "点击 Run Closed Loop 后，系统会经历检索、导航、验证失败、记忆更新、主动探索和重新规划。重点不是一次成功，而是现实反馈如何改变下一轮决策。",
          componentId: "ch4-fusion-lab"
        }
      ],
      insight: "HoloAgent-0 的关键不是假设计划永远正确，而是在计划和现实不一致时继续运行、写回证据并重新规划。",
      takeaways: [
        {
          icon: "↧",
          title: "Retrieve",
          desc: "先用 HMSG 从 3D Memory 中找到最可能的房间与视角。"
        },
        {
          icon: "✓",
          title: "Verify",
          desc: "到达后用当前视觉证据检查目标是否真的存在。"
        },
        {
          icon: "↺",
          title: "Recover",
          desc: "如果现实推翻旧记忆，就更新 Memory 并触发新一轮探索。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "Does It Actually Work?",
      badge: "both",
      badgeLabel: "实验结果",
      bridge: "方法讲完以后，问题变成：闭环、Memory 和 Skills 到底有没有用？作者从 Navigation、3D Memory 和 Real Robot 三个层次给出证据。",
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "Quantitative Evidence + Boundary",
          desc: "只保留最值得现场讲的数字：导航是否更稳、3D Memory 是否可在线使用。真实机器人 Demo 作为定性补充口头带过，不再单独展示截图。",
          componentId: "ch5-navigation-lab"
        }
      ],
      insight: "最有说服力的地方不是某个模型单点大幅领先，而是 AgentOS、Memory 和异构 Skills 能被组织成真实可运行的物理闭环。",
      takeaways: [
        {
          icon: "↦",
          title: "Reach",
          desc: "HM3D-ObjNav 上 HoloAgent-Nav 达到 82.6% SR / 42.8 SPL。"
        },
        {
          icon: "✓",
          title: "Remember",
          desc: "HoloAgent-Memory 展示了有竞争力的在线 3D 语义建图结果。"
        },
        {
          icon: "↺",
          title: "Recover",
          desc: "真实机器人 Demo 展示了搜索、协作、操作和恢复式长任务。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "Summary & Outlook",
      badge: "both",
      badgeLabel: "总结与展望",
      bridge: "HoloAgent-0 迈出的不是“更强单模型”的一步，而是把物理 Agent 所需的调用、记忆、验证和恢复机制先搭成一个完整 Runtime。",
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "From HoloAgent-0 to General Physical Agents",
          desc: "最后只收束一页：左边压缩 HoloAgent-0 已经给出的三件事，中间保留一个 limitation，右边展示未来可能走向。",
          componentId: "ch6-execution-loop-lab"
        }
      ],
      insight: "From calling tools → to acting, remembering, and recovering in the physical world.",
      takeaways: [
        {
          icon: "USE",
          title: "Skills",
          desc: "把导航、操作、全身运动等异构机器人能力变成 AgentOS 可调用、可监控的执行接口。"
        },
        {
          icon: "MEM",
          title: "Memory",
          desc: "通过持续 3D Spatial Memory + Temporal Memory，让 Agent 知道世界现在怎样、刚才发生了什么。"
        },
        {
          icon: "RUN",
          title: "AgentOS",
          desc: "根据 runtime feedback 监控执行、更新记忆并重新规划，而不是假设一次计划一定正确。"
        }
      ]
    }
  ],
  bilibili: [
    {
      bvid: "BV1jJr8BjEjy",
      title: "LimX COSA逐际动力全新发布具身Agentic OS系统",
      reason: "从系统视角理解具身 Agentic OS 如何把高阶认知与身体执行接起来。",
      cover: "https://i1.hdslb.com/bfs/archive/60f384edf453624490ed9c1a602d57746910fa73.jpg",
      views: "78.2万播放"
    },
    {
      bvid: "BV1Sdn9zTEmD",
      title: "香港中文大学 | RoboMemory：专为物理具身系统中的终身学习而设计",
      reason: "主题直接对应具身记忆与闭环规划；虽然播放量较低，但内容相关性很高。",
      cover: "https://i0.hdslb.com/bfs/archive/70e47d95461795d9d51784e1855de72c60c9e70e.jpg",
      views: "1510播放"
    },
    {
      bvid: "BV13fiqYRE93",
      title: "讲座 | 具身导航中的三维场景理解",
      reason: "补充三维场景理解、空间记忆与具身导航之间的技术联系。",
      cover: "https://i2.hdslb.com/bfs/archive/b1e48b8a16ce69051755d7298e9140b1cbba1eb9.jpg",
      views: "4223播放"
    },
    {
      bvid: "BV1AV1PBFEGe",
      title: "SLAM导航+AI大模型+3D视觉，LanderPi具身智能机器人",
      reason: "用可见的机器人演示把 SLAM、3D 视觉、语言指令和闭环执行连接起来。",
      cover: "https://i2.hdslb.com/bfs/archive/ec4016f7d03cee6adb514b32afe00a6137de47c9.jpg",
      views: "1484播放"
    }
  ]
};
