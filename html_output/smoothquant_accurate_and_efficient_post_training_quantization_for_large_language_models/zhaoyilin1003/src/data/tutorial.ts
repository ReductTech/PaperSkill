import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'SmoothQuant: Accurate and Efficient Post-Training Quantization for Large Language Models',
    titleZh: 'SmoothQuant：大语言模型的精准高效训练后量化',
    venue: 'ICML 2023',
    authors: 'Guangxuan Xiao, Ji Lin, Mickael Seznec, Hao Wu, Julien Demouth, Song Han',
    affiliation: 'MIT · NVIDIA',
    domain: '大语言模型量化 / W8A8',
    coreProblem: 'LLM 的激活值存在大离群值，直接做 W8A8 量化会让精度崩坏。',
    coreInsight: '把量化难度从<b>激活迁移到权重</b>（两者在数学上等价），实现无需训练的 W8A8。',
    keywords: ['量化', 'W8A8', '离群值', '训练后量化'],
  },
  hero: {
    oldMethod: {
      desc: 'W8A8 直接量化：激活里的离群值让量化误差爆炸，精度崩坏。',
      componentId: 'fp32-bar',
    },
    newMethod: {
      desc: 'SmoothQuant：用缩放把难度从激活迁移到权重，W8A8 也能保持精度。',
      componentId: 'int4-bar',
    },
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '激活离群值让量化崩坏',
      badge: 'inf',
      badgeLabel: '问题引入',
      bridge: 'LLM 的激活值分布极不均衡：少数通道的数值特别大。这让按统一尺度量化的 W8A8 精度崩坏。',
      analogy: {
        title: '一根柱子顶破天花板',
        text: '离群值像房间里一根特别高的柱子：为了把它装下，整栋楼的天花板都得抬高，其它地方反而空了。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '位数的代价',
          desc: '拖动滑块感受量化位数：对存在离群值的激活，低位量化会显著放大误差。',
          componentId: 'bit-slider',
        },
      ],
      insight: '问题不在权重，而在激活：少数极端值决定了整个量化范围。',
      takeaways: [
        { icon: '📈', title: '激活有离群值', desc: '少数通道数值远大于其它通道。' },
        { icon: '💥', title: '误差爆炸', desc: '统一尺度量化会让普通值精度被牺牲。' },
        { icon: '🎯', title: '要找解法', desc: '直接 W8A8 行不通，需要新的思路。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '离群值：少数极端值',
      badge: 'inf',
      badgeLabel: '基础概念',
      bridge: '先看清离群值长什么样：权重通常比较平坦，而激活里总有几个特别大的数值。',
      analogy: {
        title: '人群中特别高的人',
        text: '离群值像人群里特别高的人：绝大多数人在正常范围，少数几个决定了「最高能有多高」。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '看看离群值的影响',
          desc: '切换「有离群值 / 已平滑」：离群值会拉开量化范围，让普通值的精度被浪费。',
          componentId: 'outlier-toggle',
        },
      ],
      formula: {
        lead: '线性层输出 Y = X·W：激活 X 和权重 W 共同决定结果，二者可以互相「分担」难度。',
        unicode: 'Y = X · W',
        symbols: [
          { sym: 'Y', desc: '该层的输出。' },
          { sym: 'X', desc: '该层的输入（激活）。' },
          { sym: 'W', desc: '该层的权重。' },
        ],
      },
      takeaways: [
        { icon: '📊', title: '权重平坦', desc: '权重分布通常比较均匀。' },
        { icon: '📈', title: '激活极端', desc: '激活里有少数大离群值。' },
        { icon: '🔗', title: '两者耦合', desc: '输出由 X 和 W 共同决定。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '核心洞见：把难度从激活迁移到权重',
      badge: 'inf',
      badgeLabel: '核心洞见',
      bridge: '关键想法：引入一个缩放，把激活「压平」、把权重「抬高」，两者乘积不变，量化难度却转移到权重。',
      analogy: {
        title: '把重量从 A 袋挪到 B 袋',
        text: '两袋总重量不变，但把难扛的那袋分一点给更稳的那袋，整体更好扛。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '离群值被平滑',
          desc: '切换观察：SmoothQuant 之后，激活里的离群值被「压」回正常范围。',
          componentId: 'outlier-toggle',
        },
        {
          kind: 'module',
          id: '3.2',
          title: '难度迁移的效果',
          desc: '变换之后，激活变得容易量化，权重承受了可承受的额外难度。',
          componentId: 'transform-toggle',
        },
      ],
      insight: '量化的难度不是固定的：它可以在 X 和 W 之间迁移，而乘积不变。',
      takeaways: [
        { icon: '🔀', title: '难度迁移', desc: '把离群值难度从激活迁到权重。' },
        { icon: '✖️', title: '乘积不变', desc: '缩放前后 Y = X·W 保持不变。' },
        { icon: '✅', title: '无需训练', desc: '只靠一个解析的缩放系数即可。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '数学：一个等价的缩放',
      badge: 'both',
      badgeLabel: '数学框架',
      bridge: 'SmoothQuant 的核心是一个逐通道缩放：把激活乘 s、权重除 s，数学上完全等价。',
      analogy: {
        title: '分子分母同乘一个数',
        text: '像把分数上下同乘一个数，值不变，但让它更好算。',
        componentId: 'grid-analog',
      },
      modules: [],
      formula: {
        lead: '引入缩放 s，把 X 压平、把 W 抬高：',
        unicode: 'Y = ( X · diag(s)⁻¹ ) · ( diag(s) · W )',
        symbols: [
          { sym: 'Y', desc: '该层输出（不变）。' },
          { sym: 'X', desc: '激活输入。' },
          { sym: 'W', desc: '权重。' },
          { sym: 's', desc: '逐通道的缩放系数。' },
        ],
      },
      insight: '缩放把「离群值」从激活转移到权重，从而让激活变得容易量化。',
      takeaways: [
        { icon: '🔢', title: '等价变换', desc: '缩放前后数学上完全等价。' },
        { icon: '📉', title: '激活变平', desc: 'X·s⁻¹ 的离群值被压回正常范围。' },
        { icon: '📈', title: '权重变陡', desc: 's·W 承担了转移过来的难度。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '方法：训练无关的 W8A8',
      badge: 'trn',
      badgeLabel: '方法实现',
      bridge: 'SmoothQuant 用一个小校准集解析地算出缩放系数，不需要梯度下降，也不需要自定义内核。',
      analogy: {
        title: '按经验调好平衡',
        text: '像调天平：测一下两边的重量，按一个公式就能配平，不用反复试。',
        componentId: 'grid-analog',
      },
      modules: [],
      formula: {
        lead: '缩放系数由激活和权重的幅度共同决定，例如：',
        unicode: 's = max( |X| )^α / max( |W| )^(1−α)',
        symbols: [
          { sym: 's', desc: '逐通道缩放系数。' },
          { sym: 'X', desc: '激活幅度。' },
          { sym: 'W', desc: '权重幅度。' },
          { sym: 'α', desc: '控制难度在激活与权重之间分配的比例。' },
        ],
      },
      insight: '一切只用少量校准数据解析求出，部署简单、硬件友好。',
      takeaways: [
        { icon: '🧮', title: '解析求解', desc: '缩放系数可由公式直接算出。' },
        { icon: '📦', title: '少量校准', desc: '只需少量校准数据。' },
        { icon: '🖥️', title: '硬件友好', desc: '无需自定义内核，通用硬件即可加速。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '结果：W8A8 也能保持精度',
      badge: 'both',
      badgeLabel: '结果与局限',
      bridge: '实验表明，SmoothQuant 的 W8A8 能保持接近原始的精度，同时带来近两倍加速和一半内存。',
      analogy: {
        title: '既轻又稳',
        text: 'SmoothQuant 像给模型减重：重量减半，但走起来依然稳稳当当。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '内存收益',
          desc: '点击开始对比：W8A8 相比全精度显著减小内存，这是量化最直观的收益。',
          componentId: 'quant-race',
        },
      ],
      insight: 'SmoothQuant 让「大模型也能跑在通用硬件上」成为现实。',
      takeaways: [
        { icon: '📉', title: '精度保持', desc: 'W8A8 下困惑度接近原始模型。' },
        { icon: '💾', title: '内存减半', desc: '权重与激活都降到 8 bit。' },
        { icon: '🚀', title: '近两倍加速', desc: '通用硬件即可获得明显加速。' },
      ],
    },
  ],
};
