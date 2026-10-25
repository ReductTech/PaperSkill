import { useRef, useState, useSyncExternalStore } from 'react';
import { arrow, clearScene, drawLabel, drawPaper, Feedback, palette, roundRect, useDrawing } from './vit-kit';
import { edgeResponse, recognition, recognitionHistory, TRAINING_STEPS, type Scene } from './vit-recognition-math';

const history = recognitionHistory();
let shared = { scene: 'house' as Scene, step: 0 };
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const snapshot = () => shared;
function change(next: Partial<typeof shared>) { shared = { ...shared, ...next }; listeners.forEach(fn => fn()); }
const f = (x: number) => x.toFixed(4);
const percent = (x: number) => `${(100 * x).toFixed(2)}%`;
const name = (scene: Scene) => scene === 'house' ? '房屋' : '船只';

function useCase() {
  const state = useSyncExternalStore(subscribe, snapshot);
  const a = history[state.step].a;
  return { ...state, a, row: recognition(a, state.scene === 'house' ? 1 : -1) };
}
function CaseControls({ training = false }: { training?: boolean }) {
  const { scene, step, a } = useCase();
  return <>
    <div className="ctrl" role="group" aria-label="贯穿案例图像">
      {!training && (['house', 'boat'] as Scene[]).map(s => <button type="button" className={'chip' + (scene === s ? ' selected' : '')} aria-pressed={scene === s} key={s} onClick={() => change({ scene: s })}>{name(s)}拼贴</button>)}
      <button type="button" className="chip" onClick={() => change({ scene: 'house', step: 0 })}>整个案例回到起点</button>
    </div>
    {training && <div className="step-ctrl">
      <button type="button" className="chip" disabled={step === 0} onClick={() => change({ step: step - 1 })}>上次参数</button>
      <button type="button" className="chip" disabled={step === TRAINING_STEPS} onClick={() => change({ step: step + 1 })}>按房屋标签更新一次</button>
    </div>}
    <p className="step-label">贯穿算例 · 第 {step} 次更新 · a={f(a)}。选图和参数跨章保留，刷新网页重置。切换拼贴只换输入，不训练。</p>
  </>;
}

/** Shared paper-collage primitive: identical triangle, different surrounding piece. */
function collage(ctx: CanvasRenderingContext2D, scene: Scene, revealed: boolean, x = 28, y = 22, size = 230) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 230, size / 230);
  drawPaper(ctx, 0, 0, 230, 230);
  ctx.fillStyle = palette.orange;
  ctx.beginPath(); ctx.moveTo(115, 28); ctx.lineTo(58, 100); ctx.lineTo(172, 100); ctx.closePath(); ctx.fill();
  if (revealed && scene === 'house') {
    roundRect(ctx, 62, 106, 106, 84, 2, palette.light, palette.dark);
    roundRect(ctx, 100, 124, 31, 33, 1, '#fff', palette.blue);
    ctx.strokeStyle = palette.blue; ctx.beginPath(); ctx.moveTo(115, 124); ctx.lineTo(115, 157); ctx.moveTo(100, 140); ctx.lineTo(131, 140); ctx.stroke();
  } else if (revealed) {
    ctx.strokeStyle = palette.dark; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(115, 103); ctx.lineTo(115, 132); ctx.stroke();
    ctx.fillStyle = palette.light; ctx.beginPath(); ctx.moveTo(44, 137); ctx.lineTo(186, 137); ctx.lineTo(160, 173); ctx.lineTo(70, 173); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = palette.blue; ctx.beginPath(); ctx.moveTo(32, 189); ctx.lineTo(198, 189); ctx.stroke();
  } else roundRect(ctx, 22, 106, 186, 98, 4, palette.border);
  ctx.restore();
}

