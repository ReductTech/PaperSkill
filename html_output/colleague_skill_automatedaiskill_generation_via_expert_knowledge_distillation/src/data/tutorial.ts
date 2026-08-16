import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'COLLEAGUE.SKILL: Automated AI Skill Generation via Expert Knowledge Distillation',
    titleZh: 'COLLEAGUE.SKILL：把散落的人类痕迹蒸馏成可治理的技能工件',
    venue: 'arXiv:2605.31264v1 · 2026',
    authors: 'Tianyi Zhou, Dongrui Liu, Leitao Yuan, Jing Shao, Xia Hu',
    affiliation: '上海人工智能实验室',
    domain: 'Agent Skills · 专业经验蒸馏 · 工件生命周期',
    coreProblem: '当资深同事离开，工作判断仍散落在评审、邮件、事件记录和文档里。真正困难的不是把它们塞进上下文，而是让规则、来源、纠正历史和使用边界保持可见。',
    coreInsight: '论文把选定痕迹转化为<b>有边界、可检查、可组合、可纠正、可治理</b>的版本化技能包。它证明的是工件与工作流，不是数字克隆、行为忠实度或下游任务提升。',
    keywords: ['Trace → Evidence → Rule', '能力/行为双轨', '证据回溯', '纠正与回滚', '声明边界'],
  },
  hero: {
    oldMethod: { desc: '', componentId: 'expert-opening' },
    newMethod: { desc: '' },
  },
  chapters: [
    {
      kind: 'chapter', id: 'chap-1', title: '资深同事离开后，经验留在哪里？', badge: 'inf', badgeLabel: '问题动机',
      bridge: '资深同事离开后，聊天、邮件、评审和事件记录仍然存在，但它们只是散落的 Trace。S1 先用同一组材料比较两种保存方式，看看来源、局部纠正与历史版本能否被重新找到。',
      analogy: { title: '留下规则，还要留下它从哪里来', text: '“先检查 authentication”不是凭空出现的规则。只有把判断内容和 <b>Review #12</b> 这样的来源标识一起保存，后来的人才能检查、纠正并追溯。', componentId: 's1-evidence-analogy' },
      modules: [{ kind: 'module', id: '1.1', title: '同一组 Trace，放进两种工件后会发生什么？', desc: '<span class="s1-desc-lead">同一组输入，两种保存方式，三个检查问题。</span><span class="s1-desc-step"><b>1</b>选择 A：隐藏 Prompt / memory，或 B：COLLEAGUE.SKILL</span><span class="s1-desc-step"><b>2</b>依次追问：规则来自哪里？能否只改一条？能否回到旧版本？</span><span class="s1-desc-boundary">这里比较的是工件是否可检查、可局部修改、可回滚；不是比较回答准确率。</span>', componentId: 'trace-story' }],
      insight: '问题不只是知识散落，而是规则与原始痕迹之间缺少可检查、可维护的连接。',
      takeaways: [
        { icon: '🧩', title: '痕迹不是手册', desc: '材料存在，不等于判断已经被组织。' },
        { icon: '🔎', title: '来源必须可回到', desc: '规则要能反向连接原始证据。' },
        { icon: '⚖️', title: '概念对照有边界', desc: '论文没有证明所有既有方法都只是黑箱。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-2', title: '不是复制目标人物：我们到底要构造什么？', badge: 'inf', badgeLabel: '对象定义',
      bridge: '体验了黑箱的局限，下一问是：论文究竟要构造什么？答案不是“目标人物的数字副本”，而是由输入范围明确约束的技能工件。',
      analogy: { title: '不是复制目标人物，那到底要得到什么？', text: '论文要构造的不是虚幻的 AI Avatar，而是由 <b>p、c、D</b> 约束、可以检查与维护的 Person-Grounded Skill。', componentId: 'not-avatar-analogy' },
      modules: [{ kind: 'module', id: '2.1', title: '逐步构造 p、c、D，再检验 S=(A,M,L)', desc: '依次解锁画像、来源边界和范围内材料；敏感材料必须完成隐私确认才能构造。生成后亲自点亮五项属性，并在 Composable 中比较 FULL、WORK ONLY 与 PERSONA ONLY：三者共享 Metadata 与 Lifecycle，只改变加载的 Artifact 范围。', componentId: 'bounded-artifact' }],
      insight: '论文把研究对象收窄为一个可操作的软件工件，因此可以讨论文件、入口、版本、删除与分享。',
      formula: {
        lead: '轻量画像 p、来源范围 c 和范围内材料 D 共同决定输出工件。', unicode: '(p, c, D) → S = (A, M, L)',
        symbols: [
          { sym: 'p', desc: '任务所需的轻量画像，不是身份模型。' }, { sym: 'c', desc: '来源、授权与允许用途的范围。' },
          { sym: 'D', desc: '落在范围 c 内的选定材料集合。' }, { sym: 'A', desc: '生成的文件工件集合。' },
          { sym: 'M', desc: '机器可读元数据与安装信息。' }, { sym: 'L', desc: '版本、纠正计数与回滚历史等生命周期状态。' },
        ],
      },
      takeaways: [
        { icon: '📦', title: '对象是工件', desc: '目标不是目标人物的开放式数字分身。' }, { icon: '🧭', title: '边界进入输入', desc: '来源范围不是最后补上的免责声明。' },
        { icon: '🧱', title: '五项属性协同', desc: '便携、检查、组合、纠正与治理共同成立。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-3', title: '目标已经明确：Skill 是怎样被造出来的？', badge: 'both', badgeLabel: '构造机制',
      bridge: 'S2 已经回答“构造什么”：由 p、c、D 约束的 S=(A,M,L)。现在固定这个目标，转向 COLLEAGUE.SKILL 的具体构造机制。',
      analogy: { title: '把 COLLEAGUE.SKILL 这台机器打开', text: '我们已经知道输入和输出。现在打开中间暂时锁住的机器，看看 <b>p、c、D</b> 究竟怎样被构造成 <b>S=(A,M,L)</b>。', componentId: 'pipeline-machine-analogy' },
      modules: [{ kind: 'module', id: '3.1', title: 'Person-Grounded Distillation Workbench：亲手跑一次 Pipeline', desc: '使用 S2 的真实 Profile、Source scope 与 Materials，依次运行 Collector / Parser、Preset 路由、双轨蒸馏和文件写入；Productization 再从同一蒸馏结果选择 FULL、WORK ONLY 或 PERSONA ONLY 调用入口并安装到宿主。每完成一站，由右下角 NEXT 进入下一步。', componentId: 'pipeline-lens' }],
      insight: '双层视图解决了“Figure 1 名称与正文组件不一致”的阅读困惑：差别在粒度，不在系统。',
      takeaways: [
        { icon: '🏭', title: '阶段是责任边界', desc: '节点不是装饰性盒子。' }, { icon: '⚙️', title: '实现组件可展开', desc: 'Collector 等组件属于同一责任链。' },
        { icon: '🛡️', title: '治理轨贯穿全程', desc: '来源、纠正和版本不是发布前才出现。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-4', title: 'A Skill Is Never Really Finished', badge: 'both', badgeLabel: '生命周期',
      bridge: 'S3 已经把 p、c、D 构造成 Skill v1。S4 不再重复生成流程，而是追问：部署后发现错误、新证据到来或需要撤销更新时，这个工件如何继续演化？',
      analogy: { title: 'Skill 已经生成了，但它会永远正确吗？', text: '人的知识会更新，蒸馏也可能犯错。因此，一个 Person-Grounded Skill 必须能够被<b>纠正、版本化和回滚</b>。', componentId: 'skill-evolution-analogy' },
      modules: [
        { kind: 'module', id: '4.1', title: 'Lifecycle Lab：亲手纠正一次 Skill', desc: '继承 S3 的 Skill v1 与组合模式：Capability Patch 会进入 FULL 与 WORK ONLY，Behavior Record 会进入 FULL 与 PERSONA ONLY。创建 v2 时保留 prior state；Version History 负责比较与回滚，明确选择当前版本后再交给 S5。', componentId: 'lifecycle-correction-lab' },
      ],
      insight: 'COLLEAGUE.SKILL 不把生成视为终点：Skill 保持可编辑、可版本化、可审计，并且可以回退。',
      takeaways: [
        { icon: '✏️', title: '纠正分两类', desc: '工作方法使用 Markdown Patch；互动行为写入结构化纠正记录。' },
        { icon: '🕰️', title: 'L 是真实状态', desc: '版本、纠正计数、归档与回滚共同构成 Lifecycle。' },
        { icon: '↩️', title: 'Ready 是明确选择', desc: '比较或回滚不会自动完成流程；系统必须知道接下来实际使用哪个版本。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-5', title: 'Where Can This Skill Go?', badge: 'both', badgeLabel: '部署治理',
      bridge: 'S4 已经纠正 Skill 并确定当前版本。S5 不再生成或修改内容，而是让同一个版本选择去向：留在本地、安装进 Agent Host，或在明确权利边界下进入 Gallery。',
      analogy: { title: 'Skill 已经准备好了，现在把它放在哪里？', text: '同一个 Skill 可以留在本地、安装到 Agent Host，或者在满足发布条件时进入 Gallery。不同去向意味着不同的<b>访问与治理边界</b>。', componentId: 'deployment-route-analogy' },
      modules: [{ kind: 'module', id: '5.1', title: 'Deployment Lab：一个 Skill 最后去了哪里？', desc: '先确认要部署的 FULL、WORK ONLY 或 PERSONA ONLY，再探索 Stay Local、Install to Agent 与 Publish to Gallery。变体改变暴露的 Artifact 范围，但 Metadata 与 Lifecycle 同行；Gallery 仍必须通过与 S2 来源范围联动的 Publication Gate。', componentId: 'deployment-lab' }],
      insight: 'Governable 的意义不是多一张说明卡，而是系统能够在权利、同意或分享政策不满足时，真实阻止分发。',
      takeaways: [
        { icon: '💻', title: '本地也是终点', desc: '不是每个 Skill 都需要进入公开分享层。' },
        { icon: '🔌', title: 'Manifest 兑现安装', desc: '兼容运行时、入口与命令让工件真正进入 Agent Host。' },
        { icon: '🚦', title: '公开必须过门', desc: '公开计数说明分发表面存在，不证明行为忠实度或任务提升。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-6', title: '收尾：我们造出了什么，还缺什么？', badge: 'both', badgeLabel: '总结展望',
      bridge: '前五章已经完成一件 Skill 工件的完整旅程：发现问题、定义对象、运行管线、管理版本、决定去向。S6 对全文作最后总结：归纳论文真正交付的核心贡献，梳理当前仍存在的局限与证据边界，并提出值得继续验证的未来研究方向。',
      analogy: { title: '合上论文之前，把结论分成三页', text: '<b>贡献页</b>记录论文已经实现或报告的内容；<b>局限页</b>标出尚未评估的证据缺口；<b>未来页</b>把这些缺口转换成可以执行的实验。三页缺一，结论都会失真。', componentId: 's6-closing-analogy' },
      modules: [
        { kind: 'module', id: '6.1', title: '五幕回放：从 Trace 到 Governed Deployment', desc: '依次点击 S1–S5，回顾每一章解决的问题、产生的工件状态，以及它为下一章留下的关键问题。全部点亮后形成一条完整但不过度外推的论文叙事。', componentId: 'closing-journey' },
        { kind: 'module', id: '6.2', title: '贡献地图：论文真正交付了哪三层东西？', desc: '展开 Artifact、Workflow 与 Deployment Surface 三层贡献。每层同时显示“论文实现/报告了什么”与“不能由此推出什么”，把工程贡献和效果证据分开。', componentId: 'contribution-map' },
        { kind: 'module', id: '6.3', title: '局限性检查：哪些问题仍然悬而未决？', desc: '逐项检查行为忠实度、任务效用、纠错回归、来源与同意、长期漂移等限制；每一项都说明证据缺口会造成什么风险。', componentId: 'limitations-lab' },
        { kind: 'module', id: '6.4', title: '未来评估方案：下一篇论文应该怎么验证？', desc: '直接给出一套固定、可执行的评估协议：在相同来源 D、案例、模型与推理预算下，对比 FULL、WORK ONLY、PERSONA ONLY、通用 Prompt、检索与 No Skill，并统一评估忠实度、任务效果、证据落地、生命周期回归与治理违规。', componentId: 'future-evaluation' },
        { kind: 'module', id: '6.5', title: '离场前最后判断：哪些结论成立？', desc: '用六个声明检验是否真正区分“已经实现”“尚未证明”和“不保证”。全部答对后，完成整篇教程。', componentId: 'claim-quiz' },
      ],
      insight: 'COLLEAGUE.SKILL 最扎实的贡献是把 person-grounded knowledge 变成可检查、可纠正、可部署的工程工件；它最重要的开放问题，是这些工件是否真的忠实、有效，并能在长期使用中保持可靠。',
      formula: {
        lead: '工程可用性、行为忠实度和任务效用是三个必须分别验证的维度。', unicode: 'artifact readiness ≠ behavioral fidelity ≠ task utility',
        symbols: [{ sym: 'artifact readiness', desc: '文件、元数据、版本、安装与治理流程是否完整。' }, { sym: 'behavioral fidelity', desc: '输出是否保留目标人物在相同情境下的判断与互动方式。' }, { sym: 'task utility', desc: '使用 Skill 是否在匹配任务和基线上带来可测量改善。' }],
      },
      takeaways: [
        { icon: '🏁', title: '贡献要说准', desc: '论文交付了工件格式与生命周期工作流，不是数字克隆证明。' },
        { icon: '🔬', title: '局限要可操作', desc: '把证据缺口转化为忠实度、回归、治理与长期评估问题。' },
        { icon: '🧪', title: '展望要能实验', desc: '未来工作应在相同 D 下比较变体、基线、任务与明确指标。' },
      ],
    },
  ],
  bilibili: [
    { bvid: 'BV1o5g866E5X', title: '把书蒸馏成AI技能：仓颉skill深度拆解', reason: '主题关联直接的延伸材料；仅作迁移理解，不作论文证据。', cover: 'https://i1.hdslb.com/bfs/archive/92efffa7c5c8025d8f98f2743c10aa0202d71fcc.jpg', views: '4470播放' },
    { bvid: 'BV1BXQABNE4y', title: '我蒸馏了17个大佬给我打工（开源免费）', reason: '高播放量的人到 Skill 蒸馏背景；介绍相邻项目，不是论文实验。', cover: 'https://i1.hdslb.com/bfs/archive/331f8676875bd8d7eee26c74c5b917c47257d371.jpg', views: '47.1万播放' },
    { bvid: 'BV1ewTW6yEQN', title: '将任意一本书蒸馏成 Skill，快速吃透✌️', reason: '从来源到 Skill 封装的通俗背景；不替代论文证据边界。', cover: 'https://i2.hdslb.com/bfs/archive/dc8684ef5c8d226d5ab83f8005b99989dcc7c625.jpg', views: '2.8万播放' },
  ],
};
