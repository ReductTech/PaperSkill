const HIKER_SRC = './images/climb-hiker-v2.png';
const MOUNTAIN_SRC = './images/climb-mountain-v2.png';

let hikerImage: HTMLImageElement | null = null;
let mountainImage: HTMLImageElement | null = null;

function createImage(src: string): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  const image = new Image();
  image.src = src;
  return image;
}

export function getClimbSprites() {
  hikerImage ??= createImage(HIKER_SRC);
  mountainImage ??= createImage(MOUNTAIN_SRC);
  return { hiker: hikerImage, mountain: mountainImage };
}

export function drawHikerSprite(
  ctx: CanvasRenderingContext2D,
  footX: number,
  footY: number,
  width: number,
  height: number,
  alpha = 1
) {
  const { hiker } = getClimbSprites();
  if (!hiker?.complete || hiker.naturalWidth === 0) return false;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(hiker, footX - width / 2, footY - height, width, height);
  ctx.restore();
  return true;
}

export function drawMountainSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  alpha = 1
) {
  const { mountain } = getClimbSprites();
  if (!mountain?.complete || mountain.naturalWidth === 0) return false;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(mountain, x, y, width, height);
  ctx.restore();
  return true;
}

export function onClimbSpritesReady(callback: () => void) {
  const { hiker, mountain } = getClimbSprites();
  const images = [hiker, mountain].filter((image): image is HTMLImageElement => Boolean(image));
  images.forEach((image) => image.addEventListener('load', callback));
  if (images.every((image) => image.complete && image.naturalWidth > 0)) callback();
  return () => images.forEach((image) => image.removeEventListener('load', callback));
}
