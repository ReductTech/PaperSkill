import { useMemo, useState } from "react";
import { Panel, Tabs, type Done } from "./Shared";
import { drawModuleRoad } from "./moduleRoad";
import { processImage } from "./moduleProcessing";
import "./ChapterTen.css";

const routes = [
  ["Desaturation", "Sharpen/Blur", "CCM", "Tone Mapping", "Saturation"],
  ["CCM", "Sharpen/Blur", "Tone Mapping", "Desaturation", "Saturation"],
  ["CCM", "Sharpen/Blur", "White Balance", "Tone Mapping", "Desaturation"],
] as const;
// Figure 5, NeurIPS 2024, PDF p.9: [pipeline][subset][mAP@0.5, mAP@0.75].
const results = [
  [[63.0, 39.8], [82.1, 66.8], [78.2, 64.5]],
  [[62.1, 39.6], [82.7, 68.9], [79.2, 65.2]],
  [[62.4, 39.5], [82.4, 67.8], [79.1, 65.4]],
] as const;
const subsetNotes = ["较暗 / 噪声", "灯光 / 明暗跨度", "较亮 / 色偏"];
const conditionNames = ["高噪声", "低噪声", "明显色偏", "高动态范围"];
const preference = ["Desaturation", "CCM", "White Balance", "Tone Mapping"];
const explanations = [
  "高 ISO 常伴随更明显的彩色噪声。去饱和压低颜色差异，彩色噪点会变弱；亮度噪声仍可见。",
  "较低 ISO 的输入通常噪声较轻。CCM 以矩阵混合 RGB 通道，调整颜色响应与色彩关系。",
  "白平衡分别调整 RGB 通道增益，可纠正整体偏色；CCM 则会混合通道，两者作用并不相同。",
  "亮部和暗部跨度大时，色调映射以非线性曲线重新分配亮度，让两端细节更易同时呈现。",
];

function clamp(x: number) { return Math.max(0, Math.min(255, x)); }
function sceneImages(condition: number): [string, string] {
  const canvas = document.createElement("canvas");
  canvas.width = 560; canvas.height = 300;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return ["", ""];
  drawModuleRoad(ctx);
  const input = ctx.getImageData(0, 0, 560, 300);
  const d = input.data;
  for (let i = 0; i < d.length; i += 4) {
    const x = (i / 4) % 560;
    const y = Math.floor(i / 4 / 560);
    if (condition === 0) {
      const noiseR = ((x * 37 + y * 71 + x * y * 13) % 91) - 45;
      const noiseB = ((x * 83 + y * 29 + x * y * 7) % 83) - 41;
      d[i] = clamp(d[i] * .68 + noiseR * 1.25);
      d[i + 1] = clamp(d[i + 1] * .68 + (noiseR + noiseB) * .32);
      d[i + 2] = clamp(d[i + 2] * .68 + noiseB * 1.3);
    } else if (condition === 1) {
      d[i] = clamp(d[i] * .93);
      d[i + 1] = clamp(d[i + 1] * .98);
      d[i + 2] = clamp(d[i + 2] * 1.04);
    } else if (condition === 2) {
      d[i] = clamp(d[i] * 1.45);
      d[i + 1] = clamp(d[i + 1] * 1.05);
      d[i + 2] = clamp(d[i + 2] * .62);
    } else {
      const scale = y < 145 ? 1.48 : .48;
      d[i] = clamp(d[i] * scale);
      d[i + 1] = clamp(d[i + 1] * scale);
      d[i + 2] = clamp(d[i + 2] * scale);
    }
  }
  ctx.putImageData(input, 0, 0);
  const before = canvas.toDataURL("image/png");
  const operations = [[8, .82], [2, .9], [9, -.8], [5, .9]];
  const [module, amount] = operations[condition];
  ctx.putImageData(processImage(input, module, amount), 0, 0);
  return [before, canvas.toDataURL("image/png")];
}

