import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Overcoming catastrophic forgetting in neural networks",
    "titleZh": "克服神经网络中的灾难性遗忘",
    "venue": "PNAS 2017 · DeepMind",
    "authors": "James Kirkpatrick, Razvan Pascanu, Neil Rabinowitz, Joel Veness, Guillaume Desjardins, Andrei A. Rusu, Kieran Milan, John Quan, Tiago Ramalho, Agnieszka Grabska-Barwinska, Demis Hassabis, Claudia Clopath, Dharshan Kumaran, Raia Hadsell",
    "affiliation": "DeepMind, London",
    "domain": "持续学习 · 深度学习 · 强化学习",
    "coreProblem": "顺序学习多个任务时，网络会改写对旧任务重要的权重，导致旧任务表现骤降（灾难性遗忘）。",
    "coreInsight": "用 Fisher 信息衡量每个权重对旧任务的重要性，并在学习新任务时用“弹性”二次惩罚把重要权重拉回旧值——像弹簧一样软约束，既保护旧知识又留出学习新任务的空间。",
    "keywords": [
      "持续学习",
      "灾难性遗忘",
      "弹性权重巩固",
      "Fisher 信息"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "<b>普通 SGD</b>：顺序训练新任务时，旧任务依赖的权重被改写，表现<b>大幅下降</b>。",
      "componentId": "hero-forgetting"
    },
    "newMethod": {
      "desc": "<b>EWC</b>：按 Fisher 重要性给每个权重挂上<b>弹性弹簧</b>，重要权重被锚定，旧任务表现保持。",
      "componentId": "hero-forgetting"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "灾难性遗忘：学新忘旧",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "封面预览了新旧两种做法。论文的场景假设是：<b>任务依次到来</b>、<b>旧任务数据之后不可用</b>（不保留回放）、<b>任务明确分段</b>。本节进入这一设定，亲手制造一次“灾难性遗忘”，看清新任务训练如何摧毁旧任务表现。",
      "analogy": {
        "title": "换线练得太狠，老路线就抓不住了",
        "text": "一条接一条地练新路线，把<b>旧路线的关键岩点</b>磨淡了，回头再爬，手一抓就<b>滑落</b>。",
        "componentId": "ch1-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "体验遗忘：新任务练得越猛，旧技能崩得越快",
          "desc": "在<b>顺序学习多个任务</b>（先学任务 A 再学任务 B）的设定下，拖动滑块改变“任务 B 训练强度”，观察旧任务表现如何崩塌（曲线数值为方向性示意）。",
          "componentId": "ch1-mod1"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "对比三种做法：不约束 / 均匀约束 / EWC",
          "desc": "切换做法，观察参数在参数空间中的去向（与论文 Figure 1 的示意一致）。",
          "componentId": "ch1-mod2"
        }
      ],
      "insight": "顺序学习时遗忘的根源不是网络容量，而是训练新任务时把<b>旧任务依赖的重要权重</b>无差别地改写了——所以解法必须是“有选择地保护权重”。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "遗忘的机制",
          "desc": "顺序学习多个任务时，训练新任务会改写旧任务依赖的权重，旧任务表现骤降。"
        },
        {
          "icon": "🔧",
          "title": "均匀 L2 的失败",
          "desc": "所有权重同样拉紧，旧任务保住了，新任务却学不会。"
        },
        {
          "icon": "✨",
          "title": "本文的思路",
          "desc": "只对“重要的权重”施加弹性保护，新旧任务才能两全。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "共享权重空间：两个任务抢同一批参数",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "遗忘发生在权重上。本节打开网络的“权重现场”：两个任务如何在同一个网络里争抢参数。",
      "analogy": {
        "title": "一个岩点，两条路线都要用",
        "text": "网络里<b>同一批权重</b>同时服务多个任务；两条路线都要用<b>同一个岩点</b>。",
        "componentId": "ch2-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "点击权重：看它被哪个任务占用",
          "desc": "点击权重网格中的任意一格，查看它在任务 A 与任务 B 中的“使用强度”（方向性示意）。",
          "componentId": "ch2-mod1"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "共享资源",
          "desc": "固定容量的网络里，所有任务共享同一批权重。"
        },
        {
          "icon": "🔧",
          "title": "争抢即遗忘",
          "desc": "新任务把旧任务在用的重要权重改掉，旧任务就“失守”。"
        },
        {
          "icon": "✨",
          "title": "需要的工具",
          "desc": "一张“每个权重被谁使用”的清单——这就是后文 Fisher 信息的角色。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "核心洞察：只保护重要的权重",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "既然权重是争抢对象，关键就是分清哪些要保护。本节给出全文的核心洞察：只保护重要的权重。",
      "analogy": {
        "title": "把最重要的岩点钉死",
        "text": "不是每个岩点都要钉——<b>只把最关键的那个</b>固定住，其余岩点留给新路线。",
        "componentId": "ch3-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "同步对比：全部钉死 vs 只钉关键点",
          "desc": "点「开始」让左右两条线路同时开爬，观察均匀保护与按重要性保护的差别（进度数值为方向性示意）。",
          "componentId": "ch3-mod1"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "拖动参数点：感受弹簧的拉力",
          "desc": "在参数空间中拖动参数点，对比「无约束」与「EWC 弹簧」两条轨迹的落点。",
          "componentId": "ch3-mod2"
        }
      ],
      "insight": "既然\"重要性\"才是关键，下一步就是回答：<b>如何度量一个权重对旧任务有多重要</b>？——把每个权重单独轻轻拨动，看旧任务损失上升多少，上升越多越重要；这个敏感度（损失曲率）在数学上就是 <b>Fisher 信息</b>。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "选择性保护",
          "desc": "只钉住对旧任务重要的权重，其余保持自由。"
        },
        {
          "icon": "🔧",
          "title": "均匀保护失败",
          "desc": "把一切钉死等于锁死网络，新任务学不会。"
        },
        {
          "icon": "✨",
          "title": "度量的钥匙",
          "desc": "重要性 = 损失对权重的敏感度（曲率），数学上就是 Fisher 信息。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "数学框架：Fisher 信息与弹性惩罚",
      "badge": "both",
      "badgeLabel": "通用",
      "bridge": "直觉已就位，本节把方法写成方程：先讲清损失函数如何构造（新任务损失 + 旧任务保护项），再给出重要性 F 的算法定义。",
      "analogy": {
        "title": "离锚点越远，绳子拉得越狠",
        "text": "惩罚就像<b>弹簧</b>：偏离旧解越远，<b>回拉</b>越强——这就是\"elastic\"的由来。",
        "componentId": "ch4-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "拉一拉弹簧：距离、刚度与惩罚",
          "desc": "拖动偏离距离并切换权重刚度，观察弹簧力与二次惩罚曲线的联动（λ 固定为 1）。",
          "componentId": "ch4-mod1"
        }
      ],
      "formula": {
        "lead": "损失函数这样构造：学任务 B 时既要<b>新任务表现好</b>、又不能<b>破坏旧任务</b>，所以总损失 = 任务 B 的损失 L<sub>B</sub>，加上把参数拉回旧解 θ*<sub>A</sub> 的二次惩罚；每个权重的惩罚强度按重要性 F<sub>i</sub> 加权，整体由 λ 控制。这个惩罚来自贝叶斯推导：把旧任务的后验 p(θ|D<sub>A</sub>) 近似成均值为 θ*<sub>A</sub>、精度为对角 Fisher 的高斯分布，其对数正是下面的二次型；其中 F<sub>i</sub> 就是“拨动 θ<sub>i</sub> 时旧任务损失的平均上升速度”（损失曲率的期望），在旧解 θ*<sub>A</sub> 处计算。",
        "unicode": "L(θ) = L<sub>B</sub>(θ) + Σ<sub>i</sub> (λ/2) F<sub>i</sub> (θ<sub>i</sub> − θ*<sub>A,i</sub>)<sup>2</sup>　（F<sub>i</sub> = E<sub>x</sub>[(∂ log p(x|θ)/∂θ<sub>i</sub>)<sup>2</sup>]，在 θ*<sub>A</sub> 处计算）",
        "symbols": [
          {
            "sym": "L",
            "desc": "总损失 = 新任务损失 L_B 加上旧任务保护项，两者一起最小化。"
          },
          {
            "sym": "θ",
            "desc": "网络全部参数；θ* 是任务 A 训练结束时的最优参数（锚点）。"
          },
          {
            "sym": "λ",
            "desc": "旧任务相对新任务的重要性系数，越大保护越强。"
          },
          {
            "sym": "F",
            "desc": "Fisher 信息（对角近似）：把 θ_i 轻轻拨动时旧任务损失的平均上升速度，即损失曲率的期望；F_i 越大该参数越重要。"
          },
          {
            "sym": "Σ",
            "desc": "对所有参数 i 求和，把每个权重的弹簧加总。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "一项一义",
          "desc": "任务 B 损失 + 每个权重一根弹簧（刚度 = Fisher 重要性）。"
        },
        {
          "icon": "🔧",
          "title": "平方增长",
          "desc": "惩罚随偏离距离平方增长，天然把重要权重拉回旧解附近。"
        },
        {
          "icon": "✨",
          "title": "Fisher 三性质",
          "desc": "≈损失曲率、一阶可算、半正定——适合大模型。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "λ：在“记住旧任务”与“学会新任务”之间",
      "badge": "both",
      "badgeLabel": "通用",
      "bridge": "方程里还剩一个旋钮 λ。本节回答：保护该有多强，才能既不遗忘又学得动。",
      "analogy": {
        "title": "张力太小护不住，太大动不了",
        "text": "λ 就是这根绳子的<b>整体张力</b>：太松会遗忘，太紧会<b>学不动</b>。",
        "componentId": "ch5-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "切换 λ：看旧任务与新任务的表现",
          "desc": "三档 λ 对应绳子三种状态，同时观察两个任务的表现柱（柱值为方向性示意）。",
          "componentId": "ch5-mod1"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "拖动 λ：观察稳定—可塑权衡曲线",
          "desc": "沿 λ 轴拖动，看“旧任务保持率”与“新任务学习率”两条曲线如何此消彼长（曲线为方向性示意）。",
          "componentId": "ch5-mod2"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "一个旋钮",
          "desc": "λ 统一缩放所有弹簧，决定保护的整体强度。"
        },
        {
          "icon": "🔧",
          "title": "两端失败",
          "desc": "λ 过小 → 遗忘；λ 过大 → 锁死、学不动新任务。"
        },
        {
          "icon": "✨",
          "title": "实践做法",
          "desc": "论文按任务用超参数搜索确定 λ（如 Atari 用 Fisher 乘数 400）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "训练流程：从任务 A 到任务 B",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "理解了目标函数，本节把 EWC 的完整训练流程一步步走一遍。",
      "analogy": {
        "title": "一步一步把绳子挂好",
        "text": "EWC 的训练也是<b>按步骤</b>来的：先估重要性，再挂上保护，然后才爬新路线。",
        "componentId": "ch6-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "按步骤走一遍 EWC 训练",
          "desc": "用「上一步/下一步」走过 EWC 的完整训练循环，看每个阶段的权重状态。",
          "componentId": "ch6-mod1"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "五步循环",
          "desc": "训练 → 估 Fisher → 存锚点 → 带惩罚学新任务 → 重复。"
        },
        {
          "icon": "🔧",
          "title": "关键事实",
          "desc": "Fisher 只在任务切换时重算（Atari 用 100 个小批量）。"
        },
        {
          "icon": "✨",
          "title": "无旧数据",
          "desc": "保护完全来自存储的 θ*_A 与 F，训练新任务不需要旧数据。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "Fisher 是怎么算出来的",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "流程里的关键一步是“估算 Fisher”。本节拆解 F 是怎么从数据里算出来的。",
      "analogy": {
        "title": "多试拉几次，才知岩点多受力",
        "text": "Fisher 也是<b>试</b>出来的：对数据反复采样，估计每个权重的<b>重要性</b>。",
        "componentId": "ch7-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "增加采样批数：重要性估计逐渐收敛",
          "desc": "F<sub>i</sub> 就是把 θ<sub>i</sub> 拨动一点、旧任务损失平均上升多少的估计。拖动采样批数，观察三个权重的 Fisher 估计直方图如何收敛（统计直觉的解释性演示）。",
          "componentId": "ch7-mod1"
        }
      ],
      "formula": {
        "lead": "把“重要性”变成可算的量：F<sub>i</sub> 等于“对数似然对该权重的梯度”的平方在数据上的期望——梯度大说明这个权重正被数据强烈使用，平方后取平均，就是它对旧任务的平均重要性；整个计算只需要一阶梯度，在旧解处进行。",
        "unicode": "F<sub>i</sub> = E<sub>x</sub>[ (∂ log p(x|θ) / ∂θ<sub>i</sub>)<sup>2</sup> ]　（在 θ*<sub>A</sub> 处计算）",
        "symbols": [
          {
            "sym": "F",
            "desc": "参数 θ_i 的重要性：对数似然梯度的平方期望，等价于损失曲率的平均；越大越要保护。"
          },
          {
            "sym": "θ",
            "desc": "网络参数；θ* 是任务 A 的最优解。"
          },
          {
            "sym": "log",
            "desc": "对数似然（≈ 负损失）。"
          },
          {
            "sym": "E",
            "desc": "对数据样本求期望；实践中用小批量平均近似。"
          },
          {
            "sym": "∂",
            "desc": "偏导数：只对第 i 个参数求导。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "定义落地",
          "desc": "F_i = 梯度平方的期望：梯度越大说明权重越被依赖，在旧解处算，一阶即可。"
        },
        {
          "icon": "🔧",
          "title": "采样估计",
          "desc": "用小批量平均近似期望；论文 Atari 用 100 个批量。"
        },
        {
          "icon": "✨",
          "title": "只用对角",
          "desc": "丢弃协方差换线性开销，同时带来低估不确定性的局限（§9 展开）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "机制全景：弹性锚定下的权重",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "单个概念都清楚了，本节俯瞰全局：把整个网络的权重看成一张弹簧地图。",
      "analogy": {
        "title": "检查每一颗岩钉",
        "text": "EWC 对<b>每个权重</b>都挂了一根弹簧——刚度不同，<b>训练时谁动谁不动</b>一目了然。",
        "componentId": "ch8-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "权重弹簧地图：点击任意权重",
          "desc": "点击 8×8 权重矩阵的任意格，查看它的 Fisher 刚度与训练任务 B 后的位移对比（位移数值为方向性示意）。",
          "componentId": "ch8-mod1"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "权重地图",
          "desc": "每个权重一根弹簧（锚点 θ*_A,i、刚度 F_i）。"
        },
        {
          "icon": "🔧",
          "title": "训练分工",
          "desc": "高 F 权重原地不动守旧任务，低 F 权重自由更新学新任务。"
        },
        {
          "icon": "✨",
          "title": "可扩展性",
          "desc": "弹簧逐权重独立，代价与参数数线性。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "实践细节与诊断",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "方法能用，还要知道它何时可靠。本节用两个诊断实验检验 Fisher 估计的质量。",
      "analogy": {
        "title": "检查锚点，拧紧松动的",
        "text": "上线之前要<b>检查保护</b>：Fisher 估计也一样，需要<b>诊断</b>它到底准不准。",
        "componentId": "ch9-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "Fisher 重叠度：任务在共享还是在分家",
          "desc": "切换任务相似度，观察两个任务 Fisher 重叠度随网络深度的变化（对应论文 Figure 2C）。",
          "componentId": "ch9-mod1"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "扰动实验：哪种方向的噪声最伤性能",
          "desc": "拖动扰动强度，比较三种扰动方向下游戏得分的变化（对应论文 Figure 3C）。",
          "componentId": "ch9-mod2"
        }
      ],
      "insight": "容量分配清楚了，还得问一句：<b>Fisher 这张“重要性地图”本身可信吗？</b>下一模块用扰动实验来检验。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "共享诊断",
          "desc": "Fisher 重叠度揭示任务是共享权重还是划分权重。"
        },
        {
          "icon": "🔧",
          "title": "分层现象",
          "desc": "任务差异大时浅层分化、输出层共享。"
        },
        {
          "icon": "✨",
          "title": "已知局限",
          "desc": "对角 + 点估计低估不确定性——论文建议探索贝叶斯神经网络。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、局限与启示",
      "badge": "both",
      "badgeLabel": "通用",
      "bridge": "最后一节汇总论文的验证结果、诚实面对局限，并回到神经科学的闭环。",
      "analogy": {
        "title": "一场同路线的较量",
        "text": "同样的路线，<b>没有保护</b>的在关键点脱落，<b>有锚点保护</b>的稳稳登顶。",
        "componentId": "ch10-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "结果赛跑：谁守住了旧任务",
          "desc": "点「开始对比」，看三种做法在排列 MNIST 上守住旧任务的能力（论文定性关系的方向性示意；随机水平 10% 是 10 类分类的数学事实）。",
          "componentId": "ch10-mod1"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "Atari 总分：一个网络学十个游戏",
          "desc": "切换指标视图，对比 Atari 总分（上限 10）与排列 MNIST 表现，并标出独立网络上限与已知局限（数值为方向性示意；排列 MNIST 中任务明确分段，Atari 中任务标签由论文的任务识别模块推断）。",
          "componentId": "ch10-mod2"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两大验证",
          "desc": "排列 MNIST 与 Atari 都证明 EWC 防遗忘有效且可扩展。"
        },
        {
          "icon": "🔧",
          "title": "诚实局限",
          "desc": "达不到独立网络上限；对角 + 点估计低估参数不确定性。"
        },
        {
          "icon": "✨",
          "title": "闭环启示",
          "desc": "神经科学（突触巩固）启发了 EWC，EWC 又反哺对大脑记忆的理解。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1vNe46WE5s",
      "title": "【PNAS 2017】🥇EWC：弹性权重巩固，让神经网络在序贯学习中不再遗忘",
      "reason": "论文专项讲解，与本文直接对应",
      "cover": "https://i1.hdslb.com/bfs/archive/1d39f70feb58c57dc33c7fdaf276377f36587c35.png",
      "views": "391播放"
    },
    {
      "bvid": "BV1ws4y1z7Rp",
      "title": "【专题10】实验展示：弹性权重合并减轻灾难性遗忘 EWC 训练过程",
      "reason": "EWC 训练过程可视化演示",
      "cover": "https://i0.hdslb.com/bfs/archive/130b67b0c64ee244038805c9b758b2f397a30ee7.jpg",
      "views": "2030播放"
    },
    {
      "bvid": "BV17pb76pEuR",
      "title": "【持续学习】三种技术路线：经验回放、EWC 与渐进式网络（LoRA adapter）",
      "reason": "持续学习方法横向对比视角",
      "cover": "https://i0.hdslb.com/bfs/archive/faea4e94ebd664f6a7e15fff357cebf3aa127b08.png",
      "views": "633播放"
    }
  ]
};
