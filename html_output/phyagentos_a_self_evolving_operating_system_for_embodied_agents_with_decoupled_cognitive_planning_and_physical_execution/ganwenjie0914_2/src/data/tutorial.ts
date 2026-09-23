import type { TutorialData } from '../types';

// ---------------------------------------------------------------------------
// 术语 Hover / Focus 系统（plan §5）
// 只在术语第一次出现的章节挂 popover；popover 结构固定为：
//   英文全称 / 一句话定义 / 在 PhyAgentOS 中的角色 / 不要与什么混淆
// ---------------------------------------------------------------------------

interface TermInfo {
  full: string;
  def: string;
  role: string;
  warn: string;
}

const TERMS: Record<string, TermInfo> = {
  embodied: {
    full: 'Embodied AI · 具身智能',
    def: '智能体通过身体与环境交互，其输出会真实改变物理世界。',
    role: 'PhyAgentOS 治理的对象场景：错误动作的代价不再是「答错」，而是撞上真实的东西。',
    warn: '具身智能 ≠ 纯文本 Agent：它多了一层不可撤销的物理后果。',
  },
  vla: {
    full: 'VLA · Vision-Language-Action',
    def: '根据视觉与语言指令直接生成机器人动作（末端位姿、关节量或动作块）。',
    role: '作为可替换的 Policy backend 被 Runtime 调用，如 OpenVLA、π₀、X-VLA。',
    warn: 'VLA ≠ 完整具身系统：它不负责权限、监督与最终语义验收。',
  },
  worldmodel: {
    full: 'World Model · 世界模型',
    def: '预测执行某动作之后世界可能变成什么样：ŝ_{t+1} ≈ f(s_t, a_t)。',
    role: '潜在预测模块：可辅助预演与风险评估。',
    warn: '世界模型不承担执行契约：它不知道动作是否有权限执行、任务语义是否满足。',
  },
  agent: {
    full: 'Agentic Planner · 认知规划器',
    def: '理解高层任务、分解目标、选择工具并进行长程规划的 LLM 系统。',
    role: '决定「做什么」：产出结构化 Session 契约，而不是电机命令。',
    warn: 'Agent 不应直接获得无边界的硬件控制权限。',
  },
  ros: {
    full: 'ROS · 机器人中间件',
    def: '提供节点通信、发布/订阅、硬件抽象与软件包生态的机器人框架。',
    role: '位于 PhyAgentOS 之下的传输与抽象层。',
    warn: 'ROS 不是任务级 OS：它不提供语义验证、持久记忆与会话生命周期。',
  },
  policy: {
    full: 'Policy · 策略',
    def: '从观测产生动作的模型：VLA、diffusion policy 或学习控制器。',
    role: 'PolicySkillRuntime 的执行引擎，产生动作或动作块。',
    warn: '策略产生的「模型动作」不能直接等价为「设备命令」。',
  },
  target: {
    full: 'Target · 执行目标',
    def: '真正被控制的执行对象：游戏、仿真器（MuJoCo / LIBERO）或真实机械臂。',
    role: '通过 TargetAdapter 暴露受控接口与能力清单。',
    warn: 'Target ≠ Strategy：换机器人 = 换 Target 与 Adapter，不换高层协议。',
  },
  runtime: {
    full: 'Runtime · 运行时',
    def: '负责任务调度、兼容性预检、监督执行、取证与安全的系统层。',
    role: 'PhyAgentOS 本体：回答「如何安全、受控地执行」。',
    warn: 'Runtime 不做高频控制：观测-动作循环仍在本地执行路径里。',
  },
  session: {
    full: 'Session · 会话',
    def: '一次任务的完整事务：从创建、认领、执行到验证的有界生命周期。',
    role: '调度、预检、取证与验收的最小单位。',
    warn: 'Session ≠ 单条动作：心跳、取消、重试、证据都需要更大的容器。',
  },
  statefile: {
    full: 'State-as-a-File · 文件协议',
    def: '把跨层状态物化为可读、可解析、可版本化的 Markdown + 内嵌 YAML 文件。',
    role: '认知—物理边界的显式契约：Agent 与 Runtime 不 import 彼此实现。',
    warn: '文件协议不是越快越好：它用低延迟换取低耦合、可审计与可恢复。',
  },
  skillruntime: {
    full: 'SkillRuntime · 技能运行时',
    def: '定义「这类技能如何被运行」：PolicySkillRuntime / BuiltinSkillRuntime 两种。',
    role: '连接「谁做决策」与「动作如何到达 Target」。',
    warn: 'SkillRuntime 不是神经网络：它是执行策略的运行时容器。',
  },
  adapter: {
    full: 'Adapter · 适配器',
    def: '表示转换层：PolicyAdapter（模型↔统一协议）、TargetAdapter（统一接口↔设备 SDK）、ActionBridge（坐标系/单位/维度等动作转换）。',
    role: '低层差异封装在 Adapter 里，高层语义保持不变。',
    warn: '三者不可混淆：Bridge 管转换，SafetyGuard 管放行。',
  },
  actionchunk: {
    full: 'Action Chunk · 动作块',
    def: '模型一次预测未来一段动作：A_t = [a_t, …, a_{t+K-1}]。',
    role: '降低推理频率、提高时间一致性，但需要 Runtime 管理缓冲与截断。',
    warn: '执行到第 5 步环境已变时，后 15 步是否作废——这是系统问题，不是模型问题。',
  },
  preflight: {
    full: 'Preflight · 兼容性预检',
    def: '在触碰目标端之前核对观测模态、动作语义、控制频率、适配器与安全配置。',
    role: '最外层防线：非法组合在获得目标端访问权之前被拒绝。',
    warn: '预检不是运行时兜底：它把结构性错配提前到零物理成本的时刻。',
  },
  heartbeat: {
    full: 'Heartbeat · 心跳',
    def: 'Runner、策略服务与目标端定期上报的存活信号。',
    role: 'Watchdog 据此发现卡死、断网与崩溃，触发受控终止。',
    warn: '心跳缺失时旧的 Action Chunk 不应继续驱动机器人。',
  },
  evidence: {
    full: 'Evidence Bundle · 证据包',
    def: '任务定义、S₀ 与 S_T 观测、环境快照、动作-观测历史与目标端事件的集合。',
    role: 'SessionVerifier 的输入：返回码只是其中一个字段。',
    warn: '没有 S₀ 的证据不完整：无法判断「变化」是否由本次执行造成。',
  },
  verifier: {
    full: 'SessionVerifier · 语义验收器',
    def: '读取证据包与接受标准，输出 success / failure / replan 的判定层。',
    role: '把系统从 Execution-centric 升级为 Outcome-centric。',
    warn: 'Verifier 也可能出错：可靠的是证据可追溯 + 判定 append-only。',
  },
  memory: {
    full: 'Epistemic Memory · 认知记忆',
    def: '分层持久记忆：Episodic（经历）、Working（当前状态）、Semantic（规律）、Procedural（方法）。',
    role: '让下一次会话不必从零开始，即使模型权重完全不变。',
    warn: '记住很多 ≠ 每次都能找回最相关的经验：检索目前依赖启发式。',
  },
  embodiment: {
    full: 'Embodiment · 具身形态',
    def: '机器人的物理构型：自由度、夹爪几何、传感器布局、控制频率。',
    role: '跨 embodiment 复用经验时必须检查 precondition。',
    warn: '在 Franka 上成功 ≠ 在所有机器人上成功：接触丰富的策略依赖夹爪与频率。',
  },
  simreal: {
    full: 'Sim-to-Real · 仿真到现实',
    def: '从仿真迁移到真实硬件时的差距：传感器噪声、延迟、动力学误差。',
    role: 'Progressive Validation 用层级把这类变量隔离开、再逐层加回。',
    warn: '仿真里免费的成功不能自动兑换成真实世界的安全。',
  },
  verificationgap: {
    full: 'Verification Gap · 验证缺口',
    def: '执行器确认命令完成，但系统没有证据确认任务语义已经成立的结构性断层。',
    role: 'PhyAgentOS 用 S₀、S_T、轨迹 τ 与接受标准把执行结果升级为可验收结果。',
    warn: 'Verification Gap ≠ 普通返回码 bug：即使所有函数正常返回，它仍可能存在。',
  },
  sessioncontract: {
    full: 'Session Contract · 会话契约',
    def: '把任务目标、Runtime、Target、前置条件、执行限制与接受标准绑定在一起的可执行约定。',
    role: 'Agent Plane 的输出，也是 Runtime 决定是否认领、执行与验收的依据。',
    warn: '契约描述“允许怎样执行”，不是一串 raw hardware command。',
  },
  watchdog: {
    full: 'WatchdogSupervisor · 看门狗监督器',
    def: '认领 Session、触发预检、创建 Runner、监控心跳并传播取消/超时的监督入口。',
    role: '管理会话级生命周期与故障遏制，不进入高频控制回路。',
    warn: 'WatchdogSupervisor ≠ SessionRunner：前者监督，后者执行本次会话。',
  },
  sessionrunner: {
    full: 'SessionRunner · 会话执行器',
    def: '在预检通过后负责 configure、start、observe、step、termination 与证据收集的执行对象。',
    role: '把 SkillRuntime、Adapter 与 Target 组织成一次受控的具体执行。',
    warn: 'Runner 管单次执行，不负责高层目标分解。',
  },
  policyadapter: {
    full: 'PolicyAdapter · 策略适配器',
    def: '在统一 Observation/Action Contract 与具体模型张量、消息格式之间做双向转换。',
    role: '让 OpenVLA、π₀、diffusion policy 等后端接入同一 Runtime。',
    warn: 'PolicyAdapter ≠ ActionBridge：前者贴近模型格式，后者处理通用动作表示转换。',
  },
  actionbridge: {
    full: 'ActionBridge · 动作桥',
    def: '执行坐标系、单位、维度投影、夹爪映射与动作块重采样等确定性转换。',
    role: '把标准动作变成目标端可理解的表示，再交给 SafetyGuard 判断能否放行。',
    warn: 'ActionBridge 只保证转换正确，不负责判断动作是否安全。',
  },
  safetyguard: {
    full: 'SafetyGuard · 安全守卫',
    def: '检查 dtype、维度、NaN/Inf、关节/工作空间限位、速度、加速度、时长与急停状态。',
    role: '对转换后的命令执行 Reject、Safe Halt 或 Authorized Clamp，并记录违规码。',
    warn: 'SafetyGuard 不替代机器人本地碰撞检测、扭矩限制与硬件急停。',
  },
  toolmanifest: {
    full: 'TargetToolManifest · 目标工具清单',
    def: '按 Session 权限过滤后，允许 Agent 通过 TargetSessionHandle 调用的工具集合。',
    role: '把 observe、step、query_state 等合法能力显式暴露，把危险实现细节留在边界内。',
    warn: 'Agent 在线决策 ≠ Agent 自动获得 raw motor command 权限。',
  },
  appendonly: {
    full: 'Append-only · 只追加历史',
    def: '新尝试以追加记录保存，旧的失败、判定与父子关系不被后来的成功覆盖。',
    role: '支撑可审计的 attempts 历史、故障归因与 child session 因果追踪。',
    warn: 'Append-only 不等于永不整理；可以固化总结，但不能篡改原始尝试。',
  },
  atomicupdate: {
    full: 'Atomic Update · 原子更新',
    def: '读者要么看到完整旧版本，要么看到完整新版本，不能看到写到一半的协议文件。',
    role: '与 single-writer 共同保证 State-as-a-File 的一致性。',
    warn: '原子更新解决写入一致性，不消除文件轮询带来的调度延迟。',
  },
  provenance: {
    full: 'Provenance · 来源链',
    def: '记录一条知识由哪个 Session、目标端、证据与验证结论产生。',
    role: '让经验可追溯，也让后续检索知道它是否值得信任。',
    warn: '没有 provenance 的经验不能区分真实验证与未经复验的猜测。',
  },
  scope: {
    full: 'Scope · 适用范围',
    def: '限定经验成立的环境、目标类型、具身形态、控制频率与风险条件。',
    role: '阻止系统把局部成功错误外推到所有机器人或所有任务。',
    warn: 'Franka 上验证过的抓法，不自动适用于不同夹爪与控制频率。',
  },
  defenseindepth: {
    full: 'Defense-in-Depth · 纵深防御',
    def: '让多个独立安全边界分别处理兼容性、表示、命令、健康与设备本地约束。',
    role: '上层失效时，下层仍保留自己的检查与最终物理权威。',
    warn: '纵深防御不是把所有错误都塞进一个万能 Safety 模块。',
  },
  firstfinal: {
    full: 'First / Final Protocol · 首次/最终协议',
    def: 'First 记录策略原始首次尝试，Final 记录同一成功标准下允许验证与恢复后的最终结果。',
    role: 'Final − First 衡量系统恢复挽救了多少原本失败的执行。',
    warn: '这个差值不是模型权重更新后的能力增益，任务目标与成功标准也没有放宽。',
  },
};

