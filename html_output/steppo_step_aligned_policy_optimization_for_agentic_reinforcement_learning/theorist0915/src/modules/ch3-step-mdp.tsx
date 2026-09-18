import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawLabel } from './roadKit';

const W = 1080, H = 300;

/** Left: token-level fake transitions; Right: step-level transition after full action. */
export const Ch3StepMdp: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tickN, setTickN] = useState(0);
  const [fb, setFb] = useState({
    text: '左侧：每吐一个 token 就“假装转移”；右侧：完整动作后才换状态。',
    cls: '',
  });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = () => {
      clearScene(ctx, W, H);
      // divider
      ctx.strokeStyle = C.axis;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(W / 2, 20);
      ctx.lineTo(W / 2, H - 20);
      ctx.stroke();
      ctx.setLineDash([]);

      drawLabel(ctx, '(a) Token-level：碎动作也换地图', 30, 36, C.red);
      drawLabel(ctx, '(b) Step-level：完整动作才转移', W / 2 + 30, 36, C.green);

      const tok = tickN % 6;
      // left tokens
      for (let i = 0; i < 6; i++) {
        const x = 40 + i * 70;
        const on = i <= tok;
        ctx.fillStyle = on ? C.orange : '#fff';
        ctx.strokeStyle = on && i === tok ? C.red : C.axis;
        ctx.lineWidth = on && i === tok ? 3 : 1;
        ctx.fillRect(x, 80, 58, 40);
        ctx.strokeRect(x, 80, 58, 40);
        drawLabel(ctx, `a${i + 1}`, x + 16, 105, on ? '#fff' : C.muted);
      }
      drawLabel(ctx, `状态已“假转移” ${tok + 1} 次`, 40, 160, C.red);
      drawLabel(ctx, '环境其实还没真正反馈', 40, 185, C.muted);

      // right step
      const phase = Math.min(3, Math.floor(tickN / 2) % 4);
      const rightSteps = ['观察 s', '完整动作 a', '奖励 r', '下一状态 s′'];
      rightSteps.forEach((name, i) => {
        const x = W / 2 + 40 + (i % 2) * 220;
        const y = 80 + Math.floor(i / 2) * 70;
        const on = i === phase;
        const done = i < phase;
        ctx.fillStyle = on ? C.blue : done ? C.green : '#fff';
        ctx.strokeStyle = on ? C.blue : C.axis;
        ctx.lineWidth = on ? 3 : 1;
        ctx.fillRect(x, y, 200, 50);
        ctx.strokeRect(x, y, 200, 50);
        drawLabel(ctx, name, x + 55, y + 32, on || done ? '#fff' : C.text);
      });
      drawLabel(ctx, phase >= 3 ? '一步闭环完成（论文 Figure 1）' : '等待完整动作…', W / 2 + 40, 250, phase >= 3 ? C.green : C.muted);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const loop = () => { render(); rafRef.current = requestAnimationFrame(loop); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(loop); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [tickN]);

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={() => {
          const n = tickN + 1;
          setTickN(n);
          const tok = n % 6;
          const phase = Math.min(3, Math.floor(n / 2) % 4);
          setFb({
            text: tok >= 4 && phase < 3
              ? '判断：token 级把决策切碎；步级把“环境真正改变”当作转移边界。'
              : phase >= 3
              ? '右侧完成 s→a→r→s′，这才是智能体交互的原子单位。'
              : '继续点击：对比左侧碎转移与右侧整步闭环。',
            cls: phase >= 3 ? 'good' : '',
          });
        }}>同步推进一步</button>
        <button type="button" onClick={() => { setTickN(0); setFb({ text: '已重置。', cls: '' }); }}>重置</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Ch3StepMdp;
