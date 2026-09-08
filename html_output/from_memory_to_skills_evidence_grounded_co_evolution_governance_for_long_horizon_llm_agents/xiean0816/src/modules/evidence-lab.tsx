import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 260;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', support: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', line: '#d7deea', white: '#ffffff',
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 8) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, dashed = false) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash(dashed ? [5, 5] : []);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.setLineDash([]);
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 8 * Math.cos(a - Math.PI / 6), y2 - 8 * Math.sin(a - Math.PI / 6));
  ctx.lineTo(x2 - 8 * Math.cos(a + Math.PI / 6), y2 - 8 * Math.sin(a + Math.PI / 6));
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawBike(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, 3 * scale); ctx.lineCap = 'round';
  const r = 11 * scale;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.arc(x + 34 * scale, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x + 13 * scale, y - 16 * scale); ctx.lineTo(x + 25 * scale, y);
  ctx.lineTo(x + 8 * scale, y); ctx.lineTo(x + 20 * scale, y - 9 * scale); ctx.lineTo(x + 34 * scale, y);
  ctx.moveTo(x + 13 * scale, y - 16 * scale); ctx.lineTo(x + 24 * scale, y - 18 * scale);
  ctx.stroke(); ctx.restore();
}

function useCanvas(draw: (ctx: CanvasRenderingContext2D, time: number) => void, deps: React.DependencyList) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    let raf: number | null = null;
    const tick = (time: number) => {
      draw(ctx, time);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => { if (raf === null) raf = requestAnimationFrame(tick); };
    const stop = () => { if (raf !== null) cancelAnimationFrame(raf); raf = null; };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
    // The caller supplies the complete conceptual dependency list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

const systemSteps = [
  '执行当前任务：基础 LLM 根据当前状态、已检索证据或匹配技能生成行动。',
  '保存 L1：规范化保存状态、行动、观察与反思，并保留可审计证据标识。',
  '终局后回填：用终局反馈和局部反思，为先前轨迹回填治理价值。',
  '更新 L2：高价值且反复出现的证据更新或归纳可修订程序策略。',
  '抽象 L3：多个活跃策略可形成声明式环境规律；L3 描述环境，不直接充当操作步骤。',
  '技能结晶：L2 策略须通过正启发式策略增益、近期稳定性和确定性校验。',
  '进入下一轮：可靠技能可被调用；失败或不适用时回退到 L1 或当前回合证据。',
];

function SystemLoopLab() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState('episode');
  const [gain, setGain] = useState(true);
  const [stable, setStable] = useState(true);
  const [verified, setVerified] = useState(true);
  const [judgment, setJudgment] = useState<string | null>(null);

  const nodeStep: Record<string, number> = { episode: 0, l1: 1, backfill: 2, l2: 3, l3: 4, skill: 5, base: 0 };
  const nodes = [
    { id: 'episode', label: '任务回合', x: 20, y: 54, color: C.orange },
    { id: 'l1', label: 'L1 证据', x: 132, y: 54, color: C.blue },
    { id: 'l2', label: 'L2 策略', x: 244, y: 54, color: C.support },
    { id: 'skill', label: '技能库 K', x: 456, y: 54, color: C.green },
    { id: 'base', label: '基础 LLM', x: 20, y: 142, color: C.muted },
    { id: 'backfill', label: '价值回填', x: 132, y: 142, color: C.purple },
    { id: 'l3', label: 'L3 认知', x: 244, y: 142, color: C.dark },
  ];

  const gateText = !gain
    ? '晋升暂停：没有正启发式策略增益。该信号只用于治理，不证明策略因果有效。'
    : !stable
    ? '晋升暂停：近期证据与触发器、程序或适用边界不够稳定。'
    : !verified
    ? '技能草案已丢弃：结构、证据标识或已观察工具白名单校验未通过。'
    : step >= 5
    ? '技能已具备晋升资格；后续调用结果还会继续更新可靠性与适用边界。'
    : systemSteps[step];
  const feedback = judgment === 'external-state'
    ? '判断正确：MSCE 更新的是 L1、L2、L3 与技能库组成的外部认知状态，不更新基础 LLM 参数。训练免调参不等于没有辅助更新计算。'
    : judgment === 'parameters'
    ? '再看基础 LLM 节点：它始终没有训练动画。MSCE 的训练免调参特指不更新基础 LLM 参数。'
    : judgment === 'raw-trace'
    ? '原始轨迹只能先进入 L1。程序还要经过重复证据、启发式策略增益、稳定性与确定性校验。'
    : gateText;
  const feedbackClass = judgment === 'external-state' || (gain && stable && verified && step >= 5)
    ? 'good' : (!gain || !stable || !verified || (judgment && judgment !== 'external-state')) ? 'bad' : '';

  const canvasRef = useCanvas((ctx, time) => {
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.ink; ctx.font = '700 14px Segoe UI, sans-serif';
    ctx.fillText(`第 ${step + 1} / 7 步`, 18, 26);
    ctx.fillStyle = C.muted; ctx.font = '12px Segoe UI, sans-serif';
    ctx.fillText(systemSteps[step].slice(0, 31) + (systemSteps[step].length > 31 ? '…' : ''), 104, 26);

    arrow(ctx, 108, 80, 132, 80, step >= 1 ? C.blue : C.line);
    arrow(ctx, 220, 80, 244, 80, step >= 3 ? C.support : C.line);
    arrow(ctx, 332, 80, 456, 80, step >= 5 && gain && stable && verified ? C.green : C.line);
    arrow(ctx, 176, 142, 176, 106, step >= 2 ? C.purple : C.line);
    arrow(ctx, 288, 142, 288, 106, step >= 4 ? C.dark : C.line, true);
    arrow(ctx, 500, 106, 108, 168, step >= 6 && gain && stable && verified ? C.green : C.line);
    arrow(ctx, 64, 142, 64, 106, C.line);

    const gateColor = !gain || !stable ? C.red : C.orange;
    ['增益', '稳定'].forEach((label, i) => {
      const x = 352 + i * 48; roundRect(ctx, x, 54, 42, 52, 6);
      ctx.fillStyle = (i === 0 ? gain : stable) ? '#fff' : '#fff1f2'; ctx.fill();
      ctx.strokeStyle = (i === 0 ? gain : stable) ? gateColor : C.red; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = (i === 0 ? gain : stable) ? C.ink : C.red; ctx.font = '700 12px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(label, x + 21, 84);
    });
    ctx.textAlign = 'start';

    nodes.forEach((n) => {
      const active = selected === n.id || nodeStep[n.id] === step;
      roundRect(ctx, n.x, n.y, 88, 52, 7); ctx.fillStyle = C.white; ctx.fill();
      ctx.strokeStyle = active ? n.color : C.line; ctx.lineWidth = active ? 3 : 1.5; ctx.stroke();
      ctx.fillStyle = active ? n.color : C.ink; ctx.font = '700 13px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(n.label, n.x + 44, n.y + 31);
    });
    ctx.textAlign = 'start';
    if (!verified && gain && stable) {
      ctx.strokeStyle = C.red; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(468, 60); ctx.lineTo(532, 100); ctx.moveTo(532, 60); ctx.lineTo(468, 100); ctx.stroke();
    } else if (gain && stable && verified && step >= 5) {
      ctx.strokeStyle = C.green; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(474, 82); ctx.lineTo(488, 96); ctx.lineTo(526, 62); ctx.stroke();
    } else if (step >= 5) {
      arrow(ctx, 344, 104, 210, 150, C.red, true);
    }
    const pulse = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : Math.sin(time / 300) * 2;
    if (step > 0) drawBike(ctx, 104 + Math.min(step, 5) * 70 + pulse, 126, 0.45, C.orange);
    ctx.fillStyle = C.muted; ctx.font = '12px Segoe UI'; ctx.fillText('实线：证据 / 调用主路径', 18, 238); ctx.fillText('虚线：环境先验或回退', 224, 238);
  }, [step, selected, gain, stable, verified]);

  const chooseNode = (id: string) => { setSelected(id); setStep(nodeStep[id]); };
  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} aria-label="MSCE 外部认知状态交互闭环" />
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} aria-label="上一步">← 上一步</button>
        <span className="step-label"><b>{step + 1}</b> / 7</span>
        <button className="tiny" onClick={() => setStep((s) => Math.min(6, s + 1))} disabled={step === 6} aria-label="下一步">下一步 →</button>
      </div>
      <div className="chip-row" aria-label="选择系统节点">
        {nodes.map((n) => <button key={n.id} className={`chip ${selected === n.id ? 'selected' : ''}`} onClick={() => chooseNode(n.id)}>{n.label}</button>)}
      </div>
      <div className="ctrl" style={{ justifyContent: 'center' }}>
        <label><input type="checkbox" checked={gain} onChange={(e) => setGain(e.target.checked)} /> 正启发式策略增益</label>
        <label><input type="checkbox" checked={stable} onChange={(e) => setStable(e.target.checked)} /> 近期证据稳定</label>
        <label><input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} /> 确定性校验通过</label>
      </div>
      <div className={`feedback ${feedbackClass}`} aria-live="polite">{feedback}</div>
      <div className="chip-row" aria-label="判断外部演化对象" style={{ marginTop: 14 }}>
        <button className={`chip ${judgment === 'parameters' ? 'selected' : ''}`} onClick={() => setJudgment('parameters')}>基础 LLM 参数</button>
        <button className={`chip ${judgment === 'external-state' ? 'selected' : ''}`} onClick={() => setJudgment('external-state')}>外部认知状态</button>
        <button className={`chip ${judgment === 'raw-trace' ? 'selected' : ''}`} onClick={() => setJudgment('raw-trace')}>所有原始轨迹</button>
      </div>
    </div>
  );
}

