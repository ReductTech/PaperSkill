import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 4.1：六步流水线（P2 步进）——引文图 → 图嵌入 → 正例组 → 负例组 → 三元组 → SciBERT 微调。
const W = 1080, H = 280;
const C = { bg: '#f5f8f0', field: '#b8c9a7', border: '#d7deea', text: '#21324a', muted: '#68778f', blue: '#27446e' };
const STEPS = [
  { label: '引文图', cap: 'S2ORC 引文图：52.5M 节点、463M 边（含泄漏 / 无泄漏两种训练数据设置）。', fb: '起点：整个科学文献的引用网络。' },
  { label: '图嵌入', cap: 'PyTorch BigGraph 训练 768 维引文嵌入，约 6 小时 CPU；点积距离远优于余弦（MRR 95.1 vs 54.1）。', fb: '把图结构压成连续嵌入空间——论文从此可以「比距离」。' },
  { label: '正例组', cap: 'FAISS 扁平索引做 kNN，一次性取到 max(k⁺, k⁻hard) 个邻居；正例取自环带 (k⁺−5, k⁺]，每查询 5 篇。', fb: '每个查询得到一组正例（默认 5 篇）。' },
  { label: '负例组', cap: '难负例取自环带 (k⁻hard−2, k⁻hard]，每查询 2 篇；易负例用过滤随机再取 3 篇。', fb: '每个查询再得到一组负例：2 篇难负 + 3 篇易负。', good: true },
  { label: '三元组', cap: '正例组 × 负例组拼成三元组，共 68.4 万条。', fb: '68.4 万条三元组——图侧出题到此结束。' },
  { label: '微调', cap: '三元组送进 SciBERT，用三元组间隔损失（ξ=1）微调 2 个 epoch，有效批 32，约 24 小时（2×24G GPU）。', fb: '监督信号来自引文图本身，不需要任何人工标注。', good: true },
];

export const M61: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 1 });
  const [step, setStep] = useState(1);
  const [fb, setFb] = useState({ text: STEPS[0].fb, cls: '' });

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const nodeW = 140, nodeH = 60, y0 = 56;
    const xs = [22, 196, 370, 544, 718, 892];
    const render = () => {
      const s = stateRef.current;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.field; ctx.fillRect(0, H * 0.9, W, H * 0.1);
      ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
      xs.forEach((x, i) => {
        const n = i + 1;
        const active = n <= s.step;
        const current = n === s.step;
        ctx.fillStyle = current ? 'rgba(39,68,110,0.1)' : active ? 'rgba(39,68,110,0.05)' : '#fff';
        ctx.strokeStyle = current ? C.blue : active ? C.blue : C.border;
        ctx.lineWidth = current ? 3 : 2;
        ctx.fillRect(x, y0, nodeW, nodeH); ctx.strokeRect(x, y0, nodeW, nodeH);
        ctx.fillStyle = current ? C.blue : active ? C.text : C.muted;
        ctx.fillText(`${n}. ${STEPS[i].label}`, x + nodeW / 2, y0 + 36);
        if (i < 5) {
          ctx.strokeStyle = n < s.step ? C.blue : C.border;
          ctx.lineWidth = n < s.step ? 3 : 2;
          ctx.beginPath(); ctx.moveTo(x + nodeW + 3, y0 + nodeH / 2); ctx.lineTo(x + nodeW + 30, y0 + nodeH / 2); ctx.stroke();
        }
        if (current) {
          const pulse = 4 + 2 * Math.sin(performance.now() / 300);
          ctx.strokeStyle = C.blue; ctx.lineWidth = 1.5;
          ctx.strokeRect(x - pulse, y0 - pulse, nodeW + pulse * 2, nodeH + pulse * 2);
        }
      });
      const st = STEPS[s.step - 1];
      ctx.fillStyle = '#fff'; ctx.strokeStyle = C.border; ctx.lineWidth = 2;
      ctx.fillRect(46, 168, 1016, 72); ctx.strokeRect(46, 168, 1016, 72);
      ctx.fillStyle = C.text; ctx.font = '19px sans-serif'; ctx.textAlign = 'left';
      wrapText(ctx, st.cap, 72, 202, 960, 28);
      ctx.font = '13px sans-serif'; ctx.fillStyle = C.muted; ctx.textAlign = 'right';
      ctx.fillText(`第 ${s.step} / 6 步`, W - 60, 46);
    };
    let raf = 0;
    const tick = () => { render(); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    const stop = observeCanvas(canvas, () => { if (!raf) raf = requestAnimationFrame(tick); }, () => { cancelAnimationFrame(raf); raf = 0; });
    return () => { cancelAnimationFrame(raf); stop(); };
  }, []);

  const go = (n: number) => {
    const c = Math.max(1, Math.min(6, n));
    stateRef.current.step = c;
    setStep(c);
    const st = STEPS[c - 1];
    setFb({ text: st.fb, cls: st.good ? 'good' : '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button className="chip" disabled={step === 1} onClick={() => go(step - 1)}>上一页</button>
        <button className="chip" onClick={() => go(step === 6 ? 1 : step + 1)}>{step === 6 ? '重置' : '下一页'}</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  let line = '', yy = y;
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, x, yy); line = ch; yy += lh; }
    else line += ch;
  }
  ctx.fillText(line, x, yy);
}
export default M61;
