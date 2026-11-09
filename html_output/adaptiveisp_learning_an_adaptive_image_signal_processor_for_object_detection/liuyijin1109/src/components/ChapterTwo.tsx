import { useEffect, useId, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Panel, type Done } from "./Shared";
import "./ChapterTwo.css";

const stages = ["真实场景", "Bayer 采样", "去马赛克", "Linear RGB"] as const;
const explanations = [
  "镜头把道路场景投到传感器上；传感器还没有直接得到完整的彩色像素。",
  "彩色滤光片让每个位置只测一个通道。图中局部的 RGGB 是两个绿色、一个红色、一个蓝色位置；数值随所拍场景变化。",
  "以车身上的绿色采样位置为例：绿色是实测值，缺失的红、蓝通道需参考邻近采样来估计。",
  "每个像素已有完整 RGB 通道，但图像后续仍需要亮度、颜色等处理。",
];
const moduleInfo = [
  { name: "Exposure", effect: "brightness(1.42)", desc: "提高整体亮度；这里是可见效果示意。" },
  { name: "Gamma", effect: "brightness(1.1) contrast(.78)", desc: "改变明暗分布，让中间亮度更显眼。" },
  { name: "CCM", effect: "hue-rotate(-20deg) saturate(1.35)", desc: "调整颜色通道间的关系，画面色彩随之变化。" },
  { name: "Desaturation", effect: "saturate(.16)", desc: "降低色彩饱和度，形状与明暗仍保留。" },
] as const;

function useInViewOnce() {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
      if (entry.isIntersecting) setSeen(true);
    }, { threshold: .25 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return { ref, seen, visible };
}

/** A single SVG road scene shared by both subsection demonstrations. */
function RoadImage({ filter = "" }: { filter?: string }) {
  const id = useId().replaceAll(":", "");
  return <svg className="c2-road" viewBox="0 0 560 300" role="img" aria-label="教学示意：天空、远山、道路和一辆橙色汽车">
    <defs>
      <linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor="#96c8d5" /><stop offset="1" stopColor="#e1e5d2" /></linearGradient>
      <linearGradient id={`${id}-road`} x2="0" y2="1"><stop stopColor="#788996" /><stop offset="1" stopColor="#485b6d" /></linearGradient>
    </defs>
    <g style={{ filter }}>
      <rect width="560" height="300" fill={`url(#${id}-sky)`} />
      <circle cx="447" cy="55" r="26" fill="#fff0bf" />
      <path d="M0 153 63 90l56 48 64-67 85 79 82-64 78 61 55-48 77 54v75H0Z" fill="#7eaa9b" />
      <path d="M0 178 55 142l77 36 84-44 72 44 84-40 81 40 62-31 45 31v45H0Z" fill="#598d7e" />
      <path d="M0 205 560 177v123H0Z" fill={`url(#${id}-road)`} />
      <path d="M0 223 560 195" stroke="#b7bcb1" strokeWidth="4" />
      <path d="M54 279h96m81-13h83m91-15h75" stroke="#ece5c8" strokeWidth="5" strokeLinecap="round" />
      <g transform="translate(166 158)">
        <path d="M0 61 21 29 61 7h111l42 25 18 29Z" fill="#cd7357" />
        <path d="M45 31 68 11h95l31 20Z" fill="#accbd1" />
        <path d="M117 12v19" stroke="#e2ecdf" strokeWidth="3" />
        <rect x="0" y="55" width="234" height="37" rx="9" fill="#e08c62" />
        <path d="M8 65h31m157 0h28" stroke="#ffdda0" strokeWidth="8" strokeLinecap="round" />
        <rect x="93" y="71" width="48" height="12" rx="3" fill="#d7d9cb" />
        <circle cx="47" cy="91" r="17" fill="#304252" /><circle cx="186" cy="91" r="17" fill="#304252" />
        <circle cx="47" cy="91" r="7" fill="#b8c3c6" /><circle cx="186" cy="91" r="7" fill="#b8c3c6" />
      </g>
    </g>
  </svg>;
}

const samples = [
  { c: "R", v: 221 }, { c: "G", v: 135 }, { c: "R", v: 219 }, { c: "G", v: 151 },
  { c: "G", v: 143 }, { c: "B", v: 119 }, { c: "G", v: 154 }, { c: "B", v: 123 },
  { c: "R", v: 224 }, { c: "G", v: 148 }, { c: "R", v: 214 }, { c: "G", v: 137 },
  { c: "G", v: 155 }, { c: "B", v: 126 }, { c: "G", v: 145 }, { c: "B", v: 116 },
] as const;

