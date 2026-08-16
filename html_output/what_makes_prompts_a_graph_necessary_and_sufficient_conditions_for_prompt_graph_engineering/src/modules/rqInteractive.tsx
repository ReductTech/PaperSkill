import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

type Status = 'yes' | 'partial' | 'no';

const tests = ['T1', 'T2', 'T3', 'T4'];

const gCards = [
  {
    id: 'G1',
    term: 'Explicit Structure',
    test: 'T1',
    short: 'nodes + edges',
    detail: '运算单元必须作为节点出现，数据或控制依赖必须作为边出现，并且这种表示在不运行系统时也能显式存在。',
    fail: '如果不满足，通常只是单 prompt、不透明脚本或运行中出现的对话。',
  },
  {
    id: 'G2',
    term: 'Separation',
    test: 'T2',
    short: 'structure/content split',
    detail: '图结构可以在不重写节点 prompt 内容的情况下改变；节点内容也可以在不改变结构的情况下替换。',
    fail: '如果不满足，通常是结构和文本焊死的链，或由模型生成内容的 thought topology。',
  },
  {
    id: 'G3',
    term: 'Executable Semantics',
    test: 'T3',
    short: 'executable',
    detail: '运行时可以执行这张图，负责调度节点、路由输出、管理共享状态，并支持分支、并行或循环。',
    fail: '如果不满足，它更像架构图或文档插图，而不是可运行程序。',
  },
  {
    id: 'G4',
    term: 'First-class Artifact',
    test: 'T4',
    short: 'inspect/version/optimize',
    detail: '图不能只可以单次运行，而是需要能够重复运行，从而可以被检查、版本化、验证或优化。',
    fail: '如果不满足，剩下的只是一次运行痕迹，没有稳定对象可供检查或优化。',
  },
];

const timeline = [
  {
    name: 'dataflow',
    year: '1970s+',
    keys: ['nodes fire', 'edges carry data'],
    detail: '图先作为计算模型出现：依赖关系被显式写成边，节点在输入到达后触发执行。',
  },
  {
    name: 'single prompt',
    year: '2020',
    keys: ['one string', 'prompt craft'],
    detail: '早期 prompt engineering 主要优化一次模型调用内部的措辞、示例和输出格式。',
  },
  {
    name: 'chaining',
    year: '2021-22',
    keys: ['decompose', 'compose calls'],
    detail: 'AI Chains、PromptChainer、cascades 和 DSP/DSPy 这一线索把多次模型调用的组合结构显露出来。',
  },
  {
    name: 'thought topology',
    year: '2022-23',
    keys: ['CoT/ToT/GoT', 'model thoughts'],
    detail: '这时 graph 常指模型内部中间推理的形状；节点是 problem-solving 过程中生成的 thought。',
  },
  {
    name: 'engineering artifact',
    year: '2023+',
    keys: ['LangGraph', 'DSPy', 'Prompt Flow'],
    detail: '在框架和研究系统中，图变成工程师作者化、可执行、可优化的一等对象。',
  },
];

const shapes = [
  {
    name: 'string',
    label: 'single prompt',
    detail: '只有一个 prompt 字符串；适合简单任务，但没有可枚举结构。',
    nodes: [[70, 80]],
    edges: [] as Array<[number, number]>,
  },
  {
    name: 'chain',
    label: 'linear chain',
    detail: '一个调用喂给下一个调用；有顺序依赖，但表达分支和汇合较弱。',
    nodes: [[35, 90], [120, 90], [205, 90]],
    edges: [[0, 1], [1, 2]] as Array<[number, number]>,
  },
  {
    name: 'tree',
    label: 'branching tree',
    detail: '分支探索多个候选；更像搜索策略，不一定是工程师作者化的图对象。',
    nodes: [[120, 40], [70, 95], [170, 95], [45, 145], [95, 145], [145, 145], [195, 145]],
    edges: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]] as Array<[number, number]>,
  },
  {
    name: 'graph',
    label: 'prompt graph',
    detail: '图可以分支、并行、汇合、循环；这便是要定义的工程对象。',
    nodes: [[25, 105], [100, 60], [100, 150], [175, 105], [220, 105]],
    edges: [[0, 1], [0, 2], [1, 3], [2, 3], [3,4]] as Array<[number, number]>,
  },
];

