import type { TutorialData } from '../types';

// ============================================================================
//  Lost in the Middle: How Language Models Use Long Contexts
//  中文交互式论文教程 —— 数据驱动内容（React + Vite）
//  统一隐喻：长上下文 = 一叠长长的试卷，关键信息放在卷首/卷尾时"考官"一眼看到，
//            放在卷中间容易被"淹没"。论文发现模型性能随关键信息位置呈 U 形。
// ============================================================================

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'Lost in the Middle: How Language Models Use Long Contexts',
    titleZh: '迷失在中间：语言模型如何使用长上下文',
    venue: 'TACL 2023 / arXiv:2307.03172',
    authors: 'Nelson F. Liu, Kevin Lin, John Hewitt, Ashwin Paranjape, Michele Bevilacqua, Fabio Petroni, Percy Liang',
    affiliation: 'Stanford University · UC Berkeley · Samaya AI',
    domain: '大语言模型 · 长上下文理解 · 信息检索（评测模型：GPT-3.5-Turbo、GPT-4、Claude-1.3/100k、MPT-30B-Instruct、LongChat-13B、Flan-T5/UL2）',
    coreProblem: '当模型能接收很长的输入时，它真的"用得好"里面的信息吗？关键信息放在不同位置，模型表现一致吗？',
    coreInsight:
      '模型性能随关键信息在上下文中的位置呈 U 形：放在最前或最后最强，放在正中间最弱。长上下文越长，整体利用越差；这直接影响检索增强（RAG）等真实应用。',
    keywords: ['长上下文', '位置偏差', 'U形效应', '检索增强', '上下文利用'],
  },
  hero: {
    oldMethod: {
      desc:
        '我们直觉以为：把更多资料一次性塞给模型（更长的上下文），它就能掌握全部信息。但论文证明——"装得下"不等于"记得住、用得上"。',
      figure: undefined,
      componentId: 'litm-key-position',
    },
    newMethod: {
      desc:
        '论文用系统实验揭示：模型像"阅卷人"——对放在卷首和卷尾的信息最敏感，夹在中间的信息最容易被忽略。据此给出"先检索、再把关键内容摆到首尾"的实用建议。',
      figure: undefined,
      componentId: 'litm-key-position',
    },
  },
  chapters: [
    // ───────────────────────── 第 1 章 ─────────────────────────
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '长上下文的"能装"与"会用"',
      badge: 'inf',
      badgeLabel: '背景',
      bridge: '本节作用：先打破"上下文越长越好"的直觉，提出真正要回答的问题。',
      analogy: {
        title: '阅卷人比喻',
        text:
          '把长上下文想成一叠厚厚的试卷。你（关键信息）如果贴在卷首或卷尾，阅卷人一眼就看到；可一旦被夹在厚厚一叠的正中间，就很容易被翻过去、被忽略。模型对长输入的处理，和这位阅卷人惊人地相似。',
        componentId: 'litm-key-position',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '关键信息放在哪，模型表现大不同',
          desc:
            '拖动下方滑块，把"关键信息"从卷首慢慢移到卷尾，观察模型命中率如何变化。你会发现首尾高、中间低——这就是论文要研究的<strong>位置效应</strong>。',
          componentId: 'litm-key-position',
        },
        {
          kind: 'module',
          id: '1.2',
          title: '先记住这个直觉：卷首卷尾最安全',
          desc:
            '同一段滑块实验再看一遍：把关键信息固定在<strong>最前</strong>或<strong>最后</strong>时，命中率明显更高。记住这条"安全区"规则，后面所有实验都是它的展开。',
          componentId: 'litm-key-position',
        },
      ],
      insight: '核心问题不是"模型能读多长"，而是"模型能否平等地使用长文里的每一处信息"。',
      formula: {
        lead: '论文关心的不是某个固定公式，而是一个经验规律：性能 P 随位置 pos 呈 U 形。',
        unicode: 'P(pos) ↑ 在两端，P(pos) ↓ 在中间  （U 形）',
        symbols: [
          { sym: 'pos', desc: '关键信息在上下文中的相对位置（卷首=0，卷尾=1）' },
          { sym: 'P', desc: '模型在该位置给出正确答案的概率（经验观测，非闭式解）' },
        ],
      },
      takeaways: [
        { icon: '📏', title: '长 ≠ 好', desc: '模型支持的上下文长度增加，不代表它真的用好了全部内容。' },
        { icon: '📍', title: '位置很重要', desc: '同一句话放在不同位置，模型表现会明显不同。' },
        { icon: '❓', title: '要系统测', desc: '需要可控实验，扫描关键信息在所有位置的表现。' },
      ],
    },
    // ───────────────────────── 第 2 章 ─────────────────────────
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '两个评测任务：怎么"扫描"位置',
      badge: 'both',
      badgeLabel: '方法',
      bridge: '本节作用：介绍论文用来量化位置效应的两类可控实验任务。',
      analogy: {
        title: '稻草堆里找针',
        text:
          '想测阅卷人是否认真，最干脆的办法是：在大量无关试卷（稻草）里随机夹一张带答案的（针），再问他答案。针放在哪一叠，就是我们要扫的位置。',
        componentId: 'litm-tasks',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '任务一：多文档问答 / 二：合成键值检索',
          desc:
            '点选两个芯片，了解论文的两类任务：多文档问答（基于 NaturalQuestions-Open，k 篇里仅 1 篇含答案）与合成键值检索（输入 JSON 化的 k 个随机 UUID 键值对，给定键要求返回对应值）。两者都通过随机化关键信息位置来暴露位置偏差。',
          componentId: 'litm-tasks',
        },
      ],
      insight: '两任务共享同一思路：可控地移动"针"的位置，从而把位置效应从噪声中分离出来。',
      formula: {
        lead: '把"针"放在上下文 N 个等分段中的第 i 段，统计答对率。',
        unicode: 'acc(i) = 1/N · Σ(位置 i 处答对 ? 1 : 0)',
        symbols: [
          { sym: 'i', desc: '关键信息所在的段落序号' },
          { sym: 'acc(i)', desc: '该位置上的平均答对率' },
        ],
      },
      takeaways: [
        { icon: '🗂️', title: '多文档问答', desc: 'N 篇文档仅 1 篇含答案，问需综合信息的问题。' },
        { icon: '🪡', title: '合成检索', desc: '干扰句中随机插关键信息，让模型复述。' },
        { icon: '🎲', title: '随机化位置', desc: '位置是实验变量，其余尽量保持一致。' },
      ],
    },
    // ───────────────────────── 第 3 章 ─────────────────────────
    {
      kind: 'chapter',
      id: 'chap-3',
      title: 'U 形位置效应：中间最弱',
      badge: 'trn',
      badgeLabel: '发现',
      bridge: '本节作用：展示论文最核心的定量发现——性能随位置呈 U 形。',
      analogy: {
        title: '一叠试卷的"中间盲区"',
        text:
          '阅卷人翻卷子时，开头几张和结尾几张印象最深；中间那厚厚一沓，看过就混、最容易记错。模型的"注意力"也有这个中间盲区。',
        componentId: 'litm-position-curve',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '性能随位置的 U 形曲线',
          desc:
            '拖动滑块逐步揭示曲线：关键信息从卷首移向卷尾，模型性能先降后升，整体呈<strong>U 形</strong>；正中间是谷底。论文实测：GPT-3.5-Turbo 在 20 篇文档设置中，答案放中间最低仅 <strong>52.9%</strong>，比"闭卷不给文档"的 56.1% 还低；30 篇(16K)设置最低跌到 <strong>49.5%</strong>。',
          componentId: 'litm-position-curve',
        },
      ],
      insight: '位置效应是系统性的、跨模型的：不是偶发，而是普遍规律。',
      formula: {
        lead: '用相对位置 t∈[0,1] 描述，U 形可写成"离两端越远越差"的形式。',
        unicode: 'perf(t) ≈ a + b·|t − 0.5|ᵏ   （两端高、中点低）',
        symbols: [
          { sym: 't', desc: '相对位置，0=卷首，1=卷尾' },
          { sym: 'k', desc: 'U 形"尖锐程度"的经验指数（论文以曲线呈现，此处为示意）' },
        ],
      },
      takeaways: [
        { icon: '📉', title: '中间是谷底', desc: '关键信息在正中间时模型表现最差。' },
        { icon: '📈', title: '两端是高峰', desc: '放在卷首或卷尾，模型最稳。' },
        { icon: '🔁', title: '普遍成立', desc: '在两类任务、多个模型上均观察到。' },
      ],
    },
    // ───────────────────────── 第 4 章 ─────────────────────────
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '多文档问答里的位置偏见',
      badge: 'trn',
      badgeLabel: '发现',
      bridge: '本节作用：把位置效应落到"多文档问答"这一真实任务上。',
      analogy: {
        title: '哪一篇被翻到了',
        text:
          '五篇文档摞在一起，只有一篇写着一个关键数字。这位"阅卷人"更可能引用最上面或最底下那篇——中间那篇的数字，常常被忘掉。',
        componentId: 'litm-doc-order',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '把答案文档拖到不同位置',
          desc:
            '拖动滑块改变"含答案文档"在第几位：当它位于<strong>开头或结尾</strong>时模型答对；夹进<strong>中间</strong>则常答错。论文用 NaturalQuestions-Open 实测：GPT-3.5-Turbo 闭卷（不给文档）尚能答对 56.1%，而答案文档被放在 20 篇正中间时反而只有 52.9%——位置偏差足以抵消"给资料"的好处。',
          componentId: 'litm-doc-order',
        },
      ],
      insight: '多文档问答的性能，不仅取决于"有没有相关信息"，还取决于"相关信息被放在哪"。',
      formula: {
        lead: '对 N 篇文档，答案在第 i 篇时的答对率同样呈 U 形。',
        unicode: 'acc_doc(i) 在 i=1 或 i=N 最高，i≈N/2 最低',
        symbols: [
          { sym: 'i', desc: '含答案文档的编号（1..N）' },
          { sym: 'N', desc: '文档总数' },
        ],
      },
      takeaways: [
        { icon: '📚', title: '顺序有偏', desc: '答案文档的位置直接决定成败。' },
        { icon: '🧩', title: '非鲁棒', desc: '同一问题换摆放顺序，答案可能变。' },
        { icon: '⚠️', title: '现实隐患', desc: '文档拼接顺序会悄悄影响 RAG 质量。' },
      ],
    },
    // ───────────────────────── 第 5 章 ─────────────────────────
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '上下文越长，整体越差',
      badge: 'trn',
      badgeLabel: '发现',
      bridge: '本节作用：揭示另一个维度——上下文总长度本身也会拖累性能。',
      analogy: {
        title: '卷子越厚，越容易漏',
        text:
          '同样一张带答案的卷子，夹在 5 张里和夹在 30 张里，阅卷人漏看的概率显然不同。上下文越长，模型整体"走神"越严重。',
        componentId: 'litm-context-length',
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '长度与平均性能的负相关',
          desc:
            '拖动滑块增大上下文长度：可以看到平均性能一路下滑。论文结论——<strong>能装下 ≠ 能用得好</strong>，长上下文本身就会拖累模型对信息的利用。',
          componentId: 'litm-context-length',
        },
      ],
      insight: '即便关键信息摆在"好位置"，更长的上下文仍会拉低整体表现。',
      formula: {
        lead: '平均性能随上下文长度 L 增大而下降（定性趋势）。',
        unicode: 'avg_acc(L) ↓ 随 L 增大',
        symbols: [
          { sym: 'L', desc: '上下文总长度（论文以 token / 文档数衡量）' },
          { sym: 'avg_acc', desc: '跨所有位置的平均答对率' },
        ],
      },
      takeaways: [
        { icon: '📐', title: '越长越弱', desc: '上下文越长，平均利用越差。' },
        { icon: '🚧', title: '别硬塞', desc: '不是越长越好，要按需裁剪。' },
        { icon: '🧪', title: '可复现', desc: '多个模型家族均呈现该趋势。' },
      ],
    },
    // ───────────────────────── 第 6 章 ─────────────────────────
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '查询感知上下文化：把查询放在哪',
      badge: 'both',
      badgeLabel: '方法+发现',
      bridge: '本节作用：论文还测试了一个工程技巧——把"查询"放在文档之前或之后，能否缓解位置偏差。',
      analogy: {
        title: '先把问题贴在卷首',
        text:
          '阅卷人翻卷前，你先把"要找什么"写在卷首。这样他从第一页就开始带着问题看，相关答案哪怕在中间也更容易被对上。论文把这种"查询前置"称为查询感知上下文化。',
        componentId: 'litm-query-aware',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '查询放前面还是后面',
          desc:
            '勾选切换：把<strong>查询</strong>放在文档之前（上下文开头）时，在"键值检索"任务上几乎能完美命中；对多文档问答，开头位置的答案也略有提升。这再次印证模型对<strong>上下文两端</strong>最敏感。',
          componentId: 'litm-query-aware',
        },
      ],
      insight: '把查询放在上下文开头，是一种零成本的"提示工程"缓解手段；但多文档问答受益有限，说明位置偏差根子在模型本身。',
      formula: {
        lead: 'query-aware contextualization：将查询 q 置于文档集合 D 之前（或之后）。',
        unicode: 'input = q ⊕ D   （或  D ⊕ q）',
        symbols: [
          { sym: 'q', desc: '待回答的查询' },
          { sym: 'D', desc: 'k 篇文档 / k 个键值对' },
          { sym: '⊕', desc: '拼接' },
        ],
      },
      takeaways: [
        { icon: '🔎', title: '查询前置', desc: '把问题写在上下文开头，检索更稳。' },
        { icon: '🧩', title: '任务有别', desc: '键值任务近乎完美，多文档QA仅略升。' },
        { icon: '🧠', title: '根子在模型', desc: '提示技巧治标，位置偏差仍普遍存在。' },
      ],
    },
    // ───────────────────────── 第 7 章 ─────────────────────────
    {
      kind: 'chapter',
      id: 'chap-7',
      title: '对检索增强（RAG）的启示',
      badge: 'inf',
      badgeLabel: '应用',
      bridge: '本节作用：把发现转化为对真实系统（RAG）的设计建议。',
      analogy: {
        title: '把针摆到灯下',
        text:
          '做检索增强时，你把所有候选段落拼进一个"窗口"交给模型。既然模型只看首尾，那就把关键段落摆到窗口两端、别埋在中间——等于把针放到灯下。',
        componentId: 'litm-rag-window',
      },
      modules: [
        {
          kind: 'module',
          id: '7.1',
          title: '关键段落该摆在窗口哪里',
          desc:
            '勾选切换：检索增强把候选段落拼进上下文窗口。由于模型偏好首尾，<strong>把关键段落放在窗口两端</strong>更稳；放中间则落入"盲区"。论文给出的具体做法是：对检索结果做<strong>重排序</strong>（把相关文档推到开头/结尾），或采用<strong>截断返回列表</strong>（ranked list truncation）控制长度——这比单纯"塞更多文档"更有效。',
          componentId: 'litm-rag-window',
        },
      ],
      insight: 'RAG 不只是"检索到"，还要"摆对位置"——上下文工程同样关键。',
      formula: {
        lead: '把检索到的关键段落 k 放在窗口首尾，而非中段。',
        unicode: 'place(k) ∈ {窗口首, 窗口尾} 优于 窗口中',
        symbols: [
          { sym: 'k', desc: '检索到的关键段落' },
          { sym: '窗口', desc: '拼接后送入模型的上下文' },
        ],
      },
      takeaways: [
        { icon: '🔦', title: '摆对位置', desc: '关键段落放窗口两端，别埋中间。' },
        { icon: '🧱', title: '上下文工程', desc: 'RAG 质量依赖拼接策略。' },
        { icon: '🛠️', title: '可落地', desc: '论文结论直接指导系统设计。' },
      ],
    },
    // ───────────────────────── 第 8 章（双模块）─────────────────────────
    {
      kind: 'chapter',
      id: 'chap-8',
      title: '总结与给实践者的建议',
      badge: 'inf',
      badgeLabel: '总结',
      bridge: '本节作用：收束全文，给出可操作建议，并对比三种用法的效果。',
      analogy: {
        title: '别把针埋进书堆里',
        text:
          '一句话记住全文：长上下文不是"越大越好"，关键是让模型看得见关键信息——把针放在卷首卷尾，别埋进厚厚的中间。',
        componentId: 'litm-methods-compare',
      },
      modules: [
        {
          kind: 'module',
          id: '8.1',
          title: '三条可操作建议',
          desc:
            '① 关键内容放首尾：把最重要的信息写在提示的开头或结尾。② 检索后重排序：用检索拿到候选后，把相关文档<strong>重排序</strong>到上下文两端（或截断返回列表），而不是按原顺序全塞。③ 控制长度：只给必要上下文，别盲目堆长——更长窗口不等于更好利用。这三条直接来自论文发现。',
          componentId: 'litm-tasks',
        },
        {
          kind: 'module',
          id: '8.2',
          title: '三种用法效果对比',
          desc:
            '下方动画对比：当关键信息卡在<strong>中间</strong>时，直接把整本书丢给模型最吃亏；<strong>先检索、再把关键段落摆到首尾</strong>，正确率明显更高。',
          componentId: 'litm-methods-compare',
        },
      ],
      insight: '论文的真正价值：把"长上下文可用性"从一个模糊直觉，变成可被工程化的设计原则。',
      formula: {
        lead: '实践准则可概括为：检索 + 首尾摆放 + 控长度。',
        unicode: '好用 = 检索缩小 ⊕ 关键放首尾 ⊕ 长度克制',
        symbols: [
          { sym: '⊕', desc: '三者组合，而非单独依赖长上下文' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '放首尾', desc: '关键信息写在提示开头/结尾。' },
        { icon: '🔎', title: '先检索', desc: '用检索缩小上下文，规避中间盲区。' },
        { icon: '✂️', title: '控长度', desc: '只给必要信息，不盲目加长。' },
      ],
    },
  ],
  bilibili: [
    {
      bvid: '',
      title: '（可选）大模型长上下文与位置偏差科普',
      reason: '如需补充视频，可填入相关 B 站 BV 号；当前留空不影响构建。',
      cover: undefined,
      views: undefined,
    },
  ],
};
