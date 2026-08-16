import React, { useCallback, useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', support: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', line: '#d7deea', white: '#ffffff',
};

type Draw = (ctx: CanvasRenderingContext2D, time: number) => void;

function CanvasView({ draw, width = 560, height = 250, label }: { draw: Draw; width?: number; height?: number; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, width, height); } catch { return; }
    let frame: number | null = null;
    const tick = (time: number) => {
      draw(ctx, time);
      canvas.classList.add('is-ready');
      frame = requestAnimationFrame(tick);
    };
    const start = () => { if (frame === null) frame = requestAnimationFrame(tick); };
    const stop = () => { if (frame !== null) cancelAnimationFrame(frame); frame = null; };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [draw, width, height]);
  return <canvas ref={ref} width={width} height={height} role="img" aria-label={label} />;
}

function base(ctx: CanvasRenderingContext2D, w = 560, h = 250) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = C.white; ctx.fillRect(20, 20, w - 40, h - 40);
  ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.strokeRect(20.5, 20.5, w - 41, h - 41);
  ctx.font = '14px "Segoe UI", sans-serif'; ctx.textBaseline = 'middle';
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.ink, size = 14) {
  ctx.fillStyle = color; ctx.font = `${size}px "Segoe UI", sans-serif`; ctx.fillText(text, x, y);
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = C.blue) {
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 9 * Math.cos(a - .45), y2 - 9 * Math.sin(a - .45));
  ctx.lineTo(x2 - 9 * Math.cos(a + .45), y2 - 9 * Math.sin(a + .45)); ctx.closePath(); ctx.fill();
}

