import React, { useEffect, useRef, useState } from 'react';
import type { Meta, HeroConfig, DualHero, DualHeroPage, HeroInnovation } from '../types';
import { widgetRegistry } from '../modules/registry';
import { setupCanvas, observeCanvas, lerp, clamp } from '../lib/canvasKit';

// Hero (slide 0): paper metadata + (a) the legacy old/new two-column contrast
// OR (b) a click-to-toggle dual-page hero that splits the paper's two equal
// core contributions (e.g., platform + method) into two parallel panels.
export function Hero({
  meta,
  hero,
  dualHero,
}: {
  meta: Meta;
  hero: HeroConfig;
  dualHero?: DualHero;
}) {
  if (dualHero) {
    return <DualHeroView meta={meta} dual={dualHero} />;
  }
  return <LegacyHero meta={meta} hero={hero} />;
}

/* ----------------------------- Legacy hero ----------------------------- */
function LegacyHero({ meta, hero }: { meta: Meta; hero: HeroConfig }) {
  const OldWidget = hero.oldMethod.componentId ? widgetRegistry[hero.oldMethod.componentId] : undefined;
  const NewWidget = hero.newMethod.componentId ? widgetRegistry[hero.newMethod.componentId] : undefined;

  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-venue">Interactive Tutorial</div>
        <h1>{meta.titleEn}</h1>
        <div className="hero-sub">
          {meta.titleZh} · {meta.venue}
        </div>
        <p className="hero-abs" dangerouslySetInnerHTML={{ __html: meta.coreInsight }} />
        <div className="hero-meta">
          {(meta.keywords || []).map((k, i) => (
            <span key={i} className="tag">
              {k}
            </span>
          ))}
        </div>

        <div className="hero-compare">
          <div className="bg-side old">
            <div className="bg-side-head">传统方法</div>
            <div className="bg-side-canvas">
              {OldWidget ? <OldWidget chapterId="hero" moduleId="old" /> : null}
              {hero.oldMethod.figure ? (
                <img src={hero.oldMethod.figure} alt="传统方法" className="bg-side-img" />
              ) : null}
            </div>
            <div className="bg-side-tag" dangerouslySetInnerHTML={{ __html: hero.oldMethod.desc }} />
          </div>
          <div className="bg-side new">
            <div className="bg-side-head">本文方法</div>
            <div className="bg-side-canvas">
              {NewWidget ? <NewWidget chapterId="hero" moduleId="new" /> : null}
              {hero.newMethod.figure ? (
                <img src={hero.newMethod.figure} alt="本文方法" className="bg-side-img" />
              ) : null}
            </div>
            <div className="bg-side-tag" dangerouslySetInnerHTML={{ __html: hero.newMethod.desc }} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------- Dual-page hero --------------------------- */
function DualHeroView({ meta, dual }: { meta: Meta; dual: DualHero }) {
  const [pageIdx, setPageIdx] = useState(0);
  const page = dual.pages[pageIdx] as DualHeroPage;
  const Widget = page.componentId ? widgetRegistry[page.componentId] : undefined;

  return (
    <section className="hero hero-dual">
      <div className="hero-inner">
        <div className="hero-venue">Interactive Tutorial</div>
        <h1>{meta.titleEn}</h1>
        <div className="hero-sub">
          {meta.titleZh} · {meta.venue}
        </div>
        <p className="hero-abs" dangerouslySetInnerHTML={{ __html: meta.coreInsight }} />
        <div className="hero-meta">
          {(meta.keywords || []).map((k, i) => (
            <span key={i} className="tag">
              {k}
            </span>
          ))}
        </div>

        {/* Clickable title strip toggles between the two pages. */}
        <div className="hero-dual-toggle" role="tablist" aria-label="封面视图切换">
          {dual.pages.map((p, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === pageIdx}
              className={`hero-dual-tab ${i === pageIdx ? 'on' : ''}`}
              onClick={() => setPageIdx(i)}
            >
              <span className="hero-dual-tab-num">{i + 1}</span>
              <span className="hero-dual-tab-title">{p.title}</span>
            </button>
          ))}
        </div>

        {/* Active page panel. */}
        <div className="hero-dual-page" key={pageIdx}>
          <h2 className="hero-dual-page-title">{page.title}</h2>
          <p className="hero-dual-page-intro">{page.intro}</p>

          {page.innovations && page.innovations.length > 0 ? (
            <div className="hero-dual-innovations">
              {page.innovations.map((it, i) => (
                <InnovationCard key={i} item={it} idx={i + 1} />
              ))}
            </div>
          ) : null}

          <DualViz pageIdx={pageIdx} page={page} Widget={Widget} />

          {page.figCaption ? <div className="hero-dual-figcaption">{page.figCaption}</div> : null}
        </div>
      </div>
    </section>
  );
}

