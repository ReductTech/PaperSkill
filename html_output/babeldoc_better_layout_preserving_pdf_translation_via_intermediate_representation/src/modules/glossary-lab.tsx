import React, { useCallback, useEffect, useRef, useState } from 'react';
import { easeInOutQuad, lerp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  MUSEUM_COLORS,
  clearMuseumScene,
  drawCaptionCard,
  drawExhibitFrame,
  drawLegend,
  drawMuseumLabel,
  drawMuseumWall,
  drawTargetSeal,
} from './museum-hero';

const W = 960;
const H = 520;

type GlossaryMode = 'free' | 'guided';

const CARD_POSITIONS = [
  { x: 290, y: 100, page: '第 2 页（教学空间标记）', free: '当前变换矩阵', color: MUSEUM_COLORS.failure },
  { x: 510, y: 154, page: '第 7 页（教学空间标记）', free: '当前转换矩阵', color: MUSEUM_COLORS.emphasis },
  { x: 730, y: 208, page: '第 12 页（教学空间标记）', free: '现行变换矩阵', color: MUSEUM_COLORS.auxiliary },
] as const;

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 12,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, Math.min(radius, width / 2, height / 2));
}

function stampPosition(progress: number) {
  const points = [
    { x: 196, y: 294 },
    { x: 382, y: 88 },
    { x: 602, y: 142 },
    { x: 822, y: 196 },
  ];
  const scaled = Math.min(0.9999, Math.max(0, progress)) * 3;
  const index = Math.floor(scaled);
  const local = easeInOutQuad(scaled - index);
  return {
    x: lerp(points[index].x, points[index + 1].x, local),
    y: lerp(points[index].y, points[index + 1].y, local),
  };
}

function drawStamp(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.18);
  roundedRect(ctx, -11, -34, 22, 35, 6);
  ctx.fillStyle = MUSEUM_COLORS.support;
  ctx.fill();
  roundedRect(ctx, -26, -3, 52, 25, 8);
  ctx.fillStyle = '#fff7ed';
  ctx.fill();
  ctx.strokeStyle = MUSEUM_COLORS.success;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = MUSEUM_COLORS.success;
  ctx.font = '800 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('术语章', 0, 14);
  ctx.restore();
}

