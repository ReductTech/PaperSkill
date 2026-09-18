import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { PALETTE, drawScene, drawLegend, drawSceneLabel } from './theme-kit';
import type { WidgetProps } from './registry';

// 模块 3.1 稀疏成绩单 vs 稠密对照（P3 开始按钮）。
// 稀疏曲线：阶梯式平台（只在反馈事件处下降）；稠密曲线：平滑快收敛。
// 底部刻度条同步点亮两种反馈频率。均为示意曲线，非论文实测数字。

const W = 720;
const H = 300;
const RUN_MS = 3000;

const sp = (x: number) => 0.95 - (x > 0.33 ? 0.5 : 0) - (x > 0.66 ? 0.28 : 0) - (x > 0.99 ? 0.09 : 0);
const dn = (x: number) => 0.12 + 0.83 * Math.exp(-3 * x);

type Phase = 'idle' | 'run' | 'done';

export const M31LearningCurves: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ phase: 'idle' as Phase, t: 0, last: 0 });
  const rafRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [feedback, setFeedback] = useState({
    text: '点击开始：同一支笔，两种批改方式。',
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

    const PX0 = 76;
    const PX1 = 640;
    const PY0 = 44;
    const PY1 = 216;
    const toX = (u: number) => PX0 + u * (PX1 - PX0);
    const toY = (v: number) => PY1 - clamp(v, 0, 1) * (PY1 - PY0);

    const render = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, W, H, { margin: 10 });
      drawLegend(ctx, 28, 32, [
        { color: PALETTE.red, text: '稀疏' },
        { color: PALETTE.green, text: '稠密' },
      ]);

      // 坐标轴
      ctx.save();
      ctx.strokeStyle = PALETTE.muted;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PX0, PY0 - 6);
      ctx.lineTo(PX0, PY1 + 4);
      ctx.lineTo(PX1, PY1 + 4);
      ctx.stroke();
      drawSceneLabel(ctx, PX0 - 12, PY1 + 24, '误差', { align: 'center' });
      drawSceneLabel(ctx, PX1, PY1 + 24, '训练步', { align: 'right' });
      ctx.restore();

      if (s.phase === 'idle') {
        drawSceneLabel(ctx, (PX0 + PX1) / 2, (PY0 + PY1) / 2, '同一支笔，两种批改', {
          align: 'center',
        });
      } else {
        const u = s.t;
        // 稀疏曲线（暗红，平台段加粗）
        ctx.save();
        ctx.strokeStyle = PALETTE.red;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        const n = 120;
        for (let i = 0; i <= n; i++) {
          const x = (i / n) * u;
          const px = toX(x);
          const py = toY(sp(x));
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        // 平台段加粗：最后一段平台
        ctx.lineWidth = 4;
        ctx.beginPath();
        const n2 = 120;
        for (let i = 0; i <= n2; i++) {
          const x = (i / n2) * u;
          if (x > 0.66) {
            const px = toX(x);
            const py = toY(sp(x));
            if (i === 0 || x - 1 / n2 <= 0.66) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
        ctx.restore();

        // 稠密曲线（绿）
        ctx.save();
        ctx.strokeStyle = PALETTE.green;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = 0; i <= 120; i++) {
          const x = (i / 120) * u;
          const px = toX(x);
          const py = toY(dn(x));
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.restore();

        // 当前光点
        ctx.save();
        ctx.fillStyle = PALETTE.green;
        ctx.beginPath();
        ctx.arc(toX(u), toY(dn(u)), 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETTE.red;
        ctx.beginPath();
        ctx.arc(toX(u), toY(sp(u)), 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 底部反馈频率刻度
      const ty = 262;
      ctx.save();
      ctx.strokeStyle = PALETTE.muted;
      ctx.lineWidth = 2;
      for (const fx of [0.33, 0.66, 0.99]) {
        const x = toX(Math.min(fx, 1));
        if (s.phase === 'idle' || fx <= s.t) {
          ctx.beginPath();
          ctx.moveTo(x, ty - 7);
          ctx.lineTo(x, ty + 7);
          ctx.stroke();
        }
      }
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.7;
      for (let i = 0; i <= 20; i++) {
        const x = toX(i / 20);
        if (s.phase !== 'idle' && i / 20 > s.t) break;
        ctx.beginPath();
        ctx.moveTo(x, ty - 3);
        ctx.lineTo(x, ty + 3);
        ctx.stroke();
      }
      ctx.restore();

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (ms: number) => {
      const s = stateRef.current;
      if (s.last === 0) s.last = ms;
      const dt = ms - s.last;
      s.last = ms;
      if (s.phase === 'run') {
        s.t = clamp(s.t + dt / RUN_MS, 0, 1);
        if (s.t >= 1) {
          s.phase = 'done';
          setPhase('done');
          setFeedback({
            text: '稠密预测信号让每一步都成为训练数据——世界模型送来的免费监督。',
            cls: 'good',
          });
        }
      }
      render();
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      stateRef.current.last = 0;
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

  const onButton = () => {
    const s = stateRef.current;
    s.phase = 'run';
    s.t = 0;
    s.last = 0;
    setPhase('run');
    setFeedback({ text: '两条曲线同步生长：台阶是稀疏反馈，平滑是稠密对照。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="tiny" onClick={onButton}>
          {phase === 'idle' ? '开始' : '重写'}
        </button>
        <span className="step-label">
          {phase === 'idle' ? '待命' : phase === 'done' ? '完成：稠密信号更快收敛' : '生长中'}
        </span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M31LearningCurves;
