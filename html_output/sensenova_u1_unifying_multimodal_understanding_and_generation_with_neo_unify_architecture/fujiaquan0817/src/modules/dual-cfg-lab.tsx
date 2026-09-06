import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C } from './studio-kit';

const W = 960;
const H = 460;
type CfgState = { gamma: number; gammaImg: number };

const shared = C as unknown as Record<string, string>;
const ink = (key: string, fallback: string) => shared[key] || fallback;
const P = {
  field: ink('field', '#f5f8f0'), desk: ink('desk', '#b8c9a7'), contour: ink('contour', '#76906a'),
  camera: ink('camera', '#92400e'), blue: ink('blue', '#27446e'), green: ink('green', '#228d5c'),
  red: ink('red', '#c43f52'), orange: ink('orange', '#d97706'), purple: ink('purple', '#7c3aed'),
  text: ink('text', '#21324a'), muted: ink('muted', '#68778f'), border: ink('border', '#d7deea'), white: '#ffffff',
};

function snap(value: number, min: number, max: number) {
  return Math.round(clamp(value, min, max) * 4) / 4;
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = P.text, size = 14) {
  ctx.fillStyle = color;
  ctx.font = `600 ${size}px system-ui, sans-serif`;
  ctx.fillText(text, x, y);
}

function coords(state: CfgState) {
  return { x: 72 + (state.gamma / 6) * 344, y: 344 - (state.gammaImg / 3) * 260 };
}

