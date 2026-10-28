import { Badge, Box, Card, Heading, Stack, Text } from "@chakra-ui/react";
import { useAuthStore } from "../stores/auth.store";

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  return (
    <Stack gap="8">
      {/* Encabezado de Bienvenida */}
      <Box bg="bg.panel" borderColor="border" borderWidth="1px" borderRadius="xl" p="6">
        <Heading color="fg" size="2xl">
          Hola, {user?.name ?? "Usuario"}
        </Heading>
        <Text color="fg.muted" mt="2">
          Tu sesión está activa. Desde aquí podrás gestionar tus eventos.
        </Text>
      </Box>

      {/* Tarjeta de Datos de la Cuenta */}
      <Card.Root
        bg="bg.panel"
        borderColor="border"
        borderWidth="1px"
        borderRadius="xl"
        shadow="sm"
      >
        <Card.Header pb="2">
          <Heading color="fg" size="md">
            Datos de la cuenta
          </Heading>
        </Card.Header>

        <Card.Body>
          <Stack gap="5">
            <Box>
              <Text color="fg.muted" fontSize="xs" fontWeight="semibold" textTransform="uppercase">
                Nombre
              </Text>
              <Text color="fg" fontSize="md" fontWeight="medium" mt="1">
                {user?.name ?? "Sin nombre"}
              </Text>
            </Box>

            <Box>
              <Text color="fg.muted" fontSize="xs" fontWeight="semibold" textTransform="uppercase">
                Correo electrónico
              </Text>
              <Text color="fg" fontSize="md" fontWeight="medium" mt="1">
                {user?.email ?? "Sin correo"}
              </Text>
            </Box>

            <Box>
              <Text color="fg.muted" fontSize="xs" fontWeight="semibold" textTransform="uppercase" mb="1.5">
                Rol
              </Text>
              <Badge colorPalette="brand" size="md" variant="subtle">
                {user?.roleName || "Sin rol"}
              </Badge>
            </Box>
          </Stack>
        </Card.Body>
      </Card.Root>
    </Stack>
  );
}