import React, { useState } from 'react';
import { StageCanvas, TimeBar } from '../live/TimeBar';
import { useTimeline } from '../live/timeline';
import { clamp, easeInOut, lerp, rgba, rr, txt, useStage, markDirectInput, type Frame } from '../live/stage';
import { C, Feedback, Range, Readout, Seg, SpeedSeg, Tag, type Speed } from './sv-kit';
import { N_LAYERS, NONVIS_FIT, layerFlops } from './sv-data';
import type { WidgetProps } from './registry';

// 1.1 视觉 token 的账单：切块 → 排进输入序列 → 32 层逐层计费。
// 画面、读数与反馈都由同一个时间轴进度 p 和同一组参数驱动。

const PHASES = [
  { at: 0, label: '① 切块' },
  { at: 0.28, label: '② 排进序列' },
  { at: 0.52, label: '③ 逐层计费' },
];
const SPEED_K: Record<Speed, number> = { slow: 0.6, mid: 1, fast: 1.7 };
const SYS = 35; // LLaVA-1.5 图像之前的系统提示与“USER:”（代码注释 v_token_start = 35）

export function SvBill(_: WidgetProps) {
  const [res, setRes] = useState<'336' | '672'>('336');
  const [nonVis, setNonVis] = useState(NONVIS_FIT);
  const [speed, setSpeed] = useState<Speed>('mid');
  const tl = useTimeline(9, SPEED_K[speed]);
  const side = res === '336' ? 24 : 48;
  const nv = side * side;
  const n = nv + nonVis;
  const inputShare = nv / n;
  const saveShare = 1 - layerFlops(nonVis) / layerFlops(n);
  const tflops = (N_LAYERS * layerFlops(n)) / 1e12;

  const draw = (f: Frame) => {
    const more = tl.tick(f.dt);
    paint(f, tl.pRef.current, side, nonVis);
    return more;
  };
  const stage = useStage({ heightOf: (w) => (w >= 620 ? 320 : 380), draw, live: tl.playing }, [side, nonVis, tl.playing ? -1 : tl.p, tl.playing]);
  // 首次进入视口自动播放一次
  React.useEffect(() => {
    if (stage.animate) tl.onVisible(true);
  }, [stage.animate]); // eslint-disable-line react-hooks/exhaustive-deps

  const layer = Math.min(N_LAYERS, Math.max(0, Math.floor(((tl.p - 0.52) / 0.48) * N_LAYERS + 0.0001)));
  const phase = tl.p < 0.28 ? 0 : tl.p < 0.52 ? 1 : 2;
  const fb =
    phase === 0
      ? `${res}×${res} 的图按 14×14 像素一块切成 ${side}×${side} = ${nv} 块，每块变成一个视觉 token。`
      : phase === 1
        ? `输入序列：约 ${SYS} 个系统 token → ${nv} 个视觉 token → 问题与模板。视觉 token 占 ${(inputShare * 100).toFixed(0)}%。`
        : `已算到第 ${layer} 层。每一层都要处理全部 ${n} 个 token；去掉视觉 token，每层能省约 ${(saveShare * 100).toFixed(0)}%。`;

  return (
    <div className="sv-live sv-mod">
      <div className="lv-split">
        <div className="sv-col">
          <StageCanvas s={stage} label={`视觉 token 账单：${nv} 个视觉 token 占输入 ${(inputShare * 100).toFixed(0)}%，每层可省约 ${(saveShare * 100).toFixed(0)}%`} />
          <TimeBar tl={tl} phases={PHASES} label="账单进度" extra={<SpeedSeg value={speed} onChange={setSpeed} />} />
        </div>
        <div className="lv-side">
          <Seg
            label="图像分辨率"
            value={res}
            onChange={setRes}
            options={[
              { value: '336', label: '336×336（LLaVA-1.5）' },
              { value: '672', label: '672×672' },
            ]}
          />
          <Range
            label="图像之外的 token 数（含约 35 个系统 token）"
            value={nonVis}
            min={40}
            max={400}
            step={2}
            onChange={(v) => {
              markDirectInput();
              setNonVis(v);
            }}
            display={`${nonVis} 个`}
          />
          <div className="sv-reads">
            <Readout label="视觉 token" value={nv} tone="vis" sub={`${side} × ${side}`} />
            <Readout label="占输入的比例" value={`${(inputShare * 100).toFixed(1)}%`} />
            <Readout label="去掉视觉 token 每层可省" value={`${(saveShare * 100).toFixed(1)}%`} tone="blue" />
            <Readout label="预填充 TFLOPs（32 层）" value={tflops.toFixed(2)} sub="代码计数式" />
          </div>
          <Feedback k={`${phase}-${res}`}>{fb}</Feedback>
          <p className="sv-small">
            <Tag kind="extrap" /> 读数按代码计数式 4nd² + 2n²d + 3ndm 计算；默认 118 个图像之外的 token 是为对齐表 1 原模型 4.62 T 反推的假设。示意图片与动画为 <Tag kind="demo" />。
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- 绘制
function paint(f: Frame, p: number, side: number, nonVis: number) {
  const { ctx, w, h } = f;
  const nv = side * side;
  const n = nv + nonVis; // nonVis 含系统提示（约 35 个）与问题、模板
  const wide = w >= 620;
  // 区域：图片（示意）、输入序列条、32 层计费条
  const img = wide ? { x: 16, y: 16, s: Math.min(150, h * 0.46) } : { x: 16, y: 14, s: Math.min(120, w * 0.34) };
  const seq = wide ? { x: img.x + img.s + 28, y: img.y + 8, w: w - img.x - img.s - 44, h: 22 } : { x: img.x + img.s + 18, y: img.y + 10, w: w - img.x - img.s - 34, h: 20 };
  const layersTop = img.y + img.s + 46;
  const lay = { x: 16, y: layersTop, w: w - 32, h: h - layersTop - 14 };

  const a = clamp(p / 0.28, 0, 1); // 切块
  const b = clamp((p - 0.28) / 0.24, 0, 1); // 排进序列
  const c = clamp((p - 0.52) / 0.48, 0, 1); // 逐层计费

  // --- 示意图片：浅色街景 ---
  ctx.save();
  rr(ctx, img.x, img.y, img.s, img.s, 8);
  ctx.clip();
  const g = ctx.createLinearGradient(0, img.y, 0, img.y + img.s);
  g.addColorStop(0, '#dbe9fb');
  g.addColorStop(1, '#f4f7fb');
  ctx.fillStyle = g;
  ctx.fillRect(img.x, img.y, img.s, img.s);
  ctx.fillStyle = '#c9d4e3';
  ctx.fillRect(img.x, img.y + img.s * 0.62, img.s, img.s * 0.38);
  ctx.fillStyle = '#8fa3bf';
  ctx.fillRect(img.x + img.s * 0.08, img.y + img.s * 0.3, img.s * 0.3, img.s * 0.34);
  ctx.fillStyle = '#b25a4a';
  ctx.beginPath();
  ctx.moveTo(img.x + img.s * 0.05, img.y + img.s * 0.32);
  ctx.lineTo(img.x + img.s * 0.23, img.y + img.s * 0.16);
  ctx.lineTo(img.x + img.s * 0.41, img.y + img.s * 0.32);
  ctx.fill();
  ctx.fillStyle = C.vis;
  ctx.fillRect(img.x + img.s * 0.6, img.y + img.s * 0.22, img.s * 0.28, img.s * 0.14);
  ctx.fillStyle = '#6b7a90';
  ctx.fillRect(img.x + img.s * 0.73, img.y + img.s * 0.36, img.s * 0.025, img.s * 0.28);
  ctx.fillStyle = '#e0a63a';
  rr(ctx, img.x + img.s * 0.18, img.y + img.s * 0.68, img.s * 0.42, img.s * 0.16, 4);
  ctx.fill();
  // 网格：逐渐画出（太密时每隔一格画一条）
  const cell = img.s / side;
  const stepK = cell < 4 ? Math.ceil(4 / cell) : 1;
  ctx.strokeStyle = rgba('#ffffff', 0.85 * a);
  ctx.lineWidth = 1;
  for (let i = stepK; i < side; i += stepK) {
    const k = clamp(a * 1.4 - i / side * 0.4, 0, 1);
    ctx.beginPath();
    ctx.moveTo(img.x + i * cell, img.y);
    ctx.lineTo(img.x + i * cell, img.y + img.s * k);
    ctx.moveTo(img.x, img.y + i * cell);
    ctx.lineTo(img.x + img.s * k, img.y + i * cell);
    ctx.stroke();
  }
  // 飞走的块：排进序列阶段，图片逐渐变淡
  if (b > 0) {
    ctx.fillStyle = rgba(C.stage, 0.45 * easeInOut(b));
    ctx.fillRect(img.x, img.y, img.s, img.s);
  }
  ctx.restore();
  txt(ctx, `${side}×${side} 块`, img.x + img.s / 2, img.y + img.s + 12, { size: 12, color: C.muted, align: 'center' });

  // --- 输入序列条 ---
  const segs = [
    { k: '系统', v: SYS, c: C.sys },
    { k: '视觉 token', v: nv, c: C.vis },
    { k: '问题与模板', v: Math.max(0, nonVis - SYS), c: C.text },
  ];
  txt(ctx, '输入序列', seq.x, seq.y - 2, { size: 12, weight: 700, color: C.muted });
  let sx = seq.x;
  const sy = seq.y + 10;
  segs.forEach((s, i) => {
    const sw = (s.v / n) * seq.w;
    const grow = i === 1 ? easeInOut(b) : b > 0 ? 1 : 0.35;
    ctx.fillStyle = rgba(s.c, i === 1 ? 0.25 + 0.75 * grow : 0.35 + 0.65 * Math.min(1, grow));
    rr(ctx, sx, sy, Math.max(2, sw * (i === 1 ? Math.max(0.04, grow) : 1)), seq.h, 4);
    ctx.fill();
    sx += sw * (i === 1 ? Math.max(0.04, grow) : 1) + 2;
  });
  // 飞行中的小块（示意）：从图片飞向序列里的视觉段
  if (b > 0 && b < 1) {
    for (let i = 0; i < 14; i++) {
      const t = clamp(b * 1.3 - i * 0.02, 0, 1);
      const fx = lerp(img.x + ((i * 37) % 100) / 100 * img.s, seq.x + (SYS / n) * seq.w + (i / 14) * (nv / n) * seq.w * b, easeInOut(t));
      const fy = lerp(img.y + ((i * 53) % 100) / 100 * img.s, sy + seq.h / 2, easeInOut(t));
      ctx.fillStyle = rgba(C.vis, 0.85 * (1 - t * 0.6));
      rr(ctx, fx - 4, fy - 4, 8, 8, 2);
      ctx.fill();
    }
  }
  if (b >= 1 || p >= 0.52) {
    const pctV = Math.round((nv / n) * 100);
    txt(ctx, `视觉 token 约占 ${pctV}%`, seq.x, sy + seq.h + 16, { size: 12, color: C.vis, weight: 700 });
  }

  // --- 32 层计费 ---
  if (lay.h < 40) return;
  const rows = N_LAYERS;
  const rowH = lay.h / rows;
  const done = c * rows;
  const F = layerFlops(n);
  const Fn = layerFlops(nonVis);
  const visW = (1 - Fn / F) * (lay.w - 40);
  txt(ctx, '每层计算（左段：去掉视觉 token 就能省下的部分）', lay.x, lay.y - 8, { size: 12, weight: 700, color: C.muted });
  for (let l = 0; l < rows; l++) {
    const ry = lay.y + lay.h - (l + 1) * rowH;
    const k = clamp(done - l, 0, 1);
    ctx.fillStyle = rgba(C.stageLine, 0.55);
    ctx.fillRect(lay.x + 40, ry + 0.5, lay.w - 40, Math.max(1, rowH - 1));
    if (k > 0) {
      ctx.fillStyle = rgba(C.vis, 0.85 * k);
      ctx.fillRect(lay.x + 40, ry + 0.5, visW * k, Math.max(1, rowH - 1));
      ctx.fillStyle = rgba(C.text, 0.9 * k);
      ctx.fillRect(lay.x + 40 + visW * k, ry + 0.5, (lay.w - 40 - visW) * k, Math.max(1, rowH - 1));
    }
    if (l % 8 === 0 || l === rows - 1) txt(ctx, `L${l}`, lay.x + 34, ry + rowH / 2, { size: 10, color: C.faint, align: 'right' });
  }
}
