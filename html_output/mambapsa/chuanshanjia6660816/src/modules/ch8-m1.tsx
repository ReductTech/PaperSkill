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

const W = 560, H = 240;

type Variant = 'c2psa' | 'mambapsa' | 'bivim';
const VARIANT_META: Record<Variant, { label: string; params: number; flops: number; map: number; abs: string }> = {
  c2psa: { label: 'C2PSA（基线）', params: 0, flops: 0, map: 0, abs: '实数值 2.4M · 5.8 · 49.9' },
  mambapsa: { label: 'MambaPSA', params: -2.9, flops: -12.1, map: -0.1, abs: '实数值 2.4M→2.33M · 5.8→5.1 · 49.9→49.8' },
  bivim: { label: 'BiViM·P4', params: 9.6, flops: 6.9, map: 0.9, abs: '实数值 2.63M · 6.2 · 50.8' },
};
const FEEDBACK: Record<Variant, { text: string; cls: string }> = {
  c2psa: { text: 'C2PSA（基线）：a 分支自注意力做全局聚合、b 分支恒等直接连（红/橙）。贵的在 a 分支——MambaPSA 正是把 a 分支的自注意力换成 Mamba，b 恒等不动。', cls: 'bad' },
  mambapsa: { text: 'a 走 Mamba、b 恒等：整网参数 −2.9%（2.4M→2.33M）、FLOPs −12.1%（5.8→5.1 GFLOPs）、mAP 几乎不变（−0.1）（绿）。', cls: 'good' },
  bivim: { text: 'BiViM·P4：双向 Mamba 块——正向、反向两个并行通道各扫一遍，两向输出相加（sum）后再线性投影、加残差（紫框）；插在颈部 N4 后：mAP +0.9 但参数 +9.6%。', cls: '' },
};

