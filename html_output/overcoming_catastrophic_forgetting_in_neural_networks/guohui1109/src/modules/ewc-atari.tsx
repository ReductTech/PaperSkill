import React, { useState } from 'react';
import { C, FONT, T } from './ewcKit';

// Game names are the ten games on the vertical axis of the paper's Fig. 3A.
const GAMES = ['太空侵略者', '公路跑者', '克鲁尔', '地鼠', '高速公路', '恶魔攻击', '保卫者', '疯狂攀登者', '打砖块', '拳击'];
const SEGMENT = 10;      // million frames per click (toy)
const EWC_START = 20;    // paper: EWC penalty only applied after 20 million frames (Fig. 3A caption, Table 2)
const FMAX = 50;
const W = 800, H = 622;
const LABEL_W = 214, BAR_W = 480, ROW0 = 76, ROW_H = 52;
const xOf = (f: number) => LABEL_W + (f / FMAX) * BAR_W;

export function EwcAtari() {
  const [frames, setFrames] = useState<number[]>(GAMES.map(() => 0));
  const [order, setOrder] = useState<number[]>([]);
  const train = (i: number) => {
    if (frames[i] >= FMAX) return;
    setFrames(f => f.map((v, j) => (j === i ? v + SEGMENT : v)));
    setOrder(o => [...o, i]);
  };
  const protectedN = frames.filter(f => f >= EWC_START).length;
  const clear = () => { setFrames(GAMES.map(() => 0)); setOrder([]); };
  return <div className="ewc-page">
    <div className="ewc-scene" style={{ width: W, height: H }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="group" aria-label="十款 Atari 游戏：点击一行，为该游戏训练 10M 帧；累计满 20M 帧后启动 EWC 保护">
        <text x={xOf(EWC_START) + 12} y="40" fontSize={T.body} fontWeight="800" fill={C.green} fontFamily={FONT}>满 20M 帧启动 EWC 保护</text>
        {GAMES.map((g, i) => {
          const y = ROW0 + i * ROW_H;
          const f = frames[i], prot = f >= EWC_START;
          return <g key={g} role="button" tabIndex={0} aria-label={`${g}：已训练 ${f}M 帧，${prot ? '已受 EWC 保护' : '未受保护'}。点击再训练 ${SEGMENT}M 帧`}
            style={{ cursor: f >= FMAX ? 'default' : 'pointer' }} onClick={() => train(i)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); train(i); } }}>
            <rect x="14" y={y - 6} width={W - 28} height={ROW_H - 4} rx="12" fill={prot ? '#effaf4' : '#fff'} stroke={prot ? '#b5dec9' : C.border} strokeWidth="2" />
            <text x="28" y={y + 28} fontSize={T.body} fontWeight="700" fill={C.text} fontFamily={FONT}>{g}</text>
            <rect x={LABEL_W} y={y + 4} width={BAR_W} height="26" rx="13" fill="#eef2ea" />
            {f > 0 && <rect x={LABEL_W} y={y + 4} width={(f / FMAX) * BAR_W} height="26" rx="13" fill={prot ? C.green : C.orange} />}
            <text x={LABEL_W + BAR_W + 14} y={y + 28} fontSize={T.body} fontWeight="800" fill={prot ? C.green : C.muted} fontFamily={FONT}>{f}M</text>
          </g>;
        })}
        <line x1={xOf(EWC_START)} x2={xOf(EWC_START)} y1="56" y2={ROW0 + ROW_H * 10 - 8} stroke={C.green} strokeWidth="4" strokeDasharray="9 7" pointerEvents="none" aria-hidden="true" />
      </svg>
    </div>
    <div className="ewc-side">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span className="ewc-big" style={{ color: protectedN ? C.green : C.muted }}>已保护 {protectedN} / 10</span>
        <button className="ewc-btn" onClick={clear}>清空</button>
      </div>
      <figure className="ewc-fig" style={{ height: 386 }}>
        <img src="./images/fig3b.png" alt="原论文 Figure 3B：EWC、带任务标签的 EWC 与无惩罚方法在十款游戏上的总归一化得分，以及受保护游戏数" style={{ maxHeight: 366 }} />
      </figure>
      <p className="ewc-muted">无惩罚的总分始终低于 1；EWC 能同时学会多款游戏（图中约 6 到 7，读图估计）。</p>
    </div>
  </div>;
}
