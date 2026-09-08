import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';

type ResultPanel = 'stability' | 'density' | 'timing' | 'limits';
type LimitKey = 'boundary' | 'propagation' | 'pressureParams';

const PANELS: Array<{ key: ResultPanel; label: string }> = [
  { key: 'stability', label: '稳定步长' },
  { key: 'density', label: '同预算密度' },
  { key: 'timing', label: '每步计时' },
  { key: 'limits', label: '已知局限' },
];

const FEEDBACK: Record<ResultPanel, string> = {
  stability: '在论文的兔子落水场景中，PBF 能使用 0.016 秒步长保持稳定；对照 PCISPH 在 0.0016 秒步长下每帧少于 10 个子步会不稳定。该结论仅限此实验配置。',
  density: '在每帧同为 40 次压力迭代的对照中，PCISPH 为 10 子步 × 4 次，PBF 为 4 子步 × 10 次；PBF 以更大时间步获得与 PCISPH 相近的密度压缩水平。',
  timing: 'GTX 680、16 ms 帧时间条件下，每步耗时为 Armadillo Splash 4.2 ms、Dam Break 4.3 ms、Bunny Drop 7.8 ms；粒子数和迭代数随场景不同，不能当作同条件排行榜。',
  limits: '论文报告三项边界：固体接触处可能粒子堆叠；粒子规模增大时 Jacobi 局部传播会使收敛变慢；人工压力参数与空间分辨率、时间步耦合。',
};

const LIMITS: Array<{ key: LimitKey; label: string; detail: string }> = [
  { key: 'boundary', label: '固体边界', detail: '粒子接触固体时可能出现边界堆叠。' },
  { key: 'propagation', label: 'Jacobi 传播', detail: '粒子规模增大时，局部信息传播会使收敛变慢。' },
  { key: 'pressureParams', label: '人工压力参数', detail: '参数与空间分辨率、时间步耦合，需要重新调节。' },
];

