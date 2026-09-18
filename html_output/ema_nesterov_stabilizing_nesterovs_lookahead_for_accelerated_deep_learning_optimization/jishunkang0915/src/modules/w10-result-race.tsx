import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawLabel } from './river-kit';

// §10 Module 10.1: verified result race (P8). All values are reported by the
// paper: Fig 4 (NanoGPT 124M, Track 1, 6200 iters, FineWeb) and Table 2
// (Llama, C4). Validation loss / perplexity — lower is better.

const W = 1080;
const H = 280;

const NANOGPT = [
  { name: 'Adam', base: 4.6, ema: 3.29, drop: 1.305 },
  { name: 'Muon', base: 3.5, ema: 3.29, drop: 0.208 },
  { name: 'NorMuon', base: 3.42, ema: 3.28, drop: null },
  { name: 'SOAP', base: 4.13, ema: 3.29, drop: null },
];
const LLAMA = [
  { name: '60M', base: 28.11, ema: 27.62, drop: 0.49 },
  { name: '130M', base: 21.59, ema: 21.26, drop: 0.33 },
  { name: '350M', base: 16.12, ema: 15.86, drop: 0.26 },
  { name: '1B', base: 12.22, ema: 12.12, drop: 0.1 },
];

export const W10ResultRace: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ metric: 'nanogpt', started: false, t0: 0 });
  const [fb, setFb] = useState({ text: '按下「开始比较」：按验证困惑度（越低越好）比较，数据均为论文报告值。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = () => {
      const s = stateRef.current;
      const data = s.metric === 'nanogpt' ? NANOGPT : LLAMA;
      const prog = s.started ? clamp((performance.now() - s.t0) / 1600, 0, 1) : 0;
      const ease = 1 - Math.pow(1 - prog, 3);
      clearScene(ctx, W, H);
      const rowH = (H - 60) / data.length;
      const maxV = Math.max(...data.map((d) => d.base));
      for (let i = 0; i < data.length; i++) {
        const d = data[i];
        const y = 44 + i * rowH;
        const lenBase = ((d.base - d.ema * 0.72) / maxV) * (W - 420);
        const lenEma = ((d.ema - d.ema * 0.72) / maxV) * (W - 420);
        // base optimizer bar (gray)
        ctx.fillStyle = '#9aa7b5';
        ctx.fillRect(210, y, lenBase * ease + (s.started ? 0 : 0), 16);
        // EMA bar (green) grows slightly faster (staggered)
        ctx.fillStyle = C.green;
        ctx.fillRect(210, y + 20, lenEma * ease, 16);
        ctx.fillStyle = C.text;
        ctx.font = '14px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.fillText(d.name, 120, y + 16);
        ctx.fillStyle = '#9aa7b5';
        ctx.fillText(s.started ? d.base.toFixed(d.base > 20 ? 1 : 2) : '—', 210 + lenBase * ease + 8, y + 13);
        ctx.fillStyle = C.green;
        ctx.fillText(s.started ? d.ema.toFixed(d.ema > 20 ? 1 : 2) : '—', 210 + lenEma * ease + 8, y + 33);
      }
      drawLabel(ctx, s.metric === 'nanogpt' ? 'NanoGPT 124M（Track 1，6200 迭代，FineWeb）' : 'Llama（C4，20×tokens/参数）', 60, 28, C.text, 14);
      drawLabel(ctx, '灰=基础优化器　绿=+EMA-Nesterov', 60, H - 10, C.muted, 13);
    };
    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const start = () => {
    stateRef.current.started = true;
    stateRef.current.t0 = performance.now();
    if (stateRef.current.metric === 'nanogpt')
      setFb({ text: '全部基础优化器的验证困惑度一致下降：Adam 降 1.305 最多，Muon 降 0.208（图4）。', cls: 'good' });
    else
      setFb({ text: '从 60M 到 1B 全部改善；超参建议 β=0.5，γ=0.99（≤350M）/ 0.995（>350M）（表2）。', cls: 'good' });
  };

  const pick = (m: string) => {
    stateRef.current.metric = m;
    stateRef.current.started = false;
    setFb({ text: '按下「开始比较」：按验证困惑度（越低越好）比较，数据均为论文报告值。', cls: '' });
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />
      <div className="ctrl">
        <button className={stateRef.current.metric === 'nanogpt' ? 'chip active' : 'chip'} onClick={() => pick('nanogpt')}>
          NanoGPT 124M
        </button>
        <button className={stateRef.current.metric === 'llama' ? 'chip active' : 'chip'} onClick={() => pick('llama')}>
          Llama 系列
        </button>
        <button onClick={start}>开始比较</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
      <div className="ctrl" style={{ marginTop: 8 }}>
        <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>模型 / 优化器</th>
              <th>基础优化器</th>
              <th>+EMA-Nesterov</th>
              <th>协议（越低越好）</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>NanoGPT 124M: Adam</td>
              <td style={{ textAlign: 'center' }}>4.60</td>
              <td style={{ textAlign: 'center' }}>3.29</td>
              <td style={{ textAlign: 'center' }}>验证损失，固定 6200 迭代</td>
            </tr>
            <tr>
              <td>NanoGPT 124M: Muon</td>
              <td style={{ textAlign: 'center' }}>3.50</td>
              <td style={{ textAlign: 'center' }}>3.29</td>
              <td style={{ textAlign: 'center' }}>验证损失，固定 6200 迭代</td>
            </tr>
            <tr>
              <td>Llama 1B: Muon</td>
              <td style={{ textAlign: 'center' }}>12.22</td>
              <td style={{ textAlign: 'center' }}>12.12</td>
              <td style={{ textAlign: 'center' }}>验证困惑度，5000 迭代，γ=0.999</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default W10ResultRace;
