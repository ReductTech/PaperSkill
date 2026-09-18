import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { clearScene, COLORS } from './calligraphyKit';
import type { WidgetProps } from './registry';
const W = 1080, H = 280;
const COMPETITORS = [
  { name: 'MonkeyOCRv2-B', score: 57.2, color: COLORS.green, params: '113M' },
  { name: 'OpenVision-B', score: 44.0, color: COLORS.red, params: '~300M' },
  { name: 'CLIP-L', score: 38.5, color: COLORS.orange, params: '300M+' },
  { name: 'DINOv2-L', score: 35.8, color: COLORS.purple, params: '300M+' },
  { name: 'SAM-L', score: 32.1, color: COLORS.inkLight, params: '600M+' },
];
export const Mod10_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const sRef = useRef({ t: 0, started: false, done: false });
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = setupCanvas(c, W, H);
    c.classList.add('is-ready');
    let raf = 0;
    const tick = () => {
      if (sRef.current.started && !sRef.current.done) {
        sRef.current.t += 0.015;
        if (sRef.current.t >= 1) { sRef.current.t = 1; sRef.current.done = true; setDone(true); }
      }
      const t = sRef.current.t;
      clearScene(ctx, W, H);
      ctx.fillStyle = COLORS.ink; ctx.font = 'bold 14px sans-serif';
      ctx.fillText('文档理解 8 项基准平均得分 (越高越好) · 相同 Qwen3-1.7B LLM', 40, 35);
      // Bar chart
      const bx = 40, by = 55, bh = 145, bw = 140, gap = 30;
      const maxScore = 70;
      COMPETITORS.forEach((c, i) => {
        const x = bx + i * (bw + gap);
        const h = (c.score / maxScore) * bh * t;
        ctx.fillStyle = c.color;
        ctx.fillRect(x, by + bh - h, bw, h);
        ctx.strokeStyle = COLORS.border; ctx.strokeRect(x, by, bw, bh);
        // Score
        ctx.fillStyle = c.color; ctx.font = 'bold 16px sans-serif';
        ctx.fillText(t >= 0.9 ? c.score.toFixed(1) : (c.score * t).toFixed(1), x + bw / 2 - 15, by + bh - h - 8);
        // Name
        ctx.fillStyle = COLORS.ink; ctx.font = '11px sans-serif';
        ctx.fillText(c.name, x + 5, by + bh + 16);
        ctx.fillStyle = COLORS.inkLight; ctx.font = '10px sans-serif';
        ctx.fillText(c.params, x + 30, by + bh + 30);
      });
      // Baseline line
      ctx.strokeStyle = COLORS.red; ctx.setLineDash([5, 5]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(bx, by + bh - (44 / maxScore) * bh); ctx.lineTo(bx + 5 * (bw + gap), by + bh - (44 / maxScore) * bh); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = COLORS.red; ctx.font = '10px sans-serif';
      ctx.fillText('OpenVision-B 基线 44.0', bx + 5 * (bw + gap) - 120, by + bh - (44 / maxScore) * bh - 5);
      // Result summary
      if (sRef.current.done) {
        ctx.fillStyle = COLORS.green; ctx.font = 'bold 13px sans-serif';
        ctx.fillText('🏆 MonkeyOCRv2-B 超越最强基线 OpenVision-B 13.2 个百分点', 40, 268);
      } else if (sRef.current.started) {
        ctx.fillStyle = COLORS.inkLight; ctx.font = '12px sans-serif';
        ctx.fillText('竞赛进行中...', 40, 268);
      } else {
        ctx.fillStyle = COLORS.inkLight; ctx.font = '12px sans-serif';
        ctx.fillText('点击"开始竞赛"查看各编码器在文档理解任务上的对比', 40, 268);
      }
      raf = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(c, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  const race = () => {
    if (sRef.current.done) { sRef.current.t = 0; sRef.current.done = false; setDone(false); }
    sRef.current.started = true; setStarted(true);
  };
  return (<div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
    <div className="ctrl"><button onClick={race}>{done ? '重新竞赛' : started ? '竞赛中...' : '开始竞赛'}</button></div>
    <div className={`feedback ${done ? 'good' : ''}`}>{done ? 'MonkeyOCRv2-B（113M）以 57.2 分超越 OpenVision-B（44.0）13.2 个百分点，且参数量更小。在 MDPBench 上 83.3% 超越 3B 的 dots.mocr，视觉编码器小约 11 倍。' : '所有编码器冻结，搭配相同 Qwen3-1.7B LLM 和 MLP 投影器，在 8 项文档理解基准上公平对比。'}</div></div>);
};
export default Mod10_1;