function drawScene(ctx: CanvasRenderingContext2D, mode: GlossaryMode, progress: number) {
  clearMuseumScene(ctx, W, H);
  drawMuseumWall(ctx, W, H, { pedestalY: 374 });

  drawExhibitFrame(ctx, 24, 38, 228, 300, {
    fill: '#ffffff',
    stroke: mode === 'guided' ? MUSEUM_COLORS.current : MUSEUM_COLORS.dark,
    lineWidth: mode === 'guided' ? 3 : 2,
  });
  drawMuseumLabel(ctx, '术语表', 44, 68, {
    color: MUSEUM_COLORS.text,
    fontSize: 14,
    fontWeight: 800,
  });
  drawMuseumLabel(ctx, mode === 'guided' ? '已统一' : '尚未注入', 230, 68, {
    color: mode === 'guided' ? MUSEUM_COLORS.success : MUSEUM_COLORS.failure,
    fontSize: 13,
    align: 'right',
    fontWeight: 700,
  });
  ctx.fillStyle = MUSEUM_COLORS.muted;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('批准原名', 45, 104);
  ctx.fillStyle = MUSEUM_COLORS.text;
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.fillText('Current Transformation', 45, 132);
  ctx.fillText('Matrix', 45, 152);
  ctx.fillStyle = MUSEUM_COLORS.current;
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.fillText('→ 当前变换矩阵（CTM）', 45, 193);

  roundedRect(ctx, 43, 218, 190, 88, 9);
  ctx.fillStyle = mode === 'guided' ? 'rgba(39, 68, 110, 0.08)' : '#f8fafc';
  ctx.fill();
  ctx.strokeStyle = mode === 'guided' ? MUSEUM_COLORS.current : MUSEUM_COLORS.border;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = MUSEUM_COLORS.muted;
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('简化提示词', 55, 241);
  ctx.fillStyle = MUSEUM_COLORS.text;
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillText('术语要求：统一译为', 55, 266);
  ctx.fillText('“当前变换矩阵（CTM）”', 55, 287);

  CARD_POSITIONS.forEach((card) => {
    const guided = mode === 'guided';
    const text = guided ? '当前变换矩阵（CTM）' : card.free;
    drawCaptionCard(ctx, card.x, card.y, 190, 104, [card.page, text], {
      fill: '#ffffff',
      stroke: guided ? MUSEUM_COLORS.success : card.color,
      textColor: MUSEUM_COLORS.text,
      fontSize: 12,
      lineHeight: 22,
      padding: 12,
      fontWeight: 650,
    });
  });

  ctx.save();
  ctx.strokeStyle = mode === 'guided' ? MUSEUM_COLORS.current : MUSEUM_COLORS.border;
  ctx.lineWidth = 3;
  ctx.setLineDash(mode === 'guided' ? [] : [7, 6]);
  ctx.beginPath();
  ctx.moveTo(252, 262);
  ctx.bezierCurveTo(330, 340, 590, 338, 826, 310);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  const stamp = mode === 'guided' ? stampPosition(progress) : { x: 196, y: 294 };
  drawStamp(ctx, stamp.x, stamp.y);
  if (mode === 'guided' && progress >= 0.99) drawTargetSeal(ctx, 902, 286, '一致', 21);

  roundedRect(ctx, 280, 344, 652, 88, 12);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = mode === 'guided' ? MUSEUM_COLORS.success : MUSEUM_COLORS.failure;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = mode === 'guided' ? MUSEUM_COLORS.success : MUSEUM_COLORS.failure;
  ctx.font = '800 22px system-ui, sans-serif';
  ctx.fillText(mode === 'guided' ? '3/3' : '1/3', 308, 386);
  ctx.fillStyle = MUSEUM_COLORS.text;
  ctx.font = '700 14px system-ui, sans-serif';
  ctx.fillText('教学计数，不是论文测量值', 378, 382);
  ctx.fillStyle = MUSEUM_COLORS.muted;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('三张卡只用于演示同一术语的译名一致性。', 378, 408);

  drawLegend(
    ctx,
    [
      { label: '示意不一致', color: MUSEUM_COLORS.failure },
      { label: '提示级引导', color: MUSEUM_COLORS.current },
      { label: '示意统一', color: MUSEUM_COLORS.success },
    ],
    585,
    474,
    { columns: 3, fontSize: 12, gap: 12 },
  );
}

