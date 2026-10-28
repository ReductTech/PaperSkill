import { AnimatedUnitPair } from './clip-08-vector-motion';
import './local-unit-pair.css';

/** Keep the animated geometry beside its matrix control on a narrow screen. */
export function LocalUnitPair({imageAngle,textAngle,uid}:{imageAngle:number;textAngle:number;uid:string}) {
  return <svg className="enc-local-pair-motion" viewBox="35 17 290 290" aria-hidden="true">
    <defs>
      <marker id={`${uid}-image-arrow`} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#5365ad"/></marker>
      <marker id={`${uid}-text-arrow`} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#bd9254"/></marker>
    </defs>
    <path d="M43 162H317M180 25V299" fill="none" stroke="#d9dce5"/>
    <circle cx="180" cy="162" r="118" fill="#fffdf8" stroke="#ccd3e2" strokeWidth="2" strokeDasharray="4 6"/>
    <AnimatedUnitPair imageAngle={imageAngle} textAngle={textAngle} uid={uid} projection/>
    <circle cx="180" cy="162" r="4" fill="#26364a"/>
  </svg>;
}
