import React, { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import type { WidgetProps } from './registry';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';

const WIDTH = 560;
const HEIGHT = 180;
const COLORS = {
  bg: '#f4f9ff',
  water: '#35c6f4',
  waterDeep: '#0754a6',
  border: '#0b4f9f',
  blue: '#0b4f9f',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
};

type PressureMode = 'off' | 'balanced' | 'strong';

const MODES: Array<{
  key: PressureMode;
  label: string;
  kLabel: string;
  repulsion: string;
  result: string;
}> = [
  { key: 'off', label: '关闭', kLabel: 'k = 0', repulsion: '无', result: '自由表面结团' },
  { key: 'balanced', label: '适中', kLabel: 'k = 0.1', repulsion: '适度', result: '粒子分布较均匀' },
  { key: 'strong', label: '偏强', kLabel: 'k > 0.1（示意）', repulsion: '较强', result: '表面张力伪影增强' },
];

const antiClumpLatex = '\\begin{gathered} s_{\\mathrm{corr}}=-k\\left(\\frac{W(\\mathbf p_i-\\mathbf p_j,h)}{W(\\Delta\\mathbf q,h)}\\right)^n\\quad\\text{(13)}\\\\[0.25em] \\Delta\\mathbf p_i=\\frac{1}{\\rho_0}\\sum_j(\\lambda_i+\\lambda_j+s_{\\mathrm{corr}})\\nabla W(\\mathbf p_i-\\mathbf p_j,h)\\quad\\text{(14)} \\end{gathered}';

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color = COLORS.green,
) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 7 * Math.cos(angle - Math.PI / 6), y2 - 7 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - 7 * Math.cos(angle + Math.PI / 6), y2 - 7 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function drawParticle(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, radius = 7) {
  const droplet = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, radius);
  droplet.addColorStop(0, '#ffffff');
  droplet.addColorStop(0.28, '#bfeeff');
  droplet.addColorStop(1, color);
  ctx.fillStyle = droplet;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  mode: PressureMode,
  kLabel: string,
  elapsedMs: number,
) {
  const cycle = (elapsedMs % 4800) / 4800;
  let pulse = 0;
  let stage = '两项继续平衡';
  let contribution: 'outward' | 'density' | 'inward' | 'rest' = 'rest';
  if (cycle < 0.36) {
    const u = cycle / 0.36;
    pulse = 0.5 - 0.5 * Math.cos(Math.PI * u);
    stage = '① s_corr 向外排斥';
    contribution = 'outward';
  } else if (cycle < 0.52) {
    pulse = 1;
    stage = '② 局部密度低于 1';
    contribution = 'density';
  } else if (cycle < 0.88) {
    const u = (cycle - 0.52) / 0.36;
    pulse = 0.5 + 0.5 * Math.cos(Math.PI * u);
    stage = '③ 密度约束向内回拉';
    contribution = 'inward';
  }
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#e8f6ff';
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(38, 28, 484, 132, 18);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLORS.ink;
  ctx.font = '600 13px "Segoe UI", sans-serif';
  ctx.fillText('式 (14) 内部的两种相反贡献', 48, 20);
  ctx.fillStyle = mode === 'strong' ? COLORS.purple : mode === 'balanced' ? COLORS.green : COLORS.red;
  ctx.fillText(stage, 354, 20);
  ctx.font = '700 14px "Segoe UI", sans-serif';
  ctx.fillText(`当前 ${kLabel}`, 54, 51);

  ctx.strokeStyle = 'rgba(11,79,159,0.28)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.ellipse(280, 92, 88, 30, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  if (mode === 'off') {
    const clusterCenters = [[226, 88], [282, 96], [340, 84]] as const;
    clusterCenters.forEach(([cx, cy], cluster) => {
      [[-10, -5], [0, -8], [9, -3], [-6, 7], [6, 8]].forEach(([dx, dy], index) => {
        const tremble = Math.sin(elapsedMs / 360 + cluster * 2 + index) * 1.5;
        drawParticle(ctx, cx + dx + tremble, cy + dy, COLORS.red, 7);
      });
    });
    ctx.fillStyle = COLORS.red;
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillText('邻居不足：负压力使自由表面结团', 174, 147);
  } else {
    const amplitude = mode === 'strong' ? 25 : 9;
    const radiusX = 88 + amplitude * pulse;
    const radiusY = 30 + amplitude * 0.32 * pulse;
    const outline = mode === 'strong' ? COLORS.purple : COLORS.waterDeep;
    ctx.fillStyle = mode === 'strong' ? 'rgba(124,58,237,0.12)' : 'rgba(53,198,244,0.20)';
    ctx.strokeStyle = outline;
    ctx.lineWidth = mode === 'strong' ? 3 : 2;
    ctx.beginPath();
    ctx.ellipse(280, 92, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    for (let index = 0; index < 14; index += 1) {
      const angle = (index / 14) * Math.PI * 2;
      drawParticle(ctx, 280 + Math.cos(angle) * radiusX, 92 + Math.sin(angle) * radiusY, outline, 6);
    }
    for (let index = 0; index < 6; index += 1) {
      const angle = (index / 6) * Math.PI * 2 + 0.32;
      drawParticle(ctx, 280 + Math.cos(angle) * radiusX * 0.48, 92 + Math.sin(angle) * radiusY * 0.45, COLORS.waterDeep, 6);
    }

    if (contribution === 'outward' || contribution === 'inward') {
      [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach((angle) => {
        const ux = Math.cos(angle);
        const uy = Math.sin(angle);
        const px = 280 + ux * radiusX;
        const py = 92 + uy * radiusY;
        if (contribution === 'outward') {
          drawArrow(ctx, px + ux * 4, py + uy * 4, px + ux * 25, py + uy * 25, COLORS.orange);
        } else {
          drawArrow(ctx, px + ux * 25, py + uy * 25, px + ux * 4, py + uy * 4, COLORS.green);
        }
      });
    }

    ctx.fillStyle = mode === 'strong' ? COLORS.purple : COLORS.green;
    ctx.font = '700 14px "Segoe UI", sans-serif';
    const densityText = contribution === 'outward' || contribution === 'density'
      ? 'ρ / ρ₀ < 1'
      : contribution === 'inward'
        ? 'ρ / ρ₀ 向 1 回升'
        : 'ρ / ρ₀ 略低于 1';
    ctx.fillText(densityText, contribution === 'inward' ? 220 : 239, 97);
  }

}

export const PbfAntiClump: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<PressureMode>('off');
  const [visible, setVisible] = useState(true);
  const current = MODES.find((entry) => entry.key === mode) ?? MODES[0];
  const feedback =
    mode === 'off'
      ? '短程排斥不足：粒子仍出现明显聚团。'
      : mode === 'balanced'
        ? '人工压力适中：轻微向外排斥与密度约束回拉取得平衡。'
        : '参数偏强：排斥造成更明显欠密，密度约束随即产生更强回拉，形成表面张力伪影。';
  const feedbackClass = mode === 'off' ? 'bad' : mode === 'balanced' ? 'good' : '';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return observeCanvas(canvas, () => setVisible(true), () => setVisible(false));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visible) return;
    const ctx = setupCanvas(canvas, WIDTH, HEIGHT);
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    const start = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      drawScene(ctx, mode, current.kLabel, now - start);
      canvas.classList.add('is-ready');
      raf = requestAnimationFrame(loop);
    };
    loop(start);
    return () => cancelAnimationFrame(raf);
  }, [mode, current.kLabel, visible]);

  return (
    <div>
      <div className="chip-row" role="group" aria-label="人工压力模式">
        {MODES.map((entry) => {
          const selected = mode === entry.key;
          return (
            <button
              key={entry.key}
              type="button"
              className="chip"
              aria-pressed={selected}
              style={
                selected
                  ? {
                      borderColor: COLORS.orange,
                      background: '#fff7ed',
                      color: COLORS.waterDeep,
                      boxShadow: 'inset 0 0 0 1px ' + COLORS.orange,
                    }
                  : undefined
              }
              onClick={() => setMode(entry.key)}
            >
              {entry.label} · {entry.kLabel}
            </button>
          );
        })}
      </div>
      <div
        className="talk-equation math-equation"
        dangerouslySetInnerHTML={{ __html: katex.renderToString(antiClumpLatex, { displayMode: true, throwOnError: false, strict: 'ignore' }) }}
      />
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        role="img"
        aria-label={`${current.label}，${current.kLabel}：${current.repulsion}短程排斥，${current.result}`}
        style={{ width: '100%', maxWidth: WIDTH, height: 'auto' }}
      />
      <div className="metrics" aria-label="人工压力定性比较">
        <div className="metric">
          <div className="l">强度系数</div>
          <div className="v" style={{ fontSize: 20 }}>{current.kLabel}</div>
        </div>
        <div className="metric">
          <div className="l">短程排斥</div>
          <div className="v" style={{ fontSize: 20 }}>{current.repulsion}</div>
        </div>
        <div className="metric">
          <div className="l">观察结果</div>
          <div className="v" style={{ fontSize: 18 }}>{current.result}</div>
        </div>
      </div>
      <div className={'feedback ' + feedbackClass} aria-live="polite">
        {feedback}
      </div>
      {mode === 'strong' && (
        <p
          style={{
            marginTop: 8,
            padding: '7px 10px',
            borderLeft: '4px solid ' + COLORS.purple,
            background: '#f5f3ff',
            color: COLORS.purple,
            fontSize: 14,
          }}
        >
          这是抗结团项产生的非物理伪影，不是真实黏性或表面张力模型。
        </p>
      )}
      <p style={{ fontSize: 13, color: COLORS.muted }}>
        论文给出的可用示例为 k = 0.1；“偏强”档仅用于展示 k 增大后的机制，不代表论文测量值。
      </p>
    </div>
  );
};
