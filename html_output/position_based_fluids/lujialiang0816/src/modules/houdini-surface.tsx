import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import { WATER, drawArrow, drawWaterParticle, drawWaterSurface } from './waterKit';

type StageKey = 'import' | 'surface' | 'mesh' | 'shade';
type SurfaceMode = 'average' | 'spherical' | 'neural';

const STAGES: Array<{
  key: StageKey;
  short: string;
  node: string;
  input: string;
  operation: string;
  output: string;
}> = [
  {
    key: 'import',
    short: '导入 P / id / v',
    node: 'File SOP',
    input: 'PBF 逐帧输出的 P、id、v',
    operation: '读取点缓存，统一坐标轴、单位和帧率；再依据 PBF 粒子间距设置 pscale。',
    output: '带 P、id、v、pscale 的 Houdini 点云',
  },
  {
    key: 'surface',
    short: '粒子生成 SDF',
    node: 'Particle Fluid Surface SOP',
    input: '带 pscale 的粒子点云',
    operation: '给每个粒子建立影响范围，并把重叠影响合成为连续的液体 SDF。',
    output: '原始液体 SDF',
  },
  {
    key: 'mesh',
    short: '提取水面网格',
    node: 'Convert VDB + File Cache',
    input: 'Particle Fluid Surface 输出的液体 SDF 与粒子速度 v',
    operation: '提取 SDF 的零等值面，转换为多边形，并把 v 传递到水面网格后缓存。',
    output: '带速度属性的连续水面网格',
  },
  {
    key: 'shade',
    short: '材质与渲染',
    node: 'MaterialX + Karma',
    input: '带 v 的连续水面网格',
    operation: '设置透射、低粗糙度、IOR≈1.333、吸收、灯光与运动模糊。',
    output: '可交付的真实水面画面',
  },
];

const SURFACE_MODES: Record<SurfaceMode, { label: string; note: string }> = {
  average: { label: 'Average Position', note: '默认优先：初始 SDF 更平滑，适合连续液面。' },
  spherical: { label: 'Spherical', note: '速度较快但更颗粒化，通常需要更强平滑。' },
  neural: { label: 'Neural Liquid（H22）', note: 'Houdini 22 的实验路径，偏向薄片与液体表面时序稳定。' },
};

const POINTS = [
  [62, 184], [88, 156], [116, 178], [142, 142], [168, 169], [196, 132], [224, 161], [252, 123],
  [280, 155], [308, 139], [336, 171], [364, 146],
] as const;

function drawPipeline(ctx: CanvasRenderingContext2D, active: number) {
  STAGES.forEach((stage, index) => {
    const x = 18 + index * 178;
    const selected = index === active;
    ctx.fillStyle = selected ? '#dcefff' : '#ffffff';
    ctx.strokeStyle = selected ? WATER.guide : WATER.line;
    ctx.lineWidth = selected ? 3 : 1.5;
    ctx.fillRect(x, 18, 160, 42);
    ctx.strokeRect(x, 18, 160, 42);
    ctx.fillStyle = selected ? WATER.guide : WATER.ink;
    ctx.font = `${selected ? 700 : 600} 11px Segoe UI`;
    ctx.fillText(`${index + 1}. ${stage.short}`, x + 7, 43);
    if (index < STAGES.length - 1) {
      drawArrow(ctx, { x: x + 161, y: 39 }, { x: x + 176, y: 39 }, WATER.guide, 1.8);
    }
  });
}

