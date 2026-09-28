import React, { useEffect, useRef, useState } from 'react';

type Paint = (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
type CanvasProps = {
  width: number;
  height: number;
  label: string;
  paint: Paint;
  onPointerDown?: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove?: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp?: (event: React.PointerEvent<HTMLCanvasElement>) => void;
};

const C = {
  bg: '#f5f8f0', pale: '#b8c9a7', deep: '#76906a', brown: '#92400e', blue: '#27446e',
  green: '#228d5c', red: '#c43f52', orange: '#f07e47', purple: '#7c3aed', ink: '#21324a',
  muted: '#68778f', border: '#d7deea', white: '#ffffff',
};

export function PaperCanvas({ width, height, label, paint, onPointerDown, onPointerMove, onPointerUp }: CanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    paint(ctx, width, height);
  }, [width, height, paint]);
  return <canvas ref={ref} className="lwf-canvas" width={width} height={height} aria-label={label} role="img" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} />;
}

function base(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
}
function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, stroke = C.border) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
}
function path(ctx: CanvasRenderingContext2D, points: Array<[number, number]>, color = C.blue, width = 3) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}
function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, stroke = C.white) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
}
function pill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, color: string, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, Math.max(0, w), 12);
  ctx.restore();
}
function feedback(text: string, state: 'neutral' | 'good' | 'bad' = 'neutral') {
  return <p className={`lwf-feedback ${state}`} aria-live="polite">{text}</p>;
}
function button(label: string, selected: boolean, onClick: () => void, disabled = false) {
  return <button type="button" className={`lwf-button${selected ? ' selected' : ''}`} aria-pressed={selected} onClick={onClick} disabled={disabled}>{label}</button>;
}
function rows(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, values: number[], colors: string[]) {
  values.forEach((v, i) => {
    box(ctx, x, y + i * 38, width, 20, C.white);
    pill(ctx, x + 1, y + 4 + i * 38, (width - 2) * Math.max(0, Math.min(1, v)), colors[i] || C.blue);
  });
}

export function LwfHero({ moduleId }: { chapterId: string; moduleId: string }) {
  const isNew = moduleId === 'new';
  const paint: Paint = (ctx, w, h) => {
    base(ctx, w, h);
    box(ctx, 28, 30, w - 56, h - 60, C.white, C.pale);
    box(ctx, 48, 48, 176, 44, '#eef3e8');
    box(ctx, 48, 104, 176, 36, '#eef3e8');
    box(ctx, 276, 54, 94, 32, isNew ? '#e8f4ec' : '#fbebed', isNew ? C.green : C.red);
    box(ctx, 402, 54, 94, 32, '#e9eef5', C.blue);
    path(ctx, [[224, 70], [276, 70]], C.blue, 4);
    path(ctx, [[370, 70], [402, 70]], isNew ? C.green : C.red, 4);
    path(ctx, [[224, 122], [448, 122]], isNew ? C.green : C.red, 3);
    dot(ctx, 250, 70, 7, C.orange);
  };
  return <PaperCanvas width={520} height={166} label={isNew ? '新输入同时送入旧响应约束和新任务监督' : '只用新任务输入微调时旧任务表现存在退化风险'} paint={paint} />;
}

type Point = [number, number];
type AnalogyAction = 'write' | 'circle' | 'underline' | 'divide' | 'highlight' | 'bracket' | 'weight' | 'branch' | 'move-card' | 'check';
type AnalogyScene = { action: AnalogyAction; label: string; points?: Point[]; color?: string; target?: Point; };

const analogyScenes: AnalogyScene[] = [
  { action: 'write', label: '铅笔在词典新的一行写下词条', points: [[324, 101], [414, 101]], color: C.green },
  { action: 'circle', label: '铅笔圈出正在选择的校订路线', target: [150, 66], color: C.blue },
  { action: 'underline', label: '铅笔在新例句旁划出旧模型的批注', points: [[332, 83], [414, 83]], color: C.purple },
  { action: 'divide', label: '铅笔为新任务在词典页上划出一栏', points: [[291, 34], [291, 106]], color: C.blue },
  { action: 'highlight', label: '铅笔轻轻标亮一条相关词义', points: [[338, 64], [418, 64]], color: C.orange },
  { action: 'bracket', label: '铅笔把三项校订意见括在一起', points: [[306, 47], [294, 47], [294, 104], [306, 104]], color: C.purple },
  { action: 'weight', label: '铅笔加重旧批注的下划线', points: [[80, 47], [174, 47]], color: C.purple },
  { action: 'branch', label: '铅笔从共享释义处画出两个任务分支', points: [[291, 65], [316, 65], [316, 48], [354, 48], [316, 48], [316, 84], [354, 84]], color: C.green },
  { action: 'move-card', label: '把新例句卡从旧语境旁移远', target: [418, 84], color: C.orange },
  { action: 'check', label: '铅笔在核对过的结果旁画上勾', points: [[433, 93], [445, 105], [466, 77]], color: C.green },
];

function roundedBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawDictionary(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, 560, 140);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, 560, 140);
  ctx.save();
  ctx.shadowColor = 'rgba(33, 50, 74, 0.10)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  roundedBox(ctx, 54, 22, 452, 96, 10, C.white);
  ctx.restore();
  ctx.strokeStyle = C.pale;
  ctx.lineWidth = 1.5;
  roundedBox(ctx, 54, 22, 452, 96, 10, 'rgba(255,255,255,0)', C.pale);
  ctx.fillStyle = '#eef3e8';
  ctx.fillRect(58, 27, 216, 86);
  ctx.fillStyle = '#fbfcf9';
  ctx.fillRect(286, 27, 216, 86);
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(280, 29);
  ctx.quadraticCurveTo(277, 70, 280, 111);
  ctx.stroke();
  [47, 66, 85, 104].forEach((y, i) => {
    ctx.strokeStyle = i === 1 ? '#c7d2df' : '#dce3e9';
    ctx.lineWidth = i === 1 ? 2 : 1.5;
    ctx.beginPath();
    ctx.moveTo(76, y);
    ctx.lineTo(236 - (i % 2) * 24, y);
    ctx.moveTo(316, y);
    ctx.lineTo(474 - (i % 2) * 20, y);
    ctx.stroke();
  });
  ctx.fillStyle = '#e5ecdf';
  ctx.fillRect(500, 38, 7, 18);
  ctx.fillStyle = '#f2e7dc';
  ctx.fillRect(500, 60, 7, 18);
}

function progressiveStroke(ctx: CanvasRenderingContext2D, points: Point[], progress: number, color: string, width: number, alpha = 1): Point {
  const lengths = points.slice(1).map((point, i) => Math.hypot(point[0] - points[i][0], point[1] - points[i][1]));
  const total = lengths.reduce((sum, length) => sum + length, 0) || 1;
  let remaining = total * progress;
  let endpoint: Point = points[0];
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 0; i < lengths.length; i += 1) {
    const from = points[i];
    const to = points[i + 1];
    const length = lengths[i] || 1;
    const ratio = Math.max(0, Math.min(1, remaining / length));
    endpoint = [from[0] + (to[0] - from[0]) * ratio, from[1] + (to[1] - from[1]) * ratio];
    ctx.lineTo(endpoint[0], endpoint[1]);
    remaining -= length;
    if (ratio < 1) break;
  }
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.globalAlpha = 1;
  return endpoint;
}

function drawPencil(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, angle = -0.18) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.lineCap = 'round';
  ctx.strokeStyle = C.brown;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-33, 0);
  ctx.lineTo(-2, 0);
  ctx.stroke();
  ctx.strokeStyle = '#c98a43';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-30, -2.3);
  ctx.lineTo(-7, -2.3);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-2, -3.4);
  ctx.lineTo(8, 0);
  ctx.lineTo(-2, 3.4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function circlePoints([cx, cy]: Point): Point[] {
  return Array.from({ length: 49 }, (_, i) => {
    const angle = -Math.PI / 2 + (i / 48) * Math.PI * 2;
    return [cx + Math.cos(angle) * 19, cy + Math.sin(angle) * 12];
  });
}

function starPoints([cx, cy]: Point): Point[] {
  return Array.from({ length: 11 }, (_, i) => {
    const angle = -Math.PI / 2 + (i / 10) * Math.PI * 2;
    const radius = i % 2 === 0 ? 10 : 4.5;
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
  });
}

function drawExampleCard(ctx: CanvasRenderingContext2D, x: number, y: number) {
  roundedBox(ctx, x, y, 58, 28, 4, '#fff9ef', '#e6c99f');
  ctx.strokeStyle = '#d7c5a7';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 9, y + 9);
  ctx.lineTo(x + 48, y + 9);
  ctx.moveTo(x + 9, y + 17);
  ctx.lineTo(x + 39, y + 17);
  ctx.stroke();
}

