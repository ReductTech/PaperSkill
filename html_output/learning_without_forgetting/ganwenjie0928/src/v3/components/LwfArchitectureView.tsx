import { useState } from "react";
import { AlexNetArchitecture } from "../../components/AlexNetArchitecture";
import { TermRef } from "../../shared/core/reference";
import { termsById } from "../data/references";

type ArchitectureMode = "teacher" | "student";
type ParameterNode = "theta_s" | "theta_o" | "theta_n";

const parameterDetails: Record<ParameterNode, { title: string; body: string; termId: string; source: string }> = {
  theta_s: {
    title: "θₛ · 共享参数",
    body: "AlexNet 的 conv1–5、fc6 与 fc7 构成共享主体。Teacher 持有冻结副本；Student 在联合优化时从新旧目标接收梯度。",
    termId: "theta-s",
    source: "共享主体 · A01 / A05",
  },
  theta_o: {
    title: "θₒ · 旧任务 head",
    body: "Teacher 中的旧 head 保持固定并产生 Yₒ；Student 保留对应的 fc8_old，产生 Ŷₒ 并参与旧响应保持损失。",
    termId: "theta-o",
    source: "旧任务输出参数 · A02 / A05",
  },
  theta_n: {
    title: "θₙ · 新任务 head",
    body: "fc8_new 从共享表示分出并输出 Ŷₙ。新任务标签 Yₙ 监督这个 head；warm-up 时先训练 θₙ。",
    termId: "theta-n",
    source: "新任务输出参数 · A03 / A05",
  },
};

const termIdByParameter: Record<ParameterNode, string> = {
  theta_s: "theta-s",
  theta_o: "theta-o",
  theta_n: "theta-n",
};

export function LwfArchitectureView({ onOpenReference }: { onOpenReference: (termId: string) => void }) {
  const [mode, setMode] = useState<ArchitectureMode>("student");
  const [selected, setSelected] = useState<ParameterNode>("theta_s");
  const info = parameterDetails[selected];

  return <div className="v3-alexnet-shell">
    <header className="v3-architecture-switch">
      <div><p className="v3-eyebrow">OLD MODEL → EXPANDED STUDENT</p><strong>切换同一张 AlexNet 图，查看参数边界如何变化</strong></div>
      <div role="group" aria-label="选择模型视图" className="v3-architecture-switch-options">
        <button type="button" aria-pressed={mode === "teacher"} onClick={() => setMode("teacher")}>Teacher</button>
        <button type="button" aria-pressed={mode === "student"} onClick={() => setMode("student")}>Student</button>
      </div>
    </header>

    <AlexNetArchitecture
      compact
      boundary="fc7"
      inputSymbol="Xₙ"
      mode={mode}
      showNewHead={mode === "student"}
      parameterState={mode === "teacher" ? "frozen" : "trainable"}
      sharedState={mode === "teacher" ? "Teacher 冻结副本" : "Student 共享主体"}
      oldState={mode === "teacher" ? "固定旧输出" : "Student 旧任务 head"}
      newState="Student 新任务 head"
      onInspect={(id) => setSelected(id as ParameterNode)}
    />

    <aside className="v3-architecture-inspector" aria-live="polite" aria-label="AlexNet 参数说明">
      <div><p className="v3-eyebrow">SELECTED PARAMETER · {mode === "teacher" ? "TEACHER" : "STUDENT"}</p><h3>{info.title}</h3><p>{info.body}</p></div>
      <div className="v3-inspector-reference"><span>{info.source}</span><span>参数状态 · {mode === "teacher" ? "冻结" : selected === "theta_n" ? "warm-up 先训练" : "联合优化可训练"}</span><TermRef term={termsById[termIdByParameter[selected]]} onOpenReference={onOpenReference} /></div>
    </aside>
  </div>;
}
