import React, { useState } from 'react';
import { C, Cello, Mic, Meter, PageFrame } from './studioKit';
import './studio.css';

type Mode = 'naive' | 'align';

const SIM0 = 0.0579;
const ACC0 = 72.74;

/** p2：两种毁法——朴素微调把间隙拉开；直接对齐把相似度抬高、间隙压小，却改坏预训练知识。 */
export function MgTwoFailures() {
  const [mode, setMode] = useState<Mode>('naive');
  const [epoch, setEpoch] = useState(4);

  const sim = mode === 'naive' ? 0.1719 - 0.0114 * epoch : 0.1719 + 0.023 * epoch;
  const acc = mode === 'naive' ? 75.4 - 0.266 * epoch : 75.4 - 0.42 * epoch;
  const cents = mode === 'naive' ? -2 - 3.2 * epoch : -2 - 1.2 * epoch;
  const tone = 'bad';
  const feedback =
    mode === 'naive'
      ? '间隙被一路拉开：负样本被推远，旧磁带的高频先没了，旧类准确率跟着掉。'
      : '对齐损失确实把相似度抬高了、间隙被压小；可预训练知识一起被改坏，旧类准确率反而更低。';

  // 画布 900×560；卡片 330..870 × 96..430；绘图区 400..830 × 150..370
  const L = 400;
  const R = 830;
  const T = 150;
  const B = 370;
  const px = (e: number) => L + (e / 10) * (R - L);
  const pySim = (v: number) => B - ((v - 0.05) / 0.4) * (B - T);
  const pyAcc = (v: number) => B - ((v - 68) / 12) * (B - T);

  const simAt = (e: number) => (mode === 'naive' ? 0.1719 - 0.0114 * e : 0.1719 + 0.023 * e);
  const accAt = (e: number) => (mode === 'naive' ? 75.4 - 0.266 * e : 75.4 - 0.42 * e);
  const line = (f: (e: number) => number) =>
    Array.from({ length: 11 }, (_, e) => `${e === 0 ? 'M' : 'L'}${px(e).toFixed(1)} ${f(e).toFixed(1)}`).join(' ');

  return (
    <PageFrame
      scene={
        <svg viewBox="0 0 900 560" role="img" aria-label={`${mode === 'naive' ? '朴素微调' : '直接对齐'}下第 ${epoch} 轮：相似度 ${sim.toFixed(4)}，旧类准确率 ${acc.toFixed(2)}%`}>
          <rect x="0" y="0" width="900" height="560" fill={C.bg} />

          {/* 左：主题场景 */}
          <Cello x={150} y={200} s={0.6} mute={mode === 'align'} />
          <Mic x={252} y={106} s={0.6} color={mode === 'align' ? C.purple : C.blue} hang active />
          <Meter x={150} y={348} s={0.66} cents={cents} alpha={mode === 'align' ? 0 : null} label="两轨音分差" />

          {/* 右：曲线卡片 */}
          <rect x={330} y={96} width={540} height={334} rx={12} fill="#fbfcf9" stroke={C.line} strokeWidth={2} />

          {/* 输入提示两行放在卡片内顶部 */}
          <text x={352} y={114} fontSize={18} fill={C.muted}>
            {mode === 'naive' ? '朴素微调：间隙越拉越大' : '直接对齐：间隙被压小，但知识被改坏'}
          </text>

          {/* 网格与左轴刻度（相似度） */}
          {[0.05, 0.15, 0.25, 0.35, 0.45].map((v) => (
            <g key={`s${v}`}>
              <path d={`M${L} ${pySim(v).toFixed(1)} H${R}`} stroke={C.line} strokeWidth={1} opacity={0.85} />
              <text x={L - 8} y={pySim(v) + 5} textAnchor="end" fontSize={15} fill={C.muted}>{v.toFixed(2)}</text>
            </g>
          ))}
          {/* 右轴刻度（准确率） */}
          {[68, 72, 76, 80].map((v) => (
            <text key={`a${v}`} x={R + 8} y={pyAcc(v) + 5} fontSize={15} fill={C.muted}>{v}</text>
          ))}

          {/* 坐标轴 */}
          <path d={`M${L} ${B} H${R} M${L} ${B} V${T}`} stroke={C.muted} strokeWidth={2} />
          <path d={`M${R} ${B} V${T}`} stroke={C.muted} strokeWidth={1.5} strokeDasharray="5 5" opacity={0.7} />

          {/* 轴标题 */}
          <text x={L} y={146} fontSize={17} fill={C.blue}>图文余弦相似度</text>
          <text x={R} y={146} textAnchor="end" fontSize={17} fill={C.red}>旧类 Last（%）</text>

          {/* X 轴刻度 */}
          {[0, 2, 4, 6, 8, 10].map((e) => (
            <text key={`x${e}`} x={px(e)} y={B + 22} textAnchor="middle" fontSize={15} fill={C.muted}>{e}</text>
          ))}
          <text x={R} y={B + 40} textAnchor="end" fontSize={14} fill={C.muted}>epoch</text>

          {/* 曲线 */}
          <path d={line((e) => pySim(simAt(e)))} fill="none" stroke={C.blue} strokeWidth={3.5} />
          <path d={line((e) => pyAcc(accAt(e)))} fill="none" stroke={C.red} strokeWidth={3.5} strokeDasharray="9 6" />
          <circle cx={px(epoch)} cy={pySim(sim)} r={7} fill={C.blue} />
          <circle cx={px(epoch)} cy={pyAcc(acc)} r={7} fill={C.red} />

          {/* 图例（卡片内底部） */}
          <g>
            <path d={`M352 402 H392`} stroke={C.blue} strokeWidth={3.5} />
            <text x={400} y={407} fontSize={16} fill={C.blue}>相似度↑ = 间隙变小</text>
            <path d={`M352 424 H392`} stroke={C.red} strokeWidth={3.5} strokeDasharray="9 6" />
            <text x={400} y={429} fontSize={16} fill={C.red}>旧类准确率（下降，示意）</text>
          </g>

          <text x={24} y={536} fontSize={21} fill={C.muted}>切换两种调法，再拖动进度：两条路都不通</text>
        </svg>
      }
      side={
        <>
          <div className="studio-row">
            <button className={`studio-btn ${mode === 'naive' ? 'is-on' : ''}`} onClick={() => setMode('naive')} aria-pressed={mode === 'naive'}>
              朴素微调
            </button>
            <button className={`studio-btn ${mode === 'align' ? 'is-on' : ''}`} onClick={() => setMode('align')} aria-pressed={mode === 'align'}>
              直接对齐
            </button>
          </div>
          <div className={`studio-feedback ${tone}`}>{feedback}</div>
          <div className="studio-kv">
            <span>相似度</span>
            <b>{sim.toFixed(4)}</b>
            <span>旧类 Last</span>
            <b>{acc.toFixed(2)}%</b>
          </div>
          <label className="studio-muted" htmlFor="fail-epoch">训练进度</label>
          <input id="fail-epoch" className="studio-slider" type="range" min={0} max={10} step={1} value={epoch} onChange={(e) => setEpoch(Number(e.target.value))} />
          <div className="studio-src">
            Fig.2a：朴素微调下，图文相似度与准确率同步下滑（端点取 Table 5：0.1719→0.0579、75.40→72.74）。
            Fig.2b：加入对齐损失后相似度升高、间隙被压小，但旧知识被破坏、准确率同样下降（{ACC0}→71 附近为示意）。
          </div>
        </>
      }
    />
  );
}