export function DictionaryAnalogy({ chapterId }: { chapterId: string; moduleId: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const chapter = Math.max(0, Math.min(9, Number(chapterId.replace('chap-', '')) - 1 || 0));
    const scene = analogyScenes[chapter];
    const duration = 1050;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let elapsed = 0;
    let lastTime = 0;
    let complete = false;
    const render = (progress: number) => {
      drawDictionary(ctx);
      const eased = 1 - Math.pow(1 - progress, 3);
      let tip: Point = [440, 107];
      if (scene.action === 'move-card') {
        const [targetX, targetY] = scene.target || [360, 98];
        const x = 326 + (targetX - 326) * eased;
        const y = 82 + (targetY - 82) * eased;
        drawExampleCard(ctx, x, y);
      } else {
        let points = scene.points || [];
        if (scene.action === 'circle' && scene.target) points = circlePoints(scene.target);
        const isHighlight = scene.action === 'highlight';
        if (isHighlight) {
          tip = progressiveStroke(ctx, points, eased, scene.color || C.orange, 9, 0.28);
          progressiveStroke(ctx, points, eased, '#d29a43', 1.6, 0.85);
        } else if (scene.action === 'weight') {
          tip = progressiveStroke(ctx, points, eased, scene.color || C.purple, 1.5 + eased * 3.5);
        } else {
          tip = progressiveStroke(ctx, points, eased, scene.color || C.blue, scene.action === 'check' ? 3.5 : 2.8);
        }
        drawPencil(ctx, tip[0], tip[1], scene.color || C.blue, scene.action === 'divide' ? Math.PI / 2 : -0.18);
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    if (reduced) {
      render(1);
      complete = true;
    }
    const tick = (time: number) => {
      if (!lastTime) lastTime = time;
      elapsed += Math.min(80, time - lastTime);
      lastTime = time;
      const progress = Math.min(1, elapsed / duration);
      render(progress);
      if (progress < 1) frame = window.requestAnimationFrame(tick);
      else {
        frame = 0;
        complete = true;
      }
    };
    const Observer = (globalThis as unknown as { IntersectionObserver?: typeof IntersectionObserver }).IntersectionObserver;
    let observer: IntersectionObserver | undefined;
    if (Observer) {
      observer = new Observer((entries) => {
        const visible = entries[0]?.isIntersecting ?? true;
        if (visible && !reduced && !complete && !frame) frame = window.requestAnimationFrame(tick);
        if (!visible && frame) {
          window.cancelAnimationFrame(frame);
          frame = 0;
          lastTime = 0;
        }
      }, { threshold: 0.18 });
      observer.observe(canvas);
    } else if (!reduced) {
      frame = window.requestAnimationFrame(tick);
    }
    return () => {
      observer?.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [chapterId]);
  const chapter = Math.max(0, Math.min(9, Number(chapterId.replace('chap-', '')) - 1 || 0));
  return <canvas ref={ref} className="lwf-canvas analogy-canvas" width={560} height={140} aria-label={analogyScenes[chapter].label} role="img" />;
}

export function ProblemCompare({}: { chapterId: string; moduleId: string }) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!running) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(1);
      setRunning(false);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (time: number) => {
      const p = Math.min(1, (time - start) / 1800);
      setProgress(p);
      if (p < 1) frame = window.requestAnimationFrame(tick);
      else setRunning(false);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [running]);
  const paint: Paint = (ctx, w, h) => {
    base(ctx, w, h);
    const eased = 1 - Math.pow(1 - progress, 3);
    const panelW = (w - 54) / 2;
    const panels = [{ x: 18, name: '直接微调', color: C.red, old: 1 - 0.58 * eased, fresh: 0.72 * eased }, { x: 36 + panelW, name: 'LwF', color: C.green, old: 1 - 0.20 * eased, fresh: 0.70 * eased }];
    panels.forEach((p) => {
      box(ctx, p.x, 26, panelW, h - 52, C.white, p.color);
      rows(ctx, p.x + 14, 100, panelW - 28, [p.old], [p.color]);
      rows(ctx, p.x + 14, 158, panelW - 28, [p.fresh], [C.blue]);
    });
  };
  return (
    <div className="lwf-lab">
      <PaperCanvas width={760} height={230} label="同一起点下比较直接微调和 LwF 的定性新旧任务变化；条形为教学示意" paint={paint} />
      <div className="lwf-legend">
        <span><i className="lwf-swatch failure" />左侧：直接微调</span>
        <span><i className="lwf-swatch success" />右侧：LwF</span>
        <span>每个面板上栏为旧任务，下栏为新任务</span>
      </div>
      <div className="lwf-control-row">
        <button className="lwf-button selected" type="button" disabled={running} onClick={() => { setProgress(0); setRunning(true); }}>
          {running ? '对照进行中…' : progress === 1 ? '再看一次' : '开始对照'}
        </button>
        <button className="lwf-button" type="button" onClick={() => { setRunning(false); setProgress(0); }}>重置</button>
        <span className="lwf-note">条形为教学示意，不是论文测量值。</span>
      </div>
      {feedback(
        running
          ? '两种方法都在学习新任务；观察旧任务条形如何变化。'
          : progress < 1
            ? '两边都从同一个旧模型出发；开始后新任务学习与旧任务保持将逐渐分开。'
            : '对照结束：两边都学新任务；LwF 多了旧响应约束，示意中的旧能力损失较小。',
        progress === 1 ? 'good' : 'neutral'
      )}
    </div>
  );
}

const methods = {
  feature: { label: '特征提取', old: true, needsOld: false, text: '旧表示保持不变，但共享层不能专门适配新任务。' },
  finetune: { label: 'Fine-tuning', old: false, needsOld: false, text: '共享层随新任务更新，旧任务表现可能下降。' },
  joint: { label: '联合训练', old: true, needsOld: true, text: '同时使用旧、新数据与标签；不满足旧数据不可用的设定。' },
  lwf: { label: 'LwF', old: true, needsOld: false, text: '只用新任务输入和标签；旧模型响应作为旧任务约束。' },
} as const;
type MethodKey = keyof typeof methods;
export function MethodMap({}: { chapterId: string; moduleId: string }) {
  const [method, setMethod] = useState<MethodKey>('finetune');
  const selected = methods[method];
  const paint: Paint = (ctx, w, h) => {
    base(ctx, w, h);
    box(ctx, 64, 72, 94, 64, selected.needsOld ? '#e8f4ec' : '#f1f3f4', selected.needsOld ? C.green : C.border);
    box(ctx, 332, 72, 94, 64, '#e8f4ec', C.green);
    box(ctx, 598, 72, 94, 64, selected.old ? '#e8f4ec' : '#fbebed', selected.old ? C.green : C.red);
    const oldLine = selected.needsOld ? C.green : C.muted;
    path(ctx, [[158, 104], [598, 104]], oldLine, selected.needsOld ? 4 : 2);
    path(ctx, [[426, 104], [598, 104]], C.blue, 4);
    if (method === 'lwf') {
      box(ctx, 488, 152, 170, 38, '#f4efff', C.purple);
      path(ctx, [[380, 136], [380, 171], [488, 171]], C.purple, 3);
    }
    dot(ctx, 380, 104, 7, C.orange);
  };
  return <div className="lwf-lab"><div className="lwf-control-row">{(Object.keys(methods) as MethodKey[]).map((key) => button(methods[key].label, method === key, () => setMethod(key)))}</div><PaperCanvas width={760} height={220} label={`当前选择${selected.label}，显示旧新数据与共享参数的训练路径`} paint={paint} /><p className="lwf-note">图示顺序：左侧旧数据，中间新数据，右侧共享 CNN；紫色连线表示 LwF 的旧模型响应。</p>{feedback(selected.text, method === 'lwf' ? 'good' : method === 'finetune' ? 'bad' : 'neutral')}</div>;
}

const signals = {
  oldExamples: { label: '旧样本回放', text: '旧图像与标签在此设定中不可用。', state: 'bad' as const },
  teacherOnNew: { label: '新输入上的旧响应', text: 'LwF 用新图像运行旧模型，记录旧任务概率作为软目标。', state: 'good' as const },
  newLabel: { label: '新任务标签', text: '真实标签直接监督新任务输出；它不能代替旧响应约束。', state: 'neutral' as const },
};
type SignalKey = keyof typeof signals;
export function SignalSource({}: { chapterId: string; moduleId: string }) {
  const [signal, setSignal] = useState<SignalKey>('oldExamples');
  const selected = signals[signal];
  const paint: Paint = (ctx, w, h) => {
    base(ctx, w, h);
    box(ctx, 30, 84, 132, 56, '#e9eef5', C.blue);
    box(ctx, 300, 52, 150, 118, C.white, C.deep);
    box(ctx, 570, 42, 154, 48, signal === 'teacherOnNew' ? '#f4efff' : '#f1f3f4', signal === 'teacherOnNew' ? C.purple : C.border);
    box(ctx, 570, 112, 154, 48, signal === 'newLabel' ? '#e8f4ec' : C.white, signal === 'newLabel' ? C.green : C.border);
    if (signal === 'teacherOnNew') path(ctx, [[162, 112], [300, 112], [450, 112], [510, 112], [510, 66], [570, 66]], C.purple, 4);
    else if (signal === 'newLabel') path(ctx, [[162, 112], [300, 112], [510, 112], [570, 136]], C.green, 4);
    else {
      box(ctx, 44, 34, 116, 32, '#fbebed', C.red);
      path(ctx, [[160, 50], [240, 50], [240, 82], [300, 82]], C.red, 2);
    }
    path(ctx, [[450, 95], [512, 95], [512, 66]], C.muted, 2);
    path(ctx, [[450, 126], [512, 126], [512, 136]], C.blue, 2);
  };
  return <div className="lwf-lab"><div className="lwf-control-row">{(Object.keys(signals) as SignalKey[]).map((key) => button(signals[key].label, signal === key, () => setSignal(key)))}</div><PaperCanvas width={760} height={220} label="选择训练信号并观察旧模型响应与新标签的不同路径" paint={paint} /><p className="lwf-note">图示顺序：新输入 → 旧模型与当前模型 → 旧响应 / 新标签。</p>{feedback(selected.text, selected.state)}</div>;
}

const phases = [
  { title: '记录响应', detail: '旧模型先在新任务图像上给出旧任务概率。', highlight: [] as string[], train: [] as string[] },
  { title: '新增任务头', detail: '为新类别随机初始化任务专属参数 θ_n；此步是在准备新头，不代表参数已开始更新。', highlight: ['new'], train: [] as string[] },
  { title: 'Warm-up', detail: '冻结 θ_s 与 θ_o，只训练新头 θ_n。', highlight: ['new'], train: ['new'] },
  { title: '联合优化', detail: '更新 θ_s、θ_o、θ_n，同时匹配旧响应并学习新标签。', highlight: [], train: ['shared', 'old', 'new'] },
];
export function TrainingSteps({}: { chapterId: string; moduleId: string }) {
  const [step, setStep] = useState(0);
  const phase = phases[step];
  const paint: Paint = (ctx, w, h) => {
    base(ctx, w, h);
    const nodes = [{ id: 'shared', x: 40, label: '共享层' }, { id: 'old', x: 300, label: '旧任务头' }, { id: 'new', x: 560, label: '新任务头' }];
    nodes.forEach((n) => {
      const training = phase.train.includes(n.id);
      const selected = phase.highlight.includes(n.id);
      box(ctx, n.x, 76, 152, 68, training ? '#e8f4ec' : selected ? '#e9eef5' : C.white, training ? C.green : selected ? C.blue : C.border);
    });
    path(ctx, [[192, 110], [300, 110]], step === 3 ? C.green : C.blue, 3);
    path(ctx, [[452, 110], [560, 110]], step === 3 ? C.green : C.blue, 3);
    if (step === 0) dot(ctx, 266, 110, 7, C.purple);
  };
  return (
    <div className="lwf-lab">
      <p className="lwf-note">阶段 {step + 1} / 4：{phase.title}</p>
      <PaperCanvas width={760} height={220} label={'训练阶段 ' + (step + 1) + '：' + phase.detail} paint={paint} />
      <div className="lwf-legend">
        <span>左：共享层 θ_s · 中：旧头 θ_o · 右：新头 θ_n</span>
        <span>绿框=正在更新 · 蓝框=当前新增 · 紫点=旧模型响应</span>
      </div>
      <div className="lwf-control-row">
        <button className="lwf-button" type="button" disabled={step === 0} onClick={() => setStep((v) => Math.max(0, v - 1))}>上一步</button>
        <button className="lwf-button selected" type="button" disabled={step === phases.length - 1} onClick={() => setStep((v) => Math.min(phases.length - 1, v + 1))}>
          {step === phases.length - 1 ? '已完成' : '下一步'}
        </button>
        <button className="lwf-button" type="button" onClick={() => setStep(0)}>重置</button>
      </div>
      {feedback(phase.detail, step === 3 ? 'good' : 'neutral')}
    </div>
  );
}

function softmax(values: number[]) {
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
}
export function TemperatureLab({}: { chapterId: string; moduleId: string }) {
  const [temperature, setTemperature] = useState(2);
  const probs = softmax([2, 1, 0].map((v) => v / temperature));
  const paint: Paint = (ctx, w, h) => {
    base(ctx, w, h);
    [2, 1, 0].forEach((v, i) => {
      const y = 72 + i * 42;
      box(ctx, 64, y, 250, 16, C.white);
      pill(ctx, 65, y + 2, 240 * (v / 2), C.blue);
      box(ctx, 382, y, 280, 16, C.white);
      pill(ctx, 383, y + 2, 268 * probs[i], C.green);
    });
  };
  return <div className="lwf-lab"><div className="lwf-slider-row"><label htmlFor="lwf-temperature">温度 T：<strong>{temperature}</strong></label><input id="lwf-temperature" type="range" min="1" max="4" step="1" value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} /><span>{temperature}</span></div><PaperCanvas width={760} height={230} label={`教学示意分布，温度 ${temperature}，类别概率 ${probs.map((p) => (p * 100).toFixed(1) + ' percent').join(', ')}`} paint={paint} /><div className="lwf-probability-list" aria-label="示意类别概率">{probs.map((p, i) => <span key={i}>类别 {i + 1} · logit {[2, 1, 0][i]} · pT {(p * 100).toFixed(1)}%</span>)}</div><p className="lwf-note">图中左列依次对应固定示意 logits [2, 1, 0]，右列为温度归一化概率；这些概率不来自论文。论文实验使用 T=2。</p>{feedback(temperature === 2 ? 'T=2 是论文实验设置；升高温度会让较小响应的相对权重提高。' : '温度变化会平滑或锐化示意分布；这不是论文报告的准确率。', temperature === 2 ? 'good' : 'neutral')}</div>;
}

