import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// m3-1 — 前向与反向是同一行（1080×280，P2 单步前进/后退/重置）。
// 上方织机与纬线进度 + 下方 6 格仿射变换技术条；可逆性靠同一条计算往两个方向跑。

const W = 1080;
const H = 280;

const SCENE_BG = '#f5f8f0';
const C_WARP = '#b8c9a7';
const C_WARP_DEEP = '#76906a';
const C_LOOM = '#92400e';
const C_WEAVE = '#27446e';
const C_CROSS = '#7c3aed';
const C_SHUTTLE = '#f07e47';
const C_DONE = '#228d5c';
const C_BAD = '#c43f52';
const C_INSET = '#ffffff';
const C_MUTED = '#68778f';
const C_AXIS = '#d7deea';
const C_LABEL = '#21324a';

type XY = [number, number];
type WarpMark = 'normal' | 'dim' | 'broken';
type WarpState = (i: number) => WarpMark;

// ── Reusable Canvas drawing kit (defined locally in every widget file) ──────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = SCENE_BG;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = C_AXIS;
  ctx.fillRect(0, h - 26, w, 8);
  ctx.strokeStyle = C_WARP;
  ctx.lineWidth = 1.5;
  for (let x = 60; x <= w - 60; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x, h - 30);
    ctx.stroke();
  }
}

function drawSetting(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  warpCount: number,
  warpState?: WarpState
): void {
  ctx.strokeStyle = C_LOOM;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(14, 12, w - 28, h - 24);
  if (warpCount <= 0) return;
  const from = 60;
  const to = w - 60;
  const step = warpCount > 1 ? (to - from) / (warpCount - 1) : 0;
  for (let i = 0; i < warpCount; i++) {
    const x = from + i * step;
    const st = warpState ? warpState(i) : 'normal';
    ctx.strokeStyle = st === 'broken' ? C_BAD : st === 'dim' ? C_AXIS : C_WARP;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x, h - 30);
    ctx.stroke();
    if (st === 'broken') {
      ctx.strokeStyle = C_BAD;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 6, h / 2);
      ctx.lineTo(x + 6, h / 2);
      ctx.stroke();
    }
  }
}

function drawSubject(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  stateColor: string,
  flip = false
): void {
  const bw = 46 * scale;
  const bh = 18 * scale;
  const dir = flip ? -1 : 1;
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - dir * bw * 2.4, y);
  ctx.lineTo(x - dir * bw * 0.5, y);
  ctx.stroke();
  roundRect(ctx, x - bw / 2, y - bh / 2, bw, bh, 6 * scale);
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + dir * bw * 0.5, y - bh / 2);
  ctx.lineTo(x + dir * (bw * 0.5 + 9 * scale), y);
  ctx.lineTo(x + dir * bw * 0.5, y + bh / 2);
  ctx.closePath();
  ctx.stroke();
}

function drawPathOrSupport(
  ctx: CanvasRenderingContext2D,
  points: XY[],
  stateColor: string,
  width: number
): void {
  if (points.length < 2) return;
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.stroke();
}

function drawTarget(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  mode: 'corner' | 'band'
): void {
  ctx.strokeStyle = C_DONE;
  ctx.lineWidth = 2.5;
  if (mode === 'band') {
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.lineTo(x, y);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x - w, y - w);
    ctx.lineTo(x, y - w);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  variant: 'label' | 'muted'
): void {
  ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = variant === 'muted' ? C_MUTED : C_LABEL;
  ctx.fillText(text, x, y);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  items: { color: string; text: string }[]
): void {
  ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
  let cx = x;
  items.slice(0, 3).forEach((it) => {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 10, 12, 12);
    ctx.fillStyle = C_MUTED;
    ctx.fillText(it.text, cx + 17, y);
    cx += 17 + ctx.measureText(it.text).width + 22;
  });
}

function drawThread(
  ctx: CanvasRenderingContext2D,
  from: XY,
  to: XY,
  color: string,
  width: number,
  dashed: boolean
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dashed ? [6, 5] : []);
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0], to[1]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawInsetFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title?: string
): void {
  ctx.fillStyle = C_INSET;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C_AXIS;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  if (title) {
    ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = C_LABEL;
    ctx.fillText(title, x + 10, y + 20);
  }
}

// 技术条专用：一支水平箭头。
function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 9, y2 - 5);
  ctx.lineTo(x2 - 9, y2 + 5);
  ctx.closePath();
  ctx.fill();
}

// ── Widget ─────────────────────────────────────────────────────────────────────

type Phase = 'forward' | 'backward';

interface M31State {
  step: number;
  phase: Phase;
  /** 正向是否曾经走完（到过第 6 步）；反向只有在走完正向之后才成立 */
  forwardDone: boolean;
  aborted: boolean;
}

const SUB = ['₁', '₂', '₃', '₄', '₅', '₆'];

