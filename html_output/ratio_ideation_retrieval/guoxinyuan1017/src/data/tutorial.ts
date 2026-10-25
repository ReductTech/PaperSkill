import type { TutorialData } from '../types';

// Data for this tutorial. The `kind` fields are required: validate-output.js counts
// chapters and modules through them, and every `componentId` is registered in
// ../modules/registry.tsx.
//
// Every number below is taken from arXiv 2608.27394v4 (HTML + PDF) and cross-checked
// against the annotated reading notes kept outside this repository.

export const tutorial: TutorialData = {
  meta: {
    titleEn:
      'Ratio: A Benchmark for Retrieval Across Typed Ideation Operations in Scientific Literature',
    titleZh: 'Ratio：跨越三类构思动作的科学灵感检索基准',
    venue: 'arXiv 2608.27394v4',
    authors: 'Maayan Sharon · Tom Hope',
    affiliation: '希伯来大学耶路撒冷分校 · Allen Institute for AI',
    domain: '科学检索 / 评测基准',
    coreProblem:
      '「相关」被默认成<b>主题相似</b>：两篇论文都在讲 reward hacking，就算相关。可研究者真正想要的是<b>按角色相关</b> —— 这句话是在<b>回应</b>我的问题，还是在把它<b>抽象</b>一层，还是在给我一个<b>实例</b>。',
    coreInsight:
      '把灵感来源拆成三类<b>构思动作</b>（Address / Broaden / Specify），用<b>语篇标记词</b>从全文里远程监督出上百万个训练对，再用<b>时间切分 + 共享候选池</b>把评测做成一次「按动作排序」的检索任务。',
    keywords: ['构思动作', '科学灵感检索', '时间切分', '共享候选池', '银标集'],
  },

  hero: {
    oldMethod: {
      componentId: 'hero-topic-similarity',
      desc: '一个查询压成<b>一个向量</b>，候选也各压一个。谁近谁相关 —— 于是五个候选一样近，分不出哪句才是你要的那一步。',
    },
    newMethod: {
      componentId: 'hero-typed-moves',
      desc: '同一个查询，<b>每条动作一条通道</b>。判的是「这句有没有实现这个动作」，主题像但动作不对的句子会落空。',
    },
  },

  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '一个查询，三种有用的灵感',
      badge: 'inf',
      badgeLabel: '问题',
      bridge:
        '先看这篇论文的赌注：<b>「相关」不是一个标量，而是三种不同的动作</b>。同一个查询，三种动作各给一种有用的东西。',
      analogy: {
        title: '像问路时遇到三种回答',
        text: '有人说「往那边走」（应对），有人说「你在找的其实是另一类地方」（抽象），有人说「比如那家店」（实例）。都相关，但用处完全不同。',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '论文档案：一个查询，三种有用的灵感',
          desc: '左列是论文与它的三个数字，右列是真实引言里的查询句与三个动作各自接住的 gold 句。',
          componentId: 's0-moves',
        },
        {
          kind: 'module',
          id: '1.2',
          title: '三个动作并不等量：92 : 7 : 0.5',
          desc: '按真实比例画的构成条。Broaden 只剩下一条细线，而这正是全文最稀缺的那一格。',
          componentId: 's0-imbalance',
        },
      ],
      insight:
        '全库 3,017,476 对里，<b>92% 是 Specify</b>，Broaden 只有 <b>15,592</b> 对 —— 相差 178 倍。任何「三个动作平均」的说法，都会被 Specify 吞掉。',
      takeaways: [
        { icon: '🔀', title: '三个动作', desc: 'Address 应对 · Broaden 抽象 · Specify 实例' },
        { icon: '📐', title: '不是标量', desc: '相关要按「扮演什么角色」判' },
        { icon: '⚖️', title: '极不平衡', desc: 'Specify 占 92%，Broaden 仅 0.5%' },
      ],
    },

    {
      kind: 'chapter',
      id: 'chap-2',
      title: '不是最像 q，是最像 r',
      badge: 'inf',
      badgeLabel: '定义',
      bridge:
        '把任务写成一句话：给定查询句 q 和动作 r，<b>从同一个池子里排出最符合 r 的句子</b> —— 而不是最像 q 的句子。',
      analogy: {
        title: '像在同一批候选人里换岗位要求',
        text: '池子不变，变的只是「这个岗位要什么」。同一批句子里，三个动作各自有各自的合适人选。',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '查询句 → 三条动作通道 → 一个共同候选池',
          desc: '上半是抽象阶梯：Broaden 向上、Specify 向下、Address 从侧面回应；下半是四句候选，第四句落空。',
          componentId: 's1-problem',
        },
      ],
      insight:
        '干扰句<b>不是随机取的</b>：它和 gold 来自同一批论文、同样剥掉了开头短语，只是标记词被判为「非动作」。所以认首词、认体裁都过不了这一关。',
      takeaways: [
        { icon: '🎯', title: '换目标', desc: '排序目标是动作，不是主题' },
        { icon: '🪜', title: '一个阶梯', desc: 'Broaden 向上 / Specify 向下' },
        { icon: '🚫', title: '第四句', desc: '主题对、动作不对 —— 必须落空' },
      ],
    },

    {
      kind: 'chapter',
      id: 'chap-3',
      title: '4,252 个标记词，366.6M 个句对',
      badge: 'trn',
      badgeLabel: '构造',
      bridge:
        '监督信号不靠人标，靠<b>语篇标记词</b>：一句话开头写着 more generally，它就在做 Broaden。这个假设要跑到 1.1M 篇全之上才算数。',
      analogy: {
        title: '像靠路牌反推路线',
        text: '路牌（标记词）本身不是路线，但每块牌都指着一个方向，拼起来就能还原出人是怎么走的。',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '四个来源 → 一张词表 → 扫全库 → 三元组',
          desc: '四路词源汇成 4,252 个短语，扫 366.6M 个相邻句对只命中 809 个，最后吐出 (q, gold, 动作)。',
          componentId: 's2-construction',
        },
      ],
      formula: {
        lead: '一个相邻句对能不能记为训练对，只看一个条件：',
        unicode: '(s, t) 计入动作 r　⟺　首短语 m(t) ∈ L<sub>r</sub>　∧　t 紧接在 s 之后',
        symbols: [
          { sym: 's', desc: '前一句，作查询（query）' },
          { sym: 't', desc: '后一句，作 gold —— 它实现了标记词所指的动作' },
          { sym: 'L_r', desc: '动作 r 的标记短语表（三个动作各一张）' },
        ],
      },
      insight:
        '词表 4,252 个，真正在语料里命中的只有 <b>809</b> 个 —— LLM 生成的那 3,779 个八成落空。远程监督的第一步不是扩大词表，而是承认词表大半是废的。',
      takeaways: [
        { icon: '🏷️', title: '四路词源', desc: '人工 169 · LLM 3,779 · 模板 397 · 前缀扩展' },
        { icon: '🔍', title: '809 / 4,252', desc: '八成词表匹配不到语料' },
        { icon: '🧱', title: '366.6M 句对', desc: '扫描 1.1M 篇 CS 全文' },
      ],
    },

    {
      kind: 'chapter',
      id: 'chap-4',
      title: '两个日期，一个共享池',
      badge: 'both',
      badgeLabel: '切分',
      bridge:
        '挖掘出的对能不能用来评测，全看<b>怎么切</b>：按论文的发表日期切三段，测试段所有模型都没见过；池子只由该时段的论文构成。',
      analogy: {
        title: '像用今年新出的题考去年出的教辅',
        text: '教辅（训练）只能用旧题编，考卷（测试）必须全是新题，而且三个考点共用同一份卷子。',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '时间三段、一个共享池、两个 pilot 陷阱',
          desc: '上排是 13.8M / 361K / 404K 三段语料，中段是 404,371 句的测试池按真实比例分片，下排是两个 pilot 反例。',
          componentId: 's3-split',
        },
      ],
      insight:
        '共享池是这一节真正的设计：一句 Specify 的 gold，对 Address 查询就是「主题对、动作不对」的干扰。<b>池子共用，动作才成为唯一的变量。</b>',
      takeaways: [
        { icon: '📅', title: '三段日期', desc: '2015–2025.09 / 2025 Q4 / 2026.01–05' },
        { icon: '🪣', title: '一个池子', desc: '404,371 句，三动作共用' },
        { icon: '🧪', title: '两个陷阱', desc: '非时间切分、随机句当干扰，都会虚高' },
      ],
    },

    {
      kind: 'chapter',
      id: 'chap-5',
      title: '压量、判官，与三种水位',
      badge: 'both',
      badgeLabel: '评测',
      bridge:
        '远程监督的噪声太大，先<b>压量</b>：抽 25,430 对，两个提示词都判对才留下 17,579 条银标查询。然后才轮得到检索器上场。',
      analogy: {
        title: '像先用筛子过一遍再称重',
        text: '筛子（判官）自己也要校准 —— 它和人有多一致，决定了剩下的东西值多少。',
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '漏斗、三条水位尺、一条天花板',
          desc: '上半是抽样与判官压量，下半是 Specify / Address / Broaden 三条 MRR@10 水位，末段是 top-100 召回的硬上限。',
          componentId: 's4-evaluation',
        },
      ],
      insight:
        '同一个模型线上，微调把三个动作从 <b>26.7 / 10.2 / 17.3</b> 抬到 <b>46.7 / 24.5 / 27.3</b>；再加 LLM 重排只到 55.1 / 37.7 / 29.5。因为 gold 落在 top-100 里的比例只有 <b>80.8% / 61.3% / 57.2%</b> —— 一阶段没看到的，重排补不回来。',
      takeaways: [
        { icon: '🧽', title: '17,579 条', desc: '25,430 对里两提示词都过才留' },
        { icon: '📊', title: '三条水位', desc: 'MRR@10 46.7 / 24.5 / 27.3' },
        { icon: '🧱', title: '天花板', desc: 'top-100 召回 80.8 / 61.3 / 57.2' },
      ],
    },

    {
      kind: 'chapter',
      id: 'chap-6',
      title: '五个人、125 条、三十小时',
      badge: 'both',
      badgeLabel: '人类',
      bridge:
        '指标再漂亮，也要人点头。五个有发表经历的 CS 研究生，对条件盲、顺序打乱，逐条判「有没有用」，再选更有用的那一列。',
      analogy: {
        title: '像盲品两组咖啡',
        text: '杯子编号、顺序打乱，喝完再问哪杯更好 —— 名字不告诉你，才不会照顾作者面子。',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '一次盲评的现场与两本账',
          desc: '上半是同一查询的两列 top-10，中段是三色票条，下段是「只算金句」与「都算上」两本账。',
          componentId: 's5-human',
        },
      ],
      insight:
        'HR@10 从 <b>47.6</b> 升到 <b>81.2</b>，但这屏最该记住的是另一件事：<b>64.8%</b> 的查询里存在「不是金句、却有用」的候选，其中 <b>91.7%</b> 来自别的论文 —— 只按金句算的 MRR 是 27.1，把有用候选都算上是 51.7，<b>银标口径低估了约一半</b>。',
      takeaways: [
        { icon: '🧑‍🔬', title: '5 人 125 条', desc: '对条件盲，30 余小时' },
        { icon: '📈', title: '47.6 → 81.2', desc: 'HR@10，p < .01' },
        { icon: '🌉', title: '91.7% 跨论文', desc: '灵感常常不在金句里' },
      ],
    },
  ],
};
