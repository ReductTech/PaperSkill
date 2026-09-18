import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §5 模块 5.1「有约束和没有约束的区别」（左右各一块 520×280）
// 同一起点、同一时间基准：左侧无约束，改动直接落到织物上，出现向下脱散的破洞；
// 右侧每一步都被检查，织片始终整齐，边缘保持绿色描边。

const W = 520;
const H = 280;

const BG = '#f5f8f0';
const GROUND = '#e6ead9';
const LINE = '#d7deea';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const ORANGE = '#f07e47';
const RED = '#c43f52';
const INK = '#21324a';
const SLATE = '#68778f';

const OX = 86;
const OY = 28;
const CW = 68;
const CH = 28;
const COLS = 5;
const ROWS = 6;
const FAB_W = COLS * CW;
const FAB_H = ROWS * CH;

const DURATION = 3000;
const HOLD = 1600;
const OPEN_FADE = 0.06;

const HOLES: { c: number; r: number }[] = [
  { c: 1, r: 1 },
  { c: 3, r: 1 },
  { c: 0, r: 2 },
  { c: 2, r: 2 },
  { c: 4, r: 2 },
  { c: 1, r: 3 },
  { c: 3, r: 3 },
  { c: 2, r: 4 },
  { c: 0, r: 4 },
];
const HOLE_TIME = [0.1, 0.16, 0.22, 0.34, 0.46, 0.58, 0.7, 0.82, 0.93];

type Phase = 'idle' | 'running' | 'done';

function roundRectPath(
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

function clearScene(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  const gy = H * 0.78;
  ctx.fillStyle = GROUND;
  ctx.fillRect(0, gy, W, H - gy);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, gy);
  ctx.lineTo(W, gy);
  ctx.stroke();
}

function drawKnit(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  color: string,
  width: number
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.5, cy - s * 0.4);
  ctx.quadraticCurveTo(cx - s * 0.2, cy + s * 0.26, cx, cy + s * 0.4);
  ctx.quadraticCurveTo(cx + s * 0.2, cy + s * 0.26, cx + s * 0.5, cy - s * 0.4);
  ctx.stroke();
  ctx.restore();
}

/** 一处脱散的破洞：缺口两侧的线圈向下松脱。 */
function drawHole(ctx: CanvasRenderingContext2D, cx: number, cy: number, o: number): void {
  const s = 40;
  const droop = 8 + 18 * o;
  ctx.save();
  ctx.globalAlpha = 0.35 + 0.65 * o;
  ctx.strokeStyle = RED;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.5, cy - s * 0.4);
  ctx.quadraticCurveTo(cx - s * 0.22, cy + s * 0.24, cx - s * 0.14, cy + droop);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.5, cy - s * 0.4);
  ctx.quadraticCurveTo(cx + s * 0.22, cy + s * 0.24, cx + s * 0.14, cy + droop * 0.78);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(cx, cy + 2, 3.4, 0, Math.PI * 2);
  ctx.fillStyle = RED;
  ctx.fill();
  ctx.restore();
}

function holeOpen(openness: number[], c: number, r: number): number {
  for (let i = 0; i < HOLES.length; i++) {
    if (HOLES[i].c === c && HOLES[i].r === r) return openness[i];
  }
  return 0;
}

/** 同一列上方的破洞会让下面的线圈一起下坠（脱散）。 */
function sagOf(openness: number[], c: number, r: number): number {
  let n = 0;
  for (let i = 0; i < HOLES.length; i++) {
    if (HOLES[i].c === c && HOLES[i].r < r && openness[i] > 0.02) n++;
  }
  return n * 3;
}

function renderSide(
  ctx: CanvasRenderingContext2D,
  side: 'left' | 'right',
  openness: number[],
  integrity: number
): void {
  clearScene(ctx);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const o = side === 'left' ? holeOpen(openness, c, r) : 0;
      if (o > 0.02) continue;
      const sag = side === 'left' ? sagOf(openness, c, r) : 0;
      drawKnit(ctx, OX + c * CW + CW / 2, OY + r * CH + CH / 2 + sag, 40, BLUE, 3.5);
    }
  }

  if (side === 'left') {
    for (let i = 0; i < HOLES.length; i++) {
      if (openness[i] <= 0.02) continue;
      drawHole(
        ctx,
        OX + HOLES[i].c * CW + CW / 2,
        OY + HOLES[i].r * CH + CH / 2,
        openness[i]
      );
    }
  }

  // 边界：左侧无约束（橙色虚线感），右侧结构完整（绿色描边）
  ctx.save();
  if (side === 'right') {
    ctx.strokeStyle = GREEN;
    ctx.lineWidth = 3;
  } else {
    ctx.strokeStyle = ORANGE;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.55;
    ctx.setLineDash([8, 6]);
  }
  roundRectPath(ctx, OX - 12, OY - 12, FAB_W + 24, FAB_H + 24, 10);
  ctx.stroke();
  ctx.restore();

  // 共用的结构完整度指标条
  ctx.fillStyle = SLATE;
  ctx.font = '15px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('结构完整度 ' + integrity + '%', 40, 216);
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = LINE;
  roundRectPath(ctx, 40, 222, 440, 10, 5);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = GREEN;
  roundRectPath(ctx, 40, 222, Math.max(4, 440 * (integrity / 100)), 10, 5);
  ctx.fill();

  // 共用图例（2 项）
  const items: { color: string; text: string }[] = [
    { color: BLUE, text: '完好线圈' },
    { color: RED, text: '脱散破洞' },
  ];
  items.forEach((it, i) => {
    const x = 40 + i * 150;
    ctx.fillStyle = it.color;
    roundRectPath(ctx, x, 244, 12, 12, 3);
    ctx.fill();
    ctx.fillStyle = SLATE;
    ctx.fillText(it.text, x + 19, 255);
  });

  // 每侧一个短标签
  ctx.fillStyle = INK;
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.fillText(side === 'left' ? '没有约束' : '有协议桥约束', 24, 20);
}

