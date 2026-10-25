import React, { useState } from 'react';
import { Feedback, INK, Switch } from './kit';

const SCORES = [22, 64, 38, 86, 31, 58, 92, 27];

/* 心跳序列是固定的教学设定：每格代表一次"有什么值得做的吗"。
   改变门槛只改变判定结果，执行侧的三件工具始终没变——这正是本页要讲的事。 */
export function KairosHeartbeat() {
  const [threshold, setThreshold] = useState(50);
  const [push, setPush] = useState(true);
  const actions = SCORES.filter(score => score >= threshold).length;
  const quiet = SCORES.length - actions;
  const pushes = push ? actions : 0;

  return (
    <div className="ps" style={{ gridTemplateColumns: 'minmax(0, 1.62fr) minmax(0, 1fr)' }}>
      <div className="ps-card ps-card--flush" style={{ display: 'grid' }}>
        <svg className="ps-art" viewBox="0 0 860 566" role="img" aria-label={`${actions} 次心跳达到门槛，其余保持静默`}>
          <rect x="0" y="0" width="860" height="566" fill="#fdfbf2" />
          <rect x="36" y="26" width="214" height="146" rx="10" fill="#e8eef6" stroke={INK.edgeStrong} strokeWidth="4" />
          <path d="M143 26 V172 M36 99 H250" stroke={INK.edgeStrong} strokeWidth="4" />
          <circle cx="178" cy="74" r="30" fill="#f4e6c8" stroke={INK.edgeStrong} strokeWidth="3" />
          <text x="36" y="196" fill={INK.muted} fontSize="30">凌晨 3 点 · 没人提问</text>

          <g transform="translate(430 34)">
            <path d="M0 46 Q34 8 68 46 L76 78 H-8 Z" fill="#d9a441" stroke={INK.wood} strokeWidth="4" />
            <rect x="-14" y="78" width="98" height="12" rx="6" fill={INK.wood} />
            {actions > 0 && <>
              <path d="M-30 20 Q-52 46 -30 72" fill="none" stroke={INK.orange} strokeWidth="5" opacity="0.75" />
              <path d="M106 20 Q128 46 106 72" fill="none" stroke={INK.orange} strokeWidth="5" opacity="0.75" />
            </>}
            <text x="34" y="126" textAnchor="middle" fill={INK.muted} fontSize="30">心跳</text>
          </g>

          <rect x="36" y="300" width="700" height="20" rx="8" fill={INK.wood} opacity="0.85" />
          <rect x="70" y="320" width="18" height="66" fill={INK.wood} opacity="0.7" />
          <rect x="676" y="320" width="18" height="66" fill={INK.wood} opacity="0.7" />

          <g transform="translate(96 208)">
            <path d="M0 22 Q96 0 192 22 L192 82 Q96 60 0 82 Z" fill={INK.paper} stroke={INK.edgeStrong} strokeWidth="4" />
            <path d="M96 22 V82" stroke={INK.edgeStrong} strokeWidth="3" />
            {Array.from({ length: actions }, (_, i) => (
              <rect key={i} x={i % 2 === 0 ? 16 : 108} y={34 + Math.floor(i / 2) * 20} width={70} height={7} rx={3} fill={INK.blue} opacity="0.65" />
            ))}
          </g>
          <text x="192" y="404" textAnchor="middle" fill={INK.muted} fontSize="30">只追加的日志</text>

          <g transform="translate(606 140)">
            <rect x="0" y="0" width="150" height="160" rx="8" fill={actions > 0 ? '#eef6f0' : '#f0ede2'} stroke={actions > 0 ? INK.green : INK.edgeStrong} strokeWidth="4" />
            <circle cx="126" cy="82" r="7" fill={actions > 0 ? INK.green : INK.muted} />
          </g>
          <text x="681" y="404" textAnchor="middle" fill={INK.muted} fontSize="30">执行入口</text>

          {SCORES.map((score, i) => {
            const act = score >= threshold;
            const x = 70 + i * 92;
            const height = Math.round(score * 1.05);
            const top = 540 - height;
            return (
              <g key={i}>
                <rect x={x} y={top} width="58" height={height} rx="8" fill={act ? INK.green : '#ded7c2'} />
                <text x={x + 29} y={top - 10} textAnchor="middle" fill={act ? INK.green : INK.muted} fontSize="30" fontWeight={act ? 700 : 500}>{score}</text>
                <text x={x + 29} y="562" textAnchor="middle" fill={INK.muted} fontSize="30">{i + 1}</text>
              </g>
            );
          })}
          <line x1="56" y1={540 - threshold * 1.05} x2="818" y2={540 - threshold * 1.05} stroke={INK.orange} strokeWidth="4" strokeDasharray="12 8" />
          <text x="818" y={540 - threshold * 1.05 - 12} textAnchor="end" fill={INK.orange} fontSize="30">门槛 {threshold}</text>
          <line x1="56" y1="540" x2="818" y2="540" stroke={INK.edgeStrong} strokeWidth="3" />
        </svg>
      </div>

      <div className="ps-col" style={{ gap: 12 }}>
        <div className="ps-card ps-card--plain ps-col" style={{ gap: 6 }}>
          <div className="ps-spread">
            <span className="ps-t">判定门槛</span>
            <b className="ps-fig" style={{ color: INK.orange }}>{threshold}</b>
          </div>
          <input className="ps-range" type="range" min="0" max="100" step="1" value={threshold}
            aria-label="判定门槛" onChange={e => setThreshold(Number(e.target.value))} />
        </div>

        <div className="ps-card ps-card--plain" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
          <Stat value={actions} label="行动" tone={INK.green} />
          <Stat value={quiet} label="静默" tone={INK.muted} />
          <Stat value={pushes} label="推送打扰" tone={INK.orange} />
          <p className="ps-t ps-muted" style={{ gridColumn: '1 / -1', textAlign: 'left', lineHeight: 1.3 }}>
            三个专属工具：推送 / 投递文件 / PR 订阅
          </p>
        </div>

        <Switch checked={push} onChange={setPush}>行动后推送通知</Switch>

        <div style={{ marginTop: 'auto' }}>
          <Feedback tone={actions === 0 ? 'neutral' : 'good'}>
            {actions === 0
              ? '整夜静默：不会打扰你，也不会替你做事。'
              : actions === SCORES.length
                ? '每次心跳都行动：主动性变成了打扰。'
                : `${actions} 次行动、${quiet} 次静默。执行工具没变，变的是谁在判定“值得”。`}
          </Feedback>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div>
      <p className="ps-fig" style={{ color: tone }}>{value}</p>
      <p className="ps-t ps-muted">{label}</p>
    </div>
  );
}