function drawCfg(ctx: CanvasRenderingContext2D, state: CfgState) {
  const current = coords(state);
  const target = coords({ gamma: 4, gammaImg: 1 });
  const hit = state.gamma === 4 && state.gammaImg === 1;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = P.field;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = P.desk;
  ctx.fillRect(0, 382, W, 78);

  ctx.fillStyle = P.white;
  ctx.strokeStyle = P.border;
  ctx.lineWidth = 2;
  ctx.fillRect(28, 42, 424, 330);
  ctx.strokeRect(28, 42, 424, 330);
  label(ctx, '二维 CFG 参数平面（非质量曲线）', 48, 69, P.text, 16);
  ctx.strokeStyle = P.border;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 6; i += 1) {
    const x = 72 + (344 * i) / 6;
    ctx.beginPath(); ctx.moveTo(x, 84); ctx.lineTo(x, 344); ctx.stroke();
    label(ctx, String(i), x - 4, 365, P.muted, 11);
  }
  for (let i = 0; i <= 3; i += 1) {
    const y = 344 - (260 * i) / 3;
    ctx.beginPath(); ctx.moveTo(72, y); ctx.lineTo(416, y); ctx.stroke();
    label(ctx, String(i), 52, y + 4, P.muted, 11);
  }
  label(ctx, 'γ：文本引导 →', 278, 365, P.blue, 13);
  ctx.save();
  ctx.translate(48, 228);
  ctx.rotate(-Math.PI / 2);
  label(ctx, '图像上下文引导 →', 0, 0, P.purple, 13);
  ctx.restore();

  ctx.strokeStyle = P.green;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(target.x, target.y, 14, 0, Math.PI * 2); ctx.stroke();
  label(ctx, '论文报告 (4,1)', target.x - 56, target.y - 20, P.green, 12);
  ctx.strokeStyle = P.blue;
  ctx.setLineDash([5, 5]);
  ctx.beginPath(); ctx.moveTo(current.x, current.y); ctx.lineTo(target.x, target.y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = hit ? P.green : P.orange;
  ctx.beginPath(); ctx.arc(current.x, current.y, 11, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = P.text;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = P.white;
  ctx.strokeStyle = P.border;
  ctx.fillRect(486, 42, 446, 230);
  ctx.strokeRect(486, 42, 446, 230);
  label(ctx, '文本与图像条件示意', 510, 70, P.text, 16);
  ctx.fillStyle = P.camera;
  ctx.fillRect(520, 176, 92, 54);
  ctx.fillStyle = P.contour;
  ctx.beginPath(); ctx.arc(566, 203, 24, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = P.white;
  ctx.strokeStyle = P.contour;
  ctx.lineWidth = 3;
  ctx.fillRect(780, 102, 112, 126);
  ctx.strokeRect(780, 102, 112, 126);
  label(ctx, '文字构图标记', 790, 128, P.blue, 12);
  ctx.strokeStyle = P.blue;
  ctx.lineWidth = 2 + state.gamma * 0.55;
  ctx.globalAlpha = 0.28 + state.gamma / 10;
  ctx.beginPath(); ctx.moveTo(610, 184); ctx.lineTo(780, 126); ctx.lineTo(780, 176); ctx.closePath(); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = P.purple;
  ctx.lineWidth = 2 + state.gammaImg;
  ctx.beginPath(); ctx.moveTo(610, 212); ctx.lineTo(780, 184); ctx.lineTo(780, 220); ctx.closePath(); ctx.stroke();

  ctx.fillStyle = P.white;
  ctx.strokeStyle = P.border;
  ctx.lineWidth = 1;
  ctx.fillRect(486, 288, 446, 84);
  ctx.strokeRect(486, 288, 446, 84);
  label(ctx, '文本差分', 510, 318, P.blue, 12);
  ctx.fillStyle = P.blue;
  ctx.fillRect(610, 305, (state.gamma / 6) * 278, 16);
  label(ctx, '图像上下文差分', 510, 351, P.purple, 12);
  ctx.fillStyle = P.purple;
  ctx.fillRect(610, 338, (state.gammaImg / 3) * 278, 16);
  label(ctx, `文本引导=${state.gamma.toFixed(2)}　图像引导=${state.gammaImg.toFixed(2)}`, 640, 397, hit ? P.green : P.blue, 15);
  label(ctx, '平面不表示质量高低', 698, 426, P.muted, 13);
}

export const DualCfgLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const visibleRef = useRef(true);
  const draggingRef = useRef(false);
  const [state, setState] = useState<CfgState>({ gamma: 1, gammaImg: 1 });
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try { ctxRef.current = setupCanvas(canvas, W, H); } catch { return; }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    const render = () => {
      if (!ctxRef.current) return;
      drawCfg(ctxRef.current, stateRef.current);
      canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, () => { visibleRef.current = true; render(); }, () => { visibleRef.current = false; });
    render();
    return disconnect;
  }, []);

  useEffect(() => {
    if (visibleRef.current && ctxRef.current) drawCfg(ctxRef.current, state);
  }, [state]);

  const update = (gamma: number, gammaImg: number) => setState({ gamma: snap(gamma, 0, 6), gammaImg: snap(gammaImg, 0, 3) });
  const updateFromPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * W;
    const y = ((event.clientY - rect.top) / rect.height) * H;
    update(((x - 72) / 344) * 6, ((344 - y) / 260) * 3);
  };
  const hit = state.gamma === 4 && state.gammaImg === 1;
  const distance = Math.hypot((state.gamma - 4) / 6, (state.gammaImg - 1) / 3);
  const far = distance > 0.75 || state.gamma === 0 || state.gamma === 6 || state.gammaImg === 0 || state.gammaImg === 3 || (state.gamma === 1 && state.gammaImg === 1);
  const feedback = hit
    ? '命中报告设置：X2I 中的文本引导为 4、图像上下文引导为 1。训练时以 10% 概率丢文本，另有 10% 概率同时丢文本与图像；这是经验设置，不是跨任务普适最优。'
    : far
      ? '过弱/过强示意：当前组合离论文报告点较远；这不是论文测得的质量下降区。'
      : `正在探索：文本引导 ${state.gamma.toFixed(2)} 调节文本差分，图像引导 ${state.gammaImg.toFixed(2)} 调节图像上下文差分。`;

  const onKeyDown = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    const amount = event.shiftKey ? 0.5 : 0.25;
    if (event.key === 'ArrowLeft') update(state.gamma - amount, state.gammaImg);
    else if (event.key === 'ArrowRight') update(state.gamma + amount, state.gammaImg);
    else if (event.key === 'ArrowDown') update(state.gamma, state.gammaImg - amount);
    else if (event.key === 'ArrowUp') update(state.gamma, state.gammaImg + amount);
    else if (event.key === 'Home') update(0, state.gammaImg);
    else if (event.key === 'End') update(6, state.gammaImg);
    else return;
    event.preventDefault();
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        tabIndex={0}
        role="slider"
        aria-label="双条件 CFG 二维手柄"
        aria-valuetext={`文本引导 ${state.gamma.toFixed(2)}，图像上下文引导 ${state.gammaImg.toFixed(2)}`}
        onKeyDown={onKeyDown}
        onPointerDown={(event) => { draggingRef.current = true; event.currentTarget.setPointerCapture(event.pointerId); updateFromPointer(event); }}
        onPointerMove={(event) => { if (draggingRef.current) updateFromPointer(event); }}
        onPointerUp={(event) => {
          draggingRef.current = false;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => { draggingRef.current = false; }}
      />
      <div className="ctrl" role="group" aria-label="双条件引导控件">
        <label>
          文本 γ <span className="val">{state.gamma.toFixed(2)}</span>
          <input type="range" min={0} max={6} step={0.25} value={state.gamma} onChange={(event) => update(Number(event.target.value), state.gammaImg)} />
        </label>
        <label>
          图像上下文引导 <span className="val">{state.gammaImg.toFixed(2)}</span>
          <input type="range" min={0} max={3} step={0.25} value={state.gammaImg} onChange={(event) => update(state.gamma, Number(event.target.value))} />
        </label>
        <button type="button" onClick={() => update(4, 1)}>论文报告设置</button>
        <button type="button" onClick={() => update(1, 1)}>恢复初始值</button>
      </div>
      <div className={`feedback ${hit ? 'good' : far ? 'bad' : ''}`} aria-live="polite">{feedback}</div>
      <div className="feedback" style={ { borderLeftColor: P.orange } }>
        有效范围：文本引导为 [0,6]，图像上下文引导为 [0,3]；仅 (4,1) 是本章论文报告点，其他组合不评价质量。
      </div>
    </div>
  );
};

export default DualCfgLab;
