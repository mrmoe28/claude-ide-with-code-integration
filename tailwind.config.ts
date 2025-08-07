import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark theme colors
        dark: {
          bg: {
            primary: '#1e1e1e',
            secondary: '#252526',
            tertiary: '#2d2d30',
          },
          text: {
            primary: '#cccccc',
            secondary: '#969696',
            muted: '#6a6a6a',
          },
          accent: {
            primary: '#007acc',
            hover: '#094771',
            focus: '#1177bb',
          },
          border: {
            primary: '#3e3e42',
            secondary: '#464647',
          },
          input: '#3c3c3c',
          sidebar: '#252526',
        },
        // Light theme colors
        light: {
          bg: {
            primary: '#ffffff',
            secondary: '#f3f3f3',
            tertiary: '#f8f8f8',
          },
          text: {
            primary: '#333333',
            secondary: '#666666',
            muted: '#999999',
          },
          accent: {
            primary: '#0078d4',
            hover: '#e3f2fd',
            focus: '#106ebe',
          },
          border: {
            primary: '#e5e5e5',
            secondary: '#d1d1d1',
          },
          input: '#ffffff',
          sidebar: '#f3f3f3',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'monospace'],
        sans: ['SF Pro Display', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
      },
    },
  },
  plugins: [],
} satisfies Config;