function node(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, text: string, active: boolean, color = C.blue) {
  ctx.fillStyle = active ? color : C.white; ctx.strokeStyle = active ? color : C.line; ctx.lineWidth = active ? 3 : 1.5;
  ctx.beginPath(); ctx.roundRect(x, y, w, 46, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = active ? C.white : C.ink; ctx.font = 'bold 14px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(text, x + w / 2, y + 23); ctx.textAlign = 'left';
}

function feedbackClass(kind: 'good' | 'bad' | 'mid') { return kind === 'good' ? 'good' : kind === 'bad' ? 'bad' : ''; }

function HeroView({ side }: { side: 'old' | 'new' }) {
  const draw = useCallback<Draw>((ctx, time) => {
    base(ctx, 360, 160);
    const t = (time % 3000) / 3000;
    if (side === 'old') {
      node(ctx, 35, 58, 90, '文本提示', true, C.orange); node(ctx, 235, 58, 90, '最终视频', t > .55, C.red);
      arrow(ctx, 130, 81, 228, 81, C.red); label(ctx, '同时推断过程与外观', 103, 125, C.red, 13);
    } else {
      node(ctx, 18, 58, 70, '提示', true); node(ctx, 110, 58, 70, '代码', t > .2, C.orange);
      node(ctx, 202, 58, 70, '草稿', t > .45, C.blue); node(ctx, 294, 58, 50, '视频', t > .7, C.green);
      arrow(ctx, 90, 81, 106, 81); arrow(ctx, 182, 81, 198, 81); arrow(ctx, 274, 81, 290, 81, C.green);
      label(ctx, '先落实过程，再生成外观', 96, 125, C.green, 13);
    }
  }, [side]);
  return <CanvasView draw={draw} width={360} height={160} label={side === 'old' ? '传统文本到视频流程' : 'VideoCoCo 双引擎流程'} />;
}

const analogyActions = ['压下泡棉', '选择观察角度', '沿轮廓描线', '读取刻度', '调整补光', '按帧记录', '配对样本', '检查步骤', '测试边界', '完成对比'];

function AnalogyView({ chapter }: { chapter: number }) {
  const draw = useCallback<Draw>((ctx, time) => {
    const w = 244, h = 130; ctx.clearRect(0, 0, w, h); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = C.light; ctx.fillRect(12, 88, 220, 18); ctx.strokeStyle = C.dark; ctx.strokeRect(12, 88, 220, 18);
    const phase = (Math.sin(time / 500 + chapter * .5) + 1) / 2;
    const x = 72 + ((chapter === 2 || chapter === 9) ? phase * 90 : 45);
    const squash = chapter === 1 || chapter === 4 || chapter === 8 ? phase * 12 : 0;
    ctx.fillStyle = chapter === 10 ? C.green : C.orange; ctx.strokeStyle = C.support; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(x, 60 + squash, 54, 28 - squash, 10); ctx.fill(); ctx.stroke();
    if (chapter === 5 || chapter === 6) { ctx.fillStyle = 'rgba(39,68,110,.22)'; ctx.beginPath(); ctx.arc(x + 27, 53, 28 + phase * 12, 0, Math.PI * 2); ctx.fill(); }
    if (chapter === 7) { ctx.strokeStyle = C.blue; ctx.strokeRect(x - 8, 47, 70, 48); }
    if (chapter === 3) { ctx.strokeStyle = C.green; ctx.setLineDash([4, 4]); ctx.strokeRect(40, 45, 160, 50); ctx.setLineDash([]); }
    if (chapter === 9) { ctx.strokeStyle = C.red; ctx.beginPath(); ctx.moveTo(170, 42); ctx.lineTo(170, 96); ctx.stroke(); }
    label(ctx, analogyActions[chapter - 1], 12, 18, C.ink, 13);
    label(ctx, '同一实验台 · 一次可见动作', 12, 118, C.muted, 11);
  }, [chapter]);
  return <CanvasView draw={draw} width={244} height={130} label={`第${chapter}章实验记录动作`} />;
}

function Chapter1() {
  const [level, setLevel] = useState(1);
  const draw = useCallback<Draw>((ctx) => {
    base(ctx); label(ctx, '提示中已明确的过程信息', 40, 46, C.ink, 16);
    const items = ['初始状态', '中间状态', '时间顺序', '最终结果'];
    items.forEach((it, i) => { node(ctx, 38 + i * 128, 82, 105, it, i < level, i < level ? C.blue : C.red); });
    label(ctx, level < 4 ? '未说明的部分仍需生成器隐式补全' : '过程约束更完整，但文本本身仍不是可执行过程', 42, 180, level < 3 ? C.red : C.blue, 15);
  }, [level]);
  const kind = level < 3 ? 'bad' : 'mid';
  return <div><CanvasView draw={draw} label="提示中缺失的时空信息" /><div className="ctrl"><label>显式过程信息 <span className="val">{level}/4</span></label><input type="range" min="1" max="4" value={level} onChange={e => setLevel(Number(e.target.value))} /></div><div className={`feedback ${feedbackClass(kind)}`}>{level < 3 ? '提示只说明事件，完整的中间状态与时间演化仍被压缩。' : '信息更充分，但论文的目标是把过程变成可执行、可检查的中间表示。'}</div></div>;
}

const cotModes = [
  ['规划 CoT', '文本计划、关键帧或布局作为条件', C.orange],
  ['测试时搜索', '生成多个候选，再选择或修订', C.purple],
  ['视觉状态 CoT', '通过稀疏的中间视觉状态推理', C.blue],
  ['Code-as-CoT', '执行代码并渲染完整时空草稿', C.green],
] as const;
function Chapter2() {
  const [mode, setMode] = useState(0);
  const draw = useCallback<Draw>((ctx) => { base(ctx); const [name, desc, color] = cotModes[mode]; node(ctx, 40, 84, 120, 'Prompt', true, C.blue); node(ctx, 220, 84, 120, name, true, color); node(ctx, 400, 84, 120, 'Video', true, mode === 3 ? C.green : C.orange); arrow(ctx, 165, 107, 214, 107, color); arrow(ctx, 345, 107, 394, 107, color); label(ctx, desc, 44, 180, color, 15); }, [mode]);
  return <div><div className="chip-row">{cotModes.map((m, i) => <button key={m[0]} className={`chip ${mode === i ? 'selected' : ''}`} onClick={() => setMode(i)}>{m[0]}</button>)}</div><CanvasView draw={draw} label="四类视频生成思维链范式" /><div className={`feedback ${mode === 3 ? 'good' : ''}`}>{cotModes[mode][1]}。{mode === 3 ? '论文强调其完整、可执行且可检查的过程级中间表示。' : '该范式提供中间信息，但论文认为其通常仍是描述性、选择性或时序稀疏的。'}</div></div>;
}

type PropertyGlyphKind = 'object' | 'motion' | 'interaction' | 'code' | 'run' | 'draft' | 'read' | 'edit' | 'rerun';

function PropertyGlyph({ kind }: { kind: PropertyGlyphKind }) {
  if (kind === 'object') return <svg viewBox="0 0 48 48"><path d="m24 6 15 8v19l-15 9-15-9V14zM9 14l15 9 15-9M24 23v19" /></svg>;
  if (kind === 'motion') return <svg viewBox="0 0 48 48"><circle cx="14" cy="28" r="6" /><path d="M20 28h19m-7-7 7 7-7 7M10 14c8-5 17-5 25 0" /></svg>;
  if (kind === 'interaction') return <svg viewBox="0 0 48 48"><circle cx="16" cy="24" r="9" /><circle cx="32" cy="24" r="9" /><path d="M22 16c4 4 4 12 0 16m4-16c-4 4-4 12 0 16" /></svg>;
  if (kind === 'code') return <svg viewBox="0 0 48 48"><path d="m18 12-11 12 11 12m12-24 11 12-11 12M28 7 20 41" /></svg>;
  if (kind === 'run') return <svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18" /><path d="m20 16 13 8-13 8z" /></svg>;
  if (kind === 'draft') return <svg viewBox="0 0 48 48"><rect x="5" y="10" width="38" height="28" rx="4" /><path d="M12 10v28m24-28v28M5 17h7m24 0h7M5 31h7m24 0h7" /><circle cx="24" cy="24" r="6" /></svg>;
  if (kind === 'read') return <svg viewBox="0 0 48 48"><path d="M5 24s7-12 19-12 19 12 19 12-7 12-19 12S5 24 5 24Z" /><circle cx="24" cy="24" r="6" /></svg>;
  if (kind === 'edit') return <svg viewBox="0 0 48 48"><path d="m11 34-2 7 7-2 23-23-5-5zM29 16l5 5M10 8h17M10 16h11M10 24h7" /></svg>;
  return <svg viewBox="0 0 48 48"><path d="M38 17a16 16 0 1 0 1 13M38 7v10H28" /><path d="m20 17 12 7-12 7z" /></svg>;
}

const codeProps: Array<{
  label: string;
  title: string;
  thesis: string;
  formula: string;
  connector: '+' | '→';
  steps: Array<{ kind: PropertyGlyphKind; title: string; code: string }>;
}> = [
  {
    label: '显式 Explicit',
    title: '过程要素必须被明确声明',
    thesis: '每一个物体、运动和交互都必须写入程序，避免文本计划中常见的描述不足问题。',
    formula: 'Object + Motion + Interaction → Explicit Program',
    connector: '+',
    steps: [
      { kind: 'object', title: 'Object', code: "add_object('butter')" },
      { kind: 'motion', title: 'Motion', code: 'animate(melting=True)' },
      { kind: 'interaction', title: 'Interaction', code: 'heat → soften → spread' },
    ],
  },
  {
    label: '可执行 Executable',
    title: '程序提交到一个具体、可运行的过程',
    thesis: '代码不是对过程的文字描述；它可以被沙箱真正执行，并产生确定的时空 Draft。',
    formula: 'c = A_code(p)    ·    d = B(c)',
    connector: '→',
    steps: [
      { kind: 'code', title: 'Code', code: 'Blender Python c' },
      { kind: 'run', title: 'Execute', code: 'Sandbox B(c)' },
      { kind: 'draft', title: 'Draft', code: 'Spatiotemporal d' },
    ],
  },
  {
    label: '可检查 Inspectable',
    title: '中间推理过程保持透明',
    thesis: '代码可以被阅读、编辑和重新执行，因此推理过程不是隐藏在潜在激活之中。',
    formula: 'Read → Edit → Re-run → Inspectable Process',
    connector: '→',
    steps: [
      { kind: 'read', title: 'Read', code: '检查对象与参数' },
      { kind: 'edit', title: 'Edit', code: '修改错误步骤' },
      { kind: 'rerun', title: 'Re-run', code: '重新执行并验证' },
    ],
  },
];
function Chapter3() {
  const [active, setActive] = useState(0);
  const property = codeProps[active];
  return <div className="property-explorer"><div className="chip-row">{codeProps.map((item, i) => <button className={`chip ${active === i ? 'selected' : ''}`} onClick={() => setActive(i)} key={item.label}>{item.label}</button>)}</div><div className={`property-rich property-${active}`} key={property.label}><header><div className="property-mark"><PropertyGlyph kind={property.steps[0].kind} /></div><div><p>CODE-AS-COT PROPERTY {String(active + 1).padStart(2, '0')}</p><h4>{property.title}</h4><span>{property.thesis}</span></div></header><div className="property-process">{property.steps.map((step, index) => <React.Fragment key={step.title}><div className="property-step"><PropertyGlyph kind={step.kind} /><strong>{step.title}</strong><code>{step.code}</code></div>{index < property.steps.length - 1 ? <i>{property.connector}</i> : null}</React.Fragment>)}</div><div className="property-formula">{property.formula}</div></div><div className="feedback good">{property.thesis}</div></div>;
}

const simSteps = ['文本提示 p', '编码智能体 A_code', 'Blender 程序 c', '沙箱执行 B', '时空草稿 d'];
function Chapter4() {
  const [step, setStep] = useState(0);
  const draw = useCallback<Draw>((ctx) => { base(ctx); simSteps.forEach((s, i) => { node(ctx, 28 + i * 104, 82, 92, s, i <= step, i < 3 ? C.orange : C.blue); if (i < 4) arrow(ctx, 122 + i * 104, 105, 128 + i * 104, 105, i < step ? C.green : C.line); }); label(ctx, step < 3 ? 'c = A_code(p)' : 'd = B(c)', 205, 178, step < 3 ? C.orange : C.blue, 19); }, [step]);
  return <div><CanvasView draw={draw} label="可执行仿真引擎步骤" /><div className="step-ctrl"><button className="tiny ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>上一步</button><span className="step-label"><b>{step + 1}</b> / 5 · {simSteps[step]}</span><button className="tiny" onClick={() => setStep(Math.min(4, step + 1))} disabled={step === 4}>下一步</button></div><div className={`feedback ${step === 4 ? 'good' : ''}`}>{step === 4 ? '草稿是低保真但时序稠密的结构支架：固定发生什么以及何时发生。' : '逐步把压缩的文本意图落实为可运行程序。'}</div></div>;
}

function Chapter5() {
  const [stage, setStage] = useState<'sim' | 'edit'>('sim');
  const draw = useCallback<Draw>((ctx) => { base(ctx); node(ctx, 30, 82, 105, '用户提示', true, C.blue); node(ctx, 175, 82, 150, '可执行仿真引擎', stage === 'sim', C.orange); node(ctx, 365, 82, 165, '生成式视频引擎', stage === 'edit', C.blue); arrow(ctx, 140, 105, 169, 105, C.orange); arrow(ctx, 330, 105, 359, 105, C.blue); label(ctx, stage === 'sim' ? '职责：落实过程级时空动态' : '职责：把既定过程实现为高保真外观', 48, 182, stage === 'sim' ? C.orange : C.blue, 16); }, [stage]);
  return <div><div className="chip-row"><button className={`chip ${stage === 'sim' ? 'selected' : ''}`} onClick={() => setStage('sim')}>阶段 1：过程</button><button className={`chip ${stage === 'edit' ? 'selected' : ''}`} onClick={() => setStage('edit')}>阶段 2：外观</button></div><CanvasView draw={draw} label="VideoCoCo 双引擎职责" /><div className="feedback good">{stage === 'sim' ? '仿真引擎先提交到一个具体、可重复的过程。' : '视频引擎不从头猜测运动，而是对已实例化的过程做高保真实现。'}</div></div>;
}

function Chapter6() {
  const [mode, setMode] = useState<'draft' | 'instruction' | 'joint'>('joint');
  const draw = useCallback<Draw>((ctx) => { base(ctx); node(ctx, 45, 76, 130, '草稿 d', mode !== 'instruction', C.orange); node(ctx, 215, 76, 130, '编辑指令 e', mode !== 'draft', C.blue); node(ctx, 385, 76, 130, '编辑器 Gθ', true, mode === 'joint' ? C.green : C.red); arrow(ctx, 180, 99, 209, 99, C.orange); arrow(ctx, 350, 99, 379, 99, C.blue); label(ctx, mode === 'draft' ? '只有过程锚点：外观描述不足' : mode === 'instruction' ? '只有外观描述：运动可能被重新猜测' : 'd 约束发生什么，e 说明看起来怎样', 55, 180, mode === 'joint' ? C.green : C.red, 15); }, [mode]);
  return <div><div className="chip-row"><button className={`chip ${mode === 'draft' ? 'selected' : ''}`} onClick={() => setMode('draft')}>仅草稿</button><button className={`chip ${mode === 'instruction' ? 'selected' : ''}`} onClick={() => setMode('instruction')}>仅指令</button><button className={`chip ${mode === 'joint' ? 'selected' : ''}`} onClick={() => setMode('joint')}>草稿 + 指令</button></div><CanvasView draw={draw} label="草稿与编辑指令的分工" /><div className={`feedback ${mode === 'joint' ? 'good' : 'bad'}`}>{mode === 'joint' ? '论文方法联合 d 与 e：结构和外观由不同条件承担。' : '这是职责缺失的教学示意，不是论文报告的消融数值。'}</div></div>;
}

const samplePrompt = 'Extreme macro close-up of two fingertips pressing down onto a soft foam earplug resting on a brushed stainless-steel prep table. The earplug is dense open-cell memory foam, matte with a faintly velvety porous skin in warm cream-orange. Under the driving motion the fingertips descend and squeeze it flat, the foam compressing and bulging outward into a squashed dome, then slowly springing back and recovering its rounded form as the fingers lift away.';
function Chapter7() {
  const [part, setPart] = useState<'draft' | 'instruction' | 'target'>('draft');
  const draw = useCallback<Draw>((ctx) => { base(ctx, 560, 170); const parts = [['草稿视频 d', 'draft'], ['编辑指令 e', 'instruction'], ['目标视频 y', 'target']] as const; parts.forEach((p, i) => { node(ctx, 45 + i * 180, 60, 145, p[0], part === p[1], part === p[1] ? (i === 2 ? C.green : i === 1 ? C.blue : C.orange) : C.line); if (i < 2) arrow(ctx, 195 + i * 180, 83, 219 + i * 180, 83, C.blue); }); }, [part]);
  return <div><div className="chip-row"><button className={`chip ${part === 'draft' ? 'selected' : ''}`} onClick={() => setPart('draft')}>草稿</button><button className={`chip ${part === 'instruction' ? 'selected' : ''}`} onClick={() => setPart('instruction')}>指令</button><button className={`chip ${part === 'target' ? 'selected' : ''}`} onClick={() => setPart('target')}>目标</button></div><CanvasView draw={draw} width={560} height={170} label="VideoCoCo-3K 三元组关系" /><div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))', gap:12}}><div><strong>Draft · video.mp4</strong><video controls muted playsInline preload="metadata" style={{width:'100%',marginTop:8,border:`1px solid ${C.line}`}} src={`${import.meta.env.BASE_URL}images/video.mp4`} /></div><div><strong>Target · seedance.mp4</strong><video controls muted playsInline preload="metadata" style={{width:'100%',marginTop:8,border:`1px solid ${C.line}`}} src={`${import.meta.env.BASE_URL}images/seedance.mp4`} /></div></div><details style={{marginTop:12}}><summary>查看该样例的编辑指令</summary><p style={{fontSize:14,lineHeight:1.65}}>{samplePrompt}</p></details><div className="feedback good">当前高亮：{part === 'draft' ? '低保真时空草稿，提供过程结构。' : part === 'instruction' ? '外观编辑指令，描述材质、光照与镜头。' : '高保真目标，用于监督草稿条件编辑。'}</div></div>;
}

