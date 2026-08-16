import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawFlower, drawFocusRing, drawHeat, sceneLabel } from './kit';

// PhotoAnalogy — one 244x130 auto-playing life animation per chapter. Each scene is
// one photography action inside the "focus" theme (one subject, one verb, one goal).
// Loops ~3s and pauses off-screen via IntersectionObserver. Chapter selection by id.

const W = 244;
const H = 130;
const DURATION = 2.8;

const PHASES: Record<string, [string, string, string]> = {
  'chap-1': ['模型在搜索目标', '注意力仍然散在背景', '没有监督，始终无法锁定主体'],
  'chap-2': ['读取文本中的词', '区分属性与命名主体', '取景框落到命名主体'],
  'chap-3': ['使用同一幅画面', '同步比较两类词', '属性锐利，物体名词弥散'],
  'chap-4': ['单层结果里有很多噪声', '对多个层取平均', '噪声减少，目标变清晰'],
  'chap-5': ['占位符没有语义身份', '换成自然语言指代', '模型锁定被命名的物体'],
  'chap-6': ['输入视频与文本', '抽取并聚合跨注意力', '直接定位并回答'],
  'chap-7': ['预测注意力图', '用掩码计算 BCE 误差', '反向校正到目标区域'],
  'chap-8': ['主干产生视觉与文本特征', '训练期接入监督分支', '推理期移除额外分支'],
  'chap-9': ['改变监督层数与数据量', '逐项观察消融结果', '6 层与更多数据更稳定'],
  'chap-10': ['读取各方法结果', '在同一指标下比较', 'SWIM 取得最佳结果'],
};

