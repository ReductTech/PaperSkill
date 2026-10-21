import type { TutorialData } from '../types';

// Content update pass (review-driven):
//  * every formula keeps its paper equation number, σ_t is documented as a standard deviation;
//  * simulations are explicitly tagged 教学示意 / 教学类比, real paper data carries 来源 tags;
//  * chapters 4/5/7/8/9 drop the repeated window metaphor in favour of focus cards;
//  * chapter modules now include the exact-schedule math, the full Table 2 ablation and the
//    original-figure viewers added in this revision.

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'Denoising Diffusion Probabilistic Models',
    titleZh: '去噪扩散概率模型',
    venue: 'NeurIPS 2020',
    authors: 'Jonathan Ho, Ajay Jain, Pieter Abbeel',
    affiliation: 'UC Berkeley',
    domain: '生成模型 / 扩散模型',
    coreProblem:
      '扩散模型定义简单、训练高效，但本文之前没有任何工作证明它能生成高质量样本。',
    coreInsight:
      '通过 ε 参数化把反向过程与<b>去噪分数匹配</b>、<b>Langevin 动力学</b>建立联系，并得到对变分界重新加权的简化训练目标 L_simple，在无条件 CIFAR10 上取得 FID 3.17。',
    keywords: ['扩散模型', '去噪', '变分上界', '分数匹配', '图像生成'],
  },
  hero: {
    oldMethod: {
      desc: '（假设性教学对照，非方法分类）一步直接回归去噪：一步擦不净，残留大量噪声与水痕。',
      componentId: 'hero-window',
    },
    newMethod: {
      desc: '逐步去噪（DDPM）：一小步一小步地擦，从噪声中稳定还原清晰图像。',
      componentId: 'hero-window',
    },
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '问题与定位：加噪容易，去噪要一步步来',
      badge: 'inf',
      badgeLabel: '基础必读',
      bridge:
        '建立问题直觉，并说明 DDPM 在扩散模型谱系中的位置：它不是最早的扩散模型（2015 年已有），本文解决的是「能不能生成高质量样本」。',
      analogy: {
        title: '越擦越花',
        text: '一次用力擦只能短暂看清一小块，雾气很快又漫上来。<b>想真正擦净，得学习一步步地反向去雾。</b>（教学类比）',
        componentId: 'window-analogy',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '雾气浓度与可见度',
          desc: '拖动滑块增加玻璃上的雾气，观察窗外景象如何被噪声淹没。<span class="sim-badge">教学示意</span>',
          componentId: 'ch1-fog',
        },
        {
          kind: 'module',
          id: '1.2',
          title: '论文定位与核心贡献',
          desc: '逐条查看：扩散模型的起点（2015）、本文要解决的问题、两项关键改进与最终结果；每条均标注论文出处。',
          componentId: 'ch1-pos',
        },
      ],
      insight:
        '加噪是随机破坏、容易又不可逆；真正的任务是训练一个网络在每一步做一次小小的反向去噪 —— 而本文的工作让这条路第一次生成出高质量图像。',
      takeaways: [
        { icon: '🎯', title: '前向容易、反向难', desc: '加噪随手可得，去噪要学习。' },
        { icon: '🔧', title: '核心循环', desc: '数据 → 逐步加噪 → 学习逐步去噪 → 还原数据。' },
        { icon: '✨', title: '不是首创，胜在可用', desc: '扩散模型 2015 年提出；本文（2020，据作者所知）首次展示其高质量生成能力。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '输入表示：像素、缩放与同一维度的潜变量',
      badge: 'inf',
      badgeLabel: '基础必读',
      bridge:
        '回答「网络到底处理什么数据」：像素如何缩放、潜变量与数据同维，为 Eq. (4) 的闭式采样做准备。',
      analogy: {
        title: '一格一格看',
        text: '画面被拆成许多小格，每个格子的明暗就是一个数字。<b>把这些数字缩放到统一范围，网络才能稳定处理。</b>（教学类比）',
        componentId: 'window-analogy',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '像素值到 [-1,1]',
          desc: '在网格上拖动探针，查看被选格子的<b>原始像素值</b>与缩放后的数值。<span class="sim-badge">教学示意</span>',
          componentId: 'ch2-grid',
        },
      ],
      formula: {
        lead: '论文 §3.3：图像数据由 {0,…,255} 的整数线性缩放至 [−1,1]（常用实现如下）。',
        unicode: 'x₀ = 2 · (v / 255) − 1，&nbsp; v ∈ {0, 1, …, 255}',
        symbols: [
          { sym: 'v', desc: '原始像素整数亮度，范围 0..255。' },
          { sym: 'x₀', desc: '缩放后的数据值，范围 [-1,1]，也是前向过程的起点。' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '图像先缩放', desc: '0..255 → [-1,1]，保证数值稳定。' },
        { icon: '🔧', title: '潜变量与数据同维', desc: '每个潜变量 xₜ 与数据 x₀ 维度相同（论文 §2）。' },
        { icon: '✨', title: '统一尺度 + 较小的 βₜ', desc: '两者共同保证前向与反向具有近似相同的形式（论文 §2/§4）。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '核心洞见：加噪与去噪——学习的逆方向转移',
      badge: 'inf',
      badgeLabel: '基础必读',
      bridge:
        '建立最关键的一跳：反向过程被训练为前向扩散的逆方向转移，并可用条件高斯建模；随后给出从定义到 L_simple 的六步推导链，每一步都标注论文公式编号。',
      analogy: {
        title: '一次猛擦 vs 分步轻擦',
        text: '想一步擦到完美，只会留下水痕。<b>把去噪拆成很多小步，每一步只处理一点点噪声，才稳。</b>（教学类比）',
        componentId: 'window-analogy',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '一步到位还是逐步去噪？',
          desc: '按下开始，比较「直接预测干净图像」与<b>逐步去噪</b>两条路线。假定性教学对照（不代表对 GAN/VAE/自回归等方法的分类）；论文依据：直接预测 x₀ 在实验早期质量更差（§3.2），完整对比见第 5 章消融。<span class="sim-badge">教学示意</span>',
          componentId: 'ch3-compare',
        },
        {
          kind: 'module',
          id: '3.2',
          title: '公式推导链：从定义到 L_simple',
          desc: '逐步点击六步推导：前向定义 → 闭式采样 → 变分界 → 后验 → ε 参数化 → L_simple；第一步包含原论文 Figure 2。',
          componentId: 'ch3-derive',
        },
      ],
      formula: {
        lead: '反向过程（论文 Eq. (1)）把联合概率拆成一串条件高斯，逐步乘起来；前向扩散的定义见 Eq. (2)。',
        unicode: 'p_θ(x₀:T) = p(x_T) · ∏ₜ₌₁ᵀ p_θ(xₜ₋₁ | xₜ)',
        symbols: [
          { sym: 'p(x_T)', desc: '起点先验，标准正态 N(0, I)（固定，不学习）。' },
          { sym: 'p_θ(xₜ₋₁ | xₜ)', desc: '第 t 步学习到的高斯反向转移（近似前向的逆方向），均值 μθ、方差 Σθ = σₜ²I。' },
        ],
      },
      insight:
        '反向过程用条件高斯逐步建模 —— 训练目标因此变成两类可闭式处理的 KL 项（L_T、Lₜ₋₁）加一个重建项 L₀（Eq. (5)），DDPM 的整个训练目标由此推出。',
      takeaways: [
        { icon: '🎯', title: '前向固定、反向可学', desc: '前向固定（Eq. (2)）、反向可学（Eq. (1)）；反向是被训练来近似前向的逆方向转移。' },
        { icon: '🔧', title: '反向用条件高斯建模', desc: '每一步都是一个可学习的高斯转移。' },
        { icon: '✨', title: '公式链是闭合的', desc: '定义 → 闭式 → 变分界 → 后验 → ε 参数化 → L_simple（模块 3.2 可逐步查看）。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '核心数学：精确噪声调度、闭式采样与后验',
      badge: 'both',
      badgeLabel: '都建议读',
      bridge:
        '给出训练目标与每步可计算的后验。本章所有交互数值均来自论文的真实 β 表（线性 1e-4 → 0.02，T = 1000），按累计乘积精确计算，不再使用近似函数。',
      analogy: {
        title: '本章速览',
        text: '本章以公式与精确数值为主 —— 下方三个交互均由论文公式直接驱动。',
        componentId: 'ch-ana-note',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '噪声调度：βₜ、αₜ、ᾱₜ（精确值）',
          desc: '拖动时间步，查看 βₜ、αₜ 与累计 ᾱₜ 的精确取值；曲线与右侧面板同步。可快速验证 t = 1 / 100 / 500 / 1000 四个关键点。',
          componentId: 'ch4-beta',
        },
        {
          kind: 'module',
          id: '4.2',
          title: '闭式采样：xₜ = √ᾱₜ·x₀ + √(1−ᾱₜ)·ε（Eq. (4)）',
          desc: '拖动 t，看同一条公式在任意时刻直接生成 xₜ；<b>无需逐步模拟加噪</b> —— 这是训练能够随机抽取 t 的原因。<span class="sim-badge">教学图案</span>',
          componentId: 'ch4-sampler',
        },
        {
          kind: 'module',
          id: '4.3',
          title: '单步后验 q(xₜ₋₁|xₜ,x₀) 与 μ̃ₜ、β̃ₜ',
          desc: '查看 μ̃ₜ 的两个精确系数（c₀、cₜ）与 β̃ₜ 随 t 的变化（Eq. (6)–(7)）；t=1 的边界情况单独处理（离散解码器 / L₀）。',
          componentId: 'ch4-posterior',
        },
      ],
      insight:
        '每一步的后验都是闭式高斯：网络学习从带噪样本 xₜ 与时间步 t 预测<b>构造 xₜ 时使用的累计等效噪声 ε</b>（Eq. (4)），再用它构造反向高斯的均值 μθ（Eq. (11)）。',
      formula: {
        lead: '训练目标是负对数似然的变分上界（论文 Eq. (5)），可拆成三项。',
        unicode: 'L = L_T + Σₜ₌₂ᵀ Lₜ₋₁ + L₀',
        symbols: [
          { sym: 'L_T', desc: '终点与先验的 KL；前向方差固定时为常数（论文 §3.1）。' },
          { sym: 'Lₜ₋₁', desc: '每步「真实后验 vs pθ」的 KL 项，对应一次去噪步骤。' },
          { sym: 'L₀', desc: '最后一步的离散解码项（Eq. (13)）。' },
          { sym: 'q(xₜ₋₁|xₜ,x₀) = N(μ̃ₜ, β̃ₜI)', desc: '可闭式计算的前向后验（Eq. (6)–(7)）。' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '变分上界 = 两类 KL + 重建项', desc: 'L_T 与 Lₜ₋₁ 为 KL 项，L₀ 是重建项；固定前向下 L_T 与 θ 无关（Eq. (5)）。' },
        { icon: '🔧', title: '后验是闭式高斯', desc: 'μ̃ₜ、β̃ₜ 有精确公式（Eq. 6–7）；t=1 后验退化为点质量：采样步不添加噪声（z=0），似然上用 L₀/离散解码器。' },
        { icon: '✨', title: '数值全部精确', desc: '页面所有 β/α/ᾱ/β̃ 均由线性 β 表精确累计（模块 4.1–4.3 可逐点验证）。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '反向过程的选择：预测什么、方差怎么定',
      badge: 'both',
      badgeLabel: '都建议读',
      bridge:
        '回答逆向网络具体预测什么、方差怎么设、用什么目标训练 —— 并用完整 Table 2 展示每个 FID 数字背后的完整实验条件。',
      analogy: {
        title: '本章速览',
        text: '本章以消融证据为主：预测目标 × 协方差 × 训练目标，三者共同决定一个数字。',
        componentId: 'ch-ana-note',
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '消融实验：预测目标 × 协方差 × 训练目标（Table 2）',
          desc: '三组选择任意组合：<b>数字只在具有完整实验条件时显示</b>；论文留白的组合标注为不稳定/未报告，不补造数值。下方附 Table 2 逐值转写与高亮对照。',
          componentId: 'ch5-tools',
        },
      ],
      insight:
        '论文表 2 的对比显示：仅改变预测目标（13.22 vs 13.51）质量几乎不变；同一参数化下，训练目标的重新加权把 FID 从 13.51 降到 3.17 —— 一个反直觉但关键的实验结论。',
      formula: {
        lead: '既然已知 xₜ，就让网络预测构造 xₜ 时使用的累计等效噪声 ε（Eq. (4)），再由 Eq. (11) 得到反向均值 μθ。',
        unicode: 'μθ(xₜ,t) = (1/√αₜ) · ( xₜ − (βₜ/√(1−ᾱₜ)) · εθ(xₜ,t) )',
        symbols: [
          { sym: 'εθ(xₜ,t)', desc: '网络对噪声的预测；可附带时间正弦嵌入。' },
          { sym: 'μθ', desc: '由噪声预测反推出的反向均值。' },
          { sym: 'Σθ = σₜ²I', desc: '本文固定为各向同性常数（σₜ² 取 βₜ 或 β̃ₜ，不训练）。' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '预测目标是设计选择', desc: '论文比较了 μ̃ 与 ε；预测 x₀ 早期更差（未报告数值）。' },
        { icon: '🔧', title: '本文组合', desc: 'ε 预测 + 固定各向同性方差 + L_simple → FID 3.17。' },
        { icon: '✨', title: '学习方差没有收益', desc: '学习对角 Σθ 未带来更好质量（已报告组合 FID 23.69）；部分组合训练不稳定（表中为空）。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '采样：从纯噪声一步步擦出图像',
      badge: 'inf',
      badgeLabel: '基础必读',
      bridge:
        '把训练好的网络真正用来生成图像；引入论文原图与率失真数据：渐进生成、潜变量共享与「先大尺度、后细节」。',
      analogy: {
        title: '一圈圈擦清楚',
        text: '不是一次擦完，而是每一步只处理当前这点噪声。<b>先出现大轮廓，细节留到最后。</b>（教学类比；论文 Figure 6 给出真实图证）',
        componentId: 'window-analogy',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '按 Algorithm 2 逐步采样（精确系数）',
          desc: '沿 t = T → 1 推进；面板显示前向边缘分布 q(xₜ|x₀) 的系数（√ᾱₜ、√(1−ᾱₜ)，精确值）作为噪声水平的<b>参考刻度</b>。最后一步（t=1）z = 0、不添加噪声，直接取 μθ(x₁,1) 为输出；离散解码器（Eq. (13)）用于似然的 L₀ 项，不是采样步骤。画面从随机噪声逐步形成结构（非真实模型输出）。<span class="sim-badge">教学模拟</span>',
          componentId: 'ch6-sampler',
        },
        {
          kind: 'module',
          id: '6.2',
          title: '论文 Table 4：率失真随采样推进',
          desc: '点击接收步数 T−t+1，逐值查看论文 Table 4 的率与失真（CIFAR10 测试集）—— 超半数码长用在难以察觉的细节上。',
          componentId: 'ch6-progressive',
        },
        {
          kind: 'module',
          id: '6.3',
          title: '论文原图：渐进生成网格与共享潜变量',
          desc: '用时间列游标扫过原论文 <b>Figure 14</b>（附录，20 列时间 × 20 行样本；每格是对最终样本 <b>x̂₀</b> 的预测，原图注为「x̂₀ over time」，不是中间状态 x_t；正文 Figure 6 为其 4 行小版本），再查看 <b>Figure 7</b>：同一潜变量的多次采样共享哪些属性。',
          componentId: 'ch6-real',
        },
      ],
      insight:
        '采样慢（约 1000 步）是真实代价；但正是这些小步让生成成为可控的「渐进解码」—— 论文 Figure 6（正文）与 Figure 14（附录扩展版）的网格就是可视证据。',
      formula: {
        lead: '每一步都按同一形式更新（论文 Eq. (11)–(12) 之后），只是噪声预测随 t 变化。',
        unicode: 'xₜ₋₁ = (1/√αₜ)( xₜ − (βₜ/√(1−ᾱₜ)) εθ(xₜ,t) ) + σₜ z',
        symbols: [
          { sym: 'z', desc: '标准正态噪声；t=1 时取 0（Algorithm 2 第 3 行）。' },
          { sym: 'σₜ', desc: '标准差（不是方差）：σₜ² = βₜ 或 σₜ² = β̃ₜ，两者效果相近、均为未训练的时变常数。' },
          { sym: 'εθ', desc: '训练好的噪声预测网络（参数在所有 t 共享）。' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '从纯噪声开始', desc: '采样从 x_T ~ N(0,I) 出发，迭代 T = 1000 步。' },
        { icon: '🔧', title: '每步一小修', desc: 'xₜ₋₁ 由同一公式生成；σₜ 是标准差 σₜ² = βₜ 或 β̃ₜ。' },
        { icon: '✨', title: '从粗到细', desc: '论文 Figure 6/14：大尺度先出现、细节最后补齐（渐进解码）。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-7',
      title: '训练目标：随机时刻的噪声预测',
      badge: 'trn',
      badgeLabel: '训练细节',
      bridge:
        '解释一次训练迭代到底做什么（与 Algorithm 1 逐行对应），以及为什么「简化」会更好：论文实测 L_simple 训练出的模型样本质量最佳（FID 3.17），尽管它丢掉了 Eq. (12) 的权重。',
      analogy: {
        title: '本章速览',
        text: '本章以训练算法为主：动画的六个阶段与论文 Algorithm 1 伪代码逐行对应。',
        componentId: 'ch-ana-note',
      },
      modules: [
        {
          kind: 'module',
          id: '7.1',
          title: '一次训练迭代：Algorithm 1 全程对照',
          desc: '单步或连续播放一次迭代的六个阶段，右侧伪代码同步高亮；损失曲线为<b>教学示意</b>（论文未公开训练日志），其余步骤按 Algorithm 1 原文执行。',
          componentId: 'ch7-train',
        },
      ],
      formula: {
        lead: '简化目标就是在随机时刻上预测累计等效噪声的均方误差（Eq. (14)；ε 即 Eq. (4) 中构造 xₜ 的噪声，t 在 1…T 均匀采样）。',
        unicode: 'L_simple(θ) = E_{t,x₀,ε} ‖ ε − εθ( √ᾱₜ x₀ + √(1−ᾱₜ) ε , t ) ‖²',
        symbols: [
          { sym: 't', desc: '1..T 上的均匀随机时刻（Algorithm 1 第 3 行）。' },
          { sym: 'ε', desc: '真实加入的标准正态噪声。' },
          { sym: 'εθ(·,t)', desc: '网络在时刻 t 的噪声预测。' },
        ],
      },
      insight:
        'L_simple 丢掉了 Eq. (12) 的权重，看似「简化」，实则重新加权（小 t 降权、大 t 更受重视）——论文中这可能是性价比最高的一处改动。',
      takeaways: [
        { icon: '🎯', title: '一次训练', desc: '随机时刻 + 随机噪声 + 预测噪声（Algorithm 1）。' },
        { icon: '🔧', title: 'L_simple 更优', desc: '丢掉 Eq. (12) 的权重后样本质量更好（FID 3.17 vs 13.51）。' },
        { icon: '✨', title: '重新加权的变分目标', desc: 'L_simple 对原始变分界各项重新加权（论文称 a weighted variational bound），不等同于标准严格变分上界本身；其在论文的加权设定下与去噪分数匹配建立等价关系（§3.2/§3.4）。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-8',
      title: '架构：U-Net、时间嵌入与自注意力',
      badge: 'trn',
      badgeLabel: '训练细节',
      bridge:
        '揭示「预测 ε 的网络长什么样」，并补充论文附录的模型规模与逐层结构细节（Appendix B）。',
      analogy: {
        title: '本章速览',
        text: '本章以网络结构为主：点击 U-Net 的各个组件查看形状、作用与论文细节。',
        componentId: 'ch-ana-note',
      },
      modules: [
        {
          kind: 'module',
          id: '8.1',
          title: '点击查看 U-Net 各组件',
          desc: '点击编码器、瓶颈、解码器、跳连或自注意力，查看张量形状与作用；面板下方附论文 Appendix B 的参数量（35.7M / 114M / 256M）。图为结构示意（按 Appendix B 绘制），非逐层实现图。',
          componentId: 'ch8-unet',
        },
      ],
      takeaways: [
        { icon: '🎯', title: 'U-Net 骨干', desc: '改编自 PixelCNN++ 骨干；参数在所有时间步共享。' },
        { icon: '🔧', title: '时间嵌入', desc: '时间 t 用 Transformer 正弦位置嵌入注入每个残差块。' },
        { icon: '✨', title: '自注意力 + 跳连', desc: '仅 16×16 分辨率自注意力；跳连连接对应分辨率。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-9',
      title: '实用技术：让训练更稳的小技巧',
      badge: 'trn',
      badgeLabel: '训练细节',
      bridge:
        '补齐从论文到复现之间的工程细节：每个设置均标注论文口径 —— 包括「论文未做消融」的诚实标注，避免把经验之谈写成论文结论。',
      analogy: {
        title: '本章速览',
        text: '本章以复现细节为主：每个开关都能读到论文的对应原文依据。',
        componentId: 'ch-ana-note',
      },
      modules: [
        {
          kind: 'module',
          id: '9.1',
          title: '技巧开/关，效果如何',
          desc: '切换组归一化、dropout、水平翻转、EMA 等技巧，观察散布变化（<b>教学示意</b>）并读取每项技巧的论文口径。',
          componentId: 'ch9-trick',
        },
        {
          kind: 'module',
          id: '9.2',
          title: '拖动 EMA 衰减，看参数轨迹',
          desc: '拖动 EMA 衰减系数（0.90–0.9999），观察抖动的原始参数轨迹如何被<b>指数滑动平均</b>平滑（教学示意）；论文未对 EMA 做消融，直接取 0.9999。',
          componentId: 'ch9-ema',
        },
      ],
      formula: {
        lead: '线性方差表由首尾两个端点确定（论文 §4 / Appendix B）。',
        unicode: 'βₜ = β₁ + (β_T − β₁) · (t − 1)/(T − 1)，&nbsp; β₁ = 10⁻⁴, β_T = 0.02, T = 1000',
        symbols: [
          { sym: 'β₁', desc: '起始方差，10⁻⁴（论文原文写法）。' },
          { sym: 'β_T', desc: '终止方差，0.02；使 L_T ≈ 10⁻⁵ bits/dim 量级。' },
          { sym: 'T', desc: '总步数，1000（未做扫描直接设定）。' },
        ],
      },
      insight:
        '复现一篇生成模型论文，往往赢在这些看起来不起眼的稳定性细节上 —— 但每一条都要分清「论文写了什么」和「经验上为什么」。',
      takeaways: [
        { icon: '🎯', title: '组归一化替代权重归一化', desc: '论文口径：为了让实现更简单（Appendix B）。' },
        { icon: '🔧', title: '论文确实用的设置', desc: 'CIFAR10 dropout 0.1、随机水平翻转、Adam 2e-4、EMA 0.9999。' },
        { icon: '✨', title: '线性 β 表', desc: '1e-4 → 0.02；论文要求 L_T ≈ 0 使终点接近纯噪声。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-10',
      title: '结果、对比与局限',
      badge: 'both',
      badgeLabel: '都建议读',
      bridge:
        '用真实指标总结成效与代价：完整 Table 1 / Table 3 转写、训练集与测试集的 FID 口径、计算预算注意事项，以及论文自己写出的局限。',
      analogy: {
        title: '同一块玻璃，比谁擦得干净',
        text: '把各模型放到同一张“成绩单”上，按论文报告的指标比较样本质量。<b>按原论文报告，DDPM 在 2020 年发表时于无条件 CIFAR10 上达到 SOTA。</b>（教学类比；完整条件与数字见下方表格）',
        componentId: 'window-analogy',
      },
      modules: [
        {
          kind: 'module',
          id: '10.1',
          title: 'CIFAR10 样本质量竞赛（Table 1 数据可视化）',
          desc: '按真实 FID（越低越好）或 IS（越高越好）竞赛（动画为论文数据的可视化）；下方为 <b>Table 1 逐值转写</b>、<b>Figure 1 真实样本</b>，以及训练集/测试集 FID 口径说明。',
          componentId: 'ch10-race',
        },
        {
          kind: 'module',
          id: '10.2',
          title: '强项与短板、LSUN 结果与论文局限',
          desc: '切换「样本质量 / 对数似然 / 采样速度」三个视角；下方附 <b>Table 3（LSUN）逐值转写</b>、论文明确写出的局限与训练/硬件原值（Appendix B）。',
          componentId: 'ch10-limits',
        },
        {
          kind: 'module',
          id: '10.3',
          title: '核心贡献总结（四问四答）',
          desc: '把论文贡献压缩成四个问题：与早期扩散模型的关系、噪声预测参数化、简化目标的效果、2020 年的实验结果；每条均标注论文章节，并可直接跳转到对应章节继续学习。',
          componentId: 'ch10-summary',
        },
      ],
      formula: {
        lead: '率失真视角（论文 §4.3）：变分界项 L₁+…+L_T 视为「率」，L₀ 视为「失真」。',
        unicode: 'rate ≈ 1.78 bits/dim（Σ Lₜ）&nbsp;·&nbsp; distortion ≈ 1.97 bits/dim（L₀）',
        symbols: [
          { sym: 'rate', desc: 'CIFAR10 最高质量模型（L_simple）的累计码长。' },
          { sym: 'distortion', desc: '对应 L₀ 的重建失真；论文：超半数码长用于难以察觉的细节。' },
        ],
      },
      insight:
        '论文证明扩散模型能生成高质量图像（据作者所知为首次）—— 但「质量」与「似然」是两回事，采样成本是当时的真实短板。',
      takeaways: [
        { icon: '🎯', title: '质量达到当时 SOTA', desc: '无条件 CIFAR10 FID 3.17 / IS 9.46（测试集口径 FID 5.24）。' },
        { icon: '🔧', title: '率失真与渐进解码', desc: '1.78 / 1.97 bits/dim；LSUN 接近 ProgressiveGAN（6.36 / 7.89 / 19.75）。' },
        { icon: '✨', title: '局限如实', desc: '似然不具竞争力、采样约 1000 步；渐进压缩目前仅为概念验证（论文原文）。' },
      ],
    },
  ],
};
