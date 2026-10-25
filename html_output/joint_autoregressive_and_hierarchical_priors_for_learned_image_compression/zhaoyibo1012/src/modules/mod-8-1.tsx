import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const NODES = [
  { id: 'enc', label: '编码器', x: 40, y: 50, w: 130, h: 48, info: '把图像 x 压缩成隐变量 ŷ，去掉空间冗余。' },
  { id: 'hyperEnc', label: '超编码器', x: 230, y: 50, w: 130, h: 48, info: '把 ŷ 再压成 z，只保留全局结构（盒盖）。' },
  { id: 'hyperDec', label: '超解码器', x: 420, y: 50, w: 130, h: 48, info: '从 ẑ 恢复边信息 ψ，作为先验的粗模板。' },
  { id: 'ctx', label: '上下文', x: 40, y: 170, w: 130, h: 48, info: '用 5×5 掩码卷积扫描已解码邻居，捕捉局部细节。' },
  { id: 'ep', label: '熵参数网络', x: 230, y: 170, w: 170, h: 60, info: '用 1×1 卷积把 ψ + φ 合成为每个符号的 μ、σ（高斯）。' },
  { id: 'dec', label: '解码器', x: 500, y: 170, w: 130, h: 48, info: '按 μ、σ 解码 ŷ，重建出 x̂。' },
];

const ARROWS = [
  { from: 'enc', to: 'hyperEnc', label: 'ŷ' },
  { from: 'hyperEnc', to: 'hyperDec', label: 'z/ẑ' },
  { from: 'hyperDec', to: 'ep', label: 'ψ' },
  { from: 'enc', to: 'ctx', label: 'ŷ' },
  { from: 'ctx', to: 'ep', label: 'φ' },
  { from: 'ep', to: 'dec', label: 'μ,σ' },
];

const pos = (id: string) => NODES.find((n) => n.id === id)!;

export const Mod81: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sel: 'ep' });
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState('ep');
  const [feedback, setFeedback] = useState({ text: '熵参数网络：把盒盖 ψ 和邻居 φ 合成 μ、σ。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (now: number) => {
      const s = stateRef.current;
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, H - 30, W, 30);

      // arrows
      ARROWS.forEach((a) => {
        const f = pos(a.from);
        const t = pos(a.to);
        const hot = a.from === s.sel || a.to === s.sel;
        ctx.strokeStyle = hot ? '#228d5c' : '#d7deea';
        ctx.lineWidth = hot ? 4 : 2;
        ctx.beginPath();
        ctx.moveTo(f.x + f.w, f.y + f.h / 2);
        ctx.lineTo(t.x, t.y + t.h / 2);
        ctx.stroke();
        // arrowhead
        const ang = Math.atan2(t.y + t.h / 2 - (f.y + f.h / 2), t.x - (f.x + f.w));
        ctx.save();
        ctx.translate(t.x - 6, t.y + t.h / 2);
        ctx.rotate(ang);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-10, -5);
        ctx.lineTo(-10, 5);
        ctx.closePath();
        ctx.fillStyle = hot ? '#228d5c' : '#b8c9a7';
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#68778f';
        ctx.font = '15px "Segoe UI", sans-serif';
        const mx = (f.x + f.w + t.x) / 2;
        const my = (f.y + t.y) / 2 + f.h / 2 - 8;
        ctx.fillText(a.label, mx, my);
      });

      // nodes
      const pulse = 0.5 + 0.5 * Math.sin(now / 260);
      NODES.forEach((n) => {
        const active = n.id === s.sel;
        ctx.fillStyle = active ? '#27446e' : '#ffffff';
        ctx.strokeStyle = active ? '#f07e47' : '#d7deea';
        ctx.lineWidth = active ? 3 + pulse * 2 : 2;
        ctx.beginPath();
        ctx.roundRect(n.x, n.y, n.w, n.h, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = active ? '#ffffff' : '#21324a';
        ctx.font = '18px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, n.x + n.w / 2, n.y + n.h / 2 + 6);
        ctx.textAlign = 'left';
      });

      // right info panel
      const cur = pos(s.sel);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(700, 40, 360, 180);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(700, 40, 360, 180);
      ctx.fillStyle = '#f07e47';
      ctx.font = '22px "Segoe UI", sans-serif';
      ctx.fillText(cur.label, 720, 74);
      ctx.fillStyle = '#21324a';
      ctx.font = '17px "Segoe UI", sans-serif';
      const words = cur.info.split('');
      let line = '';
      let yy = 110;
      for (const ch of words) {
        if (ctx.measureText(line + ch).width > 320 && line) {
          ctx.fillText(line, 720, yy);
          line = ch;
          yy += 26;
        } else line += ch;
      }
      if (line) ctx.fillText(line, 720, yy);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(performance.now());
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
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (id: string) => {
    const hit = pos(id);
    stateRef.current.sel = id;
    setSel(id);
    setFeedback({ text: hit.label + '：' + hit.info, cls: '' });
  };

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    const my = ((e.clientY - rect.top) / rect.height) * H;
    const hit = NODES.find((n) => mx >= n.x && mx <= n.x + n.w && my >= n.y && my <= n.y + n.h);
    if (hit) pick(hit.id);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} onClick={onClick} />
      <div className="chip-row">
        {NODES.map((n) => (
          <button key={n.id} className={`chip ${sel === n.id ? 'selected' : ''}`} onClick={() => pick(n.id)}>
            {n.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Mod81;
