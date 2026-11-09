import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { modules } from "../content";
import { Panel, type Done } from "./Shared";
import { brightnessCurve, processImage, rgbTransform, settings } from "./moduleProcessing";
import { drawModuleRoad } from "./moduleRoad";
import "./ModuleLab.css";

const explanations = [
  "数字增益统一放大或缩小 RGB 强度；过高会让亮部剪切，过低会藏住暗处目标。曝光改变所有亮度区间的倍率。",
  "Gamma 对每个通道执行 I′=Iᵖ；p<1 提亮暗部和中间调，p>1 压暗它们，端点保持不变。暗处目标轮廓可能因此改变。",
  "3×3 矩阵把一个通道的信息混入另一个通道；色偏和物体颜色会变化，进而影响检测器看到的特征。这里用行和为 1 的示例矩阵。",
  "p<1 向邻域模糊图靠近，p>1 放大原图与模糊图的差别。路牌和车轮边缘可能更清楚，也可能出现噪声或边缘伪影。",
  "邻域相似像素被加权平均，强度越高抑噪越明显，细小轮廓也可能丢失。此处用轻量边缘感知近似，论文模块使用可微 NLM。",
  "八段单调曲线重新分配暗部与亮部，斜率会随参数改变；过强映射也会压缩目标附近的明暗差别。",
  "亮度驱动的非线性映射拉开或压缩明暗差，p=0 保持原图。物体与背景的局部对比可能随之改变。",
  "提高颜色与亮度的差值，车身和背景颜色更醒目；颜色增强也可能放大彩色干扰。此处使用简化的亮度插值。",
  "逐渐把 RGB 混向亮度灰度图，p=1 时接近全灰。彩色噪声的干扰可能变小，但有用的颜色线索也会减少。",
  "红、蓝通道采用相反方向的相对增益，模拟冷暖色偏校正；目标颜色会随之改变。它只缩放通道，不像 CCM 那样混合通道。",
] as const;

const groups = [
  { title: "亮度与色调", indices: [0, 1, 5, 6] },
  { title: "颜色", indices: [2, 7, 8, 9] },
  { title: "噪声与细节", indices: [3, 4] },
] as const;

function Curve({ index, value }: { index: number; value: number }) {
  const points = Array.from({ length: 65 }, (_, i) => {
    const x = i / 64;
    return `${24 + x * 260},${166 - brightnessCurve(index, value, x) * 142}`;
  }).join(" ");
  return <svg className="m3-curve" viewBox="0 0 310 195" role="img" aria-label="输入到输出的亮度映射曲线">
    <path d="M24 24V166H284" stroke="#9fb0c8" fill="none" />
    <path d="M24 166 284 24" stroke="#c7d0dd" strokeDasharray="5 5" fill="none" />
    <polyline points={points} fill="none" stroke="#f07e47" strokeWidth="3" strokeLinejoin="round" />
    <text x="24" y="188">输入亮度 0 → 1</text><text x="30" y="20">输出 ↑</text>
  </svg>;
}

function Samples({ index, value }: { index: number; value: number }) {
  const swatches: [number, number, number][] = [[.75, .28, .19], [.22, .62, .42], [.22, .39, .76]];
  return <div className="m3-swatches" aria-label="RGB 色块处理前后对比">
    {swatches.map(([r, g, b], i) => {
      const [nr, ng, nb] = rgbTransform(index, value, r, g, b);
      const color = (a: number, c: number, d: number) => `rgb(${Math.round(Math.max(0, Math.min(1, a)) * 255)} ${Math.round(Math.max(0, Math.min(1, c)) * 255)} ${Math.round(Math.max(0, Math.min(1, d)) * 255)})`;
      return <div key={i}><span style={{ background: color(r, g, b) }} /><span style={{ background: color(nr, ng, nb) }} /></div>;
    })}
    <small>每组左为原始色，右为处理后</small>
  </div>;
}

