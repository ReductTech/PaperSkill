import { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';

type HealingRoute = 'repair' | 'refine' | 'pivot' | null;
type CitationState = 'idle' | 'verified' | 'suspicious';

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

export function ExperimentFailureScene({ sceneKey, autoRun, onFailure, onDiagnose }: { sceneKey: string; autoRun: boolean; onFailure: () => void; onDiagnose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'idle' | 'running' | 'failed'>('idle');
  const reduced = useReducedMotion();

  useEffect(() => {
    setPhase('idle');
    if (!autoRun) return;
    const timer = window.setTimeout(() => setPhase('running'), 350);
    return () => window.clearTimeout(timer);
  }, [sceneKey, autoRun]);

  useEffect(() => {
    if (phase !== 'running') return;
    const timer = window.setTimeout(() => {
      setPhase('failed');
      onFailure();
    }, reduced ? 50 : 1650);
    return () => window.clearTimeout(timer);
  }, [phase, onFailure, reduced]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = 820;
    const height = 248;
    const context = setupCanvas(canvas, width, height);
    canvas.classList.add('is-ready');
    let frame = 0;
    let isVisible = true;
    let elapsed = 0;
    let startTime = 0;
    const draw = (progress: number) => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      context.strokeStyle = '#d7deea';
      context.lineWidth = 1;
      for (let x = 40; x < width; x += 56) { context.beginPath(); context.moveTo(x, 34); context.lineTo(x, height - 28); context.stroke(); }
      const nodes = [{ x: 90, label: '数据' }, { x: 300, label: '代码' }, { x: 510, label: '训练' }, { x: 720, label: '结果' }];
      context.strokeStyle = '#9fb0c8'; context.lineWidth = 5; context.lineCap = 'round';
      context.beginPath(); context.moveTo(nodes[0].x, 128); context.lineTo(nodes[3].x, 128); context.stroke();
      nodes.forEach((node, index) => {
        const active = progress >= index / (nodes.length - 1);
        context.fillStyle = active ? '#eef3fb' : '#f6f8fc';
        context.strokeStyle = active ? '#27446e' : '#d7deea';
        context.lineWidth = 2; context.beginPath(); context.arc(node.x, 128, 30, 0, Math.PI * 2); context.fill(); context.stroke();
        context.fillStyle = '#21324a'; context.font = '700 17px Segoe UI, Microsoft YaHei'; context.textAlign = 'center'; context.fillText(node.label, node.x, 134);
      });
      if (phase === 'running') {
        const dotX = nodes[0].x + (nodes[3].x - nodes[0].x) * progress;
        context.fillStyle = '#27446e'; context.beginPath(); context.arc(dotX, 128, 9, 0, Math.PI * 2); context.fill();
        context.fillStyle = '#68778f'; context.font = '14px Cascadia Code, monospace'; context.textAlign = 'left'; context.fillText('sandbox running · epoch ' + Math.max(1, Math.ceil(progress * 3)) + ' / 3', 56, 205);
      }
      if (phase === 'failed') {
        context.fillStyle = '#fff4f5'; context.strokeStyle = '#c43f52'; context.lineWidth = 2; context.fillRect(400, 172, 220, 48); context.strokeRect(400, 172, 220, 48);
        context.fillStyle = '#9e2639'; context.font = '700 16px Cascadia Code, monospace'; context.textAlign = 'center'; context.fillText('CUDA OOM · RUN STOPPED', 510, 202);
        context.strokeStyle = '#c43f52'; context.setLineDash([5, 5]); context.beginPath(); context.moveTo(510, 158); context.lineTo(510, 171); context.stroke(); context.setLineDash([]);
      }
    };
    const renderFrame = (now: number) => {
      elapsed = Math.min(now - startTime, 1450);
      draw(elapsed / 1450);
      if (phase === 'running' && elapsed < 1450 && isVisible && !reduced) frame = requestAnimationFrame(renderFrame);
    };
    const start = () => {
      isVisible = true;
      if (phase !== 'running' || reduced || frame) return;
      startTime = performance.now() - elapsed;
      frame = requestAnimationFrame(renderFrame);
    };
    const stop = () => {
      isVisible = false;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };
    draw(phase === 'failed' ? 1 : 0);
    const disconnect = observeCanvas(canvas, start, stop);
    if (phase === 'running') start();
    return () => { disconnect(); stop(); };
  }, [phase, reduced]);

  return <div className="motion-scene failure-canvas-scene">
    <div className="motion-scene-heading"><span>实验运行现场</span><b>{phase === 'failed' ? '失败已被记录，不再让流程静默停止。' : '让一次真实失败成为下一步科研输入。'}</b></div>
    <canvas ref={canvasRef} width="820" height="248" role="img" aria-label="数据、代码、训练和结果的实验运行轨迹" />
    <div className="motion-scene-actions">
      {phase === 'idle' ? <button className="primary-button" onClick={() => setPhase('running')}>运行实验</button> : null}
      {phase === 'running' ? <span className="motion-status running" role="status" aria-live="polite">正在执行：日志与资源状态持续被记录</span> : null}
      {phase === 'failed' ? <><span className="motion-status failure" role="status" aria-live="assertive">失败已捕获：进入诊断，而非终止整轮科研。</span><button className="danger-button" onClick={onDiagnose}>诊断失败 →</button></> : null}
    </div>
  </div>;
}

