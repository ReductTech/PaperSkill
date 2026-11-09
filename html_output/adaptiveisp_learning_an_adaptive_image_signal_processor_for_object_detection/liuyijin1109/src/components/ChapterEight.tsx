import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Panel, type Done } from "./Shared";
import { drawModuleRoad } from "./moduleRoad";
import { processImage } from "./moduleProcessing";
import "./ChapterEight.css";

type Step = { module: number; name: string; value: number; parameter: string };
type Method = { name: string; short: string; note: string; train: [boolean, boolean]; live: [boolean, boolean]; routes: [Step[], Step[]] };
const step = (module: number, name: string, value: number, parameter: string): Step => ({ module, name, value, parameter });
// Hypothetical teaching paths, deliberately distinct from any baseline's reported configuration.
const methods: Method[] = [
  { name: "Hyperparameter Optimization", short: "A · 固定结构 + 固定参数", note: "只优化既定 ISP 的参数；训练完成后，两种输入共用一套配置。", train: [false, true], live: [false, false], routes: [
    [step(1, "Gamma", .92, "γ .92"), step(2, "CCM", .28, "p .28"), step(6, "对比度", .18, "p .18")],
    [step(1, "Gamma", .92, "γ .92"), step(2, "CCM", .28, "p .28"), step(6, "对比度", .18, "p .18")],
  ] },
  { name: "Attention-aware Learning", short: "B · 固定结构 + 动态参数", note: "模块顺序仍固定；根据输入预测参数。DynamicISP 也是动态参数方向的相关方法。", train: [false, true], live: [false, true], routes: [
    [step(1, "Gamma", .92, "γ .92"), step(2, "CCM", .28, "p .28"), step(6, "对比度", .18, "p .18")],
    [step(1, "Gamma", .73, "γ .73"), step(2, "CCM", .28, "p .28"), step(6, "对比度", .34, "p .34")],
  ] },
  { name: "ReconfigISP / Refactoring ISP", short: "C · 搜索结构 + 部署固定", note: "两种方法都可在搜索阶段联合优化结构和参数；这里展示搜索结束后的固定推理配置。", train: [true, true], live: [false, false], routes: [
    [step(2, "CCM", .36, "p .36"), step(1, "Gamma", .88, "γ .88"), step(5, "色调映射", .24, "p .24")],
    [step(2, "CCM", .36, "p .36"), step(1, "Gamma", .88, "γ .88"), step(5, "色调映射", .24, "p .24")],
  ] },
  { name: "AdaptiveISP", short: "D · 逐图逐阶段决策", note: "训练好的策略读取当前处理状态，逐阶段选模块并预测对应参数。", train: [true, true], live: [true, true], routes: [
    [step(2, "CCM", .5, "p .50"), step(1, "Gamma", .9, "γ .90"), step(6, "对比度", .2, "p .20")],
    [step(1, "Gamma", .68, "γ .68"), step(0, "曝光", .58, "+.58 EV"), step(8, "去饱和", .48, "p .48")],
  ] },
];
const matrixMethods = [methods[0], methods[1], { ...methods[2], name: "ReconfigISP", note: "神经架构搜索可优化结构与参数；搜索结果在论文比较设置的推理阶段固定。" }, { ...methods[2], name: "Refactoring ISP", note: "多目标搜索联合考虑结构、参数、任务与计算预算；论文比较设置中部署配置固定。" }, methods[3]];
const sceneNames = ["正常光照", "低光照"];
const snapshotCache = new Map<string, string[]>();

function snapshots(method: Method, scene: number): string[] {
  const key = `${method.name}:${scene}`;
  const saved = snapshotCache.get(key);
  if (saved) return saved;
  const canvas = document.createElement("canvas");
  canvas.width = 560; canvas.height = 300;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  drawModuleRoad(ctx);
  let pixels = ctx.getImageData(0, 0, 560, 300);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const x = (i / 4) % 560, y = Math.floor(i / 4 / 560);
    if (scene === 0) {
      pixels.data[i] = Math.min(255, pixels.data[i] * 1.06);
      pixels.data[i + 2] *= .94;
    } else {
      const noise = ((x * 37 + y * 73 + x * y * 11) % 41) - 20;
      pixels.data[i] = Math.max(0, pixels.data[i] * .47 + noise * .65);
      pixels.data[i + 1] = Math.max(0, pixels.data[i + 1] * .49 - noise * .22);
      pixels.data[i + 2] = Math.max(0, pixels.data[i + 2] * .52 - noise * .55);
    }
  }
  ctx.putImageData(pixels, 0, 0);
  const images = [canvas.toDataURL("image/png")];
  for (const action of method.routes[scene]) {
    pixels = processImage(pixels, action.module, action.value);
    ctx.putImageData(pixels, 0, 0);
    images.push(canvas.toDataURL("image/png"));
  }
  snapshotCache.set(key, images);
  return images;
}

function useImages(method: Method, scene: number) {
  return useMemo(() => snapshots(method, scene), [method, scene]);
}

function Route({ method, scene, stage, progressive = false }: { method: Method; scene: number; stage: number; progressive?: boolean }) {
  return <div className="s8-route" aria-label={`${method.name} 的处理顺序`}>
    {method.routes[scene].map((action, i) => <span key={i} className={i === stage - 1 ? "current" : i < stage ? "passed" : ""}>
      <b>{String(i + 1).padStart(2, "0")} {progressive && i >= stage ? "待决策" : action.name}</b><small>{progressive && i >= stage ? "—" : action.parameter}</small>
    </span>)}
  </div>;
}

