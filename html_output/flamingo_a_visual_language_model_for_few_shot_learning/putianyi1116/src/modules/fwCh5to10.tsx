import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { useWidgetCanvas, C, box, label } from './fwKit';

const W = 1080;
const H = 300;

/* ---------------- 5.1 拼提示 ---------------- */

const PW = 1080;
const PH = 340;

export const FwPrompt: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [mode, setMode] = useState<'open' | 'close'>('open');
  const [swapped, setSwapped] = useState(false);
  const canvasRef = useWidgetCanvas(PW, PH, (ctx) => {
    box(ctx, 0, 0, PW, PH, C.field);
    const t = performance.now() / 1000;
    label(ctx, '提示序列（支持示例在前，查询在后）', 36, 38, 14, C.muted);

    const blocks = swapped
      ? [
          { k: '查询图像', v: '[图像] 这只动物站在哪里？', bad: true },
          { k: '示例 1', v: '[图像] 一只火烈鸟在浅水', bad: true },
          { k: '示例 2', v: '[图像] 一只柴犬在草地', bad: true },
        ]
      : [
          { k: '示例 1', v: '[图像] 一只火烈鸟在浅水', bad: false },
          { k: '示例 2', v: '[图像] 一只柴犬在草地', bad: false },
          { k: '查询图像', v: '[图像] 这只动物站在哪里？', bad: false },
        ];
    blocks.forEach((b, idx) => {
      const x = 36 + idx * 232;
      const isQuery = b.k === '查询图像';
      box(ctx, x, 56, 214, 62, isQuery ? '#e8f0e2' : '#ffffff', swapped ? C.red : isQuery ? C.green : C.border);
      label(ctx, b.k, x + 10, 78, 13, swapped ? C.red : C.muted);
      label(ctx, b.v.length > 15 ? b.v.slice(0, 15) + '…' : b.v, x + 10, 102, 12, C.ink);
      if (idx < 2) label(ctx, '→', x + 216, 92, 14, C.border);
    });
    label(ctx, '→', 732, 92, 16, C.border);

    const outX = 758;
    box(ctx, outX, 56, 286, 62, '#ffffff', C.blue);
    label(ctx, mode === 'open' ? '续写（beam search）' : '候选打分（对数似然）', outX + 12, 82, 13, C.blue);
    label(ctx, mode === 'open' ? '生成长句 → 解析答案' : '对 A–D 各打一分 → 取最高', outX + 12, 104, 12, C.muted);

    /* 输出区 */
    box(ctx, 36, 132, 1008, 148, '#ffffff', C.border);
    if (mode === 'open') {
      label(ctx, '开放式任务：beam search 逐字续写', 52, 158, 13, C.muted);
      const cands = ['它站在浅水里。', '它站在水里。', '它站在水边。'];
      cands.forEach((s, i) => {
        const appear = t * 1.2 > i;
        const y = 186 + i * 30;
        label(ctx, 'beam ' + (i + 1), 56, y + 14, 12, C.muted);
        if (appear) {
          const shown = s.slice(0, Math.max(0, Math.floor((t * 6) % 40) - i * 6));
          box(ctx, 126, y, 420, 24, i === 0 ? '#e8f0e2' : '#ffffff', i === 0 ? C.green : C.border);
          label(ctx, shown || '…', 136, y + 17, 13, i === 0 ? C.green : C.ink);
        }
      });
      label(ctx, '三条候选各自续写，取分最高的一条', 580, 210, 12, C.muted);
    } else {
      label(ctx, '封闭式任务：候选答案按似然排序', 52, 158, 13, C.muted);
      const opts = [
        { k: 'A 水里', w: 300, best: true },
        { k: 'B 树上', w: 120, best: false },
        { k: 'C 沙漠', w: 70, best: false },
        { k: 'D 雪地', w: 40, best: false },
      ];
      opts.forEach((o, i) => {
        const y = 176 + i * 24;
        label(ctx, o.k, 56, y + 14, 12, o.best ? C.green : C.muted);
        box(ctx, 150, y, o.w, 18, o.best ? C.green : '#cfd8e6', o.best ? C.green : C.border);
      });
      label(ctx, '最高似然 → 选 A（条形为示意，非论文数值）', 560, 268, 12, C.muted);
    }

    label(ctx, swapped ? '顺序错误：模型是自回归续写，查询之后才出现示例，示例不再起示范作用' : '训练时每条序列最多 5 张图，推理可到 32 对（L450–L451）', 36, 306, 13, swapped ? C.red : C.muted);
  });
  const fb = swapped
    ? { t: '顺序反了：模型只能看见左侧上下文，查询必须先有示例（L491–L494）。', c: 'bad' }
    : mode === 'open'
    ? { t: '开放式任务用 beam search 续写，答案是被生成出来的（L495）。', c: 'good' }
    : { t: '封闭式任务不改生成，而是对每个候选算对数似然并取最高（L579）。', c: 'good' };
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={PW} height={PH} />
      <div className="ctrl">
        <button className={'chip' + (mode === 'open' ? ' selected' : '')} onClick={() => setMode('open')}>
          开放式
        </button>
        <button className={'chip' + (mode === 'close' ? ' selected' : '')} onClick={() => setMode('close')}>
          封闭式
        </button>
        <button className={'chip' + (swapped ? ' selected' : '')} onClick={() => setSwapped(!swapped)}>
          {swapped ? '恢复正确顺序' : '交换示例与查询'}
        </button>
      </div>
      <div className={'feedback ' + fb.c}>{fb.t}</div>
    </div>
  );
};

