import { memo, useId } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { toyModel } from './coop-model';
import { useLessonTimeline } from './lesson-timeline';
import './chapter-motion.css';

const INK = '#152d48', ORANGE = '#ed8754', GREEN = '#2c8b78', BLUE = '#396da7', PURPLE = '#8c72b1';
const COLORS = [BLUE, PURPLE, ORANGE];
const ease = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
const ramp = (p: number, a: number, b: number) => ease((p - a) / (b - a));
const sweep = (p: number, a = .17, b = .74) => ramp(p, a, b) * (1 - ramp(p, .90, 1));

// A short vertical roll exchanges discrete facts in one line. Both layers
// share the same footprint; measured accuracies always use their exact values.
function Handoff({ from, to, mix }: { from: ReactNode; to: ReactNode; mix: number }) {
  const reveal = ramp(mix, .40, .60);
  return <span className="cmx-handoff">
    <span aria-hidden={reveal >= .5} style={{ visibility: reveal === 1 ? 'hidden' : 'visible', transform: 'translateY(' + (-reveal * 100) + '%)' }}>{from}</span>
    <span aria-hidden={reveal < .5} style={{ visibility: reveal === 0 ? 'hidden' : 'visible', transform: 'translateY(' + (1 - reveal) * 100 + '%)' }}>{to}</span>
  </span>;
}

export const CHAPTER_MOTION_COPY: Record<number, { title: string; text: string }> = {
  1: { title: '只多一个词，结果就会变化', text: '同一分类任务、同一模型，只在人工提示里加上一个 a。接下来亲手切换模板，看看措辞有多敏感。' },
  2: { title: '模型读到的，其实是一组数字', text: '文字先变成词元，再变成连续向量。CoOp 直接学习上下文向量，因此不必把每一次更新翻译成一个真实单词。' },
  3: { title: '改一组上下文，三个类别一起响应', text: '共享上下文 V 会进入每个类别的提示。输入发生变化，固定的文本编码器就会给出不同的文本特征。' },
  4: { title: '概率是一场共同分配', text: '猫的分数没有变，但狗的分数升高后，猫分到的概率仍会下降。所有类别的概率始终加起来等于 1。' },
  5: { title: '一套提示共用，还是每类各有一套？', text: '共享上下文让所有类别使用同一组可学习向量；类别专属上下文为每个类别单独学习，参数量也随类别数增长。' },
  6: { title: '换一张图片，提示不再重学', text: '适配完成后，把学到的提示固定下来。新图片改变图像特征与比较结果，不会为每一张图片重新更新上下文。' },
  7: { title: '从预测错误，走到一次参数更新', text: '正确标签让我们计算损失；梯度指出上下文该怎样调整。只有最后执行更新，V 才真正改变。' },
  8: { title: '锁住权重，不等于堵住梯度', text: '冻结的是编码器参数，求导路径仍能穿过编码器回到 V。切断这条路径，上下文才会收不到学习信号。' },
  9: { title: '提示更长，迁移未必更好', text: '在原任务上略有提升，不代表换一种图像风格仍然占优。要把源域成绩与迁移成绩放在一起看。' },
  10: { title: '看见收益，也看见反例', text: '论文中多数任务受益，但 Food101 的结果下降。读实验结论时，要同时保留条件、差异与例外。' },
};
const STEPS: Record<number, string[]> = {
  1: ['原始措辞', '补入一个 a', '对照成绩'], 2: ['读入文字', '转为向量', '学习向量'],
  3: ['共享上下文', '调整输入 V', '特征联动'], 4: ['初始概率', '给狗加分', '概率再分配'],
  5: ['共享一组 V', '分开上下文', '每类一组 V'], 6: ['识别猫图', '换成狗图', '提示未变'],
  7: ['计算预测', '求出梯度', '更新参数'], 8: ['冻结权重', '传回梯度', '切断路径'],
  9: ['比较长度', '原任务成绩', '迁移成绩'], 10: ['逐项比较', '多数提升', '观察反例'],
};