export function RecognitionAmbiguity() {
  const { scene } = useCase();
  const [revealed, setRevealed] = useState(false);
  const ref = useRef<HTMLCanvasElement>(null);
  useDrawing(ref, ctx => {
    clearScene(ctx, 1080, 280); collage(ctx, scene, revealed, 110); collage(ctx, scene === 'house' ? 'boat' : 'house', revealed, 650);
    drawLabel(ctx, revealed ? '周围不同' : '局部完全相同', 432, 140);
  });
  return <div><canvas ref={ref} role="img" aria-label={revealed ? '相同三角形分别搭配墙窗与船身；完整拼贴不同' : '两张拼贴只露出完全相同的三角形，周围被遮挡'} />
    <div className="ctrl"><button type="button" className="chip" aria-pressed={revealed} onClick={() => setRevealed(v => !v)}>{revealed ? '重新遮住周围' : '揭开周围图块'}</button></div>
    <Feedback>{revealed ? '三角形没有变，但墙窗让我们把它看成屋顶，船身让我们把它看成船帆。模型要利用的是这种组合差异；不是拿三角形去查询一张“屋顶词典”。' : '只给同一块完全相同的三角形，不给位置和上下文，任何确定性计算都会给同样结果。你也不能单凭它断定是屋顶还是船帆。'}</Feedback>
  </div>;
}

export function RecognitionPixels() {
  const [pattern, setPattern] = useState<'horizontal' | 'vertical' | 'flat'>('horizontal');
  const ref = useRef<HTMLCanvasElement>(null);
  const row = edgeResponse(pattern);
  useDrawing(ref, ctx => {
    clearScene(ctx, 1080, 280);
    row.pixels.forEach((p, i) => roundRect(ctx, 100 + (i % 2) * 90, 40 + Math.floor(i / 2) * 90, 88, 88, 0, p ? '#fff' : palette.text, palette.border));
    arrow(ctx, 320, 130, 580, 130);
    roundRect(ctx, 640, 70, 280, 120, 5, '#fff', palette.border);
    roundRect(ctx, 654, 125, 248 * row.response, 44, 2, palette.blue);
    drawLabel(ctx, '四个像素', 101, 25); drawLabel(ctx, '明暗差', 645, 46); drawLabel(ctx, f(row.response), 750, 98);
  });
  return <div><canvas ref={ref} role="img" aria-label={`像素${row.pixels.join(',')}，上排均值减下排均值=${row.response}`} />
    <div className="ctrl" role="group" aria-label="选择像素排列">
      {([['horizontal', '上亮下暗'], ['vertical', '左亮右暗'], ['flat', '全部一样亮']] as const).map(([p, label]) => <button type="button" className={'chip' + (p === pattern ? ' selected' : '')} key={p} aria-pressed={p === pattern} onClick={() => setPattern(p)}>{label}</button>)}
    </div>
    <Feedback>{row.pixels.map((p, i) => `${p}×(${row.coefficients[i]})`).join(' + ')} = {row.response}。同一组系数只对“上亮下暗”给出1，对另外两种给出0；它测到了一个差异，但没有认出房屋。</Feedback>
  </div>;
}

