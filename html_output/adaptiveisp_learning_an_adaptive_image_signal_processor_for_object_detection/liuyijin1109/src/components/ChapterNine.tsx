import { useRef, useState, type PointerEvent } from "react";
import { table1 } from "../content";
import { Panel, Tabs, type Done } from "./Shared";
import { datasets, detectionMetrics, detectorResults, segmentationResults } from "./chapterNineData";
import "./ChapterNine.css";

type Box = { x: number; y: number; w: number; h: number };
const truth: Box = { x: 245, y: 105, w: 190, h: 112 };
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
export function intersectionOverUnion(a: Box, b: Box) {
  const x = Math.max(a.x, b.x), y = Math.max(a.y, b.y);
  const w = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - x);
  const h = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - y);
  const overlap = w * h;
  return overlap / (a.w * a.h + b.w * b.h - overlap);
}

function IoULab({ onDone }: Done) {
  const [x, setX] = useState(158), [y, setY] = useState(82), [threshold, setThreshold] = useState(0.5);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const prediction = { x, y, w: truth.w, h: truth.h };
  const left = Math.max(truth.x, x), top = Math.max(truth.y, y);
  const overlapW = Math.max(0, Math.min(truth.x + truth.w, x + truth.w) - left);
  const overlapH = Math.max(0, Math.min(truth.y + truth.h, y + truth.h) - top);
  const iou = intersectionOverUnion(truth, prediction);
  function pointerDown(e: PointerEvent<SVGRectElement>) {
    const bounds = svg.current?.getBoundingClientRect();
    if (!bounds) return;
    drag.current = { x: e.clientX, y: e.clientY, startX: x, startY: y };
    e.currentTarget.setPointerCapture(e.pointerId);
    onDone();
  }
  function pointerMove(e: PointerEvent<SVGRectElement>) {
    const bounds = svg.current?.getBoundingClientRect();
    if (!drag.current || !bounds) return;
    setX(clamp(Math.round(drag.current.startX + (e.clientX - drag.current.x) * 600 / bounds.width), 0, 410));
    setY(clamp(Math.round(drag.current.startY + (e.clientY - drag.current.y) * 300 / bounds.height), 0, 188));
  }
  return <Panel title="怎样判断检测效果？" kind="动手实验">
    <div className="s9-intro">拖动蓝色预测框，使它贴近汽车的绿色真实框。重合面积与 IoU 会同步变化。</div>
    <div className="s9-iou-layout">
      <svg ref={svg} className="s9-road" viewBox="0 0 600 300" role="img" aria-label={`道路汽车检测示意，当前 IoU ${iou.toFixed(2)}`}>
        <defs><linearGradient id="s9-sky" x2="0" y2="1"><stop stopColor="#c8dfec"/><stop offset="1" stopColor="#edf1e7"/></linearGradient></defs>
        <rect width="600" height="300" fill="url(#s9-sky)"/>
        <path d="M0 160 85 138 155 158 230 142 345 151 430 133 600 162V210H0Z" fill="#a5b8a6"/>
        <path d="M0 220 600 180V300H0Z" fill="#6e7d83"/>
        <path d="M0 258 600 208" stroke="#e8dca6" strokeWidth="5" strokeDasharray="55 38"/>
        <g aria-hidden="true"><path d="M250 161 274 129H390L424 158 440 171V204H240V178Z" fill="#d16c4f" stroke="#683d3d" strokeWidth="3"/><path d="M282 135H386L406 158H265Z" fill="#b8d9de"/><path d="M327 133V158" stroke="#6b838e" strokeWidth="3"/><circle cx="280" cy="207" r="18" fill="#293440"/><circle cx="401" cy="207" r="18" fill="#293440"/><circle cx="280" cy="207" r="8" fill="#b9c6ca"/><circle cx="401" cy="207" r="8" fill="#b9c6ca"/></g>
        <rect {...truth} fill="none" stroke="#238553" strokeWidth="3"/>
        <rect x={left} y={top} width={overlapW} height={overlapH} fill="#eec56e" opacity=".46" pointerEvents="none"/>
        <rect x={x} y={y} width={truth.w} height={truth.h} fill="#376ba8" fillOpacity=".08" stroke="#285b9c" strokeWidth="3" className="s9-dragbox" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}/>
        <text x="250" y="98" fill="#126c3b" fontSize="14" fontWeight="700">真实框</text>
        <text x={x + 4} y={Math.max(18, y - 7)} fill="#1f4e86" fontSize="14" fontWeight="700">预测框 · 拖动</text>
      </svg>
      <div className="s9-iou-readout" aria-live="polite"><span>当前 IoU</span><strong>{iou.toFixed(2)}</strong><span className={iou >= threshold ? "pass" : "fail"}>{iou >= threshold ? "通过" : "未通过"} IoU {threshold.toFixed(2)} 阈值</span><small>交集面积 ÷ 并集面积</small></div>
    </div>
    <div className="s9-control-line"><span>匹配阈值</span><Tabs items={["IoU = 0.50", "IoU = 0.75"]} active={threshold === 0.5 ? 0 : 1} set={i => { setThreshold(i ? 0.75 : 0.5); onDone(); }}/></div>
    <div className="s9-position"><label>横向位置<input type="range" min="0" max="410" value={x} onChange={e => {setX(+e.target.value); onDone();}} /></label><label>纵向位置<input type="range" min="0" max="188" value={y} onChange={e => {setY(+e.target.value); onDone();}} /></label></div>
    <p className="s9-note"><b>从 IoU 到 mAP：</b>IoU 衡量单个预测框与真实框的重合。Precision 看预测中有多少正确，Recall 看目标找回多少。AP 综合不同置信度阈值的 Precision–Recall 表现；mAP 再对目标类别的 AP 求平均。mAP@0.5:0.95 还综合多个 IoU 阈值，不能把此处单个框的 IoU 当成 mAP。</p>
    <p className="s9-note"><b>三种数据来源：</b>LOD 是真实低光 RAW，主要用于训练与测试；OnePlus 是另一设备采集的真实 RAW，用于跨数据集测试；raw COCO 是由 UPI 将 COCO RGB 图像转换成模拟 RAW 风格数据。</p>
  </Panel>;
}

