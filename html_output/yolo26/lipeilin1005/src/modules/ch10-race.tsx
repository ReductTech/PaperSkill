import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch10 Module 10.1 (P8+P4): same-scale race — YOLO11 baseline vs YOLO26
// measured values (COCO mAP, Table 7), plus the full verification table.
const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f',
};

// scale -> [YOLO26 mAP NMS, mAP E2E, T4 ms, Params M, FLOPs B, YOLO11 baseline]
// YOLO11 baselines from paper Table S8 (s/m/l/x); n-scale from Ultralytics
// official release benchmark (Table S8 has no n-scale row).
const DATA: Record<string, [number, number, number, number, number, number]> = {
  n: [40.9, 40.1, 1.7, 2.4, 5.4, 39.5],
  s: [48.6, 47.8, 2.5, 9.5, 20.7, 47.0],
  m: [53.1, 52.5, 4.7, 20.4, 68.2, 51.5],
  l: [55.0, 54.4, 6.2, 24.8, 86.4, 53.4],
  x: [57.5, 56.9, 11.8, 55.7, 193.9, 54.7],
};

export const Ch10Race: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ scale: 's', racing: false, startAt: 0, progress: 0, done: false });
  const [scale, setScale] = useState('s');
  const [fb, setFb] = useState({ text: '选择尺度，按下开始，同尺度对决。', cls: '' });
  const [btn, setBtn] = useState('开始竞赛');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (time: number) => {
      const s = stateRef.current;
      if (s.racing) {
        const raw = (time - s.startAt) / 1200;
        s.progress = Math.min(raw, 1);
        if (raw >= 1) {
          s.racing = false; s.done = true;
          setBtn('再赛一次');
          const [nms, e2e, lat] = DATA[s.scale];
          setFb({ text: `YOLO26${s.scale}：${nms.toFixed(1)} mAP（E2E ${e2e.toFixed(1)}），T4 ${lat.toFixed(1)} ms——同尺度领先，且 E2E 仅低 0.6–0.8 AP。`, cls: 'good' });
        }
      }
      const [nms, , , , , base] = DATA[s.scale];
      const pBlue = easeOutCubic(Math.min(s.progress, 1));
      const pGreen = easeOutCubic(Math.max(0, Math.min((s.progress - 80 / 1200) / (1 - 80 / 1200), 1)));
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      const bx = 240; const bw = 720; const maxV = 60;
      // YOLO11 bar (blue)
      ctx.fillStyle = C.text; ctx.font = '15px sans-serif';
      ctx.fillText('YOLO11', 120, 96);
      ctx.fillStyle = '#e8edf5'; ctx.fillRect(bx, 76, bw, 34);
      ctx.fillStyle = C.blue; ctx.fillRect(bx, 76, bw * (base / maxV) * pBlue, 34);
      ctx.fillStyle = '#fff'; ctx.font = '15px sans-serif';
      if (pBlue > 0.1) ctx.fillText(base.toFixed(1), bx + bw * (base / maxV) * pBlue - 52, 99);
      // YOLO26 bar (green)
      ctx.fillStyle = C.text; ctx.font = '15px sans-serif';
      ctx.fillText('YOLO26', 120, 176);
      ctx.fillStyle = '#e8edf5'; ctx.fillRect(bx, 156, bw, 34);
      ctx.fillStyle = C.green; ctx.fillRect(bx, 156, bw * (nms / maxV) * pGreen, 34);
      ctx.fillStyle = '#fff'; ctx.font = '15px sans-serif';
      if (pGreen > 0.1) ctx.fillText(nms.toFixed(1), bx + bw * (nms / maxV) * pGreen - 52, 179);
      // delta badge
      if (s.done) {
        const delta = nms - base;
        ctx.fillStyle = C.green; ctx.fillRect(bx + bw + 16, 106, 92, 44);
        ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif';
        ctx.fillText('+' + delta.toFixed(1), bx + bw + 34, 135);
      }
      // finish scale note
      ctx.fillStyle = C.muted; ctx.font = '12px sans-serif';
      ctx.fillText('COCO mAP 50-95 · 同尺度对比', 120, 240);
    };

    const tick = (time: number) => {
      render(time);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const pick = (sc: string) => {
    stateRef.current.scale = sc;
    stateRef.current.progress = 0;
    stateRef.current.done = false;
    setScale(sc);
    setBtn('开始竞赛');
    setFb({ text: `已选 YOLO26${sc}，按下开始竞赛。`, cls: '' });
  };

  const run = () => {
    stateRef.current.progress = 0;
    stateRef.current.racing = true;
    stateRef.current.startAt = performance.now();
    setBtn('竞赛中…');
    setFb({ text: '竞赛进行中……', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          {Object.keys(DATA).map((k) => (
            <button key={k} className={`chip ${scale === k ? 'selected' : ''}`} onClick={() => pick(k)}>{k}</button>
          ))}
        </div>
        <button onClick={run} disabled={btn === '竞赛中…'}>{btn}</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
      <div className="feedback">局限：评测以 COCO 为中心；调度形状、Objects365 之外的预训练仍是开放问题。本教程聚焦闭集检测与三个任务头，YOLOE-26 开放词汇扩展（LVIS minival 文本提示 40.6 AP）未展开。</div>
      <div style={{ overflowX: 'auto', marginTop: 8 }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 13, minWidth: 560 }}>
          <thead>
            <tr>
              {['尺度', 'mAP (NMS)', 'mAP (E2E)', 'T4 延迟', '参数量', 'FLOPs'].map((h) => (
                <th key={h} style={{ border: '1px solid #d7deea', padding: '6px 10px', background: '#eef2f7', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(DATA).map(([k, v]) => (
              <tr key={k} style={{ background: k === scale ? '#e3f2ea' : '#fff' }}>
                <td style={{ border: '1px solid #d7deea', padding: '6px 10px' }}>YOLO26{k}</td>
                <td style={{ border: '1px solid #d7deea', padding: '6px 10px' }}>{v[0].toFixed(1)}</td>
                <td style={{ border: '1px solid #d7deea', padding: '6px 10px' }}>{v[1].toFixed(1)}</td>
                <td style={{ border: '1px solid #d7deea', padding: '6px 10px' }}>{v[2].toFixed(1)} ms</td>
                <td style={{ border: '1px solid #d7deea', padding: '6px 10px' }}>{v[3].toFixed(1)} M</td>
                <td style={{ border: '1px solid #d7deea', padding: '6px 10px' }}>{v[4].toFixed(1)} B</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ fontSize: 12, color: '#68778f', marginTop: 6 }}>
          协议：COCO val2017 mAP50-95，640px 输入，Objects365-v1 预训练，越高越好。YOLO26 数据来自论文 Table 7；YOLO11 基线来自论文 Table S8（s/m/l/x），n 档基线取自 Ultralytics 官方发布基准（39.5，论文 Table S8 未含 n 档）。
        </div>
      </div>
    </div>
  );
};

export default Ch10Race;
