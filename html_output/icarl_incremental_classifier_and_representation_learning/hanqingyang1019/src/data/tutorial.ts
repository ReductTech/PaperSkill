import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'iCaRL: Incremental Classifier and Representation Learning',
    titleZh: 'iCaRL：增量分类器与表示学习',
    venue: 'CVPR 2017（arXiv:1611.07725）',
    authors: 'Sylvestre-Alvise Rebuffi, Alexander Kolesnikov, Georg Sperl, Christoph H. Lampert',
    affiliation: 'University of Oxford / IST Austria',
    domain: '计算机视觉 · 类增量学习',
    coreProblem:
      '标准分类网络要求所有类别的数据同时可用；若按类别顺序分批训练，新类的梯度会覆盖旧类参数，出现灾难性遗忘，旧类准确率迅速崩塌。',
    coreInsight:
      '用“每类少量样本的平均特征”作为原型做最近邻分类，原型会随特征表示一起移动；训练时让旧样本与新数据同场，并用蒸馏把旧类的输出钉住，就能在固定内存预算下同时学习表示与分类器。',
    keywords: ['类增量学习', '灾难性遗忘', '样本原型', '知识蒸馏', 'herding 选样'],
  },

  hero: {
    oldMethod: {
      desc:
        '普通增量训练：每来一批新类，就在同一个网络上继续训练。纯微调（finetuning）最糟——混淆矩阵显示它的预测几乎全部落在最后一批类上；只用蒸馏、不留样本的 LwF.MC 在 iCIFAR-100 每批 10 类时平均增量准确率也只有 <strong>44.4%</strong>。',
    },
    newMethod: {
      desc:
        'iCaRL：每类只留少量样本（exemplar），用它们的平均特征做最近原型分类；训练时旧样本与新数据混在一起，并用蒸馏把旧类输出钉住。同样设置下平均增量准确率达到 <strong>64.1%</strong>，混淆矩阵接近均匀。',
    },
  },

  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '新知识为什么会冲掉旧知识',
      badge: 'inf',
      badgeLabel: '问题',
      bridge:
        '先从一个每个人都见过的现象出发：模型学会新东西的时候，为什么常常把旧东西忘掉。',
      analogy: {
        componentId: 'garden-analogy',
        title: '移栽挤掉旧根',
        text:
          '一只花盆只够养一株苗。把新苗移进来，旧苗的根就被挤断。网络也是这样：新类的梯度一压，旧类依赖的那部分参数就被改写。',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '顺序训练：旧类样本被推过决策边界',
          desc:
            '拖动“新类训练轮次”。新类的样本越练越集中，决策边界随之转向；旧类样本明明没动，却被划到了新类一侧。<em>这是机制示意，不是论文实测曲线。</em>',
          componentId: 'c1-drift',
        },
        {
          kind: 'module',
          id: '1.2',
          title: '三条硬指标：什么才算“类增量”',
          desc:
            '论文给“类增量学习”定了三条硬要求：<br/>ⅰ. 能从“不同类别的样本在不同时间到来”的数据流中训练；<br/>ⅱ. 在任何时刻都能对“已见类”给出有竞争力的多分类器；<br/>ⅲ. 计算量与内存随类别数保持有界，或至少增长得非常慢。<br/>点选下面三种做法，看它们分别在哪一条上不合格。',
          componentId: 'c1-criteria',
        },
      ],
      insight:
        '遗忘不是“容量不够”，而是旧类的判别信息没有出现在新的训练目标里：只要新数据独占了梯度，旧类就会被系统地覆盖。',
      takeaways: [
        { icon: '🌱', title: '遗忘很彻底', desc: '纯微调的预测几乎只落在最后一批类上；LwF.MC 在 10 类一批时也只剩 44.4%。' },
        { icon: '🧭', title: '三条要求', desc: '流式学习；随时对已见类给出有竞争力的分类器；计算与内存有界（或增长极慢）。' },
        { icon: '⚠️', title: '两个诱因', desc: '特征表示在变，而分类权重与它解耦，旧类分数就会失控。' },
      ],
    },

    {
      kind: 'chapter',
      id: 'chap-2',
      title: '网络看到的不是像素，而是特征向量',
      badge: 'inf',
      badgeLabel: '表示',
      bridge:
        '在讨论怎么“不忘”之前，先看清楚：分类到底发生在哪个空间里。',
      analogy: {
        componentId: 'garden-analogy',
        title: '举起叶子看叶脉',
        text:
          '肉眼看到的是一片叶子的颜色和轮廓；举到光下，看到的才是叶脉的走向。网络也把图片换成了一串更能说明“是什么”的特征。',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '特征向量与 L2 归一化',
          desc:
            '点选四片叶子中的一片，看它被编码成 8 维特征；再切换归一化开关，观察箭头长度和方向的变化。iCaRL 的所有比较都发生在归一化后的单位球面上。',
          componentId: 'c2-feature',
        },
      ],
      insight:
        '特征向量只保留“方向”时，比较就变成夹角比较：长度不再干扰判断。论文中所有特征向量都做 L2 归一化，连平均之后也重新归一化。',
      formula: {
        lead: '一张图片经过特征提取器，得到一个 d 维向量，并被缩放到单位长度：',
        unicode: 'φ(x) ∈ ℝ<sup>d</sup>，‖φ(x)‖₂ = 1',
        symbols: [
          { sym: 'φ', desc: '特征提取器（CNN 主干），把图片映射成向量' },
          { sym: 'x', desc: '输入图片' },
          { sym: 'd', desc: '特征维度，论文中由 ResNet 主干决定' },
          { sym: '‖·‖₂', desc: 'L2 范数；归一化后恒为 1' },
        ],
      },
      takeaways: [
        { icon: '🔍', title: '表示先行', desc: 'iCaRL 先把图片变成 L2 归一化的特征，再谈分类。' },
        { icon: '📐', title: '方向比长度重要', desc: '单位球面上，最近邻等价于最大内积，比较更稳定。' },
        { icon: '🔁', title: '平均也要归一化', desc: '特征的平均、原型都会被重新归一化，避免长度漂移。' },
      ],
    },

    {
      kind: 'chapter',
      id: 'chap-3',
      title: '把分类器“长”在表示上',
      badge: 'inf',
      badgeLabel: '洞见',
      bridge:
        '既然分类发生在特征空间，那么特征一变，分类器该怎么办？这正是普通分类头失效的地方。',
      analogy: {
        componentId: 'garden-analogy',
        title: '嫁接的接口要跟着长',
        text:
          '新枝接到老砧木上，接口会随植株一起长粗；如果接口是钉死的钉子，植株一长就错位。分类权重若与特征脱钩，表示一更新就错位。',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '固定权重 vs 随表示移动的原型',
          desc:
            '拖动“表示更新强度”（示意参数）。左侧是普通分类头：权重停在旧位置，旧类分数随表示漂移而崩塌；右侧是 iCaRL 的原型：它由样本重新算出来，跟着表示一起移动。曲线数值为演示用，不是论文实测值。',
          componentId: 'c3-coupled',
        },
      ],
      insight:
        '问题不在“参数被改了”，而在“参数与特征解耦”：一旦 φ 变化，所有旧权重 w 都必须同步更新，否则输出就会失控。原型由样本现算，天然同步。',
      formula: {
        lead: '普通分类头的输出依赖固定的权重向量，特征一变就会错位：',
        unicode: 'g<sub>y</sub>(x) = 1 / (1 + exp(−w<sub>y</sub><sup>⊤</sup>φ(x)))',
        symbols: [
          { sym: 'g_y', desc: '第 y 类的 sigmoid 输出，可解释为概率但不是最终分类依据' },
          { sym: 'w_y', desc: '第 y 类的分类权重向量，类别增加时新增一个' },
          { sym: 'φ(x)', desc: '当前特征提取器给出的特征' },
        ],
      },
      takeaways: [
        { icon: '🧷', title: '解耦是病根', desc: '特征一更新，旧类的固定权重立刻与新特征错位。' },
        { icon: '🧮', title: '原型现算', desc: 'μ_y 每次由该类样本重新求平均，自动跟随表示。' },
        { icon: '🎯', title: '分类头退役', desc: '网络输出只用于蒸馏，不再直接决定类别。' },
      ],
    },

    {
      kind: 'chapter',
      id: 'chap-4',
      title: '最近原型：把“像不像”写成距离',
      badge: 'both',
      badgeLabel: '数学',
      bridge:
        '“跟着表示一起移动”听起来很好，但要能计算才行。这一章把原型写成公式，并让它可操作。',
      analogy: {
        componentId: 'garden-analogy',
        title: '把新花放到最像的那一束',
        text:
          '手里一朵新采的花，放进桌上几束花里最像的那一束：看颜色、看花瓣、看气味，谁的“平均样子”最接近，就归谁。',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '拖动查询点，看它归到哪个原型',
          desc:
            '在特征平面上拖动查询点。三条连线是它到三个类原型的距离，最短的那条决定预测；原型本身是各自样本的平均位置。',
          componentId: 'c4-prototype',
        },
      ],
      insight:
        '原型分类只需要保存每类的少量样本，不需要保存全部数据：μ_y 可以由样本现算，删样本时也不会破坏“前缀平均”的近似性质。',
      formula: {
        lead: '每个已见类用其样本特征的平均作为原型，新样本归到最近的原型：',
        unicode:
          'μ<sub>y</sub> = (1/|P<sub>y</sub>|) Σ<sub>p∈P<sub>y</sub></sub> φ(p)，&nbsp; y* = argmin<sub>y</sub> ‖φ(x) − μ<sub>y</sub>‖',
        symbols: [
          { sym: 'P_y', desc: '第 y 类保留的样本集合（exemplar set）' },
          { sym: 'μ_y', desc: '第 y 类的原型，即样本特征的平均（再归一化）' },
          { sym: 'x', desc: '待分类的图片' },
          { sym: 'y*', desc: '预测类别，取距离最小的原型' },
        ],
      },
      takeaways: [
        { icon: '📏', title: '距离即类别', desc: '预测只做一次最近邻比较，不需要 softmax 竞争。' },
        { icon: '🧺', title: '样本即参数', desc: '原型由样本现算，样本删减后仍然可用。' },
        { icon: '🔗', title: '等价内积', desc: '归一化后 argmin 距离等价于 argmax 内积，像“会移动的权重”。' },
      ],
    },

    {
      kind: 'chapter',
      id: 'chap-5',
      title: '蒸馏：把旧知识钉在输出上',
      badge: 'both',
      badgeLabel: '约束',
      bridge:
        '原型解决了“分类器跟着表示走”，但训练新类时特征本身仍在漂移，旧类的可分性会被一点点磨掉。',
      analogy: {
        componentId: 'garden-analogy',
        title: '嫁接后要绑扎保温',
        text:
          '接口固定住，新枝才不会被风吹歪。蒸馏就是给旧类的输出加一道固定：新数据可以改特征，但不能把旧类的判断改得面目全非。',
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '蒸馏权重：旧类输出被拉回多少',
          desc:
            '拖动“蒸馏权重 λ”。论文的损失里两项系数都是 1，λ 只是为了让您看清“有约束 / 无约束”的差别而设的演示旋钮。λ=0 时旧类输出完全跟着新数据漂走；λ 增大，旧类输出被拉回训练前记录的目标 q。注意：论文在极小批次下发现蒸馏反而可能略微有害。',
          componentId: 'c5-distill',
        },
      ],
      insight:
        '蒸馏的目标不是原始标签，而是“更新前的网络输出”q：它把旧类之间的相对关系也保留下来，这比只保留正确标签信息量更大。',
      formula: {
        lead: '对旧类，损失不再对齐 one-hot 标签，而是对齐更新前存下的输出 q：',
        unicode:
          'Σ<sub>y=1..s−1</sub> [ q<sub>y</sub><sup>i</sup> log g<sub>y</sub>(x<sub>i</sub>) + (1 − q<sub>y</sub><sup>i</sup>) log(1 − g<sub>y</sub>(x<sub>i</sub>)) ]',
        symbols: [
          { sym: 'q_y^i', desc: '更新前网络对样本 i 的第 y 类输出，作为蒸馏目标' },
          { sym: 's', desc: '本批新类的第一个编号；旧类为 1..s−1' },
          { sym: 'g_y', desc: '当前网络对第 y 类的 sigmoid 输出' },
        ],
      },
      takeaways: [
        { icon: '🧊', title: '钉住相对关系', desc: '蒸馏对齐的是旧输出分布，不只是正确类。' },
        { icon: '⚖️', title: '不是万能', desc: '每批 2 类时蒸馏甚至略拖后腿，原型更关键。' },
        { icon: '🧵', title: '单网络内蒸馏', desc: '与 Hinton 的跨网络蒸馏不同，这里蒸馏的是自己的过去。' },
      ],
    },

    {
      kind: 'chapter',
      id: 'chap-6',
      title: '一次分类要走哪三步',
      badge: 'inf',
      badgeLabel: '推理',
      bridge:
        '方法的三块拼图里，推理最简单：不训练，只负责在已有原型里找最近的。但它解释了为什么新增类别几乎不花额外代价。',
      analogy: {
        componentId: 'garden-analogy',
        title: '藤蔓试过每一根横杆',
        text:
          '一根藤往上爬，会依次试过几根横杆，最后缠住最顺的那一根。分类也是这样：试过所有原型，选距离最小的那个。',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '三步走完一次预测',
          desc:
            '点“下一步”走完推理流程：提特征、算 t 个原型、取最近。注意 t 会随已学类别增加，但每一步的计算量都不随类别数爆炸。',
          componentId: 'c6-pipeline',
        },
      ],
      insight:
        '新增一个类时，旧类的判定位置不必重新拟合——原型每次由样本现算，自动跟着表示走；网络仍会为新类增加一个权重向量，但它只用于后续蒸馏，不参与预测。',
      takeaways: [
        { icon: '①', title: '提特征', desc: '用当前 φ 把输入变成单位向量。' },
        { icon: '②', title: '算原型', desc: '对每个已见类，用其样本平均得到 μ_y。' },
        { icon: '③', title: '取最近', desc: 'argmin 距离，输出对应类别，结束。' },
      ],
    },

    {
      kind: 'chapter',
      id: 'chap-7',
      title: '一个损失里的两股力',
      badge: 'trn',
      badgeLabel: '训练',
      bridge:
        '推理只用原型；但特征从哪来？答案在训练损失里：一股力让新类学得会，一股力让旧类忘得慢。',
      analogy: {
        componentId: 'garden-analogy',
        title: '氮肥长新叶，磷肥保老根',
        text:
          '只施氮肥，新叶旺而根弱；只施磷肥，老根稳而不长新枝。两股力要配比，损失函数也一样。',
      },
      modules: [
        {
          kind: 'module',
          id: '7.1',
          title: '分类项与蒸馏项的配比',
          desc:
            '分别拖动两个权重（演示用；论文的两项系数都是 1），观察新类准确率与旧类保持率的此消彼长。论文的做法不是在两者间调参，而是让两项同时存在、由同一批数据驱动。',
          componentId: 'c7-loss',
        },
      ],
      insight:
        '训练集 D = 本批新类样本 ∪ 旧类样本，其中每个样本都同时参与两项：分类项只在新类 y=s..t 上按标签给正负信号（旧类样本在这里充当负样本），蒸馏项只在旧类 y=1..s−1 上把输出拉回记录值 q（新类样本也被要求保持旧类的输出）。旧样本的存在本身就是“复现（rehearsal）”。',
      formula: {
        lead: '完整损失由新类的分类项与旧类的蒸馏项相加而成：',
        unicode:
          'ℓ(Θ) = − Σ<sub>(x<sub>i</sub>,y<sub>i</sub>)∈D</sub> [ Σ<sub>y=s..t</sub> (δ<sub>y=y<sub>i</sub></sub> log g<sub>y</sub> + δ<sub>y≠y<sub>i</sub></sub> log(1−g<sub>y</sub>)) + Σ<sub>y=1..s−1</sub> (q<sub>y</sub><sup>i</sup> log g<sub>y</sub> + (1−q<sub>y</sub><sup>i</sup>) log(1−g<sub>y</sub>)) ]',
        symbols: [
          { sym: 'D', desc: '新类训练样本 ∪ 旧类样本（exemplars）' },
          { sym: 'δ', desc: '指示函数：预测类等于真实类时为 1' },
          { sym: 's..t', desc: '本批新类的编号范围' },
          { sym: 'q_y^i', desc: '旧类蒸馏目标（更新前输出）' },
        ],
      },
      takeaways: [
        { icon: '🧩', title: '数据侧复现', desc: '旧样本进入训练集，让旧分布不被完全遗忘。' },
        { icon: '🎚️', title: '目标侧蒸馏', desc: '旧类输出对齐历史值，防止判别边界被改写。' },
        { icon: '🧮', title: '二分类 BCE', desc: '每个类一个 sigmoid，逐类二分类而非互斥 softmax。' },
      ],
    },

    {
      kind: 'chapter',
      id: 'chap-8',
      title: '四个部件：内存到底花在哪',
      badge: 'trn',
      badgeLabel: '结构',
      bridge:
        '公式里的每个量，在系统里都对应一个具体部件。把它们连起来，才能看清“固定预算”约束落在哪。',
      analogy: {
        componentId: 'garden-analogy',
        title: '搭一副支架',
        text:
          '立主杆、绑横杆、挂钩子——一次把结构立起来。支架占的地方是固定的，挂多少盆花则取决于还剩多少横杆。',
      },
      modules: [
        {
          kind: 'module',
          id: '8.1',
          title: '点选部件，看它在流程里做什么',
          desc:
            '点击架构中的任意部件，高亮它的输入输出与维度，并在下方给出它在内存中的开销。重点看两处：分类头的权重随类数增长，原型库的样本数被 K 卡死。',
          componentId: 'c8-arch',
        },
      ],
      insight:
        'iCaRL 的内存由三块组成：固定的特征提取器、随类数线性增长的分类权重、以及被 K 严格限制的样本库——第三块才是“类增量”的关键约束。',
      takeaways: [
        { icon: '🧱', title: '主干固定', desc: 'ResNet 特征提取器的参数不随类别数增长。' },
        { icon: '📈', title: '权重线性长', desc: '每新增一类，分类头多一个 d 维权重向量。' },
        { icon: '📦', title: '样本库封顶', desc: '总样本数不超过 K，每类约 K/t 个。' },
      ],
    },

    {
      kind: 'chapter',
      id: 'chap-9',
      title: '固定预算下怎么挑、怎么删样本',
      badge: 'trn',
      badgeLabel: '机制',
      bridge:
        '原型与蒸馏都要用到旧样本；内存只有 K 个位置。挑谁、删谁，直接决定原型还准不准。',
      analogy: {
        componentId: 'garden-analogy',
        title: '留种要按“最像整盆”的顺序',
        text:
          '从一盆里挑几枝留种：先挑最接近整盆平均长势的那枝，再挑一枝让两枝的平均更接近整盆，如此继续；要删时，从末尾剪。',
      },
      modules: [
        {
          kind: 'module',
          id: '9.1',
          title: 'Herding：一步步挑出代表性样本',
          desc:
            '点“选下一枝”，按 herding 规则逐个加入样本：每次都选让“已选样本均值”最接近“全体均值”的那一个。与随机抽样对比误差曲线，看优先顺序为什么重要。',
          componentId: 'c9-herding',
        },
        {
          kind: 'module',
          id: '9.2',
          title: '预算守恒：K 一定，类越多每类越少',
          desc:
            '固定总预算 K，拖动已学类数 t，看每类名额 m=⌊K/t⌋ 如何被摊薄，以及总占用始终不超过 K。iCIFAR-100 用 K=2000，iILSVRC 用 K=20000。',
          componentId: 'c9-budget',
        },
      ],
      insight:
        'Herding 给出的是一个“优先列表”而不是集合：前 m 个样本的均值就已经很接近全体均值，所以从尾部删除任意数量都不会破坏近似性质——这正是增量场景需要的。',
      formula: {
        lead: '第 k 个样本的选择标准，是让加入它之后的样本均值最接近全体均值：',
        unicode:
          'p<sub>k</sub> = argmin<sub>x∈X</sub> ‖ μ − (1/k)[ φ(x) + Σ<sub>j=1..k−1</sub> φ(p<sub>j</sub>) ] ‖',
        symbols: [
          { sym: 'μ', desc: '该类全部训练样本的特征均值' },
          { sym: 'p_k', desc: '第 k 个被选中的样本' },
          { sym: 'm', desc: '目标样本数，约为 K/t' },
        ],
      },
      takeaways: [
        { icon: '🐑', title: '优先列表', desc: '样本有序，前 m 个就是当前预算下的最优子集。' },
        { icon: '✂️', title: '尾部删除', desc: '删样本只从末尾剪，不需要旧数据。' },
        { icon: '📊', title: '优于随机', desc: '同等样本数下，herding 的均值逼近通常优于随机抽样（论文引 Welling 2009）。' },
      ],
    },

    {
      kind: 'chapter',
      id: 'chap-10',
      title: '它赢在哪，又没赢在哪',
      badge: 'both',
      badgeLabel: '结果',
      bridge:
        '最后把方法放回基准：同样的类别顺序、同样的批次大小，五个方案的平均增量准确率差多少，代价又是什么。',
      analogy: {
        componentId: 'garden-analogy',
        title: '两排苗的收成对比',
        text:
          '同一块地、同一个季节，一排按老办法种，一排按新办法种。收成要一起称，才知道新办法赢的是哪一段。',
      },
      modules: [
        {
          kind: 'module',
          id: '10.1',
          title: '结果竞赛：五种方案的平均增量准确率',
          desc:
            '选择每批类数，点“开始比较”，五根柱子从同一基线长到各自的实测值（iCIFAR-100，10 次重复的平均）。数值来自论文 Table 1a；其中 hybrid1–3 是 iCaRL 的消融变体，不是独立方法。评估协议：每批之后只在“已见类”上测试；iILSVRC 的两组实验（100 类每批 10、1000 类每批 100）报告的是 top-5 准确率。',
          componentId: 'c10-race',
        },
        {
          kind: 'module',
          id: '10.2',
          title: '消融：每个部件各值多少',
          desc:
            '切换 hybrid1 / hybrid2 / hybrid3，看关掉某个部件后准确率掉多少。注意 2 类一批时 hybrid2（无蒸馏）反而略高于 iCaRL——蒸馏并非在所有批次下都加分。',
          componentId: 'c10-ablation',
        },
      ],
      insight:
        '批次越小、更新越频繁，iCaRL 的相对优势越大。每批 50 类（只更新两次）时 iCaRL 达到 68.6%，与论文报告的全量训练 68.6% 相同；但论文强调类增量整体仍低于批量训练，差距集中在更细的增量设置。',
      takeaways: [
        { icon: '🏆', title: '有条件的领先', desc: '五个批次设置下 iCaRL 都高于 LwF.MC；与消融变体相比，唯独每批 2 类时被 hybrid2 反超 0.6 个百分点（57.6 对 57.0）。' },
        { icon: '🧪', title: '部件都有效', desc: '拆掉原型、样本复现或蒸馏，准确率都会下降（个别设置例外）。' },
        { icon: '🚧', title: '仍逊于全量', desc: '论文结论仍认为类增量整体逊于批量训练（68.6% 为参照），并把隐私场景列为后续方向。' },
      ],
    },
  ],
  bilibili: [
    {
      bvid: 'BV1Cz4y1t7xC',
      title: '【专题10：用增量学习解决计算机视觉的问题】实验展示：增量分类器与表示学习 iCaRL 训练过程',
      reason: '直接演示 iCaRL 的增量训练流程，可与教程第 6、9 章的流程和样本管理对照观看；播放量不高，但主题完全对口。',
      cover: 'https://i2.hdslb.com/bfs/archive/ccf85f44ad201c02eb64b86c48100cd3d8c331c9.jpg',
      views: '1968播放',
    },
  ],
};
