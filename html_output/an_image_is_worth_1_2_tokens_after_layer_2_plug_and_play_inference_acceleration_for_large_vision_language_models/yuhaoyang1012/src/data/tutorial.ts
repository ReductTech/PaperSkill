import type { TutorialData } from '../types';
import { T, E } from '../modules/glossary';

// ============================================================================
//  FastV 交互式教程数据。论文：ECCV 2024 Oral（arXiv:2403.06764）。
//  图、表、章节、公式编号统一采用 ECCV 正式版；E(...) 生成可悬停 / 点按的证据定位，
//  T(...) 生成术语弹注。读图近似值、合成示意、公式外推与本页解读均在文中注明。
// ============================================================================

export const tutorial: TutorialData = {
  meta: {
    titleEn:
      'An Image is Worth 1/2 Tokens After Layer 2: Plug-and-Play Inference Acceleration for Large Vision-Language Models',
    titleZh: '图像在第 2 层后只值一半 Token：FastV 即插即用推理加速',
    venue: 'ECCV 2024 · Oral',
    authors: 'Liang Chen, Haozhe Zhao, Tianyu Liu, Shuai Bai, Junyang Lin, Chang Zhou, Baobao Chang',
    affiliation: '北京大学 多媒体信息处理全国重点实验室；阿里巴巴集团',
    domain: '多模态大模型 · 推理加速',
    coreProblem:
      '视觉语言大模型把一张图变成数百上千个 token，计算量随 token 数快速增长；而这些图像 token 在深层得到的注意力很少。',
    coreInsight: `LLaVA-1.5 在<b>第 2 层之后很少关注图像 token</b>：深层里每个图像 token 分到的注意力只有系统提示 token 的 <b>1/472</b> ${E('fig3')}。FastV 在第 K 层按注意力给图像 token 排序，<b>剪掉排名靠后的 R%</b>，无需训练。在论文测试的设置中，LLaVA-1.5-13B 取 K=2、R=50% 时理论 FLOPs 降到 <b>55%</b>，四项任务平均分仍是 <b>73.6</b> ${E('tab1')}。`,
    keywords: ['视觉语言大模型', '视觉 token 剪枝', '注意力效率', '即插即用 · 免训练', 'LLaVA-1.5 / Qwen-VL / Video-LLaVA'],
  },
  hero: {
    oldMethod: {
      desc: '<b>传统 LVLM</b>：576 个图像 token 在全部 32 层都参与注意力与 FFN 计算',
      componentId: 'hero-stage',
    },
    newMethod: {
      desc: '<b>FastV（K=2，R=50%）</b>：第 2 层后只保留一半图像 token，理论 FLOPs ≈ 55%（LLaVA-1.5-7B，Table 1）',
      componentId: 'hero-stage',
    },
  },
  chapters: [
    // ================================================================== 1
    {
      kind: 'chapter',
      id: 'chap-1',
      nav: '看一张图的代价',
      title: '看一张图，为什么这么贵',
      badge: 'inf',
      badgeLabel: '推理 · 必读',
      bridge: `视觉语言大模型（LVLM）把一张图切成<b>数百上千个 token</b>，和文字一起送进语言模型。语言模型的每一层都要为每个 token 做一次自注意力和一次 ${T('FFN')}——图越清晰、帧越多，token 越多，计算量随之上涨 ${E('sec2')}。`,
      analogy: {
        title: '满台群演，灯光师一个个照过去',
        text: '每一轮彩排，灯光师都要在<b>每一位</b>群演身上停一下。人越多，一轮越慢——哪怕大多数人没有台词。',
        componentId: 'ana-1',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '换一种输入，token 数量差多少',
          desc: '点击不同的输入设置，看图片被切成多少个 token、它们在整条序列中的占比，以及单层计算量相对 LLaVA-1.5 的倍数。其中 2304 对应 <b>LLaVA-NeXT 的 672×672 配置</b>；文字长度按 Fig. 3 的平均值计（系统提示 35、指令 135、输出 150）。注意占比的分母是 Figure 3 所统计的整条序列，<b>包含生成的输出 token</b>，不是首次输入时的比例。',
          componentId: 'token-explosion',
        },
      ],
      formula: {
        eq: 'sec42f',
        lead: '单层计算量 f(n)（§4.2，只计多头注意力与 FFN；完整模型的降幅公式 Eq. 5 见第 6 章）：',
        unicode: 'f(n) = 4·n·d² + 2·n²·d + 2·n·d·m',
        summary: '一层要为每个 token 做投影和 FFN（两项都随 n 线性增长），再让所有 token 两两算注意力（随 n² 增长）——token 越多，三项一起变贵。',
        symbols: [
          { sym: 'n', desc: '这一层处理的 token 数：图像越大、帧越多，n 越大' },
          { sym: 'd', desc: '隐藏层维度（LLaVA-1.5-7B 为 4096，13B 为 5120）' },
          { sym: 'm', desc: 'FFN 中间层维度（7B 为 11008，13B 为 13824）' },
        ],
      },
      deepDive: {
        title: 'token 多 × 每个 token 贵',
        paragraphs: [
          `典型 LVLM 由视觉编码器（如 CLIP-ViT）、对齐层（线性变换或交叉注意力）和语言模型解码器组成 ${E('fig2')}。论文举例：LLaVA 把 336×336 的图变成 576 个 token；<b>LLaVA-NeXT 在 672×672 配置下用 2304 个</b>；Fuyu 把 1080×1080 的图变成 1296 个；视频和多图模型要在上下文里预留数千个 token ${E('sec2')}。`,
          `另一方面，语言模型的能力主要来自规模，每个 token 的计算也随之变贵。论文由此提出两个当时少有人研究的问题：语言模型怎样处理图像？LVLM 的高效推理该怎么做？${E('intro')}`,
        ],
        facts: [
          { value: '576', label: 'LLaVA-1.5 · 336×336 的图像 token' },
          { value: '2304', label: 'LLaVA-NeXT · 672×672 配置' },
          { value: '≈64%', label: '图像 token 占 Figure 3 所统计序列的比例（包含生成的输出 token）' },
        ],
      },
      pitfalls: [
        '“把图片压小一点就行”——论文引用的研究表明分辨率对 LVLM 很重要，直接降分辨率是在用效果换速度。',
        `“推理成本只看参数量”——它同样取决于每层处理多少 token；${T('FLOPs')} 估算里 n 是主角之一。`,
      ],
      takeaways: [
        { icon: '🎯', title: '问题', desc: '图像 token 占了输入序列的大部分位置。' },
        { icon: '🔧', title: '代价', desc: '每多一个 token，每一层的注意力和 FFN 都要多算一份。' },
        { icon: '✨', title: '追问', desc: '这些图像 token 每一层都真的被用到了吗？' },
      ],
    },
    // ================================================================== 2
    {
      kind: 'chapter',
      id: 'chap-2',
      nav: '图像变成序列',
      title: '一张图如何变成一串 token',
      badge: 'inf',
      badgeLabel: '推理 · 必读',
      bridge: `CLIP-ViT 把 336×336 的图切成 14×14 像素的小块，得到 <b>24×24 = 576</b> 个图像 token；它们按行展开，排在${T('系统提示')}之后、用户指令之前，一起送进解码器。解码器使用${T('因果注意力')}：<b>每个位置只能读取排在它前面的位置</b>——这一点在第 4 章至关重要。`,
      analogy: {
        title: '聚光灯逐格扫过幕布画',
        text: '一幅幕布画被分成整齐的方格，聚光灯从左上角开始<b>一行接一行</b>扫过——二维图片就这样被“压平”成一维序列。',
        componentId: 'ana-2',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '点一个图块，找到它在序列里的位置',
          desc: '在图片上点击或拖动任意小块（也可聚焦画布后用方向键），右侧序列会标出它的位置，高亮部分是它能读取的范围：前面的系统提示和已经排过的图块，但<b>看不到后面的问题</b>。',
          componentId: 'patch-sequence',
        },
      ],
      formula: {
        eq: 'eq1',
        lead: '回答是逐个生成的（Eq. 1）：',
        unicode: 'p(ŷ) = ∏<sub>i=1</sub><sup>N</sup> p<sub>M</sub>( ŷ<sub>i</sub> | ŷ<sub>1~i−1</sub> ; d ; t )',
        summary: '每生成一个字，模型都以图像、问题和已经说过的话为条件——所以输出 token 能读到整张图，而图像 token 读不到后面的问题。',
        symbols: [
          { sym: 'ŷ', desc: '模型生成的回答序列' },
          { sym: 'd', desc: '输入图像（经视觉编码器变成图像 token）' },
          { sym: 't', desc: '文本问题 / 用户指令' },
          { sym: 'N', desc: '回答的长度（输出 token 数）' },
          { sym: 'M', desc: '视觉语言大模型本身（Transformer 解码器）' },
        ],
      },
      pitfalls: [
        '“图像 token 就是像素”——它们是视觉编码器的输出、再投影到语言模型空间的向量，每个代表一小块区域的特征。',
        '“token 顺序无所谓”——在因果解码器里，位置决定谁能读到谁：排在图像前面的系统提示读不到图像。',
      ],
      takeaways: [
        { icon: '🧩', title: '切块', desc: '336×336 的图 → 24×24 = 576 个图像 token。' },
        { icon: '🧵', title: '排队', desc: '系统提示 → 图像 → 指令 → 输出，依次排成一条序列。' },
        { icon: '👀', title: '只能向前看', desc: '每个位置只能读取排在它前面的位置。' },
      ],
    },
    // ================================================================== 3
    {
      kind: 'chapter',
      id: 'chap-3',
      nav: '深层不看图',
      title: '关键发现：第 2 层之后很少看图',
      badge: 'inf',
      badgeLabel: '推理 · 核心现象',
      bridge: `作者在 LLaVA-1.5-7B 上随机采样 <b>1000 个</b>图文样本，记录<b>输出 token</b> 在每一层把注意力分给了哪类输入 ${E('fig3')}。前 2 层分配相对均衡；从第 3 层起，图像 token 分到的注意力明显变少。`,
      analogy: {
        title: '聚光灯总停在台口',
        text: '开场时聚光灯在台上四处游走；几轮之后，灯光<b>几乎一直停在台口的同一个位置</b>，满台群演只剩一点余光。',
        componentId: 'ana-3',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '拖动层号，看注意力流向哪里',
          desc: '左侧圆环是<b>注意力分配 λ</b>，中间流带对比“占了多少位置”和“分到多少注意力”，右侧是<b>注意力效率 ε</b>（每个 token 平均分到多少，以图像为 1×，对数刻度）。论文只报告了浅层（第 1–2 层）与深层（第 3–32 层）两组平均值。',
          componentId: 'layer-scrubber',
        },
        {
          kind: 'module',
          id: '3.2',
          title: '注意力图：深层出现“竖直亮线”',
          desc: `切换浅层 / 深层，观察解码过程中的注意力图（<b>示意图</b>，按 Fig. 4 描述的规律合成；论文每一层的真实注意力图见 ${E('sfig7')}）。行是正在生成的输出 token，列是被关注的输入 token；点击一列查看它平均被关注多少。`,
          componentId: 'attention-map',
        },
      ],
      insight: `深层里系统提示拿走约 <b>85%</b> 的注意力，人均效率是图像 token 的 <b>472 倍</b>；图像 token 约占所统计序列的 64%（包含生成的输出 token），只分到约 <b>3%</b> 的注意力 ${E('fig3')}。注意：这是“谁被关注”的统计，不是“信息存在哪里”的测量。`,
      formula: {
        eq: 'eq34',
        lead: '两个统计量（Eq. 3–4）：',
        unicode:
          'λ<sub>img</sub><sup>j</sup> = Σ<sub>i=1</sub><sup>n</sup> α<sub>img</sub><sup>i,j</sup>　　ε<sub>img</sub><sup>j</sup> = Σ<sub>i=1</sub><sup>n</sup> α<sub>img</sub><sup>i,j</sup> ⁄ |img|',
        summary: '把回答里每个输出 token 在第 j 层分给图像的注意力加起来得到 λ；再除以图像 token 的个数，就是“平均每个图像 token 分到多少”的 ε。',
        symbols: [
          { sym: 'λ', desc: '注意力分配：第 j 层里，回答中所有输出 token 分给图像 token 的注意力之和' },
          { sym: 'α', desc: '第 i 个输出 token 在第 j 层分给图像 token 的注意力（四类之和为 1）' },
          { sym: 'ε', desc: '注意力效率：平均每个图像 token 分到的注意力' },
          { sym: '|img|', desc: '图像 token 的数量（LLaVA-1.5 为 576）' },
          { sym: 'n', desc: '回答中输出 token 的数量；最终对所有注意力头与 1000 个样本取平均' },
        ],
      },
      deepDive: {
        title: '这个统计是怎么做的',
        paragraphs: [
          `样本来自四类任务：Flickr30K（描述）、PCA-Bench（具身推理）、A-OKVQA（问答）与 ${T('MMMU')}（多学科推理）。生成每个输出 token 时，按四类输入求和得到 α<sub>sys</sub>、α<sub>img</sub>、α<sub>ins</sub>、α<sub>out</sub>，再累加成 λ、除以 token 数得到 ε；最终对注意力头与样本取平均 ${E('eq34')}。`,
          `两个发现：① 分配与效率都随深度变化——浅层输出 token 主要关注之前的输出，深层主要关注系统提示；② 无论浅层深层，<b>图像 token 的注意力效率都最低</b> ${E('fig3')}。注意力图中，深层系统提示开头出现贯穿解码过程的竖直亮线，图像区域相对稀疏 ${E('fig4')}。`,
        ],
        facts: [
          { value: '1000', label: '采样的图文对' },
          { value: '2 + 30', label: '浅层 / 深层的层数划分' },
          { value: '472×', label: '深层：系统提示 vs 图像的人均注意力' },
        ],
      },
      pitfalls: [
        '“注意力低，说明图像没用”——论文观察的是深层里<b>逐个</b>图像 token 分到的注意力少，并没有证明它们不重要。',
        '“所有模型都测过这组数”——详细的注意力统计只在 LLaVA-1.5-7B 上做过；其他模型的结论来自剪枝实验的结果。',
      ],
      takeaways: [
        { icon: '📉', title: '冷落', desc: '深层里图像 token 的人均注意力最低，只有系统提示的 1/472。' },
        { icon: '🔦', title: '集中', desc: '深层注意力集中在系统提示开头，形成竖直亮线。' },
        { icon: '❓', title: '追问', desc: '这条亮线意味着什么？下一章把观察和解释分开看。' },
      ],
    },
    // ================================================================== 4
    {
      kind: 'chapter',
      id: 'chap-4',
      nav: '锚点：观察与边界',
      title: '锚点假设：观察、解释与边界',
      badge: 'both',
      badgeLabel: '推理 · 机制解释',
      bridge: `第 3 章看到深层注意力集中在系统提示位置。本章把四件事分开：<b>论文观察到了什么</b>、<b>作者怎样解释</b>、<b>因果注意力允许信息往哪流</b>、<b>剪枝实验能支持到哪一步</b>。关键提醒：“被高度关注”不等于“储存了视觉信息”。`,
      analogy: {
        title: '灯光总回到台口的报幕人身上',
        text: '报幕人最先上台、背对舞台，看不到身后的演出；可聚光灯每扫完一轮，总会回到他身上歇一歇。<b>被照得最多，不等于知道得最多。</b>',
        componentId: 'ana-4',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '四步拆开“锚点”假设',
          desc: '用上方按钮或“上一步 / 下一步”切换：① 观察到的注意力分布；② 作者的解释；③ 因果注意力下信息只能向右流动，图像无法流回排在前面的系统提示；④ 剪枝实验的支持范围。画面中不会把“高关注”画成“信息流入”。',
          componentId: 'anchor-flow',
        },
      ],
      formula: {
        eq: 'eq2',
        lead: '注意力在四类输入间分配，总和为 1（Eq. 2）：',
        unicode:
          'α<sub>sys</sub><sup>i,j</sup> + α<sub>img</sub><sup>i,j</sup> + α<sub>ins</sub><sup>i,j</sup> + α<sub>out</sub><sup>i,j</sup> = 1',
        summary: '注意力是“零和”的：深层给系统提示的多了，给图像的自然就少了——但这只描述了“看向哪里”，没有描述“信息存在哪里”。',
        symbols: [
          { sym: 'α', desc: 'softmax 注意力权重按 token 类型求和后的结果' },
          { sym: 'sys', desc: '系统提示（排在图像之前；深层拿走约 85%）' },
          { sym: 'img', desc: '图像 token（深层只剩约 3%）' },
          { sym: 'ins', desc: '用户指令（排在图像之后）' },
          { sym: 'out', desc: '已经生成的输出 token' },
        ],
      },
      deepDive: {
        title: '为什么要把“被关注”和“存了信息”分开',
        paragraphs: [
          `作者的原话是：少数锚点 token 聚合了来自所有输入 token 的信息，深层模型偏好关注它们；锚点不是图像 token，并与 Wang 等人（2023）在 LLM 中发现的信息流规律一致 ${E('sec34')}。这是对统计现象的解释，论文没有逐层追踪锚点里存了什么。`,
          `但竖直亮线出现在系统提示开头，而系统提示排在图像之前。在因果注意力下，这些位置的隐藏状态<b>读不到图像</b>，所以它们不可能储存图像信息；图像信息只能流向排在后面的图像、指令和输出 token。论文没有说明锚点解释与这一顺序如何对应。一种可能是：这些位置更像 StreamingLLM 描述的${T('注意力汇')}——被大量关注，本身内容不多（本页解读）。`,
        ],
        facts: [
          { value: '85% / 3%', label: '深层：系统提示 vs 图像分到的注意力' },
          { value: '100.1', label: '第 2 层后剪 50% 视觉 token 的 Nocaps（Table 7）' },
          { value: '17.5', label: '剪掉系统提示前一半后的 Nocaps（Table 7）' },
        ],
      },
      pitfalls: [
        '“系统提示被高度关注，所以视觉信息存在系统提示里”——因果注意力下系统提示读不到排在后面的图像。',
        '“锚点就是图像里最重要的那几个 token”——论文明确指出锚点不是图像 token。',
      ],
      takeaways: [
        { icon: '👁️', title: '观察', desc: '深层注意力集中在系统提示开头（Fig. 3、4）。' },
        { icon: '💭', title: '解释', desc: '“锚点聚合信息”是作者的假设，未被逐层验证。' },
        { icon: '🧪', title: '证据', desc: '剪枝实验只支持“所测设置下深层不需要一半视觉 token”。' },
      ],
    },
    // ================================================================== 5
    {
      kind: 'chapter',
      id: 'chap-5',
      nav: 'FastV 怎么剪',
      title: 'FastV：在第 K 层剪掉 R% 的图像 token',
      badge: 'both',
      badgeLabel: '推理 · 方法',
      bridge: `FastV 在第 K 层给图像 token 打分排序，丢掉排名最后的 R%，之后的层不再为它们计算注意力与 FFN ${E('sec41', 'fig5')}。它不改任何权重、不需要训练，可直接插入基于 token 的 LVLM。下面先操作，再对照论文描述与官方代码的差别。`,
      analogy: {
        title: '幕布拉上，挡住最暗的一半',
        text: '导演看完前两轮彩排，记下每位群演被照到的程度，<b>拉上半边幕布</b>挡住最少被照到的一半。演出照常，舞台轻快多了。',
        componentId: 'ana-5',
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '拖动剪枝线：保留谁、丢掉谁',
          desc: '下方曲线是 576 个图像 token 的被关注度，从高到低排序（<b>合成示意数据</b>）。拖动橙色剪枝线或下方滑块设置 R，图片同步显示被剪掉的位置；切换“随机丢弃”可对比两种排序。',
          componentId: 'rank-prune',
        },
        {
          kind: 'module',
          id: '5.2',
          title: '层塔：在哪一层剪、剪多少',
          desc: '这是 LLaVA-1.5-13B 的 40 层解码器。点击某一层或拖动滑块设置 K 与 R，读数按 <b>13B · 论文口径复算</b>给出理论 FLOPs，并标明它与论文表格一致、不一致，还是公式外推。',
          componentId: 'layer-gate',
        },
      ],
      panels: ['paper-vs-code'],
      formula: {
        eq: 'sec41',
        lead: '排序函数与两个超参数（§4.1）：',
        unicode: 'φ<sub>attn</sub>(v) = 平均<sub>u</sub> A<sup>(K)</sup>(u → v)　⟹　保留得分最高的 (1 − R%) × N<sub>img</sub> 个图像 token',
        summary: '在第 K 层，看每个图像 token 被关注了多少，按分数从高到低留下排名前 (1−R%) 的视觉 token——即 (1−R%) × N<sub>img</sub> 个，其余在之后的层里不再出现。',
        symbols: [
          { sym: 'φ', desc: '排序准则：论文描述为图像 token v 在第 K 层从其他所有 token 处收到的平均注意力（代码实现见上方“论文 vs 代码”）' },
          { sym: 'A', desc: '第 K 层的注意力权重矩阵（官方代码中层索引为 K−1，即剪枝开始前的最后一层）' },
          { sym: 'K', desc: '剪枝层：前 K 层照常计算，第 K 层之后开始剪枝' },
          { sym: 'R', desc: '剪枝比例：排名最后的 R% 图像 token 在之后各层被移除' },
          { sym: 'N', desc: 'N<sub>img</sub>：剪枝前的视觉 token 数量（LLaVA-1.5 为 576），保留数 = (1−R%) × N<sub>img</sub>，例如 R=50% 时保留 288 个' },
        ],
      },
      deepDive: {
        title: '一次前向里发生了什么',
        paragraphs: [
          `① 前 K 层照常计算所有 token；② 在第 K 层算出每个图像 token 的分数；③ 用 ${T('topk')} 留下分数最高的 (1−R%) × N<sub>img</sub> 个（N<sub>img</sub> 为剪枝前的视觉 token 数）；④ 之后每一层的序列变短，被剪 token 既不参与注意力也不经过 FFN。这是它比稀疏注意力省得更多的原因 ${E('sec42')}。`,
          `“只剪一次”只在<b>一次前向</b>之内成立。原始实现不使用 ${T('KV Cache')}，生成每个新 token 都要对整条序列重跑前向，因此每次前向都会在第 K 层重新排序剪枝；后来加入的 KV Cache 版本只在首次前向剪一次 ${E('readme')}。K=0 时图像 token 在进入语言模型前被随机丢弃——这同时改变了剪枝位置和排序依据。`,
        ],
        facts: [
          { value: '0', label: '需要训练的参数' },
          { value: 'K=2 · R=50%', label: '主实验默认配置' },
          { value: '2 处', label: '注意力 + FFN 同时省掉' },
        ],
      },
      pitfalls: [
        '“FastV 删的是注意力连线”——删的是 token 本身，之后各层的 FFN 也不再为它们计算。',
        '“整个生成过程只剪一次”——原始实现每次前向都会重新剪；只有后来的 KV Cache 版本才在首次前向后固定。',
      ],
      takeaways: [
        { icon: '📊', title: '排序', desc: '第 K 层按注意力打分；代码实际用最后一个 token 的注意力（各头平均）。' },
        { icon: '✂️', title: '剪枝', desc: '丢掉排名最后的 R%，之后的注意力与 FFN 都不再算它们。' },
        { icon: '🔌', title: '即插即用', desc: '不改权重、不需训练。' },
      ],
    },
    // ================================================================== 6
    {
      kind: 'chapter',
      id: 'chap-6',
      nav: '省了多少 FLOPs',
      title: '省了多少：Eq. 5 与 K/R 权衡',
      badge: 'both',
      badgeLabel: '推理 · 代价分析',
      bridge: `K 越小、R 越大，理论上省得越多；但剪得太早太狠，细节任务会受损。本章先用 Eq. 5 在 K–R 平面上探索（默认采用能复现 Table 1 的“13B · 论文口径复算”，论文自己的热力图见 ${E('sfig8')}），再看 OCR-VQA 上的实测表现 ${E('fig6')}，最后把本页复算与论文数字逐项对账。`,
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: 'K–R 平面：读出理论 FLOPs 降幅',
          desc: '桌面上可直接拖动准星，任何设备都可用下方两个滑块设置 K、R。切换口径可以看到：只计视觉 token 时 K=2、R=50% 的降幅约 48.1%，论文口径约 45%——差别来自是否计入不剪的文字 token。',
          componentId: 'kr-heatmap',
        },
        {
          kind: 'module',
          id: '6.2',
          title: 'OCR-VQA：剪枝层越深，越“剪不坏”',
          desc: `切换 K，看 LLaVA-1.5-13B 在 OCR-VQA 上的 ${T('Rouge-L')} 如何随 R 变化（Fig. 6 的<b>读图近似值</b>），右侧是同一 K 下各 R 的理论 FLOPs 降幅（论文口径复算）。`,
          componentId: 'ocr-curves',
        },
      ],
      insight: `Fig. 6 的结论：<b>K 小时，降低 R 能明显挽回性能；K 大时，R 对性能影响很小</b> ${E('fig6')}。在主实验中，K=2、R=50% 在三个模型上都省下约 45% 理论 FLOPs，平均分基本不变 ${E('tab1')}。`,
      panels: ['flops-audit'],
      formula: {
        eq: 'eq5',
        lead: '整个模型（T 层）的理论 FLOPs 降幅（Eq. 5）：',
        unicode: '1 − [ K·f(n) + (T−K)·f(n̂) ] ⁄ [ T·f(n) ]　，　n̂ = (1 − R%)·n',
        summary: '前 K 层按原长度 n 计算，后 T−K 层按剪后长度 n̂ 计算；把两段加起来，与“每层都按 n 计算”相比，省下的比例就是降幅。',
        symbols: [
          { sym: 'f', desc: '单层计算量 f(n) = 4nd² + 2n²d + 2ndm（注意力 + FFN）' },
          { sym: 'K', desc: '剪枝层：前 K 层仍按 n 个 token 计算' },
          { sym: 'T', desc: '解码器总层数（LLaVA-1.5-7B 为 32，13B 为 40）' },
          { sym: 'n̂', desc: '剪枝后的序列长度；论文口径复算中 n̂ = 36 + (1−R%)×576（文字不剪）' },
          { sym: 'R', desc: '剪枝比例' },
        ],
      },
      deepDive: {
        title: '同一个公式，为什么有 48.1% 和 45% 两个数',
        paragraphs: [
          `论文 Eq. 5 中的 n 写的是 token 数 ${E('eq5')}。如果只把 576 个视觉 token 代入，K=2、R=50% 得到约 48.1%；如果像论文表格那样把不剪的文字 token 也算进序列，降幅会小一些。本页发现：取 d=5120、m=13824、T=40、视觉 576 加文字 36，就能复现 Table 1 的全部 13B 数值——<b>36 只是拟合表格的长度假设</b>。`,
          `Table 1 的 “B” 数值在数值上等于“全模型公式 ÷ 层数”的归一化理论量，不是一次完整前向的实测总运算量；理论 FLOPs 也不能直接换算成速度，真实延迟见第 9 章 ${E('tab4')}。`,
        ],
        facts: [
          { value: '154.6B', label: '13B 基线（Table 1，本页复算一致）' },
          { value: '84.6B', label: 'K=2、R=50%（Table 1，本页复算一致）' },
          { value: '78.9 / 80.9', label: 'K=0、R=50%：Table 5 / 本页复算，原因未知' },
        ],
      },
      pitfalls: [
        '“理论 FLOPs 降一半，速度就快一倍”——实际延迟取决于实现、硬件与是否使用 KV Cache。',
        '“R 越小越安全，所以尽量小”——R 太小省不了多少；Fig. 6 显示 K 较大时 R 很大也几乎不掉分。',
      ],
      takeaways: [
        { icon: '⚖️', title: '权衡', desc: 'K 越小、R 越大越省，但过早过狠会伤细节任务。' },
        { icon: '🧮', title: '口径', desc: '论文口径（含不剪的文字）≈45%；只计视觉 ≈48.1%。' },
        { icon: '🛡️', title: '稳妥', desc: 'K 越大，性能对 R 越不敏感（Fig. 6，OCR-VQA）。' },
      ],
    },
    // ================================================================== 7
    {
      kind: 'chapter',
      id: 'chap-7',
      nav: '消融：剪什么',
      title: '消融：剪什么、怎么剪、为什么不重训',
      badge: 'trn',
      badgeLabel: '进阶 · 消融实验',
      bridge: `同样是“少用 token”，做法很多：随机丢、剪文字、照搬 StreamingLLM，或者训练时就少用一半图像 token。作者按原流程重训了 LLaVA-1.5-7B，在其上做了这组${T('消融实验')} ${E('tab7', 'sec43')}。`,
      analogy: {
        title: '幕布错拉到了报幕人身上',
        text: '如果导演看走了眼，把幕布拉到<b>台口的报幕人</b>身上，哪怕只挡住一半，整场演出也会乱套。',
        componentId: 'ana-7',
      },
      modules: [
        {
          kind: 'module',
          id: '7.1',
          title: '选一种剪法，与完整模型同场对比',
          desc: '选择一种策略：左侧显示被移除的 token 类型，右侧四项任务的得分条与完整模型（虚线）同时增长。红色 ✕ 表示模型无法按指令给出有效答案（论文记为 Failed）。也可以直接点击表格中的某一行。',
          componentId: 'prune-what',
        },
      ],
      deepDive: {
        title: '每组对照能说明到哪一步',
        paragraphs: [
          `<b>剪图像 vs 训练时池化（b vs a）：</b>在 CLIP 后加步长 2 的平均池化、训练时就只用一半图像 token，四项均低于 FastV。<b>注意力排序 vs 随机（b vs c）：</b>差值为 +0.6、+1.7、+0.2、+0.4；随机只运行一次、没有方差或${T('标准误')}，不能排除这些小差异来自噪声。`,
          `<b>剪文字（d、f）：</b>换成剪系统提示或指令，即使只剪很少也明显掉分。<b>开头位置（e）与 StreamingLLM（g）：</b>只剪系统提示前一半就让模型失效；照搬 StreamingLLM 的稀疏注意力同样失效。另外，K=0 的损失（第 6 章）同时改变了剪枝位置与排序依据，<b>不能单独证明“必须在语言模型内部剪”</b>。`,
        ],
        facts: [
          { value: '+0.6 · +1.7 · +0.2 · +0.4', label: '注意力排序 − 随机（单次运行）' },
          { value: '98.5 / 100.1', label: '训练时池化 vs FastV 的 Nocaps' },
          { value: '13.2', label: '照搬 StreamingLLM 的 Nocaps' },
        ],
      },
      pitfalls: [
        '“注意力排序明显好于随机”——差值小，且随机只跑了一次，论文没有给出能判断显著性的方差。',
        '“StreamingLLM 失败说明开头 token 不重要”——恰恰相反，e 组说明开头位置很关键；失败更可能来自局部窗口让大量图像 token 无法被关注（本页解读）。',
      ],
      takeaways: [
        { icon: '🖼️', title: '剪图像', desc: '在所测设置下，只有图像 token 经得起剪。' },
        { icon: '🎲', title: '排序', desc: '注意力排序略好于随机，但差距可能在噪声范围内。' },
        { icon: '🏋️', title: '不必重训', desc: '这组对比里，推理时剪优于训练时池化。' },
      ],
    },
    // ================================================================== 8
    {
      kind: 'chapter',
      id: 'chap-8',
      nav: '视频与更多模型',
      title: '视频与更多模型：分数要怎么读',
      badge: 'both',
      badgeLabel: '推理 · 泛化',
      bridge: `视频把多帧塞进同一条序列，冗余可能更多；换成不同架构的模型、不同类型的基准，FastV 的表现又如何 ${E('tab2', 'tab3', 'tab5', 'tab6')}？先看结果，再看每个分数的评测协议——<b>小幅上升不等于能力提升</b>。`,
      analogy: {
        title: '胶片一格一格走过放映机',
        text: '相邻的画格几乎一模一样，<b>真正变化的只是很小一部分</b>。如果每一格都从头细看，放映员会累坏的。',
        componentId: 'ana-9',
      },
      modules: [
        {
          kind: 'module',
          id: '8.1',
          title: '拖动帧数：视频让图像 token 成倍增加',
          desc: '每帧 256 个 token（Video-LLaVA 8 帧共 2048 个 ÷ 8）。胶片上周期性地演示第 2 层后剪掉每帧一半 token（保留位置为示意），圆环是按公式估算的理论 FLOPs 降幅（7B 教学口径）。',
          componentId: 'video-frames',
        },
        {
          kind: 'module',
          id: '8.2',
          title: '五组实验，一键切换',
          desc: `视频问答（Table 6）、更多综合基准与 ${T('MME')} 细项（Table 2、3）、${T('Q-Former')} 结构的 InstructBLIP（Table 2）、具身决策 PCA-Bench（Table 5）。柱高按完整模型归一化，便于跨量纲比较。`,
          componentId: 'bench-explorer',
        },
      ],
      insight: `InstructBLIP 是个值得注意的例子：Q-Former 已先把图像压缩成少量 token，K=2 时掉分明显，把 K 调到 5 后差距基本消失 ${E('tab2')}。<b>输入越冗余，剪枝空间越大；输入越精简，越要剪得保守。</b>`,
      panels: ['eval-protocol'],
      pitfalls: [
        '“FastV 能提升模型能力”——MMMU 36.4→38.1、MME 小幅上升、视频 0.48→0.49 都是单次运行的小变化，论文的主张是“基本不损失性能”。',
        '“所有 LVLM 都能用同一组 K、R”——InstructBLIP 需要更大的 K。',
      ],
      takeaways: [
        { icon: '🎞️', title: '视频', desc: '2048 个视频 token 剪一半，平均准确率 0.49（完整 0.48）。' },
        { icon: '🧪', title: '跨基准', desc: '综合基准、MME、PCA-Bench、OCR-VQA 上基本保持。' },
        { icon: '📏', title: '读分数', desc: '先看评测集规模与协议，再看差值。' },
      ],
    },
    // ================================================================== 9
    {
      kind: 'chapter',
      id: 'chap-9',
      nav: '真实速度',
      title: '真实速度：延迟、显存与性能曲线',
      badge: 'both',
      badgeLabel: '结果 · 实测',
      bridge: `理论 FLOPs 之外，论文还在单张 A40 上测了真实延迟 ${E('tab4')}。注意这张表里的 FastV 是 <b>K=0、R=50%（随机剪枝）</b>，与主实验默认的 K=2 不同。之后把 Table 1 的全部配置摊开在一张${T('帕累托前沿', '性能–效率')}图上 ${E('fig1', 'tab1')}。`,
      modules: [
        {
          kind: 'module',
          id: '9.1',
          title: '真实延迟赛跑：13B + FastV 对 7B',
          desc: '点击「开跑」，四个配置按 Table 4 的单样本延迟同时出发（A-OKVQA 只需输出一个选项字母）。赛跑速度只由实测延迟决定，与理论 FLOPs 无关。',
          componentId: 'latency-race',
        },
        {
          kind: 'module',
          id: '9.2',
          title: '性能–效率前沿：点开每一个配置',
          desc: '每个点是 Table 1 的一个 (K, R) 配置：横轴是论文报告的理论 FLOPs（B，按层平均的归一化量），纵轴是 Nocaps、Flickr30k、A-OKVQA、MMMU 四项平均分。切换模型，点击任意点（或用方向键）查看四项分数。',
          componentId: 'pareto',
        },
      ],
      insight: `在 K=2、R=50% 时，三个模型的四项平均分只变化 0～0.5 分（7B 69.8→69.7，13B 73.6→73.6，Qwen-VL 69.7→69.2）${E('tab1')}。13B 在 K=2、R=75% 时理论 FLOPs（50.2B）低于 7B 完整模型（99.3B），平均分 73.0 仍高于 69.8。`,
      panels: ['impl-modes'],
      pitfalls: [
        '“13B + FastV 全面胜过 7B”——速度基本追平、准确率更高，但显存 30G 对 19G，仍多 11G。',
        '“README 的首 token 延迟和 Table 4 可以直接比”——硬件（A100 vs A40）、配置（K=2 vs K=0）与指标（首 token vs 单样本）都不同。',
      ],
      takeaways: [
        { icon: '🏁', title: '速度', desc: '13B + FastV（K=0、R=50%）单样本 0.341 s，与原版 7B（0.344 s）基本追平。' },
        { icon: '💾', title: '显存', desc: '13B + FastV 30G，比原版 7B 的 19G 多 11G。' },
        { icon: '📐', title: '可调', desc: '性能–效率曲线可按需求调节 K 与 R。' },
      ],
    },
    // ================================================================== 10
    {
      kind: 'chapter',
      id: 'chap-10',
      nav: '结论的边界',
      title: '坐标与边界：FastV 在哪里，能说明什么',
      badge: 'both',
      badgeLabel: '总结 · 实践',
      bridge: `最后，把 FastV 放回相关工作的图景中 ${E('sec2')}，给出按论文结果整理的使用建议，再把“论文证明了什么 / 作者如何解释 / 仍然未知”明确分开。`,
      analogy: {
        title: '幕布合拢，全剧终',
        text: '演出结束，两侧幕布缓缓合拢。<b>一场戏不在于台上站了多少人，而在于观众记住了什么</b>——对模型也一样，但哪些人可以不上台，仍要看具体的戏。',
        componentId: 'ana-10',
      },
      modules: [
        {
          kind: 'module',
          id: '10.1',
          title: '方法地图：各类加速方法动的是哪一段',
          desc: '切换不同类别的加速方法（按论文 §2 归类），图中高亮它作用在流程的哪一段：视觉编码器内部、进入语言模型之前、注意力实现，还是语言模型内部的 token 本身。也可以点击表格的任意一行。',
          componentId: 'method-map',
        },
        {
          kind: 'module',
          id: '10.2',
          title: '配置顾问：你的任务该怎么设 K、R',
          desc: '选择任务类型与优化目标，查看依据论文报告结果整理的推荐配置。计算量一栏是论文报告的<b>理论 FLOPs</b>，不是实测运算量；建议本身属于解读。',
          componentId: 'config-advisor',
        },
      ],
      panels: ['verdict'],
      deepDive: {
        title: '论文的贡献与延伸方向',
        paragraphs: [
          `论文把贡献归纳为三点：分析主流 LVLM 中视觉注意力低效的现象；提出即插即用、无需训练的 FastV；在多种任务与模型上验证，并做消融 ${E('intro')}。论文称 FastV 是首个面向 LVLM 的视觉 token 剪枝方法（论文自述）。`,
          `引言还报告了一个延伸方向：在相同数量的图像 token 下，配合 FastV 的模型可以处理更高分辨率的图像并取得更好表现 ${E('intro')}。这一点的实验细节较少，阅读时宜把它当作方向而非结论。`,
        ],
      },
      pitfalls: [
        '“FastV 与 FlashAttention 只能二选一”——两者作用在不同层面，原则上可以叠加（解读，论文未做组合实验）。',
        '“注意力低的 token 一定可以剪”——论文只在所测设置下展示剪枝后仍保持表现，没有证明这是普遍规律。',
      ],
      takeaways: [
        { icon: '🗺️', title: '定位', desc: '在语言模型内部、按其自身注意力剪视觉 token，无需训练。' },
        { icon: '🚧', title: '边界', desc: '理论 FLOPs ≠ 实测加速；K=0、已压缩视觉 token 的模型要谨慎。' },
        { icon: '🎬', title: '一句话', desc: '在论文测试的模型与基准上，第 2 层后剪掉约一半视觉 token 基本不掉分——这是有条件的经验结论，不是普遍规律。' },
      ],
    },
  ],
};
