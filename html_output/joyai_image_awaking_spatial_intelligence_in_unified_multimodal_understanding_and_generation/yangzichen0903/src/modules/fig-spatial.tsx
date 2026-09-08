import React, { useState } from 'react';

export function FigSpatial() {
  const [active, setActive] = useState<string | null>(null);
  const categories = [
    { id: 'SM', name: '空间测量', full: 'Spatial Measurement', desc: '距离、尺寸、深度估计' },
    { id: 'SR', name: '空间关系', full: 'Spatial Relationship', desc: '之间、后方、位置对应' },
    { id: 'CP', name: '相机感知', full: 'Camera Perception', desc: '相机运动、位姿估计' },
    { id: 'MC', name: '多视角一致', full: 'Multi-view Consistency', desc: '跨帧几何同步' },
    { id: 'SAR', name: '场景推理', full: 'Scene-Aware Reasoning', desc: '3D场景描述与推理' }
  ];
  return (
    <div className="figure-evidence spatial-evidence">
      <div className="evidence-legend">
        <div className="legend-title">论文原图 · Figure 5：OpenSpatial 数据引擎</div>
        <div className="legend-note">
          <strong>为什么以 3D box 为中心？</strong> 3D oriented bounding box 同时记录对象的绝对尺度、三维中心与朝向；即使相机视角变化，它仍能作为同一对象的稳定几何锚点。
        </div>
      </div>
      <div className="spatial-engine-steps">
        <article>
          <b>01 · 获得场景级 3D OBB</b>
          <span>高精度 3D 扫描直接提供几何标注；普通网络视频则结合深度，将逐帧 2D instance mask 提升到统一的 3D 坐标系。</span>
        </article>
        <i>→</i>
        <article>
          <b>02 · 投影回每个视频帧</b>
          <span>把候选 3D box 投影到不同视角，检查对象是否可见，并用实例 mask 细化对应区域。</span>
        </article>
        <i>→</i>
        <article>
          <b>03 · 跨视角循环校验</b>
          <span>只有当同一个 3D box 在多个视角中的投影都与观测 mask 对齐时，候选框才被保留。</span>
        </article>
        <i>→</i>
        <article>
          <b>04 · 建立 object-frame index</b>
          <span>将对象 ID、3D/2D box、instance mask、局部点云与度量信息绑定到对应帧，再分别生成单视角和多视角 QA。</span>
        </article>
      </div>
      <div className="spatial-branch-note">
        <div><b>Single-view QA</b><span>在单帧 scene graph 上提问，用可视锚点把语言问题落到 2D 图像。</span></div>
        <div><b>Multi-view QA</b><span>利用 3D box 的视角不变性关联重叠帧中的同一对象，构造跨视角一致性问题。</span></div>
      </div>
      <div className="taxonomy-title">点击查看 5 大空间能力（19 子任务，共 3M 样本）</div>
      <div className="taxonomy-chips">
        {categories.map(c => (
          <button
            key={c.id}
            className={`taxonomy-chip ${active === c.id ? 'active' : ''}`}
            onClick={() => setActive(active === c.id ? null : c.id)}
          >
            <span className="chip-id">{c.id}</span>
            <span className="chip-name">{c.name}</span>
          </button>
        ))}
      </div>
      {active && (
        <div className="taxonomy-detail">
          {categories.filter(c => c.id === active).map(c => (
            <div key={c.id}>
              <strong>{c.name}</strong>（{c.full}）：{c.desc}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
