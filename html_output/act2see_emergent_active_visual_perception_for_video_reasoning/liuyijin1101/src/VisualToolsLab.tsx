import { useState } from 'react';
import { CupScene } from './EvidenceGapScene';
import './styles/visual-tools.css';

type ToolMode = 'retrieve' | 'generate';

const TARGET_TIME = 2.5;

function VideoStill({ time, label, badge, kind }: {
  time: number;
  label: string;
  badge: string;
  kind: 'source' | 'retrieved' | 'hypothetical';
}) {
  const description = kind === 'hypothetical'
    ? '生成的假设画面：如果杯子没有被拿起，2.5 秒时它仍留在桌面左侧；并非真实视频证据。'
    : kind === 'retrieved'
      ? '原视频 2.5 秒的目标画面：杯子被拿起并移向右侧。'
      : `原视频参考画面：${label}`;

  return <figure className={`vt-frame vt-frame--${kind}`}>
    <div className="vt-frame-image" role="img" aria-label={description}>
      <span aria-hidden="true"><CupScene time={time}/></span>
      <b className="vt-frame-badge">{badge}</b>
    </div>
    <figcaption>{label}</figcaption>
  </figure>;
}

function VideoTimeline({ mode }: { mode: ToolMode }) {
  const retrieve = mode === 'retrieve';

  return <div className={`vt-timeline vt-timeline--${mode}`} role="img" aria-label={`原视频从 0 到 4 秒的时间轴，${TARGET_TIME} 秒的${retrieve ? '拿起动作目标时刻' : '相关参考帧'}被高亮。`}>
    <div className="vt-timeline-head"><strong>{retrieve ? '在原视频中定位目标' : '先在原视频中取参考帧'}</strong><span>{TARGET_TIME.toFixed(1)} 秒 · {retrieve ? '目标时刻' : '参考时刻'}</span></div>
    <div className="vt-track">
      <span className="vt-action-window" aria-hidden="true"/>
      <span className="vt-target" aria-hidden="true"/>
      {[0, 1, 2, 3, 4].map(tick => <span key={tick} className="vt-tick" style={{ left: `${tick * 25}%` }} aria-hidden="true"/>)}
    </div>
    <div className="vt-timeline-labels"><span>0 s</span><span>1 s</span><span>2 s</span><span>3 s</span><span>4 s</span></div>
  </div>;
}

/** A deterministic teaching illustration of the two visual tools; no model or tool is run here. */
export function ChannelsLab() {
  const [mode, setMode] = useState<ToolMode>('retrieve');
  const retrieve = mode === 'retrieve';

  return <div className="vt-lab">
    <div className="vt-switch" role="group" aria-label="切换视觉工具">
      <button type="button" className={retrieve ? 'is-active' : ''} aria-pressed={retrieve} onClick={() => setMode('retrieve')}>Retrieve</button>
      <button type="button" className={!retrieve ? 'is-active' : ''} aria-pressed={!retrieve} onClick={() => setMode('generate')}>Generate</button>
    </div>
    <p className="vt-task"><span>任务</span><strong>{retrieve ? '找到杯子被拿起的画面。' : '如果杯子没有被拿起，画面会怎样？'}</strong></p>
    <div className={`vt-workbench vt-workbench--${mode}`}>
      <div className="vt-input"><span>输入</span><strong>原视频</strong><code>{retrieve ? '文字查询：杯子被拿起的画面' : '假设描述：杯子没有被拿起'}</code></div>
      <VideoTimeline mode={mode}/>
      <p className="vt-operation"><span>执行</span><strong>{retrieve ? 'TFVTG 根据文字查询检索原视频' : '参考帧 + 假设描述 → Stable Diffusion 3.5 Large 条件生成'}</strong></p>
      <div className="vt-pair">
        <VideoStill time={retrieve ? 2 : TARGET_TIME} label={retrieve ? '原视频片段 · 2 秒' : '先检索的参考帧 · 2.5 秒'} badge={retrieve ? '原视频' : '原视频参考帧'} kind="source"/>
        <VideoStill time={retrieve ? TARGET_TIME : 0} label={retrieve ? '检索结果 · 2.5 秒' : '假设结果 · 2.5 秒'} badge={retrieve ? '原视频画面' : '生成画面 · 非真实证据'} kind={retrieve ? 'retrieved' : 'hypothetical'}/>
      </div>
    </div>
  </div>;
}
