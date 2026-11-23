import React, { useState } from 'react';
import { Feedback, PhotoButton } from './photo-kit';

type Up = 'transposed' | 'resize';
type Pad = 'zero' | 'reflect';
type Critic = 'vanilla' | 'lsgan';

export function Ch3Generator() {
  const [up, setUp] = useState<Up>('transposed');
  const [pad, setPad] = useState<Pad>('reflect');
  const [critic, setCritic] = useState<Critic>('vanilla');
  const chosen = up === 'transposed' && pad === 'reflect' && critic === 'vanilla';
  const edgeClass = pad === 'zero' ? 'photo-red' : 'photo-green';
  return <div className="photo-page" style={{ display: 'grid', gridTemplateColumns: '1.45fr .75fr', gap: 18 }}>
    <div className="photo-column">
      <div className="photo-scene photo-desk" style={{ padding: 18, flex: 1 }}>
        <div style={{ height: '100%', display: 'grid', gridTemplateRows: '1fr auto', gap: 12 }}>
          <div style={{ minHeight: 0, borderRadius: 16, background: '#fffdf7', border: '1px solid #d7deea', padding: 12, display: 'grid', gridTemplateColumns: '1fr 170px 1fr', gap: 12 }}>
            <div style={{ display: 'grid', placeItems: 'center' }}>
              <svg viewBox="0 0 300 210" style={{ width: '100%', height: '100%' }} aria-label="低质量拼接照片">
                <rect width="300" height="210" fill="#e6f0ec" />
                <path d="M15 170 C50 55 115 32 170 88 C210 128 238 66 284 102 V195 H15Z" fill="#a98bab" opacity=".65" />
                {Array.from({ length: 24 }).map((_, i) => <circle key={i} cx={20 + (i * 47) % 260} cy={60 + (i * 29) % 110} r="3" fill="#557d8c" opacity=".45" />)}
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
              <span className="photo-badge">9 块 ResNet</span>
              <div className="photo-rule" style={{ alignSelf: 'stretch', minHeight: 46, fontSize: 'var(--ppt-body-text)' }}>s = 40 / 10 = 4×</div>
              <span className="photo-badge">PatchGAN</span>
            </div>
            <div className={`photo-tissue ${edgeClass}`} style={{ border: `5px solid ${pad === 'zero' ? '#c43f52' : '#228d5c'}`, padding: 8 }}>
              <svg viewBox="0 0 300 210" style={{ width: '100%', height: '100%' }} aria-label="恢复后照片及边界">
                <rect width="300" height="210" fill={pad === 'zero' ? '#eef0f1' : '#fff1f5'} />
                <path d="M18 171 C48 65 115 39 170 91 C211 128 238 72 282 103 V194 H18Z" fill="#d983a4" />
                {up === 'resize' && Array.from({ length: 10 }).map((_, i) => <circle key={i} cx={30 + (i * 53) % 240} cy={48 + (i * 37) % 120} r="7" fill="#84929a" opacity=".42" />)}
                <path d="M62 134 C97 105 139 108 173 129 C206 148 235 119 265 132" fill="none" stroke="#fff3f7" strokeWidth="4" />
              </svg>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(9,minmax(0,1fr)) 1.2fr`, gap: 6 }}>
            {Array.from({ length: 9 }).map((_, i) => <span key={i} className="photo-badge" style={{ justifyContent: 'center', padding: 0 }}>R{i + 1}</span>)}
            <span className={`photo-badge ${chosen ? 'is-green' : ''}`} style={{ justifyContent: 'center' }}>4× / 判别</span>
          </div>
        </div>
      </div>
      <Feedback tone={chosen ? 'green' : 'orange'}>{chosen
        ? '转置卷积 + 反射填充 + vanilla PatchGAN 是论文采用组合；视觉实验支持这一选择。'
        : up === 'resize'
          ? '论文尝试过重采样卷积，但在本任务出现灰色斑点与更大色差。'
          : pad === 'zero'
            ? '零填充会强化边缘不连续；论文选择反射填充减轻边框伪影。'
            : 'LSGAN 可是有效配置，但本文报告 vanilla 判别器更符合其真实感目标。'}</Feedback>
    </div>
    <aside className="photo-panel">
      <span className="photo-kicker">恢复装配台</span>
      <h3>放大与边界</h3>
      <div className="photo-stack" style={{ marginTop: 12 }}>
        <div><div className="photo-range-label"><span>放大路径</span></div><div className="photo-chip-row">
          <PhotoButton selected={up === 'transposed'} onClick={() => setUp('transposed')}>转置卷积</PhotoButton>
          <PhotoButton selected={up === 'resize'} onClick={() => setUp('resize')}>重采样卷积</PhotoButton>
        </div></div>
        <div><div className="photo-range-label"><span>边界填充</span></div><div className="photo-chip-row">
          <PhotoButton selected={pad === 'zero'} onClick={() => setPad('zero')}>零填充</PhotoButton>
          <PhotoButton selected={pad === 'reflect'} onClick={() => setPad('reflect')}>反射填充</PhotoButton>
        </div></div>
        <div><div className="photo-range-label"><span>判别器</span></div><div className="photo-chip-row">
          <PhotoButton selected={critic === 'vanilla'} onClick={() => setCritic('vanilla')}>vanilla</PhotoButton>
          <PhotoButton selected={critic === 'lsgan'} onClick={() => setCritic('lsgan')}>LSGAN</PhotoButton>
        </div></div>
      </div>
      <p>生成器恢复低质量照片；PatchGAN 检查局部纹理是否像真实扫描。架构选择是任务相关结论，并非通用最优配置。</p>
    </aside>
  </div>;
}
