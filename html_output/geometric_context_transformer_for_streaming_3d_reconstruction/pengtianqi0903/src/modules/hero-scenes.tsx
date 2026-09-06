import React from 'react';
import { CanvasViewport } from '../components/CanvasViewport';
import type { WidgetProps } from './registry';
import {
  COLORS,
  arrow,
  camera,
  canvasStyle,
  clear,
  label,
  route,
  roundedRect,
  token,
  useAnimatedCanvas,
} from './gct-kit';

function HeroScene({ gca }: { gca: boolean }) {
  const draw = React.useCallback(
    (ctx: CanvasRenderingContext2D, progress: number) => {
      const width = 360;
      const height = 160;
      clear(ctx, width, height);
      const points: Array<[number, number]> = [
        [22, 119], [86, 78], [155, 96], [228, 48], [333, 82],
      ];
      route(ctx, points, gca ? COLORS.green : COLORS.border);
      if (!gca) {
        route(
          ctx,
          points.map(([x, y], index) => [x, y + Math.max(0, index - 1) * progress * 13]),
          COLORS.red,
          true,
        );
      }

      const cameraX = 28 + progress * 290;
      camera(ctx, cameraX, 120 - Math.sin(progress * Math.PI) * 48, gca ? COLORS.green : COLORS.red);

      if (gca) {
        roundedRect(ctx, 18, 14, 88, 31, COLORS.pale, COLORS.blue);
        label(ctx, 'Anchor full', 29, 35, COLORS.blue, 11, 800);
        roundedRect(ctx, 116, 14, 91, 31, COLORS.pale, COLORS.blue);
        label(ctx, 'Window full', 126, 35, COLORS.blue, 11, 800);
        roundedRect(ctx, 217, 14, 124, 31, '#f5f3ff', COLORS.purple);
        label(ctx, 'Memory · 6/帧', 228, 35, COLORS.purple, 11, 800);
      } else {
        const count = 4 + Math.round(progress * 7);
        for (let index = 0; index < count; index += 1) {
          token(ctx, 18 + index * 27, 18, index > 7 ? COLORS.red : COLORS.blue, '', 19);
        }
        label(ctx, '完整图像 token 持续堆积', 18, 55, COLORS.red, 11, 800);
      }

      label(
        ctx,
        gca ? '把历史拆成三种几何职责' : '全留会涨，纯滑窗会忘',
        16,
        149,
        gca ? COLORS.green : COLORS.red,
        12,
        800,
      );
    },
    [gca],
  );
  const ref = useAnimatedCanvas(draw, 160, 360, 2800);
  return (
    <canvas
      ref={ref}
      width={360}
      height={160}
      style={canvasStyle(360)}
      role="img"
      aria-label={
        gca
          ? 'GCA 将历史组织为锚点、局部窗口和每帧六 token 轨迹记忆的动画'
          : '全历史缓存增长和纯滑窗漂移风险的动画'
      }
    />
  );
}

export const HeroOld: React.FC<WidgetProps> = () => <HeroScene gca={false} />;
export const HeroNew: React.FC<WidgetProps> = () => <HeroScene gca />;

function drawCampusBuilding(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  ctx.fillStyle = '#e7e1d5';
  ctx.strokeStyle = '#9b8f7b';
  ctx.lineWidth = 1.2;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
  ctx.fillStyle = '#b7aa94';
  ctx.beginPath();
  ctx.moveTo(x - 4, y);
  ctx.lineTo(x + width / 2, y - 13);
  ctx.lineTo(x + width + 4, y);
  ctx.closePath();
  ctx.fill();
  const columns = width < 60 ? 2 : 3;
  const windowWidth = width < 60 ? 8 : 12;
  const windowStep = (width - 16) / columns;
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      ctx.fillStyle = '#c9d8e7';
      ctx.fillRect(x + 8 + col * windowStep, y + 18 + row * 27, windowWidth, 15);
    }
  }
}

function drawCampusTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  scale = 1,
) {
  ctx.fillStyle = '#8b735c';
  ctx.fillRect(x - 3 * scale, groundY - 31 * scale, 6 * scale, 31 * scale);
  ctx.fillStyle = COLORS.campusDark;
  ctx.beginPath();
  ctx.arc(x, groundY - 39 * scale, 17 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.campus;
  ctx.beginPath();
  ctx.arc(x - 8 * scale, groundY - 34 * scale, 11 * scale, 0, Math.PI * 2);
  ctx.arc(x + 9 * scale, groundY - 34 * scale, 12 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawPhotographer(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  scale: number,
  shutter: boolean,
) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scale, scale);

  ctx.strokeStyle = COLORS.blue;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-3, -17);
  ctx.lineTo(-10, 3);
  ctx.moveTo(3, -17);
  ctx.lineTo(11, 3);
  ctx.stroke();

  ctx.fillStyle = COLORS.blue;
  ctx.beginPath();
  ctx.roundRect(-11, -39, 22, 25, 6);
  ctx.fill();
  ctx.fillStyle = '#d8aa83';
  ctx.beginPath();
  ctx.arc(0, -47, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = COLORS.blue;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-8, -34);
  ctx.lineTo(-16, -28);
  ctx.moveTo(8, -34);
  ctx.lineTo(16, -29);
  ctx.stroke();

  ctx.fillStyle = COLORS.text;
  ctx.fillRect(-12, -54, 24, 10);
  ctx.fillStyle = COLORS.blue;
  ctx.beginPath();
  ctx.arc(0, -49, 4, 0, Math.PI * 2);
  ctx.fill();

  if (shutter) {
    ctx.strokeStyle = COLORS.orange;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -49, 17, 0, Math.PI * 2);
    ctx.stroke();
    [-1, 1].forEach((direction) => {
      ctx.beginPath();
      ctx.moveTo(direction * 15, -57);
      ctx.lineTo(direction * 23, -62);
      ctx.stroke();
    });
  }
  ctx.restore();
}

function pointAlongPath(points: Array<[number, number]>, progress: number) {
  const scaled = Math.min(0.9999, Math.max(0, progress)) * (points.length - 1);
  const index = Math.floor(scaled);
  const local = scaled - index;
  const next = Math.min(points.length - 1, index + 1);
  const x = points[index][0] + (points[next][0] - points[index][0]) * local;
  const y = points[index][1] + (points[next][1] - points[index][1]) * local;
  const angle = Math.atan2(points[next][1] - points[index][1], points[next][0] - points[index][0]);
  return { x, y, angle, index };
}

function drawTravelledPath(
  ctx: CanvasRenderingContext2D,
  points: Array<[number, number]>,
  progress: number,
) {
  const current = pointAlongPath(points, progress);
  ctx.strokeStyle = COLORS.green;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let index = 1; index <= current.index; index += 1) {
    ctx.lineTo(points[index][0], points[index][1]);
  }
  ctx.lineTo(current.x, current.y);
  ctx.stroke();
  return current;
}

