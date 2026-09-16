import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  ChipButton,
  COLORS,
  Feedback,
  clearScene,
  drawBowl,
  drawObject,
  drawRobotArm,
  drawWorkbench,
  useRememberedState,
  useResponsiveCanvas,
  drawPath,
} from './shared';

export function ChunkBuilder(_: WidgetProps) {
  const [chunkLength, setChunkLength] = useRememberedState('chunk-builder-c-v7', 8);
  const [horizon, setHorizon] = useRememberedState('chunk-builder-h-v7', 4);
  const [progress, setProgress] = useRememberedState('chunk-builder-progress-v6', 0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running || progress >= 1) return;
    let raf = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      setProgress((value) => Math.min(1, value + (now - previous) / 2100));
      previous = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress, running, setProgress]);

  useEffect(() => { if (progress >= 1) setRunning(false); }, [progress]);
  const animatedStep = progress * horizon;
  const executesWholeChunk = horizon === chunkLength;
  const ref = useResponsiveCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    drawWorkbench(ctx, w, h);
    const tableY = h * 0.78;
    const startX = w * 0.28;
    const endX = w * 0.78;
    drawBowl(ctx, endX, tableY - 5, w < 560 ? 0.7 : 0.86, COLORS.recovery);
    const route = Array.from({ length: chunkLength + 1 }, (_, i) => {
      const ratio = i / chunkLength;
      return { x: startX + (endX - startX) * ratio, y: tableY - 78 + 45 * ratio - Math.sin(ratio * Math.PI) * 18 };
    });
    drawPath(ctx, route, COLORS.pending, 2, true, 0.62);
    drawPath(ctx, route.slice(0, horizon + 1), COLORS.normal, 4, false, 0.9);
    const ratio = Math.max(0, Math.min(1, animatedStep / chunkLength));
    const x = startX + (endX - startX) * ratio;
    const y = tableY - 78 + 45 * ratio - Math.sin(ratio * Math.PI) * 18;
    drawRobotArm(ctx, w * 0.1, tableY, x, y, w < 560 ? 0.68 : 0.83, running || progress > 0 ? COLORS.normal : COLORS.actual);
    drawObject(ctx, x, y + 17, 0.76, COLORS.actual);
  }, [animatedStep, chunkLength, horizon, running], { mobileHeight: 260, desktopRatio: 0.25, maxDesktopHeight: 286 });

  const chooseChunkLength = (next: number) => {
    setRunning(false);
    setChunkLength(next);
    setHorizon((value) => Math.min(value, next));
    setProgress(0);
  };

  return (
    <div className="v2-widget chunk-builder chunk-clarity">
      <div className="chunk-choice-toolbar">
        <div className="chunk-c-presets" role="group" aria-label="选择VLA一次生成的动作数C"><span>① VLA 生成多少步？</span><div>{[6, 8, 10].map((value) => <ChipButton key={value} selected={chunkLength === value} onClick={() => chooseChunkLength(value)}>C = {value}</ChipButton>)}</div></div>
        <label className="chunk-h-range" htmlFor="chunk-horizon"><span>② 这一轮执行到哪里？</span><output>H = {horizon}</output><input id="chunk-horizon" type="range" min="1" max={chunkLength} step="1" value={horizon} disabled={running} onChange={(event) => { setHorizon(Number(event.target.value)); setProgress(0); }} /></label>
      </div>
      <div className="chunk-token-board clickable" style={{ '--chunk-count': chunkLength } as React.CSSProperties} role="group" aria-label="点击动作token选择本轮执行边界H">
        {Array.from({ length: chunkLength }, (_, index) => {
          const executed = index < Math.floor(animatedStep);
          const prefix = index < horizon;
          return <button type="button" key={index} aria-pressed={horizon === index + 1} className={`${prefix ? 'prefix' : ''} ${executed ? 'executed' : ''} ${horizon === index + 1 ? 'boundary' : ''}`} disabled={running} onClick={() => { setHorizon(index + 1); setProgress(0); }}><i>a<sub>t+{index}</sub></i><small>{executed ? '已执行' : prefix ? index === horizon - 1 ? 'H 的边界' : '本轮执行' : '暂不执行'}</small></button>;
        })}
      </div>
      <div className="chunk-readable-equation" aria-label="C和H的直观关系">
        <span><b>C = {chunkLength}</b> 已生成的动作总数</span><span><b>H = {horizon}</b> 本轮执行的前缀长度</span><span><b>{chunkLength - horizon} 步</b> 暂不执行</span>
      </div>
      <div className={`chunk-constraint-note ${executesWholeChunk ? 'full' : 'prefix'}`}>
        <span className="chunk-constraint-equation"><i>H</i><b>≤</b><i>C</i></span>
        <div className="chunk-constraint-copy">
          <b>先生成 C 步，再从中执行前 H 步</b>
          <p><strong>C（动作块长度）</strong>是 VLA 这次已经算好的动作总数；<strong>H（动作时域）</strong>是控制器在再次规划前，准备连续执行的前缀长度。</p>
          <ol className="chunk-logic-steps">
            <li><span>1</span><p><b>VLA 先准备</b>生成 C={chunkLength} 个动作 token。</p></li>
            <li><span>2</span><p><b>控制器再取前缀</b>本轮只执行前 H={horizon} 个。</p></li>
            <li><span>3</span><p><b>不能越过 C</b>如果 H&gt;C，就会要求机械臂执行尚未生成的动作。</p></li>
          </ol>
          <p className="chunk-current-reading">{executesWholeChunk ? `当前 H=C=${chunkLength}：整个动作块都会执行，这就是 H 的上限。` : `当前 H=${horizon}<C=${chunkLength}：执行到第 ${horizon} 步就可以重新规划，后面 ${chunkLength - horizon} 个动作只是候选后缀，不是非执行不可。`}</p>
        </div>
      </div>
      <canvas ref={ref} className="v2-canvas" aria-label="机械臂只沿动作块的前H步连续执行" />
      <div className="chunk-run-row">
        <button type="button" className="tiny primary" onClick={() => { if (progress >= 1) setProgress(0); setRunning((value) => !value); }}>{running ? '暂停' : progress > 0 && progress < 1 ? '继续执行' : '执行本轮 H 步'}</button>
        <button type="button" className="tiny" disabled={progress === 0} onClick={() => { setRunning(false); setProgress(0); }}>回到起点</button>
        <p><b>相机仍逐步送来新画面，</b>但固定方案会等这 {horizon} 步执行完，才再次调用 VLA。</p>
      </div>
      <Feedback tone={horizon / chunkLength >= .8 ? 'warn' : 'neutral'}>{progress >= 1 ? `本轮已经执行 H=${horizon} 步。VLA 虽然生成了 C=${chunkLength} 步，但剩余 ${chunkLength - horizon} 个 token 没有进入这次执行前缀。` : executesWholeChunk ? `当前 H=C=${chunkLength}：控制器会执行整块动作，这也是 H 能取到的最大值。` : `当前从 C=${chunkLength} 个已生成动作中取前 H=${horizon} 个执行，因此自然满足 H≤C。`}</Feedback>
    </div>
  );
}