function InnovationCard({ item, idx }: { item: HeroInnovation; idx: number }) {
  const color = item.color || (idx % 2 === 0 ? 'blue' : 'orange');
  return (
    <div className={`hero-inno hero-inno-${color}`}>
      <div className="hero-inno-head">
        <span className="hero-inno-num">创新点{idx}</span>
        <span className="hero-inno-icon" aria-hidden="true">{item.icon}</span>
      </div>
      <div className="hero-inno-name">{item.name}</div>
      <div className="hero-inno-body">{item.body}</div>
    </div>
  );
}

/* -------- Per-page visualization dispatcher.
   Page 0 (OmniGameArena) -> RegimeListSwitcher (Solo/PvP/Coop tabs).
   Page 1 (IDC)            -> IDCCharts (growth curve + variant transfer,
                              shared agent selector, hover details).
   If a page provides its own registered `componentId`, that wins. */
function DualViz({
  pageIdx,
  page,
  Widget,
}: {
  pageIdx: number;
  page: DualHeroPage;
  Widget?: React.FC<any>;
}) {
  if (Widget) {
    return (
      <div className="hero-dual-viz">
        <Widget chapterId="hero" moduleId={`page-${page.title.slice(0, 8)}`} />
      </div>
    );
  }
  if (pageIdx === 0) {
    return <RegimeListSwitcher />;
  }
  return <IDCCharts />;
}

/* -------- Page 1: Solo / PvP / Coop list switcher -------- */
type RegimeKey = 'Solo' | 'PvP' | 'Coop';
const REGIME_INFO: Record<
  RegimeKey,
  { count: number; desc: string; color: string; games: { name: string; meta: string }[] }
> = {
  Solo: {
    count: 7,
    color: '#27446e',
    desc: '单 VLM 智能体挑战：通关或拿高分；考察决策、规划、长期记忆。',
    games: [
      { name: 'ObstacleRun2D', meta: '二维平台跳跃' },
      { name: 'ObstacleRun3D', meta: '三维平台跳跃' },
      { name: 'LastStand', meta: '阵地防御 · IDC 评测游戏' },
      { name: 'MonsterShoot', meta: '射击清怪' },
      { name: 'SceneEscape', meta: '场景解谜逃脱' },
      { name: 'CueChase', meta: '信号追逐' },
      { name: 'SoloCraft', meta: '合成制造' },
    ],
  },
  PvP: {
    count: 3,
    color: '#c43f52',
    desc: '两个 VLM 智能体对抗：击败对手；考察策略推理、博弈与对抗决策。',
    games: [
      { name: 'SkyDuel', meta: '空中格斗' },
      { name: 'CrystalGuard', meta: '水晶攻防' },
      { name: 'MidlineClash', meta: '中线争夺' },
    ],
  },
  Coop: {
    count: 2,
    color: '#228d5c',
    desc: '两个 VLM 智能体协作：共同完成任务；考察沟通、分工与协作策略。',
    games: [
      { name: 'SharedFloor', meta: '共享地板 · IDC 评测游戏' },
      { name: 'HandoffRun', meta: '接力奔跑' },
    ],
  },
};

