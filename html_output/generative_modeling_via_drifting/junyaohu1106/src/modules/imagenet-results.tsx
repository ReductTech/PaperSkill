import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { BowingDancers, Chips, INK } from './danceKit';

type Row = { name: string; nfe: string; fid: number; family: 'multi' | 'one' | 'gan' | 'ours' };
const LATENT: Row[] = [
  { name: 'DiT-XL/2', nfe: '250×2', fid: 2.27, family: 'multi' },
  { name: 'SiT-XL/2', nfe: '250×2', fid: 2.06, family: 'multi' },
  { name: 'SiT-XL/2+REPA', nfe: '250×2', fid: 1.42, family: 'multi' },
  { name: 'LightningDiT-XL/2', nfe: '250×2', fid: 1.35, family: 'multi' },
  { name: 'RAE+DiT-DH-XL/2', nfe: '50×2', fid: 1.13, family: 'multi' },
  { name: 'iCT-XL/2', nfe: '1', fid: 34.24, family: 'one' },
  { name: 'Shortcut-XL/2', nfe: '1', fid: 10.6, family: 'one' },
  { name: 'MeanFlow-XL/2', nfe: '1', fid: 3.43, family: 'one' },
  { name: 'AdvFlow-XL/2', nfe: '1', fid: 2.38, family: 'one' },
  { name: 'iMeanFlow-XL/2', nfe: '1', fid: 1.72, family: 'one' },
  { name: 'Drifting B/2', nfe: '1', fid: 1.75, family: 'ours' },
  { name: 'Drifting L/2', nfe: '1', fid: 1.54, family: 'ours' },
];
const PIXEL: Row[] = [
  { name: 'ADM-G', nfe: '250×2', fid: 4.59, family: 'multi' },
  { name: 'SiD, UViT/2', nfe: '1000×2', fid: 2.44, family: 'multi' },
  { name: 'VDM++, UViT/2', nfe: '256×2', fid: 2.12, family: 'multi' },
  { name: 'SiD2, UViT/2', nfe: '512×2', fid: 1.73, family: 'multi' },
  { name: 'SiD2, UViT/1', nfe: '512×2', fid: 1.38, family: 'multi' },
  { name: 'JiT-G/16', nfe: '100×2', fid: 1.82, family: 'multi' },
  { name: 'PixelDiT/16', nfe: '200×2', fid: 1.61, family: 'multi' },
  { name: 'EPG-L/16', nfe: '1', fid: 8.82, family: 'one' },
  { name: 'BigGAN', nfe: '1', fid: 6.95, family: 'gan' },
  { name: 'GigaGAN', nfe: '1', fid: 3.45, family: 'gan' },
  { name: 'StyleGAN-XL', nfe: '1', fid: 2.3, family: 'gan' },
  { name: 'Drifting B/16', nfe: '1', fid: 1.76, family: 'ours' },
  { name: 'Drifting L/16', nfe: '1', fid: 1.61, family: 'ours' },
];
const COLOR = { multi: '#27446e', one: '#8ea0b8', gan: '#7c3aed', ours: '#228d5c' };
const PLOT = 390;
const logX = (v: number) => (Math.log(v / 1) / Math.log(40 / 1)) * PLOT;

export function ImagenetResults(_: WidgetProps) {
  const [space, setSpace] = useState<'latent' | 'pixel'>('latent');
  const rows = space === 'latent' ? LATENT : PIXEL;
  return <div className="ppt-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 396px', gap: 24 }}>
    <div className="dk-table-grid" style={{ gridTemplateColumns: '300px 118px 406px 84px', alignContent: 'start' }} role="table" aria-label="ImageNet 256 系统级对比，FID 越低越好">
      <div className="dk-muted">方法</div><div className="dk-muted">NFE</div><div className="dk-muted">FID（对数轴，越靠左越好）</div><div />
      {rows.map(r => <React.Fragment key={r.name}>
        <div style={{ color: r.family === 'ours' ? '#228d5c' : INK.text, fontWeight: r.family === 'ours' ? 800 : 500 }}>{r.name}</div>
        <div>{r.nfe}</div>
        <div style={{ position: 'relative', height: 39 }}>
          <svg viewBox={`0 0 ${PLOT + 16} 39`} width={PLOT + 16} height={39} style={{ display: 'block' }} aria-hidden="true">
            <line x1={0} x2={PLOT + 16} y1={20} y2={20} stroke={INK.axis} strokeWidth={2} />
            <circle cx={logX(r.fid) + 8} cy={20} r={r.family === 'ours' ? 12 : 9} fill={COLOR[r.family]} />
          </svg>
        </div>
        <div style={{ textAlign: 'right', fontWeight: r.family === 'ours' ? 800 : 600, color: r.family === 'ours' ? '#228d5c' : INK.text }}>{r.fid.toFixed(2)}</div>
      </React.Fragment>)}
    </div>
    <div className="dk-panel">
      <Chips value={space} options={[{ id: 'latent', label: '潜空间' }, { id: 'pixel', label: '像素' }]} onChange={setSpace} />
      <p>{space === 'latent'
        ? '1.54 优于此前所有 1-NFE 方法。三种多步方法 FID 更低，代价是上百次调用。'
        : '1.61 优于全部单步方法，与多步方法相当；SiD2 UViT/1 的 1.38 仍更低。'}</p>
      {space === 'pixel' && <p>同为一步，StyleGAN-XL 2.30 用 1574G FLOPs，本文 1.61 仅用 87G。</p>}
      <p className="dk-muted">ImageNet 256，50K 样本；生成器均从头训练。×2 为 CFG 带来的双倍调用。</p>
      <div style={{ marginTop: 'auto' }}><BowingDancers width={396} height={120} /></div>
    </div>
  </div>;
}
