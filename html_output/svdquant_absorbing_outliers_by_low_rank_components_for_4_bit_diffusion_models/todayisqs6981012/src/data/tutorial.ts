import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'SVDQuant: Absorbing Outliers by Low-Rank Components for 4-Bit Diffusion Models',
    titleZh: 'SVDQuant：用低秩分支吸收离群值，实现 4-bit 扩散模型量化',
    venue: 'ICLR 2025 (Spotlight)',
    authors: 'Muyang Li, Yujun Lin, Zhekai Zhang, Tianle Cai, Xiuyu Li, Junxian Guo, Enze Xie, Chenlin Meng, Jun-Yan Zhu, Song Han',
    affiliation: 'MIT Han Lab / Princeton / UC Berkeley / SJTU / NVIDIA / CMU / Pika Labs',
    domain: '扩散模型 · 量化 · 低秩 · 系统',
    coreProblem:
      '扩散模型计算密集，只量化权重拿不到原生低比特吞吐，必须 W4A4；但 4-bit 下权重和激活两侧都有离群值，直接量化崩溃，平滑只是零和迁移不够。',
    coreInsight:
      '先平滑把激活离群值搬到权重侧，再用 16-bit SVD 低秩分支吸收权重侧被放大的离群值，残差用 4-bit 量化；Nunchaku 引擎融合低秩与低比特 kernel，砍掉冗余读写，把低秩分支开销从约 50% 压到 5–10%。',
    keywords: ['扩散模型', 'W4A4 量化', '低秩分解', 'kernel 融合'],
  },
  hero: {
    oldMethod: {
      desc: '传统 4-bit 量化：<b>离群值拉爆刻度</b>，正常值全被挤进 0 附近的桶，图像质量崩溃。',
      componentId: 'hero-old',
    },
    newMethod: {
      desc: 'SVDQuant：<b>低秩分支吸收离群值</b>，残差 4-bit 均匀分布，图像质量保留。',
      componentId: 'hero-new',
    },
    pillars: [
      { index: '01', title: '平滑迁移', desc: 'diag(λ) 把激活离群值搬到权重侧，输出不变。' },
      { index: '02', title: 'SVD 低秩吸收', desc: '16-bit 低秩分支吸收权重侧被放大的离群值。' },
      { index: '03', title: '残差 GPTQ', desc: '残差用二阶补偿量化，不是最近舍入。' },
      { index: '04', title: 'Nunchaku 融合', desc: 'kernel 融合砍掉冗余读写，低秩分支几乎免费。' },
    ],
    metrics: [
      { value: '3.6×', label: 'FLUX.1-12B 模型体积压缩' },
      { value: '3.5×', label: '显存下降' },
      { value: '3.0×', label: 'INT4 加速（RTX 4090，vs NF4 W4A16）' },
    ],
    conditions:
      '报告条件：FLUX.1-12B（DiT），COCO Captions 2024 校准，MJHQ-30K / sDCI 评测；INT4 在 RTX 4090、NVFP4 在 RTX 5090；10.1× 加速含消除 CPU 卸载，并非任意配置都同时达到。',
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '四比特量化为什么这么难',
      badge: 'inf',
      badgeLabel: '入门',
      bridge: '扩散模型要部署到端侧，必须同时压缩权重和激活。但把两者都压到 4 bit 时，离群值会先毁掉精度。',
      analogy: {
        title: '一个超大的数，毁掉整张量化表',
        text: '对称 INT4 的步长由最大绝对值决定：<b>s = max|Z| / 7</b>。只要有一个离群值，步长就被它拉大，其余正常值全被挤进 0 附近的桶。',
        componentId: 'ana-1',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '量化实验台：离群值吃掉分辨率，SVDQuant 拿回来',
          desc: '拖动离群值大小，看 4-bit 步长被拉大、正常值被舍入挤进少数桶；右侧读数实时给出步长、可分辨层级与最大误差。再切换 SVDQuant，看低秩分支以 16-bit 拎走离群值后一切恢复。',
          componentId: 'ch1-bench',
        },
      ],
      insight: '想让 4-bit 量化不崩溃，必须先解决离群值——要么摊平它，要么把它单独拎出去。',
      formula: {
        lead: '对称 INT4 的量化刻度由一组数值的最大绝对值决定。',
        unicode: 's = max|Z| / 7，&nbsp; Q(Z) = s · round(Z/s)',
        symbols: [
          { sym: 'Z', desc: '一组待量化的数值' },
          { sym: 's', desc: '量化步长（scale），由最大值决定' },
          { sym: 'Q(Z)', desc: '反量化后的近似值' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '计算密集', desc: '扩散模型要做 W4A4 才能拿到原生低比特吞吐。' },
        { icon: '🔧', title: '刻度被拉爆', desc: '离群值拉爆量化步长，让正常值挤进 0 附近的桶。' },
        { icon: '✨', title: '拎出去', desc: 'SVDQuant 的思路是「把离群值单独拎出去」，而不是硬量化。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '离群值藏在哪',
      badge: 'inf',
      badgeLabel: '入门',
      bridge: '上一章我们看到离群值会毁掉量化。但要「把它拎出去」，得先知道它藏在哪里。',
      analogy: {
        title: '不是随机散布，而是固定在少数通道',
        text: '离群值<b>集中在少数几个固定通道</b>，其余通道都很正常——这为「单独处理少数方向」提供了前提。',
        componentId: 'ana-2',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '通道实验台：离群值藏在哪几个通道',
          desc: '点击通道柱（或用上/下一个按钮）逐个检查：右侧读数给出该通道幅度、相对均值倍数，以及「含离群 vs 剔除后」的 4-bit 步长对比条。',
          componentId: 'ch2-channels',
        },
      ],
      formula: {
        lead: '平滑是一个不改变输出的坐标变换。',
        unicode: 'X̃ = X·D⁻¹，&nbsp; W̃ = D·W，&nbsp; X̃·W̃ = X·W',
        symbols: [
          { sym: 'D', desc: '作用在输入通道上的可逆对角矩阵 diag(λ)' },
          { sym: 'X̃', desc: '平滑后的激活（幅度变小）' },
          { sym: 'W̃', desc: '平滑后的权重（特定列被放大）' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '集中在少数通道', desc: '激活离群值集中在少数固定通道。' },
        { icon: '🔧', title: '零和迁移', desc: '平滑把激活离群值迁移到权重侧，不改变输出。' },
        { icon: '✨', title: '集中是前提', desc: '「集中」是低秩分支能精准命中的前提。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '低秩保护，不是低秩压缩',
      badge: 'inf',
      badgeLabel: '入门',
      bridge: '「把离群值拎出去」听起来像「丢掉它」。但 SVDQuant 没有丢掉任何方向——它只是给最难量化的几个方向配了高精度保护。',
      analogy: {
        title: '撑住方向，而不是丢掉方向',
        text: '低秩<b>压缩</b>是降维近似（丢尾部方向）；SVDQuant 的低秩<b>保护</b>保留所有方向，只把最难量化的少数方向用高精度单独算。',
        componentId: 'ana-3',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '剪掉 vs 撑住：两种低秩的分野',
          desc: '切换「截断压缩 / SVDQuant 保护」：左侧谱上被丢的方向打红叉、被保留的残差挂绿色虚线框，右侧读数对比能量保留、信息丢失与尾部 4-bit 步长。',
          componentId: 'ch3-protect',
        },
      ],
      takeaways: [
        { icon: '🎯', title: '压缩丢方向', desc: '低秩压缩直接丢尾部方向，低秩保护保留所有方向。' },
        { icon: '🔧', title: '保护难方向', desc: '保护分支负责「难量化的少数方向」，不是独自表达整层。' },
        { icon: '✨', title: '小秩也有效', desc: '这解释了为什么 rank 32 这么小也能有明显作用。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '误差只剩残差那一支',
      badge: 'both',
      badgeLabel: '核心',
      bridge: '现在我们知道要「撑住」大方向。但为什么撑住大方向之后，误差就自动只剩残差那一支？这需要一点数学。',
      analogy: {
        title: '大方向被拿走，误差只剩残差',
        text: '前 r 个大奇异值（平方和很大）被低秩分支拿走后，残差幅度 ‖R‖ = √(Σσᵢ²) 骤降，量化残差的误差自然变小。',
        componentId: 'ana-4',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '拖动秩 cut 线，看误差如何被逐步分解',
          desc: '直接拖动谱线（或滑块）选择秩 r：左侧谱被分成 16-bit 低秩分支与 4-bit 残差，右侧实时分解残差能量、步长改善倍数与 4-bit 量化误差估算。',
          componentId: 'ch4-svd',
        },
      ],
      formula: {
        lead: '误差上界把权重和激活的量化误差耦合在一起。',
        unicode: '‖XW − Q(X)Q(W)‖ ≤ ‖X‖·‖ΔW‖ + ‖ΔX‖·(‖W‖ + ‖ΔW‖)',
        symbols: [
          { sym: 'ΔW', desc: '权重量化误差（W − Q(W)）' },
          { sym: 'ΔX', desc: '激活量化误差（X − Q(X)）' },
          { sym: '‖·‖', desc: 'Frobenius 范数' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '误差耦合', desc: '误差上界由权重/激活的幅度和各自量化误差耦合决定。' },
        { icon: '🔧', title: '退化为残差', desc: '低秩分支抵消后，整层误差退化为残差的量化误差。' },
        { icon: '✨', title: '上界是动机', desc: '上界是动机，不是精确误差——仍需实验检验。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '平滑强度怎么选',
      badge: 'both',
      badgeLabel: '核心',
      bridge: '平滑不是免费的——它把难度从激活搬到权重。搬多少，需要一个旋钮来权衡。',
      analogy: {
        title: '难度在两侧之间零和迁移',
        text: '平滑强度 α 决定<b>多少难度</b>从激活搬到权重：搬太少离群值还在激活侧，搬太多权重侧被放大出新的离群值。',
        componentId: 'ana-5',
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '平滑实验台：拖动 α 找两侧平衡点',
          desc: '拖动平滑强度 α：左侧激活/权重难度条此消彼长，右侧 U 形误差曲线上橙色游标实时移动，并标出 α* = 0.50 甜点；右侧读数同步给出两侧百分比与总误差。',
          componentId: 'ch5-alpha',
        },
      ],
      takeaways: [
        { icon: '🎯', title: '零和迁移', desc: '平滑是零和迁移：激活好量化了，权重就更难量化。' },
        { icon: '🔧', title: '逐层搜索', desc: 'α 逐层搜索，用做完 SVD 后的层 MSE 选择。' },
        { icon: '✨', title: '甜点', desc: '最优 α 是「两侧平衡」的甜点。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '低秩分支为什么单独跑会慢',
      badge: 'inf',
      badgeLabel: '入门',
      bridge: '低秩分支的秩只有 32，计算量小到可以忽略。但它单独跑反而慢——问题出在「搬」而不是「算」。',
      analogy: {
        title: '计算量小，但大张量读写没少',
        text: '低秩分支 FLOPs 只占约 1.5%，但输入输出<b>张量不小</b>——单独跑要重复读写整块激活，延迟开销约 50%。',
        componentId: 'ana-6',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '搬运实验台：逐步数一数大张量被访问几次',
          desc: '用「上一步/下一步」走过朴素执行的 6 步：橙色数据包实时标出当前搬运的大张量，红色标记重复读写；右侧计量表累计 X/r₁/Y 的大访问次数。',
          componentId: 'ch6-memory',
        },
      ],
      takeaways: [
        { icon: '🎯', title: 'FLOPs 小', desc: '低秩分支 FLOPs 只占约 1.5%，但延迟开销约 50%。' },
        { icon: '🔧', title: '瓶颈转移', desc: '瓶颈从「计算」转移到「显存访问」。' },
        { icon: '✨', title: '共享输入输出', desc: '想消除开销，必须让两条分支共享输入输出。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-7',
      title: '残差怎么量化',
      badge: 'trn',
      badgeLabel: '训练',
      bridge: '前面我们把残差量化一笔带过了。实际上残差不是「一次剪平」，而是用 GPTQ 逐层补偿、迭代更新。',
      analogy: {
        title: '不是一次剪平，而是迭代修正',
        text: '实际流程是 <b>平滑 → SVD → 残差 GPTQ → 迭代更新低秩因子</b>，残差用的是二阶补偿，不是最近舍入。',
        componentId: 'ana-7',
      },
      modules: [
        {
          kind: 'module',
          id: '7.1',
          title: '离线流水线实验台：平滑 → SVD → GPTQ → 迭代',
          desc: '逐步点亮流水线的 4 个站点（绿色已完成、橙色进行中），顶部虚线是「α 不理想 → 回到①」的迭代回环；右侧读数展示每个阶段的关键变换（峰值迁移、残差骤降、RTN→GPTQ）。',
          componentId: 'ch7-gptq',
        },
      ],
      takeaways: [
        { icon: '🎯', title: 'GPTQ 量化残差', desc: '残差用 GPTQ 量化，不是普通最近舍入。' },
        { icon: '🔧', title: '迭代更新', desc: '低秩分支迭代更新，保留误差最小的候选。' },
        { icon: '✨', title: '校准集决定范围', desc: '校准集决定平滑参数和残差量化的适配范围。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-8',
      title: 'Nunchaku：把两个分支融成一个 kernel',
      badge: 'trn',
      badgeLabel: '训练',
      bridge: '低秩分支慢在「搬」。Nunchaku 的解法很直接：让两条分支共享输入输出，一次读写。',
      analogy: {
        title: '共享输入输出，砍掉冗余读写',
        text: 'Nunchaku 把<b>降维+量化</b>（共享输入 X）、<b>升维+4-bit 计算</b>（共享输出 Y）两两融合，把低秩分支开销从约 50% 压到 5–10%。',
        componentId: 'ana-8',
      },
      modules: [
        {
          kind: 'module',
          id: '8.1',
          title: '数据流实验台：数一数大张量被读写几次',
          desc: '在「朴素执行 / 融合 A / 融合 A+B」三个视图间切换，绿色分组框显示哪些 kernel 被融合，右侧流量计实时统计 X/Y 大张量的读写次数。',
          componentId: 'ch8-flow',
        },
        {
          kind: 'module',
          id: '8.2',
          title: '延迟从哪来：主计算 vs 额外读写',
          desc: '切换朴素 / 融合，堆叠条补间展开总延迟的三个来源：主分支计算（1×）、低秩 FLOPs（+1.5%）、额外大张量读写（约 50% → 5–10%）。',
          componentId: 'ch8-latency',
        },
      ],
      takeaways: [
        { icon: '🎯', title: '共享大张量', desc: '融合的本质是共享输入输出大张量，不是减少 FLOPs。' },
        { icon: '🔧', title: '两对融合', desc: '降维+量化共享输入，升维+4-bit 计算共享输出。' },
        { icon: '✨', title: '几乎免费', desc: '融合后低秩分支开销从约 50% 降到约 5–10%。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-9',
      title: 'NVFP4 与 LoRA：新硬件与适配器',
      badge: 'trn',
      badgeLabel: '训练',
      bridge: 'SVDQuant 不只支持 INT4。新的 NVFP4 格式更细密，而低秩分支天生是 LoRA——这两点决定了方法的边界。',
      analogy: {
        title: '硬件格式进化会稀释算法收益',
        text: 'NVFP4 的 group 更小（16）、scale 更细，削弱了 smooth 的「按列集中」前提，低秩分支收益大幅缩水——INT4 上必备，NVFP4 上要重新权衡。',
        componentId: 'ana-9',
      },
      modules: [
        {
          kind: 'module',
          id: '9.1',
          title: '分组实验台：INT4 vs NVFP4 的粒度与收益',
          desc: '切换两种格式：数值带上的分组括线和每组 scale 柱实时变化（红色 = 被离群值钉住的组），右侧读数给出组大小、被拖累的正常值个数与低秩收益比例。',
          componentId: 'ch9-nvfp4',
        },
      ],
      takeaways: [
        { icon: '🎯', title: 'NVFP4 更细', desc: 'NVFP4 用 group 16 + 两级 scale，比 INT4 更细。' },
        { icon: '🔧', title: 'LoRA 兼容免费', desc: '低秩分支天然是 LoRA，LoRA 兼容免费。' },
        { icon: '✨', title: '收益边界', desc: '收益边界：INT4 上 SVDQuant 必备，NVFP4 上要重新权衡。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-10',
      title: '结果、权衡与边界',
      badge: 'both',
      badgeLabel: '核心',
      bridge: '最后看结果。数字很漂亮，但每个加速倍数都要看清分母——这是读论文的基本功。',
      analogy: {
        title: '数字漂亮，但要看清分母',
        text: '3.6× 体积、3.5× 显存、3.0× 加速都实打实；但 8.7×/10.1× 的大加速<b>包含「消除 CPU 卸载」</b>，与 kernel 本身加速是两回事。',
        componentId: 'ana-10',
      },
      modules: [
        {
          kind: 'module',
          id: '10.1',
          title: '点击开始，看结果对比',
          desc: '切换指标 tab，点击开始，看 SVDQuant 与基线 NF4 W4A16 从同一 1× 基线跑出（方向 ↑ 越高越好），再展开表格核对原始数字。',
          componentId: 'ch10-race',
        },
      ],
      takeaways: [
        { icon: '🎯', title: '结果实打实', desc: '3.6× 体积、3.5× 显存、3.0×/3.1× 加速，结果实打实。' },
        { icon: '🔧', title: '接近朴素 INT4', desc: '朴素 INT4 其实比融合后还快——Nunchaku 的价值是「接近朴素 INT4」。' },
        { icon: '✨', title: '看分母', desc: '加速倍数要看分母：8.7×/10.1× 含「消除 CPU 卸载」。' },
      ],
    },
  ],
};
