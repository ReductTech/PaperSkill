import React, { useEffect, useRef, useState } from 'react';
import { clamp, setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  LP,
  lpRoundRect,
  drawField,
  drawPress,
  drawMeter,
  drawLabel,
  drawLegend,
  drawPot,
  drawKitchenCounter,
  drawSpiceBottle,
} from './letterpressKit';

type FormeMode = 'overwrite' | 'frozen';

const LAY = {
  plateX: 40,
  plateW: 600,
  cases: [
    { x: 60, y: 52, w: 280, h: 100 },
    { x: 60, y: 192, w: 280, h: 100 },
  ],
  metricsX: 680,
  metricsW: 360,
  legendY: 330,
};

const ACC_ROWS: number[][] = [
  [90, 0, 0],
  [70, 84, 0],
  [60, 62, 78],
];
const FROZEN_ROWS: number[][] = [
  [89, 0, 0],
  [89, 88, 0],
  [89, 88, 86],
];

/** 每个任务自己的历史最高分（分数表逐列取最大），用来解释遗忘是怎么算出来的。 */
const PEAKS: Record<FormeMode, number[]> = {
  overwrite: [90, 84, 78],
  frozen: [89, 88, 86],
};

function accs(mode: FormeMode, round: number): number[] {
  const rows = mode === 'overwrite' ? ACC_ROWS : FROZEN_ROWS;
  const idx = clamp(round - 1, 0, rows.length - 1);
  return rows[idx];
}

/**
 * 本页「遗忘」的口径：该任务的历史最高分 − 最终分。
 * 这是社区惯用的算法——论文只说 Forgetting「越小越好」，并没有印出公式。
 * 只改版头时任务 1 一直是 89，历史最高也是 89，所以遗忘是 0。
 */
function forget1(mode: FormeMode, round: number): number {
  if (round < 2) return 0;
  return Math.max(0, PEAKS[mode][0] - accs(mode, round)[0]);
}

function drawCaseGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  headCells: number,
  replaced: number,
  mode: FormeMode,
  active: boolean,
): void {
  const cells = 36;
  const head = clamp(headCells, 0, cells);
  const rep = clamp(replaced, 0, cells - head);
  drawField(ctx, x, y, w, h);
  for (let i = 0; i < cells; i++) {
    const isHead = i >= cells - head;
    const isRep = i >= head && i < head + rep;
    const fill =
      mode === 'overwrite' && isRep
        ? LP.failure
        : mode === 'frozen' && isHead
          ? LP.accent
          : LP.dark;
    const edge = mode === 'frozen' && isHead ? LP.accent : '';
    const r = Math.floor(i / 6);
    const c = i % 6;
    const cw = (w - 5 * 6) / 6;
    const ch = (h - 5 * 6) / 6;
    const cx = x + c * (cw + 6);
    const cy = y + r * (ch + 6);
    lpRoundRect(ctx, cx, cy, cw, ch, 4, fill, true);
    if (edge) {
      ctx.save();
      ctx.lineWidth = 3;
      ctx.strokeStyle = edge;
      lpRoundRect(ctx, cx + 1, cy + 1, cw - 2, ch - 2, 4, false, true);
      ctx.restore();
    }
  }
  drawPress(ctx, x - 10, y - 14, w + 20, 30, { press: active ? 1 : 0, active });
}

function drawMetrics(
  ctx: CanvasRenderingContext2D,
  x: number,
  w: number,
  acc: number[],
  mode: FormeMode,
  active: boolean,
): void {
  drawField(ctx, x - 12, 40, w + 24, 216);
  drawLabel(ctx, '记忆', x, 32, { size: 12, weight: 600, color: LP.muted });
  for (let i = 0; i < 3; i++) {
    const y = 58 + i * 66;
    const v = acc[i];
    const live = mode === 'overwrite' && active && i === 0;
    const color = v <= 0 ? LP.axis : live ? LP.failure : LP.success;
    drawMeter(ctx, x + 8, y - 2, 292, 26, v / 100, color);
    if (v > 0) drawLabel(ctx, String(v), x + 318, y + 18, { size: 12, weight: 700, color: LP.ink });
  }
  drawLegend(
    ctx,
    [
      { label: '改动', color: LP.failure },
      { label: '冻结', color: LP.accent },
    ],
    x,
    LAY.legendY,
  );
}

