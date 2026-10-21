import { useEffect, useRef, useState } from 'react';
import { C, Scene, Panel, Chips, Feedback, DataTable, paint, brush, line, text } from './nusa-kit';

export function NusaConstraint() {
  const [theta, setTheta] = useState('30');
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const visible = useRef(true);
  const progressRef = useRef(0);
  const angle = Number(theta) * Math.PI / 180;
  const sin = Math.sin(angle), cos = Math.cos(angle);
  const coupling = progress * sin * sin;
  const leakage = progress * Math.abs(sin);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => { visible.current = entries[0]?.isIntersecting ?? false; });
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!running) return;
    let raf = 0; let previous = 0;
    const tick = (now: number) => {
      const delta = previous ? Math.min(64, now - previous) : 0;
      previous = now;
      if (visible.current && document.visibilityState !== 'hidden') {
        progressRef.current = Math.min(1, progressRef.current + delta / 1400);
        setProgress(progressRef.current);
      }
      if (progressRef.current >= 1) setRunning(false);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);
  const play = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    progressRef.current = reduced ? 1 : 0; setProgress(progressRef.current); setRunning(!reduced);
  };
  const changeAngle = (value: string) => { setTheta(value); setRunning(false); progressRef.current = 1; setProgress(1); };
  const reset = () => { setRunning(false); setTheta('30'); progressRef.current = 0; setProgress(0); };
  const left = [progress * sin * sin, progress * sin * cos, progress * sin * cos, progress * cos * cos];
  const right = [0, 0, 0, progress];
  return <div ref={container} onKeyDown={event => { if (event.key.startsWith('Arrow')) event.stopPropagation(); }}>
    <Panel><Chips label="方向偏转 θ" value={theta} options={['0', '15', '30', '60'].map(value => ({ value, label: `${value}°` }))} onChange={changeAngle} />
      <div className="chip-row"><button className="chip selected" style={{ minHeight: 44 }} onClick={play} disabled={running}>{running ? '同步比较中' : '同步比较'}</button><button className="chip" style={{ minHeight: 44 }} onClick={reset}>重置比较</button><span aria-live="polite">进度 {Math.round(progress * 100)}%</span></div>
    </Panel>
    <Scene label="左侧更新方向随训练偏转，右侧固定尾部基；两侧笔触进度相同" draw={ctx => {
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1080, 280);
      [0, 1].forEach(side => {
        const x = side === 0 ? 53 : 581;
        paint(ctx, x, 26, 320, 170, 0, 0.6);
        const vx = side === 0 ? sin : 0; const vy = side === 0 ? cos : 1;
        const ox = x + 210; const oy = 72;
        line(ctx, ox, oy, ox, oy + 108, C.light, 22);
        if (progress > 0) {
          line(ctx, ox, oy, ox - vx * 116 * progress, oy + vy * 116 * progress, side === 0 && theta !== '0' ? C.red : C.green, 7);
          brush(ctx, ox - vx * 116 * progress, oy + vy * 116 * progress, -0.6, side === 0 && theta !== '0' ? C.red : C.green);
        }
        const values = side === 0 ? left : right;
        const mx = x + 352;
        values.forEach((value, i) => {
          ctx.fillStyle = value === 0 ? '#ffffff' : side === 0 && i < 3 ? C.red : C.green;
          ctx.globalAlpha = value === 0 ? 1 : 0.25 + value * 0.75;
          ctx.fillRect(mx + (i % 2) * 37, 65 + Math.floor(i / 2) * 37, 32, 32);
          ctx.globalAlpha = 1;
          ctx.strokeStyle = C.axis; ctx.lineWidth = 1; ctx.strokeRect(mx + (i % 2) * 37, 65 + Math.floor(i / 2) * 37, 32, 32);
        });
      });
      text(ctx, '方向可变', 195, 238, 18, C.red);
      text(ctx, '固定方向', 725, 238, 18, C.green);
    }} />
    <DataTable caption="二维教学计算：Uₚ = Vₚ = e₁，两侧更新的 Frobenius 范数均为当前进度" headers={['当前量', '方向可变：ΔW = p vvᵀ', '固定方向：ΔW = p e₂e₂ᵀ']} rows={[
      ['v / 固定基', `(${sin.toFixed(3)}, ${cos.toFixed(3)})`, '(0, 1)'],
      ['主方向二次项 e₁ᵀΔW e₁', coupling.toFixed(3), '0.000'],
      ['输入泄漏 ‖ΔW e₁‖₂', leakage.toFixed(3), '0.000'],
      ['‖ΔW‖F', progress.toFixed(3), progress.toFixed(3)]
    ]} />
    <Feedback tone={theta === '0' ? 'good' : ''}>{progress === 0 ? '点击“同步比较”，两侧以相同幅度写入一个秩为 1 的更新。' : theta === '0' ? 'θ = 0°，两侧都沿 e₂ 更新，主方向耦合与输入泄漏均为 0。' : `θ = ${theta}°，左侧主方向二次项为 ${coupling.toFixed(3)}，输入泄漏为 ${leakage.toFixed(3)}；固定奇异基的右侧两项始终为 0。`}</Feedback>
    <details><summary>论文的冻结消融结果</summary>
      <DataTable caption="表 4a · CLIP ViT-B/16 · full-shot MTIL · 单位 %" headers={['可训练部分', 'Transfer', 'Avg', 'Last']} rows={[
        ['M', 68.58, 75.08, 82.79], ['M、Vₙ', 66.37, 73.11, 82.04], ['M、Uₙ、Vₙ', 62.60, 68.12, 77.32]
      ]} />
      <p>冻结两侧奇异基时 Avg 为 75.08%；共同训练两侧基时为 68.12%，相差 6.96 个百分点。正交约束随固定基保留在整个任务的优化过程中。</p>
    </details>
  </div>;
}
