import type { TutorialData } from '../types';

// Paper-specific tutorial content. `kind` fields are required; every `componentId`
// must be registered in ../modules/registry.tsx.
//
// Every chapter carries a `paper` anchor: the exact section / figure / table it
// dramatises, plus one sentence from (or faithful to) the original text. The
// detective story explains; the anchor keeps it tied to arXiv:2503.18403.

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'Knowledge Graph Enhanced Generative Multi-modal Models for Class-Incremental Learning',
    titleZh: '用知识图谱破获“调包案”：KG-GMM 如何认出新物，也不认错旧物',
    venue: 'CVPR 2025（投稿版，arXiv 2503.18403）',
    authors: '南开大学 VCIP 等',
    affiliation: 'Nankai University, VCIP',
    domain: '类别增量学习 · 视觉语言模型 · 知识图谱',
    coreProblem:
      '论文要解决的是无样本回放的类别增量学习：冻结的 MiniGPT-4 只会写一句 “This is a photo of [CLS]”，新类与相似旧类共用这句套话——图 1 里它把 Granny Smith 写成 “This is a apple”，最后判成 Pineapple。',
    coreInsight:
      'KG-GMM 用 ConceptNet 给每个类挂 r 条关系，推理时先按关系在子图里检索头实体，再把它拼回文本比对：ImageNet-R 上把 GMM 的 80.72 抬到 84.29。',
    keywords: ['类别增量学习', '生成式多模态', '知识图谱', 'ConceptNet', '无样本回放'],
  },

  hero: {
    oldMethod: {
      desc: '论文图 1(a) 的 GMM：冻结的 MiniGPT-4 只写一句“这是一件瓷器”，描述停在 [CLS] 这个大类上。新到的《青花缠枝瓶》一进证物室，鉴定语和收在盒里的高仿几乎一样，几张鉴定卡撞成一片。',
      componentId: 'hero-old',
    },
    newMethod: {
      desc: '论文图 1(b) 的 KG-GMM：给《青花缠枝瓶》挂 r = 3 条 ConceptNet 关系（窑口、底款、尺寸），剪掉旧任务用过的实体，再让模型把三条专属关系写进鉴定语——它才被单独认出来。',
      componentId: 'hero-new',
    },
  },

  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '只写“一件瓷器”，就认错证物',
      badge: 'inf',
      badgeLabel: '现象',
      paper: {
        loc: '§1 · 图 1(a)',
        quote:
          'GMM 的原始描述只有 “This is a photo of [CLS]”；图 1 里苹果被写成 “This is a apple”，最后判成 Pineapple，而不是 Granny Smith。',
      },
      bridge:
        '论文 §1 的开场就是这场误认：冻结的 GMM 只写 “This is a photo of [CLS]”，图 1 里它把 Granny Smith 判成了 Pineapple。你在证物室遇到的，是同一件事。',
      analogy: {
        title: '只按大类归档',
        text: '证物袋被推进“瓷瓶”这一格，卡在口沿又弹了回来——格口只认大类，不认这一件。',
        componentId: 'ana-1',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '把鉴定语写细，够不够用',
          desc: '拖动滑块，让描述从“一件瓷器”逐渐变成图 1 那样的细节句，看三张证物卡怎么变化。',
          componentId: 'ch1-1',
        },
      ],
      insight:
        '论文把这一步的失败归到“描述太泛”：形容词再多，仍停在“瓷器”这个大类的词向量里；能钉死一件器物的，是“谁烧的、哪一年、什么款”这类关系事实。',
      takeaways: [
        { icon: '🗂️', title: '卡在大类', desc: '只写“一件瓷器”，三张鉴定卡几乎一样高——图 1(a) 的 GMM 正是这样把 Granny Smith 判成 Pineapple。' },
        { icon: '🎯', title: '写细也有限', desc: '把“白底、有花纹”写进去，分布拉开了，可这一件仍然没被点到。' },
        { icon: '🔑', title: '缺的是关系', desc: '论文要补的不是形容词，而是（头实体，关系，尾实体）这样的事实。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '一件证物在系统里走过的四步',
      badge: 'inf',
      badgeLabel: '流程',
      paper: {
        loc: '§3.1 · 式 (1)–(3) · 图 3 左',
        quote:
          '图像编码器给出 e = f_enc(x)，与问题 q、答案 s 一起送进冻结的 MiniGPT-4 逐字生成，再用文本编码器算余弦相似度判类；训练只更新一个线性层。',
      },
      bridge:
        '先看清算式：冻结的图像编码器、文本编码器、问题 q 拼成输入，交给 MiniGPT-4 逐字生成，再用文本相似度判类（式 1–3）。这套四步就是论文 §3.1 的 GMM 流程。',
      analogy: {
        title: '它只照见轮廓',
        text: '陈队把放大镜移过证物卡，一道窄光环扫过去——系统读到的是卡上的泛泛字，不是这一件的特征。',
        componentId: 'ana-2',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '勘验四步：拍证物 → 编码 → 写鉴定 → 比对',
          desc: '点画布上的四个阶段块，或点下方按钮，依次看清每一步的输入和输出——对应论文图 3 左侧那条回路。',
          componentId: 'ch2-1',
        },
      ],
      insight:
        '描述是逐字生成的：既能写出细节，也会滑回套话。这正是论文后面要用关系去约束它的原因，而不是换掉整个生成模型。',
      formula: {
        lead: '论文式 (1)：描述按 token 逐个生成，每个 token 都以图像嵌入 e、问题 q 和前面已写出的字为条件。',
        unicode: 'P(s<sub>1</sub>,…,s<sub>m</sub> | x, q, s) = <span class="bigop"><span class="lim-top">m</span><span class="op">∏</span><span class="lim-bot">j=1</span></span> P(s<sub>j</sub> | e, q, s<sub>1</sub>,…,s<sub>j−1</sub>)',
        symbols: [
          { sym: 'P', desc: '条件概率：给定前面已写出的字，下一个字出现的概率。' },
          { sym: 'm', desc: '这段描述的长度上限，也就是最多写多少个 token。' },
          { sym: 'x', desc: '输入的图像 x，这里是证物照片。' },
          { sym: 'q', desc: '提问模板，比如“请描述这张图的颜色、种类、位置”。' },
          { sym: 's', desc: '标准答案，训练时用来对齐写法。' },
          { sym: 'e', desc: '图像嵌入 e = f_enc(x)，和问题、答案拼在一起作为输入。' },
        ],
      },
      takeaways: [
        { icon: '👁️', title: '先拍照', desc: '照片单独看只给“大类”（图 1 的描述就停在 [CLS]）。' },
        { icon: '🧩', title: '拼成一个输入', desc: '图像嵌入、问题、标准答案拼在一起，喂给冻结的 MiniGPT-4。' },
        { icon: '✍️', title: '逐字写出', desc: '式 (1) 是自回归生成——描述可以被引导，也可以被写坏。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '形容词再多，不如一句底款',
      badge: 'inf',
      badgeLabel: '洞察',
      paper: {
        loc: '§4.4 · 表 4',
        quote:
          'ImageNet-R B0-10 上 GMM 是 80.72；把 GPT-3.5 生成的描述标签加上去只有 80.95——“几乎没有提升”，因为关系关键词仍然缺席。',
      },
      bridge:
        '“多写点形容词”这条直觉，论文用表 4 直接否掉了：ImageNet-R B0-10 上 GMM 80.72，加上 GPT-3.5 生成的描述标签只有 80.95。',
      analogy: {
        title: '两枚标签',
        text: '两只一模一样的瓶：左边贴“白底花纹”，右边贴“底款六年”——只有右边那枚能把它和高仿分开。',
        componentId: 'ana-3',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '两种标签，同一起跑线',
          desc: '按“同时比对”，让描述型标签和关系型标签从同一件证物出发，看各自的命中条停在哪里。',
          componentId: 'ch3-1',
        },
      ],
      formula: {
        lead: '原来的做法只是把两句文本丢进编码器比相似度，谁更像就判给谁——式 (3)。',
        unicode: 'pred = arg max sim(f<sub>text</sub>(s), f<sub>text</sub>(ŝ))',
        symbols: [
          { sym: 'pred', desc: '最终判定的类名。' },
          { sym: 'sim', desc: '两句文本向量之间的余弦相似度。' },
          { sym: 'f', desc: '文本编码器 f_text，把句子压成一个向量。' },
          { sym: 's', desc: '某个类的文本，可以是描述也可以是关系文本。' },
          { sym: 'ŝ', desc: '模型自己生成的那句描述。' },
        ],
      },
      insight:
        '论文的结论很直接：文本里的信息不换成关系就帮不上忙——表 4 里 KG-GMM 84.29，比只加描述标签的 80.95 高 3.34 个点。',
      takeaways: [
        { icon: '🏷️', title: '描述型标签', desc: '“白底花纹”能命中大类，高仿同样符合——这就是表 4 里 80.95 的那一行。' },
        { icon: '🔗', title: '关系型标签', desc: '“底款六年”这种事实只属于这一件，才把它钉住。' },
        { icon: '📉', title: '消融证据', desc: 'GMM 80.72 → 只加描述 80.95 → 换成关系 84.29。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '一张证物卡，就是一个三元组',
      badge: 'both',
      badgeLabel: '结构',
      paper: {
        loc: '§2.2 · §3.2 · 式 (4)(5) · 图 2',
        quote:
          '常识图谱是（头实体 head，关系 relation，尾实体 object）三元组的集合；每来一个新任务，先 E_t = E_{t−1} ∪ S_t ∪ 尾实体，得到临时图 G_t。',
      },
      bridge:
        '关系在论文里是一个很具体的三格结构：（头实体，关系，尾实体）。§2.2 说常识图谱就是这种三元组的集合，ConceptNet 有 800 万节点、2100 万条边。',
      analogy: {
        title: '一根红线',
        text: '把“这件器物”和“乾隆六年”用一根线系在一起，线拉紧打了个结——这条线就是一条（头实体，关系，尾实体）。',
        componentId: 'ana-4',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '把线索系到证物卡上',
          desc: '从下面六张值卡里挑出合适的，拖到证物卡的三个槽里：窑口、底款、纹样；放错槽会弹回。',
          componentId: 'ch4-1',
        },
      ],
      formula: {
        lead: '论文式 (4)(5)：新任务的实体集 = 旧实体 ∪ 新类 ∪ 新类的尾实体，三者合起来才是临时图 G_t。',
        unicode: 'G<sub>t</sub> = (E<sub>t</sub>, R<sub>t</sub>, F<sub>t</sub>)，E<sub>t</sub> = E<sub>t−1</sub> ∪ S<sub>t</sub> ∪ {e ∈ T(S<sub>t</sub>)}',
        symbols: [
          { sym: 'G', desc: '第 t 个任务时的临时图。' },
          { sym: 'E', desc: '实体集合，图里所有的节点；下标 t 表示当前任务。' },
          { sym: 'S', desc: '这一任务新来的类集合。' },
          { sym: 'T', desc: '取尾实体：顺着关系找到的那个对象。' },
          { sym: 'R', desc: '关系类型集合，比如窑口、底款、纹样。' },
          { sym: 'F', desc: '事实集合，也就是一条条三元组。' },
          { sym: 'e', desc: '单个实体；图中的任一节点。' },
        ],
      },
      insight:
        '每个新任务都先在旧图上加实体（式 4），再取子图 G_t——这就是“图会随案子长大”的算法来源，而不是有人手工往里塞卡片。',
      takeaways: [
        { icon: '🧾', title: '事实写成三元组', desc: '（这件器物，底款，乾隆六年）——论文 §2.2 的 (head, relation, object)。' },
        { icon: '🚫', title: '关系是有类型的', desc: '“瓷器”是类名不是槽里的值，接不到“底款”上。' },
        { icon: '➕', title: '每个任务都加节点', desc: 'E_t 在 E_{t−1} 上递增（式 4），图随任务长大。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '新案来了，挂哪三条',
      badge: 'both',
      badgeLabel: '选择',
      paper: {
        loc: '§3.2 · 式 (7) · 算法 1',
        quote:
          '每个类挂 r 条关系（论文默认 r = 3），并要求这 r 条能把它和相似旧类分开；剪枝只保留不在任何更早任务实体集里的实体。',
      },
      bridge:
        '论文给每个类挂 r 条关系，并要求这 r 条足以区分相似的旧类。挑线索的标准不是“像不像”，而是“旧案占没占”。',
      analogy: {
        title: '钉三枚',
        text: '三枚图钉依次钉到同一块线索板上——位置得挑，别钉在人人都钉过的地方。',
        componentId: 'ana-5',
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '挑三条专属线索',
          desc: '点六张线索卡，最多选三张。注意右边那个圆：它表示你和旧任务实体重叠了多少。',
          componentId: 'ch5-1',
        },
      ],
      insight:
        '§3.2 的剪枝规则就是为这件事写的：要保留的实体 e 不能落在任何更早任务的实体集里（式 7）。',
      takeaways: [
        { icon: '📍', title: '专属才有用', desc: '“窑口：景德镇”“底款：六年”只属于这一件，才能分开相似旧案。' },
        { icon: '♻️', title: '通用等于没挂', desc: '“是瓷器”“有釉”旧案早就占了，新案挂上仍然撞车。' },
        { icon: '✂️', title: '所以要先剪枝', desc: 'E′_t = {e ∈ E_t, e ∉ ∪ E_k}：旧任务实体一律不进子图。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '拿到鉴定语，回档案盒投票',
      badge: 'inf',
      badgeLabel: '推理',
      paper: {
        loc: '§3.3 · 式 (8) · 图 3 右',
        quote:
          '把生成的描述拆成 m 个三元组，去掉头实体，用关系对 (r_p, o_p) 在 G_t 里检索，命中次数最多的头实体就是 ĥ。',
      },
      bridge:
        '这是全文的心脏（§3.3）：把生成的描述拆成三元组，去掉头实体，只拿关系对去当前子图 G_t 里检索，谁被命中最多就是谁。',
      analogy: {
        title: '落笔之前',
        text: '先把鉴定语抄到勘验笔录上，一条条拆开，才有得查。',
        componentId: 'ana-6',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '五步认出这件证物',
          desc: '按“下一步”走完推理五步：抄鉴定语、拆三条、去头实体、数票、拼回前面。',
          componentId: 'ch6-1',
        },
      ],
      formula: {
        lead: '论文式 (8)：ĥ 是 G_t 里被关系对命中次数最多的头实体；图 3 右侧画的正是这次检索。',
        unicode: 's<sub>a</sub> = ĥ ⊕ s，ĥ = arg max<sub>h</sub> Σ<sub>p</sub> I[(h, r<sub>p</sub>, o<sub>p</sub>) ∈ G<sub>t</sub>]',
        symbols: [
          { sym: 'ĥ', desc: '图预测出来的头实体，也就是猜到的类名。' },
          { sym: '⊕', desc: '前置拼接：把类名加到描述开头（式 9）。' },
          { sym: 'arg max', desc: '在所有候选头实体里取票数最高的那个。' },
          { sym: 'Σ', desc: '把描述拆出的每条关系逐个累加。' },
          { sym: 'I', desc: '指示函数：这条三元组在图里命中记 1，没命中记 0。' },
          { sym: 'p', desc: '描述拆出来的三元组序号。' },
          { sym: 'G', desc: '当前任务可用的子图 G_t。' },
        ],
      },
      insight:
        '之所以要“去掉头实体”，是因为生成的类名本身可能就是错的；只用关系去查，才能绕开那句错话——这是 KG-GMM 与 GMM 的分水岭。',
      takeaways: [
        { icon: '🔍', title: '拆成三元组', desc: '一句鉴定语被拆成“窑口、底款、尺寸”这样的关系对。' },
        { icon: '🗳️', title: '子图里数票', desc: '命中最多的头实体就是 ĥ（式 8）。' },
        { icon: '📊', title: '单用 ĥ 还不够', desc: '表 4 第三行：只用 ĥ 是 82.77，拼回文本才到 84.29。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-7',
      title: '只改结论那一页',
      badge: 'trn',
      badgeLabel: '训练',
      paper: {
        loc: '§3.1 · §3.3 · 式 (2)',
        quote:
          '冻结图像编码器与 MiniGPT-4，只更新一个线性层，交叉熵作用在生成 token 上；B0 设置是 200 步 warmup、学习率 3e-6 的余弦退火。',
      },
      bridge:
        '训练这步论文写得很省：冻结图像编码器和 MiniGPT-4，只更新一个线性层，用交叉熵把描述对齐到关系文本（式 2）。B0 设置跑 200 步 warmup，学习率 3e-6。',
      analogy: {
        title: '只盖最后一页',
        text: '卷宗不动、证物卡不动，只在结论那一页上落笔——旧案才不会被改坏。',
        componentId: 'ana-7',
      },
      modules: [
        {
          kind: 'module',
          id: '7.1',
          title: '训练步数与两份卷宗',
          desc: '拖动“训练步数”，看新证的命中条往上走，旧案那条是不是一直不动——论文 B0 的 warmup 就是 200 步。',
          componentId: 'ch7-1',
        },
      ],
      formula: {
        lead: '论文式 (2)：交叉熵只作用在生成的 token 上，参数只落在最后那层线性投影。',
        unicode: 'L<sub>CE</sub> = −(1/m) Σ<sub>j</sub> s<sub>j</sub> · log ŝ<sub>j</sub>',
        symbols: [
          { sym: 'L', desc: '交叉熵损失；下标 CE 表示 cross-entropy。' },
          { sym: 's', desc: '标准答案里第 j 个 token。' },
          { sym: 'ŝ', desc: '模型预测第 j 个 token 的概率。' },
          { sym: 'm', desc: '这段描述的长度。' },
          { sym: 'Σ', desc: '对描述里的每个 token 累加。' },
        ],
      },
      insight:
        '遗忘被限住，不是因为损失函数多巧妙，而是改动范围极小：骨干冻结，动的只有一层线性层——这也是 GMM 原本就有的抗遗忘底子。',
      takeaways: [
        { icon: '🔒', title: '编码器冻结', desc: '视觉编码器和 MiniGPT-4 都不训练。' },
        { icon: '📝', title: '只改结论用语', desc: '式 (2) 对齐的是 token 概率，不是换掉整个模型。' },
        { icon: '🛡️', title: '遗忘被限住', desc: '旧案命中保持满格，改动被压在一层线性层里。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-8',
      title: '档案盒会长大，也要剪',
      badge: 'trn',
      badgeLabel: '架构',
      paper: {
        loc: '§3.2 Step 2 · 式 (6)(7) · 算法 1',
        quote:
          '临时图 G_t 剪成 G′_t，只保留能区分相似类的关系；直接关系被旧任务占完时，用第二跳（Clownfish RelatedTo River）代替已占用的 Water。',
      },
      bridge:
        '案子一轮轮进来，图会越来越大。§3.2 的 Step 2 专门做剪枝：临时图 G_t 剪成 G′_t，只留能区分相似类的关系（式 6、7）。',
      analogy: {
        title: '抽掉一张',
        text: '一张旧线索卡从盒里被抽出来——相似器物互相认错，就是因为盒里还留着旧案用过的通用卡。',
        componentId: 'ana-8',
      },
      modules: [
        {
          kind: 'module',
          id: '8.1',
          title: '一个会长的档案盒',
          desc: '切换第几次任务，再点画布里的任意节点；被剪掉的节点会变灰打叉——对应算法 1 的第 5–7 行。',
          componentId: 'ch8-1',
        },
      ],
      formula: {
        lead: '论文式 (6)(7)：G′_t 只保留不属于任何更早任务实体集的实体。',
        unicode: 'G′<sub>t</sub> = (E′<sub>t</sub>, R′<sub>t</sub>, F′<sub>t</sub>)，E′<sub>t</sub> = {e ∈ E<sub>t</sub>, e ∉ ∪<sub>k &lt; t</sub> E<sub>k</sub>}',
        symbols: [
          { sym: 'G′', desc: '剪枝之后的子图；撇号表示“剪过”。' },
          { sym: 'E′', desc: '保留下来的实体集合。' },
          { sym: '∪', desc: '并集：把更早任务用过的实体全部并起来。' },
          { sym: '∉', desc: '不属于：当前实体不能落在那个并集里。' },
          { sym: 'E', desc: '未剪枝时当前任务的实体集合。' },
          { sym: 'k', desc: '更早的任务序号，取值小于当前任务 t。' },
          { sym: 'R′', desc: '关系集，随保留的实体一起收缩。' },
          { sym: 'F′', desc: '事实集，随保留的实体一起收缩。' },
        ],
      },
      insight:
        '剪完还不够时，论文允许走第二跳：Clownfish 的直接关系被旧任务占掉，就顺 RelatedTo 到 River 补位（图 2 的橙蓝配色画的就是新旧任务各用哪条关系）。',
      takeaways: [
        { icon: '🌱', title: '先长后剪', desc: 'E_t 先扩张（式 4），再按式 (7) 收缩。' },
        { icon: '✂️', title: '剪掉撞车的', desc: '“有釉”上一任务用过，留着就会让两件器物互相认错。' },
        { icon: '🪜', title: '不够就二跳', desc: '改走 Clownfish → River 这种更远的关系补位。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-9',
      title: '三条够不够，结论写多长',
      badge: 'trn',
      badgeLabel: '取舍',
      paper: {
        loc: '§4.4 · 表 5 · 图 5',
        quote:
          'r = 3：平均 75 字、生成 9.67 s、存储 0.07 MB、查图 0.53 ms、准确率 84.29；r = 4 只多 0.02 个点，却多花 3 秒——所以 r = 3 是超参。',
      },
      bridge:
        'r 取 3 不是拍脑袋。表 5 把 r = 0/2/3/4 的成本全列了出来：平均字数、生成秒数、存储、查图毫秒和准确率。',
      analogy: {
        title: '别一枚回形针',
        text: '线索挂几条、报告写多长，总得有个停的地方——回形针就是那个“停”。',
        componentId: 'ana-9',
      },
      modules: [
        {
          kind: 'module',
          id: '9.1',
          title: '挂几条最划算',
          desc: '点 r = 0 / 2 / 3 / 4 四个按钮，看三组横条怎么一起变——数字全部取自表 5。',
          componentId: 'ch9-1',
        },
        {
          kind: 'module',
          id: '9.2',
          title: '字数与时间',
          desc: '拖动“平均字数”滑块，刻度尺上的游标在 30 / 51 / 75 / 102 四个实测点之间移动。',
          componentId: 'ch9-2',
        },
      ],
      insight:
        'r = 4 只把 84.29 抬到 84.31，却多花 2.96 秒、多 0.01 MB 存储；论文因此把 r = 3 定成默认——收益递减点就在这儿。',
      takeaways: [
        { icon: '⚖️', title: '收益递减', desc: 'r 从 3 到 4：+0.02 个点，生成多 2.96 秒（9.67 → 12.63）。' },
        { icon: '📏', title: 'r = 3 是选择', desc: '84.29、9.67 s、0.07 MB、0.53 ms，权衡后的落点。' },
        { icon: '⏱️', title: '字不是越多越好', desc: '字数 30 → 102，时间线性涨，收益停在 84.3 附近。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-10',
      title: '结案陈词',
      badge: 'both',
      badgeLabel: '结果',
      paper: {
        loc: '§4.2–4.3 · 表 1–3',
        quote:
          'Tiny-ImageNet B100-5 上 86.17 / 81.86 对 GMM 83.42 / 76.98；ImageNet-R 84.29 对 80.72（+3.57）；CIFAR-100 79.68 对 75.43（+4.25）；Mini-ImageNet 最终 78.07（+2.89）。',
      },
      bridge:
        '结案表用论文的三张主表：Tiny-ImageNet 与 ImageNet-R 看表 1，CIFAR-100 看表 3，Mini-ImageNet 看表 2。数字都按同一协议读。',
      analogy: {
        title: '一起归档',
        text: '两叠案卷沿桌面滑向“结案”标记——结案表只认最后一格，谁的卷宗落位多谁留下。',
        componentId: 'ana-10',
      },
      modules: [
        {
          kind: 'module',
          id: '10.1',
          title: '同一张结案表',
          desc: '按“开始结案”让两条赛道同时出发，再切指标；注意 PD 是掉点，越低越好。',
          componentId: 'ch10-1',
        },
      ],
      insight:
        '同一批表里，KG-GMM 在 Tiny B100-5 是 86.17 / 81.86，在 ImageNet-R 是 84.29（+3.57），CIFAR-100 是 79.68（+4.25）——三套数据、同一结论。',
      takeaways: [
        { icon: '🥇', title: '同一协议才可比', desc: 'Tiny B100-5：Avg 86.17 / Last 81.86，对 GMM 83.42 / 76.98。' },
        { icon: '🧭', title: '指标方向不同', desc: 'Mini HAcc 74.81 对 71.45；PD 12.93 对 14.17，越低越好。' },
        { icon: '🧱', title: '边界要写明', desc: '无样本回放设置；ImageNet-R 84.29 比 CODA-Prompt 73.88 高 10.41 个点。' },
      ],
    },
  ],
};

export default tutorial;
