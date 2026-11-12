import { Box, Center, Stack, Text } from "@chakra-ui/react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = "No hay datos para mostrar",
  description,
}: EmptyStateProps) {
  return (
    <Center py="10">
      <Stack align="center" gap="2">
        <Box color="fg.muted">
          <Inbox size={28} />
        </Box>
        <Text color="fg" fontWeight="medium">
          {title}
        </Text>
        {description && (
          <Text color="fg.muted" fontSize="sm" textAlign="center">
            {description}
          </Text>
        )}
      </Stack>
    </Center>
  );
}
