import type { TutorialData } from '../types';

// Data for this tutorial. The `kind` fields are required: validate-output.js counts
// chapters and modules through them, and every `componentId` is registered in
// ../modules/registry.tsx.
//
// Every number below is taken from arXiv 2601.08901v1 (HTML + PDF) and cross-checked
// section by section against the annotated reading notes kept outside this repository.

export const tutorial: TutorialData = {
  meta: {
    titleEn:
      'Navigating the Ideation Space: Probing the Boundaries of LLM-Generated Scientific Ideas',
    titleZh: '在想法空间里航行：探测 LLM 生成科学想法的边界',
    venue: 'arXiv 2601.08901v1',
    authors: 'Shen · Liu · Zhou · Huang',
    affiliation: 'UCSB · Virginia Tech · UC Davis',
    domain: '科学计量 / 表示学习',
    coreProblem:
      '用嵌入相似度衡量「一个想法有多新」，前提是<b>相似度约等于非新颖性</b>。这个前提从来没被验证过，而整条流水线都压在它上面。',
    coreInsight:
      '把一篇论文拆成<b>问题</b>、<b>方法</b>、<b>发现</b>三个子空间，再用<b>跨空间减法</b>把「跃迁」变成一个可检索的对象。代价是三个子空间并不同构，收益是「新在哪」第一次能被指着说。',
    keywords: ['想法空间', '新颖性评估', '科学检索', '跨空间跃迁', '硬负例'],
  },

  hero: {
    oldMethod: {
      componentId: 'hero-single-vector',
      desc: '把整篇论文压成<b>一个向量</b>。标题像、摘要像，就算两篇论文像 —— 至于像在问题还是像在方法，无从分辨。',
    },
    newMethod: {
      componentId: 'hero-decompose',
      desc: '先拆成<b>三个子空间</b>，再在库与库之间做减法（T_PM、T_MF）。相似度不再是一个标量，而是一组带方向的读数。',
    },
  },

  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '三个数字，一个动作',
      badge: 'inf',
      badgeLabel: '问题',
      bridge: '先看这篇论文的赌注：<b>相似度不等于新颖性</b>，而它要在这个赌注上建一整条流水线。',
      analogy: {
        title: '像给想法量身高',
        text: '同一把尺子量遍所有论文，谁高谁矮一眼看出 —— 但尺子量的是身高，不是天分。',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '论文档案：一个想法被劈成三支',
          desc: '左边是论文与它的三个数字，右边是「单点 → 三叉」的分解动作。',
          componentId: 's0-overview',
        },
      ],
      insight: '三个数字里最该记住的是 <b>0.370</b>：它和 GPT-5 Mini 的 0.369 只差 0.001。',
      takeaways: [
        { icon: '📄', title: '一篇论文', desc: '四作者、三机构、93 条想法' },
        { icon: '🔢', title: '三个数字', desc: '0.370 相关、×3 口径、93 样本' },
        { icon: '🔪', title: '一个动作', desc: '把摘要劈成问题 / 方法 / 发现' },
      ],
    },

    {
      kind: 'chapter',
      id: 'chap-2',
      title: '把一篇论文拆成三块',
      badge: 'inf',
      badgeLabel: '输入',
      bridge: '三支不是三个模型，而是对同一段摘要的<b>三次有约束的抽取</b>。',
      analogy: {
        title: '像把一封邮件分成事由、做法、结果',
        text: '同一封邮件按三种问法各读一遍，读出来的东西才分得开。',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '一段摘要，三种问法',
          desc: '左边是真实摘要，三色下划线落在具体字句上；右边三个槽依次接下三个向量。',
          componentId: 's1-decompose',
        },
      ],
      insight:
        '三个单子空间的 R@30 = <b>0.300 / 0.299 / 0.304</b> —— 几乎重合。<b>正交性只是愿望</b>：论文没有测过三个编码器之间的相关性。',
      takeaways: [
        { icon: '✂️', title: '三次抽取', desc: '问题、方法、发现各抽一遍' },
        { icon: '🎯', title: '一次一句', desc: '提示词要求恰好三句，温度取 0' },
        { icon: '⚠️', title: '并不正交', desc: '三个库的分数几乎重合' },
      ],
    },

    {
      kind: 'chapter',
      id: 'chap-3',
      title: '从一个空间跳到另一个空间',
      badge: 'both',
      badgeLabel: '机制',
      bridge: '「新」往往不在任何一个库内部，而在<b>两个库之间</b> —— 所以这里对向量做减法。',
      analogy: {
        title: '像接着问「后来怎么了」',
        text: '问题进、方法出，跨出去那一步才看得见跃迁。',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '虚线框里的那次减法',
          desc: '三个虚线框是三个子空间，跨框箭头就是减法；点 P2M / M2K 切换方向。',
          componentId: 's2-transition',
        },
        {
          kind: 'module',
          id: '3.2',
          title: '跃迁检索到底有没有更强',
          desc: '把 T_PM、T_MF 与 E5 基线放在同一把尺子上，切换绝对值与差值来看。',
          componentId: 's2-cost',
        },
      ],
      formula: {
        lead: '两个跃迁都由一次减法定义，方向相反：',
        unicode:
          'T<sub>PM</sub> = E<sub>method</sub> − E<sub>problem</sub>　　　T<sub>MF</sub> = E<sub>findings</sub> − E<sub>method</sub>',
        symbols: [
          { sym: 'T_PM', desc: '从「在解决什么」指向「怎么做」的跃迁' },
          { sym: 'T_MF', desc: '从「怎么做」指向「得到了什么」的跃迁' },
        ],
      },
      takeaways: [
        { icon: '➖', title: '减法建模', desc: '跃迁 = 两个库向量的差' },
        { icon: '🔀', title: '两个方向', desc: 'P2M 与 M2K 各查各的' },
        { icon: '📉', title: '增益有限', desc: 'R@30 只高 0.008，T_MF 还低 0.012' },
      ],
    },

    {
      kind: 'chapter',
      id: 'chap-4',
      title: '从 259,340 篇里筛硬负例',
      badge: 'trn',
      badgeLabel: '训练',
      bridge: '训练信号不靠随机负例，而靠<b>三道闸</b>从全量文献里筛出「长得像但不是」的近邻。',
      analogy: {
        title: '像在隔壁街区找假同款',
        text: '真正难分的不是外地货，是隔壁那条街的相似款。',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '四站流水线',
          desc: '259,340 篇过三道闸，Qwen3-4B 按三维打分，最后拆成两路负例。',
          componentId: 's3-negatives',
        },
      ],
      insight:
        '三道闸全是手调阈值：<b>≥10 没有敏感性分析</b>，5 年窗口会直接丢掉长程引用 —— 而长程引用恰恰是最硬的负例。',
      takeaways: [
        { icon: '🕳️', title: '三道闸', desc: '5 年窗口 / 直接引用 / 耦合或共引 ≥10' },
        { icon: '⚖️', title: '三维打分', desc: '0.0–1.0、步长 0.2，由 Qwen3-4B 判' },
        { icon: '🎭', title: '两路负例', desc: '批内负例 + 硬概念负例' },
      ],
    },

    {
      kind: 'chapter',
      id: 'chap-5',
      title: '五个库，各查各的',
      badge: 'both',
      badgeLabel: '检索',
      bridge: '三个节点库加两个跃迁库，<b>分数从不融合</b> —— 一次查询换来五组彼此不可比的数。',
      analogy: {
        title: '像五把尺子并排量',
        text: '每把尺子只量自己那一段，谁也不折算成谁。',
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '一次查询，五次召回',
          desc: '上半是五个库各自的召回；下半是那把常驻的 K 轴，看清 ×3 只换了标签。',
          componentId: 's4-retrieval',
        },
      ],
      insight:
        '读这张表先看表注：<b>30 档其实是 10 档</b>。×3 只换了标签，本文的 0.329 不能和外部基准横比。',
      takeaways: [
        { icon: '🗂️', title: '五个库', desc: '3 个节点库 + 2 个跃迁库' },
        { icon: '🚫', title: '不做融合', desc: '五组分数各自报，不折算' },
        { icon: '✖️', title: '口径陷阱', desc: 'K=9/30/90 对应实际 3/10/30' },
      ],
    },

    {
      kind: 'chapter',
      id: 'chap-6',
      title: '拆开算，再称重',
      badge: 'both',
      badgeLabel: '结果',
      bridge: '新颖性 = 1 − 最像的那篇有多像；但「像」要先经过<b>中心性加权</b>，权重从哪来才是关键。',
      analogy: {
        title: '像给每个论据称重',
        text: '要紧的句子压秤，边角句子轻，最后合成一个数。',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '推理图、权重与 0.370',
          desc: '上半是五类节点与加权；下半是结果轴，0.370 与 0.369 重合到画不出两个点。',
          componentId: 's5-evaluate',
        },
      ],
      insight:
        '换成 Spearman，本文 <b>0.384</b>、GPT-5 Mini <b>0.385</b> —— 赢了 0.001 的地方，换个指标就输回去。摘要写 attains，结论 §6 写 comparable，引用时用后者。',
      takeaways: [
        { icon: '🕸️', title: '推理图', desc: '五类节点，7 条逻辑依赖边' },
        { icon: '⚖️', title: '两个中心性', desc: '量纲不同，却等权相加' },
        { icon: '🤝', title: '打成平手', desc: '0.370 对 0.369，n = 93' },
      ],
    },
  ],
};
