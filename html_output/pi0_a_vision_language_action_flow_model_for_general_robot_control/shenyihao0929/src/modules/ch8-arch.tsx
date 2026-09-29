import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawSceneLabel,
  drawLegend,
  drawPotter,
  drawClay,
  drawChunkStrip,
  drawArm,
} from './potteryKit';
import type { WidgetProps } from './registry';

// Ch.8 module 8.1 (P5 clickable hotspots): the whole-factory pipeline in
// eight stations. Canvas hit-testing plus a mirrored DOM button row; the
// selected node gets a green ring, upstream nodes light blue, and a fixed
// .hotspot-info region below carries the verbatim station details.
const W = 1080;
const H = 280;
const NW = 108;
const NH = 66;
const GAP = 20;
const X0 = 38;
const NY = 66;

const NODES: Array<{ name: string; color: string }> = [
  { name: '观测', color: C.blue },
  { name: '投影', color: C.blue },
  { name: 'VLM 骨干', color: C.blue },
  { name: '动作专家', color: C.purple },
  { name: '双向注意', color: C.purple },
  { name: '流输出', color: C.purple },
  { name: '欧拉', color: C.orange },
  { name: '执行', color: C.green },
];

// Verbatim station details (SKILL §8.1).
const DETAILS = [
  '输入：多相机 RGB + 语言指令 + 关节角，线性投影进 token 空间',
  '图像经预训练编码器；关节状态线性投影',
  'PaliGemma 3B：互联网预训练的看图懂话骨干（交叉熵管语言）',
  '300M 动作专家：独立权重、从零初始化（MoE 式二专家）',
  '动作 token 间全双向注意——整段动作互相看得见',
  '流匹配：训练时回归 u=A−ε',
  '推理：从噪声 10 步欧拉（δ=0.1），前缀 KV 缓存',
  '输出 50 步动作块开环执行；20Hz 机 0.8s/16 步，50Hz 机 0.5s/25 步',
];

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];

const FEEDBACKS = [
  '一切从一个观测开始：2-3 张 RGB、一句语言、一组关节角。',
  '先把家什换成同一种话：图像走预训练编码器，关节状态线性投影。',
  '掌眼 PaliGemma 3B：互联网预训练的家底，看图懂话。',
  '巧手 300M：独立权重、从零初始化——MoE 式二专家的另一位。',
  '整段动作互相看得见：全双向注意，不留自回归的顺序枷锁。',
  '流匹配出场：训练时只学一个方向 u=A−ε。',
  '十步欧拉（δ=0.1）从噪声拉出动作，前缀 KV 缓存只算一次。',
  '50 步动作块开环执行：20Hz 机 0.8s/16 步，50Hz 机 0.5s/25 步。',
];

const nodeX = (i: number) => X0 + i * (NW + GAP);

function drawMiniFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(x + 3, y + h - 4);
  ctx.lineTo(x + w * 0.38, y + h * 0.42);
  ctx.lineTo(x + w * 0.62, y + h - 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + w * 0.66, y + h * 0.55);
  ctx.lineTo(x + w - 3, y + h - 4);
  ctx.stroke();
  ctx.fillStyle = C.blue;
  ctx.beginPath();
  ctx.arc(x + w - 6, y + 5, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawGlyph(ctx: CanvasRenderingContext2D, i: number, ms: number) {
  const x = nodeX(i);
  const y = NY;
  ctx.save();
  if (i === 0) {
    // observation: two camera frames + language lines + joint arcs
    drawMiniFrame(ctx, x + 12, y + 14, 22, 17);
    drawMiniFrame(ctx, x + 38, y + 14, 22, 17);
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 68, y + 18);
    ctx.lineTo(x + 94, y + 18);
    ctx.moveTo(x + 68, y + 25);
    ctx.lineTo(x + 88, y + 25);
    ctx.moveTo(x + 68, y + 32);
    ctx.lineTo(x + 92, y + 32);
    ctx.stroke();
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = 1.75;
    for (const jx of [x + 26, x + 56]) {
      ctx.beginPath();
      ctx.arc(jx, y + 50, 8, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.beginPath();
      ctx.arc(jx, y + 50, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (i === 1) {
    // projection: varied inputs funnel into uniform tokens
    ctx.fillStyle = C.blue;
    ctx.fillRect(x + 12, y + 16, 11, 11);
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 1.75;
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 40);
    ctx.lineTo(x + 23, y + 31);
    ctx.lineTo(x + 12, y + 50);
    ctx.closePath();
    ctx.stroke();
    ctx.strokeStyle = C.muted;
    ctx.fillStyle = C.muted;
    ctx.beginPath();
    ctx.arc(x + 18, y + 52, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = C.deep;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 30, y + 14);
    ctx.lineTo(x + 50, y + 33);
    ctx.moveTo(x + 30, y + 52);
    ctx.lineTo(x + 50, y + 33);
    ctx.stroke();
    ctx.fillStyle = C.blue;
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.roundRect(x + 56 + k * 12, y + 28, 9, 9, 1.5);
      ctx.fill();
    }
  } else if (i === 2) {
    drawPotter(ctx, x + 54, y + 58, 1.0, { mode: 'eye', t: ms / 400, color: C.blue });
  } else if (i === 3) {
    drawPotter(ctx, x + 54, y + 58, 1.0, { mode: 'shape', t: ms / 300, color: C.purple });
  } else if (i === 4) {
    // full bidirectional attention between action tokens
    const sq = [x + 10, x + 34, x + 58, x + 82];
    ctx.strokeStyle = C.purple;
    ctx.lineWidth = 1.75;
    for (let k = 0; k < 3; k++) {
      const a = sq[k] + 11;
      const b = sq[k + 1] - 1;
      ctx.beginPath();
      ctx.moveTo(a + 2, y + 27);
      ctx.lineTo(b - 2, y + 27);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(a + 5, y + 23.5);
      ctx.lineTo(a + 1.5, y + 27);
      ctx.lineTo(a + 5, y + 30.5);
      ctx.moveTo(b - 5, y + 23.5);
      ctx.lineTo(b - 1.5, y + 27);
      ctx.lineTo(b - 5, y + 30.5);
      ctx.stroke();
    }
    ctx.fillStyle = C.purple;
    sq.forEach((sx) => {
      ctx.beginPath();
      ctx.roundRect(sx, y + 22, 10, 10, 2);
      ctx.fill();
    });
    ctx.setLineDash([3, 2]);
    ctx.strokeStyle = C.purple;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(x + 15, y + 18);
    ctx.quadraticCurveTo(x + 51, y + 4, x + 87, y + 18);
    ctx.moveTo(x + 15, y + 36);
    ctx.quadraticCurveTo(x + 51, y + 50, x + 87, y + 36);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  } else if (i === 5) {
    // flow matching: mid-shape clay plus the velocity arrow
    drawClay(ctx, x + 30, y + 52, 0.55, { size: 0.8, t: ms / 500, color: C.purple });
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 2.25;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 46, y + 40);
    ctx.quadraticCurveTo(x + 62, y + 30, x + 80, y + 22);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 74, y + 22);
    ctx.lineTo(x + 80, y + 22);
    ctx.lineTo(x + 79, y + 28);
    ctx.stroke();
  } else if (i === 6) {
    // 10 Euler ticks climbing from noise to action
    for (let k = 0; k < 10; k++) {
      const bh = 7 + k * 3;
      ctx.fillStyle = C.orange;
      ctx.globalAlpha = 0.35 + k * 0.065;
      ctx.fillRect(x + 10 + k * 8.5, y + 50 - bh, 5, bh);
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 24);
    ctx.lineTo(x + 22, y + 16);
    ctx.moveTo(x + 15, y + 22.5);
    ctx.lineTo(x + 22, y + 16);
    ctx.lineTo(x + 23.5, y + 23.5);
    ctx.stroke();
  } else {
    // action chunk executed open-loop
    drawArm(ctx, x + 30, y + 30, {
      scale: 0.8,
      angle: 0.45 + 0.1 * Math.sin(ms / 300),
      color: C.green,
    });
    drawChunkStrip(ctx, x + 48, y + 50, 52, 12, {
      color: C.green,
      highlightTo: 8 + Math.round(4 * (0.5 + 0.5 * Math.sin(ms / 400))),
    });
  }
  ctx.restore();
}

