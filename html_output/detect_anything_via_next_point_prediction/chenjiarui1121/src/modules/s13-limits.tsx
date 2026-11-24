import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, LakeScene, rng } from './rex-kit';

// Sec. 6.2 / Fig. 18: generation time grows roughly linearly with the number of boxes
// (0–29 boxes < 2 s; 410–419 boxes > 16 s; one A100, vLLM, BF16). Table 17: 5.1–7.6 output tokens per box.
const estSeconds = (n: number) => 2 + (n - 29) * (14 / 386); // through (29 boxes, 2 s) and (415 boxes, 16 s)

export function S13Limits(_: WidgetProps) {
  const [n, setN] = useState(30);
  const spots = useMemo(() => { const r = rng(42); return Array.from({ length: 420 }, () => [40 + r() * 920, 215 + r() * 320] as [number, number]); }, []);
  const coord = 4 * n;
  const lo = Math.round(n * 5.1), hi = Math.round(n * 7.6);
  const sec = estSeconds(n);
  const s = n <= 60 ? 1.7 : n <= 150 ? 1.2 : .85;
  return <div className="rx-page rx-s13">
    <div className="rx-s13-left">
      <svg viewBox="0 0 1000 560" width="780" height="437" role="img" aria-label={`示意图中 ${n} 个目标`}>
        <LakeScene rocks={false}>
          {spots.slice(0, n).map(([x, y], i) => <g key={i}>
            <g transform={`translate(${x} ${y}) scale(${s})`}>
              <ellipse rx="10" ry="5.5" fill="#fff" stroke="#9aa7b0" strokeWidth="1" />
              <path d="M5 -3 q6 -9 1 -15" stroke="#fff" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d="M5 -3 q6 -9 1 -15" stroke="#9aa7b0" strokeWidth="1" fill="none" />
              <path d="M6 -18 l6 1" stroke="#e3b33d" strokeWidth="2.5" />
              <rect x="-12" y="-21" width="26" height="28" fill="none" stroke={C.green} strokeWidth="1.5" opacity=".85" /></g></g>)}
        </LakeScene>
      </svg>
      <label className="rx-slider">
        <span className="rx-text">预测框数量 <b>{n}</b></span>
        <input type="range" min="10" max="420" step="10" value={n} onChange={e => setN(Number(e.target.value))} aria-label="预测框数量" />
      </label>
    </div>
    <div className="rx-s13-right">
      <div className="rx-metrics rx-s13-metrics">
        <div><span className="rx-text">坐标词元</span><b className="rx-em">{coord}</b></div>
        <div><span className="rx-text">输出词元</span><b className="rx-em">{lo}–{hi}</b></div>
        <div><span className="rx-text">生成时间</span><b className={`rx-em ${sec > 8 ? 'rx-red' : 'rx-green'}`}>{n < 30 ? '< 2 秒' : `≈${sec.toFixed(1)} 秒`}</b></div>
      </div>
      <p className="rx-text" aria-live="polite">每个框 4 个坐标词元，一个接一个地写，所以框越多越慢。{n >= 300 ? '几百只鸟时要十几秒；传统检测器一次前向就给出全部框，快得多。' : n < 30 ? '30 个框以内不到 2 秒。' : '时间随框数大致线性增长。'}时间按论文图 18 的两个端点粗略线性估计。</p>
      <h3 className="rx-h">论文报告的其他局限</h3>
      <ul className="rx-limits">
        <li>框要求极其贴合时：COCO F1@0.95 为 15.9，DINO-R50 为 21.1。</li>
        <li>视觉提示：FSC147 F1@0.5 为 86.0，专用模型 T-Rex2 为 91.5。</li>
        <li>人体关键点：COCO F1@OKS0.5 为 44.4，X-Pose 为 66.3（动物 AP10K 上反超：30.1 比 17.0）。</li>
      </ul>
    </div>
  </div>;
}
