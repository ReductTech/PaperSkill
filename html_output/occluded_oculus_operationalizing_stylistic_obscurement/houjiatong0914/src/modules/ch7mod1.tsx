import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COLORS, clearScene, drawLabel } from './paper-kit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const AXIS_MAX = 4.7;

type Row = { id: string; label: string; injection: boolean; excerpt: number[]; full: number[] };

// Verbatim distance values from the paper: Table 1 (abstract-length excerpts) and
// Table 2 (full text supplied). Columns are Gilmore, Hughes x5, May x2.
const ROWS: Row[] = [
  { id: 'T', label: '翻译 (T)', injection: false, excerpt: [1.4909, 1.1674, 0.4281, 1.1754, 1.3988, 0.9596, 1.3570, 1.3277], full: [1.0180, 1.0364, 0.3009, 0.8126, 1.0363, 0.7121, 1.3628, 1.3790] },
  { id: 'O', label: '混淆 (O)', injection: false, excerpt: [1.5406, 1.2635, 0.4312, 1.2169, 1.4552, 1.0557, 1.4330, 1.3984], full: [1.2253, 1.1676, 0.4177, 0.9250, 1.1575, 0.8916, 1.4529, 1.4772] },
  { id: 'IM', label: '模仿 (IM)', injection: false, excerpt: [1.4809, 1.3692, 1.0477, 1.3855, 1.4421, 1.3102, 1.3495, 1.3163], full: [1.1861, 1.1586, 0.8651, 0.9927, 1.2019, 1.0485, 1.4635, 1.4687] },
  { id: 'T+O', label: 'T+O', injection: false, excerpt: [1.5558, 1.2770, 0.6802, 1.3349, 1.4995, 1.1017, 1.3970, 1.3665], full: [1.2015, 1.1523, 0.5500, 0.9552, 1.1417, 0.8644, 1.4261, 1.4554] },
  { id: 'IM+T', label: 'IM+T', injection: false, excerpt: [1.3875, 1.2032, 0.8119, 1.1997, 1.3188, 1.0720, 1.2391, 1.2046], full: [1.0685, 1.0920, 0.7291, 0.9264, 1.1271, 0.9535, 1.3637, 1.3754] },
  { id: 'IM+O', label: 'IM+O', injection: false, excerpt: [1.6918, 1.5171, 0.9933, 1.5046, 1.6843, 1.2794, 1.5981, 1.5649], full: [1.1642, 1.1630, 0.6939, 0.9639, 1.1953, 0.9936, 1.4438, 1.4557] },
  { id: 'IM+T+O', label: 'IM+T+O', injection: false, excerpt: [1.4693, 1.2625, 0.9328, 1.3659, 1.4867, 1.1840, 1.3891, 1.3546], full: [1.1441, 1.1669, 0.7885, 1.0397, 1.2376, 1.0408, 1.4704, 1.4735] },
  { id: 'IN', label: '注入 (IN)', injection: true, excerpt: [2.7552, 3.0981, 3.5869, 3.5320, 2.7861, 3.4888, 2.7051, 2.6731], full: [4.0406, 4.2784, 4.3920, 4.2842, 4.2937, 4.3705, 4.4215, 4.5029] },
  { id: 'IN+T', label: 'IN+T', injection: true, excerpt: [2.8497, 3.1926, 3.6814, 3.6265, 2.8806, 3.5833, 2.7996, 2.7676], full: [4.2021, 4.4399, 4.5535, 4.4456, 4.4552, 4.5320, 4.5830, 4.6644] },
  { id: 'IN+O', label: 'IN+O', injection: true, excerpt: [2.8016, 3.1445, 3.6333, 3.5784, 2.8325, 3.5352, 2.7515, 2.7195], full: [4.0168, 4.2546, 4.3682, 4.2604, 4.2699, 4.3468, 4.3977, 4.4791] },
  { id: 'IN+IM', label: 'IN+IM', injection: true, excerpt: [2.6720, 3.0148, 3.5036, 3.4487, 2.7028, 3.4056, 2.6218, 2.5899], full: [3.7997, 4.0374, 4.1511, 4.0432, 4.0528, 4.1296, 4.1806, 4.2619] },
  { id: 'IN+T+O', label: 'IN+T+O', injection: true, excerpt: [2.7321, 3.0749, 3.5638, 3.5088, 2.7629, 3.4657, 2.6819, 2.6500], full: [4.0364, 4.2742, 4.3878, 4.2800, 4.2895, 4.3663, 4.4173, 4.4987] },
  { id: 'IN+IM+O', label: 'IN+IM+O', injection: true, excerpt: [2.6568, 2.9859, 3.4747, 3.4198, 2.6877, 3.3766, 2.6066, 2.5747], full: [3.7606, 3.9939, 4.1075, 3.9997, 4.0092, 4.0860, 4.1465, 4.2236] },
  { id: 'IN+IM+T', label: 'IN+IM+T', injection: true, excerpt: [2.4820, 2.8157, 3.3045, 3.2496, 2.5129, 3.2064, 2.4318, 2.3999], full: [3.6339, 3.8717, 3.9853, 3.8775, 3.8870, 3.9638, 4.0182, 4.0962] },
  { id: 'IN+IM+T+O', label: 'IN+IM+T+O', injection: true, excerpt: [2.7325, 3.0754, 3.5642, 3.5093, 2.7634, 3.4661, 2.6823, 2.6504], full: [3.7836, 4.0213, 4.1350, 4.0271, 4.0367, 4.1135, 4.1645, 4.2458] },
];

