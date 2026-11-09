import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw } from "lucide-react";
import { modules } from "../content";
import { Panel, Tabs, type Done } from "./Shared";
import { drawModuleRoad } from "./moduleRoad";
import { processImage } from "./moduleProcessing";
import "./PipelineLab.css";

type Action = { module: number; value: number; parameter: string; reason: string };
type Snapshot = { url: string; action?: Action };
const examples: { name: string; actions: Action[] }[] = [
  {
    name: "正常光照 · 色偏",
    actions: [
      { module: 2, value: 1, parameter: "矩阵混合强度 1.00", reason: "先混合颜色通道，观察色偏如何改变。" },
      { module: 3, value: 1.4, parameter: "p = 1.40", reason: "保留车轮与自行车的细边缘。" },
      { module: 1, value: .86, parameter: "γ = 0.86", reason: "非线性调整中间调，而非统一放大亮度。" },
      { module: 5, value: .55, parameter: "8 段曲线示意强度 0.55", reason: "重新分配道路与天空的亮度层次。" },
      { module: 8, value: .18, parameter: "p = 0.18", reason: "轻度收敛颜色，观察是否保留足够的色彩线索。" },
    ],
  },
  {
    name: "弱光 · 高噪声",
    actions: [
      { module: 8, value: .7, parameter: "p = 0.70", reason: "先减弱彩色噪声的颜色扰动。" },
      { module: 0, value: .9, parameter: "p = +0.90 EV", reason: "整体提高曝光，让暗处目标可见。" },
      { module: 4, value: .75, parameter: "p = 0.75", reason: "在提亮后抑制已显露的噪声。" },
      { module: 1, value: .78, parameter: "γ = 0.78", reason: "非线性提亮中间调，保留高亮端点。" },
      { module: 3, value: 1.32, parameter: "p = 1.32", reason: "最后观察细轮廓是否需要增强。" },
    ],
  },
];
const cache = new Map<number, Snapshot[]>();

function makeSnapshots(scene: number): Snapshot[] {
  const existing = cache.get(scene);
  if (existing) return existing;
  const canvas = document.createElement("canvas");
  canvas.width = 560;
  canvas.height = 300;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  drawModuleRoad(ctx);
  let pixels = ctx.getImageData(0, 0, 560, 300);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const x = (i / 4) % 560, y = Math.floor(i / 4 / 560);
    if (scene === 0) {
      // A controlled cast makes channel mixing visible in the normal-light example.
      pixels.data[i] = Math.min(255, pixels.data[i] * 1.12);
      pixels.data[i + 2] = pixels.data[i + 2] * .82;
    } else {
      const noise = ((x * 37 + y * 73 + x * y * 11) % 61) - 30;
      pixels.data[i] = Math.max(0, pixels.data[i] * .41 + noise);
      pixels.data[i + 1] = Math.max(0, pixels.data[i + 1] * .43 - noise * .35);
      pixels.data[i + 2] = Math.max(0, pixels.data[i + 2] * .49 - noise);
    }
  }
  ctx.putImageData(pixels, 0, 0);
  const snapshots: Snapshot[] = [{ url: canvas.toDataURL("image/png") }];
  for (const action of examples[scene].actions) {
    // The output ImageData is the input to the next operation; no stage reads the original.
    pixels = processImage(pixels, action.module, action.value);
    ctx.putImageData(pixels, 0, 0);
    snapshots.push({ url: canvas.toDataURL("image/png"), action });
  }
  cache.set(scene, snapshots);
  return snapshots;
}

function DetectorImage({ url, detected }: { url: string; detected: boolean }) {
  return <div className={`s6-detection-image ${detected ? "is-detected" : ""}`}>
    <img src={url} alt="与逐步 ISP 最终快照相同的图像，进入示例检测区域" />
    <span className="s6-box s6-box-car"><b>汽车 · 示例检测</b></span>
    <span className="s6-box s6-box-bike"><b>自行车 · 示例检测</b></span>
  </div>;
}

