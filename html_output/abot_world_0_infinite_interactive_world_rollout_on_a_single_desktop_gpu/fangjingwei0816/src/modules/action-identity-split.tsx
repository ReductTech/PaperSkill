import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const KEYS = ['W', 'A', 'S', 'D', 'I', 'J', 'K', 'L'];

export function ActionIdentityDemo({ compact = false }: { compact?: boolean }) {
  const [mode, setMode] = useState<'action' | 'identity'>('action');
  const [slot, setSlot] = useState(0);
  const [masks, setMasks] = useState([1, 1, 16, 16]);

  const toggleKey = (keyIndex: number) => setMasks((current) => current.map((mask, index) => index === slot ? mask ^ (1 << keyIndex) : mask));

  return (
    <div className={`mechanism-split ${compact ? 'is-compact' : ''}`} data-testid="action-identity-split" data-mode={mode}>
      <div className="mechanism-tabs" role="tablist" aria-label="动作与身份机制">
        <button type="button" role="tab" aria-selected={mode === 'action'} className={mode === 'action' ? 'mechanism-tab active' : 'mechanism-tab'} onClick={() => setMode('action')}>Action · 怎么动</button>
        <button type="button" role="tab" aria-selected={mode === 'identity'} className={mode === 'identity' ? 'mechanism-tab active' : 'mechanism-tab'} onClick={() => setMode('identity')}>Identity Memory · 是谁</button>
      </div>

      {mode === 'action' ? (
        <div className="action-mechanism">
          <div className="keyboard-panel">
            <div className="panel-kicker">Keyboard · 当前编辑第 {slot + 1} 帧</div>
            <div className="key-grid">
              {KEYS.map((key, index) => <button type="button" key={key} aria-pressed={Boolean(masks[slot] & (1 << index))} className={masks[slot] & (1 << index) ? 'keycap active' : 'keycap'} onClick={() => toggleKey(index)}>{key}</button>)}
            </div>
            <div className="frame-slots">
              {masks.map((mask, index) => <button type="button" key={index} onClick={() => setSlot(index)} className={slot === index ? 'frame-slot active' : 'frame-slot'}><span>帧 {index + 1}</span><code>{mask.toString(2).padStart(8, '0')}</code></button>)}
            </div>
          </div>
          <div className="mechanism-flow" aria-label="动作控制路径">
            <div><small>逐帧动作</small><strong>aₜ ∈ {'{0,1}'}⁸</strong></div><b>→</b>
            <div><small>4 帧拼接</small><strong>ã_τ ∈ {'{0,1}'}³²</strong></div><b>→</b>
            <div><small>Action Adapter</small><strong>Fψ(ã)</strong></div><b>→</b>
            <div className="flow-result"><small>加到视频 patch</small><strong>PatchEmbed(z) ⊕ Fψ(ã)</strong></div>
          </div>
          <div className="feedback good">Action 路径只回答“怎么动”：四个 8 维 multi-hot 动作与 VAE 的一个潜在时间步对齐。</div>
        </div>
      ) : (
        <div className="identity-mechanism">
          <div className="identity-source">
            <div className="panel-kicker">Reference images</div>
            <div className="reference-views"><span>正面</span><span>侧面</span><span>背面</span></div>
            <strong>同一角色的规范视图</strong>
          </div>
          <div className="identity-arrow">VAE 编码 →</div>
          <div className="token-timeline">
            <div className="memory-zone">
              <small>Identity tokens · 固定负时间位置</small>
              <div><span>-3</span><span>-2</span><span>-1</span></div>
            </div>
            <div className="time-divider">|</div>
            <div className="video-zone">
              <small>Video tokens · 非负时间位置</small>
              <div><span>0</span><span>1</span><span>2</span><span>3</span><span>…</span></div>
            </div>
          </div>
          <div className="attention-rule">
            <div className="allowed">video 读取 memory <strong>← 允许</strong></div>
            <div className="blocked">video 反向写入 memory <strong>✕ 隔离</strong></div>
          </div>
          <div className="feedback good">Identity Memory 只回答“是谁”：视频 token 可持续检索身份信息，生成轨迹不会反向污染静态记忆。</div>
        </div>
      )}
    </div>
  );
}

export const ActionIdentitySplit: React.FC<WidgetProps> = () => <ActionIdentityDemo />;
