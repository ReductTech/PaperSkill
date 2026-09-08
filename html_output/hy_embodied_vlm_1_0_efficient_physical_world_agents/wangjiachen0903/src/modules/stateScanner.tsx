import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

const W = 560;
const H = 280;

// Room layout coordinates
const WALL_BOTTOM = 148;
const FLOOR_TOP = 148;
const TABLE = { x: 150, y: 196, w: 260, h: 34 };
const MUG = { x: 226, y: 158, w: 30, h: 38 };
const BOX = { x: 292, y: 162, w: 46, h: 34 };
const BALL = { x: 372, y: 178, r: 14 };
const HANDLE = { x: 241, y: 152, w: 16, h: 20 };
const GRIP = { x: 350, y: 104, w: 28, h: 26 };

function drawRoomBase(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  // wall
  ctx.fillStyle = '#eef3fb';
  ctx.fillRect(0, 0, W, WALL_BOTTOM);
  // floor
  ctx.fillStyle = C.light;
  ctx.fillRect(0, FLOOR_TOP, W, H - FLOOR_TOP);
  // floor grid
  ctx.strokeStyle = 'rgba(118,144,106,0.35)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 6; i += 1) {
    const y = FLOOR_TOP + i * ((H - FLOOR_TOP) / 6);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  // wall depth guide
  ctx.strokeStyle = C.axis;
  ctx.beginPath();
  ctx.moveTo(0, WALL_BOTTOM);
  ctx.lineTo(W, WALL_BOTTOM);
  ctx.stroke();
}

function drawTable(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = C.route;
  ctx.fillRect(TABLE.x, TABLE.y, TABLE.w, TABLE.h);
  ctx.fillStyle = C.dark;
  ctx.fillRect(TABLE.x + 18, TABLE.y + TABLE.h, 16, H - TABLE.y - TABLE.h - 22);
  ctx.fillRect(TABLE.x + TABLE.w - 34, TABLE.y + TABLE.h, 16, H - TABLE.y - TABLE.h - 22);
  // table surface highlight
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(TABLE.x, TABLE.y, TABLE.w, 5);
}

