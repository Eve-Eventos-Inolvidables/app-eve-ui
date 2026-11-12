import { Button } from "@chakra-ui/react";
import { Moon, Sun } from "lucide-react";
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
      {isDark ? <Sun /> : <Moon />}
      {/* {isDark ? "Claro" : "Oscuro"} */}
    </Button>
  );
}
