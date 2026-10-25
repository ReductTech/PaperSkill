import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'SpinQuant: LLM Quantization with Learned Rotations',
    titleZh: 'SpinQuant：基于学习旋转的 LLM 量化',
    venue: 'ICLR 2025',
    authors: 'Zechun Liu, Changsheng Zhao, Igor Fedorov, Bilge Soran, Dhruv Choudhary, Raghuraman Krishnamoorthi, Vikas Chandra, Yuandong Tian, Kurt Keutzer',
    affiliation: 'Meta AI',
    domain: '大语言模型量化 / 旋转',
    coreProblem: '权重和激活里的离群值让低位量化（尤其 W4A4）误差很大。',
    coreInsight: '学习一个<b>旋转矩阵</b>，把不利于量化的分布旋转成更均匀、更好量化的分布。',
    keywords: ['量化', '旋转', 'W4A4', '离群值'],
  },
  hero: {
    oldMethod: {
      desc: '直接量化：分布偏斜、离群值多，低位量化误差大。',
      componentId: 'fp32-bar',
    },
    newMethod: {
      desc: 'SpinQuant：学习旋转把分布变得均匀，W4A4 也能保持精度。',
      componentId: 'int4-bar',
    },
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '低位量化难在分布',
      badge: 'inf',
      badgeLabel: '问题引入',
      bridge: '把位宽压到 4 bit 时，权重和激活的分布是否「友好」变得至关重要：偏斜的分布很难被均匀量化。',
      analogy: {
        title: '把不规则的东西装进格子',
        text: '低位量化像把一堆形状不规则的东西塞进有限的格子：形状越不规则，塞进去越浪费、越出错。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '位数的代价',
          desc: '拖动滑块感受：位数越低，对分布的友好程度要求越高。',
          componentId: 'bit-slider',
        },
      ],
      insight: '与其硬量化一个不友好的分布，不如先把分布变得友好。',
      takeaways: [
        { icon: '📉', title: '低位更难', desc: '4 bit 对分布极其敏感。' },
        { icon: '🌀', title: '分布不友好', desc: '偏斜分布让量化误差更大。' },
        { icon: '💡', title: '先改变分布', desc: '把分布变得均匀，再量化。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '旋转：改变分布的形状',
      badge: 'inf',
      badgeLabel: '基础概念',
      bridge: '旋转是一个正交变换：它不改变向量的长度，只改变方向，从而改变数值的分布。',
      analogy: {
        title: '转动一个图形',
        text: '像把一张斜放的纸转正：形状没变，但看起来更规整、更好切。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '变换前后对比',
          desc: '切换「变换前 / 变换后」：旋转把偏斜分布变成更均匀的分布。',
          componentId: 'transform-toggle',
        },
      ],
      formula: {
        lead: '旋转是一个正交矩阵 R（满足 RᵀR = I），对权重和激活做等价变换：',
        unicode: 'Y = ( X·R ) · ( Rᵀ·W )',
        symbols: [
          { sym: 'R', desc: '旋转（正交）矩阵。' },
          { sym: 'X', desc: '激活输入。' },
          { sym: 'W', desc: '权重。' },
          { sym: 'Y', desc: '输出（不变）。' },
        ],
      },
      takeaways: [
        { icon: '🔄', title: '正交变换', desc: '旋转不改变向量长度，只改变方向。' },
        { icon: '📊', title: '分布更均匀', desc: '旋转后离群值被摊平。' },
        { icon: '✖️', title: '结果不变', desc: 'X·R 与 Rᵀ·W 的乘积仍是 Y。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '核心洞见：学习一个更好的旋转',
      badge: 'inf',
      badgeLabel: '核心洞见',
      bridge: '关键想法：不是随便转，而是「学习」一个让量化误差最小的旋转，用少量数据优化出最佳方向。',
      analogy: {
        title: '找到最佳角度',
        text: '像反复转一张纸，直到找到最省材料、最好切的那个角度。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '旋转的效果',
          desc: '切换观察：学习到的旋转能把分布摊得更均匀，量化误差显著下降。',
          componentId: 'transform-toggle',
        },
        {
          kind: 'module',
          id: '3.2',
          title: '低位下依然有效',
          desc: '有了更好的旋转，即使 W4A4 这种低位也能保持精度。',
          componentId: 'bit-slider',
        },
      ],
      insight: '旋转的方向是可优化的：找对方向，量化的难度就大幅下降。',
      takeaways: [
        { icon: '🧭', title: '学习旋转', desc: '用少量数据优化旋转矩阵。' },
        { icon: '🎯', title: '最小化误差', desc: '目标是让量化误差最小。' },
        { icon: '✅', title: '结果不变', desc: '旋转是等价变换，不改变模型输出。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '数学：旋转后的量化',
      badge: 'both',
      badgeLabel: '数学框架',
      bridge: '旋转后，权重和激活的离群值被摊平，量化误差的理论上界也随之下降。',
      analogy: {
        title: '把尖峰摊平',
        text: '像把一堆尖角的东西磨成圆角：极端值没了，量化时不容易出大错。',
        componentId: 'grid-analog',
      },
      modules: [],
      formula: {
        lead: '旋转后量化的重构误差，与旋转矩阵 R 的选择有关：',
        unicode: 'min_R ‖ X·R − Q( X·R ) ‖',
        symbols: [
          { sym: 'R', desc: '要学习的旋转矩阵。' },
          { sym: 'X', desc: '激活（或权重）。' },
          { sym: 'Q', desc: '量化操作。' },
        ],
      },
      insight: '通过学习 R，让量化后的重构误差尽可能小。',
      takeaways: [
        { icon: '🔢', title: '优化旋转', desc: '把 R 当作可优化参数。' },
        { icon: '📉', title: '误差下界更低', desc: '摊平分布降低量化误差。' },
        { icon: '⚖️', title: '等价保持', desc: '旋转不改变原始模型行为。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '方法：训练无关的旋转学习',
      badge: 'trn',
      badgeLabel: '方法实现',
      bridge: 'SpinQuant 用少量校准数据直接优化旋转矩阵，不需要重训练权重，成本很低。',
      analogy: {
        title: '只转方向，不动内容',
        text: '像给一本书换个摆放角度：内容一个字没改，但更好收纳了。',
        componentId: 'grid-analog',
      },
      modules: [],
      formula: {
        lead: '旋转矩阵可由 Walsh–Hadamard 等结构化矩阵初始化，再在小校准集上微调：',
        unicode: 'R ← optimize over calibration set',
        symbols: [
          { sym: 'R', desc: '旋转矩阵。' },
          { sym: 'optimize', desc: '在校准集上最小化量化误差。' },
        ],
      },
      insight: '整个过程无需梯度下降更新权重，部署轻量、通用。',
      takeaways: [
        { icon: '🛠️', title: '无需重训', desc: '只学习旋转，不改权重。' },
        { icon: '📦', title: '少量校准', desc: '少量数据即可完成。' },
        { icon: '🖥️', title: '通用硬件', desc: '旋转可用标准算子实现。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '结果：W4A4 精度明显提升',
      badge: 'both',
      badgeLabel: '结果与局限',
      bridge: '实验显示，SpinQuant 在 W4A4 等低位下显著优于直接量化，并更接近全精度模型。',
      analogy: {
        title: '轻装上阵，状态在线',
        text: 'SpinQuant 让模型在低位下仍保持好状态，像轻装上阵但成绩没掉。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '内存收益',
          desc: '点击开始对比：W4A4 把内存压到极低，这是旋转量化带来的直接收益。',
          componentId: 'quant-race',
        },
      ],
      insight: 'SpinQuant 让极低比特量化从「会崩」变成「可用」。',
      takeaways: [
        { icon: '📈', title: '低位精度提升', desc: 'W4A4 下明显优于直接量化。' },
        { icon: '💾', title: '内存极小', desc: '权重与激活都压到 4 bit。' },
        { icon: '🚀', title: '加速显著', desc: '极低位带来更大吞吐。' },
      ],
    },
  ],
};