export function RecognitionMix() {
  const { scene, row } = useCase();
  const [stage, setStage] = useState(0);
  const ref = useRef<HTMLCanvasElement>(null);
  useDrawing(ref, ctx => {
    clearScene(ctx, 1080, 280); collage(ctx, scene, true);
    if (stage === 0) {
      drawLabel(ctx, '同一输入', 390, 28); drawLabel(ctx, '分别算三份', 700, 28);
      row.inputs.forEach((x, i) => {
        drawLabel(ctx, `[${x.join(', ')}]`, 390, 85 + i * 100);
        arrow(ctx, 515, 85 + i * 100, 655, 85 + i * 100);
        drawLabel(ctx, `${row.q[i]} / ${f(row.k[i])} / ${row.v[i]}`, 700, 85 + i * 100);
      });
      return;
    }
    drawLabel(ctx, stage < 2 ? '参考份额' : '带回的数', 395, 28);
    row.weights.forEach((w, i) => {
      roundRect(ctx, 390, 65 + i * 88, 310, 46, 4, '#fff', palette.border);
      roundRect(ctx, 390, 65 + i * 88, 310 * w, 46, 4, i === 0 ? palette.orange : palette.blue);
      drawLabel(ctx, stage < 2 ? percent(w) : f(row.contributions[i]), 720, 88 + i * 88);
    });
    if (stage === 2) { arrow(ctx, 820, 133, 894, 133); drawLabel(ctx, f(row.output), 918, 133); }
  });
  return <div><CaseControls /><canvas ref={ref} role="img" aria-label={stage === 0 ? `当前${name(scene)}，输入分别为${row.inputs.map(x => '['+x.join(',')+']').join('和')}，右侧依次显示q、k、v` : `当前${name(scene)}，三角形份额${percent(row.weights[0])}，周围份额${percent(row.weights[1])}${stage === 2 ? '，汇总数'+f(row.output) : ''}`} />
    <div className="step-ctrl"><button type="button" className="chip" disabled={stage === 0} onClick={() => setStage(s => s - 1)}>上一步</button><span className="step-label">{stage + 1}/3 · {['从输入算QKV', '从Q和K算份额', '按份额取V'][stage]}</span><button type="button" className="chip" disabled={stage === 2} onClick={() => setStage(s => s + 1)}>下一步</button></div>
    <div style={{ overflowX: 'auto' }}><table className="paper"><caption>这两行是手工给定的教学输入，不是照片识别结果</caption><thead><tr><th>图块</th><th>x</th><th>q=x₁</th><th>k=a×x₁</th><th>v=x₂</th>{stage >= 1 && <th>份额</th>}{stage === 2 && <th>份额×v</th>}</tr></thead>
      <tbody>{row.inputs.map((x, i) => <tr key={i}><th scope="row">{i === 0 ? '三角形' : '周围'}</th><td>[{x.join(', ')}]</td><td>{row.q[i]}</td><td>{f(row.k[i])}</td><td>{row.v[i]}</td>{stage >= 1 && <td>{f(row.weights[i])}</td>}{stage === 2 && <td>{f(row.contributions[i])}</td>}</tr>)}</tbody></table></div>
    <Feedback>{stage === 0 ? `两块都生成QKV。我们只跟踪三角形这一行：q=1；候选k分别是${f(row.a)}和0。dₖ=1，不需要改变分数大小。` : stage === 1 ? `点积为[${f(row.a)}, 0]，用softmax得到上面两个份额。切换房屋/船只，份额不变：本例K只取第一坐标，变化在第二坐标。` : `y=${f(row.weights[0])}×(−1)+${f(row.weights[1])}×(${row.context})=${f(row.output)}。y只是一个数，还不是“房屋”这个词。房屋和船只的份额相同，V不同，所以y不同。`}</Feedback>
  </div>;
}

export function RecognitionClassify() {
  const { scene, row } = useCase();
  const [stage, setStage] = useState(0);
  const ref = useRef<HTMLCanvasElement>(null);
  useDrawing(ref, ctx => {
    clearScene(ctx, 1080, 280); collage(ctx, scene, true);
    drawLabel(ctx, '房屋', 390, 47); drawLabel(ctx, '船只', 390, 163);
    [row.houseProbability, 1 - row.houseProbability].forEach((p, i) => {
      roundRect(ctx, 390, 70 + i * 115, 510, 46, 3, '#fff', palette.border);
      if (stage === 1) roundRect(ctx, 390, 70 + i * 115, 510 * p, 46, 3, row.prediction === scene ? palette.green : palette.red);
      drawLabel(ctx, stage === 1 ? percent(p) : f(row.logits[i]), 920, 92 + i * 115);
    });
  });
  return <div><CaseControls /><canvas ref={ref} role="img" aria-label={stage ? `房屋概率${percent(row.houseProbability)}，船只概率${percent(1-row.houseProbability)}` : `房屋分数${f(row.logits[0])}，船只分数${f(row.logits[1])}`} />
    <div className="ctrl"><button type="button" className="chip" aria-pressed={stage === 1} onClick={() => setStage(s => 1 - s)}>{stage ? '返回原始分数' : '把分数变成类别概率'}</button></div>
    <Feedback>{stage === 0 ? `直接使用上一节的y=${f(row.output)}，没有另造一个输入。房屋分数=2y=${f(row.logits[0])}，船只分数=−2y=${f(row.logits[1])}。系数2和−2是预设的分类头。` : `在两个类别分数上做softmax，房屋概率=${percent(row.houseProbability)}。模型选${name(row.prediction)}，给定标签是${name(scene)}，${row.prediction === scene ? '这次选对' : '这次选错'}。这里的两个概率对应类别，不是两个图块。`}</Feedback>
  </div>;
}

