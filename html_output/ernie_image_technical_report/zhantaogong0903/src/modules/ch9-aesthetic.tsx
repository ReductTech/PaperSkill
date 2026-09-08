import React, { useEffect, useMemo, useRef, useState } from 'react';
import { easeOutCubic, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { clearDesk, drawPoster, drawProofFrame, drawSceneLabel } from './poster-kit';

const W = 800;
const H_FLOW = 360;
const H_ERIA = 420;
const C = { blue: '#27446e', green: '#228d5c', orange: '#d97706', purple: '#7c3aed', ink: '#21324a', muted: '#68778f', line: '#d7deea', paper: '#fff' };
type View = 'flow' | 'eria';
type Choice = 'left' | 'right' | null;
type Metric = 'SRCC' | 'PLCC';
type Proof = 'A' | 'B' | 'C' | 'D';
const PROOFS: Proof[] = ['A', 'B', 'C', 'D'];
const PROOF_STYLE: Record<Proof, { color: string; detail: number }> = {
  A: { color: C.blue, detail: .82 },
  B: { color: C.orange, detail: .62 },
  C: { color: C.purple, detail: .74 },
  D: { color: C.green, detail: .68 },
};
const RESULTS = [
  { name: 'LAION AES', SRCC: .2944, PLCC: .3138, color: '#94a3b8' },
  { name: 'ArtiMuse', SRCC: .4277, PLCC: .4704, color: C.orange },
  { name: 'UniPercept', SRCC: .4533, PLCC: .4748, color: C.purple },
  { name: 'ERNIE-Image-Aes', SRCC: .7445, PLCC: .7598, color: C.green },
];

function standings(choices: Choice[]) {
  const wins: Record<Proof, number> = { A: 0, B: 0, C: 0, D: 0 };
  if (choices[0]) wins[choices[0] === 'left' ? 'A' : 'B'] += 1;
  if (choices[1]) wins[choices[1] === 'left' ? 'C' : 'D'] += 1;
  const topPair = [...PROOFS].sort((a, b) => wins[b] - wins[a] || a.localeCompare(b)).slice(0, 2) as Proof[];
  if (choices[2]) wins[choices[2] === 'left' ? topPair[0] : topPair[1]] += 1;
  return { wins, topPair };
}

export const Ch9AestheticWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState<View>('flow');
  const [round, setRound] = useState(1);
  const [choices, setChoices] = useState<Choice[]>([null, null, null]);
  const [metric, setMetric] = useState<Metric>('SRCC');
  const table = useMemo(() => standings(choices), [choices]);
  const pair: Proof[] = round === 1 ? ['A', 'B'] : round === 2 ? ['C', 'D'] : table.topPair;
  const stateRef = useRef({ view, round, choices, metric, pair, wins: table.wins });
  stateRef.current = { view, round, choices, metric, pair, wins: table.wins };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasH = view === 'eria' ? H_ERIA : H_FLOW;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, canvasH); } catch { return; }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';

    const drawArrow = (x1: number, y: number, x2: number) => {
      ctx.strokeStyle = C.blue;
      ctx.fillStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y); ctx.lineTo(x2 - 7, y - 5); ctx.lineTo(x2 - 7, y + 5); ctx.closePath(); ctx.fill();
    };

    const draw = (progress = 1) => {
      const s = stateRef.current;
      clearDesk(ctx, W, canvasH);
      ctx.fillStyle = C.paper;
      ctx.strokeStyle = C.line;
      ctx.fillRect(14, 14, 772, canvasH - 28);
      ctx.strokeRect(14.5, 14.5, 771, canvasH - 29);
      if (s.view === 'flow') {
        const selected = s.choices[s.round - 1];
        const winner = selected === 'left' ? s.pair[0] : selected === 'right' ? s.pair[1] : null;
        const pulse = winner ? easeOutCubic(progress) : 0;
        drawSceneLabel(ctx, '只回答一个问题：这两张校样中，哪张更美？', 32, 33, C.ink);
        ctx.fillStyle = C.muted;
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`第 ${s.round} / 3 次判断 · 4 张校样的 Swiss 微型体验`, 768, 34);
        ctx.textAlign = 'left';

        const drawCandidate = (proof: Proof, x: number, isWinner: boolean, isLoser: boolean) => {
          const style = PROOF_STYLE[proof];
          ctx.save();
          if (isLoser) ctx.globalAlpha = .48 + .18 * (1 - pulse);
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = isWinner ? C.green : C.line;
          ctx.lineWidth = isWinner ? 3 : 1.5;
          ctx.fillRect(x, 58, 286, 184);
          ctx.strokeRect(x + .5, 58.5, 285, 183);
          drawPoster(ctx, x + 30, 78, 226, 122, style.color, style.detail);
          ctx.fillStyle = C.ink;
          ctx.font = '700 14px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`校样 ${proof}`, x + 143, 225);
          ctx.restore();
          if (isWinner) {
            drawProofFrame(ctx, x - 3 - pulse * 2, 55 - pulse * 2, 292 + pulse * 4, 190 + pulse * 4, C.green);
            ctx.fillStyle = C.green;
            ctx.font = '700 12px "Segoe UI", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('✓ 本次选择', x + 190, 76);
          }
        };

        drawCandidate(s.pair[0], 54, winner === s.pair[0], winner === s.pair[1]);
        drawCandidate(s.pair[1], 460, winner === s.pair[1], winner === s.pair[0]);
        ctx.beginPath();
        ctx.arc(400, 148, 31, 0, Math.PI * 2);
        ctx.fillStyle = selected ? '#ecfdf5' : '#eef3fb';
        ctx.fill();
        ctx.strokeStyle = selected ? C.green : C.blue;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = selected ? C.green : C.blue;
        ctx.font = '800 15px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(selected ? '已选' : 'VS', 400, 153);

        const ordered = [...PROOFS].sort((a, b) => s.wins[b] - s.wins[a] || a.localeCompare(b));
        drawSceneLabel(ctx, '当前排名（按胜场）', 32, 272, C.blue);
        ordered.forEach((proof, index) => {
          const x = 196 + index * 144;
          const active = s.pair.includes(proof);
          ctx.fillStyle = active ? '#fff7ed' : '#f4f7fb';
          ctx.strokeStyle = active ? C.orange : C.line;
          ctx.lineWidth = active ? 2 : 1;
          ctx.fillRect(x, 258, 126, 55);
          ctx.strokeRect(x + .5, 258.5, 125, 54);
          ctx.fillStyle = C.muted;
          ctx.font = '11px "Segoe UI", sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`#${index + 1}`, x + 12, 279);
          ctx.fillStyle = C.ink;
          ctx.font = '700 13px "Segoe UI", sans-serif';
          ctx.fillText(`校样 ${proof}`, x + 39, 279);
          ctx.fillStyle = s.wins[proof] > 0 ? C.green : C.muted;
          ctx.font = '12px "Segoe UI", sans-serif';
          ctx.fillText(`${s.wins[proof]} 胜`, x + 39, 299);
        });
        ctx.textAlign = 'left';
        ctx.fillStyle = C.muted;
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillText('橙色框 = 本次参与比较', 32, 330);
      } else {
        drawSceneLabel(ctx, '评测流程：训练结束后才使用 ERIA-1K', 30, 40, C.blue);
        const boxes = [
          { x: 30, w: 164, title: '① 持出数据', line1: 'ERIA-1K · 1,000 张', line2: '训练阶段完全不使用' },
          { x: 224, w: 152, title: '② 模型预测', line1: '对未见图片打分', line2: 'ERNIE-Image-Aes' },
          { x: 406, w: 176, title: '③ 对照人工标签', line1: '模型分数 vs. 人工等级', line2: '检查判断是否一致' },
          { x: 612, w: 154, title: '④ 得到相关系数', line1: `${s.metric} ↑`, line2: '越高越接近人工判断' },
        ];
        boxes.forEach((box, index) => {
          ctx.fillStyle = index === 3 ? '#ecfdf5' : '#f4f7fb';
          ctx.strokeStyle = index === 3 ? C.green : C.line;
          ctx.lineWidth = 1.5;
          ctx.fillRect(box.x, 56, box.w, 82);
          ctx.strokeRect(box.x + .5, 56.5, box.w - 1, 81);
          ctx.fillStyle = index === 3 ? C.green : C.ink;
          ctx.font = 'bold 12px "Segoe UI", sans-serif';
          ctx.fillText(box.title, box.x + 12, 79);
          ctx.fillStyle = C.ink;
          ctx.font = '11px "Segoe UI", sans-serif';
          ctx.fillText(box.line1, box.x + 12, 104);
          ctx.fillStyle = C.muted;
          ctx.fillText(box.line2, box.x + 12, 124);
        });
        drawArrow(198, 97, 220);
        drawArrow(380, 97, 402);
        drawArrow(586, 97, 608);

        if (progress < .42) {
          const routeProgress = progress / .42;
          const dotX = 198 + (608 - 198) * routeProgress;
          ctx.beginPath(); ctx.arc(dotX, 97, 5, 0, Math.PI * 2); ctx.fillStyle = C.green; ctx.fill();
        }

        ctx.fillStyle = C.ink;
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillText(`论文表格结果 · ${s.metric}（越高越好）`, 30, 176);
        const trackX = 182;
        const trackW = 500;
        const barProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - .28) / .72)));
        RESULTS.forEach((item, index) => {
          const y = 207 + index * 47;
          const value = item[s.metric];
          ctx.fillStyle = C.ink;
          ctx.font = `${item.name === 'ERNIE-Image-Aes' ? 'bold ' : ''}12px "Segoe UI", sans-serif`;
          ctx.fillText(item.name, 30, y + 15);
          ctx.fillStyle = '#e8eef7';
          ctx.fillRect(trackX, y, trackW, 18);
          ctx.fillStyle = item.color;
          ctx.fillRect(trackX, y, value * trackW * barProgress, 18);
          ctx.fillStyle = item.color;
          ctx.font = 'bold 12px "Segoe UI", sans-serif';
          ctx.fillText(value.toFixed(4), 698, y + 14);
        });
        ctx.fillStyle = C.muted;
        ctx.font = '10px "Segoe UI", sans-serif';
        ctx.fillText('0', trackX, 398);
        ctx.fillText('0.5', trackX + trackW / 2 - 8, 398);
        ctx.fillText('1.0', trackX + trackW - 16, 398);
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animationFrame = 0;
    const stop = () => cancelAnimationFrame(animationFrame);
    const start = () => {
      stop();
      const flowHasChoice = stateRef.current.view === 'flow' && stateRef.current.choices[stateRef.current.round - 1] !== null;
      if (reduceMotion || (stateRef.current.view === 'flow' && !flowHasChoice)) { draw(1); return; }
      const startedAt = performance.now();
      const tick = (now: number) => {
        const duration = stateRef.current.view === 'eria' ? 1200 : 520;
        const progress = Math.min(1, (now - startedAt) / duration);
        draw(progress);
        if (progress < 1) animationFrame = requestAnimationFrame(tick);
      };
      animationFrame = requestAnimationFrame(tick);
    };
    const shouldAnimateInitial = !reduceMotion && (view === 'eria' || choices[round - 1] !== null);
    draw(shouldAnimateInitial ? 0 : 1);
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [view, round, choices, metric]);

  const choose = (choice: Exclude<Choice, null>) => {
    setChoices((current) => {
      const next = [...current];
      next[round - 1] = choice;
      for (let index = round; index < next.length; index += 1) next[index] = null;
      return next;
    });
  };
  const moveRound = (next: number) => setRound(Math.max(1, Math.min(3, next)));
  const resetTournament = () => { setChoices([null, null, null]); setRound(1); };
  const selectView = (next: View) => setView(next);
  const selectMetric = (next: Metric) => setMetric(next);
  const currentChoice = choices[round - 1];
  const currentWinner = currentChoice === 'left' ? pair[0] : currentChoice === 'right' ? pair[1] : null;
  const flowFeedback = currentWinner === null
    ? '点击你认为更美的一张。Swiss 标注只要求局部二选一，不要求标注者给出绝对分数。'
    : round === 1
      ? `你选择了校样 ${currentWinner}。胜场与排名已更新；下一次先完成另一组初始比较。`
      : round === 2
        ? `你选择了校样 ${currentWinner}。现在已有初始名次；下一次会让当前排名最接近的前两张再比较。`
        : `你选择了校样 ${currentWinner}。微型体验完成：新的胜负关系已经回写到排名中。`;

  return <div>
    <div className="chip-row" role="radiogroup" aria-label="审美证据视图">
      <button className={`chip ${view === 'flow' ? 'selected' : ''}`} role="radio" aria-checked={view === 'flow'} onClick={() => selectView('flow')}>标注流程</button>
      <button className={`chip ${view === 'eria' ? 'selected' : ''}`} role="radio" aria-checked={view === 'eria'} onClick={() => selectView('eria')}>ERIA-1K</button>
    </div>
    {view === 'flow' ? <>
      <div className="swiss-experience">
        <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H_FLOW} aria-label={`Swiss 成对审美选择，第 ${round} 次判断`} />
        <div className="swiss-choice-row" role="radiogroup" aria-label="选择本次更美的校样">
          <button className={`swiss-choice ${currentChoice === 'left' ? 'selected' : ''}`} role="radio" aria-checked={currentChoice === 'left'} onClick={() => choose('left')}>
            <span className="swiss-choice-key">{pair[0]}</span><span>选择校样 {pair[0]}</span><small>我认为这张更美</small>
          </button>
          <button className={`swiss-choice ${currentChoice === 'right' ? 'selected' : ''}`} role="radio" aria-checked={currentChoice === 'right'} onClick={() => choose('right')}>
            <span className="swiss-choice-key">{pair[1]}</span><span>选择校样 {pair[1]}</span><small>我认为这张更美</small>
          </button>
        </div>
        <div className="swiss-controls">
          <button className="tiny ghost" disabled={round === 1} onClick={() => moveRound(round - 1)}>上一次</button>
          <span className="step-label">第 <b>{round}</b> / 3 次判断</span>
          {round < 3
            ? <button className="tiny" disabled={currentChoice === null} onClick={() => moveRound(round + 1)}>进入下一次</button>
            : <button className="tiny" onClick={resetTournament}>重新体验</button>}
        </div>
        <div className={`swiss-feedback ${currentWinner ? 'has-choice' : ''}`} aria-live="polite">{flowFeedback}</div>
        <div className="swiss-explainer"><strong>Swiss 的关键：</strong>每次只做更稳定的成对审美判断，并根据当前名次继续匹配质量接近的样本，从而把比较集中在更难区分的区域。</div>
      </div>
      <details style={{ marginTop: 12 }}><summary>查看论文层级预览图</summary><figure className="paper-figure"><img src={`${import.meta.env.BASE_URL}images/tier-preview.png`} alt="论文原始审美层级预览图" style={{ width: '100%', maxHeight: 420, objectFit: 'contain' }} /><figcaption>审美层级预览。</figcaption></figure></details>
    </> : <div className="eria-evaluation-row">
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H_ERIA} aria-label={`ERIA-1K ${metric} 持出评测流程与四模型结果`} />
      <div className="chip-row" role="radiogroup" aria-label="相关系数">{(['SRCC', 'PLCC'] as Metric[]).map((item) => <button key={item} className={`chip ${metric === item ? 'selected' : ''}`} role="radio" aria-checked={metric === item} onClick={() => selectMetric(item)}>{item}（越高越好）</button>)}</div>
      <div className="eria-holdout-note"><strong>什么是持出评测集？</strong> ERIA-1K 在训练 ERNIE-Image-Aes 时完全不参与参数学习；训练结束后才拿出来，检验模型面对未见图片时，预测结果是否仍与人工审美等级一致。</div>
    </div>}
  </div>;
};

export default Ch9AestheticWidget;
