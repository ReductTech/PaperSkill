import { mark as m, type FormulaDef } from "./Formula";

// The displayed notation follows each chapter's existing expression. The
// descriptions are scoped to that expression, so reused letters may differ.
export const policyFormula: FormulaDef = {
  html: `${m("π")} = (${m("πᴹ")}, ${m("πᶿ")})`,
  symbols: [
    { sym: "π", desc: "当前图像状态下的 ISP 决策策略。" },
    { sym: "πᴹ", desc: "离散分支：从可用 ISP 模块中选择下一步操作。" },
    { sym: "πᶿ", desc: "连续分支：预测所选模块对应的参数。" },
  ],
};
export const imageTransitionFormula: FormulaDef = {
  html: `${m("Iₜ₊₁")} = ${m("F")}(${m("Mₜ")}, ${m("Θₜ")})(${m("Iₜ")})`,
  symbols: [
    { sym: "Iₜ₊₁", desc: "本次 ISP 操作后得到的图像。" },
    { sym: "F", desc: "执行所选 ISP 模块及参数的图像变换。" },
    { sym: "Mₜ", desc: "第 t 步选择的 ISP 模块。" },
    { sym: "Θₜ", desc: "第 t 步为该模块预测的参数。" },
    { sym: "Iₜ", desc: "第 t 步输入到 ISP 模块的当前图像。" },
  ],
};
export const rewardFormula: FormulaDef = {
  html: `<span class="fx-line">${m("rₜ")} = ${m("D(sₜ)")} − ${m("D(sₜ₊₁)")}</span><span class="fx-line"><span class="fx-tag">真实训练还考虑惩罚：</span>${m("rₜ")} = ${m("D(sₜ)")} − ${m("D(sₜ₊₁)")} − ${m("Pₜ")}</span>`,
  symbols: [
    { sym: "rₜ", desc: "当前处理步骤的即时奖励。" },
    { sym: "D(sₜ)", desc: "处理前图像对应的检测误差；越低越好。" },
    { sym: "D(sₜ₊₁)", desc: "处理后图像对应的检测误差。" },
    { sym: "Pₜ", desc: "当前步骤的惩罚，包含重复使用与计算成本等约束。" },
  ],
};
export const valueFormula: FormulaDef = {
  html: `<span class="fx-line">${m("Gₜ")} = ${m("rₜ")} + ${m("γ")} ${m("rₜ₊₁")} + ${m("γ²", "γ<sup>2</sup>")} ${m("rₜ₊₂")} + …</span><span class="fx-line">${m("Vπ(sₜ)", "V<sup>π</sup>(sₜ)")} = E[${m("Gₜ")} | ${m("sₜ")}]</span>`,
  symbols: [
    { sym: "Gₜ", desc: "从当前步骤起的累计折扣奖励。" },
    { sym: "rₜ", desc: "当前步骤的即时奖励。" },
    { sym: "γ", desc: "折扣因子，控制未来奖励的权重。" },
    { sym: "rₜ₊₁", desc: "下一步骤的即时奖励。" },
    { sym: "γ²", desc: "第二个未来步骤的奖励所乘的折扣权重。" },
    { sym: "rₜ₊₂", desc: "再下一步骤的即时奖励。" },
    { sym: "Vπ(sₜ)", desc: "Critic 对策略 π 在当前状态下未来回报的估计。" },
    { sym: "sₜ", desc: "第 t 步的当前状态。" },
  ],
};
export const costFormula: FormulaDef = {
  html: `${m("P_c", "P<sub>c</sub>")} = ${m("λ_c", "λ<sub>c</sub>")} × Σ<sub>${m("m∈M")}</sub>(${m("I_m", "I<sub>m</sub>")} × ${m("C_m", "C<sub>m</sub>")})`,
  symbols: [
    { sym: "P_c", desc: "这一处理路径的计算成本惩罚。" },
    { sym: "λ_c", desc: "计算成本惩罚的权重。" },
    { sym: "m∈M", desc: "对候选 ISP 模块集合中的各模块求和。" },
    { sym: "I_m", desc: "模块 m 是否被使用的指示量。" },
    { sym: "C_m", desc: "模块 m 的计算开销。" },
  ],
};