export function ModuleLab({ onDone }: Done) {
  const [selected, setSelected] = useState(0);
  const [values, setValues] = useState<number[]>(() => settings.map(x => x.initial));
  const [seen, setSeen] = useState<number[]>([]);
  const [source, setSource] = useState<ImageData | null>(null);
  const inputRef = useRef<HTMLCanvasElement>(null);
  const outputRef = useRef<HTMLCanvasElement>(null);
  const inputCropRef = useRef<HTMLCanvasElement>(null);
  const outputCropRef = useRef<HTMLCanvasElement>(null);
  const setting = settings[selected];
  const value = values[selected];

  useEffect(() => {
    const canvas = inputRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (context) {
        drawModuleRoad(context);
        const pixels = context.getImageData(0, 0, 560, 300);
        // A small repeatable chroma texture makes the denoising tradeoff observable.
        for (let i = 0; i < pixels.data.length; i += 4) {
          const x = (i / 4) % 560, y = Math.floor(i / 4 / 560);
          const noise = ((x * 37 + y * 73 + x * y * 11) % 41) - 20;
          pixels.data[i] = Math.max(0, Math.min(255, pixels.data[i] + noise));
          pixels.data[i + 2] = Math.max(0, Math.min(255, pixels.data[i + 2] - noise));
        }
        context.putImageData(pixels, 0, 0);
        setSource(pixels);
    }
  }, []);

  useEffect(() => {
    if (!source) return;
    const frame = requestAnimationFrame(() => {
      const output = outputRef.current?.getContext("2d");
      if (!output) return;
      const result = processImage(source, selected, value);
      output.putImageData(result, 0, 0);
      const original = document.createElement("canvas");
      original.width = source.width; original.height = source.height;
      original.getContext("2d")?.putImageData(source, 0, 0);
      const crop = (target: HTMLCanvasElement | null, from: HTMLCanvasElement) => {
        const context = target?.getContext("2d");
        if (context) context.drawImage(from, 465, 60, 80, 95, 0, 0, 160, 190);
      };
      crop(inputCropRef.current, original);
      crop(outputCropRef.current, outputRef.current!);
    });
    return () => cancelAnimationFrame(frame);
  }, [source, selected, value]);

  const update = (next: number) => setValues(previous => previous.map((v, i) => i === selected ? next : v));
  const isCurve = [0, 1, 5, 6].includes(selected);
  return <>
    <Panel title="十种处理工具">
      <div className="m3-lab">
        <p className="m3-intro">选择一种 RGB 域工具，再拖动参数观察同一幅道路图像。以下分组只帮助认识功能，不代表策略先选组别。</p>
        <div className="m3-groups">
          {groups.map(group => <div className="m3-group" key={group.title}>
            <span className="m3-group-name">{group.title}</span>
            <div className="m3-options">{group.indices.map(i => <button key={i} type="button" className={selected === i ? "selected" : ""} aria-pressed={selected === i} onClick={() => {
              setSelected(i);
              const next = [...new Set([...seen, i])];
              setSeen(next);
              if (next.length >= 3) onDone();
            }}><b>{modules[i].cn}</b><small>{modules[i].name}</small></button>)}</div>
          </div>)}
        </div>
        <div className="m3-images">
          <div><span className="image-label">INPUT · 原始道路图像</span><canvas ref={inputRef} width="560" height="300" role="img" aria-label="带轻微彩色噪声的原始道路图像" /></div>
          <div><span className="image-label">OUTPUT · {modules[selected].name}</span><canvas ref={outputRef} width="560" height="300" role="img" aria-label={`${modules[selected].cn}处理后的道路图像`} /></div>
        </div>
        <div className="m3-control">
          <div className="m3-control-head"><div><strong>{modules[selected].cn}</strong><span>{modules[selected].name} · Eq.{modules[selected].eq}</span></div><output>{value.toFixed(2)}{setting.unit}</output></div>
          <input type="range" min={setting.min} max={setting.max} step={setting.step} value={value} aria-label={`${modules[selected].cn}参数`} onChange={event => update(Number(event.target.value))} />
          <div className="m3-range"><span>{setting.min}</span><span>中性 {setting.neutral}</span><span>{setting.max}</span></div>
          <button type="button" className="m3-reset" onClick={() => update(setting.initial)}><RotateCcw size={14} />恢复示例参数</button>
        </div>
        <p className="m3-explanation" aria-live="polite">{explanations[selected]}</p>
      </div>
    </Panel>
    <Panel title="参数改变了什么？">
      <div className="m3-parameter">
        <p>模块决定执行哪种处理；参数决定处理多少。上方的「{modules[selected].cn}」滑条同时控制图像和这里的反馈。</p>
        <div className="m3-visual">
          {isCurve ? <><Curve index={selected} value={value} /><p>{selected === 1 ? "曲线与图像都按 I′=Iᵖ 计算。灰色虚线是原样输出；橙色偏离它越多，暗部与中间调变化越大。" : selected === 0 ? "输入乘以 2ᵖ 后会在 1 处截断；曲线贴住顶部时，高亮细节已经丢失。" : selected === 5 ? "八段正斜率归一化后保持单调；改变斜率会重新分配明暗区域。" : "p=0 是原样输出；曲线改变亮暗差，可能同时影响目标与背景。"}</p></> : selected === 3 || selected === 4 ? <><div className="m3-crops"><div><span>原始 · 路牌局部</span><canvas ref={inputCropRef} width="160" height="190" /></div><div><span>处理后 · 路牌局部</span><canvas ref={outputCropRef} width="160" height="190" /></div></div><p>{selected === 3 ? "观察路牌横线和杆身边缘：p=1 保持原样，低于 1 变柔，高于 1 增强边缘。" : "观察平坦路面与细线：更强抑噪也可能抹去小目标细节。"}</p></> : <><Samples index={selected} value={value} /><p>{selected === 2 ? "CCM 让 RGB 通道互相混合，色块的变化不等同于统一增减饱和度。" : selected === 9 ? "白平衡分别缩放红、蓝通道；中性参数为 0。" : selected === 8 ? "参数从 0 到 1，颜色逐渐向灰度靠近，亮度结构仍保留。" : "颜色改变会影响目标与背景的区分；具体检测结果仍取决于输入和检测器。"}</p></>}
        </div>
      </div>
    </Panel>
    <p className="m3-next">有了十种工具，AdaptiveISP 怎样决定当前图像应该使用哪一个？ → §4「谁决定下一步？」</p>
  </>;
}
