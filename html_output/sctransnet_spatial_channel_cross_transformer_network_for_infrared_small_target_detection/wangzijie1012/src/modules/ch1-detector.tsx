import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { useCanvas, C, Chips, Readouts, Slider, Feedback, Source, fmt } from './kit';
import { makeScene, evaluate, sweep, toImageData, N } from './ir-scene';

// 模块 1.1：只看“局部对比”的检测器在一张合成红外帧上的两难。
// 拖动阈值，检测结果、Pd / Fa / IoU 与右侧 Pd–Fa 折线上的当前点同步更新。

const SIZE = 352;

export const DetectorLab: React.FC<WidgetProps> = () => {
  const scene = useMemo(() => makeScene(), []);
  const curve = useMemo(() => sweep(scene, 60), [scene]);
  const [t, setT] = useState(0.6);
  const [view, setView] = useState<'img' | 'map'>('img');
  const e = useMemo(() => evaluate(scene, t), [scene, t]);

  const ref = useCanvas(
    SIZE,
    SIZE,
    (ctx) => {
      ctx.fillStyle = C.plate;
      ctx.fillRect(0, 0, SIZE, SIZE);
      const off = document.createElement('canvas');
      off.width = N;
      off.height = N;
      const o = off.getContext('2d');
      if (!o) return;
      o.putImageData(view === 'img' ? toImageData(o, scene.img) : toImageData(o, scene.contrast, 0.6, 0, 0.9), 0, 0);
      ctx.imageSmoothingEnabled = view === 'img';
      ctx.drawImage(off, 0, 0, SIZE, SIZE);
      const k = SIZE / N;
      // 预测像素（橙色半透明）
      ctx.fillStyle = 'rgba(255,160,106,0.55)';
      for (let i = 0; i < N * N; i++) {
        if (e.pred[i]) ctx.fillRect((i % N) * k, Math.floor(i / N) * k, k, k);
      }
      for (const r of e.regions) {
        if (r.pixels.length < 1) continue;
        ctx.strokeStyle = r.matched ? C.greenD : C.redD;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc((r.cx + 0.5) * k, (r.cy + 0.5) * k, 10, 0, Math.PI * 2);
        ctx.stroke();
      }
      scene.targets.forEach((tg, i) => {
        if (e.hits[i]) return;
        ctx.strokeStyle = C.redD;
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc((tg.x + 0.5) * k, (tg.y + 0.5) * k, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    },
    [t, view, e]
  );

  const hits = e.hits.filter(Boolean).length;
  const falseRegions = e.regions.filter((r) => !r.matched).length;
  let tone: 'good' | 'bad' | 'info' = 'info';
  let msg: React.ReactNode;
  if (hits === 2 && falseRegions > 0) {
    tone = 'bad';
    msg = (
      <>
        两个目标都找到了，但同时留下 <b>{falseRegions}</b> 处虚警：建筑上的热点和云边亮斑的局部对比并不比目标低。
      </>
    );
  } else if (hits < 2 && falseRegions > 0) {
    tone = 'bad';
    msg = (
      <>
        阈值抬高后漏掉了 <b>{2 - hits}</b> 个目标，却仍有 <b>{falseRegions}</b> 处杂波留在结果里——最“突出”的亮点恰恰不是目标。
      </>
    );
  } else if (hits < 2) {
    tone = 'bad';
    msg = <>阈值过高，目标与杂波一起消失。</>;
  } else {
    tone = 'good';
    msg = <>两个目标都被检出且没有虚警。</>;
  }

  // Pd–Fa 图
  const cw = 360;
  const ch = 250;
  const pad = { l: 46, r: 14, t: 16, b: 38 };
  const faMax = 3000; // ×10⁻⁶，图中横轴上限
  const X = (fa: number) => pad.l + (Math.min(fa * 1e6, faMax) / faMax) * (cw - pad.l - pad.r);
  const Y = (pd: number) => ch - pad.b - pd * (ch - pad.t - pad.b);
  const path = curve.map((p, i) => `${i ? 'L' : 'M'}${X(p.fa).toFixed(1)},${Y(p.pd).toFixed(1)}`).join(' ');

  return (
    <div className="sx-lab">
      <Chips
        label="显示"
        value={view}
        onChange={setView}
        options={[
          { value: 'img', label: '红外帧' },
          { value: 'map', label: '局部对比图' },
        ]}
      />
      <div className="sx-split">
        <div className="sx-plate">
          <canvas ref={ref} style={{ width: SIZE, height: SIZE }} role="img" aria-label="合成红外帧与检测结果" />
          <div className="sx-legend-row">
            <span className="lg"><i className="ring" style={{ borderColor: C.greenD }} />命中目标</span>
            <span className="lg"><i className="ring" style={{ borderColor: C.redD }} />虚警</span>
            <span className="lg"><i className="ring dashed" style={{ borderColor: C.redD }} />漏检</span>
            <span className="lg"><i className="sq" style={{ background: 'rgba(255,160,106,0.8)' }} />预测像素</span>
          </div>
        </div>
        <div className="sx-side">
          <svg viewBox={`0 0 ${cw} ${ch}`} width="100%" className="sx-chart" role="img" aria-label="阈值扫描得到的 Pd–Fa 折线">
            {[0, 0.5, 1].map((v) => (
              <g key={v}>
                <line x1={pad.l} x2={cw - pad.r} y1={Y(v)} y2={Y(v)} className="grid" />
                <text x={pad.l - 8} y={Y(v) + 4} textAnchor="end" className="tick">
                  {v.toFixed(1)}
                </text>
              </g>
            ))}
            {[0, 1000, 2000, 3000].map((v) => (
              <text key={v} x={X(v / 1e6)} y={ch - pad.b + 16} textAnchor="middle" className="tick">
                {v}
              </text>
            ))}
            <text x={(pad.l + cw - pad.r) / 2} y={ch - 4} textAnchor="middle" className="axis">
              Fa（×10⁻⁶）
            </text>
            <text x={12} y={(pad.t + ch - pad.b) / 2} textAnchor="middle" className="axis" transform={`rotate(-90 12 ${(pad.t + ch - pad.b) / 2})`}>
              Pd
            </text>
            <path d={path} fill="none" stroke={C.blue} strokeWidth={1.8} />
            <circle cx={X(e.fa)} cy={Y(e.pd)} r={6} fill={C.orange} stroke="#fff" strokeWidth={1.5} />
          </svg>
          <Readouts
            cols={3}
            items={[
              { k: 'Pd', v: fmt(e.pd * 100, 0), unit: '%', tone: e.pd === 1 ? 'green' : 'red' },
              { k: 'Fa', v: fmt(e.fa * 1e6, 0), unit: '×10⁻⁶', tone: e.fa === 0 ? 'green' : 'red' },
              { k: 'IoU', v: fmt(e.iou * 100, 1), unit: '%' },
            ]}
          />
        </div>
      </div>
      <Slider label="局部对比阈值" min={0.3} max={0.96} step={0.01} value={t} onChange={setT} display={t.toFixed(2)} />
      <Feedback tone={tone}>{msg}</Feedback>
      <Source>
        合成图像与检测器均为本导读自建的教学示意（160×160 像素），数字只描述这张图。评估口径按作者代码 <code>metrics.py</code>：8 连通域，预测连通域质心与真值质心距离 &lt; 3 像素计为命中；未匹配的预测像素计入 Fa。论文的指标定义见 §IV-A 式 (18)–(22)。
      </Source>
    </div>
  );
};