export const Ch5Grant: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const leftRef = useRef<HTMLCanvasElement>(null);
  const rightRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<{ startedAt: number | null }>({ startedAt: null });
  const phaseRef = useRef<Phase>('idle');
  const startLoopRef = useRef<() => void>(() => {});
  const lastRef = useRef<{ h: number; i: number }>({ h: -1, i: -1 });
  const [phase, setPhase] = useState<Phase>('idle');
  const [holesLeft, setHolesLeft] = useState(0);
  const [integrity, setIntegrity] = useState(0);
  // 右侧每一次改动都被检查过，因此破洞数恒为 0
  const holesRight = 0;

  useEffect(() => {
    const cl = leftRef.current;
    const cr = rightRef.current;
    if (!cl || !cr) return;
    let ctxL: CanvasRenderingContext2D;
    let ctxR: CanvasRenderingContext2D;
    try {
      ctxL = setupCanvas(cl, W, H);
      ctxR = setupCanvas(cr, W, H);
    } catch {
      return;
    }

    const tick = () => {
      rafRef.current = null;
      const now = performance.now();
      const st = stateRef.current;
      const elapsed = st.startedAt === null ? 0 : now - st.startedAt;
      const p = clamp(elapsed / DURATION, 0, 1);
      const openness = HOLE_TIME.map((t) => clamp((p - t) / OPEN_FADE, 0, 1));
      const integ = Math.round(easeOutCubic(p) * 100);
      renderSide(ctxL, 'left', openness, integ);
      renderSide(ctxR, 'right', openness, integ);
      if (!cl.classList.contains('is-ready')) cl.classList.add('is-ready');
      if (!cr.classList.contains('is-ready')) cr.classList.add('is-ready');

      if (phaseRef.current !== 'idle') {
        const h = openness.filter((o) => o > 0).length;
        if (lastRef.current.h !== h) {
          lastRef.current.h = h;
          setHolesLeft(h);
        }
        if (lastRef.current.i !== integ) {
          lastRef.current.i = integ;
          setIntegrity(integ);
        }
      }

      if (phaseRef.current === 'running') {
        if (elapsed > DURATION + HOLD) {
          phaseRef.current = 'done';
          setPhase('done');
        } else {
          rafRef.current = requestAnimationFrame(tick);
        }
      }
    };

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    startLoopRef.current = start;
    stop();
    tick();
    const d1 = observeCanvas(cl, start, stop);
    const d2 = observeCanvas(cr, start, stop);
    return () => {
      stop();
      d1();
      d2();
    };
  }, []);

  const startRun = () => {
    stateRef.current = { startedAt: performance.now() };
    phaseRef.current = 'running';
    lastRef.current = { h: -1, i: -1 };
    setPhase('running');
    startLoopRef.current();
  };

  const fbText =
    phase === 'idle'
      ? '点击开始，两侧会用同样的请求各跑一遍。'
      : phase === 'running'
      ? '左侧没有约束，改动直接落到织物上。'
      : '有约束的一侧保持完整：每次改动都被检查过，出问题也能退回。';

  return (
    <div>
      <div className="ctrl">
        <button type="button" className="tiny" onClick={startRun} disabled={phase === 'running'}>
          {phase === 'done' ? '再跑一次' : '同步开始'}
        </button>
        <label>
          两侧同一起点、同一时间基准 <span className="val">{integrity}%</span>
        </label>
      </div>
      <div className="compare-row">
        <div className="compare-col">
          <div className="compare-label" style={{ color: RED }}>
            没有约束
          </div>
          <canvas id={`cv-${chapterId}-${moduleId}-left`} ref={leftRef} width={W} height={H} />
        </div>
        <div className="compare-col">
          <div className="compare-label" style={{ color: GREEN }}>
            有协议桥约束
          </div>
          <canvas id={`cv-${chapterId}-${moduleId}-right`} ref={rightRef} width={W} height={H} />
        </div>
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">左侧破洞</div>
          <div className="v">{holesLeft}</div>
        </div>
        <div className="metric">
          <div className="l">右侧破洞</div>
          <div className="v">{holesRight}</div>
        </div>
        <div className="metric">
          <div className="l">结构完整度</div>
          <div className="v">{integrity}%</div>
        </div>
      </div>
      <div className={`feedback ${phase === 'done' ? 'good' : ''}`}>{fbText}</div>
    </div>
  );
};

export default Ch5Grant;
