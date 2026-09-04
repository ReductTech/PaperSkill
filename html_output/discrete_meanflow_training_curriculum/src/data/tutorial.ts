import type { TutorialData, FormulaDef } from '../types';

const formula = (lead: string, unicode: string, mathml: string, symbols: FormulaDef['symbols']): FormulaDef => ({ lead, unicode, mathml, symbols });

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'Discrete Meanflow Training Curriculum',
  titleZh: '离散 MeanFlow 训练课程：从预训练流模型到高效单步生成',
  venue: '论文交互精讲',
    authors: 'Discrete MeanFlow authors',
    affiliation: '研究论文教学重制',
    domain: '生成模型 · Flow Matching · MeanFlow · 课程学习',
    coreProblem: 'Flow Matching 推理要反复积分；连续 MeanFlow 虽能一步生成，但训练需要昂贵 JVP，且目标难优化。',
    coreInsight: '用有限差分构造由易到难的中间目标：先 FM，再逐步缩小 Δ，最后才切回连续 MeanFlow/JVP。',
    keywords: ['Flow Matching', 'MeanFlow', 'DMF', 'JVP', '有限差分', 'VE 坐标'],
  },
  hero: {
    oldMethod: { desc: 'Flow：每到一个位置都重新查询瞬时速度，沿弯曲轨迹反复积分。', canvasAlt: '蓝色登山者沿弯曲山路分多步前进，每一步出现新的局部路标。', componentId: 'dmf-hero' },
    newMethod: { desc: 'MeanFlow：学习整段平均速度，希望一次跨到目标；DMF 负责把训练过程拆成课程。', canvasAlt: '绿色登山者沿端点弦一步跨向营地，橙色检查点表示有限差分课程。', componentId: 'dmf-hero' },
  },
  chapters: [
    {
      kind: 'chapter', id: 'chap-1', title: 'Flow Matching：学习当前位置的瞬时速度', badge: 'inf', badgeLabel: '基础',
      bridge: '先把“线性训练路径”和“生成时的边缘速度场”分清：固定配对的条件速度恒定，并不等于推理时知道该往哪里走。',
      analogy: { title: '路标只告诉此刻怎么走', text: '一名登山者站在山路当前位置，读取眼前的<b>方向路标</b>，目标是沿路靠近营地。', canvasAlt: '山路、单名登山者、当前位置路标和远处营地均可见；路标箭头随登山者位置转动。', componentId: 'dmf-analogy' },
      modules: [{kind:'module',id:'1.1',title:'拖动 t：看数据如何混入噪声',desc:'拖动时间 <b>t</b>，同时观察混合比例、路径位置和条件瞬时速度。速度箭头对固定配对保持不变。',canvasAlt:'一条连接数据 z0 与噪声 epsilon 的直线；滑块改变橙色 z_t 位置、两段混合比例和数值，蓝色速度箭头方向与长度固定。',componentId:'dmf-module'}],
      insight: '训练时知道配对，所以 ε−z₀ 可直接监督；生成时只有 zₜ,t，网络必须从许多配对中学出条件于当前位置的边缘速度。',
      formula: formula('线性路径对固定配对求导，得到条件速度：', 'z_t=(1−t)z₀+tε,   v_t=dz_t/dt=ε−z₀', '<math display="block"><mrow><msub><mi data-sym="z_t">z</mi><mi>t</mi></msub><mo>=</mo><mo>(</mo><mn>1</mn><mo>−</mo><mi data-sym="t">t</mi><mo>)</mo><msub><mi>z</mi><mn>0</mn></msub><mo>+</mo><mi>t</mi><mi data-sym="epsilon">ε</mi><mo>,</mo><mspace width="1.2em"/><msub><mi data-sym="v_t">v</mi><mi>t</mi></msub><mo>=</mo><mfrac><mrow><mi>d</mi><msub><mi>z</mi><mi>t</mi></msub></mrow><mrow><mi>d</mi><mi>t</mi></mrow></mfrac><mo>=</mo><mi>ε</mi><mo>−</mo><msub><mi>z</mi><mn>0</mn></msub></mrow></math>', [{sym:'z_t',desc:'时刻 t 的混合状态。'}, {sym:'t',desc:'从数据端 0 到噪声端 1 的时间坐标。'}, {sym:'epsilon',desc:'标准高斯噪声。'}, {sym:'v_t',desc:'固定配对的条件瞬时速度；推理网络学习的是边缘速度场。'}]),
      takeaways: [{icon:'🎯',title:'对象',desc:'网络只观察 zₜ 与 t。'}, {icon:'🔧',title:'监督',desc:'固定配对给出 ε−z₀。'}, {icon:'✨',title:'边界',desc:'配对速度恒定不代表推理无需网络。'}],
    },
    {
      kind:'chapter', id:'chap-2', title:'Flow 为什么需要反复积分', badge:'inf', badgeLabel:'推理',
      bridge:'生成从噪声 z₁ 出发，反向求解 ODE。真实边缘速度场会随位置变化，因此每走一步都要重新查询。',
      analogy:{title:'沿弯路走许多小步',text:'一名登山者每到一个<b>局部路标</b>就重新定向，沿弯曲山路逐步走向营地。',canvasAlt:'弯曲山路上只有一名登山者；多个路标依次亮起，已走路径增长，营地固定在终点。',componentId:'dmf-analogy'},
      modules:[
        {kind:'module',id:'2.1',title:'反向 Euler 步进器',desc:'逐次点击“走一步”，查看当前时间、局部速度、累计 NFE、已走路径与剩余误差。',canvasAlt:'弯曲玩具轨迹从噪声端通向数据端；每次点击使登山点沿反向 Euler 折线前进，速度箭头转向，NFE 增加，剩余误差下降。',componentId:'dmf-module'},
        {kind:'module',id:'2.2',title:'同步比较：一次大跳 vs 多次查询',desc:'两侧使用相同噪声起点与同一个玩具速度场。残差来自<b>轨迹弯曲</b>，不是论文实测值。',canvasAlt:'左侧只用起点切线作一次大步，终点偏离数据目标；右侧多步重新查询速度并沿弯曲轨迹靠近目标，同时显示 NFE 和玩具残差。',componentId:'dmf-module'},
      ],
      insight:'Euler 步数越多，通常越能追随弯曲轨迹，但 NFE 也随之增加；这里的误差只用于展示数值积分几何。',
      formula:formula('从较噪的 t 反向走到 t−δ：','z_{t−δ}≈z_t−v_t(z_t)δ','<math display="block"><mrow><msub><mi>z</mi><mrow><mi>t</mi><mo>−</mo><mi data-sym="delta">δ</mi></mrow></msub><mo>≈</mo><msub><mi data-sym="z_t">z</mi><mi>t</mi></msub><mo>−</mo><msub><mi data-sym="v_t">v</mi><mi>t</mi></msub><mo>(</mo><msub><mi>z</mi><mi>t</mi></msub><mo>)</mo><mi>δ</mi></mrow></math>',[{sym:'delta',desc:'一次反向 Euler 步长。'},{sym:'v_t',desc:'当前位置重新查询到的瞬时速度。'},{sym:'z_t',desc:'当前状态。'}]),
      takeaways:[{icon:'🎯',title:'起点',desc:'从 t=1 的噪声反向生成。'},{icon:'🔧',title:'代价',desc:'每次查询速度记一次 NFE。'},{icon:'✨',title:'原因',desc:'局部切线不能独自概括弯曲轨迹。'}],
    },
    {
      kind:'chapter',id:'chap-3',title:'MeanFlow：平均速度一步跨完整区间',badge:'both',badgeLabel:'关键转折',
      bridge:'瞬时速度描述一点的切线；平均速度用两个真实端点定义整段位移，因此几何上对应区间弦。',
      analogy:{title:'读取整段路线摘要',text:'一名登山者打开包含<b>起点、营地与整段箭头</b>的路线摘要，目标是一次确认整体方向。',canvasAlt:'单名登山者持路线卡，卡上明确画出当前位置、营地和连接两端的绿色箭头。',componentId:'dmf-analogy'},
      modules:[
        {kind:'module',id:'3.1',title:'拖动 r,t：切线与端点弦',desc:'在真实玩具轨迹上拖动区间端点。蓝色切线是当前瞬时速度，绿色弦严格由 zᵣ 与 zₜ 决定。',canvasAlt:'弯曲轨迹上可拖动 r 和 t；蓝色切线随 t 转动，绿色弦的两端、位置和长度随真实端点同步变化，显示区间长度与平均速度。',componentId:'dmf-module'},
        {kind:'module',id:'3.2',title:'Flow 多步 vs MeanFlow 一步',desc:'Flow 侧重复积分；MeanFlow 侧只用一次区间平均速度更新。两侧显示 NFE、终点和玩具残差。',canvasAlt:'相同噪声起点下，左侧沿曲线多步前进，右侧沿端点弦一步到达其预测终点；结果面板并列 NFE 与残差，不声称真实模型必为零。',componentId:'dmf-module'},
      ],
      insight:'一步更新是 MeanFlow 的定义性目标；是否能在真实数据上准确一步到达，取决于平均速度网络学得多准。',
      formula:formula('平均速度直接把区间位移除以区间长度：','u(z_t,r,t)=(z_t−z_r)/(t−r),   z_r=z_t−(t−r)u(z_t,r,t)','<math display="block"><mrow><mi data-sym="u">u</mi><mo>(</mo><msub><mi>z</mi><mi>t</mi></msub><mo>,</mo><mi data-sym="r">r</mi><mo>,</mo><mi data-sym="t">t</mi><mo>)</mo><mo>=</mo><mfrac><mrow><msub><mi>z</mi><mi>t</mi></msub><mo>−</mo><msub><mi>z</mi><mi>r</mi></msub></mrow><mrow><mi>t</mi><mo>−</mo><mi>r</mi></mrow></mfrac><mo>,</mo><mspace width="1em"/><msub><mi>z</mi><mi>r</mi></msub><mo>=</mo><msub><mi>z</mi><mi>t</mi></msub><mo>−</mo><mo>(</mo><mi>t</mi><mo>−</mo><mi>r</mi><mo>)</mo><mi>u</mi><mo>(</mo><msub><mi>z</mi><mi>t</mi></msub><mo>,</mo><mi>r</mi><mo>,</mo><mi>t</mi><mo>)</mo></mrow></math>',[{sym:'u',desc:'区间 [r,t] 的平均速度网络。'},{sym:'r',desc:'更干净的区间终点。'},{sym:'t',desc:'较噪的区间起点。'}]),
      takeaways:[{icon:'🎯',title:'瞬时',desc:'蓝色切线只描述一点。'},{icon:'🔧',title:'平均',desc:'绿色弦概括整段位移。'},{icon:'✨',title:'一步',desc:'一次更新的精度仍取决于学习质量。'}],
    },
    {
      kind:'chapter',id:'chap-4',title:'连续 MeanFlow 的 JVP 成本',badge:'trn',badgeLabel:'训练瓶颈',
      bridge:'MeanFlow 恒等式需要 u 沿状态轨迹与时间共同变化的全导数；实际训练用 JVP 在方向 (vₜ,0,1) 上计算它。',
      analogy:{title:'挪动一点检查导航建议',text:'一名登山者沿山路<b>微移一步</b>，比较前后两张路线建议，目标是测出建议变化得多快。',canvasAlt:'同一名登山者的当前位置和微移后位置由短箭头连接，两张路线建议卡的箭头方向不同；营地固定。',componentId:'dmf-analogy'},
      modules:[
        {kind:'module',id:'4.1',title:'从 MeanFlow 恒等式到 JVP：代价从哪里来',desc:'依次查看论文的 <b>MeanFlow 恒等式</b>、沿轨迹全导数的链式法则展开、<code>torch.func.jvp</code> 的实现方式，以及 JVP 为什么增加训练计算。',canvasAlt:'四步解释组件。第一步直接展示 MeanFlow 恒等式；第二步展开 du/dt；第三步把方向 (v_t,0,1) 映射到 torch.func.jvp；第四步比较普通前向与带切向传播的 JVP 路径。',componentId:'dmf-module'},
        {kind:'module',id:'4.2',title:'普通前向与 JVP 路径比较',desc:'切换计算模式，观察普通网络前向和连续 MF 训练路径的结构差异；这里只做定性比较，不捏造独立 JVP 耗时。',canvasAlt:'普通前向只有输入到输出的一条蓝色路径；JVP 模式增加紫色切向传播分支与目标构造节点，节点数和路径说明同步变化。',componentId:'dmf-module'},
      ],
      insight:'逻辑链只有四步：恒等式需要 du/dt；链式法则把它展开为方向导数；PyTorch 用 JVP 计算该方向导数；JVP 的切向传播增加训练成本。',
      formula:formula('先记住恒等式，再看其中的全导数如何展开：','u(z_t,r,t)=v_t(z_t)+(r−t)du/dt;   du/dt=(∂u/∂z_t)v_t(z_t)+∂u/∂t','<math display="block"><mtable columnalign="left"><mtr><mtd><mi data-sym="u">u</mi><mo>(</mo><msub><mi>z</mi><mi>t</mi></msub><mo>,</mo><mi>r</mi><mo>,</mo><mi>t</mi><mo>)</mo><mo>=</mo><msub><mi>v</mi><mi>t</mi></msub><mo>(</mo><msub><mi>z</mi><mi>t</mi></msub><mo>)</mo><mo>+</mo><mo>(</mo><mi>r</mi><mo>−</mo><mi>t</mi><mo>)</mo><mfrac><mrow><mi data-sym="du/dt">d</mi><mi>u</mi></mrow><mrow><mi>d</mi><mi>t</mi></mrow></mfrac></mtd></mtr><mtr><mtd><mfrac><mrow><mi data-sym="du/dt">d</mi><mi>u</mi></mrow><mrow><mi>d</mi><mi>t</mi></mrow></mfrac><mo>=</mo><mfrac><mrow><mi>∂</mi><mi>u</mi></mrow><mrow><mi>∂</mi><msub><mi>z</mi><mi>t</mi></msub></mrow></mfrac><msub><mi>v</mi><mi>t</mi></msub><mo>(</mo><msub><mi>z</mi><mi>t</mi></msub><mo>)</mo><mo>+</mo><mfrac><mrow><mi>∂</mi><mi>u</mi></mrow><mrow><mi>∂</mi><mi>t</mi></mrow></mfrac></mtd></mtr></mtable></math>',[{sym:'u',desc:'区间 [r,t] 上的平均速度。'},{sym:'du/dt',desc:'u 沿生成轨迹的全导数；PyTorch 用 JVP[uθ;(vₜ,0,1)] 计算它。'}]),
      takeaways:[{icon:'🎯',title:'先看恒等式',desc:'连续 MeanFlow 需要沿轨迹的全导数 du/dt。'},{icon:'🔧',title:'再看实现',desc:'JVP 方向是 (vₜ,0,1)。'},{icon:'✨',title:'最后看代价',desc:'切向传播增加训练计算，促使 DMF 引入有限差分。'}],
    },
    {
      kind:'chapter',id:'chap-5',title:'DMF：用有限差分替代中间 JVP',badge:'trn',badgeLabel:'方法',
      bridge:'DMF 沿轨迹做一阶 Euler 回退，在前后位置调用同一个 uθ，并用差商近似全导数。它不是让旧模型生成一个新样本。',
      analogy:{title:'后退一个检查点再比较',text:'一名登山者退到可见的<b>检查点</b>，对比检查点和当前位置的路线建议，目标是估计建议的变化率。',canvasAlt:'单名登山者、当前位置、橙色后退箭头、标有 t−Delta 的检查点、两张路线建议卡和固定营地均可见。',componentId:'dmf-analogy'},
      modules:[
        {kind:'module',id:'5.1',title:'四步推导 DMF 加权目标',desc:'依次查看 Euler 回退、前后预测、有限差商、代回并移项。公式使用原生 MathML 正确显示上下标、差商和最终分式。',canvasAlt:'四步公式推导器：第一步是一阶 Euler 回退；第二步是同一网络在前后位置的两次预测；第三步用真正的分式显示有限差商；第四步先显示移项结果，再显示含 stop-gradient 的完整 DMF 加权目标。',componentId:'dmf-module'},
      ],
      insight:'有限 Δ 给出一阶近似。把包含当前 uθ 的差商代回恒等式并移项，才得到可直接监督当前预测的加权目标。',
      formula:formula('先近似总导数，再整理目标：','du/dt≈[uθ(z_t,r,t)−uθ(z_t−v_tΔ,r,t−Δ)]/Δ;  target=[v_tΔ+(t−r)sg(u_earlier)]/(Δ+t−r)','<math display="block"><mtable columnalign="left"><mtr><mtd><mfrac><mrow><mi>d</mi><mi>u</mi></mrow><mrow><mi>d</mi><mi>t</mi></mrow></mfrac><mo>≈</mo><mfrac><mrow><msub><mi>u</mi><mi>θ</mi></msub><mo>(</mo><msub><mi>z</mi><mi>t</mi></msub><mo>,</mo><mi>r</mi><mo>,</mo><mi>t</mi><mo>)</mo><mo>−</mo><msub><mi>u</mi><mi>θ</mi></msub><mo>(</mo><msub><mi>z</mi><mi>t</mi></msub><mo>−</mo><msub><mi>v</mi><mi>t</mi></msub><mi data-sym="Delta">Δ</mi><mo>,</mo><mi>r</mi><mo>,</mo><mi>t</mi><mo>−</mo><mi>Δ</mi><mo>)</mo></mrow><mi>Δ</mi></mfrac></mtd></mtr><mtr><mtd><msub><mi>u</mi><mtext>target</mtext></msub><mo>=</mo><mfrac><mrow><msub><mi>v</mi><mi>t</mi></msub><mi>Δ</mi><mo>+</mo><mo>(</mo><mi>t</mi><mo>−</mo><mi>r</mi><mo>)</mo><mi data-sym="sg">sg</mi><mo>[</mo><msub><mi data-sym="u_earlier">u</mi><mtext>earlier</mtext></msub><mo>]</mo></mrow><mrow><mi>Δ</mi><mo>+</mo><mi>t</mi><mo>−</mo><mi>r</mi></mrow></mfrac></mtd></mtr></mtable></math>',[{sym:'Delta',desc:'沿轨迹回退的有限时间间隔。'},{sym:'u_earlier',desc:'同一网络在 Euler 回退位置的预测。'},{sym:'sg',desc:'较早预测只作答案册，不接收梯度。'}]),
      takeaways:[{icon:'🎯',title:'回退',desc:'zₜ−vₜΔ 是一阶 Euler 状态。'},{icon:'🔧',title:'差商',desc:'两个预测近似全导数。'},{icon:'✨',title:'边界',desc:'中间无 JVP，不等于全程无 JVP。'}],
    },
    {
      kind:'chapter',id:'chap-6',title:'训练策略：让 Δ 从大到小，由 FM 走向 MF',badge:'trn',badgeLabel:'课程',
      bridge:'Δ 是训练目标的有限差分间隔，不是采样步数。先看两个端点：在论文的线性条件路径上，最大 Δ=t−r 时目标退化为容易监督的 Flow Matching；Δ→0 时差商逼近连续导数，目标趋向更难优化的 MeanFlow。论文据此把训练排成由易到难的课程。',
      analogy:{title:'先拉开检查点，再逐渐缩短',text:'一名登山者先用相隔较远的<b>检查点</b>练习可靠路标，再把间距逐渐缩短，最后参加连续导数考试。',canvasAlt:'单名登山者与营地之间的橙色检查点随课程阶段逐渐变密；起点标为容易的 FM，终点考试牌标为 MF/JVP。',componentId:'dmf-analogy'},
      modules:[
        {kind:'module',id:'6.1',title:'代入 Δ：看 DMF 目标如何从 FM 走向 MF',desc:'默认令 Δ=t−r，逐行把最大间隔代入 DMF 目标，验证它为何严格退化为 Flow Matching；再缩小 Δ，观察目标怎样逐渐减少瞬时速度锚点、增加模型自一致性并趋近连续 MeanFlow。',canvasAlt:'公式推导组件首先展示 Delta 等于 t 减 r 时的完整等式链：DMF 目标化为二分之一乘 v_t 加 v_r，在线性条件路径上等于瞬时速度；滑块缩小时切换为一般权重与连续 MeanFlow 极限说明。',componentId:'dmf-module'},
        {kind:'module',id:'6.2',title:'论文的三阶段训练函数',desc:'按论文式 (5) 在三个阶段之间切换：阶段 0 直接做 Flow Matching；中间阶段逐步缩小 Δᵢ，用有限差分 DMF 且不计算 JVP；最终阶段切回连续 MeanFlow 并重新启用 JVP。',canvasAlt:'三段分段训练函数始终可见；点击 FM、有限差分 DMF、连续 MF 三个阶段时，对应分支、目标公式、Delta 调度、JVP 状态与难度说明同步高亮。',componentId:'dmf-module'},
      ],
      insight:'大 Δ 端点容易，是因为线性路径的边界把两个目标分支都锚定到 vₜ；小 Δ 时固定锚点权重趋近 0，目标主要依赖相邻的模型自预测，并逼近连续导数关系，所以更接近 MF、也更难稳定优化。有限 Δ 的中间阶段仍不用 JVP，只有最后连续 MF 阶段重新启用 JVP。',
      takeaways:[{icon:'🎯',title:'大 Δ → FM',desc:'在线性路径边界下，最大间隔的两个分支都化为 vₜ；实际阶段 0 直接使用 FM 目标。'},{icon:'🔧',title:'小 Δ → MF',desc:'目标更依赖相邻自预测，差商在极限中恢复连续导数，因此更难优化。'},{icon:'✨',title:'由易到难',desc:'预训练 FM → 多个有限差分 DMF 阶段 → 最终 MF/JVP。'}],
    },
    {
      kind:'chapter',id:'chap-7',title:'为什么原始 t 等距不等于 VE 噪声比等距',badge:'both',badgeLabel:'参数化',
      bridge:'在线性路径里，t 是噪声混合系数；VE 坐标 Φ(t)=t/(1−t) 表示噪声系数与数据系数之比。相同的 Δt 只保证混合系数等距，并不保证噪声/数据比等距，尤其接近 t=1 时差异会迅速放大。这解释了 VE 调度为何可能更合适，但不是论文给出的理论最优性证明。',
      analogy:{title:'换成反映坡度的里程表',text:'一名登山者把普通<b>时钟</b>换成反映坡度的<b>里程表</b>，目标是按地形安排检查点。',canvasAlt:'单名登山者旁同时画有均匀刻度时钟和右端拉伸的里程表，指针同步移动，营地在右端。',componentId:'dmf-analogy'},
      modules:[
        {kind:'module',id:'7.1',title:'拖动等长 Δt：同样时间跨度对应多少噪声比变化',desc:'固定 Δt=0.1，只拖动窗口起点 t。上轴的原始时间窗口始终等长；下轴显示映射后的 [Φ(t),Φ(t+0.1)]，观察它在高噪声区域如何迅速变宽。',canvasAlt:'上下两条同步坐标轴。上方原始时间轴中的窗口长度始终为 0.1；下方 VE 坐标轴中的对应窗口随起点向高噪声区域移动而显著变宽，并同步显示两端噪声数据比与 Delta Phi。',componentId:'dmf-module'},
        {kind:'module',id:'7.2',title:'低、中、高噪声区：普通 Δ 与 VE Δ†',desc:'切换三个长度都为 0.2 的区间，并固定 qⁱ=2。普通 DMF 在三档都回退 0.1；VE 调度先在噪声比坐标缩短一半，再映回 t 轴，因此高噪声区得到更细的实际跨度。',canvasAlt:'低中高三档按钮控制三组等长区间；普通时间轴、VE 映回时间轴和 VE 局部轴同步更新 r、t、回退点、普通 Delta、VE Delta 与二者比例。',componentId:'dmf-module'},
      ],
      insight:'DMF† 在论文 CIFAR-10 协议中更好，但这只支持“经验上更合适”，不能推出 VE 参数化理论最优。',
      takeaways:[{icon:'🎯',title:'错位',desc:'t 轴等距不代表 VE 噪声比等距。'},{icon:'🔧',title:'做法',desc:'先在 Φ 坐标缩短，再映回。'},{icon:'✨',title:'边界',desc:'论文只报告经验改善，没有证明 VE 理论最优。'}],
    },
    {
      kind:'chapter',id:'chap-8',title:'CIFAR-10：一步质量与训练成本',badge:'both',badgeLabel:'实验一',
      bridge:'先只看无条件 CIFAR-10。完整质量表保留所有外部方法和论文内部对照；随后把每批训练时间与同为 4000 epoch 数据预算的端到端 GPU-hours 放在一起核对。',
      analogy:{title:'先建立完整的实验检查清单',text:'进入结果前，依次核对<b>一步生成质量、每批训练时间与端到端总成本</b>，避免只凭单个 FID 下结论。',canvasAlt:'纯实验报告视图，不出现登山者或山路；一步质量、每批时间和端到端成本三项依次高亮，表格与成本摘要同步切换。',componentId:'dmf-analogy'},
      modules:[
        {kind:'module',id:'8.1',title:'Table 1：CIFAR-10 完整一步 FID 对比',desc:'论文中的全部方法、初始化、训练预算与 FID 始终可见。颜色只用于区分外部方法、论文 MF 对照与 DMF 系列，不隐藏任何行。',canvasAlt:'语义化表格完整列出八种 CIFAR-10 一步方法；外部方法、论文自己的 MF 对照和 DMF 系列分别着色，并在表下解释可支持与不可支持的结论。',componentId:'dmf-module'},
        {kind:'module',id:'8.2',title:'Table 2–3：每批时间与端到端训练成本',desc:'分别重建每批训练时间和 CIFAR-10 端到端成本。派生百分比由原表数值计算，并明确 ImageNet 没有端到端 GPU-hours。',canvasAlt:'两个始终可见的表格分别显示 CIFAR-10 与 ImageNet 每批秒数，以及 CIFAR-10 的 H100 GPU-hours 和 FID；旁边列出可核算的降幅。',componentId:'dmf-module'},
      ],
      insight:'在论文自己的 4k 总预算对照中，DMF† 的 3.36 优于 MF scratch 的 3.85 和 MF fine-tune 的 3.93；但完整 Table 1 中仍有更低 FID，不能写成总体最佳。',
      takeaways:[{icon:'🎯',title:'质量',desc:'论文内部同预算对照中，DMF† 改善一步 FID。'},{icon:'🔧',title:'效率',desc:'每批训练和 CIFAR 端到端 GPU-hours 均下降。'},{icon:'✨',title:'边界',desc:'Table 1 中仍有更低 FID，协议与预算必须一起读。'}],
    },
    {
      kind:'chapter',id:'chap-9',title:'ImageNet：一步微调与稳定性边界',badge:'both',badgeLabel:'实验二',
      bridge:'ImageNet 采用 SD-VAE latent 与无 CFG 协议。这里把 50 步 SiT 基线和所有一步 DMF† 预算始终并列，再明确标出 6→48 epoch 的改善趋势与 96 epoch 的发散边界。',
      analogy:{title:'把一步结果与 50 步基线放在同一张表里',text:'ImageNet 的阅读重点是同时比较<b>采样步数、FID、额外预算与稳定性</b>，不能只强调一步生成而隐藏质量基线。',canvasAlt:'纯实验比较视图，不出现登山者或山路；固定的 50 步基线横线与不同预算的一步 FID 柱并列，96 epoch 柱出现红色发散警告。',componentId:'dmf-analogy'},
      modules:[
        {kind:'module',id:'9.1',title:'Table 4：一步 DMF† 与 50 步 SiT 基线',desc:'完整展示 50 步基线和五种一步微调预算。点击任意行只会同步高亮预算—FID 关系与解释，其他实验行始终保留。',canvasAlt:'完整表格固定显示 50 步 SiT FID 11.52 和五个一步 DMF† 结果；选中行后旁边趋势图突出对应点，96 epoch 的 294.13 始终标红。',componentId:'dmf-module'},
      ],
      insight:'6→48 epoch 时一步 FID 从 21.18 改善到 14.53，但仍高于 50 步 SiT 的 11.52；96 epoch 发散到 294.13，说明继续增加预算并不保证更好。',
      takeaways:[{icon:'🎯',title:'一步收益',desc:'少量额外微调显著改善一步质量。'},{icon:'🔧',title:'公平对照',desc:'一步 14.53 仍未超过 50 步 11.52。'},{icon:'✨',title:'稳定性',desc:'96 epoch 在第 5 个课程阶段发散，存在经验上限。'}],
    },
  ],
  bilibili:[
    {bvid:'BV1Rx4y1W7GJ',title:'Flow Matching 原理与生成 ODE',reason:'用于课程结束后的背景复习；视频不构成论文实验依据。'},
    {bvid:'BV1jm421V7wc',title:'扩散模型与连续流视角',reason:'帮助把噪声路径、速度场和数值积分放回更大的生成模型背景。'},
  ],
};
