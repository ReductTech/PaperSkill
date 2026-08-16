import { useEffect, useMemo, useState } from "react";
import { HEADS, type HeadId } from "../data/content";
import { usePrefersReducedMotion } from "../lib/hooks";

/* 共享目标轨迹：8 步动作块的 2D 投影（所有头画同一条，方便对比） */
const WAYPOINTS: [number, number][] = [
  [24, 92], [96, 58], [168, 74], [244, 34], [318, 52], [394, 24], [468, 42], [540, 14],
];
const PATH_D =
  "M " + WAYPOINTS.map(([x, y]) => `${x} ${y}`).join(" L ");

/* 沿路径均匀采样 N 个目标点（给 π 的噪声粒子用） */
function samplePath(n: number): [number, number][] {
  const pts: [number, number][] = [];
  const segs = WAYPOINTS.length - 1;
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * segs;
    const s = Math.min(Math.floor(t), segs - 1);
    const f = t - s;
    const [x1, y1] = WAYPOINTS[s];
    const [x2, y2] = WAYPOINTS[s + 1];
    pts.push([x1 + (x2 - x1) * f, y1 + (y2 - y1) * f]);
  }
  return pts;
}

/* 确定性伪随机（种子=索引），保证每次重放一致 */
function prand(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const N_DOTS = 36;

/** π 的去噪粒子云：progress 0→1，粒子从随机噪声位置收拢到轨迹上 */
function DenoiseCloud({ progress, color }: { progress: number; color: string }) {
  const targets = useMemo(() => samplePath(N_DOTS), []);
  return (
    <svg viewBox="0 0 560 120" className="traj-svg" style={{ minHeight: 110 }}>
      {targets.map(([tx, ty], i) => {
        const nx = (prand(i) - 0.5) * 460 + 280;
        const ny = (prand(i + 1000) - 0.5) * 130 + 60;
        const x = nx + (tx - nx) * progress;
        const y = ny + (ty - ny) * progress;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={4.2}
            fill={color}
            opacity={0.25 + progress * 0.75}
          />
        );
      })}
    </svg>
  );
}

/** GR00T 系统 2 的打字机思考 */
const SYS2_TEXT = "系统 2 思考中：桌面上有一个红色方块 → 子目标：移动到方块上方 → 闭合夹爪 → 抬起……";

function useTypewriter(text: string, playKey: number, cps = 26) {
  const [len, setLen] = useState(0);
  useEffect(() => {
    setLen(0);
    const t = setInterval(() => {
      setLen((l) => {
        if (l >= text.length) {
          clearInterval(t);
          return l;
        }
        return l + 1;
      });
    }, 1000 / cps);
    return () => clearInterval(t);
  }, [text, playKey, cps]);
  return text.slice(0, len);
}

/** π 的去噪进度 0→1 */
function useDenoise(playKey: number, durationMs = 2600) {
  const [p, setP] = useState(0);
  useEffect(() => {
    setP(0);
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - t0) / durationMs, 1);
      setP(t);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playKey, durationMs]);
  return p;
}

const FAST_TOKENS = ["182", "907", "44", "1310", "268", "73", "994", "512"];

