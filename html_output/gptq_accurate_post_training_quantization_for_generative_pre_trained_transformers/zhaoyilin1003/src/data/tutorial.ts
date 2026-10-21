import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers',
    titleZh: 'GPTQ：生成式预训练 Transformer 的精确训练后量化',
    venue: 'ICLR 2023',
    authors: 'Elias Frantar, Saleh Ashkboos, Torsten Hoefler, Dan Alistarh',
    affiliation: 'IST Austria · ETH Zurich',
    domain: '大语言模型量化 / 权重量化',
    coreProblem: 'GPT 类模型参数巨大，即使推理也需要多块高性能 GPU，部署成本极高。',
    coreInsight: '用<b>二阶 Hessian 信息逐层补偿</b>量化误差，把 175B 模型一次性压到 3–4 bit，精度损失几乎可忽略。',
    keywords: ['GPT', '权重量化', '二阶信息', '一次性量化'],
  },
  hero: {
    oldMethod: {
      desc: '逐层就近量化：把每一层权重直接舍入，忽略层间误差累积，低比特下精度明显下降。',
      componentId: 'fp32-bar',
    },
    newMethod: {
      desc: 'GPTQ：用 Hessian 二阶信息逐层补偿量化误差，175B 模型几小时就能压到 3–4 bit。',
      componentId: 'int4-bar',
    },
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: 'LLM 太大：推理都成了负担',
      badge: 'inf',
      badgeLabel: '问题引入',
      bridge: 'GPT 类模型动辄上百亿参数，即使只是推理也需要多块 GPU。量化是降低这一成本的关键手段。',
      analogy: {
        title: '把书柜里的厚书换成摘要',
        text: '模型参数像一柜子精装书，量化像把它们换成同样内容的精简版——占地方小了，但别丢太多细节。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '位数越低，代价越明显',
          desc: '拖动滑块看量化位数的代价：位数越低，误差越大。对超大模型，这个误差必须被认真补偿。',
          componentId: 'bit-slider',
        },
      ],
      insight: '规模越大，量化的收益越大，但对精度的要求也越高——需要更聪明的量化方式。',
      takeaways: [
        { icon: '🐘', title: '模型太大', desc: 'GPT 推理本身就需要大量显存与算力。' },
        { icon: '📉', title: '量化是出路', desc: '降低位数能大幅减少内存与计算。' },
        { icon: '🎯', title: '误差要补偿', desc: '直接舍入的误差在低比特下不可忽略。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '逐层量化：误差从哪里累积',
      badge: 'inf',
      badgeLabel: '基础概念',
      bridge: '量化通常是逐层进行的：一层量化后再处理下一层。理解误差如何沿层累积，是 GPTQ 的起点。',
      analogy: {
        title: '一层层叠积木',
        text: '逐层量化像一层层叠积木：每一层的小偏差都会传到下一层，越叠越偏。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '逐步看逐层量化',
          desc: '点「下一步」逐层推进：每一层被量化后，它的误差会影响后续层，这是逐层量化必须处理的问题。',
          componentId: 'layer-step',
        },
      ],
      formula: {
        lead: 'GPTQ 逐层最小化「Hessian 加权」的重构误差，而不是简单的最小二乘：',
        unicode: 'min ‖ W − Ŵ ‖²_H',
        symbols: [
          { sym: 'W', desc: '某一层的原始权重。' },
          { sym: 'Ŵ', desc: '量化后的权重。' },
          { sym: 'H', desc: 'Hessian 矩阵，衡量误差对输出的影响。' },
        ],
      },
      takeaways: [
        { icon: '🧱', title: '逐层处理', desc: '量化按层进行，误差会向下游累积。' },
        { icon: '⚖️', title: '加权误差', desc: '不同权重的误差对输出影响不同，应加权。' },
        { icon: '🧮', title: 'Hessian 加权', desc: '用二阶信息衡量误差的重要性。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '核心洞见：用二阶信息补偿误差',
      badge: 'inf',
      badgeLabel: '核心洞见',
      bridge: '关键想法：量化一个权重后，用其余权重「补偿」它带来的输出误差——这正是二阶信息的作用。',
      analogy: {
        title: '少了一块的拼图',
        text: '量化一个权重像拼图少了一块：GPTQ 用其它拼块微调位置，把缺口尽量补齐。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '逐层补偿的过程',
          desc: '点「下一步」观察：每量化一个权重，就用尚未量化的权重补偿其误差，逐层把整体误差压下去。',
          componentId: 'layer-step',
        },
        {
          kind: 'module',
          id: '3.2',
          title: '低比特下依然有效',
          desc: '有了二阶补偿，即使把位数压到 3–4 bit，模型也能保持精度。',
          componentId: 'bit-slider',
        },
      ],
      insight: '量化误差不是不可控的：用 Hessian 的逆去补偿，就能把它压到很小。',
      takeaways: [
        { icon: '🧭', title: '二阶信息', desc: 'Hessian 描述误差对输出的敏感度。' },
        { icon: '🩹', title: '误差补偿', desc: '量化一个权重后，用其它权重补回来。' },
        { icon: '⚡', title: '一次性完成', desc: '整个过程无需重训练，一次就能量化。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '数学：Hessian 与误差补偿',
      badge: 'both',
      badgeLabel: '数学框架',
      bridge: '为什么用 Hessian？因为量化误差对最终输出的影响不是均匀的，二阶信息能精确刻画这种影响。',
      analogy: {
        title: '重要零件要更精确',
        text: '像修表一样：关键齿轮要精修，装饰件可以粗一点。Hessian 告诉我们哪些权重更关键。',
        componentId: 'grid-analog',
      },
      modules: [],
      formula: {
        lead: '对某一层，量化带来的输出误差可近似为二次型：',
        unicode: 'E ≈ ( W − Ŵ )ᵀ H ( W − Ŵ )',
        symbols: [
          { sym: 'E', desc: '量化引起的输出误差。' },
          { sym: 'W', desc: '原始权重。' },
          { sym: 'Ŵ', desc: '量化后的权重。' },
          { sym: 'H', desc: 'Hessian 矩阵，衡量二阶影响。' },
        ],
      },
      insight: '有了这个二次型，逐层量化就变成一个可精确、逐步求解的优化问题。',
      takeaways: [
        { icon: '🔢', title: '二次型误差', desc: '误差由 Hessian 加权，而非均匀看待。' },
        { icon: '🎯', title: '可求解', desc: '逐层优化可以被高效近似求解。' },
        { icon: '⚖️', title: '重要度不同', desc: 'Hessian 体现每个权重的重要程度。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '方法：几小时量化 175B 模型',
      badge: 'trn',
      badgeLabel: '方法实现',
      bridge: 'GPTQ 把逐层 Hessian 补偿做成了高效算法，让 1750 亿参数的 GPT 模型在几小时内完成 3–4 bit 量化。',
      analogy: {
        title: '流水线检修',
        text: '像给一列超长火车逐节检修：GPTQ 一层层快速处理，最终整列都能跑起来。',
        componentId: 'grid-analog',
      },
      modules: [],
      formula: {
        lead: '对每一层，在量化该层权重时补偿其输出误差，目标可写作：',
        unicode: 'min ‖ WX − ŴX ‖²',
        symbols: [
          { sym: 'W', desc: '该层权重。' },
          { sym: 'X', desc: '该层输入（校准数据）。' },
          { sym: 'Ŵ', desc: '量化后的权重。' },
        ],
      },
      insight: '它不需要训练数据，只用少量校准样本，就能在单块 GPU 上量化超大模型。',
      takeaways: [
        { icon: '⏱️', title: '几小时完成', desc: '175B 模型可在数小时内量化。' },
        { icon: '📦', title: '少量校准', desc: '只需少量校准样本，无需训练数据。' },
        { icon: '🖥️', title: '单 GPU 可用', desc: '让超大模型的推理门槛大幅降低。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '结果：3–4 bit 下精度几乎无损',
      badge: 'both',
      badgeLabel: '结果与局限',
      bridge: '实验显示，GPTQ 在 3–4 bit 下仍保持接近原始的困惑度，且推理显著加速、内存大幅下降。',
      analogy: {
        title: '缩水不缩质量',
        text: 'GPTQ 像把照片压成小图：文件小了很多，但看起来几乎没差别。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '内存收益对比',
          desc: '点击开始对比：量化让模型体积大幅缩小，这是 GPTQ 最直接的收益。',
          componentId: 'quant-race',
        },
      ],
      insight: 'GPTQ 让「超大规模模型也能在有限硬件上运行」从理想变成现实。',
      takeaways: [
        { icon: '📉', title: '精度几乎无损', desc: '3–4 bit 下困惑度接近原始模型。' },
        { icon: '💾', title: '内存大幅下降', desc: '显存占用显著降低。' },
        { icon: '🚀', title: '推理更快', desc: '低位计算带来明显加速。' },
      ],
    },
  ],
};
