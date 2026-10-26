import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const PAL = {
  bg: '#f5f8f0',
  reed: '#b8c9a7',
  deep: '#76906a',
  wood: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
};

function useLoop(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, now: number) => void
) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, w, h);
    } catch {
      return;
    }
    let raf = 0;
    let running = false;
    const frame = (now: number) => {
      drawRef.current(ctx, now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      if (running) raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [w, h]);
  return ref;
}

function marsh(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = PAL.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = PAL.reed;
  ctx.fillRect(0, h * 0.62, w, h * 0.38);
  ctx.strokeStyle = PAL.deep;
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const x = 18 + ((w - 36) * i) / 7;
    ctx.beginPath();
    ctx.moveTo(x, h - 4);
    ctx.quadraticCurveTo(x + 8, h * 0.78, x - 3, h * 0.6);
    ctx.stroke();
  }
  ctx.strokeStyle = PAL.wood;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.moveTo(12, h * 0.66);
  ctx.lineTo(w - 12, h * 0.66);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function watcher(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -26, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(0, 4);
  ctx.moveTo(0, -10);
  ctx.lineTo(-12, 0);
  ctx.moveTo(0, -10);
  ctx.lineTo(12, -14);
  ctx.moveTo(0, 4);
  ctx.lineTo(-7, 18);
  ctx.moveTo(0, 4);
  ctx.lineTo(7, 18);
  ctx.stroke();
  ctx.strokeStyle = PAL.wood;
  ctx.lineWidth = 2;
  ctx.strokeRect(8, -18, 7, 5);
  ctx.strokeRect(16, -18, 7, 5);
  ctx.restore();
}

function bird(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(12, -3, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAL.orange;
  ctx.beginPath();
  ctx.moveTo(16, -3);
  ctx.lineTo(23, 0);
  ctx.lineTo(16, 3);
  ctx.fill();
  ctx.restore();
}

function sight(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(x, y, w, h);
}

function tag(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.fillStyle = PAL.text;
  ctx.font = '14px "Segoe UI", sans-serif';
  ctx.fillText(text, x, y);
}

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = PAL.line;
  ctx.lineWidth = 1.5;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
}

function bars(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rows: { value: number; max: number; color: string }[]
) {
  panel(ctx, x, y, w, h);
  const gap = (h - 20) / rows.length;
  rows.forEach((row, i) => {
    const yy = y + 12 + i * gap;
    const bw = Math.max(2, (w - 28) * Math.min(1, row.value / row.max));
    ctx.fillStyle = row.color;
    ctx.fillRect(x + 14, yy, bw, Math.min(16, gap - 6));
  });
}

