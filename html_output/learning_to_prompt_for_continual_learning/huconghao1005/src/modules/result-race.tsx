import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  LP,
  lpRoundRect,
  drawField,
  drawSheet,
  drawLabel,
  drawLegend,
  drawLink,
  drawKitchenCounter,
  drawPlate,
} from './letterpressKit';

// ── 第 10 章 10.1「结果竞赛」 · 主导操作 P8：按「开始」跑一场 ──
// 画面：一条跑道，每个方法是一张在跑的样张，停在与自己平均准确率成比例的位置。
// 切换 buffer 分组或换数据集，同一批方法的名次当场翻面（这是本章要学到的那条判断）。

const W_NORMAL = 1080;
const H_NORMAL = 560;
const W_ANA = 560;
const H_ANA = 140;

const TRACK_X0 = 236;
const TRACK_X1 = 1040;
const ROW_TOP = 96;

/** 跑道两端对应的准确率区间；所有真实分数都落在里面。 */
const VALUE_LO = 60;
const VALUE_HI = 92;

type Tone = 'good' | 'bad' | 'neutral';

/** 方法类别：图例按类别上色，同一个色块必须真的对应同一类方法。 */
type Cat = 'paper' | 'rehearsal' | 'reg' | 'seq';

interface MethodRow {
  name: string;
  value: number;
  tone: Tone;
  cat: Cat;
  isPaper?: boolean;
  forget?: number;
}

const CAT_LABEL: Record<Cat, string> = {
  paper: 'L2P 系',
  rehearsal: 'rehearsal',
  reg: '正则化',
  seq: '顺序微调',
};

function catOf(name: string): Cat {
  if (name === 'EWC' || name === 'LwF') return 'reg';
  if (name === 'FT-seq' || name === 'FT-seq-frozen') return 'seq';
  if (name === 'ER' || name === 'GDumb' || name === 'BiC' || name === 'DER++' || name === 'Co2L') {
    return 'rehearsal';
  }
  return 'paper';
}

function catColor(c: Cat): string {
  if (c === 'rehearsal') return LP.guide;
  if (c === 'reg') return LP.failure;
  if (c === 'seq') return LP.muted;
  return LP.success;
}

interface GroupDef {
  id: string;
  label: string;
  short: string;
  note?: string;
  upper: number;
  methods: MethodRow[];
}

interface DsDef {
  id: string;
  label: string;
  short: string;
  setting: string;
  groups: GroupDef[];
}

const R = (name: string, value: number): MethodRow => ({
  name,
  value,
  tone: 'neutral',
  cat: catOf(name),
});
const P = (name: string, value: number, forget?: number): MethodRow => ({
  name,
  value,
  tone: 'good',
  cat: 'paper',
  isPaper: true,
  forget,
});