function drawObjects(ctx: CanvasRenderingContext2D, t: number): void {
  // mug body
  ctx.fillStyle = '#f0c060';
  ctx.fillRect(MUG.x, MUG.y, MUG.w, MUG.h);
  ctx.fillStyle = C.blue;
  ctx.fillRect(MUG.x + MUG.w - 3, MUG.y + 4, 3, MUG.h - 8);
  // handle
  ctx.strokeStyle = '#f0c060';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(HANDLE.x, HANDLE.y + 8);
  ctx.lineTo(HANDLE.x, HANDLE.y + 20);
  ctx.stroke();
  // box
  ctx.fillStyle = '#d9c48f';
  ctx.fillRect(BOX.x, BOX.y, BOX.w, BOX.h);
  ctx.strokeStyle = C.muted;
  ctx.strokeRect(BOX.x, BOX.y, BOX.w, BOX.h);
  // ball
  ctx.fillStyle = '#c96f3b';
  ctx.beginPath();
  ctx.arc(BALL.x, BALL.y, BALL.r, 0, Math.PI * 2);
  ctx.fill();
  // robot arm: base -> elbow -> wrist -> gripper, all connected
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(430, 24);
  ctx.lineTo(430, 66);
  ctx.lineTo(414, 84);
  ctx.lineTo(390, 94);
  ctx.lineTo(GRIP.x + GRIP.w / 2, GRIP.y + 2);
  ctx.stroke();
  ctx.fillStyle = C.blue;
  ctx.beginPath();
  ctx.arc(430, 66, 6, 0, Math.PI * 2);
  ctx.arc(414, 84, 6, 0, Math.PI * 2);
  ctx.arc(390, 94, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.blue;
  ctx.fillRect(GRIP.x, GRIP.y, GRIP.w, GRIP.h);
  ctx.fillStyle = C.bg;
  ctx.fillRect(GRIP.x + 8, GRIP.y + 8, 5, 10);
  ctx.fillRect(GRIP.x + GRIP.w - 13, GRIP.y + 8, 5, 10);
  // gripper target beam pulse
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(364, 118);
  ctx.lineTo(BALL.x, BALL.y - BALL.r);
  ctx.stroke();
  ctx.setLineDash([]);
  label(ctx, '机器人视角', 410, 24, 10, C.blue);
  void t;
}

function drawOverlay(ctx: CanvasRenderingContext2D, beam: number, t: number): void {
  // scan beam
  const bx = 12 + (beam / 100) * (W - 24);
  ctx.fillStyle = 'rgba(39,68,110,0.06)';
  ctx.fillRect(12, 8, bx - 12, H - 16);
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(bx, 10);
  ctx.lineTo(bx, H - 10);
  ctx.stroke();
  ctx.fillStyle = C.blue;
  ctx.beginPath();
  ctx.arc(bx, 10 + ((t * 34) % (H - 20)), 5, 0, Math.PI * 2);
  ctx.fill();

  // Every annotation is tied to the x position of the object it describes.
  // Nothing appears before the beam actually reaches that object.
  const mugLeft = MUG.x - 6;
  const boxLeft = BOX.x - 5;
  const handleLeft = MUG.x + MUG.w - 4;
  const ballLeft = BALL.x - BALL.r - 4;
  const tableLeft = TABLE.x;

  if (bx >= mugLeft) {
    label(ctx, '物体 · 属性 · 状态', 70, 30, 11, C.blue);
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2;
    ctx.strokeRect(MUG.x - 6, MUG.y - 6, MUG.w + 12, MUG.h + 12);
    label(ctx, '杯子', MUG.x + MUG.w / 2, MUG.y - 14, 10, C.blue);
  }
  if (bx >= boxLeft) {
    label(ctx, '深度 · 几何 · 空间关系', 250, 30, 11, C.green);
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 2;
    ctx.strokeRect(BOX.x - 5, BOX.y - 5, BOX.w + 10, BOX.h + 10);
    label(ctx, '0.6 m', BOX.x + BOX.w / 2, BOX.y - 12, 10, C.green);
    ctx.strokeStyle = 'rgba(34,141,92,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(BALL.x, BALL.y, BALL.r + 16, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (bx >= handleLeft) {
    label(ctx, '可抓取 · 可放置 · 可操作区域', 408, 30, 11, C.orange);
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 3;
    ctx.strokeRect(MUG.x + MUG.w - 5, MUG.y - 4, 18, MUG.h - 4);
    label(ctx, '抓这里', MUG.x + MUG.w + 20, MUG.y + 8, 10, C.green);
  }
  if (bx >= ballLeft) {
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 3;
    ctx.strokeRect(BALL.x - BALL.r - 4, BALL.y - BALL.r - 4, BALL.r * 2 + 8, BALL.r * 2 + 8);
    label(ctx, '可吸', BALL.x, BALL.y - 26, 10, C.orange);
  }
  if (bx >= tableLeft) {
    ctx.fillStyle = 'rgba(34,141,92,0.10)';
    ctx.fillRect(TABLE.x, TABLE.y, TABLE.w, TABLE.h);
    label(ctx, '可放置面', TABLE.x + TABLE.w / 2, TABLE.y - 10, 10, C.green);
  }
}

export const StateScanner: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ beam: 28 });
  const rafRef = useRef<number | null>(null);
  const [beam, setBeam] = useState(28);
  const [feedback, setFeedback] = useState({ text: '扫描线刚进入画面：先识别物体与属性。', cls: '' });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const render = (s: { beam: number }) => {
      drawRoomBase(ctx);
      drawTable(ctx);
      drawObjects(ctx, performance.now() / 1000);
      drawOverlay(ctx, s.beam, performance.now() / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = () => {
      render(stateRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const onChange = (v: number) => {
    stateRef.current.beam = v;
    setBeam(v);
    if (v < 28) setFeedback({ text: '扫描线在左侧：模型先回答“有什么”——物体、属性与状态。', cls: '' });
    else if (v < 48) setFeedback({ text: '扫描线进入物体区：识别杯子、盒子和球，并锁定它们的位置。', cls: 'good' });
    else if (v < 70) setFeedback({ text: '扫描线进入空间区：恢复深度、距离与几何关系，知道每个物体离机器人多远。', cls: 'good' });
    else if (v < 88) setFeedback({ text: '扫描线进入机器人区：标出把手抓取点、可吸附球与可放置桌面。', cls: 'good' });
    else setFeedback({ text: '完整状态已经建立：物体、深度、空间与可操作性，全部变成可行动的状态。', cls: 'good' });
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>扫描状态 <span className="val">{beam}%</span></label>
        <input type="range" min={0} max={100} value={beam} onChange={(e) => onChange(Number(e.target.value))} aria-label="扫描状态" />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default StateScanner;
