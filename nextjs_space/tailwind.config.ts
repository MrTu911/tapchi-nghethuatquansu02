import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    // lib chứa helper map status→class (submission-status.ts); phải scan để
    // Tailwind không purge các utility chỉ khai báo trong lib.
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Serif hiển thị cho tiêu đề (tạp chí học thuật). Body vẫn dùng system stack.
        // var(--font-serif) do next/font (Lora) cung cấp; có fallback serif chắc chắn.
        serif: ['var(--font-serif)', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        military: {
          '50': 'hsl(138 30% 95%)',
          '100': 'hsl(138 25% 85%)',
          '200': 'hsl(138 20% 75%)',
          '300': 'hsl(138 18% 65%)',
          '400': 'hsl(138 16% 50%)',
          '500': 'hsl(138 35% 35%)',
          '600': 'hsl(138 40% 28%)',
          '700': 'hsl(138 45% 22%)',
          '800': 'hsl(138 50% 16%)',
          '900': 'hsl(138 55% 12%)',
          '950': 'hsl(138 60% 8%)',
        },
        // NTQS brand — xanh quân sự #1E3924, vàng đồng #E5C86E
        brand: {
          DEFAULT: 'hsl(var(--brand))',
          foreground: 'hsl(var(--brand-foreground))',
        },
        gold: {
          DEFAULT: 'hsl(var(--gold))',
          foreground: 'hsl(var(--gold-foreground))',
        },
        // Nền body khu vực công khai (kem giấy ấm #F4EFE3) để card trắng nổi rõ
        paper: 'hsl(var(--paper))',
        // Thanh chrome đỏ tươi (header nav + footer) #C62828 và biến thể sâu hơn #A81E1E
        redbar: {
          DEFAULT: 'hsl(var(--redbar))',
          dark: 'hsl(var(--redbar-dark))',
        },
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
  ],
};
export default config;