function Chips(props: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="chip-row">
      {props.options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={'chip' + (props.value === o.id ? ' selected' : '')}
          onClick={() => props.onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Feedback({ text, cls }: { text: string; cls: string }) {
  return <div className={'feedback ' + cls}>{text}</div>;
}

function SceneCanvas(props: {
  id: string;
  w: number;
  h: number;
  draw: (ctx: CanvasRenderingContext2D, now: number) => void;
  cursor?: string;
  onPointer?: (p: { x: number; y: number; down: boolean }) => void;
}) {
  const ref = useLoop(props.w, props.h, props.draw);
  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = ref.current;
    if (!canvas || !props.onPointer) return;
    const r = canvas.getBoundingClientRect();
    props.onPointer({
      x: ((e.clientX - r.left) / r.width) * props.w,
      y: ((e.clientY - r.top) / r.height) * props.h,
      down: e.buttons === 1 || e.type === 'pointerdown',
    });
  };
  return (
    <canvas
      id={props.id}
      ref={ref}
      width={props.w}
      height={props.h}
      style={{ width: props.w, height: props.h, touchAction: 'none', cursor: props.cursor || 'default' }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        pos(e);
      }}
      onPointerMove={(e) => {
        if (e.buttons === 1) pos(e);
      }}
    />
  );
}

function AnalogyView({ mode }: { mode: string }) {
  const draw = (ctx: CanvasRenderingContext2D, now: number) => {
    const w = 560;
    const h = 140;
    marsh(ctx, w, h);
    const u = (now % 2400) / 2400;
    const wave = Math.sin(u * Math.PI * 2);
    watcher(ctx, 78, 86, 1, PAL.blue);
    bird(ctx, 390, 78, 1, PAL.deep);
    if (mode === 'sweep') {
      sight(ctx, 180 + wave * 90, 48, 70, 40, PAL.red);
    } else if (mode === 'hold') {
      ctx.globalAlpha = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(u * Math.PI * 4));
      sight(ctx, 250, 46, 86, 48, PAL.blue);
      ctx.globalAlpha = 1;
    } else if (mode === 'mark') {
      const y = 20 + Math.min(1, u * 1.4) * 48;
      ctx.fillStyle = PAL.orange;
      ctx.beginPath();
      ctx.arc(392, y, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (mode === 'resize') {
      const rw = 46 + (0.5 + 0.5 * wave) * 50;
      const rh = 64 - (0.5 + 0.5 * wave) * 28;
      sight(ctx, 392 - rw / 2, 78 - rh / 2, rw, rh, PAL.orange);
    } else if (mode === 'pin') {
      const y = 24 + Math.min(1, u * 1.3) * 40;
      ctx.fillStyle = PAL.green;
      ctx.fillRect(360, y, 36, 16);
    } else if (mode === 'tighten') {
      const rw = 120 - u * 70;
      const rh = 70 - u * 36;
      sight(ctx, 392 - rw / 2, 78 - rh / 2, rw, rh, PAL.green);
    } else if (mode === 'sort') {
      const x = 200 + Math.min(1, u * 1.2) * 180;
      ctx.fillStyle = PAL.blue;
      ctx.fillRect(x, 58, 28, 18);
    } else if (mode === 'arrange') {
      const y = 30 + Math.min(1, u * 1.2) * 36;
      ctx.strokeStyle = PAL.wood;
      ctx.lineWidth = 3;
      ctx.strokeRect(300, y, 22, 12);
      ctx.strokeRect(324, y, 22, 12);
    } else if (mode === 'discard') {
      sight(ctx, 340, 50, 54, 34, PAL.green);
      ctx.globalAlpha = 1 - u;
      sight(ctx, 368, 58 + u * 24, 54, 34, PAL.red);
      ctx.globalAlpha = 1;
    } else {
      const gh = 10 + u * 36;
      ctx.fillStyle = PAL.green;
      ctx.fillRect(430, 96 - gh, 10, gh);
      ctx.strokeStyle = PAL.wood;
      ctx.strokeRect(418, 40, 36, 48);
    }
  };
  const ref = useLoop(560, 140, draw);
  return <canvas ref={ref} width={560} height={140} style={{ width: 560, height: 140 }} />;
}

export const Ana1: React.FC<WidgetProps> = () => <AnalogyView mode="sweep" />;
export const Ana2: React.FC<WidgetProps> = () => <AnalogyView mode="hold" />;
export const Ana3: React.FC<WidgetProps> = () => <AnalogyView mode="mark" />;
export const Ana4: React.FC<WidgetProps> = () => <AnalogyView mode="resize" />;
export const Ana5: React.FC<WidgetProps> = () => <AnalogyView mode="pin" />;
export const Ana6: React.FC<WidgetProps> = () => <AnalogyView mode="tighten" />;
export const Ana7: React.FC<WidgetProps> = () => <AnalogyView mode="arrange" />;
export const Ana8: React.FC<WidgetProps> = () => <AnalogyView mode="arrange" />;
export const Ana9: React.FC<WidgetProps> = () => <AnalogyView mode="discard" />;
export const Ana10: React.FC<WidgetProps> = () => <AnalogyView mode="compare" />;

export const HeroOld: React.FC<WidgetProps> = () => {
  const draw = (ctx: CanvasRenderingContext2D, now: number) => {
    marsh(ctx, 480, 150);
    const u = Math.sin(now / 280);
    watcher(ctx, 70, 96, 1.05, PAL.red);
    sight(ctx, 140 + u * 70, 46, 64, 36, PAL.red);
    bird(ctx, 390, 78, 1, PAL.deep);
    tag(ctx, '整岸搜', 16, 22);
  };
  const ref = useLoop(480, 150, draw);
  return <canvas ref={ref} width={480} height={150} style={{ width: '100%', height: 'auto' }} />;
};

export const HeroNew: React.FC<WidgetProps> = () => {
  const draw = (ctx: CanvasRenderingContext2D) => {
    marsh(ctx, 480, 150);
    watcher(ctx, 70, 96, 1.05, PAL.blue);
    sight(ctx, 348, 52, 78, 44, PAL.green);
    bird(ctx, 386, 76, 1, PAL.deep);
    ctx.fillStyle = PAL.orange;
    ctx.beginPath();
    ctx.arc(300, 70, 5, 0, Math.PI * 2);
    ctx.fill();
    tag(ctx, '先标位', 16, 22);
  };
  const ref = useLoop(480, 150, draw);
  return <canvas ref={ref} width={480} height={150} style={{ width: '100%', height: 'auto' }} />;
};

const W = 1080;
const H = 300;

export const Mod11: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [id, setId] = useState('ss');
  const items = {
    ss: {
      label: '选择搜索',
      ms: 2000,
      color: PAL.red,
      cls: 'bad',
      text: '正文说 Selective Search 的 CPU 实现大约每张图 2 秒。表 5 把这项记成 1510 毫秒，并注明是 CPU，不是 K40。它和检测网络各算各的。',
    },
    eb: {
      label: 'EdgeBoxes',
      ms: 200,
      color: PAL.blue,
      cls: '',
      text: '正文说 EdgeBoxes 当时在提案质量和速度之间折中最好，大约每张图 0.2 秒。论文没有把它和 GPU 上的 RPN 做成同一块硬件的对比。',
    },
    rpn: {
      label: '共享 RPN',
      ms: 10,
      color: PAL.green,
      cls: 'good',
      text: '表 5 里 VGG 在 K40 上的提案列是 10 毫秒。这是共享卷积已经算完之后的额外开销，不是从零再扫一遍图像。',
    },
  } as const;
  const cur = items[id as keyof typeof items];
  const draw = (ctx: CanvasRenderingContext2D) => {
    marsh(ctx, 640, H);
    watcher(ctx, 90, 190, 1.4, cur.color);
    bird(ctx, 470, 150, 1.2, PAL.deep);
    if (id === 'ss') sight(ctx, 180, 90, 220, 80, PAL.red);
    else if (id === 'eb') sight(ctx, 250, 110, 140, 60, PAL.blue);
    else sight(ctx, 420, 112, 96, 56, PAL.green);
    bars(ctx, 660, 36, 390, 220, [
      { value: 2000, max: 2000, color: id === 'ss' ? PAL.red : PAL.line },
      { value: 200, max: 2000, color: id === 'eb' ? PAL.blue : PAL.line },
      { value: 10, max: 2000, color: id === 'rpn' ? PAL.green : PAL.line },
    ]);
    tag(ctx, '毫秒', 670, 28);
  };
  return (
    <div>
      <Chips
        options={[
          { id: 'ss', label: '选择搜索' },
          { id: 'eb', label: 'EdgeBoxes' },
          { id: 'rpn', label: '共享 RPN' },
        ]}
        value={id}
        onChange={setId}
      />
      <SceneCanvas id={`cv-${chapterId}-${moduleId}`} w={W} h={H} draw={draw} />
      <Feedback text={cur.text} cls={cur.cls} />
    </div>
  );
};

export const Mod12: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [run, setRun] = useState(0);
  const prog = useRef(0);
  const draw = (ctx: CanvasRenderingContext2D, now: number) => {
    if (run > 0) prog.current = Math.min(1, prog.current + 0.02);
    const p = prog.current;
    marsh(ctx, 520, H);
    watcher(ctx, 70, 190, 1.2, PAL.red);
    watcher(ctx, 250, 190, 1.2, PAL.green);
    sight(ctx, 120, 100, 70, 40, PAL.red);
    sight(ctx, 300, 108, 64, 36, PAL.green);
    bars(ctx, 540, 48, 500, 200, [
      { value: 1830 * p, max: 1830, color: PAL.red },
      { value: 198 * p, max: 1830, color: PAL.green },
    ]);
    tag(ctx, '总毫秒', 548, 36);
  };
  return (
    <div>
      <div className="step-ctrl">
        <button
          type="button"
          className="tiny"
          onClick={() => {
            prog.current = 0;
            setRun((n) => n + 1);
          }}
        >
          开始对比
        </button>
        <span className="step-label">表 5 · VGG · K40</span>
      </div>
      <SceneCanvas id={`cv-${chapterId}-${moduleId}`} w={W} h={H} draw={draw} />
      <Feedback
        text="同一张表：Selective Search + Fast R-CNN 总计 1830 毫秒（约 0.5 fps），其中提案 1510 毫秒在 CPU 上。RPN + Fast R-CNN 总计 198 毫秒（约 5 fps），提案只有 10 毫秒。区域分支更短，也因为测试提案从约 2000 个降到最多 300 个。"
        cls={run ? 'good' : ''}
      />
    </div>
  );
};

