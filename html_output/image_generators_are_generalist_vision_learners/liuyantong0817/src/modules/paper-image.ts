/** Resolve a paper figure against Vite's deployment base (local or GitHub Pages). */
export function paperImage(filename: string): string {
  return `${import.meta.env.BASE_URL}images/${filename}`;
}
