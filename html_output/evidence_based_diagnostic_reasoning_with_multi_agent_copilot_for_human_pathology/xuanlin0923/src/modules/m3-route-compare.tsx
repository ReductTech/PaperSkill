import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  SKIN,
  clearScene,
  drawBench,
  drawLabel,
  drawLegend,
  drawMicroscope,
  drawTissueField,
} from './viz-kit';

// 模块 3.1 —— 同一起点：单区域 vs 先粗后细。
// 一个「开始对照」按钮驱动上下两块等宽面板，同一时间基准推进；两块面板用的是
// 论文 Figure 4 甲状腺病例的同一张切片、同一个位置，结论却不同：
//   上＝把全部预算给一个 20× 区域（专家 ROI 直供协议）→ 良性滤泡性病变
//   下＝1.25× 粗扫 → 5× 查包膜与实质交界 → 20× 确认血管侵犯 → 滤泡型甲状腺癌（FTC）
// 画法：每块面板一台可辨认的显微镜；镜下视野随时间基准演进，上＝始终 20×（终态正常
//       组织，红环），下＝1.25× → 5× → 20×（终态血管内肿瘤细胞，绿环）。
//       结论与数字写在 DOM。

const W = 1080;
const H = 280;

// ---- 上下两块面板 ----
const PANEL_X = 22;
const PANEL_W = 1036;
const PANEL_H = 120;
const UPPER_Y = 6;
const LOWER_Y = 136;

// ---- 面板内的显微镜与镜下视野 ----
const SCOPE_X = PANEL_X + 212;
const SCOPE_SCALE = 0.58;
const VIEW_CX = PANEL_X + 500;
const VIEW_R = 54;

const RUN_MS = 3200;
const HOLD_MS = 2000;

type Run = 'idle' | 'running' | 'done';

const RUNNING_FEEDBACK = '两条路线从同一起点出发，用的是同一张切片。';

const UPPER_FEEDBACK =
  '只看一处：原文的固定 ROI 协议给的是 10 个专家 ROI，top-1 为 0.800；只靠其中一个区域，血管侵犯不在其中。';

const LOWER_FEEDBACK =
  '先粗后细：top-1 0.860；1.25× 与 5× 都指向良性，20× 才在一个小位置找到血管侵犯。';

interface Stage {
  mag: 1.25 | 5 | 20;
  label: string;
  color: string;
}

/** 先粗后细的三档：真实倍率 1.25× → 5× → 20×。 */
const STAGES: Stage[] = [
  { mag: 1.25, label: '1.25×', color: SKIN.blue },
  { mag: 5, label: '5×', color: SKIN.purple },
  { mag: 20, label: '20×', color: SKIN.green },
];

/** 真实倍率 → 物镜转盘档位（0=低倍 4×、1=中倍 10×、2=高倍 40×）。 */
function objectiveAt(p: number): 0 | 1 | 2 {
  const mag = magAt(p);
  if (mag <= 1.25) return 0;
  if (mag <= 5) return 1;
  return 2;
}

function magAt(p: number): number {
  if (p < 0.3) return 1.25;
  if (p < 0.64) return 5;
  return 20;
}

/** 0→1→2 连续过渡的物镜盘参数，让转盘随倍率转动而不是瞬跳。 */
function turretIndexOf(p: number): number {
  if (p < 0.26) return 0;
  if (p < 0.34) return easeOutCubic((p - 0.26) / 0.08);
  if (p < 0.58) return 1;
  if (p < 0.66) return 1 + easeOutCubic((p - 0.58) / 0.08);
  return 2;
}

/** 镜下圆形视野：裁圆 + 金属目镜环。 */
function drawViewport(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  mag: number,
  lesion: 'none' | 'vessel',
  ringColor: string,
  seed: number
): void {
  const magnification: 1.25 | 5 | 20 = mag <= 1.25 ? 1.25 : mag <= 5 ? 5 : 20;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, VIEW_R, 0, Math.PI * 2);
  ctx.clip();
  drawTissueField(ctx, cx - VIEW_R, cy - VIEW_R, VIEW_R * 2, VIEW_R * 2, {
    seed,
    magnification,
    lesion,
  });
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = SKIN.metal;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, VIEW_R + 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, VIEW_R + 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  drawLabel(ctx, cx - VIEW_R - 6, cy - VIEW_R - 14, `${magnification}×`, ringColor, 14);
}

