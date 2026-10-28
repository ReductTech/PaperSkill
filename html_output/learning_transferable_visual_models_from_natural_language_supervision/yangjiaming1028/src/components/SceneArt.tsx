import { useId } from 'react';

export type SceneKind = 'cat' | 'dog' | 'car' | 'chair';

/** Original vector illustrations used as clearly identifiable teaching inputs. */
export function SceneArt({ kind, className }: { kind: SceneKind; className?: string }) {
  const id = useId().replace(/:/g, '');
  const titles: Record<SceneKind, string> = {
    cat: '橘猫坐在窗边的扶手椅上', dog: '金色的狗在草地上休息',
    car: '青绿色汽车行驶在山间公路上', chair: '窗边的一把橙色扶手椅',
  };
  return <svg className={className} viewBox="0 0 480 320" role="img" aria-labelledby={`${id}-title`} xmlns="http://www.w3.org/2000/svg">
    <title id={`${id}-title`}>{titles[kind]}</title>
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={kind === 'car' ? '#d8ebe8' : '#e7eee5'} />
        <stop offset="1" stopColor="#f3f1dd" />
      </linearGradient>
      <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ede7da" /><stop offset="1" stopColor="#f8f4e9" />
      </linearGradient>
    </defs>
    {(kind === 'cat' || kind === 'chair') && <>
      <rect width="480" height="320" fill={`url(#${id}-wall)`} />
      <rect y="251" width="480" height="69" fill="#d5d8c8" />
      <path d="M0 252H480M326 252L375 320M139 252L105 320" fill="none" stroke="#c2c9ba" strokeWidth="2" />
      <rect x="50" y="28" width="190" height="179" rx="6" fill="#fffdf5" />
      <rect x="59" y="37" width="172" height="161" rx="2" fill="#c9ded5" />
      <circle cx="188" cy="72" r="22" fill="#f5dfae" />
      <path d="M59 153Q95 100 134 139T231 123V198H59Z" fill="#9cbeac" />
      <path d="M59 176Q113 135 151 167T231 154V198H59Z" fill="#739f90" />
      <path d="M145 36V201M57 116H233" fill="none" stroke="#fffdf5" strokeWidth="7" />
      <path d="M251 43L284 228H434L411 43Z" fill="#fffdf5" opacity=".32" />
      <ellipse cx="258" cy="284" rx="116" ry="17" fill="#abb8a7" opacity=".45" />
      <path d="M177 260L168 292M317 260L326 292" stroke="#745949" strokeWidth="10" strokeLinecap="round" />
      <rect x="163" y="132" width="167" height="137" rx="40" fill="#b66843" />
      <rect x="174" y="136" width="146" height="120" rx="33" fill="#d99b67" />
      <rect x="167" y="221" width="164" height="45" rx="17" fill="#c87e51" />
      <rect x="144" y="194" width="39" height="77" rx="18" fill="#d28a57" />
      <rect x="312" y="194" width="39" height="77" rx="18" fill="#d28a57" />
      <path d="M183 227H313" stroke="#ae704b" strokeWidth="3" />
      <path d="M392 232C378 194 387 149 399 124M392 206L370 184M394 187L413 167" stroke="#537f67" strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="378" cy="170" rx="11" ry="27" transform="rotate(-35 378 170)" fill="#6c9273" />
      <ellipse cx="410" cy="155" rx="12" ry="28" transform="rotate(32 410 155)" fill="#86a482" />
      <ellipse cx="396" cy="129" rx="11" ry="24" transform="rotate(12 396 129)" fill="#537f67" />
      <path d="M367 223H419L412 272H376Z" fill="#b99e7d" /><path d="M366 224H420" stroke="#907b63" strokeWidth="5" />
      {kind === 'cat' ? <g>
        <path d="M285 214C339 226 339 179 315 181" fill="none" stroke="#d28c40" strokeWidth="19" strokeLinecap="round" />
        <ellipse cx="244" cy="199" rx="46" ry="39" fill="#e8ad58" />
        <ellipse cx="237" cy="208" rx="28" ry="26" fill="#f5ce88" />
        <path d="M211 153L204 113L229 132L253 130L278 112L273 156Z" fill="#e8ad58" stroke="#be7b37" strokeWidth="2" strokeLinejoin="round" />
        <path d="M211 121L215 142L225 137M269 121L256 137L267 143" fill="#eec0a3" />
        <ellipse cx="241" cy="157" rx="37" ry="30" fill="#e8ad58" />
        <path d="M234 133L238 144M245 132L245 143M256 137L253 145" stroke="#b97432" strokeWidth="4" strokeLinecap="round" />
        <path d="M220 155Q225 149 230 155M251 155Q257 149 262 155" fill="none" stroke="#423b2c" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="233" cy="169" rx="11" ry="8" fill="#f8dfaa" /><ellipse cx="251" cy="169" rx="11" ry="8" fill="#f8dfaa" />
        <path d="M237 162H247L242 168Z" fill="#9b654e" /><path d="M242 168V172" stroke="#9b654e" strokeWidth="2" />
        <path d="M216 167L195 162M216 173L195 176M265 167L284 161M265 173L286 176" stroke="#8d7046" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M210 193L219 198M207 205L218 207M269 193L279 188" stroke="#bd7b36" strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="220" cy="230" rx="18" ry="9" fill="#edb568" /><ellipse cx="264" cy="230" rx="18" ry="9" fill="#edb568" />
      </g> : <>
        <rect x="210" y="162" width="81" height="62" rx="13" fill="#e8d6ad" transform="rotate(-8 250 193)" />
        <path d="M224 180L278 204M231 172L284 196" stroke="#bbab83" strokeWidth="3" opacity=".7" />
      </>}
    </>}
    {kind === 'dog' && <>
      <rect width="480" height="320" fill={`url(#${id}-sky)`} />
      <circle cx="383" cy="66" r="31" fill="#f0d89f" />
      <path d="M0 153Q87 92 167 146T337 128T480 134V320H0Z" fill="#b8cbb3" />
      <path d="M0 204Q79 152 172 190T348 179T480 187V320H0Z" fill="#8db49a" />
      <path d="M0 266Q136 213 246 252T480 238V320H0Z" fill="#abc49d" />
      <path d="M53 204V81M51 154L28 131M55 122L79 103" stroke="#729883" strokeWidth="9" strokeLinecap="round" />
      <ellipse cx="46" cy="78" rx="46" ry="50" fill="#8fad91" /><ellipse cx="77" cy="92" rx="35" ry="43" fill="#98b99b" />
      <path d="M416 215V135" stroke="#729883" strokeWidth="7" /><ellipse cx="415" cy="128" rx="33" ry="46" fill="#8fad91" />
      <ellipse cx="245" cy="276" rx="105" ry="17" fill="#719b7b" opacity=".4" />
      <path d="M306 236Q358 231 344 201" fill="none" stroke="#bd8952" strokeWidth="20" strokeLinecap="round" />
      <ellipse cx="258" cy="230" rx="63" ry="43" fill="#d8ae70" />
      <path d="M201 232L194 271Q194 281 215 278L229 247M267 243L269 276Q287 283 298 274L294 241" fill="#e2bf85" />
      <ellipse cx="225" cy="177" rx="49" ry="55" fill="#e4bf83" />
      <path d="M192 143Q157 133 165 186Q168 207 184 204L200 164" fill="#b98551" />
      <path d="M257 143Q290 135 283 185Q278 209 262 204L251 163" fill="#b98551" />
      <path d="M208 140Q224 131 238 140L243 185H204Z" fill="#f3d8a2" />
      <ellipse cx="206" cy="172" rx="4" ry="5" fill="#443e2e" /><ellipse cx="245" cy="172" rx="4" ry="5" fill="#443e2e" />
      <ellipse cx="225" cy="199" rx="25" ry="19" fill="#f4d9ac" />
      <path d="M215 190Q225 184 235 190L231 199H219Z" fill="#514534" />
      <path d="M225 199V207M212 208Q225 218 238 208" stroke="#735a3f" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M220 214Q225 234 232 215" fill="#d99e8b" />
      <path d="M187 214Q223 234 263 214" fill="none" stroke="#217c6b" strokeWidth="12" />
      <circle cx="227" cy="230" r="8" fill="#e2b653" /><circle cx="227" cy="230" r="3" fill="#bd8e36" />
      <path d="M105 265L101 253M105 265L112 255M370 275L372 262M370 275L362 267M325 304L321 294" stroke="#6e9874" strokeWidth="3" strokeLinecap="round" />
      <circle cx="130" cy="246" r="3" fill="#f3e5ad" /><circle cx="353" cy="252" r="3" fill="#f3e5ad" />
    </>}
    {kind === 'car' && <>
      <rect width="480" height="320" fill={`url(#${id}-sky)`} />
      <circle cx="382" cy="67" r="31" fill="#f2d7a2" />
      <path d="M0 191L108 79L205 178L292 92L425 194L480 154V320H0Z" fill="#a8bfb2" />
      <path d="M68 119L108 79L146 118L121 110L107 123L94 112Z" fill="#edf1e5" />
      <path d="M0 211L75 162L183 223L310 157L480 223V320H0Z" fill="#729f8b" />
      <path d="M0 242Q239 214 480 240V320H0Z" fill="#697b78" />
      <path d="M0 286Q240 269 480 286" stroke="#e9e5cf" strokeWidth="4" strokeDasharray="43 33" fill="none" />
      <path d="M0 241Q240 213 480 240" stroke="#e8e4cc" strokeWidth="5" fill="none" />
      <ellipse cx="241" cy="263" rx="144" ry="14" fill="#354d48" opacity=".34" />
      <path d="M101 217L124 207L154 160Q159 152 175 151H275Q288 153 300 166L334 206L371 217L378 245H98Z" fill="#247f76" />
      <path d="M159 163H211V205H134ZM221 163H275Q283 164 289 172L313 205H221Z" fill="#c1ddd2" />
      <path d="M162 169L140 202H155L178 169M231 169L257 202H273L247 169" fill="#e7f1e8" opacity=".57" />
      <path d="M216 158V243M324 211L334 242" stroke="#17675f" strokeWidth="3" />
      <path d="M118 212H360M113 242H366" stroke="#61a393" strokeWidth="3" />
      <path d="M237 216H255" stroke="#c7ddd0" strokeWidth="4" strokeLinecap="round" />
      <rect x="104" y="218" width="19" height="11" rx="3" fill="#c57b58" /><rect x="354" y="217" width="18" height="12" rx="4" fill="#f7e4b0" />
      <rect x="97" y="242" width="281" height="10" rx="4" fill="#385a52" />
      {[160, 318].map(x => <g key={x}><circle cx={x} cy="249" r="27" fill="#263f3a" /><circle cx={x} cy="249" r="15" fill="#d1d7ca" /><circle cx={x} cy="249" r="6" fill="#77918a" /><path d={`M${x} 237V243M${x + 12} 249H${x + 6}M${x} 261V255M${x - 12} 249H${x - 6}`} stroke="#77918a" strokeWidth="2" /></g>)}
      <path d="M48 218L48 170M42 180H65" stroke="#e0d8b5" strokeWidth="5" strokeLinecap="round" />
      <path d="M431 235V198M426 209H447" stroke="#d7d2b4" strokeWidth="4" strokeLinecap="round" />
    </>}
  </svg>;
}

export default SceneArt;