const arch = [
  ['编码智能体', '把 p 写成 Blender 程序 c。'], ['Blender 沙箱', '执行 c 并渲染确定性草稿 d。'],
  ['指令智能体', '联合 p 与 d 生成外观指令 e。'], ['视频编辑器', '以 d、e 为条件生成 v̂。'],
] as const;
function Chapter8() {
  const [active, setActive] = useState(0);
  const draw = useCallback<Draw>((ctx) => { base(ctx); arch.forEach((a, i) => { node(ctx, 30 + i * 132, 72, 112, a[0], i === active, i < 2 ? C.orange : C.blue); if (i < 3) arrow(ctx, 145 + i * 132, 95, 157 + i * 132, 95, i < active ? C.green : C.line); }); label(ctx, arch[active][1], 40, 170, active === 3 ? C.green : C.blue, 15); label(ctx, active === 3 ? 'v̂ = Gθ(d,e)' : active === 2 ? 'e = A_edit(p,d)' : active === 1 ? 'd = B(c)' : 'c = A_code(p)', 205, 207, C.purple, 18); }, [active]);
  return <div><div className="chip-row">{arch.map((a, i) => <button key={a[0]} className={`chip ${active === i ? 'selected' : ''}`} onClick={() => setActive(i)}>{a[0]}</button>)}</div><CanvasView draw={draw} label="VideoCoCo 交互式架构图" /><div className="feedback good">{arch[active][1]} 当前节点、活动路径与对应公式同步更新。</div></div>;
}

