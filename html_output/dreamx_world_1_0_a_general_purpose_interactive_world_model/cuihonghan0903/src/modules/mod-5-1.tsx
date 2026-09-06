import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import * as K from './roadKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 260;

type Mode = 'none' | 'single' | 'composable';

const RECORDS: Record<Mode, { entity: string; pred: string; anchor: string; span: string; interact: string }> = {
  none: { entity: '——', pred: '——', anchor: '——', span: '——', interact: '——' },
  single: { entity: '天空', pred: '下雪', anchor: '全场景', span: '2s – 5s', interact: '——' },
  composable: {
    entity: '天空/行人/车辆/信号灯',
    pred: '下雪/横穿/避让/变红',
    anchor: '全景/斑马线/路口/右侧',
    span: '2s – 5s',
    interact: '车辆避让行人',
  },
};

export const Mod51: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>('none');
  const modeRef = useRef<Mode>('none');
  modeRef.current = mode;
  const snowRef = useRef<{ x: number; y: number; v: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const t0 = performance.now();
    if (snowRef.current.length === 0) {
      for (let i = 0; i < 40; i++)
        snowRef.current.push({ x: Math.random() * 300, y: Math.random() * 200, v: 0.4 + Math.random() * 0.8 });
    }
    let carX = 30;
    let last = t0;

    const frame = (now: number) => {
      const m = modeRef.current;
      const time = (now - t0) / 1000;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      K.clearScene(ctx, W, H);
      // scene area
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = K.C.axis;
      ctx.beginPath();
      ctx.roundRect(16, 16, 310, 228, 6);
      ctx.fill();
      ctx.stroke();
      ctx.save();
      ctx.beginPath();
      ctx.rect(18, 18, 306, 224);
      ctx.clip();
      // ground & road & tree
      ctx.fillStyle = K.C.ground;
      ctx.fillRect(18, 190, 306, 52);
      K.drawRoad(ctx, 18, 172, 306, 14);
      K.drawTree(ctx, 250, 172, 1.1);

      // zebra crossing (composable only)
      const CROSS_X = 200;
      if (m === 'composable') {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        for (let i = 0; i < 3; i++) ctx.fillRect(CROSS_X - 8 + i * 7, 173, 4, 12);
      }

      // pedestrian crossing cycle (composable only)
      const pCycle = (time % 8) / 8;
      const pVisible = m === 'composable' && pCycle > 0.15 && pCycle < 0.8;
      const py = 145 + Math.min(1, Math.max(0, (pCycle - 0.15) / 0.65)) * 70;
      const pOnRoad = pVisible && py > 158 && py < 196;

      // car: parked in none/single; drives and yields to the pedestrian in composable
      let yielding = false;
      if (m === 'composable') {
        const front = carX + 16;
        const stopX = CROSS_X - 36;
        yielding = pOnRoad && front < CROSS_X - 10 && carX > CROSS_X - 130;
        if (!yielding) carX += 55 * dt;
        else if (front > stopX) carX = stopX - 16; // hold at the stop line
        if (carX > 330) carX = 20;
        K.drawCar(ctx, carX, 172, 1, yielding ? K.C.emph : K.C.guide);
        if (yielding) {
          ctx.fillStyle = 'rgba(196,63,82,0.9)';
          ctx.beginPath();
          ctx.arc(carX - 14, 168, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        carX = 30;
        K.drawCar(ctx, 90, 172, 1, K.C.guide);
      }

      // signal light: red while the car yields, green otherwise (composable)
      ctx.strokeStyle = K.C.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(292, 172);
      ctx.lineTo(292, 100);
      ctx.stroke();
      const sigRed = m === 'composable' && yielding;
      ctx.fillStyle = m !== 'composable' ? K.C.axis : sigRed ? K.C.bad : K.C.good;
      ctx.beginPath();
      ctx.arc(292, 96, 6, 0, Math.PI * 2);
      ctx.fill();
      if (m === 'composable') {
        ctx.fillStyle = sigRed ? 'rgba(196,63,82,0.2)' : 'rgba(34,141,92,0.18)';
        ctx.beginPath();
        ctx.arc(292, 96, 16, 0, Math.PI * 2);
        ctx.fill();
      }

      // snow
      if (m !== 'none') {
        ctx.fillStyle = K.C.guide;
        for (const p of snowRef.current) {
          p.y += p.v;
          if (p.y > 200) p.y = 20;
          ctx.beginPath();
          ctx.arc(18 + (p.x % 300), p.y, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // pedestrian crossing the road (composable only)
      if (pVisible) {
        const step = Math.sin(time * 8) * 4;
        ctx.strokeStyle = K.C.emph;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(CROSS_X, py - 10, 4, 0, Math.PI * 2);
        ctx.moveTo(CROSS_X, py - 6);
        ctx.lineTo(CROSS_X, py + 8);
        ctx.moveTo(CROSS_X, py + 8);
        ctx.lineTo(CROSS_X - 4 - step, py + 18);
        ctx.moveTo(CROSS_X, py + 8);
        ctx.lineTo(CROSS_X + 4 + step, py + 18);
        ctx.stroke();
      }
      ctx.restore();

      // right inset: structured event record
      const ix = 340;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = K.C.axis;
      ctx.beginPath();
      ctx.roundRect(ix, 16, 204, 228, 6);
      ctx.fill();
      ctx.stroke();
      K.drawLabel(ctx, '结构化事件记录', ix + 12, 38, K.C.ink, 12);
      const r = RECORDS[m];
      const rows: [string, string][] = [
        ['实体', r.entity],
        ['谓词', r.pred],
        ['空间锚点', r.anchor],
        ['时间区间', r.span],
        ['交互', r.interact],
      ];
      rows.forEach(([k, v], i) => {
        K.drawLabel(ctx, k, ix + 12, 62 + i * 26, K.C.aux, 10);
        K.drawLabel(ctx, v, ix + 70, 62 + i * 26, K.C.ink, 10);
      });
      K.drawLabel(ctx, '单次生成，同时协调', ix + 12, 204, K.C.good, 10);
      K.drawLabel(ctx, '文本接口注入，架构不变', ix + 12, 222, K.C.muted, 10);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const fb: Record<Mode, { cls: string; text: string }> = {
    none: { cls: '', text: '没有事件指令时，世界按惯性演化——场景静止，记录为空（蓝）。' },
    single: { cls: '', text: '单一事件：「下雪了」——一个实体、一种变化，记录里只有一条（蓝）。' },
    composable: {
      cls: 'good',
      text: '组合事件：雪、行人横穿、车辆避让、信号灯变红，在单次生成中同时协调——这正是 DreamX-World 在 Table 2 中唯一全项支持的能力（绿）。',
    },
  };

  return (
    <div>
      <div className="ctrl">
        {(['none', 'single', 'composable'] as Mode[]).map((k) => (
          <button key={k} className={`chip ${mode === k ? 'active' : ''}`} onClick={() => setMode(k)}>
            {k === 'none' ? '无事件' : k === 'single' ? '单一事件' : '组合事件'}
          </button>
        ))}
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className={`feedback ${fb[mode].cls}`}>{fb[mode].text}</div>
    </div>
  );
};

export default Mod51;
