import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const SKY = '#0b1830';
const GLOW = '#122346';
const DIM = '#7f8db0';
const STAR = '#dfe7f5';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const ORANGE = '#f07e47';
const BORDER = '#d7deea';

type Scheme = 'alternating' | 'joint';

export const Ch9Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [scheme, setScheme] = useState<Scheme>('alternating');
  const [feedback, setFeedback] = useState({
    text: '4 步交替训练，是论文全部实验采用的方式。',
    cls: 'good',
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
    const start0 = performance.now();

    const render = (now: number) => {
      const step = Math.floor(((now - start0) / 900) % 4);
      ctx.fillStyle = SKY;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = GLOW;
      ctx.fillRect(0, H - 50, W, 50);
      ctx.fillStyle = DIM;
      ctx.font = '16px sans-serif';
      ctx.fillText(scheme === 'alternating' ? '4 步交替训练' : '近似联合训练', 40, 40);

      if (scheme === 'alternating') {
        const labels = ['① 训 RPN', '② 训 Fast R-CNN', '③ 固定卷积调 RPN', '④ 固定卷积调 Fast R-CNN'];
        const xs = [110, 280, 450, 620];
        for (let i = 0; i < 4; i++) {
          const x = xs[i];
          const active = i === step;
          ctx.fillStyle = active ? (i % 2 === 0 ? BLUE : GREEN) : '#122346';
          ctx.strokeStyle = active ? ORANGE : BORDER;
          ctx.lineWidth = active ? 4 : 2;
          ctx.beginPath();
          ctx.arc(x, 110, 34, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = active ? STAR : DIM;
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(i + 1), x, 116);
          ctx.textAlign = 'left';
          if (i < 3) {
            ctx.strokeStyle = ORANGE;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x + 34, 110);
            ctx.lineTo(xs[i + 1] - 34, 110);
            ctx.stroke();
          }
          ctx.fillStyle = active ? STAR : DIM;
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(labels[i], x, 172);
          ctx.textAlign = 'left';
        }
      } else {
        const pulse = 1 + Math.sin((now - start0) / 400) * 0.06;
        ctx.fillStyle = GREEN;
        ctx.beginPath();
        ctx.arc(210, 110, 48 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = STAR;
        ctx.font = '15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('RPN +', 210, 104);
        ctx.fillText('Fast R-CNN', 210, 124);
        ctx.textAlign = 'left';
        ctx.strokeStyle = ORANGE;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(258, 110);
        ctx.lineTo(410, 110);
        ctx.stroke();
        ctx.fillStyle = BLUE;
        ctx.beginPath();
        ctx.arc(450, 110, 36, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = STAR;
        ctx.font = '15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('共享', 450, 116);
        ctx.textAlign = 'left';
        ctx.fillStyle = DIM;
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('一起反向传播', 330, 150);
        ctx.textAlign = 'left';
      }

      // training-time panel
      ctx.fillStyle = '#122346';
      ctx.fillRect(700, 50, 320, 120);
      ctx.fillStyle = scheme === 'alternating' ? BLUE : GREEN;
      const tw = scheme === 'alternating' ? 260 : 170;
      ctx.fillRect(720, 140, tw, 22);
      ctx.fillStyle = STAR;
      ctx.font = '15px sans-serif';
      ctx.fillText(scheme === 'alternating' ? '训练时间：100%（基准）' : '训练时间：约 50-75%', 720, 120);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (now: number) => {
      render(now);
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => {
      stop();
      disconnect();
    };
  }, [scheme]);

  const pick = (s: Scheme) => {
    setScheme(s);
    setFeedback(
      s === 'alternating'
        ? { text: '4 步交替训练：RPN 与 Fast R-CNN 交替微调，最终共享卷积，是论文采用的方式。', cls: 'good' }
        : { text: '近似联合训练：合并成一个网络一起反向传播，省 25-50% 时间，但忽略了对框坐标的导数。', cls: '' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className={scheme === 'alternating' ? 'active' : ''} onClick={() => pick('alternating')}>
          交替训练
        </button>
        <button type="button" className={scheme === 'joint' ? 'active' : ''} onClick={() => pick('joint')}>
          近似联合训练
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch9Mod1;
