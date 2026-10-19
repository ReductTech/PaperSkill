import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第9章：数据集规模对比（SA-1B vs ADE20K vs Open Images）—— 双面板美观图表
const W = 1080;
const H = 340;

// 数据均来自论文 §5：SA-1B 11M 图/1.1B 掩码/约 100 掩码每图；
// Open Images 为 11×图/400×掩码/36×每图 → 反推约 1M 图/2.75M 掩码/约 2.8 每图；
// ADE20K 每图掩码数为 SA-1B 的 1/3.5（约 29）。带 * 为由论文比例换算的近似值。
const DATA = [
  { key: 'sa1b', name: 'SA-1B', img: '11M', masks: '1.1B', perImg: 100, lg: 3.04 },
  { key: 'ade', name: 'ADE20K*', img: '≈22k', masks: '≈0.6M*', perImg: 29, lg: -0.22 },
  { key: 'oi', name: 'Open Images*', img: '≈1M*', masks: '≈2.75M*', perImg: 2.8, lg: 0.44 },
];

const FB: Record<string, string> = {
  sa1b: 'SA-1B：11M 图 / 1.1B 掩码，平均每图约 100 个掩码。',
  ade: 'ADE20K：每图平均掩码数约为 SA-1B 的 1/3.5（由论文比例换算）。',
  oi: 'Open Images：图数约为 SA-1B 的 1/11、掩码数约为 1/400（由论文比例换算）。',
};

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export const Ch9Dataset: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ active: 'sa1b' });
  const rafRef = useRef<number | null>(null);
  const [active, setActive] = useState('sa1b');
  const [feedback, setFeedback] = useState(FB.sa1b);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { active: string }) => {
      ctx.clearRect(0, 0, W, H);
      // 背景
      const bgGrad = ctx.createLinearGradient(40, 20, W - 40, H - 20);
      bgGrad.addColorStop(0, '#f8fbf4');
      bgGrad.addColorStop(1, '#eef3fb');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.roundRect(30, 22, W - 60, H - 44, 14);
      ctx.fill();
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.stroke();

      const rows = [124, 178, 232];
      const barH = 40;
      const baseY = 286;

      // —— 左面板：每图平均掩码数（线性） ——
      const L0 = 84,
        Lmax = 356;
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText('📊 每图平均掩码数', L0, 78);
      // 网格（25/50/75/100）
      ctx.strokeStyle = 'rgba(39,68,110,0.10)';
      ctx.lineWidth = 1;
      for (const g of [25, 50, 75, 100]) {
        const x = L0 + (g / 100) * Lmax;
        ctx.beginPath();
        ctx.moveTo(x, 100);
        ctx.lineTo(x, baseY);
        ctx.stroke();
        ctx.fillStyle = '#a9b4c3';
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillText(String(g), x - 8, baseY + 18);
      }
      // 基线
      ctx.strokeStyle = '#68778f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(L0, baseY);
      ctx.lineTo(L0 + Lmax, baseY);
      ctx.stroke();
      // 条
      DATA.forEach((d, i) => {
        const y = rows[i];
        const w = d.key === 'sa1b' ? Lmax : Math.max(12, (d.perImg / 100) * Lmax);
        const on = s.active === d.key;
        const g = ctx.createLinearGradient(L0, y, L0 + w, y);
        if (on) {
          g.addColorStop(0, '#8fd0a4');
          g.addColorStop(1, '#1f8f54');
        } else {
          g.addColorStop(0, '#cfe3d4');
          g.addColorStop(1, '#a9c6b2');
        }
        ctx.fillStyle = g;
        rr(ctx, L0, y, w, barH, 8);
        ctx.fill();
        if (on) {
          ctx.strokeStyle = '#1b7a48';
          ctx.lineWidth = 2;
          rr(ctx, L0, y, w, barH, 8);
          ctx.stroke();
        }
        // 标签
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillStyle = on ? '#228d5c' : '#68778f';
        ctx.fillText(d.name, L0, y - 6);
        ctx.fillStyle = '#21324a';
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.fillText(String(d.perImg), L0 + w + 8, y + barH - 12);
      });

      // —— 右面板：总掩码数（对数刻度） ——
      const R0 = 540,
        Rmax = 356;
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText('🗃️ 总掩码数（对数）', R0, 78);
      // 对数刻度线：0.1/1/10/100/1000 → lg -1..3
      const tickFrac = (lg: number) => (lg + 1) / 4;
      ctx.strokeStyle = 'rgba(39,68,110,0.10)';
      ctx.lineWidth = 1;
      const labels: [number, string][] = [[-1, '0.1M'], [0, '1M'], [1, '10M'], [2, '100M'], [3, '1B']];
      for (const [lg, lab] of labels) {
        const x = R0 + tickFrac(lg) * Rmax;
        ctx.beginPath();
        ctx.moveTo(x, 100);
        ctx.lineTo(x, baseY);
        ctx.stroke();
        ctx.fillStyle = '#a9b4c3';
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillText(lab, x - 14, baseY + 18);
      }
      ctx.strokeStyle = '#68778f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(R0, baseY);
      ctx.lineTo(R0 + Rmax, baseY);
      ctx.stroke();
      DATA.forEach((d, i) => {
        const y = rows[i];
        const frac = Math.max(0, Math.min(1, tickFrac(d.lg)));
        const w = Math.max(14, frac * Rmax);
        const on = s.active === d.key;
        const g = ctx.createLinearGradient(R0, y, R0 + w, y);
        if (on) {
          g.addColorStop(0, '#ffc98a');
          g.addColorStop(1, '#f07e47');
        } else {
          g.addColorStop(0, '#f3dcc2');
          g.addColorStop(1, '#e6b98f');
        }
        ctx.fillStyle = g;
        rr(ctx, R0, y, w, barH, 8);
        ctx.fill();
        if (on) {
          ctx.strokeStyle = '#e06a2f';
          ctx.lineWidth = 2;
          rr(ctx, R0, y, w, barH, 8);
          ctx.stroke();
        }
        ctx.fillStyle = '#21324a';
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.fillText(d.masks, R0 + w + 8, y + barH - 12);
      });
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

  const choose = (k: string) => {
    stateRef.current.active = k;
    setActive(k);
    setFeedback(FB[k]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {DATA.map((d) => (
          <button
            key={d.key}
            className={active === d.key ? 'btn on' : 'btn'}
            onClick={() => choose(d.key)}
          >
            {d.name}
          </button>
        ))}
      </div>
      <div className={`feedback ${active === 'sa1b' ? 'good' : ''}`}>{feedback}</div>
    </div>
  );
};

export default Ch9Dataset;