function renderNormal(
  ctx: CanvasRenderingContext2D,
  mode: FormeMode,
  round: number,
  started: boolean,
  t: number,
): void {
  const acc = accs(mode, round);
  drawField(ctx, 0, 0, 1080, 360);

  // 台面
  ctx.save();
  ctx.strokeStyle = LP.axis;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(LAY.plateX, 314);
  ctx.lineTo(LAY.plateX + LAY.plateW, 314);
  ctx.stroke();
  ctx.restore();

  const advance = started ? t : 0;
  const replaced = mode === 'overwrite' ? Math.round(clamp(advance, 0, 1) * 30) : 0;
  const active = started && t < 1;
  const press = started ? Math.min(1, t * 2) : 0;

  for (let i = 0; i < 2; i++) {
    const c = LAY.cases[i];
    const head = mode === 'frozen' ? 3 : 0;
    drawCaseGrid(ctx, c.x, c.y, c.w, c.h, head, i === 0 ? replaced : 0, mode, active && press > 0.2);
  }

  drawMetrics(ctx, LAY.metricsX, LAY.metricsW, acc, mode, active);
}

function renderAna(ctx: CanvasRenderingContext2D, t: number): void {
  drawField(ctx, 0, 0, 560, 140);
  const phase = clamp(t, 0, 1);
  // 左边：连灶台一起重学（串味）—— 锅在变色，味道混乱
  const leftColor = phase > 0.5 ? LP.failure : LP.support;
  drawPot(ctx, 50, 40, 100, 70, { fill: leftColor, withSteam: true, time: t });
  drawKitchenCounter(ctx, 30, 115, 160);
  // 串味的烟雾（混乱的颜色）
  if (phase > 0.3) {
    ctx.save();
    ctx.globalAlpha = 0.4 + Math.sin(t * 4) * 0.2;
    ctx.fillStyle = LP.failure;
    ctx.font = '16px sans-serif';
    ctx.fillText('串味', 75, 30);
    ctx.restore();
  }
  // 右边：只换调料（不串味）—— 锅不变，调料瓶在换
  drawPot(ctx, 330, 40, 100, 70, { fill: LP.support, withSteam: true, time: t });
  drawKitchenCounter(ctx, 310, 115, 160);
  // 调料架在变化
  const spiceColors = [LP.accent, LP.success, LP.aux];
  const activeSpice = Math.floor(phase * 3) % 3;
  drawSpiceBottle(ctx, 445, 50, 20, 35, { color: spiceColors[activeSpice], highlighted: true });
  drawLabel(ctx, '重学灶台', 50, 26, { size: 12, weight: 600, color: LP.failure });
  drawLabel(ctx, '只换调料', 330, 26, { size: 12, weight: 600, color: LP.success });
}

