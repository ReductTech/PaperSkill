import type { WidgetProps } from './registry';

const BASE = import.meta.env.BASE_URL; // './' —— 任意子路径部署都安全

// Colors shared across the four charts (baseline / BiViM / MambaPSA / best).
const C = {
  blue: '#27446e', green: '#228d5c', purple: '#7c3aed',
  orange: '#d97706', ink: '#21324a', muted: '#68778f', line: '#d7deea',
};

type MetricKey = 'params' | 'flops' | 'mAP' | 'fps';

interface ConfigRow {
  key: string;
  name: string;
  params: number;
  flops: number;
  mAP: number;
  fps: number | null;
}

const CONFIGS: ConfigRow[] = [
  { key: 'base', name: 'YOLO26-n', params: 2.4, flops: 5.8, mAP: 49.9, fps: 17 },
  { key: 'p3', name: '+P3 BiViM', params: 2.45, flops: 6.5, mAP: 48.4, fps: null },
  { key: 'p4', name: '+P4 BiViM', params: 2.63, flops: 6.2, mAP: 50.8, fps: null },
  { key: 'p5', name: '+P5 BiViM', params: 3.45, flops: 6.1, mAP: 50.6, fps: null },
  { key: 'mp', name: 'MambaPSA', params: 2.33, flops: 5.1, mAP: 49.8, fps: 20 },
];

const METRIC_LABEL: Record<MetricKey, string> = {
  params: '参数',
  flops: 'FLOPs',
  mAP: 'mAP50:95',
  fps: 'CPU FPS',
};
const METRIC_DIR: Record<MetricKey, string> = {
  params: '↓低好',
  flops: '↓低好',
  mAP: '↑高好',
  fps: '↑高好',
};
const SHORT_NAME: Record<string, string> = {
  base: 'YOLO26-n', p3: '+P3', p4: '+P4', p5: '+P5', mp: 'MambaPSA',
};

function rawVal(cfg: ConfigRow, m: MetricKey): number | null {
  if (m === 'params') return cfg.params;
  if (m === 'flops') return cfg.flops;
  if (m === 'mAP') return cfg.mAP;
  return cfg.fps;
}
function bestFor(m: MetricKey): number {
  const vals = CONFIGS.map((c) => rawVal(c, m)).filter((v): v is number => v != null);
  return m === 'mAP' || m === 'fps' ? Math.max(...vals) : Math.min(...vals);
}
function metricValue(cfg: ConfigRow, m: MetricKey): string {
  if (m === 'params') return String(parseFloat(cfg.params.toFixed(2))) + 'M';
  if (m === 'flops') return cfg.flops.toFixed(1) + 'G';
  if (m === 'mAP') return String(cfg.mAP);
  return cfg.fps == null ? '—' : String(cfg.fps);
}
function fillOf(cfg: ConfigRow): string {
  return cfg.key === 'mp' ? C.orange : cfg.key === 'base' ? C.blue : C.purple;
}

const W = 260, H = 172, AXIS_Y = 130, BAR_MAX = 92;
const SLOT = W / CONFIGS.length;
const BAR_W = 30;

function MetricChart({ metric }: { metric: MetricKey }) {
  const vals = CONFIGS.map((c) => rawVal(c, metric));
  const max = Math.max(...vals.filter((v): v is number => v != null));
  const best = bestFor(metric);
  return (
    <svg viewBox={`-6 0 ${W + 12} ${H}`} width="100%" height="auto" role="img" aria-label={METRIC_LABEL[metric]}>
      <line x1={6} y1={AXIS_Y} x2={W - 6} y2={AXIS_Y} stroke={C.line} strokeWidth={1.5} />
      {CONFIGS.map((cfg, i) => {
        const v = vals[i];
        const x = 6 + SLOT * i + SLOT / 2;
        const hasData = v != null;
        const isBest = hasData && v === best;
        const bh = hasData ? Math.max(2, (v / max) * BAR_MAX) : 0;
        return (
          <g key={cfg.key}>
            {hasData ? (
              <>
                <rect x={x - BAR_W / 2} y={AXIS_Y - bh} width={BAR_W} height={bh} rx={3} fill={fillOf(cfg)} />
                {isBest && (
                  <rect
                    x={x - BAR_W / 2 - 1.5}
                    y={AXIS_Y - bh - 1.5}
                    width={BAR_W + 3}
                    height={bh + 3}
                    rx={4.5}
                    fill="none"
                    stroke={C.green}
                    strokeWidth={1.6}
                  />
                )}
                <text x={x} y={AXIS_Y - bh - 7} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={isBest ? C.green : C.ink}>
                  {metricValue(cfg, metric)}
                </text>
              </>
            ) : (
              <text x={x} y={AXIS_Y - 8} textAnchor="middle" fontSize={11} fill={C.muted}>
                —
              </text>
            )}
            <text x={x} y={AXIS_Y + 14} textAnchor="middle" fontSize={8.5} fill={hasData ? C.muted : C.line}>
              {SHORT_NAME[cfg.key]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function LegendDot({ color }: { color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: 3,
        marginRight: 5,
        background: color,
        verticalAlign: 'middle',
      }}
    />
  );
}

export const Ch10M1: React.FC<WidgetProps> = () => {
  const metrics: MetricKey[] = ['params', 'flops', 'mAP', 'fps'];
  return (
    <div>
      <div className="compare-row">
        {metrics.map((m) => (
          <div className="compare-col" key={m}>
            <div className="compare-label">
              {METRIC_LABEL[m]} · {METRIC_DIR[m]}
            </div>
            <MetricChart metric={m} />
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px 18px',
          fontSize: 12,
          color: '#68778f',
          margin: '2px 0 12px',
          justifyContent: 'center',
        }}
      >
        <span><LegendDot color="#27446e" />YOLO26-n 基线</span>
        <span><LegendDot color="#7c3aed" />BiViM 放置</span>
        <span><LegendDot color="#d97706" />MambaPSA</span>
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: 3,
              marginRight: 5,
              border: '1.6px solid #228d5c',
              verticalAlign: 'middle',
            }}
          />
          绿框 = 该指标最优
        </span>
      </div>
      <img
        src={`${BASE}images/table2-performance.svg`}
        alt="性能对比表：YOLO26-n、+P3/P4/P5 BiViM 与 MambaPSA 在参数、FLOPs、mAP50:95、CPU FPS 上的精确数值"
        style={{ width: '100%', maxWidth: 640, height: 'auto', display: 'block', margin: '0 auto' }}
      />
      <div style={{ fontSize: 13, color: '#68778f', marginTop: 4 }}>
        数据来自论文 Table 2（VOC 2007 test，单一种子）；括号内为相对 YOLO26-n 基线的变化，FLOPs 单位为 GFLOPs。CPU FPS 论文仅报告了基线与 MambaPSA 两项。
      </div>
    </div>
  );
};