export const Ch8M1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ variant: Variant }>({ variant: 'mambapsa' });
  const rafRef = useRef<number | null>(null);
  const [variant, setVariant] = useState<Variant>('mambapsa');
  const [feedback, setFeedback] = useState(FEEDBACK.mambapsa);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = (s: { variant: Variant }, time: number) => {
      clearScene(ctx, W, H);
      const meta = VARIANT_META[s.variant];
      const isMamba = s.variant === 'mambapsa';
      const isBivim = s.variant === 'bivim';

      const box = (x: number, y: number, w: number, h: number, label: string, color: string, strong = false) => {
        ctx.fillStyle = '#ffffff';
        rr(ctx, x, y, w, h, 6); ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = strong ? 2.5 : 1.5; ctx.stroke();
        ctx.fillStyle = C.ink;
        ctx.font = label.length > 6 ? '11px "Segoe UI", sans-serif' : '13px "Segoe UI", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, x + w / 2, y + h / 2);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      };
      const arrow = (x1: number, y1: number, x2: number, y2: number, color: string) => {
        ctx.strokeStyle = color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        const ang = Math.atan2(y2 - y1, x2 - x1);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - 8 * Math.cos(ang - 0.4), y2 - 8 * Math.sin(ang - 0.4));
        ctx.lineTo(x2 - 8 * Math.cos(ang + 0.4), y2 - 8 * Math.sin(ang + 0.4));
        ctx.closePath(); ctx.fill();
      };
      const scanArrow = (x: number, yTop: number, yBot: number, color: string, speed: number, tm: number) => {
        const span = yBot - yTop;
        const ph = ((tm * speed) % span) / span;
        const ay = yTop + ph * span;
        ctx.strokeStyle = color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, ay - 6); ctx.lineTo(x, ay + 6); ctx.stroke();
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.moveTo(x, ay + 9); ctx.lineTo(x - 4, ay + 2); ctx.lineTo(x + 4, ay + 2); ctx.closePath(); ctx.fill();
      };
      const identityLine = (x: number, yTop: number, yBot: number, color: string) => {
        ctx.strokeStyle = color; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(x, yTop + 2); ctx.lineTo(x, yBot - 4); ctx.stroke();
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.moveTo(x, yBot); ctx.lineTo(x - 4, yBot - 8); ctx.lineTo(x + 4, yBot - 8); ctx.closePath(); ctx.fill();
      };

      // ---------- 左：块示意图 ----------
      ctx.save();
      if (isBivim) {
        // BiViM：两个并行通道（正向 / 反向扫描）→ 相加（sum）→ 线性投影 → 残差 ⊕x。
        // 两通道之间没有直接连线，只在下游相加，而不是 C2PSA 的 1×1 拆分/拼接。
        box(116, 6, 112, 24, '输入 x', C.ink);
        box(30, 48, 100, 36, '正向 →', C.blue, true);
        box(214, 48, 100, 36, '← 反向', C.orange, true);
        arrow(172, 30, 82, 48, C.blue);
        arrow(172, 30, 262, 48, C.orange);
        // 通道内扫描动效：正向从左往右、反向从右往左
        const fdot = ((time * 40) % 100) / 100;
        ctx.fillStyle = C.blue;
        ctx.beginPath(); ctx.arc(32 + fdot * 96, 79, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C.orange;
        ctx.beginPath(); ctx.arc(216 + (1 - fdot) * 96, 79, 3.5, 0, Math.PI * 2); ctx.fill();
        // 相加（sum）
        box(148, 96, 48, 26, '+', C.purple, true);
        drawSceneLabel(ctx, 150, 130, '相加 sum', C.muted);
        arrow(80, 84, 152, 96, C.blue);
        arrow(264, 84, 192, 96, C.orange);
        box(116, 140, 112, 26, '线性投影', C.ink);
        arrow(172, 122, 172, 140, C.ink);
        box(116, 184, 112, 26, '输出 ⊕x', C.ink);
        arrow(172, 166, 172, 184, C.ink);
        // 残差：输入绕左侧直连到输出，在 ⊕ 处相加
        ctx.strokeStyle = C.green; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(116, 18); ctx.lineTo(26, 18); ctx.lineTo(26, 197); ctx.lineTo(108, 197); ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.strokeStyle = C.green; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(104, 197, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = C.green; ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⊕', 104, 197);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = C.green;
        ctx.beginPath(); ctx.moveTo(116, 197); ctx.lineTo(108, 193); ctx.lineTo(108, 201); ctx.closePath(); ctx.fill();
        drawSceneLabel(ctx, 30, 112, '残差', C.green);
      } else {
        box(72, 8, 140, 26, '输入 x', C.ink);
        box(72, 48, 140, 26, '1×1 卷积 / 拆分', C.ink);
        // a 分支：MambaPSA 是 Mamba；C2PSA 是自注意力
        box(22, 88, 106, 34, isMamba ? 'Mamba' : '自注意力', isMamba ? C.blue : C.red, true);
        // b 分支：恒等（直接连接）
        box(156, 88, 106, 34, '恒等', isMamba ? C.green : C.orange, true);
        box(82, 140, 120, 24, '拼接', C.ink);
        box(82, 178, 120, 24, '1×1 卷积', C.ink);
        box(82, 216, 120, 20, '输出', C.ink);
        arrow(142, 34, 142, 48, isMamba ? C.ink : C.orange);
        arrow(142, 74, 75, 88, isMamba ? C.blue : C.red);
        arrow(142, 74, 209, 88, isMamba ? C.green : C.orange);
        arrow(75, 122, 110, 140, C.ink);
        arrow(209, 122, 174, 140, C.ink);
        arrow(142, 164, 142, 178, C.ink);
        arrow(142, 202, 142, 216, C.ink);
        scanArrow(75, 92, 116, isMamba ? C.blue : C.red, isMamba ? 40 : 34, time);
        identityLine(209, 92, 116, isMamba ? C.green : C.orange);
      }
      ctx.restore();

      // BiViM：紫色框 = BiViM 块本体（双向扫描 + 相加 + 线性投影 + 残差）
      if (isBivim) {
        ctx.strokeStyle = C.purple; ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        rr(ctx, 14, 3, 318, 234, 8); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.purple;
        rr(ctx, 244, 6, 84, 22, 6); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('BiViM·P4', 286, 17);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        drawSceneLabel(ctx, 20, 224, '双向 Mamba：正反各扫一遍 · 两向相加', C.purple);
      }

      // ---------- 右：整网相对基线权衡条 ----------
      ctx.fillStyle = C.ink; ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.fillText('整网相对 YOLO26-Nano 基线', 348, 18);
      ctx.fillStyle = C.muted; ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText(meta.label, 348, 36);
      ctx.fillStyle = C.muted; ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillText('100%', 439, 48);

      const drawBar = (metric: 'params' | 'flops' | 'map', dev: number, y: number) => {
        const xc = 446;
        ctx.strokeStyle = C.line; ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(xc, y - 8); ctx.lineTo(xc, y + 8); ctx.stroke();
        ctx.setLineDash([]);
        const lowerBetter = metric !== 'map';
        const half = Math.max(3, Math.abs(dev) * 4);
        const xStart = dev < 0 ? xc - half : xc;
        const xEnd = dev < 0 ? xc : xc + half;
        const good = lowerBetter ? dev < 0 : dev > 0;
        const barColor = dev === 0 ? C.muted : good ? C.green : C.orange;
        ctx.fillStyle = barColor;
        rr(ctx, xStart, y - 5, Math.max(2, xEnd - xStart), 10, 5); ctx.fill();
        const suffix = metric === 'map' ? '' : '%';
        const txt = dev === 0 ? '基线' : (dev > 0 ? '+' : '−') + Math.abs(dev).toFixed(dev % 1 === 0 ? 0 : 1) + suffix;
        ctx.fillStyle = barColor;
        ctx.font = 'bold 11px "Segoe UI", sans-serif';
        const tw = ctx.measureText(txt).width;
        const lx = dev < 0 ? xStart - 6 - tw : xEnd + 6;
        ctx.fillText(txt, lx, y + 4);
      };

      ctx.fillStyle = C.ink; ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('参数', 348, 54);
      ctx.fillText('FLOPs', 348, 100);
      ctx.fillText('mAP50:95', 348, 146);
      drawBar('params', meta.params, 62);
      drawBar('flops', meta.flops, 108);
      drawBar('map', meta.map, 154);

      ctx.fillStyle = C.muted; ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillText(meta.abs, 348, 190);
    };
    const tick = (tt: number) => {
      render(stateRef.current, tt / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const setState = (v: Variant) => {
    stateRef.current.variant = v;
    setVariant(v);
    setFeedback(FEEDBACK[v]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button type="button" className={`chip ${variant === 'c2psa' ? 'selected' : ''}`} onClick={() => setState('c2psa')}>C2PSA</button>
        <button type="button" className={`chip ${variant === 'mambapsa' ? 'selected' : ''}`} onClick={() => setState('mambapsa')}>MambaPSA</button>
        <button type="button" className={`chip ${variant === 'bivim' ? 'selected' : ''}`} onClick={() => setState('bivim')}>BiViM·P4</button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
