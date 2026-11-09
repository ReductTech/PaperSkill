import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const METHODS = ['ESRGAN', 'FSSR-DPED', 'FSSR-JPEG', 'RealSR-DPED', 'RealSR-JPEG', 'BSRGAN'];
const NIQE = [4.95, 4.86, 4.04, 4.58, 3.99, 5.60];
const NRQM = [6.02, 6.28, 6.88, 6.59, 6.23, 6.17];
const PI = [4.47, 4.29, 3.58, 3.99, 4.29, 4.72];

export function Ch4Realsrset(_props: WidgetProps) {
  const [metric, setMetric] = useState<'niqe' | 'nrqm' | 'pi'>('niqe');
  const values = metric === 'niqe' ? NIQE : metric === 'nrqm' ? NRQM : PI;
  const lower = metric !== 'nrqm';
  const best = lower ? Math.min(...values) : Math.max(...values);
  const worst = lower ? Math.max(...values) : Math.min(...values);
  const bestIndex = values.indexOf(best);
  const worstIndex = values.indexOf(worst);
  const max = metric === 'niqe' ? 6 : metric === 'nrqm' ? 8 : 6;
  const fmt = (v: number) => v.toFixed(2);
  const feedback = metric === 'niqe'
    ? `NIQE 越低越好：${METHODS[bestIndex]} 最低（${fmt(best)}），BSRGAN 最高（5.60）。`
    : metric === 'nrqm'
      ? `NRQM 越高越好：${METHODS[bestIndex]} 最高（${fmt(best)}），BSRGAN 为 6.17，排第五。`
      : `PI 越低越好：${METHODS[bestIndex]} 最低（${fmt(best)}），BSRGAN 为 4.72，排最后。`;

  return (
    <div className="bsr-ch4-realsrset">
      <section className="bsr-fig4-panel">
        <div className="bsr-panel-head"><span>RealSRSet 视觉对比</span><b>×4</b></div>
        <div className="bsr-fig4-wrap">
          <img src="./images/fig4-realsrset.png" alt="论文图 4：RealSRSet 上不同方法的超分结果，最后一列为 BSRGAN" />
          <div className="bsr-fig4-highlight" aria-hidden="true" />
        </div>
        <p className="bsr-fig4-caption">三行分别是 Building、Chip、Oldphoto2；最后一列是 BSRGAN。原图：Zhang et al., ICCV 2021, Fig. 4。</p>
      </section>
      <aside className="bsr-realsr-side">
        <div className="bsr-toggle-row" role="group" aria-label="无参考指标">
          <button className={metric === 'niqe' ? 'is-on' : ''} aria-pressed={metric === 'niqe'} onClick={() => setMetric('niqe')}>NIQE ↓</button>
          <button className={metric === 'nrqm' ? 'is-on' : ''} aria-pressed={metric === 'nrqm'} onClick={() => setMetric('nrqm')}>NRQM ↑</button>
          <button className={metric === 'pi' ? 'is-on' : ''} aria-pressed={metric === 'pi'} onClick={() => setMetric('pi')}>PI ↓</button>
        </div>
        <div className="bsr-hbars bsr-hbars-compact">
          {METHODS.map((method, index) => (
            <div key={method} className={`bsr-hbar ${index === bestIndex ? 'is-best' : index === worstIndex ? 'is-worst' : ''} ${method === 'BSRGAN' ? 'is-ours' : ''}`}>
              <span className="bsr-hbar-label">{method}</span>
              <div className="bsr-hbar-track"><i style={{ width: `${(values[index] / max) * 100}%` }} /></div>
              <b>{fmt(values[index])}</b>
            </div>
          ))}
        </div>
        <p className={`bsr-feedback ${metric === 'niqe' ? 'is-red' : 'is-orange'}`}>{feedback}</p>
        <div className="bsr-mismatch-card">
          <b>指标 ≠ 观感</b>
          <p>图 4 中 BSRGAN 去掉了传感器噪声与复杂噪声，边缘更干净；但 NIQE/PI 并不奖励这种结果。</p>
        </div>
        <p className="bsr-note">表 2：20 张真实图，无 GT；同网络结构。NIQE/PI 越低越好，NRQM 越高越好。</p>
      </aside>
    </div>
  );
}
