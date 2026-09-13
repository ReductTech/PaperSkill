import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from '../modules/registry';

// 模块 6.1：逐步推进关键帧——上一步 / 下一步 / 重置，走完 7 步在线流程。

const W = 1080;
const H = 280;

const BX0 = 60;
const BX1 = 1020;
const BY0 = 196;
const BY1 = 274;
const NEEDLE_Y = 235;

const PX = 680;
const PY = 16;
const PW = 340;
const PH = 200;

const STEP_X0 = 120;
const STEP_DX = 135;
const STEP_MAX = 7;

interface Step {
  name: string;
  desc: string;
  out: string;
  inInit: boolean;
  tone: 'blue' | 'green';
}

const STEPS: Step[] = [
  {
    name: '两视图预测',
    desc: '两视图预测给出点图与匹配置信度，这是所有后续步骤的输入。',
    out: '点图 X',
    inInit: false,
    tone: 'blue',
  },
  {
    name: '选关键帧',
    desc: '有效匹配比例低于阈值就选为新关键帧。',
    out: '关键帧 I_km',
    inInit: false,
    tone: 'blue',
  },
  {
    name: 'Sim(3) 估位姿',
    desc: '用 Sim(3) 对齐估计初始位姿——注意这里必须带上尺度。',
    out: 'T ∈ Sim(3)',
    inInit: true,
    tone: 'green',
  },
  {
    name: 'BA 解内参',
    desc: '前 k_init 个关键帧做一次 BA 解出统一内参，之后不再做。',
    out: '统一内参 K',
    inInit: true,
    tone: 'green',
  },
  {
    name: '生成锚点',
    desc: '按图像梯度挑选点、投影到体素生成锚点，并记录本关键帧的锚点子集。',
    out: '锚点 a_u',
    inInit: false,
    tone: 'blue',
  },
  {
    name: '记录子集',
    desc: '按图像梯度挑选点、投影到体素生成锚点，并记录本关键帧的锚点子集。',
    out: '锚子集 G_v^m',
    inInit: false,
    tone: 'blue',
  },
  {
    name: '入因子图',
    desc: '关键帧、边与锚子集一起进入因子图，等待全局优化。',
    out: '因子图 G_f',
    inInit: false,
    tone: 'green',
  },
];

const stepX = (step: number) => STEP_X0 + (step - 1) * STEP_DX;

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= w; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function drawBand(ctx: CanvasRenderingContext2D, x0: number, x1: number, y0: number, y1: number) {
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.fillStyle = '#76906a';
  ctx.fillRect(x0, y1 - 6, x1 - x0, 6);
}

function drawNeedle(ctx: CanvasRenderingContext2D, x: number, y: number, len: number) {
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - len, y);
  ctx.lineTo(x - len - 20, y);
  ctx.stroke();
  ctx.strokeStyle = '#21324a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - len, y);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.fillStyle = '#21324a';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 8, y - 4);
  ctx.lineTo(x - 8, y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#21324a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x - len + 6, y, 2.6, 0, Math.PI * 2);
  ctx.stroke();
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: { label: string; color: string }[],
  x: number,
  y: number
) {
  ctx.font = '14px "Segoe UI", "Microsoft YaHei", sans-serif';
  let cx = x;
  items.forEach((it) => {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 9, 12, 9);
    ctx.fillStyle = '#68778f';
    ctx.fillText(it.label, cx + 17, y);
    cx += 17 + ctx.measureText(it.label).width + 16;
  });
}

export const Ch6Steps: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stRef = useRef({ nx: STEP_X0, fade: 1, grow: 1 });
  const stepRef = useRef(1);
  const lastRef = useRef(0);

  const [step, setStep] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (cur: Step, curStep: number) => {
      clearScene(ctx, W, H);
      drawBand(ctx, BX0, BX1, BY0, BY1);

      const s = stRef.current;
      const nx = s.nx;
      const prevX = curStep > 1 ? stepX(curStep - 1) : STEP_X0;
      const g = easeOutCubic(clamp(s.grow, 0, 1));
      const segX = lerp(prevX, nx, g);

      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(STEP_X0, NEEDLE_Y);
      ctx.lineTo(nx, NEEDLE_Y);
      ctx.stroke();
      for (let sx = STEP_X0; sx <= Math.min(nx, segX); sx += 27) {
        ctx.beginPath();
        ctx.moveTo(sx, NEEDLE_Y - 6);
        ctx.lineTo(sx, NEEDLE_Y + 6);
        ctx.stroke();
      }

      drawNeedle(ctx, nx, NEEDLE_Y, 38);

      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(PX, PY, PW, PH);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.strokeRect(PX + 0.5, PY + 0.5, PW - 1, PH - 1);

      ctx.save();
      ctx.globalAlpha = clamp(s.fade, 0, 1);
      ctx.fillStyle = '#68778f';
      ctx.font = '14px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText(`${curStep} / ${STEP_MAX}`, PX + 18, PY + 30);

      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText(cur.name, PX + 18, PY + 66);

      ctx.fillStyle = '#68778f';
      ctx.font = '14px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText('输出', PX + 18, PY + 108);
      ctx.fillStyle = '#27446e';
      ctx.fillText(cur.out, PX + 18, PY + 134);

      const mark = cur.inInit ? '仅前 k_init' : curStep - 1 >= 4 ? '不再做 BA' : '';
      if (mark) {
        ctx.fillStyle = cur.inInit ? '#228d5c' : '#27446e';
        ctx.fillText(mark, PX + 18, PY + 172);
      }
      ctx.restore();

      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText('关键帧', 60, 70);

      drawLegend(
        ctx,
        [
          { label: '已完成', color: '#27446e' },
          { label: '当前', color: '#21324a' },
        ],
        60,
        104
      );
    };

    const tick = (ts: number) => {
      const dt = lastRef.current ? Math.min(0.06, (ts - lastRef.current) / 1000) : 0;
      lastRef.current = ts;
      const s = stRef.current;
      const tx = stepX(stepRef.current);
      s.nx += (tx - s.nx) * 0.18;
      if (Math.abs(tx - s.nx) < 0.4) s.nx = tx;
      s.fade += (1 - s.fade) * 0.14;
      if (s.fade > 0.995) s.fade = 1;
      if (s.grow < 1) s.grow = Math.min(1, s.grow + dt / 0.35);
      render(STEPS[stepRef.current - 1], stepRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = 0;
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

  const go = (next: number) => {
    const v = Math.max(1, Math.min(STEP_MAX, next));
    const s = stRef.current;
    s.fade = 0;
    s.grow = 0;
    stepRef.current = v;
    setStep(v);
  };

  const cur = STEPS[step - 1];

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', height: 'auto' }}
      />
      <div className="chips">
        <button className="chip" disabled={step === 1} onClick={() => go(step - 1)}>
          上一步
        </button>
        <button className="chip" disabled={step === STEP_MAX} onClick={() => go(step + 1)}>
          {step === STEP_MAX ? '已完成' : '下一步'}
        </button>
        <button className="chip" onClick={() => go(1)}>
          重置
        </button>
      </div>
      <div className={`feedback ${cur.tone === 'green' ? 'good' : ''}`}>{cur.desc}</div>
    </div>
  );
};

export default Ch6Steps;
