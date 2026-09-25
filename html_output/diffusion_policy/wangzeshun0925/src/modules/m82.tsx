import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  clearScene,
  drawBoard,
  drawPlane,
  drawTarget,
  drawSceneLabel,
  drawLegend,
  OK,
  BAD,
  EMPH,
  AUX,
  MUTED,
  LINE,
} from './woodKit';
import type { WidgetProps } from './registry';

// 第 9 章 模块 9.2 —— 位置控制还是速度控制
// 左：两条相对性能曲线（按论文 Fig 4 与 Fig 5 右的趋势示意，不是实测值）。
// 右：板面上的走刀轨迹与目标位置；性能下滑时轨迹冲过目标。

const W = 1080;
const H = 280;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

type Ctrl = 'position' | 'velocity';

const perfOf = (ctrl: Ctrl, latency: number): number =>
  ctrl === 'position'
    ? Math.max(0, 1 - 0.04 * Math.max(0, latency - 4))
    : Math.max(0, 1 - 0.14 * latency);

const PX0 = 66;
const PX1 = 574;
const PY0 = 186;
const PY1 = 60;

const lx = (l: number): number => PX0 + (l / 8) * (PX1 - PX0);
const ly = (p: number): number => PY0 - p * (PY0 - PY1);

const BD_X = 650;
const BD_Y = 200;
const BD_W = 390;
const BD_H = 35;
const START_X = 676;
const TARGET_X = 940;

const feedbackFor = (ctrl: Ctrl, latency: number): { text: string; cls: string } => {
  const tail = '两条曲线是按论文 Fig 4 与 Fig 5（右）的趋势画的示意，不是实测数值。';
  if (ctrl === 'velocity')
    return { text: '速度控制对延迟敏感得多，误差会累积。' + tail, cls: 'bad' };
  if (latency <= 4)
    return {
      text: '位置控制配合动作序列预测，延迟不超过 4 步时基本不掉性能。' + tail,
      cls: 'good',
    };
  return { text: '超出 4 步后开始缓慢下滑。' + tail, cls: '' };
};

export const M82: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const lastRef = useRef(0);
  const stateRef = useRef<{ ctrl: Ctrl; latency: number }>({
    ctrl: 'position',
    latency: 0,
  });
  const [ctrl, setCtrl] = useState<Ctrl>('position');
  const [latency, setLatency] = useState(0);
  const [feedback, setFeedback] = useState(feedbackFor('position', 0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { ctrl: Ctrl; latency: number }) => {
      clearScene(ctx, W, H);
      const perf = perfOf(s.ctrl, s.latency);

      // ---- 左：相对性能曲线 ----
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(36, 28, 568, 184);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(36.75, 28.75, 566.5, 182.5);

      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PX0, PY1 - 4);
      ctx.lineTo(PX0, PY0);
      ctx.lineTo(PX1, PY0);
      ctx.stroke();

      const curve = (mode: Ctrl, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let l = 0; l <= 8.0001; l += 0.25) {
          const cx = lx(l);
          const cy = ly(perfOf(mode, l));
          if (l === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        }
        ctx.stroke();
      };
      curve('position', OK);
      curve('velocity', BAD);

      // 当前延迟的竖线与两条曲线上的当前点
      const vline = lx(s.latency);
      ctx.strokeStyle = EMPH;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(vline, 52);
      ctx.lineTo(vline, 192);
      ctx.stroke();

      const dot = (mode: Ctrl, color: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(vline, ly(perfOf(mode, s.latency)), 4, 0, Math.PI * 2);
        ctx.fill();
      };
      dot('position', OK);
      dot('velocity', BAD);

      ctx.font = '12px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillStyle = MUTED;
      for (let l = 0; l <= 8; l += 1) {
        ctx.fillText(String(l), lx(l), 202);
      }
      ctx.textAlign = 'right';
      ctx.fillText('1', PX0 - 6, PY1 + 4);
      ctx.fillText('0', PX0 - 6, PY0 + 4);
      ctx.textAlign = 'left';

      drawSceneLabel(ctx, '示意趋势', 52, 46, MUTED);
      drawLegend(
        ctx,
        [
          { color: OK, text: '位置控制' },
          { color: BAD, text: '速度控制' },
        ],
        300,
        46
      );

      // ---- 右：板面上的走刀轨迹与目标 ----
      drawBoard(ctx, BD_X, BD_Y, BD_W, BD_H, null);
      const overshoot = (1 - perf) * 80;
      const endX = TARGET_X + overshoot;
      const modeColor = s.ctrl === 'position' ? OK : BAD;

      ctx.strokeStyle = modeColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(START_X, BD_Y);
      ctx.lineTo(TARGET_X, BD_Y);
      ctx.stroke();

      if (overshoot > 2) {
        ctx.strokeStyle = BAD;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(TARGET_X, BD_Y);
        ctx.lineTo(endX, BD_Y);
        ctx.stroke();
      }

      ctx.fillStyle = AUX;
      ctx.beginPath();
      ctx.arc(START_X, BD_Y, 4, 0, Math.PI * 2);
      ctx.fill();
      drawTarget(ctx, TARGET_X, BD_Y, perf > 0.9 ? 'reached' : 'pending');
      drawPlane(ctx, endX, BD_Y, { length: 54 });
      drawSceneLabel(ctx, '目标位置', 862, 186, MUTED);
    };

    const tick = (ts: number) => {
      const last = lastRef.current;
      lastRef.current = ts;
      if (last !== 0) elapsedRef.current += Math.min(64, ts - last) / 1000;
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = 0;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const commit = (next: Ctrl, nextLatency: number) => {
    stateRef.current.ctrl = next;
    stateRef.current.latency = nextLatency;
    setCtrl(next);
    setLatency(nextLatency);
    setFeedback(feedbackFor(next, nextLatency));
  };

  const onLatency = (e: React.ChangeEvent<HTMLInputElement>) => {
    commit(stateRef.current.ctrl, clamp(Number(e.target.value), 0, 8));
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        aria-label="位置控制与速度控制在延迟下的相对性能示意图"
      />
      <div className="chip-row">
        <button
          className={'chip' + (ctrl === 'position' ? ' selected' : '')}
          onClick={() => commit('position', latency)}
        >
          位置控制
        </button>
        <button
          className={'chip' + (ctrl === 'velocity' ? ' selected' : '')}
          onClick={() => commit('velocity', latency)}
        >
          速度控制
        </button>
      </div>
      <div className="ctrl">
        <label>
          延迟步数 <span className="val">{latency}</span>
        </label>
        <input
          type="range"
          min={0}
          max={8}
          step={1}
          value={latency}
          onChange={onLatency}
        />
      </div>
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default M82;
