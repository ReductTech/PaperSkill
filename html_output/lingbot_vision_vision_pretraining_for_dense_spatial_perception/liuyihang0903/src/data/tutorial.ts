import type { TutorialData } from '../types';

// ============================================================================
//  LingBot-Vision 交互教程 — 面向密集空间感知的视觉预训练
//  内容按 稿子.md 的 4 分钟讲解逻辑组织：开场 → 问题 → 方法(总览→干净标签→联合训练) → 证据 → 落地收尾。
//  风格约定：真实技术语言，术语首次出现即展开；讲解逻辑为主，交互仅作辅助。
// ============================================================================

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'Vision Pretraining for Dense Spatial Perception',
    titleZh: '面向密集空间感知的视觉预训练：LingBot-Vision',
    venue: 'arXiv 2026 · LingBot-Vision',
    authors: 'Fu, Tan, Sun, Liu, Zheng, Xu, Zhu, Shen, Xue 等',
    affiliation: 'Robbyant / Orbbec 相关团队',
    domain: '视觉 · 自监督预训练 · 深度估计 · 分割',
    coreProblem:
      '现在的视觉大模型很会「认东西」——给它一张图，能说出「这是猫、这是车」。但它不太会「量空间」——说不出「边界在哪、离我多远、结构如何」。而机器人抓杯子、避障、自动驾驶要的恰恰是后者：像素级的深度、边界、几何。',
    coreInsight:
      '这篇论文就干一件事：让同一个 ViT 在预训练时，同时学会「这是什么」和「结构在哪」。做法：让 Teacher（老师网络）在线预测边界，用 角点+投票+a-contrario（反证法统计检验）三步把噪声预测洗成干净标签；被验证的边界<b>强制进入掩码</b>（M⁺ = M ∪ B，掩码=遮住部分输入让学生猜），再以<b>分类化</b>几何目标监督 Student（学生网络）。结果：1B 参数在深度估计上超过 7B 的 DINOv3。',
    keywords: ['自监督学习', '边界建模', '掩码建模', 'Teacher-Student', '深度估计', 'LingBot-Vision'],
  },

  hero: {
    oldMethod: {
      desc: '传统自监督 = 随机掩码 + 语义蒸馏：它让每个 patch（图像小块）的特征按<b>语义</b>聚类，擅长回答「这是什么」，但<b>几何结构稀疏</b>——一问「有多深、边界在哪」，特征就露怯。',
      componentId: 'hero-old-canvas',
    },
    newMethod: {
      desc: 'LingBot-Vision：<b>边界强制掩码</b> + 分类化几何目标。语义与几何同时涌现——1B 参数在 NYUv2 深度上 RMSE 0.296，<b>超过 7B DINOv3（0.309）</b>。',
      componentId: 'hero-new-canvas',
    },
  },

  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '开场：会认东西，却不会量空间',
      badge: 'inf',
      badgeLabel: '基础',
      bridge:
        '一句话概括这篇论文的核心矛盾：现在的视觉大模型很会认东西，却不大会量空间。这一章把这两件事分清——「这是什么」和「结构在哪」是两套不同的要求。',
      analogy: {
        title: '同一张图，两种问法',
        text: '看同一张图：<strong>语义视角</strong>回答「这是什么」（一个类别）；<strong>空间感知视角</strong>要逐像素回答「边界在哪、离我多远、结构如何」——输出的是<strong>边界、深度、几何</strong>。上图是论文 Fig.6 的特征分布：纯语义模型的点按「语义」聚团，而 LingBot 的点还沿边界几何展开。',
        figure: '/images/fig6_pca.jpg',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '两种读法：语义 vs 空间',
          desc: '点两个按钮，看同一个模型怎么「读」同一张图：<br/><b>语义识别</b>——模型只需给出类别（猫/车/建筑），几何怎么变都不影响答案；<br/><b>空间感知</b>——模型要逐像素回答「这里是边界吗、离我多远、结构如何」。深度估计、语义分割、视频跟踪、机器人导航全是后一类任务，对几何极度敏感——而这正是主流预训练最弱的一环。',
          componentId: 'm-1-1',
        },
      ],
      insight:
        '「认得出」和「看得清结构」是两件事。主流预训练追求的语义不变性（怎么变都认得），代价正是丢了「结构在哪」；而边界不是细节，是空间理解的骨架。',
      takeaways: [
        { icon: '🧩', title: '两类任务', desc: '识别（是什么）与密集空间感知（边界/深度/几何）是两套要求。' },
        { icon: '⚖️', title: '语义≠几何', desc: '能分类物体，不等于知道它的轮廓、深度与三维位置。' },
        { icon: '🤖', title: '机器人最敏感', desc: '具身智能把空间误差放大成错误动作，对几何精度要求极高。' },
      ],
    },

    {
      kind: 'chapter',
      id: 'chap-2',
      title: '基础回顾：Teacher-Student 与 DINO/iBOT',
      badge: 'inf',
      badgeLabel: '基础',
      bridge:
        '先回顾主流预训练（DINO/iBOT）是怎么学的：自监督（self-supervision）——没有人工标注，让模型自己给自己出题。这一章把地基讲清：Teacher 与 Student 谁是谁、DINO 与 iBOT 各出什么题，并用一张图总览整条算法闭环。',
      analogy: {
        title: 'Teacher 是 Student 的「慢版本」',
        text: '两个网络结构相同：<strong>Student（θ）</strong>真正被梯度更新、负责学习；<strong>Teacher（θ̄）</strong>是它的指数滑动平均（EMA）——一种「取历史平均」的平滑方法，不参与梯度、只负责出题。每次优化后 θ̄ ← λθ̄ + (1−λ)θ，让 Teacher 缓慢「追」上 Student。',
        componentId: 'an1',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '自蒸馏两块基石：DINO 与 iBOT',
          desc: '点两个按钮看两块基石：<br/><b>DINO（无标签自蒸馏）</b>——用一个 CLS 记号（把整张图浓缩成的一个向量）做整图级语义蒸馏：同一物体不同视角（view）的特征要对齐，逼模型学「整张图是什么」；<br/><b>iBOT（图像 BERT 式掩码预训练）</b>——随机遮掉一部分 patch（图像切成的小方格），让模型凭上下文重建「被遮的小块是什么」。两者都靠「Teacher 出题、Student 作答、stop-gradient（切断梯度）+ EMA」保持稳定。',
          componentId: 'm-2-1',
        },
        {
          kind: 'module',
          id: '2.2',
          title: 'DINO 与 iBOT 的流程图',
          desc: '上图是 DINO 与 iBOT 的流程图：<br/><b>DINO</b>——把同一物体的两种视角（view）分别送进 Teacher 与 Student，用 CLS 记号（整图浓缩向量）做整图级语义蒸馏，逼模型学「整张图是什么」；<br/><b>iBOT</b>——随机遮掉一部分 patch（图像小块），让 Student 凭上下文重建被遮的小块，学「每块局部是什么」。两条分支都靠「Teacher 出题、Student 作答、stop-gradient（切断梯度）+ EMA」保持稳定。',
          componentId: 'm-2-2',
        },
      ],
      formula: {
        lead: 'Teacher 参数更新（EMA 指数滑动平均，动量 λ 退火趋近 1）：',
        unicode: 'θ̄ ← λ·θ̄ + (1−λ)·θ',
        symbols: [
          { sym: 'θ', desc: 'Student 网络参数（被优化）' },
          { sym: 'θ̄', desc: 'Teacher 网络参数（EMA 平均，不更新）' },
          { sym: 'λ', desc: '动量系数（趋近 1，控制平滑程度）' },
        ],
      },
      insight:
        'Teacher 不是另一个网络，而是 Student 的指数滑动平均。它比 Student 平滑，因此能提供不塌缩的目标——这是整条方法的地基，也是后面每一章反复出现的核心机制。',
      takeaways: [
        { icon: '🎓', title: 'Teacher 出题', desc: 'Teacher 是 Student 的 EMA，负责生成稳定目标。' },
        { icon: '🧑‍🎓', title: 'Student 作答', desc: 'Student 接收梯度不断更新，对齐 Teacher 目标。' },
        { icon: '🔁', title: '共同进化', desc: 'Student 越强 → Teacher（其 EMA）越强 → 目标越准，形成正循环。' },
      ],
    },

    {
      kind: 'chapter',
      id: 'chap-3',
      title: '核心洞见：随机掩码对结构「视而不见」',
      badge: 'inf',
      badgeLabel: '基础',
      bridge:
        'DINO 用 Teacher-Student 学整图语义；iBOT 随机遮掉一些图像小块（patch），让模型凭上下文猜，学局部语义。问题就在「随机」这两个字：随机掩码对结构视而不见。',
      analogy: {
        title: '随机掩码 vs 边界强制掩码',
        text: '上图来自论文 Fig.2：同一个玩具场景，左列是「随机掩码」——遮住的格子和内容无关；右列是「边界强制掩码」——专门遮住穿过物体轮廓的格子。边界强制掩码把 Teacher 预测的边界 token 集合 B 并入随机掩码 M：<strong>M⁺ = M ∪ B</strong>，逼模型凭上下文重建被藏的结构。',
        figure: '/images/fig2_masking.png',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '签名交互 ①：随机掩码 vs 边界掩码',
          desc: '点两个按钮动手对比：<br/><b>Random Mask</b>——随机遮住的往往是平坦格（颜色均匀、没有结构的小格），平坦格的颜色靠邻居就能猜，模型不用理解也能蒙对，太简单；<br/><b>Boundary Mask</b>——专挑跨结构的格子遮，只有真正理解「边界两侧各是什么、结构如何延伸」才能补出来，才值得学。',
          componentId: 'm-3-1',
        },
      ],
      formula: {
        lead: '本文对掩码的唯一改动——在随机掩码 M 之上，强制并入边界 token 集合 B：',
        unicode: 'M⁺ = M ∪ B',
        symbols: [
          { sym: 'M', desc: '随机掩码集合——随机采样要遮住的 patch，与图像内容无关（按块 block-wise 采样，目标比例 r）' },
          { sym: 'B', desc: '边界 token 集合——Teacher 预测的线段穿过的 patch，信息最密、最值得学' },
          { sym: 'M⁺', desc: '边界强制掩码——随机掩码与边界 token 的并集，学生真正看到的输入' },
        ],
      },
      insight:
        '图像里每个 patch 的信息密度天差地别——平坦区域的 patch 靠邻居就能猜出来，太简单；而边界 patch 携带不可约的结构，邻居猜不出来，却恰恰是随机掩码最常漏掉的。模型从来没被逼着正视结构，自然就学不会。',
      takeaways: [
        { icon: '🎲', title: '随机掩码无差别', desc: 'M 与图像内容无关，每个 patch 等概率被藏。' },
        { icon: '💎', title: '信息不平均', desc: '边界 token 携带不可约结构，邻居猜不出来。' },
        { icon: '🎯', title: '掩码=直面结构', desc: '强制掩码边界，等于指定模型必须正视结构。' },
      ],
    },

    {
      kind: 'chapter',
      id: 'chap-4',
      title: '方法：系统组成 → Teacher 在线造干净标签',
      badge: 'trn',
      badgeLabel: '方法',
      bridge:
        '算法不是凭空来的，先把系统摆清楚：训练时主要有三个组件——真正学习的 Student、负责出题的 Teacher（EMA 副本）、以及找角点的 Frozen Corner Detector。一张图进来先做 multi-view 增强，边界只在 global view 上做；然后一步步看 Teacher 如何在线把噪声预测洗成干净标签：Predict（预测边界场）→ Decode/Vote（角点+投票）→ Validate（a-contrario）→ Re-render（纯几何重算）。',
      analogy: {
        title: '边界从角点「长」出来（Finding 1）',
        text: '上图是论文发现 1（Finding 1）：边界从角点「长」出来。这是自举的关键前提——给定稀疏角点（物体轮廓的转折点），即使边界场取值几乎随机，投票解码也能得到角点锚定的线段；方向通道由 level-line（像素梯度方向）引导后，每次解码都得到连贯一致的线段。',
        figure: '/images/fig3_corners.jpg',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '系统三件套：Student / Teacher / Corner Detector',
          desc: '系统里就三个模型，分工如下表——谁是真正学习的、谁负责出题、谁提供锚点：',
          componentId: 'm-4-1',
        },
        {
          kind: 'module',
          id: '4.2',
          title: '一张图的旅程：multi-view 增强',
          desc: '一张 RGB 图 x 先进 multi-view 增强（crop / color jitter / flip），产生 global view（全局视角）与 local view（局部视角）。<b>关键约定：所有找边界的复杂操作只在 global view 上做</b>——只有它分辨率够高、视野够大，才能可靠解码线段、匹配角点、做 a-contrario 验证；local view 只参与普通语义蒸馏。',
          componentId: 'm-4-2',
        },
        {
          kind: 'module',
          id: '4.3',
          title: '① Predict：预测边界场（表示 + 分类化）',
          desc: 'Teacher 的 Boundary Head（3 层 per-token MLP）把每个 16×16 patch 展开成更密的 field positions（output stride s=2），每个位置输出 4 个几何量 <b>(d, θ, φ₁, φ₂)</b>。<b>但网络不直接回归连续数</b>——而是把每个量离散成 K=32 格的分类分布，再还原回连续值，得到 a_pred(p)。下方两步讲清：边界场怎么表示、为什么不回归而分类化。<b>注意：这里得到的 a_pred(p) 还是带噪声的 raw field，不能直接当标签</b>——下一步要解码。',
          componentId: 'm-4-3',
          figure: '/images/fig4_field.png',
        },
        {
          kind: 'module',
          id: '4.4',
          title: '② Decode + Vote：把噪声场解码成线段',
          desc: '上一步得到的是带噪声的 a_pred(p)，不能直接当标签，所以要解码。每个 field position 按 (d, θ, φ₁, φ₂) 提一条弦（chord，带端点的线段提议），两个端点吸附到最近的角点（由冻结的角点检测器给出），再对角点对投票。单条提议很吵（noisy），但众多位置一致指向同一角点对时，就构成「这条线存在」的结构证据——C1–C2 与 C3–C4 得票最多，成为可信线段。这就是 <b>many pixels → one segment</b> 的抗噪原理。',
          componentId: 'm-4-4',
        },
        {
          kind: 'module',
          id: '4.5',
          title: '③ Validate + Re-render：a-contrario 验证 → 干净标签',
          desc: '投票多的只是 candidate，可能是纹理或幻觉。用 a-contrario（反证法）检验：假设图像无结构、方向完全随机（零假设），某候选线纯靠运气出现的期望次数叫 NFA（误报数）；对齐像素越多 NFA 越小，仅当 <b>NFA ≤ 1</b> 才保留。<b>验证通过后不直接用 Teacher 的原始预测</b>，而是用这条干净线段做纯几何 re-render，重算支持区内的 (d, θ, φ₁, φ₂)，编成 K-bin soft 目标去监督学生。',
          componentId: 'm-4-5',
        },
      ],
      insight:
        '为什么用线段而不是像素级边缘？边缘像素是孤立的滤波响应、无法做统计验证；线段是「多像素支持的单条假设」，可以做统计检验。在自蒸馏里，未验证的边缘会把幻觉结构喂回训练，验证过的线段才能让自举目标保持干净。',
      takeaways: [
        { icon: '🎭', title: '三件套', desc: 'Student 学、Teacher 出题、Corner 锚定。' },
        { icon: '🗺️', title: 'global 造边界', desc: '复杂边界操作只在 global view 上生成。' },
        { icon: '🛡️', title: '验证保真', desc: 'NFA 零假设检验剔除假线，re-render 产出干净目标。' },
      ],
    },

    {
      kind: 'chapter',
      id: 'chap-5',
      title: '方法收束：总流程梳理与总损失',
      badge: 'trn',
      badgeLabel: '方法',
      bridge:
        '前面把系统组成、Teacher 在线造干净标签一步步讲完了。这一章把整篇方法压成一条完整闭环，从头到尾顺一遍；再给出训练的总损失 L。看完这一章，整条算法的主干应该能一口气背出来。',
      analogy: {
        title: '完整算法闭环（一次迭代）',
        text: '整条方法是一条闭环：<strong>输入 → Predict → Decode/Vote → Validate → Re-render → Mask → Supervise → Update（EMA）→ 回到输入</strong>。没有人工标注，Teacher 在线造目标、学生学、EMA 回传，每一轮目标更准。',
        componentId: 'an5',
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '完整算法闭环：从一张图到一次参数更新',
          desc: '把前几章拆开的环节按数据流串成一条闭环，逐一过一遍「做什么 + 为什么」：',
          componentId: 'm-5-1',
        },
        {
          kind: 'module',
          id: '5.2',
          title: '训练总损失 L：四路目标加权重加',
          desc: '同一个 Student 同时收四路信号，一次反向传播；各支 Teacher 目标都在 stop-gradient 下，梯度只回传学生。',
          componentId: 'm-5-2',
        },
      ],
      insight:
        '这一轮跑完，Teacher 变好一点，下一轮的边界目标就更准——这就是在线自举（online bootstrapping）：没有人工标注，模型自己造标签、自己验证、自己教自己。语义目标在「两个区域交界处」天然模糊，几何目标恰好补上它缺失的结构；二者叠加，语义与几何协同涌现。',
      takeaways: [
        { icon: '🔁', title: '闭环自举', desc: '输入 → Predict → Decode → Vote → Validate → Re-render → Mask → Supervise → Update。' },
        { icon: '➕', title: '四路损失', desc: 'L_DINO + λi·L_iBOT + λb·L_bnd + λk·L_KoLeo。' },
        { icon: '🛑', title: '只更新 Student', desc: 'Teacher 与目标全部 stop-gradient，梯度只流经学生。' },
      ],
    },

    {
      kind: 'chapter',
      id: 'chap-6',
      title: '证据与落地：站不站得住，以及能换来什么',
      badge: 'both',
      badgeLabel: '应用',
      bridge:
        '方法讲完了，看它站不站得住。这一章按证据强弱层层递进：先小规模因果消融——逐步加料，定位哪个组件真正带来增益；再看特征可视化——语义与几何如何分布；最后大规模真实数字——1B 参数在 NYUv2 深度上击败 7B 的 DINOv3，以及它如何落地到 LingBot-Depth 2.0。',
      analogy: {
        title: 'NYUv2 深度 RMSE（越低越好）',
        text: '上图是各模型在 NYUv2（单目深度估计基准数据集）上的 RMSE（均方根误差，越低越好）：LingBot-Vision（1B）0.296、DINOv3（7B）0.309、V-JEPA 2.1（1B）0.350、DINOv2（1B）0.372。<b>1B 在深度上击败 7B。</b>',
        componentId: 'an7',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '因果消融：哪个组件带来增益',
          desc: '在 ImageNet-1K（图像分类基准）+ ViT-L（ViT 大号模型）上逐步加料（论文 Table 1），下表每行加一个组件，看指标怎么变：',
          componentId: 'm-6-1',
        },
        {
          kind: 'module',
          id: '6.2',
          title: '特征对比：语义与几何如何分布',
          desc: '上图是论文 Fig.6 的 PCA 投影（主成分分析，把高维特征压到 2 维方便看图）：LingBot 的 patch 特征既按语义分组、又携带边界几何结构；纯语义模型的特征里几何信息稀疏。下方对比各模型的失败模式与 NYU RMSE。',
          componentId: 'm-6-2',
          figure: '/images/fig6_pca.jpg',
        },
        {
          kind: 'module',
          id: '6.3',
          title: '落地：LingBot-Depth 2.0',
          desc: '<b>掩码深度建模（MDM，Masked Depth Modeling）</b>——RGB（彩色三通道图像）与原始深度双模态 patch 化，按传感器有效性掩码深度 token，解码器只凭上下文重建全分辨率深度。下图是论文 Fig.10 的深度补全结果：',
          componentId: 'm-6-3',
          figure: '/images/fig10_depth.jpg',
        },
        {
          kind: 'module',
          id: '6.4',
          title: '收尾：WHERE / WHAT / HOW',
          desc: '回到方法三问，收束全篇。一句话：LingBot-Vision 把「边界」从感知的副产品，变成了预训练的学习信号，让一个模型同时学会语义和空间结构。',
          componentId: 'm-6-4',
        },
      ],
      insight:
        '消融证明「几何目标是活性成分」：把边界塞进掩码只是第一步，真正的增益来自在边界处重建什么——掩码只决定「在哪学」，增益来自「在那里重建什么」。深度补全的不确定性恰好集中在物体边界与材质过渡处——正是 LingBot-Vision 边界锚定特征编码的结构，预训练的边界表示直接转化为下游收益。',
      takeaways: [
        { icon: '🔬', title: '活性成分', desc: '分类化边界目标贡献几乎全部稠密增益，且不牺牲分类。' },
        { icon: '🏆', title: '1B > 7B', desc: 'NYUv2 RMSE 0.296 vs DINOv3 7B 0.309。' },
        { icon: '⚖️', title: '不 trade-off', desc: '语义（IN-1K=ImageNet-1K 82.4%）与几何（NYU δ₁=深度精度 84.9%）同时提升。' },
      ],
    },
  ],
};
