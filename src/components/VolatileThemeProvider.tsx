import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Preference = "light" | "dark" | "system";
interface ThemeValue { theme: Preference; resolvedTheme: "light" | "dark"; setTheme: (theme: string) => void; }
const ThemeContext = createContext<ThemeValue>({
  theme: "system", resolvedTheme: "light", setTheme: () => {},
});

/**
 * Volatile, privacy-first theme state. Never writes localStorage or cookies.
 * Use authenticated server preferences if persistence across visits is needed.
 */
export function ThemeProvider({ children, defaultTheme = "light" }: {
  children: ReactNode; defaultTheme?: Preference;
}) {
  const [theme,setThemeState] = useState<Preference>(defaultTheme);
  const [systemDark,setSystemDark] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setSystemDark(query.matches);
    sync();
    query.addEventListener("change",sync);
    return () => query.removeEventListener("change",sync);
  },[]);
  const resolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme;
  useEffect(() => {
    document.documentElement.classList.toggle("dark",resolvedTheme === "dark");
    document.documentElement.style.colorScheme = resolvedTheme;
  },[resolvedTheme]);
  const value = useMemo<ThemeValue>(() => ({
    theme,resolvedTheme,
    setTheme: value => {
      if (value === "light" || value === "dark" || value === "system") setThemeState(value);
    },
  }),[theme,resolvedTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
