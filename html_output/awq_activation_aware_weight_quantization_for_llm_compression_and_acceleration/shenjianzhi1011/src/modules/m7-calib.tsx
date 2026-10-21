import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawTape, drawBar, drawSceneLabel, drawLegend, AQ, useAwqCanvas } from './awq-kit';

const W = 1080;
const H = 280;
type Domain = 'pubmed' | 'enron';

export const M7Calib: React.FC<WidgetProps> = () => {
  const [calib, setCalib] = useState<Domain>('pubmed');
  const [run, setRun] = useState(false);
  const [prog, setProg] = useState(0);
  const evalDomain = 'pubmed' as Domain;
  const cross = calib !== evalDomain;
  const awqInc = cross ? 0.55 : 0.1;
  const gptqInc = cross ? 3.6 : 0.3;
  const phase: 'idle' | 'running' | 'done' = run ? 'running' : prog >= 1 ? 'done' : 'idle';

  useEffect(() => {
    if (!run) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / 1200);
      setProg(p);
      if (p >= 1) setRun(false);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run]);

  const ref = useAwqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const p = phase === 'idle' ? 0 : phase === 'running' ? 0.6 : 1;
    drawTape(ctx, 50, 60, 200, 60, { levels: 4, fill: 0.25, color: AQ.green });
    drawSceneLabel(ctx, 50, 50, 'AWQ 校准 16', AQ.green, 12);
    drawTape(ctx, 50, 150, 200, 80, { levels: 4, fill: 1, color: AQ.red });
    drawSceneLabel(ctx, 50, 140, 'GPTQ 校准 192', AQ.red, 12);
    const x0 = 400;
    const x1 = 1030;
    drawBar(ctx, x0, 80, x1 - x0, 22, Math.min(1, (awqInc / 5) * p), AQ.green);
    drawBar(ctx, x0, 140, x1 - x0, 22, Math.min(1, (gptqInc / 5) * p), AQ.red);
    drawSceneLabel(ctx, x0, 70, 'AWQ +0.5–0.6', AQ.green, 13);
    drawSceneLabel(ctx, x0, 130, 'GPTQ +2.3–4.9', AQ.red, 13);
    drawLegend(ctx, x0, 230, [
      { label: 'AWQ', color: AQ.green },
      { label: 'GPTQ', color: AQ.red },
    ]);
  }, W, H);

  const cls = phase === 'done' && cross ? 'good' : '';
  const text =
    phase === 'idle'
      ? '先选校准分布，再开始对比。'
      : phase === 'running'
      ? '两侧在同一评测集上比较…'
      : cross
      ? `校准用${calib === 'pubmed' ? 'PubMed' : 'Enron'}、评测用 PubMed：AWQ 只涨 0.5–0.6，GPTQ 涨 2.3–4.9——AWQ 更抗分布漂移。`
      : `校准与评测同分布：两边增幅都很小。切换校准分布看看跨分布时的差距。`;

  return (
    <div>
      <canvas id="cv-m7-calib" ref={ref} width={W} height={H} />
      <div className="chip-row">
        {(['pubmed', 'enron'] as Domain[]).map((d) => (
          <button
            key={d}
            className={`chip ${calib === d ? 'selected' : ''}`}
            onClick={() => {
              setCalib(d);
              setProg(0);
              setRun(false);
            }}
          >
            校准：{d === 'pubmed' ? 'PubMed' : 'Enron'}
          </button>
        ))}
      </div>
      <div className="step-ctrl">
        <button className="tiny" onClick={() => { setProg(0); setRun(true); }}>
          开始对比
        </button>
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M7Calib;
