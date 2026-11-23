import React, { useState } from 'react';
import { CameraGlyph, Feedback, PhotoButton } from './photo-kit';

type Rig = 'scanner' | 'commercial' | 'proposed';

const data: Record<Rig, { title: string; budget: string; detail: string; tone: 'blue' | 'green' | 'orange' }> = {
  scanner: { title: '自动多片扫描', budget: '约 $70,000+', detail: '电动台、照明控制、存储与 IT 人员共同抬高部署门槛。', tone: 'orange' },
  commercial: { title: '商用离线拼接', budget: '$3,500+ 软件', detail: '仍需高端显微镜、相机和高规格工作站。', tone: 'orange' },
  proposed: { title: '本文低成本方案', budget: '约 $200 显微镜', detail: '从 10× 视频开始，把难点转移到拼接、恢复与专家复核。', tone: 'green' },
};

export function Ch1Cost() {
  const [rig, setRig] = useState<Rig>('proposed');
  const current = data[rig];
  return <div className="photo-page photo-split is-wide">
    <div className="photo-scene photo-desk" style={{ padding: 22 }}>
      <div className="photo-stack" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))', display: 'grid', height: '100%' }}>
        {(Object.keys(data) as Rig[]).map(key => <PhotoButton key={key} selected={rig === key} onClick={() => setRig(key)}>
          <div style={{ display: 'grid', placeItems: 'center', gap: 8, height: '100%' }}>
            <CameraGlyph mode={key === 'scanner' ? 'scanner' : 'video'} />
            <b>{data[key].title}</b>
            <span className="photo-badge">{data[key].budget}</span>
            {key === 'scanner' && <span className="photo-small-label">大型设备 · 自动平台</span>}
            {key === 'commercial' && <span className="photo-small-label">软件之外仍需整套外设</span>}
            {key === 'proposed' && <span className="photo-small-label">采集 + 拼接 + 恢复</span>}
          </div>
        </PhotoButton>)}
      </div>
    </div>
    <aside className="photo-panel">
      <span className="photo-kicker">设备组合与部署负担</span>
      <h3>{current.title}</h3>
      <div className="photo-rule" style={{ marginTop: 18 }}>{current.budget}</div>
      <p>{current.detail}</p>
      <div className="photo-stack" style={{ marginTop: 18 }}>
        <div className="photo-stat"><strong>{rig === 'proposed' ? '更少专用硬件' : '完整专用硬件'}</strong><span>{rig === 'proposed' ? '把主要计算放到后续处理' : '采购、空间和维护同时发生'}</span></div>
        <div className="photo-stat"><strong>{rig === 'proposed' ? '10× 采集' : '20× / 40× 级工作流'}</strong><span>{rig === 'proposed' ? '后续需要恢复细节与边界检查' : '硬件和工艺更成熟但难以普及'}</span></div>
      </div>
      <Feedback tone={current.tone}>{rig === 'proposed'
        ? '用约 $200 的显微镜采集 10× 视频，再把难点交给拼接与恢复。'
        : rig === 'scanner'
          ? '设备完整，但基层通常难以承担采购、空间和运维。'
          : '成本比自动扫描器低，但“软件 + 高端外设”的组合壁垒仍在。'}</Feedback>
    </aside>
  </div>;
}
