import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, clearScene, drawSceneLabel, C } from './studioKit';
import type { WidgetProps } from './registry';

// §5 模块 5.1：缩放律标定台（P4 芯片 + P1 滑杆，技术视图）
// 曲线由论文 Eq.(3)/(4) 拟合式直接绘制；数值为拟合预测，非杜撰数据点。
const W = 1080, H = 280;

export const M511: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [metric, setMetric] = useState<'gpg' | 'ed'>('gpg');
  const [pos, setPos] = useState(160);

  const mseGPG = (g: number) => 0.4549 - 8.45e-5 * g;
  const mseED = (e: number) => 0.42 * Math.pow(e, -0.2073);

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    clearScene(ctx, W, H);
    const ox = 90, oy = 220, pw = 640, ph = 170;
    // 坐标轴
    ctx.strokeStyle = C.border; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy);
    ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph);
    ctx.stroke();
    if (metric === 'gpg') {
      const g0 = 100, g1 = 220;
      const mse0 = mseGPG(g0), mse1 = mseGPG(g1);
      // y 轴映射：MSE 0.434~0.448
      const yOf = (m: number) => oy - ((m - 0.434) / (0.448 - 0.434)) * ph;
      ctx.strokeStyle = C.blue; ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const g = g0 + ((g1 - g0) * i) / 60;
        const x = ox + ((g - g0) / (g1 - g0)) * pw;
        const y = yOf(mseGPG(g));
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      const g = Math.min(220, Math.max(100, pos));
      const mx = ox + ((g - g0) / (g1 - g0)) * pw;
      ctx.fillStyle = C.orange;
      ctx.beginPath(); ctx.arc(mx, yOf(mseGPG(g)), 7, 0, Math.PI * 2); ctx.fill();
      drawSceneLabel(ctx, 'GPG (nats) →', ox + pw - 90, oy + 24, true);
      ctx.fillStyle = C.text; ctx.font = 'bold 15px monospace';
      ctx.fillText(`MSE = 0.4549 − 8.45×10⁻⁵·GPG　r = −0.984`, ox, 44);
      ctx.font = 'bold 20px monospace';
      ctx.fillText(mseGPG(g).toFixed(4), ox + pw + 20, 120);
      drawSceneLabel(ctx, '预测 MSE', ox + pw + 20, 140, true);
      drawSceneLabel(ctx, '线性律（Figure 7d）', ox, 66);
    } else {
      const e0 = 0.76, e1 = 0.84;
      // y 轴映射：MSE 0.432~0.446
      const yOf = (m: number) => oy - ((m - 0.432) / (0.446 - 0.432)) * ph;
      ctx.strokeStyle = C.blue; ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const e = e0 + ((e1 - e0) * i) / 60;
        const x = ox + ((e - e0) / (e1 - e0)) * pw;
        const y = yOf(mseED(e));
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      const e = Math.min(0.84, Math.max(0.76, pos));
      const mx = ox + ((e - e0) / (e1 - e0)) * pw;
      ctx.fillStyle = C.orange;
      ctx.beginPath(); ctx.arc(mx, yOf(mseED(e)), 7, 0, Math.PI * 2); ctx.fill();
      drawSceneLabel(ctx, 'ED →', ox + pw - 60, oy + 24, true);
      ctx.fillStyle = C.text; ctx.font = 'bold 15px monospace';
      ctx.fillText(`MSE = 0.4200 · ED^(−0.2073)　r = −0.971`, ox, 44);
      ctx.font = 'bold 20px monospace';
      ctx.fillText(mseED(e).toFixed(4), ox + pw + 20, 120);
      drawSceneLabel(ctx, '预测 MSE', ox + pw + 20, 140, true);
      drawSceneLabel(ctx, '幂律（Figure 7e）', ox, 66);
    }
  }, [metric, pos]);

  const fb = metric === 'gpg'
    ? { text: `GPG 越高，收敛损失越低（线性，r = −0.984）。当前预测 MSE = ${mseGPG(Math.min(220, Math.max(100, pos))).toFixed(4)}`, cls: 'fb-blue' }
    : { text: `幂律：MSE = 0.42·ED^(−0.207)，r = −0.971。当前预测 MSE = ${mseED(Math.min(0.84, Math.max(0.76, pos))).toFixed(4)}`, cls: 'fb-green' };

  return (
    <div className="widget">
      <canvas ref={ref} style={{ width: '100%', maxWidth: W }} />
      <div className="ctrl-row">
        <button className={metric === 'gpg' ? 'chip chip-on' : 'chip'} onClick={() => { setMetric('gpg'); setPos(160); }}>GPG（白盒）</button>
        <button className={metric === 'ed' ? 'chip chip-on' : 'chip'} onClick={() => { setMetric('ed'); setPos(0.8); }}>ED（黑盒）</button>
        <label>{metric === 'gpg' ? '配置点 GPG (100–220 nats)' : '配置点 ED (0.76–0.84)'}
          <input type="range" min={metric === 'gpg' ? 100 : 0.76}
            max={metric === 'gpg' ? 220 : 0.84}
            step={metric === 'gpg' ? 1 : 0.005}
            value={pos}
            onChange={(e) => setPos(Number(e.target.value))} />
        </label>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