const lossParts = {
  old: { label: 'L_old', text: '让当前旧任务输出接近旧模型在同一新输入上的响应。', color: C.purple },
  fresh: { label: 'L_new', text: '用新任务真实标签监督新任务输出。', color: C.green },
  reg: { label: 'R', text: '论文加入普通 weight decay；它不是 LwF 的参数距离主项。', color: C.orange },
};
type LossKey = keyof typeof lossParts;
export function LossLab({}: { chapterId: string; moduleId: string }) {
  const [part, setPart] = useState<LossKey>('old');
  const selected = lossParts[part];
  const paint: Paint = (ctx, w, h) => {
    base(ctx, w, h);
    box(ctx, 38, 30, 190, 44, part === 'old' ? '#f4efff' : C.white, part === 'old' ? C.purple : C.border);
    box(ctx, 38, 88, 190, 44, part === 'fresh' ? '#e8f4ec' : C.white, part === 'fresh' ? C.green : C.border);
    box(ctx, 38, 146, 190, 44, part === 'reg' ? '#fff0e8' : C.white, part === 'reg' ? C.orange : C.border);
    box(ctx, 326, 76, 130, 72, C.white, selected.color);
    box(ctx, 552, 83, 170, 58, C.white, C.blue);
    const sourceY = part === 'old' ? 52 : part === 'fresh' ? 110 : 168;
    path(ctx, [[228, sourceY], [272, sourceY], [272, 112], [326, 112]], selected.color, 3);
    path(ctx, [[456, 112], [552, 112]], C.blue, 3);
  };
  return <div className="lwf-lab"><div className="lwf-control-row">{(Object.keys(lossParts) as LossKey[]).map((key) => button(lossParts[key].label, part === key, () => setPart(key)))}</div><div className="lwf-equation">L<sub>total</sub> = λ<sub>o</sub>L<sub>old</sub> + L<sub>new</sub> + R</div><PaperCanvas width={760} height={220} label={`选择损失项 ${selected.label} 查看它如何进入总目标`} paint={paint} /><p className="lwf-note">左侧三行依次表示旧模型软响应、新任务真实标签与 weight decay；中间为总损失，右侧为参数更新。高亮线表示当前点选项。</p>{feedback(selected.text, part === 'old' ? 'good' : 'neutral')}</div>;
}

