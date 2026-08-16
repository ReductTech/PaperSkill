import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { useAutoSequence } from '../lib/useAutoSequence';
import { MVL, clearPitchScene, drawPitch, drawSceneLabel, roundRect, useCanvasSurface } from './football-analogy';

const OPTIONS = [4, 8, 16, 32, 64];
const FEEDBACK: Record<number, string> = {
  4: '4 个采样帧对应 1,024 个 dense visual tokens，也就是 4×256。',
  8: '8 个采样帧对应 2,048 个 dense visual tokens；采样帧翻倍，输入 token 也随之翻倍。',
  16: '16 个采样帧对应 4,096 个 dense visual tokens；静态草坪也会被重复编码。',
  32: '32 个采样帧对应 8,192 个 dense visual tokens；重复区域继续随采样帧数累积。',
  64: '64 个采样帧对应 16,384 个 dense visual tokens；更多 token 不代表同比增加的新时间信息。'
};

export const DenseTokenGrowth: React.FC<WidgetProps> = () => {
  const [optionIndex, setOptionIndex] = useState(0);
  const frames = OPTIONS[optionIndex];
  const auto = useAutoSequence(OPTIONS.length, optionIndex, setOptionIndex, 820);
  const tokens = frames * 256;
  const ref = useCanvasSurface(560, 240, (ctx) => {
    clearPitchScene(ctx, 560, 240);
    for (let i = 0; i < 4; i += 1) {
      drawPitch(ctx, 22, 24 + i * 48, 250, 38);
      ctx.fillStyle = `rgba(196,63,82,${Math.min(.09 + frames / 120, .42)})`;
      ctx.fillRect(24, 26 + i * 48, 246, 34);
      drawSceneLabel(ctx, i === 0 ? '新画面' : '重复草坪', 34, 48 + i * 48, i === 0 ? MVL.blue : MVL.red);
    }
    ctx.fillStyle = MVL.line; roundRect(ctx, 322, 26, 180, 168, 8); ctx.fill();
    const barH = 28 + (tokens / 16384) * 122;
    ctx.fillStyle = frames === 64 ? MVL.red : frames === 4 ? MVL.blue : MVL.orange;
    roundRect(ctx, 357, 177 - barH, 110, barH, 6); ctx.fill();
    ctx.fillStyle = MVL.ink; ctx.font = '700 18px "Segoe UI"'; ctx.textAlign = 'center';
    ctx.fillText(tokens.toLocaleString('en-US'), 412, 212);
    ctx.font = '12px "Segoe UI"'; ctx.fillStyle = MVL.muted; ctx.fillText('dense visual tokens', 412, 229); ctx.textAlign = 'left';
  }, [frames]);

  return <div className="mvl-widget">
    <canvas ref={ref} width={560} height={240} role="img" aria-label={`${frames} 个采样帧产生 ${tokens} 个 dense visual tokens`}>采样帧越多，dense visual token 数线性增长。</canvas>
    <div className="mvl-control" role="group" aria-label="采样帧数">
      <span className="mvl-control-label">采样帧数</span>
      <label className="mvl-slider-row">
        <span className="mvl-a11y-table">拖动选择采样帧数</span>
        <input
          type="range"
          min={0}
          max={OPTIONS.length - 1}
          step={1}
          value={optionIndex}
          aria-label="采样帧数滑块"
          aria-valuetext={`${frames} 个采样帧，对应 ${tokens.toLocaleString('en-US')} 个 dense visual tokens`}
          onChange={(event) => auto.select(Number(event.target.value))}
        />
      </label>
      {OPTIONS.map((n, index) => <button key={n} className={`chip ${frames === n ? 'selected' : ''}`} onClick={() => auto.select(index)} aria-pressed={frames === n}>{n} 帧</button>)}
      <button className="tiny ghost mvl-play-control" onClick={auto.toggle} aria-pressed={auto.playing}>{auto.playing ? '暂停增长' : '播放增长'}</button>
      <strong className="mvl-value">{tokens.toLocaleString('en-US')} token</strong>
    </div>
    <div className={`feedback ${frames === 64 ? 'bad' : frames === 4 ? '' : 'good'}`} aria-live="polite">{FEEDBACK[frames]}</div>
    <table className="mvl-a11y-table"><caption>采样帧数与 dense visual token 对照</caption><tbody>{OPTIONS.map(n => <tr key={n}><th>{n} 帧</th><td>{(n * 256).toLocaleString('en-US')} token</td></tr>)}</tbody></table>
  </div>;
};
