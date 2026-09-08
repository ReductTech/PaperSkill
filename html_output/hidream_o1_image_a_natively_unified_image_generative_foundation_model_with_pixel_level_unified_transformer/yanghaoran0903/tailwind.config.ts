import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        display: ['48px', { lineHeight: '1.1' }],
        h1: ['36px', { lineHeight: '1.2' }],
        h2: ['28px', { lineHeight: '1.3' }],
        h3: ['22px', { lineHeight: '1.4' }],
        body: ['17px', { lineHeight: '1.75' }],
        caption: ['14px', { lineHeight: '1.5' }],
        code: ['15px', { lineHeight: '1.6' }],
      },
    },
  },
} satisfies Config;