function CrossTest({ onDone }: Done) {
  const [metric, setMetric] = useState(0);
  const [route, setRoute] = useState(0);
  const [subset, setSubset] = useState(0);
  const [visited, setVisited] = useState<string[]>([]);
  const scenes = useMemo(() => [sceneImages(0)[0], sceneImages(3)[0], sceneImages(2)[0]], []);
  const choose = (r: number, s: number, m = metric) => {
    setRoute(r); setSubset(s); setMetric(m);
    const key = `${r}:${s}:${m}`;
    if (!visited.includes(key)) {
      const next = [...visited, key]; setVisited(next);
      if (next.length >= 3) onDone();
    }
  };
  const value = results[route][subset][metric];
  const best = Math.max(...results.map(row => row[subset][metric]));
  const bestRoute = results.findIndex(row => row[subset][metric] === best);
  const delta = best - value;
  return <Panel title="一条路线适合所有图像吗？" kind="论文报告">
    <p className="s10-intro">作者从 LOD 中选取三条代表性路线和对应输入，形成三个子集，再让每条路线在每个子集上交叉测试。点击矩阵，比较同一列的报告结果。</p>
    <Tabs items={["mAP@0.5", "mAP@0.75"]} active={metric} set={m => choose(route, subset, m)} label="交叉测试指标" />
    <div className="s10-matrix-scroll" tabIndex={0} role="region" aria-label="Figure 5 三乘三交叉测试矩阵">
      <table className="s10-matrix"><thead><tr><th scope="col">LOD</th>{subsetNotes.map((note,s) => <th scope="col" key={s}><button className={subset === s ? "active" : ""} aria-pressed={subset === s} onClick={() => choose(route,s)}>Subset {s+1}<small>{note} · 教学提示</small></button></th>)}</tr></thead>
        <tbody>{results.map((row,r) => <tr key={r}><th scope="row"><button className={route === r ? "active" : ""} aria-pressed={route === r} onClick={() => choose(r,subset)}>Pipeline {r+1}</button></th>{row.map((pair,s) => {const maximum = Math.max(...results.map(other => other[s][metric])); return <td key={s}><button onClick={() => choose(r,s)} aria-pressed={r === route && s === subset} className={`${r === route && s === subset ? "selected" : ""} ${pair[metric] === maximum ? "best" : ""}`} aria-label={`Pipeline ${r+1}，Subset ${s+1}，mAP@${metric ? "0.75" : "0.5"} 为 ${pair[metric].toFixed(1)}${pair[metric] === maximum ? "，当前指标该子集最高" : ""}`}><strong>{pair[metric].toFixed(1)}</strong>{pair[metric] === maximum && <span>该列最高</span>}</button></td>})}</tr>)}</tbody>
      </table>
    </div>
    <div className="s10-subsets" aria-label="与三个子集条件对应的教学场景">
      {scenes.map((src,s) => <button key={s} className={subset === s ? "active" : ""} aria-pressed={subset === s} onClick={() => choose(route,s)}><img src={src} alt={`Subset ${s+1} 的${subsetNotes[s]}条件教学示意`} /><span>Subset {s+1} · {subsetNotes[s]}</span></button>)}
    </div>
    <div className="s10-evidence" aria-live="polite"><div><span>Pipeline {route+1} × Subset {subset+1}</span><strong>{value.toFixed(1)}</strong><small>mAP@{metric ? "0.75" : "0.5"} · 子集统计指标</small></div><div><span>该子集最高 · Pipeline {bestRoute+1}</span><strong>{best.toFixed(1)}</strong><small>{delta === 0 ? "当前组合达到最高报告值" : `当前组合低 ${delta.toFixed(1)} 个百分点`}</small></div></div>
    <div className="s10-compare" aria-label={`当前 Pipeline ${route+1} 为 ${value.toFixed(1)}，最高为 ${best.toFixed(1)}`}><span>当前</span><i><b style={{width:`${value}%`}} /></i><strong>{value.toFixed(1)}</strong><span>最高</span><i><b style={{width:`${best}%`}} /></i><strong>{best.toFixed(1)}</strong></div>
    <div className="s10-routes" aria-label="Figure 5 三条五阶段路线">{routes.map((steps,r) => <button key={r} className={route === r ? "active" : ""} aria-pressed={route === r} onClick={() => choose(r,subset)}><strong>Pipeline {r+1}</strong><span>{steps.map((step,i) => <span key={i}>{i > 0 && <em aria-hidden="true">→</em>}{step}</span>)}</span></button>)}</div>
    <p className="s10-insight">{subset === 2 ? `Subset 3 的最佳路线会随指标改变：@0.5 为 Pipeline 2（79.2），@0.75 为 Pipeline 3（65.4）。当前选中 ${metric ? "@0.75" : "@0.5"}。` : `在 Subset ${subset+1}，Pipeline ${bestRoute+1} 的所选指标最高；切换列和指标，可以看到同一条路线并非处处领先。`}</p>
  </Panel>;
}

function ModulePreference({ onDone }: Done) {
  const [condition, setCondition] = useState(0);
  const [seen, setSeen] = useState([0]);
  const [before, after] = useMemo(() => sceneImages(condition), [condition]);
  const select = (i: number) => {setCondition(i); if (!seen.includes(i)) {const next=[...seen,i]; setSeen(next); if(next.length >= 3) onDone();}};
  return <Panel title="为什么会选不同模块？">
    <p className="s10-intro">改变同一幅道路示意图的成像条件，观察处理前后差别。下方是对模块作用的教学近似；论文描述的是 Policy 学到的偏好趋势。</p>
    <Tabs items={conditionNames} active={condition} set={select} label="道路场景条件" />
    <div className="s10-image-pair"><figure><figcaption>处理前 · {conditionNames[condition]}</figcaption>{before && <img key={`before-${condition}`} src={before} alt={`${conditionNames[condition]}条件下的道路教学场景，处理前`} />}</figure><figure><figcaption>处理后 · {preference[condition]}</figcaption>{after && <img key={`after-${condition}`} src={after} alt={`应用${preference[condition]}教学近似后的同一道路场景`} />}</figure></div>
    <div className="s10-preference" aria-live="polite"><div className="s10-module-list">{preference.map((name,i) => <span key={name} className={condition === i ? "active" : ""}>{name}</span>)}</div><p><strong>{conditionNames[condition]} → 倾向 {preference[condition]}</strong><br />{explanations[condition]}</p></div>
  </Panel>;
}

export function ChapterTen({ onDone }: Done) { return <div className="s10-chapter"><CrossTest onDone={onDone} /><ModulePreference onDone={onDone} /></div>; }
