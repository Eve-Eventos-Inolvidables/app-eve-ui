import { Box, Center } from "@chakra-ui/react";
import type { PropsWithChildren } from "react";
import { ColorModeButton } from "../components/ui/ColorModeButton";

export function AuthLayout({ children }: PropsWithChildren) {
  return (
    <Box bg="bg" minH="100vh" position="relative">
      <Box position="absolute" right={{ base: "4", md: "6" }} top={{ base: "4", md: "6" }} zIndex="1">
        <ColorModeButton />
      </Box>

      <Center minH="100vh" px="4" py="16">
        <Box maxW="md" w="full">
          {children}
        </Box>
      </Center>
    </Box>
  );
}
