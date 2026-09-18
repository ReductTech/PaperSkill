"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Pause,
  Play,
  Rotate3D,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { LearningModule } from "@/src/modules/LearningModule";

const pixelSteps = [
  {
    id: "rgb",
    label: "查看源 RGB",
    input: "源视频的当前帧",
    operation: "读取颜色与二维图像位置",
    output: "带有颜色的二维像素",
    explanation: "此时每个像素只有颜色和二维图像位置，还不知道它在真实空间的前后距离。",
  },
  {
    id: "reconstruction",
    label: "加入深度与摄影机参数",
    input: "RGB 像素 + Dsrc、Ksrc、Tsrc",
    operation: "补充距离、成像方式与摄影机位姿",
    output: "具备进入三维空间所需的信息",
    explanation: "深度告诉系统像素离摄影机多远；内参与外参说明射线方向以及摄影机在世界中的位置。",
  },
  {
    id: "backproject",
    label: "像素逆投影",
    input: "二维位置 + 深度 + 内参",
    operation: "让像素沿摄影机射线落入空间",
    output: "摄影机坐标中的一个 3D 点",
    explanation: "根据图像位置和深度，把像素沿摄影机射线放回三维空间。这就是逆投影。",
  },
  {
    id: "world",
    label: "变换到世界坐标",
    input: "摄影机坐标中的 3D 点 + 外参",
    operation: "把点变换到统一世界坐标",
    output: "能与其他帧对齐的世界点",
    explanation: "不同帧的摄影机位置可能不同；外参把各自坐标下的点搬到同一个世界坐标系。",
  },
  {
    id: "pointcloud",
    label: "形成当前帧 3D 点云",
    input: "这一帧所有已变换的像素点",
    operation: "汇集带有空间位置和颜色的点",
    output: "世界坐标中的逐帧点云 P",
    explanation: "这一帧图像现在变成了带有空间位置和颜色的三维点集合，但还没有完成跨时间整合。",
  },
] as const;

const selectablePixels = [
  { id: "chair", label: "椅子上的蓝色像素", short: "椅子", color: "#62b3ff", x: 29, y: 67, depth: "中等距离" },
  { id: "person", label: "人物衣服上的橙色像素", short: "人物", color: "#f39a43", x: 59, y: 52, depth: "较近距离" },
  { id: "wall", label: "背景墙上的浅蓝色像素", short: "墙面", color: "#a8d7ff", x: 82, y: 28, depth: "较远距离" },
] as const;

const frameLabels = ["第1帧", "第2帧", "第3帧", "第4帧"];

const staticDots = Array.from({ length: 42 }, (_, index) => ({
  x: 18 + (index % 7) * 10.2,
  y: 18 + Math.floor(index / 7) * 9.8,
}));

const floorDots = Array.from({ length: 24 }, (_, index) => ({
  x: 12 + (index % 8) * 10.8,
  y: 75 + Math.floor(index / 8) * 6.8,
}));

const personDots = [
  [0, -20], [-5, -16], [5, -16], [-7, -7], [0, -8], [7, -7], [-8, 2], [0, 1], [8, 2],
  [-6, 11], [0, 10], [6, 11], [-5, 20], [5, 20], [-8, 28], [8, 28],
];

const stageFromFormula: Record<string, number> = {
  rgb: 0,
  depth: 1,
  camera: 1,
  reconstruction: 1,
  backproject: 2,
  world: 3,
  pointcloud: 4,
};

