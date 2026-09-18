import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearScene,
  drawPrint,
  drawStripes,
  drawScreen,
  drawLegend,
  drawSceneLabel,
  PAPER,
} from './halftoneKit';
import type { WidgetProps } from './registry';

// §3.2 只记变化够不够？
//
// 上方（生活区）：制版台上的一张连续调原件，上面再叠一张表示"只记变化"的透明片，
//   按 elapsed 从左向右推进覆盖；被覆盖到的部分一路变暗。
// 下方（对比区）：两块同尺寸印样，每块下面一条明暗条 ——
//   左侧整体亮度按 baseline(t) 单向跑飞（1.00 → 0.40），
//   右侧勾选「把 RGB 的绝对亮度对上去」后立刻钳在 1.0 并保持。
//
// 本模块唯一的论点：两侧的边缘锐度完全一致，变的只有整体明暗基准。
// 因此条带的底纹对比度是固定的（不随 gain 改变），只有底色随 gain 平移；
// 2px 硬描边在最后一步画，永远满对比度。
// 明暗条只做"读数"，绝不去"洗"任何一侧的画面 —— 那是乘性地压低对比度，
// 看起来就像一边糊了，也正是本模块要反对的事。
// 这里不出现任何积分/指数符号 —— 事件记的是"变化了多少"，缺的是"本来多亮"。

const W = 1080;
const H_WIDE = 360;
const H_NARROW = 580;
const DURATION = 2400;
/** 单向跑飞的幅度：elapsed = 1 时基准降到 1 - 0.60 = 0.40，正好落在明暗条左端。 */
const SWING2 = 0.60;
/** 明暗条量程：两端标 0.4 / 1.6，真实亮度 1.0 落在正中。 */
const BAR_MIN = 0.4;
const BAR_MAX = 1.6;
const BAR_H = 14;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface SceneState {
  elapsed: number;
  running: boolean;
  anchored: boolean;
}

type Phase = 'idle' | 'running' | 'done';

interface Frame {
  life: Rect;
  left: Rect;
  right: Rect;
  barLeft: Rect;
  barRight: Rect;
  labelLeft: { x: number; y: number };
  labelRight: { x: number; y: number };
  valueLeft: { x: number; y: number };
  valueRight: { x: number; y: number };
  legend: { x: number; y: number };
}

/** 窄屏下对比区上下堆叠（每块面板下都跟着自己的明暗条），生活区保持在上。 */
function frameFor(narrow: boolean): Frame {
  if (narrow) {
    return {
      life: { x: 24, y: 20, w: 1032, h: 96 },
      left: { x: 24, y: 140, w: 1032, h: 140 },
      right: { x: 24, y: 358, w: 1032, h: 140 },
      barLeft: { x: 24, y: 302, w: 1032, h: BAR_H },
      barRight: { x: 24, y: 520, w: 1032, h: BAR_H },
      labelLeft: { x: 24, y: 134 },
      labelRight: { x: 24, y: 352 },
      valueLeft: { x: 1056, y: 298 },
      valueRight: { x: 1056, y: 516 },
      legend: { x: 24, y: 566 },
    };
  }
  return {
    life: { x: 24, y: 20, w: 1032, h: 84 },
    left: { x: 24, y: 126, w: 496, h: 166 },
    right: { x: 560, y: 126, w: 496, h: 166 },
    barLeft: { x: 24, y: 314, w: 496, h: BAR_H },
    barRight: { x: 560, y: 314, w: 496, h: BAR_H },
    labelLeft: { x: 24, y: 120 },
    labelRight: { x: 560, y: 120 },
    valueLeft: { x: 520, y: 310 },
    valueRight: { x: 1056, y: 310 },
    legend: { x: 24, y: 352 },
  };
}

/**
 * 演示性亮度基准：单调下降的 1 - SWING2 * t（t = 1 时正好降到明暗条的左端 0.40）。
 *
 * 事件积分缺的是常数项：每一小段时间里"变化了多少"都记下来了，
 * 但"本来有多亮"从来没被记过 —— 缺的那一块不会自己补回来，
 * 误差只会沿时间一路累积。所以基准是单向跑飞，而不是对称地暗→亮→暗；
 * 单向跑飞在视觉上也明确得多：读者一眼就知道它没有回头。
 */
