import type { TutorialData } from '../types';

const story = 'learning-story-map';
const photo = 'smart-photo-lab';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'SmartPhotoCrafter',
    titleZh: '',
    venue: '',
    authors: 'Ying Zeng 等',
    affiliation: 'vivo BlueImage Lab',
    domain: '摄影图像增强 · 多模态推理 · 生成式编辑',
    coreProblem: '当用户也说不清照片哪里有问题时，传统指令式修图很难开始。',
    coreInsight: '<span class="cover-question">当你想修一张照片，<br/>却不知道它到底该怎么修时，<br/><b>AI 修图工具能帮助你吗？</b></span><span class="cover-answer"><b>SmartPhotoCrafter</b> 给出的答案是：让 AI 像摄影师一样先诊断照片问题，再自动调色修图，无需你下指令。</span><span class="cover-flow"><b>看懂问题</b><i>→</i><b>生成建议</b><i>→</i><b>自动修图</b></span><span class="cover-key"><b>关键转变</b><em>用户描述问题</em><i>→</i><strong>模型主动发现问题</strong></span><span class="cover-compare-lead">同一张原片，两种不同的起点。</span>',
    keywords: [],
  },
  hero: {
    oldMethod: { desc: '<b>传统 AI 修图工具</b><br/>等待用户给出明确指令。', componentId: photo },
    newMethod: { desc: '<b>SmartPhotoCrafter</b><br/>自动诊断问题，再完成编辑。', componentId: photo },
  },
  chapters: [
    {
      kind: 'chapter', id: 'chap-1', title: '问题：用户不知道怎么修', badge: 'inf', badgeLabel: '从痛点开始',
      bridge: '理解传统编辑困境：传统 AI 修图工具常常在问用户“请告诉我怎么改”，但是多数普通用户往往只知道“差点意思”，却说不清问题在哪。',
      analogy: { title: '把“差点意思”看成具体问题', text: '这张原片只展示两个可被诊断的照片缺陷：暗部细节不清、整体对比不足。普通用户往往不好说清楚。', componentId: photo },
      modules: [{ kind: 'module', id: '1.1', title: '两种起点', desc: '用一张相同的照片比较两条路径：<strong>人先下指令</strong>，或<strong>系统先理解问题</strong>。这是后续所有设计的动机。', componentId: story }],
      insight: '在自动摄影增强场景中，论文让 AI 自动诊断照片缺陷并完成高保真编辑，无需用户先下明确指令；同时它也评测了组合编辑指令的遵从能力。',
      takeaways: [{ icon: '🙋', title: '真实门槛', desc: '用户未必懂摄影术语。' }, { icon: '❓', title: '旧范式的空白', desc: '没有指令时，编辑无法自然启动。' }, { icon: '🧭', title: '论文目标', desc: '让 AI 先诊断，再提出动作。' }],
    },
    {
      kind: 'chapter', id: 'chap-2', title: '核心思路：先诊断，再编辑', badge: 'inf', badgeLabel: '全篇地图',
      bridge: '解决方案不是一个黑箱增强器，而是一张清楚的职责地图：诊断问题、推理与执行编辑被分开，但又能协作。',
      analogy: { title: '把照片放到聚光灯下', text: '先照亮真正需要检查的位置，再决定要用什么方式修正；动作之前先有判断。', componentId: photo },
      modules: [{ kind: 'module', id: '2.1', title: '整篇论文的一张图', desc: '点击流程中的任一步，查看它在故事里回答什么问题。读完这一屏，应能说出系统从输入照片到增强结果的主路径。', componentId: story }],
      insight: 'Image Critic 主“诊”（思考），Photographic Artist 主“修”（执行），这两大模块的协同配合，正是 SmartPhotoCrafter 全自动修图的关键所在。',
      takeaways: [{ icon: '🖼️', title: '输入', desc: '系统从图像本身开始。' }, { icon: '🧠', title: '诊断问题', desc: 'Critic 形成对缺陷的判断。' }, { icon: '✨', title: '执行编辑', desc: 'Artist 把判断变成增强结果。' }],
    },
    {
      kind: 'chapter', id: 'chap-3', title: 'Image Critic：诊断照片问题', badge: 'inf', badgeLabel: '理解与推理',
      bridge: 'Critic 的职责不是生成图片，而是把视觉问题变成 Artist 可以使用、训练也可以评估的信号。',
      analogy: { title: '检查一张试印', text: '观察者先找出雾感、亮度或色彩的问题，再留下清楚的处理建议。', componentId: photo },
      modules: [{ kind: 'module', id: '3.1', title: 'Critic 的三份输出', desc: '在“推理、建议、评分”之间切换。这里使用论文描述的输出结构；示例诊断文案只用于展示未来的逐条呈现位置。', componentId: story }],
      formula: { lead: '论文把图像理解写成三类输出：', unicode: 'fc(X) → (R, E, S)<div class="critic-progression"><span>输入图像</span><span>找病因</span><span>开处方</span><span>体检分</span></div>', symbols: [{ sym: 'X', desc: '输入图像' }, { sym: 'R', desc: '图像质量与审美推理' }, { sym: 'E', desc: '编辑建议' }, { sym: 'S', desc: '图像质量评分' }] },
      takeaways: [{ icon: '🔍', title: 'Reasoning', desc: '解释问题在哪里、为什么出现。' }, { icon: '🛠️', title: 'Suggestions', desc: '把理解变成可执行的修改方向。' }, { icon: '📏', title: 'Score', desc: '为后续比较与学习提供质量信号。' }, { icon: '🚧', title: '交给 Artist', desc: '所以，Critic 负责告诉系统“哪里不好、怎么改、改到几分”，接下来，这套详细的要求就传给 Photographic Artist 去动手“施工”了。' }],
    },
    {
      kind: 'chapter', id: 'chap-4', title: 'Photographic Artist：执行自然编辑', badge: 'inf', badgeLabel: '生成与编辑',
      bridge: 'Critic 决定“应该怎么改”；Artist 负责真正生成增强图，同时尽量保留输入照片的内容与结构。',
      analogy: { title: '按一份清楚的修片标记工作', text: '同一张原图配上明确诊断，编辑动作有了方向，但成片仍要保留原来的主体。', componentId: photo },
      modules: [{ kind: 'module', id: '4.1', title: '原图 + 判断 → 增强图', desc: '', componentId: story }],
      formula: { lead: 'Artist 同时保留输入图像，并接收 Critic 的内部推理表征：', unicode: 'Xe = fa(X, Hc)<div class="critic-progression artist-progression"><span>原图</span><span>诊断</span><span>Artist</span><span>增强图</span></div>', symbols: [{ sym: 'X', desc: '保留内容结构的输入图像' }, { sym: 'Hc', desc: 'Critic 提供的 reasoning representation' }, { sym: 'Xe', desc: '增强后的输出图像' }] },
      takeaways: [{ icon: '🧠', title: 'Critic 负责想', desc: '它不直接替代编辑器。' }, { icon: '🎨', title: 'Artist 负责做', desc: '它执行生成式摄影编辑。' }, { icon: '🧷', title: '双条件', desc: 'X 保内容，Hc 给方向。' }],
    },
    {
      kind: 'chapter', id: 'chap-5', title: '三阶段协同训练', badge: 'trn', badgeLabel: '训练路径',
      bridge: '三阶段协同训练：让 Critic 和 Artist 先练好各自基本功，再学会读懂彼此，最终在联合优化中实现无缝配合。',
      analogy: { title: '三个阶段，学会协同', text: '从各自练习，到读懂诊断，再到在同一反馈中联合优化。', componentId: photo },
      modules: [{ kind: 'module', id: '5.1', title: '三阶段协同训练', desc: '', componentId: story }],
      insight: 'Stage II 让 Artist 读懂 Hc；但即使它会修，仍可能“修过头”。这正是 Stage III 与奖励设计要解决的问题。',
      takeaways: [{ icon: '🔍', title: 'Critic 诊断', desc: '先把照片问题说清楚。' }, { icon: '🧬', title: 'Hc 传递', desc: '把诊断变成 Artist 可读的导航。' }, { icon: '🖌️', title: 'Artist 执行', desc: '依据 X 与 Hc 生成增强图。' }, { icon: '↻', title: '奖励回流', desc: '用共同反馈校正下一轮协作。' }],
    },
    {
      kind: 'chapter', id: 'chap-6', title: '为什么需要强化学习？', badge: 'trn', badgeLabel: 'Stage III 的动机',
      bridge: '仅靠前两阶段监督微调难以覆盖细微摄影调整的探索空间，也缺少诊断与生成的闭环优化；强化学习用于进一步约束“该怎么修、修到什么程度”。',
      analogy: { title: '修图程度数轴', text: '从原图到过度修图，目标不在两端，而是在“修得刚好”的可量化区间。', componentId: photo },
      modules: [{ kind: 'module', id: '6.1', title: '三种编辑结果', desc: '切换“不足、过度、协调”三种结果，理解 Stage III 为什么要让 Critic 和 Artist 在共同反馈中协同。', componentId: story }],
      insight: 'Stage III 对 Critic 使用 GRPO、对 Artist 使用 DiffusionNFT；二者在同一训练循环协同，但各自使用与职责匹配的奖励设计。',
      takeaways: [{ icon: '↘', title: '不足', desc: '方向对了，幅度仍可能不够。' }, { icon: '↗', title: '过度', desc: '漂亮不代表真实或保真。' }, { icon: '⚖️', title: '协调', desc: '强化学习把判断与执行拉回同一目标。' }],
    },
    {
      kind: 'chapter', id: 'chap-7', title: '奖励机制：如何量化“好看”', badge: 'both', badgeLabel: '关键约束',
      bridge: '论文没有用一份完全相同的奖励更新两个模块：Artist 用摄影编辑奖励学习“修得对、修得自然、保留结构”；Critic 用格式、排序与建议探索奖励学习“诊得准、评得准、建议可执行”。',
      analogy: { title: '两条奖励路径，同一训练循环', text: 'Artist 与 Critic 分工不同、奖励不同，但在 Stage III 的闭环中彼此配合。', componentId: photo },
      modules: [
        { kind: 'module', id: '7.1', title: 'Artist：三层摄影编辑奖励', desc: '切换三项 rPA 组成部分，理解 Artist 怎样同时学会遵从建议、精确调色与保留结构。', componentId: story },
        { kind: 'module', id: '7.2', title: 'Critic：三类理解奖励', desc: '切换格式、排序与建议探索，理解 Critic 如何学习输出可靠的诊断、评分和编辑建议。', componentId: story },
      ],
      formula: { lead: '概念之后再看 Artist 的核心奖励：', unicode: 'rPA = rcomp × (λ1 rphoto + λ2 rperc)', symbols: [{ sym: 'rcomp', desc: '编辑是否遵从 Critic 建议的语义门控' }, { sym: 'rphoto', desc: '曝光、对比度、饱和度、色温等光度控制' }, { sym: 'rperc', desc: '用感知一致性保护内容与结构' }] },
      insight: 'Stage III 的关键是闭环协同：Artist 的摄影编辑奖励与 Critic 的理解奖励分别优化各自职责，再在同一训练循环中相互促进。',
      takeaways: [{ icon: '①', title: '生成', desc: 'Artist 依据 X 与 Hc 产出编辑结果。' }, { icon: '②', title: '评分', desc: '奖励衡量方向、幅度与结构是否合理。' }, { icon: '③', title: '更新', desc: 'Critic 和 Artist 用反馈改进下一轮。' }],
    },
    {
      kind: 'chapter', id: 'chap-8', title: '实验证据：它真的有效吗？', badge: 'both', badgeLabel: '实验证据',
      bridge: '理论讲完了，效果到底怎么样？本节从自动增强、组合编辑、图像复原三个任务出发，分别在各自统一的评估协议内核对实际表现。',
      analogy: { title: '把同一张照片放在同一把尺下', text: '只有相同任务、相同协议与正确的指标方向，比较才有意义。', componentId: photo },
      modules: [{ kind: 'module', id: '8.1', title: '三类 Evidence', desc: '切换三个任务，查看对应表格的结论、指标方向与适用协议；不同任务的数值不可直接混比。', componentId: story }],
      insight: '📊 实验结论：组合编辑中全指标领先；自动增强在语义一致性与分布保真上最佳，并有竞争力的感知质量；复原任务取得最佳或次佳表现。',
      takeaways: [{ icon: '📷', title: '自动增强', desc: '看是否能主动改善摄影质量。' }, { icon: '🧩', title: '组合编辑', desc: '看多项建议能否同时被执行。' }, { icon: '🌫️', title: '图像复原', desc: '看去模糊、去雾等任务的效果。' }],
    },
    {
      kind: 'chapter', id: 'chap-9', title: '结论与展望', badge: 'both', badgeLabel: '结论与边界',
      bridge: '回顾 SmartPhotoCrafter 的完整答案：当用户说不清照片哪里不好时，系统先诊断问题，再完成编辑；在 Stage III 中，Critic 的理解奖励与 Artist 的摄影编辑奖励共同构成闭环优化。',
      analogy: { title: '从“差点意思”到“修得好”', text: '关键不在于替用户写更复杂的指令，而在于让模型先学会判断。', componentId: photo },
      modules: [
        { kind: 'module', id: '9.1', title: '三句话记住论文', desc: '依次查看“问题、方法、关键”，用三句话复盘这篇论文真正解决了什么。', componentId: story },
        { kind: 'module', id: '9.2', title: '能力边界与展望', desc: '切换“已覆盖”和“尚待探索”，区分论文已经解决的任务与作者明确指出的边界。', componentId: story },
      ],
      insight: '自动修图不应只追求“变好看”，还需要理解照片、遵从诊断，并保留真实内容。',
      takeaways: [{ icon: '1', title: '解决什么', desc: '用户说不清问题时的自动摄影增强。' }, { icon: '2', title: '怎么解决', desc: 'Critic 先诊断，Artist 再执行。' }, { icon: '3', title: '关键启发', desc: '先判断，再编辑；再用奖励共同优化。' }],
    },
  ],
  bilibili: [
    {
      bvid: 'BV1fk4y1J753',
      title: '§4 Artist 补充：李宏毅讲解 Diffusion Model 原理剖析',
      reason: '帮助理解 Photographic Artist 为什么能以扩散模型完成生成式摄影编辑；该视频讲解的是通用扩散模型基础，并非 SmartPhotoCrafter 官方视频。',
    },
    {
      bvid: 'BV1FTjxzaEHb',
      title: '§6–§7 强化学习补充：吴恩达 GRPO 与奖励函数课程',
      reason: '用于补充理解 GRPO、奖励函数与强化微调的基本概念；视频面向大语言模型，SmartPhotoCrafter 中的具体奖励仍以本教程和论文为准。',
    },
    {
      bvid: 'BV1PP4y197Xq',
      title: '§8 任务补充：扩散模型如何用于图像修复',
      reason: '以图像修复案例直观展示扩散模型的复原能力，帮助联系论文中的图像复原实验；该案例并非 SmartPhotoCrafter 方法本身。',
    },
  ],
};
