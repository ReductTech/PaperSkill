import React, { useState } from 'react';
import { Feedback, FormulaTerm, Photo, useTween } from './blip-kit';

export function BlipFiltering() {
  const [allowOriginal, setAllowOriginal] = useState(false);
  const [allowSynthetic, setAllowSynthetic] = useState(true);
  const originalClip = useTween(allowOriginal ? 1 : 0);
  const syntheticClip = useTween(allowSynthetic ? 1 : 0);
  const retained = Number(allowOriginal) + Number(allowSynthetic);
  const cards = [
    { key: 'web', title: '原网页文字', term: 'T_w', meaning: 'T_w：网页原有的配套文本；不一定描述可见图像。', text: '“旅行随笔的第七天”', keep: allowOriginal, lift: originalClip, toggle: () => setAllowOriginal(!allowOriginal) },
    { key: 'synthetic', title: '合成描述', term: 'T_s', meaning: 'T_s：Captioner为同一张网页图像生成的合成描述。', text: '“撒着巧克力碎的蛋糕”', keep: allowSynthetic, lift: syntheticClip, toggle: () => setAllowSynthetic(!allowSynthetic) },
  ];
  return <div className="blip-page" style={{ width: '100%', height: '100%', position: 'relative', color: '#21324a' }}>
    <div style={{ position: 'absolute', left: 0, top: 0, width: 470, height: 420, background: '#f5f1e6', borderRadius: 24, padding: 24, boxSizing: 'border-box' }}>
      <Photo kind="cake" width={422} height={270} />
      <p style={{ fontSize: 'var(--ppt-body-text)', lineHeight: 1.4, margin: '18px 0 0' }}>同一张网页图像<br />两份文字都要接受检查。</p>
    </div>
    {cards.map((card, index) => <div key={card.key} style={{ position: 'absolute', left: 510 + index * 472, top: 10 - card.lift * 10, width: 444, height: 420, boxSizing: 'border-box', background: card.keep ? '#fff' : '#f1f0eb', border: `3px solid ${card.keep ? '#27446e' : '#b9c0c9'}`, borderRadius: 18, boxShadow: '0 10px 20px #21324a0c' }}>
      <div style={{ position: 'absolute', left: 24, top: 22, width: 390, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}><strong style={{ fontSize: 'var(--ppt-body-heading)', lineHeight: 1.25 }}>{card.title}</strong><FormulaTerm meaning={card.meaning}>{card.term}</FormulaTerm></div>
      <p style={{ position: 'absolute', left: 24, top: 102, width: 390, height: 90, fontSize: 'var(--ppt-body-text)', lineHeight: 1.4, margin: 0 }}>{card.text}</p>
      <button type="button" aria-pressed={card.keep} onClick={card.toggle} style={{ position: 'absolute', left: 24, top: 218, width: 390, height: 70, fontSize: 'var(--ppt-body-text)', lineHeight: 1.3, padding: '12px 10px', borderRadius: 10, border: `2px solid ${card.keep ? '#27446e' : '#68778f'}`, color: card.keep ? '#fff' : '#21324a', background: card.keep ? '#27446e' : '#fff', cursor: 'pointer' }}>{card.keep ? '审核夹：保留' : '审核夹：拒绝'}</button>
      <p style={{ position: 'absolute', left: 24, top: 320, width: 390, fontSize: 'var(--ppt-body-text)', color: '#68778f', lineHeight: 1.4, margin: 0 }}>{card.keep ? '纳入训练图文对' : '不纳入训练图文对'}</p>
    </div>)}
    <div style={{ position: 'absolute', left: 0, right: 0, top: 466, display: 'flex', alignItems: 'center', gap: 18, fontSize: 'var(--ppt-body-text)', lineHeight: 1.4 }}><span>网页图像贡献 <b>{retained}</b> 对；人标对另留。</span><span style={{ marginLeft: 'auto' }}>此处模拟决策，不运行真实 ITM。</span></div>
    <div style={{ position: 'absolute', top: 540, left: 0, right: 0 }}>
      <Feedback tone={allowOriginal ? 'red' : allowSynthetic ? 'green' : 'blue'}>{allowOriginal ? '保留背景随笔会把不描述画面的文字带进训练集；过滤器的决定也可能出错。' : allowSynthetic ? '这里保留视觉描述、拒绝背景随笔；原文与合成文本接受相同的匹配检查。' : '两份文字都被拒绝，这张网页图像暂不贡献训练对；人标数据仍保留。'}</Feedback>
    </div>
  </div>;
}
