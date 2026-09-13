import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §2 Module 2.1 (P5 clickable hotspots, hybrid): click a cabinet part to see its 6-token identity.
// 柜子按零件分件绘制：柜体（外框）/ 柜门（绕合页轴微开）/ 抽屉（沿滑轨平移），
// 不同木色色调 + 深色接缝 + 把手区分；被选中零件高亮描边并演示自己的运动方式。
const W = 1080;
const H = 280;

type Part = 'door' | 'drawer' | 'body' | null;

const INFO: Record<string, { tokens: string; attrs: string; fb: string }> = {
  door: {
    tokens: '⟨boxs⟩ q₁₁ q₂₃ q₄₀ q₅₁ q₀₇ q₃₃ ⟨boxe⟩',
    attrs: 'Parent = 柜体 · Type = revolute',
    fb: '柜门：6 个 token 定位包围盒，绕合页轴旋转（revolute）。',
  },
  drawer: {
    tokens: '⟨boxs⟩ q₀₉ q₁₈ q₂₆ q₄₄ q₁₀ q₂₉ ⟨boxe⟩',
    attrs: 'Parent = 柜体 · Type = prismatic',
    fb: '抽屉：沿滑轨平移（prismatic），6 个 token 同样够用。',
  },
  body: {
    tokens: '⟨boxs⟩ q₀₂ q₀₄ q₀₅ q₆₀ q₅₈ q₆₁ ⟨boxe⟩',
    attrs: 'Parent = ⟨base⟩ · Type = fixed',
    fb: '柜体：层级之根，类型为 fixed，是其他零件的父节点。',
  },
};

const NAMES: Record<string, string> = { door: '柜门', drawer: '抽屉', body: '柜体' };

// part rects in canvas coords (used for drawing AND click hit-testing)
const RECTS: Record<string, number[]> = {
  door: [110, 60, 300, 100],
  drawer: [110, 176, 300, 36],
  body: [90, 40, 340, 190],
};

