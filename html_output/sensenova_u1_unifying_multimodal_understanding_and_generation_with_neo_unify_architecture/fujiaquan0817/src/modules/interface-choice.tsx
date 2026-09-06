import React, { useCallback, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  C,
  clearStudio,
  drawCamera,
  drawDesk,
  drawGuide,
  drawLabel,
  drawLegend,
  drawPhoto,
  useObservedCanvas,
} from './studio-kit';

const W = 960;
const H = 500;
type Choice = 'none' | 've' | 'vae' | 'native';

const labels: Record<Exclude<Choice, 'none'>, string> = {
  ve: '视觉编码器（VE）', vae: '变分自编码器（VAE）', native: '本文轻量接口',
};

// The paper (§3.1, p.7) lays out these three as side-by-side reference architectures.
// Subtitles name each one's defining interface in Chinese rather than transcribing the
// paper's English panel headings.
const subtitles: Record<Exclude<Choice, 'none'>, string> = {
  ve: '偏向理解侧',
  vae: '偏向生成侧',
  native: '轻量编码 + 类 MLP 解码',
};

export const InterfaceChoice: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [choice, setChoice] = useState<Choice>('none');
  const [checked, setChecked] = useState(false);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    clearStudio(ctx, W, H); drawDesk(ctx, W, H, 424);
    drawLabel(ctx, '判断标准：理解、生成、联合训练', W / 2, 30, C.text, 17, 'center');
    const cards: Array<{ key: Exclude<Choice, 'none'>; y: number }> = [
      { key: 've', y: 102 }, { key: 'vae', y: 205 }, { key: 'native', y: 308 },
    ];
    cards.forEach(({ key, y }) => {
      ctx.fillStyle = C.white; ctx.strokeStyle = choice === key ? C.control : C.border;
      ctx.lineWidth = choice === key ? 3 : 2; ctx.beginPath(); ctx.roundRect(28, y, 210, 72, 10); ctx.fill(); ctx.stroke();
      drawLabel(ctx, labels[key], 133, y + 27, choice === key ? C.control : C.text, 14, 'center');
      drawLabel(ctx, subtitles[key], 133, y + 50, C.muted, 10, 'center');
    });
    drawCamera(ctx, 395, 248, 0.95); drawPhoto(ctx, 525, 190, 140, 112, choice === 'native' && checked ? C.success : C.current);
    if (choice !== 'none') drawGuide(ctx, 238, cards.find((c) => c.key === choice)!.y + 36, 350, 238, C.current);
    ctx.fillStyle = C.white; ctx.strokeStyle = C.border; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(724, 102, 208, 278, 12); ctx.fill(); ctx.stroke();
    drawLabel(ctx, '三项检查', 828, 128, C.text, 15, 'center');
    const native = choice === 'native' && checked;
    const readColor = checked && choice !== 'none' ? (choice === 'vae' ? C.failure : C.success) : C.muted;
    const writeColor = checked && choice !== 'none' ? (choice === 've' ? C.failure : C.success) : C.muted;
    const jointColor = checked && choice !== 'none' ? (native ? C.success : C.failure) : C.muted;
    drawLabel(ctx, `${readColor === C.success ? '✓' : readColor === C.failure ? '×' : '○'} 支持理解输入`, 752, 180, readColor, 13);
    drawLabel(ctx, `${writeColor === C.success ? '✓' : writeColor === C.failure ? '×' : '○'} 支持像素生成`, 752, 226, writeColor, 13);
    drawLabel(ctx, `${jointColor === C.success ? '✓' : jointColor === C.failure ? '×' : '○'} 与主干联合训练`, 752, 272, jointColor, 13);
    if (checked && choice !== 'none') {
      drawLabel(ctx, native ? '三项均满足' : '仍有结构断点', 828, 322, native ? C.success : C.failure, 13, 'center');
      if (native) drawLabel(ctx, '轻量接口仍然保留', 828, 350, C.muted, 11, 'center');
    }
    drawLabel(ctx, '三种接口并列对照 · §3.1（p.7）', 28, 396, C.muted, 11);
    drawLegend(ctx, [
      { label: '用户选择', color: C.control }, { label: '检查过程', color: C.current },
      { label: '满足目标', color: C.success }, { label: '仍有断点', color: C.failure, dashed: true },
    ], 190, 459, 160);
  }, [checked, choice]);
  useObservedCanvas(canvasRef, W, H, draw);

  const select = (next: Exclude<Choice, 'none'>) => { setChoice(next); setChecked(false); };
  const clear = () => { setChoice('none'); setChecked(false); };
  const check = () => { if (choice !== 'none') setChecked(true); };
  const feedback = !checked
    ? { cls: '', text: choice === 'none' ? '先选择一种接口，再检查三项标准。' : `已选择${labels[choice as Exclude<Choice, 'none'>]}，请检查三项标准。` }
    : choice === 'native'
      ? { cls: 'good', text: '符合论文主张：轻量接口连接原生像素与词，并与主干联合训练。' }
      : choice === 've'
        ? { cls: 'bad', text: 'VE 偏向理解；像素生成仍需另一套表示。' }
        : { cls: 'bad', text: 'VAE 偏向生成；理解仍需另一套视觉入口。' };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} aria-label="三种视觉接口对理解与生成目标的结构检查" />
      <div className="ctrl" role="radiogroup" aria-label="选择视觉接口">
        {(Object.keys(labels) as Array<Exclude<Choice, 'none'>>).map((key) => (
          <button key={key} type="button" role="radio" aria-checked={choice === key} onClick={() => select(key)}>{labels[key]}</button>
        ))}
        <button type="button" onClick={check} disabled={choice === 'none'}>检查选择</button>
        <button type="button" onClick={clear}>清除选择</button>
      </div>
      <div className={`feedback ${feedback.cls}`} aria-live="polite">{feedback.text}</div>
      <blockquote className="paper-quote">
        该框架由近无损视觉接口与原生 MoT 主干组成；视觉接口采用两层卷积编码和类 MLP 解码。
        <cite>论文依据（中文释义）：SenseNova-U1, Figure 4 caption, p.7</cite>
      </blockquote>
    </div>
  );
};

export default InterfaceChoice;
