import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawArm,
  drawOrderCard,
  drawSceneLabel,
  drawLegend,
} from './chefKit';
import type { WidgetProps } from './registry';

// Ch6 module 6.1 「闭环步进机」 — P2 step. Five stations of one real-robot
// closed-loop beat: 1 camera observe -> 2 cloud query (multi-TPU) -> 3
// constrained decoding (funnel: full vocab strip, only the 256 action tokens
// pass) -> 4 arm executes -> 5 next beat, looping back to the camera. The
// metronome dial tempo matches the model: 55B ~1-3 Hz, 5B ~5 Hz (E06, E07).
const W = 1080;
const H = 280;
const SX = [110, 310, 540, 770, 990];
const SY = 150;

type Model = '55B' | '5B';

function feedbackFor(step: number, model: Model): { text: string; cls: string } {
  if (step === 1) return { text: '观察：相机图像+指令进模型。', cls: '' };
  if (step === 2) return { text: '云端：多 TPU 服务算一次前向。', cls: '' };
  if (step === 3) return { text: '约束：只从 256 个动作词里挑。', cls: '' };
  if (step === 4) return { text: '执行：机械臂走一步。', cls: '' };
  return {
    text:
      model === '55B'
        ? '下一拍：1-3 Hz 也够完成整段任务。'
        : '下一拍：5B 约 5 Hz，节拍更快。',
    cls: 'good',
  };
}

