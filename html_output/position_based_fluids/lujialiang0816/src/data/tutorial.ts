import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "Position Based Fluids",
    titleZh: "基于位置的流体 · 交互式原理演示",
    venue: "ACM TOG 32(4), Article 104 · 2013",
    authors: "Miles Macklin · Matthias Müller",
    affiliation: "NVIDIA",
    domain: "计算机图形学 · 粒子流体模拟",
    coreProblem: "如何让离散粒子在较大时间步下仍保持水的不可压缩性，并保留可信的运动细节？",
    coreInsight: "<b>PBF</b> 的核心，是把预测位置上的密度误差写成约束，并沿约束梯度直接修正粒子位置。接下来，你将沿着这条主线理解完整过程：<b>发现粒子过密 → 投影位置恢复密度 → 补回液体运动细节 → 在 Houdini 中重建连续水面</b>。",
    keywords: ["不可压缩性", "位置约束", "Jacobi 投影", "Houdini 水面重建"],
  },
  hero: {
    oldMethod: {
      desc: "同一过密预测状态下，传统 SPH 先由压力改变速度，再积分得到位置；红色轨迹标出可能保留的错位。",
      componentId: "pbf-hero",
    },
    newMethod: {
      desc: "同一过密预测状态下，PBF 直接修正粒子位置；多轮 Jacobi 让约束误差逐步下降。",
      componentId: "pbf-hero",
    },
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "不可压缩性：撞击为何产生密度误差",
      bridge: "真实水近似不可压缩，但粒子法先按外力（重力等）和当前速度预测位置。上层液体撞入下层液体时，撞击区的预测粒子会暂时聚得过密；传统 SPH 再由密度误差产生压力力，通过速度和位置积分恢复密度。",
      analogy: {
        title: "上层液体落下：撞击区为什么会暂时过密？",
        text: "一层水受外力（重力等）作用，垂直落向下方三层水。撞击后四层液体共同向下挤压，竖直层间距缩小，因此出现 ρ/ρ₀ > 1；压力随后重新拉开层间距，使密度回到静止密度。",
        componentId: "four-minute-state",
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "液体撞击：预测位置如何产生密度误差",
          desc: "一层水垂直落向下方三层水。撞击后四层液体共同向下挤压，竖直层间距缩小，ρ/ρ₀ 随之升高；绿色压力箭头随后重新拉开层间距，使密度回到 1。",
          componentId: "incompressibility-demo",
        },
        {
          kind: "module",
          id: "1.2",
          title: "两次时间片：SPH 如何把压力积分成位移",
          desc: "动画依次展示外力碰撞、过密产生压力加速度，以及两个时间片的速度—位置更新。切换小、大两档 Δt：小步长两次修正回到理想间距；大步长第一片向外过冲，第二片又向内过冲，形成来回振荡。",
          componentId: "timestep-demo",
        },
      ],
      insight: "密度升高发生在数值预测位置，而不是说真实水能够被长期压缩。传统 SPH 在每个时间片重新估计密度与压力：压力先改变速度，新速度再乘 Δt 得到位置变化；Δt 较大时，单次修正更容易越过理想间距。",
      formula: {
        lead: "传统 SPH 在每个时间片重复以下路径：",
        unicode: "估计 ρ → 状态方程求 p → 压力加速度 aₚ → vⁿ⁺¹ = v* + aₚΔt → xⁿ⁺¹ = xⁿ + vⁿ⁺¹Δt",
        latex: "\\begin{gathered} \\rho_i \\quad\\Longrightarrow\\quad p_i \\quad\\Longrightarrow\\quad \\mathbf{a}_p \\\\[0.55em] \\mathbf{v}^{n+1} = \\mathbf{v}^{\\ast} + \\mathbf{a}_p\\Delta t \\quad\\Longrightarrow\\quad \\mathbf{x}^{n+1} = \\mathbf{x}^{n} + \\mathbf{v}^{n+1}\\Delta t \\end{gathered}",
        symbols: [
          { sym: "ρᵢ", latex: "\\rho_i", desc: "粒子 i 的局部估计密度。" },
          { sym: "pᵢ", latex: "p_i", desc: "由密度偏差和状态方程得到的粒子压力。" },
          { sym: "aₚ", latex: "\\mathbf{a}_p", desc: "压力力除以粒子质量得到的压力加速度。" },
          { sym: "Δt", latex: "\\Delta t", desc: "从加速度更新速度、再从速度更新位置的离散时间步。" },
        ],
      },
      takeaways: [
        { icon: "💧", title: "预测步会暂时过密", desc: "外力（重力等）预测后，撞击区的候选粒子位置可能产生局部密度误差。" },
        { icon: "🎯", title: "压力恢复密度", desc: "传统 SPH 由密度误差计算压力，重新拉开过近的竖直层间距。" },
        { icon: "⏱", title: "压力路径受步长影响", desc: "压力经速度积分间接修正位置，较大时间步可能放大离散误差。" },
      ],
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "PBF 的起点：从刚性压力到位置约束",
      bridge: "为压低密度误差，传统 SPH 需要刚性的压力响应，因此显式积分会限制时间步。PCISPH 虽通过迭代压力修正放宽这一限制，但仍沿“密度 → 压力 → 力 → 位置”间接恢复。PBD 改为：先预测位置，若违反物理条件就直接投影位置；PBF 再把流体密度接入这套框架。",
      analogy: {
        title: "PBD：先预测，再把位置投影回合法区域",
        text: "外力先给出候选位置 p*。若候选位置违反不可穿透等物理条件，PBD 直接修正位置，最后由修正后的位移回算速度。",
        componentId: "four-minute-state",
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "PBD 的一个时间步：预测 → 投影 → 回算速度",
          desc: "一枚水粒子在外力下得到预测位置 p*。当 p* 穿过不可穿透边界时，PBD 将其直接投影回合法位置 p_corr，再由 p_corr 与旧位置之差回算速度。",
          componentId: "projection-demo",
        },
        {
          kind: "module",
          id: "2.2",
          title: "PBF 的组合：SPH 估计密度，PBD 修正位置",
          desc: "依次查看三步：在预测位置上用 SPH 核函数估计密度；把密度偏差写成约束；再以 PBD 的方式直接施加位置修正 Δp。",
          componentId: "pbf-old-new",
        },
      ],
      insight: "PBD 仍会用外力预测速度和位置；它改变的是约束的处理位置：不先求约束力，而是直接修正预测位置。PBF 只需把“ρᵢ = ρ₀”作为这类位置约束，即可把流体不可压缩性接入 PBD。",
      formula: {
        lead: "PBD 的一个时间步先预测、后投影、再回算速度：",
        unicode: "v* = vⁿ + Δt a_ext → p* = xⁿ + Δt v* → Project(p*) = p_corr → vⁿ⁺¹ = (p_corr − xⁿ) / Δt",
        latex: "\\begin{gathered} \\mathbf{v}^{\\ast} = \\mathbf{v}^{n} + \\Delta t\\,\\mathbf{a}_{\\mathrm{ext}} \\quad\\Longrightarrow\\quad \\mathbf{p}^{\\ast} = \\mathbf{x}^{n} + \\Delta t\\,\\mathbf{v}^{\\ast} \\\\[0.55em] \\operatorname{Project}(\\mathbf{p}^{\\ast}) = \\mathbf{p}_{\\mathrm{corr}} \\quad\\Longrightarrow\\quad \\mathbf{v}^{n+1} = \\frac{\\mathbf{p}_{\\mathrm{corr}}-\\mathbf{x}^{n}}{\\Delta t} \\end{gathered}", 
        symbols: [
          { sym: "a_ext", latex: "\\mathbf{a}_{\\mathrm{ext}}", desc: "重力等外力带来的加速度。" },
          { sym: "p*", latex: "\\mathbf{p}^{\\ast}", desc: "尚未满足约束的候选位置。" },
          { sym: "p_corr", latex: "\\mathbf{p}_{\\mathrm{corr}}", desc: "投影到合法区域后的修正位置。" },
          { sym: "Δp", latex: "\\Delta\\mathbf{p}", desc: "PBF 中由密度约束得到的位置修正量。" },
        ],
      },
      takeaways: [
        { icon: "①", title: "刚性压力限制步长", desc: "传统 SPH 的压力经显式积分会使大时间步更难稳定。" },
        { icon: "②", title: "PBD 直接修正位置", desc: "预测位置违反约束时，PBD 投影位置而非先求约束力。" },
        { icon: "③", title: "PBF 连接两者", desc: "SPH 负责估计密度，PBD 负责把过密预测位置投影回来。" },
      ],
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "约束求解：如何把密度拉回目标",
      bridge: "在这一节中，所有约束都在当前预测位置 p* 上求值：ρ 表示局部密度，C 表示密度误差，λ 表示沿约束梯度的修正尺度，Δp 表示位置修正。下面严格按论文的推导顺序连接它们。",
      formulaAfterModuleId: "3.1",
      analogy: {
        title: "ρ → C → λ → Δp：一轮位置修正如何发生",
        text: "先看 p*、ρ、C、λ、Δp 分别代表什么；再依次查看四步。左侧支持域、中心粒子和修正箭头会同步变化。蓝色表示密度，红色表示误差，紫色表示修正强度，绿色表示位置修正。",
        componentId: "four-minute-state",
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "四步观察：公式如何变成粒子移动",
          desc: "依次选择“密度、约束、乘子、位移”：当前步骤的公式会在这里对应为支持域、密度误差或位置修正箭头。",
          componentId: "constraint-story",
        },
      ],
      insight: "式 (3) 给出目标，式 (4) 规定 Newton 修正沿约束梯度；经一阶线性化后解出式 (11) 的 λ。式 (12) 再把粒子 i 自身与邻居 j 的密度约束贡献累加为最终位置更新。",
      formula: {
        lead: "论文主线：由密度和约束定义出发，设定投影目标；Newton 修正沿梯度进行，经一阶线性化后求出 λ，最后汇总邻居约束的修正。",
        unicode: "Cᵢ = ρᵢ/ρ₀−1　→　ρᵢ = ΣⱼmⱼWᵢⱼ　→　λᵢ = −Cᵢ/(Σₖ‖∇Cᵢ‖²+ε)　→　Δpᵢ = 1/ρ₀ Σⱼ(λᵢ+λⱼ+s_corr)∇Wᵢⱼ",
        latex: "\\begin{array}{ll} C_i(\\mathbf{p}^\\ast) = \\frac{\\rho_i}{\\rho_0}-1 & \\quad\\text{(1) 约束}\\\\[0.3em] \\rho_i = \\sum_j m_j W(\\mathbf{p}_i^\\ast-\\mathbf{p}_j^\\ast,h) & \\quad\\text{(2) 密度}\\\\[0.3em] C_i(\\mathbf{p}^\\ast+\\Delta\\mathbf{p})=0 & \\quad\\text{(3) 目标}\\\\[0.3em] \\Delta\\mathbf{p}\\approx \\nabla C_i(\\mathbf{p}^\\ast)\\lambda_i & \\quad\\text{(4) 梯度修正}\\\\[0.3em] \\lambda_i=-\\frac{C_i(\\mathbf{p}^\\ast)}{\\sum_k\\lVert\\nabla_{\\mathbf{p}_k}C_i\\rVert^2+\\varepsilon} & \\quad\\text{(11) 解 λ}\\\\[0.3em] \\Delta\\mathbf{p}_i=\\frac{1}{\\rho_0}\\sum_j(\\lambda_i+\\lambda_j)\\nabla W(\\mathbf{p}_i^\\ast-\\mathbf{p}_j^\\ast,h) & \\quad\\text{(12) 邻域汇总} \\end{array}",
        symbols: [
          { sym: "p*", latex: "\\mathbf{p}^{\\ast}", desc: "外力预测后、尚未满足密度约束的粒子位置。" },
          { sym: "ρᵢ", latex: "\\rho_i", desc: "粒子 i 在预测位置处的局部估计密度。" },
          { sym: "Cᵢ", latex: "C_i", desc: "归一化密度约束误差，零是目标。" },
          { sym: "∇Cᵢ", latex: "\\nabla C_i", desc: "密度约束对位置的梯度；它给出使约束变化最快的修正方向。" },
          { sym: "λᵢ", latex: "\\lambda_i", desc: "按邻域梯度响应归一化的约束乘子。" },
          { sym: "Δpᵢ", latex: "\\Delta\\mathbf{p}_i", desc: "粒子 i 在当前 Jacobi 轮次的位置修正。" },
        ],
      },
      takeaways: [
        { icon: "ρ", title: "邻域产生密度", desc: "支持半径内的核贡献累加为粒子局部密度。" },
        { icon: "λ", title: "梯度决定尺度", desc: "约束乘子把密度误差与邻域响应联系起来。" },
        { icon: "Δ", title: "最终移动位置", desc: "每轮汇总自身与邻居贡献，生成位置修正 Δpᵢ。" },
      ],
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "稳定性与真实感：三项补偿",
      bridge: "密度投影保证了不可压缩性，却不会自动保留所有运动细节：自由表面可能因邻居不足而结团，重复位置投影会耗散涡旋，离散邻域的速度差还会让局部运动不连贯。接下来分别看每个现象为何发生，以及对应的补偿方法。",
      analogy: {
        title: "同一屏完成三次“问题 → 方法 → 结果”诊断",
        text: "选择一个标签：先看左侧的问题如何产生，再看右侧补偿后的变化。三个标签依次对应人工压力、涡量约束和 XSPH。",
        componentId: "four-minute-state",
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "三联诊断台：结团、涡旋与速度协调",
          desc: "<strong>结团：</strong>自由表面邻居不足，粒子为恢复密度而相互拉近。<br /><strong>涡旋：</strong>位置投影与速度回算会耗散小尺度旋转。<br /><strong>速度不协调：</strong>碰撞和离散修正会造成邻域速度突变。<br />选择一个标签，再看对应公式和补偿后的运动变化。",
          componentId: "compensation-lab",
        },
        {
          kind: "module",
          id: "4.2",
          title: "人工压力的取舍：为什么不能越强越好",
          desc: "k 决定 s_corr 的强度：k = 0 时没有短程排斥；论文给出的可用示例为 k = 0.1；k 偏大时，排斥使局部密度降得更低，密度约束随之产生更强回拉，形成表面张力伪影。",
          componentId: "pbf-anti-clump",
        },
      ],
      insight: "三项补偿不能混为一个“真实感按钮”：s_corr 处理拉伸不稳定性，涡量约束补回已有旋转，XSPH 平滑邻域速度；它们都不能替代密度约束。",
      formula: {
        lead: "三项补偿分别针对不同问题；s_corr 是抗结团的人工压力项，涡量约束只在已有旋转处施加补偿，XSPH 用邻域速度差协调局部运动：",
        unicode: "结团 → s_corr　　涡旋衰减 → vorticity confinement　　速度不协调 → XSPH",
        latex: "\\begin{array}{ll} s_{\\mathrm{corr}}=-k\\left(\\frac{W(\\mathbf{p}_i-\\mathbf{p}_j,h)}{W(\\Delta\\mathbf q,h)}\\right)^n & \\text{(13) 抗结团}\\\\[0.35em] \\mathbf f_i^{\\mathrm{vorticity}}=\\varepsilon(\\mathbf N\\times\\boldsymbol\\omega_i) & \\text{(16) 补回已有旋转}\\\\[0.35em] \\mathbf v_i^{\\mathrm{new}}=\\mathbf v_i+c\\sum_j(\\mathbf v_j-\\mathbf v_i)W(\\mathbf p_i-\\mathbf p_j,h) & \\text{(17) 协调邻域速度} \\end{array}",
        symbols: [
          { sym: "s_corr", latex: "s_{\\mathrm{corr}}", desc: "短程人工压力修正，用于减轻自由表面粒子结团。" },
          { sym: "ωᵢ", latex: "\\boldsymbol\\omega_i", desc: "局部涡量；涡量约束在已有旋转处补偿运动。" },
          { sym: "c", latex: "c", desc: "XSPH 的速度平滑系数，需要结合场景调节。" },
        ],
      },
      takeaways: [
        { icon: "↔", title: "人工压力抗结团", desc: "短程排斥改善自由表面邻域不足造成的粒子聚集。" },
        { icon: "↺", title: "涡量约束补旋转", desc: "补回部分数值耗散削弱的涡旋和飞溅。" },
        { icon: "≈", title: "XSPH 协调速度", desc: "利用邻居速度差，使局部运动更加连贯平滑。" },
      ],
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "从粒子到连续水面：Houdini 渲染",
      bridge: "PBF 到这里输出的仍然是逐帧离散粒子。将 P、id、v 导入 Houdini，并依据粒子间距设置 pscale；随后构建 SDF、提取网格，最后添加水的透射、折射、吸收、灯光与运动模糊。",
      analogy: {
        title: "同一帧数据：粒子只是输入，连续水面才是输出",
        text: "左侧是 PBF 粒子坐标，右侧是由隐式表面重建得到的连续网格。表面化和材质只改变呈现方式，不会自动修复模拟阶段的密度误差。",
        componentId: "four-minute-state",
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "从 P / id / v 到 Houdini 真实水面",
          desc: "四步观察统一的数据流：导入 P、id、v 并设置 pscale → 粒子生成 SDF → 提取并显示水面网格 → 添加材质并渲染。下方直接播放本项目的 Houdini 渲染结果。",
          componentId: "houdini-surface",
        },
      ],
      insight: "四阶段视图展示粒子如何变成连续水面，嵌入的实际视频进一步呈现完整渲染结果：画面中的水正是由这些 PBF 粒子重建得到的。",
      formula: {
        lead: "渲染数据流保持简洁：",
        unicode: "P / id / v → 设置 pscale → Particle Fluid Surface → 水面网格 → Karma water",
        symbols: [
          { sym: "P", desc: "逐帧粒子位置。" },
          { sym: "id", desc: "跨帧稳定标识，用于速度重建与属性匹配。" },
          { sym: "v", desc: "粒子速度，用于运动模糊和属性转移。" },
          { sym: "pscale", desc: "粒子表面化半径，需要与粒子间距和体素尺寸匹配。" },
        ],
      },
      takeaways: [
        { icon: "•", title: "先导入粒子缓存", desc: "将 P、id、v 导入 Houdini，再依据粒子间距设置 pscale。" },
        { icon: "◇", title: "再重建连续表面", desc: "Particle Fluid Surface 或 VDB 从粒子构建 SDF 并提取网格。" },
        { icon: "▶", title: "实际视频完成闭环", desc: "直接展示 PBF 粒子经 Houdini 表面重建后的最终水面。" },
      ],
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "结论：PBF 的完整因果链",
      bridge: "PBF 以不可压缩性作为物理目标，将密度误差转化为预测位置上的约束；迭代投影负责恢复目标密度，三项补偿改善自由表面与局部运动细节，Houdini 再将离散粒子重建为连续水面。",
      analogy: {
        title: "从密度约束到连续水面的完整链条",
        text: "密度误差 → 位置约束 → Jacobi 投影 → 运动细节补偿 → 连续水面。这条链条区分了物理目标、数值求解、真实感补偿与最终渲染。",
        componentId: "four-minute-state",
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "PBF 方法内核与工程边界",
          desc: "五个节点概括了从密度误差到连续水面的完整过程，并明确区分 PBF 的论文贡献、运动细节补偿与 Houdini 渲染管线。",
          componentId: "talk-recap",
        },
      ],
      insight: "PBF 的核心不是增加一种压力公式，而是把不可压缩性从力的计算问题转化为位置约束问题；约束投影负责稳定，补偿项负责运动细节，Houdini 负责最终视觉表达。",
      formula: {
        lead: "核心因果链：",
        unicode: "密度误差 → 位置约束投影 → 稳定粒子 → 真实感补偿 → Houdini 连续水面",
        symbols: [],
      },
      takeaways: [
        { icon: "◎", title: "物理目标", desc: "不可压缩性要求局部密度接近静止密度。" },
        { icon: "↗", title: "数值内核", desc: "PBF 在预测位置上直接迭代求解密度约束。" },
        { icon: "💧", title: "方法边界", desc: "PBF 输出粒子运动；连续表面与光学表现由 Houdini 渲染管线完成。" },
      ],
    },
  ],
};
