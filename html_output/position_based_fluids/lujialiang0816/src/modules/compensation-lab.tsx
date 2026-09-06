import React, { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import type { WidgetProps } from './registry';
import { setupCanvas } from '../lib/canvasKit';
import { WATER, drawArrow, drawWaterParticle, drawWaterSurface } from './waterKit';

type IssueKey = 'clump' | 'vortex' | 'xsph';

const issues: Record<IssueKey, { title: string; method: string; latex: string; conclusion: string }> = {
  clump: { title: '自由表面粒子结团', method: '人工压力 s_corr', latex: 's_{\\mathrm{corr}}=-k\\left(\\frac{W(\\mathbf p_i-\\mathbf p_j,h)}{W(\\Delta\\mathbf q,h)}\\right)^n\\quad\\text{(13)}', conclusion: '短程排斥拉开近邻，减轻拉伸不稳定性。' },
  vortex: { title: '数值耗散削弱涡旋', method: 'Vorticity Confinement', latex: '\\begin{gathered}\\boldsymbol\\omega_i=\\sum_j(\\mathbf v_j-\\mathbf v_i)\\times\\nabla_{\\mathbf p_j}W(\\mathbf p_i-\\mathbf p_j,h)\\quad\\text{(15)}\\\\ \\mathbf f_i^{\\mathrm{vorticity}}=\\varepsilon(\\mathbf N\\times\\boldsymbol\\omega_i)\\quad\\text{(16)}\\end{gathered}', conclusion: '只在已有旋转处补回部分被数值耗散削弱的运动。' },
  xsph: { title: '邻域速度不协调', method: 'XSPH 速度平滑', latex: '\\mathbf v_i^{\\mathrm{new}}=\\mathbf v_i+c\\sum_j(\\mathbf v_j-\\mathbf v_i)W(\\mathbf p_i-\\mathbf p_j,h)\\quad\\text{(17)}', conclusion: '利用邻居速度差，让局部运动更连贯。' },
};

function drawClump(ctx: CanvasRenderingContext2D, x: number, fixed: boolean, phase: number) {
  const points = fixed
    ? [[28, 113], [62, 109], [96, 113], [130, 110], [164, 113], [198, 110], [48, 150], [96, 147], [146, 151]]
    : [[58, 109], [68, 105], [78, 112], [88, 106], [132, 109], [142, 105], [152, 112], [162, 106], [172, 113]];
  const surface = [
    { x: x + 12, y: 116 + Math.sin(phase * 0.8) * 2 },
    { x: x + 58, y: 110 + Math.sin(phase * 0.8 + 0.8) * 2 },
    { x: x + 108, y: 114 + Math.sin(phase * 0.8 + 1.6) * 2 },
    { x: x + 160, y: 109 + Math.sin(phase * 0.8 + 2.3) * 2 },
    { x: x + 208, y: 115 + Math.sin(phase * 0.8 + 3.1) * 2 },
  ];
  drawWaterSurface(ctx, surface, 192, fixed ? WATER.mid : '#77b9d6', 0.78);
  points.forEach(([dx, dy], index) => {
    const pull = fixed ? 0.02 : 0.13 + 0.07 * Math.sin(phase * 1.6);
    const clusterCenter = dx < 120 ? x + 76 : x + 152;
    const px = x + dx + (clusterCenter - (x + dx)) * pull;
    const py = dy + (110 - dy) * pull + (fixed ? Math.sin(phase + index) * 1.5 : 0);
    drawWaterParticle(ctx, px, py, 7, fixed ? WATER.mid : WATER.user);
  });
  ctx.fillStyle = fixed ? WATER.good : WATER.bad;
  ctx.font = '700 12px Segoe UI';
  ctx.fillText(fixed ? '自由表面：分布均匀' : '自由表面：近邻结团', x + 20, 75);
}

function drawVortexTrajectory(ctx: CanvasRenderingContext2D, elapsed: number) {
  const frameDuration = 1000;
  const totalFrames = 6;
  const sequenceTime = Math.max(0, elapsed) % (frameDuration * totalFrames);
  const frame = Math.floor(sequenceTime / frameDuration);
  const t = (sequenceTime % frameDuration) / frameDuration;
  const beforeCenter = { x: 180, y: 118 };
  const afterCenter = { x: 540, y: 118 };
  // The two particles share the same starting point and first step. Without
  // confinement the orbit gradually loses curvature and ends on a tangent;
  // with confinement it keeps bending around the vortex core. Segment lengths
  // decrease in both paths so the final time slices visibly slow down.
  const beforePath = [[239, 177], [202, 199], [164, 196], [134, 178], [112, 156], [112, 129]] as const;
  const afterPath = [[599, 177], [562, 199], [527, 201], [496, 189], [473, 168], [460, 143]] as const;

  ctx.clearRect(0, 0, 720, 280);
  ctx.fillStyle = WATER.page;
  ctx.fillRect(0, 0, 720, 280);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = WATER.line;
  ctx.lineWidth = 2;
  ctx.fillRect(20, 42, 320, 196);
  ctx.strokeRect(20, 42, 320, 196);
  ctx.fillRect(380, 42, 320, 196);
  ctx.strokeRect(380, 42, 320, 196);

  ctx.fillStyle = WATER.bad;
  ctx.font = '800 17px Segoe UI';
  ctx.fillText('未补涡量：圆弧逐渐被拉直', 42, 29);
  ctx.fillStyle = WATER.good;
  ctx.fillText('加入涡量约束：保留绕转', 402, 29);
  ctx.fillStyle = WATER.muted;
  ctx.font = '700 13px Segoe UI';
  ctx.fillText(`时间片  t${frame}  →  t${Math.min(frame + 1, totalFrames - 1)}`, 286, 266);

  const drawCore = (center: { x: number; y: number }) => {
    ctx.strokeStyle = 'rgba(18,150,212,.32)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(center.x, center.y, 56, 0, Math.PI * 2);
    ctx.stroke();
    [[-14, -12], [15, -10], [-12, 16], [16, 15]].forEach(([dx, dy]) => drawWaterParticle(ctx, center.x + dx, center.y + dy, 8, WATER.mid));
  };
  const drawPath = (points: readonly (readonly [number, number])[], color: string, currentFrame: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.stroke();
    ctx.setLineDash([]);
    points.forEach(([x, y], index) => {
      ctx.fillStyle = index <= currentFrame ? color : '#cbd8e6';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = WATER.muted;
      ctx.font = '11px Segoe UI';
      ctx.fillText(`t${index}`, x - 7, y + 18);
    });
  };
  const drawTraveller = (points: readonly (readonly [number, number])[], currentFrame: number, accent: string) => {
    const from = points[currentFrame];
    const to = points[Math.min(currentFrame + 1, points.length - 1)];
    const x = from[0] + (to[0] - from[0]) * t;
    const y = from[1] + (to[1] - from[1]) * t;
    drawWaterParticle(ctx, x, y, 10, accent);
    if (currentFrame < points.length - 1) drawArrow(ctx, { x, y }, { x: x + (to[0] - from[0]) * 0.55, y: y + (to[1] - from[1]) * 0.55 }, accent, 3);
  };

  drawCore(beforeCenter);
  drawCore(afterCenter);
  drawPath(beforePath, WATER.bad, frame);
  drawPath(afterPath, WATER.good, frame);
  drawTraveller(beforePath, frame, WATER.user);
  drawTraveller(afterPath, frame, WATER.user);

  ctx.fillStyle = WATER.bad;
  ctx.font = '700 13px Segoe UI';
  ctx.fillText('旋转分量逐帧衰减，末端趋向切线', 48, 224);
  ctx.fillStyle = WATER.good;
  ctx.fillText('保持轨迹曲率，继续绕涡核旋转', 448, 224);
}

function drawXsph(ctx: CanvasRenderingContext2D, x: number, fixed: boolean, phase: number) {
  const rows = [82, 130, 178];
  const laneLeft = x + 58;
  const laneWidth = 188;
  const velocities = fixed ? [-15, -11, -15] : [15, -15, 15];
  const labels = fixed ? ['上层  ← 快', '中层  ← 稍慢', '下层  ← 快'] : ['上层  →', '中层  ←', '下层  →'];
  const color = fixed ? WATER.good : WATER.bad;

  ctx.save();
  ctx.strokeStyle = 'rgba(83, 151, 194, 0.22)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  [106, 154].forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.lineTo(x + 250, y);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  rows.forEach((py, row) => {
    ctx.fillStyle = color;
    ctx.font = '700 12px Segoe UI';
    ctx.fillText(labels[row], x - 8, py + 4);
    const velocity = velocities[row];
    for (let particle = 0; particle < 6; particle += 1) {
      const base = particle * (laneWidth / 6);
      const travelled = base + phase * velocity;
      const wrapped = ((travelled % laneWidth) + laneWidth) % laneWidth;
      const px = laneLeft + wrapped;
      ctx.strokeStyle = fixed ? 'rgba(20, 142, 100, 0.28)' : 'rgba(213, 75, 92, 0.28)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px - Math.sign(velocity) * 11, py);
      ctx.lineTo(px - Math.sign(velocity) * 4, py);
      ctx.stroke();
      drawWaterParticle(ctx, px, py, 6, fixed ? WATER.mid : WATER.user);
    }
  });
  ctx.restore();
}

