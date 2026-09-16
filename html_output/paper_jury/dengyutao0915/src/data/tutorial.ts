import type { TutorialData } from '../types';

// ============================================================================
//  PaperJury 交互式教程数据（唯一内容源）
//  基于 arXiv:2606.16322《PaperJury: Due-Process Review for Bounded LaTeX Revision》
//  统一生活主题：法庭审判（法官=确定性编排，陪审团=局部语义，辩护=全文语义）
// ============================================================================

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'PaperJury: Due-Process Review for Bounded LaTeX Revision',
    titleZh: '论文陪审团：有界 LaTeX 修订的正当程序审查',
    venue: 'arXiv:2606.16322 · 2026',
    authors: 'Yiran Wang · Ruixuan An · Biao Wu · Wenhao Wang',
    affiliation: 'Vast Intelligence Lab, Sydney',
    domain: '计算与语言 · 科学写作智能体',
    coreProblem:
      '预提交强化：投稿前的论文表面上"看起来完成"，但跨章节的矛盾与证据缺口只有对抗性的整体审稿才能发现，而现有写作助手既不裁决、也不安全地修订。',
    coreInsight:
      '把安全关键逻辑交给确定性编排（分解、路由、裁决计算、停止判定、精确一次编辑），语言模型只做有界的阅读、判断与起草——<strong>模型仍然做最难的阅读，但不再握法槌和橡皮</strong>。',
    keywords: ['论文审稿', '确定性编排', '安全修订', 'LLM Agent', '正当程序'],
  },

  hero: {
    oldMethod: {
      desc: '写作助手只润色文字、生成局部批评；模型既提问题又自己改稿、还自己宣布"完成了"——没有跨轮次的身份、没有确定性裁决、没有编辑安全。',
    },
    newMethod: {
      desc: 'PaperJury 闭环系统：确定性编排管理分解、冻结主张主线、持久账本、路由、停止与精确一次补丁；语义代理仅做有界的审稿、判断与修复。',
    },
  },

  bilibili: [
    {
      bvid: 'BV1SUNr6EE9v',
      title: 'PaperJury：让论文审稿修改不再扯皮',
      reason: '唯一直接讲解 PaperJury 论文的视频（方法深读；播放量低因其为论文配套原创解读）',
      cover: 'https://i1.hdslb.com/bfs/archive/2c9359bb113f12a71711aed7c29c5bd469d0e9c2.jpg',
      views: '16播放',
    },
    {
      bvid: 'BV1jgL7zeEyk',
      title: '论文审稿人教你60分钟上手论文写作！',
      reason: '从审稿人视角理解论文缺陷与投稿流程，与本教程"审稿裁决"主题强相关',
      cover: 'https://i0.hdslb.com/bfs/archive/c3262367efa9fc951cd9f07b4aa431c53e6c1899.jpg',
      views: '9879播放',
    },
    {
      bvid: 'BV1ENxxedEYt',
      title: '【整整20集】B站2024最通俗易懂的论文写作教程',
      reason: '论文写作通用教程，为预提交强化场景提供背景知识',
      cover: 'https://i2.hdslb.com/bfs/archive/ed7abd8fb4ce8b0e8a16d401aeb10a9eba865f79.jpg',
      views: '1799播放',
    },
  ],

  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '看起来完成 ≠ 论证健全',
      badge: 'inf',
      badgeLabel: '问题引入',
      bridge:
        '一篇论文文字流畅、表格整齐、格式规范，看起来已经"完成"了。但就像外墙粉刷一新的大楼，内部的承重墙可能已经开裂——问题不在表面，而在跨章节的证据矛盾里。',
      analogy: {
        title: '起诉书：格式合规 ≠ 证据充分',
        text: '论文就像一份即将提交法庭的起诉书。文字通顺只是"格式合规"，但指控是否有证据支撑、证据之间是否矛盾，需要批判性的整体审视才能发现。',
        componentId: 'ana1',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '表面完成 vs 论证健全',
          desc: '拖动滑块提高"表面完成度"，观察它与真实"论证健全度"如何背离——这正是预提交强化要解决的问题。',
          componentId: 'ch1mod1',
        },
        {
          kind: 'module',
          id: '1.2',
          title: '开篇预习测验',
          desc: '两道开篇题：检验你对 PaperJury 核心设计原则与"确定性-语义分离"的初步理解。',
          componentId: 'quiz-block',
        },
        {
          kind: 'module',
          id: '1.3',
          title: '漫画图解：人物与开庭',
          desc: '用漫画认识法庭上的五位角色，以及论文如何被带上审判庭。',
          componentId: 'comic-strip',
        },
        {
          kind: 'module',
          id: '1.4',
          title: '视角切换：表面 vs 健全',
          desc: '同一篇论文，表面视角与批判视角看到的是两张面孔——点击切换体会"完成≠健全"。',
          componentId: 'ch1view',
        },
      ],
      insight:
        '表面完成度来自局部打磨（语法、格式、单表自洽），论证健全度来自整体审视（跨章节矛盾、证据支撑）。两者可以相差很远。',
      takeaways: [
        { icon: '📄', title: '完成≠健全', desc: '文字流畅的论文可能隐藏着跨章节的论证矛盾。' },
        { icon: '🧩', title: '局部自洽', desc: '两个局部一致的表格，放在一起可能互相冲突。' },
        { icon: '🕵️', title: '整体审视', desc: '预提交强化需要批判性的整体阅读，而非拼写检查。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '三难困境与两大挑战',
      badge: 'inf',
      badgeLabel: '问题深化',
      bridge:
        '自动审稿面临精确-召回-成本的三难：放宽问题生成能提高召回，但会引入假问题、推高裁决成本；收紧审查提高精确，却可能漏过真正的缺陷。',
      analogy: {
        title: '天平：三个砝码难以同时平衡',
        text: '精确=抓对问题，召回=不漏问题，成本=审稿资源。三者不可兼得：放宽审查提高召回但降低精确、推高成本；收紧审查提高精确但可能漏网。',
        componentId: 'ana2',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '三难困境：拖拽资源分配点',
          desc: '在三角形内拖拽资源分配点，观察精确率、召回率与成本的联动——任何一角都有代价。',
          componentId: 'ch2mod1',
        },
        {
          kind: 'module',
          id: '2.2',
          title: '三难权衡滑块',
          desc: '拖动三个滑块，观察精确度、召回率与成本之间的权衡三角形如何变化。',
          componentId: 'ch2sliders',
        },
      ],
      formula: {
        lead: '一个有用的审稿系统，是三个目标之间的权衡：',
        unicode: '有用系统 = f(精确率, 召回率, 成本)',
        symbols: [
          { sym: '精确率', desc: '提出的问题中真正成立的比例（越高越好）' },
          { sym: '召回率', desc: '真正的问题中被发现的比例（越高越好）' },
          { sym: '成本', desc: 'token 消耗与裁决资源（越低越好）' },
        ],
      },
      takeaways: [
        { icon: '⚖️', title: '固有张力', desc: '审稿系统面临精确-召回-成本的固有三难。' },
        { icon: '⚡', title: '裁决不可靠', desc: '挑战一：哪些投诉该采纳、何时该停止，模型自判不稳定。' },
        { icon: '🩹', title: '修订不安全', desc: '挑战二：一个补丁可能悄悄改变邻近主张或破坏引用。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '核心思想：确定性 vs 语义分离',
      badge: 'inf',
      badgeLabel: '核心洞见',
      bridge:
        '法庭上，陪审团认定事实（语义判断），法官负责程序与裁决（确定性规则）。如果让模型既当裁判又当执行者，就会出现"自己提案自己认证完成"的利益冲突。',
      analogy: {
        title: '法官握法槌，陪审团读书',
        text: '语义模型=陪审团（阅读、推理、判断），确定性编排=法官（程序控制、裁决计算、停止判定）。模型仍然做最难的阅读，但不再握法槌（裁决权）或橡皮（编辑权）。',
        componentId: 'ana3',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '谁握法槌：两种架构对比',
          desc: '按下开始，同步观察"模型握法槌"与"确定性握法槌"两种架构在裁决与编辑上的可靠性差异。',
          componentId: 'ch3mod1',
        },
        {
          kind: 'module',
          id: '3.2',
          title: '架构切换：模型中心 vs 确定性中心',
          desc: '点击切换两种架构，直接对比"LLM 握法槌"与"代码握法槌"的职责边界。',
          componentId: 'ch3gavel',
        },
      ],
      insight:
        '确定性编排拥有状态转换、守卫、停止与精确一次补丁应用；语义代理仅限于有界的审稿、判断、起草与审计。',
      takeaways: [
        { icon: '🔨', title: '分离', desc: '确定性编排拥有状态、守卫、停止与精确一次补丁。' },
        { icon: '📖', title: '有界', desc: '语义代理仅限有界的审稿、判断、起草与审计任务。' },
        { icon: '✋', title: '不越权', desc: '模型做阅读，不做最终裁决与编辑。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '确定性设置：分解、主线与账本',
      badge: 'both',
      badgeLabel: '核心机制',
      bridge:
        '法庭开庭前要整理案卷（分解）、固定核心指控（冻结主张主线）、建立案件档案（持久账本）。这些确定性基础确保后续审判有稳定参照系。',
      analogy: {
        title: '书记员装订案卷',
        text: '分解 D(x)=案卷整理：把论文切成可定位的章节/段落/锚点/交叉引用；冻结主张主线 S=核心指控清单：编辑可修措辞但不能改指控；持久账本 L=案件档案：每个问题有稳定身份。',
        componentId: 'ana4',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '三步建立确定性基础',
          desc: '点击"下一步"依次建立分解、冻结主张主线与持久账本，理解为什么这些工作必须先于任何语义调用。',
          componentId: 'ch4mod1',
        },
        {
          kind: 'module',
          id: '4.2',
          title: '职责匹配：确定性 vs 语义',
          desc: '点击左侧操作，再点击下方区域，判断每项职责由确定性编排还是语义推理负责。',
          componentId: 'ch4match',
        },
        {
          kind: 'module',
          id: '4.3',
          title: '核心符号速查 · 控制流',
          desc: 'D(x)、S、L、τ、N：掌握确定性设置阶段的 5 个核心符号，点击卡片查看论文定义。',
          componentId: 'symbol-cards',
        },
        {
          kind: 'module',
          id: '4.4',
          title: '完整流水线交互演示',
          desc: '从分解到收敛停止的完整 review-verdict-revise-verify 流程，可播放、可拖拽进度条、可逐步查看。',
          componentId: 'step-animator',
        },
        {
          kind: 'module',
          id: '4.5',
          title: '章节测验 · 冻结主张主线',
          desc: '检验你对"冻结主张主线"机制的理解：它是编辑安全的保护层。',
          componentId: 'quiz-block',
        },
      ],
      formula: {
        lead: '三个确定性基础在调用任何语义代理之前完成：',
        unicode: 'D(x) → 章节/段落/锚点；S = 冻结主张主线；L = 持久账本',
        symbols: [
          { sym: 'D(x)', desc: '确定性分解：将论文切成稳定可寻址单元' },
          { sym: 'S', desc: '冻结主张主线：保护核心主张不被悄悄改写' },
          { sym: 'L', desc: '持久账本：记录问题身份/证据/裁决/补丁历史' },
        ],
      },
      takeaways: [
        { icon: '📑', title: '先分解', desc: '分解在语义调用前完成，创建稳定可寻址单元。' },
        { icon: '🔒', title: '冻结主线', desc: '编辑可修措辞，但不可悄悄改写主张。' },
        { icon: '🗂️', title: '持久账本', desc: '每个问题跨轮次有稳定身份，支持路由、关闭与精确一次修订。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '有界整体审稿与合并',
      badge: 'both',
      badgeLabel: '方法组件',
      bridge:
        '法庭不会让一个人看完整卷就定案，而是组织多位审稿人各自独立阅读全卷再合并意见。人数不是越多越好：多了成本高，少了有盲区。',
      analogy: {
        title: '三位陪审员同读一份卷宗',
        text: 'N∈[2,4] 位审稿人（默认 3）各读全文一次，输出带证据锚点的弱点；反 skim 检查防止走马观花；合并去重后进入持久账本，问题身份跨轮次稳定。',
        componentId: 'ana5',
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '审稿人数调节器',
          desc: '拖动滑块调节审稿人数 N=2/3/4，观察覆盖度提升与成本上升的权衡，以及漏检风险的变化。',
          componentId: 'ch5mod1',
        },
        {
          kind: 'module',
          id: '5.2',
          title: '审稿人数与覆盖成本',
          desc: '拖动滑块调节审稿人数 N（2-4），同时观察覆盖度、Token 成本与漏检风险三个指标。',
          componentId: 'ch5count',
        },
      ],
      takeaways: [
        { icon: '👥', title: '有界', desc: '审稿人数限制在 [2,4]、默认 3，控制三难困境。' },
        { icon: '👀', title: '整体读', desc: '跨章节一致性问题只有整体审视才能发现。' },
        { icon: '📋', title: '反 skim', desc: '逐节引用验证→覆盖审计→定向重读，防止浅读。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '可争议性路由',
      badge: 'inf',
      badgeLabel: '方法组件',
      bridge:
        '不是所有投诉都需要开庭审判：交通违章可以快速处理（polish），重大刑事案件必须走完整庭审（trial）。路由的目标是把昂贵审判资源用在"第一判断出错后果最严重"的案件上。',
      analogy: {
        title: '法警分流案件',
        text: '机械性问题（拼写、格式）= 快速通道；可争议的实质性重大问题 = 完整庭审。路由是确定性规则，不由模型心情决定。',
        componentId: 'ana6',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '问题路由模拟器',
          desc: '点击不同的问题卡片，观察确定性路由将每个问题送入 polish 快速通道还是 due-process 正当程序审判。',
          componentId: 'ch6mod1',
        },
        {
          kind: 'module',
          id: '6.2',
          title: '章节测验 · 可争议性路由',
          desc: '检验你对确定性路由规则的理解：什么样的问题会进入正当程序审判。',
          componentId: 'quiz-block',
        },
        {
          kind: 'module',
          id: '6.3',
          title: '路由演练：六个问题各归其道',
          desc: '点击问题卡片，亲手验证机械性/次要/重大三类问题分别被路由到 polish 还是 trial。',
          componentId: 'ch6route',
        },
      ],
      takeaways: [
        { icon: '🧭', title: '确定性', desc: '路由是确定性规则，不是模型的自由裁量。' },
        { icon: '⚡', title: '低成本', desc: '机械性与次要实质性问题走 polish 路径。' },
        { icon: '⚖️', title: '重大开庭', desc: '可争议的实质性重大问题进入正当程序审判。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-7',
      title: '正当程序审判',
      badge: 'trn',
      badgeLabel: '方法组件',
      bridge:
        '审判中，辩护律师从全案角度论证指控不成立，陪审团聚焦具体证据独立判断——两者互不见面、互不干扰，防止"先入为主"的污染。分歧过大时可升级到更大陪审团。',
      analogy: {
        title: '陪审员举牌投票',
        text: '全文辩护（whole-paper defense）用全局上下文反驳指控；去相关的局部陪审团（local-context jury）只看局部证据独立投票；裁决由代码按 quorum + majority 计算。',
        componentId: 'ana7',
      },
      modules: [
        {
          kind: 'module',
          id: '7.1',
          title: '陪审团投票与裁决计算',
          desc: '拖动滑块调整"指控成立"的支持票比例与陪审团规模，观察 quorum、majority 检查与三向终局裁决如何由代码算出。',
          componentId: 'ch7mod1',
        },
        {
          kind: 'module',
          id: '7.2',
          title: '章节测验 · 审判去相关',
          desc: '判断题：辩护方与陪审团是否共享上下文？检验你对正当程序审判核心机制的理解。',
          componentId: 'quiz-block',
        },
        {
          kind: 'module',
          id: '7.3',
          title: '核心符号速查 · 审判',
          desc: 'i、cᵢ、T(i)、q、m、vᵢ：掌握正当程序审判阶段的 6 个核心符号。',
          componentId: 'symbol-cards',
        },
        {
          kind: 'module',
          id: '7.4',
          title: '审判内部流程演示',
          desc: '辩护方陈述 → 陪审团投票 → quorum+majority 裁决 → 三向结果，逐步演示审判的 5 个环节。',
          componentId: 'step-animator',
        },
        {
          kind: 'module',
          id: '7.5',
          title: '漫画图解：正当程序审判',
          desc: '辩护律师与陪审团互不见面、独立举证，法官按规则计算裁决。',
          componentId: 'comic-strip',
        },
        {
          kind: 'module',
          id: '7.6',
          title: '陪审团投票模拟',
          desc: '调节陪审团规模与支持票分布，直观体验 quorum 与 majority 的双重门槛如何产生三向裁决。',
          componentId: 'ch7vote',
        },
      ],
      formula: {
        lead: '终局裁决由确定性代码计算，而非单个语义法官：',
        unicode: 'vᵢ = Verdict(T(i), q, m) ∈ {invalid-drop, valid-fixable, author-required}',
        symbols: [
          { sym: 'T(i)', desc: '问题 i 的正当程序审判（辩护+陪审团）' },
          { sym: 'q', desc: '法定人数阈值 quorum' },
          { sym: 'm', desc: '多数阈值 majority' },
        ],
      },
      takeaways: [
        { icon: '🛡️', title: '去相关', desc: '全文辩护与局部陪审团隔离，防止互相污染。' },
        { icon: '🧮', title: '代码裁决', desc: '裁决由代码计算，不是单个语义法官说了算。' },
        { icon: '🔀', title: '三向结果', desc: '区分"问题是否成立"与"是否可机器编辑"。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-8',
      title: '守卫修订：安全编辑的构造',
      badge: 'trn',
      badgeLabel: '关键技术',
      bridge:
        '法庭执行阶段有严格安检：一份补丁就像一份执行令，必须经过锚点检查、交叉引用检查、语义审计、编译检查四道关卡。低风险补丁走快速通道，高风险补丁触发更严格审计；通过后精确一次应用并记录日志、可回滚。',
      analogy: {
        title: '安检门：危险补丁被挡回',
        text: '锚定边界编辑=执行令限定范围；风险比例守卫链=安检等级随风险调整；精确一次应用=执行令只执行一次；日志=执行记录，可回滚。',
        componentId: 'ana8',
      },
      modules: [
        {
          kind: 'module',
          id: '8.1',
          title: '守卫链：风险比例安检',
          desc: '先用芯片选择补丁风险等级（LOW / RISKY / 无守卫），再逐步走完锚点→引用→语义→编译四道检查，观察哪些补丁被放行、哪些被阻断。',
          componentId: 'ch8mod1',
        },
        {
          kind: 'module',
          id: '8.2',
          title: '核心符号速查 · 编辑',
          desc: 'Pᵢ、ρᵢ、G(Pᵢ)、A：掌握守卫修订阶段的 4 个核心符号。',
          componentId: 'symbol-cards',
        },
        {
          kind: 'module',
          id: '8.3',
          title: '漫画图解：守卫关卡',
          desc: '一个编辑补丁如何通过四道安检，危险补丁被挡回、安全补丁精确一次落地。',
          componentId: 'comic-strip',
        },
        {
          kind: 'module',
          id: '8.4',
          title: '编辑安全漏斗',
          desc: '对比三种方法的应用编辑数与危险编辑数：PaperJury 编辑更少、危险更少、违规率最低。',
          componentId: 'ch10funnel',
        },
        {
          kind: 'module',
          id: '8.5',
          title: '守卫链四步演示',
          desc: '点击"下一步"，看补丁依次通过锚点/交叉引用/语义/编译四道检查，在第 3 步被语义审计拦截。',
          componentId: 'ch8guard',
        },
      ],
      formula: {
        lead: '只有裁决为 valid-fixable 且守卫链通过的补丁才会被应用：',
        unicode: 'A = {Pᵢ | vᵢ = valid-fixable ∧ G(Pᵢ) = pass}',
        symbols: [
          { sym: 'Pᵢ', desc: '针对问题 i 提出的补丁' },
          { sym: 'G(Pᵢ)', desc: '守卫链总结果 ∈ {pass, fail}' },
          { sym: 'A', desc: '精确一次应用的有效编辑集合' },
        ],
      },
      takeaways: [
        { icon: '🚪', title: '只修可修', desc: '仅 valid-fixable 被编辑；invalid-drop 与 author-required 不动文本。' },
        { icon: '🛂', title: '风险比例', desc: '锚点/引用/语义/编译四关，风险越高审计越严。' },
        { icon: '📜', title: '可回滚', desc: '精确一次应用+日志记录，防止重复编辑与状态不一致。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-9',
      title: '收敛与确定性停止',
      badge: 'trn',
      badgeLabel: '实践机制',
      bridge:
        '法庭不能无限期开庭，但"是否审完"不能由被告自己说——就像不能让提案者自我认证完成。PaperJury 用确定性的账本查询判定停止：当新一轮没有新问题、已关闭问题达到阈值时自动停止。',
      analogy: {
        title: '法官敲槌宣布休庭',
        text: 'Clean re-review=每次重读当前文本、不沿用上次意见；停止谓词 τ=法官根据案件状态宣布休庭；五轮上限 K=5=司法审限。',
        componentId: 'ana9',
      },
      modules: [
        {
          kind: 'module',
          id: '9.1',
          title: '轮次收敛模拟器',
          desc: '点击"进入下一轮"，观察每轮新增问题 Uᵣ 与关闭问题 Cᵣ 的变化，以及确定性谓词 τ 如何判定收敛停止。',
          componentId: 'ch9mod1',
        },
        {
          kind: 'module',
          id: '9.2',
          title: '章节测验 · 流水线排序',
          desc: '排序题：把 PaperJury 完整流水线的 7 个步骤按正确顺序排列。',
          componentId: 'quiz-block',
        },
        {
          kind: 'module',
          id: '9.3',
          title: '多轮收敛演示',
          desc: '点击"下一轮"观察 4 轮 clean re-review 中新增/关闭问题的变化，体验确定性停止谓词触发的瞬间。',
          componentId: 'ch9rounds',
        },
      ],
      formula: {
        lead: '停止由确定性账本查询判定，而非模型自我评估：',
        unicode: 'τ(L, Uᵣ, Cᵣ, r) = true → 停止；r ≤ 5',
        symbols: [
          { sym: 'Uᵣ', desc: '第 r 轮真正的新增问题' },
          { sym: 'Cᵣ', desc: '第 r 轮关闭的问题' },
          { sym: 'τ', desc: '确定性停止谓词（账本状态+硬限制）' },
        ],
      },
      takeaways: [
        { icon: '🔄', title: '干净重审', desc: '每轮重读当前文本，不沿用先前批评。' },
        { icon: '🛑', title: '确定性停止', desc: '收敛由账本查询认证，不由模型自我评估。' },
        { icon: '⏱️', title: '五轮上限', desc: '硬执行限制防止无限循环。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-10',
      title: '实验验证与核心结论',
      badge: 'both',
      badgeLabel: '实验与结论',
      bridge:
        '判决需要证据。PaperJury 在 12 篇 held-out 论文（Vision/NLP/ML 各 4 篇）上做双臂专家评估，与 4 个基线对比：问题质量、裁决质量、编辑安全、收敛行为与成本全面领先。',
      analogy: {
        title: '记分牌：PaperJury 领先',
        text: '主结果：F1=0.656（对比 Judge Loop 0.519）；审计精确率 0.847；裁决一致性 0.887、路由一致性 0.913；ESVR=0.025（对比 0.110）；约 3 轮收敛、从未触顶。',
        componentId: 'ana10',
      },
      modules: [
        {
          kind: 'module',
          id: '10.1',
          title: '主结果竞速：F1 对比',
          desc: '按下"开始对比"，五个系统从同一基线出发竞速到各自 F1 值——观察 PaperJury 如何以接近 Judge Loop 的成本取得最高 F1。',
          componentId: 'ch10mod1',
        },
        {
          kind: 'module',
          id: '10.2',
          title: '消融实验：哪个组件最关键',
          desc: '切换指标（F1 / 裁决一致性 / ESVR / 时间），对比去掉各组件后的退化幅度，理解每个组件的功能定位。',
          componentId: 'ch10mod2',
        },
        {
          kind: 'module',
          id: '10.3',
          title: '主结果图表：指标切换',
          desc: '切换 8 项指标查看 5 种方法的对比柱状图与完整数据表，理解 PaperJury 的质量-成本优势。',
          componentId: 'ch10main',
        },
        {
          kind: 'module',
          id: '10.4',
          title: '成本-质量散点图',
          desc: '悬停数据点查看各系统的质量-成本位置：右上角（高质量+低耗时）是最优区。',
          componentId: 'ch10cost',
        },
        {
          kind: 'module',
          id: '10.5',
          title: '分领域对比',
          desc: 'Vision / NLP / ML 三个领域切片对比：所有指标与汇总值相差 0.03 以内，效果跨领域稳定。',
          componentId: 'ch10domain',
        },
        {
          kind: 'module',
          id: '10.6',
          title: '结尾综合测验',
          desc: '四道结尾综合题：实验数据、消融归因、设计哲学与组件匹配，检验你的完整理解。',
          componentId: 'quiz-block',
        },
        {
          kind: 'module',
          id: '10.7',
          title: '核心符号速查 · 评估',
          desc: 'F1、ESVR：掌握评估阶段的核心指标符号及其方向。',
          componentId: 'symbol-cards',
        },
        {
          kind: 'module',
          id: '10.8',
          title: '论文图表库',
          desc: '论文全部 5 张图与 6 张表，支持关键词搜索、类型与章节筛选、点击放大查看。',
          componentId: 'figure-gallery',
        },
        {
          kind: 'module',
          id: '10.9',
          title: '消融瀑布图：组件贡献',
          desc: '切换 Δ F1 / Δ Acc_v / Δ ESVR 三种视角，以瀑布图直观看移除每个组件造成的退化幅度。',
          componentId: 'ch10water',
        },
      ],
      takeaways: [
        { icon: '🏆', title: '全面领先', desc: 'F1=0.656，12 篇论文上对每个问题生成基线均获胜。' },
        { icon: '🛡️', title: '安全 4.4 倍', desc: 'ESVR=0.025，是 Judge Loop 的 1/4.4（守卫链阻断 17% 补丁）。' },
        { icon: '🔬', title: '组件归因', desc: '守卫链对安全最关键（+0.152 ESVR），审判对裁决质量最关键（-0.153 Accᵥ）。' },
      ],
    },
  ],
};
