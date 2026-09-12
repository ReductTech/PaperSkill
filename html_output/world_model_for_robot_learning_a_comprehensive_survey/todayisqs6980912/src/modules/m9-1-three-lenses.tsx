import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { PALETTE, drawScene, drawInkPath, drawGhostPath, drawLegend, drawSceneLabel, strokePath } from './theme-kit';
import type { WidgetProps } from './registry';

// 模块 9.1 三把尺子（P4 chips）：对同一条生成笔迹切换三种评估视角。
// open → 帧级相似度 0.92（绿，帧刻度）；closed → 任务成功率 0.41（红，执行偏差滚大）；
// phys → 可执行性 0.35（红，穿墨渍段标红 + ⚠）。

const W = 720;
const H = 320;

type Lens = 'open' | 'closed' | 'phys';

const LENSES: { id: Lens; label: string }[] = [
  { id: 'open', label: '开环预测质量' },
  { id: 'closed', label: '闭环任务效用' },
  { id: 'phys', label: '物理一致性' },
];

const FB: Record<Lens, { text: string; cls: string }> = {
  open: { text: '像不像：只看这一帧，几乎挑不出毛病。', cls: '' },
  closed: { text: '能不能用：真执行起来，误差一路滚大。', cls: 'bad' },
  phys: { text: '走不走得通：这一笔穿过了墨渍——动力学不允许。', cls: 'bad' },
};

const JUDGE: Record<Lens, { label: string; value: number; color: string; cap: string }> = {
  open: { label: '帧级相似度', value: 0.92, color: PALETTE.green, cap: '逐帧与真值比对' },
  closed: { label: '任务成功率', value: 0.41, color: PALETTE.red, cap: '真执行时偏差滚大' },
  phys: { label: '可执行性', value: 0.35, color: PALETTE.red, cap: '动力学不允许' },
};

const NODES = [
  { x: 70, y: 130 },
  { x: 180, y: 88 },
  { x: 290, y: 158 },
  { x: 390, y: 100 },
  { x: 470, y: 148 },
];
const BLOT = { x: 332, y: 172, r: 26 };