function MethodBars({ dataset, metric, baseline, setBaseline }: { dataset: number; metric: number; baseline: string; setBaseline: (name: string) => void }) {
  const values = table1.map(row => row.values[dataset][metric]);
  const best = Math.max(...values.filter((v): v is number => v !== null));
  const selected = table1.find(row => row.name === baseline)!;
  const base = selected.values[dataset][metric];
  const ours = table1.find(row => row.name === "AdaptiveISP")!.values[dataset][metric]!;
  return <>
    <div className="s9-bars" aria-label={`${datasets[dataset]}，${detectionMetrics[metric]}，单位百分比`}>
      {table1.map((row, i) => { const v = values[i]; const isSelected = row.name === baseline, isOurs = row.name === "AdaptiveISP"; return <button type="button" key={row.name} className={`s9-bar-row ${isSelected ? "selected" : ""} ${isOurs ? "ours" : ""} ${v === best ? "best" : ""}`} onClick={() => { if (!isOurs) setBaseline(row.name); }} aria-label={`${row.name}：${v === null ? "未报告" : `${v.toFixed(1)}%`}${v === best ? "，当前最高" : ""}`}>
        <span className="s9-method-name">{row.name}</span><span className="s9-bar-track">{v !== null && <i style={{ width: `${v}%` }}/>}</span><strong>{v === null ? "未报告" : v.toFixed(1)}</strong>{v === best && <em>最高</em>}
      </button>; })}
    </div>
    <div className="s9-comparison" aria-live="polite"><strong>AdaptiveISP {ours.toFixed(1)}%</strong><span>与 {baseline} {base === null ? "未报告，无法计算差值" : `${base.toFixed(1)}% · ${ours - base >= 0 ? "+" : ""}${(ours - base).toFixed(1)} 个百分点`}</span></div>
    <p className="s9-note">{dataset === 1 && metric === 0 ? "此条件下 Attention-aware Learning 为 70.9%，高于 AdaptiveISP 的 70.1%；AdaptiveISP 并非处处排名第一。" : base === null ? "此对照没有报告当前数据集与指标的结果，不能推断差值。" : ours === best ? "当前条件下 AdaptiveISP 领先，但相对最强对照方法的优势可能较小。" : "当前条件下 AdaptiveISP 并未领先，需按所选指标解读。"} Table 1 未提供完整多随机种子置信区间，不能据此断言差异具有统计显著性。</p>
  </>;
}

function TableOneLab({ onDone }: Done) {
  const [dataset, setDataset] = useState(0), [metric, setMetric] = useState(2), [baseline, setBaseline] = useState("Attention-aware Learning");
  const baselineNames = table1.filter(row => row.name !== "AdaptiveISP").map(row => row.name);
  return <Panel title="比旧方法更好吗？" kind="论文报告">
    <p className="s9-intro">选择测试数据集、检测指标与对照方法。柱长表示 mAP（%），最高结果随条件变化。</p>
    <div className="s9-selector"><span>数据集</span><Tabs items={datasets} active={dataset} set={i => {setDataset(i); onDone();}} label="选择数据集"/></div>
    <div className="s9-selector"><span>指标</span><Tabs items={detectionMetrics} active={metric} set={i => {setMetric(i); onDone();}} label="选择指标"/></div>
    <label className="s9-select-label">对照方法 <select value={baseline} onChange={e => {setBaseline(e.target.value); onDone();}}>{baselineNames.map(name => <option key={name}>{name}</option>)}</select></label>
    <MethodBars dataset={dataset} metric={metric} baseline={baseline} setBaseline={name => {setBaseline(name); onDone();}}/>
  </Panel>;
}