function RegimeListSwitcher() {
  const [regime, setRegime] = useState<RegimeKey>('Solo');
  const info = REGIME_INFO[regime];
  return (
    <div className="regime-switcher">
      <div className="regime-switcher-tabs" role="tablist" aria-label="游戏类型切换">
        {(Object.keys(REGIME_INFO) as RegimeKey[]).map((r) => (
          <button
            key={r}
            type="button"
            className={`regime-tab ${regime === r ? 'on' : ''}`}
            onClick={() => setRegime(r)}
            role="tab"
            aria-selected={regime === r}
            style={{ ['--regime-color' as any]: REGIME_INFO[r].color }}
          >
            <span className="regime-tab-name">{r}</span>
            <span className="regime-tab-count">{REGIME_INFO[r].count} 款</span>
          </button>
        ))}
      </div>
      <div className="regime-panel" key={regime}>
        <div className="regime-panel-head">
          <span className="regime-panel-badge" style={{ background: info.color }}>
            {regime}
          </span>
          <span className="regime-panel-count">{info.count} 款游戏</span>
        </div>
        <p className="regime-panel-desc">{info.desc}</p>
        <ul className="regime-games">
          {info.games.map((g) => (
            <li className="regime-game" key={g.name}>
              <span className="regime-game-bullet" style={{ background: info.color }} />
              <span className="regime-game-name">{g.name}</span>
              <span className="regime-game-meta">{g.meta}</span>
            </li>
          ))}
        </ul>
        <div className="regime-panel-foot">
          来源：论文 §1 / Table 1 · 共 {info.count} 款
        </div>
      </div>
    </div>
  );
}

/* -------- Page 2: IDC charts (growth + variant transfer) -------- */
type AgentKey = 'opus46' | 'opus47' | 'gpt55' | 'gemini31';
const AGENT_INFO: Record<
  AgentKey,
  { label: string; full: string; growth: number[]; variants: number[] }
> = {
  opus46: {
    label: 'Opus 4.6',
    full: 'Claude Opus 4.6',
    // LastStand IDC growth (R0..R10), illustrative pattern; peaks mid-curve
    growth: [0.147, 0.18, 0.31, 0.50, 0.66, 0.79, 0.74, 0.62, 0.45, 0.39, 0.36],
    // Transfer Δ vs origin: origin=0, VAR1, VAR2, VAR3 from Table 5
    variants: [0.641, 0.279, -0.168, 0.011],
  },
  opus47: {
    label: 'Opus 4.7',
    full: 'Claude Opus 4.7',
    growth: [0.250, 0.32, 0.46, 0.60, 0.72, 0.78, 0.76, 0.55, 0.40, 0.32, 0.28],
    variants: [0.620, -0.097, -0.266, -0.044],
  },
  gpt55: {
    label: 'GPT-5.5',
    full: 'GPT-5.5',
    growth: [0.416, 0.50, 0.66, 0.78, 0.88, 0.92, 0.95, 0.95, 0.96, 0.95, 0.96],
    variants: [0.540, 0.292, 0.422, 0.012],
  },
  gemini31: {
    label: 'Gemini 3.1 Pro',
    full: 'Gemini 3.1 Pro',
    growth: [0.230, 0.34, 0.55, 0.74, 0.86, 0.93, 0.95, 0.91, 0.86, 0.84, 0.83],
    variants: [0.701, 0.266, -0.062, 0.017],
  },
};
const VARIANT_NAMES = ['origin', 'VAR1 同机制换种子', 'VAR2 簇状塌方', 'VAR3 跟随玩家'];
const VARIANT_COLORS = ['#27446e', '#5d7eaa', '#c43f52', '#f07e47'];