export const Mod21: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const cell = useRef({ c: 3, r: 2 });
  const [, kick] = useState(0);
  const draw = (ctx: CanvasRenderingContext2D) => {
    marsh(ctx, 640, H);
    const { c, r } = cell.current;
    for (let j = 0; j < 4; j++) {
      for (let i = 0; i < 6; i++) {
        const x = 70 + i * 78;
        const y = 70 + j * 48;
        ctx.strokeStyle = i === c && j === r ? PAL.blue : PAL.line;
        ctx.lineWidth = i === c && j === r ? 3 : 1;
        ctx.strokeRect(x, y, 70, 40);
      }
    }
    const x = 70 + c * 78;
    const y = 70 + r * 48;
    sight(ctx, x - 8, y - 8, 86, 56, PAL.orange);
    bird(ctx, x + 36, y + 22, 0.8, PAL.deep);
    watcher(ctx, 560, 210, 1.1, PAL.blue);
    tag(ctx, '同一滑窗', 500, 40);
    tag(ctx, `${c + 1},${r + 1}`, 80, 40);
  };
  return (
    <div>
      <SceneCanvas
        id={`cv-${chapterId}-${moduleId}`}
        w={W}
        h={H}
        cursor="grab"
        draw={draw}
        onPointer={(p) => {
          if (p.x > 70 && p.x < 538 && p.y > 70 && p.y < 262) {
            cell.current = { c: Math.floor((p.x - 70) / 78), r: Math.floor((p.y - 70) / 48) };
            kick((n) => n + 1);
          }
        }}
      />
      <div className="step-ctrl">
        <button type="button" className="tiny ghost" onClick={() => { cell.current = { c: Math.max(0, cell.current.c - 1), r: cell.current.r }; kick((n) => n + 1); }}>左一格</button>
        <button type="button" className="tiny ghost" onClick={() => { cell.current = { c: Math.min(5, cell.current.c + 1), r: cell.current.r }; kick((n) => n + 1); }}>右一格</button>
      </div>
      <Feedback
        text="拖动格子，3×3 的滑窗跟着走，权重并不换成另一套。论文取 n=3。这个小网络把 ZF 的窗口映成 256 维、把 VGG 映成 512 维，再接 ReLU。输入图像上的有效感受野大约是 ZF 171 像素、VGG 228 像素。平移一个物体时，同样的函数在新位置做预测，只受到网络总步长的限制。"
        cls="good"
      />
    </div>
  );
};

