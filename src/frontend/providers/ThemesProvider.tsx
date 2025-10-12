import { createContext, type ReactNode, useCallback } from "react";
import type { Themes } from "~/constants";
import { useLocalStorageZustand } from "~/hooks/use-zustand";

export interface ThemeContextType {
	themeName: Themes | null;
	setTheme: (theme: Themes) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
	themeName: null,
	setTheme: () => {},
});

export const ThemesProvider = ({ children }: { children: ReactNode }) => {
	const { themeName, setThemeName } = useLocalStorageZustand();

	const setTheme = useCallback(
		(name: Themes | null) => {
			setThemeName(name);
		},
		[setThemeName],
	);

	return (
		<ThemeContext.Provider value={{ themeName, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
};
