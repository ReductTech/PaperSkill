import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  clearScene,
  drawTable,
  drawSceneLabel,
  FAIL,
  SUCCESS,
  TEXT_MUTED,
  BORDER,
} from './billiardsKit';

// §9 module 9.1「谁在吃时间」(1080×280) — 同一时间基的双通道进度条。
// 上通道「未加速」(约 116 ms) 与下通道「三项加速」(40 ms 以内) 从同一基线出发，
// 绿色通道先到终点；延迟数字（裸数字）写在通道末端，越低越好。

const W = 1080;
const H = 280;
const TRACK_X = 110;
const TRACK_W = 830;
const TRACK_H = 24;
const SLOW_Y = 92;
const FAST_Y = 164;
const NUMBER_X = 952;
const SLOW_MS = 116;
const FAST_MS = 40;
const RUN_SECONDS = 1.8;
const HOLD_SECONDS = 1.6;

const DONE_TEXT =
  '三项加速全开：延迟从约 116 毫秒压到 40 毫秒以内（越低越好，这是论文附录 A 报告的区间）。 ' +
  '真实世界实测 37.7 毫秒（10 步 flow matching、动作块 32）；同一实验里 π0.5 为 190.1 毫秒、Motus 为 1529.8 毫秒。';

interface Scene {
  runId: number;
  /** 同一时间基上的进度 0→1 */
  t: number;
  running: boolean;
  hold: number;
}

export const Wla91: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<Scene>({ runId: 0, t: 0, running: false, hold: 0 });
  const rafRef = useRef<number | null>(null);
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState({
    text: '按开始，两条同基线同时跑。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const renderScene = (c: CanvasRenderingContext2D, s: Scene) => {
      clearScene(c, W, H);
      drawTable(c, W, H);

      const slowFrac = clamp(s.t, 0, 1);
      const fastFrac = clamp(s.t * (SLOW_MS / FAST_MS), 0, 1);

      // 两条通道的底槽（同一基线、同一长度）
      c.save();
      c.fillStyle = BORDER;
      c.fillRect(TRACK_X, SLOW_Y, TRACK_W, TRACK_H);
      c.fillRect(TRACK_X, FAST_Y, TRACK_W, TRACK_H);
      c.restore();

      // 进度：未加速为红，三项加速为绿
      c.save();
      c.fillStyle = FAIL;
      c.fillRect(TRACK_X, SLOW_Y, TRACK_W * slowFrac, TRACK_H);
      c.fillStyle = SUCCESS;
      c.fillRect(TRACK_X, FAST_Y, TRACK_W * fastFrac, TRACK_H);
      c.restore();

      // 绿色通道到终点后描一圈，表示它已经跑完
      if (fastFrac >= 1) {
        c.save();
        c.strokeStyle = SUCCESS;
        c.lineWidth = 2;
        c.strokeRect(TRACK_X - 1, FAST_Y - 1, TRACK_W + 2, TRACK_H + 2);
        c.restore();
      }

      // 通道末端的裸数字：延迟毫秒数，越低越好
      const colored = s.runId > 0;
      drawSceneLabel(c, String(SLOW_MS), NUMBER_X, SLOW_Y + TRACK_H / 2, {
        size: 15,
        color: colored ? FAIL : TEXT_MUTED,
      });
      drawSceneLabel(c, String(FAST_MS), NUMBER_X, FAST_Y + TRACK_H / 2, {
        size: 15,
        color: colored ? SUCCESS : TEXT_MUTED,
      });

      // 最多两个短标签
      drawSceneLabel(c, '未加速', 48, SLOW_Y + TRACK_H / 2, { size: 12, color: TEXT_MUTED });
      drawSceneLabel(c, '三项加速', 48, FAST_Y + TRACK_H / 2, { size: 12, color: TEXT_MUTED });
    };

    let last = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      const s = stateRef.current;

      if (s.running) {
        s.t = Math.min(1, s.t + dt / RUN_SECONDS);
        if (s.t >= 1) {
          s.running = false;
          s.hold = 0;
          setRunning(false);
          setFeedback({ text: DONE_TEXT, cls: 'good' });
        }
      } else if (s.hold < HOLD_SECONDS) {
        s.hold += dt;
      }

      renderScene(ctx, s);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) {
        last = 0;
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onStart = () => {
    const s = stateRef.current;
    s.runId += 1;
    s.t = 0;
    s.hold = 0;
    s.running = true;
    setRunning(true);
    setFeedback({ text: '两条通道同一时间基推进……', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="tiny" type="button" onClick={onStart} disabled={running}>
          开始对比
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Wla91;