function feedbackFor(s: M31State): { text: string; cls: string } {
  if (s.aborted) {
    return {
      text: '反向不是把正向倒着走，而是从第 1 个位置重新从左到右算一遍；正向还没走完就退回，缺的上下文补不出来。请重置后先走完正向，再退回起点。',
      cls: 'bad',
    };
  }
  if (s.phase === 'backward' && s.step === 0) {
    return { text: '反向回到起点，织面与出发前完全一致——这就是可逆。', cls: 'good' };
  }
  if (s.forwardDone) {
    return {
      text: `前向走完了，可以一步步退回起点：反向是从第 1 个位置重新算的一遍，不是把正向倒着放（当前第 ${s.step} 步）。`,
      cls: '',
    };
  }
  return { text: `第 ${s.step} 步：这一格的仿射参数只由它前面的格子决定。`, cls: '' };
}

export const M31: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<M31State>({ step: 0, phase: 'forward', forwardDone: false, aborted: false });
  const rafRef = useRef<number | null>(null);
  const [state, setState] = useState<M31State>({
    step: 0,
    phase: 'forward',
    forwardDone: false,
    aborted: false,
  });
  const [feedback, setFeedback] = useState(
    feedbackFor({ step: 0, phase: 'forward', forwardDone: false, aborted: false })
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: M31State) => {
      clearScene(ctx, W, H);
      drawSetting(ctx, W, 180, 0);

      const y = 120;
      const x0 = 60;
      const x1 = 1020;
      const progress = s.step / 6;
      const reconstructed = !s.aborted && s.forwardDone && s.step === 0 && s.phase === 'backward';
      const tip = x0 + (x1 - x0) * progress;

      // 织口横线
      drawThread(ctx, [x0, y], [x1, y], C_AXIS, 1.5, false);

      // 已引出的纬线
      ctx.strokeStyle = s.aborted ? C_BAD : C_SHUTTLE;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(tip, y);
      ctx.stroke();

      // 梭子（唯一主体）；反向时朝左
      drawSubject(ctx, tip, y, 0.8, s.aborted ? C_BAD : C_SHUTTLE, s.phase === 'backward');

      // 成功复原的起点标记
      if (reconstructed) {
        ctx.strokeStyle = C_DONE;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x0, y, 14, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 下方仿射变换条
      drawInsetFrame(ctx, 30, 188, 1020, 80);

      const cells = 6;
      const csx = 52;
      const csy = 206;
      const cw = 96;
      const chh = 44;
      for (let i = 0; i < cells; i++) {
        const x = csx + i * (cw + 6);
        let fill = C_AXIS;
        if (i < s.step) fill = C_WEAVE;
        else if (i === s.step && s.step < 6) fill = C_SHUTTLE;
        ctx.fillStyle = fill;
        ctx.fillRect(x, csy, cw, chh);
        ctx.font = '15px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.fillStyle = i < s.step ? '#ffffff' : C_LABEL;
        ctx.fillText((s.phase === 'forward' ? 'x' : 'z') + SUB[i], x + 12, csy + chh / 2 + 6);
      }

      // 右侧两条重叠箭头：同一路径的两个方向
      drawArrow(ctx, 700, csy + 14, 1020, csy + 14, C_WEAVE);
      drawArrow(ctx, 700, csy + chh - 10, 1020, csy + chh - 10, C_MUTED);

      // 最多 2 个短标签
      drawSceneLabel(ctx, 40, 40, s.phase === 'forward' ? '正向' : '反向', 'label');
      if (s.aborted) drawSceneLabel(ctx, 96, 40, '作废', 'muted');
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const commit = (next: M31State) => {
    stateRef.current = next;
    setState(next);
    setFeedback(feedbackFor(next));
  };

  const onPrev = () => {
    const s = stateRef.current;
    if (s.step <= 0) return;
    // 只有“正向从未走完”时，中途退回才是无效操作；走完正向之后可以一步步退回起点
    commit({
      step: s.step - 1,
      phase: 'backward',
      forwardDone: s.forwardDone,
      aborted: s.aborted || !s.forwardDone,
    });
  };

  const onNext = () => {
    const s = stateRef.current;
    if (s.step >= 6) return;
    const nextStep = s.step + 1;
    commit({
      step: nextStep,
      phase: s.phase,
      forwardDone: s.forwardDone || nextStep === 6,
      aborted: s.aborted,
    });
  };

  const onReset = () => {
    commit({ step: 0, phase: 'forward', forwardDone: false, aborted: false });
  };

  const prevDisabled = state.step <= 0;
  const nextDisabled = state.step >= 6 && state.phase === 'forward';

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="chip" onClick={onPrev} disabled={prevDisabled}>
          上一步
        </button>
        <button className="chip" onClick={onNext} disabled={nextDisabled}>
          下一步
        </button>
        <button className="chip" onClick={onReset}>
          重置
        </button>
        <span>
          第 {state.step} / 6 步
        </span>
        <span className="val">{state.phase === 'forward' ? '正向' : '反向'}</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M31;