export function PointCloudLab({ highlightedStage, equationOne }: { highlightedStage?: string | null; equationOne?: ReactNode }) {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedPixel, setSelectedPixel] = useState<(typeof selectablePixels)[number]["id"]>("person");
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [view, setView] = useState(8);
  const [reducedMotion, setReducedMotion] = useState(false);

  const pixel = selectablePixels.find((item) => item.id === selectedPixel) ?? selectablePixels[1];
  const formulaStep = highlightedStage ? stageFromFormula[highlightedStage] : undefined;
  const visibleStep = formulaStep ?? activeStep;
  const step = pixelSteps[visibleStep];
  const personX = 39 + frame * 9;
  const sourceCameraX = 12 + frame * 7;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!playing || reducedMotion) return;
    const timer = window.setInterval(() => setFrame((value) => (value + 1) % frameLabels.length), 1200);
    return () => window.clearInterval(timer);
  }, [playing, reducedMotion]);

  const activeColor = pixel.color;
  const cloudState = useMemo(() => ({
    showDepth: visibleStep >= 1,
    showRay: visibleStep >= 2,
    showWorld: visibleStep >= 3,
    showCloud: visibleStep >= 4,
  }), [visibleStep]);

  return (
    <div className="pointcloud-module pc2-lab">
      <LearningModule number="2.1" eyebrow="建立空间直觉" title="一个视频像素如何变成三维点" description="点云中的点，最初来自视频画面中的像素。选择一个像素，再逐步观察它如何获得距离、沿射线进入空间。" className="pc2-subsection pc2-section-21">
        <div className="pc2-step-controller" role="group" aria-label="2.1 五步教学控制">
          {pixelSteps.map((item, index) => (
            <button
              type="button"
              key={item.id}
              className={`pc2-step-button ${index === visibleStep ? "active" : ""} ${index < visibleStep ? "done" : ""}`}
              aria-pressed={index === visibleStep}
              onClick={() => setActiveStep(index)}
            >
              <span>{index < visibleStep ? <Check /> : index + 1}</span>
              <b>{item.label}</b>
            </button>
          ))}
        </div>

        <div className={`pc2-journey step-${visibleStep}`} style={{ "--pixel-color": activeColor } as CSSProperties}>
          <article className="pc2-journey-panel pc2-rgb-panel">
            <header><span>01</span><b>源 RGB 画面</b><small>颜色 + 二维位置</small></header>
            <div className="pc2-source-scene" role="img" aria-label="源视频画面：人物站在椅子和窗户前">
              <svg viewBox="0 0 320 220" aria-hidden="true">
                <rect className="pc2-scene-wall" x="0" y="0" width="320" height="152" />
                <rect className="pc2-scene-window" x="228" y="24" width="66" height="70" rx="4" />
                <path className="pc2-window-line" d="M261 24V94M228 59H294" />
                <path className="pc2-scene-floor" d="M0 152H320V220H0Z" />
                <path className="pc2-floor-grid" d="M0 176H320M0 200H320M40 152L15 220M100 152L88 220M160 152V220M220 152L232 220M280 152L305 220" />
                <g className="pc2-chair-shape"><rect x="65" y="108" width="57" height="12" rx="3" /><path d="M70 120V178M116 120V178M67 105V77H77V105" /></g>
                <g className="pc2-person-shape"><circle cx="185" cy="77" r="18" /><path d="M158 105Q185 90 212 105L205 158H165Z" /><path d="M168 157L160 205M201 157L211 205M161 113L143 153M208 113L226 151" /></g>
              </svg>
              <span className="pc2-object-label chair">椅子 · 静态</span>
              <span className="pc2-object-label person">人物 · 动态</span>
              <span className="pc2-object-label window">窗户／墙面 · 静态</span>
              {visibleStep === 0 ? selectablePixels.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`pc2-pixel-hotspot ${selectedPixel === item.id ? "selected" : ""}`}
                  style={{ left: `${item.x}%`, top: `${item.y}%`, "--hotspot-color": item.color } as CSSProperties}
                  onClick={() => setSelectedPixel(item.id)}
                  aria-label={`选择${item.label}`}
                  aria-pressed={selectedPixel === item.id}
                />
              )) : <span className="pc2-selected-pixel" style={{ left: `${pixel.x}%`, top: `${pixel.y}%` }} aria-label={`正在跟随：${pixel.label}`} />}
            </div>
            <footer><i style={{ background: activeColor }} /><span>正在跟随：<b>{pixel.short}像素</b></span></footer>
          </article>

          <div className={`pc2-transfer-arrow ${visibleStep >= 1 ? "lit" : ""}`} aria-hidden="true"><i /></div>

          <article className="pc2-journey-panel pc2-depth-panel">
            <header><span>02</span><b>{visibleStep < 2 ? "深度与摄影机" : "深度与摄影机射线"}</b><small>Dsrc · Ksrc · Tsrc</small></header>
            <div className={`pc2-depth-visual ${cloudState.showDepth ? "revealed" : ""}`}>
              <svg className="pc2-depth-map" viewBox="0 0 320 220" aria-hidden="true">
                <defs><linearGradient id="pc2-depth" x1="0" x2="1"><stop offset="0" stopColor="#d7e9f7" /><stop offset="1" stopColor="#24445f" /></linearGradient></defs>
                <rect width="320" height="220" fill="url(#pc2-depth)" /><rect x="228" y="24" width="66" height="70" rx="4" /><path d="M0 152H320V220H0Z" />
                <g className="depth-chair"><rect x="65" y="108" width="57" height="12" /><path d="M70 120V178M116 120V178M67 105V77H77V105" /></g>
                <g className="depth-person"><circle cx="185" cy="77" r="18" /><path d="M158 105Q185 90 212 105L205 158H165Z" /></g>
              </svg>
              {!cloudState.showDepth ? <span className="pc2-waiting">先从左侧选择一个像素</span> : null}
              {cloudState.showDepth ? <span className="pc2-depth-badge" style={{ left: `${pixel.x}%`, top: `${pixel.y}%` }}>{pixel.depth}<small>教学概念示意</small></span> : null}
              {cloudState.showRay ? (
                <div className="pc2-ray-stage" aria-label="摄影机射线把像素送入三维空间"><Camera /><span className="pc2-ray-line"><i /></span><b style={{ background: activeColor }} /><small>摄影机射线</small></div>
              ) : null}
              {cloudState.showWorld ? (
                <div className="pc2-coordinate-stage" aria-label="从源摄影机坐标转换到统一世界坐标"><span className="camera-axis">摄影机坐标</span><ArrowRight /><span className="world-axis">统一世界坐标</span></div>
              ) : null}
            </div>
            <footer><i style={{ background: activeColor }} /><span>{visibleStep < 2 ? "为像素补充前后距离" : "像素沿射线落到空间位置"}</span></footer>
          </article>

          <div className={`pc2-transfer-arrow ${visibleStep >= 2 ? "lit" : ""}`} aria-hidden="true"><i /></div>

          <article className="pc2-journey-panel pc2-cloud-panel">
            <header><span>03</span><b>当前帧 3D 点云</b><small>{cloudState.showWorld ? "世界坐标" : "等待逆投影"}</small></header>
            <div className={`pc2-cloud-visual ${cloudState.showCloud ? "complete" : ""}`} style={{ transform: `rotateY(${view}deg) rotateX(4deg)` }}>
              <svg viewBox="0 0 320 220" role="img" aria-label="可辨认的人物、椅子、墙面和地面网格点云">
                <path className="pc2-cloud-outline wall" d="M35 35H290V151H35Z" /><path className="pc2-cloud-outline window" d="M222 50H275V99H222ZM248 50V99M222 74H275" />
                <path className="pc2-cloud-outline chair" d="M69 112H122V125H72V178M116 125V178M70 110V82H80V110" /><path className="pc2-cloud-outline human" d="M186 60A18 18 0 1 1 185.9 60M160 107Q185 91 211 107L204 160H165Z" />
                <g className="pc2-static-cloud">
                  {staticDots.map((dot, index) => <circle key={`wall-${index}`} cx={dot.x * 3.05} cy={dot.y * 1.55} r={index % 3 === 0 ? 2.1 : 1.45} />)}
                  {floorDots.map((dot, index) => <circle key={`floor-${index}`} cx={dot.x * 3.05} cy={dot.y * 2.05} r={index % 4 === 0 ? 2.1 : 1.45} />)}
                  {[70, 82, 94, 106, 118].map((x) => <circle key={`seat-${x}`} cx={x} cy="118" r="2.2" />)}
                  {[84, 101, 118, 135, 152, 169].map((y) => <circle key={`leg-${y}`} cx="75" cy={y} r="2" />)}
                  {[84, 101, 118, 135, 152, 169].map((y) => <circle key={`leg2-${y}`} cx="115" cy={y} r="2" />)}
                </g>
                <g className="pc2-dynamic-cloud" transform="translate(185 120)">{personDots.map(([x, y], index) => <circle key={`person-${index}`} cx={x} cy={y} r={index % 3 === 0 ? 2.8 : 2.1} />)}</g>
                {!cloudState.showCloud ? <g className="pc2-preview-point"><circle cx={selectedPixel === "chair" ? 93 : selectedPixel === "wall" ? 250 : 185} cy={selectedPixel === "chair" ? 118 : selectedPixel === "wall" ? 66 : 120} r="5" fill={activeColor} /></g> : null}
              </svg>
              <span className="pc2-axis x">x</span><span className="pc2-axis y">y</span><span className="pc2-axis z">z</span><span className="pc2-floor-label">地面网格</span>
            </div>
            <footer><i style={{ background: activeColor }} /><span>{cloudState.showCloud ? "像素已成为点云 P 的一部分" : "当前只显示正在跟随的点"}</span></footer>
          </article>
        </div>

        <div className="pc2-step-explanation" aria-live="polite">
          <div><span>当前输入</span><b>{step.input}</b></div><div><span>当前操作</span><b>{step.operation}</b></div><div><span>当前输出</span><b>{step.output}</b></div>
          <p><strong>{visibleStep + 1} / 5</strong>{step.explanation}</p>
        </div>

        <div className="pc2-progressive-controls">
          {visibleStep === 0 ? (
            <fieldset className="pc2-pixel-picker"><legend>选择要跟随的像素</legend>{selectablePixels.map((item) => (
              <button type="button" key={item.id} className={selectedPixel === item.id ? "active" : ""} onClick={() => setSelectedPixel(item.id)} aria-pressed={selectedPixel === item.id}><i style={{ background: item.color }} />{item.label}</button>
            ))}</fieldset>
          ) : null}
          {visibleStep === 4 ? (
            <div className="pc2-view-control"><label htmlFor="pc2-view"><Rotate3D /> 旋转 3D 模型进行观察 <b>{view}°</b></label><Slider id="pc2-view" value={[view]} min={-28} max={28} step={1} onValueChange={(value) => setView(value[0])} aria-label="旋转 3D 模型进行观察" /><p>该控件仅用于从不同角度观察点云，不代表论文中的目标摄影机轨迹。</p></div>
          ) : null}
        </div>

        <div className="pc2-step-actions"><button type="button" onClick={() => setActiveStep((value) => Math.max(0, value - 1))} disabled={activeStep === 0}><ArrowLeft /> 上一步</button><button type="button" onClick={() => setActiveStep((value) => Math.min(pixelSteps.length - 1, value + 1))} disabled={activeStep === pixelSteps.length - 1}>下一步 <ArrowRight /></button></div>
        <p className="pc2-takeaway">公式 1 将同一过程写成数学形式：2D 像素经逆投影与世界坐标变换得到逐帧点云 P。</p>
        {equationOne}
      </LearningModule>

      <LearningModule number="2.2" eyebrow="加入时间维度" title="一帧 3D 点云如何变成随时间变化的 4D 场景" description="一帧点云只有空间坐标 (x, y, z)。加入帧时间 t，并区分静态与动态内容，才能表达同一场景如何随时间变化。" className="pc2-subsection pc2-section-22">
        <div className="pc2-time-toolbar">
          <div className="pc2-frame-status"><span>当前帧</span><b>{frameLabels[frame]}</b><small>帧 {frame + 1} / 4</small></div>
          <div className="pc2-frame-tabs" role="group" aria-label="选择视频帧">{frameLabels.map((label, index) => <button type="button" key={label} className={frame === index ? "active" : ""} aria-pressed={frame === index} onClick={() => { setPlaying(false); setFrame(index); }}>{label}</button>)}</div>
          <button
            type="button"
            className="pc2-play-button"
            onClick={() => {
              if (reducedMotion) setFrame((value) => (value + 1) % frameLabels.length);
              else setPlaying((value) => !value);
            }}
            aria-label={playing ? "暂停时间轴" : "播放时间轴"}
          >
            {playing && !reducedMotion ? <Pause /> : <Play />}
            {reducedMotion ? "下一帧" : playing ? "暂停" : "播放"}
          </button>
        </div>

        <div className="pc2-four-d-stage">
          <div className="pc2-time-scene" style={{ "--person-x": `${personX}%`, "--camera-x": `${sourceCameraX}%` } as CSSProperties}>
            <header><span>同一世界坐标</span><b>(x, y, z) + 时间 t</b></header><div className="pc2-observed-range"><span>当前帧拍到的区域</span></div><div className="pc2-time-wall"><span>墙面</span><i className="window" /></div><div className="pc2-time-floor" /><div className="pc2-time-chair"><span>椅子</span></div><div className="pc2-time-person"><i /><b>人物</b></div><div className="pc2-source-camera" aria-label="源摄影机位置随帧变化"><Camera /><span>源摄影机</span></div>
          </div>

          <div className="pc2-legend" aria-label="点云颜色图例"><span><i className="static" />蓝色：椅子、墙、地面等静态内容</span><span><i className="dynamic" />橙色：随帧移动的动态人物</span><span><i className="camera" />白色：源摄影机与当前观测范围</span></div>

          <div className="pc2-pointcloud-comparison">
            <article className="pc2-p-card active"><header><span>逐帧结果</span><h4>逐帧点云 P</h4><p>主要包含当前帧观测到的内容。</p></header><div className="pc2-mini-cloud per-frame"><span className={`static-wall ${frame >= 2 ? "partly-seen" : ""}`} /><span className={`static-chair ${frame === 3 ? "not-seen" : ""}`} /><span className="dynamic-person" style={{ left: `${personX}%` }} /><i className="view-window" style={{ left: `${9 + frame * 8}%` }} /></div><footer>当前帧没拍到的静态区域，在 P 的这一时间切片中可能缺失。</footer></article>
            <div className="pc2-compare-arrow" aria-hidden="true"><span>Mstc</span><ArrowRight /></div>
            <article className="pc2-pbar-card active"><header><span>时间整合结果</span><h4>时间持续性点云 P̄</h4><p>静态世界持续，动态主体仍按当前时间显示。</p></header><div className="pc2-mini-cloud persistent"><span className="static-wall" /><span className="static-chair" /><span className="dynamic-person" style={{ left: `${personX}%` }} /><span className="time-axis">t = {frameLabels[frame]}</span></div><footer>静态内容可跨帧保留；人物只保留当前时间切片的位置与状态。</footer></article>
          </div>

          <p className="pc2-persistence-note"><b>P ≠ P̄。</b>时间持续性让静态世界点跨帧保留，而动态主体仍保持随时间变化的状态；M<sup>stc</sup> 决定哪些静态点从 P 持续到 P̄。</p>
        </div>
      </LearningModule>
    </div>
  );
}
