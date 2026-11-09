// 各章正文（本节问题、类比、洞察、公式、符号与推导、核对、关键数字、要点、误区、深入阅读）。
// show 指定每章显示哪些栏目：同一结论只在最清楚的一处出现，重复的不显示。
// 模块标题与“出处与口径”在 src/data/tutorial.ts（同时用于 outlines.json）。
import type { ContentTag } from '../modules/sv-kit';

export interface FormulaText {
  label: string;
  /** 公式 HTML；<i data-s="键">…</i> 会变成可悬停 / 聚焦 / 点按的符号 */
  html: string;
  symbols: { key: string; desc: string }[];
  plain: string;
}
export interface DeepBlock {
  title: string;
  paras?: string[];
  list?: string[];
  table?: { head: string[]; rows: string[][]; caption?: string };
}
export interface ChapterText {
  num: number;
  id: string;
  title: string;
  badge: string;
  intro: string;
  analogy?: { title: string; story: string; boundary: string };
  modules: { id: string; componentId: string; desc: string }[];
  insight?: string;
  formulas?: FormulaText[];
  derive?: string[];
  check?: string;
  facts?: { value: string; label: string; tag: ContentTag }[];
  takeaways?: { title: string; desc: string }[];
  pitfalls?: string[];
  deep?: DeepBlock[];
  show: { insight: boolean; formulas: boolean; derive: boolean; check: boolean; facts: boolean; takeaways: boolean; pitfalls: boolean; deep: boolean };
}

const ALL = { insight: true, formulas: true, derive: true, check: true, facts: true, takeaways: true, pitfalls: true, deep: true };

