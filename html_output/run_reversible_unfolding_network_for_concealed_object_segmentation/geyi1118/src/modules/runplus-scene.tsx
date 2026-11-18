import React, { useMemo, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';
import './run-scenes.css';

const C = { ink: '#21324a', muted: '#68778f', blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47', line: '#d7deea', field: '#f5f8f0', leaf: '#b8c9a7', deep: '#76906a' };
const clamp = (x: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
const f2 = (x: number) => Number(x).toFixed(2);
const values = [0.18, 0.28, 0.42, 0.25, 0.16, 0.22, 0.48, 0.72, 0.51, 0.19, 0.17, 0.63, 0.91, 0.66, 0.21, 0.13, 0.46, 0.74, 0.49, 0.18, 0.1, 0.2, 0.37, 0.22, 0.12];

function Canvas({ children, label = '交互式示意图' }: { children: React.ReactNode; label?: string }) {
	return <svg className="run-viz" viewBox="0 0 900 430" role="img" aria-label={label}>{children}</svg>;
}
function Grid({ data, active = -1, onPick }: { data: number[]; active?: number; onPick?: (i: number) => void }) {
	return <div className="run-grid" role="group" aria-label="5乘5掩码数值网格">{data.map((v, i) => <button key={i} type="button" aria-label={`像素 ${i + 1}，${f2(v)}`} aria-pressed={active === i} onClick={() => onPick?.(i)} style={{ background: `rgba(39,68,110,${.08 + .78 * v})`, color: v > .56 ? '#fff' : C.ink, outline: active === i ? `3px solid ${C.orange}` : 'none' }}>{f2(v)}</button>)}</div>;
}
export function AmbiguityScene() {
	const [threshold, setThreshold] = useState(.5);
	const foreground = threshold >= .5;
	return <div className="run-scene ambiguity">
		<Canvas label="拖动阈值比较掩码边界与 RGB 冲突">
			<rect width="900" height="430" fill={C.field} /><path d="M0 330Q180 150 360 300T700 250T900 315V430H0Z" fill={C.leaf} />
			<path d="M260 64Q320 42 380 64L400 340Q320 390 240 340Z" fill="#ede9da" stroke={C.deep} strokeWidth="5" />
			<path d="M260 155Q325 100 390 158M245 235Q320 180 398 235M250 305Q322 255 392 310" fill="none" stroke="#9bac7b" strokeWidth="35" />
			<path d={`M${260 - threshold * 24} 190Q320 ${140 + threshold * 35} 390 190L380 270Q320 ${318 - threshold * 25} 260 270Z`} fill={foreground ? '#27446e77' : '#c43f5277'} stroke={foreground ? C.blue : C.red} strokeWidth="7" strokeDasharray="12 8" />
			<text x="45" y="70" fill={C.ink} fontSize="28">前景判定阈值 {f2(threshold)}</text>
			<text x="45" y="390" fill={foreground ? C.red : C.blue} fontSize="26">{foreground ? '边界扩大：背景纹理被误纳入' : '边界收紧：隐蔽目标可能漏分'}</text>
		</Canvas>
		<div className="run-control-line"><label>前景判定阈值 <b>{f2(threshold)}</b><input aria-label="前景判定阈值" type="range" min="0.1" max="0.9" step="0.01" value={threshold} onChange={e => setThreshold(Number(e.target.value))} /></label><p className={foreground ? 'is-risk' : 'is-guide'}>{foreground ? '掩码本身无法判断相似纹理是否属于目标。' : '收紧边界能减少误分，但可能漏掉真实前景。'}</p></div>
	</div>;
}

export function DomainConflictScene() {
	const [index, setIndex] = useState(12); const [mask, setMask] = useState(.5);
	const input = values[index]; const fg = input * mask; const bg = .8 * (1 - mask); const residual = input - fg - bg;
	const nextMask = (v: number) => { setMask(v); };
	return <div className="run-scene conflict">
		<Grid data={values} active={index} onPick={i => { setIndex(i); setMask(values[i]); }} />
		<div className="conflict-detail"><Canvas label="选中像素的前景、背景与重建残差">
			<rect width="900" height="430" fill={C.field} /><text x="48" y="62" fill={C.ink} fontSize="30">同一像素的 RGB 解释</text>
			<rect x="90" y="132" width="680" height="58" fill="#e8edf0" /><rect x="90" y="132" width={680 * clamp(fg / input)} height="58" fill={C.blue} /><rect x={90 + 680 * clamp(fg / input)} y="132" width={680 * clamp(bg / input)} height="58" fill={C.green} />
			<text x="90" y="240" fill={C.ink} fontSize="25">输入 C = {f2(input)}</text><text x="90" y="292" fill={C.blue} fontSize="25">前景 C·M = {f2(fg)}</text><text x="420" y="292" fill={C.green} fontSize="25">背景 B = {f2(bg)}</text>
			<text x="90" y="370" fill={Math.abs(residual) < .08 ? C.green : C.red} fontSize="30">残差 C − C·M − B = {f2(residual)}</text>
		</Canvas>
			<label className="run-control-line">掩码 M <b>{f2(mask)}</b><input type="range" min="0" max="1" step="0.01" value={mask} onChange={e => nextMask(Number(e.target.value))} /></label>
			<p>像素值是合成示意。分割边界的不确定性可能转化为 RGB 重组冲突。</p></div>
	</div>;
}

export function SeparationScene() {
	const [mask, setMask] = useState(.55); const [background, setBackground] = useState(.18); const image = .8;
	const foreground = image * mask; const residual = image - foreground - background;
	return <div className="run-scene equation-scene">
		<div className="equation-large"><SymbolHint meaning="C：输入 RGB 图像；此处以单一归一化强度演示。">C</SymbolHint> = <span style={{ color: C.blue }}>C·M</span> + <span style={{ color: C.green }}>B</span> + <span style={{ color: C.red }}>R</span></div>
		<Canvas label="前景、背景和重组残差的单像素分解"><rect width="900" height="430" fill={C.field} /><text x="52" y="70" fill={C.ink} fontSize="30">输入强度 C = {f2(image)}</text><rect x="70" y="130" width="760" height="78" fill="#e8edf0" /><rect x="70" y="130" width={760 * foreground / image} height="78" fill={C.blue} /><rect x={70 + 760 * foreground / image} y="130" width={760 * background / image} height="78" fill={C.green} /><text x="70" y="275" fill={C.blue} fontSize="26">前景 C·M = {f2(foreground)}</text><text x="390" y="275" fill={C.green} fontSize="26">背景 B = {f2(background)}</text><text x="650" y="275" fill={C.red} fontSize="26">残差 R = {f2(residual)}</text><text x="70" y="370" fill={C.muted} fontSize="22">重组一致不等于语义必然正确</text></Canvas>
		<div className="equation-controls"><label>前景掩码 M <b>{f2(mask)}</b><input type="range" min="0" max="1" step="0.01" value={mask} onChange={e => setMask(Number(e.target.value))} /></label><label>背景估计 B <b>{f2(background)}</b><input type="range" min="0" max="0.8" step="0.01" value={background} onChange={e => setBackground(Number(e.target.value))} /></label></div>
	</div>;
}

export function SparsityScene() {
	const [data, setData] = useState(values); const [index, setIndex] = useState(12); const m = data[index];
	const mapped = m >= .1 && m < .4 ? .1 : m > .6 && m <= .9 ? .9 : m; const weight = m >= .4 && m <= .6 ? 0 : 1; const loss = weight * Math.abs(m - mapped);
	return <div className="run-scene sparsity-scene"><Grid data={data} active={index} onPick={setIndex} /><div className="sparsity-right"><div className="equation-large">M={f2(m)} → M̃={f2(mapped)}; w={weight}</div><Canvas label="按论文阈值规则显示当前像素映射"><rect width="900" height="430" fill={C.field} /><path d="M80 310H820" stroke={C.line} strokeWidth="4" /><path d="M80 310V80" stroke={C.line} strokeWidth="4" /><path d="M130 280H360V145H540V105H770" fill="none" stroke={C.blue} strokeWidth="9" /><rect x="410" y="85" width="145" height="240" fill="#f07e4730" /><circle cx={130 + 640 * m} cy={m >= .4 && m <= .6 ? 215 : 145} r="19" fill={weight ? C.orange : C.green} /><text x="405" y="370" fill={C.ink} fontSize="22">不确定区间：[0.4, 0.6]</text><text x="80" y="55" fill={C.ink} fontSize="25">M → M̃ 映射与 w 权重</text></Canvas><label>选中像素掩码 M <b>{f2(m)}</b><input type="range" min="0" max="1" step="0.01" value={m} onChange={e => setData(prev => prev.map((v, i) => i === index ? Number(e.target.value) : v))} /></label><p className={weight ? 'is-guide' : 'is-success'}>{weight ? `该像素稀疏惩罚 |M−M̃| = ${f2(loss)}。` : '该像素位于不确定区间，w=0，不计入此稀疏项。'}</p></div></div>;
}

export function AlternatingScene() {
	const [step, setStep] = useState<'mask' | 'background'>('background'); const [m, setM] = useState(.62); const [b, setB] = useState(.2); const [lambda, setLambda] = useState(1); const c = .8; const nextB = (lambda * b + c - c * m) / (1 + lambda); const selected = step === 'background' ? nextB : m;
	return <div className="run-scene update-scene"><div className="update-controls"><div className="choice-row"><button className={step === 'mask' ? 'selected' : ''} onClick={() => setStep('mask')}>更新 M</button><button className={step === 'background' ? 'selected' : ''} onClick={() => setStep('background')}>更新 B</button></div><label>掩码 M <b>{f2(m)}</b><input type="range" min="0" max="1" step=".01" value={m} onChange={e => setM(+e.target.value)} /></label><label>旧背景 Bₖ₋₁ <b>{f2(b)}</b><input type="range" min="0" max=".8" step=".01" value={b} onChange={e => setB(+e.target.value)} /></label><label>背景权重 λ <b>{f2(lambda)}</b><input type="range" min="0" max="3" step=".01" value={lambda} onChange={e => setLambda(+e.target.value)} /></label></div><Canvas label="交替更新变量及其计算结果"><rect width="900" height="430" fill={C.field} /><text x="55" y="70" fill={C.ink} fontSize="30">{step === 'background' ? '背景闭式更新' : '掩码近端子问题'}</text><rect x="80" y="135" width="700" height="55" fill="#e8edf0" /><rect x="80" y="135" width={700 * clamp(selected)} height="55" fill={step === 'background' ? C.green : C.blue} /><text x="80" y="255" fill={C.ink} fontSize="26">{step === 'background' ? 'B̂ₖ=(λBₖ₋₁+C−C·M)/(1+λ)' : 'M̂ₖ 由数据项、稀疏项与近端项共同确定'}</text><text x="80" y="330" fill={C.muted} fontSize="24">当前背景解 B̂ₖ = {f2(nextB)}</text><text x="80" y="385" fill={Math.abs(c - c * m - nextB) < .05 ? C.green : C.red} fontSize="23">M 与 B 交替更新，目标是降低分离目标函数</text></Canvas></div>;
}

export function UnfoldScene() {
	const [k, setK] = useState(2); const [selected, setSelected] = useState<'SOFS' | 'ROBE'>('SOFS');
	return <div className="run-scene unfold-scene"><div className="stage-picker" role="group" aria-label="选择展开阶段">{[1, 2, 3, 4].map(n => <button key={n} className={n === k ? 'selected' : ''} onClick={() => setK(n)}>K{n}</button>)}</div><div className="unfold-main"><Canvas label={`展开网络第${k}阶段 ${selected}`}><rect width="900" height="430" fill={C.field} /><text x="55" y="55" fill={C.ink} fontSize="29">RUN · 第 {k} / 4 阶段</text>{Array.from({ length: k }, (_, i) => { const x = 90 + i * 190; return <g key={i}><rect x={x} y="145" width="145" height="115" rx="8" fill="#fff" stroke={i === k - 1 ? C.orange : C.line} strokeWidth={i === k - 1 ? 6 : 3} /><text x={x + 38} y="195" fill={C.blue} fontSize="24">SOFS</text><text x={x + 38} y="232" fill={C.green} fontSize="24">ROBE</text>{i < k - 1 && <path d={`M${x + 145} 202h42`} stroke={C.deep} strokeWidth="5" />}</g> })}<text x="70" y="335" fill={C.ink} fontSize="24">{selected === 'SOFS' ? '更新掩码 Mₖ 与辅助边缘 Eₖ' : '更新背景 Bₖ 并重建 Ĉₖ'}</text></Canvas><div className="choice-row"><button className={selected === 'SOFS' ? 'selected' : ''} onClick={() => setSelected('SOFS')}>SOFS</button><button className={selected === 'ROBE' ? 'selected' : ''} onClick={() => setSelected('ROBE')}>ROBE</button></div></div><p>每阶段对应一次优化更新；K=4 是论文实验配置，不是普适最优值。</p></div>;
}

export function SofsScene() {
	const [branch, setBranch] = useState<'local' | 'global'>('local'); const [index, setIndex] = useState(12); const [response, setResponse] = useState(values);
	const output = response.map((v, i) => { const d = Math.abs(i - index); return clamp(branch === 'local' ? v * .55 + (d <= 2 ? .25 : 0) : v * .55 + (values[i] > .55 ? .28 : 0)); });
	return <div className="run-scene sofs-scene"><Grid data={response} active={index} onPick={setIndex} /><div className="sofs-right"><div className="choice-row"><button className={branch === 'local' ? 'selected' : ''} onClick={() => setBranch('local')}>局部感受野</button><button className={branch === 'global' ? 'selected' : ''} onClick={() => setBranch('global')}>大感受野</button></div><Canvas label="SOFS局部或大感受野对掩码网格的影响"><rect width="900" height="430" fill={C.field} /><text x="55" y="65" fill={C.ink} fontSize="29">{branch === 'local' ? '局部边缘细化' : '全局上下文补足漏分'}</text>{output.map((v, i) => { const x = 100 + (i % 5) * 130, y = 110 + Math.floor(i / 5) * 58; return <g key={i}><rect x={x} y={y} width="86" height="42" rx="4" fill={`rgba(34,141,92,${.08 + .82 * v})`} />{i === index && <rect x={x - 3} y={y - 3} width="92" height="48" fill="none" stroke={C.orange} strokeWidth="4" />}</g> })}<text x="55" y="410" fill={C.muted} fontSize="20">合成响应示意；非真实 VSS 推理</text></Canvas><p>{branch === 'local' ? '小感受野侧重边缘附近的局部修正。' : '大感受野利用上下文补足可能漏分的区域。'}</p></div></div>;
}

export function RobeUpdateScene() {
	const [m, setM] = useState(.6); const [old, setOld] = useState(.35); const [lambda, setLambda] = useState(1); const c = .8; const reversed = c - c * m; const updated = (lambda * old + reversed) / (1 + lambda); const reconstructed = c * m + updated; const residual = reconstructed - c;
	return <div className="run-scene robe-scene"><div className="robe-controls"><label>当前掩码 M <b>{f2(m)}</b><input type="range" min="0" max="1" step=".01" value={m} onChange={e => setM(+e.target.value)} /></label><label>旧背景 Bₖ₋₁ <b>{f2(old)}</b><input type="range" min="0" max=".8" step=".01" value={old} onChange={e => setOld(+e.target.value)} /></label><label>权重 λ <b>{f2(lambda)}</b><input type="range" min="0" max="3" step=".01" value={lambda} onChange={e => setLambda(+e.target.value)} /></label></div><Canvas label="ROBE背景融合与RGB重组"><rect width="900" height="430" fill={C.field} /><text x="55" y="66" fill={C.ink} fontSize="30">B̂ₖ = (λBₖ₋₁ + C − C·M) / (1+λ)</text><rect x="90" y="130" width="680" height="58" fill="#e8edf0" /><rect x="90" y="130" width={680 * clamp(reversed / c)} height="58" fill={C.blue} /><rect x={90 + 680 * clamp(reversed / c)} y="130" width={680 * clamp(updated / c)} height="58" fill={C.green} /><text x="90" y="255" fill={C.blue} fontSize="25">反向前景 C−C·M = {f2(reversed)}</text><text x="90" y="305" fill={C.green} fontSize="25">更新背景 B̂ₖ = {f2(updated)}</text><text x="90" y="370" fill={Math.abs(residual) < .05 ? C.green : C.red} fontSize="27">重组残差 Ĉ−C = {f2(residual)}</text></Canvas></div>;
}

export function LossScene() {
	const [enabled, setEnabled] = useState([true, true, true, true]); const labels = [['加权 BCE', 'Mₖ'], ['加权 IoU', 'Mₖ'], ['边缘 Dice', 'Eₖ'], ['重建 MSE', 'Ĉₖ']];
	return <div className="run-scene loss-scene"><div className="loss-visual"><Canvas label="联合损失约束掩码边缘与RGB重建"><rect width="900" height="430" fill={C.field} /><path d="M145 110h610v230H145z" fill="#f0eadb" stroke={C.deep} strokeWidth="4" /><path d="M280 160q140-90 280 0v130q-140 90-280 0z" fill={enabled[0] && enabled[1] ? '#27446e77' : '#c43f5277'} stroke={enabled[2] ? C.orange : C.red} strokeWidth="8" /><path d="M270 310q150 65 300 0" fill="none" stroke={enabled[3] ? C.green : C.red} strokeWidth="12" /><text x="190" y="385" fill={C.ink} fontSize="24">分割 + 边缘 + RGB 重建</text></Canvas></div><div className="loss-options">{labels.map(([name, target], i) => <label className={!enabled[i] ? 'disabled' : ''} key={name}><input type="checkbox" checked={enabled[i]} onChange={() => setEnabled(a => a.map((v, j) => i === j ? !v : v))} /><span><b>{name}</b><small>监督对象 {target}</small></span></label>)}<p>{enabled.every(Boolean) ? '完整目标同时约束掩码、边缘与重建。' : '关闭项后，对应监督约束不再参与示意。'}</p></div></div>;
}

export function ResultsScene() {
	const [metric, setMetric] = useState<'Fβ' | 'MAE' | 'Eφ' | 'Sα'>('Fβ'); const rows = { Fβ: [['FEDER', .715], ['FocusDiff', .730], ['RUN', .747]], MAE: [['FEDER', .032], ['FocusDiff', .031], ['RUN', .030]], Eφ: [['FEDER', .892], ['FocusDiff', .897], ['RUN', .903]], Sα: [['FEDER', .810], ['FocusDiff', .820], ['RUN', .827]] }[metric]; const lower = metric === 'MAE';
	return <div className="run-scene results-scene"><div className="choice-row">{(['Fβ', 'MAE', 'Eφ', 'Sα'] as const).map(x => <button key={x} className={metric === x ? 'selected' : ''} onClick={() => setMetric(x)}>{x}</button>)}</div><div className="results-chart"><div className="chart-axis"><span>{lower ? '低更好' : '高更好'}</span><span>COD10K · ResNet50 · common setting</span></div>{rows.map(([name, value]) => <div className="chart-row" key={name}><b>{name}</b><div className="chart-track"><i style={{ width: `${(Number(value) / (lower ? .05 : 1)) * 100}%`, background: name === 'RUN' ? C.green : C.blue }} /></div><strong>{Number(value).toFixed(3)}</strong></div>)}</div><p>同协议下比较；仅高亮所选指标，不代表跨设置排名。</p></div>;
}

export function TransferScene() {
	const [task, setTask] = useState(0); const data = [['PIS', 'CVC-ColonDB · ETIS', 'mDice / mIoU / Sα', '均为越高越好'], ['MTOS', 'DRIVE · CORN', 'mDice / AUC / SEN', '均为越高越好'], ['TOD', 'GDD · GSD', 'mIoU / Fβmax / MAE', 'MAE 越低，其余越高']][task];
	return <div className="run-scene transfer-scene"><div className="task-tabs">{['息肉分割', '管状结构', '透明目标'].map((x, i) => <button key={x} className={task === i ? 'selected' : ''} onClick={() => setTask(i)}>{x}</button>)}</div><Canvas label={`${data[0]}任务的独立评测协议`}><rect width="900" height="430" fill={C.field} /><text x="60" y="85" fill={C.ink} fontSize="34">{data[0]}</text><path d="M75 135H820" stroke={C.line} strokeWidth="3" /><text x="75" y="205" fill={C.blue} fontSize="29">数据集</text><text x="300" y="205" fill={C.ink} fontSize="29">{data[1]}</text><text x="75" y="280" fill={C.blue} fontSize="29">指标</text><text x="300" y="280" fill={C.ink} fontSize="28">{data[2]}</text><text x="300" y="340" fill={C.green} fontSize="25">{data[3]}</text><text x="75" y="395" fill={C.red} fontSize="22">不同任务不可直接合并为同一排行榜</text></Canvas></div>;
}

export function RunPlusScene() {
	const [transmission, setTransmission] = useState(.45);
	const [airlight, setAirlight] = useState(.9);
	const [estimate, setEstimate] = useState(.65);
	const [restore, setRestore] = useState(true);
	const reference = Array.from({ length: 160 }, (_, index) => {
		const column = index % 16, row = Math.floor(index / 16);
		const object = ((column - 8) / 3) ** 2 + ((row - 5) / 3.5) ** 2 < 1;
		return object ? .25 + .035 * ((column + row) % 3) : .48 + .055 * ((column * 3 + row * 7) % 4);
	});
	const observed = reference.map(value => value * transmission + airlight * (1 - transmission));
	const recovered = observed.map(value => clamp((value - airlight * (1 - estimate)) / estimate));
	const output = restore ? recovered : observed;
	const error = output.reduce((sum, value, index) => sum + Math.abs(value - reference[index]), 0) / reference.length;
	return <div className="run-scene evidence-workbench"><div className="evidence-banner"><span>合成雾化实验 · 非 RUN / RUN+ 网络推理</span><span>论文扩展：Fig.5 · PDF p.8</span></div><div className="haze-images">{[['参考 J', reference], ['雾化输入 I', observed], [restore ? '解析恢复 Ĵ' : '未恢复输入', output]].map(([label, pixels]) => <figure key={String(label)}><figcaption>{String(label)}</figcaption><svg viewBox="0 0 320 200" role="img" aria-label={String(label)}>{(pixels as number[]).map((value, index) => <rect key={index} x={(index % 16) * 20} y={Math.floor(index / 16) * 20} width="20" height="20" fill={`rgb(${value * 210},${value * 230},${value * 195})`} />)}</svg></figure>)}</div><div className="haze-bottom"><div className="haze-controls"><label>真实透射率 t <b>{transmission.toFixed(2)}</b><input aria-label="真实透射率" type="range" min=".15" max="1" step=".01" value={transmission} onChange={event => setTransmission(+event.target.value)} /></label><label>空气光 A <b>{airlight.toFixed(2)}</b><input aria-label="空气光" type="range" min=".6" max="1" step=".01" value={airlight} onChange={event => setAirlight(+event.target.value)} /></label><label>估计透射率 t̂ <b>{estimate.toFixed(2)}</b><input aria-label="估计透射率" type="range" min=".15" max="1" step=".01" value={estimate} onChange={event => setEstimate(+event.target.value)} /></label></div><section className="haze-explanation"><label className="binary-control"><input type="checkbox" checked={restore} onChange={event => setRestore(event.target.checked)} />启用解析恢复</label><div className="haze-formula">I = tJ + (1−t)A</div><div className="haze-error" aria-live="polite">合成强度 MAE <strong>{error.toFixed(4)}</strong></div><p>t̂ 接近 t 时恢复更准；小透射率会放大估计误差。此值不是论文分割 MAE。</p><p>论文中的 RUN+ 额外引入预训练去雾模型；本实验只解释退化与恢复，不模拟其性能。</p></section></div></div>;
}

export function LimitsScene() {
	const [choice, setChoice] = useState(0); const items = [['复杂退化', '作者指出复杂退化下的鲁棒性仍不足。', 'Appendix B · p.13'], ['计算与存储', '整合更大型低层视觉模型会增加资源需求。', 'Appendix B · p.13'], ['输入分辨率', '论文训练与测试图像缩放到 352×352。', 'Sec. 4 · p.5']];
	return <div className="run-scene limits-scene"><div className="limits-nav">{items.map((x, i) => <button key={x[0]} className={choice === i ? 'selected' : ''} onClick={() => setChoice(i)}>{x[0]}</button>)}</div><div className="limits-content"><Canvas label="论文适用边界示意"><rect width="900" height="430" fill={C.field} /><path d="M100 315Q240 210 350 292T590 230T820 270" fill="none" stroke={choice === 0 ? C.red : C.deep} strokeWidth="15" strokeDasharray={choice === 0 ? '22 14' : undefined} /><circle cx={220 + choice * 220} cy="270" r="24" fill={C.orange} /><text x="75" y="90" fill={C.ink} fontSize="30">{items[choice][0]}</text><text x="75" y="375" fill={C.muted} fontSize="24">{items[choice][2]}</text></Canvas><p>{items[choice][1]}</p></div></div>;
}
