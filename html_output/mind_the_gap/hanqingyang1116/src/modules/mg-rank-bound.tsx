import React, { useState } from 'react';
import { C, Mic, PageFrame } from './studioKit';
import './studio.css';

type Pick = 'text' | 'visual' | 'both';

const D: Record<Pick, number> = { text: 0.7732, visual: 0.6076, both: 0.4917 };
const LABEL: Record<Pick, string> = {
  text: '只用参考麦（文本子空间 B_t）',
  visual: '只用近场麦（视觉分类器 B_vc）',
  both: '两路合用（B_t + B_vc）',
};

/** p5：文本分类器被秩卡住——覆盖距离 d(B_i,B·) 越低覆盖越好（Table 4，CIFAR-100）。 */
export function MgRankBound() {
  const [pick, setPick] = useState<Pick>('text');
  const d = D[pick];
  const covered = 1 - d;
  const tone = pick === 'both' ? 'ok' : pick === 'visual' ? 'warn' : 'bad';
  const feedback =
    pick === 'text'
      ? `d = ${d.toFixed(4)}：文本子空间的秩不够，最优分类器有一部分永远落在它外面。`
      : pick === 'visual'
      ? `d = ${d.toFixed(4)}：贴着琴身量的，覆盖好很多，但仍不完整。`
      : `d = ${d.toFixed(4)}：两个分类器互补——这就是补偿的空间来源。`;

  const R = 150;
  const start = -140;
  const span = 280;
  const arc = (frac: number, color: string, w: number, fill?: string) => {
    const a0 = ((start - 90) * Math.PI) / 180;
    const a1 = ((start + span * frac - 90) * Math.PI) / 180;
    const large = span * frac > 180 ? 1 : 0;
    const x0 = 250 + R * Math.cos(a0);
    const y0 = 250 + R * Math.sin(a0);
    const x1 = 250 + R * Math.cos(a1);
    const y1 = 250 + R * Math.sin(a1);
    return (
      <path
        d={`M250 250 L${x0} ${y0} A${R} ${R} 0 ${large} 1 ${x1} ${y1} Z`}
        fill={fill || 'none'}
        stroke={color}
        strokeWidth={w}
      />
    );
  };

  return (
    <PageFrame
      scene={
        <svg viewBox="0 0 900 560" role="img" aria-label={`${LABEL[pick]}，覆盖距离 ${d.toFixed(4)}`}>
          <rect x="0" y="0" width="900" height="560" fill={C.bg} />

          <text x={250} y={60} textAnchor="middle" fontSize={22} fill={C.ink}>琴身实际占据的空间 B_i</text>
          {arc(1, C.line, 3, '#eef3fb')}
          {arc(covered, pick === 'both' ? C.green : pick === 'visual' ? C.green : C.blue, 3, pick === 'both' ? 'rgba(34,141,92,0.18)' : 'rgba(39,68,110,0.16)')}
          {arc(1, C.red, 3)}
          <path
            d={`M250 250 L${250 + R * Math.cos(((start + span * covered - 90) * Math.PI) / 180)} ${250 + R * Math.sin(((start + span * covered - 90) * Math.PI) / 180)}`}
            stroke={C.red}
            strokeWidth={2}
            strokeDasharray="6 5"
          />
          <circle cx={250} cy={250} r={5} fill={C.ink} />
          <text x={250} y={430} textAnchor="middle" fontSize={21} fill={C.muted}>
            盖上 {Math.round(covered * 100)}%，露出 {Math.round(d * 100)}%（红色扇区）
          </text>

          <Mic x={250} y={110} s={0.55} color={pick === 'text' ? C.blue : C.green} hang={false} active />

          <g>
            <text x={470} y={96} fontSize={21} fill={C.ink}>漏在外面的奇异值（示意）</text>
            {[0.9, 0.82, 0.74, 0.66, 0.52, 0.44, 0.3, 0.22].map((v, i) => {
              const outside = i / 8 >= covered;
              return (
                <g key={i}>
                  <rect x={470 + i * 44} y={300 - v * 170} width={30} height={v * 170} rx={5} fill={outside ? C.red : C.blue} opacity={outside ? 0.85 : 0.55} />
                  <text x={485 + i * 44} y={318} textAnchor="middle" fontSize={15} fill={C.muted}>s{i + 1}</text>
                </g>
              );
            })}
            <path d="M470 306 H812" stroke={C.line} strokeWidth={2} />
            <text x={470} y={350} fontSize={17} fill={C.muted}>柱高与红蓝分界都是示意：</text>
            <text x={470} y={374} fontSize={17} fill={C.muted}>论文只给 d 与 Eq.(4) 的下界，没有逐奇异值</text>
          </g>

          <text x={24} y={40} fontSize={21} fill={C.muted}>切换分类器：换一路，覆盖就换一片</text>
        </svg>
      }
      side={
        <>
          <div className="studio-legend">
            <span><i style={{ background: C.blue }} />文本覆盖</span>
            <span><i style={{ background: C.green }} />视觉覆盖</span>
            <span><i style={{ background: C.red }} />覆盖不到</span>
          </div>
          <div className="studio-row">
            {(['text', 'visual', 'both'] as Pick[]).map((p) => (
              <button key={p} className={`studio-btn ${pick === p ? 'is-on' : ''}`} onClick={() => setPick(p)} aria-pressed={pick === p}>
                {p === 'text' ? '只用文本' : p === 'visual' ? '只用视觉' : '两路合用'}
              </button>
            ))}
          </div>
          <div className={`studio-feedback ${tone}`}>{feedback}</div>
          <div className="studio-kv">
            <span>d(B_i, B·)</span><b>{d.toFixed(4)}</b>
            <span>覆盖</span><b>{(covered * 100).toFixed(1)}%</b>
          </div>
          <div className="studio-src">
            d 取 Table 4（CIFAR-100）：0.7732 / 0.6076 / 0.4917，ImageNet-R 与 ImageNet-100 上顺序一致。
            d 是子空间覆盖距离（1 = 正交，0 = 包含），不是分类准确率；扇形角度按 1−d 缩放。
            右侧奇异值柱的根数、柱高与红蓝分界均为示意，论文只给 d 与 Eq.(4) 的下界。
          </div>
        </>
      }
    />
  );
}