const transferSteps = [
  'Alpine 任务：安装 lxml 时 pip 编译失败。一次失败轨迹只能作为证据，不能直接成为技能。',
  '局部反思：失败指向缺失的 C 系统库。具体、忠实且可迁移的反思可获得较高权重。',
  '执行修复：识别当前系统的包管理方式，安装匹配的开发库，然后重试并成功。',
  '价值回填：0.7×0.8 + (1−0.7)×0.9×0.8 = 0.776。',
  '第二个任务：Debian 容器中的 psycopg2 出现相似问题，并由确认过的修复路径成功解决。',
  '归纳 L2 策略：解析缺失组件，识别包管理器，安装匹配开发库并重试；边界是容器环境。',
  '实验边界：六个测试迁移对全部提升准确率，平均 +3.93 个百分点，但成本变化不一致。',
];

function TransferLab() {
  const [step, setStep] = useState(0);
  const [environment, setEnvironment] = useState<'alpine'|'debian'>('alpine');
  const [term, setTerm] = useState<string | null>(null);
  const [judgment, setJudgment] = useState<string | null>(null);
  const [notice, setNotice] = useState('先查看 Alpine 的第一组证据；一次成功还不能直接晋升为技能。');

  const canvasRef = useCanvas((ctx, time) => {
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.ink; ctx.font = '700 14px Segoe UI'; ctx.fillText(`第 ${step + 1} / 7 步`, 18, 26);
    roundRect(ctx, 16, 42, 216, 150, 8); ctx.fillStyle = C.white; ctx.fill(); ctx.strokeStyle = C.line; ctx.stroke();
    roundRect(ctx, 248, 42, 296, 150, 8); ctx.fillStyle = C.white; ctx.fill(); ctx.strokeStyle = C.line; ctx.stroke();
    ctx.fillStyle = C.support; ctx.fillRect(26, 151, 196, 8);
    const bolts = [{ id: 'alpine', x: 76, r: 19 }, { id: 'debian', x: 174, r: 27 }];
    bolts.forEach((b) => {
      ctx.fillStyle = b.id === environment ? C.light : '#eef1f5'; ctx.strokeStyle = b.id === environment ? C.orange : C.line; ctx.lineWidth = b.id === environment ? 3 : 1.5;
      ctx.beginPath(); ctx.arc(b.x, 106, b.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C.ink; ctx.font = '700 12px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(b.id === 'alpine' ? 'Alpine' : 'Debian', b.x, 182);
    });
    const targetX = environment === 'alpine' ? 76 : 174;
    const wobble = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : Math.sin(time / 500) * 2;
    ctx.save(); ctx.translate(targetX - 44 + wobble, 84); ctx.rotate(-0.2); ctx.strokeStyle = C.support; ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(54, 30); ctx.stroke(); ctx.strokeStyle = C.orange; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(55, 30, environment === 'alpine' ? 22 : 30, -0.8, 0.8); ctx.stroke(); ctx.restore();
    ctx.textAlign = 'start';

    ctx.fillStyle = C.muted; ctx.font = '12px Segoe UI'; ctx.fillText(environment === 'alpine' ? '第一组：lxml' : '第二组：psycopg2', 264, 62);
    ctx.fillStyle = step === 3 ? C.purple : step >= 4 ? C.green : step === 0 ? C.red : C.blue;
    ctx.font = '700 16px Segoe UI';
    if (step === 3) {
      ctx.fillText('0.7 × 0.8', 268, 102); ctx.fillText('+ 0.3 × 0.9 × 0.8', 268, 130); ctx.fillStyle = C.green; ctx.fillText('= 0.776', 268, 162);
    } else {
      const titles = ['编译失败', '定位系统库', '安装并重试', '回填价值', '第二组证据', '归纳程序原则', '独立迁移实验'];
      ctx.fillText(titles[step], 268, 96);
      ctx.fillStyle = C.ink; ctx.font = '13px Segoe UI';
      const lines = transferSteps[step].match(/.{1,20}/g) || [];
      lines.slice(0, 4).forEach((line, i) => ctx.fillText(line, 268, 122 + i * 20));
    }
    const rail = ['保持原则', '调整参数', '守住边界'];
    rail.forEach((label, i) => {
      roundRect(ctx, 16 + i * 178, 204, 168, 40, 6); ctx.fillStyle = i <= Math.min(2, Math.floor(step / 2)) ? '#e8f5ee' : C.white; ctx.fill(); ctx.strokeStyle = i <= Math.min(2, Math.floor(step / 2)) ? C.green : C.line; ctx.stroke();
      ctx.fillStyle = C.ink; ctx.font = '700 13px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(label, 100 + i * 178, 229);
    }); ctx.textAlign = 'start';
  }, [step, environment]);

  const selectEnv = (env: 'alpine'|'debian') => {
    setEnvironment(env);
    setNotice(env === 'alpine' ? '扳手已对准 Alpine 螺栓：查看第一组 lxml 依赖修复证据。' : '扳手已对准 Debian 螺栓：查看第二组 psycopg2 依赖修复证据。迁移的是原则，不是 Alpine 的具体环境细节。');
  };
  const chooseTerm = (id: string) => {
    setTerm(id);
    const copy: Record<string,string> = {
      R: 'R=0.8 是该附录示例的终局反馈，不是模型准确率。',
      alpha: 'α=0.7 表示这一步更多吸收终局反馈；它仍是治理权重，不是因果信用。',
      gamma: 'γ=0.9 控制从下一步价值继承时的折扣。',
      next: '下一步价值为 0.8，低 α 步骤会更多继承这一折扣后的未来价值。',
    };
    setNotice(copy[id]);
  };
  const move = (delta: number) => {
    const next = clamp(step + delta, 0, 6);
    setStep(next); setNotice(transferSteps[next]);
  };
  const chooseJudgment = (id: string) => {
    setJudgment(id);
    setNotice(id === 'principle' ? '判断正确：保留触发器、诊断与重试原则，再根据目标环境识别包管理器与匹配开发库。' : id === 'copy' ? '照抄 Alpine 的环境细节会越过适用边界。Debian 需要重新确定环境参数。' : '一次 Alpine 成功只提供一组证据。策略归纳与技能结晶还需要跨回合支持、正启发式策略增益和稳定性检查。');
  };
  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} aria-label="Alpine 与 Debian 依赖修复迁移示例" />
      <div className="chip-row" aria-label="选择环境证据">
        <button className={`chip ${environment === 'alpine' ? 'selected' : ''}`} onClick={() => selectEnv('alpine')}>Alpine 证据</button>
        <button className={`chip ${environment === 'debian' ? 'selected' : ''}`} onClick={() => selectEnv('debian')}>Debian 证据</button>
      </div>
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => move(-1)} disabled={step === 0}>← 上一步</button>
        <span className="step-label"><b>{step + 1}</b> / 7</span>
        <button className="tiny" onClick={() => move(1)} disabled={step === 6}>下一步 →</button>
      </div>
      <div className="chip-row" aria-label="查看回填公式项">
        {['R','alpha','gamma','next'].map((id) => <button key={id} className={`chip ${term === id ? 'selected' : ''}`} onClick={() => chooseTerm(id)}>{id === 'R' ? 'R = 0.8' : id === 'alpha' ? 'α = 0.7' : id === 'gamma' ? 'γ = 0.9' : 'Vₜ₊₁ = 0.8'}</button>)}
      </div>
      <div className={`feedback ${judgment === 'principle' ? 'good' : judgment ? 'bad' : ''}`} aria-live="polite">{notice}</div>
      <div className="chip-row" aria-label="迁移判断" style={{ marginTop: 14 }}>
        <button className={`chip ${judgment === 'copy' ? 'selected' : ''}`} onClick={() => chooseJudgment('copy')}>照抄包名</button>
        <button className={`chip ${judgment === 'principle' ? 'selected' : ''}`} onClick={() => chooseJudgment('principle')}>保留原则，调整参数</button>
        <button className={`chip ${judgment === 'once' ? 'selected' : ''}`} onClick={() => chooseJudgment('once')}>一次成功即晋升</button>
      </div>
    </div>
  );
}

