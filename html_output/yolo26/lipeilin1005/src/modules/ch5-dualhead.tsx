import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, startCanvasLoop, drawCyclist, lerp, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch5 Module 5.1 (P4): deployment trade-off calculator — five scales x two heads.
// E2E (one-to-one) is ~0.6-0.8 AP below the NMS path but needs zero post-processing.
const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f',
};

// scale -> [mAP NMS, mAP E2E, T4 latency ms]
const DATA: Record<string, [number, number, number]> = {
  n: [40.9, 40.1, 1.7],
  s: [48.6, 47.8, 2.5],
  m: [53.1, 52.5, 4.7],
  l: [55.0, 54.4, 6.2],
  x: [57.5, 56.9, 11.8],
};

// the two deployment routes as quadratic Béziers
const PATH_O2O = { p0: [40, 200], p1: [220, 120], p2: [420, 150] };
const PATH_O2M = { p0: [40, 200], p1: [220, 236], p2: [420, 190] };

const bez = (p: typeof PATH_O2O, u: number): [number, number] => {
  const a = (1 - u) * (1 - u);
  const b = 2 * (1 - u) * u;
  const c = u * u;
  return [
    a * p.p0[0] + b * p.p1[0] + c * p.p2[0],
    a * p.p0[1] + b * p.p1[1] + c * p.p2[1],
  ];
};

export const Ch5DualHead: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ scale: 's', head: 'o2o' });
  // eased display state
  const easeRef = useRef({ map: 47.8, lat: 2.5, u: 0, lastT: 0 });
  const [scale, setScale] = useState('s');
  const [head, setHead] = useState('o2o');
  const [fb, setFb] = useState({ text: '端到端直达：mAP 47.8，2.5 ms，零后处理——部署最简单。', cls: 'good' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (time: number) => {
      const s = stateRef.current;
      const e = easeRef.current;
      const [nms, e2e, lat] = DATA[s.scale];
      const mapTarget = s.head === 'o2o' ? e2e : nms;
      e.map = lerp(e.map, mapTarget, 0.12);
      e.lat = lerp(e.lat, lat, 0.12);
      // advance the rider along the active route; the scenic road dwells at the checkpoint
      const dt = e.lastT ? Math.min(time - e.lastT, 100) : 16;
      e.lastT = time;
      const u = e.u % 1;
      const nearCheckpoint = s.head === 'o2m' && Math.abs(u - 0.5) < 0.12;
      const speed = (s.head === 'o2o' ? 1 / 2600 : 1 / 3400) * (nearCheckpoint ? 0.3 : 1);
      e.u = (u + dt * speed) % 1;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      // ---- left: route diagram ----
      ctx.fillStyle = C.light; ctx.fillRect(0, 226, 460, 54);
      // o2o direct greenway (blue)
      ctx.strokeStyle = s.head === 'o2o' ? C.blue : 'rgba(39,68,110,0.3)';
      ctx.lineWidth = s.head === 'o2o' ? 7 : 3;
      ctx.beginPath(); ctx.moveTo(40, 200); ctx.quadraticCurveTo(220, 120, 420, 150); ctx.stroke();
      // o2m scenic road (green) + checkpoint sitting on the path
      ctx.strokeStyle = s.head === 'o2m' ? C.green : 'rgba(34,141,92,0.3)';
      ctx.lineWidth = s.head === 'o2m' ? 7 : 3;
      ctx.beginPath(); ctx.moveTo(40, 200); ctx.quadraticCurveTo(220, 236, 420, 190); ctx.stroke();
      ctx.fillStyle = s.head === 'o2m' ? C.red : 'rgba(196,63,82,0.45)';
      ctx.fillRect(212, 190, 26, 26);
      ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.fillText('检', 221, 207);
      // shared flag
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(426, 110); ctx.lineTo(426, 200); ctx.stroke();
      ctx.fillStyle = C.green;
      ctx.beginPath(); ctx.moveTo(426, 110); ctx.lineTo(452, 118); ctx.lineTo(426, 126); ctx.fill();
      // rider on the active route — fades out at the flag, fades in at the start
      const path = s.head === 'o2o' ? PATH_O2O : PATH_O2M;
      const [rx, ry] = bez(path, e.u);
      const fade = clamp(Math.min(e.u / 0.06, (1 - e.u) / 0.06), 0, 1);
      if (fade > 0) {
        ctx.save();
        ctx.globalAlpha = fade;
        drawCyclist(ctx, rx, ry - 11, {
          scale: 0.8,
          color: s.head === 'o2o' ? C.blue : C.green,
          wheelPhase: e.u * 40, pedalPhase: e.u * 26,
        });
        ctx.restore();
      }
      // ---- right inset: numbers ----
      ctx.fillStyle = '#fff'; ctx.fillRect(500, 20, 560, 240);
      ctx.strokeStyle = '#d7deea'; ctx.lineWidth = 2; ctx.strokeRect(500, 20, 560, 240);
      ctx.fillStyle = C.text; ctx.font = '15px sans-serif';
      ctx.fillText('COCO mAP', 540, 64);
      ctx.fillStyle = s.head === 'o2o' ? C.green : C.blue;
      ctx.font = '52px sans-serif';
      ctx.fillText(e.map.toFixed(1), 540, 122);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = C.muted;
      ctx.fillText(s.head === 'o2o' ? '（一对一头 · E2E）' : '（一对多头 · NMS）', 660, 116);
      // latency bar 0-12ms
      ctx.fillStyle = C.text; ctx.fillText('T4 延迟', 540, 166);
      ctx.fillStyle = '#e8edf5'; ctx.fillRect(540, 178, 400, 20);
      ctx.fillStyle = C.blue; ctx.fillRect(540, 178, (e.lat / 12) * 400, 20);
      ctx.fillStyle = C.text;
      ctx.fillText(lat.toFixed(1) + ' ms', 950, 194);
      // post-processing badge
      ctx.fillStyle = s.head === 'o2o' ? C.green : C.red;
      ctx.fillRect(540, 216, 130, 28);
      ctx.fillStyle = '#fff'; ctx.font = '13px sans-serif';
      ctx.fillText(s.head === 'o2o' ? '后处理：无' : '后处理：NMS', 552, 235);
    };

    return startCanvasLoop(canvas, render);
  }, []);

  const update = (sc: string, hd: string) => {
    stateRef.current.scale = sc;
    stateRef.current.head = hd;
    setScale(sc); setHead(hd);
    const [nms, e2e, lat] = DATA[sc];
    if (hd === 'o2o') setFb({ text: `端到端直达：mAP ${e2e.toFixed(1)}，${lat.toFixed(1)} ms，零后处理——部署最简单。`, cls: 'good' });
    else setFb({ text: `NMS 路径：mAP ${nms.toFixed(1)}，多一步后处理，精度优先时选它。`, cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          {Object.keys(DATA).map((k) => (
            <button key={k} className={`chip ${scale === k ? 'selected' : ''}`} onClick={() => update(k, head)}>{k}</button>
          ))}
        </div>
        <div className="chip-row">
          <button className={`chip ${head === 'o2o' ? 'selected' : ''}`} onClick={() => update(scale, 'o2o')}>一对一头（免 NMS）</button>
          <button className={`chip ${head === 'o2m' ? 'selected' : ''}`} onClick={() => update(scale, 'o2m')}>一对多头（NMS）</button>
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch5DualHead;
