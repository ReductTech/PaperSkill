import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawOrderCard,
  drawTokenChip,
  drawArm,
  drawCheckMark,
  drawSceneLabel,
  drawLegend,
} from './chefKit';
import type { WidgetProps } from './registry';

// Module 3.1 「同一个大脑，两种回答」 — P3 synchronized compare. One shared
// start/replay button drives both examples on the same clock (~1.6s): the top
// VQA example types out a text answer, the bottom robot example lays down the
// action token string in the paper's full 8-dim format (gripper token appended,
// matching module 4.2) chip by chip, then the little
// arm wiggles. Format differs — model is the same.
const W = 1080;
const H = 280;
const DUR = 1600;
const TOKENS = [1, 128, 91, 241, 5, 101, 127, 30];
const ANSWER = '一瓶可乐和水果';

type Phase = 'idle' | 'running' | 'done';

const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number) => {
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2 - 9, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y);
  ctx.lineTo(x2 - 9, y - 5);
  ctx.lineTo(x2 - 9, y + 5);
  ctx.closePath();
  ctx.fillStyle = C.deep;
  ctx.fill();
};

const drawSpeechBubble = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  text: string,
  idle: boolean,
  running: boolean
) => {
  ctx.save();
  ctx.font = '14px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  const shown = idle ? '' : text + (running ? '▍' : '');
  const w = Math.max(ctx.measureText(shown).width + 30, 90);
  if (idle) {
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cx - w / 2, cy - 18, w, 36, 9);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = C.muted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('？', cx, cy + 1);
  } else {
    ctx.fillStyle = C.blue;
    ctx.beginPath();
    ctx.roundRect(cx - w / 2, cy - 18, w, 36, 9);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy + 16);
    ctx.lineTo(cx - 20, cy + 30);
    ctx.lineTo(cx - 2, cy + 17);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = C.white;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(shown, cx, cy + 1);
  }
  ctx.restore();
};

export const Ch3Twolanguage: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const runRef = useRef({ phase: 'idle' as Phase, start: 0 });
  const [phase, setPhase] = useState<Phase>('idle');
  const [feedback, setFeedback] = useState({
    text: '按「开始」，两例同钟作答：同一个模型，两种「语言」。',
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

    const render = (st: { phase: Phase; start: number }, ms: number) => {
      const prog =
        st.phase === 'idle' ? 0 : clamp((ms - st.start) / DUR, 0, 1);
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      // top half — the VQA example
      drawSceneLabel(ctx, '看图问答', 36, 24);
      drawOrderCard(ctx, 120, 66, '图里有什么？');
      drawArrow(ctx, 178, 236, 66);
      const nChars = st.phase === 'idle' ? 0 : Math.round(clamp(prog * 1.3, 0, 1) * ANSWER.length);
      drawSpeechBubble(ctx, 386, 64, ANSWER.slice(0, nChars), st.phase === 'idle', st.phase === 'running');
      // bottom half — the robot example
      drawSceneLabel(ctx, '机器人控制', 36, 162);
      drawOrderCard(ctx, 120, 212, '该做什么？');
      drawArrow(ctx, 178, 236, 212);
      TOKENS.forEach((v, i) => {
        const appear = 0.18 + i * 0.1;
        if (st.phase === 'idle' || prog <= appear) return;
        const q = clamp((prog - appear) / 0.14, 0, 1);
        const s = 0.4 + 0.6 * easeOutCubic(q);
        ctx.save();
        ctx.translate(264 + i * 46, 212);
        ctx.scale(s, s);
        drawTokenChip(ctx, 0, 0, String(v), q < 1 ? C.orange : C.purple);
        ctx.restore();
      });
      // the arm executes once the string is complete
      const executing = st.phase === 'done';
      drawArm(ctx, 700, 250, {
        scale: 1.9,
        angle: executing ? 0.25 + Math.sin(ms / 160) * 0.3 : 0.25,
        grip: executing ? 0.5 + 0.5 * Math.sin(ms / 160) : 1,
        color: executing ? C.green : C.blue,
      });
      if (executing) {
        ctx.save();
        ctx.globalAlpha = 0.7 + 0.3 * Math.sin(ms / 150);
        drawCheckMark(ctx, 700, 168);
        ctx.restore();
      }
      drawLegend(
        ctx,
        [
          ['文字回答', C.blue],
          ['动作 token', C.purple],
          ['执行', C.green],
        ],
        806,
        24
      );
    };

    const tick = () => {
      const st = runRef.current;
      const now = performance.now();
      if (st.phase === 'running' && now - st.start >= DUR) {
        st.phase = 'done';
        setPhase('done');
        setFeedback({
          text: '问答与控制在 RT-2 里是同一件事：预测下一个词——只不过一种词是文字，另一种词是动作档位。',
          cls: 'good',
        });
      }
      render(runRef.current, now);
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

  const restart = () => {
    runRef.current = { phase: 'running', start: performance.now() };
    setPhase('running');
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="tiny" onClick={restart}>
          {phase === 'idle' ? '▶ 开始' : '↻ 重放'}
        </button>
        <span className="val">
          {phase === 'idle' ? '待命' : phase === 'running' ? '同钟作答中' : '同构展示'}
        </span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch3Twolanguage;
