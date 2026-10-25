import type { TutorialData } from '../types';

// ============================================================================
//  论文专用内容 —— 生成器唯一改写的文件。
//  对应论文：Boosting Continual Learning of Vision-Language Models via
//  Mixture-of-Experts Adapters（CVPR 2024）。
//  统一生活主题：水彩调色与上色（一支画笔 / 一个调色盘 / 一排颜料管）。
// ============================================================================

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'Boosting Continual Learning of Vision-Language Models via Mixture-of-Experts Adapters',
    titleZh: '借助专家混合适配器提升视觉-语言模型的持续学习',
    venue: 'CVPR 2024 · IEEE/CVF',
    authors: 'Jiazuo Yu, Yunzhi Zhuge, Lu Zhang, Ping Hu, Dong Wang, Huchuan Lu, You He',
    affiliation: '大连理工大学 · 电子科技大学 · 清华大学',
    domain: '视觉-语言模型 · 持续学习',
    coreProblem:
      '大规模视觉-语言模型要在持续学习中不断吸收新任务，却会因参数漂移丢失历史知识；已有的动态扩展方法区分不出未见过数据，而全量微调又带来巨大算力开销。',
    coreInsight:
      '把 LoRA 适配器当作 MoE 中的稀疏专家、冻结 CLIP 主干，每个新任务只增加一个任务专属路由器，再用 DDAS 按重建误差把输入自动分给 MoE 适配器或原始 CLIP。',
    keywords: ['持续学习', 'MoE 适配器', '零样本迁移', 'CLIP', '参数高效微调'],
  },
  hero: {
    oldMethod: {
      desc: '传统动态扩展与全量微调：为每个任务加一套分支或整网更新，无法区分未见过数据，训练参数多，历史知识容易被覆盖。',
      figure: './images/figure-1-traditional.png',
    },
    newMethod: {
      desc: 'MoE-Adapter + DDAS：主干保持冻结，任务专属路由器从 22 个 LoRA 专家中稀疏挑选；DDAS 把未见过的输入交回原 CLIP 做零样本分类。',
      figure: './images/figure-1-ours.png',
    },
  },
  chapters: [
    // ------------------------------------------------------------------ 1
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '同一支笔反复覆盖：持续学习的两难',
      badge: 'inf',
      badgeLabel: '问题',
      bridge:
        '从最直观的失败开始：让模型依次学 11 个任务，但每个阶段只能看到当前数据，看它会不会把以前的本领忘掉。',
      analogy: {
        title: '在同一张画上反复覆盖',
        text: '一支画笔在已经画好的纸上来回刷<b>新颜色</b>，旧的色块被一点点糊掉。持续学习里的“灾难性遗忘”正是这样发生的。',
        componentId: 'ana-1',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '微调幅度与旧任务的褪色',
          desc: '拖动滑块控制每步更新对主干参数的<b>改动幅度</b>：左侧旧任务的色块随幅度增大而褪色变红，右侧同时给出旧任务保持率与新任务适应度（曲线为示意，端点为论文 Table 1 的取值）。',
          componentId: 'mod-1-1',
        },
      ],
      insight:
        '改动越大，新任务学得越好、旧任务掉得越多——除非根本不让主干被改写。',
      formula: {
        lead: '论文用三个指标衡量多域任务增量学习（MTIL）的表现：',
        unicode:
          'Transfer：在<b>未见数据</b>上的零样本迁移能力<br>Last：对<b>历史任务</b>的记忆能力<br>Average：两者的综合表现',
        symbols: [
          { sym: 'Transfer', desc: '模型未见过的数据集上的准确率，越高说明零样本能力保留得越好。' },
          { sym: 'Last', desc: '学完全部任务后，回头测历史任务的准确率，越高说明遗忘越少。' },
          { sym: 'Average', desc: '综合 Transfer 与 Last 的指标，论文用它概括整体水平。' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '问题所在', desc: '参数漂移带来的灾难性遗忘，是持续学习最核心的障碍。' },
        { icon: '🔧', title: '两条老路', desc: '动态扩展能记住但认不出新数据；全量微调能适应但开销大、掉得快。' },
        { icon: '✨', title: '本文追问', desc: '能不能既保留预训练基础模型的零样本能力，又低代价地持续扩张？' },
      ],
    },
    // ------------------------------------------------------------------ 2
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '图文对照：CLIP 的双塔表示',
      badge: 'inf',
      badgeLabel: '表示',
      bridge:
        '要看懂“忘记”发生在哪里，先看清 CLIP 是怎么把一张图和一组类名放进同一个空间里比较的。',
      analogy: {
        title: '让画稿对准色卡',
        text: '画笔把画稿上取到的颜色<b>牵引</b>到最接近的那张色卡上，落在哪一格，就判成哪个类名。',
        componentId: 'ana-2',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '点开双塔结构：图像塔、文本塔与余弦相似度',
          desc: '点击画布中的任一部件（或使用下方按钮、键盘左右方向键），右侧细节区会说明它在图文匹配中的分工与张量尺寸。',
          componentId: 'mod-2-1',
        },
      ],
      insight:
        '零样本能力正是来自这套图文对照：它必须被原封不动地保留下来。',
      formula: {
        lead: '图像特征与文本特征投影到同一空间后做余弦比较，取相似度最高的类名：',
        unicode:
          's<sub>j</sub> = cos( <i>F<sub>I</sub></i>(I), <i>F<sub>T</sub></i>(c<sub>j</sub>) )&nbsp;&nbsp;→&nbsp;&nbsp;ŷ = argmax<sub>j</sub> s<sub>j</sub>',
        symbols: [
          { sym: 'F_I', desc: '图像编码器，把图像编码成特征向量。' },
          { sym: 'F_T', desc: '文本编码器，把类名编码成同维度的特征向量。' },
          { sym: 'c_j', desc: '第 j 个类名，例如 “a photo of a lotus”。' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '两个编码器', desc: 'CLIP 用一对并行编码器分别处理图像与文本，参数互不共享。' },
        { icon: '🔧', title: '零样本从哪来', desc: '类名本身被编码成向量，因此没见过的新类别也能直接判。' },
        { icon: '✨', title: '持续学习的要求', desc: '任何微调都必须在这套对照关系上尽量少动手。' },
      ],
    },
    // ------------------------------------------------------------------ 3
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '别在原画上覆盖：贴上可揭下的色片',
      badge: 'inf',
      badgeLabel: '洞见',
      bridge:
        '既然遗忘来自“改写主干”，那就换一种加法：主干原封不动，只在上面叠加一层可拆卸的少量参数。',
      analogy: {
        title: '贴上透明色片',
        text: '一片半透明色片轻轻落在画上：底下的<b>原画依然清晰</b>，新颜色只是叠加上去，随时可以揭下。',
        componentId: 'ana-3',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '同一时间轴上的两种改法',
          desc: '点击“开始对比”，两侧从同一个起点出发、依次学习同样的 11 个任务：左侧把主干整网更新，右侧冻结主干只叠加轻量适配器。',
          componentId: 'mod-3-1',
        },
      ],
      insight:
        '冻结主干 + 轻量适配器，让“学新任务”和“保旧能力”第一次可以同时成立。',
      takeaways: [
        { icon: '🎯', title: '可逆的叠加', desc: '参数高效的适配器只增加极少量可训练参数，主干不被改写。' },
        { icon: '🔧', title: '对比的结果', desc: '同一任务序列下，左侧旧任务褪色，右侧历史任务仍可辨认。' },
        { icon: '✨', title: '留下的问题', desc: '如果每个任务各贴一片、彼此独立，就仍然需要人工指明“现在该用哪一片”。' },
      ],
    },
    // ------------------------------------------------------------------ 4
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '按配方取两格颜料：MoE 的加权聚合',
      badge: 'both',
      badgeLabel: '方法',
      bridge:
        '适配器是“颜料”，路由器是“配方”。本章把“取哪几管、各取多少”写成一个可操作的公式。',
      analogy: {
        title: '按比例混合两格颜料',
        text: '画笔在两格颜料之间来回搅动，按<b>比例</b>混合出一种新颜色——这就是多个专家按权重相加的样子。',
        componentId: 'ana-4',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '从专家池里挑几个：top-k 门控',
          desc: '切换 top-1 / top-2 / top-3，看路由器从专家池中激活几个专家、各自的权重柱有多高，以及它们混出的颜色（论文实际使用 22 个专家、top-2 门控，画布为 8 个示意）。',
          componentId: 'mod-4-1',
        },
        {
          kind: 'module',
          id: '4.2',
          title: 'Top-k 掩码与 Softmax 归一化',
          desc: '拖动滑块改变路由器打分的差距，观察上排未掩码分布与下排 Top-k 之后分布的差别：被排除的专家权重恒为 0，剩余权重之和恒为 1。',
          componentId: 'mod-4-2',
        },
      ],
      insight:
        '路由器只需挑出 top-2 个专家、把其余置为 −∞；Softmax 之后权重之和仍然是 1。',
      formula: {
        lead: '稀疏专家的加权组合，以及由 [CLS] token 生成的门控权重：',
        unicode:
          'y<sub>t</sub> = Σ<sub>i=1</sub><sup>N<sub>E</sub></sup> W<sup>t</sup><sub>i</sub> · E<sub>i</sub>(x<sub>t</sub>)&nbsp;&nbsp;&nbsp;(1)<br>W<sup>t</sup> = Softmax( Topk( R<sub>t</sub>(c<sub>t</sub>) ) )&nbsp;&nbsp;&nbsp;(2)',
        symbols: [
          { sym: 'N_E', desc: '预定义的专家数量，论文取 22。' },
          { sym: 'E_i', desc: '第 i 个专家，实现为一个 LoRA 低秩适配器。' },
          { sym: 'W^t_i', desc: '路由器给第 i 个专家的门控权重，决定它的贡献。' },
          { sym: 'x_t', desc: '当前任务下多头注意力输出的 token 特征。' },
          { sym: 'c_t', desc: '初始 token（[CLS]），路由器只读入它以保证效率。' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '专家即适配器', desc: '用 LoRA 当专家，既快又省，避免了插入 MoE 带来的全参数微调开销。' },
        { icon: '🔧', title: '稀疏门控', desc: 'Top-k 把无关专家置为 −∞，Softmax 只在前几名之间分配权重。' },
        { icon: '✨', title: '只读一个 token', desc: '路由器以 [CLS] token 为输入，比逐 token 路由更省算力。' },
      ],
    },
    // ------------------------------------------------------------------ 5
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '每张画稿配一张配方卡：任务专属路由器',
      badge: 'both',
      badgeLabel: '方法',
      bridge:
        '上一条公式里 R_t 的下标 t 说明了关键：路由器跟着任务走，而专家池是全体共享的。',
      analogy: {
        title: '把配方卡插进卡槽',
        text: '一张<b>配方卡</b>滑入画架的卡槽，颜料盒上对应的两格同时亮起——换一张卡，取的就是另外两格。',
        componentId: 'ana-5',
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '切换任务，看专家组合如何改变',
          desc: '在不同任务之间切换：专家池完全共享，变的只是当前任务专属路由器给出的权重，因此输出颜色也随之改变。',
          componentId: 'mod-5-1',
        },
      ],
      insight:
        '新增一个任务只需要增加一个路由器，专家池与主干完全不动——这正是“增量”扩张的含义。',
      formula: {
        lead: '路由器只读入 [CLS] token，为每个专家输出一个激活可能性：',
        unicode:
          'c<sub>t</sub> ∈ ℝ<sup>1×d</sup>&nbsp;&nbsp;→&nbsp;&nbsp;R<sub>t</sub>&nbsp;&nbsp;→&nbsp;&nbsp;W<sup>t</sup> ∈ ℝ<sup>N<sub>E</sub></sup>',
        symbols: [
          { sym: 'c_t', desc: '当前任务的 [CLS] token，维度为 1×d。' },
          { sym: 'R_t', desc: '任务 t 专属的路由器，是一个单层 MLP。' },
          { sym: 'W^t', desc: '长度为 N_E 的门控权重向量，指示各专家的激活可能性。' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '共享 + 专属', desc: '专家池共享带来跨任务的知识复用，路由器专属保留任务特征。' },
        { icon: '🔧', title: '增量成本极低', desc: '每个新任务只新增一个路由器，不必复制整套主干。' },
        { icon: '✨', title: '新问题', desc: '路由器依赖任务身份；在没有任务编号的类增量场景中并不实用。' },
      ],
    },
    // ------------------------------------------------------------------ 6
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '先试色，再决定去哪个本子',
      badge: 'inf',
      badgeLabel: '推理',
      bridge:
        '路由器需要知道当前属于哪个任务。DDAS 用一组自编码器的重建误差，把这个任务身份“猜”出来。',
      analogy: {
        title: '把颜色涂到试色纸上',
        text: '画笔在试色纸上画出一道色带：落在<b>本子里的色系</b>就归为已见任务，超出范围则按新颜色另行处理。',
        componentId: 'ana-6',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '判别阈值与两条指标线的此消彼长',
          desc: '拖动阈值线：偏左会有更多样本被判为“未见过”而交给原 CLIP，偏右则更多样本走 MoE 适配器。指标随阈值变化为示意，运行点为论文取值（full-shot 0.065、few-shot 0.06）。',
          componentId: 'mod-6-1',
        },
      ],
      insight:
        '当所有任务的重建分数都高于阈值时，样本被判为未见过，直接交给冻结的 CLIP 做零样本分类；否则交给分数最低的那个路由器。',
      formula: {
        lead: '每个任务训练一个自编码器，“像不像这个任务”由重建误差给出：',
        unicode:
          'd<sub>t</sub> = ‖ f<sup>i</sup><sub>t</sub> − f<sup>o</sup><sub>t</sub> ‖<sub>2</sub>&nbsp;&nbsp;&nbsp;(3)',
        symbols: [
          { sym: 'f^i_t', desc: '从输入图像提取的中间特征。' },
          { sym: 'f^o_t', desc: '任务 t 的自编码器重建出的特征。' },
          { sym: 'd_t', desc: '任务 t 的重建分数，越低说明输入越可能属于该任务。' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '自动选路', desc: 'DDAS 靠数据分布而不是任务编号来分派，因此 CIL 场景同样可用。' },
        { icon: '🔧', title: '两个分支', desc: '已见数据走 MoE 适配器，未见数据交回原 CLIP 做零样本。' },
        { icon: '✨', title: '关键超参', desc: '阈值 Thres 决定“未见过”的门槛，是整套分流机制的开关。' },
      ],
    },
    // ------------------------------------------------------------------ 7
    {
      kind: 'chapter',
      id: 'chap-7',
      title: '调好的罐子要封盖：增量激活—冻结',
      badge: 'trn',
      badgeLabel: '训练',
      bridge:
        '公式只说了“怎么组合”，没说“谁可以被改动”。本章回答：哪些专家在训练过程中会被冻住。',
      analogy: {
        title: '给调好的颜料罐封盖',
        text: '一支笔把盖子扣到已经调好的<b>旧色罐</b>上并封住；新的颜料仍可自由加入，旧的配方却不再被搅动。',
        componentId: 'ana-7',
      },
      modules: [
        {
          kind: 'module',
          id: '7.1',
          title: '三种激活组合：都训练、混合、都冻结',
          desc: '切换被激活专家的状态组合（对应论文 Figure 3）：专家是否可训练直接决定旧任务保持度与新任务适应度之间的取舍。',
          componentId: 'mod-7-1',
        },
        {
          kind: 'module',
          id: '7.2',
          title: '逐步推进：冻结状态如何演化',
          desc: '用上一步 / 下一步依次推进 11 个任务，观察每一步哪些专家刚被激活、哪些已经封存（专家池同样为 8 个示意）。',
          componentId: 'mod-7-2',
        },
      ],
      insight:
        '一个任务训练结束后，它路由器最常激活的 top-k 专家即被冻结；此后新任务可以同时调用“从未使用过”和“已被冻结”的专家。',
      formula: {
        lead: '论文的冻结规则可以概括为：',
        unicode:
          '任务 t 训练结束&nbsp;&nbsp;→&nbsp;&nbsp;Freeze( Top-k( R<sub>t</sub> ) )',
        symbols: [
          { sym: 'Top-k(R_t)', desc: '任务 t 的路由器最常激活的 k 个专家。' },
          { sym: 'Freeze', desc: '把这批专家的参数冻结，后续任务只读不改。' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '先学后冻', desc: '新专家先自由学习任务内知识，训练结束后立刻封存。' },
        { icon: '🔧', title: '跨任务协作', desc: '新任务既训练新专家，也借用已冻结的旧专家，避免各自为政。' },
        { icon: '✨', title: '消融印证', desc: '去掉该策略后 MTIL 的 Average 从 76.7 掉到 75.1，Last 从 85.0 掉到 82.0。' },
      ],
    },
    // ------------------------------------------------------------------ 8
    {
      kind: 'chapter',
      id: 'chap-8',
      title: '把适配器装进每一个 Transformer 块',
      badge: 'trn',
      badgeLabel: '架构',
      bridge:
        '冻结、稀疏、增量——三种机制要真正落地，还需要一个明确的插入位置与形状约定。',
      analogy: {
        title: '把调色盘插件装进卡位',
        text: '一块调色盘插件滑入画架的<b>卡位</b>，卡位上的两个孔随之亮起；画架本身不动，插件的形状与卡位严丝合缝。',
        componentId: 'ana-8',
      },
      modules: [
        {
          kind: 'module',
          id: '8.1',
          title: '点开数据通路：MoE-Adapter 插在哪里',
          desc: '点击结构图里的任一部件，右侧细节区给出它在这条通路上的位置与张量形状；下方按钮与 Canvas 热点等价，也可用键盘操作。',
          componentId: 'mod-8-1',
          figure: './images/figure-2.png',
        },
      ],
      insight:
        'MoE-Adapter 接在多头注意力之后，输出形状与 x_t 完全一致，因此可以无缝接回主干；图像塔与文本塔各持一套，参数不共享。',
      formula: {
        lead: '与主干同形的输入输出：',
        unicode:
          'x<sub>t</sub> ∈ ℝ<sup>n×d</sup>&nbsp;&nbsp;→&nbsp;&nbsp;MoE-Adapter&nbsp;&nbsp;→&nbsp;&nbsp;y<sub>t</sub> ∈ ℝ<sup>n×d</sup>',
        symbols: [
          { sym: 'n', desc: 'token 数量；图像塔 ViT-B/16 为 197。' },
          { sym: 'd', desc: '特征维度；图像塔为 768。' },
          { sym: 'y_t', desc: '与输入同形的输出，可直接与主干特征相加。' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '插在何处', desc: '每个 Transformer 块中，多头注意力输出之后进入 MoE-Adapter。' },
        { icon: '🔧', title: '为什么能接回去', desc: '输出与输入同形，残差相加不破坏主干结构。' },
        { icon: '✨', title: '双塔各自为政', desc: '图像塔与文本塔实现相同结构，但适配器参数互不共享。' },
      ],
    },
    // ------------------------------------------------------------------ 9
    {
      kind: 'chapter',
      id: 'chap-9',
      title: '用两格颜料调出同样的色',
      badge: 'trn',
      badgeLabel: '效率',
      bridge:
        '方法能不能真正用起来，还要看它付出了多少代价。本章把参数量、显存与迭代时间放到同一把尺子上。',
      analogy: {
        title: '只取两格颜料就到位',
        text: '整盒颜料几乎没动，画笔只从两格里各取一点，目标色块就已经被<b>调准</b>。',
        componentId: 'ana-9',
      },
      modules: [
        {
          kind: 'module',
          id: '9.1',
          title: '专家数量：稳健性有多强',
          desc: '拖动专家数量滑块：三条指标曲线整体平稳，说明性能对专家数量并不敏感；同时训练参数量随专家数缓慢增长（曲线为趋势示意，端点取值来自论文）。',
          componentId: 'mod-9-1',
        },
      ],
      insight:
        '训练参数量 59.8M，相对 SOTA 的 ZSCL（149.6M）下降约 60%；迭代时间与显存占用同步下降。',
      formula: {
        lead: '相对上一代 SOTA 的下降幅度：',
        unicode:
          'Δ = (59.8M − 149.6M) / 149.6M ≈ <b>−60.03%</b>',
        symbols: [
          { sym: '59.8M', desc: '本文每一次迭代需要训练的参数总量（MoE-Adapters 51.1M + DDAS 8.7M）。' },
          { sym: '149.6M', desc: 'ZSCL 的训练参数量，作为对比基准。' },
          { sym: 'Δ', desc: '相对变化；论文同时报告 GPU 占用 −14.95%、单次迭代时间 −59.90%。' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '省在哪里', desc: '主干冻结，只有少量适配器与路由器参与训练。' },
        { icon: '🔧', title: '两条支路的账', desc: 'MoE-Adapters 占 51.1M、DDAS 占 8.7M，是省下参数量的两个来源。' },
        { icon: '✨', title: '工程含义', desc: '显存与迭代时间同步下降，使长期持续学习更容易落地。' },
      ],
    },
    // ------------------------------------------------------------------ 10
    {
      kind: 'chapter',
      id: 'chap-10',
      title: '挂上作品：结果、边界与结论',
      badge: 'both',
      badgeLabel: '总结',
      bridge:
        '最后把画挂上墙：看清它赢在哪里、代价是多少，以及作者自己指出的局限。',
      analogy: {
        title: '把完成的作品挂上墙',
        text: '一支笔把刚完成的画<b>挂上</b>麻绳，与旁边的旧作并排展示——成果要经得起对照才算完成。',
        componentId: 'ana-10',
      },
      modules: [
        {
          kind: 'module',
          id: '10.1',
          title: '历史知识保持：与 SOTA 同场对比',
          desc: '点击“开始对比”，四条进度条从同一起点出发，按 MTIL 的 Last 分数推进（数值取自论文 Table 1）。',
          componentId: 'mod-10-1',
        },
        {
          kind: 'module',
          id: '10.2',
          title: '边界：单一阈值随任务数增长而失效',
          desc: '逐步增加已见任务数量，观察任务分布如何挤向同一条阈值线；这正是论文在讨论部分承认的局限。',
          componentId: 'mod-10-2',
        },
      ],
      insight:
        '在 MTIL 上三项指标全面领先，5-shot 场景优势更大；代价是 DDAS 依赖一个预先设定、对所有任务通用的阈值。',
      formula: {
        lead: 'MTIL 上的关键数字（%，括号内为相对 ZSCL 的提升）：',
        unicode:
          'Transfer <b>68.9</b> (+0.8)&nbsp;&nbsp;|&nbsp;&nbsp;Average <b>76.7</b> (+1.3)&nbsp;&nbsp;|&nbsp;&nbsp;Last <b>85.0</b> (+1.4)<br>5-shot 场景：<b>+3.6 / +7.0 / +4.2</b>',
        symbols: [
          { sym: 'Transfer', desc: '未见数据上的零样本迁移能力。' },
          { sym: 'Last', desc: '历史任务记忆能力；1k 迭代为 85.0，3k 迭代可达 87.4。' },
          { sym: 'CIL', desc: '类增量场景同样领先：CIFAR100 50 步 Average 83.60 / Last 75.24。' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '结论', desc: 'MoE-Adapter + DDAS 在抗遗忘与零样本迁移上同时取得优势，且训练参数量下降约 60%。' },
        { icon: '🔧', title: '适用边界', desc: '已见数据走 MoE、未见数据走原 CLIP；判别阈值需要预先设定。' },
        { icon: '✨', title: '遗留问题', desc: '作者指出：任务数量继续增长时，单一阈值会带来判别错误，如何把学到的知识反哺 CLIP 的零样本能力仍待研究。' },
      ],
    },
  ],
};