function Chapter9() {
  const [caseId, setCaseId] = useState<'regular' | 'turbulent' | 'latency'>('regular');
  const draw = useCallback<Draw>((ctx) => { base(ctx); node(ctx, 55, 80, 140, '可表达过程', true, caseId === 'regular' ? C.green : C.orange); node(ctx, 220, 80, 140, 'Blender 草稿', true, caseId === 'turbulent' ? C.red : C.blue); node(ctx, 385, 80, 120, '最终视频', true, caseId === 'regular' ? C.green : C.orange); arrow(ctx, 200, 103, 214, 103); arrow(ctx, 365, 103, 379, 103); label(ctx, caseId === 'regular' ? '在仿真器可表达范围内，流程可自动运行。' : caseId === 'turbulent' ? '复杂湍流等现象受底层仿真器表达能力限制。' : '增加仿真阶段会带来额外推理延迟。', 58, 180, caseId === 'regular' ? C.green : C.red, 15); }, [caseId]);
  return <div><div className="chip-row"><button className={`chip ${caseId === 'regular' ? 'selected' : ''}`} onClick={() => setCaseId('regular')}>适用过程</button><button className={`chip ${caseId === 'turbulent' ? 'selected' : ''}`} onClick={() => setCaseId('turbulent')}>复杂湍流</button><button className={`chip ${caseId === 'latency' ? 'selected' : ''}`} onClick={() => setCaseId('latency')}>推理延迟</button></div><CanvasView draw={draw} label="VideoCoCo 适用边界与局限" /><div className={`feedback ${caseId === 'regular' ? 'good' : 'bad'}`}>{caseId === 'regular' ? '论文方法适合能够由底层模拟器明确实例化的过程。' : caseId === 'turbulent' ? '论文明确指出，高度复杂的湍流现象仍难以零样本合成。' : '论文明确将额外推理延迟列为局限；未报告统一的时延数值。'}</div></div>;
}

