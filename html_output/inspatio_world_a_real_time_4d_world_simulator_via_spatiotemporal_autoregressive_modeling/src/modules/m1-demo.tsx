import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';

// §1 M1.1 — the paper's own demo clips (project page, static/videos). Switching a
// capability chip swaps the clip, the caption, and the feedback line.

type CapId = 'roam' | 'time' | 'real' | 'long';

interface Cap {
  id: CapId;
  chip: string;
  file: string;
  caption: string;
  feedback: string;
  cls: string;
}

// The tutorial is published under a sub-path (…/papers/<paper-name>/), so public
// assets must be addressed through Vite's BASE_URL. A leading-slash path would
// resolve against the site root and 404 once deployed.
const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`;

const CAPS: Cap[] = [
  {
    id: 'roam',
    chip: '自由漫游',
    file: 'demo/roaming.mp4',
    caption: '沿着你给的相机轨迹在场景里走动，视角连续变化而场景保持是同一个世界。',
    feedback: '自由空间漫游：视角是你说了算的，不是模型自己乱飘。这背后要解决第 1、2 道难题。',
    cls: '',
  },
  {
    id: 'time',
    chip: '时间控制',
    file: 'demo/temporal.mp4',
    caption: '场景里的动态元素随时间演化，可以让时间前进，也可以倒回去重看。',
    feedback: '时间可控：4D 比 3D 多出来的那一维就是这个——世界会动，而且动得听指挥。',
    cls: '',
  },
  {
    id: 'real',
    chip: '物理真实',
    file: 'demo/realism.mp4',
    caption: '光照、材质、纹理接近真实拍摄，而不是一眼假的「合成味」。',
    feedback: '物理真实感：这一条最容易在追求实时和可控时被牺牲，正是第 3 道难题。',
    cls: '',
  },
  {
    id: 'long',
    chip: '长时程稳定',
    file: 'demo/longhorizon.mp4',
    caption: '走上很长一段路之后，场景结构依然完整，没有塌成一团。',
    feedback: '长时程稳定：多数模型撑不过这一关，这正是第 1 道难题「记住已生成的空间」。',
    cls: 'good',
  },
];

export const M1Demo: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [cap, setCap] = useState<CapId>('roam');
  const videoRef = useRef<HTMLVideoElement>(null);
  const current = CAPS.find((c) => c.id === cap) as Cap;

  const pick = (c: Cap) => {
    setCap(c.id);
    const v = videoRef.current;
    if (v) {
      v.load();
      const p = v.play();
      if (p && typeof p.catch === 'function') p.catch(() => undefined);
    }
  };

  return (
    <div id={`demo-${chapterId}-${moduleId}`}>
      <div className="chip-row">
        {CAPS.map((c) => (
          <button
            key={c.id}
            className={`chip ${cap === c.id ? 'selected' : ''}`}
            onClick={() => pick(c)}
          >
            {c.chip}
          </button>
        ))}
      </div>
      <div className="demo-stage">
        <video
          ref={videoRef}
          className="demo-video"
          src={asset(current.file)}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      </div>
      <p className="demo-caption">{current.caption}</p>
      <div className={`feedback ${current.cls}`}>{current.feedback}</div>
      <p className="demo-credit">
        演示片段来自论文项目主页 inspatio.github.io/inspatio-world，仅用于学习说明。
      </p>
    </div>
  );
};

export default M1Demo;
