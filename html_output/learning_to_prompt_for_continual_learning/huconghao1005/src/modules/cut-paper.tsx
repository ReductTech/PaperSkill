import React, { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  LP,
  lpRoundRect,
  drawField,
  drawTypeCase,
  drawSort,
  drawLink,
  drawLabel,
  drawKitchenCounter,
  drawIngredient,
} from './letterpressKit';

const LAY = {
  gridX: 40,
  gridY: 70,
  gridW: 480,
  gridH: 220,
  bandX: 560,
  bandY: 70,
  bandW: 480,
  bandH: 220,
};

const S_OPTIONS: number[] = [8, 16, 32];

function sideFor(slider: number): number {
  if (slider >= 75) return 8;
  if (slider >= 35) return 16;
  return 32;
}

function gridFor(S: number): number {
  return Math.floor(224 / S);
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  S: number,
  selected: number | null,
): void {
  const n = gridFor(S);
  const gx = LAY.gridX;
  const gy = LAY.gridY;
  drawTypeCase(ctx, gx, gy, LAY.gridW, LAY.gridH, {
    cols: n,
    rows: n,
    gap: 1,
    radius: 2,
    fill: (r: number, c: number) => ((r + c) % 2 === 0 ? LP.light : LP.bg),
    highlight: selected === null ? [] : [[Math.floor(selected / n), selected % n]],
  });
  // 裁切线：格与格之间的切线
  ctx.save();
  ctx.strokeStyle = LP.axis;
  ctx.lineWidth = 1;
  for (let i = 0; i <= n; i++) {
    const x = gx + (LAY.gridW / n) * i;
    const y = gy + (LAY.gridH / n) * i;
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x, gy + LAY.gridH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(gx, y);
    ctx.lineTo(gx + LAY.gridW, y);
    ctx.stroke();
  }
  ctx.restore();
}

function renderNormal(
  ctx: CanvasRenderingContext2D,
  S: number,
  selected: number | null,
  knifeX: number,
  knifeY: number,
): void {
  drawField(ctx, 0, 0, 1080, 360);
  drawGrid(ctx, S, selected);

  // 裁刀：沿纸张上下移动的那把刀
  const ky = clamp(knifeY, LAY.gridY, LAY.gridY + LAY.gridH);
  drawLink(ctx, knifeX, LAY.gridY - 14, knifeX, ky, { color: LP.support, width: 2 });
  drawSort(ctx, knifeX - 12, ky - 14, 24, 28, { face: '裁', fill: LP.support, emphasis: true });

  // 右侧：把选中的那一格摊成 768 个数字
  const highlightRow = selected === null ? [] : [[Math.floor(selected / 48), selected % 48]] as [number, number][];
  drawTypeCase(ctx, LAY.bandX, LAY.bandY, LAY.bandW, LAY.bandH, {
    cols: 48,
    rows: 16,
    gap: 1,
    radius: 1,
    fill: (r: number) => (r % 3 === 0 ? LP.light : LP.dark),
    highlight: highlightRow,
  });
  drawLink(ctx, LAY.gridX + LAY.gridW + 8, 180, LAY.bandX - 8, 180, {
    color: LP.support,
    dashed: true,
    arrow: true,
  });
}

