import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// m10-1 — 结果赛跑与验证表（1080×280，P8）：按下「开始对比」让两个基准的
// 各条进度从同一基线增长，再用 2 个 chips 在 GenEval 与 DPG-Bench 之间切换。
// 本文方法（STARFlow2）在两个文生图基准上都不是最高分，因此本模块只画进度条与
// 数值表，绝不绘制奖杯或任何“获胜”装饰。

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

// ── Widget ─────────────────────────────────────────────────────────────────────

type Metric = 'geneval' | 'dpbench';

interface Row {
  name: string;
  value: number;
  self?: boolean;
}

const DATA: Record<Metric, Row[]> = {
  geneval: [
    { name: 'TUNA', value: 0.9 },
    { name: 'Mogao', value: 0.89 },
    { name: 'Qwen-Image', value: 0.87 },
    { name: 'STARFlow2', value: 0.82, self: true },
    { name: 'BAGEL', value: 0.82 },
    { name: 'SD3-Medium', value: 0.74 },
  ],
  dpbench: [
    { name: 'Qwen-Image', value: 88.32 },
    { name: 'TUNA', value: 86.76 },
    { name: 'Show-o2', value: 86.14 },
    { name: 'BAGEL', value: 85.07 },
    { name: 'STARFlow2', value: 84.94, self: true },
    { name: 'SD3-Medium', value: 84.08 },
  ],
};

const NEUTRAL = '两个基准的子项口径不同，切换时注意看表格里的说明。';
const FB_GENE =
  'GenEval 总分 0.82：与 14B 的 BAGEL 持平，但低于同量级的 TUNA(0.90) 与 Mogao(0.89)；带 † 的条目用了 LLM 重写器，本文没用。';
const FB_DP =
  'DPG-Bench 总分 84.94：高于 SD3-Medium(84.08)，低于 Qwen-Image(88.32) 与 TUNA(86.76)。论文正文与结论处写作 84.14，与表格不一致，这里以表格值为准。';

const LANE_X0 = 140;
const LANE_MAX = 520;
const LANE_TOP = 60;
const LANE_GAP = 32;
const BAR_H = 16;
const WIN_X = LANE_X0 + LANE_MAX;

interface M101State {
  metric: Metric;
  racing: boolean;
  progress: number;
}