export const Ch8Arch: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selRef = useRef(-1);
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState(-1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const hitTest = (px: number, py: number): number => {
      for (let i = 0; i < NODES.length; i++) {
        const x = nodeX(i);
        if (px >= x - 5 && px <= x + NW + 5 && py >= NY - 26 && py <= NY + NH + 8) {
          return i;
        }
      }
      return -1;
    };

    const render = (ms: number) => {
      const s = selRef.current;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });

      // connectors between stations
      for (let i = 0; i < NODES.length - 1; i++) {
        const gx = nodeX(i) + NW + GAP / 2;
        const active = s > i;
        ctx.strokeStyle = active ? C.blue : C.border;
        ctx.lineWidth = active ? 3 : 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(gx - 3, NY + NH / 2 - 5);
        ctx.lineTo(gx + 3, NY + NH / 2);
        ctx.lineTo(gx - 3, NY + NH / 2 + 5);
        ctx.stroke();
      }

      for (let i = 0; i < NODES.length; i++) {
        const x = nodeX(i);
        // box: selected = green ring, upstream = blue, rest muted
        ctx.save();
        if (i === s) {
          ctx.fillStyle = C.white;
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 3.5;
        } else if (s >= 0 && i < s) {
          ctx.fillStyle = 'rgba(39,68,110,0.10)';
          ctx.strokeStyle = C.blue;
          ctx.lineWidth = 2.5;
        } else if (s >= 0) {
          ctx.globalAlpha = 0.78;
          ctx.fillStyle = C.white;
          ctx.strokeStyle = C.border;
          ctx.lineWidth = 2;
        } else {
          ctx.fillStyle = C.white;
          ctx.strokeStyle = '#9db4d6';
          ctx.lineWidth = 2;
        }
        ctx.beginPath();
        ctx.roundRect(x, NY, NW, NH, 6);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        if (i === s) {
          // pulsing outer ring
          ctx.save();
          ctx.globalAlpha = 0.35 + 0.18 * Math.sin(ms / 220);
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(x - 5, NY - 5, NW + 10, NH + 10, 9);
          ctx.stroke();
          ctx.restore();
        }

        drawGlyph(ctx, i, ms);

        // circled station number above the box
        ctx.save();
        ctx.fillStyle = C.white;
        ctx.strokeStyle = NODES[i].color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + NW / 2, NY - 16, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = NODES[i].color;
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), x + NW / 2, NY - 15);
        ctx.restore();
      }

      drawSceneLabel(ctx, 'π0 整机管线', 30, 22);
      drawLegend(
        ctx,
        [['VLM 侧', C.blue], ['专家侧', C.purple], ['执行', C.green]],
        30,
        258
      );
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);

    const toLocal = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) * W) / rect.width,
        y: ((e.clientY - rect.top) * H) / rect.height,
      };
    };
    const onClick = (e: MouseEvent) => {
      const p = toLocal(e);
      const hit = hitTest(p.x, p.y);
      if (hit >= 0) {
        selRef.current = hit;
        setSel(hit);
      }
    };
    const onMove = (e: MouseEvent) => {
      const p = toLocal(e);
      canvas.style.cursor = hitTest(p.x, p.y) >= 0 ? 'pointer' : 'default';
    };
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('mousemove', onMove);
    return () => {
      stop();
      disconnect();
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('mousemove', onMove);
    };
  }, []);

  const select = (i: number) => {
    selRef.current = i;
    setSel(i);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row" role="group" aria-label="管线站点">
        {NODES.map((n, i) => (
          <button
            key={n.name}
            className={`chip${sel === i ? ' selected' : ''}`}
            onClick={() => select(i)}
          >
            {`${CIRCLED[i]} ${n.name}`}
          </button>
        ))}
      </div>
      <div className="hotspot-info" style={{ minHeight: 64 }}>
        {sel < 0
          ? '八个站点串起一条管线：点击画布节点或上方按钮，查看每一站的讲究。'
          : `${CIRCLED[sel]} ${DETAILS[sel]}`}
      </div>
      <div className={`feedback ${sel < 0 ? '' : 'good'}`}>
        {sel < 0 ? '点击任一节点或按钮：从观测到执行，逐站看 π0 的整机管线。' : FEEDBACKS[sel]}
      </div>
    </div>
  );
};

export default Ch8Arch;
