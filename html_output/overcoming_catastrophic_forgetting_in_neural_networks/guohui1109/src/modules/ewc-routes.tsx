import React, { useState } from 'react';
import { MiniConsole, Slider, C, FONT, T } from './ewcKit';

const COL_W = 722;

function Tape({ x, y, n }: { x: number; y: number; n: number }) {
  return <g transform={`translate(${x} ${y})`} aria-hidden="true">
    <rect width="126" height="92" rx="12" fill="#fff" stroke={C.text} strokeWidth="3" />
    <rect x="12" y="12" width="102" height="40" rx="8" fill="#eef3e7" stroke={C.dark} strokeWidth="2" />
    <circle cx="38" cy="32" r="11" fill="none" stroke={C.support} strokeWidth="4" />
    <circle cx="88" cy="32" r="11" fill="none" stroke={C.support} strokeWidth="4" />
    <text x="63" y="80" textAnchor="middle" fontSize={T.body} fontWeight="700" fill={C.text} fontFamily={FONT}>任务{n}</text>
  </g>;
}

export function EwcRoutes() {
  const [n, setN] = useState(3);
  return <div className="ewc-page">
    <section className="ewc-side ewc-card is-red" style={{ flex: `0 0 ${COL_W}px` }}>
      <h3 className="ewc-head">多任务回放：存下每个任务的数据</h3>
      <svg width={COL_W - 48} height={218} viewBox={`0 0 ${COL_W - 48} 218`} role="img" aria-label={`货架上放着 ${n} 盒任务录音带`}>
        {Array.from({ length: 10 }, (_, i) => {
          const row = Math.floor(i / 5), col = i % 5;
          const x = col * 134, y = row * 108;
          return i < n ? <Tape key={i} x={x} y={y} n={i + 1} />
            : <rect key={i} x={x} y={y} width="126" height="92" rx="12" fill="none" stroke={C.border} strokeWidth="3" strokeDasharray="8 7" aria-hidden="true" />;
        })}
      </svg>
      <Slider label="任务数 n" value={n} min={1} max={10} step={1} onChange={setN} display={`${n}`} />
      <div className="ewc-kpi is-red">需保存并回放的记忆 <b>{n} 份</b></div>
    </section>
    <section className="ewc-side ewc-card is-green" style={{ flex: `0 0 ${COL_W}px` }}>
      <h3 className="ewc-head">突触巩固：保护重要的突触</h3>
      <ul className="ewc-list">
        <li>学会新技能时，部分兴奋性突触增强，树突棘体积增大</li>
        <li>增大的树突棘在学习别的任务后仍保持，旧技能可留存数月</li>
        <li>选择性擦除这些树突棘，对应的技能随之被遗忘</li>
      </ul>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <svg width="210" height="150" viewBox="0 0 210 150" role="img" aria-label="两个重要的推子被锁住">
          <MiniConsole x={8} y={8} scale={1.05} locked={[true, false, true, false]} />
        </svg>
        <div className="ewc-kpi is-green" style={{ flex: 1, flexDirection: 'column', alignItems: 'flex-start' }}>
          EWC 只需 <b>1 个网络 + 1 条合并惩罚</b>
        </div>
      </div>
    </section>
  </div>;
}