const candidates = [
  {
    name: 'monolithic prompt',
    label: '单 prompt',
    status: ['no', 'no', 'no', 'no'] as Status[],
    verdict: 'Excluded',
    detail: '失败于 T1：只有一个 prompt，没有显式的图结构。prompt engineering 仍然有用，但它作用在节点内部。',
  },
  {
    name: 'architecture diagram',
    label: '架构图',
    status: ['yes', 'partial', 'no', 'partial'] as Status[],
    verdict: 'Excluded',
    detail: '图示可能画出了节点和边，但如果不能在运行时执行它，则不满足 T3。',
  },
  {
    name: 'ephemeral trace',
    label: '运行痕迹',
    status: ['partial', 'partial', 'yes', 'no'] as Status[],
    verdict: 'Excluded',
    detail: '运行结束后可能留下 trace，但如果没有能复现的图对象，就不满足 T4。',
  },
  {
    name: 'PGE candidate',
    label: 'PGE 候选',
    status: ['yes', 'yes', 'yes', 'yes'] as Status[],
    verdict: 'Included',
    detail: '四项测试都通过：显式图、结构/内容分离、可执行运行时、一等工程制品。',
  },
];

const boundaryNodes = [
  {
    id: 'prompt engineering',
    zone: 'prompt side',
    size: 'medium',
    closeness: 'medium',
    fail: '不满足 T1',
    detail: '经典 prompt engineering 是节点内部技术：措辞、示例、格式、prompt pattern。它能优化图中的节点，但本身不提供图结构。',
  },
  {
    id: 'thought topologies',
    zone: 'graph word',
    size: 'large',
    closeness: 'high',
    fail: '不满足 T2',
    detail: 'Chain/tree/graph-of-thoughts 共享“图状推理”，但节点是模型生成的 thought，不是工程师作者化的 prompt unit。',
  },
  {
    id: 'agent orchestration',
    zone: 'agent side',
    size: 'large',
    closeness: 'high',
    fail: '常不满足 T1/T4',
    detail: '自由多智能体对话的形式，通常没有预先可枚举的图，也没有稳定 artifact。',
  },
  {
    id: 'prompt programming',
    zone: 'inside edge',
    size: 'xlarge',
    closeness: 'inside edge',
    fail: '通过',
    detail: 'DSPy 这类 prompt programming 在组合多个 prompt-bearing units 时，是 PGE 的代码形态；它说明定义关心结构，而不是画布形式。',
  },
  {
    id: 'RAG pipelines',
    zone: 'pipeline side',
    size: 'medium',
    closeness: 'partial',
    fail: '取决于表示',
    detail: '写死在代码里的 retrieve-then-generate 链不满足 T1，因为图只存在于思想中而没有被显式提炼出来；如果只是框架对象，常常还缺 T2 或 T4；只有当流程被提升为显式、可操作的图时，adaptive RAG 才能成为 PGE。',
  },
  {
    id: 'workflow engines',
    zone: 'workflow side',
    size: 'medium',
    closeness: 'medium',
    fail: '缺少 prompt 节点语义',
    detail: '经典 workflow engines 看起来通过了全部四项测试，但节点不是 prompt-parameterized model invocation，因此缺少本文概念的 differentia。',
  },
];

const systems = [
  {
    name: 'LangGraph',
    status: ['yes', 'yes', 'yes', 'yes'] as Status[],
    verdict: 'Included',
    note: 'StateGraph 提供命名节点和边、条件路由、共享 typed state、循环和 checkpointing；文章认为它在 G3 executable semantics 上最强。',
  },
  {
    name: 'DSPy',
    status: ['yes', 'yes', 'yes', 'yes'] as Status[],
    verdict: 'Included',
    note: 'DSPy 的 program/module 结构可显式表出，signature 把结构和 prompt text 分离，optimizer 可以优化 program artifact；文章认为它在 G4 上最强。',
  },
  {
    name: 'Prompt Flow',
    status: ['yes', 'yes', 'yes', 'yes'] as Status[],
    verdict: 'Included',
    note: 'Prompt Flow 用 YAML 声明的提示节点和工具节点组成有向无环图（T1），prompt content 在模板文件中（T2），运行时执行并支持可视化和批量评估（T3, T4）；局限是原生循环较弱。',
  },
  {
    name: 'AutoGen',
    status: ['partial', 'yes', 'partial', 'partial'] as Status[],
    verdict: 'Partial',
    note: 'AutoGen 在 GraphFlow mode 中 reify flow，因此可纳入；在 emergent conversation mode 中呈现自由多智能体对话的形式，通常没有预先可枚举的图，因此被排除。',
  },
  {
    name: 'CrewAI',
    status: ['partial', 'yes', 'partial', 'partial'] as Status[],
    verdict: 'Partial',
    note: 'CrewAI 的 Flows 可以显式化 routing 和 state；但 crew-level delegation 仍有对话成分，所以文章给出 partial。',
  },
  {
    name: 'Claude Code subagents',
    status: ['no', 'partial', 'no', 'no'] as Status[],
    verdict: 'Excluded',
    note: 'Claude Code subagents 有工程师指定的 prompt units，但节点的连接方式由 orchestrator model 在运行时决定，不存在工程师预先指定好的图。',
  },
];

