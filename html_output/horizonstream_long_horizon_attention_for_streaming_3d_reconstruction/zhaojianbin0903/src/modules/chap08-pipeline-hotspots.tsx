import React, { useEffect, useRef, useState } from 'react';
import { clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { assetPath } from '../lib/assetPath';

type Hotspot = {
  id: string;
  label: string;
  x: number;
  y: number;
  problem: string;
  input: string;
  output: string;
  boundary?: string;
};

const HOTSPOTS: Hotspot[] = [
  {
    id: 'tokens',
    label: '图像 patch 与特殊 Token',
    x: 9,
    y: 39,
    problem: '把每帧图像与位姿、度量读出所需的特殊 Token 放到同一表示空间。',
    input: 'RGB 帧、图像 patch、位姿 Token、MRT。',
    output: '送入帧内块与全局块的统一 Token 序列。',
    boundary: 'ViT-L 使用 VGGT/DINOv2 初始化；骨干初始化本身不是本文核心创新。',
  },
  {
    id: 'window',
    label: '局部因果窗口',
    x: 28,
    y: 26,
    problem: '在最近帧内保留细粒度局部对应，同时不读取未来帧。',
    input: '最近 W 帧的局部 Token。',
    output: '供局部匹配与当前预测使用的因果上下文。',
  },
  {
    id: 'linear',
    label: '几何线性状态',
    x: 50,
    y: 26,
    problem: '跨窗口传播结构与尺度，又不让状态随序列长度增长。',
    input: '当前 key/value 几何证据与上一时刻 S_(t−1)。',
    output: '逐通道衰减并写入后的固定大小 S_t。',
    boundary: '论文实现将几何线性层放在第 4、11、17、23 层。',
  },
  {
    id: 'local',
    label: '逐头门控 + 时空 RoPE',
    x: 30,
    y: 71,
    problem: '抑制不可靠匹配，并给局部注意力相对时间、高度和宽度。',
    input: '局部窗口特征与相对 (t,y,x) 坐标。',
    output: '经过可靠性筛选的短期精确对应。',
  },
  {
    id: 'mrt',
    label: 'MRT 与位姿融合',
    x: 71,
    y: 28,
    problem: '把持久几何表示转换为稳定的度量尺度与相对位姿。',
    input: 'MRT、高保留几何通道、局部窗口位姿 Token。',
    output: '正尺度与多 Token 共识位姿。',
  },
  {
    id: 'heads',
    label: '位姿 / 深度输出',
    x: 88,
    y: 70,
    problem: '持续输出当前相机位姿与稠密深度并形成三维重建。',
    input: '融合后的 Token、尺度与相对位姿。',
    output: '因果相机位姿、稠密深度与点云。',
  },
];

export const Chap08PipelineHotspots: React.FC<WidgetProps> = () => {
  const labRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);
  const [autoPlay, setAutoPlay] = useState(
    () =>
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function' ||
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [isVisible, setIsVisible] = useState(true);
  const spot = HOTSPOTS[selected];

  useEffect(() => {
    const node = labRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!autoPlay || !isVisible) return;
    const timer = window.setInterval(() => {
      setSelected((current) => (current + 1) % HOTSPOTS.length);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [autoPlay, isVisible]);

  const selectHotspot = (index: number) => {
    setSelected(index);
    setAutoPlay(false);
  };

  return (
    <div className="hs-pipeline-lab" ref={labRef}>
      <div className="hs-figure-stage">
          <img
            src={assetPath('images/fig-3-pipeline.png')}
          alt="HorizonStream 原论文 Figure 3 完整架构图"
        />
        {HOTSPOTS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`hs-hotspot ${selected === index ? 'is-active' : ''}`}
            style={{ left: `${clamp(item.x, 0, 100)}%`, top: `${clamp(item.y, 0, 100)}%` }}
            aria-label={`定位 ${item.label}`}
            aria-pressed={selected === index}
            onClick={() => selectHotspot(index)}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <div className="chip-row hs-hotspot-index" aria-label="Figure 3 热点索引">
        <button
          type="button"
          className={`tiny ${autoPlay ? '' : 'ghost'}`}
          aria-pressed={autoPlay}
          onClick={() => setAutoPlay((current) => !current)}
        >
          {autoPlay ? '暂停演示' : '自动演示'}
        </button>
        {HOTSPOTS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`chip ${selected === index ? 'selected' : ''}`}
            aria-pressed={selected === index}
            onClick={() => selectHotspot(index)}
          >
            {index + 1}. {item.label}
          </button>
        ))}
      </div>

      <div className="hs-inspection" aria-live="polite">
        <div className="hs-inspection-kicker">已定位 · 原论文 Figure 3</div>
        <h5>{spot.label}</h5>
        <dl>
          <div><dt>解决的问题</dt><dd>{spot.problem}</dd></div>
          <div><dt>接收</dt><dd>{spot.input}</dd></div>
          <div><dt>输出</dt><dd>{spot.output}</dd></div>
        </dl>
        {spot.boundary ? <p className="hs-boundary">边界：{spot.boundary}</p> : null}
      </div>

      <style>{`
        .hs-pipeline-lab{display:grid;gap:14px}.hs-figure-stage{position:relative;overflow:hidden;border:1px solid var(--line);border-radius:8px;background:#fff;aspect-ratio:781/376}.hs-figure-stage img{display:block;width:100%;height:auto}.hs-hotspot{position:absolute;display:grid;place-items:center;width:34px;height:34px;min-width:34px;padding:0;border:2px solid #fff;border-radius:50%;background:#1455d9;color:#fff;font-weight:800;box-shadow:0 4px 14px rgba(20,85,217,.28);transform:translate(-50%,-50%)}.hs-hotspot:hover,.hs-hotspot:focus-visible{transform:translate(-50%,-50%) scale(1.08)}.hs-hotspot.is-active{background:#16875b;box-shadow:0 0 0 5px rgba(22,135,91,.18),0 6px 18px rgba(23,32,43,.22)}.hs-hotspot-index{justify-content:flex-start;margin:0}.hs-inspection{padding:16px 18px;border:1px solid var(--line);border-radius:8px;background:var(--paper-2)}.hs-inspection-kicker{color:var(--green);font-size:13px;font-weight:800}.hs-inspection h5{margin:3px 0 10px;color:var(--ink);font-size:19px}.hs-inspection dl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:0}.hs-inspection dl>div{min-width:0}.hs-inspection dt{color:var(--slate);font-size:12px;font-weight:800}.hs-inspection dd{margin:3px 0 0;color:var(--ink-2);font-size:14px;line-height:1.55}.hs-boundary{margin:12px 0 0;padding-top:10px;border-top:1px solid var(--line);color:var(--orange)!important;font-size:14px}@media(max-width:720px){.hs-hotspot{width:30px;height:30px;min-width:30px;font-size:13px}.hs-inspection dl{grid-template-columns:1fr}.hs-hotspot-index .chip{width:100%;justify-content:flex-start}}@media(prefers-reduced-motion:reduce){.hs-hotspot{transition:none!important}}
      `}</style>
    </div>
  );
};

export default Chap08PipelineHotspots;