const results = {
  phy: { label: 'PhyGenBench', base: 0.475, ours: 0.558, unit: '', max: .65 },
  vb: { label: 'VBench-2.0', base: 52.18, ours: 77.88, unit: '%', max: 100 },
};
function ResultsRace() {
  const [dataset, setDataset] = useState<'phy' | 'vb'>('phy'); const [run, setRun] = useState(false); const r = results[dataset];
  const draw = useCallback<Draw>((ctx, time) => { base(ctx); const progress = run ? Math.min(1, (time % 5000) / 1800) : 0; const bars = [['OmniWeaving', r.base, C.red], ['+ VideoCoCo', r.ours, C.green]] as const; bars.forEach((b, i) => { const y = 78 + i * 75; label(ctx, b[0], 40, y, C.ink, 14); ctx.fillStyle = C.line; ctx.fillRect(170, y - 12, 330, 24); ctx.fillStyle = b[2]; ctx.fillRect(170, y - 12, 330 * (b[1] / r.max) * progress, 24); label(ctx, `${b[1]}${r.unit}`, 475, y - 28, b[2], 14); }); label(ctx, `${r.label} · 越高越好`, 40, 210, C.blue, 15); }, [dataset, run, r]);
  return <div><div className="chip-row"><button className={`chip ${dataset === 'phy' ? 'selected' : ''}`} onClick={() => {setDataset('phy');setRun(false)}}>PhyGenBench</button><button className={`chip ${dataset === 'vb' ? 'selected' : ''}`} onClick={() => {setDataset('vb');setRun(false)}}>VBench-2.0</button><button className="tiny" onClick={() => setRun(v => !v)}>{run ? '重新比较' : '开始比较'}</button></div><CanvasView draw={draw} label="论文基准结果对比" /><div className="feedback good">{dataset === 'phy' ? '平均分由 0.475 提升到 0.558。' : '物理维度平均分由 52.18% 提升到 77.88%。'} 两个指标均为越高越好。</div></div>;
}

