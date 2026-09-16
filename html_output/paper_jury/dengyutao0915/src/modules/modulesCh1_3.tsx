import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// ============================================================================
//  第 1-3 章交互模块：问题引入 / 三难困境 / 确定性 vs 语义分离
// ============================================================================

const W = 1080;
const H = 280;

// 语义色（contract.md §5）
const BG = '#f5f8f0';
const ENV_L = '#b8c9a7';
const ENV_D = '#76906a';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#d97706';
const PURPLE = '#7c3aed';
const TEXT = '#21324a';
const MUTED = '#68778f';
const BORDER = '#d7deea';

/* ---------------- Ch1：表面完成 vs 论证健全（P1 滑块，双画布） ---------------- */
export const Ch1SurfaceSound: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const curveRef = useRef<HTMLCanvasElement>(null);
  const barsRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ polish: 50 });
  const [polish, setPolish] = useState(50);
  const [feedback, setFeedback] = useState({
    text: '拖动滑块模拟"打磨程度"：局部润色越深，跨章节矛盾越难被表面发现。',
    cls: '',
  });

  useEffect(() => {
    const c1 = curveRef.current;
    const c2 = barsRef.current;
    if (!c1 || !c2) return;
    let ctx1: CanvasRenderingContext2D;
    let ctx2: CanvasRenderingContext2D;
    try {
      ctx1 = setupCanvas(c1, 540, H);
      ctx2 = setupCanvas(c2, 540, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    // 左图：打磨强度 -> 表面完成/论证健全 双曲线（独立画布 540x280）
    const drawCurve = (s: { polish: number }, ctx: CanvasRenderingContext2D) => {
      const p = s.polish;
      const surface = 30 + p * 0.65; // 表面完成度：30% -> 95%
      const sound = p < 40 ? 40 + p * 0.9 : 76 - (p - 40) * 0.55; // 健全度先升后降
      const W2 = 540;
      ctx.clearRect(0, 0, W2, H);
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#fbfdf9');
      grad.addColorStop(1, BG);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W2, H);

      // 标题
      ctx.fillStyle = MUTED;
      ctx.font = '600 14px "Microsoft YaHei", sans-serif';
      ctx.fillText('打磨强度 vs 论证健全', 40, 32);

      // 图例（白底圆角框，右上；两行实时数值——数据标签并入图例，避免遮挡曲线）
      const sColLegend = sound >= 55 ? GREEN : RED;
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 396, 16, 124, 48, 10);
      ctx.fill();
      ctx.strokeStyle = '#e2e6ee';
      ctx.lineWidth = 1;
      roundRect(ctx, 396, 16, 124, 48, 10);
      ctx.stroke();
      ctx.fillStyle = BLUE;
      roundRect(ctx, 406, 24, 12, 12, 3);
      ctx.fill();
      ctx.fillStyle = TEXT;
      ctx.font = '600 12px "Microsoft YaHei", sans-serif';
      ctx.fillText('表面完成 ' + Math.round(surface) + '%', 424, 35);
      ctx.fillStyle = sColLegend;
      roundRect(ctx, 406, 44, 12, 12, 3);
      ctx.fill();
      ctx.fillText('论证健全 ' + Math.round(sound) + '%', 424, 55);

      // 绘图区（值域 20-100%）
      const x0 = 60;
      const x1 = 500;
      const yTop = 52;
      const yBot = 220;
      const X = (pp: number) => x0 + (pp / 100) * (x1 - x0);
      const Y = (v: number) => yBot - ((v - 20) / 80) * (yBot - yTop);

      // 横向网格 + y 刻度（100/80/60/40/20%，顶部主线稍深）
      [100, 80, 60, 40, 20].forEach((vv, vi) => {
        const yy = Y(vv);
        ctx.strokeStyle = vi === 0 ? 'rgba(215,222,234,0.75)' : 'rgba(215,222,234,0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x0, yy);
        ctx.lineTo(x1, yy);
        ctx.stroke();
        ctx.fillStyle = '#7a8698';
        ctx.font = '10.5px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(vv + '%', x0 - 8, yy + 4);
        ctx.textAlign = 'left';
      });

      // x 轴 + 主/次刻度
      ctx.strokeStyle = '#8a94a6';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x0, yBot);
      ctx.lineTo(x1, yBot);
      ctx.stroke();
      // 次刻度（每 10）
      ctx.strokeStyle = 'rgba(160,170,185,0.5)';
      ctx.lineWidth = 1;
      for (let pp = 10; pp < 100; pp += 10) {
        const xx = X(pp);
        ctx.beginPath();
        ctx.moveTo(xx, yBot);
        ctx.lineTo(xx, yBot + 3);
        ctx.stroke();
      }
      // 主刻度（0/25/50/75/100）
      [0, 25, 50, 75, 100].forEach((pp) => {
        const xx = X(pp);
        ctx.strokeStyle = 'rgba(160,170,185,0.8)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(xx, yBot);
        ctx.lineTo(xx, yBot + 5);
        ctx.stroke();
        ctx.fillStyle = '#7a8698';
        ctx.font = '10.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(pp), xx, yBot + 17);
        ctx.textAlign = 'left';
      });
      ctx.fillStyle = TEXT;
      ctx.font = '600 14px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('打磨强度', (x0 + x1) / 2, yBot + 40);
      ctx.textAlign = 'left';

      // 平滑曲线（中点贝塞尔，圆化折角）
      const smooth = (fn: (pp: number) => number) => {
        const pts: Array<[number, number]> = [];
        for (let i = 0; i <= 40; i++) {
          const pp = (i / 40) * 100;
          pts.push([X(pp), Y(fn(pp))]);
        }
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length - 1; i++) {
          const xc = (pts[i][0] + pts[i + 1][0]) / 2;
          const yc = (pts[i][1] + pts[i + 1][1]) / 2;
          ctx.quadraticCurveTo(pts[i][0], pts[i][1], xc, yc);
        }
        ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
      };
      // 表面完成度（蓝，垂直渐变面积 + 圆头曲线）
      const gradFill = ctx.createLinearGradient(0, yTop, 0, yBot);
      gradFill.addColorStop(0, 'rgba(39,68,110,0.16)');
      gradFill.addColorStop(1, 'rgba(39,68,110,0.02)');
      smooth((pp) => 30 + pp * 0.65);
      ctx.lineTo(x1, yBot);
      ctx.lineTo(x0, yBot);
      ctx.closePath();
      ctx.fillStyle = gradFill;
      ctx.fill();
      smooth((pp) => 30 + pp * 0.65);
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // 论证健全度（绿，先升后降）
      smooth((pp) => (pp < 40 ? 40 + pp * 0.9 : 76 - (pp - 40) * 0.55));
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'miter';

      // 健全阈值参考线（55%，淡橙虚线 + 右端标注）
      const thY = Y(55);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(217,119,6,0.55)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x0, thY);
      ctx.lineTo(x1 - 6, thY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#a05a0a';
      ctx.font = '10.5px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('健全阈值 55%', x1 - 10, thY - 5);
      ctx.textAlign = 'left';

      // 当前点：竖虚线投影 + 光晕圆点 + x 轴游标（数值见右上图例）
      const sGood = sound >= 55;
      const sColor = sGood ? GREEN : RED;
      const dots = [
        { v: surface, color: BLUE },
        { v: sound, color: sColor },
      ];
      const dxNow = X(p);
      // x 轴当前值游标（橙色三角，指示当前打磨强度）
      ctx.fillStyle = ORANGE;
      ctx.beginPath();
      ctx.moveTo(dxNow, yBot);
      ctx.lineTo(dxNow - 5, yBot + 7);
      ctx.lineTo(dxNow + 5, yBot + 7);
      ctx.closePath();
      ctx.fill();
      dots.forEach((d) => {
        const dx = dxNow;
        const dy = Y(d.v);
        // 竖虚线投影到 x 轴
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = 'rgba(160,170,185,0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(dx, dy);
        ctx.lineTo(dx, yBot);
        ctx.stroke();
        ctx.setLineDash([]);
        // 光晕 + 白描边圆点（数值见右上图例）
        ctx.beginPath();
        ctx.arc(dx, dy, 17, 0, Math.PI * 2);
        ctx.fillStyle = d.color + '1a';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(dx, dy, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = d.color;
        ctx.stroke();
      });
    };

    // 右图：跨章节矛盾列表（独立画布 540x280）
    const drawBars = (s: { polish: number }, ctx: CanvasRenderingContext2D) => {
      const p = s.polish;
      const flaws = p > 40 ? Math.round((p - 40) * 0.15) : 0;
      const W2 = 540;
      ctx.clearRect(0, 0, W2, H);
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#fbfdf9');
      grad.addColorStop(1, BG);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W2, H);

      // 标题
      ctx.fillStyle = MUTED;
      ctx.font = '600 14px "Microsoft YaHei", sans-serif';
      ctx.fillText('跨章节矛盾', 40, 32);
      // 图例（右上）
      ctx.fillStyle = MUTED;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.fillText('● 矛盾    ○ 正常', 420, 32);

      // 6 行矛盾条目
      const items = [
        { a: '§1↔§4', t: '类型漂移' },
        { a: '§3↔§7', t: '符号冲突' },
        { a: '§5↔§6', t: '术语统一' },
        { a: '§2↔§9', t: '引文一致性' },
        { a: '§4↔§8', t: '主线断裂' },
        { a: '§6↔§10', t: '指标口径' },
      ];
      items.forEach((it, i) => {
        const y = 56 + i * 28;
        const on = i < flaws;
        // 圆点
        ctx.beginPath();
        ctx.arc(52, y, 7, 0, Math.PI * 2);
        ctx.fillStyle = on ? RED : '#d7deea';
        ctx.fill();
        // 编号
        ctx.fillStyle = TEXT;
        ctx.font = '600 13px "Microsoft YaHei", sans-serif';
        ctx.fillText(it.a, 70, y + 5);
        // 描述
        ctx.fillStyle = MUTED;
        ctx.font = '13px "Microsoft YaHei", sans-serif';
        ctx.fillText(it.t, 140, y + 5);
        // 状态徽章（右侧）
        ctx.fillStyle = on ? 'rgba(196,63,82,0.12)' : '#f2f4f8';
        roundRect(ctx, 452, y - 8, 48, 20, 10);
        ctx.fill();
        ctx.fillStyle = on ? RED : '#aab3c2';
        ctx.font = '600 11px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(on ? '矛盾' : '正常', 476, y + 6);
        ctx.textAlign = 'left';
        // 行间淡分隔线
        if (i < items.length - 1) {
          ctx.strokeStyle = 'rgba(215,222,234,0.45)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(44, y + 16);
          ctx.lineTo(500, y + 16);
          ctx.stroke();
        }
      });

      // 分隔线
      ctx.strokeStyle = 'rgba(215,222,234,0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, 234);
      ctx.lineTo(500, 234);
      ctx.stroke();
      // 底部计数（红色徽章）
      ctx.fillStyle = RED;
      roundRect(ctx, 40, 242, 36, 30, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(flaws), 58, 262);
      ctx.textAlign = 'left';
      ctx.fillStyle = TEXT;
      ctx.font = '700 16px "Microsoft YaHei", sans-serif';
      ctx.fillText('处矛盾', 86, 262);
      // 右侧说明
      ctx.fillStyle = MUTED;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('打磨越深，矛盾越隐蔽', 500, 262);
      ctx.textAlign = 'left';
    };

    const tick = () => {
      drawCurve(stateRef.current, ctx1);
      drawBars(stateRef.current, ctx2);
      if (!c1.classList.contains('is-ready')) c1.classList.add('is-ready');
      if (!c2.classList.contains('is-ready')) c2.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(c1, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const p = Number(e.target.value);
    stateRef.current.polish = p;
    setPolish(p);
    if (p < 30) setFeedback({ text: '打磨不足：表面与健全都处于低位，问题显而易见但未被处理。', cls: '' });
    else if (p < 60) setFeedback({ text: '适度打磨：表面完成度上升，论证健全度同步改善。', cls: 'good' });
    else setFeedback({ text: '过度打磨：表面继续光滑，但健全度下滑——矛盾埋在流畅文字之下，只有整体审视能发现。', cls: 'bad' });
  };

  return (
    <div>
      <div className="dual-canvas">
        <canvas id={`cv-${chapterId}-${moduleId}-curve`} ref={curveRef} width={540} height={H} />
        <canvas id={`cv-${chapterId}-${moduleId}-bars`} ref={barsRef} width={540} height={H} />
      </div>
      <div className="ctrl">
        <label>
          打磨程度 <span className="val">{polish}</span>
        </label>
        <input type="range" min={0} max={100} value={polish} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

/* ---------------- Ch2：三难困境（P6 拖拽） ---------------- */
// 圆角矩形辅助（canvas 2D）
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export const Ch2Trilemma: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ x: 270, y: 215 });
  const [point, setPoint] = useState({ x: 270, y: 215 });
  const [feedback, setFeedback] = useState({
    text: '在三角形内拖拽资源分配点：任何一角都来自另外两角的代价。',
    cls: '',
  });

  // 正三角形顶点（等边，尽可能大，边长 380）：顶=精确、左下=召回、右下=成本
  const A = { x: 270, y: 50 }; // 精确
  const B = { x: 80, y: 379 }; // 召回
  const C = { x: 460, y: 379 }; // 成本

  const pointToBary = (px: number, py: number) => {
    const det = (B.x - C.x) * (A.y - C.y) + (C.y - B.y) * (A.x - C.x);
    const l1 = ((B.x - C.x) * (py - C.y) + (C.y - B.y) * (px - C.x)) / det; // 精确权重
    const l2 = ((C.x - A.x) * (py - C.y) + (A.y - C.y) * (px - C.x)) / det; // 召回权重
    const l3 = 1 - l1 - l2; // 成本权重
    return {
      prec: clamp(l1, 0, 1),
      rec: clamp(l2, 0, 1),
      cost: clamp(l3, 0, 1),
    };
  };

  const inside = (px: number, py: number) => {
    const w = pointToBary(px, py);
    const min = Math.min(w.prec, w.rec, w.cost);
    const max = Math.max(w.prec, w.rec, w.cost);
    return min > -0.02 && max < 1.02;
  };

  // 投影到三角形内（重心坐标 clamp 再反算）
  const project = (px: number, py: number) => {
    let w = pointToBary(px, py);
    w = { prec: clamp(w.prec, 0, 1), rec: clamp(w.rec, 0, 1), cost: clamp(w.cost, 0, 1) };
    const s = w.prec + w.rec + w.cost;
    return {
      x: (w.prec * A.x + w.rec * B.x + w.cost * C.x) / s,
      y: (w.prec * A.y + w.rec * B.y + w.cost * C.y) / s,
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, 540, 560);
    } catch {
      return;
    }
    let raf: number | null = null;

    const render = (s: { x: number; y: number }) => {
      const w = pointToBary(s.x, s.y);
      ctx.clearRect(0, 0, 540, 560);

      // 背景：柔和纵向渐变
      const grad = ctx.createLinearGradient(0, 0, 0, 560);
      grad.addColorStop(0, '#fbfdf9');
      grad.addColorStop(1, BG);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 540, 560);

      // 三角形内部：三色渐变填充（精确蓝 / 召回橙 / 成本紫）
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.lineTo(C.x, C.y);
      ctx.closePath();
      ctx.clip();
      const tri = ctx.createLinearGradient(0, A.y, 0, B.y);
      tri.addColorStop(0, 'rgba(39,68,110,0.16)');
      tri.addColorStop(0.5, 'rgba(217,119,6,0.12)');
      tri.addColorStop(1, 'rgba(124,58,237,0.15)');
      ctx.fillStyle = tri;
      ctx.fillRect(0, 0, 540, 560);
      ctx.restore();

      // 三角形边框
      ctx.strokeStyle = 'rgba(39,68,110,0.45)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.lineTo(C.x, C.y);
      ctx.closePath();
      ctx.stroke();

      // 重心坐标连线：拖拽点到三个顶点，线宽与透明度随权重变化
      const lines = [
        { p: A, v: w.prec, color: BLUE },
        { p: B, v: w.rec, color: ORANGE },
        { p: C, v: w.cost, color: PURPLE },
      ];
      ctx.setLineDash([6, 5]);
      lines.forEach((l) => {
        ctx.strokeStyle = l.color;
        ctx.globalAlpha = 0.35 + l.v * 0.45;
        ctx.lineWidth = 1.5 + l.v * 3;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(l.p.x, l.p.y);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // 顶点：白色描边圆点 + 彩色圆心（文字标签移到底部图例）
      const verts = [
        { p: A, label: '精确', color: BLUE },
        { p: B, label: '召回', color: ORANGE },
        { p: C, label: '成本', color: PURPLE },
      ];
      verts.forEach((v) => {
        ctx.beginPath();
        ctx.arc(v.p.x, v.p.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = v.color;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(v.p.x, v.p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = v.color;
        ctx.fill();
      });

      // 拖拽点：橙色光晕 + 白描边 + 橙心
      ctx.beginPath();
      ctx.arc(s.x, s.y, 22, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(217,119,6,0.16)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(s.x, s.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = ORANGE;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = ORANGE;
      ctx.fill();

      // 三角形下方图例（三色横排）
      const legend = [
        { label: '精确', x: 150, color: BLUE },
        { label: '召回', x: 270, color: ORANGE },
        { label: '成本', x: 390, color: PURPLE },
      ];
      legend.forEach((l) => {
        ctx.fillStyle = l.color;
        roundRect(ctx, l.x - 66, 396, 14, 14, 3);
        ctx.fill();
        ctx.fillStyle = TEXT;
        ctx.font = '600 15px "Microsoft YaHei", sans-serif';
        ctx.fillText(l.label, l.x - 47, 408);
      });

      // 下方数值区：标题 + 三行圆角进度条（下移到三角形下方）
      ctx.fillStyle = MUTED;
      ctx.font = '13px sans-serif';
      ctx.fillText('当前资源分配', 80, 440);

      const rows = [
        { label: '精确', val: w.prec, color: BLUE },
        { label: '召回', val: w.rec, color: ORANGE },
        { label: '成本', val: w.cost, color: PURPLE },
      ];
      rows.forEach((r, i) => {
        const y = 456 + i * 34;
        // 标签
        ctx.fillStyle = r.color;
        ctx.font = '600 16px "Microsoft YaHei", sans-serif';
        ctx.fillText(r.label, 80, y + 4);
        // 百分比
        ctx.fillStyle = TEXT;
        ctx.font = '15px sans-serif';
        ctx.fillText(Math.round(r.val * 100) + '%', 150, y + 4);
        // 进度条底槽
        ctx.fillStyle = '#eef2ec';
        roundRect(ctx, 220, y - 10, 280, 18, 9);
        ctx.fill();
        // 进度值
        ctx.fillStyle = r.color;
        roundRect(ctx, 220, y - 10, Math.max(6, r.val * 280), 18, 9);
        ctx.fill();
      });
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    onPointerMove(e);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 540;
    const y = ((e.clientY - rect.top) / rect.height) * 560;
    const pr = project(x, y);
    stateRef.current = pr;
    setPoint(pr);
    const w = pointToBary(pr.x, pr.y);
    const maxV = Math.max(w.prec, w.rec, w.cost);
    const minV = Math.min(w.prec, w.rec, w.cost);
    const name = maxV === w.prec ? '精确' : maxV === w.rec ? '召回' : '成本';
    setFeedback({
      text:
        maxV - minV > 0.25
          ? `偏向${name}：该维度提升到 ${maxV.toFixed(2)}，另两个维度被压缩——三难不可兼得。`
          : '较均衡：三个维度接近，但没有一项突出，整体仍受三难约束。',
      cls: maxV > 0.7 ? 'bad' : '',
    });
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={540}
        height={560}
        className="canvas-portrait"
        style={{ touchAction: 'none', cursor: 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={(e) => {
          if (e.buttons > 0) onPointerMove(e);
        }}
      />
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

/* ---------------- Ch3：谁握法槌（P3 同步对比，双画布） ---------------- */
export const Ch3ArchCompare: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const aRef = useRef<HTMLCanvasElement>(null); // 模型握法槌（失败模式）
  const bRef = useRef<HTMLCanvasElement>(null); // 确定性握法槌（成功模式）
  const stateRef = useRef({ run: false, startT: 0, animT: 0 });
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState({
    text: '按下"开始对比"，同步观察两种架构在裁决与编辑上的可靠性差异。',
    cls: '',
  });

  useEffect(() => {
    const c1 = aRef.current;
    const c2 = bRef.current;
    if (!c1 || !c2) return;
    let ctx1: CanvasRenderingContext2D;
    let ctx2: CanvasRenderingContext2D;
    try {
      ctx1 = setupCanvas(c1, 540, H);
      ctx2 = setupCanvas(c2, 540, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    // 左图：模型握法槌（失败模式）
    const drawModel = (s: { run: boolean; startT: number; animT: number }, now: number) => {
      let t = s.animT;
      if (s.run) t = Math.min(1, (now - s.startT) / 3200);
      const W2 = 540;
      ctx1.clearRect(0, 0, W2, H);
      const grad = ctx1.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#fbfdf9');
      grad.addColorStop(1, BG);
      ctx1.fillStyle = grad;
      ctx1.fillRect(0, 0, W2, H);

      // 外框（红系淡色）
      ctx1.fillStyle = 'rgba(196,63,82,0.05)';
      roundRect(ctx1, 20, 12, 500, 256, 14);
      ctx1.fill();
      ctx1.strokeStyle = 'rgba(196,63,82,0.45)';
      ctx1.lineWidth = 1.5;
      roundRect(ctx1, 20, 12, 500, 256, 14);
      ctx1.stroke();

      // 标题胶囊 + 说明
      ctx1.fillStyle = RED;
      roundRect(ctx1, 36, 22, 150, 30, 15);
      ctx1.fill();
      ctx1.fillStyle = '#ffffff';
      ctx1.font = '700 16px "Microsoft YaHei", sans-serif';
      ctx1.textAlign = 'center';
      ctx1.fillText('模型握法槌', 111, 42);
      ctx1.textAlign = 'left';
      ctx1.fillStyle = MUTED;
      ctx1.font = '13px "Microsoft YaHei", sans-serif';
      ctx1.fillText('裁决与编辑都由模型自证完成', 200, 41);

      // LLM 圆（蓝填充 + 红描边，大）
      const mx = 115;
      const my = 148;
      ctx1.beginPath();
      ctx1.arc(mx, my, 52, 0, Math.PI * 2);
      ctx1.fillStyle = BLUE;
      ctx1.fill();
      ctx1.lineWidth = 3;
      ctx1.strokeStyle = RED;
      ctx1.stroke();
      ctx1.beginPath();
      ctx1.arc(mx, my, 44, 0, Math.PI * 2);
      ctx1.lineWidth = 1.5;
      ctx1.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx1.stroke();
      ctx1.fillStyle = '#ffffff';
      ctx1.font = '700 22px sans-serif';
      ctx1.textAlign = 'center';
      ctx1.fillText('LLM', mx, my + 8);
      ctx1.textAlign = 'left';

      // 编辑自证框（LLM 下方）
      ctx1.fillStyle = 'rgba(196,63,82,0.08)';
      roundRect(ctx1, 55, 212, 120, 36, 8);
      ctx1.fill();
      ctx1.strokeStyle = 'rgba(196,63,82,0.6)';
      ctx1.lineWidth = 1.5;
      roundRect(ctx1, 55, 212, 120, 36, 8);
      ctx1.stroke();
      ctx1.fillStyle = RED;
      ctx1.font = '600 12px "Microsoft YaHei", sans-serif';
      ctx1.textAlign = 'center';
      ctx1.fillText('编辑: 模型自证', 115, 235);
      ctx1.textAlign = 'left';
      // 越界红叉（t > 0.5 后跳出）
      if (t > 0.5) {
        ctx1.strokeStyle = RED;
        ctx1.lineWidth = 3;
        ctx1.beginPath();
        ctx1.moveTo(172, 200);
        ctx1.lineTo(188, 216);
        ctx1.moveTo(188, 200);
        ctx1.lineTo(172, 216);
        ctx1.stroke();
        ctx1.fillStyle = RED;
        ctx1.font = '600 11px "Microsoft YaHei", sans-serif';
        ctx1.fillText('越界', 160, 194);
      }

      // 箭头：主体 → 裁决输出（自证路径）
      ctx1.strokeStyle = RED;
      ctx1.lineWidth = 2;
      ctx1.setLineDash([5, 4]);
      ctx1.beginPath();
      ctx1.moveTo(172, 148);
      ctx1.lineTo(246, 148);
      ctx1.stroke();
      ctx1.setLineDash([]);
      ctx1.beginPath();
      ctx1.moveTo(246, 148);
      ctx1.lineTo(236, 141);
      ctx1.lineTo(236, 155);
      ctx1.closePath();
      ctx1.fillStyle = RED;
      ctx1.fill();
      ctx1.font = '600 12px "Microsoft YaHei", sans-serif';
      ctx1.fillText('自证', 196, 132);

      // 裁决输出区（白底圆角 + 6 格）
      ctx1.fillStyle = '#ffffff';
      roundRect(ctx1, 258, 68, 244, 176, 10);
      ctx1.fill();
      ctx1.strokeStyle = '#d7deea';
      ctx1.lineWidth = 1.5;
      roundRect(ctx1, 258, 68, 244, 176, 10);
      ctx1.stroke();
      ctx1.fillStyle = TEXT;
      ctx1.font = '600 14px "Microsoft YaHei", sans-serif';
      ctx1.fillText('裁决输出', 272, 90);
      const errs = Math.floor(t * 6);
      for (let i = 0; i < 6; i++) {
        const on = i < errs;
        const gx = 272 + (i % 3) * 80;
        const gy = 100 + Math.floor(i / 3) * 64;
        ctx1.fillStyle = on ? RED : '#eef1f6';
        roundRect(ctx1, gx, gy, 70, 48, 8);
        ctx1.fill();
        ctx1.fillStyle = on ? '#ffffff' : MUTED;
        ctx1.font = '600 15px sans-serif';
        ctx1.textAlign = 'center';
        ctx1.fillText(on ? '误判' : '✓', gx + 35, gy + 32);
        ctx1.textAlign = 'left';
      }

      // 底部说明
      ctx1.fillStyle = MUTED;
      ctx1.font = '12px "Microsoft YaHei", sans-serif';
      ctx1.textAlign = 'center';
      ctx1.fillText('模型既提案又自证完成，误判与越界编辑累积', 270, 262);
      ctx1.textAlign = 'left';
    };

    // 右图：确定性握法槌（成功模式）
    const drawDet = (s: { run: boolean; startT: number; animT: number }, now: number) => {
      let t = s.animT;
      if (s.run) t = Math.min(1, (now - s.startT) / 3200);
      const W2 = 540;
      ctx2.clearRect(0, 0, W2, H);
      const grad = ctx2.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#fbfdf9');
      grad.addColorStop(1, BG);
      ctx2.fillStyle = grad;
      ctx2.fillRect(0, 0, W2, H);

      // 外框（绿系淡色）
      ctx2.fillStyle = 'rgba(34,141,92,0.05)';
      roundRect(ctx2, 20, 12, 500, 256, 14);
      ctx2.fill();
      ctx2.strokeStyle = 'rgba(34,141,92,0.45)';
      ctx2.lineWidth = 1.5;
      roundRect(ctx2, 20, 12, 500, 256, 14);
      ctx2.stroke();

      // 标题胶囊 + 说明
      ctx2.fillStyle = GREEN;
      roundRect(ctx2, 36, 22, 150, 30, 15);
      ctx2.fill();
      ctx2.fillStyle = '#ffffff';
      ctx2.font = '700 16px "Microsoft YaHei", sans-serif';
      ctx2.textAlign = 'center';
      ctx2.fillText('确定性握法槌', 111, 42);
      ctx2.textAlign = 'left';
      ctx2.fillStyle = MUTED;
      ctx2.font = '13px "Microsoft YaHei", sans-serif';
      ctx2.fillText('裁决由确定性编排，编辑锚定在范围内', 200, 41);

      // 确定性代码块（白底绿边）
      ctx2.fillStyle = '#ffffff';
      roundRect(ctx2, 45, 92, 140, 112, 10);
      ctx2.fill();
      ctx2.strokeStyle = GREEN;
      ctx2.lineWidth = 2.5;
      roundRect(ctx2, 45, 92, 140, 112, 10);
      ctx2.stroke();
      ctx2.fillStyle = TEXT;
      ctx2.font = '700 15px "Microsoft YaHei", sans-serif';
      ctx2.textAlign = 'center';
      ctx2.fillText('确定性编排', 115, 122);
      ctx2.textAlign = 'left';
      ctx2.fillStyle = GREEN;
      ctx2.font = '600 13px "Microsoft YaHei", sans-serif';
      ctx2.textAlign = 'center';
      ctx2.fillText('· 裁决计算', 115, 152);
      ctx2.fillText('· 编辑锚定', 115, 176);
      ctx2.textAlign = 'left';

      // 编辑锚定框（代码块下方）
      ctx2.fillStyle = 'rgba(34,141,92,0.1)';
      roundRect(ctx2, 55, 212, 120, 36, 8);
      ctx2.fill();
      ctx2.strokeStyle = 'rgba(34,141,92,0.6)';
      ctx2.lineWidth = 1.5;
      roundRect(ctx2, 55, 212, 120, 36, 8);
      ctx2.stroke();
      ctx2.fillStyle = GREEN;
      ctx2.font = '600 12px "Microsoft YaHei", sans-serif';
      ctx2.textAlign = 'center';
      ctx2.fillText('编辑: 锚定范围', 115, 235);
      ctx2.textAlign = 'left';

      // 箭头：代码块 → 裁决输出（确定性路径）
      ctx2.strokeStyle = GREEN;
      ctx2.lineWidth = 2;
      ctx2.setLineDash([5, 4]);
      ctx2.beginPath();
      ctx2.moveTo(194, 148);
      ctx2.lineTo(246, 148);
      ctx2.stroke();
      ctx2.setLineDash([]);
      ctx2.beginPath();
      ctx2.moveTo(246, 148);
      ctx2.lineTo(236, 141);
      ctx2.lineTo(236, 155);
      ctx2.closePath();
      ctx2.fillStyle = GREEN;
      ctx2.fill();
      ctx2.font = '600 12px "Microsoft YaHei", sans-serif';
      ctx2.fillText('确定性', 200, 132);

      // 裁决输出区（白底圆角 + 6 格）
      ctx2.fillStyle = '#ffffff';
      roundRect(ctx2, 258, 68, 244, 176, 10);
      ctx2.fill();
      ctx2.strokeStyle = '#d7deea';
      ctx2.lineWidth = 1.5;
      roundRect(ctx2, 258, 68, 244, 176, 10);
      ctx2.stroke();
      ctx2.fillStyle = TEXT;
      ctx2.font = '600 14px "Microsoft YaHei", sans-serif';
      ctx2.fillText('裁决输出', 272, 90);
      const ok = Math.floor(t * 6);
      for (let i = 0; i < 6; i++) {
        const on = i < ok;
        const gx = 272 + (i % 3) * 80;
        const gy = 100 + Math.floor(i / 3) * 64;
        ctx2.fillStyle = on ? GREEN : '#eef1f6';
        roundRect(ctx2, gx, gy, 70, 48, 8);
        ctx2.fill();
        ctx2.fillStyle = on ? '#ffffff' : MUTED;
        ctx2.font = '600 15px sans-serif';
        ctx2.textAlign = 'center';
        ctx2.fillText('✓', gx + 35, gy + 32);
        ctx2.textAlign = 'left';
      }

      // 底部说明
      ctx2.fillStyle = MUTED;
      ctx2.font = '12px "Microsoft YaHei", sans-serif';
      ctx2.textAlign = 'center';
      ctx2.fillText('确定性编排下裁决稳定，编辑被锚定在范围内', 270, 262);
      ctx2.textAlign = 'left';

      if (s.run && t >= 1) {
        stateRef.current.animT = 1;
      }
    };

    const tick = (now: number) => {
      drawModel(stateRef.current, now);
      drawDet(stateRef.current, now);
      if (!c1.classList.contains('is-ready')) c1.classList.add('is-ready');
      if (!c2.classList.contains('is-ready')) c2.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(c1, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const startCompare = () => {
    stateRef.current = { run: true, startT: performance.now(), animT: 0 };
    setRunning(true);
    setFeedback({
      text: '同步对比完成：模型既提案又自证完成，误判与越界编辑累积；确定性编排下裁决稳定、编辑被锚定在范围内。',
      cls: 'good',
    });
  };
  const resetCompare = () => {
    stateRef.current = { run: false, startT: 0, animT: 0 };
    setRunning(false);
    setFeedback({ text: '按下"开始对比"，同步观察两种架构在裁决与编辑上的可靠性差异。', cls: '' });
  };

  return (
    <div>
      <div className="dual-canvas">
        <canvas id={`cv-${chapterId}-${moduleId}-model`} ref={aRef} width={540} height={H} />
        <canvas id={`cv-${chapterId}-${moduleId}-det`} ref={bRef} width={540} height={H} />
      </div>
      <div className="ch3-ctrl">
        <button
          type="button"
          className="ch3-btn ch3-btn-primary"
          onClick={startCompare}
          disabled={running}
        >
          {running ? '对比进行中…' : '▶ 开始对比'}
        </button>
        <button type="button" className="ch3-btn ch3-btn-ghost" onClick={resetCompare}>
          ↺ 重置
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
