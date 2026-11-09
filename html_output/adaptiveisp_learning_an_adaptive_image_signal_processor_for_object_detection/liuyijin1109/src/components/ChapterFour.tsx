import { useEffect, useRef, useState } from "react";
import { modules } from "../content";
import { Panel, type Done } from "./Shared";
import { Scene } from "./Labs";
import { processImage } from "./moduleProcessing";
import "./ChapterFour.css";
import { Formula } from "./Formula";
import { imageTransitionFormula, policyFormula } from "./formulaDefinitions";

type Frame = { module: number; parameter: number; label: string; detail: string; probabilities: number[] };
const examples: { name: string; scene: number; frames: [Frame, Frame] }[] = [
  {
    name: "低光街景", scene: 0,
    frames: [
      { module: 1, parameter: .55, label: "γ = 0.55", detail: "伽马曲线非线性提亮暗部", probabilities: [8, 34, 10, 7, 5, 6, 5, 4, 16, 5] },
      { module: 8, parameter: .8, label: "p = 0.80", detail: "去饱和向亮度灰度图混合", probabilities: [5, 9, 12, 7, 6, 7, 4, 6, 39, 5] },
    ],
  },
  {
    name: "正常光照 · 色偏", scene: 2,
    frames: [
      { module: 2, parameter: 1, label: "矩阵混合 · 强度 1.00", detail: "CCM 混合 RGB 通道，改变颜色响应", probabilities: [6, 13, 37, 5, 4, 6, 5, 7, 8, 9] },
      { module: 1, parameter: .78, label: "γ = 0.78", detail: "伽马曲线重新映射亮度", probabilities: [6, 32, 10, 8, 4, 8, 5, 9, 10, 8] },
    ],
  },
];

const inputNotes = [
  "当前图像是上一步处理后的结果；策略用缩小到 64 × 64 的 RGB 表示观察它。",
  "十个单通道记录分别对应十种模块。0 表示未用，1 表示已用；使用记录与惩罚帮助减少重复选择。",
  "一个单通道写入当前阶段索引。执行一步后，阶段信息随新图像一起更新。",
];

function StateBuilder() {
  const [beat, setBeat] = useState(0);
  const [focus, setFocus] = useState<number | null>(null);
  const reduced = useRef(false);
  useEffect(() => {
    reduced.current = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) { setBeat(5); return; }
    const timer = window.setInterval(() => setBeat((n) => Math.min(5, n + 1)), 1350);
    return () => clearInterval(timer);
  }, []);
  const select = (n: number) => { setFocus(n); setBeat(5); };
  return <Panel title="当前状态是什么？">
    <div className={`policy-builder beat-${beat}`}>
      <button type="button" className={`builder-image ${focus === 0 ? "active" : ""}`} onClick={() => select(0)} aria-label="查看当前图像">
        <Scene scene={2} label="当前 RGB 街景图像" />
        <span className="builder-rgb" aria-label="三个 RGB 颜色通道"><i>R</i><i>G</i><i>B</i></span>
        <span>当前 RGB 图像 <b>↓ 缩至 64 × 64</b></span>
      </button>
      <div className="builder-plus" aria-hidden="true">+</div>
      <button type="button" className={`builder-use ${focus === 1 ? "active" : ""}`} onClick={() => select(1)} aria-label="查看十个模块使用记录">
        <span className="builder-title">模块使用记录 <b>10 通道</b></span>
        <span className="builder-bits">{modules.map((m, i) => { const isUsed = (i === 1 && beat >= 2) || (i === 2 && beat >= 3); return <span key={m.name} className={isUsed ? "used" : ""} title={m.cn}>{isUsed ? 1 : 0}<small>{m.cn}</small></span>; })}</span>
      </button>
      <div className="builder-plus" aria-hidden="true">+</div>
      <button type="button" className={`builder-stage ${focus === 2 ? "active" : ""}`} onClick={() => select(2)} aria-label="查看阶段信息">
        <span className="builder-title">阶段信息 <b>1 通道</b></span><strong>阶段 3</strong><small>已执行两步的示例状态</small>
      </button>
      <div className="builder-flow" aria-hidden="true">→</div>
      <div className="builder-network"><span>64 × 64 × <b>14</b></span><strong>Policy Network</strong><small>CNN 提取当前状态特征</small></div>
    </div>
    <p className="builder-caption" aria-live="polite">{focus === null ? "3 个 RGB 通道 + 10 个使用记录通道 + 1 个阶段通道 = 14 个通道；后 11 个通道是状态信息，不是彩色照片。" : inputNotes[focus]}</p>
  </Panel>;
}

