import React, { useMemo } from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import type { WidgetProps } from './registry';
import { Dancer, StageFloor, TapeMark } from './danceKit';
import { clamp, cluster, Pt } from './driftCore';

const W = 664;
const H = 388;

export function CoverIteration({ moduleId }: WidgetProps) {
  const { progress } = useCoverPlayback();
  const isNew = moduleId === 'newMethod';
  const marks = useMemo(() => [...cluster(21, 7, 190, 225, 24), ...cluster(22, 7, 470, 225, 24)], []);
  const start = useMemo(() => cluster(23, 14, W / 2, 225, 80, 70), []);
  const lerp = (t: number) => start.map((s, i) => [s[0] + (marks[i][0] - s[0]) * t, s[1] + (marks[i][1] - s[1]) * t] as Pt);
  let pts: Pt[];
  let tag: string;
  let status: string;
  let good = false;
  if (!isNew) {
    const showing = progress >= 0.2;
    const calls = clamp(Math.floor(((progress - 0.2) / 0.68) * 12), 0, 12);
    pts = lerp(showing ? calls / 12 : 0);
    tag = showing ? '演出（推理）' : '排练（训练）';
    status = !showing ? '学习每一步怎么走' : calls < 12 ? `一步步走位：已调用网络 ${calls} 次` : '多次调用网络后才到位';
  } else if (progress < 0.66) {
    pts = lerp(clamp(progress / 0.62, 0, 1));
    tag = '排练（训练）';
    status = `漂移修正走位：第 ${Math.floor(progress * 1500)} 轮`;
  } else {
    const jumped = progress >= 0.76;
    pts = lerp(jumped ? 1 : 0);
    tag = '演出（推理）';
    status = jumped ? '只调用网络 1 次，一步到位' : '大幕拉开，准备一步到位';
    good = jumped;
  }
  return <div className="dk-cover" role="img" aria-label={isNew ? '排练时逐步修正走位，演出时调用一次网络就到位' : '排练后，演出时仍需多次调用网络逐步走位'}>
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
      <StageFloor w={W} h={H} />
      {marks.map((m, i) => <TapeMark key={i} at={m} size={7} />)}
      {pts.map((p, i) => <Dancer key={i} at={p} scale={1.05} />)}
    </svg>
    <div className="dk-cover-tag">{tag}</div>
    <div className={`dk-cover-status ${good ? 'is-good' : ''}`}>{status}</div>
  </div>;
}
