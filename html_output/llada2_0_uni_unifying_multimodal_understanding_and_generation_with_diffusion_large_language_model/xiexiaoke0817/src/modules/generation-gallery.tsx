import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Notice, Segmented } from './common';
import { assetUrl, handleImageError } from './asset-url';

type GalleryMode = 'portrait' | 'text' | 'layout';

const galleries = {
  portrait: {
    label: '人物与材质',
    note: '观察钩花衣料、饮水动作、皮肤与光照的一致性。这些是论文 Figure 2 的定性样例，不等同于人工盲测结论。',
    samples: [
      { label: '钩花上衣女孩', src: assetUrl('fig2-crochet-girl.png') },
      { label: '喝水女孩', src: assetUrl('fig2-drinking-girl.png') },
      { label: '蓝色薄纱材质', src: assetUrl('fig2-blue-chiffon.png') },
    ],
  },
  text: {
    label: '图中文字',
    note: '分别观察中文标题、LLaDA2.0-Uni 字样、城市名称和面包店菜单。论文同时承认密集文本生成仍有改进空间。',
    samples: [
      { label: '春晖花朝', src: assetUrl('fig2-spring-poster.png') },
      { label: '诗意中秋', src: assetUrl('fig2-midautumn-poster.png') },
      { label: 'LLaDA2.0-Uni', src: assetUrl('fig2-llada-text.png') },
      { label: '巴黎 / 东京 / 纽约', src: assetUrl('fig2-city-text.png') },
      { label: '面包店菜单', src: assetUrl('fig2-bakery-menu.png') },
    ],
  },
  layout: {
    label: '构图与风格',
    note: '同一模型覆盖中国风人物、角色插画和节庆中国龙；这里展示风格覆盖面，不把单张样例解释为总体胜率。',
    samples: [
      { label: '中国风僧侣', src: assetUrl('fig2-monk.png') },
      { label: '柴犬厨师', src: assetUrl('fig2-dog-chef.png') },
      { label: '红色中国龙', src: assetUrl('fig2-red-dragon.png') },
    ],
  },
} satisfies Record<GalleryMode, { label: string; note: string; samples: Array<{ label: string; src: string }> }>;

export const GenerationGalleryV4: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<GalleryMode>('portrait');
  const [sampleIndex, setSampleIndex] = useState(0);
  const [zoom, setZoom] = useState(100);
  const gallery = galleries[mode];
  const sample = gallery.samples[Math.min(sampleIndex, gallery.samples.length - 1)];

  const changeMode = (value: string) => {
    setMode(value as GalleryMode);
    setSampleIndex(0);
    setZoom(100);
  };

  return (
    <div className="ll-widget figure2-gallery">
      <Segmented label="论文 Figure 2 样例" value={mode} onChange={changeMode} items={[
        { value: 'portrait', label: '人物与材质' },
        { value: 'text', label: '图中文字' },
        { value: 'layout', label: '构图与风格' },
      ]} />
      <div className="figure2-sample-tabs" role="group" aria-label={`${gallery.label}样例选择`}>
        {gallery.samples.map((item, index) => <button type="button" key={item.label} className={sampleIndex === index ? 'is-active' : ''} aria-pressed={sampleIndex === index} onClick={() => { setSampleIndex(index); setZoom(100); }}>{item.label}</button>)}
      </div>
      <div className="figure2-gallery-stage" role="img" aria-label={`论文 Figure 2：${sample.label}`}>
        <img src={sample.src} alt={`论文 Figure 2 样例：${sample.label}`} onError={handleImageError} style={{ transform: `scale(${zoom / 100})` }} />
        <span>{sample.label}</span>
      </div>
      <div className="ctrl">
        <label>局部放大 <span className="val">{zoom}%</span></label>
        <input aria-label="调整样例放大比例" type="range" min="100" max="180" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
      </div>
      <Notice>{gallery.note}</Notice>
    </div>
  );
};