export function LambdaLab({}: { chapterId: string; moduleId: string }) {
  const [lambda, setLambda] = useState(1);
  const share = lambda / (lambda + 1);
  const paint: Paint = (ctx, w, h) => {
    base(ctx, w, h);
    box(ctx, 272, 28, 420, 28, C.white);
    pill(ctx, 273, 30, 418 * share, C.purple);
    box(ctx, 272, 104, 420, 28, C.white);
    pill(ctx, 273, 106, 418 * (1 - share), C.blue);
  };
  let message = '旧响应项相对权重更大；这不等于旧准确率必然更高。';
  if (lambda === 0) message = '旧响应项不加权，训练目标更偏向新任务标签。';
  else if (lambda < 1) message = '旧响应约束较轻，新任务目标的相对比重较大。';
  else if (lambda === 1) message = '论文多数实验使用 λ_o=1；这是报告设置，不是通用最优值。';
  const paintRef = paint;
  return <div className="lwf-lab"><div className="lwf-slider-row"><label htmlFor="lwf-lambda">旧响应权重 λ<sub>o</sub></label><input id="lwf-lambda" type="range" min="0" max="2" step="0.25" value={lambda} onChange={(e) => setLambda(Number(e.target.value))} /><strong>{lambda.toFixed(2)}</strong></div><PaperCanvas width={760} height={230} label={`权重示意，旧响应相对份额 ${(share * 100).toFixed(0)} percent`} paint={paintRef} /><div className="lwf-legend"><span><i className="lwf-swatch auxiliary" />紫色：λ_o L_old</span><span><i className="lwf-swatch guidance" />蓝色：L_new（系数 1）</span></div><p className="lwf-note">条形只表示 λ<sub>o</sub> 与固定新损失系数 1 的权重比例，不表示模型准确率。</p>{feedback(message, lambda === 1 ? 'good' : 'neutral')}</div>;
}

