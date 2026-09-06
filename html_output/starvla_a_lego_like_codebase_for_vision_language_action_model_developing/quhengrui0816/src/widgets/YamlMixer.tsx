import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "../lib/hooks";

/* 05B：配方不是脚本，是一行配置 —— 拨开关，实时生成训练 YAML
   字段名为教学示意（以仓库实际配置为准），机制对应论文 §5 的训练配方 */

interface Cfg {
  cotrain: boolean;  // 多模态共训
  mix: string;       // 数据配方
  freeze: boolean;   // 冻结骨干
}

const MIXES = [
  { id: "libero", yaml: "libero_130", label: "单基准 · LIBERO 130 任务" },
  { id: "oxe", yaml: "oxe_mixture", label: "跨本体混合 · OXE 多机型" },
  { id: "real", yaml: "custom_widowx", label: "真机自采 · WidowX 桌面" },
];

const PRESETS: Cfg[] = [
  { cotrain: false, mix: "libero", freeze: false },
  { cotrain: true, mix: "libero", freeze: false },
  { cotrain: true, mix: "oxe", freeze: false },
  { cotrain: true, mix: "real", freeze: true },
];

function buildYaml(c: Cfg): string {
  const mix = MIXES.find((m) => m.id === c.mix) ?? MIXES[0];
  return [
    "# 一台 StarVLA 的全部配方",
    "framework: qwenvl_oft        # 骨干 × 动作头，两块积木",
    "",
    "datasets:",
    "  vla_data:",
    `    data_mix: "${mix.yaml}"${mix.id === "oxe" ? "   # 跨本体混合：异构机器人数据一锅烩" : ""}`,
    "",
    "trainer:",
    "  bf16: true",
    `  freeze_backbone: ${c.freeze}     # ${c.freeze ? "骨干冻结，只练动作头" : "骨干也参与微调"}`,
    "  loss_scale:",
    `    vlm: ${c.cotrain ? "1.0" : "0.0"}              # ${c.cotrain ? "共训开：每个 step 混做视觉问答，防遗忘" : "共训关：只练动作（小心遗忘！）"}`,
    "  learning_rate:",
    "    backbone: 5e-6         # 分组学习率",
    "    action_head: 1e-4",
  ].join("\n");
}

export default function YamlMixer() {
  const [cfg, setCfg] = useState<Cfg>(PRESETS[2]);
  const [len, setLen] = useState(0);
  const [touched, setTouched] = useState(false);
  const reduced = usePrefersReducedMotion();
  const yaml = buildYaml(cfg);

  /* 打字机式写出 YAML */
  useEffect(() => {
    if (reduced) {
      setLen(yaml.length);
      return;
    }
    setLen(0);
    const t = setInterval(() => {
      setLen((l) => {
        if (l >= yaml.length) {
          clearInterval(t);
          return l;
        }
        return l + 4;
      });
    }, 16);
    return () => clearInterval(t);
  }, [yaml, reduced]);

  /* 无需点击：自动轮播几种典型配方；用户一碰开关就接管 */
  useEffect(() => {
    if (touched || reduced) return;
    let i = PRESETS.findIndex((p) => p.mix === cfg.mix);
    const t = setInterval(() => {
      i = (i + 1) % PRESETS.length;
      setCfg(PRESETS[i]);
    }, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [touched, reduced]);

  const patch = (p: Partial<Cfg>) => {
    setTouched(true);
    setCfg((c) => ({ ...c, ...p }));
  };

  return (
    <div className="yaml-mixer">
      <div className="yaml-controls panel" style={{ ["--kcolor" as string]: "var(--green)" }}>
        <div className="panel-title" style={{ ["--kcolor" as string]: "var(--green)" }}>
          {touched ? "配方调台 · 你在控制" : "配方调台 · 自动轮播中，点任意开关接管"}
        </div>

        <div className="yaml-row">
          <span className="yaml-k">多模态共训</span>
          <button
            className={`chip ${cfg.cotrain ? "on" : ""}`}
            style={{ ["--chipc" as string]: "var(--green)" }}
            onClick={() => patch({ cotrain: !cfg.cotrain })}
          >
            {cfg.cotrain ? "✓ 已开启 · loss_scale.vlm = 1.0" : "已关闭 · 只练动作"}
          </button>
        </div>

        <div className="yaml-row">
          <span className="yaml-k">数据配方</span>
          <div className="chip-row">
            {MIXES.map((m) => (
              <button
                key={m.id}
                className={`chip ${cfg.mix === m.id ? "on" : ""}`}
                style={{ ["--chipc" as string]: "var(--blue)" }}
                onClick={() => patch({ mix: m.id })}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="yaml-row">
          <span className="yaml-k">冻结骨干</span>
          <button
            className={`chip ${cfg.freeze ? "on" : ""}`}
            style={{ ["--chipc" as string]: "var(--purple)" }}
            onClick={() => patch({ freeze: !cfg.freeze })}
          >
            {cfg.freeze ? "✓ 已冻结 · 只练动作头" : "已解冻 · 全参数微调"}
          </button>
        </div>
      </div>

      <div className="yaml-out">
        <div className="yaml-out-head">
          <span>train_starvla.yaml</span>
          <span className="sim-badge">字段为教学示意 · 以仓库配置为准</span>
        </div>
        <pre className="yaml-pre">
          {yaml.slice(0, len)}
          {len < yaml.length && <span className="caret" />}
        </pre>
      </div>
    </div>
  );
}