export const M91ThreeLenses: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lensRef = useRef<Lens>('open');
  const rafRef = useRef<number | null>(null);
  const [lens, setLens] = useState<Lens>('open');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const pts = strokePath(NODES[0], NODES.slice(1, -1), NODES[NODES.length - 1], 96);
    // 违规段：靠近墨渍的点
    const violIdx = new Set<number>();
    pts.forEach((p, i) => {
      if (Math.hypot(p.x - BLOT.x, p.y - BLOT.y) < BLOT.r + 8) violIdx.add(i);
    });
    const violRange = [Math.min(...violIdx), Math.max(...violIdx)];
    const violPts = pts.filter((_, i) => violIdx.has(i));
    const okPtsBefore = pts.filter((_, i) => i < violRange[0]);
    const okPtsAfter = pts.filter((_, i) => i > violRange[1]);

    const render = () => {
      const lv = lensRef.current;
      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, W, H, { margin: 10 });
      drawLegend(ctx, 28, 30, [
        { color: PALETTE.blue, text: '笔迹' },
        { color: PALETTE.red, text: '违规' },
      ]);

      // 墨渍
      ctx.save();
      ctx.fillStyle = PALETTE.envDark;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.ellipse(BLOT.x, BLOT.y, BLOT.r, BLOT.r * 0.82, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 中央笔迹
      if (lv === 'phys') {
        drawInkPath(ctx, okPtsBefore.length > 1 ? okPtsBefore : pts.slice(0, 2), {
          color: PALETTE.blue,
          width: 3.5,
        });
        drawInkPath(ctx, violPts.length > 1 ? violPts : pts.slice(0, 2), {
          color: PALETTE.red,
          width: 4.5,
        });
        drawInkPath(ctx, okPtsAfter.length > 1 ? okPtsAfter : pts.slice(-2), {
          color: PALETTE.blue,
          width: 3.5,
        });
        // ⚠ 记号
        ctx.save();
        ctx.fillStyle = PALETTE.red;
        ctx.font = 'bold 18px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚠', BLOT.x, BLOT.y - BLOT.r - 14);
        ctx.restore();
      } else {
        drawInkPath(ctx, pts, { color: PALETTE.blue, width: 3.5 });
      }

      // open：绿色帧刻度（相似度高）
      if (lv === 'open') {
        for (let i = 6; i < pts.length - 6; i += 10) {
          const p = pts[i];
          const q = pts[i + 1];
          const dx = q.x - p.x;
          const dy = q.y - p.y;
          const len = Math.hypot(dx, dy) || 1;
          ctx.save();
          ctx.strokeStyle = PALETTE.green;
          ctx.globalAlpha = 0.8;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(p.x - (dy / len) * 5, p.y + (dx / len) * 5);
          ctx.lineTo(p.x + (dy / len) * 5, p.y - (dx / len) * 5);
          ctx.stroke();
          ctx.restore();
        }
      }

      // closed：执行偏差逐段滚大（红色虚线偏移）
      if (lv === 'closed') {
        const drift = pts.map((p, i) => {
          const u = i / (pts.length - 1);
          const grow = Math.pow(Math.max(0, u - 0.35) / 0.65, 1.6) * 34;
          return { x: p.x + grow * 0.86, y: p.y - grow * 0.5 };
        });
        drawGhostPath(ctx, drift, { color: PALETTE.red, width: 2.2, dash: [5, 4], alpha: 0.85 });
        drawSceneLabel(ctx, drift[drift.length - 1].x - 8, drift[drift.length - 1].y - 16, '执行偏差', {
          size: 11,
          align: 'right',
          color: PALETTE.red,
        });
      }

      // 右侧判定条
      const j = JUDGE[lv];
      const px = 528;
      drawSceneLabel(ctx, px, 96, j.label, { size: 13, color: j.color });
      ctx.fillStyle = PALETTE.grid;
      ctx.fillRect(px, 110, 150, 14);
      ctx.fillStyle = j.color;
      ctx.fillRect(px, 110, 150 * j.value, 14);
      drawSceneLabel(ctx, px, 142, j.value.toFixed(2), { size: 16, color: j.color });
      drawSceneLabel(ctx, px, 166, j.cap, { size: 11 });
      // 尺子小图标
      ctx.save();
      ctx.strokeStyle = j.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, 60);
      ctx.lineTo(px + 64, 60);
      for (let k = 0; k <= 4; k++) {
        ctx.moveTo(px + k * 16, 60);
        ctx.lineTo(px + k * 16, 60 + (k % 2 === 0 ? 8 : 5));
      }
      ctx.stroke();
      ctx.restore();

      // 底部三枚小尺标（当前橙）
      const marks = ['开环', '闭环', '物理'];
      const ids: Lens[] = ['open', 'closed', 'phys'];
      for (let i = 0; i < 3; i++) {
        const mx = 180 + i * 130;
        const cur = ids[i] === lv;
        ctx.save();
        ctx.strokeStyle = cur ? PALETTE.orange : PALETTE.grid;
        ctx.lineWidth = cur ? 2 : 1.4;
        ctx.fillStyle = cur ? 'rgba(240, 126, 71, 0.08)' : PALETTE.paper;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(mx, 268, 96, 24, 12) : ctx.rect(mx, 268, 96, 24);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = cur ? PALETTE.orange : PALETTE.muted;
        ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(marks[i], mx + 48, 281);
        ctx.restore();
      }

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
    };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row" role="group" aria-label="评估视角">
        {LENSES.map((l) => (
          <button
            key={l.id}
            className={`chip ${lens === l.id ? 'selected' : ''}`}
            aria-pressed={lens === l.id}
            onClick={() => {
              lensRef.current = l.id;
              setLens(l.id);
            }}
          >
            {l.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${FB[lens].cls}`}>{FB[lens].text}</div>
    </div>
  );
};

export default M91ThreeLenses;
