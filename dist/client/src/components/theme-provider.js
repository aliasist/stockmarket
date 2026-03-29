import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState, } from "react";
const THEME_STORAGE_KEY = "market-pulse-theme";
const ThemeContext = createContext(null);
function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
}
function getInitialTheme() {
    if (typeof window === "undefined") {
        return "dark";
    }
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === "normal" || storedTheme === "dark" ? storedTheme : "dark";
}
export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(getInitialTheme);
    useEffect(() => {
        applyTheme(theme);
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);
    const value = useMemo(() => ({
        theme,
        setTheme: setThemeState,
        toggleTheme: () => setThemeState((current) => (current === "dark" ? "normal" : "dark")),
    }), [theme]);
    return _jsx(ThemeContext.Provider, { value: value, children: children });
}
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
