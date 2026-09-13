import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { clearScene, drawPaper, drawInkStroke, COLORS } from './calligraphyKit';
import type { WidgetProps } from './registry';
const W = 1080, H = 280;
export const Mod3_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const sRef = useRef({ t: 0, running: false });
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = setupCanvas(c, W, H);
    c.classList.add('is-ready');
    let raf = 0;
    const tick = () => {
      if (sRef.current.running) sRef.current.t += 0.012;
      const t = sRef.current.t;
      clearScene(ctx, W, H);
      // Left panel: text generation only
      ctx.fillStyle = '#fff0f0'; ctx.fillRect(20, 20, 500, 240);
      ctx.strokeStyle = COLORS.red; ctx.lineWidth = 2; ctx.strokeRect(20, 20, 500, 240);
      ctx.fillStyle = COLORS.red; ctx.font = 'bold 14px sans-serif';
      ctx.fillText('仅文本生成 (无重建)', 40, 45);
      drawPaper(ctx, 40, 60, 200, 180);
      // Blurry/wrong strokes
      const wob = Math.sin(t * 3) * 8;
      drawInkStroke(ctx, [{x:60,y:90},{x:220,y:90+wob}], 8, COLORS.ink, 0.5);
      drawInkStroke(ctx, [{x:60,y:120},{x:200,y:120-wob}], 7, COLORS.ink, 0.4);
      drawInkStroke(ctx, [{x:60,y:150},{x:210,y:150+wob}], 6, COLORS.ink, 0.35);
      // Wrong character output
      ctx.fillStyle = COLORS.red; ctx.font = 'bold 20px sans-serif';
      ctx.fillText('识别: "己已巳" → 混淆', 270, 120);
      ctx.fillStyle = COLORS.inkLight; ctx.font = '12px sans-serif';
      ctx.fillText('依赖语言上下文猜测，低分辨率下笔画丢失', 270, 150);
      // Right panel: text gen + reconstruction
      ctx.fillStyle = '#f0fff4'; ctx.fillRect(540, 20, 520, 240);
      ctx.strokeStyle = COLORS.green; ctx.lineWidth = 2; ctx.strokeRect(540, 20, 520, 240);
      ctx.fillStyle = COLORS.green; ctx.font = 'bold 14px sans-serif';
      ctx.fillText('文本生成 + 像素重建 (MonkeyOCRv2)', 560, 45);
      drawPaper(ctx, 560, 60, 200, 180);
      drawInkStroke(ctx, [{x:580,y:90},{x:740,y:90}], 4, COLORS.ink, 0.9);
      drawInkStroke(ctx, [{x:580,y:120},{x:720,y:120}], 4, COLORS.ink, 0.85);
      drawInkStroke(ctx, [{x:580,y:150},{x:730,y:150}], 4, COLORS.ink, 0.8);
      ctx.fillStyle = COLORS.green; ctx.font = 'bold 20px sans-serif';
      ctx.fillText('识别: "己已巳" → 正确区分', 790, 120);
      ctx.fillStyle = COLORS.inkLight; ctx.font = '12px sans-serif';
      ctx.fillText('重建目标保留笔画细节，视觉证据充分', 790, 150);
      // Sync indicator
      ctx.fillStyle = COLORS.ink; ctx.font = '12px sans-serif';
      ctx.fillText('同步对比 · 相同低分辨率输入', 420, 275);
      raf = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(c, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  const toggle = () => { sRef.current.running = !sRef.current.running; setRunning(sRef.current.running); };
  return (<div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
    <div className="ctrl"><button onClick={toggle}>{running ? '暂停' : '开始同步对比'}</button></div>
    <div className={`feedback ${running ? 'good' : ''}`}>{running ? '左侧仅靠语言上下文猜测，笔画模糊时易混淆；右侧通过像素重建保留笔画证据，即使低分辨率也能正确区分形近字。' : '点击开始，在相同低分辨率输入下对比两种预训练策略的识别表现。'}</div></div>);
};
export default Mod3_1;
