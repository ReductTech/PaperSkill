import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

// A more faithful top-down billiards table with equal-mass ball-ball collision.
// The learner drags to aim (direction + power); dashed lines are the model's
// predicted transition, and the launch button plays the actual transition.

const W = 560;
const H = 300;
const TABLE = { x: 44, y: 38, w: 472, h: 224 };
const R = 15;
const CUE = { x: 125, y: 224 };
const TARGET = { x: 340, y: 120 };
const POCKET_R = 17;
const POCKETS: Array<{ x: number; y: number }> = [
  { x: TABLE.x, y: TABLE.y },
  { x: TABLE.x + TABLE.w / 2, y: TABLE.y },
  { x: TABLE.x + TABLE.w, y: TABLE.y },
  { x: TABLE.x, y: TABLE.y + TABLE.h },
  { x: TABLE.x + TABLE.w / 2, y: TABLE.y + TABLE.h },
  { x: TABLE.x + TABLE.w, y: TABLE.y + TABLE.h },
];

interface Aim {
  angle: number;
  power: number;
  hit: boolean;
  pocketed: boolean;
  preEnd: { x: number; y: number };
  postEnd: { x: number; y: number };
  targetEnd: { x: number; y: number };
  postDir: { x: number; y: number };
  targetDir: { x: number; y: number };
  targetTravel: number;
  postTravel: number;
}

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

function clampToTable(p: { x: number; y: number }): { x: number; y: number } {
  return {
    x: clamp(p.x, TABLE.x + R, TABLE.x + TABLE.w - R),
    y: clamp(p.y, TABLE.y + R, TABLE.y + TABLE.h - R),
  };
}

function pocketHit(start: { x: number; y: number }, end: { x: number; y: number }): { x: number; y: number } | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1) return null;
  for (const pk of POCKETS) {
    const t = clamp(((pk.x - start.x) * dx + (pk.y - start.y) * dy) / lenSq, 0, 1);
    const px = start.x + dx * t;
    const py = start.y + dy * t;
    if (Math.hypot(px - pk.x, py - pk.y) < POCKET_R - 2) return { x: pk.x, y: pk.y };
  }
  return null;
}

function computeShot(px: number, py: number): Aim {
  const dx = px - CUE.x;
  const dy = py - CUE.y;
  const dist = Math.max(30, Math.min(210, Math.hypot(dx, dy)));
  const angle = Math.atan2(dy, dx);
  const dir = { x: Math.cos(angle), y: Math.sin(angle) };
  const power = clamp((dist - 30) / 180, 0.15, 1);

  // ray vs target contact circle (center distance = 2R)
  const ox = CUE.x - TARGET.x;
  const oy = CUE.y - TARGET.y;
  const b = ox * dir.x + oy * dir.y;
  const c = ox * ox + oy * oy - 4 * R * R;
  const disc = b * b - c;
  const hit = disc >= 0 && b < 0;

  if (!hit) {
    const end = clampToTable({ x: CUE.x + dir.x * (140 + 300 * power), y: CUE.y + dir.y * (140 + 300 * power) });
    return {
      angle, power, hit: false, pocketed: false,
      preEnd: end,
      postEnd: end,
      targetEnd: TARGET,
      postDir: dir,
      targetDir: { x: 0, y: 0 },
      targetTravel: 0,
      postTravel: 0,
    };
  }

  const tHit = -b - Math.sqrt(disc);
  const impact = { x: CUE.x + dir.x * tHit, y: CUE.y + dir.y * tHit };
  const cx = TARGET.x - impact.x;
  const cy = TARGET.y - impact.y;
  const cl = Math.hypot(cx, cy) || 1;
  const normal = { x: cx / cl, y: cy / cl };
  const vn = Math.max(0, dir.x * normal.x + dir.y * normal.y);
  const tangent = { x: dir.x - vn * normal.x, y: dir.y - vn * normal.y };
  const tangentLen = Math.hypot(tangent.x, tangent.y);
  const total = 130 + 330 * power;
  const targetTravel = total * vn;
  const postTravel = tangentLen > 0.03 ? total * tangentLen : 0;
  const targetCandidate = { x: TARGET.x + normal.x * targetTravel, y: TARGET.y + normal.y * targetTravel };
  const pocket = pocketHit(TARGET, targetCandidate);
  const targetEnd = pocket || clampToTable(targetCandidate);
  const postDir = tangentLen > 0.03 ? { x: tangent.x / tangentLen, y: tangent.y / tangentLen } : { x: 0, y: 0 };
  const postEnd = postTravel > 2 ? clampToTable({ x: impact.x + postDir.x * postTravel, y: impact.y + postDir.y * postTravel }) : impact;

  return {
    angle, power, hit: true, pocketed: !!pocket,
    preEnd: impact,
    postEnd,
    targetEnd,
    postDir,
    targetDir: normal,
    targetTravel,
    postTravel,
  };
}