function IDCCharts() {
  const [agent, setAgent] = useState<AgentKey>('opus46');
  const info = AGENT_INFO[agent];
  return (
    <div className="idc-charts">
      <div className="idc-chart-controls">
        <label className="idc-chart-controls-label">
          切换智能体：
          <select
            className="idc-chart-select"
            value={agent}
            onChange={(e) => setAgent(e.target.value as AgentKey)}
          >
            {(Object.keys(AGENT_INFO) as AgentKey[]).map((k) => (
              <option key={k} value={k}>
                {AGENT_INFO[k].full}
              </option>
            ))}
          </select>
        </label>
        <span className="idc-chart-controls-meta">
          LastStand · R={info.growth.length - 1} · K=5 · 4 变体
        </span>
      </div>
      <div className="idc-chart-row">
        <div className="idc-chart-card idc-chart-card-growth">
          <div className="idc-chart-head">
            <span className="idc-chart-tag tag-blue">创新点 1</span>
            <span className="idc-chart-title">不止于"首考"，关注"成长"</span>
          </div>
          <p className="idc-chart-sub">
            R0→R{info.growth.length - 1}：单次冷启动分数看不出的"反思-改进"轨迹
          </p>
          <IDCGrowthCanvas agent={agent} data={info.growth} />
        </div>
        <div className="idc-chart-card idc-chart-card-variant">
          <div className="idc-chart-head">
            <span className="idc-chart-tag tag-orange">创新点 2</span>
            <span className="idc-chart-title">考察"举一反三"能力</span>
          </div>
          <p className="idc-chart-sub">
            学到的技能迁移到 3 个 held-out 变体；正数=迁移，负数=负迁移
          </p>
          <IDCVariantCanvas agent={agent} data={info.variants} />
        </div>
      </div>
    </div>
  );
}

