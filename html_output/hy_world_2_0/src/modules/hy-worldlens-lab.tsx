import React, { useEffect, useRef, useState } from 'react';
import { clamp, easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { EvidenceMediaDrawer } from './hy-paper-evidence';

type RuntimeMode = 'lighting' | 'collision' | 'character';

const C = {
  bg: '#f5f8f0', line: '#d7deea', ink: '#21324a', muted: '#68778f', blue: '#27446e',
  green: '#228d5c', red: '#c43f52', orange: '#d97706', purple: '#7c3aed', white: '#ffffff',
};

const modes: Array<{
  id: RuntimeMode;
  name: string;
  short: string;
  action: string;
  effect: string;
  boundary: string;
}> = [
  {
    id: 'lighting',
    name: 'IBL 环境光照',
    short: '让资产接入环境光',
    action: '从场景环境提取光照方向与色调，在运行时重新照亮 3DGS / Mesh 与角色。',
    effect: '太阳移动时，建筑明暗面和地面投影同步变化，表达资产进入引擎后的光照适配。',
    boundary: '文章与官方页面用于解释 IBL 能力；教程动画不是物理正确性或材质精度测试。',
  },
  {
    id: 'collision',
    name: '碰撞代理',
    short: '把可见表面变成可阻挡空间',
    action: '从显式几何或代理结构建立可碰撞边界，让角色移动不再只穿过一团可渲染高斯。',
    effect: '角色沿路径接近墙体后被边界截停，红色虚影显示“只渲染、不建碰撞”时会发生的穿模。',
    boundary: '碰撞效果来自官方运行时展示；论文没有给出统一碰撞准确率或所有场景稳定性指标。',
  },
  {
    id: 'character',
    name: '角色漫游',
    short: '让相机与角色进入世界',
    action: '运行时接入第一/第三人称控制、可导航区域和碰撞反馈，在生成完成后持续探索资产。',
    effect: '角色沿折线路径上台阶，相机保持第三人称跟随；离线模型不在每一步重新生成整座世界。',
    boundary: '实时指的是生成后资产的渲染与交互，不代表完整 712 秒世界生成管线已经实时化。',
  },
];

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.ink, size = 12, align: CanvasTextAlign = 'left') {
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px Segoe UI, sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}

function pathPoint(points: Array<[number, number]>, progress: number) {
  const lengths = points.slice(1).map((point, index) => Math.hypot(point[0] - points[index][0], point[1] - points[index][1]));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  let distance = clamp(progress, 0, 1) * total;
  for (let index = 0; index < lengths.length; index += 1) {
    if (distance <= lengths[index] || index === lengths.length - 1) {
      const local = lengths[index] ? distance / lengths[index] : 0;
      const from = points[index];
      const to = points[index + 1];
      return {
        x: from[0] + (to[0] - from[0]) * local,
        y: from[1] + (to[1] - from[1]) * local,
        angle: Math.atan2(to[1] - from[1], to[0] - from[0]),
      };
    }
    distance -= lengths[index];
  }
  return { x: points[0][0], y: points[0][1], angle: 0 };
}

function drawCharacter(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, -14, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(0, 18);
  ctx.moveTo(0, 3);
  ctx.lineTo(-10, 11);
  ctx.moveTo(0, 3);
  ctx.lineTo(10, 11);
  ctx.moveTo(0, 18);
  ctx.lineTo(-8, 31);
  ctx.moveTo(0, 18);
  ctx.lineTo(9, 31);
  ctx.stroke();
  ctx.restore();
}

