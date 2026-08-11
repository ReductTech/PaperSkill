import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, clearScene, drawSceneLabel } from './kit-p4';
import type { WidgetProps } from './registry';

// Ch10 M10.2: P4 chips single / transfer / cifar — evidence bars + limits note.
const W = 560;
const H = 240;

const METRICS = [
  {
    id: 'single',
    label: '单模型',
    title: 'ImageNet 验证集 top-5（越低越好）',
    rows: [
      { name: 'ResNet-34', v: 5.71, lower: true },
      { name: 'ResNet-50', v: 5.25, lower: true },
      { name: 'ResNet-101', v: 4.60, lower: true },
      { name: 'ResNet-152', v: 4.49, lower: true, best: true },
    ],
    max: 6,
    note: '152 层单模型 4.49%，超过此前所有集成结果。',
    cls: 'good',
  },
  {
    id: 'transfer',
    label: '迁移检测',
    title: 'COCO mAP@[.5,.95]（越高越好）',
    rows: [
      { name: 'VGG-16', v: 21.2, lower: false },
      { name: 'ResNet-101', v: 27.2, lower: false, best: true },
    ],
    max: 30,
    note: '仅换骨干，COCO mAP@[.5,.95] 提高 6.0 个点（28% 相对提升），纯靠特征。',
    cls: 'good',
  },
  {
    id: 'cifar',
    label: 'CIFAR 深度',
    title: 'CIFAR-10 测试误差（越低越好）',
    rows: [
      { name: 'ResNet-20', v: 8.75, lower: true },
      { name: 'ResNet-110', v: 6.43, lower: true, best: true },
      { name: 'ResNet-1202', v: 7.93, lower: true, over: true },
    ],
    max: 10,
    note: '1202 层训练 <0.1% 但测试回升——小数据集过拟合。',
    cls: '',
  },
];

export const Ch10Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ metric: 'single' });
  const rafRef = useRef<number | null>(null);
  const [metric, setMetric] = useState('single');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { metric: string }) => {
      clearScene(ctx, W, H);
      const m = METRICS.find((x) => x.id === s.metric) || METRICS[0];
      drawSceneLabel(ctx, m.title, W / 2, 16, C.muted, 'center');
      const barX = 170;
      const barW = 340;
      m.rows.forEach((r, i) => {
        const y = 48 + i * 40;
        const len = (r.v / m.max) * barW;
        ctx.fillStyle = r.best ? C.green : r.over ? C.orange : C.blue;
        ctx.fillRect(barX, y, len, 20);
        ctx.strokeStyle = r.best ? C.green : C.border;
        ctx.lineWidth = r.best ? 2 : 1;
        ctx.strokeRect(barX, y, len, 20);
        ctx.fillStyle = C.ink;
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(r.name, 20, y + 15);
        ctx.fillStyle = r.best ? C.green : r.over ? C.orange : C.ink;
        ctx.fillText(`${r.v}`, barX + len + 8, y + 15);
      });
      // limits note
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.fillRect(30, 190, 500, 40);
      ctx.strokeRect(30, 190, 500, 40);
      drawSceneLabel(ctx, '边界与局限：1202 层小数据集过拟合；投影捷径非必需；退化机理论文留作未来工作。', 36, 202, C.orange);
    };
    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
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

  const pick = (id: string) => {
    stateRef.current.metric = id;
    setMetric(id);
  };

  const m = METRICS.find((x) => x.id === metric) || METRICS[0];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {METRICS.map((x) => (
          <button key={x.id} className={`chip ${x.id === metric ? 'active' : ''}`} onClick={() => pick(x.id)}>
            {x.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${m.cls}`}>{m.note}</div>
    </div>
  );
};

export default Ch10Mod2;
