import type { TutorialData, QuizDef, ComicDef } from '../types';

// ============================================================================
//  Habitat: A Platform for Embodied AI Research (ICCV 2019)
//  特化底稿 B1–B9 蓝图实现。数字以论文 PDF 为准（Table 1/2、Figure 5 已核验）。
// ============================================================================

export const quizData: QuizDef[] = [
  {
    id: 'q1-1', chapterId: 'chap-1', difficulty: 1, type: 'judge', judge: false,
    q: '判断题：在真实世界中训练具身智能体，比在仿真中训练更快、更安全。',
    options: [{ label: '正确' }, { label: '错误' }],
    explanation: '判据：论文 §1 明确指出真实世界训练慢（无法并行）、危险、资源密集、难控制、难复现；仿真可快数个数量级且可并行、安全。',
    anchor: '§1 Introduction',
  },
  {
    id: 'q1-2', chapterId: 'chap-1', difficulty: 1, type: 'single',
    q: '为什么作者主张用仿真训练具身智能体？',
    options: [
      { label: '因为真实世界训练又慢又危险、资源密集、难控制且难复现', correct: true },
      { label: '因为真实世界场景不够丰富' },
      { label: '因为仿真不需要任何真实数据' },
      { label: '因为真实机器人永远不会犯错' },
    ],
    explanation: '判据：§1 列举真实训练五大痛点；仿真可快数量级、可并行、安全、便于公平对比。干扰项“仿真不需要真实数据”“真实机器人不犯错”为无中生有/绝对化。',
    anchor: '§1 Introduction',
  },
  {
    id: 'q4-1', chapterId: 'chap-4', difficulty: 2, type: 'single',
    q: 'Habitat-Sim 的 uber-shader 单 pass 渲染的最大好处是？',
    options: [
      { label: '一次渲染同时输出 color/depth/semantic 等多通道，避免重复开销', correct: true },
      { label: '渲染分辨率更高' },
      { label: '只渲染语义信息' },
      { label: '不需要 GPU 就能运行' },
    ],
    explanation: '判据：§3 Rendering engine —— multi-attachment uber-shader 在共享参数时用同一 render pass 产生全部输出，避免额外开销。',
    anchor: '§3 Rendering engine',
  },
  {
    id: 'q6-1', chapterId: 'chap-6', difficulty: 2, type: 'order',
    q: '将 PointGoal 导航中一个 episode 的执行过程按正确顺序排列：',
    order: ['感知（接收传感器观测）', '决策（选择动作）', '执行动作（转向/前进）', '碰撞检测与位移', '评估（是否到达目标）'],
    explanation: '判据：§4 —— agent 接收观测→选择动作→动作映射到位移（含碰撞）→持续至 stop 或 500 步→按 SPL/Succ 评估。',
    anchor: '§4 Task definition / Evaluation',
  },
  {
    id: 'q7-1', chapterId: 'chap-7', difficulty: 2, type: 'single',
    q: 'SPL 的正确定义是？',
    options: [
      { label: 'SPL = S·l / max(p, l)', correct: true },
      { label: 'SPL = S / p' },
      { label: 'SPL = l / p' },
      { label: 'SPL = 平均成功率' },
    ],
    explanation: '判据：§4 Evaluation —— SPL = S·l / max(p,l)，S 为成功指示、l 为最短路径、p 为实际轨迹长度；同时衡量送达与是否绕路。',
    anchor: '§4 Evaluation',
  },
  {
    id: 'q7-2', chapterId: 'chap-7', difficulty: 2, type: 'match',
    q: '将符号与其含义配对：',
    matchPairs: [
      { left: 'S', right: '二值成功指示（0.2m 内 stop）' },
      { left: 'l', right: '最短路径测地距离 GDSP' },
      { left: 'p', right: '实际轨迹长度' },
      { left: 'SPL', right: 'S·l / max(p,l) 路径效率' },
    ],
    explanation: '判据：A4 符号表 + §4 —— 每个符号形状、含义与论文一致。',
    anchor: '§4 Evaluation',
  },
  {
    id: 'q8-1', chapterId: 'chap-8', difficulty: 2, type: 'judge', judge: true,
    q: '判断题：若像前人那样在 5M 训练步终止实验，会得出“SLAM 主导学习”的错误结论。',
    options: [{ label: '正确' }, { label: '错误' }],
    explanation: '判据：§5 —— 作者指出在 5M frames 终止会得到 SLAM 主导的结论；训练到 75M 步后 Depth 追上并超越 SLAM（约 10M Gibson / 30M MP3D）。',
    anchor: '§5 Learning vs SLAM',
  },
  {
    id: 'q9-1', chapterId: 'chap-9', difficulty: 3, type: 'multi',
    q: '关于跨数据集泛化，下列说法正确的有（多选）：',
    options: [
      { label: '仅带深度（Depth）传感器的 agent 跨数据集泛化良好', correct: true },
      { label: 'RGB 与 RGBD 跨数据集时性能显著退化', correct: true },
      { label: 'Blind agent 受跨数据集影响最小', correct: true },
      { label: '所有传感器跨数据集都同样优秀' },
    ],
    explanation: '判据：§5/摘要 + Figure 5 —— 仅 Depth 泛化良好；RGB/RGBD 显著退化；Blind 受影响最小。“所有都优秀”为绝对化错误。',
    anchor: '§5 Generalization across datasets',
  },
  {
    id: 'q10-1', chapterId: 'chap-10', difficulty: 3, type: 'single',
    q: '为什么 Depth agent 在 PointGoal 任务上优于 RGBD？',
    options: [
      { label: 'PointGoal 只需推理自由空间，depth 直接提供该信息；RGB 高熵易过拟合', correct: true },
      { label: '因为 RGBD 传感器会坏' },
      { label: '因为深度传感器分辨率更高' },
      { label: '因为彩色信息完全没有用' },
    ],
    explanation: '判据：§5 —— 两点理由：①任务只需自由空间推理，depth 直接相关；②RGB 熵更高、房型差异大、更易过拟合。“彩色没用/传感器会坏”为曲解文意/无中生有。',
    anchor: '§5 Learning vs SLAM',
  },
  {
    id: 'q10-2', chapterId: 'chap-10', difficulty: 3, type: 'fill',
    q: '填空题：RGBD agent 从 Gibson 迁移到 MP3D 时，SPL 从 0.70 下降到 ____（填数值）。',
    fill: '0.53',
    answer: '0.53',
    explanation: '判据：§5 —— RGBD Gibson→Gibson 0.70 vs Gibson→Matterport3D 0.53，下降 0.17。',
    anchor: '§5 Generalization + Figure 5',
  },
  {
    id: 'q10-3', chapterId: 'chap-10', difficulty: 3, type: 'multi',
    q: '关于本文结论，下列正确的有（多选）：',
    options: [
      { label: '训练充分后，学习型 agent 能匹配并超越经典 SLAM', correct: true },
      { label: 'Depth 传感器 agent 跨数据集泛化优于仅 RGB 的 agent', correct: true },
      { label: 'Gibson 训练的 agent 普遍更强，提示课程学习价值', correct: true },
      { label: '结论只适用于单一传感器' },
    ],
    explanation: '判据：§6 Future Work + §5 —— 学习型超越 SLAM（充分训练）、Depth 泛化好、Gibson 普遍更强（课程学习）。“只适用单一传感器”为以偏概全。',
    anchor: '§5–§6',
  },
];

