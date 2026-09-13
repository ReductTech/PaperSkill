import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 统一生活主题：画室·作画（起稿／放大／描线／上色／收笔）。
// 只有真正承载信息的章节才配自动循环动画（当前：第 7、8、10 章）。
// 其余章节的类比只保留标题与文字，不渲染画布——避免用无信息的动效占版面。
// 每章一个自动循环动画：一个主体、一个动作、一个目标；不出现流水线/传送带。
// 语义配色见 contract.md §5。

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', route: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', line: '#d7deea',
};
const W = 560, H = 140;

// 按章节画一帧；t 为 0..1 的循环进度
function scene(ctx: CanvasRenderingContext2D, chap: number, t: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  // 画板
  ctx.fillStyle = C.light; ctx.fillRect(40, 20, 480, 100);
  ctx.strokeStyle = C.route; ctx.lineWidth = 3; ctx.strokeRect(40, 20, 480, 100);
  switch (chap) {
    case 7: { // 橡皮扫过：只带走浮在表层的细铅痕，底稿轮廓留下
      const wave = (px: number) => 72 + Math.sin(((px - 60) / 420) * Math.PI * 3) * 18;
      // 底稿轮廓（低频结构）：静态，全程不动
      ctx.strokeStyle = C.dark; ctx.lineWidth = 4; ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const px = 60 + (i / 40) * 420;
        const py = wave(px);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
      // 细铅痕（高频细节）：沿轮廓排布的短划；橡皮扫过的那一段不再绘制
      const ex = 68 + t * 404;                     // 橡皮位置（唯一移动主体）
      ctx.strokeStyle = C.purple; ctx.lineWidth = 1.4;
      for (let i = 0; i <= 30; i++) {
        const px = 60 + (i / 30) * 420;
        if (px < ex) continue;                     // 已扫过 → 被擦掉了
        const py = wave(px);
        ctx.beginPath(); ctx.moveTo(px, py - 9); ctx.lineTo(px, py + 9); ctx.stroke();
      }
      // 橡皮：沿着同一条线从左扫到右
      const ey = wave(ex);
      ctx.fillStyle = C.green; ctx.fillRect(ex - 11, ey - 9, 22, 18);
      ctx.strokeStyle = C.route; ctx.lineWidth = 2; ctx.strokeRect(ex - 11, ey - 9, 22, 18);
      break;
    }
    case 8: { // 最后一笔收尾：底稿已画好但发虚，一遍定稿线压上去，画面立刻清楚
      const P = [[90, 96], [170, 50], [250, 92], [330, 48], [430, 94]];
      const segs = P.length - 1;
      // 底稿：结构已经对了，但线是发虚的（一遍宽而淡的痕迹），全程静态
      ctx.strokeStyle = C.dark; ctx.lineWidth = 11;
      ctx.globalAlpha = 0.22; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]);
      for (let i = 1; i < P.length; i++) ctx.lineTo(P[i][0], P[i][1]);
      ctx.stroke();
      ctx.globalAlpha = 1;
      // 最后一笔：沿同一条底稿一次走完，走过的地方立刻清晰
      const prog = t * segs;
      const done = Math.min(Math.floor(prog), segs);
      const frac = prog - done;
      ctx.strokeStyle = C.green; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]);
      for (let i = 1; i <= done; i++) ctx.lineTo(P[i][0], P[i][1]);
      let tip = P[done];
      if (done < segs) {
        const a = P[done], b = P[done + 1];
        tip = [a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac];
        ctx.lineTo(tip[0], tip[1]);
      }
      ctx.stroke();
      // 笔尖（唯一移动主体）
      ctx.fillStyle = C.orange;
      ctx.beginPath(); ctx.arc(tip[0], tip[1], 6, 0, Math.PI * 2); ctx.fill();
      break;
    }
    default: { // 10：几支笔比速度
      ctx.fillStyle = C.red; ctx.fillRect(70, 45, 380 * t, 12);
      ctx.fillStyle = C.orange; ctx.fillRect(70, 70, 380 * t * 0.6, 12);
      ctx.fillStyle = C.green; ctx.fillRect(70, 95, 380 * t * 0.25, 12);
      break;
    }
  }
}

export const SketchAnalogy: React.FC<WidgetProps> = ({ chapterId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const chapRef = useRef(1);
  const tRef = useRef(0);
  useEffect(() => {
    const m = /chap-(\d+)/.exec(chapterId || '');
    chapRef.current = m ? Number(m[1]) : 1;
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let raf = 0;
    const tick = () => {
      tRef.current = (tRef.current + 0.006) % 1;
      scene(ctx, chapRef.current, tRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const off = observeCanvas(canvas, start, stop);
    return () => { stop(); off(); };
  }, [chapterId]);
  return <canvas id={`ana-${chapterId}`} ref={ref} width={W} height={H} />;
};

export default SketchAnalogy;