type Role = 'vision' | 'policy' | 'queue';
const ROLE_INFO: Record<Role, { title: string; input: string; output: string; body: string; tone: 'aux' | 'neutral' | 'warn' }> = {
  vision: { title: '相机与视觉编码器', input: '输入：当前图像 oₜ', output: '输出：视觉特征 Zₜʳᵉᵃˡ', body: '机械臂的 RGB 相机持续提供新观测，视觉编码器把画面变成特征；它们不会自己决定动作。', tone: 'aux' },
  policy: { title: 'VLA（视觉—语言—动作模型）', input: '输入：视觉特征 + 语言指令', output: '输出：C 步动作块 Aₜ', body: 'VLA 是机械臂的主策略：它把当前画面和任务指令转成一串连续控制动作。论文中说的“调用 VLA”，就是让它重新看当前画面并生成新动作块。', tone: 'neutral' },
  queue: { title: '控制器与执行队列', input: '输入：动作块前缀', output: '输出：连续执行 H 步', body: '控制器消费前 H 个动作。相机仍在更新，但固定方案要等队列结束才把新观测交给下一次 VLA 调用。', tone: 'warn' },
};

export function VlaroleMap(_: WidgetProps) {
  const [role, setRole] = useRememberedState<Role>('vla-role-map', 'policy');
  const info = ROLE_INFO[role];
  return (
    <div className="v2-widget role-map">
      <div className="choice-question">VLA 系统可以拆成三个角色。依次点开，查看谁负责观测、谁生成动作、谁执行队列。</div>
      <div className="role-flow" role="group" aria-label="VLA三个核心角色">
        <ChipButton selected={role === 'vision'} onClick={() => setRole('vision')}><span className="role-icon purple">01</span><b>看见环境</b><small>相机 / 编码器</small></ChipButton>
        <i className={`role-link ${role === 'vision' || role === 'policy' ? 'active' : ''}`} aria-hidden="true">→</i>
        <ChipButton selected={role === 'policy'} onClick={() => setRole('policy')}><span className="role-icon blue">02</span><b>生成动作</b><small>VLA 策略</small></ChipButton>
        <i className={`role-link ${role === 'policy' || role === 'queue' ? 'active' : ''}`} aria-hidden="true">→</i>
        <ChipButton selected={role === 'queue'} onClick={() => setRole('queue')}><span className="role-icon orange">03</span><b>执行前缀</b><small>控制器 / Q</small></ChipButton>
      </div>
      <div className="role-detail" aria-live="polite"><h3>{info.title}</h3><div><span>{info.input}</span><span>{info.output}</span></div><p>{info.body}</p></div>
      <Feedback tone={info.tone}>{role === 'vision' ? '相机可以持续接收画面，但这不等于 VLA 会在每一步重新规划。' : role === 'policy' ? 'VLA 负责生成动作；LVM 只负责监控，不会替代 VLA。' : 'C 决定动作块的总长度，H 决定这一轮执行其中多少步。持续偏差可以让执行提前结束。'}</Feedback>
    </div>
  );
}
