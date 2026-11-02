import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "DER: Dynamically Expandable Representation for Class Incremental Learning",
    "titleZh": "DER：类增量学习的动态可扩展表示",
    "venue": "CVPR 2021 · Oral",
    "authors": "Shipeng Yan · Jiangwei Xie · Xuming He",
    "affiliation": "上海科技大学 · 中科院上海微系统所 · 中国科学院大学",
    "domain": "视觉 · 类增量学习",
    "coreProblem": "同一组参数既要装下新类，又要留住旧类，旧类总被挤掉。",
    "coreInsight": "冻结旧提取器，只把新提取器的特征维度拼上去，旧特征就不会被改写。",
    "keywords": [
      "类增量学习",
      "动态扩张",
      "通道掩码",
      "辅助损失",
      "两阶段训练"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "同一套表示：微调 / 蒸馏 / 正则",
      "desc": "新药倒进唯一的抽屉，旧药被挤到最底层。",
      "componentId": "c-der-cover"
    },
    "newMethod": {
      "title": "DER：结构化扩张",
      "desc": "旧屉封存、新屉单开，药材并排摊开再判断。",
      "componentId": "c-der-cover"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "01 · 混装表示的极限",
      "modules": [
        {
          "kind": "module",
          "id": "m1-mix",
          "title": "混装抽屉",
          "desc": "拖动新药涌入量，观察旧药包在同一个抽屉里如何被压到看不见。",
          "componentId": "s1-mixed-drawer"
        },
        {
          "kind": "module",
          "id": "m1-routes",
          "title": "三种既有改法",
          "desc": "点选正则化、蒸馏、结构化三条路线，比较各自要付的代价。",
          "componentId": "s2-three-routes"
        }
      ],
      "scenes": [
        {
          "id": "s1-mixed-drawer",
          "title": "灾难性遗忘：混装表示为何失效",
          "goal": "把所有新药倒进同一个抽屉，看看旧药包是怎么被挤到角落、连标签都看不见的。",
          "summary": "同一组参数同时拟合新旧分布，旧类的可辨识度随新数据涌入而下降。",
          "interaction": "拖动「新药涌入量」滑块，观察旧纸包的位置、标签可辨识度与底部反馈。",
          "next": "既然混装会挤掉旧药，前人都试过哪些改法",
          "notes": "对应论文 p1 §1 与 p2 的稳定性—可塑性论述（E2）：过度可塑导致旧类精度下降，过度稳定妨碍新类适配。本页不给出任何精度数字，只说「难以找回」，因为遗忘是精度下降而非信息被物理删除；类比边界在此。滑块数值为演示刻度，不是论文实验。",
          "componentId": "s1-mixed-drawer",
          "moduleId": "m1-mix"
        },
        {
          "id": "s2-three-routes",
          "title": "三条既有路线与它们各自的代价",
          "goal": "分别换上「改旧屉」「约束输出」「加新屉」三种改法，看清各自要付的代价。",
          "summary": "正则化牺牲可塑性，蒸馏依赖旧数据质量；结构化里 RPSNet 相加特征、CCGN 只冻部分层，旧表示会慢慢退化。",
          "interaction": "点选三张改法卡片，右侧代价条与结论句同步更新。",
          "next": "同族里怎么改进：整体冻结旧屉，只加一格新屉",
          "notes": "对应 p1–3 §1 与 §2 Related Work（E3）。论文把表示学习分为正则化（EWC）、蒸馏（iCaRL/UCIR/PODNet）、结构化（RPSNet/CCGN）三类；§2 Discussion 首句即「Our work is a structure-based method」，本文属于结构化这一族，与 RPSNet/CCGN 的差别在于整体冻结旧表示后再追加新的一段，而不是相加特征或只冻结部分层。代价条是论文论述的定性归纳，不是量化实验。",
          "componentId": "s2-three-routes",
          "moduleId": "m1-routes"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "02 · 冻结旧提取器，增开新提取器",
      "modules": [
        {
          "kind": "module",
          "id": "m2-freeze",
          "title": "冻结旧屉",
          "desc": "开关冻结，对比旧屉内容被改写与原样封存两种后果。",
          "componentId": "s3-freeze-expand"
        },
        {
          "kind": "module",
          "id": "m2-super",
          "title": "超特征拼接",
          "desc": "拖动步骤，观察抽屉数、特征维度与分类器输入如何同步增长。",
          "componentId": "s4-super-feature"
        }
      ],
      "scenes": [
        {
          "id": "s3-freeze-expand",
          "title": "冻结旧提取器：哪些参数不再更新",
          "goal": "扳动开关，看看「冻结」到底冻住了旧屉里的什么，又放开了新屉的什么。",
          "summary": "冻结旧提取器参数与 BatchNorm 统计量，新增提取器用旧权重初始化后独立训练。",
          "interaction": "切换「冻结旧屉」开关，观察旧屉内部、封条与右侧结构图中可训练部分的变化。",
          "next": "冻结之后，新旧特征怎么组合成一个判断",
          "notes": "对应 p3–4 §3.2（E6）：第 t 步冻结 θ_Φt−1 与 BN 统计量，F_t 由 F_{t-1} 初始化以复用旧知识、获得前向迁移。结构图中蓝色锁标表示不可训练，绿色表示可训练。类比边界：封条只是「已冻结」的视觉记号，真实冻结是梯度不回传。",
          "componentId": "s3-freeze-expand",
          "moduleId": "m2-freeze"
        },
        {
          "id": "s4-super-feature",
          "title": "超特征：把所有提取器的输出拼接起来",
          "goal": "把第 1 步到第 4 步的抽屉逐个摆上柜台，看特征维度怎样一段段变长。",
          "summary": "u = [Φ_{t−1}(x), F_t(x)]，拼接后的超特征送入分类器，输入维度随步数线性增长。",
          "interaction": "拖动步骤滑块 t，观察抽屉数、维度条、分类器输入维度与右侧公式结果同步变化。",
          "next": "新加的这一段怎么才学得会区分新旧",
          "notes": "对应 p3 Eq.(1)(2)（E4/E5）：u 是逐维拼接而非相加；分类器对 u 做 softmax，输出维度随类别累积扩展，旧类权重继承、新类权重随机初始化。本页只画结构与拼接顺序，不给具体维度：各段维度由骨干决定，论文未在正文给出每段维数。",
          "componentId": "s4-super-feature",
          "moduleId": "m2-super"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "03 · 辅助损失：让新特征认得新旧",
      "modules": [
        {
          "kind": "module",
          "id": "m3-aux",
          "title": "辅助分类器",
          "desc": "拖动 λa，观察新旧特征簇的分离程度与辅助头输出。",
          "componentId": "s5-aux-loss"
        }
      ],
      "scenes": [
        {
          "id": "s5-aux-loss",
          "title": "辅助分类器：把旧类看成一类来判别",
          "goal": "拧动 λa 旋钮，看新屉里的药材怎样从「和新药混在一起」变成「一眼分得清新旧」。",
          "summary": "辅助头在 |Yt|+1 类上训练（旧类合并为一类），L_ER = L_Ht + λa·L_Ha_t，t=1 时 λa=0。",
          "interaction": "拖动 λa（0–10），观察二维投影与辅助头输出，并用右下 Table 6 核对 λa 的实际影响。",
          "next": "新屉该开多大——按新类难度决定通道数",
          "notes": "对应 p4 Eq.(3)(4)（E8/E9）与附录 B Table 6（E21）。必须强调：辅助分类器只吃新提取器输出 F_t(x)，标签空间是 |Yt|+1，即全部旧类被合并成一个「旧」类；它不承担逐类分类。λa=1 是论文所有实验的默认值（附录 A）。附录 B 显示 λa=0.1/0.5/1/5/10 对应 74.12/74.41/74.64/74.52/73.54，论文结论是「robust to λa」；不要把大 λa 讲成「压过主任务」，λa=10 也只低约 1.1 个点。图为示意投影，不是论文的 t-SNE。",
          "componentId": "s5-aux-loss",
          "moduleId": "m3-aux"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "04 · 按新类难度动态扩张",
      "modules": [
        {
          "kind": "module",
          "id": "m4-mask",
          "title": "通道掩码",
          "desc": "逐格开关或拖动 λs，观察保留通道数、参数量与稀疏损失。",
          "componentId": "s6-mask"
        },
        {
          "kind": "module",
          "id": "m4-anneal",
          "title": "退火与二值化",
          "desc": "拖动 epoch 内的 batch 进度，观察 s、掩码值与梯度补偿系数。",
          "componentId": "s7-anneal"
        },
        {
          "kind": "module",
          "id": "m4-cost",
          "title": "剪枝的代价",
          "desc": "切换步数，比较剪枝前后的参数量与平均准确率。",
          "componentId": "s8-prune-cost"
        }
      ],
      "scenes": [
        {
          "id": "s6-mask",
          "title": "通道掩码：让抽屉只保留用得上的格子",
          "goal": "把新屉的格子该留的留、该撤的撤，看柜子能轻多少，又要冒多大风险。",
          "summary": "f′_l = f_l ⊙ m_l，m_l = σ(s·e_l)；稀疏损失按「用到的权重/全部权重」惩罚冗余。",
          "interaction": "点击任意格子手动开关，或拖动 λs 让推荐保留格数与自动掩码同步变化。",
          "next": "软掩码怎么在训练中变成 0/1",
          "notes": "对应 p4–5 Eq.(5)(6)(10)(11)（E10/E14）。格子是通道的可视化，真实掩码是长度 c_l 的连续向量，训练时为 0–1 软值。本页只演示「逐通道开关」与稀疏损失的比例关系，不给参数量换算：每通道多少参数取决于骨干与层位，页面不编造该系数。λs 在论文中按基准调到参数量与 baseline 可比（附录 A：CIFAR100-B0 取 0.75）。",
          "componentId": "s6-mask",
          "moduleId": "m4-mask"
        },
        {
          "id": "s7-anneal",
          "title": "掩码退火：一个 epoch 内从软到硬",
          "goal": "推着批次进度往前走，看掩码怎样从「都开着」慢慢变硬成 0 或 1。",
          "summary": "epoch 内对 s 线性退火，掩码随 s 增大而二值化，并用梯度补偿消除 s 的尺度影响。",
          "interaction": "拖动 batch 进度游标，观察 s 曲线上的位置、五个通道的掩码值与梯度补偿系数。",
          "next": "剪掉之后，精度到底掉了多少",
          "notes": "对应 p5 Eq.(8)(9)（E12/E13）：s = 1/smax + (smax − 1/smax)(b−1)/(B−1)。退火发生在 epoch 内部（batch 级），不是跨 epoch 的余弦退火，这一点容易讲错。梯度补偿 g′_el = σ(e)[1−σ(e)] / (s·σ(se)[1−σ(se)]) · g_el。图中 smax=100、五个 e_l 为示意取值。",
          "componentId": "s7-anneal",
          "moduleId": "m4-anneal"
        },
        {
          "id": "s8-prune-cost",
          "title": "剪枝的代价：参数量与准确率的对照",
          "goal": "按步数切换，看看柜子轻了一个数量级之后，平均准确率到底掉了多少。",
          "summary": "CIFAR100-B0 上剪枝把推理参数量从 285.6M（50 步）降到 10.15M，平均准确率仅从 72.41% 降到 72.05%。",
          "interaction": "切换 5/10/20/50 步，柱状图与点图同步高亮该步数的剪枝前后对比。",
          "next": "表示学完了，分类器为什么还要单独重训",
          "notes": "对应 p6 Table 1（E16/E19）：Ours(w/o P) 与 Ours 的 #Paras 分别为 33.6/61.6/117.6/285.6 与 2.89/4.96/7.21/10.15（百万），平均准确率 76.80/75.36/74.09/72.41 与 75.55/74.64/73.98/72.05。参数量用对数轴，必须标注 log；准确率轴从 70 起，避免夸大差异。",
          "componentId": "s8-prune-cost",
          "moduleId": "m4-cost"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "05 · 第二阶段：重训分类器",
      "modules": [
        {
          "kind": "module",
          "id": "m5-head",
          "title": "平衡重训与温度",
          "desc": "开关类别平衡采样、拖动温度 δ，观察决策边界的倾斜与温度的作用。",
          "componentId": "s9-balanced-head"
        }
      ],
      "scenes": [
        {
          "id": "s9-balanced-head",
          "title": "第二阶段：把药师清空，按方重考",
          "goal": "先看偏斜的药堆怎么把药师带偏，再用平衡采样和温度把边界拉回来。",
          "summary": "冻结特征后重置分类器权重，从可用数据中做类别平衡采样，用带温度 δ 的交叉熵重训分类头。",
          "interaction": "切换「类别平衡采样」开关、拖动温度 δ（1–10），观察边界倾斜与「尖锐—平滑」指示。",
          "next": "这套做法在三个基准上到底赢多少",
          "notes": "对应 p5 §3.4（E15）与附录 C（E22）：此时特征提取器已冻结，只训练分类头；温度 δ 在 CIFAR-100 取 5，ImageNet 取 1。平衡采样的作用是修正记忆数据带来的类别不平衡。附录 C 的「全旧数据训练分类器」上界为 76.14±0.80%，本文 74.64±0.28%，可说明第二阶段质量接近上界。左图只表示判决边界往哪一侧偏，不是论文决策面的可视化；页面不给出各类概率数值。",
          "componentId": "s9-balanced-head",
          "moduleId": "m5-head"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "06 · 实验设置与基准结果",
      "modules": [
        {
          "kind": "module",
          "id": "m6-protocol",
          "title": "骨干与可比性",
          "desc": "点选方法，比较同一方法在 ResNet-18 与改版 ResNet-32 上的准确率。",
          "componentId": "s10-protocol"
        },
        {
          "kind": "module",
          "id": "m6-cifar",
          "title": "CIFAR-100 两个协议",
          "desc": "切换 B0/B50 与步数，比较各方法的平均增量准确率。",
          "componentId": "s10-cifar"
        },
        {
          "kind": "module",
          "id": "m6-inet",
          "title": "ImageNet-100/1000",
          "desc": "切换数据集与指标，查看平均与末步准确率。",
          "componentId": "s11-imagenet"
        }
      ],
      "scenes": [
        {
          "id": "s10-protocol",
          "title": "实验设置：骨干、复现与可比性",
          "goal": "点选方法，比较同一方法在两种骨干上的差距，看清数字为什么不能跨论文直接比。",
          "summary": "主表用 ResNet-18（11.2M）；改版 ResNet-32 小一个数量级，同一方法普遍低 1–5 个点。",
          "interaction": "点选方法，对比 ResNet-18 与改版 ResNet-32 的平均增量准确率及差值。",
          "next": "在同一骨干下，各方法每个增量步的表现",
          "notes": "对应 p6 Implementation Details 与 p6 Table 1、p12 Table 7（E16）。论文指出多数先前工作使用改版 32 层 ResNet（约 0.46M），认为它太小、会低估方法，因此把基线在与本文相同的类别顺序上以 standard ResNet-18（11.2M）重跑；无代码者按自有实现报告，RPSNet 直接取自原论文——Table 1 中 RPSNet 的参数量为 60.6M（5 步）/56.5M（10 步），与其余 11.2M 不同源。CIFAR100-B0 10 步：iCaRL 65.27→64.04、BiC 68.80→66.15、WA 69.46→67.25、本文 74.64→69.41。因此 Table 1/2/3 只能在同一协议、同一骨干内比较。",
          "componentId": "s10-protocol",
          "moduleId": "m6-protocol"
        },
        {
          "id": "s10-cifar",
          "title": "CIFAR-100：B0 与 B50 上的平均增量准确率",
          "goal": "在两张协议表里来回切换，看看领先是一直保持，还是只在某几步成立。",
          "summary": "B0 50 步 72.05%（WA 64.32%），B50 10 步 72.45%（PODNet 64.04%），步数越多领先越大。",
          "interaction": "切换协议 B0/B50 与步数，柱状图按方法排序并显示均值±标准差。",
          "next": "换到 ImageNet，结论还成立吗",
          "notes": "对应 p6 Table 1 与 p6–7 Table 2（E16/E17）。骨干为 standard ResNet-18（11.2M）；B0 与 B50 是两个不同协议（B0 从 0 类起步、memory 2000 exemplars；B50 从 50 类起步、每类 20 例），绝不能混在一张图里排序。数值为三次运行均值，误差条为标准差；RPSNet 在 20/50 步未报告，故不出现。",
          "componentId": "s10-cifar",
          "moduleId": "m6-cifar"
        },
        {
          "id": "s11-imagenet",
          "title": "ImageNet：平均与末步的差距说明什么",
          "goal": "切换数据集和指标，看看末步准确率为什么比平均更能暴露遗忘。",
          "summary": "ImageNet1000-B0 末步 top-1 58.62%（WA 55.6%）；ImageNet100-B50 末步 top-1 72.06%（TPCIL 66.91%）。",
          "interaction": "切换数据集（100-B0 / 1000-B0 / 100-B50）与指标（top-1/top-5、平均/末步）。",
          "next": "为什么旧类反而越学越准",
          "notes": "对应 p7 Table 3（E18）。论文自述 top-5 增益小于 top-1，原因是 top-5 对轻微错误更宽容、对遗忘不敏感；这是论文的解释，不应反向解读为方法在 top-5 上更弱。缺失的格子不补零、不插值，也不让页面变成空白：ImageNet100-B50 的 top-5 列全为「-」，页面把 top-5 置灰并在原处说明；ImageNet100-B0 的 top-1 只有本文报告，同样按实显示。",
          "componentId": "s11-imagenet",
          "moduleId": "m6-inet"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "07 · 迁移、代价与适用边界",
      "modules": [
        {
          "kind": "module",
          "id": "m7-transfer",
          "title": "BWT 与 FWT",
          "desc": "切换方法，观察后向迁移与前向迁移的正负。",
          "componentId": "s12-transfer"
        },
        {
          "kind": "module",
          "id": "m7-budget",
          "title": "扩张预算",
          "desc": "切换步数，观察提取器个数、平均推理参数量与推理延迟。",
          "componentId": "s13-budget"
        }
      ],
      "scenes": [
        {
          "id": "s12-transfer",
          "title": "后向与前向迁移：旧类为什么反而变准",
          "goal": "把六种方法的迁移值并排看，找出唯一一个两边都为正的。",
          "summary": "在理想决策边界协议下，本文 BWT +1.36%、FWT +1.49%，对比方法多为负迁移。",
          "interaction": "点选方法，BWT/FWT 双向条与数值同步高亮。",
          "next": "柜子越加越大，代价落在哪里",
          "notes": "对应 p8 Table 5 与 Eq.(12)(13)（E20）。BWT/FWT 在「用全部已见数据微调分类器得到理想边界」的协议下计算，目的是排除分类器影响、单看表示质量；正 BWT 表示旧类精度随步数上升，是论文强调的意外发现。不能把该数值与其他论文不同协议下的迁移值直接比较。",
          "componentId": "s12-transfer",
          "moduleId": "m7-transfer"
        },
        {
          "id": "s13-budget",
          "title": "扩张预算：参数、延迟与适用边界",
          "goal": "切换到第 50 步，看看柜子里到底有几个提取器、平均参数量涨到多少、抓药速度有没有变慢。",
          "summary": "参数量随步数增长（5 步 2.89M → 50 步 10.15M），推理延迟 1.07ms 与基线相当，但训练成本与记忆依赖是固有代价。",
          "interaction": "切换 5/10/20/50 步，观察提取器个数、平均推理参数量与推理延迟。",
          "next": "",
          "notes": "对应 p11 附录 D（E23）与 p5–8 的结构性边界（E24）：每步新增一个提取器、剪枝只压缩新增部分、依赖记忆缓冲、top-5 增益小于 top-1。这些是从方法与结果推出的边界，论文没有单列 limitation 小节，讲述时须标注为「可推出的边界」。本页不设「新类难度」旋钮：扩张由学习到的通道掩码按新类复杂度自动决定（§3.3），论文没有对外暴露的难度参数；抽屉按第 t 步真实的提取器个数显示，超过 4 个时用「+N 省略」标注。参数量为 Table 1 的 #Paras，口径是各步推理时参数量的平均。",
          "componentId": "s13-budget",
          "moduleId": "m7-budget"
        }
      ]
    }
  ],
  "thumbnails": {
    "cover": "./thumbnails/cover.jpg",
    "s1-mixed-drawer": "./thumbnails/s1-mixed-drawer.jpg",
    "s2-three-routes": "./thumbnails/s2-three-routes.jpg",
    "s3-freeze-expand": "./thumbnails/s3-freeze-expand.jpg",
    "s10-protocol": "./thumbnails/s10-protocol.jpg",
    "s4-super-feature": "./thumbnails/s4-super-feature.jpg",
    "s5-aux-loss": "./thumbnails/s5-aux-loss.jpg",
    "s6-mask": "./thumbnails/s6-mask.jpg",
    "s7-anneal": "./thumbnails/s7-anneal.jpg",
    "s8-prune-cost": "./thumbnails/s8-prune-cost.jpg",
    "s9-balanced-head": "./thumbnails/s9-balanced-head.jpg",
    "s10-cifar": "./thumbnails/s10-cifar.jpg",
    "s11-imagenet": "./thumbnails/s11-imagenet.jpg",
    "s12-transfer": "./thumbnails/s12-transfer.jpg",
    "s13-budget": "./thumbnails/s13-budget.jpg"
  }
};