function RawToRgb() {
  const { ref, seen, visible } = useInViewOnce();
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!seen || !visible || !playing || reduced || stage === 3) return;
    const timer = window.setTimeout(() => setStage((n) => n + 1), [2100, 2700, 3000][stage]);
    return () => clearTimeout(timer);
  }, [seen, visible, playing, reduced, stage]);
  function jump(index: number) { setStage(index); setPlaying(false); }
  return <Panel title="从 RAW 到 RGB">
    <div className="c2-lesson" ref={ref}>
      <div className={`c2-camera c2-stage-${stage} ${playing && seen && visible && !reduced ? "is-running" : ""}`}>
        <div className="c2-image"><RoadImage /><span className="c2-scan" aria-hidden="true" /><span className="c2-target" aria-hidden="true" /><span className="c2-image-tag">同一幅道路场景</span></div>
        <div className="c2-lens" aria-label={stage === 1 ? "车身局部 Bayer RGGB 采样" : stage === 2 ? "绿色采样点补全为 RGB" : undefined}>
          <div className="c2-lens-head"><span>车身局部 · 采样示意</span><b>{stage === 2 ? "估计缺失通道" : "RGGB"}</b></div>
          <div className="c2-mosaic">
            {samples.map((sample, i) => <div key={i} className={`c2-cell c2-${sample.c.toLowerCase()} ${i === 4 ? "is-focus" : ""}`} style={{ animationDelay: `${i * 55}ms` }}><b>{sample.c}</b><small>{sample.v}</small></div>)}
          </div>
          <div className="c2-rebuild"><span>选中 G 像素</span><div className="c2-channels"><span className="c2-red">R <b>≈ 220</b><small>邻近估计</small></span><span className="c2-green">G <b>143</b><small>当前位置实测</small></span><span className="c2-blue">B <b>≈ 121</b><small>邻近估计</small></span></div></div>
        </div>
      </div>
      <div className="c2-controls"><div className="c2-stages" role="group" aria-label="从场景到 Linear RGB 的阶段">{stages.map((name, i) => <button key={name} type="button" className={stage === i ? "active" : ""} aria-current={stage === i ? "step" : undefined} onClick={() => jump(i)}><span>{i + 1}</span>{name}</button>)}</div><div className="c2-play-controls"><button type="button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "暂停动画" : "继续动画"} disabled={stage === 3 && playing}>{playing ? <Pause size={16} /> : <Play size={16} />}</button><button type="button" onClick={() => { setStage(0); setPlaying(true); }} aria-label="重新播放"><RotateCcw size={16} /></button></div></div>
      <p className="c2-caption" aria-live="polite"><strong>{stages[stage]}：</strong>{explanations[stage]}</p>
      <p className="c2-note">局部数值是随车身颜色绘制的教学采样示意，并非真实传感器读数或论文实验结果。Linear RGB 的“线性”指像素值仍随入射光量近似成比例。</p>
    </div>
  </Panel>;
}

function IspTask({ onDone }: Done) {
  const { ref, seen, visible } = useInViewOnce();
  const [step, setStep] = useState(0);
  const [chosen, setChosen] = useState(0);
  const [manual, setManual] = useState(false);
  const [reduced, setReduced] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!seen || !visible || reduced || step === 5) return;
    const timer = window.setTimeout(() => setStep((n) => n + 1), [700, 700, 700, 2800, 900][step]);
    return () => clearTimeout(timer);
  }, [seen, visible, reduced, step]);
  useEffect(() => {
    if (!seen || !visible || reduced || manual || step !== 3) return;
    const timer = window.setInterval(() => setChosen((n) => Math.min(n + 1, moduleInfo.length - 1)), 650);
    return () => clearInterval(timer);
  }, [seen, visible, reduced, manual, step]);
  const nodes = ["RAW", "固定 RAW 预处理", "Linear RGB", "AdaptiveISP", "处理后图像", "Detector"];
  return <Panel title="ISP 的任务">
    <div className="c2-isp" ref={ref}>
      <div className="c2-pipeline" role="img" aria-label="RAW 经固定 RAW 域预处理成为 Linear RGB，再由 AdaptiveISP 选择 RGB 域模块，处理后图像进入检测器">
        {nodes.map((node, i) => <div key={node} className={`c2-pipe-node ${i <= step ? "reached" : ""} ${i === step ? "current" : ""} ${i === 3 ? "adaptive" : ""}`}><span className="c2-pipe-dot" /><b>{node}</b>{i === 1 && <small>DPC · BLC · LSC · 去马赛克</small>}{i === 3 && <small>RGB 域 · 选择模块与参数</small>}</div>)}
      </div>
      <div className="c2-domain-labels"><span>固定基础处理 · RAW 域</span><span>随输入调整 · RGB 域</span></div>
      <div className="c2-isp-workbench"><div className="c2-preview"><RoadImage filter={step >= 3 ? moduleInfo[chosen].effect : ""} /><span>{step >= 3 ? "处理效果示意" : "Linear RGB 输入"}</span></div><div className="c2-module-side"><p>在 AdaptiveISP 区域试选一种 RGB 操作：</p><div className="c2-module-buttons" role="group" aria-label="选择 RGB 域处理模块">{moduleInfo.map((item, i) => <button key={item.name} type="button" className={step >= 3 && chosen === i ? "active" : ""} aria-pressed={step >= 3 && chosen === i} onClick={() => { setManual(true); setChosen(i); setStep(4); onDone(); }}>{item.name}</button>)}</div><p className="c2-module-feedback" aria-live="polite"><b>{moduleInfo[chosen].name}</b> · {moduleInfo[chosen].desc}</p></div></div>
      <p className="c2-isp-explain">RAW 域先校正传感器信号并去马赛克，构建 Linear RGB。RGB 域继续调整亮度、颜色、对比度和细节；AdaptiveISP 让这部分的模块选择和参数随当前输入改变。最终图像送入检测器，图中不展示虚构的检测结果。</p>
    </div>
  </Panel>;
}

export function ChapterTwo({ onDone }: Done) {
  return <><RawToRgb /><IspTask onDone={onDone} /></>;
}