export const M101: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<M101State>({ metric: 'geneval', racing: false, progress: 0 });
  const rafRef = useRef<number | null>(null);
  const [metric, setMetric] = useState<Metric>('geneval');
  const [racing, setRacing] = useState(false);
  const [runId, setRunId] = useState(0);
  const [feedback, setFeedback] = useState({ text: NEUTRAL, cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: M101State) => {
      clearScene(ctx, W, H);
      drawSetting(ctx, W, H, 0);

      const rows = DATA[s.metric];
      const maxValue = rows.reduce((m, r) => Math.max(m, r.value), 0);

      // ---- 左：赛跑泳道 ----
      drawInsetFrame(ctx, 30, 30, 670, 220, '');

      // 终点轴与刻度
      ctx.strokeStyle = C_AXIS;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(WIN_X + 0.5, 46);
      ctx.lineTo(WIN_X + 0.5, 242);
      ctx.stroke();
      for (let y = 46; y <= 242; y += 24) {
        ctx.beginPath();
        ctx.moveTo(WIN_X, y);
        ctx.lineTo(WIN_X + 6, y);
        ctx.stroke();
      }

      rows.forEach((r, i) => {
        const y = LANE_TOP + i * LANE_GAP;

        // 方法名
        ctx.textAlign = 'right';
        ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.fillStyle = r.self ? C_LABEL : C_MUTED;
        ctx.fillText(r.name, LANE_X0 - 14, y + 12);

        // 底槽
        ctx.fillStyle = C_AXIS;
        ctx.globalAlpha = 0.45;
        ctx.fillRect(LANE_X0, y, LANE_MAX, BAR_H);
        ctx.globalAlpha = 1;

        // 进度条
        const len = (r.value / maxValue) * LANE_MAX * clamp(s.progress, 0, 1);
        ctx.fillStyle = r.self ? C_DONE : C_WEAVE;
        ctx.fillRect(LANE_X0, y, len, BAR_H);

        // 本文方法标记（左端橙色小方角，而非任何“获胜”装饰）
        if (r.self) {
          ctx.fillStyle = C_SHUTTLE;
          ctx.beginPath();
          ctx.moveTo(LANE_X0 - 10, y - 6);
          ctx.lineTo(LANE_X0, y - 6);
          ctx.lineTo(LANE_X0, y + 4);
          ctx.closePath();
          ctx.fill();
        }

        // 数值
        ctx.textAlign = 'left';
        ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.fillStyle = C_LABEL;
        ctx.fillText(r.value.toFixed(2), LANE_X0 + len + 8, y + 12);
      });
      ctx.textAlign = 'left';

      // ---- 右：验证数据表 ----
      drawInsetFrame(ctx, 720, 30, 330, 220, '');
      const nameX = 734;
      const valueX = 920;
      const noteX = 974;

      ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = C_MUTED;
      ctx.fillText('方法', nameX, 52);
      ctx.fillText('数值', valueX, 52);
      ctx.fillText('备注', noteX, 52);

      rows.forEach((r, i) => {
        const by = 82 + i * 28;
        if (r.self) {
          ctx.fillStyle = 'rgba(34,141,92,0.14)';
          ctx.fillRect(726, by - 14, 318, 24);
        }
        ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.fillStyle = r.self ? C_DONE : C_LABEL;
        ctx.fillText(r.name, nameX, by + 4);
        ctx.fillStyle = C_LABEL;
        ctx.fillText(r.value.toFixed(2), valueX, by + 4);
        ctx.fillStyle = C_MUTED;
        ctx.fillText(r.self ? '本文方法' : '—', noteX, by + 4);
      });

      drawSceneLabel(ctx, 42, 24, '结果赛跑', 'muted');
      drawSceneLabel(ctx, 734, 24, '验证数据表', 'muted');

      drawLegend(ctx, 42, 268, [
        { color: C_DONE, text: '本文' },
        { color: C_WEAVE, text: '其他' },
        { color: C_AXIS, text: '基准' },
      ]);
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

  // 结果赛跑：约 1.8 秒把 progress 推满，结束后按当前基准给出结论
  useEffect(() => {
    if (!racing) return;
    let raf = 0;
    const t0 = performance.now();
    const DUR = 1800;
    const step = (now: number) => {
      const p = clamp((now - t0) / DUR, 0, 1);
      stateRef.current.progress = p;
      if (p >= 1) {
        stateRef.current.racing = false;
        stateRef.current.progress = 1;
        setRacing(false);
        setFeedback({
          text: metric === 'geneval' ? FB_GENE : FB_DP,
          cls: '',
        });
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [racing, metric, runId]);

  const rerun = (m: Metric) => {
    stateRef.current.metric = m;
    stateRef.current.progress = 0;
    stateRef.current.racing = true;
    setMetric(m);
    setRacing(true);
    setRunId((n) => n + 1);
    setFeedback({ text: NEUTRAL, cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className="tiny" onClick={() => rerun(metric)}>
          {racing ? '重新对比' : '开始对比'}
        </button>
        <button
          type="button"
          className={`chip${metric === 'geneval' ? ' selected' : ''}`}
          aria-pressed={metric === 'geneval'}
          onClick={() => rerun('geneval')}
        >
          GenEval
        </button>
        <button
          type="button"
          className={`chip${metric === 'dpbench' ? ' selected' : ''}`}
          aria-pressed={metric === 'dpbench'}
          onClick={() => rerun('dpbench')}
        >
          DPG-Bench
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M101;
