import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COLORS, clearScene, drawPaperSheet, drawArrow } from './paper-kit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const STEPS = [
  { label: '原文', tool: '—', note: '起点：未改写的原文。' },
  { label: '翻译', tool: 'translateLocally（English → Spanish → German → English）', note: '多语言往返翻译，靠语义损失打乱风格；可读性与语义明显下降。' },
  { label: '混淆', tool: 'PEGASUS', note: '逐行释义，磨掉作者的节奏；代价与翻译相近。' },
  { label: '模仿', tool: '自托管 Ollama + Negentropy-claude-opus-4.7-9B-GGUF', note: '以随机人设重写，把前两步弄崩的可读性补回来。' },
  { label: '注入', tool: 'pyUnicodeSteganography → SilverSpeak → eng', note: '最后执行：插入零宽字符、替换同形字、替换拼写变体。因为注入会破坏它之前的所有文本处理，所以必须放在最后。' },
];

export const Ch6Mod1: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(false);
  const [fb, setFb] = useState({ text: STEPS[0].note, cls: '' });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (s: number) => {
      clearScene(ctx, W, H);
      drawPaperSheet(ctx, 60, 44, 960, 180);
      for (let i = 0; i < STEPS.length; i++) {
        const x = 110 + i * 172;
        const active = i <= s;
        ctx.fillStyle = active ? 'rgba(39,68,110,0.14)' : '#ffffff';
        ctx.fillRect(x, 80, 140, 60);
        ctx.strokeStyle = active ? (i === 4 ? COLORS.green : COLORS.blue) : COLORS.line;
        ctx.lineWidth = active ? 5 : 2;
        ctx.strokeRect(x, 80, 140, 60);
        ctx.fillStyle = active ? (i === 4 ? COLORS.green : COLORS.blue) : COLORS.muted;
        ctx.font = '30px "PingFang SC", sans-serif';
        ctx.fillText(String(i + 1), x + 16, 122);
        if (i < STEPS.length - 1) {
          drawArrow(ctx, x + 140, 110, x + 172, 110, i < s ? COLORS.blue : COLORS.line);
        }
      }
    };

    const tick = () => {
      render(step);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; };
    const start = () => { if (!raf.current) raf.current = requestAnimationFrame(tick); };
    const off = observeCanvas(canvas, start, stop);
    return () => { stop(); off(); };
  }, [step]);

  const go = (next: number) => {
    const n = Math.max(0, Math.min(STEPS.length - 1, next));
    setStep(n);
    setFb({ text: STEPS[n].note, cls: n === 4 ? 'good' : '' });
  };

  useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(() => {
      setStep((prev) => {
        const nextStep = (prev + 1) % STEPS.length;
        setFb({ text: STEPS[nextStep].note, cls: nextStep === 4 ? 'good' : '' });
        return nextStep;
      });
    }, 1400);
    return () => window.clearInterval(id);
  }, [auto]);

  const current = STEPS[step];

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button className="chip" onClick={() => { setAuto(false); go(0); }}>重置</button>
        <button className="chip" onClick={() => { setAuto(false); go(step - 1); }} disabled={step === 0}>上一步</button>
        <button className="chip" onClick={() => { setAuto(false); go(step + 1); }} disabled={step === STEPS.length - 1}>下一步</button>
        <button className={'chip' + (auto ? ' selected' : '')} onClick={() => setAuto(!auto)}>{auto ? '暂停' : '自动播放'}</button>
        <span className="val">{step + 1} / {STEPS.length}</span>
      </div>
      <div className="detail-panel" style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>第 {step + 1} 步：{current.label}</div>
        <div>工具：{current.tool}</div>
      </div>
      <div className={'feedback ' + fb.cls}>{fb.text}</div>
    </div>
  );
};

export default Ch6Mod1;
