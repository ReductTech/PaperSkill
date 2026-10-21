import type { TutorialData } from '../types';

// SCTransNet 交互式导读的全部文字内容。
// 依据：Yuan et al., “SCTransNet: Spatial-channel Cross Transformer Network for Infrared Small Target Detection”,
// arXiv:2401.15583v3（2024-04-30，IEEE TGRS 录用前版本，15 页）。文中“§”“式”“表”“图”均指该版本。
// 原文没有给出的内容（例如作者代码中的实现细节、本导读自建的示意计算）在页面上单独标注来源。

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'SCTransNet: Spatial-channel Cross Transformer Network for Infrared Small Target Detection',
    titleZh: 'SCTransNet：空间-通道交叉 Transformer 与红外小目标检测',
    venue: 'IEEE TGRS 2024 · arXiv:2401.15583v3',
    authors: 'Shuai Yuan, Hanlin Qin, Xiang Yan, Naveed Akhtar, Ajmal Mian',
    affiliation: '西安电子科技大学；墨尔本大学；西澳大利亚大学',
    domain: '单帧红外小目标检测（像素级分割）',
    coreProblem: '红外小目标暗、小、缺少纹理，又常与背景杂波相似；只依赖局部显著性时，存在把相似杂波误判为目标的风险。',
    coreInsight:
      '在 U 形网络的四条长程跳连上放置<b>空间-通道交叉 Transformer 块（SCTB）</b>：每一层的通道向四层拼接后的全部通道发出查询（<b>SSCA</b>），再用局部空间与全局空间互补的前馈网络（<b>CFN</b>）增强，使深层能同时刻画目标的局部显著性与背景的整体连续性。<span class="sx-authors">Shuai Yuan · Hanlin Qin · Xiang Yan · Naveed Akhtar · Ajmal Mian<br/>西安电子科技大学 · 墨尔本大学 · 西澳大利亚大学</span>',
    keywords: ['单帧红外小目标检测', '像素级分割', '通道交叉注意力', 'SSCA', 'CFN', '多尺度深监督'],
  },
  hero: {
    oldMethod: {
      desc: '<b>只看局部对比</b>：建筑热点、云边亮斑与目标同样“突出”。合成红外帧（本导读自建），阈值 0.70：绿圈命中，红圈虚警。',
      componentId: 'hero-old',
    },
    newMethod: {
      desc: '<b>SCTransNet</b>：四条跳连都经过 SCTB，每一层都读取四层拼接后的通道信息，再送回同尺度的解码层（据原文图 2 简化）。',
      componentId: 'hero-new',
    },
  },
  chapters: [
    // ───────────────────────────── 1 ─────────────────────────────
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '任务：在杂波中找出几个像素',
      badge: 'inf',
      badgeLabel: '任务与难点',
      bridge:
        '单帧红外小目标检测（IRSTD）用于交通监控、海上救援与目标预警（§I）。近年的学习方法把它当作<b>像素级分割</b>而不是框检测：输出一张与输入同尺寸的概率图，再二值化成目标掩码。先看看为什么这件事难。',
      analogy: {
        title: '夜海瞭望 · 扫视',
        text: '望远镜的视野扫过夜海：远处小艇的灯与浪尖的反光，在视野里<b>都只是一个亮点</b>。只凭“这里比周围亮”无法分辨哪一个是船。',
        componentId: 'analogy-1',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '局部对比检测器的两难',
          desc: '一张合成红外帧里有两个暗弱目标，以及建筑热点、云边亮斑等杂波。检测器只计算“中心比周围亮多少”，拖动阈值，观察检出、虚警与漏检的变化。',
          componentId: 'detector-lab',
        },
      ],
      insight:
        '在本合成场景与局部对比算子的示例中，仅调阈值难以只留下目标：局部对比回答的是“这里亮不亮”，而不是“亮的是什么”。论文把难点归纳为三点——目标<b>暗而小</b>、<b>缺少颜色与纹理</b>、<b>尺度与形状多变</b>（§I），论文尝试用全局上下文补充局部信息，帮助区分目标与杂波。',
      formula: {
        lead: '论文用五个指标评估（§IV-A）。像素级的 IoU 在整个测试集上累加交集与并集，nIoU 则先逐图计算再平均；Pd 与 Fa 分别以目标和像素为单位。',
        unicode:
          'IoU = Σ TP[i] ⁄ Σ ( T[i] + P[i] − TP[i] )<br/>nIoU = (1/N) Σ TP[i] ⁄ ( T[i] + P[i] − TP[i] )<br/>Pd = 命中目标数 ⁄ 目标总数　　Fa = 虚警像素数 ⁄ 图像像素总数',
        symbols: [
          { sym: 'TP[i]', desc: '第 i 张图中预测为目标且确属目标的像素数（交集）。' },
          { sym: 'T[i]', desc: '第 i 张图中真值目标的像素数。' },
          { sym: 'P[i]', desc: '第 i 张图中预测为目标的像素数。' },
          { sym: 'nIoU', desc: '归一化 IoU（式 19）：逐图计算 IoU 后取平均，每张图权重相同，目标很小的图像不会被大目标图像的像素数淹没。' },
          { sym: 'IoU', desc: '式 (18)。表 I 的列名写作 mIoU，正文写作 IoU，指同一指标。' },
          { sym: 'N', desc: '测试图像数。' },
          { sym: 'Pd', desc: '检测概率（式 21）：沿用 [15]，预测与真值目标的质心偏差小于 3 像素即算命中。' },
          { sym: 'Fa', desc: '虚警率（式 22）：错误预测的目标像素数除以图像全部像素数，表中以 ×10⁻⁶ 为单位，越低越好。' },
        ],
      },
      takeaways: [
        { icon: '01', title: '输出是像素', desc: '这篇论文做的是单帧、像素级的分割：概率图经阈值 0.5 二值化后再评估。' },
        { icon: '02', title: '难在“相似”', desc: '目标与杂波在局部可以一样亮；在本合成示例中，降低阈值提高检出率的同时，也可能增加虚警。' },
        { icon: '03', title: '五个指标各管一面', desc: 'IoU / nIoU 看形状分割得准不准，F 兼顾像素级漏检与误检（第 10 章），Pd 看目标找没找到，Fa 看多报了多少像素。' },
      ],
    },
    // ───────────────────────────── 2 ─────────────────────────────
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '四层编码特征如何对齐',
      badge: 'inf',
      badgeLabel: '结构基础',
      bridge:
        '要用全图上下文，就需要不同尺度的特征一起参与。SCTransNet 的骨干是带残差块的 U 形网络，编码器产生四层特征 E₁…E₄；它们分辨率不同，必须先映射到同一个网格才能相互交互。',
      analogy: {
        title: '夜海瞭望 · 变焦',
        text: '转动变焦环：倍率越高，小艇的细节越清楚，视野却越窄。浅层特征像高倍视野，深层特征像广角视野——<b>细节与范围</b>不可兼得。',
        componentId: 'analogy-2',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '四层特征与 patch 嵌入',
          desc: '选择一层编码特征与输入尺寸，查看卷积核大小、嵌入后的形状，以及每个嵌入位置对应原图多大的区域。',
          componentId: 'embedding-lab',
        },
      ],
      insight:
        '浅层分辨率高、通道少，深层分辨率低、通道多；patch 嵌入用逐层缩小的卷积核（16、8、4、2）把四层都压到 H/16 × W/16，使四层嵌入落在共同的采样网格上；相同网格坐标并不意味着实际感受野相同。',
      formula: {
        lead: '对第 i 层编码特征做核长与步幅相同的卷积（§III-A），得到形状统一的嵌入。',
        unicode: 'Iᵢ = Embedᵢ( Eᵢ ) ∈ ℝ<sup>Cᵢ × H/16 × W/16</sup>，　核长 = 步幅 = 16 ⁄ 2<sup>i−1</sup>',
        symbols: [
          { sym: 'Eᵢ', desc: '第 i 层编码特征，通道数 Cᵢ，空间尺寸 H/2ⁱ⁻¹ × W/2ⁱ⁻¹（原文写作 H/i，见模块说明）。' },
          { sym: 'Iᵢ', desc: '第 i 层的嵌入结果，四层空间尺寸相同。' },
          { sym: 'Cᵢ', desc: '通道数：C₁…C₄ = 32、64、128、256（基础宽度 32）。' },
          { sym: 'Embedᵢ', desc: '核长与步幅均为 P/2ⁱ⁻¹ 的卷积，P = 16（§IV-B）。' },
        ],
      },
      takeaways: [
        { icon: '01', title: '四层，四种通道数', desc: 'E₁…E₄ 的通道为 32/64/128/256，空间尺寸依次减半。' },
        { icon: '02', title: '对齐到同一网格', desc: '嵌入后四层都是 H/16 × W/16，有效采样步距为原图 16 像素；实际感受野还受前层卷积、池化影响。' },
        { icon: '03', title: '小目标只占一角', desc: '3×3 与名义 16×16 网格单元的面积比约为 3.5%；这只是理想化几何示意，不表示实际感受野或信息保留比例。' },
      ],
    },
    // ───────────────────────────── 3 ─────────────────────────────
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '跳连的鸿沟与全层交互',
      badge: 'both',
      badgeLabel: '核心洞见',
      bridge:
        '有了对齐的四层特征，下一个问题是：解码器应该从哪里取信息？U 形网络的长程跳连只把同一层的编码特征直接送给解码器。图 1 展示了作者观察到的特征差异，并作为跨层交互的设计动机；它不能单独证明虚警只有这一种原因。',
      analogy: {
        title: '夜海瞭望 · 看全景',
        text: '把取景框从一个反光点放大到整片海：反光沿着月光带<b>连成一片</b>，而小艇不在带上。孤立地看分不清，放在整体结构里就清楚了。',
        componentId: 'analogy-3',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '原文图 1：五种结构在深层看到了什么',
          desc: '左列是输入与真值。切换对照方法，比较它与 SCTransNet 的连接结构、输出结果，以及解码器 L1–L4 各层的特征图。',
          componentId: 'fig1-lab',
        },
        {
          kind: 'module',
          id: '3.2',
          title: '谁向谁提供信息',
          desc: '勾选哪些层发出查询（Q）、哪些层拼进键与值（J）。连接图、拼接通道数和每张注意力图的形状随之改变；也可以一键切回普通跳连。',
          componentId: 'connect-lab',
        },
      ],
      insight:
        '论文把问题归结为三点：跨层的语义交互没有建立好；简单跳连与密集嵌套弥合不了编码器与解码器之间的语义鸿沟；深层对目标与背景的长程上下文感知不准（§I）。SCTB 的做法是先把四层混合，再分发回每一层。',
      formula: {
        lead: '每条跳连送往解码器的特征，是原编码特征加上四层交互后的结果（式 1）。',
        unicode: 'Oᵢ = Eᵢ + FMᵢ( SCTB( I₁, I₂, I₃, I₄ ) )，　i = 1, 2, 3, 4',
        symbols: [
          { sym: 'Oᵢ', desc: '送往第 i 个解码层的特征，与 Eᵢ 同形状；原文图 2 把它标为 Dᵢ。' },
          { sym: 'Eᵢ', desc: '第 i 层编码特征；这一项是残差连接。' },
          { sym: 'FMᵢ', desc: '特征映射：双线性插值放大回 Eᵢ 的尺寸，再接卷积、BN 与 ReLU。' },
          { sym: 'SCTB', desc: '空间-通道交叉 Transformer 块，同时输入四层嵌入，共堆叠 4 个（第 4–6、8 章）。' },
          { sym: 'I₁', desc: 'I₁…I₄：四层 patch 嵌入（第 2 章）。每个 SCTB 都同时看到全部四层。' },
        ],
      },
      takeaways: [
        { icon: '01', title: '深层杂波响应', desc: '原文图 1 中，多数方法在高层特征里把注意力放在背景的局部杂波上。' },
        { icon: '02', title: '先混合，再分发', desc: 'SCTB 让每一层都从四层拼接的通道中取信息，再经 FM 与残差送回原尺度。' },
        { icon: '03', title: '全层更好', desc: '原文图 8：Q 与 J 都取完整的四层时，三个数据集上 IoU 都最高。' },
      ],
    },
    // ───────────────────────────── 4 ─────────────────────────────
    {
      kind: 'chapter',
      id: 'chap-4',
      title: 'SSCA：在通道维做交叉注意力',
      badge: 'both',
      badgeLabel: '核心机制',
      bridge:
        '“全层交互”具体怎么算？SCTB 的第一部分是空间嵌入的单头通道交叉注意力（SSCA）。它不在像素之间做注意力，而是把<b>每个通道当作一个 token</b>，让一层的通道去匹配四层拼接后的全部通道。',
      analogy: {
        title: '夜海瞭望 · 对照',
        text: '手边有同一片海的四张不同倍率速写，十字线依次对准每一张里的同一艘船：<b>一个视角向四个尺度提问</b>，取回彼此印证的信息。',
        componentId: 'analogy-4',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '一步一步算 SSCA',
          desc: '选择查询层级，点击上方步骤或“下一步”。图中张量按真实形状等比例绘制（256×256 输入），高亮当前步骤涉及的部分。',
          componentId: 'ssca-lab',
        },
        {
          kind: 'module',
          id: '4.2',
          title: '为什么在通道维算',
          desc: '拖动输入边长，按四个层级合计比较两种注意力的规模：在同一嵌入网格上做空间自注意力，与 SSCA 的通道交叉注意力。',
          componentId: 'scale-lab',
        },
      ],
      insight:
        'QKᵀ 沿全部空间位置求和，所以注意力图描述的是“通道与通道之间的相关”。原文认为，这样在计算注意力图时就隐式地捕获了全层特征像素之间的全局关系，从而强化背景的连续性（§I），且计算开销可以接受（§II-B）；从形状上看，注意力图的大小也与输入分辨率无关。',
      formula: {
        lead: '查询来自第 i 层，键与值来自四层拼接；注意力图的行是本层通道，列是全部 480 个通道（式 13–14）。',
        unicode: 'Aᵢ = Softmax( 𝓘( Qᵢ Kᵀ ⁄ λ ) )，　CAᵢ = Wₚᵢ · Aᵢ V，　λ = <span class="sx-sqrt">√<span>480</span></span>',
        symbols: [
          { sym: 'Aᵢ', desc: '第 i 层的注意力图，形状 Cᵢ × C<sub>Σ</sub>，逐行和为 1。' },
          { sym: 'Qᵢ', desc: '第 i 层的查询，由 LN 后的 Jᵢ 经 1×1 与 3×3 深度卷积得到，展平为 Cᵢ × hw。' },
          { sym: 'Kᵀ', desc: '键的转置。K 由四层拼接 J<sub>Σ</sub> 生成，形状 C<sub>Σ</sub> × hw。' },
          { sym: 'V', desc: '值，同样来自 J<sub>Σ</sub>，形状 C<sub>Σ</sub> × hw。' },
          { sym: 'λ', desc: '可选的温度因子，λ = √C<sub>Σ</sub>；C<sub>Σ</sub> = 32+64+128+256 = 480。' },
          { sym: '𝓘', desc: '实例归一化（instance normalization），作用在相关矩阵上。' },
          { sym: 'CAᵢ', desc: 'SSCA 的输出，形状 Cᵢ × h × w；之后与 Iᵢ 相加（式 10）。' },
          { sym: 'Wₚᵢ', desc: '1×1 逐点卷积投影。' },
        ],
      },
      takeaways: [
        { icon: '01', title: '通道是 token', desc: '注意力图是 Cᵢ × 480：本层每个通道在四层的 480 个通道上分配权重。' },
        { icon: '02', title: '大小与分辨率无关', desc: '四层合计始终是 480×480 个元素；空间自注意力则随 (hw)² 增长。' },
        { icon: '03', title: '不是处处更省', desc: '在 256×256 训练裁剪上，两者规模相当，QKᵀ 乘加甚至是空间注意力更少；优势在高分辨率时才显现。' },
      ],
    },
    // ───────────────────────────── 5 ─────────────────────────────
    {
      kind: 'chapter',
      id: 'chap-5',
      title: 'SSCA 的三处取舍',
      badge: 'both',
      badgeLabel: '设计取舍',
      bridge:
        'SSCA 并不是把通道交叉注意力原样搬来。论文认为原始做法中的注意力计算、位置编码与纯通道建模都不利于像素很少的目标（§II-C），于是做了三处改动：<b>加空间嵌入、用单头、不加位置编码</b>。',
      analogy: {
        title: '夜海瞭望 · 调焦',
        text: '拧动调焦环，小艇的灯从一团光晕收成一个清晰的亮点。<b>先把局部看清</b>，再去比较远近，这是“空间嵌入”的用意。',
        componentId: 'analogy-5',
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '四个变体与表 VI',
          desc: '选择一个变体，结构示意标出它改动了哪里；切换数据集，比较它与 SSCA 的三项指标。',
          componentId: 'variants-lab',
        },
        {
          kind: 'module',
          id: '5.2',
          title: '位置编码遇到尺寸变化',
          desc: '训练裁剪是 256×256，嵌入网格为 16×16。选择一个不同的测试尺寸，在右侧网格上拖动，看每个位置的编码由原网格中哪些编码混合而来。',
          componentId: 'pe-lab',
        },
      ],
      insight:
        '三处改动都有消融支持：去掉空间嵌入、加入位置编码、改为多头，在三个数据集上的 IoU、nIoU、F-measure 全部低于 SSCA（表 VI）。原因则是作者的解释，原文没有进一步的对照实验。',
      formula: {
        lead: 'Q、K、V 都先经 1×1 逐点卷积混合通道，再经 3×3 深度卷积在每个通道内看邻域（式 12）。后一步就是“空间嵌入”。',
        unicode: 'Qᵢ = DWConv₃ₓ₃( Conv₁ₓ₁( Jᵢ ) )，　K, V = DWConv₃ₓ₃( Conv₁ₓ₁( JΣ ) )',
        symbols: [
          { sym: 'DWConv₃ₓ₃', desc: '3×3 深度卷积（原文记作 W<sub>d</sub>）：每个通道独立地聚合 3×3 邻域。去掉它即 “SSCA w/o SE”。' },
          { sym: 'Conv₁ₓ₁', desc: '1×1 逐点卷积（原文记作 W<sub>p</sub>）：在每个位置上混合通道。' },
          { sym: 'Jᵢ', desc: '第 i 层嵌入经层归一化后的结果（式 9）。' },
          { sym: 'JΣ', desc: '四层嵌入沿通道拼接后再层归一化（式 8），480 个通道。' },
          { sym: 'Qᵢ', desc: '第 i 层查询。各层查询、键、值各有独立的卷积参数。' },
        ],
      },
      takeaways: [
        { icon: '01', title: '空间嵌入', desc: '在算通道相关之前先用 3×3 深度卷积看邻域，去掉后三个数据集都下降。' },
        { icon: '02', title: '单头', desc: '多头在三个数据集上都略差；作者认为多头让特征有限的小目标的映射空间更复杂。' },
        { icon: '03', title: '不加位置编码', desc: '测试尺寸可变，插值后的位置编码对小目标不准；加入后同样变差。' },
      ],
    },
    // ───────────────────────────── 6 ─────────────────────────────
    {
      kind: 'chapter',
      id: 'chap-6',
      title: 'CFN：两种互补的特征增强',
      badge: 'both',
      badgeLabel: '核心机制',
      bridge:
        'SSCA 完成跨层交互后，SCTB 的第二部分——互补前馈网络（CFN）——在每一层内部增强特征。原文指出，以往的前馈网络只做“局部空间 × 全局通道”（LSGC），而“全局空间 × 局部通道”（GSLC）同样重要（图 4）。',
      analogy: {
        title: '夜海瞭望 · 收放取景框',
        text: '取景框在小艇周围一收一放：<b>收紧看形状，放开看周边</b>。CFN 的两支深度卷积就是两种大小的取景框。',
        componentId: 'analogy-6',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: 'CFN 的数据流',
          desc: '点击图中任一运算。右侧网格与通道条显示它在空间上、在通道上各看多大的范围，对照 LSGC 与 GSLC 两种范式。',
          componentId: 'cfn-lab',
        },
        {
          kind: 'module',
          id: '6.2',
          title: '六种前馈网络与表 VII',
          desc: '把 SCTB 中的前馈网络换成不同结构。点阵图中每一行是一项指标，看所选结构相对 CFN 的位置。',
          componentId: 'ffn-lab',
        },
      ],
      insight:
        '多尺度深度卷积（3×3 与 5×5）强调目标与背景在邻域内的差异；全局平均池化加一维卷积则用极小的代价补上“整幅图里各通道的整体响应”。表 VII 中去掉后者（CFN w/o GSLC）后指标较低，两行参数量在表中显示精度下均为 11.1905 M；这不等于 GSLC 没有额外可训练参数。',
      formula: {
        lead: '先做多尺度局部空间增强得到 Xsc（式 15–16），再用全局平均池化与核长为 3 的一维卷积生成通道权重（式 17）。',
        unicode: 'Xsc = Conv₁ₓ₁[ δ(DW₃ₓ₃(X₃ₓ₃)), δ(DW₅ₓ₅(X₅ₓ₅)) ]<br/>Xₒ = Conv1D₃( GAP( Xsc ) ) ⊙ Xsc + Xᵢ',
        symbols: [
          { sym: 'Xsc', desc: '多尺度局部空间增强后的特征（LSGC 部分的输出）。' },
          { sym: 'X₃ₓ₃', desc: 'X₃ₓ₃、X₅ₓ₅：LN 与 1×1 升维后沿通道均分的两支（式 15）。' },
          { sym: 'DW₃ₓ₃', desc: 'DW₃ₓ₃、DW₅ₓ₅：两种核大小的深度卷积。' },
          { sym: 'δ', desc: '激活函数；依图 3 图例为 ReLU。' },
          { sym: 'GAP', desc: '空间全局平均池化，用来近似全局空间信息；原文说明这样做是因为测试分辨率可变、空间 MLP 计算量大。' },
          { sym: 'Conv1D₃', desc: '核长为 3 的一维卷积，沿通道方向捕获局部通道关系。式中没有 Sigmoid（作者代码有）。' },
          { sym: '⊙', desc: '广播的逐元素乘法：每个通道的权重乘到该通道的全部位置上。' },
          { sym: 'Xₒ', desc: 'CFN 的输出；+Xᵢ 是残差连接。' },
        ],
      },
      takeaways: [
        { icon: '01', title: 'LSGC', desc: '3×3、5×5 深度卷积看局部空间，1×1 卷积混合全部通道。' },
        { icon: '02', title: 'GSLC', desc: 'GAP 看全部位置，一维卷积只看相邻通道；参数几乎为零。' },
        { icon: '03', title: '证据', desc: '表 VII：CFN 在 NUAA 与 NUDT 的 IoU、nIoU 上都最高；去掉 GSLC 后下降。' },
      ],
    },
    // ───────────────────────────── 7 ─────────────────────────────
    {
      kind: 'chapter',
      id: 'chap-7',
      title: '训练：多尺度深监督',
      badge: 'trn',
      badgeLabel: '训练',
      bridge:
        '结构讲完，接下来是怎样训练。SCTransNet 不只监督最后的输出：四个解码层与一个瓶颈尺度各出一张显著图，再融合出一张，六张图都与真值计算二元交叉熵（式 2–7）。推理时则只用最浅一层的输出。',
      analogy: {
        title: '夜海瞭望 · 记日志',
        text: '在航海日志上逐行打勾：每个倍率下的观测都要和海图核对一次，最后再核对一次汇总。<b>每一层都有人检查</b>，就不会只靠最后一眼。',
        componentId: 'analogy-7',
      },
      modules: [
        {
          kind: 'module',
          id: '7.1',
          title: '六项损失从哪里来',
          desc: '在训练与推理之间切换；点击任一侧输出，查看它的来源、原始分辨率与上采样倍数。',
          componentId: 'supervision-lab',
        },
        {
          kind: 'module',
          id: '7.2',
          title: '训练配置与学习率',
          desc: '拖动训练轮次，查看余弦退火在该轮的学习率；右侧是原文给出的全部训练设置。',
          componentId: 'schedule-lab',
        },
      ],
      insight:
        '深监督让梯度直接到达各个解码尺度，原文的目的是提高梯度传播效率与特征表达；表 IV 中它带来 +0.66 个百分点的平均 IoU。六项损失的权重都取 1，原文说明这是经验设置。',
      formula: {
        lead: '侧输出 Mᵢ 上采样到原图大小后与真值 Y 计算 BCE；融合图 MΣ 也计一项，全部权重为 1（式 4–7）。',
        unicode: 'L = Σᵢ λᵢ lᵢ + λΣ lΣ，　lᵢ = BCE( 𝓑(Mᵢ), Y )，　i = 1 … 5',
        symbols: [
          { sym: 'Mᵢ', desc: '第 i 个侧输出：Mᵢ = Sigmoid(Conv₁ₓ₁(Fᵢ))，F₁…F₄ 来自解码层，F₅ 来自瓶颈（式 2）。' },
          { sym: '𝓑', desc: '双线性插值上采样；M₁ 已是原图大小，不需要上采样（式 4）。' },
          { sym: 'Y', desc: '真值掩码。' },
          { sym: 'BCE', desc: '二元交叉熵损失。' },
          { sym: 'λᵢ', desc: '各项权重，原文全部设为 1。' },
          { sym: 'lΣ', desc: '融合图 MΣ 的损失（式 6）。MΣ = Sigmoid(Conv₁ₓ₁[M₁, 𝓑(M₂), …, 𝓑(M₅)])（式 3）。' },
          { sym: 'lᵢ', desc: '第 i 个侧输出的损失（式 4、5）。' },
        ],
      },
      takeaways: [
        { icon: '01', title: '六项损失', desc: 'M₁…M₅ 与融合图 MΣ 各一项 BCE，权重都为 1。' },
        { icon: '02', title: '推理只用 M₁', desc: '测试时取 M₁，按固定阈值 0.5 二值化，不需要真值。' },
        { icon: '03', title: '从零训练', desc: 'Kaiming 初始化、无预训练；Adam，1000 轮，余弦退火，单张 RTX 3090 约 24 小时。' },
      ],
    },
    // ───────────────────────────── 8 ─────────────────────────────
    {
      kind: 'chapter',
      id: 'chap-8',
      title: '整体结构：信息如何流过网络',
      badge: 'trn',
      badgeLabel: '整体结构',
      bridge:
        '现在把前面的部件放回原文图 2：残差编码器 → patch 嵌入 → 4 个 SCTB → 特征映射与残差 → 带 CCA 的解码器 → 输出与深监督。跟着某一层的信息走一遍，就能看清每个部件的位置。',
      analogy: {
        title: '夜海瞭望 · 光路',
        text: '一束光从物镜进入，穿过镜筒，在目镜成像。理解望远镜，最直接的办法是<b>跟着光走一遍</b>。',
        componentId: 'analogy-8',
      },
      modules: [
        {
          kind: 'module',
          id: '8.1',
          title: '可点击的完整结构',
          desc: '点击任一组件查看作用、输出形状与出处；用“追踪层级”高亮某一层的完整路径，用“阶段”切换训练与推理。',
          componentId: 'arch-lab',
        },
      ],
      insight:
        '跨层交互只发生在统一的嵌入网格上：四路信息在 SCTB 中混合，再由 FM 放大回各自尺度、与原编码特征相加，经 CCA 与解码器融合。网络的参数量为 11.19 M，计算量 20.24 G（表 II）。',
      formula: {
        lead: '一个 SCTB 的完整计算（式 8–11）：先归一化，SSCA 交互并加残差，再经 CFN。',
        unicode: 'JΣ = LN([I₁, I₂, I₃, I₄])，Jᵢ = LN(Iᵢ)<br/>Pᵢ = SSCA( J₁, J₂, J₃, J₄, JΣ ) + Iᵢ，　Oᵢ = CFNᵢ( Pᵢ )',
        symbols: [
          { sym: 'JΣ', desc: '四层嵌入的通道拼接（480 通道）经层归一化，作为键与值的来源。' },
          { sym: 'Jᵢ', desc: '第 i 层嵌入经层归一化，作为查询的来源。' },
          { sym: 'Pᵢ', desc: 'SSCA 输出加残差。' },
          { sym: 'Oᵢ', desc: 'SCTB 的输出（图 2 也这样标注）。注意：原文式 (1) 又用 Oᵢ 表示 FM 与残差之后送往解码器的特征（图 2 中标为 Dᵢ），两处同名不同义。' },
          { sym: 'CFNᵢ', desc: '第 i 层的互补前馈网络，各层参数独立。' },
          { sym: 'LN', desc: '层归一化。' },
          { sym: 'SSCA', desc: '空间嵌入的单头通道交叉注意力（第 4、5 章）。' },
        ],
      },
      takeaways: [
        { icon: '01', title: '四路同进同出', desc: '每个 SCTB 同时处理四层，输出形状不变；共堆叠 N = 4 个。' },
        { icon: '02', title: '回到原尺度', desc: 'FM 用双线性插值把嵌入放大回 Eᵢ 的尺寸，再与 Eᵢ 相加。' },
        { icon: '03', title: '解码端融合', desc: '解码器用 CCA 融合深层与跳连特征，两个 CBL 解码；推理只输出 M₁。' },
      ],
    },
    // ───────────────────────────── 9 ─────────────────────────────
    {
      kind: 'chapter',
      id: 'chap-9',
      title: '消融：部件与超参数的贡献',
      badge: 'trn',
      badgeLabel: '实验分析',
      bridge:
        '每个部件到底贡献多少？论文从两个基线出发逐项加入模块（表 IV、V），又替换解码融合模块（表 VIII），并扫描残差块深度、SCTB 数量、扩展系数与网络宽度（表 IX、X）。',
      analogy: {
        title: '夜海瞭望 · 取下滤镜',
        text: '抽出一片滤镜，再看同一艘船：画面变模糊，说明这片滤镜有用。<b>一次只改一处</b>，才能把变化归到它头上。',
        componentId: 'analogy-9',
      },
      modules: [
        {
          kind: 'module',
          id: '9.1',
          title: '逐项加入模块',
          desc: '选择出发点，用“下一步”逐个加入部件，观察三项平均指标的变化；最大的一跳会被标出。',
          componentId: 'ablation-lab',
        },
        {
          kind: 'module',
          id: '9.2',
          title: '超参数：性能与代价',
          desc: '选择一组实验，点击柱条查看该设置的指标与两列代价；绿色为论文最终采用的设置。',
          componentId: 'hparam-lab',
        },
      ],
      insight:
        '在 U-Net 路线上，SSCA 带来最大的一跳（+4.66 个百分点 IoU）。超参数方面，N 超过 4 后基本持平（N = 6 仅高 0.02），η = 2.66 与 W = 32 处平均 IoU 最高。原文未报告重复运行次数、方差或显著性检验，相差零点几个百分点的结论应谨慎看待。',
      takeaways: [
        { icon: '01', title: '最大贡献', desc: '加入 SSCA 使平均 IoU 从 77.73 升到 82.39，远大于其他单步。' },
        { icon: '02', title: '替换也有效', desc: '在 UCTransNet 上用 SCTB 替换 CCT，平均 IoU 提高 1.40 个百分点。' },
        { icon: '03', title: '读表要核对', desc: '表 V 的 F 值、表 IX 的勾选、表 IX/X 的代价列名都与其他表不一致，引用时请注明。' },
      ],
    },
    // ───────────────────────────── 10 ─────────────────────────────
    {
      kind: 'chapter',
      id: 'chap-10',
      title: '结果、代价与证据边界',
      badge: 'both',
      badgeLabel: '实验与边界',
      bridge:
        '最后回到主实验：三个公开数据集 NUAA-SIRST（427 张）、NUDT-SIRST（1327 张）与 IRSTD-1K（1000 张），对比 7 个传统方法与 9 个学习方法（学习方法都在相同训练集上重新训练）。重点是逐指标地读，并看清哪些结论有证据、哪些没有。',
      analogy: {
        title: '夜海瞭望 · 三晚的记录',
        text: '三晚的观测记录并排放：灰条是此前最好方法的 IoU，绿条是 SCTransNet（表 I）。<b>领先都在 2 个百分点以内</b>，但三晚都领先。',
        componentId: 'analogy-10',
      },
      modules: [
        {
          kind: 'module',
          id: '10.1',
          title: '表 I 与表 III：逐指标比较',
          desc: '选择数据集与指标，点击“开始比较”；或切换到 Pd–Fa 平面，看哪些方法在检出率与虚警两方面都不被同时超过。',
          componentId: 'results-lab',
        },
        {
          kind: 'module',
          id: '10.2',
          title: '逐例看检测结果',
          desc: '选择原文图 6 或图 12 中的一个场景与一个对照方法，并排比较输入、对照方法、SCTransNet 与真值。',
          componentId: 'cases-lab',
        },
      ],
      insight:
        '证据支持的结论：三个数据集上 IoU、nIoU、F-measure 与两档作者报告的 AUC 都最高。证据不支持的推断：每个指标都最好（NUAA 的 Fa、NUDT 与 IRSTD-1K 的 Pd 不是）、推理速度（原文没有报告 FPS）、真实部署鲁棒性（只有两幅条纹噪声示例）、统计显著性（未报告重复运行次数及波动）。',
      formula: {
        lead: 'F-measure 把像素级的精确率与召回率合成一个数（式 20），作者用它说明 SCTransNet 在漏检与虚警之间取得了更好的平衡。',
        unicode: 'F = 2 × Prec × Rec ⁄ ( Prec + Rec )',
        symbols: [
          { sym: 'Prec', desc: '精确率：预测为目标的像素中确属目标的比例。' },
          { sym: 'Rec', desc: '召回率：真值目标像素中被预测出来的比例。' },
          { sym: 'F', desc: '两者的调和平均，单位 %，越高越好。' },
        ],
      },
      takeaways: [
        { icon: '01', title: '分割指标全面领先', desc: '表 I：三个数据集的 IoU、nIoU、F 均为第一；表 III：两档 AUC 均为第一。' },
        { icon: '02', title: '代价适中', desc: '表 II：11.19 M 参数、20.24 G 计算量，介于 DNA-Net 与 UIU-Net 之间；原文没有报告推理速度。' },
        { icon: '03', title: '边界要说清', desc: '单帧任务、未报告重复运行次数、定性的鲁棒性示例；表 II 的“平均”不等于表 I 的算术平均。' },
      ],
    },
  ],
  bilibili: [
    {
      bvid: 'BV1kr421M7wx',
      title: '作者仓库 README 中链接的 SCTransNet 视频',
      reason: '链接见作者 GitHub 仓库 README 的「Bilibili 视频分享」一节。制作时无法读取封面与播放量，未在此填写；导读内容以论文 v3 为准。',
    },
  ],
};