const axisViews = [
  {
    name: 'explicit / emergent',
    left: '显式结构',
    right: '对话结构',
    detail: '开放问题：系统能否记录一次对话流程，把它提升为显式图，再 replay、refine 或 version？',
    points: [
      { system: 'LangGraph', pos: 12, note: '作者显式定义 StateGraph，运行时按图执行。' },
      { system: 'DSPy', pos: 18, note: '程序结构可枚举，optimizer 消费这个 program artifact。' },
      { system: 'Prompt Flow', pos: 20, note: 'YAML flow 是最直接的显式 DAG 表达。' },
      { system: 'AutoGen', pos: 48, note: 'GraphFlow mode 将 flow reify，但 conversational mode 仍是涌现。' },
      { system: 'CrewAI', pos: 52, note: 'Flows 显式化 routing；crew-level delegation 仍有涌现成分。' },
      { system: 'Claude Code', pos: 88, note: 'subagent delegation topology 由运行时决定，主要留下 transcript。' },
    ],
  },
  {
    name: 'static / dynamic',
    left: '静态图',
    right: '动态图',
    detail: '开放问题：能否设计“静态骨架 + 动态区域”的图，并为运行时决定的部分形状建立有效的约束？',
    points: [
      { system: 'Prompt Flow', pos: 14, note: 'flow 在执行前固定为 DAG，原生循环较弱。' },
      { system: 'DSPy', pos: 28, note: 'program/module 结构通常先被写出，再由优化器调参。' },
      { system: 'LangGraph', pos: 36, note: '固定节点集上支持条件路由、循环和中断。' },
      { system: 'AutoGen', pos: 54, note: 'GraphFlow mode 更显式，conversation mode 更动态。' },
      { system: 'CrewAI', pos: 58, note: 'Flows 提供显式结构，crew-level 交互仍可能随运行变化。' },
      { system: 'Claude Code', pos: 84, note: '委派路径逐轮由 orchestrator 决定。' },
    ],
  },
  {
    name: 'prompt-grain / agent-grain',
    left: 'prompt 粒度',
    right: 'agent 粒度',
    detail: '开放问题：当节点可能是一次 prompt call，也可能是带目标、记忆和工具的 agent 时，图如何跨粒度组合？',
    points: [
      { system: 'DSPy', pos: 14, note: '以 signature/module 组合 prompt-bearing units。' },
      { system: 'Prompt Flow', pos: 22, note: '节点多为 prompt/tool nodes，粒度较细。' },
      { system: 'LangGraph', pos: 42, note: '节点可封装函数、模型调用或更厚的 runnable。' },
      { system: 'AutoGen', pos: 72, note: 'GraphFlow over agents，节点粒度更接近 agent。' },
      { system: 'CrewAI', pos: 78, note: '角色、目标、工具构成更厚的 agent/task 单元。' },
      { system: 'Claude Code', pos: 86, note: 'subagents 是带说明和职责的较厚单元。' },
    ],
  },
  {
    name: 'manual / automatic',
    left: '人工改进',
    right: '自动搜索',
    detail: '开放问题：自动优化依赖 G4，但随机且昂贵的节点会带来评估噪声、成本上限和 benchmark 过拟合风险。',
    points: [
      { system: 'LangGraph', pos: 24, note: '以显式图支持 tracing/evaluation，但结构通常由工程师设计。' },
      { system: 'Prompt Flow', pos: 30, note: '支持可视化和批量评估，优化更多依赖人工流程。' },
      { system: 'AutoGen', pos: 34, note: 'graph-reifying mode 主要服务编排，而非自动结构搜索。' },
      { system: 'CrewAI', pos: 36, note: 'Flows 可版本化，但自动优化不是其核心论点。' },
      { system: 'Claude Code', pos: 42, note: '运行时有模型决策，但不是对一等图 artifact 的优化。' },
      { system: 'DSPy', pos: 86, note: 'program artifact 是 optimizer 调整 prompts/demonstrations 的对象。' },
    ],
  },
];

