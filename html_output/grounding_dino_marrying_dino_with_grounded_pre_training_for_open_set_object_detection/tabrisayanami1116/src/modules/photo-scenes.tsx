import { Stage, apple, card, color, dot, frameBox, line, orchard, rect } from './kit';

export function PhotoScene({ scene }: { scene: number }) {
  return <Stage name="苹果照片与取景练习" width={560} height={140} motion draw={(ctx, p) => {
    const x = 158, y = 21, w = 244, h = 98;
    if (scene === 2 || scene === 6) {
      card(ctx, x, y, w, h);
      apple(ctx, 218, 74, 25, true);
      dot(ctx, 336, 71, 34, '#dce5d1', color.pale);
      dot(ctx, 336, 71, 24, color.blue);
      dot(ctx, 336, 71, 15, '#334f77', color.edge);
      const angle = 1.4 - p * 2.1;
      line(ctx, [336 + 23 * Math.cos(angle), 71 + 23 * Math.sin(angle)], [336 + 33 * Math.cos(angle), 71 + 33 * Math.sin(angle)], color.orange, 5);
    } else if (scene === 3) {
      orchard(ctx, x + 32, y, w, h);
      const slide = 74 + p * 128;
      card(ctx, slide, 82, 92, 30);
      line(ctx, [slide + 14, 96], [slide + 76, 96], color.blue, 3);
    } else if (scene === 7 || scene === 10) {
      card(ctx, 138, 17, 285, 108);
      frameBox(ctx, [151, 31, 266, 111], color.pale, [6, 4], 2);
      card(ctx, 285, 31, 123, 82);
      apple(ctx, 345, 73, 22);
      card(ctx, 173 - 22 * p, 45 - p * 14, 115, 79);
      apple(ctx, 230 - 22 * p, 88 - p * 14, 22, true);
    } else if (scene === 8) {
      card(ctx, 132, 17, 294, 106);
      apple(ctx, 346, 73, 24, true);
      line(ctx, [278, 24], [278, 115], color.outline);
      rect(ctx, 278 - p * 122, 23, 122 * p, 94, '#dce5d1', color.outline, 8);
      if (p > .28) line(ctx, [291 - p * 122, 70], [253, 70], color.blue, 4);
    } else if (scene === 9) {
      card(ctx, x - 14, y - 5, w + 28, h + 10);
      ctx.save();
      ctx.translate(280, 0);
      ctx.scale(Math.cos(Math.PI * p) || 0.001, 1);
      orchard(ctx, -122, y, w, h);
      ctx.restore();
    } else {
      const boxes = orchard(ctx, x, y, w, h);
      if (scene === 0) {
        boxes.forEach((box) => frameBox(ctx, box, color.blue, [5, 3], 2));
      } else {
        const target = boxes[scene === 1 ? 2 : 1];
        const shift = scene === 5 ? 0 : (1 - p) * -46;
        const spread = scene === 5 ? (1 - p) * 19 : 1;
        frameBox(ctx, [target[0] + shift - spread, target[1] - spread, target[2] + shift + spread, target[3] + spread], p > .9 ? color.green : color.blue);
      }
    }
  }}/>;
}
