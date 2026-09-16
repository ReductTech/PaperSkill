import React, { useEffect, useRef, useState } from 'react';
import {
  setupCanvas,
  observeCanvas,
  clamp,
  lerp,
  easeInOutQuad,
} from '../lib/canvasKit';
import { clearScene, drawAxes, drawLegend, drawSceneLabel, PAPER } from './halftoneKit';
import type { WidgetProps } from './registry';

// §10.1 谁在 Vid4 上最高（制版台主题）
//
// 为什么不照论文 Fig.1 的散点重画：Fig.1 的横轴是耗时，但论文只在 Table V 给了
// EvTexture++ 的 95.0 ms，并把 IART / MIA-VSR 写成「单帧超过 1000 ms」；其余 10 个
// 方法的耗时只存在于图上。照着重画就必须去图上估读横坐标——那又变成编数字了。
// 所以这里改用论文 Table I 的精确数值画一张横向点图，Fig.1 仍作为本模块的配图
// 显示在画布上方。
//
// 本文件里的 13 行数值全部抄自 Table I（一个数都没有改），RTVAR 一行按规范略去。
// 画法：每个方法一行，行末一个圆点，横轴是该数据集的 PSNR。EvTexture++ 用
// PAPER.green 实心大点，其余用 PAPER.blue 小点。
//
// 主操作：chip 切换数据集 Vid4 / REDS4 / Vimeo-90K-T，切换后行序按该数据集的 PSNR
// 降序重排（420 ms 过渡：每个方法的圆点从旧位置滑到新位置）。
// 次操作：点击某一行（等价于下方那一排 DOM 按钮）→ 该行高亮，画布下方的信息区
// 显示该方法的 PSNR 与 SSIM 两个裸数字。

const W = 1080;
const H_WIDE = 420;
const H_NARROW = 620;
const NARROW_AT = 720;
const TRANSITION_MS = 420;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

type DatasetId = 'vid4' | 'reds4' | 'vimeo';

interface Method {
  name: string;
  /** Vid4 4× 平均 PSNR（Y 通道） */
  vid4: number;
  /** Vid4 4× SSIM（Table I 同一行） */
  ssim: number;
  /** REDS4 4× 平均 PSNR（RGB 通道） */
  reds4: number;
  /** Vimeo-90K-T 4× 平均 PSNR（Y 通道） */
  vimeo: number;
  hero?: boolean;
}

/** 13 行全部抄自论文 Table I，一个数都没有改。 */
const METHODS: Method[] = [
  { name: 'EvTexture++', vid4: 29.78, ssim: 0.8983, reds4: 32.93, vimeo: 38.32, hero: true },
  { name: "EvTexture (ICML'24)", vid4: 29.51, ssim: 0.8909, reds4: 32.79, vimeo: 38.23 },
  { name: 'EBVSR', vid4: 28.46, ssim: 0.8701, reds4: 31.47, vimeo: 37.56 },
  { name: 'IART', vid4: 28.30, ssim: 0.8523, reds4: 32.90, vimeo: 38.14 },
  { name: 'MIA-VSR', vid4: 28.27, ssim: 0.8519, reds4: 32.79, vimeo: 38.22 },
  { name: 'PSRT', vid4: 28.20, ssim: 0.8504, reds4: 32.72, vimeo: 38.27 },
  { name: 'RVRT', vid4: 27.94, ssim: 0.8443, reds4: 32.75, vimeo: 38.15 },
  { name: 'VRT', vid4: 27.88, ssim: 0.8404, reds4: 32.19, vimeo: 38.20 },
  { name: 'BasicVSR++', vid4: 27.87, ssim: 0.8413, reds4: 32.39, vimeo: 37.79 },
  { name: 'IconVSR', vid4: 27.46, ssim: 0.8290, reds4: 31.67, vimeo: 37.47 },
  { name: 'BasicVSR', vid4: 27.32, ssim: 0.8265, reds4: 31.42, vimeo: 37.18 },
  { name: 'EDVR', vid4: 27.30, ssim: 0.8242, reds4: 31.09, vimeo: 37.61 },
  { name: 'EGVSR', vid4: 24.84, ssim: 0.7330, reds4: 26.87, vimeo: 34.62 },
];

