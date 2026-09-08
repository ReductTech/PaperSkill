import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';

type GateKey = 'safe' | 'watermark' | 'aesthetic' | 'consistency' | 'quality';
type Gate = { key: GateKey; label: string; kind: 'veto' | 'threshold'; pass: boolean; score?: number };
type Sample = { id: number; x: number; gates: Gate[]; keep: boolean; state: 'live' | 'correct' | 'wrong'; stateAt: number };
type Phase = 'idle' | 'playing' | 'over';

const CARD_W = 138;
const PLAYFIELD_H = 288;
const LIVES = 3;
const THRESH = 60;
const HIT_ZONE = 0.56;

let idSeq = 1;
const scorePass = () => 62 + Math.floor(Math.random() * 37);
const scoreFail = () => 30 + Math.floor(Math.random() * 28);

function makeSample(): Sample {
  const keep = Math.random() < 0.42;
  let safePass = true;
  let watermarkPass = true;
  const scores = { aesthetic: scorePass(), consistency: scorePass(), quality: scorePass() };
  if (!keep) {
    const pool: GateKey[] = ['safe', 'watermark', 'aesthetic', 'consistency', 'quality'];
    const failCount = Math.random() < 0.7 ? 1 : 2;
    pool.sort(() => Math.random() - 0.5).slice(0, failCount).forEach((key) => {
      if (key === 'safe') safePass = false;
      else if (key === 'watermark') watermarkPass = false;
      else scores[key] = scoreFail();
    });
  }
  const gates: Gate[] = [
    { key: 'safe', label: '安全', kind: 'veto', pass: safePass },
    { key: 'watermark', label: '水印', kind: 'veto', pass: watermarkPass },
    { key: 'aesthetic', label: '审美', kind: 'threshold', score: scores.aesthetic, pass: scores.aesthetic >= THRESH },
    { key: 'consistency', label: '一致', kind: 'threshold', score: scores.consistency, pass: scores.consistency >= THRESH },
    { key: 'quality', label: '质量', kind: 'threshold', score: scores.quality, pass: scores.quality >= THRESH },
  ];
  return { id: idSeq++, x: -CARD_W, gates, keep: gates.every((gate) => gate.pass), state: 'live', stateAt: 0 };
}

function freshGame() {
  return { samples: [] as Sample[], score: 0, lives: LIVES, combo: 0, maxCombo: 0, correct: 0, total: 0, spawnTimer: 0 };
}

export function QcPipelineSection(_props: WidgetProps) {
  return (
    <section className="qc-section">
      <div className="qc-section-head">
        <span>3.1</span>
        <h2>五维质检流水线</h2>
      </div>
      <div className="qc-section-body">
        <p>
          去重后，用一组互补模型进一步筛选：安全、水印一票否决，审美、任务一致性、技术质量按阈值过滤。五者取“与”，既剔除有害与低质图像，也保留对高分辨率像素空间建模真正有用的样本。
        </p>
        <QcPipelineGame />
      </div>
    </section>
  );
}

