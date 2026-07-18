import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0E1B2C', panel: '#16243B', panel2: '#1C2C47', line: '#27395A',
        ink: '#E9EEF6', muted: '#9AA9BF', gold: '#C8972F', goldsoft: '#E3B85C',
        good: '#6FBF8F', chipbg: '#122036'
      },
      fontFamily: { head: ['"Space Grotesk"', 'sans-serif'], body: ['Inter', 'sans-serif'] }
    }
  },
  plugins: []
};
export default config;
