import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  SKIN,
  clearScene,
  drawLabel,
  drawMiniBars,
  drawSlide,
  drawTissueField,
} from './viz-kit';

// 模块 2.1 —— 你交给模型的到底是什么。
// 4 个热点 = 论文 Figure 4 甲状腺病例的 4 个真实 ROI（原文坐标 / 原文倍率），
// 点击即在 DOM 详情区显示该倍率下的取图尺寸、token 数与该倍率下 PathChat+ 的实际回报。
// 画法：一张真实的玻璃载玻片 + H&E 组织，组织上 4 个圆形「镜下视野圈」；
//       被选中的圈用引线连到右侧一个大圆视野，按该 ROI 的真实倍率渲染
//       （1.25×/5× 看腺体，20× 看细胞核）；右侧保留 drawMiniBars 的 token 数值对照。

const W = 1080;
const H = 280;

// ---- 玻片与组织区域几何 ----
const SLIDE = { x: 30, y: 40, w: 570, h: 190 };
const TISSUE = { x: 62, y: 68, w: 516, h: 152 };

// ---- 右侧大圆视野（选中 ROI 的放大视野）----
const VIEW_CX = 782;
const VIEW_CY = 150;
const VIEW_R = 62;

// ---- 右侧 token 数值对照 ----
const BARS_X = 842;
const BARS_Y = 44;
const BARS_W = 218;
const BARS_H = 64;

/** ROI 圆圈的半径与点击命中半径（不是方格）。 */
const RING_R = 20;
const TAP_R = 44;

/** 原文 1.25× 回报（第 1 轮）的要点。 */
const REPORT_125 =
  '1.25×：多个包膜完整的结节，细胞密集均匀、异型性极小，倾向良性滤泡性病变；建议对选定区域做更高倍复查。';

/** 原文 5× 回报（第 2 轮）的要点。 */
const REPORT_5 =
  '5×：结节边界清楚、包膜完整，滤泡大小不一但上皮均匀，未见侵犯，支持良性滤泡性过程。';

/** 原文 20× 回报（第 3 轮，血管侵犯）的要点。 */
const REPORT_20 =
  '20×：肿瘤细胞核增大、包膜透亮，侵入内皮衬里的血管，在滤泡结构背景下确认滤泡型甲状腺癌（FTC）。';

interface Roi {
  id: string;
  label: string;
  zoomLabel: string;
  coord: string;
  size: string;
  tiles: number;
  tokens: number;
  /** 该 ROI 的真实倍率，直接决定圆形视野里画腺体还是画细胞核。 */
  magnification: 1.25 | 5 | 20;
  /** 归一化热点位置（由原文坐标 ÷ 50000 得到，仅用于把热点放到缩略图对应处）。 */
  n: { x: number; y: number };
  mine: string;
  report: string;
}

const ROIS: Roi[] = [
  {
    id: 'A',
    label: 'A',
    zoomLabel: '1.25×',
    coord: '(24949, 19719)',
    size: '448×448',
    tiles: 1,
    tokens: 128,
    magnification: 1.25,
    n: { x: 24949 / 50000, y: 19719 / 50000 },
    mine: '原文第 1 轮 1.25× 关键 ROI',
    report: REPORT_125,
  },
  {
    id: 'B',
    label: 'B',
    zoomLabel: '5×',
    coord: '(38234, 27000)',
    size: '448×448',
    tiles: 1,
    tokens: 128,
    magnification: 5,
    n: { x: 38234 / 50000, y: 27000 / 50000 },
    mine: '原文第 2 轮 5× 关键 ROI（包膜与实质交界）',
    report: REPORT_5,
  },
  {
    id: 'C',
    label: 'C',
    zoomLabel: '20×',
    coord: '(25000, 10000)',
    size: '896×896',
    tiles: 4,
    tokens: 640,
    magnification: 20,
    n: { x: 25000 / 50000, y: 10000 / 50000 },
    mine: '原文第 3 轮 20× 关键 ROI（血管侵犯）',
    report: REPORT_20,
  },
  {
    id: 'D',
    label: 'D',
    zoomLabel: '20×',
    coord: '(35000, 35000)',
    size: '896×896',
    tiles: 4,
    tokens: 640,
    magnification: 20,
    n: { x: 35000 / 50000, y: 35000 / 50000 },
    mine: '原文第 3 轮 20× 关键 ROI 之一（原文未单列该位置的回报文本）',
    report: REPORT_20,
  },
];

const FEEDBACK_LOW =
  '1.25×/5× 的目标是结构：范围大、能看包膜与滤泡排列，但细胞级形态看不清。';

const FEEDBACK_HIGH =
  '20× 且 896×896：单图 640 token，细胞核与血管壁的细节才进入可描述的范围。';

/** ROI 热点在画布上的位置。 */
function hotspotOf(roi: Roi): { x: number; y: number } {
  return { x: TISSUE.x + roi.n.x * TISSUE.w, y: TISSUE.y + roi.n.y * TISSUE.h };
}

/** 每个 ROI 圆圈的展示颜色：640 token 为高倍绿，128 token 为低倍蓝。 */
function roiColor(roi: Roi): string {
  return roi.tokens >= 640 ? SKIN.green : SKIN.blue;
}

function hitTest(x: number, y: number): string | null {
  let best: string | null = null;
  let bestD = TAP_R;
  for (const roi of ROIS) {
    const p = hotspotOf(roi);
    const dx = p.x - x;
    const dy = p.y - y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d <= bestD) {
      bestD = d;
      best = roi.id;
    }
  }
  return best;
}

