import { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';

const LEVELS = [
  { name: 'P3', stride: 8, lo: 0, hi: 64 },
  { name: 'P4', stride: 16, lo: 64, hi: 128 },
  { name: 'P5', stride: 32, lo: 128, hi: 256 },
  { name: 'P6', stride: 64, lo: 256, hi: 512 },
  { name: 'P7', stride: 128, lo: 512, hi: Infinity },
];

export function FpnLevels(_props: { chapterId: string; moduleId: string }) {
  const [maxD, setMaxD] = useState(90);
  const active = LEVELS.filter((level) => !(maxD > level.hi || maxD < level.lo));
  const names = active.map((level) => level.name).join('、') || '无';
  const print = 86 + Math.min(150, maxD * 0.18);
  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '760px 672px', gap: 40 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
        <div style={{ height: 250, borderRadius: 18, background: '#f3ead7', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '50%', top: '54%', width: print, height: print * 0.72, transform: 'translate(-50%, -50%)', background: '#fffdf8', border: '8px solid #92400e', boxSizing: 'border-box' }} />
        </div>
        <label style={{ fontSize: 28, lineHeight: 1.3, color: '#21324a' }}>
          最大边距 {maxD}
          <input type="range" min={8} max={800} step={1} value={maxD} aria-valuetext={`最大边距 ${maxD}，层级 ${names}`}
            onChange={(e) => setMaxD(Number(e.target.value))} style={{ width: '100%', height: 32, accentColor: '#f07e47' }} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {LEVELS.map((level) => {
            const on = active.includes(level);
            return (
              <div key={level.name} style={{ borderRadius: 12, padding: '8px 6px', background: on ? '#228d5c' : '#fff', color: on ? '#fff' : '#21324a', border: '2px solid #d7deea' }}>
                <div style={{ fontSize: 28, lineHeight: 1.2, fontWeight: 800 }}>{level.name}</div>
                <div style={{ fontSize: 28, lineHeight: 1.2 }}>/ {level.stride}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
        <div style={{ fontSize: 34, lineHeight: 1.2, fontWeight: 800, color: '#21324a' }}>分到 {names}</div>
        <div style={{ fontSize: 28, lineHeight: 1.3, color: active.length > 1 ? '#f07e47' : '#228d5c' }}>
          {active.length > 1
            ? '最大边距正好落在分界上，相邻两层的不等式都不把它判成负样本。'
            : '某一层只在最大边距不大于本层上限、也不小于上一层上限时才回归。'}
        </div>
        <div style={{ fontSize: 28, lineHeight: 1.3, color: '#21324a' }}>
          界限 <SymbolHint meaning="第 i 层允许的最大边距"><i>m</i></SymbolHint> 为 0、64、128、256、512、∞。步长 8 到 128。最好可能召回从 95.55% 到 98.40%，这列数字不随滑块变化。
        </div>
        <img src="./images/fig2-arch.png" alt="论文图2，骨干、P3到P7和共享检测头" style={{ width: '100%', height: 168, objectFit: 'contain', background: '#fff', border: '1px solid #d7deea', borderRadius: 8 }} />
        <div style={{ fontSize: 28, lineHeight: 1.2, color: '#68778f' }}>论文图 2。各层共用检测头，回归用带可学习标量的指数。</div>
      </div>
    </div>
  );
}