interface DatasetDef {
  id: DatasetId;
  chip: string;
  /** 横轴单位（图表内容）。 */
  unit: string;
  ticks: number[];
  lo: number;
  hi: number;
  cls: string;
  feedback: string;
}

const DATASETS: DatasetDef[] = [
  {
    id: 'vid4',
    chip: 'Vid4',
    unit: 'PSNR（dB）· Y 通道',
    ticks: [25, 27, 29],
    lo: 24.3,
    hi: 30.2,
    cls: 'good',
    feedback:
      'EvTexture++ 是 29.78 dB，比最强的 RGB 方法 IART 高 1.48 dB。单位是 Y 通道 PSNR，越高越好（Table I）。',
  },
  {
    id: 'reds4',
    chip: 'REDS4',
    unit: 'PSNR（dB）· RGB 通道',
    ticks: [27, 29, 31],
    lo: 26.5,
    hi: 33.4,
    cls: 'info',
    feedback: 'REDS4 的指标算在 RGB 通道上，和 Vid4 的 Y 通道不能直接比大小（Table I）。',
  },
  {
    id: 'vimeo',
    chip: 'Vimeo-90K-T',
    unit: 'PSNR（dB）· Y 通道',
    ticks: [35, 36, 37, 38],
    lo: 34.3,
    hi: 38.7,
    cls: 'info',
    feedback: 'Vimeo-90K-T 是 Y 通道。（Table I）',
  },
];

function dsOf(id: DatasetId): DatasetDef {
  return DATASETS.find((d) => d.id === id) ?? DATASETS[0];
}

function valueOf(m: Method, id: DatasetId): number {
  if (id === 'reds4') return m.reds4;
  if (id === 'vimeo') return m.vimeo;
  return m.vid4;
}

/** 行序：始终按当前数据集的 PSNR 降序。 */
function orderFor(id: DatasetId): number[] {
  return METHODS.map((_, i) => i).sort(
    (a, b) => valueOf(METHODS[b], id) - valueOf(METHODS[a], id)
  );
}

/** 点击某一行时的反馈（逐字照抄规范）。 */
function methodFeedback(i: number): { text: string; cls: string } {
  const m = METHODS[i];
  const head =
    `${m.name}：Vid4 ${m.vid4.toFixed(2)} dB / SSIM ${m.ssim.toFixed(4)}；` +
    `REDS4 ${m.reds4.toFixed(2)}；Vimeo-90K-T ${m.vimeo.toFixed(2)}。`;
  if (m.hero) {
    // 10.15M、95.0 ms、>1000 ms 都是论文 Table V 的原值。
    return {
      text:
        head +
        '参数量 10.15M，单帧 95.0 ms；而 IART 与 MIA-VSR 单帧都超过 1000 ms（Table V）。',
      cls: 'good',
    };
  }
  return { text: head, cls: 'info' };
}

// ---------------------------------------------------------------- 版面

interface Geo {
  narrow: boolean;
  panel: { x: number; y: number; w: number; h: number };
  /** 第一行的行中心（圆点的 y）。 */
  rowTop: number;
  pitch: number;
  /** 宽屏：方法名的右对齐点。 */
  labelRight: number;
  nameFont: string;
  tickFont: string;
  valueFont: string;
  unitFont: string;
  dotR: number;
  heroR: number;
  tickLabelY: number;
  unitY: number;
  bandH: number;
  bandShift: number;
  label: { x: number; y: number };
  legend: { x: number; y: number };
}