export const ChangeForme: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const isAna = moduleId === 'ana';
  const W = isAna ? 560 : 1080;
  const H = isAna ? 140 : 360;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ mode: 'overwrite' as FormeMode, round: 1, shownRound: 1, started: false, t: 0, ana: 0 });
  const rafRef = useRef(0);

  const [mode, setMode] = useState<FormeMode>('overwrite');
  const [round, setRound] = useState(1);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState('选择一种排法，然后连印三批。');
  const [tone, setTone] = useState<'' | 'good' | 'bad'>('');

  useEffect(() => {
    stateRef.current.mode = mode;
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const draw = () => {
      try {
        if (isAna) renderAna(ctx, stateRef.current.ana);
        else
          renderNormal(
            ctx,
            stateRef.current.mode,
            stateRef.current.started ? stateRef.current.shownRound : stateRef.current.round,
            stateRef.current.started,
            stateRef.current.t,
          );
        if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      } catch {
        /* 单帧绘制失败不应中断循环 */
      }
    };
    const start = () => {
      cancelAnimationFrame(rafRef.current);
      const loop = () => {
        if (isAna) {
          stateRef.current.ana = (stateRef.current.ana + 0.006) % 1;
        } else if (stateRef.current.started && stateRef.current.t < 1) {
          stateRef.current.t = Math.min(1, stateRef.current.t + 0.018);
          if (stateRef.current.t >= 1) setPlaying(false);
        }
        draw();
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    };
    const stop = () => cancelAnimationFrame(rafRef.current);
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [W, H, isAna]);

  const press = () => {
    if (playing || round >= 3) return;
    stateRef.current.t = 0;
    stateRef.current.started = true;
    setStarted(true);
    setPlaying(true);
    const nextRound = Math.min(3, round + 1);
    stateRef.current.shownRound = nextRound;
    setRound(nextRound);
    if (nextRound >= 3) {
      if (stateRef.current.mode === 'overwrite') {
        setMessage(
          `任务 1 准确率 90 → 70 → 60，遗忘 = 历史最高 90 − 最终 60 = ${forget1('overwrite', 3)}。`
        );
        setTone('bad');
      } else {
        setMessage(`任务 1 稳定在 89（历史最高也是 89），遗忘 = ${forget1('frozen', 3)}。`);
        setTone('good');
      }
    } else if (stateRef.current.mode === 'overwrite') {
      setMessage(`第 ${nextRound} 批：新任务的灶台又重练了，任务 1 掉到 ${ACC_ROWS[nextRound - 1][0]}。`);
      setTone(nextRound >= 2 ? 'bad' : '');
    } else {
      setMessage(`第 ${nextRound} 批：调料那几格换了新味，灶台一动没动，任务 1 还是 ${FROZEN_ROWS[nextRound - 1][0]}。`);
      setTone('good');
    }
  };

  const reset = () => {
    stateRef.current.round = 1;
    stateRef.current.shownRound = 1;
    stateRef.current.started = false;
    stateRef.current.t = 0;
    setRound(1);
    setStarted(false);
    setPlaying(false);
    setMessage('选择一种排法，然后连印三批。');
    setTone('');
  };

  const switchMode = (m: FormeMode) => {
    if (m === mode) return;
    if (m === 'frozen' && started) return;
    setMode(m);
    stateRef.current.mode = m;
    stateRef.current.round = round;
    stateRef.current.shownRound = round;
    stateRef.current.started = false;
    stateRef.current.t = 0;
    setStarted(false);
    setPlaying(false);
    if (m === 'overwrite') {
      setMessage('重练灶台：新任务要改的是整个灶台，旧任务的味道被从记忆里抹掉。');
    } else {
      setMessage('只换调料：灶台冻住，每来一个新任务就换一次调料那几格。');
    }
    setTone('');
  };

  const ana = isAna;
  const current = accs(mode, round);

  return (
    <div className="widget">
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />

      {!ana && (
        <>
          <div className="ctrl">
            <label>排法</label>
            <button
              type="button"
              className={`chip${mode === 'overwrite' ? ' selected' : ''}`}
              onClick={() => switchMode('overwrite')}
            >
              重练灶台（全部重学）
            </button>
            <button
              type="button"
              className={`chip${mode === 'frozen' ? ' selected' : ''}`}
              onClick={() => switchMode('frozen')}
            >
              换调料（只换调味）
            </button>
            <button
              type="button"
              className="chip"
              disabled={playing || round >= 3}
              onClick={press}
            >
              印下一批
            </button>
            <button type="button" className="chip ghost" onClick={reset}>
              重置
            </button>
          </div>

          <div className="metrics">
            <div className="metric">
              <span className="l">任务 1</span>
              <span className="v">{current[0]}</span>
            </div>
            <div className="metric">
              <span className="l">任务 2</span>
              <span className="v">{current[1] || '—'}</span>
            </div>
            <div className="metric">
              <span className="l">任务 3</span>
              <span className="v">{current[2] || '—'}</span>
            </div>
            <div className="metric">
              <span className="l">已印批次</span>
              <span className="v">{round} / 3</span>
            </div>
            <div className="metric">
              <span className="l">任务 1 遗忘</span>
              <span className="v">{round >= 2 ? forget1(mode, round) : '—'}</span>
            </div>
          </div>

          <div className="step-desc">
            Split CIFAR-100 上印的两个数是：整版重排的 FT-seq 平均准确率 <b>33.61</b>、遗忘率 <b>86.87</b>；把主干冻住只训分类器的
            FT-seq-frozen 反而更差——<b>17.72</b> 与 <b>59.09</b>。冻住主干更糟的原因：所有任务共用同一个分类器，
            它照样被覆盖。屏幕上的「任务 1 遗忘」用「历史最高分 − 最终分」算（指标越小越好，这是社区的惯例口径）。
          </div>

          <div className={`feedback ${tone}`}>{message}</div>
        </>
      )}
    </div>
  );
};

export default ChangeForme;
