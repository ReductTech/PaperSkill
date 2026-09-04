import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'Self-Distilled Agentic Reinforcement Learning',
    titleZh: '自蒸馏智能体强化学习',
    venue: 'arXiv:2605.15155 · 2026',
    authors: 'Zhengxi Lu, Zhiyuan Yao, Zhuowen Han, Zi-Han Wang, Jinyang Wu, Qi Gu, Xunliang Cai, Weiming Lu, Jun Xiao, Yueting Zhuang, Yongliang Shen',
    affiliation: 'Zhejiang University · Meituan · Tsinghua University',
    domain: 'Agentic Reinforcement Learning',
    coreProblem: '多轮智能体只有轨迹级稀疏反馈；朴素的在线策略自蒸馏又会在轨迹偏离后累积误差。',
    coreInsight: 'SDAR 不替换 GRPO，而是在旁边增加一条受控的 token 级自蒸馏声道：用教师与学生对同一已采样 token 的 <b>log-probability gap</b> 计算平滑门，只强化更可信的提示。',
    keywords: ['SDAR', 'GRPO', 'token gate', '多轮智能体'],
  },
  hero: {
    oldMethod: {
      desc: '<b>只靠终场反馈或盲目蒸馏</b><br/>错误很早发生，奖励很晚到达；特权提示也并非每个 token 都可靠。',
      componentId: 'hero-old',
    },
    newMethod: {
      desc: '<b>让每个 token 自己决定信任度</b><br/>GRPO 保持轨迹目标，gap gate 为可信 token 补充密集方向。',
      componentId: 'hero-new',
    },
  },
  chapters: [
    {
      kind: 'chapter', id: 'chap-1', title: '为什么终场掌声来得太晚｜Trajectory-level Reward', badge: 'inf', badgeLabel: '问题',
      bridge: '先完成整段演奏，再回到每个音符判断：错误究竟从哪一拍开始？',
      analogy: { title: '弹完整段，终场灯才亮', text: '一段多轮轨迹像一段长乐句：学员在第 3 拍已经偏离，却可能到第 8 拍才看到失败灯。轨迹奖励对最终任务负责，却不直接指出哪一个 token 最先出错。', componentId: 'ana-1' },
      modules: [
        { kind: 'module', id: '1.1', title: '奖励到底晚了几拍？', desc: '调节总轮数与首次偏离位置，观察错误发生与终场反馈之间的“信用缺口”。', componentId: 'ch1-sparse-reward-lab' },
        { kind: 'module', id: '1.2', title: '一轮偏差，如何滚成多轮漂移？', desc: '向两种训练方式注入同一次偏差。左侧是均匀蒸馏的机制示意，右侧是 SDAR 的选择性信任；它们不是论文曲线复刻。', componentId: 'ch1-drift-compare' },
      ],
      insight: '论文的出发点不是删除强化学习，而是避免密集蒸馏在多轮偏离后继续“用力过猛”。',
      formula: { lead: '轨迹奖励只对完整轨迹给出结果，而 token 级辅助项能逐拍分配信号：', unicode: 'τ = (y₁, …, yₜ) → R(τ)；每个 yₜ 可拥有独立辅助权重', symbols: [{ sym: 'τ', desc: '一条完整的多轮智能体轨迹。' }, { sym: 'R(τ)', desc: '环境或 verifier 对整条轨迹给出的奖励。' }, { sym: 'yₜ', desc: '学生在第 t 个位置实际采样的 token。' }] },
      takeaways: [
        { icon: '🎯', title: '终场目标', desc: '轨迹奖励衡量整段是否完成任务。' },
        { icon: '🔎', title: '定位困难', desc: '稀疏反馈不直接告诉哪一拍先出错。' },
        { icon: '🛡️', title: '需要控制', desc: '多轮密集监督必须防止偏差继续累积。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-2', title: '同一个音符，两张谱面', badge: 'trn', badgeLabel: '上下文',
      bridge: '既然终场灯太晚，下一步就看同一音符能否被两种上下文重新评分。',
      analogy: { title: '普通谱与教练批注谱', text: '学生分支只看任务与既有历史；教师分支还是同一策略，但训练时多看一份特权技能批注。两边评分的必须是同一个学生 token。', componentId: 'ana-2' },
      modules: [
        { kind: 'module', id: '2.1', title: '点击音符，切换它看到的上下文', desc: '选择一个学生已经采样的 token，再比较普通上下文与带特权批注的教师上下文。概率为教学示意，不是论文实验数据。', componentId: 'ch2-context-switcher' },
      ],
      insight: '教师不是另一位更强模型，而是“同一策略 + 训练期额外上下文”的评分分支。',
      formula: { lead: '两条分支共享任务 x、历史 y&lt;ₜ 与当前 token，只有教师多出 c⁺：', unicode: 'sₜ = (x, y<sub>&lt;t</sub>)　　sₜ⁺ = (x, c⁺, y<sub>&lt;t</sub>)', symbols: [{ sym: 'sₜ', desc: '学生上下文：任务输入与学生自己的历史。' }, { sym: 'sₜ⁺', desc: '教师上下文：在学生上下文上加入训练期特权信息。' }, { sym: 'c⁺', desc: '检索到的技能、示例或其他训练期附加提示。' }] },
      takeaways: [
        { icon: '🎹', title: '同一个 token', desc: '比较对象不能偷换成另一条教师轨迹。' },
        { icon: '📝', title: '上下文不同', desc: '教师仅多看训练期特权信息 c⁺。' },
        { icon: '🚪', title: '测试时拿掉', desc: '特权上下文不是部署时的必需输入。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-3', title: '有提示，不等于要盲从｜Asymmetric Trust', badge: 'both', badgeLabel: '动机',
      bridge: '多一张批注谱不代表每条批注都可信。',
      analogy: { title: '教练也可能看错这一拍', text: '提示可能检索不准、没有被模型正确利用，或与已经漂移的历史不再匹配。关键不是把整位教师判好坏，而是逐音符决定这一拍该听多少。', componentId: 'ana-3' },
      modules: [
        { kind: 'module', id: '3.1', title: '盲从教师，还是逐音符选择？', desc: '切换好提示、坏提示与漂移后提示，并同步比较均匀蒸馏和 SDAR。负 gap 只表示教师支持更低，不是“必错 token”。', componentId: 'ch3-trust-comparison' },
      ],
      insight: '论文对 Qwen2.5-3B-Instruct 的初步分析中，负 gap token 超过一半；这一观察不能外推到所有模型。',
      formula: { lead: '选择性信任的核心问题可以写成一句话：', unicode: '对每个 yₜ：教师比学生更支持多少？', symbols: [{ sym: 'yₜ', desc: '学生实际采样的当前 token。' }] },
      takeaways: [
        { icon: '🧭', title: '特权不等于正确', desc: '额外信息带来潜在优势，也可能带来噪声。' },
        { icon: '🪙', title: '信任落到 token', desc: '同一条轨迹中，不同位置可拥有不同权重。' },
        { icon: '☁️', title: '软衰减', desc: '低可信提示被减弱，而非粗暴地全盘拒绝。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-4', title: '用一个差值量出“谁更支持这一拍”', badge: 'trn', badgeLabel: '数学',
      bridge: '要逐音符选择，先把“更支持”变成可计算的差值。',
      analogy: { title: '两只把握度表，读出一段差值', text: '同一个音符分别通过学生谱与批注谱评分。先把概率放到 log 空间，再用教师减学生：正值是教师更支持，负值只是提醒我们谨慎。', componentId: 'ana-4' },
      modules: [
        { kind: 'module', id: '4.1', title: '拖动两个概率点，实时测量 Δₜ', desc: '直接操控学生与教师对同一 token 的概率。界面同步显示概率、log probability、gap 正负和下一章的 gate 预览。', componentId: 'ch4-gap-ruler' },
      ],
      insight: 'Teacher–Student gap 是相对支持度，不是 correctness 标签；正负只决定辅助信号应更强还是更弱。',
      formula: { lead: '论文在学生采样 token 上估计 reverse-KL-aligned 的单样本 gap：', unicode: 'Δₜ = log π<sub>T</sub>(yₜ | sₜ⁺) − log π<sub>θ</sub>(yₜ | sₜ)', symbols: [{ sym: 'Δₜ', desc: '教师 log 支持减学生 log 支持。' }, { sym: 'πT', desc: '带特权上下文的教师评分分支。' }, { sym: 'πθ', desc: '正在训练的学生策略。' }] },
      takeaways: [
        { icon: '🧮', title: 'log 空间', desc: '论文比较的是 log probability，而非直接减概率。' },
        { icon: '➕', title: '正 gap', desc: '教师对当前 token 的支持高于学生。' },
        { icon: '➖', title: '负 gap', desc: '教师支持更低，应降低蒸馏信任。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-5', title: '把差值变成平滑的信任门｜Gap Gating', badge: 'trn', badgeLabel: '门控',
      bridge: '差值还不是权重；需要一扇平滑的门。',
      analogy: { title: '不是开关，而是逐拍音量旋钮', text: '硬开关会把边界音符一刀切。sigmoid gate 把 Δ 连续映射到 0 与 1 之间：坏提示变轻，好提示变响，模棱两可的音符保留部分信用。', componentId: 'ana-5' },
      modules: [
        { kind: 'module', id: '5.1', title: '从 Δₜ 到 gₜ：试一试门有多软', desc: '选择不同 gap token 和 β，观察 sigmoid 曲线、当前 gate 与反馈同步变化。', componentId: 'ch5-sigmoid-gate' },
      ],
      insight: '平滑门的价值在于“有界、单调、可选择”：它弱化低可信辅助项，但不会把 token 本身删除。',
      formula: { lead: '默认 gap gate 把相对支持度压到 (0,1)：', unicode: 'Δₜ = log π<sub>T</sub>(yₜ | sₜ⁺) − log π<sub>θ</sub>(yₜ | sₜ) = log p<sub>T</sub> − log p<sub>S</sub><br/>gₜ = σ(βΔₜ) = 1 / (1 + exp(−βΔₜ))', symbols: [{ sym: 'gₜ', desc: '第 t 个 token 的辅助蒸馏权重。' }, { sym: 'β', desc: '门的锐度；越大越接近硬二值选择。' }, { sym: 'σ', desc: 'sigmoid 函数。' }] },
      takeaways: [
        { icon: '📈', title: '单调平滑', desc: 'Δ 越大，gate 越强；边界处连续变化。' },
        { icon: '🧱', title: '有界权重', desc: 'g 始终位于 0 与 1 之间。' },
        { icon: '🎚️', title: 'β 管锐度', desc: '太大近似硬门，太小近似均匀蒸馏。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-6', title: 'SDAR 如何接进 GRPO｜Training Pipeline', badge: 'both', badgeLabel: '流程',
      bridge: '有了门，再把它接回完整的 GRPO 回路。',
      analogy: { title: '主声道负责整段，辅助声道修正每拍', text: '环境像终场评委，GRPO 仍负责整段任务；教师批注只在侧路给同一个 token 打分。两股信号最终合流，但角色不对称。', componentId: 'ana-6' },
      modules: [
        { kind: 'module', id: '6.1', title: '逐拍走完一次 SDAR 更新', desc: '用上一步、下一步或自动播放依次查看学生 rollout、轨迹奖励、教师评分、gap gate 与联合更新。', componentId: 'ch6-training-loop' },
      ],
      insight: 'RL 决定“整段要完成什么”，SDAR 只为可信 token 补充“这一拍往哪里推”。',
      formula: { lead: '总目标保持 GRPO 主干，并加入缩放后的辅助项：', unicode: 'L(θ) = L<sub>GRPO</sub>(θ) + λ<sub>SDAR</sub> · L<sub>SDAR</sub>(θ)', symbols: [{ sym: 'LGRPO', desc: '由环境奖励与 group-relative advantage 驱动的强化学习主项。' }, { sym: 'LSDAR', desc: '经 token gate 加权的自蒸馏辅助项。' }, { sym: 'λSDAR', desc: '辅助蒸馏相对 RL 主干的整体强度。' }] },
      takeaways: [
        { icon: '🎲', title: '先由学生采样', desc: '教师不另外生成一条 rollout。' },
        { icon: '🧩', title: '两种反馈合流', desc: '轨迹优势与 token 权重从不同粒度互补。' },
        { icon: '↩️', title: '只更新学生', desc: '教师项与 gate 在当前步停止梯度。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-7', title: 'λ 与 β：音量和灵敏度不能混为一谈', badge: 'trn', badgeLabel: '消融',
      bridge: '回路结构确定后，关键是两只旋钮各管什么。',
      analogy: { title: '一只管总音量，一只管判断锐度', text: 'λ 决定教师声道整体有多响；β 决定每一拍的信任判断有多接近开关。两者控制不同层级，不能互相替代。', componentId: 'ana-7' },
      modules: [
        { kind: 'module', id: '7.1', title: '找到不过弱、不过硬、也不盖住 RL 的位置', desc: '只选择论文实际测试的离散档位，不把它们插值成虚构的二维成绩面。', componentId: 'ch7-hyperparameter-balance' },
      ],
      insight: '在报告的消融范围内，λ=0.01 与 β=5 最好；这是一项实验结论，不是跨任务定律。',
      formula: { lead: '两只旋钮分别作用在目标外层与 token 门内层：', unicode: 'L = L<sub>GRPO</sub> + λ · Agg[gₜ · Δₜ]，　gₜ = σ(βΔₜ)', symbols: [{ sym: 'λ', desc: '控制整条 SDAR 辅助声道的总强度。' }, { sym: 'β', desc: '控制 token 级 gate 对 gap 的敏感度。' }, { sym: 'Agg', desc: '对有效 token 辅助项进行聚合。' }] },
      takeaways: [
        { icon: '🔊', title: 'λ 管总量', desc: '太小帮助有限，太大可能压过 RL。' },
        { icon: '🔬', title: 'β 管选择', desc: '太小近似均匀，太大近似硬门。' },
        { icon: '🟢', title: '报告配置', desc: '论文默认 λ=0.01、β=5.0。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-8', title: '点击结构图，追踪每一股信号', badge: 'both', badgeLabel: '结构',
      bridge: '参数直觉建立后，回到系统图检查每股信号的去向。',
      analogy: { title: '沿闭合乐谱回路追踪当前节拍', text: '当前节拍从学生出发，经过环境主回路与教师评分侧路，再回到联合损失。点击任一节点，就能看到它读什么、写什么、是否反传。', componentId: 'ana-8' },
      modules: [
        { kind: 'module', id: '8.1', title: 'SDAR Agent Loop 结构探索器', desc: '点击八个组件，追踪有效路径与对应公式。教师分支始终只评分同一个学生 token。', componentId: 'ch8-architecture-explorer' },
      ],
      insight: 'SDAR 是 RL 闭环旁的一条受控评分侧路，不是把环境 verifier 换成教师。',
      formula: { lead: '点击结构图时，下面四个量会在同一关系中被定位：', unicode: 'reward → L<sub>GRPO</sub>；　(log π<sub>T</sub> − log π<sub>θ</sub>) → Δ → g → L<sub>SDAR</sub>', symbols: [{ sym: 'reward', desc: '环境对完整轨迹给出的信号。' }, { sym: 'Δ', desc: '同一 token 的教师—学生 log 支持差。' }, { sym: 'g', desc: '由 Δ 产生并停止梯度的 token 权重。' }] },
      takeaways: [
        { icon: '🔁', title: '闭合 RL 回路', desc: '学生与环境的交互仍是训练主轴。' },
        { icon: '🛰️', title: '教师侧路', desc: '额外上下文只用于训练期评分。' },
        { icon: '✂️', title: '反传边界', desc: '梯度只到学生 log-likelihood 分支。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-9', title: '坏检索下还能稳吗？为什么必须 detach？', badge: 'both', badgeLabel: '稳健性',
      bridge: '结构正确仍不够：提示会变差，梯度也可能自指。',
      analogy: { title: '提示谱会变差，评分旋钮仍要锁住', text: '数据侧要问“低质量批注下是否平滑退化”，优化侧要问“评分旋钮会不会被学员反向操控”。SDAR 分别用 gate 与 stop-gradient 应对。', componentId: 'ana-9' },
      modules: [
        { kind: 'module', id: '9.1', title: '换一张提示谱，结果如何退化？', desc: '切换检索方式和指标，读取论文 Table 2 的精确数值。所有指标越高越好。', componentId: 'ch9-retrieval-robustness' },
        { kind: 'module', id: '9.2', title: '锁住评分旋钮，再更新学生', desc: '切换 detach 与不 detach，观察自指耦合路径是否出现。', componentId: 'ch9-stop-gradient' },
      ],
      insight: '检索噪声与梯度耦合是两个不同风险：前者靠选择性信任缓冲，后者靠 stop-gradient 切断。',
      formula: { lead: '在停止梯度下，token 辅助项作为固定权重作用于学生 likelihood：', unicode: 'ℓ<sub>SDAR,t</sub> = stopgrad(gₜ, log π<sub>T</sub>) · [log π<sub>T</sub> − log π<sub>θ</sub>]', symbols: [{ sym: 'stopgrad', desc: '当前更新步不让梯度流入 gate 或教师评分。' }, { sym: 'gₜ', desc: '作为固定的 token 权重参与学生更新。' }, { sym: 'log πθ', desc: '唯一承接该辅助项梯度的学生 log-likelihood。' }] },
      takeaways: [
        { icon: '🌦️', title: '平滑退化', desc: '在 Table 2 设置内，较差检索仍优于无 OPSD 基线。' },
        { icon: '🔒', title: 'detach gate', desc: '把当前评分权重锁住，再更新学生。' },
        { icon: '⚠️', title: '不做普遍保证', desc: '不能据此断言任意坏技能都安全。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-10', title: '结果是否证明 Gate 必要｜Results & Limits', badge: 'inf', badgeLabel: '结果',
      bridge: '最后用精确表格判断收益，并给结论画边界。',
      analogy: { title: '同一台琴、同一首曲，才是公平比赛', text: '先锁定模型和指标，再比较 GRPO 与 SDAR。成绩提升可以精确计算，但不能越过论文测试的三种模型与三个任务去宣称普遍最优。', componentId: 'ana-10' },
      modules: [
        { kind: 'module', id: '10.1', title: '让 GRPO 与 SDAR 在同一赛道上比较', desc: '切换模型与指标，或播放四项结果竞赛。图表和下方完整表格均使用论文 Table 1 精确值。', componentId: 'ch10-results-race' },
      ],
      insight: '表中，SDAR 相对同模型 GRPO 基线在四项指标上均提高；这不等于它在所有方法、所有环境中都第一。',
      formula: { lead: '公平比较只计算同模型、同指标下的差值：', unicode: '提升 = Metric(SDAR) − Metric(GRPO)　（四项指标均为越高越好）', symbols: [{ sym: 'Metric', desc: 'ALFWorld Success、Search-QA Accuracy、WebShop Score 或 WebShop Acc。' }, { sym: '提升', desc: '同一模型同一指标下的绝对百分点/分数差。' }] },
      takeaways: [
        { icon: '📊', title: '报告内稳定提升', desc: '三种模型的四项同基线比较均为正。' },
        { icon: '🧪', title: '消融相互印证', desc: 'gap gate、β=5、λ=.01 与 reverse KL 得到支持。' },
        { icon: '🗺️', title: '边界必须保留', desc: '跨模型、跨环境的普遍性仍是开放问题。' },
      ],
    },
  ],
  bilibili: [
    { bvid: 'BV1yX4aznE9s', title: '300行代码从零实现GRPO算法，手把手教你实现 Agent RL，训练 Agentic RAG', reason: '实现 / Agent RL · 相关基础，不是本论文官方解读', cover: 'https://i2.hdslb.com/bfs/archive/0fa12ac8b189ebc43b797f0d83137c8859b4f3d8.jpg', views: '3.1万播放' },
    { bvid: 'BV1FTjxzaEHb', title: '【吴恩达大模型 · 中英】使用 GRPO 对大模型进行强化微调', reason: 'GRPO 基础 · 相关基础，不是本论文官方解读', cover: 'https://i2.hdslb.com/bfs/archive/922be86ef603b261594d96d06a94b0dba61eae10.jpg', views: '1874播放' },
    { bvid: 'BV1qaPZzHESy', title: '【2026版】高校大模型通用教程！上交大《动手学大模型智能体》', reason: '智能体背景 · 相关基础，不是本论文官方解读', cover: 'https://i1.hdslb.com/bfs/archive/69b4b414b8373826719ececc5190950fda54b1ab.jpg', views: '1.4万播放' },
    { bvid: 'BV1M9NyeVEUp', title: 'DeepSeek-R1核心算法GRPO讲解：从强化学习、PPO 到 GRPO', reason: 'PPO → GRPO · 相关基础，不是本论文官方解读', cover: 'https://i1.hdslb.com/bfs/archive/cffafbcdb55414e7db7a2286d893de8aa9181114.jpg', views: '2.1万播放' },
  ],
};
