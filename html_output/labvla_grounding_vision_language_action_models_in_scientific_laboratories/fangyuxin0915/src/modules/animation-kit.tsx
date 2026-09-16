import React, { useEffect, useRef, useState } from 'react';
import { P, clamp, rect, line, dot, label, beaker } from './lab-scenes';

type G = CanvasRenderingContext2D;
export const mix = (a: number, b: number, t: number) => a + (b - a) * clamp(t);
export const ease = (t: number) => { const v = clamp(t); return v * v * (3 - 2 * v); };
export type Frame = { step: number; part: number; progress: number };

// One clock drives the drawing, step caption, and controls. Off-screen scenes pause.
export function Sequence({ steps, durations, compact = false, children }: {
  steps: string[]; durations?: number[]; compact?: boolean;
  children: (frame: Frame) => React.ReactNode;
}) {
  const lengths = steps.map((_, i) => durations?.[i] ?? 2400);
  const total = lengths.reduce((a, b) => a + b, 0);
  const [time, setTime] = useState(0);
  const [paused, setPaused] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [visible, setVisible] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(root.current!);
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => { if (media.matches) setPaused(true); };
    media.addEventListener('change', change);
    return () => { observer.disconnect(); media.removeEventListener('change', change); };
  }, []);
  useEffect(() => {
    if (paused || !visible) return;
    let id = 0, previous = performance.now();
    const tick = (now: number) => {
      const elapsed = Math.min(now - previous, 80);
      if (elapsed >= 30) {
        previous = now;
        if (!document.hidden) setTime(v => (v + elapsed) % total);
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [paused, visible, total]);
  let start = 0, step = 0;
  while (step < steps.length - 1 && time >= start + lengths[step]) start += lengths[step++];
  const part = clamp((time - start) / lengths[step]);
  const seek = (i: number) => { setPaused(true); setTime(lengths.slice(0, i).reduce((a, b) => a + b, 0) + lengths[i] * .55); };
  return <div className={'lab-sequence' + (compact ? ' compact' : '')} ref={root}>
    {children({ step, part, progress: time / total })}
    <div className="lab-motion-caption" aria-live={paused ? 'polite' : 'off'}>{steps[step]}</div>
    {!compact && <div className="lab-motion-steps">{steps.map((text, i) =>
      <button key={text} type="button" aria-pressed={step === i} className={step === i ? 'current' : ''} onClick={() => seek(i)}>{text}</button>
    )}</div>}
    <div className="lab-playback">
      <button type="button" onClick={() => setPaused(v => !v)}>{paused ? '播放动画' : '暂停动画'}</button>
      <input type="range" min="0" max={total - 1} step="1" value={time} aria-label="动画进度" onChange={e => { setPaused(true); setTime(Number(e.target.value)); }} />
      <button type="button" onClick={() => { setTime(0); setPaused(true); }}>回到开头</button>
    </div>
  </div>;
}

// Mirrored elbow solutions keep the two arms outside the torso and share one base.
export function robot(c: G, bx: number, by: number, tx: number, ty: number, options: {
  scale?: number; color?: string; bend?: number; base?: boolean; open?: number;
  angle?: number; gripScale?: number; shoulder?: boolean; reach?: number; point?: boolean;
} = {}) {
  const { scale = 1, color = P.blue, bend = tx >= bx ? -1 : 1, base = true,
    open = 0, angle = 0, gripScale = .8, shoulder = false } = options;
  const sy = shoulder ? by : by - 25 * scale;
  const l1 = 130 * (options.reach ?? scale), l2 = 121 * (options.reach ?? scale);
  const dx = tx - bx, dy = ty - sy, distance = Math.min(Math.hypot(dx, dy), l1 + l2 - .1);
  const heading = Math.atan2(dy, dx);
  const a = heading + bend * Math.acos(clamp((l1 * l1 + distance * distance - l2 * l2) / (2 * l1 * Math.max(distance, 1)), -1, 1));
  const ex = bx + l1 * Math.cos(a), ey = sy + l1 * Math.sin(a);
  const wx = bx + distance * Math.cos(heading), wy = sy + distance * Math.sin(heading);
  if (base) rect(c, bx - 40 * scale, by - 7, 80 * scale, 18, '#d2dce4', color, 5);
  [[bx, sy, ex, ey], [ex, ey, wx, wy]].forEach(([x, y, X, Y]) => {
    line(c, x, y, X, Y, color, 24 * scale);
    line(c, x, y, X, Y, '#e5edf2', 16 * scale);
    line(c, x - 2, y - 2, X - 2, Y - 2, '#fff', 4 * scale);
  });
  [[bx, sy], [ex, ey], [wx, wy]].forEach(([x, y]) => { dot(c, x, y, 14 * scale, color); dot(c, x, y, 8 * scale, '#e8eef2'); });
  c.save(); c.translate(wx, wy); c.rotate(angle); c.scale(gripScale, gripScale);
  const gap = 24 + 14 * open;
  line(c, 0, 0, 0, 15, color, 7);
  if (options.point) line(c, 0, 15, 0, 45, color, 7);
  else {
    line(c, -gap, 16, gap, 16, color, 5);
    line(c, -gap, 16, -gap, 57, color, 5);
    line(c, gap, 16, gap, 57, color, 5);
  }
  c.restore();
  return { x: wx, y: wy, elbow: { x: ex, y: ey } };
}

export function vesselAtGrip(c: G, x: number, y: number, amount = .6, angle = 0, size = .65, gripScale = .8) {
  c.save(); c.translate(x, y); c.rotate(angle);
  beaker(c, 0, 45 * gripScale, size, amount, P.blue);
  c.restore();
}

export function bench(c: G, x: number, y: number, w: number) {
  rect(c, x, y, w, 14, '#e0d5c3', '#aa977b', 4);
  rect(c, x + 16, y + 15, 12, 30, '#d2dce4', P.line, 2);
  rect(c, x + w - 28, y + 15, 12, 30, '#d2dce4', P.line, 2);
}

export function hotplate(c: G, x: number, y: number, on = false) {
  rect(c, x - 48, y, 96, 36, '#ecf0f2', P.blue, 6);
  rect(c, x - 42, y - 6, 84, 9, on ? '#f4cbaa' : '#b8c7ce', on ? P.orange : P.muted, 3);
  // A side control keeps the pressing motion clear of the vessel on the hotplate.
  rect(c, x + 54, y - 63, 43, 51, '#e6edf1', P.blue, 5);
  dot(c, x + 75, y - 35, 7, on ? P.green : P.muted);
  line(c, x + 48, y + 24, x + 75, y + 24, P.muted, 2);
  line(c, x + 75, y + 24, x + 75, y - 12, P.muted, 2);
  rect(c, x - 26, y + 14, 29, 14, on ? '#fff4e8' : '#d9e3e8', P.line, 2);
}

export const protocolSteps = ['抓取源烧杯', '转移液体', '放上加热台', '按下加热键'];
export function protocolStep(progress: number) { return Math.min(3, Math.floor(progress * 4)); }

// A complete fixed protocol. Object ownership changes only when the gripper closes/releases.
// Local scene space: 620 × 370. Progress is split into four user-visible steps.
export function protocol(c: G, progress: number, annotated = false) {
  const z = clamp(progress) * 4, stage = Math.min(3, Math.floor(z)), p = z - stage;
  const source = { x: 240, y: 296 }, target = { x: 420, y: 296 };
  const gs = .8, vesselSize = .65, offset = 45 * gs;
  let wx = 210, wy = 184, angle = 0, open = 1, held = '', poured = 0;
  let targetX = target.x, targetY = target.y;
  if (stage === 0) {
    const reach = ease(p / .45), lift = ease((p - .6) / .4);
    wx = mix(210, source.x, reach); wy = mix(184, source.y - offset, reach) - lift * 105;
    open = 1 - clamp((p - .45) / .15); if (p >= .6) held = 'source';
  } else if (stage === 1) {
    const travel = ease(p / .3), tilt = ease((p - .3) / .2);
    wx = mix(source.x, 382, travel); wy = mix(source.y - offset - 105, 150, travel);
    angle = tilt * .96; open = 0; held = 'source'; poured = clamp((p - .5) / .45);
  } else if (stage === 2) {
    poured = 1;
    if (p < .33) {
      const back = ease(p / .28); wx = mix(382, source.x, back); wy = mix(150, source.y - offset, back);
      angle = (1 - back) * .96; open = clamp((p - .28) / .05); if (p < .28) held = 'source';
    } else if (p < .58) {
      const move = ease((p - .33) / .25); wx = mix(source.x, target.x, move); wy = source.y - offset - Math.sin(move * Math.PI) * 100; open = 1 - clamp((p - .53) / .05);
    } else {
      const move = ease((p - .58) / .34); wx = mix(target.x, 510, move); wy = mix(target.y - offset, 264 - offset, move) - Math.sin(move * Math.PI) * 85;
      open = clamp((p - .92) / .08); if (p < .94) held = 'target'; else { targetX = 510; targetY = 264; }
    }
  } else {
    poured = 1; targetX = 510; targetY = 264;
    const lift = ease(p / .2), press = ease((p - .2) / .45), retract = ease((p - .8) / .2);
    wx = mix(510, 585, press) - retract * 80; wy = 228 - lift * 50 + press * 51 - retract * 90; open = 1;
  }
  bench(c, 10, 325, 580);
  hotplate(c, 510, 300, stage === 3 && p >= .65);
  if (held !== 'source') beaker(c, source.x, source.y, vesselSize, .7 - poured * .48);
  if (held !== 'target') beaker(c, targetX, targetY, vesselSize, .12 + poured * .48, P.green);
  const wrist = robot(c, 90, 314, wx, wy, { scale: 1.2, reach: 2.05, bend: -1, open, angle, gripScale: gs, point: stage === 3 && p > .35 });
  if (held) vesselAtGrip(c, wrist.x, wrist.y, held === 'source' ? .7 - poured * .48 : .12 + poured * .48, angle, vesselSize, gs);
  if (stage === 1 && p > .5 && p < .96) {
    const lx = 31 * vesselSize, ly = offset - 38 * vesselSize;
    const sx = wrist.x + lx * Math.cos(angle) - ly * Math.sin(angle);
    const sy = wrist.y + lx * Math.sin(angle) + ly * Math.cos(angle);
    c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(420, sy + 20, 420, 274);
    c.strokeStyle = P.green; c.lineWidth = 3; c.stroke();
    dot(c, 420, 269 + (p * 140 % 12), 3, P.green);
  }
  label(c, '源烧杯', source.x, 357, P.muted, 17);
  label(c, '接收烧杯', 410, 357, P.muted, 17);
  label(c, '加热台', 529, 357, P.muted, 17);
  if (annotated) {
    const trackTarget = held === 'target' || stage === 3 || (stage === 2 && p >= .33);
    const objectX = held ? wrist.x - Math.sin(angle) * offset : trackTarget ? targetX : source.x;
    const objectY = held ? wrist.y + Math.cos(angle) * offset : trackTarget ? targetY : source.y;
    c.setLineDash([5, 4]); c.strokeStyle = P.green; c.lineWidth = 2;
    c.strokeRect(objectX - 38, objectY - 43, 76, 83); c.setLineDash([]);
    label(c, trackTarget ? '接收容器' : '源容器', objectX, objectY - 57, P.green, 17);
    line(c, wrist.x - 8, wrist.y, wrist.x + 8, wrist.y, P.orange, 2);
    line(c, wrist.x, wrist.y - 8, wrist.x, wrist.y + 8, P.orange, 2);
  }
  return { stage, held, poured, wrist, requestedWrist: { x: wx, y: wy } };
}

export function pipette(c: G, x: number, y: number, fill: number) {
  rect(c, x - 11, y - 18, 22, 64, '#edf2f6', P.blue, 7);
  rect(c, x - 5, y - 31, 10, 14, '#a9bac9', P.blue, 2);
  rect(c, x - 17, y - 36, 34, 6, '#cfdae4', P.blue, 3);
  rect(c, x - 5, y + 8, 10, 30, '#fff', P.line, 2);
  c.fillStyle = P.green + '99'; c.fillRect(x - 3, y + 36 - fill * 25, 6, fill * 25);
  line(c, x, y + 47, x, y + 94, P.blue, 6);
  line(c, x, y + 94, x, y + 111, '#a4bac4', 3);
}

export function sampleTube(c: G, x: number, y: number, amount: number, size = .69) {
  c.save(); c.translate(x, y); c.scale(size, size);
  c.beginPath(); c.moveTo(-15, -50); c.lineTo(-15, 32); c.quadraticCurveTo(-15, 53, 0, 54); c.quadraticCurveTo(15, 53, 15, 32); c.lineTo(15, -50);
  c.fillStyle = '#fff'; c.fill(); c.strokeStyle = P.blue; c.lineWidth = 2; c.stroke();
  c.save(); c.clip(); c.fillStyle = P.green + '55'; c.fillRect(-13, 50 - amount * 85, 26, amount * 85 + 4); c.restore();
  rect(c, -19, -55, 38, 8, '#e5edf2', P.blue, 2); c.restore();
}

export function actionPose(c: G, x: number, y: number, error: number, color = P.blue, size = 1, ghost = false) {
  c.save(); c.translate(x + error * 18, y - error * 12); c.rotate(error * .55); c.scale(size, size);
  if (ghost) c.setLineDash([4, 4]);
  line(c, -22, -20, 22, -20, color, 5); line(c, -22, -20, -22, 25, color, 5); line(c, 22, -20, 22, 25, color, 5);
  line(c, -22, 25, -12, 25, color, 4); line(c, 22, 25, 12, 25, color, 4);
  c.restore();
}