function CompareRow({ method, scene, stage }: { method: Method; scene: number; stage: number }) {
  const images = useImages(method, scene);
  return <div className={`s8-row ${method.name === "AdaptiveISP" ? "adaptive" : ""}`}>
    <div className="s8-row-name"><strong>{method.short}</strong><small>{method.name}</small></div>
    <Route method={method} scene={scene} stage={stage} progressive={method.name === "AdaptiveISP"} />
    <div className="s8-result">{images[stage] && <img src={images[stage]} alt={`${method.name} 对${sceneNames[scene]}输入执行 ${stage} 步后的教学图像`} />}</div>
  </div>;
}

function SynchronizedComparison({ onDone }: Done) {
  const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [beat, setBeat] = useState(reduced ? 3 : 0);
  const [playing, setPlaying] = useState(!reduced);
  const completed = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const scene = beat >= 5 ? 1 : 0;
  const stage = Math.min(3, beat % 5);
  const input = useImages(methods[0], scene)[0];
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setBeat((n) => (n + 1) % 10), 1100);
    return () => clearTimeout(timer);
  }, [beat, playing]);
  useEffect(() => {
    if ((beat >= 8 || (reduced && scene === 1)) && !completed.current) { completed.current = true; onDoneRef.current(); }
  }, [beat, reduced, scene]);
  return <Panel title="固定结构的局限">
    <div className="s8-comparison">
      <div className="s8-topline">
        <div className="s8-input">{input && <img src={input} alt={`${sceneNames[scene]}的共享道路输入`} />}<span>共享输入 · {sceneNames[scene]}</span></div>
        <div className="s8-controls"><div className="tab-row chip-row" role="group" aria-label="切换共享输入">
          {sceneNames.map((name, i) => <button key={name} className={scene === i ? "chip selected" : "chip"} aria-pressed={scene === i} onClick={() => { setPlaying(false); setBeat(i * 5 + (reduced ? 3 : 0)); }}>{name}</button>)}
        </div><button className="tiny ghost" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "暂停同步动画" : "播放同步动画"}>{playing ? <Pause size={14} /> : <Play size={14} />}{playing ? "暂停" : "播放"}</button></div>
      </div>
      <div className="s8-progress" aria-label={`同步动画：${sceneNames[scene]}，执行 ${stage} 步`}>{Array.from({ length: 10 }, (_, i) => <i key={i} className={i === beat ? "current" : i < beat ? "passed" : ""} />)}</div>
      <div className="s8-head"><span>方法</span><span>模块顺序与参数</span><span>当前图像</span></div>
      {methods.map((method) => <CompareRow key={method.name} method={method} scene={scene} stage={stage} />)}
    </div>
    <p className="s8-caption">同一场景、同一播放阶段；观察切到低光后，A/C 的配置不变，B 只改参数，D 逐步改模块与参数。图像与数值均为机制教学示意，不代表各 Baseline 的真实配置或检测效果。</p>
  </Panel>;
}

function CapabilityMatrix() {
  const [selected, setSelected] = useState(4);
  const [scene, setScene] = useState(0);
  const method = matrixMethods[selected];
  const images = useImages(method, scene);
  return <Panel title="AdaptiveISP 新在哪里？">
    <p className="s8-matrix-intro">先看训练／搜索阶段能优化什么，再看推理遇到新图像时能改变什么。点击方法并切换输入，观察右侧配置。</p>
    <div className="s8-matrix-layout">
      <div className="table-scroll s8-table" tabIndex={0} role="region" aria-label="ISP 结构与参数能力矩阵">
        <table><thead><tr><th rowSpan={2}>方法</th><th colSpan={2}>训练／搜索优化</th><th colSpan={2}>推理动态改变</th></tr><tr><th>结构</th><th>参数</th><th>结构</th><th>参数</th></tr></thead>
          <tbody>{matrixMethods.map((row, i) => <tr key={row.name} className={selected === i ? "selected" : ""}><th><button onClick={() => setSelected(i)} aria-pressed={selected === i}>{row.name}</button></th>{[...row.train, ...row.live].map((yes, j) => <td key={j} aria-label={yes ? "可以" : "不可动态改变或不优化"}>{yes ? "✓" : "—"}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <div className="s8-detail" aria-live="polite">
        <div className="s8-detail-top"><strong>{method.name}</strong><div className="tab-row chip-row" role="group" aria-label="能力矩阵输入场景">{sceneNames.map((name, i) => <button key={name} className={scene === i ? "chip selected" : "chip"} aria-pressed={scene === i} onClick={() => setScene(i)}>{name}</button>)}</div></div>
        <div className="s8-detail-image">{images[3] && <img src={images[3]} alt={`${method.name} 对${sceneNames[scene]}图像的教学处理预览`} />}</div>
        <Route method={method} scene={scene} stage={3} />
        <p>{method.note}</p>
        <small className="s8-delta">换成{sceneNames[1 - scene]}：{method.live[0] ? "模块顺序可变" : "模块顺序不变"} · {method.live[1] ? "参数可变" : "参数不变"}</small>
      </div>
    </div>
    <p className="s8-caption">矩阵依据论文对这些方法的比较设置；示意路径与图像并非原论文的 Baseline 输出。ReconfigISP 与 Refactoring ISP 的结构搜索能力不能写成“无”。</p>
  </Panel>;
}

export function ChapterEight({ onDone }: Done) {
  return <div className="s8-chapter"><SynchronizedComparison onDone={onDone} /><CapabilityMatrix /></div>;
}