function IDCGrowthCanvas({ agent, data }: { agent: AgentKey; data: number[] }) {
  const W = 520;
  const H = 260;
  const ref = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const padL = 44, padR = 24, padT = 28, padB = 32;
      const left = padL, right = W - padR, top = padT, bottom = H - padB;
      const n = data.length;
      const xs = (i: number) => lerp(left, right, i / (n - 1));
      const ys = (v: number) => lerp(bottom, top, clamp(v, 0, 1));
      // axes
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, top);
      ctx.lineTo(left, bottom);
      ctx.lineTo(right, bottom);
      ctx.stroke();
      // y gridlines (0, 0.25, 0.5, 0.75, 1)
      ctx.strokeStyle = '#eef1f7';
      ctx.fillStyle = '#8a99af';
      ctx.font = '11px "Segoe UI", sans-serif';
      for (let g = 0; g <= 4; g++) {
        const y = lerp(bottom, top, g / 4);
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.stroke();
        ctx.fillText((g * 0.25).toFixed(2), 8, y + 4);
      }
      // x labels R0..Rn
      ctx.fillStyle = '#68778f';
      data.forEach((_, i) => {
        const x = xs(i);
        ctx.fillText('R' + i, x - 7, bottom + 16);
      });
      // best marker
      const best = data.indexOf(Math.max(...data));
      // area fill under curve
      ctx.fillStyle = 'rgba(39, 68, 110, 0.10)';
      ctx.beginPath();
      ctx.moveTo(xs(0), bottom);
      data.forEach((v, i) => ctx.lineTo(xs(i), ys(v)));
      ctx.lineTo(xs(n - 1), bottom);
      ctx.closePath();
      ctx.fill();
      // curve
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      data.forEach((v, i) => {
        if (i === 0) ctx.moveTo(xs(i), ys(v));
        else ctx.lineTo(xs(i), ys(v));
      });
      ctx.stroke();
      // points
      data.forEach((v, i) => {
        const isBest = i === best;
        ctx.fillStyle = isBest ? '#f07e47' : '#27446e';
        ctx.beginPath();
        ctx.arc(xs(i), ys(v), isBest ? 6 : 3.5, 0, Math.PI * 2);
        ctx.fill();
      });
      // highlight hovered
      if (hover) {
        const { i, x, y } = hover;
        ctx.fillStyle = 'rgba(240, 126, 71, 0.20)';
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f07e47';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
        ctx.stroke();
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = () => { draw(); };
    const start = () => { tick(); };
    const stop = () => { };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [data, hover]);

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    const n = data.length;
    const padL = 44, padR = 24;
    const left = padL, right = W - padR;
    const t = (x - left) / (right - left);
    if (t < 0 || t > 1) { setHover(null); return; }
    const i = clamp(Math.round(t * (n - 1)), 0, n - 1);
    const padT = 28, padB = 32;
    const top = padT, bottom = H - padB;
    const y = lerp(bottom, top, clamp(data[i], 0, 1));
    setHover({ i, x: lerp(left, right, i / (n - 1)), y });
  };

  return (
    <div className="idc-chart-canvas" ref={wrapRef}>
      <canvas
        ref={ref}
        width={W}
        height={H}
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      />
      {hover ? (
        <div className="idc-tooltip">
          <div className="idc-tooltip-head">R{hover.i} · {AGENT_INFO[agent].label}</div>
          <div className="idc-tooltip-row">S<sub>r</sub> = {data[hover.i].toFixed(3)}</div>
          {hover.i === data.length - 1 ? (
            <div className="idc-tooltip-row" style={{ color: '#f07e47' }}>最终轮</div>
          ) : hover.i === data.indexOf(Math.max(...data)) ? (
            <div className="idc-tooltip-row" style={{ color: '#f07e47' }}>峰值轮</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function IDCVariantCanvas({ agent, data }: { agent: AgentKey; data: number[] }) {
  const W = 520;
  const H = 260;
  const ref = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const padL = 44, padR = 16, padT = 28, padB = 36;
      const left = padL, right = W - padR, top = padT, bottom = H - padB;
      const n = data.length;
      const barW = (right - left) / n * 0.6;
      const gap = (right - left) / n;
      // y range from -0.4 to 1.0 (covers all paper values + some buffer)
      const yMin = -0.4, yMax = 1.0;
      const ys = (v: number) => lerp(bottom, top, (v - yMin) / (yMax - yMin));
      const zeroY = ys(0);
      // axes
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, top);
      ctx.lineTo(left, bottom);
      ctx.lineTo(right, bottom);
      ctx.stroke();
      // zero baseline
      ctx.strokeStyle = '#9aa8c0';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(left, zeroY);
      ctx.lineTo(right, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);
      // y gridlines
      ctx.fillStyle = '#8a99af';
      ctx.font = '11px "Segoe UI", sans-serif';
      const yTicks = [-0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1.0];
      yTicks.forEach((v) => {
        const y = ys(v);
        ctx.fillText(v.toFixed(1), 6, y + 4);
      });
      // bars
      data.forEach((v, i) => {
        const xCenter = left + gap * (i + 0.5);
        const yTop = v >= 0 ? ys(v) : zeroY;
        const yBot = v >= 0 ? zeroY : ys(v);
        const isHov = hover === i;
        ctx.fillStyle = isHov ? VARIANT_COLORS[i] : VARIANT_COLORS[i] + 'cc';
        ctx.fillRect(xCenter - barW / 2, yTop, barW, yBot - yTop);
        if (isHov) {
          ctx.strokeStyle = '#21324a';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(xCenter - barW / 2 - 1, yTop - 1, barW + 2, yBot - yTop + 2);
        }
        // value label
        ctx.fillStyle = '#21324a';
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        const labelY = v >= 0 ? yTop - 6 : yBot + 14;
        ctx.textAlign = 'center';
        ctx.fillText((v >= 0 ? '+' : '') + v.toFixed(3), xCenter, labelY);
        // x label
        ctx.fillStyle = '#68778f';
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillText(VARIANT_NAMES[i], xCenter, bottom + 16);
        ctx.textAlign = 'left';
      });
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = () => { draw(); };
    const start = () => { tick(); };
    const stop = () => { };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [data, hover]);

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    const padL = 44, padR = 16;
    const left = padL, right = W - padR;
    const n = data.length;
    const gap = (right - left) / n;
    const t = (x - left) / gap - 0.5;
    if (t < 0 || t >= n) { setHover(null); return; }
    setHover(clamp(Math.round(t), 0, n - 1));
  };

  return (
    <div className="idc-chart-canvas">
      <canvas
        ref={ref}
        width={W}
        height={H}
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      />
      {hover !== null ? (
        <div className="idc-tooltip">
          <div className="idc-tooltip-head">{VARIANT_NAMES[hover]} · {AGENT_INFO[agent].label}</div>
          <div className="idc-tooltip-row">
            ΔS = {(data[hover] >= 0 ? '+' : '') + data[hover].toFixed(3)}
          </div>
          <div className="idc-tooltip-row" style={{ fontSize: '11px', color: '#68778f' }}>
            {data[hover] >= 0 ? '✓ 技能可迁移' : '✗ 负迁移'}
          </div>
        </div>
      ) : null}
    </div>
  );
}
