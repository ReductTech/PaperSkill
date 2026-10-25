import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第10章 模块1：23 数据集 SAM vs RITM 的 mIoU 差值（默认 vs oracle）—— 美观发散条形图
const W = 1080;
const H = 360;

// 数据来自论文 Figure 7b（SAM − RITM 的 IoU 差值），全部 23 个数据集。
const DELTAS: [string, number][] = [
  ['GTEA', -21.4], ['TrashCan', -15.0], ['DRAM', -6.5], ['PIDRay', -5.8],
  ['Cityscapes', -2.0], ['WoodScape', -0.6], ['IBD', -0.3], ['EgoHOS', 0.8],
  ['Plittersdorf', 1.5], ['VISOR', 1.8], ['NDISPark', 2.7], ['Hypersim', 6.1],
  ['OVIS', 7.0], ['ADE20K', 7.8], ['iShape', 8.8], ['ZeroWaste-f', 9.1],
  ['STREETS', 17.3], ['LVIS', 18.5], ['NDD20', 21.1], ['TimberSeg', 28.9],
  ['DOORS', 41.1], ['BBBC038v1', 44.7], ['PPDLS', 46.9],
];

export const Ch10ZeroShot: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ oracle: false });
  const rafRef = useRef<number | null>(null);
  const [oracle, setOracle] = useState(false);
  const [feedback, setFeedback] = useState({
    text: '默认（选最自信掩码）：SAM 在 23 个数据集中 16 个高于 RITM，最高约 +47 IoU。',
    cls: 'good',
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
    const render = (s: { oracle: boolean }) => {
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

      const midX = 400;
      const rowTop = 66;
      const rowBot = H - 56;
      const rowH = (rowBot - rowTop) / DELTAS.length;
      const barH = Math.min(14, rowH - 5);
      const maxLen = 300;

      // 网格（±10/20/30/40）
      ctx.strokeStyle = 'rgba(39,68,110,0.10)';
      ctx.lineWidth = 1;
      ctx.font = '11px "Segoe UI", sans-serif';
      for (const g of [10, 20, 30, 40]) {
        const xr = midX + (g / 50) * maxLen;
        const xl = midX - (g / 50) * maxLen;
        ctx.beginPath(); ctx.moveTo(xr, rowTop); ctx.lineTo(xr, rowBot); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(xl, rowTop); ctx.lineTo(xl, rowBot); ctx.stroke();
        ctx.fillStyle = '#a9b4c3';
        ctx.fillText('+' + g, xr + 3, rowTop + 10);
        ctx.fillText('-' + g, xl - 22, rowTop + 10);
      }
      // 零基线
      ctx.strokeStyle = '#68778f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(midX, rowTop);
      ctx.lineTo(midX, rowBot);
      ctx.stroke();
      ctx.fillStyle = '#68778f';
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.fillText('0', midX + 5, rowTop - 6);

      // 条
      DELTAS.forEach(([name, delta], i) => {
        const y = rowTop + i * rowH + 2;
        const val = s.oracle ? Math.max(0.5, delta) : delta;
        const w = Math.max(3, (Math.abs(val) / 50) * maxLen);
        const isPos = val >= 0;
        const g = ctx.createLinearGradient(
          isPos ? midX : midX - w,
          y,
          isPos ? midX + w : midX,
          y
        );
        if (isPos) {
          g.addColorStop(0, '#9fe0b8');
          g.addColorStop(1, '#1f8f54');
        } else {
          g.addColorStop(0, '#e88b90');
          g.addColorStop(1, '#b33344');
        }
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.roundRect(isPos ? midX : midX - w, y, w, barH, 4);
        ctx.fill();
        // 名称（基线上方）
        ctx.fillStyle = '#44505f';
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText(name, midX - 188, y + barH - 3);
        // 数值
        ctx.fillStyle = isPos ? '#1f8f54' : '#b33344';
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        const lab = s.oracle ? '+' + Math.abs(val).toFixed(1) : (delta > 0 ? '+' : '') + delta.toFixed(1);
        ctx.fillText(lab, isPos ? midX + w + 6 : midX - w - 40, y + barH - 3);
      });

      // 顶部标题 + 状态徽标
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText('📈 23 数据集：SAM − RITM IoU 差值', 84, 44);
      const badgeTxt = s.oracle ? 'oracle：23/23 全优' : '默认：16/23 更高';
      const badgeCol = s.oracle ? '#1f8f54' : '#f07e47';
      ctx.fillStyle = badgeCol;
      ctx.beginPath();
      ctx.roundRect(W - 250, 26, 210, 28, 14);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText(badgeTxt, W - 145, 45);
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

  const toggle = (v: boolean) => {
    stateRef.current.oracle = v;
    setOracle(v);
    setFeedback(
      v
        ? { text: 'oracle：从 SAM 的 3 个掩码中选与真值最相关者，SAM 在全部 23 个数据集上优于 RITM。', cls: 'good' }
        : { text: '默认（选最自信掩码）：SAM 在 16/23 个数据集上高于 RITM，最高约 +47 IoU。', cls: 'good' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={!oracle ? 'btn on' : 'btn'} onClick={() => toggle(false)}>
          默认（最自信掩码）
        </button>
        <button className={oracle ? 'btn on' : 'btn'} onClick={() => toggle(true)}>
          oracle（选最优掩码）
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch10ZeroShot;
