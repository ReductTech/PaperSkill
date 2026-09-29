import React, { useState } from 'react';

type Exhibit = 'full' | 'adapter' | 'prefix' | 'final';

function MiniGear({ active = false, small = false }: { active?: boolean; small?: boolean }) {
  return <span className={`mm-gear ${active ? 'is-active' : ''} ${small ? 'is-small' : ''}`} aria-hidden="true"><i /></span>;
}

export function MechanicalMuseum({ onNext }: { onNext: () => void }) {
  const [exhibit, setExhibit] = useState<Exhibit>('full');
  const [wheelTurns, setWheelTurns] = useState(0);
  const [adapters, setAdapters] = useState([false, false]);
  const [prefixCount, setPrefixCount] = useState(0);

  const fullComplete = wheelTurns >= 3;
  const adapterComplete = adapters.every(Boolean);
  const prefixComplete = prefixCount >= 5;

  const turnWheel = () => setWheelTurns((current) => Math.min(3, current + 1));
  const addAdapter = (index: number) => {
    setAdapters((current) => current.map((value, i) => i === index ? true : value));
  };
  const addPrefix = () => setPrefixCount((current) => Math.min(8, current + 1));

  if (exhibit === 'final') {
    return (
      <section className="museum-stage museum-finale" aria-label="ACT 1 结论">
        <div className="museum-dark-hall" aria-hidden="true"><i /><i /><i /></div>
        <div className="museum-questions">
          <p>Can we modify the machine...</p>
          <strong>without adding new depth?</strong>
          <strong>without consuming input space?</strong>
          <strong>without rewriting everything?</strong>
          <div className="story-transition story-transition-dark">
            <small>下一步·找准真正的改变</small>
            <p>Adapter 增加路径，Prefix 占用输入，Full FT 重写整台机器。要避开这三种代价，我们必须先解剖微调前后究竟变了什么。</p>
            <button onClick={onNext}>进入 ΔW 机械解剖台 →</button>
          </div>
        </div>
      </section>
    );
  }

  const index = exhibit === 'full' ? 0 : exhibit === 'adapter' ? 1 : 2;

  return (
    <section className="museum-stage" aria-labelledby="museum-title">
      <div className="museum-arches" aria-hidden="true" />
      <header className="museum-header">
        <div>
          <span>ACT 1 · GALLERY OF OLD SOLUTIONS</span>
          <h1 id="museum-title">旧机械博物馆</h1>
        </div>
        <div className="museum-ticket">ADMIT ONE · MODEL ENGINEER</div>
      </header>

      <nav className="museum-map" aria-label="展台进度">
        {['FULL FINE-TUNING', 'ADAPTER', 'PREFIX TUNING'].map((name, i) => (
          <span key={name} className={`${i === index ? 'is-current' : ''} ${i < index ? 'is-complete' : ''}`}>
            <b>0{i + 1}</b>{name}
          </span>
        ))}
      </nav>

      <div className="museum-hall">
        <article className={`museum-exhibit full-exhibit ${exhibit === 'full' ? 'is-open' : ''} ${index > 0 ? 'is-complete' : ''}`}>
          <div className="museum-spotlight" />
          <div className="museum-label"><small>展台一</small><h2>FULL FINE-TUNING</h2></div>
          <div className="full-machine">
            <div className="full-gears" aria-label={fullComplete ? '整台发动机所有部件都在调整' : '等待调整的整台发动机'}>
              <MiniGear active={wheelTurns > 0} />
              <MiniGear active={wheelTurns > 1} small />
              <MiniGear active={wheelTurns > 2} />
              <MiniGear active={wheelTurns > 1} small />
            </div>
            <button
              className="museum-handwheel"
              style={{ transform: `rotate(${wheelTurns * 120}deg)` }}
              onClick={turnWheel}
              disabled={exhibit !== 'full' || fullComplete}
              aria-label="转动巨大手轮"
            ><i /><i /><i /><i /><b /></button>
          </div>
          <div className="museum-instruction">
            {fullComplete ? (
              <div className="museum-result">
                <strong>整台发动机所有部件都开始调整。</strong>
                <p><b>优点：</b>自由度高。</p>
                <p><b>代价：</b>每个任务都要修改和存储大量参数。</p>
                <button onClick={() => setExhibit('adapter')}>点亮下一座展台</button>
              </div>
            ) : <p>转动巨大手轮，让整台发动机完成三次校准。<em>{wheelTurns} / 3</em></p>}
          </div>
        </article>

        <article className={`museum-exhibit adapter-exhibit ${exhibit === 'adapter' ? 'is-open' : ''} ${index > 1 ? 'is-complete' : ''}`}>
          <div className="museum-spotlight" />
          <div className="museum-label"><small>展台二</small><h2>ADAPTER</h2></div>
          <div className="adapter-path" aria-label="加入 Adapter 后变深的机械路径">
            <MiniGear active={exhibit === 'adapter'} small />
            {[0, 1].map((slot) => (
              <React.Fragment key={slot}>
                <span className="path-arrow">↓</span>
                {adapters[slot] ? (
                  <button className="adapter-module is-installed" disabled>[ADAPTER MODULE]</button>
                ) : (
                  <button className="adapter-module" onClick={() => addAdapter(slot)} disabled={exhibit !== 'adapter'}>
                    + 插入模块
                  </button>
                )}
                <span className="path-arrow">↓</span>
                <MiniGear active={exhibit === 'adapter'} small />
              </React.Fragment>
            ))}
          </div>
          <div className={`latency-meter ${adapterComplete ? 'is-high' : ''}`}>
            <span>LATENCY</span><b>{adapterComplete ? '↑ ↑ ↑' : '—'}</b>
          </div>
          <div className="museum-instruction">
            {adapterComplete ? (
              <div className="museum-result">
                <strong>路径变深了；每个新增模块都要串行经过。</strong>
                <p>论文指出：Adapter 增加网络深度，在在线、小 batch 场景下可能带来明显额外推理延迟。</p>
                <button onClick={() => setExhibit('prefix')}>点亮下一座展台</button>
              </div>
            ) : <p>点击机械路径中的空位，亲手加入两个 Adapter 模块。</p>}
          </div>
        </article>

        <article className={`museum-exhibit prefix-exhibit ${exhibit === 'prefix' ? 'is-open' : ''}`}>
          <div className="museum-spotlight" />
          <div className="museum-label"><small>展台三</small><h2>PREFIX TUNING</h2></div>
          <div className="input-track">
            <div className="track-title"><span>INPUT TRACK</span><b>固定长度：8 格</b></div>
            <div className="track-slots">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className={i < prefixCount ? 'prefix-token' : 'input-space'}>
                  {i < prefixCount ? `[P${i + 1}]` : 'INPUT'}
                </span>
              ))}
            </div>
            <div className="space-readout">
              <span>真实输入空间</span>
              <i><b style={{ width: `${((8 - prefixCount) / 8) * 100}%` }} /></i>
              <strong>{8 - prefixCount} / 8</strong>
            </div>
            <button className="prefix-add" onClick={addPrefix} disabled={exhibit !== 'prefix' || prefixCount >= 8}>
              + ADD PREFIX TOKEN
            </button>
          </div>
          <div className="museum-instruction">
            {prefixComplete ? (
              <div className="museum-result">
                <strong>Adding adaptation tokens consumes usable sequence length.</strong>
                <p>Prompt / Prefix 类方法还可能更难优化；新增 token 同时占用了原本可用于真实输入的序列长度。</p>
                <button onClick={() => setExhibit('final')}>关闭展厅</button>
              </div>
            ) : <p>不断加入 Prefix token，观察固定轨道中真实输入空间如何缩短。<em>{prefixCount} / 5</em></p>}
          </div>
        </article>
      </div>
    </section>
  );
}
