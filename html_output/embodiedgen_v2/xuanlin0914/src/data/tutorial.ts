import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'EmbodiedGen V2: An Agentic, Simulation-Ready 3D World Engine for Embodied AI',
    titleZh: 'EmbodiedGen V2：面向具身 AI 的 Agentic、Simulation-Ready 3D World Engine',
    venue: 'Horizon Robotics · 2026',
    authors: 'EmbodiedGen Team',
    affiliation: 'Horizon Robotics',
    domain: 'Embodied AI · Generative Simulation',
    coreProblem: '如何自动生成既真实、又能训练和验证机器人策略的 3D 世界？',
    coreInsight: '核心贡献是一套统一的 Sim-Ready world representation：让 geometry、physics、affordance、task semantics、编辑历史与 simulator interface 始终处于同一个可验证状态。',
    keywords: ['Sim-Ready Contract', 'Quality Gate', 'Scene Graph', 'Vibe Coding', 'Closed Loop'],
  },
  hero: {
    oldMethod: { desc: '只优化 visual mesh，缺少尺度、collision、physics 或 task semantics，最终只能展示。', componentId: 'world-ch1' },
    newMethod: { desc: '以统一 world state 连接生成、验证、编辑、Cross-Sim deployment 与 policy learning。', componentId: 'world-ch1' },
  },
  chapters: [
    {
      kind: 'chapter', id: 'chap-1', title: '论文真正统一了什么？', badge: 'both', badgeLabel: '01 · Core contract',
      bridge: '首先理解全文主轴：对象层和场景层共同满足四项 Sim-Ready contract。',
      analogy: { title: '统一表示', text: '所有模块写入同一个可验证世界状态。', componentId: 'world-ch1' },
      modules: [{ kind: 'module', id: '1.1', title: '亲手关闭一项 contract，观察世界为什么被拒绝', desc: '点击四张卡片切换 ON/OFF；任何一项缺失都会让中心 world state 失去可执行性。', componentId: 'world-ch1' }],
      insight: '这套 contract 是资产、场景、编辑和训练之间的共同接口。',
      takeaways: [{ icon: 'G', title: 'Geometry', desc: '真实尺度与 mesh' },{ icon: 'P', title: 'Physics', desc: '可信接触' },{ icon: 'S', title: 'Semantics', desc: '任务与 affordance' }],
    },
    {
      kind: 'chapter', id: 'chap-2', title: '一件资产如何从生成结果变成机器人资产？', badge: 'inf', badgeLabel: '02 · Asset foundry',
      bridge: '资产管线通过 generate–verify–retry 生成并导出 Sim-Ready asset；独立的 Affordance autolabeling 再补充 part-level semantics 与 validated grasps。',
      analogy: { title: '资产铸造厂', text: '生成、检查、修复和封装形成闭环。', componentId: 'world-ch2' },
      modules: [
        { kind: 'module', id: '2.1', title: '运行 Quality Gate，并检查真实 3D 资产', desc: '观察自动重试、CoACD collision、物理参数恢复与 Cross-Format export；随后进入独立的 Affordance autolabeling。', componentId: 'world-ch2' },
        { kind: 'module', id: '2.2', title: '用部件语义理解 Affordance', desc: '切换 semantic label、grasp candidate 与 contact validation，理解 Affordance 如何从“物体部件”变成可执行接触。', componentId: 'world-ch2-affordance' },
      ],
      insight: '消融表明 Quality checker、mesh fixing 与 convex decomposition 解决不同类型的失败。',
      takeaways: [{ icon: 'Q', title: 'Quality Gate', desc: '失败自动重试' },{ icon: 'C', title: 'CoACD', desc: '稳定 collision' },{ icon: 'A', title: 'Affordance', desc: '可执行 grasp' }],
    },
    {
      kind: 'chapter', id: 'chap-3', title: '一句任务如何编译成可执行世界？', badge: 'both', badgeLabel: '03 · Task world',
      bridge: '用 broccoli 放入白色盘子的任务，串起 Task Description、Scene Graph、资产实例化与 BFS Placement。',
      analogy: { title: '任务编译器', text: '任务先决定对象和关系，solver 再决定 pose。', componentId: 'world-ch6' },
      modules: [{ kind: 'module', id: '3.1', title: '逐步生成 Scene Graph，并让 solver 完成物理布局', desc: '从自然语言任务开始，观察对象、关系和 6-DoF pose 如何逐步落到可执行场景中。', componentId: 'world-ch6' }],
      insight: '150 个任务世界覆盖 128 类对象，最终 environment acceptance 为 83.3%。',
      takeaways: [{ icon: 'T', title: 'Task', desc: '动作和目标' },{ icon: 'G', title: 'Scene Graph', desc: '角色与关系' },{ icon: 'B', title: 'BFS', desc: '稳定 pose' }],
    },
    {
      kind: 'chapter', id: 'chap-4', title: '如何扩展到可通行的多房间世界？', badge: 'both', badgeLabel: '04 · Large scene',
      bridge: 'Scene Router 决定范围，World Solver 求解拓扑和家具层级，Canonicalizer 统一坐标与 collision。',
      analogy: { title: '分层求解', text: '先保通行，再逐级增加实例。', componentId: 'world-ch7' },
      modules: [{ kind: 'module', id: '4.1', title: '控制 Complexity tier，并点击房间检查约束', desc: '在 Minimalist、Simple、Medium、Detail 之间切换，观察家具实例增加而导航路径保持连通。', componentId: 'world-ch7' }],
      insight: '复杂度可以增加，room topology、instance identity 与 navigable space 必须保持稳定。',
      takeaways: [{ icon: 'R', title: 'Router', desc: '选择范围' },{ icon: 'W', title: 'World Solver', desc: '求解布局' },{ icon: 'C', title: 'Canonicalizer', desc: '统一坐标' }],
    },
    {
      kind: 'chapter', id: 'chap-5', title: 'Vibe Coding 为什么不只是“用语言改图”？', badge: 'inf', badgeLabel: '05 · Stateful editing',
      bridge: '每次编辑是对 Sₜ=(Gₜ,Aₜ,Pₜ,Hₜ) 的 bounded ΔS；失败调用返回诊断，不污染 world state。',
      analogy: { title: '原子提交', text: '验证通过才 Commit。', componentId: 'world-ch8' },
      modules: [{ kind: 'module', id: '5.1', title: '连续修改厨房，并主动触发一次失败编辑', desc: '查看 Parse–Ground–Invoke–Commit；参数与约束检查发生在 Invoke 和 Commit 之前，歧义指令不会修改已提交状态。', componentId: 'world-ch8' }],
      insight: 'Stateful agent–skill harness 让自然语言编辑可追踪、可回退、可部署。',
      takeaways: [{ icon: 'P', title: 'Parse', desc: '解析意图' },{ icon: 'V', title: 'Validate', desc: '验证约束' },{ icon: 'C', title: 'Commit', desc: '原子写入' }],
    },
    {
      kind: 'chapter', id: 'chap-6', title: '这些世界真的有用吗？', badge: 'trn', badgeLabel: '06 · Evidence',
      bridge: '最终看三类证据：Cross-Sim portability、资产消融，以及论文汇总的下游研究中 generated worlds 对 policy learning 的提升。',
      analogy: { title: '证据面板', text: '从工程可用性走到机器人闭环。', componentId: 'world-ch10' },
      modules: [{ kind: 'module', id: '6.1', title: '切换 Cross-Sim、Asset ablation 与 World→Policy', desc: '比较 URDF/MJCF/USD 投影、关键消融结果和 N=1→50 的 OOD scaling，并查看仍会出现的失败类型。', componentId: 'world-ch10' }],
      insight: '生成场景让 simulation success 从 9.7% 提升到 79.8%，real-robot success 从 21.7% 提升到 75.0%。',
      takeaways: [{ icon: '6', title: 'Cross-Sim', desc: '六种 simulator' },{ icon: 'A', title: 'Ablation', desc: '组件均有作用' },{ icon: 'R', title: 'Robot', desc: '闭环提升' }],
    },
  ],
  bilibili: [],
};
