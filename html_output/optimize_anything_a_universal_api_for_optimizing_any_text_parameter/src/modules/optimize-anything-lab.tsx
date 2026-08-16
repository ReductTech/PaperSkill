import React, { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, lerp, observeCanvas, setupCanvas } from '../lib/canvasKit';

type Props = { chapterId: string; moduleId: string };
type Draw = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => void;

const C = {
  navy: '#10263f',
  navy2: '#173754',
  cyan: '#1ab8c6',
  cyanSoft: '#dff7f7',
  amber: '#f2a541',
  coral: '#e46f61',
  green: '#2b9b6f',
  ink: '#21324a',
  slate: '#68778f',
  line: '#d7deea',
  paper: '#ffffff',
  soft: '#f4f7fb',
};

function rounded(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
  stroke?: string
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = C.ink,
  size = 14,
  align: CanvasTextAlign = 'center',
  weight = 700
) {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px "PingFang SC", "Segoe UI", sans-serif';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function drawToken(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, text = 'x') {
  rounded(ctx, x - 18, y - 13, 36, 26, 13, color, '#ffffff');
  label(ctx, text, x, y, '#ffffff', 12);
}

function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 2
) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 7 * Math.cos(angle - Math.PI / 6), y2 - 7 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - 7 * Math.cos(angle + Math.PI / 6), y2 - 7 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function CanvasStage({
  width = 760,
  height = 270,
  draw,
  animate = false,
  ariaLabel,
}: {
  width?: number;
  height?: number;
  draw: Draw;
  animate?: boolean;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, width, height);
    canvas.classList.add('is-ready', 'oa-canvas');
    const startedAt = performance.now();
    let raf = 0;
    let running = false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const frame = (time: number) => {
      draw(ctx, width, height, Math.max(0, time - startedAt));
      if (running && animate && !reduced) raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (running) return;
      running = true;
      frame(performance.now());
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    frame(performance.now());
    return () => {
      stop();
      disconnect();
    };
  }, [animate, draw, height, width]);
  return <canvas ref={ref} role="img" aria-label={ariaLabel} />;
}