export const M2ZoomInset: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ id: string }>({ id: 'C' });
  const rafRef = useRef<number | null>(null);
  const [id, setId] = useState('C');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { id: string }) => {
      ctx.clearRect(0, 0, W, H);
      clearScene(ctx, W, H);

      const sel = ROIS.find((roi) => roi.id === s.id) ?? ROIS[2];

      // ---- 左：一张玻璃载玻片 + H&E 组织 + 4 个圆形镜下视野圈 ----
      drawSlide(ctx, SLIDE.x, SLIDE.y, SLIDE.w, SLIDE.h, {
        tissue: 'section',
        label: 'H&E',
      });
      drawLabel(ctx, SLIDE.x + 14, 245, '切片', SKIN.muted, 13);

      for (const roi of ROIS) {
        const p = hotspotOf(roi);
        const on = roi.id === sel.id;
        const color = on ? roiColor(roi) : SKIN.muted;

        if (on) {
          // 选中圈：淡色盘 + 外圈脉冲环 + 引线连到右侧大视野。
          ctx.save();
          ctx.globalAlpha = 0.22;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, RING_R, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          ctx.save();
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, RING_R + 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          ctx.save();
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(p.x + RING_R + 10, p.y);
          ctx.lineTo(VIEW_CX - VIEW_R, VIEW_CY);
          ctx.stroke();
          ctx.restore();
        }

        // 圆形视野圈本体：玻璃边 + 瞳环。
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = on ? 3 : 1.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, RING_R, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(p.x, p.y, RING_R - 4, 0, Math.PI * 2);
        ctx.lineWidth = 1;
        ctx.strokeStyle = on ? color : SKIN.muted;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
      }

      // ---- 右：选中 ROI 的圆形高倍视野（按真实倍率渲染）----
      ctx.save();
      ctx.beginPath();
      ctx.arc(VIEW_CX, VIEW_CY, VIEW_R, 0, Math.PI * 2);
      ctx.clip();
      drawTissueField(ctx, VIEW_CX - VIEW_R, VIEW_CY - VIEW_R, VIEW_R * 2, VIEW_R * 2, {
        seed: sel.id.charCodeAt(0),
        magnification: sel.magnification,
        lesion: 'none',
      });
      ctx.restore();

      // 目镜金属环。
      ctx.save();
      ctx.strokeStyle = SKIN.glassEdge;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(VIEW_CX, VIEW_CY, VIEW_R + 2.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = roiColor(sel);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(VIEW_CX, VIEW_CY, VIEW_R + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      drawLabel(ctx, VIEW_CX - VIEW_R - 4, VIEW_CY - VIEW_R - 12, sel.zoomLabel, roiColor(sel), 14);

      // ---- 右：token 数值对照（technical inset）----
      drawMiniBars(
        ctx,
        BARS_X,
        BARS_Y,
        BARS_W,
        BARS_H,
        ROIS.map((roi) => ({
          value: roi.tokens,
          color: roi.id === sel.id ? roiColor(roi) : SKIN.muted,
        })),
        640
      );
      drawLabel(ctx, BARS_X, BARS_Y - 14, '单图 token', SKIN.muted, 13);
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

  const choose = (next: string) => {
    stateRef.current = { id: next };
    setId(next);
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    const next = hitTest(clamp(x, 0, W), clamp(y, 0, H));
    if (next) choose(next);
  };

  const current = ROIS.find((roi) => roi.id === id) ?? ROIS[2];
  const high = current.tokens >= 640;

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onCanvasClick}
      />
      <div className="ctrl">
        {ROIS.map((roi) => (
          <button
            key={roi.id}
            type="button"
            className={'chip' + (roi.id === id ? ' selected' : '')}
            onClick={() => choose(roi.id)}
          >
            {roi.label} {roi.coord} @{roi.zoomLabel}
          </button>
        ))}
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">关键 ROI（原文坐标）</div>
          <div className="v">
            {current.label} {current.coord}
          </div>
        </div>
        <div className="metric">
          <div className="l">倍率</div>
          <div className="v">{current.zoomLabel}</div>
        </div>
        <div className="metric">
          <div className="l">取图尺寸</div>
          <div className="v">{current.size}</div>
        </div>
        <div className="metric">
          <div className="l">瓦片数</div>
          <div className="v">{current.tiles}</div>
        </div>
        <div className="metric">
          <div className="l">单图 token</div>
          <div className="v">{current.tokens}</div>
        </div>
        <div className="metric">
          <div className="l">该 ROI 在原文中的角色</div>
          <div className="v">{current.mine}</div>
        </div>
      </div>
      <div className="metrics">
        <div className="metric" style={{ gridColumn: '1 / -1' }}>
          <div className="l">
            PathChat+ 在 {current.zoomLabel} 下的实际回报（原文要点）
            {current.id === 'D' ? '——20× 回报，与 C 同一倍率' : ''}
          </div>
          <div className="v">{current.report}</div>
        </div>
      </div>
      <div className={'feedback ' + (high ? 'good' : '')}>
        {high ? FEEDBACK_HIGH : FEEDBACK_LOW}
      </div>
      <div className="feedback">
        注记：原文 PathChat+ 的取图规则为 448×448 瓦片、最多 4 块，单图 128–640 token。448×448 只有 1
        块瓦片、不加缩略图 → 128 token；896×896 为 2×2 四块瓦片再加一张缩略图 → 5 × 128 = 640 token。
      </div>
    </div>
  );
};

export default M2ZoomInset;
