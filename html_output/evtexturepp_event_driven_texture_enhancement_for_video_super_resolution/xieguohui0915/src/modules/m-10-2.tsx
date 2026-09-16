import React, { useEffect, useRef, useState } from 'react';
import {
  setupCanvas,
  observeCanvas,
  clamp,
  lerp,
  easeInOutQuad,
} from '../lib/canvasKit';
import { clearScene, drawLegend, drawSceneLabel, lerpPrint, PAPER } from './halftoneKit';
import type { WidgetProps } from './registry';

// §10.2 合成事件 vs 真实事件（制版台主题）
//
// 讲的是论文自己的一个事实：五个数据集里，Vimeo-90K / REDS / UDM10 / Vid4 的事件都是
// 用 ESIM 从视频帧模拟出来的（这几个数据集本身没有真实事件传感器数据），只有 CED 用的是
// 真实事件相机（DAVIS346）采集的事件。方块用描边颜色区分两类来源：模拟 = PAPER.orange，
// 真实采集 = PAPER.green；方块里面画各自来源的小图标——模拟的画「一张小图 → 箭头 →
// 一串事件点」，真实采集的画一台相机。图例两项：ESIM 模拟 / 真实采集。
//
// 主操作：chip 在「全部数据集」/「只看真实事件」之间切换。选后者时，四个模拟数据集
// 变灰、缩小，只留 CED 高亮。
//
// 反馈里的数字（40.57 dB、+0.43 dB、1.48 dB）与传感器型号 DAVIS346 都是论文原话；
// 本文件不引入任何论文之外的数字。

const W = 1080;
const H_WIDE = 320;
const H_NARROW = 520;
const NARROW_AT = 720;
const TRANSITION_MS = 360;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

type Mode = 'all' | 'real';

interface SourceDef {
  name: string;
  simulated: boolean;
  /** 方块下方那一行小字：它的事件是怎么来的。 */
  note: string;
}

const SOURCES: SourceDef[] = [
  { name: 'Vimeo-90K', simulated: true, note: 'ESIM 模拟' },
  { name: 'REDS', simulated: true, note: 'ESIM 模拟' },
  { name: 'UDM10', simulated: true, note: 'ESIM 模拟' },
  { name: 'Vid4', simulated: true, note: 'ESIM 模拟' },
  { name: 'CED', simulated: false, note: '真实事件相机采集' },
];

interface ModeDef {
  id: Mode;
  chip: string;
  cls: string;
  feedback: string;
}

const MODES: ModeDef[] = [
  {
    id: 'all',
    chip: '全部数据集',
    cls: 'warn',
    feedback:
      '五个数据集里，四个的事件都是用 ESIM 从视频帧模拟出来的——模拟事件很"干净"，没有热噪声、没有时间抖动、没有阈值失配。',
  },
  {
    id: 'real',
    chip: '只看真实事件',
    cls: 'good',
    feedback:
      '只有 CED 用的是真实事件相机（DAVIS346）采的数据。论文在它上面 2× 达到 40.57 dB，比 EBVSR 高 0.43 dB——注意这个优势比合成数据上的 1.48 dB 小得多。',
  },
];

function modeOf(id: Mode): ModeDef {
  return MODES.find((m) => m.id === id) ?? MODES[0];
}

// ---------------------------------------------------------------- 版面

