import {
  Avatar,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
} from "@chakra-ui/react";
import { Outlet, useNavigate } from "react-router-dom";
import { ColorModeButton } from "../components/ui/ColorModeButton";
import { toaster } from "../components/ui/chakra-base/toaster-instance";
import { useAuthStore } from "../stores/auth.store";

export function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    toaster.create({
      title: "Sesión cerrada",
      description: "Vuelve pronto",
      type: "success",
    });
    navigate("/login", { replace: true });
  };

  return (
    <Box bg="bg" minH="100vh">
      <Box
        as="header"
        bg="bg.panel"
        borderBottomColor="border"
        borderBottomWidth="1px"
        position="sticky"
        top="0"
        zIndex="1"
      >
        <Flex
          align="center"
          gap="3"
          maxW="6xl"
          mx="auto"
          px="4"
          py="3"
        >
          <Flex align="center" gap="2">
            <Box
              alignItems="center"
              bg="brand.solid"
              borderRadius="lg"
              color="brand.contrast"
              display="flex"
              fontWeight="bold"
              h="9"
              justifyContent="center"
              w="9"
            >
              E
            </Box>
            <Heading color="fg" size="md">
              EVE
            </Heading>
          </Flex>

          <Box flex="1" />

          <ColorModeButton />

          <Flex align="center" display={{ base: "none", md: "flex" }} gap="2">
            <Avatar.Root bg="brand.solid" color="brand.contrast" size="sm">
              <Avatar.Fallback name={user?.name} />
            </Avatar.Root>
            <Box textAlign="left">
              <Text color="fg" fontSize="sm" fontWeight="medium">
                {user?.name ?? "Usuario"}
              </Text>
              <Text color="fg.muted" fontSize="xs">
                {user?.email ?? "Sin correo"}
              </Text>
            </Box>
          </Flex>

          <Button
            colorPalette="brand"
            onClick={handleLogout}
            size="sm"
            variant="outline"
          >
            Salir
          </Button>
        </Flex>
      </Box>

      <Container maxW="6xl" py="8">
        <Outlet />
      </Container>
    </Box>
  );
}