export const CHAPTERS: ChapterText[] = [
  {
    num: 1,
    id: 'chap-1',
    title: '一张图的账单：576 个视觉 token 占了多少计算',
    badge: '问题背景',
    intro:
      'LLaVA-1.5 把一张 336×336 的图切成 24×24 个小块，变成 576 个[[t:vtok|视觉 token]]，排在问题前面一起送进 32 层解码器；问题本身通常只有几十个 token [[ev:related]]。先把账算清楚：每一层的计算里，有多少是视觉 token 带来的？',
    modules: [
      { id: '1.1', componentId: 'sv-bill', desc: '播放或拖动进度：一张图被切块、排进输入序列，再在 32 层里逐层计费。切换分辨率、拖动问题长度，看视觉 token 占输入的比例和占每层计算的比例怎样变化。' },
    ],
    insight:
      '每层计算里，与 token 数成正比的部分（4 个投影矩阵和 FFN）占了绝大部分，所以视觉 token 占输入的比例，几乎就是它占每层计算的比例。想省计算，最直接的办法是让后面的层少处理一些视觉 token——这正是 SparseVLM 要做的。',
    formulas: [
      {
        label: '每层计算量（代码计数式）',
        html: '<i data-s="F">F</i>(<i data-s="n">n</i>) =　4<i data-s="n">n</i><i data-s="d">d</i><sup>2</sup> + 2<i data-s="n">n</i><sup>2</sup><i data-s="d">d</i> + 3<i data-s="n">n</i><i data-s="d">d</i><i data-s="m">m</i>',
        symbols: [
          { key: 'F', desc: '一个解码层在预填充时的乘加次数（代码第 221 行的计数式，乘加计 1 次）' },
          { key: 'n', desc: '进入这一层的 token 总数：系统提示 + 视觉 token + 问题与模板' },
          { key: 'd', desc: '隐藏维度，LLaVA-1.5-7B 为 4096' },
          { key: 'm', desc: 'FFN 中间维度，LLaMA / Vicuna-7B 为 11008' },
        ],
        plain: '三项依次是 Q、K、V、O 四个投影（4nd²）、注意力分数与加权求和（2n²d）、SwiGLU 的三个矩阵（3ndm）。第一、三项与 n 成正比，第二项与 n² 成正比。',
      },
    ],
    derive: [
      '论文 Eq. (11) 用的是“6ND² + 2N²D”，把 FFN 中间维当成 D [[ev:eq11]]；代码第 221 行用 4nd² + 2n²d + 3ndm [[ev:cFlops]]。两者口径不同，本页统一按代码口径复算，见 §9。',
    ],
    check:
      '576 = (336 / 14)²：CLIP ViT-L/14 在 336 分辨率下每边 24 块；论文说 672×672 的图得到 2304 个 token = (672 / 14)² [[ev:intro]]，与这个算法一致。原模型 4.62 TFLOPs [[ev:tab1]] 能用代码计数式复算出来，前提是假设图像之外还有约 118 个 token（本页反推，论文没有报告文本长度）[[tag:extrap]]。',
    facts: [
      { value: '576', label: '336×336 图的视觉 token 数（24 × 24）', tag: 'paper' },
      { value: '约 83%', label: '视觉 token 占输入的比例（按图像之外 118 个 token 估算）', tag: 'extrap' },
      { value: '4.62 T', label: 'LLaVA-1.5 原模型的预填充 FLOPs（表 1）', tag: 'paper' },
    ],
    pitfalls: [
      'FLOPs 占比不等于时间占比：实测延迟还受显存读写、算子调度和额外开销影响，§9 会把两者分开看。',
      '“视觉 token 多”不代表“视觉信息多”：论文引用 Marr 的观点，认为图像信息比文字更稀疏，这是动机，不是本文的实验结论。',
    ],
    show: { ...ALL, takeaways: false, deep: false },
  },
  {
    num: 2,
    id: 'chap-2',
    title: '旧思路的短板：剪 token 时没有看问题',
    badge: '动机',
    intro:
      '剪视觉 token 已经有不少做法：[[t:tome|ToMe]] 把相似的 token 合并，VoCo-LLaMA 把图像压成少量 token，[[t:fastv|FastV]] 在第 2 层后按最后一个位置的注意力删掉一部分。作者认为它们的共同短板是没有用好问题：同一张图，问牌子上的字、问几辆车、问屋顶颜色，该留的图块并不一样 [[ev:fig1]]。',
    modules: [
      { id: '2.1', componentId: 'sv-agnostic', desc: '选一个问题，再在两种挑法之间切换：看保留下来的图块（实线框）能不能覆盖回答这个问题需要的区域（虚线框）。拖动保留比例，看覆盖率怎样变化。' },
    ],
    insight:
      '“不看问题”的挑法只能按图像自身的显著性或相似度保留，换一个问题，留下的还是同一批图块；问题关心的区域一旦不显著（比如角落里的小字），就会被删掉。SparseVLM 的出发点是让问题参与打分。',
    check:
      '图 1 只给了定性示意，没有量化“覆盖了多少相关区域” [[ev:fig1]]。FastV 用最后一个位置（排在问题之后）的注意力打分，问题会间接影响它，所以严格说 FastV 并非完全不看问题；论文图 1 举的“不看问题”的例子是 VoCo-LLaMA。本模块的场景和覆盖率都是教学示意 [[tag:demo]]。',
    pitfalls: [
      '“看问题”不是免费的：要先算出问题与图像的相关度，SparseVLM 复用解码层已有的注意力，额外开销见附录 C [[ev:appC]]。',
      '本章的覆盖率是示意场景里的读数，不代表真实模型的注意力分布。',
    ],
    deep: [
      {
        title: '论文把现有方法分成两类',
        list: [
          '改视觉编码器或投影层，产出更紧凑的图像表示（LLaMA-VID、DeCo 等），通常需要训练。',
          '在 LLM 解码阶段稀疏化视觉 token（VoCo-LLaMA、FastV、VideoLLM-MoD 等），作者认为它们缺少来自文本 token 的引导。',
        ],
      },
    ],
    show: { ...ALL, formulas: false, derive: false, facts: false, takeaways: false },
  },
  {
    num: 3,
    id: 'chap-3',
    title: '方法①：挑出“评分员”——不是每个词都该参与打分',
    badge: '方法',
    intro:
      '既然要让问题来给图块打分，第一步是决定“谁来打分”。问题里有很多与图像无关的词（介词、代词、模板里的“ASSISTANT:”），让它们投票只会添乱 [[ev:fig3]]。SparseVLM 在进入解码层之前先算每个文本 token 与图像的相关度，高于平均值的才成为[[t:rater|评分员]] [[ev:eq56]]。',
    analogy: {
      title: '只请懂行的评委打分',
      story: '一场摄影展要从 576 件作品里挑出一部分进下一轮。观众提的问题是“哪张拍了蓝色路牌？”——请“蓝色”“路牌”这样的评委来投票，挑得准；把“哪张”“了”也请来投票，票数就被稀释了。',
      boundary: '作品 = 视觉 token，评委 = 评分员。真实模型里评分员的“投票”是注意力权重，而且同一组评分员要在第 2、6、15 层各投一次；“懂行”由嵌入向量的相关度决定，不是人为指定。',
    },
    modules: [
      { id: '3.1', componentId: 'sv-raters', desc: '换一个问题，看每个词的相关度 r 和均值线：超过均值的词成为评分员。再切换打分来源（全部 token / 全部文本 / 评分员），对照图 5 的实测结果。' },
    ],
    formulas: [
      {
        label: 'Eq. (5)(6) 评分员选择',
        html: '<i data-s="r">r</i> =　<span class="frac">1 / <i data-s="Lv">L<sub>v</sub></i></span> · Σ<sub><i data-s="j">j</i></sub> Softmax(<i data-s="Hv">H<sub>v</sub></i> <i data-s="Hq">H<sub>q</sub></i><sup>T</sup>)<sub><i data-s="j">j</i></sub>　　<i data-s="s">s</i> = { <i>i</i> | <i data-s="r">r</i><sub><i>i</i></sub> ≥ <i data-s="mr">m</i> }',
        symbols: [
          { key: 'r', desc: '长度为 Lt 的向量：每个文本 token 与全部视觉 token 的平均相关度' },
          { key: 'Lv', desc: '视觉 token 数（LLaVA-1.5 为 576）' },
          { key: 'j', desc: '遍历视觉 token 的下标' },
          { key: 'Hv', desc: '视觉嵌入 token（投影层输出），Lv × D' },
          { key: 'Hq', desc: '文本嵌入 token，Lt × D' },
          { key: 's', desc: '评分员的下标集合' },
          { key: 'mr', desc: '阈值 m = mean(r)：相关度的平均值' },
        ],
        plain: '每个视觉 token 对全部文本 token 做一次 Softmax（看它更像哪个词），再对视觉 token 求平均，得到每个词“被图像需要”的程度；高于平均值的词当评分员。只在进入解码层之前算一次。',
      },
    ],
    check:
      '与代码对照 [[ev:cRaters]]：① 代码用的是**进入第 0 层之前**的嵌入，与 Eq. (6) 的 Hv、Hq 一致；② Softmax 沿文本维度（`softmax(2)`），再对视觉维度平均（`mean(1)`）；③ 代码取 `> 均值`，论文写 `≥ m`，只差一个等号；④ 代码里的候选是图像之后的**全部** token，包括问题和“ASSISTANT:”等模板 token，不只是问题。图 5 的数值是从柱状图标签读出的，其中 TextVQA“全部文本”一栏读作 53.0 [[ev:fig5]]。',
    facts: [
      { value: '+0.8', label: 'TextVQA：评分员 53.4 vs 全部 token 52.6（64 档，图 5）', tag: 'paper' },
      { value: '+2.7', label: 'POPE：评分员 77.5 vs 全部文本 74.8（64 档，图 5）', tag: 'paper' },
      { value: '1 次', label: '评分员在进入解码层前选一次，三个剪枝层共用', tag: 'code' },
    ],
    pitfalls: [
      '评分员不是逐层重选的：选择只在第 0 层之前做一次，之后第 2、6、15 层都用同一组位置。',
      '图 5 只有 64 档、两个基准，论文仅报告一组汇总结果，未交代重复运行次数和方差；POPE 上“全部 token”比“评分员”低 11.4 个点，但现有材料无法说明在 192 档是否同样明显。',
    ],
    show: { ...ALL, takeaways: false, deep: false },
  },
  {
    num: 4,
    id: 'chap-4',
    title: '方法②：给视觉 token 打分——复用解码层里的注意力',
    badge: '方法',
    intro:
      '评分员选好后，在剪枝层里取出“评分员看各个视觉 token”的那块[[t:attn|注意力]]，组成[[t:pmat|打分矩阵 P]]，对评分员求平均就得到每个视觉 token 的分数 [[ev:eq23]]。分数低的删掉。问题是：现代实现普遍用 [[t:flash|FlashAttention]]，它根本不把注意力矩阵存下来。',
    modules: [
      { id: '4.1', componentId: 'sv-score', desc: '播放或拖动进度：注意力矩阵里只取评分员行 × 视觉列 → 按列平均成每个图块的分数 → 排序 → 保留前 k 个。换一个问题，或拖动 k，看保留的图块怎样变化。' },
      { id: '4.2', componentId: 'sv-flashv', desc: '在两种读法之间切换：Eq. (3) 需要的是哪些格子，附录 B 的特制 V 矩阵按字面加起来的又是哪些格子；灰色格子被因果掩码挡住，恒为 0。' },
    ],
    insight:
      '打分本身几乎不花钱：注意力在每层都要算，SparseVLM 只是“顺手”读一块。真正的麻烦在工程上——FlashAttention 不暴露注意力矩阵，所以论文在附录 B 提了一个“双 FlashAttention”技巧，而固定提交的代码选择在三个剪枝层显式算一次完整矩阵。',
    formulas: [
      {
        label: 'Eq. (2)(3) 打分',
        html: '<i data-s="P">P</i> =　<i data-s="A">A</i><sub><i>i</i>,<i>j</i></sub>, (<i>i</i>, <i>j</i>) ∈ {<i data-s="L">𝓛</i>, <i data-s="I">𝓘</i>}　　<i data-s="p"><span class="up">p̃</span></i> =　<span class="frac">1 / <i data-s="Lt">L<sub>t</sub></i></span> · Σ<sub><i>i</i></sub> <i data-s="P">P</i><sub><i>i</i></sub>',
        symbols: [
          { key: 'P', desc: '打分矩阵：行是文本（代码里只取评分员），列是视觉 token' },
          { key: 'A', desc: '该层的注意力矩阵（Softmax 之后），代码先对多个头取平均' },
          { key: 'L', desc: '语言指令 token 的集合（query 一侧）' },
          { key: 'I', desc: '图像 token 的集合（key 一侧）' },
          { key: 'p', desc: '每个视觉 token 的分数，越大越重要' },
          { key: 'Lt', desc: '参与打分的文本 token 数（代码里是评分员个数）' },
        ],
        plain: '问题（评分员）作为 query、图像作为 key：在因果注意力里问题排在图像之后，所以“问题看图”这一块是有值的。对评分员求平均后排序，保留分数最高的若干个。',
      },
    ],
    check:
      '与代码对照 [[ev:cScore]]：注意力先对 32 个头取平均，再取评分员行、视觉列，对评分员平均，最后 `topk` 取配额个数，与 Eq. (2)(3) 一致。FlashAttention：代码给 32 层都挂上 FlashAttention2 [[ev:cBuilder]]，但在剪枝层另外**显式算完整的 softmax(QKᵀ/√d)**（L × L）来取 P [[ev:cLogits]]，没有用附录 B 的特制 V 技巧 [[ev:appB]]。按附录 B 字面推导（V 的评分员行为 1/n，O = P·V），得到的是“每个位置对评分员的平均注意力”，方向与 Eq. (3) 相反；视觉 token 排在评分员之前，按字面它们这一段恒为 0。本页推断附录省略了转置或其他细节，原因未知 [[tag:extrap]]。',
    pitfalls: [
      '“兼容 FlashAttention”在固定代码里的含义是：普通层用 FlashAttention2，剪枝层额外再算一遍完整注意力，而不是完全不需要注意力矩阵。',
      '分数来自评分员“看”图块的注意力；注意力高不等于对答案贡献大，这是这类方法共同的假设。',
    ],
    show: { ...ALL, facts: false, takeaways: false, deep: false },
  },
  {
    num: 5,
    id: 'chap-5',
    title: '方法③：每层剪多少——论文的秩策略与代码的固定配额',
    badge: '方法 · 核对',
    intro:
      '打完分还要决定删几个。论文 Eq. (7) 说：用打分矩阵的[[t:rank|秩]]衡量冗余，删掉 N = λ·(Lv − rank(P)) 个，N = 0 时这一层不剪 [[ev:eq7]]。可是固定提交的图像版代码里找不到求秩的代码——它在第 2、6、15 层按写死的配额取[[t:topk|前 k 个]] [[ev:cTopk]]。',
    modules: [
      { id: '5.1', componentId: 'sv-rank', desc: '拖动评分员个数、图块的重复程度和 λ：读数显示 rank(P)、Eq. (7) 要删的 N 和剩下的个数。再切到“图像版代码”与“视频分支”，看实际怎样决定保留数。' },
    ],
    insight:
      'P 只有“评分员个数”那么多行，所以 rank(P) 受到评分员数量的上界限制。它是否充分反映视觉冗余，还需要用真实注意力矩阵做进一步分析；λ 控制删除规模，应结合目标预算选择。固定提交的图像代码使用配额表，没有实现这套秩策略。',
    formulas: [
      {
        label: 'Eq. (7) 删除个数',
        html: '<i data-s="N">N</i> =　<i data-s="lam">λ</i> · (<i data-s="Lv">L<sub>v</sub></i> − rank(<i data-s="P">P</i>))　　rank(<i data-s="P">P</i>) ≤ min(<i data-s="Lt">L<sub>t</sub></i>, <i data-s="Lv">L<sub>v</sub></i>)',
        symbols: [
          { key: 'N', desc: '这一层要删除的视觉 token 数；为 0 时跳过该层' },
          { key: 'lam', desc: '缩放系数 λ，论文没有给出取值' },
          { key: 'Lv', desc: '这一层剩余的视觉 token 数' },
          { key: 'P', desc: '打分矩阵（评分员 × 视觉 token）' },
          { key: 'Lt', desc: 'P 的行数，即评分员个数' },
        ],
        plain: '第二个式子（秩的上界）是线性代数的基本事实：一个 Lt × Lv 矩阵的秩不超过它的行数和列数。',
      },
    ],
    check:
      '固定提交 `734d900` 的图像版代码：仓库内没有 `matrix_rank` / SVD 代码；`score.py` 写死三档配额 192:[300,200,110]、128:[303,110,36]、64:[66,30,17]，由 `--retained_tokens` 选择 [[ev:cTopk]] [[ev:cLoc]]。`video` 分支 `f05b898` 才用 `torch.linalg.matrix_rank(P)`，保留 rank(P) 个，相当于 λ = 1，并且只在第 1 层剪一次 [[ev:vRank]] [[ev:vLoc]]。静态阅读发现该分支调用这个函数时少传一个参数（`layer_idx`），按字面运行会报 TypeError；本页没有运行验证 [[ev:vCall]]。论文没有给 λ 的取值，也没有说明表 1 用的是哪一种策略。',
    facts: [
      { value: '[2, 6, 15]', label: '图像版代码的剪枝层（0 起计）', tag: 'code' },
      { value: '≤ Lt', label: 'rank(P) 的上界：评分员个数', tag: 'extrap' },
      { value: '第 1 层', label: '视频分支只剪这一层，保留 rank(P) 个', tag: 'code' },
    ],
    pitfalls: [
      '“自适应决定每层剪多少”只在论文和视频分支里成立；复现表 1 的图像代码用的是固定配额，三档保留数由人设定。',
      'rank 的数值计算依赖阈值：`matrix_rank` 默认按奇异值的相对阈值判断，P 的数值精度（fp16 / fp32）会影响结果；代码先转成 float。',
    ],
    show: { ...ALL, takeaways: false, deep: false },
  },
  {
    num: 6,
    id: 'chap-6',
    title: '方法④：回收被剪的 token——密度峰聚类后合成几个新 token',
    badge: '方法',
    intro:
      '直接删掉的 token 里仍有一部分分数不低。SparseVLM 把被删 token 中分数最高的一批放进回收池，用 kNN [[t:dpc|密度峰聚类]]分组，每组合成 1 个新 token，插回保留的视觉 token 之后 [[ev:recycle]]。',
    modules: [
      { id: '6.1', componentId: 'sv-recycle', desc: '逐步播放（可选慢 / 中 / 快，也可以点阶段按钮）：被删池 → 取分数最高的 30% → 算密度 ρ → 算距离 δ → 选中心 → 归簇 → 合并。最后一步可以在“平均（代码）”和“求和（Eq. 10）”之间切换。' },
      { id: '6.2', componentId: 'sv-tr', desc: '先猜回收在哪个档位帮助最大，再切换 GQA / POPE，对照表 4 的实测值。' },
    ],
    insight:
      '回收的代价很小：192 档在第 2 层删掉 276 个，只回收 83 个、聚成 9 个新 token。保留数越少，被删的越多，回收能补回的信息也越多——表 4 里 POPE 在 64 档提升 4.7 个点，在 192 档只提升 0.1 个点。',
    formulas: [
      {
        label: 'Eq. (8)(9) 密度与距离指标',
        html: '<i data-s="rho">ρ</i><sub><i>i</i></sub> =　exp(− <span class="frac">1 / <i data-s="k">k</i></span> Σ<sub><i>j</i> ∈ kNN(<i>i</i>)</sub> ‖<i data-s="h">h</i><sub><i>i</i></sub> − <i data-s="h">h</i><sub><i>j</i></sub>‖²)　　<i data-s="del">δ</i><sub><i>i</i></sub> =　min<sub><i data-s="rho">ρ</i><sub><i>j</i></sub> &gt; <i data-s="rho">ρ</i><sub><i>i</i></sub></sub> ‖<i data-s="h">h</i><sub><i>i</i></sub> − <i data-s="h">h</i><sub><i>j</i></sub>‖',
        symbols: [
          { key: 'rho', desc: '局部密度：离 k 个近邻越近越大' },
          { key: 'k', desc: '近邻个数；代码里取簇数 C' },
          { key: 'h', desc: '回收池里的 token 隐藏状态（代码先除以 √C 再算距离）' },
          { key: 'del', desc: '到“比自己更密的点”的最近距离；最密的点取最大距离' },
        ],
        plain: '簇中心应当又密（ρ 大）、又离更密的点远（δ 大），所以按 ρ·δ 选前 C 个当中心，其余 token 分给最近的中心。',
      },
    ],
    check:
      '与代码对照 [[ev:cRecycle]] [[ev:cCluster]]：回收比例 τ = 30%（`int(删除数 × 0.3) + 1`），簇数 `int(回收数 / 10) + 1`，论文没有给出这两个数。**两处不一致**：① 论文说按余弦相似度归簇，代码按欧氏距离分给最近中心 [[ev:cAssign]]；② Eq. (10) 写组内逐元素求和，代码给每个 token 权重 1、除以组内总权重，即**求平均** [[ev:cMerge]]。正文 p.8 说回收“在 TextVQA 和 POPE 上平均提升 1.2% 和 7.2%”“POPE 提升从 1.5% 到 17.7%”，与表 4（GQA、POPE，平均提升 0.8 和 2.6；POPE 从 +0.1 到 +4.7）对不上，原因未知 [[ev:tab4]]。',
    facts: [
      { value: '276 → 83 → 9', label: '192 档第 2 层：删除数 → 回收数 → 簇数（按代码常数）', tag: 'extrap' },
      { value: '+4.7', label: 'POPE 64 档：72.8 → 77.5（表 4）', tag: 'paper' },
      { value: '+0.8 / +2.6', label: 'GQA / POPE 四档平均提升（表 4）', tag: 'paper' },
    ],
    pitfalls: [
      '合并后的 token 不是“恢复”了被删的 token：几十个 token 被平均成一个，细节一定会丢。',
      '表 4 的“+TR”在 64 / 128 / 192 档与表 1 的 SparseVLM 一致，说明表 1 是带回收的结果；“不回收”的数字只在表 4 出现。',
    ],
    show: { ...ALL, takeaways: false, deep: false },
  },
  {
    num: 7,
    id: 'chap-7',
    title: '逐层渐进：“保留 192 个”到底是什么意思',
    badge: '工程 · 核对',
    intro:
      '表 1 写“Retain 192 Tokens”，很容易读成“每层都只有 192 个视觉 token”。按固定代码逐层推算，192 档是 576 → 309 → 204 → 113：前 3 层满 576 个，后 16 层只剩 113 个——“192”是代码打印的 32 层[[t:equal|平均值]] [[ev:cCount]]。',
    analogy: {
      title: '“平均每层 192 件展品”',
      story: '展览分 32 个展厅，前 3 个展厅摆满 576 件，第 4–7 厅撤到 309 件，第 8–16 厅剩 204 件，最后 16 个厅只剩 113 件。导览手册写“平均每厅 192 件”，这句话没错，但参观者在前 3 个厅看到的仍是 576 件。',
      boundary: '展厅 = 解码层，展品 = 视觉 token（包括回收合成的 token）。真实计算量还要加上每层的文本 token，而且注意力一项与 token 数的平方有关，所以“平均件数”与“平均计算量”并不严格成正比（§9）。',
    },
    modules: [
      { id: '7.1', componentId: 'sv-tower', desc: '切换 192 / 128 / 64，播放或拖动进度看 32 层逐层的视觉 token 数（蓝 = 保留，青 = 回收合并）。读数并列两种平均：代码记录的“该层处理后”和实际“进入该层计算”的，并给出 KV Cache 估算。' },
    ],
    insight:
      '两种平均差在剪枝层本身：代码在第 2、6、15 层**处理完之后**才记录剪枝后的数目，但这三层计算时用的还是剪枝前的 token。所以按“进入每层计算”的口径，192 档平均是 206.5 个，128 档 145.4 个，64 档 82.3 个（精确值 82.25）——这也解释了为什么表 1 里 SparseVLM 的 FLOPs 比同档的 ToMe、FastV、PDrop 都高。',
    check:
      '位置编号：代码剪枝后截取前 n 个位置号 [[ev:cConcat]]，相当于把剩下的 token 连续重新编号；解码时新 token 的位置号取该层缓存长度 [[ev:cDecodePos]]，所以不同层里同一个新 token 的位置号不同。论文没有讨论这一点。KV Cache：论文称 192 个 token 时 302.4 MB → 100.8 MB（省 67%）[[ev:eff]]，这与 576 / 192 个 token × 每 token 约 0.524 MB（2 × 32 层 × 4096 × 2 字节）相符，即按“每层都 192 个”计算；按代码逐层保留数，视觉 KV 合计只省约 64% [[tag:extrap]]。',
    facts: [
      { value: '192.0', label: '代码口径：32 层处理后视觉 token 数的平均', tag: 'extrap' },
      { value: '206.5', label: '进入各层计算的视觉 token 数的平均', tag: 'extrap' },
      { value: '约 64%', label: '按逐层保留数估算的视觉 KV 节省（论文写 67%）', tag: 'extrap' },
    ],
    pitfalls: [
      '“保留 192 个”与 FastV、ToMe 的“192 个”口径不一定相同：同一档位下 SparseVLM 的 FLOPs 反而最高（2.14 T）。',
      '三档配额是人为设定的，例如 128 档在第 2 层保留 303 个，比 192 档的 300 个还多，之后删得更狠。',
    ],
    show: { ...ALL, formulas: false, derive: false, takeaways: false, deep: false },
  },
  {
    num: 8,
    id: 'chap-8',
    title: '主实验：图像、视频与另一个模型族',
    badge: '证据',
    intro:
      '表 1 在 LLaVA-1.5 上比较 ToMe、FastV、PDrop 和 SparseVLM 三个档位、8 个基准 [[ev:tab1]]；表 2 换到 Qwen2-VL [[ev:tab2]]，表 3 换到视频 [[ev:tab3]]。另外，别的论文引用的 SparseVLM 数字常常来自早期版本，读的时候要分清。',
    modules: [
      { id: '8.1', componentId: 'sv-results', desc: '切换档位和基准：图示区域按相对原模型的百分比比较四种方法；点任一方法，结果区域给出原始分数，并标出本页复算与表中百分比不一致的格子。' },
      { id: '8.2', componentId: 'sv-versions', desc: '切换档位：并排看 ICML 正式版与 VisionZip 表 1 引用的“SparseVLM(2024.10)”。两列来自不同版本，只并排展示，不互相比较优劣。' },
      { id: '8.3', componentId: 'sv-others', desc: '切换 Qwen2-VL（表 2）与 Video-LLaVA（表 3），看保留 token 数与分数的关系；视频一栏可切换准确率和 GPT 评分。' },
    ],
    insight:
      '档位越低，SparseVLM 与其他方法的差距越大：192 档比 FastV 高 11.2 个点，64 档高 17.3 个点（8 项平均的相对百分比）。但 192 档与 PDrop 的差距只有 3.2 个点，个别格子 PDrop 更高（如 192 档的 SQA、128 档的 MMVet）。',
    check:
      '表 1 内部核对 [[tag:extrap]]：SparseVLM 三行的百分比与平均分都能由原始分数复算；PDrop 128 档 MMB 61.1 / 64.6 = 94.6%，表中写 95.4%；ToMe 有几格差 0.1–0.2。SparseVLM 192 档 MMVet 为 107.1%，高于原模型；论文仅报告一组汇总结果，未交代重复运行次数和方差，无法判断是否超出评测波动。正文“去掉 54.5% 的 token 仍保持 98.0%”（表 2）：600 档 82.1 / 83.7 = 98.1%。表 3：平均 95.0% vs 80.3%、GPT 分只降 0.04 vs 0.17，都能由表中数字复算。版本：arXiv v1 的主表与正式版不同（192 档 GQA 57.6 → 59.5，FastV 基线也重跑过）[[ev:arxivV1]]；VisionZip 表 1 标为“SparseVLM(2024.10)”的就是早期版本 [[ev:visionzip]]。',
    facts: [
      { value: '99.1%', label: '192 档 8 项平均（相对原模型，表 1）', tag: 'paper' },
      { value: '89.3%', label: '64 档 8 项平均；FastV 72.0%（表 1）', tag: 'paper' },
      { value: '95.0%', label: 'Video-LLaVA 2048 → 194 的平均准确率；FastV 80.3%（表 3）', tag: 'paper' },
    ],
    pitfalls: [
      '论文仅报告一组汇总结果，未交代重复运行次数和方差，也没有误差条；SQA、MMB 上不到 1 个点的差距无法判断是否超出评测波动。',
      '视频实验只用每个基准的前 1000 个样本（沿用 FastV 的设置），并用 ChatGPT 打分。',
      '不要把 VisionZip 表里的 SparseVLM 数字和正式版放在一起算差值：两者版本不同，列集合也不同。',
    ],
    show: { ...ALL, formulas: false, derive: false, takeaways: false, deep: false },
  },
  {
    num: 9,
    id: 'chap-9',
    title: '效率：理论 FLOPs、实测延迟与 KV Cache 要分开看',
    badge: '复算',
    intro:
      '表 1 同时给了 TFLOPs 和延迟。“FLOPs 降 62.8%”和“快了 62.8%”不是一回事 [[ev:eff]]。先用代码的计数式复算 TFLOPs，再把理论量和实测量分开读。',
    modules: [
      { id: '9.1', componentId: 'sv-flops', desc: '选档位、拖动“图像之外的 token 数”：看按代码计数式复算的预填充 TFLOPs，与表 1 对比；也可以和“每层都只有 R 个视觉 token”的假想做法对照。' },
      { id: '9.2', componentId: 'sv-tradeoff', desc: '切换横轴（理论 FLOPs / 实测延迟），点任一数据点：看同一次实验里精度、FLOPs、延迟三个数，以及它们为什么不成比例。' },
    ],
    insight:
      '理论上 128 档只剩 37% 的 FLOPs，实测延迟却还有 58%。剪枝层要显式算完整注意力、要聚类，这些都是可能的原因，但论文没有给出分项耗时。计时范围本身也要分清：论文附录 F 描述了包含图像编码等环节的计时范围；固定提交中的 CUDA 计时只包围解码器循环，未覆盖视觉编码和评分员选择。两者与表 1 结果的具体对应关系尚未确认。PDrop 的 FLOPs 比 SparseVLM 低，延迟却更高，提示实现方式对实测速度的影响不亚于 FLOPs。',
    check:
      '复算 [[tag:extrap]]：按代码计数式 [[ev:cFlops]]、逐层视觉 token 数和“图像之外 118 个 token”（为对齐原模型 4.62 T 反推），192 / 128 / 64 档得 2.13 / 1.73 / 1.31 T，表 1 为 2.14 / 1.72 / 1.30 T，差 0.01–0.02 T，可能来自样本间文本长度不同。同一计数式下“32 层每层都只有 R 个”得 2.03 / 1.61 / 1.19 T，与表 1 中 ToMe（进入语言模型前就合并）的 2.05 / 1.62 / 1.19 T 接近。正文核对：“FLOPs 降 62.8%”= 1 − 1.72 / 4.62 ✓；“CUDA 时间降 43.1%”按表是 1 − 33.28 / 57.82 = 42.4%，差 0.7 个点；结论里“延迟降 37.0%、压缩率 77.8%、保持 97%”混用了 192 档（延迟 −36.9%）和 128 档（77.8%、96.7%）[[ev:concl]]。延迟口径要分两层看：论文附录 F 说 CUDA 时间包含图像编码、KV Cache 读取和 Transformer 前向，不含模型加载，单张 A100-80GB [[ev:appF]]；固定提交的计时起点在评分员选择之后、终点在解码层循环之后，只在预填充时计时，没有覆盖视觉编码和评分员选择 [[ev:cTiming]]。两者与表 1 结果的具体对应关系尚未确认。论文仅报告一组汇总结果，未交代重复运行次数和方差，也没有交代批大小。',
    facts: [
      { value: '−62.8%', label: '128 档理论 FLOPs（1.72 vs 4.62 T）', tag: 'paper' },
      { value: '−42.4%', label: '128 档实测延迟（33.28 vs 57.82 ms，本页按表复算）', tag: 'extrap' },
      { value: '2.13 T', label: '192 档按代码计数式复算（表 1 为 2.14 T）', tag: 'extrap' },
    ],
    pitfalls: [
      '理论 FLOPs 只数乘加，不含显存读写、算子启动和聚类等额外步骤；不能直接换算成速度。',
      '表 1 的延迟与 FLOPs：论文仅报告一组汇总结果，未交代重复运行次数和方差；不同方法之间 1–2 ms 的差距无法判断是否稳定。',
    ],
    show: { ...ALL, formulas: false, derive: false, takeaways: false, deep: false },
  },
  {
    num: 10,
    id: 'chap-10',
    title: '边界与对照：论文怎么说，代码怎么做',
    badge: '边界',
    intro:
      '最后把前面零散的核对收在一起：哪些环节论文与代码一致，哪些不一致，哪些论文没有写清楚。复现或引用 SparseVLM 时，这张清单决定了“你复现的是哪一个 SparseVLM”。',
    modules: [
      { id: '10.1', componentId: 'sv-codemap', desc: '用筛选按钮缩小范围，在条目列表里选一项：所选内容给出论文怎么说、代码怎么做、两者是否一致，以及去哪一章细看。' },
    ],
    insight:
      '核心思路（评分员 → 打分 → 剪枝 → 回收）在代码里都有对应；不一致集中在“决定删多少”（秩 vs 固定配额）、聚类细节（余弦 vs 欧氏、求和 vs 平均）和工程实现（FlashAttention）。表 1 的“保留 192 个”在代码里是 32 层平均，这一点读论文时最容易误会。',
    takeaways: [
      { title: '文本引导是主线', desc: '评分员 + 注意力打分，让问题决定留哪些图块（§3–§4）。' },
      { title: '数字先问口径', desc: '“192 个”是层平均，FLOPs 是代码计数式，延迟是单张 A100 上的实测汇总值，计时范围有待确认（§7、§9）。' },
      { title: '复现认准版本', desc: '正式版数字、固定提交代码；不用 main 分支，引用 arXiv 写明版本号。' },
    ],
    pitfalls: [
      '仓库默认的 main 分支现在是后续工作 SparseVLM+ 的代码，不是 ICML 版论文对应的实现。',
      'README 给出 mme、pope、textvqa、sqa、mmbench 五个脚本，固定提交里只有前三个；Qwen2-VL 与 Mini-Gemini 的实现也不在固定提交中。',
    ],
    show: { ...ALL, formulas: false, derive: false, check: false, facts: false, deep: false },
  },
];

export const ROUTES = [
  { title: '先懂原理', path: '§1 → §3 → §4 → §6', to: 1 },
  { title: '复现代码与算力', path: '§5 → §7 → §9 → §10', to: 5 },
  { title: '检查证据与边界', path: '§8 → §9 → §10 → 结论分级', to: 8 },
];
