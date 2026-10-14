/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        // 🎯 BLEU SOFTAPP - Principal
        brand: '#2563eb',
        
        // 🔶 ORANGE - Accents et alertes
        accent: '#f5a623',
        
        // 🎨 Palette complète de couleurs
        primary: {
          50: '#f0f6ff',
          100: '#e0ecff',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#1e3a8a',
          950: '#172554',
        },
        
        // Palette de gris
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },

        // Sidebar
        sidebar: {
          DEFAULT: 'rgb(26,38,52)',
          hover: 'rgb(34,48,65)',
          active: '#4a90d9',
          border: 'rgba(255,255,255,.07)',
          muted: 'rgba(255,255,255,.38)',
          text: 'rgba(255,255,255,.80)',
        },

        // Modules
        softdocs: {
          DEFAULT: '#2563eb',
          light: '#eff6ff',
          dark: '#1e3a8a',
          glow: 'rgba(37,99,235,.45)',
        },
        softlibrary: {
          DEFAULT: '#0891b2',
          light: '#ecfeff',
          dark: '#0c4a6e',
          glow: 'rgba(8,145,178,.45)',
        },
        softepaiement: {
          DEFAULT: '#7c3aed',
          light: '#f5f3ff',
          dark: '#4c1d95',
          glow: 'rgba(124,58,237,.45)',
        },
        'ss-primary': 'var(--ss-primary)',
        'ss-primary-hover': 'var(--ss-primary-hover)',

        softsign: {
          DEFAULT: '#0b1f3a',
          light: '#e0f2fe',
          dark: '#07162b',
          blue: '#0284c7',
          glow: 'rgba(14,165,233,.28)',
        },

        // Surface & Surface variants
        surface: {
          DEFAULT: '#ffffff',
          alt: '#f8fafc',
          muted: '#f1f5f9',
          bg: '#f4f6f9',
        },

        // États
        success: '#28a745',
        warning: '#f5a623',
        danger: '#e03e3e',
        info: '#17a2b8',
        
        // Confidentiel
        confid: '#9b59b6',
      },

      // Espacements
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '48px',
        '4xl': '64px',
      },

      // Rayons des coins
      borderRadius: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
      },

      // Ombres
      boxShadow: {
        xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        base: '0 4px 6px rgba(0, 0, 0, 0.1)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.15)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.2)',
        '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
        card: '0 4px 6px rgba(0, 0, 0, 0.1)',
        elevate: '0 10px 25px rgba(0, 0, 0, 0.15)',
        inset: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
      },

      // Polices
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "'DM Sans'", "'Inter'", 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },

      fontSize: {
        xs: ['12px', { lineHeight: '1.5' }],
        sm: ['13px', { lineHeight: '1.5' }],
        base: ['14px', { lineHeight: '1.5' }],
        lg: ['16px', { lineHeight: '1.6' }],
        xl: ['18px', { lineHeight: '1.6' }],
        '2xl': ['20px', { lineHeight: '1.6' }],
        '3xl': ['24px', { lineHeight: '1.4' }],
        '4xl': ['32px', { lineHeight: '1.2' }],
        '5xl': ['36px', { lineHeight: '1' }],
      },

      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
        black: 900,
      },

      // Animations et transitions
      animation: {
        'fade-in': 'fadeIn .5s ease-out both',
        'slide-in': 'slideIn .4s ease-out both',
        'slide-up': 'slideUp .5s ease-out both',
        'float': 'float 6s ease-in-out infinite alternate',
        'center-pulse': 'centerPulse 3.5s ease-in-out infinite',
        'ring-pulse': 'ringPulse .8s ease-in-out infinite alternate',
        'orb1': 'orb1 9s ease-in-out infinite',
        'orb2': 'orb2 11s ease-in-out infinite',
        'pulse-dot': 'pulseDot 2s ease infinite',
      },

      keyframes: {
        fadeIn: { 
          from: { opacity: '0', transform: 'translateY(8px)' }, 
          to: { opacity: '1', transform: 'none' } 
        },
        slideIn: { 
          from: { opacity: '0', transform: 'translateX(-10px)' }, 
          to: { opacity: '1', transform: 'none' } 
        },
        slideUp: { 
          from: { opacity: '0', transform: 'translateY(24px)' }, 
          to: { opacity: '1', transform: 'translateY(0)' } 
        },
        float: { 
          '0%': { transform: 'translateY(0) scale(1)' }, 
          '100%': { transform: 'translateY(-10px) scale(1.05)' } 
        },
        centerPulse: { 
          '0%,100%': { transform: 'scale(1)', opacity: '.7' }, 
          '50%': { transform: 'scale(1.15)', opacity: '1' } 
        },
        ringPulse: { 
          from: { opacity: '.5', transform: 'scale(1)' }, 
          to: { opacity: '1', transform: 'scale(1.04)' } 
        },
        orb1: { 
          '0%,100%': { transform: 'translate(0,0) scale(1)' }, 
          '50%': { transform: 'translate(-50px,40px) scale(1.06)' } 
        },
        orb2: { 
          '0%,100%': { transform: 'translate(0,0)' }, 
          '50%': { transform: 'translate(40px,-30px)' } 
        },
        pulseDot: { 
          '0%,100%': { opacity: '1', transform: 'scale(1)' }, 
          '50%': { opacity: '.35', transform: 'scale(1.2)' } 
        },
      },

      // Transitions
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '350ms',
      },

      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
      },

      // Z-index
      zIndex: {
        hide: '-1',
        base: '0',
        dropdown: '1000',
        sticky: '1010',
        fixed: '1020',
        modal: '1030',
        popover: '1040',
        tooltip: '1050',
        notification: '1060',
      },
    },
  },
};