function useProcessedScene(scene: number, first: Frame, second: Frame) {
  const sourceRef = useRef<HTMLDivElement>(null);
  const [images, setImages] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    const svg = sourceRef.current?.querySelector("svg");
    if (!svg) return;
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml;charset=utf-8" }));
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas"); canvas.width = 560; canvas.height = 300;
        const ctx = canvas.getContext("2d"); if (!ctx) return;
        ctx.drawImage(image, 0, 0, 560, 300);
        const urls = [canvas.toDataURL()];
        let pixels = ctx.getImageData(0, 0, 560, 300);
        for (const frame of [first, second]) {
          pixels = processImage(pixels, frame.module, frame.parameter);
          ctx.putImageData(pixels, 0, 0);
          urls.push(canvas.toDataURL());
        }
        if (!cancelled) setImages(urls);
      } finally { URL.revokeObjectURL(url); }
    };
    image.onerror = () => URL.revokeObjectURL(url);
    image.src = url;
    return () => { cancelled = true; URL.revokeObjectURL(url); };
  }, [scene, first, second]);
  return { sourceRef, images };
}

const phases = ["读取初始状态", "Softmax 选择模块", "预测连续参数", "执行 ISP，生成新图像", "新状态重新进入 Policy", "再次选择模块", "再次预测参数", "再次执行，生成下一状态"];