/* ---------------- 6.1 掩码矩阵 ---------------- */

const MW = 1080;
const MH = 330;

const SEQ6 = [
  { k: '图 1', img: true },
  { k: '文本 A', img: false },
  { k: '图 2', img: true },
  { k: '文本 B', img: false },
  { k: '图 3', img: true },
  { k: '文本 C', img: false },
  { k: '图 4', img: true },
  { k: '文本 D', img: false },
];

export const FwMask: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [sel, setSel] = useState(2);
  const [allOpen, setAllOpen] = useState(false);
  const bx = (idx: number) => 40 + idx * 128;
  const canvasRef = useWidgetCanvas(MW, MH, (ctx) => {
    box(ctx, 0, 0, MW, MH, C.field);
    label(ctx, '交错序列（左为前，右为后）', 40, 34, 14, C.muted);

    SEQ6.forEach((b, idx) => {
      const isText = !b.img && Math.floor(idx / 2) === sel;
      box(ctx, bx(idx), 108, 110, 58, isText ? '#e8f0e2' : '#ffffff', isText ? C.green : b.img ? C.blue : C.border);
      label(ctx, b.k, bx(idx) + 10, 132, 14, isText ? C.green : C.ink);
      label(ctx, b.img ? '视觉 token' : '文本 token', bx(idx) + 10, 152, 11, C.muted);
    });

    const ti = 2 * sel + 1;
    const arc = (from: number, to: number, color: string, dashed: boolean, hint: string) => {
      const x1 = bx(from) + 55;
      const x2 = bx(to) + 55;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      if (dashed) ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(x1, 104);
      ctx.quadraticCurveTo((x1 + x2) / 2, 62, x2, 104);
      ctx.stroke();
      ctx.setLineDash([]);
      if (hint) label(ctx, hint, Math.min(x1, x2) + Math.abs(x1 - x2) / 2 - 14, 58, 11, color);
    };

    if (allOpen) {
      for (let j = 0; j < sel; j++) arc(ti, 2 * j, 'rgba(196,63,82,0.55)', false, '');
      for (let j = 0; j < sel; j++) label(ctx, '✗', bx(2 * j) + 95, 100, 12, C.red);
    }
    arc(ti, 2 * sel, C.green, false, '唯一可直连');

    label(ctx, '文本 ' + String.fromCharCode(65 + sel) + ' 的直接可见集 = { 图 ' + (sel + 1) + ' }', 40, 208, 15, C.green);
    if (allOpen) {
      label(ctx, '全开放后每个文本位置都能看到全部历史图像，训练与推理的分布随之错位', 40, 240, 14, C.red);
    } else {
      label(ctx, '更早图像的内容不经视觉直连，而是写入此前的文本表示，再经自注意力传递（L447–L448）', 40, 240, 14, C.muted);
    }
    label(ctx, '单图掩码比全开放更有效（L452–L453）', 40, 276, 13, C.muted);
  });
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={MW} height={MH} />
      <div className="ctrl">
        {[0, 1, 2, 3].map((r) => (
          <button key={r} className={'chip' + (r === sel ? ' selected' : '')} onClick={() => setSel(r)}>
            文本 {String.fromCharCode(65 + r)}
          </button>
        ))}
        <button className={'chip' + (allOpen ? ' selected' : '')} onClick={() => setAllOpen(!allOpen)}>
          {allOpen ? '恢复单图掩码' : '试试全部开放'}
        </button>
      </div>
      <div className={'feedback ' + (allOpen ? 'bad' : 'good')}>
        {allOpen
          ? '全开放时早期图像被大量无关位置读取，训练时最多 5 图、推理最多 32 对的落差也随之放大（L450–L453）。'
          : '每个文本位置只与紧邻其前的一张图直连，序列变长不改变依赖形态（L443–L448）。'}
      </div>
    </div>
  );
};