const STEPS3 = [
  '先看整片芦苇，还不知道鸟在哪。',
  '共享卷积留下一张特征图，后面两个任务都用它。',
  'RPN 在每个位置打物体性分数，并相对锚框回归一个矩形。它还不说是哪一种鸟。',
  '按分数做 NMS，再留下得分高的提案。默认测试最多取 300 个。',
  'Fast R-CNN 在这些提案上做类别相关的分类，并再回归一次框。',
];

export const Mod31: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [step, setStep] = useState(0);
  const draw = (ctx: CanvasRenderingContext2D) => {
    marsh(ctx, W, H);
    watcher(ctx, 120, 200, 1.5, PAL.blue);
    bird(ctx, 760, 160, 1.4, PAL.deep);
    if (step >= 1) {
      ctx.fillStyle = PAL.blue;
      ctx.globalAlpha = 0.18;
      ctx.fillRect(220, 70, 620, 120);
      ctx.globalAlpha = 1;
    }
    if (step >= 2) {
      ctx.fillStyle = PAL.orange;
      ctx.beginPath();
      ctx.arc(760, 120, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    if (step >= 3) sight(ctx, 700, 110, 130, 80, PAL.blue);
    if (step >= 4) {
      sight(ctx, 712, 122, 100, 60, PAL.green);
      tag(ctx, '类别', 820, 150);
    }
  };
  return (
    <div>
      <div className="step-ctrl">
        <button type="button" className="tiny ghost" onClick={() => setStep(0)} disabled={step === 0}>回到起点</button>
        <button type="button" className="tiny" onClick={() => setStep((s) => Math.min(4, s + 1))} disabled={step === 4}>下一步</button>
        <span className="step-label">第 <b>{step + 1}</b> / 5 步</span>
      </div>
      <SceneCanvas id={`cv-${chapterId}-${moduleId}`} w={W} h={H} draw={draw} />
      <Feedback text={STEPS3[step]} cls={step >= 4 ? 'good' : ''} />
    </div>
  );
};

const ANCHORS = [
  { id: 'a', label: '128² · 1:1', map: 65.8, frames: [[70, 50]] },
  { id: 'b', label: '256² · 1:1', map: 66.7, frames: [[80, 60]] },
  { id: 'c', label: '128² · 三种比', map: 68.8, frames: [[90, 40], [60, 60], [40, 80]] },
  { id: 'd', label: '256² · 三种比', map: 67.9, frames: [[100, 46], [70, 70], [46, 90]] },
  { id: 'e', label: '三尺度 · 1:1', map: 69.8, frames: [[40, 40], [70, 70], [100, 100]] },
  { id: 'f', label: '三尺度 · 三比', map: 69.9, frames: [[96, 48], [64, 64], [40, 80]] },
];

export const Mod41: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [id, setId] = useState('f');
  const cur = ANCHORS.find((a) => a.id === id) || ANCHORS[5];
  const draw = (ctx: CanvasRenderingContext2D) => {
    marsh(ctx, 620, H);
    bird(ctx, 300, 160, 1.2, PAL.deep);
    cur.frames.forEach((fr, i) => {
      const colors = [PAL.blue, PAL.orange, PAL.purple];
      sight(ctx, 300 - fr[0] / 2, 160 - fr[1] / 2, fr[0], fr[1], colors[i % 3]);
    });
    watcher(ctx, 80, 200, 1.2, PAL.blue);
    bars(ctx, 660, 70, 380, 160, [{ value: cur.map - 60, max: 12, color: cur.map > 69 ? PAL.green : PAL.blue }]);
    tag(ctx, cur.map.toFixed(1), 820, 160);
  };
  return (
    <div>
      <Chips options={ANCHORS.map((a) => ({ id: a.id, label: a.label }))} value={id} onChange={setId} />
      <SceneCanvas id={`cv-${chapterId}-${moduleId}`} w={W} h={H} draw={draw} />
      <Feedback
        text={`表 8：VGG-16，VOC 2007 trainval 训练，VOC 2007 测试，mAP 越高越好。当前设置是 ${cur.map.toFixed(1)}%。默认的 3 尺度 × 3 长宽比是 69.9%，3 尺度 × 1 长宽比是 69.8%。论文说这两个维度在这个数据集上并没有拆开，但仍保留它们，让系统更灵活。k=9 时回归输出 4k 个坐标、分类输出 2k 个分数。`}
        cls={cur.map >= 69.8 ? 'good' : ''}
      />
    </div>
  );
};

