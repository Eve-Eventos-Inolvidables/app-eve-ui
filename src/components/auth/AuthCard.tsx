import { Box, Card, Heading, Stack, Text } from "@chakra-ui/react";
import type { PropsWithChildren, ReactNode } from "react";

interface AuthCardProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  footer?: ReactNode;
}

export function AuthCard({ title, subtitle, footer, children }: AuthCardProps) {
  return (
    <Card.Root
      bg="bg.panel"
      borderColor="border"
      borderWidth="1px"
      shadow="xl"
      w="full"
    >
      <Card.Header textAlign="center">
        <Stack align="center" gap="3" mt="2">
                   <Box>
            <Heading color="fg" size="2xl" fontWeight="bold">
              {title}
            </Heading>
            <Text color="fg.muted" fontSize="sm" mt="1">
              {subtitle}
            </Text>
          </Box>
        </Stack>
      </Card.Header>

      <Card.Body>
        <Stack gap="5">{children}</Stack>
      </Card.Body>

      {footer && (
        <Card.Footer justifyContent="center">{footer}</Card.Footer>
      )}
    </Card.Root>
  );
}
