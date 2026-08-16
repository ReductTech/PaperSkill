import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "VLA Foundry: A Unified Framework for Training Vision-Language-Action Models",
    titleZh: "VLA Foundry：训练视觉-语言-动作模型的统一框架",
    venue: "arXiv cs.RO, 2026",
    authors: "Jean Mercat, Sedrick Keh, Kushal Arora, Isabella Huang, Paarth Shah, Haruki Nishimura, Shun Iwase, Katherine Liu",
    affiliation: "Toyota Research Institute",
    domain: "机器人基础模型 / 多模态学习 / VLA 训练框架",
    coreProblem: "很多开源 VLA 工作只聚焦最后的动作训练，难以系统研究 LLM/VLM 预训练、数据配方和机器人策略之间的关系。",
    coreInsight: "VLA Foundry 的核心价值是把 <b>LLM -> VLM -> VLA</b> 放入同一套可配置、可替换、可复现的训练栈，让上游 backbone、数据混合和下游动作学习可以被统一实验。",
    keywords: [
      "VLA",
      "LLM -> VLM -> VLA",
      "统一训练框架",
      "Qwen3-VL backbone",
      "LBM Eval"
    ]
  },
  hero: {
    oldMethod: {
      desc: "传统开源流程常把 <b>action fine-tuning</b> 当成独立末端：上游 LLM/VLM 和数据配方像黑盒，实验变量难以统一控制。",
      componentId: "vla-widget"
    },
    newMethod: {
      desc: "VLA Foundry 把语言、图文和机器人动作数据放进同一条训练道路：可从零训练，也可接入 Hugging Face 预训练 backbone。",
      componentId: "vla-widget"
    }
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "论文动机：为什么 VLA 训练不能只看最后一步 action head",
      badge: "inf",
      badgeLabel: "直觉",
      bridge: "第 1 章先讲 Introduction 的核心动机：现有很多开源 VLA 项目只开放最后的动作训练，上游 LLM/VLM 预训练和数据配方像黑盒，导致完整复现困难，也限制跨阶段研究。",
      analogy: {
        title: "生活类比：听懂指令、看清环境，最后才动手",
        text: "LLM 像<b>听懂任务单</b>，VLM 像<b>看清桌面环境</b>，VLA 的 action head 才是<b>真正伸手操作</b>。如果只训练最后动手，但前面的理解指令和辨别环境都是黑盒，那么<b>理解错了、看错了</b>，<b>最后动作也会被带偏</b>。",
        componentId: "vla-widget"
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "两个痛点：拼接痛苦与研究受限",
          desc: "切换“只调动作头”和“统一训练栈”，观察现有流程为什么需要硬拼 Megatron、Prismatic、OpenVLA，以及为什么难以控制 backbone、data recipe、training stage 这些跨阶段变量。",
          componentId: "vla-widget"
        }
      ],
      insight: "这篇论文的核心问题不是提出一个孤立的新动作头，而是把 LLM -> VLM -> VLA 的完整训练链路变成可配置、可替换、可复现的实验对象。",
      formula: {
        lead: "第 1 章只需要记住这个简化关系：",
        unicode: "VLA policy = VLM backbone + action head",
        symbols: [
          {
            sym: "VLM backbone",
            desc: "来自 LLM/VLM 阶段的语言与视觉语言能力，是 VLA 策略的上游基础。"
          },
          {
            sym: "action head",
            desc: "把观察特征转成机器人动作的末端模块，常被现有 VLA 项目重点微调。"
          },
          {
            sym: "policy",
            desc: "最终用于闭环控制机器人的策略；它的表现不只由动作头决定。"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "拼接痛苦",
          desc: "完整复现 LLM -> VLM -> VLA 往往要拼接多套代码、配置和数据格式。"
        },
        {
          icon: "🔧",
          title: "研究受限",
          desc: "机器人数据稀缺，研究者更需要控制上游数据配方和 backbone，而不是只调末端。"
        },
        {
          icon: "✨",
          title: "本文目标",
          desc: "VLA Foundry 要让整条 recipe 可控，而不是只把 action fine-tuning 暴露出来。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "训练路线：从语言底座走到机器人动作",
      badge: "inf",
      badgeLabel: "流程",
      bridge: "有了问题之后，下一步先建立全局地图：VLA Foundry 认为 VLA 不是只训练动作头，而是沿着语言能力、视觉语言能力、机器人动作能力逐步扩展。",
      analogy: {
        title: "生活类比：学徒先读说明书，再看图纸，最后上工位",
        text: "第 2 章先不展开具体模型实例，只看能力成长路线：LLM 像<b>读说明书</b>，先学会语言；VLM 像<b>看懂图纸</b>，把图像和文字对齐；VLA 像<b>上工位操作</b>，把观察和指令转成动作。",
        componentId: "vla-widget"
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "三段训练如何从通用能力走向机器人策略",
          desc: "点击 LLM、VLM、VLA，查看语言预训练、图文对齐和动作学习分别在训练链中承担什么角色。论文 Figure 1 是这里的证据锚点：它把三段训练放在同一条路径上展示。",
          componentId: "vla-widget"
        }
      ],
      formula: {
        lead: "论文中的三段训练可以按能力扩展理解：",
        unicode: "text-only pretrain -> vision-language pretrain -> robot action training",
        symbols: [
          {
            sym: "text-only pretrain",
            desc: "LLM 阶段用纯文本样本学习语言建模能力，形成后续多模态训练的语言底座。"
          },
          {
            sym: "vision-language pretrain",
            desc: "VLM 阶段用图文数据把视觉 token 和文本 token 对齐，让模型能看图并理解文字。"
          },
          {
            sym: "robot action training",
            desc: "VLA 阶段用机器人轨迹和动作监督，把观察与任务文本转成可执行动作。"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "三段能力",
          desc: "语言、视觉语言、动作不是同一件事，但会层层影响最终策略。"
        },
        {
          icon: "🔧",
          title: "同一路线",
          desc: "VLA Foundry 的价值是把 LLM、VLM、VLA 放入可复用训练路线。"
        },
        {
          icon: "✨",
          title: "统一口径",
          desc: "三段训练共享框架后，后续才能比较 backbone、数据配方和训练阶段的影响。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "统一框架：把实验变量显式配置出来",
      badge: "inf",
      badgeLabel: "框架",
      bridge: "知道训练路线之后，再看什么时候该用 VLA Foundry：当你想替换 backbone、数据配方或训练阶段时，框架要把这些变量显式暴露出来。这一章对应论文 Section 3.2 Framework。",
      analogy: {
        title: "生活类比：实验控制台把旋钮写进配方单",
        text: "把 VLA Foundry 想成一个实验控制台：recipe 像<b>配方单</b>，写清楚要换哪个 backbone、用什么数据、跑哪个训练阶段；registry 像<b>插槽面板</b>，按名字接上模型和数据；data mixer 像<b>配料台</b>，把不同数据流混在一起；最后统一送进<b>共享训练循环</b>。",
        componentId: "vla-widget"
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "一次实验如何从 recipe 被装配并执行",
          desc: "点击配置、Registry、数据、训练，观察 YAML recipe 如何显式写出实验变量，registry 如何按名装配模型和数据组件，data mixer 如何组织数据流，最后进入共享训练循环。",
          componentId: "vla-widget"
        }
      ],
      insight: "四层结构的作用是让“换 backbone、换数据配方、换训练阶段”从改源码变成改 recipe 和注册组件。",
      takeaways: [
        {
          icon: "🎯",
          title: "显式配置",
          desc: "模型、数据和训练阶段写进 recipe，减少隐藏实验变量。"
        },
        {
          icon: "🔧",
          title: "按名装配",
          desc: "registry 把 recipe 里的名字映射到模型、数据和 batch handler。"
        },
        {
          icon: "✨",
          title: "共享执行",
          desc: "同一训练循环承接 LLM、VLM、VLA 的分布式训练和 checkpoint。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "VLA 模型：真实输入如何变成未来动作",
      badge: "both",
      badgeLabel: "机制",
      bridge: "框架讲完之后，进入 VLA 本身：机器人不是回答一句话，而是接收多视角图像、任务文本、本体状态，并围绕当前时刻预测一段未来动作。这里融合论文 Section 4.1 与 Appendix A.2 的关键实现。",
      analogy: {
        title: "生活类比：先看桌面、听任务，再规划下一段手部动作",
        text: "VLA 像一个正在操作桌面的学生：先<b>看清多路视角</b>，再<b>听懂任务文本</b>，同时记住<b>当前手的位置</b>；真正训练时，不是只猜下一瞬间，而是规划<b>未来一小段动作轨迹</b>。",
        componentId: "vla-widget"
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "真实输入：图像、文本、本体和动作监督",
          desc: "切换图像、文本、本体、动作，查看四路相机、任务文本、过去/当前本体状态和未来动作监督如何组成一个 VLA 训练样本。论文 Figure 16 对应真实推理输入视角。",
          figure: "/images/paper/fig16_sensor_input.png",
          componentId: "vla-widget"
        },
        {
          kind: "module",
          id: "4.2",
          title: "过去、当前和未来窗口",
          desc: "拖动当前时刻位置，观察哪些时间步是可观测上下文，哪些时间步是训练监督。重点是因果约束：未来动作是监督目标，不是推理时可见输入。",
          componentId: "vla-widget"
        },
        {
          kind: "module",
          id: "4.3",
          title: "从观察 token 到 flow action head",
          desc: "点击图像编码器、LLM/VLM、observation token 和 flow transformer，查看信息如何从观察走向动作。论文 Figure 4 是这里的架构证据。",
          componentId: "vla-widget"
        }
      ],
      formula: {
        lead: "这一章可以用一个训练样本关系来记：",
        unicode: "sample = {images, task text, proprioception, future action chunk}",
        symbols: [
          {
            sym: "images",
            desc: "多视角、多时间步图像，是机器人观察环境的主要视觉输入。"
          },
          {
            sym: "proprioception",
            desc: "关节、速度或末端位姿等本体状态；论文强调推理时只能使用过去和当前信息。"
          },
          {
            sym: "future action chunk",
            desc: "围绕当前 anchor timestep 组织的一段未来动作序列，作为训练监督。"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "输入是多模态",
          desc: "VLA 样本同时包含视觉、语言、本体状态和动作监督。"
        },
        {
          icon: "🔧",
          title: "输出是一段动作",
          desc: "模型学习的是未来 action chunk，而不是只预测一个动作 token。"
        },
        {
          icon: "✨",
          title: "动作头可替换",
          desc: "论文主实验使用 flow-matching action head，但框架把它作为模块化组件。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "两条模型实例路线：从零训练 vs 接入强 backbone",
      badge: "both",
      badgeLabel: "实例",
      bridge: "有了框架和模型机制之后，看论文实际训练了什么。Section 4 发布两类模型：一条从零训练完整 LLM -> VLM -> VLA，另一条接入 Qwen3-VL 强 backbone。Figure 6 则展示这些策略被放到哪些 seen simulation tasks 上评估。",
      analogy: {
        title: "生活类比：新员工从头培养，也可以让有经验的人接入同一工位",
        text: "Foundry-VLA-1.7B 像<b>从零培养的新员工</b>，语言、视觉、动作都在同一套制度里训练；Qwen3VLA 像<b>有经验的工程师</b>，直接带着强 VLM backbone 入场，再学习机器人动作。",
        componentId: "vla-widget"
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "从零训练 vs 接入 Qwen3-VL backbone",
          desc: "切换 From Scratch 与 Qwen3-VL Backbone，观察两条路线的目的和结论差异。这里把 Table 3 直接做成交互式参数分解图，而不是原图搬运。",
          componentId: "vla-widget"
        },
        {
          kind: "module",
          id: "5.2",
          title: "评估任务的设计：用闭环 rollout 视频理解 LBM Eval",
          desc: "lbm_eval_oss 用高保真 Drake 物理引擎模拟双臂桌面操作与场景动力学；论文再从 rollout 的 Meshcat 场景取帧，并借助 <b>Blender 的 Cycles 渲染器</b>重新打光、渲染，得到 Figure 6 和官网视频。<b>Blender 负责把评测过程展示清楚，不负责训练策略，也不替代 LBM 的物理评测。</b>下面选择放置、推送、翻转三类任务，并切换 Success / Failure rollout，观察闭环执行。",
          componentId: "task-rollouts"
        }
      ],
      insight: "这一章的重点不是“谁名字更大”，而是两条路线共同证明同一训练框架可以支持从零训练和预训练 backbone 接入。",
      takeaways: [
        {
          icon: "🎯",
          title: "从零路线",
          desc: "Foundry-VLA-1.7B 证明完整 pipeline 可控，不代表它一定是最强模型。"
        },
        {
          icon: "🔧",
          title: "强 backbone 路线",
          desc: "Qwen3VLA 证明强 VLM backbone 可以在同一框架中转化为更强 VLA policy。"
        },
        {
          icon: "✨",
          title: "Figure 6 作用",
          desc: "它说明评估任务的操作类型和视觉场景，不是模型直接吃进去的传感器画面。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "实验结论：强 backbone 和合适训练阶段能提升闭环成功率",
      badge: "trn",
      badgeLabel: "结果",
      bridge: "模型实例之后，集中看论文的 aggregate 实验结论：强 Qwen3-VL backbone 带来约 23 个百分点提升，训练阶段和数据配方也会明显改变闭环成功率。",
      analogy: {
        title: "生活类比：固定底盘和赛道，只换训练配方",
        text: "把同一个 Qwen3-VL backbone 看成<b>固定底盘</b>，把 LBM simulation 看成<b>同一条测试赛道</b>。研究者只切换 ST、MT、FT 或数据配方，再看闭环 success rate 的趋势；这样才知道差异来自<b>训练阶段和数据分布</b>，而不是悄悄换了模型或评测规则。",
        componentId: "vla-widget"
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "实验结论",
          desc: "切换 Baseline、ST/MT/FT、Data recipe：Baseline 展示约 23 个百分点提升；ST/MT/FT 标注 Table 4 的训练样本预算，并说明 Figure 7 只报告成功率趋势；Data recipe 标注 Table 5 的 episodes 数和 Figure 9 的分布偏移结论。",
          componentId: "vla-widget"
        }
      ],
      insight: "论文的关键结果不是单个任务炫技，而是证明 backbone、训练阶段、数据配方这些上游选择会系统影响下游机器人策略。",
      takeaways: [
        {
          icon: "🎯",
          title: "强 backbone",
          desc: "Qwen3VLA-2.1B-MT 比 prior LBM multi-task policy 平均高约 23 个百分点。"
        },
        {
          icon: "🔧",
          title: "训练阶段",
          desc: "Qwen3VLA 系列中，多任务训练和后续微调通常进一步提升 seen tasks 表现。"
        },
        {
          icon: "✨",
          title: "数据配方",
          desc: "real-only 到仿真评估几乎失败，说明数据分布和评估环境必须一起说明。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-7",
      title: "价值与局限：这篇论文的价值是研究基础设施",
      badge: "both",
      badgeLabel: "定位",
      bridge: "最后回到论文定位：VLA Foundry 不是单点模型结构创新，而是让 VLA 研究更可复现、更容易做对照、更容易比较从零训练和预训练 backbone 路线。",
      analogy: {
        title: "生活类比：研究底座既要能换零件，也要有边界护栏",
        text: "把 VLA Foundry 想成一个<b>可重复搭建的实验底座</b>：研究者能替换 backbone、数据配方和 action head，再把结果放到同一评估口径下比较；但底座旁必须有<b>边界护栏</b>，提醒我们论文主要报告的是 LBM simulation，而不是已经验证的真实硬件泛化。",
        componentId: "vla-widget"
      },
      modules: [
        {
          kind: "module",
          id: "7.1",
          title: "Value / Limitation：贡献与边界同时讲清",
          desc: "切换 Value 和 Limitation：Value 强调可复现、可替换、可比较；Limitation 强调没有真实硬件结果、评估主要集中在 LBM simulation 和桌面双臂任务，且未系统解决最优数据配方与 safety/alignment/failure detection。",
          componentId: "vla-widget"
        }
      ],
      insight: "总结：VLA Foundry 的贡献是统一、可配置、可比较的 VLA 研究基础设施，而不是声称解决所有机器人泛化问题。",
      formula: {
        lead: "论文结果主要看闭环任务成功率：",
        unicode: "success rate = successful rollouts / all rollouts",
        symbols: [
          {
            sym: "successful rollouts",
            desc: "仿真任务中达到成功条件的 rollout 次数。"
          },
          {
            sym: "all rollouts",
            desc: "评估预算下运行的总 rollout 次数，论文常见设置为每任务 200。"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "主要结果",
          desc: "Qwen3-VL backbone 版本在论文报告设置中相对 prior LBM multi-task policy 明显提升。"
        },
        {
          icon: "🔧",
          title: "主要价值",
          desc: "贡献是统一、可配置、可比较的 VLA 研究基础设施。"
        },
        {
          icon: "✨",
          title: "主要局限",
          desc: "没有真实硬件结果，评估范围仍集中在 LBM 仿真。"
        }
      ]
    }
  ],
  bilibili: [
    {
      bvid: "BV1QxB9YuERU",
      title: "具身智能大模型简介",
      reason: "从机器人操作的挑战和代表性 VLA 工作入门，补足本文默认的领域背景。"
    },
    {
      bvid: "BV18zdVBbE4R",
      title: "StarVLA：从 Vision-Language Model 到 Vision-Language-Action 的统一开源框架",
      reason: "聚焦从 VLM 到 VLA 的统一开源训练框架，可与 VLA Foundry 的统一训练路线对照理解。"
    },
    {
      bvid: "BV1HAkZYLEZb",
      title: "具身智能领域的里程碑：OpenVLA讲解",
      reason: "了解 OpenVLA 的模型路线，有助于理解本文为何强调开放、可复现的 VLA 研究基础设施。"
    }
  ]
};
