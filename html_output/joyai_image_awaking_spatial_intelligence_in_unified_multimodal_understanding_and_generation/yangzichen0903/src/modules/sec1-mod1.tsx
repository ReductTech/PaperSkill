import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Mode = 'see' | 'space';

export const Sec1Mod1: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<Mode>('see');
  const spatial = mode === 'space';

  return (
    <div className="spatial-motive">
      <div className="spatial-mode-tabs" role="tablist" aria-label="比较看懂图片与理解空间">
        <button className={!spatial ? 'active' : ''} onClick={() => setMode('see')} role="tab" aria-selected={!spatial}>
          <b>01</b><span>看懂图片<small>识别当前可见内容</small></span>
        </button>
        <span className="spatial-mode-arrow">→</span>
        <button className={spatial ? 'active' : ''} onClick={() => setMode('space')} role="tab" aria-selected={spatial}>
          <b>02</b><span>理解空间<small>推断画面背后的几何</small></span>
        </button>
      </div>

      <div className={`spatial-scene ${spatial ? 'is-spatial' : 'is-visible'}`}>
        <svg viewBox="0 0 620 260" role="img" aria-label={spatial ? '标注距离、尺度、遮挡与相机关系的空间场景' : '标注男孩、背包和柱子的可见场景'}>
          <rect x="12" y="12" width="596" height="236" rx="22" className="scene-paper" />
          <path d="M25 208 L594 208 L520 147 L92 147 Z" className="scene-floor" />
          <rect x="412" y="51" width="58" height="157" rx="8" className="scene-pillar" />
          <circle cx="232" cy="79" r="29" className="scene-head" />
          <path d="M202 111 Q232 95 262 111 L269 187 L194 187 Z" className="scene-body" />
          <path d="M214 187 L211 224 M252 187 L258 224" className="scene-limbs" />
          <rect x="158" y="126" width="48" height="63" rx="12" className="scene-bag" />
          <path d="M168 128 Q181 109 195 128" className="scene-bag-loop" />
          <rect x="445" y="156" width="60" height="48" rx="8" className="scene-hidden" />

          {!spatial ? (
            <g className="visible-labels">
              <path d="M232 49 L232 29 L171 29" /><text x="165" y="34">男孩</text>
              <path d="M158 154 L118 154" /><text x="111" y="159">红色背包</text>
              <path d="M442 51 L442 31 L498 31" /><text x="505" y="36">柱子</text>
            </g>
          ) : (
            <g className="space-labels">
              <path d="M273 117 L408 117" className="measure-line" />
              <path d="M273 108 L273 126 M408 108 L408 126" className="measure-line" />
              <text x="340" y="105">距离是多少？</text>
              <path d="M143 126 L143 189" className="measure-line" />
              <path d="M136 126 L151 126 M136 189 L151 189" className="measure-line" />
              <text x="94" y="161">真实高度？</text>
              <circle cx="480" cy="179" r="18" className="hidden-mark" /><text x="480" y="186" className="question-mark">?</text>
              <path d="M545 219 Q520 171 486 147" className="camera-ray" />
              <path d="M545 219 l-17 -3 l8 -14 z" className="camera-icon" />
              <text x="528" y="238">换个视角能看到什么？</text>
            </g>
          )}
        </svg>

        <div className="spatial-scene-readout">
          {!spatial ? (
            <><span>当前像素已经足够</span><strong>图中有男孩、红色背包和一根柱子。</strong></>
          ) : (
            <><span>当前像素并不完整</span><strong>距离、真实尺度、遮挡物和视角变化需要额外空间证据。</strong></>
          )}
        </div>
      </div>

      <div className="spatial-goal">
        <span>论文真正的目标</span>
        <strong>不是增加三个任务，而是让模型从“描述可见像素”走向“理解三维空间”。</strong>
      </div>

      <div className="spatial-method">
        <div className="spatial-method-head"><span>实现这一目标的方法</span><strong>把三项能力接成一条补充空间证据的链路</strong></div>
        <div className="spatial-method-grid">
          <div><b>U</b><span><strong>Understanding</strong><small>提出空间判断，识别缺少什么证据</small></span></div>
          <div><b>G</b><span><strong>Generation</strong><small>合成当前视角看不到的新观察</small></span></div>
          <div><b>E</b><span><strong>Editing</strong><small>按指令改变目标；空间编辑可操纵相机或对象</small></span></div>
        </div>
      </div>
      <div className="feedback good"><strong>交给下一节的问题：</strong>Figure 4 怎样把三项能力接入同一套架构？</div>
    </div>
  );
};

export default Sec1Mod1;
