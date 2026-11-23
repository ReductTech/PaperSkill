import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Subspace Alignment for CLIP-based Continual Learning via Canonical Correlation Analysis",
    "titleZh": "基于典型相关分析的 CLIP 类增量学习子空间对齐",
    "venue": "CVPR 2026",
    "authors": "Huan Zhang, Shuyu Dong, Yujin Zheng, Dingwen Wang, Shenghua Fan, Fan Lyu",
    "affiliation": "武汉大学 · 华中师范大学 · 巴塞罗那自治大学 CVC",
    "domain": "视觉-语言 · 类增量学习",
    "coreProblem": "CLIP 持续学习时视觉分支比文本分支漂移得快，图文特征越学越对不上。",
    "coreInsight": "只累积跨任务协方差，每完成一个任务解一次闭式 CCA，把两模态投进相关性最大的共享子空间再分类。",
    "keywords": [
      "非对称漂移",
      "典型相关分析",
      "共享子空间",
      "无样本类增量",
      "随机傅里叶投影"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "逐批手动挪版",
      "desc": "每一批都靠手追错位，画版越追越偏，字画重影。",
      "componentId": "reg-cover"
    },
    "newMethod": {
      "title": "CCA 共享子空间",
      "desc": "累积成对特征统计量，每个任务后重算共享网格。",
      "componentId": "reg-cover"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "01 · 非对称漂移",
      "modules": [
        {
          "kind": "module",
          "id": "m-drift",
          "title": "逐批推移的画版与字版",
          "desc": "拖动批次，观察两版落点分开的速度不一样，错位扩大、字画重合度下降。",
          "componentId": "drift-marks"
        }
      ],
      "scenes": [
        {
          "id": "ch1-drift",
          "title": "套印错位：画版走版，字版漂移较小",
          "goal": "拖动批次滑块，看两版落点如何越错越开。",
          "summary": "画版漂移远大于字版，错位随任务累积",
          "interaction": "拖动第 1–10 批滑块，观察十字落点、错位读数与字画重合度",
          "next": "把这种不对称量化为可追踪的曲线",
          "notes": "生活映射：画版=图像编码器（随题材变化，位移大），字版=文本编码器（提示词几乎不变，但仍会小幅移动）。十字中心错位是式(8)“任务内图文对平均 L2 距离”的直观类比，二者不是同一个量：页面用两版中心的位移表示距离趋势，缩放为 0–1 的示意值。论文图 3(a) 报告第 2 个任务起 Δv>Δt，本页数值为示意，不当作论文读数。",
          "componentId": "drift-marks",
          "moduleId": "m-drift"
        },
        {
          "id": "ch1-measure",
          "title": "漂移与距离的度量",
          "goal": "移动任务游标，读出两条漂移曲线与距离、准确率的关系。",
          "summary": "第 2 个任务起 Δv 高于 Δt；距离持续上升，准确率总体下降",
          "interaction": "拖动游标选择任务 t=1–10，两张图同步读出数值",
          "next": "要拉近两版，先得给它们一个共同坐标系",
          "notes": "本页对应式(6)(7)(8)：Δv、Δt 是相邻任务平均特征均值的 L2 变化，dist 是任务内图文对的平均 L2 距离。论文图 3(a) 中第 1 个任务两条曲线同从 0 起步，第 2–10 个任务才是 Δv>Δt；图 3(b) 的距离持续上升，准确率总体下降但在末段略有回升。曲线按此定性形状重绘，读数标注为示意；论文正文没有给出逐任务的精确数值。论文把距离上升与准确率下降表述为相关，而非因果证明。",
          "componentId": "drift-chart"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "02 · 共享子空间",
      "modules": [
        {
          "kind": "module",
          "id": "m-whiten",
          "title": "白化两版的尺度",
          "desc": "拉动两版伸缩，看协方差椭圆如何被白化成同一尺度。",
          "componentId": "whiten-plate"
        },
        {
          "kind": "module",
          "id": "m-axis",
          "title": "寻找典型方向",
          "desc": "转动测量方向，观察两模态投影后的相关系数在何处最大。",
          "componentId": "cca-axis"
        }
      ],
      "scenes": [
        {
          "id": "ch2-whiten",
          "title": "白化：先拉平两版的伸缩",
          "goal": "拖两个伸缩滑块，再点白化，比较椭圆尺度与相关性判读。",
          "summary": "尺度不齐时协方差被伸缩掩盖，白化后可比",
          "interaction": "分别调画版与字版伸缩，点“白化两版”归一到单位方差",
          "next": "在统一尺度上找相关性最大的方向",
          "notes": "对应式(10)(11)：Σxx=UxΛxUx^T，Wx=UxΛx^{-1/2}Ux^T。要点：白化把协方差变成单位阵，因此同时做了缩放与去相关（两版不再同向倾斜）；均值差由中心化处理，CCA 的直接目标是最大化两模态投影后的相关性。实现上论文会对协方差做数值稳定处理（如正则），本页二维演示省略。",
          "componentId": "whiten-plate",
          "moduleId": "m-whiten"
        },
        {
          "id": "ch2-axis",
          "title": "典型方向：相关最强的测量轴",
          "goal": "转动方向轴，让相关系数曲线上的游标移到峰值。",
          "summary": "CCA 寻找使两模态投影最相关的方向",
          "interaction": "拖动橙色方向手柄 0–180°，右侧 ρ(θ) 曲线与读数同步",
          "next": "把这条规则搬到跨任务累积的统计量上",
          "notes": "对应式(3)与式(12)(13)：CCA 最大化 corr(A^T X, B^T Y)，闭式解来自白化后交叉协方差的奇异值分解。本页为二维简化，强行让 A=B=e_θ 以直观展示“方向决定相关”；实际 A、B 各自不同，且高维有多个典型方向。曲线数值为演示数据，不是论文读数。",
          "componentId": "cca-axis",
          "moduleId": "m-axis"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "03 · 累积与截断",
      "modules": [
        {
          "kind": "module",
          "id": "m-accum",
          "title": "跨批累积统计量",
          "desc": "逐批记录成对落点，观察 Σ 增长、投影更新与距离下降。",
          "componentId": "accum-stats"
        },
        {
          "kind": "module",
          "id": "m-energy",
          "title": "能量阈值决定保留几条方向",
          "desc": "切换 η 五档，观察保留方向数、精度与噪声的取舍。",
          "componentId": "energy-cut"
        }
      ],
      "scenes": [
        {
          "id": "ch3-accum",
          "title": "跨任务累积：只记统计量",
          "goal": "点“记下一批”，看样本册、Σ 矩阵、投影维度与距离一起变化。",
          "summary": "Σ 逐批累加，投影随之变好，且不保存样本",
          "interaction": "点“记下一批”推进 1–10 批，或重置回第一批",
          "next": "方向数不必全留，用能量阈值截断",
          "notes": "对应式(9) 的递归协方差更新与式(15)(16) 的投影。示例矩阵为 3×3，真实特征维度 D=512；演示中保留方向数 r 只能取 1–3（受 3×3 矩阵限制），真实 η=0.99 时 r̄≈47.2。距离逐批下降是本页的演示设定，不是论文逐任务数值。强调无样本（exemplar-free）：只留二阶统计量与运行均值，不保存图像或特征库。",
          "componentId": "accum-stats",
          "moduleId": "m-accum"
        },
        {
          "id": "ch3-energy",
          "title": "能量阈值与保留方向数",
          "goal": "在 η 五档间切换，读出 r̄ 与 Last Acc，判断何时收益饱和。",
          "summary": "η=0.99 保留约 47 条方向即达最优",
          "interaction": "点选 η=0.9/0.95/0.99/0.999/1，读 r̄、精度与提示",
          "next": "线性不够时，用随机傅里叶投影补非线性",
          "notes": "对应式(14)：保留累计 ρ² 占比达到 η 的前 r 条方向。五组 r̄ 与 Last 均为论文表 4 真值（CIFAR-100、无 FTT、RFP 宽度 6144），只做离散切换，不插值。要点：超过 0.99 后收益饱和甚至下降，保留过多方向会引入噪声。",
          "componentId": "energy-cut",
          "moduleId": "m-energy"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "04 · 非线性与流程",
      "modules": [
        {
          "kind": "module",
          "id": "m-rfp",
          "title": "随机傅里叶投影补非线性",
          "desc": "调随机频率 σ，看交错的两类在余弦特征下被拉开。",
          "componentId": "rfp-wave"
        },
        {
          "kind": "module",
          "id": "m-flow",
          "title": "一次印程的五个时刻",
          "desc": "点选阶段，确认哪一步更新参数、哪一步只累积统计。",
          "componentId": "flow-stage"
        }
      ],
      "scenes": [
        {
          "id": "ch4-rfp",
          "title": "随机傅里叶投影：把直线换成波纹",
          "goal": "拖动 σ，观察两类在余弦特征下的位置变化。",
          "summary": "RFP 用随机余弦特征近似 RBF 核，补足线性 CCA",
          "interaction": "拖动演示波纹密度 σ=0.2–1.8，右侧点云高度与分离度 d 同步变化",
          "next": "把对齐放回完整的印程里看",
          "notes": "对应式(17)(18)：φ(z)=√(2/D′)cos(Wz+b)，W~N(0,σ^-2 I)、b~U[0,2π]，论文取 D′=6144。RFP 不引入可训练参数，只是把特征抬到高维再做同一套闭式 CCA。σ 决定 W 的采样分布，真正被随机抽取的是 W 与 b；本页的 σ 只调节演示波纹密度。页面显示的是余弦特征下两类的分离度 d（均值差 / 合并标准差），默认参数下两类仍有重叠，不表示已被一条水平线分开；d 也不是论文精度。",
          "componentId": "rfp-wave",
          "moduleId": "m-rfp"
        },
        {
          "id": "ch4-flow",
          "title": "首任务校版、冻结与推理",
          "goal": "点选五个时刻，确认每步更新什么、留下什么。",
          "summary": "只有首任务微调，其余任务只累积统计与解 CCA",
          "interaction": "点长卷上的 1–5 号时刻，右侧显示参数状态、产出与说明",
          "next": "看这套流程在四个基准上的表现",
          "notes": "对应 §4.4 与 Algorithm 1：第 1 个任务用 SGD、lr=1e-6、bs=64、训练 5 epochs；之后冻结的是 CLIP 参数，逐批更新 Σ、再解 CCA，推理用式(19) 的余弦相似度。要点是“冻结止住漂移、代价是后续不再微调 CLIP”，这也是论文自述的局限来源。",
          "componentId": "flow-stage",
          "moduleId": "m-flow"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "05 · 证据",
      "modules": [
        {
          "kind": "module",
          "id": "m-bench",
          "title": "四个基准上的位置",
          "desc": "切换数据集，比较各方法的 Avg 与 Last。",
          "componentId": "bench-dots"
        },
        {
          "kind": "module",
          "id": "m-ablation",
          "title": "组件增益与代价",
          "desc": "勾选 CCA、RFP、FTT，读取消融精度与宽度、阈值、时长。",
          "componentId": "ablation-bars"
        }
      ],
      "scenes": [
        {
          "id": "ch5-main",
          "title": "主结果：四个基准的比较",
          "goal": "切换数据集，读出每个方法的 Avg 与 Last，并找到 CCA-CL 的位置。",
          "summary": "Last 四项最高；ImageNet-R 与 100 的 Avg 由其他方法略胜",
          "interaction": "点四个数据集标签，点图整体切换，右侧给出该数据集的判读",
          "next": "拆开看三个组件各贡献多少",
          "notes": "数值全部取自论文表 1（4 数据集 × 10 任务，CLIP ViT-B/16）。页面只展示 9 个代表方法；表 1 另有 L2P、DualPrompt、CODAPrompt、GCL-B（该表共 13 行，其中 ENGINE 与 GCL-B 在部分数据集缺报）。CCA-CL 的 Last 在四个数据集上均最高（ImageNet-100 与 RAPF 并列 80.2），CIFAR-100 领先次优 3.8%。Avg 只有 CIFAR-100（87.2）与 CUB-200（86.3）最高：ImageNet-R 上 MagMax 87.1 高于 86.8；ImageNet-100 上 CLAP 87.3 与 RAPF 87.5 更高（均用 replay），CCA-CL 为 86.9。论文正文称“除 ImageNet-100 外 Avg 均最高”，与表 1 的 ImageNet-R 行不一致；网页以表 1 为准并说明。",
          "componentId": "bench-dots",
          "moduleId": "m-bench"
        },
        {
          "id": "ch5-ablation",
          "title": "消融、宽度与阈值的取舍",
          "goal": "切换三个组件，观察增益；再读 W 与 η 两条曲线判断折中点。",
          "summary": "CCA +9.8、RFP +4.5、FTT +2.0；W=6144、η=0.99 为折中",
          "interaction": "勾选 CCA/RFP/FTT（关闭 RFP 时会同时取消 FTT，无 CCA 时其余置灰），读柱状与右侧小图",
          "next": "这套对位在什么情况下会失效",
          "notes": "柱状为论文表 2 真值：66.7→76.5→81.0→83.0（CIFAR-100）；表 2 只报告了基线与 CCA、CCA+RFP、CCA+RFP+FTT 三种组合，因此关闭 RFP 时 FTT 置灰并自动取消，关闭 CCA 时其余置灰。中间为表 3：W 从 2048 到 10240，精度 79.7/80.3/81.0/80.6/80.2，显存 3.1–11.9 GB。右侧为表 4 的 η 敏感性。图 4 的 CIFAR-100 总时长：CCA-CL 5.8 分钟、RAPF 13.9 分钟、ENGINE 85.8 分钟、SLCA 79.2 分钟（正文“超过 80 分钟”的说法与图 4 的 SLCA 标注不完全一致，页面按图 4 标注）。",
          "componentId": "ablation-bars",
          "moduleId": "m-ablation"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "06 · 边界",
      "modules": [
        {
          "kind": "module",
          "id": "m-limits",
          "title": "适用边界三问",
          "desc": "切换三种情境，区分论文证据与合理推断。",
          "componentId": "limit-cases"
        }
      ],
      "scenes": [
        {
          "id": "ch6-limits",
          "title": "什么时候这套对位会失效",
          "goal": "切换三种情境，分清哪些有论文数据、哪些只是推断。",
          "summary": "依赖首任务校版；RFP 帮助捕捉非线性；极少任务未被验证",
          "interaction": "点选三张情境卡，右侧显示论文原话与推断标注",
          "next": "",
          "notes": "A 有表 1 的无 FTT 行支撑：CIFAR-100 的 Last 由 83.0% 降到 81.0%（−2.0），Avg 由 87.2% 降到 85.4%（−1.8）；B 有表 2 支撑：在该消融设置下 CCA→CCA+RFP 为 76.5%→81.0%，说明 RFP 可帮助捕捉非线性相关，但不是“必须用 RFP”的普遍结论；C 论文未覆盖（所有实验都是每数据集 10 个任务），属推断。作者在结论中自述仍依赖首任务微调，并把参数高效微调列为未来工作。",
          "componentId": "limit-cases",
          "moduleId": "m-limits"
        }
      ]
    }
  ],
  "thumbnails": {
    "cover": "./thumbnails/cover.png",
    "ch1-drift": "./thumbnails/ch1-drift.png",
    "ch1-measure": "./thumbnails/ch1-measure.png",
    "ch2-whiten": "./thumbnails/ch2-whiten.png",
    "ch2-axis": "./thumbnails/ch2-axis.png",
    "ch3-accum": "./thumbnails/ch3-accum.png",
    "ch3-energy": "./thumbnails/ch3-energy.png",
    "ch4-rfp": "./thumbnails/ch4-rfp.png",
    "ch4-flow": "./thumbnails/ch4-flow.png",
    "ch5-main": "./thumbnails/ch5-main.png",
    "ch5-ablation": "./thumbnails/ch5-ablation.png",
    "ch6-limits": "./thumbnails/ch6-limits.png"
  }
};
