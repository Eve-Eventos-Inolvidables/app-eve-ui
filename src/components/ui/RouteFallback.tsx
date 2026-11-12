import { Center, Spinner, Stack, Text } from "@chakra-ui/react";

export function RouteFallback() {
  return (
    <Center minH="50vh" role="status" aria-live="polite">
      <Stack align="center" gap="3">
        <Spinner color="brand.solid" size="lg" />
        <Text color="fg.muted" fontSize="sm">
          Cargando…
        </Text>
      </Stack>
    </Center>
  );
}
