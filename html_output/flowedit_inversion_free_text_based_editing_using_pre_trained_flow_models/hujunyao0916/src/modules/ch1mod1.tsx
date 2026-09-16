import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', brown: '#92400e',
  green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f', border: '#d7deea',
};

/** P3：左右同步对比——反演红路 vs FlowEdit 绿短路 */
export const Ch1Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ playing: false, t0: 0 });
  const rafRef = useRef<number | null>(null);
  const [feedback, setFeedback] = useState({ text: '点「开始」同步对比绕路与直达。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const drawPhoto = (x: number, y: number, color: string, drift = 0) => {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.fillRect(x - 24, y - 18, 48, 36);
      ctx.strokeRect(x - 24, y - 18, 48, 36);
      ctx.strokeStyle = C.muted;
      ctx.beginPath();
      ctx.moveTo(x - 12, y - 4 + drift);
      ctx.lineTo(x + 12, y + 4 - drift);
      ctx.stroke();
    };

    const render = (e: number) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = C.border;
      ctx.beginPath();
      ctx.moveTo(W / 2, 20);
      ctx.lineTo(W / 2, H - 20);
      ctx.stroke();

      // left inversion
      const lsx = 80;
      const lsy = 140;
      const ltx = 460;
      const lty = 160;
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(lsx, lsy);
      ctx.quadraticCurveTo(270, 40, ltx, lty);
      ctx.stroke();
      ctx.setLineDash([]);
      const lx = e < 0.5 ? lerp(lsx, 270, e * 2) : lerp(270, ltx, (e - 0.5) * 2);
      const ly =
        e < 0.5
          ? lerp(lsy, 40, e * 2)
          : lerp(40, lty, (e - 0.5) * 2);
      drawPhoto(lx, ly, C.red, e * 10);
      ctx.fillStyle = C.text;
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('反演绕路', 60, 36);

      // right short path
      const rsx = 600;
      const rsy = 140;
      const rtx = 980;
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(rsx, rsy);
      ctx.lineTo(rtx, rsy);
      ctx.stroke();
      drawPhoto(lerp(rsx, rtx, e), rsy, C.green, 0);
      ctx.fillText('短直路径', 600, 36);

      // legend
      ctx.fillStyle = C.red;
      ctx.fillRect(40, H - 36, 14, 14);
      ctx.fillStyle = C.green;
      ctx.fillRect(160, H - 36, 14, 14);
      ctx.fillStyle = C.muted;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('反演', 60, H - 24);
      ctx.fillText('FlowEdit', 180, H - 24);
    };

    const tick = (now: number) => {
      const s = stateRef.current;
      let e = 0;
      if (s.playing) {
        e = easeInOutQuad(Math.min(1, (now - s.t0) / 2400));
        if (e >= 1) {
          s.playing = false;
          setFeedback({ text: '绿路更短，结构更稳；红路绕噪后易漂移。', cls: 'good' });
        }
      }
      render(e);
      canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const startLoop = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const off = observeCanvas(canvas, startLoop, stop);
    return () => {
      stop();
      off();
    };
  }, []);

  const onStart = () => {
    stateRef.current = { playing: true, t0: performance.now() };
    setFeedback({ text: '两侧同步推进中……', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={onStart} className="tiny">
          开始
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Mod1;
