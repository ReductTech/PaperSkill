import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { clearDesk, drawPoster, drawProofFrame, drawSceneLabel } from './poster-kit';

const W = 800;
const H = 360;
const C = {
  blue: '#27446e', green: '#228d5c', orange: '#d97706', purple: '#7c3aed',
  ink: '#21324a', muted: '#68778f', line: '#d7deea', paper: '#fff',
};

type Objective = 'CA' | 'DM';
type NoisePhase = 'high' | 'low';

function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  dashed = false,
) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash(dashed ? [6, 5] : []);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 8 * Math.cos(angle - Math.PI / 6), y2 - 8 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - 8 * Math.cos(angle + Math.PI / 6), y2 - 8 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function box(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  subtitle: string,
  color: string,
  active = true,
) {
  ctx.save();
  ctx.fillStyle = active ? '#ffffff' : '#f7f8fb';
  ctx.strokeStyle = active ? color : C.line;
  ctx.lineWidth = active ? 2.5 : 1;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = active ? color : C.muted;
  ctx.font = '700 12px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, x + w / 2, y + 22);
  ctx.fillStyle = C.muted;
  ctx.font = '10px "Segoe UI", sans-serif';
  ctx.fillText(subtitle, x + w / 2, y + 41);
  ctx.restore();
}

function drawInferenceFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  nfe: number,
) {
  const progress = (nfe - 1) / 7;
  drawPoster(ctx, x, y, w, h, nfe === 8 ? C.green : C.blue, 0.2 + progress * 0.78);

  const columns = 10;
  const rows = 6;
  const remaining = Math.round((1 - progress) * columns * rows);
  const cellW = w / columns;
  const cellH = h / rows;
  ctx.save();
  ctx.globalAlpha = 0.82 - progress * 0.42;
  for (let index = 0; index < remaining; index += 1) {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const shade = 116 + ((index * 47) % 112);
    ctx.fillStyle = `rgb(${shade}, ${shade}, ${Math.min(255, shade + 8)})`;
    ctx.fillRect(x + col * cellW, y + row * cellH, cellW + 0.5, cellH + 0.5);
  }
  ctx.restore();
}

