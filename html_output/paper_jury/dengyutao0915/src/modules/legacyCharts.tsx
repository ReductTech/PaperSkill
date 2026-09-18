// ============================================================
// 旧版交互图表模块移入（自 paperjury_tutorial/src/modules 下
// Ch2Trilemma / Ch4ResponsibilityMatch / Ch10MainResults /
// Ch10CostQuality / Ch10DomainSlice / Ch10EditSafety 移入）
// 保留原交互：三滑块联动、点击匹配、指标切换、悬停散点、分领域对比、安全漏斗
// ============================================================
import { useState, useEffect, useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  MAIN_RESULTS, METRIC_META, DOMAIN_SLICES, EDIT_SAFETY, COST_QUALITY,
} from './legacyData';
import type { MetricKey } from './legacyData';
import { drawGroupedBarChart, drawScatterChart } from './legacyChart';

// 圆角矩形辅助（本地定义，供雷达标签/徽章使用）
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// ===================== 旧版 Ch2：三维权衡滑块雷达 =====================
export const TrilemmaSliders: React.FC<WidgetProps> = () => {
  const [precision, setPrecision] = useState(70);
  const [recall, setRecall] = useState(60);
  const [cost, setCost] = useState(40);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = Math.min(rect.width, 460);
    const H = 380;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.height = `${H}px`;
    canvas.style.width = `${W}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H / 2 + 10;
    const R = Math.min(W * 0.48, 180); // 雷达占满画布，减少空白
    const pAngle = -Math.PI / 2;
    const rAngle = Math.PI / 6;
    const cAngle = Math.PI / 2 + Math.PI / 6;
    const pts = [
      { label: '精确度', angle: pAngle, value: precision / 100, color: '#16a34a' },
      { label: '召回率', angle: rAngle, value: recall / 100, color: '#2563eb' },
      { label: '成本↓', angle: cAngle, value: cost / 100, color: '#dc2626' },
    ];

    // 柔和背景
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#fbfdf9');
    grad.addColorStop(1, '#f5f8f0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 轴线：中心到三顶点（增强结构感）
    ctx.strokeStyle = 'rgba(39,68,110,0.28)';
    ctx.lineWidth = 1.5;
    pts.forEach((p) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + R * Math.cos(p.angle), cy + R * Math.sin(p.angle));
      ctx.stroke();
    });

    // 外参考三角（清晰可见的边框）
    ctx.strokeStyle = '#27446e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = cx + R * Math.cos(p.angle);
      const y = cy + R * Math.sin(p.angle);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();

    // 内部填充三角（当前参数）——加深填充与描边
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = cx + R * p.value * Math.cos(p.angle);
      const y = cy + R * p.value * Math.sin(p.angle);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(37, 99, 235, 0.3)';
    ctx.fill();
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 顶点圆点（加大，白描边）
    pts.forEach((p) => {
      const x = cx + R * p.value * Math.cos(p.angle);
      const y = cy + R * p.value * Math.sin(p.angle);
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    });

    // 顶点标签：白底徽章 + 彩色文字（越界则翻转到三角形内侧）
    pts.forEach((p) => {
      const x = cx + (R + 30) * Math.cos(p.angle);
      const y = cy + (R + 30) * Math.sin(p.angle);
      const label = `${p.label} ${Math.round(p.value * 100)}%`;
      ctx.font = 'bold 15px system-ui, sans-serif';
      const tw = ctx.measureText(label).width;
      const th = 20;
      let lx = x;
      let ly = y;
      // 上下或左右越界：翻转到内侧
      if (y < th / 2 + 4 || y > H - th / 2 - 4 || x < tw / 2 + 6 || x > W - tw / 2 - 6) {
        lx = cx + (R - 28) * Math.cos(p.angle);
        ly = cy + (R - 28) * Math.sin(p.angle);
      }
      ctx.fillStyle = 'rgba(255,255,255,0.96)';
      roundRect(ctx, lx - tw / 2 - 7, ly - th / 2 - 2, tw + 14, th + 4, 7);
      ctx.fill();
      ctx.strokeStyle = 'rgba(39,68,110,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = p.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, lx, ly + 1);
    });

    // 中心提示（白底小徽章）
    const cLabel = '参数权衡空间';
    ctx.font = '13px system-ui, sans-serif';
    const cw2 = ctx.measureText(cLabel).width;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    roundRect(ctx, cx - cw2 / 2 - 6, cy - 10, cw2 + 12, 20, 10);
    ctx.fill();
    ctx.fillStyle = '#68778f';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cLabel, cx, cy + 1);
  }, [precision, recall, cost]);

  const sliderRow = (
    label: string,
    value: number,
    onChange: (v: number) => void,
    color: string,
    hint: string
  ) => (
    <div className="slider-row" key={label}>
      <span className="slider-label">
        {label}
        <span className="slider-value" style={{ color }}>{value}%</span>
      </span>
      <input
        type="range" min={0} max={100} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ accentColor: color }}
      />
      <span className="slider-hint">{hint}</span>
    </div>
  );

  const balance = precision + recall;
  const verdict =
    balance >= 160 ? '高精度高召回：最均衡的审稿策略，接近 PaperJury 的设计取向'
    : balance >= 130 ? '中等权衡：质量与覆盖的平衡区，成本可控'
    : '低覆盖：容易漏掉问题，单轮审稿的典型局限';

  return (
    <div className="legacy-module legacy-module-sliders">
      <canvas ref={canvasRef} className="module-canvas" style={{ width: '100%' }} />
      <div className="slider-group">
        {sliderRow('审稿精确度', precision, setPrecision, '#16a34a', '找出真问题，少误报')}
        {sliderRow('问题召回率', recall, setRecall, '#2563eb', '覆盖所有问题，不遗漏')}
        {sliderRow('运行成本', cost, setCost, '#dc2626', 'token 与时间开销')}
      </div>
      <div className="module-feedback info">{verdict}</div>
    </div>
  );
};

// ===================== 旧版 Ch4：职责匹配（点击式） =====================
const DUTY_ITEMS = [
  { id: 'd1', text: '路由问题进入审判还是 polish', duty: '确定性' as const },
  { id: 'd2', text: '阅读全文并论证指控不成立', duty: '语义' as const },
  { id: 'd3', text: '计算 quorum 与 majority 裁决', duty: '确定性' as const },
  { id: 'd4', text: '对局部证据独立投票', duty: '语义' as const },
  { id: 'd5', text: '检查补丁是否破坏锚点与引用', duty: '确定性' as const },
  { id: 'd6', text: '起草修复性编辑补丁', duty: '语义' as const },
  { id: 'd7', text: '记录问题状态到持久账本', duty: '确定性' as const },
  { id: 'd8', text: '判断指控是否有理', duty: '语义' as const },
];

export const ResponsibilityMatch: React.FC<WidgetProps> = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, '确定性' | '语义'>>({});
  const [showResult, setShowResult] = useState(false);

  const correctCount = DUTY_ITEMS.filter((i) => placed[i.id] === i.duty).length;
  const allPlaced = Object.keys(placed).length === DUTY_ITEMS.length;
  const allCorrect = showResult && correctCount === DUTY_ITEMS.length;

  const place = (duty: '确定性' | '语义') => {
    if (!selected || showResult) return;
    setPlaced((prev) => ({ ...prev, [selected]: duty }));
    setSelected(null);
  };

  const reset = () => {
    setPlaced({});
    setSelected(null);
    setShowResult(false);
  };

  return (
    <div className="legacy-module">
      <div className="module-hint">
        点击左侧操作，再点击下方"确定性编排"或"语义推理"区域，判断每项职责由谁负责。
      </div>
      <div className="duty-layout">
        <div className="duty-items">
          {DUTY_ITEMS.map((item) => (
            <div
              key={item.id}
              className={`duty-item ${selected === item.id ? 'selected' : ''} ${placed[item.id] ? 'placed' : ''}`}
              onClick={() => {
                if (showResult) return;
                setSelected(placed[item.id] ? null : item.id);
              }}
            >
              <span className="duty-item-text">{item.text}</span>
              {placed[item.id] && (
                <span className={`duty-item-tag ${placed[item.id] === '确定性' ? 'det' : 'sem'}`}>
                  → {placed[item.id]}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="duty-zones">
          <div
            className={`duty-zone det ${selected ? 'hoverable' : ''} ${showResult ? 'show' : ''}`}
            onClick={() => place('确定性')}
          >
            <div className="duty-zone-title">⚙️ 确定性编排</div>
            <div className="duty-zone-desc">跨运行一致 · 可审计 · 无偏见</div>
            <div className="duty-zone-items">
              {DUTY_ITEMS.filter((i) => placed[i.id] === '确定性').map((i) => (
                <span key={i.id} className={`duty-zone-chip ${showResult && i.duty !== '确定性' ? 'wrong' : ''}`}>
                  {i.text}
                </span>
              ))}
            </div>
          </div>
          <div
            className={`duty-zone sem ${selected ? 'hoverable' : ''} ${showResult ? 'show' : ''}`}
            onClick={() => place('语义')}
          >
            <div className="duty-zone-title">🧠 语义推理</div>
            <div className="duty-zone-desc">阅读判断 · 论证辩护 · 草拟补丁</div>
            <div className="duty-zone-items">
              {DUTY_ITEMS.filter((i) => placed[i.id] === '语义').map((i) => (
                <span key={i.id} className={`duty-zone-chip ${showResult && i.duty !== '语义' ? 'wrong' : ''}`}>
                  {i.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="duty-controls">
        {!showResult && (
          <button
            className="quiz-submit-btn"
            disabled={!allPlaced}
            onClick={() => setShowResult(true)}
          >
            提交匹配（{Object.keys(placed).length}/{DUTY_ITEMS.length}）
          </button>
        )}
        <button className="quiz-submit-btn ghost" onClick={reset}>重置</button>
      </div>
      <div className={`module-feedback ${showResult ? (allCorrect ? 'success' : 'danger') : 'info'}`}>
        {showResult
          ? allCorrect
            ? '✓ 全部正确！确定性编排与语义推理的分工完全符合论文架构。'
            : `✗ 正确 ${correctCount}/${DUTY_ITEMS.length} 项。核心原则：安全关键决策（路由/裁决/守卫/账本）归确定性，阅读/判断/论证/起草归语义。`
          : `已分配 ${Object.keys(placed).length}/${DUTY_ITEMS.length} 项操作`}
      </div>
    </div>
  );
};

// ===================== 旧版 Ch10：主结果指标切换图表 =====================
export const MainResults: React.FC<WidgetProps> = () => {
  const [metric, setMetric] = useState<MetricKey>('F1');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const meta = METRIC_META.find((m) => m.key === metric)!;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawGroupedBarChart(canvas, {
      labels: MAIN_RESULTS.map((r) => r.methodShort),
      series: [{
        name: meta.label,
        values: MAIN_RESULTS.map((r) => {
          const v = r[metric];
          return typeof v === 'number' ? v : null;
        }),
        color: '#2563eb',
      }],
    }, { height: 300, yLabel: meta.label });
  }, [metric, meta]);

  return (
    <div className="legacy-module data-module">
      <div className="module-hint">
        切换指标查看 5 种方法的对比。PaperJury 在质量指标上领先，在成本（时间）上接近 Judge loop 且远低于 Naive generator。
      </div>
      <div className="metric-tabs">
        {METRIC_META.map((m) => (
          <button
            key={m.key}
            className={`metric-tab ${metric === m.key ? 'active' : ''}`}
            onClick={() => setMetric(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="metric-desc">{meta.desc}</div>
      <canvas ref={canvasRef} className="module-canvas" style={{ width: '100%' }} />
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>方法</th>
              <th>F1 ↑</th>
              <th>P_verified ↑</th>
              <th>R ↑</th>
              <th>Acc_v ↑</th>
              <th>Acc_r ↑</th>
              <th>ESVR ↓</th>
              <th>轮数 K</th>
              <th>时间 W(h)</th>
            </tr>
          </thead>
          <tbody>
            {MAIN_RESULTS.map((r) => (
              <tr key={r.method} className={r.isOurs ? 'row-best' : ''}>
                <td>{r.method}</td>
                <td>{r.F1 ?? '—'}</td>
                <td>{r.P_verified ?? '—'}</td>
                <td>{r.R ?? '—'}</td>
                <td>{r.Acc_v ?? '—'}</td>
                <td>{r.Acc_r ?? '—'}</td>
                <td>{r.ESVR ?? '—'}</td>
                <td>{r.K_mean !== null ? `${r.K_mean}${r.K_capHit ? ` (${r.K_capHit}触顶)` : ''}` : '—'}</td>
                <td>{r.W_hours ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="module-feedback info">
        主结果（12 篇 held-out 论文）：PaperJury F1=0.656 显著优于 Judge loop 0.519；ESVR=0.025 为基线 0.110 的约 1/4.4。
      </div>
    </div>
  );
};

// ===================== 旧版 Ch10：成本-质量散点 =====================
export const CostQualityScatter: React.FC<WidgetProps> = () => {
  const [hovered, setHovered] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawScatterChart(canvas, COST_QUALITY, { height: 320, xLabel: '每篇论文时间 (小时, 对数轴)', yLabel: 'F1 质量分数' });
  }, []);

  const handleMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const padL = 56, padR = 24, padT = 20, padB = 48;
    const W = rect.width;
    const H = 320;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const xs = COST_QUALITY.map((d) => d.x);
    const ys = COST_QUALITY.map((d) => d.y);
    const xMin = Math.min(...xs) * 0.8, xMax = Math.max(...xs) * 1.1;
    const yMin = Math.min(...ys) * 0.9, yMax = Math.max(...ys) * 1.08;
    let found = -1;
    COST_QUALITY.forEach((d, i) => {
      const px = padL + ((d.x - xMin) / (xMax - xMin)) * chartW;
      const py = padT + chartH - ((d.y - yMin) / (yMax - yMin)) * chartH;
      if (Math.abs(px - x) < 22 && Math.abs(py - y) < 22) found = i;
    });
    if (hoverRef.current !== found) {
      hoverRef.current = found;
      setHovered(found);
    }
  };

  const active = hovered !== null ? COST_QUALITY[hovered] : null;

  return (
    <div className="legacy-module data-module">
      <div className="module-hint">
        悬停数据点查看各系统的质量-成本位置。右上角（高质量 + 低耗时）是最优区。
      </div>
      <canvas
        ref={canvasRef}
        className="module-canvas"
        style={{ width: '100%', cursor: 'crosshair' }}
        onMouseMove={handleMove}
        onMouseLeave={() => { hoverRef.current = null; setHovered(null); }}
      />
      <div className="scatter-detail">
        {active ? (
          <>
            <span className="scatter-detail-name" style={{ color: active.color }}>{active.name}</span>
            <span>质量 F1 = <strong>{active.y.toFixed(3)}</strong></span>
            <span>成本 ≈ <strong>{active.x.toFixed(1)}h</strong></span>
            {active.highlight && <span className="scatter-detail-tag">最优平衡点</span>}
          </>
        ) : (
          <span className="scatter-detail-empty">将鼠标移到数据点上查看详情</span>
        )}
      </div>
      <div className="module-feedback info">
        PaperJury 以接近 Judge loop 的成本（2.47h vs 2.06h）获得显著更高的质量（F1 0.656 vs 0.519），
        Naive generator 虽然召回最高但成本是 8.37h，性价比最差。
      </div>
    </div>
  );
};

// ===================== 旧版 Ch10：分领域对比 =====================
type DomainMetricKey = 'F1' | 'P_verified' | 'R' | 'Acc_v' | 'Acc_r' | 'ESVR';
const DOMAIN_METRICS: DomainMetricKey[] = ['F1', 'P_verified', 'R', 'Acc_v', 'Acc_r', 'ESVR'];

export const DomainSlice: React.FC<WidgetProps> = () => {
  const [metric, setMetric] = useState<DomainMetricKey>('F1');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const meta = METRIC_META.find((m) => m.key === metric)!;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawGroupedBarChart(canvas, {
      labels: DOMAIN_SLICES.map((d) => d.domainZh),
      series: [{
        name: meta.label,
        values: DOMAIN_SLICES.map((d) => d[metric]),
        color: '#16a34a',
      }],
    }, { height: 280, yLabel: meta.label });
  }, [metric, meta]);

  return (
    <div className="legacy-module data-module">
      <div className="module-hint">
        按领域切片查看 PaperJury 的表现：三个领域的所有指标都与汇总值相差 0.03 以内，说明效果跨领域稳定。
      </div>
      <div className="metric-tabs">
        {DOMAIN_METRICS.map((k) => (
          <button
            key={k}
            className={`metric-tab ${metric === k ? 'active' : ''}`}
            onClick={() => setMetric(k)}
          >
            {METRIC_META.find((m) => m.key === k)!.label}
          </button>
        ))}
      </div>
      <canvas ref={canvasRef} className="module-canvas" style={{ width: '100%' }} />
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>领域</th>
              <th>P_verified ↑</th>
              <th>R ↑</th>
              <th>F1 ↑</th>
              <th>Acc_v ↑</th>
              <th>Acc_r ↑</th>
              <th>ESVR ↓</th>
            </tr>
          </thead>
          <tbody>
            {DOMAIN_SLICES.map((d) => (
              <tr key={d.domain}>
                <td>{d.domainZh} ({d.domain})</td>
                <td>{d.P_verified.toFixed(3)}</td>
                <td>{d.R.toFixed(3)}</td>
                <td>{d.F1.toFixed(3)}</td>
                <td>{d.Acc_v.toFixed(3)}</td>
                <td>{d.Acc_r.toFixed(3)}</td>
                <td>{d.ESVR.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ===================== 旧版 Ch8：编辑安全漏斗 =====================
export const EditSafetyFunnel: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<'bar' | 'table'>('bar');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (mode !== 'bar') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width;
    const H = 320;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const padL = 120, padR = 40, padT = 30, padB = 50;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const rows = EDIT_SAFETY.map((r) => ({ label: r.methodShort, value: r.appliedPerPaper ?? 0, unsafe: r.unsafe ?? 0, esvr: r.ESVR ?? 0, isOurs: r.methodShort === 'PaperJury' }));
    const maxVal = Math.max(...rows.map((r) => r.value)) * 1.15;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // 网格
    ctx.strokeStyle = '#e5e7eb';
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const y = padT + chartH - (i / 4) * chartH;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + chartW, y); ctx.stroke();
      ctx.fillText(Math.round((i / 4) * maxVal).toString(), padL - 8, y);
    }

    // 漏斗条（已应用编辑 + 危险编辑）
    rows.forEach((r, i) => {
      const barY = padT + i * (chartH / rows.length) + 10;
      const barH = chartH / rows.length - 26;
      const barW = (r.value / maxVal) * chartW;
      ctx.fillStyle = r.isOurs ? '#2563eb' : '#9ca3af';
      ctx.globalAlpha = 0.85;
      ctx.fillRect(padL, barY, barW, barH);
      ctx.globalAlpha = 1;
      ctx.fillStyle = r.isOurs ? '#2563eb' : '#6b7280';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(r.label, padL - 16, barY + barH / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#1f2937';
      ctx.fillText(`${r.value} 次`, padL + barW + 6, barY + barH / 2);

      // 危险编辑比例（红色小段）
      if (r.unsafe > 0) {
        const unsafeW = (r.unsafe / maxVal) * chartW;
        ctx.fillStyle = '#dc2626';
        ctx.globalAlpha = 0.9;
        ctx.fillRect(padL, barY, unsafeW, 6);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#dc2626';
        ctx.font = '10px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`危险 ${r.unsafe}`, padL + unsafeW + 4, barY + 3);
      }
    });

    ctx.fillStyle = '#6b7280';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('应用编辑总数（每篇论文均值），红色段为危险编辑', padL + chartW / 2, H - 18);
  }, [mode]);

  return (
    <div className="legacy-module data-module">
      <div className="module-hint">
        PaperJury 的编辑安全：应用编辑更少（161 次）、危险编辑最少（4 次 vs Judge loop 19 次）、
        违规率最低（ESVR 0.025 vs 0.110）。守卫链挡下 17% 的提议补丁。
      </div>
      <div className="metric-tabs">
        <button className={`metric-tab ${mode === 'bar' ? 'active' : ''}`} onClick={() => setMode('bar')}>📊 漏斗图</button>
        <button className={`metric-tab ${mode === 'table' ? 'active' : ''}`} onClick={() => setMode('table')}>📋 数据表</button>
      </div>
      {mode === 'bar' && <canvas ref={canvasRef} className="module-canvas" style={{ width: '100%' }} />}
      {mode === 'table' && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>方法</th>
                <th>应用编辑/篇</th>
                <th>VF 终局</th>
                <th>提议补丁</th>
                <th>覆盖</th>
                <th>守卫拦截</th>
                <th>危险编辑</th>
                <th>ESVR ↓</th>
              </tr>
            </thead>
            <tbody>
              {EDIT_SAFETY.map((r) => (
                <tr key={r.method} className={r.methodShort === 'PaperJury' ? 'row-best' : ''}>
                  <td>{r.method}</td>
                  <td>{r.appliedPerPaper}</td>
                  <td>{r.VF_terminals ?? '—'}</td>
                  <td>{r.proposed ?? '—'}</td>
                  <td>{r.coverage ?? '—'}</td>
                  <td>{r.guardBlock !== null ? `${(r.guardBlock * 100).toFixed(1)}%` : '—'}</td>
                  <td>{r.unsafe ?? '—'}</td>
                  <td>{r.ESVR ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