function Generalization({ onDone }: Done) {
  const [view, setView] = useState(0), [metric, setMetric] = useState(2), [segMetric, setSegMetric] = useState(1), [segment, setSegment] = useState(false);
  return <Panel title="换个环境还有效吗？" kind="论文报告">
    <p className="s9-intro">选择一种未在主要训练条件中直接出现的测试，观察证据覆盖到哪里。</p>
    <Tabs items={["跨数据集", "跨检测器", "跨任务 · 分割"]} active={view} set={i => {setView(i); onDone();}} label="选择泛化实验"/>
    {view === 0 && <div className="s9-general-body"><div className="s9-flow">LOD 训练 <span>→</span> OnePlus / raw COCO 测试</div><Tabs items={detectionMetrics} active={metric} set={i => {setMetric(i); onDone();}} label="跨数据集指标"/><div className="s9-cross-datasets">{[1,2].map(d => { const ours = table1[7].values[d][metric]!; const alternatives = table1.slice(0,7).map(r => r.values[d][metric]).filter((v):v is number => v !== null); const best = Math.max(...alternatives); return <div key={d}><h5>{datasets[d]}</h5><div className="s9-paired"><span>最强对照 {best.toFixed(1)}%</span><i style={{width:`${best}%`}}/><span>AdaptiveISP {ours.toFixed(1)}%</span><b style={{width:`${ours}%`}}/></div><small>{ours >= best ? `领先 ${(ours-best).toFixed(1)} 个百分点` : `落后 ${(best-ours).toFixed(1)} 个百分点`}</small></div>; })}</div><p className="s9-note">OnePlus 是真实相机 RAW；raw COCO 是由 RGB 合成的模拟 RAW 风格数据。输入来源不同，结果支持这两项测试中的跨数据集泛化，不能推广为适应任意传感器。</p></div>}
    {view === 1 && <div className="s9-general-body"><Tabs items={detectionMetrics} active={metric} set={i => {setMetric(i); onDone();}} label="跨检测器指标"/><p className="s9-axis-title">LOD · {detectionMetrics[metric]}（%）</p><div className="s9-detector-grid">{detectorResults.map(row => <div key={row.name} className="s9-detector"><h5>{row.name}</h5><div className="s9-detector-pair"><span>RGB {row.rgb[metric].toFixed(1)}</span><i style={{width:`${row.rgb[metric]}%`}}/><span>AdaptiveISP {row.adaptive[metric].toFixed(1)}</span><b style={{width:`${row.adaptive[metric]}%`}}/></div><small>+{(row.adaptive[metric]-row.rgb[metric]).toFixed(1)} 个百分点</small></div>)}</div><p className="s9-note">Table 3 的对照是已有 ISP 处理的 RGB 输入。YOLOX 与 DDQ 不参与 AdaptiveISP 策略训练；结果支持这两个检测器的迁移，尚不能证明所有检测器都适用。</p></div>}
    {view === 2 && <div className="s9-general-body"><button className="s9-seg-toggle" type="button" aria-pressed={segment} onClick={() => {setSegment(!segment); onDone();}}>{segment ? "显示检测框" : "显示像素分割"}</button><div className={`s9-seg-scene ${segment ? "show-mask" : ""}`} aria-label={segment ? "分割识别汽车覆盖的像素区域" : "检测用矩形框定位汽车"}><svg viewBox="0 0 300 120" role="img"><path d="M40 73 64 42H204L244 69 254 85H31Z" fill="#d8815c"/><path d="M73 46H197L222 70H54Z" fill="#bcdbe2"/><circle cx="77" cy="87" r="14" fill="#3d4654"/><circle cx="210" cy="87" r="14" fill="#3d4654"/><path className="s9-seg-mask" d="M40 73 64 42H204L244 69 254 85H224A14 14 0 0 0 196 85H91A14 14 0 0 0 63 85H31Z" fill="#e5ae43"/><rect className="s9-seg-box" x="28" y="37" width="230" height="66" fill="none" stroke="#285b9c" strokeWidth="3"/></svg><span>{segment ? "Segmentation · 识别目标像素" : "Object Detection · 矩形框定位"}</span></div><Tabs items={["mAP@0.5", "mAP@0.5:0.95"]} active={segMetric} set={i => {setSegMetric(i); onDone();}} label="分割指标"/><p className="s9-axis-title">raw COCO · 预训练 YOLO-v5 分割模型 · {segMetric ? "mAP@0.5:0.95" : "mAP@0.5"}（%）</p><div className="s9-seg-results">{segmentationResults.map(row => <div key={row.name} className={row.name === "AdaptiveISP" ? "ours" : ""}><span>{row.name}</span><i style={{width:`${row.values[segMetric]}%`}}/><strong>{row.values[segMetric].toFixed(1)}</strong></div>)}</div><p className="s9-note">AdaptiveISP 比最强对照方法高 {segMetric === 0 ? "0.6" : "0.4"} 个百分点。Table 2 给出积极但幅度有限的跨任务结果，不能推为普遍的多任务最优性。</p></div>}
  </Panel>;
}

export function ChapterNine({ onDone }: Done) { return <div className="s9-chapter"><IoULab onDone={onDone}/><TableOneLab onDone={onDone}/><Generalization onDone={onDone}/></div>; }
