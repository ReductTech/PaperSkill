import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C,
  clearScene,
  drawBag,
  drawBin,
  drawCaseBox,
  drawClip,
  drawIndexCard,
  drawLabel,
  drawLegend,
  drawLoupe,
  drawNib,
  drawPin,
  drawStamp,
  drawTag,
  drawThread,
  drawVase,
  roundRect,
  withAlpha,
  type Ctx,
} from './scene';

const W = 560;
const H = 140;

function useScene(draw: (ctx: Ctx, t: number) => void, duration = 3.2) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: Ctx;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;
    const tick = (now: number) => {
      const t = ((now / (duration * 1000)) % 1 + 1) % 1;
      draw(ctx, t);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ref;
}

function Scene({ draw, duration }: { draw: (ctx: Ctx, t: number) => void; duration?: number }) {
  const ref = useScene(draw, duration);
  return <canvas ref={ref} width={W} height={H} aria-label="侦探查案类比动画" />;
}

/* 1. 只写着"一只瓷瓶"的证物袋，被推进同类格口，卡在口沿 */
const a1 = (ctx: Ctx, t: number) => {
  clearScene(ctx, W, H);
  const binX = 380;
  drawBin(ctx, binX, 58, 120, 56);
  drawLabel(ctx, binX + 60, 46, '瓷瓶', C.muted, 13, 'center');
  let x = 60;
  if (t < 0.55) x = 60 + (t / 0.55) * 260;
  else if (t < 0.72) x = 320 + ((t - 0.55) / 0.17) * 14;
  else x = 334 - Math.sin(((t - 0.72) / 0.28) * Math.PI) * 16;
  drawBag(ctx, x, 60, 62, 50, C.envLight);
  drawVase(ctx, x + 31, 88, 0.7, withAlpha(C.envLight, 0.9));
  if (t > 0.55) {
    ctx.save();
    ctx.strokeStyle = withAlpha(C.red, 0.55);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(binX, 58);
    ctx.lineTo(binX + 18, 50);
    ctx.stroke();
    ctx.restore();
  }
};

/* 2. 放大镜扫过证物卡，只照见一行泛泛的字 */
const a2 = (ctx: Ctx, t: number) => {
  clearScene(ctx, W, H);
  drawIndexCard(ctx, 160, 34, 240, 74, { lines: 3 });
  drawLabel(ctx, 176, 52, '证物 07', C.muted, 11);
  const p = easeInOutQuad(clamp(t * 1.25, 0, 1));
  const x = 176 + p * 150;
  drawLoupe(ctx, x, 70, 24, 0.55);
};

/* 3. 两枚标签分别落到两只一模一样的瓶上（左：形容词，右：底款） */
const a3 = (ctx: Ctx, t: number) => {
  clearScene(ctx, W, H);
  const fall = easeOutCubic(clamp(t / 0.55, 0, 1));
  const y = 18 + fall * 42;
  ctx.save();
  ctx.strokeStyle = withAlpha(C.border, 0.9);
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(280, 16);
  ctx.lineTo(280, 122);
  ctx.stroke();
  ctx.restore();
  drawVase(ctx, 120, 92, 1.15, C.envLight);
  drawVase(ctx, 420, 92, 1.15, C.envLight);
  drawTag(ctx, 88, y, 68, 22, '白底花纹', C.red);
  drawTag(ctx, 386, y, 68, 22, '底款六年', C.green);
};

/* 4. 一根红线把证物卡和线索卡系在一起，末端打结 */
const a4 = (ctx: Ctx, t: number) => {
  clearScene(ctx, W, H);
  drawIndexCard(ctx, 60, 30, 140, 66, { lines: 2 });
  drawIndexCard(ctx, 360, 30, 140, 66, { lines: 2 });
  drawLabel(ctx, 74, 50, '这件器物', C.ink, 12);
  drawLabel(ctx, 374, 50, '乾隆六年', C.ink, 12);
  drawThread(ctx, 200, 62, 360, 62, clamp(t / 0.65, 0, 1));
};

/* 5. 三枚图钉依次钉到线索板上 */
const a5 = (ctx: Ctx, t: number) => {
  clearScene(ctx, W, H);
  ctx.save();
  ctx.fillStyle = withAlpha(C.envLight, 0.3);
  roundRect(ctx, 60, 34, 300, 74, 6);
  ctx.fill();
  ctx.strokeStyle = withAlpha(C.envDark, 0.6);
  ctx.lineWidth = 1.2;
  roundRect(ctx, 60, 34, 300, 74, 6);
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 3; i++) {
    const start = i * 0.22;
    const p = clamp((t - start) / 0.24, 0, 1);
    if (p <= 0) continue;
    const tx = 130 + i * 80;
    const fromX = 470 + i * 24;
    const x = fromX + (tx - fromX) * easeOutCubic(p);
    const y = 20 - i * 3 + (66 - (20 - i * 3)) * easeOutCubic(p);
    drawPin(ctx, x, y, p >= 1 ? C.green : C.blue);
  }
};

