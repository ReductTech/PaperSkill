import React, { useMemo, useState } from 'react';
import { PsChip } from '../components/ps-controls';
import { TensorGrid } from './tensorGrid';
import type { WidgetProps } from './registry';

type Side = 'nav' | 'manip';

const SEMANTICS = {
  nav: [
    { k: 0, token: 'Δx', zh: '局部前后位移' },
    { k: 1, token: 'Δy', zh: '局部左右位移' },
    { k: 2, token: 'Δθ', zh: '朝向变化' },
  ],
  manip: [
    { k: 0, token: 'a₁', zh: '本体原生控制通道 1' },
    { k: 1, token: 'a₂', zh: '本体原生控制通道 2' },
    { k: 2, token: 'a₃', zh: '本体原生控制通道 3' },
    { k: 3, token: 'a₄', zh: '本体原生控制通道 4' },
    { k: 4, token: 'a₅', zh: '本体原生控制通道 5' },
  ],
} as const;

export const Ch2Mod3V2: React.FC<WidgetProps> = () => {
  const [lens, setLens] = useState<'shape' | 'semantic'>('semantic');
  const [side, setSide] = useState<Side>('nav');
  const [channel, setChannel] = useState(0);

  const current = useMemo(() => SEMANTICS[side].find((x) => x.k === channel) ?? SEMANTICS[side][0], [side, channel]);
  const setTask = (next: Side) => {
    setSide(next);
    setChannel(0);
  };

  return (
    <div className="c2m3x-lab">
      <div className="c2m3x-toolbar">
        <div className="c2m3x-lens-switch" role="group" aria-label="观察方式">
          <button type="button" className={lens === 'shape' ? 'is-active' : ''} onClick={() => setLens('shape')}>只看接口外形</button>
          <button type="button" className={lens === 'semantic' ? 'is-active' : ''} onClick={() => setLens('semantic')}>打开语义透镜</button>
        </div>
        <div className="c2m3x-eq"><b>同一 H×K 接口</b><i>≠</i><b>同一物理动作</b></div>
      </div>

      <div className={`c2m3x-stage${lens === 'semantic' ? ' is-semantic' : ''}`}>
        <section className={`c2m3x-side${side === 'nav' ? ' is-focus' : ''}`} onClick={() => setTask('nav')}>
          <div className="c2m3x-side-head"><span>视觉-语言导航</span><strong>航点张量</strong></div>
          <div className="c2m3x-grid-box"><TensorGrid rows={6} cols={8} activeC={3} activeH={6} showMask={lens === 'semantic'} /></div>
          <div className="c2m3x-channels">
            {SEMANTICS.nav.map((s) => (
              <button key={s.k} type="button" className={side === 'nav' && channel === s.k ? 'is-active' : ''} onClick={(e) => { e.stopPropagation(); setSide('nav'); setChannel(s.k); }}>{s.token}</button>
            ))}
          </div>
        </section>

        <div className="c2m3x-bridge" aria-hidden="true">
          <span className="c2m3x-port is-left" />
          <svg viewBox="0 0 120 220" preserveAspectRatio="none">
            <path d="M8 110 C42 110 40 58 60 58 C80 58 78 110 112 110" className="c2m3x-wire" />
            <path d="M8 110 C42 110 40 162 60 162 C80 162 78 110 112 110" className="c2m3x-wire is-alt" />
          </svg>
          <div className="c2m3x-core"><span>统一张量接口</span><b>H×K</b><small>形状固定</small></div>
          <span className="c2m3x-port is-right" />
        </div>

        <section className={`c2m3x-side${side === 'manip' ? ' is-focus' : ''}`} onClick={() => setTask('manip')}>
          <div className="c2m3x-side-head"><span>机器人操纵</span><strong>控制张量</strong></div>
          <div className="c2m3x-grid-box"><TensorGrid rows={6} cols={8} activeC={5} activeH={6} showMask={lens === 'semantic'} /></div>
          <div className="c2m3x-channels">
            {SEMANTICS.manip.map((s) => (
              <button key={s.k} type="button" className={side === 'manip' && channel === s.k ? 'is-active' : ''} onClick={(e) => { e.stopPropagation(); setSide('manip'); setChannel(s.k); }}>{s.token}</button>
            ))}
          </div>
        </section>
      </div>

      <div className={`c2m3x-semantic-strip${lens === 'semantic' ? ' is-open' : ''}`}>
        {lens === 'shape' ? (
          <><span className="c2m3x-eye">◉</span><b>把标签遮住时，两侧都只是同样大小的二维张量。</b><p>这正是“统一接口”的含义。</p></>
        ) : (
          <><span className="c2m3x-token">{current.token}</span><b>{side === 'nav' ? '导航' : '操纵'} · 第 {current.k + 1} 个有效通道</b><p>{current.zh}。统一外形并没有抹掉数据集原生控制语义。</p></>
        )}
      </div>

      <div className="ps-controls-row c2m3x-task-tabs">
        <PsChip selected={side === 'nav'} onClick={() => setTask('nav')}>查看导航语义</PsChip>
        <PsChip selected={side === 'manip'} onClick={() => setTask('manip')}>查看操纵语义</PsChip>
      </div>
    </div>
  );
};

export default Ch2Mod3V2;