function renderAna(ctx: CanvasRenderingContext2D, t: number): void {
  drawField(ctx, 0, 0, 560, 140);
  const phase = clamp(t, 0, 1);
  // 左边：砧板上的食材，菜刀在切
  drawKitchenCounter(ctx, 30, 100, 200);
  // 整块食材
  const ingredientX = 80;
  const ingredientY = 80;
  drawIngredient(ctx, ingredientX, ingredientY, 25, { type: 'veg', color: LP.success });
  // 菜刀（上下运动）
  const knifeY = 50 + Math.sin(phase * Math.PI * 4) * 15;
  ctx.save();
  ctx.fillStyle = LP.support;
  ctx.strokeStyle = LP.ink;
  ctx.lineWidth = 2;
  // 刀刃
  ctx.beginPath();
  ctx.moveTo(ingredientX - 5, knifeY);
  ctx.lineTo(ingredientX + 25, knifeY);
  ctx.lineTo(ingredientX + 20, knifeY + 20);
  ctx.lineTo(ingredientX, knifeY + 20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // 刀柄
  ctx.fillStyle = LP.dark;
  lpRoundRect(ctx, ingredientX + 18, knifeY - 12, 8, 15, 2, true, true);
  ctx.restore();
  // 右边：切好的小块排成一行（对应 token 序列）
  const pieces = Math.floor(phase * 8) + 1;
  for (let i = 0; i < pieces; i++) {
    const px = 300 + i * 28;
    const py = 85 + Math.sin(phase * 4 + i) * 2;
    drawIngredient(ctx, px, py, 10, { type: 'veg', color: i < pieces - 1 ? LP.accent : LP.success });
  }
  drawLabel(ctx, '备料切菜', 40, 20, { size: 12, weight: 600, color: LP.ink });
  drawLabel(ctx, '切成小块', 300, 20, { size: 12, weight: 600, color: LP.accent });
}

export const CutPaper: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const isAna = moduleId === 'ana';
  const W = isAna ? 560 : 1080;
  const H = isAna ? 140 : 360;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef(0);
  const dragRef = useRef(false);
  const stRef = useRef({ S: 16, selected: null as number | null, knifeX: 300, knifeY: 200, ana: 0 });

  const [slider, setSlider] = useState(50);
  const [selected, setSelected] = useState<number | null>(null);

  const S = sideFor(slider);
  const n = gridFor(S);
  const L = n * n;
  // 一格摊平后的数字个数 S×S×3（也就是论文里的 S²·C）。
  const PATCH = S * S * 3;
  // 嵌入维度 D：论文只把 D 定义为「嵌入维度」，没说 D = S²·C。
  // 768 是本教程这个 ViT-B/16 例子的取值，恰好和 16×16×3 相等，纯属巧合。
  const D = 768;

  const feedback = useMemo(() => {
    if (S === 16) {
      return {
        tone: 'good' as const,
        text: '224 ÷ 16 = 14 → 14×14 = <b>196</b> 行，每行 <b>768</b> 个数字。',
      };
    }
    if (S === 32) {
      return {
        tone: '' as const,
        text: '7×7 = 49 行，每行 3072 个数字。',
      };
    }
    return {
      tone: '' as const,
      text: '28×28 = 784 行——序列变长，注意力代价按平方涨。',
    };
  }, [S]);

  useEffect(() => {
    stRef.current.S = S;
    stRef.current.selected = selected;
  }, [S, selected]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const draw = () => {
      try {
        if (isAna) renderAna(ctx, stRef.current.ana);
        else renderNormal(ctx, stRef.current.S, stRef.current.selected, stRef.current.knifeX, stRef.current.knifeY);
        if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      } catch {
        /* 单帧绘制失败不应中断循环 */
      }
    };
    const start = () => {
      cancelAnimationFrame(rafRef.current);
      const loop = () => {
        if (isAna) {
          stRef.current.ana = (stRef.current.ana + 0.005) % 1;
        }
        draw();
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    };
    const stop = () => cancelAnimationFrame(rafRef.current);
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [W, H, isAna]);

  const posFromEvent = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    return { x, y };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isAna) return;
    const p = posFromEvent(e);
    if (!p) return;
    const cx = clamp(p.x, LAY.gridX, LAY.gridX + LAY.gridW);
    const cy = clamp(p.y, LAY.gridY, LAY.gridY + LAY.gridH);
    dragRef.current = true;
    stRef.current.knifeX = cx;
    stRef.current.knifeY = cy;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* 某些浏览器不支持指针捕获 */
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isAna) return;
    const p = posFromEvent(e);
    if (!p) return;
    if (!dragRef.current) return;
    stRef.current.knifeX = clamp(p.x, LAY.gridX, LAY.gridX + LAY.gridW);
    stRef.current.knifeY = clamp(p.y, LAY.gridY, LAY.gridY + LAY.gridH);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isAna) return;
    const wasDrag = dragRef.current;
    dragRef.current = false;
    if (!wasDrag) return;
    const p = posFromEvent(e);
    if (!p) return;
    if (
      p.x >= LAY.gridX &&
      p.x <= LAY.gridX + LAY.gridW &&
      p.y >= LAY.gridY &&
      p.y <= LAY.gridY + LAY.gridH
    ) {
      const col = Math.floor(((p.x - LAY.gridX) / LAY.gridW) * n);
      const row = Math.floor(((p.y - LAY.gridY) / LAY.gridH) * n);
      const idx = clamp(row * n + col, 0, L - 1);
      setSelected(idx);
    }
  };

  const reset = () => {
    setSelected(null);
    setSlider(50);
  };

  return (
    <div className="widget">
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />

      {!isAna && (
        <>
          <div className="ctrl">
            <label>格子边长</label>
            <input
              type="range"
              min={8}
              max={32}
              step={1}
              value={slider}
              onChange={(e) => {
                setSlider(Number(e.target.value));
                setSelected(null);
              }}
            />
            <span className="val">每格 {S} 像素</span>
            <button type="button" className="chip ghost" onClick={reset}>
              重置
            </button>
          </div>

          <div className="metrics">
            <div className="metric">
              <span className="l">食材</span>
              <span className="v">224×224×3</span>
            </div>
            <div className="metric">
              <span className="l">切块</span>
              <span className="v">
                {n}×{n} = {L}
              </span>
            </div>
            <div className="metric">
              <span className="l">每格数字</span>
              <span className="v">{PATCH}</span>
            </div>
            <div className="metric">
              <span className="l">摊平后的行</span>
              <span className="v">{selected === null ? '未选格' : `第 ${selected} 行`}</span>
            </div>
          </div>

          <div className="step-desc">
            拖动裁刀并点选一格：食材被切成 {n}×{n} = {L} 个小块，每一块摊平成 {S}×{S}×3 = <b>{PATCH}</b>{' '}
            个数字的一行。{S === 16 ? '196 是行数，16 是每格边长——这两个数不是一回事。' : ''}
            摊平后的长度是 S²·C；嵌入维度 D 是另一回事。这个 ViT-B/16 例子里 D = {D}，
            恰好等于 16×16×3——这是巧合，不是恒等式。
          </div>

          <div className={`feedback ${feedback.tone}`}>{feedback.text}</div>
        </>
      )}
    </div>
  );
};

export default CutPaper;
