import { Badge, Box, Card, Heading, Stack, Text } from "@chakra-ui/react";
import { useAuthStore } from "../stores/auth.store";

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  return (
    <Stack gap="8">
      <Box>
        <Heading color="fg" size="2xl">
          Hola, {user?.name ?? "Usuario"}
        </Heading>
        <Text color="fg.muted" mt="2">
          Tu sesión está activa. Desde aquí podrás gestionar tus eventos.
        </Text>
      </Box>

      <Card.Root bg="bg.panel" borderColor="border" borderWidth="1px">
        <Card.Header>
          <Heading color="fg" size="md">
            Datos de la cuenta
          </Heading>
        </Card.Header>
        <Card.Body>
          <Stack gap="4">
            <Box>
              <Text color="fg.muted" fontSize="sm">
                Nombre
              </Text>
              <Text color="fg" fontWeight="medium">
                {user?.name ?? "Sin nombre"}
              </Text>
            </Box>

            <Box>
              <Text color="fg.muted" fontSize="sm">
                Correo electrónico
              </Text>
              <Text color="fg" fontWeight="medium">
                {user?.email ?? "Sin correo"}
              </Text>
            </Box>

            <Box>
              <Text color="fg.muted" fontSize="sm">
                Rol
              </Text>
              <Badge colorPalette="brand" variant="subtle">
                {user?.roleName || "Sin rol"}
              </Badge>
            </Box>
          </Stack>
        </Card.Body>
      </Card.Root>
    </Stack>
  );
}
