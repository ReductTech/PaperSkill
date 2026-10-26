import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Dark Experience for General Continual Learning: a Strong, Simple Baseline",
    "titleZh": "暗经验回放：面向通用持续学习的简单强基线",
    "venue": "NeurIPS 2020",
    "authors": "Pietro Buzzega · Matteo Boschini · Angelo Porrello · Davide Abati · Simone Calderara",
    "affiliation": "AImageLab · University of Modena and Reggio Emilia",
    "domain": "持续学习 · 回放与蒸馏",
    "coreProblem": "数据持续变化，任务边界不可知：模型如何在有限记忆中学习新知识，同时保留过去的能力？",
    "coreInsight": "用水库采样保存旧输入与训练轨迹上的 logits，以输出匹配保留暗知识；DER++ 再用旧标签纠偏。",
    "keywords": [
      "通用持续学习",
      "暗经验回放",
      "水库采样",
      "logits 匹配",
      "知识蒸馏"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "普通经验回放（ER）保留输入与真实标签。这个教学示意展示：即使标签预测保持相同，非目标类别的得分关系仍可能改变。",
      "componentId": "der-hero-old"
    },
    "newMethod": {
      "desc": "DER 同时保留输入与历史 logits，让当前网络对齐完整旧输出。色阶仅用来比喻类别得分，DER++ 还会回放真实标签。",
      "componentId": "der-hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "从新经验到旧知识：论文究竟解决什么",
      "badge": "both",
      "badgeLabel": "问题与路线",
      "bridge": "先从一次“只学新场景”的尝试开始。看清遗忘如何发生，再理解这篇论文为何强调有限记忆与未知任务边界。",
      "analogy": {
        "title": "换了取景方向，还记得旧照片吗？",
        "text": "相机不断转向新题材；参考底片册帮助摄影师保留过去的判断。本教程用照片作类比，模型真正保存的是输入与历史输出。",
        "componentId": "der-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "拖动取景框：新旧目标为何冲突",
          "desc": "左右拖动橙色取景框，尝试把新损失降到零。观察共享参数改变时，旧损失如何变化；这是教学优化例子。",
          "componentId": "der-c1"
        }
      ],
      "insight": "要在有限资源下保留旧能力，需要让历史经验继续参与今天的更新。",
      "takeaways": [
        {
          "icon": "↻",
          "title": "遗忘源于共享更新",
          "desc": "学习新经验会改变旧经验依赖的同一组模型参数。"
        },
        {
          "icon": "▣",
          "title": "保存少量历史信息",
          "desc": "DER 用原始输入及历史 logits 提供旧输出的一致性目标。"
        },
        {
          "icon": "⌕",
          "title": "先问清实验条件",
          "desc": "无边界、有限记忆与单遍训练是需要分别核对的条件。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "问题定义：任务边界、类别与测试信息",
      "badge": "both",
      "badgeLabel": "设定辨析",
      "bridge": "上一章说明了为什么要保留过去。现在明确算法能看到哪些信息：训练时有没有边界，测试时有没有任务身份，以及记忆预算如何计算。",
      "analogy": {
        "title": "连续调焦，没有提示音宣告换题材",
        "text": "摄影师转动调焦环时，场景变化可能连续发生。没有人为标记的停点，就不能把“任务结束”当作必备操作。",
        "componentId": "der-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "切换设定：同一个分类问题，需要哪些先验",
          "desc": "选择一个学习设定，同时观察候选类别示意和信息表。照片旋转仅表示域变化，不是训练结果。",
          "componentId": "der-c2"
        }
      ],
      "formula": {
        "lead": "模型把输入映射为 logits，再归一化为类别概率；测试是否给任务身份会改变可选类别。",
        "unicode": "hθ(x) ∈ ℝᶜ；fθ(x)ⱼ = exp(hθ(x)ⱼ) / Σₖ exp(hθ(x)ₖ)",
        "symbols": [
          {
            "sym": "x",
            "desc": "输入向量，x ∈ ℝᵈ；图像可视为展平的像素或模型输入张量。"
          },
          {
            "sym": "θ",
            "desc": "模型参数向量，θ ∈ ℝᵖ。"
          },
          {
            "sym": "C",
            "desc": "本文基准中预先固定的输出类别总数。"
          },
          {
            "sym": "hθ(x)",
            "desc": "C 维未归一化类别得分，即 logits。"
          },
          {
            "sym": "fθ(x)",
            "desc": "Softmax 后的 C 维概率向量，各维非负且总和为 1。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "⌁",
          "title": "任务不等于输入",
          "desc": "任务编号可以用于分析与评估，而不必提供给 DER 学习器。"
        },
        {
          "icon": "◉",
          "title": "先知改变难度",
          "desc": "Task-IL 给测试任务身份，Class-IL 必须联合区分已见类别。"
        },
        {
          "icon": "▤",
          "title": "固定容量有条件",
          "desc": "固定条目数在固定输出维度下才对应有界的表示存储。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "暗知识与相关工作：为何保留整个输出",
      "badge": "trn",
      "badgeLabel": "方法定位",
      "bridge": "设定已经清楚：边界可能不可用，缓存必须有限。下一步比较“只保存答案”和“保留完整输出”，再定位 DER 相对旧方法改变了哪里。",
      "analogy": {
        "title": "照片的标题，不等于整张参考底片",
        "text": "放大镜查看照片时，能看到标题没有记下的细节。完整 logits 类似这份更丰富的参考，但历史模型的判断也可能出错。",
        "componentId": "der-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "同样的标签和交叉熵，仍可能丢掉什么？",
          "desc": "点击模拟后续训练，交换两个非目标类别的得分；左右照片色阶和数值表由同一向量状态生成。",
          "componentId": "der-c3"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "逐个比较：回放、蒸馏还是梯度约束？",
          "desc": "切换方法，查看保留的状态、约束位置及论文比较实现的边界依赖。下方完整对照表便于回查。",
          "componentId": "der-c3-extra"
        }
      ],
      "insight": "硬标签只指定正确类别；匹配完整旧输出还能约束非目标类别之间的相对关系。",
      "takeaways": [
        {
          "icon": "≋",
          "title": "暗知识是软关系",
          "desc": "非目标类别的相对得分包含单一真实标签未直接给出的结构。"
        },
        {
          "icon": "↗",
          "title": "与 GEM 的约束不同",
          "desc": "GEM 限制参数更新方向，DER 惩罚旧输入上的输出偏移。"
        },
        {
          "icon": "◷",
          "title": "记录时刻是关键",
          "desc": "DER 沿训练轨迹保存 logits，随后要用固定容量策略选择保留哪些条目。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "固定容量记忆：水库采样如何公平",
      "badge": "trn",
      "badgeLabel": "训练机制",
      "bridge": "知道要保存旧输入及其输出后，下一个问题是：有限缓存应保留谁？这一章解释 DER 如何在不知道任务边界与数据流长度时维护记忆。",
      "analogy": {
        "title": "相册装不下所有底片",
        "text": "把每张新照片放入固定容量的相册，需要决定<strong>保留谁</strong>。水库采样给每个历史到达项相同机会，但不保证每类数量相同。",
        "componentId": "der-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "让 12 张照片经过 3 个槽位",
          "desc": "逐张送入样本，观察“直接填入、替换、丢弃”的分支。固定种子方便重复核对，概率结论由下方归纳证明给出。",
          "componentId": "der-c4"
        }
      ],
      "insight": "无需等到任务结束更新记忆，固定容量的全局水库就能持续运行。",
      "formula": {
        "lead": "容量固定为 K 时，每个历史到达项在第 n 次到达后具有相同保留概率。",
        "unicode": "P(i ∈ M<sub>n</sub>) = min(1, K/n)，1 ≤ i ≤ n",
        "symbols": [
          {
            "sym": "K",
            "desc": "缓存容量，即最多保留的条目数。"
          },
          {
            "sym": "n",
            "desc": "已经到达的样本项数，包含本次。"
          },
          {
            "sym": "i",
            "desc": "任意一个历史到达项的索引。"
          },
          {
            "sym": "M",
            "desc": "经过水库更新后的记忆集合。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🗂️",
          "title": "固定容量",
          "desc": "DER 保存输入与旧 logits，DER++ 再增加真实标签。"
        },
        {
          "icon": "⚖️",
          "title": "均匀的是历史项",
          "desc": "保留概率为 min(1,K/n)，而非类别数量必然平衡。"
        },
        {
          "icon": "🔍",
          "title": "记忆提供了锚点",
          "desc": "下一步要决定如何惩罚当前输出偏离旧锚点。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "数学精读：从蒸馏 KL 到 logits 匹配",
      "badge": "trn",
      "badgeLabel": "训练机制",
      "bridge": "水库解决“保留谁”，现在需要定义“保留什么”。本章从原文式 (1)–(5) 推导 DER 目标，并区分严格等式、近似和作者的设计选择。",
      "analogy": {
        "title": "参考底片不只记录题材",
        "text": "对照参考底片调整曝光，需要保留<strong>完整色阶关系</strong>。这里色阶只比喻类别得分，logits 并不等于照片颜色。",
        "componentId": "der-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "亲自检验 KL 与平方距离",
          "desc": "增大分析温度，再给所有当前 logits 加同一个常数。观察概率是否变化，以及中心化距离和原始 MSE 是否仍然一致。",
          "componentId": "der-c5"
        }
      ],
      "insight": "历史输出匹配保留类别之间的关系，而它与概率蒸馏的联系有明确数学前提。",
      "formula": {
        "lead": "原文式 (5) 使用未归一化 logits 的平方距离；高温 KL 对应的是中心化后的近似。",
        "unicode": "L<sub>DER</sub>(θ) = L<sub>t</sub>(θ) + α 𝔼<sub>(x,z)∼M</sub> ∥hθ(x)−z∥²<br/>τ² KL ≈ ∥P(hθ(x)−z)∥²/(2C)",
        "symbols": [
          {
            "sym": "θ",
            "desc": "当前模型参数向量，属于 ℝᵖ。"
          },
          {
            "sym": "α",
            "desc": "非负旧 logits 保留权重；须与损失归一化配套。"
          },
          {
            "sym": "z",
            "desc": "保存时的、停止梯度的历史 logits，属于 ℝᶜ。"
          },
          {
            "sym": "M",
            "desc": "固定容量水库。"
          },
          {
            "sym": "τ",
            "desc": "高温近似中的正温度；本页用于数学分析。"
          },
          {
            "sym": "P",
            "desc": "中心化矩阵 I−11ᵀ/C，去掉向量的共同偏移。"
          },
          {
            "sym": "C",
            "desc": "固定输出类别数。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📐",
          "title": "逐步推导",
          "desc": "交叉熵、KL 和平方项的梯度均可从定义直接求出。"
        },
        {
          "icon": "🧭",
          "title": "不要删掉条件",
          "desc": "高温 KL 近似中心化平方距离，原始 MSE 还惩罚共同偏移。"
        },
        {
          "icon": "🧪",
          "title": "旧输出可能有错",
          "desc": "保留历史关系之后，还需要讨论怎样纠正历史错误。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "DER++：当旧预测本身有错",
      "badge": "trn",
      "badgeLabel": "训练机制",
      "bridge": "旧 logits 既包含有用关系，也可能携带未收敛的错误。DER++ 在函数匹配之外加入真实标签回放，本章通过一例梯度计算观察两种信号的竞争。",
      "analogy": {
        "title": "底片旁还要有核实的标签",
        "text": "历史参考可能把题材记错。给照片补上经过核实的<strong>真实标签</strong>，既能纠偏，也会要求当前输出偏离原来的参考。",
        "componentId": "der-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "调节标签纠偏的力量",
          "desc": "旧输出把索引 0 排第一，真实标签却是索引 2。调节 β，从相同初始值重算 20 次旧回放更新，观察纠偏与历史偏离如何同时变化。",
          "componentId": "der-c6"
        }
      ],
      "insight": "DER++ 让旧输入同时接受历史输出与真实标签两种约束，权重决定保留与纠偏的取舍。",
      "formula": {
        "lead": "原文式 (6) 在 DER 目标上增加独立采样的旧标签交叉熵；两项旧回放权重均非负。",
        "unicode": "L<sub>DER++</sub> = L<sub>t</sub> + α 𝔼<sub>M</sub>∥hθ(x′)−z′∥² + β 𝔼<sub>M</sub>ℓ(y″,fθ(x″))",
        "symbols": [
          {
            "sym": "α",
            "desc": "旧 logits 匹配权重，控制输出保留。"
          },
          {
            "sym": "β",
            "desc": "真实标签回放权重，可以大于 1；不是概率。"
          },
          {
            "sym": "M",
            "desc": "同时包含 x、z 和 y 的记忆水库。"
          },
          {
            "sym": "x′",
            "desc": "用于历史 logits 匹配的第一批旧输入。"
          },
          {
            "sym": "z′",
            "desc": "与第一批旧输入配对的历史输出。"
          },
          {
            "sym": "x″",
            "desc": "用于旧标签监督的另一批回放输入。"
          },
          {
            "sym": "y″",
            "desc": "第二批回放输入的真实标签。"
          },
          {
            "sym": "ℓ",
            "desc": "监督交叉熵；类别均方的实现归一化另行说明。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🏷️",
          "title": "标签负责纠偏",
          "desc": "旧预测有错时，单纯匹配 logits 可能把错误一起保留。"
        },
        {
          "icon": "🎚️",
          "title": "权重决定取舍",
          "desc": "β 越大并不意味着最终持续学习性能一定更好。"
        },
        {
          "icon": "🛠️",
          "title": "时序必须正确",
          "desc": "接下来核对什么时候采样、更新参数和保存旧目标。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "算法实现：保存时刻、梯度与训练流程",
      "badge": "trn",
      "badgeLabel": "训练机制",
      "bridge": "目标函数已明确，复现时仍可能被保存时刻、梯度方向和损失归一化绊住。本章将输入、状态、更新与输出落成可核对的算法流程。",
      "analogy": {
        "title": "先按快门，再改变设置",
        "text": "先按下快门记录当下参考，再调整相机。DER 同样保存<strong>更新前</strong>产生的输出，而不是更新之后重新计算的结果。",
        "componentId": "der-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "逐步执行一次训练更新",
          "desc": "从空缓存开始逐步前进；开启已有旧记忆后，再比较 DER 与 DER++ 的回放分支。网络是共享的，旧目标停止梯度。",
          "componentId": "der-c7"
        }
      ],
      "insight": "同一个损失写法，只有配合正确的采样、快照与优化器顺序，才对应论文的方法。",
      "formula": {
        "lead": "先捕获当前前向的历史目标，再执行最小化更新，最后将原始输入与快照写入水库。",
        "unicode": "z = stopgrad(hθ(a(x)))；θ ← θ − η ∇θL；M ← reservoir(M,(x,z[,y]))",
        "symbols": [
          {
            "sym": "z",
            "desc": "参数更新前捕获的目标；实现建议 detach().clone()。"
          },
          {
            "sym": "θ",
            "desc": "当前模型参数，优化器更新后改变。"
          },
          {
            "sym": "η",
            "desc": "正学习率，最小化损失时使用负梯度方向。"
          },
          {
            "sym": "L",
            "desc": "当前监督项与适用的旧回放项之和。"
          },
          {
            "sym": "M",
            "desc": "固定容量记忆，逐样本进行水库更新。"
          },
          {
            "sym": "a(x)",
            "desc": "当前输入的随机增强视图。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📸",
          "title": "快照在更新前",
          "desc": "历史目标断开梯度，原始输入在回放时重新增强。"
        },
        {
          "icon": "➖",
          "title": "按最小化实现",
          "desc": "随文代码采用 SGD；不能把印刷伪代码的加梯度直接当作训练方向。"
        },
        {
          "icon": "🧾",
          "title": "复现需要协议",
          "desc": "固定版本、配置、种子与指标；教学演示不等于全规模训练结果。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "理论辨析：正则化到底约束了什么",
      "badge": "both",
      "badgeLabel": "训练与评价",
      "bridge": "前面已经得到可实现的更新规则，但损失项为何有用、证据能支持到哪一步，还需要分清。这里先建立阅读模型分析所需的数学工具，再去看实际实验。",
      "analogy": {
        "title": "先把相机放平，再讨论照片稳定",
        "text": "水平泡偏向一侧，会提醒摄影师还有倾斜。诊断指标也提供线索；一个读数并不能证明所有拍摄条件下都稳定。",
        "componentId": "der-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "亲手区分：扰动、曲率与置信度",
          "desc": "点选图中的指标节点，观察对应数值；这些可计算教学例帮助辨别不同指标测量的对象，不是论文实测曲线。",
          "componentId": "der-c8"
        }
      ],
      "insight": "输出约束可以限制敏感方向，但局部数学解释与经验现象都需要保留成立条件。",
      "formula": {
        "lead": "经验 Fisher 的迹可以由单样本梯度范数计算，不需要显式构造巨大矩阵。",
        "unicode": "F̂ = N⁻¹ ∑ᵢ gᵢgᵢᵀ；Tr(F̂) = N⁻¹ ∑ᵢ ‖gᵢ‖²",
        "symbols": [
          {
            "sym": "N",
            "desc": "用于估计的样本数。"
          },
          {
            "sym": "gᵢ",
            "desc": "第 i 个样本对 p 维模型参数的梯度。"
          },
          {
            "sym": "F̂",
            "desc": "p×p 经验 Fisher 矩阵；一般不等于损失 Hessian。"
          },
          {
            "sym": "Tr",
            "desc": "矩阵对角线之和，即迹。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "◇",
          "title": "约束输出方向",
          "desc": "局部 JᵀJ 二次型解释了为何部分参数移动受到惩罚。"
        },
        {
          "icon": "≠",
          "title": "指标不能互换",
          "desc": "经验 Fisher、Hessian、ECE 与准确率各自回答不同问题。"
        },
        {
          "icon": "↗",
          "title": "带条件读证据",
          "desc": "下一步检查这些诊断在论文的哪些数据与协议中成立。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "实验设计：标准基准与 MNIST-360",
      "badge": "both",
      "badgeLabel": "训练与评价",
      "bridge": "理解了诊断工具，还要知道模型看过多少数据、能用什么信息，才能解释结果。本章把标准任务基准与严格单遍的 MNIST-360 分开，固定比较条件。",
      "analogy": {
        "title": "对象旋转，摄影师仍在连续拍摄",
        "text": "转台上的对象会逐渐改变角度，拍摄对象也可能突然换一个。连续数据流同样可以同时包含平滑变化与突然变化。",
        "componentId": "der-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "切换实验协议，跟随类别与旋转",
          "desc": "选择协议并推进 MNIST-360 类别组合，同时查看输入、训练轮数和内存核算；示意角度不代替论文的逐样本构造。",
          "componentId": "der-c9"
        }
      ],
      "insight": "算法没有任务边界，不意味着用于比较的每一组实验都是单遍、无先知或等字节。",
      "formula": {
        "lead": "分别记录最终任务平均准确率和缓存中的额外 logits 字节数。",
        "unicode": "ACC = T⁻¹ ∑ⱼ Rₜ,ⱼ（t = T）；B_logits = 4KC 字节",
        "symbols": [
          {
            "sym": "T",
            "desc": "标准评价协议中的任务数。"
          },
          {
            "sym": "Rₜ,ⱼ",
            "desc": "完成任务 t 后在任务 j 测试集上的准确率。"
          },
          {
            "sym": "K",
            "desc": "缓存保留的样本容量。"
          },
          {
            "sym": "C",
            "desc": "固定类别数；每个 float32 logits 向量有 C 个元素，每个元素 4 字节。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "◎",
          "title": "协议决定结论",
          "desc": "标准多轮结果与单遍流结果提供不同条件下的证据。"
        },
        {
          "icon": "▣",
          "title": "预算要算字节",
          "desc": "输入、logits、标签和方法固定开销都影响实际资源。"
        },
        {
          "icon": "⌁",
          "title": "评价不只终点",
          "desc": "迁移、校准、时间与最终准确率需要各自明确参照。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、反例与自己的研究问题",
      "badge": "both",
      "badgeLabel": "实验与研究",
      "bridge": "协议已经固定，现在才能比较准确率、解读模型分析，并检查作者结论的范围。最后把原文贡献、可复现步骤与自己的研究设想分别写清。",
      "analogy": {
        "title": "用放大镜检查完成的照片",
        "text": "摄影师逐张检查成片，而不会只挑最好的一张下结论。阅读论文也应同时检查收益、反例与拍摄条件。",
        "componentId": "der-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "MNIST-360：先选容量，再显示真实结果",
          "desc": "显示正文 Table 3 的准确率对照；动画只揭示经过核对的数值，不在浏览器里训练模型。完整表格始终可读。",
          "componentId": "der-c10"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "标准实验、反例与研究延伸",
          "desc": "在同条件对照中切换，先检查结果边界，再解读 Fig. 2、整理十二项精读记录，并设计可被证伪的扩展实验。",
          "componentId": "der-c10-extra"
        }
      ],
      "insight": "强基线的价值来自可比较的实验证据，而不是对所有情形都有效的保证。",
      "takeaways": [
        {
          "icon": "✓",
          "title": "贡献有实证支持",
          "desc": "轨迹 logits 回放在论文多种设定中形成简单而强的基线。"
        },
        {
          "icon": "±",
          "title": "反例也是结论",
          "desc": "DER++ 并非每个预算都最好，均值差也不是显著性证明。"
        },
        {
          "icon": "?",
          "title": "提出可验证问题",
          "desc": "在等字节、真实漂移与标签延迟条件下检验扩展，先核查新颖性。"
        }
      ]
    }
  ]
};
