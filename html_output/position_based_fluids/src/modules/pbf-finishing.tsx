import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';

type FinishMode = 'raw' | 'vorticity' | 'xsph';
type Vec2 = { x: number; y: number };

const MODES: Array<{ key: FinishMode; label: string }> = [
  { key: 'raw', label: '原始速度' },
  { key: 'vorticity', label: '涡量约束' },
  { key: 'xsph', label: 'XSPH 黏性' },
];

const C = {
  bg: '#f4f9ff',
  water: '#35c6f4',
  waterDeep: '#0754a6',
  guide: '#0b4f9f',
  good: '#228d5c',
  user: '#d97706',
  aux: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
};

const PARTICLES: Vec2[] = [
  { x: 126, y: 88 }, { x: 178, y: 72 }, { x: 232, y: 84 }, { x: 270, y: 122 },
  { x: 242, y: 165 }, { x: 188, y: 178 }, { x: 137, y: 160 }, { x: 104, y: 124 },
];

const BASE_VELOCITIES: Vec2[] = [
  { x: 8, y: -3 }, { x: 12, y: 1 }, { x: 8, y: 5 }, { x: 3, y: 10 },
  { x: -5, y: 7 }, { x: -9, y: 0 }, { x: -5, y: -7 }, { x: 2, y: -9 },
];

