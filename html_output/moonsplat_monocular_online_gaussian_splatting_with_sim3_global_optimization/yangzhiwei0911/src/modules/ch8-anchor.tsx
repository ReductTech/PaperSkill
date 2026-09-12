import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeSpring } from '../lib/canvasKit';
import type { WidgetProps } from '../modules/registry';

// 模块 8.2：上一步／下一步／重置推进四步，看端头对齐与锚点整体位移。

const W = 1080;
const H = 280;
const OFFSETS = [1, 1, 0.35, 0];

const STEP_FEEDBACK = [
  { text: '闭环被检测到，但还没有任何东西被搬动，偏差仍然留在场景里。', cls: 'bad' },
  { text: '先解出优化后的 Sim(3) 变换 T̃_m，此时锚点还没动。', cls: '' },
  {
    text: '按 μ̃_m = T̃_m · T_m⁻¹ · μ_m 把锚点整体搬回去，历史高斯第一次被真正修正。',
    cls: 'good',
  },
  { text: '锚点重新分配到最近体素，位姿与体素结构重新一致。', cls: 'good' },
];

const STEP_COLOR = ['#c43f52', '#27446e', '#228d5c', '#228d5c'];

const hexRgb = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];

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

export const Ch8Anchor: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({
    repairStep: 1,
    dispOffset: OFFSETS[0],
    col: hexRgb(STEP_COLOR[0]),
    pulseT: 1,
    settled: true,
  });
  const [repairStep, setRepairStep] = useState(1);
  const [feedback, setFeedback] = useState(STEP_FEEDBACK[0]);

  const go = (n: number) => {
    const s = clamp(Math.round(n), 1, 4);
    stateRef.current.repairStep = s;
    setRepairStep(s);
    setFeedback(STEP_FEEDBACK[s - 1]);
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

    const render = (
      s: {
        repairStep: number;
        dispOffset: number;
        col: [number, number, number];
        pulseT: number;
        settled: boolean;
      },
      dt: number
    ) => {
      const target = OFFSETS[s.repairStep - 1];
      s.dispOffset = lerp(s.dispOffset, target, 0.15);
      if (Math.abs(s.dispOffset - target) < 0.008) {
        s.dispOffset = target;
        if (!s.settled) {
          s.settled = true;
          s.pulseT = 0;
        }
      } else {
        s.settled = false;
      }
      if (s.pulseT < 1) s.pulseT = Math.min(1, s.pulseT + dt / 0.45);
      const pulse = s.pulseT < 1 ? easeSpring(1 - Math.abs(2 * s.pulseT - 1)) : 0;
      const tc = hexRgb(STEP_COLOR[s.repairStep - 1]);
      for (let k = 0; k < 3; k += 1) s.col[k] += (tc[k] - s.col[k]) * 0.15;
      const seamColor = `rgb(${Math.round(s.col[0])},${Math.round(s.col[1])},${Math.round(s.col[2])})`;
      const off = clamp(s.dispOffset, 0, 1);
      const step = s.repairStep;
      const anchorShift = (1 - off) * 46;

      drawBackdrop(ctx);

      const cA = 150 + off * 45;
      const cB = 150 - off * 45;
      const bh = 23;

      // 布带两端
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(24, cA - bh, 276, bh * 2);
      ctx.fillRect(356, cB - bh, 280, bh * 2);
      ctx.fillStyle = '#76906a';
      ctx.fillRect(24, cA + bh - 4, 276, 4);
      ctx.fillRect(356, cB + bh - 4, 280, 4);

      // 端头缝线
      ctx.strokeStyle = seamColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(56, cA);
      ctx.lineTo(300, cA);
      ctx.lineTo(356, cB);
      ctx.lineTo(596, cB);
      ctx.stroke();

      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(300, cA - bh);
      ctx.lineTo(300, cA + bh);
      ctx.moveTo(356, cB - bh);
      ctx.lineTo(356, cB + bh);
      ctx.stroke();

      // 右侧锚点与位移箭头
      const ax0 = 736;
      const ay0 = 118;
      const ddx = 62;
      const ddy = 40;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 5; c++) {
          const x = ax0 + c * ddx;
          const y = ay0 + r * ddy;
          if (anchorShift > 1) {
            const tx = x + anchorShift;
            const ty = y - anchorShift * 0.5;
            ctx.strokeStyle = '#228d5c';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(tx, ty);
            ctx.stroke();
            ctx.fillStyle = '#228d5c';
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx - 7, ty + 2);
            ctx.lineTo(tx - 3, ty + 6);
            ctx.closePath();
            ctx.fill();
          }
          ctx.fillStyle = '#27446e';
          ctx.beginPath();
          ctx.arc(x, y, 4 + pulse * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 完成瞬间的脉冲强调
      if (pulse > 0.01) {
        ctx.save();
        ctx.globalAlpha = pulse * 0.8;
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(328, (cA + cB) / 2, 10 + (1 - pulse) * 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 标签
      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('位移', 700, 60);
      if (step >= 2) ctx.fillText('已求解', 312, 60);
      if (anchorShift > 1) ctx.fillText(String(Math.round(anchorShift)), ax0, 92);

      // 图例
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.strokeStyle = '#c43f52';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(710, 254, 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#68778f';
      ctx.fillText('优化前', 720, 259);
      ctx.strokeStyle = '#228d5c';
      ctx.beginPath();
      ctx.moveTo(796, 254);
      ctx.lineTo(814, 254);
      ctx.stroke();
      ctx.fillStyle = '#228d5c';
      ctx.beginPath();
      ctx.moveTo(816, 254);
      ctx.lineTo(809, 251);
      ctx.lineTo(809, 257);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#68778f';
      ctx.fillText('优化后', 822, 259);
    };

    let last = 0;
    const tick = (ts: number) => {
      const dt = last ? Math.min(0.06, (ts - last) / 1000) : 0;
      last = ts;
      render(stateRef.current, dt);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      last = 0;
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
        <button className="chip" disabled={repairStep === 1} onClick={() => go(repairStep - 1)}>
          上一步
        </button>
        <button className="chip" disabled={repairStep === 4} onClick={() => go(repairStep + 1)}>
          {repairStep === 4 ? '已完成' : '下一步'}
        </button>
        <button className="chip" onClick={() => go(1)}>
          重置
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch8Anchor;