export const Ch2Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ selected: Part }>({ selected: null });
  // per-part highlight amounts, smoothed each frame so selections ease in/out
  const animRef = useRef({ door: 0, drawer: 0, body: 0, last: 0 });
  const rafRef = useRef<number | null>(null);
  const [selected, setSelected] = useState<Part>(null);
  const [feedback, setFeedback] = useState({ text: '点击柜门、抽屉或柜体，查看它的包围盒 token 与属性。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const [bx, by, bw, bh] = RECTS.body;
    const [dx, dy, dw, dh] = RECTS.door;
    const [rx, ry, rw, rh] = RECTS.drawer;

    const render = (time: number) => {
      const sel = stateRef.current.selected;
      const a = animRef.current;
      // delta-correct exponential smoothing toward the current selection
      const dt = a.last ? Math.min(time - a.last, 64) : 16;
      a.last = time;
      const k = 1 - Math.exp(-dt / 140);
      a.door += ((sel === 'door' ? 1 : 0) - a.door) * k;
      a.drawer += ((sel === 'drawer' ? 1 : 0) - a.drawer) * k;
      a.body += ((sel === 'body' ? 1 : 0) - a.body) * k;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, 238, W, 8);

      // ---------- cabinet: separated parts ----------
      // body: outer frame + two dark cavities (the 4px dark gaps read as 接缝)
      ctx.fillStyle = '#92400e';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(bx, by, bw, 8);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(bx + bw - 8, by, 8, bh);
      ctx.fillStyle = '#5c2d0c'; // door cavity
      ctx.fillRect(dx - 4, dy - 4, dw + 8, dh + 8);
      ctx.fillStyle = '#5c2d0c'; // drawer cavity
      ctx.fillRect(rx - 4, ry - 4, rw + 8, rh + 8);
      if (a.body > 0.001) {
        ctx.fillStyle = `rgba(39,68,110,${0.16 * a.body})`;
        ctx.fillRect(bx, by, bw, bh);
        ctx.lineWidth = 2 + 2 * a.body;
        ctx.strokeStyle = lerpColor('#76906a', '#27446e', a.body);
        ctx.strokeRect(bx, by, bw, bh);
      } else {
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#76906a';
        ctx.strokeRect(bx, by, bw, bh);
      }

      // door: closed rect; when selected it swings open around its LEFT edge (合页轴),
      // foreshortening like ch4ana — motion is around a visible pivot, never a jump
      const rad = a.door * 0.7; // up to ~40°
      const wApp = Math.max(dw * Math.cos(rad), 2);
      const lift = 10 * Math.sin(rad);
      // cast shadow on the cavity wall, growing as the door swings open
      if (a.door > 0.02) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(dx - 4, dy - 4, dw + 8, dh + 8);
        ctx.clip();
        ctx.fillStyle = `rgba(0,0,0,${0.3 * a.door})`;
        ctx.beginPath();
        ctx.moveTo(dx + 9, dy + 7);
        ctx.lineTo(dx + wApp + 9, dy - lift + 7);
        ctx.lineTo(dx + wApp + 9, dy + dh - lift + 7);
        ctx.lineTo(dx + 9, dy + dh + 7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.moveTo(dx, dy);
      ctx.lineTo(dx + wApp, dy - lift);
      ctx.lineTo(dx + wApp, dy + dh - lift);
      ctx.lineTo(dx, dy + dh);
      ctx.closePath();
      ctx.fillStyle = '#a0522d';
      ctx.fill();
      if (a.door > 0.001) {
        ctx.fillStyle = `rgba(39,68,110,${0.18 * a.door})`;
        ctx.fill();
      }
      ctx.lineWidth = 2 + 2 * a.door;
      ctx.strokeStyle = lerpColor('#5c2d0c', '#27446e', a.door);
      ctx.stroke();
      // door knob rides the free edge
      ctx.fillStyle = '#d7deea';
      ctx.beginPath();
      ctx.arc(dx + wApp - 16, dy + dh / 2 - lift, 4.5, 0, Math.PI * 2);
      ctx.fill();
      // hinge dots stay put on the frame — the visible pivot
      for (const hy of [dy + 24, dy + dh - 24]) {
        ctx.fillStyle = '#27446e';
        ctx.beginPath();
        ctx.arc(dx, hy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      // drawer: when selected it slides OUT (down-left along the depth axis)
      // on its runners; the pulled box shows top + right side faces connecting
      // the front panel back to the cavity — not just a flat front panel
      const ox = -12 * a.drawer;
      const oy = 16 * a.drawer;
      if (a.drawer > 0.01) {
        ctx.fillStyle = '#8a4a22';
        ctx.fillRect(rx, ry, rw, rh);
        // top face (lighter) + right side face (darker)
        ctx.fillStyle = '#9c5a28';
        ctx.beginPath();
        ctx.moveTo(rx + ox, ry + oy);
        ctx.lineTo(rx, ry);
        ctx.lineTo(rx + rw, ry);
        ctx.lineTo(rx + ox + rw, ry + oy);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#4a2c12';
        ctx.beginPath();
        ctx.moveTo(rx + ox + rw, ry + oy);
        ctx.lineTo(rx + rw, ry);
        ctx.lineTo(rx + rw, ry + rh);
        ctx.lineTo(rx + ox + rw, ry + oy + rh);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#7a3509';
      ctx.fillRect(rx + ox, ry + oy, rw, rh);
      if (a.drawer > 0.001) {
        ctx.fillStyle = `rgba(39,68,110,${0.18 * a.drawer})`;
        ctx.fillRect(rx + ox, ry + oy, rw, rh);
      }
      ctx.lineWidth = 2 + 2 * a.drawer;
      ctx.strokeStyle = lerpColor('#5c2d0c', '#27446e', a.drawer);
      ctx.strokeRect(rx + ox, ry + oy, rw, rh);
      ctx.fillStyle = '#d7deea'; // drawer handle bar
      ctx.fillRect(rx + ox + rw / 2 - 22, ry + oy + 8, 44, 6);

      // part name tags (fade out as a part starts moving)
      ctx.font = '13px "Segoe UI", sans-serif';
      const doorTagA = clamp(1 - a.door * 2.5, 0, 1);
      if (doorTagA > 0.01) {
        ctx.fillStyle = `rgba(255,255,255,${0.9 * doorTagA})`;
        ctx.fillText('柜门', dx + dw / 2 - 13, dy + dh / 2 + 4);
      }
      const drawerTagA = clamp(1 - a.drawer * 2.5, 0, 1);
      if (drawerTagA > 0.01) {
        ctx.fillStyle = `rgba(255,255,255,${0.9 * drawerTagA})`;
        ctx.fillText('抽屉', rx + rw / 2 - 13, ry + rh / 2 + 5);
      }
      // static annotations: 合页 (pivot) and 滑轨 (runners)
      ctx.strokeStyle = '#68778f';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(72, dy + 24);
      ctx.lineTo(dx - 5, dy + 24);
      ctx.stroke();
      ctx.fillStyle = '#68778f';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('合页', 42, dy + 28);
      ctx.beginPath();
      ctx.moveTo(rx + rw + 5, ry + rh / 2);
      ctx.lineTo(440, ry + rh / 2);
      ctx.stroke();
      ctx.fillText('滑轨', 446, ry + rh / 2 + 4);

      // title + legend
      ctx.fillStyle = '#21324a';
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillText('示例柜子：3 个零件，点击分件查看', bx, 28);
      const legend: Array<[string, string]> = [
        ['#92400e', '柜体'],
        ['#a0522d', '柜门'],
        ['#7a3509', '抽屉'],
      ];
      legend.forEach(([color, label], i) => {
        const lx = bx + i * 86;
        ctx.fillStyle = color;
        ctx.fillRect(lx, 250, 12, 10);
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(lx, 250, 12, 10);
        ctx.fillStyle = '#21324a';
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText(label, lx + 18, 259);
      });
      ctx.fillStyle = '#68778f';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('点击零件，查看它的 6 个 token', bx + 280, 259);

      // ---------- info card ----------
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.fillRect(520, 46, 500, 190);
      ctx.strokeRect(520, 46, 500, 190);
      if (sel) {
        const info = INFO[sel];
        ctx.fillStyle = '#21324a';
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.fillText(`零件：${NAMES[sel]}`, 545, 80);
        ctx.font = '20px "Segoe UI", sans-serif';
        ctx.fillText(info.tokens, 545, 116);
        ctx.fillStyle = '#68778f';
        ctx.font = '18px "Segoe UI", sans-serif';
        ctx.fillText(info.attrs, 545, 158);
        ctx.fillText('共 6 个坐标 token（64 档量化）', 545, 196);
      } else {
        ctx.fillStyle = '#68778f';
        ctx.font = '20px "Segoe UI", sans-serif';
        ctx.fillText('尚未选择零件', 545, 104);
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillText('← 点击左侧柜子的零件查看', 545, 146);
        ctx.fillText('可选：柜门 · 抽屉 · 柜体', 545, 178);
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (time: number) => {
      render(time);
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);

    // canvas click hotspots (CSS-scaled -> intrinsic)
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * W;
      const y = ((e.clientY - rect.top) / rect.height) * H;
      let hit: Part = null;
      // topmost part wins: stop at the first match so a click on the door
      // isn't overwritten by the enclosing body rect.
      for (const key of ['door', 'drawer', 'body'] as const) {
        const [rx, ry, rw, rh] = RECTS[key];
        if (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh) {
          hit = key;
          break;
        }
      }
      if (hit) select(hit);
    };
    canvas.addEventListener('click', onClick);
    canvas.style.cursor = 'pointer';
    return () => {
      stop();
      disconnect();
      canvas.removeEventListener('click', onClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = (p: Exclude<Part, null>) => {
    stateRef.current.selected = p;
    setSelected(p);
    setFeedback({ text: INFO[p].fb, cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row" role="group" aria-label="选择零件">
        {(
          [
            ['door', '柜门'],
            ['drawer', '抽屉'],
            ['body', '柜体'],
          ] as const
        ).map(([key, label]) => (
          <button key={key} className={`chip ${selected === key ? 'selected' : ''}`} onClick={() => select(key)}>
            {label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Mod1;
