import type { TutorialData } from '../types';

// 正文、图表与实验数字以 WACV 2021 正式论文为准。
// 合成热像、手工门控及其派生数值均属于教学演示，不是训练后网络输出。
const paper = 'https://openaccess.thecvf.com/content/WACV2021/papers/Dai_Asymmetric_Contextual_Modulation_for_Infrared_Small_Target_Detection_WACV_2021_paper.pdf';
const fpnPaper = 'https://openaccess.thecvf.com/content_cvpr_2017/papers/Lin_Feature_Pyramid_Networks_CVPR_2017_paper.pdf';
const source = (label: string, page: number) =>
  `<span class="ac-source">原文定位：<a href="${paper}#page=${page}" target="_blank" rel="noreferrer">${label} · PDF 第 ${page} 页</a></span>`;

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'Asymmetric Contextual Modulation for Infrared Small Target Detection',
    titleZh: 'ACM：让微弱细节参与跨层判断',
    venue: 'WACV 2021 · 正式会议版｜arXiv 初稿：2020 年 9 月',
    authors: 'Yimian Dai, Yiquan Wu, Fei Zhou, Kobus Barnard',
    affiliation: '南京航空航天大学电子信息工程学院；亚利桑那大学计算机科学系',
    domain: '单帧红外小目标检测 · 像素级分割',
    coreProblem: '红外小目标缺少纹理和形状线索。过强的下采样可能损失细节，全局平均又可能削弱它们在通道描述中的贡献。',
    coreInsight: '跨层融合需要两种尺度的上下文：<b>高层生成全局通道权重，调制低层特征；低层生成逐位置通道权重，调制高层特征</b>。两路相加构成 ACM，再与为小目标调整的下采样方案配合。本导读从夜间巡检出发，依次拆解结构、实验和结论的适用范围。',
    keywords: ['单帧红外', '跨层融合', '全局通道调制', '逐点通道调制', 'SIRST', 'nIoU'],
  },
  hero: {
    oldMethod: {
      desc: '<b>只靠粗略的全局汇报</b>：很小的局部信号在下采样和空间平均中可能被削弱。这里用合成夜间热像说明问题，不代表某个已训练模型的实际错误。',
      componentId: 'hero-old',
    },
    newMethod: {
      desc: '<b>全局判断与局部细节相互调制</b>：先保留足够分辨率，再让两个方向使用不同空间范围的通道上下文。画面、门控和响应均为教学示意。',
      componentId: 'hero-new',
    },
  },
  chapters: [
    {
      kind: 'chapter', id: 'chap-1', title: '热像里的微弱目标', badge: 'both', badgeLabel: '任务与数据',
      bridge: '夜间巡检时，远处的小船可能只有几个像素，背景中的亮斑却很显眼。论文首先追问：<b>“小而亮”是否足以定义目标？</b>理解数据中的困难，才能判断后面的网络改动解决了什么。',
      analogy: {
        title: '夜间巡检 · 最亮的点未必是目标',
        text: '把热像当作一张线索有限的巡检图：亮度告诉我们哪里值得注意，却不能单独确认那里就是目标。上下文有助于辨别干扰，但也不能以牺牲小目标细节为代价。此处的小船和海面用于讲解，不是数据集中所有目标的真实类别。',
        componentId: 'ac-analogy-1',
      },
      modules: [
        {
          kind: 'module', id: '1.1', title: '改变亮度：最亮像素法为什么会失败？', componentId: 'ac-small',
          desc: '拖动目标位置，调整大小与亮度，观察最亮点是否仍落在目标内。论文在 SIRST 中统计，<b>只有 35% 的目标是图像中最亮的部分</b>，因此不能把全局最大亮度当成可靠检测规则。交互中的像素、背景和亮度都由程序合成，只展示一个反例，不用于估计真实检测率。' + source('§3.2', 3) + source('图 3(c)', 5),
        },
        {
          kind: 'module', id: '1.2', title: '从图像到监督信号：SIRST 的五种标注', componentId: 'ac-sirst',
          desc: '切换类别、实例分割、边界框、语义分割和实例点标注。论文报告 SIRST 有 <b>427 张图像、480 个目标实例</b>，大致按 <b>50% / 20% / 30%</b>划分训练、验证与测试；每段序列选一张代表帧，以避免跨划分重叠。本文将检测建模为前景／背景语义分割。交互标注画在合成图上，不是 SIRST 原始样本。' + source('§3.1', 3) + source('图 2', 4),
        },
      ],
      insight: '目标很小与目标很暗是两种不同困难。保留分辨率可以缓解细节损失，却不能自动消除亮背景干扰；反过来，强调全局语义也需要以目标信息尚未丢失为前提。',
      takeaways: [
        { icon: '01', title: '亮度不是类别标签', desc: '真实目标未必最亮，显眼背景也未必属于目标；需要结合上下文进行判断。' },
        { icon: '02', title: '单帧任务，像素级输出', desc: '论文利用序列辅助确认标注，但网络处理的是单帧，输出目标分割掩码。' },
        { icon: '03', title: '数据口径要保留', desc: '427 张、480 个实例与约 50/20/30 划分均是论文报告；后续复现还需核对实际采用的划分文件。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-2', title: '细节在哪里丢失', badge: 'both', badgeLabel: '分辨率与上下文',
      bridge: '从输入到融合，细节可能经历两次削弱：下采样减少空间位置，全局平均把一张特征图压成每通道一个数。<b>这两件事发生在不同位置，也需要分别验证。</b>',
      analogy: {
        title: '巡检网格 · 位置变粗与汇报平均',
        text: '将细网格换成粗网格，会把邻近线索合在一起；再把所有网格的情况平均汇报，会进一步淡化少数位置的异常。保留细网格与保留局部汇报是两项不同的设计。网络中的特征并非原始亮度，下面的平均池化只是帮助理解这一区别。',
        componentId: 'ac-analogy-2',
      },
      modules: [
        {
          kind: 'module', id: '2.1', title: '先看分辨率：定制下采样的作用', componentId: 'ac-down',
          desc: '切换下采样方案和阶段，对照目标占据的网格。论文表 1 以 <b>480×480 输入</b>示例：Stage-1/2/3 分别为 <b>480×480、240×240、120×120</b>，通道数为 <b>16、32、64</b>；只在后两阶段的首个卷积进行下采样。演示使用平均池化和人工可见性判据，不能当作卷积网络的真实特征或检测阈值。' + source('§4.4、表 1', 6),
        },
        {
          kind: 'module', id: '2.2', title: '再看汇报方式：全局通道门控看到了什么？', componentId: 'ac-gap',
          desc: '改变目标占据的面积，观察空间平均与门控值。若只有 k² 个位置额外增加响应 Δ，则平均值只增加 <b>Δ·k²/(H·W)</b>；这是简化设定下的算术关系。论文的 G(Y) 由高层 Y 生成，再乘到低层 X 上，<b>同一通道的所有空间位置共享一个权重</b>。演示门控函数和响应均为手工设定。' + source('§4.1、式 (2)、图 4(a)', 5),
        },
      ],
      formula: {
        lead: '全局分支先对高层特征做空间平均，再通过两层全连接产生通道权重。乘法时，这个权重沿空间维广播。',
        unicode: 'y = (1/HW) Σᵢ Σⱼ Y[:, i, j]<br/>G(Y) = σ(B(W₂ δ(B(W₁ y))))<br/>X′ = G(Y) ⊗ X',
        symbols: [
          { sym: 'X、Y', desc: '对齐后的低层、高层特征，均为 C×H×W。' },
          { sym: 'G(Y)', desc: 'C×1×1 的全局通道门控，不是逐像素目标概率。' },
          { sym: 'W₁、W₂', desc: '通道数 C→C/r→C 的两层全连接；图 4 使用 r=4。' },
          { sym: 'B、δ、σ、⊗', desc: '依次为 BN、ReLU、Sigmoid、逐元素相乘。' },
        ],
      },
      insight: '全局池化会缩小稀疏信号对均值的贡献，但不能据此断言所有全局注意力都会漏检。最终效果还取决于特征通道、权重学习与其他路径；论文用受控消融检验其设计。' + source('§5.2、表 2', 7),
      takeaways: [
        { icon: '01', title: '先保留，再调制', desc: '若目标信息已经丢失，后续注意力没有自动恢复真实细节的保证。' },
        { icon: '02', title: '生成端与被调制端不同', desc: '全局路径由高层 Y 生成 G(Y)，作用于低层 X，方向是自顶向下。' },
        { icon: '03', title: '均值解释机制，消融检验效果', desc: '合成图说明小面积信号如何被平均；它不提供真实网络的性能结论。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-3', title: '拆开非对称调制', badge: 'both', badgeLabel: '核心机制',
      bridge: '保留分辨率后，还需要让局部细节参与高层特征的更新。ACM 增加一条自底向上的路径，但没有照搬全局池化，而是<b>在每个位置分别计算通道权重</b>。这就是“非对称”的关键。',
      analogy: {
        title: '双向交班 · 总览与逐点报告',
        text: '巡检负责人根据整体情况调整关注的线索种类，现场人员则逐处补充局部细节。两种信息在相反方向上传递，覆盖范围也不同。这个比喻不把某一路等同于“语义真值”，也不把局部门控等同于目标坐标。',
        componentId: 'ac-analogy-3',
      },
      modules: [
        {
          kind: 'module', id: '3.1', title: '逐点通道注意力：每个位置有一组权重', componentId: 'ac-pcam',
          desc: '点击不同位置，检查通道向量经过两层 1×1 卷积后的变化。论文采用 <b>C→C/4→C</b> 的瓶颈，保留 H×W 空间维度，得到 <b>C×H×W 的 L(X)</b>。各位置独立聚合通道信息，但共享卷积参数。它既不同于 C×1×1 全局门控，也不同于仅有 1×H×W 的单通道空间权重。交互通道与权重为教学构造。' + source('§4.2、式 (3)–(4)、图 4(b)', 5),
        },
        {
          kind: 'module', id: '3.2', title: '两条交叉路径：谁生成权重，谁接受调制？', componentId: 'ac-acm',
          desc: '开关 G、L 两条路径，观察手工特征如何相乘、相加。<b>G(Y)⊗X</b> 是高层上下文调制低层；<b>L(X)⊗Y</b> 是低层上下文调制高层。注意“自底向上”描述的是调制信息的方向，不意味着在此处重新执行一遍骨干。画面的掩码、IoU 和虚警像素若随开关变化，均来自这组手工参数，不能与论文表 2、表 3 的结果混用。' + source('§4.3、式 (5)', 5) + source('图 5', 6),
        },
      ],
      formula: {
        lead: '先区分两种权重的形状，再沿着乘号确认作用对象。式 (5) 以已对齐的特征为前提。',
        unicode: 'L(X) = σ(B(PWConv₂(δ(B(PWConv₁(X))))))<br/>Y′ = L(X) ⊗ Y<br/>Z = G(Y) ⊗ X + L(X) ⊗ Y',
        symbols: [
          { sym: 'PWConv', desc: '逐点卷积，即 1×1 卷积；这里在每个位置聚合通道，而不进行全图空间平均。' },
          { sym: 'L(X)', desc: '由低层 X 生成的 C×H×W 门控，逐元素作用于高层 Y。' },
          { sym: 'G(Y)', desc: '由高层 Y 生成的 C×1×1 门控，广播后作用于低层 X。' },
          { sym: 'Z', desc: '两路调制结果相加后的 C×H×W 融合特征。' },
        ],
      },
      insight: '“逐点”不等于只看原图一个像素。X 已经经过骨干卷积，每个位置可以包含周围感受野的信息；逐点指的是此处的通道聚合不再压缩空间维。门控值也不是经过标定的目标概率。',
      takeaways: [
        { icon: '01', title: '方向是交叉的', desc: 'Y 生成权重调制 X；X 生成权重调制 Y。不要把生成端和作用端画反。' },
        { icon: '02', title: '非对称指空间范围不同', desc: '向下使用全局通道上下文，向上使用逐位置通道上下文，两个方向都属于通道调制。' },
        { icon: '03', title: '相加之前先对齐', desc: '论文公式假定 X、Y 都是 C×H×W；宿主网络负责相邻层的通道与空间对齐。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-4', title: '宿主网络与消融', badge: 'trn', badgeLabel: '实现与验证',
      bridge: '一个融合公式还不足以构成完整检测系统。论文把 ACM 装入 FPN 和 U-Net，并分别改变下采样、调制方向与上下文范围。读消融时应先明确<b>哪一项改变了，哪些条件保持一致</b>。',
      analogy: {
        title: '巡检设备 · 换规则后逐项比对',
        text: '同一套交班规则可以装进两种巡检流程，但设备分辨率、路线长度和交班方式都会影响结果。只有一次控制一个主要变量，才能分辨改善来自哪里。这里的流程类比对应宿主网络与消融，不意味着真实设备实验。',
        componentId: 'ac-analogy-4',
      },
      modules: [
        {
          kind: 'module', id: '4.1', title: 'ACM-FPN 与 ACM-U-Net：模块放在哪里？', componentId: 'ac-hosts',
          desc: '切换宿主与每阶段残差块数 b，观察融合位置。论文用 ACM 替换 FPN 的相加或 U-Net 的拼接；骨干采用表 1 的 ResNet-20 式结构，<b>b=3</b> 时对应 ResNet-20 骨干深度。论文训练设置为：<b>从头训练、He 初始化、SoftIoU 损失、Nesterov 加速梯度、学习率 0.05、batch size 8、300 epochs</b>。这些是作者实验条件，本网页没有执行模型训练。' + source('§4.4–5.1、图 6、表 1', 6),
        },
        {
          kind: 'module', id: '4.2', title: '三组消融：证据是否支持全部措辞？', componentId: 'ac-ablation',
          desc: '选择 Q1–Q3、宿主和指标，逐行对照表 2。Q1 比较下采样；Q2 在相同注意力参数预算下比较 TopDownLocal 与 BiLocal；Q3 比较 BiLocal、BiGlobal 与 ACM。<b>ACM 在 Q3 的各列均最高</b>，但不能扩写为“所有结构、所有设置都必然更好”：FPN、IoU、b=1/2 时，Regular-ACM 高于 ACM；FPN、IoU、b=1 时，BiLocal 为 0.591，略低于 TopDownLocal 的 0.595。' + source('§5.2、表 2、图 7', 7),
        },
      ],
      insight: '一处值得保留的边界：U-Net、b=4 时，ACM 与 BiLocal 的 IoU 分别为 <b>0.743 与 0.742</b>。这组数值支持本次实验中的排序，却不足以单独证明优势具有统计稳定性；表 2 没有提供多次运行的方差或置信区间。' + source('表 2', 7),
      takeaways: [
        { icon: '01', title: '模块与下采样共同组成系统', desc: '分析结果时，不能把定制下采样的收益全部归因于 ACM 的调制公式。' },
        { icon: '02', title: '以表格限定结论', desc: '总体趋势不等于逐格成立；论文叙述与数值之间的例外应直接指出。' },
        { icon: '03', title: '排名不等于稳定优势', desc: '很小的单次差距需要重复实验进一步判断；本导读没有补做这些实验。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-5', title: '指标与结果怎么读', badge: 'both', badgeLabel: '评测口径',
      bridge: '漏掉几张图中的极小目标，与把一个较大目标分割得不完整，可能让不同指标产生不同排序。先弄清<b>像素怎样合并、样本怎样平均</b>，再解释性能数字。',
      analogy: {
        title: '巡检记录 · 合并统计还是每张一票',
        text: '把所有巡检图的像素合成一本总账，大目标所在图通常贡献更多交并像素；先为每张图评分再平均，则每张图获得相同权重。两种记账方式回答的问题不同，不能仅凭其中一个高分判断所有目标都找到了。',
        componentId: 'ac-analogy-5',
      },
      modules: [
        {
          kind: 'module', id: '5.1', title: 'IoU 与 nIoU：平均发生在除法前还是后？', componentId: 'ac-niou',
          desc: '移动滑块，观察六张合成记录中的交集、并集及两种汇总。论文式 (1) 的 <b>nIoU 是逐张图计算 IoU 后取平均</b>，不是逐个目标实例的平均，也不是召回率。网页同时演示按像素累计交并比的 IoU；所有样本面积和预测方式都是人为构造。论文指出，固定阈值下的 IoU/nIoU 不能替代改变阈值得到的 ROC。' + source('§3.3、式 (1)', 4),
        },
        {
          kind: 'module', id: '5.2', title: '19 种方法：在相同表格内比较', componentId: 'ac-sota',
          desc: '切换指标并选择方法，读取 SIRST 上的论文报告值。表 3 中，<b>ACM-FPN 为 0.731 / 0.721，FPN 为 0.720 / 0.700；ACM-U-Net 为 0.743 / 0.731，U-Net 为 0.733 / 0.709</b>，顺序均为 IoU / nIoU。这里的 FPN、U-Net 是本文实验设置下的宿主基线，不能直接与其他数据集、骨干或训练协议的同名模型比较。' + source('§5.3、表 3；ROC 见图 9', 8),
        },
      ],
      formula: {
        lead: '先为每张图定义交集与并集，再区分整体像素汇总和逐图平均。第二式是论文提出的 nIoU；第一式用于解释本页的累计 IoU 演示。',
        unicode: 'Uᵢ = Tᵢ + Pᵢ − TPᵢ<br/>IoU（像素累计）= (Σᵢ TPᵢ) / (Σᵢ Uᵢ)<br/>nIoU = (1/N) Σᵢ (TPᵢ / Uᵢ)',
        symbols: [
          { sym: 'N', desc: '评测图像数，而不是目标实例总数。' },
          { sym: 'Tᵢ、Pᵢ', desc: '第 i 张图中真值前景、预测前景的像素数。' },
          { sym: 'TPᵢ、Uᵢ', desc: '第 i 张图中前景交集、前景并集的像素数。' },
          { sym: '评测范围', desc: '示例使用含目标的图像；真实复现还需固定阈值及空前景、空并集处理规则。' },
        ],
      },
      insight: '表 3 支持 ACM 在作者这组 SIRST 对照中的优势。它没有给出跨数据集、跨传感器或真实部署的保证，也没有提供推理延迟来证明实时性。ROC 与分割指标应结合阅读，不能互相代替。' + source('§5.3、表 3、图 9', 8),
      takeaways: [
        { icon: '01', title: 'nIoU 对图像等权', desc: '一张图含多个目标时，仍先对整张图计算一次 IoU，不是每个目标各占一票。' },
        { icon: '02', title: '数字连同条件一起引用', desc: '同时保留 SIRST、宿主网络、指标名称与原表位置，避免把不同实验设置混为一谈。' },
        { icon: '03', title: '看排序，也看代价', desc: '固定阈值的分割质量与随阈值变化的检测表现需要一起分析；排名不能替代部署评估。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-6', title: '回到 FPN，划清边界', badge: 'both', badgeLabel: '联系与反思',
      bridge: '从 FPN 读到 ACM，值得追踪的是问题如何变化：FPN 建立语义更强的多尺度特征；本文针对红外微小目标，重新安排跨层调制。<b>继承一条信息路径，不等于照搬整套检测器。</b>',
      analogy: {
        title: '交班核对 · 每条结论附上依据',
        text: '交班记录里，现场测量、推导解释和演练结果应分开标注。读论文也一样：原表中的数值可直接引用，结构理解需要说明推理依据，合成演示只能帮助理解，不能盖成复现结果。',
        componentId: 'ac-analogy-6',
      },
      modules: [
        {
          kind: 'module', id: '6.1', title: '原始 FPN 与本文 ACM-FPN：比较对象先说清', componentId: 'ac-fpn',
          desc: '切换结构图，对照融合方式、分辨率和输出位置。<b>原 FPN 的 RPN 实例</b>在多个 P 层预测目标提案；<b>本文图 6 的 ACM-FPN</b>在最细层输出分割预测，并替换跨层相加。两篇论文的任务、骨干和训练设置不同，结构并列是帮助理解，不能据此推出性能高低，也不能把“所有 FPN”都概括成同一种预测头。' + source('§4.4、图 6、表 1', 6) + `<span class="ac-source">对照来源：<a href="${fpnPaper}#page=4" target="_blank" rel="noreferrer">FPN，CVPR 2017，§3–4.1</a></span>`,
        },
        {
          kind: 'module', id: '6.2', title: '证据核对：哪些结论成立到什么范围？', componentId: 'ac-limits',
          desc: '逐项检查面积换算、消融例外、重复实验与适用范围。比如 <b>300×300 的 0.02% 是 18 像素</b>，不能直接等同于 3×3；表 2 的总体趋势也有前面列出的例外。这些核对说明如何限制措辞，不等于否定整篇论文。页面中没有实际训练日志或新模型评测，交互演示与作者实验始终分开。' + source('§3.2', 3) + source('§5.2、表 2', 7) + source('§5.3、表 3', 8),
        },
      ],
      insight: '更准确的理解是：ACM 让低层细节通过逐位置通道调制参与高层特征，而不是“加了一个能恢复所有小目标的空间注意力”。若继续研究，可在同一数据划分、训练配置和多个随机种子下检验这些机制；这属于后续实验设计，不是本页已经完成的结果。',
      takeaways: [
        { icon: '01', title: '沿信息流理解创新', desc: '检查权重来自哪层、覆盖哪些位置、乘到哪层，比只记住“双向注意力”更准确。' },
        { icon: '02', title: '用来源约束表达', desc: '实验结论对应作者报告的设置；结构解释与教学示意不能替代实验证据。' },
        { icon: '03', title: '导读运行不等于模型复现', desc: '网页中的合成热像、开关和曲线演示用于学习。构建成功没有证明模型训练或真实评测已经完成。' },
      ],
    },
  ],
};