const archNodes = {
  shared: { label: '共享层', detail: 'θ_s 由不同任务共用；joint-optimize 时会更新。', x: 68, y: 92 },
  oldHead: { label: '旧任务头', detail: 'θ_o 输出旧任务预测；只在 warm-up 阶段冻结。', x: 338, y: 48 },
  newHead: { label: '新任务头', detail: 'θ_n 是新增分类权重；warm-up 与联合阶段均训练。', x: 338, y: 140 },
};
type ArchKey = keyof typeof archNodes;
export function ArchitectureMap({}: { chapterId: string; moduleId: string }) {
  const [node, setNode] = useState<ArchKey>('shared');
  const selected = archNodes[node];
  const paint: Paint = (ctx, w, h) => {
    base(ctx, w, h);
    const activeColor = node === 'oldHead' ? C.purple : node === 'newHead' ? C.green : C.blue;
    box(ctx, 28, 94, 112, 50, '#e9eef5', C.blue);
    box(ctx, 210, 94, 134, 50, node === 'shared' ? '#e9eef5' : C.white, node === 'shared' ? C.blue : C.border);
    box(ctx, 456, 34, 154, 48, node === 'oldHead' ? '#f4efff' : C.white, node === 'oldHead' ? C.purple : C.border);
    box(ctx, 456, 128, 154, 48, node === 'newHead' ? '#e8f4ec' : C.white, node === 'newHead' ? C.green : C.border);
    path(ctx, [[140, 119], [210, 119]], node === 'shared' ? C.blue : C.muted, 4);
    path(ctx, [[344, 110], [400, 110], [400, 58], [456, 58]], node === 'oldHead' ? activeColor : C.border, 4);
    path(ctx, [[344, 128], [400, 128], [400, 152], [456, 152]], node === 'newHead' ? activeColor : C.border, 4);
  };
  return <div className="lwf-lab"><div className="lwf-control-row">{(Object.keys(archNodes) as ArchKey[]).map((key) => button(archNodes[key].label, node === key, () => setNode(key)))}</div><PaperCanvas width={760} height={220} label={`网络结构，当前选中${selected.label}，其信息流路径已高亮`} paint={paint} /><div className="lwf-detail"><strong>{selected.label}</strong><span>{selected.detail}</span></div>{feedback('点选不同节点，观察共享路径与任务专属输出如何分开。', 'neutral')}</div>;
}

