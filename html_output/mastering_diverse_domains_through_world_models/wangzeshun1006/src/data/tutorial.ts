import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Mastering Diverse Domains through World Models",
    "titleZh": "DreamerV3：通过世界模型掌握多样领域",
    "venue": "arXiv:2301.04104v2 · 发表于 Nature (2025)",
    "authors": "Danijar Hafner, Jurgis Pasukonis, Jimmy Ba, Timothy Lillicrap",
    "affiliation": "Google DeepMind & University of Toronto",
    "domain": "强化学习 · 世界模型 · 基于模型的 RL",
    "coreProblem": "强化学习算法换一个应用领域就要重新调参：通用性依赖大量专家人力，把 RL 挡在实验室里。",
    "coreInsight": "学一个<b>世界模型</b>，在隐空间<b>想象</b>中训练演员与评论家；再用规范化、平衡与变换的鲁棒技术，让同一套超参覆盖 150+ 任务。",
    "keywords": [
      "世界模型",
      "隐空间想象",
      "symlog",
      "回报归一化",
      "固定超参数"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "单墙策略：换一面没爬过的墙就从头摸索——每次换域都要重新调参。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "DreamerV3：先读线（世界模型），再在想象里演练（想象轨迹），一套配置换墙不换流程。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "一套配置，八种世界",
      "badge": "inf",
      "badgeLabel": "入门",
      "bridge": "强化学习换一个领域就要重新调参，这是「通用」最大的拦路虎。本节先看清这个问题，再认识 Dreamer 的核心循环：交互、建模、想象、行动。",
      "analogy": {
        "title": "换一面没爬过的墙",
        "text": "攀岩者站在一面从没爬过的墙前，不知道哪个点牢、哪条线顺，只能先伸手摸一个点试试。换一面墙就重新摸索一遍——这正是强化学习换一个领域时发生的事。",
        "componentId": "ana1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "换域就要重调：旋钮组 vs 固定配置卡",
          "desc": "点击五个领域 chip，看左侧专用算法的旋钮怎么跟着换；右侧 Dreamer 的配置卡始终纹丝不动。",
          "componentId": "m11"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "核心循环：观察 → 建模 → 想象 → 行动",
          "desc": "用「上一步 / 下一步」亲手走一遍 Dreamer 的循环：从真实交互到隐空间想象，再回到行动。",
          "componentId": "m12"
        }
      ],
      "insight": "真正通用的不是某一个策略，而是<b>先学一个能预测未来的世界模型，再在它生成的想象里改进策略</b>——这正是 Dreamer 的做法。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "换域重调是通病",
          "desc": "专用算法每到一个新领域都要重新标定超参。"
        },
        {
          "icon": "🔁",
          "title": "核心循环固定",
          "desc": "交互、重放、建模、想象、再行动，三个网络同步训练。"
        },
        {
          "icon": "🧗",
          "title": "通用来自机制",
          "desc": "固定配置之所以能跨 150+ 任务，靠的是\"模型 + 想象\"这条路，而不是更多调参。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "世界模型的大脑：把画面压成离散隐码",
      "badge": "inf",
      "badgeLabel": "入门",
      "bridge": "循环的第一步是「看见」——把画面变成能推理的内部状态。本节打开世界模型的表征：记忆流 h、离散隐码 z 与 RSSM 的六条式子。",
      "analogy": {
        "title": "把整面墙描成一张简图",
        "text": "攀岩者不会记住墙上每一个像素：他用粉笔圈出几个关键支点，把整面墙压成一张小简图。世界模型的<b>编码器</b>就在做这件事——把观测压成一小串离散隐码。",
        "componentId": "ana2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "编码器：像素 → 离散隐码",
          "desc": "点击岩壁上的四个区域，看它被压成哪些隐码；右侧的记忆带显示 h 如何把这些帧串起来。",
          "componentId": "m21"
        }
      ],
      "formula": {
        "lead": "世界模型的六条式子各司其职：一条记住过去，一条把画面压成隐码，其余四条负责预测未来、奖励、是否继续，并把隐码还原回画面。",
        "unicode": "序列模型： h_t = f_ϕ(h_{t−1}, z_{t−1}, a_{t−1})；编码器： z_t ~ q_ϕ(z_t | h_t, x_t)；动态预测器： ẑ_t ~ p_ϕ(ẑ_t | h_t)；奖励预测器： r̂_t ~ p_ϕ(r̂_t | h_t, z_t)；继续预测器： ĉ_t ~ p_ϕ(ĉ_t | h_t, z_t)；解码器： x̂_t ~ p_ϕ(x̂_t | h_t, z_t)",
        "symbols": [
          {
            "sym": "x_t",
            "desc": "当前观测（图像或向量）；图像走卷积编码"
          },
          {
            "sym": "a_t",
            "desc": "上一步执行的动作"
          },
          {
            "sym": "h_t",
            "desc": "循环状态（记忆流），由序列模型更新"
          },
          {
            "sym": "z_t",
            "desc": "当帧的随机离散表征（隐码），从 softmax 分布采样"
          },
          {
            "sym": "ϕ",
            "desc": "世界模型参数；q_ϕ 是编码器分布，p_ϕ 是预测分布"
          },
          {
            "sym": "~",
            "desc": "从分布中采样；直通梯度让采样也能被训练"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧠",
          "title": "模型状态 = 记忆 + 隐码",
          "desc": "h_t 记来龙去脉，z_t 记当前帧。"
        },
        {
          "icon": "🗜️",
          "title": "学习的是\"够用\"的压缩",
          "desc": "重建逼着隐码保留任务需要的信息。"
        },
        {
          "icon": "🔮",
          "title": "六条式子分工",
          "desc": "先能预测，才谈得上想象。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "在想象里练习：几乎不花环境步数的训练",
      "badge": "inf",
      "badgeLabel": "入门",
      "bridge": "模型能预测未来了，训练是不是就可以不碰真实环境？本节回答 Dreamer 的想象力从哪来——演员与评论家都在想象轨迹上练习。",
      "analogy": {
        "title": "先在心里爬一遍",
        "text": "攀岩者会在出手前闭眼把整条线路在脑中走一遍：手在空气里比划，身体想象每一次重心转移。Dreamer 的<b>演员与评论家</b>也是这样练出来的——整段训练都发生在世界模型生成的<b>想象轨迹</b>上。",
        "componentId": "ana3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "真实环境 vs 想象轨迹",
          "desc": "按「开始对比」，左右两个面板同时开跑：左边每一步都消耗真实环境步数，右边的每一步都由世界模型生成。",
          "componentId": "m31"
        }
      ],
      "formula": {
        "lead": "在想象里，演员从策略分布里选动作，评论家则估计这个状态往后能拿多少回报——两者都直接作用在模型状态 s_t 上。",
        "unicode": "演员： a_t ~ π_θ(a_t | s_t)　　评论家： v_ψ(R_t | s_t)",
        "symbols": [
          {
            "sym": "π_θ",
            "desc": "演员策略；θ 是它的参数，输出动作分布"
          },
          {
            "sym": "v_ψ",
            "desc": "评论家；ψ 是它的参数，输出回报的分布"
          },
          {
            "sym": "s_t",
            "desc": "模型状态 {h_t, z_t}，想象轨迹上的每一步都在这个空间里"
          },
          {
            "sym": "R_t",
            "desc": "从 t 往后的回报"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "💭",
          "title": "训练在想象里",
          "desc": "演员与评论家只吃世界模型生成的轨迹。"
        },
        {
          "icon": "🚫",
          "title": "行动不做搜索",
          "desc": "交互时直接采样动作，省掉前向搜索的开销。"
        },
        {
          "icon": "💸",
          "title": "零环境成本",
          "desc": "想象步数不写进环境交互账本。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "世界模型的三条损失线：怎么练、怎么不练坏",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "想象要靠谱，先把世界模型本身练稳。本节打开三条损失——重建、动力学、表征——以及防止它们互相拖垮的两个「仲裁器」。",
      "analogy": {
        "title": "简图要和真墙对得上",
        "text": "简图画得太粗，会漏掉关键支点；画得太细，又把每一道纹理都背下来，反而记不住重点。世界模型的三条损失，就是逼着“简图”既不漏、也不冗。",
        "componentId": "ana4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "三条损失，各训练谁",
          "desc": "点击三条损失中的任意一条，看它把梯度送给哪些网络部件；再点一次可取消选择。",
          "componentId": "m41"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "自由比特与 KL 平衡：两个仲裁器",
          "desc": "在三种配置间切换，看动力学与表征两条 KL 的力量对比和“表征健康度”如何变化。",
          "componentId": "m42"
        }
      ],
      "insight": "三条损失会互相拉扯，而且不同领域的拉扯比例天生不一样——所以还需要两个“仲裁器”，让固定超参不至于被某个域拉垮。",
      "formula": {
        "lead": "三条损失的加权和就是世界模型的总目标；其中动力学与表征这两条 KL 用 max(1, KL) 做截断，别让它们过度压低。",
        "unicode": "L(ϕ) = E[Σ_t(β_pred·L_pred + β_dyn·L_dyn + β_rep·L_rep)]，L_dyn(ϕ) = max(1, KL[sg(q_ϕ(z_t|h_t,x_t)) ‖ p_ϕ(z_t|h_t)])，L_rep(ϕ) = max(1, KL[q_ϕ(z_t|h_t,x_t) ‖ sg(p_ϕ(z_t|h_t))])",
        "symbols": [
          {
            "sym": "L_pred",
            "desc": "预测损失：重建 + 奖励（symlog 平方）+ 继续（逻辑回归）"
          },
          {
            "sym": "L_dyn",
            "desc": "动力学损失：让序列模型预测下一步隐码"
          },
          {
            "sym": "L_rep",
            "desc": "表征损失：让编码器输出更可预测"
          },
          {
            "sym": "sg(·)",
            "desc": "停止梯度运算符；两条 KL 各在一侧断开梯度"
          },
          {
            "sym": "β",
            "desc": "三项权重：1 / 1 / 0.1"
          },
          {
            "sym": "max(1, ·)",
            "desc": "自由比特截断：KL 低于 1 nat ≈ 1.44 bit 时不再惩罚"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧱",
          "title": "三条损失分工",
          "desc": "重建管信息、动力学管预测、表征管可学。"
        },
        {
          "icon": "🪢",
          "title": "自由比特托底",
          "desc": "低于 1 nat 的 KL 不再被压，防止表征坍塌。"
        },
        {
          "icon": "⚖️",
          "title": "KL 平衡与 1% 均匀",
          "desc": "两条 KL 各让一步，分布永不变成确定值。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "评论家：把每一步的回报估出来",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "世界模型能预测未来，但训练还要靠回报来指路。本节看评论家如何给每一步估价，演员又如何把跨域的回报尺度稳住。",
      "analogy": {
        "title": "先试探，再发力",
        "text": "攀岩者不会把全部重心压在一个没试过的点上：先轻拉确认它扛得住，再决定是否发力。评论家对每一步的估值也是这种“先掂量、再托付”——只不过它掂量的是整段未来。",
        "componentId": "ana5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "λ-回报：从末端一步步折回来",
          "desc": "用「往回折一步 / 回到末端」沿一条 15 步的想象轨迹走一遍，看回报估计如何从末端自举着折回来。",
          "componentId": "m51"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "演员的节奏：熵与回报尺度",
          "desc": "拖动「奖励尺度」滑块，对比「不归一化」与「回报归一化」两种情况下，演员的探索节奏会发生什么。",
          "componentId": "m52"
        }
      ],
      "formula": {
        "lead": "评论家的目标是往回折出来的 λ-回报；演员则在归一化后的回报上做 Reinforce，并用熵项保留探索。",
        "unicode": "R^λ_t = r_t + γ·c_t·[(1−λ)·v_t + λ·R^λ_{t+1}]，R^λ_T = v_T；L(θ) = −Σ_t sg((R^λ_t − v_ψ(s_t)) / max(1, S))·log π_θ(a_t|s_t) + η·H[π_θ(·|s_t)]",
        "symbols": [
          {
            "sym": "R^λ_t",
            "desc": "第 t 步的 λ-回报，评论家的训练目标"
          },
          {
            "sym": "r_t",
            "desc": "第 t 步真实奖励（从想象轨迹读出）"
          },
          {
            "sym": "γ",
            "desc": "折扣因子 0.997（折扣视野约 333 步）"
          },
          {
            "sym": "c_t",
            "desc": "继续标志（1 表示没结束）"
          },
          {
            "sym": "v_t",
            "desc": "评论家当前估值（分布读出期望）"
          },
          {
            "sym": "λ",
            "desc": "折中系数 0.95；越大越看重后续回报"
          },
          {
            "sym": "π_θ",
            "desc": "演员策略；θ 是它的参数"
          },
          {
            "sym": "S",
            "desc": "回报范围（5%–95% 分位差，EMA 平滑）；max(1, S) 是分母下限"
          },
          {
            "sym": "η",
            "desc": "熵正则系数 3×10⁻⁴；H 是熵"
          },
          {
            "sym": "sg(·)",
            "desc": "停止梯度：在估计器里不让价值项被更新"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📏",
          "title": "评论家步步估价",
          "desc": "每个模型状态一个回报分布（指数分桶），再加 EMA 正则与零初始化稳住训练。"
        },
        {
          "icon": "🔁",
          "title": "λ-回报往回折",
          "desc": "奖励与自举估值按 λ=0.95 折中；末端直接用估值起头。"
        },
        {
          "icon": "🎚️",
          "title": "演员要稳先归一化",
          "desc": "回报先压到可比范围，固定熵系数 3×10⁻⁴ 才能跨域共用；分母下限 1 保护小回报。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "跨量级的数字：symlog 与 twohot",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "不同领域的数值能差好几个量级，梯度很容易被大目标绑架。本节看 symlog 与双热编码两个变换，如何把量级差驯服。",
      "analogy": {
        "title": "把 5 米到 50 米的落差折进一张图",
        "text": "一张路线图要同时画清 5 米的裂缝和 50 米的仰角。Dreamer 面对数值量表也一样：<b>symlog</b> 把大幅值压扁、小数值保留——一张图里同时读得清两种量级。",
        "componentId": "ana6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "symlog：两把尺子",
          "desc": "拖动橙色手柄，让同一个数值同时落在「原始数轴」和「symlog 刻度尺」上，比一比两把尺子的疏密。",
          "componentId": "m61"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "twohot：把回归变成“落在哪两个桶”",
          "desc": "切换三个目标值，对比「直接回归」与「twohot 分类」两种预测方式下梯度条的变化。",
          "componentId": "m62"
        }
      ],
      "formula": {
        "lead": "symlog 压缩数值本身；symexp twohot 则把“预测一个数”换成“预测它落在哪些桶”。",
        "unicode": "symlog(x) = sign(x)·ln(|x| + 1)，symexp(x) = sign(x)·(e^{|x|} − 1)；ŷ = softmax(f(x))ᵀ·B，B = symexp([−20 … +20])",
        "symbols": [
          {
            "sym": "symlog / symexp",
            "desc": "互为逆变换；压缩两端、保留符号、原点近似恒等"
          },
          {
            "sym": "B",
            "desc": "指数间隔的分桶位置集合（−20 到 +20）"
          },
          {
            "sym": "f(x)",
            "desc": "网络输出的分桶 logits；softmax 转成概率"
          },
          {
            "sym": "ŷ",
            "desc": "读出值 = 桶位置按概率加权平均，可取桶间连续值"
          },
          {
            "sym": "twohot",
            "desc": "训练目标：两个相邻桶权重和为 1"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📐",
          "title": "symlog 压两端",
          "desc": "大数值不再挤压小数值的表示空间。"
        },
        {
          "icon": "🪣",
          "title": "twohot 分桶",
          "desc": "预测变成概率分配，梯度与目标大小解耦。"
        },
        {
          "icon": "🧪",
          "title": "消融撑腰",
          "desc": "把 twohot 换成 Huber 回归，平均表现会变差。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "把零件拼起来：一次完整训练里的所有部件",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "零件都认识了，现在把它们装成完整的一次训练：环境、重放缓冲、世界模型、想象、演员与评论家，外加让循环跑稳的工程细节。",
      "analogy": {
        "title": "回放录像，重复练同一段",
        "text": "同一段线路，攀岩者会反复回放、反复重练——这就是<b>重放缓冲</b>的作用：把经历存起来，让世界模型和策略反复“刷同一套题”。",
        "componentId": "ana7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "交互式回路图：数据在哪儿流动",
          "desc": "点击回路里的任意部件，看它的输入、输出与在训练中的角色；点击「播放回路」会沿箭头走一遍完整数据流。",
          "componentId": "m71"
        }
      ],
      "takeaways": [
        {
          "icon": "🔁",
          "title": "回路六件套",
          "desc": "环境、缓冲、模型、想象、演员、评论家。"
        },
        {
          "icon": "🧰",
          "title": "工程细节决定能不能跑",
          "desc": "AGC 裁剪、LaProp、RMSNorm/SiLU、分块 GRU。"
        },
        {
          "icon": "🎛️",
          "title": "重放比可调",
          "desc": "每步交互训练多少步，从 0.1 到 1024 按预算选择。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "成绩单与边界：八种世界、一颗钻石",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "最后一节：把这套系统放到八个领域、150+ 任务上一起交卷，并如实交代它的成绩、协议边界与局限。",
      "analogy": {
        "title": "触顶，完攀",
        "text": "同一位攀岩者、同一套读线方法，换一面又一面墙，最终都摸到了顶点。Dreamer 的成绩单也是这样：<b>一套配置</b>，八个领域，一起交卷。",
        "componentId": "ana8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "跨域成绩单：先选赛道，再看结果",
          "desc": "选择一个基准，按「开始对比」让条带从零跑到验证过的分数；条带末端的裸数字与反馈里的协议提示就是完整证据。",
          "componentId": "m81"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "规模接上去，能力跟着涨",
          "desc": "拖动模型规模滑块（12M → 400M），看性能趋势与“所需交互量”的箭头如何一起变化。",
          "componentId": "m82"
        }
      ],
      "insight": "同一套配置在八个领域、150+ 任务上以固定超参超过专调基线；但结论有边界：Minecraft 的钻石只出现在<b>0.4%</b> 的回合里，未来方向（从互联网视频预训练、跨域单一世界模型）与掉血惩罚的空白都如实交代。",
      "takeaways": [
        {
          "icon": "🏆",
          "title": "八个领域一起交卷",
          "desc": "固定超参下全面超过专调基线（含高质量 PPO）。"
        },
        {
          "icon": "💎",
          "title": "首次从零采到钻石",
          "desc": "100M 步、无人类数据；但 0.4% 的回合成功率说明探索仍是难题。"
        },
        {
          "icon": "📈",
          "title": "可预测地变强",
          "desc": "模型越大/重放比越高，学得越好也越省交互；边界（协议、数据预算）要一起读。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV17e411k7zS",
      "title": "从DreamerV1到DreamerV3｜Model-based RL的学习之路",
      "reason": "85 分钟长视频，把 DreamerV1→V3 的演进讲透，适合先建立全局坐标（总览）。",
      "cover": "https://i2.hdslb.com/bfs/archive/ede70a81ad9840f330cd1364ca9111b60ca959be.jpg",
      "views": "7669播放"
    },
    {
      "bvid": "BV1XeE96WEek",
      "title": "世界模型DreamerV3论文拆解：从原理到模型完整结构分析",
      "reason": "34 分钟逐模块拆解，与世界模型结构章节互补（方法深挖）。",
      "cover": "https://i0.hdslb.com/bfs/archive/b166e8c5ad7c1df5f1a2dce06666369cc9099746.jpg",
      "views": "2954播放"
    },
    {
      "bvid": "BV1MzuU6VEip",
      "title": "【Nature 2025】DreamerV3：通过世界模型掌握多样领域",
      "reason": "组会精读视角，强调 Nature 版结论与实验，适合对照结果章（讲读）。",
      "cover": "https://i2.hdslb.com/bfs/archive/4d5e2b3e7c4678cf0725de9887ae7d8cf0f74774.png",
      "views": "1036播放"
    },
    {
      "bvid": "BV1Lu6BBAEWa",
      "title": "【世界模型】Genie 3, LingBot-World, Hunyuan World, Marble...",
      "reason": "世界模型前沿横评，看完 Dreamer 后看这条线后来走到哪（扩展）。",
      "cover": "https://i2.hdslb.com/bfs/archive/72c934e1c6b51ef01da6a2f33e13e0a95dd2fef8.jpg",
      "views": "9313播放"
    }
  ]
};
