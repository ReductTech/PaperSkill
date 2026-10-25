import React, { useState } from 'react';
import { Feedback, RW } from './kit';

const SIZES = [
  { label: '80 × 24', cols: 80, rows: 24 },
  { label: '120 × 40', cols: 120, rows: 40 },
  { label: '160 × 48', cols: 160, rows: 48 },
];

/* 终端是一块画布：同一棵组件树，宽度够了才挂侧栏，行数决定列表能放几条。
   这里用固定宽高模拟 Ink 的 flexbox 布局结果，不追求逐像素还原。 */
export function InkLayout() {
  const [index, setIndex] = useState(0);
  const size = SIZES[index];
  const wide = size.cols >= 120;
  const lines = Math.max(2, Math.min(6, size.rows - 8));
  const width = Math.min(1120, size.cols * 7);
  const height = Math.min(470, size.rows * 9.4);

  return (
    <div className="rw" style={{ gridTemplateColumns: 'minmax(0, 1.55fr) minmax(0, 1fr)' }}>
      <div className="rw-stage" style={{ display: 'grid', placeItems: 'center', background: '#eef2f7' }}>
        <div style={{ width, height, background: '#1b2432', borderRadius: 8, padding: 10, display: 'grid', gridTemplateRows: 'auto 1fr auto auto', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c9d4e4', fontSize: 30, fontFamily: 'var(--ui-font-mono)' }}>
            <span>✻ Claude Code</span><span>{size.cols} 列</span>
          </div>
          <div style={{ display: 'flex', gap: 8, minHeight: 0 }}>
            <div style={{ flex: '1 1 auto', display: 'grid', gap: 6, alignContent: 'start', minWidth: 0 }}>
              {Array.from({ length: lines }, (_, i) => (
                <div key={i} style={{
                  height: 18, borderRadius: 4,
                  background: i === 0 ? '#3d5a80' : '#2b394b',
                  width: `${[88, 72, 80, 64, 76, 58][i % 6]}%`,
                }} />
              ))}
            </div>
            {wide && (
              <div style={{ width: 180, borderRadius: 4, background: '#243141', padding: 8, display: 'grid', gap: 6, alignContent: 'start' }}>
                <span style={{ color: '#8fa3bb', fontSize: 30 }}>会话</span>
                <div style={{ height: 10, borderRadius: 3, background: '#3d5a80', width: '80%' }} />
                <div style={{ height: 10, borderRadius: 3, background: '#33445a', width: '65%' }} />
              </div>
            )}
          </div>
          <div style={{ height: 34, borderRadius: 4, border: '2px solid #3d5a80', color: '#8fa3bb', fontSize: 30, padding: '0 8px', fontFamily: 'var(--ui-font-mono)', display: 'flex', alignItems: 'center' }}>
            &gt; 输入
          </div>
          <div style={{ color: '#7d8ea6', fontSize: 30, fontFamily: 'var(--ui-font-mono)', display: 'flex', justifyContent: 'space-between' }}>
            <span>main · 3 files</span><span>{size.rows} 行</span>
          </div>
        </div>
      </div>

      <div className="rw-col">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SIZES.map((item, i) => (
            <button key={item.label} type="button" className="rw-btn"
              aria-pressed={i === index} onClick={() => setIndex(i)}>{item.label}</button>
          ))}
        </div>
        <div className="rw-card rw-card--plain">
          <p className="rw-t rw-muted">当前挂载的组件</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            {['Header', 'MessageList', 'InputBox', 'StatusBar'].map(name => (
              <span key={name} className="rw-chip" data-tone="blue">{name}</span>
            ))}
            {wide && <span className="rw-chip" data-tone="green">Sidebar</span>}
          </div>
        </div>
        <div className="rw-card rw-card--soft">
          <p className="rw-t rw-t--tight">
            文档列了约 140 个组件、约 80 个 hooks，还有 <span className="rw-code">REPL</span>、
            <span className="rw-code">Doctor</span>、<span className="rw-code">ResumeConversation</span> 三个全屏界面。
          </p>
        </div>
        <div style={{ marginTop: 'auto' }}>
          <Feedback tone={wide ? 'good' : 'neutral'}>
            {wide
              ? '宽度够了，侧栏才挂上去；列表高度跟着行数走。布局由尺寸决定，而不是写死。'
              : '窄终端里没有侧栏：同一套组件，按可用空间重新排。'}
          </Feedback>
        </div>
      </div>
    </div>
  );
}