export function PipelineLab({ onDone }: Done) {
  const [scene, setScene] = useState(0);
  const [budget, setBudget] = useState(5);
  const [completed, setCompleted] = useState(0);
  const [view, setView] = useState(0);
  const [playing, setPlaying] = useState(() => !matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [phase, setPhase] = useState<"observing" | "deciding" | "processing" | "detecting" | "detected">("observing");
  const [compare, setCompare] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const snapshots = useMemo(() => makeSnapshots(scene), [scene]);
  const route = examples[scene].actions;
  const shown = snapshots[view];
  const final = snapshots[budget];

  useEffect(() => {
    if (!playing || completed >= budget || !snapshots.length) return;
    setPhase("deciding");
    const timer = window.setTimeout(() => {
      const next = completed + 1;
      setCompleted(next);
      setView(next);
      setPhase(next === budget ? "detecting" : "processing");
      if (next === budget) onDoneRef.current();
    }, completed === 0 ? 700 : 2300);
    return () => clearTimeout(timer);
  }, [playing, completed, budget, snapshots]);

  useEffect(() => {
    if (completed !== budget || phase !== "detecting") return;
    const timer = window.setTimeout(() => {
      setPhase("detected");
      setPlaying(false);
    }, 1100);
    return () => clearTimeout(timer);
  }, [completed, budget, phase]);

  function restart(autoplay: boolean) {
    setPlaying(autoplay && !matchMedia("(prefers-reduced-motion: reduce)").matches);
    setCompleted(0);
    setView(0);
    setPhase("observing");
  }
  function switchScene(next: number) {
    setScene(next);
    restart(false);
  }
  function advance() {
    setPlaying(false);
    if (view < completed) { setView(view + 1); return; }
    if (completed >= budget) return;
    const next = completed + 1;
    setCompleted(next);
    setView(next);
    setPhase(next === budget ? "detecting" : "processing");
    if (next === budget) onDoneRef.current();
  }
  if (!shown || !final) return <Panel title="逐步决策"><p>图像初始化中…</p></Panel>;
  const action = shown.action;
  const used = route.slice(0, view).map(x => x.module);

  return <>
    <Panel title="逐步决策">
      <div className="s6-lab">
        <div className="s6-topline">
          <Tabs items={examples.map(x => x.name)} active={scene} set={switchScene} label="选择输入场景" />
          <label>阶段预算
            <select value={budget} onChange={event => { setBudget(Number(event.target.value)); restart(false); }}>
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} 个阶段</option>)}
            </select>
          </label>
        </div>
        <div className="s6-image-pair">
          <figure><figcaption>输入 · Linear RGB 教学示意</figcaption><img src={snapshots[0].url} alt={`${examples[scene].name}的输入道路图像`} /></figure>
          <figure className="s6-current"><figcaption>当前图像 · s{view}{view === budget ? " · 检测器输入" : ""}</figcaption><img src={shown.url} alt={`经过 ${view} 阶段连续处理后的图像`} /></figure>
        </div>
        <div className="s6-decision" aria-live="polite">
          <div className="s6-decision-title"><span>STAGE {view} / {budget}</span><strong>{action ? modules[action.module].cn : "Linear RGB 输入"}</strong><small>{action?.parameter ?? "等待第一步决策"}</small></div>
          <p>{action?.reason ?? "Policy 从当前图像、模块使用记录和阶段信息开始决策。"}{phase === "deciding" && view === completed ? " 正在读取更新后的状态…" : ""}</p>
          <span className="s6-sequence-note">每一步重新观察当前图像；下一个模块处理的是这一步的输出。</span>
        </div>
        <div className="s6-history" aria-label="处理历史">
          {Array.from({ length: budget + 1 }, (_, n) => <button key={n} type="button" disabled={n > completed} className={n === view ? "active" : ""} aria-current={n === view ? "step" : undefined} onClick={() => { setPlaying(false); setView(n); }}>
            <span>{n === 0 ? "输入" : String(n).padStart(2, "0")}</span><b>{n === 0 ? "Linear RGB" : modules[route[n - 1].module].cn}</b>
          </button>)}
          <span className="s6-history-end">→ Detector</span>
        </div>
        <div className="s6-used"><b>已使用模块 · {view} / {budget}</b><div>{modules.map((module, i) => <span key={module.name} className={used.includes(i) ? "used" : ""} title={module.name}>{module.cn}</span>)}</div></div>
        <div className="s6-controls">
          <span role="status">{view < completed ? "正在回看已缓存的阶段图像。" : completed === budget ? "最终图像已送入下方检测器。" : playing ? "自动演示中 · 可随时暂停或回看" : "手动逐步查看处理链。"}</span>
          <div>
            <button className="button-outline" onClick={() => restart(false)}><RotateCcw size={15} />重置</button>
            <button className="button-outline" disabled={view === 0} onClick={() => { setPlaying(false); setView(view - 1); }}><ArrowLeft size={15} />上一步</button>
            <button className="button-outline" onClick={() => {
              if (playing) setPlaying(false);
              else if (completed === budget) restart(true);
              else { setView(completed); setPlaying(true); }
            }}><span>{playing ? <Pause size={15} /> : <Play size={15} />}</span>{playing ? "暂停" : completed === budget ? "重播" : "自动播放"}</button>
            <button className="button-primary" disabled={view === budget} onClick={advance}>下一步<ArrowRight size={15} /></button>
          </div>
        </div>
      </div>
    </Panel>
    <Panel title="完整推理">
      <div className="s6-inference">
        <div className="s6-inference-heading"><span>最终 ISP 图像</span><b>→</b><span>Detector</span><b>→</b><span>目标检测结果</span></div>
        {completed === budget ? <>
          <DetectorImage url={compare ? snapshots[0].url : final.url} detected={phase === "detected"} />
          <button className="s6-compare" type="button" aria-pressed={compare} onClick={() => setCompare(!compare)}>{compare ? "显示最终 ISP 图像" : "对照原始输入图像"}</button>
        </> : <div className="s6-await"><img src={shown.url} alt="当前阶段的图像" /><span>完成 {budget} 个处理阶段后，这张图像将进入检测器。当前 {completed} / {budget}。</span></div>}
        <div className="s6-train-infer"><p><b>训练</b>Policy / Value 学习，Detector 提供任务反馈；奖励和梯度更新可训练参数。</p><p><b>推理</b>已训练 Policy 逐步选择 ISP，最终图像进入 Detector。无需真实标签计算奖励，也不进行 Actor–Critic 更新。</p></div>
      </div>
    </Panel>
  </>;
}
