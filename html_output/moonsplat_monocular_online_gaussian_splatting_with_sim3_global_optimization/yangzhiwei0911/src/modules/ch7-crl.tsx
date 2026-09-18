import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, lerpColor, map } from '../lib/canvasKit';
import type { WidgetProps } from '../modules/registry';

// 模块 7.1：拖动训练迭代数滑块、切换颜色残差学习开关，对比布面贴合度与两条损失曲线。

const W = 1080;
const H = 280;

const INSET = { x: 688, y: 44, w: 380, h: 182 };
const PX0 = 726;
const PX1 = 1042;
const PY0 = 62;
const PY1 = 196;

const lossOn = (it: number) => 0.08 + 0.62 * Math.exp(-it / 260);
const lossOff = (it: number) => 0.55 + 0.42 * Math.exp(-it / 900);

type Judge = { text: string; cls: string };

function judge(loss: number): Judge {
  if (loss > 0.5) {
    return {
      text: '迭代数不足时颜色还没学会，布面明显起皱——这正是没有基准色先验的早期阶段。',
      cls: 'bad',
    };
  }
  if (loss > 0.2) {
    return { text: '在收敛过程中，两者差距最明显的就是这段区间。', cls: '' };
  }
  return {
    text: '同样的迭代数下，带基准色先验的一侧更快到位；注意这是相同迭代数下的比较。',
    cls: 'good',
  };
}

function drawBackdrop(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 0.5;
  for (let x = 20; x < W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 20; y < H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

export const Ch7Crl: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ itTarget: 200, itDisp: 200, useCRL: true, disp: lossOn(200), bold: 1 });
  const [iterations, setIterations] = useState(200);
  const [useCRL, setUseCRL] = useState(true);
  const [feedback, setFeedback] = useState<Judge>(judge(lossOn(200)));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const t0 = performance.now();

    const render = (t: number, s: { itTarget: number; itDisp: number; useCRL: boolean; disp: number; bold: number }) => {
      s.itDisp += (s.itTarget - s.itDisp) * 0.16;
      if (Math.abs(s.itTarget - s.itDisp) < 0.5) s.itDisp = s.itTarget;
      const bTarget = s.useCRL ? 1 : 0;
      s.bold += (bTarget - s.bold) * 0.14;
      if (Math.abs(bTarget - s.bold) < 0.005) s.bold = bTarget;
      const target = s.useCRL ? lossOn(s.itDisp) : lossOff(s.itDisp);
      s.disp += (target - s.disp) * 0.14;
      const wrinkle = clamp(s.disp, 0, 1);
      const wcolor =
        wrinkle <= 0.5
          ? lerpColor('#228d5c', '#f07e47', wrinkle / 0.5)
          : lerpColor('#f07e47', '#c43f52', (wrinkle - 0.5) / 0.5);

      drawBackdrop(ctx);

      const left = 40;
      const right = 664;
      const top = 106;
      const bot = 194;
      const midY = (top + bot) / 2;

      // 布带
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(left, top, right - left, bot - top);
      ctx.fillStyle = '#76906a';
      ctx.fillRect(left, bot - 4, right - left, 4);

      // 布面纹理：短斜线密度表示起皱程度
      const n = Math.round(wrinkle * 26);
      ctx.strokeStyle = wcolor;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < n; i++) {
        const x = left + 14 + ((right - left - 28) * (i + 0.5)) / n;
        ctx.beginPath();
        ctx.moveTo(x - 5, top + 8);
        ctx.lineTo(x + 5, bot - 8);
        ctx.stroke();
      }

      // 缝线：平整度随 quality 变化，从锯齿趋于直线
      const amp = wrinkle * 14;
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = left + 10; x <= right - 10; x += 6) {
        const u = (x - left) / (right - left);
        const y =
          midY +
          amp * (0.62 * Math.sin(u * Math.PI * 6 + t * 1.4) + 0.38 * Math.sin(u * Math.PI * 13 + 1.1));
        if (x === left + 10) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 当前损失数值
      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText(s.disp.toFixed(2), left + 4, top - 14);

      // 右侧插片：两条损失曲线常驻
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(INSET.x, INSET.y, INSET.w, INSET.h);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.strokeRect(INSET.x, INSET.y, INSET.w, INSET.h);

      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 0.5;
      for (let g = 0; g <= 4; g++) {
        const gy = map(g / 4, 0, 1, PY1, PY0);
        ctx.beginPath();
        ctx.moveTo(PX0, gy);
        ctx.lineTo(PX1, gy);
        ctx.stroke();
      }

      const curve = (fn: (it: number) => number, color: string, bold: number) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = lerp(1.5, 3, bold);
        ctx.globalAlpha = lerp(0.55, 1, bold);
        ctx.beginPath();
        for (let i = 0; i <= 90; i++) {
          const it = (i / 90) * 2000;
          const x = map(it, 0, 2000, PX0, PX1);
          const y = map(clamp(fn(it), 0, 1), 0, 1, PY1, PY0);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      };
      curve(lossOff, '#c43f52', 1 - s.bold);
      curve(lossOn, '#228d5c', s.bold);

      // 当前档位的当前点
      const curLoss = clamp(s.disp, 0, 1);
      const cxp = map(s.itDisp, 0, 2000, PX0, PX1);
      const cyp = map(curLoss, 0, 1, PY1, PY0);
      ctx.fillStyle = s.useCRL ? '#228d5c' : '#c43f52';
      ctx.beginPath();
      ctx.arc(cxp, cyp, 5, 0, Math.PI * 2);
      ctx.fill();

      // 标签与图例
      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('迭代数', PX0, PY0 - 8);

      const ly = INSET.y + INSET.h - 14;
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#228d5c';
      ctx.beginPath();
      ctx.moveTo(INSET.x + 14, ly);
      ctx.lineTo(INSET.x + 38, ly);
      ctx.stroke();
      ctx.strokeStyle = '#c43f52';
      ctx.beginPath();
      ctx.moveTo(INSET.x + 172, ly);
      ctx.lineTo(INSET.x + 196, ly);
      ctx.stroke();
      ctx.fillStyle = '#68778f';
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillText('开 CRL', INSET.x + 44, ly + 5);
      ctx.fillText('关 CRL', INSET.x + 202, ly + 5);
    };

    const tick = () => {
      render((performance.now() - t0) / 1000, stateRef.current);
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

  const onIterations = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    stateRef.current.itTarget = v;
    setIterations(v);
    setFeedback(judge(useCRL ? lossOn(v) : lossOff(v)));
  };

  const onToggle = () => {
    const next = !useCRL;
    stateRef.current.useCRL = next;
    setUseCRL(next);
    setFeedback(judge(next ? lossOn(iterations) : lossOff(iterations)));
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', height: 'auto' }}
      />
      <div className="ctrl">
        <label>
          训练迭代数 <span className="val">{iterations}</span>
        </label>
        <input type="range" min={0} max={2000} step={50} value={iterations} onChange={onIterations} />
      </div>
      <div className="chips">
        <button className={useCRL ? 'chip is-active' : 'chip'} onClick={onToggle}>
          颜色残差学习：{useCRL ? '开' : '关'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch7Crl;
