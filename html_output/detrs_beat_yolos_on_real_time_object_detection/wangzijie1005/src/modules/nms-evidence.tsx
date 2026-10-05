import { useState } from 'react';
import { C, Scene, clear, bar, text, Feedback, Source } from './shared-kit';

const samples = [
  { confidence: '0.001', ap: 52.9, ms: 2.36 },
  { confidence: '0.01', ap: 52.4, ms: 1.73 },
  { confidence: '0.05', ap: 51.2, ms: 1.06 },
];
export function NmsEvidence() {
  const [selected, setSelected] = useState(0);
  const value = samples[selected];
  return <div onKeyDown={event => event.stopPropagation()}>
    <p>固定 NMS IoU 阈值为 0.7，只选择论文实际测量的 confidence 阈值。</p>
    <div className="chip-row" role="group" aria-label="论文测量的置信度阈值">{samples.map((sample, index) => <button key={sample.confidence} className={`chip ${index === selected ? 'active' : ''}`} aria-pressed={selected === index} onClick={() => setSelected(index)}>confidence {sample.confidence}</button>)}</div>
    <Scene height={180} label={`作者报告值，AP ${value.ap}，EfficientNMS kernel ${value.ms} 毫秒。两条柱使用独立的标尺。`} draw={ctx => {
      clear(ctx, 560, 180);
      bar(ctx, 84, 35, 416, 24, C.line); bar(ctx, 84, 35, 416 * value.ap / 60, 24, C.blue);
      bar(ctx, 84, 109, 416, 24, C.line); bar(ctx, 84, 109, 416 * value.ms / 3, 24, C.orange);
      text(ctx, 'AP', 28, 53, C.ink); text(ctx, 'NMS', 22, 128, C.ink);
      text(ctx, '0', 82, 80, C.ink); text(ctx, '60 AP', 451, 80, C.ink);
      text(ctx, '0', 82, 156, C.ink); text(ctx, '3 ms', 461, 156, C.ink);
    }} />
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, margin: '10px 0' }} aria-live="polite"><span>AP：<strong>{value.ap.toFixed(1)}</strong></span><span>EfficientNMS kernel：<strong>{value.ms.toFixed(2)} ms</strong></span></div>
    <Feedback>作者报告：AP {value.ap.toFixed(1)}，EfficientNMS kernel {value.ms.toFixed(2)} ms。此时间不等于整个 NMS 插件，更不是检测系统总时延。</Feedback>
    <p style={{ fontSize: 16 }}>原文对象写作 YOLOv8，未在该段注明型号后缀。设备为 T4，TensorRT FP16；插件中其他 kernel 的耗时未计入本表。柱长仅帮助读取各自数值，AP 与毫秒不能直接相加或比较长短。</p>
    <Source page={3} label="原文第 3 页 Table 1：固定 IoU = 0.7 的三组测量点" />
  </div>;
}