function geoFor(narrow: boolean): Geo {
  if (narrow) {
    const panel = { x: 20, y: 36, w: 1040, h: 500 };
    const pad = 6;
    const pitch = (panel.h - pad * 2) / METHODS.length;
    return {
      narrow,
      panel,
      rowTop: panel.y + pad + pitch / 2,
      pitch,
      labelRight: 0,
      nameFont: `15px ${FONT}`,
      tickFont: `15px ${FONT}`,
      valueFont: `16px ${FONT}`,
      unitFont: `14px ${FONT}`,
      dotR: 6.5,
      heroR: 11,
      tickLabelY: panel.y + panel.h + 24,
      unitY: panel.y + panel.h + 48,
      bandH: pitch * 0.94,
      bandShift: -9,
      label: { x: 24, y: 28 },
      legend: { x: 690, y: 22 },
    };
  }
  const panel = { x: 224, y: 48, w: 820, h: 300 };
  const pad = 6;
  const pitch = (panel.h - pad * 2) / METHODS.length;
  return {
    narrow,
    panel,
    rowTop: panel.y + pad + pitch / 2,
    pitch,
    labelRight: panel.x - 14,
    nameFont: `13px ${FONT}`,
    tickFont: `13px ${FONT}`,
    valueFont: `13px ${FONT}`,
    unitFont: `12px ${FONT}`,
    dotR: 4.6,
    heroR: 8,
    tickLabelY: panel.y + panel.h + 22,
    unitY: panel.y + panel.h + 46,
    bandH: pitch * 0.84,
    bandShift: 0,
    label: { x: 30, y: 34 },
    legend: { x: 830, y: 32 },
  };
}

function xOf(geo: Geo, value: number, ds: DatasetDef): number {
  const t = clamp((value - ds.lo) / (ds.hi - ds.lo), 0, 1);
  return geo.panel.x + t * geo.panel.w;
}

