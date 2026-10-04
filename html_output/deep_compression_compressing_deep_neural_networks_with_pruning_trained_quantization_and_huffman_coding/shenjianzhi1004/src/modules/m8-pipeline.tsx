import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBar, drawSceneLabel, DC, useDcCanvas } from './dc-kit';

const W = 1080;
const H = 280;

const NETS = {
  alex: { name: 'AlexNet', sizes: [240, 27, 8.9, 6.9] },
  vgg: { name: 'VGG-16', sizes: [552, 42.5, 17.8, 11.3] },
};

export const M8Pipeline: React.FC<WidgetProps> = () => {
  const [p, setP] = useState(false);
  const [q, setQ] = useState(false);
  const [h, setH] = useState(false);
  const [net, setNet] = useState<'alex' | 'vgg'>('alex');

  const active = NETS[net];
  const count = (p ? 1 : 0) + (q ? 1 : 0) + (h ? 1 : 0);
  const size = active.sizes[count];
  const comp = active.sizes[0] / size;

  const ref = useDcCanvas((ctx, w, hgt) => {
    clearScene(ctx, w, hgt);
    const labels = ['原始', '剪枝', '量化', '霍夫曼'];
    const enabled = [true, p, q, h];
    const baseX = 70;
    const gap = 210;
    labels.forEach((lb, i) => {
      const cx = baseX + i * gap;
      ctx.fillStyle = enabled[i] ? (i === 0 ? DC.deskDark : DC.blue) : DC.photo;
      ctx.strokeStyle = enabled[i] ? DC.blue : DC.border;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, 70, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = enabled[i] ? '#fff' : DC.muted;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(i), cx, 75);
      ctx.textAlign = 'left';
      drawSceneLabel(ctx, cx - 24, 118, lb, enabled[i] ? DC.ink : DC.muted, 13);
      if (i < 3) {
        ctx.strokeStyle = enabled[i + 1] ? DC.blue : DC.border;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx + 28, 70);
        ctx.lineTo(cx + gap - 28, 70);
        ctx.stroke();
      }
    });
    // storage bar + compression
    drawBar(ctx, 70, 170, 900, 26, size / active.sizes[0], comp > 1 ? DC.green : DC.blue);
    drawSceneLabel(ctx, 70, 220, `${active.name} · ${size} MB`, DC.ink, 14);
    drawSceneLabel(ctx, 820, 220, `${Math.round(comp)}×`, comp > 1 ? DC.green : DC.muted, 18);
  }, W, H);

  const cls = count === 3 ? 'good' : '';
  const text =
    count === 0
      ? '先开剪枝，再叠加量化与霍夫曼。'
      : count === 3
      ? `三阶段叠加：${active.name} 压缩 ${Math.round(active.sizes[0] / active.sizes[3])}×，且精度不变。`
      : `已压缩 ${Math.round(comp)}×，还能继续叠加下一阶段。`;

  return (
    <div>
      <canvas id="cv-m8-pipeline" ref={ref} width={W} height={H} />
      <div className="step-ctrl">
        <button className={`chip ${p ? 'selected' : ''}`} onClick={() => setP((v) => !v)}>
          剪枝
        </button>
        <button
          className={`chip ${q ? 'selected' : ''}`}
          onClick={() => setQ((v) => !v)}
          disabled={!p}
          title={!p ? '需要先启用剪枝' : ''}
        >
          量化
        </button>
        <button
          className={`chip ${h ? 'selected' : ''}`}
          onClick={() => setH((v) => !v)}
          disabled={!q}
          title={!q ? '需要先启用量化' : ''}
        >
          霍夫曼
        </button>
      </div>
      <div className="chip-row">
        <button className={`chip ${net === 'alex' ? 'selected' : ''}`} onClick={() => setNet('alex')}>
          AlexNet
        </button>
        <button className={`chip ${net === 'vgg' ? 'selected' : ''}`} onClick={() => setNet('vgg')}>
          VGG-16
        </button>
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M8Pipeline;
