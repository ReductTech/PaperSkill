import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Notice, Segmented, Stat, Token, type TokenKind } from './common';

export const HeroOld: React.FC<WidgetProps> = () => (
  <div className="hero-lab old-lab hero-motion-old" aria-label="传统分裂式多模态路径动效">
    <div className="hero-lab-inputs"><span>图片</span><span>文本</span></div>
    <div className="split-path">
      <div className="split-understand"><b>视觉编码器</b><small>理解型表示</small></div>
      <i>+</i>
      <div className="split-generate"><b>连续扩散</b><small>重建型表示</small></div>
      <span className="split-break"><i /><b>表示断裂</b></span>
    </div>
    <div className="split-loss"><span>理解目标</span><span>生成目标</span></div>
    <p className="hero-motion-caption">先分裂，再分别建模</p>
  </div>
);

export const HeroNew: React.FC<WidgetProps> = () => (
  <div className="hero-lab new-lab hero-motion-new" aria-label="LLaDA2.0-Uni 统一路径动效">
    <div className="contact-strip">
      <Token kind="text" label="问" delay={30} />
      <Token kind="text" label="题" delay={70} />
      <Token kind="special" label="<h,w>" delay={110} />
      <Token kind="image" label="V₁" delay={150} />
      <Token kind="image" label="V₂" delay={190} />
      <Token kind="mask" delay={230} />
    </div>
    <div className="uni-core"><span>同一离散词表</span><b>16B MoE dLLM</b><small>共享块级 Mask 预测</small></div>
    <div className="uni-outputs"><span>文本 → 理解答案</span><span>视觉 Token → 6B Decoder → 像素</span></div>
    <p className="hero-motion-caption">先统一，再按输出模态分流</p>
  </div>
);

export const ContactAnalogy: React.FC<WidgetProps> = ({ chapterId }) => {
  const variants: Record<string, { title: string; kinds: TokenKind[] }> = {
    'chap-1': { title: '两种底片，一套编号', kinds: ['text', 'text', 'image', 'image', 'mask'] },
    'chap-2': { title: '按语义给图块编号', kinds: ['image', 'image', 'image', 'special'] },
    'chap-3': { title: '同一坐标系叠片', kinds: ['text', 'special', 'image', 'mask'] },
    'chap-4': { title: '遮住，再按置信度显影', kinds: ['mask', 'done', 'mask', 'done'] },
    'chap-5': { title: '遮哪里，就补哪里', kinds: ['text', 'image', 'mask', 'mask'] },
    'chap-6': { title: '并行显影当前区块', kinds: ['done', 'done', 'mask', 'mask'] },
    'chap-7': { title: '先校色，再混片，后精修', kinds: ['special', 'text', 'image', 'done'] },
    'chap-8': { title: '沿光路巡检组件', kinds: ['image', 'special', 'text', 'done'] },
    'chap-9': { title: '裁前缀，缩短显影', kinds: ['done', 'done', 'mask', 'done'] },
    'chap-10': { title: '对照成果，也看瑕疵', kinds: ['done', 'image', 'mask', 'text'] },
  };
  const v = variants[chapterId] || variants['chap-1'];
  return (
    <div className="analogy-proof">
      <div className="proof-light" />
      <div className="proof-title">{v.title}</div>
      <div className="proof-strip">
        {v.kinds.map((kind, index) => <Token key={index} kind={kind} label={kind === 'done' ? '✓' : undefined} delay={index * 80} />)}
      </div>
    </div>
  );
};

export const UnifiedSwitch: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState('split');
  const unified = mode === 'unified';
  return (
    <div className="ll-widget">
      <Segmented
        label="比较建模范式"
        value={mode}
        onChange={setMode}
        items={[{ value: 'split', label: '分裂式范式' }, { value: 'unified', label: 'LLaDA2.0-Uni' }]}
      />
      <div className={`unified-switch ${unified ? 'is-unified' : ''}`}>
        <div className="switch-source"><span>TXT</span><span>IMG</span></div>
        <div className="switch-stage">
          {unified ? (
            <><div className="shared-vocab">统一离散 token</div><div className="shared-model">共享 dLLM</div></>
          ) : (
            <><div className="separate red">理解模型</div><div className="separate red">生成模型</div></>
          )}
        </div>
        <div className="switch-target">
          <span>回答</span><span>生成</span><span>编辑</span><span>交错</span>
        </div>
      </div>
      <div className="metrics">
        <Stat label="主干模型" value={unified ? '1 套' : '2 套'} tone={unified ? 'green' : 'red'} />
        <Stat label="离散空间" value={unified ? '共享' : '割裂'} tone={unified ? 'green' : 'red'} />
        <Stat label="任务接口" value={unified ? '移动 Mask' : '分别设计'} tone={unified ? 'green' : 'orange'} />
      </div>
      <Notice tone={unified ? 'green' : 'red'}>
        {unified
          ? '关键变化：文本和图像先成为同一序列里的离散 token，再共享块级 Mask 预测目标。'
          : '问题不只是组件多：两条路径的表示与训练目标不同，理解和生成难以原生互相条件化。'}
      </Notice>
    </div>
  );
};