function Lock({ size = 30 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M9 14V10a7 7 0 0 1 14 0v4" stroke="currentColor" strokeWidth="3" /><rect x="5" y="13" width="22" height="17" rx="5" fill="currentColor" /><path d="M16 19v5" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></svg>;
}
const PetPortrait = memo(function PetPortrait({ kind = 'cat', sketch = false }: { kind?: 'cat' | 'dog'; sketch?: boolean }) {
  const id = useId().replace(/:/g, '');
  const cat = kind === 'cat';
  const paper = sketch ? '#fbf8ef' : '#fff2d6';
  const ink = sketch ? '#414955' : '#363b49';
  const coat = sketch ? '#f1eee4' : cat ? '#d99a67' : '#bf8b63';
  const shade = sketch ? '#e0ddd4' : cat ? '#b57553' : '#946449';
  const ear = sketch ? '#d5d0c7' : '#dfa392';
  const hatch = `url(#${id}-etch)`;
  const head = cat
    ? 'M45 117 39 36Q44 33 77 57Q104 44 139 56L176 31Q180 32 172 94Q184 135 159 159Q152 171 129 181L127 187Q109 188 101 182L95 186Q75 179 63 166Q47 161 41 148L48 150Q41 138 39 133L46 135Z'
    : 'M49 115C50 72 66 51 104 50C149 44 174 67 174 107Q177 146 151 169Q133 189 104 184Q64 179 51 148Z';
  return <svg viewBox="0 0 220 220" role="img" aria-label={sketch ? '猫的铅笔素描示意' : cat ? '猫的图片示意' : '狗的图片示意'} className="cmx-pet">
    <defs>
      <pattern id={id + '-etch'} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(32)">
        <path d="M0 0V5" stroke={ink} strokeWidth={sketch ? 1.35 : .82} opacity={sketch ? .7 : .48} />
      </pattern>
      <clipPath id={id + '-head'}><path d={head} /></clipPath>
    </defs>
    <rect width="220" height="220" fill={sketch ? paper : cat ? '#e8d9be' : '#ddd9e8'} />
    <circle cx="154" cy="65" r="49" fill={sketch ? '#eae6db' : cat ? '#f8dfac' : '#efe1ba'} />
    <path d="M0 172Q70 124 150 151Q187 164 220 149V220H0Z" fill={sketch ? '#f2efe5' : '#bdc3b6'} />
    <path d="M0 189Q77 136 160 171Q193 183 220 168V220H0Z" fill={hatch} opacity=".42" />
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      <path d="M32 224Q46 174 84 153L145 154Q178 178 195 224Z" fill={coat} />
      <path d="M39 225Q56 181 75 169L99 190 92 224Z" fill={hatch} stroke="none" />
      <path d="M77 159Q84 190 103 212L109 204 120 222Q140 192 147 159Z" fill={paper} stroke="none" />
      <path d={head} fill={coat} />
      <g clipPath={`url(#${id}-head)`} stroke="none">
        <path d="M28 146Q62 153 84 127Q103 112 107 68Q121 91 118 119Q119 132 145 139Q165 146 190 126V188H30Z" fill={paper} />
        <path d="M26 40Q68 59 74 80Q49 111 63 141L50 155Q28 119 26 40ZM144 61Q180 98 155 132Q165 131 185 119V36Z" fill={shade} />
        <path d="M29 47 70 80Q53 105 60 125L41 146 30 118Z" fill={hatch} />
        <path d="M127 178Q153 166 163 143L183 140V182Z" fill={hatch} />
      </g>
      {cat ? <>
        <path d="m46 45 7 36 15-16ZM168 44l-6 32-13-13Z" fill={ear} strokeWidth="1.4" />
        <path d="m78 61 13 23 3-27 12 20 9-24 4 25 13-23M43 111l23 6-18 2 19 9-19-2m124-19-19 10 17-2-13 11" fill={shade} stroke="none" />
      </> : <>
        <path d="M70 61Q51 43 35 64Q21 95 36 147Q55 152 61 114ZM146 61Q165 46 181 63Q199 91 184 143Q168 149 158 116Z" fill={shade} />
        <path d="M39 72Q24 106 39 139M176 70Q190 100 182 129" fill="none" strokeWidth="1.1" />
      </>}
      <g fill={paper}>
        <path d="M68 106Q78 96 94 105Q83 119 68 106Z" />
        <path d="M123 105Q137 94 150 103Q139 117 123 105Z" />
      </g>
      <g fill={ink} stroke="none"><ellipse cx="83" cy="106" rx={cat ? 2.2 : 3.6} ry="5.1" /><ellipse cx="137" cy="105" rx={cat ? 2.2 : 3.6} ry="5.2" /></g>
      <path d={cat ? 'M98 134Q108 129 119 133Q116 141 109 142Q101 140 98 134Z' : 'M95 132Q107 126 123 130Q122 143 109 145Q97 142 95 132Z'} fill={ink} />
      <path d="M109 142v8q-5 8-13 5m13-5q6 7 13 2" fill="none" strokeLinecap="round" />
      {cat && <path d="M91 139q-19-5-33-3m33 7q-23 0-40 7m39-3q-15 4-25 10m64-20q21-7 38-5m-37 9q20-3 42 4m-43 0q16 2 29 9" fill="none" strokeWidth="1.4" strokeLinecap="round" />}
    </g>
  </svg>;
});
function Picture({ kind = 'cat', label, sketch = false }: { kind?: 'cat' | 'dog'; label?: string; sketch?: boolean }) {
  return <div className="cmx-picture"><div className="cmx-picture-frame"><PetPortrait kind={kind} sketch={sketch} /></div>{label && <strong>{label}</strong>}</div>;
}
function ClassMark({ index }: { index: number }) {
  return <svg className="cmx-class-mark" viewBox="0 0 36 36" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
    {index === 0 && <><path d="m7 15-1-9 9 5q4-2 8 0l7-6-1 11q4 14-11 15Q5 30 7 18Z" /><path d="M10 19q3-2 5 0m6 0q3-2 5 0m-10 3 2 2 2-2m-9 2-6-1m6 4-6 2m20-5 6-2m-6 5 6 2" /></>}
    {index === 1 && <><path d="M9 14Q8 8 18 8q9 0 10 8l-1 8q-2 6-9 7-9 0-10-8Z" /><path d="M11 10Q5 6 4 15l1 7q4 1 6-12Zm14 0q7-3 7 5l-1 7q-4 1-6-12Z" fill="currentColor" fillOpacity=".2" /><path d="M11 18h3m8 0h3m-10 5q3-2 6 0l-3 3Z" /></>}
    {index === 2 && <><path d="M16 14C7 8 14 1 18 10c3-9 11-4 6 3 10-4 13 5 4 8 8 6 1 12-6 5q-4 9-8 0c-8 5-13-3-5-7-9-2-5-10 2-7Z" /><circle cx="18" cy="18" r="4" fill="currentColor" fillOpacity=".28" /></>}
  </svg>;
}
function DialTicks({ center, radius, count }: { center: number; radius: number; count: number }) {
  return <g stroke="#a6afb3" strokeWidth="1.4" aria-hidden="true">
    {Array.from({ length: count }, (_, i) => <line key={i} x1={center} x2={center} y1={center - radius} y2={center - radius + (i % 5 === 0 ? 7 : 3)} transform={`rotate(${360 * i / count} ${center} ${center})`} />)}
  </g>;
}
function Vector({ amount, label = 'V', color = ORANGE, small = false }: { amount: number; label?: ReactNode; color?: string; small?: boolean }) {
  return <div className={'cmx-vector' + (small ? ' cmx-vector-small' : '')} style={{ '--cmx-color': color } as CSSProperties}><b>{label}</b><div className="cmx-vector-bars" aria-hidden="true">{[.3, .72, .45, .86].map((value, i) => <i key={i} style={{ height: `${(value + amount * [.45, -.28, .35, -.32][i]) * 100}%` }} />)}</div></div>;
}
function SceneOne({ p }: { p: number }) {
  const inserted = sweep(p, .20, .42);
  const scored = sweep(p, .32, .50);
  const difference = sweep(p, .57, .73);
  return <div className="cmx-comparison-scene">
    <Picture label="同一个分类任务" />
    <div className="cmx-prompt-demo">
      <span className="cmx-eyebrow">只改变类别名称前的用词</span>
      <div className="cmx-sentence">
        <span>a photo of</span>
        <b className="cmx-added-a" style={{ opacity: inserted, transform: 'translateY(' + (-32 * (1 - inserted)) + 'px) rotate(' + (-10 * (1 - inserted)) + 'deg)' }}>a</b>
        <span className="cmx-class-word">cat.</span>
      </div>
      <div className="cmx-score-track"><div style={{ width: (80.81 + scored * 5.48) + '%' }} /><span className="cmx-score-baseline" style={{ left: '80.81%' }} /></div>
      <div className="cmx-score-line">
        <strong><Handoff from="80.81" to="86.29" mix={scored} /><small>%</small></strong>
        <span className="cmx-benefit" style={{ opacity: difference }}>+5.48 个百分点</span>
      </div>
      <span className="cmx-source-note">Caltech101 · 论文图 1 的人工模板对照</span>
    </div>
  </div>;
}
function SceneTwo({ p }: { p: number }) {
  const learning = sweep(p, .60, .78);
  return <div className="cmx-embedding-scene">
    <div className="cmx-embedding-intro"><strong>文字怎样变成可学习的输入？</strong><span>文字 → 词元 → 连续表示</span></div>
    <div className="cmx-token-row">{['a', 'photo', 'of'].map((word, i) => {
      const flip = sweep(p, .20 + i * .035, .40 + i * .035);
      const changing = sweep(p, .63 + i * .02, .86 + i * .01);
      return <div className="cmx-token" key={word}>
        <div className="cmx-token-turn" style={{ transform: 'rotateX(' + flip * 180 + 'deg)' }}>
          <div className="cmx-token-front">{word}</div>
          <div className="cmx-token-back" style={{
            backgroundColor: 'color-mix(in srgb, #f5e4d5 ' + learning * 100 + '%, #e0ecdf)',
            color: 'color-mix(in srgb, #8f5030 ' + learning * 100 + '%, #2a6957)',
          }}>
            <b><Handoff from={['0.24', '−0.61', '0.83'][i]} to={['V₁', 'V₂', 'V₃'][i]} mix={learning} /></b>
            <div className="cmx-number-stack"><span>{([-.17, .32, -.45][i] + [.12, -.16, .23][i] * changing).toFixed(2)}</span><span>{([.58, -.26, .12][i] + [-.18, .23, .08][i] * changing).toFixed(2)}</span></div>
          </div>
        </div>
        <span><Handoff from={'词元 ' + (i + 1)} to="可学习上下文" mix={learning} /></span>
      </div>;
    })}</div>
    <div className="cmx-scene-note">词元与数值仅作示意，类别名称另行保留。</div>
  </div>;
}
function SceneThree({ p }: { p: number }) {
  const amount = sweep(p), result = toyModel([.5 * amount, -.3 * amount]);
  return <div className="cmx-linked-scene"><div className="cmx-shared-input"><strong>共享上下文 V</strong><Vector amount={amount} /><div className="cmx-class-list"><span>猫</span><span>狗</span><span>花</span></div></div><div className="cmx-encoder"><div className="cmx-encoder-lock"><Lock size={52} /></div><strong>文本编码器</strong><span>权重始终固定</span><div className="cmx-through-arrow" style={{ opacity: .4 + amount * .6 }}>⟶</div></div><div className="cmx-feature-disc"><svg viewBox="0 0 240 240" role="img" aria-label="上下文变化时，三个类别的文本特征一起改变"><circle cx="120" cy="120" r="111" fill="#fffdf8" stroke="#cecdd2" /><DialTicks center={120} radius={106} count={40} /><circle cx="120" cy="120" r="81" fill="none" stroke="#dee1dd" strokeDasharray="2 5" /><path d="M20 120h200M120 20v200" stroke="#dce5e3" strokeWidth="2" />{result.features.map(([x, y], i) => <g key={i}><line x1="120" y1="120" x2={120 + x * 88} y2={120 - y * 88} stroke={COLORS[i]} strokeWidth="5" strokeLinecap="round" /><circle cx={120 + x * 88} cy={120 - y * 88} r="10" fill={COLORS[i]} /></g>)}<circle cx="120" cy="120" r="6" fill={INK} /></svg><div className="cmx-feature-legend">{['猫', '狗', '花'].map((name, i) => <span key={name} style={{ color: COLORS[i] }}>● {name}</span>)}</div><span className="cmx-source-note">教学模型的文本特征</span></div></div>;
}
function SceneFour({ p }: { p: number }) {
  const amount = sweep(p, .20, .72), dog = 1 + amount * 2, weights = [Math.exp(2), Math.exp(dog), 1], sum = weights.reduce((a, b) => a + b, 0), values = weights.map(v => v / sum * 100), circle = 2 * Math.PI * 82; let offset = 0;
  return <div className="cmx-probability-scene"><div className="cmx-score-inputs"><span className="cmx-eyebrow">分数决定相对竞争力</span>{['猫', '狗', '花'].map((name, i) => <div className={'cmx-score-input' + (i === 1 ? ' cmx-score-changing' : '')} key={name}><span className="cmx-score-mark" style={{ color: COLORS[i] }}><ClassMark index={i} /></span><strong>{name}</strong><b>{[2, dog, 0][i].toFixed(1)}</b><span>{i !== 1 ? '固定' : '可调整'}</span></div>)}</div><div className="cmx-donut-wrap"><svg className="cmx-donut" viewBox="0 0 230 230" role="img" aria-label="三类概率共同分配百分之百"><DialTicks center={115} radius={108} count={50} /><circle cx="115" cy="115" r="82" fill="none" stroke="#e6ebe8" strokeWidth="28" />{values.map((v, i) => { const start = offset; offset += v; return <circle key={i} cx="115" cy="115" r="82" fill="none" stroke={COLORS[i]} strokeWidth="28" strokeDasharray={`${v / 100 * circle} ${circle}`} strokeDashoffset={-start / 100 * circle} transform="rotate(-90 115 115)" />; })}<text x="115" y="113" textAnchor="middle" fill={INK} fontFamily="Georgia, serif" fontWeight="700" fontSize="37">100%</text><text x="115" y="143" textAnchor="middle" fill="#536b78" fontWeight="600" fontSize="20">总和不变</text></svg></div><div className="cmx-prob-values">{['猫', '狗', '花'].map((name, i) => <div key={name}><span>{name}的概率</span><strong style={{ borderLeftColor: COLORS[i] }}>{values[i].toFixed(1)}<small>%</small></strong></div>)}<span className="cmx-source-note">softmax 教学算例</span></div></div>;
}
function SceneFive({ p }: { p: number }) {
  const split = sweep(p, .24, .70);
  const ink = (i: number) => 'color-mix(in srgb, ' + COLORS[i] + ' ' + 100 * split + '%, ' + ORANGE + ')';
  return <div className="cmx-sharing-scene">
    <div className="cmx-sharing-head">
      <strong><Handoff from="一组 V，所有类别共用" to="每个类别，独立的一套 V" mix={split} /></strong>
      <span><Handoff from="共享上下文" to="类别专属上下文" mix={split} /></span>
    </div>
    <div className="cmx-sharing-map">
      <div className="cmx-sharing-left">{[0, 1, 2].map(i => <div key={i} className="cmx-sharing-source" style={{ top: (50 + (i - 1) * split * 35) + '%', opacity: i === 1 ? 1 : split }}>
        <Vector amount={i * split * .4} label={<Handoff from="V" to={['V猫', 'V狗', 'V花'][i]} mix={split} />} color={ink(i)} small />
      </div>)}</div>
      <svg viewBox="0 0 120 260" preserveAspectRatio="none" className="cmx-sharing-lines" aria-hidden="true">{[0, 1, 2].map(i => {
        const start = 130 + (i - 1) * split * 91, end = 39 + i * 91;
        return <path key={i} d={'M0 ' + start + 'C60 ' + start + ' 60 ' + end + ' 120 ' + end} fill="none" stroke={ink(i)} strokeWidth="4" />;
      })}</svg>
      <div className="cmx-sharing-classes">{['cat', 'dog', 'flower'].map((name, i) => <div key={name} style={{ color: COLORS[i] }}><ClassMark index={i} /><b>{name}</b></div>)}</div>
    </div>
  </div>;
}
const inferencePercentages = [0, 1].map(i => (toyModel([.5, -.3], i).probs[i] * 100).toFixed(2) + '%');
function SceneSix({ p }: { p: number }) {
  const changed = sweep(p, .27, .61);
  return <div className="cmx-inference-scene">
    <div className="cmx-photo-swap">
      <div aria-hidden={changed >= .5} style={{ opacity: 1 - changed, transform: 'translateX(' + (-changed * 6) + 'px) rotate(' + (-changed * 2) + 'deg)' }}><Picture label="第一张：猫" /></div>
      <div aria-hidden={changed < .5} style={{ opacity: changed, transform: 'translateX(' + (1 - changed) * 6 + 'px) rotate(' + (1 - changed) * 2 + 'deg)' }}><Picture kind="dog" label="第二张：狗" /></div>
    </div>
    <div className="cmx-inference-prompt">
      <div className="cmx-fixed-heading"><Lock size={25} /><strong>学到的提示保持固定</strong></div>
      <div className="cmx-fixed-vectors">{['V₁', 'V₂', 'V₃'].map(v => <Vector key={v} label={v} amount={.6} small />)}</div>
      <div className="cmx-prediction">
        <span>当前识别结果</span><strong><Handoff from="猫" to="狗" mix={changed} /> <i>✓</i></strong>
        <b><Handoff from={inferencePercentages[0]} to={inferencePercentages[1]} mix={changed} /></b>
      </div><span className="cmx-source-note">教学模型 · 仅切换图片</span>
    </div>
  </div>;
}

const trainingStart = toyModel([0, 0]);
const trainingStep = trainingStart.gradient.map(value => -.15 * value);
function SceneSeven({ p }: { p: number }) {
  const forward = ramp(p, .02, .29);
  const backward = ramp(p, .34, .62);
  const update = ramp(p, .66, .82);
  const reset = ramp(p, .93, 1);
  const amount = update * (1 - reset);
  const model = toyModel([trainingStep[0] * update, trainingStep[1] * update]);
  const x = 46 + 138 * (forward - backward);
  const trail = 80 * (forward * (1 - forward) - backward * (1 - backward));
  const returning = ramp(p, .29, .37) * (1 - reset);
  const signal = 'color-mix(in srgb, ' + ORANGE + ' ' + returning * 100 + '%, ' + BLUE + ')';
  const traceLabel = <Handoff from="计算预测" to="求出梯度" mix={returning} />;
  const updateStatus = <Handoff from="V 尚未更新" to="正在更新 V" mix={sweep(p, .656, .70)} />;
  return <div className="cmx-training-scene">
    <div className="cmx-training-observation">
      <div className="cmx-mini-portrait"><PetPortrait /></div><span>正确标签：猫</span>
      <strong>猫的概率</strong><b><Handoff from={(model.probs[0] * 100).toFixed(2)} to={(trainingStart.probs[0] * 100).toFixed(2)} mix={reset} /><small>%</small></b>
    </div>
    <div className="cmx-learning-loop">
      <strong className="cmx-trace-title"><Handoff from={traceLabel} to="更新参数" mix={sweep(p, .62, .70)} /></strong>
      <svg viewBox="0 0 230 74" role="img" aria-label="计算先从上下文到损失，再把梯度从损失传回上下文">
        <path d="M46 37H184" stroke="#d8d7cd" strokeWidth="3" />
        <circle cx="25" cy="37" r="20" fill="#f5e3cf" stroke="#d4af87" />
        <text x="25" y="45" textAnchor="middle" fill="#8b5732">V</text>
        <circle cx="205" cy="37" r="20" fill="#e0ebe4" stroke="#a4bcb1" />
        <text x="205" y="45" textAnchor="middle" fill="#3a715e">L</text>
        <line x1={x - trail} x2={x} y1="37" y2="37" stroke={signal} strokeWidth="4" strokeLinecap="round" opacity=".62" />
        <circle cx={x} cy="37" r="9" fill={signal} opacity=".18" />
        <circle cx={x} cy="37" r="5" fill={signal} />
      </svg>
      <div className="cmx-trace-ends"><span>上下文</span><span>损失</span></div>
    </div>
    <div className="cmx-update-card">
      <span>可学习上下文</span><Vector amount={amount} />
      <div className="cmx-update-status"><Handoff from={updateStatus} to="V 已更新一次" mix={sweep(p, .80, .83)} /></div>
      <div className="cmx-loss"><span>损失</span><b><Handoff from={model.loss.toFixed(4)} to={trainingStart.loss.toFixed(4)} mix={reset} /></b></div>
    </div>
    <span className="cmx-source-note cmx-span-all">教学模型 · 冻结编码器 · 学习率 0.15</span>
  </div>;
}
function SignalLink({ progress, cut = 0, opacity = 1 }: { progress: number; cut?: number; opacity?: number }) {
  const end = 6 + cut * 46;
  const tip = 82 - (82 - end) * progress;
  return <svg className="cmx-signal-link" viewBox="0 0 88 36" preserveAspectRatio="none" aria-hidden="true">
    <path d="M82 18H6" fill="none" stroke="#d1d4ce" strokeWidth="2" />
    <g opacity={opacity}>
      <path d={'M82 18H' + tip} fill="none" stroke={ORANGE} strokeWidth="3" />
      <path d={'m' + (tip + 4) + ' 13 -5 5 5 5'} opacity={ramp(progress, 0, .12)} stroke="#ba673b" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <g opacity={cut} stroke="#a24e46" strokeWidth="2.6" strokeLinecap="round">
      <rect x="34" y="6" width="16" height="24" fill="#f6f3eb" stroke="none" />
      <path d="m36 10 12 16m0-16-12 16" />
    </g>
  </svg>;
}
function SceneEight({ p }: { p: number }) {
  const cut = sweep(p, .625, .71);
  const trace = ramp(p, .29, .57);
  const clear = 1 - ramp(p, .59, .655);
  const retry = ramp(p, .68, .81);
  const firstPass = p < .655;
  const contextSignal = Math.max(0, trace * 2 - 1);
  const outputSignal = firstPass ? Math.min(1, trace * 2) : retry;
  const direction = sweep(p, .30, .37);
  const state = <Handoff from="保留求导路径" to="梯度向左返回" mix={direction} />;
  const explanation = <Handoff from="固定的是编码器的权重。它的输入 V 仍然可以求导。" to="损失的梯度经过固定的编码器，回到输入 V。" mix={direction} />;
  return <div className="cmx-gradient-scene">
    <div className="cmx-gradient-top">
      <span className="cmx-fixed-heading"><Lock size={23} />编码器权重始终固定</span>
      <b className={cut > .5 ? 'is-cut' : ''}><Handoff from={state} to="梯度已切断" mix={cut} /></b>
    </div>
    <div className="cmx-signal-chain">
      <div className="cmx-signal-station"><div className="cmx-signal-input"><i>V</i></div><strong>上下文</strong></div>
      <SignalLink progress={contextSignal} opacity={clear} />
      <div className="cmx-signal-station"><div className="cmx-signal-encoder"><Lock size={38} /></div><strong>文本编码器</strong></div>
      <SignalLink progress={outputSignal} opacity={firstPass ? clear : 1 - ramp(p, .90, .948)} cut={cut} />
      <div className="cmx-signal-station"><div className="cmx-signal-loss">ℒ</div><strong>分类损失</strong></div>
    </div>
    <p className={'cmx-gradient-result' + (cut > .5 ? ' is-cut' : '')}><Handoff from={explanation} to="在编码器输出处断开后，梯度无法到达 V。" mix={cut} /></p>
  </div>;
}

const sourceAccuracies = [71.73, 71.92], sketchAccuracies = [47.89, 46.71];
function SceneNine({ p }: { p: number }) {
  const sketch = sweep(p, .59, .77);
  const reveal = ramp(p, .06, .31) * (1 - ramp(p, .92, 1));
  return <div className="cmx-transfer-scene">
    <div className="cmx-transfer-image">
      <div className="cmx-domain-pill"><Handoff from="原任务：ImageNet" to="迁移：ImageNet-Sketch" mix={sketch} /></div>
      <div className="cmx-picture"><div className="cmx-picture-frame">
        <div className="cmx-style-wipe" role="img" aria-label={sketch > .5 ? '同一只猫的铅笔素描' : '猫的照片示意'}>
          <PetPortrait /><div aria-hidden="true" style={{ clipPath: 'inset(0 ' + (1 - sketch) * 100 + '% 0 0)' }}><PetPortrait sketch /></div>
        </div>
      </div><strong><Handoff from="先看照片上的结果" to="换成素描，排序改变" mix={sketch} /></strong></div>
    </div>
    <div className="cmx-length-comparison">{[4, 16].map((n, i) => {
      const source = sourceAccuracies[i], target = sketchAccuracies[i];
      const width = (source + (target - source) * sketch) * reveal;
      const leading = p >= 1 / 3 && (sketch > .56 ? i === 0 : sketch < .44 && i === 1);
      return <div className={'cmx-length-row' + (leading ? ' cmx-row-better' : '')} key={n}>
        <div className="cmx-length-heading"><b>M = {n}</b><strong><Handoff from={source.toFixed(2)} to={target.toFixed(2)} mix={sketch} /><small>%</small></strong></div>
        <div className="cmx-context-length">{Array.from({ length: n }, (_, j) => <i key={j} />)}</div>
        <div className="cmx-result-track"><div style={{ width: width + '%', background: i === 0 ? GREEN : BLUE }} /></div>
      </div>;
    })}<span className="cmx-source-note">论文表 1 · ViT-B/16 · ImageNet 16-shot 适配</span></div>
  </div>;
}
function SceneTen({ p }: { p: number }) {
  const rows: [string, number][] = [['ImageNet', 4.77], ['StanfordCars', 17.75], ['EuroSAT', 45.97], ['Food101', -2.64]];
  return <div className="cmx-evidence-scene"><div className="cmx-evidence-head"><strong>多数提升，但有例外</strong><span>CoOp − 零样本 CLIP / 百分点</span></div><div className="cmx-evidence-bars">{rows.map(([name, value], i) => { const amount = sweep(p, .025 + i * .19, .225 + i * .19); return <div className={'cmx-evidence-row' + (value < 0 ? ' cmx-negative-row' : '')} key={name}><b>{name}</b><div className="cmx-evidence-plot"><i className="cmx-zero-line" /><i className="cmx-evidence-bar" style={{ width: `${Math.abs(value) / 46 * 79 * amount}%`, left: value < 0 ? `${13 - Math.abs(value) / 46 * 79 * amount}%` : '13%', background: value < 0 ? '#c96762' : GREEN }} /></div><strong style={{ color: value < 0 ? '#b65852' : GREEN, opacity: .35 + amount * .65 }}>{value > 0 ? '+' : ''}{value.toFixed(2)}</strong></div>; })}</div><span className="cmx-source-note">论文图 4 的部分任务 · RN50 · 16-shot · 负收益也保留</span></div>;
}

const SCENES = [SceneOne, SceneOne, SceneTwo, SceneThree, SceneFour, SceneFive, SceneSix, SceneSeven, SceneEight, SceneNine, SceneTen];
// Choose a readable frame within the selected third when there is no playback.
// This keeps stopped photographs, discrete predictions and signed labels clear.
const STILL_FRAMES: Partial<Record<number, [number, number, number]>> = {
  5: [.16, .64, .84],
  6: [.16, .64, .84],
  7: [.29, .625, .84],
  8: [.16, .58, .84],
  9: [.315, .50, .82],
};
export function ChapterMotion({ chapter }: { chapter: number }) {
  const { root, progress, stage, running, requested, play, seek } = useLessonTimeline();
  const Scene = SCENES[chapter] || SceneOne;
  const sceneProgress = requested ? progress : (STILL_FRAMES[chapter]?.[stage] ?? (stage + .5) / 3);

  return <div ref={root} className="chapter-motion" data-chapter={chapter} data-running={running} data-stage={stage} aria-label={CHAPTER_MOTION_COPY[chapter].title}>
    <div className="cmx-topbar">
      <span><i className={running ? 'is-playing' : ''} />{requested ? '自动演示' : '静态预览'}</span>
      {!requested && <button type="button" onClick={play} aria-label={'播放第 ' + chapter + ' 章动画'}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 2 10 6-10 6Z" fill="currentColor" /></svg>播放演示
      </button>}
    </div>
    <div className="cmx-stage"><Scene p={sceneProgress} /></div>
    <div className="cmx-stepper" role="group" aria-label="选择动画阶段">
      <div className="cmx-timeline" aria-hidden="true">
        <i className="cmx-timeline-fill" style={{ transform: 'scaleX(' + progress + ')', opacity: 1 - ramp(progress, .972, 1) }} />
      </div>
      {STEPS[chapter].map((label, index) => <button
        type="button" className={stage === index ? 'is-current' : ''}
        aria-pressed={stage === index} key={label} onClick={() => seek(index)}
      ><span aria-hidden="true">0{index + 1}</span><b>{label}</b></button>)}
    </div>
  </div>;
}
