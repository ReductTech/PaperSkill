import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0', floor: '#dce8d2', line: '#d7deea', ink: '#21324a', muted: '#68778f',
  blue: '#27446e', green: '#228d5c', orange: '#d97706', purple: '#7c3aed', white: '#ffffff',
};

const stages = [
  {
    id: 'pano', name: 'HY-Pano 2.0', short: '全景初始化',
    title: '把局部线索展开成 360° 世界种子',
    input: '文本提示或单张参考图',
    action: '生成连续 ERP 全景，并用隐式映射、循环填充与像素融合处理投影和环形接缝。',
    result: '获得能看向四周的全局起点，但此时还没有覆盖远处和遮挡背面。',
    why: '先建立全局上下文，后续轨迹规划才知道哪些方向值得继续探索。',
    evidence: '论文 Section 3.1-3.2、Figure 3；全景质量需按表 4 的 I2P / T2P 子协议阅读。',
  },
  {
    id: 'nav', name: 'WorldNav', short: '场景感知规划',
    title: '把有限相机预算投向真正的盲区',
    input: '全景、点云、语义掩码与可行走区域',
    action: '识别遮挡背面、远端、环绕、漫游和航拍需求，并以 NavMesh 与碰撞约束生成互补轨迹。',
    result: '相机不再漫无目的移动，而是主动选择能增加空间覆盖的观察路线。',
    why: '轨迹决定下一步会生成哪些新区域；重复看已知区域只会浪费视频扩散预算。',
    evidence: '论文 Section 3.3、Figure 4-5；五类轨迹是生成路径中的互补策略。',
  },
  {
    id: 'stereo', name: 'WorldStereo 2.0', short: '关键帧世界扩展',
    title: '沿规划轨迹补出跨视角一致的关键帧',
    input: '全景起点、目标轨迹与历史关键帧',
    action: '在关键帧潜空间执行四步视频扩散，并用全局几何记忆与局部选择记忆维持跨轨迹一致性。',
    result: '世界从一个全景起点扩展成多条路线上的清晰关键观察，远端与背面逐步被补齐。',
    why: '关键帧减少重复和模糊观察；跨轨迹记忆避免不同路线各自生成互相矛盾的世界。',
    evidence: '论文 Section 4、Figure 6-8；四步指蒸馏后的采样步数，不代表整套世界生成实时完成。',
  },
  {
    id: 'mirror', name: 'WorldMirror 2.0', short: '几何恢复与合成',
    title: '把多视角观察凝结成持久三维资产',
    input: '生成关键帧，或真实多视图 / 视频观察',
    action: '一次前馈联合预测相机、点图、深度、法线和 3DGS，再完成深度对齐、增密与冗余高斯抑制。',
    result: '得到可保存、可重新渲染并交给 WorldLens 漫游的 3DGS、Mesh 或点云资产。',
    why: '只有显式几何落地后，生成世界才能被持续观察、编辑和运行，而不是一段看完即结束的视频。',
    evidence: '论文 Section 5-6、Figure 2 与 Figure 12；生成路径和重建路径在此共享同一重建核心。',
  },
] as const;

