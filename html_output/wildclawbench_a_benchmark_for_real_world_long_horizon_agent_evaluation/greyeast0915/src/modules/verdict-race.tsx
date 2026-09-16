import React, { useEffect, useRef, useState } from 'react';
import { easeOutCubic, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 360;
type View = '主结果' | '框架敏感性' | '语言与方差';

export const VerdictRace: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState<View>('主结果');
  const [progress, setProgress] = useState(1);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const started = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - started) / 2200);
      setProgress(easeOutCubic(p));
      if (p < 1) raf = requestAnimationFrame(tick); else setRunning(false);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#f5f8f0'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#21324a'; ctx.font = '700 24px "Segoe UI", sans-serif'; ctx.fillText(view === '主结果' ? '主结果（百分制）' : view, 42, 42);
    if (view === '主结果') {
      const rows = [
        ['Claude Opus 4.7', 62.2], ['GPT-5.5', 58.2], ['Claude Opus 4.6', 51.6], ['GPT-5.4', 50.3],
      ] as const;
      rows.forEach(([name, score], i) => {
        const y = 78 + i * 62;
        ctx.fillStyle = '#e7ebf1'; ctx.fillRect(230, y, 690, 34);
        ctx.fillStyle = i === 0 ? '#228d5c' : '#27446e'; ctx.fillRect(230, y, score * 10 * progress, 34);
        ctx.fillStyle = '#21324a'; ctx.font = '16px "Segoe UI", sans-serif'; ctx.fillText(name, 42, y + 23);
        ctx.font = '700 17px "Segoe UI", sans-serif'; ctx.fillText(score.toFixed(1), 930, y + 23);
      });
      ctx.fillStyle = '#68778f'; ctx.font = '15px "Segoe UI", sans-serif'; ctx.fillText('OpenClaw · 论文 Table 2', 42, 332);
    } else if (view === '框架敏感性') {
      const data = [['Claude Code', 29.9], ['Codex', 35.3], ['OpenClaw', 40.2], ['Hermes', 48.1]] as const;
      data.forEach(([name, score], i) => {
        const x = 90 + i * 235; const barH = score * 4.6 * progress;
        ctx.fillStyle = i === 0 ? '#c43f52' : i === 3 ? '#228d5c' : '#27446e';
        ctx.fillRect(x, 290 - barH, 118, barH);
        ctx.fillStyle = '#21324a'; ctx.font = '700 17px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(score.toFixed(1), x + 59, 312 - barH);
        ctx.font = '15px "Segoe UI", sans-serif'; ctx.fillText(name, x + 59, 326);
      });
      ctx.textAlign = 'left'; ctx.fillStyle = '#f07e47'; ctx.font = '700 22px "Segoe UI", sans-serif'; ctx.fillText('MiMo-V2-Pro：29.9 → 48.1，跨度 18.2', 286, 62);
    } else {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(60, 82, 450, 210); ctx.fillRect(570, 82, 450, 210);
      ctx.strokeStyle = '#d7deea'; ctx.strokeRect(60, 82, 450, 210); ctx.strokeRect(570, 82, 450, 210);
      ctx.fillStyle = '#21324a'; ctx.font = '700 21px "Segoe UI", sans-serif'; ctx.fillText('语言子集差距', 88, 122); ctx.fillText('三次重复的波动', 598, 122);
      ctx.fillStyle = '#f07e47'; ctx.font = '700 48px "Segoe UI", sans-serif'; ctx.fillText('0.8–7.4', 88, 198); ctx.fillStyle = '#7c3aed'; ctx.fillText('0.7–1.9', 598, 198);
      ctx.fillStyle = '#68778f'; ctx.font = '17px "Segoe UI", sans-serif'; ctx.fillText('英文子集更高；不是受控语言实验', 88, 248); ctx.fillText('四个模型总分标准差（仅三次）', 598, 248);
    }
    canvas.classList.add('is-ready');
  }, [view, progress]);

  const feedback = view === '主结果'
        ? '启动比较，先把排行榜读成“特定设置下的证据”。'
        : view === '框架敏感性'
          ? '同一模型换执行框架，论文观察到最高约 18 的差距。'
          : '语言差距与重复方差都应带上样本与实验设计边界。';

  return <div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    <div className="chip-row" aria-label="选择证据视角">
      {(['主结果', '框架敏感性', '语言与方差'] as View[]).map(item => <button key={item} className={`chip ${view === item ? 'active' : ''}`} aria-pressed={view === item} onClick={() => { setView(item); setProgress(1); }}>{item}</button>)}
      <button className="tiny" disabled={running} onClick={() => { setProgress(0); setRunning(true); }}>重跑结论赛</button>
    </div>
    <div className="feedback">{feedback}</div>
    <div className="feedback good"><b>合格表述：</b>在论文设置下，百分制最佳成绩为 62.2；真实长时程任务仍有明显余量，且结论依赖模型、执行框架、任务构成与验收条件。</div>
  </div>;
};

export default VerdictRace;
