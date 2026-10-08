import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'SVDQuant: Absorbing Outliers by Low-Rank Components for 4-bit Diffusion Models',
    titleZh: 'SVDQuant：用低秩分量吸收离群值实现 4 比特扩散模型量化',
    venue: 'ICLR 2025',
    authors: 'Muyang Li, Yujun Lin, Zhekai Zhang, Tianle Cai, Xiang Li, Jun Guo, Enze Xie, Chenlin Meng, Jun-Yan Zhu, Song Han',
    affiliation: 'MIT · NVIDIA · UCSD',
    domain: '扩散模型量化 / 低秩分解',
    coreProblem: '扩散模型的权重和激活都有极端离群值，直接做 4-bit 量化会让精度崩坏。',
    coreInsight: '用 <b>SVD 低秩分量</b>把离群值「吸收」进少量 16-bit 分支，剩余部分再量化到 4-bit。',
    keywords: ['扩散模型', '4-bit 量化', '低秩分解', '离群值'],
  },
  hero: {
    oldMethod: {
      desc: '直接 4-bit：离群值让量化误差爆炸，生成图像质量崩坏。',
      componentId: 'fp32-bar',
    },
    newMethod: {
      desc: 'SVDQuant：低秩分支吸收离群值，剩余部分 4-bit 量化，图像质量几乎无损。',
      componentId: 'int4-bar',
    },
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '扩散模型量化更难',
      badge: 'inf',
      badgeLabel: '问题引入',
      bridge: '扩散模型要反复生成图像，推理慢、内存大；但要压到 4 bit，离群值会让精度崩坏。',
      analogy: {
        title: '既要快，又要清晰',
        text: '扩散模型像画一幅精细的画：想画得快（低位），画面又容易糊（离群值带来误差）。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '位数的代价',
          desc: '拖动滑块：对扩散模型，4 bit 的误差尤其明显，因为权重和激活都布满离群值。',
          componentId: 'bit-slider',
        },
      ],
      insight: '扩散模型的离群值比普通网络更极端，需要专门处理。',
      takeaways: [
        { icon: '🖼️', title: '反复生成', desc: '扩散模型要多次前向，成本高。' },
        { icon: '💥', title: '离群值极端', desc: '权重和激活都有极端值。' },
        { icon: '🎯', title: '需要专门方法', desc: '直接 4-bit 行不通。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '离群值：4-bit 的拦路虎',
      badge: 'inf',
      badgeLabel: '基础概念',
      bridge: '先看清离群值：它们只占极少数，却占据了大部分量化范围，让普通值的精度被浪费。',
      analogy: {
        title: '一颗巨石占了大半场地',
        text: '离群值像场地里的一颗巨石：为了容纳它，整个场地都被撑大，其它东西反而显得很稀。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '离群值的影响',
          desc: '切换「有离群值 / 已平滑」：离群值拉开量化范围，普通值精度被牺牲。',
          componentId: 'outlier-toggle',
        },
      ],
      formula: {
        lead: '权重矩阵可分解为低秩部分与残差部分之和：',
        unicode: 'W = U·Vᵀ + R',
        symbols: [
          { sym: 'W', desc: '原始权重矩阵。' },
          { sym: 'U, V', desc: '低秩因子（承载主要离群值）。' },
          { sym: 'R', desc: '剩余残差（更平坦，适合量化）。' },
        ],
      },
      takeaways: [
        { icon: '📊', title: '离群值少但极端', desc: '少数值占据大部分范围。' },
        { icon: '🧩', title: '可分解', desc: '权重可拆成低秩 + 残差。' },
        { icon: '🎯', title: '分离处理', desc: '把难量化的部分单独拎出来。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '核心洞见：低秩分量吸收离群值',
      badge: 'inf',
      badgeLabel: '核心洞见',
      bridge: '关键想法：用 SVD 把承载离群值的低秩部分分离出来、用 16-bit 保留；剩余平坦部分压到 4-bit。',
      analogy: {
        title: '把巨石单独搬出去',
        text: '先把场地里的巨石单独搬出去（低秩、高精度），剩下的小石子就能轻松装箱（4-bit）。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '离群值被吸收',
          desc: '切换观察：低秩分离后，剩余部分的离群值被大幅削弱。',
          componentId: 'outlier-toggle',
        },
        {
          kind: 'module',
          id: '3.2',
          title: '剩余部分更好量化',
          desc: '变换之后，剩余残差更平坦，适合 4-bit 量化。',
          componentId: 'transform-toggle',
        },
      ],
      insight: '把「难量化」的离群值交给高精度低秩分支，让「好量化」的部分承担 4-bit。',
      takeaways: [
        { icon: '🧲', title: '低秩吸收', desc: '低秩分支承载主要离群值。' },
        { icon: '📉', title: '残差平坦', desc: '剩余部分更适合低位量化。' },
        { icon: '⚖️', title: '精度保留', desc: '离群值用 16-bit 保留，不丢信息。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '数学：SVD 分解与残差',
      badge: 'both',
      badgeLabel: '数学框架',
      bridge: 'SVD 能把矩阵分解成若干个秩一成分之和，前几个成分往往承载了最大的离群值。',
      analogy: {
        title: '主成分 + 细节',
        text: '像把一张照片拆成「大轮廓」和「细节纹理」：轮廓保留高精度，纹理可以压得狠一点。',
        componentId: 'grid-analog',
      },
      modules: [],
      formula: {
        lead: '取前 r 个奇异值对应的低秩部分，剩余为残差：',
        unicode: 'W ≈ Σ σᵢ uᵢ vᵢᵀ + R',
        symbols: [
          { sym: 'σ', desc: '奇异值，按大小排序。' },
          { sym: 'u, v', desc: '左、右奇异向量。' },
          { sym: 'r', desc: '保留的低秩个数。' },
          { sym: 'R', desc: '残差，适合 4-bit 量化。' },
        ],
      },
      insight: '低秩部分用 16-bit 保留离群值，残差部分量化到 4-bit，二者合起来逼近原权重。',
      takeaways: [
        { icon: '🔢', title: 'SVD 分解', desc: '按奇异值大小拆分权重。' },
        { icon: '📉', title: '残差平坦', desc: '去掉低秩后残差更易量化。' },
        { icon: '🎯', title: '误差可控', desc: '高精度分支补回主要信息。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '方法：低秩 + 4-bit 残差',
      badge: 'trn',
      badgeLabel: '方法实现',
      bridge: 'SVDQuant 把权重拆成低秩 16-bit 分支和 4-bit 残差分支，推理时两部分并行计算再相加。',
      analogy: {
        title: '两条流水线并行',
        text: '像同时跑两条流水线：一条精细处理轮廓，一条快速处理纹理，最后合在一起。',
        componentId: 'grid-analog',
      },
      modules: [],
      formula: {
        lead: '推理时，输出由低秩分支与量化残差分支相加：',
        unicode: 'Y = (U·Vᵀ)·X + Q(R)·X',
        symbols: [
          { sym: 'U, V', desc: '低秩 16-bit 分支。' },
          { sym: 'Q(R)', desc: '4-bit 量化的残差分支。' },
          { sym: 'X', desc: '输入激活。' },
          { sym: 'Y', desc: '输出。' },
        ],
      },
      insight: '低秩分支很小，额外开销可控，却能把离群值完整保留。',
      takeaways: [
        { icon: '🛠️', title: '双分支', desc: '低秩 16-bit + 残差 4-bit。' },
        { icon: '📦', title: '开销可控', desc: '低秩分支很小。' },
        { icon: '🖥️', title: '可部署', desc: '可用标准算子高效实现。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '结果：4-bit 下图像几乎无损',
      badge: 'both',
      badgeLabel: '结果与局限',
      bridge: '实验显示，SVDQuant 在 4-bit 下生成的图像几乎与全精度一致，同时带来大幅加速与内存下降。',
      analogy: {
        title: '又快又清晰',
        text: 'SVDQuant 让扩散模型既跑得快，又画得清，鱼与熊掌兼得。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '内存与收益',
          desc: '点击开始对比：4-bit 量化大幅降低内存，这是 SVDQuant 最直接的收益。',
          componentId: 'quant-race',
        },
      ],
      insight: 'SVDQuant 把 4-bit 量化从「会崩」变成「可用」，推动扩散模型在端侧部署。',
      takeaways: [
        { icon: '🖼️', title: '图像几乎无损', desc: '4-bit 下生成质量接近全精度。' },
        { icon: '💾', title: '内存大幅下降', desc: '权重与激活都压到 4 bit。' },
        { icon: '🚀', title: '加速显著', desc: '低位计算带来更高吞吐。' },
      ],
    },
  ],
};