function fmtTick(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// ---------------------------------------------------------------- 场景

export interface SceneState {
  dataset: DatasetId;
  /** 选中的方法下标，-1 表示没有选中。 */
  selected: number;
  /** 数据集切换动画的起点时刻（performance.now）。 */
  transStart: number;
  hasFrom: boolean;
  /** 切换前每个方法的像素位置（按方法下标），用于过渡插值。 */
  fromX: number[];
  fromY: number[];
}

/**
 * 画一帧。rAF 回调与测试都走这里；内部不做任何像素读取。
 * 逐字文案、颜色与数值都来自 Table I / Table V。
 */
export function drawScene(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  h: number,
  s: SceneState,
  now: number
): void {
  const shown = canvas.getBoundingClientRect().width || canvas.clientWidth || W;
  const geo = geoFor(shown < NARROW_AT);
  const ds = dsOf(s.dataset);

  const t = clamp((now - s.transStart) / TRANSITION_MS, 0, 1);
  const moving = s.hasFrom && t < 1;
  const e = easeInOutQuad(t);

  const rowOf: number[] = new Array<number>(METHODS.length).fill(0);
  orderFor(s.dataset).forEach((mi, r) => {
    rowOf[mi] = r;
  });

  const pos = METHODS.map((m, i) => {
    const tx = xOf(geo, valueOf(m, s.dataset), ds);
    const ty = geo.rowTop + rowOf[i] * geo.pitch;
    return {
      x: moving ? lerp(s.fromX[i], tx, e) : tx,
      y: moving ? lerp(s.fromY[i], ty, e) : ty,
    };
  });

  const sel = s.selected >= 0 && s.selected < METHODS.length ? s.selected : -1;

  clearScene(ctx, W, h);
  drawAxes(ctx, geo.panel.x, geo.panel.y, geo.panel.w, geo.panel.h);

  // ---- 刻度网格 ----
  ctx.save();
  ctx.strokeStyle = PAPER.axis;
  ctx.lineWidth = 1;
  ds.ticks.forEach((tk) => {
    const x = Math.round(xOf(geo, tk, ds)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, geo.panel.y + 2);
    ctx.lineTo(x, geo.panel.y + geo.panel.h - 2);
    ctx.stroke();
  });
  ctx.restore();

  // ---- 刻度数字与单位（图表内容） ----
  ctx.save();
  ctx.strokeStyle = PAPER.muted;
  ctx.fillStyle = PAPER.muted;
  ctx.font = geo.tickFont;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ds.ticks.forEach((tk) => {
    const x = xOf(geo, tk, ds);
    ctx.beginPath();
    ctx.moveTo(x + 0.5, geo.panel.y + geo.panel.h + 1);
    ctx.lineTo(x + 0.5, geo.panel.y + geo.panel.h + 6);
    ctx.stroke();
    ctx.fillText(fmtTick(tk), x, geo.tickLabelY);
  });
  ctx.restore();

  ctx.save();
  ctx.fillStyle = PAPER.muted;
  ctx.font = geo.unitFont;
  ctx.textAlign = 'right';
  ctx.fillText(ds.unit, geo.panel.x + geo.panel.w, geo.unitY);
  ctx.restore();

  // ---- 选中行的高亮带 ----
  if (sel >= 0) {
    const p = pos[sel];
    const by = p.y + geo.bandShift;
    ctx.save();
    ctx.fillStyle = 'rgba(34, 141, 92, 0.14)';
    roundRect(ctx, geo.panel.x + 2, by - geo.bandH / 2, geo.panel.w - 4, geo.bandH, 6);
    ctx.fill();
    ctx.strokeStyle = PAPER.green;
    ctx.lineWidth = 1.4;
    roundRect(
      ctx,
      geo.panel.x + 2.7,
      by - geo.bandH / 2 + 0.7,
      geo.panel.w - 5.4,
      geo.bandH - 1.4,
      6
    );
    ctx.stroke();
    ctx.restore();
  }

  // ---- 13 行：引导线 + 方法名 + 圆点 ----
  METHODS.forEach((m, i) => {
    const p = pos[i];
    const r = m.hero ? geo.heroR : geo.dotR;
    const isSel = i === sel;

    ctx.save();
    ctx.strokeStyle = PAPER.axis;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    const lx = geo.narrow ? geo.panel.x + 8 : geo.labelRight + 6;
    ctx.beginPath();
    ctx.moveTo(lx, Math.round(p.y) + 0.5);
    ctx.lineTo(Math.max(lx, p.x - r - 5), Math.round(p.y) + 0.5);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.font = geo.nameFont;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = geo.narrow ? 'left' : 'right';
    ctx.fillStyle = isSel ? PAPER.green : m.hero ? PAPER.ink : PAPER.muted;
    ctx.fillText(
      m.name,
      geo.narrow ? geo.panel.x + 8 : geo.labelRight,
      geo.narrow ? p.y - 17 : p.y + 5
    );
    ctx.restore();

    ctx.save();
    ctx.fillStyle = m.hero ? PAPER.green : PAPER.blue;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    if (isSel) {
      ctx.strokeStyle = PAPER.green;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r + 4.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // 选中行：旁边一个裸数字（当前数据集的 PSNR）
    if (isSel) {
      const label = valueOf(m, s.dataset).toFixed(2);
      const flip = p.x + r + 8 + 44 > geo.panel.x + geo.panel.w;
      ctx.save();
      ctx.font = geo.valueFont;
      ctx.textBaseline = 'middle';
      ctx.textAlign = flip ? 'right' : 'left';
      ctx.fillStyle = PAPER.ink;
      ctx.fillText(label, flip ? p.x - r - 8 : p.x + r + 8, p.y);
      ctx.restore();
    }
  });

  // ---- 两个短标签 + 一个两项图例 ----
  drawSceneLabel(ctx, geo.label.x, geo.label.y, 'PSNR 点图');
  drawSceneLabel(ctx, geo.label.x + 100, geo.label.y, '越高越好', PAPER.muted);
  drawLegend(ctx, geo.legend.x, geo.legend.y, [
    { color: PAPER.green, label: '本方法' },
    { color: PAPER.blue, label: '对比方法' },
  ]);
}

// ---------------------------------------------------------------- 组件

export const M10_1: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hRef = useRef(H_WIDE);
  const narrowRef = useRef(false);
  const sceneRef = useRef<SceneState>({
    dataset: 'vid4',
    selected: -1,
    transStart: 0,
    hasFrom: false,
    fromX: new Array<number>(METHODS.length).fill(0),
    fromY: new Array<number>(METHODS.length).fill(0),
  });

  const [dataset, setDataset] = useState<DatasetId>('vid4');
  const [selected, setSelected] = useState(-1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let H = H_WIDE;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    let raf = 0;
    let running = false;
    let ready = false;

    const frame = (now: number): void => {
      const shown = canvas.getBoundingClientRect().width;
      const narrow = shown > 0 && shown < NARROW_AT;
      const wantH = narrow ? H_NARROW : H_WIDE;
      if (wantH !== H) {
        H = wantH;
        ctx = setupCanvas(canvas, W, H);
      }
      hRef.current = H;
      narrowRef.current = narrow;

      drawScene(ctx, canvas, H, sceneRef.current, now);

      if (!ready) {
        canvas.classList.add('is-ready');
        ready = true;
      }
      if (running) raf = window.requestAnimationFrame(frame);
    };

    const start = (): void => {
      if (running) return;
      running = true;
      raf = window.requestAnimationFrame(frame);
    };
    const stop = (): void => {
      running = false;
      if (raf !== 0) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    start();
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const select = (i: number): void => {
    if (i < 0 || i >= METHODS.length) return;
    sceneRef.current.selected = i;
    setSelected(i);
  };

  const pick = (id: DatasetId): void => {
    const s = sceneRef.current;
    if (id === s.dataset) return;

    const now = performance.now();
    const geo = geoFor(narrowRef.current);
    const t = clamp((now - s.transStart) / TRANSITION_MS, 0, 1);
    const e = easeInOutQuad(t);
    const moving = s.hasFrom && t < 1;

    const oldDs = dsOf(s.dataset);
    const oldRow: number[] = new Array<number>(METHODS.length).fill(0);
    orderFor(s.dataset).forEach((mi, r) => {
      oldRow[mi] = r;
    });
    for (let i = 0; i < METHODS.length; i++) {
      const ox = xOf(geo, valueOf(METHODS[i], s.dataset), oldDs);
      const oy = geo.rowTop + oldRow[i] * geo.pitch;
      s.fromX[i] = moving ? lerp(s.fromX[i], ox, e) : ox;
      s.fromY[i] = moving ? lerp(s.fromY[i], oy, e) : oy;
    }

    s.hasFrom = true;
    s.transStart = now;
    s.dataset = id;
    s.selected = -1;
    setDataset(id);
    setSelected(-1);
  };

  const clickRow = (ev: React.MouseEvent<HTMLCanvasElement>): void => {
    const canvas = ev.currentTarget;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = ((ev.clientX - rect.left) / rect.width) * W;
    const y = ((ev.clientY - rect.top) / rect.height) * hRef.current;
    if (x < 10 || x > W - 10) return;

    const geo = geoFor(narrowRef.current);
    const rows = orderFor(sceneRef.current.dataset);
    for (let r = 0; r < rows.length; r++) {
      const cy = geo.rowTop + r * geo.pitch;
      if (y >= cy - geo.pitch / 2 && y <= cy + geo.pitch / 2) {
        select(rows[r]);
        return;
      }
    }
  };

  const dsNow = dsOf(dataset);
  const feedback =
    selected >= 0 ? methodFeedback(selected) : { text: dsNow.feedback, cls: dsNow.cls };

  return (
    <>
      <canvas
        ref={canvasRef}
        width={W}
        height={H_WIDE}
        aria-label="谁在 Vid4 上最高"
        onClick={clickRow}
        style={{ cursor: 'pointer' }}
      />
      <div className="chip-row">
        {DATASETS.map((d) => (
          <button
            key={d.id}
            type="button"
            className={`chip${dataset === d.id ? ' selected' : ''}`}
            onClick={() => pick(d.id)}
          >
            {d.chip}
          </button>
        ))}
      </div>
      <div className="hotspot-info">
        <div>{selected >= 0 ? `${METHODS[selected].name} · ${dsNow.chip}` : '未选中方法'}</div>
        <div>
          {selected >= 0
            ? `PSNR ${valueOf(METHODS[selected], dataset).toFixed(2)} · SSIM ${METHODS[
                selected
              ].ssim.toFixed(4)}`
            : 'PSNR — · SSIM —'}
        </div>
      </div>
      <div className="chip-row">
        {METHODS.map((m, i) => (
          <button
            key={m.name}
            type="button"
            className={`chip${selected === i ? ' selected' : ''}`}
            onClick={() => select(i)}
          >
            {m.name}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </>
  );
};

export default M10_1;
