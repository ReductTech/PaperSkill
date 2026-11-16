import React, { useState } from 'react';
import { C, Fader, Meter, PageFrame } from './studioKit';
import './studio.css';

// 数值按 Fig.3(a) ImageNet-R 的读数：pos 0.26→0.305（epoch 2–3 后转平），
// neg 0.165→0.108（epoch 2 之后开始下降）；绿虚线在 epoch 2。
const POS0 = 0.26;
const POS1 = 0.305;
const NEG0 = 0.165;
const NEG1 = 0.108;
const TURN = 2;

const posAt = (e: number) => (e <= 3 ? POS0 + ((POS1 - POS0) * e) / 3 : POS1);
const negAt = (e: number) => (e <= TURN ? NEG0 - 0.0025 * e : 0.16 - ((0.16 - NEG1) * (e - TURN)) / (10 - TURN));

/** p3：单个任务内的转折点——前两轮涨正样本，之后负样本一路下滑（Fig.3a，ImageNet-R 读数）。 */
export function MgEpochTurn() {
  const [epoch, setEpoch] = useState(2);
  const pos = posAt(epoch);
  const neg = negAt(epoch);
  const tone = epoch <= 2 ? 'ok' : epoch <= 4 ? 'warn' : 'bad';
  const feedback =
    epoch <= 2
      ? '涨的是正样本：琴手越来越肯定自己拉的是哪个音，新知识进来了。'
      : epoch <= 4
      ? '转折之后：正样本已经转平，负样本开始往下走——间隙正在变大。'
      : '负样本一路下滑：不是学得更准，而是把别的音越推越远。';

  // 画布 900×560；卡片 110..790 × 96..400；绘图区 190..760 × 150..356
  const L = 190;
  const R = 760;
  const T = 150;
  const B = 356;
  const px = (e: number) => L + (e / 10) * (R - L);
  const py = (v: number) => B - ((v - 0.08) / 0.24) * (B - T);
  const line = (f: (e: number) => number) =>
    Array.from({ length: 11 }, (_, e) => `${e === 0 ? 'M' : 'L'}${px(e).toFixed(1)} ${py(f(e)).toFixed(1)}`).join(' ');

  return (
    <PageFrame
      scene={
        <svg viewBox="0 0 900 560" role="img" aria-label={`第 ${epoch} 轮：正样本 ${pos.toFixed(3)}，负样本 ${neg.toFixed(3)}`}>
          <rect x="0" y="0" width="900" height="560" fill={C.bg} />
          <rect x={110} y={96} width={680} height={304} rx={12} fill="#fbfcf9" stroke={C.line} strokeWidth={2} />
          <text x={132} y={124} fontSize={18} fill={C.muted}>单个任务内逐轮读数（Fig.3a，ImageNet-R）</text>

          {/* 图例移到卡片右上，避开底部刻度 */}
          <path d={`M580 118 H616`} stroke={C.blue} strokeWidth={3.5} />
          <text x={622} y={123} fontSize={15} fill={C.blue}>pos</text>
          <path d={`M680 118 H716`} stroke={C.green} strokeWidth={3.5} />
          <text x={722} y={123} fontSize={15} fill={C.green}>neg</text>

          {/* 网格与纵轴刻度 */}
          {[0.1, 0.15, 0.2, 0.25, 0.3].map((v) => (
            <g key={v}>
              <path d={`M${L} ${py(v).toFixed(1)} H${R}`} stroke={C.line} strokeWidth={1} opacity={0.85} />
              <text x={L - 8} y={py(v) + 5} textAnchor="end" fontSize={15} fill={C.muted}>{v.toFixed(2)}</text>
            </g>
          ))}
          <path d={`M${L} ${B} H${R} M${L} ${B} V${T}`} stroke={C.muted} strokeWidth={2} />

          {/* 转折点：竖线 + 左侧标注，不压曲线 */}
          <path d={`M${px(TURN)} ${T} V${B}`} stroke={C.green} strokeWidth={2} strokeDasharray="8 6" />
          <text x={px(TURN) - 10} y={T + 20} textAnchor="end" fontSize={16} fill={C.green}>转折点 epoch {TURN}</text>

          {/* 曲线 */}
          <path d={line(posAt)} fill="none" stroke={C.blue} strokeWidth={3.5} />
          <path d={line(negAt)} fill="none" stroke={C.green} strokeWidth={3.5} />
          <circle cx={px(epoch)} cy={py(pos)} r={8} fill={C.blue} />
          <circle cx={px(epoch)} cy={py(neg)} r={8} fill={C.green} />

          {/* 横轴 */}
          {[0, 2, 4, 6, 8, 10].map((e) => (
            <text key={e} x={px(e)} y={B + 22} textAnchor="middle" fontSize={15} fill={C.muted}>{e}</text>
          ))}
          <text x={R} y={B + 36} textAnchor="end" fontSize={14} fill={C.muted}>epoch</text>

          <Meter x={185} y={462} s={0.52} cents={-2 - 60 * (NEG0 - neg)} label="两轨音分差（示意）" />
          <Fader x={330} y={442} h={68} t={(pos - 0.25) / 0.06} color={C.blue} label="新知识" />
          <Fader x={430} y={442} h={68} t={(neg - 0.1) / 0.07} color={C.green} label="旧片段" />

          <text x={24} y={40} fontSize={21} fill={C.muted}>拖动进度：前两轮涨正样本，转折后掉负样本</text>
        </svg>
      }
      side={
        <>
          <div className="studio-panel">
            <h4>时间上的不对称</h4>
            <p style={{ margin: 0 }}>
              前两轮模型在“确认自己拉的是什么”；转折之后正样本转平，负样本却一路下滑——后者不带来提升，只把间隙撑大。
            </p>
          </div>
          <div className={`studio-feedback ${tone}`}>{feedback}</div>
          <div className="studio-kv">
            <span>pos</span><b>{pos.toFixed(3)}</b>
            <span>neg</span><b>{neg.toFixed(3)}</b>
          </div>
          <label className="studio-muted" htmlFor="turn-epoch">训练轮次</label>
          <input id="turn-epoch" className="studio-slider" type="range" min={0} max={10} step={1} value={epoch} onChange={(e) => setEpoch(Number(e.target.value))} />
          <div className="studio-src">
            Fig.3(a) ImageNet-R 的逐轮读数：pos 0.26→0.305、neg 0.165→0.108，绿虚线标在 epoch 2。
            Table 5 的 pos/neg 是最后任务下不同方法的对比，与本页的逐轮轨迹不是同一量。
          </div>
        </>
      }
    />
  );
}