export const comicData: ComicDef[] = [
  { id: 'comic-1', chapterId: 'chap-1', title: '真世界训练太慢', src: './images/comics/comic-1.png', strip: true, caption: '送货员在真实世界磨蹭（慢/危险/贵），在仿真里却能快进成千上万倍。' },
  { id: 'comic-2', chapterId: 'chap-6', title: '五种传感器五双眼', src: './images/comics/comic-2.png', strip: true, caption: 'Blind / RGB / Depth / RGBD 看同一个房间：有的只盯距离，有的被花哨细节带偏。' },
  { id: 'comic-3', chapterId: 'chap-6', title: '碰墙滑移', src: './images/comics/comic-3.png', strip: true, caption: 'move_forward 却撞墙：只挪了半程，甚至贴着墙滑开——里程计不再平凡。' },
  { id: 'comic-4', chapterId: 'chap-7', title: '绕路 vs 直路', src: './images/comics/comic-4.png', strip: true, caption: 'SPL 惩罚绕路：送到但绕远 vs 送到且抄近路，裁判给的分不一样。' },
];

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'Habitat: A Platform for Embodied AI Research',
    titleZh: 'Habitat：面向具身智能研究的高性能仿真平台',
    venue: 'ICCV 2019',
    authors: 'Manolis Savva, Abhishek Kadian, Oleksandr Maksymets, Yili Zhao, Erik Wijmans, Bhavana Jain, Julian Straub, Jia Liu, Vladlen Koltun, Jitendra Malik, Devi Parikh, Dhruv Batra',
    affiliation: 'Facebook AI Research · Facebook Reality Labs · Georgia Tech · Simon Fraser · Intel Labs · UC Berkeley',
    domain: '具身智能 Embodied AI · 仿真 · 导航 · 强化学习 · 3D 视觉',
    coreProblem: '真实世界训练具身智能体慢、危险、资源密集、难控制、难复现；现有模拟器低帧率、紧耦合、难复现。',
    coreInsight: 'Habitat 以统一三层软件栈（Datasets / Simulators / Tasks）+ 高性能 Habitat-Sim + 模块化 Habitat-API，把训练推至每秒数千~上万帧；由此首次发现：训练充分后学习型 agent 超越经典 SLAM，且仅 Depth 传感器跨数据集泛化良好。',
    keywords: ['具身智能', '仿真平台', 'PointGoal', 'SPL', 'RL(PPO)', 'SLAM', '跨数据集泛化', 'Habitat-Sim'],
  },
  hero: {
    oldMethod: {
      desc: '真实世界 / 旧模拟器：慢、危险、贵、紧耦合、难复现。<br/>训练不足时 SLAM 看似主导。',
      componentId: 'hero-old',
    },
    newMethod: {
      desc: 'Habitat 仿真：数千~上万 fps、三层统一栈、模块化 API。<br/>充分训练后学习超越 SLAM，仅 Depth 泛化好。',
      componentId: 'hero-new',
    },
  },

  chapters: [
    // ================= 第 1 章 =================
    {
      kind: 'chapter', id: 'chap-1', title: '引言：真实训练太难', badge: 'inf', badgeLabel: '问题',
      bridge: '真实世界训练机器人又慢又危险，我们为什么还要在仿真里练？先看清痛点，才能理解 Habitat 的价值。',
      analogy: { title: '送货员在真实世界磨蹭', text: '把具身智能体想成一位送货员。在真实公寓里练送货：跑不快、会撞东西、烧钱、状况难复现。仿真则是他的“训练模拟舱”，快进几千倍，随便撞不心疼。', componentId: 'delivery-analogy' },
      modules: [
        { kind: 'module', id: '1.1', title: '真实 vs 仿真：五大痛点', desc: '点击切换，看真实世界训练的每个痛点如何被仿真化解。', componentId: 'p2-realVsSim' },
      ],
      insight: '仿真训练快、安全、便宜、可复现，是与真实训练互补的研究路线。',
      takeaways: [
        { icon: '🐢', title: '慢', desc: '真实世界不比真实时间更快，无法并行；仿真可快数量级。' },
        { icon: '⚠️', title: '危险', desc: '训练不足的 agent 可能伤己伤人；仿真里安全试错。' },
        { icon: '🔁', title: '可复现', desc: '仿真条件可复制、便于跨实验公平对比。' },
      ],
    },
    // ================= 第 2 章 =================
    {
      kind: 'chapter', id: 'chap-2', title: '旧模拟器之痛', badge: 'inf', badgeLabel: '现状',
      bridge: '即便用仿真，现有模拟器也各有短板。Habitat 正是针对这些不足设计的。',
      analogy: { title: '一个仓库装不下所有订单', text: '旧模拟器像“专属仓库”：任务、平台、数据集绑死，换个订单（任务）或换栋楼（数据集）就得重搭。', componentId: 'delivery-analogy' },
      modules: [
        { kind: 'module', id: '2.1', title: '五大不足 ↔ 后果', desc: '拖拽把每个不足与它造成的后果配对，先体会痛点再引入 Habitat。', componentId: 'p4-shortcomingMatch' },
      ],
      insight: '任务-平台-数据集紧耦合、硬编码 agent、低帧率、状态难控、难独立复现——这五点催生了统一平台。',
      takeaways: [
        { icon: '🔗', title: '紧耦合', desc: '任务、平台、数据集绑死，多任务/多数据集实验不切实际。' },
        { icon: '🧱', title: '硬编码', desc: 'agent 尺寸、动作空间写死，无法做参数消融。' },
        { icon: '🚧', title: '低帧率', desc: '10–100 fps 成为训练瓶颈，大规模学习不可行。' },
      ],
    },
    // ================= 第 3 章 =================
    {
      kind: 'chapter', id: 'chap-3', title: 'Habitat 三层软件栈', badge: 'inf', badgeLabel: '方案',
      bridge: 'Habitat 把训练栈拆成 Datasets → Simulators → Tasks 三层，每一层都能独立替换。',
      analogy: { title: '从地图、路况到下单', text: '送货要三样：房子数据（Datasets）、模拟走路的引擎（Simulators）、以及“送到哪算成功”的规则（Tasks）。Habitat 把它们统一成一套标准。', componentId: 'delivery-analogy' },
      modules: [
        { kind: 'module', id: '3.1', title: '三步走：统一软件栈', desc: '点“下一步”逐步走过三层软件栈，看每层职责与 Habitat 平台如何统领。', componentId: 'p5-softwareStack', figure: './images/figures/figure-1.png' },
      ],
      insight: '标准化的软件栈让“换数据集”像改个名字一样简单，支撑规模化实验。',
      takeaways: [
        { icon: '🗂️', title: 'Datasets', desc: '提供带语义标注的 3D 资产（Matterport3D、Gibson、Replica…）。' },
        { icon: '🎮', title: 'Simulators', desc: '渲染资产并模拟具身 agent（Habitat-Sim）。' },
        { icon: '✅', title: 'Tasks', desc: '定义可评测问题与基准（导航、问答、指令跟随…）。' },
      ],
    },
    // ================= 第 4 章 =================
    {
      kind: 'chapter', id: 'chap-4', title: 'Habitat-Sim：快', badge: 'inf', badgeLabel: '性能',
      bridge: '快，是 Habitat 的灵魂。场景图统一多数据集、uber-shader 一次渲染多通道，fps 冲到上千上万。',
      analogy: { title: '快递分拣流水线提速', text: '传统一条条流水线各拍各的（多次渲染），Habitat 一条流水线同时拍出颜色、深度、语义（单 pass 多输出），分拣速度飙升。', componentId: 'delivery-analogy' },
      modules: [
        { kind: 'module', id: '4.1', title: '单 pass 多输出', desc: '开关对比：分开渲染三次 vs uber-shader 一次渲染出三通道。', componentId: 'p9-uberShader' },
        { kind: 'module', id: '4.2', title: 'Table 1：fps 有多快', desc: '悬停查看精确 fps：RGB 单进程 128 分辨率达 4,093 fps，五进程达 10,592 fps。', componentId: 'table1Chart', figure: './images/figures/figure-2.png' },
      ],
      insight: '场景图统一表示 + 单 pass 多输出 = 数千~上万 fps，把训练瓶颈从仿真移到优化。',
      formula: {
        lead: '性能目标：比旧模拟器快 2–3 个数量级（多数室内模拟器 10–100 fps，House3D 可达 ~300 fps）。',
        unicode: 'fps<sub>Habitat</sub> ≈ 10<sup>3</sup>–10<sup>4</sup>  ≫  fps<sub>MINOS/Gibson</sub> ≈ 10<sup>2</sup>',
        symbols: [
          { sym: 'fps', desc: '帧每秒，仿真渲染性能指标（§3 Performance）。' },
        ],
      },
      takeaways: [
        { icon: '🧱', title: '场景图', desc: '统一表示所有 3D 数据集，抽象底层细节。' },
        { icon: '🎞️', title: '单 pass', desc: 'uber-shader 一次渲染 color/depth/semantic，避免重复开销。' },
        { icon: '⚡', title: '上万 fps', desc: '五进程单 GPU 超 10,000 fps，生成图像比从磁盘加载还快。' },
      ],
    },
    // ================= 第 5 章 =================
    {
      kind: 'chapter', id: 'chap-5', title: 'Habitat-API：模块化', badge: 'both', badgeLabel: '架构',
      bridge: '模拟器之上，Habitat-API 用 Task / Episode / Environment 三层抽象，把“定义任务”从工程泥潭中解放。',
      analogy: { title: '一张可填写的送货单', text: '一个 episode 就像一张送货单：起点、朝向、目标房间、可选的最近路线都填好；Environment 则是一个“随时能开工的送货车队”。', componentId: 'delivery-analogy' },
      modules: [
        { kind: 'module', id: '5.1', title: '组装一个 Episode', desc: '把 Task / Episode / Environment 拖到正确顺序，组装一个可执行的导航回合。', componentId: 'p3-assembleEpisode' },
        { kind: 'module', id: '5.2', title: '三个抽象，翻卡看清', desc: '点击翻卡，逐一理解 Task（任务与评测）/ Episode（实例）/ Environment（运行环境）。', componentId: 'p12-taskCards' },
      ],
      insight: '模块化 API 让定义、训练、评测任意任务成为可复用的“积木”。',
      takeaways: [
        { icon: '🧩', title: 'Task', desc: '扩展观测与动作空间，提供终止条件与成功度量。' },
        { icon: '📋', title: 'Episode', desc: '一次任务实例：起点、朝向、场景、目标与最短路径。' },
        { icon: '🏗️', title: 'Environment', desc: '封装与模拟器协作所需的一切信息。' },
      ],
    },
    // ================= 第 6 章 =================
    {
      kind: 'chapter', id: 'chap-6', title: 'PointGoal 任务设定', badge: 'inf', badgeLabel: '任务',
      bridge: '用 PointGoal 导航验证平台：一个具身圆柱体，靠传感器和 GPS 找到目标坐标。',
      analogy: { title: '送货员只知道“大概方位”', text: '货主只给个坐标（GPS），不画地图。送货员靠“眼睛”（不同传感器）和“感觉”（转向/前进/碰撞）自己摸路。', componentId: 'delivery-analogy' },
      modules: [
        { kind: 'module', id: '6.1', title: '转向·前进·碰撞', desc: '拖动滑块控制转向角度与前进距离，看圆柱体 agent 在俯视图中的位移；撞墙会滑移。', componentId: 'p1-sensorNav', figure: './images/figures/figure-4.png' },
        { kind: 'module', id: '6.2', title: '四种传感器四双眼', desc: '切换 Blind / RGB / Depth / RGBD，看同一场景下它们“看到”什么。', componentId: 'p2-sensorToggle' },
      ],
      insight: '静态 PointGoal + 理想化 GPS：把“真实任务”与“仿真噪声/碰撞”解耦，按传感器公平比较。',
      formula: {
        lead: '第 t 步的奖励：越接近目标奖励越高，到达有一次性大奖，绕路耗时有惩罚。',
        unicode: 'r<sub>t</sub> = s + d<sub>t−1</sub> − d<sub>t</sub> + λ （到达目标）；否则 r<sub>t</sub> = d<sub>t−1</sub> − d<sub>t</sub> + λ',
        symbols: [
          { sym: 'r_t', desc: '第 t 步奖励（§4 Training procedure）。' },
          { sym: 'd_t', desc: '第 t 步到目标的 geodesic 距离。' },
          { sym: 's', desc: '成功一次性奖励，实验设 10。' },
          { sym: 'λ', desc: '时间惩罚，实验设 −0.01，鼓励走捷径。' },
        ],
      },
      takeaways: [
        { icon: '🧍', title: '具身', desc: '圆柱体，直径 0.2m、高 1.5m；动作 turn_left/right、move_forward、stop。' },
        { icon: '🧲', title: '碰撞', desc: '连续状态空间 + 真实碰撞：撞墙会滑移，里程计不平凡。' },
        { icon: '📷', title: '传感器', desc: '256²、90° FOV；Blind/RGB/Depth/RGBD 四类，均配 GPS+compass。' },
      ],
    },
    // ================= 第 7 章 =================
    {
      kind: 'chapter', id: 'chap-7', title: '评估与数据集', badge: 'both', badgeLabel: '指标',
      bridge: '怎么算“送到”？SPL 同时惩罚“没送到”和“绕路”，比单纯成功率更严格。',
      analogy: { title: '裁判怎么打分', text: '送货到了没（S）是一回事，走得多绕（p vs l）是另一回事。SPL 就是那位既看结果又看脚程的裁判。', componentId: 'delivery-analogy' },
      modules: [
        { kind: 'module', id: '7.1', title: 'SPL：绕路就扣分', desc: '拖动实际轨迹长度 p，看 SPL 如何随绕路程度下降。', componentId: 'p1-splSlider' },
        { kind: 'module', id: '7.2', title: 'SPL 参数探索', desc: '联动调节成功与否与绕路倍率，观察 SPL 的变化区间。', componentId: 'p14-splParam' },
      ],
      insight: '0.2m 内 stop 即成功、500 步上限；用 GDSP/欧氏比 [1,1.1] 的拒绝采样筛掉“太简单”的 episode。',
      formula: {
        lead: 'SPL 同时衡量“送达”与“路径效率”：最短路线越短、实际走得越直，分越高。',
        unicode: 'SPL = S · l / max(p, l)',
        symbols: [
          { sym: 'S', desc: '二值成功指示：0.2m 内 stop 为 1（§4 Evaluation）。' },
          { sym: 'l', desc: '最短路径 GDSP（§4）。' },
          { sym: 'p', desc: '实际轨迹长度（§4）。' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '成功', desc: '距目标 geodesic 距离 ≤ 0.2m 内 stop 才算成功。' },
        { icon: '⏳', title: '上限', desc: '每 episode 最多 500 步，超出判失败。' },
        { icon: '📐', title: '数据集', desc: 'GDSP 限制 1–30m；[1,1.1] 比例拒绝采样，Gibson 从 37%→10%。' },
      ],
    },
    // ================= 第 8 章 =================
    {
      kind: 'chapter', id: 'chap-8', title: '学习 vs SLAM', badge: 'trn', badgeLabel: '训练',
      bridge: '训练不足时 SLAM 看似主导；训练到 75M 步，学习型 Depth 迎头赶上并超越。',
      analogy: { title: '老练导航员 vs 新手学徒', text: 'SLAM 是自带地图的老导航员（不用训练，恒定发挥）；RL(PPO) 是新手学徒，起步很菜，但练得够久（75M 步）就比老师傅更强。', componentId: 'delivery-analogy' },
      modules: [
        { kind: 'module', id: '8.1', title: '训练曲线回放', desc: '拖动进度条回放 0→75M 步：Depth 约 10M(Gibson)/30M(MP3D) 追上 SLAM 常数线。', componentId: 'p10-timeline', figure: './images/figures/figure-3.png' },
        { kind: 'module', id: '8.2', title: '五条曲线，交互叠加', desc: '悬停查看：RGB/Depth/RGBD/Blind/SLAM 在 Gibson 与 MP3D 验证集的 SPL。', componentId: 'fig3Curves' },
      ],
      insight: '只有把经验放大一个数量级（75M 步，15× 前人），才能看到“学习超越 SLAM”的正确结论。',
      takeaways: [
        { icon: '📈', title: '75M 步', desc: '训练经验为前人的 15 倍，共 2267 GPU-小时。' },
        { icon: '🏆', title: 'Depth 最优', desc: '均匀超过 RGBD/SLAM/RGB；Blind 早期快但快速饱和。' },
        { icon: '⚠️', title: '别被 5M 骗了', desc: '5M 步终止会误判 SLAM 主导（前人 [19,16] 的结论）。' },
      ],
    },
    // ================= 第 9 章 =================
    {
      kind: 'chapter', id: 'chap-9', title: '跨数据集泛化', badge: 'trn', badgeLabel: '泛化',
      bridge: '换一个数据集的场景，agent 还行吗？这是首个 {train,test}×{MP3D,Gibson} 泛化实验。',
      analogy: { title: '换栋楼送货', text: '在 Gibson 这栋楼练熟的送货员，换到 MP3D 那栋楼还能不能找对房间？结果：只有“只看距离”的 Depth 最稳。', componentId: 'delivery-analogy' },
      modules: [
        { kind: 'module', id: '9.1', title: '泛化矩阵热力图', desc: '悬停每个单元格查看精确 SPL：行=(agent,train)，列=test。', componentId: 'fig5Heatmap', figure: './images/figures/figure-5.png' },
        { kind: 'module', id: '9.2', title: 'train / test 切换', desc: '切换在哪个数据集上训练、在哪个上测试，看各传感器表现。', componentId: 'p2-generalizeToggle' },
      ],
      insight: '仅 Depth 泛化良好；RGB/RGBD 显著退化；Gibson 训练的 agent 普遍更强（课程学习启示）。',
      takeaways: [
        { icon: '✅', title: 'Depth 稳', desc: '跨数据集几乎不掉（Depth/Gibson→MP3D 0.68）。' },
        { icon: '📉', title: 'RGBD 掉', desc: 'Gibson→MP3D 0.70→0.53，下降 0.17。' },
        { icon: '🎓', title: '课程学习', desc: 'Gibson 场景更小更简单，训练出的 agent 全局更强。' },
      ],
    },
    // ================= 第 10 章 =================
    {
      kind: 'chapter', id: 'chap-10', title: '结果与启示', badge: 'both', badgeLabel: '结论',
      bridge: '平台的价值，最终由能否回答科学问题来检验。这里给出两个核心结论与启示。',
      analogy: { title: '平台让实验“一键换场景”', text: '这些洞察不是靠蛮力堆出来的，而是 Habitat 让跨数据集实验简单到“改个数据集名”。这就是平台的意义。', componentId: 'delivery-analogy' },
      modules: [
        { kind: 'module', id: '10.1', title: '猜结论：哪个成立？', desc: '投票判断哪些结论成立，再对答案。', componentId: 'p6-conclusionVote' },
        { kind: 'module', id: '10.2', title: 'Table 2：基线总览', desc: '分组柱状图对比各传感器×数据集×SPL/Succ，Depth 高亮。', componentId: 'table2Chart', figure: './images/figures/figure-4.png' },
      ],
      insight: '两点贡献：①充分训练后学习超越 SLAM；②仅 Depth 跨数据集泛化好。提示课程学习与平台标准化价值。',
      takeaways: [
        { icon: '🏅', title: 'Depth 最优', desc: 'Gibson SPL 0.79/Succ 0.89；MP3D 0.54/0.69。' },
        { icon: '🧭', title: '学习>SLAM', desc: '足够经验下学习型超越经典方法（需 75M 步）。' },
        { icon: '🛠️', title: '平台价值', desc: '工程贡献让“换数据集”等实验变得可行且可复现。' },
      ],
    },
  ],
};