const transversal = [
  {
    name: 'verification',
    detail: '哪些性质能静态检查？例如边上的类型兼容、带退出条件的循环终止、成本和延迟边界；哪些又必须判断文本语义？',
  },
  {
    name: 'context discipline',
    detail: '图分解同时也是 context 管理：每个节点看到经过整理的上下文窗口，而不是不断累积、容易丢失中部信息的长历史。',
  },
  {
    name: 'equivalence',
    detail: '两个 prompt graph 什么时候算同一个程序？哪些重构能在分布意义上保持行为？这是论文提出的等价性问题。',
  },
];

function statusClass(s: Status) {
  return s === 'yes' ? 'yes' : s === 'partial' ? 'partial' : 'no';
}

function statusText(s: Status) {
  return s === 'yes' ? 'yes' : s === 'partial' ? 'partial' : 'no';
}

function clamp(n: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, n));
}

function DetailBox({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <div className="rq-detail">
      <span>{kicker}</span>
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

function MiniGraph({ shape }: { shape: (typeof shapes)[number] }) {
  return (
    <svg className="rq-svg" viewBox="0 0 240 180" role="img" aria-label={shape.label}>
      {shape.edges.map(([a, b], i) => {
        const [x1, y1] = shape.nodes[a];
        const [x2, y2] = shape.nodes[b];
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="rq-edge active" />;
      })}
      {shape.name === 'graph' && (
        <path d="M 178 96 C 154 36, 122 26, 112 50" className="rq-edge rq-loop" />
      )}
      {shape.nodes.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="13" className={shape.name === 'string' ? 'rq-node solo' : 'rq-node'} />
          <text x={x} y={y + 4} textAnchor="middle">{i + 1}</text>
        </g>
      ))}
    </svg>
  );
}

function GrowthGraph({ progress }: { progress: number }) {
  const nodes = [
    { x: 28, y: 92, show: 0, label: '1' },
    { x: 76, y: 92, show: 0.65, label: '2' },
    { x: 126, y: 92, show: 1.15, label: '3' },
    { x: 112, y: 48, show: 1.85, label: '4' },
    { x: 112, y: 136, show: 1.85, label: '5' },
    { x: 166, y: 48, show: 2.35, label: '6' },
    { x: 166, y: 136, show: 2.35, label: '7' },
    { x: 214, y: 92, show: 2.75, label: '8' },
  ];
  const edges = [
    [0, 1, 0.5],
    [1, 2, 1.05],
    [1, 3, 1.7],
    [1, 4, 1.7],
    [3, 5, 2.25],
    [4, 6, 2.25],
    [2, 7, 2.55],
    [5, 7, 2.75],
    [6, 7, 2.75],
  ] as Array<[number, number, number]>;
  const opacity = (show: number) => clamp((progress - show) * 2.6);

  return (
    <svg className="rq-svg rq-growth" viewBox="0 0 240 180" role="img" aria-label="prompt form grows from string to graph">
      {edges.map(([a, b, show], i) => {
        const from = nodes[a];
        const to = nodes[b];
        return (
          <line
            key={i}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            className="rq-edge active"
            style={{ opacity: opacity(show) }}
          />
        );
      })}
      {nodes.map((n, i) => (
        <g key={i} style={{ opacity: opacity(n.show) }}>
          <circle cx={n.x} cy={n.y} r="13" className={i === 0 && progress < 0.65 ? 'rq-node solo' : 'rq-node'} />
          <text x={n.x} y={n.y + 4} textAnchor="middle">{n.label}</text>
        </g>
      ))}
    </svg>
  );
}