function RuntimeCanvas({ mode, replayKey, onRunning }: { mode: RuntimeMode; replayKey: number; onRunning: (running: boolean) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const progressRef = useRef(0);

  const paint = (rawProgress: number) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const p = easeInOutQuad(clamp(rawProgress, 0, 1));
    ctx.clearRect(0, 0, 680, 360);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, 680, 360);
    ctx.fillStyle = '#dceaf6';
    ctx.fillRect(0, 0, 680, 210);
    ctx.fillStyle = '#dce8d2';
    ctx.fillRect(0, 210, 680, 150);
    ctx.strokeStyle = 'rgba(104,119,143,.12)';
    for (let x = 20; x < 680; x += 44) {
      ctx.beginPath();
      ctx.moveTo(x, 210);
      ctx.lineTo(x - 32, 360);
      ctx.stroke();
    }

    const buildingX = 352;
    ctx.fillStyle = '#91a987';
    ctx.fillRect(buildingX, 106, 174, 146);
    ctx.fillStyle = '#6f8d68';
    ctx.fillRect(buildingX + 26, 152, 54, 100);
    ctx.fillStyle = '#d4b986';
    ctx.fillRect(buildingX + 104, 136, 42, 116);
    ctx.fillStyle = '#c9d5be';
    ctx.fillRect(248, 248, 238, 18);
    ctx.fillRect(286, 230, 200, 18);
    ctx.fillRect(324, 212, 162, 18);

    if (mode === 'lighting') {
      const sunX = 90 + p * 470;
      const sunY = 84 - Math.sin(p * Math.PI) * 38;
      ctx.fillStyle = '#f4b942';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(217,119,6,.35)';
      ctx.lineWidth = 2;
      for (let index = 0; index < 8; index += 1) {
        const angle = index * Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(sunX + Math.cos(angle) * 25, sunY + Math.sin(angle) * 25);
        ctx.lineTo(sunX + Math.cos(angle) * 34, sunY + Math.sin(angle) * 34);
        ctx.stroke();
      }
      const shadow = (sunX - 340) * .35;
      ctx.fillStyle = 'rgba(23,36,58,.18)';
      ctx.beginPath();
      ctx.moveTo(buildingX + 20, 252);
      ctx.lineTo(buildingX + 170, 252);
      ctx.lineTo(buildingX + 170 - shadow, 318);
      ctx.lineTo(buildingX + 20 - shadow, 318);
      ctx.closePath();
      ctx.fill();
      const warm = Math.round(65 + p * 80);
      ctx.fillStyle = `rgba(255,${200 + Math.round(p * 35)},${warm},.12)`;
      ctx.fillRect(buildingX, 106, 174, 146);
      label(ctx, '环境光方向', sunX, sunY + 43, C.orange, 10, 'center');
      label(ctx, '同一资产 · 光照与阴影同步变化', 340, 334, C.green, 12, 'center');
    }

    if (mode === 'collision') {
      const wallX = 408;
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 4;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.moveTo(92, 288);
      ctx.lineTo(532, 288);
      ctx.stroke();
      ctx.setLineDash([]);
      const intendedX = 92 + p * 440;
      const stoppedX = Math.min(intendedX, wallX - 20);
      ctx.globalAlpha = p > .72 ? .34 : 0;
      drawCharacter(ctx, intendedX, 272, C.red, .82);
      ctx.globalAlpha = 1;
      drawCharacter(ctx, stoppedX, 272, C.blue, .9);
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(wallX, 214);
      ctx.lineTo(wallX, 318);
      ctx.stroke();
      label(ctx, '碰撞边界', wallX + 10, 228, C.green, 10);
      label(ctx, p > .72 ? '角色被代理边界截停' : '沿可行路径接近墙体', 340, 334, p > .72 ? C.green : C.blue, 12, 'center');
    }

    if (mode === 'character') {
      const route: Array<[number, number]> = [[86, 302], [210, 302], [258, 260], [324, 242], [390, 224], [492, 224]];
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      route.forEach((point, index) => index ? ctx.lineTo(point[0], point[1]) : ctx.moveTo(point[0], point[1]));
      ctx.stroke();
      const actor = pathPoint(route, p);
      drawCharacter(ctx, actor.x, actor.y - 20, C.purple, .82);
      const cameraX = actor.x - 72;
      const cameraY = actor.y - 82;
      ctx.fillStyle = C.blue;
      ctx.fillRect(cameraX - 12, cameraY - 8, 25, 16);
      ctx.beginPath();
      ctx.moveTo(cameraX + 12, cameraY - 5);
      ctx.lineTo(cameraX + 24, cameraY - 11);
      ctx.lineTo(cameraX + 24, cameraY + 11);
      ctx.lineTo(cameraX + 12, cameraY + 5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(39,68,110,.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cameraX + 24, cameraY);
      ctx.lineTo(actor.x, actor.y - 14);
      ctx.stroke();
      label(ctx, '第三人称相机跟随', cameraX, cameraY - 18, C.blue, 10, 'center');
      label(ctx, p > .95 ? '资产已生成，运行时继续漫游' : '角色沿折线与台阶移动', 340, 334, p > .95 ? C.green : C.orange, 12, 'center');
    }
  };

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, 680, 360); } catch { return; }
    ctxRef.current = ctx;
    const redraw = () => { paint(progressRef.current); canvas.classList.add('is-ready'); };
    const disconnect = observeCanvas(canvas, redraw, () => undefined);
    redraw();
    return () => { ctxRef.current = null; disconnect(); };
  }, []);

  useEffect(() => {
    if (!ctxRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      progressRef.current = 1;
      paint(1);
      onRunning(false);
      return;
    }
    let frame = 0;
    const started = performance.now();
    onRunning(true);
    const tick = (time: number) => {
      const progress = clamp((time - started) / 1800, 0, 1);
      progressRef.current = progress;
      paint(progress);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else onRunning(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [mode, replayKey, onRunning]);

  return <canvas ref={ref} width={680} height={360} aria-label={`${modes.find((item) => item.id === mode)?.name}运行时动画`} />;
}

export const HyWorldLensLab: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<RuntimeMode>('lighting');
  const [replayKey, setReplayKey] = useState(0);
  const [running, setRunning] = useState(false);
  const active = modes.find((item) => item.id === mode) ?? modes[0];

  const selectMode = (next: RuntimeMode) => {
    setMode(next);
    setReplayKey((value) => value + 1);
  };

  return (
    <div className={`worldlens-lab ${running ? 'is-running' : ''}`}>
      <div className="worldlens-modes" role="tablist" aria-label="选择 WorldLens 运行时能力">
        {modes.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={item.id === mode} className={item.id === mode ? 'selected' : ''} onClick={() => selectMode(item.id)}>
            <strong>{item.name}</strong><span>{item.short}</span>
          </button>
        ))}
      </div>
      <div className="worldlens-stage">
        <RuntimeCanvas mode={mode} replayKey={replayKey} onRunning={setRunning} />
        <div className="worldlens-status"><i aria-hidden="true" /><span>{running ? '运行时动画演示中' : '动画完成，可切换能力'}</span></div>
      </div>
      <section className="worldlens-detail" aria-live="polite">
        <header><span>当前运行时层</span><h5>{active.name}</h5><button type="button" onClick={() => setReplayKey((value) => value + 1)} aria-label={`重播${active.name}动画`} title={`重播${active.name}动画`}>↺</button></header>
        <div><p><b>运行时做什么</b>{active.action}</p><p><b>画面如何读</b>{active.effect}</p><p><b>证据边界</b>{active.boundary}</p></div>
      </section>
      <div className="feedback good">WorldLens 位于生成或重建完成之后：它让已有资产可实时渲染、打光和碰撞，不负责把 712 秒的完整世界生成过程变成实时。</div>
      <EvidenceMediaDrawer mediaType="官方 GIF" src="/images/official-interactive.gif" title="角色漫游与碰撞演示" caption="腾讯混元官方演示用于说明生成后资产能够支持角色移动与空间交互；它不是碰撞准确率、帧率或物理真实性的统一基准。" alt="HY-World 2.0 官方角色漫游与碰撞演示" sourceUrl="https://github.com/Tencent-Hunyuan/HY-World-2.0" sourceLabel="腾讯混元官方仓库素材 ↗" />
    </div>
  );
};
