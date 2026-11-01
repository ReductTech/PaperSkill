const ROWS = [
  {
    k: '证据范围',
    v: '4 个任务（水槽碗盘 / 抽屉收纳 / 衣物入篮 / 铺床），每策略每任务 10 次试验，共 3 个真实住宅 + 3 个模拟厨房 + 3 个模拟卧室（12 个位置），指标为评分表得分百分比。',
    c: '#27446e',
  },
  {
    k: '成立条件',
    v: '移动双臂机械臂上的家务清洁与整理；指令是简短的高层要求；动作以 50 步块、50 Hz 下发，由简单 PD 控制器跟踪，不做额外轨迹规划或碰撞检测。',
    c: '#228d5c',
  },
  {
    k: '不能外推',
    v: '不保证换一种机器人、换一类任务仍然成立；高层子任务推理仍会被场景细节带走；上下文较短、缺少记忆，跨房间或多遮挡场景的表现有限。',
    c: '#c43f52',
  },
  {
    k: '类比的边界',
    v: '「师傅报下一步、学徒动手」只是直觉。真实系统里没有两个人：同一个 Transformer 既输出子任务文本，也通过动作专家输出连续动作块。',
    c: '#f07e47',
  },
];

export function RecipeBoundary(_: { chapterId: string; moduleId: string }) {
  return (
    <div className="pi-split">
      <div className="pi-left">
        <div className="pi-note-card">
          {ROWS.map((r) => (
            <div className="pi-note-row" key={r.k}>
              <span className="pi-note-key" style={{ color: r.c }}>{r.k}</span>
              <span className="pi-note-val">{r.v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="pi-right">
        <svg viewBox="0 0 480 380" width="100%" height="380" role="img" aria-label="一张压在台面上的配方便签">
          <rect width="480" height="380" fill="#f7f3ec" />
          <rect x="0" y="300" width="480" height="16" fill="#d8c7ad" />
          <rect x="0" y="300" width="480" height="5" fill="#92400e" />
          <g transform="rotate(-4 240 170)">
            <rect x="90" y="70" width="300" height="200" rx="8" fill="#fdf6e6" stroke="#e8d9b8" strokeWidth="2" />
            <line x1="120" y1="120" x2="360" y2="120" stroke="#d7deea" strokeWidth="2" />
            <line x1="120" y1="156" x2="360" y2="156" stroke="#d7deea" strokeWidth="2" />
            <line x1="120" y1="192" x2="300" y2="192" stroke="#d7deea" strokeWidth="2" />
            <text x="120" y="106" fontSize="19" fill="#21324a" fontWeight="700">这套配方什么时候成立</text>
            <text x="120" y="146" fontSize="15" fill="#68778f">4 任务 · 10 次 · 12 个位置</text>
            <text x="120" y="182" fontSize="15" fill="#68778f">50 Hz · 50 步动作块 · 端到端</text>
            <text x="120" y="218" fontSize="15" fill="#68778f">机械臂 + 简短指令</text>
            <circle cx="330" cy="230" r="22" fill="#f07e47" opacity="0.85" />
          </g>
          <text x="240" y="352" fontSize="17" fill="#68778f" textAnchor="middle">
            超出这张便签范围的说法，论文都没有给出证据
          </text>
        </svg>
      </div>
    </div>
  );
}
