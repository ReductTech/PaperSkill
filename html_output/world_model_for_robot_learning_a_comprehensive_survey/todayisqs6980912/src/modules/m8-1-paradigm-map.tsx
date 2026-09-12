import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { PALETTE, drawScene, drawLegend, drawSceneLabel } from './theme-kit';
import type { WidgetProps } from './registry';

// 模块 8.1 五种耦合（P5 点击范式节点）：点击顶部节点切换范式，
// 中央架构图重排（谁预测、谁行动、怎么连），数据流高亮切换，
// 底部三根权衡条动画过渡 + 代表工作徽标行切换。

const W = 720;
const H = 360;

const NODES: { id: string; label: string }[] = [
  { id: 'idm', label: 'IDM 解耦' },
  { id: 'single', label: '单骨干' },
  { id: 'moe', label: '专家 MoE' },
  { id: 'vla', label: 'VLA 内化' },
  { id: 'latent', label: '潜空间' },
];
const NODE_RECTS = NODES.map((_, i) => ({ x: 29 + i * 134, y: 22, w: 126, h: 36 }));

const PARA: Record<
  string,
  { works: string[]; bars: [number, number, number]; text: string; cls: string }
> = {
  idm: {
    works: ['UniPi', 'Gen2Act', 'VPP'],
    bars: [0.9, 0.25, 0.8],
    text: '先想象、再翻译：模块可换，但预测不准时误差会累积。',
    cls: '',
  },
  single: {
    works: ['UVA', 'VideoVLA', 'Cosmos Policy'],
    bars: [0.4, 0.75, 0.45],
    text: '一个骨干同时想象与行动：有前景的归纳偏置——是否最优仍属开放问题。',
    cls: 'good',
  },
  moe: {
    works: ['GE-Act', 'Motus', 'LingBot-VA'],
    bars: [0.55, 0.6, 0.6],
    text: '专家分工但深度交流：两条流各守时间频率与表征尺度。',
    cls: '',
  },
  vla: {
    works: ['GR-1', 'UP-VLA', 'TriVLA'],
    bars: [0.3, 0.85, 0.35],
    text: '把想象内化进 VLA：未来预测主要当训练信号，不必显式画出来。',
    cls: '',
  },
  latent: {
    works: ['FLARE', 'VLA-JEPA', 'JEPA-VLA'],
    bars: [0.5, 0.8, 0.3],
    text: '不画出来，但在心里预演：省下像素级生成的算力。',
    cls: 'good',
  },
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  sub: string,
  opts?: { dashed?: boolean; active?: boolean }
): void {
  const { dashed = false, active = true } = opts ?? {};
  ctx.save();
  ctx.fillStyle = PALETTE.paper;
  ctx.strokeStyle = active ? PALETTE.blue : PALETTE.muted;
  ctx.lineWidth = active ? 2 : 1.4;
  if (dashed) ctx.setLineDash([6, 4]);
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = active ? PALETTE.ink : PALETTE.muted;
  ctx.font = 'bold 13px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, x + w / 2, y + h / 2 - (sub ? 7 : 0));
  if (sub) {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '11px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText(sub, x + w / 2, y + h / 2 + 9);
  }
  ctx.restore();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  opts?: { dashed?: boolean; width?: number }
): void {
  const { dashed = false, width = 2 } = opts ?? {};
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  if (dashed) ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const ah = 7;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ah * Math.cos(ang - 0.45), y2 - ah * Math.sin(ang - 0.45));
  ctx.lineTo(x2 - ah * Math.cos(ang + 0.45), y2 - ah * Math.sin(ang + 0.45));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawIoBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  sym: string,
  label: string
): void {
  ctx.save();
  ctx.strokeStyle = PALETTE.ink;
  ctx.fillStyle = PALETTE.paper;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PALETTE.ink;
  ctx.font = 'italic bold 14px "Segoe UI", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(sym, x, y + 1);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '11px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.fillText(label, x, y + 30);
  ctx.restore();
}

