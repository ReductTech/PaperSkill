import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawSceneLabel, insetBox } from './birdKit';

// m5-2 (savpe-branches) — 双支路探秘：语义管内容、激活管位置、聚合成提示嵌入。

const W = 1080;
const H = 280;

const INFO: Record<string, { title: string; shape: string }> = {
  semantic: { title: '语义分支：提取与提示无关的语义特征 S——管“是什么”。', shape: 'S ∈ R^(D×H×W)，来自 PAN(P3/P4/P5)' },
  activation: { title: '激活分支：在低维 A=16 通道计算位置权重 W——管“看哪里”，成本极小。', shape: 'W ∈ R^(A×H×W)，A=16 ≪ D，提示区域内 softmax 归一化' },
  aggregate: { title: '聚合：分组加权 G_i=W_i·S，拼成提示嵌入——比直接掩码池化高 1.5 AP。', shape: 'P = Concat(G₁,…,G_A)，D 通道切成 16 组共享权重' },
};

export const M5_2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sel: 'none' });
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState('none');
  const [feedback, setFeedback] = useState({ text: '点击结构图中的部件，查看各自职责与数据形状。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const block = (x: number, y: number, w: number, h: number, label: string, key: string) => {
      const cur = stateRef.current.sel === key;
      ctx.save();
      ctx.fillStyle = cur ? '#eef4ff' : '#fff';
      ctx.strokeStyle = cur ? PALETTE.blue : PALETTE.border;
      ctx.lineWidth = cur ? 3 : 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = cur ? PALETTE.blue : PALETTE.ink;
      ctx.font = (cur ? 'bold ' : '') + '14px sans-serif';
      ctx.textAlign = 'center';
      label.split('\n').forEach((ln, i) => ctx.fillText(ln, x + w / 2, y + h / 2 - 6 + i * 18));
      ctx.textAlign = 'left';
      ctx.restore();
    };
    const arrowTo = (x1: number, y1: number, x2: number, y2: number, strong: boolean) => {
      ctx.save();
      ctx.strokeStyle = strong ? PALETTE.blue : PALETTE.muted;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = strong ? 3 : 1.8;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      const a = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 9 * Math.cos(a - 0.42), y2 - 9 * Math.sin(a - 0.42));
      ctx.lineTo(x2 - 9 * Math.cos(a + 0.42), y2 - 9 * Math.sin(a + 0.42));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const render = () => {
      const s = stateRef.current;
      clearScene(ctx, W, H);

      // 输入
      block(30, 60, 110, 44, '视觉提示\n掩码 0/1', 'none');
      block(30, 170, 110, 44, 'PAN 特征\nP3/P4/P5', 'none');

      // 两条支路
      block(210, 56, 130, 52, '激活分支\nA=16 通道', 'activation');
      block(210, 166, 130, 52, '语义分支\nD 通道', 'semantic');
      arrowTo(140, 82, 210, 82, s.sel === 'activation');
      arrowTo(140, 192, 210, 192, s.sel === 'semantic');

      // W 与 S
      block(400, 60, 70, 44, 'W', 'activation');
      block(400, 170, 70, 44, 'S', 'semantic');
      arrowTo(340, 82, 400, 82, s.sel === 'activation');
      arrowTo(340, 192, 400, 192, s.sel === 'semantic');

      // 聚合
      block(540, 110, 130, 60, '聚合\nP=Concat(G)', 'aggregate');
      arrowTo(470, 82, 560, 110, s.sel === 'aggregate');
      arrowTo(470, 192, 560, 170, s.sel === 'aggregate');

      // 聚合选中：16 个小组块 × 权重条
      if (s.sel === 'aggregate') {
        for (let i = 0; i < 8; i++) {
          ctx.save();
          ctx.fillStyle = PALETTE.purple;
          ctx.globalAlpha = 0.25 + 0.6 * ((i % 4) / 3);
          ctx.fillRect(544 + i * 15, 182, 11, 20 + (i % 3) * 8);
          ctx.restore();
        }
        drawSceneLabel(ctx, '16 组共享权重', 540, 232, PALETTE.purple);
      }

      // 右侧 inset
      insetBox(ctx, 720, 44, 320, 192);
      if (s.sel === 'none') {
        drawSceneLabel(ctx, '点击左侧部件', 744, 100, PALETTE.muted);
        drawSceneLabel(ctx, '查看职责与形状', 744, 130, PALETTE.muted);
      } else {
        const info = INFO[s.sel];
        ctx.save();
        ctx.fillStyle = PALETTE.ink;
        ctx.font = '13px sans-serif';
        // 简单换行
        const words = info.title;
        let line = '';
        let y = 80;
        for (const ch of words) {
          line += ch;
          if (ctx.measureText(line).width > 270) {
            ctx.fillText(line, 744, y);
            y += 22;
            line = '';
          }
        }
        if (line) ctx.fillText(line, 744, y);
        ctx.fillStyle = PALETTE.blue;
        ctx.font = '12px sans-serif';
        ctx.fillText(info.shape.slice(0, 44), 744, 210);
        ctx.restore();
      }
    };

    const tick = () => {
      render();
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

  const onChip = (key: string) => {
    stateRef.current.sel = key;
    setSel(key);
    setFeedback({ text: INFO[key].title, cls: key === 'aggregate' ? 'good' : '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className={sel === 'semantic' ? 'chip selected' : 'chip'} onClick={() => onChip('semantic')}>
          语义分支
        </button>
        <button type="button" className={sel === 'activation' ? 'chip selected' : 'chip'} onClick={() => onChip('activation')}>
          激活分支
        </button>
        <button type="button" className={sel === 'aggregate' ? 'chip selected' : 'chip'} onClick={() => onChip('aggregate')}>
          聚合
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M5_2;
