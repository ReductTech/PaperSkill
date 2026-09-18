import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { clearScene, COLORS } from './calligraphyKit';
import type { WidgetProps } from './registry';
const W = 1080, H = 280;
const STEPS = [
  { title: '1. 联合预训练', desc: '在 MonkeyDoc v2 上同时优化文本生成和像素重建两个目标', color: COLORS.blue },
  { title: '2. 丢弃解码器', desc: '移除视觉解码器和文本解码器，它们仅用于预训练阶段', color: COLORS.orange },
  { title: '3. 保留编码器', desc: '视觉编码器作为通用文档特征提取器', color: COLORS.green },
  { title: '4. 下游微调', desc: '替换任务头，在识别/检测/解析等任务上微调', color: COLORS.purple },
];
export const Mod6_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);
  const sRef = useRef(0);
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = setupCanvas(c, W, H);
    c.classList.add('is-ready');
    let raf = 0;
    const tick = () => {
      clearScene(ctx, W, H);
      const s = sRef.current;
      // Flow diagram
      const boxes = [
        { x: 40, label: '视觉编码器\n(共享特征)', active: s >= 0, keep: true },
        { x: 220, label: '视觉解码器\n(重建图像)', active: s >= 0, keep: s < 1 },
        { x: 400, label: '文本解码器\n(生成文本)', active: s >= 0, keep: s < 1 },
        { x: 580, label: '任务头\n(识别/检测)', active: s >= 3, keep: s >= 3 },
        { x: 760, label: '下游任务\n输出', active: s >= 3, keep: s >= 3 },
      ];
      boxes.forEach((b, i) => {
        const dim = !b.keep && s >= 1;
        ctx.fillStyle = dim ? '#f0f0f0' : b.active ? STEPS[Math.min(s, 3)].color + '22' : '#fafafa';
        ctx.strokeStyle = dim ? '#ddd' : b.active ? STEPS[Math.min(s, 3)].color : COLORS.border;
        ctx.lineWidth = b.active ? 2.5 : 1;
        ctx.fillRect(b.x, 80, 140, 80); ctx.strokeRect(b.x, 80, 140, 80);
        ctx.fillStyle = dim ? '#ccc' : COLORS.ink; ctx.font = '13px sans-serif';
        const lines = b.label.split('\n');
        lines.forEach((ln, j) => ctx.fillText(ln, b.x + 30, 115 + j * 18));
        if (dim) { ctx.strokeStyle = COLORS.red; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.x, 80); ctx.lineTo(b.x + 140, 160); ctx.moveTo(b.x + 140, 80); ctx.lineTo(b.x, 160); ctx.stroke(); }
        if (i < boxes.length - 1) {
          ctx.strokeStyle = b.active && boxes[i + 1].active ? COLORS.ink : '#ddd';
          ctx.lineWidth = 2; ctx.beginPath();
          ctx.moveTo(b.x + 140, 120); ctx.lineTo(boxes[i + 1].x, 120); ctx.stroke();
        }
      });
      // Step info
      const st = STEPS[s];
      ctx.fillStyle = st.color; ctx.font = 'bold 16px sans-serif';
      ctx.fillText(st.title, 40, 210);
      ctx.fillStyle = COLORS.ink; ctx.font = '13px sans-serif';
      ctx.fillText(st.desc, 40, 235);
      ctx.fillStyle = COLORS.inkLight; ctx.font = '12px sans-serif';
      ctx.fillText(`步骤 ${s + 1} / ${STEPS.length}`, 950, 30);
      raf = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(c, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  const next = () => { const v = Math.min(sRef.current + 1, STEPS.length - 1); sRef.current = v; setStep(v); };
  const prev = () => { const v = Math.max(sRef.current - 1, 0); sRef.current = v; setStep(v); };
  return (<div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
    <div className="ctrl"><button onClick={prev} disabled={step === 0}>上一步</button>
      <button onClick={next} disabled={step === STEPS.length - 1}>下一步</button></div>
    <div className="feedback">{STEPS[step].title}：{STEPS[step].desc}。预训练编码器可直接作为 backbone 迁移到多种文档任务。</div></div>);
};
export default Mod6_1;