const DATASETS: DsDef[] = [
  {
    id: 'cifar100',
    label: 'Split CIFAR-100',
    short: 'CIFAR',
    setting: 'class-IL',
    groups: [
      {
        id: '0',
        label: '零 buffer（不存旧数据）',
        short: '零 buffer',
        upper: 90.85,
        methods: [
          R('FT-seq', 33.61),
          R('EWC', 47.01),
          R('LwF', 60.69),
          P('L2P', 83.83, 7.63),
        ],
      },
      {
        id: '10',
        label: '每类 10 张 buffer',
        short: '每类 10 张',
        upper: 90.85,
        methods: [
          R('ER', 67.87),
          R('GDumb', 67.14),
          R('BiC', 66.11),
          R('DER++', 61.06),
          R('Co2L', 72.15),
          P('L2P-R', 84.21),
        ],
      },
      {
        id: '50',
        label: '每类 50 张 buffer',
        short: '每类 50 张',
        upper: 90.85,
        methods: [
          R('ER', 82.53),
          R('GDumb', 81.67),
          R('BiC', 81.42),
          R('DER++', 83.94),
          R('Co2L', 82.49),
          P('L2P-R', 86.31),
        ],
      },
    ],
  },
  {
    id: 'core50',
    label: 'CORe50',
    short: 'CORe50',
    setting: 'domain-IL',
    groups: [
      {
        id: '0',
        label: '零 buffer（domain-IL）',
        short: '零 buffer',
        upper: 82.15,
        methods: [
          R('EWC', 74.82),
          R('LwF', 75.45),
          P('L2P', 78.33),
        ],
      },
      {
        id: '50',
        label: '每类 50 张 buffer',
        short: '每类 50 张',
        upper: 82.15,
        methods: [
          R('ER', 80.1),
          R('GDumb', 74.92),
          R('BiC', 79.28),
          R('DER++', 79.7),
          R('Co2L', 79.75),
          P('L2P-R', 81.07),
        ],
      },
    ],
  },
  {
    id: 'gaussian',
    label: 'Gaussian CIFAR-100',
    short: 'Gaussian',
    setting: 'task-agnostic',
    groups: [
      {
        id: '0',
        label: '零 buffer',
        short: '零 buffer',
        upper: 90.85,
        methods: [
          R('EWC', 63.04),
          P('L2P', 88.34),
        ],
      },
      {
        id: '50',
        label: '每类 50 张 buffer',
        short: '每类 50 张',
        upper: 90.85,
        methods: [
          R('ER', 82.63),
          R('GDumb', 81.67),
          R('DER++', 85.24),
          P('L2P-R', 88.92),
        ],
      },
    ],
  },
];

// 论文里明说过的三句结论，逐字照抄（外加初始提示）。
const COPY_START = '先选数据集和 buffer 分组，再点“开始”。';
const COPY_CIFAR0 =
  'L2P <b>83.83</b>（Forgetting 7.63）——<b>零 buffer 这一组里最好</b>，记忆条几乎不掉；同一张表里 L2P-R 86.31、上界 90.85 更高。';
const COPY_CIFAR10 =
  '每类 10 张 buffer：L2P-R <b>84.21</b> 最高，Co2L 72.15、ER 67.87、GDumb 67.14、BiC 66.11、DER++ 61.06——零 buffer 的 L2P <b>83.83</b> 仍高过这一组所有 rehearsal 方法。';
const COPY_CIFAR50 =
  '每类 50 张 buffer：DER++ <b>83.94</b>、ER 82.53、Co2L 82.49——DER++ 已经超过零 buffer 的 L2P <b>83.83</b>，这正是「outperforms <b>almost all</b> rehearsal-based methods」；L2P-R 86.31 更高，上界 90.85。';
const COPY_CORE50 =
  '零 buffer 的 L2P <b>78.33</b>，输给带 50/class buffer 的 ER <b>80.10</b>、DER++ 79.70、Co2L 79.75、BiC 79.28、L2P-R 81.07——但仍高过 GDumb 74.92；rehearsal 方法之间「perform quite closely（<b>except GDumb</b>）」。';
const COPY_GAUSS0 =
  'Gaussian CIFAR-100 的零 buffer 组：L2P <b>88.34</b>，同组 EWC 只有 63.04；带 50/class buffer 的 L2P-R 88.92 与它几乎持平。';
const COPY_GAUSS50 =
  '每类 50 张 buffer：L2P-R <b>88.92</b>、DER++ 85.24、ER 82.63、GDumb 81.67——L2P-R 是这组最高，比零 buffer 的 L2P 88.34 只高 0.58。';

function toneColor(t: Tone): string {
  if (t === 'good') return LP.success;
  if (t === 'bad') return LP.failure;
  return LP.guide;
}

function toneClass(t: Tone): string {
  if (t === 'good') return 'good';
  if (t === 'bad') return 'bad';
  return '';
}

function posOf(value: number): number {
  const t = clamp((value - VALUE_LO) / (VALUE_HI - VALUE_LO), 0, 1);
  return lerp(TRACK_X0, TRACK_X1, t);
}

