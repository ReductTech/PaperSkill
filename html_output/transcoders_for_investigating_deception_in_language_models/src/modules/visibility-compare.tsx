import { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import { COLORS, drawArrow, drawNode, drawSeal, drawText, roundedRect } from './case-file-analogy';

type Phase = 'idle' | 'output' | 'isolated' | 'cross-layer' | 'complete';

const PHASE_ORDER: Phase[] = ['idle', 'output', 'isolated', 'cross-layer', 'complete'];

function drawComparison(canvas: HTMLCanvasElement, phase: Phase) {
  const ctx = setupCanvas(canvas, 560, 240);
  canvas.style.width = '100%';
  canvas.style.maxWidth = '560px';
  canvas.style.height = 'auto';
  canvas.style.aspectRatio = '7 / 3';
  ctx.clearRect(0, 0, 560, 240);
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, 560, 240);
  const step = PHASE_ORDER.indexOf(phase);

  roundedRect(ctx, 16, 12, 528, 32, 7);
  ctx.fillStyle = '#edf3ea';
  ctx.fill();
  drawText(ctx, '同一密钥任务 · 同一输出标签 D', 280, 28, {
    size: 13,
    align: 'center',
    color: COLORS.blue,
    weight: 700,
  });

  roundedRect(ctx, 16, 58, 252, 150, 7);
  ctx.fillStyle = '#fffaf8';
  ctx.fill();
  ctx.strokeStyle = step >= 2 ? COLORS.red : COLORS.border;
  ctx.lineWidth = step >= 2 ? 2.5 : 1.5;
  ctx.stroke();
  drawText(ctx, '只看输出 / 单点特征', 142, 76, { size: 12, align: 'center', color: COLORS.red, weight: 700 });

  roundedRect(ctx, 292, 58, 252, 150, 7);
  ctx.fillStyle = '#fbfdfb';
  ctx.fill();
  ctx.strokeStyle = step >= 3 ? COLORS.green : COLORS.border;
  ctx.lineWidth = step >= 3 ? 2.5 : 1.5;
  ctx.stroke();
  drawText(ctx, '需要的跨层电路视图', 418, 76, { size: 12, align: 'center', color: COLORS.green, weight: 700 });

  if (step >= 1) {
    drawText(ctx, 'D', 55, 120, { size: 26, align: 'center', color: COLORS.red, weight: 800 });
    drawText(ctx, 'D', 331, 120, { size: 26, align: 'center', color: COLORS.red, weight: 800 });
  } else {
    drawText(ctx, '等待开始', 142, 133, { size: 14, align: 'center', color: COLORS.muted });
    drawText(ctx, '等待开始', 418, 133, { size: 14, align: 'center', color: COLORS.muted });
  }

  const leftNodes = [
    { x: 105, y: 113 },
    { x: 158, y: 144 },
    { x: 213, y: 111 },
  ];
  const rightNodes = [
    { x: 380, y: 113 },
    { x: 435, y: 148 },
    { x: 496, y: 110 },
  ];
  if (step >= 2) {
    leftNodes.forEach((node, index) => drawNode(ctx, node.x, node.y, `信号 ${index + 1}`, true, false, 9));
    rightNodes.forEach((node, index) => drawNode(ctx, node.x, node.y, `特征 ${index + 1}`, true, step >= 4, 9));
    drawText(ctx, '能定位相关信号', 142, 188, { size: 11, align: 'center', color: COLORS.red });
  }
  if (step >= 3) {
    drawArrow(ctx, 341, 120, 370, 114, COLORS.blue, 2.5);
    drawArrow(ctx, 390, 119, 425, 141, COLORS.blue, 2.5);
    drawArrow(ctx, 445, 141, 486, 114, step >= 4 ? COLORS.green : COLORS.blue, 2.5);
    drawText(ctx, '跨层依赖可追踪', 418, 188, { size: 11, align: 'center', color: COLORS.green, weight: 700 });
  }
  drawSeal(ctx, 248, 82, false, '缺口');
  drawSeal(ctx, 524, 82, step >= 4, '路径');
  drawText(ctx, '能力对比，不是性能基准', 280, 224, { size: 11, align: 'center', color: COLORS.muted });
  canvas.classList.add('is-ready');
}

export function VisibilityCompare() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timersRef = useRef<number[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => drawComparison(canvas, phase);
    draw();
    return observeCanvas(canvas, draw, () => {});
  }, [phase]);

  useEffect(
    () => () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
    },
    []
  );

  const start = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
    setPhase('output');
    timersRef.current.push(window.setTimeout(() => setPhase('isolated'), 700));
    timersRef.current.push(window.setTimeout(() => setPhase('cross-layer'), 1500));
    timersRef.current.push(window.setTimeout(() => setPhase('complete'), 2400));
  };

  const reset = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
    setPhase('idle');
  };

  const feedback: Record<Phase, { text: string; color: string }> = {
    idle: { text: '两侧从同一个 D 标签出发，比较它们还能解释到哪一步。', color: COLORS.blue },
    output: { text: '输出评估告诉我们发生了 D，但还没有说明内部原因。', color: COLORS.blue },
    isolated: { text: '探针或 SAE 可以定位相关特征；这里仍看不到它们怎样跨层相互作用。', color: COLORS.red },
    'cross-layer': { text: '右侧开始补出从前层到后层再到输出的依赖路径。', color: COLORS.blue },
    complete: { text: '要研究电路，需要同时暴露特征，并保留跨层依赖路径。', color: COLORS.green },
  };
  const current = feedback[phase];

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button type="button" onClick={start} disabled={phase !== 'idle' && phase !== 'complete'}>
          {phase === 'complete' ? '再次对比' : '开始对比'}
        </button>
        <button type="button" onClick={reset} disabled={phase === 'idle'}>
          复位
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={560}
        height={240}
        role="img"
        aria-label="输出和单点特征视图与跨层电路视图的同步对比"
        style={{ display: 'block', width: '100%', maxWidth: 560, height: 'auto', margin: '0 auto' }}
      />
      <div
        className="feedback"
        aria-live="polite"
        style={{ borderLeft: `4px solid ${current.color}`, background: `${current.color}12`, padding: '10px 12px' }}
      >
        {current.text}
      </div>
    </div>
  );
}