const C = {
  bg: '#f4f9ff',
  guide: '#0b4f9f',
  good: '#228d5c',
  bad: '#c43f52',
  user: '#d97706',
  aux: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
  panel: '#ffffff',
};

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, stroke: string, fill = C.panel, width = 2) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.strokeRect(x, y, w, h);
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.text, weight = 400, size = 13) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Segoe UI`;
  ctx.fillText(text, x, y);
}

export const PbfResults: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [panel, setPanel] = useState<ResultPanel>('stability');
  const [limitFocus, setLimitFocus] = useState<LimitKey>('boundary');
  const [protocolExpanded, setProtocolExpanded] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => {
      const ctx = setupCanvas(canvas, 560, 240);
      ctx.clearRect(0, 0, 560, 240);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, 560, 240);

      rect(ctx, 18, 16, 524, 42, C.line, '#ffffff');
      label(ctx, panel === 'stability' ? '兔子落水专用协议' : panel === 'density' ? '兔子落水｜同为 40 次压力迭代/帧' : panel === 'timing' ? 'NVIDIA GTX 680｜16 ms 帧时间' : '论文第 9 节报告的限制', 34, 42, C.guide, 700, 14);

      if (panel === 'stability') {
        label(ctx, 'PBF', 34, 91, C.good, 700, 14);
        label(ctx, '一步 Δt = 0.016 s', 122, 91, C.text, 700, 13);
        rect(ctx, 122, 106, 344, 26, C.good, '#e8f5ee', 3);
        label(ctx, '✓ 该实验配置下稳定', 284, 124, C.good, 700, 12);

        label(ctx, 'PCISPH', 34, 164, C.bad, 700, 14);
        label(ctx, '每个子步 Δt = 0.0016 s', 122, 164, C.text, 700, 13);
        for (let i = 0; i < 10; i += 1) {
          rect(ctx, 122 + i * 34, 178, 28, 24, i < 9 ? C.bad : C.guide, i < 9 ? '#fdecef' : '#eaf0f8', 1.5);
          label(ctx, String(i + 1), 132 + i * 34, 195, i < 9 ? C.bad : C.guide, 700, 10);
        }
        label(ctx, '< 10 子步/帧：不稳定', 122, 224, C.bad, 700, 12);
        label(ctx, '仅限该兔子落水实现', 405, 224, C.muted, 400, 11);
      } else if (panel === 'density') {
        const rows = [
          { name: 'PCISPH', split: '10 子步 × 4 次', color: C.guide, y: 83 },
          { name: 'PBF', split: '4 子步 × 10 次', color: C.good, y: 137 },
        ];
        rows.forEach((row) => {
          label(ctx, row.name, 34, row.y + 21, row.color, 700, 14);
          rect(ctx, 120, row.y, 170, 34, row.color, '#ffffff', 2);
          label(ctx, row.split, 142, row.y + 22, C.text, 700, 13);
          rect(ctx, 316, row.y, 88, 34, row.color, row.color === C.good ? '#e8f5ee' : '#eaf0f8', 3);
          label(ctx, '= 40', 340, row.y + 23, row.color, 700, 15);
        });
        ctx.strokeStyle = C.guide;
        ctx.fillStyle = 'rgba(39,68,110,0.10)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(472, 111, 52, 28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = C.good;
        ctx.fillStyle = 'rgba(34,141,92,0.10)';
        ctx.beginPath();
        ctx.ellipse(472, 137, 52, 28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        label(ctx, '密度压缩水平相近', 418, 128, C.text, 700, 12);
        label(ctx, '指标：平均/最大密度越接近静止密度越好', 34, 208, C.muted, 400, 12);
        label(ctx, '未补造 Figure 4 精确密度读数', 306, 225, C.muted, 400, 11);
      } else if (panel === 'timing') {
        const rows = [
          { name: 'Armadillo Splash', value: 4.2, y: 92 },
          { name: 'Dam Break', value: 4.3, y: 137 },
          { name: 'Bunny Drop', value: 7.8, y: 182 },
        ];
        const x0 = 174;
        const width = 330;
        ctx.strokeStyle = C.line;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x0, 72);
        ctx.lineTo(x0 + width, 72);
        ctx.stroke();
        for (let tick = 0; tick <= 8; tick += 2) {
          const x = x0 + (tick / 8) * width;
          ctx.beginPath();
          ctx.moveTo(x, 67);
          ctx.lineTo(x, 76);
          ctx.stroke();
          label(ctx, `${tick}`, x - 4, 61, C.muted, 400, 10);
        }
        label(ctx, 'ms/步', 512, 61, C.muted, 400, 10);
        rows.forEach((row) => {
          label(ctx, row.name, 26, row.y + 5, C.text, 700, 12);
          ctx.fillStyle = '#e5eaf1';
          ctx.fillRect(x0, row.y - 10, width, 20);
          ctx.fillStyle = C.guide;
          ctx.fillRect(x0, row.y - 10, (row.value / 8) * width, 20);
          label(ctx, `${row.value.toFixed(1)} ms`, x0 + (row.value / 8) * width - 48, row.y + 5, '#ffffff', 700, 11);
        });
        label(ctx, '不同场景的粒子数和迭代数不同，不是同负载排行榜', 118, 226, C.bad, 700, 11);
      } else {
        LIMITS.forEach((item, index) => {
          const x = 22 + index * 178;
          const selected = item.key === limitFocus;
          rect(ctx, x, 78, 158, 126, selected ? C.bad : C.line, selected ? '#fdecef' : '#ffffff', selected ? 3 : 2);
          label(ctx, `⚠ ${item.label}`, x + 14, 103, selected ? C.bad : C.text, 700, 13);
          if (item.key === 'boundary') {
            ctx.strokeStyle = C.text;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(x + 30, 177);
            ctx.lineTo(x + 128, 177);
            ctx.stroke();
            [0, 1, 2, 3, 4].forEach((n) => {
              ctx.fillStyle = C.bad;
              ctx.beginPath();
              ctx.arc(x + 49 + n * 16, 160 - (n % 2) * 14, 7, 0, Math.PI * 2);
              ctx.fill();
            });
            label(ctx, '接触固体时可能堆叠', x + 14, 128, C.muted, 400, 11);
          } else if (item.key === 'propagation') {
            for (let ring = 1; ring <= 3; ring += 1) {
              ctx.strokeStyle = ring === 1 ? C.aux : C.line;
              ctx.lineWidth = ring === 1 ? 3 : 2;
              ctx.beginPath();
              ctx.arc(x + 80, 162, ring * 18, 0, Math.PI * 2);
              ctx.stroke();
            }
            label(ctx, '局部传播随规模变慢', x + 14, 128, C.muted, 400, 11);
          } else {
            ctx.strokeStyle = C.user;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(x + 80, 164, 34, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + 80, 164);
            ctx.lineTo(x + 104, 144);
            ctx.stroke();
            label(ctx, '分辨率与 Δt 改变需重调', x + 12, 128, C.muted, 400, 11);
          }
        });
        label(ctx, LIMITS.find((item) => item.key === limitFocus)?.detail ?? '', 46, 226, C.bad, 700, 12);
      }

      canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, draw, () => {});
    return disconnect;
  }, [panel, limitFocus]);

  const selectPanel = (index: number) => setPanel(PANELS[Math.min(PANELS.length - 1, Math.max(0, index))].key);
  const panelIndex = PANELS.findIndex((item) => item.key === panel);

  const handleTabKeys = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      selectPanel((panelIndex + 1) % PANELS.length);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      selectPanel((panelIndex - 1 + PANELS.length) % PANELS.length);
    }
  };

  const feedbackClass = panel === 'limits' ? 'bad' : panel === 'stability' || panel === 'density' ? 'good' : '';

  return (
    <div>
      <div className="chip-row" role="tablist" aria-label="论文结果与限制" onKeyDown={handleTabKeys}>
        {PANELS.map((item) => (
          <button
            type="button"
            role="tab"
            aria-selected={panel === item.key}
            className={`chip ${panel === item.key ? 'selected' : ''}`}
            key={item.key}
            onClick={() => setPanel(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        width={560}
        height={240}
        role="img"
        aria-label={FEEDBACK[panel]}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      {panel === 'limits' && (
        <div className="chip-row" role="group" aria-label="聚焦一项论文局限">
          {LIMITS.map((item) => (
            <button
              type="button"
              className={`chip ${limitFocus === item.key ? 'selected' : ''}`}
              aria-pressed={limitFocus === item.key}
              key={item.key}
              onClick={() => setLimitFocus(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      <div className="ctrl">
        <label>
          <input type="checkbox" checked={protocolExpanded} onChange={(event) => setProtocolExpanded(event.currentTarget.checked)} />
          显示完整协议说明
        </label>
        <span className="val" style={{ minWidth: 130 }}>{PANELS[panelIndex].label}</span>
      </div>
      {protocolExpanded && (
        <div role="tabpanel" aria-label={`${PANELS[panelIndex].label}协议`}>
          {panel === 'stability' && (
            <table className="paper">
              <caption style={{ textAlign: 'left', padding: '8px 0' }}>兔子落水稳定性协议</caption>
              <thead><tr><th>方法</th><th>步长/子步</th><th>论文报告</th><th>外推边界</th></tr></thead>
              <tbody>
                <tr><td>PBF</td><td>一步，Δt=0.016 s</td><td>该配置下稳定</td><td>不是通用稳定阈值</td></tr>
                <tr><td>PCISPH</td><td>Δt=0.0016 s，至少 10 子步/帧</td><td>少于 10 子步时不稳定</td><td>仅限该场景与实现</td></tr>
              </tbody>
            </table>
          )}
          {panel === 'density' && (
            <table className="paper">
              <caption style={{ textAlign: 'left', padding: '8px 0' }}>兔子落水同预算密度对照</caption>
              <thead><tr><th>方法</th><th>子步 × 每子步迭代</th><th>总预算</th><th>指标方向</th></tr></thead>
              <tbody>
                <tr><td>PCISPH</td><td>10 × 4</td><td>40 次/帧</td><td rowSpan={2}>平均/最大密度越接近静止密度越好；论文报告压缩水平相近</td></tr>
                <tr><td>PBF</td><td>4 × 10</td><td>40 次/帧</td></tr>
              </tbody>
            </table>
          )}
          {panel === 'timing' && (
            <table className="paper">
              <caption style={{ textAlign: 'left', padding: '8px 0' }}>NVIDIA GTX 680，16 ms 帧时间条件下的每步耗时</caption>
              <thead><tr><th>场景</th><th>每步耗时</th><th>解释限制</th></tr></thead>
              <tbody>
                <tr><td>Armadillo Splash</td><td>4.2 ms</td><td>场景负载不同</td></tr>
                <tr><td>Dam Break</td><td>4.3 ms</td><td>粒子数与迭代数不同</td></tr>
                <tr><td>Bunny Drop</td><td>7.8 ms</td><td>不能作为同条件排行榜</td></tr>
              </tbody>
            </table>
          )}
          {panel === 'limits' && (
            <table className="paper">
              <caption style={{ textAlign: 'left', padding: '8px 0' }}>论文报告的三项限制</caption>
              <thead><tr><th>限制</th><th>发生条件</th><th>后果</th></tr></thead>
              <tbody>
                <tr><td>固体边界堆叠</td><td>粒子接触固体</td><td>边界处可能出现堆叠</td></tr>
                <tr><td>Jacobi 传播较慢</td><td>粒子规模增大</td><td>局部信息需要更多轮传播</td></tr>
                <tr><td>人工压力参数耦合</td><td>空间分辨率或时间步改变</td><td>参数需要重新调节</td></tr>
              </tbody>
            </table>
          )}
        </div>
      )}
      <div className={`feedback ${feedbackClass}`} aria-live="polite">
        {FEEDBACK[panel]}
      </div>
    </div>
  );
};
