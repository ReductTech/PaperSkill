import React, { useEffect, useRef, useState } from 'react';
import { clamp, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  LSM_COLORS as C,
  clearScene,
  drawBuilding,
  drawCuboid,
  drawFloorGrid,
  drawPoint3D,
  label,
  poly3D,
  type View3D,
} from './lsm-3d-kit';

type MaskMode = 'mask' | 'depth' | 'down';

export const LsmC9Mask: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<MaskMode>('mask');
  const [maskX, setMaskX] = useState(55);
  const [choice, setChoice] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = 800;
    const height = 380;
    const ctx = setupCanvas(canvas, width, height);
    clearScene(ctx, width, height);

    if (mode === 'mask') {
      const view: View3D = { ox: 390, oy: 295, scale: 2.25, yaw: -0.72, pitch: -0.45, focal: 690 };
      const zone = maskX < 45 ? 'static' : maskX < 72 ? 'sky' : 'person';
      label(ctx, '把三维选择平面拖过场景：只有可靠静态表面写入 Λₜ', 24, 31, C.ink, true, 16);
      label(ctx, '建筑有稳定深度；天空缺少可靠几何；人物状态会跨 chunk 改变', 24, 54, C.muted, false, 12);
      drawFloorGrid(ctx, view, 75, 18);
      poly3D(ctx, [
        { x: -75, y: 0, z: 48 }, { x: 75, y: 0, z: 48 },
        { x: 75, y: 62, z: 48 }, { x: -75, y: 62, z: 48 },
      ], view, '#d9e9f3aa', C.blueSoft, 1);
      drawBuilding(ctx, view, { x: -22, y: 0, z: 8 }, zone === 'static' ? C.green : C.blueSoft, zone === 'static' ? 1 : 0.55);
      const person = { x: 33, y: 25, z: 14 };
      drawCuboid(ctx, { x: person.x, y: 10, z: person.z }, { x: 7, y: 19, z: 7 }, view, {
        front: zone === 'person' ? C.red : C.redSoft,
        side: '#a83245',
        top: C.redSoft,
        stroke: C.white,
      });
      drawPoint3D(ctx, person, view, zone === 'person' ? C.red : C.redSoft, 6, zone === 'person');

      const planeX = -58 + maskX * 1.12;
      const planeColor = zone === 'static' ? C.green : C.red;
      poly3D(ctx, [
        { x: planeX, y: 0, z: -28 }, { x: planeX, y: 0, z: 45 },
        { x: planeX, y: 53, z: 45 }, { x: planeX, y: 53, z: -28 },
      ], view, `${planeColor}22`, planeColor, 3);
      label(ctx, zone === 'static' ? '✓ 静态建筑写入 M' : zone === 'sky' ? '× 天空不写入' : '× 动态人物不写入', 535, 315, planeColor, true, 14);
      label(ctx, 'Λₜ', 702, 344, planeColor, true, 16);
    } else {
      const data = mode === 'depth'
        ? [{ n: 'DepthAnything 3', v: 70.36 }, { n: 'MapAnything', v: 69.66 }, { n: 'UniDepth', v: 69.13 }]
        : [{ n: '双线性', v: 42.53 }, { n: '最近邻', v: 47.78 }, { n: '面积池化', v: 53.72 }, { n: '中值池化', v: 52.22 }];
      label(ctx, mode === 'depth' ? 'Table 4 · 深度源消融（Average，越高越好）' : 'Table 5 · 投影 hole rate（越低越好）', 24, 31, C.ink, true, 16);
      label(ctx, '这里保留二维定量图，因为它表达的是数值比较而不是空间几何', 24, 54, C.muted, false, 12);
      data.forEach((item, index) => {
        const y = 91 + index * 62;
        const max = mode === 'depth' ? 72 : 56;
        ctx.fillStyle = index === choice ? C.orange : C.blue;
        ctx.fillRect(184, y, Math.max(20, (item.v / max) * 520), 31);
        label(ctx, item.n, 25, y + 22, index === choice ? C.orange : C.ink, true, 13);
        label(ctx, String(item.v), 718, y + 22, index === choice ? C.orange : C.ink, true, 13);
      });
    }
    canvas.classList.add('is-ready');
  }, [mode, maskX, choice]);

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging.current || mode !== 'mask') return;
    const rect = event.currentTarget.getBoundingClientRect();
    setMaskX(Math.round(clamp(((event.clientX - rect.left) / rect.width) * 100, 10, 90)));
  };
  const zone = maskX < 45
    ? '建筑静态单元：深度有效时可以写入缓存。'
    : maskX < 72
      ? '天空：几何不可靠，被 Λₜ 排除。'
      : '动态人物：状态会变化，被排除以免污染持久缓存。';

  const optionNames = mode === 'depth'
    ? ['DepthAnything 3', 'MapAnything', 'UniDepth']
    : ['双线性', '最近邻', '面积池化', '中值池化'];

  return (
    <div>
      <div className="chip-row">
        <button className={`chip ${mode === 'mask' ? 'selected' : ''}`} onClick={() => setMode('mask')}>动态过滤</button>
        <button className={`chip ${mode === 'depth' ? 'selected' : ''}`} onClick={() => { setMode('depth'); setChoice(0); }}>深度源</button>
        <button className={`chip ${mode === 'down' ? 'selected' : ''}`} onClick={() => { setMode('down'); setChoice(0); }}>下采样</button>
      </div>
      {mode !== 'mask' ? (
        <div className="chip-row">
          {optionNames.map((name, index) => <button key={name} className={`chip ${choice === index ? 'selected' : ''}`} onClick={() => setChoice(index)}>{name}</button>)}
        </div>
      ) : null}
      <canvas
        ref={canvasRef}
        width={800}
        height={380}
        aria-label="三维场景中的静态表面过滤"
        onPointerDown={(event) => { dragging.current = true; event.currentTarget.setPointerCapture(event.pointerId); move(event); }}
        onPointerMove={move}
        onPointerUp={() => { dragging.current = false; }}
      />
      <div className={`feedback ${mode === 'mask' && maskX >= 45 ? 'bad' : 'good'}`}>
        {mode === 'mask'
          ? zone
          : mode === 'depth'
            ? '三种深度源结果接近，但默认 DepthAnything 3 的 Average 70.36 最高；这说明方法有一定弹性，不等于不依赖深度。'
            : '双线性 hole rate 42.53% 最低，因此成为经验默认；论文也指出它会在物体轮廓处平滑深度。'}
      </div>
    </div>
  );
};
