import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  ChipButton, COLORS, Feedback, JourneySteps, canvasPoint, clearScene, drawBowl, drawObject, drawPath,
  drawRobotArm, drawText, drawWorkbench, easeInOutCubic, segmentProgress, useRememberedState,
  useResponsiveCanvas,
} from './shared';

const MISSION_PHASES = [
  { at: 0, label: '正常执行', tone: 'normal' },
  { at: 18, label: '读取新观测', tone: 'aux' },
  { at: 30, label: '发现偏差', tone: 'bad' },
  { at: 42, label: '累计异常 1 / 5', tone: 'bad' },
  { at: 55, label: '截断旧队列', tone: 'warn' },
  { at: 66, label: 'OGG 纠正一次', tone: 'warn' },
  { at: 80, label: '恢复普通推理', tone: 'good' },
] as const;

function phaseFor(progress: number) {
  let found = 0;
  MISSION_PHASES.forEach((phase, index) => { if (progress >= phase.at) found = index; });
  return found;
}

export function RecoveryMission(_: WidgetProps) {
  const [progress, setProgress] = useRememberedState('recovery-mission-progress-v4', 0);
  const [bowlOffset, setBowlOffset] = useRememberedState('recovery-mission-bowl-v4', -0.12);
  const [running, setRunning] = useState(false);
  const [dragging, setDragging] = useState(false);
  const phase = phaseFor(progress);

  useEffect(() => {
    if (!running || progress >= 100) return;
    let raf = 0; let previous = performance.now();
    const tick = (now: number) => { setProgress((value) => Math.min(100, value + (now - previous) / 94)); previous = now; raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [running, progress, setProgress]);
  useEffect(() => { if (progress >= 100) setRunning(false); }, [progress]);

  const ref = useResponsiveCanvas((ctx, w, h) => {
    clearScene(ctx, w, h); drawWorkbench(ctx, w, h);
    const p = progress / 100; const tableY = h * 0.77; const oldX = w * 0.78; const destinationX = oldX + w * bowlOffset;
    const bowlMove = segmentProgress(p, 0.16, 0.29); const bowlX = oldX + (destinationX - oldX) * bowlMove;
    drawBowl(ctx, bowlX, tableY - 5, w < 560 ? 0.66 : 0.84, COLORS.recovery);
    if (bowlMove > 0.03) { ctx.save(); ctx.globalAlpha = 0.24 * bowlMove; drawBowl(ctx, oldX, tableY - 5, w < 560 ? 0.66 : 0.84, COLORS.anomaly); ctx.restore(); }

    const start = { x: w * 0.28, y: tableY - 90 }; const interrupt = { x: w * 0.53, y: tableY - 65 };
    const lift = { x: w * 0.58, y: tableY - 116 }; const target = { x: destinationX, y: tableY - 28 };
    drawPath(ctx, [start, { x: w * 0.57, y: tableY - 78 }, { x: oldX, y: tableY - 28 }], p > 0.28 ? COLORS.anomaly : COLORS.normal, p > 0.28 ? 2.5 : 4, p > 0.28, 0.72);
    if (p > 0.55) drawPath(ctx, [interrupt, lift, target], p < 0.8 ? COLORS.emphasis : COLORS.recovery, 4, false, Math.min(1, (p - 0.55) / 0.18));

    let hand = start;
    if (p < 0.52) {
      const q = easeInOutCubic(Math.min(1, p / 0.52)); hand = { x: start.x + (interrupt.x - start.x) * q, y: start.y + (interrupt.y - start.y) * q };
    } else if (p < 0.64) {
      const q = (p - 0.52) / 0.12; hand = { x: interrupt.x + 3 * Math.sin(q * Math.PI), y: interrupt.y - 2 * Math.sin(q * Math.PI) };
    } else if (p < 0.79) {
      const q = easeInOutCubic((p - 0.64) / 0.15); hand = { x: interrupt.x + (lift.x - interrupt.x) * q, y: interrupt.y + (lift.y - interrupt.y) * q };
    } else {
      const q = easeInOutCubic((p - 0.79) / 0.21); hand = { x: lift.x + (target.x - lift.x) * q, y: lift.y + (target.y - lift.y) * q };
    }
    const armColor = p < 0.3 ? COLORS.normal : p < 0.55 ? COLORS.anomaly : p < 0.79 ? COLORS.emphasis : p < 0.97 ? COLORS.recovery : COLORS.normal;
    drawRobotArm(ctx, w * 0.11, tableY, hand.x, hand.y, w < 560 ? 0.66 : 0.84, armColor); drawObject(ctx, hand.x, hand.y + 18, w < 560 ? 0.7 : 0.82, COLORS.actual);
    const status = p < 0.18 ? '旧动作块正常执行' : p < 0.3 ? '碗平滑移动，新观测到达' : p < 0.55 ? '持续偏差累积，机械臂仍消费旧动作' : p < 0.64 ? '旧队列已截断，末端在中断点等待' : p < 0.79 ? 'OGG 只引导下一次动作生成' : p < 0.97 ? '新动作块平滑接管' : 'OGG 已关闭 · 普通 VLA 推理';
    drawText(ctx, status, 18, 25, armColor, w < 600 ? 11 : 14);
  }, [bowlOffset, progress], { mobileHeight: 320, desktopRatio: 0.31, minDesktopHeight: 330, maxDesktopHeight: 370 });

  const moveBowl = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = canvasPoint(event.currentTarget, event); const logicalWidth = event.currentTarget.width / (window.devicePixelRatio || 1);
    setBowlOffset(Math.max(-0.22, Math.min(0.08, point.x / logicalWidth - 0.78)));
  };

  return (
    <div className="v2-widget recovery-mission smooth-mission">
      <div className="mission-callout"><b>完整过程：</b>拖动碗决定新位置，再开始播放。机械臂会在中断点停住，经一次 OGG 转入新路径，最后恢复深绿色所表示的普通推理。</div>
      <JourneySteps active={phase} reached={phase} compact />
      <div className="mission-stage-wrap"><canvas ref={ref} className="v2-canvas draggable-canvas" aria-label="可拖动目标碗的完整机械臂恢复任务" tabIndex={0} onPointerDown={(event) => { setDragging(true); event.currentTarget.setPointerCapture(event.pointerId); moveBowl(event); }} onPointerMove={(event) => { if (dragging) moveBowl(event); }} onPointerUp={(event) => { setDragging(false); event.currentTarget.releasePointerCapture(event.pointerId); }} onPointerCancel={() => setDragging(false)} onKeyDown={(event) => { if (event.key === 'ArrowLeft') { event.preventDefault(); setBowlOffset((value) => Math.max(-0.22, value - 0.02)); } if (event.key === 'ArrowRight') { event.preventDefault(); setBowlOffset((value) => Math.min(0.08, value + 0.02)); } }} /><span className={`mission-status ${MISSION_PHASES[phase].tone}`}>{MISSION_PHASES[phase].label}</span></div>
      <div className="transport-row"><button type="button" className="tiny primary" onClick={() => { if (progress >= 100) setProgress(0); setRunning((value) => !value); }}>{running ? '暂停' : progress >= 100 ? '重新播放' : '播放'}</button><button type="button" className="tiny" disabled={progress >= 100} onClick={() => { setRunning(false); setProgress((value) => Math.min(100, value + 7)); }}>单步</button><button type="button" className="tiny" onClick={() => { setRunning(false); setProgress(0); setBowlOffset(-0.12); }}>重置</button><label><span>任务时间</span><input type="range" min="0" max="100" value={progress} onChange={(event) => { setProgress(Number(event.target.value)); setRunning(false); }} /></label></div>
      <Feedback tone={phase >= 6 ? 'good' : phase >= 4 ? 'warn' : phase >= 2 ? 'bad' : 'aux'}>{phase === 0 ? '正常时，Corrector/LVM 只监控，机器人继续消费当前动作块。' : phase === 1 ? '真实画面先到达；这一步还只是“看见碗移动”，没有立刻改动作。' : phase <= 3 ? '偏差持续成立，计数达到触发条件前不会中断。' : phase === 4 ? '未执行的旧动作已经被丢弃，末端在中断点保持连续。' : phase === 5 ? '仅下一次 VLA 调用开启 OGG，绿色新路径开始接管。' : '恢复动作块生成完毕后 OGG 关闭，系统回到普通 VLA 推理。'}</Feedback>
    </div>
  );
}

type ObservationMode = 'normal' | 'drift';
const NORMAL_ROUTE = ['execute', 'observe', 'compare', 'continue'];
const DRIFT_ROUTE = ['execute', 'observe', 'compare', 'count', 'truncate', 'ogg', 'off', 'execute'];
const NODE_COPY: Record<string, [string, string]> = {
  execute: ['执行队首动作', '深绿色正常循环'], observe: ['读取真实观测', '相机每步更新'], compare: ['LVM 比较残差', '计算 Eₜ'],
  continue: ['未持续异常', '继续当前队列'], count: ['连续异常成立', 'cₜ 达到 p'], truncate: ['截断旧队列', '丢弃未执行 token'],
  ogg: ['下一次 VLA + OGG', '只引导这一调用'], off: ['关闭 OGG', '回到普通推理'],
};

export function SystemPath(_: WidgetProps) {
  const [mode, setMode] = useRememberedState<ObservationMode>('system-mode-v4', 'normal');
  const [cursor, setCursor] = useRememberedState('system-cursor-v4', 0);
  const [playing, setPlaying] = useState(false);
  const route = mode === 'normal' ? NORMAL_ROUTE : DRIFT_ROUTE;
  const active = route[cursor % route.length];
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (cursor >= route.length - 1) { setPlaying(false); return; }
      setCursor((value) => Math.min(route.length - 1, value + 1));
    }, 820);
    return () => window.clearTimeout(timer);
  }, [cursor, playing, route.length, setCursor]);
  const switchMode = (next: ObservationMode) => { setPlaying(false); setMode(next); setCursor(0); };

  return (
    <div className="v2-widget system-path state-machine-lab">
      <div className="loss-toolbar"><div><b>给系统一段观测</b><p>比较正常观测与持续偏差会经过哪些节点。</p></div><div className="preset-row"><ChipButton selected={mode === 'normal'} onClick={() => switchMode('normal')}>观测正常</ChipButton><ChipButton selected={mode === 'drift'} onClick={() => switchMode('drift')}>持续偏差</ChipButton></div></div>
      <div className={`state-machine-map ${mode}`} aria-label="VLA-Corrector正常循环与异常恢复状态机">
        <div className="normal-loop">
          {['execute','observe','compare','continue'].map((id, index) => <React.Fragment key={id}><div className={`machine-node ${active === id ? 'active' : ''} ${route.indexOf(id) < cursor ? 'done' : ''}`}><small>{NODE_COPY[id][1]}</small><b>{NODE_COPY[id][0]}</b></div>{index < 3 && <span className="machine-arrow">→</span>}</React.Fragment>)}
        </div>
        <div className={`anomaly-branch-arrow ${mode === 'drift' && cursor >= 3 ? 'visible active' : ''}`} aria-hidden="true"><span>偏差持续成立，进入异常分支</span><b>↓</b></div>
        <div className={`recovery-route ${mode === 'drift' ? 'visible' : ''}`}>
          {['count','truncate','ogg','off'].map((id, index) => <React.Fragment key={id}><div className={`machine-node ${active === id ? 'active' : ''} ${route.indexOf(id) >= 0 && route.indexOf(id) < cursor ? 'done' : ''}`}><small>{NODE_COPY[id][1]}</small><b>{NODE_COPY[id][0]}</b></div>{index < 3 && <span className="machine-arrow">→</span>}</React.Fragment>)}
        </div>
        <div className="route-explanation"><span className="moving-token" /><b>现在：{NODE_COPY[active][0]}</b><p>{mode === 'normal' ? '正常观测不会经过 OGG；比较后直接继续当前队列。' : cursor < 3 ? '前半段与正常循环相同，区别来自“偏差是否持续”。' : cursor < 6 ? '异常分支先截断，再只为下一次 VLA 调用开启 OGG。' : 'OGG 关闭，路线重新并入普通执行循环。'}</p></div>
      </div>
      <div className="mission-controls"><button type="button" className="tiny primary" onClick={() => { if (cursor >= route.length - 1) setCursor(0); setPlaying((value) => !value); }}>{playing ? '暂停' : cursor >= route.length - 1 ? '重放这条路线' : '自动走一遍'}</button><button type="button" className="tiny" disabled={cursor >= route.length - 1} onClick={() => { setPlaying(false); setCursor((value) => Math.min(route.length - 1, value + 1)); }}>推进一步</button><button type="button" className="tiny" onClick={() => { setPlaying(false); setCursor(0); }}>回到起点</button></div>
      <Feedback tone={mode === 'normal' ? 'neutral' : cursor >= 6 ? 'good' : cursor >= 3 ? 'warn' : 'aux'}>{mode === 'normal' ? '这条短路线说明 OGG 不是常驻模块：没有持续异常，它根本不会被调用。' : '异常恢复是一条条件分支，不是把所有模块永久串联；完成一次 OGG 后必须重新并回正常循环。'}</Feedback>
    </div>
  );
}
