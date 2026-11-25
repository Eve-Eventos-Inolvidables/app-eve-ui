import { Badge } from "@chakra-ui/react";
import { useState } from "react";
import { getUiNode } from "../../utils/uiNode";

const NODE_PALETTE: Record<string, string> = {
  "UI-0": "blue",
  "UI-1": "purple",
};

export function UiNodeBadge() {
  const [node] = useState(getUiNode);

  return (
    <Badge
      colorPalette={NODE_PALETTE[node] ?? "gray"}
      flexShrink={0}
      fontFamily="mono"
      title={`Interfaz actual: ${node}`}
      variant="subtle"
    >
      {node}
    </Badge>
  );
}
