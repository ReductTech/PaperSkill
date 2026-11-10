import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'SpinQuant: LLM Quantization with Learned Rotations',
    titleZh: 'SpinQuant：用学习到的旋转矩阵做 LLM 量化',
    venue: 'ICLR 2025 · arXiv:2405.16406',
    authors: 'Zechun Liu, Changsheng Zhao, Igor Fedorov, Bilge Soran, Dhruv Choudhary, Raghuraman Krishnamoorthi, Vikas Chandra, Yuandong Tian, Tijmen Blankevoort',
    affiliation: 'Meta AI',
    domain: 'LLM 量化 · 后训练量化 · 旋转矩阵 · 流形优化',
    coreProblem:
      'W4A4KV4 下 outlier 拉爆量化步长：LLaMA-2 7B 直接量化 0-shot 均值只剩 37.1 分（全精度 66.9），GPTQ 也只有 36.8——问题出在激活分布的尖峰。',
    coreInsight:
      '利用旋转不变性，把可学习的正交旋转 R1/R2 插入 LLaMA 块（训练后融合进权重、推理零开销），用 Cayley SGD 在 Stiefel 流形上最小化量化网络的损失；W4A4KV4 下 LLaMA-2 7B 达 64.0 分，距全精度仅 2.9 分。',
    keywords: ['旋转不变性', 'Cayley SGD', 'Stiefel 流形', 'W4A4KV4', '在线 Hadamard'],
  },
  hero: {
    oldMethod: {
      desc: '传统 4-bit 量化：outlier 拉爆步长，正常值全被挤进 0 附近的桶（LLaMA-2 7B W4A4KV4，0-shot 均值）。',
      componentId: 'fp32-bar',
    },
    newMethod: {
      desc: 'SpinQuant：学习旋转摊平 outlier，W4A4KV4 达 64.0 分，距全精度仅 2.9。',
      componentId: 'int4-bar',
    },
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '4-bit 量化为什么会被拉爆',
      badge: 'inf',
      badgeLabel: '问题引入',
      bridge: 'LLM 要部署就得同时压缩权重、激活和 KV 缓存。但把三者的位宽都压到 4 bit 时，激活分布里的 outlier 会第一个毁掉精度——这是全文要解决的问题基线。',
      analogy: {
        title: '一个超大的数，毁掉整张量化表',
        text: '4-bit 只有 8 个刻度。最大值决定步长，一个 outlier 就能把所有正常值挤进同一两个桶。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '位数的代价',
          desc: '拖动滑块改变位宽：位宽越低，对分布友好度的要求越高；4-bit 下 outlier 尤其致命。',
          componentId: 'bit-slider',
        },
        {
          kind: 'module',
          id: '1.2',
          title: '离群值拉爆步长',
          desc: '切换「有离群值 / 已平滑」：outlier 决定量化步长，正常值被挤进 0 附近的桶。',
          componentId: 'outlier-toggle',
        },
      ],
      insight: '想让 4-bit 不崩，必须先处理 outlier——SVDQuant 用低秩分支拎走它，而 SpinQuant 的答案是：把整个分布转平。',
      formula: {
        lead: '对称 INT4 的量化刻度由一组数值的最大绝对值决定。',
        unicode: 's = max|Z| / (2³−1)，&nbsp; Q(Z) = s · round(Z/s)',
        symbols: [
          { sym: 'Z', desc: '一组待量化的数值（激活或权重）。' },
          { sym: 's', desc: '量化步长（scale），由最大绝对值决定。' },
          { sym: 'Q(Z)', desc: '反量化后的近似值。' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '计算密集', desc: 'LLM 要 W4A4KV4 才能拿到原生低比特吞吐与 KV 压缩。' },
        { icon: '💥', title: '刻度被拉爆', desc: 'outlier 决定步长，正常值全被挤扁（66.9 → 37.1 分）。' },
        { icon: '✨', title: '两条路线', desc: '低秩拎走（SVDQuant）或旋转摊平（SpinQuant），本教程讲后者。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '旋转不变性：转一下，输出不变',
      badge: 'inf',
      badgeLabel: '基础概念',
      bridge: '上一章看到 outlier 毁掉 4-bit。SpinQuant 的解法是「把分布转平」——但凭什么网络允许你乱转？这一章给出全文的免费午餐。',
      analogy: {
        title: '转出去，再转回来',
        text: '进注意力前用 R₁ 转出去，进非线性块前用 R₁ᵀ 转回来——全精度网络一个数都不变。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '变换前后对比',
          desc: '切换「变换前 / 变换后」：正交旋转不改变输出，却能把偏斜分布变成更均匀、更好量化的分布。',
          componentId: 'transform-toggle',
        },
      ],
      formula: {
        lead: '旋转激活的同时把权重反旋，乘积不变。',
        unicode: 'Y = X·W = (X·R)(Rᵀ·W)',
        symbols: [
          { sym: 'R', desc: '正交旋转矩阵（RᵀR=I，Rᵀ=R⁻¹）。' },
          { sym: 'X·R', desc: '旋转后的激活。' },
          { sym: 'Rᵀ·W', desc: '反旋后的权重。' },
        ],
      },
      takeaways: [
        { icon: '🔒', title: '数值等价', desc: '任何正交 R 都不改变全精度输出。' },
        { icon: '🔁', title: '成对出现', desc: '激活转出去（X·R），权重反旋（RᵀW）。' },
        { icon: '✨', title: '自由度到手', desc: '「挑一个最好量化的角度」成了优化问题。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '随机旋转：13 分的赌局',
      badge: 'inf',
      badgeLabel: '核心洞见',
      bridge: '旋转合法，但合法不等于平等。抽 100 次随机旋转，最好比最差高 13 分；连 Hadamard 都有 6 分方差：随机抽签不可靠，必须「学习」。',
      analogy: {
        title: '同一个方法，13 分的手气差',
        text: '随机旋转下 W4A4 的 0-shot 均值能差 13 分；连 Hadamard 都有 6 分方差——抽签不可靠。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '抽签实验台',
          desc: '点击开始，对比随机旋转、Hadamard 与 Cayley 优化后的分数离散程度（口径：W4A4 RTN，LLaMA-2 7B，100 次试验，Figure 4）。',
          componentId: 'quant-race',
        },
      ],
      insight: '既然旋转合法又不平等，问题就变成：怎么找到那个最好的旋转？',
      takeaways: [
        { icon: '🎲', title: '方差惊人', desc: '随机 FP 旋转最好最差差 13 分。' },
        { icon: '🧩', title: 'Hadamard 更稳', desc: '仍有 6 分方差，只是「较好的起点」。' },
        { icon: '🎯', title: '必须学习', desc: '与其抽签，不如直接优化旋转矩阵。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: 'Cayley SGD：在正交流形上学习',
      badge: 'trn',
      badgeLabel: '机制',
      bridge: '怎么「学」旋转？普通 SGD 更新几步就滑出正交空间。SpinQuant 把优化约束在 Stiefel 流形上，用 Cayley 变换保证每一步都合法。',
      analogy: {
        title: '每一步都踩在流形上',
        text: 'Cayley 变换保证更新后的矩阵仍然正交（R′ᵀR′=I）——学得动，也转不歪。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '流形优化的每一步',
          desc: '逐步走过「梯度投影 → 构造斜对称矩阵 → Cayley 更新 → 保持正交」四个站点。',
          componentId: 'layer-step',
        },
      ],
      formula: {
        lead: '每步更新用 Cayley 变换生成一个正交矩阵。',
        unicode: 'R′ = R·ΔR(Y)，&nbsp; ΔR(Y) = (I − (α/2)Y)⁻¹(I + (α/2)Y)，&nbsp; Yᵀ = −Y',
        symbols: [
          { sym: 'Y', desc: '由梯度 ∇_R L_Q 投影得到的斜对称矩阵。' },
          { sym: 'α', desc: 'Cayley 更新的步长。' },
          { sym: 'ΔR(Y)', desc: 'Cayley 变换，恒为正交矩阵。' },
        ],
      },
      takeaways: [
        { icon: '🧭', title: '约束即流形', desc: '正交矩阵集合是 Stiefel 流形，优化必须在其上。' },
        { icon: '🔒', title: 'Cayley 保正交', desc: '更新公式从数学上保证 R′ᵀR′=I。' },
        { icon: '⚙️', title: '工程实现', desc: '源码为投影动量 SGD + 每 100 步 QR 重正交化（源码口径）。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: 'R1–R4：四个旋转各管一段',
      badge: 'trn',
      badgeLabel: '机制',
      bridge: '「旋转」落进 LLaMA 块要回答三个问题：放哪里、能不能学、能不能融。SpinQuant 定义了四个旋转位，两种待遇。',
      analogy: {
        title: '四个旋转，两种待遇',
        text: 'R1/R2 能融合进权重还能学习；R3/R4 只能在线跑，固定用 Hadamard。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '四个旋转位',
          desc: '点击芯片切换 R1/R2/R3/R4：查看各自的位置、能否融合、是否学习。',
          componentId: 'round-chips',
        },
      ],
      formula: {
        lead: '旋转矩阵成对地夹住残差流与子层。',
        unicode: 'X·R₁ →(注意力/FFN 前)·R₁ᵀ；&nbsp; V = (X·R₁)·W_v·R₂ᵀ',
        symbols: [
          { sym: 'R₁', desc: '残差捷径旋转（进非线性块前用 R₁ᵀ 转回）。' },
          { sym: 'R₂', desc: 'Wv–Wo 对旋转，按 head_dim 分块作用。' },
        ],
      },
      takeaways: [
        { icon: '🧩', title: '四个位置', desc: 'R1 残差、R2 Wv–Wo、R3 作用于 K、R4 于 MLP。' },
        { icon: '⚖️', title: '两种待遇', desc: 'R1/R2 融合+学习；R3/R4 在线+固定 Hadamard。' },
        { icon: '⚡', title: '更省的在线开销', desc: '每块只需 2 个在线 Hadamard，比 QuaRot 的 4 个更省。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '融合进权重：推理零开销',
      badge: 'trn',
      badgeLabel: '机制',
      bridge: '部署者最关心：学了旋转，推理时要不要多算？把 R 乘进相邻权重后，答案是不要——推理图和原版 LLaMA 完全一样。',
      analogy: {
        title: '把旋转塞进权重里',
        text: '训练完直接把 R 融合进 W，推理时一个额外算子都没有——零开销。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '融合前后输出不变',
          desc: '切换「运行时旋转 / 融合进权重」：输出差恒为 0，融合后推理图与原版一致。',
          componentId: 'transform-toggle',
        },
      ],
      formula: {
        lead: '融合就是把 R 乘进权重，写死在模型文件里。',
        unicode: 'W̃ = Rᵀ·W；&nbsp; X·R·(Rᵀ·W) ≡ X·W',
        symbols: [
          { sym: 'W̃', desc: '融合后的权重（离线替换，量化后写回 checkpoint）。' },
          { sym: 'Rᵀ', desc: '与 X·R 配对的反旋。' },
        ],
      },
      takeaways: [
        { icon: '✅', title: '输出不变', desc: '融合前后数值一致。' },
        { icon: '⚡', title: '零推理开销', desc: '无新参数、无新算子，推理图与原版相同。' },
        { icon: '🤝', title: '与 GPTQ 分工', desc: '旋转管激活、权重误差交给 GPTQ。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-7',
      title: '训练目标与 GPTQ 分工',
      badge: 'trn',
      badgeLabel: '机制',
      bridge: '旋转「学」什么？不是模仿 FP 输出，而是把量化后的网络在校准集上的交叉熵损失压到最低；权重侧误差交给 GPTQ，分工不重叠。',
      analogy: {
        title: '对着量化后的网络练',
        text: '损失直接在量化网络上算（校准集交叉熵），权重冻结——128 条样本、100 步就够。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '7.1',
          title: '离群值被摊平',
          desc: '切换观察：旋转只优化激活侧的离群值，权重侧误差仍可用 GPTQ 继续压。',
          componentId: 'outlier-toggle',
        },
      ],
      formula: {
        lead: '在 Stiefel 流形上找让量化网络损失最小的 R1、R2。',
        unicode: 'min_{R₁,R₂∈M} L_Q( f_quantized(X; R₁, R₂, W_frozen) )',
        symbols: [
          { sym: 'M', desc: 'Stiefel 流形（正交矩阵集合）。' },
          { sym: 'L_Q', desc: '量化网络的任务损失（校准集交叉熵）。' },
          { sym: 'W_frozen', desc: '冻结的预训练权重。' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '直接最小化量化损失', desc: '不是蒸馏 FP 输出，是 Q 在回路的真实损失。' },
        { icon: '💰', title: '便宜', desc: '128 条校准样本、100 步迭代即收敛（附录 A.3）。' },
        { icon: '🤝', title: '分工不重叠', desc: '旋转管激活、GPTQ 管权重，W4A4 下更优（Table 3）。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-8',
      title: '主结果：W4A4KV4 追到 64.0 分',
      badge: 'both',
      badgeLabel: '结果',
      bridge: '收官看真实数据：W4A4KV4 下 LLaMA-2 7B 拿到 64.0 分（FP 66.9，RTN 37.1，GPTQ 36.8，QuaRot 62.5），距全精度仅 2.9。',
      analogy: {
        title: '同一条赛道，两份成绩单',
        text: 'W4A4KV4 拉开 27 分；但 W4A16KV16 下与 QuaRot 几乎打平——学习旋转只在低比特激活时兑现。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '8.1',
          title: '结果竞赛：W4A4KV4 真实成绩',
          desc: '点击开始，看 RTN 37.1、GPTQ 36.8、QuaRot 62.5、SpinQuant 64.0 与 FP 66.9 的对比。',
          componentId: 'quant-race',
        },
      ],
      insight: '旋转只优化激活误差，权重误差交给 GPTQ；W4A16KV16 下与 QuaRot 打平，说明价值在低比特激活下才凸显。',
      takeaways: [
        { icon: '🏆', title: '量级', desc: 'W4A4KV4 LLaMA-2 7B 64.0 分，距 FP 2.9。' },
        { icon: '⚖️', title: '价值边界', desc: 'W4A16KV16 与 QuaRot 打平。' },
        { icon: '🔍', title: '评测警示', desc: '不能只看 WikiText PPL，要加下游任务（第三方复现口径）。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-9',
      title: '消融、速度与机制',
      badge: 'both',
      badgeLabel: '机制',
      bridge: '拆开看谁在出力：学习旋转比随机 Hadamard 高 15.7 分以上；W4A4KV16 下旋转贡献 6.5–20.9 分、GPTQ 再贡献最多 2.3 分；SNR 分析证明「只有量化时才值得学 R」。',
      analogy: {
        title: '拆开看谁在出力',
        text: '旋转是主角、GPTQ 是配角；随机 R 带来 +3.8 dB，学习 R 再 +5.9 dB。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '9.1',
          title: '贡献拆解与机制',
          desc: '逐步走过「校准 → 前向 → 量化 → 损失 → 梯度 → Cayley 更新」六步优化。',
          componentId: 'layer-step',
        },
      ],
      insight: '梯度分析（式 5）：无量化时损失对 R 的梯度为零，量化时非零，由「权重量化差异 + 激活量化差异」两项驱动——这是「只有量化时才值得学 R」的数学依据。',
      takeaways: [
        { icon: '🔍', title: '旋转是主角', desc: '旋转贡献 6.5–20.9 分，GPTQ 再贡献 ≤2.3 分。' },
        { icon: '📶', title: 'SNR 证据', desc: '随机 R +3.8 dB、学习 R +5.9 dB（端到端 6.8 dB）。' },
        { icon: '✨', title: '初始化鲁棒', desc: '随机初始化与 Hadamard 优化后差异很小（Table 4）。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-10',
      title: '四篇拼图与边界',
      badge: 'both',
      badgeLabel: '边界',
      bridge: '把 AdaRound、GPTQ、SmoothQuant、SpinQuant 并排看，各管一段：舍入方向、权重补偿、激活迁移、分布摊平——它们可组合而非互斥。',
      analogy: {
        title: '转与搬的路线之争',
        text: 'SmoothQuant 是「搬」（缩放迁移），SpinQuant 是「转」（旋转摊平），GPTQ 管权重——分工协作。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '10.1',
          title: '结果与边界的回顾',
          desc: '点击开始，回顾四篇方法在「精度 / 开销 / 校准成本」上的定位。',
          componentId: 'quant-race',
        },
      ],
      insight: '旋转引入少量校准开销；4-bit 仍难完全追平 8-bit；第一个 token 的离群值很顽固，旋转后只是被分摊而非消除（附录 C）——旋转不是万能药。',
      takeaways: [
        { icon: '🧩', title: '四块拼图', desc: '舍入 → 权重 → 激活 → 分布。' },
        { icon: '⚖️', title: '显式权衡', desc: 'had 版 +8% 延迟换 W4A4KV4。' },
        { icon: '🔍', title: '诚实边界', desc: '依赖 GPTQ 配套；评测需加下游任务。' },
      ],
    },
  ],
  bilibili: [
    {
      bvid: 'BV1mwpBevE3d',
      title: '【LLM学习记录】浅析SpinQuant',
      reason: '直接讲解 SpinQuant 的旋转量化思路，与本文主题一致。',
      cover: 'https://i0.hdslb.com/bfs/archive/0a71552310bd8d5a437fe6db178bad00068f51fd.jpg',
    },
    {
      bvid: 'BV1J24FedEVQ',
      title: '【LLM学习记录】浅析SmoothQuant',
      reason: '对照 SmoothQuant 的缩放迁移，理解两种离群值处理差异。',
      cover: 'https://i2.hdslb.com/bfs/archive/3405100688a131b5407940476c6d05857ee24598.jpg',
    },
    {
      bvid: 'BV1Rfa3zWEzn',
      title: '大模型最新量化算法 SPIN Quant',
      reason: '偏科普向的 SpinQuant 讲解，适合先建立整体认识。',
      cover: 'https://i0.hdslb.com/bfs/archive/fbaf8c3866e7372efd7b7a47323e38258d40ef48.jpg',
    },
  ],
};
