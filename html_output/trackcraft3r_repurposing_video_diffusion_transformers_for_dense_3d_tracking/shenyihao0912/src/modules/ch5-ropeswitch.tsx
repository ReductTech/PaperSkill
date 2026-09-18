import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, lerpColor } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawTimeCard,
  drawSceneLabel,
  drawLegend,
  drawValueChip,
} from './dogKit';
import type { WidgetProps } from './registry';

// 时间地址标签（RoPE）（P4 chips）：toggle RoPE 对齐 on/off and pick the query r₀…r₃.
// Left 40%: the query latent card with its orange time tag (t_query when on, a red
// t₀ tag when off). Right 60%: attention bars over g₀…g₃ — sharply peaked at the
// time-aligned key when on, flat when off — plus the constant evidence strip
// 0.5609 (完整) vs 0.4450 (去RoPE).

const W = 1080;
const H = 280;
const SUB = ['₀', '₁', '₂', '₃'];

const FB_INIT = '选一个查询 rⱼ，再开关 RoPE 对比注意力分布。';
const FB_ON =
  '时间标签正确：rⱼ 主要注意到同时间的 gⱼ（论文测得约 29% 集中在时间对齐帧）。';
const FB_OFF =
  '没有时间标签，rⱼ 不知道要查哪一帧——消融中 AJ 从 0.5609 掉到 0.4450（最大单项降幅）。';

/** Renormalized attention sketch: peak 0.55 on the aligned key, 0.12/0.15 on the
 *  immediate neighbors, 0.09 elsewhere; flat 0.25×4 when RoPE is off. */
function targetBars(queryIdx: number, ropeOn: boolean): number[] {
  if (!ropeOn) return [0.25, 0.25, 0.25, 0.25];
  const v = [0.09, 0.09, 0.09, 0.09];
  v[queryIdx] = 0.55;
  if (queryIdx > 0) v[queryIdx - 1] = 0.12;
  if (queryIdx < 3) v[queryIdx + 1] = 0.15;
  const s = v[0] + v[1] + v[2] + v[3];
  return v.map((x) => x / s);
}

export const Ch5Ropeswitch: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ropeOn, setRopeOn] = useState(true);
  const [queryIdx, setQueryIdx] = useState(2);
  const [fb, setFb] = useState({ text: FB_INIT, cls: '' });
  const ropeRef = useRef(true);
  const queryRef = useRef(2);
  const barsRef = useRef<number[]>(targetBars(2, true));

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

    const render = () => {
      const rope = ropeRef.current;
      const q = queryRef.current;
      const target = targetBars(q, rope);
      const bars = barsRef.current;
      for (let i = 0; i < 4; i++) bars[i] += (target[i] - bars[i]) * 0.16; // ease bars

      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });

      // ---- left 40%: query latent card + time tag ----
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(58, 78, 116, 64, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.green;
      ctx.font = '600 22px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`r${SUB[q]}`, 116, 110);

      if (rope) {
        drawTimeCard(ctx, 116, 182, `t${SUB[q]}`);
      } else {
        ctx.fillStyle = C.red;
        ctx.beginPath();
        ctx.roundRect(90, 170, 52, 24, 6);
        ctx.fill();
        ctx.fillStyle = C.white;
        ctx.font = '13px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('t₀', 116, 182);
      }
      drawSceneLabel(ctx, '时间标签', 116, 214, { align: 'center', color: C.muted });

      // ---- right 60%: attention bars over g₀…g₃ ----
      const baseY = 196;
      const maxH = 122;
      for (let i = 0; i < 4; i++) {
        const cx = 512 + i * 132;
        const bh = Math.max(bars[i] * maxH, 3);
        ctx.fillStyle = rope
          ? i === q
            ? C.green
            : C.blue
          : lerpColor(C.muted, C.red, 0.35);
        ctx.beginPath();
        ctx.roundRect(cx - 32, baseY - bh, 64, bh, 3);
        ctx.fill();
        drawSceneLabel(ctx, `g${SUB[i]}`, cx, baseY + 18, { align: 'center', color: C.muted });
      }
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(452, baseY);
      ctx.lineTo(1020, baseY);
      ctx.stroke();

      // evidence strip: the paper's measured consequence (constant)
      drawSceneLabel(ctx, '完整', 640, 250, { align: 'right', color: C.muted });
      drawValueChip(ctx, 668, 250, '0.5609', C.green);
      drawSceneLabel(ctx, '去RoPE', 774, 250, { align: 'right', color: C.muted });
      drawValueChip(ctx, 812, 250, '0.4450', C.red);

      drawLegend(
        ctx,
        [
          ['对齐键', C.green],
          ['其他键', C.blue],
        ],
        452,
        36
      );
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pickRope = (on: boolean) => {
    ropeRef.current = on;
    setRopeOn(on);
    setFb(on ? { text: FB_ON, cls: 'good' } : { text: FB_OFF, cls: 'bad' });
  };

  const pickQuery = (i: number) => {
    queryRef.current = i;
    setQueryIdx(i);
    setFb(ropeRef.current ? { text: FB_ON, cls: 'good' } : { text: FB_OFF, cls: 'bad' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>RoPE 对齐</label>
        <button className={`chip ${ropeOn ? 'selected' : ''}`} onClick={() => pickRope(true)}>
          开
        </button>
        <button className={`chip ${!ropeOn ? 'selected' : ''}`} onClick={() => pickRope(false)}>
          关
        </button>
        <label>查询</label>
        {[0, 1, 2, 3].map((i) => (
          <button
            key={i}
            className={`chip ${queryIdx === i ? 'selected' : ''}`}
            onClick={() => pickQuery(i)}
          >
            {`r${SUB[i]}`}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch5Ropeswitch;
