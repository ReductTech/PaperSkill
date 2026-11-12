import { useId } from 'react';

/** A single scene shared by the cover and every stage of the patch experiment. */
export function Coast() {
  const id = useId().replace(/:/g, '');
  const paper = `coast-paper-${id}`;
  const cliff = `coast-cliff-${id}`;
  return (
    <svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" width="100%" height="100%"
      role="img" aria-label="海岸教学插画。右边的红白灯塔立在岩壁上，左边的帆船驶过海湾。">
      <defs>
        <pattern id={paper} width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="1.2" cy="1.2" r=".58" fill="#243e58" opacity=".2"/>
          <circle cx="4.8" cy="4.8" r=".6" fill="#fffbe5" opacity=".45"/>
        </pattern>
        <pattern id={cliff} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(29)">
          <path d="M0 0V8" stroke="#ede4b8" strokeWidth="1.4" opacity=".43"/>
        </pattern>
      </defs>
      <path fill="#bfe3e0" d="M0 0h600v400H0z"/>
      <path fill="#dbead5" d="M0 125c134 17 251 12 325 4s163-13 275-2v85H0Z"/>
      <circle cx="143" cy="78" r="40" fill="#ffd583"/>
      <g fill="none" strokeLinecap="round">
        <path d="M40 63h51m-28 6h54m108 17h65m-78 6h34m250-50h41" stroke="#f8f5da" strokeWidth="3"/>
        <path d="M45 145h72m135-36h34m-41 6h16m211-18h76" stroke="#f9f5d7" strokeWidth="2"/>
        <path d="M265 60q9-4 15 3 4-9 13-10m18 16q5-4 10 0 3-7 9-8" stroke="#46647c" strokeWidth="2.5"/>
      </g>
      <path fill="#8fbdb5" d="M0 161 61 138 90 136 132 151 170 148 201 155 256 160 306 171v25H0Z"/>
      <path fill="#659fa0" d="m0 151 50-4 48 14 55 3 36 7 74 5 36 10H0Z"/>
      <path fill="#237f8b" d="M0 179h600v221H0z"/>
      <path fill="#70bcb4" d="M0 180h600v21l-93 1-72 11-112-3-69 9-113-8-82 3-59-6z"/>
      <path fill="#4ca4a4" d="m0 221 147 1 81 7 125-2-95 12-135 5-123-2z"/>
      <g fill="none" stroke="#bce1c9" strokeLinecap="round">
        <path d="M9 193h115m27 3h53m25-10h59m24 15h38m-315 26h36m8 7h47m123 17h50M3 268h51m-35 8h73m85 36h55m-83 11h35m-136 39h48" strokeWidth="2.2"/>
        <path d="m-11 297 57-5 47 3m111-23 30-2 20 1m-187 62 37-4 40 1" strokeWidth="2.7"/>
      </g>
      <path fill="#316975" d="M600 140 551 146 514 162 493 166 466 187l-36 12-61 13-31 15-72 15 11 9 95-9 90-14 138-17Z"/>
      <path fill="#233e57" d="m600 170-69 8-52 17-51 5-32 15-26 4-25 16-31 7 23 10 25 3 17 13 45 9 176 26Z"/>
      <path fill="#d49b6f" d="m600 180-67 9-48 19-45 5-35 15-17 1-34 15 31 1 32-11 48 2 41-14 94-9Z"/>
      <path fill="#f2bd83" d="m399 230 45-18 41-5 51-20 64-6v8l-62 6-52 22-40 4z"/>
      <path fill="#527b73" d="m342 235 42-20 31-5 34-18 50-5 39-14 62-13v15l-69 10-45 18-46 5-37 16z"/>
      <g>
        <path d="m393 207 15-94h24l15 87-14 6z" fill="#fff3cf"/>
        <path d="m413 115 7 1-6 89-21 2z" fill="#d7e4cf"/>
        <path d="m405 138 31-1 4 19-38 2z" fill="#e76a4e"/>
        <path d="m399 174 43-2 4 19-50 5z" fill="#e76a4e"/>
        <path d="M420 163h5v8h-5zm1-40h4v7h-4z" fill="#253e52"/>
        <path d="M415 205v-10a5 5 0 0 1 10 0v8Z" fill="#253e52"/>
        <path d="M404 95h30v17h-30z" fill="#24445a"/>
        <path d="M408 98h6v10h-6zm10 0h8v10h-8z" fill="#ffdd8c"/>
        <path d="M400 95 419 81l19 14Zm18-15v-9h2v9Z" fill="#d45c47"/>
        <path d="M400 110v-8m38 8v-8m-40 2h42m-40 6h38l-4 5h-30z" fill="none" stroke="#2e4657" strokeWidth="2.5"/>
        <path d="m447 196 4-25h29l8 20-29 9z" fill="#fbdfaa"/>
        <path d="m444 173 12-12 26-1 5 11z" fill="#c15e46"/>
        <path d="M461 179h5v7h-5zm10-2h4v7h-4z" fill="#41646b"/>
      </g>
      <g>
        <path d="m159 211-1 70" fill="none" stroke="#303f53" strokeWidth="2.7"/>
        <path d="m156 216-36 55 36-3z" fill="#fff0c9"/>
        <path d="m162 225 23 41-23 1z" fill="#eda66c"/>
        <path d="m116 276 77-5-13 11-48 3z" fill="#233e57"/>
        <path d="m123 280 60-5" stroke="#ec8264" strokeWidth="3"/>
        <path d="m118 289 39-2m-16 6 29-1" stroke="#a5cfc0" strokeWidth="2.5" strokeLinecap="round"/>
      </g>
      <path fill="#153f53" d="m600 225-27 4-65 25-61 9-45 23-38 5-31 12-10 14-34 8-25 18-53 11-25 16-48 10-32 20h494z"/>
      <path fill="#42726a" d="m600 225-59 9-44 16-48 10-53 23-49 10-32 14-20 18-53 19-44 15-53 9-37 16-45 16h69l38-21 49-7 52-18 45-4 43-28 53-10 27-22 52-8 59-33z"/>
      <path fill="#dfad74" d="m600 256-66 26-44 8-37 22-37 4-28 16 34-6 48-7 38-21 54-8 38-12z"/>
      <path fill={`url(#${cliff})`} d="m600 316-62 14-54 28-33 9-30 33h179z"/>
      <path fill={`url(#${paper})`} d="M0 0h600v400H0z" aria-hidden="true"/>
    </svg>
  );
}

export default Coast;
