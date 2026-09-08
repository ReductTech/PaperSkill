import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Mode = 'none' | 'visual' | 'language' | 'teacher';
const words = [{ w: '抓住', v: 96 }, { w: '红色', v: 68 }, { w: '马克杯', v: 100 }, { w: '杯柄', v: 98 }, { w: '不要', v: 74 }, { w: '碰倒', v: 88 }, { w: '玻璃杯', v: 92 }];

export const LatentBridge: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<Mode>('none');
  const [similarity, setSimilarity] = useState(21);
  const loss = -(similarity / 100);
  const copy: Record<Mode, string> = {
    none: '没有专门桥接标记：杯口、杯身、杯柄与障碍证据分散在图像块中。',
    visual: '视觉侧：潜变量聚合与任务相关的局部区域；图像块仍保留细粒度信息。',
    language: '语言侧：同一个桥接标记把显著视觉区域连接到“抓住、杯柄、避障”等概念。',
    teacher: '训练侧：潜变量与大型教师 ViT 的全局 CLS 特征做余弦对齐；这项监督只用于预训练。',
  };
  return <div className="latent-demo">
    <div className="latent-layout">
      <div className={`latent-image mode-${mode}`} aria-label="红杯视觉区域热力图">
        <div className="latent-mug"><span /></div><div className="latent-glass" />
        {mode !== 'none' ? <><i className="heat heat-handle" /><i className="heat heat-body" /><i className="heat heat-glass" /></> : null}
        <div className="patch-caption">杯口 · 杯身 · 杯柄 · 桌面 · 玻璃杯</div>
      </div>
      <div className={`latent-token ${mode !== 'none' ? 'active' : ''}`}>LATENT<span>语义桥</span></div>
      <div className="language-bars">{words.map(item => <div key={item.w}><span>{item.w}</span><i style={{ width: mode === 'language' || mode === 'teacher' ? `${item.v}%` : '16%' }} /></div>)}</div>
    </div>
    <div className="chip-row" role="group" aria-label="视觉潜变量讲解阶段">
      <button className={`chip ${mode === 'none' ? 'selected' : ''}`} onClick={() => setMode('none')}>没有潜变量</button>
      <button className={`chip ${mode === 'visual' ? 'selected' : ''}`} onClick={() => setMode('visual')}>聚合视觉</button>
      <button className={`chip ${mode === 'language' ? 'selected' : ''}`} onClick={() => setMode('language')}>连接语言</button>
      <button className={`chip ${mode === 'teacher' ? 'selected' : ''}`} onClick={() => setMode('teacher')}>教师监督</button>
    </div>
    {mode === 'teacher' ? <div className="ctrl"><label>拖近 Teacher CLS <span className="val">cos = {(similarity / 100).toFixed(2)} · L_global = {loss.toFixed(2)}</span><input type="range" min="0" max="100" value={similarity} onChange={e => setSimilarity(Number(e.target.value))} /></label></div> : null}
    <div className={`feedback ${mode === 'none' ? 'bad' : mode === 'teacher' && similarity > 80 ? 'good' : ''}`} aria-live="polite">{copy[mode]}{mode === 'teacher' && similarity > 80 ? ' 当前表示已接近教师全局语义。' : ''}</div>
  </div>;
};

export default LatentBridge;