const COLUMNS = ['Gilmore', 'Hughes', 'Hughes', 'Hughes', 'Hughes', 'Hughes', 'May', 'May'];

export const Ch7Mod1: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);
  const [version, setVersion] = useState<'full' | 'excerpt'>('full');
  const [rowId, setRowId] = useState('IN+T');
  const [fb, setFb] = useState({ text: '全文版：IN+T 的 8 列距离为 4.20–4.66，是全文实验中的最高值。', cls: 'good' });

  const row = ROWS.find((r) => r.id === rowId) || ROWS[8];
  const values = version === 'full' ? row.full : row.excerpt;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = () => {
      clearScene(ctx, W, H);
      const baseY = 236;
      const maxH = 180;
      for (let i = 0; i < values.length; i++) {
        const x = 150 + i * 110;
        const h = (values[i] / AXIS_MAX) * maxH;
        ctx.fillStyle = '#edf1ea';
        ctx.fillRect(x, baseY - maxH, 62, maxH);
        ctx.fillStyle = row.injection ? COLORS.green : COLORS.red;
        ctx.fillRect(x, baseY - h, 62, h);
        drawLabel(ctx, values[i].toFixed(2), x + 2, baseY - h - 8, COLORS.ink, 16);
      }
      ctx.strokeStyle = COLORS.line;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(120, baseY); ctx.lineTo(W - 60, baseY); ctx.stroke();
      drawLabel(ctx, version === 'full' ? '全文版' : '节选版', 40, 60, COLORS.muted, 20);
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; };
    const start = () => { if (!raf.current) raf.current = requestAnimationFrame(tick); };
    const off = observeCanvas(canvas, start, stop);
    return () => { stop(); off(); };
  }, [values, row.injection, version]);

  const pick = (id: string) => {
    const r = ROWS.find((x) => x.id === id);
    if (!r) return;
    setRowId(id);
    const vals = version === 'full' ? r.full : r.excerpt;
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const highest = id === 'IN+T' && version === 'full';
    setFb({
      text: r.label + '：8 列距离 ' + lo.toFixed(2) + '–' + hi.toFixed(2) + '。' +
        (r.injection ? '含注入，距离整体偏高。' : '不含注入，距离仍在低位，classify() 仍能正确归属。') +
        (highest ? '这是全文实验中的最高值。' : ''),
      cls: r.injection ? 'good' : 'bad',
    });
  };

  const changeVersion = (v: 'full' | 'excerpt') => {
    setVersion(v);
    const vals = v === 'full' ? row.full : row.excerpt;
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    setFb({
      text: (v === 'full' ? '全文版（表 2）：' : '节选版（表 1）：') + row.label + ' 8 列距离 ' + lo.toFixed(2) + '–' + hi.toFixed(2) + '。' +
        (row.injection ? '含注入，距离整体偏高。' : '不含注入，距离仍在低位。'),
      cls: row.injection ? 'good' : 'bad',
    });
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl chips">
        <button className={'chip' + (version === 'full' ? ' selected' : '')} onClick={() => changeVersion('full')}>全文版（表 2）</button>
        <button className={'chip' + (version === 'excerpt' ? ' selected' : '')} onClick={() => changeVersion('excerpt')}>节选版（表 1）</button>
      </div>
      <div className="ctrl chips">
        {ROWS.map((r) => (
          <button key={r.id} className={'chip' + (rowId === r.id ? ' selected' : '')} onClick={() => pick(r.id)}>
            {r.label}
          </button>
        ))}
      </div>
      <div className="detail-panel" style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>8 列训练文本的真实距离</div>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
          {values.map((v, i) => (
            <li key={i}>{COLUMNS[i]}：{v.toFixed(4)}</li>
          ))}
        </ul>
        <div style={{ marginTop: 10, color: 'var(--paper-ink-muted)' }}>
          脚注：论文 §1.2 的表述是“四个簇可导出十五种场景，其中第一种是对照组”；但表 1 / 表 2 实际列出的是 15 种非空对抗组合、并未包含对照组行。本教程按表格口径表述为“15 种非空组合，另以未改写原文为对照”。
        </div>
      </div>
      <div className={'feedback ' + fb.cls}>{fb.text}</div>
    </div>
  );
};

export default Ch7Mod1;
