import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第9章 模块9.2：二维柱状图 / 三维等距柱状图（对数刻度）切换 + 指标切换 + 图标
const W = 1080;
const H = 360;

// 掩码规模（SA-1B / Open Images / ADE20K）。总掩码与每图掩码为论文数据/比例换算，log 展示。
const DATA = [
  { key: 'sa1b', icon: '🖼️', name: 'SA-1B', total: 1100, perImg: 100 },
  { key: 'oi', icon: '📦', name: 'Open Images*', total: 2.75, perImg: 2.8 },
  { key: 'ade', icon: '🗺️', name: 'ADE20K*', total: 0.6, perImg: 29 },
];

type Mode = '2d' | '3d';
type Metric = 'total' | 'perimg';

export const Ch9Scales: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ mode: Mode; metric: Metric; sel: number }>({
    mode: '2d',
    metric: 'total',
    sel: 0,
  });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>('2d');
  const [metric, setMetric] = useState<Metric>('total');
  const [feedback, setFeedback] = useState({
    text: '总掩码数（对数刻度）：SA-1B 约 1.1B，Open Images 约 2.75M（约 1/400），ADE20K 约 0.6M。',
    cls: 'good',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const logVal = (v: number) => Math.log10(v + 1);
    const render = (s: { mode: Mode; metric: Metric; sel: number }) => {
      ctx.clearRect(0, 0, W, H);
      const bgGrad = ctx.createLinearGradient(40, 20, W - 40, H - 20);
      bgGrad.addColorStop(0, '#f8fbf4');
      bgGrad.addColorStop(1, '#eef3fb');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(36, 26, W - 72, H - 56);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(36, 26, W - 72, H - 56);
      const is3d = s.mode === '3d';
      const isTotal = s.metric === 'total';
      const values = DATA.map((d) => (isTotal ? d.total : d.perImg));
      const logs = values.map(logVal);
      const maxLog = Math.max(...logs);
      const n = DATA.length;
      const plotX0 = 130;
      const plotY0 = 300;
      const plotW = W - 240;
      const plotH = 210;
      const barW = 120;
      const gap = (plotW - n * barW) / (n + 1);
      const left = is3d ? 24 : 0;
      const top = is3d ? 28 : 0;
      // 基线
      ctx.strokeStyle = '#68778f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(plotX0 - 20, plotY0);
      ctx.lineTo(plotX0 + plotW + 30, plotY0);
      ctx.stroke();
      // 轴标签
      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText(isTotal ? '总掩码数（对数刻度）' : '每图平均掩码数（对数刻度）', plotX0, 52);

      for (let i = 0; i < n; i++) {
        const x = plotX0 + gap + i * (barW + gap);
        const h = (logs[i] / maxLog) * plotH;
        const on = s.sel === i;
        const col = on ? '#27446e' : '#228d5c';
        if (is3d) {
          // 伪 3D 等距柱体：正面 + 右侧面 + 顶面
          const depth = 30;
          const fx = x - left;
          const topY = plotY0 - h - top;
          ctx.fillStyle = on ? '#27446e' : '#2f9a68';
          ctx.fillRect(fx, topY, barW, h); // 正面
          ctx.fillStyle = on ? '#1e3a5c' : '#1e7a4a';
          ctx.beginPath();
          ctx.moveTo(fx + barW, topY);
          ctx.lineTo(fx + barW + depth, topY - depth);
          ctx.lineTo(fx + barW + depth, topY - depth + h);
          ctx.lineTo(fx + barW, topY + h);
          ctx.closePath();
          ctx.fill(); // 右侧
          ctx.fillStyle = on ? '#38639a' : '#37b07a';
          ctx.beginPath();
          ctx.moveTo(fx, topY);
          ctx.lineTo(fx + depth, topY - depth);
          ctx.lineTo(fx + barW + depth, topY - depth);
          ctx.lineTo(fx + barW, topY);
          ctx.closePath();
          ctx.fill(); // 顶面
          ctx.strokeStyle = '#21324a';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.roundRect(x, plotY0 - h, barW, h, 4);
          ctx.fill();
          ctx.strokeStyle = '#21324a';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        // 数值 + 图标 + 名称
        const labelY = is3d ? plotY0 - h - top - 24 : plotY0 - h - 14;
        ctx.fillStyle = '#21324a';
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(isTotal ? `${values[i] >= 100 ? (values[i] / 1000).toFixed(1) + 'B' : values[i] + 'M'}` : String(values[i]), x + barW / 2, labelY);
        ctx.font = '30px "Segoe UI", sans-serif';
        ctx.fillText(DATA[i].icon, x + barW / 2, plotY0 + 34);
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillStyle = '#21324a';
        ctx.fillText(DATA[i].name, x + barW / 2, plotY0 + 56);
        ctx.textAlign = 'left';
      }
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

  const setModeFn = (m: Mode) => {
    stateRef.current.mode = m;
    setMode(m);
  };
  const setMetricFn = (m: Metric) => {
    stateRef.current.metric = m;
    setMetric(m);
    setFeedback(
      m === 'total'
        ? { text: '总掩码数（对数）：SA-1B 约 1.1B，Open Images 约 2.75M（约 1/400），ADE20K 约 0.6M。', cls: 'good' }
        : { text: '每图平均掩码数：SA-1B 约 100，ADE20K 约 29（约 1/3.5），Open Images 约 2.8（约 1/36）。', cls: 'good' }
    );
  };
  const select = (i: number) => {
    stateRef.current.sel = i;
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={metric === 'total' ? 'btn on' : 'btn'} onClick={() => setMetricFn('total')}>
          总掩码数
        </button>
        <button className={metric === 'perimg' ? 'btn on' : 'btn'} onClick={() => setMetricFn('perimg')}>
          每图平均掩码
        </button>
        <span className="val">｜</span>
        <button className={mode === '2d' ? 'btn on' : 'btn'} onClick={() => setModeFn('2d')}>
          📊 2D 柱状图
        </button>
        <button className={mode === '3d' ? 'btn on' : 'btn'} onClick={() => setModeFn('3d')}>
          🧊 3D 等距柱状图
        </button>
        {DATA.map((d, i) => (
          <button key={d.key} className="btn" onClick={() => select(i)} title={d.name}>
            {d.icon}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch9Scales;
