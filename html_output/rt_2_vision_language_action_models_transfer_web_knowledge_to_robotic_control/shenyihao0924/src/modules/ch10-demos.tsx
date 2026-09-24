import React, { useState } from 'react';
import { C } from './chefKit';
import type { WidgetProps } from './registry';

// Module 10.2 「真实演示与边界」 — DOM-only: official demo videos (remote-loaded
// from the project page) switchable by chips, plus two always-visible
// limitation cards (E15) and a source attribution line. No canvas needed.
type Demo = 'teaser' | 'cot';

const DEMOS: Record<
  Demo,
  { chip: string; src: string; fb: { text: string; cls: string } }
> = {
  teaser: {
    chip: '真机演示',
    src: 'https://robotics-transformer2.github.io/videos/rt2_teaser.mp4',
    fb: {
      text: '视频来源：robotics-transformer2.github.io。注意：动作本身仍是数据里那些——新的是『何时何地对谁用』。',
      cls: '',
    },
  },
  cot: {
    chip: '思维链对比',
    src: 'https://robotics-transformer2.github.io/videos/rt2cot_comp.mp4',
    fb: {
      text: '思维链对比：先说 Plan 再出 Action，语言计划把『我饿了→拿能量棒』这类两步推理桥接到操作。视频来源：robotics-transformer2.github.io。',
      cls: '',
    },
  },
};

const LIMITATIONS = [
  {
    title: '学不会新动作',
    desc: '技能仍限于机器人数据的分布——网页知识只让旧技能用在新地方。',
  },
  {
    title: '算力昂贵',
    desc: '高频控制受推理速度制约（55B 约 1-3 Hz）——未来靠量化、蒸馏提速。',
  },
];

export const Ch10Demos: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [demo, setDemo] = useState<Demo>('teaser');
  const cur = DEMOS[demo];

  return (
    <div>
      <div className="ctrl">
        <span className="step-label">演示</span>
        {(Object.keys(DEMOS) as Demo[]).map((k) => (
          <button
            key={k}
            className={'chip' + (demo === k ? ' selected' : '')}
            onClick={() => setDemo(k)}
          >
            {DEMOS[k].chip}
          </button>
        ))}
      </div>
      <div className="demo-player">
        <video
          key={demo}
          id={`video-${chapterId}-${moduleId}`}
          src={cur.src}
          autoPlay
          loop
          muted
          playsInline
          controls
        />
      </div>
      <div style={{ textAlign: 'center', fontSize: 12, color: C.muted, marginTop: 6 }}>
        视频来源：robotics-transformer2.github.io
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 12 }}>
        {LIMITATIONS.map((l) => (
          <div
            key={l.title}
            style={{
              flex: '1 1 280px',
              border: `2px solid ${C.red}`,
              borderRadius: 10,
              background: '#fdf3f4',
              padding: '10px 14px',
            }}
          >
            <div style={{ color: C.red, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
              {l.title}
            </div>
            <div style={{ color: C.text, fontSize: 13 }}>{l.desc}</div>
          </div>
        ))}
      </div>
      <div className={`feedback ${cur.fb.cls}`}>{cur.fb.text}</div>
    </div>
  );
};

export default Ch10Demos;
