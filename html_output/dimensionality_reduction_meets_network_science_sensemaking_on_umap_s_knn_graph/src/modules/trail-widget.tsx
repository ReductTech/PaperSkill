import React, { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, easeInOutQuad, lerp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0',
  terrainLight: '#b8c9a7',
  terrainDark: '#76906a',
  route: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
  white: '#ffffff',
};

type DrawFn = (ctx: CanvasRenderingContext2D, time: number) => void;
type Point = { x: number; y: number };

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r = 8
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function clearTrailScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
}

function drawTerrain(ctx: CanvasRenderingContext2D, w: number, h: number, baseline = h * 0.72) {
  ctx.fillStyle = C.terrainLight;
  ctx.beginPath();
  ctx.moveTo(0, baseline + 12);
  ctx.quadraticCurveTo(w * 0.22, baseline - 20, w * 0.42, baseline + 4);
  ctx.quadraticCurveTo(w * 0.66, baseline + 28, w, baseline - 12);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = C.terrainDark;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, baseline + 12);
  ctx.quadraticCurveTo(w * 0.22, baseline - 20, w * 0.42, baseline + 4);
  ctx.quadraticCurveTo(w * 0.66, baseline + 28, w, baseline - 12);
  ctx.stroke();
}

function drawMap(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.shadowColor = 'rgba(33,50,74,0.12)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#fbfcf8';
  roundedRect(ctx, x, y, w, h, 7);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  roundedRect(ctx, x, y, w, h, 7);
  ctx.stroke();
}

function drawTrail(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color = C.route,
  width = 3,
  dashed = false
) {
  if (points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash(dashed ? [6, 5] : []);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
  ctx.restore();
}

function drawHiker(ctx: CanvasRenderingContext2D, x: number, y: number, color = C.blue, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.3;
  ctx.beginPath();
  ctx.arc(0, -13, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(-1, 8);
  ctx.moveTo(-1, 0);
  ctx.lineTo(-8, 6);
  ctx.moveTo(-1, 1);
  ctx.lineTo(7, 5);
  ctx.moveTo(-1, 8);
  ctx.lineTo(-8, 17);
  ctx.moveTo(-1, 8);
  ctx.lineTo(7, 17);
  ctx.stroke();
  ctx.fillStyle = C.orange;
  roundedRect(ctx, -8, -8, 7, 11, 2);
  ctx.fill();
  ctx.restore();
}

function drawCompass(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, r = 20) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.rotate(angle);
  ctx.fillStyle = C.red;
  ctx.beginPath();
  ctx.moveTo(0, -r + 4);
  ctx.lineTo(5, 3);
  ctx.lineTo(0, 0);
  ctx.lineTo(-5, 3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C.blue;
  ctx.beginPath();
  ctx.moveTo(0, r - 4);
  ctx.lineTo(5, -3);
  ctx.lineTo(0, 0);
  ctx.lineTo(-5, -3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number, label?: string) {
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + 14);
  ctx.lineTo(x, y - 13);
  ctx.stroke();
  ctx.fillStyle = C.green;
  ctx.beginPath();
  ctx.moveTo(x, y - 13);
  ctx.lineTo(x + 17, y - 7);
  ctx.lineTo(x, y - 1);
  ctx.closePath();
  ctx.fill();
  if (label) drawSceneLabel(ctx, label, x - 6, y + 28, C.green, 'center');
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = C.ink,
  align: CanvasTextAlign = 'left',
  size = 13,
  weight = 600
) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function drawLegend(ctx: CanvasRenderingContext2D, items: Array<[string, string]>, x: number, y: number) {
  items.forEach(([label, color], i) => {
    const yy = y + i * 19;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, yy, 4, 0, Math.PI * 2);
    ctx.fill();
    drawSceneLabel(ctx, label, x + 10, yy, C.muted, 'left', 12, 500);
  });
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  p: Point,
  label: string,
  fill = C.white,
  stroke = C.blue,
  selected = false,
  radius = 15,
  labelColor = C.ink
) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = selected ? 4 : 2;
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  drawSceneLabel(ctx, label, p.x, p.y + 0.5, labelColor, 'center', 12, 800);
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  color = C.line,
  width = 2,
  dashed = false,
  shorten = 17
) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const endpointOffset = Math.min(shorten, Math.max(0, len / 2 - 1));
  const sx = from.x + ux * endpointOffset;
  const sy = from.y + uy * endpointOffset;
  const ex = to.x - ux * endpointOffset;
  const ey = to.y - uy * endpointOffset;
  const visibleLength = Math.hypot(ex - sx, ey - sy);
  const arrowLength = Math.min(8, Math.max(2.5, width * 2.4), visibleLength * 0.7);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dashed ? [5, 4] : []);
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.setLineDash([]);
  const angle = Math.atan2(ey - sy, ex - sx);
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - arrowLength * Math.cos(angle - 0.45), ey - arrowLength * Math.sin(angle - 0.45));
  ctx.lineTo(ex - arrowLength * Math.cos(angle + 0.45), ey - arrowLength * Math.sin(angle + 0.45));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function CanvasScene({
  width,
  height,
  draw,
  animate = false,
  onPointDown,
  onPointMove,
  onPointUp,
  ariaLabel,
}: {
  width: number;
  height: number;
  draw: DrawFn;
  animate?: boolean;
  onPointDown?: (p: Point, e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointMove?: (p: Point, e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointUp?: (p: Point, e: React.PointerEvent<HTMLCanvasElement>) => void;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, width, height);
    } catch {
      return;
    }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.maxWidth = `${width}px`;
    ctxRef.current = ctx;
    const startedAt = performance.now();
    let raf: number | null = null;
    const render = (now: number) => {
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      drawRef.current(ctx, reduced ? 1.6 : (now - startedAt) / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      if (animate && !reduced) raf = requestAnimationFrame(render);
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    if (animate) {
      const disconnect = observeCanvas(canvas, start, stop);
      return () => {
        stop();
        disconnect();
        ctxRef.current = null;
      };
    }
    render(performance.now());
    return () => {
      stop();
      ctxRef.current = null;
    };
  }, [animate, height, width]);

  useEffect(() => {
    if (!animate && ctxRef.current) drawRef.current(ctxRef.current, 0);
  }, [animate, draw]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * width,
      y: ((e.clientY - rect.top) / rect.height) * height,
    };
  };

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      aria-label={ariaLabel}
      role="img"
      onPointerDown={onPointDown ? (e) => onPointDown(point(e), e) : undefined}
      onPointerMove={onPointMove ? (e) => onPointMove(point(e), e) : undefined}
      onPointerUp={onPointUp ? (e) => onPointUp(point(e), e) : undefined}
      onPointerCancel={onPointUp ? (e) => onPointUp(point(e), e) : undefined}
    />
  );
}

function chapterNumber(chapterId: string) {
  const match = /chap-(\d+)/.exec(chapterId);
  return match ? Number(match[1]) : 0;
}

function AnalogyScene({ chapterId }: { chapterId: string }) {
  const chapter = chapterNumber(chapterId);
  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    const phase = (time % 3.2) / 3.2;
    const t = easeInOutQuad(phase < 0.82 ? phase / 0.82 : 1);
    clearTrailScene(ctx, 244, 130);
    if (chapter !== 6) drawTerrain(ctx, 244, 130, 91);
    if (chapter === 1) {
      ctx.fillStyle = '#829083';
      ctx.beginPath();
      ctx.moveTo(87, 18);
      ctx.quadraticCurveTo(147, 4, 209, 20);
      ctx.quadraticCurveTo(235, 49, 222, 102);
      ctx.lineTo(89, 102);
      ctx.quadraticCurveTo(73, 63, 87, 18);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#59675d';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const tunnel = [{ x: 216, y: 84 }, { x: 184, y: 84 }, { x: 176, y: 52 }, { x: 112, y: 52 }];
      drawTrail(ctx, tunnel, '#34423b', 23);
      drawTrail(ctx, tunnel, '#516159', 2);
      drawSceneLabel(ctx, '洞口', 216, 67, C.white, 'center', 10, 750);
      drawTarget(ctx, 112, 50);

      const start = { x: 69, y: 69 };
      drawTrail(ctx, [start, { x: 107, y: 52 }], C.red, 2, true);
      drawSceneLabel(ctx, '看着很近', 48, 43, C.red, 'center', 10, 750);

      const route = [start, { x: 48, y: 108 }, { x: 222, y: 108 }, ...tunnel];
      drawTrail(ctx, route, C.green, 3);
      const scaled = t * (route.length - 1);
      const segment = Math.min(route.length - 2, Math.floor(scaled));
      const local = scaled - segment;
      const player = {
        x: lerp(route[segment].x, route[segment + 1].x, local),
        y: lerp(route[segment].y, route[segment + 1].y, local),
      };
      drawHiker(ctx, player.x, player.y, C.blue, 0.48);
      drawSceneLabel(ctx, '实际路线很远', 121, 119, C.green, 'center', 11, 800);
    } else if (chapter === 2) {
      drawMap(ctx, 18, 17, 208, 91);
      const source = { x: 71, y: 65 };
      const neighbors = [{ x: 128, y: 37 }, { x: 164, y: 64 }, { x: 126, y: 91 }];
      const background = [{ x: 39, y: 37 }, { x: 43, y: 91 }, { x: 197, y: 36 }, { x: 201, y: 91 }];
      background.forEach((p) => {
        ctx.fillStyle = C.line;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      });
      neighbors.forEach((p, i) => {
        drawArrow(ctx, source, p, i < Math.ceil(t * 3) ? C.blue : C.line, 1.4 + (2 - i) * 0.65, false, 7);
        ctx.fillStyle = i < Math.ceil(t * 3) ? C.green : C.white;
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(source.x, source.y, 8, 0, Math.PI * 2);
      ctx.fill();
      drawSceneLabel(ctx, '样本', source.x, source.y - 16, C.orange, 'center', 9, 800);
      drawSceneLabel(ctx, '每个样本指向 k 个近邻', 122, 118, C.blue, 'center', 11, 750);
    } else if (chapter === 3) {
      drawMap(ctx, 25, 21, 150, 84);
      drawCompass(ctx, 202, 62, t * Math.PI * 1.4, 27);
      ['代表', '核心', '邻域'].forEach((label, i) => {
        const a = -Math.PI / 2 + (i - 1) * 1.2;
        drawSceneLabel(ctx, label, 202 + Math.cos(a) * 42, 62 + Math.sin(a) * 42, C.muted, 'center', 10, 700);
      });
      drawSceneLabel(ctx, '三个问题 · 三种读法', 100, 116, C.blue, 'center', 11, 700);
    } else if (chapter === 4) {
      drawMap(ctx, 24, 19, 176, 90);
      drawTrail(ctx, [{ x: 41, y: 90 }, { x: 87, y: 58 }, { x: 147, y: 69 }, { x: 186, y: 40 }], C.blue, 3);
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(110, 63, 30, -Math.PI * 0.9 + t, Math.PI * 0.9 + t);
      ctx.stroke();
      drawTarget(ctx, 188, 40);
      drawSceneLabel(ctx, '复用 UMAP 中间数组', 112, 116, C.blue, 'center', 11, 700);
    } else if (chapter === 5) {
      drawMap(ctx, 24, 18, 180, 91);
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(111, 62, 14 + 29 * t, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.arc(111, 62, 5, 0, Math.PI * 2);
      ctx.fill();
      drawSceneLabel(ctx, `检查邻域尺度 k = ${Math.round(5 + 95 * t)}`, 116, 116, C.orange, 'center', 11, 700);
    } else if (chapter === 6) {
      drawHeroPanel(ctx, 4, 17, 108, 98, C.blue, 1.8);
      drawHeroPanel(ctx, 132, 17, 108, 98, C.green, 1.8);
      drawSceneLabel(ctx, '二维图', 58, 29, C.blue, 'center', 10, 850);
      drawSceneLabel(ctx, 'kNN graph', 186, 29, C.green, 'center', 10, 850);
      drawHeroEmbedding(ctx, 14, 38, 88, 55);
      drawHeroKnnGraph(ctx, 142, 38, 88, 55, 0);
      drawSceneLabel(ctx, '位置与簇', 58, 105, C.blue, 'center', 9, 750);
      drawSceneLabel(ctx, '方向与连接', 186, 105, C.green, 'center', 9, 750);
      drawSceneLabel(ctx, '+', 122, 67, C.orange, 'center', 17, 900);
    } else {
      drawTrail(ctx, [{ x: 18, y: 96 }, { x: 220, y: 96 }], C.route, 4);
      drawTarget(ctx, 212, 74, '同协议');
      drawHiker(ctx, lerp(28, 204, t), 81, C.green, 0.72);
      drawSceneLabel(ctx, '看清计时规则', 110, 116, C.blue, 'center', 12, 700);
    }
  };
  const analogyLabels: Record<number, string> = {
    1: '游戏跑图类比：目标在山洞里，玩家在洞外，地图上很近但实际路线很远',
    2: '每个地标选择三个近邻的动画',
    3: '分别观察代表性、核心层级与局部凝聚的动画',
    4: '复用 UMAP 中间数组进行图分析的动画',
    5: '比较论文报告的三组实验结果',
    6: '二维布局与 kNN graph 提供互补信息的并列示意',
  };
  const ariaLabel = analogyLabels[chapter] ?? `第 ${chapter} 章类比动画`;
  return <CanvasScene width={244} height={130} draw={draw} animate={chapter !== 6} ariaLabel={ariaLabel} />;
}

function drawHeroPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  stroke: string,
  lineWidth = 1
) {
  ctx.fillStyle = C.white;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  roundedRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
}

type HeroNode = Point & { group: number };

function nearestNodeIndices(nodes: HeroNode[], from: number, k: number) {
  return nodes
    .map((node, to) => ({ to, distance: Math.hypot(nodes[from].x - node.x, nodes[from].y - node.y) }))
    .filter(({ to }) => to !== from)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, k);
}

