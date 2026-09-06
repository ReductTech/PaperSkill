import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, clearStage, drawSceneLabel, startObservedLoop } from './stage-analogy';
import { drawTargetPanel, WALK_DURATION, type WalkState } from './walking-scene';

type Phase = 'idle' | 'running' | 'done';
type RuntimeState = WalkState & {
  running: boolean;
  lastMs: number;
  lastUiMs: number;
};

const INITIAL_STATE: RuntimeState = {
  time: 0,
  x: 0,
  y: 0,
  z: 0,
  yaw: 35,
  running: false,
  lastMs: 0,
  lastUiMs: 0,
};

export const GuidedCompare: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<RuntimeState>({ ...INITIAL_STATE });
  const [phase, setPhase] = useState<Phase>('idle');
  const [ui, setUi] = useState<RuntimeState>({ ...INITIAL_STATE });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    return startObservedLoop(canvas, 560, 240, (ctx, ms) => {
      const state = stateRef.current;
      if (state.running) {
        const delta = state.lastMs ? Math.min(0.05, (ms - state.lastMs) / 1000) : 0;
        state.time = Math.min(WALK_DURATION, state.time + delta);
        if (state.time >= WALK_DURATION) {
          state.running = false;
          setPhase('done');
        }
      }
      state.lastMs = ms;
      if (ms - state.lastUiMs > 80) {
        state.lastUiMs = ms;
        setUi({ ...state });
      }

      clearStage(ctx, 560, 240);
      drawTargetPanel(ctx, 8, 22, 264, 190, state, false, '隐式位置猜测');
      drawTargetPanel(ctx, 288, 22, 264, 190, state, true, '投影位置地址');
      drawSceneLabel(ctx, `共享状态：t=${state.time.toFixed(1)}s · P(t) 相同 · 相机 ${state.yaw >= 0 ? '+' : ''}${state.yaw.toFixed(0)}°`, 280, 232, C.blue, 'center');
    });
  }, []);

  const start = () => {
    const next = { ...stateRef.current, time: 0, running: true, lastMs: performance.now() };
    stateRef.current = next;
    setUi(next);
    setPhase('running');
  };

  const reset = () => {
    const next = { ...stateRef.current, time: 0, running: false, lastMs: performance.now() };
    stateRef.current = next;
    setUi(next);
    setPhase('idle');
  };

  const setYaw = (yaw: number) => {
    const next = { ...stateRef.current, yaw };
    stateRef.current = next;
    setUi(next);
  };

  const message = phase === 'idle'
    ? '两边共享同一个人物、时间、XYZ 坐标、摄像机角度和近大远小。'
    : phase === 'running'
      ? '两边同步近大远小；注意左侧人物逐渐漂离正确落点，右侧始终沿投影路径行走。'
      : '完整播放结束：位置地址把参考内容钉在每一时刻的目标构图上。';

  return (
    <div>
      <canvas ref={ref} width={560} height={240} aria-label="同一行走视频的隐式位置猜测与投影位置地址对比" />
      <div className="ctrl">
        <button onClick={start} disabled={phase === 'running'}>同时播放</button>
        <button className="chip" onClick={reset}>重置</button>
        <span>当前时间 <strong className="val">t = {ui.time.toFixed(1)} s</strong></span>
      </div>
      <div className="walk-param-grid">
        <label className="walk-param" style={{ gridColumn: '1 / -1' }}>
          <span>摄像机角度</span>
          <input type="range" min="-60" max="60" step="1" value={ui.yaw} onChange={(event) => setYaw(Number(event.target.value))} />
          <output>{ui.yaw.toFixed(0)}°</output>
        </label>
      </div>
      <div className={`feedback ${phase === 'done' ? 'good' : ''}`}>{message}</div>
    </div>
  );
};

export default GuidedCompare;