const designs = [
  { label: '输出层', old: 54.7, fresh: 57.7, kind: 'base' },
  { label: '最后隐层', old: 54.7, fresh: 56.2, kind: 'deep' },
  { label: '倒数第二隐层', old: 54.6, fresh: 57.1, kind: 'deep2' },
  { label: '网络扩展', old: 57.0, fresh: 54.0, kind: 'expand' },
  { label: '扩展 + LwF', old: 54.4, fresh: 57.0, kind: 'expandLwf' },
  { label: '共享层学习率 10%', old: 52.2, fresh: 54.9, kind: 'lr' },
] as const;
export function DesignAblation({}: { chapterId: string; moduleId: string }) {
  const [index, setIndex] = useState(0);
  const item = designs[index];
  const paint: Paint = (ctx, w, h) => {
    base(ctx, w, h);
    box(ctx, 42, 72, 116, 70, C.white, C.border);
    if (item.kind === 'expand' || item.kind === 'expandLwf') {
      for (let i = 0; i < 3; i++) box(ctx, 260 + i * 22, 70 + i * 10, 56, 68, item.kind === 'expandLwf' ? '#e8f4ec' : '#fff0e8', item.kind === 'expandLwf' ? C.green : C.orange);
    } else {
      const count = item.kind === 'base' ? 1 : item.kind === 'deep' ? 2 : 3;
      for (let i = 0; i < count; i++) box(ctx, 260 + i * 72, 78, 58, 56, '#eef3e8', C.deep);
    }
    path(ctx, [[158, 106], [260, 106]], C.blue, 3);
    box(ctx, 568, 66, 126, 20, C.white);
    pill(ctx, 569, 68, 124 * (item.old / 65), C.blue);
    box(ctx, 568, 124, 126, 20, C.white);
    pill(ctx, 569, 126, 124 * (item.fresh / 65), C.green);
  };
  return <div className="lwf-lab"><div className="lwf-control-row">{designs.map((d, i) => button(d.label, index === i, () => setIndex(i)))}</div><PaperCanvas width={760} height={230} label={`${item.label}：ImageNet accuracy ${item.old.toFixed(1)} percent，CUB accuracy ${item.fresh.toFixed(1)} percent`} paint={paint} /><div className="lwf-legend"><span><i className="lwf-swatch guidance" />蓝条：ImageNet 旧任务</span><span><i className="lwf-swatch success" />绿条：CUB 新任务</span></div><div className="lwf-detail"><strong>{item.label}</strong><span>ImageNet 旧任务 {item.old.toFixed(1)}% · CUB 新任务 {item.fresh.toFixed(1)}%；Table 2(a) 原值。</span></div>{feedback(index === 0 ? '这是 Table 2(a) 的主设置。其他结构的表现有取舍，没有一种扩展设计在所有指标上都更好。' : '这是 Table 2(a) 的对照结果；结论限定在该任务对、网络和训练设置。', index === 0 ? 'good' : 'neutral')}</div>;
}

