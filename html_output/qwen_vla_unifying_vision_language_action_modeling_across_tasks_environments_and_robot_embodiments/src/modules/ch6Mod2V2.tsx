import React, { useEffect, useMemo, useState } from 'react';
import { PsButton, PsChip, PsFeedback } from '../components/ps-controls';
import { OOD_CATEGORIES, OOD_MODELS, tweenValue, type OodCategory } from './ch6EvidenceData';
import { T } from '../data/terminology';
import type { WidgetProps } from './registry';

function useTweenScores(scores: Record<string, number>, ms = 620) {
  const [vals, setVals] = useState(scores);
  useEffect(() => {
    const from = { ...vals };
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const next: Record<string, number> = {};
      for (const k of Object.keys(scores)) next[k] = tweenValue(from[k] ?? 0, scores[k], t);
      setVals(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(scores), ms]);
  return vals;
}

const OOD_CATS: OodCategory[] = ['color', 'instance', 'position', 'background', 'instruction'];

const MODEL_COLORS: Record<string, string> = {
  groot: 'var(--viz-slate)',
  pi05: 'var(--viz-amber)',
  'qwen-wo': 'var(--viz-purple)',
  'qwen-w': 'var(--viz-green)',
};

const CATEGORY_ACCENT: Record<OodCategory, string> = {
  color: 'var(--viz-purple)',
  instance: 'var(--viz-sky)',
  position: 'var(--viz-amber)',
  background: 'var(--viz-teal)',
  instruction: 'var(--viz-navy)',
};

function SceneObject({ cat, phase }: { cat: OodCategory; phase: number }) {
  const colors = ['#3d8f6a', '#b8860b', '#7c6ba8', '#4f7fb5'];
  const fill = cat === 'color' ? colors[phase % colors.length] : '#34476f';
  const x = cat === 'position' ? [74, 96, 118, 92][phase % 4] : 94;
  const y = cat === 'position' ? [74, 60, 76, 54][phase % 4] : 70;

  if (cat === 'instance') {
    const shape = phase % 3;
    return (
      <g className="ood2-object" transform={`translate(${x} ${y})`}>
        {shape === 0 && <circle r="9" fill={fill} />}
        {shape === 1 && <polygon points="0,-11 11,8 -11,8" fill={fill} />}
        {shape === 2 && <path d="M-9 -7 H7 L11 0 L7 8 H-9 Z" fill={fill} />}
      </g>
    );
  }
  return <rect className="ood2-object" x={x - 9} y={y - 9} width="18" height="18" rx="4" fill={fill} />;
}

function AlohaOODScene({ cat, phase }: { cat: OodCategory; phase: number }) {
  const activeLabel = OOD_CATEGORIES.find((x) => x.id === cat)?.zh ?? '';
  const bgClass = cat === 'background' ? ` is-bg-${phase % 3}` : '';
  const instruction = cat === 'instruction'
    ? phase % 2 === 0
      ? '将方块移至容器内'
      : '把目标物体放到右侧区域'
    : '抓起目标物体并放到标记区域';
  const leftAngle = cat === 'position' ? [-12, 4, 14, -2][phase % 4] : [0, 5, 0, -4][phase % 4];
  const rightAngle = cat === 'position' ? [10, -6, -14, 3][phase % 4] : [0, -4, 0, 4][phase % 4];

  return (
    <div className={`ood2-scene-shell${bgClass}`}>
      <div className="ood2-scene-head">
        <div>
          <span className="ood2-kicker">ALOHA 双臂操作场景</span>
          <strong>{activeLabel}</strong>
        </div>
        <span className="ood2-scene-live"><i /> 场景实时变化</span>
      </div>
      <div className="ood2-instruction">
        <span>语言指令</span>
        <b key={`${cat}-${phase}`}>{instruction}</b>
      </div>
      <svg viewBox="0 0 220 150" className="ood2-scene" aria-label={`ALOHA ${activeLabel}教学示意`}>
        <defs>
          <linearGradient id="ood2-floor" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e9eef6" />
            <stop offset="1" stopColor="#d9e2ee" />
          </linearGradient>
          <filter id="ood2-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#21324a" floodOpacity="0.12" />
          </filter>
        </defs>
        <rect x="8" y="8" width="204" height="132" rx="14" className="ood2-room" />
        <path d="M18 112 H202" stroke="url(#ood2-floor)" strokeWidth="16" strokeLinecap="round" />
        <rect x="124" y="82" width="54" height="26" rx="6" className="ood2-target" />
        <text x="151" y="99" textAnchor="middle" className="ood2-svg-label">目标区域</text>

        <g className="ood2-arm ood2-arm--left" style={{ transform: `rotate(${leftAngle}deg)`, transformOrigin: '44px 112px' }}>
          <circle cx="44" cy="112" r="9" className="ood2-base" />
          <path d="M44 104 L61 76 L82 64" className="ood2-link" />
          <circle cx="61" cy="76" r="5" className="ood2-joint" />
          <circle cx="82" cy="64" r="5" className="ood2-joint" />
          <path d="M82 64 l8 -5 M82 64 l8 5" className="ood2-gripper" />
        </g>
        <g className="ood2-arm ood2-arm--right" style={{ transform: `rotate(${rightAngle}deg)`, transformOrigin: '188px 112px' }}>
          <circle cx="188" cy="112" r="9" className="ood2-base" />
          <path d="M188 104 L171 76 L150 64" className="ood2-link" />
          <circle cx="171" cy="76" r="5" className="ood2-joint" />
          <circle cx="150" cy="64" r="5" className="ood2-joint" />
          <path d="M150 64 l-8 -5 M150 64 l-8 5" className="ood2-gripper" />
        </g>

        <g filter="url(#ood2-shadow)">
          <SceneObject cat={cat} phase={phase} />
        </g>
        <path className="ood2-motion-path" d="M94 70 C112 64, 124 72, 148 84" />
        <circle className="ood2-motion-packet" r="4">
          <animateMotion dur="1.8s" repeatCount="indefinite" path="M94 70 C112 64,124 72,148 84" />
        </circle>
      </svg>
      <div className="ood2-scene-note">切换 OOD 类型时，场景本身与右侧成功率对比同步更新。</div>
    </div>
  );
}

function DeltaLane({
  category,
  wo,
  w,
  active,
  emphasizePretrain,
}: {
  category: OodCategory;
  wo: number;
  w: number;
  active: boolean;
  emphasizePretrain: boolean;
}) {
  const meta = OOD_CATEGORIES.find((x) => x.id === category)!;
  const delta = w - wo;
  return (
    <div className={`ood2-lane${active ? ' is-active' : ''}`}>
      <div className="ood2-lane-title">
        <span>{meta.zh}</span>
        <b>+{delta.toFixed(1)}</b>
      </div>
      <div className="ood2-lane-track" aria-label={`${meta.zh}: ${wo.toFixed(1)} 到 ${w.toFixed(1)}`}>
        <div className="ood2-lane-baseline" />
        <div className="ood2-lane-gain" style={{ left: `${wo}%`, width: `${Math.max(0, delta)}%` }} />
        <span className={`ood2-marker ood2-marker--wo${!emphasizePretrain ? ' is-emphasis' : ''}`} style={{ left: `${wo}%` }}>
          <i />
          <small>{wo.toFixed(1)}</small>
        </span>
        <span className={`ood2-marker ood2-marker--w${emphasizePretrain ? ' is-emphasis' : ''}`} style={{ left: `${w}%` }}>
          <i />
          <small>{w.toFixed(1)}</small>
        </span>
      </div>
    </div>
  );
}

function CurrentCategoryRanking({ cat, scores }: { cat: OodCategory; scores: Record<string, number> }) {
  const rows = useMemo(() => {
    return OOD_MODELS.map((m) => ({ ...m, value: scores[m.id] ?? 0 })).sort((a, b) => b.value - a.value);
  }, [scores]);

  return (
    <div className="ood2-ranking">
      <div className="ood2-ranking-head">
        <div>
          <span className="ood2-kicker">当前类别 · 四模型</span>
          <strong>{OOD_CATEGORIES.find((x) => x.id === cat)?.zh}</strong>
        </div>
        <span>成功率 (%)</span>
      </div>
      <div className="ood2-ranking-rows">
        {rows.map((m, idx) => (
          <div className={`ood2-rank-row${m.id === 'qwen-w' ? ' is-qwen-pretrain' : ''}`} key={m.id}>
            <span className="ood2-rank-pos">{idx + 1}</span>
            <span className="ood2-rank-name">{m.name.replace('Qwen w/', 'Qwen-VLA-aloha w/')}</span>
            <div className="ood2-rank-track">
              <div className="ood2-rank-fill" style={{ width: `${m.value}%`, background: MODEL_COLORS[m.id] }} />
            </div>
            <b>{m.value.toFixed(1)}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

export const Ch6Mod2V2: React.FC<WidgetProps> = () => {
  const [cat, setCat] = useState<OodCategory>('color');
  const [pretrain, setPretrain] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setPhase((p) => p + 1), 950);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!autoPlay) return;
    const id = window.setInterval(() => {
      setCat((prev) => OOD_CATS[(OOD_CATS.indexOf(prev) + 1) % OOD_CATS.length]);
    }, 3200);
    return () => window.clearInterval(id);
  }, [autoPlay]);

  const qwenW = OOD_MODELS.find((m) => m.id === 'qwen-w')!;
  const qwenWo = OOD_MODELS.find((m) => m.id === 'qwen-wo')!;

  const scoreMap = useMemo(() => {
    const next: Record<string, number> = {};
    OOD_MODELS.forEach((m) => { next[m.id] = m.scores[cat]; });
    return next;
  }, [cat]);
  const tweened = useTweenScores(scoreMap);
  const selectedMeta = OOD_CATEGORIES.find((x) => x.id === cat)!;
  const selectedDelta = qwenW.scores[cat] - qwenWo.scores[cat];

  const selectCategory = (next: OodCategory) => {
    setAutoPlay(false);
    setCat(next);
    setPhase((p) => p + 1);
  };

  return (
    <div className="ood2-lab">
      <section className="ood2-transfer" aria-label="预训练带来的平均 OOD 增益">
        <div className="ood2-transfer-side is-before">
          <span>无预训练初始化</span>
          <strong>{qwenWo.avg.toFixed(1)}</strong>
          <small>Qwen-VLA-aloha w/o pretrain</small>
        </div>
        <div className="ood2-transfer-flow">
          <span>使用 Qwen-VLA-Base 预训练</span>
          <div className="ood2-transfer-line"><i /></div>
          <b>+{(qwenW.avg - qwenWo.avg).toFixed(1)} pp</b>
        </div>
        <div className="ood2-transfer-side is-after">
          <span>真实世界 OOD 平均成功率</span>
          <strong>{qwenW.avg.toFixed(1)}</strong>
          <small>Qwen-VLA-aloha w/ pretrain</small>
        </div>
      </section>

      <div className="ood2-main">
        <div className="ood2-leftcol">
          <AlohaOODScene cat={cat} phase={phase} />
          <div className="ood2-category-panel">
            <div className="ood2-category-head">
              <div>
                <span className="ood2-kicker">压力类型</span>
                <strong>{selectedMeta.zh}</strong>
              </div>
              <span className="ood2-live-delta" style={{ color: CATEGORY_ACCENT[cat] }}>+{selectedDelta.toFixed(1)} pp</span>
            </div>
            <div className="ood2-category-chips">
              {OOD_CATEGORIES.map((c) => (
                <PsChip key={c.id} selected={cat === c.id} onClick={() => selectCategory(c.id)}>{c.zh}</PsChip>
              ))}
            </div>
            <div className="ood2-autoplay">
              <PsButton variant={autoPlay ? 'primary' : 'ghost'} onClick={() => setAutoPlay((v) => !v)}>
                {autoPlay ? '暂停自动巡检' : '自动巡检五类 OOD'}
              </PsButton>
              <span>{autoPlay ? '每 3.2 秒切换一种真实世界变化' : '当前为手动查看模式'}</span>
            </div>
          </div>
        </div>

        <div className="ood2-rightcol">
          <div className="ood2-compare-head">
            <div>
              <span className="ood2-kicker">五类 OOD 成功率迁移</span>
              <strong>预训练把整体鲁棒性向右推移</strong>
            </div>
            <div className="ood2-focus-toggle">
              <button type="button" className={!pretrain ? 'is-active' : ''} onClick={() => setPretrain(false)}>w/o pretrain</button>
              <button type="button" className={pretrain ? 'is-active' : ''} onClick={() => setPretrain(true)}>w/ pretrain</button>
            </div>
          </div>
          <div className="ood2-lanes">
            {OOD_CATS.map((c) => (
              <DeltaLane
                key={c}
                category={c}
                wo={qwenWo.scores[c]}
                w={qwenW.scores[c]}
                active={cat === c}
                emphasizePretrain={pretrain}
              />
            ))}
          </div>
          <div className="ood2-scale"><span>0</span><span>50</span><span>100</span></div>
          <CurrentCategoryRanking cat={cat} scores={tweened} />
        </div>
      </div>

      <PsFeedback tone="good">
        当前「{selectedMeta.zh}」：Qwen-VLA-aloha {qwenWo.scores[cat].toFixed(1)} → {qwenW.scores[cat].toFixed(1)}，提升 {selectedDelta.toFixed(1)} 个百分点；平均 OOD 成功率 {qwenWo.avg.toFixed(1)} → {qwenW.avg.toFixed(1)}。· {T.ood.title}
      </PsFeedback>
    </div>
  );
};

export default Ch6Mod2V2;
