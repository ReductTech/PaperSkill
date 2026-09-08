import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

type Point = { x: number; y: number };
type Preset = 'sparse' | 'transition' | 'dense' | 'custom';

const PARTICLES: Point[] = [
  { x: 120, y: 100 }, { x: 190, y: 150 }, { x: 220, y: 104 }, { x: 248, y: 86 },
  { x: 260, y: 150 }, { x: 306, y: 154 }, { x: 320, y: 92 }, { x: 342, y: 130 },
  { x: 374, y: 82 }, { x: 420, y: 145 }, { x: 445, y: 80 }, { x: 170, y: 62 },
];
const PRESETS: Record<Exclude<Preset, 'custom'>, Point> = {
  sparse: { x: 140, y: 100 },
  transition: { x: 280, y: 118 },
  dense: { x: 320, y: 118 },
};

function clampProbe(point: Point): Point {
  return { x: Math.max(70, Math.min(490, point.x)), y: Math.max(52, Math.min(188, point.y)) };
}

export const PbfNeighbors: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [probe, setProbe] = useState<Point>(PRESETS.transition);
  const [radius, setRadius] = useState(84);
  const [preset, setPreset] = useState<Preset>('transition');
  const [showContributions, setShowContributions] = useState(true);
  const [dragging, setDragging] = useState(false);

  const measure = useMemo(() => {
    const rows = PARTICLES.map((point, id) => {
      const distance = Math.hypot(point.x - probe.x, point.y - probe.y);
      const inside = distance < radius;
      const normalized = inside ? Math.max(0, 1 - (distance / radius) ** 2) : 0;
      const weight = normalized ** 3;
      return { id, point, distance, inside, weight };
    });
    const sum = rows.reduce((total, row) => total + row.weight, 0);
    const rhoRatio = sum / 1.6;
    const constraint = rhoRatio - 1;
    return { rows, rhoRatio, constraint, neighborCount: rows.filter((row) => row.inside).length };
  }, [probe, radius]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 560, 240);
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    const draw = () => {
      ctx.clearRect(0, 0, 560, 240);
      ctx.fillStyle = '#f4f9ff';
      ctx.fillRect(0, 0, 560, 240);
      ctx.fillStyle = 'rgba(184,201,167,0.28)';
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(45, 198);
      ctx.bezierCurveTo(70, 62, 330, 40, 407, 198);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(probe.x, probe.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      if (showContributions) {
        measure.rows.filter((row) => row.inside).forEach((row) => {
          ctx.strokeStyle = `rgba(39,68,110,${0.2 + row.weight * 0.7})`;
          ctx.lineWidth = 1 + row.weight * 4;
          ctx.beginPath();
          ctx.moveTo(probe.x, probe.y);
          ctx.lineTo(row.point.x, row.point.y);
          ctx.stroke();
          ctx.fillStyle = `rgba(39,68,110,${0.08 + row.weight * 0.22})`;
          ctx.beginPath();
          ctx.arc(row.point.x, row.point.y, 9 + row.weight * 12, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      measure.rows.forEach((row) => {
        ctx.fillStyle = row.inside ? '#27446e' : '#b9c2cf';
        ctx.strokeStyle = row.inside ? '#21324a' : '#8b97ab';
        ctx.lineWidth = row.inside ? 2 : 1;
        ctx.beginPath();
        ctx.arc(row.point.x, row.point.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      ctx.fillStyle = '#d97706';
      ctx.strokeStyle = '#21324a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(probe.x, probe.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(464, 42);
      ctx.lineTo(464, 190);
      ctx.stroke();
      const targetY = 125;
      ctx.strokeStyle = '#228d5c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(450, targetY);
      ctx.lineTo(490, targetY);
      ctx.stroke();
      const currentY = Math.max(48, Math.min(188, targetY - measure.constraint * 55));
      ctx.fillStyle = Math.abs(measure.constraint) <= 0.08 ? '#228d5c' : '#c43f52';
      ctx.beginPath();
      ctx.moveTo(464, currentY);
      ctx.lineTo(476, currentY - 7);
      ctx.lineTo(476, currentY + 7);
      ctx.closePath();
      ctx.fill();
      ctx.font = '13px Segoe UI';
      ctx.fillStyle = '#21324a';
      ctx.fillText('邻域', 22, 23);
      ctx.fillStyle = '#27446e';
      ctx.fillText('静止密度 1.0', 431, 216);
      ctx.fillStyle = '#68778f';
      ctx.fillText(`ρᵢ/ρ₀ ${measure.rhoRatio.toFixed(2)}`, 430, 30);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    draw();
    return observeCanvas(canvas, draw, () => undefined);
  }, [measure, probe, radius, showContributions]);

  const noNeighbors = measure.neighborCount === 0;
  const feedback = !showContributions
    ? '贡献层已隐藏，密度仍由同一邻域求和计算。'
    : noNeighbors
      ? '支持范围内没有示意邻居；请移动探针或增大 h。'
      : measure.constraint < -0.08
        ? '邻域贡献不足：当前估计密度低于静止密度，Cᵢ 为负。'
        : measure.constraint > 0.08
          ? '邻域贡献较多：当前估计密度高于静止密度，Cᵢ 为正。'
          : '当前邻域使估计密度接近静止密度，Cᵢ 接近 0。';
  const feedbackClass = Math.abs(measure.constraint) <= 0.08 && !noNeighbors ? 'good' : 'bad';

  const setPresetPoint = (next: Exclude<Preset, 'custom'>) => {
    setPreset(next);
    setProbe(PRESETS[next]);
  };
  const moveBy = (dx: number, dy: number) => {
    setPreset('custom');
    setProbe((point) => clampProbe({ x: point.x + dx, y: point.y + dy }));
  };
  const updateFromPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setProbe(clampProbe({ x: (event.clientX - rect.left) * 560 / rect.width, y: (event.clientY - rect.top) * 240 / rect.height }));
    setPreset('custom');
  };

  return (
    <div>
      <div className="chip-row" aria-label="探针预设位置">
        <button type="button" className={`chip ${preset === 'sparse' ? 'selected' : ''}`} onClick={() => setPresetPoint('sparse')}>稀疏区</button>
        <button type="button" className={`chip ${preset === 'transition' ? 'selected' : ''}`} onClick={() => setPresetPoint('transition')}>过渡区</button>
        <button type="button" className={`chip ${preset === 'dense' ? 'selected' : ''}`} onClick={() => setPresetPoint('dense')}>密集区</button>
      </div>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`第 ${chapterId} 章模块 ${moduleId}：支持半径 ${radius} 个画布单位，邻居 ${measure.neighborCount} 个，ρᵢ/ρ₀ 为 ${measure.rhoRatio.toFixed(2)}，Cᵢ 为 ${measure.constraint.toFixed(2)}。`}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
          updateFromPointer(event);
        }}
        onPointerMove={(event) => { if (dragging) updateFromPointer(event); }}
        onPointerUp={(event) => {
          setDragging(false);
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
      />
      <div className="ctrl">
        <label htmlFor={`radius-${chapterId}-${moduleId}`}>支持半径 h（示意）</label>
        <input
          id={`radius-${chapterId}-${moduleId}`}
          type="range"
          min="52"
          max="116"
          step="2"
          value={radius}
          aria-valuetext={`${radius} 个画布单位，仅用于教学显示`}
          onChange={(event) => setRadius(Number(event.target.value))}
        />
        <span className="val">{radius}</span>
        <label>
          <input type="checkbox" checked={showContributions} onChange={(event) => setShowContributions(event.target.checked)} />
          显示贡献
        </label>
      </div>
      <div className="step-ctrl" aria-label="探针方向操作">
        <button type="button" className="tiny ghost" onClick={() => moveBy(-8, 0)}>左移</button>
        <button type="button" className="tiny ghost" onClick={() => moveBy(8, 0)}>右移</button>
        <button type="button" className="tiny ghost" onClick={() => moveBy(0, -8)}>上移</button>
        <button type="button" className="tiny ghost" onClick={() => moveBy(0, 8)}>下移</button>
      </div>
      <div className="metrics" aria-label="邻域测量结果">
        <div className="metric"><div className="l">邻居数</div><div className="v">{measure.neighborCount}</div></div>
        <div className="metric"><div className="l">ρᵢ/ρ₀</div><div className="v">{measure.rhoRatio.toFixed(2)}</div></div>
        <div className="metric"><div className="l">Cᵢ</div><div className="v">{measure.constraint >= 0 ? '+' : ''}{measure.constraint.toFixed(2)}</div></div>
      </div>
      {showContributions && (
        <ul className="step-desc" aria-label="邻居核贡献列表">
          {measure.rows.filter((row) => row.inside).slice(0, 6).map((row) => (
            <li key={row.id}>邻居 {row.id + 1}：归一化核贡献 {row.weight.toFixed(3)}</li>
          ))}
        </ul>
      )}
      <p className="step-desc">0.08 仅为画面可读容差；数值为归一化教学演示。</p>
      <p className={`feedback ${feedbackClass}`} aria-live="polite">
        {feedback} 邻居 {measure.neighborCount} 个｜ρᵢ/ρ₀ = {measure.rhoRatio.toFixed(2)}｜Cᵢ = {measure.constraint >= 0 ? '+' : ''}{measure.constraint.toFixed(2)}。数值为归一化教学演示。
      </p>
    </div>
  );
};
