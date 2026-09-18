import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { EvidencePanel, type EvidenceQuote } from './evidencePanel';

// Module 7.2: the robot's state is ESTIMATED (onboard state estimation, with lag and
// noise). The model receives the last k estimated states AND control inputs together,
// and predicts the next estimated state — which lets it implicitly capture the state
// estimator's dynamics. Drag the history length to see the prediction spread shrink.
const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0', track: '#b8c9a7', edge: '#76906a', line: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', border: '#d7deea',
};

const EVIDENCE: EvidenceQuote[] = [
  {
    en: 'In contrast to prior Infoprop benchmarks [8], which assume access to fully observed, memoryless states, the Mini Wheelbot only provides estimated states obtained from onboard state estimation [10].',
    zh: '先前基准假设<b>完全观测、无记忆</b>的状态；Mini Wheelbot 只能提供 onboard 状态估计得到的<b>估计状态</b>。',
    locator: '§III · p.2',
    highlights: ['fully observed, memoryless states', 'estimated states'],
  },
  {
    en: 'the learned model is conditioned on a short history of estimated physics states and applied control inputs and is trained to predict the next estimated state. This allows the model to implicitly capture the dynamics of the state estimator alongside the physical system.',
    zh: '模型以<b>短历史</b>的估计状态与控制输入为条件，<b>预测下一个估计状态</b>，从而<b>隐式捕获状态估计器的动态</b>。',
    locator: '§III · p.2',
    highlights: [
      'short history',
      'predict the next estimated state',
      'implicitly capture the dynamics of the state estimator',
    ],
  },
];

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function box(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  color: string,
  active = false
) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = active ? color : C.border;
  ctx.lineWidth = active ? 2.5 : 1.5;
  rr(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = active ? color : C.muted;
  ctx.font = (active ? 'bold ' : '') + '13px "Segoe UI", sans-serif';
  const tw = ctx.measureText(label).width;
  ctx.fillText(label, x + (w - tw) / 2, y + h / 2 + 5);
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y: number, x2: number) {
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2 - 7, y);
  ctx.stroke();
  ctx.fillStyle = C.muted;
  ctx.beginPath();
  ctx.moveTo(x2, y);
  ctx.lineTo(x2 - 9, y - 5);
  ctx.lineTo(x2 - 9, y + 5);
  ctx.closePath();
  ctx.fill();
}

const FRAMES = 12;
const DX = 80;
const X0 = 100;
const trueY = (i: number) => 142 + 20 * Math.sin(i * 0.52);
const estY = (i: number) => trueY(Math.max(0, i - 1)) + 7 * Math.sin(i * 2.3);

