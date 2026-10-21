import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第2章：提示类型（点 / 框 / 文字）→ 有效掩码。
// 交互：点提示=单击画布放点；框提示=拖拽画框；文字提示=点击切换对象。
// 对象用真实猫 / 狗照片（圆形裁切）承载，替代卡通图形。
const W = 1080;
const H = 340;

type Obj = 'cat' | 'dog';
type Mode = 'point' | 'box' | 'text';

const GEO: Record<Obj, { cx: number; cy: number; r: number; label: string; emoji: string }> = {
  cat: { cx: 420, cy: 235, r: 100, label: '猫', emoji: '🐱' },
  dog: { cx: 690, cy: 250, r: 88, label: '狗', emoji: '🐶' },
};
const IMG_SRC: Record<Obj, string> = {
  cat: './images/real-cat.jpg',
  dog: './images/real-dog.jpg',
};

function hitPoint(x: number, y: number): Obj | null {
  let best: Obj | null = null;
  let bestD = Infinity;
  (['cat', 'dog'] as Obj[]).forEach((k) => {
    const g = GEO[k];
    const d = Math.hypot(x - g.cx, y - g.cy);
    if (d <= g.r + 24 && d < bestD) {
      bestD = d;
      best = k;
    }
  });
  return best;
}

export const Ch2Prompts: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    mode: Mode;
    point: { x: number; y: number } | null;
    box: { x1: number; y1: number; x2: number; y2: number } | null;
    draft: { x1: number; y1: number; x2: number; y2: number } | null;
    obj: Obj | null;
    textTarget: Obj;
    imgs: Record<Obj, HTMLImageElement | null>;
  }>({
    mode: 'point',
    point: null,
    box: null,
    draft: null,
    obj: 'cat',
    textTarget: 'cat',
    imgs: { cat: null, dog: null },
  });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>('point');
  const [feedback, setFeedback] = useState({
    text: '先在照片上点一个前景点试试（点提示）。',
    cls: 'good',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    // 加载真实照片
    (['cat', 'dog'] as Obj[]).forEach((k) => {
      const img = new Image();
      img.src = IMG_SRC[k];
      img.onload = () => {
        stateRef.current.imgs[k] = img;
      };
      img.onerror = () => {
        stateRef.current.imgs[k] = null;
      };
    });

    const drawPhoto = (key: Obj, cx: number, cy: number, r: number) => {
      const img = stateRef.current.imgs[key];
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      if (img) {
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;
        const scale = Math.max((r * 2) / iw, (r * 2) / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
      } else {
        // 照片未加载时的占位
        ctx.fillStyle = '#dde7d3';
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        ctx.fillStyle = '#8fa878';
        ctx.font = '30px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(key === 'cat' ? '🐱' : '🐶', cx, cy);
        ctx.textAlign = 'left';
      }
      ctx.restore();
      // 照片圆框
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = '#b9c6b0';
      ctx.lineWidth = 3;
      ctx.stroke();
    };

    const render = (s: typeof stateRef.current) => {
      ctx.clearRect(0, 0, W, H);
      // 场景背景：渐变面板 + 柔光 + 网格纹理 + 提示装饰
      const bgGrad = ctx.createLinearGradient(36, 24, W - 36, H - 24);
      bgGrad.addColorStop(0, '#f8fbf4');
      bgGrad.addColorStop(1, '#eef3fb');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.roundRect(36, 24, W - 72, H - 48, 14);
      ctx.fill();
      // 中央柔光
      const glow = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 330);
      glow.addColorStop(0, 'rgba(255,255,255,0.55)');
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(36, 24, W - 72, H - 48);
      // 极淡网格纹理（操作台质感）
      ctx.strokeStyle = 'rgba(39,68,110,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let gx = 80; gx < W - 40; gx += 72) {
        ctx.moveTo(gx, 40);
        ctx.lineTo(gx, H - 40);
      }
      for (let gy = 55; gy < H - 30; gy += 58) {
        ctx.moveTo(48, gy);
        ctx.lineTo(W - 48, gy);
      }
      ctx.stroke();
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(36, 24, W - 72, H - 48, 14);
      ctx.stroke();
      // 四角提示类型装饰芯片
      const chip = (x: number, y: number, ico: string, txt: string, col: string) => {
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(x, y, 150, 30, 15);
        ctx.fill();
        ctx.strokeStyle = col;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = col;
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillText(`${ico}  ${txt}`, x + 12, y + 21);
        ctx.restore();
      };
      chip(92, 72, '+', '前景点', '#f07e47');
      chip(W - 236, 72, '▭', '边界框', '#27446e');
      chip(92, H - 64, '💬', '文字提示', '#7c3aed');
      chip(W - 236, H - 64, '◎', '组合提示', '#228d5c');

      // 两个对象（真实照片）
      (['cat', 'dog'] as Obj[]).forEach((k) => {
        const g = GEO[k];
        const hl = s.obj === k;
        drawPhoto(k, g.cx, g.cy, g.r);
        if (hl) {
          // 仅描边高亮，不再盖绿色滤镜，保持照片清晰
          ctx.strokeStyle = '#228d5c';
          ctx.lineWidth = 5;
          ctx.shadowColor = 'rgba(34,141,92,0.55)';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(g.cx, g.cy, g.r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(g.cx, g.cy, g.r, 0, Math.PI * 2);
          ctx.stroke();
        }
        // 标签
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = hl ? '#1e7a4a' : '#44505f';
        ctx.fillText(`${g.emoji} ${g.label}`, g.cx, g.cy + g.r + 24);
        ctx.textAlign = 'left';
      });

      // 模式提示
      ctx.fillStyle = '#21324a';
      ctx.font = '17px "Segoe UI", sans-serif';
      ctx.fillText(
        s.mode === 'point'
          ? '👆 点提示：单击画布放置一个前景点'
          : s.mode === 'box'
            ? '✋ 框提示：按住拖拽画一个边界框'
            : '💬 文字提示：点击画布切换“猫 / 狗”',
        60,
        50
      );

      // 点提示
      if (s.mode === 'point' && s.point) {
        ctx.fillStyle = '#f07e47';
        ctx.beginPath();
        ctx.arc(s.point.x, s.point.y, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#f07e47';
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillText('● 前景点', s.point.x + 14, s.point.y - 12);
      }
      // 框提示
      const box = s.mode === 'box' && (s.box || s.draft) ? s.box || s.draft : null;
      if (box) {
        ctx.strokeStyle = '#27446e';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1);
        ctx.setLineDash([]);
        ctx.fillStyle = '#27446e';
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillText('▭ 框', box.x1, Math.max(16, box.y1 - 8));
      }
      // 文字提示
      if (s.mode === 'text') {
        ctx.fillStyle = '#7c3aed';
        ctx.font = '17px "Segoe UI", sans-serif';
        ctx.fillText(`“${s.textTarget === 'cat' ? '一只猫' : '一只狗'}”`, W - 220, 60);
      }
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
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

    // —— 画布指针交互 ——
    const getPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };
    const onDown = (e: PointerEvent) => {
      const p = getPos(e);
      if (stateRef.current.mode === 'point') {
        const hit = hitPoint(p.x, p.y);
        if (!hit) return;
        stateRef.current.point = p;
        stateRef.current.obj = hit;
        const g = GEO[hit];
        setFeedback({
          text: `点提示：在「${g.label}」上放了一个前景点 → 返回「${g.label}」的有效掩码。`,
          cls: 'good',
        });
      } else if (stateRef.current.mode === 'box') {
        stateRef.current.draft = { x1: p.x, y1: p.y, x2: p.x, y2: p.y };
        stateRef.current.box = null;
      } else {
        const hit = hitPoint(p.x, p.y);
        const t = hit || (stateRef.current.textTarget === 'cat' ? 'dog' : 'cat');
        stateRef.current.textTarget = t;
        stateRef.current.obj = t;
        const g = GEO[t];
        setFeedback({
          text: `文字提示：“${t === 'cat' ? '一只猫' : '一只狗'}” → 用 CLIP 文本嵌入作为提示，抠出「${g.label}」的掩码。`,
          cls: 'good',
        });
      }
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (stateRef.current.mode !== 'box' || !stateRef.current.draft) return;
      const p = getPos(e);
      stateRef.current.draft.x2 = p.x;
      stateRef.current.draft.y2 = p.y;
    };
    const onUp = (e: PointerEvent) => {
      if (stateRef.current.mode !== 'box' || !stateRef.current.draft) return;
      const d = stateRef.current.draft;
      const w = Math.abs(d.x2 - d.x1);
      const h = Math.abs(d.y2 - d.y1);
      if (w > 16 && h > 16) {
        stateRef.current.box = {
          x1: Math.min(d.x1, d.x2),
          y1: Math.min(d.y1, d.y2),
          x2: Math.max(d.x1, d.x2),
          y2: Math.max(d.y1, d.y2),
        };
        let hit: Obj | null = null;
        const b = stateRef.current.box;
        for (const k of ['cat', 'dog'] as Obj[]) {
          const g = GEO[k];
          if (g.cx >= b.x1 - 12 && g.cx <= b.x2 + 12 && g.cy >= b.y1 - 12 && g.cy <= b.y2 + 12) {
            hit = k;
          }
        }
        stateRef.current.obj = hit;
        setFeedback(
          hit
            ? { text: `框提示：边界框框住了「${GEO[hit].label}」→ 返回框内目标的掩码。`, cls: 'good' }
            : { text: '框提示：这个框没有框住猫或狗，再试一次。', cls: 'bad' }
        );
      }
      stateRef.current.draft = null;
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    return () => {
      stop();
      disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
  }, []);

  const choose = (m: Mode) => {
    stateRef.current.mode = m;
    setMode(m);
    if (m === 'point') {
      stateRef.current.box = null;
      setFeedback({ text: '点提示：在照片上单击，给猫或狗放一个前景点。', cls: 'good' });
    } else if (m === 'box') {
      stateRef.current.point = null;
      setFeedback({ text: '框提示：在照片上按住拖拽，画一个边界框框住目标。', cls: 'good' });
    } else {
      setFeedback({ text: '文字提示：点击画布在「猫 / 狗」之间切换，看 CLIP 文本提示如何抠图。', cls: 'good' });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={mode === 'point' ? 'btn on' : 'btn'} onClick={() => choose('point')}>
          👆 点提示
        </button>
        <button className={mode === 'box' ? 'btn on' : 'btn'} onClick={() => choose('box')}>
          ▭ 框提示
        </button>
        <button className={mode === 'text' ? 'btn on' : 'btn'} onClick={() => choose('text')}>
          💬 文字提示
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Prompts;
