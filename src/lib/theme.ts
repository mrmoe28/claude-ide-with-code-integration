export const cursorTheme = {
  colors: {
    dark: {
      background: {
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
    light: {
      background: {
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
    },
  },
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
  },
  radius: {
    sm: '0.25rem',   // 4px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
  },
  typography: {
    fontFamily: {
      mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'monospace'],
      sans: ['SF Pro Display', 'Segoe UI', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
    },
  },
  transitions: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },
}