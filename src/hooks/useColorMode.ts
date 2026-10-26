import { useTheme } from "next-themes";

export function useColorMode() {
  const { resolvedTheme, setTheme } = useTheme();
  const colorMode = resolvedTheme === "light" ? "light" : "dark";

  const setColorMode = (mode: "light" | "dark") => setTheme(mode);
  const toggleColorMode = () => setTheme(colorMode === "dark" ? "light" : "dark");

  return { colorMode, setColorMode, toggleColorMode };
}
