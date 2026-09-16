export function displayDoc(text: string): string {
 return text.replace(/\bd(?:0*(\d+)|([AB]))\b/g, (_m, n, letter) => `文档${n ? Number(n) : letter === 'A' ? 1 : 2}`);
}
