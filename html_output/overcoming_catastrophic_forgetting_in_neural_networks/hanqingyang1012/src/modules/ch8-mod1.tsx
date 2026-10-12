import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §8 模块：权重弹簧地图。8×8 网格，格色 = #27446e 按 F_i 透明度叠加在 #b8c9a7 上；
// F_i 图案固定：高亮对角带（F>0.7）+ 其余低值，F = clamp(0.95 − 0.85·|row−col|/7, 0.05, 0.95)。
// 注意：规格中 52px 格 × 8 行 = 416px > 280 画布高度（内在冲突），
// 此处按比例缩为 30px 格（间隙 3px），保持 8×8 结构与点击映射不变（规格外判断，见交付报告）。

const W = 1080;
const H = 280;
const N = 8;
const CELL = 30;
const GAP = 3;
const STEP = CELL + GAP;
const GRID = N * CELL + (N - 1) * GAP; // 261
const GRID_X = Math.round(20 + (540 - GRID) / 2); // ≈160
const GRID_Y = Math.round((H - GRID) / 2); // ≈10

interface Cell {
  r: number;
  c: number;
}

const fiOf = (r: number, c: number) => clamp(0.95 - (0.85 * Math.abs(r - c)) / 7, 0.05, 0.95);

export const Ch8Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ sel: Cell | null }>({ sel: null });
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState<Cell | null>(null);
  const [fb, setFb] = useState({ text: '点击一个权重，查看它的弹簧参数。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const arrow = (x1: number, y: number, x2: number, color: string, dashed: boolean) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.setLineDash(dashed ? [6, 4] : []);
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2 - 6, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x2, y);
      ctx.lineTo(x2 - 9, y - 5);
      ctx.lineTo(x2 - 9, y + 5);
      ctx.closePath();
      ctx.fill();
    };

    const zigzag = (x1: number, y: number, x2: number, amp: number, color: string) => {
      const len = x2 - x1;
      if (len <= 2) return;
      const segs = Math.max(2, Math.round(len / 9));
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i <= segs; i++) {
        const x = x1 + (len * i) / segs;
        const yy = i === segs ? y : y + (i % 2 === 0 ? -amp : amp);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    };

    const render = (s: { sel: Cell | null }) => {
      const hasSel = s.sel !== null;
      const f = s.sel ? fiOf(s.sel.r, s.sel.c) : 0.95;
      const ewcDisp = 0.05 + 0.25 * (1 - f);
      const noDisp = 0.05 + 0.75 * (1 - f);
      const SCALE = 290;
      const ax = 604;
      const ay = 96;
      const ballX = ax + 6 + ewcDisp * SCALE;
      const amp = 3 + 7 * f;

      // 白色场
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // 左：8×8 权重网格（蓝按 F_i 透明度叠加在浅岩色上）
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const x = GRID_X + c * STEP;
          const y = GRID_Y + r * STEP;
          ctx.fillStyle = '#b8c9a7';
          ctx.fillRect(x, y, CELL, CELL);
          const fi = fiOf(r, c);
          ctx.globalAlpha = fi;
          ctx.fillStyle = '#27446e';
          ctx.fillRect(x, y, CELL, CELL);
          ctx.globalAlpha = 1;
        }
      }
      // 选中格绿色描边
      if (s.sel) {
        const x = GRID_X + s.sel.c * STEP;
        const y = GRID_Y + s.sel.r * STEP;
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 2, y - 2, CELL + 4, CELL + 4);
      }

      // 分隔线
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(560, 20);
      ctx.lineTo(560, H - 20);
      ctx.stroke();

      // 右：440px 内嵌图（无选中时整体淡显、数值为 —）
      ctx.globalAlpha = hasSel ? 1 : 0.35;
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(580, 16, 440, 248);

      // 锚点三角 θ*_A,i + 绿环
      ctx.fillStyle = '#21324a';
      ctx.beginPath();
      ctx.moveTo(ax, ay - 8);
      ctx.lineTo(ax, ay + 8);
      ctx.lineTo(ax + 14, ay);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#228d5c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ax, ay, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#68778f';
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('θ*_A', ax, ay - 18);

      // 橙色锯齿弹簧 + 小球（球在 EWC 位移处）
      zigzag(ax + 6, ay, ballX, amp, '#f07e47');
      ctx.fillStyle = '#27446e';
      ctx.beginPath();
      ctx.arc(ballX, ay, 9, 0, Math.PI * 2);
      ctx.fill();

      // 两条位移箭头：EWC 绿实线短、无EWC 红虚线长
      arrow(ax + 6, 158, ax + 6 + ewcDisp * SCALE, '#228d5c', false);
      arrow(ax + 6, 192, ax + 6 + noDisp * SCALE, '#c43f52', true);
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#228d5c';
      ctx.fillText(hasSel ? ewcDisp.toFixed(2) : '—', ax + 12 + ewcDisp * SCALE, 152);
      ctx.fillStyle = '#c43f52';
      ctx.fillText(hasSel ? noDisp.toFixed(2) : '—', ax + 12 + noDisp * SCALE, 186);

      // 裸数字：F_i
      ctx.font = '18px "Segoe UI", sans-serif';
      ctx.fillStyle = '#21324a';
      ctx.fillText('F_i', 598, 40);
      ctx.fillStyle = '#27446e';
      ctx.fillText(hasSel ? f.toFixed(2) : '—', 636, 40);

      // 图例（≤3 项）：无EWC / EWC
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillStyle = '#c43f52';
      ctx.fillRect(598, 232, 14, 4);
      ctx.fillStyle = '#68778f';
      ctx.fillText('无EWC', 618, 238);
      ctx.fillStyle = '#228d5c';
      ctx.fillRect(688, 232, 14, 4);
      ctx.fillStyle = '#68778f';
      ctx.fillText('EWC', 708, 238);
      ctx.globalAlpha = 1;

      // 边框
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, W - 2, H - 2);
    };

    const tick = () => {
      render(stateRef.current);
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

  const select = (cell: Cell) => {
    stateRef.current.sel = cell;
    setSel(cell);
    const f = fiOf(cell.r, cell.c);
    if (f > 0.7) {
      setFb({
        text: '高刚度权重：弹簧很硬，训练任务 B 时几乎原地不动——旧任务的知识就藏在这里。',
        cls: 'good',
      });
    } else if (f >= 0.3) {
      setFb({ text: '中等刚度：会小幅移动，新旧任务在这里折中。', cls: '' });
    } else {
      setFb({
        text: '低刚度权重：弹簧很软，基本自由更新——它负责吸收新任务。',
        cls: 'good',
      });
    }
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    const c = Math.floor((x - GRID_X) / STEP);
    const r = Math.floor((y - GRID_Y) / STEP);
    const inCell = (x - GRID_X) % STEP <= CELL && (y - GRID_Y) % STEP <= CELL;
    if (r >= 0 && r < N && c >= 0 && c < N && inCell) select({ r, c });
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onCanvasClick}
      />
      <div className="chip-row">
        <button
          type="button"
          className={`chip${sel && sel.r === 4 && sel.c === 4 ? ' selected' : ''}`}
          onClick={() => select({ r: 4, c: 4 })}
        >
          最高刚度
        </button>
        <button
          type="button"
          className={`chip${sel && sel.r === 0 && sel.c === 7 ? ' selected' : ''}`}
          onClick={() => select({ r: 0, c: 7 })}
        >
          最低刚度
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch8Mod1;