function findDs(id: string): DsDef {
  return DATASETS.filter((d) => d.id === id)[0] ?? DATASETS[0];
}

function findGroup(ds: DsDef, id: string): GroupDef {
  return ds.groups.filter((g) => g.id === id)[0] ?? ds.groups[0];
}

function copyFor(dsId: string, groupId: string): string {
  if (dsId === 'cifar100' && groupId === '0') return COPY_CIFAR0;
  if (dsId === 'cifar100' && groupId === '10') return COPY_CIFAR10;
  if (dsId === 'cifar100' && groupId === '50') return COPY_CIFAR50;
  if (dsId === 'core50') return COPY_CORE50;
  if (dsId === 'gaussian' && groupId === '0') return COPY_GAUSS0;
  if (dsId === 'gaussian' && groupId === '50') return COPY_GAUSS50;
  return '';
}

interface RunState {
  ds: string;
  group: string;
  started: boolean;
}

export const ResultRace: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const isAna = moduleId === 'ana';
  const W = isAna ? W_ANA : W_NORMAL;
  const H = isAna ? H_ANA : H_NORMAL;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stRef = useRef<RunState>({ ds: 'cifar100', group: '0', started: false });
  const progRef = useRef<number[]>([]);
  const runRef = useRef(-1);
  const anaRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [st, setSt] = useState<RunState>({ ds: 'cifar100', group: '0', started: false });
  const [note, setNote] = useState<{ text: string; cls: string }>({
    text: COPY_START,
    cls: '',
  });

  // 分组切换后，反馈立刻改写；论文明说的三种结果各自有原句。
  useEffect(() => {
    if (isAna) return;
    const copy = copyFor(st.ds, st.group);
    if (!st.started) {
      setNote({ text: COPY_START, cls: '' });
      return;
    }
    if (copy) {
      setNote({ text: copy, cls: st.ds === 'core50' ? 'bad' : st.group === '50' ? '' : 'good' });
    }
  }, [st.ds, st.group, st.started, isAna]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    let last = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      const s = stRef.current;

      if (isAna) {
        // 类比卡：两盘菜并排跑到终点、停在成比例的位置。
        anaRef.current += dt;
        const cyc = anaRef.current % 4.4;
        const t = clamp((cyc - 0.5) / 1.7, 0, 1);
        const e = easeOutCubic(t);
        drawField(ctx, 0, 0, W, H);
        // 跑道（台面）
        drawKitchenCounter(ctx, 20, 104, W - 40);
        // 两盘菜在赛跑
        const dishColors = [LP.failure, LP.success];
        const dishNames = ['旧法', 'L2P'];
        for (let i = 0; i < 2; i += 1) {
          const end = lerp(150, W - 108, i === 0 ? 0.82 : 0.94);
          const x = lerp(28, end, e);
          const y = 34 + i * 46;
          drawPlate(ctx, x + 30, y + 20, 28, { withFood: true, foodColor: dishColors[i] });
          drawLabel(ctx, dishNames[i], x + 30, y + 5, {
            size: 11,
            color: dishColors[i],
            align: 'center',
            weight: 600,
          });
        }
        // 终点：大厨帽
        ctx.save();
        ctx.fillStyle = LP.bg;
        ctx.strokeStyle = LP.accent;
        ctx.lineWidth = 2;
        const hatX = W - 70;
        const hatY = 40;
        // 帽子
        ctx.beginPath();
        ctx.ellipse(hatX, hatY + 10, 25, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        lpRoundRect(ctx, hatX - 22, hatY + 20, 44, 12, 3, true, true);
        ctx.restore();
        drawLabel(ctx, '终点', W - 63, 130, { size: 12, color: LP.muted, align: 'center' });
      } else {
        const ds = findDs(s.ds);
        const group = findGroup(ds, s.group);
        const rows = group.methods;

        if (progRef.current.length !== rows.length) {
          progRef.current = rows.map(() => (s.started ? 0 : 1));
        }

        drawField(ctx, 0, 0, W, H);

        // 跑道：桌面横线 + 刻度
        const trackLen = TRACK_X1 - TRACK_X0;
        const nRows = rows.length;
        drawLink(ctx, TRACK_X0, 72, TRACK_X1, 72, { color: LP.dark, width: 2 });
        for (let i = 0; i <= 4; i += 1) {
          const v = VALUE_LO + ((VALUE_HI - VALUE_LO) * i) / 4;
          const x = posOf(v);
          drawLink(ctx, x, 64, x, 78, { color: LP.axis, width: 2 });
          drawLabel(ctx, String(Math.round(v)), x, 56, {
            size: 12,
            color: LP.muted,
            align: 'center',
          });
        }

        for (let i = 0; i < rows.length; i += 1) {
          const m = rows[i];
          const y = ROW_TOP + i * clamp((H - 150) / Math.max(1, nRows), 26, 62);
          const color = toneColor(m.tone);
          const x0 = TRACK_X0 - 132;

          drawLabel(ctx, m.name, x0, y + 22, {
            size: 14,
            color: m.isPaper ? LP.ink : catColor(m.cat),
            weight: m.isPaper ? 600 : 500,
          });

          // 轨道
          drawLink(ctx, TRACK_X0 - 18, y + 18, TRACK_X1, y + 18, {
            color: LP.light,
            width: 2,
          });

          const target = posOf(m.value);
          const prog = progRef.current[i] ?? 1;
          const x = lerp(TRACK_X0 - 84, target, clamp(prog, 0, 1));
          drawSheet(ctx, x, y, 80, 36, {
            tone: m.tone,
            result: m.value.toFixed(2),
            lines: 3,
          });
          if (m.isPaper) {
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.strokeRect(x - 3, y - 3, 86, 42);
            ctx.restore();
          }
        }

        // 终点读数：全部落位后，把上界标在跑道右端
        if (s.started && progRef.current.length) {
          const done = progRef.current.every((p) => p >= 0.999);
          if (done) {
            drawLabel(ctx, '上界 ' + group.upper.toFixed(2), TRACK_X1, 44, {
              size: 12,
              color: LP.muted,
              align: 'right',
            });
          }
        }

        // 图例只列这一场真的出现过的类别，色块与行名/绿框一一对应。
        const cats: Cat[] = [];
        for (let i = 0; i < rows.length; i += 1) {
          if (cats.indexOf(rows[i].cat) < 0) cats.push(rows[i].cat);
        }
        drawLegend(
          ctx,
          cats.slice(0, 3).map((c) => ({ label: CAT_LABEL[c], color: catColor(c) })),
          40,
          H - 22
        );
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      last = 0;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    start(); // 强制启动，避免 IntersectionObserver 检测失败
    return () => {
      stop();
      disconnect();
    };
  }, [isAna, W, H]);

  // 起跑：把每个方法的进度从 0 动画到 1。
  useEffect(() => {
    if (isAna || !st.started) return;
    const ds = findDs(st.ds);
    const group = findGroup(ds, st.group);
    progRef.current = group.methods.map(() => 0);
    const t0 = performance.now();
    const dur = 1500;
    if (runRef.current >= 0) window.clearInterval(runRef.current);
    runRef.current = window.setInterval(() => {
      const t = clamp((performance.now() - t0) / dur, 0, 1);
      progRef.current = group.methods.map((_, i) =>
        easeOutCubic(clamp(t * 1.15 - i * 0.06, 0, 1))
      );
      if (t >= 1) {
        window.clearInterval(runRef.current);
        runRef.current = -1;
      }
    }, 16);
    return () => {
      if (runRef.current >= 0) window.clearInterval(runRef.current);
      runRef.current = -1;
    };
  }, [st.started, st.ds, st.group, isAna]);

  const pick = (patch: Partial<RunState>) => {
    const next: RunState = { ...stRef.current, ...patch };
    // 换数据集或换分组 → 清空成绩表；换分组时若该分组不存在则退回第一个可用分组。
    if (patch.ds && patch.ds !== stRef.current.ds) {
      next.group = findDs(patch.ds).groups[0].id;
      next.started = false;
    }
    if (patch.group && patch.group !== stRef.current.group) {
      next.started = false;
    }
    stRef.current = next;
    setSt(next);
    progRef.current = [];
  };

  if (isAna) {
    return (
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    );
  }

  const ds = findDs(st.ds);
  const group = findGroup(ds, st.group);
  const rows = group.methods;
  const sorted = rows.slice().sort((a, b) => b.value - a.value);
  const top = sorted[0];
  const paper = rows.filter((m) => m.isPaper && m.name === 'L2P')[0];
  const paperRank = paper ? sorted.indexOf(paper) + 1 : 0;

  return (
    <div>
      <div className="ctrl">
        <label>数据集</label>
        <div className="chip-row" style={{ margin: 0 }}>
          {DATASETS.map((d) => (
            <button
              key={d.id}
              type="button"
              className={d.id === st.ds ? 'chip selected' : 'chip'}
              onClick={() => pick({ ds: d.id })}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ctrl">
        <label>buffer 分组</label>
        <div className="chip-row" style={{ margin: 0 }}>
          {ds.groups.map((g) => (
            <button
              key={g.id}
              type="button"
              className={g.id === st.group ? 'chip selected' : 'chip'}
              onClick={() => pick({ group: g.id })}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ctrl">
        <label>赛程</label>
        <button
          type="button"
          className="tiny"
          disabled={st.started}
          onClick={() => {
            stRef.current = { ...stRef.current, started: true };
            setSt(stRef.current);
          }}
        >
          开始
        </button>
        <button
          type="button"
          className="tiny ghost"
          onClick={() => {
            stRef.current = { ...stRef.current, started: false };
            setSt(stRef.current);
            progRef.current = [];
          }}
        >
          重置
        </button>
      </div>

      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />

      <div className="metrics">
        <div className="metric">
          <div className="l">设定</div>
          <div className="v">{ds.setting}</div>
        </div>
        <div className="metric">
          <div className="l">这场第一名</div>
          <div className="v">{top.name}</div>
        </div>
        <div className="metric">
          <div className="l">L2P 名次</div>
          <div className="v">
            {paperRank ? paperRank : '—'}
            {paper ? ` / ${rows.length}` : ''}
          </div>
        </div>
      </div>

      <div className="step-desc">
        同一批方法、同一条跑道，换一个 buffer 分组或换一个数据集，名次就翻面。跑道右端是<b>上界</b>
        {group.upper.toFixed(2)}——它不是方法，是把所有任务的数据混在一起监督微调的天花板。
        <br />
        {group.label}：{st.started ? '成绩表已经按真实数字落位。' : '按「开始」让菜跑起来。'}
      </div>

      <div className={`feedback ${note.cls}`} dangerouslySetInnerHTML={{ __html: note.text }} />

      <div style={{ width: '100%', textAlign: 'left', marginTop: 6 }}>
        {rows.map((m) => (
          <div key={m.name} className="step-desc" style={{ textAlign: 'left' }}>
            <b>{m.name}</b>
            {m.cat === 'paper' ? '（本文方法）' : `（${CAT_LABEL[m.cat]}）`}：平均准确率{' '}
            <b>{m.value.toFixed(2)}</b>
            {m.forget !== undefined ? `，Forgetting ${m.forget.toFixed(2)}` : ''}
            {m.name === 'L2P' && ds.id === 'core50'
              ? '——零 buffer，落在带 50/class buffer 的 ER 80.10、DER++ 79.70、Co2L 79.75、BiC 79.28、L2P-R 81.07 后面；唯一赢过的是 GDumb 74.92（except GDumb）。'
              : ''}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultRace;
