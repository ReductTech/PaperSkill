import { useState } from 'react';
import { CupScene } from './EvidenceGapScene';
import './styles/evidence-gap.css';

const DURATION = 4;
const ACTION_START = 2.2;
const ACTION_END = 2.7;
const FPS_OPTIONS = [0.5, 1, 2] as const;
type SamplingFps = (typeof FPS_OPTIONS)[number];

/** Fixed-origin sampling: t(k) = k / fps, for integer k >= 0 and 0 <= t(k) < 4 s. */
function sampleTimes(fps: SamplingFps) {
  return Array.from({ length: Math.ceil(DURATION * fps) }, (_, index) => index / fps)
    .filter(time => time < DURATION);
}

function isInAction(time: number) {
  return time >= ACTION_START && time <= ACTION_END;
}

function SamplingTimeline({ samples }: { samples: number[] }) {
  return <div className="eg-timeline" role="img" aria-label={`0 到 4 秒的固定采样时间轴。拿起并移动杯子的关键动作发生在 2.20 到 2.70 秒；采样点为 ${samples.map(time => `${time.toFixed(2)} 秒`).join('、')}。`}>
    <div className="eg-timeline-heading"><strong>采样时间轴</strong><span>0–4 s</span></div>
    <div className="eg-timeline-track">
      <span className="eg-timeline-window" style={{ left: `${ACTION_START / DURATION * 100}%`, width: `${(ACTION_END - ACTION_START) / DURATION * 100}%` }}/>
      {samples.map(time => <span key={time} className={`eg-timeline-sample ${isInAction(time) ? 'is-hit' : ''}`} style={{ left: `${time / DURATION * 100}%` }}/>) }
    </div>
    <div className="eg-timeline-labels"><span>0 s</span><span>1 s</span><span>2 s</span><span>3 s</span><span>4 s</span></div>
    <p className="eg-timeline-key">橙色区间：拿起并移动杯子（2.20–2.70 s） · 圆点：保留的帧</p>
  </div>;
}

function SampleFrames({ samples }: { samples: number[] }) {
  return <div className="eg-sample-grid" aria-label="模型实际看到的采样画面">
    {samples.map(time => <div key={time} className={`eg-sample-frame ${isInAction(time) ? 'is-hit' : ''}`}>
      <div className="eg-frame-time">{time.toFixed(2)} s</div>
      <CupScene time={time}/>
    </div>)}
  </div>;
}

export function EvidenceGapExperiment() {
  const [fps, setFps] = useState<SamplingFps>(1);
  const samples = sampleTimes(fps);
  const hits = samples.filter(isInAction);

  return <div className="eg-experiment">
    <fieldset className="eg-fps-control"><legend>选择采样帧数</legend><p>切换 FPS，观察时间轴与采样画面。</p><div className="eg-fps-options">{FPS_OPTIONS.map(option => <button key={option} type="button" aria-pressed={fps === option} className={fps === option ? 'is-active' : ''} onClick={() => setFps(option)}>{option} FPS</button>)}</div></fieldset>
    <SamplingTimeline samples={samples}/>
    <div className="eg-sample-section">
      <div className="eg-sample-heading"><strong>模型实际看到的画面</strong><span>{samples.length} 帧 · 从 0 秒开始</span></div>
      <SampleFrames samples={samples}/>
    </div>
    <div className={`eg-feedback ${hits.length ? 'is-covered' : 'is-missed'}`} role="status" aria-live="polite">
      <strong>{hits.length ? '已覆盖关键动作' : '错过了关键动作'}</strong>
      <span>{hits.length ? `${hits.map(time => `${time.toFixed(2)} s`).join('、')} 的采样帧落在关键动作窗口。` : '当前没有采样帧落在 2.20–2.70 s 的关键动作窗口。'}</span>
    </div>
  </div>;
}
