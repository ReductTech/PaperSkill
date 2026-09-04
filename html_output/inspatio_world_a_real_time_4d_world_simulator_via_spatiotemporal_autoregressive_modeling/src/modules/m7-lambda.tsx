import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, sceneLabel } from './scene-kit';

const W = 560;
const H = 220;

// §7 M7.2 — P1 slider: λ_ctrl tilts the loss beam-scale between L_vis and
// λ·L_ctrl (Eq.5). Qualitative: the paper sets λ_ctrl as a balancing
// hyperparameter without a specific value.
export const M7Lambda: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ lambda: 1.0 });
  const rafRef = useRef<number | null>(null);
  const [lambda, setLambda] = useState(1.0);
  const [feedback, setFeedback] = useState({
    text: '论文的设定思想：λ_ctrl 作为平衡超参，让两个目标互不淹没。',
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

    const render = (s: { lambda: number }) => {
      clearScene(ctx, W, H);
      const l = s.lambda;
      // formula strip with emphasized λ
      ctx.fillStyle = C.text;
      ctx.font = '20px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText('L_JDMD  =  L_vis  +', 120, 52);
      const lw = 20 + l * 8;
      ctx.fillStyle = C.orange;
      ctx.font = `bold ${lw}px "Segoe UI", sans-serif`;
      ctx.fillText('λ_ctrl', 314, 54);
      ctx.fillStyle = C.text;
      ctx.font = '20px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText('· L_ctrl', 314 + lw * 2.6, 52);
      // beam scale
      const cx = 280;
      const cy = 150;
      const tilt = Math.max(-0.3, Math.min(0.3, (l - 1) * 0.28));
      ctx.strokeStyle = C.hillDark;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 34);
      ctx.lineTo(cx, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 130, cy - Math.sin(-tilt) * 130 * -1);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tilt);
      ctx.beginPath();
      ctx.moveTo(-130, 0);
      ctx.lineTo(130, 0);
      ctx.stroke();
      // pans
      const pan = (x: number, label: string, color: string, w: number) => {
        ctx.strokeStyle = C.hillDark;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x - 16, 26);
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 16, 26);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.fillRect(x - 26, 26, 52, 10);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, 20 - w * 6, 6 + w * 7, 0, Math.PI * 2);
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = C.text;
        ctx.font = '12px "Microsoft YaHei", sans-serif';
        ctx.fillText(label, x - 30, 52);
      };
      pan(-100, '画质 L_vis', C.green, 1);
      pan(100, '控制 λ·L_ctrl', C.blue, l / 2 + 0.4);
      ctx.restore();
      sceneLabel(ctx, '损失天平（示意）', 20, 30, true, 11);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(stateRef.current);
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    stateRef.current.lambda = v;
    setLambda(v);
    if (v < 0.4) {
      setFeedback({ text: '权重偏向画质：控制项声音变小——训练会更像纯 T2V 蒸馏。', cls: '' });
    } else if (v <= 1.6) {
      setFeedback({ text: '论文的设定思想：λ_ctrl 作为平衡超参，让两个目标互不淹没。', cls: '' });
    } else {
      setFeedback({ text: '权重偏向控制：几何服从优先，画质引导变弱（示意）。', cls: '' });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          λ_ctrl <span className="val">{lambda.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={200} step={5} value={Math.round(lambda * 100)} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M7Lambda;
