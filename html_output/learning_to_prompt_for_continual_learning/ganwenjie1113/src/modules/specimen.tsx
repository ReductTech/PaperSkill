import { useId } from "react";
import birdUrl from "./specimen.svg?inline";

export const PATCH_GRID = 14;
export const PATCH_SIZE = 16;
const IMAGE_SIZE = PATCH_GRID * PATCH_SIZE;
const CELL = 19;

export function Specimen() {
  return <img className="specimen" src={birdUrl} alt="枝头的蓝背橙胸鸟，教学用插图" />;
}

export function PatchCrop({ index }: { index: number }) {
  const x = (index % PATCH_GRID) * PATCH_SIZE;
  const y = Math.floor(index / PATCH_GRID) * PATCH_SIZE;
  return <svg className="crop-art" viewBox={`${x} ${y} 16 16`} role="img" aria-label={`原图第 ${index + 1} 块的实际裁切`}>
    <image href={birdUrl} width={IMAGE_SIZE} height={IMAGE_SIZE} />
  </svg>;
}

export function PatchGrid({ index, select }: { index: number; select: (index: number) => void }) {
  const artId = useId();
  return <svg className="patch-grid" viewBox={`0 0 ${PATCH_GRID * CELL - 1} ${PATCH_GRID * CELL - 1}`} role="img"
    aria-label="分离的 14×14 Patch 网格，点击选块，也可使用下方滑块">
    <defs><image id={artId} href={birdUrl} width={IMAGE_SIZE} height={IMAGE_SIZE} /></defs>
    {Array.from({ length: PATCH_GRID ** 2 }, (_, i) => {
      const col = i % PATCH_GRID;
      const row = Math.floor(i / PATCH_GRID);
      return <g key={i} className="patch-cell" data-patch={i} data-selected={index === i}
        transform={`translate(${col * CELL + 1},${row * CELL + 1})`} onClick={() => select(i)}>
        <svg width={PATCH_SIZE} height={PATCH_SIZE} viewBox={`${col * PATCH_SIZE} ${row * PATCH_SIZE} 16 16`}>
          <use href={`#${artId}`} />
        </svg>
        <rect width={PATCH_SIZE} height={PATCH_SIZE} fill="transparent" />
      </g>;
    })}
  </svg>;
}
