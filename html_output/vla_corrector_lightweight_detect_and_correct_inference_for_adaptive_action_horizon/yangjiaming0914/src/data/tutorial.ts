import type { TutorialData } from '../types';

const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path}`;
const conclusion = (text: string) => [{ icon: '所以', title: text, desc: '' }, { icon: '', title: '', desc: '' }, { icon: '', title: '', desc: '' }];

const SYMBOL_LABELS: Record<string, string> = {
  horizon: '动作时域 H', chunk_length: '动作块长度 C',
  action_chunk: '完整动作块 Aₜ', first_action: '第一步动作 aₜ', chunk_c: '动作块长度 C', execution_queue: '执行队列 Qₜ', horizon_h: '执行时域 H',
  no_interrupt: '未触发条件', persistent: '持续异常条件', truncated_queue: '截断后的队列', adaptive_horizon: '自适应时域', ogg_once: '下一次调用的 OGG', ogg_off: 'OGG 关闭',
  success_gain: '成功率绝对提升', corrector_sr: 'VLA-Corrector 成功率', baseline_sr: '基线成功率',
};
const mSym = (id: string, tip: string, body: string) => `<mrow data-sym="${id}" data-label="${SYMBOL_LABELS[id] || id}" data-tip="${tip}" tabindex="0" role="button" aria-label="${SYMBOL_LABELS[id] || id}：${tip}">${body}</mrow>`;
const group = (label: string, source: string, body: string) => `<section class="mathml-group"><header><span>${label}</span><small>${source}</small></header><div class="mathml-scroll"><math display="block">${body}</math></div></section>`;
const sub = (base: string, value: string) => `<msub>${base}${value}</msub>`;
const subSup = (base: string, below: string, above: string) => `<msubsup>${base}${below}${above}</msubsup>`;
const mi = (value: string) => `<mi>${value}</mi>`;
const upright = (value: string) => `<mtext class="math-upright">${value}</mtext>`;

const formulaH = group('动作时域的基本约束', '论文 §2 · 式 (1)', `<mrow><mn>1</mn><mo>≤</mo>${mSym('horizon', '动作时域 H：一轮中不重新规划而连续执行的动作数。', mi('H'))}<mo>≤</mo>${mSym('chunk_length', '动作块长度 C：VLA 一次生成的动作总数。执行器只能从这 C 个动作中取前缀，所以 H 不能超过 C。', mi('C'))}</mrow>`);

const formulaChunk = group('生成整块，执行前缀', '论文 §2 · 式 (1)', `<mtable rowspacing="1.05em" columnalign="right center left" columnspacing="0.85em"><mtr><mtd>${mSym('action_chunk', 'VLA 在时刻 t 一次生成的完整 C 步动作块。', sub(mi('A'), mi('t')))}</mtd><mtd><mo>=</mo></mtd><mtd><mrow><mo>[</mo>${mSym('first_action', '动作块的第一步。', sub(mi('a'), mi('t')))}<mo>,</mo><mo>…</mo><mo>,</mo>${sub(mi('a'), `<mrow><mi>t</mi><mo>+</mo>${mSym('chunk_c', '最后一个下标由动作块长度 C 决定。', mi('C'))}<mo>−</mo><mn>1</mn></mrow>`)}<mo>]</mo></mrow></mtd></mtr><mtr><mtd>${mSym('execution_queue', '本轮真正交给控制器连续执行的前缀。', sub(mi('Q'), mi('t')))}</mtd><mtd><mo>=</mo></mtd><mtd><mrow><mo>[</mo>${sub(mi('a'), mi('t'))}<mo>,</mo><mo>…</mo><mo>,</mo>${sub(mi('a'), `<mrow><mi>t</mi><mo>+</mo>${mSym('horizon_h', '本轮只连续执行前 H 步。', mi('H'))}<mo>−</mo><mn>1</mn></mrow>`)}<mo>]</mo></mrow></mtd></mtr><mtr><mtd><mtext class="math-note">可执行范围</mtext></mtd><mtd><mo>:</mo></mtd><mtd><mrow><mn>1</mn><mo>≤</mo>${mSym('horizon_h', 'H 是从动作块开头连续取出的动作数。', mi('H'))}<mo>≤</mo>${mSym('chunk_c', '动作块里总共只有 C 个已生成动作，因此 H 不能比 C 大。', mi('C'))}</mrow></mtd></mtr></mtable>`);

const formulaSystem = [
  group('正常循环', '论文图 3 · §3.2–3.3', `<mrow>${mSym('no_interrupt', '持续异常条件尚未成立，当前动作队列仍可继续消费。', `<msub><mi>c</mi><mi>t</mi></msub><mo>&lt;</mo><mi>p</mi>`)}<mo>⇒</mo><mtext>execute next action and monitor</mtext></mrow>`),
  group('触发并截断', '论文 §3.2 · 附录 B.1', `<mrow>${mSym('persistent', '持续计数达到 patience p，触发当前动作块中断。', `<msub><mi>c</mi><mi>t</mi></msub><mo>≥</mo><mi>p</mi>`)}<mo>⇒</mo>${mSym('truncated_queue', '队列只保留已经执行到触发位置 h 的前缀，后续旧动作被丢弃。', `<msub><mi>Q</mi><mi>t</mi></msub><mo>←</mo><mo>[</mo><msub><mi>a</mi><mi>t</mi></msub><mo>,</mo><mo>…</mo><mo>,</mo><msub><mi>a</mi><mrow><mi>t</mi><mo>+</mo><mi>h</mi><mo>−</mo><mn>1</mn></mrow></msub><mo>]</mo>`)}<mo>,</mo><mspace width=".5em"/>${mSym('adaptive_horizon', '本次动作块实际执行 h 步，因此比原计划 H 更短。', `<msub><mi>H</mi><mtext>adaptive</mtext></msub><mo>=</mo><mi>h</mi><mo>&lt;</mo><mi>H</mi>`)}</mrow>`),
  group('只纠正下一次调用', '论文 §3.3 · 附录 B.2', `<mrow>${mSym('ogg_once', '中断后的第一次 VLA 查询启用 OGG，引导这一次动作块生成。', `<mtext>OGG</mtext><mo>(</mo><mtext>next query</mtext><mo>)</mo><mo>=</mo><mtext>ON</mtext>`)}<mo>⇒</mo>${mSym('ogg_off', '该动作块生成完毕后，OGG 关闭，后续回到普通 VLA 推理。', `<mtext>OGG</mtext><mo>(</mo><mtext>later queries</mtext><mo>)</mo><mo>=</mo><mtext>OFF</mtext>`)}</mrow>`),
].join('');

const formulaGain = group('同一协议内的绝对提升', '论文表 1、2、5', `<mrow>${mSym('success_gain', '同一数据集、同一协议下的成功率绝对提升，单位为百分点。', '<mo>Δ</mo><mi>S</mi><mi>R</mi>')}<mo>=</mo>${mSym('corrector_sr', '相同协议下使用 VLA-Corrector 的成功率。', sub('<mrow><mi>S</mi><mi>R</mi></mrow>', upright('Corrector')))}<mo>−</mo>${mSym('baseline_sr', '与之配对、训练条件相符的基线成功率。', sub('<mrow><mi>S</mi><mi>R</mi></mrow>', upright('baseline')))}</mrow>`);

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'VLA-Corrector',
    titleZh: '用轻量监视器为 VLA 动态缩短动作时域',
    venue: '2026',
    authors: 'Yi Pan, Miao Pan, Qi Lu, Jiaming Huang, Man Zhang, Siteng Huang, Xin Li, Jie Zhang, Yongliang Shen, Xuhong Zhang, Wenqi Zhang',
    affiliation: '浙江大学 · 阿里巴巴',
    domain: '视觉—语言—动作模型 · 机器人操作 · 流匹配',
    coreProblem: 'VLA 一次生成一串动作。执行期间目标突然移动，机器人为什么还会继续走旧计划？',
    coreInsight: '<span class="minute-kicker">一分钟内核</span><b>VLA 为了减少昂贵调用，会连续执行动作块。</b>轻量 LVM 持续比较“动作本应造成的视觉变化”和“新相机画面里的真实变化”；只有偏差连续成立，才截断旧队列，并给下一次重规划施加一次 OGG 引导。<small>VLA-Corrector: Lightweight Detect-and-Correct Inference for Adaptive Action Horizon</small>',
    keywords: ['动作时域 H', '潜变量监视器 LVM', '一次性 OGG'],
  },
  hero: {
    oldMethod: { desc: '<b>固定动作时域：</b>目标碗被移动后，机械臂仍消费指向旧位置的动作 token。', componentId: 'studio-hero' },
    newMethod: { desc: '<b>VLA-Corrector：</b>持续偏差触发截断；下一次重规划纠正一次，然后恢复普通推理。', componentId: 'studio-hero' },
  },
  chapters: [
    {
      kind: 'chapter', id: 'chap-1', title: '为什么固定动作时域存在矛盾？', badge: 'inf', badgeLabel: '从问题出发',
      bridge: 'VLA 像机械臂的高层动作规划器：一次调用成本较高，因此系统倾向于连续执行一批已经生成的动作。',
      analogy: { title: '同一只机械臂，同一个突然移动的碗', text: '机械臂每次拿到一串动作后连续执行。连续得越久，VLA 调用越少；碗被移动后，旧动作也会多执行几步。', componentId: 'studio-analogy' },
      modules: [
        { kind: 'module', id: '1.1', title: '已经看见变化，VLA 没有立刻重跑', desc: '开始执行后拖动绿色目标碗。对照相机提示与机械臂轨迹：新观测每步都到达，但主策略并不会因此每步重新规划。', componentId: 'fixed-h-mission' },
        { kind: 'module', id: '1.2', title: '同一个扰动落在不同 H 里，会等多久？', desc: '拖动扰动发生的时刻。H=1、5、10 三条同步时间轴会显示下一次 VLA 调用和仍在消费旧动作的红色等待区。', componentId: 'horizon-choice' },
      ],
      formula: { lead: 'H 是一轮中不重新规划而连续执行的步数；它不能超过一次已经生成的动作数 C。', unicode: formulaH, symbols: [{ sym: 'horizon', desc: '动作时域 H。' }, { sym: 'chunk_length', desc: '动作块长度 C。' }] },
      insight: '论文不是预测未来扰动，而是在新观测到达后发现旧动作开始失效，再动态缩短这一次的 H。',
      takeaways: conclusion('固定 H 只能预先选一个折中；VLA-Corrector 让执行中的真实偏差决定何时提前停。'),
    },
    {
      kind: 'chapter', id: 'chap-2', title: 'C 和 H 到底分别表示什么？', badge: 'inf', badgeLabel: '拆开两个长度',
      bridge: 'C（Chunk Length，动作块长度）表示 VLA 一次生成多少个动作；H（Action Horizon，动作时域）表示控制器在重新规划前连续执行其中多少个。',
      analogy: { title: '动作 token 是机械臂接下来可能执行的小步骤', text: 'VLA 一次给出 C 个 token，控制器只把前 H 个放进本轮执行前缀；H ≤ C，后面的动作不一定会被执行。', componentId: 'studio-analogy' },
      modules: [
        { kind: 'module', id: '2.1', title: '生成 C 步，为什么这一轮只执行前 H 步？', desc: '选择动作块长度 C，再拖动执行边界 H。队列、机械臂轨迹和暂不执行的后缀会同步变化。', componentId: 'chunk-builder' },
        { kind: 'module', id: '2.2', title: '谁负责看、生成和执行？', desc: '依次选择视觉编码器、VLA 与执行队列，查看各自的输入和输出。新图像会持续进入系统，但只有调用 VLA 才会生成新动作块。', componentId: 'vla-role-map' },
      ],
      formula: { lead: '动作队列只能从已经生成的 C 个动作中取前缀，因此 H 最多等于 C。H=C 表示整块执行，H<C 表示只执行前一部分。', unicode: formulaChunk, symbols: [{ sym: 'action_chunk', desc: '完整动作块。' }, { sym: 'execution_queue', desc: '执行队列。' }, { sym: 'first_action', desc: '单步动作。' }, { sym: 'chunk_c', desc: '动作块长度 C。' }, { sym: 'horizon_h', desc: '动作时域 H。' }] },
      insight: 'VLA-Corrector 不改变主策略一次生成的 C；异常触发后，系统丢弃队列里尚未执行的动作，让这一次实际 H 变短。',
      takeaways: conclusion('C 是“备了多少动作”，H 是“这次承诺执行多少”；检测到异常后缩短的是后者。'),
    },
    {
      kind: 'chapter', id: 'chap-3', title: 'Corrector 怎样学会“动作应该造成什么变化”？', badge: 'trn', badgeLabel: '学习预期效果',
      bridge: '动作前后的两次真实观测给出训练目标，轻量 Corrector 据此学习动作应造成的视觉特征变化。',
      analogy: { title: '真实残差需要动作前后两帧观测', text: '机械臂、夹爪和物体会真实移动；冻结视觉编码器分别编码动作前后的画面，两者之差才是“真实残差”。', componentId: 'studio-analogy' },
      modules: [
        { kind: 'module', id: '3.1', title: '真实残差来自哪两帧观测？', desc: '按时间顺序查看动作前画面、真实执行、动作后画面和特征相减。机械臂与物体的位置会随步骤变化。', componentId: 'residual-observer' },
        { kind: 'module', id: '3.2', title: 'L2 与余弦项分别教会 Corrector 什么？', desc: '选择 L2、余弦或论文组合损失并播放训练过程。紫色预测向量、长度误差、方向误差和总损失会同步变化。', componentId: 'corrector-trainer' },
      ],
      insight: '页面里的二维箭头只是高维潜变量残差的教学投影，不是机械臂末端在真实空间里的位移。',
      takeaways: conclusion('Corrector 学的是“动作效果模型”：它预测视觉特征变化，但不直接生成或替代 VLA 动作。'),
    },
    {
      kind: 'chapter', id: 'chap-4', title: 'LVM 怎样发现偏差，又怎样避免误报？', badge: 'both', badgeLabel: '从分数到触发',
      bridge: 'LVM（Latent space Vision Monitor，潜在空间视觉监视器）是执行期间的“偏差检测器”：先比较预期与真实残差的方向，再判断异常是瞬时噪声还是持续偏离。',
      analogy: { title: '一次遮挡和目标真正移位，不该得到同样结论', text: '短暂遮挡可能只制造一个分数尖峰；碗被持续移走才会让偏差连续成立。LVM 判断已经到达的新观测，不会预知未来。', componentId: 'studio-analogy' },
      modules: [
        { kind: 'module', id: '4.1', title: '拖动真实变化，看看 LVM 如何得到 Eₜ', desc: '紫色预期方向固定，橙色真实方向来自新观测。拖动橙色端点，夹角和 Eₜ 会一起变化；0°、90°、180°可直接对照。', componentId: 'cosine-challenge' },
        { kind: 'module', id: '4.2', title: '一条时间线：尖峰为什么不触发，持续偏差为什么会？', desc: 'T_on 是进入异常的高门槛，T_off 是确认恢复的低门槛。逐点播放时，观察当前 Eₜ 会让计数加一、保持还是清零。', componentId: 'robust-trigger' },
      ],
      insight: '窗口 15、连续 5 步、5 个安全步复位和冷却 10 步是论文运行设置，不是所有系统都必须采用的常数。',
      takeaways: conclusion('一个高 Eₜ 只说明这一步方向不一致；稳健统计、双阈值与持续证据共同决定是否真的中断。'),
    },
    {
      kind: 'chapter', id: 'chap-5', title: '触发后，OGG 怎样纠正下一次动作生成？', badge: 'inf', badgeLabel: '一次性恢复引导',
      bridge: 'OGG（Online Gradient Guidance，在线梯度引导）是一次性的生成纠偏：系统先截断不再可信的旧动作，再用 OGG 轻推下一次 VLA 生成，新动作块完成后立即关闭。',
      analogy: { title: '旧 token 被截断，新动作块接管执行', text: '红色虚线保留旧路径，绿色实线表示下一次生成的新路径；这次 OGG 结束后，系统回到普通推理。', componentId: 'studio-analogy' },
      modules: [
        { kind: 'module', id: '5.1', title: '动作队列：触发后究竟删掉了什么？', desc: '沿四个阶段观察已执行、待执行、被截断和重新生成的 token，并区分“停止旧动作”与“得到恢复动作”。', componentId: 'replan-comparison' },
        { kind: 'module', id: '5.2', title: 'OGG 怎样只改动中断后的下一次生成？', desc: '从候选动作出发，依次查看效果预测、方向损失、速度调整和新动作块。η 消融结果同时说明为何论文在这组测试中选择 η=1。', componentId: 'ogg-workshop' },
      ],
      insight: 'VLA 参数始终冻结，但触发 OGG 时仍需推理时梯度计算；冻结主干不等于零额外成本。',
      takeaways: conclusion('OGG 只扶正中断后的下一次 VLA 调用；新动作块产生后关闭，系统回到普通推理。'),
    },
    {
      kind: 'chapter', id: 'chap-6', title: '检测—截断—纠正—恢复怎样连成一个系统？', badge: 'both', badgeLabel: '完整任务',
      bridge: '回到完整机械臂任务：执行旧块、目标移动、累积证据、截断、一次 OGG，最后回到正常循环。',
      analogy: { title: '把前面的机制放回同一次放置任务', text: '拖动目标碗制造扰动。动作 token、偏差曲线、计数与机械臂轨迹会沿同一条时间线同步变化。', componentId: 'studio-analogy' },
      modules: [
        { kind: 'module', id: '6.1', title: '完整恢复任务：你移动碗，系统负责发现并恢复', desc: '可播放、暂停、单步、重置或拖动时间线；绿色碗也能直接拖动。状态会经过正常执行、发现偏差、截断、一次 OGG 与恢复普通推理。', componentId: 'recovery-mission' },
        { kind: 'module', id: '6.2', title: '正常观测和持续偏差会走同一条路线吗？', desc: '选择一种观测并逐步推进状态机：正常路线直接循环，持续偏差才进入截断、一次 OGG 和恢复分支。', componentId: 'system-path' },
      ],
      formula: { lead: '这不是新增的论文编号公式，而是按论文图 3 和附录状态机整理出的两条执行分支。', unicode: formulaSystem, symbols: [{ sym: 'no_interrupt', desc: '尚未触发。' }, { sym: 'persistent', desc: '持续异常证据成立。' }, { sym: 'ogg_off', desc: '一次恢复查询后关闭 OGG。' }] },
      insight: '系统先利用长动作块的效率；只有真实偏差持续出现，才让当前执行时域提前结束并支付一次恢复成本。',
      takeaways: conclusion('论文主线是一条闭环：预测期望变化 → 检测持续偏差 → 截断旧队列 → 下一次生成纠正 → 回到普通执行。'),
    },
    {
      kind: 'chapter', id: 'chap-7', title: '实验说明了什么，代价和边界又是什么？', badge: 'both', badgeLabel: '证据与边界',
      bridge: '论文测试显示鲁棒性有所提升；与此同时，外置 Corrector、逐步监控和触发时梯度都会带来成本，方法也有明确边界。',
      analogy: { title: '分协议阅读不同结果', text: 'MetaWorld、LIBERO 与 PiPER 分开比较。不同数据集、训练条件和汇总口径不能放在同一坐标轴上排名。', componentId: 'studio-analogy' },
      modules: [
        { kind: 'module', id: '7.1', title: '论文到底提升了多少？', desc: '切换 MetaWorld、LIBERO 和实机证据板。每个条形都从零开始，并标出精确数值和对应的比较条件。', componentId: 'result-race' },
        { kind: 'module', id: '7.2', title: '部署判断：哪些情况有机会恢复，哪些不能承诺？', desc: '逐个判断目标移动、遮挡、接触误差与不可达姿态，并查看参数量、时延、墙钟开销和失败边界。', componentId: 'deployment-judge' },
      ],
      formula: { lead: '实验提升只在同一协议、同一基线内相减，单位是百分点；不同数据集不做跨轴排名。', unicode: formulaGain, symbols: [{ sym: 'success_gain', desc: '同一协议内的成功率绝对提升。' }] },
      insight: '论文结果支持“在测试设置中提升鲁棒性”，不支持“可以恢复任何扰动”。',
      takeaways: conclusion('证据表明方法在论文协议内更鲁棒；它仍受视觉可见性、接触反馈、可达姿态和主干动作能力限制。'),
    },
  ],
  bilibili: [
    { bvid: 'BV1QxB9YuERU', title: '具身智能大模型简介', reason: '先补齐 VLA 与具身智能的整体背景，再回看本文会更容易理解。', cover: publicAsset('images/bili-embodied-overview.jpg'), views: '8.6万播放' },
    { bvid: 'BV1SEdWBXEqj', title: 'π0：Flow Matching + VLM 架构详解', reason: '帮助理解 VLA 动作生成与流匹配，为第 5 章 OGG 建立必要背景。', cover: publicAsset('images/bili-pi0-flow.jpg'), views: '1.2万播放' },
    { bvid: 'BV18gdhBGEME', title: '机器人学习入门：模仿学习、规划与强化学习', reason: '适合希望继续理解机器人策略学习与恢复边界的读者。', cover: publicAsset('images/bili-robot-learning.jpg'), views: '8.3万播放' },
  ],
};
