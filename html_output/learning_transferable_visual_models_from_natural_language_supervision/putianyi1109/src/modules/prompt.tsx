import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 440;
const classes = ['飞机', '汽车', '狗'];
const templates = ['A photo of a {label}.', 'A picture of a {label}.', 'a photo of the {label}.'];
const scores = [
  [0.62, 0.18, 0.12],
  [0.55, 0.22, 0.15],
  [0.48, 0.2, 0.18],
];

export const PromptWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [on, setOn] = useState([true, true, true]);
  const [fb, setFb] = useState({ text: '三个模板都启用，平均分如右表。', cls: '' });

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(c, W, H); c.classList.add('is-ready'); } catch { return; }
    ctx.fillStyle = '#f5f8f0';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.fillText('模板集成：逐模板打分，再取平均（分数为示意）', 40, 34);

    templates.forEach((t, i) => {
      const x = 40 + i * 340;
      ctx.fillStyle = on[i] ? '#228d5c' : '#b8c9a7';
      ctx.fillRect(x, 60, 310, 66);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText('模板 ' + (i + 1) + (on[i] ? '（启用）' : '（关闭）'), x + 14, 84);
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillText(t, x + 14, 108);
    });

    const active = on.filter(Boolean).length;
    const avg = classes.map((_, ci) => {
      if (!active) return 0;
      let sum = 0;
      on.forEach((v, ti) => { if (v) sum += scores[ti][ci]; });
      return sum / active;
    });

    const colX = [200, 380, 560, 740];
    ctx.font = 'bold 15px "Segoe UI", sans-serif';
    ctx.fillStyle = '#21324a';
    ctx.fillText('类别', 60, 180);
    ['模板 1', '模板 2', '模板 3', '平均'].forEach((h, i) => {
      ctx.fillStyle = i === 3 ? '#228d5c' : '#21324a';
      ctx.fillText(h, colX[i], 180);
    });

    classes.forEach((name, ci) => {
      const y = 215 + ci * 56;
      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText(name, 60, y + 20);
      templates.forEach((_, ti) => {
        ctx.fillStyle = on[ti] ? '#27446e' : '#d7deea';
        ctx.fillRect(colX[ti], y, 150, 32);
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText(scores[ti][ci].toFixed(2), colX[ti] + 8, y + 21);
      });
      ctx.fillStyle = '#228d5c';
      ctx.fillRect(colX[3], y, 150, 32);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText(active ? avg[ci].toFixed(2) : '0.00', colX[3] + 8, y + 21);
    });

    ctx.fillStyle = '#68778f';
    ctx.font = '15px "Segoe UI", sans-serif';
    ctx.fillText(active ? '平均分数用于集成；关闭模板会改变平均值' : '至少启用一个模板才能得到分数', 40, 410);
  }, [on]);

  const toggle = (i: number) => {
    const next = [...on];
    next[i] = !next[i];
    setOn(next);
    const count = next.filter(Boolean).length;
    setFb(count ? { text: '已启用 ' + count + ' 个模板，平均分随之更新。', cls: '' } : { text: '全部关闭，无法得到集成分数。', cls: 'bad' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button onClick={() => toggle(0)}>模板 1</button>
        <button onClick={() => toggle(1)}>模板 2</button>
        <button onClick={() => toggle(2)}>模板 3</button>
        <button onClick={() => { setOn([true, true, true]); setFb({ text: '三个模板全部启用。', cls: 'good' }); }}>全开</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default PromptWidget;
