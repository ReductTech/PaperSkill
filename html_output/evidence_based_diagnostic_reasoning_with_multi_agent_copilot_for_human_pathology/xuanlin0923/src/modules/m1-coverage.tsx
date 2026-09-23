import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { SKIN, clearScene, drawLabel, drawLegend, drawSlide, drawTissueField } from './viz-kit';

// 模块 1.1 —— 一个区域看不完一张切片。
// 操作对象 = 论文 Figure 4 甲状腺病例的真实切片与真实 20× 血管侵犯位置。
// 学习者在缩略图上拖出一个 896×896 等效的 20× 方形镜下取景框；真病灶固定归一化
// (0.30, 0.62)（对应原文 20× 的 (25000, 10000)），初始不可见，落在 0.12 内才算命中。
// 画法：一张可辨认的玻璃载玻片 + 一块 H&E 组织切片，组织上叠一个方形取景框，
//       框内是 20× 镜下视野（正常腺体与细胞；命中时出现血管内肿瘤细胞）。
//       所有坐标 / 倍率 / token / 原文回报都写在 DOM 详情区。

const W = 1080;
const H = 280;

// ---- 玻片与组织 H&E 区域的画布几何 ----
const SLIDE = { x: 30, y: 40, w: 570, h: 190 };
/** 组织切片（H&E section）在画布上的范围：与下面的归一化映射一一对应。 */
const TISSUE = { x: 62, y: 68, w: 516, h: 152 };

/** 896×896 在组织上的等效边长（取景框的边长）。 */
const BOX = 121.8492;
const FRAME = BOX / 2;

const PICK_MIN = {
  x: TISSUE.x + BOX / 2,
  y: TISSUE.y + BOX / 2,
};
const PICK_MAX = {
  x: TISSUE.x + TISSUE.w - BOX / 2,
  y: TISSUE.y + TISSUE.h - BOX / 2,
};

/** 取景框内 20× 镜下视野的半径（对应的组织宽度即 896×896 的等效边长）。 */
const FIELD_R = BOX / 2;

// ---- 真实数据（原文 Figure 4 甲状腺病例）----
/** 真病灶：原文 20× 关键 ROI (25000, 10000) 的归一化位置。 */
const VESSEL = { x: 0.3, y: 0.62 };
/** 命中半径：归一化 0.12。 */
const HIT_R = 0.12;

const REAL_REPORT_HIT =
  '20×：肿瘤细胞核增大、包膜透亮，侵入内皮衬里的血管，在滤泡结构背景下确认滤泡型甲状腺癌（FTC）。';

const BENIGN_REPORT =
  '包膜完整的结节、细胞均匀、异型性小，未见侵犯，倾向良性滤泡性病变。';

const FEEDBACK_MISS =
  '这一个区域里只有包膜完整的结节和均匀滤泡：PathChat+ 也只能回答『良性滤泡性病变』。真正的血管侵犯在别处——单看一个区域，你漏掉了它。';

const FEEDBACK_HIT =
  '这次命中了血管侵犯：核增大、包膜透亮、侵入内皮衬里的血管。但系统不能靠运气——它必须自己决定看哪里。';

interface Pick {
  x: number;
  y: number;
}

function distNorm(a: Pick, b: Pick): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** 归一化坐标 → 原文 0–50000 量级的整数坐标。 */
function toSlideCoord(v: number): number {
  return Math.round(v * 50000);
}

interface FieldSpec {
  x: number;
  y: number;
  r: number;
  lesion: 'none' | 'vessel';
}

/** 取景框内 20× 镜下视野的位置与形态：视野圈内切于方形取景框。 */
function fieldFor(p: Pick, hit: boolean): FieldSpec {
  const px = TISSUE.x + p.x * TISSUE.w;
  const py = TISSUE.y + p.y * TISSUE.h;
  const vx = TISSUE.x + VESSEL.x * TISSUE.w;
  const vy = TISSUE.y + VESSEL.y * TISSUE.h;
  // 命中时把视野中心推向病灶，让血管内肿瘤细胞团落在圆形视野中央。
  const k = hit ? 0.55 : 0;
  const cx = px + (vx - px) * k;
  const cy = py + (vy - py) * k;
  const bx = clamp(cx, TISSUE.x + FRAME, TISSUE.x + TISSUE.w - FRAME);
  const by = clamp(cy, TISSUE.y + FRAME, TISSUE.y + TISSUE.h - FRAME);
  return {
    x: clamp(cx, bx - FRAME + FIELD_R, bx + FRAME - FIELD_R),
    y: clamp(cy, by - FRAME + FIELD_R, by + FRAME - FIELD_R),
    r: FIELD_R,
    lesion: hit ? 'vessel' : 'none',
  };
}

