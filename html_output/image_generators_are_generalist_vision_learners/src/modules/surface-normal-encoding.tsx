import React, { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 270;
const MINI_W = 244;
const MINI_H = 130;
const NORMAL_CX = 148;
const NORMAL_CY = 139;
const NORMAL_RADIUS = 78;
const PALETTE_X = 446;
const PALETTE_Y = 52;
const PALETTE_CELL = 11;
const PALETTE_GAP = 3;
const C = {
  background: '#f5f8f0',
  surface: '#ffffff',
  terrain: '#b8c9a7',
  contour: '#76906a',
  blue: '#27446e',
  green: '#228d5c',
  orange: '#d97706',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
};

interface NormalVector {
  x: number;
  y: number;
  z: number;
}

interface NormalPaletteCell {
  row: number;
  column: number;
  normal: NormalVector;
}

const PRESETS: Array<{ label: string; vector: NormalVector }> = [
  { label: '朝左', vector: { x: -1, y: 0, z: 0 } },
  { label: '朝上', vector: { x: 0, y: 1, z: 0 } },
  { label: '朝向相机', vector: { x: 0, y: 0, z: 1 } },
];

const PALETTE_LEVELS = [-0.8, -0.4, 0, 0.4, 0.8];
const NORMAL_PALETTE: NormalPaletteCell[] = PALETTE_LEVELS.flatMap((x, column) => (
  [...PALETTE_LEVELS].reverse().flatMap((y, row) => {
    const radialSquared = x * x + y * y;
    if (radialSquared > 1) return [];
    return [{ row, column, normal: { x, y, z: Math.sqrt(1 - radialSquared) } }];
  })
));

function isCompact(moduleId: string) {
  return !/^\d+(\.\d+)?$/.test(moduleId);
}

function channel(value: number) {
  return Math.trunc(clamp(value, 0, 1) * 255);
}

function normalToRgb(normal: NormalVector): [number, number, number] {
  return [
    channel((1 - normal.x) / 2),
    channel((1 + normal.y) / 2),
    channel((1 + normal.z) / 2),
  ];
}

function paletteRect(cell: NormalPaletteCell) {
  return {
    x: PALETTE_X + cell.column * (PALETTE_CELL + PALETTE_GAP),
    y: PALETTE_Y + cell.row * (PALETTE_CELL + PALETTE_GAP),
  };
}

function paletteNormalAt(x: number, y: number) {
  const match = NORMAL_PALETTE.find((cell) => {
    const rect = paletteRect(cell);
    return x >= rect.x && x <= rect.x + PALETTE_CELL && y >= rect.y && y <= rect.y + PALETTE_CELL;
  });
  return match?.normal ?? null;
}

function normalFromHemispherePoint(x: number, y: number): NormalVector {
  let nx = (x - NORMAL_CX) / NORMAL_RADIUS;
  let ny = (NORMAL_CY - y) / NORMAL_RADIUS;
  const length = Math.hypot(nx, ny);
  if (length > 1) {
    nx /= length;
    ny /= length;
  }
  return { x: nx, y: ny, z: Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)) };
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 10,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  color = C.text,
  size = 11,
  align: CanvasTextAlign = 'left',
) {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(value, x, y);
}

function arrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.strokeStyle = C.blue;
  ctx.fillStyle = C.blue;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - 13 * Math.cos(angle - Math.PI / 6), toY - 13 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - 13 * Math.cos(angle + Math.PI / 6), toY - 13 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function drawMain(ctx: CanvasRenderingContext2D, normal: NormalVector) {
  const rgb = normalToRgb(normal);
  const cx = NORMAL_CX;
  const cy = NORMAL_CY;
  const radius = NORMAL_RADIUS;
  const tipX = cx + normal.x * radius;
  const tipY = cy - normal.y * radius;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.background;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = C.surface;
  ctx.strokeStyle = C.terrain;
  ctx.lineWidth = 2;
  roundedRect(ctx, 14, 28, 270, 218);
  ctx.fill();
  ctx.stroke();
  roundedRect(ctx, 300, 28, 246, 218);
  ctx.fill();
  ctx.stroke();

  text(ctx, '相机空间单位半球', 28, 20, C.blue, 12);
  text(ctx, '方向、颜色与 RGB 同步编码', 312, 20, C.blue, 12);

  const radial = ctx.createRadialGradient(cx - 24, cy - 28, 8, cx, cy, radius);
  radial.addColorStop(0, '#ffffff');
  radial.addColorStop(1, '#dfe8d7');
  ctx.fillStyle = radial;
  ctx.strokeStyle = C.contour;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - radius, cy);
  ctx.lineTo(cx + radius, cy);
  ctx.moveTo(cx, cy - radius);
  ctx.lineTo(cx, cy + radius);
  ctx.stroke();
  text(ctx, '−x', cx - radius - 5, cy + 18, C.muted, 10, 'center');
  text(ctx, '+x', cx + radius + 5, cy + 18, C.muted, 10, 'center');
  text(ctx, '+y', cx + 14, cy - radius + 4, C.muted, 10);

  if (Math.hypot(normal.x, normal.y) < 0.08) {
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = C.blue;
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    arrow(ctx, cx, cy, tipX, tipY);
  }
  text(ctx, `x ${normal.x.toFixed(2)}`, 42, 232, C.text, 10);
  text(ctx, `y ${normal.y.toFixed(2)}`, 115, 232, C.text, 10);
  text(ctx, `z ${normal.z.toFixed(2)}`, 188, 232, C.text, 10);

  ctx.fillStyle = `rgb(${rgb.join(',')})`;
  ctx.strokeStyle = C.contour;
  ctx.lineWidth = 2;
  roundedRect(ctx, 318, 48, 108, 74, 10);
  ctx.fill();
  ctx.stroke();
  const lightColor = (rgb[0] + rgb[1] + rgb[2]) / 3 > 140 ? C.text : '#ffffff';
  text(ctx, `RGB`, 372, 78, lightColor, 10, 'center');
  text(ctx, `(${rgb.join(', ')})`, 372, 96, lightColor, 10, 'center');

  text(ctx, '选择颜色', 480, 43, C.muted, 9, 'center');
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  roundedRect(ctx, 438, 47, 84, 77, 8);
  ctx.fill();
  ctx.stroke();
  NORMAL_PALETTE.forEach((cell) => {
    const rect = paletteRect(cell);
    const cellRgb = normalToRgb(cell.normal);
    const selected = Math.abs(cell.normal.x - normal.x) < 0.015
      && Math.abs(cell.normal.y - normal.y) < 0.015
      && Math.abs(cell.normal.z - normal.z) < 0.015;
    ctx.fillStyle = `rgb(${cellRgb.join(',')})`;
    ctx.strokeStyle = selected ? C.orange : '#ffffff';
    ctx.lineWidth = selected ? 2.5 : 1;
    roundedRect(ctx, rect.x, rect.y, PALETTE_CELL, PALETTE_CELL, 2.5);
    ctx.fill();
    ctx.stroke();
  });

  const rows: Array<{ label: string; value: number; color: string; formula: string }> = [
    { label: 'R', value: rgb[0], color: '#c43f52', formula: '(1−x)/2' },
    { label: 'G', value: rgb[1], color: C.green, formula: '(1+y)/2' },
    { label: 'B', value: rgb[2], color: C.blue, formula: '(1+z)/2' },
  ];
  rows.forEach((row, index) => {
    const y = 147 + index * 29;
    text(ctx, row.label, 320, y + 10, row.color, 11);
    ctx.fillStyle = '#edf1f5';
    roundedRect(ctx, 342, y, 112, 12, 6);
    ctx.fill();
    ctx.fillStyle = row.color;
    roundedRect(ctx, 342, y, 112 * (row.value / 255), 12, 6);
    ctx.fill();
    text(ctx, String(row.value), 466, y + 10, C.text, 10);
    text(ctx, row.formula, 526, y + 10, C.muted, 9, 'right');
  });
  text(ctx, '单位向量：x² + y² + z² = 1', 423, 238, C.muted, 10, 'center');
}

function drawMini(ctx: CanvasRenderingContext2D, now: number, reducedMotion: boolean) {
  const phase = reducedMotion ? 0.72 : (now % 3200) / 3200;
  const angle = -Math.PI + phase * Math.PI * 1.55;
  const x = Math.cos(angle);
  const y = Math.sin(angle);
  const normal = { x, y, z: 0 };
  const rgb = normalToRgb(normal);
  const cx = 78;
  const cy = 70;
  const radius = 42;

  ctx.clearRect(0, 0, MINI_W, MINI_H);
  ctx.fillStyle = C.background;
  ctx.fillRect(0, 0, MINI_W, MINI_H);
  ctx.fillStyle = C.surface;
  ctx.strokeStyle = C.terrain;
  ctx.lineWidth = 2;
  roundedRect(ctx, 10, 15, 224, 100);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#edf3e8';
  ctx.strokeStyle = C.contour;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  arrow(ctx, cx, cy, cx + x * radius, cy - y * radius);
  ctx.fillStyle = `rgb(${rgb.join(',')})`;
  ctx.strokeStyle = C.contour;
  roundedRect(ctx, 142, 38, 72, 52, 8);
  ctx.fill();
  ctx.stroke();
  text(ctx, '方向', cx, 110, C.muted, 10, 'center');
  text(ctx, 'RGB', 178, 106, C.muted, 10, 'center');
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(122, 69);
  ctx.lineTo(137, 69);
  ctx.stroke();
}