function arrow(ctx: CanvasRenderingContext2D, from: Vec2, to: Vec2, color: string, width = 2, dashed = false) {
  const a = Math.atan2(to.y - from.y, to.x - from.x);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  if (dashed) ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - 6 * Math.cos(a - Math.PI / 6), to.y - 6 * Math.sin(a - Math.PI / 6));
  ctx.lineTo(to.x - 6 * Math.cos(a + Math.PI / 6), to.y - 6 * Math.sin(a + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function velocityFor(mode: FinishMode, particle: Vec2, base: Vec2): Vec2 {
  if (mode === 'raw') return { x: base.x * 0.6, y: base.y * 0.6 };
  if (mode === 'vorticity') {
    const dx = particle.x - 188;
    const dy = particle.y - 124;
    const length = Math.max(1, Math.hypot(dx, dy));
    return { x: base.x * 0.6 - (dy / length) * 8, y: base.y * 0.6 + (dx / length) * 8 };
  }
  const stream = { x: 5.5, y: -0.5 };
  return { x: base.x * 0.28 + stream.x, y: base.y * 0.28 + stream.y };
}

export const PbfFinishing: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<FinishMode>('raw');
  const [showDelta, setShowDelta] = useState(true);

  const feedback = useMemo(() => {
    const suffix = showDelta ? ' 彩色增量仅表示处理前后差异，不代表新增密度约束。' : '';
    if (mode === 'vorticity') return `涡量约束：只在已有旋涡处补回部分被数值耗散削弱的运动。${suffix}`;
    if (mode === 'xsph') return `XSPH 黏性：用邻居速度差平滑速度；论文实验中 c 通常取 0.01，这不是通用最优值。${suffix}`;
    return '原始速度：密度约束已结束，尚未应用可选速度后处理。';
  }, [mode, showDelta]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => {
      const ctx = setupCanvas(canvas, 560, 240);
      ctx.clearRect(0, 0, 560, 240);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, 560, 240);

      ctx.strokeStyle = C.line;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(400, 20);
      ctx.lineTo(400, 220);
      ctx.stroke();

      ctx.save();
      ctx.strokeStyle = '#b8c7dc';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([7, 6]);
      [38, 58, 78].forEach((radius) => {
        ctx.beginPath();
        ctx.arc(188, 124, radius, 0.15, Math.PI * 1.65);
        ctx.stroke();
      });
      ctx.restore();

      ctx.strokeStyle = C.guide;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(188, 124, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = C.guide;
      ctx.font = '12px Segoe UI';
      ctx.fillText('已有旋涡', 151, 116);

      PARTICLES.forEach((particle, index) => {
        const raw = velocityFor('raw', particle, BASE_VELOCITIES[index]);
        const displayed = velocityFor(mode, particle, BASE_VELOCITIES[index]);
        const rawEnd = { x: particle.x + raw.x * 2.2, y: particle.y + raw.y * 2.2 };
        const displayEnd = { x: particle.x + displayed.x * 2.2, y: particle.y + displayed.y * 2.2 };

        if (mode !== 'raw') arrow(ctx, particle, rawEnd, '#9aa8bb', 1.5, true);
        if (showDelta && mode !== 'raw') arrow(ctx, rawEnd, displayEnd, C.aux, 2, true);
        arrow(ctx, particle, displayEnd, mode === 'raw' ? C.guide : C.good, mode === 'raw' ? 2 : 3);

        ctx.fillStyle = C.water;
        ctx.strokeStyle = C.waterDeep;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      ctx.fillStyle = C.text;
      ctx.font = '700 14px Segoe UI';
      ctx.fillText(mode === 'raw' ? '处理前速度场' : mode === 'vorticity' ? '在已有 ωᵢ 处补回运动' : '邻居速度差 × c', 28, 30);
      ctx.fillStyle = C.muted;
      ctx.font = '12px Segoe UI';
      ctx.fillText('同一固定初态', 28, 49);

      ctx.fillStyle = C.text;
      ctx.font = '700 14px Segoe UI';
      ctx.fillText('机制诊断', 422, 42);
      if (mode === 'raw') {
        ctx.strokeStyle = C.guide;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(472, 102, 30, 0.3, Math.PI * 1.55);
        ctx.stroke();
        ctx.fillStyle = C.muted;
        ctx.font = '13px Segoe UI';
        ctx.fillText('旋转箭头较短', 422, 154);
        ctx.fillText('尚未应用收尾', 422, 176);
      } else if (mode === 'vorticity') {
        ctx.strokeStyle = C.aux;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(472, 105, 34, -0.4, Math.PI * 1.45);
        ctx.stroke();
        arrow(ctx, { x: 452, y: 79 }, { x: 463, y: 72 }, C.aux, 3);
        ctx.fillStyle = C.aux;
        ctx.font = '700 13px Segoe UI';
        ctx.fillText('已有 ωᵢ', 447, 109);
        ctx.fillStyle = C.muted;
        ctx.font = '13px Segoe UI';
        ctx.fillText('只在既有旋涡处补回', 412, 166);
      } else {
        const ys = [88, 116, 144];
        ys.forEach((y, index) => {
          ctx.fillStyle = C.water;
          ctx.strokeStyle = C.waterDeep;
          ctx.beginPath();
          ctx.arc(440, y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          arrow(ctx, { x: 450, y }, { x: 495, y: y - 2 + index }, C.good, 3);
        });
        ctx.strokeStyle = C.aux;
        ctx.lineWidth = 2;
        ctx.strokeRect(428, 72, 82, 88);
        ctx.fillStyle = C.aux;
        ctx.font = '700 13px Segoe UI';
        ctx.fillText('c = 0.01', 439, 184);
        ctx.fillStyle = C.muted;
        ctx.font = '11px Segoe UI';
        ctx.fillText('论文实验中的通常取值', 412, 204);
      }

      ctx.fillStyle = C.muted;
      ctx.font = '12px Segoe UI';
      ctx.fillText('蓝：原始　绿：处理后　紫虚线：差值', 92, 222);
      canvas.classList.add('is-ready');
    };

    const disconnect = observeCanvas(canvas, draw, () => {});
    return disconnect;
  }, [mode, showDelta]);

  const handleKeys = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === '1') setMode('raw');
    if (event.key === '2') setMode('vorticity');
    if (event.key === '3') setMode('xsph');
  };

  return (
    <div onKeyDown={handleKeys}>
      <div className="chip-row" role="group" aria-label="选择速度后处理模式">
        {MODES.map((item, index) => (
          <button
            type="button"
            className={`chip ${mode === item.key ? 'selected' : ''}`}
            aria-pressed={mode === item.key}
            aria-keyshortcuts={`${index + 1}`}
            key={item.key}
            onClick={() => setMode(item.key)}
          >
            {index + 1}. {item.label}
          </button>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        width={560}
        height={240}
        role="img"
        aria-label={feedback}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      <div className="ctrl">
        <label>
          <input type="checkbox" checked={showDelta} onChange={(event) => setShowDelta(event.currentTarget.checked)} />
          查看处理前后差值
        </label>
        <span className="val" style={{ minWidth: 150 }}>{mode === 'xsph' ? 'c = 0.01（锁定）' : mode === 'vorticity' ? '已有 ωᵢ' : '未处理'}</span>
      </div>
      <table className="paper">
        <caption style={{ textAlign: 'left', padding: '8px 0', color: C.muted }}>当前模式的作用边界</caption>
        <tbody>
          <tr><th>模式</th><td>{MODES.find((item) => item.key === mode)?.label}</td></tr>
          <tr><th>改变对象</th><td>{mode === 'raw' ? '不改变速度' : '速度后处理'}</td></tr>
          <tr><th>目标</th><td>{mode === 'vorticity' ? '在已有旋涡处补回部分运动' : mode === 'xsph' ? '平滑邻居速度差，促进连贯运动' : '保留密度投影后的原始速度'}</td></tr>
          <tr><th>条件</th><td>{mode === 'xsph' ? 'c=0.01 是论文实验中的通常取值，不是通用最优值' : mode === 'vorticity' ? '不在无涡量区域凭空建立新旋涡' : '尚未应用可选收尾'}</td></tr>
        </tbody>
      </table>
      <div className={`feedback ${mode === 'raw' ? '' : 'good'}`} aria-live="polite">
        {feedback}
      </div>
    </div>
  );
};
