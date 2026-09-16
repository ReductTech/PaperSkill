import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "EMA-Nesterov: Stabilizing Nesterov's Lookahead for Accelerated Deep Learning Optimization",
    "titleZh": "EMA-Nesterov：稳定 Nesterov 前瞻的深度学习加速",
    "venue": "arXiv preprint (arXiv:2605.25395), 2026",
    "authors": "Chung-Yiu Yau, Dawei Li, Athanasios Glentis, Valentyn Boreiko, Hoi-To Wai, Mingyi Hong",
    "affiliation": "University of Minnesota; Amazon AGI; The Chinese University of Hong Kong",
    "domain": "优化 / 深度学习 / 动量与前瞻加速",
    "coreProblem": "标准 Nesterov 前瞻沿一步更新 x_t − x_{t−1} 外推；在随机非凸的深度学习训练里，这个短视信号充满高频振荡，前瞻步长越大，前瞻位置的损失越高。",
    "coreInsight": "把前瞻方向换成一步更新的指数滑动平均（EMA）——一个几何加权的低通滤波器：滤掉高频振荡、跟随轨迹趋势、并对趋势变化保持自适应；单循环、零额外开销，并在凸情形下保留 Nesterov 型加速率。",
    "keywords": [
      "EMA",
      "Nesterov 加速梯度",
      "前瞻",
      "低通滤波",
      "优化器包装器",
      "NanoGPT",
      "Llama"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "标准 Nesterov 前瞻：船头沿「上一步走了多远」前探，逐浪的箭头把前瞻位置探上高损失的高岸（图1 左 / 图2 实线）。",
      "componentId": "hero-old-lookahead"
    },
    "newMethod": {
      "desc": "EMA-Nesterov：前瞻方向取一步更新的 EMA——平滑、跟趋势、自适应，前瞻位置稳在河道内（图1 右 / 图2 虚线）。",
      "componentId": "hero-new-ema"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "追浪的代价",
      "badge": "inf",
      "badgeLabel": "必读",
      "bridge": "深度学习训练想把经典加速方法借过来用，但 Nesterov 的前瞻在随机非凸的河谷里频频失灵。本节先让你亲手把这种经典前瞻推到失效。",
      "analogy": {
        "title": "逐浪的船头",
        "text": "<b>前瞻</b>就是顺着「上一步的方向」往前探。浪是高频噪声，追浪的船头会探向高损失的高岸。",
        "componentId": "ana-ch1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "前瞻步长 β 的代价",
          "desc": "拖动滑杆增大前瞻步长 β：船头前探箭头随之伸长。观察前瞻位置损失如何随 β 上升（对应论文图2 实线）。",
          "componentId": "w1-lookahead-stress"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "换成 EMA 方向试试",
          "desc": "同一个 β、同一片河谷，按「同时出发」对比标准前瞻与 EMA 前瞻的落点（对应论文图2 红实线与绿虚线）。",
          "componentId": "w1-ema-repair"
        }
      ],
      "insight": "有效的加速不该外推「上一朵浪」，而应外推水流的<b>趋势</b>——把短视方向先做低通滤波。",
      "formula": {
        "lead": "论文把两种前瞻方向写在一起：标准 NAG 用一步差，EMA-Nesterov 用平滑后的 m_t。",
        "unicode": "y<sub>t</sub> = x<sub>t</sub> + β(x<sub>t</sub> − x<sub>t−1</sub>)　vs　y<sub>t</sub> = x<sub>t</sub> + β·m<sub>t</sub>",
        "symbols": [
          {
            "sym": "x_t",
            "desc": "当前参数位置（轨迹上的船）"
          },
          {
            "sym": "β",
            "desc": "前瞻步长（桨的前倾角），β_t ≥ 0"
          },
          {
            "sym": "m_t",
            "desc": "一步更新方向的 EMA（平滑后的推力方向）"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "短视前瞻不可靠",
          "desc": "深度学习轨迹充满高频振荡，直接外推 x_t − x_{t−1} 天然不可靠。"
        },
        {
          "icon": "🔧",
          "title": "β 越大失效越重",
          "desc": "前瞻位置损失随 β 急剧上升（论文图2 实线）。"
        },
        {
          "icon": "✨",
          "title": "换方向而非取消前瞻",
          "desc": "修复的关键是用一个平滑、跟趋势的方向。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "读水：轨迹里藏着两种信号",
      "badge": "inf",
      "badgeLabel": "必读",
      "bridge": "既然直接外推上一步不可靠，就要先看清楚上一步里到底装了什么。把参数轨迹当信号读，它会露出两层结构。",
      "analogy": {
        "title": "浪花与主流",
        "text": "<b>一步更新</b>里同时有两种成分：快速回摆的浪花与缓慢推进的主流。",
        "componentId": "ana-ch2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "拖动时间游标，读出两种成分",
          "desc": "沿训练轨迹拖动橙色时间游标，右侧内嵌图实时显示当前一步更新 Δx 在趋势与振荡中的位置。",
          "componentId": "w2-signal-decomp"
        }
      ],
      "formula": {
        "lead": "一步更新记为 Δx：它等于趋势分量加振荡分量，直接外推就是把两者一起外推。",
        "unicode": "Δx<sub>t</sub> = x<sub>t</sub> − x<sub>t−1</sub>（= 趋势 + 振荡）",
        "symbols": [
          {
            "sym": "Δx_t",
            "desc": "一步更新（船这一桨的实际位移）"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "把轨迹当信号读",
          "desc": "一步更新 = 低频趋势 + 高频振荡。"
        },
        {
          "icon": "🔧",
          "title": "振荡不会自己消失",
          "desc": "稳定期的振荡几乎恒定，直接外推 Δx 必然放大噪声。"
        },
        {
          "icon": "✨",
          "title": "先分离再加速",
          "desc": "「读水」是本教程的核心视角：先留下趋势。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "顺流者胜：跟随趋势的前瞻",
      "badge": "inf",
      "badgeLabel": "必读",
      "bridge": "看清楚两种成分之后，答案自然浮现：外推的对象应当是趋势而不是原始更新。这一步一步走完河谷，验证这个直觉。",
      "analogy": {
        "title": "两种划法",
        "text": "逐浪者路线弯曲，顺流者借<b>趋势</b>稳步前进。",
        "componentId": "ana-ch3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "一步一步顺流而下",
          "desc": "点击「下一步」沿六个站位走完河谷：每一站对比逐浪前瞻与趋势前瞻的落点与损失。",
          "componentId": "w3-route-compare"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "加速 = 外推趋势",
          "desc": "有效的外推对象是轨迹的低频趋势，不是噪声。"
        },
        {
          "icon": "🔧",
          "title": "弯道见真章",
          "desc": "轨迹转向处最能区分两种前瞻：逐浪者被甩向高岸。"
        },
        {
          "icon": "✨",
          "title": "下一行写下趋势",
          "desc": "把这个「趋势」写成一行递推，就是下一章的 EMA。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "核心数学框架：EMA 递推",
      "badge": "both",
      "badgeLabel": "必读+进阶",
      "bridge": "趋势怎么写成一行代码？EMA 每步只做一次乘加：旧方向打个折，再叠上最新一步更新。",
      "analogy": {
        "title": "加权的一桨桨",
        "text": "EMA 记住最近的桨更牢、更早的桨更淡——权重按 <b>γ</b> 几何衰减。",
        "componentId": "ana-ch4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "调节 γ，看权重如何分配",
          "desc": "拖动 γ 滑杆：左侧是几何权重条形图，右侧是原始 Δx 信号与 EMA 输出的实时对比。",
          "componentId": "w4-ema-weights"
        }
      ],
      "formula": {
        "lead": "EMA 每一步只做一次乘加：旧方向打个折，加上最新一步更新。",
        "unicode": "m<sub>t+1</sub> = γ·m<sub>t</sub> + (1−γ)·Δx<sub>t+1</sub>　⇔　(1−γ)·Σ γ<sup>i</sup>·Δx",
        "symbols": [
          {
            "sym": "γ",
            "desc": "EMA 速率，几何权重基数（0 = 只看最新一步）"
          },
          {
            "sym": "m_t",
            "desc": "平滑后的前瞻方向（对 Δx 的指数滑动平均）"
          },
          {
            "sym": "Δx_{t+1}",
            "desc": "最新一步更新"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "一乘一加的低通滤波",
          "desc": "EMA = 指数衰减加权平均，成本极低。"
        },
        {
          "icon": "🔧",
          "title": "γ 是「记多久」的旋钮",
          "desc": "γ 大 → 平滑强但滞后；γ 小 → 贴近原始更新。"
        },
        {
          "icon": "✨",
          "title": "平滑与自适应兼得",
          "desc": "几何权重既滤高频又偏重近期——这是长程平均缺的东西。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "长程前瞻的代价：平滑但不自适应",
      "badge": "both",
      "badgeLabel": "必读+进阶",
      "bridge": "更简单的做法存在：直接平均最近 K 步更新。它同样能平滑，但在趋势转弯处会露出致命短板。",
      "analogy": {
        "title": "过弯的旧航向",
        "text": "K 步平均是<b>无加权</b>的记忆——转弯之后，旧航向还在指向河岸。",
        "componentId": "ana-ch5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "K 步平均 vs EMA：转弯测试",
          "desc": "切换方向来源并重放同一次转弯：无加权 K 步平均的滞后角与 EMA 的自适应一目了然。",
          "componentId": "w5-horizon-lag"
        }
      ],
      "formula": {
        "lead": "长程前瞻方向其实就是 K 项无加权平均——一个 order-K 移动平均低通滤波器。",
        "unicode": "b<sub>t</sub> = x<sub>t</sub> − x<sub>t−K</sub> = K·(1/K)·Σ<sub>i=t−K+1</sub><sup>t</sup> Δx<sub>i</sub>",
        "symbols": [
          {
            "sym": "K",
            "desc": "长程前瞻窗口（步数）"
          },
          {
            "sym": "b_t",
            "desc": "K 步前瞻方向（无加权 MA 输出）"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两种平滑",
          "desc": "无加权（不自适应）与几何加权（自适应）。"
        },
        {
          "icon": "🔧",
          "title": "K 越大滞后越久",
          "desc": "趋势转弯时，无加权平均滞后最久（论文图3 左）。"
        },
        {
          "icon": "✨",
          "title": "EMA 的选择",
          "desc": "几何权重让「平滑」与「自适应」同时成立。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "频域视角：一条低通滤波曲线",
      "badge": "inf",
      "badgeLabel": "必读",
      "bridge": "「平滑」在信号语言里就是低通滤波。EMA 有一条解析的传递函数曲线，把这句话变成可测量的衰减值。",
      "analogy": {
        "title": "滤掉的是浪",
        "text": "低通滤波：让<b>趋势</b>（低频）通过，把浪（高频）衰减。",
        "componentId": "ana-ch6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "扫一遍频率，看衰减",
          "desc": "拖动 ω 扫过 0→π，切换 γ：曲线上的标记点给出对应频率成分的增益，下方水面的波纹随之变化。",
          "componentId": "w6-lowpass-freq"
        }
      ],
      "formula": {
        "lead": "EMA 的滤波特性由它的传递函数完全刻画：输出能量随频率单调下降。",
        "unicode": "H(z) = (1−γ) / (1 − γ·z<sup>−1</sup>)",
        "symbols": [
          {
            "sym": "H",
            "desc": "传递函数（复频域增益）"
          },
          {
            "sym": "ω",
            "desc": "信号频率（0 = 趋势，π = 最快振荡）"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "低频全过、高频衰减",
          "desc": "|H| 随频率 ω 从 0 到 π 单调下降。"
        },
        {
          "icon": "🔧",
          "title": "γ 控制截止软硬",
          "desc": "γ 越大，高频抑制越强（记忆越长）。"
        },
        {
          "icon": "✨",
          "title": "两面同一枚硬币",
          "desc": "第 4 章的时间视角与本章的频率视角完全等价。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "理论保证：加速从哪里来",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "平滑不会白做：在强凸且梯度精确的设定下，EMA-Nesterov 保留了 Nesterov 型加速率，而且存在明确的加速门槛。",
      "analogy": {
        "title": "借势加速",
        "text": "凸分析证明：平滑后的前瞻<b>保留了加速率</b>。",
        "componentId": "ana-ch7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "调 γ，看速率门槛",
          "desc": "拖动 γ：对比梯度下降、经典 NAG 与 EMA-Nesterov 的收缩因子（定理1，κ=50 为示例值），注意 γ ≥ 1−1/κ 时蓝线翻红。",
          "componentId": "w7-rate-curve"
        }
      ],
      "formula": {
        "lead": "强凸情形下，算法 1 取 α=1/L 与定理给出的 β 选择即得加速率；加速条件是式(12)。",
        "unicode": "f(x<sub>T</sub>) − f<sup>⋆</sup> = O((1 − √((1−γ)/κ))<sup>T</sup>)，加速条件 γ &lt; 1 − 1/κ",
        "symbols": [
          {
            "sym": "κ",
            "desc": "条件数 L/μ（L 梯度 Lipschitz 常数，μ 强凸参数）"
          },
          {
            "sym": "T",
            "desc": "迭代数"
          },
          {
            "sym": "γ",
            "desc": "EMA 速率（γ=0 时退化为经典 NAG）"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "加速有凸分析背书",
          "desc": "定理1（强凸 O((1−√((1−γ)/κ))^T)）与定理2（一般凸 O(1/T²)）。"
        },
        {
          "icon": "🔧",
          "title": "门槛 γ < 1 − 1/κ",
          "desc": "γ 不是越大越好，越过门槛即失去对 GD 的优势。"
        },
        {
          "icon": "✨",
          "title": "记住边界",
          "desc": "理论假设凸与精确梯度；深度学习非凸，只是洞察与支持。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "关键技术：算法 1 的两行循环",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "去掉所有包装，EMA-Nesterov 只有两行：从前瞻位置走一步，再用新位移更新 EMA。它是一个逐迭代执行的轻量包装器。",
      "analogy": {
        "title": "一推一记",
        "text": "每次迭代只有两个动作：<b>推桨</b>（基础优化器）与<b>记水痕</b>（EMA 更新）。",
        "componentId": "ana-ch8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "步进算法 1",
          "desc": "点击三个节点查看每一行的作用与数据流；按「下一步」在一维示例目标上真实迭代，x、m、y 数值实时重算。",
          "componentId": "w8-algoloop"
        }
      ],
      "formula": {
        "lead": "算法 1 复用第 4 章的 EMA 递推与前瞻位置式；A_t 可以是任意基础优化器，单步几乎零额外开销。",
        "unicode": "x<sub>t+1</sub> = A<sub>t</sub>(x<sub>t</sub> + β<sub>t</sub>·m<sub>t</sub>)；　m<sub>t+1</sub> = γ·m<sub>t</sub> + (1−γ)(x<sub>t+1</sub> − x<sub>t</sub>)",
        "symbols": [
          {
            "sym": "A_t",
            "desc": "基础优化器映射（如 Adam / SOAP / Muon）"
          },
          {
            "sym": "β_t",
            "desc": "前瞻步长（可调度，见第 9 章）"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两行搞定",
          "desc": "前瞻一步 + EMA 记忆，单循环、逐迭代执行。"
        },
        {
          "icon": "🔧",
          "title": "正交可组合",
          "desc": "包装器不改动基础优化器内部，与预条件、动量等技术天然兼容。"
        },
        {
          "icon": "✨",
          "title": "与 Muon 的「Nesterov」无关",
          "desc": "论文辨析：Muon 实现里的 Nesterov 实为随机梯度 EMA（附录 C.5）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "实践技巧：β 的三段调度",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "β 不是常数：训练早期方向不稳、衰减末期极小值陡峭。论文用三段调度回答「何时前瞻、何时歇桨」。",
      "analogy": {
        "title": "到岸就收桨",
        "text": "学习率衰减期要<b>提前关闭前瞻</b>，让船稳稳停进陡峭的泊位。",
        "componentId": "ana-ch9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "拖动 T_w 与 T_r，稳住整程训练",
          "desc": "在时间轴上拖动两个橙色手柄：上方色带是 β 的三段调度，下方曲线显示对训练损失的影响（图8：T_r 太晚末端回升）。",
          "componentId": "w9-beta-schedule"
        }
      ],
      "formula": {
        "lead": "前瞻期的 β_t 相对跟随学习率调度（β_t = β·α_t/max α），预热期与提前休息期直接置零——不引入新公式。",
        "unicode": "β<sub>t</sub> = 0（t ≤ T<sub>w</sub>）→ β·α<sub>t</sub>/max<sub>k</sub>α<sub>k</sub> → 0（t &gt; T<sub>r</sub>）",
        "symbols": [
          {
            "sym": "T_w",
            "desc": "预热结束迭代（NanoGPT 实验取 1800）"
          },
          {
            "sym": "T_r",
            "desc": "提前休息开始迭代（NanoGPT 实验取 5600，共 6200）"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "三段调度",
          "desc": "预热不开、中段随学习率前瞻、衰减前提前休息。"
        },
        {
          "icon": "🔧",
          "title": "提前休息是关键",
          "desc": "EMA 方向适应不了陡峭极小值，不关闭会末端损失骤增（图8）。"
        },
        {
          "icon": "✨",
          "title": "跟随学习率节拍",
          "desc": "T_w、T_r 大致跟随学习率调度：NanoGPT 用 1800/5600。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "汇合口：结果、边界与取舍",
      "badge": "both",
      "badgeLabel": "必读+进阶",
      "bridge": "理论说完了，回到语言模型预训练的主战场：固定迭代数下，这套两行包装器能不能真加速一众精调优化器？",
      "analogy": {
        "title": "冲向汇合口",
        "text": "固定迭代数下，<b>EMA-Nesterov</b> 的验证困惑度更低。",
        "componentId": "ana-ch10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "基础优化器加速竞速",
          "desc": "点击「开始比较」：灰绿双色条按论文报告值竞速；可切换 NanoGPT / Llama 数据集，下方保留精确数值与协议。",
          "componentId": "w10-result-race"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "全面一致的下降",
          "desc": "NanoGPT 124M：Adam 降 1.305、Muon 降 0.208（图4，固定迭代数）。"
        },
        {
          "icon": "🔧",
          "title": "超参随规模可预测移动",
          "desc": "模型越大 γ 越大、β 越小；推荐 β=0.5、γ=0.99（≤350M）/ 0.995（>350M）。"
        },
        {
          "icon": "✨",
          "title": "边界与代价",
          "desc": "理论限于凸+精确梯度；但包装器轻量、单步零额外开销，扫参下优于悲观前瞻/SNOO/GPA。"
        }
      ]
    }
  ]
};