export const Mod51: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [iou, setIou] = useState(0.5);
  const kind = iou > 0.7 ? 'pos' : iou < 0.3 ? 'neg' : 'skip';
  const draw = (ctx: CanvasRenderingContext2D) => {
    marsh(ctx, W, H);
    const color = kind === 'pos' ? PAL.green : kind === 'neg' ? PAL.red : PAL.blue;
    sight(ctx, 360, 90, 180, 120, PAL.deep);
    const shrink = (1 - iou) * 70;
    sight(ctx, 360 + shrink, 90 + shrink * 0.4, 180 - shrink, 120 - shrink * 0.3, color);
    bird(ctx, 450, 150, 1.1, PAL.deep);
    tag(ctx, iou.toFixed(2), 80, 48);
    tag(ctx, kind === 'pos' ? '正样本' : kind === 'neg' ? '负样本' : '不入损失', 80, 74);
  };
  return (
    <div>
      <div className="ctrl">
        <label>
          与真值的 IoU <span className="val">{iou.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(iou * 100)}
          onChange={(e) => setIou(Number(e.target.value) / 100)}
        />
      </div>
      <SceneCanvas id={`cv-${chapterId}-${moduleId}`} w={W} h={H} draw={draw} />
      <Feedback
        text={
          kind === 'pos'
            ? 'IoU 高于 0.7，这个锚框是正样本。回归损失只在正样本上打开。一个真值可以对应多个正锚框。'
            : kind === 'neg'
              ? '与所有真值的 IoU 都低于 0.3，这是负样本。它参与物体/背景分类，但不计算框回归。'
              : '0.3 到 0.7 之间的锚框既不是正样本也不是负样本，不进入这张图的损失。若没有任何锚框超过 0.7，论文仍把与该真值 IoU 最高的锚框标为正样本。'
        }
        cls={kind === 'pos' ? 'good' : kind === 'neg' ? 'bad' : ''}
      />
    </div>
  );
};

const STEPS6 = [
  '把短边缩放到 s=600。ZF 和 VGG 最后一层卷积的总步长都是 16 像素。',
  '在这张单尺度特征图上，每个位置放 k=9 个锚框。典型 1000×600 的图大约有 60×40×9≈2 万个锚框。',
  '分类分数负责排序。测试时按分数做 NMS，IoU 阈值固定 0.7，大约留下 2000 个提案。',
  '训练时丢掉越界锚框，否则损失很大而且不收敛，剩下大约 6000 个。测试仍在全图上跑，再把越界提案裁回图像内。',
  '再取得分最高的若干个。表 2 顶部、ZF、训练和测试提案一致时：Selective Search 2000 个是 58.7% mAP，共享 RPN 测试最多 300 个是 59.9%。',
];

export const Mod61: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [step, setStep] = useState(0);
  const draw = (ctx: CanvasRenderingContext2D) => {
    marsh(ctx, W, H);
    watcher(ctx, 90, 210, 1.3, PAL.blue);
    bird(ctx, 700, 160, 1.3, PAL.deep);
    if (step >= 1) {
      ctx.strokeStyle = PAL.line;
      for (let i = 0; i < 8; i++) ctx.strokeRect(240 + i * 70, 80, 60, 40);
    }
    if (step >= 2) sight(ctx, 640, 110, 140, 90, PAL.blue);
    if (step >= 3) {
      ctx.strokeStyle = PAL.red;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(900, 40, 80, 50);
      ctx.setLineDash([]);
    }
    if (step >= 4) sight(ctx, 655, 125, 100, 64, PAL.green);
  };
  return (
    <div>
      <div className="step-ctrl">
        <button type="button" className="tiny ghost" onClick={() => setStep(0)}>回到起点</button>
        <button type="button" className="tiny" onClick={() => setStep((s) => Math.min(4, s + 1))} disabled={step === 4}>下一步</button>
        <span className="step-label">第 <b>{step + 1}</b> / 5 步</span>
      </div>
      <SceneCanvas id={`cv-${chapterId}-${moduleId}`} w={W} h={H} draw={draw} />
      <Feedback text={STEPS6[step]} cls={step === 4 ? 'good' : ''} />
    </div>
  );
};

const STEPS7 = [
  '第 1 步：用 ImageNet 分类模型初始化，端到端微调 RPN。新层用标准差 0.01 的零均值高斯初始化。',
  '第 2 步：用第 1 步的提案单独训练 Fast R-CNN，也从 ImageNet 初始化。这时两个网络还不共享卷积。表 2 里 ZF 停在这一步是 58.7% mAP。',
  '第 3 步：用检测器初始化 RPN，冻住共享卷积，只微调 RPN 独有的层。论文观察到这一步会提高提案质量。',
  '第 4 步：共享卷积继续冻住，只微调 Fast R-CNN 独有的层。本文全部实验都用这四步。近似联合训练能少花大约 25% 到 50% 的训练时间，但忽略框坐标的梯度。',
];

