import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Learning to Learn without Forgetting by Maximizing Transfer and Minimizing Interference",
    "titleZh": "在不遗忘中学会学习：最大化迁移、最小化干扰",
    "venue": "ICLR 2019 · Meta-Experience Replay (MER)",
    "authors": "Matthew Riemer, Ignacio Cases, Robert Ajemian, Miao Liu, Irina Rish, Yuhai Tu, Gerald Tesauro",
    "affiliation": "IBM Research · MIT-IBM Watson AI Lab",
    "domain": "持续学习 · 元学习 · 优化",
    "coreProblem": "神经网络按顺序学习新任务时，为什么会把以前学会的东西忘掉？",
    "coreInsight": "把持续学习看成迁移与干扰的时间对称权衡，用经验回放加上元学习强制梯度对齐，让新知识尽量少破坏旧知识。",
    "keywords": [
      "持续学习",
      "灾难性遗忘",
      "经验回放",
      "元学习",
      "梯度对齐",
      "Reptile"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "只学新任务（在线 SGD）",
      "desc": "每来一个样本就更新一次参数，旧任务很快被覆盖、遗忘。",
      "componentId": "mer-cover"
    },
    "newMethod": {
      "title": "元经验回放 MER",
      "desc": "每次训练都穿插少量旧样本，并做梯度对齐，新旧任务一起保持。",
      "componentId": "mer-cover"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "01 · 问题：任务一个接一个，网络却在遗忘",
      "modules": [
        {
          "kind": "module",
          "id": "m-seq",
          "title": "顺序学习的遗忘过程",
          "desc": "拖动训练进度，观察只学新任务的在线学习如何在旧任务上掉分。",
          "componentId": "mer-sequential"
        }
      ],
      "scenes": [
        {
          "id": "c1-sequential",
          "title": "任务一个接一个，分数一路下滑",
          "goal": "直观看到：顺序学习新任务会让旧任务的表现不断退化。",
          "summary": "在线 SGD 逐样本更新，旧任务被覆盖",
          "interaction": "拖动「训练进度」滑块，观察各任务的准确率曲线如何变化。",
          "next": "用一个统一的指标衡量遗忘",
          "notes": "跑步类比：一个运动员先练短跑再只练耐力，再回到短跑会发现成绩退步。在线学习逐样本做梯度下降，参数不断远离旧任务的最优点，这就是灾难性遗忘。本文 Fig.1 之前大量工作把「旧知识被覆盖」当成核心障碍。",
          "componentId": "mer-sequential",
          "moduleId": "m-seq"
        },
        {
          "id": "c1-metrics",
          "title": "遗忘怎么衡量：RA、LA、BTI",
          "goal": "理解论文用来比较方法的三个指标，尤其是「越负遗忘越重」的 BTI。",
          "summary": "RA=最终保留准确率，BTI=学完到结束的变化",
          "interaction": "阅读三个指标的定义与方向，注意 BTI 为负表示遗忘。",
          "next": "认识迁移与干扰这对概念",
          "notes": "RA（Retained Accuracy）是 20 个任务学完后对所有任务测的最终准确率，越高越好；LA 是每个任务刚学完立刻测的平均准确率；BTI（Backward Transfer and Interference）是每个任务从「刚学完」到「训练结束」的准确率变化，负数表示遗忘。本文以 RA 为主指标。",
          "componentId": "mer-metrics"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "02 · 洞察：迁移与干扰的时间对称权衡",
      "modules": [
        {
          "kind": "module",
          "id": "m-dot",
          "title": "梯度点积：迁移还是干扰",
          "desc": "拖动两个梯度箭头，看它们的点积是正是负、一步更新后另一个样本是好是坏。",
          "componentId": "mer-dot"
        },
        {
          "kind": "module",
          "id": "m-sharing",
          "title": "权重共享的双刃剑",
          "desc": "调整两个任务共享参数的比例，观察迁移与干扰的潜力如何同增同减。",
          "componentId": "mer-sharing"
        }
      ],
      "scenes": [
        {
          "id": "c2-dot",
          "title": "梯度点积决定迁移还是干扰",
          "goal": "用公式 1/2 亲身体会：点积为正时学一个帮另一个，为负时学一个害另一个。",
          "summary": "∂Lᵢ · ∂Lⱼ 的符号就是迁移/干扰",
          "interaction": "拖动两个梯度箭头改变夹角，观察点积符号和「一步 SGD 后样本 j 损失变化」的联动。",
          "next": "看权重共享如何放大这两种潜力",
          "notes": "跑步类比：两个训练动作如果发力方向一致（点积为正），练 A 会让 B 更好；如果方向相反（点积为负），练 A 会破坏 B。论文 Eq.1/2 正是用两个样本损失梯度的点积来操作性定义迁移（>0）与干扰（<0）。",
          "componentId": "mer-dot",
          "moduleId": "m-dot"
        },
        {
          "id": "c2-sharing",
          "title": "权重共享越多，迁移与干扰都越强",
          "goal": "理解为什么「减少共享」能防遗忘却牺牲了未来的迁移能力。",
          "summary": "共享比例决定两种潜力，这是对称视角的关键",
          "interaction": "拖动「共享比例」滑块，观察迁移潜力与干扰潜力两条曲线同步上升。",
          "next": "看看三种旧方法分别怎么取舍",
          "notes": "跑步类比：一套身体（共享的肌肉与习惯）练不同项目，共用越多，一项训练对另一项的影响（好或坏）越大；完全不共用则两者互不影响。论文 Appendix C 论证：参数子集重叠越多，点积可能非零的范围越大，迁移与干扰的潜力同时上升。",
          "componentId": "mer-sharing",
          "moduleId": "m-sharing"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "03 · 旧方法：三种思路都只做了一半",
      "modules": [
        {
          "kind": "module",
          "id": "m-base",
          "title": "EWC / GEM / 回放 怎么救",
          "desc": "在同一个冲突梯度上切换三种旧方法，看它们各自怎么缓解遗忘、又牺牲了什么。",
          "componentId": "mer-baselines"
        }
      ],
      "scenes": [
        {
          "id": "c3-baselines",
          "title": "EWC、GEM、回放各自怎么取舍",
          "goal": "看清三种旧方法都只盯着「向后干扰」，因此都没法兼顾未来的迁移。",
          "summary": "EWC 压参数、GEM 投影梯度、回放补旧样本",
          "interaction": "点选 EWC / GEM / 经验回放，观察它们对同一个冲突梯度分别做了哪种改造。",
          "next": "进入本文的 MER 机制",
          "notes": "EWC 按 Fisher 信息重要度把旧任务重要的参数「钉住」，本质是减少共享；GEM 用一个二次规划把新梯度投影到「不与旧记忆冲突」的方向（Eq.8，g·g_old ≥ 0），是逐样本的临时修正；经验回放靠补旧样本近似平稳分布。三者都只处理向后干扰，没有学到「以后怎么共享参数」，这正是 MER 要补的。",
          "componentId": "mer-baselines",
          "moduleId": "m-base"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "04 · 方法：MER 的三块积木",
      "modules": [
        {
          "kind": "module",
          "id": "m-res",
          "title": "蓄水池采样",
          "desc": "逐个喂入样本，观察有限记忆如何公平地代表过去所有样本。",
          "componentId": "mer-reservoir"
        },
        {
          "kind": "module",
          "id": "m-rep",
          "title": "Reptile 元更新",
          "desc": "在损失地形上走几步再折返，看元更新如何浮现出梯度点积项。",
          "componentId": "mer-reptile"
        },
        {
          "kind": "module",
          "id": "m-alg",
          "title": "MER 一步完整流程",
          "desc": "逐步执行算法 1，把回放、批内与批间元更新串起来。",
          "componentId": "mer-algorithm"
        },
        {
          "kind": "module",
          "id": "m-alpha",
          "title": "对齐强度与有效 s",
          "desc": "调节 γ、β 与批次拆分，观察对齐正则项的权重如何变化。",
          "componentId": "mer-alpha"
        }
      ],
      "scenes": [
        {
          "id": "c4-reservoir",
          "title": "蓄水池采样：有限记忆公平代表过去",
          "goal": "理解为什么 MER 用蓄水池采样而不是「只留最近」，从而近似平稳分布。",
          "summary": "每个已见样本留在记忆中的概率都是 M/N",
          "interaction": "点击「喂入下一个样本」，观察记忆被替换的时机与每个样本的保留概率。",
          "next": "看回放里嵌入的 Reptile 元更新",
          "notes": "跑步类比：一本只能记 5 页的训练日志，用「抽签」决定新动作替换哪一页，让很久以前的训练也有机会留在本子里。蓄水池采样（Algorithm R，Vitter 1985）保证任一已见样本留在记忆中的概率等于 M/N，这是 Eq.5 近似平稳分布、以及 Reptile 的随机性假设在在线设定下成立的关键（App. I）。",
          "componentId": "mer-reservoir",
          "moduleId": "m-res"
        },
        {
          "id": "c4-reptile",
          "title": "Reptile：走几步再折返的元学习",
          "goal": "理解 Reptile 的「先走 k 步、再按总位移折返」如何等价地优化出梯度点积项。",
          "summary": "元更新里自然出现 ∑ᵢ<ⱼ ∇Lᵢ·∇Lⱼ 的对齐项",
          "interaction": "点击「执行一轮」，看参数在损失地形上走 2 步后，元更新把它折返到哪。",
          "next": "把回放和元更新串成 MER",
          "notes": "Reptile 每轮抽 s 个批次、每个批次内走 k 步 SGD，然后 θ ← θ₀ + β(θ_k − θ₀)。Nichol & Schulman 的一阶展开显示，这个元更新近似最小化 ∑ᵢ 2L(Bᵢ) − α∑ᵢ<ⱼ ∇L(Bᵢ)·∇L(Bⱼ)——正是论文想要的「少损失、多对齐」（Eq.6）。",
          "componentId": "mer-reptile",
          "moduleId": "m-rep"
        },
        {
          "id": "c4-algorithm",
          "title": "MER 一步：回放、批内、批间三层更新",
          "goal": "把算法 1 的每一步走通，看清当前样本与记忆样本如何穿插、γ=1 时等价于一次大 Reptile。",
          "summary": "s 个批次 × 每批 k 个样本，批内 β、批间 γ 各一次元更新",
          "interaction": "点击「下一步」逐步执行：采样 → 批内逐样本 SGD → 批内元更新 → 批间元更新 → 更新记忆。",
          "next": "看看 s 和对齐强度怎么影响正则",
          "notes": "算法 1：每个新样本配 s 个批次，每批 = 当前样本 + k−1 个记忆样本；每批内逐样本做 SGD（学习率 α、批大小 1），批内做一次 Reptile 元更新（β），s 个批次后再做一次批间元更新（γ），最后蓄水池更新记忆。γ=1 时与一次大 Reptile 等价（App. I）。",
          "componentId": "mer-algorithm",
          "moduleId": "m-alg"
        },
        {
          "id": "c4-alpha",
          "title": "对齐强度 γ 与有效 s：正则的权重",
          "goal": "理解为什么把固定记忆拆成逐样本长序列能放大对齐正则的权重。",
          "summary": "普通损失权重 ∝ s，对齐正则权重 ∝ s(s−1)/2",
          "interaction": "拖动「有效 s」，观察普通损失项与对齐正则项的权重比例变化。",
          "next": "用论文的实验数据检验它",
          "notes": "Eq.6 中普通损失项权重正比于 s，对齐正则项（梯度点积和）权重正比于 s(s−1)/2。因此在记忆抽取量固定时，把它拆成更长的逐样本序列（增大 s）能显著提高正则相对权重——论文报告这样做始终优于按批次处理。实验中 γ=1、β<1 以降低跨批次高阶项的扰动（App. I）。",
          "componentId": "mer-alpha",
          "moduleId": "m-alpha"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "05 · 证据：它到底有多好",
      "modules": [
        {
          "kind": "module",
          "id": "m-bench",
          "title": "20 任务基准",
          "desc": "在 MNIST 旋转与置换基准上切换缓冲大小，看 MER 相对 GEM 的领先如何拉开。",
          "componentId": "mer-bench"
        },
        {
          "kind": "module",
          "id": "m-stat",
          "title": "越非平稳，优势越大",
          "desc": "切换 Many Permutations / Omniglot，并对比梯度点积从负转正。",
          "componentId": "mer-stationarity"
        }
      ],
      "scenes": [
        {
          "id": "c5-bench",
          "title": "20 任务基准：MER 全面领先",
          "goal": "读懂 Table 1/2：RA 越高越好，且缓冲越小 MER 相对 GEM 的优势越大。",
          "summary": "旋转 89.56 vs 87.58；缓冲 200 时领先约 10 个点",
          "interaction": "切换 MNIST Rotations / Permutations 与缓冲大小 5120 / 500 / 200，观察柱状图与反馈。",
          "next": "看环境更非平稳时会发生什么",
          "notes": "Table 1（20 任务、每任务 1000 样本、记忆 5120）：Rotations 上 MER 的 RA=89.56、GEM=87.58、EWC=57.96、Online=53.38；Permutations 上 MER=85.50、GEM=83.02、EWC=62.32、Online=55.42。Table 2：缓冲 200 时 Rotations 上 MER=77.42 对 GEM=67.38，Permutations 上 MER=73.46 对 GEM=55.42。",
          "componentId": "mer-bench",
          "moduleId": "m-bench"
        },
        {
          "id": "c5-stationarity",
          "title": "环境越非平稳，MER 的优势越大",
          "goal": "从 Many Permutations、Omniglot 和梯度点积表看到：任务越多、样本越少，MER 越突出。",
          "summary": "Omniglot 上 MER 75.23 对 GEM 18.03；点积由负转正",
          "interaction": "切换 Many Permutations / Omniglot，并对比 ER 与 MER 的平均梯度点积。",
          "next": "回到现实，看它的适用边界",
          "notes": "Table 3：Many Permutations（100 任务×200 样本）RA 为 Online 32.62、EWC 33.46、GEM 56.76、MER 62.52；Omniglot（50 字母表）RA 为 Online 4.36、EWC 4.63、GEM 18.03（记忆 500 时 GEM 无法收敛）、MER 75.23。Table 4 的平均梯度点积：ER 在三基准分别为 −0.569/−1.652/−1.280，MER 为 +0.042/+0.017/+0.131。",
          "componentId": "mer-stationarity",
          "moduleId": "m-stat"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "06 · 边界与总结：什么时候该信它",
      "modules": [
        {
          "kind": "module",
          "id": "m-limits",
          "title": "适用边界与改进方向",
          "desc": "点开四张卡片，看清 MER 的假设、隐患与可以改进的地方。",
          "componentId": "mer-limits"
        }
      ],
      "scenes": [
        {
          "id": "c6-limits",
          "title": "什么时候不该用 MER",
          "goal": "形成批判性判断：知道 MER 依赖哪些条件，哪些场景会打折扣。",
          "summary": "依赖存样本与任务相似性；超参搜索更大",
          "interaction": "点开四张场景卡片，逐条看清它的假设、代价与改进方向。",
          "next": "用三句话把方法带走",
          "notes": "① 依赖存储原始样本，隐私/存储受限时不可用（可结合生成式回放或 MoE，作者在 App. B 提到）；② 超参搜索空间比基线大（App. M 用换种子/机器验证了定性结论不变）；③ 迁移泛化依赖任务间存在相似性，剧烈域漂移下收益有限（Sec 6 Q5）；④ 实验集中在小型 MLP/CNN 与简单 RL，未验证大规模模型。这些都是「结论成立的条件」，不应把条件性设计讲成普适结论。",
          "componentId": "mer-limits",
          "moduleId": "m-limits"
        },
        {
          "id": "c6-takeaway",
          "title": "三句话把 MER 带走",
          "goal": "把「问题—洞察—方法」压缩成三条可复述的判断，而不是背公式。",
          "summary": "遗忘=干扰；用回放+对齐同时顾过去和未来；小记忆也够用",
          "interaction": "依次回看三条要点，并对照上一份 EWC 报告的视角差异。",
          "next": "",
          "notes": "三条：① 持续学习不是「新旧二选一」，而是迁移（点积>0）与干扰（点积<0）的时间对称权衡；② MER 用经验回放近似平稳分布、用 Reptile 一阶近似最大化点积，学会「何时共享参数」；③ 小记忆（蓄水池采样）就够，越非平稳优势越大。对比 EWC：EWC 是「减少共享、钉住重要参数」，MER 是「学会何时共享」——从保护过去升级为同时经营未来。",
          "componentId": "mer-takeaway"
        }
      ]
    }
  ]
};
