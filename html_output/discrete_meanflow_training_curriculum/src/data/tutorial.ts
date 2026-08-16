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
      kind:'chapter',id:'chap-6',title:'完整训练策略：从预训练 FM 到最终 MF',badge:'trn',badgeLabel:'课程',
      bridge:'完整算法不只是“逐渐缩小 Δ”：先从预训练 Flow Model 初始化，把总微调预算平均分给 K 个阶段；阶段 0 做 FM，中间阶段做有限差分 DMF，最后阶段切回连续 MF 并重新启用 JVP。',
      analogy:{title:'逐渐缩短检查点间距',text:'一名登山者把<b>检查点</b>越放越近，逐级练习更精细的导航，最终参加连续导数考试。',canvasAlt:'单名登山者与营地之间的橙色检查点随阶段逐渐变密，最后出现标有 JVP 的终点考试牌。',componentId:'dmf-analogy'},
      modules:[
        {kind:'module',id:'6.1',title:'K 阶段完整课程：每一阶段训练什么',desc:'依次查看初始化与预算、阶段 0 的 FM 目标、中间有限差分 DMF 目标、最终连续 MF/JVP 目标。',canvasAlt:'四步训练课程组件：先展示预训练初始化与预算均分，再依次展示 FM、有限差分 DMF、连续 MF 的精确目标公式和 JVP 状态。',componentId:'dmf-module'},
      ],
      insight:'大 Δ 更依赖可靠的 vₜ 锚点；小 Δ 更依赖模型自一致性、也更接近连续极限。这个难度解释是课程设计动机，不是对所有模型成立的定理。',
      formula:formula('论文式 (5) 的完整分段训练目标：','u_target^i={v_t, i=0; [v_tΔ_i+(t−r)sg(u_earlier)]/(Δ_i+t−r), 1≤i≤K−2; v_t+(r−t)sg(duθ/dt), i=K−1}','<math display="block"><mrow><msubsup><mi data-sym="u_target_i">u</mi><mtext>target</mtext><mi>i</mi></msubsup><mo>=</mo><mfenced open="{" close=""><mtable columnalign="left"><mtr><mtd><msub><mi>v</mi><mi>t</mi></msub></mtd><mtd><mi>i</mi><mo>=</mo><mn>0</mn></mtd></mtr><mtr><mtd><mfrac><mrow><msub><mi>v</mi><mi>t</mi></msub><msub><mi data-sym="Delta_i">Δ</mi><mi>i</mi></msub><mo>+</mo><mo>(</mo><mi>t</mi><mo>−</mo><mi>r</mi><mo>)</mo><mi>sg</mi><mo>[</mo><msub><mi>u</mi><mi>θ</mi></msub><mo>(</mo><msub><mi>z</mi><mi>t</mi></msub><mo>−</mo><msub><mi>v</mi><mi>t</mi></msub><msub><mi>Δ</mi><mi>i</mi></msub><mo>,</mo><mi>r</mi><mo>,</mo><mi>t</mi><mo>−</mo><msub><mi>Δ</mi><mi>i</mi></msub><mo>)</mo><mo>]</mo></mrow><mrow><msub><mi>Δ</mi><mi>i</mi></msub><mo>+</mo><mi>t</mi><mo>−</mo><mi>r</mi></mrow></mfrac></mtd><mtd><mn>1</mn><mo>≤</mo><mi>i</mi><mo>≤</mo><mi>K</mi><mo>−</mo><mn>2</mn></mtd></mtr><mtr><mtd><msub><mi>v</mi><mi>t</mi></msub><mo>+</mo><mo>(</mo><mi>r</mi><mo>−</mo><mi>t</mi><mo>)</mo><mi>sg</mi><mo>[</mo><mfrac><mrow><mi>d</mi><msub><mi>u</mi><mi>θ</mi></msub></mrow><mrow><mi>d</mi><mi>t</mi></mrow></mfrac><mo>]</mo></mtd><mtd><mi>i</mi><mo>=</mo><mi>K</mi><mo>−</mo><mn>1</mn></mtd></mtr></mtable></mfenced></mrow></math>',[{sym:'u_target_i',desc:'第 i 个课程阶段监督当前 uθ 的目标。'},{sym:'Delta_i',desc:'中间阶段使用普通 Δᵢ 或 VE 调度 Δᵢ†。'}]),
      takeaways:[{icon:'🎯',title:'初始化',desc:'从预训练 Flow Model 热启动，预算按 K 阶段均分。'},{icon:'🔧',title:'中间阶段',desc:'有限差分与 stop-gradient 构造目标，不使用 JVP。'},{icon:'✨',title:'最终阶段',desc:'连续 MF 重新启用 JVP。'}],
    },
    {
      kind:'chapter',id:'chap-7',title:'普通 Δ 调度为什么要改到 VE 噪声坐标',badge:'both',badgeLabel:'参数化',
      bridge:'普通 DMF 使用 Δᵢ=(t−r)/qⁱ，在原始 t 坐标中均匀缩短区间。但在线性路径里，t 是噪声系数、1−t 是数据系数，原始 t 的等距并不等于噪声/数据比例的等距，尤其在 t 接近 1 时变化非常剧烈。',
      analogy:{title:'换成反映坡度的里程表',text:'一名登山者把普通<b>时钟</b>换成反映坡度的<b>里程表</b>，目标是按地形安排检查点。',canvasAlt:'单名登山者旁同时画有均匀刻度时钟和右端拉伸的里程表，指针同步移动，营地在右端。',componentId:'dmf-analogy'},
      modules:[
        {kind:'module',id:'7.1',title:'Φ(t) 到底表示什么：噪声系数 / 数据系数',desc:'拖动 t，直接观察线性路径中的数据系数 1−t、噪声系数 t 和它们的比值 Φ(t)=t/(1−t)。',canvasAlt:'同一混合条显示绿色数据占比和紫色噪声占比；滑块改变 t 时两部分长度、数值和噪声除以数据的比值同步变化，接近 1 时比值变红。',componentId:'dmf-module'},
        {kind:'module',id:'7.2',title:'同一组 r、t、q：普通跨度与 VE 跨度',desc:'调节区间端点 r、高噪声起点 t 和缩小分母 q，同时计算普通 DMF 与 VE 调度映回 t 轴后的回退位置和 Δ。默认例子 r=0.2、t=0.8、q=2。',canvasAlt:'同一时间轴并列标出普通 DMF 和 VE 调度的回退位置；三个滑块改变 r、t、q 后，两侧公式、t 撇、Delta 数值和跨度百分比同步更新。',componentId:'dmf-module'},
      ],
      insight:'DMF† 在论文 CIFAR-10 协议中更好，但这只支持“经验上更合适”，不能推出 VE 参数化理论最优。',
      formula:formula('先看普通调度，再看完整 VE 调度：','Δ_i=(t−r)/q^i; Φ(t)=t/(1−t); s′=Φ(t)−[Φ(t)−Φ(r)]/q^i; t′=Φ⁻¹(s′); Δ_i†=t−t′','<math display="block"><mtable columnalign="left"><mtr><mtd><msub><mi data-sym="Delta_i">Δ</mi><mi>i</mi></msub><mo>=</mo><mfrac><mrow><mi>t</mi><mo>−</mo><mi>r</mi></mrow><msup><mi data-sym="q">q</mi><mi data-sym="i">i</mi></msup></mfrac></mtd></mtr><mtr><mtd><mi data-sym="Phi">Φ</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>=</mo><mfrac><mi>t</mi><mrow><mn>1</mn><mo>−</mo><mi>t</mi></mrow></mfrac><mo>,</mo><mspace width="1em"/><msup><mi>Φ</mi><mrow><mo>−</mo><mn>1</mn></mrow></msup><mo>(</mo><mi>s</mi><mo>)</mo><mo>=</mo><mfrac><mi>s</mi><mrow><mn>1</mn><mo>+</mo><mi>s</mi></mrow></mfrac></mtd></mtr><mtr><mtd><msup><mi>s</mi><mo>′</mo></msup><mo>=</mo><mi>Φ</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>−</mo><mfrac><mrow><mi>Φ</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>−</mo><mi>Φ</mi><mo>(</mo><mi>r</mi><mo>)</mo></mrow><msup><mi>q</mi><mi>i</mi></msup></mfrac></mtd></mtr><mtr><mtd><msup><mi>t</mi><mo>′</mo></msup><mo>=</mo><msup><mi>Φ</mi><mrow><mo>−</mo><mn>1</mn></mrow></msup><mo>(</mo><msup><mi>s</mi><mo>′</mo></msup><mo>)</mo><mo>,</mo><mspace width="1em"/><msubsup><mi data-sym="Delta_dagger">Δ</mi><mi>i</mi><mo>†</mo></msubsup><mo>=</mo><mi>t</mi><mo>−</mo><msup><mi>t</mi><mo>′</mo></msup></mtd></mtr></mtable></math>',[{sym:'Delta_i',desc:'普通 DMF 在原始 t 坐标中的有限差分间隔。'},{sym:'Phi',desc:'线性路径里噪声系数 t 与数据系数 1−t 的比值。'},{sym:'q',desc:'课程间隔的衰减因子，q>1。'},{sym:'i',desc:'训练阶段编号。'},{sym:'Delta_dagger',desc:'在 VE 中缩短后反映射到 t 轴得到的实际间隔。'}]),
      takeaways:[{icon:'🎯',title:'错位',desc:'t 轴等距不代表 VE 噪声等距。'},{icon:'🔧',title:'做法',desc:'先在 Φ 坐标缩短，再映回。'},{icon:'✨',title:'证据',desc:'3.36 优于 3.58 是协议内经验结果。'}],
    },
    {
      kind:'chapter',id:'chap-8',title:'实验结果、计算收益与稳定性边界',badge:'both',badgeLabel:'证据',
      bridge:'最后只在锁定的数据集、采样步数、CFG 与训练预算下读数字。CIFAR 与 ImageNet 使用两个独立组件，避免跨协议混比。',
      analogy:{title:'到终点查看路线报告',text:'一名登山者到达营地，展开写有<b>质量、成本、步数和警告</b>的路线报告，目标是判断方法边界。',canvasAlt:'单名登山者站在营地旁；报告板明确列出质量、成本、一步采样和红色稳定性警告四项。',componentId:'dmf-analogy'},
      modules:[
        {kind:'module',id:'8.1',title:'CIFAR-10：质量、时间与总计算',desc:'选择 MF scratch、MF fine-tune、DMF、DMF†。完整宽度的 FID 图与独立效率卡分区显示。',canvasAlt:'宽屏和窄屏均分区显示协议、四条一步 FID 条形、训练时间与 GPU-hours；选择方法后协议与 FID 高亮同步更新。',componentId:'dmf-module'},
        {kind:'module',id:'8.2',title:'ImageNet：少量微调如何换来一步生成，以及稳定性边界',desc:'从固定的 1400 epoch、50 步 SiT 起点出发，切换五种“总额外微调预算”，查看它们分别得到的一步 FID。6→48 epoch 逐步改善，96 epoch 在第 5 个课程阶段发散。',canvasAlt:'转换流程明确显示固定的 50 步 SiT 起点、所选额外微调预算和得到的一步 DMF†；完整预算表始终可见，96 epoch 行与发散解释变红。',componentId:'dmf-module'},
      ],
      insight:'中间阶段降低 JVP 成本，一步质量有竞争力，但并非所有协议最优；论文缺少多随机种子、系统消融与更广任务验证。',
      takeaways:[{icon:'🎯',title:'CIFAR',desc:'DMF† 一步 FID 3.36，为报告中最佳。'},{icon:'🔧',title:'ImageNet',desc:'一步 14.53 不能描述成胜过 50 步 11.52。'},{icon:'✨',title:'限制',desc:'96 epoch 发散；无多种子方差与广泛消融。'}],
    },
  ],
  bilibili:[
    {bvid:'BV1Rx4y1W7GJ',title:'Flow Matching 原理与生成 ODE',reason:'用于课程结束后的背景复习；视频不构成论文实验依据。'},
    {bvid:'BV1jm421V7wc',title:'扩散模型与连续流视角',reason:'帮助把噪声路径、速度场和数值积分放回更大的生成模型背景。'},
  ],
};
