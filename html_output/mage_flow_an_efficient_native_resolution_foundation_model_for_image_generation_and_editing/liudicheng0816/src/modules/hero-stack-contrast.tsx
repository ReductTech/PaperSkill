import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

type HeroState = { phase: 'idle' | 'running' | 'done'; oldProgress: number; newProgress: number };
const W = 340;
const H = 250;
let shared: HeroState = { phase: 'idle', oldProgress: 0, newProgress: 0 };
let sharedRaf: number | null = null;
const listeners = new Set<(state: HeroState) => void>();
const publish = (next: HeroState) => { shared = next; listeners.forEach((listener) => listener(next)); };

function resetShared() {
  if (sharedRaf !== null) cancelAnimationFrame(sharedRaf);
  sharedRaf = null; publish({ phase: 'idle', oldProgress: 0, newProgress: 0 });
}

function startShared() {
  if (sharedRaf !== null) cancelAnimationFrame(sharedRaf);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { publish({ phase: 'done', oldProgress: 1, newProgress: 1 }); return; }
  const epoch = performance.now(); publish({ phase: 'running', oldProgress: 0, newProgress: 0 });
  const tick = (now: number) => {
    const elapsed = now - epoch;
    const oldProgress = Math.min(1, elapsed / 1750);
    const newProgress = Math.min(1, elapsed / 820);
    publish({ phase: oldProgress >= 1 ? 'done' : 'running', oldProgress, newProgress });
    if (oldProgress < 1) sharedRaf = requestAnimationFrame(tick); else sharedRaf = null;
  };
  sharedRaf = requestAnimationFrame(tick);
}

const colors = { bg: '#f5f0e8', paper: '#faf9f5', grid: '#d8c9b0', blue: '#cc785c', green: '#5db872', red: '#c64545', orange: '#e8a55a', text: '#252523', muted: '#6c6a64', axis: '#e6dfd8' };

export const HeroStackContrast: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<HeroState>(shared);
  const isOld = moduleId === 'old';
  const progress = isOld ? state.oldProgress : state.newProgress;

  useEffect(() => { listeners.add(setState); setState(shared); return () => { listeners.delete(setState); }; }, []);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let active = true;
    const disconnect = observeCanvas(canvas, () => { active = true; }, () => { active = false; });
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { disconnect(); return; }
    if (active) {
      ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = colors.grid; ctx.globalAlpha = 0.25;
      for (let x = 0; x < W; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.globalAlpha = 1; ctx.fillStyle = colors.text; ctx.font = '700 14px "Segoe UI", sans-serif'; ctx.fillText(isOld ? '只放大生成骨干' : '全栈协同设计', 20, 26);
      ctx.fillStyle = colors.paper; ctx.strokeStyle = colors.axis; ctx.lineWidth = 2; ctx.fillRect(34, 50, 272, 92); ctx.strokeRect(34, 50, 272, 92);
      ctx.save(); ctx.beginPath(); ctx.rect(34, 50, 272 * progress, 92); ctx.clip();
      ctx.fillStyle = isOld ? '#fbe9ea' : '#e3f3e9'; ctx.fillRect(34, 50, 272, 92);
      ctx.fillStyle = isOld ? colors.red : colors.blue; ctx.fillRect(50, 68, 156, 12); ctx.fillRect(50, 90, 216, 10); ctx.fillRect(50, 110, 184, 10); ctx.restore();
      ctx.strokeStyle = progress >= 1 ? colors.green : isOld ? colors.red : colors.blue; ctx.lineWidth = 3; ctx.strokeRect(34, 50, 272, 92);
      ctx.strokeStyle = colors.green; ctx.beginPath(); ctx.moveTo(292, 45); ctx.lineTo(292, 60); ctx.moveTo(284, 52); ctx.lineTo(300, 52); ctx.stroke();
      const meters = isOld ? [0.88, 0.8, 0.94] : [0.32, 0.58, 0.28];
      ['分词器', '骨干', '内存流量'].forEach((label, i) => {
        const y = 164 + i * 24; ctx.fillStyle = colors.text; ctx.font = '12px "Segoe UI", sans-serif'; ctx.fillText(label, 22, y + 7);
        ctx.fillStyle = colors.axis; ctx.fillRect(92, y, 214, 13);
        ctx.fillStyle = isOld ? (i === 2 ? colors.orange : colors.red) : (i === 1 ? colors.blue : colors.green);
        ctx.fillRect(92, y, 214 * meters[i], 13);
        ctx.fillStyle = colors.muted; ctx.fillText(isOld ? '高' : i === 1 ? '紧凑' : '低', 310, y + 7);
      });
      canvas.classList.add('is-ready');
    }
    return disconnect;
  }, [isOld, progress]);

  const status = state.phase === 'idle' ? '共同起点：尚未开始' : !isOld && state.newProgress >= 1 && state.oldProgress < 1 ? '同一完成线，更早到达' : progress >= 1 ? '已到达共同完成线' : isOld ? '瓶颈仍分散在整条链路' : '分词器与内存成本正在下降';
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} aria-describedby={`hero-${moduleId}-summary`} />
      {isOld ? <div className="step-ctrl"><button className="tiny" onClick={startShared} disabled={state.phase === 'running'}>同步开始</button><button className="tiny ghost" onClick={resetShared}>重新对比</button></div> : null}
      <div id={`hero-${moduleId}-summary`} className={`feedback ${progress >= 1 ? 'good' : isOld && state.phase === 'running' ? 'bad' : ''}`} aria-live="polite">{status}</div>
      {isOld ? <p className="step-desc">两栏从相同画布与同一逻辑时钟出发；这是机制示意，不是论文计时。</p> : <p className="step-desc">Hero 不展示精确倍数；B200 与 A100 定量结果在第 9、10 章分别说明。</p>}
    </div>
  );
};

export default HeroStackContrast;
