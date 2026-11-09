import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import type { WidgetProps } from './registry';
import { Console, Bar, C, FONT, T, fmt } from './ewcKit';
import { A_ANCHOR, F_A, TASK_B, PEN_A, trainSgd, trainPenalised, lerpVec, ease, lossA, lossTask } from './ewcMath';

// Both cover panels use the same console, the same song B target and the same clock.
// Left (old method): plain SGD moves every fader along the gradient. Right: EWC lets the
// stiff springs hold important faders and moves the unimportant ones (Eq. 3, λ = 1).
const OLD_FINAL = trainSgd(TASK_B, A_ANCHOR);
const NEW_FINAL = trainPenalised(TASK_B, [PEN_A], 1);

export function EwcCover({ moduleId }: WidgetProps) {
  const { progress, playing } = useCoverPlayback();
  const isNew = moduleId === 'newMethod';
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const p = reduced && !playing ? 1 : progress;
  const k = ease((p - 0.12) / 0.5);
  const theta = lerpVec(A_ANCHOR, isNew ? NEW_FINAL : OLD_FINAL, k);
  const la = lossA(theta);
  const lb = lossTask(TASK_B, theta);
  const done = p > 0.68;
  const message = !done ? '训练歌 B……' : isNew ? '歌 B 达标，歌 A 基本保住' : '歌 B 达标，歌 A 被覆盖';
  return <div className="ewc-cover">
    <svg viewBox="0 0 664 324" role="img"
      aria-label={isNew ? '带弹簧的推子：重要的低频与鼓点推子几乎不动，歌 A 基本保住' : '无保护训练：四个推子同时被推高，歌 A 的混音被覆盖'}>
      <rect x="2" y="2" width="660" height="320" rx="22" fill={C.bg} stroke="#d9e3cf" strokeWidth="2" />
      <Console theta={theta} anchors={A_ANCHOR} F={isNew ? F_A : undefined} left={66} top={28} h={176} gap={84} capW={46} />
      <g transform="translate(404 0)">
        <Bar x={0} y={62} w={230} h={26} value={la} max={0.6} color={la > 0.2 ? C.red : C.green} label={`歌 A 偏差 ${fmt(la)}`} />
        <Bar x={0} y={140} w={230} h={26} value={lb} max={1.3} color={C.blue} label={`歌 B 偏差 ${fmt(lb)}`} />
      </g>
      <text x="332" y="300" textAnchor="middle" fontSize={T.body} fontWeight="800" fontFamily={FONT}
        fill={!done ? C.muted : isNew ? C.green : C.red}>{message}</text>
    </svg>
  </div>;
}
