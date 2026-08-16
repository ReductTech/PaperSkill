import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = {
  scene: '#f5f8f0', shelf: '#b8c9a7', shelfDark: '#76906a', wood: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', line: '#d7deea',
};
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.scene; ctx.fillRect(0, 0, w, h);
}
function drawShelfRow(ctx: CanvasRenderingContext2D, y: number, x0: number, x1: number) {
  ctx.fillStyle = C.shelf; ctx.fillRect(x0, y - 6, x1 - x0, 8);
  ctx.fillStyle = C.shelfDark; ctx.fillRect(x0, y + 1, x1 - x0, 2);
  ctx.fillStyle = 'rgba(118,144,106,0.25)'; ctx.fillRect(x1 - 4, y - 8, 4, 10);
}
function drawBook(ctx: CanvasRenderingContext2D, x: number, y: number, bw: number, bh: number, color: string) {
  ctx.fillStyle = color; rr(ctx, x, y - bh, bw, bh, 2); ctx.fill();
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = 'rgba(33,50,74,0.35)'; ctx.fillRect(x + bw / 2 - 0.5, y - bh + 3, 1, bh - 6);
}
function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, color: string) {
  const bob = Math.sin(t * 6) * 1.2;
  ctx.save(); ctx.translate(x, y + bob);
  ctx.fillStyle = color; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5;
  rr(ctx, -16, -22, 32, 24, 9); ctx.fill(); ctx.stroke();
  rr(ctx, -12, -34, 9, 16, 4); ctx.fill(); ctx.stroke();
  rr(ctx, 3, -34, 9, 16, 4); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function drawBookmark(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.lineTo(x, y + 9); ctx.closePath(); ctx.fill();
}
function drawEndStop(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = C.wood;
  ctx.beginPath(); ctx.moveTo(x, y - 34); ctx.lineTo(x + 12, y); ctx.lineTo(x - 12, y); ctx.closePath(); ctx.fill();
}
function drawNote(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, value: string) {
  ctx.fillStyle = '#ffffff'; rr(ctx, x, y, 96, 30, 5); ctx.fill();
  ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = C.muted; ctx.font = '11px "Segoe UI", sans-serif'; ctx.fillText(label, x + 8, y + 13);
  ctx.fillStyle = C.ink; ctx.font = 'bold 14px "Segoe UI", sans-serif'; ctx.fillText(value, x + 8, y + 25);
}
function drawTargetMark(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color; ctx.font = 'bold 20px "Segoe UI", sans-serif'; ctx.fillText('✓', x, y);
}
function drawSceneLabel(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color = C.ink) {
  ctx.fillStyle = color; ctx.font = '13px "Segoe UI", sans-serif'; ctx.fillText(text, x, y);
}
function drawLegend(ctx: CanvasRenderingContext2D, x: number, y: number, items: Array<[string, string]>) {
  items.forEach(([color, label], i) => {
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x + i * 90, y + 4, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.muted; ctx.font = '11px "Segoe UI", sans-serif'; ctx.fillText(label, x + i * 90 + 9, y + 8);
  });
}

const W = 560, H = 260;
const N_FIXED = 64;
// 线性扫描每扫完一遍的毫秒数，与"快"进度条的循环周期一致
const SCAN_CYCLE = 1500;
// 矩阵参数：64×64，2px 格子 + 0.5px 缝隙 → 160px 见方
const MAT = 64;
const CELL = 2, GAP = 0.5, PITCH = CELL + GAP;
const GRID = MAT * PITCH - GAP;
const GX = 16, GY = 30;
const CMP = MAT * MAT; // 4096 次打分（N×N 满矩阵，无 mask）

export const Ch3M2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ method: 'attn' as 'attn' | 'linear' });
  const rafRef = useRef<number | null>(null);
  const [method, setMethod] = useState<'attn' | 'linear'>('attn');
  const [feedback, setFeedback] = useState({ text: '固定 N=64：对比自注意力与线性扫描完成同一序列的开销。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { method: 'attn' | 'linear' }, t: number) => {
      clearScene(ctx, W, H);
      const attn = s.method === 'attn';

      // ---- left panel: 64×64 矩阵（注意 vs 线性扫描）----
      drawSceneLabel(
        ctx, 16, 18,
        attn ? '注意矩阵（N=64）：N×N 打分' : '线性扫描（N=64）：每步一格',
        C.ink
      );

      // left/right divider
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(335, 8); ctx.lineTo(335, H - 8); ctx.stroke();

      // 矩阵底板：未计算的格子 = 浅灰
      ctx.fillStyle = '#e6ecdc';
      for (let r = 0; r < MAT; r++) {
        for (let c = 0; c < MAT; c++) {
          ctx.fillRect(GX + c * PITCH, GY + r * PITCH, CELL, CELL);
        }
      }

      let prog: number;
      let noteLabel: string;
      let noteValue: string;
      let caption: string;
      let progLabel: string;

      if (attn) {
        // 红格逐个亮起：按行填充满矩阵（4096 格 = N×N，每个 query 对所有 key 打分）
        prog = (t % 6000) / 6000;
        const k = Math.min(CMP, Math.floor(prog * CMP));
        ctx.fillStyle = 'rgba(196,63,82,0.9)';
        let rem = k;
        outer: for (let r = 0; r < MAT; r++) {
          for (let c = 0; c < MAT; c++) {
            if (rem <= 0) break outer;
            ctx.fillRect(GX + c * PITCH, GY + r * PITCH, CELL, CELL);
            rem--;
          }
        }
        noteLabel = '打分次数';
        noteValue = `${k}/${CMP}`;
        caption = '红格逐个亮起：N×N 满矩阵共 4096 次打分（无 mask，全局）';
        progLabel = '进度（慢）';
      } else {
        // 绿格沿对角线前进：每步只亮一格，共 64 格
        prog = (t % SCAN_CYCLE) / SCAN_CYCLE;
        const s = Math.min(MAT, Math.floor(prog * MAT));
        // 已扫过的对角线格子（保留绿色轨迹）
        ctx.fillStyle = C.green;
        for (let i = 0; i < s; i++) {
          ctx.fillRect(GX + i * PITCH, GY + i * PITCH, CELL, CELL);
        }
        // 当前扫描头：光晕 + 更亮的绿格
        if (s < MAT) {
          const hx = GX + s * PITCH, hy = GY + s * PITCH;
          ctx.fillStyle = 'rgba(34,141,92,0.35)';
          ctx.fillRect(hx - 2, hy - 2, CELL + 4, CELL + 4);
          ctx.fillStyle = C.green;
          ctx.fillRect(hx, hy, CELL, CELL);
        }
        noteLabel = '扫描步数';
        noteValue = `${s}/${N_FIXED}`;
        caption = '绿格沿对角线前进：每步只算 1 格，共 64 格';
        progLabel = '进度（快）';
      }

      // 便签：实时计数
      drawNote(ctx, 226, 30, noteLabel, noteValue);
      // 图注
      drawSceneLabel(ctx, 16, 208, caption, C.muted);
      // 进度条（与矩阵动画同周期）
      drawSceneLabel(ctx, 16, 226, progLabel, C.muted);
      ctx.fillStyle = '#ffffff';
      rr(ctx, 16, 234, 300, 14, 4);
      ctx.fill();
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.stroke();
      if (prog > 0) {
        ctx.fillStyle = attn ? C.red : C.green;
        rr(ctx, 16, 234, Math.max(2, 300 * prog), 14, 4);
        ctx.fill();
      }

      // ---- right panel: computation bars ----
      drawSceneLabel(ctx, 352, 18, '计算量（示意）', C.ink);
      const barY = 152;
      const redH = 96, greenH = 30;
      ctx.fillStyle = C.red;
      rr(ctx, 360, barY - redH, 46, redH, 3);
      ctx.fill();
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.stroke();
      drawSceneLabel(ctx, 360, barY - redH - 6, '4096', C.red);
      drawSceneLabel(ctx, 360, barY + 16, '自注意力', C.muted);
      ctx.fillStyle = C.green;
      rr(ctx, 432, barY - greenH, 46, greenH, 3);
      ctx.fill();
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.stroke();
      drawSceneLabel(ctx, 432, barY - greenH - 6, '64', C.green);
      drawSceneLabel(ctx, 432, barY + 16, '线性扫描', C.muted);
      ctx.strokeStyle = C.line;
      ctx.beginPath(); ctx.moveTo(350, barY); ctx.lineTo(500, barY); ctx.stroke();
    };

    const tick = (t: number) => {
      render(stateRef.current, t);
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

  const setState = (s: Partial<typeof stateRef.current>) => {
    stateRef.current = { ...stateRef.current, ...s };
    const v = stateRef.current;
    setMethod(v.method);
    setFeedback(
      v.method === 'attn'
        ? { text: 'N=64 时自注意力要打 64×64 = 4096 次分（满矩阵，无 mask），开销大（红）', cls: 'bad' }
        : { text: '线性扫描只需 64 步，明显更轻（绿）。', cls: 'good' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button
          type="button"
          className={`chip ${method === 'attn' ? 'selected' : ''}`}
          onClick={() => setState({ method: 'attn' })}
        >
          C2PSA 自注意力
        </button>
        <button
          type="button"
          className={`chip ${method === 'linear' ? 'selected' : ''}`}
          onClick={() => setState({ method: 'linear' })}
        >
          Mamba 线性扫描
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
