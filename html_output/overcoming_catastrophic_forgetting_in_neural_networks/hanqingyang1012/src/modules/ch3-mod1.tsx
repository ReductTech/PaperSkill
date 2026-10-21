import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// P3 同步对比（hybrid）：两个 540×280 并排面板；左「全部钉死」右「只钉关键点」。
// 一个「开始对比」按钮：共享 start 时间戳，两条线路按同一时间基准爬 1.6 s。
const PW = 540;
const PH = 280;
const RUN_MS = 1600;

const COL = {
  bg: '#f5f8f0',
  rockLight: '#b8c9a7',
  rockDark: '#76906a',
  rope: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  ink: '#21324a',
  muted: '#68778f',
};

type Status = 'idle' | 'running' | 'done';

interface PanelCfg {
  title: string;
  titleColor: string;
  barColor: string;
  cap: number;
  keep: number;
  pinAll: boolean;
}

// 线路岩点（面板坐标）；crux = index 2（高度 0.35），top = index 4（高度 1.0）
const ROUTE = [
  { x: 322, y: 205 },
  { x: 268, y: 182 },
  { x: 348, y: 160 },
  { x: 296, y: 118 },
  { x: 366, y: 76 },
];
const BOTTOM_Y = 205;
const SPAN = 129; // 205 - 76

const LEFT: PanelCfg = {
  title: '全部钉死',
  titleColor: COL.red,
  barColor: COL.red,
  cap: 0.35,
  keep: 0.98,
  pinAll: true,
};
const RIGHT: PanelCfg = {
  title: '只钉关键点',
  titleColor: COL.green,
  barColor: COL.green,
  cap: 0.92,
  keep: 0.9,
  pinAll: false,
};

function fracToY(frac: number): number {
  return BOTTOM_Y - frac * SPAN;
}

