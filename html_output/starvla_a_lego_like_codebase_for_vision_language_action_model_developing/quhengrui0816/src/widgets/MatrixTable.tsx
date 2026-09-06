import { MATRIX_COLS, MATRIX_ROWS } from "../data/content";
import Src from "../components/Src";

/** 论文 Table 1：开源 VLA 框架能力对比矩阵 */
export default function MatrixTable() {
  return (
    <div>
      <div className="panel-title" style={{ ["--kcolor" as string]: "var(--ink)" }}>
        和现有开源框架比一比
        <Src where="论文 Table 1（逐项能力核对）" cmp="能力有无的客观比对，非性能排行" />
      </div>
      <div className="matrix-wrap">
        <table className="matrix">
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>框架</th>
              {MATRIX_COLS.map((c) => <th key={c}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {MATRIX_ROWS.map((r) => (
              <tr key={r.name} className={r.ours ? "ours" : ""}>
                <th>{r.name}{r.ours ? " ★" : ""}</th>
                {r.cells.map((c, i) => (
                  <td key={i}>
                    {typeof c === "string" ? c : c ? <span className="mx-yes">✓</span> : <span className="mx-no">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