export const CompensationLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [issue, setIssue] = useState<IssueKey>('clump');
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    const order: IssueKey[] = ['clump', 'vortex', 'xsph'];
    const interval = issue === 'vortex' ? 6500 : issue === 'xsph' ? 4800 : 2600;
    const timer = window.setInterval(() => setIssue((current) => order[(order.indexOf(current) + 1) % order.length]), interval);
    return () => window.clearInterval(timer);
  }, [auto, issue]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 720, 280);
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    const start = performance.now();
    let raf = 0;
    const draw = (now: number) => {
      const phase = (now - start) / 500;
      ctx.clearRect(0, 0, 720, 280);
      if (issue === 'vortex') {
        drawVortexTrajectory(ctx, now - start);
        canvas.classList.add('is-ready');
        return;
      }
      ctx.fillStyle = WATER.page;
      ctx.fillRect(0, 0, 720, 280);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = WATER.line;
      ctx.fillRect(20, 42, 320, 196);
      ctx.strokeRect(20, 42, 320, 196);
      ctx.fillRect(380, 42, 320, 196);
      ctx.strokeRect(380, 42, 320, 196);
      ctx.fillStyle = WATER.bad;
      ctx.font = '800 17px Segoe UI';
      ctx.fillText('解决前：问题', 42, 29);
      ctx.fillStyle = WATER.good;
      ctx.fillText(`解决后：${issues[issue].method}`, 402, 29);
      if (issue === 'clump') {
        drawClump(ctx, 62, false, phase);
        drawClump(ctx, 422, true, phase);
      } else {
        drawXsph(ctx, 56, false, phase);
        drawXsph(ctx, 416, true, phase);
      }
      ctx.fillStyle = '#fdecef';
      ctx.fillRect(42, 204, 276, 26);
      ctx.fillStyle = WATER.bad;
      ctx.font = '700 13px Segoe UI';
      ctx.fillText(issues[issue].title, 104, 222);
      ctx.fillStyle = '#e6f6ef';
      ctx.fillRect(402, 204, 276, 26);
      ctx.fillStyle = WATER.good;
      ctx.fillText(issues[issue].conclusion.slice(0, 18), 432, 222);
      canvas.classList.add('is-ready');
    };
    const loop = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    draw(start);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [issue]);

  return (
    <div>
      <canvas ref={canvasRef} role="img" aria-label={`第 ${chapterId} 章模块 ${moduleId}，当前比较 ${issues[issue].title} 与 ${issues[issue].method}`} />
      <div className="talk-tabs" role="tablist" aria-label="三项稳定性与真实感补偿">
        {(Object.keys(issues) as IssueKey[]).map((key, index) => (
          <button key={key} type="button" role="tab" aria-selected={issue === key} className={issue === key ? 'active' : ''} onClick={() => { setIssue(key); setAuto(false); }}>
            {index + 1}. {issues[key].title}
          </button>
        ))}
        <button type="button" className="auto" onClick={() => setAuto((value) => !value)}>{auto ? '暂停轮播' : '自动轮播'}</button>
      </div>
      <div className="talk-equation math-equation" dangerouslySetInnerHTML={{ __html: katex.renderToString(issues[issue].latex, { displayMode: true, throwOnError: false, strict: 'ignore' }) }} />
      <p className="feedback good" aria-live="polite"><strong>{issues[issue].method}：</strong>{issues[issue].conclusion}</p>
    </div>
  );
};