function baseline(t: number): number {
  return 1 - SWING2 * t;
}

function grey(v: number): string {
  const g = Math.round(clamp(v, 0, 1) * 255);
  return `rgb(${g},${g},${g})`;
}

// 连续调原件的柔和团块：全部用径向渐变，刻意不出现任何硬边，
// 好和下方"事件化的"条纹条带形成对照。
const LIFE_BLOBS: { u: number; v: number; k: number; rgb: [number, number, number]; a: number }[] = [
  { u: 0.14, v: 0.34, k: 3.2, rgb: [240, 126, 71], a: 0.3 },
  { u: 0.4, v: 0.94, k: 3.6, rgb: [118, 144, 106], a: 0.5 },
  { u: 0.7, v: 0.8, k: 3.0, rgb: [104, 119, 143], a: 0.36 },
  { u: 0.92, v: 0.26, k: 2.6, rgb: [124, 58, 237], a: 0.16 },
];

/** 生活区：一张连续调原件（平滑渐变，没有硬边）。 */
function drawLifeOriginal(ctx: CanvasRenderingContext2D, r: Rect): void {
  drawPrint(ctx, r.x, r.y, r.w, r.h);

  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
  ctx.clip();

  const sky = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
  sky.addColorStop(0, '#cfe0f2');
  sky.addColorStop(0.55, '#edf2e5');
  sky.addColorStop(1, '#aec39a');
  ctx.fillStyle = sky;
  ctx.fillRect(r.x, r.y, r.w, r.h);

  for (const b of LIFE_BLOBS) {
    const cx = r.x + r.w * b.u;
    const cy = r.y + r.h * b.v;
    const rad = Math.max(8, r.h * b.k);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0, `rgba(${b.rgb[0]},${b.rgb[1]},${b.rgb[2]},${b.a})`);
    g.addColorStop(1, `rgba(${b.rgb[0]},${b.rgb[1]},${b.rgb[2]},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(r.x, r.y, r.w, r.h);
  }
  ctx.restore();
}

/** 生活区：表示"只记变化的透明片"，按 elapsed 从左向右推进覆盖，覆盖到的部分一路变暗。 */
function drawChangeSheet(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  elapsed: number,
  drift: number
): void {
  const cov = clamp(elapsed, 0, 1);
  if (cov <= 0.004) return;
  const cw = Math.max(3, r.w * cov);

  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, cw, r.h);
  ctx.clip();

  drawPrint(ctx, r.x, r.y, r.w, r.h, { alpha: 0.5 });
  drawScreen(ctx, r.x, r.y, r.w, r.h, 10, { alpha: 0.32 });

  // drift ≤ 0 且单调下降：只记变化的那一层只会一路变暗，不会自己走回来。
  const a = clamp(-drift * 0.9, 0, 0.56);
  if (a > 0.004) {
    ctx.fillStyle = `rgba(33,50,74,${a})`;
    ctx.fillRect(r.x, r.y, cw, r.h);
  }
  ctx.restore();

  // 推进前沿
  ctx.save();
  ctx.strokeStyle = PAPER.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(Math.round(r.x + cw) + 0.5, r.y + 2);
  ctx.lineTo(Math.round(r.x + cw) + 0.5, r.y + r.h - 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * 一块印样：底色随 gain 平移，条纹本身的对比度固定，最后压一条 2px 硬描边。
 * gain 只改整体明暗基准，绝不改锐度 —— 这是本模块的论点。
 * 所有覆盖层的不透明度、条纹对比度、描边宽度都与 gain 无关，
 * 所以两侧的对比度始终逐像素相同，只有整体明暗不同。
 */
function drawStripePanel(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  gain: number,
  edgeColor: string
): void {
  drawPrint(ctx, r.x, r.y, r.w, r.h);

  // 整块面板的明暗基准（固定不透明度的一层灰调：对比度只被乘以同一个常数）
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = grey(0.78 * gain);
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.restore();

  const padX = 28;
  const padY = 30;
  const bx = r.x + padX;
  const bw = r.w - padX * 2;
  const by = r.y + padY;
  const bh = r.h - padY * 2;
  const mid = bx + bw / 2;

  // 条带本体：底色随 gain 走，条纹对比度恒定
  ctx.save();
  ctx.beginPath();
  ctx.rect(bx, by, bw, bh);
  ctx.clip();
  ctx.fillStyle = grey(0.72 * gain);
  ctx.fillRect(bx, by, bw, bh);
  ctx.globalAlpha = 0.3;
  drawStripes(ctx, bx, by, bw, bh, 24, { contrast: 0.9 });
  ctx.globalAlpha = 1;
  // 固定的明暗台阶：制造一条真正锐利的边缘（两侧完全一样）
  ctx.fillStyle = 'rgba(33,50,74,0.18)';
  ctx.fillRect(mid, by, bw / 2, bh);
  ctx.restore();

  // 2px 硬描边：两侧线宽、位置、锐度完全一致，只有颜色随状态变化
  ctx.save();
  ctx.strokeStyle = edgeColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(Math.round(mid) + 0.5, by - 5);
  ctx.lineTo(Math.round(mid) + 0.5, by + bh + 5);
  ctx.stroke();
  ctx.restore();
}

/** 明暗条上某个亮度值对应的横坐标：量程 0.4 → 1.6，1.0 落在正中。 */
function barX(r: Rect, v: number): number {
  return lerp(r.x, r.x + r.w, clamp((v - BAR_MIN) / (BAR_MAX - BAR_MIN), 0, 1));
}

/**
 * 一块面板的明暗条：底板 + 真实亮度 1.0 的绿色虚线刻度 + 当前亮度指示块，
 * 条两端标裸数字 0.4 / 1.6，中间刻度处标 1.0。
 * 指示块颜色由调用方给：漂移中 PAPER.red，已锚定 PAPER.green。
 */
function drawBrightnessBar(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  gain: number,
  blockColor: string
): void {
  ctx.save();
  ctx.fillStyle = PAPER.print;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = PAPER.axis;
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);

  // 真实亮度 1.0 的虚线刻度（绿色）
  const tick = Math.round(barX(r, 1)) + 0.5;
  ctx.strokeStyle = PAPER.green;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(tick, r.y - 2);
  ctx.lineTo(tick, r.y + r.h + 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 当前亮度指示块（不超出条的两端）
  const bw = 12;
  const cx = clamp(barX(r, gain), r.x + bw / 2, r.x + r.w - bw / 2);
  ctx.fillStyle = blockColor;
  ctx.fillRect(cx - bw / 2, r.y, bw, r.h);
  ctx.restore();

  // 刻度数字：裸数字，无单位
  const ty = r.y + r.h + 13;
  ctx.save();
  ctx.font = `11px ${FONT}`;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = PAPER.muted;
  ctx.fillText('0.4', r.x, ty);
  ctx.textAlign = 'right';
  ctx.fillText('1.6', r.x + r.w, ty);
  ctx.textAlign = 'center';
  ctx.fillStyle = PAPER.green;
  ctx.fillText('1.0', barX(r, 1), ty);
  ctx.restore();
}

/** 明暗条旁的当前亮度基准：裸数字，两位小数。 */
function drawBaseNumber(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  value: number,
  color: string
): void {
  ctx.save();
  ctx.font = `600 16px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.fillText(value.toFixed(2), x, y);
  ctx.restore();
}

function render(ctx: CanvasRenderingContext2D, H: number, s: SceneState): void {
  const narrow = H > H_WIDE;
  const f = frameFor(narrow);

  const drift = baseline(s.elapsed) - 1;
  const leftGain = baseline(s.elapsed);
  // 未勾选：右侧与左侧完全相同（同步漂移）；勾选后立刻锁在 1.0 并保持。
  const rightGain = s.anchored ? 1 : leftGain;
  const leftColor = PAPER.red;
  const rightColor = s.anchored ? PAPER.green : PAPER.red;

  clearScene(ctx, W, H);

  // 生活区：原件 → 变化片
  drawLifeOriginal(ctx, f.life);
  drawChangeSheet(ctx, f.life, s.elapsed, drift);

  // 对比区：左 边框 → 条带 → 边缘 → 明暗条；右 同上
  drawStripePanel(ctx, f.left, leftGain, leftColor);
  drawStripePanel(ctx, f.right, rightGain, rightColor);
  drawBrightnessBar(ctx, f.barLeft, leftGain, leftColor);
  drawBrightnessBar(ctx, f.barRight, rightGain, rightColor);

  // 至多 2 个短标签 + 1 个图例（本画布不画事件点）
  drawSceneLabel(ctx, f.labelLeft.x, f.labelLeft.y, '只用事件');
  drawSceneLabel(ctx, f.labelRight.x, f.labelRight.y, '+ RGB 锚定');
  drawBaseNumber(ctx, f.valueLeft.x, f.valueLeft.y, leftGain, leftColor);
  drawBaseNumber(ctx, f.valueRight.x, f.valueRight.y, rightGain, rightColor);
  drawLegend(ctx, f.legend.x, f.legend.y, [
    { color: PAPER.green, label: '刻度 1.0' },
    { color: rightColor, label: '当前基准' },
  ]);
}

export const M3_2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<SceneState>({ elapsed: 0, running: false, anchored: false });
  const phaseRef = useRef<Phase>('idle');
  const baseRef = useRef(1);

  const [anchored, setAnchored] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [base, setBase] = useState(1);

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
    let last = 0;
    let ready = false;

    const loop = (time: number) => {
      const shown = canvas.getBoundingClientRect().width;
      const wantH = shown > 0 && shown < 720 ? H_NARROW : H_WIDE;
      if (wantH !== H) {
        H = wantH;
        try {
          ctx = setupCanvas(canvas, W, H);
        } catch {
          return;
        }
      }

      const s = sceneRef.current;
      const dt = last === 0 ? 0 : Math.min(64, time - last);
      last = time;

      if (s.running) {
        s.elapsed = clamp(s.elapsed + dt / DURATION, 0, 1);
        if (s.elapsed >= 1) {
          s.running = false;
          if (phaseRef.current === 'running') {
            phaseRef.current = 'done';
            setPhase('done');
          }
        }
      }

      // 反馈里的实时基准：左侧（只用事件）一路变暗。
      const g = baseline(s.elapsed);
      if (Math.abs(g - baseRef.current) >= 0.005) {
        baseRef.current = g;
        setBase(g);
      }

      render(ctx, H, s);

      if (!ready) {
        ready = true;
        canvas.classList.add('is-ready');
      }
      raf = window.requestAnimationFrame(loop);
    };

    const start = () => {
      if (raf === 0) {
        last = 0;
        raf = window.requestAnimationFrame(loop);
      }
    };
    const stop = () => {
      if (raf !== 0) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  // 勾选 / 取消复选框都重置 elapsed = 0 并重新推进。
  const restart = (nextAnchored: boolean) => {
    const s = sceneRef.current;
    s.anchored = nextAnchored;
    s.elapsed = 0;
    s.running = true;
    phaseRef.current = 'running';
    baseRef.current = 1;
    setAnchored(nextAnchored);
    setPhase('running');
    setBase(1);
  };

  let feedback: { text: string; cls: string };
  if (anchored) {
    feedback = {
      cls: 'good',
      text:
        '把 RGB 的绝对亮度对上去，明暗条的指示块回到刻度上，而事件带来的边缘锐度一点没丢。论文里那个上下文特征提取器，干的就是这件事。',
    };
  } else if (phase === 'idle') {
    feedback = {
      cls: 'info',
      text: '两侧从同一起点、同一时间基出发，唯一区别是要不要对绝对亮度。按开始，看下面那两条明暗条。',
    };
  } else {
    feedback = {
      cls: 'bad',
      text: `边缘一直很锐利，但整幅画面在一路变暗（当前基准 ${base.toFixed(
        2
      )}）。事件记的是"变化了多少"，它不知道本来有多亮——缺的那块常数会一直累积下去。`,
    };
  }

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H_WIDE}
        aria-label="只记变化够不够"
      />
      <div className="ctrl">
        <button type="button" className="tiny" onClick={() => restart(anchored)}>
          {phase === 'done' ? '重播' : '开始'}
        </button>
        <label>
          <input
            type="checkbox"
            checked={anchored}
            onChange={(e) => restart(e.target.checked)}
          />
          把 RGB 的绝对亮度对上去
        </label>
      </div>
      <div
        className={`feedback ${feedback.cls}`}
        dangerouslySetInnerHTML={{ __html: feedback.text }}
      />
    </div>
  );
};

export default M3_2;