type ResultView = 'main'|'ablation'|'transfer'|'lifelong'|'limits';
type Lane = { id: string; label: string; value: number };
const laneSets: Record<Exclude<ResultView,'limits'>, { max: number; axis: string; lanes: Lane[] }> = {
  main: { max: 16, axis: '相对各域最强非 MSCE 基线的 Pass@1 提升（百分点）', lanes: [
    { id:'ir', label:'信息检索', value:4.61 }, { id:'math', label:'数学', value:4.00 }, { id:'se', label:'软件工程', value:15.39 }, { id:'kw', label:'知识工作', value:5.17 },
  ] },
  ablation: { max: 20, axis: '相对完整 MSCE 的 Pass@1 损失（百分点）', lanes: [
    { id:'flat-ir', label:'平铺-检索', value:15.38 }, { id:'flat-math', label:'平铺-数学', value:16.00 }, { id:'flat-se', label:'平铺-软件', value:19.23 },
  ] },
  transfer: { max: 6, axis: '六个测试迁移对的 Pass@1 提升（百分点）', lanes: [{ id:'transfer-avg', label:'六对平均', value:3.93 }] },
  lifelong: { max: 18, axis: 'p0 到 p100 的 Pass@1 提升（百分点）', lanes: [
    { id:'life-math', label:'数学', value:17.00 }, { id:'life-se', label:'软件工程', value:15.39 }, { id:'life-ir', label:'信息检索', value:13.84 },
  ] },
};