/* 6. 笔尖在勘验笔录的横线上写下一行 */
const a6 = (ctx: Ctx, t: number) => {
  clearScene(ctx, W, H);
  drawIndexCard(ctx, 60, 28, 300, 88, { lines: 4 });
  drawLabel(ctx, 74, 42, '勘验笔录', C.muted, 11);
  const p = clamp(t / 0.75, 0, 1);
  const x = 76 + p * 170;
  ctx.save();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(76, 66);
  ctx.lineTo(x, 66);
  ctx.stroke();
  ctx.restore();
  drawNib(ctx, x + 4, 66, -0.15);
};

/* 7. 印章压到卷宗最后一页 */
const a7 = (ctx: Ctx, t: number) => {
  clearScene(ctx, W, H);
  drawIndexCard(ctx, 110, 40, 250, 74, { lines: 3 });
  drawLabel(ctx, 124, 54, '鉴定结论', C.muted, 11);
  const down = easeOutCubic(clamp(t / 0.5, 0, 1));
  const y = -6 + down * 66;
  const press = t > 0.5 && t < 0.7 ? 1.06 : 1;
  drawStamp(ctx, 236, y, press);
  if (t > 0.55) {
    ctx.save();
    ctx.strokeStyle = withAlpha(C.route, 0.65);
    ctx.lineWidth = 2;
    roundRect(ctx, 212, 62, 48, 26, 3);
    ctx.stroke();
    ctx.restore();
  }
};

/* 8. 一张旧线索卡从档案盒里被抽出 */
const a8 = (ctx: Ctx, t: number) => {
  clearScene(ctx, W, H);
  drawCaseBox(ctx, 220, 56, 150, 58);
  const p = easeOutCubic(clamp(t / 0.6, 0, 1));
  const cy = 62 - p * 46;
  drawIndexCard(ctx, 250, cy, 62, 40, { lines: 2, alpha: 1 - p * 0.75, border: p > 0.5 ? C.red : C.border });
};

/* 9. 一枚回形针别到报告边上，标出"停"的位置 */
const a9 = (ctx: Ctx, t: number) => {
  clearScene(ctx, W, H);
  drawIndexCard(ctx, 120, 30, 280, 82, { lines: 3 });
  drawLabel(ctx, 136, 44, '鉴定报告', C.muted, 11);
  const p = easeOutCubic(clamp(t / 0.65, 0, 1));
  const x = 450 - p * 170;
  drawClip(ctx, x, 36, C.orange);
};

/* 10. 两叠案卷沿桌面滑向"结案"标记 */
const a10 = (ctx: Ctx, t: number) => {
  clearScene(ctx, W, H);
  const p = easeInOutQuad(clamp(t / 0.7, 0, 1));
  const fast = 60 + p * 390;
  const slow = 60 + easeOutCubic(clamp((t - 0.12) / 0.7, 0, 1)) * 320;
  ctx.save();
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(480, 26);
  ctx.lineTo(480, 106);
  ctx.stroke();
  ctx.restore();
  drawLabel(ctx, 480, 18, '结案', C.green, 12, 'center');
  drawCaseBox(ctx, slow, 66, 52, 36, withAlpha(C.envDark, 0.7));
  drawCaseBox(ctx, fast, 66, 52, 36, C.envDark);
};

/* ---------- exported analogy components ---------- */

export const Ana1: React.FC<WidgetProps> = () => <Scene draw={a1} />;
export const Ana2: React.FC<WidgetProps> = () => <Scene draw={a2} />;
export const Ana3: React.FC<WidgetProps> = () => <Scene draw={a3} />;
export const Ana4: React.FC<WidgetProps> = () => <Scene draw={a4} />;
export const Ana5: React.FC<WidgetProps> = () => <Scene draw={a5} />;
export const Ana6: React.FC<WidgetProps> = () => <Scene draw={a6} />;
export const Ana7: React.FC<WidgetProps> = () => <Scene draw={a7} />;
export const Ana8: React.FC<WidgetProps> = () => <Scene draw={a8} />;
export const Ana9: React.FC<WidgetProps> = () => <Scene draw={a9} />;
export const Ana10: React.FC<WidgetProps> = () => <Scene draw={a10} />;