const highDimCenters = [
  { x: 0.31, y: 0.28, rx: 0.28, ry: 0.22 },
  { x: 0.59, y: 0.25, rx: 0.3, ry: 0.2 },
  { x: 0.32, y: 0.61, rx: 0.3, ry: 0.24 },
  { x: 0.62, y: 0.63, rx: 0.31, ry: 0.24 },
  { x: 0.5, y: 0.45, rx: 0.25, ry: 0.31 },
];

const highDimReferenceNodes: HeroNode[] = Array.from({ length: 90 }, (_, index) => {
  const group = index % highDimCenters.length;
  const rank = Math.floor(index / highDimCenters.length);
  const center = highDimCenters[group];
  const angle = rank * 2.399 + group * 1.17;
  const radius = Math.sqrt((rank + 1) / 19);
  return {
    x: clamp(center.x + Math.cos(angle) * center.rx * radius + Math.sin(index * 1.9) * 0.012, 0.025, 0.975),
    y: clamp(center.y + Math.sin(angle) * center.ry * radius + Math.cos(index * 1.37) * 0.012, 0.035, 0.965),
    group,
  };
});

const highDimReferenceEdges = (() => {
  const seen = new Set<string>();
  return highDimReferenceNodes.flatMap((_, from) => nearestNodeIndices(highDimReferenceNodes, from, 6)
    .filter(({ to }) => {
      const key = [from, to].sort((a, b) => a - b).join('-');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(({ to, distance }) => ({ from, to, distance })));
})();

function drawHeroHighDim(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  time: number
) {
  const nodes = highDimReferenceNodes.map((node) => ({ x: x + node.x * w, y: y + node.y * h }));
  highDimReferenceEdges.forEach(({ from, to, distance }) => {
    ctx.save();
    ctx.strokeStyle = '#8c97a7';
    ctx.globalAlpha = Math.max(0.06, 0.2 - distance * 0.52);
    ctx.lineWidth = 0.65;
    ctx.beginPath();
    ctx.moveTo(nodes[from].x, nodes[from].y);
    ctx.lineTo(nodes[to].x, nodes[to].y);
    ctx.stroke();
    ctx.restore();
  });
  nodes.forEach((node, index) => {
    ctx.fillStyle = '#d91f2a';
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.arc(node.x, node.y, 1.7 + Math.sin(time * 1.2 + index) * 0.12, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

const heroGraphCenters = [
  { x: 0.2, y: 0.38, rx: 0.15, ry: 0.25 },
  { x: 0.45, y: 0.23, rx: 0.18, ry: 0.16 },
  { x: 0.74, y: 0.43, rx: 0.18, ry: 0.25 },
  { x: 0.46, y: 0.72, rx: 0.2, ry: 0.16 },
];

const heroGraphNodes: HeroNode[] = Array.from({ length: 32 }, (_, index) => {
  const group = index % heroGraphCenters.length;
  const rank = Math.floor(index / heroGraphCenters.length);
  const center = heroGraphCenters[group];
  const angle = rank * 2.399 + group * 0.9;
  const radius = Math.sqrt((rank + 1) / 9);
  return {
    x: center.x + Math.cos(angle) * center.rx * radius,
    y: center.y + Math.sin(angle) * center.ry * radius,
    group,
  };
});

const heroKnnEdges = heroGraphNodes.flatMap((_, from) =>
  nearestNodeIndices(heroGraphNodes, from, 3).map(({ to, distance }) => ({ from, to, distance }))
);

function drawHeroKnnGraph(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  time: number,
  alpha = 1
) {
  const colors = [C.blue, C.orange, C.green, C.purple];
  const nodes = heroGraphNodes.map((node) => ({
    x: x + node.x * w,
    y: y + node.y * h,
    group: node.group,
  }));
  const nodeRadius = clamp(w / 96, 1.5, 2.65);
  const arrowSize = clamp(w / 125, 1.25, 2.1);

  heroKnnEdges.forEach(({ from, to, distance }) => {
    const source = nodes[from];
    const target = nodes[to];
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const length = Math.hypot(dx, dy) || 1;
    const ux = dx / length;
    const uy = dy / length;
    const end = { x: target.x - ux * (nodeRadius + 1.1), y: target.y - uy * (nodeRadius + 1.1) };
    const edgeColor = colors[source.group];
    ctx.save();
    ctx.strokeStyle = edgeColor;
    ctx.fillStyle = edgeColor;
    ctx.globalAlpha = alpha * Math.max(0.16, 0.34 - distance * 0.25);
    ctx.lineWidth = clamp(w / 210, 0.65, 1.15);
    ctx.beginPath();
    ctx.moveTo(source.x + ux * (nodeRadius + 0.7), source.y + uy * (nodeRadius + 0.7));
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - ux * arrowSize - uy * arrowSize * 0.72, end.y - uy * arrowSize + ux * arrowSize * 0.72);
    ctx.lineTo(end.x - ux * arrowSize + uy * arrowSize * 0.72, end.y - uy * arrowSize - ux * arrowSize * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  heroKnnEdges.forEach(({ from, to }, index) => {
    if (index % 9 !== 0) return;
    const source = nodes[from];
    const target = nodes[to];
    const progress = (time * 0.42 + index * 0.083) % 1;
    ctx.globalAlpha = alpha * (0.35 + Math.sin(progress * Math.PI) * 0.5);
    ctx.fillStyle = colors[source.group];
    ctx.beginPath();
    ctx.arc(lerp(source.x, target.x, progress), lerp(source.y, target.y, progress), clamp(w / 105, 0.9, 1.9), 0, Math.PI * 2);
    ctx.fill();
  });

  nodes.forEach((node) => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = colors[node.group];
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
}

function drawHeroEmbedding(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha = 1
) {
  const colors = [C.blue, C.orange, C.green, C.purple];
  const clusters = [
    { cx: 0.18, cy: 0.46, rx: 0.14, ry: 0.33, rotation: -0.22 },
    { cx: 0.53, cy: 0.22, rx: 0.25, ry: 0.12, rotation: 0.12 },
    { cx: 0.79, cy: 0.55, rx: 0.14, ry: 0.29, rotation: 0.24 },
    { cx: 0.46, cy: 0.75, rx: 0.24, ry: 0.12, rotation: -0.16 },
  ];
  const pointRadius = clamp(w / 96, 1.15, 2.15);

  clusters.forEach((cluster, group) => {
    Array.from({ length: 30 }, (_, index) => {
      const angle = index * 2.399 + group * 0.72;
      const radius = Math.sqrt((index + 1) / 31);
      const irregularity = 0.76 + Math.sin(angle * 3 + group) * 0.16 + Math.cos(index * 1.7) * 0.08;
      const localX = Math.cos(angle) * cluster.rx * radius * irregularity;
      const localY = Math.sin(angle) * cluster.ry * radius * (0.88 + Math.sin(angle * 2.2) * 0.12);
      const rotatedX = localX * Math.cos(cluster.rotation) - localY * Math.sin(cluster.rotation);
      const rotatedY = localX * Math.sin(cluster.rotation) + localY * Math.cos(cluster.rotation);
      return {
        x: x + (cluster.cx + rotatedX + Math.sin(rotatedY * 18 + group) * 0.012) * w,
        y: y + (cluster.cy + rotatedY) * h,
        representative: index === 4,
      };
    }).forEach((point) => {
      if (point.representative) {
        ctx.strokeStyle = colors[group];
        ctx.globalAlpha = alpha * 0.5;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(point.x, point.y, pointRadius + 2.4, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = alpha * (point.representative ? 1 : 0.76);
      ctx.fillStyle = colors[group];
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.representative ? pointRadius + 0.55 : pointRadius, 0, Math.PI * 2);
      ctx.fill();
    });
  });
  ctx.globalAlpha = 1;
}

function drawHeroProcessArrow(ctx: CanvasRenderingContext2D, from: Point, to: Point) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const headLength = Math.min(15, length * 0.3);
  const headHalfWidth = 7.5;
  const baseX = to.x - ux * headLength;
  const baseY = to.y - uy * headLength;
  ctx.save();
  ctx.strokeStyle = C.muted;
  ctx.fillStyle = C.muted;
  ctx.lineWidth = 4.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(from.x + ux * 2, from.y + uy * 2);
  ctx.lineTo(baseX + ux * 1.5, baseY + uy * 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(baseX - uy * headHalfWidth, baseY + ux * headHalfWidth);
  ctx.lineTo(baseX + uy * headHalfWidth, baseY - ux * headHalfWidth);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function HeroFlowScene() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 600px)');
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    const phase = (time % 5) / 5;
    if (compact) {
      clearTrailScene(ctx, 340, 785);
      const cardYs = [12, 286, 560];
      drawHeroPanel(ctx, 20, cardYs[0], 300, 212, C.line);
      drawHeroPanel(ctx, 20, cardYs[1], 300, 212, C.green, 2.5);
      drawHeroPanel(ctx, 20, cardYs[2], 300, 212, C.blue, 2.5);

      drawSceneLabel(ctx, '高维特征空间', 170, 35, C.ink, 'center', 15, 800);
      drawHeroHighDim(ctx, 42, 53, 256, 137, time);
      drawSceneLabel(ctx, '高维关系示意 · x ∈ ℝ^d', 170, 210, C.muted, 'center', 10, 650);

      drawSceneLabel(ctx, '距离计算', 144, 254, C.muted, 'right', 9, 700);
      drawSceneLabel(ctx, '局部归一化', 196, 254, C.muted, 'left', 9, 700);
      drawHeroProcessArrow(ctx, { x: 170, y: 232 }, { x: 170, y: 278 });

      drawSceneLabel(ctx, '① 构建 kNN graph', 170, 309, C.green, 'center', 15, 800);
      drawHeroKnnGraph(ctx, 46, 332, 248, 126, time);
      drawSceneLabel(ctx, '示意 k=3 · 实验采用 k=15', 170, 484, C.green, 'center', 11, 700);

      drawSceneLabel(ctx, '模糊集合', 144, 528, C.muted, 'right', 9, 700);
      drawSceneLabel(ctx, '交叉熵优化', 196, 528, C.muted, 'left', 9, 700);
      drawHeroProcessArrow(ctx, { x: 170, y: 506 }, { x: 170, y: 552 });

      drawSceneLabel(ctx, '② 优化二维布局', 170, 583, C.blue, 'center', 15, 800);
      drawHeroEmbedding(ctx, 50, 607, 240, 128);
      drawSceneLabel(ctx, '模拟 UMAP 二维结果', 170, 758, C.blue, 'center', 11, 700);

      const movingFirst = phase < 0.42;
      const movingSecond = phase > 0.58;
      if (movingFirst || movingSecond) {
        const local = movingFirst ? phase / 0.42 : (phase - 0.58) / 0.42;
        const startY = movingFirst ? 233 : 507;
        const endY = movingFirst ? 277 : 551;
        ctx.fillStyle = C.orange;
        ctx.beginPath();
        ctx.arc(170, lerp(startY, endY, easeInOutQuad(local)), 5, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    clearTrailScene(ctx, 800, 250);

    drawHeroPanel(ctx, 10, 16, 185, 218, C.line);
    drawHeroPanel(ctx, 276, 16, 248, 218, C.green, 2.5);
    drawHeroPanel(ctx, 615, 16, 175, 218, C.blue, 2.5);

    drawSceneLabel(ctx, '高维特征空间', 103, 40, C.ink, 'center', 15, 800);
    drawHeroHighDim(ctx, 23, 57, 160, 132, time);
    drawSceneLabel(ctx, '高维关系示意 · x ∈ ℝ^d', 103, 218, C.muted, 'center', 9, 650);

    drawSceneLabel(ctx, '距离计算', 235, 94, C.muted, 'center', 9, 700);
    drawSceneLabel(ctx, '局部归一化', 235, 157, C.muted, 'center', 9, 700);
    drawHeroProcessArrow(ctx, { x: 205, y: 125 }, { x: 266, y: 125 });

    drawSceneLabel(ctx, '① 构建 kNN graph', 400, 40, C.green, 'center', 15, 800);
    drawHeroKnnGraph(ctx, 292, 58, 216, 132, time);
    drawSceneLabel(ctx, '示意 k=3 · 实验 k=15', 400, 218, C.green, 'center', 10, 700);

    drawSceneLabel(ctx, '模糊集合', 570, 94, C.muted, 'center', 9, 700);
    drawSceneLabel(ctx, '交叉熵优化', 570, 157, C.muted, 'center', 9, 700);
    drawHeroProcessArrow(ctx, { x: 534, y: 125 }, { x: 605, y: 125 });

    drawSceneLabel(ctx, '② 优化二维布局', 703, 40, C.blue, 'center', 15, 800);
    drawHeroEmbedding(ctx, 628, 59, 150, 132);
    drawSceneLabel(ctx, '模拟 UMAP 二维结果', 703, 218, C.blue, 'center', 10, 700);
    const movingFirst = phase < 0.42;
    const movingSecond = phase > 0.58;
    if (movingFirst || movingSecond) {
      const local = movingFirst ? phase / 0.42 : (phase - 0.58) / 0.42;
      const startX = movingFirst ? 206 : 535;
      const endX = movingFirst ? 265 : 604;
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(lerp(startX, endX, easeInOutQuad(local)), 125, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  return <CanvasScene width={compact ? 340 : 800} height={compact ? 785 : 250} draw={draw} animate ariaLabel="UMAP 从高维距离关系出发，经过局部归一化构建 kNN graph，再用模糊集合和交叉熵生成二维布局" />;
}

function HeroScene({ side }: { side: 'old' | 'new' }) {
  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    const old = side === 'old';
    const activeColor = old ? C.red : C.green;
    const scan = Math.sin(time * 2.2) * 5;
    clearTrailScene(ctx, 420, 220);

    drawHeroPanel(ctx, 20, 22, 150, 118, old ? C.line : C.green, old ? 1 : 2.5);
    drawHeroPanel(ctx, 250, 22, 150, 118, old ? C.red : C.line, old ? 2.5 : 1);
    drawSceneLabel(ctx, 'kNN graph', 95, 43, old ? C.muted : C.green, 'center', 13, 800);
    drawSceneLabel(ctx, '二维布局', 325, 43, old ? C.red : C.muted, 'center', 13, 800);

    drawHeroKnnGraph(ctx, 34, 54, 122, 76, time, old ? 0.3 : 1);
    drawHeroEmbedding(ctx, 264, 54, 122, 76, old ? 1 : 0.36);
    drawArrow(ctx, { x: 181, y: 82 }, { x: 239, y: 82 }, C.line, 2, false, 5);

    const focusX = (old ? 325 : 95) + scan;
    const focusY = 88;
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(focusX, focusY, 27, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(focusX + 19, focusY + 20);
    ctx.lineTo(focusX + 36, focusY + 37);
    ctx.stroke();

    ctx.fillStyle = old ? 'rgba(196,63,82,0.08)' : 'rgba(34,141,92,0.09)';
    roundedRect(ctx, 20, 156, 380, 46, 7);
    ctx.fill();
    drawSceneLabel(ctx, old ? '分析二维坐标、距离与簇形状' : '分析代表性、核心层级与局部凝聚', 210, 174, activeColor, 'center', 13, 800);
    drawSceneLabel(ctx, old ? 'kNN graph 不进入后续分析' : 'PageRank · in-degree k-core · clustering coefficient', 210, 191, C.muted, 'center', 8, 650);
  };
  return <CanvasScene width={420} height={220} draw={draw} animate ariaLabel={side === 'old' ? '传统方法分析 UMAP 二维布局' : '本文方法分析 UMAP 的 kNN graph'} />;
}

function Feedback({ text, tone = 'neutral' }: { text: string; tone?: 'neutral' | 'good' | 'bad' }) {
  return <div className={`feedback ${tone === 'neutral' ? '' : tone}`}>{text}</div>;
}

function DistortionModule() {
  const [distortion, setDistortion] = useState(20);
  const [viewMode, setViewMode] = useState<'layout' | 'graph'>('layout');
  const draw = (ctx: CanvasRenderingContext2D) => {
    clearTrailScene(ctx, 560, 250);
    const panels = [{ x: 18, title: '原始高维邻域' }, { x: 292, title: '二维布局' }];
    panels.forEach((panel) => {
      ctx.fillStyle = C.white;
      roundedRect(ctx, panel.x, 20, 250, 206, 8);
      ctx.fill();
      ctx.strokeStyle = C.line;
      ctx.stroke();
      drawSceneLabel(ctx, panel.title, panel.x + 125, 40, C.ink, 'center', 13, 800);
    });
    const drawCluster = (cx: number, cy: number, radius: number, dense: boolean, panelX: number, overlay: boolean) => {
      const count = dense ? 12 : 7;
      const angles = Array.from({ length: count }, (_, i) => (i / count) * Math.PI * 2 + (dense ? 0.2 : 0));
      const pts = angles.map((a, i) => ({
        x: panelX + cx + Math.cos(a) * radius * (0.55 + (i % 3) * 0.2),
        y: cy + Math.sin(a) * radius * (0.55 + ((i + 1) % 3) * 0.17),
      }));
      if (overlay) {
        for (let i = 0; i < pts.length; i += 1) {
          drawArrow(
            ctx,
            pts[i],
            pts[(i + 1) % pts.length],
            dense ? C.green : C.muted,
            dense ? 2.2 : 1.2,
            !dense,
            5
          );
        }
      }
      pts.forEach((p) => {
        ctx.fillStyle = dense ? C.blue : C.orange;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.4, 0, Math.PI * 2);
        ctx.fill();
      });
    };
    drawCluster(68, 126, 48, false, 18, false);
    drawCluster(183, 126, 27, true, 18, false);
    const blend = distortion / 100;
    const sparseR = lerp(48, 34, blend);
    const denseR = lerp(27, 34, blend);
    drawCluster(68, 126, sparseR, false, 292, viewMode === 'graph');
    drawCluster(183, 126, denseR, true, 292, viewMode === 'graph');
    drawSceneLabel(ctx, '稀疏', 86, 204, C.orange, 'center', 12, 700);
    drawSceneLabel(ctx, '稠密', 201, 204, C.blue, 'center', 12, 700);
    drawSceneLabel(ctx, viewMode === 'graph' ? '边揭示邻域差异' : '外形逐渐趋同', 417, 204, viewMode === 'graph' ? C.green : C.red, 'center', 12, 700);
  };
  const bad = viewMode === 'layout' && distortion > 65;
  const feedback = viewMode === 'graph'
    ? '保留投影前的边，原始邻域差异重新可查。'
    : bad
      ? '二维外形已经把密度差异压平，单看点云会误判。'
      : distortion >= 25
        ? '部分结构仍可见，但二维距离已不能直接当作高维距离。'
        : '低压平时，二维距离还保留了一部分密度差异。';
  return (
    <div>
      <CanvasScene width={560} height={250} draw={draw} ariaLabel="投影失真与 kNN 图对比" />
      <div className="ctrl">
        <label>投影压平程度 <span className="val">{distortion}%</span></label>
        <input aria-label="投影压平程度" type="range" min={0} max={100} value={distortion} onChange={(e) => setDistortion(Number(e.target.value))} />
      </div>
      <div className="chip-row">
        {([['layout', '仅看二维'], ['graph', '保留 kNN 图']] as const).map(([value, label]) => (
          <button key={value} className={`chip ${viewMode === value ? 'selected' : ''}`} aria-pressed={viewMode === value} onClick={() => setViewMode(value)}>{label}</button>
        ))}
      </div>
      <Feedback text={feedback} tone={viewMode === 'graph' ? 'good' : bad ? 'bad' : 'neutral'} />
    </div>
  );
}

function CompareModule() {
  const [runId, setRunId] = useState(0);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = clamp((now - start) / 1800, 0, 1);
      setProgress(easeInOutQuad(p));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setRunning(false);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [runId, running]);
  const draw = (ctx: CanvasRenderingContext2D) => {
    clearTrailScene(ctx, 560, 240);
    [{ x: 18, label: '只看二维位置', color: C.red }, { x: 288, label: '读取 kNN graph', color: C.green }].forEach((panel, index) => {
      ctx.fillStyle = C.white;
      roundedRect(ctx, panel.x, 14, 254, 212, 8);
      ctx.fill();
      ctx.strokeStyle = panel.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      drawSceneLabel(ctx, panel.label, panel.x + 127, 32, panel.color, 'center', 13, 800);

      ctx.fillStyle = '#829083';
      ctx.beginPath();
      ctx.moveTo(panel.x + 96, 52);
      ctx.quadraticCurveTo(panel.x + 155, 39, panel.x + 221, 54);
      ctx.quadraticCurveTo(panel.x + 243, 91, panel.x + 229, 165);
      ctx.lineTo(panel.x + 96, 165);
      ctx.quadraticCurveTo(panel.x + 79, 105, panel.x + 96, 52);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#59675d';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      const tunnel = [
        { x: panel.x + 228, y: 139 },
        { x: panel.x + 196, y: 139 },
        { x: panel.x + 185, y: 83 },
        { x: panel.x + 120, y: 83 },
      ];
      drawTrail(ctx, tunnel, '#34423b', 22);
      drawTrail(ctx, tunnel, '#516159', 2);
      drawSceneLabel(ctx, '洞口', panel.x + 224, 122, C.white, 'center', 9, 750);
      drawTarget(ctx, panel.x + 120, 81);

      const startPoint = { x: panel.x + 76, y: 93 };
      const route = [
        startPoint,
        { x: panel.x + 56, y: 176 },
        { x: panel.x + 229, y: 176 },
        ...tunnel,
      ];
      if (index === 1) {
        drawTrail(ctx, route, C.green, 2.5);
        route.slice(0, -1).forEach((point, routeIndex) => {
          drawArrow(ctx, point, route[routeIndex + 1], C.green, 1.8, false, 4);
        });
        route.slice(1).forEach((point) => {
          ctx.fillStyle = C.white;
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
        const scaled = progress * (route.length - 1);
        const segment = Math.min(route.length - 2, Math.floor(scaled));
        const local = scaled - segment;
        drawHiker(
          ctx,
          lerp(route[segment].x, route[segment + 1].x, local),
          lerp(route[segment].y, route[segment + 1].y, local),
          C.blue,
          0.45
        );
      } else {
        drawTrail(ctx, [startPoint, { x: panel.x + 120, y: 83 }], C.red, 2, true);
        const stop = Math.min(1, progress * 1.7);
        drawHiker(ctx, lerp(startPoint.x, panel.x + 89, stop), lerp(startPoint.y, 89, stop), C.blue, 0.45);
        if (progress > 0.25) {
          ctx.strokeStyle = C.red;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(panel.x + 91, 82);
          ctx.lineTo(panel.x + 99, 90);
          ctx.moveTo(panel.x + 99, 82);
          ctx.lineTo(panel.x + 91, 90);
          ctx.stroke();
        }
      }
      const status = progress >= 1
        ? (index === 0 ? '很近，但不知道怎么走' : '沿节点连接到达目标')
        : (index === 0 ? '只知道目标位置' : '节点连接给出路线');
      drawSceneLabel(ctx, status, panel.x + 127, 211, panel.color, 'center', 11, 750);
    });
  };
  const start = () => {
    setProgress(0);
    setRunId((v) => v + 1);
    setRunning(true);
  };
  return (
    <div>
      <CanvasScene width={560} height={240} draw={draw} ariaLabel="游戏跑图对比：只看二维位置会被山壁挡住，读取 kNN graph 的节点连接可以找到绕行路线" />
      <div className="step-ctrl">
        <button className="tiny" onClick={start} disabled={running}>{running ? '跑图中…' : progress > 0 ? '再次跑图' : '开始跑图'}</button>
      </div>
      <Feedback text={progress >= 1 ? '左边只知道“目标很近”，却被山壁挡住；右边沿 kNN graph 的节点连接绕到洞口，找到可行路线。' : '两边的玩家与目标位置完全相同，区别在于是否读取节点之间的连接。'} tone={progress >= 1 ? 'good' : 'neutral'} />
    </div>
  );
}

const graphIntroNodes: Record<string, Point> = {
  A: { x: 88, y: 74 }, B: { x: 210, y: 52 }, C: { x: 342, y: 78 }, D: { x: 118, y: 177 }, E: { x: 262, y: 186 }, F: { x: 386, y: 168 },
};
const graphIntroEdges: Array<{ from: string; to: string; weight: number }> = [
  { from: 'A', to: 'B', weight: 0.91 }, { from: 'A', to: 'C', weight: 0.68 }, { from: 'A', to: 'D', weight: 0.44 },
  { from: 'B', to: 'A', weight: 0.82 }, { from: 'B', to: 'C', weight: 0.76 }, { from: 'B', to: 'E', weight: 0.43 },
  { from: 'C', to: 'B', weight: 0.88 }, { from: 'C', to: 'D', weight: 0.72 }, { from: 'C', to: 'E', weight: 0.61 },
  { from: 'D', to: 'A', weight: 0.77 }, { from: 'D', to: 'C', weight: 0.69 }, { from: 'D', to: 'F', weight: 0.41 },
  { from: 'E', to: 'B', weight: 0.58 }, { from: 'E', to: 'C', weight: 0.84 }, { from: 'E', to: 'F', weight: 0.73 },
  { from: 'F', to: 'C', weight: 0.62 }, { from: 'F', to: 'D', weight: 0.79 }, { from: 'F', to: 'E', weight: 0.86 },
];

type GraphPart = 'nodes' | 'direction' | 'neighbors' | 'weight';
const graphPartLabels: Record<GraphPart, string> = {
  nodes: '节点', direction: '方向', neighbors: 'k 个出邻居', weight: '边权',
};

function GraphAnatomyModule() {
  const [part, setPart] = useState<GraphPart>('nodes');
  const activeEdges = graphIntroEdges.filter((edge) => edge.from === 'A');
  const draw = (ctx: CanvasRenderingContext2D) => {
    clearTrailScene(ctx, 560, 265);
    ctx.fillStyle = C.white; roundedRect(ctx, 18, 18, 416, 225, 8); ctx.fill(); ctx.strokeStyle = C.line; ctx.stroke();
    ctx.fillStyle = C.white; roundedRect(ctx, 448, 18, 94, 225, 8); ctx.fill(); ctx.strokeStyle = C.line; ctx.stroke();
    drawSceneLabel(ctx, '图中位置仅用于排版', 32, 36, C.muted, 'left', 10, 600);

    const drawGraphEdge = (edge: typeof graphIntroEdges[number]) => {
      const isActive = edge.from === 'A';
      const visible = part === 'nodes' ? false : part === 'direction' ? edge.to === 'B' && isActive : isActive;
      const color = visible ? (part === 'weight' ? C.purple : C.blue) : C.line;
      const width = visible && part === 'weight' ? 1 + edge.weight * 4 : visible ? 2.6 : 0.7;
      drawArrow(ctx, graphIntroNodes[edge.from], graphIntroNodes[edge.to], color, width, false, 17);
      if (visible && part === 'weight') {
        const from = graphIntroNodes[edge.from];
        const to = graphIntroNodes[edge.to];
        drawSceneLabel(ctx, edge.weight.toFixed(2), lerp(from.x, to.x, 0.58), lerp(from.y, to.y, 0.58) - 8, C.purple, 'center', 10, 800);
      }
    };
    // Draw inactive edges first. The selected A -> target arrows are always
    // the final edge layer, so gray connections cannot cover their arrowheads.
    graphIntroEdges.filter((edge) => edge.from !== 'A').forEach(drawGraphEdge);
    graphIntroEdges.filter((edge) => edge.from === 'A').forEach(drawGraphEdge);

    Object.entries(graphIntroNodes).forEach(([id, point]) => {
      const selected = id === 'A';
      drawNode(ctx, point, id, C.white, selected ? C.orange : part === 'nodes' ? C.blue : C.muted, selected, 14);
    });

    const rows: Array<[GraphPart, string, string]> = [
      ['nodes', '节点', '高维样本'], ['direction', '方向', 'A → B'],
      ['neighbors', '出邻居', '每点 k = 3'], ['weight', '边权', '0 到 1'],
    ];
    rows.forEach(([key, label, value], index) => {
      const y = 49 + index * 48;
      const active = key === part;
      if (active) {
        ctx.fillStyle = '#eef6f1';
        roundedRect(ctx, 456, y - 16, 78, 39, 6);
        ctx.fill();
      }
      drawSceneLabel(ctx, label, 495, y - 3, active ? C.green : C.muted, 'center', 10, 700);
      drawSceneLabel(ctx, value, 495, y + 13, active ? C.ink : C.muted, 'center', 10, active ? 800 : 600);
    });
  };
  const feedback: Record<GraphPart, string> = {
    nodes: '每个节点代表一个原始高维样本；这里画出的节点位置只是图的排版，不是二维投影结果。',
    direction: 'A → B 表示 B 是 A 的近邻。方向不能省略：A 选择 B，不代表 B 一定选择 A。',
    neighbors: '示例取 k=3，所以每个节点发出 3 条边；一个节点能收到多少条边则不固定。',
    weight: '边权表示 UMAP 的近邻隶属强度。后续 PageRank 使用边权，另外两种方法主要读取无权连接结构。',
  };
  return (
    <div>
      <CanvasScene width={560} height={265} draw={draw} ariaLabel="依次查看 kNN graph 的节点、方向、出邻居数量和边权" />
      <div className="chip-row">
        {(Object.keys(graphPartLabels) as GraphPart[]).map((key) => (
          <button key={key} className={`chip ${part === key ? 'selected' : ''}`} aria-pressed={part === key} onClick={() => setPart(key)}>{graphPartLabels[key]}</button>
        ))}
      </div>
      <Feedback text={feedback[part]} tone={part === 'weight' ? 'good' : 'neutral'} />
    </div>
  );
}

type ImportanceView = 'indegree' | 'sources';

function InDegreeImportanceModule() {
  const [view, setView] = useState<ImportanceView>('indegree');
  const draw = (ctx: CanvasRenderingContext2D) => {
    clearTrailScene(ctx, 560, 270);
    const panels = [
      { x: 18, target: { x: 144, y: 190 }, sources: [{ x: 66, y: 108 }, { x: 144, y: 96 }, { x: 222, y: 108 }], label: '候选节点 X' },
      { x: 290, target: { x: 416, y: 190 }, sources: [{ x: 338, y: 108 }, { x: 416, y: 96 }, { x: 494, y: 108 }], label: '候选节点 Y' },
    ];

    panels.forEach((panel, panelIndex) => {
      ctx.fillStyle = C.white;
      roundedRect(ctx, panel.x, 18, 252, 232, 8);
      ctx.fill();
      ctx.strokeStyle = panelIndex === 1 && view === 'sources' ? C.green : C.line;
      ctx.lineWidth = panelIndex === 1 && view === 'sources' ? 2 : 1;
      ctx.stroke();
      drawSceneLabel(ctx, panel.label, panel.x + 126, 39, C.ink, 'center', 12, 800);

      panel.sources.forEach((source) => {
        drawArrow(ctx, source, panel.target, view === 'sources' && panelIndex === 1 ? C.green : C.blue, 2.2, false, 14);
        drawNode(ctx, source, '', C.white, view === 'sources' ? (panelIndex === 1 ? C.green : C.muted) : C.blue, false, 10);
      });

      if (view === 'sources' && panelIndex === 1) {
        const upstream = [
          { x: 312, y: 63, to: 0 }, { x: 348, y: 59, to: 0 },
          { x: 392, y: 61, to: 1 }, { x: 431, y: 58, to: 1 },
          { x: 478, y: 61, to: 2 }, { x: 520, y: 63, to: 2 },
        ];
        upstream.forEach((node) => {
          drawArrow(ctx, node, panel.sources[node.to], C.orange, 1.4, false, 6);
          ctx.fillStyle = C.orange;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 3.5, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      const targetStroke = view === 'sources' ? (panelIndex === 1 ? C.green : C.muted) : C.orange;
      drawNode(ctx, panel.target, panelIndex === 0 ? 'X' : 'Y', C.white, targetStroke, true, 15);
      drawSceneLabel(ctx, '入度 = 3', panel.x + 126, 224, C.orange, 'center', 11, 800);
    });

    if (view === 'indegree') {
      drawSceneLabel(ctx, '只看数量：无法区分', 280, 261, C.red, 'center', 11, 800);
    } else {
      drawSceneLabel(ctx, '普通来源', 144, 68, C.muted, 'center', 10, 700);
      drawSceneLabel(ctx, '来源节点本身也被多次指向', 416, 260, C.green, 'center', 10, 800);
    }
  };
  return (
    <div>
      <CanvasScene width={560} height={270} draw={draw} ariaLabel="两个候选节点入度相同，但指向它们的来源节点重要性不同" />
      <div className="chip-row">
        <button className={`chip ${view === 'indegree' ? 'selected' : ''}`} aria-pressed={view === 'indegree'} onClick={() => setView('indegree')}>① 只看入度</button>
        <button className={`chip ${view === 'sources' ? 'selected' : ''}`} aria-pressed={view === 'sources'} onClick={() => setView('sources')}>② 再看来源节点</button>
      </div>
      <Feedback
        text={view === 'indegree'
          ? 'X 与 Y 都收到 3 条入边。只统计入度数量，两者看起来同样重要，无法判断谁更有代表性。'
          : 'Y 不仅入度为 3，指向它的节点本身也被多次指向。PageRank 会递归计入来源节点的重要性，因此 Y 的得分更高。'}
        tone={view === 'sources' ? 'good' : 'neutral'}
      />
    </div>
  );
}

type PageRankEdge = [from: number, to: number, weight: number];

const pageRankEdges: PageRankEdge[] = [
  [0, 1, 0.4], [0, 2, 0.6], [1, 2, 0.8], [1, 3, 0.2],
  [2, 1, 0.35], [2, 3, 0.65], [3, 0, 0.3], [3, 2, 0.7],
];

function pageRankStep(scores: number[], damping: number, edges: PageRankEdge[]) {
  const nodeCount = scores.length;
  const next = Array.from({ length: nodeCount }, () => (1 - damping) / nodeCount);
  const outgoingWeight = Array.from({ length: nodeCount }, () => 0);
  edges.forEach(([from, , weight]) => { outgoingWeight[from] += weight; });
  edges.forEach(([from, to, weight]) => {
    const denominator = outgoingWeight[from] || 1;
    next[to] += damping * scores[from] * (weight / denominator);
  });
  return next;
}

function pageRankIterations(damping: number, rounds: number) {
  const values: number[][] = [[0.25, 0.25, 0.25, 0.25]];
  for (let round = 0; round < rounds; round += 1) {
    values.push(pageRankStep(values[values.length - 1], damping, pageRankEdges));
  }
  return values;
}

function FormulaNumber({ value, hint }: { value: string; hint: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  return (
    <span
      ref={ref}
      className="formula-number-hint"
      role="button"
      tabIndex={0}
      data-hint={hint}
      aria-expanded={open}
      aria-label={`${value}。${hint}`}
      onClick={(event) => { event.stopPropagation(); setOpen((value) => !value); }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setOpen((current) => !current);
        }
      }}
    >
      {value}
    </span>
  );
}

function PageRankModule() {
  const [iteration, setIteration] = useState(0);
  const [damping, setDamping] = useState(0.85);
  const positions = [{ x: 100, y: 74 }, { x: 255, y: 55 }, { x: 312, y: 168 }, { x: 132, y: 184 }];
  const iterations = useMemo(() => pageRankIterations(damping, 6), [damping]);
  const scores = iterations[iteration];
  const calculationRound = iteration === 0 ? 1 : iteration;
  const calculationInputs = iterations[calculationRound - 1];
  const calculationOutput = iterations[calculationRound];
  const formulaTarget = 2;
  const incomingEdges = pageRankEdges.filter(([, to]) => to === formulaTarget);
  const outgoingWeights = pageRankEdges.reduce<number[]>((totals, [from, , weight]) => {
    totals[from] = (totals[from] || 0) + weight;
    return totals;
  }, []);
  const cTerms = incomingEdges.map(([from, , weight]) => {
    const normalizedWeight = weight / outgoingWeights[from];
    return {
      source: String.fromCharCode(65 + from),
      score: calculationInputs[from].toFixed(3),
      normalizedWeight: normalizedWeight.toFixed(2),
      rawWeight: weight.toFixed(2),
      outgoingWeight: outgoingWeights[from].toFixed(2),
    };
  });
  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    clearTrailScene(ctx, 560, 260);
    ctx.fillStyle = C.white; roundedRect(ctx, 18, 18, 350, 220, 8); ctx.fill(); ctx.strokeStyle = C.line; ctx.stroke();
    ctx.fillStyle = C.white; roundedRect(ctx, 384, 18, 158, 220, 8); ctx.fill(); ctx.strokeStyle = C.line; ctx.stroke();
    const orderedEdges = [
      ...pageRankEdges.filter(([, to]) => to !== formulaTarget),
      ...pageRankEdges.filter(([, to]) => to === formulaTarget),
    ];
    orderedEdges.forEach(([from, to, weight]) => {
      const entersC = to === formulaTarget;
      drawArrow(ctx, positions[from], positions[to], entersC ? '#7895b7' : C.line, 1 + weight * 3);
    });

    if (iteration > 0) {
      const sourceScores = iterations[iteration - 1];
      const flows = orderedEdges.map(([from, , weight]) => sourceScores[from] * (weight / outgoingWeights[from]));
      const maxFlow = Math.max(...flows);
      orderedEdges.forEach(([from, to], edgeIndex) => {
        const source = positions[from];
        const target = positions[to];
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const length = Math.hypot(dx, dy) || 1;
        const ux = dx / length;
        const uy = dy / length;
        const progress = (time * 0.48 + edgeIndex * 0.16) % 1;
        const startOffset = 21;
        const endOffset = 21;
        const travel = Math.max(0, length - startOffset - endOffset);
        const x = source.x + ux * (startOffset + travel * progress);
        const y = source.y + uy * (startOffset + travel * progress);
        const strength = flows[edgeIndex] / maxFlow;
        ctx.save();
        ctx.globalAlpha = 0.38 + Math.sin(Math.PI * progress) * 0.58;
        ctx.fillStyle = to === formulaTarget ? C.blue : C.orange;
        ctx.beginPath();
        ctx.arc(x, y, 2.2 + strength * 1.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const scoreRange = maxScore - minScore;
    positions.forEach((p, i) => {
      const prominence = scoreRange < 0.0001 ? 0.5 : (scores[i] - minScore) / scoreRange;
      const isRepresentative = iteration > 0 && scores[i] === maxScore;
      const radius = 15 + prominence * 4;
      drawNode(
        ctx,
        p,
        String.fromCharCode(65 + i),
        isRepresentative ? '#e4f4eb' : C.white,
        isRepresentative ? C.green : C.blue,
        isRepresentative,
        radius,
        isRepresentative ? C.green : C.ink
      );
      drawSceneLabel(ctx, `PR ${scores[i].toFixed(3)}`, p.x, p.y + radius + 11, isRepresentative ? C.green : C.muted, 'center', 9, 750);
    });
    drawSceneLabel(ctx, `第 ${iteration} / 6 轮 · ${iteration === 0 ? '均匀起点' : '得分传播'}`, 193, 31, C.blue, 'center', 12, 800);
    drawSceneLabel(ctx, iteration === 0 ? '点击“下一轮”开始沿边传播' : '流动圆点表示得分沿 source → target 传播', 193, 226, iteration === 0 ? C.muted : C.blue, 'center', 10, 750);
    scores.forEach((score, i) => {
      const y = 58 + i * 41;
      drawSceneLabel(ctx, String.fromCharCode(65 + i), 401, y + 10, C.ink, 'left', 12, 800);
      ctx.fillStyle = C.line; ctx.fillRect(423, y, 98, 18);
      ctx.fillStyle = score === Math.max(...scores) ? C.green : C.blue; ctx.fillRect(423, y, score / 0.5 * 98, 18);
      drawSceneLabel(ctx, score.toFixed(3), 521, y + 28, C.muted, 'right', 11, 700);
    });
  };
  return (
    <div>
      <div className="pagerank-formula-block">
        <div className="pagerank-formula-title">每一轮如何更新节点 i 的得分</div>
        <div
          className="pagerank-equation"
          role="math"
          aria-label="PR t 加 1 括号 i，等于 1 减 d 除以 N，加 d 乘以所有指向 i 的节点 j 的加权贡献之和"
        >
          <span>PR<sub>t+1</sub>(i)</span>
          <span>=</span>
          <span className="pr-fraction"><span>1−d</span><span>N</span></span>
          <span>+</span>
          <span>d</span>
          <span>∑<sub>j→i</sub></span>
          <span className="pr-fraction">
            <span>w<sub>ji</sub></span>
            <span>∑<sub>ℓ:j→ℓ</sub> w<sub>jℓ</sub></span>
          </span>
          <span>PR<sub>t</sub>(j)</span>
        </div>
        <p>
          节点 i 的新得分由两部分组成：均匀分配的随机跳转，以及所有入邻居 j 传来的上一轮得分。来源节点越重要、j→i 的边权越大，i 获得的贡献越多。d 越大越依赖沿边传播，越小越接近均匀分配；论文使用默认阻尼系数 <b>d=0.85</b>。
        </p>
        <div className="ctrl pagerank-parameter">
          <label htmlFor="pagerank-damping">阻尼系数 d <span className="val">{damping.toFixed(2)}</span></label>
          <input
            id="pagerank-damping"
            aria-label="PageRank 阻尼系数 d"
            type="range"
            min="0.50"
            max="0.95"
            step="0.05"
            value={damping}
            onChange={(event) => setDamping(Number(event.currentTarget.value))}
          />
        </div>
        <div className="pagerank-live-calculation" aria-live="polite">
          <div className="pagerank-live-title">{iteration === 0 ? '下一轮' : `第 ${iteration} 轮`}的 C 节点数值计算</div>
          <div className="pagerank-live-equation">
            PR<sub><FormulaNumber value={String(calculationRound)} hint={`第 ${calculationRound} 轮更新；使用第 ${calculationRound - 1} 轮得分作为输入。`} /></sub>(C)
            {' = '}
            <FormulaNumber
              value={((1 - damping) / 4).toFixed(3)}
              hint={`随机跳转项 (1-d)/N；这里 d=${damping.toFixed(2)}，节点总数 N=4。`}
            />
            {' + '}
            <FormulaNumber value={damping.toFixed(2)} hint="阻尼系数 d：本轮有多少比例的得分沿有向边传播。" />
            {' × ('}
            {cTerms.map((term, index) => (
              <React.Fragment key={term.source}>
                {index > 0 ? ' + ' : null}
                <FormulaNumber value={term.score} hint={`${term.source} 节点在上一轮的 PageRank 得分。`} />
                {' × '}
                <FormulaNumber
                  value={term.normalizedWeight}
                  hint={`${term.source}→C 的归一化边权：原始边权 ${term.rawWeight} ÷ ${term.source} 的全部出边权重 ${term.outgoingWeight}。`}
                />
              </React.Fragment>
            ))}
            {') = '}
            <b><FormulaNumber value={calculationOutput[formulaTarget].toFixed(3)} hint={`C 节点完成第 ${calculationRound} 轮传播后的新 PageRank 得分。`} /></b>
          </div>
          <p>C 收到来自 A、B、D 的三条入边；点击任一数字，可以查看它在本轮计算中的来源。</p>
        </div>
      </div>
      <CanvasScene width={560} height={260} draw={draw} animate ariaLabel="PageRank 逐轮传播：节点大小随得分变化，流动圆点沿有向边传递重要性" />
      <div className="step-ctrl">
        <button className="tiny ghost" title="上一轮" aria-label="上一轮" onClick={() => setIteration((v) => Math.max(0, v - 1))} disabled={iteration === 0}>←</button>
        <button className="tiny ghost" title="重置" aria-label="重置到第零轮" onClick={() => setIteration(0)}>↺</button>
        <span className="step-label">传播轮次 <b>{iteration}/6</b></span>
        <button className="tiny" title="下一轮" aria-label="下一轮" onClick={() => setIteration((v) => Math.min(6, v + 1))} disabled={iteration === 6}>→</button>
      </div>
      <Feedback text={iteration === 0 ? '尚未传播：四个点从相同得分开始。' : iteration < 3 ? '重要性开始沿加权提名传播，排序仍在变化。' : iteration < 6 ? '强提名者的影响被继续放大，得分正在稳定。' : '排序已基本稳定；代表点由整张图的递归结构共同决定。'} tone={iteration === 6 ? 'good' : 'neutral'} />
    </div>
  );
}

function KCoreModule() {
  const [step, setStep] = useState(0);
  type CoreShape = 'circle' | 'triangle' | 'square' | 'star';
  const nodes: Array<{ x: number; y: number; shell: number; shape: CoreShape }> = [
    { x: 62, y: 248, shell: 0, shape: 'circle' },
    { x: 164, y: 214, shell: 1, shape: 'triangle' },
    { x: 144, y: 112, shell: 2, shape: 'square' },
    { x: 236, y: 143, shell: 3, shape: 'star' },
    { x: 320, y: 109, shell: 3, shape: 'star' },
    { x: 407, y: 151, shell: 3, shape: 'star' },
    { x: 320, y: 201, shell: 3, shape: 'star' },
    { x: 452, y: 105, shell: 2, shape: 'square' },
    { x: 474, y: 214, shell: 1, shape: 'triangle' },
    { x: 523, y: 248, shell: 0, shape: 'circle' },
  ];
  const shellColors = ['#e9d5ff', '#c084fc', '#a855f7', '#8b00d9'];
  // Every pair is source -> target. Nodes 3-6 retain three incoming core
  // edges after the outer shells disappear.
  const edges: Array<[number, number]> = [
    [0, 1], [9, 8], [3, 1], [4, 8],
    [3, 2], [4, 2], [5, 7], [6, 7],
    [3, 4], [3, 5], [3, 6], [4, 3], [4, 5], [4, 6],
    [5, 3], [5, 4], [5, 6], [6, 3], [6, 4], [6, 5],
    [2, 3], [7, 6], [1, 2], [8, 7],
  ];
  const drawShape = (ctx: CanvasRenderingContext2D, node: typeof nodes[number], scale: number, alpha: number) => {
    const { x, y, shape, shell } = node;
    const color = shellColors[shell];
    const radius = (shell === 3 ? 22 : shell === 2 ? 19 : shell === 1 ? 18 : 16) * scale;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (shape === 'circle') {
      ctx.arc(x, y, radius, 0, Math.PI * 2);
    } else if (shape === 'square') {
      ctx.rect(x - radius, y - radius, radius * 2, radius * 2);
    } else if (shape === 'triangle') {
      ctx.moveTo(x, y - radius);
      ctx.lineTo(x + radius * 0.92, y + radius * 0.78);
      ctx.lineTo(x - radius * 0.92, y + radius * 0.78);
      ctx.closePath();
    } else {
      for (let i = 0; i < 10; i += 1) {
        const angle = -Math.PI / 2 + i * Math.PI / 5;
        const r = i % 2 === 0 ? radius : radius * 0.46;
        const px = x + Math.cos(angle) * r;
        const py = y + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };
  const drawRegion = (ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string, alpha: number) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(110,78,145,0.16)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, -0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };
  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    clearTrailScene(ctx, 560, 300);
    drawSceneLabel(ctx, '论文图的 k-core 层级复现', 280, 24, C.ink, 'center', 15, 800);
    drawSceneLabel(ctx, '每个节点的数字表示 in-degree coreness', 280, 45, C.muted, 'center', 11, 600);
    drawRegion(ctx, 280, 165, 252, 111, '#f3e8ff', 0.46);
    drawRegion(ctx, 292, 161, 188, 88, '#e9d5ff', 0.34);
    drawRegion(ctx, 318, 166, 116, 68, '#d8b4fe', 0.28);

    const edgeIsVisible = ([from, to]: [number, number]) => nodes[from].shell >= step && nodes[to].shell >= step;
    const drawEdge = ([from, to]: [number, number], active: boolean) => {
      const target = nodes[to];
      const color = active ? (target.shell === 3 ? '#8b7b97' : '#ac99b7') : 'rgba(196,63,82,0.22)';
      drawArrow(ctx, nodes[from], target, color, active ? 1.35 : 0.9, !active, 17);
    };
    // Faded/removed edges are drawn first so active arrows stay on top.
    edges.filter((edge) => !edgeIsVisible(edge)).forEach((edge) => drawEdge(edge, false));
    edges.filter(edgeIsVisible).forEach((edge) => drawEdge(edge, true));

    nodes.forEach((node) => {
      const visible = node.shell >= step;
      const pulse = node.shell === 3 && visible ? 1 + Math.sin(time * 2.2) * 0.045 : 1;
      drawShape(ctx, node, pulse, visible ? 1 : 0.22);
      const labelColor = node.shell >= 2 ? C.white : C.ink;
      drawSceneLabel(ctx, String(node.shell), node.x, node.y + 1, visible ? labelColor : C.red, 'center', 12, 900);
    });
    drawSceneLabel(ctx, '3-Core', 318, 72, shellColors[3], 'center', 17, 850);
    drawSceneLabel(ctx, '2-Core', 146, 73, shellColors[2], 'center', 16, 800);
    drawSceneLabel(ctx, '1-Core', 478, 166, shellColors[1], 'center', 16, 800);
    drawSceneLabel(ctx, '0-Core', 518, 282, shellColors[0], 'center', 16, 800);
    const stateLabel = step === 0 ? '完整层级' : step === 1 ? '移除 0-core 外围' : step === 2 ? '继续移除 1-core' : '只保留 3-core';
    drawSceneLabel(ctx, stateLabel, 280, 286, step === 3 ? C.green : C.blue, 'center', 11, 800);
  };

  type CaseNode = Point & { shell: number; group: 0 | 1 | 2 | null };
  const caseNodes: CaseNode[] = [
    { x: 126, y: 105, shell: 3, group: 0 }, { x: 151, y: 91, shell: 3, group: 0 },
    { x: 165, y: 119, shell: 3, group: 0 }, { x: 137, y: 136, shell: 3, group: 0 },
    { x: 274, y: 91, shell: 3, group: 1 }, { x: 303, y: 86, shell: 3, group: 1 },
    { x: 316, y: 116, shell: 3, group: 1 }, { x: 284, y: 128, shell: 3, group: 1 },
    { x: 414, y: 120, shell: 3, group: 2 }, { x: 443, y: 108, shell: 3, group: 2 },
    { x: 463, y: 137, shell: 3, group: 2 }, { x: 429, y: 153, shell: 3, group: 2 },
    { x: 211, y: 116, shell: 2, group: null }, { x: 361, y: 123, shell: 2, group: null },
    { x: 287, y: 175, shell: 2, group: null }, { x: 76, y: 78, shell: 1, group: null },
    { x: 215, y: 61, shell: 1, group: null }, { x: 365, y: 65, shell: 1, group: null },
    { x: 502, y: 87, shell: 1, group: null }, { x: 491, y: 194, shell: 1, group: null },
    { x: 97, y: 194, shell: 1, group: null }, { x: 39, y: 133, shell: 0, group: null },
    { x: 265, y: 221, shell: 0, group: null }, { x: 528, y: 151, shell: 0, group: null },
  ];
  const coreGroups = [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11]];
  const coreEdges: Array<[number, number]> = coreGroups.flatMap((group) => group.flatMap((from) =>
    group.filter((to) => to !== from).map((to) => [from, to] as [number, number])
  ));
  const caseEdges: Array<[number, number]> = [
    ...coreEdges,
    [12, 1], [12, 3], [12, 4], [2, 12], [7, 12],
    [13, 6], [13, 8], [13, 11], [7, 13], [9, 13],
    [14, 3], [14, 7], [14, 11], [3, 14], [10, 14],
    [15, 0], [15, 3], [20, 0], [20, 3], [16, 4], [16, 5],
    [17, 5], [17, 8], [18, 9], [18, 10], [19, 10], [19, 11],
    [21, 15], [21, 20], [22, 14], [22, 19], [23, 18], [23, 19],
  ];
  const drawCase = (ctx: CanvasRenderingContext2D, time: number) => {
    clearTrailScene(ctx, 560, 250);
    drawSceneLabel(ctx, '实际意义：在有向 kNN graph 中逐层剥离外围', 280, 18, C.ink, 'center', 15, 800);
    const cycle = time % 7.2;
    const peelLevel = clamp((cycle - 0.9) / 1.15, 0, 3);
    const nodeAlpha = (node: CaseNode) => 1 - clamp(peelLevel - node.shell, 0, 1) * 0.94;
    const edgeAlpha = ([from, to]: [number, number]) => Math.min(nodeAlpha(caseNodes[from]), nodeAlpha(caseNodes[to]));
    const groupColors = [C.blue, C.green, C.orange];

    caseEdges
      .filter((edge) => edgeAlpha(edge) < 0.45)
      .forEach(([from, to]) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0.025, edgeAlpha([from, to]) * 0.28);
        drawArrow(ctx, caseNodes[from], caseNodes[to], C.muted, 0.75, true, 7.5);
        ctx.restore();
      });
    caseEdges
      .filter((edge) => edgeAlpha(edge) >= 0.45)
      .forEach(([from, to]) => {
        const source = caseNodes[from];
        const edgeColor = source.group === null ? '#9aa8b6' : groupColors[source.group];
        ctx.save();
        ctx.globalAlpha = 0.24 + edgeAlpha([from, to]) * 0.38;
        drawArrow(ctx, source, caseNodes[to], edgeColor, source.shell === 3 ? 1.15 : 0.9, false, 7.5);
        ctx.restore();
      });

    caseNodes.forEach((node) => {
      const alpha = nodeAlpha(node);
      const color = node.group === null ? '#91a0ad' : groupColors[node.group];
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.strokeStyle = C.white;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.shell === 3 ? 6.8 : 5.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
    const stage = Math.min(3, Math.ceil(peelLevel));
    const stateLabel = stage === 0 ? '完整 kNN graph' : stage === 1 ? '外围节点正在淡出' : stage === 2 ? '继续剥离低 coreness 节点' : '留下三个稳定核心子图';
    drawSceneLabel(ctx, stateLabel, 280, 239, stage === 3 ? C.green : C.blue, 'center', 11, 800);
    drawSceneLabel(ctx, '箭头表示 source → target', 18, 239, C.muted, 'left', 9, 650);
  };
  return (
    <div>
      <CanvasScene width={560} height={300} draw={draw} animate ariaLabel="论文 k-core 层级图的有向动画复现" />
      <div className="step-ctrl">
        <button className="tiny ghost" title="上一层" aria-label="退回上一层" onClick={() => setStep((v) => Math.max(0, v - 1))} disabled={step === 0}>←</button>
        <button className="tiny ghost" title="重置" aria-label="重置剥离" onClick={() => setStep(0)}>↺</button>
        <span className="step-label">剥离层级 <b>{step}/3</b></span>
        <button className="tiny" title="下一层" aria-label="剥离下一层" onClick={() => setStep((v) => Math.min(3, v + 1))} disabled={step === 3}>→</button>
      </div>
      <Feedback text={step === 0 ? '先看到完整的 0/1/2/3-core 层级；箭头表示 source → target。' : step < 3 ? '按剩余入度移除当前外围，内层节点逐渐显现。' : '3-core 保留下来的是入度至少为 3、彼此高度互连的核心子图。'} tone={step === 3 ? 'good' : 'neutral'} />
      <CanvasScene width={560} height={250} draw={drawCase} animate ariaLabel="有向 kNN graph 逐层剥离外围节点并留下三个稳定核心子图" />
      <p className="kcore-case-caption">动画把低 coreness 节点和相关边依次淡出，最终留下几片内部互连稳定的核心；它揭示的是层级，不是重新聚类。</p>
    </div>
  );
}

function CCModule() {
  const [playing, setPlaying] = useState(true);
  const [level, setLevel] = useState<0 | 3 | 6>(0);
  const center = { x: 175, y: 128 };
  const neighbors: Point[] = [
    { x: 82, y: 67 },
    { x: 270, y: 67 },
    { x: 176, y: 205 },
  ];
  const pairs: Array<[number, number]> = [
    [0, 1], [1, 0],
    [1, 2], [2, 1],
    [2, 0], [0, 2],
  ];
  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    clearTrailScene(ctx, 560, 250);
    drawSceneLabel(ctx, 'clustering coefficient：近邻之间也互相连接吗？', 280, 18, C.ink, 'center', 15, 800);
    const phase = playing ? (time % 7.2) / 7.2 : level / 6;
    const pairProgress = playing ? clamp(((phase - 0.08) / 0.68) * 6, 0, 6) : level;
    const pairAlpha = (index: number) => clamp(pairProgress - index, 0, 1);
    const activeNeighbor = (index: number) => pairs.some(([from, to], pairIndex) =>
      pairIndex < 6 && pairAlpha(pairIndex) > 0.08 && (from === index || to === index)
    );

    // The center-to-neighbor links are the fixed kNN links; only links among
    // those neighbors are revealed, so the changing quantity is CC itself.
    neighbors.forEach((neighbor) => drawArrow(ctx, center, neighbor, C.orange, 1.8, false, 14));
    pairs.forEach(([from, to], index) => {
      const alpha = pairAlpha(index);
      if (alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = 0.25 + alpha * 0.7;
      drawArrow(ctx, neighbors[from], neighbors[to], C.green, 2.1, false, 13);
      ctx.restore();
    });

    drawNode(ctx, center, 'i', C.white, C.red, true, 14, C.red);
    neighbors.forEach((node, index) => drawNode(
      ctx,
      node,
      String(index + 1),
      activeNeighbor(index) ? '#e4f4eb' : C.white,
      activeNeighbor(index) ? C.green : C.blue,
      false,
      12,
      activeNeighbor(index) ? C.green : C.ink
    ));
    drawSceneLabel(ctx, '焦点节点 i', center.x, center.y + 29, C.red, 'center', 10, 700);
    drawSceneLabel(ctx, '近邻之间的有向连接', 174, 227, C.green, 'center', 10, 700);
    drawSceneLabel(ctx, '箭头表示 source → target', 18, 239, C.muted, 'left', 9, 650);

    ctx.fillStyle = C.white;
    roundedRect(ctx, 322, 35, 220, 184, 8);
    ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.stroke();
    drawSceneLabel(ctx, 'CC 计数', 343, 58, C.muted, 'left', 11, 700);
    const visibleCount = Math.min(6, Math.floor(pairProgress + 0.001));
    const connectionState = visibleCount === 0 ? '没有互连' : visibleCount === 6 ? '完全互连' : '部分互连';
    drawSceneLabel(ctx, connectionState, 343, 94, C.ink, 'left', 24, 800);
    drawSceneLabel(ctx, `近邻之间已出现 ${visibleCount} 条有向边，最多 6 条`, 343, 118, C.muted, 'left', 10, 600);
    drawSceneLabel(ctx, `CC(i) = ${(visibleCount / 6).toFixed(2)}`, 343, 148, C.green, 'left', 16, 800);
    for (let i = 0; i < 6; i += 1) {
      ctx.fillStyle = i < visibleCount ? C.green : '#e7edf1';
      roundedRect(ctx, 343 + i * 28, 169, 20, 8, 3);
      ctx.fill();
    }
    const stateLabel = visibleCount === 0 ? '近邻彼此没有连接' : visibleCount === 3 ? '一半的可能连接已经出现' : visibleCount === 6 ? '近邻形成完整互连' : '正在检查近邻之间的连接';
    drawSceneLabel(ctx, stateLabel, 343, 199, visibleCount === 6 ? C.green : C.blue, 'left', 10, 700);
  };
  const feedback = playing
    ? 'CC 不看近邻数量，而看这三个近邻之间实际出现了多少条可能的有向连接。'
    : level === 0
      ? '近邻互不相连：三个近邻之间没有任何有向连接，因此 CC = 0。'
      : level === 3
        ? '部分近邻相连：三个近邻之间出现了全部可能连接的一半，因此 CC = 0.50。'
        : '近邻全部互连：每一对近邻在两个方向上都有连接，因此 CC = 1。';
  return (
    <div>
      <CanvasScene width={560} height={250} draw={draw} animate ariaLabel="焦点节点及其三个近邻之间的有向连接逐步增加，用于解释 clustering coefficient" />
      <div className="chip-row">
        <button className={`chip ${playing ? 'selected' : ''}`} aria-pressed={playing} onClick={() => setPlaying(true)}>自动播放</button>
        {([[0, '近邻互不相连'], [3, '部分近邻相连'], [6, '近邻全部互连']] as const).map(([v, label]) => <button key={v} className={`chip ${!playing && level === v ? 'selected' : ''}`} aria-pressed={!playing && level === v} onClick={() => { setPlaying(false); setLevel(v); }}>{label}</button>)}
      </div>
      <Feedback text={feedback} tone={!playing && level === 6 ? 'good' : 'neutral'} />
    </div>
  );
}

function StructureDistinctionModule() {
  const [mode, setMode] = useState<'auto' | 'core' | 'cc'>('auto');
  type StructureNode = Point & { shell: 0 | 1 | 2 };
  const coreNodes: StructureNode[] = [
    { x: 55, y: 91, shell: 0 }, { x: 61, y: 209, shell: 0 }, { x: 153, y: 232, shell: 0 },
    { x: 309, y: 86, shell: 0 }, { x: 308, y: 209, shell: 0 },
    { x: 105, y: 103, shell: 1 }, { x: 91, y: 169, shell: 1 }, { x: 144, y: 204, shell: 1 },
    { x: 265, y: 176, shell: 1 }, { x: 267, y: 115, shell: 1 },
    { x: 158, y: 111, shell: 2 }, { x: 216, y: 100, shell: 2 }, { x: 239, y: 151, shell: 2 },
    { x: 195, y: 176, shell: 2 }, { x: 145, y: 157, shell: 2 },
  ];
  const coreEdges: Array<[number, number]> = [
    [0, 5], [1, 6], [2, 7], [3, 9], [4, 8], [5, 10], [6, 14], [7, 13], [8, 12], [9, 11],
    [10, 11], [11, 12], [12, 13], [13, 14], [14, 10], [11, 10], [12, 11], [13, 12], [14, 13], [10, 14],
  ];
  const focus = { x: 537, y: 148 };
  const neighbors: Point[] = [
    { x: 537, y: 76 }, { x: 620, y: 143 }, { x: 537, y: 218 }, { x: 454, y: 143 },
  ];
  const neighborEdges: Array<[number, number]> = [[0, 1], [1, 0], [1, 2], [2, 3], [3, 2], [3, 0]];

  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    clearTrailScene(ctx, 720, 300);
    const cycle = time % 8;
    const peelProgress = mode === 'cc'
      ? 0
      : mode === 'core'
        ? clamp(((time % 4.5) - 0.5) / 1.25, 0, 2)
        : clamp((cycle - 0.6) / 1.25, 0, 2);
    const inspectionProgress = mode === 'core'
      ? 0
      : mode === 'cc'
        ? clamp(((time % 4.5) - 0.5) / 0.45, 0, neighborEdges.length)
        : clamp((cycle - 3.6) / 0.45, 0, neighborEdges.length);
    const coreOpacity = mode === 'cc' ? 0.42 : 1;
    const ccOpacity = mode === 'core' ? 0.42 : 1;

    [{ x: 18, color: C.blue }, { x: 372, color: C.green }].forEach((panel) => {
      ctx.fillStyle = C.white;
      roundedRect(ctx, panel.x, 16, 330, 268, 8);
      ctx.fill();
      ctx.strokeStyle = panel.color;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });
    drawSceneLabel(ctx, '宏观 · 整张图', 38, 39, C.muted, 'left', 10, 750);
    drawSceneLabel(ctx, 'in-degree k-core', 38, 59, C.blue, 'left', 16, 800);
    drawSceneLabel(ctx, '微观 · i 的近邻', 392, 39, C.muted, 'left', 10, 750);
    drawSceneLabel(ctx, 'clustering coefficient', 392, 59, C.green, 'left', 16, 800);

    const nodeAlpha = (node: StructureNode) => 1 - clamp(peelProgress - node.shell, 0, 1) * 0.9;
    ctx.save();
    ctx.globalAlpha = coreOpacity;
    coreEdges.forEach(([from, to]) => {
      const alpha = Math.min(nodeAlpha(coreNodes[from]), nodeAlpha(coreNodes[to]));
      ctx.save();
      ctx.globalAlpha = alpha * 0.72;
      drawArrow(ctx, coreNodes[from], coreNodes[to], coreNodes[from].shell === 2 ? C.blue : '#aab5c3', coreNodes[from].shell === 2 ? 1.5 : 1, false, 7);
      ctx.restore();
    });
    coreNodes.forEach((node, index) => {
      const alpha = nodeAlpha(node);
      const isFocus = index === 11;
      const shellColor = node.shell === 2 ? C.blue : node.shell === 1 ? '#7895b7' : '#b9c3cf';
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = isFocus ? C.red : shellColor;
      ctx.strokeStyle = C.white;
      ctx.lineWidth = isFocus ? 2.4 : 1.2;
      ctx.beginPath();
      ctx.arc(node.x, node.y, isFocus ? 8 : node.shell === 2 ? 6.3 : 5.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      if (isFocus) drawSceneLabel(ctx, 'i', node.x, node.y + 0.5, C.white, 'center', 9, 850);
    });
    ctx.restore();
    drawSceneLabel(ctx, peelProgress < 0.8 ? '完整网络' : peelProgress < 1.8 ? '剥离外围' : '稳定核心', 183, 252, peelProgress >= 1.8 ? C.blue : C.muted, 'center', 11, 800);
    drawSceneLabel(ctx, 'coreness：深层核心', 183, 270, C.blue, 'center', 13, 850);

    ctx.save();
    ctx.globalAlpha = ccOpacity;
    neighbors.forEach((neighbor) => drawArrow(ctx, focus, neighbor, '#8fa4bb', 1.4, false, 12));
    neighborEdges.forEach(([from, to], index) => {
      const inspected = clamp(inspectionProgress - index, 0, 1);
      drawArrow(ctx, neighbors[from], neighbors[to], inspected > 0 ? C.green : '#d3dae2', inspected > 0 ? 2 : 1, false, 11);
    });
    drawNode(ctx, focus, 'i', C.white, C.red, true, 14, C.red);
    neighbors.forEach((neighbor, index) => {
      const active = neighborEdges.some(([from, to], edgeIndex) => edgeIndex < inspectionProgress && (from === index || to === index));
      drawNode(ctx, neighbor, String(index + 1), active ? '#e4f4eb' : C.white, active ? C.green : C.blue, false, 11, active ? C.green : C.ink);
    });
    ctx.restore();
    drawSceneLabel(ctx, inspectionProgress < 1 ? '固定 i 的邻域' : inspectionProgress < neighborEdges.length ? '检查近邻互连' : '局部凝聚度', 537, 252, inspectionProgress >= neighborEdges.length ? C.green : C.muted, 'center', 11, 800);
    drawSceneLabel(ctx, 'CC = 0.50', 537, 270, C.green, 'center', 13, 850);
  };

  return (
    <section className="structure-distinction" aria-label="in-degree k-core 与 clustering coefficient 的区别">
      <CanvasScene width={720} height={300} draw={draw} animate ariaLabel="同一节点的两种结构读法：左侧用 in-degree k-core 观察整张图的核心层级，右侧用 clustering coefficient 检查局部近邻互连" />
      <div className="chip-row">
        {([['auto', '自动对比'], ['core', '看整体层级'], ['cc', '看局部互连']] as const).map(([value, label]) => (
          <button key={value} className={`chip ${mode === value ? 'selected' : ''}`} aria-pressed={mode === value} onClick={() => setMode(value)}>{label}</button>
        ))}
      </div>
      <Feedback text="同一个节点 i：k-core 看它在整张图中能留到第几层，CC 看它的近邻之间连接得有多紧。二者都是结构分数，不是聚类标签。" tone="good" />
    </section>
  );
}

type Lens = 'pagerank' | 'kcore' | 'cc';
const lensData: Record<Lens, { label: string; question: string; input: string; output: string; cost: string; feedback: string }> = {
  pagerank: { label: '找代表点', question: '哪些点最能代表全局？', input: '加权有向图', output: '连续排名', cost: 'O(nkT)', feedback: '需要可按任意预算截断的代表性排名时，选择 PageRank。' },
  kcore: { label: '看核心层', question: '点位于核心还是外围？', input: '无权有向图', output: '核心层级', cost: 'O(nk)', feedback: '需要看簇内核心与外围的渐进层级时，选择 in-degree k-core。' },
  cc: { label: '找紧密邻域', question: '近邻之间也互相连接吗？', input: '无权有向图', output: '局部凝聚', cost: 'O(nk²)', feedback: '需要检查近邻之间是否彼此互连时，选择 clustering coefficient。' },
};

function LensModule() {
  const [lens, setLens] = useState<Lens>('pagerank');
  const data = lensData[lens];
  const pts = [{ x: 280, y: 62 }, { x: 345, y: 94 }, { x: 322, y: 169 }, { x: 238, y: 173 }, { x: 211, y: 93 }];
  const draw = (ctx: CanvasRenderingContext2D) => {
    clearTrailScene(ctx, 560, 250);
    drawMap(ctx, 18, 18, 198, 214);
    drawCompass(ctx, 116, 102, lens === 'pagerank' ? -0.9 : lens === 'kcore' ? 0.4 : 1.8, 48);
    drawSceneLabel(ctx, data.label, 116, 178, C.blue, 'center', 14, 800);
    ctx.fillStyle = C.white; roundedRect(ctx, 228, 18, 160, 214, 8); ctx.fill(); ctx.strokeStyle = C.line; ctx.stroke();
    const edges: Array<[number, number]> = [[0,1],[1,2],[2,3],[3,4],[4,0],[4,1],[3,1]];
    edges.forEach(([a,b], i) => drawArrow(ctx, pts[a], pts[b], lens === 'pagerank' && i < 4 ? C.blue : lens === 'cc' && i >= 4 ? C.purple : C.line, lens === 'kcore' ? 1.8 + (a % 3) : 2, false, 12));
    pts.forEach((p, i) => drawNode(ctx, p, String(i + 1), C.white, lens === 'kcore' && i > 1 ? C.green : C.blue, lens === 'pagerank' && i === 1, 12));
    ctx.fillStyle = C.white; roundedRect(ctx, 402, 18, 140, 214, 8); ctx.fill(); ctx.strokeStyle = C.line; ctx.stroke();
    drawSceneLabel(ctx, '问题', 420, 45, C.muted, 'left', 11, 700);
    const questionLines = lens === 'cc' ? ['近邻之间', '也互连吗？'] : lens === 'kcore' ? ['核心还是', '外围？'] : ['谁最能', '代表全局？'];
    questionLines.forEach((line, i) => drawSceneLabel(ctx, line, 420, 68 + i * 18, C.ink, 'left', 12, 800));
    drawSceneLabel(ctx, data.input, 420, 120, C.blue, 'left', 11, 700);
    drawSceneLabel(ctx, data.output, 420, 147, C.green, 'left', 12, 800);
    drawSceneLabel(ctx, data.cost, 420, 181, C.orange, 'left', 15, 800);
    drawSceneLabel(ctx, '复杂度', 420, 207, C.muted, 'left', 10, 600);
  };
  return (
    <div>
      <CanvasScene width={560} height={250} draw={draw} ariaLabel="根据问题选择 PageRank、in-degree k-core 或 clustering coefficient" />
      <div className="chip-row">
        {(Object.keys(lensData) as Lens[]).map((v) => <button key={v} className={`chip ${lens === v ? 'selected' : ''}`} aria-pressed={lens === v} onClick={() => setLens(v)}>{lensData[v].label}</button>)}
      </div>
      <div className="metrics">
        <div className="metric"><div className="l">输入</div><div className="v" style={{ fontSize: 18 }}>{data.input}</div></div>
        <div className="metric"><div className="l">输出</div><div className="v" style={{ fontSize: 18 }}>{data.output}</div></div>
        <div className="metric"><div className="l">复杂度</div><div className="v" style={{ fontSize: 18 }}>{data.cost}</div></div>
      </div>
      <Feedback text={data.feedback} tone="good" />
    </div>
  );
}

const stageLabels = ['近邻索引', '隶属强度', '有向 kNN 图', '图分数', '可视叠加'];

function ArchitectureModule() {
  const [lens, setLens] = useState<Lens>('pagerank');
  const [stage, setStage] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const weighted = lens === 'pagerank';
  const validStages = weighted ? [0,1,2,3,4] : [0,2,3,4];
  const facts = [
    ['indices[n,k] + distances[n,k]', '复用 UMAP 已有近邻数组'],
    ['weights[n,k] ∈ [0,1]', '仅 PageRank 读取隶属强度'],
    ['固定出度 k · 入度可变', '投影前有向图'],
    [lensData[lens].cost, lensData[lens].output],
    ['每点一个结构分数', '叠加、排序与筛选'],
  ];
  const draw = (ctx: CanvasRenderingContext2D) => {
    clearTrailScene(ctx, 560, 270);
    const xs = [62, 170, 278, 386, 494];
    ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(xs[0], 88); ctx.lineTo(xs[4], 88); ctx.stroke();
    const path = weighted ? [0,1,2,3,4] : [0,2,3,4];
    for (let i = 0; i < path.length - 1; i += 1) {
      const a = path[i], b = path[i + 1];
      if (validStages.indexOf(stage) >= i + 1) drawTrail(ctx, [{ x: xs[a], y: 88 }, { x: xs[b], y: 88 }], C.blue, 4);
    }
    stageLabels.forEach((label, i) => {
      const disabled = i === 1 && !weighted;
      ctx.fillStyle = disabled ? '#eef1f4' : i === stage ? '#e9f6ef' : C.white;
      ctx.strokeStyle = disabled ? C.line : i === stage ? C.green : C.blue;
      ctx.lineWidth = i === stage ? 4 : 2;
      roundedRect(ctx, xs[i] - 42, 55, 84, 66, 7); ctx.fill(); ctx.stroke();
      const lines = label.split(' ');
      lines.forEach((line, idx) => drawSceneLabel(ctx, line, xs[i], 79 + idx * 17, disabled ? C.muted : C.ink, 'center', 11, 800));
      if (disabled) drawSceneLabel(ctx, '无权旁路', xs[i], 109, C.orange, 'center', 9, 700);
    });
    ctx.fillStyle = C.white; roundedRect(ctx, 28, 145, 504, 98, 8); ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke();
    drawSceneLabel(ctx, stageLabels[stage], 48, 168, C.blue, 'left', 14, 800);
    drawSceneLabel(ctx, facts[stage][0], 48, 198, C.ink, 'left', 13, 800);
    drawSceneLabel(ctx, facts[stage][1], 48, 224, C.muted, 'left', 12, 600);
    drawSceneLabel(ctx, weighted ? '加权路径' : '无权路径', 509, 168, weighted ? C.purple : C.blue, 'right', 12, 800);
  };
  const selectStage = (next: number) => {
    if (next === 1 && !weighted) { setBlocked(true); return; }
    setBlocked(false); setStage(next);
  };
  const nextStage = () => {
    const index = validStages.indexOf(stage);
    if (index < validStages.length - 1) selectStage(validStages[index + 1]);
  };
  const prevStage = () => {
    const index = validStages.indexOf(stage);
    if (index > 0) selectStage(validStages[index - 1]);
  };
  const feedback = blocked ? 'k-core 与 CC 使用无权图，不读取隶属强度；该节点已跳过。' : stage === 0 ? '从 UMAP 已有的近邻索引与原始距离开始，无需重复近邻搜索。' : stage === 1 ? '把距离转成隶属强度边权，供 PageRank 使用。' : stage === 2 ? '形成固定出度、可变入度的投影前有向图。' : stage === 3 ? `计算 ${lensData[lens].output}，复杂度为 ${lensData[lens].cost}。` : '把每点结构分数叠加回散点图，支持排序、筛选和检查。';
  return (
    <div>
      <CanvasScene width={560} height={270} draw={draw} ariaLabel="UMAP 近邻数组到三种图分数的交互路径" onPointDown={(p) => { if (p.y >= 50 && p.y <= 126) { const idx = Math.round((p.x - 62) / 108); if (idx >= 0 && idx < 5) selectStage(idx); } }} />
      <div className="chip-row">
        {(Object.keys(lensData) as Lens[]).map((v) => <button key={v} className={`chip ${lens === v ? 'selected' : ''}`} aria-pressed={lens === v} onClick={() => { setLens(v); setStage(0); setBlocked(false); }}>{v === 'pagerank' ? 'PageRank' : v === 'kcore' ? 'k-core' : 'CC'}</button>)}
      </div>
      <div className="chip-row">
        {stageLabels.map((label, i) => <button key={label} className={`chip ${stage === i ? 'selected' : ''}`} disabled={i === 1 && !weighted} title={i === 1 && !weighted ? '该分数使用无权图' : label} onClick={() => selectStage(i)}>{label}</button>)}
      </div>
      <div className="step-ctrl">
        <button className="tiny ghost" title="上一步" aria-label="上一步" onClick={prevStage} disabled={validStages.indexOf(stage) === 0}>←</button>
        <span className="step-label"><b>{stageLabels[stage]}</b></span>
        <button className="tiny" title="下一步" aria-label="下一步" onClick={nextStage} disabled={validStages.indexOf(stage) === validStages.length - 1}>→</button>
      </div>
      <Feedback text={feedback} tone={blocked ? 'neutral' : stage === 4 ? 'good' : 'neutral'} />
    </div>
  );
}

type PaperResultView = 'representativeness' | 'balance' | 'classification' | 'kcore' | 'cc';

type PaperResultFigure = {
  id: PaperResultView;
  tab: string;
  figure: string;
  title: string;
  image: string;
  alt: string;
  imageClass?: string;
  caption: string;
  readings: Array<{ label: string; title: string; text: string }>;
  conclusion: string;
  evidence?: string;
};

const pageRankResultFigures: PaperResultFigure[] = [
  {
    id: 'representativeness',
    tab: 'Figure 3 · 代表性',
    figure: '论文 Figure 3',
    title: 'PageRank 能否选出有代表性的样本？',
    image: '/images/pagerank-representativeness.svg',
    alt: '论文 Figure 3：PageRank 与 k-medoids 在 MNIST 和 Fashion MNIST 上的代表性比较曲线',
    caption: '每个样本到最近代表点的平均余弦距离，数值越低，代表点越能覆盖整批数据。',
    readings: [
      { label: '横轴', title: '代表点预算 s', text: '越往右，允许从全部样本中选出的代表点越多。' },
      { label: '纵轴', title: '到最近代表点的平均余弦距离', text: '越低越好；它直接衡量选出的点是否足以代表其余样本。' },
      { label: '曲线', title: '先看小预算，再看差距如何变化', text: 'k-medoids 在 s=10、25、50 时略优；到 s=100 后，PageRank 已经快速接近它。' },
    ],
    conclusion: 'PageRank 没有直接优化这项距离，却能接近专门优化距离的 k-medoids，说明 kNN graph 的连接结构本身已经包含代表性信息。',
  },
  {
    id: 'balance',
    tab: 'Figure 4 · 类别平衡',
    figure: '论文 Figure 4',
    title: '选出的代表点是否照顾到各个类别？',
    image: '/images/pagerank-class-balance.svg',
    alt: '论文 Figure 4：PageRank 与 k-medoids 所选样本的类别分布差异比较曲线',
    caption: 'JSD 衡量所选样本与完整数据的类别比例差异，数值越低，类别分布越接近原数据。',
    readings: [
      { label: '横轴', title: '代表点预算 s', text: '比较从 10 个到 1000 个代表点时，两种方法的类别覆盖如何变化。' },
      { label: '纵轴', title: '类别分布的 Jensen–Shannon divergence', text: '越低越好；接近 0 表示选中样本的类别比例更接近完整数据。' },
      { label: '曲线', title: '重点看 s=200 之后', text: 'PageRank 的 JSD 明显更低；在 Fashion MNIST 上，k-medoids 甚至从 s=50 时的 0.20 升到 s=500 时的 0.36。' },
    ],
    conclusion: 'k-medoids 更容易偏向分布范围大、变化更丰富的类别；PageRank 从整张图的连接关系排序，因此在代表点增多后保持了更好的类别平衡。',
  },
  {
    id: 'classification',
    tab: 'Figure 5 · 分类效果',
    figure: '论文 Figure 5',
    title: '这些代表点真的能支持后续任务吗？',
    image: '/images/pagerank-downstream-classification.svg',
    alt: '论文 Figure 5：使用 PageRank 与 k-medoids 代表点训练 RBF-SVM 的分类准确率曲线',
    caption: '只用选出的代表点训练 RBF-SVM，再到所有未被选中的样本上测试。',
    readings: [
      { label: '横轴', title: '训练用代表点数量 s', text: '预算越大，分类器可以看到的训练样本越多。' },
      { label: '纵轴', title: '未选中样本上的分类准确率', text: '越高越好；它检验代表点是否保留了足够的类别信息。' },
      { label: '曲线', title: '看两种方法是否保持同一量级', text: 'Fashion MNIST 在 s≥500 时只相差约 2–3 个百分点；MNIST 在 s=1000 时，两者约落在 84%–89%。' },
    ],
    conclusion: 'PageRank 只需计算一次全局排序，就能在不同预算下直接截取前 s 个点；k-medoids 则要为每个预算重新运行，但最终分类效果仍处在相近水平。',
  },
];

const structureResultFigures: PaperResultFigure[] = [
  {
    id: 'kcore',
    tab: 'in-degree k-core · bag',
    figure: '论文综合案例图 B',
    title: '同一个 bag 大簇里，还藏着哪些稳定子结构？',
    image: '/images/crownjewel-kcore.png',
    alt: '论文综合案例图 B：Fashion MNIST 的 bag 类中 coreness 为 6 的样本形成多个子区域',
    imageClass: 'is-tall',
    caption: '浅蓝点是 bag 类的二维布局，青色点是 coreness=6 的节点，周围缩略图展示这些节点对应的原始服饰。',
    readings: [
      { label: '底图', title: '先把它看作一个 bag 大簇', text: '只看二维散点时，中间的大量浅蓝点很容易被理解成同一种 bag。' },
      { label: '筛选', title: '再只看 coreness=6 的青色节点', text: '这些点没有随机散开，而是在大簇内部形成了几个稳定的局部区域。' },
      { label: '原图', title: '最后检查节点对应的真实样本', text: '不同区域分别对应 messenger bag、waist pack、heavy texture、plain rectangular 以及带扣或提手等外观。' },
    ],
    conclusion: 'in-degree k-core 不是重新给 bag 聚一次类，而是在同一个大簇内部读出核心层级，并暴露二维布局没有明确标出的稳定子结构。',
    evidence: '量化旁证：coreness 与 HDBSCAN 成员概率在 MNIST、Fashion MNIST 上的相关系数仅为 0.04 和 −0.01，二者读取的并不是同一种信息。',
  },
  {
    id: 'cc',
    tab: 'clustering coefficient · 数字 6',
    figure: '论文 Figure 6',
    title: '一个数字 6 的大簇里，能否找到更一致的书写风格？',
    image: '/images/cc-mnist.png',
    alt: '论文 Figure 6：MNIST 数字 6 的高 clustering coefficient 区域及其手写样本',
    imageClass: 'is-wide',
    caption: '左侧是数字 6 的整体二维布局，右侧标出高 clustering coefficient 区域及其原始手写样本。',
    readings: [
      { label: '左图', title: '二维布局先显示一个数字 6 大簇', text: '整体都属于同一个数字类别，但二维位置没有直接说明内部的书写风格。' },
      { label: '高 CC', title: '寻找“邻居之间也互为邻居”的节点', text: '高 clustering coefficient 表示这个节点的近邻彼此也紧密相连，形成局部凝聚的小群体。' },
      { label: '原图', title: '回看每个高分区域的手写样本', text: '同一区域中的 6 会呈现相近的倾斜角度、圆环大小和笔画弯曲方式。' },
    ],
    conclusion: 'clustering coefficient 找到的不是另一个类别，而是大类别内部语义更一致的微邻域；图结构中的局部凝聚对应了真实可见的书写风格。',
    evidence: '量化旁证：MNIST 中 top 5% 高 CC 邻域的标签纯度为 0.98，随机同规模样本为 0.90±0.004；Fashion MNIST 上分别为 0.94 和 0.84±0.005。',
  },
];

function PaperResultsModule({ scope }: { scope: 'representative' | 'structure' }) {
  const availableFigures = scope === 'representative' ? pageRankResultFigures : structureResultFigures;
  const [view, setView] = useState<PaperResultView>(scope === 'representative' ? 'representativeness' : 'kcore');
  const active = availableFigures.find((item) => item.id === view) ?? availableFigures[0];

  return (
    <div className="paper-results">
      <div className="paper-result-tabs" role="tablist" aria-label="切换论文实验结果">
        {availableFigures.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={view === item.id}
            className={view === item.id ? 'active' : ''}
            onClick={() => setView(item.id)}
          >
            {item.tab}
          </button>
        ))}
      </div>

      <section className="paper-result-reader" aria-live="polite">
        <header className="paper-result-head">
          <span>{active.figure}</span>
          <h5>{active.title}</h5>
        </header>

        <div className="paper-result-content">
          <figure className="paper-result-figure">
            <div className="paper-result-image-wrap">
              <img className={active.imageClass ?? ''} src={active.image} alt={active.alt} loading="lazy" />
            </div>
            <figcaption>{active.caption}</figcaption>
          </figure>

          <div className="paper-result-reading">
            <span className="paper-result-reading-label">怎样读这张图</span>
            <dl>
              {active.readings.map((item) => (
                <div className="paper-result-reading-row" key={`${active.id}-${item.label}`}>
                  <dt>{item.label}</dt>
                  <dd><strong>{item.title}</strong><span>{item.text}</span></dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="paper-result-conclusion">
          <span>这张图说明</span>
          <p>{active.conclusion}</p>
        </div>
        {active.evidence ? <p className="paper-result-evidence">{active.evidence}</p> : null}
      </section>

      {scope === 'representative' ? <p className="paper-results-scope">“接近”指论文在 MNIST 与 Fashion MNIST 上对专门强基线的比较结果，不代表对所有数据集与所有 SOTA 方法的普遍结论。</p> : null}
    </div>
  );
}

function ActiveModule({ moduleId }: { moduleId: string }) {
  switch (moduleId) {
    case '1.1': return <DistortionModule />;
    case '1.2': return <CompareModule />;
    case '2.1': return <GraphAnatomyModule />;
    case '3.1': return <InDegreeImportanceModule />;
    case '3.2': return <PageRankModule />;
    case '3.3': return <KCoreModule />;
    case '3.4': return <CCModule />;
    case '4.1': return <ArchitectureModule />;
    case '5.1': return <PaperResultsModule scope="representative" />;
    case '5.2': return <PaperResultsModule scope="structure" />;
    case '5.3': return <StructureDistinctionModule />;
    default: return <Feedback text="当前交互模块未注册。" tone="bad" />;
  }
}

export const TrailWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  if (chapterId === 'hero' && moduleId === 'overview') return <HeroFlowScene />;
  if (chapterId === 'hero' && (moduleId === 'old' || moduleId === 'new')) return <HeroScene side={moduleId} />;
  if (moduleId === 'ana') return <AnalogyScene chapterId={chapterId} />;
  return <ActiveModule moduleId={moduleId} />;
};

export default TrailWidget;
