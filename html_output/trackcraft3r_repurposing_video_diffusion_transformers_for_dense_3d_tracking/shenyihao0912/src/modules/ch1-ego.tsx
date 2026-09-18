import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, drawSceneBg, drawDog, drawTracker, drawCamcorder, drawSofa, drawSceneLabel } from './dogKit';
import type { WidgetProps } from './registry';

// Module 1.1 镜头 vs 狗：谁在动？ — drag the camcorder (or use the slider) and
// toggle the dog's walk. Left 55%: viewfinder scene, (u,v) readout tracks −camX.
// Right 45%: top-view world grid, (X,Z) stays fixed unless the dog walks.
const W = 1080;
const H = 280;
const SPLIT = 594;

interface EgoState {
  camX: number; // −140..140 px
  dogWalk: boolean;
  acted: boolean; // learner has interacted at least once
}

export const Ch1Ego: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<EgoState>({ camX: 0, dogWalk: false, acted: false });
  const walkRef = useRef(0); // patrol phase, advances only while walking
  const rafRef = useRef<number | null>(null);
  const [camX, setCamX] = useState(0);
  const [dogWalk, setDogWalk] = useState(false);
  const [feedback, setFeedback] = useState({ text: '拖动相机或让小狗走动，对比两组读数。', cls: '' });

  const updateFeedback = () => {
    const s = stateRef.current;
    if (!s.acted) return;
    if (s.dogWalk && Math.abs(s.camX) > 100) {
      setFeedback({ text: '画面运动几乎全是相机造成的，直接看画面会完全误判小狗的轨迹。', cls: 'bad' });
    } else if (s.dogWalk) {
      setFeedback({ text: '现在两组坐标都在变：相机自运动 + 物体真实运动叠加。', cls: 'good' });
    } else {
      setFeedback({ text: '画面坐标在变，世界坐标纹丝不动——是相机在动。', cls: '' });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const dogWorldX = () => (stateRef.current.dogWalk ? 1.2 + 0.6 * Math.sin(walkRef.current) : 1.2);

    const render = (s: EgoState, wx: number) => {
      ctx.clearRect(0, 0, W, H);
      // ---- left 55%: viewfinder scene ----
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, SPLIT, H);
      ctx.clip();
      drawSceneBg(ctx, SPLIT, H);
      const vf = { x: 36, y: 22, w: 522, h: 182 };
      ctx.fillStyle = C.white;
      ctx.fillRect(vf.x, vf.y, vf.w, vf.h);
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(vf.x, vf.y, vf.w, vf.h);
      drawSofa(ctx, vf.x + vf.w - 74, vf.y + vf.h - 20, 0.75);
      // dog position inside the viewfinder mirrors the camera pan
      const uRaw = vf.x + vf.w / 2 + (wx - 1.2) * 216 - s.camX * 1.5;
      const dogU = clamp(uRaw, vf.x + 44, vf.x + vf.w - 74);
      const dogGround = vf.y + vf.h - 14;
      drawDog(ctx, dogU, dogGround, 0.95, { mood: s.dogWalk ? 'walk' : 'idle', t: walkRef.current });
      drawTracker(ctx, dogU + 22, dogGround - 24, 3);
      drawCamcorder(ctx, clamp(SPLIT / 2 + s.camX * 1.5, 64, SPLIT - 64), H - 12, { scale: 1.2 });
      // readouts: bare numbers
      drawSceneLabel(ctx, '画面坐标', vf.x + 8, vf.y + 15, { color: C.blue });
      const u = Math.round(uRaw);
      const v = Math.round(150 + (s.dogWalk ? Math.sin(walkRef.current * 2) * 4 : 0));
      ctx.fillStyle = C.blue;
      ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`u,v = ${u},${v}`, vf.x + vf.w - 8, vf.y + 15);
      ctx.restore();

      // divider
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(SPLIT, 0);
      ctx.lineTo(SPLIT, H);
      ctx.stroke();

      // ---- right 45%: top-view world grid ----
      ctx.save();
      ctx.translate(SPLIT, 0);
      drawSceneBg(ctx, W - SPLIT, H, { grid: true });
      // dog in world coordinates: fixed (green) unless walking
      const zx = 26 + wx * 180;
      const zy = 88;
      // the camera sits in the dog's HOME column (its initial spot) and moves
      // ONLY with the slider — a walking dog must never drag the camera along
      const homeZx = 26 + 1.2 * 180;
      const camWX = clamp(homeZx + s.camX * 1.2, 34, 440);
      // dashed line of sight: vertical when aligned, slanted when the camera
      // pans or the dog walks away from its home spot
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 1.25;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(camWX, H - 44);
      ctx.lineTo(zx, zy + 9);
      ctx.stroke();
      ctx.setLineDash([]);
      drawCamcorder(ctx, camWX, H - 34, { scale: 0.6 });
      drawTracker(ctx, zx, zy, 5.5);
      drawSceneLabel(ctx, '世界坐标', 12, 22, { color: C.green });
      ctx.fillStyle = C.green;
      ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`X,Z = ${wx.toFixed(2)},0.40`, 12, 44);
      ctx.restore();
    };

    let last = 0;
    const tick = (ms: number) => {
      const s = stateRef.current;
      if (last) {
        const dt = Math.min(ms - last, 100); // cap so an off-screen pause cannot jump the phase
        if (s.dogWalk) walkRef.current += (dt / 1500) * Math.PI * 2;
      }
      last = ms;
      render(s, dogWorldX());
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

    // pointer drag on the left half moves the camcorder
    const toCanvas = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (W / r.width) };
    };
    let dragging = false;
    const onDown = (e: PointerEvent) => {
      const p = toCanvas(e);
      if (p.x < SPLIT) {
        dragging = true;
        canvas.setPointerCapture(e.pointerId);
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const p = toCanvas(e);
      const s = stateRef.current;
      s.camX = clamp((p.x - SPLIT / 2) / 1.5, -140, 140);
      s.acted = true;
      setCamX(Math.round(s.camX));
      updateFeedback();
    };
    const onUp = () => {
      dragging = false;
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);

    return () => {
      stop();
      disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
  }, []);

  const toggleWalk = () => {
    const s = stateRef.current;
    s.dogWalk = !s.dogWalk;
    s.acted = true;
    setDogWalk(s.dogWalk);
    updateFeedback();
  };

  const onSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    const s = stateRef.current;
    s.camX = v;
    s.acted = true;
    setCamX(v);
    updateFeedback();
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} style={{ touchAction: 'none' }} />
      <div className="ctrl">
        <button type="button" className={`chip${dogWalk ? ' selected' : ''}`} onClick={toggleWalk}>
          {dogWalk ? '小狗静坐' : '让小狗走动'}
        </button>
        <label>
          相机位置 <span className="val">{camX}</span>
        </label>
        <input type="range" min={-140} max={140} step={1} value={camX} onChange={onSlider} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Ego;