type Transition = { id: number; from: number; to: number };

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.ink, size = 12, align: CanvasTextAlign = 'left') {
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px Segoe UI, sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 10) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawCamera(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  roundedRect(ctx, -13, -9, 22, 18, 4); ctx.fill();
  ctx.beginPath(); ctx.moveTo(8, -6); ctx.lineTo(18, -11); ctx.lineTo(18, 11); ctx.lineTo(8, 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(-3, 0, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function PipelineCanvas({ transition }: { transition: Transition }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const lastProgressRef = useRef(0);
  const drawRef = useRef<(progress: number) => void>(() => undefined);

  drawRef.current = (progress) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const eased = 1 - Math.pow(1 - progress, 3);
    const level = transition.from + (transition.to - transition.from) * eased;
    const reveal = (index: number) => clamp(level - index + 1, 0, 1);
    const pano = reveal(0), nav = reveal(1), stereo = reveal(2), mirror = reveal(3);

    ctx.clearRect(0, 0, 760, 390);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 760, 390);
    ctx.fillStyle = C.floor; ctx.fillRect(24, 254, 712, 108);

    const panoWidth = 560 * pano;
    const panoX = 380 - panoWidth / 2;
    ctx.save();
    ctx.globalAlpha = .18 + .82 * pano;
    ctx.fillStyle = C.white;
    roundedRect(ctx, panoX, 42, panoWidth, 214, 18); ctx.fill();
    ctx.strokeStyle = C.blue; ctx.lineWidth = 3;
    roundedRect(ctx, panoX, 42, panoWidth, 214, 18); ctx.stroke();
    ctx.restore();

    if (pano > .04) {
      ctx.save();
      ctx.beginPath(); ctx.rect(panoX, 42, panoWidth, 214); ctx.clip();
      ctx.fillStyle = '#dbe8f6'; ctx.fillRect(100, 62, 560, 86);
      ctx.fillStyle = '#eef3e8'; ctx.beginPath(); ctx.moveTo(100, 148); ctx.lineTo(225, 104); ctx.lineTo(325, 155); ctx.lineTo(450, 94); ctx.lineTo(660, 151); ctx.lineTo(660, 252); ctx.lineTo(100, 252); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c9d8bd'; ctx.fillRect(112, 174, 104, 78);
      ctx.fillStyle = '#8fa77f'; ctx.fillRect(494, 160, 118, 92);
      ctx.fillStyle = '#f7d7a7'; ctx.fillRect(314, 128, 92, 124);
      ctx.strokeStyle = '#b8c5d5'; ctx.lineWidth = 2;
      for (let x = 156; x < 650; x += 92) { ctx.beginPath(); ctx.moveTo(x, 52); ctx.lineTo(x, 252); ctx.stroke(); }
      ctx.restore();
      label(ctx, '360° 世界种子', 380, 72, C.blue, 12, 'center');
      ctx.strokeStyle = C.orange; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(380, 278, 36, Math.PI * .18, Math.PI * 1.82); ctx.stroke();
      ctx.fillStyle = C.orange; ctx.beginPath(); ctx.moveTo(346, 288); ctx.lineTo(337, 276); ctx.lineTo(352, 274); ctx.closePath(); ctx.fill();
    }

    if (nav > .02) {
      const route = [
        { x: 174, y: 308 }, { x: 260, y: 278 }, { x: 350, y: 319 }, { x: 462, y: 286 }, { x: 584, y: 315 },
      ];
      ctx.save(); ctx.globalAlpha = nav;
      ctx.strokeStyle = C.orange; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      route.forEach((point, index) => { if (index === 0) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y); });
      ctx.stroke();
      route.forEach((point, index) => { ctx.fillStyle = index === route.length - 1 ? C.green : C.white; ctx.strokeStyle = C.orange; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(point.x, point.y, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
      const segmentFloat = nav * (route.length - 1);
      const segment = Math.min(route.length - 2, Math.floor(segmentFloat));
      const local = segmentFloat - segment;
      const from = route[segment], to = route[segment + 1];
      drawCamera(ctx, from.x + (to.x - from.x) * local, from.y + (to.y - from.y) * local, Math.atan2(to.y - from.y, to.x - from.x), C.blue);
      label(ctx, 'WorldNav 把镜头送往盲区', 380, 352, C.orange, 11, 'center');
      ctx.restore();
    }

    if (stereo > .02) {
      const frames = [
        { x: 154, y: 114, tilt: -.07 }, { x: 286, y: 92, tilt: .04 }, { x: 418, y: 104, tilt: -.03 }, { x: 550, y: 88, tilt: .06 },
      ];
      ctx.save(); ctx.globalAlpha = stereo;
      ctx.strokeStyle = C.purple; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
      ctx.beginPath(); frames.forEach((frame, index) => { if (index === 0) ctx.moveTo(frame.x, frame.y + 42); else ctx.lineTo(frame.x, frame.y + 42); }); ctx.stroke(); ctx.setLineDash([]);
      frames.forEach((frame, index) => {
        const appear = clamp(stereo * frames.length - index, 0, 1);
        ctx.save(); ctx.globalAlpha = appear; ctx.translate(frame.x, frame.y); ctx.rotate(frame.tilt);
        ctx.fillStyle = C.white; ctx.strokeStyle = C.purple; ctx.lineWidth = 3; roundedRect(ctx, -42, -29, 84, 58, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#dbe8f6'; ctx.fillRect(-34, -21, 68, 22);
        ctx.fillStyle = '#a9bf99'; ctx.beginPath(); ctx.moveTo(-34, 13); ctx.lineTo(-8, -3); ctx.lineTo(8, 11); ctx.lineTo(28, -8); ctx.lineTo(34, 17); ctx.lineTo(-34, 17); ctx.closePath(); ctx.fill();
        label(ctx, `K${index + 1}`, 0, 42, C.purple, 9, 'center');
        ctx.restore();
      });
      label(ctx, '关键帧 + 跨轨迹记忆', 380, 36, C.purple, 11, 'center');
      ctx.restore();
    }

    if (mirror > .02) {
      ctx.save(); ctx.globalAlpha = mirror;
      const cx = 380, cy = 192;
      ctx.strokeStyle = C.green; ctx.lineWidth = 2;
      for (let i = 0; i < 7; i += 1) {
        const inset = i * 7 * mirror;
        roundedRect(ctx, 122 + inset, 55 + inset * .32, 516 - inset * 2, 190 - inset * .64, 15); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(34,141,92,.12)'; roundedRect(ctx, 244, 126, 272, 118, 12); ctx.fill();
      const nodes = [
        [276, 212], [304, 181], [338, 223], [366, 166], [400, 207], [434, 174], [468, 218], [494, 188],
      ];
      nodes.forEach(([x, y], index) => { const radius = 4 + (index % 3); ctx.fillStyle = index % 2 ? C.green : C.orange; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); });
      ctx.fillStyle = C.white; ctx.strokeStyle = C.green; ctx.lineWidth = 3; roundedRect(ctx, cx - 92, cy - 25, 184, 50, 8); ctx.fill(); ctx.stroke();
      label(ctx, 'WorldMirror 2.0', cx, cy - 2, C.green, 14, 'center');
      label(ctx, '相机 · 几何 · 3DGS', cx, cy + 16, C.muted, 9, 'center');
      ctx.fillStyle = C.green; roundedRect(ctx, 548, 330, 130, 28, 6); ctx.fill();
      label(ctx, '可漫游三维资产', 613, 349, C.white, 10, 'center');
      ctx.strokeStyle = C.green; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(514, 318); ctx.lineTo(548, 344); ctx.stroke();
      label(ctx, '显式世界完成', 380, 378, C.green, 12, 'center');
      ctx.restore();
    }
  };

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, 760, 390); } catch { return; }
    ctxRef.current = ctx;
    const paint = () => { drawRef.current(lastProgressRef.current); canvas.classList.add('is-ready'); };
    const disconnect = observeCanvas(canvas, paint, () => undefined);
    paint();
    return () => { ctxRef.current = null; disconnect(); };
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !ctxRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { lastProgressRef.current = 1; drawRef.current(1); return; }
    let frame = 0;
    const startedAt = performance.now();
    const tick = (time: number) => {
      const progress = Math.min(1, (time - startedAt) / 820);
      lastProgressRef.current = progress;
      drawRef.current(progress);
      canvas.classList.add('is-ready');
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [transition]);

  return <canvas ref={ref} width={760} height={390} aria-label="四阶段造物管线逐步完善三维世界的动画" />;
}

export const HyCreationPipeline: React.FC<WidgetProps> = () => {
  const [stageIndex, setStageIndex] = useState(0);
  const [transition, setTransition] = useState<Transition>({ id: 0, from: -1, to: 0 });
  const stage = stages[stageIndex];

  const selectStage = (next: number) => {
    if (next === stageIndex) return;
    setTransition((current) => ({ id: current.id + 1, from: stageIndex, to: next }));
    setStageIndex(next);
  };

  const next = () => {
    const target = stageIndex === stages.length - 1 ? 0 : stageIndex + 1;
    selectStage(target);
  };

  return <div className="creation-pipeline">
    <div className="creation-stage-tabs" role="tablist" aria-label="选择四阶段造物管线步骤">
      {stages.map((item, index) => <button key={item.id} type="button" role="tab" aria-selected={stageIndex === index} className={stageIndex === index ? 'selected' : index < stageIndex ? 'complete' : ''} onClick={() => selectStage(index)}><b>{index + 1}</b><span>{item.name}</span><small>{item.short}</small></button>)}
    </div>

    <div className="creation-stage-main">
      <div className="creation-canvas-shell">
        <PipelineCanvas transition={transition} />
        <div className="creation-canvas-caption"><span>阶段 {stageIndex + 1} / 4</span><strong>{stage.short}</strong></div>
      </div>

      <section className="creation-stage-detail" aria-live="polite">
        <header><span>{stage.name}</span><h5>{stage.title}</h5></header>
        <div className="creation-stage-ledger">
          <p><b>接收什么</b>{stage.input}</p>
          <p><b>执行什么</b>{stage.action}</p>
          <p><b>新增什么</b>{stage.result}</p>
          <p><b>为什么需要</b>{stage.why}</p>
        </div>
        <small>{stage.evidence}</small>
      </section>
    </div>

    <div className="creation-progress-ledger" aria-label="当前世界完成度">
      {stages.map((item, index) => <div key={item.id} className={index < stageIndex ? 'complete' : index === stageIndex ? 'current' : 'future'}><span>{index < stageIndex ? '已接入' : index === stageIndex ? '正在形成' : '等待'}</span><strong>{item.short}</strong></div>)}
    </div>

    <div className="creation-controls">
      <button type="button" className="ghost" aria-label="返回上一个造物阶段" title="返回上一个造物阶段" disabled={stageIndex === 0} onClick={() => selectStage(stageIndex - 1)}>←</button>
      <p>{stageIndex === stages.length - 1 ? '四阶段已连成完整生成链；多视图或视频重建会跳过前三步，直接进入共享的 WorldMirror 2.0。' : '点击下一步，观察世界在同一画面中继续增加新的结构与能力。'}</p>
      <button type="button" onClick={next}>{stageIndex === stages.length - 1 ? '从头再看 ↺' : `下一步：${stages[stageIndex + 1].name} →`}</button>
    </div>
  </div>;
};
