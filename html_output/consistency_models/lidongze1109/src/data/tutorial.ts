import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Consistency Models",
    "titleZh": "一致性模型",
    "venue": "ICML 2023 · PMLR 202",
    "authors": "Yang Song · Prafulla Dhariwal · Mark Chen · Ilya Sutskever",
    "affiliation": "OpenAI",
    "domain": "生成模型 · 扩散模型 · 一致性学习",
    "coreProblem": "扩散模型反复预测局部去噪方向，采样计算成本高。",
    "coreInsight": "让同一条概率流轨迹上的不同状态，共同指向同一个数据端点。",
    "keywords": [
      "一步生成",
      "一致性蒸馏 CD",
      "独立训练 CT",
      "零样本编辑"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "逐步预测局部方向，再沿轨迹反复积分。<br/>多次网络评估带来计算成本。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "直接学习从带噪状态到数据端点的映射。<br/>支持一步生成，也可多步采样。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "为什么生成一张图，要走那么多步？",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "先体验逐步返回营地的成本，再看一步定位终点意味着什么。本教程中的路径都是机制示意，不运行真实图像模型。 <a href=\"https://arxiv.org/abs/2303.01469v2\" target=\"_blank\" rel=\"noreferrer\">原论文：arXiv v2（2023-05-31）</a>。",
      "analogy": {
        "title": "返程不必每次都重走全路",
        "text": "逐步返程要沿山路不断确认方向。若能直接判断这条路通向哪个营地，就可以省下很多次判断；这只是对计算次数的比喻。",
        "componentId": "analogy-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "逐步返程：计算预算怎样消耗？",
          "desc": "调整示意路径的步数，观察登山者位置和累计网络调用数。路径长度不代表真实推理秒数。 <b>原文定位：</b>§2—3，第2—3页。",
          "componentId": "budget"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "同一起点，两种返回方式",
          "desc": "用一个开始按钮同步比较逐步积分与直接终点预测。动画时长仅服务教学，不表示实测加速倍数。 <b>原文定位：</b>§2—3，第2—3页。",
          "componentId": "shortcut"
        }
      ],
      "insight": "一致性模型学习的是终点映射，而不是把原来的积分循环藏进一次调用。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "计算瓶颈",
          "desc": "扩散采样通常需要反复调用网络。"
        },
        {
          "icon": "🔧",
          "title": "改变任务",
          "desc": "一致性模型直接估计轨迹起点。"
        },
        {
          "icon": "✨",
          "title": "保留取舍",
          "desc": "支持一步生成，也能增加采样次数。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "噪声时间：你在山路的哪个位置？",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "要预测返程终点，模型既要看到当前位置，也要知道当前噪声水平。这里先把输入 x 和时间 t 分清。",
      "analogy": {
        "title": "位置与海拔是两条不同的信息",
        "text": "地图上的点告诉你身在何处，海拔刻度告诉你所在层级。噪声图像与时间标签也分别提供内容和噪声尺度。",
        "componentId": "analogy-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "拖动噪声刻度，观察输入变化",
          "desc": "沿横轴拖动橙色标记，或使用键盘方向键改变 t。右侧是固定噪声方向下的二维投影示意，不是实际样本或严格 PF ODE 轨迹。 <b>原文定位：</b>§2，式(3)，第2页。",
          "componentId": "noise"
        }
      ],
      "insight": "x_t 和 t 是共同输入；同一个 t 可以对应无数不同的图像。",
      "formula": {
        "lead": "本文采用的噪声边缘分布可以写成“数据加高斯扰动”。",
        "unicode": "x_t = x + t z，z ∼ N(0,I)；p_t = p_data ∗ N(0,t²I)",
        "symbols": [
          {
            "sym": "x_t",
            "desc": "d维带噪数据；与干净数据x维度相同。"
          },
          {
            "sym": "t",
            "desc": "高斯噪声标准差，本文 t∈[ε,T]，ε=0.002，T=80。"
          },
          {
            "sym": "z",
            "desc": "d维标准高斯随机向量；方差I，乘t后方差为t²I。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "输入成对",
          "desc": "模型同时接收带噪状态和时间。"
        },
        {
          "icon": "🔧",
          "title": "分布不是轨迹",
          "desc": "加噪能采样边缘分布，不自动给出同一ODE轨迹。"
        },
        {
          "icon": "✨",
          "title": "区分量纲",
          "desc": "噪声时间与网络调用次数是不同概念。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "一致性：同一条路，认准同一个营地",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "知道噪声水平还不够。关键约束是：同一条概率流轨迹上的不同位置，应该返回同一个数据端点。",
      "analogy": {
        "title": "同路认同营，异路不强求",
        "text": "同一条山路上，无论从哪里问路，都应指向同一个营地。换了一条路，目的地可以不同。",
        "componentId": "analogy-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "选择轨迹和观察位置",
          "desc": "切换两条轨迹上的三个位置，比较局部预测与共同终点。曲线是二维教学示意，不是原论文轨迹数值。 <b>原文定位：</b>§3，图2，第3页。",
          "componentId": "consistency"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "概率流：用可解的高斯例子检验一致性",
          "desc": "真实概率流满足 dx_t/dt=−t∇log p_t(x_t)；score 是噪声分布对数密度关于 x 的梯度。实际模型用 s_φ 近似 score，得到 dx_t/dt=−t s_φ(x_t,t)，从 T 向 ε 积分。该 ODE 与加噪 SDE 具有相同的时间边缘分布，但路径不同。下面自推导的一维教学例子设数据方差为0.25、x_t=±√(0.25+t²)，使用真实 score；演示上限3不代表论文的T=80。调节时间，检查同一分支的端点始终不变。<b>原文定位：</b>§2—3，式(2)—(3)，第2—3页。",
          "componentId": "probability-flow"
        }
      ],
      "insight": "一致性是沿同一轨迹保持输出不变，不是让所有图像塌缩成同一张图。",
      "formula": {
        "lead": "对同一条 PF ODE 轨迹而言，不同噪声时间共享同一个数据端点。",
        "unicode": "f(x_t,t) = f(x_t′,t′) = x_ε",
        "symbols": [
          {
            "sym": "f",
            "desc": "理想一致性函数，输出d维数据端点；模型f_θ对它作近似。"
          },
          {
            "sym": "x_t",
            "desc": "同一条PF ODE轨迹在时间t的状态。"
          },
          {
            "sym": "x_t′",
            "desc": "该轨迹在另一个时间t′的状态；不能任意取自另一条轨迹。"
          },
          {
            "sym": "x_ε",
            "desc": "该轨迹在很小正时间ε处的端点。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "限定同轨迹",
          "desc": "一致性约束有明确的轨迹前提。"
        },
        {
          "icon": "🔧",
          "title": "输出不塌缩",
          "desc": "不同轨迹可以生成不同样本。"
        },
        {
          "icon": "✨",
          "title": "无需可逆",
          "desc": "本文不要求一致性网络是可逆函数。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "边界条件：到了营地，就别再移动",
      "badge": "both",
      "badgeLabel": "原理与实践",
      "bridge": "只要求两端输出相同，会出现全输出常数的坏解。必须把已到达数据端的输入固定住。",
      "analogy": {
        "title": "让终点有一个固定锚点",
        "text": "安全绳在营地端牢牢固定。边界条件也给一致性学习一个锚点：到达数据端时，输出应保持输入本身。",
        "componentId": "analogy-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "把 t 拉回 ε，查看两条分支",
          "desc": "调整 t，观察输入跳连和网络分支的权重。在 t=ε 时，无论网络预测是什么，输出都必须等于输入。 <b>原文定位：</b>§3，式(5)；附录C，第25—26页。",
          "componentId": "boundary"
        }
      ],
      "insight": "让跳连系数在ε处等于1、网络输出系数等于0，可以直接满足边界条件。",
      "formula": {
        "lead": "本文用跳连实现边界约束；输入和网络输出必须具有相同维度。",
        "unicode": "f_θ(x,t) = c_skip(t)x + c_out(t)F_θ(x,t)；c_skip(ε)=1，c_out(ε)=0",
        "symbols": [
          {
            "sym": "f_θ",
            "desc": "参数为θ的一致性模型，输出与x同维。"
          },
          {
            "sym": "c_skip",
            "desc": "附录C：σ_data²/((t−ε)²+σ_data²)，σ_data=0.5。"
          },
          {
            "sym": "c_out",
            "desc": "附录C：σ_data(t−ε)/√(σ_data²+t²)。注意分母中是t²。"
          },
          {
            "sym": "F_θ",
            "desc": "可学习的神经网络分支；边界处它的权重为0。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "排除坏解",
          "desc": "恒等边界阻止简单的常数输出解。"
        },
        {
          "icon": "🔧",
          "title": "保证同维",
          "desc": "两条相加分支输出形状必须匹配。"
        },
        {
          "icon": "✨",
          "title": "不是插值概率",
          "desc": "c_skip与c_out无需相加等于1。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "两种学法：跟向导学，或自己练",
      "badge": "both",
      "badgeLabel": "原理与实践",
      "bridge": "如何找到可以彼此对齐的两个训练输入？一致性蒸馏与独立训练给出了不同答案。",
      "analogy": {
        "title": "向导与自主练习，各有前提",
        "text": "有向导时，可以按向导给出的相邻位置练习。没有向导时，用同一场景的两种扰动进行自我对齐；比喻并不保证两点严格处于同一路径。",
        "componentId": "analogy-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "切换 CD 与 CT 的配对方式",
          "desc": "切换训练方式，观察训练输入的构造和是否需要扩散教师。CT 的相邻带噪点不能直接称为精确同轨迹点。 <b>原文定位：</b>§4—5，式(7)、(10)，第4—6页。",
          "componentId": "methods"
        }
      ],
      "insight": "CD需要预训练扩散教师；CT用同一张数据与同一噪声构造训练对。",
      "formula": {
        "lead": "CD与CT都对齐两端输出，区别是上方模块中 u、v 的构造。以下为式(7)、(10)的统一记号，目标分支停止梯度。",
        "unicode": "L = E[λ(tₙ) d(f_θ(u,tₙ₊₁), f_θ⁻(v,tₙ))]",
        "symbols": [
          {
            "sym": "u、v",
            "desc": "u是较高噪声输入；CD的v由教师求解器估计，CT的v使用同一x、z降低噪声。"
          },
          {
            "sym": "n、N",
            "desc": "N个时间点形成N−1个区间；均匀抽取n∈{1,…,N−1}，期望还包括数据x和高斯噪声z。"
          },
          {
            "sym": "θ、θ⁻",
            "desc": "在线学生参数与停止梯度的EMA目标参数；均不同于预训练扩散教师φ。"
          },
          {
            "sym": "d、λ",
            "desc": "d是非负输出距离，图像实验主要用LPIPS；λ为正权重，本文实验取1。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "CD有教师",
          "desc": "用预训练score模型估计轨迹邻点。"
        },
        {
          "icon": "🔧",
          "title": "CT无教师",
          "desc": "从真实数据和共享噪声构造输入。"
        },
        {
          "icon": "✨",
          "title": "理论有假设",
          "desc": "CT与CD的极限联系不能当作有限步严格等价。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "生成：一步到端点，还能再精修",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "训练完后，生成不再需要访问教师。若愿意多花计算，一致性模型还能先预测、再加噪、再预测。",
      "analogy": {
        "title": "再次调整返程判断",
        "text": "先做一次终点判断，再从较近的参照重新校正。真实算法的校正是重新加噪再应用一致性函数，并非沿着原山路积分。",
        "componentId": "analogy-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "逐步执行两次网络评估",
          "desc": "按步骤执行算法，观察状态、噪声尺度和 NFE。示意点不是真实图像输出；两次评估不保证对每张样本都更好。 <b>原文定位：</b>算法1，第4页。",
          "componentId": "sampling"
        }
      ],
      "insight": "多步一致性采样交替执行预测与重新加噪，噪声时间逐次降低。",
      "formula": {
        "lead": "每次精修先在当前端点估计上重新加噪，再执行一次一致性预测。",
        "unicode": "x ← f_θ(x + √(τ²−ε²)z, τ)，z ∼ N(0,I)，τ≥ε",
        "symbols": [
          {
            "sym": "τ",
            "desc": "递减的采样噪声时间；不同于训练离散点数N。"
          },
          {
            "sym": "ε",
            "desc": "小正端点时间，保证τ²−ε²非负。"
          },
          {
            "sym": "x",
            "desc": "赋值右侧是上一次端点估计；左侧是新端点估计。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "一步可用",
          "desc": "从高斯噪声开始，一次调用即可生成。"
        },
        {
          "icon": "🔧",
          "title": "多步可调",
          "desc": "重新加噪后再预测，可用更多计算换质量。"
        },
        {
          "icon": "✨",
          "title": "NFE要数对",
          "desc": "加噪不计作一次网络评估。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "训练稳定性：别追着摇晃的目标跑",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "在线网络不断变化，如果目标也剧烈跳动，对齐就难以稳定。本文使用停止梯度的EMA目标网络。",
      "analogy": {
        "title": "稳定参照，不替你迈步",
        "text": "指南针读数经过平滑后更容易作为参照。目标网络也缓慢跟随在线网络，但不是第二个同时接收梯度更新的学生。",
        "componentId": "analogy-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "逐步更新在线网络与目标网络",
          "desc": "使用简化标量演示 EMA 更新与停止梯度。数值是教学例子，不是论文训练日志或真实损失曲线。 <b>原文定位：</b>式(8)、算法2—3，第5—6页。",
          "componentId": "ema"
        }
      ],
      "insight": "在线网络用梯度学习，目标网络通过EMA更新，两条更新路线要分清。",
      "formula": {
        "lead": "在线网络完成梯度更新后，目标参数用指数滑动平均缓慢跟随。",
        "unicode": "θ⁻ ← stopgrad(μθ⁻ + (1−μ)θ)，0≤μ<1",
        "symbols": [
          {
            "sym": "θ",
            "desc": "用梯度更新的在线一致性网络参数。"
          },
          {
            "sym": "θ⁻",
            "desc": "EMA目标参数；目标分支不通过损失反向传播。"
          },
          {
            "sym": "μ",
            "desc": "EMA衰减率；本模块0.8仅为看清变化的教学示例。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "目标不回传",
          "desc": "stopgrad阻断目标分支的梯度。"
        },
        {
          "icon": "🔧",
          "title": "更新方式不同",
          "desc": "在线用优化器，目标用EMA。"
        },
        {
          "icon": "✨",
          "title": "调度有作用",
          "desc": "CT逐渐增加训练网格点数N并调整μ；N不是推理调用次数NFE。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "模型结构：旧骨干，加上正确的边界",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "训练规则已经明确，网络本身是否需要重新发明？本文复用已有扩散骨干，关键是时间输入与边界参数化。",
      "analogy": {
        "title": "支撑结构服务于约束",
        "text": "登山杖提供稳定支撑，但它不会替代返程判断。跳连也是结构约束的一部分；一致性学习的改变不只是一根连接线。",
        "componentId": "analogy-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点选分支，查看活跃路径和输出",
          "desc": "选择输入、网络分支、跳连或输出端，观察活跃连接与对应的维度。图是式(5)的逻辑结构，不冒充骨干逐层结构。 <b>原文定位：</b>式(5)、附录C，第3、25—26页。",
          "componentId": "architecture"
        }
      ],
      "insight": "原文CIFAR-10采用NCSN++，ImageNet和LSUN采用ADM系列；不是一种新发明的通用U-Net。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "骨干可复用",
          "desc": "本文用既有NCSN++和ADM系列网络。"
        },
        {
          "icon": "🔧",
          "title": "形状要一致",
          "desc": "相加的两条路径必须同维。"
        },
        {
          "icon": "✨",
          "title": "边界要满足",
          "desc": "t=ε时逻辑图退化为恒等映射。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "零样本编辑：先保住你已经知道的部分",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "单纯生成整张图会改变原有内容。将已知区域重新放回，可以让多步采样受到观察约束。",
      "analogy": {
        "title": "已知位置，是不能随意改动的锚点",
        "text": "返程时，已确认安全的落脚点应保持可信。图像补全也要保留已知像素，把生成能力集中在未知区域。",
        "componentId": "analogy-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "对比整图重画与保留已知区域",
          "desc": "切换是否施加已知区域替换，查看同一张8×8教学图的变化。本模块是掩码机制演示，不运行真实图像补全。 <b>原文定位：</b>§6.3、附录D算法4，第9、26—27页。 附录D中LSUN Bedroom 256×256实验采用N=40个采样时间点，不能将这些编辑结果理解成一步生成。",
          "componentId": "editing"
        }
      ],
      "insight": "零样本编辑无需额外训练编辑任务，但仍依赖训练好的模型、适当的观测变换和采样过程。",
      "formula": {
        "lead": "对图像补全取A=I，并约定Ω=1表示未知区域，则每轮预测后执行替换。",
        "unicode": "x ← y ⊙ (1−Ω) + x ⊙ Ω",
        "symbols": [
          {
            "sym": "Ω",
            "desc": "与图像同形状的二值掩码：1是待生成区域，0是已知区域。"
          },
          {
            "sym": "y",
            "desc": "参考图像，在已知区域提供观测。"
          },
          {
            "sym": "⊙",
            "desc": "逐元素乘法；此处是附录D算法4在A=I时的特例。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "零样本有含义",
          "desc": "无需针对补全等编辑任务单独训练。"
        },
        {
          "icon": "🔧",
          "title": "已知要保留",
          "desc": "每轮预测后把已知内容替换回去。"
        },
        {
          "icon": "✨",
          "title": "证据有范围",
          "desc": "本文主要展示Bedroom CD模型的定性编辑样例。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "读懂结果：一步很快，质量仍有代价",
      "badge": "both",
      "badgeLabel": "原理与实践",
      "bridge": "最后把概念落到论文表格。比较时必须固定数据集、看清NFE和指标方向，并保留反例与适用边界。",
      "analogy": {
        "title": "少问路，不等于每次都走得最好",
        "text": "返程判断次数少是效率优势，但终点估计的质量仍需独立衡量。不能把调用次数直接换算为实测耗时。",
        "componentId": "analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "从共同零点揭示 FID 对比",
          "desc": "先选择数据集，再开始对比。柱长正比FID，越短越好；表格保留原数值与NFE。不同数据集不共用排行榜。 <b>原文定位：</b>§6.1—6.2、表1—2、图3—4，第6—8页。 本页只摘录FID；原表还报告IS或Precision/Recall，不代表覆盖全部质量指标。",
          "componentId": "results"
        }
      ],
      "insight": "CD的一步与两步结果很强，但不能据此声称所有设置下都超过多步EDM、所有GAN或所有蒸馏基线。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "关键数字",
          "desc": "CIFAR-10的CD一步/两步FID为3.55/2.93。"
        },
        {
          "icon": "🔧",
          "title": "区分CD与CT",
          "desc": "ImageNet一步CD为6.20，CT为13.0。"
        },
        {
          "icon": "✨",
          "title": "保留边界",
          "desc": "Fig.4中Bedroom一步ℓ2存在例外；消融最优也不等于普遍最优。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1w1p3eHEtB",
      "title": "一致性模型基本原理解析",
      "reason": "原论文原理长讲，适合对照第3—7章复习。",
      "cover": "https://i1.hdslb.com/bfs/archive/fb605e088c3660147991ae83233fa90e55ac8e0a.jpg",
      "views": "1.68万播放"
    },
    {
      "bvid": "BV1gL411k76R",
      "title": "Consistency Models 论文解读",
      "reason": "直接讲解本篇论文；虽播放量较低，主题匹配度高。",
      "cover": "https://i2.hdslb.com/bfs/archive/98d0e1d6e1c90168bb7284ba17b7458bf162dc50.jpg",
      "views": "4331播放"
    },
    {
      "bvid": "BV1KAkrY3Ekp",
      "title": "连续一致性模型：定理讲解",
      "reason": "进阶材料，面向关心连续时间与理论条件的读者。",
      "cover": "https://i0.hdslb.com/bfs/archive/46c7736084cbfad1a9708bef0a4f8a7b2161fbe6.jpg",
      "views": "2653播放"
    }
  ]
};