function classify(x: number) { return x < 0.31 ? 'near' : x > 0.69 ? 'far' : 'unknown'; }
export function DomainDrag({}: { chapterId: string; moduleId: string }) {
  const [x, setX] = useState(0.22);
  const [dragging, setDragging] = useState(false);
  const relation = classify(x);
  const relationText = relation === 'near' ? '新输入可能更能代表旧任务，但不能据此保证保留性能。' : relation === 'far' ? '新输入与旧域差异大时，旧响应未必能保护旧域。' : '输入代表性不确定，不能从一个示意点推断准确率。';
  const handleMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const next = Math.max(0.08, Math.min(0.92, (event.clientX - rect.left) / rect.width));
    setX(next);
  };
  const paint: Paint = (ctx, w, h) => {
    base(ctx, w, h);
    box(ctx, 36, 54, 250, 118, '#eef3e8', C.pale);
    box(ctx, 474, 54, 250, 118, '#e9eef5', C.border);
    for (let i = 0; i < 6; i++) dot(ctx, 90 + (i % 3) * 56, 108 + Math.floor(i / 3) * 28, 6, C.deep);
    const px = 80 + x * (w - 160);
    path(ctx, [[286, 112], [px, 112]], relation === 'near' ? C.green : relation === 'far' ? C.red : C.blue, 2);
    dot(ctx, px, 112, 12, relation === 'near' ? C.green : relation === 'far' ? C.red : C.blue, C.white);
  };
  const setRelation = (value: 'near' | 'unknown' | 'far') => setX(value === 'near' ? 0.22 : value === 'unknown' ? 0.5 : 0.78);
  return <div className="lwf-lab"><div className="lwf-legend"><span><i className="lwf-swatch stable" />旧域样本</span><span><i className="lwf-swatch current" />当前新输入</span></div><PaperCanvas width={760} height={230} label={`示意新输入与旧域关系：${relationText}`} paint={paint} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDragging(true); handleMove(e); }} onPointerMove={handleMove} onPointerUp={() => setDragging(false)} /><div className="lwf-control-row"><button className="lwf-button" type="button" onClick={() => setRelation('near')}>更接近</button><button className="lwf-button" type="button" onClick={() => setRelation('unknown')}>不确定</button><button className="lwf-button" type="button" onClick={() => setRelation('far')}>差异很大</button><button className="lwf-button" type="button" onClick={() => setRelation('near')}>重置</button></div><p className="lwf-note">拖动或使用按钮调整示意关系；横坐标不是论文的相似度量表。</p>{feedback(relationText, relation === 'near' ? 'good' : relation === 'far' ? 'bad' : 'neutral')}</div>;
}

const resultRows = [
  { name: 'LwF', old: 54.7, fresh: 57.7, color: C.green },
  { name: 'Fine-tuning', old: 50.9, fresh: 57.0, color: C.blue },
  { name: 'Feature extraction', old: 57.0, fresh: 52.5, color: C.blue },
  { name: 'Joint training', old: 55.3, fresh: 56.6, color: C.blue },
];
export function ResultRace({}: { chapterId: string; moduleId: string }) {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<'ready' | 'running' | 'done'>('ready');
  useEffect(() => {
    if (status !== 'running') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStep(resultRows.length);
      setStatus('done');
      return;
    }
    const timer = window.setTimeout(() => setStep((v) => Math.min(resultRows.length, v + 1)), 480);
    return () => window.clearTimeout(timer);
  }, [status, step]);
  useEffect(() => { if (step >= resultRows.length && status === 'running') setStatus('done'); }, [step, status]);
  const paint: Paint = (ctx, w, h) => {
    base(ctx, w, h);
    resultRows.forEach((item, i) => {
      if (i >= step) return;
      const y = 54 + i * 43;
      box(ctx, 154, y, 148, 18, C.white);
      pill(ctx, 155, y + 3, 146 * item.old / 65, item.color);
      box(ctx, 496, y, 148, 18, C.white);
      pill(ctx, 497, y + 3, 146 * item.fresh / 65, item.color);
    });
  };
  return (
    <div className="lwf-lab">
      <div className="lwf-control-row">
        <button className="lwf-button selected" type="button" onClick={() => { setStep(0); setStatus('running'); }} disabled={status === 'running'}>
          {status === 'ready' ? '开始比较' : status === 'running' ? '逐项显示中…' : '重播结果'}
        </button>
        <span className="lwf-note">ImageNet→CUB · AlexNet · accuracy</span>
      </div>
      <PaperCanvas width={760} height={230} label="ImageNet 旧任务与 CUB 新任务的四种方法准确率对比" paint={paint} />
      <div className="lwf-result-table">
        <div className="lwf-result-head"><span>方法</span><span>ImageNet 旧任务</span><span>CUB 新任务</span></div>
        {resultRows.map((row, i) => (
          <div
            className={['lwf-result-row', row.name === 'LwF' && 'emphasis', i < step && 'is-revealed'].filter(Boolean).join(' ')}
            key={row.name}
            aria-live={i === step - 1 ? 'polite' : undefined}
          >
            <strong>{row.name}</strong>
            <span>{i < step ? row.old.toFixed(1) + '%' : '—'}</span>
            <span>{i < step ? row.fresh.toFixed(1) + '%' : '—'}</span>
          </div>
        ))}
      </div>
      <p className="lwf-note">Table 1(a), PDF p.7；ImageNet 使用 validation，CUB 使用 test；三次运行均值。后三种绝对值按原表相对 LwF 的有符号差值换算。</p>
      {feedback(
        status !== 'done'
          ? '点击开始后，每隔约半秒揭示一种方法；完成后四行数值和图表保持可见。'
          : '该任务对中，LwF 比 fine-tuning 保留更多 ImageNet accuracy，CUB accuracy 也略高；feature extraction 保旧较好但新任务较低；joint training 用到旧数据。',
        status === 'done' ? 'good' : 'neutral'
      )}
    </div>
  );
}
