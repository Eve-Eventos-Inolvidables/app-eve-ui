import { Button } from "@chakra-ui/react";
import { FiMoon, FiSun } from "react-icons/fi";
import { useColorMode } from "../../hooks/useColorMode";

export function ColorModeButton() {
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === "dark";

  return (
    <Button
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      colorPalette="brand"
      onClick={toggleColorMode}
      size="sm"
      variant="ghost"
    >
      {isDark ? <FiSun /> : <FiMoon />}
      {isDark ? "Claro" : "Oscuro"}
    </Button>
  );
}