export function RecognitionLoss() {
  const { scene, row } = useCase();
  const [reveal, setReveal] = useState(false);
  const ref = useRef<HTMLCanvasElement>(null);
  const p = scene === 'house' ? row.houseProbability : 1 - row.houseProbability;
  useDrawing(ref, ctx => {
    clearScene(ctx, 1080, 280); collage(ctx, scene, true);
    drawLabel(ctx, '正确类概率', 395, 50);
    roundRect(ctx, 395, 72, 470, 45, 3, '#fff', palette.border);
    roundRect(ctx, 395, 72, 470 * p, 45, 3, palette.blue); drawLabel(ctx, percent(p), 902, 94);
    if (reveal) { drawLabel(ctx, '损失', 395, 162); roundRect(ctx, 395, 183, 470 * row.loss / 5, 45, 3, palette.red); drawLabel(ctx, f(row.loss), 902, 205); }
  });
  return <div><CaseControls /><canvas ref={ref} role="img" aria-label={`正确类别${name(scene)}的概率${percent(p)}${reveal ? '，交叉熵损失'+f(row.loss) : '，尚未显示损失'}`} />
    <div className="ctrl"><button type="button" className="chip" aria-pressed={reveal} onClick={() => setReveal(v => !v)}>{reveal ? '先只看正确类概率' : '用正确标签算损失'}</button></div>
    <Feedback>{reveal ? `标签指定${name(scene)}，所以取${name(scene)}这一项的概率${f(p)}，ℓ=−ln(${f(p)})=${f(row.loss)}。标签不是从QKV里猜出来的，也没有告诉网络屋顶在哪儿。损失柱固定按0到5缩放。` : `先问“标准答案是哪一类”，再取那一类的概率。房屋的标准答案来自训练数据标注，不是模型自己宣布；选对也可能不够有把握，因此不能只记对/错。`}</Feedback>
  </div>;
}

