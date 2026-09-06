import React, { useRef, useState } from 'react';
import { C, fillBg } from './sharedDraw';
import { usePaperCanvas } from './usePaperCanvas';
import type { WidgetProps } from './registry';

const W = 560; const H = 240;
const PARTS = ['视觉 o_t', '语言 x', '本体 e', '任务 z'];

export const Ch2Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [on, setOn] = useState([true, true, false, false]);
  const [fb, setFb] = useState({ text: '点击开关，组合 Qwen-VLA 的条件输入。', cls: '' });

  usePaperCanvas(canvasRef, W, H, (ctx) => {
    fillBg(ctx, W, H);
    on.forEach((active, i) => {
      const y = 36 + i * 46;
      ctx.fillStyle = active ? C.blue : '#e8ecf0';
      ctx.fillRect(40, y, 480, 38);
      ctx.strokeStyle = active ? C.blue : C.border;
      ctx.strokeRect(40, y, 480, 38);
      ctx.fillStyle = active ? '#fff' : C.muted;
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText(PARTS[i], 56, y + 24);
    });
    const ready = on[0] && on[1] && on[2];
    ctx.fillStyle = ready ? C.green : C.red;
    ctx.fillRect(40, 200, 480, 28);
    ctx.fillStyle = '#fff';
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText(ready ? '✓ 可预测 y_{t:t+H-1}' : '✗ 缺少关键条件', 180, 219);
  }, [on]);

  const toggle = (i: number) => {
    const next = [...on]; next[i] = !next[i]; setOn(next);
    setFb(next[0] && next[1] && next[2]
      ? { text: 'p_θ(y|o_t, x, e, z) — 视觉+语言+本体共同条件化动作序列。', cls: 'good' }
      : { text: '缺少视觉、语言或本体提示时，无法正确解码控制语义。', cls: 'bad' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">{PARTS.map((p, i) => (
        <button key={p} type="button" className={on[i] ? 'active' : ''} onClick={() => toggle(i)}>{p}</button>
      ))}</div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Ch2Mod1;
