import React, { useRef, useState } from 'react';
import { Chips, Feedback } from './coop-kit';
import { useAnimatedNumbers } from './motion-hooks';
import './competition-reference.css';

const names = ['猫', '狗', '花'];
const M = 16;
const D = 512;
const INITIAL = .2;
const signed = (value: number) => (value >= 0 ? '+' : '−') + Math.abs(value).toFixed(2);

export const SharingLab: React.FC = () => {
  const [mode, setMode] = useState('unified');
  const [position, setPosition] = useState('end');
  const [classCount, setClassCount] = useState('3');
  const [selected, setSelected] = useState(0);
  const [sharedValue, setSharedValue] = useState(INITIAL);
  const [independentValues, setIndependentValues] = useState([INITIAL, INITIAL, INITIAL]);
  const [hasEdited, setHasEdited] = useState(false);
  const [dragging, setDragging] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLElement>(null);
  const shared = mode === 'unified';
  const middle = position === 'middle';
  const groups = shared ? 1 : Number(classCount);
  const parameterCount = groups * M * D;
  const values = shared ? [sharedValue, sharedValue, sharedValue] : independentValues;
  const editorValue = values[selected];
  const display = useAnimatedNumbers(values, dragging ? 80 : 500);
  const [displayParameters] = useAnimatedNumbers([parameterCount], 650);
  const updateValue = (next: number) => {
    const value = Math.max(-1, Math.min(1, Math.round(next * 100) / 100));
    setHasEdited(true);
    if (shared) setSharedValue(value);
    else setIndependentValues(previous => previous.map((old, i) => i === selected ? value : old));
  };
  const dragAt = (clientX: number) => {
    const bounds = sliderRef.current?.getBoundingClientRect();
    if (bounds) updateValue((clientX - bounds.left - 25) / (bounds.width - 50) * 2 - 1);
  };
  const changeMode = (next: string) => { setMode(next); setHasEdited(false); };
  const selectGroup = (index: number) => {
    setSelected(index); setHasEdited(false);
    if (window.matchMedia('(max-width: 850px)').matches) {
      sliderRef.current?.focus({ preventScroll: true });
      editorRef.current?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  };
  const reset = () => {
    setMode('unified'); setPosition('end'); setClassCount('3'); setSelected(0);
    setSharedValue(INITIAL); setIndependentValues([INITIAL, INITIAL, INITIAL]); setHasEdited(false);
    if (detailsRef.current) detailsRef.current.open = false;
  };

  return <div className="cr-lab cr-sharing" onKeyDown={event => { if (event.key.startsWith('Arrow')) event.stopPropagation(); }}>
    <div className="cr-premise"><span className="cr-simulation">参数引用实验</span><p>改一个上下文数值。看看三条提示中，哪些会跟着变。</p></div>
    <Chips label="这些类别使用几套参数？" value={mode} onChange={changeMode} options={[{ value: 'unified', label: '共享一套' }, { value: 'csc', label: '每类一套 · CSC' }]} />
    <div className="cr-reference-stage" data-shared={shared} data-position={position}>
      <section className="cr-parameter-editor" ref={editorRef}>
        <div className="cr-editor-heading"><span>正在编辑</span><strong>{shared ? '共享 V' : names[selected] + '的 V' + ['₁', '₂', '₃'][selected]}</strong></div>
        <p>第 1 个向量的第 1 个数值</p>
        <output className="cr-editor-value" data-testid="editor-value">{signed(editorValue)}</output>
        <div ref={sliderRef} className="cr-parameter-slider" role="slider" tabIndex={0} aria-label={(shared ? '共享上下文' : names[selected] + '类独立上下文') + '第一个向量的第一个数值'} aria-valuemin={-1} aria-valuemax={1} aria-valuenow={editorValue} aria-valuetext={signed(editorValue)}
          onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); dragAt(event.clientX); }}
          onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) dragAt(event.clientX); }}
          onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); setDragging(false); }}
          onPointerCancel={() => setDragging(false)}
          onKeyDown={event => { if (['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'Home', 'End'].includes(event.key)) { event.preventDefault(); event.stopPropagation(); updateValue(event.key === 'Home' ? -1 : event.key === 'End' ? 1 : editorValue + (['ArrowRight', 'ArrowUp'].includes(event.key) ? .05 : -.05)); } }}>
          <span className="cr-parameter-rail"><i style={{ width: (editorValue + 1) * 50 + '%' }} /><b style={{ left: (editorValue + 1) * 50 + '%' }} /></span>
        </div>
        <div className="cr-slider-scale"><span>−1.00</span><span>0</span><span>+1.00</span></div>
        <p className="cr-drag-hint">左右拖动橙色圆点，或用方向键</p>
        <button type="button" className="cr-adjust-button" disabled={editorValue >= 1} onClick={() => updateValue(editorValue + .25)}>增加 {Math.min(.25, 1 - editorValue).toFixed(2)} <span aria-hidden="true">↗</span></button>
        <span className="cr-editor-foot">这里只展开每组 8,192 个参数中的一个。</span>
        <div className="cr-mobile-reference" aria-label="三行当前读取的数值">{names.map((name, i) => <span key={name}>{name}<strong>{signed(display[i])}</strong></span>)}</div>
      </section>
      <section className="cr-reference-prompts">
        <div className="cr-reference-heading"><strong>{shared ? '同一组，被引用三次' : '三组，分别存储'}</strong><p>{shared ? '下面三行读取同一个数值。' : '点选一行，再改它直接引用的那组参数。'}</p></div>
        {names.map((name, i) => <div key={name} className={'cr-reference-row' + (shared || selected === i ? ' cr-reference-active' : '')} data-index={i}>
          <div className="cr-reference-row-head"><strong>{name}</strong><span>{shared ? '↳ 共用 V' : '↳ 独立 V' + ['₁', '₂', '₃'][i]}</span>{!shared && <button type="button" aria-pressed={selected === i} aria-label={'选择' + name + '的参数'} onClick={() => selectGroup(i)}>{selected === i ? '正在编辑' : '编辑这组'}</button>}</div>
          <div className="cr-reference-strip" aria-label={name + '的提示，第一个向量的第一个数值为' + signed(values[i]) + '，类别名在' + (middle ? '中间' : '末尾')}>
            <span className="cr-expanded-context" data-testid={'reference-value-' + i} style={{ backgroundColor: 'hsl(24 72% ' + (87 - (display[i] + 1) * 9) + '%)' }}>{signed(display[i])}</span>
            {Array.from({ length: 15 }, (_, k) => { const j = k + 1; return <i className="cr-context-slot" key={j} style={{ '--cr-slot': k, '--cr-shift': middle && j >= 8 ? 1 : 0, left: 20 + k * 3.1 + (middle && j >= 8 ? 28 : 0) + '%' } as React.CSSProperties} />; })}
            <span className="cr-fixed-class" style={{ left: middle ? '43%' : '70%' }}>{name}</span>
          </div>
        </div>)}
        <div className="cr-reference-legend"><span><i />16 个上下文向量</span><span><i />固定类别名称</span></div>
      </section>
    </div>
    <div className="cr-reference-feedback" aria-live="polite"><strong>{shared ? hasEdited ? '三行一起变了。' : '先改一次，观察三行。' : hasEdited ? '只有' + names[selected] + '的这一组变了。' : '现在选中' + names[selected] + '的独立参数。'}</strong><p>{shared ? '因为三条提示读取同一组 V。名称仍不同，因此完整提示和文本特征不必相同。' : '另两组保持各自的数值。这里演示参数的存储与引用，没有执行训练或计算分类概率。'}</p></div>
    <div className="cr-parameter-count"><div><strong>{groups}</strong><span>组上下文</span></div><span aria-hidden="true">×</span><div><strong>8,192</strong><span>每组 16 × 512</span></div><span aria-hidden="true">=</span><div className="cr-count-total"><strong data-testid="parameter-count">{Math.round(displayParameters).toLocaleString('zh-CN')}</strong><span>个可训练参数</span></div></div>
    <details ref={detailsRef} className="cr-details"><summary>第二层探索：移动类别名，或增加类别数</summary>
      <Chips label="类别名称放在哪里？" value={position} onChange={setPosition} options={[{ value: 'end', label: '16 个向量之后' }, { value: 'middle', label: '前 8 个与后 8 个之间' }]} />
      <p>名称位置会在上方提示里移动；上下文仍是 16 个向量，因此参数总量不变。</p>
      <Chips label="任务的类别数 K" value={classCount} onChange={setClassCount} options={[{ value: '3', label: '3 类' }, { value: '10', label: '10 类' }, { value: '100', label: '100 类' }]} />
      <p>共享始终只有一组；CSC 每增加一个类别就增加一组。上图仅显示猫、狗、花，统计包含全部 {classCount} 类。两种模式分别保留你的改动，方便来回对照。</p>
      <p className="note">本例 M = 16、d = 512。橙色块是上下文向量，显示的数字是其中一个分量；类别名称可能含多个 token。固定起止标记与位置嵌入已省略。依据 CoOp 第 5 页式（2）、式（4）；示意参数不是训练结果。</p>
    </details>
    <Feedback>独立存储不等于训练时只更新正确类别。一次分类损失仍可能通过 softmax，向多个类别的提示传回梯度。更多参数也不保证更高准确率。</Feedback>
    <button type="button" className="cr-text-button cr-reset" onClick={reset}>恢复初始实验</button>
  </div>;
};

export default SharingLab;