export const Mod71: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [step, setStep] = useState(0);
  const draw = (ctx: CanvasRenderingContext2D) => {
    marsh(ctx, W, H);
    const slots = [180, 400, 620, 840];
    slots.forEach((x, i) => {
      const on = i <= step;
      ctx.fillStyle = on ? (i === step ? PAL.blue : PAL.green) : PAL.line;
      ctx.fillRect(x, 150, 36, 18);
    });
    watcher(ctx, slots[step] + 18, 210, 1.2, PAL.blue);
    if (step >= 2) {
      ctx.strokeStyle = PAL.wood;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(160, 230);
      ctx.lineTo(920, 230);
      ctx.stroke();
    }
  };
  return (
    <div>
      <div className="step-ctrl">
        <button type="button" className="tiny ghost" onClick={() => setStep(0)}>回到起点</button>
        <button type="button" className="tiny" onClick={() => setStep((s) => Math.min(3, s + 1))} disabled={step === 3}>下一步</button>
        <span className="step-label">第 <b>{step + 1}</b> / 4 步</span>
      </div>
      <SceneCanvas id={`cv-${chapterId}-${moduleId}`} w={W} h={H} draw={draw} />
      <Feedback text={STEPS7[step]} cls={step === 3 ? 'good' : ''} />
    </div>
  );
};

const NODES = [
  { id: 'conv', label: '共享卷积', text: 'ZF 有 5 个可共享卷积层，VGG-16 有 13 个。VGG 为了省显存，从 conv3_1 往上微调。图像短边是 600，最后一层步长 16。' },
  { id: 'slide', label: '3×3 滑窗', text: '滑窗映射到 256 维（ZF）或 512 维（VGG），再接 ReLU。因为是滑动的，这些层在全图上共享，实际写成 n×n 卷积。' },
  { id: 'cls', label: 'cls 头', text: '每个位置输出 2k 个分数，k 默认是 9。论文实现为二类 softmax，也可以改成 logistic 回归得到 k 个分数。物体性不是类别。' },
  { id: 'reg', label: 'reg 头', text: '每个位置输出 4k 个坐标。k 个回归器不共享权重，各自负责一个尺度和一种长宽比，所以固定大小的 3×3 特征仍能预测不同大小的框。' },
  { id: 'roi', label: 'RoI 池化', text: 'Fast R-CNN 从提案框里自适应池化特征。和 RPN 不同，这里的框大小可以各不相同，回归权重在不同区域尺寸之间共享。' },
  { id: 'head', label: '检测头', text: '第二阶段做类别相关的分类，并再次回归框。论文把这套两阶段系统和一步滑窗做了对照，见下一节的表 10。' },
];

export const Mod81: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [id, setId] = useState('conv');
  const cur = NODES.find((n) => n.id === id) || NODES[0];
  const draw = (ctx: CanvasRenderingContext2D) => {
    marsh(ctx, 420, H);
    watcher(ctx, 90, 200, 1.3, PAL.blue);
    bird(ctx, 280, 150, 1.1, PAL.deep);
    if (id === 'cls' || id === 'reg' || id === 'slide') sight(ctx, 230, 110, 100, 70, PAL.orange);
    if (id === 'roi' || id === 'head') sight(ctx, 240, 120, 80, 54, PAL.green);
    const xs = [470, 640, 810, 810, 640, 470];
    const ys = [70, 70, 70, 180, 180, 180];
    NODES.forEach((n, i) => {
      ctx.fillStyle = n.id === id ? PAL.blue : '#ffffff';
      ctx.strokeStyle = n.id === id ? PAL.blue : PAL.line;
      ctx.lineWidth = 2;
      ctx.fillRect(xs[i], ys[i], 120, 42);
      ctx.strokeRect(xs[i], ys[i], 120, 42);
      if (n.id === id) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(xs[i] + 46, ys[i] + 16, 28, 10);
      }
    });
  };
  return (
    <div>
      <Chips options={NODES.map((n) => ({ id: n.id, label: n.label }))} value={id} onChange={setId} />
      <SceneCanvas id={`cv-${chapterId}-${moduleId}`} w={W} h={H} draw={draw} />
      <Feedback text={cur.text} cls={id === 'head' ? 'good' : ''} />
    </div>
  );
};

