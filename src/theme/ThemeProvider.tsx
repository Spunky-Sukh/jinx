import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Mode = "dark" | "light";
interface ThemeCtx {
  mode: Mode;
  toggle: () => void;
  setMode: (m: Mode) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);
const KEY = "jinx-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(() => {
    const saved = localStorage.getItem(KEY) as Mode | null;
    return saved ?? "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    localStorage.setItem(KEY, mode);
  }, [mode]);

  return (
    <Ctx.Provider
      value={{ mode, setMode, toggle: () => setMode((m) => (m === "dark" ? "light" : "dark")) }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
