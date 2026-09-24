import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawArm,
  drawVerdict,
  drawSceneLabel,
  drawLegend,
  drawTokenChip,
} from './chefKit';
import type { WidgetProps } from './registry';

// Module 2.2 「会说不会做」 — try to control the robot with the VLM's TEXT
// answer: the command port rejects it (invalid action tokens, red). Switch to
// the numeric token string and the arm executes (green). Sets up §3's insight:
// the missing piece is the OUTPUT FORMAT, not the knowledge.
const W = 1080;
const H = 280;
const FLY_MS = 900;

type Feed = 'text' | 'tokens';
interface FeedState {
  feed: Feed;
  phase: 'idle' | 'flying' | 'done';
  startAt: number;
}

const TEXT_ANSWER = ['一瓶可乐', '和水果'];
const TOKENS = ['1', '128', '91', '241', '5', '101', '127', '30'];

export const Ch2Execute: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<FeedState>({ feed: 'text', phase: 'idle', startAt: 0 });
  const [feed, setFeed] = useState<Feed>('text');
  const [phase, setPhase] = useState<'idle' | 'flying' | 'done'>('idle');
  const [feedback, setFeedback] = useState({
    text: '先把厨师的文字回答发给机械臂试试——按下发送。',
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
    let raf: number | null = null;

    const render = (ms: number) => {
      const st = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // left 32% — the VLM (chef + book) producing its answer
      drawSceneLabel(ctx, 'VLM 的回答', 30, 34, { color: C.blue });
      const items: { draw: (x: number, y: number) => void; w: number }[] =
        st.feed === 'text'
          ? TEXT_ANSWER.map((txt) => ({
              w: 14 + txt.length * 14,
              draw: (x: number, y: number) => {
                ctx.fillStyle = C.blue;
                ctx.strokeStyle = C.blue;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.roundRect(x, y - 14, 14 + txt.length * 14, 28, 14);
                ctx.fill();
                ctx.fillStyle = C.white;
                ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(txt, x + (14 + txt.length * 14) / 2, y);
              },
            }))
          : TOKENS.map((v) => ({
              w: 34,
              draw: (x: number, y: number) => drawTokenChip(ctx, x + 17, y, v),
            }));

      // right side — the robot command port + arm
      const portX = 760;
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(portX - 26, 92, 52, 76, 6);
      ctx.stroke();
      drawSceneLabel(ctx, '指令口', portX, 190, { color: C.muted, align: 'center' });
      drawArm(ctx, 900, 220, { scale: 1.6, angle: st.phase === 'done' && st.feed === 'tokens' ? 0.6 : 0.25 });

      // flight animation: items travel from the answer column into the port
      const p =
        st.phase === 'idle' ? 0 : clamp((ms - st.startAt) / FLY_MS, 0, 1);
      const nFly = st.phase === 'idle' ? items.length : Math.ceil(p * items.length);
      items.forEach((it, i) => {
        // compact stack: 8 items must fit the 280px canvas (56 + i*26 → 56..238)
        const iy = 56 + i * 26;
        const isFlying = i < nFly;
        if (!isFlying) {
          it.draw(30, iy);
          return;
        }
        const fp = clamp((ms - st.startAt - i * (FLY_MS / items.length)) / (FLY_MS / items.length + 120), 0, 1);
        const x = 30 + (portX - 40 - 30) * fp;
        ctx.save();
        ctx.globalAlpha = 1 - fp * 0.25;
        it.draw(x, iy + (140 - iy) * fp);
        ctx.restore();
      });

      // verdict at the port after everything arrived
      if (st.phase === 'done') {
        const ok = st.feed === 'tokens';
        drawVerdict(ctx, portX, 60, ok, { r: 17, pulse: ms / 350 });
        if (!ok) {
          ctx.fillStyle = C.red;
          ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('非法动作 token，拒绝执行', portX + 30, 60);
        } else {
          ctx.fillStyle = C.green;
          ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('8 个档位词，合法，执行！', portX + 30, 60);
        }
      }

      drawLegend(
        ctx,
        [
          ['文字回答', C.blue],
          ['动作 token', C.purple],
        ],
        30,
        H - 18
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const tick = (ms: number) => {
      const st = stateRef.current;
      if (st.phase === 'flying' && ms - st.startAt > FLY_MS + 500) {
        st.phase = 'done';
        setPhase('done');
        setFeedback(
          st.feed === 'text'
            ? { text: '知识再丰富也发不出去：机械臂只认 0-255 的档位词——差的是输出格式，不是脑子。', cls: 'bad' }
            : { text: '换成档位词立刻通了：同一颗大脑，换一种「语言」就能驱动机器人。', cls: 'good' }
        );
      }
      render(ms);
      if (raf !== null && canvas) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const choose = (f: Feed) => {
    const st = stateRef.current;
    st.feed = f;
    st.phase = 'idle';
    setFeed(f);
    setPhase('idle');
    setFeedback(
      f === 'text'
        ? { text: '把厨师的文字回答发给机械臂——按下发送。', cls: '' }
        : { text: '把 8 个档位词发给机械臂——按下发送。', cls: '' }
    );
  };

  const send = () => {
    const st = stateRef.current;
    st.phase = 'flying';
    st.startAt = performance.now();
    setPhase('flying');
    setFeedback({ text: '发送中……', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className={`chip ${feed === 'text' ? 'selected' : ''}`} onClick={() => choose('text')}>
          发文字回答
        </button>
        <button type="button" className={`chip ${feed === 'tokens' ? 'selected' : ''}`} onClick={() => choose('tokens')}>
          发动作串
        </button>
        <button type="button" className="tiny" onClick={send} disabled={phase === 'flying'}>
          {phase === 'done' ? '重发' : '发送'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Execute;