function StatusGrid({ row }: { row: { status: Status[] } }) {
  return (
    <div className="rq-status-grid">
      {tests.map((t, i) => (
        <div key={t} className={`rq-status ${statusClass(row.status[i])}`}>
          <span>{t}</span>
          <strong>{statusText(row.status[i])}</strong>
        </div>
      ))}
    </div>
  );
}

function SystemSketch({ system }: { system: (typeof systems)[number] }) {
  const name = system.name;
  const node = (x: number, y: number, label: string, cls = '') => (
    <g className={`rq-sketch-node ${cls}`} key={`${label}-${x}-${y}`}>
      <circle cx={x} cy={y} r="14" />
      <text x={x} y={y + 4} textAnchor="middle">{label}</text>
    </g>
  );
  const line = (x1: number, y1: number, x2: number, y2: number, cls = '') => (
    <line className={`rq-sketch-edge ${cls}`} x1={x1} y1={y1} x2={x2} y2={y2} markerEnd="url(#rq-arrow)" />
  );
  const label = (x: number, y: number, text: string, cls = '') => (
    <text className={`rq-sketch-label ${cls}`} x={x} y={y} textAnchor="middle">{text}</text>
  );

  let body: React.ReactNode = null;
  let caption = '';

  if (name === 'LangGraph') {
    caption = '显式 StateGraph：命名节点、条件边、共享状态和循环由运行时执行。';
    body = (
      <>
        {line(42, 84, 86, 52)}
        {line(42, 84, 86, 116)}
        {line(114, 52, 156, 84)}
        {line(114, 116, 156, 84)}
        <path className="rq-sketch-edge rq-sketch-loop" d="M 170 76 C 192 44, 122 32, 104 47" markerEnd="url(#rq-arrow)" />
        {node(42, 84, 'S', 'start')}
        {node(100, 52, 'A')}
        {node(100, 116, 'B')}
        {node(172, 84, 'C', 'yes')}
        {label(106, 154, 'StateGraph + conditional edges')}
      </>
    );
  } else if (name === 'DSPy') {
    caption = '代码中的 program/module 结构是一等对象，optimizer 直接消费并改进它。';
    body = (
      <>
        {line(42, 96, 94, 96)}
        {line(122, 96, 174, 96)}
        <path className="rq-sketch-edge optimize" d="M 186 72 C 154 28, 72 28, 46 72" markerEnd="url(#rq-arrow)" />
        {node(42, 96, 'M1')}
        {node(108, 96, 'M2')}
        {node(188, 96, 'Metric', 'yes')}
      </>
    );
  } else if (name === 'Prompt Flow') {
    caption = 'YAML 声明的 DAG 是最直观的正例：结构、模板文件、运行和评估都可见。';
    body = (
      <>
        {line(36, 84, 82, 50)}
        {line(36, 84, 82, 118)}
        {line(110, 50, 154, 84)}
        {line(110, 118, 154, 84)}
        {node(36, 84, 'YAML', 'start')}
        {node(96, 50, 'P')}
        {node(96, 118, 'Tool')}
        {node(170, 84, 'Eval', 'yes')}
        {label(110, 154, 'declared DAG, weak on cycles')}
      </>
    );
  } else if (name === 'AutoGen') {
    caption = 'GraphFlow 模式把 flow 显式化；自由对话模式仍是运行中涌现，所以是 partial。';
    body = (
      <>
        {line(34, 62, 86, 62, 'partial')}
        {line(114, 62, 166, 62, 'partial')}
        <path className="rq-sketch-edge emergent" d="M 40 126 C 82 98, 120 150, 166 118" />
        {node(34, 62, 'G', 'partial')}
        {node(100, 62, 'Agent', 'partial')}
        {node(180, 62, 'Agent', 'partial')}
        {node(40, 126, 'A')}
        {node(180, 118, 'B')}
        {label(104, 28, 'GraphFlow: explicit')}
        {label(110, 156, 'conversation: emergent')}
      </>
    );
  } else if (name === 'CrewAI') {
    caption = 'Flows 可以显式化 routing 和 state；crew-level delegation 仍带有涌现成分。';
    body = (
      <>
        {line(38, 56, 90, 56, 'partial')}
        {line(118, 56, 170, 56, 'partial')}
        <path className="rq-sketch-edge emergent" d="M 42 124 C 70 102, 106 104, 134 128 S 178 150, 196 118" />
        {node(38, 56, 'Flow', 'partial')}
        {node(104, 56, 'Task', 'partial')}
        {node(184, 56, 'State', 'partial')}
        {node(42, 124, 'Role')}
        {node(196, 118, 'Role')}
        {label(108, 24, 'Flows: explicit')}
        {label(116, 158, 'Crew: partly emergent')}
      </>
    );
  } else {
    caption = 'subagents 是作者化 prompt units，但委派拓扑由运行时决定，没有预先的图 artifact。';
    body = (
      <>
        <path className="rq-sketch-edge emergent" d="M 48 82 C 88 42, 132 44, 178 76" />
        <path className="rq-sketch-edge emergent" d="M 48 82 C 90 120, 130 130, 178 104" />
        {node(48, 82, 'Main', 'no')}
        {node(188, 76, 'Sub1')}
        {node(188, 116, 'Sub2')}
        <rect className="rq-sketch-missing" x="74" y="42" width="84" height="84" rx="8" />
        {label(116, 34, 'no authored flow graph', 'bad')}
        {label(118, 152, 'transcript after run')}
      </>
    );
  }

  return (
    <div className={`rq-system-evidence ${statusClass(system.verdict === 'Included' ? 'yes' : system.verdict === 'Partial' ? 'partial' : 'no')}`}>
      <svg className="rq-system-sketch" viewBox="0 0 224 172" role="img" aria-label={`${system.name} PGE sketch`}>
        <defs>
          <marker id="rq-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>
        {body}
      </svg>
      <div className="rq-system-caption">
        <span>{system.verdict}</span>
        <strong>{system.name}</strong>
        <p>{caption}</p>
      </div>
    </div>
  );
}