export const Ch5HistoryChips: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ k: 5 });
  const [k, setK] = useState(5);
  const [feedback, setFeedback] = useState({
    text: '拖动「历史长度 k」：模型把最近 k 帧的估计状态和控制输入一起作为输入。',
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

    const render = () => {
      const kk = stateRef.current.k;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // ---------- row 1: pipeline ----------
      box(ctx, 28, 30, 150, 48, '真实机器人', C.ink);
      box(ctx, 208, 30, 150, 48, '状态估计器', C.purple, true);
      box(ctx, 388, 30, 190, 48, '最近 k 帧窗口', C.blue, true);
      box(ctx, 700, 30, 130, 48, '模型 f_θ', C.blue);
      box(ctx, 860, 30, 170, 48, '预测下一个估计状态', C.blue);
      arrow(ctx, 178, 54, 208);
      arrow(ctx, 358, 54, 388);
      arrow(ctx, 578, 54, 700);
      arrow(ctx, 830, 54, 860);
      ctx.fillStyle = C.purple;
      ctx.font = '11.5px "Segoe UI", sans-serif';
      ctx.fillText('状态是估计出来的（有滞后与噪声）', 208, 92);

      // ---------- row 2: timeline (true vs estimated + window + controls) ----------
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      rr(ctx, 28, 104, 1024, 88, 8);
      ctx.fill();
      ctx.stroke();

      // true state curve (green)
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < FRAMES; i++) {
        const x = X0 + i * DX;
        if (i === 0) ctx.moveTo(x, trueY(i));
        else ctx.lineTo(x, trueY(i));
      }
      ctx.stroke();

      // estimated states (blue dots: lag + noise)
      ctx.fillStyle = C.blue;
      for (let i = 0; i < FRAMES; i++) {
        ctx.beginPath();
        ctx.arc(X0 + i * DX, estY(i), 3.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // control inputs (orange ticks)
      ctx.fillStyle = C.orange;
      for (let i = 0; i < FRAMES; i++) {
        ctx.fillRect(X0 + i * DX - 3, 178, 6, 9);
      }

      // history window over the last k frames
      const i0 = FRAMES - kk;
      const wx0 = X0 + i0 * DX - 26;
      const wx1 = X0 + (FRAMES - 1) * DX + 26;
      ctx.fillStyle = 'rgba(39,68,110,0.10)';
      rr(ctx, wx0, 112, wx1 - wx0, 72, 6);
      ctx.fill();
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      rr(ctx, wx0, 112, wx1 - wx0, 72, 6);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.blue;
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.fillText('最近 ' + kk + ' 帧', wx0 + 6, 126);

      // captions
      ctx.font = '11.5px "Segoe UI", sans-serif';
      ctx.fillStyle = C.green;
      ctx.fillText('绿线 = 真实状态', 40, 186);
      ctx.fillStyle = C.blue;
      ctx.fillText('蓝点 = 估计状态（滞后 + 噪声）', 160, 186);
      ctx.fillStyle = C.orange;
      ctx.fillText('橙 = 控制输入', 400, 186);

      // ---------- row 3: input cards + prediction spread ----------
      const cardW = 40;
      const gap = 8;
      const cardsX = 48;
      for (let i = 0; i < kk; i++) {
        const cx = cardsX + i * (cardW + gap);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 1.2;
        rr(ctx, cx, 214, cardW, 44, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = C.blue;
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.fillText('ŝ', cx + 6, 230);
        ctx.fillStyle = C.orange;
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillText('a', cx + 6, 248);
      }
      ctx.fillStyle = C.muted;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('估计状态 ŝ + 控制输入 a，一起给模型', 48 + kk * (cardW + gap) + 16, 240);

      // prediction spread ellipse (shrinks as k grows)
      const ry = 32 / (1 + 0.5 * (kk - 1)) + 5;
      ctx.strokeStyle = ry < 16 ? C.green : ry < 26 ? C.orange : C.red;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(962, 232, 17, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.font = '11.5px "Segoe UI", sans-serif';
      ctx.fillText('预测散布', 934, 276);
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.round(clamp(Number(e.target.value), 1, 8));
    stateRef.current.k = v;
    setK(v);
    if (v === 1)
      setFeedback({
        text: '只看当前一帧：模型不知道估计器刚才做了什么（滞后与噪声），预测散布很大、不可靠。',
        cls: 'bad',
      });
    else if (v <= 3)
      setFeedback({ text: '看到一点历史：模型开始能推断估计器的行为，预测散布开始收窄。', cls: '' });
    else
      setFeedback({
        text: '短历史（论文做法）：最近几帧「估计状态 + 控制输入」一起输入，模型间接捕捉到估计器的动态，预测更准。',
        cls: 'good',
      });
  };

  return (
    <div className="module-split">
      <div className="module-split-main">
        <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
        <div className="ctrl">
          <label>
            历史长度 k <span className="val">{k} 帧</span>
          </label>
          <input type="range" min={1} max={8} value={k} onChange={onChange} />
        </div>
        <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      </div>
      <EvidencePanel quotes={EVIDENCE} />
    </div>
  );
};

export default Ch5HistoryChips;
