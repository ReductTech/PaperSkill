import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBar, drawSceneLabel, DC, useDcCanvas } from './dc-kit';

const W = 1080;
const H = 280;

const DATA = {
  alex: { name: 'AlexNet', base: 240, out: 6.9, errBase: 42.78, errOut: 42.78, comp: 35 },
  vgg: { name: 'VGG-16', base: 552, out: 11.3, errBase: 31.5, errOut: 31.17, comp: 49 },
  lenet: { name: 'LeNet-5', base: 1720, out: 44, errBase: 0.8, errOut: 0.74, comp: 39 },
};

type Metric = 'size' | 'comp' | 'error';

export const M10Race: React.FC<WidgetProps> = () => {
  const [metric, setMetric] = useState<Metric>('size');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!running) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / 1600);
      setProgress(p);
      if (p >= 1) setRunning(false);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const ref = useDcCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const keys: (keyof typeof DATA)[] = ['alex', 'vgg', 'lenet'];
    const p = progress;
    keys.forEach((key, i) => {
      const d = DATA[key];
      const y = 60 + i * 66;
      let a = 0;
      let b = 0;
      let aLabel = '';
      let bLabel = '';
      if (metric === 'size') {
        a = d.base;
        b = d.out;
        aLabel = `${d.base} MB`;
        bLabel = `${d.out} MB`;
      } else if (metric === 'comp') {
        a = 1;
        b = d.comp;
        aLabel = '1×';
        bLabel = `${d.comp}×`;
      } else {
        a = d.errBase;
        b = d.errOut;
        aLabel = `${d.errBase}%`;
        bLabel = `${d.errOut}%`;
      }
      const scale = metric === 'size' ? 1720 : metric === 'comp' ? 50 : 45;
      drawSceneLabel(ctx, 40, y + 18, d.name, DC.ink, 14);
      drawBar(ctx, 200, y, 620, 18, (a / scale) * p, DC.red);
      drawBar(ctx, 200, y + 26, 620, 18, (b / scale) * p, DC.green);
      drawSceneLabel(ctx, 836, y + 15, aLabel, DC.red, 13);
      drawSceneLabel(ctx, 836, y + 41, bLabel, DC.green, 13);
    });
    drawSceneLabel(ctx, 200, 262, metric === 'error' ? '误差越低越好' : '数值越小越好', DC.muted, 12);
  }, W, H);

  const text =
    progress === 0 && !running
      ? '按下开始，把压缩前后的模型放到同一坐标上比较。'
      : metric === 'error'
      ? '误差越低越好：AlexNet 与 VGG-16 的 top-1 误差基本不变，说明压缩不是用精度换来的。'
      : 'AlexNet 240MB→6.9MB（35×）、VGG-16 552MB→11.3MB（49×）；量化模型未做硬件基准，是明确局限。';

  return (
    <div>
      <canvas id="cv-m10-race" ref={ref} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${metric === 'size' ? 'selected' : ''}`} onClick={() => setMetric('size')}>
          模型大小
        </button>
        <button className={`chip ${metric === 'comp' ? 'selected' : ''}`} onClick={() => setMetric('comp')}>
          压缩率
        </button>
        <button className={`chip ${metric === 'error' ? 'selected' : ''}`} onClick={() => setMetric('error')}>
          top-1 误差
        </button>
      </div>
      <div className="step-ctrl">
        <button className="tiny" onClick={() => { setProgress(0); setRunning(true); }}>
          开始对比
        </button>
      </div>
      <div className={`feedback ${progress > 0 ? 'good' : ''}`}>{text}</div>
      <table className="paper">
        <thead>
          <tr>
            <th>模型</th>
            <th>压缩前</th>
            <th>压缩后</th>
            <th>压缩率</th>
            <th>top-1 误差</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>AlexNet</td>
            <td>240 MB</td>
            <td>6.9 MB</td>
            <td>35×</td>
            <td>42.78% → 42.78%</td>
          </tr>
          <tr>
            <td>VGG-16</td>
            <td>552 MB</td>
            <td>11.3 MB</td>
            <td>49×</td>
            <td>31.50% → 31.17%</td>
          </tr>
          <tr>
            <td>LeNet-5</td>
            <td>1720 KB</td>
            <td>44 KB</td>
            <td>39×</td>
            <td>0.80% → 0.74%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default M10Race;