function DecisionBench({ onDone }: Done) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(true);
  const example = examples[sceneIndex];
  const { sourceRef, images } = useProcessedScene(example.scene, ...example.frames);
  const decision = phase >= 4 ? 1 : 0;
  const frame = example.frames[decision];
  const imageIndex = phase >= 4 ? 1 : 0;
  const resultIndex = phase >= 7 ? 2 : phase >= 3 ? 1 : 0;
  const used = phase >= 4 ? [example.frames[0].module] : [];
  const showProbabilities = phase === 1 || phase === 2 || phase === 5 || phase === 6 || phase === 7;
  const showParameter = phase === 2 || phase === 3 || phase === 6 || phase === 7;
  useEffect(() => {
    if (!playing || phase === 7) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setPhase((n) => Math.min(7, n + 1)), reduced ? 2500 : phase === 0 ? 850 : 1550);
    return () => clearTimeout(timer);
  }, [phase, playing]);
  useEffect(() => { if (phase === 7) { setPlaying(false); onDone(); } }, [phase, onDone]);
  const jump = (next: number) => { setPlaying(false); setPhase(Math.max(0, Math.min(7, next))); };
  return <Panel title="如何选择下一步？">
    <div className="policy-bench">
      <div className="policy-toolbar">
        <label>输入场景 <select value={sceneIndex} onChange={(event) => { setSceneIndex(Number(event.target.value)); setPhase(0); setPlaying(true); }}>{examples.map((x, i) => <option value={i} key={x.name}>{x.name}</option>)}</select></label>
        <span className="policy-example">教学示例决策 · 概率与参数非模型实测</span>
      </div>
      <div className="policy-timeline" aria-label={`演示进度：${phases[phase]}`}>
        {phases.map((name, i) => <span key={name} className={i === phase ? "current" : i < phase ? "passed" : ""} title={name} />)}
      </div>
      <p className="policy-phase" aria-live="polite"><b>{phase < 4 ? "第 1 次决策" : "第 2 次决策"}</b> · {phases[phase]}</p>
      <div className="policy-flow">
        <div className={`policy-state ${phase === 0 || phase === 4 ? "pulse" : ""}`}>
          <span className="policy-kicker">当前状态 · s{imageIndex}</span>
          <div className="policy-image">{images[imageIndex] ? <img src={images[imageIndex]} alt={`${example.name}，执行 ${imageIndex} 次 ISP 后的图像`} /> : <Scene scene={example.scene} />}</div>
          <div className="policy-state-bottom"><span>使用记录 <b>{used.length}/10</b></span><span>阶段 <b>{imageIndex + 1}</b></span></div>
          <div className="policy-use-dots" aria-label={`已使用：${used.length ? used.map((i) => modules[i].cn).join("、") : "无"}`}>{modules.map((m, i) => <i key={m.name} className={used.includes(i) ? "used" : ""} title={`${m.cn}：${used.includes(i) ? 1 : 0}`} />)}</div>
        </div>
        <div className="policy-arrow" aria-hidden="true">→</div>
        <div className={`policy-core ${showProbabilities ? "active" : ""}`}>
          <span className="policy-kicker">Policy Network · CNN 特征</span>
          <Formula formula={policyFormula} inline label="策略的模块与参数分支" />
          <div className="policy-outputs"><span className={showProbabilities ? "lit" : ""}>① 离散模块 · Softmax</span><span className={showParameter ? "lit" : ""}>② 连续参数 · 专属分支</span></div>
          <div className="policy-probs" aria-label="十种 ISP 模块的教学示例概率">{modules.map((m, i) => <div className={showProbabilities && i === frame.module ? "chosen" : ""} key={m.name}><span>{m.cn}</span><span className="policy-track"><i style={{ width: `${showProbabilities ? frame.probabilities[i] * 2.2 : 0}%` }} /></span><b>{showProbabilities ? `${frame.probabilities[i]}%` : "—"}</b></div>)}</div>
          <p className="policy-param">{showParameter ? <><b>{modules[frame.module].cn}</b> 参数分支 → <strong>{frame.label}</strong><small>{frame.detail}</small></> : "选定模块后，才读取它适用的参数分支。"}</p>
        </div>
        <div className="policy-arrow" aria-hidden="true">→</div>
        <div className={`policy-result ${phase === 3 || phase === 7 ? "pulse" : ""}`}>
          <span className="policy-kicker">ISP 执行 → 新状态</span>
          <div className="policy-image">{images[resultIndex] ? <img src={images[resultIndex]} alt={`ISP 执行 ${resultIndex} 次后的图像`} /> : <Scene scene={example.scene} />}</div>
          <p>{phase >= 3 ? `已执行 ${modules[example.frames[0].module].cn}${phase >= 7 ? ` → ${modules[example.frames[1].module].cn}` : ""} · 使用记录 ${resultIndex}/10 · 阶段 ${resultIndex + 1}` : "等待模块与参数"}</p>
          <Formula formula={imageTransitionFormula} inline label="ISP 图像状态转移" />
        </div>
      </div>
      <div className="policy-return"><span className={phase >= 4 ? "active" : ""}>↶ 新图像 + 更新后的使用记录 + 下一阶段，再送入 Policy</span></div>
      <div className="policy-controls" role="group" aria-label="决策演示控制">
        <button type="button" onClick={() => jump(phase - 1)} disabled={phase === 0}>上一步</button>
        <button type="button" onClick={() => { if (phase === 7) { setPhase(0); setPlaying(true); } else setPlaying((value) => !value); }}>{playing ? "暂停" : phase === 7 ? "自动播放" : "继续"}</button>
        <button type="button" onClick={() => jump(phase + 1)} disabled={phase === 7}>下一步</button>
        <button type="button" onClick={() => { setPhase(0); setPlaying(true); }}>重新播放</button>
      </div>
      <p className="policy-footnote">第二次读取的是处理后的图像与更新后的记录。示例只走两步；Policy 为下游视觉任务改善输入，检测器不参与每一步推理决策。</p>
      <div className="policy-source" ref={sourceRef} aria-hidden="true"><Scene scene={example.scene} /></div>
    </div>
  </Panel>;
}

export function ChapterFour({ onDone }: Done) {
  return <><StateBuilder /><DecisionBench onDone={onDone} /><p className="policy-next-question">Policy 已经能够选择操作，但它最初是怎样学会正确选择的？</p></>;
}
