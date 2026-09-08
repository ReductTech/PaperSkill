import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Layer = 'general' | 'grounding' | 'boundary' | 'depth' | 'grasp';

const layers: Array<{ id: Layer; label: string; cue: string }> = [
  { id: 'general', label: '通用 VLM', cue: '“这是红杯”' },
  { id: 'grounding', label: '目标定位', cue: '“是哪一个”' },
  { id: 'boundary', label: '精确边界', cue: '“边界在哪里”' },
  { id: 'depth', label: '相对深度', cue: '“离我多远”' },
  { id: 'grasp', label: '可抓取点', cue: '“从哪里接触”' },
];

const feedback: Record<Layer, string> = {
  general: '通用 VLM 只回答“这是红杯”。类别识别还不能直接指导机械臂。',
  grounding: '目标定位回答“是哪一个”：把语言中的“红杯”落到唯一目标。',
  boundary: '精确分割回答“边界在哪里”：分清杯身、杯柄与周围背景。',
  depth: '相对深度回答“离我多远”：同时看见红杯距离与需要绕开的玻璃杯。',
  grasp: '可抓取点回答“从哪里接触”：杯柄外侧成为当前任务的稳定接触位置。',
};

export const PerceptionExplorer: React.FC<WidgetProps> = () => {
  const [layer, setLayer] = useState<Layer>('general');
  const precise = layer !== 'general';
  return <div className="paper-demo">
    <div className="kitchen-board" role="img" aria-label={`厨房目标检查，当前层：${layers.find(x => x.id === layer)?.label}`}>
      <div className="robot-eye">机器人视角</div>
      <div className={`scene-mug ${precise ? 'is-target' : 'is-coarse'} ${layer === 'boundary' ? 'show-boundary' : ''}`}>
        <span className="mug-handle" />
        {layer === 'grasp' ? <span className="grasp-dot" title="杯柄外侧抓取点" /> : null}
      </div>
      <div className={`scene-glass ${layer === 'depth' ? 'is-depth' : ''}`} />
      <div className="scene-bowl" />
      <div className="scene-spoon" />
      {layer === 'depth' ? <><div className="depth-line mug-depth">0.62 m</div><div className="depth-line glass-depth">0.48 m</div></> : null}
      <div className={`coarse-box ${layer === 'general' ? 'visible' : ''}`}>Mug</div>
      <div className={`target-box ${layer === 'grounding' ? 'visible' : ''}`}>红色马克杯</div>
    </div>
    <div className="chip-row perception-tabs" role="group" aria-label="逐层打开具身感知">
      {layers.map(item => <button key={item.id} className={`chip perception-chip ${layer === item.id ? 'selected' : ''}`} aria-pressed={layer === item.id} onClick={() => setLayer(item.id)}><span>{item.label}</span><small>{item.cue}</small></button>)}
    </div>
    <div className={`feedback ${layer === 'general' ? 'bad' : layer === 'grasp' ? 'good' : ''}`} aria-live="polite">{feedback[layer]}</div>
    <div className="capability-list" aria-label="当前具身感知能力">
      {['类别', '目标', '边界', '深度', '抓取点'].map((label, index) => {
        const enabled = index <= layers.findIndex(x => x.id === layer);
        return <span key={label} className={enabled ? 'on' : ''}>{enabled ? '✓' : '?'} {label}</span>;
      })}
    </div>
    <p className="perception-training-note">论文从预训练阶段加入 2D/3D Grounding、深度估计和图像分割等数据，让视觉结果真正成为动作的空间依据。</p>
    <div className="perception-samples" aria-label="四类视觉训练数据的教学化样例">
      <div className="perception-sample">
        <div className="sample-preview sample-grounding-2d" aria-hidden="true"><span className="sample-cup">杯</span><i /></div>
        <b>2D Grounding</b>
        <small>“红杯在哪？” → 边界框</small>
      </div>
      <div className="perception-sample">
        <div className="sample-preview sample-grounding-3d" aria-hidden="true"><i className="axis-x"/><i className="axis-y"/><i className="axis-z"/><span /></div>
        <b>3D Grounding</b>
        <small>“杯在何处？” → (x, y, z)</small>
      </div>
      <div className="perception-sample">
        <div className="sample-preview sample-depth" aria-hidden="true"><span>0.62 m</span><i /></div>
        <b>深度估计</b>
        <small>像素 → 相对远近</small>
      </div>
      <div className="perception-sample">
        <div className="sample-preview sample-segmentation" aria-hidden="true"><span /><i /></div>
        <b>图像分割</b>
        <small>杯身像素 → 目标掩码</small>
      </div>
    </div>
    <div className="sample-disclaimer">同一场景的教学化样例，用于说明数据标注形式，并非论文原始样本。</div>
  </div>;
};

export default PerceptionExplorer;