export function HealingRouteScene({ selected, onSelect }: { selected: HealingRoute; onSelect: (route: Exclude<HealingRoute, null>) => void }) {
  const content = selected === 'repair' ? ['Repair', '修复执行层：依赖、代码或资源恢复后，重跑同一实验。'] : selected === 'refine' ? ['Refine', '当前方向仍有价值：补充对照、seeds 或 baseline 后重跑。'] : selected === 'pivot' ? ['Pivot', '证据反驳当前方向：带着失败信息回到假设辩论。'] : ['选择一条回路', '失败被分类后，系统才知道该返回哪里。'];
  return <div className={`motion-scene healing-route-scene ${selected ?? 'idle'}`}>
    <div className="route-map" aria-label="失败诊断后的三条科研回路">
      <svg viewBox="0 0 900 350" role="img" aria-label="诊断节点分出修复、调整和转向三条路径">
        <defs><marker id="route-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" /></marker></defs>
        <path className="route-input" d="M90 175 H315" markerEnd="url(#route-arrow)" />
        <path className={`route-line repair ${selected === 'repair' ? 'selected' : ''}`} d="M435 145 C570 42 720 52 790 92" markerEnd="url(#route-arrow)" />
        <path className={`route-line refine ${selected === 'refine' ? 'selected' : ''}`} d="M435 175 H785" markerEnd="url(#route-arrow)" />
        <path className={`route-line pivot ${selected === 'pivot' ? 'selected' : ''}`} d="M435 205 C570 308 720 298 790 258" markerEnd="url(#route-arrow)" />
        <g className="route-node failure"><rect x="40" y="130" width="150" height="90" rx="10" /><text x="115" y="164">失败 / 弱证据</text><text className="minor" x="115" y="191">Failure input</text></g>
        <g className="route-node diagnose"><rect x="315" y="130" width="120" height="90" rx="10" /><text x="375" y="164">诊断</text><text className="minor" x="375" y="191">Diagnose</text></g>
        <g className="route-target repair"><rect x="720" y="44" width="145" height="70" rx="10" /><text x="792" y="73">重跑同一实验</text><text className="minor" x="792" y="96">Repair</text></g>
        <g className="route-target refine"><rect x="720" y="140" width="145" height="70" rx="10" /><text x="792" y="169">调整方案后重跑</text><text className="minor" x="792" y="192">Refine</text></g>
        <g className="route-target pivot"><rect x="720" y="236" width="145" height="70" rx="10" /><text x="792" y="265">回到假设辩论</text><text className="minor" x="792" y="288">Pivot</text></g>
      </svg>
    </div>
    <div className="route-controls"><button className={selected === 'repair' ? 'active repair' : 'repair'} aria-pressed={selected === 'repair'} onClick={() => onSelect('repair')}><b>Repair</b><span>修复执行</span></button><button className={selected === 'refine' ? 'active refine' : 'refine'} aria-pressed={selected === 'refine'} onClick={() => onSelect('refine')}><b>Refine</b><span>调整当前实验</span></button><button className={selected === 'pivot' ? 'active pivot' : 'pivot'} aria-pressed={selected === 'pivot'} onClick={() => onSelect('pivot')}><b>Pivot</b><span>转向新假设</span></button></div>
    <p className="motion-conclusion" aria-live="polite"><b>{content[0]}：</b>{content[1]}</p>
  </div>;
}

