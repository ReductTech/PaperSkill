import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'SVDQuant: Absorbing Outliers by Low-Rank Components for 4-bit Diffusion Models',
    titleZh: 'SVDQuant：用低秩分支吸收离群值，实现 4-bit 扩散模型量化',
    venue: 'ICLR 2025 (Spotlight)',
    authors: 'Muyang Li, Yujun Lin, Zhekai Zhang, Tianle Cai, Xiuyu Li, Junxian Guo, Enze Xie, Chenlin Meng, Jun-Yan Zhu, Song Han',
    affiliation: 'MIT / Princeton / UC Berkeley / SJTU / NVIDIA / CMU / Pika Labs',
    domain: '扩散模型 · 量化 · 低秩分解 · 系统',
    coreProblem:
      '扩散模型计算密集，只量化权重（NF4 W4A16）拿不到原生低比特吞吐，必须 W4A4；但 4-bit 下权重和激活两侧都有离群值，直接量化崩溃，平滑只是零和迁移、不够。',
    coreInsight:
      '先平滑把激活离群值搬到权重侧，再用 16-bit SVD 低秩分支吸收权重侧被放大的离群值，残差用 GPTQ 做二阶补偿量化；Nunchaku 引擎融合低秩与低比特 kernel，把低秩分支开销从约 50% 压到 5–10%。',
    keywords: ['扩散模型', 'W4A4 量化', '低秩分解', 'kernel 融合'],
  },
  hero: {
    oldMethod: {
      desc: '直接 4-bit：权重和激活的离群值一起拉爆量化刻度，正常值被挤进 0 附近的桶，图像质量崩溃。',
      componentId: 'fp32-bar',
    },
    newMethod: {
      desc: 'SVDQuant：16-bit 低秩分支吸收离群值，残差 4-bit 均匀分布，图像质量几乎无损。',
      componentId: 'int4-bar',
    },
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '四比特量化为什么这么难',
      badge: 'inf',
      badgeLabel: '问题引入',
      bridge: '扩散模型要部署到端侧，必须同时压缩权重和激活。但把两者都压到 4 bit 时，离群值会先毁掉精度。',
      analogy: {
        title: '一个超大的数，毁掉整张量化表',
        text: '对称 INT4 的步长由最大绝对值决定：s = max|Z| / 7。只要有一个离群值，步长就被它拉大，其余正常值全被挤进 0 附近的桶。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '位数的代价',
          desc: '拖动滑块改变位宽：对扩散模型，4-bit 的误差尤其明显，因为权重和激活两侧都布满离群值。',
          componentId: 'bit-slider',
        },
      ],
      insight: '想让 4-bit 不崩溃，必须先解决离群值——要么摊平它，要么把它单独拎出去。',
      formula: {
        lead: '对称 INT4 的量化刻度由一组数值的最大绝对值决定。',
        unicode: 's = max|Z| / 7，&nbsp; Q(Z) = s · round(Z/s)',
        symbols: [
          { sym: 'Z', desc: '一组待量化的数值（激活或权重）。' },
          { sym: 's', desc: '量化步长（scale），由最大值决定。' },
          { sym: 'Q(Z)', desc: '反量化后的近似值。' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '计算密集', desc: '扩散模型要做 W4A4 才能拿到原生低比特吞吐。' },
        { icon: '💥', title: '双侧离群值', desc: '权重和激活同时有极端值，比 LLM 更难。' },
        { icon: '✨', title: '拎出去', desc: 'SVDQuant 的思路是把离群值单独拎出去。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '离群值藏在哪：少数固定通道',
      badge: 'inf',
      badgeLabel: '基础概念',
      bridge: '要把离群值拎出去，得先知道它藏在哪。答案不是随机散布，而是集中在少数几个固定通道——这为「单独处理少数方向」提供了前提。',
      analogy: {
        title: '不是随机散布，而是固定在少数通道',
        text: '离群值集中在少数几个固定通道，其余通道都很正常，因此可以用低秩分支精准命中那几个方向。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '离群值的影响',
          desc: '切换「有离群值 / 已平滑」：离群值拉开量化范围，普通值的精度被牺牲。',
          componentId: 'outlier-toggle',
        },
        {
          kind: 'module',
          id: '2.2',
          title: '平滑把难度迁到权重',
          desc: '切换观察：平滑把激活离群值迁到权重侧，激活更易量化、权重侧交给 SVD 处理。',
          componentId: 'transform-toggle',
        },
      ],
      formula: {
        lead: '平滑是一个不改变输出的坐标变换。',
        unicode: 'X̃ = X·D⁻¹，&nbsp; W̃ = D·W，&nbsp; X̃·W̃ = X·W',
        symbols: [
          { sym: 'D', desc: '作用在输入通道上的可逆对角矩阵 diag(λ)。' },
          { sym: 'X̃', desc: '平滑后的激活（幅度变小）。' },
          { sym: 'W̃', desc: '平滑后的权重（特定列被放大）。' },
        ],
      },
      takeaways: [
        { icon: '📍', title: '集中在少数通道', desc: '激活离群值集中在少数固定通道。' },
        { icon: '🔁', title: '零和迁移', desc: '平滑把激活离群值迁到权重侧，不改变输出。' },
        { icon: '✨', title: '集中是前提', desc: '「集中」是低秩分支能精准命中的前提。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '低秩保护，不是低秩压缩',
      badge: 'inf',
      badgeLabel: '核心洞见',
      bridge: '「把离群值拎出去」听起来像「丢掉它」。但 SVDQuant 没有丢掉任何方向——它只是给最难量化的几个方向配了高精度保护。',
      analogy: {
        title: '撑住方向，而不是丢掉方向',
        text: '低秩压缩是降维近似（丢尾部方向）；SVDQuant 的低秩保护保留所有方向，只把最难量化的少数方向用 16-bit 单独算。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '剪掉 vs 撑住：两种低秩的分野',
          desc: '切换「低秩压缩 / SVDQuant 保护」：压缩丢尾部方向（红叉），保护保留所有方向（尾部 4-bit 残差）。',
          componentId: 'protect-toggle',
        },
      ],
      insight: '低秩分支不是要独自表达整层，而只负责少数「难量化的方向」——这解释了为什么 rank 32 这么小也有效。',
      takeaways: [
        { icon: '✂️', title: '压缩丢方向', desc: '低秩压缩直接丢尾部方向，信息有损。' },
        { icon: '🛡️', title: '保护难方向', desc: '保护分支负责难量化的少数方向，不独自表达整层。' },
        { icon: '✨', title: '小秩也有效', desc: 'rank 32 虽小，但精准命中离群值方向。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '误差只剩残差那一支',
      badge: 'both',
      badgeLabel: '数学框架',
      bridge: '为什么撑住大方向之后，误差就自动只剩残差那一支？这需要一点数学：误差上界把权重和激活的量化误差耦合在一起，低秩分支抵消后，整层误差退化为残差的量化误差。',
      analogy: {
        title: '大方向被拿走，误差只剩残差',
        text: '前 r 个大奇异值被低秩分支拿走后，残差幅度 ‖R‖ = √(Σσᵢ²) 骤降，量化残差的误差自然变小。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '残差更平坦',
          desc: '切换观察：低秩分离后，剩余残差的分布更集中、幅度更小，更适合 4-bit 量化。',
          componentId: 'transform-toggle',
        },
      ],
      formula: {
        lead: '误差上界把权重和激活的量化误差耦合在一起。',
        unicode: '‖XW − Q(X)Q(W)‖ ≤ ‖X‖·‖ΔW‖ + ‖ΔX‖·(‖W‖ + ‖ΔW‖)',
        symbols: [
          { sym: 'ΔW', desc: '权重量化误差（W − Q(W)）。' },
          { sym: 'ΔX', desc: '激活量化误差（X − Q(X)）。' },
          { sym: '‖·‖', desc: 'Frobenius 范数。' },
        ],
      },
      takeaways: [
        { icon: '🔗', title: '误差耦合', desc: '误差上界由权重/激活幅度与各自量化误差耦合决定。' },
        { icon: '📉', title: '退化为残差', desc: '低秩分支抵消后，整层误差退化为残差量化误差。' },
        { icon: '✨', title: '上界是动机', desc: '上界是动机而非精确误差，仍需实验检验。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '平滑强度怎么选',
      badge: 'both',
      badgeLabel: '核心机制',
      bridge: '平滑不是免费的——它把难度从激活搬到权重。搬多少，需要一个旋钮来权衡。',
      analogy: {
        title: '难度在两侧之间零和迁移',
        text: '平滑强度 α 决定多少难度从激活搬到权重：搬太少离群值还在激活侧，搬太多权重侧被放大出新的离群值。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '离群值迁移的权衡',
          desc: '切换观察：平滑把离群值从激活迁到权重，权重侧更难、但交给 SVD 后整体更容易量化。',
          componentId: 'outlier-toggle',
        },
      ],
      formula: {
        lead: '最优 α 是两侧难度的平衡点，逐层用做完 SVD 后的层 MSE 搜索。',
        unicode: 'α* = arg min_α MSE( X̂L₁L₂ + Q(X̂)Q(R) )',
        symbols: [
          { sym: 'α', desc: '平滑强度（约 0.5 为甜点）。' },
          { sym: 'X̂, R', desc: '平滑后的激活与 SVD 残差。' },
          { sym: 'MSE', desc: '层输出均方误差，在校准集上计算。' },
        ],
      },
      takeaways: [
        { icon: '⚖️', title: '零和迁移', desc: '激活好量化了，权重就更难量化。' },
        { icon: '🔍', title: '逐层搜索', desc: 'α 逐层搜索，用 SVD 后的层 MSE 选择。' },
        { icon: '✨', title: '甜点', desc: '最优 α 是两侧平衡的甜点（约 0.5）。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: 'SVD 低秩分解与奇异值谱',
      badge: 'both',
      badgeLabel: '数学框架',
      bridge: 'smoothing 后，Ŵ 的前几个奇异值变得极陡；把前 r 个主导奇异值放进 16-bit 低秩分支，残差 R 的范数大幅缩小。',
      analogy: {
        title: '主成分 + 细节',
        text: '像把一张照片拆成「大轮廓」和「细节纹理」：轮廓保留 16-bit，纹理可以压到 4-bit。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '拖动 rank 看误差如何被分解',
          desc: '拖动 rank 滑块：前 r 个奇异值进 16-bit 低秩分支，尾部进 4-bit 残差，右侧实时显示残差范数。',
          componentId: 'rank-slider',
        },
      ],
      formula: {
        lead: 'Ŵ 分解为低秩分支与残差，残差范数由尾部奇异值决定。',
        unicode: 'Ŵ = L₁L₂ + R，&nbsp; ‖R‖_F = √(Σ_{i>r} σᵢ²)',
        symbols: [
          { sym: 'L₁, L₂', desc: '低秩因子（rank r，16-bit）。' },
          { sym: 'R', desc: '残差（4-bit 量化）。' },
          { sym: 'σᵢ', desc: 'Ŵ 的第 i 个奇异值。' },
        ],
      },
      takeaways: [
        { icon: '🔢', title: 'SVD 最优', desc: 'SVD 给出最小化 ‖R‖F 的最优低秩分解。' },
        { icon: '📉', title: '残差骤降', desc: '前几个主导奇异值移走后残差大幅缩小。' },
        { icon: '🎯', title: 'rank 取 16/32', desc: 'rank 通常取 16 或 32，开销可忽略。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-7',
      title: '残差怎么量化：GPTQ 与迭代',
      badge: 'trn',
      badgeLabel: '方法实现',
      bridge: '残差不是一次 RTN 剪平，而是用 GPTQ 逐层二阶补偿，并迭代更新低秩因子、保留误差最小的候选。',
      analogy: {
        title: '不是一次剪平，而是迭代修正',
        text: '实际流程是 平滑 → SVD → 残差 GPTQ → 迭代更新低秩因子，残差用二阶补偿而非最近舍入。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '7.1',
          title: '离线流水线的四站',
          desc: '逐步走过平滑 → SVD → GPTQ → 迭代四个站点，看残差从 RTN 变成二阶补偿。',
          componentId: 'layer-step',
        },
      ],
      insight: '校准集决定平滑参数与残差量化的适配范围；GPTQ 补偿的是残差、不是原权重。',
      takeaways: [
        { icon: '🧮', title: 'GPTQ 量化残差', desc: '残差用二阶补偿，不是普通最近舍入。' },
        { icon: '🔁', title: '迭代更新', desc: '低秩分支迭代更新，保留误差最小的候选。' },
        { icon: '✨', title: '校准集定范围', desc: '校准集决定平滑参数与残差量化适配范围。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-8',
      title: 'Nunchaku：把两个分支融成一个 kernel',
      badge: 'trn',
      badgeLabel: '系统设计',
      bridge: '低秩分支 FLOPs 只占约 1.5%，但输入输出大张量要重复读写，单独跑慢约 50%。Nunchaku 让两条分支共享输入输出、一次读写。',
      analogy: {
        title: '共享输入输出，砍掉冗余读写',
        text: '把降维+量化（共享输入 X）、升维+4-bit 计算（共享输出 Y）两两融合，低秩分支开销从约 50% 压到 5–10%。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '8.1',
          title: '融合前后延迟对比',
          desc: '点击开始看延迟对比：独立低秩分支带来约 50% 开销，Nunchaku 融合后接近朴素 INT4。',
          componentId: 'quant-race',
        },
      ],
      insight: '融合的本质是共享输入输出大张量，而不是减少 FLOPs；瓶颈从计算转移到访存。',
      takeaways: [
        { icon: '⚡', title: 'FLOPs 小', desc: '低秩分支 FLOPs 只占约 1.5%，延迟开销却约 50%。' },
        { icon: '🔀', title: '瓶颈转移', desc: '瓶颈从「计算」转移到「显存访问」。' },
        { icon: '✨', title: '几乎免费', desc: '融合后低秩分支开销降到约 5–10%。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-9',
      title: 'NVFP4 与 LoRA：新硬件与适配器',
      badge: 'trn',
      badgeLabel: '工程边界',
      bridge: 'SVDQuant 不只支持 INT4。NVFP4 的 group 更细、scale 更细，削弱了平滑「按列集中」的前提；而低秩分支天生是 LoRA，适配器即插即用。',
      analogy: {
        title: '硬件格式进化会稀释算法收益',
        text: 'NVFP4 用 group 16 + 两级 scale，比 INT4 更细，低秩分支收益大幅缩水——INT4 上必备，NVFP4 上要重新权衡。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '9.1',
          title: 'INT4 vs NVFP4 的粒度',
          desc: '切换观察：更细的分组粒度会改变离群值被「钉住」的方式，进而影响低秩分支的收益。',
          componentId: 'transform-toggle',
        },
      ],
      insight: '低秩分支天然是 LoRA：挂 LoRA 时把它融进低秩分支、略增 rank 即可，无需重新量化。',
      takeaways: [
        { icon: '🧬', title: 'NVFP4 更细', desc: 'NVFP4 用 group 16 + 两级 scale，比 INT4 更细。' },
        { icon: '🔌', title: 'LoRA 兼容免费', desc: '低秩分支天然是 LoRA，兼容免费。' },
        { icon: '✨', title: '收益边界', desc: 'INT4 上必备，NVFP4 上要重新权衡。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-10',
      title: '结果、权衡与边界',
      badge: 'both',
      badgeLabel: '结果与局限',
      bridge: '最后看结果。数字很漂亮，但每个加速倍数都要看清分母：3.6× 体积、3.5× 显存实打实；8.7×/10.1× 的大加速包含「消除 CPU 卸载」。',
      analogy: {
        title: '数字漂亮，但要看清分母',
        text: '8.7×/10.1× 包含「消除 CPU 卸载」，与 kernel 本身加速是两回事；甚至朴素 INT4 比融合后还快，Nunchaku 的价值是「接近朴素 INT4」。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '10.1',
          title: '点击开始，看结果对比',
          desc: '点击开始看 SVDQuant 与基线 NF4 W4A16 的结果对比：内存、延迟与质量。',
          componentId: 'quant-race',
        },
      ],
      insight: 'PixArt-Σ 上 ViDiT-Q W4A4 的 FID 崩到 412，SVDQuant INT4 为 19.2、NVFP4 为 16.6 追平 FP16——这是低秩吸收最硬的证据。',
      takeaways: [
        { icon: '🏆', title: '结果实打实', desc: '3.6× 体积、3.5× 显存、3.0×/3.1× 加速。' },
        { icon: '⚖️', title: '接近朴素 INT4', desc: 'Nunchaku 的价值是「接近朴素 INT4」而非超越。' },
        { icon: '🔍', title: '看分母', desc: '8.7×/10.1× 含「消除 CPU 卸载」。' },
      ],
    },
  ],
  bilibili: [
    {
      bvid: 'BV1R79zYGEy1',
      title: 'SVDQuant/Nunchaku：FLUX INT4 量化安装详解与工作流',
      reason: '手把手讲 SVDQuant INT4 量化 FLUX 的落地流程，与本文主题一致。',
      cover: 'https://i2.hdslb.com/bfs/archive/3ec60e319201261c3a03ceb9e6ee8741083b833c.jpg',
    },
    {
      bvid: 'BV11Co8Y5EMS',
      title: 'ComfyUI + SVDQuant 插件安装与测试',
      reason: '从插件视角看 Nunchaku 引擎在 ComfyUI 里的实际加速。',
      cover: 'https://i1.hdslb.com/bfs/archive/a33235fe39f3bade53039ab5882f1f43838c6c02.jpg',
    },
    {
      bvid: 'BV1BTocYjEk5',
      title: 'Nunchaku Windows 安装使用教程',
      reason: '对应推理引擎 Nunchaku，看融合内核怎么部署。',
      cover: 'https://i1.hdslb.com/bfs/archive/86e036a5d944c6ad469eadc85941580bded0563f.jpg',
    },
  ],
};