function QcPipelineGame() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const widthRef = useRef(760);
  const gameRef = useRef(freshGame());
  const phaseRef = useRef<Phase>('idle');
  const [phase, setPhase] = useState<Phase>('idle');
  const [, setTick] = useState(0);
  const [flash, setFlash] = useState<'correct' | 'wrong' | 'miss' | null>(null);
  phaseRef.current = phase;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      widthRef.current = el.clientWidth;
    });
    ro.observe(el);
    widthRef.current = el.clientWidth;
    return () => ro.disconnect();
  }, []);

  const activeSample = useCallback(() => {
    const zoneStart = widthRef.current * HIT_ZONE;
    return gameRef.current.samples
      .filter((sample) => sample.state === 'live' && sample.x + CARD_W >= zoneStart)
      .sort((a, b) => b.x - a.x)[0] ?? null;
  }, []);

  const start = useCallback(() => {
    gameRef.current = freshGame();
    gameRef.current.spawnTimer = 300;
    phaseRef.current = 'playing';
    setPhase('playing');
    setFlash(null);
  }, []);

  const decide = useCallback((keepChoice: boolean) => {
    if (phaseRef.current !== 'playing') return;
    const sample = activeSample();
    if (!sample) return;
    const game = gameRef.current;
    const now = performance.now();
    game.total += 1;
    if (sample.keep === keepChoice) {
      sample.state = 'correct';
      sample.stateAt = now;
      game.combo += 1;
      game.maxCombo = Math.max(game.maxCombo, game.combo);
      game.correct += 1;
      game.score += 10 + (game.combo - 1) * 2;
      setFlash('correct');
    } else {
      sample.state = 'wrong';
      sample.stateAt = now;
      game.combo = 0;
      game.lives -= 1;
      game.score = Math.max(0, game.score - 8);
      setFlash('wrong');
    }
    if (game.lives <= 0) setPhase('over');
    setTick((t) => t + 1);
  }, [activeSample]);

  useEffect(() => {
    if (phase !== 'playing') return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const game = gameRef.current;
      const exitX = widthRef.current + 8;
      game.spawnTimer -= dt * 1000;
      if (game.spawnTimer <= 0) {
        game.samples.push(makeSample());
        game.spawnTimer = Math.max(820, 1750 - game.score * 1.25);
      }
      const speed = 74 + Math.min(game.score, 900) * 0.13;
      game.samples.forEach((sample) => {
        if (sample.state === 'live') sample.x += speed * dt;
      });
      let missed = false;
      game.samples.forEach((sample) => {
        if (sample.state === 'live' && sample.x > exitX) {
          sample.state = 'wrong';
          sample.stateAt = now;
          game.lives -= 1;
          game.combo = 0;
          game.total += 1;
          missed = true;
        }
      });
      if (missed) setFlash('miss');
      game.samples = game.samples.filter((sample) => sample.state === 'live' || now - sample.stateAt < 320);
      if (game.lives <= 0) {
        setPhase('over');
        return;
      }
      setTick((t) => (t + 1) % 1_000_000);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (phaseRef.current === 'playing') {
        if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'f') decide(true);
        if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'j') decide(false);
      } else if (event.key === 'Enter' || event.key === ' ') {
        start();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [decide, start]);

  const game = gameRef.current;
  const active = phase === 'playing' ? activeSample() : null;
  const accuracy = game.total > 0 ? Math.round((game.correct / game.total) * 100) : 0;

  return (
    <div className="qc-game">
      <div className="qc-hud">
        <Stat label="得分" value={game.score} />
        <Stat label="连击" value={game.combo > 0 ? `x${game.combo + 1}` : '-'} />
        <Stat label="生命" value={'●'.repeat(game.lives).padEnd(LIVES, '○')} />
        <Stat label="准确率" value={`${accuracy}%`} />
        <div className="qc-rule">规则：安全/水印一票否决，审美/一致/质量需 ≥ {THRESH}，全部满足才保留。</div>
      </div>
      <div ref={wrapRef} className="qc-playfield">
        <div className="qc-belt" aria-hidden />
        <div className="qc-zone" style={{ left: `${HIT_ZONE * 100}%` }}><span>判定区</span></div>
        {game.samples.map((sample) => (
          <div
            key={sample.id}
            className="qc-sample"
            style={{
              left: sample.x,
              width: CARD_W,
              transform: sample.state === 'live' ? 'none' : sample.state === 'correct' ? 'translateY(-14px) scale(.85)' : 'translateY(14px) scale(.85) rotate(6deg)',
              opacity: sample.state === 'live' ? 1 : 0,
            }}
          >
            <SampleCard sample={sample} active={active?.id === sample.id} />
          </div>
        ))}
        {flash ? <div className={`qc-flash ${flash}`}>{flash === 'correct' ? '正确 +' : flash === 'wrong' ? '判断错误' : '漏检'}</div> : null}
        {phase !== 'playing' ? (
          <div className="qc-overlay">
            {phase === 'idle' ? (
              <>
                <h3>五维质检流水线</h3>
                <p>样本进入判定区时，判断它应当保留还是丢弃。安全与水印是一票否决，另外三项必须超过阈值。</p>
                <button onClick={start}>开始质检</button>
              </>
            ) : (
              <>
                <h3>流水线关闭</h3>
                <p>最终得分 {game.score}，准确率 {accuracy}%，最高连击 x{game.maxCombo + (game.maxCombo > 0 ? 1 : 0)}。</p>
                <button onClick={start}>再试一次</button>
              </>
            )}
          </div>
        ) : null}
      </div>
      <div className="qc-actions">
        <button onClick={() => decide(true)} disabled={phase !== 'playing'}>保留 <span>← / F</span></button>
        <button onClick={() => decide(false)} disabled={phase !== 'playing'}>丢弃 <span>→ / J</span></button>
      </div>
      <div className="qc-legend">
        {[
          ['安全', '一票否决', 'NSFW 分类器', '色情 / 暴力等不当内容'],
          ['水印', '一票否决', '水印检测器', '带明显水印的图像'],
          ['审美', '阈值过滤', '美学评分模型', '视觉吸引力差的图像'],
          ['一致', '阈值过滤', 'Qwen3-VL', '任务有效性不足'],
          ['质量', '阈值过滤', 'Top-IQ + JPEG 字节比', '压缩伪影 / 低质量'],
        ].map(([label, kind, tool, target], index) => (
          <div className="qc-legend-card" key={label}>
            <strong>{index + 1}. {label}</strong>
            <span>{kind}</span>
            <em>{tool}</em>
            <p>{target}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="qc-stat"><span>{label}</span><b>{value}</b></div>;
}

function SampleCard({ sample, active }: { sample: Sample; active: boolean }) {
  return (
    <div className={`qc-card ${active ? 'active' : ''}`}>
      <div className="qc-card-title">样本 #{sample.id}</div>
      {sample.gates.map((gate) => gate.kind === 'veto' ? (
        <div key={gate.key} className={`qc-gate ${gate.pass ? 'pass' : 'fail'}`}>
          <span>{gate.label}</span>
          <b>{gate.pass ? '通过' : '否决'}</b>
        </div>
      ) : (
        <div key={gate.key} className={`qc-threshold ${gate.pass ? 'pass' : 'fail'}`}>
          <div><span>{gate.label}</span><b>{gate.score}</b></div>
          <i><em style={{ width: `${gate.score ?? 0}%` }} /></i>
        </div>
      ))}
    </div>
  );
}
