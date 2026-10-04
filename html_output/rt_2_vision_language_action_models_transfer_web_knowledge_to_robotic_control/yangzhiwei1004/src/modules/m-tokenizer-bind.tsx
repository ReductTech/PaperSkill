import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// ============================================================================
// Presentation mode: hybrid linked views (left two jars; right vocabulary strip + Language-Table table).
// m-tokenizer-bind — chapter 9 active module (P4 chips, hybrid).
// Learner switches how the action vocabulary is bound: PaLI-X binds action bins
// to integer tokens; PaLM-E overwrites the 256 lowest-frequency tokens. The
// canvas shows two jars (number jar vs rare-word jar) and a vocabulary strip
// whose highlighted region moves. A static Language-Table table stays visible as
// an evidence record. Evidence: page 6 §3.2; page 8 §4.1 / page 9 Table 1.
// ============================================================================

const W = 720;
const H = 300;
const C = {
  bg: '#f5f8f0', counter: '#e7e3d8', counterEdge: '#cfc8b6', envLight: '#b8c9a7',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', axis: '#d7deea',
};

type Tok = 'pali' | 'palme';

function label(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color = C.muted) {
  ctx.fillStyle = color;
  ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
  ctx.fillText(text, x, y);
}

export const MTokenizerBind: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const tok = useRef<Tok>('pali');
  const [tokUi, setTokUi] = useState<Tok>('pali');
  const [fb, setFb] = useState({ text: '切换绑定方式，看动作 bin 落在词表的哪一段。', cls: '' });

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = 720;
    const h = 300;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = C.envLight;
    ctx.globalAlpha = 0.45;
    ctx.fillRect(0, 0, w, 30);
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.counter;
    ctx.fillRect(0, 210, w, h - 210);
    ctx.strokeStyle = C.counterEdge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 210);
    ctx.lineTo(w, 210);
    ctx.stroke();

    // two jars
    const jars = [
      { x: 100, tag: '数字', active: tok.current === 'pali', color: C.blue },
      { x: 220, tag: '少用字', active: tok.current === 'palme', color: C.purple },
    ];
    jars.forEach((j) => {
      ctx.fillStyle = '#dfe4ec';
      ctx.strokeStyle = j.active ? j.color : '#9aa4b4';
      ctx.lineWidth = j.active ? 2.6 : 1.6;
      ctx.beginPath();
      ctx.roundRect(j.x - 24, 150, 48, 60, 6);
      ctx.fill();
      ctx.stroke();
      label(ctx, j.x - 14, 186, j.tag, j.active ? j.color : C.muted);
    });

    // vocabulary strip
    const sx = 320;
    const sw = 360;
    const sy = 96;
    const sh = 44;
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(sx, sy, sw, sh);
    // three regions: 数字区 / 常用字区 / 最低频区
    const regions = [
      { frac: 0.42, name: '数字区' },
      { frac: 0.34, name: '常用字区' },
      { frac: 0.24, name: '最低频区' },
    ];
    let cx = sx;
    regions.forEach((r, i) => {
      const rw = sw * r.frac;
      const hl = (tok.current === 'pali' && i === 0) || (tok.current === 'palme' && i === 2);
      ctx.fillStyle = hl ? (i === 0 ? 'rgba(39,68,110,0.22)' : 'rgba(124,58,237,0.22)') : '#eef2f7';
      ctx.fillRect(cx, sy, rw, sh);
      ctx.strokeStyle = C.axis;
      ctx.strokeRect(cx, sy, rw, sh);
      label(ctx, cx + 6, sy + sh + 16, r.name, hl ? C.ink : C.muted);
      cx += rw;
    });
    // action-bin marker
    const mx = tok.current === 'pali' ? sx + sw * 0.2 : sx + sw * 0.88;
    ctx.fillStyle = tok.current === 'pali' ? C.blue : C.purple;
    ctx.beginPath();
    ctx.moveTo(mx, sy - 12);
    ctx.lineTo(mx - 7, sy - 24);
    ctx.lineTo(mx + 7, sy - 24);
    ctx.closePath();
    ctx.fill();
    label(ctx, mx - 26, sy - 30, '256 个动作 bin', tok.current === 'pali' ? C.blue : C.purple);

    // static Language-Table evidence note
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(320, 170, 360, 66, 6);
    ctx.stroke();
    label(ctx, 336, 192, 'Language-Table（开源仿真）', C.ink);
    label(ctx, 336, 212, 'PaLI 3B · 动作 "X Y" · X,Y ∈ {-10..+10}', C.muted);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    canvas.classList.add('is-ready');
    const loop = () => {
      render();
      rafRef.current = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (t: Tok) => {
    tok.current = t;
    setTokUi(t);
    setFb(
      t === 'pali'
        ? { text: '直接绑定到整数 token，模型不用改写词表。', cls: '' }
        : { text: '覆写 256 个最低频 token，相当于一种 symbol tuning。', cls: 'good' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-m-tokenizer-bind`} ref={canvasRef} width={W} height={H} aria-label="两种动作词表绑定方式" />
      <div className="chip-row">
        <button type="button" className={`chip ${tokUi === 'pali' ? 'selected' : ''}`} onClick={() => choose('pali')}>
          绑定到整数 token（PaLI-X）
        </button>
        <button type="button" className={`chip ${tokUi === 'palme' ? 'selected' : ''}`} onClick={() => choose('palme')}>
          覆写最低频 token（PaLM-E）
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default MTokenizerBind;
