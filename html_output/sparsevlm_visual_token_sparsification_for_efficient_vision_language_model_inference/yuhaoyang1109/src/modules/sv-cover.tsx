import React, { useRef, useState } from 'react';
import { StageCanvas } from '../live/TimeBar';
import { useStage, txt, rr, type Frame } from '../live/stage';
import { C } from './sv-kit';
import { drawTower } from './sv-draw';
import { NONVIS_FIT, N_LAYERS, SCHEDULE, layerFlops, scheduleSteps } from './sv-data';
import type { WidgetProps } from './registry';

// 封面：原模型 / SparseVLM（192 档）两座 32 层 token 塔画在同一张画布里，共用一个时钟。
// 进入视口后（确认连续两帧间隔 < 100ms，才算真的在播放）从第 0 层算到第 31 层，约 6 秒，播完停在结果；
// 只给一帧的环境、减少动态效果：直接画结果。不在 rAF 里 setState，只在开始 / 结束时更新一次。

const COVER_S = 6;
const FULL = scheduleSteps([576, 576, 576]);
const SPARSE = scheduleSteps(SCHEDULE[192]);

function cumFlops(steps: typeof FULL, upto: number) {
  let s = 0;
  for (let l = 0; l < N_LAYERS; l++) {
    const k = Math.max(0, Math.min(1, upto - l));
    s += k * layerFlops(steps[l].enter + NONVIS_FIT);
  }
  return s;
}
const TOTAL_FULL = cumFlops(FULL, N_LAYERS);

export function SvCover(_: WidgetProps) {
  const st = useRef({ p: 1, pending: true, playing: false });
  const [playing, setPlaying] = useState(false);
  const [run, setRun] = useState(0);

  const draw = (f: Frame) => {
    const s = st.current;
    let more = false;
    if (!f.final) {
      if (s.pending) {
        if (f.dt > 0 && f.dt < 0.1) {
          s.pending = false;
          s.p = 0;
          s.playing = true;
          setPlaying(true);
        }
        more = true;
      } else if (s.playing) {
        s.p = Math.min(1, s.p + f.dt / COVER_S);
        if (s.p >= 1) {
          s.playing = false;
          setPlaying(false);
        } else more = true;
      }
    }
    const p = f.final && s.pending ? 1 : s.p;
    paint(f, p);
    return more;
  };
  const stage = useStage({ heightOf: (w) => (w >= 560 ? 330 : 600), draw, live: playing }, [run]);

  const replay = () => {
    st.current = { p: 0, pending: false, playing: true };
    setPlaying(true);
    setRun((n) => n + 1);
  };

  return (
    <div className="sv-live sv-mod">
      <StageCanvas s={stage} label="封面动画：原模型 32 层都处理 576 个视觉 token；SparseVLM 在第 2、6、15 层后逐级减少到 309、204、113 个，累计计算量约为原模型的 46%（按代码计数式外推）" />
      <p className="lv-note">
        教学示意：两座塔共用一个时钟，从第 0 层算到第 31 层；横条长度 ∝ 进入该层计算的 token 数（蓝 = 视觉 token，青 = 回收合并的 token，浅紫 = 图像之外的约 118 个 token）。累计计算量按代码计数式外推。
        {!playing && !stage.reduced ? (
          <button type="button" className="hero-replay" onClick={replay}>
            重播
          </button>
        ) : null}
      </p>
    </div>
  );
}

function paint(f: Frame, p: number) {
  const { ctx, w, h } = f;
  const wide = w >= 560;
  const upto = p * N_LAYERS;
  const pad = 14;
  const panels = wide
    ? [
        { x: pad, y: 0, w: w / 2 - pad * 1.5, h },
        { x: w / 2 + pad / 2, y: 0, w: w / 2 - pad * 1.5, h },
      ]
    : [
        { x: pad, y: 0, w: w - pad * 2, h: h / 2 },
        { x: pad, y: h / 2, w: w - pad * 2, h: h / 2 },
      ];
  const sides = [
    { steps: FULL, title: '原模型：32 层 × 576 个视觉 token', color: C.red },
    { steps: SPARSE, title: 'SparseVLM 192 档：576 → 309 → 204 → 113', color: C.green },
  ];
  sides.forEach((side, i) => {
    const b = panels[i];
    txt(ctx, side.title, b.x, b.y + 18, { size: 13, weight: 800, color: side.color });
    const towerTop = b.y + 34;
    const towerH = b.h - 34 - 50;
    drawTower(ctx, b.x, towerTop, b.w, towerH, side.steps, { upto, labels: true, nonVis: NONVIS_FIT, pruneLayers: i === 1 ? [2, 6, 15] : [] });
    // 累计计算量条
    const cy = towerTop + towerH + 14;
    const frac = cumFlops(side.steps, upto) / TOTAL_FULL;
    ctx.fillStyle = C.stageLine;
    rr(ctx, b.x + 30, cy, b.w - 30, 10, 5);
    ctx.fill();
    ctx.fillStyle = side.color;
    rr(ctx, b.x + 30, cy, (b.w - 30) * frac, 10, 5);
    ctx.fill();
    const done = p >= 0.999;
    txt(ctx, done ? `累计计算量：约 ${Math.round(frac * 100)}%（以原模型为 100%）` : '累计计算量', b.x + 30, cy + 24, { size: 12, color: C.muted });
  });
}