function render(ctx: CanvasRenderingContext2D, chapterId: string, p: number): void {
  const cx = 122;
  const fy = 78; // flower base
  clearScene(ctx, W, H);

  if (chapterId === 'chap-1') {
    // 盆栽花失焦：红色散焦范围松散包围整体；绿色对焦框反复
    // 尝试锁定指定物体，但始终偏离主体中心或尺寸不合适。
    drawFlower(ctx, cx, fy, 1.0, 0.28);
    const breathe = Math.sin(p * Math.PI * 2);
    drawHeat(ctx, cx, fy - 18, 47 + breathe * 3, C.red, 0, 0, W, H);
    drawFocusRing(ctx, cx, fy - 18, 37 + breathe * 3, 28 + breathe * 2, C.red, p);

    // The green frame follows an off-centre search path and never settles on the flower.
    const missX = cx - 22 + p * 44;
    const missY = fy - 32 + Math.sin(p * Math.PI * 2) * 9;
    ctx.save();
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(missX - 17, missY - 13, 34, 26);
    ctx.setLineDash([]);
    // Corner marks make this read as a focus box rather than another heat ring.
    ctx.beginPath();
    ctx.moveTo(missX - 17, missY - 6); ctx.lineTo(missX - 17, missY - 13); ctx.lineTo(missX - 10, missY - 13);
    ctx.moveTo(missX + 10, missY - 13); ctx.lineTo(missX + 17, missY - 13); ctx.lineTo(missX + 17, missY - 6);
    ctx.moveTo(missX - 17, missY + 6); ctx.lineTo(missX - 17, missY + 13); ctx.lineTo(missX - 10, missY + 13);
    ctx.moveTo(missX + 10, missY + 13); ctx.lineTo(missX + 17, missY + 13); ctx.lineTo(missX + 17, missY + 6);
    ctx.stroke();
    ctx.restore();
    sceneLabel(ctx, '失焦', 12, 12, C.red, 12);
  } else if (chapterId === 'chap-2') {
    // 取景框框选：游移的取景框最终框住命名主体。
    drawFlower(ctx, cx, fy, 1.0, 0.9);
    const span = 26 + Math.sin(p * Math.PI * 2) * 12;
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - span, fy - 52 - span * 0.4, span * 2, 58 + span * 0.8);
    drawFocusRing(ctx, cx, fy - 18, 22, 16, C.green, p);
    sceneLabel(ctx, '框住主体', 12, 12, C.ink, 13);
  } else if (chapterId === 'chap-3') {
    // 对比对焦：左「属性词」锐利，右「物体名词」弥散。
    drawFlower(ctx, 62, fy, 0.85, 0.95);
    drawFlower(ctx, 182, fy, 0.85, 0.4);
    drawHeat(ctx, 62, fy - 16, 12, C.green, 120, 70, 2, 30);
    drawHeat(ctx, 182, fy - 16, 44, C.red, 120, 70, 122, 30);
    ctx.fillStyle = C.border;
    ctx.fillRect(120, 0, 2, H);
    sceneLabel(ctx, '属性词', 30, 10, C.green, 12);
    sceneLabel(ctx, '物体名词', 152, 10, C.red, 12);
  } else if (chapterId === 'chap-4') {
    // One glance comparison: noisy single-layer map -> clean averaged map.
    sceneLabel(ctx, '单层：噪声多', 20, 18, C.red, 11);
    sceneLabel(ctx, '多层平均：目标清晰', 135, 18, C.green, 11);
    ctx.fillStyle = '#fff'; ctx.fillRect(17, 36, 82, 64); ctx.fillRect(145, 36, 82, 64);
    ctx.strokeStyle = C.red; ctx.lineWidth = 1.5; ctx.strokeRect(17, 36, 82, 64);
    ctx.strokeStyle = C.green; ctx.lineWidth = 2; ctx.strokeRect(145, 36, 82, 64);

    // The target is green; distracting responses are red.
    ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(58, 68, 9, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = C.red;
    ctx.beginPath(); ctx.arc(31, 50, 7, 0, Math.PI * 2); ctx.arc(84, 52, 6, 0, Math.PI * 2); ctx.arc(37, 88, 6, 0, Math.PI * 2); ctx.arc(83, 86, 7, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // One arrow and one clean result; no layer-by-layer bookkeeping.
    ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(108, 68); ctx.lineTo(135, 68); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(129, 62); ctx.lineTo(136, 68); ctx.lineTo(129, 74); ctx.stroke();
    ctx.globalAlpha = 0.2 + p * 0.8;
    ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(186, 68, 10 + p * 5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = Math.max(0, 0.42 - p * 0.42);
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(163, 49, 5, 0, Math.PI * 2); ctx.arc(211, 87, 5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  } else if (chapterId === 'chap-5') {
    // 选对焦模式：在「占位符(散焦)」与「自然语言(对焦)」之间切换。
    const useNL = p > 0.5;
    drawFlower(ctx, cx, fy, 1.0, useNL ? 0.95 : 0.4);
    drawHeat(ctx, cx, fy - 18, useNL ? 14 : 44, useNL ? C.green : C.red, W, H);
    drawFocusRing(ctx, cx, fy - 18, useNL ? 18 : 30, useNL ? 14 : 22, useNL ? C.green : C.red, p);
    sceneLabel(ctx, useNL ? '自然语言指代' : '<region> 占位符', 12, 12, useNL ? C.green : C.red, 12);
  } else if (chapterId === 'chap-6') {
    // 半按快门：快门按下，对焦框从宽收敛到紧贴主体。
    const prog = Math.min(1, p * 2);
    const half = 30 - prog * 12;
    drawFlower(ctx, cx, fy, 1.0, 0.3 + 0.7 * prog);
    drawHeat(ctx, cx, fy - 18, 46 - prog * 32, prog > 0.6 ? C.green : C.red, W, H);
    drawFocusRing(ctx, cx, fy - 18, half, half * 0.72, prog > 0.6 ? C.green : C.blue, p);
    // shutter button
    ctx.fillStyle = C.route;
    ctx.beginPath(); ctx.arc(212, 26, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = prog > 0.6 ? C.green : C.ink;
    ctx.beginPath(); ctx.arc(212, 26, 5, 0, Math.PI * 2); ctx.fill();
    sceneLabel(ctx, '半按快门', 12, 12, C.ink, 13);
  } else if (chapterId === 'chap-7') {
    // 练习校正对焦：先冲过头(红)再收敛到焦点(绿)。
    const err = Math.abs(Math.sin(p * Math.PI * 2)); // overshoot then settle
    const good = p > 0.7;
    drawFlower(ctx, cx, fy, 1.0, good ? 0.95 : 0.45);
    drawHeat(ctx, cx, fy - 18, good ? 14 : 30 + err * 18, good ? C.green : C.red, W, H);
    drawFocusRing(ctx, cx, fy - 18, good ? 18 : 24 + err * 8, good ? 14 : 18, good ? C.green : C.red, p);
    sceneLabel(ctx, '校正对焦', 12, 12, C.ink, 13);
  } else if (chapterId === 'chap-8') {
    // 机身光路：镜头→传感器，光线流动，成像清晰。
    drawFlower(ctx, cx, fy, 1.0, 0.9);
    drawFocusRing(ctx, cx, fy - 18, 18, 14, C.green, p);
    ctx.fillStyle = C.dark;
    ctx.fillRect(200, 40, 26, 40); // sensor
    const dot = (p * 70) % 70 + 148;
    ctx.fillStyle = C.blue;
    ctx.beginPath(); ctx.arc(dot, 60, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.border;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(cx + 16, fy - 16); ctx.lineTo(200, 60);
    ctx.stroke();
    ctx.setLineDash([]);
    sceneLabel(ctx, '镜头 → 传感器', 12, 12, C.ink, 13);
  } else if (chapterId === 'chap-9') {
    // 回看放大检查：放大镜扫过照片，圈内细节清晰。
    drawFlower(ctx, cx, fy, 1.0, 0.9);
    drawFocusRing(ctx, cx, fy - 18, 20, 15, C.green, 0.25);
    const lx = 60 + (p * 120);
    const ly = 58;
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(lx, ly, 17, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(39,68,110,0.08)';
    ctx.beginPath(); ctx.arc(lx, ly, 16, 0, Math.PI * 2); ctx.fill();
    drawHeat(ctx, lx, ly, 8, C.green, 40, 40, lx - 20, ly - 20);
    sceneLabel(ctx, '放大检查', 12, 12, C.ink, 13);
  } else {
    // chap-10 对比两照片：左模糊(旧)右清晰(新)。
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(12, 14, 104, 84);
    ctx.fillRect(128, 14, 104, 84);
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(12, 14, 104, 84);
    ctx.strokeRect(128, 14, 104, 84);
    drawFlower(ctx, 64, 78, 0.7, 0.4);
    drawFlower(ctx, 180, 78, 0.7, 0.95);
    drawHeat(ctx, 64, 62, 30, C.red, 104, 84, 12, 14);
    drawHeat(ctx, 180, 62, 10, C.green, 104, 84, 128, 14);
    sceneLabel(ctx, '旧', 16, 18, C.red, 12);
    sceneLabel(ctx, 'SWIM', 132, 18, C.green, 12);
  }
}

export const PhotoAnalogy: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playingRef = useRef(false);
  const progressRef = useRef(0);
  const startedAtRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const phases = PHASES[chapterId] || PHASES['chap-10'];

  const play = () => {
    if (progressRef.current >= 0.999) progressRef.current = 0;
    startedAtRef.current = performance.now() - progressRef.current * DURATION * 1000;
    playingRef.current = true;
    setPlaying(true);
  };

  const pause = () => {
    playingRef.current = false;
    setPlaying(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;
    const tick = () => {
      if (playingRef.current) {
        const next = Math.min(1, (performance.now() - startedAtRef.current) / (DURATION * 1000));
        progressRef.current = next;
        setProgress(next);
        if (next >= 1) {
          playingRef.current = false;
          setPlaying(false);
        }
      }
      render(ctx, chapterId, progressRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => cancelAnimationFrame(raf);
    const start = () => { raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => { stop(); disconnect(); };
  }, [chapterId]);

  const phaseIndex = progress < 0.34 ? 0 : progress < 0.72 ? 1 : 2;

  return (
    <div className="analogy-demo">
      <canvas ref={canvasRef} width={W} height={H} aria-label={`${phases[phaseIndex]}。可播放的概念演示。`} />
      <div className="analogy-timeline" aria-hidden="true">
        <span style={{ width: `${Math.max(2, progress * 100)}%` }} />
      </div>
      <div className="analogy-controls">
        <button className="analogy-play" type="button" onClick={playing ? pause : play}>
          {playing ? '暂停' : progress >= 0.999 ? '重播' : '播放演示'}
        </button>
        <span className="analogy-phase" aria-live="polite">{phaseIndex + 1}/3 · {phases[phaseIndex]}</span>
      </div>
    </div>
  );
};

export default PhotoAnalogy;