export const SurfaceNormalEncoding: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const compact = isCompact(moduleId);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const [normal, setNormal] = useState<NormalVector>({ x: 0, y: 0, z: 1 });
  const rgb = useMemo(() => normalToRgb(normal), [normal]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, compact ? MINI_W : W, compact ? MINI_H : H);
    } catch {
      return;
    }
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let animationFrame: number | null = null;
    const draw = (now = 0) => {
      if (compact) drawMini(ctx, now, reducedMotion);
      else drawMain(ctx, normal);
      canvas.classList.add('is-ready');
      if (compact && !reducedMotion) animationFrame = requestAnimationFrame(draw);
    };
    const start = () => {
      if (animationFrame === null) animationFrame = requestAnimationFrame(draw);
    };
    const stop = () => {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      animationFrame = null;
    };
    if (!compact) draw();
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [compact, normal]);

  const canvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || compact) return null;
    const rect = canvas.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * W;
    const py = ((event.clientY - rect.top) / rect.height) * H;
    return { x: px, y: py };
  };

  const updateFromPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = canvasPoint(event);
    if (!point) return;
    setNormal(normalFromHemispherePoint(point.x, point.y));
  };

  const feedback = normal.z > 0.92
    ? '法线朝向相机时，z 接近 1，因此蓝通道接近 255；x、y 为 0，使红、绿通道落在中点附近。'
    : normal.x < -0.88
      ? '法线朝左时 x 接近 −1；论文对红通道使用 (1−x)/2，因此红通道升到 255。'
      : normal.y > 0.88
        ? '法线朝上时 y 接近 1，绿通道升到 255；颜色在这里是方向向量的可逆数值载体。'
        : `当前单位法线为 (${normal.x.toFixed(2)}, ${normal.y.toFixed(2)}, ${normal.z.toFixed(2)})，同一状态同步决定箭头、RGB 色块与三个通道。`;

  if (compact) {
    return (
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={MINI_W}
        height={MINI_H}
        aria-label="测向针转动时，旁边的法线 RGB 色块同步变色"
      />
    );
  }

  return (
    <div>
      <figure className="paper-evidence-figure">
        <img src="/images/paper-normal-cat.png" alt="论文图 8 高分辨率局部：输入猫咪、Lotus-2 法线图与 Vision Banana 法线图" loading="lazy" />
        <figcaption>
          <strong>图 8｜表面法线的三列对照</strong>
          <span>从左到右为输入、Lotus-2 和 Vision Banana。局部裁切保留猫毛、树皮和草叶等细节，避免整页复合图缩小后无法辨认。</span>
        </figcaption>
      </figure>
      <div className="paper-choice-group" role="group" aria-label="法线方向预设">
        {PRESETS.map((preset) => {
          const selected = Math.abs(normal.x - preset.vector.x) < 0.02
            && Math.abs(normal.y - preset.vector.y) < 0.02
            && Math.abs(normal.z - preset.vector.z) < 0.02;
          return (
            <button
              key={preset.label}
              type="button"
              aria-pressed={selected}
              onClick={() => setNormal(preset.vector)}
            >
              {preset.label} ({preset.vector.x}, {preset.vector.y}, {preset.vector.z})
            </button>
          );
        })}
      </div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        tabIndex={0}
        aria-label={`可拖动相机空间法线，也可从右侧调色板选择合法法线颜色；当前向量 ${normal.x.toFixed(2)}, ${normal.y.toFixed(2)}, ${normal.z.toFixed(2)}`}
        style={{ width: '100%', maxWidth: W, height: 'auto', touchAction: 'none', cursor: 'crosshair' }}
        onPointerDown={(event) => {
          const point = canvasPoint(event);
          if (!point) return;
          const paletteNormal = paletteNormalAt(point.x, point.y);
          if (paletteNormal) {
            setNormal(paletteNormal);
            dragging.current = false;
            return;
          }
          if (Math.hypot(point.x - NORMAL_CX, point.y - NORMAL_CY) > NORMAL_RADIUS + 12) return;
          dragging.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          setNormal(normalFromHemispherePoint(point.x, point.y));
        }}
        onPointerMove={(event) => {
          if (dragging.current) updateFromPointer(event);
        }}
        onPointerUp={(event) => {
          dragging.current = false;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 0.1 : 0.04;
          let x = normal.x;
          let y = normal.y;
          if (event.key === 'ArrowLeft') x -= step;
          else if (event.key === 'ArrowRight') x += step;
          else if (event.key === 'ArrowUp') y += step;
          else if (event.key === 'ArrowDown') y -= step;
          else return;
          event.preventDefault();
          const length = Math.hypot(x, y);
          if (length > 1) {
            x /= length;
            y /= length;
          }
          setNormal({ x, y, z: Math.sqrt(Math.max(0, 1 - x * x - y * y)) });
        }}
      />
      <p className="note">可以直接拖动左侧半球调整方向，也可以点击右侧调色板中的合法法线颜色；两种操作都会同步更新箭头、单位向量与 RGB 通道。</p>
      <div className="feedback good" role="status" aria-live="polite">{feedback}</div>
      <dl className="paper-fact-grid">
        <dt>相机空间单位法线</dt><dd>({normal.x.toFixed(3)}, {normal.y.toFixed(3)}, {normal.z.toFixed(3)})</dd>
        <dt>编码后的 RGB</dt><dd>({rgb.join(', ')})</dd>
        <dt>坐标约定</dt><dd>+x 向右、+y 向上、+z 指向图像平面外；图中演示面向相机的半球。</dd>
      </dl>
      <details className="paper-technical-details">
        <summary>技术细节：法线通道公式与坐标约定</summary>
        <div className="paper-technical-details-body">
          <p><strong>通道映射：</strong>R=trunc((1−x)/2, 0, 1)×255；G=trunc((1+y)/2, 0, 1)×255；B=trunc((1+z)/2, 0, 1)×255。</p>
          <ul>
            <li>(−1,0,0) 朝左，对应偏粉红色；(0,1,0) 朝上，对应浅绿色；(0,0,1) 朝向相机，对应浅蓝色。</li>
            <li>法线必须是相机空间右手坐标系中的单位向量：+x 向右、+y 向上、+z 指向图像平面外。</li>
            <li>这套直接通道映射只适用于表面法线；不能拿它解码深度或实例掩码。</li>
          </ul>
        </div>
      </details>
      <details className="paper-technical-details paper-benchmark-details">
        <summary>查看论文表 7：完整法线评测与模型对比</summary>
        <div className="paper-technical-details-body">
          <section className="paper-benchmark-section">
            <h4>表面法线估计｜三个室内基准与 VKitti</h4>
            <p className="paper-benchmark-source">论文表 7；mean 与 median 均为角度误差，越低越好。</p>
            <div className="paper-table-scroll wide" role="region" aria-label="论文表7表面法线完整评测，可横向滚动" tabIndex={0}>
              <table className="paper" aria-label="表面法线模型对比">
                <thead>
                  <tr><th>方法</th><th>室内平均 mean ↓</th><th>室内平均 median ↓</th><th>NYUv2 mean ↓</th><th>NYUv2 median ↓</th><th>DIODE-indoor mean ↓</th><th>DIODE-indoor median ↓</th><th>ScanNet mean ↓</th><th>ScanNet median ↓</th><th>VKitti mean ↓</th><th>VKitti median ↓</th></tr>
                </thead>
                <tbody>
                  <tr><td>Marigold</td><td>19.606</td><td>11.828</td><td>20.864</td><td>11.134</td><td>16.671</td><td>12.084</td><td>21.284</td><td>12.268</td><td>—</td><td>—</td></tr>
                  <tr><td>DSINE</td><td>17.017</td><td>10.190</td><td><strong>16.400</strong></td><td><strong>8.400</strong></td><td>18.453</td><td>13.871</td><td>16.200</td><td>8.300</td><td>28.900</td><td>9.900</td></tr>
                  <tr><td>StableNormal</td><td>17.168</td><td>10.028</td><td>19.707</td><td>10.527</td><td><strong>13.701</strong></td><td><strong>9.460</strong></td><td>18.098</td><td>10.097</td><td>—</td><td>—</td></tr>
                  <tr><td>Lotus-2-Normal</td><td>16.558</td><td>—</td><td>16.900</td><td>N/A</td><td>18.575</td><td>N/A</td><td><strong>14.200</strong></td><td>N/A</td><td><strong>28.894</strong></td><td><strong>9.677</strong></td></tr>
                  <tr className="paper-benchmark-method"><td><strong>Vision Banana</strong></td><td><strong>15.549</strong></td><td><strong>9.300</strong></td><td>17.778</td><td>8.876</td><td>13.818</td><td>11.556</td><td>15.052</td><td><strong>7.468</strong></td><td>29.063</td><td>10.699</td></tr>
                </tbody>
              </table>
            </div>
            <p className="paper-benchmark-note">Vision Banana 在三个室内数据集的平均 mean/median 角误差最低；在 VKitti 上略逊于 Lotus-2，但 Lotus-2 使用了 VKitti 训练，而 Vision Banana 没有使用任何受测基准的训练集。</p>
          </section>
        </div>
      </details>
      <p className="note">图 8 的定性比较显示 Vision Banana 保留了更细的表面纹理；但在 Virtual KITTI 2 上，它的 mean/median 角误差为 29.063°/10.699°，略高于使用该数据训练的 Lotus-2（28.894°/9.677°）。视觉细节与数值误差必须分别陈述。</p>
    </div>
  );
};

export default SurfaceNormalEncoding;