export function RecognitionLearn() {
  const { step, a } = useCase();
  const row = history[step];
  const ref = useRef<HTMLCanvasElement>(null);
  const lower = recognition(a - 0.01, 1), upper = recognition(a + 0.01, 1);
  useDrawing(ref, ctx => {
    clearScene(ctx, 1080, 280); collage(ctx, 'house', true);
    drawLabel(ctx, '房屋样本损失', 390, 27);
    ctx.save(); ctx.strokeStyle = palette.border; ctx.beginPath(); ctx.moveTo(390, 45); ctx.lineTo(390, 241); ctx.lineTo(1020, 241); ctx.stroke();
    ctx.strokeStyle = palette.blue; ctx.lineWidth = 4; ctx.beginPath();
    history.slice(0, step + 1).forEach((r, i) => { const x = 400 + i * 76, y = 236 - r.loss * 57; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.stroke();
    history.slice(0, step + 1).forEach((r, i) => { ctx.fillStyle = r.prediction === 'house' ? palette.green : palette.red; ctx.beginPath(); ctx.arc(400 + i * 76, 236 - r.loss * 57, 7, 0, Math.PI * 2); ctx.fill(); }); ctx.restore();
    drawLabel(ctx, f(row.loss), 895, 28);
  });
  return <div><CaseControls training /><canvas ref={ref} role="img" aria-label={`房屋样本训练${step}次，a=${f(a)}，损失${f(row.loss)}；横轴0到8次，纵轴损失0到约3.35`} />
    <Feedback>本章始终用房屋样本更新，不受“查看哪张拼贴”影响。当前梯度={f(row.gradient)}；学习率取1，所以{step < TRAINING_STEPS ? `下次a=${f(a)}−${f(row.gradient)}=${f(a-row.gradient)}` : '8次演示已完成'}。房屋概率={percent(row.houseProbability)}，预测{name(row.prediction)}。改的是W_K里的a，不是直接手改概率。</Feedback>
    <div style={{ overflowX: 'auto' }}><table className="paper"><caption>不必先会求导：先试着把a拨小/拨大0.01，重新算同一条链</caption><thead><tr><th>试算参数</th><th>房屋损失</th><th>与当前相比</th></tr></thead><tbody>{[lower, row, upper].map((r, i) => <tr key={i}><th scope="row">{['a−0.01', '当前a', 'a+0.01'][i]} = {f(r.a)}</th><td>{f(r.loss)}</td><td>{i === 1 ? '基准' : r.loss < row.loss ? '降低' : '升高'}</td></tr>)}</tbody></table></div>
    <details><summary>想核对：梯度怎么一路传回a？</summary><p>记三角形份额为u，周围份额为1−u；房屋时y=1−2u。先算“损失随y变化”：4(p−1)={f(4*(row.houseProbability-1))}；再算“y随a变化”：−2u(1−u)={f(row.outputDerivative)}；两项相乘得到梯度{f(row.gradient)}。这就是链式法则在本例中的全部路径。有限差分核对值为{f((upper.loss-lower.loss)/0.02)}；它是近似，不是网页训练使用的算法。</p></details>
  </div>;
}

export function RecognitionLimits() {
  const { a, step } = useCase();
  const [context, setContext] = useState(1);
  const row = recognition(a, context);
  const ref = useRef<HTMLCanvasElement>(null);
  useDrawing(ref, ctx => {
    clearScene(ctx, 1080, 280); collage(ctx, 'house', true);
    if (context !== 1) roundRect(ctx, 60, 128, 168, 102, 3, context === 0 ? palette.border : palette.blue);
    drawLabel(ctx, '房屋概率', 410, 65); roundRect(ctx, 410, 97, 500, 72, 4, '#fff', palette.border);
    roundRect(ctx, 410, 97, 500 * row.houseProbability, 72, 4, row.prediction === 'house' ? palette.green : palette.red);
    drawLabel(ctx, percent(row.houseProbability), 918, 134);
  });
  return <div><p className="step-label">沿用第{step}次更新的a={f(a)}；这里只替换周围块的第二坐标，参数不变。</p><canvas ref={ref} role="img" aria-label={`原始标签保持房屋，周围数改为${context}，房屋概率${percent(row.houseProbability)}；蓝色遮盖表示替换数值，不是生成一张真实照片`} />
    <div className="ctrl" role="group" aria-label="干预周围内容">
      {([[1, '原来的周围：+1'], [0, '删掉这条信息：0'], [-1, '换成相反数：−1']] as const).map(([v, label]) => <button type="button" className={'chip' + (context === v ? ' selected' : '')} aria-pressed={context === v} key={v} onClick={() => setContext(v)}>{label}</button>)}
      <button type="button" className="chip" onClick={() => change({ step: TRAINING_STEPS })}>使用8次更新后的参数</button>
    </div>
    <Feedback>份额仍是[{f(row.weights[0])}, {f(row.weights[1])}]，但V变了，y={f(row.output)}，预测{name(row.prediction)}。{context === 1 ? '先看完整信息，再移除或替换它。' : '原始房屋标签不变；这是数值层的干预，不保证干预后的数据还是一张自然房屋照片。'} 这个模型依赖我们提供的两个数，不能据此声称它认识真实房屋。</Feedback>
  </div>;
}
