import { mix, windowAt } from './review/lifecycle-model.ts';
import type { ImageRegion } from './PelicanIllustration';

export const AUG_SOURCE = { x: 32, y: 60, w: 384, h: 228 };
export const AUG_DESTINATION = { ...AUG_SOURCE, x: 704 };
export const AUG_ROTATION_DEG = 25;
export const AUG_ROTATION_PAN_X = -20;
export type AugmentationView = 'center' | 'flip' | 'rotate';

/** Inverse-rotate the viewport corners: enough uniform zoom to cover every corner. */
export function rotationCoverScale(degrees: number, panX=0, panY=0) {
  const radians=degrees*Math.PI/180, c=Math.cos(radians), s=Math.sin(radians);
  return Math.max(...[-160,160].flatMap(x=>[-95,95].flatMap(y=>[
    Math.abs(c*(x-panX)+s*(y-panY))/160,
    Math.abs(-s*(x-panX)+c*(y-panY))/95,
  ])));
}
export const AUG_REGIONS = {
  original: { x: 0, y: 0, w: 320, h: 190 },
  saved: { x: 24, y: 14.25, w: 272, h: 161.5 },
  center: { x: 48, y: 28.5, w: 224, h: 133 },
} satisfies Record<string, ImageRegion>;

const regionBetween = (a: ImageRegion, b: ImageRegion, t: number): ImageRegion => ({
  x: mix(a.x, b.x, t), y: mix(a.y, b.y, t),
  w: mix(a.w, b.w, t), h: mix(a.h, b.h, t),
});

/** Geometry of an actual source crop, copied at 1:1 and then enlarged to the training window. */
export function augmentationMotion(clip: number, p: number, view: AugmentationView) {
  const future = clip >= 2, flipping = future && view === 'flip', rotating = future && view === 'rotate';
  const fullView=flipping||rotating;
  const selection = windowAt(p, .04, .29);
  const finalRegion = !future ? AUG_REGIONS.saved : fullView ? AUG_REGIONS.original : AUG_REGIONS.center;
  const selected = clip === 0 ? regionBetween(AUG_REGIONS.original, finalRegion, selection)
    : clip === 2 ? regionBetween(AUG_REGIONS.saved, finalRegion, selection) : finalRegion;
  const transfer = clip === 0 || clip === 2 && !fullView ? windowAt(p, .33, .83) : 1;
  const copied = clip === 0 || clip === 2 && !fullView ? windowAt(p, .29, .33) : 0;
  const landed = windowAt(transfer, .985, 1);
  const scale = AUG_SOURCE.w / 320;
  const origin = { x: AUG_SOURCE.x + finalRegion.x * scale, y: AUG_SOURCE.y + finalRegion.y * scale, w: finalRegion.w * scale, h: finalRegion.h * scale };
  const moving = regionBetween(origin, AUG_DESTINATION, transfer);
  moving.y -= 8 * Math.sin(Math.PI * transfer);
  return {
    selected, finalRegion, transfer, copied, landed, moving,
    flipping, flip: flipping ? clip === 2 ? windowAt(p, .34, .84) : 1 : 0,
    rotating,
    rotationDeg: rotating ? AUG_ROTATION_DEG*(clip===2?windowAt(p,.32,.65):1) : 0,
    rotationScale: rotating ? mix(1,rotationCoverScale(AUG_ROTATION_DEG,AUG_ROTATION_PAN_X),clip===2?windowAt(p,.65,.87):1) : 1,
    rotationOffsetX: rotating ? AUG_ROTATION_PAN_X*(clip===2?windowAt(p,.65,.87):1) : 0,
    fitProgress: rotating ? clip===2?windowAt(p,.65,.87):1 : 0,
    selection: clip === 0 || clip === 2 ? selection : 1,
    freeze: clip > 1 ? 1 : clip === 1 ? windowAt(p, .58, .82) : 0,
    freezeCopy: clip > 1 ? 1 : clip === 1 ? windowAt(p, .15, .65) : 0,
    baseRegion: clip === 2 && fullView ? regionBetween(AUG_REGIONS.saved, AUG_REGIONS.original, windowAt(p, .04, .29)) : clip === 2 ? AUG_REGIONS.saved : finalRegion,
  };
}
