import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';

// 一段简短数学推理链：长推理由一个个 token 组成，每生成一个 token，KV 缓存就多一份。
const TOKENS = ['设', 'x', '=', '3', '。', 'x', '+', '5', '=', '8', '。', '8', '×', '2', '=', '16'];
const MAX = TOKENS.length;

export const M11: React.FC<WidgetProps> = () => {
  const [n, setN] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<number | null>(null);
  const pct = Math.round((n / MAX) * 100);
  const add = () => setN((v) => Math.min(MAX, v + 1));
  const reset = () => { if (timerRef.current) window.clearInterval(timerRef.current); timerRef.current = null; setPlaying(false); setN(0); };
  const onPlay = () => {
    if (playing) return;
    setN(0);
    setPlaying(true);
    timerRef.current = window.setInterval(() => {
      setN((v) => {
        if (v + 1 >= MAX) { window.clearInterval(timerRef.current!); timerRef.current = null; setPlaying(false); return MAX; }
        return v + 1;
      });
    }, 400);
  };
  useEffect(() => () => { if (timerRef.current) window.clearInterval(timerRef.current); }, []);
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 64, alignItems: 'flex-end' }}>
        {TOKENS.slice(0, n).map((t, i) => (
          <span key={i} style={{ padding: '6px 10px', border: '1px solid #d7deea', borderRadius: 8, background: i === n - 1 ? '#27446e' : '#eef3fb', color: i === n - 1 ? '#fff' : '#21324a', fontSize: 13 }}>{t}</span>
        ))}
        {n === 0 ? <span style={{ color: '#8a93a6' }}>还没有生成任何 token</span> : null}
      </div>
      <div style={{ margin: '14px 0 4px', fontSize: 13, color: '#68778f' }}>KV 缓存大小（每生成一个 token，K/V 多一份）</div>
      <div style={{ height: 18, background: '#eef1f5', borderRadius: 9, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: n >= MAX ? '#c43f52' : '#27446e', transition: 'width .3s' }} />
      </div>
      <div style={{ marginTop: 6, fontSize: 13, color: '#21324a' }}>已生成 {n}/{MAX} 个 token，缓存约满 {pct}%</div>
      <div className="ctrl">
        <button className="chip" onClick={onPlay} disabled={playing}>一键运行 ▶</button>
        <button className="chip" onClick={add} disabled={n >= MAX || playing}>生成下一个 token</button>
        <button className="chip" onClick={reset}>重置</button>
      </div>
      <div className={`feedback ${n >= MAX ? 'bad' : 'guide'}`}>
        {n === 0 ? '点击生成下一个 token，看看 KV 缓存怎么变大。' : n >= MAX ? '缓存已经很大：生成越长，历史 token 的 K/V 存得越多，显存占用线性上升。论文里的长推理可生成数万 token。' : '每生成一个 token，历史 K/V 就多一份，缓存变大一点。'}
      </div>
    </div>
  );
};

export default M11;