import { useCallback, useEffect, useState } from "react";
import type { Theme } from "./types";

export function useTheme() {
    const [theme, setTheme] = useState<Theme>("light");

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        return () => {
            delete document.documentElement.dataset.theme;
        };
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme((current) => current === "light" ? "dark" : "light");
    }, []);

    return { theme, toggleTheme };
}
