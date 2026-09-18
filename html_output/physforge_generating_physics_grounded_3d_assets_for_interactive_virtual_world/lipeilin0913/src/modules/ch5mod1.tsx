import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, lerpColor, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §5 Module 5.1 (P4 mode chips, hybrid): mask granularity controls part decomposition.
const W = 1080;
const H = 280;

type Mode = 'none' | 'coarse' | 'fine';

// part layouts per mode: [x,y,w,h] relative to cabinet origin (cabin at 150,60, size 260x160)
// regions tile without overlap; every mode ends with its readable rail/panel parts
const LAYOUTS: Record<Mode, number[][]> = {
  none: [
    [26, 0, 234, 70], // 上门板
    [26, 74, 234, 86], // 下门板
    [0, 0, 24, 160], // 侧板
  ],
  coarse: [
    [26, 0, 114, 70],
    [142, 0, 118, 70],
    [26, 74, 114, 86],
    [142, 74, 118, 86],
    [0, 0, 24, 160],
  ],
  fine: [
    [26, 0, 76, 64],
    [104, 0, 76, 64],
    [182, 0, 78, 64],
    [26, 66, 234, 12], // 中横档
    [26, 80, 76, 80],
    [104, 80, 76, 80],
    [182, 80, 78, 80],
    [0, 0, 24, 160],
  ],
};

const METRIC: Record<Mode, { label: string; value: number | null }> = {
  none: { label: '无掩码 Voxel recall', value: 73.63 },
  coarse: { label: '粗粒度演示（无对应协议值）', value: null },
  fine: { label: '完整模型 Voxel recall', value: 77.16 },
};

interface Part {
  x: number;
  y: number;
  w: number;
  h: number;
  c: string;
}

// clearly distinguishable warm wood tones so each part reads as its own piece
const PART_PALETTE = [
  '#8a5426',
  '#b06a33',
  '#7c4a1e',
  '#c07f3e',
  '#96602f',
  '#ad7440',
  '#855323',
  '#b98a52',
];
const partColor = (i: number) => PART_PALETTE[i % PART_PALETTE.length];
const partsOf = (m: Mode): Part[] =>
  LAYOUTS[m].map((p, i) => ({ x: 150 + p[0], y: 60 + p[1], w: p[2], h: p[3], c: partColor(i) }));

const overlapArea = (a: Part, b: Part) => {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
};
const centerDist2 = (a: Part, b: Part) => {
  const dx = a.x + a.w / 2 - (b.x + b.w / 2);
  const dy = a.y + a.h / 2 - (b.y + b.h / 2);
  return dx * dx + dy * dy;
};
// a part's "parent" piece in another layout: max overlap, fallback nearest center
const bestMatch = (t: Part, cands: Part[]): Part => {
  let best = cands[0];
  let bestOv = 0;
  cands.forEach((f) => {
    const ov = overlapArea(t, f);
    if (ov > bestOv) {
      bestOv = ov;
      best = f;
    }
  });
  if (bestOv > 0) return best;
  let bd = Infinity;
  cands.forEach((f) => {
    const dd = centerDist2(t, f);
    if (dd < bd) {
      bd = dd;
      best = f;
    }
  });
  return best;
};

const DUR = 520; // layout morph duration (ms)