export const Mod82: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [id, setId] = useState('two');
  const rows = {
    two: { map: 58.7, text: '表 10：两阶段，RPN+ZF 且特征不共享，300 个提案，Fast R-CNN ZF 单尺度，VOC 2007 测试 mAP 58.7%。', cls: 'good' },
    one: { map: 53.8, text: '一步法用大约 2 万个滑窗（3 尺度 × 3 长宽比），单尺度特征，mAP 53.8%。', cls: 'bad' },
    pyr: { map: 53.9, text: '一步法即使换成 5 个尺度的卷积特征，也只有 53.9%，仍比两阶段低 4.8 个点。这只说明这篇对照里级联提案有用，不是对后来所有一步检测器的总判断。', cls: 'bad' },
  } as const;
  const cur = rows[id as keyof typeof rows];
  const draw = (ctx: CanvasRenderingContext2D) => {
    marsh(ctx, 560, H);
    if (id === 'two') {
      sight(ctx, 250, 100, 90, 60, PAL.green);
      bird(ctx, 295, 132, 1, PAL.deep);
    } else {
      for (let i = 0; i < 12; i++) sight(ctx, 80 + (i % 6) * 70, 80 + Math.floor(i / 6) * 70, 50, 36, PAL.red);
    }
    bars(ctx, 620, 60, 420, 180, [
      { value: 58.7, max: 70, color: id === 'two' ? PAL.green : PAL.line },
      { value: 53.8, max: 70, color: id === 'one' ? PAL.red : PAL.line },
      { value: 53.9, max: 70, color: id === 'pyr' ? PAL.red : PAL.line },
    ]);
  };
  return (
    <div>
      <Chips
        options={[
          { id: 'two', label: '两阶段 58.7' },
          { id: 'one', label: '一步法 53.8' },
          { id: 'pyr', label: '五尺度 53.9' },
        ]}
        value={id}
        onChange={setId}
      />
      <SceneCanvas id={`cv-${chapterId}-${moduleId}`} w={W} h={H} draw={draw} />
      <Feedback text={cur.text} cls={cur.cls} />
    </div>
  );
};

export const Mod91: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const overlap = useRef(0.35);
  const [, kick] = useState(0);
  const draw = (ctx: CanvasRenderingContext2D) => {
    marsh(ctx, W, H);
    const iou = overlap.current;
    sight(ctx, 360, 90, 200, 130, PAL.green);
    const shift = (1 - iou) * 160;
    const drop = iou >= 0.7;
    ctx.globalAlpha = drop ? 0.25 : 1;
    sight(ctx, 360 + shift, 110, 200, 130, drop ? PAL.red : PAL.orange);
    ctx.globalAlpha = 1;
    bird(ctx, 460, 155, 1.2, PAL.deep);
    tag(ctx, iou.toFixed(2), 80, 48);
    tag(ctx, drop ? '抑制' : '保留', 80, 74);
  };
  const text =
    overlap.current >= 0.7
      ? 'IoU 到了论文固定的 0.7，得分较低的框被 NMS 抑制。这样做大约留下 2000 个提案，最终检测 mAP 在文中的消融里没有因此变差。训练时还要另做一件事：丢掉越界锚框，否则 1000×600 图上约 2 万个锚框里的越界项会让训练不收敛。'
      : '拖动第二只取景框。NMS 看的是分类分数和框之间的 IoU，阈值固定为 0.7，还没到这个值时两只框都留着。';
  return (
    <div>
      <SceneCanvas
        id={`cv-${chapterId}-${moduleId}`}
        w={W}
        h={H}
        cursor="ew-resize"
        draw={draw}
        onPointer={(p) => {
          overlap.current = Math.max(0, Math.min(1, 1 - (p.x - 360) / 220));
          kick((n) => n + 1);
        }}
      />
      <div className="step-ctrl">
        <button type="button" className="tiny ghost" onClick={() => { overlap.current = Math.max(0, overlap.current - 0.1); kick((n) => n + 1); }}>拉开</button>
        <button type="button" className="tiny ghost" onClick={() => { overlap.current = Math.min(1, overlap.current + 0.1); kick((n) => n + 1); }}>叠上</button>
      </div>
      <Feedback text={text} cls={overlap.current >= 0.7 ? 'good' : ''} />
    </div>
  );
};

type Row = { name: string; value: number; color: string; note: string };
type Proto = { id: string; label: string; unit: string; higher: boolean; max: number; rows: Row[]; text: string };

