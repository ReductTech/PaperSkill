import type { TutorialData } from '../types';

const componentId = 'agentswing-lab';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'AgentSwing: Adaptive Parallel Context Management Routing for Long-Horizon Web Agents',
    titleZh: 'AgentSwing：长程网页智能体的自适应并行上下文管理路由',
    venue: 'arXiv:2603.27490v1, 2026',
    authors:
      'Zhaopeng Feng, Liangcai Su, Zhen Zhang, Xinyu Wang, Xiaotian Zhang, Xiaobin Wang, Runnan Fang, Qi Zhang, Baixuan Li, Shihao Cai, Rui Ye, Hui Chen, Jiang Yong, Joey Tianyi Zhou, Chenxiong Qian, Pengjun Xie, Bryan Hooi, Zuozhu Liu, Jingren Zhou',
    affiliation: 'Tongyi Lab, Alibaba Group',
    domain: '长程网页智能体 / 上下文管理 / 测试时路由',
    coreProblem:
      '这篇论文处理的是长程网页智能体的上下文管理问题。智能体拿到一个用户问题后，会一边搜索网页，一边把自己的思考、工具调用和网页返回写进上下文。任务拖得越久，这份上下文越像一份混杂的办案记录：里面有能支持答案的证据，也有错误猜测、重复搜索和失败的工具返回。如果这种上下文不加以管理，会严重影响智能体的决策质量。',
    coreInsight:
      'AgentSwing-当上下文快装不下时，把当前轨迹处理成三种版本，让三条分支都往前跑，再选择看起来最能继续完成任务的那条。',
    keywords: ['Problem', 'Motivation', 'Method', 'Result', '输入输出'],
  },
  hero: {
    oldMethod: {
      desc:
        '上下文管理器在整次任务里只用一种处理方式。每次都选择Summary/只Keep-Last-N N 轮/Discard-All历史这几种处理方式。问题是：有时Keep-Last-N几轮刚出现关键线索，有时Keep-Last-N几轮全是失败动作。固定策略看不到这种变化，选错处理方式会导致智能体走向错误方向。',
      componentId,
    },
    newMethod: {
      desc:
        'AgentSwing 在上下文超限时，对同一轨迹并行生成 Discard-All、Summary、Keep-Last-N 三种管理上下文，各自前瞻探索 3 轮后由模型选出最有前景的分支继续，其余丢弃。AgentSwing 的收益来自：1）并行保留选择空间；2）前瞻路由让模型看到短程未来，选出最有前景的分支。',
      componentId,
    },
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: 'Problem：网页智能体工作的轨迹 τ',
      badge: 'inf',
      badgeLabel: 'Problem',
      bridge:
        '网页智能体的工作是，接收用户问题 q，然后反复搜索、访问网页、使用工具返回、修改自己的假设。每一轮都会把新内容写进上下文，整串记录记作轨迹 τ。',
      analogy: {
        title: '任务对象',
        text:
          '输入用户问题 q，输出最终答案 a。中间的“模型思考、工具调用、工具返回”的日志就是本文要管理的对象，轨迹 τ。AgentSwing 后面的所有处理都发生在这条轨迹 τ 上。',
        componentId,
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '轨迹 τ 由什么组成',
          desc:
            '原始轨迹日志：<span class="trajectory-example"><span class="te-root">τ = [</span><br/><span class="te-q">  q: "Find the song. The clue points to a person who was born on October 3, is a Libra, and joined the Cambodian Crips at age 14."</span><br/><br/><span class="te-turn">  turn 23:</span><br/><span class="te-thinking">  &lt;thinking&gt;<br/>  The biographical clues match $tupid Young: born October 3, Libra, Cambodian Crips at 14. I should verify this person first, then search which song connects to these clues.<br/>  &lt;/thinking&gt;</span><br/><br/><span class="te-call">  &lt;tool_call&gt;<br/>  Search(query="$tupid Young October 3 Libra Cambodian Crips song")<br/>  &lt;/tool_call&gt;</span><br/><br/><span class="te-response">  &lt;tool_response&gt;<br/>  Search result snippet: "$tupid Young was born on October 3, 1992. His zodiac sign is Libra. He joined the Cambodian Crips at age 14."<br/>  &lt;/tool_response&gt;</span><br/><span class="te-root">]</span></span>分为用户问题 q、模型思考、工具调用、工具返回四部分。',
          componentId,
        },
        {
          kind: 'module',
          id: '1.2',
          title: '轨迹变长后为什么会影响后续搜索',
          desc:
            '拖动轨迹长度。上下文窗口被轨迹占得越多，智能体留给后续搜索、验证和纠错的空间就越少。更麻烦的是，旧的错误猜测也会继续留在窗口里，影响模型下一步相信什么。',
          componentId,
        },
      ],
      insight:
        'AgentSwing 的输入是一条正在增长的运行轨迹 τ。论文的核心问题是：当轨迹长度超过模型上下文容量时，如何管理轨迹里的内容，让智能体继续往正确方向搜索。',
      formula: {
        lead: '论文在轨迹长度超过阈值时触发上下文管理。',
        unicode: '|τ| > r · L<sub>max</sub>',
        symbols: [
          { sym: '|τ|', desc: '当前轨迹 τ 的长度。它包含用户问题、模型思考、工具调用和工具返回。' },
          { sym: 'r', desc: '触发比例。论文实验中 GPT-OSS-120B 使用 0.2，DeepSeek-v3.2 和 Tongyi-DR 使用 0.4。' },
          { sym: 'L_max', desc: '模型最大上下文长度。论文实验统一设为 128k tokens。' },
        ],
      },
      takeaways: [
        { icon: '1', title: '输入', desc: '用户问题 q。' },
        { icon: '2', title: '轨迹', desc: '多轮思考、调用工具、读取返回形成 τ。' },
        { icon: '3', title: '输出', desc: '智能体最后给出答案 a。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: 'Problem：轨迹里混着哪些东西',
      badge: 'inf',
      badgeLabel: 'Problem',
      bridge:
        '长程网页任务难，轨迹 τ 里会同时出现几种性质完全不同的内容：有些内容能直接支持答案，有些内容会把搜索带偏，有些内容暂时看起来有希望但还没验证，还有一些只是工具失败留下的痕迹。',
      analogy: {
        title: '全部保留轨迹的问题',
        text:
          '模型每一步都会读当前上下文。上下文里留下的错误假设越多，模型越可能沿着旧方向继续查。工具失败如果反复出现，也会让智能体把预算花在同一个坏动作上。',
        componentId,
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '证据、噪声、待验证线索、工具失败',
          desc:
            '同一条轨迹里会混入性质不同的内容。点击每一类，下面会先解释它到底是什么，再给出具体轨迹片段，最后说明它会怎样影响智能体下一步搜索。',
          componentId,
        },
      ],
      insight:
        '系统不能简单按时间保留内容，也不能简单按长度删除内容。它要处理的是“这段轨迹里的信息现在还有没有用”。',
      takeaways: [
        { icon: '1', title: '证据', desc: '已经核实、能支持答案。' },
        { icon: '2', title: '噪声', desc: '错误假设、重复动作、无关网页。' },
        { icon: '3', title: '后果', desc: '智能体可能卡住，也可能带着错误上下文答错。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: 'Motivation：为什么要根据当前轨迹来选',
      badge: 'both',
      badgeLabel: 'Motivation',
      bridge:
        'Mando 案例是一个“根据人物线索找歌曲名”的任务，智能体在第 23 轮附近刚把“10 月 3 日出生、天秤座、14 岁加入 Cambodian Crips”这些条件连到 $tupid Young，最近几轮里有关键新证据。live-crickets 案例是一个“查某个人吃了什么活物”的任务，智能体最近几轮反复尝试从同一个 PDF 抽文本，但工具一直失败，最近轨迹主要是失败动作。前者需要保住最近线索继续查，后者需要摆脱失败循环重新搜索。',
      analogy: {
        title: '两个案例到底发生了什么',
        text:
          '<b>Mando 案例：</b>题目不是直接问“$tupid Young 的歌是什么”，而是给人物条件，让智能体自己查网页定位人物，再继续查歌曲。最近几轮刚找到 $tupid Young 的生日、星座和帮派经历，这些内容正在形成答案路径。此时清空历史会把新线索扔掉。<br/><br/><b>live-crickets 案例：</b>题目要找某个报道或材料里提到的“吃了什么活物”。智能体最近几轮卡在 PDF 抽取失败上，轨迹里主要是重复工具调用和失败返回。此时继续保留最近几轮，只会把失败循环带给下一轮模型。<details class="case-trace" open><summary>Mando 案例的具体轨迹状态</summary><div class="case-trace-log"><span class="te-root">任务 q</span><br/><span class="te-q">Find the song. The clue describes a person born on October 3, a Libra, who joined the Cambodian Crips at age 14.</span><br/><br/><span class="te-root">最近轨迹 near turn 23</span><br/><span class="te-thinking">&lt;thinking&gt;<br/>The biographical clues now point to $tupid Young. I should verify the profile, then connect this person to a song title.<br/>&lt;/thinking&gt;</span><br/><br/><span class="te-call">&lt;tool_call&gt;<br/>Search("$tupid Young born October 3 Libra Cambodian Crips song")<br/>&lt;/tool_call&gt;</span><br/><br/><span class="te-response">&lt;tool_response&gt;<br/>Result snippets say $tupid Young was born on October 3, 1992, is a Libra, and joined the Cambodian Crips at age 14.<br/>&lt;/tool_response&gt;</span><br/><br/><span class="te-root">说明</span><br/><span class="te-response">最近几轮刚出现能把题目条件连起来的关键证据。下一步应该沿着 $tupid Young 继续查歌曲名，所以 Keep-Last-N 更合适。</span></div></details><details class="case-trace"><summary>live-crickets 案例的具体轨迹状态</summary><div class="case-trace-log"><span class="te-root">任务 q</span><br/><span class="te-q">Find what live thing was eaten in the source material.</span><br/><br/><span class="te-root">最近轨迹</span><br/><span class="te-thinking">&lt;thinking&gt;<br/>The answer may be inside this PDF. I should extract the text and search within it.<br/>&lt;/thinking&gt;</span><br/><br/><span class="te-call">&lt;tool_call&gt;<br/>extract_text(pdf_url)<br/>&lt;/tool_call&gt;</span><br/><br/><span class="te-response">&lt;tool_response&gt;<br/>Error: failed to parse PDF text. No useful text extracted.<br/>&lt;/tool_response&gt;</span><br/><br/><span class="te-call">&lt;tool_call&gt;<br/>extract_text(the_same_pdf_url)<br/>&lt;/tool_call&gt;</span><br/><br/><span class="te-response">&lt;tool_response&gt;<br/>Error: failed to parse PDF text again.<br/>&lt;/tool_response&gt;</span><br/><br/><span class="te-root">说明</span><br/><span class="te-response">最近几轮没有新证据，主要是重复工具失败。保留最近几轮会把失败循环继续交给模型；回到原始问题重新搜索，才有机会找到“a mouthful of live crickets”。</span></div></details>',
        componentId,
      },
      modules: [],
      takeaways: [],
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: 'Motivation：已有的三种固定策略',
      badge: 'inf',
      badgeLabel: 'Motivation',
      bridge:
        '看完两个案例后，再看三种常见的静态上下文管理策略。所谓“固定策略”，是指系统一旦选了这种策略，后面每次触发上下文管理都按同一种规则处理 τ，不会根据当前轨迹里是新证据还是失败循环来换策略。',
      analogy: {
        title: '三种规则各有代价',
        text:
          'Summary把轨迹压成短文本；Keep-Last-N N 轮只留下最新交互；Discard-All历史只保留原始问题 q。它们的输入都是当前轨迹 τ，输出都是整理后的上下文。差别在于保留了什么、丢掉了什么。',
        componentId,
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '三种策略的输入输出',
          desc:
            '三个策略接收什么输入、内部怎样处理轨迹、输出什么上下文，以及放到 Mando 和 live-crickets 两个案例里会发生什么。',
          componentId,
        },
        {
          kind: 'module',
          id: '4.2',
          title: '策略判官：这一次该保留还是清空',
          desc:
            '先选择 Mando 或 live-crickets 场景，再选择一种固定策略。看清同一种策略在不同轨迹状态下怎样变成优势或风险。',
          componentId,
        },
      ],
      insight:
        '三种固定策略都有可用场景。问题是它们只会做一件事。当前轨迹需要保留新线索时，Discard-All历史会丢掉线索；当前轨迹陷入失败循环时，Keep-Last-N N 轮会把失败循环继续带下去。',
      formula: {
        lead: '三种静态策略可以写成三种对轨迹 τ 的变换。',
        unicode: 'τ → [q, summary(τ)],  τ → last_N(τ),  τ → [q]',
        symbols: [
          { sym: 'τ', desc: '当前完整运行轨迹。' },
          { sym: 'q', desc: '原始用户问题。Discard-All历史时只保留 q。' },
          { sym: 'last_N(τ)', desc: '从轨迹 τ 中取Keep-Last-N N 轮交互。' },
        ],
      },
      takeaways: [
        { icon: '1', title: 'Summary', desc: '保留大意，也可能保留错误主线。' },
        { icon: '2', title: 'Keep-Last-N N 轮', desc: '保留最新线索，也会丢早期证据。' },
        { icon: '3', title: 'Discard-All历史', desc: '摆脱噪声，也会丢掉已有证据。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: 'Method：AgentSwing 的输入和输出',
      badge: 'trn',
      badgeLabel: 'Method',
      bridge:
        'AgentSwing 是一个测试时控制流程。它只在上下文管理被触发时工作：先读取当前轨迹 τ 和原始问题 q，再把 τ 整理成几份不同的继续运行版本，让同一个智能体分别短程试跑，最后决定下一轮主流程应该沿着哪一份运行记录继续。',
      analogy: {
        title: '步骤',
        text:
          '<b>managed context</b> 指“管理后的上下文”：系统把原始轨迹 τ 按 Summary、Keep-Last-N 或 Discard-All 处理后，得到一份能交给智能体继续运行的上下文。<b>continuation</b> 指“后续轨迹”：智能体拿着某个 managed context 继续跑 K 轮后，新产生的思考、工具调用和工具返回。<b>τ_new</b> 指下一轮主流程实际使用的运行记录：它是“被选中的 managed context + 这条分支试跑出的 continuation”。后续智能体会把 τ_new 当作自己的当前轨迹继续搜索。',
        componentId,
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '输入 τ，输出 τ_new',
          desc:
            '三份 managed context 怎样试跑出 continuation；τ_new 具体怎样成为下一轮智能体看到的运行记录。',
          componentId,
        },
      ],
      insight:
        'AgentSwing 处理的是“智能体下一步该带着哪份上下文继续跑”',
      formula: {
        lead: 'AgentSwing 的接口可以写成：',
        unicode: 'τ<sub>new</sub> = AgentSwing(τ, q, K)',
        symbols: [
          { sym: 'τ', desc: '触发时的当前完整轨迹。' },
          { sym: 'q', desc: '原始用户问题。' },
          { sym: 'K', desc: '每条候选分支向前试跑的轮数。论文主实验使用 K=3。' },
          { sym: 'τ_new', desc: '下一轮主流程使用的新轨迹。它由被选中的 managed context 和该分支试跑出的 continuation 组成。' },
        ],
      },
      takeaways: [
        { icon: '1', title: '输入', desc: '当前轨迹 τ、问题 q、步数 K。' },
        { icon: '2', title: '中间', desc: '三份 managed context，各自试跑出 continuation。' },
        { icon: '3', title: '输出', desc: '接回主流程的新轨迹 τ_new。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: 'Method：并行生成三份 managed context',
      badge: 'trn',
      badgeLabel: 'Method',
      bridge:
        'AgentSwing 的第一步是 Parallel Context Management。系统从同一个 τ 同时生成三个版本，让Summary、Keep-Last-N N 轮和Discard-All历史都进入下一步比较。',
      analogy: {
        title: '同一个输入，三个候选版本',
        text:
          '这里的 managed context 就是“改写后的继续运行上下文”。三条分支拿到同一份原始轨迹 τ，但输出三份不同的继续运行上下文：<span class="formula-list"><span class="inline-formula">τ<sub>summary</sub> = [q, summary(τ)]</span><span class="inline-formula">τ<sub>lastN</sub> = last<sub>N</sub>(τ)</span><span class="inline-formula">τ<sub>discard</sub> = [q]</span></span>这一步只负责生成三份候选 managed context，还不判断哪一份最好。',
        componentId,
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '从 τ 到三条 managed context',
          desc:
            'AgentSwing 先把同一个原始轨迹 τ 处理成三条候选 managed context。它们是三份“让智能体接下来继续读什么”的上下文版本。',
          componentId,
        },
      ],
      insight:
        '并行生成分支的好处是保留选择空间。系统暂时不决定哪条路正确，而是先让三条路都产生可比较的后续行为。',
      formula: {
        lead: '并行上下文管理生成三条候选分支。',
        unicode: '<span class="formula-stack"><span>τ<sub>summary</sub> = [q, summary(τ)]</span><span>τ<sub>lastN</sub> = last<sub>N</sub>(τ)</span><span>τ<sub>discard</sub> = [q]</span></span>',
        symbols: [
          { sym: 'τ_summary', desc: 'Summary分支。它把原始问题 q 和 summary(τ) 放进 managed context。' },
          { sym: 'τ_lastN', desc: 'Keep-Last-N N 轮分支。它只保留轨迹 τ 最后 N 轮交互。' },
          { sym: 'τ_discard', desc: 'Discard-All历史分支。它只保留原始问题 q。' },
        ],
      },
      takeaways: [
        { icon: '1', title: '输入', desc: '同一个 τ。' },
        { icon: '2', title: '三分支', desc: 'Summary、Keep-Last-N N 轮、Discard-All历史。' },
        { icon: '3', title: '输出', desc: '三份 managed context。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-7',
      title: 'Method：试跑 K 轮后再路由',
      badge: 'trn',
      badgeLabel: 'Method',
      bridge:
        'AgentSwing 的第二步是 Lookahead Routing。三条 managed context 先各自继续运行 K 轮，新产生的这几轮日志叫 continuation。路由器读取原始轨迹 τ、三段 continuation 和一条选择指令，输出一个分支标签：summary、keep 或 discard。',
      analogy: {
        title: 'Router 选择后续轨迹',
        text:
          'continuation 是“这个分支真的继续跑 K 轮以后留下的新轨迹”。路由器的选择依据是四类信号：是否推进原问题、是否有工具返回证据、是否摆脱失败循环、是否保住关键线索。Summary 分支如果继续围着旧错误搜索，分支质量低；Keep-Last-N 分支如果验证了新证据，分支质量高。',
        componentId,
      },
      modules: [
        {
          kind: 'module',
          id: '7.1',
          title: 'Router 的输入和输出',
          desc:
            '点击原始轨迹、Summary、Keep-Last-N、Discard-All 和路由器。每个节点都会说明它给 Router 提供什么信息。Router 的输出是一个分支标签，标签对应后续主流程采用的 continuation。',
          componentId,
        },
      ],
      insight:
        '前瞻路由比直接选择策略多了一步证据：每条分支已经向前跑过 K 轮。路由器看到的是短程未来，因此可以区分“刚找到证据的 Keep-Last-N”和“继续重复失败的 Keep-Last-N”。',
      formula: {
        lead: '路由器的输入和输出可以写成：',
        unicode: 'selected = Router(τ, c_summary, c_lastN, c_discard)',
        symbols: [
          { sym: 'τ', desc: '触发时的原始轨迹，提供完整背景。' },
          { sym: 'c_i', desc: '第 i 份 managed context 试跑 K 轮后产生的 continuation，也就是新增加的几轮运行日志。路由器比较的是这些日志的质量。' },
          { sym: 'selected', desc: '被选中的分支。系统保留它对应的 managed context 和 continuation，作为后续主轨迹。' },
        ],
      },
      takeaways: [
        { icon: '1', title: '试跑', desc: '每份 managed context 运行 K 轮。' },
        { icon: '2', title: '比较', desc: '比较三段试跑出的 continuation。' },
        { icon: '3', title: '接回', desc: '选中的分支继续当主轨迹。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-8',
      title: 'Method：完整算法和 K 的消融',
      badge: 'trn',
      badgeLabel: 'Method',
      bridge:
        '完整算法是：触发上下文管理，生成三份 managed context；每份 managed context 让智能体继续试跑 K 轮，得到一段 continuation；路由器选择最有希望的 continuation，系统把它接回主轨迹。论文用消融实验检查 K 和前瞻路由是否真的有用。',
      analogy: {
        title: 'K 的作用',
        text:
          'K 太小，三条分支还没表现出差异；K 太大，试跑会消耗更多工具调用和上下文预算。论文主实验使用 K=3，Table 3 比较了随机选、不前瞻、K=1、K=3、K=5。',
        componentId,
      },
      modules: [
        {
          kind: 'module',
          id: '8.1',
          title: 'Table 3 说明什么',
          desc:
            '点击不同设置。随机选说明“只有并行分支还不够”；不前瞻说明“只看上下文本身还不够”；K=3 在论文报告的两组结果里最好。',
          componentId,
        },
      ],
      insight:
        '消融实验服务于方法解释。它说明 AgentSwing 的收益不只是来自多开几条分支，而是来自看过短程 continuation 后再做选择。',
      takeaways: [
        { icon: '1', title: '随机选', desc: '有分支，没有判断。' },
        { icon: '2', title: '不前瞻', desc: '有策略，没有试跑反馈。' },
        { icon: '3', title: 'K=3', desc: '论文主实验设置。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-9',
      title: 'Result：指标',
      badge: 'both',
      badgeLabel: 'Result',
      bridge:
        '论文用 Pass@1 看最终答对率。为了说明策略为什么会赢或输，论文又把 Pass@1 拆成 η 和 ρ。η 看智能体能不能走到终点，ρ 看走到终点后的答案准不准。',
      analogy: {
        title: '为什么要拆开看',
        text:
          '长程智能体有两种失败。第一种是搜索过程卡住，最后没能输出可判定答案。第二种是输出了答案，但答案被错误上下文带偏。η 对应第一种，ρ 对应第二种。Pass@1 同时受这两件事影响。',
        componentId,
      },
      modules: [
        {
          kind: 'module',
          id: '9.1',
          title: 'Table 1 的主结果',
          desc:
            '切换模型。灰色是该模型在每个基准上的最佳静态策略，绿色是 AgentSwing。表格中的数字是 Pass@1 百分比。',
          componentId,
        },
      ],
      insight:
        '实验使用 GPT-OSS-120B、DeepSeek-v3.2、Tongyi-DR-30B-A3B 三个大模型底座，在 BrowseComp、BrowseComp-ZH 和 HLE text-only 上评估。',
      formula: {
        lead: '论文用下面的分解解释不同上下文策略的取舍。',
        unicode: 'Pass@1<sup>π</sup> = η<sup>π</sup> · ρ<sup>π</sup>',
        symbols: [
          { sym: 'Pass@1^π', desc: '策略 π 下，一次运行最终答对的比例。' },
          { sym: 'η^π', desc: '搜索效率：任务是否能走到终点并输出答案。' },
          { sym: 'ρ^π', desc: '终端精度：已经输出答案时，答案是否正确。' },
        ],
      },
      takeaways: [
        { icon: '1', title: 'Pass@1', desc: '一次运行最终答对率。' },
        { icon: '2', title: 'η', desc: '有没有走到终点。' },
        { icon: '3', title: 'ρ', desc: '终点答案准不准。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-10',
      title: 'Result：结果和边界',
      badge: 'both',
      badgeLabel: 'Result',
      bridge:
        'Table 1 显示 AgentSwing 在三个模型底座、三个基准上都超过对应最佳静态策略。Table 2 进一步拆开看 η、ρ 和平均轮数，说明提升来自更合适的轨迹选择；单纯增加交互轮数解释不了这个结果。',
      analogy: {
        title: '最后该怎么汇报',
        text:
          '这篇论文的主结论是：长程网页智能体的上下文管理不能只靠固定规则。当前轨迹如果刚出现线索，就该保留；如果刚陷入失败循环，就该摆脱；如果历史太长但主线还清楚，Summary可能有用。AgentSwing 用短程试跑来做这个选择。',
        componentId,
      },
      modules: [
        {
          kind: 'module',
          id: '10.1',
          title: 'Table 2：η、ρ、Pass@1 和轮数',
          desc:
            '切换模型。Table 2 只看所有策略都能完成上下文管理的对齐样本，用来比较搜索效率、终端精度、最终答对率和平均交互轮数。',
          componentId,
        },
      ],
      insight:
        '论文也写了边界：当前 router 仍由 agent model 自己完成。后续可以把路由器、验证器或评价器做成更专门的模块。',
      takeaways: [
        { icon: '1', title: '结果', desc: 'AgentSwing 超过最佳静态策略。' },
        { icon: '2', title: '原因', desc: 'η 和 ρ 的折中更好。' },
        { icon: '3', title: '边界', desc: 'router 仍能继续改进。' },
      ],
    },
  ],
};
