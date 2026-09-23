import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "StepPO: Step-Aligned Policy Optimization for Agentic Reinforcement Learning",
    "titleZh": "StepPO：面向智能体强化学习的步对齐策略优化",
    "venue": "arXiv 2026",
    "authors": "Daoyu Wang, Qingchuan Li, Mingyue Cheng, Jie Ouyang, Shuo Yu, Qi Liu, Enhong Chen",
    "affiliation": "中国科学技术大学 认知智能全国重点实验室",
    "domain": "强化学习 / 大模型智能体 / 策略优化",
    "coreProblem": "智能体按交互步做决策，而既有 LLM RL 仍以 token 为优化单元，造成粒度错配。",
    "coreInsight": "把 MDP 与信用分配对齐到交互步，并配套步级目标与系统底座，才能更稳地训练多轮智能体。",
    "keywords": [
      "StepPO",
      "步级 MDP",
      "信用分配",
      "智能体强化学习"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "旧范式把整段行程拆成逐个油门微调：token 级建模与优势估计，难以对准真正的转向决策。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "StepPO 以完整路段为一步：状态→完整动作→奖励→下一状态，信用与更新都在步边界完成。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "粒度错配：token 优化对不上步决策",
      "badge": "inf",
      "badgeLabel": "问题",
      "bridge": "智能体靠完整交互步改变环境，但多数 LLM RL 仍在 token 上建模与更新。本节先让你看见这种错配。",
      "analogy": {
        "title": "油门微调对不上整段转向",
        "text": "一辆车不停做毫米级油门抖动，却迟迟选不对下一条路段——优化单元太碎，决策单元太大。",
        "componentId": "analogy-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "体验 token 级抖动",
          "desc": "加大微调强度，再切换步对齐，先感受粒度错配。<span class=\"term\" title=\"环境真正改变的一次完整交互回合\">交互步</span>才是智能体决策单位。",
          "componentId": "ch1-mismatch"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "Table 1：方法粒度对照",
          "desc": "对照论文 Table 1：谁在 MDP 上用步、谁在信用上用步。注意 LightningRL 已是步级 MDP，但信用仍偏轨迹。",
          "componentId": "ch1-table1",
          "figure": "./images/table-1-methods.png"
        }
      ],
      "insight": "需要把建模与信用分配的基本单位，从 token 提升到交互步。",
      "formula": {
        "lead": "token 级 MDP 把每个生成 token 当作动作，前缀即状态：",
        "unicode": "sᵢ = (x, y_<i),  aᵢ = yᵢ",
        "symbols": [
          {
            "sym": "sᵢ",
            "desc": "第 i 个 token 前的前缀状态"
          },
          {
            "sym": "aᵢ",
            "desc": "当前采样的 token"
          },
          {
            "sym": "x",
            "desc": "提示 / 上下文"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "错配本质",
          "desc": "智能体决策在步级生效，token 级优化过局部。"
        },
        {
          "icon": "🔧",
          "title": "先感受再命名",
          "desc": "抖动路况对应旧范式，整段导航对应步对齐。"
        },
        {
          "icon": "✨",
          "title": "下一步",
          "desc": "先解决轨迹如何忠实记录交互步。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "轨迹表征：从消息到步原生记录",
      "badge": "inf",
      "badgeLabel": "表征",
      "bridge": "若回放时重分词或压成扁平序列，训练信号会与真实交互错位。本节对比三种表征。",
      "analogy": {
        "title": "行程要按站记账",
        "text": "把整趟旅行抄成一段散文再重新断句，站与站的边界会糊掉；应按每一站单独记账。",
        "componentId": "analogy-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "切换三种行程账本",
          "desc": "文本消息、扁平 token、步原生记录，看哪一种对准转移。",
          "componentId": "ch2-repr"
        }
      ],
      "insight": "步原生记录既保留 token 似然，又让每条记录对应一次 MDP 转移。",
      "formula": {
        "lead": "重分词漂移说明解码再编码通常不可逆：",
        "unicode": "Tok(Detok(z)) ≠ z",
        "symbols": [
          {
            "sym": "z",
            "desc": "原始滚动生成的 token 序列"
          },
          {
            "sym": "Detok",
            "desc": "解码为文本"
          },
          {
            "sym": "Tok",
            "desc": "再次分词"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📘",
          "title": "文本账本",
          "desc": "易对接 Chat API，但易引入重分词漂移。"
        },
        {
          "icon": "📙",
          "title": "扁平 token",
          "desc": "一致性好，却缺少步边界结构。"
        },
        {
          "icon": "📗",
          "title": "步原生",
          "desc": "StepPO 用 s/a/r 记录对齐交互步。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "步级 MDP：完整动作才转移",
      "badge": "inf",
      "badgeLabel": "洞察",
      "bridge": "有了步记录，下一步是把智能体执行写成步级 MDP：观察→完整动作→奖励→下一状态（对照 Figure 1）。",
      "analogy": {
        "title": "选对路段再开",
        "text": "司机先看路况，再完成一次完整转向并进入下一路段——而不是每拧一毫米方向盘就换一张地图。",
        "componentId": "analogy-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "左右对照：碎转移 vs 整步转移",
          "desc": "左侧模拟 token 级“假转移”，右侧完成 <span class=\"term\" title=\"状态→完整动作→奖励→下一状态\">步级闭环</span>。判断：环境改变的边界在哪。",
          "componentId": "ch3-step-mdp",
          "figure": "./images/figure-1-mdp.png"
        }
      ],
      "insight": "步级 MDP 让状态、动作、奖励与智能体真实交互粒度一致。",
      "formula": {
        "lead": "步级目标对轨迹中每一步奖励折现求和：",
        "unicode": "J(θ) = E_τ[ Σ_{t=1}^T γ^{t-1} r_t ]",
        "symbols": [
          {
            "sym": "τ",
            "desc": "步级轨迹"
          },
          {
            "sym": "r_t",
            "desc": "第 t 步奖励"
          },
          {
            "sym": "γ",
            "desc": "折扣因子"
          },
          {
            "sym": "T",
            "desc": "交互步数（视界）"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧭",
          "title": "动作定义",
          "desc": "一步动作是面向环境的完整响应。"
        },
        {
          "icon": "⏱️",
          "title": "转移时机",
          "desc": "转移发生在动作执行并写入观察之后。"
        },
        {
          "icon": "🔗",
          "title": "对齐收益",
          "desc": "为信用分配与策略更新铺路。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "步级 GAE：在步边界传信用",
      "badge": "both",
      "badgeLabel": "数学",
      "bridge": "稀疏、延迟的终点奖励要传回关键中间决策。StepPO 用<span class=\"term\" title=\"广义优势估计：用 TD 残差平滑优势\">步级 GAE</span>，而不是在每个 token 上拆碎归因。",
      "analogy": {
        "title": "按站回传路况评分",
        "text": "终点到达的评价，应沿途站回传，而不是拆成每一毫米油门的碎分。",
        "componentId": "analogy-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "调节 γ 看衰减",
          "desc": "对比 token 长链与步链上延迟奖励的衰减。<span class=\"term\" title=\"折扣因子：越接近 1 越重视远期奖励\">γ</span> 越低，长链信号消失越快。",
          "componentId": "ch4-gae"
        }
      ],
      "insight": "在步状态 <code>s<sub>t</sub></code> 上估计价值，并跨步传播优势；动作内部仍可按 token 生成，但<strong>信用单位是交互步</strong>。",
      "formula": {
        "lead": "步级 TD 残差与 GAE：",
        "unicode": "δ_t = r_t + γ V(s^{(t+1)}) − V(s^{(t)}),  Â_t = Σ_l (γλ)^l δ_{t+l}",
        "symbols": [
          {
            "sym": "δ_t",
            "desc": "步级 TD 残差"
          },
          {
            "sym": "V",
            "desc": "步边界状态价值"
          },
          {
            "sym": "λ",
            "desc": "GAE 轨迹参数"
          },
          {
            "sym": "Â_t",
            "desc": "第 t 步优势估计"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📐",
          "title": "估哪里",
          "desc": "在步状态 st 上估计价值 V(st)。"
        },
        {
          "icon": "📡",
          "title": "怎么传",
          "desc": "优势在步与步之间传播；不把延迟奖励拆碎归因到表面 token。"
        },
        {
          "icon": "⚖️",
          "title": "为何更好",
          "desc": "比 token 局部、比轨迹整包更可辨。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "信用范式：局部、整包与逐步",
      "badge": "both",
      "badgeLabel": "对照",
      "bridge": "PPO 偏 token 级 GAE，GRPO 等把轨迹优势摊到所有 token；LightningRL 已是步级 MDP 但信用仍偏轨迹。StepPO 两边都选步级（Table 1）。",
      "analogy": {
        "title": "给每一次转向打分",
        "text": "有的评分盯着方向盘微抖，有的给整趟旅行同一分；StepPO 按每次完整转向打分。",
        "componentId": "analogy-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "三种信用分配的优势分布（示意）",
          "desc": "切换 Token / 轨迹 / Step，看优势形状。数值为教学示意，不是实验分数。对照论文 Figure 3。",
          "componentId": "ch5-credit",
          "figure": "./images/figure-3-credit.png"
        }
      ],
      "insight": "步级信用既能捕捉中间决策，又不会把整条轨迹糊成同一个信号。",
      "takeaways": [
        {
          "icon": "🔬",
          "title": "Token-GAE",
          "desc": "过局部，难表达完整动作后果。"
        },
        {
          "icon": "📦",
          "title": "轨迹相对",
          "desc": "过粗糙，淹没关键中间步。"
        },
        {
          "icon": "✅",
          "title": "Step-GAE",
          "desc": "与决策粒度对齐。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "多轮执行：按步推进行程",
      "badge": "inf",
      "badgeLabel": "推理",
      "bridge": "训练前先看推理时的多轮循环：每一步都是完整环境动作。",
      "analogy": {
        "title": "一站接一站前进",
        "text": "查询、检索、再查、作答——像旅途中连续完成的四次转向。",
        "componentId": "analogy-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "多跳行程推进",
          "desc": "逐步走完多轮工具交互路线。",
          "componentId": "ch6-rollout"
        }
      ],
      "insight": "长视界任务里，步边界是组织滚动与回放的自然切口。",
      "takeaways": [
        {
          "icon": "🔁",
          "title": "多轮结构",
          "desc": "观察与动作交替构成轨迹。"
        },
        {
          "icon": "🛠️",
          "title": "工具调用",
          "desc": "完整响应可含推理与工具。"
        },
        {
          "icon": "📍",
          "title": "终止",
          "desc": "最终作答结束行程。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "步级重要性采样与演员目标",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "一步动作仍可由多个 token 生成；论文保留 token 因式分解，但把信用与裁剪目标钉在步级比率上。",
      "analogy": {
        "title": "挂车内部可细分，评分看整段",
        "text": "挂车由许多车节组成，但路况评分按整段路段给出——内部可拆，责任单位仍是整段。",
        "componentId": "analogy-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "拖动动作长度",
          "desc": "观察步级比率如何写成 token 比率的连乘，以及裁剪目标作用在步上。",
          "componentId": "ch7-is"
        }
      ],
      "insight": "token 因式分解可以保留；改变的是接收信用的单位——交互步，而非放弃分词。",
      "formula": {
        "lead": "步级重要性比率仍可写成 token 比率连乘，再代入裁剪演员目标：",
        "unicode": "w_t(θ)=∏_i π_θ(y_{t,i}|…)/π_old(…),  L=E[min(w_tÂ_t, clip(w_t)Â_t)]",
        "symbols": [
          {
            "sym": "w_t",
            "desc": "第 t 步重要性比率"
          },
          {
            "sym": "y_{t,i}",
            "desc": "该步内第 i 个生成 token"
          },
          {
            "sym": "Â_t",
            "desc": "步级优势"
          },
          {
            "sym": "clip",
            "desc": "PPO 风格比率裁剪"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🔗",
          "title": "连乘形式",
          "desc": "论文用 token 比率乘积定义步级 w_t。"
        },
        {
          "icon": "🎯",
          "title": "信用单位",
          "desc": "优化责任落在步，而不是每个表面 token。"
        },
        {
          "icon": "✂️",
          "title": "裁剪目标",
          "desc": "演员损失在步级比率与优势上裁剪。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "StepPO 管线与系统底座",
      "badge": "trn",
      "badgeLabel": "结构",
      "bridge": "算法要对齐步，系统也要能存步、收步、异步训步。Agent-R1 偏训练抽象，Claw-R1 偏数据底座。",
      "analogy": {
        "title": "旅行系统分层",
        "text": "导航记录、评分回传、油门策略与后勤调度各司其职，共同服务“按站优化”。",
        "componentId": "analogy-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "投放一条轨迹看管线",
          "desc": "点击节点，或播放样本流过：步记录 → 步级 GAE / 比率 → PPO 更新 → Gateway / DataPool。",
          "componentId": "ch8-arch"
        }
      ],
      "insight": "StepPO 把表示、信用与更新钉在步边界；可扩展训练还依赖网关、数据池与异步滚动。",
      "takeaways": [
        {
          "icon": "🧩",
          "title": "算法核",
          "desc": "步记录 + 步级 GAE + 步级比率裁剪。"
        },
        {
          "icon": "🏗️",
          "title": "系统层",
          "desc": "异构智能体接入与异步滚动。"
        },
        {
          "icon": "⚡",
          "title": "效率",
          "desc": "共享前缀复用降低长轨迹成本。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "实验设定：公平对照清单",
      "badge": "trn",
      "badgeLabel": "设定",
      "bridge": "第 8 节在 HotpotQA 多步设定下对照 StepPO 与 token 级 PPO。本章只讲设定；曲线放到下一章。",
      "analogy": {
        "title": "同一路线、同一油表再比导航",
        "text": "两套导航用同一辆车、同一地图与同一油表；只换计分方式，才谈得上公平对比。",
        "componentId": "analogy-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "锁定控制变量",
          "desc": "逐项核对：同骨干、同任务、仅算法不同、<span class=\"term\" title=\"折扣因子\">γ=0.99</span>、<span class=\"term\" title=\"GAE 参数\">λ=1.0</span>、inner-join 对齐步。",
          "componentId": "ch9-gamma"
        }
      ],
      "insight": "论文用受控对照（同模型、数据、滚动与优化配置，仅算法不同）支持步级优化更贴合多步智能体。",
      "takeaways": [
        {
          "icon": "🧪",
          "title": "骨干",
          "desc": "实验使用 Qwen2.5-3B-Instruct。"
        },
        {
          "icon": "📐",
          "title": "超参",
          "desc": "报告曲线在 γ=0.99、λ=1.0。"
        },
        {
          "icon": "🔗",
          "title": "评估协议",
          "desc": "用内连接对齐交互步，再比两条曲线。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、边界与带走判断",
      "badge": "both",
      "badgeLabel": "结果",
      "bridge": "这是一篇带初步实验的观点论文：HotpotQA 上 StepPO 曲线多数时段高于 token 级 PPO；开放问题仍在。",
      "analogy": {
        "title": "终点成绩单",
        "text": "同一出发线，只比较两种导航——读数来自论文 Figure 5 的训练曲线（约值）。",
        "componentId": "analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "播放 HotpotQA 训练曲线",
          "desc": "复现 Figure 5 走势。<span class=\"approx-badge\">读图约值</span> 峰值约 0.64 vs 0.57；非正式表格精确数。",
          "componentId": "ch10-race",
          "figure": "./images/figure-5-curves.png"
        }
      ],
      "insight": "把 MDP 与信用对齐到交互步，是提升多轮智能体训练的有效方向；当前证据主要来自 HotpotQA 受控对照。",
      "takeaways": [
        {
          "icon": "🏆",
          "title": "主结果",
          "desc": "同设定下 StepPO 曲线多数时段高于 token 级 PPO。"
        },
        {
          "icon": "📊",
          "title": "读图要点",
          "desc": "只比同骨干同协议；关注整段走势，峰值仅为约值。"
        },
        {
          "icon": "🚧",
          "title": "边界",
          "desc": "奖励设计、异步偏离、异构智能体仍待解决；勿外推未测设定。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1xSK5etEH5",
      "title": "从强化学习0基础到 PPO→GRPO：讲清大模型 RL 主线",
      "reason": "帮助建立 token 级 PPO/GRPO 背景，再对照 StepPO 的步级对齐。播放量偏低但主题高度相关。",
      "cover": "https://i1.hdslb.com/bfs/archive/6058b33160ad38ef9ab94d3886e44a05a06338a8.jpg",
      "views": "2992播放"
    },
    {
      "bvid": "BV1XQLiz7EvY",
      "title": "[Agentic RL] 从零实现 GRPO：原理到代码",
      "reason": "Agentic RL 语境下的组相对优势实现，便于对照轨迹级信用分配的局限。",
      "cover": "https://i1.hdslb.com/bfs/archive/5bf713aea72cce4c24e1e3f1d2f1574f539b3e14.jpg",
      "views": "4.7万播放"
    },
    {
      "bvid": "BV1pXA5eyEEg",
      "title": "理解 GRPO 公式与 advantage / loss 计算",
      "reason": "深入优势与损失计算，为理解 StepPO 步级 GAE 与步级比率裁剪做铺垫。",
      "cover": "https://i0.hdslb.com/bfs/archive/2b9b232ee0c47db6a7e0913d7eafa6176c6ec588.jpg",
      "views": "6.3万播放"
    },
    {
      "bvid": "BV1nNibBuEGs",
      "title": "AgentEvolver：多步 Agent 环境 + GRPO 实战",
      "reason": "展示多步工具交互训练流程；播放量偏低但直接对应智能体多轮设定。",
      "cover": "https://i0.hdslb.com/bfs/archive/3c35e44fdd89b92a90fe7431fed914a3e121b72d.jpg",
      "views": "1354播放"
    }
  ]
};
