import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §10 Module 10.1 (P8 result race, technical): verified values from Table 4, lower-is-better.
const W = 1080;
const H = 280;

type Metric = 'cd' | 'axis';

const DATA: Record<Metric, { name: string; v: number | null; ours?: boolean }[]> = {
  cd: [
    { name: 'Articulate Anything', v: 23.31 },
    { name: 'Singapo', v: 21.10 },
    { name: 'URDFormer', v: 25.42 },
    { name: 'PhysForge', v: 10.21, ours: true },
  ],
  axis: [
    { name: 'Articulate Anything', v: 0.694 },
    { name: 'Singapo', v: null },
    { name: 'URDFormer', v: null },
    { name: 'PhysForge', v: 0.164, ours: true },
  ],
};

const MAXV: Record<Metric, number> = { cd: 26, axis: 0.75 };

export const Ch10Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ t: 0, running: false, metric: 'cd' as Metric });
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const [metric, setMetric] = useState<Metric>('cd');
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState({ text: '点击“开始对比”，四种方法从同一基线出发（越低越好）。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    // displayed bar widths and label opacity trail their targets with
    // delta-time damping, so metric switches and restarts morph smoothly
    // instead of popping to zero/full.
    const widths = [0, 0, 0, 0];
    let labelA = 0;
    let lastT: number | null = null;

    const render = (time: number) => {
      const dt = lastT === null ? 0 : Math.min((time - lastT) / 1000, 0.1);
      lastT = time;
      const k = 1 - Math.exp(-dt / 0.15);
      const s = stateRef.current;
      if (s.running) {
        if (startRef.current === null) startRef.current = time;
        s.t = Math.min((time - startRef.current) / 1500, 1);
        if (s.t >= 1) {
          s.running = false;
          setDone(true);
          setFeedback(
            s.metric === 'cd'
              ? { text: 'CD 10.21 对 21.10–25.42：PhysForge 保真大幅领先（越低越好）。', cls: 'good' }
              : { text: '全类别轴误差 0.164 对 0.694；未报告者按协议不参与比较。', cls: 'good' }
          );
        }
      }
      const rows = DATA[s.metric];
      const maxv = MAXV[s.metric];
      const labelTarget = s.t >= 1 ? 1 : 0;
      labelA += (labelTarget - labelA) * k;
      if (Math.abs(labelA - labelTarget) < 0.02) labelA = labelTarget;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      // shared axis
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(300, 30);
      ctx.lineTo(300, 250);
      ctx.stroke();
      // small note: both metrics are error metrics — lower bar = better
      ctx.fillStyle = '#68778f';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('误差越低越好（条形越短越好）', 310, 24);
      rows.forEach((r, i) => {
        const by = 40 + i * 56;
        ctx.fillStyle = '#21324a';
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.fillText(r.name, 60, by + 24);
        if (r.v === null) {
          ctx.fillStyle = '#68778f';
          ctx.fillText('未报告', 320, by + 24);
          return;
        }
        const targetW = easeOutCubic(s.t) * (r.v / maxv) * 700;
        widths[i] += (targetW - widths[i]) * k;
        if (Math.abs(widths[i] - targetW) < 0.5) widths[i] = targetW;
        const w = widths[i];
        ctx.fillStyle = r.ours ? '#228d5c' : '#76906a';
        ctx.fillRect(302, by, w, 34);
        if (labelA > 0.01) {
          ctx.save();
          ctx.globalAlpha = labelA;
          ctx.fillStyle = '#21324a';
          ctx.font = '16px "Segoe UI", sans-serif';
          const label = r.v.toFixed(s.metric === 'cd' ? 2 : 3);
          ctx.fillText(label, 310 + w, by + 24);
          if (r.ours) {
            // trophy goes AFTER the number so it never covers the digits
            const nw = ctx.measureText(label).width;
            ctx.font = '20px "Segoe UI", sans-serif';
            ctx.fillText('🏆', 316 + w + nw, by + 26);
          }
          ctx.restore();
        }
      });
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (time: number) => {
      render(time);
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

  const onStart = () => {
    stateRef.current.t = 0;
    stateRef.current.running = true;
    startRef.current = null;
    setStarted(true);
    setDone(false);
    setFeedback({ text: '竞速进行中：条形越短，误差越低……', cls: '' });
  };

  const onMetric = (m: Metric) => {
    stateRef.current.metric = m;
    stateRef.current.t = 0;
    stateRef.current.running = false;
    startRef.current = null;
    setMetric(m);
    setDone(false);
    setStarted(false);
    setFeedback({ text: '点击“开始对比”，四种方法从同一基线出发（越低越好）。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className="chip" onClick={onStart}>
          {done ? '再跑一次' : started ? '重新开始' : '开始对比'}
        </button>
        <button className={`chip ${metric === 'cd' ? 'selected' : ''}`} onClick={() => onMetric('cd')}>
          CD（%）越低越好
        </button>
        <button className={`chip ${metric === 'axis' ? 'selected' : ''}`} onClick={() => onMetric('axis')}>
          轴误差（全类别）越低越好
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      <table style={{ width: '100%', marginTop: 10, borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #d7deea' }}>
            <th style={{ padding: '6px 8px' }}>协议（越低越好均标注）</th>
            <th style={{ padding: '6px 8px' }}>指标</th>
            <th style={{ padding: '6px 8px' }}>PhysForge</th>
            <th style={{ padding: '6px 8px' }}>最强基线</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #d7deea' }}>
            <td style={{ padding: '6px 8px' }}>PartObjaverse-Tiny（200 件）</td>
            <td style={{ padding: '6px 8px' }}>Voxel recall ↑</td>
            <td style={{ padding: '6px 8px' }}>77.16</td>
            <td style={{ padding: '6px 8px' }}>OmniPart 73.79</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #d7deea' }}>
            <td style={{ padding: '6px 8px' }}>PhysXNet 测试集（1000 件）</td>
            <td style={{ padding: '6px 8px' }}>CD ↓ / 尺度 MAE ↓</td>
            <td style={{ padding: '6px 8px' }}>9.21 / 11.04cm</td>
            <td style={{ padding: '6px 8px' }}>PhysXGen 9.81 / 25.83cm</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #d7deea' }}>
            <td style={{ padding: '6px 8px' }}>PhysDB 测试集（1000 件）</td>
            <td style={{ padding: '6px 8px' }}>Interaction 相似度 ↑</td>
            <td style={{ padding: '6px 8px' }}>0.96</td>
            <td style={{ padding: '6px 8px' }}>PhysXGen 0.34</td>
          </tr>
          <tr>
            <td style={{ padding: '6px 8px' }}>340 件关节物体</td>
            <td style={{ padding: '6px 8px' }}>CD ↓ / 轴误差-5 ↓</td>
            <td style={{ padding: '6px 8px' }}>10.21 / 0.101</td>
            <td style={{ padding: '6px 8px' }}>Singapo 21.10 / 0.241</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Ch10Mod1;