function drawTable(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  // wood frame
  ctx.fillStyle = '#6b4a2b';
  ctx.beginPath();
  ctx.roundRect(TABLE.x - 14, TABLE.y - 14, TABLE.w + 28, TABLE.h + 28, 14);
  ctx.fill();
  // cloth
  ctx.fillStyle = '#2d7d5a';
  ctx.beginPath();
  ctx.roundRect(TABLE.x, TABLE.y, TABLE.w, TABLE.h, 6);
  ctx.fill();
  // inner play field shade
  ctx.fillStyle = '#1f6b4b';
  ctx.fillRect(TABLE.x + 14, TABLE.y + 14, TABLE.w - 28, TABLE.h - 28);
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 2;
  ctx.strokeRect(TABLE.x + 14, TABLE.y + 14, TABLE.w - 28, TABLE.h - 28);
  // head string
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(TABLE.x + TABLE.w * 0.28, TABLE.y + 14);
  ctx.lineTo(TABLE.x + TABLE.w * 0.28, TABLE.y + TABLE.h - 14);
  ctx.stroke();
  // foot spot
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.beginPath();
  ctx.arc(TABLE.x + TABLE.w * 0.72, TABLE.y + TABLE.h * 0.5, 3, 0, Math.PI * 2);
  ctx.fill();
  // rail diamonds
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (let i = 1; i < 8; i += 2) {
    const x = TABLE.x + (TABLE.w / 8) * i;
    ctx.beginPath(); ctx.arc(x, TABLE.y + 5, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, TABLE.y + TABLE.h - 5, 2, 0, Math.PI * 2); ctx.fill();
  }
  // pockets
  POCKETS.forEach((pk) => {
    ctx.fillStyle = '#0d261d';
    ctx.beginPath();
    ctx.arc(pk.x, pk.y, POCKET_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, stripe = false, labelText?: string): void {
  ctx.save();
  const g = ctx.createRadialGradient(x - 5, y - 6, 2, x, y, R);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.25, color);
  g.addColorStop(1, '#4a4f55');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, R, 0, Math.PI * 2);
  ctx.fill();
  if (stripe) {
    ctx.fillStyle = '#f5f8f0';
    ctx.beginPath();
    ctx.arc(x, y, R * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.arc(x - 5, y - 6, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (labelText) label(ctx, labelText, x, y - 28, 10, C.ink);
}

function drawDashedLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width = 2.5): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash([7, 6]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawCueStick(ctx: CanvasRenderingContext2D, aim: Aim, pointer: { x: number; y: number }): void {
  const back = 72 + aim.power * 56;
  const sx = CUE.x - Math.cos(aim.angle) * back;
  const sy = CUE.y - Math.sin(aim.angle) * back;
  const ex = CUE.x - Math.cos(aim.angle) * 13;
  const ey = CUE.y - Math.sin(aim.angle) * 13;
  ctx.save();
  ctx.strokeStyle = C.route;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pointer.x, pointer.y, 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.arc(pointer.x, pointer.y, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export const ActionTable: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const pointer = useRef({ x: 430, y: 78 });
  const stateRef = useRef<{ aim: Aim; phase: 'aim' | 'roll' | 'done'; rollStart: number }>({
    aim: computeShot(430, 78),
    phase: 'aim',
    rollStart: 0,
  });
  const rafRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<'aim' | 'roll' | 'done'>('aim');
  const [feedback, setFeedback] = useState({ text: '拖动橙色瞄准点：方向决定碰撞后的走位，拉得越远力度越大。', cls: '' });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const render = () => {
      const s = stateRef.current;
      drawTable(ctx);
      const elapsed = s.phase === 'roll' ? performance.now() - s.rollStart : 0;
      const p = s.phase === 'roll' ? clamp(elapsed / 1450, 0, 1) : 0;
      const cuePreT = clamp(p / 0.36, 0, 1);
      const postT = clamp((p - 0.36) / 0.64, 0, 1);
      let cueX = CUE.x;
      let cueY = CUE.y;
      let targetX = TARGET.x;
      let targetY = TARGET.y;
      if (s.phase === 'roll') {
        if (!s.aim.hit) {
          cueX = lerp(CUE.x, s.aim.preEnd.x, p);
          cueY = lerp(CUE.y, s.aim.preEnd.y, p);
        } else {
          if (p < 0.36) {
            cueX = lerp(CUE.x, s.aim.preEnd.x, cuePreT);
            cueY = lerp(CUE.y, s.aim.preEnd.y, cuePreT);
          } else {
            cueX = lerp(s.aim.preEnd.x, s.aim.postEnd.x, postT);
            cueY = lerp(s.aim.preEnd.y, s.aim.postEnd.y, postT);
            targetX = lerp(TARGET.x, s.aim.targetEnd.x, postT);
            targetY = lerp(TARGET.y, s.aim.targetEnd.y, postT);
          }
        }
      } else if (s.phase === 'done') {
        if (s.aim.hit) {
          cueX = s.aim.postEnd.x;
          cueY = s.aim.postEnd.y;
          targetX = s.aim.targetEnd.x;
          targetY = s.aim.targetEnd.y;
        } else {
          cueX = s.aim.preEnd.x;
          cueY = s.aim.preEnd.y;
        }
      }

      // predicted transition (before action)
      if (s.phase === 'aim') {
        drawDashedLine(ctx, CUE.x, CUE.y, s.aim.preEnd.x, s.aim.preEnd.y, C.blue);
        if (s.aim.hit) {
          drawDashedLine(ctx, TARGET.x, TARGET.y, s.aim.targetEnd.x, s.aim.targetEnd.y, C.green, 3.5);
          if (s.aim.postTravel > 2) drawDashedLine(ctx, s.aim.preEnd.x, s.aim.preEnd.y, s.aim.postEnd.x, s.aim.postEnd.y, C.purple, 2);
          ctx.fillStyle = 'rgba(34,141,92,0.16)';
          ctx.beginPath();
          ctx.arc(s.aim.targetEnd.x, s.aim.targetEnd.y, R + 5, 0, Math.PI * 2);
          ctx.fill();
          if (s.aim.pocketed) {
            ctx.strokeStyle = C.green;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(s.aim.targetEnd.x, s.aim.targetEnd.y, POCKET_R - 2, 0, Math.PI * 2);
            ctx.stroke();
            label(ctx, '预测入袋', s.aim.targetEnd.x, s.aim.targetEnd.y - 32, 10, C.green);
          }
        }
      }

      const targetInPocket = s.phase === 'done' && s.aim.pocketed;
      if (!targetInPocket) {
        drawBall(ctx, targetX, targetY, '#d97706', false, s.phase === 'roll' ? '状态变化中' : '目标球');
      } else {
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(s.aim.targetEnd.x, s.aim.targetEnd.y, POCKET_R - 2, 0, Math.PI * 2);
        ctx.stroke();
        label(ctx, '已入袋', s.aim.targetEnd.x, s.aim.targetEnd.y - 30, 10, C.green);
      }
      drawBall(ctx, cueX, cueY, '#f5f8f0', true, '动作球');
      if (s.phase === 'aim') drawCueStick(ctx, s.aim, pointer.current);
      if (s.phase === 'done' && s.aim.pocketed) label(ctx, '预测变为现实', 438, 42, 11, C.green);

      const heading = s.phase === 'aim' ? '动作前：预测状态转移' : s.phase === 'roll' ? '动作执行：观察碰撞与走位' : '动作后：新状态已形成';
      label(ctx, heading, W / 2, 18, 12, s.phase === 'aim' ? C.blue : C.green);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = () => { render(); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const toLocal = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: clamp((e.clientX - rect.left) * (W / rect.width), TABLE.x + R, TABLE.x + TABLE.w - R),
      y: clamp((e.clientY - rect.top) * (H / rect.height), TABLE.y + R, TABLE.y + TABLE.h - R),
    };
  };

  const aimFromPointer = (p: { x: number; y: number }) => {
    pointer.current = p;
    const aim = computeShot(p.x, p.y);
    stateRef.current.aim = aim;
    stateRef.current.phase = 'aim';
    setPhase('aim');
    if (!aim.hit) setFeedback({ text: '虚线没有碰到目标球：模型预测这次动作会打偏。', cls: 'bad' });
    else if (aim.pocketed) setFeedback({ text: '瞄准有效：碰撞后目标球会沿绿色虚线滚入袋口。', cls: 'good' });
    else if (aim.power < 0.4) setFeedback({ text: '力度偏小：目标球会移动，但可能停在袋口前。', cls: '' });
    else setFeedback({ text: '碰撞模型已更新：白球沿紫色虚线分离，目标球沿绿色虚线前进。', cls: 'good' });
  };

  const launch = () => {
    if (stateRef.current.phase !== 'aim') return;
    stateRef.current = { ...stateRef.current, phase: 'roll', rollStart: performance.now() };
    setPhase('roll');
    setFeedback({ text: '动作已执行：白球撞击目标球，碰撞后的状态沿预测路径展开。', cls: 'good' });
    window.setTimeout(() => {
      const aim = stateRef.current.aim;
      stateRef.current.phase = 'done';
      setPhase('done');
      if (aim.pocketed) setFeedback({ text: '动作产生了预期变化：目标球入袋，旧状态被新状态替代。', cls: 'good' });
      else if (aim.hit) setFeedback({ text: '碰撞发生，但目标球没有入袋：模型预测与执行结果一致。', cls: '' });
      else setFeedback({ text: '白球没有击中目标：动作未产生有效变化。', cls: 'bad' });
    }, 1550);
  };

  const reset = () => {
    stateRef.current.phase = 'aim';
    setPhase('aim');
    setFeedback({ text: '已复位：继续拖动瞄准点，观察预测轨迹如何变化。', cls: '' });
  };

  return (
    <div>
      <canvas
        ref={ref}
        width={W}
        height={H}
        style={{ cursor: 'crosshair', touchAction: 'none' }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          if (stateRef.current.phase !== 'aim') return;
          aimFromPointer(toLocal(e));
        }}
        onPointerMove={(e) => {
          if (stateRef.current.phase === 'aim' && e.buttons > 0) aimFromPointer(toLocal(e));
        }}
      />
      <div className="ctrl">
        <span className="val">
          {phase === 'aim'
            ? `瞄准 ${Math.round(stateRef.current.aim.angle * 180 / Math.PI)}° · 力度 ${Math.round(stateRef.current.aim.power * 100)}%${stateRef.current.aim.pocketed ? ' · 预测入袋' : ''}`
            : phase === 'roll' ? '动作执行中…' : stateRef.current.aim.pocketed ? '目标球已入袋' : '动作已完成'}
        </span>
        {phase === 'aim' ? (
          <button className="chip" onClick={launch}>执行动作</button>
        ) : (
          <button className="chip" onClick={reset}>{phase === 'roll' ? '执行中…' : '重新瞄准'}</button>
        )}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ActionTable;