const PROTOS: Proto[] = [
  {
    id: 'voc07',
    label: 'VOC07 · 07训练',
    unit: 'mAP',
    higher: true,
    max: 80,
    rows: [
      { name: 'SS 66.9', value: 66.9, color: PAL.red, note: 'Selective Search，2000 个提案' },
      { name: '不共享 68.5', value: 68.5, color: PAL.blue, note: 'RPN 不共享，300 个' },
      { name: '共享 69.9', value: 69.9, color: PAL.green, note: 'RPN 共享，300 个' },
    ],
    text: '表 3：都是 VOC 2007 测试、VGG-16、Fast R-CNN、训练数据为 07。mAP 越高越好。66.9 来自 Fast R-CNN 论文，本文仓库复现 Selective Search 是 68.1，共享 RPN 的 69.9 仍然更高。',
  },
  {
    id: 'voc12data',
    label: 'VOC07 · 更多数据',
    unit: 'mAP',
    higher: true,
    max: 90,
    rows: [
      { name: 'SS 70.0', value: 70.0, color: PAL.red, note: '07+12' },
      { name: 'RPN 73.2', value: 73.2, color: PAL.green, note: '07+12，可与 70.0 比' },
      { name: '加COCO 78.8', value: 78.8, color: PAL.purple, note: '多了 COCO，不能单独归功 RPN' },
    ],
    text: '仍是 VOC 2007 测试、VGG-16。70.0 和 73.2 都用 07+12，可以比较。78.8 额外用了 COCO，表 12 还报告只拿 COCO、不在 VOC 上微调也有 76.1。数据变了，不能把全部涨点写成 RPN 的功劳。',
  },
  {
    id: 'voc2012',
    label: 'VOC2012 测试',
    unit: 'mAP',
    higher: true,
    max: 80,
    rows: [
      { name: 'SS 65.7', value: 65.7, color: PAL.red, note: '只训练 12' },
      { name: 'RPN 67.0', value: 67.0, color: PAL.green, note: '只训练 12' },
      { name: 'RPN 70.4', value: 70.4, color: PAL.blue, note: '07++12，训练集更大' },
    ],
    text: '表 4：VOC 2012 测试、VGG-16、300 个提案。65.7 对 67.0 是同一套 2012 trainval。70.4 用的是 07++12，和 68.4 的 Selective Search 才是更接近的对照。COCO+07++12 是 75.9，同样多了数据。',
  },
  {
    id: 'coco5',
    label: 'COCO @0.5',
    unit: 'mAP@0.5',
    higher: true,
    max: 50,
    rows: [
      { name: 'Fast 39.3', value: 39.3, color: PAL.red, note: '本文实现的 Fast R-CNN' },
      { name: 'Faster 42.1', value: 42.1, color: PAL.green, note: 'COCO train' },
      { name: 'trainval 42.7', value: 42.7, color: PAL.blue, note: '训练集换成 trainval' },
    ],
    text: '表 11：COCO test-dev、VGG-16。这里只比 mAP@0.5。本文自己的 Fast R-CNN 基线是 39.3，不是原文报告的 35.9。Faster R-CNN 用 COCO train 是 42.1，用 trainval 是 42.7。',
  },
  {
    id: 'coco95',
    label: 'COCO @[.5,.95]',
    unit: 'mAP@[.5,.95]',
    higher: true,
    max: 30,
    rows: [
      { name: 'Fast 19.3', value: 19.3, color: PAL.red, note: '本文实现' },
      { name: 'Faster 21.5', value: 21.5, color: PAL.green, note: 'COCO train' },
      { name: 'trainval 21.9', value: 21.9, color: PAL.blue, note: 'trainval' },
    ],
    text: '同一张表的另一个指标：IoU 从 0.5 到 0.95 每 0.05 取一次再平均。越高越好，但数值不能和 VOC 的 mAP 或 COCO 的 mAP@0.5 画在同一把尺子上。论文认为 RPN 对更高 IoU 的定位有帮助。',
  },
  {
    id: 'fps',
    label: 'K40 帧率',
    unit: 'fps',
    higher: true,
    max: 8,
    rows: [
      { name: 'VGG+SS', value: 0.5, color: PAL.red, note: '1830 ms，提案在 CPU' },
      { name: 'VGG+RPN', value: 5, color: PAL.green, note: '198 ms' },
    ],
    text: '表 5 只比较两套 VGG 系统的帧率，越高越快。ZF 的 RPN 系统是 17 fps、59 毫秒，因为它更浅，不能说成 VGG 的速度。Selective Search 的 1510 毫秒提案时间是 CPU。',
  },
];

export const Mod101: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [pid, setPid] = useState('voc07');
  const [token, setToken] = useState(0);
  const prog = useRef(0);
  const proto = PROTOS.find((p) => p.id === pid) || PROTOS[0];
  const draw = (ctx: CanvasRenderingContext2D) => {
    if (token > 0) prog.current = Math.min(1, prog.current + 0.03);
    const p = prog.current;
    marsh(ctx, 360, H);
    watcher(ctx, 80, 200, 1.2, PAL.blue);
    bird(ctx, 250, 150, 1.1, PAL.deep);
    const grown = proto.rows.map((r) => ({ value: r.value * p, max: proto.max, color: r.color }));
    bars(ctx, 390, 36, 650, 230, grown);
  };
  return (
    <div>
      <Chips options={PROTOS.map((p) => ({ id: p.id, label: p.label }))} value={pid} onChange={(id) => { prog.current = 0; setToken(0); setPid(id); }} />
      <div className="step-ctrl">
        <button type="button" className="tiny" onClick={() => { prog.current = 0; setToken((n) => n + 1); }}>开始比较</button>
      </div>
      <SceneCanvas id={`cv-${chapterId}-${moduleId}`} w={W} h={H} draw={draw} />
      <table className="paper">
        <thead>
          <tr>
            <th>条目</th>
            <th>{proto.unit}{proto.higher ? '（越高越好）' : ''}</th>
            <th>协议备注</th>
          </tr>
        </thead>
        <tbody>
          {proto.rows.map((r) => (
            <tr key={r.name}>
              <td>{r.name}</td>
              <td>{r.value}</td>
              <td>{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Feedback text={proto.text} cls="" />
    </div>
  );
};