/** 生成带 popover 的术语 HTML（在 prose body 内使用）。 */
function term(key: keyof typeof TERMS, display?: string): string {
  const t = TERMS[key];
  const label = display ?? key;
  return (
    `<span class="term" tabindex="0">${label}` +
    `<span class="term-popover">` +
    `<b>${t.full}</b>` +
    `<span class="tp-def">${t.def}</span>` +
    `<span class="tp-role">本文角色：${t.role}</span>` +
    `<span class="tp-warn">别混淆：${t.warn}</span>` +
    `</span></span>`
  );
}

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'PhyAgentOS: A Self-Evolving Operating System for Embodied Agents with Decoupled Cognitive Planning and Physical Execution',
    titleZh: 'PhyAgentOS：面向具身智能体的认知规划与物理执行解耦的自演化操作系统',
    venue: 'arXiv:2607.16636v1 · 2026-07-21 · v0.1.6',
    authors: 'Yang Liu · Weixing Chen · Xinshuai Song · Tao Pu · Siwen Mo · Yongjie Bai · Zihao Chen · Qianran Sun · Liruo Zhong · Ying Shen · Liang Lin',
    affiliation: 'X-Era Lab · HCP Lab, Sun Yat-sen University · Peng Cheng Laboratory',
    domain: '具身智能 · Agent 运行时 · 语义验证 · 自演化 · 纵深安全',
    coreProblem: 'VLA、世界模型与 Agent 各自很强，但没有共享状态、语义验收、持久经验与监督执行的系统层——执行终止常被当成任务完成。',
    coreInsight: '把认知—物理边界物化为文件协议，把 Session（而非单条动作）作为调度、预检、监督、取证与验收的最小单位：自进化首先发生在系统层，而不必改模型权重。',
    keywords: ['State-as-a-File', 'Session-Centered Runtime', 'SessionVerifier', 'Epistemic Memory', 'Layered Safety'],
    links: [
      { label: '项目主页', url: 'https://phy-agent-os.net' },
      { label: 'GitHub', url: 'https://github.com/PhyAgentOS/PhyAgentOS' },
      { label: 'arXiv', url: 'https://arxiv.org/abs/2607.16636' },
    ],
  },
  hero: {
    oldMethod: {
      desc: '把三种范式直接拼在一起：每一层都报告「成功」，却没有一层核对物理世界是否真的变成了任务要求的状态。',
      points: ['返回码被当成任务完成（Verification Gap）', '抽象层级不兼容，到处是 ad-hoc 转换器', '黑盒叠加，十步任务失败无法归因', '失败经验随会话结束被丢弃'],
    },
    newMethod: {
      desc: 'PhyAgentOS 在三种范式之下加一层系统运行时：文件协议、会话治理、证据验证与分层安全把一次执行闭成可审计、可复用的循环。',
      points: ['Session 是调度、预检与验收的最小单位', 'State-as-a-File 让跨层状态可读、可审计、可回放', 'SessionVerifier 用证据包区分「动作结束」与「任务完成」', '验证过的经验沉淀为记忆，模型权重零改动', '预检→桥接→SafetyGuard→心跳→目标端五层纵深防御'],
    },
  },
  chapters: [
    // ------------------------------------------------------------------ CH 1
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
        componentId: 'hike-analogy',
      },
      prose: [
        {
          heading: '这个领域已经有的四个「局部很强」的组件',
          body: `${term('embodied', '具身智能')}的基本回路是：环境 → 传感器 → 观测 → 决策 → 动作 → 环境改变。在这个回路里，论文点名了四个很强的组件：<b>${term('vla', 'VLA')}</b>擅长从视觉与语言直接生成动作；<b>${term('worldmodel', '世界模型')}</b>擅长预测「执行这个动作之后世界会怎样」；<b>${term('agent', 'Agent')}</b>擅长理解任务、分解目标、调用工具、长程规划；<b>${term('ros', 'ROS')}</b>擅长连接传感器、执行器与机器人软件节点。它们各自解决一段问题。`,
        },
        {
          heading: '用同一个任务把角色串起来',
          body: `拿论文里最简单的任务：「把桌上的杯子放进柜子」。看见环境靠感知与 ${term('target', 'Target')} 的接口；理解任务、规划步骤靠 Agent；预演后果可以靠世界模型；生成动作靠 ${term('policy', 'Policy')}（VLA 就是典型的 Policy）；真正转电机的是控制器与 ROS。这条链上的每一环都有明确 owner。但<b>「验证结果」与「记录并复用经验」这两环，在传统管线里没有人负责</b>——右侧交互里点一下这两步，你会看到三个组件互相沉默。`,
        },
        {
          heading: '缺的不是更聪明的模型，而是一层治理',
          body: `执行器回答的是「我是否按要求执行了动作」，用户关心的是「世界是否变成了要求的状态」——这两个问题在组件堆叠里都落空。此外，Agent、Policy、控制器处理的对象完全不同（符号目标、张量、关节角），直接拼在一起需要大量临时转换器，失败也无法归因。论文因此提出：缺失的不是第 4 个「更聪明的模型」，而是<b>管理这些模型如何可靠协作的运行时</b>——这正是后面章节展开的 ${term('runtime', 'Runtime')} 层。`,
        },
      ],
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
    // ------------------------------------------------------------------ CH 2
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
        componentId: 'hike-analogy',
      },
      prose: [
        {
          heading: '抓空的杯子：每一层都报告成功',
          body: `论文开篇的场景：机器人被要求「抓起桌上的杯子」。夹爪在<b>感知到的</b>杯子位置准确闭合，控制器记录「轨迹偏差 0.6cm，在 1cm 容差内」，函数全部正常返回——于是传统软件认为 Task Success。但真实情况是：夹爪闭合在空气中，杯子还留在桌上。这就是<b>执行层状态</b>与<b>任务语义状态</b>的分裂：前者问「动作是否被忠实执行」，后者问「世界是否变成要求的样子」。论文把这个结构性缺口称为 ${term('verificationgap', 'Verification Gap（验证缺口）')}。`,
        },
        {
          heading: '为什么不是偶然 bug，而是结构性缺口',
          body: '即使把 Agent + 世界模型 + VLA 全部组合起来，仍有三个结构性问题。<b>第一，抽象层级不兼容</b>：Agent 处理任务与符号状态，世界模型处理 latent 预测，VLA 处理图像 token 与动作块，控制器处理关节角与力矩——中间全靠 ad-hoc 转换器。<b>第二，黑盒叠加导致故障难归因</b>：十步任务失败时，是 LLM 规划错、工具参数错、预测错、动作错、坐标转换错还是传感器错？没有系统边界就查不清。<b>第三，经验无法跨 Session 持久化</b>：这次调好的抓取角度，下次遇到相似杯子仍要从零试起。',
        },
        {
          heading: '出路：把语义验证变成显式的一层',
          body: `修复的起点是把「动作是否结束」与「目标是否实现」拆开，并要求验证层读取完整${term('evidence', '证据包')}：初始状态 S₀、终止状态 S_T、执行轨迹 τ 和接受标准——任务成功通常描述的是<b>状态变化</b> S₀ → S_T，没有 S₀ 就无法证明「杯子是刚刚被抓走的，还是本来就不在桌上」。而这要求各层共享一套可比较的状态——下一章先看 PhyAgentOS 到底是什么，第 4 章再看状态如何共享。`,
        },
      ],
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
    // ------------------------------------------------------------------ CH 3
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
        componentId: 'hike-analogy',
      },
      prose: [
        {
          heading: '它不是「机器人脑模型」，而是脑与手之间的系统层',
          body: `PhyAgentOS 不提出新的 VLA 结构、不提出新的世界模型。它的位置在<b>高层认知与低层物理执行之间</b>：Agent 平面回答「做什么」（What should be done?），Runtime 平面回答「如何安全、受控地执行」（How should it be executed safely?）。Agent 被明确限制：不允许直接发 raw hardware command，只能产出结构化${term('sessioncontract', 'Session 契约')}；Runtime 只接受满足约束的契约。两边因此可以各自更换、独立演化。`,
        },
        {
          heading: '「OS」是运行时抽象，不是传统内核',
          body: '论文没有提出 CPU 调度器、虚拟内存或进程隔离内核——它不是 Linux 那个层次的东西。更准确的理解是 <b>Embodied Agent Runtime Platform</b>：借用操作系统的思想，把分散在应用代码里的公共执行治理能力——调度、记忆、验证、安全、评测、适配器抽象——提升为统一运行时服务。这和计算机系统里 Application / OS / Driver 的经典分层同构：高层语义保持不变，低层差异封装在驱动与适配器里。',
        },
        {
          heading: '与 ROS 的关系：补充，而非替代',
          body: `ROS 名字里虽然有 OS，但它主要提供节点通信、发布/订阅与硬件抽象，是<b>通信与软件中间件</b>。论文指出的缺失能力——task-level scheduling、persistent cross-session memory、semantic verification、统一安全管理、Agent 与执行层的标准契约——都不在 ROS 的职责里。所以正确的堆叠是：高层 Agent / VLA / 世界模型 → <b>PhyAgentOS</b> → ROS / SDK / 仿真器 → 执行目标。先在右侧把它搭出来，再展开论文原图（Figure 3）对照各组件的位置。<details class="figure-reveal"><summary>📄 查看论文原图 · Figure 3：PhyAgentOS 总体架构</summary><img src="./images/fig3-architecture.png" alt="论文 Figure 3：PhyAgentOS 总体架构（Agent Plane / 协议边界 / Runtime Plane）" loading="lazy" /></details>`,
        },
      ],
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: 'System Layer Builder：把「操作系统」一块块搭出来',
          desc: '从裸堆叠开始，逐项开启运行时能力，观察系统形态如何变化；再用「ROS 对照」检查哪些能力属于谁。',
          componentId: 'os-layer-builder',
        },
        {
          kind: 'module',
          id: '3.2',
          title: 'Architecture Graph：可展开的系统架构网络',
          desc: '从主链骨干开始，点击任意「球」展开它的关联节点与边，沿信息面板的「关联」继续跳转——对应论文 Figure 3 的可探索版本。',
          componentId: 'arch-graph',
        },
      ],
      insight: 'PhyAgentOS = 具身智能的运行时平台：调度、状态、验证、记忆、评测、安全六类公共服务，位于认知与物理执行之间。',
      formula: {
        lead: '把「缺什么」写成一张能力清单——每开启一项，Agent 与硬件之间的链路就多一类保证。',
        unicode: 'Scheduling · Shared State · Verification · Memory · Benchmark · Safety',
        symbols: [
          { sym: 'Scheduling', desc: 'Session 级调度：谁在何时获得执行权（WatchdogSupervisor）。' },
          { sym: 'Shared State', desc: '跨层共享的统一认知状态（文件协议）。' },
          { sym: 'Verification', desc: '基于证据的语义验收（SessionVerifier）。' },
          { sym: 'Memory', desc: '跨会话持久经验（Epistemic Memory）。' },
          { sym: 'Benchmark', desc: '与部署同路径的评测编排。' },
          { sym: 'Safety', desc: '预检、桥接、SafetyGuard、心跳、目标端五层防御。' },
        ],
      },
      takeaways: [
        { icon: '🏗️', title: '系统层定位', desc: '不是新模型，而是认知与物理之间的运行时。' },
        { icon: '🖥️', title: 'OS 是借喻', desc: '它是 Runtime Platform：把治理能力变成公共服务。' },
        { icon: '🔌', title: '不替代 ROS', desc: 'ROS 管通信与硬件抽象，PhyAgentOS 管任务生命周期。' },
      ],
    },
    // ------------------------------------------------------------------ CH 4
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
        componentId: 'hike-analogy',
      },
      prose: [
        {
          heading: 'State-as-a-File：边界不是函数调用，而是文件协议',
          body: `${term('statefile', 'State-as-a-File')} 的核心选择：Agent 与 Runtime 之间不设直接 import 或 RPC，而是共享一组<b>可读、可解析、可版本化</b>的 Markdown + 内嵌 YAML 文件。收益是结构性的：人可以直接检查「为什么执行这个任务、选了哪个机器人、结果如何」；Git 可以追踪状态变化；两个进程松耦合、语言无关；${term('appendonly', 'append-only')} 的 attempts 记录让「第一次失败、第二次重规划、第三次成功」的历史不被成功覆盖——审计是架构自带的性质。代价也要诚实：当前协议靠轮询工作，调度延迟受 polling interval 影响，且必须保证 single-writer + ${term('atomicupdate', 'atomic update')}，否则会读到写了一半的状态。`,
        },
        {
          heading: '从原始观测到结构化状态',
          body: `原始观测是 RGB、深度、点云、本体感知——Agent 不应该直接在像素流上推理。感知管线把观测转换成 <b>entity / attribute / relation / state change</b>：「cup 在桌上」「cabinet 开着」。注意 <code>ENVIRONMENT.md</code> 不复制原始像素，而是保存<b>任务相关的语义状态</b>，并保留指向原始观测的证据指针——语义给推理用，指针给审计用。`,
        },
        {
          heading: '统一认知状态空间：五份文件，一个世界',
          body: `<code>SESSIONS.md</code>（事务中心：目标、Runtime、Target、前置条件、接受标准、生命周期）、<code>SKILLRUNTIME.md</code>（这类技能需要什么观测、产出什么动作）、<code>TARGETS.md</code>（目标端能力、模态、约束）、<code>ENVIRONMENT.md</code>（结构化环境快照）、<code>LESSONS.md</code>（失败原因、纠正与验证）——它们不是五份孤立文档，而是<b>统一认知状态空间的五个视图</b>。这套协议还天然划分了 Cloud 与 Edge：云端跑大模型、记忆与长程规划，边缘跑 Watchdog、Runner、控制环与 SafetyGuard；网络上传输的是粗粒度状态，而不是每 1ms 的电机命令。<details class="figure-reveal"><summary>📄 查看论文原图 · Figure 7：文件协议边界</summary><img src="./images/fig7-file-protocol.png" alt="论文 Figure 7：五份 Markdown 协议文档与外部 YAML 配置" loading="lazy" /></details>`,
        },
      ],
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: 'Protocol Views：先结构化，再进协议',
          desc: '第一步：点击场景中的物体，生成结构化状态；第二步：打开五份协议文档，看同一状态如何被不同视图引用。',
          componentId: 'protocol-views',
        },
      ],
      insight: '五份协议文档是同一认知状态空间的五个视图：语义状态进 Markdown，部署参数进 YAML，证据指针让语义可回溯。',
      takeaways: [
        { icon: '📄', title: '边界即文件', desc: '松耦合、可审计、可版本化——代价是轮询延迟。' },
        { icon: '🧠', title: '语义而非像素', desc: 'ENVIRONMENT.md 存任务相关状态 + 证据指针。' },
        { icon: '🌐', title: '一份状态五视图', desc: '意图、能力、环境、记忆对齐到同一参照系。' },
      ],
    },
    // ------------------------------------------------------------------ CH 5
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '为什么是 Session，而不是 Action？',
      badge: 'both',
      badgeLabel: '运行时',
      bridge: '状态共享解决了「看什么」，还没解决「治理什么单位」。本章解释为什么调度、预检、心跳与验收都挂在 Session 上——并让你亲手推进状态机、配出一次预检。',
      analogy: {
        title: '一次登山 = 一份完整的行程记录',
        text: '治理的对象不是「某一步踩在哪」，而是<b>整段行程</b>：出发检查、途中报平安、终点确认——对应会话的完整生命周期。',
        componentId: 'hike-analogy',
      },
      prose: [
        {
          heading: '单条动作装不下一次任务',
          body: `一个任务通常包含观察 → 动作 → 再观察 → 再动作 → timeout → retry → verify。要施加兼容性检查、心跳、取消、重试、取证与验收，必须有一个<b>更大的生命周期容器</b>——这就是 ${term('session', 'Session')}。Agent 产出的也不是硬件命令，而是一份会话契约：任务目标、所选 SkillRuntime 与 Target、前置条件、执行限制与接受标准。对物理任务做治理，${term('runtime', 'Runtime')} 的抓手必须是完整 Session，而不是孤立的动作。`,
        },
        {
          heading: 'WatchdogSupervisor：监督，而不是控制',
          body: `${term('watchdog', 'WatchdogSupervisor')} 是 Runtime 的监督入口：从 <code>SESSIONS.md</code> 认领 pending 会话、验证运行时契约、执行兼容性${term('preflight', '预检')}、创建 ${term('sessionrunner', 'SessionRunner')}、监控三路${term('heartbeat', '心跳')}（Runner / 策略服务 / 目标端）、传播 timeout 与 cancel、把终止结果写回协议文件。关键约束：<b>它不做 observe → inference → action 的高频循环</b>——监督与故障遏制留在薄层，否则 Supervisor 又会膨胀成一个巨大的耦合模块。<details class="figure-reveal"><summary>📄 查看论文原图 · Figure 5：WatchdogSupervisor 的会话级监督</summary><img src="./images/fig5-watchdog.png" alt="论文 Figure 5：WatchdogSupervisor 在执行前检查协议与配置、执行中监控健康、执行后写回证据" loading="lazy" /></details>`,
        },
        {
          heading: '显式状态机：会话是一串可审计的转移',
          body: `会话有显式状态机：pending → claimed → running → finalizing → awaiting_verification → verifying → terminal（succeeded / failed / replanned）。每一步都是协议文件里的状态转移，不是散落在内存里的隐式变量——失败归因与事后审计因此有据可查。预检则在执行前核对：策略需要 RGB-D 而 Target 只有 RGB？策略输出笛卡尔速度而目标只收关节位置？策略要 10Hz 而接口只稳 5Hz？这些错配在机器人开始运动<b>之前</b>就该被拒绝。`,
        },
      ],
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: 'Session Lifecycle：一台可以被你玩坏的状态机',
          desc: '按合法顺序推进会话；试着在 running 时直接点 Verify——看看治理层如何拒绝非法转移。',
          componentId: 'session-lifecycle',
        },
        {
          kind: 'module',
          id: '5.2',
          title: 'Compatibility Preflight：在触碰机器人之前拒绝',
          desc: '配置策略需求与目标端能力，编译会话契约；把三行 FAIL 全部修成 PASS，才会产出 AdapterPlan 与工具清单。',
          componentId: 'preflight-lab',
        },
      ],
      insight: 'Session 是治理的最小单位：状态机显式可审计，预检把结构性错配挡在目标端访问之前。',
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
      takeaways: [
        { icon: '🧭', title: '单位是会话', desc: '调度、预检、心跳、取证共享同一个生命周期。' },
        { icon: '👮', title: '监督≠控制', desc: 'Watchdog 不做高频循环，只做治理与故障遏制。' },
        { icon: '🚫', title: '非法即拒绝', desc: '状态机与预检都显式拒绝非法操作。' },
      ],
    },
    // ------------------------------------------------------------------ CH 6
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
        componentId: 'hike-analogy',
      },
      prose: [
        {
          heading: 'Policy-driven：循环在运行层',
          body: `${term('skillruntime', 'SkillRuntime')} 有两种。<b>PolicySkillRuntime</b> 服务连续控制策略：运行层反复执行「获取观测 → ${term('policyadapter', 'PolicyAdapter')} 归一化为模型输入 → 推理 → 映射回标准动作 → 经 ${term('actionbridge', 'ActionBridge')} 与 ${term('safetyguard', 'SafetyGuard')} → TargetAdapter 执行」，Agent 编译完会话即退出低层循环。论文记作 Aₜ = Policy(I, Oₜ, Sₜ, Hₜ)。${term('adapter', '适配链')}把模型格式、通用动作表示与目标端 SDK 分层隔离；其中 ActionBridge 只做坐标系、单位、维度投影、夹爪重映射等确定性转换。`,
        },
        {
          heading: 'Action Chunk：模型时间与目标时间的矛盾',
          body: `${term('actionchunk', '动作块')}让模型一次预测未来 K 步，降低推理开销、提高时间一致性——但制造了系统问题：模型一次生成 20 步，执行到第 5 步环境已经变化，后面 15 步还该执行吗？所以 Action Runtime 必须管理缓冲、截断、打断、控制频率与重规划边界。这就是为什么「模型动作」不能直接等价为「设备命令」——中间的治理层不可省略。`,
        },
        {
          heading: 'Agent-directed：决策点在 Agent，权限在 Manifest',
          body: `<b>BuiltinSkillRuntime</b> 没有独立策略服务器：Agent 在线地「观察 → 决策 → 调用工具 → 再观察」，论文记作 Tₜ = Agent(I, Oₜ, Sₜ, Hₜ)。但它并非无限权限：工具经 TargetSessionHandle 暴露，先被会话的${term('toolmanifest', '工具清单（TargetToolManifest）')}过滤——observe、reset、invoke_tool、step、query_state 之外的实现细节与危险操作默认不可用，点击 raw_motor_command 只会得到拒绝。两条流最终统一汇入 Session → Watchdog 监督 → Target → Evidence → Verifier：后续的验证、评测、记忆与诊断因此<b>不需要知道</b>行为来自 VLA 还是 Agent。`,
        },
      ],
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: 'Dual Flow：切换执行流，观察不变的边界',
          desc: '在 Policy-driven 与 Agent-directed 之间切换：谁在循环中做决策变了，Session、监督与证据边界一点没变。策略流可以逐块执行；工具流试试被禁止的 raw_motor_command。',
          componentId: 'dual-flow',
        },
      ],
      insight: '两条执行流的差异只在「谁在循环里做决策」；它们汇入完全相同的监督、证据与验收边界——这是整个系统抽象的关键。',
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
      takeaways: [
        { icon: '🔀', title: '决策点不同', desc: '策略流的循环在运行层，工具流的决策在 Agent。' },
        { icon: '📦', title: '动作块要治理', desc: '缓冲、截断、打断与重规划边界由 Runtime 管理。' },
        { icon: '🎛️', title: '参与≠授权', desc: '工具必须经 Manifest 过滤，raw 命令不在清单里。' },
      ],
    },
    // ------------------------------------------------------------------ CH 7
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
        componentId: 'hike-analogy',
      },
      prose: [
        {
          heading: 'Verifier 读证据包，不读返回码',
          body: `${term('verifier', 'SessionVerifier')} 的输入是一个完整${term('evidence', '证据包')}：任务定义与接受标准、初始与终止观测、ENVIRONMENT.md 快照、动作-观测历史、目标端事件与任务指标。控制器返回的 <code>return_code = 0</code> 只是证据中的一个字段，不是最终真相。Verifier 也不必是单一模型——确定性谓词、任务评估器、多模态模型、工具辅助复核、人工复核都可以组合在同一接口之后；稳定的是<b>证据 schema 与 verdict 语义</b>，而不是某个固定模型。<details class="figure-reveal"><summary>📄 查看论文原图 · Figure 8：SessionVerifier 的语义验收</summary><img src="./images/fig8-session-verifier.png" alt="论文 Figure 8：Runtime 终止产出证据包，Verifier 对比任务意图、初始与终止状态后给出 success / failure / replan" loading="lazy" /></details>`,
        },
        {
          heading: '为什么必须同时有 S₀ 和 S_T',
          body: '任务成功通常描述<b>状态变化</b>：closed → open、table → cabinet、not grasped → grasped。只看终止图像「杯子在柜子里」，你无法区分「机器人刚刚放进去」还是「任务开始前它就在那里」——后者根本没有发生任何任务相关变化。所以 Verifier 必须同时读初始状态与终止状态，对比出 S₀ → S_T 的转移，才能把功劳（或责任）记在这次执行的账上。',
        },
        {
          heading: '三种判定，三种去向',
          body: '<b>success</b>：证据满足接受标准，会话转 succeeded。<b>failure</b>：目标未达成，转 failed，证据保留用于诊断与教训提取。<b>replan</b>：当前执行不能简单接受，但也不应终止整个高层目标——系统编译一个更新了前置条件的 <b>child session</b>，原会话不被重写。尝试历史因此 immutable / append-only：第一次失败与第二次成功同时被保留，父子会话的因果关系可追溯。一句话：Controller 回答「命令是否完成」，Verifier 回答「世界状态是否成立」——系统由此从 Execution-centric 升级为 Outcome-centric。',
        },
      ],
      modules: [
        {
          kind: 'module',
          id: '7.1',
          title: 'Evidence-Based Verifier Lab：你来给出判定',
          desc: '四个真实情境，每个都给出完整证据包（G / S₀ / S_T / τ / H）。先自己判 success、failure 还是 replan，再看系统解释——特别注意只看 S_T 会掉进哪个陷阱。',
          componentId: 'verifier-lab',
        },
      ],
      insight: '验证的对象是 S₀ → S_T 的状态变化，不是终止画面；replan 创建 child session，原尝试永不改写。',
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
      takeaways: [
        { icon: '🔬', title: '看变化', desc: '没有 S₀ 就无法证明变化是本次执行造成的。' },
        { icon: '🧾', title: '证据成包', desc: '返回码只是证据包里的一个字段。' },
        { icon: '🔁', title: '重规划不抹除', desc: 'child session 继承因果，历史 append-only。' },
      ],
    },
    // ------------------------------------------------------------------ CH 8
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
        componentId: 'hike-analogy',
      },
      prose: [
        {
          heading: 'Self-Evolving 的准确含义：系统级适应，不是在线训练',
          body: '论文标题里的自进化<b>首先不是</b>自动修改神经网络权重、不是在线 fine-tune VLA。它的定义是系统级过程：历史执行 → 语义验证 → 形成知识/教训 → 改变未来 Context、Strategy 与 Skill Selection。即使模型参数 θ 完全不变，系统第二次也可能比第一次做得更好。六步闭环的顺序是硬约束：Execute → Verify → Diagnose → Revise → Re-verify → Consolidate——「猜测一个修复方法」和「已经学到一个正确经验」之间，必须隔一次<b>相同验收语义下的再验证</b>。',
        },
        {
          heading: '一次失败如何穿越整个系统',
          body: `右侧交互把第 3–7 章的所有组件串成一条真实路径：Goal Planner 编译目标 → Session Compiler 产出会话 → 写入 <code>SESSIONS.md</code> → Watchdog 认领 → 预检通过 → SessionRunner 驱动 PolicySkillRuntime → Target 执行 → 证据包回传 → Verifier 判 <b>failure</b> → 结合契约、环境转移、运行时事件与既有教训做诊断 → 修订策略编译 <b>child session</b> → 再执行、再验证 → <b>success</b> 之后才 Consolidate 进记忆。每一步对应系统的一个组件与一次状态写回。`,
        },
        {
          heading: '记忆分层：什么配进入长期记忆？',
          body: `${term('memory', 'Epistemic Memory')} 分四层：<b>Episodic</b>（SESSIONS.md：任务、轨迹、证据、判定、父子关系）、<b>Working</b>（ENVIRONMENT.md：当前世界状态）、<b>Semantic</b>（KNOWLEDGE.md + LESSONS.md：跨 episode 的规律）、<b>Procedural</b>（SKILL.md / SKILLRUNTIME.md：怎么做这类任务）。KNOWLEDGE 收已验证的成功模式；LESSONS 收失败修正（失败目标、证据、诊断原因、纠正、以及纠正是否被后续验证）。检索时按 goal、environment、target type、risk factor 匹配，经验必须携带 ${term('provenance', 'provenance')} 与 ${term('scope', 'scope')}：在 Franka 上成功的抓法，不能自动推广到所有 ${term('embodiment', 'embodiment')}——接触密集的策略依赖夹爪几何与控制频率。`,
        },
      ],
      modules: [
        {
          kind: 'module',
          id: '8.1',
          title: 'Failure-to-Memory System Map：一次失败的完整旅程',
          desc: '点击「执行会话」，沿着真实路径逐步推进：第一次 failure、诊断、child session、再验证，直到经验被固化。然后进入第二步「这能被学吗」，把候选经验分进正确的桶。',
          componentId: 'arch-map',
        },
        {
          kind: 'module',
          id: '8.2',
          title: 'Grand Loop：全机制综合大动画',
          desc: '把 §3–§9 的所有机制串成一部自动播放的连续动画：会话包从目标出发，经过协议、预检、执行、验收、失败、诊断、再验证、固化，最终作为经验回到起点——可暂停、可重播、可按阶段跳转。这是论文 Figure 3 + Figure 8 + Figure 9 的动态合成。',
          componentId: 'grand-loop',
        },
      ],
      insight: '验证是系统级学习的前提：未经 Re-verify 的修复只是 hypothesis；进入记忆的经验必须携带 provenance 与 scope。',
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
      takeaways: [
        { icon: '🧠', title: '系统级自演化', desc: '不改权重：靠记忆、策略选择与技能复用变强。' },
        { icon: '🔁', title: '顺序是硬约束', desc: '没有 Re-verify 的修复不能进入长期记忆。' },
        { icon: '🏷️', title: '经验带条件', desc: 'provenance + scope 决定经验能否迁移。' },
      ],
    },
    // ------------------------------------------------------------------ CH 9
    {
      kind: 'chapter',
      id: 'chap-9',
      title: '系统怎样在真实世界里保持安全？',
      badge: 'both',
      badgeLabel: '验证+安全',
      bridge: '闭环已经完整，但「在游戏里跑通」离「在真实机器人上安全运行」还有距离。本章看两件事：如何逐层加回物理约束，以及五层防御各拦什么故障。',
      analogy: {
        title: '三种独立模式，经验逐层迁移',
        text: '<b>Game、Simulation、Real Robot</b> 不是一条路上的三段地形，而是三套独立运行模式：前两层隔离问题、积累经验，再为真机验证提供更可靠的起点。',
        componentId: 'hike-analogy',
      },
      prose: [
        {
          heading: 'Progressive Validation：Game → Simulation → Real Robot',
          body: `${term('simreal', '渐进验证')} 面对三难：真实机器人最真实但昂贵、慢、危险；仿真安全便宜但有仿真伪影；游戏几乎没有物理噪声但无法验证物理控制。论文的选择是<b>受控变量</b>：Game 层去掉执行器误差、传感器噪声与物理延迟，专测规划、记忆与自演化；Simulation 层加回动力学、碰撞、持久物理状态与控制延迟，测策略执行、失败恢复与语义验证；Real Robot 层再加硬件噪声、通信问题与安全关键约束。归因链清晰：Game 成功而 Sim 失败 → 问题在物理执行；连 Game 都失败 → 不必先怀疑机器人控制。认知层在三层之间保持不变。`,
        },
        {
          heading: '五层纵深防御，各拦一类故障',
          body: `PhyAgentOS 不依赖单一「安全模块」，而是${term('defenseindepth', '纵深防御（defense-in-depth）')}：①兼容性${term('preflight', '预检')}回答「组合是否合法」；②ActionBridge 回答「转换是否正确」（坐标、单位、维度、重采样——只做表示转换，不判安全）；③SafetyGuard 回答「命令是否允许执行」：dtype、维度、NaN 与无穷、关节限位、工作空间、速度/加速度、命令时长、频率、急停状态，处理方式为 Reject / Safe Halt / Authorized Clamp 并记录违规码；④${term('heartbeat', '心跳监测')}回答「系统是否仍然健康」——策略服务卡死、网络断开、Runner 失联都会触发受控终止，而不是让过期的动作块继续驱动机器人；⑤<b>目标端本地约束</b>（限位、碰撞检测、扭矩、硬件急停）是最内层、始终生效的最终权威。`,
        },
        {
          heading: '安全事件也是证据，而且不可协商',
          body: '每一次安全干预都以结构化违规码写入会话证据，让 Verifier 能区分「不安全地追求目标」与「为保安全的受控终止」，也能在诊断时区分安全干预、策略错误与通信故障。关键原则：<b>PhyAgentOS 的安全不能替代机器人原生安全</b>——它是叠加在外面的层，而不是最后一道闸。安全约束本身对自演化不可变：它定义了系统可以探索、恢复与改进的容许区域。',
        },
      ],
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
    // ------------------------------------------------------------------ CH 10
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
        componentId: 'hike-analogy',
      },
      prose: [
        {
          heading: '评测即编排：Benchmark 走部署同一条路',
          body: `传统研究里「部署运行时」和「评测脚本」常是两套代码，导致 benchmark 测的系统不是部署的系统。PhyAgentOS 要求 <b>Benchmark 也编译成 Session</b>：Availability Gate 先显式验证可用性——不满足就明确失败，而不是悄悄跳过部分 episode 再算一个好看的均值；Session Compiler 把任务 × 初始状态展开为记录了 seed、Runtime、Target 与评估配置的会话集；然后走与部署完全相同的 Watchdog → Runner → SkillRuntime → Verifier 路径。仿真层采用${term('firstfinal', 'First / Final 双协议')}：First 是策略第一次原始尝试，Final 是失败后允许 verifier 触发恢复的最终结果——不 fine-tune 策略、不改任务目标、不放宽成功标准。`,
        },
        {
          heading: '数字与它们的协议',
          body: '游戏层：<b>Optimus-67</b>（67 个 Minecraft 长任务）RedStone 0.30±0.16 超过 Optimus-3 的 0.29、Diamond 0.19 高于最强基线的 0.15，但 Gold 仅 0.06、Armor 仅 0.15；<b>StarDojo</b>（deepseek-v4-flash text-only）总体 22.0% 对 SPIKE 18.0%，Crafting 50.0% 最亮眼，但 Hard 任务 0.0%；<b>DST-Dojo</b> 平均生存 1.02 → 2.10 天（约 +106%），Day 3 存活 0% → 30%，死因仍以黑暗为主。仿真层：<b>LIBERO</b> 四个后端全部提升但幅度有限（+0.4 ~ +1.3pt，天花板效应）；<b>CALVIN ABC→D</b> 五步全链 π₀ +6.7pt、π₀.₅ +4.1pt；<b>RoboCasa365</b> 增益最大（+7.2 ~ +9.2pt）。真实机器人覆盖工业臂、桌面臂、双臂、四足、人形等 19+ 种 embodiment，重点在预检拒绝、SafetyGuard 拦截与急停延迟等安全验证。',
        },
        {
          heading: '论文证明了什么、没证明什么',
          body: '<b>证明了</b>：验证 + 恢复机制对多个 policy backend 都有系统级价值；同一套协议与适配链可以触达多种真实硬件；持久记忆在低物理噪声环境下有效。<b>没有证明</b>：VLA 模型本身变强了（权重没动，提升来自 Policy + Verification + Recovery + Runtime 的系统成功率）；大规模真机任务成功率统计（真机评测偏安全验证）；机制级别的消融归因（Verifier-only / Memory-only / Retry-only 的分解在当前版本不充分）；Verifier 自身的 false positive / false negative 未被系统量化；恢复的推理与时间成本也未充分讨论。这些边界论文自己写明了——读表时把 Architecture Design、Current Implementation、Experimental Validation、Future Planned Capability 分成四层看，不要混为一谈。',
        },
      ],
      modules: [
        {
          kind: 'module',
          id: '10.1',
          title: 'Benchmark Explorer：按协议读数字',
          desc: '六个基准各显示协议、指标、First/Final 定义与局限。注意 LIBERO 的天花板效应与 RoboCasa365 的大增益来自哪里。',
          componentId: 'benchmark-lab',
        },
        {
          kind: 'module',
          id: '10.2',
          title: 'Claim Checker：这句话论文支持吗？',
          desc: '七条常见结论，逐条判 Supported / Overclaimed / Wrong——判完看论文依据。这是读这篇论文最该带走的技能。',
          componentId: 'claim-checker',
        },
        {
          kind: 'module',
          id: '10.3',
          title: 'Grand Trail：一条 Session 环路 × 三层渐进验证（全机制总览）',
          desc: '按论文真实结构组织：整张图是一条 Session 生命周期环路——预检门 → 执行段双车道（Policy 实线 / Agent 工具虚线）→ 轨迹 τ → 验收台 V(G, S₀, S_T, τ, H) → 三轮记忆归档 → 检索回到出发线。同一条环路分别在 Game、Simulation、Real Robot 三种独立模式下运行：Simulation 首次保持 Game 的快速速度并失败，replan 后实质降速；人物回到起点后才切换冰面并再次预检，Real 全程减速，归档第三条经验并回到起点才结束。中央底座是贯穿全程的 OS 运行时与状态文件。',
          componentId: 'grand-trail',
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
