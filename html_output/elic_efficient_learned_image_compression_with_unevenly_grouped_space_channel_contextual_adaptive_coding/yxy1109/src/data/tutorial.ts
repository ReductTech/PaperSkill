import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn:
      'ELIC: Efficient Learned Image Compression with Unevenly Grouped Space-Channel Contextual Adaptive Coding',
    titleZh: 'ELIC：非均匀分组时空上下文自适应编码的高效可学习图像压缩',
    venue: 'CVPR 2022',
    authors: 'Dailan He, Ziming Yang, Weikun Peng, Rui Ma, Hongwei Qin, Yan Wang',
    affiliation: 'SenseTime Research / 清华大学',
    domain: '图像压缩 / 可学习编码',
    coreProblem:
      '可学习图像压缩的率失真性能已经超过传统编码器，但串行空间上下文和沉重的变换网络拖慢了解码，难以真正落地。',
    coreInsight:
      '利用潜变量的<b>信息压缩</b>现象做非均匀通道分组，并把空间上下文与通道条件联合成<b>SCCTX</b>熵模型，再配合轻量残差主变换，在更快的速度下拿到更好的率失真。',
    keywords: ['可学习图像压缩', '熵模型', '上下文编码', '率失真', '快速解码'],
  },
  hero: {
    oldMethod: {
      desc: '传统可学习压缩：10 组均匀通道条件 + 串行空间上下文，质量高，但参数估计延迟大、解码慢。',
      componentId: 'elic-hero-old',
    },
    newMethod: {
      desc: 'ELIC：5 组非均匀分组 + 并行空间上下文联合成 SCCTX，残差主变换，速度更快且率失真更优。',
      componentId: 'elic-hero-new',
    },
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '为什么可学习压缩又慢又难落地',
      badge: 'inf',
      badgeLabel: '入门',
      bridge:
        '一切从现实需求出发：我们希望压缩后的图片<b>体积小</b>、<b>看得清</b>，而且<b>解码要快</b>。本章先把这三个目标放上同一张天平。',
      analogy: {
        title: '一张照片要装进相册槽',
        text:
          '照片太大，塞不进相册里固定的槽位。你既要把它<b>缩得够小</b>，又要保证缩完后<b>还认得出内容</b>，还希望动作越快越好。',
        componentId: 'elic-ana',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '质量、码率与解码速度的天平',
          desc:
            '拖动滑块选择目标质量：质量越高，需要的比特越多，重建越清晰。码率用每像素比特数（bpp）衡量，重建质量用 PSNR（峰值信噪比，越高越清晰）衡量。右侧两条解码延迟柱比较了传统串行上下文与 ELIC 并行方法在同样条件下的速度。',
          componentId: 'elic-module',
        },
      ],
      insight:
        '压缩不能只盯质量：比特数上升、解码变慢，都会让它难以在实际系统中大规模使用。ELIC 的目标是在三者之间找到更好的平衡点。',
      formula: {
        lead: '可学习图像压缩把码率与重建失真放进同一个目标里，用 λ 控制二者的平衡。',
        unicode: 'L = R(ŷ) + λ · D(x, x̂)',
        symbols: [
          { sym: 'L', desc: '总率失真损失，训练时最小化它' },
          { sym: 'R', desc: '估计码率，由熵模型给出的概率算出' },
          { sym: 'ŷ', desc: '量化后的编码符号，也就是潜变量' },
          { sym: 'λ', desc: '率失真权重，越大越偏向高质量、高码率' },
          { sym: 'D', desc: '重建失真，本文以均方误差为主' },
          { sym: 'x', desc: '原始图像' },
          { sym: 'x̂', desc: '重建图像' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '三个目标', desc: '体积小、看得清、解码快，缺一不可。' },
        { icon: '🔧', title: '一个损失', desc: '码率与失真用 λ 加权，构成率失真损失。' },
        { icon: '✨', title: '一个主张', desc: 'ELIC 用更好的熵模型换取更轻、更快的主变换。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '图像先变成潜变量',
      badge: 'inf',
      badgeLabel: '入门',
      bridge:
        '上一章的问题指向一个核心：如何把图像表示得更紧凑。本章看分析变换怎样把像素变成一组<b>潜变量</b>，以及这些潜变量隐藏着怎样的规律。',
      analogy: {
        title: '镜头把场景框成一张底片',
        text:
          '取景时，镜头把整片风景<b>框选</b>成一幅底片。像素不再是散落的点，而是一组有序、可压缩的表示，等待进一步处理。',
        componentId: 'elic-ana',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '潜变量里的能量藏在哪里',
          desc:
            '点击照片上的不同区域，观察该区域对应潜变量通道的能量分布：能量并非均匀铺开，而是集中在少数靠前的通道上。这正是本文后来利用的关键规律。',
          componentId: 'elic-module',
        },
      ],
      insight:
        '分析变换输出的潜变量存在“信息压缩”倾向：少数通道集中了大部分能量。这意味着我们可以按通道的重要性差异来设计更聪明的熵模型。',
      takeaways: [
        { icon: '🎯', title: '分析变换', desc: '把图像 x 映射成潜变量 y。' },
        { icon: '🔧', title: '量化', desc: '把连续潜变量取整成编码符号 ŷ。' },
        { icon: '✨', title: '能量集中', desc: '靠前通道能量强，靠后通道逐渐稀疏。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '关键洞察：信息压缩与不均匀分组',
      badge: 'inf',
      badgeLabel: '入门',
      bridge:
        '上一章看到能量集中在靠前的通道。这一洞察直接带来本文的第一个贡献：给重要通道更细的分组、给次要通道更粗的分组，从而用更少的并行步骤完成通道条件编码。',
      analogy: {
        title: '对焦把重要主体变清晰',
        text:
          '镜头<b>对焦</b>到主体上，主体清晰、背景变虚。信息像能量一样向重要区域集中，这正对应潜变量里能量向前部通道聚集的现象。',
        componentId: 'elic-ana',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '逐步查看通道能量递减',
          desc:
            '逐步前进，观察按能量排序后的通道组：第一组能量最高，越靠后的组能量越低。前面几组几乎已经决定了图像的主要语义。',
          componentId: 'elic-module',
          figure: '/images/energy.png',
        },
        {
          kind: 'module',
          id: '3.2',
          title: '均匀分组与不均匀分组',
          desc:
            '切换两种分组方案，比较并行步骤数、参数估计延迟和 BD-Rate。BD-Rate 是相对基准编码器的平均码率节省，负值表示更省比特；参数延迟越低越好。不均匀分组用少量率失真代价换来了近一半的参数延迟。',
          componentId: 'elic-module',
          figure: '/images/uneven-grouping.png',
        },
      ],
      insight:
        '信息既然集中在前部通道，前部就该分得更细、后部分得更粗。于是 10 次串行计算可以减到 5 次，解码明显更快。',
      formula: {
        lead: '不均匀分组的通道数序列从细到粗，总组数保持为 5。',
        unicode: 'C = [16, 16, 32, 64, M − 128]',
        symbols: [
          { sym: 'C', desc: '各组通道数序列' },
          { sym: 'M', desc: '潜变量总通道数，ELIC 默认取 320' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '信息压缩', desc: '前部通道能量大、熵大，是主要信息所在。' },
        { icon: '🔧', title: '不均匀分组', desc: '16/16/32/64/M−128，前细后粗。' },
        { icon: '✨', title: '更快', desc: '并行步骤从 10 次降到 5 次。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '数学框架：率失真与高斯熵模型',
      badge: 'both',
      badgeLabel: '通用',
      bridge:
        '有了不均匀分组这个直觉，我们需要一套可训练的数学框架把它落到损失函数和概率模型上。本章进入公式，但每一个符号都对应前面已经见过的概念。',
      analogy: {
        title: '曝光旋钮平衡亮度与噪点',
        text:
          '转动<b>曝光</b>旋钮：亮度上去，噪点也上去。摄影师在亮度与噪点之间权衡，正如 λ 在码率与失真之间做取舍。',
        componentId: 'elic-ana',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '转动 λ 观察率失真曲线',
          desc:
            '拖动 λ 旋钮：左端低 λ 得到低码率但细节丢失，右端高 λ 得到高码率与更清晰的重建。右侧曲线横轴是码率，纵轴是重建质量（PSNR，越高越清晰），照片清晰度与曲线上的点同步变化。',
          componentId: 'elic-module',
        },
      ],
      insight:
        'λ 不是神秘的超参数，而是把“清晰度”翻译成“愿意多付多少比特”的换算系数。',
      formula: {
        lead: '有了超先验之后，编码符号的概率用一个均值 μ、方差 σ² 的受噪高斯来近似。',
        unicode: 'p(ŷ | ẑ) = [ N(μ, σ²) ∗ U(−0.5, 0.5) ](ŷ)',
        symbols: [
          { sym: 'p', desc: '条件概率质量函数，决定码率' },
          { sym: 'ŷ', desc: '量化编码符号' },
          { sym: 'ẑ', desc: '超先验，作为额外的边信息' },
          { sym: 'μ', desc: '预测均值' },
          { sym: 'σ²', desc: '预测方差' },
          { sym: 'U', desc: '均匀噪声卷积，用来模拟量化误差' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '率失真损失', desc: 'L = R + λD，λ 控制质量档位。' },
        { icon: '🔧', title: '单高斯熵模型', desc: '用均值与方差描述编码符号概率。' },
        { icon: '✨', title: '概率即码率', desc: '概率估得越准，码率越低。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '上下文条件：让预测更准',
      badge: 'both',
      badgeLabel: '通用',
      bridge:
        '只靠超先验，概率模型还很粗糙。本章加入上下文：空间上参考已解码的邻居，通道上参考已解码的通道组，让熵参数估计更准，从而进一步省比特。',
      analogy: {
        title: '参照底片预测下一块',
        text:
          '像冲洗时拿一张<b>参考底片</b>做对照，把当前块与已经显影的邻居对齐，下一步该显影什么就更有把握。',
        componentId: 'elic-ana',
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '切换上下文，看概率分布收窄',
          desc:
            '切换不同上下文组合：分布越窄，说明预测越确定，编码同一符号所需的比特越少。SCCTX 把空间上下文与通道条件联合起来，分布收得最紧。',
          componentId: 'elic-module',
        },
      ],
      insight:
        '上下文就是编码当前符号时参考的已解码信息。空间冗余与通道冗余近似正交，分别用并行空间上下文和通道条件消除，再把结果与超先验拼接，就是 SCCTX。',
      formula: {
        lead: '通道条件模型用前面已经解码的通道组来预测当前组的熵参数。',
        unicode: 'Φch = gch(ŷ&lt;k), &nbsp;k = 2, …, K',
        symbols: [
          { sym: 'Φch', desc: '通道上下文表示' },
          { sym: 'gch', desc: '通道上下文网络' },
          { sym: 'ŷ', desc: '已解码的通道组符号' },
          { sym: 'k', desc: '当前通道组序号' },
          { sym: 'K', desc: '总组数，ELIC 中为 5' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '空间上下文', desc: '参考已解码的空间邻居。' },
        { icon: '🔧', title: '通道条件', desc: '参考已解码的前部通道组。' },
        { icon: '✨', title: 'SCCTX', desc: '两者联合并拼接超先验，预测更准。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '解码顺序：从结构到细节',
      badge: 'inf',
      badgeLabel: '入门',
      bridge:
        '前面解决了“怎么预测概率”，本章看“怎么解码”。ELIC 支持渐进解码：先恢复轮廓结构，再补上色彩与高频细节，解码过程天然就是一次从粗到细的显影。',
      analogy: {
        title: '底片逐渐显影',
        text:
          '底片浸入显影液后，<b>显影</b>从轮廓开始，一点点浮现出细节。先有结构，再有色彩和高频纹理。',
        componentId: 'elic-ana',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '逐步解码前 k 个通道组',
          desc:
            '逐步增加已解码的通道组数：前 16 个通道已经能给出大致结构，后续通道组再补充色彩与高频细节。未解码的通道被直接填 0，省去额外预测。',
          componentId: 'elic-module',
        },
      ],
      insight:
        '渐进解码不要求等全部通道解码完：把未解码通道填 0，前几个通道组就能先给出可用的预览。',
      takeaways: [
        { icon: '🎯', title: '渐进解码', desc: '按通道组从前往后逐组恢复。' },
        { icon: '🔧', title: '零填充', desc: '未解码通道填 0，避免额外预测开销。' },
        { icon: '✨', title: '先结构后细节', desc: '前部通道给结构，后部通道给色彩高频。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-7',
      title: '训练：两阶段让一次性编码可行',
      badge: 'trn',
      badgeLabel: '训练',
      bridge:
        '有了结构，还要把它训练好。本章进入训练细节：ELIC 用混合量化估计，并采用两阶段训练，让“一次性并行编码”与自回归上下文的数值保持一致。',
      analogy: {
        title: '反复练习直到画面干净',
        text:
          '摄影师反复<b>练习</b>同一组动作，把噪点一点点抹掉。训练就是把损失曲线压下去的过程。',
        componentId: 'elic-ana',
      },
      modules: [
        {
          kind: 'module',
          id: '7.1',
          title: '两阶段训练步骤',
          desc:
            '逐步推进训练阶段：先预热，再主训练，最后微调。每推进一步，损失曲线下降，编码一次性完成与自回归解码逐步对齐。',
          componentId: 'elic-module',
        },
      ],
      insight:
        '自回归上下文在训练时想快速做一次性编码会数值不一致，所以先用均匀噪声加 STE 主训练，再切到 STE(y−μ)+μ 微调对齐。',
      takeaways: [
        { icon: '🎯', title: '混合量化', desc: '训练通道条件模型时用均匀噪声近似量化。' },
        { icon: '🔧', title: '两阶段', desc: '先 STE(y)，后 STE(y−μ)+μ。' },
        { icon: '✨', title: '低码率预热', desc: '低 λ 模型先用 λ=0.015 预热再适配。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-8',
      title: 'ELIC 网络结构：残差块与 SCCTX',
      badge: 'trn',
      badgeLabel: '训练',
      bridge:
        '把前面所有部件拼起来，就是 ELIC。本章用一张可点击的结构图串起主变换、超先验、SCCTX 和熵参数，并比较残差块与 GDN 的选择。',
      analogy: {
        title: '给相机装上合适的镜头',
        text:
          '像给相机<b>安装</b>一枚合适的镜头，ELIC 给主变换装上可堆叠的残差瓶颈块，替代过去的 GDN 层（广义除法归一化，一种逐点非线性层）。',
        componentId: 'elic-ana',
      },
      modules: [
        {
          kind: 'module',
          id: '8.1',
          title: '点击查看每个模块的作用',
          desc:
            '点击结构图中的节点，查看它做什么、输入输出形状如何变化。红色路径是编码，蓝色路径是解码，橙色路径两者共用。主变换里的 GDN 已被可堆叠的残差瓶颈块替代。',
          componentId: 'elic-module',
          figure: '/images/architecture.png',
        },
      ],
      insight:
        '更强大的熵模型让主变换可以变轻；用堆叠残差瓶颈块替代 GDN，还能随块数增加继续提升非线性表达能力。',
      takeaways: [
        { icon: '🎯', title: 'SCCTX', desc: '提供均值与方差熵参数。' },
        { icon: '🔧', title: '残差主变换', desc: '堆叠瓶颈块替代 GDN。' },
        { icon: '✨', title: '轻量化', desc: '强熵模型支撑更轻的变换网络。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-9',
      title: '实用技巧：缩略图预览',
      badge: 'trn',
      badgeLabel: '训练',
      bridge:
        '真实场景里，很多解码并不需要全分辨率。本章看 ELIC 如何用前 128 个通道和一个极小的缩略图合成器，在几微秒内给出预览图。',
      analogy: {
        title: '快速翻看相册小样',
        text:
          '相册里先快速<b>预览</b>小样，几秒钟扫过所有照片，需要哪张再放大细看。缩略图预览正是这个思路。',
        componentId: 'elic-ana',
      },
      modules: [
        {
          kind: 'module',
          id: '9.1',
          title: '缩略图预览与全解码对比',
          desc:
            '点开始，观察两侧从同一状态出发：缩略图合成器几乎瞬间完成低分辨率预览，全解码则要重跑完整合成网络。',
          componentId: 'elic-module',
          figure: '/images/thumbnail.png',
        },
      ],
      insight:
        '因为信息集中在前 128 个通道，只喂给缩略图合成器就能重建出语义完整的低分辨率预览，速度快了 12 倍以上。',
      takeaways: [
        { icon: '🎯', title: '轻量合成器', desc: '只用前 128 通道，网络极小。' },
        { icon: '🔧', title: '约 3 微秒', desc: '比全解码快 12 倍以上。' },
        { icon: '✨', title: '低分辨率够用', desc: '预览保语义，牺牲的分辨率无伤大雅。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-10',
      title: '结果：更快，也更好',
      badge: 'both',
      badgeLabel: '通用',
      bridge:
        '最后回到最初的权衡问题。本章用论文的真实数据做一次对比：ELIC 在率失真和速度两个维度上，是否真的同时占优，边界又在哪里。',
      analogy: {
        title: '两张底片谁先完成',
        text:
          '同一张照片用两种方法显影，看谁<b>更快完成</b>又保留更多细节。比赛结束后，再看分数是否真的支持这个结论。',
        componentId: 'elic-ana',
      },
      modules: [
        {
          kind: 'module',
          id: '10.1',
          title: '率失真与速度对比',
          desc:
            '点击开始，基于论文 Table 2 的 Kodak 数据让各模型的 BD-Rate 与解码延迟动画展开。BD-Rate 越低越好，延迟越短越好；这里以 VVC 的 YUV 4:4:4 色彩空间为锚点。',
          componentId: 'elic-module',
          figure: '/images/rd-curves.png',
        },
      ],
      insight:
        'ELIC 相对 VVC 的 PSNR BD-Rate 为 −7.88%，同时解码总延迟约 49ms，在“质量更好、速度更快”两个维度上同时优于同为可学习方法的 Minnen2020 与 Cheng2020。',
      takeaways: [
        { icon: '🎯', title: 'BD-Rate −7.88%', desc: 'Kodak 上相对 VVC(YUV 4:4:4) 的 PSNR 收益。' },
        { icon: '🔧', title: '解码约 49ms', desc: '显著快于 Minnen2020 的约 66ms。' },
        { icon: '✨', title: '注意边界', desc: 'VVC 主要面向 4:2:0，比较锚点为 4:4:4。' },
      ],
    },
  ],
};
