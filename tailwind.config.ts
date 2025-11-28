import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Override Tailwind's default border color
      borderColor: {
        DEFAULT: 'transparent',
      },
      // Material Design 3 Color Tokens
      colors: {
        // Primary colors
        primary: {
          DEFAULT: "rgb(var(--md-sys-color-primary) / <alpha-value>)",
          container: "rgb(var(--md-sys-color-primary-container) / <alpha-value>)",
          fixed: "rgb(var(--md-sys-color-primary-fixed) / <alpha-value>)",
          'fixed-dim': "rgb(var(--md-sys-color-primary-fixed-dim) / <alpha-value>)",
        },
        'on-primary': {
          DEFAULT: "rgb(var(--md-sys-color-on-primary) / <alpha-value>)",
          container: "rgb(var(--md-sys-color-on-primary-container) / <alpha-value>)",
          fixed: "rgb(var(--md-sys-color-on-primary-fixed) / <alpha-value>)",
          'fixed-variant': "rgb(var(--md-sys-color-on-primary-fixed-variant) / <alpha-value>)",
        },
        // Secondary colors
        secondary: {
          DEFAULT: "rgb(var(--md-sys-color-secondary) / <alpha-value>)",
          container: "rgb(var(--md-sys-color-secondary-container) / <alpha-value>)",
          fixed: "rgb(var(--md-sys-color-secondary-fixed) / <alpha-value>)",
          'fixed-dim': "rgb(var(--md-sys-color-secondary-fixed-dim) / <alpha-value>)",
        },
        'on-secondary': {
          DEFAULT: "rgb(var(--md-sys-color-on-secondary) / <alpha-value>)",
          container: "rgb(var(--md-sys-color-on-secondary-container) / <alpha-value>)",
          fixed: "rgb(var(--md-sys-color-on-secondary-fixed) / <alpha-value>)",
          'fixed-variant': "rgb(var(--md-sys-color-on-secondary-fixed-variant) / <alpha-value>)",
        },
        // Tertiary colors
        tertiary: {
          DEFAULT: "rgb(var(--md-sys-color-tertiary) / <alpha-value>)",
          container: "rgb(var(--md-sys-color-tertiary-container) / <alpha-value>)",
          fixed: "rgb(var(--md-sys-color-tertiary-fixed) / <alpha-value>)",
          'fixed-dim': "rgb(var(--md-sys-color-tertiary-fixed-dim) / <alpha-value>)",
        },
        'on-tertiary': {
          DEFAULT: "rgb(var(--md-sys-color-on-tertiary) / <alpha-value>)",
          container: "rgb(var(--md-sys-color-on-tertiary-container) / <alpha-value>)",
          fixed: "rgb(var(--md-sys-color-on-tertiary-fixed) / <alpha-value>)",
          'fixed-variant': "rgb(var(--md-sys-color-on-tertiary-fixed-variant) / <alpha-value>)",
        },
        // Error colors
        error: {
          DEFAULT: "rgb(var(--md-sys-color-error) / <alpha-value>)",
          container: "rgb(var(--md-sys-color-error-container) / <alpha-value>)",
        },
        'on-error': {
          DEFAULT: "rgb(var(--md-sys-color-on-error) / <alpha-value>)",
          container: "rgb(var(--md-sys-color-on-error-container) / <alpha-value>)",
        },
        // Surface colors
        surface: {
          DEFAULT: "rgb(var(--md-sys-color-surface) / <alpha-value>)",
          dim: "rgb(var(--md-sys-color-surface-dim) / <alpha-value>)",
          bright: "rgb(var(--md-sys-color-surface-bright) / <alpha-value>)",
          container: "rgb(var(--md-sys-color-surface-container) / <alpha-value>)",
          'container-low': "rgb(var(--md-sys-color-surface-container-low) / <alpha-value>)",
          'container-lowest': "rgb(var(--md-sys-color-surface-container-lowest) / <alpha-value>)",
          'container-high': "rgb(var(--md-sys-color-surface-container-high) / <alpha-value>)",
          'container-highest': "rgb(var(--md-sys-color-surface-container-highest) / <alpha-value>)",
          variant: "rgb(var(--md-sys-color-surface-variant) / <alpha-value>)",
        },
        'on-surface': {
          DEFAULT: "rgb(var(--md-sys-color-on-surface) / <alpha-value>)",
          variant: "rgb(var(--md-sys-color-on-surface-variant) / <alpha-value>)",
        },
        outline: {
          DEFAULT: "rgb(var(--md-sys-color-outline) / <alpha-value>)",
          variant: "rgb(var(--md-sys-color-outline-variant) / <alpha-value>)",
        },
        background: "rgb(var(--md-sys-color-background) / <alpha-value>)",
        'on-background': "rgb(var(--md-sys-color-on-background) / <alpha-value>)",
        'inverse-surface': "rgb(var(--md-sys-color-inverse-surface) / <alpha-value>)",
        'inverse-on-surface': "rgb(var(--md-sys-color-inverse-on-surface) / <alpha-value>)",
        'inverse-primary': "rgb(var(--md-sys-color-inverse-primary) / <alpha-value>)",
        scrim: "rgb(var(--md-sys-color-scrim) / <alpha-value>)",
        shadow: "rgb(var(--md-sys-color-shadow) / <alpha-value>)",
      },
      // Material Design 3 Typography Scale
      fontSize: {
        // Display
        'display-large': ['57px', { lineHeight: '64px', letterSpacing: '-0.25px', fontWeight: '400' }],
        'display-medium': ['45px', { lineHeight: '52px', letterSpacing: '0px', fontWeight: '400' }],
        'display-small': ['36px', { lineHeight: '44px', letterSpacing: '0px', fontWeight: '400' }],
        // Headline
        'headline-large': ['32px', { lineHeight: '40px', letterSpacing: '0px', fontWeight: '400' }],
        'headline-medium': ['28px', { lineHeight: '36px', letterSpacing: '0px', fontWeight: '400' }],
        'headline-small': ['24px', { lineHeight: '32px', letterSpacing: '0px', fontWeight: '400' }],
        // Title
        'title-large': ['22px', { lineHeight: '28px', letterSpacing: '0px', fontWeight: '400' }],
        'title-medium': ['16px', { lineHeight: '24px', letterSpacing: '0.15px', fontWeight: '500' }],
        'title-small': ['14px', { lineHeight: '20px', letterSpacing: '0.1px', fontWeight: '500' }],
        // Body
        'body-large': ['16px', { lineHeight: '24px', letterSpacing: '0.5px', fontWeight: '400' }],
        'body-medium': ['14px', { lineHeight: '20px', letterSpacing: '0.25px', fontWeight: '400' }],
        'body-small': ['12px', { lineHeight: '16px', letterSpacing: '0.4px', fontWeight: '400' }],
        // Label
        'label-large': ['14px', { lineHeight: '20px', letterSpacing: '0.1px', fontWeight: '500' }],
        'label-medium': ['12px', { lineHeight: '16px', letterSpacing: '0.5px', fontWeight: '500' }],
        'label-small': ['11px', { lineHeight: '16px', letterSpacing: '0.5px', fontWeight: '500' }],
      },
      // Material Design 3 Elevation (Box Shadows)
      boxShadow: {
        'md-level0': 'none',
        'md-level1': '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
        'md-level2': '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)',
        'md-level3': '0px 1px 3px 0px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)',
        'md-level4': '0px 2px 3px 0px rgba(0, 0, 0, 0.3), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)',
        'md-level5': '0px 4px 4px 0px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)',
      },
      // Material Design 3 Border Radius (Shape)
      borderRadius: {
        'none': '0px',
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '28px',
        'full': '9999px',
      },
      // Material Design 3 Motion (Easing)
      transitionTimingFunction: {
        'emphasized': 'cubic-bezier(0.2, 0, 0, 1)',
        'emphasized-decelerate': 'cubic-bezier(0.05, 0.7, 0.1, 1)',
        'emphasized-accelerate': 'cubic-bezier(0.3, 0, 0.8, 0.15)',
        'standard': 'cubic-bezier(0.2, 0, 0, 1)',
        'standard-decelerate': 'cubic-bezier(0, 0, 0, 1)',
        'standard-accelerate': 'cubic-bezier(0.3, 0, 1, 1)',
      },
      // Material Design 3 Duration
      transitionDuration: {
        'short1': '50ms',
        'short2': '100ms',
        'short3': '150ms',
        'short4': '200ms',
        'medium1': '250ms',
        'medium2': '300ms',
        'medium3': '350ms',
        'medium4': '400ms',
        'long1': '450ms',
        'long2': '500ms',
        'long3': '550ms',
        'long4': '600ms',
        'extra-long1': '700ms',
        'extra-long2': '800ms',
        'extra-long3': '900ms',
        'extra-long4': '1000ms',
      },
    },
  },
  plugins: [],
};
export default config;

