import React, { useState } from 'react';
import { CodeChip, MosaicArtwork, StageBadge, StudioPanel } from './glc-kit';

type App = 'compress' | 'restore' | 'style';

const details: Record<App, { label: string; caption: string; encoder: string; decoder: string; feedback: string }> = {
  compress: {
    label: '普通压缩',
    caption: '原图直接进入压缩编码器',
    encoder: '压缩编码 E',
    decoder: '生成式解码 D',
    feedback: '标准路径：原图 → E → 潜空间变换编码 → D → 重建。'
  },
  restore: {
    label: '恢复并压缩',
    caption: '噪声图直接映射到干净潜码',
    encoder: '恢复编码 E_restore',
    decoder: '生成式解码 D',
    feedback: '恢复编码器把失真图 x_d 映射到干净潜码 l_c，省去串联 Restormer 的额外网络。'
  },
  style: {
    label: '风格化解码',
    caption: '同一潜码换一种解码器',
    encoder: '压缩编码 E',
    decoder: '风格解码 D_style',
    feedback: '编码端不变；替换潜解码器后，同一码流可解码为不同风格。'
  }
};

export function GlcApplications() {
  const [app, setApp] = useState<App>('restore');
  const current = details[app];
  return <div className="glc-scene glc-app-page">
    <aside className="glc-app-menu">
      <StageBadge tone="green">潜空间复用</StageBadge>
      <h3>选择应用路径</h3>
      {(Object.keys(details) as App[]).map(item => <button key={item} className={app === item ? 'is-active' : ''}
        onClick={() => setApp(item)} aria-pressed={app === item}>
        <span>{details[item].label}</span>
        <b>{item === 'compress' ? '基准' : item === 'restore' ? '编码器' : '解码器'}</b>
      </button>)}
      <div className={`glc-feedback is-${app === 'compress' ? 'blue' : 'green'}`} aria-live="polite">{current.feedback}</div>
      <p className="glc-note">这些是论文演示应用，不等同于已部署的通用生产系统。</p>
    </aside>
    <div className="glc-app-main">
      <StudioPanel className="glc-app-path" tone="green">
        <div className="glc-app-path-title"><span>{current.caption}</span><CodeChip tone="green">共享潜空间</CodeChip></div>
        <div className="glc-app-flow">
          <div className={`glc-app-image ${app === 'restore' ? 'is-noisy' : ''}`}>
            <MosaicArtwork detail={app === 'restore' ? 56 : 82} mode="latent" generative
              label={app === 'restore' ? '带噪输入示意图' : '输入图像示意图'} />
            <span>{app === 'restore' ? '失真输入 x_d' : '输入图像 x'}</span>
          </div>
          <span className="glc-path-arrow" aria-hidden="true">→</span>
          <div className={`glc-app-block is-blue ${app === 'restore' ? 'is-swapped' : ''}`}>
            <b>{current.encoder}</b><span>{app === 'restore' ? '替换编码目标' : '常规编码'}</span>
          </div>
          <span className="glc-path-arrow" aria-hidden="true">→</span>
          <div className="glc-app-latent"><CodeChip tone="purple">l / l_c</CodeChip><span>潜空间</span></div>
          <span className="glc-path-arrow" aria-hidden="true">→</span>
          <div className={`glc-app-block is-green ${app === 'style' ? 'is-swapped' : ''}`}>
            <b>{current.decoder}</b><span>{app === 'style' ? '替换解码目标' : '生成式重建'}</span>
          </div>
          <span className="glc-path-arrow" aria-hidden="true">→</span>
          <div className="glc-app-output">
            <MosaicArtwork detail={app === 'style' ? 92 : 78} mode="latent" generative
              label={app === 'style' ? '风格化输出示意' : '清晰重建示意'} />
            <span>{app === 'style' ? '风格化输出' : app === 'restore' ? '清晰重建' : '压缩重建'}</span>
          </div>
        </div>
      </StudioPanel>
      <div className="glc-app-bottom">
        <StudioPanel className="glc-app-metrics" tone="green">
          <span className="glc-section-label">CLIC2020 恢复应用 · 越低越好</span>
          {app === 'restore' ? <>
            <div className="glc-app-metric-grid">
              <div><span>bpp</span><b>0.0299</b><small>对比 0.0314</small></div>
              <div><span>FID</span><b>8.62</b><small>对比 10.79</small></div>
              <div><span>DISTS</span><b>0.1081</b><small>对比 0.1174</small></div>
              <div><span>参数</span><b>109M</b><small>对比 25M + 109M</small></div>
            </div>
            <p>对照为 Restormer + GLC Codec；论文报告恢复应用更优且无需额外恢复网络参数。</p>
          </> : <div className="glc-app-qualitative">
            <strong>{app === 'compress' ? 'Kodak · CLIC2020 · DIV2K' : '内容 / 风格解耦示意'}</strong>
            <p>{app === 'compress' ? '重点仍是超低码率感知质量，而不是在固定 bpp 下保证逐像素一致。'
              : '风格化解码是论文演示；内容保持、版权与风格强度需要另行评价。'}</p>
          </div>}
        </StudioPanel>
        <StudioPanel className="glc-app-boundary" tone="purple">
          <span className="glc-section-label">判断边界</span>
          <p>{app === 'restore'
            ? 'σ=20 高斯噪声演示不能覆盖真实手机噪声、运动模糊和混合退化。'
            : app === 'style'
              ? 'FID/DISTS 不能完整评价风格相似度与内容保真。'
              : '压缩应用仍依赖训练分布内的自然图像与人脸。'}</p>
        </StudioPanel>
      </div>
    </div>
  </div>;
}
