import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';

const W = 800;
const H = 560;
const GREEN = '#228d5c';
const RED = '#c43f52';
const BLUE = '#27446e';
const ORANGE = '#f07e47';
const INK = '#21324a';
const MUTED = '#68778f';
const LINE = '#d7deea';
const BG = '#f5f8f0';

const M = 5; // 记忆容量

export function MerReservoir() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [n, setN] = useState(0); // 已见样本数
  const [buf, setBuf] = useState<number[]>([]); // 记忆中的样本编号（-1 表示空）
  const [lastAction, setLastAction] = useState('');

  const feed = () => {
    const i = n; // 新样本编号 i（0-based）
    setN(n + 1);
    setBuf(prev => {
      const next = [...prev];
      if (prev.length < M) {
        next.push(i);
        setLastAction(`样本 ${i} 加入记忆（还没满）。`);
      } else {
        // 蓄水池采样：随机 0..i，若 < M 则替换该位置
        const j = Math.floor(Math.random() * (i + 1));
        if (j < M) {
          const replaced = next[j];
          next[j] = i;
          setLastAction(`样本 ${i} 抽中位置 ${j}，替换了样本 ${replaced}。`);
        } else {
          setLastAction(`样本 ${i} 抽签未中（j=${j} ≥ M），记忆不变。`);
        }
      }
      return next;
    });
  };

  const reset = () => { setN(0); setBuf([]); setLastAction(''); };

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = setupCanvas(c, W, H);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    // memory slots
    const slotW = 120, slotH = 150, gap = 20, x0 = 60, y0 = 120;
    for (let k = 0; k < M; k++) {
      const x = x0 + k * (slotW + gap);
      const filled = k < buf.length;
      ctx.fillStyle = filled ? '#fff' : '#f1f4f8';
      ctx.fillRect(x, y0, slotW, slotH);
      ctx.strokeStyle = filled ? BLUE : LINE;
      ctx.lineWidth = filled ? 3 : 1;
      ctx.strokeRect(x, y0, slotW, slotH);
      ctx.fillStyle = INK;
      ctx.font = 'bold 28px "Segoe UI", sans-serif';
      ctx.fillText(filled ? String(buf[k]) : '—', x + slotW / 2 - 18, y0 + slotH / 2 + 10);
      ctx.fillStyle = MUTED;
      ctx.font = '18px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText(`槽 ${k}`, x + slotW / 2 - 24, y0 + slotH + 26);
    }
    ctx.fillStyle = MUTED;
    ctx.font = '22px "Segoe UI", "PingFang SC", sans-serif';
    ctx.fillText('记忆 M（容量 5）', x0, y0 - 26);

    // retention probability note
    const pKeep = n > 0 ? Math.min(1, M / n) : 1;
    ctx.fillStyle = INK;
    ctx.font = '22px "Segoe UI", "PingFang SC", sans-serif';
    ctx.fillText(`已见样本 N = ${n}；任一旧样本留在记忆中的概率 = M/N = ${pKeep.toFixed(2)}`, x0, y0 + slotH + 70);
  }, [buf, n]);

  return (
    <div style={{ display: 'flex', gap: 24, width: '100%', height: '100%', alignItems: 'center' }}>
      <canvas ref={ref} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
        <div style={{ fontSize: 34, color: INK, fontWeight: 700 }}>有限记忆，怎么公平代表过去？</div>
        <p style={{ fontSize: 26, color: MUTED, margin: 0, lineHeight: 1.5 }}>
          每来一个新样本，蓄水池采样用「抽签」决定是否替换记忆中的一格。这样不管样本多早出现，留在记忆里的概率都相同（= M/N）。
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={feed} style={{ fontSize: 24, padding: '12px 20px', borderRadius: 10, background: ORANGE, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>喂入下一个样本</button>
          <button onClick={reset} style={{ fontSize: 24, padding: '12px 20px', borderRadius: 10, background: '#fff', color: INK, border: '1px solid #9fb0c8', cursor: 'pointer' }}>重置</button>
        </div>
        <div style={{ fontSize: 26, color: INK, background: '#fff', border: '1px solid #d7deea', borderRadius: 12, padding: 12, minHeight: 60 }}>{lastAction || '点击「喂入」开始。'}</div>
        <div style={{ fontSize: 24, color: BLUE, background: '#eef3fb', borderRadius: 12, padding: 12 }}>
          对比「只留最近」：那会让早期样本被彻底遗忘，经验回放就无法近似平稳分布（Eq.5）。这正是 GEM 在 Omniglot 上崩溃、而 MER 能收敛的一个原因（Sec 4 Q3）。
        </div>
      </div>
    </div>
  );
}