export const CampusWalkAnalogy: React.FC<WidgetProps> = () => {
  const draw = React.useCallback((ctx: CanvasRenderingContext2D, progress: number) => {
    const width = 520;
    const height = 300;
    clear(ctx, width, height);

    // A quiet, separate pipeline band keeps all explanatory text away from
    // the moving scene below: continuous images -> pose/depth -> map update.
    roundedRect(ctx, 12, 10, 496, 40, COLORS.white, COLORS.border, 9);
    const activeThumb = Math.min(2, Math.floor(progress * 3));
    ['I₁', 'I₂', 'Iₜ'].forEach((name, index) => {
      const x = 22 + index * 31;
      roundedRect(ctx, x, 17, 25, 25, '#eef3fb', index === activeThumb ? COLORS.orange : COLORS.blue, 4);
      label(ctx, name, x + 6, 34, index === activeThumb ? COLORS.orange : COLORS.blue, 9, 800);
    });
    arrow(ctx, 113, 30, 137, 30, COLORS.blue, 1.5);
    roundedRect(ctx, 143, 16, 106, 27, '#eef8f2', COLORS.green, 6);
    label(ctx, '位姿 + 深度', 164, 35, COLORS.green, 11, 800);
    arrow(ctx, 255, 30, 279, 30, COLORS.green, 1.5);
    roundedRect(ctx, 285, 16, 132, 27, '#f5f3ff', COLORS.purple, 6);
    label(ctx, '持续更新三维地图', 302, 35, COLORS.purple, 11, 800);
    roundedRect(ctx, 435, 16, 62, 27, '#fff7ed', COLORS.orange, 13);
    label(ctx, `t=${1 + Math.floor(progress * 99)}`, 450, 35, COLORS.orange, 10, 800);

    // Main campus view: a single photographer walks forward while repeatedly
    // capturing the same environment. Perspective supplies immediate depth.
    roundedRect(ctx, 12, 60, 324, 228, COLORS.white, COLORS.border, 10);
    ctx.save();
    ctx.beginPath();
    ctx.rect(16, 64, 316, 220);
    ctx.clip();
    ctx.fillStyle = '#eaf2f8';
    ctx.fillRect(16, 64, 316, 76);
    ctx.fillStyle = '#dce8d1';
    ctx.fillRect(16, 140, 316, 144);

    ctx.fillStyle = '#d8d3c8';
    ctx.beginPath();
    ctx.moveTo(137, 284);
    ctx.lineTo(304, 284);
    ctx.lineTo(244, 132);
    ctx.lineTo(211, 132);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([9, 10]);
    ctx.beginPath();
    ctx.moveTo(220, 284);
    ctx.lineTo(228, 133);
    ctx.stroke();
    ctx.setLineDash([]);

    drawCampusBuilding(ctx, 28, 101, 94, 91);
    drawCampusBuilding(ctx, 276, 110, 46, 76);
    drawCampusTree(ctx, 146, 184, 0.9);
    drawCampusTree(ctx, 313, 205, 0.78);
    drawCampusTree(ctx, 178, 155, 0.48);

    const personY = 257 - progress * 104;
    const personX = 221 + Math.sin(progress * Math.PI) * 7;
    const personScale = 0.55 + ((personY - 153) / 104) * 0.55;
    const cameraY = personY - 49 * personScale;
    ctx.fillStyle = 'rgba(39, 68, 110, 0.10)';
    ctx.beginPath();
    ctx.moveTo(personX, cameraY);
    ctx.lineTo(205, 133);
    ctx.lineTo(252, 133);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(39, 68, 110, 0.28)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    const shutterPhase = (progress * 5) % 1;
    drawPhotographer(ctx, personX, personY, personScale, shutterPhase < 0.13);
    ctx.restore();

    roundedRect(ctx, 24, 72, 116, 25, 'rgba(255,255,255,0.92)', COLORS.blue, 12);
    label(ctx, shutterPhase < 0.13 ? '拍照 · 记录此刻' : '沿校园持续拍摄', 35, 89, shutterPhase < 0.13 ? COLORS.orange : COLORS.blue, 10, 800);

    // The inset uses the same progress state, so pose, travelled trajectory,
    // and accumulated sparse points advance with the walking photographer.
    roundedRect(ctx, 348, 60, 160, 228, COLORS.white, COLORS.border, 10);
    label(ctx, '实时小地图', 364, 84, COLORS.text, 12, 850);
    label(ctx, '俯视', 466, 84, COLORS.muted, 9, 700);
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(360, 94);
    ctx.lineTo(496, 94);
    ctx.stroke();

    const mapPath: Array<[number, number]> = [
      [375, 246], [397, 218], [388, 186], [430, 163], [418, 128], [475, 105],
    ];
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    mapPath.forEach(([x, y], index) => (index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.stroke();
    ctx.setLineDash([]);
    const mapPose = drawTravelledPath(ctx, mapPath, progress);

    const cloudPoints: Array<[number, number, number]> = [
      [366, 235, 0.02], [383, 227, 0.08], [409, 234, 0.14], [371, 207, 0.2],
      [408, 202, 0.27], [379, 177, 0.34], [405, 173, 0.4], [441, 183, 0.47],
      [421, 147, 0.54], [448, 154, 0.6], [405, 123, 0.68], [442, 119, 0.74],
      [466, 132, 0.8], [456, 103, 0.88], [488, 115, 0.95],
    ];
    cloudPoints.forEach(([x, y, reveal], index) => {
      if (reveal > progress + 0.08) return;
      ctx.fillStyle = index % 3 === 0 ? COLORS.purple : COLORS.blue;
      ctx.beginPath();
      ctx.arc(x, y, index % 2 === 0 ? 2.5 : 2, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.save();
    ctx.translate(mapPose.x, mapPose.y);
    ctx.rotate(mapPose.angle);
    ctx.fillStyle = COLORS.orange;
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-6, -5);
    ctx.lineTo(-6, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    label(ctx, '— 轨迹', 363, 275, COLORS.green, 9, 800);
    ctx.fillStyle = COLORS.blue;
    ctx.beginPath();
    ctx.arc(424, 272, 2.5, 0, Math.PI * 2);
    ctx.fill();
    label(ctx, '稀疏点云', 432, 275, COLORS.blue, 9, 800);
  }, []);
  const ref = useAnimatedCanvas(draw, 300, 520, 4200);
  return (
    <CanvasViewport label="校园拍照建图类比，可横向滚动查看" mobileMinWidth={500}>
      <canvas
        ref={ref}
        width={520}
        height={300}
        style={{ ...canvasStyle(520), aspectRatio: '520 / 300' }}
        role="img"
        aria-label="校园连续拍摄动画：拍摄者沿透视道路前进，视锥记录建筑与树木；同一进度同步更新右侧相机轨迹和稀疏点云小地图，表达连续图像产生位姿、深度与三维地图"
      />
    </CanvasViewport>
  );
};
