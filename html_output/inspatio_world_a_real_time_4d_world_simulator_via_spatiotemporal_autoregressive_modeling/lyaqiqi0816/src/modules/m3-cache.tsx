import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C,
  clearScene,
  drawRoadH,
  drawCar,
  drawAlbum,
  drawMirror,
  drawLighthouse,
  sceneLabel,
  inset,
} from './scene-kit';

const W = 560;
const H = 260;

type Mode = 'none' | 'hist' | 'full';

// §3 M3.1 — memory-mode chips + start: outcomes per ST-Cache configuration
// (schematic renderings of roles described in paper §3.2.1).
export const M3Cache: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ mode: 'full' as Mode, phase: 0, running: false, done: false });
  const rafRef = useRef<number | null>(null);
  const startTs = useRef(0);
  const [mode, setMode] = useState<Mode>('full');
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState({ text: '选一种记忆配置，点「出发」。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { mode: Mode; phase: number }, time: number) => {
      const p = clamp(s.phase, 0, 1);
      clearScene(ctx, W, H);
      const roadY = 150;
      const carX = 40 + p * 420;
      // road base
      if (s.mode === 'none') {
        drawRoadH(ctx, roadY, 16, Math.max(80, carX), 24);
        // early warping after 30%
        const wav = p > 0.3 ? (p - 0.3) * 26 : 0;
        ctx.strokeStyle = `rgba(146,64,14,${Math.max(0.3, 1 - p)})`;
        ctx.lineWidth = 2;
        for (const sign of [-1, 1]) {
          ctx.beginPath();
          for (let x = carX; x <= 500; x += 6) {
            const y = roadY + sign * 12 + Math.sin(x * 0.09 + time * 0.002) * wav * ((x - carX) / 460);
            if (x === carX) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else {
        drawRoadH(ctx, roadY, 16, 500, 24);
      }
      // lighthouse: drifts off place in hist mode after 60%
      let lhY = roadY - 14;
      let lhX = 486;
      if (s.mode === 'hist' && p > 0.6) {
        lhY -= (p - 0.6) * 60;
        lhX += (p - 0.6) * 40;
      }
      drawLighthouse(ctx, lhX, lhY, 1);
      if (s.mode === 'hist' && p > 0.6) {
        ctx.strokeStyle = C.orange;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(462, roadY - 46, 48, 40);
        ctx.setLineDash([]);
        sceneLabel(ctx, '对不上参考位置', 400, 66, false, 11);
      }
      // album stand + mirror per mode
      if (s.mode === 'full') {
        drawAlbum(ctx, 80, 78, 1);
        ctx.strokeStyle = 'rgba(39,68,110,0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(80, 86);
        ctx.quadraticCurveTo((80 + carX) / 2, 60, carX, roadY - 20);
        ctx.stroke();
      } else {
        ctx.globalAlpha = 0.3;
        drawAlbum(ctx, 80, 78, 1);
        ctx.globalAlpha = 1;
      }
      if (s.mode !== 'none') drawMirror(ctx, carX, roadY - 30, 0.9);
      const carColor = s.mode === 'none' && p > 0.45 ? C.red : C.blue;
      drawCar(ctx, carX, roadY - 2, 0.9, carColor, Math.sin(time * 0.008) * 0.8);
      sceneLabel(
        ctx,
        s.mode === 'none' ? '无记忆' : s.mode === 'hist' ? '仅滑窗历史' : '滑窗 + 参考锚点',
        20,
        26,
        false,
        12
      );
      // drift curve inset (schematic)
      inset(ctx, 330, 12, 214, 88);
      sceneLabel(ctx, '漂移误差（示意）', 338, 28, true, 10);
      ctx.strokeStyle = C.border;
      ctx.beginPath();
      ctx.moveTo(342, 92);
      ctx.lineTo(536, 92);
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = s.mode === 'none' ? C.red : s.mode === 'hist' ? C.orange : C.green;
      ctx.beginPath();
      for (let x = 0; x <= p; x += 0.02) {
        const px = 342 + x * 194;
        let py: number;
        if (s.mode === 'none') py = 92 - Math.pow(x, 1.6) * 58;
        else if (s.mode === 'hist') py = 92 - (x > 0.6 ? Math.pow(x - 0.6, 1.4) * 90 : x * 6);
        else py = 90 - x * 4;
        if (x === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      // KV memory bar
      if (s.mode !== 'none') {
        sceneLabel(ctx, 'KV 缓存：恒定', 338, 122, true, 10);
        ctx.fillStyle = C.blue;
        ctx.fillRect(338, 128, 150, 10);
        ctx.strokeStyle = C.border;
        ctx.strokeRect(338, 128, 198, 10);
      } else {
        sceneLabel(ctx, '无缓存', 338, 122, true, 10);
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (t: number) => {
      const s = stateRef.current;
      if (s.running) {
        const el = (t - startTs.current) / 2400;
        s.phase = easeInOutQuad(clamp(el, 0, 1));
        if (el >= 1) {
          s.running = false;
          s.done = true;
          setRunning(false);
          const m = s.mode;
          if (m === 'none') {
            setFeedback({
              text: '没有记忆：不到半程结构就崩了（对应「空间持久性退化」）。',
              cls: 'bad',
            });
          } else if (m === 'hist') {
            setFeedback({
              text: '只有短期滑窗：动作平滑，但走远后场景对不上参考——长期一致性缺位。',
              cls: '',
            });
          } else {
            setFeedback({
              text: '滑窗管平滑、参考锚点管一致，且 KV 缓存恒定——这就是 ST-Cache。',
              cls: 'good',
            });
          }
        }
      }
      render(s, t);
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

  const pick = (m: Mode) => {
    const s = stateRef.current;
    s.mode = m;
    s.phase = 0;
    s.done = false;
    s.running = false;
    setMode(m);
    setRunning(false);
    setFeedback({ text: '配置已切换。点「出发」看这一种记忆的结局。', cls: '' });
  };

  const go = () => {
    const s = stateRef.current;
    s.phase = 0;
    s.done = false;
    s.running = true;
    startTs.current = performance.now();
    setRunning(true);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${mode === 'none' ? 'selected' : ''}`} onClick={() => pick('none')}>
          无记忆
        </button>
        <button className={`chip ${mode === 'hist' ? 'selected' : ''}`} onClick={() => pick('hist')}>
          仅滑窗历史
        </button>
        <button className={`chip ${mode === 'full' ? 'selected' : ''}`} onClick={() => pick('full')}>
          滑窗 + 参考锚点
        </button>
        <button className="chip" onClick={go} disabled={running}>
          出发
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M3Cache;
