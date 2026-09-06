import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type TensorView = 'spatial' | 'channel';

const GRID_ROWS = 7;
const GRID_COLS = 9;
const CENTER_ROW = 3;
const CENTER_COL = 4;

function gridClass(index: number) {
  const row = Math.floor(index / GRID_COLS);
  const col = index % GRID_COLS;
  const center = row === CENTER_ROW && col === CENTER_COL;
  const neighbor = Math.abs(row - CENTER_ROW) <= 1 && Math.abs(col - CENTER_COL) <= 1;
  return `${neighbor ? 'neighbor' : ''} ${center ? 'center' : ''}`.trim();
}

export const Ch3Mixers: React.FC<WidgetProps> = () => {
  const [view, setView] = useState<TensorView>('spatial');
  const [hasCompared, setHasCompared] = useState(false);
  const spatial = view === 'spatial';

  const selectView = (next: TensorView) => {
    if (next !== view) setHasCompared(true);
    setView(next);
  };

  return (
    <div className={`mix4c-lab is-${view}`}>
      <div className="mix4c-question">
        <span>核心问题</span>
        <strong>同一个 feature tensor 里，空间位置和通道是在解决同一种问题吗？</strong>
        <p>同一个 C × H × W 上有两类关系：位置之间怎么交流，通道之间怎么交流？</p>
      </div>

      <div className="mix4c-view-toggle" role="group" aria-label="选择 Feature Tensor 观察方式">
        <button type="button" className={spatial ? 'selected' : ''} aria-pressed={spatial} onClick={() => selectView('spatial')}>
          <strong>看空间 H×W</strong><span>固定 channel Cₖ</span>
        </button>
        <button type="button" className={!spatial ? 'selected' : ''} aria-pressed={!spatial} onClick={() => selectView('channel')}>
          <strong>看通道 C</strong><span>固定位置 (x, y)</span>
        </button>
      </div>

      <section className="mix4c-stage" aria-live="polite">
        <div className="mix4c-tensor-pane">
          <header><span>Feature Tensor</span><strong>C × H × W</strong><small>{spatial ? '固定 Cₖ，观察 H×W' : '固定 (x,y)，观察 C'}</small></header>

          <div className="mix4c-tensor-views">
            <div className={`mix4c-spatial-view ${spatial ? 'active' : 'muted'}`} aria-label="固定一个通道后的 H 乘 W 空间网格">
              <div className="mix4c-view-label"><span>Spatial View</span><strong>channel Cₖ</strong></div>
              <div className="mix4c-grid" aria-hidden="true">
                {Array.from({ length: GRID_ROWS * GRID_COLS }, (_, index) => <i className={gridClass(index)} key={index} />)}
              </div>
              <small>中心位置与附近空间交换信息</small>
            </div>

            <div className={`mix4c-channel-view ${spatial ? 'muted' : 'active'}`} aria-label="固定一个空间位置后的通道柱状表示">
              <div className="mix4c-view-label"><span>Channel View</span><strong>position (x,y)</strong></div>
              <div className="mix4c-channel-bars" aria-hidden="true">
                {[48, 72, 38, 88, 58, 78, 44, 66].map((height, index) => <i style={{ height: `${height}%` }} key={index} />)}
              </div>
              <small>同一位置上的 C 个特征重新组合</small>
            </div>
          </div>
        </div>

        <div className={`mix4c-mixer-card ${spatial ? 'token' : 'channel'}`}>
          <span>{spatial ? 'TOKEN MIXER' : 'CHANNEL MIXER'}</span>
          <h5>{spatial ? 'Spatial Mixing' : 'Channel Transformation'}</h5>
          <p>{spatial ? '在同一个 channel 内，让相邻空间位置交换信息。' : '在同一个空间位置上，让不同 channel 之间交换和重新组合信息。'}</p>

          {spatial ? (
            <div className="mix4c-simple-flow token" role="img" aria-label="x 经过 Spatial Mixer 得到 x hat">
              <code>x</code><b>→</b><strong>Spatial Mixer<small>DWConv / RepDWConv</small></strong><b>→</b><code>x̂</code>
            </div>
          ) : (
            <div className="mix4c-simple-flow channel" role="img" aria-label="通道从 C 扩张到 2C，经过 GELU 再压缩回 C">
              <code>C</code><b>→</b><strong>2C</strong><b>→</b><strong>GELU</strong><b>→</b><code>C</code>
            </div>
          )}

          <div className="mix4c-live-explanation">
            <strong>{spatial ? 'Token Mixer 关注' : 'Channel Mixer 关注'}</strong>
            <span>{spatial ? '“这个位置附近还有什么”。' : '“同一个位置上，不同特征应该怎样组合”。'}</span>
          </div>
        </div>
      </section>

      <div className={`mix4c-block-summary ${hasCompared ? 'visible' : ''}`} aria-hidden={!hasCompared}>
        <div><span>LCNetV4Block</span><strong>Token Mixer</strong><small>空间关系</small></div>
        <b>→</b>
        <div><span>同一个 block</span><strong>Channel Mixer</strong><small>通道关系</small></div>
        <em>identity shortcut 在形状匹配时保留稳定路径</em>
        <p><strong>一个 block，两种职责。</strong> 先把空间与通道拆清楚，再分别优化。</p>
      </div>

      <details className="mix4c-paper-details">
        <summary>查看论文公式</summary>
        <div className="mix4c-formula-grid">
          <article><span>Token Mixer</span><code>x̂ = SE(DW(x)) + x</code><p>DW / RepDWConv 处理空间邻域，SE 为可选注意力；输入输出形状一致时使用 identity shortcut。</p></article>
          <article><span>Channel Mixer</span><code>y = W₂ GELU(W₁x̂) + x̂</code><p>W₁ 用 1×1 convolution 将 C 扩到 2C，W₂ 再压回 C。结构重参数化主要作用于具有空间范围的 Token Mixer。</p></article>
        </div>
      </details>

      <div className="mix4c-takeaway"><strong>你应该记住：</strong><span>LCNetV4 的关键不是增加更多模块，而是先把两种职责拆清楚，再分别优化。</span></div>
    </div>
  );
};

export const Ch3Benefits: React.FC<WidgetProps> = () => (
  <div className="mix4c-benefits">
    <div className="mix4c-benefit-grid">
      <article>
        <span>01</span>
        <h5>可以独立调节</h5>
        <strong>Spatial 与 Channel 各做自己的事</strong>
        <p>Token Mixer 控制空间建模，Channel Mixer 控制通道变换，可以分别优化。</p>
      </article>

      <article className="featured">
        <span>02</span>
        <h5>只改真正需要改的部分</h5>
        <div className="mix4c-scope-row" aria-label="结构重参数化只作用在 Token Mixer">
          <div><small>Token Mixer</small><strong>RepDWConv</strong></div>
          <b>→</b>
          <div><small>Channel Mixer</small><strong>保持轻量</strong></div>
        </div>
        <p>Structural reparameterization 主要作用在具有空间范围的 Token Mixer，不必让所有 1×1 Channel Mixer 一起变复杂。</p>
      </article>

      <article>
        <span>03</span>
        <h5>更容易统一与缩放</h5>
        <strong>同一种 block primitive</strong>
        <p>同一种 LCNetV4 block primitive 可以用于 Detection / Recognition，并按不同 depth / width 扩展成不同规模。</p>
      </article>
    </div>
    <p className="mix4c-benefit-note">拆分职责带来的不是更多在线分支，而是更清晰的设计边界与更灵活的优化空间。</p>
  </div>
);