export function VerificationGateScene() {
  const [claim, setClaim] = useState<'idle' | 'accepted' | 'blocked'>('idle');
  const [citation, setCitation] = useState<CitationState>('idle');
  const citationSources = [['文献元数据', 'CrossRef'], ['开放学术库', 'OpenAlex'], ['预印本记录', 'arXiv'], ['学术检索库', 'Semantic Scholar']] as const;
  return <div className="motion-scene verification-gate-scene">
    <div className="registry-gate" aria-live="polite"><div className={`claim-token ${claim}`}><span>教学示例主张</span><b>{claim === 'blocked' ? '未登记的数值主张' : '已登记的测量值'}</b></div><i>→</i><div className={`registry-door ${claim}`}><span>Verified Registry</span><b>{claim === 'blocked' ? 'BLOCKED' : claim === 'accepted' ? 'MATCHED ✓' : '等待核验'}</b></div><i>→</i><div className={`paper-slot ${claim}`}><span>论文草稿</span><b>{claim === 'accepted' ? '允许写入' : '严格章节只收录已验证证据'}</b></div></div>
    <div className="gate-controls"><button onClick={() => setClaim('accepted')}>提交已登记的示例数值</button><button onClick={() => setClaim('blocked')}>尝试提交未登记数值</button></div>
    <p className="motion-example-note">教学示例：这里演示的是核验规则，不是论文报告的 Accuracy 数值。</p>
    <div className={`citation-pipeline ${citation}`}><div className="citation-source"><span>候选引用</span><b>题名 · 作者 · 年份 · 标识符</b></div><i>↓</i><div className="citation-checks">{citationSources.map(([label, source], index) => <div key={source}><b>{String(index + 1).padStart(2, '0')}</b><span>{label}</span><small>{source} · {citation === 'idle' ? '待检查' : citation === 'verified' || index < 2 ? '匹配' : '待人工审阅'}</small></div>)}</div><i>↓</i><div className="citation-result"><b>{citation === 'verified' ? '已核验：可写入参考文献' : citation === 'suspicious' ? '存疑：转人工审阅' : '等待四层来源核验'}</b></div></div>
    <div className="gate-controls"><button onClick={() => setCitation('verified')}>运行四层核验</button><button onClick={() => setCitation('suspicious')}>模拟来源不一致</button></div>
  </div>;
}

export function MemoryStreamScene() {
  const [lesson, setLesson] = useState<'repair' | 'debate' | 'verify' | 'human'>('repair');
  const lessons = {
    repair: ['修复经验', '依赖或资源异常', '先检查环境与日志，再重跑。'],
    debate: ['辩论经验', '假设尚不可区分', '先检查消融能否区分，再投入预算。'],
    verify: ['验证经验', '主张缺少运行记录', '严格章节仅使用 Registry 中存在的数值。'],
    human: ['人类反馈', '实验语义不确定', '触发 SmartPause，请研究者选择 Refine 或 Pivot。'],
  } as const;
  const detail = lessons[lesson];
  return <div className="motion-scene memory-stream-scene">
    <div className="memory-flow"><article><span>Run 1</span><b>{detail[1]}</b><small>出现的科研事件</small></article><i>→</i><article className="lesson-card"><span>Lesson</span><b>{detail[0]}</b><small>{detail[2]}</small></article><i>→</i><article className="store-card"><span>Persistent store</span><b>触发条件 + 建议动作</b><small>w(l) 随时间衰减</small></article><i>→</i><article className="run-two"><span>Run 2</span><b>Prompt 注入</b><small>检索相关经验后再开始</small></article></div>
    <div className="lesson-switcher">{Object.entries(lessons).map(([id, [label]]) => <button key={id} className={lesson === id ? 'active' : ''} aria-pressed={lesson === id} onClick={() => setLesson(id as keyof typeof lessons)}>{label}</button>)}</div>
    <div className="prompt-preview" aria-live="polite"><span>下一轮系统提示</span><code>Relevant lesson: {detail[2]}</code><b>这是记忆检索，不是 LLM 重新训练。</b></div>
  </div>;
}
