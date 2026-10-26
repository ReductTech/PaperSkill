import type { TutorialData } from '../types';

// 事实口径统一为 CVPR 2017 正式版，不能与较早作者版的速度数值混用。
// 图表、公式中的 M 记号、手工热力图与几何交互分别标注其证据性质。
const paper = 'https://openaccess.thecvf.com/content_cvpr_2017/papers/Lin_Feature_Pyramid_Networks_CVPR_2017_paper.pdf';
const source = (label: string, page: number) =>
  `<span class="fp-source">原文定位：<a href="${paper}#page=${page}" target="_blank" rel="noreferrer">${label} · PDF 第 ${page} 页</a></span>`;

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'Feature Pyramid Networks for Object Detection',
    titleZh: 'FPN：让不同分辨率的特征都参与检测',
    venue: 'CVPR 2017 · 正式会议版',
    authors: 'Tsung-Yi Lin, Piotr Dollár, Ross Girshick, Kaiming He, Bharath Hariharan, Serge Belongie',
    affiliation: 'Facebook AI Research；Cornell University and Cornell Tech',
    domain: '多尺度目标检测与分割提案',
    coreProblem: '小目标需要足够的空间分辨率，识别目标又需要较强语义；骨干已有多层特征，但各层的语义程度不同。',
    coreInsight: '一张图像进入骨干一次，再用<b>自顶向下路径与横向连接</b>把深层信息送到高分辨率层，在多个尺度分别预测。FPN 的重点既是“保留细节”，也是“让细节获得语义”。本导读沿着<b>结构 → 提案 → 检测 → 证据边界</b>展开。',
    keywords: ['单尺度输入', '特征金字塔', '自顶向下', '横向连接', 'RPN', 'RoI 选层'],
  },
  hero: {
    oldMethod: {
      desc: '<b>只用一张深层特征图</b>：深层有助于识别物体，但连续下采样会使小目标只占很少的格子。城市与网格均为教学示意。',
      componentId: 'hero-old',
    },
    newMethod: {
      desc: '<b>在多个特征尺度上预测</b>：将深层信息逐级送回高分辨率特征，与对应骨干层融合。不是把输入图像反复缩放后多次运行骨干。',
      componentId: 'hero-new',
    },
  },
  chapters: [
    {
      kind: 'chapter', id: 'chap-1', title: '多尺度难题', badge: 'both', badgeLabel: '问题与设计',
      bridge: '同一幅城市图里，小汽车与体育场可能相差几十倍。检测器需要同时回答“在哪里”与“是什么”。这一章对照论文图 1 的四条路线，先分清<b>输入图像的尺度</b>与<b>网络特征图的尺度</b>。',
      analogy: {
        title: '城市地图 · 一张图装不下所有信息',
        text: '街区详图能标出每辆车的位置，城市总图更容易看清道路和建筑的关系。将总图放大，并不会自动补回街区细节。这个比喻只解释分辨率与上下文的取舍，不代表网络真的存储两种地图。',
        componentId: 'fp-analogy-1',
      },
      modules: [{
        kind: 'module', id: '1.1', title: '四种路线：多尺度究竟发生在哪里？', componentId: 'fp-schemes',
        desc: '切换图像金字塔、单张特征图、骨干特征层级和 FPN，再观察小汽车与体育场。<b>图像金字塔</b>对多种输入尺度分别提特征；<b>骨干层级</b>已经有不同分辨率，但浅层语义较弱；<b>FPN</b>在这些层级之间补上信息传递路径。图中的语义颜色、物体与格子是概念示意，不是网络激活或检测结果。' + source('§1、图 1', 1),
      }],
      insight: 'FPN 并非发明了卷积网络的多分辨率层级，而是让已有层级更适合分别预测。它也不只是输出一张精细特征图：<b>多个 P 层都保留为预测入口</b>，这是论文图 2 强调的区别。' + source('图 2', 2),
      takeaways: [
        { icon: '01', title: '分辨率与语义是两件事', desc: '高分辨率有助于保留位置细节，却不自动等于强语义；深层特征也不能靠简单放大恢复丢失的信息。' },
        { icon: '02', title: '一次骨干，多层预测', desc: '本文用单尺度图像构建多尺度特征。图像金字塔则会在多个输入尺度上分别提取特征。' },
        { icon: '03', title: '先看问题，再看涨分', desc: '理解特征如何传递后，再用消融判断结构是否有用；示意图本身不能证明检测性能。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-2', title: '构建金字塔', badge: 'both', badgeLabel: '结构与张量',
      bridge: '骨干负责自底向上提取特征，FPN 增加自顶向下的信息流。读结构图时，必须区分<b>送往下一层的融合中间图</b>与<b>交给预测头的输出 P 层</b>，否则容易把 3×3 卷积放错位置。',
      analogy: {
        title: '逐级对图 · 把城市概况送回街区',
        text: '上一层提供较大范围的理解，本层补充更细的定位线索。两张图必须先对齐尺寸和通道，才能对应位置相加。融合后的草图继续传向下一层，另做一次整理后作为本层的输出。',
        componentId: 'fp-analogy-2',
      },
      modules: [
        {
          kind: 'module', id: '2.1', title: '沿着 C → M → P 读张量形状', componentId: 'fp-arch',
          desc: '选择层级和输入尺寸，追踪 C2–C5、1×1 投影、最近邻上采样及输出卷积。检测实验各 P 层为 <b>256 通道</b>，这些新增 FPN 卷积层没有非线性。<b>M 是本导读为讲清递归而引入的记号</b>，不是论文原命名。奇数尺寸可能使严格 ×2 后多出一格；对齐到横向分支形状是工程处理，论文没有详细规定这一边界。' + source('§3、图 3', 3),
        },
        {
          kind: 'module', id: '2.2', title: '拆开一次融合：位置线索与上下文', componentId: 'fp-merge',
          desc: '分别切换横向分支、自顶向下分支和 3×3 处理，观察手工矩阵怎样变化。<b>热力图、响应比与亮区外接框 IoU 都是教学计算</b>，没有读取模型权重，也没有运行检测网络。此处固定核只用于演示局部处理；真实 FPN 的 3×3 是可学习卷积。' + source('§3，输出卷积与 aliasing 的讨论', 4),
        },
      ],
      insight: '1×1 卷积统一并混合通道，不负责空间上采样；nearest 上采样改变空间尺寸，不凭空增加局部细节；逐元素加法融合两路信息。原文把最终 3×3 的作用描述为减少上采样造成的 aliasing，不能将其等同于一个固定平滑滤波器。',
      formula: {
        lead: '下面用导读记号展开 §3 的结构。递归来自 M，而不是已经经过最终 3×3 卷积的 P。',
        unicode: 'M₅ = L₅(C₅)<br/>Mₗ = Lₗ(Cₗ) + Up(Mₗ₊₁)　（l = 4, 3, 2）<br/>Pₗ = Sₗ(Mₗ)　（l = 2, 3, 4, 5）',
        symbols: [
          { sym: 'Cₗ', desc: '骨干第 l 个 stage 的输出。C2、C3、C4、C5 相对输入的步长分别为 4、8、16、32。' },
          { sym: 'Lₗ', desc: '对应层的 1×1 通道投影。不能把预测头跨层共享参数的声明套到这些横向卷积上。' },
          { sym: 'Mₗ', desc: '本导读定义的融合中间图，用来明确自顶向下递归的路径，不是论文中的正式符号。' },
          { sym: 'Up', desc: '原文为最近邻 2× 上采样。若形状因奇数尺寸不一致，实际实现还需要按目标形状对齐。' },
          { sym: 'Sₗ', desc: '本导读对每层最终 3×3 可学习卷积的记号。检测实验输出 256 通道。' },
          { sym: 'Pₗ', desc: '提供给检测应用的最终特征层，与相应 C 层具有相同空间尺寸。' },
        ],
      },
      takeaways: [
        { icon: '01', title: 'C 是骨干，P 是输出', desc: 'M 只是为避免歧义而加入的中间记号。分清三者，才能正确追踪递归和卷积的位置。' },
        { icon: '02', title: '相加前要形状兼容', desc: '1×1 解决通道维度，上采样处理空间尺度；奇数尺寸的对齐另需实现约定。' },
        { icon: '03', title: '示意数值不构成性能证据', desc: '开关实验帮助理解运算；是否改善召回或检测精度，要回到论文的消融结果。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-3', title: 'RPN 与召回', badge: 'both', badgeLabel: '提案与消融',
      bridge: '金字塔首先用于 RPN，回答“哪些位置值得进一步检查”。这里按各层布置不同大小的锚框，通过 IoU 给锚框分配训练标签。<b>这套标签规则与下一章的 RoI 选层公式不同。</b>',
      analogy: {
        title: '分区巡查 · 不同网格覆盖不同大小',
        text: '密网格适合寻找小物体，稀网格适合覆盖大物体。每一格都放若干候选框，再比较候选框与真值是否重合；并不是先用目标大小为真值硬指定唯一楼层。',
        componentId: 'fp-analogy-3',
      },
      modules: [
        {
          kind: 'module', id: '3.1', title: '锚框如何变成正样本、负样本或忽略项？', componentId: 'fp-anchors',
          desc: '移动或缩放目标，比较 P2–P6 上的锚框。各层面积依次为 32²、64²、128²、256²、512²，配三种长宽比。<b>每个位置有 3 个锚框</b>；面板中的 15 个框只是各层选取一个位置的局部教学集合，不是整张图的全部 anchors。最高 IoU 兜底也仅在这个示意集合里计算。P6 来自 P5 的 stride-2 subsampling，正文没有指定其池化类型或核大小。' + source('§4.1、脚注 1', 4),
        },
        {
          kind: 'module', id: '3.2', title: '用表 1 分辨：更多锚框，还是更好的特征？', componentId: 'fp-ablation',
          desc: '选择消融配置与 AR 指标，比较自顶向下路径、横向连接及多层预测的作用。数据为 <b>COCO minival、ResNet-50、trainval35k 训练</b>；AR100 用 100 个提案，AR1k 及小中大物体分项用 1000 个提案。单层 baseline 同样使用五种锚框尺度，不能把优势解释为“只多加了小锚框”。' + source('表 1、§5.1', 6),
        },
      ],
      insight: '完整 FPN 相对 C4 baseline 的 AR1k 从 48.3 到 56.3，增加 <b>8.0 个百分点</b>，小物体 AR 从 32.0 到 44.9。只有 P2 的方案铺了约 750k 个锚框，仍低于约 200k 锚框的完整 FPN。另一方面，去掉 top-down 的大物体 AR 为 68.0，高于完整 FPN 的 66.2：<b>整体改善不等于每个尺度都最好</b>。' + source('表 1', 6),
      formula: {
        lead: '以下是 §4.1 的匹配规则摘要。阈值比较使用未舍入的 IoU；页面保留三位小数；临界判定仍使用未舍入值。',
        unicode: 'IoU = |A ∩ B| / |A ∪ B|<br/>正样本：某个真值的最高 IoU 锚框，或与任一真值 IoU &gt; 0.7<br/>负样本：未先判为正，且与所有真值 IoU &lt; 0.3；其余忽略',
        symbols: [
          { sym: 'A', desc: '候选锚框。真实 RPN 会在各层全部空间位置生成锚框，本导读只展示局部集合。' },
          { sym: 'B', desc: '真值框。正负标签来自几何匹配，不来自分类分数，也不是 RoI 选层公式的输出。' },
          { sym: 'IoU', desc: '交并比：交集面积除以并集面积。最高 IoU 规则可以保留低于 0.7 的正样本。' },
        ],
      },
      takeaways: [
        { icon: '01', title: 'RPN 用 P2–P6', desc: 'P6 为较大的 512² 锚框补充层级；Fast R-CNN 的 RoI 阶段只使用 P2–P5。' },
        { icon: '02', title: '跨层共享的是预测头', desc: 'RPN 的 3×3 滑窗与分类、回归分支在金字塔层之间共享；它们和生成 P 层的卷积不是同一组参数。' },
        { icon: '03', title: 'AR 衡量提案覆盖能力', desc: '召回改善尚不等于最终类别检测 AP 改善。下一章还要检查检测器如何使用这些提案。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-4', title: 'RoI 与检测', badge: 'both', badgeLabel: '尺度映射与评估',
      bridge: '拿到提案后，Fast R-CNN 需要选一层特征来提取每个 RoI。选择依据是<b>输入图像坐标中的面积平方根</b>。随后要把固定提案的检测器消融，与 RPN、检测器一起变化的系统比较分开阅读。',
      analogy: {
        title: '选一张合适的地图 · 同面积不等于同形状',
        text: '一辆细长公交车和一个近方形物体可以面积相同。该规则会把它们送到同一层，却不意味着二者在特征图上的宽和高相同。面板中的“等效尺度”取宽高的几何平均。',
        componentId: 'fp-analogy-4',
      },
      modules: [
        {
          kind: 'module', id: '4.1', title: '从 RoI 尺寸算出层级：取整和边界都要看', componentId: 'fp-assign',
          desc: '拖动或缩放 RoI，核对 √(wh)、对数和向下取整结果。这里的 w、h 属于<b>网络输入图像</b>坐标；若图像经过缩放，就应使用缩放后的框。原式没有显式 clamp，本导读把超范围层级裁至可用的 P2–P5，作为单独标明的实现处理。本文使用 <b>7×7 RoI pooling</b>，不是 RoIAlign。' + source('§4.2、式 (1)', 4),
        },
        {
          kind: 'module', id: '4.2', title: '表 2 与表 3：两种不同的实验问题', componentId: 'fp-detect',
          desc: '<b>表 2</b>各行固定使用完整 FPN RPN 产生的提案，只改变检测器；<b>表 3</b>每行使用与检测器配套的 RPN。二者均为 COCO minival、ResNet-50、trainval35k 训练。AP 是 COCO 风格的综合指标，AP50 只看 IoU=0.5，两列不能互换。' + source('表 2、表 3', 6),
        },
      ],
      insight: '表 2 的 FPN AP 为 33.9，C4 为 31.9，差值是 <b>2.0</b>；表 3 的 C4 为 31.6，差值才是 <b>2.3</b>。表 2 仅用 P2 仍有 33.4 AP，也不能证明“金字塔其他层不重要”，因为其提案已经来自完整 FPN RPN。表 3 的大物体 AP 则由 C4 的 47.1 降至 FPN 的 45.8，需要连同整体增益一起保留。',
      formula: {
        lead: '先显示论文式 (1)，再单独显示有限层级的实现处理。224×224 映射到 P4；112×112 映射到 P3。',
        unicode: 's = √(wh)<br/>k_raw = ⌊4 + log₂(s / 224)⌋<br/>k_used = min(5, max(2, k_raw))　〔导读实现处理〕',
        symbols: [
          { sym: 's', desc: 'RoI 面积平方根，即等效尺度。相同面积的不同长宽比得到相同层级。' },
          { sym: 'wh', desc: '输入图像坐标系中 RoI 的宽乘高，不能混用未经缩放的原图尺寸或特征图格数。' },
          { sym: 'k_raw', desc: '论文式 (1)的计算结果，使用 floor。s=223.9 时为 3，s=224 时才变成 4。' },
          { sym: 'k_used', desc: '将结果裁至 P2–P5 的导读实现。例如 s=55 时 raw=1、used=2；s=896 时 raw=6、used=5。原公式本身未显式写出此裁剪。' },
        ],
      },
      takeaways: [
        { icon: '01', title: '看面积平方根，不只看宽', desc: 's=112、224、448 是 P3、P4、P5 的切换点。最小与最大可用层还需要边界处理。' },
        { icon: '02', title: '每个 RoI 选择一层', desc: '该检测头不是先把全部 P 层串起来。RoI pooling 后经过两个 1024 维全连接层及 ReLU，头参数跨层共享。' },
        { icon: '03', title: '涨分必须带上对照', desc: '“+2.0”和“+2.3”回答不同问题；不注明提案来源，就会把两张表混成一项实验。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-5', title: '基准、代价与分割提案', badge: 'inf', badgeLabel: '结果与条件',
      bridge: '最终成绩、共享特征系统的速度、分割提案的召回来自不同实验。阅读这一章时，先确认<b>任务、数据划分、训练日程、硬件</b>，再比较数值；不能把各表中最亮眼的指标拼成一个模型。',
      analogy: {
        title: '城市巡检报告 · 先核对同一把尺',
        text: '覆盖了多少疑似地点、识别对了多少类物体、巡查耗时多久，是三个不同问题。若路线、设备或测试区域变了，单独排列数字还不足以形成公平排名。',
        componentId: 'fp-analogy-5',
      },
      modules: [
        {
          kind: 'module', id: '5.1', title: '36.2 AP 与 0.19 秒：属于同一配置吗？', componentId: 'fp-coco',
          desc: '表 4 最终 ResNet-101 模型在 test-dev 为 <b>36.2 AP</b>，采用加倍的 Fast R-CNN 训练日程，且不共享 RPN 与检测器特征。正式版报告的 <b>0.165 秒/图（R50）和 0.19 秒/图（R101）</b>则来自单张 M40 上的共享特征系统。论文没有给出表 4 最终提交配置的对应时延。表 4 的 Multipath 行来自 minival，不能与 test-dev 行当作严格同集排名。' + source('§5.2.2–5.2.3、表 4–5', 7),
        },
        {
          kind: 'module', id: '5.2', title: '从检测框到分割提案：指标也随任务改变', componentId: 'fp-seg',
          desc: '§6 研究的是不分类别的 <b>mask proposals</b>，表 6 报告 1000 个提案上的 segment AR；它不是完整实例分割的类别 AP。训练用 COCO train，评估用 val 前 5k 张。此处 FPN 通道数为 <b>128</b>，而检测实验为 256。默认 14×14 掩码、双 MLP、2× 掩码分辨率和加长日程属于逐步叠加的设置。' + source('§6、图 4、表 6', 8),
        },
      ],
      insight: '表 6 最后一行的 48.1 AR 对应 0.25 秒/图；0.15 秒/图对应单个 5×5 MLP 的 43.4 AR，不能把两者合并成“最高召回、最快速度”。除 InstanceFCN 使用 K40 外，表内计时使用 M40。FPN 的额外层有计算代价；本检测系统比特定 C4 对照更快，还与更轻的检测头有关，不能推出任意网络加上 FPN 都会提速。',
      takeaways: [
        { icon: '01', title: '配置必须成套引用', desc: 'AP、测试集、共享与否和训练日程是一组信息；某配置的速度不能挪给另一配置。' },
        { icon: '02', title: '分割提案仍是提案', desc: '表 6 的 AR 衡量掩码候选覆盖能力，不是 Mask R-CNN 检测精度，也不是最终分类实例分割成绩。' },
        { icon: '03', title: '效率结论有测量边界', desc: '论文的 M40 时延不能直接外推到本机、CPU、手机或现代 GPU；本网页也没有进行这些实测。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-6', title: '关联与证据边界', badge: 'both', badgeLabel: '比较与自检',
      bridge: '理解一个模块，既要知道它解决什么，也要知道哪些结论还需要其他论文或实验。最后把 FPN 放回检测研究的上下文，并用具体反例检查自己是否把<b>结构事实、教学演示与实验结论</b>混在一起。',
      analogy: {
        title: '给记录盖章 · 先分清证据性质',
        text: '地图上的测量记录和未来勘察判断不能盖同一种章。原文记录应有定位，推断要保留条件；开关展示两条性质不同的陈述。',
        componentId: 'fp-analogy-6',
      },
      modules: [
        {
          kind: 'module', id: '6.1', title: '把 FPN 放到后续阅读中，比较具体机制', componentId: 'fp-lineage',
          desc: '切换 FPN、YOLOX、ByteTrack 与 ACM 的阅读入口。<b>这些节点承担不同任务，连线只是后续阅读导航</b>，不是 FPN 原文证明的继承关系或性能排名。比较时分别查特征融合、样本分配、跟踪关联或跨层调制；尤其不要把本文的 RoI 选层公式当成所有 anchor-free 检测器的目标分配规则。',
        },
        {
          kind: 'module', id: '6.2', title: '六个检查点：结论能说到哪里？', componentId: 'fp-limits',
          desc: '逐项检查：表 2 与表 3 为什么出现相同的结果；锚框数量怎样推算；本文未使用哪些额外技巧；速度数据对应什么条件；表 4 的评测口径是否一致；哪些结构细节容易混淆。选中或浏览条目只记录网页交互，不代表完成了代码复现或个人掌握度认证。' + source('图 1、§3、表 1–6', 6),
        },
      ],
      insight: '<b>一个有证据的边界：</b>表 3 支持“在本文 COCO 协议下，FPN 系统整体 AP 和小物体 AP 高于本文 C4 baseline”；同表的大物体 AP 下降，又否定了“每个尺度都获益”的强说法。它没有直接证明在所有数据集、骨干、设备和任务上都有效。网页里的手工城市图和热力图，不能补上这些未进行的实验。',
      takeaways: [
        { icon: '01', title: '结构可以逐步推演', desc: '能说明 C、M、P、RPN 和 RoI 的不同角色，比只记住“多尺度融合”更能检验理解。' },
        { icon: '02', title: '数字要回到表与协议', desc: '保留不利分项、不同测试集和硬件差异，才不会把论文结果写成普遍承诺。' },
        { icon: '03', title: '导读与复现分开', desc: '本网页展示原文结果和教学计算；页面成功运行不意味着已经训练、评估或复现 FPN 检测模型。' },
      ],
    },
  ],
};