function drawHero(side: 'old' | 'new'): Draw {
  return (ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = side === 'old' ? '#fff8f6' : '#effafa';
    ctx.fillRect(0, 0, w, h);
    if (side === 'old') {
      const flows = [
        { x: 18, object: 'Prompt', optimizer: 'Prompt search' },
        { x: 124, object: 'Program', optimizer: 'Program search' },
        { x: 230, object: 'Agent', optimizer: 'Agent search' },
      ];
      const phase = Math.floor(t / 1700) % flows.length;
      label(ctx, '对象类型与优化流程绑定', w / 2, 18, C.navy, 13);
      flows.forEach((flow, i) => {
        const active = i === phase;
        const stroke = active ? C.coral : C.line;
        const fill = active ? '#fff0ed' : C.paper;
        rounded(ctx, flow.x - 3, 34, 98, 158, 13, active ? '#fff4f1' : '#fbfcfd', stroke);
        rounded(ctx, flow.x + 8, 44, 76, 29, 14, fill, stroke);
        label(ctx, flow.object, flow.x + 46, 59, active ? '#a84439' : C.ink, 11);
        arrow(ctx, flow.x + 46, 74, flow.x + 46, 91, stroke, active ? 3 : 1.5);
        rounded(ctx, flow.x + 4, 93, 84, 80, 9, C.paper, stroke);
        label(ctx, flow.optimizer, flow.x + 46, 108, active ? '#a84439' : C.ink, 10);
        label(ctx, 'representation', flow.x + 46, 132, C.slate, 8, 'center', 500);
        label(ctx, 'feedback', flow.x + 46, 148, C.slate, 8, 'center', 500);
        label(ctx, 'search workflow', flow.x + 46, 164, C.slate, 8, 'center', 500);
        if (active) {
          rounded(ctx, flow.x + 14, 178, 64, 8, 4, C.coral);
        }
      });
      label(ctx, '切换到 ' + flows[phase].object + '：整条流程需要重新适配', w / 2, 211, '#9c443b', 11);
      flows.forEach((_, i) => {
        ctx.beginPath();
        ctx.arc(w / 2 - 13 + i * 13, 232, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = i === phase ? C.coral : '#e7c5c0';
        ctx.fill();
      });
    } else {
      const artifacts = [
        { x: 12, text: 'Prompt' },
        { x: 92, text: 'CUDA' },
        { x: 172, text: 'Agent' },
        { x: 252, text: 'SVG' },
      ];
      const stage = Math.floor(t / 1600) % 4;
      const captions = [
        '① 不同对象统一表示为 Text Artifact x',
        '② 领域差异被封装进 Evaluator f(x,e)',
        '③ Score 排序，SI 解释“为什么”',
        '④ Reflection + Mutation 复用同一搜索闭环',
      ];
      label(ctx, '统一接口：表示统一，Evaluator 可替换，搜索闭环复用', w / 2, 17, C.navy, 10);
      artifacts.forEach((item) => {
        rounded(ctx, item.x, 34, 68, 25, 12, stage === 0 ? C.cyanSoft : C.paper, stage === 0 ? C.cyan : C.line);
        label(ctx, item.text, item.x + 34, 47, C.navy, 9);
        arrow(ctx, item.x + 34, 60, w / 2, 76, stage === 0 ? C.cyan : '#bad7db', 2);
      });
      const nodes = [
        { y: 77, text: 'Text Artifact  x' },
        { y: 117, text: 'Evaluator  f(x,e)' },
        { y: 157, text: 'Score  s  +  SI  ι' },
        { y: 197, text: 'Reflection  →  Mutation  →  x′' },
      ];
      nodes.forEach((node, i) => {
        const active = i === stage;
        rounded(ctx, 88, node.y, 164, 29, 10, active ? C.navy : C.paper, active ? C.amber : C.cyan);
        label(ctx, node.text, w / 2, node.y + 15, active ? '#ffffff' : C.navy, 10);
        if (i < nodes.length - 1) {
          arrow(ctx, w / 2, node.y + 30, w / 2, nodes[i + 1].y - 2, i === stage ? C.amber : C.cyan, 2);
        }
      });
      ctx.strokeStyle = stage === 3 ? C.amber : '#8bcbd0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(252, 212);
      ctx.lineTo(306, 212);
      ctx.lineTo(306, 92);
      ctx.lineTo(260, 92);
      ctx.stroke();
      arrow(ctx, 260, 92, 253, 92, stage === 3 ? C.amber : '#8bcbd0', 2);
      label(ctx, captions[stage], w / 2, 235, stage === 3 ? '#9c6414' : '#17656d', 10);
      captions.forEach((_, i) => {
        ctx.beginPath();
        ctx.arc(w / 2 - 19 + i * 13, 247, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = i === stage ? C.cyan : '#bedde0';
        ctx.fill();
      });
    }
  };
}

function HeroView({ side }: { side: 'old' | 'new' }) {
  const draw = useMemo(() => drawHero(side), [side]);
  return <CanvasStage width={340} height={255} draw={draw} animate ariaLabel={side === 'old' ? '不同对象分别绑定各自的表示、反馈和搜索流程' : '不同对象汇入统一 Text Artifact，并沿 Evaluator、Score 与 SI、Reflection、Mutation 闭环优化'} />;
}

const analogyLabels: Record<string, string[]> = {
  'chap-1': ['强方法', '专用割裂', '统一目标', '关键问题'],
  'chap-2': ['文本化', 'Evaluator'],
  'chap-3': ['用户输入', '搜索框架'],
  'chap-4': ['Candidate', 'Score + SI', 'Candidate′'],
  'chap-5': ['Score', 'SI', 'Mutation'],
  'chap-6': ['Candidate pool', 'Pareto'],
  'chap-7': ['Single', 'Multi', 'Generalization'],
  'chap-8': ['统一抽象', '反馈机制', '搜索策略'],
  'chap-9': ['跨域结果', '消融', '边界'],
};

function AnalogyView({ chapterId }: { chapterId: string }) {
  const labels = analogyLabels[chapterId] || ['候选', '评价'];
  const draw = useMemo<Draw>(() => (ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f4f8fb';
    ctx.fillRect(0, 0, w, h);
    if (chapterId === 'chap-1') {
      const stage = Math.floor(t / 1700) % 4;
      const methods = [
        { x: 6, name: 'AlphaEvolve', object: 'Program' },
        { x: 84, name: 'GEPA', object: 'Prompt' },
        { x: 162, name: '专用方法', object: 'Other' },
      ];
      methods.forEach((method, i) => {
        const active = stage === i;
        rounded(ctx, method.x, 10, 76, 30, 9, active ? '#e8f8f0' : C.paper, active ? C.green : C.line);
        label(ctx, method.name, method.x + 38, 22, C.navy, i === 0 ? 7 : 8);
        label(ctx, method.object, method.x + 38, 34, C.slate, 7, 'center', 500);
        arrow(ctx, method.x + 38, 41, method.x + 38, 59, stage === 2 ? C.coral : active ? C.green : '#c8d4dc', stage === 2 || active ? 2 : 1.2);
        rounded(ctx, method.x + 5, 61, 66, 22, 7, stage === 2 ? '#fff0ee' : '#f8fafc', stage === 2 ? C.coral : C.line);
        label(ctx, '专用闭环', method.x + 38, 72, stage === 2 ? '#98483e' : C.slate, 8);
      });
      if (stage === 3) {
        rounded(ctx, 33, 57, 178, 34, 11, C.navy, C.amber);
        label(ctx, '能否由一个优化器统一？', 122, 74, '#ffffff', 11);
      }
      const captions = ['程序优化已经很强', 'Prompt 优化已经很强', '强方法仍各自依赖专用闭环', '论文由此提出统一问题'];
      label(ctx, captions[stage], w / 2, 111, stage === 3 ? '#8b5715' : '#17656d', 9);
      return;
    }
    ctx.strokeStyle = '#83d8df';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(24, h / 2);
    ctx.lineTo(w - 24, h / 2);
    ctx.stroke();
    labels.forEach((txt, i) => {
      const x = 34 + (i * (w - 68)) / Math.max(1, labels.length - 1);
      rounded(ctx, x - 34, h / 2 - 18, 68, 36, 10, C.paper, C.cyan);
      label(ctx, txt, x, h / 2, C.navy, 9);
    });
    const p = (Math.sin(t / 900) + 1) / 2;
    drawToken(ctx, 28 + p * (w - 56), h - 20, C.amber, 'x');
  }, [labels]);
  return <CanvasStage width={244} height={130} draw={draw} animate ariaLabel={'本章概念流程：' + labels.join('、')} />;
}

const specialistMethods = [
  {
    name: 'AlphaEvolve',
    object: 'Program',
    loop: '专用程序优化闭环',
    detail: '代码生成、执行评价与演化围绕可运行程序组织。',
  },
  {
    name: 'GEPA',
    object: 'Prompt',
    loop: '专用 Prompt 优化闭环',
    detail: '候选 Prompt、模型运行与反馈改写围绕语言任务组织。',
  },
];

function SpecialistConflict() {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="oa-lab oa-conflict-diagram">
      <div className="oa-method-pair" aria-label="两个彼此专用的优化方法">
        {specialistMethods.map((method, i) => (
          <button key={method.name} className={'oa-method-column ' + (selected === i ? 'selected' : '')} onClick={() => setSelected(selected === i ? null : i)} aria-expanded={selected === i}>
            <span className="oa-method-object">{method.object}</span>
            <strong>{method.name}</strong>
            <span className="oa-method-arrow">↓</span>
            <span className="oa-method-loop">{method.loop}</span>
            <span className={'oa-method-detail ' + (selected === i ? 'visible' : '')}>{selected === i ? method.detail : '点击查看闭环'}</span>
          </button>
        ))}
        <div className="oa-method-separator" aria-hidden="true"><span>≠</span></div>
      </div>

      <div className="oa-conflict-thesis">
        <div><small>共同点</small><b>LLM 已经能够持续改进候选</b></div>
        <span className="oa-thesis-divider" />
        <div><small>缺口</small><b>对象一换，优化流程也要跟着换</b></div>
      </div>

      <div className="oa-question-arrow" aria-hidden="true">↓</div>
      <div className="oa-open-question">
        <small>论文的问题</small>
        <b>能否构造一个统一优化器，处理不同类型的文本参数？</b>
      </div>
    </div>
  );
}

const synthesisLoopStages = [
  { id: 'select', index: '01', eyebrow: '从搜索记忆出发', title: '选择候选', term: 'Candidate x', text: '从 Pareto Frontier 中选择值得继续探索的候选。' },
  { id: 'evaluate', index: '02', eyebrow: '真实运行', title: 'Evaluator', term: 'f(x,e)', text: '执行候选，得到可比较的实际表现。' },
  { id: 'feedback', index: '03', eyebrow: '评价结果', title: 'Score + SI', term: '分数 + 诊断', text: 'Score 告诉系统好不好，SI 解释问题在哪里。' },
  { id: 'propose', index: '04', eyebrow: 'LLM proposer', title: 'Reflection + Mutation', term: '理解 → 改写', text: '根据诊断形成判断，并提出有针对性的候选 x′。' },
  { id: 'verify', index: '05', eyebrow: 'Minibatch gate', title: '重新评价 x′', term: 'x′ on M', text: '先在抽取的小批任务或样例上测试；表现改善后才触发完整评价。' },
  { id: 'pareto', index: '06', eyebrow: '完整评价后更新', title: 'Pareto-based Update', term: '逐任务 / 逐指标', text: '把通过完整评价的新候选加入候选池，并保留未被全面超过的解。' },
];

function FullOptimizationLoop() {
  return (
    <div className="oa-lab oa-full-loop">
      <div className="oa-loop-orbit" aria-label="optimize_anything 完整优化闭环">
        <div className="oa-loop-center">
          <small>SEARCH MEMORY</small>
          <b>Pareto Frontier</b>
          <span>保存互补候选<br />避免过早收敛</span>
        </div>
        <div className="oa-loop-arrows" aria-hidden="true">
          <span className="a1">↘</span>
          <span className="a2">↓</span>
          <span className="a3">↙</span>
          <span className="a4">↖</span>
          <span className="a5">↑</span>
          <span className="a6">↗</span>
        </div>
        {synthesisLoopStages.map((stage) => (
          <section className={'oa-loop-node ' + stage.id} key={stage.id}>
            <header><span>{stage.index}</span><small>{stage.eyebrow}</small></header>
            <b>{stage.title}</b>
            <code>{stage.term}</code>
            <p>{stage.text}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

const synthesisRoles = [
  { index: '01', title: '统一接口', problem: '解决：任务形式彼此不同', mechanism: 'Text Artifact + Evaluator', result: '领域差异被封装，优化框架可以复用。' },
  { index: '02', title: '定向改进', problem: '解决：单一分数不知道错在哪里', mechanism: 'Score + SI → Reflection + Mutation', result: '反馈被转成具体、可验证的修改方向。' },
  { index: '03', title: '保持多样性', problem: '解决：只留平均分冠军会过早收敛', mechanism: 'Pareto-based Search', result: '互补候选得以保留，并继续参与搜索。' },
  { index: '04', title: '适配任务目标', problem: '解决：搜索对象与输出语义并不相同', mechanism: 'Single · Multi · Generalization', result: '同一接口覆盖专用搜索、跨任务搜索与泛化。' },
];

function SynthesisRoles() {
  return (
    <div className="oa-lab oa-synthesis-roles">
      <div className="oa-role-grid">
        {synthesisRoles.map((role) => (
          <section key={role.index}>
            <header><span>{role.index}</span><b>{role.title}</b></header>
            <small>{role.problem}</small>
            <code>{role.mechanism}</code>
            <p>{role.result}</p>
          </section>
        ))}
      </div>
      <div className="oa-role-conclusion">
        <span><b>接口</b>规定问题如何进入</span><i>→</i>
        <span><b>SI</b>决定下一步怎么改</span><i>→</i>
        <span><b>Pareto</b>决定保留哪些候选</span><i>→</i>
        <span><b>Mode</b>决定为谁优化、返回什么</span>
      </div>
    </div>
  );
}

const artifactExamples = [
  { domain: 'AIME', object: '系统提示词', representation: 'Prompt 本身就是可以直接修改的文本。' },
  { domain: 'ARC-AGI', object: '完整 Agent 代码与架构', representation: '代码、控制流程、辅助函数和 Prompt 共同组成候选解。' },
  { domain: '云调度', object: '调度与路由算法', representation: '策略可以写成可执行的算法代码。' },
  { domain: 'Circle Packing', object: '圆形装箱算法', representation: '候选解是生成布局并继续优化的程序。' },
  { domain: 'SVG / CAD', object: '图形与建模代码', representation: '几何结构和绘制指令都可以保存在文本代码中。' },
];

function ArtifactConvergence() {
  const [idx, setIdx] = useState(0);
  const item = artifactExamples[idx];
  return (
    <div className="oa-lab oa-artifact-convergence">
      <div className="oa-object-to-text">
        <div className="oa-object-list" role="tablist" aria-label="选择论文中的优化对象">
          {artifactExamples.map((example, i) => (
            <button key={example.domain} className={i === idx ? 'selected' : ''} onClick={() => setIdx(i)} role="tab" aria-selected={i === idx}>
              <small>{example.domain}</small><b>{example.object}</b>
            </button>
          ))}
        </div>
        <div className="oa-converge-arrow" aria-hidden="true"><span>→</span><small>统一表示</small></div>
        <div className="oa-artifact-target">
          <small>统一进入优化器的候选形式</small>
          <b>Text Artifact</b>
          <strong>文本候选解 x</strong>
          <p>{item.representation}</p>
        </div>
      </div>
      <div className="oa-convergence-caption"><b>{item.domain}</b><span>{item.object}</span><i>→</i><strong>可读取、可修改的文本候选解</strong></div>
    </div>
  );
}

const evaluatorExamples = [
  {
    domain: 'AIME',
    candidate: '系统 Prompt',
    evaluator: '让模型使用该 Prompt 解数学题',
    score: '答题准确率',
  },
  {
    domain: 'Circle Packing',
    candidate: '圆形装箱算法代码',
    evaluator: '运行算法并检查圆之间与边界约束',
    score: '所有圆的半径之和',
  },
  {
    domain: 'ARC-AGI',
    candidate: 'Agent 代码、架构与 Prompt',
    evaluator: '运行完整 Agent 处理 ARC-AGI 任务',
    score: '任务准确率',
  },
];

function EvaluatorBridge() {
  const [idx, setIdx] = useState(0);
  const item = evaluatorExamples[idx];
  return (
    <div className="oa-lab oa-evaluator-bridge">
      <div className="oa-evaluator-question"><span>文本只能说明“可以修改”</span><b>还需要定义：什么样的候选更好？</b></div>
      <div className="oa-case-tabs" role="tablist" aria-label="切换评估器示例">
        {evaluatorExamples.map((example, i) => (
          <button key={example.domain} className={i === idx ? 'selected' : ''} onClick={() => setIdx(i)} role="tab" aria-selected={i === idx}>{example.domain}</button>
        ))}
      </div>
      <div className="oa-evaluation-flow">
        <div><small>文本候选解 x</small><b>{item.candidate}</b></div>
        <span aria-hidden="true">→</span>
        <div className="evaluator"><small>Evaluator（评估器）</small><b>{item.evaluator}</b></div>
        <span aria-hidden="true">→</span>
        <div><small>Score（分数）</small><b>{item.score}</b></div>
      </div>
      <div className="feedback good">候选内容和评估方法都在变化，但“候选解 → 评估器 → 分数”的结构没有变化。</div>
    </div>
  );
}

function UnifiedProblem() {
  const [expanded, setExpanded] = useState(false);
  const symbols = [
    ['x', '当前正在优化的文本候选解'],
    ['e', '可选的任务或样例；没有时记为 ⊥'],
    ['s', '用于比较候选优劣的标量分数，越高越好'],
    ['ι', '可行动的 Side Information：文本、结构化数据或图像诊断'],
  ];
  return (
    <div className="oa-lab oa-unified-problem">
      <div className="oa-unified-pipeline">
        <div><small>输入</small><b>文本候选解 x</b></div>
        <span>→</span>
        <div className="evaluator"><small>领域评价</small><b>Evaluator f(x,e)</b></div>
        <span>→</span>
        <div><small>统一输出</small><b>Score s + 可选诊断信息 ι</b></div>
      </div>
      <p className="oa-unified-sentence">不同领域的问题由此被压缩成同一种形式：评价一个可修改的文本候选解，并继续寻找得分更高的候选。</p>
      <button className="oa-formula-toggle" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>{expanded ? '收起形式化定义' : '查看论文的形式化定义'}</button>
      {expanded ? (
        <div className="oa-inline-formula">
          <code>f(x, e) = ( s(x, e), ι(x, e) )</code>
          <div>{symbols.map(([symbol, desc]) => <span key={symbol}><b>{symbol}</b>{desc}</span>)}</div>
        </div>
      ) : null}
      <div className="oa-side-note"><b>Side Information（辅助信息）</b><span>就是这里的可选诊断信息 ι；提供时，它为后续修改候选提供依据。</span></div>
    </div>
  );
}

const apiExamples = [
  {
    domain: 'Circle Packing',
    artifact: '圆形装箱算法代码',
    seed: 'greedy_packing.py',
    objective: '在单位正方形内最大化 26 个圆的半径之和',
    evaluator: 'evaluate_packing',
    feedback: 'Score + 几何约束诊断',
  },
  {
    domain: 'AIME',
    artifact: '系统 Prompt',
    seed: 'system_prompt.txt',
    objective: '生成能提升 AIME 解题准确率的系统 Prompt',
    evaluator: 'evaluate_on_problems',
    feedback: 'Accuracy + 解题反馈',
  },
  {
    domain: 'ARC-AGI',
    artifact: 'Agent 代码与架构',
    seed: 'agent.py',
    objective: '构建能够解决 ARC-AGI 任务的 Agent',
    evaluator: 'run_agent',
    feedback: 'Accuracy + 执行轨迹',
  },
];

function ApiCallBuilder() {
  const [exampleIdx, setExampleIdx] = useState(0);
  const [startMode, setStartMode] = useState<'seed' | 'objective'>('seed');
  const item = apiExamples[exampleIdx];
  const callSnippet = startMode === 'seed'
    ? `from pathlib import Path\n\nseed_text = Path("${item.seed}").read_text(encoding="utf-8")\n\nresult = oa.optimize_anything(\n  seed_candidate=seed_text,\n  evaluator=${item.evaluator},\n)`
    : `result = oa.optimize_anything(\n  objective="${item.objective}",\n  evaluator=${item.evaluator},\n)`;
  return (
    <div className="oa-lab oa-api-call">
      <div className="oa-api-toolbar">
        <div className="oa-api-tabs" role="tablist" aria-label="切换 API 示例任务">
          {apiExamples.map((example, idx) => (
            <button key={example.domain} className={idx === exampleIdx ? 'selected' : ''} onClick={() => setExampleIdx(idx)} role="tab" aria-selected={idx === exampleIdx}>{example.domain}</button>
          ))}
        </div>
        <div className="oa-start-switch" role="tablist" aria-label="选择候选起点形式">
          <button className={startMode === 'seed' ? 'selected' : ''} onClick={() => setStartMode('seed')} role="tab" aria-selected={startMode === 'seed'}>已有 seed</button>
          <button className={startMode === 'objective' ? 'selected' : ''} onClick={() => setStartMode('objective')} role="tab" aria-selected={startMode === 'objective'}>只有 objective</button>
        </div>
      </div>

      <div className="oa-api-mapping">
        <section>
          <small>第二章：Text Artifact x</small>
          <b>{startMode === 'seed' ? item.artifact : '自然语言目标'}</b>
          <span>{startMode === 'seed' ? item.seed : item.objective}</span>
          <code>{startMode === 'seed' ? 'seed_candidate' : 'objective'}</code>
        </section>
        <i aria-hidden="true">+</i>
        <section>
          <small>第二章：Evaluator f(x,e)</small>
          <b>{item.evaluator}(...)</b>
          <span>{item.feedback}</span>
          <code>evaluator</code>
        </section>
        <i aria-hidden="true">→</i>
        <section className="oa-api-target">
          <small>统一调用</small>
          <b>optimize_anything</b>
          <span>返回优化结果</span>
        </section>
      </div>

      <pre className="oa-code">{callSnippet}</pre>
      <div className="feedback good">
        {startMode === 'seed'
          ? `候选内容变成“${item.artifact}”，接口传入 seed_candidate 与 evaluator 即可开始优化。`
          : 'Seedless mode：objective 取代 seed_candidate，由 LLM 从自然语言目标生成第一个候选。'}
      </div>
    </div>
  );
}

const optionalApiFields = [
  ['dataset', '训练任务或样本'],
  ['valset', '验证集'],
  ['background', '领域知识与约束'],
  ['config', '后端与运行设置'],
];

function ApiResponsibility() {
  const frameworkDuties = ['Prompt construction', 'Reflection', 'Candidate selection', 'Search strategy'];
  return (
    <div className="oa-lab oa-api-responsibility">
      <div className="oa-interface-map">
        <section className="oa-what-zone">
          <div className="oa-zone-heading">
            <small>USER · WHAT</small>
            <h5>用户把问题交给接口</h5>
          </div>
          <div className="oa-input-rail full">
            <span><code>seed_candidate / objective</code><b>候选起点或自然语言目标</b></span>
            <span><code>evaluator</code><b>Score + 可选 Side Information</b></span>
            {optionalApiFields.map(([field, note]) => <span key={field} className="optional"><code>{field}（可选）</code><b>{note}</b></span>)}
          </div>
        </section>

        <div className="oa-map-arrow" aria-hidden="true">↓</div>
        <div className="oa-contract-node">
          <small>统一入口</small>
          <code>optimize_anything(...)</code>
        </div>
        <div className="oa-map-arrow" aria-hidden="true">↓</div>

        <section className="oa-how-zone">
          <div className="oa-zone-heading">
            <small>FRAMEWORK · HOW</small>
            <h5>框架在接口之后组织搜索</h5>
          </div>
          <div className="oa-how-track">
            {frameworkDuties.map((duty, idx) => <span key={duty}><i>{String(idx + 1).padStart(2, '0')}</i><b>{duty}</b></span>)}
          </div>
        </section>
      </div>

      <div className="oa-contract-note">
        <b>可选参数补充上下文，不把搜索流程推回给用户。</b>
        <span>用户无需再编写 mutation prompt 或配置搜索拓扑；这些属于优化后端。</span>
      </div>
    </div>
  );
}

const coreIterationStages = [
  {
    term: 'Candidate x',
    label: '候选',
    desc: '当前待优化的 Text Artifact。它可以是一段 Prompt、代码、Agent 架构或策略。',
    example: '当前算法：greedy placement',
  },
  {
    term: 'Evaluator f(x,e)',
    label: '真实评估',
    desc: '运行候选，而不是让 LLM 凭印象自评。Evaluator 把领域目标转成可重复的评价过程。',
    example: '运行布局，并检查圆之间及边界约束',
  },
  {
    term: 'Score + SI',
    label: '评价结果',
    desc: 'Score 用于比较表现；Side Information 保留错误、轨迹、子指标等诊断线索。',
    example: 'Score：当前半径和；SI：局部拥挤位置与约束冲突',
  },
  {
    term: 'Reflection',
    label: '形成判断',
    desc: 'LLM proposer 结合候选与评价结果，解释当前失败机制并提出可行动的修改方向。',
    example: '判断：瓶颈来自圆心位置，需要改变布局优化方式',
  },
  {
    term: 'Mutation',
    label: '执行改写',
    desc: '把 Reflection 转换成对文本候选的具体修改，生成结构或策略不同的新版本。',
    example: '改写：引入新的位置更新与半径求解策略',
  },
  {
    term: 'Candidate x′',
    label: '新候选',
    desc: 'Mutation 的输出是一个新的 Text Artifact 版本；它会成为下一轮循环的输入。',
    example: '新算法候选 x′',
  },
];

function CoreIteration() {
  const [step, setStep] = useState(0);
  const current = coreIterationStages[step];
  return (
    <div className="oa-lab oa-core-iteration">
      <div className="oa-iteration-rail" role="tablist" aria-label="候选改写的六个阶段">
        {coreIterationStages.map((stage, idx) => (
          <React.Fragment key={stage.term}>
            <button
              className={idx === step ? 'current' : idx < step ? 'done' : ''}
              onClick={() => setStep(idx)}
              role="tab"
              aria-selected={idx === step}
            >
              <small>{String(idx + 1).padStart(2, '0')}</small>
              <b>{stage.label}</b>
              <code>{stage.term}</code>
            </button>
            {idx < coreIterationStages.length - 1 ? <span className="oa-iteration-arrow" aria-hidden="true">→</span> : null}
          </React.Fragment>
        ))}
      </div>

      <div className="oa-iteration-detail" aria-live="polite">
        <section>
          <small>STEP {String(step + 1).padStart(2, '0')}</small>
          <h5>{current.label} · {current.term}</h5>
          <p>{current.desc}</p>
        </section>
        <section className="oa-iteration-example">
          <small>Circle Packing · 教学示意</small>
          <code>{current.example}</code>
        </section>
      </div>

      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>← 上一步</button>
        <span className="step-label"><b>{step + 1}</b> / {coreIterationStages.length} · {current.term}</span>
        <button className="tiny" onClick={() => setStep((s) => Math.min(coreIterationStages.length - 1, s + 1))} disabled={step === coreIterationStages.length - 1}>下一步 →</button>
      </div>

      <div className="oa-iteration-return">
        <b>x′ ⟲ f(x′, e)</b>
        <span>进入下一轮</span>
      </div>
    </div>
  );
}

function AnimatedScore({ value }: { value: number }) {
  const [display, setDisplay] = useState<number>(value);
  const [animating, setAnimating] = useState(false);
  const previous = useRef(value);
  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || from === value) {
      setDisplay(value);
      setAnimating(false);
      return;
    }
    setAnimating(true);
    let frame = 0;
    const started = performance.now();
    const duration = 620;
    const tick = (now: number) => {
      const progress = clamp((now - started) / duration, 0, 1);
      const eased = 0.5 - Math.cos(Math.PI * progress) / 2;
      setDisplay(lerp(from, value, eased));
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      } else {
        setDisplay(value);
        setAnimating(false);
      }
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);
  return <span className={`oa-animated-score${animating ? ' changing' : ''}`} aria-live="polite">{animating ? display.toFixed(1) : value}</span>;
}

function ScoreVsSI() {
  const [round, setRound] = useState(0);
  const blind = [62, 60, 64, 63];
  const guided = [62, 70, 77, 82];
  const si = ['无：只见总分 62', 'compile error：向量宽度不匹配', 'Profiler：global memory 读取占 71%', '正确性通过；瓶颈转到 reduction'];
  return (
    <div className="oa-lab">
      <div className="compare-row oa-compare">
        <div className="oa-telemetry blind">
          <h5>Score-only</h5>
          <div className="oa-speed"><AnimatedScore value={blind[round]} /><small> / 100 · 示意分数</small></div>
          <div className="oa-changing-copy" key={`blind-${round}`}><p>诊断：只有总分</p><b>{round === 0 ? '起点相同' : '泛化猜测：再改写一次'}</b></div>
        </div>
        <div className="oa-telemetry guided">
          <h5>Score + Side Information</h5>
          <div className="oa-speed"><AnimatedScore value={guided[round]} /><small> / 100 · 示意分数</small></div>
          <div className="oa-changing-copy" key={`guided-${round}`}><p>诊断：{si[round]}</p><b>{round === 0 ? '起点相同' : '定向 mutation：修复当前瓶颈'}</b></div>
        </div>
      </div>
      <div className="oa-round-track" aria-label="选择教学示意轮次">
        {blind.map((_, idx) => <button key={idx} className={idx === round ? 'selected' : idx < round ? 'done' : ''} onClick={() => setRound(idx)} aria-label={`第 ${idx} 轮`}><span>{idx}</span></button>)}
      </div>
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => setRound(0)}>回到同一起点</button>
        <button className="tiny" onClick={() => setRound((r) => clamp(r + 1, 0, 3))} disabled={round === 3}>执行下一轮 evaluator</button>
      </div>
      <div className="feedback good">SI 可以是文本、结构化子指标、执行轨迹、Profiler 或图像。它提供方向性证据，但仍需 evaluator 验证下一次改动。</div>
    </div>
  );
}

type SIAblationMetric = {
  label: string;
  direction: string;
  withSI: number;
  scoreOnly: number;
  max: number;
  withLabel: string;
  scoreLabel: string;
};

const siEvidence: Array<{
  key: string;
  name: string;
  protocol: string;
  source: string;
  metrics: SIAblationMetric[];
  note: string;
}> = [
  {
    key: 'facility',
    name: 'Facility Support',
    protocol: 'Prompt optimization · 相同 evaluator',
    source: 'Figure 9',
    metrics: [
      { label: '达到 validation 0.80 所需评估', direction: '越低越好', withSI: 100, scoreOnly: 600, max: 600, withLabel: '≤100 rollouts', scoreLabel: '≈600 rollouts' },
      { label: '最终 test score', direction: '越高越好', withSI: 86.32, scoreOnly: 82.5, max: 100, withLabel: '86.32', scoreLabel: '82.5' },
    ],
    note: 'SI 既缩短达到同一 validation 阈值所需的评估次数，也提高最终 test 表现。',
  },
  {
    key: 'circle',
    name: 'Circle Packing',
    protocol: 'Single-task · Best score (% of best)',
    source: 'Table 4',
    metrics: [
      { label: 'Normalized performance', direction: '越高越好', withSI: 100, scoreOnly: 93.96, max: 100, withLabel: '100%', scoreLabel: '93.96%' },
    ],
    note: 'Score-only 仍然能够搜索，但缺少几何诊断时没有达到论文记录的最佳结果。',
  },
  {
    key: 'kernel-st',
    name: 'KernelBench · ST',
    protocol: 'Single-task · correctness 通过后计速',
    source: 'Table 4',
    metrics: [
      { label: 'Kernels ≥ 1.1× (f₁.₁)', direction: '越高越好', withSI: 32.3, scoreOnly: 12.9, max: 40, withLabel: '32.3%', scoreLabel: '12.9%' },
      { label: 'Mean speedup', direction: '越高越好', withSI: 4.11, scoreOnly: 1.15, max: 4.5, withLabel: '4.11×', scoreLabel: '1.15×' },
    ],
    note: '在独立优化每个 Kernel 时，SI 同时提高超过 1.1× 的比例和平均加速比。',
  },
  {
    key: 'kernel-mt',
    name: 'KernelBench · MT',
    protocol: 'Multi-task · shared Pareto frontier',
    source: 'Table 4',
    metrics: [
      { label: 'Kernels ≥ 1.1× (f₁.₁)', direction: '越高越好', withSI: 40, scoreOnly: 0, max: 40, withLabel: '40%', scoreLabel: '0%' },
      { label: 'Mean speedup', direction: '越高越好', withSI: 1.15, scoreOnly: 1.03, max: 1.2, withLabel: '1.15×', scoreLabel: '1.03×' },
    ],
    note: 'MT 与 ST 的统计协议不同；这里保持论文原始口径，不合并成统一平均提升。',
  },
];

function SIAblation() {
  const [idx, setIdx] = useState(0);
  const item = siEvidence[idx];
  return (
    <div className="oa-lab">
      <div className="chip-row oa-ablation-tabs">
        {siEvidence.map((e, i) => <button key={e.key} className={'chip ' + (i === idx ? 'selected' : '')} onClick={() => setIdx(i)} aria-pressed={i === idx}>{e.name}</button>)}
      </div>
      <div className="oa-evidence-head"><span>{item.name}</span><b>{item.protocol}</b><small>{item.source}</small></div>
      <div className="oa-ablation-chart" key={item.key}>
        <div className="oa-ablation-legend"><span className="with-si">With SI</span><span className="score-only">Score-only</span><i>每个指标使用独立刻度</i></div>
        {item.metrics.map((metric) => (
          <section className="oa-ablation-metric" key={`${item.key}-${metric.label}`}>
            <header><b>{metric.label}</b><span>{metric.direction}</span></header>
            <div className="oa-ablation-series with-si">
              <label>With SI</label>
              <div><i style={{ width: `${Math.max(0, metric.withSI / metric.max * 100)}%` }} /></div>
              <strong>{metric.withLabel}</strong>
            </div>
            <div className="oa-ablation-series score-only">
              <label>Score-only</label>
              <div><i style={{ width: `${Math.max(0, metric.scoreOnly / metric.max * 100)}%` }} /></div>
              <strong>{metric.scoreLabel}</strong>
            </div>
          </section>
        ))}
      </div>
      <div className="feedback good">{item.note}</div>
    </div>
  );
}

const paretoCandidates = [
  { id: 'A', x: 92, y: 58, note: 'Task A 专长' },
  { id: 'B', x: 72, y: 86, note: 'Task B 专长' },
  { id: 'C', x: 82, y: 78, note: '均衡且未被支配' },
  { id: 'D', x: 62, y: 62, note: '被 C 全面支配' },
  { id: 'E', x: 75, y: 67, note: '被 C 全面支配' },
];

function candidateAverage(candidate: typeof paretoCandidates[number]) {
  return (candidate.x + candidate.y) / 2;
}

function dominates(a: typeof paretoCandidates[number], b: typeof paretoCandidates[number]) {
  return a.x >= b.x && a.y >= b.y && (a.x > b.x || a.y > b.y);
}

function paretoPlotPosition(score: number) {
  return 10 + (score - 50) / 50 * 80;
}

function AverageCollapse() {
  const [view, setView] = useState<'average' | 'dimensions'>('average');
  const candidates = paretoCandidates.slice(0, 3);
  const champion = candidates.reduce((best, candidate) => candidateAverage(candidate) > candidateAverage(best) ? candidate : best);
  const bestA = Math.max(...candidates.map((candidate) => candidate.x));
  const bestB = Math.max(...candidates.map((candidate) => candidate.y));
  return (
    <div className="oa-lab oa-average-collapse">
      <div className="chip-row">
        <button className={'chip ' + (view === 'average' ? 'selected' : '')} onClick={() => setView('average')} aria-pressed={view === 'average'}>压成一个平均分</button>
        <button className={'chip ' + (view === 'dimensions' ? 'selected' : '')} onClick={() => setView('dimensions')} aria-pressed={view === 'dimensions'}>展开逐任务表现</button>
      </div>
      <div className={'oa-average-cards ' + view}>
        {candidates.map((candidate) => {
          const isChampion = candidate.id === champion.id;
          const localBest = candidate.x === bestA ? 'Task A 最强' : candidate.y === bestB ? 'Task B 最强' : '均衡候选';
          return (
            <section className={'oa-average-card ' + (view === 'average' && !isChampion ? 'discarded' : '') + (view === 'average' && isChampion ? ' champion' : '')} key={candidate.id}>
              <header>
                <b>Candidate {candidate.id}</b>
                <span>{view === 'average' ? (isChampion ? '平均分冠军' : '被淘汰') : localBest}</span>
              </header>
              <div className={'oa-score-row ' + (view === 'dimensions' && candidate.x === bestA ? 'local-best' : '')}>
                <label>Task A</label><div><i style={{ width: candidate.x + '%' }} /></div><strong>{candidate.x}</strong>
              </div>
              <div className={'oa-score-row ' + (view === 'dimensions' && candidate.y === bestB ? 'local-best' : '')}>
                <label>Task B</label><div><i style={{ width: candidate.y + '%' }} /></div><strong>{candidate.y}</strong>
              </div>
              <footer><span>平均分</span><strong>{candidateAverage(candidate).toFixed(1)}</strong></footer>
            </section>
          );
        })}
      </div>
      <div className={'feedback ' + (view === 'average' ? 'bad' : 'good')} key={view}>
        {view === 'average'
          ? '只看平均分会留下 C，却同时丢掉 Task A 得分最高的 A 和 Task B 得分最高的 B。'
          : '展开维度后可以看到：A、B、C 代表三种互不替代的优势。下一步需要一条比“只留冠军”更谨慎的删除规则。'}
      </div>
    </div>
  );
}

function ParetoFrontier() {
  const [mode, setMode] = useState<'inspect' | 'frontier'>('inspect');
  const [selected, setSelected] = useState('E');
  const current = paretoCandidates.find((candidate) => candidate.id === selected) || paretoCandidates[4];
  const dominators = paretoCandidates.filter((candidate) => candidate.id !== current.id && dominates(candidate, current));
  const frontierCandidates = paretoCandidates.filter((candidate) => !paretoCandidates.some((other) => other.id !== candidate.id && dominates(other, candidate)));
  const frontier = frontierCandidates.map((candidate) => candidate.id);
  const sortedFrontier = [...frontierCandidates].sort((a, b) => a.x - b.x);
  return (
    <div className="oa-lab">
      <div className="chip-row">
        <button className={'chip ' + (mode === 'inspect' ? 'selected' : '')} onClick={() => setMode('inspect')} aria-pressed={mode === 'inspect'}>逐点检查支配关系</button>
        <button className={'chip ' + (mode === 'frontier' ? 'selected' : '')} onClick={() => setMode('frontier')} aria-pressed={mode === 'frontier'}>显示 Pareto Frontier</button>
      </div>
      <div className="oa-dominance-rule"><span>每个维度都不差</span><b>＋</b><span>至少一个维度更好</span><em>→ 支配</em></div>
      <div className="oa-scatter" aria-label="两任务候选示意散点图">
        <span className="axis-y">Task B ↑</span><span className="axis-x">Task A →</span>
        <svg className="oa-pareto-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs><marker id="oa-dominance-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>
          {mode === 'inspect' ? dominators.map((candidate) => <line key={candidate.id} x1={paretoPlotPosition(candidate.x)} y1={100 - paretoPlotPosition(candidate.y)} x2={paretoPlotPosition(current.x)} y2={100 - paretoPlotPosition(current.y)} markerEnd="url(#oa-dominance-arrow)" />) : null}
          {mode === 'frontier' ? <polyline points={sortedFrontier.map((candidate) => `${paretoPlotPosition(candidate.x)},${100 - paretoPlotPosition(candidate.y)}`).join(' ')} /> : null}
        </svg>
        {paretoCandidates.map((c) => (
          <button
            key={c.id}
            className={'oa-point '
              + (mode === 'frontier' ? (frontier.includes(c.id) ? 'keep' : 'drop') : 'inspect')
              + (mode === 'inspect' && dominators.some((candidate) => candidate.id === c.id) ? ' dominator' : '')
              + (mode === 'inspect' && selected === c.id ? ' selected' : '')}
            style={{ left: paretoPlotPosition(c.x) + '%', bottom: paretoPlotPosition(c.y) + '%' }}
            onClick={() => { setSelected(c.id); setMode('inspect'); }}
            aria-label={'候选 ' + c.id + '，Task A ' + c.x + '，Task B ' + c.y}
          >{c.id}</button>
        ))}
      </div>
      <div className="oa-pareto-legend"><span className="frontier">Frontier / 支配者</span>{mode === 'inspect' ? <span className="selected">当前检查</span> : null}<span className="dominated">被支配</span></div>
      <div className="oa-candidate-readout" key={`${mode}-${selected}`}>
        {mode === 'inspect' ? (
          <>
            <div><small>当前检查</small><b>Candidate {current.id}</b></div>
            <span>Task A {current.x} · Task B {current.y} · 平均 {candidateAverage(current).toFixed(1)}</span>
            <em className={dominators.length > 0 ? 'is-dominated' : ''}>{dominators.length > 0 ? `${dominators.map((candidate) => candidate.id).join('、')} 全面超过它` : '没有候选全面超过它'}</em>
          </>
        ) : (
          <>
            <div><small>保留下来</small><b>Frontier</b></div>
            <span>{frontier.join('、')} · 三种互补候选，会继续作为不同父本参与搜索。</span>
            <em>D、E 被删除</em>
          </>
        )}
      </div>
      <div className="oa-pareto-next" aria-label="Pareto 候选进入下一轮搜索的过程">
        <section>
          <small>01 · CANDIDATE SELECTION</small>
          <b>按 Frontier frequency 加权采样</b>
          <span>候选覆盖的 Pareto 目标越多，被选为 Mutation 父本的概率越高。</span>
        </section>
        <i aria-hidden="true">→</i>
        <section>
          <small>02 · MINIBATCH REFLECTION</small>
          <b>聚焦 2–3 个任务或样例</b>
          <span>运行候选并收集 Score + SI，让 Proposer 针对这批反馈生成 x′。</span>
        </section>
        <i aria-hidden="true">→</i>
        <section>
          <small>03 · GATE &amp; UPDATE</small>
          <b>小批改善才完整评估</b>
          <span>x′ 在 minibatch 上改善后，才在完整数据上评价并加入候选池。</span>
        </section>
      </div>
      {mode === 'inspect' ? (
        <div className="feedback good">
          {dominators.length > 0 ? `Candidate ${current.id} 被支配，因此可以从候选池中删除。` : `Candidate ${current.id} 未被支配，即使它不是平均分冠军，也仍有继续探索的价值。`}
        </div>
      ) : null}
    </div>
  );
}

const modes = {
  single: {
    title: 'Single-task Search',
    short: 'Single-task',
    summary: '1 个问题 → 1 个专用解',
    dataset: 'None',
    datasetHint: '不提供任务集合',
    valset: 'None',
    valsetHint: '不需要验证集',
    search: '直接最大化 s(x)',
    searchHint: '候选本身就是问题的答案',
    output: '1 个 task-specific Artifact',
    example: 'Circle Packing',
  },
  multi: {
    title: 'Multi-task Search',
    short: 'Multi-task',
    summary: 'N 个相关问题 → N 个专用解',
    dataset: 'related tasks',
    datasetHint: '提供相关任务集合',
    valset: 'None',
    valsetHint: '没有 held-out 验证集',
    search: '共享 Pareto Frontier',
    searchHint: '跨任务复用父本与优化模式',
    output: 'N 个 task-specialized Artifacts',
    example: 'CUDA Kernels',
  },
  gen: {
    title: 'Generalization',
    short: 'Generalization',
    summary: 'train + val → 1 个全局解',
    dataset: 'train examples',
    datasetHint: '训练样例提供反馈',
    valset: 'held-out examples',
    valsetHint: '验证未见样例表现',
    search: '训练反馈 + held-out 验证',
    searchHint: '学习跨样例复用的 Artifact',
    output: '1 个 globally generalized Artifact',
    example: 'ARC-AGI · AIME',
  },
};

type ModeKey = keyof typeof modes;

function ModeInputVisual({ mode }: { mode: ModeKey }) {
  if (mode === 'single') return <div className="oa-mode-input-viz single"><span>x</span><small>无 dataset；候选本身就是解</small></div>;
  if (mode === 'multi') return <div className="oa-mode-input-viz multi"><div><span>e₁</span><span>e₂</span><span>e₃</span></div><small>相关任务 dataset</small></div>;
  return <div className="oa-mode-input-viz gen"><div className="train"><span>t₁</span><span>t₂</span><span>t₃</span></div><b>＋</b><div className="val"><span>v</span></div><small>train / held-out val</small></div>;
}

function ModeSearchVisual({ mode }: { mode: ModeKey }) {
  if (mode === 'single') return <div className="oa-mode-search-viz single"><span>x₀</span><span>x₁</span><strong>x*</strong></div>;
  if (mode === 'multi') return <div className="oa-mode-search-viz multi"><div><span>x₁</span><span>x₂</span><span>x₃</span></div><strong>Shared Pareto Frontier</strong></div>;
  return <div className="oa-mode-search-viz gen"><span>train SI</span><strong>x</strong><span>val ✓</span></div>;
}

function ModeOutputVisual({ mode }: { mode: ModeKey }) {
  const artifacts = mode === 'multi' ? ['x₁*', 'x₂*', 'x₃*'] : ['x*'];
  return <div className={'oa-mode-output-viz ' + mode}>{artifacts.map((artifact) => <span key={artifact}>{artifact}</span>)}</div>;
}

function ThreeModes() {
  const [mode, setMode] = useState<ModeKey>('single');
  const d = modes[mode];
  return (
    <div className="oa-lab oa-three-modes">
      <div className="oa-mode-control">
        <div className="oa-mode-control-head"><b>选择优化模式</b><span>点击下方按钮切换，观察输入、搜索与输出如何变化</span></div>
        <div className="oa-mode-selector">
          {(Object.keys(modes) as ModeKey[]).map((key, idx) => <button type="button" key={key} className={key === mode ? 'selected' : ''} onClick={() => setMode(key)} aria-pressed={key === mode}><span>0{idx + 1}</span><b>{modes[key].short}</b><small>{modes[key].summary}</small></button>)}
        </div>
      </div>
      <div className="oa-common-api"><small>所有模式共享</small><code>seed / objective</code><b>＋</b><code>evaluator</code><em>统一 API</em></div>
      <div className="oa-mode-config" key={'config-' + mode}>
        <section className={d.dataset === 'None' ? 'empty' : ''}><small>dataset</small><b>{d.dataset}</b><span>{d.datasetHint}</span></section>
        <section className={d.valset === 'None' ? 'empty' : ''}><small>valset</small><b>{d.valset}</b><span>{d.valsetHint}</span></section>
        <i>决定</i>
        <section className="active-mode"><small>激活模式</small><b>{d.title}</b><span>论文 §3.2</span></section>
      </div>
      <div className="oa-mode-journey" key={'journey-' + mode}>
        <section><header><span>01</span><b>任务输入</b></header><ModeInputVisual mode={mode} /><p>{mode === 'single' ? '直接评价候选' : mode === 'multi' ? '每个元素是一个独立问题' : 'train 用于搜索，val 用于验证'}</p></section>
        <i>→</i>
        <section><header><span>02</span><b>搜索期间</b></header><ModeSearchVisual mode={mode} /><p><strong>{d.search}</strong><br />{d.searchHint}</p></section>
        <i>→</i>
        <section><header><span>03</span><b>最终输出</b></header><ModeOutputVisual mode={mode} /><p><strong>{d.output}</strong><br />示例：{d.example}</p></section>
      </div>
      <div className="feedback good"><b>{d.title}：</b>{mode === 'single' ? '一个问题独立搜索，输出一个专用解。' : mode === 'multi' ? '搜索经验跨相关任务共享，但每个任务仍独立选择自己的最终候选。' : '训练集提供改写反馈，验证集衡量同一个 Artifact 对未见样例的泛化。'}</div>
    </div>
  );
}

const transferPatterns = [
  { label: 'Memory coalescing', short: '连续访存' },
  { label: 'Vectorized access', short: '向量化读取' },
  { label: 'Warp-level reduction', short: 'Warp 归约' },
];

const kernelScaling = [
  { metric: 'f₁.₀', hint: '≥ 1.0×', st: 60, mt10: 90, mt20: 90 },
  { metric: 'f₁.₁', hint: '≥ 1.1×', st: 40, mt10: 40, mt20: 50 },
  { metric: 'f₁.₂', hint: '≥ 1.2×', st: 20, mt10: 20, mt20: 20 },
];

const circleTransfer = [
  { label: 'Single-task', value: 2.6360, delta: '基准' },
  { label: 'MT7', value: 2.6313, delta: '-0.0047' },
  { label: 'MT11', value: 2.5973, delta: '-0.0387' },
];

function TransferBoundary() {
  const [related, setRelated] = useState(true);
  const [step, setStep] = useState(0);
  const pattern = transferPatterns[step];
  return (
    <div className="oa-lab oa-transfer-boundary">
      <div className="chip-row">
        <button className={'chip ' + (related ? 'selected' : '')} onClick={() => { setRelated(true); setStep(0); }} aria-pressed={related}>相关任务 · CUDA</button>
        <button className={'chip ' + (!related ? 'selected' : '')} onClick={() => { setRelated(false); setStep(0); }} aria-pressed={!related}>不相关任务 · Circle Packing</button>
      </div>
      {related ? (
        <>
          <div className="oa-evidence-head"><span>KernelBench · 相关任务</span><b>10 个问题上的 multi-task scaling</b><small>Table 6</small></div>
          <div className="oa-pattern-tabs">{transferPatterns.map((item, idx) => <button key={item.label} className={idx === step ? 'selected' : ''} onClick={() => setStep(idx)}>{item.label}</button>)}</div>
          <div className="oa-transfer-path" key={pattern.label}>
            <section><small>Kernel A</small><b>发现模式</b><span>{pattern.short}</span></section>
            <i><span>{pattern.label}</span>→</i>
            <section className="frontier"><small>Shared Frontier</small><b>保存可复用父本</b><span>不直接复制最终答案</span></section>
            <i>→</i>
            <section><small>Kernel B</small><b>适配后重新评价</b><span>correctness + speed</span></section>
          </div>
          <div className="oa-kernel-chart">
            <div className="oa-chart-legend"><b>每个阈值分别比较</b><em>达到速度阈值的 Kernel 比例</em></div>
            {kernelScaling.map((row) => <section key={row.metric}><header><b>{row.metric}</b><small>{row.hint}</small></header><div className="oa-kernel-bars">{([{ key: 'st', label: 'ST', value: row.st }, { key: 'mt10', label: 'MT10', value: row.mt10 }, { key: 'mt20', label: 'MT20', value: row.mt20 }] as const).map((series) => <div className={series.key} key={series.key}><label>{series.label}</label><span><i style={{ width: series.value + '%' }} /></span><strong>{series.value}%</strong></div>)}</div></section>)}
          </div>
        </>
      ) : (
        <>
          <div className="oa-evidence-head"><span>Circle Packing · 不同 N</span><b>联合搜索引入噪声</b><small>Table 5</small></div>
          <div className="oa-circle-scale">
            <div className="oa-scale-axis"><span>2.55</span><span>2.60</span><span>2.64</span></div>
            {circleTransfer.map((result) => <section key={result.label}><b>{result.label}</b><div><i style={{ left: `${(result.value - 2.55) / 0.09 * 100}%` }} /></div><strong>{result.value.toFixed(4)}</strong><em>{result.delta}</em></section>)}
            <p>局部放大区间：2.55–2.64</p>
          </div>
        </>
      )}
      <div className={'feedback ' + (related ? 'good' : 'bad')}>
        {related ? 'Table 6 显示相关任务可以受益，但提升并非在所有阈值都相同：MT20 在 f₁.₁ 达到 50%，ST 为 40%；f₁.₂ 三者均为 20%。迁移后的候选仍必须重新通过目标 Kernel 的 evaluator。' : 'Table 5 的反例表明：不同 N 的 Circle Packing 缺乏稳定的共享结构。任务从 7 个增加到 11 个时，结果由 2.6313 进一步降到 2.5973。'}
      </div>
    </div>
  );
}

const experimentResults = [
  {
    scope: '主实验 · Generalization',
    domain: 'Coding Agent Skills',
    metric: '98.3% / 100%',
    label: 'Haiku / Sonnet 任务通过率',
    comparison: 'Haiku：79.3% → 98.3% · Sonnet：94.8% → 100% · 任务解决时间减少 47%',
    meaning: '优化出的 Skill 能迁移到另一模型，支持“文本工作流也能作为可泛化候选”。',
  },
  {
    scope: '主实验 · Generalization',
    domain: 'Cloud Scheduling',
    metric: '40.2%',
    label: 'CloudCast 相对 Dijkstra 节省成本',
    comparison: 'Can’t Be Late：节省 7.8% · ADRS 综合分：本文 96.6 > OpenEvolve 92.9',
    meaning: '统一接口不仅能改 Prompt，也能发现有竞争力的调度与路由算法。',
  },
  {
    scope: '主实验 · Generalization',
    domain: 'ARC-AGI Agent',
    metric: '32.5 → 89.5%',
    label: 'Gemini 3 Flash 测试准确率',
    comparison: '验证集 93.5% · 未见测试集 89.5%（较初始 +57 个百分点）',
    meaning: '完整 Agent 的代码、架构与控制流可以被联合优化，而不只是调一个 Prompt。',
  },
  {
    scope: '主实验 · Generalization',
    domain: 'AIME Prompt',
    metric: '46.67 → 60.00%',
    label: 'GPT-4.1-mini · AIME 2025',
    comparison: '本文 60.00% > 专用优化器 MIPROv2 51.33% · 仅修改 system prompt',
    meaning: '在 Prompt 优化这一原生场景中，统一 API 没有牺牲性能，并超过专用基线 MIPROv2。',
  },
  {
    scope: '主实验 · Multi-task',
    domain: 'CUDA Kernels',
    metric: '87%',
    label: '31 个 Kernel 匹配或超过 PyTorch',
    comparison: '相对 PyTorch：48% 的 Kernel ≥ 1.1× · 25% ≥ 1.2× · V100 32GB',
    meaning: '共享搜索能够在多种算子上生成正确且具有加速效果的专用 Kernel。',
  },
  {
    scope: '主实验 · Single-task',
    domain: 'Circle Packing',
    metric: '2.63598',
    label: 'n=26 · sum of radii',
    comparison: '本文：2.63598 / 63 次评价 > OpenEvolve：2.6307 / 200 次评价（同为 GPT-5.1 proposer）',
    meaning: '在匹配 proposer 的对照中，用更少评价次数超过代码演化基线。',
  },
  {
    scope: '正文扩展实验 · Multi-task',
    domain: 'Image Generation',
    metric: '2.2×',
    label: 'Pelican SVG · VLM score',
    comparison: 'zero-shot 0.330 → 本文 0.726（2.2×）· 5/5 人类评估者在所有目标上偏好优化结果',
    meaning: '图像可以通过 SVG / CAD 文本代理与视觉 SI 进入同一优化框架。',
  },
  {
    scope: '附录初步展示 · Single-task',
    domain: 'Numerical Blackbox',
    metric: '7 / 10',
    label: '选定任务中，optimize_anything 胜过 Optuna',
    comparison: '对比 Optuna：选定 10 题 @ 2,000 次/题，本文 7 胜 · 完整 56 题 @ 8,000 次/题，40 平 / 7 胜 / 9 负',
    meaning: '在 Optuna 低预算表现困难的选定任务上，定制 solver code 展现出优势；完整基准中则以持平为主。',
  },
  {
    scope: '附录初步展示 · Seedless',
    domain: '3D Modeling',
    metric: '从零生成',
    label: '可识别的 3D Unicorn',
    comparison: 'zero-shot 初始结果 → 迭代后的可识别 3D Unicorn · 仅提供自然语言 objective，无 seed code',
    meaning: '展示 Seedless mode 可以从自然语言目标自举候选，并通过视觉 SI 持续改进。',
  },
];

function ExperimentResultsOverview() {
  return (
    <div className="oa-lab oa-experiment-overview">
      <div className="oa-experiment-grid">
        {experimentResults.map((result, index) => (
          <section className={result.scope.startsWith('主实验') ? '' : 'additional'} key={result.domain}>
            <header><span>{String(index + 1).padStart(2, '0')}</span><div><small>{result.scope}</small><b>{result.domain}</b></div></header>
            <div className="oa-result-number"><strong>{result.metric}</strong><small>{result.label}</small></div>
            <code>{result.comparison}</code>
            <p><b>说明</b>{result.meaning}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

const siAblationResults = [
  { task: 'Facility Support', metric: '达到 val 0.80 / 最终 test', withSi: '≤100 / 86.32', scoreOnly: '≈600 / 82.50' },
  { task: 'Circle Packing', metric: '最佳结果归一化', withSi: '100%', scoreOnly: '93.96%' },
  { task: 'KernelBench · ST', metric: '≥1.1× Kernel / mean speedup', withSi: '32.3% / 4.11×', scoreOnly: '12.9% / 1.15×' },
  { task: 'KernelBench · MT', metric: '≥1.1× Kernel / mean speedup', withSi: '40% / 1.15×', scoreOnly: '0% / 1.03×' },
];

const multiTaskScaling = [
  { threshold: 'f₁.₀ · ≥1.0×', st: '60%', mt10: '90%', mt20: '90%' },
  { threshold: 'f₁.₁ · ≥1.1×', st: '40%', mt10: '40%', mt20: '50%' },
  { threshold: 'f₁.₂ · ≥1.2×', st: '20%', mt10: '20%', mt20: '20%' },
];

function MechanismEvidenceOverview() {
  return (
    <div className="oa-lab oa-mechanism-overview">
      <section className="oa-evidence-panel si">
        <header><div><small>TABLE 4 · FIGURE 9</small><b>Side Information 消融</b></div><em>3 个领域</em></header>
        <div className="oa-evidence-table oa-si-table">
          <div className="head"><span>任务 / 指标</span><span>With SI</span><span>Score-only</span></div>
          {siAblationResults.map((row) => <div key={row.task}><span><b>{row.task}</b><small>{row.metric}</small></span><strong>{row.withSi}</strong><em>{row.scoreOnly}</em></div>)}
        </div>
        <p><b>数据说明：</b>SI 不只提高最终分数，也显著减少达到同一验证水平所需的评价次数；这种收益同时出现在 Prompt、数值算法和 CUDA 代码中。</p>
      </section>
      <section className="oa-evidence-panel mt">
        <header><div><small>TABLE 6 · 结果均统计原 10 题</small><b>加入更多相关任务是否有帮助？</b></div><em>3 种设置</em></header>
        <div className="oa-evidence-table oa-mt-table">
          <div className="head"><span>速度阈值</span><span>ST</span><span>MT10</span><span>MT20</span></div>
          {multiTaskScaling.map((row) => <div key={row.threshold}><b>{row.threshold}</b><span>{row.st}</span><strong>{row.mt10}</strong><em>{row.mt20}</em></div>)}
        </div>
        <div className="oa-scaling-key">
          <span><b>ST</b><small>10 题各自优化</small></span>
          <span><b>MT10</b><small>这 10 题联合</small></span>
          <span><b>MT20</b><small>再加入 10 题联合</small></span>
        </div>
        <div className="oa-random-check">
          <small>TABLE 7 · 另一组随机抽取的 20 题</small>
          <b>同一批 20 题：ST 各自优化 → MT20 联合优化 · f₁.₀ 50% → 90% · f₁.₁ 25% → 40% · f₁.₂ 15% = 15%</b>
        </div>
        <p><b>数据说明：</b>在随机抽取的 20 个任务上，Multi-task 将达到 PyTorch 基线的比例从 50% 提高到 90%，将至少加速 10% 的比例从 25% 提高到 40%；但至少加速 20% 的比例仍为 15%。这说明共享搜索扩大了有效优化的覆盖面，但不会在所有速度阈值上都带来提升。</p>
      </section>
    </div>
  );
}

const boundaryEvidence = [
  {
    title: 'Multi-task 依赖任务相关性',
    metric: '2.6360 > 2.6313 > 2.5973',
    detail: 'Circle Packing · Single-task > MT7 > MT11',
    meaning: '联合搜索并不天然更强。不相关任务会相互干扰，Multi-task 的迁移收益只在任务之间存在可复用结构时成立。',
  },
  {
    title: 'Proposer 存在质量 / 成本权衡',
    metric: '2.512 / $0.50  vs  2.636 / $6',
    detail: 'Circle Packing · GPT-5-nano vs GPT-5.1',
    meaning: '便宜模型仍能改进候选，但最终结果较低；更强的 proposer 得到更好结果，同时成本也更高。实际总成本还会受到 Evaluator 运行开销影响。',
  },
  {
    title: '不同任务的实验总成本相差很大',
    metric: '约 $1  ｜  $144.70',
    detail: 'Numerical Blackbox  ｜  ARC-AGI',
    meaning: '论文各实验的总成本并不相同：统一 API 统一的是优化接口，而不是为所有任务提供固定的搜索预算。',
  },
  {
    title: 'Figure 8 只证明所选任务上的优势',
    metric: 'MT 表现最好的 10 题',
    detail: '先筛选 MT 强项任务，再以相同单题预算重跑 ST',
    meaning: '曲线说明 MT 在这 10 题上收敛更快，但不能代表全部 KernelBench 的平均效果；更一般的判断应结合 Table 7 的 20 个随机任务。',
  },
];

function ExperimentalBoundaries() {
  return (
    <div className="oa-lab oa-boundary-overview">
      <div className="oa-boundary-list">
        {boundaryEvidence.map((item, index) => (
          <section key={item.title}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <div><b>{item.title}</b><strong>{item.metric}</strong><small>{item.detail}</small></div>
            <p>{item.meaning}</p>
          </section>
        ))}
      </div>
      <div className="oa-boundary-verdict">
        <b><small>文本表示限制</small>候选必须能够表示成文本</b>
        <i>＋</i>
        <b><small>SI 设计边界</small>有效诊断仍然需要领域知识</b>
      </div>
    </div>
  );
}

const cases = [
  {
    name: 'Coding Agent Skills',
    icon: '🛠️',
    fields: {
      Artifact: 'Skill Markdown / workflow instructions',
      Evaluator: '任务通过率 + duration',
      SI: '失败轨迹、工具调用与任务反馈',
      Mode: 'Generalization',
      Evolution: '改写步骤、工具说明与异常处理',
      Result: 'Bleve：Haiku 79.3→98.3；Sonnet 94.8→100；duration -47%',
    },
  },
  {
    name: 'Cloud Scheduling',
    icon: '☁️',
    fields: {
      Artifact: 'Python scheduling policy',
      Evaluator: 'Cloud simulator',
      SI: 'cost、lateness、execution trace',
      Mode: 'Generalization · distinct tasks',
      Evolution: '更改资源分配与延迟权衡策略',
      Result: 'CloudCast cost savings 40.2%；Can’t Be Late 7.8%',
    },
  },
  {
    name: 'ARC-AGI',
    icon: '🧩',
    fields: {
      Artifact: 'Agent code、architecture、control flow、helpers、prompts',
      Evaluator: 'ARC task success',
      SI: '执行轨迹、错误样例与中间输出',
      Mode: 'Generalization',
      Evolution: '10-line seed → 300+ lines、4-stage agent',
      Result: 'Gemini 3 Flash：test 32.5→89.5',
    },
  },
  {
    name: 'AIME Prompt',
    icon: '∑',
    fields: {
      Artifact: 'System prompt',
      Evaluator: '数学题 accuracy',
      SI: '题目、答案与推理反馈',
      Mode: 'Generalization',
      Evolution: 'train AIME 2022–2024，val 后选择全局 prompt',
      Result: '2025 test：GPT-4.1-mini 46.67→60；MIPROv2 51.33',
    },
  },
  {
    name: 'CUDA Kernels',
    icon: '⚡',
    fields: {
      Artifact: 'CUDA code',
      Evaluator: 'correctness → latency / speedup',
      SI: 'compiler errors、tests、Profiler',
      Mode: 'Single-task + Multi-task',
      Evolution: 'vectorization、warp reduction、shared-memory tiling',
      Result: '31 ops：87% match/beat PyTorch；48% ≥10%；25% ≥20%',
    },
  },
  {
    name: 'Circle Packing',
    icon: '◉',
    fields: {
      Artifact: 'Packing algorithm code',
      Evaluator: '几何合法性 + radii sum',
      SI: 'overlap、boundary violation、布局诊断',
      Mode: 'Single-task · n=26',
      Evolution: 'heuristic → LP → SLP → bilevel L-BFGS / CMA-ES',
      Result: '2.63598 @ 63 evaluations；matched OpenEvolve 2.4583@100、2.6307@200',
    },
  },
];

function SixCases() {
  const [idx, setIdx] = useState(0);
  const item = cases[idx];
  return (
    <div className="oa-lab">
      <div className="chip-row">
        {cases.map((c, i) => <button key={c.name} className={'chip ' + (i === idx ? 'selected' : '')} onClick={() => setIdx(i)} aria-pressed={i === idx}>{c.icon} {c.name}</button>)}
      </div>
      <div className="oa-case-title"><span>{item.icon}</span><div><small>CASE {idx + 1} / 6</small><h5>{item.name}</h5></div></div>
      <div className="oa-six-grid">
        {Object.entries(item.fields).map(([key, value], i) => <div className={'oa-six-cell c' + i} key={key}><small>{key}</small><b>{value}</b></div>)}
      </div>
      <div className="feedback good">阅读顺序固定：Artifact → Evaluator → SI → Mode → Evolution → Result。换领域时，只替换这六栏的内容。</div>
    </div>
  );
}

const fastThresholds = [
  { label: 'Fastₚ(1.0)', st: 80, mt: 100 },
  { label: 'Fastₚ(1.1)', st: 70, mt: 100 },
  { label: 'Fastₚ(1.2)', st: 60, mt: 80 },
];

function TransferScaling() {
  const [idx, setIdx] = useState(1);
  const item = fastThresholds[idx];
  return (
    <div className="oa-lab">
      <div className="chip-row">
        {fastThresholds.map((v, i) => <button key={v.label} className={'chip ' + (i === idx ? 'selected' : '')} onClick={() => setIdx(i)} aria-pressed={i === idx}>{v.label}</button>)}
      </div>
      <div className="oa-bars">
        <div><span>Single-task</span><i style={{ width: item.st + '%' }}>{item.st}%</i></div>
        <div><span>Multi-task</span><i className="mt" style={{ width: item.mt + '%' }}>{item.mt}%</i></div>
      </div>
      <div className="oa-scaling-grid">
        <div><small>共享模式</small><b>Vectorized access · Warp reduction · Shared-memory tiling</b></div>
        <div><small>MT10 → MT20</small><b>Tables 6–7：中等阈值通常受益；严格 1.2× 不保证单调</b></div>
        <div><small>读图范围</small><b>上方比例来自 Figure 8 选取的 MT 最佳 10 题，不代表全部 KernelBench</b></div>
      </div>
      <div className="feedback good">阈值越严格，达到目标的比例越低；共享 frontier 提供跨题经验，但每个候选仍需在目标任务上重新评估。</div>
    </div>
  );
}

const trajectory = [
  { name: 'Seed heuristic', score: '≈ 0.98', desc: '简单贪心布局，提供可执行起点。' },
  { name: 'LP refiner', score: '≈ 1.93', desc: 'Refiner 分支引入线性规划，打开新策略家族。' },
  { name: 'Code absorbs LP', score: '≈ 2.61', desc: '代码候选吸收 refiner 思路并反超，出现 leapfrogging。' },
  { name: 'SLP', score: '≈ 2.63', desc: '顺序线性规划继续逼近局部高质量布局。' },
  { name: 'Bilevel L-BFGS + CMA-ES', score: '2.63598', desc: '局部优化与全局探索并存，在 63 次 evaluations 达到最终结果。' },
];

function Trajectory() {
  const [step, setStep] = useState(0);
  return (
    <div className="oa-lab">
      <div className="oa-timeline">
        {trajectory.map((m, i) => <button key={m.name} className={(i <= step ? 'done ' : '') + (i === step ? 'active' : '')} onClick={() => setStep(i)} aria-label={'查看里程碑 ' + m.name}><span>{i + 1}</span><b>{m.name}</b><em>{m.score}</em></button>)}
      </div>
      <div className="oa-trajectory-card">
        <small>MILESTONE {step + 1} / {trajectory.length}</small>
        <h5>{trajectory[step].name} · {trajectory[step].score}</h5>
        <p>{trajectory[step].desc}</p>
      </div>
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => setStep((s) => clamp(s - 1, 0, trajectory.length - 1))}>← 上一步</button>
        <button className="tiny" onClick={() => setStep((s) => clamp(s + 1, 0, trajectory.length - 1))}>下一次跃迁 →</button>
      </div>
      <div className="feedback good">Pareto diversity 同时保留 greedy、LP、SLP、L-BFGS 与 CMA-ES 分支，使暂时落后的模块仍可能在后来反超。</div>
    </div>
  );
}

const limitTabs = [
  { key: 'proposer', name: 'Proposer 性能 / 成本' },
  { key: 'total', name: '实验总成本' },
  { key: 'limits', name: '五类方法边界' },
];

function CostLimits() {
  const [tab, setTab] = useState('proposer');
  return (
    <div className="oa-lab">
      <div className="chip-row">
        {limitTabs.map((t) => <button key={t.key} className={'chip ' + (tab === t.key ? 'selected' : '')} onClick={() => setTab(t.key)} aria-pressed={tab === t.key}>{t.name}</button>)}
      </div>
      {tab === 'proposer' && (
        <div className="oa-cost-grid">
          <div><small>AIME · GPT-5.1</small><b>46.67 → 60</b><em>$6.44</em></div>
          <div><small>AIME · nano</small><b>46.67 → 50</b><em>$3.71</em></div>
          <div><small>Circle · GPT-5.1</small><b>0.98 → 2.636</b><em>$6</em></div>
          <div><small>Circle · nano</small><b>0.98 → 2.512</b><em>$0.50</em></div>
        </div>
      )}
      {tab === 'total' && (
        <div className="oa-cost-cloud">
          {[['Blackbox', '$1'], ['Circle', '$6'], ['Kernel · 31', '$140'], ['AIME', '$6.44'], ['SVG', '$18'], ['Skills', '$50'], ['Cloud', '$52.42'], ['ARC', '$144.70']].map(([n, v]) => <span key={n}><small>{n}</small><b>{v}</b></span>)}
        </div>
      )}
      {tab === 'limits' && (
        <div className="oa-limit-list">
          <div><b>1 · Proposer 能力</b><span>弱模型可能无法提出跨策略家族的有效 mutation。</span></div>
          <div><b>2 · Evaluator cost</b><span>编译、仿真与长轨迹执行可能主导搜索成本。</span></div>
          <div><b>3 · 文本代理限制</b><span>非文本对象必须经代理表示，信息可能在转换中丢失。</span></div>
          <div><b>4 · 任务相关性</b><span>不相关任务共享 frontier 会产生负迁移。</span></div>
          <div><b>5 · SI 仍需领域知识</b><span>可行动诊断通常需要工程师设计 evaluator 输出。</span></div>
        </div>
      )}
      <div className={'feedback ' + (tab === 'limits' ? 'bad' : 'good')}>
        {tab === 'proposer' ? '更强 proposer 在两个案例中更好，但成本更高；这不是“越贵必然越优”的普遍定律。' : tab === 'total' ? 'Table 9 的美元数字是论文实验条件下记录，并非当前 API 价格；复杂 evaluator 往往是主要成本。' : '部署前先检查五个前提。任何一项失配，都可能让“统一接口”失去实际收益。'}
      </div>
    </div>
  );
}

function Unknown({ chapterId, moduleId }: Props) {
  return <div className="feedback bad">未找到交互：{chapterId} / {moduleId}</div>;
}

export function OptimizeAnythingLab({ chapterId, moduleId }: Props) {
  if (chapterId === 'hero') return <HeroView side={moduleId === 'old' ? 'old' : 'new'} />;
  if (moduleId === 'ana') return <AnalogyView chapterId={chapterId} />;
  const widgets: Record<string, React.ReactNode> = {
    '1.1': <SpecialistConflict />,
    '2.1': <ArtifactConvergence />,
    '2.2': <EvaluatorBridge />,
    '2.3': <UnifiedProblem />,
    '3.1': <ApiCallBuilder />,
    '3.2': <ApiResponsibility />,
    '4.1': <CoreIteration />,
    '5.1': <ScoreVsSI />,
    '5.2': <SIAblation />,
    '6.1': <AverageCollapse />,
    '6.2': <ParetoFrontier />,
    '7.1': <ThreeModes />,
    '7.2': <TransferBoundary />,
    '8.1': <FullOptimizationLoop />,
    '8.2': <SynthesisRoles />,
    '9.1': <ExperimentResultsOverview />,
    '9.2': <MechanismEvidenceOverview />,
    '9.3': <ExperimentalBoundaries />,
  };
  return <>{widgets[moduleId] || <Unknown chapterId={chapterId} moduleId={moduleId} />}</>;
}
