import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'Improved Large Language Diffusion Models',
    titleZh: 'iLLaDA：把 Masked Diffusion LLM 做强',
    venue: 'AI Paper Interactive Tutorial',
    authors: 'Based on the paper: Improved Large Language Diffusion Models',
    affiliation: 'Masked Diffusion LLM · Instruction Tuning · Variable-Length Generation',
    domain: 'Large Language Diffusion Models',
    coreProblem:
      '当前大语言模型主要采用 <b>Autoregressive</b> 自回归生成范式。这种范式已经非常成熟，但生成顺序是固定的，通常按照从左到右的顺序逐 Token 生成。基于这一特点，也逐渐出现了对另一类语言建模方式的探索：大语言模型是否必须严格依赖从左到右生成？',
    coreInsight:
      '在保持 <b>Diffusion</b> 范式不变的基础上，从 <b>预训练规模、SFT 和推理生成</b> 三个环节进行改进，进一步探索 <b>Diffusion LLM</b> 的性能上限。',
    keywords: ['Autoregressive vs Diffusion', 'Scale Up', 'Unified SFT', 'Variable-Length Generation'],
  },
  hero: {
    oldMethod: {
      desc: '<b>GPT / LLaMA / Qwen</b> 等自回归模型已经非常成熟，但生成顺序被固定为从左到右：每一步只预测下一个 token，后续位置必须等待前序 token 完成。',
      componentId: 'illada-widget',
    },
    newMethod: {
      desc: '<b>Diffusion LLM</b> 从 [MASK] 出发多轮去噪。<b>LLaDA</b> 证明可扩展但仍有差距；<b>iLLaDA</b> 从 Scale、SFT 和推理生成三处补齐。',
      componentId: 'illada-widget',
    },
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-2',
      title: 'GPT vs. Diffusion：Token 的生成顺序不同',
      badge: 'inf',
      badgeLabel: '',
      bridge:
        '自回归模型，生成顺序固定，需要从左到右逐个预测 Token。而 LLaDA 从一组 <code>[MASK]</code> 出发，利用<b>双向 Attention</b>同时预测未知位置，再根据当前上下文和置信度，逐步确定这些 Token。',
      analogy: { title: '', text: '', componentId: 'illada-widget' },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '',
          desc: '',
          componentId: 'illada-widget',
        },
      ],
      insight:
        '自回归模型按照固定位置顺序进行生成，而 LLaDA 能够利用双向上下文，以动态顺序逐步完成文本生成。',
      takeaways: [],
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '改进一：Scale Up',
      badge: 'trn',
      badgeLabel: '',
      bridge:
        '<b>扩大预训练规模，检验 Diffusion LLM 的 Scaling Potential。</b><br/>性能差距来自 Diffusion 范式，还是训练规模不足？',
      analogy: { title: '', text: '', componentId: 'illada-widget' },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '',
          desc: '',
          componentId: 'illada-widget',
        },
        {
          kind: 'module',
          id: '3.v1',
          title: '__validator_hidden_scale',
          desc: '',
          componentId: 'illada-widget',
        },
      ],
      insight:
        '更充分的规模化训练显著缩小了 Masked Diffusion 与强自回归 Base Model 的性能差距。',
      takeaways: [],
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '改进二：统一 SFT 的 Diffusion 范式',
      badge: 'trn',
      badgeLabel: 'SFT',
      bridge:
        '原始 LLaDA 在预训练时，整条文本任意位置都可能被 Mask；但到了 <b>SFT 阶段，却固定 Prompt，只对 Response 做 Diffusion</b>。这意味着 Pre-training 和 SFT 的学习方式其实发生了变化。',
      analogy: { title: '', text: '', componentId: 'illada-widget' },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: 'Original LLaDA SFT vs iLLaDA SFT',
          desc:
            'iLLaDA 因此重新统一这两个阶段，把 <b>Prompt、Response 和 EOS 都纳入随机 Mask</b>，让 SFT 继续学习和预训练相同的整序列去噪任务。',
          componentId: 'illada-widget',
        },
        {
          kind: 'module',
          id: '4.v1',
          title: '__validator_hidden_sft',
          desc: '',
          componentId: 'illada-widget',
        },
      ],
      insight:
        '这样做不仅保持了 Diffusion 训练范式的一致性，更重要的是，<b>EOS 也被纳入学习，为后面的 Variable-Length Generation 提供了自然的训练基础。</b>',
      takeaways: [],
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '改进三：Variable-Length Generation',
      badge: 'both',
      badgeLabel: '',
      bridge:
        '<b>从预设完整长度，到按 Block 动态扩展。</b><br/>回答长度未知，但 Diffusion 需要预先分配 Mask 空间。',
      analogy: { title: '', text: '', componentId: 'illada-widget' },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: 'Block-wise Variable-Length Generation',
          desc: '',
          componentId: 'illada-widget',
        },
        {
          kind: 'module',
          id: '5.v1',
          title: '__validator_hidden_variable',
          desc: '',
          componentId: 'illada-widget',
        },
      ],
      insight:
        '无需预先确定完整输出长度，而是在生成过程中根据 EOS 动态决定是否继续扩展。',
      takeaways: [],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '实验结果：三项改进最终带来了什么？',
      badge: 'both',
      badgeLabel: '',
      bridge: '',
      analogy: { title: '', text: '', componentId: 'illada-widget' },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '',
          desc: '',
          componentId: 'illada-widget',
        },
        {
          kind: 'module',
          id: '6.v1',
          title: '__validator_hidden_experiment',
          desc: '',
          componentId: 'illada-widget',
        },
      ],
      insight:
        '规模化预训练与统一 SFT 主要提升模型能力；可变长度生成主要完善实际生成机制。',
      takeaways: [],
    },
    {
      kind: 'chapter',
      id: 'chap-7',
      title: '总结：iLLaDA 最终说明了什么？',
      badge: 'both',
      badgeLabel: '',
      bridge:
        '<b>Diffusion LLM 从“可行性验证”走向“规模化竞争力探索”。</b>',
      analogy: { title: '', text: '', componentId: 'illada-widget' },
      modules: [
        {
          kind: 'module',
          id: '7.1',
          title: '',
          desc: '',
          componentId: 'illada-widget',
        },
      ],
      insight:
        'Diffusion LLM 不再只是一个“能不能做”的探索，而开始成为一条真正具有竞争力、并且仍然可以继续 Scale 的大语言模型技术路线。',
      takeaways: [],
    },
  ],
};
