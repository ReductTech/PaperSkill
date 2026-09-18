import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  Feedback,
  canvasPoint,
  clearScene,
  drawActionTokens,
  drawBowl,
  drawObject,
  drawRobotArm,
  drawText,
  drawWorkbench,
  useRememberedState,
  useResponsiveCanvas,
} from './shared';

export function FixedHMission(_: WidgetProps) {
  const [progress, setProgress] = useRememberedState('fixed-mission-progress', 0);
  const [bowlOffset, setBowlOffset] = useRememberedState('fixed-mission-bowl', 0);
  const [running, setRunning] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!running || progress >= 100) return;
    let raf = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const delta = now - previous;
      previous = now;
      setProgress((value) => Math.min(100, value + delta / 52));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress, running, setProgress]);

  useEffect(() => { if (progress >= 100) setRunning(false); }, [progress]);

  const ref = useResponsiveCanvas((ctx, w, h, time) => {
    clearScene(ctx, w, h);
    drawWorkbench(ctx, w, h);
    const tableY = h * 0.76;
    const oldX = w * 0.78;
    const bowlX = w * (0.78 + bowlOffset);
    const p = progress / 100;
    const handX = w * 0.27 + (oldX - w * 0.27) * p;
    const handY = tableY - 86 + 54 * p;
    const moved = Math.abs(bowlOffset) > 0.025;
    drawBowl(ctx, bowlX, tableY - 5, w < 560 ? 0.72 : 0.88, COLORS.recovery);
    if (moved) {
      ctx.save(); ctx.globalAlpha = 0.35; drawBowl(ctx, oldX, tableY - 5, w < 560 ? 0.72 : 0.88, COLORS.anomaly); ctx.restore();
      ctx.strokeStyle = COLORS.prediction; ctx.lineWidth = 2.5;
      const pulse = 10 + 6 * Math.sin(time * 4) ** 2;
      ctx.beginPath(); ctx.arc(bowlX, tableY - 10, pulse, 0, Math.PI * 2); ctx.stroke();
    }
    const miss = moved && p > 0.64;
    drawRobotArm(ctx, w * 0.11, tableY, handX, handY, w < 560 ? 0.72 : 0.9, miss ? COLORS.anomaly : COLORS.normal);
    drawObject(ctx, handX, handY + 18, w < 560 ? 0.7 : 0.82, COLORS.actual);
    drawActionTokens(ctx, w * 0.2, 29, 10, Math.floor(p * 10), Infinity, Math.min(29, w * 0.068));
    drawText(ctx, moved ? '新观测已到达' : '等待扰动', w - 16, 27, moved ? COLORS.prediction : COLORS.muted, w < 560 ? 10 : 12, 'right');
    drawText(ctx, miss ? '旧队列未改变' : '固定 H 执行', 16, 27, miss ? COLORS.anomaly : COLORS.normal, w < 560 ? 10 : 12);
  }, [bowlOffset, progress], { animate: true, mobileHeight: 290, desktopRatio: 0.32, maxDesktopHeight: 340 });

  const updateBowl = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = canvasPoint(event.currentTarget, event);
    const logicalWidth = event.currentTarget.width / (window.devicePixelRatio || 1);
    setBowlOffset(Math.max(-0.28, Math.min(0.08, point.x / logicalWidth - 0.78)));
    setProgress((value) => Math.max(22, value));
  };
  const reset = () => { setRunning(false); setProgress(0); setBowlOffset(0); };
  const moved = Math.abs(bowlOffset) > 0.025;
  const finished = progress >= 96;

  return (
    <div className="v2-widget mission-lab">
      <div className="mission-callout"><b>操作：</b>启动机械臂后，把绿色目标碗拖到别处，观察机器人是否会改计划。</div>
      <div className="mission-controls">
        <button type="button" className="tiny primary" onClick={() => setRunning((value) => !value)} disabled={finished}>{running ? '暂停' : progress > 0 ? '继续执行' : '开始执行'}</button>
        <button type="button" className="tiny" onClick={() => { setRunning(false); setProgress((value) => Math.min(100, value + 10)); }} disabled={finished}>单步</button>
        <button type="button" className="tiny" onClick={reset}>重置任务</button>
        <span className={`state-pill ${moved ? finished ? 'bad' : 'aux' : ''}`}>{!moved ? '目标尚未移动' : finished ? '动作块执行完，但放错位置' : '相机看见了变化'}</span>
      </div>
      <canvas
        ref={ref}
        className="v2-canvas v2-draggable"
        tabIndex={0}
        aria-label="可拖动目标碗的固定动作时域实验"
        onPointerDown={(event) => { setDragging(true); event.currentTarget.setPointerCapture(event.pointerId); updateBowl(event); }}
        onPointerMove={(event) => { if (dragging) updateBowl(event); }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') { event.preventDefault(); setBowlOffset((value) => Math.max(-0.28, value - 0.025)); setProgress((value) => Math.max(22, value)); }
          if (event.key === 'ArrowRight') { event.preventDefault(); setBowlOffset((value) => Math.min(0.08, value + 0.025)); setProgress((value) => Math.max(22, value)); }
        }}
      />
      <Feedback tone={!moved ? 'neutral' : finished ? 'bad' : 'aux'}>{!moved ? '固定动作块目前仍然有效。移动目标，才会暴露“看到变化”和“重新规划”之间的差别。' : finished ? '相机一直有新画面，但固定 H 方法仍把旧队列执行到底；看见变化不等于主干已经重新规划。' : '紫色脉冲表示新观测已经到达；机械臂仍朝红色旧位置移动，因为剩余动作早已生成。'}</Feedback>
    </div>
  );
}