/* ---------------- 6.2 信息通道开关 ---------------- */

const CW = 1080;
const CH = 330;

export const FwChannel: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [textCh, setTextCh] = useState(true);
  const canvasRef = useWidgetCanvas(CW, CH, (ctx) => {
    box(ctx, 0, 0, CW, CH, C.field);
    const t = performance.now() / 1000;
    const blocks = [
      { k: '图 1', v: '火烈鸟', img: true },
      { k: '文本 A', v: '这是一只火烈鸟', img: false },
      { k: '图 2', v: '柴犬', img: true },
      { k: '文本 B', v: '这是一只柴犬', img: false },
      { k: '图 3', v: '？', img: true },
      { k: '文本 C', v: textCh ? '与图 1 同类' : '？无法判断', img: false },
    ];
    const bw = 140;
    const pitch = 172;
    const bx = (i: number) => 40 + i * pitch;
    blocks.forEach((b, i) => {
      const stranded = !textCh && (i === 1 || i === 3);
      const failed = !textCh && i === 5;
      box(ctx, bx(i), 120, bw, 60, b.img ? '#ffffff' : failed ? '#fdecee' : '#fbfbf8', b.img ? C.blue : failed ? C.red : C.border);
      label(ctx, b.k, bx(i) + 10, 144, 14, b.img ? C.blue : failed ? C.red : C.ink);
      label(ctx, b.v, bx(i) + 10, 166, 11, stranded ? C.muted : failed ? C.red : C.muted);
      if (stranded) {
        ctx.strokeStyle = C.muted;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bx(i) + 10, 162);
        ctx.lineTo(bx(i) + 10 + b.v.length * 11, 162);
        ctx.stroke();
        label(ctx, '滞留', bx(i) + 10, 178, 10, C.red);
      }
    });

    const geom = (from: number, to: number, up: boolean) => ({
      x1: bx(from) + bw / 2,
      x2: bx(to) + bw / 2,
      y: up ? 116 : 184,
      cy: up ? 74 : 226,
    });
    const qt = (g: { x1: number; x2: number; y: number; cy: number }, k: number) => {
      const cx = (g.x1 + g.x2) / 2;
      const u = 1 - k;
      return [
        u * u * g.x1 + 2 * u * k * cx + k * k * g.x2,
        u * u * g.y + 2 * u * k * g.cy + k * k * g.y,
      ] as [number, number];
    };
    const strokeArc = (
      g: { x1: number; x2: number; y: number; cy: number },
      t0: number,
      t1: number,
      color: string,
      dashed: boolean,
      head: boolean
    ) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      if (dashed) ctx.setLineDash([6, 5]);
      ctx.beginPath();
      for (let k = 0; k <= 24; k++) {
        const kk = t0 + ((t1 - t0) * k) / 24;
        const [px, py] = qt(g, kk);
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      if (head) {
        const [ex, ey] = qt(g, t1);
        const [bx2, by2] = qt(g, Math.max(0, t1 - 0.04));
        const ang = Math.atan2(ey - by2, ex - bx2);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 10 * Math.cos(ang - 0.45), ey - 10 * Math.sin(ang - 0.45));
        ctx.lineTo(ex - 10 * Math.cos(ang + 0.45), ey - 10 * Math.sin(ang + 0.45));
        ctx.closePath();
        ctx.fill();
      }
    };

    // 视觉直连（始终存在）
    const v1 = geom(0, 1, true);
    const v2 = geom(4, 5, true);
    strokeArc(v1, 0, 1, C.green, false, true);
    strokeArc(v2, 0, 1, C.green, false, true);
    label(ctx, '视觉直连', (v1.x1 + v1.x2) / 2 - 26, 62, 11, C.green);
    label(ctx, '视觉直连', (v2.x1 + v2.x2) / 2 - 26, 62, 11, C.green);

    // 文本通道
    const c1 = geom(1, 3, false);
    const c2 = geom(3, 5, false);
    if (textCh) {
      strokeArc(c1, 0, 1, C.orange, true, true);
      strokeArc(c2, 0, 1, C.orange, true, true);
      [c1, c2].forEach((g) => {
        for (let k = 0; k < 3; k++) {
          const ph = (t * 0.55 + k / 3) % 1;
          const [px, py] = qt(g, ph);
          ctx.fillStyle = C.orange;
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      label(ctx, '文本通道', (c1.x1 + c1.x2) / 2 - 28, 246, 11, C.orange);
      label(ctx, '文本通道', (c2.x1 + c2.x2) / 2 - 28, 246, 11, C.orange);
    } else {
      // 只画到断口，后半段留空；断口处画叉
      [c1, c2].forEach((g) => {
        strokeArc(g, 0, 0.4, C.red, true, false);
        const [gx, gy] = qt(g, 0.5);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(gx, gy, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(gx, gy, 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(gx - 7, gy - 7);
        ctx.lineTo(gx + 7, gy + 7);
        ctx.moveTo(gx + 7, gy - 7);
        ctx.lineTo(gx - 7, gy + 7);
        ctx.stroke();
        label(ctx, '断', gx - 7, gy + 34, 12, C.red);
        // 到达断口即熄灭的信号点
        const ph = (t * 0.55) % 1;
        if (ph < 0.38) {
          const [px, py] = qt(g, ph);
          ctx.fillStyle = C.red;
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    label(ctx, '绿线为视觉直连，可达的只有紧邻其前的那张图（L443–L446）', 40, 278, 13, C.muted);
    if (textCh) {
      label(ctx, '橙线为文本通道，图 1 的内容经文本 A、文本 B 传到文本 C，问题可答', 40, 306, 15, C.orange);
    } else {
      box(ctx, 40, 292, 640, 26, '#fdecee', C.red);
      label(ctx, '✗ 文本通道在两处断开，图 1 的内容传不到文本 C，问题无法回答', 52, 311, 14, C.red);
    }
  });
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={CW} height={CH} />
      <div className="ctrl">
        <button className={'chip' + (textCh ? ' selected' : '')} onClick={() => setTextCh(!textCh)}>
          {textCh ? '关闭文本通道' : '打开文本通道'}
        </button>
      </div>
      <div className={'feedback ' + (textCh ? 'good' : 'bad')}>
        {textCh
          ? '图 1 的内容已写进文本 A，后续位置经自注意力读到它，跨图问题因此可答（L447–L448）。'
          : '关掉文本通道后只剩图 3 的直连，图 1 的内容无处可查，问题答不了。'}
      </div>
    </div>
  );
};

/* ---------------- 7.1 网页改写器 ---------------- */

const WW = 1080;
const WH = 340;

type Chip = { t: string; kind: 'text' | 'img' | 'eoc' | 'miss'; err?: string };

const CANDS: { name: string; chips: Chip[]; note: string; ok: boolean }[] = [
  {
    name: '方案 1',
    ok: true,
    note: '每张图之前插 `<EOC>`，文末再补一个（L464–L466）。',
    chips: [
      { t: 'P1', kind: 'text' },
      { t: '<EOC>', kind: 'eoc' },
      { t: '<image>', kind: 'img' },
      { t: 'P2', kind: 'text' },
      { t: '<EOC>', kind: 'eoc' },
      { t: '<image>', kind: 'img' },
      { t: 'P3', kind: 'text' },
      { t: '<EOC>', kind: 'eoc' },
    ],
  },
  {
    name: '方案 2',
    ok: false,
    note: '顺序错：`<EOC>` 应在图像之前，现在跑到了图像之后。',
    chips: [
      { t: 'P1', kind: 'text' },
      { t: '<image>', kind: 'img', err: '位置错' },
      { t: '<EOC>', kind: 'eoc', err: '位置错' },
      { t: 'P2', kind: 'text' },
      { t: '<image>', kind: 'img', err: '位置错' },
      { t: '<EOC>', kind: 'eoc', err: '位置错' },
      { t: 'P3', kind: 'text' },
      { t: '<EOC>', kind: 'eoc' },
    ],
  },
  {
    name: '方案 3',
    ok: false,
    note: '漏插：每张图之前都要有一个 `<EOC>`，不能只在文末补。',
    chips: [
      { t: 'P1', kind: 'text' },
      { t: '缺 <EOC>', kind: 'miss', err: '漏插' },
      { t: '<image>', kind: 'img' },
      { t: 'P2', kind: 'text' },
      { t: '缺 <EOC>', kind: 'miss', err: '漏插' },
      { t: '<image>', kind: 'img' },
      { t: 'P3', kind: 'text' },
      { t: '<EOC>', kind: 'eoc' },
    ],
  },
];

export const FwWebpage: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [i, setI] = useState(0);
  const startRef = useRef(0);
  const canvasRef = useWidgetCanvas(WW, WH, (ctx) => {
    box(ctx, 0, 0, WW, WH, C.field);
    const t = performance.now() / 1000;
    const elapsed = t - startRef.current;
    const shown = Math.min(CANDS[i].chips.length, Math.floor(elapsed * 9) + 1);

    /* 左：网页 */
    label(ctx, '网页', 36, 40, 14, C.muted);
    box(ctx, 36, 54, 250, 232, '#ffffff', C.border);
    const page = [
      { t: '段落 P1', y: 74, img: false },
      { t: '图片 A', y: 100, img: true },
      { t: '段落 P2', y: 134, img: false },
      { t: '图片 B', y: 160, img: true },
      { t: '段落 P3', y: 194, img: false },
    ];
    page.forEach((p) => {
      if (p.img) {
        box(ctx, 52, p.y, 60, 24, '#e6edf5', C.blue);
        label(ctx, p.t, 60, p.y + 17, 11, C.blue);
      } else {
        box(ctx, 52, p.y, 200, 20, '#f1f1ee', C.border);
        label(ctx, p.t, 60, p.y + 15, 11, C.muted);
      }
    });
    label(ctx, '文档对象模型决定图的位置（L461–L463）', 36, 306, 11, C.muted);

    /* 右：改写结果 */
    label(ctx, '改写后的训练序列（逐块落位）', 310, 40, 14, C.muted);
    const chips = CANDS[i].chips;
    chips.forEach((c, idx) => {
      if (idx >= shown) return;
      const row = Math.floor(idx / 8);
      const col = idx % 8;
      const x = 310 + col * 92;
      const y = 70 + row * 54;
      const isMiss = c.kind === 'miss';
      const fill = c.err ? '#fdecee' : c.kind === 'img' ? '#e6edf5' : c.kind === 'eoc' ? '#fdf0e6' : '#ffffff';
      const stroke = c.err ? C.red : c.kind === 'img' ? C.blue : c.kind === 'eoc' ? C.orange : C.border;
      if (isMiss) {
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, 84, 40);
        ctx.setLineDash([]);
      } else {
        box(ctx, x, y, 84, 40, fill, stroke);
      }
      label(ctx, c.t, x + 42, y + 25, c.kind === 'text' ? 13 : 11, c.err ? C.red : C.ink, 'center');
      if (c.err) label(ctx, c.err, x + 42, y + 54, 10, C.red, 'center');
    });

    /* 结论 */
    const ok = CANDS[i].ok;
    box(ctx, 310, 196, 720, 34, ok ? '#e8f0e2' : '#fdecee', ok ? C.green : C.red);
    label(ctx, ok ? '规则正确：每图之前一个 <EOC>，文末再补一个' : CANDS[i].note.replace(/`/g, ''), 322, 219, 13, ok ? C.green : C.red);
    label(ctx, '配对数据集的规则不同，形如 <image> caption <EOC>（L474–L476）', 310, 258, 12, C.muted);
    label(ctx, '采样长度 256 个 token，保留前至多 5 张图（L466–L468）', 310, 282, 12, C.muted);
  });
  const c = CANDS[i];
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={WW} height={WH} />
      <div className="ctrl">
        {CANDS.map((x, idx) => (
          <button
            key={x.name}
            className={'chip' + (idx === i ? ' selected' : '')}
            onClick={() => {
              setI(idx);
              startRef.current = performance.now() / 1000;
            }}
          >
            {x.name}
          </button>
        ))}
      </div>
      <div className={'feedback ' + (c.ok ? 'good' : 'bad')}>{c.note}</div>
    </div>
  );
};

/* ---------------- 8.1 加权损失 ---------------- */

const LW = 1080;
const LH = 340;

const DATASETS = [
  { k: 'M3W 交错图文', nll: 1.8, color: C.blue, ev: 'L457–L458' },
  { k: '图文对 LTIP', nll: 1.2, color: C.green, ev: 'L469–L474' },
  { k: '视频对 VTP', nll: 1.5, color: C.orange, ev: 'L473–L474' },
];

export const FwLoss: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [w, setW] = useState<number[]>([0.5, 0.3, 0.2]);
  const contrib = DATASETS.map((d, i) => w[i] * d.nll);
  const total = contrib.reduce((a, b) => a + b, 0);
  const wSum = w.reduce((a, b) => a + b, 0);
  const maxC = Math.max(...contrib, 1e-6);
  const canvasRef = useWidgetCanvas(LW, LH, (ctx) => {
    box(ctx, 0, 0, LW, LH, C.field);
    label(ctx, '式 (2)：三类数据集按权重相加', 36, 34, 15, C.muted);

    DATASETS.forEach((d, i) => {
      const y = 56 + i * 62;
      label(ctx, d.k, 36, y + 20, 13, C.ink);
      // 权重轨道与填充
      box(ctx, 220, y + 4, 150, 18, '#e7ebf2', C.border);
      if (w[i] > 0.001) box(ctx, 220, y + 4, Math.max(3, 150 * w[i]), 18, d.color, d.color);
      label(ctx, 'λ' + (i + 1) + ' = ' + w[i].toFixed(2), 384, y + 18, 12, C.muted);
      label(ctx, 'NLL ' + d.nll.toFixed(1), 500, y + 18, 12, C.muted);
      // 贡献条
      box(ctx, 566, y + 4, 180, 18, '#e7ebf2', C.border);
      const cw = (contrib[i] / maxC) * 180;
      if (cw > 1) box(ctx, 566, y + 4, cw, 18, d.color, d.color);
      label(ctx, '贡献 ' + contrib[i].toFixed(2), 756, y + 18, 12, d.color);
    });

    /* 右栏：实际混合比例 */
    box(ctx, 900, 46, 152, 232, '#ffffff', C.border);
    label(ctx, '混合比例', 914, 70, 12, C.muted);
    const barY = 84;
    const barH = 150;
    let acc = 0;
    DATASETS.forEach((d, i) => {
      const share = wSum > 0 ? w[i] / wSum : 0;
      if (share <= 0) return;
      const h = share * barH;
      box(ctx, 914, barY + acc, 40, h, d.color, d.color);
      if (h > 16) label(ctx, Math.round(share * 100) + '%', 958, barY + acc + h / 2 + 5, 11, d.color);
      acc += h;
    });
    if (wSum === 0) label(ctx, '无权重', 914, barY + 60, 12, C.red);
    box(ctx, 914, barY, 40, barH, 'rgba(0,0,0,0)', C.border);

    /* 底部结论 */
    box(ctx, 20, 250, 860, 66, '#ffffff', C.border);
    label(ctx, '加权损失 = Σ λm · NLLm = ' + total.toFixed(2), 36, 280, 18, C.green);
    label(ctx, 'NLL 为示意值，论文未给出各数据集损失的绝对值；λ 才是可调量（L485–L486）', 36, 304, 11, C.muted);

    const zero = w.findIndex((v) => v === 0);
    if (zero >= 0) {
      box(ctx, 20, 250, 860, 66, '#fdecee', C.red);
      label(ctx, 'λ' + (zero + 1) + ' = 0，该数据集退出训练，混合比例随之失衡', 36, 280, 16, C.red);
      label(ctx, '去掉图文对会使 Overall 下降 9.8 分（L693–L694）', 36, 304, 11, C.red);
    }
  });
  const fb = w.includes(0)
    ? { t: '某个 λ 为 0 时，该数据集完全不参与训练；表 3 第 (i) 行显示去掉图文对会掉 9.8 分（L693–L694）。', c: 'bad' }
    : { t: '三类数据的权重共同决定训练配比，调节 λ 本身就是性能变量（L485–L486）。', c: '' };
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={LW} height={LH} />
      <div className="ctrl">
        {DATASETS.map((d, i) => (
          <label key={d.k}>
            λ{i + 1} <span className="val">{w[i].toFixed(2)}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(w[i] * 100)}
              onChange={(e) => {
                const next = [...w];
                next[i] = Number(e.target.value) / 100;
                setW(next);
              }}
            />
          </label>
        ))}
      </div>
      <div className={'feedback ' + fb.c}>{fb.t}</div>
    </div>
  );
};

/* ---------------- 9.1 分差换算器 ---------------- */

const DW = 1080;
const DH = 360;

const ROWS = [
  { k: '去掉 M3W', v: 53.4 },
  { k: '去掉图文对', v: 60.9 },
  { k: '从零训练 LM', v: 57.8 },
  { k: 'GRAFTING', v: 63.1 },
  { k: 'NFNet-F0', v: 62.7 },
  { k: '去掉 tanh 门控', v: 66.5 },
  { k: 'VANILLA XATTN', v: 66.9 },
  { k: '每 4 层插入', v: 68.8 },
];

export const FwDelta: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<'point' | 'rel' | null>(null);
  const base = 70.7;
  const lo = 50;
  const hi = 72;
  const v = ROWS[i].v;
  const delta = base - v;
  const rel = (delta / base) * 100;
  const xOf = (val: number) => 96 + ((val - lo) / (hi - lo)) * 560;
  const canvasRef = useWidgetCanvas(DW, DH, (ctx) => {
    box(ctx, 0, 0, DW, DH, C.field);
    label(ctx, 'Overall 刻度（50 至 72 分）', 36, 34, 14, C.muted);
    // 刻度
    for (let val = 50; val <= 72; val += 5) {
      const x = xOf(val);
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 46);
      ctx.lineTo(x, 300);
      ctx.stroke();
      label(ctx, String(val), x - 8, 318, 11, C.muted);
    }
    // 基准线
    const xb = xOf(base);
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xb, 40);
    ctx.lineTo(xb, 300);
    ctx.stroke();
    ctx.setLineDash([]);
    label(ctx, '基线 70.7', xb - 26, 30, 12, C.blue);

    ROWS.forEach((r, idx) => {
      const y = 56 + idx * 30;
      const on = idx === i;
      if (on) box(ctx, 30, y - 12, 620, 26, '#eef4e8', '#eef4e8');
      label(ctx, r.k, 36, y + 6, 12, on ? C.ink : C.muted);
      const x1 = xOf(r.v);
      box(ctx, x1, y - 8, Math.max(3, xb - x1), 14, on ? C.orange : '#cfd8e6', on ? C.orange : C.border);
      label(ctx, r.v.toFixed(1), x1 - 46, y + 6, 11, on ? C.orange : C.muted);
      if (on) {
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x1, y + 12);
        ctx.lineTo(x1, y + 20);
        ctx.lineTo(xb, y + 20);
        ctx.lineTo(xb, y + 12);
        ctx.stroke();
        label(ctx, delta.toFixed(1) + ' 分', (x1 + xb) / 2 - 22, y + 34, 12, C.red);
      }
    });

    /* 右栏：两种口径 */
    box(ctx, 700, 40, 356, 250, '#ffffff', C.border);
    label(ctx, '两种口径', 716, 64, 13, C.muted);
    label(ctx, '分差', 716, 96, 12, C.muted);
    label(ctx, delta.toFixed(1) + ' 分', 716, 132, 30, C.orange);
    label(ctx, '相对降幅', 716, 168, 12, C.muted);
    label(ctx, rel.toFixed(1) + '%', 716, 204, 30, C.purple);
    label(ctx, '论文取前者，单位「分」（L692–L727）', 716, 236, 11, C.muted);
    label(ctx, '你选：' + (pick === null ? '未选择' : pick === 'point' ? '分差' : '相对降幅'), 716, 268, 12, pick === null ? C.muted : pick === 'point' ? C.green : C.red);

    const msg =
      pick === null
        ? { t: '先在下方选择一种口径，再对照右侧两个数值。', c: C.muted }
        : pick === 'point'
        ? { t: '对：' + delta.toFixed(1) + ' 分与论文数字逐一吻合', c: C.green }
        : { t: '相对口径为 ' + rel.toFixed(1) + '%，与论文数字对不上', c: C.red };
    label(ctx, msg.t, 36, 348, 13, msg.c);
  });
  const fb =
    pick === null
      ? { t: '同一行数据在两种口径下差一个基数，先判断论文用的是哪一种。', c: '' }
      : pick === 'point'
      ? { t: '对：论文的百分号是 Overall 的分差，' + delta.toFixed(1) + ' 分与表 3 数字吻合。', c: 'good' }
      : { t: '相对口径算得 ' + rel.toFixed(1) + '%，与论文数字对不上——论文用的是分差。', c: 'bad' };
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={DW} height={DH} />
      <div className="ctrl">
        <select value={i} onChange={(e) => setI(Number(e.target.value))}>
          {ROWS.map((r, idx) => (
            <option key={r.k} value={idx}>
              {r.k}
            </option>
          ))}
        </select>
        <button className={'chip' + (pick === 'point' ? ' selected' : '')} onClick={() => setPick('point')}>
          论文用分差
        </button>
        <button className={'chip' + (pick === 'rel' ? ' selected' : '')} onClick={() => setPick('rel')}>
          论文用相对降幅
        </button>
      </div>
      <div className={'feedback ' + fb.c}>{fb.t}</div>
    </div>
  );
};

/* ---------------- 10.1 任务-方法匹配 ---------------- */

const TW = 1080;
const TH = 380;

const TASKS = [
  {
    q: '亿级图文检索：给定一句话，从一亿张图里找最匹配的 10 张',
    ans: 1,
    why: '检索是对比模型的强项，它直接为图文检索优化，分类是其特例（L773–L777）。',
  },
  {
    q: '只有 20 份标注的影像报告生成，需要输出自由文本',
    ans: 0,
    why: '低数据加生成任务，正落在少样本提示的区间；代价是幻觉风险（L768–L773）。',
  },
  {
    q: '30 万张标注图，只要最高分类精度',
    ans: 2,
    why: '数据充足时上下文学习不再划算，应转入微调（L781–L784）。',
  },
];

const METHODS = ['少样本提示', '对比模型', '微调'];

export const FwMatch: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [picks, setPicks] = useState<(number | null)[]>([null, null, null]);
  const rowY = (i: number) => 54 + i * 100;
  const chipX = (m: number) => 610 + m * 126;

  const canvasRef = useWidgetCanvas(TW, TH, (ctx) => {
    box(ctx, 0, 0, TW, TH, C.field);
    label(ctx, '点击右侧方法作答', 36, 34, 14, C.muted);
    const done = picks.filter((p) => p !== null).length;
    const right = picks.filter((p, i) => p === TASKS[i].ans).length;
    label(ctx, '已答 ' + done + ' / 3　答对 ' + right, 860, 34, 13, done === 3 ? C.green : C.muted);

    TASKS.forEach((task, i) => {
      const y = rowY(i);
      const p = picks[i];
      const ok = p === task.ans;
      box(ctx, 30, y, 1020, 90, '#ffffff', p === null ? C.border : ok ? C.green : C.red);
      label(ctx, String(i + 1) + '. ' + task.q, 48, y + 30, 14, C.ink);
      const status = p === null ? '未作答' : ok ? '✓ 正确' : '✗ 再想想';
      label(ctx, status, 48, y + 58, 12, p === null ? C.muted : ok ? C.green : C.red);
      if (p !== null) {
        label(ctx, (ok ? '' : '依据：') + task.why, 130, y + 58, 11, ok ? C.green : C.red);
      }

      METHODS.forEach((m, k) => {
        const x = chipX(k);
        const chosen = p === k;
        const fill = chosen ? (ok ? '#e8f0e2' : '#fdecee') : '#fbfbf8';
        const stroke = chosen ? (ok ? C.green : C.red) : C.border;
        box(ctx, x, y + 26, 118, 38, fill, stroke);
        label(ctx, m, x + 59, y + 50, 12, chosen ? (ok ? C.green : C.red) : C.ink, 'center');
      });
    });

    if (done === 3) {
      label(
        ctx,
        right === 3 ? '三个场景全部答对：三种适配方式各有适用区间' : '还有 ' + (3 - right) + ' 个场景判断有误，按上面的依据再看一次',
        36,
        366,
        13,
        right === 3 ? C.green : C.red
      );
    } else {
      label(ctx, '每个场景只能选一种方法，点错可立即改选', 36, 366, 12, C.muted);
    }
  });

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (TW / rect.width);
    const y = (e.clientY - rect.top) * (TH / rect.height);
    const row = Math.floor((y - 54) / 100);
    if (row < 0 || row > 2) return;
    if (y < rowY(row) || y > rowY(row) + 90) return;
    for (let m = 0; m < 3; m++) {
      if (x >= chipX(m) && x <= chipX(m) + 118 && y >= rowY(row) + 26 && y <= rowY(row) + 64) {
        const next = [...picks];
        next[row] = m;
        setPicks(next);
        return;
      }
    }
  };

  const done = picks.filter((p) => p !== null).length;
  const right = picks.filter((p, i) => p === TASKS[i].ans).length;
  const fb =
    done < 3
      ? { t: '直接点画布上的方法作答，每个场景只能选一个。', c: '' }
      : right === 3
      ? { t: '全部答对：检索归对比模型，低数据生成用提示，数据充足走微调（L773–L784）。', c: 'good' }
      : { t: '仍有 ' + (3 - right) + ' 个判断有误，画布上每条错误都附了依据行号。', c: 'bad' };
  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={TW}
        height={TH}
        style={{ cursor: 'pointer' }}
        onClick={handleClick}
      />
      <div className="ctrl">
        <button className="chip" onClick={() => setPicks([null, null, null])}>
          重新作答
        </button>
      </div>
      <div className={'feedback ' + fb.c}>{fb.t}</div>
    </div>
  );
};
