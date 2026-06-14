export interface ReaderSettings {
  dark: boolean
  fontScale: number
  twoPage: boolean
}

export const DEFAULT_SETTINGS: ReaderSettings = {
  dark: false,
  fontScale: 100,
  twoPage: true,
}

export const COLORS = {
  bg: '#F4ECD8',
  bgGradient: '#F4ECD8', // Thay bằng nền kem phẳng theo thiết kế Apple để không bị cháy sáng
  pageBg: '#FBF6E6',
  text: '#2B1F14',
  muted: '#5C4A38',
  accent: '#7A2E2E',
  accentLight: '#C26060',
  border: 'rgba(122,46,46,.15)',
  pillBg: '#E8DCC0',
  pillHover: '#DCCFB0',
}

export const DARK_COLORS = {
  bg: '#15110d',
  bgGradient: '#15110d', // Bỏ ánh sáng radial để mặt kính không bị nhòe màu
  pageBg: '#1a1611',
  text: '#d8c9a8',
  muted: '#a8967a',
  accent: '#d4937e',
  accentLight: '#b87560',
  border: 'rgba(216,201,168,.15)',
  pillBg: 'rgba(255,255,255,.05)',
  pillHover: 'rgba(255,255,255,.08)',
}

export const SERIF = "'Literata', 'Lora', 'Cambria', 'Times New Roman', Georgia, serif"
export const SANS = "'Inter', -apple-system, 'Segoe UI', 'Noto Sans', sans-serif"

export const SETTINGS_KEY = 'ntqs-reader-settings-v3'
