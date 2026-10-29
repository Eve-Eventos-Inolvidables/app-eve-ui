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
import {LogOut, Ticket} from 'lucide-react'
export function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    toaster.create({
      title: "Sesión cerrada",
      description: "Vuelva pronto",
      type: "success",
    });
    navigate("/login", { replace: true });
  };

  return (
    <Box bg="bg" minH="100vh">
      <Box
        as="header"
        bg="bg.header"
        borderBottomColor="border.header"
        borderBottomWidth="1px"
        position="sticky"
        style={{
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
        top="0"
        zIndex="10"
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
              display="flex"
              fontWeight="bold"
              h="9"
              justifyContent="center"
              w="9"
            >
              <Ticket  color="white"/>
            </Box>
            <Heading color="fg.header" size="md">
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
              <Text color="fg.header" fontSize="sm" fontWeight="medium">
                {user?.name ?? "Usuario"}
              </Text>
              <Text color="fg.headerMuted" fontSize="xs">
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
           <LogOut /> Cerrar sesión
          </Button>
        </Flex>
      </Box>

      <Container maxW="6xl" py="8">
        <Outlet />
      </Container>
    </Box>
  );
}