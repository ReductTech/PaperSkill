import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';

// §10 module 10.2 — 真实演示与边界: DOM-only widget. Three official demo
// videos (remote, openvla.github.io) switch via chips; below, two red-bordered
// limitation cards and one green eco card put the boundaries on display.
const CAROUSEL = 'https://openvla.github.io/static/videos/carousel/';

interface Demo {
  id: string;
  chip: string;
  scene: string;
  file: string;
}

const DEMOS: Demo[] = [
  { id: 'bridge', chip: '杂乱抓取', scene: 'BridgeData V2', file: 'bridge_pick_clutter.mp4' },
  { id: 'franka', chip: '微调后倒玉米', scene: 'Franka 微调', file: 'franka_pour_corn.mp4' },
  { id: 'rt1', chip: '可乐立正', scene: 'Google Robot', file: 'rt1_robot_coke_upright.mp4' },
];

const FEEDBACK_HTML =
  '注意：动作本身仍是『数据里那些』——新的是<b>开箱即用、人人可改</b>。';

export const Ch10Demos: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [sel, setSel] = useState(DEMOS[0].id);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cur = DEMOS.find((d) => d.id === sel) ?? DEMOS[0];

  // Re-muted after any source switch: some browsers forget `muted` when the
  // element is re-created, which would block autoplay.
  const afterSwitch = () => {
    const v = videoRef.current;
    if (v) {
      v.muted = true;
      v.play().catch(() => {
        /* autoplay may be refused until the user interacts; controls remain */
      });
    }
  };

  const card: React.CSSProperties = {
    flex: '1 1 0',
    minWidth: 190,
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 12.5,
    lineHeight: 1.6,
  };
  const cardTitle: React.CSSProperties = {
    fontSize: 13.5,
    fontWeight: 600,
    marginBottom: 4,
  };

  return (
    <div id={`demo-${chapterId}-${moduleId}`}>
      <div className="ctrl">
        <div className="chip-row">
          {DEMOS.map((d) => (
            <button
              key={d.id}
              className={`chip${sel === d.id ? ' selected' : ''}`}
              onClick={() => setSel(d.id)}
            >
              {d.chip}
            </button>
          ))}
        </div>
      </div>
      <div className="demo-player" style={{ marginTop: 10 }}>
        <video
          key={cur.file}
          ref={videoRef}
          src={CAROUSEL + cur.file}
          autoPlay
          loop
          muted
          playsInline
          controls
          onLoadedData={afterSwitch}
        />
      </div>
      <div style={{ fontSize: 12, color: '#68778f', marginTop: 6 }}>
        视频来源：openvla.github.io · {cur.scene}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
        <div style={{ ...card, border: '2px solid #c43f52', background: '#fdf2f3' }}>
          <div style={{ ...cardTitle, color: '#c43f52' }}>无动作分块</div>
          一次只预测一步动作、无时序平滑——精细任务逊于 Diffusion Policy
        </div>
        <div style={{ ...card, border: '2px solid #c43f52', background: '#fdf2f3' }}>
          <div style={{ ...cardTitle, color: '#c43f52' }}>无本体感知 · 单帧</div>
          不读关节状态、只看单帧图像；控制频率受 LLM 推理速度制约
        </div>
        <div style={{ ...card, border: '2px solid #228d5c', background: '#effaf4' }}>
          <div style={{ ...cardTitle, color: '#228d5c' }}>开源生态</div>
          HuggingFace 权重 · 微调笔记本 · PyTorch 代码库
        </div>
      </div>
      <div
        className="feedback"
        dangerouslySetInnerHTML={{ __html: FEEDBACK_HTML }}
        style={{ marginTop: 12 }}
      />
    </div>
  );
};

export default Ch10Demos;
