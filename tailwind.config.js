/** @type {import('tailwindcss').Config} */
// Tema grigio/nero coordinato con la barra laterale
const grafite = {
  50: '#F5F5F5',
  100: '#E5E5E5',
  200: '#D4D4D4',
  300: '#A3A3A3',
  400: '#737373',
  500: '#262626',
  600: '#171717',
  700: '#171717',
  800: '#0A0A0A',
  900: '#0A0A0A',
  950: '#1F1F1F',
};
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Ink Neutrals (Datum v2)
        ink: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        signal: grafite,
        gray: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#3A3A3A',
          800: '#262626',
          900: '#1A1A1A',
        },
        blue: grafite,
        sky: grafite,
        indigo: grafite,
        // Topographic Teal (Secondary/Success)
        topo: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#0F766E',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        // Feedback Colors
        success: {
          50: '#F0FDFA',
          500: '#0F766E',
          600: '#0D9488',
        },
        error: {
          50: '#FEF2F2',
          500: '#DC2626',
          600: '#B91C1C',
        },
        warning: {
          50: '#FFFBEB',
          500: '#D97706',
          600: '#B45309',
        },
        info: {
          50: '#F5F5F5',
          500: '#262626',
          600: '#171717',
        },
        // Legacy sidebar colors (maintain compatibility)
        sidebar: {
          background: '#171717',
          border: '#262626',
          text: '#D4D4D4',
          textActive: '#FAFAFA',
          hover: '#262626',
        },
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        body: ['IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.07)',
        'lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'slide-in': 'slideIn 0.15s ease-out',
        'slide-out': 'slideOut 0.15s ease-in',
        'fade-in': 'fadeIn 0.15s ease-out',
        'fade-out': 'fadeOut 0.15s ease-in',
        'fade-in-down': 'fadeInDown 0.15s ease-out',
        'fade-out-up': 'fadeOutUp 0.15s ease-in',
        'scale-in': 'scaleIn 0.2s ease-out',
        'scale-out': 'scaleOut 0.15s ease-in',
        'slide-in-right': 'slideInRight 0.15s ease-out',
        'slide-out-right': 'slideOutRight 0.15s ease-in',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        fadeInDown: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(-8px)',
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        fadeOutUp: {
          '0%': { 
            opacity: '1',
            transform: 'translateY(0)',
          },
          '100%': { 
            opacity: '0',
            transform: 'translateY(-8px)',
          },
        },
        scaleIn: {
          '0%': { 
            opacity: '0',
            transform: 'scale(0.95)',
          },
          '100%': { 
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        scaleOut: {
          '0%': { 
            opacity: '1',
            transform: 'scale(1)',
          },
          '100%': { 
            opacity: '0',
            transform: 'scale(0.95)',
          },
        },
        slideInRight: {
          '0%': { 
            opacity: '0',
            transform: 'translateX(100%)',
          },
          '100%': { 
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        slideOutRight: {
          '0%': { 
            opacity: '1',
            transform: 'translateX(0)',
          },
          '100%': { 
            opacity: '0',
            transform: 'translateX(100%)',
          },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
      },
      transitionTimingFunction: {
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
      },
      maxWidth: {
        'content': '1200px',
      },
      width: {
        'sidebar': '270px',
        'sidebar-collapsed': '64px',
        'topbar': '48px',
      },
      height: {
        'topbar': '48px',
      },
    },
  },
  plugins: [],
}
