import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import { Feedback, PhotoButton, TissueFrame } from './photo-kit';

type LossKey = 'adv' | 'vgg' | 'l1';

export function Ch3Loss() {
  const [enabled, setEnabled] = useState<Record<LossKey, boolean>>({ adv: true, vgg: true, l1: true });
  const count = Object.values(enabled).filter(Boolean).length;
  const all = count === 3;
  const toggle = (key: LossKey) => {
    const next = { ...enabled, [key]: !enabled[key] };
    if (Object.values(next).some(Boolean)) setEnabled(next);
  };
  return <div className="photo-page photo-split is-wide">
    <div className="photo-scene photo-desk" style={{ padding: 22 }}>
      <div className="photo-compare" style={{ height: '100%', gridTemplateRows: '1fr auto' }}>
        <TissueFrame state="low" label="低质量视频拼接" />
        <TissueFrame state="clean" label="学习式恢复结果示意" />
        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          <div className="photo-stat"><strong>真实感</strong><span>{enabled.adv ? '对抗检查开启' : '无对抗检查'}</span></div>
          <div className="photo-stat"><strong>结构特征</strong><span>{enabled.vgg ? 'VGG 视角开启' : '无感知约束'}</span></div>
          <div className="photo-stat"><strong>像素差异</strong><span>{enabled.l1 ? 'L1 标尺开启' : '无逐像素约束'}</span></div>
        </div>
      </div>
    </div>
    <aside className="photo-panel">
      <span className="photo-kicker">生成器目标</span>
      <div className="photo-rule" style={{ marginTop: 14 }}>
        <span><SymbolHint meaning="L_G：生成器总训练目标">L_G</SymbolHint> = <SymbolHint meaning="L_adv：均方对抗损失，关注判别器眼中的真实感">L_adv</SymbolHint> + <SymbolHint meaning="L_VGG：VGG 感知损失，约束结构特征">L_VGG</SymbolHint> + <SymbolHint meaning="L_1：L1 像素差异损失">L_1</SymbolHint></span>
      </div>
      <div className="photo-stack" style={{ marginTop: 14 }}>
        <PhotoButton selected={enabled.adv} onClick={() => toggle('adv')}>均方对抗损失 · 真实感</PhotoButton>
        <PhotoButton selected={enabled.vgg} onClick={() => toggle('vgg')}>VGG 感知损失 · 结构</PhotoButton>
        <PhotoButton selected={enabled.l1} onClick={() => toggle('l1')}>L1 损失 · 像素差异</PhotoButton>
      </div>
      <p>论文列出的三项权重均为 1。单独关闭某项时，本页只说明对应约束消失，不编造性能变化。</p>
      <Feedback tone={all ? 'green' : 'orange'}>{all
        ? '三者同时开启，与论文报告的生成器配置一致。'
        : count
          ? '教学示意：去掉某项会失去对应的约束视角；真实效果仍需消融数据。'
          : '至少保留一项监督，不能构造无目标训练状态。'}</Feedback>
    </aside>
  </div>;
}
