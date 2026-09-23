import type { TutorialData } from '../types';

// PhyAgentOS 交互式教程 —— paper-skill-canonical 分支。
// 严格遵守 PaperSkill 输出契约：只填本文件与 paper.css / modules / public/images，
// 章节结构遵循 contract.md §2 的 10 章叙事弧（paperType: system）。
// 信息压缩规则：bridge 只承接上章问题；analogy 建立第一次直觉；
// 解释主体放在模块交互与即时反馈里；insight 只留一句结论；公式在直觉之后出现。

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'PhyAgentOS: A Self-Evolving Operating System for Embodied Agents with Decoupled Cognitive Planning and Physical Execution',
    titleZh: 'PhyAgentOS：面向具身智能体的认知规划与物理执行解耦的自演化操作系统',
    venue: 'arXiv:2607.16636v1 · 2026',
    authors: 'Yang Liu · Weixing Chen · Xinshuai Song · Tao Pu · Siwen Mo · Yongjie Bai · Zihao Chen · Qianran Sun · Liruo Zhong · Ying Shen · Liang Lin',
    affiliation: 'X-Era Lab · HCP Lab, Sun Yat-sen University · Peng Cheng Laboratory',
    domain: '具身智能 · Agent 运行时 · 语义验证 · 自演化 · 纵深安全',
    coreProblem: 'VLA、世界模型与 Agent 各自很强，但没有共享状态、语义验收、持久经验与监督执行的系统层——执行终止常被当成任务完成。',
    coreInsight: '把认知—物理边界物化为文件协议，把 Session（而非单条动作）作为调度、预检、监督、取证与验收的最小单位：自进化首先发生在系统层，而不必改模型权重。',
    keywords: ['State-as-a-File', 'Session-Centered Runtime', 'SessionVerifier', 'Epistemic Memory', 'Layered Safety'],
  },
  hero: {
    oldMethod: {
      desc: '把三种范式直接拼在一起：每一层都报告「成功」，却没有一层核对物理世界是否真的变成了任务要求的状态。',
      componentId: 'hero-points',
    },
    newMethod: {
      desc: '在认知与物理执行之间加一层系统运行时，把一次执行闭成可审计、可复用的循环——模型权重零改动。',
      componentId: 'hero-points',
    },
  },
  chapters: [
    // ---------------------------------------------------------------- 第 1 章
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '具身智能系统里到底有哪些角色？',
      badge: 'inf',
      badgeLabel: '领域地图',
      bridge: '本章先不谈 PhyAgentOS。先看清这个领域已经有什么、每个组件各自负责什么——然后找到没人认领的那两环。下一章你会亲手制造一次「执行成功、任务失败」。',
      analogy: {
        title: '出发前，先认全登山队里的角色',
        text: '向导认路、地图指方向、补给队管物资——先分清<b>谁负责什么</b>，才知道哪一段路其实根本没人管。',
        componentId: 'analogy-note',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: 'Embodied AI Role Map：谁负责哪一步？',
          desc: '点击任务链上的每个环节，看哪个组件认领它。注意「验证结果」与「记录经验」两步——它们是本论文的起点。',
          componentId: 'role-map',
        },
      ],
      insight: 'VLA、世界模型、Agent、ROS 各管一段；「验证结果」与「复用经验」两环无人认领——缺的是系统层，不是第 4 个模型。',
      takeaways: [
        { icon: '🗺️', title: '先建领域地图', desc: 'VLA 产动作、世界模型做预测、Agent 做规划、ROS 做通信。' },
        { icon: '🕳️', title: '两环无人认领', desc: '语义验证与经验复用在组件堆叠中没有 owner。' },
        { icon: '🧩', title: '缺一层治理', desc: '问题不是模型不够聪明，而是缺运行时。' },
      ],
    },
    // ---------------------------------------------------------------- 第 2 章
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '为什么「执行完成」不等于「任务完成」？',
      badge: 'both',
      badgeLabel: '核心问题',
      bridge: '上一章找到两处空白。本章把最致命的一处做成可操作的实验：你亲自拖偏感知位置，制造一次「返回码 0、杯子却没被抓走」的执行。',
      analogy: {
        title: '走到了，不等于走到了要去的地方',
        text: '脚步停下，只能说明<b>动作结束</b>；把终点对回地图上的目标，才能说明<b>任务完成</b>。地图错了，走得再稳也是白走。',
        componentId: 'analogy-note',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: 'Perception Error Grasp Lab：亲手制造「执行成功、任务失败」',
          desc: '拖动「感知到的杯子位置」制造感知误差，然后执行抓取。控制器会忠实跟踪——哪怕指令位是空的。完成后打开证据包，比较 S₀ 与 S_T。',
          componentId: 'return-code-lab',
        },
      ],
      insight: '返回码回答「指令是否被忠实执行」，语义判定回答「世界是否变成要求的样子」——Verification Gap 就在两者之间。',
      takeaways: [
        { icon: '🎯', title: '两种「成功」', desc: '执行层成功 ≠ 任务语义成功，返回码不是目标证据。' },
        { icon: '🧱', title: '结构性缺口', desc: '层级不兼容、故障难归因、经验不持久，三者同源。' },
        { icon: '🧾', title: '证据入场', desc: 'S₀、S_T、τ 与接受标准一起支撑语义判定。' },
      ],
    },
    // ---------------------------------------------------------------- 第 3 章
    {
      kind: 'chapter',
      id: 'chap-3',
      title: 'PhyAgentOS 为什么叫「OS」？',
      badge: 'inf',
      badgeLabel: '系统定位',
      bridge: '知道了缺口在哪，现在回答「PhyAgentOS 到底是什么」：它不是新模型、不是 ROS 替代品，而是一层运行时。动手把它一块块搭起来。',
      analogy: {
        title: '大本营：不替你爬山，但让登山成为系统',
        text: '大本营不替你迈步，它负责<b>调度路线、记录进度、检查装备、组织补给</b>——把一次冒险变成可重复的系统工程。',
        componentId: 'analogy-note',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: 'System Layer Builder：把「操作系统」一块块搭出来',
          desc: '从裸堆叠开始，逐项开启运行时能力，观察系统形态如何变化；再用「ROS 对照」检查哪些能力属于谁。完成后展开论文原图对照各组件的位置。',
          componentId: 'os-layer-builder',
          figure: './images/fig3-architecture.png',
        },
      ],
      formula: {
        lead: '把「缺什么」写成一张能力清单——每开启一项，Agent 与硬件之间的链路就多一类保证。',
        unicode: 'Scheduling · Shared State · Verification · Memory · Benchmark · Safety',
        symbols: [
          { sym: 'Scheduling', desc: 'Session 级调度：谁在何时获得执行权（WatchdogSupervisor）。' },
          { sym: 'Shared State', desc: '跨层共享的统一认知状态（文件协议）。' },
          { sym: 'Verification', desc: '基于证据的语义验收（SessionVerifier）。' },
          { sym: 'Memory', desc: '跨会话持久经验（Epistemic Memory）。' },
          { sym: 'Benchmark', desc: '与部署同路径的评测编排。' },
          { sym: 'Safety', desc: '五层纵深防御，叠加在机器人原生安全之上。' },
        ],
      },
      insight: 'PhyAgentOS = 具身智能的运行时平台：调度、状态、验证、记忆、评测、安全六类公共服务，位于认知与物理执行之间。',
      takeaways: [
        { icon: '🏗️', title: '系统层定位', desc: '不是新模型，而是认知与物理之间的运行时。' },
        { icon: '🖥️', title: 'OS 是借喻', desc: '它是 Runtime Platform：把治理能力变成公共服务。' },
        { icon: '🔌', title: '不替代 ROS', desc: 'ROS 管通信与硬件抽象，PhyAgentOS 管任务生命周期。' },
      ],
    },
    // ---------------------------------------------------------------- 第 4 章
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '不同层如何看到「同一个世界」？',
      badge: 'inf',
      badgeLabel: '协议',
      bridge: '语义验证要求各层比较同一份状态。本章解释 PhyAgentOS 最有辨识度的设计：State-as-a-File——把认知—物理边界变成一组文件协议。',
      analogy: {
        title: '无线电：各队各说各话，频道里只有一份事实',
        text: '侦察队、大本营、补给队不必共享一本日记，但必须守<b>同一个频道</b>——频道里的状态就是全队承认的事实。',
        componentId: 'analogy-note',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: 'Protocol Views：先结构化，再进协议',
          desc: '第一步：点击场景中的物体，生成结构化状态；第二步：打开五份协议文档，看同一状态如何被不同视图引用。',
          componentId: 'protocol-views',
          figure: './images/fig7-file-protocol.png',
        },
      ],
      insight: '五份协议文档是同一认知状态空间的五个视图：语义状态进 Markdown，部署参数进 YAML，证据指针让语义可回溯。',
      takeaways: [
        { icon: '📄', title: '边界即文件', desc: '松耦合、可审计、可版本化——代价是轮询延迟。' },
        { icon: '🧠', title: '语义而非像素', desc: 'ENVIRONMENT.md 存任务相关状态 + 证据指针。' },
        { icon: '🌐', title: '一份状态五视图', desc: '意图、能力、环境、记忆对齐到同一参照系。' },
      ],
    },
    // ---------------------------------------------------------------- 第 5 章
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '为什么是 Session，而不是 Action？',
      badge: 'both',
      badgeLabel: '运行时',
      bridge: '状态共享解决了「看什么」，还没解决「治理什么单位」。本章解释为什么调度、预检、心跳与验收都挂在 Session 上——并让你亲手推进这台状态机。',
      analogy: {
        title: '一次登山 = 一份完整的行程记录',
        text: '治理的对象不是「某一步踩在哪」，而是<b>整段行程</b>：出发检查、途中报平安、终点确认——对应会话的完整生命周期。',
        componentId: 'analogy-note',
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: 'Session Lifecycle：一台可以被你玩坏的状态机',
          desc: '按合法顺序推进会话；试着在 running 时直接点 Verify——看看治理层如何拒绝非法转移。每一步都会在协议控制台里留下记录。',
          componentId: 'session-lifecycle',
          figure: './images/fig5-watchdog.png',
        },
      ],
      formula: {
        lead: '会话的状态机写成一串转移——每一步都是可检查的显式状态，非法转移会被直接拒绝。',
        unicode: 'pending → claimed → running → finalizing → verifying → terminal',
        symbols: [
          { sym: 'pending', desc: 'Agent 已编译会话写入 SESSIONS.md，等待认领。' },
          { sym: 'claimed', desc: 'Watchdog 原子认领，开始兼容性预检。' },
          { sym: 'running', desc: 'SessionRunner 执行，三路心跳持续上报。' },
          { sym: 'finalizing', desc: '到达终止条件，证据包被收集写回。' },
          { sym: 'verifying', desc: 'SessionVerifier 依据契约评估证据。' },
          { sym: 'terminal', desc: 'succeeded / failed / replanned，追加进 attempts 记录。' },
        ],
      },
      insight: 'Session 是治理的最小单位：状态机显式可审计，预检把结构性错配挡在目标端访问之前。',
      takeaways: [
        { icon: '🧭', title: '单位是会话', desc: '调度、预检、心跳、取证共享同一个生命周期。' },
        { icon: '👮', title: '监督≠控制', desc: 'Watchdog 不做高频循环，只做治理与故障遏制。' },
        { icon: '🚫', title: '非法即拒绝', desc: '状态机与预检都显式拒绝非法操作。' },
      ],
    },
    // ---------------------------------------------------------------- 第 6 章
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '两种执行流为何能共用一套 Runtime？',
      badge: 'inf',
      badgeLabel: '执行流',
      bridge: '会话解决了「治理什么单位」，但生成动作的决策点可以完全不同。本章区分连续策略流与 Agent 工具流——注意它们汇入的边界完全相同。',
      analogy: {
        title: '同一条路，两种走法',
        text: '连续策略像按既定步频走路，Agent 工具流像边走边查路牌——不管哪种走法，<b>都不能绕过检查站</b>。',
        componentId: 'analogy-note',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: 'Dual Flow：切换执行流，观察不变的边界',
          desc: '在 Policy-driven 与 Agent-directed 之间切换：谁在循环中做决策变了，Session、监督与证据边界一点没变。策略流可以逐块执行；工具流试试被禁止的 raw_motor_command。',
          componentId: 'dual-flow',
        },
      ],
      formula: {
        lead: '论文给两条流各写了一个系统级接口公式——注意它们是接口抽象，不是新的损失函数。',
        unicode: 'Aₜ = Policy(I, Oₜ, Sₜ, Hₜ)　·　Tₜ = Agent(I, Oₜ, Sₜ, Hₜ)',
        symbols: [
          { sym: 'Aₜ', desc: 'PolicySkillRuntime 产出的动作或动作块。' },
          { sym: 'Tₜ', desc: 'TargetSessionHandle 暴露的受控工具调用输出。' },
          { sym: 'I', desc: '自然语言任务指令。' },
          { sym: 'Oₜ / Sₜ / Hₜ', desc: '当前观测、系统/环境状态与历史上下文。' },
        ],
      },
      insight: '两条执行流的差异只在「谁在循环里做决策」；它们汇入完全相同的监督、证据与验收边界——这是整个系统抽象的关键。',
      takeaways: [
        { icon: '🔀', title: '决策点不同', desc: '策略流的循环在运行层，工具流的决策在 Agent。' },
        { icon: '📦', title: '动作块要治理', desc: '缓冲、截断、打断与重规划边界由 Runtime 管理。' },
        { icon: '🎛️', title: '参与≠授权', desc: '工具必须经 Manifest 过滤，raw 命令不在清单里。' },
      ],
    },
    // ---------------------------------------------------------------- 第 7 章
    {
      kind: 'chapter',
      id: 'chap-7',
      title: '系统如何知道「任务真的成功」？',
      badge: 'both',
      badgeLabel: '语义验收',
      bridge: '动作已经能安全到达 Target。现在回答第 2 章留下的核心问题：验证层读什么、判什么——你来当一次 SessionVerifier。',
      analogy: {
        title: '把起点和终点一起对回地图',
        text: '只看终点照片，说不清旗子是谁插的；把<b>起点、终点和路径</b>一起对回地图，才能判定「这次登山真的完成了目标」。',
        componentId: 'analogy-note',
      },
      modules: [
        {
          kind: 'module',
          id: '7.1',
          title: 'Evidence-Based Verifier Lab：你来给出判定',
          desc: '四个真实情境，每个都给出完整证据包（G / S₀ / S_T / τ / H）。先自己判 success、failure 还是 replan，再看系统解释——特别注意只看 S_T 会掉进哪个陷阱。',
          componentId: 'verifier-lab',
          figure: './images/fig8-session-verifier.png',
        },
      ],
      formula: {
        lead: '论文把语义验收抽象为一个判定函数——读的是证据包，输出是三种 verdict，不是可微分损失。',
        unicode: 'V(G, S₀, S_T, τ, H) → { success, failure, replan }',
        symbols: [
          { sym: 'V', desc: '验证器：谓词、任务评估器、多模态模型或人工复核的组合。' },
          { sym: 'G', desc: '任务目标与接受标准（acceptance criteria）。' },
          { sym: 'S₀ / S_T', desc: '初始 / 终止环境状态——成功通常指状态变化。' },
          { sym: 'τ', desc: '执行轨迹：动作-观测历史。' },
          { sym: 'H', desc: '相关历史上下文（跨会话经验）。' },
        ],
      },
      insight: '验证的对象是 S₀ → S_T 的状态变化，不是终止画面；replan 创建 child session，原尝试永不改写。',
      takeaways: [
        { icon: '🔬', title: '看变化', desc: '没有 S₀ 就无法证明变化是本次执行造成的。' },
        { icon: '🧾', title: '证据成包', desc: '返回码只是证据包里的一个字段。' },
        { icon: '🔁', title: '重规划不抹除', desc: 'child session 继承因果，历史 append-only。' },
      ],
    },
    // ---------------------------------------------------------------- 第 8 章
    {
      kind: 'chapter',
      id: 'chap-8',
      title: '失败如何真正变成可复用经验？',
      badge: 'trn',
      badgeLabel: '自演化',
      bridge: '验证给出了 failure，但失败本身还不是经验。本章走完论文最核心的闭环：Execute → Verify → Diagnose → Revise → Re-verify → Consolidate，并判断哪些东西配进入长期记忆。',
      analogy: {
        title: '猜一个修法 ≠ 学到一条经验',
        text: '「下次先看脚下」只是<b>猜测</b>；换条路重新走通之后，它才配写进路线手册——<b>手册只收验证过的路</b>。',
        componentId: 'analogy-note',
      },
      modules: [
        {
          kind: 'module',
          id: '8.1',
          title: 'Failure-to-Memory System Map：一次失败的完整旅程',
          desc: '点击「执行会话」，沿着真实路径逐步推进：第一次 failure、诊断、child session、再验证，直到经验被固化。然后进入第二步「这能被学吗」，把候选经验分进正确的桶。',
          componentId: 'arch-map',
        },
      ],
      formula: {
        lead: '六步闭环本身就是因果链——每一步的输入都是上一步的输出，顺序不可跳。',
        unicode: 'Execute → Verify → Diagnose → Revise → Re-verify → Consolidate',
        symbols: [
          { sym: 'Execute', desc: '会话经标准运行时路径执行，产出轨迹与终止证据。' },
          { sym: 'Verify', desc: 'SessionVerifier 给出语义判定。' },
          { sym: 'Diagnose', desc: '结合契约、环境转移、运行时事件与既有教训定位原因。' },
          { sym: 'Revise', desc: '修订子目标、运行时、目标配置或动作方法，编译 child session。' },
          { sym: 'Re-verify', desc: '新策略在相同验收语义下重新执行并判定。' },
          { sym: 'Consolidate', desc: '只有验证后的结果才写入 KNOWLEDGE.md / LESSONS.md。' },
        ],
      },
      insight: '验证是系统级学习的前提：未经 Re-verify 的修复只是 hypothesis；进入记忆的经验必须携带 provenance 与 scope。',
      takeaways: [
        { icon: '🧠', title: '系统级自演化', desc: '不改权重：靠记忆、策略选择与技能复用变强。' },
        { icon: '🔁', title: '顺序是硬约束', desc: '没有 Re-verify 的修复不能进入长期记忆。' },
        { icon: '🏷️', title: '经验带条件', desc: 'provenance + scope 决定经验能否迁移。' },
      ],
    },
    // ---------------------------------------------------------------- 第 9 章
    {
      kind: 'chapter',
      id: 'chap-9',
      title: '系统怎样在真实世界里保持安全？',
      badge: 'both',
      badgeLabel: '验证+安全',
      bridge: '闭环已经完整，但「在游戏里跑通」离「在真实机器人上安全运行」还有距离。本章看两件事：如何逐层加回物理约束，以及五层防御各拦什么故障。',
      analogy: {
        title: '先平地、再碎石、最后冰面',
        text: '不同路面加回不同风险——<b>逐层</b>试探才能把「摔跤」归因到具体变量；而护绳、头盔和结组一样都不能省。',
        componentId: 'analogy-note',
      },
      modules: [
        {
          kind: 'module',
          id: '9.1',
          title: 'Progressive Validation：逐层加回真实',
          desc: '切换 Game / Simulation / Real Robot 三层，看每一层隔离了什么、加回了什么、能证明什么、不能证明什么。',
          componentId: 'tier-ladder',
        },
        {
          kind: 'module',
          id: '9.2',
          title: 'Five-Layer Fault Injection：这个故障停在哪一层？',
          desc: '注入六类真实故障，观察它们分别被哪一层拦下——注意为什么不能用一个红色「Safety」大框包办一切。',
          componentId: 'five-layers',
        },
      ],
      insight: '渐进验证让性能下降可归因到具体层；五层防御各管一类失败——越内层的权威越不可替代。',
      takeaways: [
        { icon: '🪜', title: '逐层验证', desc: 'Game 测认知，Sim 测恢复，真机测安全与集成。' },
        { icon: '🛡️', title: '纵深防御', desc: '预检、桥接、SafetyGuard、心跳、目标端各司其职。' },
        { icon: '⚠️', title: '不可外推', desc: 'PhyAgentOS 安全叠加在 robot-native safety 之上，不替代它。' },
      ],
    },
    // ---------------------------------------------------------------- 第 10 章
    {
      kind: 'chapter',
      id: 'chap-10',
      title: '实验到底证明了什么？',
      badge: 'both',
      badgeLabel: '实验',
      bridge: '最后一章不背数字，而是学会读证据：每个基准的协议、指标、基线与 First/Final 定义是什么——哪些结论被支持，哪些是过度解读。',
      analogy: {
        title: '到达终点，还要查完整记录',
        text: '终点的绿色不是「所有山都被征服」，而是<b>每个协议下</b>都能看到证据、提升和剩余难点。',
        componentId: 'analogy-note',
      },
      modules: [
        {
          kind: 'module',
          id: '10.1',
          title: 'Benchmark Explorer：按协议读数字',
          desc: '六个基准各显示协议、指标、First/Final 定义与局限。数字只在同一协议内对齐——注意 LIBERO 的天花板效应与 RoboCasa365 的大增益来自哪里。',
          componentId: 'benchmark-lab',
        },
        {
          kind: 'module',
          id: '10.2',
          title: 'Claim Checker：这句话论文支持吗？',
          desc: '七条常见结论，逐条判 Supported / Overclaimed / Wrong——判完看论文依据。这是读这篇论文最该带走的技能。',
          componentId: 'claim-checker',
        },
      ],
      insight: 'Final − First 度量的是「验证与恢复能挽救多少原本失败的执行」，不是模型本身变强了多少。',
      takeaways: [
        { icon: '📈', title: '增益有条件', desc: '基线越强、失败越少，恢复空间越小（天花板效应）。' },
        { icon: '🧾', title: '先看协议再读数', desc: 'First / Final、指标方向与基线必须一起看。' },
        { icon: '🧭', title: '知道边界', desc: '系统成功率提升 ≠ 模型能力上限被消除。' },
      ],
    },
  ],
};