const metricCopy: Record<string,string> = {
  ir: '在论文共享协议下，MSCE 的信息检索 Pass@1 相对最强非 MSCE 基线提升 4.61 个百分点。',
  math: '在论文共享协议下，MSCE 的数学 Pass@1 提升 4.00 个百分点。',
  se: '软件工程准确率提升 15.39 个百分点，但成本由 37.3 增至 40.8 轮，不能概括为全面提效。',
  kw: '在论文共享协议下，知识工作 Pass@1 提升 5.17 个百分点。',
  code: '代码任务 Pass@1 为 61.54%，与 EvoSkill 持平；成本由 3.9 降至 2.0 轮。',
  locomo: 'LoCoMo 总体评审分为 61.23，对比 59.22；F1 为 49.89，对比 48.71。MSCE 并未领先每一种问题子类型。',
  'flat-ir': '扁平记忆造成最大消融退化：信息检索下降 15.38、数学下降 16.00、软件工程下降 19.23 个百分点；代码成本由 2.0 增至 5.3 轮。',
  'flat-math': '扁平记忆使数学 Pass@1 下降 16.00 个百分点；这是相对完整 MSCE 的损失。',
  'flat-se': '扁平记忆使软件工程 Pass@1 下降 19.23 个百分点，是该三域消融中最大的下降。',
  crystallization: '移除技能结晶后，各域 Pass@1 下降 6.15 至 11.54 个百分点，而且每个域的成本都增加。',
  'transfer-avg': '六个测试迁移对全部提升准确率，范围为 +2.56 至 +5.13 个百分点，平均 +3.93。',
  'transfer-cost': '六对中有四对成本下降；两对迁入代码任务的成本分别上升 4.6% 和 8.1%。',
  'life-math': '从 p0 到 p100，数学 Pass@1 提升 17.00 个百分点。',
  'life-se': '从 p0 到 p100，软件工程 Pass@1 提升 15.39 个百分点。',
  'life-ir': '从 p0 到 p100，信息检索 Pass@1 提升 13.84 个百分点。',
  'life-cost': '归一化成本在 p25 先升高，随后下降；准确率增长并不要求成本单调上升。',
  heuristic: '轨迹价值、启发式策略增益和可靠性都是治理信号，不是因果信用分配。',
  operators: '提示驱动的辅助算子可能引入噪声、提示敏感性、延迟与成本。',
  protocol: '结果依赖 OpenClaw 版本、工具、GPT-5.2 基础模型、GPT-4o 辅助算子、任务顺序和评测配置。',
  safety: '有界存储与规范化不能消除隐私、秘密保留或有害程序风险；基准结果不证明任意真实组织中的安全自治。',
};