export const M81ParadigmMap: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    para: 'idm',
    anim: { mod: 0.9, joint: 0.25, err: 0.8 },
  });
  const rafRef = useRef<number | null>(null);
  const [para, setPara] = useState('idm');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const toCanvas = (e: PointerEvent): { x: number; y: number } => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) * W) / rect.width,
        y: ((e.clientY - rect.top) * H) / rect.height,
      };
    };
    const hitNode = (p: { x: number; y: number }): number =>
      NODE_RECTS.findIndex(
        (r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h
      );

    const onDown = (e: PointerEvent) => {
      const i = hitNode(toCanvas(e));
      if (i >= 0) {
        stateRef.current.para = NODES[i].id;
        setPara(NODES[i].id);
        e.preventDefault();
      }
    };
    const onMove = (e: PointerEvent) => {
      canvas.style.cursor = hitNode(toCanvas(e)) >= 0 ? 'pointer' : 'default';
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);

    const render = () => {
      const s = stateRef.current;
      const p = PARA[s.para];

      // 权衡条动画（缓动趋近目标）
      s.anim.mod += (p.bars[0] - s.anim.mod) * 0.15;
      s.anim.joint += (p.bars[1] - s.anim.joint) * 0.15;
      s.anim.err += (p.bars[2] - s.anim.err) * 0.15;

      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, W, H, { margin: 10 });
      drawLegend(ctx, 28, 88, [
        { color: PALETTE.blue, text: '激活' },
        { color: PALETTE.muted, text: '待定' },
        { color: PALETTE.red, text: '禁用' },
      ]);

      // 顶部范式节点（P5 点击）
      for (let i = 0; i < NODES.length; i++) {
        const r = NODE_RECTS[i];
        const sel = NODES[i].id === s.para;
        ctx.save();
        ctx.fillStyle = sel ? PALETTE.blue : PALETTE.paper;
        ctx.strokeStyle = sel ? PALETTE.blue : PALETTE.grid;
        ctx.lineWidth = sel ? 2 : 1.4;
        roundRect(ctx, r.x, r.y, r.w, r.h, 18);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = sel ? '#fff' : PALETTE.ink;
        ctx.font = `${sel ? 'bold ' : ''}13px "Segoe UI", "Microsoft YaHei", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(NODES[i].label, r.x + r.w / 2, r.y + r.h / 2 + 1);
        ctx.restore();
      }

      // 输入 / 输出徽标
      drawIoBadge(ctx, 88, 128, 'o', '观测');
      drawIoBadge(ctx, 88, 182, 'l', '指令');
      drawIoBadge(ctx, 634, 155, 'a', '动作');

      // 中央架构（依范式重排）
      if (s.para === 'idm') {
        drawBox(ctx, 168, 112, 168, 56, '世界模型 WM', '预测未来 ŷ | o, l');
        drawBox(ctx, 408, 112, 168, 56, '策略 P', 'o + ŷ → a');
        drawArrow(ctx, 104, 128, 168, 132, PALETTE.blue);
        drawArrow(ctx, 104, 182, 168, 152, PALETTE.blue);
        drawArrow(ctx, 336, 140, 408, 140, PALETTE.blue, { width: 2.5 });
        drawSceneLabel(ctx, 372, 128, 'ŷ', { size: 12, align: 'center', color: PALETTE.blue });
        drawArrow(ctx, 104, 108, 430, 108, PALETTE.muted, { dashed: true });
        drawArrow(ctx, 576, 140, 618, 152, PALETTE.blue);
      } else if (s.para === 'single') {
        drawBox(ctx, 168, 112, 408, 60, '统一骨干', 'x = [ z_v ; z_a ]，联合损失 L');
        drawArrow(ctx, 104, 128, 168, 132, PALETTE.blue);
        drawArrow(ctx, 104, 182, 168, 155, PALETTE.blue);
        drawArrow(ctx, 576, 142, 618, 152, PALETTE.blue);
        drawSceneLabel(ctx, 372, 186, '想象与行动同住一层', { size: 11, align: 'center' });
      } else if (s.para === 'moe') {
        drawBox(ctx, 168, 96, 176, 60, '视频预测专家', '时间频率慢 · 表征细');
        drawBox(ctx, 400, 96, 176, 60, '动作生成专家', '时间频率快 · 控制密');
        drawArrow(ctx, 104, 118, 168, 118, PALETTE.blue);
        drawArrow(ctx, 104, 182, 168, 148, PALETTE.blue);
        drawArrow(ctx, 104, 132, 400, 132, PALETTE.blue);
        // F_mix 双向交叉连线
        drawArrow(ctx, 344, 118, 400, 118, PALETTE.purple, { dashed: true });
        drawArrow(ctx, 400, 138, 344, 138, PALETTE.purple, { dashed: true });
        drawSceneLabel(ctx, 372, 104, 'F_mix', { size: 11, align: 'center', color: PALETTE.purple });
        drawArrow(ctx, 488, 156, 618, 152, PALETTE.blue);
        drawArrow(ctx, 256, 156, 618, 152, PALETTE.blue, { dashed: true, width: 1.5 });
      } else if (s.para === 'vla') {
        drawBox(ctx, 168, 112, 408, 52, 'VLA 骨干', '观测 + 指令 → 动作');
        drawArrow(ctx, 104, 128, 168, 132, PALETTE.blue);
        drawArrow(ctx, 104, 182, 168, 148, PALETTE.blue);
        drawArrow(ctx, 576, 138, 618, 152, PALETTE.blue);
        // 内化的未来预测支路（虚线，训练信号）
        drawBox(ctx, 330, 186, 180, 34, '未来预测支路', '仅作训练信号', {
          dashed: true,
          active: false,
        });
        drawArrow(ctx, 420, 186, 420, 166, PALETTE.muted, { dashed: true });
        drawSceneLabel(ctx, 530, 203, 'L', { size: 13, align: 'center', color: PALETTE.muted });
      } else {
        drawBox(ctx, 168, 112, 408, 52, 'VLA + 潜空间世界模型', 'z 空间内预演');
        drawArrow(ctx, 104, 128, 168, 132, PALETTE.blue);
        drawArrow(ctx, 104, 182, 168, 148, PALETTE.blue);
        drawArrow(ctx, 576, 138, 618, 152, PALETTE.blue);
        // 内部全虚线：无显式图像
        drawArrow(ctx, 250, 132, 430, 132, PALETTE.muted, { dashed: true });
        drawArrow(ctx, 430, 148, 250, 148, PALETTE.muted, { dashed: true });
        // 显式视频生成：禁用（红虚线）
        ctx.save();
        ctx.strokeStyle = PALETTE.red;
        ctx.fillStyle = PALETTE.paper;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([5, 4]);
        roundRect(ctx, 330, 186, 180, 34, 8);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = PALETTE.red;
        ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('显式视频生成 ✕', 420, 203);
        ctx.beginPath();
        ctx.moveTo(338, 192);
        ctx.lineTo(502, 214);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // 代表工作徽标行
      drawSceneLabel(ctx, 40, 258, '代表工作', { size: 12 });
      let wx = 112;
      for (const wk of p.works) {
        ctx.save();
        ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
        const tw = ctx.measureText(wk).width + 16;
        ctx.strokeStyle = PALETTE.purple;
        ctx.fillStyle = 'rgba(124, 58, 237, 0.06)';
        ctx.lineWidth = 1.3;
        roundRect(ctx, wx, 246, tw, 24, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = PALETTE.purple;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(wk, wx + tw / 2, 259);
        ctx.restore();
        wx += tw + 10;
      }

      // 三根权衡条
      const bar = (y: number, frac: number, color: string, label: string) => {
        drawSceneLabel(ctx, 40, y + 7, label, { size: 12 });
        const bx = 112;
        const bw = 440;
        ctx.fillStyle = PALETTE.grid;
        ctx.fillRect(bx, y, bw, 12);
        ctx.fillStyle = color;
        ctx.fillRect(bx, y, bw * frac, 12);
        drawSceneLabel(ctx, bx + bw + 10, y + 7, frac.toFixed(2), { size: 12, color });
      };
      bar(284, s.anim.mod, PALETTE.green, '模块化');
      bar(308, s.anim.joint, PALETTE.blue, '联合一致性');
      bar(332, s.anim.err, PALETTE.red, '误差累积');

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        role="group"
        aria-label="五种策略与世界模型耦合范式架构图"
      />
      <div className={`feedback ${PARA[para].cls}`}>{PARA[para].text}</div>
    </div>
  );
};

export default M81ParadigmMap;