export const Ch7TurboWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nfe, setNfe] = useState(1);
  const [objective, setObjective] = useState<Objective>('CA');
  const [noisePhase, setNoisePhase] = useState<NoisePhase>('high');
  const [isPlaying, setIsPlaying] = useState(false);

  const noiseExpert = noisePhase === 'high' ? '空间布局专家' : '细节渲染专家';
  const objectiveExpert = objective === 'CA' ? '文字／局部语义专家' : '数字艺术／分布专家';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';

    const draw = () => {
      clearDesk(ctx, W, H);

      // Training panel: teachers and routing exist only during MT-DMD distillation.
      ctx.fillStyle = '#f8fbff';
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 1.5;
      ctx.fillRect(18, 18, 454, 324);
      ctx.strokeRect(18.5, 18.5, 453, 323);
      ctx.textAlign = 'left';
      drawSceneLabel(ctx, '训练阶段 · MT-DMD 多教师蒸馏', 34, 45, C.blue);

      box(ctx, 38, 62, 124, 50, '状态输入', 'x_t、σ、c', C.blue);
      box(ctx, 184, 62, 104, 50, `目标 O=${objective}`, objective === 'CA' ? '轨迹对齐' : '分布匹配', C.purple);
      arrow(ctx, 162, 87, 318, 87, C.blue);
      arrow(ctx, 288, 87, 318, 87, C.purple);
      box(ctx, 318, 58, 128, 58, '动态路由 W_k', '联合状态与目标', C.orange);

      ctx.fillStyle = C.muted;
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('当前定性强调（非独占、无虚构权重）', 38, 140);

      const noiseColor = noisePhase === 'high' ? C.blue : C.green;
      const objectiveColor = objective === 'CA' ? C.orange : C.purple;
      box(
        ctx, 38, 154, 188, 58,
        noiseExpert,
        noisePhase === 'high' ? '高噪声：建立宏观构图' : '低噪声：补充材质与光照',
        noiseColor,
      );
      box(
        ctx, 258, 154, 188, 58,
        objectiveExpert,
        objective === 'CA' ? 'CA：局部拼写与结构忠实' : 'DM：整体风格与分布一致',
        objectiveColor,
      );
      arrow(ctx, 382, 116, 132, 154, noiseColor, true);
      arrow(ctx, 382, 116, 352, 154, objectiveColor, true);
      arrow(ctx, 132, 212, 218, 253, noiseColor);
      arrow(ctx, 352, 212, 266, 253, objectiveColor);
      box(ctx, 156, 248, 168, 62, 'Turbo 学生模型', '吸收组合监督', C.green);
      drawProofFrame(ctx, 150, 242, 180, 74, C.green);
      ctx.fillStyle = C.muted;
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('教师只在这一训练阶段提供监督', 240, 331);

      // Separation between training and inference is deliberately explicit.
      ctx.strokeStyle = C.line;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(486, 28);
      ctx.lineTo(486, 332);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.muted;
      ctx.font = '700 10px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('蒸馏完成', 486, 170);
      ctx.fillText('教师退出', 486, 186);

      // Inference panel: only the distilled Turbo student runs for 8 NFEs.
      ctx.fillStyle = '#f6fbf7';
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 1.5;
      ctx.fillRect(500, 18, 282, 324);
      ctx.strokeRect(500.5, 18.5, 281, 323);
      ctx.textAlign = 'left';
      drawSceneLabel(ctx, '推理阶段 · Turbo 独立生成', 516, 45, C.green);
      box(ctx, 554, 62, 172, 54, 'Turbo 学生模型', '不再调用教师', C.green);
      arrow(ctx, 486, 201, 554, 89, C.green);

      const x0 = 526;
      const x1 = 756;
      const y = 158;
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
      ctx.stroke();
      const activeX = x0 + ((nfe - 1) / 7) * (x1 - x0);
      ctx.strokeStyle = nfe === 8 ? C.green : C.blue;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(activeX, y);
      ctx.stroke();
      for (let i = 1; i <= 8; i += 1) {
        const x = x0 + ((i - 1) / 7) * (x1 - x0);
        const active = i === nfe;
        ctx.fillStyle = active ? (i === 8 ? C.green : C.blue) : C.paper;
        ctx.strokeStyle = active ? (i === 8 ? C.green : C.blue) : C.line;
        ctx.lineWidth = active ? 2.5 : 1;
        ctx.beginPath();
        ctx.arc(x, y, active ? 8 : 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = active ? C.paper : C.muted;
        ctx.font = '10px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(i), x, y + 4);
      }
      ctx.fillStyle = C.ink;
      ctx.font = '700 12px "Segoe UI", sans-serif';
      ctx.fillText(`模型函数求值 ${nfe} / 8`, 641, 190);
      drawInferenceFrame(ctx, 566, 208, 150, 94, nfe);
      if (nfe === 8) drawProofFrame(ctx, 560, 202, 162, 106, C.green);
      ctx.fillStyle = nfe === 8 ? C.green : C.muted;
      ctx.font = '700 11px "Segoe UI", sans-serif';
      ctx.fillText(
        nfe === 8 ? '8 次模型函数求值完成' : isPlaying ? `正在执行第 ${nfe} 次模型函数求值` : '等待下一次模型函数求值',
        641,
        326,
      );

      canvas.classList.add('is-ready');
    };

    draw();
    return observeCanvas(canvas, draw, () => {});
  }, [nfe, objective, noisePhase, noiseExpert, objectiveExpert, isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    if (nfe >= 8) {
      setIsPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setNfe((value) => Math.min(8, value + 1)), 650);
    return () => window.clearTimeout(timer);
  }, [isPlaying, nfe]);

  const moveNfe = (next: number) => setNfe(Math.max(1, Math.min(8, next)));
  const playInference = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setNfe(8);
      setIsPlaying(false);
      return;
    }
    setNfe(1);
    setIsPlaying(true);
  };
  const onCanvasKeyDown = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); moveNfe(nfe - 1); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); moveNfe(nfe + 1); }
    else if (event.key === 'Home') { event.preventDefault(); moveNfe(1); }
    else if (event.key === 'End') { event.preventDefault(); moveNfe(8); }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        tabIndex={0}
        onKeyDown={onCanvasKeyDown}
        aria-label={`MT-DMD 训练与 Turbo 推理分离图：${noisePhase === 'high' ? '高噪声' : '低噪声'}、${objective}，Turbo 已完成 ${nfe}/8 次模型函数求值`}
      />
      <div className="chip-row" role="radiogroup" aria-label="训练噪声状态">
        <button className={`chip ${noisePhase === 'high' ? 'selected' : ''}`} role="radio" aria-checked={noisePhase === 'high'} onClick={() => setNoisePhase('high')}>训练：高噪声状态</button>
        <button className={`chip ${noisePhase === 'low' ? 'selected' : ''}`} role="radio" aria-checked={noisePhase === 'low'} onClick={() => setNoisePhase('low')}>训练：低噪声状态</button>
      </div>
      <div className="chip-row" role="radiogroup" aria-label="蒸馏目标">
        <button className={`chip ${objective === 'CA' ? 'selected' : ''}`} role="radio" aria-checked={objective === 'CA'} onClick={() => setObjective('CA')}>训练目标：CA</button>
        <button className={`chip ${objective === 'DM' ? 'selected' : ''}`} role="radio" aria-checked={objective === 'DM'} onClick={() => setObjective('DM')}>训练目标：DM</button>
      </div>
      <div className="step-ctrl" aria-label="Turbo 推理进度">
        <button className="tiny" disabled={isPlaying} onClick={playInference}>
          {isPlaying ? '推理播放中…' : nfe === 8 ? '重新播放 8 次求值' : '播放 8 次模型函数求值'}
        </button>
        <button className="tiny ghost" disabled={isPlaying || nfe === 1} onClick={() => moveNfe(nfe - 1)}>上一次</button>
        <span className="step-label">模型函数求值 <b>{nfe}</b> / 8</span>
        <button className="tiny ghost" disabled={isPlaying || nfe === 8} onClick={() => moveNfe(nfe + 1)}>下一次</button>
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">CA</div>
          <div className="v" style={{ fontSize: 14 }}>Classifier-Free Guidance Augmentation</div>
          <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 13 }}>让学生轨迹对齐教师的引导路径。</div>
        </div>
        <div className="metric">
          <div className="l">DM</div>
          <div className="v" style={{ fontSize: 14 }}>Distribution Matching</div>
          <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 13 }}>缩小生成分布与真实数据分布的差异。</div>
        </div>
        <div className="metric">
          <div className="l">NFE</div>
          <div className="v" style={{ fontSize: 14 }}>Number of Function Evaluations</div>
          <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 13 }}>推理程序调用学生模型并计算速度场的次数。</div>
        </div>
      </div>
    </div>
  );
};

export default Ch7TurboWidget;
