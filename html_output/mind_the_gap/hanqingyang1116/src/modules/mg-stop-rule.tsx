import React, { useState } from 'react';
import { C, Fader, Meter, PageFrame } from './studioKit';
import './studio.css';

// neg 轨迹与 p3 一致，取 Fig.3(a) ImageNet-R 读数：0.165 → 0.108（epoch 2 后开始下降）
const NEG0 = 0.165;
const NEG1 = 0.108;
const negAt = (e: number) => (e <= 2 ? NEG0 - 0.0025 * e : 0.16 - ((0.16 - NEG1) * (e - 2)) / 8);
const deltaAt = (e: number) => (NEG0 - negAt(e)) / NEG0;

/** p4：Δ 越过 α 就停手；α 由学员调，停手轮次按 Eq.(3) 与 Fig.3 的 neg 轨迹演示。 */
export function MgStopRule() {
  const [alpha, setAlpha] = useState(10);
  const a = alpha / 100;
  const stopE = (() => {
    let e = 0;
    for (let i = 1; i <= 10; i += 1) if (deltaAt(i) < a) e = i;
    return e;
  })();
  const trained = Math.max(stopE, 1);
  const tone = stopE <= 2 ? 'warn' : stopE <= 5 ? 'ok' : 'bad';
  const feedback =
    stopE <= 2
      ? '停得太早：正样本还没抬起来，新知识没学完。'
      : stopE <= 5
      ? '停手点紧跟转折点：正样本已转平，负样本还没被推远。'
      : '停得太晚：负样本已经一路下滑，间隙扩大了。';

  // 画布 900×560；卡片 130..770 × 100..360；绘图区 150..750 × 150..330
  const L = 150;
  const R = 750;
  const T = 150;
  const B = 330;
  const px = (e: number) => L + (e / 10) * (R - L);
  const py = (v: number) => B - (v / 0.35) * (B - T);
  const curve = Array.from({ length: 11 }, (_, e) => `${e === 0 ? 'M' : 'L'}${px(e).toFixed(1)} ${py(deltaAt(e)).toFixed(1)}`).join(' ');

  return (
    <PageFrame
      scene={
        <svg viewBox="0 0 900 560" role="img" aria-label={`α 为 ${alpha}% 时，第 ${trained} 轮停手`}>
          <rect x="0" y="0" width="900" height="560" fill={C.bg} />
          <rect x={130} y={100} width={640} height={260} rx={12} fill="#fbfcf9" stroke={C.line} strokeWidth={2} />
          <text x={152} y={130} fontSize={18} fill={C.muted}>Δ = |negᵉ − neg⁰| / neg⁰（Eq.3）</text>

          {[0, 0.1, 0.2, 0.3].map((v) => (
            <g key={v}>
              <path d={`M${L} ${py(v).toFixed(1)} H${R}`} stroke={C.line} strokeWidth={1} opacity={0.85} />
              <text x={L - 8} y={py(v) + 5} textAnchor="end" fontSize={15} fill={C.muted}>{Math.round(v * 100)}%</text>
            </g>
          ))}
          <path d={`M${L} ${B} H${R} M${L} ${B} V${T}`} stroke={C.muted} strokeWidth={2} />

          <path d={curve} fill="none" stroke={C.blue} strokeWidth={3.5} />
          <path d={`M${L} ${py(a).toFixed(1)} H${R}`} stroke={C.orange} strokeWidth={3} strokeDasharray="10 6" />
          <text x={R} y={py(a) - 8} textAnchor="end" fontSize={16} fill={C.orange}>α = {alpha}%</text>

          <path d={`M${px(trained)} ${T} V${B}`} stroke={C.green} strokeWidth={3} />
          <circle cx={px(trained)} cy={py(deltaAt(trained))} r={8} fill={C.green} />

          {Array.from({ length: 11 }, (_, e) => (
            <text key={e} x={px(e)} y={B + 22} textAnchor="middle" fontSize={15} fill={C.muted}>{e}</text>
          ))}
          <text x={R} y={B + 40} textAnchor="end" fontSize={14} fill={C.muted}>epoch</text>

          <text x={132} y={382} fontSize={17} fill={C.ink}>
            停在 e = {trained}，全部任务都训 max(e,1) = {trained} 轮
          </text>

          <Meter x={190} y={452} s={0.58} cents={-2 - 60 * deltaAt(trained)} alpha={-2 - 60 * a} label="音分差 vs α（示意）" />
          <Fader x={350} y={432} h={80} t={(alpha - 5) / 25} color={C.orange} label={`α=${alpha}%`} />
          <Fader x={440} y={432} h={80} t={trained / 10} color={C.green} label={`${trained} 轮`} />

          <text x={24} y={40} fontSize={21} fill={C.muted}>拖动 α：阈值越松，停手越晚</text>
        </svg>
      }
      side={
        <>
          <div className="studio-panel">
            <h4>用负样本读数当刹车</h4>
            <p style={{ margin: 0 }}>
              第一个任务先用原始 CLIP 量一次 neg⁰；之后每轮算 Δ。Δ 一过 α 就退回上一轮，全部任务都只训 max(e,1) 轮。
            </p>
          </div>
          <div className={`studio-feedback ${tone}`}>{feedback}</div>
          <div className="studio-kv">
            <span>停手轮次 e</span><b>{stopE}</b>
            <span>实际训练</span><b>{trained} 轮（按 Eq.3 演示）</b>
            <span>Δ(e+1)</span><b>{(deltaAt(Math.min(10, trained + 1)) * 100).toFixed(1)}%</b>
          </div>
          <label className="studio-muted" htmlFor="stop-alpha">阈值 α（论文默认 10%）</label>
          <input id="stop-alpha" className="studio-slider" type="range" min={5} max={30} step={1} value={alpha} onChange={(e) => setAlpha(Number(e.target.value))} />
          <div className="studio-src">
            Eq.(3) 与 §4.2：Δ 超过 α 时取最后一次仍低于 α 的轮次，全部任务训 max(e,1) 轮；默认 α=10%（§5.1）。
            neg 轨迹取 Fig.3(a) 的读数，因此轮数随数据而变，不是论文报告的固定值。
          </div>
        </>
      }
    />
  );
}
