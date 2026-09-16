import type { TutorialData } from '../types';

// 论文原图统一走 Vite 基址前缀。部署到 GitHub Pages 的子路径
// （/PaperSkill/papers/<paper>/<version>/）时绝对路径 /images/... 会指向域名根而失效。
const fig = (name: string) => `${import.meta.env.BASE_URL}images/${name}`;

// ============================================================================
//  DAME-Net Tutorial Data
//  Paper: Compositional-Degradation UAV Image Restoration: Conditional Decoupled MoE Network and A Benchmark
//  Theme: Photography Practice (摄影练习)
// ============================================================================

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'Compositional-Degradation UAV Image Restoration: Conditional Decoupled MoE Network and A Benchmark',
    titleZh: '组合退化无人机图像修复：条件解耦MoE网络与基准',
    venue: 'arXiv 2026',
    authors: 'Jinquan Yan, Zhicheng Zhao, Zhengzheng Tu, Chenglong Li, Jin Tang, Bin Luo',
    affiliation: '安徽大学',
    domain: '图像修复、无人机、混合专家',
    coreProblem: 'UAV图像在真实飞行环境中常受多种退化因素（雨、雾、噪声等）同时影响，现有统一修复方法使用隐式退化表示导致因子间干扰',
    coreInsight: 'DAME-Net通过显式退化感知（FDPM）和条件解耦MoE修复（CDMM），实现选择性因子级校正',
    keywords: ['图像修复', '组合退化', '混合专家', '无人机'],
  },
  hero: {
    oldMethod: {
      desc: '隐式统一修复：将多种退化压缩为单一整体条件，导致因子间干扰和修复质量下降',
      figure: fig('blind_restoration.png'),
      componentId: 'hero-condition-compare'
    },
    newMethod: {
      desc: 'DAME-Net显式解耦：显式感知每种退化因子，条件引导选择性修复，避免干扰',
      figure: fig('framework.png'),
      componentId: 'hero-condition-compare'
    },
  },
  chapters: [
    // Chapter 1: 问题与核心循环
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '问题：多重退化的挑战',
      badge: 'inf',
      badgeLabel: '基础',
      bridge: '在真实飞行环境中，UAV图像很少只受单一退化影响。雨、雾、噪声、模糊等多种因素常常同时出现，严重影响图像质量和下游任务性能。',
      analogy: {
        title: '检查受损照片',
        text: '就像摄影师检查一张模糊、曝光过度且有噪声的照片一样，我们需要识别图像中的所有问题。',
        componentId: 'degradation-inspector'
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '退化识别器',
          desc: '点击选择不同的退化类型，观察它们叠加后对图像的影响。画布会标出当前激活的退化因子与数量，帮助理解组合退化的复杂性。',
          figure: fig('wrong_detect.png'),
          componentId: 'degradation-inspector'
        }
      ],
      insight: '组合退化不是单一退化的简单叠加——它们的交互会联合扭曲结构、对比度和局部纹理，使修复变得更加困难。',
      takeaways: [
        { icon: '🎯', title: '多重退化', desc: 'UAV图像常受雨、雾、噪声等多种退化因素同时影响' },
        { icon: '🔧', title: '组合复杂性', desc: '不同退化类型需要不同的修复方法，组合情况更复杂' },
        { icon: '✨', title: '下游影响', desc: '退化严重损害目标检测等下游任务的性能' }
      ],
    },
    // Chapter 2: 输入表示
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '输入表示：多标签退化描述',
      badge: 'inf',
      badgeLabel: '基础',
      bridge: '为了处理组合退化，我们需要一种方式来表示图像中存在哪些退化因子。MDUR数据集定义了8种原子退化类型。',
      analogy: {
        title: '加载照片到编辑器',
        text: '就像将照片加载到编辑软件中准备处理一样，我们需要将图像信息转换为可处理的格式。',
        componentId: 'multi-label-encoder'
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '多标签退化编码',
          desc: '将8种原子退化类型编码为多热向量。点击开关选择不同退化组合，观察编码结果如何表示复杂的退化配置。',
          componentId: 'multi-label-encoder'
        }
      ],
      insight: '每个退化配置表示为原子因子的组合，而不是一个不透明的类别标签。这使得模型能够泛化到未见过的组合。',
      formula: {
        lead: '退化配置用多热向量表示',
        unicode: 'm ∈ {0,1}⁸，其中 mⱼ=1 表示退化 dⱼ 存在',
        symbols: [
          { sym: 'm', desc: '多热退化掩码向量' },
          { sym: 'D', desc: '原子退化类型数量（D=8）' },
          { sym: 'dⱼ', desc: '第j种原子退化类型' }
        ]
      },
      takeaways: [
        { icon: '🎯', title: '原子因子', desc: '8种原子退化：雨、雪、雾、低光、过曝、模糊、噪声、伪影' },
        { icon: '🔧', title: '多热编码', desc: '多热向量可以表示任意退化组合' },
        { icon: '✨', title: '泛化能力', desc: '原子因子表示使模型能泛化到未见的组合' }
      ],
    },
    // Chapter 3: 关键洞察
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '关键洞察：解耦感知与修复',
      badge: 'inf',
      badgeLabel: '基础',
      bridge: '现有统一修复方法的核心问题在于：它们将退化感知和图像修复耦合在一起，使用同一个隐式表示来完成两个任务。',
      analogy: {
        title: '诊断与治疗分离',
        text: '就像医生先诊断病因再进行治疗一样，我们先识别退化类型再进行修复。这种分离使两个任务都能更好地完成。',
        componentId: 'decoupling-demo'
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '解耦演示器',
          desc: '对比隐式表示（左）和显式解耦（右）的效果。隐式表示将多种退化压缩为模糊的单一条件，而显式解耦提供清晰的每因子描述。',
          componentId: 'decoupling-demo'
        }
      ],
      insight: 'DAME-Net的核心设计是将退化感知（FDPM）与图像修复（CDMM）显式解耦，用可解释的因子级描述替代纠缠的隐式条件。',
      formula: {
        lead: '解耦框架的数学表达',
        unicode: '(m̂, p) = P(x)，ŷ = R(x; m̂, p)',
        symbols: [
          { sym: 'P', desc: '退化感知模块（FDPM）' },
          { sym: 'R', desc: '修复模块（CDMM）' },
          { sym: 'm̂', desc: '预测的退化掩码' },
          { sym: 'p', desc: '语义嵌入' }
        ]
      },
      takeaways: [
        { icon: '🎯', title: '问题根源', desc: '隐式表示将多种退化压缩为单一条件，导致因子间干扰' },
        { icon: '🔧', title: '解耦设计', desc: '显式分离退化感知和图像修复两个阶段' },
        { icon: '✨', title: '可解释性', desc: '提供可解释的因子级退化描述' }
      ],
    },
    // Chapter 4: FDPM
    {
      kind: 'chapter',
      id: 'chap-4',
      title: 'FDPM：因子级退化感知',
      badge: 'both',
      badgeLabel: '基础+训练',
      bridge: 'Factor-wise Degradation Perception Module (FDPM) 是DAME-Net的退化感知组件，基于CLIP视觉-语言模型构建。',
      analogy: {
        title: '使用检测工具',
        text: '就像使用多种检测工具识别照片中的不同问题一样，FDPM同时检测所有退化类型。',
        componentId: 'fdpm-detector'
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '标签相似度软对齐',
          desc: '常规对比对齐把整个组合当成一个独立类别，只让它对齐一个 prompt；FDPM 改用标签向量之间的余弦相似度 S（式 4）当软目标，组合因此保留与成分因子的重叠。选一组因子，看各个任务提示拿到的权重。',
          figure: fig('sgdp_semantic.png'),
          componentId: 'fdpm-detector'
        }
      ],
      insight: 'FDPM在原子因子级别预测退化，使用CLIP共享嵌入空间捕获语义关系，标签相似性引导的软对齐保留组合结构。',
      formula: {
        lead: 'FDPM通过多标签预测头输出退化logits，并用标签相似度做软对齐',
        unicode:
          'z = h(fᵢ) ∈ ℝ⁹（Ĉ = D + 1 = 9），其中 fᵢ = Eᵥ(x)（d = 512）<br>' +
          'Sᵢⱼ = tᵢ·tⱼ / (‖tᵢ‖‖tⱼ‖)（式 4）',
        symbols: [
          { sym: 'z', desc: '退化logits向量' },
          { sym: 'h', desc: '多标签预测头：MLP + LayerNorm，隐藏宽度 2d' },
          { sym: 'fᵢ', desc: 'CLIP图像嵌入（d = 512）' },
          { sym: 'Eᵥ', desc: 'CLIP ViT-B/32 视觉编码器' },
          { sym: 'Ĉ', desc: 'logits 维度 = D+1 = 9：D 位退化 + 1 个 clean 位。复原阶段丢弃 clean 位，只用剩下的 8 位作退化掩码' },
          { sym: 'tₖ', desc: '任务 k 的多热标签向量，Ĉ = 9 维 0/1（K = 22 个对齐任务：1 clean + 21 已见配置）' },
          { sym: 'Sᵢⱼ', desc: '两个任务标签向量的余弦相似度（式 4），衡量它们的因子重叠程度。论文用它代替 one-hot 目标：雨+雾 离 雨 和 雾 都比离 噪声 近' }
        ]
      },
      takeaways: [
        { icon: '🎯', title: '原子级预测', desc: 'FDPM在原子因子级别预测退化，而非配置级别' },
        { icon: '🔧', title: 'CLIP基础', desc: '使用CLIP共享嵌入空间捕获退化语义关系' },
        { icon: '✨', title: '软对齐', desc: '标签相似性引导的软对齐保留组合退化结构' }
      ],
    },
    // Chapter 5: CDMM
    {
      kind: 'chapter',
      id: 'chap-5',
      title: 'CDMM：条件解耦MoE模块',
      badge: 'both',
      badgeLabel: '基础+训练',
      bridge: 'Conditioned Decoupled MoE Module (CDMM) 是DAME-Net的修复组件，使用FDPM提供的退化线索引导选择性修复。',
      analogy: {
        title: '四条通路各管一段',
        text: '就像修一张有多种毛病的照片要分头处理——校光照的、补细节的、去噪的各管一摊，CDMM 也把修复拆成四条通路：条件编码、双域校正、解耦专家、低频基座。',
        componentId: 'cdmm-router'
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '退化 token 编码器',
          desc: 'CDMM 四个协同组件里的第一个：把 FDPM 给的 (m̂, p) 变成每个阶段的条件向量。点选退化因子，看 10 个 token 里哪些参与注意力、哪些被硬 key 掩码排除。',
          componentId: 'cdmm-router'
        }
      ],
      insight: 'CDMM 由四个协同组件组成：退化 token 编码器（严格 token 掩码，m̂ⱼ = 0 的 token 被硬排除）、空间-频率混合骨干（5 阶段，通道 24/48/96/48/24，每阶段一个 CDCB）、DC-MoE 前馈（3 全局 + 5 空间专家）、低频基座分支。',
      formula: {
        lead: '退化 token 编码器：把 (m̂, p) 编码成每个阶段的查询结果',
        unicode:
          'U = [u_j; u_p; u_g]（D 个退化 token + 语义 token + 全局 token，e = 256）<br>' +
          'Z = Attn(Q, U, U)，{gₛ}ₛ₌₁⁵ = Z 的第 s 行（S = 5，4 头交叉注意力）',
        symbols: [
          { sym: 'U', desc: '键值集合，形状 (D+2)×e：D 个可学习退化 token + 语义 token u_p + 全局 token u_g' },
          { sym: 'u_j', desc: '第 j 个可学习退化 token（j = 1…D），与第 j 种原子退化对应' },
          { sym: 'u_p', desc: '语义 token u_p = LN(W_p·p)' },
          { sym: 'u_g', desc: '全局 token u_g = LN(MLP_g([m̂, p]))' },
          { sym: 'Q', desc: '阶段查询 token 集合 {q_s}（S = 5 个阶段）' },
          { sym: 'Z', desc: '交叉注意力输出，形状 S×e；第 s 行就是第 s 阶段的条件向量 g_s' },
          { sym: 'gₛ', desc: '第s阶段的条件向量' },
          { sym: 'm̂', desc: '预测的退化掩码；m̂ⱼ = 0 的退化 token 会被硬 key 掩码排除，不参与注意力' },
          { sym: 'p', desc: '语义嵌入' }
        ]
      },
      takeaways: [
        { icon: '🎯', title: '四个协同组件', desc: '条件编码 + 双域骨干 + 解耦 MoE + 低频基座' },
        { icon: '🔧', title: '严格 token 掩码', desc: 'm̂ⱼ = 0 的退化 token 被硬 key 掩码排除，不是软降权（表 III：去掉掉 0.56 dB）' },
        { icon: '✨', title: '逐阶段条件', desc: '5 个阶段各自一个条件向量 gₛ，而不是全场共用一个' }
      ],
    },
    // Chapter 6: CDCB
    {
      kind: 'chapter',
      id: 'chap-6',
      title: 'CDCB：空间-频率混合处理',
      badge: 'inf',
      badgeLabel: '基础',
      bridge: 'Condition-Aware Dual-domain Correction Block (CDCB) 在频率域和空间域联合处理特征，因为不同退化在不同域有不同特征。',
      analogy: {
        title: '两条分支各管一域',
        text: '修一张既有噪点又有雨丝的照片，去噪得看频谱、去雨丝得看局部结构，一只手忙不过来。CDCB 就分两条分支：频率分支管模糊、噪声这类频谱显著的退化，空间分支管雨条纹这类结构局部化的退化，最后用一个学习的门 w 把两边融合。',
        componentId: 'cdcb-processor'
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '门控混合器',
          desc: 'CDCB 的两条分支最后由门控权重 w 按 w 与 1 − w 混合。拖 w 看配比怎么变 —— 论文只说 w 是学出来的标量，从没报告过任何具体数值。',
          figure: fig('CDCB.png'),
          componentId: 'cdcb-processor'
        }
      ],
      insight: 'CDCB 在频率域与空间域并行处理：频率分支用 ω = softmax(W(g + W_f·GAP(X))) 混合 M = 2 个专家的低秩谱掩码（rank r = 4），再按式 11 对零频（DC）分量做内容自适应校正 —— M⁽ᵐ⁾_{:,0,0} ← 1 + b_dc + η·tanh(MLP_dc([g, μ, σ]))，幅度由 η = 0.1 界定，b_dc 是可学习偏置（论文没有给它的取值）；空间分支用 Swin 窗口注意力。两者由学习的门 X_out = w·X_freq + (1−w)·X_spatial 融合，论文只给了「blur / noise 偏频率、rain streaks 偏空间」的定性描述。',
      formula: {
        lead: 'CDCB 把两条分支按门控权重 w 融合；频率分支内部还有一个学习出来的专家混合权重',
        unicode:
          'ω = softmax(W(g + W_f · GAP(X)))　（M = 2 个频率专家）<br>' +
          'M⁽ᵐ⁾ = c⁽ᵐ⁾ + Σ_ℓ v_h ⊗ v_w　（低秩谱掩码，rank r = 4）<br>' +
          'M⁽ᵐ⁾_{:,0,0} ← 1 + b_dc + η · tanh(MLP_dc([g, μ, σ]))　（式 11：零频校正）<br>' +
          'X_out = w · X_freq + (1 − w) · X_spatial',
        symbols: [
          { sym: 'ω', desc: '频率专家的混合权重，由条件向量 g 与全局池化 GAP(X) 共同决定' },
          { sym: 'M⁽ᵐ⁾', desc: '第 m 个专家的谱调制图，用 rank r = 4 的低秩外积分解得到' },
          { sym: 'η', desc: '零频（DC）分量校正的幅度上界，η = 0.1；tanh 保证校正量不超过 ±η，管雾、低光、过曝这类全局光照偏移' },
          { sym: 'b_dc', desc: '零频校正里的可学习偏置；论文只写了它是学出来的，没有报告取值' },
          { sym: 'w', desc: '学习的门控权重 ∈ [0, 1]，论文未报告具体数值' },
          { sym: 'X_freq', desc: '频率分支输出（谱调制后逆 FFT 回来）' },
          { sym: 'X_spatial', desc: '空间分支输出（Swin 窗口注意力）' }
        ]
      },
      takeaways: [
        { icon: '🎯', title: '双域并行', desc: '频率分支做谱调制 + DC 校正，空间分支做 Swin 窗口注意力' },
        { icon: '🔧', title: '频率分支', desc: 'M = 2 个专家、rank r = 4 的低秩谱掩码，再按式 11（η = 0.1）校 DC 分量' },
        { icon: '✨', title: '学习的门', desc: 'X_out = w·X_freq + (1−w)·X_spatial；表 IV：去掉这道门掉 0.95 dB，是 CDMM 里最大的一项' }
      ],
    },
    // Chapter 7: 训练目标
    {
      kind: 'chapter',
      id: 'chap-7',
      title: '训练目标：多任务优化',
      badge: 'trn',
      badgeLabel: '训练',
      bridge: 'DAME-Net采用两阶段训练策略：先训练FDPM退化感知模块，再训练CDMM修复模块。',
      analogy: {
        title: '两条损失，先后各训一遍',
        text: '就像先把「看退化」这一关单独练熟、封起来，再练「修退化」这一关：感知模型先用式(7) 训到收敛就冻结，后面整个修复训练都不再动它；修复网络再用式(16) 训。两条损失不是合成一条一起调。',
        componentId: 'training-monitor'
      },
      modules: [
        {
          kind: 'module',
          id: '7.1',
          title: '损失分解器',
          desc: '式(16) 的 L_R 由三项组成，三项管的不是同一批像素。关掉任意一项，看缺的是哪一块监督。',
          componentId: 'training-monitor'
        }
      ],
      insight: '论文只写了两阶段：Stage I 用式(7) L_P = λ_align·L_align + λ_cls·L_cls（0.1 / 0.9）训练感知模型，收敛后冻结；Stage II 用式(16) L_R = ‖ŷ − y‖₁ + λ_f·L_freq + λ_p·L_base（0.1 / 0.1）训练修复网络。L_freq 是挖掉短边 0.2 的低频中心方块之后的掩码 FFT 幅度损失，L_base 监督基座分支逼近引导滤波平滑目标 y_base = GuidedFilter(y, y; r = 15, ε = 10⁻³)。',
      formula: {
        lead: '两个阶段各有一条损失（式 7 / 式 16），不是合成的一条',
        unicode:
          'L_P = λ_align·L_align + λ_cls·L_cls（Stage I）<br>' +
          'L_R = ‖ŷ − y‖₁ + λ_f·L_freq + λ_p·L_base（Stage II）',
        symbols: [
          { sym: 'L_P', desc: '感知阶段损失：Stage I 用它训练感知模型 P，收敛后冻结（式 7）' },
          { sym: 'L_R', desc: '修复阶段损失：Stage II 用它训练修复网络（式 16）' },
          { sym: 'L_align', desc: '标签相似性引导的跨模态软对齐损失（λ_align = 0.1）' },
          { sym: 'L_cls', desc: '多标签 BCE 分类损失（λ_cls = 0.9）' },
          { sym: 'L_freq', desc: '掩码 FFT 幅度 L1 损失，先挖掉短边 0.2 的低频中心方块，只监督中高频（λ_f = 0.1）' },
          { sym: 'L_base', desc: '基座分支损失，监督目标是引导滤波平滑后的 y_base = GuidedFilter(y, y; r = 15, ε = 10⁻³)（λ_p = 0.1）' }
        ]
      },
      takeaways: [
        { icon: '🎯', title: '两阶段训练', desc: '感知模型先用式(7) 训到收敛并冻结，修复网络再用式(16) 训' },
        { icon: '🔧', title: '三项损失', desc: '整图 L1 保整体、掩码频率 L1 管中高频、基座（引导滤波）项管粗光照；表 V：去掉频率损失掉 0.72 dB（quad 掉 2.49）' },
        { icon: '✨', title: '掩码过载增强', desc: '以 0.05 的概率给「只含雨或只含雪」的样本随机点亮一个全局位' }
      ],
    },
    // Chapter 8: 架构创新
    {
      kind: 'chapter',
      id: 'chap-8',
      title: '架构创新：解耦MoE设计',
      badge: 'trn',
      badgeLabel: '训练',
      bridge: 'DAME-Net的架构创新包括Decoupled MoE Feed-Forward (DC-MoE) 和Base-Residual Dual-Branch Reconstruction。',
      analogy: {
        title: 'Base-Residual 双分支重建',
        text: '一张退化图里，「整体偏暗、偏灰」这种低频光照问题和「雨条纹、噪声」这种高频细节问题，对解码器的要求并不一样。DAME-Net 干脆拆成两支：基座分支只看低频，残差分支只看高频，最后相加。',
        componentId: 'architecture-explorer'
      },
      modules: [
        {
          kind: 'module',
          id: '8.1',
          title: '架构浏览器',
          desc: '从输入到输出点一遍整条链路，看每一段的数据形状与来历。5 阶段 U 形骨干、通道 24/48/96/48/24、Eg = 3 / Es = 5 都按论文写。',
          componentId: 'architecture-explorer'
        },
        {
          kind: 'module',
          id: '8.2',
          title: 'DC-MoE 路由器',
          desc: '选退化因子当作预测出的掩码 m̂，看全局组与空间组各自怎么清零、怎么重归一化。一个都不选就是「没有专家被激活」的极端情况，那时输出只剩基座分支 B(X)。',
          figure: fig('DCMOE.png'),
          componentId: 'dcmoe-router'
        }
      ],
      insight: 'DC-MoE 把专家分成全局组（3 个：雾、低光、过曝，管场景级退化）和空间组（5 个：雨、雪、模糊、噪声、伪影，管局部退化）。掩码先把候选选出来，两个独立门控再在各自的激活子集上重归一化（式 13），所以未激活的专家权重恒为 0；空间专家的输出还要乘一张 H×W 的空间路由图 Rⱼ。',
      formula: {
        lead: '掩码约束路由与专家聚合（式 13 / 式 14）',
        unicode:
          'ω̂ᵍ = Renorm(ωᵍ ⊙ m̂ᵍ)，ω̂ˢ = Renorm(ωˢ ⊙ m̂ˢ)<br>' +
          'FFN_MoE(X) = B(X) + Σᵢ ω̂ᵢᵍ·Eᵢᵍ(X) + Σⱼ ω̂ⱼˢ·Rⱼ ⊙ Eⱼˢ(X)',
        symbols: [
          { sym: 'FFN_MoE', desc: '解耦 MoE 前馈块的输出（是这个前馈块，不是整个网络）' },
          { sym: 'B', desc: '基座分支 B(X)：即使没有任何专家被激活也提供非零容量' },
          { sym: 'm̂ᵍ / m̂ˢ', desc: '掩码位：全局组选 {雾, 低光, 过曝}，空间组选 {雨, 雪, 模糊, 噪声, 伪影}' },
          { sym: 'ωᵍ / ωˢ', desc: '两个独立门控算出的原始权重（论文未报告其取值）' },
          { sym: 'ω̂ᵢᵍ', desc: '第 i 个全局专家的路由权重：掩码 × 门控后重归一化' },
          { sym: 'ω̂ⱼˢ', desc: '第 j 个空间专家的路由权重：掩码 × 门控后重归一化' },
          { sym: 'Eᵢᵍ', desc: '第 i 个全局专家（共 3 个：雾、低光、过曝）' },
          { sym: 'Eⱼˢ', desc: '第 j 个空间专家（共 5 个：雨、雪、模糊、噪声、伪影）' },
          { sym: 'Rⱼ', desc: '空间路由图：取值 [0,1] 的 H×W 图，与专家输出逐元素相乘（⊙）' },
          { sym: 'X', desc: '输入特征图' }
        ]
      },
      takeaways: [
        { icon: '🎯', title: '全局专家', desc: '3 个专家处理场景级退化（雾、低光、过曝）；表 IV：去掉 DC-MoE 掉 0.70 dB、去掉解耦门控掉 0.58 dB' },
        { icon: '🔧', title: '空间路由', desc: '5 个空间专家各自再预测一张 [0,1] 的 H×W 路由图 Rⱼ；去掉空间路由掉 0.28 dB' },
        { icon: '✨', title: '双分支重建', desc: '基座分支出低频光照 ŷ_base，骨干出全分辨率残差 ŷ_res，ŷ = ŷ_base + ŷ_res' }
      ],
    },
    // Chapter 9: 实用技巧
    {
      kind: 'chapter',
      id: 'chap-9',
      title: '实用技巧：数据增强与优化',
      badge: 'trn',
      badgeLabel: '训练',
      bridge: '为了提高模型的鲁棒性，DAME-Net采用了掩码过载增强等训练技巧。',
      analogy: {
        title: '掩码过载增强',
        text: '训练时故意把退化掩码改错一点：只含雨（或只含雪）的样本，以 0.05 的概率随机点亮一个全局退化位 —— 也就是雾、低光、过曝里的某一位。这样路由就不能只依赖一张完美的掩码，必须学会判断图像内容到底支不支持这次激活。',
        componentId: 'augmentation-demo'
      },
      modules: [
        {
          kind: 'module',
          id: '9.1',
          title: '掩码采样器',
          desc: '按论文的规则真采一批样本：符合条件的样本以 p 的概率随机点亮一个全局位。论文只用了 p = 0.05 这一个值，这里可以调，是为了看清概率怎么影响命中数。',
          componentId: 'augmentation-demo'
        }
      ],
      insight: '掩码过载增强的触发条件写得很窄：样本必须「只含雨或只含雪」，且没有雾、没有低光；符合条件时以 0.05 的概率随机点亮一个全局退化位。论文的因果是「迫使路由在图像内容不支持该激活时抑制无关的全局专家」。表 V：去掉它掉 0.46 dB（quad 掉 0.44）。<br>「全局位」具体是哪几位，出自式(13) 下面对 m̂_g 的定义：全局位 = {雾, 低光, 过曝}，空间位 = {雨, 雪, 模糊, 噪声, 伪影}，与 E_g = 3 / E_s = 5 两组专家一一对应。',
      takeaways: [
        { icon: '🎯', title: '前提很窄', desc: '只有「只含雨或只含雪、且无雾无低光」的样本才进入抽取，含雾含低光的整批跳过' },
        { icon: '🔧', title: '随机一个全局位', desc: '被抽中的样本随机点亮雾 / 低光 / 过曝中的一位，不是一个固定位 —— 全局位的定义见式(13) 对 m̂_g 的说明' },
        { icon: '✨', title: '为什么有用', desc: '迫使路由抑制图像内容并不支持的全局专家；表 V：去掉掉 0.46 dB（quad 掉 0.44）' }
      ],
    },
    // Chapter 10: 结果与对比
    {
      kind: 'chapter',
      id: 'chap-10',
      title: '结果与对比：MDUR基准测试',
      badge: 'both',
      badgeLabel: '基础+训练',
      bridge: 'MDUR是首个大规模UAV组合图像修复基准，包含43种退化配置，从单一退化到四因子组合。',
      analogy: {
        title: '基准先行，留出集留得狠',
        text: '8 种原子退化因子，一张图最多叠 4 个，得到 43 种有效配置；其中 21 种进训练（已见），另外 22 种整个留出来做 zero-shot（未见）。留出集还特意压在 low-light+blur 与 low-light+artifact 这两类组合以及它们的高阶扩展上——训练时没见过，才知道前面那套显式因子条件到底有没有用。',
        componentId: 'result-comparison'
      },
      modules: [
        {
          kind: 'module',
          id: '10.1',
          title: '结果竞赛器',
          desc: '对比 DAME-Net 与五个基线（AirNet, DehazeFormer, Restormer, PromptIR, AdaIR）在两组口径下的平均性能：已见 21 个任务、未见 22 个任务（zero-shot）。五个基线都在同一份 MDUR 训练划分、同样的训练协议下重新训练过。论文正文只报告按复杂度（单/双/三/四因子）与按口径（已见/未见）分组的总平均，逐任务的完整表格在补充材料里 —— 这里取的正是论文正文那两行总平均（表 I 的 Overall Seen / Overall Unseen）。',
          figure: fig('qualitative_analysis.jpg'),
          componentId: 'result-comparison'
        }
      ],
      insight: '表 I 一共八个分组行（已见：单/双/三因子与总体；未见：双/三/四因子与总体），DAME-Net 在每一行上都是最高。已见侧随复杂度上升，自身从 29.52 dB / 0.9091（单因子）降到 26.88 dB / 0.8389（双因子）、25.73 dB / 0.8105（三因子），总体已见 27.67 dB / 0.8602；未见侧总体 18.62 dB / 0.6271。领先幅度在未见侧明显更大：总体未见高出最强基线 PromptIR 2.16 dB，而总体已见只高出 0.24 dB。' +
        '<br><br>论文的三项贡献：① <b>DAME-Net</b> —— 一个退化感知的混合专家网络，FDPM 给出逐因子的退化线索，CDMM 用掩码约束的解耦专家路由做按条件的复原；② <b>MDUR</b> —— 首个大规模 UAV 组合式图像复原基准（Multi-Degradation UAV Restoration），43 种退化配置从单因子到四因子，配标准化的已见/未见划分，用来评测组合泛化；③ 在 MDUR 上做系统性实验，证明对代表性统一复原基线有一致提升、在未见与高阶组合上提升更大，并用下游目标检测实验验证了对 UAV 感知的收益。' +
        '<br><br>论文也没有回避局限：从已见到未见、从低阶到高阶，绝对修复质量仍有明显下降，高度耦合的退化依然困难；把框架扩展到更真实的组合退化、并提升退化感知的鲁棒性，是作者点名的后续方向。另外，43 种配置的具体构造与合成规则、逐任务的完整表格、检测器评测与复杂度分析，都放在补充材料里，正文没有展开。',
      formula: {
        lead: '评估指标',
        unicode: 'PSNR = 10·log₁₀(MAX²/MSE)，SSIM 均在该图的亮度通道（YCbCr 的 Y 通道）上计算',
        symbols: [
          { sym: 'PSNR', desc: '峰值信噪比（dB），越高越好' },
          { sym: 'SSIM', desc: '结构相似性，越高越好' },
          { sym: 'MAX', desc: '像素最大值（255）' },
          { sym: 'Y 通道', desc: '论文明确只在亮度通道上报告，不做 RGB 平均' }
        ]
      },
      takeaways: [
        { icon: '🎯', title: '一致优势', desc: '论文表 I 的八个分组行（已见 单/双/三因子与总体、未见 双/三/四因子与总体）上 DAME-Net 都是最高' },
        { icon: '🔧', title: '组合泛化', desc: '未见配置上的领先幅度更大：总体未见 18.62 dB，高出最强基线 2.16 dB；已见只高出 0.24 dB' },
        { icon: '✨', title: '下游受益', desc: '论文表 II：冻结的 YOLOv8n 在 43 个退化设置上，mAP50 从退化输入的 0.0971 升到 0.2518，比最强基线 PromptIR（0.2469）高；干净图（GT）上限 0.5419' }
      ],
    },
  ],
  // 四条 BVID 均在 2026-09-13 用 bilibili 的 view 接口逐条核对过：标题取接口返回值原文，
  // pic 转 https 后固化在 cover 里，stat.view 按框架 formatViews 的写法固化成 views
  // （>=10000 用「万播放」），这样封面和播放量不依赖运行时那次 JSONP 取数。
  // 播放量：4.8 万 / 38.2 万 / 5157 / 2714。后两条低于 1 万，理由是它们是检索到的视频里
  // 唯一直接讲「低见度（去雾+去雨+低照度）论文脉络」和「深度学习去雾论文梳理」的，
  // 与本论文的退化集合最贴近；没有检索到讲无人机多退化复原或 MDUR 基准的视频。
  bilibili: [
    {
      bvid: 'BV1bK411p7En',
      title: '【图图Seminar03】石争浩：从先验到深度：低见度图像智能增强',
      reason: '从暗通道先验讲到深度去雾、去雨、低照度，与本论文的退化集合最贴',
      cover: 'https://i0.hdslb.com/bfs/archive/c7cb63b22f419360ab62695cb568fa55a9af8367.jpg',
      views: '2714播放'
    },
    {
      bvid: 'BV1Yk4veLEwv',
      title: '深度学习 | 图像去雾任务 | 近8年SCI论文解析',
      reason: '深度学习去雾的方法脉络，可对照本论文的退化建模与统一复原思路',
      cover: 'https://i2.hdslb.com/bfs/archive/732f1112a3cb40944b9828a27bb308c226cb4913.jpg',
      views: '5157播放'
    },
    {
      bvid: 'BV1Gj9ZYdE4N',
      title: 'MOE终于迎来可视化解读！傻瓜都能看懂MoE核心原理！',
      reason: '稀疏激活与路由器分工的可视化讲解，对应本论文的 DC-MoE',
      cover: 'https://i0.hdslb.com/bfs/archive/86fdc2c23b79824b2fa1b62b237f8e48a78fd3df.jpg',
      views: '4.8万播放'
    },
    {
      bvid: 'BV1SL4y1s7LQ',
      title: 'CLIP 论文逐段精读【论文精读】',
      reason: 'CLIP 逐段精读，对应本论文用语义编码器产出的退化 token 与语义嵌入',
      cover: 'https://i1.hdslb.com/bfs/archive/b741a268f24deacb2eba536bf5f990817e82a01f.jpg',
      views: '38.2万播放'
    }
  ],
};
