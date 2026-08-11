import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, clearScene, drawSceneLabel } from './kit-p2';
import type { WidgetProps } from './registry';

// Ch6 M6.1: P2 stepper through 7 pipeline stages — tensor sizes update.
const W = 560;
const H = 240;

const STAGES = [
  { label: '输入', size: '224×224×3', note: 'RGB 图像输入' },
  { label: 'conv1', size: '112×112×64', note: '7×7 卷积，stride 2' },
  { label: 'conv2_x', size: '56×56×64', note: '第一个残差阶段' },
  { label: 'conv3_x', size: '28×28×128', note: '分辨率减半，通道加倍' },
  { label: 'conv4_x', size: '14×14×256', note: '通道继续加倍' },
  { label: 'conv5_x', size: '7×7×512', note: '最深的特征图' },
  { label: 'GAP + fc', size: '1000', note: '全局平均池化 + softmax' },
];

export const Ch6Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ stage: 0 });
  const rafRef = useRef<number | null>(null);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { stage: number }) => {
      clearScene(ctx, W, H);
      const n = STAGES.length;
      const nodeW = 60;
      const gap = 16;
      const total = n * nodeW + (n - 1) * gap;
      const x0 = (W - total) / 2;
      const y = 90;
      // pipeline
      for (let i = 0; i < n; i++) {
        const x = x0 + i * (nodeW + gap);
        const active = i === s.stage;
        const done = i < s.stage;
        ctx.strokeStyle = active ? C.blue : done ? C.green : C.border;
        ctx.fillStyle = active ? 'rgba(39,68,110,0.12)' : C.white;
        ctx.lineWidth = active ? 2.5 : 1.5;
        ctx.fillRect(x, y, nodeW, 34);
        ctx.strokeRect(x, y, nodeW, 34);
        ctx.fillStyle = active ? C.blue : done ? C.green : C.muted;
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(STAGES[i].label, x + nodeW / 2, y + 20);
      }
      // detail panel
      const st = STAGES[s.stage];
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.fillRect(40, 160, 480, 56);
      ctx.strokeRect(40, 160, 480, 56);
      drawSceneLabel(ctx, `当前张量：${st.size}`, 56, 172, C.blue);
      drawSceneLabel(ctx, st.note, 56, 194, C.muted);
      drawSceneLabel(ctx, `阶段 ${s.stage + 1} / ${n}`, 500, 172, C.muted, 'right');
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

  const go = (ns: number) => {
    const s = clamp(ns, 0, STAGES.length - 1);
    stateRef.current.stage = s;
    setStage(s);
  };

  const st = STAGES[stage];
  const feedback =
    stage === STAGES.length - 1
      ? '全局平均池化 + 1000 类 softmax——推理完成，一次前向。'
      : `${st.label}：${st.size}，${st.note}。`;

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button onClick={() => go(stage - 1)} disabled={stage === 0}>
          上一步
        </button>
        <button onClick={() => go(stage + 1)} disabled={stage === STAGES.length - 1}>
          下一层
        </button>
        <button onClick={() => go(0)}>重置</button>
      </div>
      <div className={`feedback ${stage === STAGES.length - 1 ? 'good' : ''}`}>{feedback}</div>
    </div>
  );
};

export default Ch6Mod1;
