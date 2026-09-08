import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 5.2：奖励的三因子：有效性门 · 结构因子 · 相似度（静态三张图）。
// 乘积式奖励 R = Valid × Struct × Sim：
//   图 1 有效性门（0/1）：输出合法 → 继续；格式非法/截断/退化 → ×0 直接清零
//   图 2 结构因子（0~1）：可解析但需修正的输出打折（如非矩形 OTSL 按最小修正代价）
//   图 3 相似度：与参考答案按任务指标比对（TEDS / 1−NED / CDM / RMS-F1 / 加权 F1）
// 底部为三因子相乘的奖励条。全部为静态呈现，无动画。

const W = 560;
const H = 240;

const RED = '#c43f52';
const GREEN = '#228d5c';
const BLUE = '#27446e';
const ORANGE = '#d97706';
const INK = '#21324a';
const MUTED = '#68778f';
const AXIS = '#d7deea';

function panel(ctx: CanvasRenderingContext2D, y: number): void {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(12, y, 536, 64);
  ctx.strokeStyle = AXIS;
  ctx.lineWidth = 1;
  ctx.strokeRect(12.5, y + 0.5, 535, 63);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lh: number
): void {
  let line = '';
  let cy = y;
  for (const ch of text) {
    const test = line + ch;
    if (line && ctx.measureText(test).width > maxW) {
      ctx.fillText(line, x, cy);
      line = ch;
      cy += lh;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
}

// 图 1：有效性门（0/1 二值门）
function drawValidFigure(ctx: CanvasRenderingContext2D, y: number): void {
  // 门
  ctx.fillStyle = BLUE;
  ctx.fillRect(300, y + 22, 56, 20);
  ctx.fillStyle = '#ffffff';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('有效性门', 328, y + 35);
  ctx.textAlign = 'left';
  // 上分支：✓ 合法 → 继续（蓝）
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(328, y + 20);
  ctx.lineTo(328, y + 8);
  ctx.lineTo(400, y + 8);
  ctx.stroke();
  ctx.fillStyle = GREEN;
  ctx.beginPath();
  ctx.moveTo(400, y + 8);
  ctx.lineTo(394, y + 4);
  ctx.lineTo(394, y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.font = '11px sans-serif';
  ctx.fillText('✓ 输出合法 → 继续', 410, y + 12);
  // 下分支：✗ 非法 → ×0（红）
  ctx.strokeStyle = RED;
  ctx.beginPath();
  ctx.moveTo(328, y + 44);
  ctx.lineTo(328, y + 54);
  ctx.lineTo(400, y + 54);
  ctx.stroke();
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.moveTo(400, y + 54);
  ctx.lineTo(394, y + 50);
  ctx.lineTo(394, y + 58);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = RED;
  ctx.fillText('✗ 格式非法/截断/退化 → 奖励 ×0', 410, y + 58);
}

// 图 2：结构因子（0~1 折扣条）
function drawStructFigure(ctx: CanvasRenderingContext2D, y: number): void {
  ctx.fillStyle = AXIS;
  ctx.fillRect(300, y + 20, 200, 14);
  ctx.fillStyle = ORANGE;
  ctx.fillRect(300, y + 20, 150, 14);
  ctx.fillStyle = MUTED;
  ctx.font = '10px sans-serif';
  ctx.fillText('0', 300, y + 48);
  ctx.textAlign = 'right';
  ctx.fillText('1', 500, y + 48);
  ctx.textAlign = 'left';
  ctx.fillStyle = INK;
  ctx.font = '11px sans-serif';
  ctx.fillText('0.75（示意）', 458, y + 48);
  ctx.fillStyle = MUTED;
  ctx.fillText('非矩形 OTSL 按最小修正代价打折', 300, y + 62);
}

// 图 3：相似度（输出 vs 参考答案）
function drawSimFigure(ctx: CanvasRenderingContext2D, y: number): void {
  ctx.fillStyle = MUTED;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('输出', 300, y + 16);
  ctx.fillStyle = BLUE;
  ctx.fillRect(340, y + 8, 180, 10);
  ctx.fillStyle = MUTED;
  ctx.fillText('参考答案', 300, y + 36);
  ctx.fillStyle = GREEN;
  ctx.fillRect(340, y + 28, 180, 10);
  ctx.fillStyle = INK;
  ctx.fillText('≈ 0.87（示意）', 340, y + 56);
}

export const Ch6Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(10, 10, W - 20, H - 20);

      // 图 1 有效性门
      panel(ctx, 12);
      ctx.fillStyle = INK;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('有效性门 Valid（0/1）', 22, 30);
      ctx.fillStyle = MUTED;
      ctx.font = '11px sans-serif';
      wrapText(ctx, '二值门槛：不合格直接 0 分，整条奖励清零。', 22, 48, 250, 15);
      drawValidFigure(ctx, 12);

      // 图 2 结构因子
      panel(ctx, 84);
      ctx.fillStyle = INK;
      ctx.font = '12px sans-serif';
      ctx.fillText('结构因子 Struct（0~1）', 22, 102);
      ctx.fillStyle = MUTED;
      ctx.font = '11px sans-serif';
      wrapText(ctx, '可解析但需修正的输出按比例打折。', 22, 120, 250, 15);
      drawStructFigure(ctx, 84);

      // 图 3 相似度
      panel(ctx, 156);
      ctx.fillStyle = INK;
      ctx.font = '12px sans-serif';
      ctx.fillText('相似度 Sim', 22, 174);
      ctx.fillStyle = MUTED;
      ctx.font = '11px sans-serif';
      wrapText(ctx, '与参考答案按任务指标比对：TEDS / 1−NED / CDM / RMS-F1 / 加权 F1。', 22, 192, 250, 15);
      drawSimFigure(ctx, 156);

      // 底部：三因子相乘（独立白条，不与任何边框重叠）
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(12, 212, 536, 24);
      ctx.strokeStyle = AXIS;
      ctx.lineWidth = 1;
      ctx.strokeRect(12.5, 212.5, 535, 23);
      ctx.fillStyle = INK;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('R_t = Valid_t × Struct_t × Sim_t →', 22, 228);
      ctx.fillStyle = AXIS;
      ctx.fillRect(290, 219, 140, 10);
      ctx.fillStyle = GREEN;
      ctx.fillRect(290, 219, 78, 10);
      ctx.fillStyle = INK;
      ctx.font = '11px sans-serif';
      ctx.fillText('奖励（示意）', 442, 228);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };

    const tick = () => render();
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

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="feedback">
        乘积式奖励：有效性门不过直接 0 分，结构瑕疵打折，再按任务相似度计分（图内数值均为示意）。
      </div>
    </div>
  );
};

export default Ch6Mod2;
