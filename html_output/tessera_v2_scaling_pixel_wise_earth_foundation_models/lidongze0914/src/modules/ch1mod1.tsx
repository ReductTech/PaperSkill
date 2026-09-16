import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 1.1「单一规格之困」：P1 存储预算滑杆。固定 128 维底片（宽约 178 TiB）
// 与用户的存储预算槽对照：预算小则塞不进，预算大则白付存储与 I/O。

const W = 1080;
const H = 280;
const PLATE_TIB = 178;
const SLOT_X = 80;
const PLATE_W = 396; // = 预算 178 TiB 时的槽宽

function slotLen(tib: number): number {
  return map(Math.log10(tib), Math.log10(8), Math.log10(256), 20, 460);
}

function fmt(tib: number): string {
  return String(Math.round(tib));
}

export const Ch1Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ budget: 44, pulse: 0 });
  const [budget, setBudget] = useState(44);
  const [feedback, setFeedback] = useState({
    text: '拖动「存储预算」：固定 128 维底片在预算不足时塞不进去，预算充裕时又让所有人白付成本。',
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
    const startAt = performance.now();

    const render = (time: number) => {
      const s = stateRef.current;
      const t = (time - startAt) / 1000;
      s.pulse = (Math.sin(t * 1.6) + 1) / 2;
      const b = s.budget;
      const slot = slotLen(b);
      const over = PLATE_TIB > b; // 预算不够
      const slack = b > PLATE_TIB;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, H - 34, W, 34);
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, H - 34);
      ctx.lineTo(W, H - 34);
      ctx.stroke();

      // 存储架横梁
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(60, 96);
      ctx.lineTo(600, 96);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(70, 60);
      ctx.lineTo(70, 214);
      ctx.moveTo(590, 60);
      ctx.lineTo(590, 214);
      ctx.stroke();

      // 预算槽
      ctx.fillStyle = 'rgba(39,68,110,0.10)';
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2;
      ctx.fillRect(SLOT_X, 150, slot, 34);
      ctx.strokeRect(SLOT_X, 150, slot, 34);

      // 固定底片（宽度恒定）
      ctx.fillStyle = 'rgba(39,68,110,0.20)';
      ctx.strokeStyle = over || slack ? '#c43f52' : '#27446e';
      ctx.lineWidth = 3;
      ctx.fillRect(SLOT_X, 142, PLATE_W, 50);
      ctx.strokeRect(SLOT_X, 142, PLATE_W, 50);

      // 超出 / 浪费的斜纹
      ctx.save();
      ctx.beginPath();
      if (over) {
        ctx.rect(SLOT_X + slot, 142, PLATE_W - slot, 50);
      } else if (slack) {
        ctx.rect(SLOT_X + PLATE_W, 150, slot - PLATE_W, 34);
      }
      ctx.clip();
      ctx.strokeStyle = '#c43f52';
      ctx.lineWidth = 2;
      for (let x = -60; x < W; x += 12) {
        ctx.beginPath();
        ctx.moveTo(x, H);
        ctx.lineTo(x + 60, 100);
        ctx.stroke();
      }
      ctx.restore();

      // 吸附刻度 22 / 44 / 89 / 178
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      const ticks = [22, 44, 89, 178];
      for (let i = 0; i < ticks.length; i++) {
        const tx = SLOT_X + slotLen(ticks[i]);
        ctx.beginPath();
        ctx.moveTo(tx, 196);
        ctx.lineTo(tx, 206);
        ctx.stroke();
      }

      // 标签（画布内仅两个）与图例（三项）
      ctx.fillStyle = '#21324a';
      ctx.font = '20px "Segoe UI", sans-serif';
      ctx.fillText('存储预算', 80, 128);
      ctx.fillText('固定底片', 80, 228);
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillStyle = '#68778f';
      ctx.fillText(fmt(b), SLOT_X + slot + 10, 172);
      ctx.fillText('178', SLOT_X + PLATE_W + 10, 228);

      // 图例
      const lx = 700;
      const ly = 150;
      const legend = [
        { c: '#27446e', label: '已占用' },
        { c: '#b8c9a7', label: '预算余量' },
        { c: '#c43f52', label: '超出 / 浪费' },
      ];
      for (let i = 0; i < legend.length; i++) {
        ctx.fillStyle = legend[i].c;
        ctx.fillRect(lx, ly + i * 34, 18, 18);
        ctx.fillStyle = '#68778f';
        ctx.fillText(legend[i].label, lx + 28, ly + 14 + i * 34);
      }
      // 脉冲提示当前关键读数
      ctx.globalAlpha = 0.35 + 0.3 * s.pulse;
      ctx.strokeStyle = over || slack ? '#c43f52' : '#27446e';
      ctx.lineWidth = 2;
      ctx.strokeRect(lx - 8, ly - 14, 200, 116);
      ctx.globalAlpha = 1;

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Number(e.target.value), 8, 256);
    stateRef.current.budget = v;
    setBudget(v);
    if (v < PLATE_TIB) {
      setFeedback({
        text: `预算 ${Math.round(v)} TiB：固定 128 维底片塞不进去，小预算用户只能放弃或自行截断`,
        cls: 'bad',
      });
    } else if (v === PLATE_TIB) {
      setFeedback({
        text: '预算 178 TiB：底片恰好嵌入——但全体用户共享这一个适配点',
        cls: '',
      });
    } else {
      setFeedback({
        text: `预算 ${Math.round(v)} TiB：底片装得下，多余的存储与 I/O 成本却照价摊给每个人`,
        cls: 'bad',
      });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          存储预算 <span className="val">{Math.round(budget)} TiB</span>
        </label>
        <input type="range" min={8} max={256} step={1} value={budget} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Mod1;
