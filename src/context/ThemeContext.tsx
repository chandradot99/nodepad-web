import { createContext, useContext, useEffect, useState } from 'react'
type Theme = 'light' | 'dark'
interface ThemeCtx { theme: Theme; toggleTheme: () => void }
const ThemeContext = createContext<ThemeCtx>({ theme: 'dark', toggleTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const s = localStorage.getItem('theme') as Theme | null
    if (s === 'light' || s === 'dark') return s
    return 'dark'
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme: () => setTheme(t => t === 'dark' ? 'light' : 'dark') }}>
      {children}
    </ThemeContext.Provider>
  )
}
export const useTheme = () => useContext(ThemeContext)