export default function HeadTheater() {
  const [head, setHead] = useState<HeadId>("pi");
  const [playKey, setPlayKey] = useState(0);
  const reduced = usePrefersReducedMotion();
  const info = HEADS.find((h) => h.id === head)!;

  /* 无需点击：进场后四种动作头轮流自动上演 */
  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => {
      setHead((h) => {
        const i = HEADS.findIndex((x) => x.id === h);
        return HEADS[(i + 1) % HEADS.length].id;
      });
      setPlayKey((k) => k + 1);
    }, 7200);
    return () => clearInterval(t);
  }, [reduced]);

  const denoise = useDenoise(playKey);
  const sys2 = useTypewriter(SYS2_TEXT, playKey);
  const sys2Done = sys2.length >= SYS2_TEXT.length;

  /* 轨迹绘制时机与速度，按头定制 */
  const trajSpec: Record<HeadId, { delay: string; dur: string }> = {
    fast: { delay: "3.6s", dur: "2.4s" },
    oft: { delay: "0.55s", dur: "0.9s" },
    pi: { delay: "2.9s", dur: "0.7s" },
    groot: { delay: "3.4s", dur: "0.8s" },
  };
  const spec = trajSpec[head];

  return (
    <div className="theater">
      <div className="theater-tabs">
        {HEADS.map((h) => (
          <button
            key={h.id}
            className={`head-tab ${head === h.id ? "on" : ""}`}
            style={{ ["--hc" as string]: h.color }}
            onClick={() => { setHead(h.id); setPlayKey((k) => k + 1); }}
          >
            <div className="hname"><span className="sw" />{h.name.replace("StarVLA-", "")}</div>
            <div className="hsub">{h.family}</div>
          </button>
        ))}
      </div>

      <div className="theater-stage">
        <div className="theater-prompt">
          同一个输入：<b>图像 + 「把红色方块拿起来」</b> → 看四种动作头怎么把它变成动作
        </div>

        <div className="theater-lanes" key={`${head}-${playKey}`}>
          <div className="lane">
            <div className="lane-label"><b>输入（都一样）</b>骨干输出的 hidden states</div>
            <div className="lane-body">
              <div className="tok-seq">
                {["h₁", "h₂", "h₃", "h₄", "h₅", "h₆"].map((t, i) => (
                  <span key={t} className="tok-chip" style={{ background: "var(--ink)", boxShadow: "0 3px 0 #0e1420", animationDelay: `${i * 0.07}s` }}>{t}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="lane" style={{ borderTop: `4px solid ${info.color}` }}>
            <div className="lane-label"><b style={{ color: info.color }}>{info.name}</b>{info.family}</div>
            <div className="lane-body" style={{ width: "100%" }}>
              {head === "fast" && (
                <div className="tok-seq">
                  {FAST_TOKENS.map((t, i) => (
                    <span key={i} className="tok-chip" style={{ animationDelay: `${0.4 + i * 0.38}s` }}>
                      a<sub>{i}</sub>={t}
                    </span>
                  ))}
                </div>
              )}
              {head === "oft" && (
                <div className="oft-grid">
                  {FAST_TOKENS.map((_, i) => (
                    <span key={i} className="oft-cell" style={{ animationDelay: "0.3s" }}>
                      a<sub>{i}</sub>
                    </span>
                  ))}
                </div>
              )}
              {head === "pi" && (
                <div className="denoise-wrap">
                  <DenoiseCloud progress={denoise} color="var(--c-pi)" />
                  <div className="denoise-bar"><i style={{ width: `${denoise * 100}%` }} /></div>
                  <div className="denoise-info">
                    <span>纯噪声</span>
                    <span>去噪进度 <b>{Math.round(denoise * 10)}/10</b> 步</span>
                    <span>平滑轨迹</span>
                  </div>
                </div>
              )}
              {head === "groot" && (
                <div style={{ display: "grid", gap: 10, width: "100%" }}>
                  <div className="sys2-text">
                    {sys2}
                    {!sys2Done && <span className="caret" />}
                  </div>
                  <div className="oft-grid">
                    {FAST_TOKENS.map((_, i) => (
                      <span
                        key={i}
                        className="oft-cell"
                        style={{ background: "var(--c-groot)", boxShadow: "0 3px 0 var(--green-deep)", animationDelay: sys2Done ? `${i * 0.06}s` : "999s" }}
                      >
                        a<sub>{i}</sub>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="traj-card">
            <div className="traj-title">输出：未来 8 步动作块 a_t:t+8（轨迹投影）</div>
            <svg viewBox="0 0 560 120" className="traj-svg" style={{ ["--hc" as string]: info.color }}>
              <path
                className="traj-path draw"
                d={PATH_D}
                style={{ ["--drawdelay" as string]: spec.delay, ["--drawdur" as string]: spec.dur }}
              />
              {WAYPOINTS.map(([x, y], i) => (
                <circle
                  key={i}
                  className="traj-dot show"
                  cx={x}
                  cy={y}
                  r={5}
                  style={{ animationDelay: `calc(${spec.delay} + ${spec.dur} * ${i / 7})` }}
                />
              ))}
            </svg>
          </div>
        </div>

        <div className="theater-caption" style={{ ["--hc" as string]: info.color }}>
          <span className="q">原理</span>
          <div>
            <b>{info.tagline}。</b>
            <span style={{ color: "var(--ink-soft)" }}> {info.stageHint}</span>
          </div>
        </div>

        <div className="theater-controls" style={{ gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn ghost" onClick={() => setPlayKey((k) => k + 1)}>↻ 再演一遍</button>
          <span className="sim-badge">自动轮播四种动作头 · 机制示意，非真实 rollout</span>
        </div>
      </div>

      <div className="head-compare">
        {HEADS.map((h) => (
          <div key={h.id} className="head-cell" style={{ ["--hc" as string]: h.color }}>
            <b>{h.name.replace("StarVLA-", "")}</b>
            {h.mechanism}
          </div>
        ))}
      </div>
    </div>
  );
}
