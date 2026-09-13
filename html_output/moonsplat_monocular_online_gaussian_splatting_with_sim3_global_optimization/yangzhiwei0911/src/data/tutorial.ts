import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "MoonSplat: Monocular Online Gaussian Splatting with Sim(3) Global Optimization",
    "titleZh": "MoonSplat：带 Sim(3) 全局优化的单目在线高斯泼溅",
    "venue": "SIGGRAPH Conference Papers '26 · arXiv:2606.17935v1",
    "authors": "Guo Pu, Yixuan Han, Haofeng Li, Yao Zhang, Hui Zhou, Zhouhui Lian",
    "affiliation": "北京大学王选计算机研究所 · 北京氢智科技",
    "domain": "3D 视觉 / 在线 SLAM / 三维重建",
    "coreProblem": "单目在线三维重建中，现有在线 3DGS 方法缺少全局优化，序列跟踪的姿态与尺度误差会持续累积，长序列中容易跟踪失败。",
    "coreInsight": "<b>论文自己列了四点贡献，最核心的是第一条</b>：把关键帧建成<b>带闭环边的因子图</b>，用 <b>Sim(3)</b>（含尺度）而不是 SE(3) 联合优化相机位姿、尺度漂移<b>与 3D 高斯锚点位置</b>——论文称这是<b>首个用于在线 3DGS 的 Sim(3) 全局优化</b>。另三条是颜色残差学习、大规模实验对比、真实无人机主动重建系统。全篇的关键差别其实只有一句：<b>高斯点云本身也能被全局优化搬动</b>。",
    "keywords": [
      "在线 3DGS",
      "视觉 SLAM",
      "Sim(3) 全局优化",
      "环路闭合",
      "颜色残差学习",
      "体素化高斯"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "只有逐帧顺序估计的在线 3DGS：没有全局优化，缝到后面越走越歪，长序列容易跟踪失败。",
      "componentId": "hero-compare"
    },
    "newMethod": {
      "desc": "MoonSplat 把关键帧建成带闭环边的因子图，用 Sim(3) 联合优化位姿与高斯锚点，缝线全程贴合基准线。",
      "componentId": "hero-compare"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "起针之前：为什么针脚会越走越歪",
      "badge": "inf",
      "badgeLabel": "入门必读",
      "bridge": "全篇的起点。先把论文自己的四点贡献摆在这里，后面每一章都在展开其中之一：① 带 <b>Sim(3) 全局优化</b>的在线体素化 3DGS 框架，把相机位姿、尺度漂移与高斯锚点位置放在一起联合优化——<b>这是本文最核心的新东西</b>；② <b>颜色残差学习</b>，加速体素化 3DGS 收敛；③ 30 个室内外场景上的实验对比；④ 真实无人机主动重建系统。本章不引入公式，先建立「跟踪—建图—全局优化」这一核心循环的问题意识，让你亲手看到累积偏差。",
      "analogy": {
        "title": "越缝越歪",
        "text": "手拿一根针沿布带往前走针，没有东西帮你回头看，每走一针都会比上一针更偏一点。",
        "componentId": "ana-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "累积误差滑块",
          "desc": "拖动滑块把缝过的针数拉长，看缝线相对基准线如何一点点偏出去。曲线为按论文趋势绘制的示意曲线，不是论文原始数据。",
          "componentId": "ch1-drift"
        }
      ],
      "insight": "问题不在某一针缝得多准，而在没有任何机制回头看，把已经累积的偏差拉回来。",
      "takeaways": [
        {
          "icon": "🧭",
          "title": "问题是累积",
          "desc": "单帧误差很小，但沿序列会持续放大。"
        },
        {
          "icon": "⏱",
          "title": "长序列才暴露",
          "desc": "短序列看不出问题，序列一长就失败。"
        },
        {
          "icon": "🎯",
          "title": "需要全局",
          "desc": "缺的不是更准的单帧估计，而是一个能全局修正的机制。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "先划一条基准线：点图与相机内参",
      "badge": "inf",
      "badgeLabel": "入门必读",
      "bridge": "承接第 1 章「需要全局机制」，先解决更前置的问题——拿什么当基准？它把输入表示讲清楚，为第 3 章的尺度问题铺路。",
      "analogy": {
        "title": "先弹一条线",
        "text": "动手之前先在布上弹一条笔直的底线，后面每一针都要跟它对；没有这条线，针脚就没有共同的参照。",
        "componentId": "ana-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "点选关键帧看内参估计",
          "desc": "点击布带上的 6 个刻度，看它在前 k_init 个关键帧之内还是之外，以及统一内参对它做了什么。k_init 的具体取值论文没有给出，这里的 6 个刻度与 3 个分界仅作示意；插片里的收敛条与点图残差也是按论文结论绘制的示意数据，不是论文原始数据。",
          "componentId": "ch2-kf"
        }
      ],
      "formula": {
        "lead": "统一内参矩阵由焦距与主点构成，所有关键帧共用同一个 K。",
        "unicode": "<i>K</i> = <span class=\"mx mx3\"><i>f</i><span>0</span><span><i>c</i><sub>x</sub></span><span>0</span><i>f</i><span><i>c</i><sub>y</sub></span><span>0</span><span>0</span><span>1</span></span>",
        "symbols": [
          {
            "sym": "K",
            "desc": "3×3 相机内参矩阵，作用于所有关键帧。"
          },
          {
            "sym": "f",
            "desc": "前 k_init 个关键帧 BA 解出的统一焦距（像素），正数。"
          },
          {
            "sym": "c",
            "desc": "主点坐标 (cₓ, c_y)（像素）。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📐",
          "title": "先有基准",
          "desc": "没有统一内参，渲染射线与 3D 点就对不上。"
        },
        {
          "icon": "🔧",
          "title": "基准是解出来的",
          "desc": "焦距与主点来自前 k_init 个关键帧的联合优化。"
        },
        {
          "icon": "⚖️",
          "title": "只解一次",
          "desc": "后续关键帧改用深度重投影校正，避免 BA 复杂度爆炸。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "为什么要带上「尺子」：SE(3) 不够，需要 Sim(3)",
      "badge": "inf",
      "badgeLabel": "入门必读",
      "bridge": "全篇的核心洞察。在「有了基准」之后回答「对齐到底要估计几个量」，并解释为什么后续所有全局优化都必须建立在 Sim(3) 上。",
      "analogy": {
        "title": "对不上，是因为还得缩放",
        "text": "两段布的花纹要接上，光把它们平移过去是不够的，还得把其中一段按正确的比例缩放，花纹才对得上。",
        "componentId": "ana-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "同步对比：只用刚性 vs 带上尺度",
          "desc": "按一次共享的「开始对齐」，看两栏从同一初态出发，刚性与带尺度最终留下的残差差在哪里。",
          "componentId": "ch3-sim3"
        }
      ],
      "formula": {
        "lead": "Sim(3) 变换在旋转与平移之外多了一个正尺度因子，这正是对齐两段点图所必需的自由度。",
        "unicode": "<i>T</i> = <span class=\"mx mx2\"><span><i>s</i>·<i>R</i></span><i>t</i><span>0</span><span>1</span></span>，<i>R</i> ∈ SO(3)，<i>t</i> ∈ ℝ<sup>3</sup>，<i>s</i> ∈ ℝ<sup>+</sup>",
        "symbols": [
          {
            "sym": "T",
            "desc": "4×4 Sim(3) 相对变换。"
          },
          {
            "sym": "R",
            "desc": "3×3 旋转矩阵（正交、行列式 1）。"
          },
          {
            "sym": "t",
            "desc": "3×1 平移向量。"
          },
          {
            "sym": "s",
            "desc": "正尺度因子（s ≠ 0，无负值），用于补偿 MASt3R 每个图像对独立预测尺度造成的错位。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📏",
          "title": "尺度是模型的一部分",
          "desc": "对齐要估的不是 6 个自由度，而是 7 个。"
        },
        {
          "icon": "🔍",
          "title": "刚性不够用",
          "desc": "原因很具体：两视图先验对每个图像对独立预测尺度。"
        },
        {
          "icon": "🔗",
          "title": "选择会传下去",
          "desc": "环路闭合与锚点回修都必须建在 Sim(3) 上。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "把“歪了多少”写成可以优化的量：加权重投影误差",
      "badge": "both",
      "badgeLabel": "都值得看",
      "bridge": "第 3 章确定了对齐要估 7 个自由度，本章把它改写成一条可以求解的目标函数：把所有双向边上的匹配点残差按置信度加权求和，再用 Gauss-Newton 配合稀疏 Cholesky 解出来。",
      "analogy": {
        "title": "落在正中间",
        "text": "两段布各自给出一个针脚位置，真正该落的地方是让两边偏差之和最小的那一点，而不是任意一边。",
        "componentId": "ana-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "拖动一个匹配点",
          "desc": "亲手拖动一个匹配点，看残差平方和是一条有唯一最低点的曲线，从而理解全局优化在做什么。",
          "componentId": "ch4-residual"
        }
      ],
      "formula": {
        "lead": "目标函数把所有双向边上的匹配点残差按置信度加权求和，残差越小表示位姿与尺度越一致。",
        "unicode": "{<i>T̃ₘ</i>} = arg min<sub>{<i>Tₘ</i>}</sub> ∑<sub>(<i>i</i>,<i>j</i>)∈<i>E</i><span class=\"sb\">f</span></sub> ∑<sub>(<i>pᵢ</i>,<i>pⱼ</i>)∈<i>P</i><span class=\"sb\">ij</span></sub> <span class=\"fx\"><span class=\"fx-num\">1</span><span class=\"fx-den\"><i>C</i><span class=\"sb\">ij</span></span></span> · [ ‖π(<i>pⱼ</i>) − π(<i>Tⱼ</i><sup>−1</sup><i>Tᵢ</i>(<i>pᵢ</i>))‖<sup>2</sup> + ‖π(<i>pᵢ</i>) − π(<i>Tᵢ</i><sup>−1</sup><i>Tⱼ</i>(<i>pⱼ</i>))‖<sup>2</sup> ] <span class=\"eqn\">(2)</span>",
        "symbols": [
          {
            "sym": "Tₘ",
            "desc": "第 m 个节点的 Sim(3) 变换，4×4 矩阵。"
          },
          {
            "sym": "T̃ₘ",
            "desc": "该节点优化后的 Sim(3) 变换。"
          },
          {
            "sym": "E",
            "desc": "因子图边集 E_f，边连接相邻或闭环关键帧。"
          },
          {
            "sym": "P",
            "desc": "边 (i,j) 上的匹配点对集合 P_ij。"
          },
          {
            "sym": "p",
            "desc": "3D 匹配点，取值于 ℝ³。"
          },
          {
            "sym": "C",
            "desc": "该匹配点的置信度，正数；作分母即低置信度被降权。"
          },
          {
            "sym": "π",
            "desc": "由内参 K 参数化的相机投影函数 π(·)。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "双向才对称",
          "desc": "两个方向都算一次残差，才不会偏向任何一侧。"
        },
        {
          "icon": "⚖️",
          "title": "置信度当权重",
          "desc": "低置信度的匹配点被自动降权。"
        },
        {
          "icon": "⚡",
          "title": "稀疏性可以利用",
          "desc": "图的结构让稀疏 Cholesky 高效求解。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "三种缝法：表示与初始化的取舍",
      "badge": "both",
      "badgeLabel": "都值得看",
      "bridge": "第 4 章解决了“怎么优化”，本章转到“优化什么表示”：原始 3DGS 太耗显存，体素化 3DGS 省显存却让联合优化变慢，两条取舍条把这件事摆到台面上。",
      "analogy": {
        "title": "换一枚针",
        "text": "同一块布、同一个动作，换一枚不同的针，出活的速度和手感就完全不同——表示方式的选择就是这个意思。",
        "componentId": "ana-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "配置芯片切换",
          "desc": "用一次点击感受表示方式的三方取舍，并判断为什么本工作选择“体素化 + 颜色残差学习”。",
          "componentId": "ch5-variants"
        }
      ],
      "takeaways": [
        {
          "icon": "🧱",
          "title": "表示决定上限",
          "desc": "原始 3DGS 的图元增长是硬约束。"
        },
        {
          "icon": "🐢",
          "title": "省显存有代价",
          "desc": "体素化的代价是联合优化变慢。"
        },
        {
          "icon": "💡",
          "title": "先验破掉取舍",
          "desc": "给出基准色、只学残差，才能两头都要。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "一针一针缝下去：在线执行流程",
      "badge": "inf",
      "badgeLabel": "入门必读",
      "bridge": "第 2–5 章的零件已经齐了，本章把它们按时间排成一条可执行的在线流程：判断关键帧、估初始位姿、建锚点、训练，并说明为什么 BA 只在前 k_init 个关键帧上做一次。",
      "analogy": {
        "title": "一针挨一针",
        "text": "在线重建不是缝完再检查，而是一边缝一边判断、一边建图，针脚必须一针接一针地推进。",
        "componentId": "ana-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "逐步推进关键帧",
          "desc": "按顺序走完整条在线流程，看清每一步的输入与输出，并判断“BA 只做一次”这个设计选择为什么必要。",
          "componentId": "ch6-steps"
        }
      ],
      "takeaways": [
        {
          "icon": "🔁",
          "title": "顺序即正确性",
          "desc": "判断关键帧 → 估位姿 → 建锚点 → 训练。"
        },
        {
          "icon": "💰",
          "title": "贵的只做一次",
          "desc": "BA 只在前 k_init 个关键帧上执行。"
        },
        {
          "icon": "🧩",
          "title": "输出要留痕",
          "desc": "每个关键帧都要记录自己的锚点子集，供后面全局回修使用。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "收紧线要刚好：颜色残差学习",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "上一章讲过体素化表示要付出什么代价；这一章回答它为什么慢——把已知的颜色放进初始化，只让网络学一个很小的残差，同样的迭代数就能明显更快到位。",
      "analogy": {
        "title": "收紧要刚好",
        "text": "线太松布面不平，太紧会起新的褶子；先把布料本身摆正（基准），再只调张力，才是最快见效的做法。",
        "componentId": "ana-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "迭代数与 CRL 开关",
          "desc": "拖动训练迭代数并切换颜色残差学习，在相同迭代数下对比布面贴合度与两条损失曲线。两条损失曲线为按论文趋势绘制的示意曲线，不是论文原始数据。",
          "componentId": "ch7-crl"
        }
      ],
      "formula": {
        "lead": "颜色不再由网络从零预测，而是“锚点基准色 + 一个有界的残差”。",
        "unicode": "<i>cᵤᵢ</i> = <i>cᵤ</i> + <i>F</i><sub>c</sub>([ <i>fₐᵤ</i><sup>ᵀ</sup> , <i>dᵤ</i><sup>ᵀ</sup> , <i>δᵤ</i> ]<sup>ᵀ</sup>)，<i>F</i><sub>c</sub> : ℝ<sup>d+4</sup> → ℝ<sup>3</sup> <span class=\"eqn\">(1)</span>",
        "symbols": [
          {
            "sym": "cᵤᵢ",
            "desc": "锚点 u 的第 i 个偏移高斯的最终颜色（RGB，3 维）。"
          },
          {
            "sym": "cᵤ",
            "desc": "该锚点的基准色（RGB），取自体素内关键帧点图颜色的匹配置信度加权平均。"
          },
          {
            "sym": "fₐᵤ",
            "desc": "锚点可学习特征，d 维。"
          },
          {
            "sym": "dᵤ",
            "desc": "相机光心指向锚点的单位视线方向，3 维。"
          },
          {
            "sym": "δᵤ",
            "desc": "锚点与相机光心的欧氏距离，1 维正数。"
          },
          {
            "sym": "F",
            "desc": "颜色残差 MLP F_c：3 层全连接 + ReLU，末端 tanh 把残差限制在 [-0.5, 0.5]³。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧪",
          "title": "瓶颈在颜色",
          "desc": "训练早期大部分迭代都耗在学颜色上，收敛因此更慢。"
        },
        {
          "icon": "🎨",
          "title": "先验换速度",
          "desc": "把点图颜色当基准色，网络只学残差。"
        },
        {
          "icon": "⛓",
          "title": "残差有边界",
          "desc": "tanh 限幅让残差不会覆盖基准色。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "整条布带首尾接合：因子图与锚点回修",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "前面都是顺着往下缝；这一章是“回头看”真正发生的地方——先把关键帧建成因子图、把环闭上，再让历史锚点跟着新的变换一起搬回正确位置。",
      "analogy": {
        "title": "把首尾接起来",
        "text": "缝到后面发现前面歪了，唯一有效的办法是把首尾对起来看——一旦接上，中间整段的偏差就能被一起拉正。",
        "componentId": "ana-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点击因子图节点",
          "desc": "点击任一节点，看清相邻边与闭环边分别把哪些时刻连在了一起。",
          "componentId": "ch8-graph",
          "figure": "/images/figure-2.jpg"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "四步回修锚点",
          "desc": "用上一步／下一步走完四步，亲眼看锚点被整体搬回去并重新归位。",
          "componentId": "ch8-anchor"
        }
      ],
      "insight": "分段各自最准没有意义：必须有一个把所有关键帧放在一起解、并且能把历史结果一起搬正的机制。",
      "formula": {
        "lead": "优化完变换之后，每个锚点按新变换与旧变换的相对关系搬回它应该在的位置。",
        "unicode": "<i>μ̃ₘ</i> = <i>T̃ₘ</i> · <i>Tₘ</i><sup>−1</sup> · <i>μₘ</i> <span class=\"eqn\">(3)</span>",
        "symbols": [
          {
            "sym": "μ̃ₘ",
            "desc": "优化后的锚点位置，3 维。"
          },
          {
            "sym": "μₘ",
            "desc": "记录下来的原始锚点位置，3 维。"
          },
          {
            "sym": "T̃ₘ",
            "desc": "该关键帧优化后的 Sim(3) 变换，4×4 矩阵。"
          },
          {
            "sym": "Tₘ",
            "desc": "该关键帧原始的 Sim(3) 变换，4×4 矩阵；上标 −1 表示它的逆变换。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🕸",
          "title": "节点是帧、边是约束",
          "desc": "闭环边把“现在的我”和“很久以前的我”绑在一起。"
        },
        {
          "icon": "🧷",
          "title": "位姿不是全部",
          "desc": "3DGS 的点来自历史位姿，锚点必须一起搬。"
        },
        {
          "icon": "♻️",
          "title": "搬完要归位",
          "desc": "重新分配到最近体素，保证体素结构与位姿一致。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "熨平、去重、看清失效：实用技术与鲁棒性",
      "badge": "trn",
      "badgeLabel": "可后读",
      "bridge": "收束方法细节并转入批判性认识，回答这套方法在什么条件下会失效，为下一章的结果与局限总结做铺垫。",
      "analogy": {
        "title": "熨过一遍就定型了",
        "text": "缝完只是第一步，还得把布面熨平、把重复的线头剪掉，成品才干净；但布本身有它承受不了的条件。",
        "componentId": "ana-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "拖动失效因子",
          "desc": "把条件推到边界之外，看失配如何逐帧累积，并记住三条具体的使用禁区。图中的置信度曲线为按论文结论绘制的示意曲线，不是论文原始数据。",
          "componentId": "ch9-robust"
        }
      ],
      "takeaways": [
        {
          "icon": "🧹",
          "title": "去重与正则",
          "desc": "空间哈希避免冗余锚点，各向同性正则维持几何规整。"
        },
        {
          "icon": "🚫",
          "title": "有明确禁区",
          "desc": "动态物体占比过高的场景不在适用范围。"
        },
        {
          "icon": "📈",
          "title": "边界是渐进的",
          "desc": "置信度随距离下降、显存随序列增长，都是连续恶化而非开关。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "两条布带的成品评比：结果与取舍",
      "badge": "both",
      "badgeLabel": "都值得看",
      "bridge": "收尾。用同一套评测协议下的可核验数值建立结论，并把代价与边界一起摆出来，避免读成全面碾压。论文还用这套方法搭了一套无人机主动重建系统：机上只有单目相机，图像经无线传到服务端实时重建，再按 0.2 m³ 分辨率的占据图挑选下一个最佳视角、用 A* 规划无碰撞路径——本页下方的图（论文 Fig. 1）就是这套系统在真实场景中的运行画面，它属于应用展示，不是本页对比实验的结果。",
      "analogy": {
        "title": "同一条起跑线",
        "text": "把四套方法放在同一批场景、同一套协议上跑，谁更稳、谁更快、谁更省，一眼就看出来。",
        "componentId": "ana-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "开始对比与指标切换",
          "desc": "按一次按钮完成协议一致的对比，切换指标时同时切换方向，避免把不同协议的数值混在一起比。",
          "componentId": "ch10-race",
          "figure": "/images/figure-1.jpg"
        }
      ],
      "takeaways": [
        {
          "icon": "🏆",
          "title": "综合指标领先",
          "desc": "在 30 个场景上 ATE／PSNR／SSIM／LPIPS 的综合表现优于全部基线，帧率在三个数据集上都保持实时；单场景并非每一项都第一。"
        },
        {
          "icon": "⚖️",
          "title": "代价要说清楚",
          "desc": "显存随序列长度增长，且无法像 OTF-NVS 那样卸载历史高斯到磁盘。"
        },
        {
          "icon": "🧭",
          "title": "边界要记住",
          "desc": "动态物体占比过高的场景不在适用范围内。"
        }
      ]
    }
  ]
};
