import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'Adoption and Ecosystem Health: A Longitudinal Analysis of Open-Source Multi-Agent Frameworks',
    titleZh: '开源多智能体框架的采用与生态健康：一项纵向分析',
    venue: 'https://arxiv.org/abs/2607.02453',
    authors: 'Xi Zhang, Papi Menon, Vivian Chu, Koray Cosguner',
    affiliation: 'Cisco Systems; Indiana University',
    domain: '开源 Agent 框架生态 / GitHub 纵向数据分析',
    coreProblem: 'Agent 框架数量快速增长且技术侧重点持续分化，框架选择已成为重要工程决策；但 star、贡献者数和 PR 数都可能把“被看见”误写成“被采用”。',
    coreInsight: '本文对 15 个开源 Agent 框架进行纵向分析，指出 <b>Star 不等同于生态健康</b>，贡献者密度、跨生态参与和留存率能为工程选型提供更可靠的依据。',
    keywords: ['Agent 框架', 'GitHub 生态', '贡献者密度', '跨生态贡献', '贡献者留存'],
  },
  hero: {
    oldMethod: {
      desc: '只看 star，AutoGPT 以 <b>182,405</b> 排名第一。但它在 2023 年 4 月单月获得 <b>111,967</b> 个 star，单一快照无法解释关注如何形成。',
      componentId: 'eco-overview',
    },
    newMethod: {
      desc: '论文从关注度、采用深度和贡献者留存三层分析，并加入贡献者密度与跨生态连接，区分<b>流行</b>与<b>健康</b>。',
      componentId: 'eco-overview',
    },
  },
  chapters: [
    {
      kind: 'chapter', id: 'chap-1', title: '面对 15 个 Agent 框架，我们该如何选择', badge: 'inf', badgeLabel: '研究背景',
      bridge: '自 ChatGPT 发布以来，开源 Agent 框架迅速增多，并在编排范式、开发体验、可靠性与厂商生态上形成不同路线。框架一旦进入生产系统，其接口、组件、团队经验和维护节奏都会沉淀为长期依赖；选型失误可能带来迁移成本、技术债与生态收缩风险。<b>因此，团队需要判断的不只是“能否完成当前任务”，还包括“是否拥有持续建设者与健康生态”。</b>',
      analogy: {
        title: '本章问题：这些框架真的可以只排一张总榜吗？',
        text: '先沿发布时间观察 15 个框架的出现顺序和技术侧重。框架能力并不完全同质，因此任何排名都必须先说明它回答的究竟是什么问题。',
        componentId: 'eco-analogy',
      },
      modules: [
        { kind: 'module', id: '1.1', title: '15 个框架沿发布时间线展开', desc: '时间轴按仓库创建时间排列，从 2022 年 10 月的 LangChain 延伸到 2025 年 4 月的 Google ADK 与 Microsoft Agent Framework。', componentId: 'eco-framework-landscape' },
        { kind: 'module', id: '1.2', title: '五类 Agent 框架的能力侧重对照', desc: '横向比较不同类型的 Agent 框架，纵向观察它们在编排控制、协作方式、工程可靠性、开发体验和生态关系上的差异。', componentId: 'eco-framework-comparison' },
        { kind: 'module', id: '1.3', title: '常见指标分别会漏掉什么', desc: '', componentId: 'eco-metric-blindspots' },
      ],
      insight: '<strong>框架不同，指标回答的问题也不同</strong><span>15 个框架的技术定位并不相同；Star、贡献者总数和 PR 数也只呈现生态的不同侧面，任何单项排名都不足以解释框架是否被持续采用。</span><b>下面以 AutoGPT 的 Star 排名为例，看看现有指标暴露出的问题：它以 182,405 个累计 Star 位居第一，但这一结果究竟来自持续关注，还是一次短期爆发？</b>',
      takeaways: [
        { icon: '01', title: '现象', desc: 'Agent 框架数量增加，技术路线从实验性自主循环走向生产化与厂商 SDK。' },
        { icon: '02', title: '问题', desc: '不同框架侧重点不同，工程团队却需要做长期生态选择。' },
        { icon: '03', title: '追问', desc: '如果只能看到一张排行榜，它是否真的足以支持选型？' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-2', title: 'Star 第一，是否就最值得选择', badge: 'inf', badgeLabel: '问题暴露',
      bridge: '先按照最常见的 star 口径查看排名，AutoGPT 会明确到达第一。随后把快照切换为时间轨迹，关注同一个第一名的增长是如何发生的。',
      analogy: {
        title: '根据累计 Star 数据，AutoGPT 真的是最值得被选择的吗？',
        text: '',
      },
      modules: [
        { kind: 'module', id: '2.1', title: '从 Star 排行榜切换到 AutoGPT 的月度变化', desc: '', componentId: 'eco-star-trajectories' },
        { kind: 'module', id: '2.2', title: '累计 Star 中的异常信号', desc: '', componentId: 'eco-anomaly-signals' },
      ],
      insight: '<strong>Star 可以回答“谁被看见”</strong><span>但不能单独回答“谁被真正采用”。</span><b>问题因此自然转向：还需要哪些证据，才能评价一个框架的生态健康？</b>',
      takeaways: [],
    },
    {
      kind: 'chapter', id: 'chap-3', title: '论文如何评价 Agent 框架的生态健康', badge: 'both', badgeLabel: '论文回答',
      bridge: '论文没有把所有指标混成一个总分，而是把生态健康拆成三个层次。每一层回答一个不同问题，并为下一层留下新的追问。',
      analogy: {
        title: '本章问题：如何从流行走向生态健康？',
        text: '关注度回答谁被看见，采用深度回答谁在建设，贡献者留存回答谁愿意回来。跨生态连接则进一步说明框架是否成为多个项目共同使用的基础层。',
        componentId: 'eco-analogy',
      },
      modules: [
        { kind: 'module', id: '3.2', title: '研究样本与数据边界', desc: '数据覆盖 15 个主要开源框架从仓库创建到 2026 年 3 月的公开历史，并排除已识别的机器人账号与非代码贡献者。', componentId: 'eco-study-scope' },
      ],
      takeaways: [],
    },
    {
      kind: 'chapter', id: 'chap-4', title: '评价指标：贡献者数量与贡献者密度', badge: 'both', badgeLabel: '采用深度',
      bridge: '本章问题：高关注是否意味着高参与？',
      analogy: {
        title: '本章问题：高关注是否意味着高参与？',
        text: '先把 15 个框架放在只有 star 的一维横轴上，再展开贡献者纵轴；最后把同一批框架从 star 排名重排为贡献者密度排名。',
        componentId: 'eco-analogy',
      },
      modules: [
        { kind: 'module', id: '4.1', title: '二维采用散点图：逐点理解框架位置', desc: '散点图同时比较累计 Star 与代码贡献者数量；横纵中位线将框架分为四类，下方解读区给出当前框架的位置含义。', componentId: 'eco-adoption-scatter' },
        { kind: 'module', id: '4.2', title: 'Star 排名与贡献者密度排名对照', desc: '', componentId: 'eco-density-ranking' },
      ],
      insight: '<strong>本页总结：关注度不等于参与深度</strong><div class="adoption-summary-grid"><section><b>贡献者数量</b><span>回答“有多少人在建设”，反映代码参与规模。</span></section><section><b>贡献者密度</b><span>回答“关注转化出多少建设者”，反映参与转化效率。</span></section></div><em>两个指标结合，才能区分“被广泛看见”与“形成深度采用”：高 Star 可能对应低转化，低 Star 也可能孕育活跃的建设者社区。</em>',
      takeaways: [],
    },
    {
      kind: 'chapter', id: 'chap-5', title: '评价指标：跨生态连接', badge: 'both', badgeLabel: '跨生态连接',
      bridge: '<b>谁是重要的框架连接者？</b><br />连接者位于多个项目共同贡献关系的枢纽，更容易汇聚跨框架的工程经验、人才与互操作实践。选型时，这通常意味着更广的协作基础、更低的生态孤立风险和更强的集成可能性，但仍需结合贡献深度与留存共同判断。',
      analogy: {
        title: '本章问题：谁连接了不同框架的贡献者？',
        text: '网络中的节点代表框架，边代表同时参与两个不同组织框架的贡献者。边越粗，共同贡献者越多；它反映关联与互操作，但不建立因果。',
        componentId: 'eco-analogy',
      },
      modules: [
        { kind: 'module', id: '5.1', title: '连线逐步揭示跨生态贡献网络', desc: '网络中的节点代表框架，边代表同时参与两个不同组织框架的贡献者。边越粗，共同贡献者越多；它反映关联与互操作，但不建立因果。', componentId: 'eco-cross-network' },
      ],
      insight: '<strong>跨生态连接揭示两类框架价值</strong><div class="ecosystem-role-grid"><section><div class="role-heading"><span>桥梁型枢纽</span><b>LangChain</b></div><div class="bridge-role-graphic"><div><i>LangFlow</i><i>CrewAI</i><i>Pydantic-AI</i></div><span>68%–87%<small>贡献者重合</small></span><b>LangChain</b></div><div class="role-reason"><b>可能的技术基础</b><span><strong>LangChain 的可组合原语被下游项目复用</strong>：CrewAI 早期基于其核心，LangFlow 直接集成其组件；Pydantic-AI 的重合仅表明跨项目参与，不能据此确定技术依赖的因果。</span></div></section><section><div class="role-heading"><span>隐藏瑰宝</span><b>Pydantic-AI · Google ADK</b></div><div class="gem-role-graphic"><div><b>15,950</b><span>Pydantic-AI Star</span></div><em>中位数<br />26,295</em><div><b>18,460</b><span>Google ADK Star</span></div></div><div class="role-reason"><b>可能的工程因素</b><span>Pydantic-AI 强调类型安全、验证和结构化输出，Google ADK 强调模块化、可测试性与部署可靠性；<strong>这些特性可能吸引资深工程贡献者</strong></span></div></section></div><div class="ecosystem-choice"><b>选型参考</b><span>重生态兼容与集成 → 桥梁型框架</span><span>重工程质量与生产可靠性 → 隐藏瑰宝</span></div>',
      takeaways: [],
    },
    {
      kind: 'chapter', id: 'chap-6', title: '评价指标：贡献者留存', badge: 'both', badgeLabel: '留存与结论',
      bridge: '<strong class="retention-explore">探索社区黏性</strong><span class="retention-impact">贡献者持续回归意味着更稳定的维护与知识积累，可帮助选型判断框架是否具备长期演进能力。</span>',
      analogy: {
        title: '本章问题：高留存是否一定代表自然社区健康？',
        text: '曲线需要与早期队列规模和母组织关联比例一起阅读。小样本或组织化工程投入都可能产生高留存，不能只比较曲线终点。',
        componentId: 'eco-analogy',
      },
      modules: [
        { kind: 'module', id: '6.1', title: '留存曲线与时间检查点', desc: '', componentId: 'eco-retention-curves' },
        { kind: 'module', id: '6.2', title: '30 天留存比例和母组织人数占比', desc: '', componentId: 'eco-retention-context' },
      ],
      insight: '<strong class="paper-summary-title">论文总结</strong><div class="paper-summary-method"><div class="paper-summary-section-head"><span>01</span><b>方法：用过程证据评价生态健康</b></div><div class="paper-summary-data"><b>公开 GitHub 纵向数据</b><span>15 个仓库</span><span>808,042 Stars</span><span>73,997 PRs</span><span>86,241 Commits</span><span>987,330 Profiles</span></div><div class="paper-summary-method-flow"><section><b>关注度</b><span>Star 轨迹与异常</span></section><i>→</i><section><b>采用深度</b><span>贡献者数量与密度</span></section><i>→</i><section><b>生态连接</b><span>跨框架共同贡献</span></section><i>→</i><section><b>贡献者留存</b><span>Day 30–360 回归</span></section></div></div><div class="paper-summary-finding"><b>流行不等于健康</b><p>Star 只能说明“被看见”；贡献者规模与密度说明“谁在建设”，跨生态连接说明“谁在连接”，留存说明“谁持续回来”。多层证据比单一热度更接近公开开源生态的健康状况。</p></div><div class="paper-summary-evidence"><div class="paper-summary-section-head"><span>02</span><b>证据边界与下一步验证</b></div><div class="paper-summary-evidence-head"><b>局限性</b><i></i><b>未来研究</b></div><div class="paper-summary-evidence-row"><p><b>样本范围</b>偏向英语、GitHub 开源项目，并存在幸存者偏差</p><i>→</i><p><b>扩展生态</b>纳入非 Python、非 GitHub 及早期或已归档项目</p></div><div class="paper-summary-evidence-row"><p><b>观察窗口</b>部分新框架仅有 11–15 个月历史</p><i>→</i><p><b>持续跟踪</b>按 6 个月和 12 个月间隔复查采用与留存</p></div><div class="paper-summary-evidence-row"><p><b>活动口径</b>仅覆盖公开 PR 与 Commit 作者，遗漏审阅、Issue、私有分支和企业镜像</p><i>→</i><p><b>补充使用信号</b>结合包下载、部署数据与更完整的非代码贡献</p></div><div class="paper-summary-evidence-row"><p><b>解释边界</b>异常、组织关联和跨生态网络只能识别模式，不能确立因果</p><i>→</i><p><b>验证机制</b>通过开发者调查、访谈和自然实验检验解释</p></div></div><div class="paper-summary-boundary"><b>最终边界</b><span>这些结果比较的是公开开源生态信号，不能直接等同于真实生产部署、框架质量或因果机制。</span></div>',
      takeaways: [],
    },
  ],
};