const metricIds: Record<ResultView, {id:string;label:string}[]> = {
  main: [{id:'ir',label:'信息检索 +4.61'},{id:'math',label:'数学 +4.00'},{id:'se',label:'软件工程 +15.39'},{id:'kw',label:'知识工作 +5.17'},{id:'code',label:'代码 61.54%'},{id:'locomo',label:'LoCoMo 61.23 / 49.89'}],
  ablation: [{id:'flat-ir',label:'平铺记忆 -15.38 / -16.00 / -19.23'},{id:'crystallization',label:'去技能结晶 -6.15 至 -11.54'}],
  transfer: [{id:'transfer-avg',label:'六对平均 +3.93'},{id:'transfer-cost',label:'成本效果混合'}],
  lifelong: [{id:'life-math',label:'数学 +17.00'},{id:'life-se',label:'软件工程 +15.39'},{id:'life-ir',label:'信息检索 +13.84'},{id:'life-cost',label:'成本先升后降'}],
  limits: [{id:'heuristic',label:'启发式治理信号'},{id:'operators',label:'提示算子噪声'},{id:'protocol',label:'运行时与评测依赖'},{id:'safety',label:'隐私和部署风险'}],
};

const limitSummaries: Record<string, string> = {
  heuristic: '只支持治理判断，不证明因果',
  operators: '可能增加噪声、延迟与成本',
  protocol: '结论依赖模型、工具与评测配置',
  safety: '基准优势不等于真实部署安全',
};

