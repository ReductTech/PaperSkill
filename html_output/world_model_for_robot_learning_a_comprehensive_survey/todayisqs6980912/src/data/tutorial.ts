import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "World Model for Robot Learning: A Comprehensive Survey",
    "titleZh": "面向机器人学习的世界模型：全景综述",
    "venue": "arXiv preprint 2605.00080, 2026",
    "authors": "Bohan Hou, Gen Li, Jindou Jia, Tuo An, Xinying Guo, Sicong Leng, Haoran Geng, Yanjie Ze, Tatsuya Harada, Philip Torr, Oier Mees, Marc Pollefeys, Zhuang Liu, Jiajun Wu, Pieter Abbeel, Jitendra Malik, Yilun Du, Jianfei Yang",
    "affiliation": "NTU · UC Berkeley · Stanford · U. Tokyo · Oxford · Microsoft · ETH Zurich · Princeton · Harvard",
    "domain": "机器人学习 · 具身智能 · 世界模型 · 视频生成 · VLA",
    "coreProblem": "纯反应式 VLA 策略只看当前观测直接出动作，在长时程物理任务上复合误差累积、时间信用分配困难。",
    "coreInsight": "把「想象动作后果」装进机器人：这篇 43 页综述系统梳理了世界模型与机器人策略的五种耦合方式、作为模拟器的想象强化学习与评估，以及机器人视频世界模型的四阶段演进。",
    "keywords": [
      "世界模型",
      "机器人学习",
      "VLA",
      "视频生成",
      "模仿学习",
      "强化学习",
      "规划",
      "具身智能"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "<b>反应式 VLA</b>：只看当前观测直接出动作。长时程任务上复合误差累积、时间信用分配困难——每一步都站在自己上一步的偏差上。",
      "componentId": "hero-reactive"
    },
    "newMethod": {
      "desc": "<b>世界模型</b>：预测环境在动作下如何演化。先在想象中预演动作后果，再支持策略学习、规划、模拟评估与数据放大——预见、想象驱动规划、数据放大三种核心能力。",
      "figure": "/images/figure-1.png",
      "componentId": "hero-predictive"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "盲写的教训：只看眼前，越写越歪",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "封面上那支「盲写」的毛笔到底输在哪里？这一章把问题拆开：误差是怎样一笔一笔传下去的，又怎样才能被拉回来。",
      "analogy": {
        "title": "闭眼写长横",
        "text": "只凭手感出笔，不看字帖——越写越歪。",
        "componentId": "ana-ch1-blind"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "盲写 vs 胸有成竹：双轨对比",
          "desc": "同一支笔、同一条字帖，两条书写轨同步开跑：上轨<b>盲写</b>只凭当前笔感，下轨每段落笔前先<b>预演修正</b>。看看两者的误差如何分道扬镳。",
          "componentId": "m1-1-blind-vs-correct"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "两张循环图：缺了哪一步？",
          "desc": "把「盲写」翻成控制回路：反应式回路<b>感知→出笔→执行</b>，世界模型回路多出<b>想象未来</b>与<b>对照修正</b>两个环节。步进点亮，看缺的到底是哪一步。",
          "componentId": "m1-2-loop-step"
        }
      ],
      "insight": "误差不是某一笔的错，而是没有预演：落笔前先想象整段笔势，闭环就能把误差拉回字帖。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "复合误差",
          "desc": "长笔画上每一步的小偏差会传给下一步，越写越歪。"
        },
        {
          "icon": "🔄",
          "title": "闭环修正",
          "desc": "世界模型在想象中对照字帖，出手之前先纠偏。"
        },
        {
          "icon": "⚠️",
          "title": "适用边界",
          "desc": "反应式并非不能用——短笔画照样写得好，长时程才是它的软肋。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "读帖：把整页字压进心里",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "想在脑中预演，先得把字帖「装进脑子」。整页像素太重，心里装的是间架结构——这一章看状态可以压到多小。",
      "analogy": {
        "title": "悬空读帖",
        "text": "不下笔，先在眼里把间架结构过一遍。",
        "componentId": "ana-ch2-read"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "潜在维度 d：压到多细刚好？",
          "desc": "亲手调<b>潜在维度 d</b>：左边是原字的墨点阵，中间是压到 d 维再重构的字，右侧两根竖条同步显示<b>重构误差</b>与<b>计算成本</b>。太少丢结构，太多费算力。",
          "componentId": "m2-1-latent-dim"
        }
      ],
      "insight": "世界模型不需要记住整张纸——它只需要在心里留住「会随动作演化的那部分结构」。",
      "formula": {
        "lead": "把世界压成一个会随动作演化的状态，这就是世界模型的一般形式：",
        "unicode": "p(x<sub>t+1:t+H</sub> | x<sub>t</sub>, a<sub>t:t+H−1</sub>, l)",
        "symbols": [
          {
            "sym": "x",
            "desc": "状态（可为潜变量，维度即本章的 d）"
          },
          {
            "sym": "a",
            "desc": "低层动作序列"
          },
          {
            "sym": "l",
            "desc": "高层语言指令"
          },
          {
            "sym": "H",
            "desc": "预测时域"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧠",
          "title": "潜表征",
          "desc": "把像素压成结构，想象时又快又省。"
        },
        {
          "icon": "⚖️",
          "title": "维度权衡",
          "desc": "太少丢结构，太多费算力。"
        },
        {
          "icon": "🔀",
          "title": "状态不可知",
          "desc": "综述对状态空间保持开放：观测、潜变量、物理或符号状态皆可。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "描红：预测是位不收学费的老师",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "上一章把字帖装进了心里；这一章发现：光是「预演」这个动作本身，就在不停产生学习信号。",
      "analogy": {
        "title": "描红",
        "text": "每描一段，下一段该怎么走就被纠正一次。",
        "componentId": "ana-ch3-trace"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "稀疏成绩单 vs 稠密对照",
          "desc": "对比「只在最后知道成败」与「每一步都知道偏了多少」两种监督：点击开始，两条学习曲线同步生长——稀疏的成绩单给出<b>台阶式</b>的平台，稠密的对照让它<b>平滑地</b>快速收敛（示意曲线）。",
          "componentId": "m3-1-learning-curves"
        }
      ],
      "insight": "不用等老师批改——预演本身就是批改：每一步的偏差都是可学的信号。",
      "formula": {
        "lead": "策略与世界模型，其实是同一个联合预测分布的两种问法（理想化视角）：",
        "unicode": "p(o<sub>t+1:t+k</sub>, a<sub>t+1:t+k</sub> | o<sub>t</sub>, l)",
        "symbols": [
          {
            "sym": "o",
            "desc": "观测"
          },
          {
            "sym": "a",
            "desc": "动作"
          },
          {
            "sym": "l",
            "desc": "指令"
          },
          {
            "sym": "k",
            "desc": "动作块长度"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🆓",
          "title": "免费监督",
          "desc": "预测每一步的偏差，都是不用人工标注的训练信号。"
        },
        {
          "icon": "🌉",
          "title": "同源分布",
          "desc": "策略、世界模型、逆动力学都是同一联合分布的不同边缘（理想化视角）。"
        },
        {
          "icon": "📉",
          "title": "收敛更快",
          "desc": "同样的练习量，信号越密进步越快（示意）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "连笔：自回归 rollout 的时域误差",
      "badge": "both",
      "badgeLabel": "通用",
      "bridge": "心里有了结构、也有了信号——现在把笔画连起来写，看看预演的误差怎么随步数长大。",
      "analogy": {
        "title": "连笔",
        "text": "一段接一段，起笔全靠上一段的收笔。",
        "componentId": "ana-ch4-cursive"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "六步推演：误差怎么逐段传下去",
          "desc": "亲手推演 <b>H=6 步</b>：上区是真实轨迹（虚线棕）与预测轨迹（实线蓝），下区是每一步的误差条。点「推演一步」，看误差如何<b>逐段累积</b>并原样传给下一段（示意）。",
          "componentId": "m4-1-rollout-steps"
        }
      ],
      "insight": "自回归的每一步都站在自己的预测上——想写得长，就得边写边回头修正。",
      "formula": {
        "lead": "视频世界模型把这份预测画在像素里：",
        "unicode": "p(v<sub>t+1:t+H</sub> | o<sub>t</sub>, a<sub>t:t+H−1</sub>, l)",
        "symbols": [
          {
            "sym": "v",
            "desc": "未来视频帧"
          },
          {
            "sym": "o",
            "desc": "当前观测"
          },
          {
            "sym": "a",
            "desc": "动作序列"
          },
          {
            "sym": "l",
            "desc": "指令"
          },
          {
            "sym": "H",
            "desc": "预测时域"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🔗",
          "title": "自回归",
          "desc": "预测的输出又成为下一步的输入。"
        },
        {
          "icon": "📐",
          "title": "时域 H",
          "desc": "看得越远，误差越容易滚大（示意）。"
        },
        {
          "icon": "🛠️",
          "title": "对策在后",
          "desc": "第 6 章的滚动重规划就是给这条误差链装的刹车。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "提按：动作是画笔的力度",
      "badge": "both",
      "badgeLabel": "基础+进阶",
      "bridge": "想象要「可控」才有用——这一章把动作当成落笔的力度：给多强的条件，生成才既听话又不僵？",
      "analogy": {
        "title": "提按",
        "text": "同一笔走势，力度不同，笔迹两样。",
        "componentId": "ana-ch5-pressure"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "条件强度滑杆",
          "desc": "调节<b>条件强度 w</b>：上轨是固定的指令轨迹（虚线棕），下轨生成轨迹即时重画——生成 = 指令·w + 种子噪声·(1−w)。太弱不听话，太强千字一面，底部两根横条同步显示<b>对齐度</b>与<b>多样性</b>的此消彼长。",
          "componentId": "m5-1-cond-strength"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "条件类型：给模型看什么信号？",
          "desc": "同样生成「永」字，切四种条件：不给信号、只给<b>文本指令</b>、只给<b>动作序列</b>、两者都给。看右侧三个生成样本分别错在哪——指令管内容，动作管轨迹。论文原书 Figure 6 画出同一张谱系：动作、观测、指令之外，还有<b>结构先验</b>这第四种条件（Sec 5.4）。",
          "componentId": "m5-2-cond-type",
          "figure": "/images/figure-6.png"
        }
      ],
      "insight": "想象必须「受力而变」——不对动作敏感的想象，只是装饰画。",
      "formula": {
        "lead": "反过来，策略就是把观测与指令直接翻译成一段动作块：",
        "unicode": "p(a<sub>t+1:t+k</sub> | o<sub>t</sub>, l)",
        "symbols": [
          {
            "sym": "a",
            "desc": "未来动作块"
          },
          {
            "sym": "o",
            "desc": "当前观测"
          },
          {
            "sym": "l",
            "desc": "指令"
          },
          {
            "sym": "k",
            "desc": "动作块长度"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎚️",
          "title": "条件强度",
          "desc": "过弱失控、过强僵化，中间地带才好用。"
        },
        {
          "icon": "🧭",
          "title": "条件类型",
          "desc": "指令管内容，动作管轨迹，双条件最实用。"
        },
        {
          "icon": "🤖",
          "title": "动作敏感",
          "desc": "对动作不敏感的世界模型不配叫世界模型（本文功能性定义）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "悬笔择路：先想象，再落笔",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "第 4 章看到长时域误差滚大——这一章的解法：不必一次想到底，边走边重新想。",
      "analogy": {
        "title": "悬笔择路",
        "text": "不急着落笔：先在空中把路线试出来。",
        "componentId": "ana-ch6-hover"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "滚动重规划：每步重新想象",
          "desc": "步进体验 MPC：每次只预演 <b>H=3 段</b>、走 1 段、再重新预演。点击「走一步」，当前位置长出 3 条虚线候选（其中穿墨渍的被淘汰），最优者高亮执行首段——8 步到达目标。",
          "componentId": "m6-1-mpc-rollout"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "你来定落笔点",
          "desc": "拖动绿环目标（或用方向键移动），幽灵路线即时重排：直连、遇墨渍绕行。试试把落点压在墨渍上，看想象提前给出的警告。",
          "componentId": "m6-2-drop-point"
        }
      ],
      "insight": "意在笔先的完整版：先想象几步、择优走一步、再重新想象——每一笔都站在最新的现实上。",
      "formula": {
        "lead": "把「先试后选」写成一句话（示意化简，MPC 式主动优化）：",
        "unicode": "a*<sub>t:t+H−1</sub> = argmax<sub>a</sub> Σ<sub>i</sub> V(ŝ<sub>t+i</sub>)，ŝ ~ p<sub>φ</sub>(·|o<sub>≤t</sub>, a)",
        "symbols": [
          {
            "sym": "a*",
            "desc": "最优动作段"
          },
          {
            "sym": "H",
            "desc": "预演时域"
          },
          {
            "sym": "ŝ",
            "desc": "想象状态"
          },
          {
            "sym": "V",
            "desc": "价值评估"
          },
          {
            "sym": "p_φ",
            "desc": "世界模型"
          },
          {
            "sym": "o",
            "desc": "观测历史"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧭",
          "title": "想象驱动规划",
          "desc": "用想象 rollout 比较候选行为，再择优执行。"
        },
        {
          "icon": "🔁",
          "title": "滚动重规划",
          "desc": "短时域、多循环：每走一步重新想象一次。"
        },
        {
          "icon": "⚠️",
          "title": "保真度上限",
          "desc": "想象失真时，规划跟着失真（幻觉与长时程误差会污染评估信号）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "空中练字：在想象里练习",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "上一章用想象「挑路」；这一章更进一步——干脆在想象里练字，真纸只用来验收。",
      "analogy": {
        "title": "空中练字",
        "text": "空中练一百遍，下纸才这一遍。",
        "componentId": "ana-ch7-air"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "想象数据占比滑杆",
          "desc": "调节<b>想象练习占比 r</b>：上区空中轨迹数量随 r 增减（一条实纸墨迹固定不变），下区成功率曲线上的橙色标记沿曲线移动——先升后降，<b>非单调</b>。想象太多，模型自己的偏差会被练进策略。",
          "componentId": "m7-1-imagined-ratio",
          "figure": "/images/figure-5.png"
        }
      ],
      "insight": "真机太贵，字帖有限——世界模型把「练」和「验」拆开：练在想象里，验在真纸上。",
      "formula": {
        "lead": "想象练习的每一步，都是从世界模型里采样一条想象转移：",
        "unicode": "(ô<sub>t+1</sub>, r̂<sub>t</sub>, d̂<sub>t</sub>) ~ p<sub>φ</sub>(· | o<sub>≤t</sub>, a<sub>≤t</sub>, l)",
        "symbols": [
          {
            "sym": "ô",
            "desc": "想象下一观测"
          },
          {
            "sym": "r̂",
            "desc": "想象奖励"
          },
          {
            "sym": "d̂",
            "desc": "想象终止信号"
          },
          {
            "sym": "p_φ",
            "desc": "世界模型（参数 φ）"
          },
          {
            "sym": "o≤t",
            "desc": "观测历史"
          },
          {
            "sym": "a≤t",
            "desc": "动作历史"
          },
          {
            "sym": "l",
            "desc": "指令"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "💭",
          "title": "想象 RL",
          "desc": "策略在世界模型的 rollout 里练，真机只验收（UniSim、DiWA 一脉）。"
        },
        {
          "icon": "📈",
          "title": "数据放大",
          "desc": "用合成轨迹扩充演示，便宜且可无限采样。"
        },
        {
          "icon": "⚖️",
          "title": "非单调权衡",
          "desc": "想象占比过高，模型偏差反噬策略（示意曲线）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "理笔蘸墨：策略与世界模型的五种结盟",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "想象与行动要「怎么绑在一起」？这一章是全综述的架构主菜：五种结盟方式各有账本。",
      "analogy": {
        "title": "理笔蘸墨",
        "text": "把散的锋聚起来——结构与分工，就在这一蘸。",
        "componentId": "ana-ch8-dip"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "五种耦合：点击范式节点",
          "desc": "点击顶部五个范式节点：<b>IDM 解耦</b>、<b>单骨干</b>、<b>专家 MoE</b>、<b>VLA 内化</b>、<b>潜空间</b>——中央架构图随之重排（谁预测、谁行动、怎么连），数据流高亮切换，底部三根权衡条与代表工作同步变化。",
          "componentId": "m8-1-paradigm-map",
          "figure": "/images/figure-3.png"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "耦合深浅：一条光谱",
          "desc": "把五种范式压进「解耦—统一」一条轴：完全解耦、专家耦合、完全统一三个位置，看<b>模块化</b>、<b>联合一致性</b>、<b>误差累积风险</b>三笔账怎么此消彼长。",
          "componentId": "m8-2-coupling-spectrum"
        }
      ],
      "insight": "预测与行动，可以分居两室、可以同住一层、也可以只留一套「心里的字帖」——综述把它们摆成一条光谱。",
      "formula": {
        "lead": "单骨干把想象和行动拼进同一个输入、同一个损失（联合建模未来观测与动作）：",
        "unicode": "x = [z<sub>v</sub>; z<sub>a</sub>]，L = E[ℓ(ŷ, y)]",
        "symbols": [
          {
            "sym": "x",
            "desc": "拼接表征"
          },
          {
            "sym": "z_v",
            "desc": "视觉未来表征"
          },
          {
            "sym": "z_a",
            "desc": "动作表征"
          },
          {
            "sym": "L",
            "desc": "训练目标"
          },
          {
            "sym": "ℓ",
            "desc": "损失"
          },
          {
            "sym": "ŷ",
            "desc": "联合预测"
          },
          {
            "sym": "y",
            "desc": "目标"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🏗️",
          "title": "五种范式",
          "desc": "解耦、单骨干、专家、VLA 内化、潜空间——谁预测、谁行动各不相同。"
        },
        {
          "icon": "🧩",
          "title": "光谱思维",
          "desc": "模块化与一致性此消彼长，没有免费午餐。"
        },
        {
          "icon": "🔭",
          "title": "开放问题",
          "desc": "视频骨干是否一致优于同规模 VLM 骨干，实证上仍未定论。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "集字：像不像，和能不能用，是两回事",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "架构看完了，作品也生成了——但「集字」出的新作品该怎么打分？一把尺子不够用。",
      "analogy": {
        "title": "集字",
        "text": "用学过的结构，写没练过的字。",
        "componentId": "ana-ch9-compose"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "三把尺子：量同一个 rollout",
          "desc": "中央固定一条生成笔迹（其中一段擦过墨渍边缘）。切换三种评估视角：<b>开环预测质量</b>（像不像）、<b>闭环任务效用</b>（能不能用）、<b>物理一致性</b>（走不走得通）——同一个东西，三把尺子量出三个答案。",
          "componentId": "m9-1-three-lenses"
        }
      ],
      "insight": "视觉逼真度既不必要也不充分——像、能用、走得通，是三个问题。",
      "takeaways": [
        {
          "icon": "🔍",
          "title": "三把尺子",
          "desc": "开环预测质量、闭环任务效用、物理一致性，各量各的。"
        },
        {
          "icon": "🧪",
          "title": "逼真陷阱",
          "desc": "看起来可信的 rollout 可能违反动力学。"
        },
        {
          "icon": "📚",
          "title": "基准分层",
          "desc": "论文把基准分三类正因如此（Sec 7.1）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "钤印：收官、边界与六大挑战",
      "badge": "both",
      "badgeLabel": "基础+进阶",
      "bridge": "最后一章给作品钤印验收：数字说话——然后诚实地列出还没解决的事。",
      "analogy": {
        "title": "钤印",
        "text": "写得好不好，盖了章才算数。",
        "componentId": "ana-ch10-seal"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "LIBERO 成功率竞速",
          "desc": "同一张考卷，六位考生：点击「开始竞速」，六条进度条以不同速率推进定格。平均分咬得很紧——真正的分水岭在长时程 <b>Long</b>：看下方放大镜里 TriVLA 平均 87.0 → Long 只剩 73.2。",
          "componentId": "m10-1-libero-race"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "六大开放挑战：签名场景",
          "desc": "逐条点开六大挑战，每个挑战一个书法桌上的签名小景：因果鸿沟、效率瓶颈、多模态感知、经典控制、符号结构、评估缺失。",
          "componentId": "m10-2-challenges"
        }
      ],
      "insight": "盖章之前先想清楚：这个章，量的是平均分还是长时程？是像，还是能用？",
      "takeaways": [
        {
          "icon": "🏁",
          "title": "无唯一最优",
          "desc": "解耦、统一、专家、潜空间设计都有竞争力（跨范式观察）。"
        },
        {
          "icon": "📏",
          "title": "协议先行",
          "desc": "引用数字必须核对协议与方向，不作跨协议比较。"
        },
        {
          "icon": "🗺️",
          "title": "六大挑战",
          "desc": "因果、效率、多模态、控制、符号、评估——每一项都是选题方向。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1EPL16wELr",
      "title": "具身世界模型演化路径大盘点：让机器人用更少的训练数据实现更精准的下一步",
      "reason": "Broad overview：从演化路径纵览具身世界模型，适合入门全景。",
      "cover": "https://i1.hdslb.com/bfs/archive/2770d47b679aac8d2655c81c1b961e8e9a22df5e.jpg",
      "views": "1226播放"
    },
    {
      "bvid": "BV1HBMF6dE7W",
      "title": "【arXiv 2026】World Model for Robot Learning (5/7)：机器人视频世界模型",
      "reason": "Method deep dive：论文官方系列第 5 集，逐节讲解 Sec 5 视频世界模型。低于 1 万播放的例外理由：论文作者团队的官方中文讲解系列，唯一一手深度材料，无可替代。",
      "cover": "https://i1.hdslb.com/bfs/archive/aacd725e24a10367c881f8ed92aabaf624540018.png",
      "views": "308播放"
    },
    {
      "bvid": "BV1A5bK6FEwb",
      "title": "宇树突破：全球首次世界模型实时驱动全自主人形机器人格斗",
      "reason": "Implementation / application：世界模型实时驱动机器人的高热度实机演示，直观呈现落地形态。",
      "cover": "https://i0.hdslb.com/bfs/archive/62dfe6ff03941ba875968f74b8f0a4404186628c.jpg",
      "views": "43.5万播放"
    },
    {
      "bvid": "BV1QYEQ6jE1d",
      "title": "【Yann LeCun】世界模型：下一轮 AI 革命的关键使能 [中英字幕]",
      "reason": "Related extension：LeCun 论世界模型的经典报告（中英字幕），补足领域思想源流。",
      "cover": "https://i1.hdslb.com/bfs/archive/1e0136b26cbc46fa528d3adb6cc7ca31721023f9.jpg",
      "views": "3591播放"
    }
  ]
};
