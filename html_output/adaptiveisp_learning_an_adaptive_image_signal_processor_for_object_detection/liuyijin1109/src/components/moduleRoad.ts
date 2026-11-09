/** Stable, local road scene used as the source for every §3 pixel operation. */
export function drawModuleRoad(ctx: CanvasRenderingContext2D) {
  const w = 560, h = 300;
  const sky = ctx.createLinearGradient(0, 0, 0, 190);
  sky.addColorStop(0, "#86b9cb"); sky.addColorStop(1, "#dae2d4");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#fff1c0"; ctx.beginPath(); ctx.arc(450, 54, 27, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#81a99b"; ctx.beginPath(); ctx.moveTo(0, 155);
  for (const [x, y] of [[55, 93], [115, 143], [180, 78], [260, 155], [337, 85], [415, 148], [489, 100], [560, 153]]) ctx.lineTo(x, y);
  ctx.lineTo(w, 220); ctx.lineTo(0, 220); ctx.fill();
  ctx.fillStyle = "#558a7d"; ctx.beginPath(); ctx.moveTo(0, 185);
  for (const [x, y] of [[55, 148], [130, 185], [214, 145], [288, 183], [374, 142], [445, 184], [515, 151], [560, 179]]) ctx.lineTo(x, y);
  ctx.lineTo(w, 230); ctx.lineTo(0, 230); ctx.fill();
  const road = ctx.createLinearGradient(0, 180, 0, h);
  road.addColorStop(0, "#81929e"); road.addColorStop(1, "#46596b");
  ctx.fillStyle = road; ctx.beginPath(); ctx.moveTo(0, 206); ctx.lineTo(w, 178); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
  ctx.strokeStyle = "#b9c1b7"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 223); ctx.lineTo(w, 195); ctx.stroke();
  ctx.strokeStyle = "#eee5c5"; ctx.lineWidth = 5; ctx.setLineDash([68, 42]); ctx.beginPath(); ctx.moveTo(50, 275); ctx.lineTo(540, 240); ctx.stroke(); ctx.setLineDash([]);
  // Road sign and lettering provide fine edges for sharpen / denoise comparisons.
  ctx.fillStyle = "#455f6b"; ctx.fillRect(490, 82, 5, 106);
  ctx.fillStyle = "#e5a467"; ctx.fillRect(462, 60, 59, 33);
  ctx.fillStyle = "#fff6dd"; ctx.font = "bold 13px sans-serif"; ctx.fillText("STOP", 468, 81);
  // Orange car, windows, lights and wheels.
  ctx.fillStyle = "#c86e53"; ctx.beginPath(); ctx.moveTo(162, 219); ctx.lineTo(183, 184); ctx.lineTo(221, 165); ctx.lineTo(334, 165); ctx.lineTo(377, 191); ctx.lineTo(393, 224); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#aecbd0"; ctx.beginPath(); ctx.moveTo(207, 188); ctx.lineTo(230, 170); ctx.lineTo(322, 170); ctx.lineTo(355, 189); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#e7ede2"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(277, 170); ctx.lineTo(277, 190); ctx.stroke();
  ctx.fillStyle = "#df8960"; ctx.fillRect(161, 213, 231, 34);
  ctx.fillStyle = "#ffdf9f"; ctx.fillRect(169, 219, 29, 8); ctx.fillRect(358, 219, 29, 8);
  for (const x of [207, 344]) { ctx.fillStyle = "#2c4050"; ctx.beginPath(); ctx.arc(x, 246, 17, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#b8c5c6"; ctx.beginPath(); ctx.arc(x, 246, 7, 0, Math.PI * 2); ctx.fill(); }
  // Small cyclist adds a second target with thinner boundaries.
  ctx.strokeStyle = "#d2e1dd"; ctx.lineWidth = 3;
  for (const x of [65, 137]) { ctx.beginPath(); ctx.arc(x, 243, 18, 0, Math.PI * 2); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(65, 243); ctx.lineTo(90, 209); ctx.lineTo(112, 243); ctx.lineTo(65, 243); ctx.moveTo(90, 209); ctx.lineTo(137, 243); ctx.stroke();
  ctx.fillStyle = "#384f5a"; ctx.beginPath(); ctx.arc(96, 187, 8, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#384f5a"; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(96, 197); ctx.lineTo(91, 217); ctx.lineTo(111, 225); ctx.moveTo(90, 216); ctx.lineTo(76, 235); ctx.stroke();
}