export const M3RouteCompare: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const runRef = useRef<{ startAt: number; t: number; active: boolean }>({
    startAt: 0,
    t: 0,
    active: false,
  });
  const [run, setRun] = useState<Run>('idle');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      clearScene(ctx, W, H);

      const p = clamp(t, 0, 1);
      const finished = p >= 1;

      // ---- 上：把全部预算给一个 20× 区域 ----
      drawBench(ctx, PANEL_X, UPPER_Y, PANEL_W, PANEL_H);
      drawLabel(ctx, PANEL_X + 8, UPPER_Y + 14, '只看一处', SKIN.red, 14);
      drawMicroscope(ctx, SCOPE_X, UPPER_Y + PANEL_H - 26, SCOPE_SCALE, {
        objective: objectiveAt(p),
      });
      // 始终 20×、只看一个区域：终态是正常滤泡组织，看不到血管侵犯。
      drawViewport(
        ctx,
        VIEW_CX,
        UPPER_Y + PANEL_H / 2,
        20,
        'none',
        finished ? SKIN.red : SKIN.muted,
        41
      );

      // ---- 下：1.25× 粗扫 → 5× 包膜交界 → 20× 血管侵犯 ----
      drawBench(ctx, PANEL_X, LOWER_Y, PANEL_W, PANEL_H);
      drawLabel(ctx, PANEL_X + 8, LOWER_Y + 14, '先粗后细', SKIN.blue, 14);
      const mag = magAt(p);
      const turret = turretIndexOf(p);
      drawMicroscope(ctx, SCOPE_X, LOWER_Y + PANEL_H - 26, SCOPE_SCALE, {
        objective: (turret < 0.5 ? 0 : turret < 1.5 ? 1 : 2) as 0 | 1 | 2,
      });

      const lesion: 'none' | 'vessel' = finished ? 'vessel' : 'none';
      drawViewport(
        ctx,
        VIEW_CX,
        LOWER_Y + PANEL_H / 2,
        mag,
        lesion,
        finished ? SKIN.green : STAGES[mag <= 1.25 ? 0 : mag <= 5 ? 1 : 2].color,
        53
      );

      drawLegend(ctx, PANEL_X + 8, H - 16, [
        { label: '只看一处', color: SKIN.red },
        { label: '先粗后细', color: SKIN.green },
      ]);
    };

    const tick = () => {
      const prog = runRef.current;
      if (prog.active) {
        const elapsed = performance.now() - prog.startAt;
        prog.t = clamp(elapsed / RUN_MS, 0, 1);
        if (elapsed >= RUN_MS + HOLD_MS) {
          prog.active = false;
          setRun('done');
        }
      }
      render(prog.t);
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

  const startRun = () => {
    runRef.current = { startAt: performance.now(), t: 0, active: true };
    setRun('running');
  };

  const done = run === 'done';

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className="chip" onClick={startRun} disabled={run === 'running'}>
          {run === 'idle' ? '开始对照' : done ? '再跑一次' : '运行中…'}
        </button>
        <label>同一起点·同一张切片</label>
      </div>
      <div className="metrics">
        <div className="metric" style={{ gridColumn: '1 / -1' }}>
          <div className="l">上：只看一处 20×（对照：原文固定 ROI 协议为 10 个专家 ROI）终态</div>
          <div className="v">{done ? '良性滤泡性病变' : '—'}</div>
        </div>
        <div className="metric" style={{ gridColumn: '1 / -1' }}>
          <div className="l">下：先粗后细（1.25× → 5× → 20×）终态</div>
          <div className="v">{done ? '滤泡型甲状腺癌（FTC）' : '—'}</div>
        </div>
      </div>
      {done ? (
        <>
          <div className="feedback bad">{UPPER_FEEDBACK}</div>
          <div className="feedback good">{LOWER_FEEDBACK}</div>
        </>
      ) : (
        <div className="feedback">{RUNNING_FEEDBACK}</div>
      )}
      <div className="feedback">
        注记：专家 10 个 ROI 直供 PathChat+（无导航）的 top-1 是 0.800，比 SlideSeek 低 6.0%（p=0.059）；原文的
        1.25× 与 5× 两轮都指向良性，决定性证据只在 20× 的一个小位置上。
      </div>
    </div>
  );
};

export default M3RouteCompare;
