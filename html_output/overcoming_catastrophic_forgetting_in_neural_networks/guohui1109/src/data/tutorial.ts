import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Overcoming catastrophic forgetting in neural networks",
    "titleZh": "神经网络中灾难性遗忘的克服：弹性权重巩固",
    "venue": "arXiv:1612.00796v2 [cs.LG], 25 Jan 2017",
    "authors": "James Kirkpatrick, Razvan Pascanu, Neil Rabinowitz 等",
    "affiliation": "DeepMind；Imperial College London",
    "domain": "持续学习 / 深度强化学习",
    "coreProblem": "网络依次学习多个任务时，为什么会忘掉旧任务，又怎样才能不忘？",
    "coreInsight": "把对旧任务重要的权重用弹簧拴在旧解附近，让不重要的权重去学新任务。",
    "keywords": [
      "灾难性遗忘",
      "弹性权重巩固",
      "Fisher 信息",
      "持续学习"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "顺序训练（无保护）",
      "desc": "学歌 B 时四个推子一起被推动，歌 A 的混音被覆盖。",
      "componentId": "ewc-cover"
    },
    "newMethod": {
      "title": "弹性权重巩固（EWC）",
      "desc": "重要的推子被弹簧拴住，不重要的推子去学歌 B。",
      "componentId": "ewc-cover"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "灾难性遗忘",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "顺序训练覆盖旧权重",
          "desc": "拖动推子让歌 B 达标，观察歌 A 的误差。",
          "componentId": "ewc-forget"
        }
      ],
      "scenes": [
        {
          "id": "chap-1-forget",
          "title": "顺序训练中的灾难性遗忘",
          "goal": "让学习者亲手制造并看到遗忘。",
          "summary": "网络学完任务 A 再学任务 B 时，对 A 重要的权重被改动，A 的表现下降。",
          "interaction": "拖动四个推子，把总电平推到歌 B 的目标线，实时看歌 A 与歌 B 的误差；也可以一键用 SGD 训练歌 B。",
          "next": "有没有办法让改动落在不重要的推子上？",
          "notes": "依据：引言第一页（顺序学习与灾难性遗忘）与 Fig. 2A 中 SGD 曲线。类比边界：调音台只有四个推子，且歌 B 只约束总电平，这是为了让“很多解都能满足新任务”可见的合成玩具；论文的网络有大量参数。",
          "componentId": "ewc-forget",
          "moduleId": "1.1"
        },
        {
          "id": "chap-1-routes",
          "title": "回放巩固与突触巩固",
          "goal": "说明为什么选择“保护重要权重”而不是回放。",
          "summary": "回放要保存所有任务的记忆，数量与任务数成正比；大脑则靠保护重要的突触来保留旧技能。",
          "interaction": "拖动任务数滑块，对比需保存的回放记忆份数与 EWC 的固定开销。",
          "next": "那么“重要”该怎样量化？先看弹簧。",
          "notes": "依据：引言（回放需要的记忆量与任务数成正比；Yang 等 2009 的树突棘证据；Hayashi-Takagi 等 2015 的选择性擦除）；§2 末（两个二次惩罚之和仍是二次惩罚，固定资源）。EWC 只需一个合并惩罚是对任意个二次项之和的直接推论。",
          "componentId": "ewc-routes"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "弹性权重巩固",
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "二次惩罚的弹簧图景",
          "desc": "比较无惩罚、等刚度 L2 与 EWC 在参数空间里的去向。",
          "componentId": "ewc-springs"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "后验的拉普拉斯近似",
          "desc": "曲率、后验宽度与弹簧硬度之间的关系。",
          "componentId": "ewc-laplace"
        },
        {
          "kind": "module",
          "id": "2.3",
          "title": "对角 Fisher 信息",
          "desc": "通过推动推子测出每个权重的重要性。",
          "componentId": "ewc-fisher"
        },
        {
          "kind": "module",
          "id": "2.4",
          "title": "EWC 目标函数与 λ",
          "desc": "自己调混音，对照 EWC 的最小总损失与折中曲线。",
          "componentId": "ewc-workbench"
        },
        {
          "kind": "module",
          "id": "2.5",
          "title": "惩罚合并",
          "desc": "把两个任务的二次惩罚合并为一个。",
          "componentId": "ewc-merge"
        }
      ],
      "scenes": [
        {
          "id": "chap-2-springs",
          "title": "二次惩罚：弹性锚定旧解",
          "goal": "看清约束该落在哪些方向上。",
          "summary": "无惩罚会把重要权重一起推走；等刚度弹簧会把所有权重一起锁死；EWC 只锁重要方向，让不重要的方向去学新任务。",
          "interaction": "选择无惩罚 / L2 / EWC，调节弹簧强度 λ，观察参数点的去向以及两首歌的误差。",
          "next": "弹簧的硬度从哪里来？",
          "notes": "依据：Fig. 1（示意图）与 §2 式 (3)。类比边界：这里用 2 个推子的合成玩具重做示意，L2 的刚度取 EWC 刚度的平均值（演示设定，非论文设定）；颜色按本页语义，不同于原 Fig. 1。",
          "componentId": "ewc-springs",
          "moduleId": "2.1"
        },
        {
          "id": "chap-2-laplace",
          "title": "后验的拉普拉斯近似",
          "goal": "解释为什么惩罚是二次形式，曲率就是弹簧硬度。",
          "summary": "旧任务的后验被近似为高斯分布：曲率越大，分布越窄，对应的弹簧越硬。",
          "interaction": "拖动橙色手柄改变曲率 F，拖动蓝点改变推子位置，观察损失曲线、后验宽度和弹簧势能。",
          "next": "各个推子的 F 怎样测出来？",
          "notes": "依据：§2 式 (1)–(2)（贝叶斯分解）与 Laplace 近似（MacKay 1992）：p(θ|D_A) 近似为以 θ*_A 为均值、对角 Fisher 为精度的高斯。单推子的玩具图为合成演示。",
          "componentId": "ewc-laplace",
          "moduleId": "2.2"
        },
        {
          "id": "chap-2-fisher",
          "title": "对角 Fisher 信息度量重要性",
          "goal": "让学习者自己测出每个权重的重要性。",
          "summary": "Fisher 在极小点附近等价于损失的二阶导，可只用一阶导数计算，且半正定。",
          "interaction": "把每个推子拉离歌 A 的位置，观察 ΔL 随 δ² 增加；F̂ = 2ΔL/δ² 在二次损失下保持不变，测出各推子的曲率。",
          "next": "有了 F，就可以写出完整的目标函数。",
          "notes": "依据：§2 关于 Fisher 的三条性质 (a)(b)(c)。论文正文没有写出 Fisher 公式本体；本页用玩具模型中的二阶导精确演示性质 (a)，真实网络的 F 由一阶梯度估计。注意：对二次损失，ΔL = ½Fδ²，所以 F̂ = 2ΔL/δ² 与推动距离无关；“推多远都一样”是本页要展示的性质，不是按钮造成的。",
          "componentId": "ewc-fisher",
          "moduleId": "2.3"
        },
        {
          "id": "chap-2-workbench",
          "title": "EWC 目标函数与 λ 折中",
          "goal": "把式 (3) 变成可以动手的工作台。",
          "summary": "总损失 = 新任务损失 + 各推子的弹簧势能；λ 在新旧任务之间折中；在合成玩具中，EWC 的折中曲线优于等刚度 L2。",
          "interaction": "拖动推子或点击求解，调节 λ，观察损失分项以及折中曲线上的位置。",
          "next": "如果还有第三首歌呢？",
          "notes": "依据：§2 式 (3)。玩具模型中弹簧项恰好等于 λ 乘以旧任务误差，因此所有最小化结果落在 (ℒ_B, ℒ_A) 的折中曲线上；该曲线是合成演示，不是论文结果。橙点是当前混音，绿圈是当前 λ 的最小总损失点；橙点落到绿圈即达到最优。论文 Fig. 1 是参数空间示意，Fig. 2 是准确率曲线，正文没有 ℒ_A–ℒ_B 折中曲线；L2 曲线用等刚度（F 的均值）代理，不是论文的 L2 baseline。",
          "componentId": "ewc-workbench",
          "moduleId": "2.4"
        },
        {
          "id": "chap-2-merge",
          "title": "多任务惩罚合并为一个二次项",
          "goal": "说明连续学习多个任务不需要为每个任务存一条弹簧。",
          "summary": "两条抛物线之和仍是一条抛物线：刚度相加，中心按刚度加权平均。",
          "interaction": "选择推子，拖动任务 B 的锚点并调节其刚度，观察合并曲线。",
          "next": "先看论文在监督学习上的证据。",
          "notes": "依据：§2 末段（两个二次惩罚之和仍是二次惩罚，可视为单一惩罚）。合并中心与刚度的公式是对该结论的直接代数推导。",
          "componentId": "ewc-merge",
          "moduleId": "2.5"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "监督学习实验",
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "Fisher 重叠",
          "desc": "用论文附录的重叠度量判断两个任务是共享还是分割权重。",
          "componentId": "ewc-overlap"
        }
      ],
      "scenes": [
        {
          "id": "chap-3-mnist",
          "title": "置换 MNIST：EWC、L2 与 SGD",
          "goal": "用原图确认机制：EWC 兼顾新旧任务。",
          "summary": "三个排列任务依次训练时，只有 EWC 同时保住旧任务并学会新任务；任务增多时 EWC 几乎不掉分。",
          "interaction": "切换 Fig. 2A / 2B 的放大视图，对照三条曲线的走向。",
          "next": "EWC 是把网络切成互不相干的块吗？",
          "notes": "依据：§2.1 与 Fig. 2A/2B（置换 MNIST；附录 4.1 的超参数）。图中读数为估计值，论文正文没有给出数值表。注意论文附录 4.1 把 MNIST 图称作 Fig. 3，实为 Fig. 2。",
          "componentId": "ewc-mnist"
        },
        {
          "id": "chap-3-overlap",
          "title": "Fisher 重叠：共享还是分割权重",
          "goal": "判断 EWC 是切分网络还是共享表示。",
          "summary": "重叠为 0 表示两任务用互不相交的权重，为 1 表示完全共用；论文发现任务差异越大，浅层重叠越小，深层重叠更高。",
          "interaction": "拖动任务 B 的 Fisher 柱，实时计算重叠，并与原 Fig. 2C 对照。",
          "next": "再看同一思想在强化学习里的表现。",
          "notes": "依据：§2.1、Fig. 2C 与附录 4.3（单位迹归一化后的 Fréchet 距离，重叠 = 1 − d²）。对角 Fisher 时重叠化简为 Σ√(f̂₁f̂₂)，是本页的代数推论。",
          "componentId": "ewc-overlap",
          "moduleId": "3.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "强化学习实验",
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "累计 20M 帧后启动保护",
          "desc": "安排训练顺序，观察哪些游戏被 EWC 保护。",
          "componentId": "ewc-atari"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "隐马尔可夫任务识别",
          "desc": "由观测推断当前任务，对照 Forget Me Not 的 HMM。",
          "componentId": "ewc-fmn"
        }
      ],
      "scenes": [
        {
          "id": "chap-4-atari",
          "title": "Atari：20M 帧激活 EWC 保护",
          "goal": "说明 EWC 在强化学习中怎样随训练进度生效。",
          "summary": "每款游戏累计训练 20M 帧后，EWC 才开始保护它；受保护的游戏越多，EWC 与无惩罚方法的差距越大。",
          "interaction": "点击游戏行为其训练 10M 帧，观察哪些游戏变成受保护状态，再对照原 Fig. 3B。",
          "next": "没有任务标签时，智能体怎么知道在玩哪个游戏？",
          "notes": "依据：§2.2、Fig. 3A/3B 与附录 4.2。十款游戏名取自 Fig. 3A 纵轴；10M 帧的训练段是玩具设定，真实调度见原图。无惩罚时总归一化得分始终低于 1（正文）。",
          "componentId": "ewc-atari",
          "moduleId": "4.1"
        },
        {
          "id": "chap-4-fmn",
          "title": "隐马尔可夫任务识别",
          "goal": "解释没有任务标签时怎样推断当前游戏。",
          "summary": "把任务看作隐变量 c，用观测的似然与切换概率 α 递推后验，后验最大者即识别出的游戏。",
          "interaction": "切换真实游戏、调节切换概率 α，观察三条后验曲线和识别延迟。",
          "next": "最后看这个方法的局限。",
          "notes": "依据：§2.2 与附录 4.2 的递推式 p(c,t+1)=ΣΓ(c,c′)p(c′,t)。论文用 Dirichlet-多项式在线学习各游戏的生成模型；本页为演示固定了三个类别分布。",
          "componentId": "ewc-fmn",
          "moduleId": "4.2"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "局限与修复",
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "Fisher 扰动实验",
          "desc": "比较三种权重扰动形状对性能的影响。",
          "componentId": "ewc-limits"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "三首歌的连续学习",
          "desc": "在同一块调音台上比较 SGD、L2 与 EWC。",
          "componentId": "ewc-repair"
        }
      ],
      "scenes": [
        {
          "id": "chap-5-limits",
          "title": "Fisher 扰动实验与局限",
          "goal": "指出 Fisher 近似的局限。",
          "summary": "沿逆 Fisher 方向的扰动比均匀扰动更安全；近似零空间扰动理论上应无害，实测却和逆 Fisher 一样掉分，说明 Fisher 估计过于自信。",
          "interaction": "选择扰动形状并调节噪声强度，看玩具模型的预测损失增量，并与原 Fig. 3C 对照。",
          "next": "回到调音台，三首歌连着学一次。",
          "notes": "依据：Fig. 3C 与讨论。论文原文把该讨论中的子图写作 Fig. 4C，应为 Fig. 3C。真正的 Fisher 零空间方向满足 Fv=0，按近似应使输出不变、ΔL=0；本页用最不重要方向（F=0.5）近似零空间，所以玩具预测的增量很小但非零。论文实测中，零空间扰动仍与逆 Fisher 一样掉分。",
          "componentId": "ewc-limits",
          "moduleId": "5.1"
        },
        {
          "id": "chap-5-repair",
          "title": "三任务连续学习中的失败与修复",
          "goal": "把前面的机制合起来，在三首歌上复盘。",
          "summary": "无惩罚会同时覆盖歌 A 和歌 B；等刚度弹簧会学不好新歌；EWC 把旧任务的惩罚合并后仍能兼顾三首歌，但容量并非无限。",
          "interaction": "选择方法与 λ，点击“学下一首”依次学歌 B、歌 C，观察推子和三首歌的误差。",
          "next": "",
          "notes": "依据：§2 式 (3) 与末段（合并惩罚）。三任务的数值全部来自合成玩具模型，不是论文结果；EWC 的效果依赖任务数与 λ，论文也指出它并不能完全达到分别训练各任务的水平。",
          "componentId": "ewc-repair",
          "moduleId": "5.2"
        }
      ]
    }
  ]
};
