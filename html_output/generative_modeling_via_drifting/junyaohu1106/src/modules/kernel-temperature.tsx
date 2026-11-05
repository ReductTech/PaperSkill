import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';
import { Dancer, Feedback, Slider, StageEllipse, StageFloor, TapeMark, useDrag, INK } from './danceKit';
import { clamp, meanShift, Pt } from './driftCore';

const W = 1472;
const H = 372;
const FLOOR = 318;
const XS = [120, 240, 380, 540, 720, 900];
const MARKS: Pt[] = XS.map(x => [x, FLOOR]);

export function KernelTemperature(_: WidgetProps) {
  const [hero, setHero] = useState(300);
  const [tau, setTau] = useState(100);
  const place = (p: Pt) => setHero(clamp(p[0], 70, W - 70));
  const drag = useDrag(place);
  const { weights, raw } = meanShift([hero, FLOOR], MARKS, tau);
  const top = Math.max(...weights);
  const rawTop = Math.max(...raw);
  const state = rawTop < 0.02 ? 'far' : top > 0.72 ? 'narrow' : top < 0.32 ? 'flat' : 'fine';
  return <div className="ppt-layout dk-col">
    <div className="dk-stage" style={{ height: H }}>
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={`舞者位于 ${hero}，温度 ${tau}，最大归一化权重 ${top.toFixed(2)}，最大原始核值 ${rawTop.toFixed(2)}`}>
        <StageFloor w={W} h={H} curtains={false} />
        <StageEllipse cx={hero} cy={FLOOR + 6} rx={tau} ry={22} w={W} h={H} fill="#fff1b8" fillOpacity={0.8} stroke="#d9b64f" strokeDasharray="8 7" strokeWidth={2} />
        <line x1={0} x2={W} y1={FLOOR} y2={FLOOR} stroke="#b9a98c" strokeWidth={3} />
        {MARKS.map((m, i) => <g key={i}>
          <rect x={m[0] - 34} y={FLOOR - 16 - raw[i] * 210} width={30} height={raw[i] * 210} fill="#a9b5c6" rx={4} />
          <rect x={m[0] + 4} y={FLOOR - 16 - weights[i] * 210} width={30} height={weights[i] * 210} fill={INK.mark} rx={4} />
          <text x={m[0]} y={FLOOR - 26 - Math.max(weights[i], raw[i]) * 210} textAnchor="middle" fontSize={28} fontWeight={750} fill={INK.mark}>{weights[i].toFixed(2)}</text>
          <TapeMark at={m} size={11} />
        </g>)}
        <g className="dk-handle" role="slider" tabIndex={0} aria-valuenow={hero} aria-valuemin={70} aria-valuemax={W - 70} aria-label="舞者在舞台上的位置"
          onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); place([hero + (e.key === 'ArrowLeft' ? -24 : 24), FLOOR]); } }} {...drag}>
          <rect x={hero - 50} y={FLOOR - 92} width={100} height={138} fill="transparent" />
          <Dancer at={[hero, FLOOR + 34]} scale={1.9} color={INK.text} />
        </g>
      </svg>
    </div>
    <div className="dk-two dk-flex">
      <div className="dk-col">
        <div className="dk-formula">
          <SymbolHint meaning="k：核函数，把距离变成相似度。">k</SymbolHint>(x,y) = exp(−‖x−y‖ / <SymbolHint meaning="τ：温度，决定多远还算附近。论文实现中取 0.02、0.05、0.2 三个值一起使用（归一化距离下）。">τ</SymbolHint>)
        </div>
        <Slider label="视线范围 τ" value={tau} min={15} max={500} step={5} onChange={setTau} display={`${tau}`} />
        <div><span style={{ color: '#7e8ca0', fontWeight: 700 }}>灰柱 原始 k</span>　<span className="dk-blue" style={{ fontWeight: 700 }}>蓝柱 归一化 k̃ = k/Z</span>　拖动舞者</div>
      </div>
      <Feedback tone={state === 'fine' ? 'good' : state === 'far' ? 'bad' : 'mid'}>{{
        far: '离谁都很远：原始 k 全接近 0，核变得扁平。论文认为好的特征空间能减少这种情况。',
        narrow: 'τ 太小或离得太近：几乎只听最近一个标记，漂移方向受单个样本主导。',
        flat: 'τ 很大：权重接近平均，“附近”不再有意义，漂移趋向全体的均值方向。',
        fine: '权重随距离衰减：近处标记说话多，远处也有声音。论文同时用多个 τ 求和。',
      }[state]}</Feedback>
    </div>
  </div>;
}
