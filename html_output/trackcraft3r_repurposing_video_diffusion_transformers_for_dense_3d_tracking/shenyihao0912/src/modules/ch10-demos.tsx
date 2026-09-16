import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// Module 10.2 真实演示 — three official demo clips streamed directly from the
// TrackCraft3R project page (large motion / occlusion / camera motion). One
// dominant operation: switch the demo chip; the player and the observation
// notes update immediately. Source: cvlab-kaist.github.io/TrackCraft3r.
const REMOTE = 'https://cvlab-kaist.github.io/TrackCraft3r/videos/';

interface Demo {
  key: string;
  chip: string;
  src: string;
  scene: string;
  observe: string;
}

const DEMOS: Demo[] = [
  {
    key: 'breakdance',
    chip: '大位移',
    src: `${REMOTE}breakdance.mp4`,
    scene: 'Breakdance（霹雳舞）',
    observe:
      '舞者高速翻转、四肢大幅位移——每个第一帧像素的 3D 轨迹仍然逐帧锁定，不因运动剧烈而断裂（论文图 4 的同类场景）。',
  },
  {
    key: 'two-dogs',
    chip: '遮挡',
    src: `${REMOTE}two_dogs.mp4`,
    scene: 'Two Dogs（两只狗）',
    observe:
      '两只狗互相穿插遮挡：被挡住的点保持身份、可见性自动切换为不可见，重新露出的瞬间轨迹无缝接上。',
  },
  {
    key: 'cars',
    chip: '相机运动',
    src: `${REMOTE}cars_on_the_street.mp4`,
    scene: 'Cars on the Street（街景车辆）',
    observe:
      '镜头自身大幅移动，画面里"满屏都在动"；世界坐标系下车身的真实运动与相机自运动被干净分离。',
  },
];

export const Ch10Demos: React.FC<WidgetProps> = () => {
  const [idx, setIdx] = useState(0);
  const d = DEMOS[idx];

  return (
    <div>
      <div className="demo-player">
        <video
          key={d.key}
          src={d.src}
          autoPlay
          loop
          muted
          playsInline
          controls
          aria-label={d.scene}
        />
      </div>
      <div className="ctrl">
        {DEMOS.map((demo, i) => (
          <button
            key={demo.key}
            type="button"
            className={`chip ${i === idx ? 'selected' : ''}`}
            onClick={() => setIdx(i)}
          >
            {demo.chip}
          </button>
        ))}
        <span className="step-label">{d.scene}</span>
      </div>
      <div className="feedback">{d.observe}</div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--slate-2, #68778f)',
          marginTop: 6,
        }}
      >
        素材来源：TrackCraft3R 官方项目页 · cvlab-kaist.github.io/TrackCraft3r
      </div>
    </div>
  );
};

export default Ch10Demos;
