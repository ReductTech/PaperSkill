import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import * as K from './roadKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 260;

/** linear interpolation between two #rrggbb colors */
const lerpColor = (a: string, b: string, t: number): string => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const pc = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `#${pc.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};

/** smoothstep eased 0→1 over [edge0, edge1] */
const smooth = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

// 镜头视差幅度（机制示意）：远处地面 < 房屋 < 近处树
const PAN_GROUND = 10;
const PAN_HOUSE = 30;
const PAN_TREE = 54;

export const Mod82: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pos, setPos] = useState(0);
  const stateRef = useRef({ pos: 0 });
  stateRef.current.pos = pos;

  // 漂移量：去程基本稳定，掉头返程后持续累积（连续，无突变）
  const drift = smooth(0.3, 1, pos);
  const driftPct = Math.round(drift * 100);
  const arrived = pos >= 0.98;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    let time = 0;

    // U-shaped out-and-back route along the bottom
    const pathX = (t: number) => 60 + Math.sin(t * Math.PI) * 440;
    const pathY = () => 232;
    // 归一化镜头偏移：0=起点视角，1=最远端视角，返程连续回正
    const camPan = (t: number) => (pathX(t) - pathX(0)) / 440;

    /** 面板内的街景：pan 为镜头偏移(0..1)，m 为漂移量(0..1)，jitter 仅无记忆侧使用 */
    const drawScene = (ox: number, pan: number, m: number, t: number) => {
      // 远景地面条带：视差最小
      ctx.fillStyle = K.C.ground;
      ctx.fillRect(ox + 2 - pan * PAN_GROUND, 118, 258 + PAN_GROUND * 2, 44);
      // 出发时的原始取景残影（虚线轮廓），便于看出“视角有没有回正”
      ctx.save();
      ctx.strokeStyle = 'rgba(104,119,143,0.55)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(ox + 70 - 13, 122 - 25, 26, 25);
      ctx.restore();
      const jitter = Math.sin(t * 0.05) * m * 2;
      K.drawHouse(ctx, ox + 70 - pan * PAN_HOUSE + m * 22 + jitter, 122, 1.1, lerpColor(K.C.depth, K.C.bad, m));
      K.drawHouse(ctx, ox + 170 - pan * PAN_HOUSE - m * 14, 132 - m * 6, 0.85, lerpColor(K.C.ground, K.C.emph, m));
      // 近处树：视差最大，且随漂移“长错位置”
      K.drawTree(ctx, ox + 226 - pan * PAN_TREE - m * 36, 128, 1);
    };

    // 无记忆：镜头偏移估计逐渐失准（返程回不正）+ 街景漂移
    const townDrifting = (ox: number, m: number, pan: number, t: number) => {
      K.drawPanel(ctx, ox, 14, 262, 150, lerpColor(K.C.guide, K.C.bad, m));
      ctx.save();
      ctx.beginPath();
      ctx.rect(ox + 2, 16, 258, 146);
      ctx.clip();
      if (m > 0.02) {
        ctx.fillStyle = `rgba(196,63,82,${(m * 0.09).toFixed(3)})`;
        ctx.fillRect(ox + 2, 16, 258, 146);
      }
      // 失真的镜头偏移：返程时残留错位，回不到原始取景
      const badPan = pan * (1 - 0.35 * m) + m * 0.12;
      drawScene(ox, badPan, m, t);
      K.drawLabel(ctx, '无记忆', ox + 10, 34, K.C.ink, 12);
      if (m >= 0.98) {
        K.drawLabel(ctx, '镜头回不正 + 街景变了样 ✗', ox + 10, 52, K.C.bad, 11);
      } else if (m > 0.03) {
        K.drawLabel(ctx, `视角错位 · 漂移 ${Math.round(m * 100)}%`, ox + 10, 52, lerpColor(K.C.muted, K.C.bad, m), 11);
      } else if (pan > 0.03) {
        K.drawLabel(ctx, '镜头随去程偏移', ox + 10, 52, K.C.muted, 11);
      }
      ctx.restore();
    };

    // 几何检索记忆：镜头偏移精确跟随，返程准确回正；校准脉冲随返程连续增强
    const townStable = (ox: number, p: number, pan: number, t: number) => {
      const cal = smooth(0.45, 0.9, p);
      K.drawPanel(ctx, ox, 14, 262, 150, lerpColor(K.C.guide, K.C.good, cal));
      ctx.save();
      ctx.beginPath();
      ctx.rect(ox + 2, 16, 258, 146);
      ctx.clip();
      drawScene(ox, pan, 0, t);
      K.drawLabel(ctx, '几何检索记忆', ox + 10, 34, K.C.ink, 12);
      if (p >= 0.98) {
        K.drawLabel(ctx, '视角回正 · 还是老样子 ✓', ox + 10, 52, K.C.good, 11);
      } else if (cal > 0.03) {
        K.drawLabel(ctx, '按几何检索校准视角…', ox + 10, 52, lerpColor(K.C.muted, K.C.aux, cal), 11);
      } else if (pan > 0.03) {
        K.drawLabel(ctx, '镜头随去程偏移', ox + 10, 52, K.C.muted, 11);
      }
      // 校准脉冲：从记忆库流向小车的紫色虚线，透明度与呼吸随返程连续增强
      if (cal > 0.03) {
        const alpha = cal * (0.35 + 0.25 * Math.sin(t * 0.12));
        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.strokeStyle = K.C.aux;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 5]);
        ctx.lineDashOffset = -t * 0.6;
        ctx.beginPath();
        ctx.moveTo(ox + 40, 164);
        ctx.quadraticCurveTo(ox + 20, 205, pathX(p) + 16, pathY() - 12);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    };

    const frame = () => {
      time += 1;
      const p = stateRef.current.pos;
      const m = smooth(0.3, 1, p);
      const pan = camPan(p);
      K.clearScene(ctx, W, H);
      townDrifting(12, m, pan, time);
      townStable(286, p, pan, time);
      // route
      ctx.strokeStyle = K.C.road;
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(pathX(0), pathY());
      for (let i = 1; i <= 40; i++) ctx.lineTo(pathX(i / 40), pathY());
      ctx.stroke();
      ctx.setLineDash([]);
      K.drawFlag(ctx, pathX(0), pathY() - 2, K.C.good);
      K.drawLabel(ctx, '起点 = 老地方', pathX(0) - 8, 210, K.C.muted, 10);
      K.drawLabel(ctx, '最远端掉头', pathX(0.5) - 26, 210, K.C.muted, 10);
      // 小车朝向随去程/返程翻转
      const cx = pathX(p);
      const heading = Math.cos(p * Math.PI) >= 0 ? 1 : -1;
      ctx.save();
      ctx.translate(cx, pathY() - 4);
      ctx.scale(heading, 1);
      ctx.translate(-cx, -(pathY() - 4));
      K.drawCar(ctx, cx, pathY() - 4, 0.9, K.C.guide);
      ctx.restore();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const disconnect = observeCanvas(canvas, start, stop);

    return () => {
      stop();
      disconnect();
    };
  }, []);

  const feedback = arrived
    ? '没有记忆：镜头回不正原始取景，街景也悄悄变了样（红）；有几何检索记忆：视角随返程精确回正，老地方还是老样子（绿）。10 秒重访评测 ΔPSNR 增益 3.92，四个层面全面领先（Table 5）。'
    : drift > 0.03
      ? `返程中：无记忆一侧镜头偏移逐渐失准、街景连续漂移（当前 ${driftPct}%）；几何检索记忆按相机几何逐帧校准，视角稳定回正。`
      : '拖动下方滑块让小车走一个来回：去程镜头连续偏移、返程回正，全程观察两侧取景与街景的连续变化。';

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
      />
      <div className="ctrl">
        <label>
          去程—返程进度 <span className="val">{Math.round(pos * 100)}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(pos * 100)}
          onChange={(e) => setPos(clamp(Number(e.target.value), 0, 100) / 100)}
        />
      </div>
      <div className={`feedback ${arrived ? 'good' : ''}`}>{feedback}</div>
    </div>
  );
};

export default Mod82;
