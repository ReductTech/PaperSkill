import { useEffect, useRef, useState } from "react";
import { BENCHES, HEADS, type HeadId } from "../data/content";
import { usePrefersReducedMotion } from "../lib/hooks";

type Phase = "idle" | "sending" | "processing" | "returning" | "done";

export default function ServerClient() {
  const [bench, setBench] = useState(BENCHES[0]);
  const [head, setHead] = useState<HeadId>("oft");
  const [phase, setPhase] = useState<Phase>("idle");
  const [log, setLog] = useState<string[]>(["等待请求……"]);
  const [swapNote, setSwapNote] = useState(false);
  const timers = useRef<number[]>([]);
  const reduced = usePrefersReducedMotion();
  /* ref 镜像：让自动循环的定时器闭包读到最新状态 */
  const benchRef = useRef(bench);
  benchRef.current = bench;

  const info = HEADS.find((h) => h.id === head)!;

  const later = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const rotateBench = useRef(true); // 用户手动选过考场后就不再自动轮换
  const run = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase("sending");
    later(950, () => setPhase("processing"));
    later(1650, () => setPhase("returning"));
    later(2600, () => {
      setPhase("done");
      setLog((l) => [
        ...l.slice(-2),
        `[${benchRef.current.name}] predict_action() → 8 步动作已执行 ✓`,
      ]);
      later(700, () => setPhase("idle"));
    });
  };

  /* 无需点击：进场后自动跑推理，每轮转一个考场 */
  useEffect(() => {
    if (reduced) return;
    let i = 0;
    const kick = window.setTimeout(run, 800);
    const t = setInterval(() => {
      if (rotateBench.current) {
        i += 1;
        setBench(BENCHES[i % BENCHES.length]);
      }
      run();
    }, 4600);
    return () => {
      clearTimeout(kick);
      clearInterval(t);
      timers.current.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const swapHead = (h: HeadId) => {
    setHead(h);
    setSwapNote(true);
    window.setTimeout(() => setSwapNote(false), 2600);
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <span className="sim-badge">自动循环演示中 · 机制示意，真实实现为 WebSocket + msgpack</span>
      </div>
      <div className="sc-grid">
        {/* 客户端 */}
        <div className="sc-box">
          <h4>评测客户端 · 官方代码原样跑</h4>
          <div className="bench-tabs">
            {BENCHES.map((b) => (
              <button
                key={b.id}
                className={`bench-tab ${bench.id === b.id ? "on" : ""} ${b.real ? "real" : ""}`}
                onClick={() => { rotateBench.current = false; setBench(b); }}
              >
                {b.name}
              </button>
            ))}
          </div>
          <div className="bench-view">
            <b>{bench.name} <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>（{bench.kind}）</span></b>
            <span>{bench.note}</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12 }}>
              打包 → {"{ image, lang }"} · msgpack
            </span>
          </div>
          <button className="btn primary" onClick={run} disabled={phase !== "idle" && phase !== "done"}>
            {phase === "idle" || phase === "done" ? "▶ 运行一步推理" : "推理中……"}
          </button>
        </div>

        {/* 网络 */}
        <div className="sc-wire">
          <span className={`packet ${phase === "sending" ? "send" : phase === "returning" ? "back" : ""}`}>
            {phase === "sending" && "{ image, lang }"}
            {phase === "returning" && "{ normalized_actions }"}
          </span>
        </div>

        {/* 服务器 */}
        <div className={`sc-box sc-server ${phase === "processing" ? "flash" : ""}`}>
          <h4>StarVLA 策略服务器 · GPU</h4>
          <div className="server-head" style={{ ["--hc" as string]: info.color }}>
            <span>{info.name}</span>
            <span className="gpu">from_pretrained()</span>
          </div>
          <div className="code-chip">
            <span className="kw">def</span> <span className="fn">predict_action</span>(obs):<br />
            &nbsp;&nbsp;<span className="kw">return</span> {"{ normalized_actions }"}
          </div>
          <div className="chip-row">
            {HEADS.map((h) => (
              <button
                key={h.id}
                className={`chip ${head === h.id ? "on" : ""}`}
                style={{ ["--chipc" as string]: h.color, padding: "6px 12px", fontSize: 13 }}
                onClick={() => swapHead(h.id)}
              >
                {h.name.replace("StarVLA-", "")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {swapNote && (
        <div className="sc-banner">
          ✓ 服务器端已换成 {info.name} —— 左边 {bench.name} 的评测代码：0 行改动
        </div>
      )}

      <div className="sc-log">
        {log.map((line, i) => (
          <div key={i} className={line.includes("✓") ? "ok" : ""}>{line}</div>
        ))}
        {phase === "sending" && <div className="io">→ msgpack 打包观测，WebSocket 发送……</div>}
        {phase === "processing" && <div className="io">⚙ 服务器 forward 中：骨干编码 → 动作头解码</div>}
        {phase === "returning" && <div className="io">← 动作块返回，客户端做反归一化并执行</div>}
      </div>
    </div>
  );
}
