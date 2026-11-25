import { Badge } from "@chakra-ui/react";
import { useState } from "react";
import { getUiNode } from "../../utils/uiNode";

const NODE_PALETTE: Record<string, string> = {
  Tom1: "blue",
  Tom2: "purple",
};

export function UiNodeBadge() {
  const [node] = useState(getUiNode);

  return (
    <Badge
      colorPalette={NODE_PALETTE[node] ?? "gray"}
      flexShrink={0}
      fontFamily="mono"
      title={`Servidor actual: ${node}`}
      variant="subtle"
    >
      {node}
    </Badge>
  );
}
