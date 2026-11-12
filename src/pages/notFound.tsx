import { Button, Center, Heading, Stack, Text } from "@chakra-ui/react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <Center minH="60vh" px="4">
      <Stack align="center" gap="4" maxW="md" textAlign="center">
        <Text color="brand.fg" fontSize="sm" fontWeight="semibold">
          ERROR 404
        </Text>
        <Heading color="fg" size="2xl">
          Página no encontrada
        </Heading>
        <Text color="fg.muted">
          La dirección que buscas no existe o fue movida.
        </Text>
        <Button asChild colorPalette="brand">
          <Link to="/dash">Volver al inicio</Link>
        </Button>
      </Stack>
    </Center>
  );
}