const HORIZONS = [1, 5, 10] as const;

export function HorizonChoice(_: WidgetProps) {
  const [disturbance, setDisturbance] = useRememberedState<number>('horizon-disturbance-step', 8);
  const rows = HORIZONS.map((horizon) => {
    const nextCall = Math.min(21, Math.floor((disturbance - 1) / horizon) * horizon + horizon + 1);
    return { horizon, nextCall, wait: Math.max(0, nextCall - disturbance - 1), calls: Math.ceil(20 / horizon) };
  });
  return (
    <div className="v2-widget horizon-lanes">
      <div className="mission-callout"><b>把扰动放进时间轴：</b>三种固定 H 同时遇到它，比较各自要到哪一步才重新调用 VLA。</div>
      <label className="disturbance-slider" htmlFor="disturbance-step">
        <span>碗在第 <b>{disturbance}</b> 步后移动</span>
        <input id="disturbance-step" type="range" min="2" max="18" value={disturbance} onChange={(event) => setDisturbance(Number(event.target.value))} />
      </label>
      <div className="horizon-lane-board" aria-label="不同动作时域的同步重规划时间轴">
        <div className="lane-axis" aria-hidden="true"><span />{Array.from({ length: 20 }, (_, index) => <i key={index}>{index + 1}</i>)}<em /></div>
        {rows.map(({ horizon, nextCall, wait, calls }) => (
          <div className={`horizon-lane h-${horizon}`} key={horizon}>
            <header><b>H = {horizon}</b><small>20 步约 {calls} 次调用</small></header>
            <div className="lane-cells">
              {Array.from({ length: 20 }, (_, index) => {
                const step = index + 1;
                const call = (step - 1) % horizon === 0;
                const disturbed = step === disturbance;
                const waiting = step > disturbance && step < nextCall;
                return <span key={step} className={`${call ? 'call' : ''} ${disturbed ? 'disturbed' : ''} ${waiting ? 'waiting' : ''}`}><i>{call ? 'VLA' : ''}</i></span>;
              })}
            </div>
            <strong className={wait >= 5 ? 'bad' : wait === 0 ? 'good' : ''}>{wait === 0 ? '下一步即可重规划' : `还会消费 ${wait} 个旧动作`}</strong>
          </div>
        ))}
      </div>
      <Feedback tone="warn">拖动扰动时刻会发现：固定 H 的风险不仅由 H 决定，还取决于扰动落在动作块的什么位置。长 H 省调用，但红色等待区可能更长。</Feedback>
    </div>
  );
}
