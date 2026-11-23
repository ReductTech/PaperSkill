import React, { useState } from 'react';
import { CodeChip, MosaicArtwork, StageBadge, StudioPanel } from './glc-kit';

type ResultKey = 'natural' | 'face' | 'clic';

const copy: Record<ResultKey, {
  label: string;
  value: string;
  unit: string;
  headline: string;
  condition: string;
  caution: string;
}> = {
  natural: {
    label: '自然图像工作范围',
    value: '< 0.04',
    unit: 'bpp',
    headline: '论文在自然图像实验中报告低于 0.04 bpp 的高视觉质量工作点。',
    condition: 'CLIC2020 原始分辨率；感知指标 DISTS、FID、KID 为重点。',
    caution: '这是一个报告范围，不等于任意图片、任意实现都能稳定达到。'
  },
  face: {
    label: '人脸图像工作范围',
    value: '< 0.01',
    unit: 'bpp',
    headline: '人脸模型把工作码率推到低于 0.01 bpp，同时尝试保持属性一致。',
    condition: 'CelebAHQ 512×512；人脸专用 f=1/32、M=1024 配置。',
    caution: '极低码率下生成能力更强，但精确身份细节仍需单独核查。'
  },
  clic: {
    label: '与 MS-ILLM 对齐 FID',
    value: '≈45',
    unit: '% fewer bits',
    headline: '在相同 FID 的码率—感知曲线位置，GLC 比 MS-ILLM 少用约 45% 比特。',
    condition: 'CLIC2020；这是等 FID 条件比较，不是固定 bpp 的逐图一致节省。',
    caution: 'FID 是数据集级 patch 统计，低 FID 不证明每张图都忠实保留文字或结构。'
  }
};

export function GlcResults() {
  const [result, setResult] = useState<ResultKey>('clic');
  const selected = copy[result];
  return <div className="glc-scene glc-results-page">
    <div className="glc-result-cards" role="group" aria-label="选择主要结果">
      {(Object.keys(copy) as ResultKey[]).map(key => {
        const item = copy[key];
        return <button key={key} className={`glc-result-card ${result === key ? 'is-active' : ''}`}
          onClick={() => setResult(key)} aria-pressed={result === key}>
          <span>{item.label}</span>
          <strong>{item.value}<small>{item.unit}</small></strong>
          <i aria-hidden="true" />
        </button>;
      })}
    </div>
    <StudioPanel className={`glc-result-detail is-${result}`} tone={result === 'clic' ? 'green' : result === 'face' ? 'purple' : 'blue'}>
      <div className="glc-result-copy">
        <StageBadge tone={result === 'clic' ? 'green' : result === 'face' ? 'purple' : 'blue'}>
          {result === 'clic' ? '等 FID 条件' : '报告工作点'}
        </StageBadge>
        <h3>{selected.headline}</h3>
        <p>{selected.condition}</p>
        <div className="glc-result-caution">{selected.caution}</div>
      </div>
      <div className="glc-result-visual">
        <MosaicArtwork detail={result === 'natural' ? 86 : result === 'face' ? 62 : 76} mode="latent" generative
          label="主要结果对应的感知压缩示意" />
        {result === 'clic'
          ? <div className="glc-equal-fid">
            <div><span>MS-ILLM</span><b>100<small>相对比特</small></b></div>
            <div className="is-green"><span>GLC</span><b>55<small>−45%</small></b></div>
            <p>条形经过归一化，仅表现等 FID 对齐后的相对比特量。</p>
          </div>
          : <div className="glc-range-stamp">
            <CodeChip tone={result === 'face' ? 'purple' : 'blue'}>{selected.condition.split('；')[0]}</CodeChip>
            <b>{selected.value}<span>{selected.unit}</span></b>
            <p>低 bpp 不等于“每张图都无损保真”。</p>
          </div>}
      </div>
    </StudioPanel>
    <div className="glc-result-rule">
      <span>主指标方向</span>
      <b>DISTS ↓ · FID ↓ · KID ↓ · bpp ↓</b>
      <span>完整性指标</span>
      <b>PSNR ↑ · MS-SSIM ↑</b>
    </div>
  </div>;
}
