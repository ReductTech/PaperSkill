import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §7.1 —— 任务数越多，三条成本线怎么分开。
// 曲线是相对成本的示意（不是实测毫秒）：微调 1.00、LwF 1.15、联合训练 = 任务数 m。

const W = 1080;
const H = 280;

const MAX_M = 8;
const FT = 1.0;
const LWF = 1.15;

const C = {
  bg: '#f5f8f0',
  ink: '#21324a',
  axis: '#c3cfdd',
  soft: '#d7deea',
  red: '#c43f52',
  green: '#228d5c',
  blue: '#27446e',
  orange: '#f07e47',
};

const PX0 = 112;
const PX1 = 772;
const PY0 = 230;
const PY1 = 48;

const xAt = (k: number) => PX0 + ((k - 1) / (MAX_M - 1)) * (PX1 - PX0);
const yAt = (v: number) => PY0 - (v / MAX_M) * (PY0 - PY1);

interface Anim {
  shown: number;
  from: number;
  to: number;
  t0: number;
}

function feedbackFor(m: number): { text: string; cls: string } {
  if (m <= 1) return { text: '只加一个任务时，三条路差不多贵。', cls: '' };
  if (m <= 4)
    return {
      text: `联合训练 ${m.toFixed(2)}，是 LwF 的 ${(m / LWF).toFixed(1)} 倍：每个任务都要单独过一次共享层。`,
      cls: '',
    };
  return {
    text: `任务越多差得越开：联合训练 ${m.toFixed(2)}，再算上「每个任务各存一份网络」，测试也要 ${m} 倍时间。`,
    cls: 'bad',
  };
}

export const M7Cost: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const anim = useRef<Anim>({ shown: 1, from: 1, to: 1, t0: 0 });
  const [m, setM] = useState(1);
  const [feedback, setFeedback] = useState(feedbackFor(1));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const draw = (now: number) => {
      const a = anim.current;
      if (a.shown !== a.to) {
        const p = clamp((now - a.t0) / 480, 0, 1);
        a.shown = p >= 1 ? a.to : a.from + (a.to - a.from) * easeOutCubic(p);
      }
      const k = a.shown;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // 坐标轴
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(PX0, PY1 - 8);
      ctx.lineTo(PX0, PY0);
      ctx.lineTo(PX1, PY0);
      ctx.stroke();

      // 刻度线（只在轴两端写数值，画布上不堆文字）
      ctx.strokeStyle = C.soft;
      ctx.lineWidth = 1;
      for (let i = 1; i <= MAX_M; i += 1) {
        const x = xAt(i);
        ctx.beginPath();
        ctx.moveTo(x, PY0);
        ctx.lineTo(x, PY0 - 5);
        ctx.stroke();
      }
      [1, 2, 4, 6, 8].forEach((v) => {
        const y = yAt(v);
        ctx.beginPath();
        ctx.moveTo(PX0, y);
        ctx.lineTo(PX0 - 5, y);
        ctx.stroke();
      });

      ctx.fillStyle = C.ink;
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('1', xAt(1), PY0 + 20);
      ctx.fillText(String(MAX_M), xAt(MAX_M), PY0 + 20);
      ctx.textAlign = 'right';
      ctx.fillText('1', PX0 - 12, yAt(1) + 5);
      ctx.fillText(String(MAX_M), PX0 - 12, yAt(MAX_M) + 5);

      // 当前任务数处的竖虚线
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(xAt(k), PY0);
      ctx.lineTo(xAt(k), PY1 - 8);
      ctx.stroke();
      ctx.restore();

      // 三条成本线：微调、LwF、联合训练
      const series: Array<{ color: string; v: (kk: number) => number }> = [
        { color: C.blue, v: () => FT },
        { color: C.green, v: () => LWF },
        { color: C.red, v: (kk) => kk },
      ];
      series.forEach((s) => {
        // 整段淡线做参照，实线只画到当前任务数
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(xAt(1), yAt(s.v(1)));
        ctx.lineTo(xAt(MAX_M), yAt(s.v(MAX_M)));
        ctx.stroke();
        ctx.restore();

        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(xAt(1), yAt(s.v(1)));
        ctx.lineTo(xAt(k), yAt(s.v(k)));
        ctx.stroke();

        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(xAt(k), yAt(s.v(k)), 4.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // 右栏：三行当前值
      ctx.strokeStyle = C.soft;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(812, 66);
      ctx.lineTo(812, 214);
      ctx.stroke();

      const rows = [
        { color: C.blue, value: FT.toFixed(2) },
        { color: C.green, value: LWF.toFixed(2) },
        { color: C.red, value: k.toFixed(2) },
      ];
      ctx.textAlign = 'left';
      ctx.font = '22px "Segoe UI", sans-serif';
      rows.forEach((row, i) => {
        const y = 100 + i * 52;
        ctx.fillStyle = row.color;
        ctx.beginPath();
        ctx.arc(838, y - 7, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = C.ink;
        ctx.fillText(row.value, 860, y);
      });

      // 两个画布标签：横轴名与「示意」
      ctx.fillStyle = C.ink;
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('任务数', (PX0 + PX1) / 2, PY0 + 40);
      ctx.textAlign = 'right';
      ctx.fillText('示意', PX1, PY1 - 12);
    };

    const tick = () => {
      draw(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.round(clamp(Number(e.target.value), 1, MAX_M));
    const a = anim.current;
    a.from = a.shown;
    a.to = v;
    a.t0 = performance.now();
    setM(v);
    setFeedback(feedbackFor(v));
  };

  return (
    <div>
      <div className="ctrl">
        <label>
          任务数 m <span className="val">{m}</span>
        </label>
        <input
          type="range"
          min={1}
          max={MAX_M}
          step={1}
          value={m}
          onChange={onChange}
          aria-label="任务数 m"
        />
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="metrics">
        <div className="metric">
          <div className="l">微调</div>
          <div className="v">1.00</div>
        </div>
        <div className="metric">
          <div className="l">LwF</div>
          <div className="v">1.15</div>
        </div>
        <div className="metric">
          <div className="l">联合训练</div>
          <div className="v">{m.toFixed(2)}</div>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M7Cost;
