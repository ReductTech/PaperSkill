import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, useStage, drawStage, glow, rr, label, legend, sceneCanvas, rgba, toCanvas, GRID } from './stageKit';
import { TOKEN_COUNTS } from './paperData';
import { clamp } from '../lib/canvasKit';
import { Num, CanvasPan } from './ui';

// 模块 2.1（P5 点击热点）：点击图片上的图块 -> 序列中的位置 + 因果注意力可见范围。

const W = 1080;
const H = 330;
const IX = 34;
const IY = 30;
const PS = 11; // 每个 patch 的显示边长
const IS = PS * GRID;
const SYS = TOKEN_COUNTS.sys;
const INS = TOKEN_COUNTS.ins;
const SEQ = SYS + GRID * GRID + INS;
const PER_ROW = 62;
const RX = 360;
const RY = 40;
const CELL = 11;

function cellPos(idx: number) {
  return { x: RX + (idx % PER_ROW) * CELL, y: RY + Math.floor(idx / PER_ROW) * (CELL + 3) };
}

export const PatchSequence: React.FC<WidgetProps> = () => {
  const [sel, setSel] = useState({ r: 7, c: 7 });
  const selRef = useRef(sel);
  selRef.current = sel;
  const hover = useRef<{ r: number; c: number } | null>(null);
  const dragging = useRef(false);

  const canvasRef = useStage(W, H, (ctx, t) => {
    drawStage(ctx, W, H, t, 0.97);
    const s = selRef.current;
    const selIdx = SYS + s.r * GRID + s.c;
    const img = sceneCanvas();

    // ---- 左：图片 + 网格 ----
    ctx.drawImage(img, IX, IY, IS, IS);
    ctx.strokeStyle = 'rgba(11,18,34,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 1; k < GRID; k++) {
      ctx.moveTo(IX + k * PS, IY);
      ctx.lineTo(IX + k * PS, IY + IS);
      ctx.moveTo(IX, IY + k * PS);
      ctx.lineTo(IX + IS, IY + k * PS);
    }
    ctx.stroke();
    // 已“读过”的区域（行优先，排在所选之前）略提亮，之后的区域压暗
    ctx.fillStyle = 'rgba(11,18,34,0.5)';
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        if (r * GRID + c > s.r * GRID + s.c) ctx.fillRect(IX + c * PS, IY + r * PS, PS, PS);
      }
    }
    if (hover.current) {
      ctx.strokeStyle = 'rgba(232,238,248,0.8)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(IX + hover.current.c * PS, IY + hover.current.r * PS, PS, PS);
    }
    const px = IX + s.c * PS;
    const py = IY + s.r * PS;
    glow(ctx, px + PS / 2, py + PS / 2, 26, C.emph, 0.7 + 0.2 * Math.sin(t * 5));
    ctx.strokeStyle = C.emph;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(px - 1, py - 1, PS + 2, PS + 2);

    // ---- 右：整条输入序列（图像段直接显示对应图块）----
    for (let i = 0; i < SEQ; i++) {
      const { x, y } = cellPos(i);
      const visible = i <= selIdx;
      const a = visible ? 1 : 0.22;
      if (i < SYS) {
        ctx.fillStyle = rgba(C.sys, a);
        rr(ctx, x, y, CELL - 2, CELL - 2, 2);
        ctx.fill();
      } else if (i < SYS + GRID * GRID) {
        const k = i - SYS;
        ctx.globalAlpha = a;
        ctx.drawImage(img, (k % GRID) * 14, Math.floor(k / GRID) * 14, 14, 14, x, y, CELL - 2, CELL - 2);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = rgba(C.ins, a);
        rr(ctx, x, y, CELL - 2, CELL - 2, 2);
        ctx.fill();
      }
    }
    // 可见范围的波光
    const wave = (t * 220) % (selIdx + 1);
    const wp = cellPos(Math.floor(wave));
    glow(ctx, wp.x + 4, wp.y + 4, 14, '#ffffff', 0.35);
    const sp = cellPos(selIdx);
    glow(ctx, sp.x + 4, sp.y + 4, 22, C.emph, 0.8);
    ctx.strokeStyle = C.emph;
    ctx.lineWidth = 2;
    ctx.strokeRect(sp.x - 1.5, sp.y - 1.5, CELL + 1, CELL + 1);

    // 连接线：图块 -> 序列位置
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(px, py, sp.x, sp.y);
    g.addColorStop(0, rgba(C.emph, 0.85));
    g.addColorStop(1, rgba(C.emph, 0.25));
    ctx.strokeStyle = g;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.lineDashOffset = -t * 30;
    ctx.beginPath();
    ctx.moveTo(px + PS, py + PS / 2);
    ctx.bezierCurveTo(px + 120, py + PS / 2, sp.x - 80, sp.y + 4, sp.x - 2, sp.y + 4);
    ctx.stroke();
    ctx.restore();

    const last = cellPos(SEQ - 1);
    label(ctx, `#${selIdx + 1}`, RX, last.y + 40, 22, C.emph, 'left', 800, true);
    label(ctx, `/ ${SEQ}`, RX + 72, last.y + 41, 15, C.muted, 'left', 700, true);
    legend(ctx, [[C.sys, '系统提示'], [C.img, '图像块'], [C.ins, '用户指令']], RX + 620 - 260, last.y + 40);
  });

  const pick = (e: React.PointerEvent<HTMLCanvasElement>, commit: boolean) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const { x, y } = toCanvas(e, cv, W, H);
    const c = Math.floor((x - IX) / PS);
    const r = Math.floor((y - IY) / PS);
    const inside = c >= 0 && c < GRID && r >= 0 && r < GRID;
    hover.current = inside ? { r, c } : null;
    cv.style.cursor = inside ? 'pointer' : 'default';
    if (inside && commit) setSel({ r, c });
  };

  const onKey = (e: React.KeyboardEvent) => {
    const d: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    const v = d[e.key];
    if (!v) return;
    e.preventDefault();
    e.stopPropagation();
    setSel((s) => ({ r: clamp(s.r + v[0], 0, GRID - 1), c: clamp(s.c + v[1], 0, GRID - 1) }));
  };

  const idx = SYS + sel.r * GRID + sel.c;
  const seenImg = sel.r * GRID + sel.c;
  return (
    <div>
      <CanvasPan><canvas
        ref={canvasRef}
        width={W}
        height={H}
        tabIndex={0}
        aria-label="图块与序列位置：点击图片选择图块，方向键移动"
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
          pick(e, true);
        }}
        onPointerMove={(e) => pick(e, dragging.current)}
        onPointerUp={() => (dragging.current = false)}
        onPointerLeave={() => (hover.current = null)}
        onKeyDown={onKey}
      /></CanvasPan>
      <div className="metrics">
        <div className="metric">
          <div className="l">图块行 / 列</div>
          <div className="v">
            {sel.r + 1} / {sel.c + 1}
          </div>
        </div>
        <div className="metric">
          <div className="l">在输入序列中的位置</div>
          <div className="v">
            <Num value={idx + 1} format={(v) => `#${Math.round(v)}`} />
          </div>
        </div>
        <div className="metric">
          <div className="l">它能看到的前序 token</div>
          <div className="v">
            <Num value={idx} />
          </div>
        </div>
      </div>
      <div className="feedback good">
        这个图块排在第 {idx + 1} 位：它能看到前面 {SYS} 个系统提示 token 和 {seenImg} 个图像块，却看不到排在后面的用户问题——
        只有指令和输出 token 才能“回头看”整张图。
      </div>
    </div>
  );
};

export default PatchSequence;
