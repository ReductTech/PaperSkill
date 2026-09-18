import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §5 Module 5.2 — 领域约束：不规则采样 / 按特征掩码 / 任务特定目标，各自改一处张量或损失。
const W = 1080;
const H = 280;
const BG = '#f5f8f0';
const LIGHT = '#b8c9a7';
const DARK = '#76906a';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const PURPLE = '#7c3aed';
const BORDER = '#d7deea';

type Constraint = 'irregular' | 'feature-mask' | 'objective';

const WEIGHTS = [1.0, 0.4, 1.0, 0.25, 0.8];

export const Ch5Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ constraint: 'irregular' as Constraint, t: 0 });
  const rafRef = useRef<number | null>(null);
  const [constraint, setConstraint] = useState<Constraint>('irregular');
  const [feedback, setFeedback] = useState({
    text: '不规则采样：相邻观测的时间差 deltas 作为额外输入送进模型，这样「多久没测」本身也成了信息。这些定制模式出自论文 II.3 与官方开发者文档；论文只给出类别，没有给出具体实现数值。',
    cls: '',
  });

  const pick = (c: Constraint) => {
    stateRef.current.constraint = c;
    setConstraint(c);
    const head: Record<Constraint, string> = {
      irregular: '不规则采样：相邻观测的时间差 deltas 作为额外输入送进模型，这样「多久没测」本身也成了信息。',
      'feature-mask': '按特征掩码：给不同变量不同权重，让模型知道哪个传感器更可信。',
      objective: '任务特定目标：损失函数也可以换，例如按特征加权的均方误差；统一 API 只规定接口，不限制你的目标。',
    };
    setFeedback({
      text: `${head[c]}这些定制模式出自论文 II.3 与官方开发者文档；论文只给出类别，没有给出具体实现数值。`,
      cls: '',
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { constraint: Constraint }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = LIGHT;
      ctx.fillRect(0, 244, W, 22);
      ctx.strokeStyle = DARK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 244);
      ctx.lineTo(W, 244);
      ctx.stroke();

      // left: the input tensor (5 features x 6 steps)
      const gx = 60;
      const gy = 70;
      const cw = 48;
      const ch = 26;
      const cols = 6;
      const rows = 5;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const w = s.constraint === 'feature-mask' ? WEIGHTS[r] : 1;
          ctx.fillStyle = `rgba(39,68,110,${0.18 + 0.7 * w})`;
          ctx.fillRect(gx + c * cw, gy + r * ch, cw - 4, ch - 4);
        }
      }
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(gx - 1, gy - 1, cols * cw, rows * ch);
      ctx.fillStyle = '#68778f';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('[n_samples, n_steps, n_features]', gx, gy + rows * ch + 22);

      // middle: the physical cue (a ruler or a valve on the stream)
      const springY = 120;
      ctx.strokeStyle = PURPLE;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(470, springY);
      ctx.lineTo(700, springY);
      ctx.stroke();
      if (s.constraint === 'irregular') {
        for (let i = 0; i <= 6; i++) {
          const x = 470 + i * (230 / 6);
          const h = i === 0 ? 10 : 6 + ((i * 7) % 12);
          ctx.beginPath();
          ctx.moveTo(x, springY - h);
          ctx.lineTo(x, springY + h);
          ctx.stroke();
        }
      } else if (s.constraint === 'feature-mask') {
        for (let i = 0; i < 5; i++) {
          const x = 490 + i * 42;
          const hh = 6 + WEIGHTS[i] * 18;
          ctx.fillStyle = WEIGHTS[i] < 0.5 ? '#f07e47' : GREEN;
          ctx.fillRect(x, springY - hh, 16, hh * 2);
        }
      } else {
        ctx.fillStyle = BLUE;
        ctx.beginPath();
        ctx.arc(585, springY, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillText('ℓ', 580, springY + 5);
      }

      // right: technical inset
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(760, 60, 260, 160);
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(760, 60, 260, 160);
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      const title =
        s.constraint === 'irregular'
          ? '输入多一项'
          : s.constraint === 'feature-mask'
          ? '权重分特征'
          : '损失可替换';
      ctx.fillText(title, 780, 90);
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillStyle = '#68778f';
      if (s.constraint === 'irregular') {
        ctx.fillText('deltas', 780, 122);
        ctx.fillText('= t_i − t_(i−1)', 780, 148);
      } else if (s.constraint === 'feature-mask') {
        ctx.fillText('w_c 逐特征', 780, 122);
        ctx.fillText('min 0.25 / max 1', 780, 148);
      } else {
        ctx.fillText('Σ w_c · ℓ', 780, 122);
        ctx.fillText('Criterion 子类', 780, 148);
      }

      // in-canvas labels (max 2)
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText('输入张量', 60, 50);
      ctx.fillText('约束接口', 470, 50);
    };

    const tick = () => {
      render(stateRef.current);
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

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button
          type="button"
          className={`chip ${constraint === 'irregular' ? 'selected' : ''}`}
          onClick={() => pick('irregular')}
        >
          不规则采样
        </button>
        <button
          type="button"
          className={`chip ${constraint === 'feature-mask' ? 'selected' : ''}`}
          onClick={() => pick('feature-mask')}
        >
          按特征掩码
        </button>
        <button
          type="button"
          className={`chip ${constraint === 'objective' ? 'selected' : ''}`}
          onClick={() => pick('objective')}
        >
          任务特定目标
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch5Mod2;