function fracToX(frac: number): number {
  const pts = ROUTE.map((h, i) => ({ f: (BOTTOM_Y - h.y) / SPAN, x: h.x }));
  for (let i = 0; i < pts.length - 1; i++) {
    if (frac <= pts[i + 1].f) {
      const span = pts[i + 1].f - pts[i].f || 1;
      return lerp(pts[i].x, pts[i + 1].x, clamp((frac - pts[i].f) / span, 0, 1));
    }
  }
  return pts[pts.length - 1].x;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawHold(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number
) {
  ctx.fillStyle = COL.blue;
  roundedRect(ctx, x - s / 2, y - s / 2, s, s, 4);
  ctx.fill();
}

function drawClimber(
  ctx: CanvasRenderingContext2D,
  footX: number,
  footY: number,
  color: string,
  handX: number,
  handY: number
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const hipY = footY - 46;
  const shY = hipY - 26;
  const shX = footX + 5;
  ctx.beginPath(); // legs
  ctx.moveTo(footX - 9, footY);
  ctx.lineTo(footX, hipY);
  ctx.lineTo(footX + 9, footY);
  ctx.stroke();
  ctx.beginPath(); // torso
  ctx.moveTo(footX, hipY);
  ctx.lineTo(shX, shY);
  ctx.stroke();
  ctx.beginPath(); // reaching arm
  ctx.moveTo(shX, shY);
  ctx.lineTo(handX, handY);
  ctx.stroke();
  ctx.beginPath(); // head
  ctx.arc(shX + 3, shY - 11, 7, 0, Math.PI * 2);
  ctx.fill();
}

function drawPanel(
  ctx: CanvasRenderingContext2D,
  spec: PanelCfg,
  frac: number,
  tSec: number,
  stateColor: string,
  stuck: boolean
) {
  // 背景 + 岩壁横带
  ctx.fillStyle = COL.bg;
  ctx.fillRect(0, 0, PW, PH);
  ctx.fillStyle = COL.rockLight;
  ctx.fillRect(0, 48, PW, PH - 48);
  ctx.strokeStyle = COL.rockDark;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 48);
  ctx.lineTo(PW, 48);
  ctx.stroke();

  // 面板标题（≤2 标签）
  ctx.fillStyle = spec.titleColor;
  ctx.font = 'bold 20px "Segoe UI", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(spec.title, 24, 28);

  // 图例（≤3 项）：A保持 / B进度，颜色随面板
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.fillStyle = COL.green;
  ctx.beginPath();
  ctx.arc(398, 28, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COL.muted;
  ctx.fillText('A保持', 408, 28);
  ctx.fillStyle = spec.barColor;
  ctx.beginPath();
  ctx.arc(458, 28, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COL.muted;
  ctx.fillText('B进度', 468, 28);

  // 岩点 + 岩钉（左：全部钉死；右：只钉关键点；右顶岩点为绿色目标环）
  for (let i = 0; i < ROUTE.length; i++) {
    const h = ROUTE[i];
    drawHold(ctx, h.x, h.y, 18);
    const pinned = spec.pinAll || i === 2;
    if (pinned) {
      ctx.strokeStyle = COL.green;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(h.x, h.y, 15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = COL.ink;
      ctx.beginPath();
      ctx.moveTo(h.x, h.y - 16);
      ctx.lineTo(h.x - 4, h.y - 7);
      ctx.lineTo(h.x + 4, h.y - 7);
      ctx.closePath();
      ctx.fill();
    } else if (i === ROUTE.length - 1) {
      ctx.strokeStyle = COL.green;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(h.x, h.y, 15, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // 攀岩者（被钉死的岩点卡住时抖动）
  const wob = stuck ? Math.sin(tSec * 30) * 1.8 : 0;
  const handFrac = Math.min(frac + 0.1, 1);
  drawClimber(
    ctx,
    fracToX(frac) + wob,
    fracToY(frac) + 6,
    stateColor,
    fracToX(handFrac),
    fracToY(handFrac) - 8
  );

  // 底部两条进度条：任务A保持率 / 任务B进度（裸数字）
  const trackX = 24;
  const trackW = 404;
  const barY1 = 236;
  const barY2 = 258;
  const barH = 8;
  ctx.fillStyle = '#d7deea';
  roundedRect(ctx, trackX, barY1, trackW, barH, 4);
  ctx.fill();
  ctx.fillStyle = COL.green;
  roundedRect(ctx, trackX, barY1, trackW * spec.keep, barH, 4);
  ctx.fill();
  ctx.fillStyle = '#d7deea';
  roundedRect(ctx, trackX, barY2, trackW, barH, 4);
  ctx.fill();
  ctx.fillStyle = spec.barColor;
  roundedRect(ctx, trackX, barY2, trackW * frac, barH, 4);
  ctx.fill();
  ctx.font = 'bold 14px "Segoe UI", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COL.green;
  ctx.fillText(spec.keep.toFixed(2), trackX + trackW + 10, barY1 + barH / 2);
  ctx.fillStyle = spec.barColor;
  ctx.fillText(frac.toFixed(2), trackX + trackW + 10, barY2 + barH / 2);
}

export const Ch3Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const leftRef = useRef<HTMLCanvasElement>(null);
  const rightRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<{ status: Status; startTs: number; frac: number }>({
    status: 'idle',
    startTs: 0,
    frac: 0,
  });
  const [status, setStatus] = useState<Status>('idle');
  const [feedback, setFeedback] = useState({
    text: '点「开始」，两边同时出发。',
    cls: '',
  });

  useEffect(() => {
    const canvasL = leftRef.current;
    const canvasR = rightRef.current;
    if (!canvasL || !canvasR) return;
    let ctxL: CanvasRenderingContext2D;
    let ctxR: CanvasRenderingContext2D;
    try {
      ctxL = setupCanvas(canvasL, PW, PH);
      ctxR = setupCanvas(canvasR, PW, PH);
    } catch {
      return;
    }

    const tick = (now: number) => {
      const s = stateRef.current;
      if (s.status === 'running') {
        const raw = clamp((now - s.startTs) / RUN_MS, 0, 1);
        s.frac = 1 - Math.pow(1 - raw, 3);
        if (raw >= 1) {
          s.status = 'done';
          setStatus('done');
          setFeedback({
            text: '全部钉死：动不了，新路线学不会；只钉关键点：保护住了要害，新路线照样爬。',
            cls: 'good',
          });
        }
      } else if (s.status === 'done') {
        s.frac = 1;
      } else {
        s.frac = 0;
      }

      const tSec = now / 1000;
      const idle = s.status === 'idle';
      const leftFrac = Math.min(s.frac, LEFT.cap);
      const rightFrac = Math.min(s.frac, RIGHT.cap);
      drawPanel(
        ctxL,
        LEFT,
        leftFrac,
        tSec,
        idle ? COL.blue : COL.red,
        s.status === 'running' && leftFrac >= LEFT.cap
      );
      drawPanel(ctxR, RIGHT, rightFrac, tSec, idle ? COL.blue : COL.green, false);

      if (!canvasL.classList.contains('is-ready')) canvasL.classList.add('is-ready');
      if (!canvasR.classList.contains('is-ready')) canvasR.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const d1 = observeCanvas(canvasL, start, stop);
    const d2 = observeCanvas(canvasR, start, stop);
    return () => {
      stop();
      d1();
      d2();
    };
  }, []);

  const onStart = () => {
    const s = stateRef.current;
    s.status = 'running';
    s.startTs = performance.now();
    setStatus('running');
    setFeedback({ text: '两边同时开爬……', cls: '' });
  };

  return (
    <div>
      <div className="compare-row">
        <div className="compare-col">
          <canvas
            id={`cv-${chapterId}-${moduleId}-l`}
            ref={leftRef}
            width={PW}
            height={PH}
          />
        </div>
        <div className="compare-col">
          <canvas
            id={`cv-${chapterId}-${moduleId}-r`}
            ref={rightRef}
            width={PW}
            height={PH}
          />
        </div>
      </div>
      <div className="chip-row">
        <button className="chip" onClick={onStart} disabled={status === 'running'}>
          开始对比
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch3Mod1;
