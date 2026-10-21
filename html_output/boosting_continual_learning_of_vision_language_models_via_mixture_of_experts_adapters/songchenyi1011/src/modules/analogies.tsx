import React, { useEffect, useRef } from 'react';
import { C, clear, paper, swatch, well, brush, tube, card, arcLink, track, dot, label, polyline, Ctx } from './wcKit';
import type { WidgetProps } from './registry';

// ---------------------------------------------------------------------------
// 统一生活类比动画：水彩调色与上色。
// 每个场景只含一个移动主体、一个动作、一个可见目标；560x140，自动循环并在
// 离屏时暂停。画布内最多两个短标签。
// ---------------------------------------------------------------------------

const W = 560;
const H = 140;
const PERIOD = 3200; // ms

type DrawFn = (ctx: Ctx, t: number, W: number, H: number) => void;

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function makeAnalogy(name: string, draw: DrawFn): React.FC<WidgetProps> {
  const Comp: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
      const canvas = ref.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);

      let raf: number | null = null;
      let t0 = 0;
      const tick = (now: number) => {
        if (!t0) t0 = now;
        const raw = ((now - t0) % PERIOD) / PERIOD;
        const t = easeInOutQuad(Math.min(1, raw / 0.8));
        clear(ctx, W, H);
        draw(ctx, t, W, H);
        if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
        raf = requestAnimationFrame(tick);
      };
      const start = () => {
        if (raf === null) raf = requestAnimationFrame(tick);
      };
      const stop = () => {
        if (raf !== null) cancelAnimationFrame(raf);
        raf = null;
      };
      let io: IntersectionObserver | null = null;
      if (typeof IntersectionObserver !== 'undefined') {
        io = new IntersectionObserver(
          (es) => es.forEach((e) => (e.isIntersecting ? start() : stop())),
          { threshold: 0.05 }
        );
        io.observe(canvas);
      } else {
        start();
      }
      return () => {
        stop();
        if (io) io.disconnect();
      };
    }, []);
    return (
      <canvas
        id={`ana-${name}-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        aria-label="生活类比动画"
      />
    );
  };
  Comp.displayName = 'Ana' + name;
  return Comp;
}

// ---- 1. 同一支笔反复覆盖：新色盖掉旧色 -------------------------------------
const drawCover = (ctx: Ctx, t: number) => {
  paper(ctx, 30, 26, 470, 88);
  const old = [62, 178, 294];
  for (let i = 0; i < 3; i += 1) {
    const x = old[i];
    const gone = Math.max(0, Math.min(1, (t - i * 0.22) * 2.2));
    swatch(ctx, x, 48, 64, 44, C.green, 0.9 - gone * 0.85);
    if (gone > 0) {
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = C.red;
      ctx.globalAlpha = gone;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 0.5, 48.5, 63, 43);
      ctx.restore();
    }
  }
  // 新色拖尾
  const tip = 56 + t * 420;
  ctx.save();
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = C.blue;
  ctx.fillRect(52, 40, Math.max(0, tip - 52), 60);
  ctx.restore();
  brush(ctx, tip, 40, 0.62, 0.18);
  label(ctx, '旧任务', 34, 128, C.muted, 13);
};

// ---- 2. 画稿与色卡对接：图文匹配 -------------------------------------------
const drawMatch = (ctx: Ctx, t: number) => {
  paper(ctx, 30, 30, 130, 80);
  swatch(ctx, 46, 48, 40, 44, C.light, 1);
  swatch(ctx, 94, 48, 52, 20, C.blue, 1);
  swatch(ctx, 94, 72, 52, 20, C.orange, 1);
  const cards = [0, 1, 2];
  for (const i of cards) {
    const x = 300 + i * 78;
    const hit = i === 1;
    card(ctx, x, 48, 58, 46, hit && t > 0.55 ? C.green : C.border, 2);
    if (hit) {
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.65 * t;
      swatch(ctx, x + 8, 60, 42, 22, C.green, 1);
      ctx.restore();
    }
  }
  arcLink(ctx, 168, 70, 356, 62, C.blue, 2.5, [6, 5]);
  brush(ctx, 160 + t * 190, 62 - Math.sin(t * Math.PI) * 28, 0.5, 0.5);
  label(ctx, '画稿', 34, 128, C.muted, 13);
  label(ctx, '色卡', 302, 128, C.muted, 13);
};

// ---- 3. 贴上可揭下的色片：冻结主干 + 轻量适配 ------------------------------
const drawSheet = (ctx: Ctx, t: number) => {
  paper(ctx, 60, 26, 200, 88);
  swatch(ctx, 80, 46, 60, 48, C.light, 1);
  swatch(ctx, 150, 46, 90, 22, C.dark, 1);
  swatch(ctx, 150, 74, 90, 20, C.light, 1);
  const y = 26 + (1 - t) * 26;
  ctx.save();
  ctx.globalAlpha = 0.42;
  swatch(ctx, 70, y + 6, 180, 78, '#9fc8f2', 1);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.setLineDash([7, 5]);
  ctx.strokeStyle = t > 0.85 ? C.green : C.blue;
  ctx.lineWidth = 2;
  ctx.strokeRect(70.5, y + 6.5, 179, 77);
  ctx.restore();
  label(ctx, '原画', 64, 128, C.muted, 13);
  label(ctx, '色片', 300, 34, C.blue, 13);
  arcLink(ctx, 306, 42, 252, y + 40, C.blue, 2, [5, 4]);
};

// ---- 4. 按配方混合两管颜料 -------------------------------------------------
const drawMix = (ctx: Ctx, t: number) => {
  fillPalette(ctx, 30, 34, 190, 76);
  well(ctx, 74, 72, 20, C.blue, 1);
  well(ctx, 142, 72, 20, C.orange, 1);
  fillPalette(ctx, 330, 30, 200, 84);
  const mix = t < 0.5 ? C.border : C.purple;
  well(ctx, 430, 72, 26, mix, 1);
  const a = t * Math.PI * 3;
  brush(ctx, 108 + Math.cos(a) * 42, 62 + Math.sin(a) * 12, 0.5, 0.5);
  label(ctx, '颜料', 34, 128, C.muted, 13);
  label(ctx, '新色', 336, 128, C.muted, 13);
};

// ---- 5. 插入配方卡：任务专属路由器 -----------------------------------------
const drawRecipe = (ctx: Ctx, t: number) => {
  // 画架 + 卡槽
  fillBox(ctx, 60, 30, 150, 84);
  strokeSlot(ctx, 96, 52, 78, 44);
  const x = 200 - t * 96;
  card(ctx, x, 54, 70, 40, C.blue, 2);
  fillPalette(ctx, 300, 34, 210, 76);
  well(ctx, 342, 72, 18, t > 0.7 ? C.blue : C.border, 1);
  well(ctx, 392, 72, 18, t > 0.7 ? C.orange : C.border, 1);
  well(ctx, 452, 72, 18, C.border, 1);
  label(ctx, '配方卡', 62, 128, C.muted, 13);
  label(ctx, '颜料盒', 302, 128, C.muted, 13);
  arcLink(ctx, 262, 74, 320, 72, C.blue, 2, [5, 4]);
};

// ---- 6. 试色：判断是否属于本子里的色系 -------------------------------------
const drawSwatchTest = (ctx: Ctx, t: number) => {
  paper(ctx, 40, 44, 480, 52);
  swatch(ctx, 44, 48, 150, 44, 'rgba(196,63,82,0.18)', 1);
  swatch(ctx, 386, 48, 130, 44, 'rgba(34,141,92,0.18)', 1);
  const tip = 52 + t * 440;
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = tip > 386 ? C.green : C.red;
  ctx.fillRect(52, 54, Math.max(0, tip - 52), 32);
  ctx.restore();
  dot(ctx, 451, 118, 7, C.orange);
  brush(ctx, tip, 44, 0.5, 0.2);
  label(ctx, '试色纸', 44, 118, C.muted, 13);
};

// ---- 7. 给旧颜料罐封盖 -----------------------------------------------------
const drawSeal = (ctx: Ctx, t: number) => {
  for (let i = 0; i < 3; i += 1) {
    const x = 70 + i * 150;
    fillBox(ctx, x, 62, 62, 50);
    swatch(ctx, x + 10, 80, 42, 22, i === 0 ? C.green : i === 1 ? C.blue : C.orange, 0.9);
  }
  const lidY = 30 + t * 26;
  ctx.beginPath();
  ctx.arc(393, lidY, 17, 0, Math.PI * 2);
  ctx.fillStyle = C.paper;
  ctx.fill();
  ctx.strokeStyle = t > 0.85 ? C.purple : C.muted;
  ctx.lineWidth = 3;
  ctx.stroke();
  if (t > 0.85) {
    ctx.strokeStyle = C.purple;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(376, 82);
    ctx.lineTo(410, 82);
    ctx.stroke();
  }
  label(ctx, '旧色罐', 74, 126, C.muted, 13);
  label(ctx, '封盖', 350, 26, C.purple, 13);
};

// ---- 8. 把调色盘插件装进画架卡位 -------------------------------------------
const drawPlug = (ctx: Ctx, t: number) => {
  fillBox(ctx, 50, 30, 250, 84);
  strokeSlot(ctx, 76, 48, 198, 50);
  for (let i = 0; i < 8; i += 1) {
    const on = i === 2 || i === 5;
    well(ctx, 96 + i * 22, 73, 7, on && t > 0.6 ? C.green : C.border, 1);
  }
  const x = 330 - t * 120;
  fillPalette(ctx, x, 52, 104, 44);
  arcLink(ctx, x + 52, 74, 300, 74, C.blue, 2, [5, 4]);
  label(ctx, '卡位', 54, 126, C.muted, 13);
  label(ctx, '适配器', 336, 40, C.blue, 13);
};

// ---- 9. 只取两格颜料就调出目标色 -------------------------------------------
const drawFrugal = (ctx: Ctx, t: number) => {
  fillPalette(ctx, 30, 34, 150, 76);
  for (let i = 0; i < 6; i += 1) well(ctx, 58 + (i % 3) * 44, 58 + Math.floor(i / 3) * 34, 12, C.border, 1);
  fillPalette(ctx, 200, 34, 110, 76);
  well(ctx, 232, 72, 14, t > 0.4 ? C.blue : C.border, 1);
  well(ctx, 278, 72, 14, t > 0.4 ? C.orange : C.border, 1);
  paper(ctx, 350, 34, 180, 76);
  swatch(ctx, 372, 52, 60, 42, t > 0.8 ? C.green : C.border, 1);
  swatch(ctx, 444, 52, 60, 42, C.green, 0.35);
  brush(ctx, 250 + t * 150, 62, 0.46, 0.6);
  label(ctx, '全盒', 34, 126, C.muted, 13);
  label(ctx, '两格', 204, 126, C.muted, 13);
};

// ---- 10. 把完成的作品挂上墙 ------------------------------------------------
const drawHang = (ctx: Ctx, t: number) => {
  ctx.strokeStyle = C.route;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 44);
  ctx.lineTo(500, 44);
  ctx.stroke();
  // 已有旧作
  fillBox(ctx, 96, 52, 120, 68);
  swatch(ctx, 108, 66, 96, 40, C.light, 0.7);
  const y = 118 - t * 58;
  fillBox(ctx, 330, y, 130, 74);
  swatch(ctx, 342, y + 12, 106, 50, C.green, 0.9);
  arcLink(ctx, 395, y, 395, 44, C.blue, 2, [4, 4]);
  label(ctx, '旧作', 100, 130, C.muted, 13);
  label(ctx, '完成', 466, 100, C.green, 13);
};

function fillBox(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  paper(ctx, x, y, w, h);
}

function strokeSlot(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  ctx.save();
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

function fillPalette(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  swatch(ctx, x, y, w, h, '#fbfdf7', 1);
  ctx.strokeStyle = C.paperEdge;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

export const Analogy1 = makeAnalogy('cover', drawCover);
export const Analogy2 = makeAnalogy('match', drawMatch);
export const Analogy3 = makeAnalogy('sheet', drawSheet);
export const Analogy4 = makeAnalogy('mix', drawMix);
export const Analogy5 = makeAnalogy('recipe', drawRecipe);
export const Analogy6 = makeAnalogy('test', drawSwatchTest);
export const Analogy7 = makeAnalogy('seal', drawSeal);
export const Analogy8 = makeAnalogy('plug', drawPlug);
export const Analogy9 = makeAnalogy('frugal', drawFrugal);
export const Analogy10 = makeAnalogy('hang', drawHang);

export const analogyList: Array<[string, React.FC<WidgetProps>]> = [
  ['ana-1', Analogy1],
  ['ana-2', Analogy2],
  ['ana-3', Analogy3],
  ['ana-4', Analogy4],
  ['ana-5', Analogy5],
  ['ana-6', Analogy6],
  ['ana-7', Analogy7],
  ['ana-8', Analogy8],
  ['ana-9', Analogy9],
  ['ana-10', Analogy10],
];