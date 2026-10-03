import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'Up or Down? Adaptive Rounding for Post-Training Quantization',
    titleZh: '向上还是向下：训练后量化的自适应舍入',
    venue: 'ICML 2020',
    authors: 'Markus Nagel, Rana Ali Amjad, Mart van Baalen, Christos Louizos',
    affiliation: 'Qualcomm AI Research',
    domain: '神经网络量化 / 训练后量化（PTQ）',
    coreProblem:
      '把训练好的浮点网络量化成定点时，最直接的做法是「就近取整」，但这样会带来不必要的精度损失。',
    coreInsight:
      '舍入方向不应由「离谁近」决定，而应由「对任务损失的影响」决定——<b>自适应地选择每个权重向上还是向下</b>。',
    keywords: ['量化', '训练后量化', '自适应舍入', 'PTQ'],
  },
  hero: {
    oldMethod: {
      desc: '就近取整：每个权重独立舍入到最近的定点值，忽略对任务损失的影响，低比特下精度明显下降。',
      componentId: 'fp32-bar',
    },
    newMethod: {
      desc: 'AdaRound：根据任务损失自适应决定每个权重向上还是向下，训练后量化也能逼近量化感知训练。',
      componentId: 'int4-bar',
    },
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '量化精度损失的根源',
      badge: 'inf',
      badgeLabel: '问题引入',
      bridge: '把训练好的浮点网络量化成定点，最直接的做法是每个权重都舍入到最近的定点值。但论文发现，这远不是最优。',
      analogy: {
        title: '四舍五入的惯性',
        text: '就近取整就像习惯性的「四舍五入」：每个数都只向离自己最近的刻度靠拢，从不考虑这样取舍对整体结果是好是坏。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '位数越低，误差越大',
          desc: '拖动滑块改变<b>量化位数</b>：位数越低，量化误差越大、精度下降越明显。这是量化最直观的代价。',
          componentId: 'bit-slider',
        },
      ],
      insight: '精度损失不只来自位数低，还来自「舍入到最近」这个决策本身。',
      takeaways: [
        { icon: '📉', title: '位数越低越失真', desc: '量化位数下降直接带来更大的舍入误差。' },
        { icon: '🎯', title: '默认做法不是最优', desc: '就近取整是最常用、却未必最好的舍入方式。' },
        { icon: '🔧', title: '舍入可以改进', desc: '把舍入决策本身变成可优化的对象，是本文的出发点。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '量化与舍入：把连续值映射到定点',
      badge: 'inf',
      badgeLabel: '基础概念',
      bridge: '提出新方法前，先看清量化里最基础的一步：把连续的浮点值映射到有限的定点值，以及舍入误差从哪来。',
      analogy: {
        title: '把尺子的刻度变粗',
        text: '量化就像把尺子的刻度变粗：读数只能落在有限的刻度上，刻度越粗，读数越不精确。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '就近取整 vs 自适应舍入',
          desc: '切换两种舍入方式：<b>就近取整</b>只按距离决定，<b>自适应舍入</b>则按对任务损失的影响决定向上还是向下。',
          componentId: 'round-chips',
        },
      ],
      formula: {
        lead: '把舍入看成对权重的扰动：原始权重加上一个有界的扰动，得到定点值：',
        unicode: 'ŵ = w + Δw',
        symbols: [
          { sym: 'w', desc: '原始浮点权重。' },
          { sym: 'ŵ', desc: '舍入后的定点值。' },
          { sym: 'Δw', desc: '舍入扰动，其大小被量化步长所限制。' },
        ],
      },
      takeaways: [
        { icon: '📏', title: '量化是有限刻度', desc: '定点化把连续值映射到一组有限的刻度。' },
        { icon: '↔️', title: '舍入带来扰动', desc: '每个权重舍入都引入一个受步长限制的扰动。' },
        { icon: '🤔', title: '方向可选择', desc: '向上还是向下，其实是可以选择的决策。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '核心洞见：按任务损失决定舍入方向',
      badge: 'inf',
      badgeLabel: '核心洞见',
      bridge: '关键想法是：舍入不该只看单个权重离谁近，而要看它对最终任务损失的影响——有时故意「舍远」反而更好。',
      analogy: {
        title: '看整体，而不是只看局部',
        text: '好的舍入像精修一张照片：某个像素局部变暗一点，可能让整张图的对比更协调，而不是每个像素都取平均。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '方向由损失决定',
          desc: '再次对比两种舍入：自适应舍入为每个权重独立选择向上或向下，目标是最小化整体的任务损失，而不是单个权重的距离。',
          componentId: 'round-chips',
        },
        {
          kind: 'module',
          id: '3.2',
          title: '低比特下更稳',
          desc: '有了自适应舍入，即使把位数压得很低，精度也能被更好地保留下来——这正是它相对就近取整的优势。',
          componentId: 'bit-slider',
        },
      ],
      insight: '舍入方向是可优化的：它不是由距离唯一决定，而是由任务损失决定。',
      takeaways: [
        { icon: '🧭', title: '损失是最终目标', desc: '真正该最小化的是任务损失，不是单点距离。' },
        { icon: '⬆️⬇️', title: '每个权重独立决策', desc: '为每个权重学习一个向上或向下的选择。' },
        { icon: '💡', title: '舍远可能更好', desc: '有时故意选择非最近的方向，整体反而更优。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '数学：把舍入看作受约束的扰动',
      badge: 'both',
      badgeLabel: '数学框架',
      bridge: '为什么按损失决定方向是合理的？把舍入看成对权重的有界扰动，损失变化可以用二阶泰勒展开近似。',
      analogy: {
        title: '微调一排旋钮',
        text: '舍入每个权重，就像微调一排旋钮：单独看每个都动了，但组合起来能否让系统更优，要看整体损失。',
        componentId: 'grid-analog',
      },
      modules: [],
      formula: {
        lead: '舍入扰动 Δw 造成的损失变化，可用二阶泰勒展开近似：',
        unicode: 'L(w + Δw) ≈ L(w) + gᵀΔw + ½ ΔwᵀH Δw',
        symbols: [
          { sym: 'L', desc: '任务损失函数。' },
          { sym: 'w', desc: '权重向量。' },
          { sym: 'Δw', desc: '由舍入引入的扰动。' },
          { sym: 'g', desc: '损失对权重的梯度。' },
          { sym: 'H', desc: '损失对权重的 Hessian 矩阵。' },
        ],
      },
      insight: '就近取整只最小化 |Δw|，AdaRound 则最小化损失变化，这才是真正关心的量。',
      takeaways: [
        { icon: '🔢', title: '二阶近似', desc: '用泰勒展开描述舍入对损失的影响。' },
        { icon: '🎯', title: '梯度项 + 曲率项', desc: '损失变化由梯度和 Hessian 共同决定。' },
        { icon: '⚖️', title: '距离 ≠ 损失', desc: '最小化扰动距离，不等于最小化损失。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '方法：无需微调的自适应舍入',
      badge: 'trn',
      badgeLabel: '方法实现',
      bridge: 'AdaRound 不需要重新训练权重，只用一小批校准数据，为每个权重学习一个「向上还是向下」的舍入决策。',
      analogy: {
        title: '只做选择，不动本质',
        text: 'AdaRound 不改变权重大小，只是替每个权重做一次「进一还是退一」的选择，像校对员只改标点、不改文字。',
        componentId: 'grid-analog',
      },
      modules: [],
      formula: {
        lead: '在固定权重的前提下，优化每个权重的舍入方向，使校准数据上的损失变化最小：',
        unicode: 'min Σ ( gᵢΔwᵢ + ½ Hᵢᵢ Δwᵢ² )',
        symbols: [
          { sym: 'g', desc: '每个权重的梯度。' },
          { sym: 'H', desc: 'Hessian 的对角元素。' },
          { sym: 'Δw', desc: '每个权重的舍入扰动（方向可上下）。' },
        ],
      },
      insight: '整个过程不需要反向传播更新权重，也不需要重新训练，因此又快又便宜。',
      takeaways: [
        { icon: '🛠️', title: '训练无关', desc: '不做权重微调，只学习舍入方向。' },
        { icon: '📦', title: '小校准集', desc: '只需少量校准数据即可完成。' },
        { icon: '⚡', title: '又快又省', desc: '成本远低于量化感知训练。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '结果：低比特下逼近 QAT',
      badge: 'both',
      badgeLabel: '结果与局限',
      bridge: '在多个网络上，AdaRound 用极小的校准集就显著超过就近取整，逼近甚至超过量化感知训练，而成本远低于微调。',
      analogy: {
        title: '少花钱，多办事',
        text: 'AdaRound 像用一把更聪明的尺子：不换尺子，只换读数方式，精度就上来了。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '量化带来的内存收益',
          desc: '点击开始对比：量化把模型体积大幅缩小，这也是为什么人人都想压低位数。AdaRound 让低位量化不再是精度的代价。',
          componentId: 'quant-race',
        },
      ],
      insight: 'AdaRound 证明：训练后量化的精度上限，远高于「就近取整」这个默认选择。',
      takeaways: [
        { icon: '📈', title: '精度明显提升', desc: '在 4 比特等低比特下显著优于就近取整。' },
        { icon: '🏆', title: '逼近 QAT', desc: '以更低的成本接近量化感知训练的效果。' },
        { icon: '🚀', title: '实用价值高', desc: '训练后量化因此更接近生产可用。' },
      ],
    },
  ],
};