interface Card {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Geo {
  narrow: boolean;
  cards: Card[];
  nameFont: string;
  noteFont: string;
  /** 仿真图标相对 200×64 单位框的缩放。 */
  iconScale: number;
  label: { x: number; y: number };
  legend: { x: number; y: number };
}

function geoFor(narrow: boolean): Geo {
  if (narrow) {
    const x = 150;
    const w = 780;
    const h = 88;
    const top = 44;
    const pitch = 92;
    return {
      narrow,
      cards: SOURCES.map((_, i) => ({ x, y: top + i * pitch, w, h })),
      nameFont: `26px ${FONT}`,
      noteFont: `19px ${FONT}`,
      iconScale: 1.05,
      label: { x: 150, y: 28 },
      legend: { x: 700, y: 24 },
    };
  }
  const margin = 28;
  const gap = 22;
  const top = 56;
  const h = 170;
  const w = (W - margin * 2 - gap * (SOURCES.length - 1)) / SOURCES.length;
  return {
    narrow,
    cards: SOURCES.map((_, i) => ({ x: margin + i * (w + gap), y: top, w, h })),
    nameFont: `18px ${FONT}`,
    noteFont: `13px ${FONT}`,
    iconScale: 0.62,
    label: { x: 28, y: 30 },
    legend: { x: 766, y: 30 },
  };
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

/** 「由视频帧模拟出事件」的小图标：一张小图 → 向右箭头 → 一串事件点。 */
function drawSimIcon(ctx: CanvasRenderingContext2D): void {
  // 一张小图
  ctx.save();
  ctx.fillStyle = PAPER.print;
  ctx.strokeStyle = PAPER.screenLine;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.rect(-100, -22, 44, 44);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PAPER.axis;
  ctx.beginPath();
  ctx.moveTo(-94, 16);
  ctx.lineTo(-80, -2);
  ctx.lineTo(-67, 16);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-66, -12, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 向右的箭头
  ctx.save();
  ctx.strokeStyle = PAPER.muted;
  ctx.fillStyle = PAPER.muted;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-48, 0);
  ctx.lineTo(-26, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.lineTo(-25, -7);
  ctx.lineTo(-25, 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 一串事件点（极性配色沿用 PAPER.evOn / PAPER.evOff）
  const dots: [number, number, number][] = [
    [0, 0, 1],
    [18, -7, -1],
    [36, 5, 1],
    [54, -5, -1],
    [72, 1, 1],
  ];
  ctx.save();
  dots.forEach((d) => {
    ctx.fillStyle = d[2] > 0 ? PAPER.evOn : PAPER.evOff;
    ctx.beginPath();
    ctx.arc(d[0], d[1], 4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

/** 「真实事件相机采集」的小图标：一台相机。 */
function drawCamIcon(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.strokeStyle = PAPER.green;
  ctx.fillStyle = PAPER.print;
  ctx.lineWidth = 3;
  roundRect(ctx, -62, -26, 124, 56, 9);
  ctx.fill();
  ctx.stroke();
  roundRect(ctx, -26, -37, 34, 13, 4);
  ctx.fill();
  ctx.stroke();

  // 镜头
  ctx.beginPath();
  ctx.arc(4, 2, 19, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(34, 141, 92, 0.26)';
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(4, 2, 8, 0, Math.PI * 2);
  ctx.fillStyle = PAPER.green;
  ctx.fill();

  // 闪光灯
  ctx.beginPath();
  ctx.arc(-46, -12, 5, 0, Math.PI * 2);
  ctx.fillStyle = PAPER.green;
  ctx.fill();
  ctx.restore();
}

function drawIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  simulated: boolean
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  if (simulated) drawSimIcon(ctx);
  else drawCamIcon(ctx);
  ctx.restore();
}

interface CardLook {
  scale: number;
  alpha: number;
  stroke: string;
  text: string;
  /** 外圈脉动强度，0 表示不画。 */
  ring: number;
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  card: Card,
  def: SourceDef,
  look: CardLook,
  geo: Geo
): void {
  const cx = card.x + card.w / 2;
  const cy = card.y + card.h / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(look.scale, look.scale);
  ctx.translate(-card.w / 2, -card.h / 2);

  // 外圈（只在高亮的真实采集方块上出现）
  if (look.ring > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, look.ring) * 0.6;
    ctx.strokeStyle = PAPER.green;
    ctx.lineWidth = 3;
    roundRect(ctx, -7, -7, card.w + 14, card.h + 14, 16);
    ctx.stroke();
    ctx.restore();
  }

  ctx.globalAlpha = look.alpha;
  ctx.fillStyle = PAPER.print;
  roundRect(ctx, 0.8, 0.8, card.w - 1.6, card.h - 1.6, 12);
  ctx.fill();
  ctx.strokeStyle = look.stroke;
  ctx.lineWidth = 2;
  roundRect(ctx, 1.4, 1.4, card.w - 2.8, card.h - 2.8, 11);
  ctx.stroke();

  // 方块里的名称（图表内容，不占画布短标签预算）
  ctx.fillStyle = look.text;
  ctx.font = geo.nameFont;
  ctx.textBaseline = 'alphabetic';

  if (geo.narrow) {
    ctx.textAlign = 'left';
    ctx.fillText(def.name, 40, 40);
    ctx.font = geo.noteFont;
    ctx.fillStyle = PAPER.muted;
    ctx.fillText(def.note, 40, 72);
    drawIcon(ctx, 620, 44, geo.iconScale, def.simulated);
  } else {
    ctx.textAlign = 'center';
    ctx.fillText(def.name, card.w / 2, 36);
    drawIcon(ctx, card.w / 2, 110, geo.iconScale, def.simulated);
  }
  ctx.restore();

  // 宽屏：方块下方那一行小字
  if (!geo.narrow) {
    ctx.save();
    ctx.globalAlpha = look.alpha;
    ctx.fillStyle = def.simulated ? PAPER.muted : PAPER.green;
    ctx.font = geo.noteFont;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(def.note, cx, card.y + card.h + 24);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- 场景

export interface SceneState {
  mode: Mode;
  /** 切换动画的起点与终点（0 = 全部数据集，1 = 只看真实事件）。 */
  from: number;
  target: number;
  transStart: number;
}

/** 画一帧。rAF 回调与测试都走这里；内部不做任何像素读取。 */
export function drawScene(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  h: number,
  s: SceneState,
  now: number
): void {
  const shown = canvas.getBoundingClientRect().width || canvas.clientWidth || W;
  const geo = geoFor(shown < NARROW_AT);

  const t = clamp((now - s.transStart) / TRANSITION_MS, 0, 1);
  const f = clamp(lerp(s.from, s.target, easeInOutQuad(t)), 0, 1);
  const pulse = 0.5 + 0.5 * Math.sin((now / 700) * Math.PI * 2);

  clearScene(ctx, W, h);

  SOURCES.forEach((def, i) => {
    const card = geo.cards[i];
    const look: CardLook = def.simulated
      ? {
          scale: lerp(1, 0.62, f),
          alpha: lerp(1, 0.45, f),
          stroke: lerpPrint(PAPER.orange, PAPER.muted, f),
          text: lerpPrint(PAPER.ink, PAPER.muted, f),
          ring: 0,
        }
      : {
          scale: lerp(1, 1.06, f),
          alpha: 1,
          stroke: PAPER.green,
          text: PAPER.ink,
          ring: f * (0.55 + 0.45 * pulse),
        };
    drawCard(ctx, card, def, look, geo);
  });

  // ---- 一个短标签 + 一个两项图例 ----
  drawSceneLabel(ctx, geo.label.x, geo.label.y, '事件来源');
  drawLegend(ctx, geo.legend.x, geo.legend.y, [
    { color: PAPER.orange, label: 'ESIM 模拟' },
    { color: PAPER.green, label: '真实采集' },
  ]);
}

// ---------------------------------------------------------------- 组件

export const M10_2: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<SceneState>({
    mode: 'all',
    from: 0,
    target: 0,
    transStart: 0,
  });

  const [mode, setMode] = useState<Mode>('all');

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

  const pick = (id: Mode): void => {
    const s = sceneRef.current;
    if (id === s.mode) return;
    const now = performance.now();
    const t = clamp((now - s.transStart) / TRANSITION_MS, 0, 1);
    s.from = clamp(lerp(s.from, s.target, easeInOutQuad(t)), 0, 1);
    s.target = id === 'real' ? 1 : 0;
    s.transStart = now;
    s.mode = id;
    setMode(id);
  };

  const fb = modeOf(mode);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={W}
        height={H_WIDE}
        aria-label="合成事件 vs 真实事件"
      />
      <div className="chip-row">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`chip${mode === m.id ? ' selected' : ''}`}
            onClick={() => pick(m.id)}
          >
            {m.chip}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.feedback}</div>
    </>
  );
};

export default M10_2;
