import { useRef, useState } from 'react';
import { C, SceneCanvas, Feedback, clearScene, drawLeaf, drawSceneLabel } from './kit-anchor';

export function Zoom3() {
  const [status, setStatus] = useState<'idle' | 'running' | 'complete'>('idle');
  const clock = useRef({ elapsed: 0, last: null as number | null, completed: false });
  const start = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    clock.current = { elapsed: reduced ? 1600 : 0, last: null, completed: reduced };
    setStatus(reduced ? 'complete' : 'running');
  };
  return <>
    <SceneCanvas animate={status === 'running'} role="img" aria-label={`单尺度与混合尺度同步示意：${status === 'idle' ? '等待开始' : status === 'running' ? '正在对照' : '对照完成；仅为手绘假设场景'}`} draw={(ctx, time) => {
      const current = clock.current;
      if (status === 'running' && !current.completed) {
        if (current.last !== null) current.elapsed += Math.min(64, Math.max(0, time - current.last));
        current.last = time;
        if (current.elapsed >= 1600) { current.completed = true; queueMicrotask(() => setStatus('complete')); }
      }
      const progress = Math.min(1, current.elapsed / 1600);
      clearScene(ctx, 1080, 280);
      [275, 810].forEach((x, index) => {
        ctx.fillStyle = '#edf2e6'; ctx.beginPath(); ctx.roundRect(x - 242, 48, 484, 211, 18); ctx.fill();
        drawLeaf(ctx, x, 153, 1.25);
        ctx.save(); ctx.translate(x, 147); ctx.lineWidth = 4; ctx.lineCap = 'round';
        if (progress > 0) {
          ctx.strokeStyle = index === 0 ? C.orange : C.green;
          const sweep = Math.PI * 2 * progress * (index === 0 ? .67 : 1);
          ctx.beginPath(); ctx.ellipse(0, 0, 52, 40, -.25, -Math.PI / 2, -Math.PI / 2 + sweep); ctx.stroke();
        }
        if (index === 0 && progress > .7) {
          ctx.strokeStyle = C.red; ctx.beginPath(); ctx.moveTo(-46, 13); ctx.lineTo(-32, 25); ctx.moveTo(-32, 13); ctx.lineTo(-46, 25); ctx.stroke();
        }
        ctx.restore();
      });
      drawSceneLabel(ctx, '单尺度示意', 204, 31);
      drawSceneLabel(ctx, '混合尺度示意', 729, 31);
    }} />
    <div className="ctrl"><button type="button" className="chip" onClick={start} disabled={status === 'running'}>{status === 'running' ? '对照进行中' : status === 'complete' ? '重新对照' : '开始对照'}</button></div>
    <Feedback tone={status === 'complete' ? 'good' : 'neutral'}>{status === 'idle'
      ? '先同时播放，再区分两种证据：动画说明直觉，下面的表格报告实测。'
      : status === 'running' ? '两侧使用同一片叶子和同一个计时器；互补线索正在逐段显现。'
        : '示意对照说明为何值得融合尺度。论文表3区分了简单相加与SIU选择，但并不保证每张图都获益。'}</Feedback>
    <table className="paper">
      <caption>论文表3 · baseline ① 尺度消融 · CAMO 与 COD10K 指标平均值（非单集成绩，无量纲）</caption>
      <thead><tr><th scope="col">输入与融合</th><th scope="col">Fωβ ↑</th><th scope="col">MAE ↓</th></tr></thead>
      <tbody><tr><th scope="row">仅 1×</th><td>0.649</td><td>0.063</td></tr><tr><th scope="row">三尺度相加</th><td>0.690</td><td>0.056</td></tr><tr><th scope="row">三尺度 + SIU</th><td>0.700</td><td>0.054</td></tr></tbody>
    </table>
  </>;
}
