import React, { useRef, useState } from 'react';
import { C, fillBg, pct } from './sharedDraw';
import { usePaperCanvas } from './usePaperCanvas';
import type { WidgetProps } from './registry';

const W = 560; const H = 260;

const BENCH = [
  { id: 'libero', name: 'LIBERO', value: 97.9, metric: '平均成功率 ↑', source: 'Table 4' },
  { id: 'simpler', name: 'Simpler-WidowX', value: 73.7, metric: '成功率 ↑', source: 'Table 4' },
  { id: 'robotwin', name: 'RoboTwin-E/H', value: 86.1, value2: 87.2, metric: 'Easy/Hard ↑', source: 'Table 4' },
  { id: 'r2r', name: 'R2R OSR', value: 69.0, metric: 'OSR ↑ (Val-Unseen)', source: 'Table 7' },
  { id: 'rxr', name: 'RxR SR', value: 59.6, metric: 'SR ↑ (Val-Unseen)', source: 'Table 7' },
  { id: 'aloha', name: 'ALOHA OOD', value: 76.9, metric: '平均 OOD 成功率 ↑', source: 'Table 6' },
  { id: 'domino', name: 'DOMINO 零样本', value: 26.6, metric: 'SR ↑', source: 'Table 9' },
];

export const Ch10Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [idx, setIdx] = useState(0);
  const [fb, setFb] = useState({ text: '点击 benchmark 查看论文报告数值与指标方向。', cls: '' });

  usePaperCanvas(canvasRef, W, H, (ctx) => {
    fillBg(ctx, W, H);
    BENCH.forEach((b, j) => {
      const x = 20 + j * 74;
      const h = (b.value / 100) * 140;
      ctx.fillStyle = j === idx ? C.orange : C.green;
      ctx.fillRect(x, H - 60 - h, 64, h);
      ctx.fillStyle = C.text;
      ctx.font = '8px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.name.slice(0, 9), x + 32, H - 42);
    });
    const sel = BENCH[idx];
    ctx.textAlign = 'left';
    ctx.font = 'bold 16px "Segoe UI", sans-serif';
    ctx.fillText(`${sel.name}`, 20, 28);
    ctx.font = 'bold 22px "Segoe UI", sans-serif';
    ctx.fillStyle = C.green;
    ctx.fillText(`${pct(sel.value)}${sel.value2 ? ' / ' + pct(sel.value2) : ''}`, 20, 58);
    ctx.fillStyle = C.text;
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText(`${sel.metric}`, 20, 82);
    ctx.fillStyle = C.muted;
    ctx.fillText(`出处：${sel.source} · Qwen-VLA-Instruct（或论文指定变体）`, 20, 102);

    ctx.strokeStyle = C.border;
    ctx.beginPath(); ctx.moveTo(20, 120); ctx.lineTo(540, 120); ctx.stroke();
    ctx.fillStyle = C.text;
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText('Generalist 单模型在操纵、导航、真实 OOD 与 DOMINO 等 benchmark 上均有报告结果', 20, 140);
  }, [idx]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl" style={{ flexWrap: 'wrap' }}>
        {BENCH.map((b, i) => (
          <button key={b.id} type="button" className={idx === i ? 'active' : ''} onClick={() => {
            setIdx(i);
            setFb({ text: `${b.name} ${pct(b.value)} — ${b.metric}，${b.source}`, cls: 'good' });
          }}>{b.name}</button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Ch10Mod1;
