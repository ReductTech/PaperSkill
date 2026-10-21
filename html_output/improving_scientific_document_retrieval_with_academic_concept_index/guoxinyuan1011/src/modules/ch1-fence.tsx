import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第 1 章 · 事二：立围栏（田野实景）
// 1080×380；并列两块田（左无围栏 / 右有围栏）。点「立围栏」把左田也治一遍。

const W = 1080;
const H = 380;

const BG = '#f5f8f0';
const MUTE = '#68778f';
const AXIS = '#d7deea';
const GREEN = '#228d5c';
const RED = '#c43f52';
const WOOD = '#92400e';
const LINE = '#76906a';
const LAND = '#eef4e6';
const WATERMARK = '#9aa8bd';

const FX = 48;
const RX0 = 572;
const FY = 88;
const FW = 460;
const FH = 232;

const PAD = 16;
const ANIM_MS = 900;

// 良态目标位（垄上整齐分布）
const TARGETS: [number, number][] = [
  [110, 146],
  [190, 146],
  [270, 146],
  [350, 146],
  [430, 146],
  [150, 204],
  [250, 204],
  [350, 204],
  [190, 262],
  [290, 262],
  [390, 262],
];

type DPt = { a: [number, number]; b: [number, number]; bad: boolean };

// 左田 11 个点：6 正常 + 2 越界 + 3 扎堆
const LEFT_PTS: DPt[] = [
  { a: [110, 146], b: [110, 146], bad: false },
  { a: [190, 146], b: [190, 146], bad: false },
  { a: [26, 62], b: [270, 146], bad: true },
  { a: [534, 344], b: [350, 146], bad: true },
  { a: [430, 146], b: [430, 146], bad: false },
  { a: [150, 204], b: [150, 204], bad: false },
  { a: [250, 204], b: [250, 204], bad: false },
  { a: [298, 204], b: [350, 204], bad: true },
  { a: [304, 198], b: [190, 262], bad: true },
  { a: [306, 210], b: [290, 262], bad: true },
  { a: [390, 262], b: [390, 262], bad: false },
];

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  size: number,
  align: 'left' | 'right' | 'center' = 'left'
): void {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

function cross(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(cx - r, cy - r);
  ctx.lineTo(cx + r, cy + r);
  ctx.moveTo(cx + r, cy - r);
  ctx.lineTo(cx - r, cy + r);
  ctx.stroke();
}

function perimeter(x: number, y: number, w: number, h: number, n: number): [number, number][] {
  const out: [number, number][] = [];
  const per = 2 * (w + h);
  for (let i = 0; i < n; i++) {
    const d = (per * i) / n;
    let px: number;
    let py: number;
    if (d < w) {
      px = x + d;
      py = y;
    } else if (d < w + h) {
      px = x + w;
      py = y + (d - w);
    } else if (d < 2 * w + h) {
      px = x + w - (d - w - h);
      py = y + h;
    } else {
      px = x;
      py = y + h - (d - 2 * w - h);
    }
    out.push([px, py]);
  }
  return out;
}

function drawField(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  roundRect(ctx, x, y, w, h, 12);
  ctx.fillStyle = LAND;
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(118,144,106,0.42)';
  ctx.lineWidth = 10;
  for (let k = 1; k <= 3; k++) {
    const yy = y + (h * k) / 4;
    ctx.beginPath();
    ctx.moveTo(x + PAD, yy);
    ctx.lineTo(x + w - PAD, yy);
    ctx.stroke();
  }
}

function drawFence(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  p: number
): void {
  const fx = x - PAD;
  const fy = y - PAD;
  const fw = w + PAD * 2;
  const fh = h + PAD * 2;

  if (p < 1) {
    ctx.globalAlpha = 1 - p;
    ctx.setLineDash([9, 8]);
    ctx.strokeStyle = AXIS;
    ctx.lineWidth = 2;
    ctx.strokeRect(fx, fy, fw, fh);
    ctx.setLineDash([]);
  }
  if (p > 0.01) {
    ctx.globalAlpha = p;
    ctx.strokeStyle = WOOD;
    ctx.lineWidth = 3;
    ctx.strokeRect(fx, fy, fw, fh);
  }
  const posts = perimeter(fx, fy, fw, fh, 14);
  posts.forEach(([px, py], i) => {
    const vis = i % 3 === 0 ? 1 : p;
    if (vis <= 0.02) return;
    ctx.globalAlpha = vis * 0.92;
    ctx.fillStyle = WOOD;
    ctx.fillRect(px - 2.5, py - 8, 5, 16);
  });
  ctx.globalAlpha = 1;
}

export const Ch1Fence: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const st = useRef({ phase: 'before' as 'before' | 'anim' | 'after', p: 0, t0: 0 });
  const fbRef = useRef({ text: '', cls: '' });
  const [phase, setPhase] = useState<'before' | 'anim' | 'after'>('before');
  const [fb, setFb] = useState({
    text: '左田没有围栏：两个概念跑出了田外，还有三个挤成一窝。点「立围栏」治一遍。',
    cls: '',
  });

  const applyFb = (text: string, cls: string) => {
    if (fbRef.current.text === text && fbRef.current.cls === cls) return;
    fbRef.current = { text, cls };
    setFb({ text, cls });
  };

  const onFence = () => {
    const s = st.current;
    if (s.phase === 'before') {
      s.phase = 'anim';
      s.t0 = performance.now();
      s.p = 0;
      setPhase('anim');
    } else if (s.phase === 'after') {
      s.phase = 'before';
      s.p = 0;
      setPhase('before');
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const tick = () => {
      const now = performance.now();
      const s = st.current;
      if (s.phase === 'anim') {
        const e = clamp((now - s.t0) / ANIM_MS, 0, 1);
        s.p = easeOutCubic(e);
        if (e >= 1) {
          s.phase = 'after';
          s.p = 1;
          setPhase('after');
        }
      }

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // 左田（可被「立围栏」治愈）
      drawField(ctx, FX, FY, FW, FH);
      drawFence(ctx, FX, FY, FW, FH, s.p);
      LEFT_PTS.forEach((pt, i) => {
        const x = lerp(pt.a[0], pt.b[0], s.p);
        const y = lerp(pt.a[1], pt.b[1], s.p);
        const col = pt.bad ? lerpColor(RED, GREEN, s.p) : GREEN;
        const r = 10 + Math.sin(now / 620 + i) * 0.9;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        if (pt.bad && s.p < 0.55) {
          ctx.globalAlpha = 1 - s.p / 0.55;
          cross(ctx, x, y, 6.5, '#ffffff');
          ctx.globalAlpha = 1;
        }
      });
      label(ctx, '无围栏', FX, FY - 32, MUTE, 16);

      // 右田（始终良态）
      drawField(ctx, RX0, FY, FW, FH);
      drawFence(ctx, RX0, FY, FW, FH, 1);
      TARGETS.forEach(([tx, ty], i) => {
        const r = 10 + Math.sin(now / 620 + i + 3) * 0.9;
        ctx.fillStyle = GREEN;
        ctx.beginPath();
        ctx.arc(tx - FX + RX0, ty, r, 0, Math.PI * 2);
        ctx.fill();
      });
      label(ctx, '有围栏', RX0, FY - 32, MUTE, 16);

      label(ctx, '机制示意', W - 24, H - 14, WATERMARK, 13, 'right');

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');

      if (s.phase === 'before') {
        applyFb('左田没有围栏：两个概念跑出了田外，还有三个挤成一窝。点「立围栏」治一遍。', '');
      } else if (s.phase === 'anim') {
        applyFb('围栏立起来了——越界的被拦回田里，扎堆的散到各自的垄上。', '');
      } else {
        applyFb('左田的点也全落在垄内了。候选集不是让模型更准，而是让它的输出只能落在田里。', 'good');
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const startLoop = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, startLoop, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const btnLabel = phase === 'before' ? '立围栏' : phase === 'anim' ? '立围栏中…' : '复原';

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div style={{ display: 'flex', gap: 18, marginTop: 10 }}>
        <div style={{ flex: 1, fontSize: 13, lineHeight: 1.7, color: MUTE }}>
          <b style={{ color: RED }}>不给候选</b>
          {' —— '}
          模型自由发挥：有的概念跑到田外，有的挤在一处。论文 §3.1 的解法是
          <b style={{ color: '#21324a' }}>把输出空间限死在候选集内</b>
          。
        </div>
        <div style={{ flex: 1, fontSize: 13, lineHeight: 1.7, color: MUTE }}>
          <b style={{ color: GREEN }}>给了候选</b>
          {' —— '}
          先建好一张候选表，再让 LLM 从表里挑。它只能落在田垄之间，越界与扎堆都不再发生。
        </div>
      </div>
      <div className="ctrl">
        <button type="button" onClick={onFence} disabled={phase === 'anim'}>
          {btnLabel}
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