export const GlossaryLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const visibleRef = useRef(true);
  const rafRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  const modeRef = useRef<GlossaryMode>('free');
  const [glossaryMode, setGlossaryMode] = useState<GlossaryMode>('free');

  const stopAnimation = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const renderCurrent = useCallback(() => {
    if (ctxRef.current) drawScene(ctxRef.current, modeRef.current, progressRef.current);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    ctxRef.current = ctx;
    drawScene(ctx, 'free', 0);
    canvas.classList.add('is-ready');
    const disconnect = observeCanvas(
      canvas,
      () => {
        visibleRef.current = true;
        progressRef.current = modeRef.current === 'guided' ? 1 : 0;
        renderCurrent();
      },
      () => {
        visibleRef.current = false;
        stopAnimation();
      },
    );
    return () => {
      stopAnimation();
      disconnect();
    };
  }, [renderCurrent, stopAnimation]);

  useEffect(() => {
    modeRef.current = glossaryMode;
    stopAnimation();
    if (glossaryMode === 'free') {
      progressRef.current = 0;
      renderCurrent();
      return;
    }
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (!visibleRef.current || reduced) {
      progressRef.current = 1;
      renderCurrent();
      return;
    }
    progressRef.current = 0;
    const started = performance.now();
    const duration = 960;
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      progressRef.current = easeInOutQuad(t);
      renderCurrent();
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else rafRef.current = null;
    };
    rafRef.current = requestAnimationFrame(tick);
    return stopAnimation;
  }, [glossaryMode, renderCurrent, stopAnimation]);

  const selectMode = (mode: GlossaryMode) => {
    if (mode !== glossaryMode) setGlossaryMode(mode);
  };

  return (
    <div>
      <div className="chip-row" role="radiogroup" aria-label="术语表提示模式">
        <button
          className={`chip ${glossaryMode === 'free' ? 'selected' : ''}`}
          type="button"
          role="radio"
          aria-checked={glossaryMode === 'free'}
          onClick={() => selectMode('free')}
        >
          术语表关闭
        </button>
        <button
          className={`chip ${glossaryMode === 'guided' ? 'selected' : ''}`}
          type="button"
          role="radio"
          aria-checked={glossaryMode === 'guided'}
          onClick={() => selectMode('guided')}
        >
          启用术语表
        </button>
      </div>

      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        className="paper-canvas"
        width={W}
        height={H}
        aria-label="术语印章依次经过三张非连续页面教学卡，展示提示级术语一致性"
      />

      <div className="ctrl">
        <button className="tiny ghost" type="button" onClick={() => selectMode('free')}>
          重置
        </button>
        <span style={{ color: MUSEUM_COLORS.muted, fontSize: 14 }}>
          Current Transformation Matrix → 当前变换矩阵（CTM）
        </span>
      </div>

      {glossaryMode === 'free' ? (
        <div className="feedback bad" aria-live="polite">
          示意结果：同一术语出现 3 种译名；1/3 是教学计数，不是论文实测率。
        </div>
      ) : (
        <>
          <div className="feedback">术语表已注入提示词，正在引导非连续页面采用批准译名。</div>
          <div className="feedback good" aria-live="polite">
            三张示意卡已统一为“当前变换矩阵（CTM）”。这是提示级引导，不保证硬约束命中。
          </div>
        </>
      )}

      <div className="feedback" style={{ borderLeftColor: MUSEUM_COLORS.support }}>
        论文第 3—4 页 §3.3：系统可以自动提取动态术语表，也可以接受用户术语表，再把它注入 LLM 提示词以引导长文档术语一致性。提示词引导不是硬解码保证。
      </div>

      <div style={{ overflowX: 'auto', marginTop: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <caption style={{ textAlign: 'left', color: MUSEUM_COLORS.text, fontWeight: 700, marginBottom: 8 }}>
            80 个代表页｜1—5 主观评分｜TC 越高越好｜术语表/上下文联合消融
          </caption>
          <thead>
            <tr>
              <th scope="col" style={{ textAlign: 'left', padding: 8, borderBottom: `1px solid ${MUSEUM_COLORS.border}` }}>
                配置
              </th>
              <th scope="col" style={{ textAlign: 'right', padding: 8, borderBottom: `1px solid ${MUSEUM_COLORS.border}` }}>
                TC
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" style={{ textAlign: 'left', padding: 8, fontWeight: 600 }}>
                完整 BabelDOC
              </th>
              <td style={{ textAlign: 'right', padding: 8 }}>5.00</td>
            </tr>
            <tr>
              <th scope="row" style={{ textAlign: 'left', padding: 8, fontWeight: 600 }}>
                联合移除术语表/上下文控制
              </th>
              <td style={{ textAlign: 'right', padding: 8 }}>3.00</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="feedback">
        80 个代表页、1–5 主观评分、越高越好：完整系统 TC=5.00；联合移除术语表/上下文控制后 TC=3.00。该消融不能单独归因给术语表。
      </div>

      <div aria-label="判断术语表证据允许的结论" style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        <details>
          <summary className="chip">联合控制与代表页子集的术语一致性相关</summary>
          <div className="feedback good">
            判断正确：联合移除术语表/上下文控制后，代表页子集的 TC 较低；这支持联合组件与术语一致性相关。
          </div>
        </details>
        <details>
          <summary className="chip">术语表保证所有译名命中</summary>
          <div className="feedback bad">提示词引导不是硬保证。</div>
        </details>
        <details>
          <summary className="chip">术语表单独让 TC 提高 2 分</summary>
          <div className="feedback bad">Table 4 联合移除了两个控制，不能把全部差异单独归给术语表。</div>
        </details>
      </div>

      <div className="feedback" style={{ borderLeftColor: MUSEUM_COLORS.emphasis }}>
        适用边界：错误抽取、错误用户译名或一词多义会让强行统一伤害准确性；LLM 也可能忽略软提示，因此技术文档仍需要人工审查术语表。
      </div>
    </div>
  );
};

export default GlossaryLab;
