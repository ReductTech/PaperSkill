import "./editorial-flourish.css";

/** Static landscape divider for reading pages; it carries no paper or model semantics. */
export default function EditorialFlourish({ end = false, variant = 0 }: { end?: boolean; variant?: number }) {
  const mirrored = variant % 2 === 1;
  return <svg className={end ? "rk-editorial-flourish is-ending" : "rk-editorial-flourish"} viewBox="0 0 1240 82" aria-hidden="true" focusable="false">
    <path className="rk-flourish-wash" d={mirrored ? "M0 71C160 37 241 86 423 64S724 78 912 54S1110 54 1240 69V82H0Z" : "M0 72C156 55 232 77 391 60S687 45 849 66S1080 56 1240 65V82H0Z"}/>
    <path className="rk-flourish-wave" d="M0 76C176 59 229 80 395 65S690 61 853 74S1097 55 1240 66"/>
    <path className="rk-flourish-wave is-warm" d="M29 64C155 46 229 68 326 57M807 66C941 46 1052 62 1190 50"/>
    <g transform={mirrored ? "translate(200 0) scale(-1 1)" : "translate(1050 0)"}>
      <path className="rk-flourish-stem" d="M40 71C54 56 64 34 66 12M55 51L39 37M62 34L82 23"/>
      <path className="rk-flourish-leaf" d="M65 34C53 23 58 10 67 7C75 18 73 29 65 34ZM56 54C42 51 34 42 37 32C50 32 59 43 56 54ZM62 41C64 27 76 20 86 23C84 36 75 42 62 41Z"/>
      <circle className="rk-flourish-seed" cx="20" cy="42" r="2.5"/><circle className="rk-flourish-seed" cx="7" cy="52" r="1.6"/>
    </g>
    {!end && <g transform={mirrored ? "translate(1080 0)" : "translate(85 0)"}><circle className="rk-flourish-sun" cx="0" cy="28" r="9"/><path className="rk-flourish-ground" d="M-35 49Q-3 30 35 49T105 47"/></g>}
  </svg>;
}
