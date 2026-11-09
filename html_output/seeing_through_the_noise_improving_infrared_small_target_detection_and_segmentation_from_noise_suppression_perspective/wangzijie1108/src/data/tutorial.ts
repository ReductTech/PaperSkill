import type { TutorialData } from '../types';

// 论文事实以 CVPR 2026 正式版为准；交互中的合成图与手工规则不构成模型评测。
const paper = 'https://openaccess.thecvf.com/content/CVPR2026/papers/Yuan_Seeing_Through_the_Noise_Improving_Infrared_Small_Target_Detection_and_CVPR_2026_paper.pdf';
const fpnPaper = 'https://openaccess.thecvf.com/content_cvpr_2017/papers/Lin_Feature_Pyramid_Networks_CVPR_2017_paper.pdf';
const acmPaper = 'https://openaccess.thecvf.com/content/WACV2021/papers/Dai_Asymmetric_Contextual_Modulation_for_Infrared_Small_Target_Detection_WACV_2021_paper.pdf';
const authorCode = 'https://github.com/mengduann/NS-FPN/blob/b857bef068ba48f1258b62de6bf082f73dbafde4/model/NS_FPN.py';
const source = (label: string, page: number) =>
  `<span class="ns-source">原文定位：<a href="${paper}#page=${page}" target="_blank" rel="noreferrer">${label} · PDF 第 ${page} 页</a></span>`;

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'Seeing Through the Noise: Improving Infrared Small Target Detection and Segmentation from Noise Suppression Perspective',
    titleZh: 'NS-FPN：先抑制噪声，再融合目标线索',
    venue: 'CVPR 2026 · arXiv:2508.06878',
    authors: 'Maoxun Yuan, Duanni Meng, Ziteng Xi, Tianyi Zhao, Shiji Zhao, Yimian Dai, Xingxing Wei',
    affiliation: '北京航空航天大学；南开大学',
    domain: '红外小目标检测与分割 · 特征金字塔',
    coreProblem: '微弱目标需要细节，但背景杂波也可能占据高频分量。只追求更强的特征响应，可能同时增加虚警。',
    coreInsight: '<b>LFP 先由低频生成权重，选择性净化高频；SFS 再按螺旋模式采样上层特征，通过交叉注意力补充语义。</b>两者接入特征金字塔，在作者报告的实验中改善检测与分割表现。下面从夜间巡防的取景问题出发，拆开计算过程，再检查实验支持的范围。',
    keywords: ['红外小目标', '噪声抑制', '低频引导', '门控高斯滤波', '螺旋采样', '特征融合'],
  },
  hero: {
    oldMethod: {
      componentId: 'hero-old',
      desc: '<b>增强细节时，也可能带入杂波。</b>远处目标、树冠和亮窗都能形成局部高频响应。这里的热像与预测是合成示意，不代表某个真实 FPN 模型的输出。',
    },
    newMethod: {
      componentId: 'hero-new',
      desc: '<b>先净化，再融合。</b>用低频线索调节高频，再对不够确定的分量进行选择性平滑。封面只演示 LFP 的简化效果，SFS 的计算在第 3 章展开。',
    },
  },
  chapters: [
    {
      kind: 'chapter', id: 'chap-1', title: '细节与虚警的两难', badge: 'both', badgeLabel: '问题与观察',
      bridge: '夜间巡防中，把热像调得更清楚，未必只让目标更显眼。先观察同一张图的低频和高频：<b>哪些细节帮助定位，哪些细节又可能触发虚警？</b>这是论文设计 LFP 的起点。',
      analogy: {
        title: '夜间巡防 · 放大细节，也放大干扰',
        text: '放大取景能看清远处小目标，也会让树叶、亮窗等干扰更突出。巡防员需要判断哪些线索值得保留。此处只是解释“目标细节与背景响应可能一起增强”，不把所有高频都当作噪声，也不把所有低频都当作可靠目标。',
        componentId: 'ns-analogy-1',
      },
      modules: [
        {
          kind: 'module', id: '1.1', title: '调高细节权重，会改变什么？', componentId: 'ns-problem',
          desc: '拖动高频权重，比较合成场景里的目标命中与背景误判。论文将增强特征时伴随的虚警作为研究动机；本页用手工小波重建和局部对比规则解释这种可能的代价。<b>示意中的命中数、虚警像素和柱状图都不是论文实验，也不能用来估计真实模型的检测率。</b>' + source('图 1', 1) + source('§1、图 2', 2),
        },
        {
          kind: 'module', id: '1.2', title: '拆成低频与高频：两类信息各缺什么？', componentId: 'ns-dwt',
          desc: '切换原图、低频、高频及三个高频子带。论文图 2 用 Haar 小波考察 DNANet、MSHNet：低频输入减少虚警，却损失部分定位能力；细节对定位有帮助，也可能带入干扰。<b>图 2 是动机证据，不是“任意高频都应被删除”的证明。</b>本页的归一化、检测规则和合成图用于理解分解过程。' + source('§1、图 2', 2) + source('§3.1、式 (1)', 3),
        },
      ],
      insight: '“高频”是变化快的分量，“噪声”是相对任务无用或有害的信息，两者不能直接画等号。目标的轮廓、亮点与背景边缘都可能出现在高频中；NS-FPN 要学习的是有条件的抑制，而不是固定删除一个频段。',
      takeaways: [
        { icon: '01', title: '保住目标与减少虚警要一起看', desc: '只看目标是否更亮，无法判断背景误判是否同时增加。' },
        { icon: '02', title: '低频提供线索，不提供真值', desc: '低频可能更适合抑制杂波，但也会丢失细小目标的定位细节。' },
        { icon: '03', title: '示意只检验自己的规则', desc: '合成场景的计数来自本页算法，不等同于 DNANet、MSHNet 或 NS-FPN 的表现。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-2', title: 'LFP：低频怎样净化高频', badge: 'both', badgeLabel: '两阶段净化',
      bridge: '论文没有只保留低频，而是让低频生成空间权重，再对高频作两次处理：<b>先选择性调制，再对幅值较小的分量进行高斯平滑。</b>最后通过逆小波变换回到原特征空间。',
      analogy: {
        title: '夜间巡防 · 先看全景，再整理细节',
        text: '巡防员先看模糊全景，确定值得细查的区域；随后对不够确定的细节作更谨慎的判断。这个类比对应低频引导与门控平滑。它不表示低频已经知道真正目标在哪，也不表示平滑能够恢复被抹掉的信息。',
        componentId: 'ns-analogy-2',
      },
      modules: [
        {
          kind: 'module', id: '2.1', title: '第一阶段：由低频生成空间权重', componentId: 'ns-guide',
          desc: '移动探针并调整示意门槛，观察低频线索、空间权重 A_s 与高频响应。原文式 (2) 对 F_l 做平均池化、最大池化、拼接和卷积，再经过 Sigmoid；式 (3) 用 A_s 逐元素调制 F_h。<b>这里展示的是手工单通道计算，不能把示意卷积、偏置或门槛当作论文的训练参数。</b>' + source('§3.1、式 (1)–(3)', 3) + source('图 3', 4),
        },
        {
          kind: 'module', id: '2.2', title: '第二阶段：哪些系数被平滑？', componentId: 'ns-gate',
          desc: '调整 τ 与 σ，比较原特征、第一阶段结果和重建结果。式 (4) 的方向是：<b>|F̂_h| &lt; τ 时采用高斯平滑结果，|F̂_h| ≥ τ 时保留原值</b>；式 (5) 中 σ 可学习，式 (6) 以原低频 F_l 和净化后的高频重建 X′。页面的核大小、参数范围及子带合幅值判据属于演示约定，不等同于作者实现。' + source('§3.1、式 (4)–(6)', 4),
        },
      ],
      formula: {
        lead: '沿着数据流看：小波分解 → 低频生成门控 → 选择性平滑高频 → 逆变换。第二阶段的分段条件不能写反。',
        unicode: '[F_l, F_h] = DWT(X)<br/>A_s = Sigmoid(Conv(APool(F_l) ‖ MPool(F_l)))<br/>F̂_h = A_s ⊙ F_h<br/>F̃_h = G(F̂_h) · 𝕀(|F̂_h| &lt; τ) + F̂_h · 𝕀(|F̂_h| ≥ τ)<br/>X′ = IDWT(F_l, F̃_h)',
        symbols: [
          { sym: 'F_l', desc: '输入特征经单层二维小波分解得到的低频分量。' },
          { sym: 'F_h', desc: '高频分量；包含有用细节，也可能包含背景干扰。' },
          { sym: 'A_s', desc: '由低频得到的 Sigmoid 空间权重，用于调制高频。不是目标真值或已校准的检测概率。' },
          { sym: 'G', desc: '高斯平滑算子，核按 exp(−((i−c)²+(j−c)²)/(2σ²)) 归一化；论文将标准差 σ 设为可学习参数。' },
          { sym: 'τ', desc: '经验阈值。低于阈值的高频系数采用平滑结果，高于或等于阈值的系数保留。' },
          { sym: '𝕀', desc: '指示函数：条件成立为 1，否则为 0。' },
          { sym: 'IDWT', desc: '逆离散小波变换；重建时使用原低频和净化后的高频。' },
        ],
      },
      insight: '两个容易混淆的边界：A_s 在 0 与 1 之间，因此式 (3) 单独相乘不会放大一个系数的绝对值，“增强”应结合相对显著性和后续网络理解。式 (4) 则把幅值当作筛选线索，并不保证小幅值都是噪声；过度平滑也可能损伤微弱目标。这些是从公式可直接分析的条件，不是本页新增的模型实验。',
      takeaways: [
        { icon: '01', title: '低频引导，高频接受调制', desc: '第一阶段的权重来自 F_l，作用对象是 F_h，方向不要画反。' },
        { icon: '02', title: '选择性平滑有明确条件', desc: '低于 τ 才切换到高斯平滑值；它不是对所有高频统一模糊。' },
        { icon: '03', title: '重建不等于恢复真值', desc: 'IDWT 按修改后的系数重建特征，不能保证恢复已被抑制的目标信息。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-3', title: 'SFS：怎样读取上层线索', badge: 'both', badgeLabel: '采样与融合',
      bridge: 'LFP 处理本层特征，接下来还要从上层补充语义。SFS 的改动分两步：<b>用带可学习偏移的螺旋模式取样，再以本层特征为 query 做交叉注意力。</b>这两步共同替代简单的上采样融合。',
      analogy: {
        title: '夜间巡防 · 围绕可疑点由近及远观察',
        text: '看到可疑点后，巡防员按一定路径观察附近，而非只盯住中心；不同观察方向带回不同线索。螺旋是采样位置的组织方式，不是目标的运动轨迹。论文采用的目标强度分布先验，也不能推广成所有红外目标都严格符合的规律。',
        componentId: 'ns-analogy-3',
      },
      modules: [
        {
          kind: 'module', id: '3.1', title: '采样点由哪些量决定？', componentId: 'ns-spiral',
          desc: '移动 query，改变头数 H、点数 P、初始半径 l₀ 与径向步长 Δl，观察各头的取点方式。原文先建立参考网格 p，再以 <b>Δp=s+ε</b> 形成偏移，并对上层 Yᵢ₊₁ 做双线性插值。ε 在不同 query 之间共享。DAT 一侧的伪随机点和本页的网格、参数初值都是示意，不是复现的 DAT 或 SFS 输出。' + source('§3.2、式 (7)', 4) + source('式 (8)、§3.3、图 4', 5),
        },
        {
          kind: 'module', id: '3.2', title: '采样后，谁是 query、key 和 value？', componentId: 'ns-attn',
          desc: '点击数据流，跟踪 <b>X′ᵢ 作 query、采样得到的 Y′ᵢ₊₁ 作 key/value</b>，再将融合结果与 X′ᵢ 残差相加。第 3 节将特征统一为 64 通道，X₁–X₄ 的步长为 2、4、8、16；各层均有 LFP，仅 Y₁–Y₃ 使用 SFS。表 1 报告 SFS 的 IoU/Pd/Fa 为 <b>69.29/95.24/8.58</b>，应与该表的 Upsample、DAT 条件一起阅读。' + source('§3', 3) + source('图 3', 4) + source('式 (9)–(10)、表 1', 5),
        },
      ],
      formula: {
        lead: '式 (8) 的索引从 1 开始：k=1 时半径是 l₀+Δl。共享偏移允许调整基础螺旋，实际采样点未必仍严格落在规则螺旋上。',
        unicode: 'θₕ,ₖ = 2πk/P + 2πh/H<br/>l_s = l₀ + k·Δl<br/>s⁽ʰ,ᵏ⁾ = l_s [cos θₕ,ₖ, sin θₕ,ₖ]<br/>Y′ᵢ₊₁ = φ(Yᵢ₊₁; p + s + ε)<br/>F_s = Attn(LN(X′ᵢ), LN(Y′ᵢ₊₁))<br/>Yᵢ = X′ᵢ + F_s',
        symbols: [
          { sym: 'H', desc: '注意力头数，原式 h=1,…,H；不要与特征图高度混淆。' },
          { sym: 'P', desc: '每个头的采样点数，原式 k=1,…,P。' },
          { sym: 'l₀', desc: '原式称为初始半径参数；由于 k 从 1 起，首点的实际半径还包含一个 Δl。' },
          { sym: 'ε', desc: '可学习偏移，在不同 query 之间共享。页面开关演示的是手工偏移。' },
          { sym: 'φ', desc: '双线性插值，在上层特征图的非整数位置读取特征。' },
          { sym: 'Attn', desc: '交叉注意力。本层净化特征是 query，采样的上层特征提供 key 和 value。' },
          { sym: 'LN', desc: 'LayerNorm；残差相加前，两路输出需要在形状上兼容。' },
        ],
      },
      insight: '“共享偏移”不等于所有位置得到相同输出：不同参考位置仍会读到不同的上层特征，query 也不同。结构先验与可学习偏移约束的是取样方式，不能单独保证每个采样点都对应真实目标。',
      takeaways: [
        { icon: '01', title: '螺旋组织位置，注意力融合内容', desc: '取到哪些点与如何加权这些点是两步计算，不能合并成一个含糊的“关注目标”。' },
        { icon: '02', title: '输入方向清楚', desc: '本层净化特征提出 query；更深层的采样特征提供 key/value。' },
        { icon: '03', title: '最终仍有残差相加', desc: '式 (10) 保留 X′ᵢ，再加入 F_s；不是完全用上层特征替换本层。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-4', title: '消融：每个改动贡献多少', badge: 'trn', badgeLabel: '实验与条件',
      bridge: '先固定数据与训练协议，再讨论模块作用。作者在 IRSTD-1k 和本文称为 NUAA-SIRST 的数据上采用 <b>80% 训练、20% 测试</b>；分割宿主为 MSHNet，检测宿主写为 YOLOv8n-p2。不同表格的同名基线不能自动当成同一次实验。' + source('§4.1–4.2', 5),
      analogy: {
        title: '夜间巡防 · 分别换装，再一起比较',
        text: '先只加滤镜，再只换观察方式，最后两项都换，才能检查改善与哪项改动有关。设备、场景与统计方法必须同时记录。这里对应论文的受控消融，不代表本页实际做过模型训练。',
        componentId: 'ns-analogy-4',
      },
      modules: [
        {
          kind: 'module', id: '4.1', title: 'LFP 与 SFS：作用会随数据集改变吗？', componentId: 'ns-ablation',
          desc: '切换两个模块与数据集，按表 2 比较四种配置。IRSTD-1k 上，基线 <b>67.04/91.16/13.06</b> 变为合用时的 <b>69.29/95.24/8.58</b>（IoU/Pd/Fa）；但只加 SFS 时 Fa 升至 <b>13.66</b>。表 6 的参数与 FLOPs 增量是 <b>+0.26M、+1.16G</b>，不是整个模型的总量。作者报告 Adagrad、初始学习率 0.05、500 epochs、batch size 16；这些是论文条件，网页没有执行训练。' + source('§4.2–4.3、表 2', 6) + source('§4.5、表 6', 8),
        },
        {
          kind: 'module', id: '4.2', title: '层级、头数与点数：指标是否一起改善？', componentId: 'ns-hp',
          desc: '表 3 保留 SFS，比较 LFP 加入不同层级的结果。只在 X₁ 加 LFP 时 <b>Fa=6.15</b>，四层全加时为 <b>8.58</b>，后者的 IoU/Pd 更高；“综合更好”不等于每项更好。图 6 的 24 组中，作者选择 <b>H=8、P=4</b>：IoU、Pd 最高，Fa 与 H=8、P=6 并列最低。所有热力图数字来自原图，不是连续参数下的模型预测。' + source('§4.3、表 3、图 6', 6),
        },
      ],
      insight: '一个可由表格直接检查的边界：LFP、SFS 单独加入时，Fa 的变化并不在两个数据集上完全相同。还有，论文未详述超参数选择使用的独立验证集，也未提供多次运行的方差；因此可以比较已报告数字，不能据此确认微小差距具有稳定性，更不能反推作者一定在测试集上调参。' + source('§4.1', 5) + source('§4.3、表 2–3、图 6', 6),
      takeaways: [
        { icon: '01', title: '用同一表中的基线算增益', desc: '表 2 的 MSHNet+FPN 基线与表 5 的 MSHNet 数字不同，应分别保留。' },
        { icon: '02', title: '分割和检测的输入设置不同', desc: '§4.2：分割训练先缩放到 256 再随机裁剪到 224；检测输入统一缩放到 640。' },
        { icon: '03', title: 'FLOPs 不等于实际时延', desc: '参数量与理论计算量可以比较开销，不能直接换算为部署 FPS。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-5', title: '结果：优势在哪，例外在哪', badge: 'both', badgeLabel: '比较与指标',
      bridge: '比较结果前，先分清任务：分割使用 IoU、Pd 与 Fa，检测使用 mAP50、mAP75 与 mAP。<b>指标的方向、单位和比较条件都要随数字保留。</b>本章直接读取原表，不从百分比推算未知的测试目标数。' + source('§4.1', 5) + source('表 5', 7),
      analogy: {
        title: '夜间巡防 · 同一张记录表，多种评价',
        text: '一次巡防可以记录发现多少目标、误报多少背景、轮廓画得多准；不同记录不能互相替代。比较两套设备时，还要确认使用了同样的场景和规则。示意账本帮助区分指标，真正的结果以右侧原表为准。',
        componentId: 'ns-analogy-5',
      },
      modules: [
        {
          kind: 'module', id: '5.1', title: '换一种 FPN，是否所有指标都更好？', componentId: 'ns-fpns',
          desc: '按表 4 切换指标，比较 FPN、PANet、BiFPN、HS-FPN 与 NS-FPN。在这组 IRSTD-1k 对照中，NS-FPN 的 IoU、Pd、mAP50 与 mAP 最高，<b>Fa 最低的却是 PANet：6.7，NS-FPN 为 8.5</b>。表 4 保留一位小数，其他表保留精度不同；本页按原表展示，不拼接或擅自“修正”为统一数值。结构小图是简化示意。' + source('§4.3、表 4', 6),
        },
        {
          kind: 'module', id: '5.2', title: '分割领先，不代表检测每一项都领先', componentId: 'ns-sota',
          desc: '选择任务、数据集和方法。表 5 中，MSHNet+NS-FPN 在 IRSTD-1k 的 <b>IoU/Pd/Fa=69.29%/95.24%/8.58×10⁻⁶</b>，在 NUAA-SIRST 为 <b>78.75%/100.0%/1.60×10⁻⁶</b>。检测部分则有明确例外：NUAA-SIRST 的 <b>mAP50，EFLNet 为 98.1%，本文为 97.5%</b>；不能照抄正文“所有指标最好”的概括。表中“–”表示未报告，不按 0 计算。' + source('§4.4、表 5', 7),
        },
      ],
      formula: {
        lead: '分清指标名称与阈值。下式解释论文 §4.1 的检测 mAP 定义；并不是把分割 IoU、Pd 或 Fa 再做一次平均。',
        unicode: 'mAP = (1/10) Σₜ mAP@t<br/>t ∈ {0.50, 0.55, …, 0.95}<br/>mAP50 = mAP@0.50；mAP75 = mAP@0.75',
        symbols: [
          { sym: 'mAP', desc: '在 0.50 到 0.95、步长 0.05 的十个 IoU 阈值上平均检测 AP。具体复现还需对齐评测实现。' },
          { sym: 'mAP50', desc: '检测匹配 IoU 阈值固定为 0.50 时的 AP 指标，不能等同于分割 IoU。' },
          { sym: 'mAP75', desc: '检测匹配 IoU 阈值固定为 0.75，比 0.50 对框定位要求更严格。' },
          { sym: 't', desc: '用于检测匹配的 IoU 阈值，不是图像亮度或分割概率阈值。' },
        ],
      },
      insight: '表 5 的分割结果支持本文在所列两组对照中的优势；检测 mAP50 的反例则要求收窄“全面领先”的措辞。公开表格没有充分说明每项外部结果的全部重训练细节，因此不根据几位小数推断测试集目标总数、其他方法使用的划分，或比较者的实验行为。',
      takeaways: [
        { icon: '01', title: 'Fa 越低越好', desc: '表 5 的 Fa 单位为 10⁻⁶；8.58 不能写成 8.58% 的虚警率。' },
        { icon: '02', title: '同名指标也要核对任务', desc: '分割 IoU 描述像素交并，检测 mAP 在不同框匹配阈值下评估，不能互换。' },
        { icon: '03', title: '保留真实的例外', desc: 'PANet 的 Fa、EFLNet 的 mAP50 都提醒我们：综合优势不等于每格最优。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-6', title: '串联 FPN、ACM 与 NS-FPN', badge: 'both', badgeLabel: '联系与边界',
      bridge: '三篇论文都涉及跨层特征，却改动了不同环节。把它们放在一张结构图上，可以追踪思想如何变化；<b>把它们的性能数字直接排在一起，则必须先对齐任务、骨干、划分和训练协议。</b>',
      analogy: {
        title: '夜间巡防 · 交班前核对每条结论',
        text: '交班时，一条结论应能回答“在哪种设备、哪组场景、什么规则下得到”。已测量的数据、由公式得出的解释和演练中的现象分别记录。这个核对动作对应论文阅读中的证据边界，不是对模型复现进度的替代。',
        componentId: 'ns-analogy-6',
      },
      modules: [
        {
          kind: 'module', id: '6.1', title: '三种结构分别改了哪里？', componentId: 'ns-lineage',
          desc: '切换 FPN、ACM-FPN 与 NS-FPN。FPN 以侧向连接和自顶向下路径构建多尺度特征；ACM 用全局与逐点通道调制改变融合；NS-FPN 在侧向特征上采用 LFP，并以 SFS 改变上层取样与融合，<b>最终式 (10) 仍有残差相加</b>。第 3 节明确有 1×1 通道投影，不能把“LFP 替换侧向操作”理解为整网删除了所有 1×1 卷积。' + source('§3', 3) + source('图 3', 4) + source('式 (9)–(10)', 5) + `<span class="ns-source">对照原文：<a href="${fpnPaper}#page=3" target="_blank" rel="noreferrer">FPN，CVPR 2017，§3</a>；<a href="${acmPaper}#page=5" target="_blank" rel="noreferrer">ACM，WACV 2021，式 (5)</a>。</span>`,
        },
        {
          kind: 'module', id: '6.2', title: '把结论放回证据范围', componentId: 'ns-check',
          desc: '逐项检查原文叙述与表格：表 3 的 6.15 对应哪层；表 4、表 5 哪些指标有例外；不同表的基线为什么要分别引用。对于论文未逐项说明的初始化、阈值和采样细节，需与指定版本的作者代码核对，<b>不把本页的手工参数填成作者设置，也不把推算出的目标数当作数据集事实</b>。网页构建与互动演示不代表检测模型已运行。' + source('§3.1–3.2', 4) + source('§4.1–4.2', 5) + source('§4.2–4.3、表 2–4', 6) + source('表 5', 7) + `<span class="ns-source">实现对照：<a href="${authorCode}" target="_blank" rel="noreferrer">作者代码 NS_FPN.py · 版本 b857bef</a></span>`,
        },
      ],
      insight: '这篇论文值得带走的思路是：在保留微弱目标信息的同时，明确处理融合过程中的杂波来源。LFP 与 SFS 提供了两种具体做法，但它们依赖特征、采样先验与训练条件。进一步检验需要固定划分、补齐实现细节并进行重复实验；本导读没有把这些后续实验写成已完成结果。',
      takeaways: [
        { icon: '01', title: '沿计算路径理解改进', desc: '先问改的是侧向特征、采样位置还是融合算子，再比较相应证据。' },
        { icon: '02', title: '结构对照与性能对照分开', desc: '本论文的 80/20 划分不能直接等同于 ACM 原论文约 50/20/30 的实验协议。' },
        { icon: '03', title: '能够演示，不等于已经复现', desc: '本页展示论文解释、原表数据与合成计算；没有提供模型训练日志或新评测结果。' },
      ],
    },
  ],
};