export const Ch5Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ mode: Mode }>({ mode: 'none' });
  const animRef = useRef<{ t0: number; from: Part[]; barFrom: number | null; barTo: number | null } | null>(
    null
  );
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>('none');
  const [feedback, setFeedback] = useState({ text: '没有模板也能分出合理零件：73.63（越高越好）。', cls: '' });

  // parts as they should appear at `time`: target layout morphed from the transition snapshot
  const displayedParts = (time: number): Part[] => {
    const targets = partsOf(stateRef.current.mode);
    const anim = animRef.current;
    if (!anim) return targets;
    const e = easeInOutQuad(clamp((time - anim.t0) / DUR, 0, 1));
    return targets.map((tp) => {
      const src = bestMatch(tp, anim.from);
      return {
        x: lerp(src.x, tp.x, e),
        y: lerp(src.y, tp.y, e),
        w: lerp(src.w, tp.w, e),
        h: lerp(src.h, tp.h, e),
        c: lerpColor(src.c, tp.c, e),
      };
    });
  };

  // metric bar value at `time` (null when the dash is shown)
  const barValueAt = (time: number): number | null => {
    const to = METRIC[stateRef.current.mode].value;
    const anim = animRef.current;
    if (!anim) return to;
    const e = easeInOutQuad(clamp((time - anim.t0) / DUR, 0, 1));
    if (anim.barFrom !== null && anim.barTo !== null) return lerp(anim.barFrom, anim.barTo, e);
    return anim.barTo; // fading to/from the dash: keep the numeric side's value
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (time: number) => {
      const m = stateRef.current.mode;
      const anim = animRef.current;
      let e = 1;
      if (anim) {
        e = clamp((time - anim.t0) / DUR, 0, 1);
        if (e >= 1) animRef.current = null;
      }
      const ee = easeInOutQuad(e);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, 248, W, 6);

      // chart title + series label (metric name matches the §5 text: Voxel recall)
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText('零件划分得分：Voxel recall（PartObjaverse-Tiny，越高越好）', 150, 34);
      ctx.fillStyle = '#228d5c';
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillText('PhysForge', 690, 16);

      // cabinet parts morph: each target piece grows out of its matched parent
      const targets = partsOf(m);
      let shown: Part[];
      const matched = new Set<Part>();
      if (anim) {
        shown = targets.map((tp) => {
          const src = bestMatch(tp, anim.from);
          matched.add(src);
          return {
            x: lerp(src.x, tp.x, ee),
            y: lerp(src.y, tp.y, ee),
            w: lerp(src.w, tp.w, ee),
            h: lerp(src.h, tp.h, ee),
            c: lerpColor(src.c, tp.c, ee),
          };
        });
      } else {
        shown = targets;
      }
      shown.forEach((p, i) => {
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeStyle = '#3d2812';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(p.x, p.y, p.w, p.h);
        // numbered badge so the part count is verifiable at a glance
        ctx.beginPath();
        ctx.arc(p.x + p.w / 2, p.y + p.h / 2, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.fill();
        ctx.strokeStyle = '#3d2812';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#21324a';
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), p.x + p.w / 2, p.y + p.h / 2 + 0.5);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      });
      // running part count under the cabinet
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillText(`当前划分：${targets.length} 个零件`, 150, 240);
      // pieces absorbed by a merge glide into their new parent while fading out
      if (anim) {
        anim.from.forEach((src) => {
          if (matched.has(src)) return;
          const tgt = bestMatch(src, targets);
          ctx.save();
          ctx.globalAlpha = 1 - ee;
          ctx.fillStyle = src.c;
          ctx.fillRect(lerp(src.x, tgt.x, ee), lerp(src.y, tgt.y, ee), lerp(src.w, tgt.w, ee), lerp(src.h, tgt.h, ee));
          ctx.strokeStyle = '#27446e';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(lerp(src.x, tgt.x, ee), lerp(src.y, tgt.y, ee), lerp(src.w, tgt.w, ee), lerp(src.h, tgt.h, ee));
          ctx.restore();
        });
      }

      // metric bar on the right (value glides between modes instead of popping)
      const info = METRIC[m];
      let vShow: number | null = info.value;
      let barAlpha = 1;
      let dashAlpha = info.value === null ? 1 : 0;
      if (anim) {
        const bf = anim.barFrom;
        const bt = anim.barTo;
        if (bf !== null && bt !== null) {
          vShow = lerp(bf, bt, ee);
          barAlpha = 1;
          dashAlpha = 0;
        } else if (bt === null && bf !== null) {
          vShow = bf;
          barAlpha = 1 - ee;
          dashAlpha = ee;
        } else if (bf === null && bt !== null) {
          vShow = bt;
          barAlpha = ee;
          dashAlpha = 1 - ee;
        }
      }
      ctx.fillStyle = '#d7deea';
      ctx.fillRect(700, 60, 60, 160);
      if (vShow !== null && barAlpha > 0) {
        const barColor = (anim ? anim.barTo ?? anim.barFrom ?? 0 : info.value ?? 0) >= 77 ? '#228d5c' : '#27446e';
        const h = (vShow / 100) * 160;
        ctx.save();
        ctx.globalAlpha = barAlpha;
        ctx.fillStyle = barColor;
        ctx.fillRect(700, 220 - h, 60, h);
        ctx.fillStyle = '#21324a';
        ctx.font = '22px "Segoe UI", sans-serif';
        ctx.fillText(vShow.toFixed(2), 696, 48);
        ctx.restore();
      }
      if (dashAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = dashAlpha;
        ctx.fillStyle = '#68778f';
        ctx.font = '18px "Segoe UI", sans-serif';
        ctx.fillText('—', 716, 140);
        ctx.restore();
      }
      // reference line: OmniPart 73.79
      ctx.strokeStyle = '#c43f52';
      ctx.setLineDash([5, 4]);
      const ry = 220 - (73.79 / 100) * 160;
      ctx.beginPath();
      ctx.moveTo(690, ry);
      ctx.lineTo(770, ry);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#68778f';
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillText('OmniPart 73.79', 780, ry + 4);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (time: number) => {
      render(time);
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

  const select = (m: Mode) => {
    if (m === stateRef.current.mode) return;
    const now = performance.now();
    // snapshot the currently displayed geometry so the new morph starts
    // from what is on screen — no jump even when clicking mid-transition
    animRef.current = {
      t0: now,
      from: displayedParts(now),
      barFrom: barValueAt(now),
      barTo: METRIC[m].value,
    };
    stateRef.current.mode = m;
    setMode(m);
    if (m === 'none') setFeedback({ text: '没有模板也能分出合理零件：73.63（越高越好）。', cls: '' });
    else if (m === 'coarse') setFeedback({ text: '粗模板给出粒度提示，划分更贴合人的意图（演示粒度）。', cls: '' });
    else setFeedback({ text: '完整模型达到 77.16，越过 OmniPart 的 73.79 参考线。', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row" role="group" aria-label="掩码粒度">
        {(
          [
            ['none', '无掩码'],
            ['coarse', '粗粒度掩码'],
            ['fine', '细粒度掩码'],
          ] as const
        ).map(([key, label]) => (
          <button key={key} className={`chip ${mode === key ? 'selected' : ''}`} onClick={() => select(key)}>
            {label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch5Mod1;