export const RqInteractive: React.FC<WidgetProps> = ({ moduleId }) => {
  if (moduleId === '1.1') return <RqTimeline />;
  if (moduleId === '1.2') return <RqShapes />;
  if (moduleId === '2.1') return <RqDefinition />;
  if (moduleId === '2.2') return <RqTest />;
  if (moduleId === '3.1') return <RqKnowledgeGraph />;
  if (moduleId === '3.2') return <RqBoundary />;
  if (moduleId === '4.1') return <RqSystemMatrix />;
  if (moduleId === '4.2') return <RqVerdicts />;
  if (moduleId === '5.1') return <RqAxes />;
  if (moduleId === '5.2') return <RqTransversal />;
  return <RqRecap />;
};

function RqTimeline() {
  const [position, setPosition] = useState(2);
  const active = Math.round(position);
  const item = timeline[active];
  const progress = (position / (timeline.length - 1)) * 100;
  return (
    <div className="rq-panel">
      <div className="rq-timeline-slider" style={{ '--rq-progress': `${progress}%` } as React.CSSProperties}>
        <input
          type="range"
          min="0"
          max={timeline.length - 1}
          step="0.01"
          value={position}
          aria-label="拖动查看 prompt graph 的概念谱系"
          onChange={(e) => setPosition(Number(e.target.value))}
        />
        <div className="rq-timeline-track" />
        <div className="rq-timeline-marks">
          {timeline.map((t, i) => (
            <button key={t.name} className={i === active ? 'is-active' : ''} onClick={() => setPosition(i)}>
              <span>{t.year}</span>
              <strong>{t.name}</strong>
            </button>
          ))}
        </div>
      </div>
      <div className="rq-era-card">
        <span>{item.year}</span>
        <strong>{item.name}</strong>
        <p>{item.detail}</p>
      </div>
      <div className="rq-key-row">
        {item.keys.map((k) => <span key={k}>{k}</span>)}
      </div>
    </div>
  );
}

