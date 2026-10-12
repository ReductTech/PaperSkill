import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import { C, drawSceneLabel, drawVerdict, drawCheckMark, drawArm } from './packKit';
import type { WidgetProps } from './registry';

// §9.2 — DROID zero-shot campus tour. Each campus is an UNSEEN environment and
// the policy EXECUTES a sequence of natural-language tasks there: the arm
// travels task-station to task-station, each station lights green on arrival,
// and the per-campus task checklist ticks off as the tour proceeds.
const W = 1080;
const H = 320;
const SLIDE = 500;
const TASK_MS = 1500; // per-task travel+execute time

interface Fb {
  html: string;
  cls: string;
}

interface Task {
  x: number;
  label: string;
  kind: 'drawer' | 'cupboard' | 'faucet' | 'object' | 'microwave';
}

interface Campus {
  name: string;
  short: string;
  wall: string;
  table: string;
  tableY: number;
  cam: number;
  tasks: Task[];
  note: string;
}

const CAMPUSES: Campus[] = [
  {
    name: 'UC Berkeley',
    short: 'Berkeley',
    wall: '#e7edf6',
    table: '#a9825f',
    tableY: 208,
    cam: -0.18,
    tasks: [
      { x: 190, label: '打开抽屉', kind: 'drawer' },
      { x: 400, label: '收起杯子', kind: 'object' },
      { x: 610, label: '关上柜门', kind: 'cupboard' },
    ],
    note: '新桌 · 新背景 · 新视角',
  },
  {
    name: 'Stanford',
    short: 'Stanford',
    wall: '#e9f0e6',
    table: '#8f949b',
    tableY: 182,
    cam: 0.1,
    tasks: [
      { x: 190, label: '拧开水龙头', kind: 'faucet' },
      { x: 400, label: '搬运纸盒', kind: 'object' },
      { x: 610, label: '拉开抽屉', kind: 'drawer' },
    ],
    note: '连桌高都不一样',
  },
  {
    name: 'U. Washington',
    short: 'UW',
    wall: '#f4eae0',
    table: '#b08a63',
    tableY: 196,
    cam: 0.24,
    tasks: [
      { x: 190, label: '抓起瓶子', kind: 'object' },
      { x: 400, label: '开微波炉门', kind: 'microwave' },
      { x: 610, label: '整理柜子', kind: 'cupboard' },
    ],
    note: '失败也行为合理',
  },
];

const FBS: Fb[] = [
  {
    cls: '',
    html:
      'Berkeley：新桌、新背景、新物体、新视角——策略只拿一句<b>自然语言指令</b>，抽屉、杯子、柜门依次执行（15Hz，无共训 / 无微调）。',
  },
  {
    cls: '',
    html:
      'Stanford：换一间房、换一套任务、连<b>桌高</b>都不一样——水龙头、纸盒、抽屉照样只凭语言完成。',
  },
  {
    cls: '',
    html:
      'UW：第三站通过。指令提到微波炉时它<b>走向微波炉把手</b>（本站未开成功）——失败尝试也行为合理，而不是乱抓。',
  },
  {
    cls: 'good',
    html:
      '三校园 × 三个未见环境全部只凭语言提示执行——此前所有工作（含 DROID 原文与 OpenVLA）都只做共训 / 微调评测，这是<b>第一次纯提示零样本</b>。',
  },
];

const STEP_LABELS = ['1 / 3 · Berkeley', '2 / 3 · Stanford', '3 / 3 · U. Washington', '完成 · 三校园'];