const ablations = [['OmniWeaving', .475], ['Tune-Free', .506], ['Full-Tune', .535], ['LoRA-Tune', .558]] as const;
function Ablation() {
  const [active, setActive] = useState(0);
  const draw = useCallback<Draw>((ctx) => { base(ctx); ablations.forEach((a, i) => { const y = 58 + i * 42; label(ctx, a[0], 34, y, i === active ? C.blue : C.ink, 13); ctx.fillStyle = C.line; ctx.fillRect(145, y - 9, 350, 18); ctx.fillStyle = i === active ? C.green : C.blue; ctx.fillRect(145, y - 9, 350 * (a[1] / .60), 18); label(ctx, a[1].toFixed(3), 500, y, i === active ? C.green : C.muted, 13); }); }, [active]);
  return <div><div className="chip-row">{ablations.map((a, i) => <button key={a[0]} className={`chip ${active === i ? 'selected' : ''}`} onClick={() => setActive(i)}>{a[0]}</button>)}</div><CanvasView draw={draw} label="PhyGenBench 编辑器适配消融" /><div className="feedback good">{active === 1 ? '无需调参的草稿条件已从 0.475 提升到 0.506，隔离出可执行草稿的贡献。' : active === 3 ? '在论文测试的三种适配方式中，LoRA 取得最高平均分 0.558。' : `${ablations[active][0]} 的平均分为 ${ablations[active][1].toFixed(3)}。`} 结论只适用于该消融设置。</div></div>;
}

export const VideoCoCoLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  if (chapterId === 'hero') return <HeroView side={moduleId === 'old' ? 'old' : 'new'} />;
  const chapter = Number(chapterId.replace('chap-', '')) || 1;
  if (moduleId === 'ana') return <AnalogyView chapter={chapter} />;
  if (chapter === 1) return <Chapter1 />;
  if (chapter === 2) return <Chapter2 />;
  if (chapter === 3) return <Chapter3 />;
  if (chapter === 4) return <Chapter4 />;
  if (chapter === 5) return <Chapter5 />;
  if (chapter === 6) return <Chapter6 />;
  if (chapter === 7) return <Chapter7 />;
  if (chapter === 8) return <Chapter8 />;
  if (chapter === 9) return <Chapter9 />;
  if (moduleId === '10.2') return <Ablation />;
  return <ResultsRace />;
};

export default VideoCoCoLab;
