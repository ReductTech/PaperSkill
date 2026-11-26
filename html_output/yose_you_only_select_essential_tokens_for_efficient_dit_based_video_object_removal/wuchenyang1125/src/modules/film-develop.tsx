import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Big, H, Page, Photo, T, blue, btn } from './ui';

const steps = ['几乎全是噪点', '只剩一团轮廓', '能看出人和窗', '成为清晰的一页'];

export function FilmDevelop(_props: WidgetProps) {
  const [step, setStep] = useState(0);
  const fog = 1 - step / 3;
  return <Page art={<svg viewBox="0 0 900 622" width="100%" height="100%" role="img" aria-label="生活照从噪点逐渐显影">
    <Photo covered={0} />
    <rect x="96" y="56" width="684" height="390" fill="#21324a" opacity={fog * 0.86} />
    {Array.from({ length: 24 }).map((_, index) => <circle key={index} cx={120 + (index * 53) % 640} cy={90 + (index * 79) % 320} r={3 + (index % 3)} fill="#fff" opacity={fog * 0.75} />)}
  </svg>}>
    <H>前置：噪声怎样变成画面</H>
    <T>这四步只是显影示意，不是论文里的 6 个采样步。</T>
    <div style={{ display: 'flex', gap: 8 }}>
      {steps.map((name, index) => <button key={name} type="button" style={btn(step === index)} onClick={() => setStep(index)}>{index + 1}</button>)}
    </div>
    <Big color={blue}>{steps[step]}</Big>
    <T>论文写明 MiniMax Remover 用 flow matching，最少 6 步，且不用 classifier-free guidance。</T>
  </Page>;
}