function drawSurfacePreview(
  ctx: CanvasRenderingContext2D,
  stageIndex: number,
  mode: SurfaceMode,
) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = WATER.line;
  ctx.lineWidth = 1.5;
  ctx.fillRect(18, 82, 410, 196);
  ctx.strokeRect(18, 82, 410, 196);

  const surfacePoints = POINTS.map(([x, y], index) => ({
    x: x + 18,
    y: mode === 'spherical' ? y + Math.sin(index * 2.2) * 9 : y,
  }));
  if (stageIndex >= 1) {
    const alpha = stageIndex === 1 ? 0.48 : stageIndex === 2 ? 0.72 : 0.9;
    drawWaterSurface(ctx, surfacePoints, 259, stageIndex === 3 ? WATER.bright : WATER.mid, alpha);
  }

  POINTS.forEach(([x, y], index) => {
    const particleAlpha = stageIndex >= 2 ? 0.22 : 0.95;
    drawWaterParticle(ctx, x + 18, y, stageIndex >= 1 ? 5 : 7, WATER.mid, particleAlpha);
  });

  if (stageIndex === 1) {
    surfacePoints.forEach((point) => {
      ctx.strokeStyle = mode === 'spherical' ? WATER.aux : WATER.guide;
      ctx.globalAlpha = 0.34;
      ctx.beginPath();
      ctx.arc(point.x, point.y, mode === 'spherical' ? 14 : 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  }
  if (stageIndex === 2) {
    ctx.strokeStyle = 'rgba(7,84,166,0.5)';
    ctx.lineWidth = 1.15;
    for (let index = 0; index < surfacePoints.length - 1; index += 1) {
      const a = surfacePoints[index];
      const b = surfacePoints[index + 1];
      const middleA = { x: a.x, y: (a.y + 259) / 2 };
      const middleB = { x: b.x, y: (b.y + 259) / 2 };
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.lineTo(middleA.x, middleA.y);
      ctx.lineTo(middleB.x, middleB.y);
      ctx.lineTo(a.x, a.y);
      ctx.moveTo(middleA.x, middleA.y);
      ctx.lineTo(b.x, b.y);
      ctx.moveTo(middleA.x, middleA.y);
      ctx.lineTo(middleB.x, middleB.y);
      ctx.lineTo(a.x, 259);
      ctx.lineTo(b.x, 259);
      ctx.lineTo(middleA.x, middleA.y);
      ctx.moveTo(middleB.x, middleB.y);
      ctx.lineTo(a.x, 259);
      ctx.stroke();
    }
    ctx.fillStyle = WATER.guide;
    ctx.font = '700 12px Segoe UI';
    ctx.fillText('零等值面 → 多边形水面网格', 120, 104);
  }
  if (stageIndex === 3) {
    const shine = ctx.createLinearGradient(36, 100, 360, 250);
    shine.addColorStop(0, 'rgba(255,255,255,0)');
    shine.addColorStop(0.44, 'rgba(255,255,255,0.7)');
    shine.addColorStop(0.56, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(36, 98, 370, 156);
    ctx.fillStyle = WATER.ink;
    ctx.font = '700 12px Segoe UI';
    ctx.fillText('Transmission / IOR / absorption / motion blur', 78, 106);
  }

  ctx.fillStyle = WATER.muted;
  ctx.font = '11px Segoe UI';
  ctx.fillText(stageIndex === 0 ? '输入是 PBF 导出的 P / id / v；pscale 在 Houdini 中依据粒子间距设置' : '连续表面是渲染表示，不会反向改变 PBF 求解结果', 34, 268);
}

function drawStageCard(ctx: CanvasRenderingContext2D, stage: (typeof STAGES)[number]) {
  ctx.fillStyle = '#f7fbff';
  ctx.strokeStyle = WATER.line;
  ctx.fillRect(446, 82, 266, 196);
  ctx.strokeRect(446, 82, 266, 196);
  ctx.fillStyle = WATER.guide;
  ctx.font = '800 14px Segoe UI';
  ctx.fillText(stage.node, 462, 108);
  ctx.fillStyle = WATER.ink;
  ctx.font = '600 12px Segoe UI';
  ctx.fillText('输入', 462, 134);
  ctx.fillStyle = WATER.muted;
  ctx.font = '11px Segoe UI';
  const lines = stage.input.match(/.{1,25}/g) ?? [stage.input];
  lines.slice(0, 2).forEach((line, index) => ctx.fillText(line, 462, 151 + index * 16));
  drawArrow(ctx, { x: 582, y: 169 }, { x: 582, y: 185 }, WATER.guide, 2);
  ctx.fillStyle = WATER.ink;
  ctx.font = '600 12px Segoe UI';
  ctx.fillText('输出', 462, 197);
  ctx.fillStyle = WATER.muted;
  ctx.font = '11px Segoe UI';
  const outputs = stage.output.match(/.{1,25}/g) ?? [stage.output];
  outputs.slice(0, 2).forEach((line, index) => ctx.fillText(line, 462, 214 + index * 16));
}

export const HoudiniSurface: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState<StageKey>('import');
  const [surfaceMode, setSurfaceMode] = useState<SurfaceMode>('average');
  const activeIndex = STAGES.findIndex((item) => item.key === stage);
  const current = STAGES[activeIndex];

  const feedback = useMemo(() => {
    if (stage === 'surface') return `${SURFACE_MODES[surfaceMode].label}：${SURFACE_MODES[surfaceMode].note}`;
    return current.operation;
  }, [current.operation, stage, surfaceMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => {
      const ctx = setupCanvas(canvas, 730, 300);
      canvas.style.width = '100%';
      canvas.style.maxWidth = '730px';
      canvas.style.height = 'auto';
      ctx.clearRect(0, 0, 730, 300);
      ctx.fillStyle = WATER.page;
      ctx.fillRect(0, 0, 730, 300);
      drawPipeline(ctx, activeIndex);
      drawSurfacePreview(ctx, activeIndex, surfaceMode);
      drawStageCard(ctx, current);
      canvas.classList.add('is-ready');
    };
    draw();
    return observeCanvas(canvas, draw, () => {});
  }, [activeIndex, current, surfaceMode]);

  return (
    <div>
      <div className="chip-row" role="tablist" aria-label="Houdini 表面重建阶段">
        {STAGES.map((item, index) => (
          <button
            type="button"
            role="tab"
            aria-selected={stage === item.key}
            className={`chip ${stage === item.key ? 'selected' : ''}`}
            key={item.key}
            onClick={() => setStage(item.key)}
          >
            {index + 1}. {item.short}
          </button>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`第 ${chapterId} 章模块 ${moduleId}，当前 Houdini 阶段：${current.short}；节点：${current.node}。`}
        style={{ width: '100%', maxWidth: 730, height: 'auto' }}
      />
      {stage === 'surface' && (
        <div className="chip-row" role="group" aria-label="选择粒子表面化方法">
          {(Object.keys(SURFACE_MODES) as SurfaceMode[]).map((key) => (
            <button
              type="button"
              className={`chip ${surfaceMode === key ? 'selected' : ''}`}
              aria-pressed={surfaceMode === key}
              key={key}
              onClick={() => setSurfaceMode(key)}
            >
              {SURFACE_MODES[key].label}
            </button>
          ))}
        </div>
      )}
      <div className="metrics" aria-label="当前 Houdini 阶段接口">
        <div className="metric"><div className="l">输入</div><div className="v" style={{ fontSize: 15 }}>{current.input}</div></div>
        <div className="metric"><div className="l">Houdini 处理</div><div className="v" style={{ fontSize: 17 }}>{current.node}</div></div>
        <div className="metric"><div className="l">输出</div><div className="v" style={{ fontSize: 15 }}>{current.output}</div></div>
      </div>
      <div className={`feedback ${stage === 'shade' || stage === 'mesh' ? 'good' : ''}`} aria-live="polite">{feedback}</div>
      <p className="step-desc">PBF 直接导入 P、id、v；pscale 在 Houdini 中依据粒子间距设置。</p>
      <section aria-labelledby="pbf-particle-result-title" style={{ marginTop: 18 }}>
        <h4 id="pbf-particle-result-title" style={{ margin: '0 0 10px', color: WATER.ink }}>PBF 粒子模拟结果（渲染前）</h4>
        <video
          controls
          playsInline
          preload="metadata"
          aria-label="导入 Houdini 并进行水面重建之前的 PBF 粒子模拟视频"
          style={{
            display: 'block',
            width: '100%',
            maxWidth: 960,
            aspectRatio: '16 / 9',
            objectFit: 'contain',
            background: '#071d38',
            border: `1px solid ${WATER.line}`,
            borderRadius: 16,
          }}
        >
          <source src={`${import.meta.env.BASE_URL}pbf_particles.mp4`} type="video/mp4" />
          当前浏览器不支持视频播放。
        </video>
      </section>
      <section aria-labelledby="houdini-result-title" style={{ marginTop: 18 }}>
        <h4 id="houdini-result-title" style={{ margin: '0 0 10px', color: WATER.ink }}>Houdini 最终渲染结果</h4>
        <video
          controls
          playsInline
          preload="metadata"
          aria-label="PBF 粒子在 Houdini 中重建并渲染得到的水面视频"
          style={{
            display: 'block',
            width: '100%',
            maxWidth: 960,
            aspectRatio: '16 / 9',
            objectFit: 'contain',
            background: '#071d38',
            border: `1px solid ${WATER.line}`,
            borderRadius: 16,
          }}
        >
          <source src={`${import.meta.env.BASE_URL}pbf_best.mp4`} type="video/mp4" />
          当前浏览器不支持视频播放。
        </video>
      </section>
      <p className="step-desc">
        这条 Houdini 管线是面向渲染的工程扩展，不是 2013 年 PBF 论文贡献。官方节点文档：
        {' '}
        <a href="https://www.sidefx.com/docs/houdini/nodes/sop/particlefluidsurface.html" target="_blank" rel="noreferrer">Particle Fluid Surface</a>
        {' · '}
        <a href="https://www.sidefx.com/docs/houdini/nodes/sop/vdbfromparticles.html" target="_blank" rel="noreferrer">VDB From Particles</a>
        {' · '}
        <a href="https://www.sidefx.com/docs/houdini/nodes/vop/mtlxstandard_surface.html" target="_blank" rel="noreferrer">MtlX Standard Surface</a>
      </p>
    </div>
  );
};
