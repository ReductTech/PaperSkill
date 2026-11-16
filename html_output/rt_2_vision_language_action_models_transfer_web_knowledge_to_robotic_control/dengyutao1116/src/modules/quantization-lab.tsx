import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { Svg, T, PAL, Card, Pill } from './kit';

const dims = ['∆x', '∆y', '∆z', '∆roll', '∆pitch', '∆yaw', '夹爪'];
const binOptions = [16, 64, 256];

// Continuous deltas are normalized to [-1, 1], then written into discrete bins.
// The gripper extension is also a continuous dimension in the paper.
export const QuantizationLab: React.FC<WidgetProps> = () => {
  const [dim, setDim] = useState(0);
  const [value, setValue] = useState(0.37);
  const [bins, setBins] = useState(256);

  const q = useMemo(() => {
    const idx = Math.round(((value + 1) / 2) * (bins - 1));
    const back = (idx / (bins - 1)) * 2 - 1;
    return { idx, back, err: Math.abs(value - back) };
  }, [value, bins]);

  const markerX = 392 + (q.idx / (bins - 1)) * 600;
  const isGrip = dim === 6;
  return (
    <div>
      <Svg w={1080} h={266} label="连续动作值量化为离散 bin">
        <Card x={18} y={12} w={298} h={216} color={PAL.blue} title="连续值 → 整数 token" active>
          <T x={36} y={66} size={11} color={PAL.muted}>输入（归一化）</T>
          <T x={36} y={104} size={30} color={PAL.ink} weight={700}>{value.toFixed(2)}</T>
          <T x={36} y={138} size={11} color={PAL.muted}>写入序列的 bin 索引</T>
          <T x={36} y={176} size={28} color={PAL.blue} weight={700}>{q.idx}</T>
          <T x={170} y={176} size={11} color={PAL.muted}>/ {bins - 1}</T>
          <T x={36} y={208} size={11} color={PAL.muted}>
            反量化 {q.back.toFixed(3)} · 误差 {q.err.toFixed(4)}
          </T>
        </Card>

        <Card x={334} y={12} w={728} h={216} color={PAL.orange} title={`${dims[dim]} 落在哪一格`}>
          <Pill x={690} y={48} w={168} h={24} label={`${bins} 格 · 步长 2/${bins - 1}`} color={PAL.orange} size={10} />
          <T x={392} y={65} size={11} color={PAL.muted}>0</T>
          <T x={992} y={65} size={11} color={PAL.muted} anchor="end">{bins - 1}</T>
          <rect x={392} y={92} width={600} height={26} rx={7} fill="#fff7ec" stroke={PAL.line} />
          {Array.from({ length: 15 }).map((_, i) => (
            <line key={i} x1={392 + (i * 600) / 14} y1={92} x2={392 + (i * 600) / 14} y2={118} stroke="#ecd9c2" strokeWidth={1} />
          ))}
          <rect x={392} y={92} width={Math.max(4, markerX - 392)} height={26} rx={7} fill="#f7c48b" opacity={0.55} />
          <path d={`M ${markerX} 86 L ${markerX - 7} 74 L ${markerX + 7} 74 Z`} fill={PAL.orange} />
          <line x1={markerX} y1={118} x2={markerX} y2={136} stroke={PAL.orange} strokeWidth={2} />
          <T x={markerX} y={154} size={12} color={PAL.orange} anchor="middle" weight={700}>{q.idx}</T>
          <T x={392} y={186} size={12} color={PAL.ink}>
            连续值 {value.toFixed(2)} → 最近格 {q.idx} → 还原 {q.back.toFixed(3)}
          </T>
          <T x={392} y={208} size={11} color={PAL.muted}>
            量化误差最大为半格：{(0.5 / (bins - 1)).toFixed(4)}（归一化单位）
          </T>
        </Card>
      </Svg>

      <div className="rt2-controls" style={{ gap: 6 }}>
        {dims.map((d, i) => (
          <button key={d} className={`rt2-btn ${dim === i ? 'is-active' : ''}`} onClick={() => setDim(i)}>{d}</button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, maxWidth: 900, margin: '10px auto 0' }}>
        <span style={{ fontSize: 12, color: 'var(--rt2-muted)', whiteSpace: 'nowrap' }}>
          {isGrip ? '夹爪连续量' : '连续值'}
        </span>
        <input
          aria-label="连续动作值"
          type="range"
          min={-1}
          max={1}
          step={0.001}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--rt2-orange)' }}
        />
        <b style={{ width: 54, textAlign: 'right', fontSize: 14, color: 'var(--rt2-ink)' }}>{value.toFixed(2)}</b>
      </div>

      <div className="rt2-controls" style={{ marginTop: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--rt2-muted)' }}>换一种分辨率：</span>
        {binOptions.map((b) => (
          <button key={b} className={`rt2-btn ${bins === b ? 'is-active' : ''}`} onClick={() => setBins(b)}>{b} bins</button>
        ))}
      </div>
      <p className="rt2-note is-warn">
        <b>论文使用 256 bins。</b>16 / 64 档只用于感受分辨率，并不是 RT-2 的实际配置；夹爪在论文中也是连续维度，和其他维度一样离散化。
      </p>
    </div>
  );
};

export default QuantizationLab;
