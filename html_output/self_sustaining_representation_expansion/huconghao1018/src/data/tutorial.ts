import type { TutorialData } from '../types';

// 论文：Self-Sustaining Representation Expansion for Non-Exemplar Class-Incremental Learning (CVPR 2022)
// 主题：班主任的烦恼。所有数值均取自论文 Table 1/2/3/4 与 Fig.4。
// 示意图（stress-test、compare-methods、lambda-slider、stage-progress）已在模块里标注"示意"，不与论文数值混用。

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'Self-Sustaining Representation Expansion for Non-Exemplar Class-Incremental Learning',
    titleZh: '自持续表征扩展：不存旧样本的类增量学习',
    venue: 'CVPR 2022',
    authors: 'Kai Zhu, Wei Zhai, Yang Cao, Jiebo Luo, Zheng-Jun Zha',
    affiliation: '中国科学技术大学 · 罗切斯特大学 · 合肥综合性国家科学中心人工智能研究院',
    domain: '非样本类增量学习（NECIL）',
    coreProblem:
      '旧类样本一个都不许存，模型还得在每一批新类到来后认出所有见过的类。常规做法要么直接微调（遗忘），要么每批加一整条新网络（参数线性膨胀）。',
    coreInsight:
      '不动旧结构，只在每个卷积块旁边加一条可合并的侧分支：新知识写进侧分支，老特征留在主干，训练结束后把侧分支无损折算回主干，结构回到起点，下一批再来一次。',
    keywords: ['类增量学习', 'NECIL', '残差适配器', '结构重参数化', '知识蒸馏'],
  },

  hero: {
    oldMethod: {
      desc: '常规做法：直接微调，新类的梯度把老类的判别方向冲掉；或者每来一批就扩一条新网络，参数随批次线性增长。',
      componentId: 'hero-old',
    },
    newMethod: {
      desc: '本文做法：主干冻结，每个卷积块挂一条 1×1 侧分支学新类，蒸馏在主干上保旧类，训练完把侧分支重参数化回主干——结构不增，批次照加。',
      componentId: 'hero-new',
    },
  },

  chapters: [
    // ------------------------------------------------------------------ 1
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '又来新同学了',
      badge: 'inf',
      badgeLabel: '问题',
      bridge:
        '王老师带这个班两年，五十个学生的名字、座位、谁跟谁熟，闭着眼都能点出来。这学期开学，转来五个新生，得插进他班。麻烦不在"多五个人"，而在于——不许把老同学的档案调出来看。',
      analogy: {
        title: '班主任的烦恼',
        text: '新生站在门口，老同学的资料一份都不让查。王老师只能凭印象把人安顿进去，同时还得保证老同学没被记混。可印象这东西，添一个新人就淡一分。',
        componentId: 'ana1',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '新同学压力测试',
          desc:
            '拖动滑块，一批一批往后加。橙色是这一批刚进来的新生，红色是被认错的老同学——越早的那几批，红得越厉害。',
          componentId: 'stress-test',
        },
      ],
      insight:
        'NECIL 难的地方不在新类，而在旧类的监督信号彻底断了：分类损失只看得见新样本，蒸馏也只能在剩下的特征上做。',
      formula: {
        lead: '每一批只拿到新类的数据和标签，旧类的样本集合是空的：',
        unicode:
          'θ<sup>n</sup> = argmin<sub>θ</sub> 𝓛<sub>ce</sub>(X<sup>n</sup>, Y<sup>n</sup>; θ)　　s.t.　X<sup>1</sup> … X<sup>n−1</sup> = ∅',
        symbols: [
          { sym: 'θ<sup>n</sup>', desc: '第 n 批训练完的模型参数' },
          { sym: 'X<sup>n</sup>, Y<sup>n</sup>', desc: '第 n 批的新类图像和标签（唯一拿得到的数据）' },
          { sym: '𝓛<sub>ce</sub>', desc: '交叉熵分类损失' },
          { sym: '∅', desc: '旧类样本为空——这就是与常规类增量学习的分界线' },
        ],
      },
      takeaways: [
        {
          icon: '🏫',
          title: 'NECIL 的设定',
          desc: '旧样本一个都不存（只留每类一个特征均值），测试时却要认出所有见过的类——类别来自前 n 批的并集。',
        },
        {
          icon: '📉',
          title: '直接微调会怎样',
          desc: '新类的梯度把旧类的判别方向覆盖掉，旧类准确率随着批次往下掉，这就是灾难性遗忘。',
        },
        {
          icon: '🧭',
          title: '论文的切口',
          desc: '不动旧特征的表达，只在新方向上扩张，训练完再合并回来——结构可以循环使用。',
        },
      ],
    },

    // ------------------------------------------------------------------ 2
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '每个同学的特点',
      badge: 'inf',
      badgeLabel: '表征',
      bridge:
        '王老师认人不看学号，看特点：谁高、谁爱说话、谁坐不住。特点不重叠，就不容易叫错名字。网络认类也一样，靠的是特征空间里的位置。',
      analogy: {
        title: '同学特点分布',
        text: '把每个同学按"高矮"和"安静程度"摆到一张图上，同一类的人自然挤成一团。新同学要是正好落在老同学的团里，老师就只能靠一条很窄的缝去分。',
        componentId: 'ana2',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '把新同学拖进特点空间',
          desc:
            '拖动带"新"字标签的点，看它离三个老类簇有多近。右侧是归一化余弦相似度，超过论文用的 0.8 就算混进老同学的团里了。',
          componentId: 'feature-space',
        },
      ],
      insight:
        '增量学习真正要保护的不是分类器，而是老类在特征空间里的相对位置。位置一乱，后面的蒸馏和分类都无从谈起。',
      formula: {
        lead: '一张图进来，先被主干映射成特征：',
        unicode: 'r<sub>q</sub><sup>n</sup> = f<sub>e</sub><sup>n</sup>(Q; θ<sub>e</sub><sup>n</sup>)',
        symbols: [
          { sym: 'Q', desc: '当前批次输入的图像' },
          { sym: 'f<sub>e</sub><sup>n</sup>', desc: '第 n 批的特征提取器（ResNet-18）' },
          { sym: 'θ<sub>e</sub><sup>n</sup>', desc: '主干参数' },
          { sym: 'r<sub>q</sub><sup>n</sup>', desc: '得到的 512 维特征' },
        ],
      },
      takeaways: [
        {
          icon: '📍',
          title: '一个样本就是一个点',
          desc: '分类器只是在切这张图，切得开不开，取决于点团之间留了多少空隙。',
        },
        {
          icon: '🧩',
          title: '判别力看两件事',
          desc: '类内要聚，类间要散。两个指标一起看，才谈得上"分得开"。',
        },
        {
          icon: '⚠️',
          title: '微调在挪什么',
          desc: '它把老类的点团往新类方向拉，团还在，但位置漂了，原来那条边界就不管用了。',
        },
      ],
    },

    // ------------------------------------------------------------------ 3
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '不动教室加新座位',
      badge: 'inf',
      badgeLabel: '核心思路',
      bridge:
        '既然重排全班会把老关系搞乱，那就别动原来的座位：在后面加一排新的，新同学坐新排。老同学之间谁挨着谁，一点没变。',
      analogy: {
        title: '后面加一排新座位',
        text: '王老师没让任何人挪位置，只在最后一排添了几把椅子。老同学的相对位置保住了，新同学也有地方坐——两边互不打扰。',
        componentId: 'ana3',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '两种排座方案同时开跑',
          desc:
            '点「同时开始」：左边把全班重新排一遍（微调基线），右边老座位锁死、只加一排新座位（DSR，动态结构重组）。两边同一批新生、同样轮数，只有结构策略不同（柱状数值为示意）。',
          componentId: 'compare-methods',
        },
      ],
      insight:
        '冻结主干 + 侧分支，等于把"旧特征的表达"和"新知识的学习"拆成两条互不干扰的通路。梯度只走侧分支，主干一个参数都不动。',
      formula: {
        lead: '结构扩张之后，主干是固定的，新知识只进 Δθ：',
        unicode:
          'f<sub>e</sub><sup>n</sup>(Q; θ<sub>e</sub><sup>n</sup>) = f<sub>e</sub><sup>n−1</sup>(Q; θ̂<sub>e</sub><sup>n−1</sup> ⊕ Δθ<sub>e</sub><sup>n</sup>)',
        symbols: [
          { sym: 'θ̂', desc: '带帽子的参数：已冻结，不再更新' },
          { sym: 'Δθ<sub>e</sub><sup>n</sup>', desc: '这一批新加的侧分支参数（只有一个 1×1 卷积）' },
          { sym: '⊕', desc: '结构扩张：在原卷积块旁边挂一条支路' },
        ],
      },
      takeaways: [
        {
          icon: '🪑',
          title: '只加不改',
          desc: '老结构完全冻结，新能力挂在旁边。这是"保住旧特征"最直接的做法。',
        },
        {
          icon: '🧊',
          title: '两条通路',
          desc: '主干负责旧类，侧分支负责新类，梯度不会互相覆盖。',
        },
        {
          icon: '🚪',
          title: '代价',
          desc: '侧分支让参数暂时变多、前向多一条路，所以后面必须能把它合回去（第 9 章）。',
        },
      ],
    },

    // ------------------------------------------------------------------ 4
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '三本账一起算',
      badge: 'both',
      badgeLabel: '损失函数',
      bridge:
        '加座位不是免费的：新生要记住，老同学不能忘，两边还不能混。三件事对应三个损失项，各管一摊。',
      analogy: {
        title: '老师的三本账',
        text: '一本记新名字，一本记老印象，一本管两边别弄混。三本都得翻，但每本的权重不一样——哪本太轻，哪件事就先塌。',
        componentId: 'ana4',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '调蒸馏权重 λ',
          desc:
            '拖动 λ：左侧三条账（记新人 / 保旧人 / 平新旧）的重量一起变，右侧旧类保持率与新类学会率此消彼长。论文把 λ 和 γ 都定在 10。',
          componentId: 'lambda-slider',
        },
      ],
      formula: {
        lead: '总损失是三本账的加权和：',
        unicode:
          '𝓛 = 𝓛<sub>ce</sub> + λ 𝓛<sub>kd</sub> + γ 𝓛<sub>proto</sub>　,　λ = γ = 10',
        symbols: [
          { sym: '𝓛<sub>ce</sub>', desc: '新类的交叉熵：让新同学被认对' },
          { sym: '𝓛<sub>kd</sub>', desc: '与上一批特征做欧氏距离的蒸馏项：让老特征别飘' },
          { sym: '𝓛<sub>proto</sub>', desc: '原型过采样到 batch size 后的交叉熵：压住新旧类的数量失衡' },
          { sym: 'λ', desc: '蒸馏项的权重，论文固定为 10，不按数据集单独调' },
          { sym: 'γ', desc: '原型平衡项的权重，同样固定为 10' },
        ],
      },
      takeaways: [
        {
          icon: '📒',
          title: '三项各管一件事',
          desc: '交叉熵项管新类学会，蒸馏项管旧类不忘，原型项管类别数不均衡。',
        },
        {
          icon: '⚖️',
          title: '蒸馏用的不是 KL',
          desc: '论文这一路叫主干蒸馏（MBD），直接对特征算欧氏距离，比对齐 logits 更贴近"保住特征分布"这个目标。',
        },
        {
          icon: '🎯',
          title: '原型只是均值',
          desc: '每类在特征空间存一个原型（均值），过采样到 batch size 参与训练——不存图片，所以仍然满足 E=0。',
        },
      ],
    },

    // ------------------------------------------------------------------ 5
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '哪几个老同学最有代表性',
      badge: 'both',
      badgeLabel: '原型选择',
      bridge:
        '不是所有新生都该拿去和老印象对比。像老同学的，拿去蒸馏；不像的，专心学新东西。这套筛法叫原型选择（PSM），问题是怎么判"像"。',
      analogy: {
        title: '挑几个样板同学',
        text: '王老师只把最像老班风格的那几个新生叫去对比，其余的让他们自己适应。挑多了，新东西学不进去；挑少了，老风格保不住。',
        componentId: 'ana5',
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '阈值把新生分成两组',
          desc:
            '拖阈值 σ：相似度高于 σ 的新同学去蒸馏（保旧），低于 σ 的专心学新类。下方三条曲线是论文 Fig.4 在 CIFAR-100 上的真实结果，5/10/20 批都在 0.8 处到顶。',
          componentId: 'threshold-select',
        },
      ],
      insight:
        '阈值 0.8 不是拍脑袋：论文把 σ 从 0.5 扫到 0.85，三条曲线同步升到 0.8 见顶，再往上就开始掉——说明"像老类的样本"确实该单独分出去。',
      formula: {
        lead: '先用归一化余弦算相似度，再用阈值决定这一条样本走哪本账：',
        unicode:
          'S<sub>i</sub> = Cosine(N(r<sub>q</sub><sup>n</sup>), Nor(Prototype))<br/>𝓛 = Mask<sub>ce</sub>(𝓛<sub>ce</sub>) + λ Mask<sub>kd</sub>(𝓛<sub>kd</sub>) + γ 𝓛<sub>proto</sub>',
        symbols: [
          { sym: 'S<sub>i</sub>', desc: '第 i 个新样本与老类原型的相似度' },
          { sym: 'N', desc: '对新样本特征做归一化' },
          { sym: 'Nor', desc: '对老类原型做归一化，两边可比才算得出余弦' },
          { sym: 'Mask<sub>kd</sub>', desc: 'S > σ 时打开：这些样本参与蒸馏' },
          { sym: 'Mask<sub>ce</sub>', desc: 'S < σ 时打开：这些样本参与新类训练' },
        ],
      },
      takeaways: [
        {
          icon: '🎯',
          title: '一份样本只干一件事',
          desc: '要么保旧，要么学新。两条损失同时压在同一个样本上，反而互相拖。',
        },
        {
          icon: '📈',
          title: '实测峰值',
          desc: 'σ=0.8 时 CIFAR-100 的 5/10/20 批分别是 65.88% / 65.04% / 61.70%。',
        },
        {
          icon: '🧩',
          title: '顺带修了蒸馏',
          desc: '把"像旧类"的样本挑出来蒸馏，等于给蒸馏补了它缺的那部分旧分布信息。',
        },
      ],
    },

    // ------------------------------------------------------------------ 6
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '新同学来了坐哪',
      badge: 'inf',
      badgeLabel: '推理',
      bridge:
        '新生进门那一刻，老师心里其实只有一条判断链：先看长相（主干特征），再看和新座位区的匹配（侧分支），两路一合，决定归哪类。',
      analogy: {
        title: '新同学往哪边走',
        text: '新生站在门口，先看像文静组还是活泼组，再往那边走。分组分对了，后面才知道怎么对待他。',
        componentId: 'ana6',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '分五步走完推理路径',
          desc:
            '一步一步点：门口 → 主干（冻结）→ 侧分支 → 相加 → 讲台分类。每一步都给出当前的张量形状和是否更新参数。',
          componentId: 'inference-path',
        },
      ],
      insight:
        '训练时是两条路，推理时是一条路——这不是两个模型，而是同一个模型在<a class="term" href="#chap-9">重参数化</a>后只剩一条等价通路。',
      takeaways: [
        {
          icon: '🔀',
          title: '先分后合',
          desc: '主干输出老特征，侧分支输出 Δr，相加得到 rⁿ，维度始终是 512。',
        },
        {
          icon: '🔗',
          title: '推理不额外花钱',
          desc: '重参数化把侧分支折进主干，推理时的计算量和原始 ResNet-18 一样。',
        },
        {
          icon: '⚡',
          title: '输出维度随批次长',
          desc: '分类器输出等于已见类别数：每批 c 个类时，第 n 批就是 cn 维——只扩输出层，不用重训整个分类头。',
        },
      ],
    },

    // ------------------------------------------------------------------ 7
    {
      kind: 'chapter',
      id: 'chap-7',
      title: '分阶段加人',
      badge: 'trn',
      badgeLabel: '训练',
      bridge:
        '一次来五个还能应付，一次来五十个就乱了。真实的课堂是一批一批来的，网络也得按批训练，每批都要既学会新的、又保住旧的。',
      analogy: {
        title: '分学期转学',
        text: '每学期只转来一批。老师每学期做同一件事：把新的一批安顿好，同时确认前面几批还记得——学期一块块往墙上加。',
        componentId: 'ana7',
      },
      modules: [
        {
          kind: 'module',
          id: '7.1',
          title: '一批一批往后推',
          desc:
            '每按一次「再来一批」，座位多一排，两条曲线继续走。绿色是本文，红色是纯微调——批次越多，差距越大。',
          componentId: 'stage-progress',
        },
      ],
      formula: {
        lead: '沿用 PASS 的评测口径，两个指标分别是（前者越高越好，后者越低越好）：',
        unicode:
          'A<sub>avg</sub> = (1/T) Σ<sub>i=1</sub><sup>T</sup> A<sub>i</sub><br/>F<sub>avg</sub> = (1/(T−1)) Σ<sub>i=1</sub><sup>T−1</sup> ( max<sub>j&lt;i</sub> A<sub>j,i</sub> − A<sub>T,i</sub> )',
        symbols: [
          { sym: 'A<sub>i</sub>', desc: '第 i 批结束时、对所有已见类的准确率' },
          { sym: 'T', desc: '总批次数（5 / 10 / 20）' },
          { sym: 'A<sub>j,i</sub>', desc: '第 j 批学完后对第 i 批类的准确率' },
          { sym: 'F<sub>avg</sub>', desc: '每批历史最好成绩与最终成绩之差的平均，衡量遗忘' },
        ],
      },
      takeaways: [
        {
          icon: '⚙️',
          title: '训练设置',
          desc: 'ResNet-18，Adam，初始学习率 0.001，衰减 0.0005，100 个 epoch，batch size 128。',
        },
        {
          icon: '📅',
          title: '批次切分',
          desc: 'CIFAR-100 和 TinyImageNet 各切成 5 / 10 / 20 批，每批类别互不重叠，ImageNet-Subset 只做 10 批。',
        },
        {
          icon: '📏',
          title: '两个评测指标',
          desc: '平均增量准确率（含第一阶段）看整体水平，平均遗忘率（average forgetting）看抗遗忘能力。',
        },
      ],
    },

    // ------------------------------------------------------------------ 8
    {
      kind: 'chapter',
      id: 'chap-8',
      title: '新座位怎么安排',
      badge: 'trn',
      badgeLabel: '结构',
      bridge:
        '新座位具体长什么样？不是加一整层网络，而是在每个卷积块旁边挂一个小小的适配器——够用就行，不必豪华。',
      analogy: {
        title: '给每排接一条窄桌板',
        text: '不是重建教室，而是在每排座位侧面接一条窄桌板：不占地方，能放东西，拆下来也不影响原来的桌子。',
        componentId: 'ana8',
      },
      modules: [
        {
          kind: 'module',
          id: '8.1',
          title: '点开适配器看结构',
          desc:
            '点画布上的任意方框，看它负责什么。切换适配器结构，参数量和论文 Table 2 的准确率一起变——1×1 卷积就够，3×3 反而更差。',
          componentId: 'adapter-arch',
        },
      ],
      formula: {
        lead: '侧分支只做一个 1×1 卷积，然后与主干输出相加：',
        unicode:
          'f<sub>e</sub><sup>n</sup>(Q) = f<sub>e</sub><sup>n−1</sup>(Q; θ̂<sub>e</sub><sup>n−1</sup>) + Conv<sub>1×1</sub>( f<sub>e</sub><sup>n−1</sup>(Q; θ̂<sub>e</sub><sup>n−1</sup>) )',
        symbols: [
          { sym: 'Conv<sub>1×1</sub>', desc: '只做通道线性组合，参数量约 C²' },
          { sym: '+', desc: '残差相加：逐元素相加，维度和主干保持一致' },
          { sym: 'θ̂', desc: '输入到适配器的主干特征是冻结的' },
        ],
      },
      takeaways: [
        {
          icon: '🪑',
          title: '每个卷积块都挂',
          desc: '不是只加在最后一层，而是 ResNet-18 的每个卷积块旁边都加一条。',
        },
        {
          icon: '📏',
          title: '1×1 就够',
          desc: '5 批上 1×1 是 65.87%，3×3 是 64.28%，参数却是 9 倍——多出来的表达力没用上。',
        },
        {
          icon: '🔗',
          title: '加法是关键',
          desc: '只有"线性 + 相加"这种形式，才能在第 9 章被精确合并进主干卷积。',
        },
      ],
    },

    // ------------------------------------------------------------------ 9
    {
      kind: 'chapter',
      id: 'chap-9',
      title: '拆掉临时过道',
      badge: 'trn',
      badgeLabel: '重参数化',
      bridge:
        '侧分支学完了，如果一直留着，参数会一批批往上堆，几批之后就没法看了。能不能把它折进主干？',
      analogy: {
        title: '撤掉临时隔板',
        text: '新座位区和老座位区之间本来隔着一块临时的板。等大家都熟悉了，把板撤掉，两片连成一片——看起来就像一开始就是一间大教室。',
        componentId: 'ana9',
      },
      modules: [
        {
          kind: 'module',
          id: '9.1',
          title: '把侧分支拖进主干',
          desc:
            '拖融合手柄从「训练」到「推理」：侧分支被折进主干卷积核，参数量回落，而示意输出 (0.42, −0.17) 一点没变。',
          componentId: 'reparam-compare',
        },
      ],
      insight:
        '重参数化能成立的前提是"线性 + 相加"：1×1 卷积和 BN 都是线性变换，通过零填充对齐卷积核尺寸后，可以精确合并进主干，误差为零。',
      formula: {
        lead: '合并之后，侧分支消失，结构回到和原来一样的形状：',
        unicode:
          'f<sub>e</sub><sup>n−1</sup>(Q; θ̂<sub>e</sub><sup>n−1</sup> ⊕ Δθ<sub>e</sub><sup>n</sup>) = f<sub>e</sub><sup>n</sup>(Q; θ′<sub>e</sub><sup>n</sup> ⊕ 0) = f<sub>e</sub><sup>n</sup>(Q; θ′<sub>e</sub><sup>n</sup>)',
        symbols: [
          { sym: 'θ′<sub>e</sub><sup>n</sup>', desc: '融合后的主干参数（含侧分支信息）' },
          { sym: '0', desc: '侧分支残留为 0：不再有额外支路' },
          { sym: '⊕', desc: '结构扩张：在卷积块旁边挂一条支路，合并后这一项归零' },
        ],
      },
      takeaways: [
        {
          icon: '🔨',
          title: '训练双路，推理单路',
          desc: '训练时借侧分支隔离梯度，推理前合并回去，结构不随批次增长。',
        },
        {
          icon: '🔁',
          title: '为什么叫"自持续"',
          desc: '每批结束后结构回到起点，下一批可以在同样的位置再扩一次——循环成立。',
        },
        {
          icon: '🎭',
          title: '这不是剪枝',
          desc: '剪枝会丢信息；重参数化是等价变换，输出和参数利用率都不损失。',
        },
      ],
    },

    // ------------------------------------------------------------------ 10
    {
      kind: 'chapter',
      id: 'chap-10',
      title: '哪个班管理得最好',
      badge: 'both',
      badgeLabel: '结果',
      bridge:
        '三个数据集、三种批次切分，和 NECIL 的 SOTA 以及一批带样本的方法比。谁的班到最后一个都没记混？',
      analogy: {
        title: '班主任大比武',
        text: '几个班主任同场：有的每类存二十份档案（带样本），有的只凭印象。终点线一样，看谁最后认对的类最多。',
        componentId: 'ana10',
      },
      modules: [
        {
          kind: 'module',
          id: '10.1',
          title: '平均增量准确率对比',
          desc:
            '选数据集和批次数，点「开始评比」，四条从 40% 起跑的条按论文 Table 3 的真实数值长出来。绿色是本文（E=0，不存样本）。',
          componentId: 'result-race',
        },
        {
          kind: 'module',
          id: '10.2',
          title: '拆开看每个组件',
          desc:
            '点任意一条，看这组组件的表现。<a class="term" href="#chap-3">DSR</a>、<a class="term" href="#chap-4">MBD</a>、<a class="term" href="#chap-5">PSM</a> 单拎出来都不如组合，20 批时差距最明显——长期遗忘才是真正被解决的痛点。',
          componentId: 'ablation',
        },
      ],
      insight:
        '数字之外要看边界：全部实验都在 ResNet-18 上，每类只存一个特征原型（不含图片），批次越多优势越大——它解决的是长期遗忘，不是单批精度。',
      takeaways: [
        {
          icon: '🏆',
          title: '三个数据集都领先',
          desc: 'CIFAR-100：65.88 / 65.04 / 61.70；TinyImageNet：50.39 / 48.93 / 48.17；ImageNet-Subset（10 批）：67.69。',
        },
        {
          icon: '📉',
          title: '遗忘率更低',
          desc: 'CIFAR-100 平均遗忘 18.37%，PASS 是 25.20%；TinyImageNet 20 批时 14.20%，PASS 是 30.55%。',
        },
        {
          icon: '🔬',
          title: '批次越多越明显',
          desc: 'TinyImageNet 20 批比 PASS 高 6.10 个点；CIFAR-100 20 批比最强的 SDC 高 2.80 个点——长期累积的误差才是这套方法真正处理的问题。',
        },
      ],
    },
  ],
};
