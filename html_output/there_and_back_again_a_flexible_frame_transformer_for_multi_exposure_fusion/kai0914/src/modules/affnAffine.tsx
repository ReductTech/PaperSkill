import { useState } from 'react';
export function AffnAffine() {
  const [g, setG] = useState(0);
  const [b, setB] = useState(0);
  return (
    <div className="module">
      <label>γ：<input type="range" min="-1" max="1" step="0.1" value={g} onChange={e => setG(+e.target.value)} /> {g.toFixed(1)}</label>
      <label>β：<input type="range" min="-1" max="1" step="0.1" value={b} onChange={e => setB(+e.target.value)} /> {b.toFixed(1)}</label>
      <p>X̂ = X ⊙ (1 + {g.toFixed(1)}) + {b.toFixed(1)}</p>
    </div>
  );
}