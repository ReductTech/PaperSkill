import { useEffect, useState } from "react";
import {
  BACKBONES, HEADS, LIBERO_COMBO,
  type BackboneId, type HeadId,
} from "../data/content";
import Src from "../components/Src";
import { usePrefersReducedMotion } from "../lib/hooks";

export default function LegoBuilder() {
  const [backbone, setBackbone] = useState<BackboneId>("qwen");
  const [head, setHead] = useState<HeadId>("oft");
  const [touched, setTouched] = useState(false);
  const reduced = usePrefersReducedMotion();
  const bb = BACKBONES.find((x) => x.id === backbone)!;
  const hd = HEADS.find((x) => x.id === head)!;
  const score = LIBERO_COMBO[backbone][head];

  /* 无需点击：进场后自动轮插四种动作头；用户一挑就停 */
  useEffect(() => {
    if (touched || reduced) return;
    const t = setInterval(() => {
      setHead((h) => {
        const i = HEADS.findIndex((x) => x.id === h);
        return HEADS[(i + 1) % HEADS.length].id;
      });
    }, 3000);
    return () => clearInterval(t);
  }, [touched, reduced]);

  return (
    <div className="lego-builder">
      <div className="lego-trays">
        <div className="panel" style={{ ["--kcolor" as string]: "var(--blue)" }}>
          <div className="tray-label"><span className="n">1</span> 挑一块骨干（负责看懂世界）</div>
          <div className="pick-row">
            {BACKBONES.map((b) => (
              <button
                key={b.id}
                className={`pick ${backbone === b.id ? "on" : ""}`}
                style={{ ["--pc" as string]: b.color }}
                onClick={() => { setTouched(true); setBackbone(b.id); }}
              >
                <div className="pname"><span className="sw" /> {b.name}</div>
                <div className="psub">{b.kind} · {b.sub}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="panel" style={{ ["--kcolor" as string]: "var(--red)" }}>
          <div className="tray-label"><span className="n">2</span> {touched ? "挑一个动作头（负责输出动作）" : "动作头自动轮插中 · 点任意一块接管"}</div>
          <div className="pick-row">
            {HEADS.map((h) => (
              <button
                key={h.id}
                className={`pick ${head === h.id ? "on" : ""}`}
                style={{ ["--pc" as string]: h.color }}
                onClick={() => { setTouched(true); setHead(h.id); }}
              >
                <div className="pname"><span className="sw" /> {h.name.replace("StarVLA-", "")}</div>
                <div className="psub">{h.family}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lego-stage">
        <div className="stage-io">
          输入：<b>原始图像 + 语言指令</b>（和真实机器人看到的一模一样）
        </div>
        <div className="stage-wire" />
        <div className="stage-stack">
          <div
            key={backbone}
            className="stage-brick pop"
            style={{ ["--bc" as string]: bb.color }}
          >
            {bb.name} <small>{bb.kind}</small>
          </div>
          <div className="stage-plug">▲ 统一表示契约 · hidden states ▼</div>
          <div
            key={head}
            className="stage-brick pop"
            style={{ ["--bc" as string]: hd.color, width: "min(340px, 72vw)", height: 62 }}
          >
            {hd.name} <small>{hd.family}</small>
          </div>
        </div>
        <div className="stage-wire" />
        <div className="stage-io">
          输出：<b>未来 8 步动作块</b> a<sub>t:t+8</sub>
        </div>
      </div>

      {score !== null ? (
        <div className="combo-report">
          <div className="combo-cell">
            <div className="k">
              LIBERO 平均成功率
              <Src where="论文 Table 2（Qwen3-VL-4B / Cosmos-Predict2-2B 两组，30K 步）" cmp="同一基准同一协议；与其它方法的对比见第 07 幕" />
            </div>
            <div className="v" style={{ color: hd.color }}>{score}<small>%</small></div>
            <div className="note">130 任务 · 每套件 500 次试验取均值</div>
          </div>
          <div className="combo-cell">
            <div className="k">
              训练成本
              <Src where="论文 Table 2（StarVLA 30K 步；OpenVLA-OFT 官方 175K 步）" cmp="同 LIBERO 基准；≈6× 为步数直接相除" />
            </div>
            <div className="v">30K<small> 步</small></div>
            <div className="note">对照 OpenVLA-OFT 官方报告用了 175K 步</div>
          </div>
          <div className="combo-cell">
            <div className="k">改动范围</div>
            <div className="v">0<small> 行基础设施代码</small></div>
            <div className="note">只换一块积木；数据、训练、评测管线原封不动</div>
          </div>
        </div>
      ) : (
        <div className="combo-none">
          论文没有报告「{bb.name} + {hd.name}」这个组合的成绩 ——
          这恰恰说明积木矩阵还没填满：装上统一接口后，每个空格都是一篇可以做的实验。
        </div>
      )}

      <div className="prose">
        关键在于：<strong>两块积木各自独立可换</strong>。想验证「世界模型骨干是不是更好」？把骨干从
        Qwen3-VL 换成 Cosmos-Predict2，其他一切保持不变 —— 变量被隔离了，比较才是公平的。
        这在碎片化时代几乎做不到。
      </div>
    </div>
  );
}
