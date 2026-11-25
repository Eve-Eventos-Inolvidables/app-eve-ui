import { Box, Center, Flex } from "@chakra-ui/react";
import type { PropsWithChildren } from "react";
import { ColorModeButton } from "../components/ui/ColorModeButton";
import { UiNodeBadge } from "../components/ui/UiNodeBadge";

export function AuthLayout({ children }: PropsWithChildren) {
  return (
    <Box bg="bg" minH="100vh" position="relative">
      <Flex
        align="center"
        gap="2"
        position="absolute"
        right={{ base: "4", md: "6" }}
        top={{ base: "4", md: "6" }}
        zIndex="1"
      >
        <UiNodeBadge />
        <ColorModeButton />
      </Flex>

      <Center minH="100vh" px="4" py="16">
        <Box maxW="md" w="full">
          {children}
        </Box>
      </Center>
    </Box>
  );
}
