import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers',
    titleZh: 'GPTQ：生成式预训练 Transformer 的精确训练后量化',
    venue: 'ICLR 2023',
    authors: 'Elias Frantar, Saleh Ashkboos, Torsten Hoefler, Dan Alistarh',
    affiliation: 'IST Austria · ETH Zurich',
    domain: '大语言模型量化 / 权重量化',
    coreProblem:
      'GPT 类模型（如 OPT-175B）用 FP16 存约 350GB（≈326GiB），推理也需要 5 块 80GB GPU；把权重压到 3–4 bit 是单卡部署的关键。',
    coreInsight:
      '用<b>二阶 Hessian 信息逐层补偿</b>量化误差：量化一个权重后，把误差分摊给尚未量化的权重，175B 模型也能在几小时内压到 3–4 bit。',
    keywords: ['GPT', '权重量化', '二阶信息', '训练后量化'],
  },
  hero: {
    oldMethod: {
      desc: 'RTN 就近取整：每个权重独立舍入，忽略误差在层输出上的累积，3-bit 在大模型上直接崩坏。',
      componentId: 'fp32-bar',
    },
    newMethod: {
      desc: 'GPTQ：用 Hessian 逆逐权重补偿量化误差，175B 模型 4-bit 几乎无损、单卡可跑。',
      componentId: 'int4-bar',
    },
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '千亿参数的部署困境',
      badge: 'inf',
      badgeLabel: '问题引入',
      bridge: 'GPT 类模型动辄上千亿参数：OPT-175B 用 FP16 存要约 350GB，推理也要 5 块 80GB GPU。量化的目标，就是把这份成本压到单卡可承受的范围。',
      analogy: {
        title: '把一间屋子的藏书塞进一个书架',
        text: '175B 参数像一屋子书，量化像把同样的内容换成精简版：书架的格子数（位宽）越少，越省地方，但别丢太多细节。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '位宽直接决定显存',
          desc: '拖动滑块改变<b>量化位数</b>：位数越低，显存越省，但量化误差越大。对千亿参数的模型，这个权衡必须被认真处理。',
          componentId: 'bit-slider',
        },
      ],
      formula: {
        lead: '模型显存占用，大致等于参数量乘每个参数的位数：',
        unicode: '显存 ≈ N × ( bits / 8 ) 字节',
        symbols: [
          { sym: 'N', desc: '模型参数总量（如 1750 亿）。' },
          { sym: 'bits', desc: '每个参数占用的位宽（FP16=16、4-bit=4）。' },
        ],
      },
      takeaways: [
        { icon: '🐘', title: '规模巨大', desc: '175B 模型 FP16 约 350GB，单卡放不下。' },
        { icon: '📉', title: '量化是出路', desc: '3–4 bit 能把模型压到单卡以内。' },
        { icon: '🎯', title: '误差要控制', desc: '位宽越低，误差控制越关键。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: 'RTN 在大模型上为何失效',
      badge: 'inf',
      badgeLabel: '基础概念',
      bridge: '最朴素的量化是 RTN（就近取整）。它在小模型上够用，但在大模型 3-bit 下直接崩坏——这正是 GPTQ 要解决的首要问题。',
      analogy: {
        title: '每个人都往最近的格子站',
        text: 'RTN 像让每个人各自站到最近的格子：每个人单独看都对，但一群人挤出来的整体误差却很大。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '就近取整：只看单个权重',
          desc: '切换舍入方式感受 RTN 的本质：它只按「离哪个量化点近」决定方向，完全不考虑这个误差会怎样影响层输出。',
          componentId: 'round-chips',
        },
      ],
      insight: 'RTN 的缺陷不是「每个权重误差大」，而是它忽略了误差在输出上的累积。',
      takeaways: [
        { icon: '🎯', title: 'RTN 是基线', desc: '就近取整是最简单、最常用的量化方式。' },
        { icon: '💥', title: '大模型崩坏', desc: '3-bit RTN 在 OPT 上困惑度飙到 10³~10⁴ 量级。' },
        { icon: '🔍', title: '根因是累积', desc: '逐权重的独立误差在层输出上被放大。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '核心洞见：量化误差要补偿',
      badge: 'inf',
      badgeLabel: '核心洞见',
      bridge: 'GPTQ 继承 OBQ 的想法：一次量化一个权重，然后用 Hessian 逆把它的误差「分摊」给尚未量化的权重，在输出层面把误差抵消掉。',
      analogy: {
        title: '拼图缺一块，用旁边几块补',
        text: '量化一个权重像拼图少了一块：与其硬塞，不如微调周围几块的位置，把缺口在整体上补齐。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '逐权重量化 + 补偿',
          desc: '点「下一步」观察逐权重的过程：每量化一个权重，就用 Hessian 逆把误差分摊给剩余权重，逐层把整体误差压下去。',
          componentId: 'layer-step',
        },
        {
          kind: 'module',
          id: '3.2',
          title: '补偿的顺序：共享还是逐行贪心',
          desc: 'OBQ 对每一行都单独按误差排序（逐行贪心），GPTQ 让所有行共享同一顺序。切换对比两者的精度与速度差异。',
          componentId: 'order-share',
        },
      ],
      formula: {
        lead: 'OBQ 的误差补偿：量化第 q 个权重后，用 Hessian 逆把误差分摊给剩余权重：',
        unicode: 'δ_F = −( w_q − quant(w_q) ) / [H⁻¹]_qq · (H⁻¹)_:q',
        symbols: [
          { sym: 'w_q', desc: '第 q 个待量化的权重。' },
          { sym: 'quant', desc: '量化（舍入）操作。' },
          { sym: 'H⁻¹', desc: 'Hessian 的逆，决定误差如何分摊。' },
          { sym: 'δ_F', desc: '对剩余权重的补偿向量。' },
        ],
      },
      insight: '量化误差不是不可控的：用 Hessian 逆把误差「分摊」出去，就能把它压到很小。',
      takeaways: [
        { icon: '🧭', title: '误差可补偿', desc: '量化一个权重，用其余权重把误差补回来。' },
        { icon: '🔢', title: 'Hessian 逆是核心', desc: '它决定误差按什么比例分摊。' },
        { icon: '⚡', title: '无需重训', desc: '整个过程是纯解析的，不迭代。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '数学：二阶 Hessian 信息',
      badge: 'both',
      badgeLabel: '数学框架',
      bridge: '为什么用 Hessian？因为不同权重的扰动对输出误差的影响不是独立的——二阶信息精确刻画了它们之间的联合影响。',
      analogy: {
        title: '关键零件要更精确',
        text: '像修表：关键齿轮要精修，装饰件可以粗一点。Hessian 告诉我们哪些权重的扰动更「要命」。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '权重误差 ≠ 输出误差',
          desc: '对比两种「最小化」的对象：RTN 只让单个权重离量化点近，GPTQ 让 Hessian 加权的输出误差最小——两者不是一回事。',
          componentId: 'round-chips',
        },
      ],
      formula: {
        lead: '对某一层，量化带来的输出误差可近似为二次型：',
        unicode: 'E ≈ ( W − Ŵ )ᵀ H ( W − Ŵ )',
        symbols: [
          { sym: 'E', desc: '量化引起的输出误差。' },
          { sym: 'W', desc: '原始权重。' },
          { sym: 'Ŵ', desc: '量化后的权重。' },
          { sym: 'H', desc: 'Hessian 矩阵，刻画误差的二阶影响。' },
        ],
      },
      insight: 'Hessian 的非对角元就是权重扰动之间的「交叉项」——RTN 看不到它们，GPTQ 正是靠它们做补偿。',
      takeaways: [
        { icon: '🔢', title: '二次型误差', desc: '误差由 Hessian 加权，而非均匀看待。' },
        { icon: '🔗', title: '交叉项', desc: '非对角元描述权重之间的联合影响。' },
        { icon: '🎯', title: '加权补偿', desc: '按 Hessian 逆的比例分摊误差。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '顺序共享：把复杂度降下来',
      badge: 'trn',
      badgeLabel: '方法实现',
      bridge: 'OBQ 的复杂度是 O(d_row·d_col³)，对千亿参数完全不可行。GPTQ 的第一个关键改造，就是让所有行共享同一量化顺序。',
      analogy: {
        title: '让整列火车用同一套检修顺序',
        text: '逐行贪心像给每节车厢单独设计检修顺序，共享顺序则是一套顺序用到底——快得多，代价却很小。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '共享顺序 vs 逐行贪心',
          desc: '切换对比：共享顺序让 H⁻¹ 全行复用，更新次数从 d_row·d_col 降到 d_col，复杂度降为 O(max{d_row·d_col², d_col³})。',
          componentId: 'order-share',
        },
      ],
      formula: {
        lead: '顺序共享后，GPTQ 的整体复杂度：',
        unicode: 'O( max{ d_row·d_col², d_col³ } )',
        symbols: [
          { sym: 'd_row', desc: '权重的行数（输出维度）。' },
          { sym: 'd_col', desc: '权重的列数（输入维度）。' },
        ],
      },
      insight: '这是算法层面的关键洞察：贪心顺序的优势在大模型上很小，放弃它能换来数量级的加速。',
      takeaways: [
        { icon: '📉', title: '复杂度下降', desc: '从三次方降到二次方级别。' },
        { icon: '🔁', title: '顺序共享', desc: '所有行用同一顺序，H⁻¹ 全行复用。' },
        { icon: '⚖️', title: '精度代价小', desc: '贪心顺序的优势在规模越大时越小。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '懒惰批量更新：打破访存瓶颈',
      badge: 'trn',
      badgeLabel: '方法实现',
      bridge: '即便顺序共享了，朴素实现还是被内存带宽卡住。GPTQ 的第二个改造是惰性批量更新：按列分块，块内只更新当前列，块末才统一更新块外。',
      analogy: {
        title: '一次搬一整箱，而不是一个个搬',
        text: '懒惰更新像把要搬的东西攒成一箱再搬：访存次数少了，吞吐就上去了。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '分块批量更新',
          desc: '点「下一步」看 B=128 列分块的过程：块内逐列量化并补偿，块末统一更新块外权重，大幅提高计算/访存比。',
          componentId: 'layer-step',
        },
      ],
      insight: 'AdaRound 的瓶颈是迭代次数，GPTQ 的瓶颈是访存——工程瓶颈完全不同。',
      takeaways: [
        { icon: '🧱', title: '列分块 B=128', desc: '块内只更新当前列。' },
        { icon: '🚀', title: '提高访存比', desc: '块末统一更新，减少内存搬运。' },
        { icon: '🔧', title: '纯工程优化', desc: '不改变算法语义，只提升实现效率。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-7',
      title: 'Cholesky 稳定化',
      badge: 'trn',
      badgeLabel: '方法实现',
      bridge: '反复更新 H⁻¹ 会累积数值误差，在大模型上让 H⁻¹ 变成不定矩阵、更新方向全错。GPTQ 用 Cholesky 分解预计算并加阻尼解决。',
      analogy: {
        title: '防止量尺越量越偏',
        text: '反复用一把会磨损的尺子，越量越偏；Cholesky 就像先校准好尺子，再一次性稳定地量。',
        componentId: 'grid-analog',
      },
      modules: [],
      formula: {
        lead: '为避免反复更新 H⁻¹ 的数值漂移，先对正则化后的 Hessian 做 Cholesky 分解：',
        unicode: 'H + λI = LLᵀ',
        symbols: [
          { sym: 'H', desc: 'Hessian 矩阵。' },
          { sym: 'λ', desc: '阻尼项，约为对角均值的 1%。' },
          { sym: 'L', desc: 'Cholesky 下三角因子。' },
        ],
      },
      insight: '这一条是纯数值工程：它不改变算法思想，但决定了大模型上更新方向是否正确。',
      takeaways: [
        { icon: '🛡️', title: '数值稳定', desc: '避免 H⁻¹ 反复更新的累积误差。' },
        { icon: '🔺', title: 'Cholesky 分解', desc: '预计算稳定因子。' },
        { icon: '💧', title: '约 1% 阻尼', desc: '保证矩阵正定。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-8',
      title: 'group-size：精度与开销的旋钮',
      badge: 'trn',
      badgeLabel: '实用技巧',
      bridge: 'group-size 决定多少个权重共享一个缩放因子：组越小精度越高但开销越大，组越大越省但精度越低。这是一个可调的工程旋钮。',
      analogy: {
        title: '分多少个抽屉',
        text: 'group-size 像决定把物品分装进多少个抽屉：抽屉越多越精确但越费地方，越少越省但越粗糙。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '8.1',
          title: '拖动 group-size 看权衡',
          desc: '拖动滑块改变 group-size：1 表示逐权重缩放（精度高、开销大），-1 表示整层共享一个尺度（最省、精度最低），128 是常见折中。',
          componentId: 'group-size',
        },
      ],
      insight: 'group-size 是 GPTQ 在部署时最常调的超参数：它在精度与显存/速度之间取一个折中。',
      takeaways: [
        { icon: '🎚️', title: '可调旋钮', desc: 'group-size 在精度与开销之间折中。' },
        { icon: '📦', title: '常见取 128', desc: '128 是精度与开销的平衡点。' },
        { icon: '⚖️', title: '逐权重最准', desc: 'group-size=1 精度最高但开销最大。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-9',
      title: '实验：OPT-175B 的 3/4-bit 表现',
      badge: 'both',
      badgeLabel: '结果',
      bridge: '在 OPT、BLOOM 上，GPTQ 的 4-bit 困惑度几乎无损，3-bit 略有下降，而 RTN 在 3-bit 直接崩坏；量化耗时仅约 4 小时。',
      analogy: {
        title: '缩水不缩质量',
        text: 'GPTQ 像把照片压成小图：文件小了很多，但看起来几乎没差别。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '9.1',
          title: '显存收益对比',
          desc: '点击开始对比：3–4 bit 把模型体积大幅缩小，这是量化最直接的收益。',
          componentId: 'quant-race',
        },
        {
          kind: 'module',
          id: '9.2',
          title: '位数与困惑度的关系',
          desc: '拖动位数观察：4-bit 困惑度 8.34→8.37（+0.03），3-bit 约 8.68；而 RTN 在 3-bit 崩到约 5.8×10³。',
          componentId: 'bit-slider',
        },
      ],
      insight: 'GPTQ 的 4-bit 把 OPT-175B 压进单张 80GB GPU（FP16 需 5 张），并在 A100 上加速约 3.24×、A6000 上约 4.53×。',
      takeaways: [
        { icon: '📉', title: '4-bit 几乎无损', desc: '困惑度仅 +0.03。' },
        { icon: '⏱️', title: '约 4 小时量化', desc: '单张 A100 即可完成 175B。' },
        { icon: '🚀', title: '单卡可跑', desc: '3-bit 约 63GB，首次塞进 80GB GPU。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-10',
      title: '边界、局限与批判性思考',
      badge: 'both',
      badgeLabel: '结果与局限',
      bridge: '最后看 GPTQ 的适用边界：它主要解决「权重怎么舍入」，3-bit 仍有精度损失，加速来自访存而非计算，且校准数据与评测数据的重叠尚未被量化。',
      analogy: {
        title: '尺子虽好，也有量不到的地方',
        text: 'GPTQ 这把「尺子」在 4-bit 很准，但 3-bit 会抖，而且它的加速只对访存受限的场景有效。',
        componentId: 'grid-analog',
      },
      modules: [
        {
          kind: 'module',
          id: '10.1',
          title: '顺序共享的代价',
          desc: '切换对比：顺序共享是 GPTQ 的关键加速手段，但在小模型上会带来约 0.3–0.5 PPL 的代价（论文表 1 中 GPTQ 3-bit ResNet 与 AdaRound 相差约 0.49 点）。',
          componentId: 'order-share',
        },
      ],
      insight: 'GPTQ 与同样作用于权重舍入的 AdaRound 是「精度—规模」轴上的两个点：AdaRound 在 25M 的 ResNet 上把 4-bit 精度做到接近 FP，但迭代慢、上不了大模型；GPTQ 放弃方向优化、换成解析补偿，换来 175B 的可行。其余边界与缺口包括：① 3-bit 精度下降；② 加速来自访存、只对生成式小 batch 有效；③ 校准与评测都用 C4、重叠未量化；④ 「大模型为何更好量化」只报告趋势未解释（可用 Hessian 条件数理解）。',
      takeaways: [
        { icon: '🔀', title: '与 AdaRound 互补', desc: '小模型更准 vs 大模型更快，并非替代。' },
        { icon: '⚖️', title: '3-bit 是权衡点', desc: '更省但精度下降更明显。' },
        { icon: '🧭', title: '加速来自访存', desc: '只对生成式、小 batch 有效。' },
      ],
    },
  ],
};
