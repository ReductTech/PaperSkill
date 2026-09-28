import type { TutorialData } from '../types';

// ============================================================================
//  GPTQ 交互式导读 —— 天平/砝码 隐喻
//  主线：FP16 超出显存 → RTN 精度退化 → 误差补偿直觉 → 二阶 Hessian → 顺序+分块批量
//        → Cholesky → group-size → 完整算法 → 实验结果 → 边界与后续
//  所有实验数字锚定 arXiv:2210.17323 原文表格（Table 1–7）。
// ============================================================================

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers',
    titleZh: 'GPTQ：生成式预训练 Transformer 的精确后训练量化',
    venue: 'ICLR 2023',
    authors: 'Elias Frantar, Saleh Ashkboos, Torsten Hoefler, Dan Alistarh',
    affiliation: 'IST Austria / ETH Zürich',
    domain: '大模型量化 / 后训练量化（PTQ）/ 模型压缩',
    coreProblem:
      'GPT3-175B 的 FP16 权重占 326GB，超过任何单卡容量，推理必须多卡；而既有 PTQ 方法要么只能扩到千亿参数却只敢用 8-bit（RTN），要么精度够但慢到无法上大模型。',
    coreInsight:
      'GPTQ 用近似二阶 Hessian 信息做 one-shot 逐层量化：每量化一个权重，就把误差按敏感度方向推给同层还未量化的权重去吸收；再用「任意顺序 + 分块批量 + Cholesky」把这件事从 OBQ 的 O(d³) 提速到 4 GPU 小时量化完 175B，首次让 175B 模型在单卡内生成推理。',
    keywords: ['后训练量化', 'GPTQ', 'Hessian', '误差补偿', 'Cholesky', '4-bit', '175B'],
  },
  hero: {
    oldMethod: {
      desc: 'RTN 直接四舍五入：4bit 困惑度上升 2.2，3bit 激增到 7.3×10³。',
    },
    newMethod: {
      desc: 'GPTQ 二阶误差补偿：4bit 仅上升 0.03，约 4.2 GPU 小时量化完 175B。',
    },
    pillars: [
      { index: '01', title: 'Hessian 二阶信息', desc: '度量各权重方向对输出的影响，用于误差补偿' },
      { index: '02', title: 'Layer-wise Lazy Batch', desc: '懒惰批量更新，量化一列，补偿剩余未量化权重' },
      { index: '03', title: 'Cholesky Reformulation', desc: 'Cholesky 重写，解决大矩阵 Hessian 求逆的数值不稳定' },
    ],
    metrics: [
      { value: '4.2 GPU 小时', label: '单张 A100 量化 OPT-175B' },
      { value: '8.34 → 8.37', label: 'WikiText2 困惑度 FP16 → GPTQ-4bit' },
      { value: '最高 4.5×', label: '端到端生成推理加速' },
    ],
    conditions:
      '论文报告条件：OPT-175B 模型、单张 A100；4bit 量化约 4.2 GPU 小时；WikiText2 困惑度 FP16=8.34、GPTQ-4bit=8.37、GPTQ-3bit=8.68，RTN-3bit 直接崩溃；group-size 是关键超参。以上为论文报告实验条件，不是所有硬件配置都能复现。',
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '作者想回答的问题：175B 能否在 3–4bit 下保持可用精度？',
      badge: 'inf',
      badgeLabel: '基础',
      bridge: '一切从大模型最现实的困境说起：GPT3-175B 太大，FP16 要 326GB，超出单卡显存；而直接量化到低比特又会导致精度显著退化。作者真正要回答的问题，就藏在这个两难里。',
      analogy: {
        title: '量化的舍入损失',
        text: '最近邻舍入将连续权值映射至离散量化网格，引入不可忽略的舍入误差。',
        componentId: 'analogy-scale',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '三种状态对比：超出显存 vs 精度退化 vs 精度可控',
          desc: '切换 FP16 / RTN / GPTQ 目标三种状态，看清「作者想回答什么问题」——把 175B 压到 3–4bit，能否保持精度、且无需重训。',
          componentId: 'ch1-problem',
        },
      ],
      takeaways: [],
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '现有量化方法的瓶颈：RTN 为何在大模型上失效',
      badge: 'inf',
      badgeLabel: '基础',
      bridge: '最近邻舍入（RTN）是最直接的量化方式，在 8-bit 下尚可接受；但在 3–4bit 下精度显著退化。原因在于量化网格与舍入误差的尺度。',
      analogy: {
        title: '离散量化网格',
        text: '权值被约束于有限离散层级，位宽越低、量化步长越大，舍入误差越显著。',
        componentId: 'analogy-scale',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '量化网格与误差累积',
          desc: '切换位宽观察量化网格的稀疏程度与舍入误差，并查看误差在多层网络中的逐层累积。',
          componentId: 'ch2-rtn',
        },
      ],
      insight:
        'RTN 逐权重独立舍入，各权重的误差互不补偿。随网络深度增加，舍入误差在层间逐级累积，导致大模型困惑度严重退化——这正是其 3-bit 失效的根本原因，也构成了 GPTQ 引入误差补偿机制的动机。',
      formula: {
        lead: '在固定网格上，量化就是把 w 舍入到最近的可表示值；级别数由位宽决定。',
        unicode: 'q = round(w / s) · s',
        symbols: [
          { sym: 'q', desc: '量化后的值（落在网格上）' },
          { sym: 's', desc: '量化步长：相邻两刻度之间的距离' },
          { sym: 'round', desc: '四舍五入到最近整数级别' },
        ],
      },
      takeaways: [],
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: 'GPTQ 核心直觉：不能独立量化每个权重，要做误差补偿',
      badge: 'inf',
      badgeLabel: '基础',
      bridge: '既然 RTN 的缺陷在于各权重误差独立累积，GPTQ 反过来提出：量化某一权重产生的误差，应补偿至同层尚未量化的权重，而非直接丢弃。',
      analogy: {
        title: '误差补偿机制',
        text: '量化某一权重产生的误差，可由同层未量化权重按 Hessian 方向吸收，保持层输出近似不变。',
        componentId: 'analogy-scale',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '量化 → 误差 → 补偿给剩余权重',
          desc: '逐步观察：量化 w₁ 产生误差 Δw，再按 Hessian 方向把误差补偿给同层未量化权重，使输出近似不变。',
          componentId: 'ch3-compensate',
        },
      ],
      insight:
        '整网量化被分解为逐层重建：每层最小化 ‖WX−ŴX‖²。GPTQ 的核心机制（继承自 OBQ）在于：量化某一权重后，立即由同层未量化权重补偿其误差，使层输出近似不变。',
      formula: {
        lead: '补偿更新：把当前权重的量化误差按 Hessian 方向分摊到剩余权重。',
        unicode: 'W_rem ← W_rem − (W_rem·H⁻¹)·(w − ŵ)',
        symbols: [
          { sym: 'W_rem', desc: '尚未量化的剩余权重' },
          { sym: 'H⁻¹', desc: 'Hessian 的逆：决定补偿方向' },
          { sym: 'w − ŵ', desc: '当前权重的量化误差' },
        ],
      },
      takeaways: [],
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '为什么二阶 Hessian 信息对量化至关重要',
      badge: 'both',
      badgeLabel: '核心',
      bridge: '补偿不能任意分配，需确定补偿的方向与幅度。关键在于：哪些权重方向对误差最敏感？',
      analogy: {
        title: '二阶敏感度',
        text: 'Hessian 刻画各权重方向对损失的敏感度，敏感方向上的量化误差影响更为显著。',
        componentId: 'analogy-scale',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '损失曲面上的敏感度对比',
          desc: '对比平坦与陡峭两个权重方向：同样的量化误差，在敏感方向上造成的损失上升更显著。',
          componentId: 'ch4-hessian',
        },
      ],
      insight:
        '逐层重建目标的 Hessian 恰为 H ≈ 2XXᵀ（X 为该层输入激活），无需真实二阶导数。它刻画各权重方向的敏感度：Hessian 越大的方向，量化误差对损失的影响越显著，补偿时应优先保持这些方向不偏移。',
      formula: {
        lead: '用泰勒展开到二阶，量化造成的损失变化近似为：',
        unicode: 'ΔL ≈ ½·Δwᵀ·H·Δw',
        symbols: [
          { sym: 'ΔL', desc: '损失的变化量' },
          { sym: 'Δw', desc: '权重误差向量' },
          { sym: 'H', desc: 'Hessian 近似矩阵（H≈2XXᵀ）' },
        ],
      },
      takeaways: [],
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '逐层量化：顺序选择与懒惰批量更新机制',
      badge: 'both',
      badgeLabel: '核心',
      bridge: '有了二阶信息，还需解决两个工程问题：量化顺序如何选择？以及如何解决更新过程中的内存带宽瓶颈？',
      analogy: {
        title: '固定顺序与分块批量',
        text: '以固定列序替代贪心选择，按块批量更新，降低计算与访存开销。',
        componentId: 'analogy-scale',
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '对比贪心与固定顺序',
          desc: '切换两种顺序对比累计误差：固定顺序（GPTQ）误差略高但可忽略，却省去整套贪心搜索。',
          componentId: 'ch6-order',
        },
        {
          kind: 'module',
          id: '5.2',
          title: 'Lazy Batch：128 列 group 的延迟更新',
          desc: '逐步观察：量化 group 内列时 group 内立即更新、group 后延迟；group 完成后统一更新，减少 IO。',
          componentId: 'ch5-lazy-batch',
        },
      ],
      insight:
        'GPTQ 用「任意顺序 + Lazy Batch-Updates」解决顺序与带宽两大瓶颈：前者使每行可并行计算、复杂度降一个因子；后者通过 128 列 group 的延迟更新，将频繁的小块读写聚合为大块读写，缓解内存带宽压力。',
      formula: {
        lead: '固定顺序带来的复杂度下降：',
        unicode: 'O(d_row·d_col³) → O(max{d_row·d_col², d_col³})',
        symbols: [
          { sym: 'd_row', desc: '权重矩阵的行数（输出维度）' },
          { sym: 'd_col', desc: '权重矩阵的列数（输入维度）' },
          { sym: 'max', desc: '取两者较大者，减少因子为 min{d_row, d_col}' },
        ],
      },
      takeaways: [],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: 'Cholesky 分解：解决 Hessian 矩阵的数值稳定性灾难',
      badge: 'trn',
      badgeLabel: '进阶',
      bridge: '批量更新解决了访存瓶颈，却引入数值问题：反复套用更新公式使 H⁻¹ 失去正定性，导致算法沿错误方向更新。',
      analogy: {
        title: 'Cholesky 分解',
        text: '将对称正定的 Hessian 分解为下三角因子，保证更新过程的数值稳定。',
        componentId: 'analogy-scale',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: 'Cholesky 分解：H → L·Lᵀ',
          desc: '逐步观察对称正定的 H 如何分解为下三角 L，并理解其如何避免数值不稳定、减少更新计算。',
          componentId: 'ch6-cholesky',
        },
      ],
      insight:
        'Cholesky 分解将 H 分解为下三角 L，既避免 H⁻¹ 失去正定性，又无需逐列更新海森矩阵，同时实现数值稳定与计算量下降。',
      formula: {
        lead: 'Cholesky 分解把正定的 H 写成下三角阵与其转置的乘积：',
        unicode: 'H = L·Lᵀ',
        symbols: [
          { sym: 'H', desc: 'Hessian 近似（对称正定，加 dampening 后）' },
          { sym: 'L', desc: '下三角矩阵（Cholesky 因子）' },
          { sym: 'Lᵀ', desc: 'L 的转置' },
        ],
      },
      takeaways: [],
    },
    {
      kind: 'chapter',
      id: 'chap-7',
      title: 'Group-size 分组量化：精度、显存与速度的权衡参数',
      badge: 'trn',
      badgeLabel: '进阶',
      bridge: '一个方法即使精度再高，若校准依赖海量数据便不实用。GPTQ 仅需 128 个 C4 片段，另有一个可调参数：group-size。',
      analogy: {
        title: '分组量化',
        text: '对连续权重分组独立量化，在精度与额外存储开销之间权衡。',
        componentId: 'analogy-scale',
      },
      modules: [
        {
          kind: 'module',
          id: '7.1',
          title: 'Group-size：精度与存储的权衡',
          desc: '对比不同 group size 下 OPT-175B 的困惑度（越低越好），理解「更细粒度换取更小误差」所需的额外开销。',
          componentId: 'ch7-group',
        },
      ],
      insight:
        '校准数据仅含 128 个随机的 2048-token C4 片段（随机爬取的网页，通用文本），不含任何任务特定数据，因此是真正的 zero-shot。group size 则是对 g 个连续权重独立量化：g 越小误差越小，但每组的缩放与零点引入额外开销（约 +0.02~0.15 bit/权重）。',
      takeaways: [],
    },
    {
      kind: 'chapter',
      id: 'chap-8',
      title: 'GPTQ 完整算法三步拆解',
      badge: 'trn',
      badgeLabel: '进阶',
      bridge: '将「任意顺序 + 分块批量 + Cholesky」三个机制整合，即得到 GPTQ 的完整算法。',
      analogy: {
        title: '完整算法流程',
        text: '任意顺序、分块批量与 Cholesky 三者整合为完整的逐层量化流程。',
        componentId: 'analogy-scale',
      },
      modules: [
        {
          kind: 'module',
          id: '8.1',
          title: '逐步走一遍 GPTQ 算法',
          desc: '按论文 Algorithm 1 逐步执行：逐列量化、记录误差、块内更新、整块批量更新，观察 Q 如何从零逐步构成完整量化权重。',
          componentId: 'ch8-alg',
        },
      ],
      insight:
        '完整算法以 H⁻¹=(2XXᵀ+λI)⁻¹ 与块大小 B 为输入；块内逐列量化并更新块内剩余列，整块处理完成后更新所有剩余列。全程仅需一次 Cholesky 分解信息，数值稳定。',
      formula: {
        lead: '算法里最关键的一步：量化一列后更新块内剩余列。',
        unicode: 'W[:,j:] ← W[:,j:] − E · H⁻¹[j, j:]',
        symbols: [
          { sym: 'E', desc: '本列量化误差（除以对角元之后）' },
          { sym: 'H⁻¹[j, j:]', desc: 'Hessian 逆第 j 行从对角开始的部分' },
          { sym: 'W[:,j:]', desc: '块内尚未量化的剩余列' },
        ],
      },
      takeaways: [],
    },
    {
      kind: 'chapter',
      id: 'chap-9',
      title: '实验结果：OPT-175B 上 3/4bit 量化对比基线',
      badge: 'both',
      badgeLabel: '结果',
      bridge: '本章考察实验数据：GPTQ 相对于 RTN 与 FP16 基线的表现，以及数据实际支持何种结论。',
      analogy: {
        title: '量化精度对比',
        text: '随位宽降低，量化精度呈明显分层：4bit 近乎无损，3bit 可用，RTN 3bit 显著退化。',
        componentId: 'analogy-scale',
      },
      modules: [
        {
          kind: 'module',
          id: '9.1',
          title: '困惑度与延迟对比',
          desc: '对比 OPT-175B 在 WikiText2 上的困惑度（FP16 8.34 / RTN-4bit 10.54 / GPTQ-4bit 8.37 / GPTQ-3bit 8.68）与端到端生成延迟。',
          componentId: 'ch9-results',
        },
      ],
      takeaways: [],
    },
    {
      kind: 'chapter',
      id: 'chap-10',
      title: 'GPTQ 边界、局限、后续工作与现实工程落地',
      badge: 'both',
      badgeLabel: '结果',
      bridge: '本章总结 GPTQ 相对已有工作的增量贡献，并指出其明确边界与未解决的问题。',
      analogy: {
        title: '方法的边界',
        text: '极端低比特下精度损失依然显著，方法存在明确边界。',
        componentId: 'analogy-scale',
      },
      modules: [
        {
          kind: 'module',
          id: '10.1',
          title: '逐条查看 GPTQ 的边界',
          desc: '切换查看五条边界：2bit 损失、依赖校准集、Hessian 显存开销、加速来自内存带宽、未量化激活。',
          componentId: 'ch10-bounds',
        },
      ],
      insight:
        'GPTQ 将基于二阶信息的精确 PTQ 首次扩展至 175B 规模；其局限同样明确：加速来自内存带宽而非计算量，未量化激活，极端 2-bit 仍有明显损失。',
      takeaways: [],
    },
  ],
};
