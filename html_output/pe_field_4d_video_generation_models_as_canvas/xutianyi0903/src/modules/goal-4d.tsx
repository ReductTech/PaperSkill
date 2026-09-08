import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { startObservedLoop } from './stage-analogy';
import { drawWalkingProjection, WALK_DURATION, type WalkState } from './walking-scene';

type RuntimeState = WalkState & {
  playing: boolean;
  lastMs: number;
  lastUiMs: number;
};

const INITIAL_STATE: RuntimeState = {
  time: 0,
  x: 0,
  y: 0,
  z: 0,
  yaw: 20,
  playing: false,
  lastMs: 0,
  lastUiMs: 0,
};

export const Goal4D: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<RuntimeState>({ ...INITIAL_STATE });
  const [ui, setUi] = useState<RuntimeState>({ ...INITIAL_STATE });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    return startObservedLoop(canvas, 560, 260, (ctx, ms) => {
      const state = stateRef.current;
      if (state.playing) {
        const delta = state.lastMs ? Math.min(0.05, (ms - state.lastMs) / 1000) : 0;
        state.time = (state.time + delta) % WALK_DURATION;
      }
      state.lastMs = ms;
      if (ms - state.lastUiMs > 80) {
        state.lastUiMs = ms;
        setUi({ ...state });
      }
      drawWalkingProjection(ctx, state, true);
    });
  }, []);

  const sync = (next: RuntimeState) => {
    stateRef.current = next;
    setUi({ ...next });
  };

  const setParam = (key: 'x' | 'y' | 'z' | 'yaw', value: number) => {
    sync({ ...stateRef.current, [key]: value });
  };

  const togglePlayback = () => {
    sync({ ...stateRef.current, playing: !stateRef.current.playing, lastMs: performance.now() });
  };

  const resetTime = () => {
    sync({ ...stateRef.current, time: 0, playing: false, lastMs: performance.now() });
  };

  return (
    <div>
      <canvas ref={ref} width={560} height={260} aria-label="人物沿直线行走的四维场景投影" />
      <div className="ctrl">
        <button className="tiny" onClick={togglePlayback}>{ui.playing ? '暂停' : '播放'}</button>
        <button className="tiny ghost" onClick={resetTime}>时间归零</button>
        <span>当前时间 <strong className="val">t = {ui.time.toFixed(1)} s</strong></span>
      </div>
      <div className="walk-param-grid">
        <label className="walk-param">
          <span>X 起点</span>
          <input type="range" min="-1" max="1" step="0.1" value={ui.x} onChange={(event) => setParam('x', Number(event.target.value))} />
          <output>{ui.x.toFixed(1)}</output>
        </label>
        <label className="walk-param">
          <span>Y 横移</span>
          <input type="range" min="-1" max="1" step="0.1" value={ui.y} onChange={(event) => setParam('y', Number(event.target.value))} />
          <output>{ui.y.toFixed(1)}</output>
        </label>
        <label className="walk-param">
          <span>Z 高度</span>
          <input type="range" min="-0.5" max="1.5" step="0.1" value={ui.z} onChange={(event) => setParam('z', Number(event.target.value))} />
          <output>{ui.z.toFixed(1)}</output>
        </label>
        <label className="walk-param">
          <span>摄像机角度</span>
          <input type="range" min="-60" max="60" step="1" value={ui.yaw} onChange={(event) => setParam('yaw', Number(event.target.value))} />
          <output>{ui.yaw.toFixed(0)}°</output>
        </label>
      </div>
      <div className={`feedback ${ui.playing ? 'good' : ''}`}>
        {ui.playing
          ? '播放时 t 持续增长，人物沿 P(t) 移动，并随相机深度呈现近大远小。'
          : '点击播放，再改变 X、Y、Z 或摄像机角度：位置、观察方式与透视尺度会同步更新。'}
      </div>
    </div>
  );
};

export default Goal4D;
