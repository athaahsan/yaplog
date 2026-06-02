import { useEffect } from 'react'

const fontStacks = {
  default: "'Geist Variable', sans-serif",
  serif: "'Lora', serif",
  mono: "'Space Mono', monospace",
}

function applyTheme(theme) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const shouldUseDark = theme === 'dark' || (theme === 'system' && prefersDark)

  document.documentElement.classList.toggle('dark', shouldUseDark)
  document.documentElement.style.colorScheme = shouldUseDark ? 'dark' : 'light'
}

function applyFont(font) {
  document.documentElement.style.setProperty(
    '--app-font-family',
    fontStacks[font] || fontStacks.default,
  )
}

export function useAppearance({ font, theme }) {
  useEffect(() => {
    applyTheme(theme)

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        applyTheme('system')
      }
    }

    media.addEventListener('change', handleSystemThemeChange)
    return () => media.removeEventListener('change', handleSystemThemeChange)
  }, [theme])

  useEffect(() => {
    applyFont(font)
  }, [font])
}