function ResultsLab() {
  const [view, setView] = useState<ResultView>('main');
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState('se');
  const [judgment, setJudgment] = useState<string | null>(null);
  const progressRef = useRef(0);
  progressRef.current = progress;

  useEffect(() => {
    if (!playing) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setProgress(1); setPlaying(false); return; }
    const start = performance.now() - progress * 900;
    let raf = 0;
    const tick = (now: number) => {
      const p = clamp((now - start) / 900, 0, 1); setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick); else setPlaying(false);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const canvasRef = useCanvas((ctx) => {
    ctx.clearRect(0,0,W,H); ctx.fillStyle=C.bg; ctx.fillRect(0,0,W,H);
    ctx.fillStyle=C.ink; ctx.font='700 14px Segoe UI';
    if (view === 'limits') {
      ctx.fillText('解释边界，不是比赛结果', 18, 27);
      const boards = metricIds.limits;
      boards.forEach((b,i)=>{
        const x=24+(i%2)*264, y=50+Math.floor(i/2)*88;
        roundRect(ctx,x,y,244,68,7); ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle=i===3?C.red:C.orange;ctx.lineWidth=2;ctx.stroke();
        ctx.fillStyle=i===3?C.red:C.ink;ctx.font='700 14px Segoe UI';ctx.fillText(b.label,x+16,y+29);
        ctx.fillStyle=C.muted;ctx.font='12px Segoe UI';ctx.fillText(limitSummaries[b.id],x+16,y+50);
      });
      ctx.fillStyle=C.muted;ctx.fillText('这些限制不能被一条更长的结果条抵消。',18,236); return;
    }
    const set=laneSets[view]; ctx.fillText(set.axis,18,27);
    const laneY=[64,106,148,190];
    set.lanes.forEach((lane,i)=>{
      const y=laneY[i]; ctx.fillStyle=C.ink;ctx.font='700 12px Segoe UI';ctx.fillText(lane.label,18,y+5);
      ctx.strokeStyle=C.line;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(112,y);ctx.lineTo(512,y);ctx.stroke();
      const target=112+(lane.value/set.max)*400; const x=112+(target-112)*easeOutCubic(progressRef.current);
      ctx.strokeStyle=view==='ablation'?C.red:C.green;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(target,y-13);ctx.lineTo(target,y+13);ctx.stroke();
      drawBike(ctx,x-17,y,0.45,view==='ablation'?C.red:C.blue);
      ctx.fillStyle=view==='ablation'?C.red:C.green;ctx.font='700 12px Segoe UI';ctx.fillText(`${lane.value.toFixed(2)}`,target+5,y+4);
    });
    if(view==='transfer') {ctx.fillStyle='rgba(146,64,14,.14)';const a=112+2.56/6*400,b=112+5.13/6*400;ctx.fillRect(a,45,b-a,142);ctx.fillStyle=C.support;ctx.fillText('范围 +2.56 至 +5.13',a,210);}
    if(view==='ablation'){ctx.fillStyle='rgba(146,64,14,.16)';const a=112+6.15/20*400,b=112+11.54/20*400;ctx.fillRect(a,207,b-a,15);ctx.fillStyle=C.support;ctx.fillText('去技能结晶损失区间',a,242);}
    ctx.fillStyle=C.muted;ctx.font='12px Segoe UI';ctx.fillText('0',108,238);ctx.fillText(String(set.max),500,238);
  }, [view]);

  const changeView=(v:ResultView)=>{setView(v);setProgress(0);setPlaying(false);setSelectedMetric(metricIds[v][0].id);setJudgment(null);};
  const feedback = judgment === 'conditional'
    ? '判断正确：论文支持共享协议下的准确率优势、组件贡献与测试范围内的迁移和积累，但成本、因果性与部署安全仍需条件化表述。'
    : judgment === 'universal'
    ? '该结论过强：软件工程和两对代码迁移都出现成本上升，论文也没有证明任意组织中的安全自治。'
    : judgment === 'flat'
    ? '消融结果与此相反：平铺记忆造成最大退化，技能结晶被移除后各域也持续下降。'
    : metricCopy[selectedMetric];
  const feedbackClass=judgment==='conditional'?'good':judgment?'bad':'';
  return <div>
    <div className="chip-row" aria-label="结果视图">
      {([['main','主结果'],['ablation','消融'],['transfer','迁移'],['lifelong','终身演化'],['limits','边界']] as [ResultView,string][]).map(([id,label])=><button key={id} className={`chip ${view===id?'selected':''}`} onClick={()=>changeView(id)}>{label}</button>)}
    </div>
    <canvas ref={canvasRef} width={W} height={H} aria-label="论文结果、消融、迁移和边界比较" />
    <div className="step-ctrl">
      <button className="tiny" onClick={()=>setPlaying(true)} disabled={playing||progress>=1||view==='limits'} aria-label="播放赛程">▶ 播放</button>
      <button className="tiny ghost" onClick={()=>setPlaying(false)} disabled={!playing||view==='limits'} aria-label="暂停赛程">Ⅱ 暂停</button>
      <button className="tiny ghost" onClick={()=>{setPlaying(false);setProgress(0);}} disabled={progress===0||view==='limits'} aria-label="重置赛程">↺ 重置</button>
    </div>
    <div className="chip-row" aria-label="选择精确指标">
      {metricIds[view].map((m)=><button key={m.id} className={`chip ${selectedMetric===m.id?'selected':''}`} onClick={()=>{setSelectedMetric(m.id);setJudgment(null);}}>{m.label}</button>)}
    </div>
    <div className={`feedback ${feedbackClass}`} aria-live="polite">{feedback}</div>
    <div className="chip-row" aria-label="选择最稳妥结论" style={{marginTop:14}}>
      <button className={`chip ${judgment==='universal'?'selected':''}`} onClick={()=>setJudgment('universal')}>普遍省成本且已安全</button>
      <button className={`chip ${judgment==='conditional'?'selected':''}`} onClick={()=>setJudgment('conditional')}>共享协议下的条件化结论</button>
      <button className={`chip ${judgment==='flat'?'selected':''}`} onClick={()=>setJudgment('flat')}>平铺记忆已经足够</button>
    </div>
  </div>;
}

export const EvidenceLab: React.FC<WidgetProps> = ({ moduleId }) => {
  if (moduleId === '8.1') return <SystemLoopLab />;
  if (moduleId === '9.1') return <TransferLab />;
  return <ResultsLab />;
};

export default EvidenceLab;
