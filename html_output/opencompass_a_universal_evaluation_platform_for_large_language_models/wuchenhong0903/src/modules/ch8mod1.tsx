import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clear, rr, label } from './kit';

// Ch8 M8.1 — "五大组件架构图" (P5 clickable hotspots, visual architecture map).
// Each component has an icon; clicking it animates a before→after of what it does.
const W = 560;
const H = 230;

const COMPONENTS = [
  { name: '配置系统', icon: '⚙️', role: '解析 CLI/文件，构建统一评测配置（模型、数据集、评测策略）。' },
  { name: '切分', icon: '✂️', role: '模型×数据集做笛卡尔积，切分成原子子任务并打包成任务列表。' },
  { name: '调度', icon: '🚚', role: '屏蔽集群异构，把子任务并行分发到本地或集群并管理重试。' },
  { name: '任务', icon: '⚡', role: '最小执行单元：OpenICLInferTask（推理）与 OpenICLEvalTask（评测）。' },
  { name: '汇总', icon: '📊', role: '聚合结果、按 abbr 映射数据集、生成可视化评测报告。' },
];

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.lineWidth = 1;
}

export const Ch8Mod1: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sel: 0 });
  const [sel, setSel] = useState(0);
  const [feedback, setFeedback] = useState({ text: COMPONENTS[0].role, cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { sel: number }) => {
      clear(ctx, W, H);
      // Top: five component nodes with icon + name.
      for (let i = 0; i < 5; i++) {
        const x = 16 + i * 108;
        const active = i === s.sel;
        ctx.fillStyle = active ? C.blue : '#fff';
        rr(ctx, x, 14, 100, 54, 8);
        ctx.fill();
        ctx.strokeStyle = active ? C.blue : C.axis;
        ctx.lineWidth = active ? 2.5 : 1.5;
        rr(ctx, x, 14, 100, 54, 8);
        ctx.stroke();
        ctx.lineWidth = 1;
        label(ctx, COMPONENTS[i].icon, x + 50, 36, 16, C.ink, 'center', 400);
        label(ctx, COMPONENTS[i].name, x + 50, 57, 11, active ? '#fff' : C.ink, 'center', 700);
        if (i < 4) arrow(ctx, x + 100, 41, x + 108, 41);
      }

      // Divider.
      ctx.strokeStyle = C.axis;
      ctx.beginPath();
      ctx.moveTo(24, 82);
      ctx.lineTo(536, 82);
      ctx.stroke();

      const t = performance.now() / 1000;
      const phase = (t * 0.6) % 1;
      const sel = s.sel;

      if (sel === 0) {
        // 配置系统：config 文件 → 统一评测配置
        ctx.fillStyle = '#fff';
        rr(ctx, 24, 96, 140, 100, 6);
        ctx.fill();
        ctx.strokeStyle = C.axis;
        rr(ctx, 24, 96, 140, 100, 6);
        ctx.stroke();
        for (let i = 0; i < 4; i++) {
          ctx.strokeStyle = '#dbe3ee';
          ctx.beginPath();
          ctx.moveTo(34, 112 + i * 16);
          ctx.lineTo(154, 112 + i * 16);
          ctx.stroke();
        }
        label(ctx, 'config.py', 94, 108, 12, C.muted, 'center');
        label(ctx, '异构输入', 94, 184, 11, C.muted, 'center');
        for (let i = 0; i < 3; i++) {
          const p = (phase + i / 3) % 1;
          ctx.fillStyle = C.blue;
          ctx.beginPath();
          ctx.arc(172 + p * 92, 146, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        arrow(ctx, 164, 146, 300, 146);
        ctx.fillStyle = '#fff';
        rr(ctx, 300, 96, 236, 100, 6);
        ctx.fill();
        ctx.strokeStyle = C.green;
        rr(ctx, 300, 96, 236, 100, 6);
        ctx.stroke();
        label(ctx, '统一评测配置', 418, 112, 13, C.green, 'center', 700);
        const blocks = ['模型', '数据集', '评测策略'];
        for (let i = 0; i < 3; i++) {
          const bx = 314 + i * 74;
          ctx.fillStyle = C.green;
          rr(ctx, bx, 128, 62, 40, 4);
          ctx.fill();
          label(ctx, blocks[i], bx + 31, 148, 11, '#fff', 'center', 700);
        }
      } else if (sel === 1) {
        // 切分：模型×数据集网格 → 剪刀划过 → 原子任务逐个弹出
        const cut = (t * 0.45) % 1; // 剪刀从左到右的进度（循环）
        label(ctx, '模型 × 数据集', 24, 96, 12, C.ink, 'left', 700);
        const gx = 56;
        const gy = 112;
        const cw = 36;
        const ch = 30;
        label(ctx, 'D1', gx + cw / 2, gy - 8, 11, C.orange, 'center', 700);
        label(ctx, 'D2', gx + cw + cw / 2, gy - 8, 11, C.orange, 'center', 700);
        label(ctx, 'M1', gx - 16, gy + ch / 2, 11, C.blue, 'center', 700);
        label(ctx, 'M2', gx - 16, gy + ch + ch / 2, 11, C.blue, 'center', 700);
        ctx.strokeStyle = C.axis;
        ctx.strokeRect(gx, gy, cw * 2, ch * 2);
        ctx.strokeRect(gx + cw, gy, cw, ch * 2);
        ctx.strokeRect(gx, gy + ch, cw * 2, ch);
        // 剪刀划过网格
        const scX = gx - 6 + cut * (cw * 2 + 12);
        label(ctx, '✂️', scX, gy + ch, 16, C.ink, 'center', 400);
        arrow(ctx, gx + cw * 2 + 12, gy + ch, 200, gy + ch);
        // 原子任务随剪刀进度逐个弹出
        label(ctx, '原子子任务', 286, 96, 12, C.orange, 'center', 700);
        for (let i = 0; i < 4; i++) {
          const cx = 216 + (i % 2) * 68;
          const cy = 116 + Math.floor(i / 2) * 50;
          const pop = clamp(cut * 4 - i, 0, 1);
          const s = 0.5 + 0.5 * pop;
          const w = 58 * s;
          const h = 34 * s;
          ctx.fillStyle = C.orange;
          rr(ctx, cx + (58 - w) / 2, cy + (34 - h) / 2, w, h, 4);
          ctx.fill();
          if (pop > 0.55) {
            label(ctx, `task${i + 1}`, cx + 29, cy + 17, 11, '#fff', 'center', 700);
          }
        }
      } else if (sel === 2) {
        // 调度：任务 → 并行集群节点
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = C.orange;
          rr(ctx, 24, 100 + i * 34, 56, 26, 4);
          ctx.fill();
          label(ctx, `task${i + 1}`, 52, 113 + i * 34, 10, '#fff', 'center', 700);
        }
        arrow(ctx, 80, 130, 180, 130);
        const nodes = ['本地', '阿里云 DLC', '火山引擎'];
        for (let i = 0; i < 3; i++) {
          const nx = 200;
          const ny = 88 + i * 46;
          ctx.fillStyle = '#fff';
          rr(ctx, nx, ny, 130, 40, 6);
          ctx.fill();
          ctx.strokeStyle = C.blue;
          rr(ctx, nx, ny, 130, 40, 6);
          ctx.stroke();
          label(ctx, nodes[i], nx + 16, ny + 16, 11, C.ink, 'left', 700);
          const prog = (phase + i / 3) % 1;
          ctx.fillStyle = C.axis;
          ctx.fillRect(nx + 16, ny + 26, 100, 8);
          ctx.fillStyle = C.green;
          ctx.fillRect(nx + 16, ny + 26, 100 * prog, 8);
        }
        label(ctx, '并行执行', 420, 130, 12, C.green, 'center', 700);
      } else if (sel === 3) {
        // 任务：模型 → prompt → 推理 → 评测
        const steps = ['模型', 'prompt', '推理', '评测'];
        const sx = [30, 150, 270, 390];
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = i === 3 ? C.green : C.blue;
          rr(ctx, sx[i], 110, 90, 40, 6);
          ctx.fill();
          label(ctx, steps[i], sx[i] + 45, 130, 12, '#fff', 'center', 700);
          if (i < 3) arrow(ctx, sx[i] + 90, 130, sx[i + 1], 130);
        }
        for (let i = 0; i < 4; i++) {
          const p = (phase + i / 4) % 1;
          ctx.fillStyle = C.blue;
          ctx.beginPath();
          ctx.arc(30 + p * 450, 130, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        label(ctx, 'OpenICLInferTask → OpenICLEvalTask', 280, 182, 12, C.muted, 'center');
      } else {
        // 汇总：分散分数 → 飞向柱状图报告（柱子随 phase 生长）
        label(ctx, '分散的分数', 24, 96, 12, C.ink, 'left', 700);
        const scatter: [number, number][] = [[50, 122], [80, 152], [120, 116], [160, 160], [60, 172], [140, 182]];
        for (let i = 0; i < 6; i++) {
          const bob = Math.sin(t * 2 + i) * 4;
          ctx.fillStyle = i % 3 === 0 ? C.green : i % 3 === 1 ? C.blue : C.orange;
          ctx.beginPath();
          ctx.arc(scatter[i][0], scatter[i][1] + bob, 5, 0, Math.PI * 2);
          ctx.fill();
        }
        arrow(ctx, 190, 150, 260, 150);
        for (let i = 0; i < 3; i++) {
          const p = (phase + i / 3) % 1;
          ctx.fillStyle = C.blue;
          ctx.beginPath();
          ctx.arc(190 + p * 70, 150, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        label(ctx, '可视化评测报告', 405, 90, 12, C.green, 'center', 700);
        const bars = [40, 70, 52, 88, 64];
        const bx = 290;
        for (let i = 0; i < 5; i++) {
          const grow = clamp(phase * 6 - i, 0, 1);
          const h = bars[i] * (0.2 + 0.8 * grow);
          const x = bx + i * 40;
          ctx.fillStyle = i % 2 ? C.blue : C.green;
          ctx.fillRect(x, 188 - h, 30, h);
          label(ctx, `D${i + 1}`, x + 15, 202, 9, C.muted, 'center');
        }
      }
    };
    let raf = 0;
    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
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

  const pick = (i: number) => {
    stateRef.current.sel = i;
    setSel(i);
    setFeedback({ text: COMPONENTS[i].role, cls: '' });
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {COMPONENTS.map((c, i) => (
          <button key={c.name} className={`chip ${sel === i ? 'selected' : ''}`} onClick={() => pick(i)}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch8Mod1;