export const M1Coverage: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<Pick>({ x: 0.5, y: 0.5 });
  const rafRef = useRef<number | null>(null);
  const [pick, setPick] = useState<Pick>({ x: 0.5, y: 0.5 });

  const hit = distNorm(pick, VESSEL) < HIT_R;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (p: Pick) => {
      ctx.clearRect(0, 0, W, H);
      clearScene(ctx, W, H);

      const onTarget = distNorm(p, VESSEL) < HIT_R;
      const acc = onTarget ? SKIN.green : SKIN.blue;
      const field = fieldFor(p, onTarget);

      // ---- 一张真实的玻璃载玻片（磨砂标签端 + H&E 组织切片）----
      drawSlide(ctx, SLIDE.x, SLIDE.y, SLIDE.w, SLIDE.h, {
        tissue: 'section',
        label: 'H&E',
      });
      drawLabel(ctx, SLIDE.x + 14, 245, '切片', SKIN.muted, 13);

      // ---- 方形镜下取景框（896×896 等效），框内是该处的 20× 视野 ----
      const bx = clamp(
        TISSUE.x + p.x * TISSUE.w,
        TISSUE.x + FRAME,
        TISSUE.x + TISSUE.w - FRAME
      );
      const by = clamp(
        TISSUE.y + p.y * TISSUE.h,
        TISSUE.y + FRAME,
        TISSUE.y + TISSUE.h - FRAME
      );

      // 方形取景框内的 20× 镜下视野（视野圈内切于取景框）。
      drawTissueField(ctx, field.x - field.r, field.y - field.r, field.r * 2, field.r * 2, {
        seed: 31,
        magnification: 20,
        lesion: field.lesion,
      });

      // 命中范围内的血管侵犯位置：命中后才显形，避免提前泄漏病灶位置。
      const vx = TISSUE.x + VESSEL.x * TISSUE.w;
      const vy = TISSUE.y + VESSEL.y * TISSUE.h;
      if (onTarget) {
        ctx.save();
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = SKIN.green;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(vx, vy, HIT_R * TISSUE.w, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        ctx.beginPath();
        ctx.fillStyle = SKIN.green;
        ctx.arc(vx, vy, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 取景框本体：四角长把手 + 四边细框（可拖动的取景框观感）。
      ctx.save();
      ctx.strokeStyle = acc;
      ctx.globalAlpha = 0.65;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(bx - FRAME, by - FRAME, BOX, BOX);
      ctx.globalAlpha = 1;
      ctx.lineWidth = 2.6;
      const corner = BOX * 0.34;
      const corners: [number, number, number, number][] = [
        [bx - FRAME, by - FRAME, 1, 1],
        [bx + FRAME, by - FRAME, -1, 1],
        [bx - FRAME, by + FRAME, 1, -1],
        [bx + FRAME, by + FRAME, -1, -1],
      ];
      ctx.beginPath();
      for (const c of corners) {
        ctx.moveTo(c[0] + c[2] * corner, c[1]);
        ctx.lineTo(c[0], c[1]);
        ctx.lineTo(c[0], c[1] + c[3] * corner);
      }
      ctx.stroke();
      ctx.fillStyle = acc;
      for (const c of corners) {
        ctx.fillRect(c[0] - 3.2, c[1] - 3.2, 6.4, 6.4);
      }
      ctx.restore();

      drawLegend(ctx, 676, 214, [
        { label: onTarget ? '命中' : '未命中', color: acc },
        { label: '896×896', color: SKIN.blue },
        { label: '20×', color: SKIN.muted },
      ]);
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };

    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  /** CSS 像素 → 1080×280 内蕴坐标，再归一化并 clamp 在组织内。 */
  const moveTo = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = (clientX - rect.left) * (W / rect.width);
    const y = (clientY - rect.top) * (H / rect.height);
    const next: Pick = {
      x: (clamp(x, PICK_MIN.x, PICK_MAX.x) - TISSUE.x) / TISSUE.w,
      y: (clamp(y, PICK_MIN.y, PICK_MAX.y) - TISSUE.y) / TISSUE.h,
    };
    stateRef.current = next;
    setPick(next);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    moveTo(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    e.preventDefault();
    moveTo(e.clientX, e.clientY);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      <div className="ctrl">
        <label htmlFor="m1-pick-x">
          选中区域（原文 0–50000 坐标） <span className="val">x={toSlideCoord(pick.x)}</span>
        </label>
        <input
          id="m1-pick-x"
          type="range"
          min={0}
          max={1000}
          value={Math.round(pick.x * 1000)}
          aria-label="选中区域的横向位置"
          onChange={(e) => {
            const next = { x: Number(e.target.value) / 1000, y: pick.y };
            stateRef.current = next;
            setPick(next);
          }}
        />
        <input
          id="m1-pick-y"
          type="range"
          min={0}
          max={1000}
          value={Math.round(pick.y * 1000)}
          aria-label="选中区域的纵向位置"
          onChange={(e) => {
            const next = { x: pick.x, y: Number(e.target.value) / 1000 };
            stateRef.current = next;
            setPick(next);
          }}
        />
        <span className="val">y={toSlideCoord(pick.y)}</span>
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">选中坐标（0–50000）</div>
          <div className="v">
            ({toSlideCoord(pick.x)}, {toSlideCoord(pick.y)})
          </div>
        </div>
        <div className="metric">
          <div className="l">倍率</div>
          <div className="v">20×</div>
        </div>
        <div className="metric">
          <div className="l">取图尺寸</div>
          <div className="v">896×896</div>
        </div>
        <div className="metric">
          <div className="l">单图 token</div>
          <div className="v">640</div>
        </div>
      </div>
      <div className="metrics">
        <div className="metric" style={{ gridColumn: '1 / -1' }}>
          <div className="l">PathChat+ 对该区域给出的描述（原文要点）</div>
          <div className="v">{hit ? REAL_REPORT_HIT : BENIGN_REPORT}</div>
        </div>
      </div>
      <div className={'feedback ' + (hit ? 'good' : 'bad')}>
        {hit ? FEEDBACK_HIT : FEEDBACK_MISS}
      </div>
      <div className="feedback">
        固定注记：原文统计 20× 下每张切片平均 1020 ± 783 个组织 ROI——一个 896×896
        的框绝无可能覆盖整张切片；专家 10 个 ROI 直供 PathChat+ 的 top-1 只有 0.800，低于带导航的 0.860。
      </div>
    </div>
  );
};

export default M1Coverage;
