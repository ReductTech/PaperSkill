import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { clearScene, drawPaper, drawInkStroke, COLORS, drawLegend } from './calligraphyKit';
import type { WidgetProps } from './registry';
const W = 1080, H = 280;
export const Mod1_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const sRef = useRef({ blur: 0.3 });
  const [blur, setBlur] = useState(0.3);
  const [fb, setFb] = useState({ text: '调整分辨率，观察通用编码器在低分辨率下的识别表现。', cls: '' });
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = setupCanvas(c, W, H);
    c.classList.add('is-ready');
    let raf = 0;
    const tick = () => {
      const b = sRef.current.blur;
      clearScene(ctx, W, H);
      // Left: document with text
      drawPaper(ctx, 40, 30, 300, 220);
      const alpha = 1 - b * 0.7;
      const sw = 3 + b * 12;
      drawInkStroke(ctx, [{x:70,y:60},{x:310,y:60}], sw, COLORS.ink, alpha);
      drawInkStroke(ctx, [{x:70,y:90},{x:280,y:90}], sw, COLORS.ink, alpha * 0.9);
      drawInkStroke(ctx, [{x:70,y:120},{x:300,y:120}], sw, COLORS.ink, alpha * 0.8);
      drawInkStroke(ctx, [{x:70,y:150},{x:260,y:150}], sw, COLORS.ink, alpha * 0.7);
      drawInkStroke(ctx, [{x:70,y:180},{x:290,y:180}], sw, COLORS.ink, alpha * 0.6);
      // Right: error rate bar
      const err = b * 85;
      ctx.fillStyle = COLORS.ink; ctx.font = '14px sans-serif';
      ctx.fillText('通用编码器识别错误率', 400, 50);
      ctx.fillStyle = b > 0.6 ? COLORS.red : b > 0.3 ? COLORS.orange : COLORS.blue;
      ctx.fillRect(400, 70, err * 5, 40);
      ctx.strokeStyle = COLORS.border; ctx.strokeRect(400, 70, 425, 40);
      ctx.fillStyle = COLORS.ink; ctx.font = 'bold 16px sans-serif';
      ctx.fillText(err.toFixed(0) + '%', 400 + err * 5 + 10, 97);
      // Resolution label
      const res = Math.round(1288 * (1 - b * 0.65));
      ctx.fillStyle = COLORS.inkLight; ctx.font = '13px sans-serif';
      ctx.fillText('输入长边分辨率: ' + res + 'px', 400, 140);
      drawLegend(ctx, 400, 170, [
        { color: COLORS.red, label: '高错误率(>60%)' },
        { color: COLORS.orange, label: '中等(30-60%)' },
        { color: COLORS.blue, label: '较低(<30%)' },
      ]);
      raf = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(c, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100; sRef.current.blur = v; setBlur(v);
    setFb(v > 0.6 ? { text: '分辨率过低，笔画粘连，通用编码器大量误识——这正是文档图像需要字符级预训练的原因。', cls: 'bad' }
      : v > 0.3 ? { text: '笔画开始模糊，识别准确率下降。自然图像编码器对细粒度笔画不敏感。', cls: '' }
      : { text: '高分辨率下尚可辨认，但细微笔画差异（如"己/已/巳"）仍易混淆。', cls: 'good' });
  };
  return (<div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
    <div className="ctrl"><label>输入分辨率 / 模糊度 <span className="val">{blur.toFixed(2)}</span></label>
      <input type="range" min={0} max={100} value={Math.round(blur * 100)} onChange={onChange} /></div>
    <div className={`feedback ${fb.cls}`}>{fb.text}</div></div>);
};
export default Mod1_1;
