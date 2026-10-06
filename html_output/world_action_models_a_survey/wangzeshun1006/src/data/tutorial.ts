import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "World Action Models: A Survey",
    "titleZh": "世界动作模型：综述",
    "venue": "arXiv:2606.20781 · 2026-06-18",
    "authors": "Qiuhong Shen, Shihua Zhang, Yue Liao, Qi Li, Zhenxiong Tan, Shizun Wang, Shuicheng Yan, Xinchao Wang",
    "affiliation": "National University of Singapore",
    "domain": "具身智能 · 世界模型 · 世界动作模型综述",
    "coreProblem": "「World Action Model」这个名字传播得比理解快：VLA、世界模型、视频生成、视频世界模型与 WAM 的边界模糊，不同社区用同一个名字指几乎不同的东西。",
    "coreInsight": "先澄清边界：<b>预测的未来必须留在行动路径里</b>（产生、评分、验证或训练动作）；再用两个互补视角组织领域——<b>三种设计哲学</b>（必须生成什么）与<b>四坐标解剖</b>（基座/耦合/骨架/部署）。",
    "keywords": [
      "世界动作模型",
      "设计哲学",
      "四坐标解剖",
      "评测协议",
      "具身智能"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "只画「像」的风景画：纸面越华丽，旅人越容易在岔路口走错——旧的视频生成思维。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "先测距、再简化、标上路标：图上只留能带路的东西，旅人照着走通。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "一个名字，五种模型：先立好边界桩",
      "badge": "inf",
      "badgeLabel": "入门",
      "bridge": "强化学习的前沿正在从「只看当下」转向「先看未来」。本节先把五个近邻概念摆在一起，立好 WAM 的边界桩。",
      "analogy": {
        "title": "先立基准桩",
        "text": "在一片没测过的地方，测绘员不会直接开始描画：先立一根基准桩，之后所有读数都以它为参照。理解 WAM 也一样——先确定\"什么才算\"，后面所有方法才有共同坐标。",
        "componentId": "ana1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "五种模型，一次看清边界",
          "desc": "点击五个 chip，看五种模型的\"箭头\"分别从哪里指向哪里，以及哪一张才满足 WAM 的判定标准。",
          "componentId": "m11"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "未来进入行动路径的三种形式",
          "desc": "用「下一步 / 上一步」走一遍三种形式：先预测再行动、先提动作再评分、联合预测。",
          "componentId": "m12"
        }
      ],
      "insight": "一个模型是不是 WAM，不取决于它用了什么骨干、叫什么名字，而取决于<b>预测的未来有没有留在行动路径里</b>。",
      "formula": {
        "lead": "三种形式的区别，可以压缩成三个因子分解：未来先出、动作先出，或两者同出。",
        "unicode": "先预测再行动： p(o′, a | o, l) = p(o′ | o, l) · q(a | o, o′, l)\n先提动作再评分： p(o′, a | o, l) = q(a | o, l) · p(o′ | o, a, l)\n联合预测：     p(o′, a | o, l) 由同一骨干联合建模",
        "symbols": [
          {
            "sym": "o",
            "desc": "当前观测；l — 指令或目标；a — 动作；o′ — 预测的未来观测"
          },
          {
            "sym": "p(·)",
            "desc": "预测/生成分布；q(·) — 动作模块（逆动力学、跟踪器、优化器或单独训练的策略）"
          },
          {
            "sym": "三种分解",
            "desc": "未来在动作之前、之后或与之同时进入系统"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📌",
          "title": "判定标准只有一条",
          "desc": "预测的未来必须留在行动路径里。"
        },
        {
          "icon": "🧭",
          "title": "五个邻居要分清",
          "desc": "VLA、世界模型、视频生成、视频世界模型与 WAM 各自箭头不同。"
        },
        {
          "icon": "🔀",
          "title": "三种进入方式",
          "desc": "先预测再行动、先提动作再评分、联合预测，都算 WAM。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "收笔在哪里：三条设计哲学",
      "badge": "inf",
      "badgeLabel": "入门",
      "bridge": "边界立好后，第一层分类问题来了：一个 WAM 被要求「必须生成到什么程度」？本节给出三条设计哲学。",
      "analogy": {
        "title": "画到哪一步收笔",
        "text": "同一座山，画到\"像照片\"、画到\"等高线就停\"、还是只盖\"符号章\"，取决于旅人需不需要每一片叶子。三种设计哲学问的就是这件事——<b>模型必须生成到哪一步</b>。",
        "componentId": "ana2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "三条路：动作在哪里被解出",
          "desc": "点击推理路径上的三个位置之一，看动作分别在哪里被解出，以及它们各自付出了什么。",
          "componentId": "m21"
        }
      ],
      "takeaways": [
        {
          "icon": "🎬",
          "title": "渲染到底",
          "desc": "像素未来最可检查，也把渲染算进控制延迟。"
        },
        {
          "icon": "🧊",
          "title": "停在隐空间",
          "desc": "保留视频先验、绕开像素解码，牺牲直观可检查性。"
        },
        {
          "icon": "🪶",
          "title": "免视频生成",
          "desc": "用 token、特征、几何或可供性替代视频，成本最低、要求最高。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "四坐标：给任何一个 WAM 定位",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "三条哲学回答了「必须生成什么」，还没回答「怎么搭」。本节给出四坐标解剖：基座、耦合、骨架、部署。",
      "analogy": {
        "title": "四件仪器定一个点",
        "text": "一个位置需要四个读数才能定住。给一个 WAM 定位也一样：<b>未来是什么、动作怎么进出、谁产生预测、什么时候被调用</b>——四个坐标缺一不可。",
        "componentId": "ana3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "四坐标定位卡",
          "desc": "点击四个坐标之一，看它的全部选项、示例方法 F1 在这一轴上的取值，以及这个轴是训练时固定还是推理时可调。",
          "componentId": "m31"
        }
      ],
      "formula": {
        "lead": "统一记号把所有 WAM 写成一个条件联合分布；四坐标就是它的四个实现选择。",
        "unicode": "p_Θ(s_{t+1:t+H}, a_{t:t+H−1} | o_≤t, a_<t, l)          （统一记号）\nWAM ≅ (Φ, F, B, D)                                      （四坐标）",
        "symbols": [
          {
            "sym": "s_{t+1:t+H}",
            "desc": "未来基座轨迹（长度 H）"
          },
          {
            "sym": "a_{t:t+H−1}",
            "desc": "未来动作块（同长度）"
          },
          {
            "sym": "o_≤t / a_<t / l",
            "desc": "观测历史 / 动作历史 / 指令或目标"
          },
          {
            "sym": "Θ",
            "desc": "参数集合：可以是一个共享骨干，也可以是保留的世界模型加动作模块"
          },
          {
            "sym": "Φ, F, B, D",
            "desc": "基座、耦合、骨架、部署四个坐标"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧭",
          "title": "先定位再比较",
          "desc": "四坐标把模糊的“像不像”变成具体的“哪一轴不同”。"
        },
        {
          "icon": "🧱",
          "title": "两轴训练时固定",
          "desc": "基座与骨架通常决定于训练阶段。"
        },
        {
          "icon": "🎛️",
          "title": "两轴推理侧可调",
          "desc": "耦合与部署仍有调整空间（例如动作头、分块长度）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "在哪里做梦：预测基座",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "四坐标的第一轴：模型把「未来」记在哪张纸上。本节比较像素、特征、几何、可供性四种基座。",
      "analogy": {
        "title": "落下第一笔：画哪一层",
        "text": "同一片山地，先画哪一层决定了这张图后面怎么用。预测基座就是这一笔——它决定模型把“未来”记在哪张纸上：像不像、还是能不能走。",
        "componentId": "ana4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "四种基座：未来住在哪张纸上",
          "desc": "切换四个 chip，看同一片地形被记成像素、特征、几何、可供性四种样子，以及每种样子有没有固定解码器。",
          "componentId": "m41"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "抽象阶梯：从写真到骨架",
          "desc": "拖动滑块沿阶梯下行：RGB → RGB-D/法线/4D → 光流/3D 光流 → 语义掩码 → 特征/隐变量，看三件事同时变化。",
          "componentId": "m42"
        }
      ],
      "insight": "基座不是“最后吃到的张量”，而是<b>未来在哪形成</b>；同一个骨干停在不同的基座上，行为完全不同。",
      "formula": {
        "lead": "四类基座可以只用形状来区分：同一条未来轨迹，落在完全不同的张量空间里。",
        "unicode": "像素：   s_{t+1:t+H} ∈ R^{H×C_o×H_px×W_px}\n特征：   s_{t+1:t+H} ∈ R^{H×N_tok×d_emb}\n几何：   s_{t+1:t+H} ∈ R^{H×2×H_px×W_px}（光流双通道；可换点轨迹/深度/位姿）\n可供性： s_{t+1:t+H} ∈ R^{H×C×H_px×W_px}（价值/掩码/接触通道）",
        "symbols": [
          {
            "sym": "H",
            "desc": "预测视野（未来步数）"
          },
          {
            "sym": "C_o / C",
            "desc": "观测通道数 / 任务图谱通道数"
          },
          {
            "sym": "H_px, W_px",
            "desc": "空间分辨率"
          },
          {
            "sym": "N_tok, d_emb",
            "desc": "特征 token 数与嵌入维度"
          },
          {
            "sym": "固定解码器",
            "desc": "像素基座有、特征基座没有，这是两类最关键的界线"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🗂️",
          "title": "四类基座",
          "desc": "像素、特征、几何、可供性，先定“未来记在哪张纸上”。"
        },
        {
          "icon": "🔻",
          "title": "抽象阶梯下行",
          "desc": "去掉外观、换来贴近控制的几何与任务信息。"
        },
        {
          "icon": "👁️",
          "title": "检查性有代价",
          "desc": "越抽象越省，越难直接用视觉指标验证。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "动作怎么进出：三种耦合",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "基座定下了「未来是什么」；接下来是这个领域最关键的一步——未来怎么与动作绑定。",
      "analogy": {
        "title": "把路线和地形绑起来",
        "text": "路线画在地形旁边不等于能走——测绘员要把两者<b>绑在一起</b>。动作耦合问的就是这件事：动作在哪个位置、以什么方式与预测的未来系上。",
        "componentId": "ana5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "顺序式 vs 联合式：两种绑法同时开跑",
          "desc": "按「开始对比」，左右两个面板同时开跑：左边动作与未来按顺序出场，右边两条轨迹同时生成、互相约束。",
          "componentId": "m51"
        }
      ],
      "formula": {
        "lead": "三种耦合都是一条联合分布的不同因子分解。",
        "unicode": "动作条件推演： p(s, a | c) = q_ψ(a | c) · p_θ(s | c, a)\n联合生成：     p(s, a | c) = p_θ(s, a | c)     （同一生成过程）\n预测后动作头： p(s, a | c) = p_θ(s | c) · q_ψ(a | s, c)",
        "symbols": [
          {
            "sym": "s",
            "desc": "未来基座轨迹；a — 动作块；c — 上下文（观测历史、动作历史、指令）"
          },
          {
            "sym": "q_ψ",
            "desc": "动作源或动作头：规划器、候选采样器、逆动力学、跟踪器或策略"
          },
          {
            "sym": "p_θ",
            "desc": "基座预测器；θ 与 ψ 可以共享骨干，也可以各自独立"
          },
          {
            "sym": "联合损失",
            "desc": "训练时常用 L_gen(s) + λ·L_act(a) 的加权和"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🪢",
          "title": "耦合是 WAM 的那一步",
          "desc": "世界模型把未来交给动作，就从 WM 变成 WAM。"
        },
        {
          "icon": "🔁",
          "title": "顺序可并行",
          "desc": "动作条件推演与预测后头都能先并行评分，再执行。"
        },
        {
          "icon": "♾️",
          "title": "联合更强也更难练",
          "desc": "一致性好，代价是两支损失在同一表示上拔河。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "谁来画、什么时候交：五族骨架与四种部署",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "前三轴讲完，还剩「谁产生预测」与「什么时候调用」：五族骨架与四种部署，一起决定延迟与成本。",
      "analogy": {
        "title": "图纸怎么交出去",
        "text": "地图画得好不好是一回事，<b>什么时候交到旅人手里</b>是另一回事。交付太晚会误路，交得太频会烧算力——部署方式就是这笔账。",
        "componentId": "ana6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "五族骨架：五套画具",
          "desc": "切换五个 chip，看五族骨架各自的\"画具\"、代表写法与代表方法；它们不互斥，边界每隔几个月就移动。",
          "componentId": "m61"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "交付节奏：四种部署",
          "desc": "用「下一步 / 上一步」走一遍四种部署方式，看调用节奏、延迟与成本如何变化。",
          "componentId": "m62"
        }
      ],
      "insight": "五族骨架没有\"最新即最好\"：每一族都把成本花在不同的地方，选择取决于基座与部署要什么。",
      "formula": {
        "lead": "两个式子抓住本章两端：训练时的联合目标，与部署时的分块账单。",
        "unicode": "联合训练目标： L_joint(θ) = L_gen(s) + λ · L_act(a)\n分块部署成本： C_chunk(T, K) = ⌈T/K⌉ · N_fwd(K)",
        "symbols": [
          {
            "sym": "L_gen / L_act",
            "desc": "基座侧生成损失 / 动作侧回归或分类损失"
          },
          {
            "sym": "λ",
            "desc": "动作损失的权重（常配合分阶段训练）"
          },
          {
            "sym": "T",
            "desc": "任务长度（控制步数）；K — 重规划周期"
          },
          {
            "sym": "N_fwd(K)",
            "desc": "产生长度 K 的基座轨迹的单次前向成本"
          },
          {
            "sym": "可行性",
            "desc": "分块部署要求 N_fwd(K)/K 小于控制周期"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🖌️",
          "title": "五族画具",
          "desc": "扩散、自回归、JEPA、混合、LLM-VLM，各有各的成本去向。"
        },
        {
          "icon": "🚚",
          "title": "四种交付",
          "desc": "开环、分块、单步、交互，延迟与反应性此消彼长。"
        },
        {
          "icon": "🧾",
          "title": "部署先算账",
          "desc": "分块可行性与单步约束，都是设计期的硬门槛。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "三条硬约束：交互、因果、持久",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "搭好之后，部署现场还有三条硬约束：可交互、因果、持久。本节逐条过一遍。",
      "analogy": {
        "title": "边走边改地图",
        "text": "图不是画完就定稿的：旅人走到哪里，图就该改到哪里。可交互性问的是——<b>控制信号能不能在生成过程中起作用</b>，而不是只能等图draw完。",
        "componentId": "ana7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "绑定时机刻度：动作什么时候进来",
          "desc": "拖动刻度，从\"预测完再解码动作\"滑到\"每一步去噪都被动作塑造\"，看控制权与成本如何互换。",
          "componentId": "m71"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "防泄漏：双向去噪 vs 因果路径",
          "desc": "按「开始对比」，左右两个面板同时跑：左边容忍未来信息回流，右边只允许用已经发生的部分。",
          "componentId": "m72"
        }
      ],
      "insight": "因果性管两件事：<b>正确性</b>（未来不能泄进当前动作，否则 rollout 里神准、真机上抓空）与<b>延迟</b>（计算该花在还能改变下一步决策的那部分轨迹上）。",
      "takeaways": [
        {
          "icon": "🎛️",
          "title": "交互是刻度",
          "desc": "动作绑得越早，未来越受行动塑造，成本也越高。"
        },
        {
          "icon": "🚫",
          "title": "因果要防泄密",
          "desc": "双向去噪的通关成绩不算数，掩码或因果流才作准。"
        },
        {
          "icon": "🧠",
          "title": "持久对付三件事",
          "desc": "漂移、成本、遗忘；观测替换是最便宜的一招（DreamZero 用它做到 7 Hz 闭环、14B 模型；DexWM 用有界记忆撑起 900 小时人机交互）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "拿图试走：物理合理性与泛化",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "最后两条属性：物理合理性问「本体执行得了吗」，泛化问「换一片山地还算不算数」。",
      "analogy": {
        "title": "拿图去试走",
        "text": "地图的最终考场不在桌上，在山里：一条画得很漂亮却走不通的路，就是错的。<b>可执行性</b>永远优先于好看——这是 WAM 对“未来”的同一条要求。",
        "componentId": "ana8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "换一种变化，押注哪条轴",
          "desc": "选择要跨的位移类型（新任务 / 新物体 / 新外观 / 新本体 / 新动作空间），看三条迁移策略里哪条最有戏、还需要什么适配器。",
          "componentId": "m81"
        }
      ],
      "takeaways": [
        {
          "icon": "🥾",
          "title": "可执行优先",
          "desc": "未来是给本体用的，不是给观众看的。"
        },
        {
          "icon": "🧭",
          "title": "泛化先声明",
          "desc": "跨任务、物体、外观、本体……目标不同，押注的轴不同。"
        },
        {
          "icon": "🔌",
          "title": "适配器不消失",
          "desc": "动作解码器常要留在本机，泛化声明里必须交代它。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "素材与验收：数据、评测与开放问题",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "收尾：素材从哪来、验收怎么做、七个问题还开着——以及全篇一句话：少做梦，多行动。",
      "analogy": {
        "title": "把空白图幅补上",
        "text": "一张地图的价值取决于<b>素材从哪来、验收怎么做</b>：不同的测量方式给出不同的可信度。数据和评测，就是 WAM 领域的“测量方式”。",
        "componentId": "ana9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "五类数据源：素材账本",
          "desc": "点击五类数据源，看每一类在标签质量、规模、物理接地与获取难度上的取舍，并给出代表资源。",
          "componentId": "m91"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "两段式验收与七个开放问题",
          "desc": "用「下一步」走一遍评测协议：便宜的视觉/表征筛查、选择性闭环实测、按预算报告；最后看七个仍未解的问题。",
          "componentId": "m92"
        }
      ],
      "takeaways": [
        {
          "icon": "🧰",
          "title": "五类素材混合",
          "desc": "遥操作给标签、人体演示给规模、视频给先验、仿真给覆盖、合成轨迹填空。"
        },
        {
          "icon": "🧪",
          "title": "两段式验收",
          "desc": "便宜筛查过滤，选择性闭环定胜负，全部按预算报告。"
        },
        {
          "icon": "🧷",
          "title": "七个问题还开着",
          "desc": "从“算多少未来”到“评测报告什么”，都还没有标准答案。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1R9G46PERj",
      "title": "一个视频讲透！WAM到底是什么？",
      "reason": "深蓝学院的 WAM 概念总览，最短时间讲清「WAM 到底是什么」（入门总览）。",
      "cover": "https://i1.hdslb.com/bfs/archive/1f523bf47f8dcae548905f9bc784948132fd30f7.jpg",
      "views": "5803播放"
    },
    {
      "bvid": "BV1Kitt68EyE",
      "title": "具身智能入门科普3: 世界模型与世界动作模型；世界模型如何驱动机器人？UniPi、V-JEPA 2 与 DreamZero",
      "reason": "90 分钟系统课：世界模型与 WAM，逐讲 UniPi、V-JEPA 2、DreamZero（系统深挖）。",
      "cover": "https://i0.hdslb.com/bfs/archive/16890e48eb5f6d28806b29b98f23e91e312e42c6.jpg",
      "views": "4093播放"
    },
    {
      "bvid": "BV1ELeG6nEuL",
      "title": "OpenWAM: 面向世界–动作模型的开源研究全栈与基座模型",
      "reason": "OpenWAM 开源全栈与基座模型解读，适合看实现落地（实现/应用）。",
      "cover": "https://i0.hdslb.com/bfs/archive/d3f1005512a69a95900d624744a71c77433670e8.jpg",
      "views": "1461播放"
    },
    {
      "bvid": "BV1BWLy6bEVL",
      "title": "DreamZero：世界动作模型是零样本策略",
      "reason": "DreamZero 单点深挖：14B 视频扩散骨干进入闭环的代表案例（代表方法）。",
      "cover": "https://i1.hdslb.com/bfs/archive/fa4309222ca086a9c41683c5948ce7223d33811c.jpg",
      "views": "1133播放"
    }
  ]
};