export const Ch6Loop: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 1, model: '55B' as Model });
  const [step, setStep] = useState(1);
  const [model, setModel] = useState<Model>('55B');
  const [feedback, setFeedback] = useState(() => feedbackFor(1, '55B'));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const render = (ms: number) => {
      const { step: st, model: md } = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // return arc: station 5 loops back to station 1 (dashed, behind all)
      ctx.setLineDash([7, 6]);
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(SX[4], SY - 52);
      ctx.quadraticCurveTo(550, 34, SX[0] + 4, SY - 52);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.muted;
      ctx.beginPath();
      ctx.moveTo(SX[0] - 4, SY - 52);
      ctx.lineTo(SX[0] + 8, SY - 59);
      ctx.lineTo(SX[0] + 6, SY - 45);
      ctx.closePath();
      ctx.fill();

      // flow arrows between stations
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const x0 = SX[i] + 58;
        const x1 = SX[i + 1] - 72;
        ctx.beginPath();
        ctx.moveTo(x0, SY - 4);
        ctx.lineTo(x1, SY - 4);
        ctx.stroke();
        ctx.fillStyle = C.muted;
        ctx.beginPath();
        ctx.moveTo(x1 + 8, SY - 4);
        ctx.lineTo(x1 - 3, SY - 10);
        ctx.lineTo(x1 - 3, SY + 2);
        ctx.closePath();
        ctx.fill();
      }

      // current-station halo
      const cx = SX[st - 1];
      const cy = SY - 4;
      ctx.fillStyle = 'rgba(34, 141, 92, 0.08)';
      ctx.beginPath();
      ctx.arc(cx, cy, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 46, 0, Math.PI * 2);
      ctx.stroke();

      // ① camera observe: photo card + camera glyph
      drawOrderCard(ctx, SX[0] - 26, SY - 2, '');
      {
        const gx = SX[0] + 12;
        const gy = SY - 2;
        ctx.fillStyle = C.blue;
        ctx.beginPath();
        ctx.roundRect(gx - 24, gy - 8, 40, 24, 4);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(gx - 12, gy - 13, 14, 7, 2);
        ctx.fill();
        ctx.fillStyle = C.white;
        ctx.beginPath();
        ctx.arc(gx - 4, gy + 4, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = C.blue;
        ctx.beginPath();
        ctx.arc(gx - 4, gy + 4, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // ② cloud query: cloud with TPU chips
      {
        const gx = SX[1];
        const gy = SY - 4;
        ctx.fillStyle = '#dde7f3';
        ctx.beginPath();
        ctx.arc(gx - 15, gy, 11, 0, Math.PI * 2);
        ctx.arc(gx + 1, gy - 8, 13, 0, Math.PI * 2);
        ctx.arc(gx + 16, gy, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(gx - 24, gy - 1, 48, 10);
        ctx.fillStyle = C.blue;
        ctx.fillRect(gx - 12, gy - 2, 7, 7);
        ctx.fillRect(gx - 1, gy - 2, 7, 7);
        ctx.fillRect(gx + 10, gy - 2, 7, 7);
      }

      // ③ constrained decoding: full-vocab strip -> funnel -> action tokens
      {
        const gx = SX[2];
        const gy = SY - 4;
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = C.muted;
        for (let r = 0; r < 2; r++) {
          for (let c2 = 0; c2 < 5; c2++) {
            ctx.fillRect(gx - 70 + c2 * 10, gy - 12 + r * 10, 7, 7);
          }
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#efe6f9';
        ctx.strokeStyle = C.purple;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gx - 24, gy - 20);
        ctx.lineTo(gx + 18, gy - 9);
        ctx.lineTo(gx + 18, gy + 1);
        ctx.lineTo(gx - 24, gy + 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = C.purple;
        ctx.fillRect(gx + 24, gy - 5, 7, 7);
        ctx.fillRect(gx + 34, gy - 5, 7, 7);
      }

      // ④ arm executes: on a counter block, wiggling when active
      {
        const gx = SX[3];
        ctx.fillStyle = C.ground;
        ctx.strokeStyle = C.deep;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(gx - 26, SY + 16, 52, 10, 3);
        ctx.fill();
        ctx.stroke();
        const active = st === 4;
        const angle = active ? 0.35 + Math.sin(ms / 260) * 0.22 : 0.3;
        const grip = active ? (Math.floor(ms / 260) % 2 === 0 ? 1 : 0.4) : 1;
        drawArm(ctx, gx, SY + 16, { scale: 1.5, angle, grip });
      }

      // ⑤ next beat: metronome dial, tempo follows the model
      {
        const gx = SX[4];
        const gy = SY - 4;
        const hz = md === '55B' ? 2 : 5; // 55B inside 1-3 Hz, 5B ~5 Hz
        ctx.fillStyle = C.white;
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(gx, gy, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = C.muted;
        ctx.lineWidth = 1.5;
        for (let k = 0; k < 4; k++) {
          const a = (k * Math.PI) / 2;
          ctx.beginPath();
          ctx.moveTo(gx + Math.sin(a) * 16, gy - Math.cos(a) * 16);
          ctx.lineTo(gx + Math.sin(a) * 20, gy - Math.cos(a) * 20);
          ctx.stroke();
        }
        const swing = Math.sin((ms / 1000) * Math.PI * 2 * hz) * 1.1;
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx + Math.sin(swing) * 15, gy - Math.cos(swing) * 15);
        ctx.stroke();
        ctx.fillStyle = C.orange;
        ctx.beginPath();
        ctx.arc(gx, gy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // station number badges
      for (let i = 0; i < 5; i++) {
        const cur = i + 1 === st;
        ctx.beginPath();
        ctx.arc(SX[i], SY + 56, 11, 0, Math.PI * 2);
        ctx.fillStyle = cur ? C.green : C.white;
        ctx.fill();
        ctx.strokeStyle = cur ? C.green : C.muted;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = cur ? C.white : C.muted;
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), SX[i], SY + 57);
      }

      drawSceneLabel(ctx, '词表漏斗', SX[2], SY - 38, { align: 'center' });
      drawSceneLabel(ctx, md === '55B' ? '1-3 Hz' : '≈5 Hz', SX[4], SY + 34, {
        align: 'center',
        color: C.orange,
      });
      drawLegend(ctx, [['全部词表', C.muted], ['动作词 256', C.purple]], 110, H - 14);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const go = (s: number, m: Model) => {
    stateRef.current = { step: s, model: m };
    setStep(s);
    setFeedback(feedbackFor(s, m));
  };
  const pickModel = (m: Model) => {
    stateRef.current = { step, model: m };
    setModel(m);
    setFeedback(feedbackFor(step, m));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="tiny ghost" onClick={() => go(step - 1, model)} disabled={step === 1}>
          上一步
        </button>
        <span className="step-label">
          第 <b>{step}</b> / 5 拍
        </span>
        <button
          className="tiny"
          onClick={() => go(step + 1, model)}
          disabled={step === 5}
        >
          {step === 5 ? '完成' : '下一步'}
        </button>
        <button className="tiny ghost" onClick={() => go(1, model)}>
          重置
        </button>
        <span className="step-label">型号</span>
        <button className={`chip${model === '55B' ? ' selected' : ''}`} onClick={() => pickModel('55B')}>
          55B
        </button>
        <button className={`chip${model === '5B' ? ' selected' : ''}`} onClick={() => pickModel('5B')}>
          5B
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch6Loop;