function tiny(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts?: { color?: string; size?: number; align?: CanvasTextAlign; bold?: boolean }
) {
  ctx.save();
  ctx.fillStyle = opts?.color ?? C.muted;
  ctx.font = `${opts?.bold ? '600 ' : ''}${opts?.size ?? 11}px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = opts?.align ?? 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

// ---- task station glyphs ----

function glyphDrawer(ctx: CanvasRenderingContext2D, x: number, y: number, open01: number) {
  ctx.save();
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 17, y - 40, 34, 40, 3);
  ctx.stroke();
  // drawer slides out with open01
  const dy = open01 * 10;
  ctx.fillStyle = '#dfe8f3';
  ctx.beginPath();
  ctx.roundRect(x - 14, y - 22 + dy, 28, 14, 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = C.text;
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 15 + dy);
  ctx.lineTo(x + 4, y - 15 + dy);
  ctx.stroke();
  ctx.restore();
}

function glyphCupboard(ctx: CanvasRenderingContext2D, x: number, y: number, open01: number) {
  ctx.save();
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 19, y - 46, 38, 46, 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 46);
  ctx.lineTo(x, y);
  ctx.stroke();
  // door angle opens with open01
  ctx.strokeStyle = C.text;
  const a = open01 * 0.6;
  ctx.beginPath();
  ctx.moveTo(x - 6, y - 27);
  ctx.lineTo(x - 6 + 8 * Math.sin(a), y - 27 + 8 * Math.cos(a) - 8);
  ctx.moveTo(x + 6, y - 27);
  ctx.lineTo(x + 6 - 8 * Math.sin(a), y - 27 + 8 * Math.cos(a) - 8);
  ctx.stroke();
  ctx.restore();
}

function glyphFaucet(ctx: CanvasRenderingContext2D, x: number, y: number, open01: number) {
  ctx.save();
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2.25;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 30);
  ctx.lineTo(x + 18, y - 30);
  ctx.lineTo(x + 18, y - 22);
  ctx.stroke();
  // handle rotates with open01
  ctx.save();
  ctx.translate(x, y - 30);
  ctx.rotate(open01 * 0.9);
  ctx.beginPath();
  ctx.moveTo(-6, -6);
  ctx.lineTo(6, -6);
  ctx.stroke();
  ctx.restore();
  // water stream when open
  if (open01 > 0.15) {
    ctx.strokeStyle = '#5b8db8';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x + 18, y - 18);
    ctx.lineTo(x + 18, y - 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function glyphMicrowave(ctx: CanvasRenderingContext2D, x: number, y: number, open01: number) {
  ctx.save();
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 22, y - 42, 44, 42, 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 22 + 32, y - 42);
  ctx.lineTo(x - 22 + 32, y);
  ctx.stroke();
  // door swings open
  const w = open01 * 14;
  ctx.strokeStyle = C.text;
  ctx.beginPath();
  ctx.moveTo(x + 10, y - 36);
  ctx.lineTo(x + 10 - w, y - 30);
  ctx.stroke();
  tiny(ctx, '微波炉', x, y + 10, { align: 'center', size: 10 });
  ctx.restore();
}

function glyphObject(ctx: CanvasRenderingContext2D, x: number, y: number, kind: string, lift01: number) {
  ctx.save();
  const ly = y - lift01 * 22;
  if (kind === 'bottle') {
    ctx.fillStyle = '#9db7d4';
    ctx.strokeStyle = C.deep;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 8, ly - 26, 16, 26, 3);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(x - 3, ly - 36, 6, 10, 2);
    ctx.stroke();
  } else if (kind === 'box') {
    ctx.fillStyle = '#d4b98d';
    ctx.strokeStyle = C.deep;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 14, ly - 22, 28, 22, 3);
    ctx.fill();
    ctx.stroke();
    // travel arrow while lifted
    if (lift01 > 0.2) {
      ctx.strokeStyle = C.orange;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x, ly - 30);
      ctx.lineTo(x + 34, ly - 30);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  } else {
    ctx.fillStyle = '#d9cbd4';
    ctx.strokeStyle = C.deep;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 10, ly - 24);
    ctx.lineTo(x + 10, ly - 24);
    ctx.lineTo(x + 7, ly);
    ctx.lineTo(x - 7, ly);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function glyphCamera(ctx: CanvasRenderingContext2D, x: number, y: number, tilt: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-15, -9, 30, 18, 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(1, 0, 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-8, -9);
  ctx.lineTo(-5, -14);
  ctx.lineTo(4, -14);
  ctx.lineTo(6, -9);
  ctx.stroke();
  ctx.restore();
}

interface CampusAnim {
  campus: Campus;
  t: number; // ms within campus
}

function drawCampus(ctx: CanvasRenderingContext2D, a: CampusAnim, pulseT: number) {
  const cd = a.campus;
  const slide = clamp(a.t / SLIDE, 0, 1);
  const e = easeOutCubic(slide);
  ctx.save();
  ctx.globalAlpha = 0.25 + 0.75 * e;
  ctx.translate((1 - e) * 36, 0);
  // room card
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(50, 26, 700, 240, 10);
  ctx.fill();
  ctx.stroke();
  // unseen wall + table
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(58, 34, 684, 224, 6);
  ctx.clip();
  ctx.fillStyle = cd.wall;
  ctx.fillRect(58, 34, 684, cd.tableY - 34);
  ctx.fillStyle = cd.table;
  ctx.fillRect(58, cd.tableY, 684, 252 - cd.tableY);
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(58, cd.tableY);
  ctx.lineTo(742, cd.tableY);
  ctx.stroke();

  // task execution progress: rawIdx can be negative during the slide-in
  // window (first SLIDE ms) — clamp before indexing or tasks[-1] throws
  const rawIdx = Math.floor((a.t - SLIDE) / TASK_MS);
  const taskIdx = clamp(rawIdx, 0, cd.tasks.length - 1);
  const doneCount = clamp(rawIdx, 0, cd.tasks.length); // tasks fully completed
  const cur = cd.tasks[taskIdx];
  const curP = clamp((a.t - SLIDE) / TASK_MS - taskIdx, 0, 1); // per-task progress
  const open01 = curP > 0.55 ? clamp((curP - 0.55) / 0.45, 0, 1) : 0;

  // stations
  cd.tasks.forEach((tk, i) => {
    const done = i < doneCount;
    const active = i === taskIdx && a.t > SLIDE;
    const o = done ? 1 : active ? open01 : 0;
    if (tk.kind === 'drawer') glyphDrawer(ctx, tk.x, cd.tableY, o);
    else if (tk.kind === 'cupboard') glyphCupboard(ctx, tk.x, cd.tableY, o);
    else if (tk.kind === 'faucet') glyphFaucet(ctx, tk.x, cd.tableY, o);
    else if (tk.kind === 'microwave') glyphMicrowave(ctx, tk.x, cd.tableY, o);
    else glyphObject(ctx, tk.x, cd.tableY, cd.tasks[0] === tk ? 'bottle' : 'box', o);
    // task label + tick
    tiny(ctx, tk.label, tk.x, cd.tableY + 18, {
      align: 'center',
      size: 11,
      color: done ? C.green : active ? C.orange : C.muted,
      bold: !!active,
    });
    if (done) drawCheckMark(ctx, tk.x + 34, cd.tableY - 52, 8);
  });

  // arm travels between stations (from prev task x to current task x)
  const fromX = taskIdx > 0 ? cd.tasks[taskIdx - 1].x : 140;
  const armX = fromX + (cur.x - fromX) * easeOutCubic(Math.min(1, curP / 0.55));
  const grip = curP > 0.55 ? 0.1 + 0.4 * Math.sin(pulseT * 2 * Math.PI) : 0.9;
  drawArm(ctx, clamp(armX, 110, 680), cd.tableY + 4, {
    scale: 2.2,
    angle: 0.16 + 0.1 * Math.sin(pulseT * 2 * Math.PI),
    grip,
    color: C.blue,
  });
  ctx.restore();

  glyphCamera(ctx, 680, 60, cd.cam);
  drawSceneLabel(ctx, cd.name, 74, 52, { color: C.text });
  tiny(ctx, cd.note, 74, 74, { size: 11, color: C.muted });
  ctx.restore();

  // ---- right sidebar: campus checklist ----
  ctx.save();
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(770, 26, 260, 240, 10);
  ctx.fill();
  ctx.stroke();
  tiny(ctx, '本站任务清单', 792, 52, { size: 13, bold: true, color: C.text });
  tiny(ctx, '纯语言指令 · 15Hz', 792, 74, { size: 11, color: C.muted });
  const doneCount2 = doneCount;
  cd.tasks.forEach((tk, i) => {
    const ly = 108 + i * 42;
    const done = i < doneCount2;
    const active = i === taskIdx && a.t > SLIDE && rawIdx < cd.tasks.length;
    // checkbox
    ctx.strokeStyle = done ? C.green : active ? C.orange : C.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(792, ly - 9, 18, 18, 4);
    ctx.stroke();
    if (done) drawCheckMark(ctx, 801, ly, 5);
    tiny(ctx, tk.label, 822, ly, { size: 12, color: done ? C.green : active ? C.text : C.muted, bold: !!active });
    if (active) {
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(996, ly, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  // progress bar in sidebar
  const total = cd.tasks.length * TASK_MS + SLIDE;
  const p = clamp(a.t / total, 0, 1);
  ctx.fillStyle = '#e3e9f2';
  ctx.beginPath();
  ctx.roundRect(792, 240, 216, 8, 4);
  ctx.fill();
  ctx.fillStyle = C.green;
  ctx.beginPath();
  ctx.roundRect(792, 240, 216 * p, 8, 4);
  ctx.fill();
  ctx.restore();
}

function drawDone(ctx: CanvasRenderingContext2D, t: number, prog: number) {
  const e = easeOutCubic(prog);
  const cards = [
    { cx: 240, name: 'Berkeley', tasks: ['抽屉', '杯子', '柜门'] },
    { cx: 540, name: 'Stanford', tasks: ['水龙头', '纸盒', '抽屉'] },
    { cx: 840, name: 'UW', tasks: ['瓶子', '微波炉', '柜子'] },
  ];
  cards.forEach((cd, i) => {
    const p = clamp(prog * 3 - i * 0.6, 0, 1);
    ctx.save();
    ctx.globalAlpha = 0.25 + 0.75 * p;
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cd.cx - 128, 54 - (1 - e) * 10, 256, 128, 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    tiny(ctx, cd.name, cd.cx, 84, { size: 14, align: 'center', color: C.text, bold: true });
    cd.tasks.forEach((tk, k) => {
      const ly = 112 + k * 24;
      drawCheckMark(ctx, cd.cx - 70, ly, 5);
      tiny(ctx, tk, cd.cx - 56, ly, { size: 11, color: C.muted });
    });
    drawCheckMark(ctx, cd.cx + 96, 84, 9);
  });
  drawVerdict(ctx, 540, 236, true, { r: 20, pulse: t });
  drawSceneLabel(ctx, '三校园零样本全部只凭语言提示', 540, 284, { color: C.green, align: 'center' });
}

export const Ch9Droid: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepRef = useRef(0);
  const startRef = useRef(0);
  const [step, setStep] = useState(0);
  const [fb, setFb] = useState<Fb>(FBS[0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    startRef.current = performance.now();
    let raf = 0;
    const render = (ms: number) => {
      const t = (ms % 3600) / 3600;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      if (stepRef.current <= 2) {
        drawCampus(ctx, { campus: CAMPUSES[stepRef.current], t: ms - startRef.current }, t);
      } else {
        drawDone(ctx, t, clamp((ms - startRef.current) / 700, 0, 1));
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const go = (next: number) => {
    stepRef.current = next;
    startRef.current = performance.now();
    setStep(next);
    setFb(FBS[next]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-desc" style={{ padding: '2px 0 4px' }}>
        进入校园后任务自动依次执行——机械臂走向每一站、站点亮绿、右侧清单逐项打勾（完全未见环境，15Hz，无共训 / 无微调）
      </div>
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => go(Math.max(0, step - 1))} disabled={step === 0}>
          ◀ 上一校园
        </button>
        <div className="step-label">
          <b>{STEP_LABELS[step]}</b>
        </div>
        <button className="tiny" onClick={() => go(Math.min(3, step + 1))} disabled={step === 3}>
          {step === 2 ? '完成 ▶' : '下一校园 ▶'}
        </button>
        <button className="tiny ghost" onClick={() => go(0)} disabled={step === 0}>
          复位
        </button>
      </div>
      <div className={`feedback ${fb.cls}`} dangerouslySetInnerHTML={{ __html: fb.html }} />
    </div>
  );
};

export default Ch9Droid;