function RqShapes() {
  const [progress, setProgress] = useState(3);
  const active = Math.round(progress);
  const shape = shapes[active];
  return (
    <div className="rq-panel rq-split">
      <div>
        <div className="rq-morph-control">
          <input
            type="range"
            min="0"
            max={shapes.length - 1}
            step="0.01"
            value={progress}
            aria-label="拖动查看 prompt 形态从 string 长成 graph"
            onChange={(e) => setProgress(Number(e.target.value))}
          />
          <div className="rq-morph-labels">
            {shapes.map((s, i) => (
              <button key={s.name} className={i === active ? 'is-active' : ''} onClick={() => setProgress(i)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <DetailBox kicker="形态变化" title={shape.label} body={shape.detail} />
      </div>
      <GrowthGraph progress={progress} />
    </div>
  );
}

function RqDefinition() {
  const [active, setActive] = useState(0);
  const card = gCards[active];
  return (
    <div className="rq-panel">
      <div className="rq-card-grid">
        {gCards.map((g, i) => (
          <button key={g.id} className={i === active ? 'is-active' : ''} onClick={() => setActive(i)}>
            <span>{g.id}</span>
            <strong>{g.term}</strong>
            <em>{g.short}</em>
          </button>
        ))}
      </div>
      <DetailBox kicker={`${card.id} -> ${card.test}`} title={card.term} body={`${card.detail} ${card.fail}`} />
    </div>
  );
}

function RqTest() {
  const [active, setActive] = useState(3);
  const row = candidates[active];
  return (
    <div className="rq-panel">
      <div className="rq-chip-row">
        {candidates.map((c, i) => (
          <button key={c.name} className={i === active ? 'is-active' : ''} onClick={() => setActive(i)}>{c.label}</button>
        ))}
      </div>
      <StatusGrid row={row} />
      <DetailBox kicker={row.verdict} title={row.name} body={row.detail} />
    </div>
  );
}

function RqKnowledgeGraph() {
  const [active, setActive] = useState(boundaryNodes[3]);
  const groups = [
    { title: 'prompt 侧', ids: ['prompt engineering', 'thought topologies'] },
    { title: 'PGE 核心', ids: ['prompt programming'] },
    { title: 'system / workflow 侧', ids: ['agent orchestration', 'RAG pipelines', 'workflow engines'] },
  ];
  return (
    <div className="rq-panel">
      <div className="rq-kg">
        {groups.map((group) => (
          <div className="rq-kg-col" key={group.title}>
            <div className="rq-kg-title">{group.title}</div>
            {group.ids.map((id) => {
              const n = boundaryNodes.find((node) => node.id === id)!;
              return (
                <button
                  key={n.id}
                  className={`rq-kg-node ${n.size} ${active.id === n.id ? 'is-active' : ''}`}
                  onClick={() => setActive(n)}
                >
                  <strong>{n.id}</strong>
                  <span>{n.fail}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <DetailBox kicker={active.closeness} title={active.id} body={active.detail} />
    </div>
  );
}

function RqBoundary() {
  const [active, setActive] = useState(boundaryNodes[0]);
  return (
    <div className="rq-panel">
      <div className="rq-boundary-list">
        {boundaryNodes.map((n) => (
          <button key={n.id} className={active.id === n.id ? 'is-active' : ''} onClick={() => setActive(n)}>
            <strong>{n.id}</strong>
            <span>{n.fail}</span>
          </button>
        ))}
      </div>
      <DetailBox kicker="RQ3 boundary" title={active.id} body={active.detail} />
    </div>
  );
}

function RqSystemMatrix() {
  const [active, setActive] = useState(systems[0]);
  return (
    <div className="rq-panel">
      <div className="rq-matrix">
        <div className="rq-matrix-head">system</div>
        {tests.map((t) => <div key={t} className="rq-matrix-head">{t}</div>)}
        <div className="rq-matrix-head">verdict</div>
        {systems.map((s) => (
          <React.Fragment key={s.name}>
            <button className={`rq-system-name ${active.name === s.name ? 'is-active' : ''}`} onClick={() => setActive(s)}>{s.name}</button>
            {s.status.map((st, i) => <div key={`${s.name}-${i}`} className={`rq-dot ${statusClass(st)}`}>{statusText(st)}</div>)}
            <div className="rq-verdict">{s.verdict}</div>
          </React.Fragment>
        ))}
      </div>
      <div className="rq-system-explain">
        <SystemSketch system={active} />
        <DetailBox kicker="系统检查矩阵" title={active.name} body={active.note} />
      </div>
    </div>
  );
}

function RqVerdicts() {
  const groups = useMemo(() => [
    { name: 'Included', items: systems.filter((s) => s.verdict === 'Included'), detail: '论文认为这些系统完整通过 T1-T4，是定义的清晰正例。' },
    { name: 'Partial', items: systems.filter((s) => s.verdict === 'Partial'), detail: '这些系统在某些 graph-reifying mode 中通过，但在 emergent mode 中只部分满足测试。' },
    { name: 'Excluded', items: systems.filter((s) => s.verdict === 'Excluded'), detail: '作者化单元可能存在，但 delegation flow 没有被显式化为可执行的一等图 artifact。' },
  ], []);
  const [active, setActive] = useState(groups[0]);
  return (
    <div className="rq-panel">
      <div className="rq-verdict-groups">
        {groups.map((g) => (
          <button key={g.name} className={active.name === g.name ? 'is-active' : ''} onClick={() => setActive(g)}>
            <span>{g.name}</span>
            <strong>{g.items.map((item) => item.name).join('、')}</strong>
            <em>{g.items.length} 个系统</em>
          </button>
        ))}
      </div>
      <DetailBox kicker={active.items.map((i) => i.name).join(' / ')} title={active.name} body={active.detail} />
    </div>
  );
}

function RqAxes() {
  const [axisIndex, setAxisIndex] = useState(0);
  const [cursor, setCursor] = useState(axisViews[0].points[0].pos);
  const axis = axisViews[axisIndex];
  const focused = axis.points.reduce((best, point) => (
    Math.abs(point.pos - cursor) < Math.abs(best.pos - cursor) ? point : best
  ), axis.points[0]);

  function switchAxis(index: number) {
    setAxisIndex(index);
    setCursor(axisViews[index].points[0].pos);
  }

  return (
    <div className="rq-panel">
      <div className="rq-axis-tabs">
        {axisViews.map((a, i) => (
          <button key={a.name} className={i === axisIndex ? 'is-active' : ''} onClick={() => switchAxis(i)}>
            <strong>{a.name}</strong>
          </button>
        ))}
      </div>
      <div className="rq-axis-stage">
        <div className="rq-axis-labels">
          <span>{axis.left}</span>
          <strong>{axis.name}</strong>
          <span>{axis.right}</span>
        </div>
        <div className="rq-axis-line">
          <div className="rq-axis-cursor" style={{ left: `${cursor}%` }} />
          {axis.points.map((point) => (
            <button
              key={point.system}
              className={`rq-axis-point ${focused.system === point.system ? 'is-active' : ''}`}
              style={{ left: `${point.pos}%` }}
              onClick={() => setCursor(point.pos)}
              aria-label={point.system}
            >
              <span>{point.system}</span>
            </button>
          ))}
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={cursor}
          aria-label="拖动游标查看该坐标轴上的系统"
          onChange={(e) => setCursor(Number(e.target.value))}
        />
      </div>
      <DetailBox kicker="研究坐标轴" title={focused.system} body={`${axis.detail} 当前系统位置：${focused.note}`} />
    </div>
  );
}

function RqTransversal() {
  const [active, setActive] = useState(transversal[0]);
  return (
    <div className="rq-panel">
      <div className="rq-card-grid three">
        {transversal.map((t) => (
          <button key={t.name} className={active.name === t.name ? 'is-active' : ''} onClick={() => setActive(t)}>
            <span>跨轴问题</span>
            <strong>{t.name}</strong>
            <em>开放问题</em>
          </button>
        ))}
      </div>
      <DetailBox kicker="横向问题" title={active.name} body={active.detail} />
    </div>
  );
}

function RqRecap() {
  const recaps = [
    ['RQ1', 'graph 从计算模型和 thought topology 迁移到工程 artifact。'],
    ['RQ2', 'PGE 的判断由 G1-G4 同时满足决定。'],
    ['RQ3', '六个相关概念分别缺少结构、作者化、prompt 节点或 artifact。'],
    ['RQ4', '用 T1-T4 进行真实系统分类的实践：Included、Partial、Excluded。'],
    ['RQ5', '新的定义带来的四条研究坐标轴和三个横向问题。'],
  ];
  const [active, setActive] = useState(0);
  return (
    <div className="rq-panel">
      <div className="rq-chip-row">
        {recaps.map(([rq], i) => (
          <button key={rq} className={i === active ? 'is-active' : ''} onClick={() => setActive(i)}>{rq}</button>
        ))}
      </div>
      <DetailBox kicker="全文贡献链" title={recaps[active][0]} body={recaps[active][1]} />
    </div>
  );
}
