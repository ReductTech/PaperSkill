import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Route = 'enc-state' | 'enc-vit' | 'enc-gt' | 'enc-osrt';

const ROUTES: Record<
  Route,
  { label: string; varText: string; map: string; premise: string; limit: string; color: string; bbox: [number, number, number, number] }
> = {
  'enc-state': {
    label: '状态便签',
    varText: 's ∈ R^S',
    map: '物体 / 机器人状态向量（位姿、尺寸、颜色等）经 MLP 映射到语言嵌入空间。',
    premise: '不依赖真值分割。',
    limit: '只承载结构化状态，不直接描述像素外观。',
    color: '#27446e',
    bbox: [4, 8, 44, 42],
  },
  'enc-vit': {
    label: '照片卡片',
    varText: 'x̃1:m = φ̃ViT(I)',
    map: 'ViT 把图像切成 m 个特征 token，再由可学习仿射投影 ψ 投到语言维度。',
    premise: 'ViT 输出维度 k̃ 不必等于语言维度 k。',
    limit: '图像级编码，不显式拆分单个物体。',
    color: '#27446e',
    bbox: [52, 8, 44, 42],
  },
  'enc-gt': {
    label: '掩码托盘',
    varText: 'x_j = φViT(M_j ◦ I)',
    map: '按真值实例掩码把画面拆成单个物体，逐物体编码。',
    premise: '依赖给定的真值分割掩码（GT mask）。',
    limit: '与无监督槽位方法不是同一类，不能互换。',
    color: '#7c3aed',
    bbox: [4, 54, 44, 42],
  },
  'enc-osrt': {
    label: '编号槽位',
    varText: 'o_j = φ̄OSRT(I1:v)_j',
    map: '无监督发现物体槽位，冻结槽位表示、只训练投影 ψ。',
    premise: '不需要真值分割。',
    limit: '该路线尚未结合大规模视觉数据（论文列为未来工作）。',
    color: '#7c3aed',
    bbox: [52, 54, 44, 42],
  },
};

const ORDER: Route[] = ['enc-state', 'enc-vit', 'enc-gt', 'enc-osrt'];

/**
 * §4 P5 漫画热点走读：四格无字漫画为底图，透明按钮按百分比覆盖；
 * 选中后双面板分别呈现映射公式 / 机制，以及前提与局限，避免把两类方法混用。
 */
export const EncoderSelect: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [active, setActive] = useState<Route | null>(null);
  const current = active ? ROUTES[active] : null;

  return (
    <div>
      <div
        className="encoder-hotspot"
        id={`cv-${chapterId}-${moduleId}`}
        role="group"
        aria-label="四种编码器路线热点"
      >
        <img
          src="./images/comic/palm-e-encoder.png"
          alt="四类观测登记方式的无字四格漫画"
        />
        {ORDER.map((key) => {
          const r = ROUTES[key];
          const [x, y, w, h] = r.bbox;
          const isActive = key === active;
          return (
            <button
              key={key}
              type="button"
              aria-label={r.label}
              aria-pressed={isActive}
              onClick={() => setActive(isActive ? null : key)}
              className={`encoder-hotspot-btn ${isActive ? 'active' : ''}`}
              style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }}
            />
          );
        })}
      </div>

      <div className="chip-row" role="group" aria-label="选择编码器路线（键盘等价）">
        {ORDER.map((key) => (
          <button
            key={key}
            type="button"
            className={`chip ${active === key ? 'selected' : ''}`}
            aria-pressed={active === key}
            onClick={() => setActive(active === key ? null : key)}
          >
            {ROUTES[key].label}
          </button>
        ))}
      </div>

      {current ? (
        <div className="dual-panel">
          <div className="panel-box">
            <h5>{current.label}</h5>
            <div className="panel-body" style={{ fontFamily: 'ui-monospace, monospace', marginBottom: 8 }}>
              {current.varText}
            </div>
            <div className="panel-body">{current.map}</div>
          </div>
          <div className="panel-box">
            <h5>前提与局限</h5>
            <div className="panel-body">前提：{current.premise}</div>
            <div className="panel-body" style={{ marginTop: 6 }}>局限：{current.limit}</div>
          </div>
        </div>
      ) : (
        <div className="feedback">点漫画里的一格，查看它怎么把观测接到语言空间。</div>
      )}
    </div>
  );
};

export default EncoderSelect;
