import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "Agentic Routing: The Harness-Native Data Flywheel",
    titleZh: "智能体路由：执行框架（Harness）原生的数据飞轮",
    venue: "arXiv:2607.11399v1 · 2026",
    authors: "Xinchen Liu 等 15 位作者",
    affiliation: "TokenRhythm Technologies",
    domain: "大语言模型智能体 · 系统与路由 · 训练数据",
    coreProblem: "固定模型或只看单次查询的路由器，看不见执行状态、失败恢复与跨步成本。",
    coreInsight: "每步依据完整 <b>Harness 状态</b>分配模型能力，再把环境验证结果沉淀为下一轮路由与专用模型训练数据。",
    keywords: [
      "Agentic Routing",
      "Harness 状态",
      "质量—成本前沿",
      "多模型聚合",
      "Arena 记录",
      "数据飞轮"
    ]
  },
  hero: {
    oldMethod: {
      desc: "同一支<b>万能麦克风</b>录完所有段落：简单段落也昂贵，困难段落失真后还会引出返工；只看原始请求，听不见当前执行状态。",
      componentId: "hero-fixed-track"
    },
    newMethod: {
      desc: "像录音师按<b>当前小节</b>调度设备：常规步骤用最便宜且够用的模型，高风险步骤再召集互补模型；监听与成本回写成下一轮训练数据。",
      componentId: "hero-agentic-mix"
    }
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "为什么不能一支麦克风录到底？",
      badge: "inf",
      badgeLabel: "先看问题",
      bridge: "先让固定模型面对不断变化的步骤，再把工具失败、上下文压力、验证与恢复状态接入路由器。<b>真正需要分配的是此刻的模型能力，而不是给整项任务贴一个静态标签。</b>",
      analogy: {
        title: "一支话筒，顾不过整首歌",
        text: "同一支话筒面对轻声与强奏时，电平一会儿过低、一会儿爆红。录音师必须根据当前小节换用合适的输入能力，不能只凭歌曲标题把一支话筒用到底。",
        componentId: "ch1-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "把同一个模型推到每一步",
          desc: "拖动步骤难度，观察固定模型如何从常规步骤的过度配置走向困难步骤的恢复风险。0—100 只用于教学联动，不是论文报告的难度分数、失败概率或路由阈值。",
          componentId: "ch1-fixed-model-stress"
        },
        {
          kind: "module",
          id: "1.2",
          title: "同一首歌，三种麦克风路由",
          desc: "依次比较规则路由、LLM 请求级路由与本文的 Harness 原生路由：输入范围从歌曲标签扩展到请求语义，再扩展到任务执行中的当前步骤与反馈。麦克风选择只表达信息范围，不是论文报告的声学规则或性能数值。",
          componentId: "ch1-route-repair"
        }
      ],
      insight: "真正要路由的不是“这个问题属于哪一类”，而是“此刻这一步需要什么能力、失败后要付出什么代价”。",
      formula: {
        lead: "论文先改写智能体的基本视角：",
        unicode: "Agent = Base Models + Harness",
        symbols: [
          {
            sym: "Agent",
            desc: "执行任务的智能体系统，而不是一次孤立的模型调用。"
          },
          {
            sym: "Base Models",
            desc: "提供语言、推理、代码、工具使用等异构能力的基础模型池。"
          },
          {
            sym: "Harness",
            desc: "管理观察、上下文、控制、动作、验证与恢复的智能体执行框架。"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎙️",
          title: "固定档位",
          desc: "固定模型把每一步都压在同一能力与价格档位上。"
        },
        {
          icon: "↩️",
          title: "轨迹结算",
          desc: "一次便宜调用若引出重试、修复或上下文重建，整条轨迹可能更贵。"
        },
        {
          icon: "🧭",
          title: "适用边界",
          desc: "步骤级路由适合状态多变且模型池异构的执行；只有一个模型或路由开销超过收益时未必值得。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "路由器到底看见什么？",
      badge: "inf",
      badgeLabel: "执行状态",
      bridge: "上一章说明只看请求会漏掉执行中的变化；本章把执行状态 hₜ 拆成六个可操作分组。完成后，学习者将得到联合输入 xₜ=(q,hₜ)，再交给下一章的单模型能力匹配器。",
      analogy: {
        title: "播放头照亮当前小节",
        text: "歌曲没有变，播放头所在的小节却在变。它每前进一步，都要重新查看上下文、工具、工件、恢复与监听结果，才能知道这一刻需要怎样的录音能力。",
        componentId: "ch2-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "点开一条执行状态",
          desc: "选择常规、工具失败或上下文压力场景，再决定哪些字段进入路由输入。六格是教学合并分组，不是论文状态模式的穷尽清单；执行后的结果、恢复、成本与延迟属于环境标签，不能泄漏到动作前输入。",
          componentId: "ch2-harness-state"
        }
      ],
      insight: "hₜ 不是聊天历史的别名，而是执行系统在第 t 步可观察、可验证、可恢复的完整状态。",
      formula: {
        lead: "单模型路由把原始任务与当前状态一起作为决策输入：",
        unicode: "xₜ = (q, hₜ)",
        symbols: [
          {
            sym: "xₜ",
            desc: "交给单模型路由器的第 t 步联合决策输入。"
          },
          {
            sym: "q",
            desc: "原始用户任务，说明整项任务要完成什么。"
          },
          {
            sym: "hₜ",
            desc: "第 t 步完整 Harness 状态，包含上下文、工具、工件、恢复与验证等执行信号。"
          }
        ]
      },
      takeaways: [
        {
          icon: "📝",
          title: "任务与位置",
          desc: "原始任务 q 说明要做什么，当前状态 hₜ 说明执行走到了哪里。"
        },
        {
          icon: "🔎",
          title: "状态会改需求",
          desc: "工具失败、验证结果与恢复状态会改变下一步的能力需求。"
        },
        {
          icon: "⏱️",
          title: "时间边界",
          desc: "只有动作前可观察的字段可作当步输入；状态缺失、错位或结果泄漏都会使判断失效。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "单模型：把能力用在刀刃上",
      badge: "inf",
      badgeLabel: "能力匹配",
      bridge: "第 2 章已经形成 xₜ=(q,hₜ)；现在路由器要在每一步只选一个模型。<b>目标不是无条件挑最强者，而是找到风险调整后足够且不过度的能力。</b>",
      analogy: {
        title: "旋到刚好够用的通道",
        text: "输入旋钮不是越往右越好。能力低于橙色需求线会留下失真与返工，远高于需求又会浪费预算；合适的位置是刚好覆盖当前小节的风险。",
        componentId: "ch3-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "拖动能力，覆盖风险",
          desc: "切换场景并拖动模型能力，寻找单模型的成本有效点。教学单轴不代表真实模型可以用统一分数排序；下方实验卡是完整基准的聚合运行点，不是滑块标定或逐路由因果证据。",
          componentId: "ch3-capability-match"
        }
      ],
      insight: "“便宜”必须把失败后的恢复也算进去；“强”也必须匹配当前状态，而不是只看排行榜。",
      formula: {
        lead: "单模型模式把已选集合限制为一个模型：",
        unicode: "Sₜ = g(M | hₜ) = {mₜ}",
        symbols: [
          {
            sym: "Sₜ",
            desc: "第 t 步实际调用的模型集合；在本章中集合大小恒为 1。"
          },
          {
            sym: "g",
            desc: "根据当前执行状态分配模型能力的路由算子或策略。"
          },
          {
            sym: "M",
            desc: "候选模型池，成员具有不同能力、价格、延迟与失败轮廓。"
          },
          {
            sym: "hₜ",
            desc: "第 t 步完整 Harness 状态。"
          },
          {
            sym: "mₜ",
            desc: "第 t 步唯一被调用的模型。"
          }
        ]
      },
      takeaways: [
        {
          icon: "1️⃣",
          title: "一次选一个",
          desc: "单模型路由每一步只调用一个模型，但这个模型可以随 Harness 状态改变。"
        },
        {
          icon: "🧮",
          title: "恢复也入账",
          desc: "最低标价不等于最低实际成本，失败后的重试与恢复也要进入判断。"
        },
        {
          icon: "🌱",
          title: "冷启动边界",
          desc: "LightGBM 是启动 Arena 数据流的冷启动匹配器；画像失真、模型池同质或路由开销过高时不应强行部署。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "一条前沿，不是一个最低价",
      badge: "both",
      badgeLabel: "核心目标",
      bridge: "前 3 章已经建立步骤级状态与模型选择；本章把一次选择放回完整轨迹，区分当前调用价、后续恢复价与独立的延迟代价。拖动 <b>λ</b> 不是寻找永恒冠军，而是在当前风险和预算下选择质量—成本前沿的操作点。",
      analogy: {
        title: "混音不是把价格推子拧到底",
        text: "同一首歌需要的是可用的质量—成本位置：眼前便宜的小节若引出重录，账单仍会回到整条轨迹。",
        componentId: "ch4-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "调 λ，不要只盯单步价格",
          desc: "拖动成本权重并切换恢复性，观察路线、轨迹损失、当前调用与恢复成本如何同步变化。画布中的数值均明确标为教学归一化，论文实测参照则按各自协议分开呈现。",
          componentId: "ch4-pareto-console"
        }
      ],
      insight: "路由器寻找的是当前风险与预算下可部署的轨迹级操作点；最低调用价可能不是最低实际成本，较低货币成本也可能伴随更多 token 与更长延迟。",
      formula: {
        lead: "把 Pareto 前沿写成一个可调部署点：",
        unicode: "min_g E[ℓ(τ) + λC(τ)]",
        symbols: [
          {
            sym: "g",
            desc: "路由算子或策略，决定每一步调用的模型或模型集合。"
          },
          {
            sym: "E",
            desc: "对任务与路由产生的执行轨迹取期望。"
          },
          {
            sym: "ℓ(τ)",
            desc: "完整轨迹的任务损失，论文定义为 1−R_task(τ)，越低越好。"
          },
          {
            sym: "C(τ)",
            desc: "包含全部调用与后续恢复的实际总成本，越低越好。"
          },
          {
            sym: "λ",
            desc: "非负的质量—成本权衡系数；模块中的 0—1 只是非基准教学窗口。"
          }
        ]
      },
      takeaways: [
        {
          icon: "🧾",
          title: "按轨迹结算",
          desc: "便宜必须包含当前调用与后续恢复，不能只报一步价格。"
        },
        {
          icon: "🎚️",
          title: "选择操作点",
          desc: "λ 选择前沿位置，不会产生脱离任务风险与预算的唯一冠军。"
        },
        {
          icon: "⏱️",
          title: "保留第三轴",
          desc: "分数越高越好；成本、token 与延迟越低越好，三者不能互相替代。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "多模型：不是越多越好",
      badge: "both",
      badgeLabel: "互补选择",
      bridge: "第 4 章说明怎样选择轨迹级操作点，本章进入 <b>k&gt;1</b> 的区域：新增调用只有带来可验证的边际信息才值得。你将统一比较 Table 7 的 Control、Diversity-heavy 与 Quality-heavy，并审计它们在同一协议下的真实动态路由结果。",
      analogy: {
        title: "别让三只相同的耳朵一起听",
        text: "多个候选只有带来不同证据或错误视角时才有价值；同样的盲点重复三次，只会增加调用。",
        componentId: "ch5-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "控制、多样性还是质量优先？",
          desc: "切换 Table 7 的 Control、Diversity-heavy 与 Quality-heavy；上方交互和下方表格共用同一策略名与实测值。注意策略名称描述优化倾向，不保证同名指标一定取得最高或最低结果。",
          componentId: "ch5-ensemble-selector"
        }
      ],
      insight: "多模型路由的核心不是“多”，而是新增候选是否带来新的、可验证的边际信息；互补性有用，也仍受总成本、覆盖与延迟约束。",
      formula: {
        lead: "论文在同一前沿目标上加入小的互补性引导：",
        unicode: "(Pₜ,aₜ)=argmin [ℓ+λC−αV(Pₜ|hₜ)−βρ]",
        symbols: [
          {
            sym: "Pₜ",
            desc: "当前步骤的候选模型集合，是候选池的子集。"
          },
          {
            sym: "aₜ",
            desc: "融合候选输出的聚合策略。"
          },
          {
            sym: "ℓ",
            desc: "该路由动作条件下的预期轨迹任务损失，越低越好。"
          },
          {
            sym: "λ",
            desc: "质量与成本的非负权衡系数。"
          },
          {
            sym: "C",
            desc: "所有提议调用与聚合开销的预期实际成本，越低越好。"
          },
          {
            sym: "α",
            desc: "小的非负互补正则权重，损失估计改善时退火趋零。"
          },
          {
            sym: "V(Pₜ|hₜ)",
            desc: "状态条件下的互补性代理量，不是真实前沿的新坐标。"
          },
          {
            sym: "β",
            desc: "可验证即时回报的非负权重。"
          },
          {
            sym: "ρ",
            desc: "聚合后结果的可验证即时回报。"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎛️",
          title: "联合选择",
          desc: "多模型动作同时决定谁来提议、怎样聚合，并把全部开销入账。"
        },
        {
          icon: "🧩",
          title: "购买边际信息",
          desc: "互补性奖励不同失败模式，不奖励没有降低损失的表面多样性。"
        },
        {
          icon: "🔎",
          title: "覆盖必须可见",
          desc: "Table 7 的最高动态路由分数来自 99/100 覆盖，不能隐藏分母差异。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "多个答案，怎样变成一个可执行结果？",
      badge: "inf",
      badgeLabel: "生成 → 验证 → 收束",
      bridge: "第 5 章决定哪些模型值得一起调用；本章追踪这些 proposer 如何独立生成候选，再依据当前 Harness 状态与最强可用验证信号，通过投票、验证器选择、模型裁判/融合或回退，交付唯一主输出。",
      analogy: {
        title: "多轨录音，最后只能交一条母带",
        text: "每条轨道先独立录制；控制台再依据可测信号选轨、投票、混音或切换备用轨。轨道变多不会自动变好，收束规则与聚合成本同样决定成品。",
        componentId: "ch6-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "两阶段工作台：先产候选，再决定相信谁",
          desc: "阶段一由多个 proposer 独立生成候选；阶段二让聚合策略读取候选、模型身份、当前状态与验证信号，交付唯一结果。切换 Coding、Tool-use 与 Research，再比较投票、验证器选择、模型裁判/融合和回退。",
          componentId: "ch6-aggregation-steps"
        }
      ],
      insight: "聚合不是平均或拼接答案，而是用当前任务最可信的结算信号，把候选集合收束成一个行动；候选调用与聚合器必须作为同一次路由动作一起计价。",
      formula: {
        lead: "Router 联合决定候选集合 Pₜ 与聚合策略 aₜ；随后 aₜ 把模型身份、独立候选和当前状态映射成最终结果：",
        unicode: "r̂ₜ = aₜ({(m,rₘ)}ₘ∈Pₜ, hₜ)",
        symbols: [
          {
            sym: "r̂ₜ",
            desc: "送回 Harness 的单一可执行结果。"
          },
          {
            sym: "aₜ",
            desc: "当前步骤选择的状态感知聚合策略。"
          },
          {
            sym: "m",
            desc: "候选集合中的某个模型。"
          },
          {
            sym: "rₘ",
            desc: "模型 m 独立生成的候选输出。"
          },
          {
            sym: "Pₜ",
            desc: "当前步骤选择的提议者集合。"
          },
          {
            sym: "hₜ",
            desc: "第 t 步完整 Harness 状态，向聚合器提供风险与验证上下文。"
          }
        ]
      },
      takeaways: [
        {
          icon: "🧩",
          title: "先独立生成，再统一收束",
          desc: "多候选不是拼接文本；Pₜ 与 aₜ 是一次联合路由动作。"
        },
        {
          icon: "✅",
          title: "用最强可用信号判断",
          desc: "代码看执行，工具看约束，研究看事实、引用、一致性与量表。"
        },
        {
          icon: "🧮",
          title: "聚合器也在预算里",
          desc: "准确率模式可为强聚合付费；成本模式必须防止聚合开销吃掉节省。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-7",
      title: "坏决策为何也能成为好数据？",
      badge: "trn",
      badgeLabel: "离策略学习",
      bridge: "前几章已经完成一次路由动作；本章追问动作执行后如何学习。先看行为克隆怎样复制旧错误，再把模型选择与环境结算分开，进入带条件的离策略更新。",
      analogy: {
        title: "回放失败，不是照抄失败",
        text: "录音播放头回到一次失败的小节。红灯说明这里曾经失败，会话日志则保存当时选了哪条通道、后来怎样补录以及多花了多少时间；下一次训练要读懂这些结果，而不是把旧通道当成标准答案。",
        componentId: "ch7-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "7.1",
          title: "复制旧选择，还是学习旧结果？",
          desc: "直接模仿上一代选择会把失败当答案。论文提出把动作与环境结算分开，再用带倾向信息的结果更新策略；但覆盖、信用分配和验证质量不足时，修正并不自动保证可靠。",
          componentId: "ch7-offpolicy-replay"
        }
      ],
      insight: "可学习的不是“旧路由器选了谁”，而是“在什么状态下选了谁，最后发生了什么”。",
      formula: {
        lead: "第 r+1 代路由器从累计 Arena 语料的环境结果中更新：",
        unicode: "θ⁽ʳ⁺¹⁾ = argmin_θ Ê_D⁽ʳ⁾[ℓ(τ) + λC(τ)]",
        symbols: [
          {
            sym: "θ⁽ʳ⁺¹⁾",
            desc: "第 r+1 代学习型路由器的参数。"
          },
          {
            sym: "θ",
            desc: "优化时搜索的路由器参数。"
          },
          {
            sym: "Ê",
            desc: "使用逆倾向或双重稳健修正的离策略估计；它不等于无条件无偏保证。"
          },
          {
            sym: "D⁽ʳ⁾",
            desc: "训练下一代策略时累计的 Arena 语料。"
          },
          {
            sym: "ℓ(τ)",
            desc: "完整轨迹的任务损失，越低越好。"
          },
          {
            sym: "λ",
            desc: "质量与成本之间的非负权衡系数。"
          },
          {
            sym: "C(τ)",
            desc: "含后续恢复的轨迹实际总成本，越低越好。"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎬",
          title: "动作不是金标",
          desc: "环境对完整轨迹的结算才提供监督。"
        },
        {
          icon: "⚖️",
          title: "学习结果",
          desc: "离策略修正旨在改善结果，而不是同意旧策略。"
        },
        {
          icon: "🛡️",
          title: "条件缺一不可",
          desc: "覆盖、倾向记录、信用分配与可信验证共同决定记录是否可用。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-8",
      title: "路由器怎样真正跑在 Harness 里？",
      badge: "trn",
      badgeLabel: "系统结构",
      bridge: "第 7 章说明记录怎样训练下一代；本章把冷启动四步、学习型三组件和两级门控接成真实执行路径。关键不是堆更多层，而是让路由器自身的成本与延迟也接受前沿约束。",
      analogy: {
        title: "把当前小节插进正确通道",
        text: "插线头不是朝最贵的通道移动，而是读取当前小节的要求后接入合适通道。显然状态留给便宜门控；只有不确定、高价值或失败后难恢复的小节，才值得调用更重的学习型路由器。",
        componentId: "ch8-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "8.1",
          title: "点击路由栈，看信号如何变成模型选择",
          desc: "OPENSQUILLA 用四个轻量步骤与 LightGBM 启动 Arena 数据流，后续代次再编码 Harness 状态和模型供应画像并预测损失、成本。点击节点会同时改变活动路径、当前值、输出与反馈；静态 Figure 1 只作全局数据流旁证。",
          componentId: "ch8-router-architecture"
        }
      ],
      insight: "系统结构的关键不是层数，而是让路由器自身的成本也留在质量—成本前沿上。",
      takeaways: [
        {
          icon: "🌱",
          title: "冷启动种子",
          desc: "g⁽⁰⁾ 用四个轻量步骤和 LightGBM 开始记录，不是最终路由器。"
        },
        {
          icon: "🧩",
          title: "双侧编码",
          desc: "后续代次分别编码执行状态与模型供应，再预测动作的损失和成本。"
        },
        {
          icon: "🚪",
          title: "两级门控",
          desc: "重型判断只服务于值得支付额外开销的状态，晋级还需实测前沿改善。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-9",
      title: "收益、代价与边界",
      badge: "both",
      badgeLabel: "实验结论",
      bridge: "机制已经闭环，最后必须回到证据边界。先在锁定协议卡内比较质量、货币成本、token、延迟与覆盖，再审计论文明确指出的四项限制：<b>任务覆盖、路线级解释、墙钟延迟与生产部署</b>。",
      analogy: {
        title: "每张实验卡只用自己的刻度",
        text: "主输出表针可以在一张实验卡里从共同基线走向路由结果，但换了基准、Harness 或搜索提供商就必须换表盘。质量向右更好；货币成本、token 与延迟向左更好；覆盖率不能藏在小字里。",
        componentId: "ch9-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "9.1",
          title: "先选协议，再启动比较",
          desc: "这不是一张总榜：每个场景把基准、Harness、搜索提供商、覆盖口径和分数尺度锁成一张卡。动画只支持当前卡的聚合操作点结论；多模型的 token 与墙钟延迟保留在结果表中，未完成的路线级归因进入 9.2 单独审计。",
          componentId: "ch9-benchmark-race"
        },
        {
          kind: "module",
          id: "9.2",
          title: "四路证据监听：论文还没有证明什么？",
          desc: "选择第 1、2、3、4 点——任务覆盖、路由归因、推理延迟或部署迁移，比较“论文已展示”与“仍缺证据”。四项均属于作者明确限定、表格直显或论文列出的未来工作。",
          componentId: "ch9-limitations-console"
        }
      ],
      insight: "论文已经证明若干锁定协议内的端到端质量—成本操作点；但跨任务泛化、逐路由解释与低时延生产部署，仍不能由这些终点结果自动推出。",
      takeaways: [
        {
          icon: "🔒",
          title: "先锁协议",
          desc: "基准、Harness、provider、覆盖与分数尺度不能拆开混赛。"
        },
        {
          icon: "⏱️",
          title: "代价要同屏",
          desc: "多模型可能降低货币成本，却显著增加 token 与墙钟延迟。"
        },
        {
          icon: "🔎",
          title: "前沿不是闭环证明",
          desc: "端到端前沿已经展示；跨场景泛化、逐路由归因与生产部署仍待验证。"
        }
      ]
    }
  ],
  bilibili: [
    {
      bvid: "BV13RJ7zMEkD",
      title: "AI Agent 五大工作模式详解｜图解LLM智能体执行流程",
      reason: "直接覆盖 Routing、并行化与评估优化，适合先建立 Agent 工作流全景；播放量不高，但与本文“路由—执行—反馈”主线最贴近。",
      cover: "https://i0.hdslb.com/bfs/archive/4c2805d0eafb7cda5e0e4b79138ca46bfc9612af.jpg",
      views: "1005播放"
    },
    {
      bvid: "BV13uE8zeEVz",
      title: "Agent核心架构全解：四大设计模式＋五类工作流机制",
      reason: "把 Routing、Parallelization 与 Evaluator-Optimizer 放进同一架构，帮助理解为什么路由不能脱离执行 Harness。",
      cover: "https://i1.hdslb.com/bfs/archive/924fd7d4ec3d704ff39c3c5b5c16fef9f6118225.jpg",
      views: "2636播放"
    },
    {
      bvid: "BV1TAZKYEEzh",
      title: "OpenAI Agents 多智能体开发框架：交接与路由模式",
      reason: "提供任务分流与专业代理的工程视角；它讲的是代理交接而非本文的步骤级模型路由，教程会明确这一区别。",
      cover: "https://i0.hdslb.com/bfs/archive/c4d64ec85765af478d9a59226be64b416fa0dd66.jpg",
      views: "1435播放"
    },
    {
      bvid: "BV1qaPZzHESy",
      title: "高校大模型通用教程：动手学大模型智能体",
      reason: "系统补充智能体评估、多智能体与强化微调背景，适合作为延伸课程；论文的具体数值和结论仍以本页面证据为准。",
      cover: "https://i1.hdslb.com/bfs/archive/69b4b414b8373826719ececc5190950fda54b1ab.jpg",
      views: "1.4万播放"
    }
  ]
};
