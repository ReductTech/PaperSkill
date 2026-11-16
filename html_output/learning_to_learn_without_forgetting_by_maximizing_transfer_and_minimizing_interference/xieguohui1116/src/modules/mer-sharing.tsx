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

export function MerSharing() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [share, setShare] = useState(0.6);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = setupCanvas(c, W, H);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    // two parameter sets as Venn circles
    const cx1 = 260, cx2 = 260 + 150 * (1 - share * 0.6), cy = 200, rr = 110;
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = BLUE;
    ctx.beginPath();
    ctx.arc(cx1, cy, rr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ORANGE;
    ctx.beginPath();
    ctx.arc(cx2, cy, rr, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx1, cy, rr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx2, cy, rr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.font = 'bold 24px "Segoe UI", "PingFang SC", sans-serif';
    ctx.fillText('任务 1 参数', cx1 - 70, cy - 50);
    ctx.fillText('任务 2 参数', cx2 - 70, cy + 60);
    // overlap region highlight
    const overlap = Math.max(0, rr * 2 - Math.abs(cx2 - cx1));
    ctx.fillStyle = GREEN;
    ctx.globalAlpha = 0.3;
    if (overlap > 0) {
      ctx.beginPath();
      ctx.ellipse((cx1 + cx2) / 2, cy, overlap / 2, rr, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = GREEN;
    ctx.font = '20px "Segoe UI", "PingFang SC", sans-serif';
    ctx.fillText('共享参数', (cx1 + cx2) / 2 - 44, cy - 10);

    // potential chart (bottom)
    const px = 60, pw = W - 120, ph = 130, py = 360;
    ctx.strokeStyle = LINE;
    ctx.strokeRect(px, py, pw, ph);
    ctx.fillStyle = MUTED;
    ctx.font = '18px "Segoe UI", "PingFang SC", sans-serif';
    ctx.fillText('潜力', px - 34, py + 20);
    ctx.fillText('0', px - 12, py + ph + 24);
    ctx.fillText('共享比例 1', px + pw - 80, py + ph + 24);
    const y = (v: number) => py + ph - v * ph;
    // interference potential (red) and transfer potential (green) both linear in share
    ctx.strokeStyle = RED;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px, y(0));
    ctx.lineTo(px + pw * share, y(share));
    ctx.stroke();
    ctx.strokeStyle = GREEN;
    ctx.beginPath();
    ctx.moveTo(px, y(0));
    ctx.lineTo(px + pw * share, y(share));
    ctx.stroke();
    // dot at current share
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.arc(px + pw * share, y(share), 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = GREEN;
    ctx.beginPath();
    ctx.arc(px + pw * share, y(share) - 6, 7, 0, Math.PI * 2);
    ctx.fill();
  }, [share]);

  return (
    <div style={{ display: 'flex', gap: 24, width: '100%', height: '100%', alignItems: 'center' }}>
      <canvas ref={ref} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
        <div style={{ fontSize: 34, color: INK, fontWeight: 700 }}>共享越多，两种潜力一起涨</div>
        <label style={{ fontSize: 26, color: INK }}>共享比例 = {(share * 100).toFixed(0)}%
          <input type="range" min={0} max={1} step={0.01} value={share} onChange={e => setShare(Number(e.target.value))} style={{ width: '100%', marginTop: 8 }} />
        </label>
        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{ flex: 1, background: '#fff', border: `2px solid ${GREEN}`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 24, color: GREEN, fontWeight: 700 }}>迁移潜力 ↑</div>
            <div style={{ fontSize: 28, color: INK, fontFamily: 'Consolas, monospace' }}>{(share * 100).toFixed(0)}</div>
          </div>
          <div style={{ flex: 1, background: '#fff', border: `2px solid ${RED}`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 24, color: RED, fontWeight: 700 }}>干扰潜力 ↑</div>
            <div style={{ fontSize: 28, color: INK, fontFamily: 'Consolas, monospace' }}>{(share * 100).toFixed(0)}</div>
          </div>
        </div>
        <p style={{ fontSize: 26, color: MUTED, margin: 0, lineHeight: 1.5 }}>
          完全共享 → 迁移和干扰都最大；完全不共享 → 两者都为零（点积恒为 0）。所以<b style={{ color: INK }}>「减少共享」能防遗忘，却牺牲了未来迁移</b>——这正是旧方法的局限，也是论文主张「学会何时共享」的原因（App. C）。
        </p>
      </div>
    </div>
  );
}
