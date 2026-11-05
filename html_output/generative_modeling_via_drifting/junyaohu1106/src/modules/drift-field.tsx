import React, { useMemo, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';
import { Arrow, Dancer, Feedback, Slider, StageEllipse, StageFloor, TapeMark, keyMove, useDrag, INK } from './danceKit';
import { clamp, cluster, dist, driftAt, norm, Pt } from './driftCore';

const W = 906;
const H = 620;

export function DriftField(_: WidgetProps) {
  const marks = useMemo(() => [...cluster(51, 12, 240, 170, 46), ...cluster(52, 12, 690, 440, 46)], []);
  const dancers = useMemo(() => cluster(53, 18, 300, 440, 62), []);
  const [x, setX] = useState<Pt>([470, 300]);
  const [tau, setTau] = useState(110);
  const place = (p: Pt) => setX([clamp(p[0], 60, W - 60), clamp(p[1], 60, H - 30)]);
  const drag = useDrag(place);
  const { plus, minus, V } = driftAt(x, marks, dancers, tau);
  const strength = norm(V);
  const weightOpacity = (w: number, n: number) => clamp(0.25 + w * n * 0.5, 0.25, 1);
  // Normalized mean-shift vectors do not say which side wins: each one shrinks inside its own group.
  // Name the situation from where x actually stands.
  const nearMark = Math.min(...marks.map(m => dist(x, m)));
  const nearDancer = Math.min(...dancers.map(d => dist(x, d)));
  const among = nearDancer < 70 && nearMark > 120 ? 'dancers' : nearMark < 70 && nearDancer > 120 ? 'marks' : 'between';
  const tone = strength < 40 ? 'mid' : among === 'between' ? 'mid' : 'good';
  return <div className="dk-split">
    <div className="dk-stage">
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={`舞者 x 受标记吸引 ${norm(plus.v).toFixed(0)}，受同伴排斥 ${norm(minus.v).toFixed(0)}，净漂移 ${strength.toFixed(0)}`}>
        <StageFloor w={W} h={H} />
        <StageEllipse cx={x[0]} cy={x[1]} rx={tau} ry={tau} w={W} h={H} fill="#fff7d6" fillOpacity={0.55} stroke="#d9b64f" strokeDasharray="8 7" strokeWidth={2} />
        {marks.map((m, i) => <TapeMark key={i} at={m} size={6 + plus.weights[i] * 22} opacity={weightOpacity(plus.weights[i], marks.length)} />)}
        {dancers.map((d, i) => <Dancer key={i} at={d} opacity={weightOpacity(minus.weights[i], dancers.length)} scale={0.95 + minus.weights[i] * 2} />)}
        <Arrow from={x} vec={plus.v} color={INK.mark} label="V⁺" box={[W, H]} />
        <Arrow from={x} vec={[-minus.v[0], -minus.v[1]]} color="#c85d29" label="−V⁻" box={[W, H]} />
        <Arrow from={x} vec={V} color={INK.net} width={10} label="V" box={[W, H]} />
        <g className="dk-handle" role="button" tabIndex={0} aria-label="拖动舞者 x，方向键也可以移动" onKeyDown={keyMove(x, place, W, H)} {...drag}>
          <circle cx={x[0]} cy={x[1] - 16} r={42} fill="#ffffff" fillOpacity={0.5} className="dk-ring" stroke={INK.text} strokeWidth={2} strokeDasharray="5 5" />
          <Dancer at={[x[0], x[1] + 10]} scale={1.5} color={INK.text} />
        </g>
      </svg>
      <div className="dk-hint">拖动深色舞者 x，看三支箭如何变化</div>
    </div>
    <div className="dk-panel">
      <div className="dk-formula">
        <SymbolHint meaning="V：漂移场，给出样本 x 这一轮应走的位移。">V</SymbolHint><sub>p,q</sub>(x) = <SymbolHint meaning="V⁺：数据样本 y⁺ 相对 x 的核加权平均位移，方向指向附近的数据（吸引）。">V⁺<sub>p</sub></SymbolHint>(x) − <SymbolHint meaning="V⁻：生成样本 y⁻ 相对 x 的核加权平均位移；减去它就是远离附近的生成样本（排斥）。">V⁻<sub>q</sub></SymbolHint>(x)
      </div>
      <div className="dk-formula">
        <SymbolHint meaning="V⁺：吸引项。">V⁺<sub>p</sub></SymbolHint> = <SymbolHint meaning="Z_p：归一化因子，等于 E_p[k(x,y⁺)]。">Z<sub>p</sub></SymbolHint><sup>−1</sup> E<sub>p</sub>[<SymbolHint meaning="k：核函数，衡量 x 与 y⁺ 的相似度。">k</SymbolHint>(x,y⁺)(y⁺−x)]
      </div>
      <div className="dk-row dk-blue"><span>被标记吸引 ‖V⁺‖</span><b>{norm(plus.v).toFixed(0)}</b></div>
      <div className="dk-row dk-orange"><span>被同伴排斥 ‖V⁻‖</span><b>{norm(minus.v).toFixed(0)}</b></div>
      <div className="dk-row dk-green"><span>净漂移 ‖V‖</span><b className="dk-big">{strength.toFixed(0)}</b></div>
      <Slider label="视线范围 τ（温度）" value={tau} min={25} max={320} step={5} onChange={setTau} display={`${tau}`} />
      <Feedback tone={tone}>{strength < 40
        ? '两股力大致抵消：这里的标记和同伴一样密。'
        : among === 'dancers' ? '站在同伴中间：V⁻ 很短，净漂移主要是 V⁺，把 x 拉向附近的标记。'
          : among === 'marks' ? '站在标记中间：V⁺ 很短，净漂移主要是 −V⁻，把 x 推离同伴。'
            : 'V⁺ 指向附近的标记，−V⁻ 背离附近的同伴，净漂移是两者之和。'}</Feedback>
    </div>
  </div>;
}
