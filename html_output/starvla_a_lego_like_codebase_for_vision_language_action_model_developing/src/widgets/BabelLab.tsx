import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CAMPS, type Camp } from "../data/content";
import { usePrefersReducedMotion } from "../lib/hooks";

type Verdict = "idle" | "fail" | "ok";

/* 每对组合的失败原因（对应论文 §1：架构/系统/评测三层碎片化） */
const FAIL_REASON: Record<string, string> = {
  "openvla|pi0": "π0 输出的是连续流匹配动作，OpenVLA 的管线只认离散 token —— 数据格式、归一化统计、评测循环全都得跟着重写。",
  "groot|pi0": "GR00T 是「慢思考 + 快反射」双系统架构，π0 的单通路生成假设根本插不进这套骨架。",
  "groot|openvla": "OpenVLA 的预处理为自家骨干量身定制，GR00T 又自带一套评测协议 —— 两头都对不上。",
};

export default function BabelLab() {
  const [a, setA] = useState<Camp>(CAMPS[0]);
  const [b, setB] = useState<Camp>(CAMPS[1]);
  const [unified, setUnified] = useState(false);
  const [verdict, setVerdict] = useState<Verdict>("idle");
  const [round, setRound] = useState(0);
  const reduced = usePrefersReducedMotion();
  /* 自动演示用的 ref 镜像（定时器闭包需要最新值） */
  const unifiedRef = useRef(unified);
  unifiedRef.current = unified;
  const abRef = useRef<[Camp, Camp]>([a, b]);
  abRef.current = [a, b];
  const touchedRef = useRef(false);

  const tryConnect = () => {
    setVerdict("idle");
    setRound((r) => r + 1);
    // 让 shake 动画可重放
    requestAnimationFrame(() => {
      const [ca, cb] = abRef.current;
      setVerdict(unifiedRef.current || ca.id === cb.id ? "ok" : "fail");
    });
  };

  /* 无需点击：进场自动演一遍「拼不上 → 装统一接口 → 咔哒通电」；用户一碰就接管 */
  useEffect(() => {
    if (reduced) return;
    const ts = [
      window.setTimeout(() => { if (!touchedRef.current) tryConnect(); }, 1000),
      window.setTimeout(() => { if (!touchedRef.current) { setUnified(true); setVerdict("idle"); } }, 3600),
      window.setTimeout(() => { if (!touchedRef.current) tryConnect(); }, 4800),
    ];
    return () => ts.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const touch = () => { touchedRef.current = true; };

  // 齿形 = 接口形状：圆 / 方 / 菱形；统一接口后全部变圆
  const toothStyle = (c: Camp): CSSProperties => {
    if (unified || c.plug === "circle") return { borderRadius: "50%" };
    if (c.plug === "triangle") return { transform: "rotate(45deg)", borderRadius: "2px" };
    return { borderRadius: "2px" };
  };

  return (
    <div className="babel-grid">
      <div className="panel">
        <div className="panel-title" style={{ ["--kcolor" as string]: "var(--red)" }}>
          第一步 · 从两个阵营各挑一块积木
        </div>
        <div className="chip-row" style={{ marginBottom: 14 }}>
          {CAMPS.map((c) => (
            <button
              key={c.id}
              className={`chip ${a.id === c.id ? "on" : ""}`}
              style={{ ["--chipc" as string]: c.color }}
              onClick={() => { touch(); setA(c); setVerdict("idle"); }}
            >
              <span className="sw" /> A · {c.name}
            </button>
          ))}
        </div>
        <div className="chip-row" style={{ marginBottom: 18 }}>
          {CAMPS.map((c) => (
            <button
              key={c.id}
              className={`chip ${b.id === c.id ? "on" : ""}`}
              style={{ ["--chipc" as string]: c.color }}
              onClick={() => { touch(); setB(c); setVerdict("idle"); }}
            >
              <span className="sw" /> B · {c.name}
            </button>
          ))}
        </div>

        <div className="panel-title" style={{ ["--kcolor" as string]: "var(--green)" }}>
          第二步 · 或者，先给它们装上统一接口
        </div>
        <button
          className={`chip ${unified ? "on" : ""}`}
          style={{ ["--chipc" as string]: "var(--green)", marginBottom: 18 }}
          onClick={() => { touch(); setUnified(!unified); setVerdict("idle"); }}
        >
          {unified ? "✓ 已装上 StarVLA 统一接口" : "给所有阵营装上统一接口"}
        </button>

        <div>
          <button className="btn primary" onClick={() => { touch(); tryConnect(); }}>
            试着把 A 和 B 拼起来
          </button>
        </div>
      </div>

      <div className={`babel-arena ${verdict}`} key={round}>
        <div className="babel-pair">
          <div className="babel-half left" style={{ ["--halfc" as string]: a.color }}>
            {a.name}
            <small>{a.stack}</small>
            <span className="teeth">
              {[0, 1, 2].map((i) => (
                <i key={i} style={toothStyle(a)} />
              ))}
            </span>
          </div>
          <div className="babel-joint">
            {verdict === "ok" ? "✓" : verdict === "fail" ? "✕" : "?"}
          </div>
          <div className="babel-half right" style={{ ["--halfc" as string]: b.color }}>
            {b.name}
            <small>{b.stack}</small>
            <span className="teeth">
              {[0, 1, 2].map((i) => (
                <i key={i} style={toothStyle(b)} />
              ))}
            </span>
          </div>
        </div>
        <div className="babel-verdict">
          {verdict === "idle" && <span style={{ color: "var(--ink-faint)" }}>选好两块积木，点左边的按钮试试</span>}
          {verdict === "fail" && (
            <span className="bad">
              ✕ 拼不上：{FAIL_REASON[[a.id, b.id].sort().join("|")]}
              <br />现实中这意味着几周工程就这么没了。
            </span>
          )}
          {verdict === "ok" && unified && (
            <span className="good">
              咔哒。接口一旦统一，{a.name}和{b.name}立刻通电 —— 这正是 StarVLA 做的事。
            </span>
          )}
          {verdict === "ok" && !unified && (
            <span className="good">同一个阵营当然能拼上…… 但换个阵营试试？</span>
          )}
        </div>
      </div>
    </div>
  );
}
