import React, { useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { Dancer, Feedback, StageFloor, TapeMark, useDrag, useFrame } from './danceKit';
import { clamp, cluster, dist, driftStep, Pt } from './driftCore';

const W = 800;
const H = 620;
const A: Pt = [220, 200];
const B: Pt = [580, 410];
const TAU = 110;
const OFFSETS = cluster(91, 24, 0, 0, 20);
const at = (c: Pt) => OFFSETS.map(o => [c[0] + o[0], c[1] + o[1]] as Pt);
const PRESETS: { label: string; c: Pt }[] = [{ label: '两团之间', c: [400, 305] }, { label: '远离两团', c: [660, 110] }, { label: '坍缩到一团', c: A }];

export function CollapseRepair(_: WidgetProps) {
  const marks = useMemo(() => [...cluster(92, 12, A[0], A[1], 34), ...cluster(93, 12, B[0], B[1], 34)], []);
  const [pts, setPts] = useState<Pt[]>(() => at(PRESETS[2].c));
  const [running, setRunning] = useState(false);
  const [rounds, setRounds] = useState(0);
  const dragging = useRef(false);
  const launch = (c: Pt) => { setPts(at(c)); setRounds(0); setRunning(true); };
  const drag = useDrag(p => {
    dragging.current = true;
    setRunning(false);
    setRounds(0);
    setPts(at([clamp(p[0], 70, W - 70), clamp(p[1], 80, H - 40)]));
  }, () => { dragging.current = false; setRunning(true); });
  useFrame(() => {
    setPts(prev => driftStep(prev, marks, TAU, 0.3, 1, 1, false));
    setRounds(r => {
      if (r >= 700) setRunning(false);
      return r + 1;
    });
  }, running);
  const nearA = pts.filter(p => dist(p, A) < dist(p, B)).length;
  const nearB = pts.length - nearA;
  const settled = Math.min(nearA, nearB) >= 8 && pts.every(p => Math.min(dist(p, A), dist(p, B)) < 110);
  const started = running || rounds > 0;
  return <div className="dk-split" style={{ gridTemplateColumns: '800px minmax(0,1fr)' }}>
    <div className="dk-stage" style={{ height: 620 }}>
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={`左上团 ${nearA} 人，右下团 ${nearB} 人，已排练 ${rounds} 轮`}>
        <StageFloor w={W} h={H} />
        <rect x={0} y={0} width={W} height={H} fill="transparent" className="dk-handle" {...drag} />
        <g pointerEvents="none">
          {marks.map((m, i) => <TapeMark key={i} at={m} />)}
          {pts.map((p, i) => <Dancer key={i} at={p} scale={1.1} />)}
        </g>
      </svg>
      <div className="dk-hint">在台上按住拖动，把全队放到任意位置再松手</div>
    </div>
    <div className="dk-panel">
      <div style={{ display: 'flex', gap: 8 }}>
        {PRESETS.map(p => <button key={p.label} type="button" className="dk-btn" style={{ padding: '6px 9px' }} onClick={() => launch(p.c)}>{p.label}</button>)}
      </div>
      <figure className="dk-figure">
        <img src="./images/fig3-dynamics.png" alt="论文图 3：三种初始化下分布 q（橙）向双峰目标 p（蓝）演化" />
      </figure>
      <div className="dk-row"><span>图 3（Deng et al., CC BY 4.0）</span><b>{nearA} : {nearB} 人</b></div>
      <Feedback tone={settled ? 'good' : started ? 'mid' : 'bad'}>{settled
        ? '两团都有人站：另一团标记把队伍拉开了。'
        : started ? `排练第 ${rounds} 轮：同伴排斥把队伍推开，远处标记继续吸引。` : '全队挤在一团：这就是模式坍缩的起点。'}</Feedback>
    </div>
  </div>;
}
